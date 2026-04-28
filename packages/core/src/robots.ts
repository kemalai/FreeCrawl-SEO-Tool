import { fetch as undiciFetch } from 'undici';
import robotsParser from 'robots-parser';
import { formatFetchError } from './http-client.js';

export interface RobotsChecker {
  isAllowed(url: string): boolean;
  getCrawlDelay(): number | undefined;
}

const NOOP: RobotsChecker = {
  isAllowed: () => true,
  getCrawlDelay: () => undefined,
};

export async function loadRobots(origin: string, userAgent: string): Promise<RobotsChecker> {
  const robotsUrl = new URL('/robots.txt', origin).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await undiciFetch(robotsUrl, {
      method: 'GET',
      headers: { 'user-agent': userAgent },
      signal: controller.signal,
    });
    if (res.ok) {
      const body = await res.text();
      const parser = robotsParser(robotsUrl, body);
      return {
        isAllowed: (url: string) => parser.isAllowed(url, userAgent) ?? true,
        getCrawlDelay: () => parser.getCrawlDelay(userAgent),
      };
    }
  } catch {
    // ignore — default allow
  } finally {
    clearTimeout(timeout);
  }
  return NOOP;
}

export interface RobotsTestResult {
  /** The URL that was checked. */
  url: string;
  /** `<scheme>//<host>/robots.txt` location we attempted to fetch. */
  robotsUrl: string;
  /** HTTP status code of the robots.txt fetch (null if it failed entirely). */
  status: number | null;
  /** robots.txt body (truncated to 8 KB) — null on fetch failure. */
  body: string | null;
  /** True if `parser.isAllowed(url, ua) === true`. Defaults to `true` on missing/error. */
  allowed: boolean;
  /** Crawl-Delay value declared for this user-agent, if any. */
  crawlDelay: number | null;
  /** Sitemap directives found in the robots.txt body. */
  sitemaps: string[];
  /** Network / parse error text (null on success). */
  error: string | null;
}

/**
 * Standalone "did robots.txt allow this URL?" probe — used by the in-app
 * Robots Tester dialog. Unlike `loadRobots` (which silently treats every
 * failure as "allowed by default"), this surfaces every step so the user
 * can see exactly why a URL was blocked or, conversely, why robots.txt
 * couldn't be loaded.
 */
export async function testUrlAgainstRobots(
  url: string,
  userAgent: string,
  customRobotsBody?: string,
): Promise<RobotsTestResult> {
  // Be lenient about input — users routinely paste bare hosts like
  // `gamesatis.com`, `www.example.com/foo`, or `//host/path`. Prepend
  // `https://` when the scheme is missing so `new URL()` succeeds.
  const probedUrl = normalizeRobotsTestInput(url);
  let origin = '';
  let robotsUrl = '';
  try {
    origin = new URL(probedUrl).origin;
    robotsUrl = new URL('/robots.txt', origin).toString();
  } catch {
    return {
      url,
      robotsUrl: '',
      status: null,
      body: null,
      allowed: true,
      crawlDelay: null,
      sitemaps: [],
      error: 'Invalid URL — cannot derive robots.txt location.',
    };
  }

  // Custom-policy mode: skip the network entirely and parse the user's
  // pasted robots.txt against the URL. Useful for testing a draft
  // before deploying it. We still emit `robotsUrl` (the live one) for
  // reference but tag the body source as `<custom>`.
  if (customRobotsBody !== undefined) {
    const body = customRobotsBody.length > 8192
      ? customRobotsBody.slice(0, 8189) + '...'
      : customRobotsBody;
    const parser = robotsParser(robotsUrl, body);
    const sitemaps: string[] = [];
    for (const line of body.split(/\r?\n/)) {
      const m = /^\s*sitemap\s*:\s*(\S+)/i.exec(line);
      if (m && m[1]) sitemaps.push(m[1]);
    }
    return {
      url: probedUrl,
      robotsUrl: '<custom>',
      status: 0,
      body,
      allowed: parser.isAllowed(probedUrl, userAgent) ?? true,
      crawlDelay: parser.getCrawlDelay(userAgent) ?? null,
      sitemaps,
      error: null,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  let status: number | null = null;
  let body: string | null = null;
  try {
    const res = await undiciFetch(robotsUrl, {
      method: 'GET',
      headers: { 'user-agent': userAgent },
      redirect: 'follow',
      signal: controller.signal,
    });
    status = res.status;
    if (res.ok) {
      const raw = await res.text();
      body = raw.length > 8192 ? raw.slice(0, 8189) + '...' : raw;
    } else {
      try {
        await res.body?.cancel();
      } catch {
        /* ignore */
      }
      // Per the robots.txt RFC: any non-success makes the site "allow all"
      // for crawlers. Reflect that explicitly.
      return {
        url: probedUrl,
        robotsUrl,
        status,
        body: null,
        allowed: true,
        crawlDelay: null,
        sitemaps: [],
        error: `robots.txt returned HTTP ${status} — defaulting to allow.`,
      };
    }
  } catch (err) {
    return {
      url: probedUrl,
      robotsUrl,
      status,
      body: null,
      allowed: true,
      crawlDelay: null,
      sitemaps: [],
      error: `Could not fetch robots.txt: ${formatFetchError(err)}`,
    };
  } finally {
    clearTimeout(timeout);
  }

  const parser = robotsParser(robotsUrl, body ?? '');
  const sitemaps: string[] = [];
  if (body) {
    for (const line of body.split(/\r?\n/)) {
      const m = /^\s*sitemap\s*:\s*(\S+)/i.exec(line);
      if (m && m[1]) sitemaps.push(m[1]);
    }
  }
  return {
    url: probedUrl,
    robotsUrl,
    status,
    body,
    allowed: parser.isAllowed(probedUrl, userAgent) ?? true,
    crawlDelay: parser.getCrawlDelay(userAgent) ?? null,
    sitemaps,
    error: null,
  };
}

/**
 * Coerce flexible user input into a fully-qualified URL.
 *  - `gamesatis.com`        → `https://gamesatis.com/`
 *  - `www.example.com/foo`  → `https://www.example.com/foo`
 *  - `//host/path`          → `https://host/path`
 *  - `http://x` / `https://x` → unchanged
 *  - `mailto:x` / `ftp://x` etc. → unchanged (we'll fail later in `new URL`
 *    if we can't derive an http/https origin, which is the right outcome)
 *
 * The `(?!\d+:)` negative lookahead avoids treating `1.2.3.4:8080` as a
 * scheme — a port-only host should still get the https prefix.
 */
function normalizeRobotsTestInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  // Real scheme present — accept as-is. Match `[a-z][a-z0-9+.-]*:` per RFC
  // 3986, but exclude pure-numeric `:` (port shorthand) so we don't
  // mistake `1.2.3.4:8080` for an unknown scheme.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^\d+:/.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
