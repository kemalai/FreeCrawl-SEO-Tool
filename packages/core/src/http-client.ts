import dns from 'node:dns';
import { Agent, ProxyAgent, setGlobalDispatcher } from 'undici';
import CacheableLookup from 'cacheable-lookup';

let initialized = false;

/**
 * Configure the global undici dispatcher and Node DNS once per process.
 *
 * - `cacheable-lookup` caches DNS results so we don't saturate libuv's
 *   4-thread lookup pool when running 50+ concurrent requests.
 * - `ipv4first` avoids 1–2s stalls when a host has a dead AAAA record.
 * - `autoSelectFamily` enables Happy Eyeballs (RFC 8305) — races IPv4/IPv6
 *   and uses whichever connects first. Important for dual-stack hosts
 *   where one family is broken on the user's network.
 * - If HTTPS_PROXY / HTTP_PROXY env vars are set (corporate networks),
 *   route through ProxyAgent so packaged-app users don't get ECONNREFUSED
 *   against origins they can only reach via their company proxy.
 * - The Agent is tuned for crawler-style workloads: many concurrent
 *   connections per origin, long keep-alive, tight headers timeout so a
 *   stuck origin can't freeze the pool.
 */
export function initHttpClient(): void {
  if (initialized) return;
  initialized = true;

  dns.setDefaultResultOrder('ipv4first');

  const cacheable = new CacheableLookup({
    maxTtl: 300,
    errorTtl: 15,
  });

  // Corporate proxy detection — env vars are the universal contract,
  // matching curl / git / npm / pip behaviour.
  const proxyUrl =
    process.env['HTTPS_PROXY'] ??
    process.env['https_proxy'] ??
    process.env['HTTP_PROXY'] ??
    process.env['http_proxy'] ??
    null;

  if (proxyUrl) {
    setGlobalDispatcher(new ProxyAgent({ uri: proxyUrl }));
    return;
  }

  const agent = new Agent({
    connections: 128,
    pipelining: 1,
    keepAliveTimeout: 60_000,
    keepAliveMaxTimeout: 120_000,
    headersTimeout: 10_000,
    bodyTimeout: 30_000,
    connect: {
      // cacheable-lookup.lookup matches Node's dns.lookup signature, which
      // is compatible with undici at runtime but the typings diverge.
      lookup: cacheable.lookup.bind(cacheable) as never,
      // Happy Eyeballs — prevents a broken AAAA route from stalling the
      // entire crawl on dual-stack hosts.
      autoSelectFamily: true,
      autoSelectFamilyAttemptTimeout: 250,
    },
  });

  setGlobalDispatcher(agent);
}

/**
 * Walk the `cause` chain on a fetch error and produce a human-readable
 * diagnostic. Undici wraps TCP/TLS/DNS failures in a generic TypeError
 * with message "fetch failed", putting the real root cause in `.cause` —
 * without this, users just see "fetch failed" which is useless for support.
 *
 * Examples of what this turns into:
 *   fetch failed -> ENOTFOUND example.com
 *   fetch failed -> UND_ERR_CONNECT_TIMEOUT Connect Timeout Error
 *   fetch failed -> UNABLE_TO_GET_ISSUER_CERT_LOCALLY (TLS root not trusted — check antivirus / corporate proxy)
 *   fetch failed -> ECONNREFUSED
 */
export function formatFetchError(err: unknown): string {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = err;
  while (current && !seen.has(current)) {
    seen.add(current);
    if (current instanceof Error) {
      const e = current as Error & { code?: string };
      const tag = e.code ?? e.name ?? 'Error';
      const msg = e.message || '(no message)';
      parts.push(e.code ? `${tag} ${msg}` : msg);
      current = (e as { cause?: unknown }).cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  const chain = parts.join(' -> ');
  // Friendly hints for the most common packaged-app failure modes.
  if (/UNABLE_TO_GET_ISSUER_CERT_LOCALLY|SELF_SIGNED_CERT_IN_CHAIN|CERT_HAS_EXPIRED/.test(chain)) {
    return `${chain}  (TLS certificate rejected — likely corporate proxy or antivirus HTTPS inspection; set NODE_EXTRA_CA_CERTS to your CA bundle)`;
  }
  if (/UND_ERR_CONNECT_TIMEOUT|ETIMEDOUT|ECONNREFUSED/.test(chain)) {
    return `${chain}  (cannot reach host — firewall, corporate proxy, or site is offline; try setting HTTPS_PROXY if behind a proxy)`;
  }
  if (/ENOTFOUND|EAI_AGAIN/.test(chain)) {
    return `${chain}  (DNS lookup failed — check internet connection / DNS)`;
  }
  return chain;
}

/**
 * Headers every crawler request should send. Compression is requested so
 * servers can save 60–80% bandwidth on HTML; undici's fetch auto-decodes.
 *
 * Any user-supplied `custom` entries are merged last and override defaults
 * on case-insensitive key match — so `{ 'User-Agent': 'X' }` wins over the
 * built-in `user-agent` header.
 */
export function defaultRequestHeaders(
  userAgent: string,
  acceptLanguage: string,
  custom: Record<string, string> = {},
): Record<string, string> {
  const headers: Record<string, string> = {
    'user-agent': userAgent,
    'accept-language': acceptLanguage,
    'accept-encoding': 'gzip, deflate, br',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  };
  for (const [rawKey, value] of Object.entries(custom)) {
    const key = rawKey.trim();
    if (!key) continue;
    // Case-insensitive override: delete any existing lower-cased variant
    // so the user's exact-case key wins without producing duplicates.
    const lower = key.toLowerCase();
    for (const existing of Object.keys(headers)) {
      if (existing.toLowerCase() === lower) delete headers[existing];
    }
    headers[key] = value;
  }
  return headers;
}
