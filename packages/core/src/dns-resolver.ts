import dns from 'node:dns';
import { Resolver } from 'node:dns/promises';
import https from 'node:https';
import tls from 'node:tls';
import net from 'node:net';
import type { LookupOptions } from 'node:dns';

/**
 * Resilient three-tier DNS resolver designed to keep crawls running even
 * when the user's system DNS is broken — without asking the user to do
 * anything (no "restart Windows DNS Client", no "change your DNS server").
 *
 *   Tier 1: OS resolver (Node's `dns.lookup`)
 *           Fast path. Preserves `/etc/hosts`, VPN split-DNS, corporate
 *           internal zones. Only failure modes that escalate to Tier 2
 *           are clear DNS errors (EDESTRUCTION, ECONNREFUSED on port 53,
 *           ENOTFOUND, EAI_AGAIN, ETIMEOUT).
 *
 *   Tier 2: Direct UDP DNS via Node's `dns.Resolver`, configured with
 *           public servers (1.1.1.1, 1.0.0.1, 8.8.8.8, 9.9.9.9). This
 *           bypasses the local Windows "DNS Client" service that crashes
 *           with EDESTRUCTION on misconfigured boxes. Fails if the
 *           user's network/firewall blocks outbound UDP/53 (Pi-hole,
 *           AdGuard, restrictive corporate firewall, some ISPs).
 *
 *   Tier 3: DNS-over-HTTPS via raw `https.request` to IP literals
 *           (`https://1.1.1.1/dns-query`, `https://8.8.8.8/resolve`).
 *           Runs over HTTPS:443 — bypasses ALL port-53 blocking. Solves
 *           the chicken-and-egg "but how do you resolve dns.google
 *           without DNS?" problem by using IP literals + SNI override
 *           with checkServerIdentity. Ports 443 outbound are open
 *           virtually everywhere (otherwise the user couldn't browse
 *           the web at all).
 *
 * The cascade is automatic and transparent. Successful results are
 * cached for 5 min. When OS DNS fails 3+ times within 60 s, we mark it
 * globally unhealthy for 60 s and skip Tier 1 for every host — so a
 * sustained outage doesn't pay the per-host OS-failure latency tax.
 */

// 5-minute success cache matches what cacheable-lookup did. 15-second
// negative cache prevents tight retry loops from hammering Tier 3.
const CACHE_TTL_MS = 5 * 60 * 1000;
const ERROR_CACHE_TTL_MS = 15 * 1000;

const TIER1_TIMEOUT_MS = 4_000;
const TIER2_TIMEOUT_MS = 3_500;
const TIER3_TIMEOUT_MS = 4_000;

const OS_UNHEALTHY_TTL_MS = 60_000;
const OS_UNHEALTHY_THRESHOLD = 3;

const PUBLIC_DNS_SERVERS = ['1.1.1.1', '1.0.0.1', '8.8.8.8', '9.9.9.9'];

// IP literal → SNI hostname mapping. Cert validation goes against the
// SNI name, not the connect IP, via a custom checkServerIdentity. Order
// is the failover order. Cloudflare first because its DoH JSON API is
// the most stable and lowest-latency from most consumer networks.
const DOH_PROVIDERS: ReadonlyArray<{
  ip: string;
  port: number;
  path: string;
  servername: string;
  label: string;
}> = [
  {
    ip: '1.1.1.1',
    port: 443,
    path: '/dns-query',
    servername: 'cloudflare-dns.com',
    label: 'cloudflare',
  },
  {
    ip: '8.8.8.8',
    port: 443,
    path: '/resolve',
    servername: 'dns.google',
    label: 'google',
  },
  {
    ip: '1.0.0.1',
    port: 443,
    path: '/dns-query',
    servername: 'cloudflare-dns.com',
    label: 'cloudflare-secondary',
  },
];

const DNS_FAILURE_PATTERNS =
  /EDESTRUCTION|EAI_AGAIN|ENODATA|ESERVFAIL|EREFUSED|ENOTIMP|ENONAME|ETIMEDOUT|ETIMEOUT|ECONNREFUSED|EAI_NODATA|ENOTFOUND/i;

export type DnsTier = 'os' | 'public-udp' | 'doh';

export interface DnsResolverEvent {
  hostname: string;
  tier: DnsTier;
  outcome: 'success' | 'failure';
  /** ms from cascade start (for the whole hostname, not just this tier) */
  durationMs: number;
  /** Detail set when outcome === 'failure' */
  error?: string;
  /** For DoH/UDP, which provider answered */
  via?: string;
}

export type DnsResolverHook = (event: DnsResolverEvent) => void;

interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

interface CacheEntry {
  addresses: ResolvedAddress[];
  expires: number;
  /** Whether this is a negative-cache entry (no resolution found) */
  negative?: boolean;
}

const cache = new Map<string, CacheEntry>();

let osDnsUnhealthyUntil = 0;
let osFailureBucket: number[] = []; // timestamps of recent OS lookup failures

function recordOsFailure(now: number): void {
  osFailureBucket.push(now);
  // Drop entries older than the unhealthy TTL window so we measure rate
  // over the most recent minute, not lifetime.
  const cutoff = now - OS_UNHEALTHY_TTL_MS;
  if (osFailureBucket[0] !== undefined && osFailureBucket[0] < cutoff) {
    osFailureBucket = osFailureBucket.filter((ts) => ts >= cutoff);
  }
  if (osFailureBucket.length >= OS_UNHEALTHY_THRESHOLD) {
    osDnsUnhealthyUntil = now + OS_UNHEALTHY_TTL_MS;
  }
}

function isOsHealthy(now: number): boolean {
  return now >= osDnsUnhealthyUntil;
}

/**
 * For unit tests / explicit cache invalidation. Not exported on the
 * package barrel — internal only.
 */
export function _clearDnsCacheForTests(): void {
  cache.clear();
  osFailureBucket = [];
  osDnsUnhealthyUntil = 0;
}

// Hot-swappable global hook. The lookup function is installed into
// undici exactly once per process (in initHttpClient), but each new
// Crawler instance wants to receive its own DNS-tier diagnostics.
// This module-level mutable hook lets a Crawler register its emitter
// for the duration of its run without rebuilding the dispatcher.
let activeHook: DnsResolverHook | null = null;
export function setActiveDnsHook(hook: DnsResolverHook | null): void {
  activeHook = hook;
}

function isLiteralIp(host: string): { address: string; family: 4 | 6 } | null {
  if (net.isIPv4(host)) return { address: host, family: 4 };
  if (net.isIPv6(host)) return { address: host, family: 6 };
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier 1 — OS resolver
// ─────────────────────────────────────────────────────────────────────────────

function tier1OsLookup(hostname: string): Promise<ResolvedAddress[]> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const to = setTimeout(() => {
      if (settled) return;
      settled = true;
      const e: NodeJS.ErrnoException = new Error('OS DNS lookup timeout');
      e.code = 'ETIMEDOUT';
      reject(e);
    }, TIER1_TIMEOUT_MS);
    dns.lookup(
      hostname,
      { all: true, family: 0, verbatim: true },
      (err, addresses) => {
        if (settled) return;
        settled = true;
        clearTimeout(to);
        if (err) {
          reject(err);
          return;
        }
        const out: ResolvedAddress[] = [];
        for (const a of addresses) {
          if (a.family === 4 || a.family === 6) {
            out.push({ address: a.address, family: a.family });
          }
        }
        resolve(out);
      },
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier 2 — Direct UDP/53 to public DNS servers via Node's Resolver
// ─────────────────────────────────────────────────────────────────────────────

const publicResolver = new Resolver({ timeout: TIER2_TIMEOUT_MS, tries: 2 });
publicResolver.setServers(PUBLIC_DNS_SERVERS);

async function tier2PublicUdp(hostname: string): Promise<{ addresses: ResolvedAddress[]; via: string }> {
  // Race A and AAAA in parallel — but accept partial success. A site
  // with only A records shouldn't fail the lookup just because AAAA
  // returned NODATA.
  const [v4, v6] = await Promise.allSettled([
    publicResolver.resolve4(hostname),
    publicResolver.resolve6(hostname),
  ]);
  const out: ResolvedAddress[] = [];
  if (v4.status === 'fulfilled') {
    for (const a of v4.value) out.push({ address: a, family: 4 });
  }
  if (v6.status === 'fulfilled') {
    for (const a of v6.value) out.push({ address: a, family: 6 });
  }
  if (out.length === 0) {
    const reason = [
      v4.status === 'rejected' ? `A: ${(v4.reason as Error).message}` : null,
      v6.status === 'rejected' ? `AAAA: ${(v6.reason as Error).message}` : null,
    ]
      .filter(Boolean)
      .join('; ');
    const e: NodeJS.ErrnoException = new Error(
      reason || `No A/AAAA records via public DNS servers`,
    );
    e.code = 'ENOTFOUND';
    throw e;
  }
  return { addresses: out, via: PUBLIC_DNS_SERVERS.join(',') };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier 3 — DNS-over-HTTPS via IP literal (port 443)
// ─────────────────────────────────────────────────────────────────────────────

interface DohJsonResponse {
  Status?: number;
  Answer?: { name: string; type: number; TTL?: number; data: string }[];
}

function fetchDohJson(
  provider: { ip: string; port: number; path: string; servername: string },
  hostname: string,
  recordType: 'A' | 'AAAA',
): Promise<string[]> {
  const typeNum = recordType === 'A' ? 1 : 28;
  const path = `${provider.path}?name=${encodeURIComponent(hostname)}&type=${recordType}`;
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: provider.ip, // IP literal — no DNS resolution required
        port: provider.port,
        path,
        method: 'GET',
        headers: {
          accept: 'application/dns-json',
          host: provider.servername,
        },
        servername: provider.servername,
        // Default checkServerIdentity validates against `host`, which is
        // an IP literal here — it would reject the cloudflare-dns.com
        // cert. Override to validate against the SNI name instead, which
        // is the standard pattern for "connect by IP, talk SNI".
        checkServerIdentity: (_h, cert) =>
          tls.checkServerIdentity(provider.servername, cert),
        timeout: TIER3_TIMEOUT_MS,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          const e: NodeJS.ErrnoException = new Error(
            `DoH HTTP ${res.statusCode ?? '?'} from ${provider.servername}`,
          );
          e.code = 'EDOH_HTTP';
          reject(e);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c as Buffer));
        res.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString('utf8');
            const data = JSON.parse(body) as DohJsonResponse;
            if (typeof data.Status === 'number' && data.Status !== 0 && data.Status !== 3) {
              // Status 3 = NXDOMAIN — surface as empty rather than throw,
              // because that's a legitimate "host doesn't exist" signal.
              const e: NodeJS.ErrnoException = new Error(
                `DoH DNS Status ${data.Status} from ${provider.servername}`,
              );
              e.code = 'EDOH_STATUS';
              reject(e);
              return;
            }
            const answers = data.Answer ?? [];
            resolve(answers.filter((a) => a.type === typeNum).map((a) => a.data));
          } catch (err) {
            reject(err as Error);
          }
        });
        res.on('error', reject);
      },
    );
    req.on('timeout', () => {
      req.destroy(
        Object.assign(new Error(`DoH request timeout to ${provider.servername}`), {
          code: 'ETIMEDOUT',
        }),
      );
    });
    req.on('error', reject);
    req.end();
  });
}

async function tier3Doh(
  hostname: string,
): Promise<{ addresses: ResolvedAddress[]; via: string }> {
  let lastErr: Error | null = null;
  for (const provider of DOH_PROVIDERS) {
    try {
      const [a, aaaa] = await Promise.allSettled([
        fetchDohJson(provider, hostname, 'A'),
        fetchDohJson(provider, hostname, 'AAAA'),
      ]);
      const out: ResolvedAddress[] = [];
      if (a.status === 'fulfilled') {
        for (const ip of a.value) out.push({ address: ip, family: 4 });
      }
      if (aaaa.status === 'fulfilled') {
        for (const ip of aaaa.value) out.push({ address: ip, family: 6 });
      }
      if (out.length > 0) {
        return { addresses: out, via: provider.label };
      }
      // Both queries returned empty/NXDOMAIN — try the next provider in
      // case this one is intermittently broken; if all return empty we
      // throw ENOTFOUND below.
      if (a.status === 'rejected') lastErr = a.reason as Error;
      if (aaaa.status === 'rejected' && !lastErr) lastErr = aaaa.reason as Error;
    } catch (err) {
      lastErr = err as Error;
      // try next provider
    }
  }
  const e: NodeJS.ErrnoException = new Error(
    `All DoH providers failed${lastErr ? `: ${lastErr.message}` : ''}`,
  );
  e.code = 'ENOTFOUND';
  throw e;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cascade orchestrator
// ─────────────────────────────────────────────────────────────────────────────

async function resolveCascade(
  hostname: string,
  hook: DnsResolverHook | undefined,
): Promise<ResolvedAddress[]> {
  const t0 = Date.now();

  // ── Tier 1 ────────────────────────────────────────────────────────────────
  const skipTier1 = !isOsHealthy(t0);
  if (!skipTier1) {
    try {
      const r = await tier1OsLookup(hostname);
      if (r.length > 0) {
        hook?.({
          hostname,
          tier: 'os',
          outcome: 'success',
          durationMs: Date.now() - t0,
        });
        return r;
      }
      // Empty result — escalate (rare; OS usually throws NOTFOUND here).
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      const msg = `${e.code ?? 'Error'} ${e.message ?? ''}`.trim();
      hook?.({
        hostname,
        tier: 'os',
        outcome: 'failure',
        durationMs: Date.now() - t0,
        error: msg,
      });
      // Only escalate on classic DNS failure modes. A syntactically
      // invalid hostname produces a different error which we should
      // not paper over with DoH.
      if (!DNS_FAILURE_PATTERNS.test(msg)) {
        throw err;
      }
      recordOsFailure(Date.now());
    }
  }

  // ── Tier 2 ────────────────────────────────────────────────────────────────
  try {
    const { addresses, via } = await tier2PublicUdp(hostname);
    hook?.({
      hostname,
      tier: 'public-udp',
      outcome: 'success',
      durationMs: Date.now() - t0,
      via,
    });
    return addresses;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    hook?.({
      hostname,
      tier: 'public-udp',
      outcome: 'failure',
      durationMs: Date.now() - t0,
      error: `${e.code ?? 'Error'} ${e.message ?? ''}`.trim(),
    });
  }

  // ── Tier 3 ────────────────────────────────────────────────────────────────
  try {
    const { addresses, via } = await tier3Doh(hostname);
    hook?.({
      hostname,
      tier: 'doh',
      outcome: 'success',
      durationMs: Date.now() - t0,
      via,
    });
    return addresses;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    hook?.({
      hostname,
      tier: 'doh',
      outcome: 'failure',
      durationMs: Date.now() - t0,
      error: `${e.code ?? 'Error'} ${e.message ?? ''}`.trim(),
    });
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public lookup factory — Node `dns.lookup`-shaped API for undici
// ─────────────────────────────────────────────────────────────────────────────

interface LookupCallback {
  (err: NodeJS.ErrnoException | null, address?: string, family?: number): void;
  (
    err: NodeJS.ErrnoException | null,
    addresses?: { address: string; family: number }[],
  ): void;
}

type NodeLookup = (
  hostname: string,
  optionsOrCb: LookupOptions | number | LookupCallback | undefined,
  maybeCb?: LookupCallback,
) => void;

export interface ResilientLookupOptions {
  /** Subscribe to per-tier resolution events for logging/diagnostics. */
  onEvent?: DnsResolverHook;
}

export function createResilientLookup(opts: ResilientLookupOptions = {}): NodeLookup {
  const installedHook = opts.onEvent;
  // Compose: dispatch every tier event to BOTH the install-time hook
  // (set when initHttpClient ran — typically the desktop main-process
  // logger) and the active per-crawl hook (registered by Crawler.start
  // so the event surfaces inside the in-app log window with crawl
  // context attached).
  const hook: DnsResolverHook = (event) => {
    try {
      installedHook?.(event);
    } catch {
      /* hook must never break the resolve */
    }
    try {
      activeHook?.(event);
    } catch {
      /* same */
    }
  };
  return function lookup(
    hostname: string,
    optionsOrCb: LookupOptions | number | LookupCallback | undefined,
    maybeCb?: LookupCallback,
  ): void {
    let options: LookupOptions = {};
    let cb: LookupCallback;
    if (typeof optionsOrCb === 'function') {
      cb = optionsOrCb;
    } else if (typeof optionsOrCb === 'number') {
      options = { family: optionsOrCb as 0 | 4 | 6 };
      cb = maybeCb as LookupCallback;
    } else {
      options = (optionsOrCb ?? {}) as LookupOptions;
      cb = maybeCb as LookupCallback;
    }

    // Pass-through for IP literals — undici does this itself but being
    // defensive avoids a redundant round-trip if our lookup is invoked
    // on something already resolved.
    const literal = isLiteralIp(hostname);
    if (literal) {
      deliver([literal], options, cb);
      return;
    }

    const now = Date.now();
    const cached = cache.get(hostname);
    if (cached && cached.expires > now) {
      if (cached.negative || cached.addresses.length === 0) {
        const err: NodeJS.ErrnoException = new Error(
          `getaddrinfo ENOTFOUND ${hostname}`,
        );
        err.code = 'ENOTFOUND';
        cb(err);
        return;
      }
      deliver(cached.addresses, options, cb);
      return;
    }

    resolveCascade(hostname, hook)
      .then((addresses) => {
        cache.set(hostname, {
          addresses,
          expires: Date.now() + CACHE_TTL_MS,
        });
        deliver(addresses, options, cb);
      })
      .catch((err: NodeJS.ErrnoException) => {
        cache.set(hostname, {
          addresses: [],
          expires: Date.now() + ERROR_CACHE_TTL_MS,
          negative: true,
        });
        cb(err);
      });
  };
}

function deliver(
  addresses: ResolvedAddress[],
  options: LookupOptions,
  cb: LookupCallback,
): void {
  const family = options.family ?? 0;
  const filtered =
    family === 0 ? addresses : addresses.filter((a) => a.family === family);
  if (filtered.length === 0) {
    const err: NodeJS.ErrnoException = new Error('getaddrinfo ENOTFOUND');
    err.code = 'ENOTFOUND';
    cb(err);
    return;
  }
  if (options.all) {
    cb(
      null,
      filtered.map((a) => ({ address: a.address, family: a.family })),
    );
  } else {
    const first = filtered[0]!;
    (cb as (err: NodeJS.ErrnoException | null, address: string, family: number) => void)(
      null,
      first.address,
      first.family,
    );
  }
}
