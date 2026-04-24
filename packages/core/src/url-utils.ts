export function normalizeUrl(raw: string, base?: string): string | null {
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

async function probeUrl(url: string, userAgent: string, timeoutMs: number): Promise<boolean> {
  const { fetch: undiciFetch } = await import('undici');
  const { initHttpClient } = await import('./http-client.js');
  initHttpClient();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Try HEAD first (cheap)
    try {
      await undiciFetch(url, {
        method: 'HEAD',
        headers: { 'user-agent': userAgent },
        redirect: 'manual',
        signal: controller.signal,
      });
      return true;
    } catch {
      // HEAD may be blocked by server or WAF — retry with GET
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), timeoutMs);
      try {
        const res = await undiciFetch(url, {
          method: 'GET',
          headers: { 'user-agent': userAgent },
          redirect: 'manual',
          signal: controller2.signal,
        });
        try {
          await res.body?.cancel();
        } catch {
          /* ignore */
        }
        return true;
      } finally {
        clearTimeout(timeout2);
      }
    }
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Follow redirects starting from `url` until a non-3xx response is reached
 * or `maxHops` is exhausted. Returns the final URL (or the last URL seen
 * if we give up on a loop / error). Uses GET with redirect: 'manual' so
 * the chain is driven by `location` headers.
 */
async function followRedirectChain(
  url: string,
  userAgent: string,
  timeoutMs: number,
  maxHops = 5,
): Promise<string> {
  const { fetch: undiciFetch } = await import('undici');
  const { initHttpClient } = await import('./http-client.js');
  initHttpClient();
  let current = url;
  const seen = new Set<string>([current]);
  for (let i = 0; i < maxHops; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await undiciFetch(current, {
        method: 'GET',
        headers: { 'user-agent': userAgent },
        redirect: 'manual',
        signal: controller.signal,
      });
      try {
        await res.body?.cancel();
      } catch {
        /* ignore */
      }
      if (res.status < 300 || res.status >= 400) return current;
      const location = res.headers.get('location');
      if (!location) return current;
      const next = normalizeUrl(location, current);
      if (!next || seen.has(next)) return current;
      seen.add(next);
      current = next;
    } catch {
      return current;
    } finally {
      clearTimeout(timeout);
    }
  }
  return current;
}

/**
 * Resolve a user-typed start URL to a full URL with protocol, following
 * any initial redirect chain so the crawler's scope calculation (e.g.
 * `subdomain` match) uses the site's canonical host.
 *
 * - If the input already begins with http:// or https://, protocol is kept.
 * - Otherwise, tries https:// first (5s probe); falls back to http://.
 * - Then follows up to 5 redirect hops so `example.com` → `www.example.com`
 *   resolves to the final URL before scope is fixed.
 */
export async function resolveStartUrl(
  raw: string,
  userAgent = 'FreeCrawlSEO/0.1',
  probeTimeoutMs = 5000,
): Promise<string | null> {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let candidate: string | null = null;
  if (/^https?:\/\//i.test(trimmed)) {
    candidate = normalizeUrl(trimmed);
  } else {
    const bare = trimmed.replace(/^\/\//, '').replace(/^\/+/, '');
    const httpsUrl = `https://${bare}`;
    if (await probeUrl(httpsUrl, userAgent, probeTimeoutMs)) {
      candidate = normalizeUrl(httpsUrl);
    } else {
      const httpUrl = `http://${bare}`;
      if (await probeUrl(httpUrl, userAgent, probeTimeoutMs)) {
        candidate = normalizeUrl(httpUrl);
      } else {
        // Neither protocol responded — return the secure candidate anyway;
        // the crawler will surface a network error with that URL.
        candidate = normalizeUrl(httpsUrl);
      }
    }
  }

  if (!candidate) return null;
  const final = await followRedirectChain(candidate, userAgent, probeTimeoutMs);
  return normalizeUrl(final) ?? candidate;
}
