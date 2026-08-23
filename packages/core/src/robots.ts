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

/**
 * Reduce a User-Agent *header* to the product token robots.txt groups are
 * written against.
 *
 * `robots-parser` expects a token, not a header: internally it lowercases
 * the value and truncates at the first `/`. Handing it the full preset
 * header `Mozilla/5.0 (compatible; Googlebot/2.1; +http://…)` therefore
 * matched against `mozilla`, which appears in no robots.txt — so NO
 * crawler-specific group ever applied and everything silently fell through
 * to `User-agent: *`. A site with `User-agent: Googlebot / Disallow: /`
 * was crawled in full and every page reported Indexable.
 *
 * `compatible; <token>` is the conventional place a bot names itself; when
 * it is absent, the leading product token is the right answer
 * (`FreeCrawlSEO/0.1 (+…)` → `FreeCrawlSEO`).
 */
export function robotsUserAgentToken(userAgent: string): string {
  const compat = /compatible;\s*([A-Za-z0-9._*-]+)/i.exec(userAgent);
  if (compat?.[1]) return compat[1];
  const leading = userAgent.trim().split(/[/\s;(]/)[0];
  return leading && leading.length > 0 ? leading : userAgent;
}

export async function loadRobots(
  origin: string,
  userAgent: string,
  /** Optional notice sink. Called when robots.txt returns a server error
   *  (5xx): RFC 9309 says a crawler SHOULD then treat the whole site as
   *  disallowed, but we keep crawling (allow-all) so a transient 503 — very
   *  common behind Cloudflare — doesn't silently nuke the entire crawl. The
   *  caller surfaces this so the choice is visible rather than hidden. */
  onNotice?: (message: string) => void,
): Promise<RobotsChecker> {
  // The header goes on the wire; only the token goes to the matcher.
  const uaToken = robotsUserAgentToken(userAgent);
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
        isAllowed: (url: string) => parser.isAllowed(url, uaToken) ?? true,
        getCrawlDelay: () => parser.getCrawlDelay(uaToken),
      };
    }
    if (res.status >= 500 && onNotice) {
      onNotice(
        `robots.txt for ${origin} returned HTTP ${res.status}. Per RFC 9309 a 5xx should be treated as "disallow all", but FreeCrawl continues crawling to avoid a transient server error blocking the whole run — verify the site is reachable if results look off.`,
      );
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
  // Same split as `loadRobots`: the full header identifies us on the wire,
  // the product token is what robots.txt groups are matched against. The
  // tester has to use the identical rule or it would report "allowed" for
  // URLs the crawler actually blocks, and vice versa.
  const uaToken = robotsUserAgentToken(userAgent);
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
      allowed: parser.isAllowed(probedUrl, uaToken) ?? true,
      crawlDelay: parser.getCrawlDelay(uaToken) ?? null,
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
      // RFC 9309 distinguishes the two: a 4xx ("unavailable") means allow
      // all; a 5xx ("unreachable") means a crawler SHOULD treat the site as
      // fully disallowed. FreeCrawl still crawls on a 5xx (so a transient
      // 503 doesn't nuke the run) but the message must not claim the RFC
      // says "allow" — state what actually happens per status.
      const is5xx = status !== null && status >= 500;
      return {
        url: probedUrl,
        robotsUrl,
        status,
        body: null,
        allowed: true,
        crawlDelay: null,
        sitemaps: [],
        error: is5xx
          ? `robots.txt returned HTTP ${status}. Per RFC 9309 a 5xx means "disallow all"; FreeCrawl still crawls to survive transient server errors, but a compliant crawler (Googlebot) would stop.`
          : `robots.txt returned HTTP ${status} (4xx = unavailable) — allow all, per RFC 9309.`,
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
    allowed: parser.isAllowed(probedUrl, uaToken) ?? true,
    crawlDelay: parser.getCrawlDelay(uaToken) ?? null,
    sitemaps,
    error: null,
  };
}

/**
 * One issue surfaced by `validateRobotsTxt`. Lines are 1-indexed
 * (matching what the user sees in the editor gutter); `severity`
 * separates "this will be ignored" (warning) from "this changes
 * crawler behaviour" (error). `directive` carries the lowercased
 * directive name when one was recognised, else null.
 */
export interface RobotsValidationIssue {
  line: number;
  severity: 'error' | 'warning';
  message: string;
  directive: string | null;
}

const KNOWN_DIRECTIVES = new Set([
  // Core RFC 9309 directives.
  'user-agent',
  'disallow',
  'allow',
  // Widely-supported extensions Googlebot and most major crawlers honour.
  'sitemap',
  'crawl-delay',
  // Yandex-specific but commonly seen — not an error, only an info-level
  // reminder isn't useful at this granularity, so we accept silently.
  'host',
  'clean-param',
  // Very common typos / case-folded: 'noindex' was historically used
  // here but Google formally dropped it in 2019. We warn rather than
  // error because it's not actively harmful.
  'noindex',
]);

const TYPO_DIRECTIVES: Record<string, string> = {
  disalow: 'disallow',
  dissalow: 'disallow',
  dissallow: 'disallow',
  alow: 'allow',
  allwo: 'allow',
  'user-agnet': 'user-agent',
  useragent: 'user-agent',
  'crawldelay': 'crawl-delay',
  sitmap: 'sitemap',
  sitemaps: 'sitemap',
};

/**
 * Lint a robots.txt body and return per-line issues. Pure / network-
 * free / sync — safe to call from IPC handlers without timeout
 * worries. Validates:
 *   - Unknown directives (with a near-miss suggestion when one matches
 *     a common typo).
 *   - Missing `:` separator (e.g. `Disallow /admin` instead of
 *     `Disallow: /admin`).
 *   - `Disallow` / `Allow` rules appearing before any `User-agent`
 *     group is opened — these rules are silently dropped by parsers.
 *   - Sitemap references that are not absolute URLs (RFC 9309 §2.2.4
 *     requires absolute URIs).
 *   - `Crawl-delay` values that are not valid non-negative numbers.
 *   - Wildcards (`*` / `$`) used anywhere other than path patterns
 *     where browsers honour them — `User-agent: foo*` is fine but
 *     `User-agent: foo*bar` is non-portable.
 *
 * Returns an empty array when the body is well-formed.
 */
export function validateRobotsTxt(text: string): RobotsValidationIssue[] {
  const issues: RobotsValidationIssue[] = [];
  const lines = text.split(/\r?\n/);
  let groupOpen = false; // any `User-agent:` line seen yet?
  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const raw = lines[i] ?? '';
    // Strip BOM on first line — some Windows editors prepend U+FEFF.
    const noBom = i === 0 ? raw.replace(/^\uFEFF/, '') : raw;
    // Strip trailing CR (handled by split, but defensive) + comments.
    // Comments start at `#` and consume the rest of the line (including
    // `#` mid-line); per RFC 9309 §2.2 leading whitespace is allowed.
    const noComment = noBom.replace(/#.*$/, '');
    const trimmed = noComment.trim();
    if (trimmed === '') continue;

    // RFC 9309 line shape: `<directive>:<value>` with optional whitespace.
    // The colon is mandatory — without it the line is silently skipped
    // by every major parser, so flag it.
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx <= 0) {
      issues.push({
        line: lineNo,
        severity: 'error',
        message:
          'Missing `:` separator. Robots.txt directives must be `<name>: <value>`.',
        directive: null,
      });
      continue;
    }

    const directive = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const value = trimmed.slice(colonIdx + 1).trim();

    if (directive === '') {
      issues.push({
        line: lineNo,
        severity: 'error',
        message: 'Empty directive name before `:`.',
        directive: null,
      });
      continue;
    }

    // Unknown directive — but if it looks like a typo of a known one,
    // surface the suggestion so the user can fix faster.
    if (!KNOWN_DIRECTIVES.has(directive)) {
      const suggestion = TYPO_DIRECTIVES[directive];
      issues.push({
        line: lineNo,
        severity: 'warning',
        message: suggestion
          ? `Unknown directive "${directive}" — did you mean "${suggestion}"?`
          : `Unknown directive "${directive}". Crawlers will ignore this line.`,
        directive,
      });
      // Still allow the rest of the validators to run on this line so
      // the user sees every issue, not just the first.
    }

    // Directive-specific checks.
    switch (directive) {
      case 'user-agent':
        if (value === '') {
          issues.push({
            line: lineNo,
            severity: 'error',
            message: '`User-agent:` value is empty.',
            directive,
          });
        } else if (/[*$].*[^*$]/.test(value) && value !== '*') {
          // Wildcards mid-token (e.g. `foo*bar`) are non-portable.
          issues.push({
            line: lineNo,
            severity: 'warning',
            message:
              'User-agent wildcards are only widely supported as a single `*`. Mid-token wildcards may not match.',
            directive,
          });
        }
        groupOpen = true;
        break;

      case 'disallow':
      case 'allow':
        if (!groupOpen) {
          issues.push({
            line: lineNo,
            severity: 'error',
            message:
              '`Disallow` / `Allow` must come after a `User-agent:` line — orphan rules are dropped.',
            directive,
          });
        }
        // Empty `Disallow:` is the canonical "allow everything" idiom — accept.
        break;

      case 'sitemap': {
        if (value === '') {
          issues.push({
            line: lineNo,
            severity: 'error',
            message: '`Sitemap:` value is empty.',
            directive,
          });
          break;
        }
        try {
          const u = new URL(value);
          if (u.protocol !== 'http:' && u.protocol !== 'https:') {
            issues.push({
              line: lineNo,
              severity: 'warning',
              message: `Sitemap URL uses scheme "${u.protocol}" — most crawlers only accept http/https.`,
              directive,
            });
          }
        } catch {
          issues.push({
            line: lineNo,
            severity: 'error',
            message:
              'Sitemap value must be an absolute URL (e.g. `https://example.com/sitemap.xml`).',
            directive,
          });
        }
        break;
      }

      case 'crawl-delay': {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          issues.push({
            line: lineNo,
            severity: 'error',
            message: '`Crawl-delay:` must be a non-negative number (seconds).',
            directive,
          });
        }
        break;
      }

      case 'noindex':
        issues.push({
          line: lineNo,
          severity: 'warning',
          message:
            '`Noindex` in robots.txt was deprecated by Google in 2019 — use a `<meta name="robots">` or `X-Robots-Tag` header instead.',
          directive,
        });
        break;
    }
  }
  return issues;
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
