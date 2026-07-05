import dns from 'node:dns';
import crypto from 'node:crypto';
import { Agent, ProxyAgent, buildConnector, setGlobalDispatcher } from 'undici';
import { SocksClient, type SocksProxy } from 'socks';
import { createResilientLookup, type DnsResolverHook } from './dns-resolver.js';

let dnsInitialized = false;
/** Effective proxy applied to the global dispatcher on the last call, so we
 *  only rebuild when it actually changes (a second crawl can switch proxy). */
let lastProxyKey: string | null = null;

/** Resilient DNS lookup from the last direct-mode init, reused when building
 *  the lenient (TLS-relaxed) dispatcher below. */
let sharedResilientLookup: ReturnType<typeof createResilientLookup> | null = null;
/** True while the global dispatcher is a direct Agent (no proxy). Lenient TLS
 *  retry is only offered in this mode so we never silently bypass a proxy. */
let directMode = false;
/** Lazily-built dispatcher with certificate verification disabled — used ONLY
 *  as a last-resort retry when an EXTERNAL link fails TLS chain verification
 *  (incomplete chain that browsers complete via AIA fetching but Node does
 *  not). Rebuilt whenever the effective proxy changes. */
let lenientDispatcher: Agent | null = null;

/**
 * Browser-like User-Agent used as a fallback when an external-link probe with
 * the configured (often non-browser) UA is blocked. Many WAFs/CDNs actively
 * reject or reset non-browser UAs — e.g. Microsoft resets the HTTP/2 stream,
 * Cloudflare Bot-Fight returns 403 — so a link that a real visitor can open is
 * wrongly recorded as failed. See `Crawler.probeExternal`.
 */
export const BROWSER_FALLBACK_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

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
 * - SOCKS proxies (`socks5://`, `socks5h://`, `socks4://`, `socks4a://`)
 *   are routed through a custom undici Agent whose `connect` dials the
 *   destination over a SOCKS tunnel (TLS upgraded for https origins).
 * - The Agent is tuned for crawler-style workloads: many concurrent
 *   connections per origin, long keep-alive, tight headers timeout so a
 *   stuck origin can't freeze the pool.
 *
 * Idempotent per effective-proxy: DNS is configured once, and the global
 * dispatcher is only rebuilt when the resolved proxy changes — so a second
 * crawl can switch to a different proxy instead of the first crawl's
 * dispatcher winning for the whole process lifetime.
 */
export function initHttpClient(opts: { proxyOverride?: string; onDnsEvent?: DnsResolverHook } = {}): void {
  if (!dnsInitialized) {
    dnsInitialized = true;
    dns.setDefaultResultOrder('ipv4first');
  }

  // Corporate proxy detection — env vars are the universal contract,
  // matching curl / git / npm / pip behaviour. A non-empty config
  // override (Settings → Network → Proxy URL) takes precedence so the
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
  const proxyUrl = (opts.proxyOverride && opts.proxyOverride.trim()) || envProxy || '';

  const key = proxyUrl || '<direct>';
  if (key === lastProxyKey) return;
  lastProxyKey = key;
  // Effective transport changed — drop the cached lenient dispatcher so it
  // rebuilds against the new proxy/direct state and DNS lookup. Close the
  // stale Agent first so its keep-alive socket pool is released now instead
  // of leaking until GC; fall back to a forceful destroy if graceful close
  // rejects (e.g. already closing).
  if (lenientDispatcher) {
    const stale = lenientDispatcher;
    void stale.close().catch(() => stale.destroy().catch(() => undefined));
  }
  lenientDispatcher = null;

  if (proxyUrl) {
    directMode = false;
    const scheme = proxyUrl.slice(0, Math.max(0, proxyUrl.indexOf(':'))).toLowerCase();
    if (scheme.startsWith('socks')) {
      setGlobalDispatcher(buildSocksDispatcher(proxyUrl));
      return;
    }
    setGlobalDispatcher(new ProxyAgent({ uri: proxyUrl }));
    return;
  }

  const lookup = createResilientLookup({ onEvent: opts.onDnsEvent });
  sharedResilientLookup = lookup;
  directMode = true;
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
 * Lazily build (and cache) a dispatcher whose TLS layer does NOT verify the
 * certificate chain, reusing the resilient DNS lookup. Used as a last-resort
 * retry for EXTERNAL link probes that fail with an incomplete-chain error
 * (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`): browsers complete such chains via AIA
 * fetching, Node does not, so an otherwise-reachable link is wrongly recorded
 * as dead. External link checking only needs the status code — TLS problems
 * are surfaced separately by the Security tab / certificate probe.
 *
 * Returns `null` when a proxy is active (we must not bypass a corporate proxy
 * just to relax TLS) or before `initHttpClient` has run in direct mode.
 */
export function buildLenientDispatcher(): Agent | null {
  if (!directMode || !sharedResilientLookup) return null;
  if (lenientDispatcher) return lenientDispatcher;
  lenientDispatcher = new Agent({
    connections: 32,
    pipelining: 1,
    keepAliveTimeout: 10_000,
    keepAliveMaxTimeout: 30_000,
    headersTimeout: 10_000,
    bodyTimeout: 30_000,
    connect: {
      lookup: sharedResilientLookup as never,
      rejectUnauthorized: false,
      autoSelectFamily: true,
      autoSelectFamilyAttemptTimeout: 250,
    },
  });
  return lenientDispatcher;
}

/**
 * Build an undici dispatcher that tunnels every connection through a SOCKS
 * proxy. undici's own `ProxyAgent` only speaks HTTP CONNECT, so for SOCKS
 * we supply a custom `connect`: the `socks` client opens the tunnel to the
 * destination, then for `https:` origins we hand the raw socket to undici's
 * TLS connector (`httpSocket`) so the certificate handshake still happens
 * end-to-end. `socks5h` / `socks4a` resolve DNS at the proxy (the default
 * here, since we pass the destination host name through untouched).
 */
function buildSocksDispatcher(proxyUrl: string): Agent {
  const u = new URL(proxyUrl);
  const scheme = u.protocol.replace(':', '').toLowerCase();
  const type: 4 | 5 = scheme === 'socks4' || scheme === 'socks4a' ? 4 : 5;
  const proxy: SocksProxy = {
    host: u.hostname,
    port: Number(u.port) || 1080,
    type,
    ...(u.username ? { userId: decodeURIComponent(u.username) } : {}),
    ...(u.password ? { password: decodeURIComponent(u.password) } : {}),
  };

  const tlsConnector = buildConnector({});
  const connect: typeof tlsConnector = (options, callback) => {
    void (async () => {
      const host = options.hostname;
      const port = Number(options.port) || (options.protocol === 'https:' ? 443 : 80);
      let socket;
      try {
        const result = await SocksClient.createConnection({
          proxy,
          command: 'connect',
          destination: { host, port },
          timeout: 10_000,
        });
        socket = result.socket;
      } catch (err) {
        callback(err as Error, null);
        return;
      }
      if (options.protocol === 'https:') {
        tlsConnector({ ...options, httpSocket: socket }, callback);
        return;
      }
      socket.setNoDelay(true);
      callback(null, socket);
    })();
  };

  return new Agent({
    connections: 128,
    pipelining: 1,
    keepAliveTimeout: 60_000,
    keepAliveMaxTimeout: 120_000,
    headersTimeout: 10_000,
    bodyTimeout: 30_000,
    connect,
  });
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
  // Alt-Svc is a comma-separated list of advertised protocols, e.g.
  // `h3=":443"; ma=2592000, h3-29=":443", h2=":443"`. Match the `h3`
  // token at a boundary INCLUDING draft variants (`h3-29=`, `h3-Q050=`)
  // — a plain `includes('h3=')` misses draft-only origins. `Alt-Svc:
  // clear` (origin withdrawing advertisements) matches neither token.
  if (/(?:^|[\s,])h3(?:-[a-z0-9]+)?=/.test(v)) return 'h3';
  if (/(?:^|[\s,])h2=/.test(v)) return 'h2';
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
  auth?: {
    type: 'none' | 'basic' | 'bearer' | 'digest';
    username?: string;
    password?: string;
    token?: string;
  },
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

/* ------------------------------------------------------------------ */
/* HTTP Digest authentication (RFC 2617 / RFC 7616)                    */
/* ------------------------------------------------------------------ */

export interface DigestChallenge {
  realm: string;
  nonce: string;
  /** May be a comma-separated list, e.g. `auth,auth-int`. */
  qop?: string;
  opaque?: string;
  /** `MD5` | `MD5-sess` | `SHA-256` | `SHA-256-sess` (default MD5). */
  algorithm?: string;
}

/**
 * Parse a `WWW-Authenticate` response header and extract the Digest
 * challenge parameters. Returns `null` when the header isn't a Digest
 * challenge (e.g. it advertises only Basic), so the caller can skip the
 * digest round-trip. Tolerates a header that lists multiple schemes by
 * scanning from the `Digest` token.
 */
export function parseDigestChallenge(headerValue: string | null): DigestChallenge | null {
  if (!headerValue) return null;
  const idx = headerValue.toLowerCase().indexOf('digest ');
  if (idx === -1) return null;
  const params = headerValue.slice(idx + 'digest '.length);
  const map: Record<string, string> = {};
  // key=value pairs, value either quoted ("...") or a bare token.
  const re = /([A-Za-z0-9_-]+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|([^,\s]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(params)) !== null) {
    const key = m[1]!.toLowerCase();
    map[key] = m[2] !== undefined ? m[2].replace(/\\(.)/g, '$1') : (m[3] ?? '');
  }
  if (!map['nonce'] || map['realm'] === undefined) return null;
  return {
    realm: map['realm'] ?? '',
    nonce: map['nonce'] ?? '',
    qop: map['qop'],
    opaque: map['opaque'],
    algorithm: map['algorithm'],
  };
}

/**
 * Compute the `Authorization: Digest …` header value for a request, given
 * a parsed challenge and the request's method + request-target URI.
 * Supports MD5 / SHA-256, the `-sess` variants, and `qop=auth`. `auth-int`
 * (which needs a body hash) falls back to the legacy RFC 2069 form.
 */
export function buildDigestAuthHeader(
  challenge: DigestChallenge,
  req: { method: string; uri: string; username: string; password: string; nc?: string; cnonce?: string },
): string {
  const algo = challenge.algorithm ?? 'MD5';
  const hashName = algo.toUpperCase().startsWith('SHA-256') ? 'sha256' : 'md5';
  const sess = algo.toLowerCase().endsWith('-sess');
  const H = (s: string): string => crypto.createHash(hashName).update(s).digest('hex');

  const cnonce = req.cnonce ?? crypto.randomBytes(8).toString('hex');
  const nc = req.nc ?? '00000001';

  let ha1 = H(`${req.username}:${challenge.realm}:${req.password}`);
  if (sess) ha1 = H(`${ha1}:${challenge.nonce}:${cnonce}`);
  const ha2 = H(`${req.method}:${req.uri}`);

  const qops = (challenge.qop ?? '')
    .split(',')
    .map((q) => q.trim().toLowerCase())
    .filter(Boolean);
  const useQop = qops.includes('auth') ? 'auth' : '';

  const parts = [
    `username="${req.username}"`,
    `realm="${challenge.realm}"`,
    `nonce="${challenge.nonce}"`,
    `uri="${req.uri}"`,
  ];
  let response: string;
  if (useQop) {
    response = H(`${ha1}:${challenge.nonce}:${nc}:${cnonce}:${useQop}:${ha2}`);
    parts.push(`qop=${useQop}`, `nc=${nc}`, `cnonce="${cnonce}"`);
  } else {
    response = H(`${ha1}:${challenge.nonce}:${ha2}`);
  }
  parts.push(`response="${response}"`);
  if (challenge.algorithm) parts.push(`algorithm=${challenge.algorithm}`);
  if (challenge.opaque) parts.push(`opaque="${challenge.opaque}"`);
  return `Digest ${parts.join(', ')}`;
}
