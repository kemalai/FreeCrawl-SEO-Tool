export interface UrlRegexRewrite {
  pattern: string;
  replacement: string;
  flags?: string;
}

export interface CompiledUrlRegexRewrite {
  re: RegExp;
  replacement: string;
}

export interface UrlRewriteOptions {
  /** Strip a leading `www.` from the host. */
  stripWww?: boolean;
  /** Upgrade `http://` to `https://` before resolving. */
  forceHttps?: boolean;
  /** Lowercase the URL path component (host is case-insensitive per spec). */
  lowercasePath?: boolean;
  /** Trailing-slash policy: leave / strip / add. */
  trailingSlash?: 'leave' | 'strip' | 'add';
  /**
   * Query-param whitelist. When non-empty, ALL query parameters not in this
   * list are dropped — replacing the default tracking-only strip. Match is
   * case-insensitive on the param name. Empty list = default behaviour
   * (strip just utm_* / fbclid / gclid / mc_* tracking params).
   */
  keepQueryParams?: readonly string[];
  /**
   * Regex rewrites applied to the final stringified URL in order. Each
   * `pattern` is compiled with the supplied `flags` (default `g`). Invalid
   * patterns are skipped silently when passed pre-compiled — call sites
   * should compile via `compileUrlRegexRewrites` so errors surface once
   * up-front instead of on every URL.
   */
  regexRewrites?: readonly CompiledUrlRegexRewrite[];
}

const DEFAULT_TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'mc_cid',
  'mc_eid',
] as const;

export function compileUrlRegexRewrites(
  raw: readonly UrlRegexRewrite[] | undefined,
  onError?: (pattern: string, err: string) => void,
): CompiledUrlRegexRewrite[] {
  if (!raw || raw.length === 0) return [];
  const out: CompiledUrlRegexRewrite[] = [];
  for (const r of raw) {
    if (!r || typeof r.pattern !== 'string' || r.pattern === '') continue;
    try {
      const re = new RegExp(r.pattern, r.flags ?? 'g');
      out.push({ re, replacement: typeof r.replacement === 'string' ? r.replacement : '' });
    } catch (err) {
      if (onError) onError(r.pattern, err instanceof Error ? err.message : String(err));
    }
  }
  return out;
}

export function normalizeUrl(
  raw: string,
  base?: string,
  rewrites: UrlRewriteOptions = {},
): string | null {
  try {
    const u = new URL(raw, base);
    u.hash = '';

    const keep = rewrites.keepQueryParams;
    if (keep && keep.length > 0) {
      const allowed = new Set(keep.map((p) => p.toLowerCase()));
      const drop: string[] = [];
      for (const k of u.searchParams.keys()) {
        if (!allowed.has(k.toLowerCase())) drop.push(k);
      }
      for (const k of drop) u.searchParams.delete(k);
    } else {
      for (const p of DEFAULT_TRACKING_PARAMS) u.searchParams.delete(p);
    }

    if (u.pathname === '') u.pathname = '/';
    if ((u.protocol === 'http:' && u.port === '80') || (u.protocol === 'https:' && u.port === '443')) {
      u.port = '';
    }

    if (rewrites.forceHttps && u.protocol === 'http:') {
      u.protocol = 'https:';
    }
    if (rewrites.stripWww && u.hostname.startsWith('www.') && u.hostname.length > 4) {
      u.hostname = u.hostname.slice(4);
    }
    if (rewrites.lowercasePath && u.pathname) {
      u.pathname = u.pathname.toLowerCase();
    }
    if (rewrites.trailingSlash === 'strip' && u.pathname.length > 1 && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    } else if (
      rewrites.trailingSlash === 'add' &&
      u.pathname.length > 0 &&
      !u.pathname.endsWith('/')
    ) {
      const last = u.pathname.slice(u.pathname.lastIndexOf('/') + 1);
      if (!last.includes('.')) u.pathname += '/';
    }

    let result = u.toString();
    if (rewrites.regexRewrites && rewrites.regexRewrites.length > 0) {
      for (const { re, replacement } of rewrites.regexRewrites) {
        re.lastIndex = 0;
        result = result.replace(re, replacement);
      }
      try {
        const reparsed = new URL(result);
        result = reparsed.toString();
      } catch {
        return null;
      }
    }
    return result;
  } catch {
    return null;
  }
}

export function isSameHost(
  urlA: string,
  urlB: string,
  opts: { includeSubdomains?: boolean; cdnHosts?: readonly string[] } = {},
): boolean {
  try {
    const a = new URL(urlA);
    const b = new URL(urlB);
    if (opts.includeSubdomains) {
      const root = (h: string) => h.split('.').slice(-2).join('.');
      return root(a.hostname) === root(b.hostname);
    }
    if (a.hostname === b.hostname) return true;
    // CDN list — either side matching a configured CDN host counts as
    // "same host" so static.example.cloudfront.net etc. stays internal.
    if (opts.cdnHosts && opts.cdnHosts.length > 0) {
      const aH = a.hostname.toLowerCase();
      const bH = b.hostname.toLowerCase();
      for (const raw of opts.cdnHosts) {
        const rule = raw.trim().toLowerCase();
        if (!rule) continue;
        if (matchesCdnRule(aH, rule) && matchesCdnRule(bH, rule)) return true;
        // Also accept the case where one side is the page host and the
        // other matches the CDN — typical for an HTML page on the apex
        // and resources on a CDN subdomain.
        if (matchesCdnRule(aH, rule) || matchesCdnRule(bH, rule)) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Does `host` match a CDN rule? Supports two forms:
 *   - `cdn.example.com`   — exact host match
 *   - `*.cloudfront.net`  — suffix match on subdomains (one or more
 *                           labels), but not on the bare apex
 */
function matchesCdnRule(host: string, rule: string): boolean {
  if (rule.startsWith('*.')) {
    const suffix = rule.slice(1); // ".cloudfront.net"
    return host.endsWith(suffix) && host.length > suffix.length;
  }
  return host === rule;
}

export function isInScope(
  startUrl: string,
  candidateUrl: string,
  scope: 'subdomain' | 'subfolder' | 'all-subdomains' | 'exact-url',
): boolean {
  try {
    const start = new URL(startUrl);
    const c = new URL(candidateUrl);
    switch (scope) {
      case 'exact-url':
        return start.toString() === c.toString();
      case 'subdomain':
        return start.hostname === c.hostname;
      case 'subfolder': {
        if (start.hostname !== c.hostname) return false;
        const prefix = start.pathname.endsWith('/') ? start.pathname : start.pathname + '/';
        return c.pathname === start.pathname || c.pathname.startsWith(prefix);
      }
      case 'all-subdomains': {
        const root = (h: string) => h.split('.').slice(-2).join('.');
        return root(start.hostname) === root(c.hostname);
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export function extractExtension(url: string): string {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\.([a-z0-9]{1,6})$/i);
    return match ? match[1]!.toLowerCase() : '';
  } catch {
    return '';
  }
}

/**
 * Resolve a user-typed start URL to a full URL with protocol, following
 * any initial redirect chain so the crawler's scope calculation (e.g.
 * `subdomain` match) uses the site's canonical host.
 *
 * - If the input already begins with http:// or https://, protocol is kept.
 * - Otherwise, tries https:// first; falls back to http://.
 * - Uses a single auto-follow fetch per scheme (~300–800 ms typical) so a
 *   site like `gamesatis.com` → `www.gamesatis.com` resolves in one
 *   round-trip instead of two HEAD/GET phases.
 */
export interface ResolveStartUrlAttempt {
  method: 'HEAD' | 'GET';
  url: string;
  outcome: 'ok' | 'fail';
  status?: number;
  detail?: string;
  durationMs: number;
}

export async function resolveStartUrl(
  raw: string,
  userAgent = 'FreeCrawlSEO/0.1',
  probeTimeoutMs = 3000,
  onAttempt?: (a: ResolveStartUrlAttempt) => void,
): Promise<string | null> {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const report = (a: ResolveStartUrlAttempt): void => {
    if (onAttempt) {
      try {
        onAttempt(a);
      } catch {
        /* observer must never break the resolve */
      }
    }
  };

  // Single auto-follow request collapses what used to be two phases —
  // HEAD probe + manual hop-driven redirect chain — into one network
  // round-trip. For sites with `gamesatis.com` → 301 → `www.gamesatis.com`
  // → 200, the old code did a HEAD then 1–2 GETs (2–3 s total). undici's
  // `redirect: 'follow'` does the chain at the network layer in ~300–
  // 800 ms, after which `res.url` is the canonical final URL.
  async function resolveVia(url: string): Promise<string | null> {
    const { fetch: undiciFetch } = await import('undici');
    const { initHttpClient, formatFetchError } = await import('./http-client.js');
    initHttpClient();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), probeTimeoutMs);
    try {
      // HEAD first — cheap and avoids body transfer.
      const tHead = Date.now();
      try {
        const res = await undiciFetch(url, {
          method: 'HEAD',
          headers: { 'user-agent': userAgent },
          redirect: 'follow',
          signal: controller.signal,
        });
        report({
          method: 'HEAD',
          url,
          outcome: 'ok',
          status: res.status,
          durationMs: Date.now() - tHead,
        });
        return res.url || url;
      } catch (err) {
        report({
          method: 'HEAD',
          url,
          outcome: 'fail',
          detail: formatFetchError(err),
          durationMs: Date.now() - tHead,
        });
        // HEAD may be blocked / WAF'd — retry with GET. Body is cancelled
        // immediately so we don't actually transfer the page.
        const tGet = Date.now();
        try {
          const res = await undiciFetch(url, {
            method: 'GET',
            headers: { 'user-agent': userAgent },
            redirect: 'follow',
            signal: controller.signal,
          });
          try {
            await res.body?.cancel();
          } catch {
            /* ignore */
          }
          report({
            method: 'GET',
            url,
            outcome: 'ok',
            status: res.status,
            durationMs: Date.now() - tGet,
          });
          return res.url || url;
        } catch (err2) {
          report({
            method: 'GET',
            url,
            outcome: 'fail',
            detail: formatFetchError(err2),
            durationMs: Date.now() - tGet,
          });
          return null;
        }
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const resolved = (await resolveVia(trimmed)) ?? trimmed;
    return normalizeUrl(resolved);
  }

  const bare = trimmed.replace(/^\/\//, '').replace(/^\/+/, '');
  const httpsUrl = `https://${bare}`;
  const viaHttps = await resolveVia(httpsUrl);
  if (viaHttps) return normalizeUrl(viaHttps);

  const httpUrl = `http://${bare}`;
  const viaHttp = await resolveVia(httpUrl);
  if (viaHttp) return normalizeUrl(viaHttp);

  // Neither protocol responded — return the secure candidate anyway;
  // the crawler will surface a network error with that URL.
  return normalizeUrl(httpsUrl);
}
