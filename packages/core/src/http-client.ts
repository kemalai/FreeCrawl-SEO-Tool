import dns from 'node:dns';
import { Agent, ProxyAgent, setGlobalDispatcher } from 'undici';
import { createResilientLookup, type DnsResolverHook } from './dns-resolver.js';

let initialized = false;

/**
 * Configure the global undici dispatcher and Node DNS once per process.
 *
 * - `createResilientLookup` is a 3-tier DNS cascade (OS → public UDP →
 *   DoH-over-HTTPS) with built-in caching. Replaces cacheable-lookup
 *   and adds automatic recovery on systems with broken Windows DNS
 *   Client / port-53 blocked / DNS hijacking — without asking the
 *   user to do anything. See `dns-resolver.ts` for the cascade rules.
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
export function initHttpClient(opts: { proxyOverride?: string; onDnsEvent?: DnsResolverHook } = {}): void {
  if (initialized) return;
  initialized = true;

  dns.setDefaultResultOrder('ipv4first');

  const lookup = createResilientLookup({ onEvent: opts.onDnsEvent });

  // Corporate proxy detection — env vars are the universal contract,
  // matching curl / git / npm / pip behaviour. A non-empty config
  // override (Settings → Auth → Proxy URL) takes precedence so the
  // user can route a single project through a different proxy.
  // ECMAScript forbids mixing `||` with `??` in the same expression
  // without parentheses (SyntaxError on parse). The `??` chain must be
  // grouped, then OR'd with the override.
  const envProxy =
    process.env['HTTPS_PROXY'] ??
    process.env['https_proxy'] ??
    process.env['HTTP_PROXY'] ??
    process.env['http_proxy'] ??
    null;
  const proxyUrl =
    (opts.proxyOverride && opts.proxyOverride.trim()) || envProxy;

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
      // 3-tier resilient lookup matches Node's dns.lookup signature,
      // which is compatible with undici at runtime but the typings diverge.
      lookup: lookup as never,
      // Happy Eyeballs — prevents a broken AAAA route from stalling the
      // entire crawl on dual-stack hosts.
      autoSelectFamily: true,
      autoSelectFamilyAttemptTimeout: 250,
    },
  });

  setGlobalDispatcher(agent);
}

/**
 * Best-effort HTTP protocol detector. We can't ask undici-fetch which
 * ALPN/protocol was actually negotiated for the connection that served
 * the response — that information is buried in the dispatcher and not
 * exposed on the Response object. Instead we read the `Alt-Svc` header
 * the origin advertises (RFC 7838): if it lists `h2=` / `h3=`, the site
 * supports HTTP/2 / HTTP/3. The site might still serve THIS request over
 * HTTP/1.1, but in practice modern origins that advertise h2 also
 * negotiate it whenever the client (undici) supports it.
 *
 * Returns:
 *   - `'h3'`        when Alt-Svc advertises h3 (Quic / HTTP/3)
 *   - `'h2'`        when Alt-Svc advertises h2 (HTTP/2)
 *   - `'http/1.1'`  when Alt-Svc is absent or only lists older protocols
 *   - `null`        when no signal could be derived (e.g. fetch error)
 */
export function detectHttpProtocol(altSvcHeader: string | null): string | null {
  if (altSvcHeader === null) return 'http/1.1';
  const v = altSvcHeader.toLowerCase();
  if (v.includes('h3=')) return 'h3';
  if (v.includes('h2=')) return 'h2';
  return 'http/1.1';
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
  // ORDER MATTERS — more specific patterns must come first. DNS-layer
  // errors (queryA / queryAAAA / EDESTRUCTION) frequently surface as
  // ECONNREFUSED or ETIMEDOUT in the chain — without the early DNS
  // branch they would be misattributed to HTTP-layer connect failures.
  const isDnsQuery = /\bquery(A|AAAA|Soa|Srv|Mx|Txt|Naptr|Ptr|Ns|Cname|Any)\b/i.test(chain);
  if (isDnsQuery && /ECONNREFUSED/.test(chain)) {
    return `${chain}  (DNS server refused on port 53 — automatic DNS-over-HTTPS fallback (Cloudflare 1.1.1.1) is also failing. Likely cause: antivirus / firewall blocking ALL outbound traffic, or no internet connection. Whitelist FreeCrawl in your security software.)`;
  }
  if (isDnsQuery && /ETIMEOUT|ETIMEDOUT/.test(chain)) {
    return `${chain}  (DNS query timed out — automatic public-DNS + DoH fallbacks also timed out. Check whether you have internet access at all, and whether antivirus / firewall is blocking FreeCrawl from reaching the network.)`;
  }
  if (/EDESTRUCTION/.test(chain)) {
    return `${chain}  (System DNS resolver crashed — FreeCrawl automatically falls back to public DNS (1.1.1.1, 8.8.8.8) and DoH-over-HTTPS, no user action needed. If this error still surfaces, all three layers failed: check internet connection and that antivirus is not blocking FreeCrawl.)`;
  }
  if (/ENOTFOUND|EAI_AGAIN|ENODATA|ESERVFAIL|EREFUSED|ENOTIMP|ENONAME/.test(chain)) {
    return `${chain}  (DNS lookup failed across all 3 layers (OS, public DNS, DoH). Most likely the host genuinely doesn't exist, or your machine has no internet at all. Check the spelling and your connection.)`;
  }
  if (/UNABLE_TO_GET_ISSUER_CERT_LOCALLY|SELF_SIGNED_CERT_IN_CHAIN|CERT_HAS_EXPIRED|DEPTH_ZERO_SELF_SIGNED_CERT|UNABLE_TO_VERIFY_LEAF_SIGNATURE/.test(chain)) {
    return `${chain}  (TLS certificate rejected — likely corporate proxy or antivirus HTTPS inspection; set NODE_EXTRA_CA_CERTS to your CA bundle)`;
  }
  if (/UND_ERR_HEADERS_TIMEOUT/.test(chain)) {
    return `${chain}  (server accepted the connection but never sent response headers within 10s — typical of WAF / bot challenge / Cloudflare; try a browser-like User-Agent in Settings)`;
  }
  if (/UND_ERR_BODY_TIMEOUT/.test(chain)) {
    return `${chain}  (server stopped sending the response body — slow upstream, drip-throttling, or WAF; raising Timeout (ms) in Settings may help)`;
  }
  if (/UND_ERR_SOCKET|ECONNRESET|EPIPE/.test(chain)) {
    return `${chain}  (connection reset by remote — often antivirus / firewall TLS inspection or anti-bot drop; whitelist FreeCrawl in your security software)`;
  }
  if (/UND_ERR_CONNECT_TIMEOUT|ETIMEDOUT/.test(chain)) {
    return `${chain}  (TCP connect timed out — firewall, corporate proxy blocking outbound, or host is offline; try setting HTTPS_PROXY if behind a proxy)`;
  }
  if (/ECONNREFUSED/.test(chain)) {
    return `${chain}  (host actively refused the connection — port closed, service down, or local firewall blocking outbound)`;
  }
  if (/EPROTO|ERR_SSL_|TLSV1_ALERT|HANDSHAKE_FAILURE|WRONG_VERSION_NUMBER/.test(chain)) {
    return `${chain}  (TLS handshake failed — origin uses an outdated cipher suite or HTTPS inspection corrupted the handshake)`;
  }
  if (/NGHTTP2_|HTTP2_|GOAWAY|PROTOCOL_ERROR/.test(chain)) {
    return `${chain}  (HTTP/2 protocol error — origin closed the stream; antivirus or proxy may be tampering with HTTP/2 frames)`;
  }
  if (/AbortError|aborted|UND_ERR_ABORTED/.test(chain)) {
    return `${chain}  (request was aborted — typically the per-request Timeout (ms) elapsed before headers were received; raise Timeout in Settings if the site is slow)`;
  }
  return chain;
}

/**
 * One-shot snapshot of network-relevant environment used during diagnostic
 * logging at crawl start. Anything here is harmless to log (no creds, no
 * file paths beyond the proxy URL the user themselves configured).
 */
export function collectNetworkDiagnostics(opts: { proxyOverride?: string } = {}): {
  proxyUrl: string | null;
  proxySource: 'config' | 'env' | 'none';
  caBundleSet: boolean;
  noProxy: string | null;
  tlsRejectUnauthorized: boolean;
  electronVersion: string | null;
  undiciVersion: string | null;
} {
  const envProxy =
    process.env['HTTPS_PROXY'] ??
    process.env['https_proxy'] ??
    process.env['HTTP_PROXY'] ??
    process.env['http_proxy'] ??
    null;
  const overrideProxy = opts.proxyOverride && opts.proxyOverride.trim() ? opts.proxyOverride.trim() : null;
  const proxyUrl = overrideProxy ?? envProxy ?? null;
  const proxySource: 'config' | 'env' | 'none' = overrideProxy
    ? 'config'
    : envProxy
      ? 'env'
      : 'none';
  const electronVersion = (process.versions as Record<string, string>)['electron'] ?? null;
  const undiciVersion = (process.versions as Record<string, string>)['undici'] ?? null;
  return {
    proxyUrl: proxyUrl ? redactProxyCreds(proxyUrl) : null,
    proxySource,
    caBundleSet: !!process.env['NODE_EXTRA_CA_CERTS'],
    noProxy: process.env['NO_PROXY'] ?? process.env['no_proxy'] ?? null,
    tlsRejectUnauthorized: process.env['NODE_TLS_REJECT_UNAUTHORIZED'] !== '0',
    electronVersion,
    undiciVersion,
  };
}

/**
 * Scrub `user:pass@` credentials out of a proxy URL before logging — even
 * if the user configured them themselves they don't want them appearing in
 * the in-app log window.
 */
function redactProxyCreds(url: string): string {
  try {
    const u = new URL(url);
    if (u.username || u.password) {
      u.username = '***';
      u.password = '';
    }
    return u.toString();
  } catch {
    return url;
  }
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
  auth?: { type: 'none' | 'basic' | 'bearer'; username?: string; password?: string; token?: string },
): Record<string, string> {
  const headers: Record<string, string> = {
    'user-agent': userAgent,
    'accept-language': acceptLanguage,
    'accept-encoding': 'gzip, deflate, br',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  };
  // Auth header is materialised first so a user-supplied custom
  // `Authorization` header still wins (custom comes later in the loop).
  if (auth && auth.type === 'basic' && auth.username) {
    const creds = Buffer.from(`${auth.username}:${auth.password ?? ''}`, 'utf8').toString(
      'base64',
    );
    headers['authorization'] = `Basic ${creds}`;
  } else if (auth && auth.type === 'bearer' && auth.token) {
    headers['authorization'] = `Bearer ${auth.token}`;
  }
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
