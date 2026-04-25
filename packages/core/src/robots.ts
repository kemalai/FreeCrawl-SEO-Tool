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
): Promise<RobotsTestResult> {
  let origin = '';
  let robotsUrl = '';
  try {
    origin = new URL(url).origin;
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
        url,
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
      url,
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
    url,
    robotsUrl,
    status,
    body,
    allowed: parser.isAllowed(url, userAgent) ?? true,
    crawlDelay: parser.getCrawlDelay(userAgent) ?? null,
    sitemaps,
    error: null,
  };
}
