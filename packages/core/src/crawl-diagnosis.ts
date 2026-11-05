import type { CrawlConfig, CrawlProgress } from '@freecrawl/shared-types';

/**
 * Crawl health numbers the diagnosis reads — one cheap pass over `urls`
 * (`ProjectDb.crawlHealthStats`). Internal URLs only unless noted.
 */
export interface CrawlHealthStats {
  /** Internal URLs with any row (crawled, failed or pending stub). */
  internalUrls: number;
  /** Internal URLs that got an HTTP status. */
  answered: number;
  /** Internal HTML pages with a 2xx answer. */
  htmlOk: number;
  status429: number;
  status503: number;
  /** 5xx other than 503. */
  status5xx: number;
  status403: number;
  /** No HTTP answer at all (timeout, refused, DNS). */
  noResponse: number;
  /** …of which the stored error mentions a timeout. */
  timeouts: number;
  botBlocked: number;
  robotsBlocked: number;
  /** HTML 2xx pages with fewer than 50 words. */
  thinHtml: number;
  /** HTML pages whose navigation is JavaScript-only. */
  jsOnlyNav: number;
  /** URLs flagged as crawl traps. */
  traps: number;
  /** Internal URLs carrying a query string. */
  withQuery: number;
  /** Deepest depth reached, and how many internal URLs sit at it. */
  maxDepthReached: number;
  atMaxDepth: number;
  /** The start URL's own row, when stored. */
  start: { status: number | null; redirectTarget: string | null } | null;
  /** The most frequent no-response error texts. */
  topErrors: { text: string; count: number }[];
}

export type DiagnosisSeverity = 'error' | 'warning' | 'info';

export interface DiagnosisFinding {
  id: string;
  severity: DiagnosisSeverity;
  title: string;
  /** The numbers that triggered it. */
  evidence: string;
  /** What to do, in plain words. */
  suggestion: string;
  /** Config fields to change — pass to `set_crawl_config` (merged onto the
   *  current config). Absent when the fix is not a setting. */
  configChanges?: Partial<CrawlConfig>;
  /** Another MCP tool to call, e.g. `resume_crawl`. */
  nextTool?: string;
}

export interface CrawlDiagnosis {
  /** `healthy` when nothing above info level was found. */
  status: 'healthy' | 'warning' | 'problem';
  summary: string;
  findings: DiagnosisFinding[];
}

const pct = (n: number, d: number): string => (d > 0 ? `${((n / d) * 100).toFixed(1)}%` : '0%');

/**
 * Turn crawl state into findings an agent (or a person) can act on —
 * rate limiting, a silent host, bot protection, timeouts, limits hit,
 * a JavaScript-only site crawled without rendering, traps. Pure: the
 * caller gathers `stats` / `progress` / `config`; either of the last two
 * may be null (desktop not running, no crawl this session).
 */
export function diagnoseCrawl(input: {
  stats: CrawlHealthStats;
  progress: CrawlProgress | null;
  config: CrawlConfig | null;
}): CrawlDiagnosis {
  const { stats: s, progress: p, config: c } = input;
  const f: DiagnosisFinding[] = [];
  const answered = Math.max(1, s.answered);

  if (p?.paused && p.pausedReason === 'host-unresponsive') {
    f.push({
      id: 'host-unresponsive',
      severity: 'error',
      title: 'The crawl paused itself: the site stopped responding',
      evidence: `Paused with ${p.pending.toLocaleString()} URLs pending; ${s.noResponse.toLocaleString()} requests got no answer.`,
      suggestion:
        'Check that the site is up and is not blocking this machine (WAF, firewall). Slow the crawl down before resuming.',
      configChanges: c
        ? {
            maxRps: Math.max(1, Math.floor(c.maxRps / 2)),
            maxConcurrency: Math.max(1, Math.floor(c.maxConcurrency / 2)),
          }
        : undefined,
      nextTool: 'resume_crawl',
    });
  }

  const limited = Math.max(s.status429 + s.status503, p?.rateLimitedCount ?? 0);
  if (limited > 5) {
    const adaptiveOff = c ? !c.adaptiveSpeed : false;
    f.push({
      id: 'rate-limited',
      severity: 'warning',
      title: 'The site is rate-limiting the crawl (429 / 503)',
      evidence: `${limited.toLocaleString()} answers were 429 Too Many Requests or 503 Service Unavailable.`,
      suggestion: adaptiveOff
        ? 'Turn on Adaptive speed so the crawl slows down while the server pushes back and speeds up again afterwards. It can be switched on for the running crawl.'
        : 'Adaptive speed is on; if pages still fail, lower the maximum rate and concurrency.',
      configChanges: c
        ? adaptiveOff
          ? { adaptiveSpeed: true }
          : {
              maxRps: Math.max(1, Math.floor(c.maxRps / 2)),
              maxConcurrency: Math.max(1, Math.floor(c.maxConcurrency / 2)),
            }
        : undefined,
    });
  }

  if (s.botBlocked > 0) {
    f.push({
      id: 'bot-protection',
      severity: s.botBlocked > answered * 0.05 ? 'error' : 'warning',
      title: 'Bot protection answered instead of the page',
      evidence: `${s.botBlocked.toLocaleString()} URLs got a challenge or block page (${pct(s.botBlocked, answered)} of answered).`,
      suggestion:
        'Lower the crawl speed, ask the site owner to allowlist the crawler, or use a browser User-Agent / JavaScript rendering. Blocked pages are re-tried at the end of the crawl.',
      configChanges: c
        ? {
            maxRps: Math.min(c.maxRps, 2),
            maxConcurrency: Math.min(c.maxConcurrency, 2),
            adaptiveSpeed: true,
          }
        : undefined,
    });
  }

  if (s.status403 > Math.max(10, answered * 0.2)) {
    f.push({
      id: 'forbidden',
      severity: 'warning',
      title: 'Many pages answer 403 Forbidden',
      evidence: `${s.status403.toLocaleString()} URLs (${pct(s.status403, answered)} of answered) returned 403.`,
      suggestion:
        'A firewall often blocks unknown crawlers with 403. Try a browser User-Agent, slow down, or crawl through a proxy the site allows.',
    });
  }

  if (s.timeouts > Math.max(5, answered * 0.05)) {
    const timeoutMs = c?.requestTimeoutMs ?? 0;
    f.push({
      id: 'timeouts',
      severity: 'warning',
      title: 'Requests are timing out',
      evidence: `${s.timeouts.toLocaleString()} requests timed out${timeoutMs ? ` (timeout ${Math.round(timeoutMs / 1000)} s)` : ''}.`,
      suggestion:
        'The server is slow under this load. Raise the request timeout and lower concurrency so fewer requests compete.',
      configChanges: c
        ? {
            requestTimeoutMs: Math.max(c.requestTimeoutMs, 30_000),
            maxConcurrency: Math.max(1, Math.floor(c.maxConcurrency / 2)),
          }
        : undefined,
    });
  } else if (s.noResponse > Math.max(10, answered * 0.05)) {
    const top = s.topErrors[0];
    f.push({
      id: 'no-response',
      severity: 'warning',
      title: 'Many requests got no answer',
      evidence: `${s.noResponse.toLocaleString()} requests failed without an HTTP status${top ? ` (most common: "${top.text}" ×${top.count})` : ''}.`,
      suggestion:
        'Connection resets and refusals usually mean a firewall or an overloaded server. Slow down and allow more connection retries.',
      configChanges: c
        ? {
            connectionFailureRetries: Math.max(c.connectionFailureRetries ?? c.retryAttempts, 3),
            maxConcurrency: Math.max(1, Math.floor(c.maxConcurrency / 2)),
          }
        : undefined,
    });
  }

  if (s.status5xx > Math.max(5, answered * 0.05)) {
    f.push({
      id: 'server-errors',
      severity: 'warning',
      title: 'The server returns 5xx errors',
      evidence: `${s.status5xx.toLocaleString()} URLs answered with a 5xx status other than 503.`,
      suggestion:
        'If these pages work in a browser, the server is struggling under the crawl: lower the rate. Otherwise they are real errors to fix on the site.',
    });
  }

  if (c && c.maxUrls > 0 && s.internalUrls >= c.maxUrls) {
    f.push({
      id: 'max-urls',
      severity: 'warning',
      title: 'The crawl hit its URL limit',
      evidence: `${s.internalUrls.toLocaleString()} internal URLs stored; the limit is ${c.maxUrls.toLocaleString()}.`,
      suggestion: 'Raise the URL limit to crawl the rest of the site.',
      configChanges: { maxUrls: c.maxUrls * 2 },
    });
  }

  if (c && s.atMaxDepth > 0 && s.maxDepthReached >= c.maxDepth && c.maxDepth < 50) {
    f.push({
      id: 'max-depth',
      severity: 'info',
      title: 'Pages were found at the depth limit',
      evidence: `${s.atMaxDepth.toLocaleString()} URLs sit at depth ${c.maxDepth}, the configured maximum — their links were not followed.`,
      suggestion: 'Raise the maximum depth if deeper pages should be included.',
      configChanges: { maxDepth: c.maxDepth + 5 },
    });
  }

  const htmlOk = Math.max(1, s.htmlOk);
  if (
    c &&
    c.renderingMode !== 'js' &&
    s.htmlOk >= 3 &&
    (s.thinHtml > htmlOk * 0.6 || s.jsOnlyNav > htmlOk * 0.3)
  ) {
    f.push({
      id: 'javascript-site',
      severity: 'warning',
      title: 'The site looks JavaScript-rendered, but rendering is off',
      evidence: `${pct(s.thinHtml, htmlOk)} of pages have under 50 words and ${pct(s.jsOnlyNav, htmlOk)} use JavaScript-only navigation in the raw HTML.`,
      suggestion:
        'Switch the rendering mode to JavaScript so the crawler sees the content and links a browser sees.',
      configChanges: { renderingMode: 'js' },
    });
  }

  if (s.robotsBlocked > Math.max(20, s.internalUrls * 0.1)) {
    f.push({
      id: 'robots-blocked',
      severity: 'info',
      title: 'robots.txt blocks a large part of the site',
      evidence: `${s.robotsBlocked.toLocaleString()} URLs (${pct(s.robotsBlocked, s.internalUrls)}) are disallowed by robots.txt.`,
      suggestion:
        'Check the rules with robots_test. Ignore robots.txt only on a site you are allowed to crawl that way.',
      nextTool: 'robots_test',
    });
  }

  if (s.traps > 0) {
    f.push({
      id: 'crawl-traps',
      severity: 'info',
      title: 'Crawl traps were detected',
      evidence: `${s.traps.toLocaleString()} URLs look like a trap (repeating path segments, endless parameters, session ids or a calendar).`,
      suggestion: 'Exclude the trap pattern so the crawl budget goes to real pages.',
    });
  }

  if (s.internalUrls > 200 && s.withQuery > s.internalUrls * 0.5) {
    f.push({
      id: 'query-strings',
      severity: 'info',
      title: 'Most URLs carry query strings',
      evidence: `${pct(s.withQuery, s.internalUrls)} of internal URLs have parameters — usually faceted filters or sorting.`,
      suggestion:
        'Stop crawling query-string URLs, or exclude the filter links by position / selector.',
      configChanges: { crawlQueryStrings: false },
    });
  }

  if (
    s.start &&
    s.start.status !== null &&
    s.start.status >= 300 &&
    s.start.status < 400 &&
    s.start.redirectTarget
  ) {
    let otherHost = false;
    try {
      otherHost =
        c !== null && new URL(s.start.redirectTarget).hostname !== new URL(c.startUrl).hostname;
    } catch {
      otherHost = false;
    }
    if (otherHost) {
      f.push({
        id: 'start-redirect',
        severity: 'warning',
        title: 'The start URL redirects to another host',
        evidence: `The start URL answered ${s.start.status} → ${s.start.redirectTarget}.`,
        suggestion: 'Start from the final address, or widen the scope to all subdomains.',
        configChanges: { startUrl: s.start.redirectTarget },
      });
    }
  } else if (p && !p.running && s.answered > 0 && s.answered <= 3 && s.start?.status !== null) {
    f.push({
      id: 'tiny-crawl',
      severity: 'warning',
      title: 'The crawl stopped after very few pages',
      evidence: `Only ${s.answered} URL(s) were fetched.`,
      suggestion:
        'Check the start page for noindex/nofollow, links that need JavaScript, robots.txt rules, or include/exclude patterns that filter everything out.',
    });
  }

  const rank: Record<DiagnosisSeverity, number> = { error: 0, warning: 1, info: 2 };
  f.sort((a, b) => rank[a.severity] - rank[b.severity]);
  const status = f.some((x) => x.severity === 'error')
    ? 'problem'
    : f.some((x) => x.severity === 'warning')
      ? 'warning'
      : 'healthy';
  const summary =
    status === 'healthy'
      ? `No crawl problems found (${s.answered.toLocaleString()} URLs answered).`
      : `${f.length} finding(s): ${f.map((x) => x.title).join('; ')}.`;
  return { status, summary, findings: f };
}
