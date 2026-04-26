export interface UrlRewriteOptions {
  /** Strip a leading `www.` from the host. */
  stripWww?: boolean;
  /** Upgrade `http://` to `https://` before resolving. */
  forceHttps?: boolean;
  /** Lowercase the URL path component (host is case-insensitive per spec). */
  lowercasePath?: boolean;
  /** Trailing-slash policy: leave / strip / add. */
  trailingSlash?: 'leave' | 'strip' | 'add';
}

export function normalizeUrl(
  raw: string,
  base?: string,
  rewrites: UrlRewriteOptions = {},
): string | null {
  try {
    const u = new URL(raw, base);
    u.hash = '';
    const tracking = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'mc_cid',
      'mc_eid',
    ];
    for (const p of tracking) u.searchParams.delete(p);
    if (u.pathname === '') u.pathname = '/';
    if ((u.protocol === 'http:' && u.port === '80') || (u.protocol === 'https:' && u.port === '443')) {
      u.port = '';
    }

    // User-configured rewrites — applied after the canonical pass so each
    // branch sees a clean URL. Combinations (forceHttps + stripWww) compose
    // naturally because each branch only touches one URL component.
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
      // Skip file-extension paths (`.css`, `.html`, …) — adding `/` to those
      // creates broken URLs. Detect by the final segment containing a `.`.
      const last = u.pathname.slice(u.pathname.lastIndexOf('/') + 1);
      if (!last.includes('.')) u.pathname += '/';
    }
    return u.toString();
  } catch {
    return null;
  }
}

export function isSameHost(
  urlA: string,
  urlB: string,
  opts: { includeSubdomains?: boolean } = {},
): boolean {
  try {
    const a = new URL(urlA);
    const b = new URL(urlB);
    if (opts.includeSubdomains) {
      const root = (h: string) => h.split('.').slice(-2).join('.');
      return root(a.hostname) === root(b.hostname);
    }
    return a.hostname === b.hostname;
  } catch {
    return false;
  }
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
export async function resolveStartUrl(
  raw: string,
  userAgent = 'FreeCrawlSEO/0.1',
  probeTimeoutMs = 3000,
): Promise<string | null> {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Single auto-follow request collapses what used to be two phases —
  // HEAD probe + manual hop-driven redirect chain — into one network
  // round-trip. For sites with `gamesatis.com` → 301 → `www.gamesatis.com`
  // → 200, the old code did a HEAD then 1–2 GETs (2–3 s total). undici's
  // `redirect: 'follow'` does the chain at the network layer in ~300–
  // 800 ms, after which `res.url` is the canonical final URL.
  async function resolveVia(url: string): Promise<string | null> {
    const { fetch: undiciFetch } = await import('undici');
    const { initHttpClient } = await import('./http-client.js');
    initHttpClient();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), probeTimeoutMs);
    try {
      // HEAD first — cheap and avoids body transfer.
      try {
        const res = await undiciFetch(url, {
          method: 'HEAD',
          headers: { 'user-agent': userAgent },
          redirect: 'follow',
          signal: controller.signal,
        });
        return res.url || url;
      } catch {
        // HEAD may be blocked / WAF'd — retry with GET. Body is cancelled
        // immediately so we don't actually transfer the page.
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
        return res.url || url;
      }
    } catch {
      return null;
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
