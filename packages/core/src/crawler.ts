import { EventEmitter } from 'node:events';
import * as os from 'node:os';
import { fetch as undiciFetch, type Dispatcher } from 'undici';
import { load as cheerioLoad } from 'cheerio';
import PQueue from 'p-queue';
import type {
  ContentKind,
  CrawlConfig,
  CrawlProgress,
  CrawlScope,
  CrawlSummary,
  DiscoveredLink,
  Indexability,
} from '@freecrawl/shared-types';
import { type ProjectDb, EXPENSIVE_ISSUE_DEFINITIONS } from '@freecrawl/db';
import {
  normalizeUrl,
  isSameHost,
  extractExtension,
  isInScope,
  isPrivateHost,
  isUrlMalformed,
  detectUrlTrap,
  resolveStartUrl,
  compileUrlRegexRewrites,
  toEscapedFragmentUrl,
  type UrlRewriteOptions,
} from './url-utils.js';
import { parseHtml, estimatePixelWidth, type ParsedPage } from './html-parser.js';
import { analyseCookies, extractSetCookies } from './cookies.js';
import { loadRobots, robotsUserAgentToken, type RobotsChecker } from './robots.js';
import {
  BROWSER_FALLBACK_UA,
  buildDigestAuthHeader,
  buildLenientDispatcher,
  collectNetworkDiagnostics,
  defaultRequestHeaders,
  detectHttpProtocol,
  type DigestChallenge,
  formatFetchError,
  initHttpClient,
  MOBILE_USER_AGENT,
  parseDigestChallenge,
  redactUrlSecrets,
} from './http-client.js';
import { setActiveDnsHook } from './dns-resolver.js';
import { discoverSitemapUrls, fetchSitemaps, type SitemapEntry } from './sitemap.js';
import { runJsonExtractionRules } from './extraction.js';
import { SessionCookieJar } from './cookie-jar.js';
import { runBrowserLogin } from './browser-login.js';

export interface CrawlerEvents {
  progress: (p: CrawlProgress) => void;
  done: (summary: CrawlSummary) => void;
  /**
   * Fired exactly once when `stop()` transitions the crawler into the
   * stopped state. `done` is deliberately suppressed after a stop (a
   * zombie crawler's done-event would clobber the next crawl's UI
   * state), so hosts that need a "this crawl is over, whatever the
   * reason" signal must listen to BOTH `done` and `stopped` — e.g. the
   * desktop app's power-save blocker release.
   */
  stopped: () => void;
  error: (message: string) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
  debug: (message: string) => void;
}

interface QueueItem {
  url: string;
  depth: number;
  /** How many redirect hops led here (0 for items from link extraction). */
  redirectHopCount?: number;
  /**
   * Set only by `enqueueResources`, naming the Spider → Crawl row whose
   * "Crawl" box put this URL in the queue. The matching "Store" box then
   * decides whether the fetched resource keeps its URL row.
   *
   * Carried on the queue item rather than re-derived from the response's
   * content type at write time, because the two disagree exactly where it
   * matters: a `.zip` reached through an ordinary hyperlink and a `.mp4`
   * reached through `<video src>` both detect as `'other'`, and only the
   * second one is governed by "Store Media".
   *
   * Absent for links, sitemap entries, redirect hops, and the resources
   * mined out of stylesheets — none of those are gated on storage.
   */
  resourceRow?: 'image' | 'css' | 'js' | 'media';
  /**
   * Fetch this URL and record it, but do not follow anything it links to.
   * Set by "Check Links Outside of Start Folder": the point of that
   * option is to learn a status code, not to leave the start folder.
   *
   * A leaf flag rather than an inflated depth, so the URL's reported
   * crawl depth stays the number of hops it actually took to reach.
   */
  checkOnly?: boolean;
}

const EXT_TO_KIND: Record<string, ContentKind> = {
  // HTML-ish page extensions. Reached only when the response carried no
  // usable Content-Type (WAF/CDN block pages, some misconfigured origins);
  // without these entries a `/urun.php` or `/page.html` with a missing
  // Content-Type fell to `'other'` and vanished from every
  // content_kind='html' issue filter — the page silently disappeared from
  // the audit.
  html: 'html',
  htm: 'html',
  xhtml: 'html',
  php: 'html',
  asp: 'html',
  aspx: 'html',
  jsp: 'html',
  css: 'css',
  js: 'js',
  mjs: 'js',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  ico: 'image',
  pdf: 'pdf',
  woff: 'font',
  woff2: 'font',
  ttf: 'font',
  otf: 'font',
};

// Statuses a HEAD request often reports that differ from a real GET: many
// CDNs/WAFs answer a HEAD with 403/405 but a GET with 200 (e.g. Netflix
// HEAD 403 / GET 200). Retry these — plus any 5xx or transport failure —
// with GET before recording, so the status matches what a visitor sees.
// Module-scope so the external-probe hot path doesn't rebuild it per URL.
/** Memory-watchdog samples (2 s apart) to wait for RSS to fall back below
 *  the resume threshold before concluding it never will — 5 minutes. */
const MEMORY_STUCK_SAMPLES = 150;

const HEAD_UNRELIABLE_STATUSES = new Set([
  400, 401, 403, 405, 406, 409, 429, 501,
]);

// Known X-Robots-Tag directive keywords. Anything else appearing before a
// colon is a bot name (`googlebot: noindex`), not a directive — but a real
// directive can ALSO carry a colon (`unavailable_after: <date>`,
// `max-snippet: -1`), so "has a colon → bot-scoped" is wrong. Membership
// here is how we tell the two apart.
const X_ROBOTS_DIRECTIVES = new Set([
  'all',
  'noindex',
  'index',
  'nofollow',
  'follow',
  'none',
  'noarchive',
  'nosnippet',
  'noimageindex',
  'notranslate',
  'unavailable_after',
  'max-snippet',
  'max-image-preview',
  'max-video-preview',
  'indexifembedded',
]);

/**
 * Which of `noindex` / `nofollow` an `X-Robots-Tag` header applies to US.
 *
 * The header may scope directives to a specific bot
 * (`X-Robots-Tag: bingbot: noindex`), which only that bot honours. The old
 * check was `header.includes('noindex')`, so a `bingbot: noindex` marked a
 * page non-indexable that Google indexes fine. Honour a directive only when
 * it is un-scoped (applies to every bot) or scoped to a bot we model: the
 * crawl's own UA token, or Googlebot (the indexer the Indexability column
 * fundamentally represents — consistent with the meta-robots handling).
 *
 * `none` is the shorthand for `noindex, nofollow`.
 */
export function xRobotsTagDirectives(
  header: string,
  uaToken: string,
): { noindex: boolean; nofollow: boolean } {
  const ua = uaToken.toLowerCase();
  let noindex = false;
  let nofollow = false;
  const apply = (directives: string): void => {
    if (/\bnone\b/.test(directives)) {
      noindex = true;
      nofollow = true;
      return;
    }
    if (/\bnoindex\b/.test(directives)) noindex = true;
    if (/\bnofollow\b/.test(directives)) nofollow = true;
  };
  for (const rawSegment of header.split(',')) {
    const segment = rawSegment.trim().toLowerCase();
    if (!segment) continue;
    const colon = segment.indexOf(':');
    if (colon > 0) {
      const head = segment.slice(0, colon).trim();
      // `head` is a bot name only if it isn't itself a directive keyword
      // (which would mean this is a valued directive like `max-snippet: 5`).
      if (!X_ROBOTS_DIRECTIVES.has(head)) {
        if (head !== 'googlebot' && head !== ua) continue; // other bot
        apply(segment.slice(colon + 1));
        continue;
      }
    }
    apply(segment); // un-scoped
  }
  return { noindex, nofollow };
}

/** Back-compat convenience wrapper. */
export function xRobotsTagNoindex(header: string, uaToken: string): boolean {
  return xRobotsTagDirectives(header, uaToken).noindex;
}

const CERT_VERIFY_ERROR_RE =
  /UNABLE_TO_VERIFY_LEAF_SIGNATURE|UNABLE_TO_GET_ISSUER_CERT_LOCALLY|SELF_SIGNED_CERT_IN_CHAIN|DEPTH_ZERO_SELF_SIGNED_CERT|CERT_UNTRUSTED/;
function isCertVerifyError(err: unknown): boolean {
  return CERT_VERIFY_ERROR_RE.test(formatFetchError(err));
}

// DNS / TCP-connect failures are method- and UA-independent — a browser-UA
// GET can't recover them, so retrying only doubles the wait on a dead host.
// (HTTP/2 resets, headers-timeouts and 4xx/5xx statuses CAN differ on GET,
// so those still get the retry.)
const HARD_TRANSPORT_ERROR_RE =
  /ENOTFOUND|EAI_AGAIN|ENODATA|ESERVFAIL|ECONNREFUSED|UND_ERR_CONNECT_TIMEOUT/;
function isHardTransportError(err: unknown): boolean {
  return HARD_TRANSPORT_ERROR_RE.test(formatFetchError(err));
}

export class Crawler extends EventEmitter {
  private config: CrawlConfig;
  private readonly db: ProjectDb;
  private queue: PQueue;
  private externalQueue: PQueue;
  private seen = new Set<string>();
  private externalSeen = new Set<string>();
  private pending = 0;
  private crawled = 0;
  private failed = 0;
  private totalResponseTimeMs = 0;
  private responseSamples = 0;
  private startedAt = 0;
  private stopped = false;
  private running = false;
  private paused = false;
  /**
   * Tracks "the queue is paused because the memory soft cap was hit, not
   * because the user clicked Pause." Lets the memory monitor resume only
   * the auto-pauses it caused, never overriding a user pause.
   */
  private memoryAutoPaused = false;
  private memoryMonitorTimer: NodeJS.Timeout | null = null;
  /**
   * Live AbortControllers for in-flight HTTP fetches in the main URL
   * pipeline. Pause / Stop abort every member so the crawl actually
   * stops instead of letting `concurrency` (often 20) more URLs land
   * in the table after the user clicked the button. Each call site
   * adds itself in `try` and removes itself in `finally`.
   */
  private inFlightFetchControllers = new Set<AbortController>();
  /** Authenticated session cookies established by the pre-crawl form-login
   *  sequence, replayed on every request. Null when form login is off. */
  private sessionJar: SessionCookieJar | null = null;
  private robots: RobotsChecker | null = null;
  /**
   * robots.txt checker per ORIGIN. A single start-origin checker was wrong
   * for cross-protocol (http vs https of the same host) and subdomain /
   * all-subdomains crawls: robots-parser returns `undefined` for a URL whose
   * origin doesn't match the file it parsed, which `?? true` turned into
   * "allowed", so those URLs bypassed robots entirely. Each origin now gets
   * its own checker, loaded lazily and cached.
   */
  private robotsByOrigin = new Map<string, RobotsChecker>();
  /** Origins whose robots.txt fetch is in flight (load-once guard). */
  private robotsLoadingOrigins = new Set<string>();
  /** robots.txt `Crawl-delay` for the start origin, in ms (0 = none). */
  private robotsCrawlDelayMs = 0;
  /** Monotonic dispatch clock for the maxRps gate (see acquireRateSlot). */
  private nextDispatchAt = 0;
  private progressTimer: NodeJS.Timeout | null = null;
  private memoryWatchdogTimer: NodeJS.Timeout | null = null;
  /** Periodic post-crawl-style recompute of expensive issue counters
   * while the crawl is still running, so the sidebar number is < 30 s
   * stale instead of "0 until crawl ends". The recompute is dispatched
   * to the writer-worker via the injected `recomputeIssues` hook, so
   * it does NOT block the main thread — the freezes that an earlier
   * version produced were a result of running the recompute inline on
   * the main-thread writer connection, which has since been fixed. */
  private issueRecomputeTimer: NodeJS.Timeout | null = null;
  private static readonly ISSUE_RECOMPUTE_INTERVAL_MS = 30_000;
  private issueRecomputeInFlight = false;
  private startIssueRecomputeTimer(): void {
    if (this.issueRecomputeTimer) return;
    this.issueRecomputeTimer = setInterval(() => {
      if (this.stopped || !this.running || this.paused) return;
      // Drop overlapping ticks — on a 1M-URL DB the recompute can run
      // longer than the 30 s tick, and piling RPCs on the writer worker
      // would starve per-URL writes behind a queue of issue passes.
      if (this.issueRecomputeInFlight) return;
      this.issueRecomputeInFlight = true;
      // The injected hook routes through the writer worker in the
      // desktop host, so this is off-thread; main stays free to
      // service IPC and pump the crawl queue. CLI fallback runs the
      // yielding variant inline, which is fine for that context.
      void this.recomputeIssues(EXPENSIVE_ISSUE_DEFINITIONS)
        .catch((err) => {
          this.emit(
            'debug',
            `issue counter recompute failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        })
        .finally(() => {
          this.issueRecomputeInFlight = false;
        });
    }, Crawler.ISSUE_RECOMPUTE_INTERVAL_MS);
  }
  private stopIssueRecomputeTimer(): void {
    if (this.issueRecomputeTimer) {
      clearInterval(this.issueRecomputeTimer);
      this.issueRecomputeTimer = null;
    }
  }

  /** Wave 6 — Periodic checkpoint of the in-memory pending queue
   * (URLs already enqueued but not yet fetched). Survives process
   * crashes / OS reboots / OOM so the next launch can offer to
   * resume. We snapshot from `seen + pending`-tracked items rather
   * than poking p-queue's internals; the pending closure is captured
   * as a `Map<url, depth>` updated alongside `enqueue` / completion.
   * 30 s cadence balances recovery-loss window vs DB write pressure
   * — at 100 URL/s a 30 s window is at most 3000 dropped URLs that
   * the user has to re-fetch (cheap; their DB rows already exist as
   * link stubs so dedup catches duplicates). */
  private queueCheckpointTimer: NodeJS.Timeout | null = null;
  private static readonly QUEUE_CHECKPOINT_INTERVAL_MS = 30_000;
  /** Pending queue snapshot used by the checkpoint timer. Mirrors
   * what's in `this.queue` minus already-completed items. */
  private pendingItems = new Map<string, number>();
  /**
   * Enqueues and completions accumulated since the last checkpoint.
   * Shipping this delta instead of the whole of `pendingItems` is what
   * keeps the checkpoint proportional to crawl throughput: on a crawl
   * with a 200k-URL frontier the old full snapshot rebuilt a 200k-entry
   * array on the main thread, structured-cloned it to the writer worker
   * and re-inserted every row twice a minute, which blocked the writer
   * FIFO the per-URL page writes share and stalled the crawl loop for
   * tens of seconds each pass. The delta is a few hundred rows.
   */
  private queueAdded = new Map<string, number>();
  private queueRemoved = new Set<string>();
  /** First tick of a run does a full replace so the table starts in a
   *  known state; set again after a failed write to resynchronise. */
  private queueCheckpointNeedsFull = true;
  private startQueueCheckpointTimer(): void {
    if (this.queueCheckpointTimer) return;
    // A resumed run inherits rows written by the previous process, and
    // a fresh run may inherit a discarded checkpoint, so the first tick
    // always rebuilds from `pendingItems` rather than trusting the
    // table to match.
    this.queueCheckpointNeedsFull = true;
    this.queueAdded.clear();
    this.queueRemoved.clear();
    this.queueCheckpointTimer = setInterval(() => {
      if (this.stopped || !this.running) return;
      void this.flushQueueCheckpoint();
      // Piggyback the planner-statistics refresh on the same tick. A
      // crawl starts with empty tables, so any plan chosen at row zero
      // assumes tables that never grow; `PRAGMA optimize` re-analyses
      // only what has actually drifted, so this is a no-op most ticks
      // and tens of milliseconds when it isn't.
      void this.dbCall<void>('optimize', []).catch(() => {
        /* statistics are an optimisation, never a correctness input */
      });
    }, Crawler.QUEUE_CHECKPOINT_INTERVAL_MS);
  }
  private async flushQueueCheckpoint(): Promise<void> {
    const full = this.queueCheckpointNeedsFull;
    if (!full && this.queueAdded.size === 0 && this.queueRemoved.size === 0) return;
    const patch = full
      ? {
          replaceAll: true,
          added: Array.from(this.pendingItems, ([url, depth]) => ({ url, depth })),
          removed: [],
        }
      : {
          replaceAll: false,
          added: Array.from(this.queueAdded, ([url, depth]) => ({ url, depth })),
          removed: Array.from(this.queueRemoved),
        };
    // Clear before awaiting so events arriving during the write land in
    // the next delta instead of being written twice.
    this.queueAdded.clear();
    this.queueRemoved.clear();
    this.queueCheckpointNeedsFull = false;
    try {
      await this.dbCall<void>('checkpointQueue', [patch, this.config.startUrl]);
    } catch (err) {
      // The delta is already gone, so fall back to a full rebuild next
      // tick — otherwise the checkpoint would silently drift from the
      // live queue and a resume would replay the wrong set.
      this.queueCheckpointNeedsFull = true;
      this.emit(
        'debug',
        `queue checkpoint failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  private stopQueueCheckpointTimer(): void {
    if (this.queueCheckpointTimer) {
      clearInterval(this.queueCheckpointTimer);
      this.queueCheckpointTimer = null;
    }
  }
  /**
   * Aborts any in-flight sitemap discovery on stop(). Without this, a
   * 21k-URL sitemap continues parsing in the background after Stop and
   * the resulting 'info' / 'done' events leak into the next crawl.
   */
  private sitemapAbort: AbortController | null = null;
  private readonly includeRegexes: RegExp[];
  private readonly excludeRegexes: RegExp[];
  /**
   * Snapshotted once in the constructor so the URL-rewrite pass costs
   * nothing per call (no `?:` chains, no per-link `if`s) and so changing
   * config mid-crawl can't desync the seen-set's keying.
   */
  private readonly urlRewrites: UrlRewriteOptions;
  /** Effective proxy resolved in the constructor, reused by the start-URL
   *  probe so it doesn't reset the global dispatcher back to direct. */
  private readonly resolvedProxy: string;

  /**
   * Optional freeze-watchdog hook. The desktop main process injects a
   * callback that publishes the current "what is the crawler doing
   * right now" string into a SharedArrayBuffer the watchdog reads. We
   * deliberately keep this opt-in (default no-op) so the headless CLI
   * doesn't need to know about the watchdog at all.
   */
  private readonly setOp: (op: string) => void;

  /**
   * Optional async HTML parser. Defaults to the synchronous in-process
   * `parseHtml` from `./html-parser.js` (used by the headless CLI
   * which has no worker pool). The desktop main process injects an
   * implementation that dispatches into a `worker_threads` pool so
   * cheerio's CPU work runs off the main thread — that single change
   * eliminates the 12-25 s "fetch" stalls observed on large mağaza /
   * blog HTML pages.
   */
  private readonly parsePage: (
    html: string,
    pageUrl: string,
    opts: Parameters<typeof parseHtml>[2],
  ) => Promise<ReturnType<typeof parseHtml>>;

  /**
   * Optional async writer for the per-URL hot path. When present, the
   * crawler ships the upsert + headers + body snapshot + links +
   * images batch to a writer worker thread instead of running the
   * SQLite transaction on its own thread. Defaults to a synchronous
   * inline implementation that mirrors the legacy code path so the
   * CLI keeps working without any worker plumbing.
   */
  private readonly writeFetchedUrl: (
    payload: Parameters<ProjectDb['writeFetchedUrl']>[0],
  ) => Promise<{ urlId: number }>;

  /**
   * Optional async hook for the post-crawl issue recompute. When the
   * desktop main process injects a writer-worker bridge here, the
   * 70+ correlated subqueries run off the main thread — without it,
   * a 5K-URL crawl freezes the renderer for ~45 s in the post-crawl
   * phase ("materialise-issues"). Defaults to running the recompute
   * inline (CLI / test contexts).
   */
  private readonly recomputeIssues: (
    definitions: ReadonlyArray<readonly [string, string]>,
  ) => Promise<void>;

  /**
   * Generic post-crawl SQL-pass dispatch. Methods like
   * `recomputeInlinks`, `recomputeRedirectChains`,
   * `recomputeHreflangAnalysis`, `recomputeHreflangInconsistent`,
   * `recomputePaginationSequence` are sync void calls on `ProjectDb`
   * — running them inline on the main thread blocks the renderer for
   * ~5-15 s combined on a 5K+ URL crawl. The desktop host injects a
   * writer-worker dispatcher here so each pass runs off-thread; CLI /
   * tests fall back to calling the method directly on `this.db`.
   */
  private readonly runDbPass: (methodName: string) => Promise<void>;

  /**
   * Generic single-method writer dispatcher with a typed return value.
   * The desktop host routes this through the writer-worker pool so the
   * crawler's per-URL hot-path writes (`upsertUrl` for redirects/non-
   * HTML, `updateExternalProbe`, `setUrlHeaders`, `setSitemapUrls`,
   * `checkpointQueue`) all share the SAME SQLite writer connection as
   * `writeFetchedUrl`. Without this, the main-thread `ProjectDb` and
   * the worker's `ProjectDb` are TWO writer connections fighting for
   * the SQLite writer lock — even with a 10 s `busy_timeout` PRAGMA,
   * a long-running pass on the worker (`recomputeUrlsIssuesYielding`)
   * can starve the main thread out of the lock window and surface as
   * `Queue error: database is locked` / `External probe error:
   * database is locked`. Routing these high-frequency writes through
   * the same worker eliminates the contention by serialising them
   * through the worker's JS-level FIFO instead of SQLite's lock.
   * Defaults to a sync wrapper around `this.db[method](...args)` so
   * the CLI keeps working unchanged.
   */
  private readonly dbCall: <T>(method: string, args: unknown[]) => Promise<T>;

  /**
   * Explicit re-fetch list for a targeted Re-Spider run, or null for a
   * normal crawl. Non-null also implies "never wipe the project" — a
   * re-spider updates rows in place, it does not start a new data set.
   */
  private readonly respiderSeeds: string[] | null;

  /** True when this run resumes an interrupted crawl from a checkpoint. */
  private readonly resumeOnly: boolean;

  /**
   * V2 — Optional Playwright renderer. Returns the post-JS DOM dump for
   * a URL when `renderingMode === 'js'`. Defaults to undefined so the
   * crawler silently skips the render pass when no pool is wired.
   */
  private readonly renderUrlHook?: (
    url: string,
    urlId: number | null,
    signal: AbortSignal,
  ) => Promise<{
    ok: boolean;
    html: string;
    timingMs: number;
    error?: string;
    screenshots?: { fullpage?: string; fold?: string; mobile?: string };
    lcp?: {
      selector: string;
      tagName: string;
      width: number;
      height: number;
      coverage: number;
      resourceUrl: string | null;
    } | null;
    mobileUsability?: {
      ok: boolean;
      overflowPx: number;
      hasViewportMeta: boolean;
    } | null;
    a11y?: {
      lowContrast: number;
      sampled: number;
      focusSuppressed: boolean;
      smallFont: number;
      tapTargetsSmall: number;
      tapTargetsSampled: number;
    } | null;
  }>;

  constructor(
    config: CrawlConfig,
    db: ProjectDb,
    opts: {
      setOp?: (op: string) => void;
      parseHtml?: (
        html: string,
        pageUrl: string,
        opts: Parameters<typeof parseHtml>[2],
      ) => Promise<ReturnType<typeof parseHtml>>;
      writeFetchedUrl?: (
        payload: Parameters<ProjectDb['writeFetchedUrl']>[0],
      ) => Promise<{ urlId: number }>;
      recomputeIssues?: (
        definitions: ReadonlyArray<readonly [string, string]>,
      ) => Promise<void>;
      runDbPass?: (methodName: string) => Promise<void>;
      dbCall?: <T>(method: string, args: unknown[]) => Promise<T>;
      /**
       * Optional Playwright-based renderer. When `config.renderingMode ===
       * 'js'`, the crawler invokes this hook after the HTTP fetch and
       * uses the post-JS DOM for link extraction. The desktop host wires
       * a managed BrowserPool here; CLI runs render-less unless the
       * caller injects one explicitly.
       *
       * The result may include screenshot paths (written by Playwright
       * to disk before this promise resolves) and an LCP candidate —
       * the crawler stores these via dbCall hooks. The host decides
       * which extras to compute via its own config.
       */
      renderUrl?: (
        url: string,
        urlId: number | null,
        signal: AbortSignal,
      ) => Promise<{
        ok: boolean;
        html: string;
        timingMs: number;
        error?: string;
        screenshots?: { fullpage?: string; fold?: string; mobile?: string };
        lcp?: {
          selector: string;
          tagName: string;
          width: number;
          height: number;
          coverage: number;
          resourceUrl: string | null;
        } | null;
        mobileUsability?: {
          ok: boolean;
          overflowPx: number;
          hasViewportMeta: boolean;
        } | null;
        a11y?: {
          lowContrast: number;
          sampled: number;
          focusSuppressed: boolean;
          smallFont: number;
          tapTargetsSmall: number;
          tapTargetsSampled: number;
        } | null;
      }>;
      /**
       * Re-fetch exactly these URLs instead of walking the site from the
       * seed — the "Re-Spider" affordance when no crawl is running.
       *
       * Everything already in the project is pre-marked as seen, so a
       * re-spider costs one request per listed URL. Links found on those
       * pages that the project has never seen ARE followed, which is the
       * point: a page that gained a link should bring the new target into
       * the report rather than leaving a gap.
       */
      respiderSeeds?: string[];
      /**
       * This run continues an interrupted crawl (crash recovery) rather
       * than starting one. Suppresses the re-fetch-everything behaviour a
       * repeat Start normally triggers: the caller has already restored
       * the exact queue that was in flight, and re-reading the pages that
       * did complete would turn "carry on where you left off" into "crawl
       * the whole site again".
       */
      resumeOnly?: boolean;
    } = {},
  ) {
    super();
    this.respiderSeeds = opts.respiderSeeds ?? null;
    this.resumeOnly = opts.resumeOnly === true;
    this.setOp = opts.setOp ?? ((): void => undefined);
    this.parsePage =
      opts.parseHtml ??
      ((html, pageUrl, parseOpts) => Promise.resolve(parseHtml(html, pageUrl, parseOpts)));
    this.writeFetchedUrl =
      opts.writeFetchedUrl ?? ((payload) => Promise.resolve(this.db.writeFetchedUrl(payload)));
    this.recomputeIssues =
      opts.recomputeIssues ?? ((defs) => this.db.recomputeUrlsIssuesYielding(defs));
    this.runDbPass =
      opts.runDbPass ??
      ((method) => {
        const fn = (this.db as unknown as Record<string, unknown>)[method];
        if (typeof fn === 'function') (fn as () => void).call(this.db);
        return Promise.resolve();
      });
    this.dbCall =
      opts.dbCall ??
      (<T>(method: string, args: unknown[]) => {
        const fn = (this.db as unknown as Record<string, unknown>)[method];
        if (typeof fn !== 'function') {
          return Promise.reject(new Error(`unknown db method: ${method}`));
        }
        return Promise.resolve((fn as (...a: unknown[]) => T).apply(this.db, args));
      });
    this.renderUrlHook = opts.renderUrl;
    // Wave 9 — Resolve the active proxy. If a named profile is selected
    // and present in `proxyProfiles`, its URL wins over the legacy
    // `proxyUrl` field; if the named profile doesn't resolve we fall
    // back to `proxyUrl`, then to env vars (handled inside initHttpClient).
    const resolvedProxy = (() => {
      const active = (config.proxyProfileActive ?? '').trim();
      if (active) {
        const hit = (config.proxyProfiles ?? []).find((p) => p.name === active);
        if (hit && hit.url.trim()) return hit.url.trim();
      }
      return config.proxyUrl ?? '';
    })();
    this.resolvedProxy = resolvedProxy;
    initHttpClient({ proxyOverride: resolvedProxy });
    this.config = config;
    this.db = db;
    const concurrency = Math.max(1, Math.min(200, config.maxConcurrency));
    // Rate-limit (interval + intervalCap) intentionally NOT set on
    // the queue. p-queue's bucket-refill semantics interact poorly
    // with long-tailed response times: after the first burst lands
    // and slots free up, dispatch can stall for an entire bucket
    // before the next batch goes out — and on a 1 s/intervalCap=20
    // bucket the queue would freeze entirely once the first ~20
    // tasks completed. Throughput is now bounded purely by the
    // worker pool (concurrency × 1/avg_response), which on a slow
    // remote server gives the user the 5-10 URL/s they expect
    // instead of ~1 URL/s. config.maxRps is honoured indirectly via
    // maxConcurrency — users who need a hard RPS cap should drop
    // concurrency rather than trust per-second buckets.
    this.queue = new PQueue({ concurrency });
    // Track queue concurrency from the start so adaptive shrinkage
    // doesn't have to wait for the first reportRendererLag call to
    // materialise the running value.
    this.currentConcurrency = concurrency;
    // External probes run on a separate queue so slow third-party hosts
    // don't block the main crawl.
    this.externalQueue = new PQueue({
      concurrency: Math.max(2, Math.min(10, concurrency)),
    });
    // Compile include/exclude patterns once — an invalid pattern should
    // surface to the user as a crawler error, not a silent miss.
    this.includeRegexes = compilePatterns(config.includePatterns, (p, err) => {
      this.emit('error', `Invalid include pattern "${p}": ${err}`);
    });
    this.excludeRegexes = compilePatterns(config.excludePatterns, (p, err) => {
      this.emit('error', `Invalid exclude pattern "${p}": ${err}`);
    });
    const compiledRegexRewrites = compileUrlRegexRewrites(config.urlRegexRewrites, (p, err) => {
      this.emit('error', `Invalid URL regex rewrite "${p}": ${err}`);
    });
    this.urlRewrites = {
      stripWww: config.stripWww,
      forceHttps: config.forceHttps,
      lowercasePath: config.lowercasePath,
      trailingSlash: config.trailingSlash,
      keepQueryParams: config.keepQueryParams,
      sortQueryParams: config.sortQueryParams,
      collapseDuplicateSlashes: config.collapseDuplicateSlashes,
      regexRewrites: compiledRegexRewrites,
    };
  }

  /**
   * URL passes the include/exclude filter when:
   *   - excludes: no pattern matches
   *   - includes: either the list is empty, or at least one matches
   *   - the crawl's start URL is always permitted (user explicitly asked for it)
   */
  private passesUrlFilter(url: string): boolean {
    if (url === this.config.startUrl) return true;
    for (const re of this.excludeRegexes) {
      if (re.test(url)) return false;
    }
    if (this.includeRegexes.length === 0) return true;
    return this.includeRegexes.some((re) => re.test(url));
  }

  /**
   * Classify a URL against the crawl-trap shapes, for storage on its row.
   * Returns the trap kind or null. Detection is independent of whether the
   * crawler acts on it - a faceted or calendar URL is still crawled, and
   * the flag is what makes it visible in the Crawl Trap filter.
   */
  private trapKind(url: string): string | null {
    return detectUrlTrap(url, {
      maxRepeatedSegments: this.config.maxRepeatedPathSegments,
      maxQueryParams: this.config.maxQueryParams,
    });
  }

  /**
   * The only trap acted on at enqueue: a path segment repeated N+ times.
   * That shape is produced by a relative-href bug walking `/a/a/a/...` and
   * has no legitimate counterpart, so following it only burns budget on a
   * loop. Every other kind is crawled and merely flagged, because real
   * archive and filter pages are indistinguishable from the trap version.
   *
   * Drops are counted and reported once the crawl ends - never silent.
   */
  private isLoopTrap(url: string): boolean {
    const max = this.config.maxRepeatedPathSegments;
    if (!max || max <= 0) return false;
    return detectUrlTrap(url, { maxRepeatedSegments: max }) === 'repeated-segment';
  }

  /** URLs dropped by `isLoopTrap`, reported at the end of the crawl. */
  private loopTrapsDropped = 0;

  /**
   * Drop URLs whose path extension matches any user-configured exclude
   * (e.g. `pdf`, `jpg`). The start URL is exempt — even if it ends in
   * `.pdf` we always crawl what the user explicitly asked for.
   * Extensions are case-folded; URLs without an extension always pass.
   */
  private passesExtensionFilter(url: string): boolean {
    if (url === this.config.startUrl) return true;
    const list = this.config.excludeExtensions;
    if (!list || list.length === 0) return true;
    let pathOnly: string;
    try {
      pathOnly = new URL(url).pathname;
    } catch {
      return true;
    }
    const dot = pathOnly.lastIndexOf('.');
    if (dot < 0 || dot < pathOnly.lastIndexOf('/')) return true;
    const ext = pathOnly.slice(dot + 1).toLowerCase();
    if (!ext) return true;
    return !list.some((e) => e.trim().replace(/^\./, '').toLowerCase() === ext);
  }

  async start(): Promise<void> {
    this.startedAt = Date.now();
    this.stopped = false;
    this.running = true;

    // Mobile device mode: swap the base User-Agent to a smartphone UA before
    // ANY request goes out. Every request path (page fetch, robots.txt,
    // sitemap, start-URL probe, form login) reads `this.config.userAgent`, so
    // this single overwrite makes the whole crawl see the site's mobile
    // version on servers that vary HTML by UA. Per-host UA overrides still
    // win. The JS-render browser context is switched to a mobile viewport
    // separately in the desktop host (it builds the BrowserPool).
    if (this.config.deviceMode === 'mobile') {
      this.config = { ...this.config, userAgent: MOBILE_USER_AGENT };
    }

    this.setOp(`crawl:start:${this.config.startUrl}`);

    // Fire an immediate progress event so the UI can flip to "Running"
    // before we block on resolveStartUrl (which can spend several seconds
    // probing HTTPS then HTTP on unreachable hosts).
    this.emitProgress();

    // Surface DNS-tier escalations into the log panel so a user whose
    // system DNS is broken can see "fallback active" instead of a silent
    // recovery (or, worse, a silent recovery that they think didn't help).
    this.installDnsHook();

    // Environment diagnostics — proxy, CA bundle, TLS, runtime versions.
    // Logged once per crawl so support can tell at a glance whether a
    // user is behind a corporate proxy / antivirus HTTPS inspection / has
    // disabled TLS validation, all of which affect what crawls can reach.
    this.emitEnvDiagnostics();

    // V2 Faz 2 — establish an authenticated session before any fetch when
    // form-based login is configured. Best-effort; the crawl proceeds
    // either way. Runs for both spider and list mode.
    await this.runFormLogin();

    if (this.config.mode === 'list') {
      await this.startListMode();
      return;
    }

    if (this.config.mode === 'sitemap') {
      await this.startSitemapMode();
      return;
    }

    const startProbeT0 = Date.now();
    const start = await resolveStartUrl(
      this.config.startUrl,
      this.config.userAgent,
      5000,
      (info) => {
        this.emit(
          'debug',
          `resolveStartUrl: ${info.method} ${info.url} -> ${info.outcome}${
            info.detail ? ` (${info.detail})` : ''
          }`,
        );
      },
      { proxyOverride: this.resolvedProxy, rewrites: this.urlRewrites },
    );
    if (!start) {
      this.emit(
        'error',
        `Invalid start URL: ${this.config.startUrl} — neither https:// nor http:// responded within 5s. Check that the host is reachable from this machine (try opening it in a browser).`,
      );
      this.running = false;
      this.emitProgressFinal();
      // Without this the UI hangs in "Running" forever after a bad start URL.
      if (!this.stopped) {
      // Wave 6 — Clean completion clears the checkpoint so the next
      // app launch doesn't offer to "resume" a crawl that already
      // finished successfully.
      try {
        this.db.clearQueueCheckpoint();
      } catch {
        /* checkpoint table may not yet exist on very old DBs — ignore */
      }
      this.emit('done', this.db.getSummary());
    }
      return;
    }
    this.emit(
      'info',
      `Start URL resolved: ${this.config.startUrl} -> ${start} (in ${Date.now() - startProbeT0} ms)`,
    );
    // Persist the resolved URL back into the active config so scope checks,
    // progress events, and link classification all see the same canonical value.
    this.config = { ...this.config, startUrl: start };

    this.applyProcessPriority();
    this.startMemoryMonitor();

    // Fresh-start vs. refresh decision. A different start URL means a
    // different site, so the tables are wiped. The same start URL means
    // the user wants this site looked at again — existing rows are kept
    // and every one of them is re-fetched (see `hydrateFromDb`), because
    // a site that was fully crawled has no pending work left and would
    // otherwise finish instantly without touching a single page.
    //
    // A Re-Spider is exempt from both halves: it updates the rows the
    // user picked and must never wipe the project or re-point it at a
    // different seed, even if the start URL happens to resolve somewhere
    // new (a changed redirect would otherwise destroy the whole crawl
    // the user was looking at).
    // A crash-recovery resume is exempt from the re-fetch half only — it
    // is the same site, so the tables must survive.
    const previousStart = this.db.getMeta('startUrl');
    const isRespider = this.respiderSeeds !== null;
    const isSameSite = previousStart === start;
    // Wipe ONLY when this is genuinely a different site. Keep this
    // condition keyed on `isSameSite` rather than on `isRefresh` — a
    // resume or a re-spider is also "not a refresh", and resetting on
    // either would destroy the crawl the user is trying to continue.
    if (!isSameSite && !isRespider) {
      this.db.reset();
      this.db.setMeta('startUrl', start);
    }
    const isRefresh = isSameSite && !isRespider && !this.resumeOnly;
    // Change markers describe the run that is starting now, so anything
    // a previous refresh flagged is cleared first. A wiped project has
    // nothing to clear, and a targeted re-spider clears only its own
    // seeds (done by the caller) so unrelated markers survive.
    if (isRefresh) {
      this.db.clearChangedFlags();
    }

    const origin = new URL(start).origin;
    // robots.txt + sitemap discovery used to block the crawl start
    // sequentially (~1–4 s before the first row appeared). Both are now
    // fire-and-forget. The robots check in enqueue() short-circuits when
    // `this.robots === null`; by the time the start URL has been fetched
    // (~500 ms) and outlinks are enqueued, robots.txt has typically
    // loaded. Both promises are awaited at end-of-crawl so post-crawl
    // recompute and sitemap-derived issue counts use the full data set.
    const robotsPromise = this.config.respectRobotsTxt
      ? loadRobots(origin, this.config.userAgent, (msg) => {
          if (!this.stopped) this.emit('warn', msg);
        }).then((r) => {
          if (!this.stopped) {
            this.robots = r;
            // Seed the per-origin cache so the start origin uses the same
            // checker (and its Crawl-delay) as every other origin.
            this.robotsByOrigin.set(origin, r);
            // robots.txt `Crawl-delay` (seconds). Cached once — the start
            // origin's directive applies for the crawl, matching the single
            // robots checker used for allow/deny.
            //
            // Opt-in (`respectCrawlDelay`, default off). The directive is not
            // part of RFC 9309; Google ignores it and Screaming Frog does not
            // implement it. Published values are usually stale copy-paste
            // (`Crawl-delay: 30` is common) and honouring them literally costs
            // hours per crawl. Either way we surface the directive so a slow
            // crawl is never unexplained — silently sleeping for 30 s per URL
            // with no feedback is the actual bug this replaces.
            const rd = r.getCrawlDelay();
            const declaredMs =
              typeof rd === 'number' && Number.isFinite(rd) && rd > 0
                ? Math.round(rd * 1000)
                : 0;
            this.robotsCrawlDelayMs = this.config.respectCrawlDelay ? declaredMs : 0;
            if (declaredMs > 0) {
              const secs = (declaredMs / 1000).toFixed(declaredMs % 1000 === 0 ? 0 : 1);
              this.emit(
                'warn',
                this.config.respectCrawlDelay
                  ? `robots.txt declares Crawl-delay: ${secs}s — honouring it caps this crawl at one request every ${secs}s. Turn off "Respect robots.txt Crawl-delay" in Settings to crawl at full speed.`
                  : `robots.txt declares Crawl-delay: ${secs}s — ignored (matches Google / Screaming Frog; not part of RFC 9309). Enable "Respect robots.txt Crawl-delay" in Settings to honour it.`,
              );
            }
          }
        })
      : Promise.resolve();
    // Runs when auto-discovery is on OR the user supplied explicit sitemap
    // seed URLs — both are handled inside `discoverAndIngestSitemaps`, which
    // writes `sitemap_urls` exactly once (merged) to avoid the replace-all
    // race, and additionally enqueues the seed entries as crawl seeds.
    // Skipped for a targeted Re-Spider: the user asked for specific URLs
    // to be re-read, and every sitemap entry is already `seen`, so a
    // rediscovery pass would spend a second or two fetching XML that
    // cannot add a single fetch. The stored `sitemap_urls` rows survive
    // (nothing was reset), so sitemap-derived issue counts stay intact.
    const sitemapPromise =
      this.respiderSeeds === null &&
      (this.config.discoverSitemaps || this.config.seedSitemapUrls.length > 0)
        ? this.discoverAndIngestSitemaps(origin)
        : Promise.resolve();

    this.progressTimer = setInterval(() => this.emitProgress(), 500);

    // Memory-limit watchdog. When `memoryLimitMb > 0`, sample RSS every
    // 2 s; if the threshold is crossed, pause the crawler so pending
    // writes drain (PQueue.pause() lets in-flight tasks finish) and
    // surface a clear `warn`. Auto-resume once RSS drops back below 80 %
    // of the cap so a transient spike doesn't permanently halt the
    // crawl — matches the Settings → Memory limit field's documented
    // behaviour.
    if (this.config.memoryLimitMb > 0) {
      let autoPaused = false;
      // Samples spent waiting for RSS to fall back under `resumeAt`.
      // Pausing stops new fetches but releases nothing already retained —
      // the SQLite page cache, the worker isolates and `seen` dominate RSS
      // and do not shrink. So the resume condition can simply never be met,
      // and because a paused PQueue keeps `size > 0`, `queue.onIdle()` in
      // `start()` never resolves: the crawl sat at "Running" forever with
      // no way out but Stop. Give the spike a fair window, then finish the
      // crawl with what we have instead of hanging on it.
      let stuckSamples = 0;
      const limit = this.config.memoryLimitMb;
      const resumeAt = Math.floor(limit * 0.8);
      this.memoryWatchdogTimer = setInterval(() => {
        if (this.stopped) return;
        const rssMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
        if (!autoPaused && !this.paused && rssMb >= limit) {
          this.emit(
            'warn',
            `Memory limit reached: RSS ${rssMb} MB ≥ ${limit} MB — crawler paused. ` +
              `Will resume automatically once RSS drops below ${resumeAt} MB.`,
          );
          autoPaused = true;
          stuckSamples = 0;
          this.pause();
        } else if (autoPaused && this.paused && rssMb < resumeAt) {
          this.emit(
            'info',
            `Memory dropped to ${rssMb} MB (< ${resumeAt} MB) — resuming crawler.`,
          );
          autoPaused = false;
          stuckSamples = 0;
          this.resume();
        } else if (autoPaused && this.paused) {
          stuckSamples++;
          if (stuckSamples >= MEMORY_STUCK_SAMPLES) {
            this.emit(
              'error',
              `Memory stayed at ${rssMb} MB (≥ ${resumeAt} MB) for ` +
                `${Math.round((MEMORY_STUCK_SAMPLES * 2000) / 60000)} minutes after the ` +
                'memory-limit pause. Most of it is memory the crawler cannot release ' +
                'while running, so waiting longer will not help — finishing the crawl ' +
                'with the URLs collected so far. Raise or clear the memory limit to ' +
                'crawl further.',
            );
            // Resume so the queue can drain to the terminal state, then
            // stop: leaving it paused would keep `onIdle()` unresolved.
            autoPaused = false;
            this.resume();
            this.stop();
          }
        }
      }, 2000);
    }

    // I-3 — Periodic materialised issue recompute while the crawl is
    // running. The post-crawl pass at the end will run a final clean
    // recompute; this keeps the sidebar's expensive issue counters
    // (dead external domain, duplicate URL post-norm, canonical chain
    // multi-hop) populated mid-crawl too. 30 s cadence is a deliberate
    // floor — these definitions execute multi-second self-joins on
    // large crawls and we don't want to hold the DB write lock more
    // than the crawler itself does.
    this.startIssueRecomputeTimer();
    this.startQueueCheckpointTimer();

    // Hydrate in-memory state from the DB so resume starts from the right
    // point; then queue whatever work is still pending.
    this.hydrateFromDb({ refresh: isRefresh });

    try {
      // Wait for internal crawl first, then drain any external probes still
      // in flight or queued (externals may have been enqueued during internal).
      // p-queue's onIdle resolves the moment size+pending hits 0, but
      // fetchAndProcess can race with that: a worker finishes the
      // *last* in-flight task, link extraction enqueues new URLs a
      // microtask later, and onIdle has already resolved. Loop while
      // counters disagree — one extra 50 ms wait per pass guards the
      // race window without spinning.
      while (!this.stopped) {
        await this.queue.onIdle();
        await new Promise<void>((r) => setTimeout(r, 50));
        // Top up a refresh run's backlog as the queue frees up. No-op for
        // a normal crawl.
        this.feedRefreshBacklog();
        if (this.queue.size + this.queue.pending === 0) break;
      }
      await this.externalQueue.onIdle();
      // robots.txt + sitemap discovery may still be running — wait for
      // both before the post-crawl recompute so issue filters depending
      // on `sitemap_urls` (Non-Indexable in Sitemap, Non-200 in Sitemap)
      // see the full set, and so the robots checker is settled.
      await Promise.all([robotsPromise, sitemapPromise]);
      // Drain any internal-link "stubs": URLs discovered on a crawled
      // page but never themselves crawled — typically because they
      // were first found via a depth-N+1 path (rejected by maxDepth)
      // before a shallower path could enqueue them, or because robots
      // / scope filters had not loaded yet when the link was processed.
      // Without this loop the user would see "second Start finds +N
      // new URLs" even though the first crawl was supposed to be
      // complete; running until `getPendingInternalLinks()` stops
      // shrinking is what hydrateFromDb already does on resume —
      // doing it here moves the work into the first crawl so a
      // single Start finishes with everything reachable.
      let lastPending = -1;
      // Hard cap on iterations — with pathological filter sets the
      // pending list could plateau without dropping to 0; the
      // `lastPending === count` check stops us in that case, but a
      // numeric ceiling guards against any bug that lets the count
      // oscillate.
      const excludeNofollow = !this.config.followNofollow;
      this.setOp('post-crawl:drain-pending-stubs');
      for (let pass = 0; pass < 20 && !this.stopped; pass++) {
        // Honour `followNofollow` here too — without the filter the
        // drain would happily crawl URLs that the live link-follow
        // path explicitly skipped, ending up with a different result
        // than a "no drain" first crawl would produce.
        const pending = this.db.getPendingInternalLinks({ excludeNofollow });
        if (pending.length === 0) break;
        if (pending.length === lastPending) break;
        lastPending = pending.length;
        for (const p of pending) {
          // Drop from `seen` first — these URLs were never actually
          // crawled, just stubbed; enqueue's seen-check would reject
          // them otherwise.
          this.seen.delete(p.url);
          this.enqueue({ url: p.url, depth: p.depth });
        }
        await this.queue.onIdle();
        await this.externalQueue.onIdle();
      }
    } finally {
      if (this.progressTimer) clearInterval(this.progressTimer);
      this.progressTimer = null;
      if (this.memoryWatchdogTimer) clearInterval(this.memoryWatchdogTimer);
      this.memoryWatchdogTimer = null;
      this.stopIssueRecomputeTimer();
      this.stopQueueCheckpointTimer();
    }

    // Post-crawl heavy lifting — shared with list mode via runPostCrawlPasses.
    // Each pass is gated by its config flag so users running tight time-budget
    // audits can skip steps they don't need, and each yields to the event loop
    // so IPC dispatch (logs:batch, progress, dataChanged) never starves.
    await this.runPostCrawlPasses();
    this.running = false;
    // Say what the loop guard dropped. Silently shrinking a crawl is exactly
    // the kind of invisible behaviour that makes a missing page impossible
    // to explain afterwards.
    if (this.loopTrapsDropped > 0) {
      this.emit(
        'info',
        `Crawl trap guard: skipped ${this.loopTrapsDropped.toLocaleString()} URL(s) whose path repeated a ` +
          `segment ${this.config.maxRepeatedPathSegments}+ times (link loop).`,
      );
    }
    this.stopMemoryMonitor();
    // Release per-URL dedup sets — at 1M URLs this is ~80–120 MB of string
    // heap that's no longer needed once the queue is drained.
    this.seen.clear();
    this.externalSeen.clear();
    this.emitProgressFinal();
    this.setOp('idle');
    // Suppress 'done' if a stop() ran during teardown — otherwise the
    // zombie crawler's done-event clobbers the new crawl's UI state.
    if (!this.stopped) {
      this.emit('done', this.db.getSummary());
      this.fireWebhook();
    }
  }

  /**
   * Post-crawl analysis pipeline shared by spider and list mode. Each step is
   * a synchronous SQL pass that can take 1–3 s on a 1M-URL crawl; routing DB
   * passes through `runDbPass` / `recomputeIssues` dispatches them to the
   * writer-worker in the desktop host (CLI / tests fall back to inline), and
   * `yieldToEventLoop` between steps lets queued IPC (logs, progress,
   * dataChanged) get serviced so no window freezes. List mode used to run
   * these inline on the main thread and skipped boilerplate + manifest probes
   * — see rule 1.7 (root-cause perf, never mask by degrading UX).
   */
  private async runPostCrawlPasses(): Promise<void> {
    // Refresh the planner's statistics before anything else runs. Every
    // pass below is a correlated-subquery / self-join workload, and the
    // tables they read only reached their final size moments ago — the
    // plans SQLite would pick from stale (or absent) stats are the ones
    // that turn a sub-second pass into a multi-minute one.
    await yieldToEventLoop();
    this.setOp('post-crawl:optimize');
    try {
      await this.dbCall<void>('optimize', []);
    } catch {
      /* statistics are an optimisation, never a correctness input */
    }
    if (this.config.analyseInlinks) {
      await yieldToEventLoop();
      this.emit('info', 'Recomputing inlinks…');
      this.setOp('post-crawl:recompute-inlinks');
      await this.runDbPass('recomputeInlinks');
    }
    if (this.config.analyseLinkScore) {
      await yieldToEventLoop();
      this.emit('info', 'Computing internal link scores…');
      this.setOp('post-crawl:link-score');
      await this.runDbPass('recomputeLinkScore');
    }
    if (this.config.analyseRedirectChains) {
      await yieldToEventLoop();
      this.emit('info', 'Recomputing redirect chains…');
      this.setOp('post-crawl:recompute-redirect-chains');
      await this.runDbPass('recomputeRedirectChains');
    }
    if (this.config.analyseHreflang) {
      await yieldToEventLoop();
      this.emit('info', 'Recomputing hreflang analysis…');
      this.setOp('post-crawl:recompute-hreflang');
      await this.runDbPass('recomputeHreflangAnalysis');
      await yieldToEventLoop();
      this.setOp('post-crawl:recompute-hreflang-inconsistent');
      await this.runDbPass('recomputeHreflangInconsistent');
    }
    if (this.config.analyseDuplicates) {
      await yieldToEventLoop();
      this.emit('info', 'Clustering duplicates…');
      this.setOp('post-crawl:cluster-duplicates');
      // Duplicate clustering has JS-side simhash work that lives on
      // the crawler instance, not the DB; can't blindly off-thread it.
      this.runDuplicateClustering();

      // Template / boilerplate detection — runs alongside duplicate
      // clustering because both are content-similarity passes; surfaces the
      // repeated chrome (nav, footer, sidebar) that dilutes thin-content
      // detection. Memory-bounded, skipped when no body snapshots are stored.
      // Routed through dbCall (writer worker on desktop) rather than the
      // main-thread ProjectDb: the pass reads thousands of body snapshots
      // and its JS-string churn belongs off the UI-serving thread — a
      // main-thread run of this exact pass was the post-crawl V8 OOM
      // crash on macOS (Electron's 4 GB pointer-compression heap cap).
      await yieldToEventLoop();
      this.emit('info', 'Detecting boilerplate coverage…');
      this.setOp('post-crawl:boilerplate-coverage');
      try {
        const result = await this.dbCall<{
          sampled: number;
          boilerplateShingles: number;
          pagesAboveHighThreshold: number;
        }>('recomputeBoilerplateCoverage', []);
        if (result.sampled > 0) {
          this.emit(
            'info',
            `Boilerplate: ${result.boilerplateShingles} shared shingles across ${result.sampled} sampled pages; ${result.pagesAboveHighThreshold} page(s) > 50% template`,
          );
        }
      } catch (err) {
        this.emit(
          'error',
          new Error(
            `recomputeBoilerplateCoverage failed: ${err instanceof Error ? err.message : String(err)}`,
          ),
        );
      }
    }
    if (this.config.analysePagination) {
      await yieldToEventLoop();
      this.emit('info', 'Detecting pagination sequence gaps…');
      this.setOp('post-crawl:pagination-sequence');
      await this.runDbPass('recomputePaginationSequence');
    }
    if (this.config.analyseIssues) {
      await yieldToEventLoop();
      this.emit('info', 'Materialising issue counters…');
      this.setOp('post-crawl:materialise-issues');
      // Route through the injected hook — in the desktop host this
      // dispatches to the writer-worker, keeping the 70+ correlated
      // subqueries off the main thread. CLI / tests fall back to
      // running inline via `db.recomputeUrlsIssuesYielding`.
      await this.recomputeIssues(EXPENSIVE_ISSUE_DEFINITIONS);
    }
    await yieldToEventLoop();
    this.setOp('post-crawl:image-probes');
    await this.runImageSizeProbes();
    await yieldToEventLoop();
    this.setOp('post-crawl:tls-probes');
    await this.runTlsCertProbes();
    await yieldToEventLoop();
    this.setOp('post-crawl:manifest-probes');
    await this.runManifestProbes();
    await yieldToEventLoop();
    this.setOp('post-crawl:social-image-probes');
    await this.runSocialImageProbes();
    await yieldToEventLoop();
    this.setOp('post-crawl:pdf-probes');
    await this.runPdfMetadataProbes();
    await yieldToEventLoop();
    this.setOp('post-crawl:performance-budget');
    this.runBudgetPass();
    // Fold the WAL back into the main DB file now that the write burst
    // is over. wal_autocheckpoint bounds WAL growth *during* the crawl;
    // this TRUNCATE pass reclaims the file afterwards so the project
    // on disk is compact and the first post-crawl reader queries don't
    // pay WAL-frame lookup overhead. Matters double on macOS/APFS
    // where checkpoint fsyncs are the expensive operation — better one
    // deliberate pass here than implicit ones during the next crawl.
    await yieldToEventLoop();
    this.setOp('post-crawl:wal-checkpoint');
    try {
      await this.dbCall<void>('walCheckpoint', []);
    } catch {
      /* non-fatal — a reader mid-query can block the checkpoint */
    }
  }

  /**
   * Fire-and-forget webhook poster. Configured via `webhookUrl`; empty
   * string disables. Failures are surfaced via `info` event — never
   * thrown — so a 500 from a misconfigured Slack hook can't break the
   * crawl teardown.
   */
  private fireWebhook(): void {
    const url = this.config.webhookUrl?.trim();
    if (!url) return;
    const summary = this.db.getSummary();
    const issues = this.db.getOverviewCounts().issues;
    const payload = {
      finishedAt: new Date().toISOString(),
      startUrl: this.config.startUrl,
      durationMs: Date.now() - this.startedAt,
      summary,
      issues,
    };
    // Lazy import to avoid pulling fetch-via-undici at module load on
    // CLI-only paths that never enable the webhook.
    void import('./webhook.js').then(({ postCrawlCompleteWebhook }) =>
      postCrawlCompleteWebhook(url, payload).then((res) => {
        if (res.ok) {
          // Origin only. A Slack / Discord / Zapier incoming-webhook URL is
          // bearer-equivalent — anyone holding it can post as the user — and
          // this line lands in the on-disk log, the very file users are told
          // to send to support.
          this.emit(
            'info',
            `Webhook posted to ${redactUrlSecrets(url)} (${res.status} in ${res.durationMs} ms)`,
          );
        } else {
          this.emit(
            'info',
            `Webhook failed: ${res.status ?? 'no response'} — ${res.detail.slice(0, 120)}`,
          );
        }
      }),
    );
  }

  /**
   * Wrapper around `db.recomputeDuplicateClusters` that surfaces the
   * cluster count as an `info` event so the user can see the post-crawl
   * pass actually fired. Threshold = 0 disables clustering.
   */
  private runDuplicateClustering(): void {
    const threshold = this.config.nearDuplicateHammingThreshold;
    if (!threshold || threshold <= 0) return;
    try {
      const { clusters, clusteredUrls } = this.db.recomputeDuplicateClusters(
        threshold,
        this.config.duplicatesOnlyIndexable,
      );
      if (clusters > 0) {
        this.emit(
          'info',
          `Duplicates: ${clusters} near-duplicate clusters across ${clusteredUrls} URLs (hamming ≤ ${threshold})`,
        );
      }
    } catch (err) {
      this.emit(
        'error',
        new Error(
          `recomputeDuplicateClusters failed: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    }
  }

  /**
   * Post-crawl HEAD probe over images (internal + external) so the DB knows
   * their byte size for the "Large Image" issue and their status for the
   * "Broken Image src" issue (incl. dead external/CDN images). HEAD-only —
   * no body download — so cost is one round-trip per image. Concurrency is
   * bounded by the same setting as the main crawl; failures are silent
   * (probe_status stays null and the issue check skips them).
   */
  private async runImageSizeProbes(): Promise<void> {
    if (!this.config.probeImageSizes) return;
    if (this.stopped) return;
    let unprobed: { id: number; src: string }[] = [];
    try {
      unprobed = this.db.unprobedImages(20_000);
    } catch (err) {
      this.emit(
        'info',
        `image-size probe skipped (DB query failed): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return;
    }
    if (unprobed.length === 0) return;
    this.emit('info', `Probing ${unprobed.length} image size(s)…`);

    const concurrency = Math.max(1, Math.min(this.config.maxConcurrency, 20));
    let cursor = 0;
    let probed = 0;
    let large = 0;
    const threshold = Math.max(1, this.config.largeImageBytes);

    const worker = async (): Promise<void> => {
      while (!this.stopped) {
        const idx = cursor++;
        if (idx >= unprobed.length) return;
        const entry = unprobed[idx];
        if (!entry) return;
        // SSRF guard — same as probeExternal: an image `src` can point at an
        // internal address just as a link can.
        if (isPrivateHost(entry.src) && !isPrivateHost(this.config.startUrl)) {
          this.db.setImageSize(entry.id, null, 0);
          continue;
        }
        // Only send the crawl's auth/custom headers to in-scope image hosts;
        // third-party / CDN image URLs must not receive the start site's creds.
        const imgInScope = isInScope(this.config.startUrl, entry.src, this.config.scope);
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          Math.max(2_000, this.config.requestTimeoutMs / 2),
        );
        try {
          const res = await undiciFetch(entry.src, {
            method: 'HEAD',
            headers: defaultRequestHeaders(
              this.resolveUserAgent(entry.src),
              this.config.acceptLanguage,
              imgInScope ? this.config.customHeaders : {},
              imgInScope ? this.config.auth : undefined,
            ),
            redirect: 'follow',
            signal: controller.signal,
          });
          const lenStr = res.headers.get('content-length');
          const len = lenStr !== null ? Number.parseInt(lenStr, 10) : null;
          this.db.setImageSize(
            entry.id,
            Number.isFinite(len) && len !== null && len >= 0 ? len : null,
            res.status,
          );
          if (Number.isFinite(len) && len !== null && len > threshold) {
            large++;
          }
          probed++;
          // Drain body — HEAD has none, but undici treats 1xx/204 weirdly.
          try {
            await res.body?.cancel();
          } catch {
            /* ignore */
          }
        } catch {
          // Mark with status 0 so we don't re-probe on the next crawl.
          try {
            this.db.setImageSize(entry.id, null, 0);
          } catch {
            /* ignore */
          }
        } finally {
          clearTimeout(timeout);
        }
      }
    };

    const workers: Promise<void>[] = [];
    for (let i = 0; i < concurrency; i++) workers.push(worker());
    await Promise.all(workers);
    this.emit(
      'info',
      `Image probe complete: ${probed} sized, ${large} > ${(threshold / 1024).toFixed(0)} KB`,
    );
  }

  /**
   * Post-crawl TLS handshake probe. Walks unique HTTPS hosts crawled,
   * opens one TLS connection per host, persists the peer cert details
   * for the SSL audit issues. Concurrency is small (4) because most
   * crawls have at most a few unique hosts and the cost is dominated by
   * the handshake round-trip, not throughput.
   */
  /**
   * Post-crawl pass: GET each declared `<link rel="manifest">` URL once
   * and stamp parsed fields onto every URL that referenced it. Manifest
   * URLs are usually site-wide singletons (one fetch covers thousands
   * of pages) so concurrency is small. Failures store an error string
   * in the per-URL `manifest_json` column so the next crawl re-probes.
   */
  private async runManifestProbes(): Promise<void> {
    if (!this.config.probeManifestJson) return;
    if (this.stopped) return;
    let urls: string[] = [];
    try {
      urls = this.db.unprobedManifestUrls(2_000);
    } catch (err) {
      this.emit(
        'info',
        `manifest probe skipped (DB query failed): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return;
    }
    if (urls.length === 0) return;
    this.emit('info', `Probing ${urls.length} web manifest(s)…`);

    const { probeManifest } = await import('./manifest-probe.js');
    const concurrency = 4;
    let cursor = 0;
    let probed = 0;
    let failed = 0;

    const worker = async (): Promise<void> => {
      while (!this.stopped) {
        const idx = cursor++;
        if (idx >= urls.length) return;
        const url = urls[idx];
        if (!url) return;
        try {
          const result = await probeManifest(url, {
            userAgent: this.resolveUserAgent(url),
            acceptLanguage: this.config.acceptLanguage,
            customHeaders: this.config.customHeaders,
            auth: this.config.auth,
          });
          this.db.setManifestForReferrers({
            manifestUrl: url,
            rawJson: result.error ? null : result.rawJson,
            themeColor: result.themeColor,
            shortName: result.shortName,
            display: result.display,
            scope: result.scope,
            iconCount: result.iconCount,
          });
          if (result.error) failed++;
          probed++;
        } catch {
          failed++;
        }
      }
    };

    const workers: Promise<void>[] = [];
    for (let i = 0; i < concurrency; i++) workers.push(worker());
    await Promise.all(workers);
    this.emit(
      'info',
      `Manifest probe complete: ${probed - failed}/${probed} parsed, ${failed} failed`,
    );
  }

  /**
   * V2 Faz 16 #1 — Post-crawl social-image dimension probe. Ranged-GETs
   * each distinct `og:image` / `twitter:image` (heavily deduplicated —
   * usually a handful per site), reads its pixel width × height from the
   * header, and stamps them onto every referencing page. Feeds the
   * social-card aspect-ratio issue filters. Undecodable / failed fetches
   * record 0×0 so the image isn't re-probed on the next crawl.
   */
  private async runSocialImageProbes(): Promise<void> {
    if (!this.config.probeSocialImages) return;
    if (this.stopped) return;
    let urls: string[] = [];
    try {
      urls = this.db.unprobedSocialImageUrls(5_000);
    } catch (err) {
      this.emit(
        'info',
        `social-image probe skipped (DB query failed): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return;
    }
    if (urls.length === 0) return;
    this.emit('info', `Probing ${urls.length} social image(s)…`);

    const { probeSocialImageDimensions } = await import('./social-image-probe.js');
    const concurrency = Math.max(1, Math.min(this.config.maxConcurrency, 8));
    let cursor = 0;
    let decoded = 0;

    const worker = async (): Promise<void> => {
      while (!this.stopped) {
        const idx = cursor++;
        if (idx >= urls.length) return;
        const src = urls[idx];
        if (!src) return;
        let dims: { width: number; height: number } | null = null;
        try {
          dims = await probeSocialImageDimensions(src, {
            userAgent: this.resolveUserAgent(src),
            acceptLanguage: this.config.acceptLanguage,
            customHeaders: this.config.customHeaders,
            auth: this.config.auth,
          });
        } catch {
          dims = null;
        }
        try {
          // 0×0 marks "probed but undecodable" so the row leaves the
          // unprobed set and we don't re-fetch a broken image next crawl.
          this.db.setSocialImageDimsForReferrers({
            src,
            width: dims?.width ?? 0,
            height: dims?.height ?? 0,
          });
        } catch {
          /* ignore — best-effort */
        }
        if (dims) decoded++;
      }
    };

    const workers: Promise<void>[] = [];
    for (let i = 0; i < concurrency; i++) workers.push(worker());
    await Promise.all(workers);
    this.emit(
      'info',
      `Social-image probe complete: ${decoded}/${urls.length} dimensions read`,
    );
  }

  /**
   * V2 Faz 16 — extract document metadata (title / author / page count /
   * creation date / producer) from internal PDFs. Mirrors the manifest /
   * social-image probe shape, but PDFs are their own URL rows so each
   * result is a plain per-row update (no fan-out). Small concurrency pool;
   * each probe is ranged + best-effort so one bad PDF never aborts the
   * pass. `pdf_probe_status` records 1 / 0 / negative so a probed PDF
   * drops out of `unprobedPdfUrls` and isn't re-fetched on the next crawl.
   */
  private async runPdfMetadataProbes(): Promise<void> {
    if (!this.config.probePdfMetadata) return;
    if (this.stopped) return;
    let urls: string[] = [];
    try {
      urls = this.db.unprobedPdfUrls(2_000);
    } catch (err) {
      this.emit(
        'info',
        `PDF metadata probe skipped (DB query failed): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return;
    }
    if (urls.length === 0) return;
    this.emit('info', `Probing ${urls.length} PDF(s) for metadata…`);

    const { probePdfMetadata } = await import('./pdf-probe.js');
    const concurrency = Math.max(1, Math.min(this.config.maxConcurrency, 6));
    let cursor = 0;
    let withMeta = 0;
    let failed = 0;

    const worker = async (): Promise<void> => {
      while (!this.stopped) {
        const idx = cursor++;
        if (idx >= urls.length) return;
        const url = urls[idx];
        if (!url) return;
        try {
          const result = await probePdfMetadata(url, {
            userAgent: this.resolveUserAgent(url),
            acceptLanguage: this.config.acceptLanguage,
            customHeaders: this.config.customHeaders,
            auth: this.config.auth,
          });
          const hasMeta =
            result.title !== null ||
            result.author !== null ||
            result.pageCount !== null ||
            result.creationDate !== null ||
            result.producer !== null;
          // 1 = metadata found, 0 = probed-but-empty, -1 = fetch/parse error.
          const status = result.error ? -1 : hasMeta ? 1 : 0;
          this.db.setPdfMetadata({
            url,
            title: result.title,
            author: result.author,
            pageCount: result.pageCount,
            creationDate: result.creationDate,
            producer: result.producer,
            status,
          });
          if (result.error) failed++;
          else if (hasMeta) withMeta++;
        } catch {
          // Couldn't even fetch/record — mark errored so we don't loop on it.
          try {
            this.db.setPdfMetadata({
              url,
              title: null,
              author: null,
              pageCount: null,
              creationDate: null,
              producer: null,
              status: -1,
            });
          } catch {
            /* best-effort */
          }
          failed++;
        }
      }
    };

    const workers: Promise<void>[] = [];
    for (let i = 0; i < concurrency; i++) workers.push(worker());
    await Promise.all(workers);
    this.emit(
      'info',
      `PDF metadata probe complete: ${withMeta}/${urls.length} with metadata, ${failed} failed`,
    );
  }

  /**
   * V2 Faz 15 — performance budget pass. Stamps each internal 200 HTML
   * page with a bitmask of which configured ceilings it exceeded
   * (response time / transfer size / LCP / CLS). Pure SQL on the DB, so
   * it runs synchronously; when the budget is disabled the column is
   * wiped to NULL. No-ops when unsupported (older DB without the method).
   */
  private runBudgetPass(): void {
    if (this.stopped) return;
    const budget = this.config.performanceBudget;
    if (!budget) return;
    if (typeof this.db.recomputeBudgetViolations !== 'function') return;
    try {
      const result = this.db.recomputeBudgetViolations(budget);
      if (budget.enabled && result.evaluated > 0) {
        this.emit(
          'info',
          `Performance budget: ${result.overBudget}/${result.evaluated} page(s) over budget`,
        );
      }
    } catch (err) {
      this.emit(
        'error',
        new Error(
          `recomputeBudgetViolations failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        ),
      );
    }
  }

  private async runTlsCertProbes(): Promise<void> {
    if (!this.config.probeTlsCerts) return;
    if (this.stopped) return;
    let hosts: string[] = [];
    try {
      hosts = this.db.unprobedHttpsHosts(2_000);
    } catch (err) {
      this.emit(
        'info',
        `TLS probe skipped (DB query failed): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return;
    }
    if (hosts.length === 0) return;
    this.emit('info', `Probing TLS certificates for ${hosts.length} host(s)…`);

    // Lazy-import the TLS module so CLI / non-HTTPS workflows don't pay
    // the load cost.
    const { probeTlsCert } = await import('./tls-probe.js');

    const concurrency = 4;
    let cursor = 0;
    let probed = 0;
    let expired = 0;
    let expiringSoon = 0;

    const worker = async (): Promise<void> => {
      while (!this.stopped) {
        const idx = cursor++;
        if (idx >= hosts.length) return;
        const host = hosts[idx];
        if (!host) return;
        try {
          const info = await probeTlsCert(
            host,
            443,
            Math.max(2_000, this.config.requestTimeoutMs / 2),
          );
          this.db.setHostCert({
            host,
            port: 443,
            validFrom: info.validFrom,
            validTo: info.validTo,
            daysUntilExpiry: info.daysUntilExpiry,
            issuer: info.issuer,
            subject: info.subject,
            signatureAlgorithm: info.signatureAlgorithm,
            protocol: info.protocol,
            chainLength: info.chainLength,
            chainSubjects: info.chainSubjects,
            probeStatus: info.error ? 0 : 200,
            probeError: info.error,
          });
          if (info.daysUntilExpiry !== null) {
            if (info.daysUntilExpiry < 0) expired++;
            else if (info.daysUntilExpiry <= 30) expiringSoon++;
          }
          probed++;
        } catch (err) {
          try {
            this.db.setHostCert({
              host,
              port: 443,
              validFrom: null,
              validTo: null,
              daysUntilExpiry: null,
              issuer: null,
              subject: null,
              signatureAlgorithm: null,
              protocol: null,
              chainLength: null,
              chainSubjects: null,
              probeStatus: 0,
              probeError: err instanceof Error ? err.message : String(err),
            });
          } catch {
            /* ignore — DB failure is non-fatal for the probe pass */
          }
        }
      }
    };

    const workers: Promise<void>[] = [];
    for (let i = 0; i < concurrency; i++) workers.push(worker());
    await Promise.all(workers);
    this.emit(
      'info',
      `TLS probe complete: ${probed} hosts, ${expired} expired, ${expiringSoon} expiring ≤30d`,
    );
  }

  /**
   * List-mode entry point — fetch each URL in `urlList` exactly once, no
   * link follow, no robots.txt, no sitemap discovery. The start URL field
   * is repurposed to a list-fingerprint so the resume / reset decision
   * still works (changing the list re-runs from scratch).
   *
   * The fetch / parse / persist pipeline (`fetchAndProcess`) is shared
   * with spider mode — the only difference here is what we put on the
   * queue and the disabled scope so links never get re-enqueued.
   */
  private async startListMode(): Promise<void> {
    const urls = this.dedupeNormalized(this.config.urlList);
    if (urls.length === 0) {
      this.emit('error', 'List mode: urlList is empty (or no entries normalised to valid URLs).');
      this.finishEmptyFixedCrawl();
      return;
    }
    // Fingerprint: list signature is "list:<count>:<first-url>". Two crawls
    // with the same first URL + same count look identical — good enough
    // heuristic; users who really want a fresh start can use Clear.
    const fingerprint = `list:${urls.length}:${urls[0] ?? ''}`;
    await this.runFixedUrlCrawl(urls, fingerprint);
  }

  /**
   * Sitemap-mode entry point — treat `startUrl` as a sitemap (or
   * sitemap-index) URL, fetch + parse it, then crawl every `<loc>` it
   * lists exactly once (no link follow — same engine as List mode). The
   * parsed entries are also persisted to `sitemap_urls` so the post-crawl
   * orphan / sitemap-issue reports have data to compare against. Fetch
   * failures surface as an 'error' event, never thrown.
   */
  private async startSitemapMode(): Promise<void> {
    const sitemapUrl = this.config.startUrl.trim();
    if (!sitemapUrl) {
      this.emit('error', 'Sitemap mode: no sitemap URL provided.');
      this.finishEmptyFixedCrawl();
      return;
    }

    this.applyProcessPriority();

    const controller = new AbortController();
    this.sitemapAbort = controller;
    // Sitemap fetch gets a longer budget than passive discovery — it is
    // the crawl's only URL source here, so a slow server shouldn't abort
    // the whole run prematurely.
    const t = setTimeout(
      () => controller.abort(),
      Math.max(30_000, this.config.requestTimeoutMs * 2),
    );
    let entries: SitemapEntry[] = [];
    try {
      const sitemapMaxUrls = Math.max(50_000, this.config.maxUrls);
      const result = await fetchSitemaps([sitemapUrl], {
        userAgent: this.config.userAgent,
        signal: controller.signal,
        timeoutMs: this.config.requestTimeoutMs,
        maxUrls: sitemapMaxUrls,
        maxDepth: 3,
        rewrites: this.urlRewrites,
      });
      entries = result.entries;
      this.emit(
        'info',
        `Sitemap mode: parsed ${result.sitemapsParsed.length}/${result.sitemapsTried.length} sitemap(s), ${entries.length} URL(s)${result.truncated ? ` (truncated at ${sitemapMaxUrls.toLocaleString()})` : ''}`,
      );
    } catch (err) {
      if (!this.stopped) {
        this.emit(
          'error',
          `Sitemap mode: could not fetch ${sitemapUrl} — ${formatFetchError(err)}`,
        );
      }
      this.finishEmptyFixedCrawl();
      return;
    } finally {
      clearTimeout(t);
      this.sitemapAbort = null;
    }

    if (this.stopped) return;

    const urls = this.dedupeNormalized(entries.map((e) => e.url));
    if (urls.length === 0) {
      this.emit('error', `Sitemap mode: ${sitemapUrl} yielded no crawlable URLs.`);
      this.finishEmptyFixedCrawl();
      return;
    }

    const fingerprint = `sitemap:${sitemapUrl}:${urls.length}`;
    // Persist entries for orphan / sitemap reports — but only *after* the
    // reset inside runFixedUrlCrawl, else the DELETE-all in setSitemapUrls
    // would be wiped by the table reset. The callback runs post-reset.
    await this.runFixedUrlCrawl(urls, fingerprint, async () => {
      if (entries.length > 0) {
        await this.dbCall<void>('setSitemapUrls', [entries]);
      }
    });
  }

  /** Normalise + dedupe a raw URL list, dropping entries that don't
   *  normalise to a valid URL. Shared by List and Sitemap modes. */
  private dedupeNormalized(raw: readonly string[]): string[] {
    const urls: string[] = [];
    const seenInList = new Set<string>();
    for (const r of raw) {
      const norm = normalizeUrl(r, undefined, this.urlRewrites);
      if (!norm) continue;
      if (seenInList.has(norm)) continue;
      seenInList.add(norm);
      urls.push(norm);
    }
    return urls;
  }

  /** Clean-completion path for an empty fixed-URL crawl (List / Sitemap
   *  with nothing to fetch): stop, clear the resume checkpoint, emit done. */
  private finishEmptyFixedCrawl(): void {
    this.running = false;
    this.emitProgressFinal();
    if (!this.stopped) {
      try {
        this.db.clearQueueCheckpoint();
      } catch {
        /* checkpoint table may not yet exist on very old DBs — ignore */
      }
      this.emit('done', this.db.getSummary());
    }
  }

  /**
   * Shared engine for the two "fetch a fixed set of URLs, don't follow
   * links" modes (List and Sitemap). Handles the reset/resume fingerprint,
   * forces exact-url scope so outlinks never re-enqueue, runs the crawl to
   * idle, then the standard post-crawl passes. `afterReset` (optional) runs
   * after the reset/setMeta but before enqueue — used by Sitemap mode to
   * (re)populate `sitemap_urls` once the table reset has settled.
   */
  private async runFixedUrlCrawl(
    urls: string[],
    fingerprint: string,
    afterReset?: () => Promise<void>,
  ): Promise<void> {
    const previousStart = this.db.getMeta('startUrl');
    // A crash-recovery resume continues the interrupted crawl, so its rows
    // must survive even though the fingerprint may no longer match — a
    // sitemap that gained or lost a single URL changes the count baked into
    // it, and wiping there would destroy exactly the data the user asked to
    // keep. The fingerprint is left pointing at the list that was actually
    // crawled, so a later Start still reads a drifted list as a new crawl.
    if (!this.resumeOnly) {
      if (previousStart !== fingerprint) {
        this.db.reset();
      }
      this.db.setMeta('startUrl', fingerprint);
    }
    if (afterReset) await afterReset();

    // Force exact-url scope so anything fetched in fetchAndProcess never
    // re-enqueues its outlinks, and bake the first URL into startUrl so
    // progress events have a sensible label.
    this.config = {
      ...this.config,
      scope: 'exact-url',
      startUrl: urls[0]!,
    };

    this.applyProcessPriority();
    this.startMemoryMonitor();

    this.progressTimer = setInterval(() => this.emitProgress(), 500);
    this.startIssueRecomputeTimer();
    this.startQueueCheckpointTimer();

    // Resume: mark everything already in the project as seen so the loop
    // below only picks up what is genuinely still outstanding. Without it a
    // resumed List/Sitemap run re-fetches the whole source list — the exact
    // "it didn't carry on where it left off" the checkpoint exists to
    // prevent. Spider mode gets the same treatment from `hydrateFromDb`.
    // The checkpointed pending URLs are already queued by the caller
    // (`enqueueCheckpointed`) before `start()`, so they survive this sweep;
    // list entries added since the interruption are still picked up below.
    if (this.resumeOnly) {
      for (const known of this.db.getAllUrls()) {
        this.seen.add(known);
      }
      this.crawled = this.db.countCrawledUrls();
      this.resourceAdmitted = this.db.countSubresourceUrls();
    }

    for (const u of urls) {
      this.enqueue({ url: u, depth: 0 });
    }

    try {
      await this.queue.onIdle();
      await this.externalQueue.onIdle();
    } finally {
      if (this.progressTimer) clearInterval(this.progressTimer);
      this.progressTimer = null;
      if (this.memoryWatchdogTimer) clearInterval(this.memoryWatchdogTimer);
      this.memoryWatchdogTimer = null;
      this.stopIssueRecomputeTimer();
      this.stopQueueCheckpointTimer();
    }

    // Identical post-crawl pipeline to spider mode — routed through the
    // writer-worker hooks (runDbPass / recomputeIssues) instead of blocking
    // SQL on the main thread, and now includes boilerplate coverage +
    // manifest probes that list mode previously skipped. See rule 1.7.
    await this.runPostCrawlPasses();
    this.running = false;
    this.stopMemoryMonitor();
    this.seen.clear();
    this.externalSeen.clear();
    this.emitProgressFinal();
    if (!this.stopped) {
      // Wave 6 — Clean completion clears the checkpoint so the next
      // app launch doesn't offer to "resume" a crawl that already
      // finished successfully.
      try {
        this.db.clearQueueCheckpoint();
      } catch {
        /* checkpoint table may not yet exist on very old DBs — ignore */
      }
      this.emit('done', this.db.getSummary());
    }
  }

  /**
   * Discover + ingest sitemaps off the critical path. Runs in parallel
   * with the actual crawl so the user sees rows trickle in immediately
   * instead of staring at an empty table for 3–4 s while a 20k-URL
   * sitemap is fetched. Errors are surfaced via 'error' / 'info' events,
   * never thrown — sitemap discovery is best-effort.
   *
   * Handles two sources in one pass so `sitemap_urls` is written exactly
   * once (it is a replace-all table — two concurrent writers would clobber
   * each other):
   *   1. Auto-discovered roots (robots.txt + conventional paths), when
   *      `discoverSitemaps` is on. Recorded only.
   *   2. User-supplied `seedSitemapUrls` (spider mode). Recorded AND their
   *      `<loc>` entries are enqueued as extra depth-0 crawl seeds — so a
   *      sitemap at a non-standard path still feeds discovery + reports.
   */
  private async discoverAndIngestSitemaps(origin: string): Promise<void> {
    try {
      const controller = new AbortController();
      this.sitemapAbort = controller;
      // Sitemap discovery is preliminary work — keep its budget bounded
      // so a slow sitemap server can't stall post-crawl recompute.
      const t = setTimeout(
        () => controller.abort(),
        Math.max(5000, this.config.requestTimeoutMs),
      );
      try {
        // Sitemap entry cap follows the crawl-level cap so 1M-URL crawls
        // can ingest the full sitemap, with a sensible floor for tiny caps.
        const sitemapMaxUrls = Math.max(50_000, this.config.maxUrls);
        const fetchOpts = {
          userAgent: this.config.userAgent,
          signal: controller.signal,
          timeoutMs: this.config.requestTimeoutMs,
          maxUrls: sitemapMaxUrls,
          maxDepth: 3,
          rewrites: this.urlRewrites,
        };

        // (1) Auto-discovered sitemaps — recorded only.
        let autoEntries: SitemapEntry[] = [];
        if (this.config.discoverSitemaps) {
          const roots = await discoverSitemapUrls(
            origin,
            this.config.userAgent,
            controller.signal,
          );
          // If stop() ran while we were discovering, bail without ingesting
          // — otherwise a zombie 'info' / 'sitemap_urls' write leaks into
          // whatever crawl ran next.
          if (this.stopped) return;
          const res = await fetchSitemaps(roots, fetchOpts);
          if (this.stopped) return;
          autoEntries = res.entries;
          if (res.entries.length > 0) {
            this.emit(
              'info',
              `Sitemap: parsed ${res.sitemapsParsed.length}/${res.sitemapsTried.length}, ${res.entries.length} URLs${res.truncated ? ` (truncated at ${sitemapMaxUrls.toLocaleString()})` : ''}`,
            );
          }
          // Spider → Crawl "Crawl Linked XML Sitemaps". Auto-discovery on
          // its own only records entries, which is what the sitemap issue
          // filters compare against. Crawling them as well is what finds
          // orphans — pages the sitemap declares but nothing links to.
          if (this.config.crawlLinkedSitemaps) {
            let seeded = 0;
            for (const e of res.entries) {
              const norm = normalizeUrl(e.url, undefined, this.urlRewrites);
              if (!norm) continue;
              this.enqueue({ url: norm, depth: 0 });
              seeded++;
            }
            if (seeded > 0) {
              this.emit('info', `Sitemap: ${seeded} discovered URL(s) queued as crawl seeds`);
            }
          }
        }

        // (2) User-supplied seed sitemaps — recorded AND enqueued.
        let seedEntries: SitemapEntry[] = [];
        if (this.config.seedSitemapUrls.length > 0) {
          const res = await fetchSitemaps(this.config.seedSitemapUrls, fetchOpts);
          if (this.stopped) return;
          seedEntries = res.entries;
          let seeded = 0;
          for (const e of res.entries) {
            const norm = normalizeUrl(e.url, undefined, this.urlRewrites);
            if (!norm) continue;
            this.enqueue({ url: norm, depth: 0 });
            seeded++;
          }
          this.emit(
            'info',
            `Sitemap seed: ${seeded} URL(s) from ${res.sitemapsParsed.length}/${res.sitemapsTried.length} sitemap(s) queued as crawl seeds`,
          );
        }

        // Single merged write — seed entries first so their source wins on
        // `<loc>` conflicts (ON CONFLICT DO NOTHING keeps the first).
        if (this.stopped) return;
        const merged = [...seedEntries, ...autoEntries];
        if (merged.length > 0) {
          await this.dbCall<void>('setSitemapUrls', [merged]);
        }
      } finally {
        clearTimeout(t);
        this.sitemapAbort = null;
      }
    } catch (err) {
      // Aborts during stop() are expected and not user-visible noise.
      if (this.stopped) return;
      this.emit('error', `Sitemap discovery skipped: ${formatFetchError(err)}`);
    }
  }

  /** Known URLs a refresh run still has to re-fetch, and how far into it
   *  we are. Fed to the queue in slices rather than all at once — see
   *  `feedRefreshBacklog`. */
  private refreshBacklog: { url: string; depth: number }[] = [];
  private refreshBacklogIndex = 0;

  /** How many backlog URLs to queue per top-up. */
  private static readonly REFRESH_FEED_CHUNK = 5000;

  /**
   * Queue the next slice of a refresh run's backlog.
   *
   * Dumping a whole site onto the queue in one go would materialise a
   * queue task per URL up front (a real memory spike past ~100 K pages)
   * and, worse, silently lose the tail on any project with a
   * `maxQueueSize`: `enqueue` drops anything arriving above the cap, so
   * those pages would never be re-crawled and the run would report
   * success having skipped them. Feeding in slices and topping up as the
   * queue drains keeps coverage complete at any site size.
   */
  private feedRefreshBacklog(): void {
    if (this.stopped) return;
    if (this.refreshBacklogIndex >= this.refreshBacklog.length) return;
    const cap = this.config.maxQueueSize;
    const room =
      cap > 0
        ? Math.max(0, cap - (this.queue.size + this.queue.pending))
        : Crawler.REFRESH_FEED_CHUNK;
    const take = Math.min(Crawler.REFRESH_FEED_CHUNK, room);
    if (take <= 0) return;
    const end = Math.min(
      this.refreshBacklog.length,
      this.refreshBacklogIndex + take,
    );
    for (; this.refreshBacklogIndex < end; this.refreshBacklogIndex++) {
      const row = this.refreshBacklog[this.refreshBacklogIndex]!;
      // Already known, so `seen` holds it from the hydrate sweep above —
      // drop it so enqueue accepts the re-fetch. Anything the live
      // link-follow path reaches first stays deduped: enqueue re-adds it
      // to `seen`, and the backlog's own enqueue then no-ops.
      this.seen.delete(row.url);
      this.enqueue({ url: row.url, depth: row.depth });
    }
  }

  private hydrateFromDb(opts: { refresh: boolean } = { refresh: false }): void {
    // Mark every already-known URL as "seen" so enqueue can skip them.
    for (const url of this.db.getAllUrls()) {
      this.seen.add(url);
    }
    // A refresh counts its own work from zero — the progress bar should
    // read "0 of 122 re-crawled", not start at 122 and never move.
    this.crawled = opts.refresh ? 0 : this.db.countCrawledUrls();
    // Same reasoning for the subresource quota: a resumed crawl continues
    // spending the original allowance. A refresh re-crawls the known set, so
    // it starts over alongside `crawled`.
    this.resourceAdmitted = opts.refresh ? 0 : this.db.countSubresourceUrls();

    // Targeted Re-Spider: fetch only the listed URLs. They are dropped
    // from `seen` so enqueue accepts them despite already having rows;
    // everything else stays seen, so the run costs one request per seed
    // plus whatever genuinely new links those pages turn up.
    if (this.respiderSeeds !== null) {
      for (const url of this.respiderSeeds) {
        this.seen.delete(url);
        this.enqueue({ url, depth: this.db.getUrlDepth(url) ?? 0 });
      }
      return;
    }

    // Refresh run — Start pressed again on a site that is already in the
    // project. Re-fetch every page we hold, so a site the user has since
    // edited shows its current state and the reports are rebuilt from
    // fresh responses. Links discovered along the way that the project
    // has never seen are followed as usual, which is how pages added
    // since the last crawl get picked up.
    if (opts.refresh) {
      this.refreshBacklog = this.db.getCrawledInternalUrls();
      this.refreshBacklogIndex = 0;
      if (this.refreshBacklog.length > 0) {
        this.emit(
          'info',
          `Refresh: re-crawling ${this.refreshBacklog.length} known URL(s)…`,
        );
      }
      this.feedRefreshBacklog();
    }

    // If the start URL isn't in the DB yet, kick off a brand-new crawl from it.
    if (!this.db.hasUrl(this.config.startUrl)) {
      // Stub upsert before enqueue so the seed surfaces in the URL
      // table within ~100 ms of clicking Start instead of waiting for
      // the full network round-trip + parse + write (~2 s on a typical
      // site). status_code=null reads as "fetching" in the table.
      // fetchAndProcess's writeFetchedUrl later overwrites every field
      // with the real response data via INSERT … ON CONFLICT UPDATE.
      try {
        this.db.upsertUrl({
          url: this.config.startUrl,
          urlMalformed: isUrlMalformed(this.config.startUrl) ? 1 : 0,
          urlTrap: this.trapKind(this.config.startUrl),
          contentKind: 'html',
          statusCode: null,
          statusText: 'fetching',
          indexability: 'indexable',
          depth: 0,
        });
      } catch {
        /* non-fatal: fetchAndProcess will still write the real row */
      }
      this.enqueue({ url: this.config.startUrl, depth: 0 });
    }

    // Re-queue any internal link targets that were discovered before the
    // previous Stop but never actually fetched. Honour `followNofollow`
    // — without this filter, hitting Start a second time would crawl
    // every nofollow link target that the previous crawl had correctly
    // skipped, and the user would see "extra" URLs appear that the live
    // link-follow path would never have touched.
    const excludeNofollow = !this.config.followNofollow;
    for (const pending of this.db.getPendingInternalLinks({ excludeNofollow })) {
      // Drop from `seen` so enqueue accepts it — these URLs are genuinely
      // unfinished work.
      this.seen.delete(pending.url);
      this.enqueue({ url: pending.url, depth: pending.depth });
    }

    // Re-queue any external URLs that were stubbed but never probed.
    for (const extUrl of this.db.getUnprobedExternalUrls()) {
      this.enqueueExternal(extUrl);
    }
  }

  private enqueueExternal(url: string): void {
    if (this.stopped) return;
    if (this.externalSeen.has(url)) return;
    // Bound external discovery the same way internal crawling is bounded.
    // Without these caps `externalSeen` and the probe queue grow without
    // limit on sites with a huge external-link graph (directories,
    // aggregators) — the internal `enqueue` has the same guards.
    if (this.externalSeen.size >= this.config.maxUrls) return;
    if (
      this.config.maxQueueSize > 0 &&
      this.externalQueue.size + this.externalQueue.pending >=
        this.config.maxQueueSize
    ) {
      return;
    }
    if (!this.passesUrlFilter(url)) return;
    this.externalSeen.add(url);
    this.externalQueue
      .add(() => this.probeExternal(url))
      .catch((err: unknown) => {
        this.emit(
          'error',
          `External probe error: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
  }

  private async probeExternal(url: string): Promise<void> {
    if (this.stopped) return;

    // SSRF guard: never fetch an internal/loopback/link-local address on
    // behalf of a crawled page (e.g. `http://169.254.169.254/…` cloud
    // metadata, `http://192.168.x/admin`). Skip unless the START host is
    // itself private — an intranet crawl legitimately targets private space.
    if (isPrivateHost(url) && !isPrivateHost(this.config.startUrl)) {
      await this.dbCall<void>('updateExternalProbe', [
        url,
        {
          statusCode: null,
          statusText: 'Skipped: private/internal address (SSRF guard)',
          responseTimeMs: 0,
        },
      ]);
      return;
    }

    // Only attach the crawl's Authorization / custom headers when the probe
    // host is within the crawl's own scope. Sending the start site's Basic
    // auth or a bypass header (`X-Vercel-Protection-Bypass`, …) to an
    // arbitrary third-party host is a credential leak — the fetch spec only
    // strips auth on cross-origin REDIRECTS, not on a direct fetch.
    const inScope = isInScope(this.config.startUrl, url, this.config.scope);
    const probeAuth = inScope ? this.config.auth : undefined;
    const probeHeaders = inScope ? this.config.customHeaders : {};

    const t0 = Date.now();
    const cfgUa = this.resolveUserAgent(url);

    // One fetch attempt with its OWN timeout budget. Giving HEAD and the GET
    // retry independent AbortControllers is what stops a hung HEAD from eating
    // the GET's time and collapsing a specific error (connect timeout, TLS
    // reject) into a generic "operation was aborted — raise your Timeout".
    const attempt = async (
      method: 'HEAD' | 'GET',
      ua: string,
      dispatcher?: Dispatcher,
    ): Promise<{ res?: Awaited<ReturnType<typeof undiciFetch>>; err?: unknown }> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
      try {
        const res = await undiciFetch(url, {
          method,
          headers: defaultRequestHeaders(
            ua,
            this.config.acceptLanguage,
            probeHeaders,
            probeAuth,
          ),
          // Always manual for external outlinks: an external link IS its
          // own response, so we report the link's immediate status. Under
          // 'follow' the recorded status was the FINAL hop's — so a working
          // `/old` (301 → 404 `/new`) was reported as 404 against `/old`,
          // and the user "fixed" the wrong link. Manual makes external
          // links consistent with how internal redirects are recorded
          // (30x + redirect target).
          redirect: 'manual',
          signal: controller.signal,
          ...(dispatcher ? { dispatcher } : {}),
        });
        return { res };
      } catch (err) {
        return { err };
      } finally {
        clearTimeout(timer);
      }
    };

    // 1) Cheap HEAD with the configured UA.
    let { res, err } = await attempt('HEAD', cfgUa);

    // 2) Retry with GET (browser UA) when HEAD is unreliable or threw a
    //    recoverable error. The browser UA slips past UA-based bot walls; the
    //    GET reveals the status a real visitor would get.
    const headBlocked =
      !!res && (res.status >= 500 || HEAD_UNRELIABLE_STATUSES.has(res.status));
    const headRecoverableThrow = !res && !isHardTransportError(err);
    if (headBlocked || headRecoverableThrow) {
      try {
        await res?.body?.cancel();
      } catch {
        /* ignore */
      }
      const got = await attempt('GET', BROWSER_FALLBACK_UA);
      if (got.res) {
        res = got.res;
        err = undefined;
      } else if (!res) {
        // Prefer the more specific of the two transport errors.
        err = got.err ?? err;
      }
    }

    // 3) Last-resort TLS-relaxed retry for incomplete-chain certificates that
    //    browsers accept (via AIA) but Node rejects. External link checking
    //    only needs the status code. Skipped when a proxy is active.
    if (!res && isCertVerifyError(err)) {
      const lenient = buildLenientDispatcher();
      if (lenient) {
        const got = await attempt('GET', BROWSER_FALLBACK_UA, lenient);
        if (got.res) {
          res = got.res;
          err = undefined;
        }
      }
    }

    const responseTimeMs = Date.now() - t0;
    if (res) {
      try {
        await res.body?.cancel();
      } catch {
        /* ignore */
      }
      // On a 3xx, resolve the Location so the row shows "→ target" the way
      // internal redirects do, instead of a bare status.
      let redirectTarget: string | null = null;
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (loc) redirectTarget = normalizeUrl(loc, url) ?? loc;
      }
      await this.dbCall<void>('updateExternalProbe', [
        url,
        {
          statusCode: res.status,
          statusText: res.statusText || null,
          contentType: res.headers.get('content-type'),
          contentLength: parseIntSafe(res.headers.get('content-length')),
          responseTimeMs,
          redirectTarget,
        },
      ]);
    } else {
      await this.dbCall<void>('updateExternalProbe', [
        url,
        {
          statusCode: null,
          statusText: formatFetchError(err),
          responseTimeMs,
        },
      ]);
    }
  }

  stop(): void {
    // Emit 'stopped' only on the first transition — clearCrawlDb and
    // the Stop IPC handler can both call stop() on the same instance.
    const wasStopped = this.stopped;
    this.stopped = true;
    this.running = false;
    this.paused = false;
    this.setOp('idle');
    this.stopMemoryMonitor();
    // Stop the periodic checkpoint timer immediately. Without this,
    // the 30-second setInterval keeps firing until start()'s `finally`
    // block tears it down — which on a stop-during-post-crawl can run
    // after `db.reset()` (Clear button), repopulating crawl_queue from
    // a stale `pendingItems` snapshot and resurrecting the recovery
    // prompt on the next launch.
    this.stopQueueCheckpointTimer();
    this.stopIssueRecomputeTimer();
    // Cancel any in-flight sitemap discovery so its 'info' / 'done'
    // events don't leak into the next crawl.
    if (this.sitemapAbort) {
      try {
        this.sitemapAbort.abort();
      } catch {
        /* ignore */
      }
      this.sitemapAbort = null;
    }
    // Abort every in-flight HTTP fetch. Without this, Stop only halts
    // *new* dispatch — the ~20 fetches already in flight would each
    // finish their request and write a row, which races with Clear's
    // db.reset() and resurrects ~19 rows in the table. The catch
    // branch in fetchAndProcess detects the stopped-abort and exits
    // silently without writing.
    for (const c of this.inFlightFetchControllers) {
      try {
        c.abort();
      } catch {
        /* ignore — already aborted */
      }
    }
    // Drop any queued work. If paused, unblock onIdle() so start() can resolve.
    this.queue.clear();
    this.externalQueue.clear();
    this.queue.start();
    this.externalQueue.start();
    if (!wasStopped) this.emit('stopped');
  }

  pause(): void {
    if (this.stopped || this.paused) return;
    this.paused = true;
    // PQueue.pause() halts new dispatch. By itself that lets every
    // in-flight fetch run to completion — at concurrency 20 the user
    // sees ~20 more URLs land in the table before things stop, which
    // reads as "Pause didn't work." Aborting the live controllers
    // turns Pause into "stop now": fetchAndProcess detects a paused-
    // abort, re-enqueues the URL, and returns without writing a row.
    this.queue.pause();
    this.externalQueue.pause();
    for (const c of this.inFlightFetchControllers) {
      try {
        c.abort();
      } catch {
        /* ignore — already aborted */
      }
    }
    this.setOp('paused');
    // User-initiated state change — never throttle it, the button must
    // flip on the next frame rather than up to 200 ms later.
    this.emitProgressFinal();
  }

  resume(): void {
    if (this.stopped || !this.paused) return;
    this.paused = false;
    this.queue.start();
    this.externalQueue.start();
    this.setOp('idle');
    this.emitProgressFinal();
  }

  get isRunning(): boolean {
    return !this.stopped;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  private dnsAnnouncedTier2 = false;
  private dnsAnnouncedTier3 = false;

  /**
   * Wire DNS-tier escalation events from the global resilient resolver
   * into this Crawler's event stream. Surfaces in the in-app Logs window
   * as a one-time `warn` per tier per crawl ("DNS bypass active …"), then
   * subsequent per-host lookups stay at debug level so the log panel
   * isn't flooded.
   *
   * The hook is auto-cleared when this crawl emits `done` so a future
   * Crawler instance — or a stop()-then-restart cycle — installs a fresh
   * announcement state and we don't leak `this` into module-level state.
   */
  private installDnsHook(): void {
    this.dnsAnnouncedTier2 = false;
    this.dnsAnnouncedTier3 = false;
    setActiveDnsHook((event) => {
      if (event.outcome === 'success' && event.tier === 'public-udp') {
        if (!this.dnsAnnouncedTier2) {
          this.dnsAnnouncedTier2 = true;
          this.emit(
            'warn',
            `DNS bypass active: system resolver unavailable, falling back to public DNS (${event.via}) for ${event.hostname}. Crawl continues automatically — no user action required.`,
          );
        } else {
          this.emit(
            'debug',
            `DNS via public UDP: ${event.hostname} (${event.via}) in ${event.durationMs}ms`,
          );
        }
      } else if (event.outcome === 'success' && event.tier === 'doh') {
        if (!this.dnsAnnouncedTier3) {
          this.dnsAnnouncedTier3 = true;
          this.emit(
            'warn',
            `DNS bypass active (DoH): port-53 unreachable on this network, resolving via DNS-over-HTTPS to ${event.via} for ${event.hostname}. Crawl continues automatically — no user action required.`,
          );
        } else {
          this.emit(
            'debug',
            `DNS via DoH: ${event.hostname} (${event.via}) in ${event.durationMs}ms`,
          );
        }
      } else if (event.outcome === 'failure') {
        // Tier failures during a successful cascade are normal (Tier 1
        // failed → Tier 2 succeeded). Keep them at debug so the panel
        // doesn't fill with "queryA ECONNREFUSED" entries that the user
        // can't act on.
        this.emit(
          'debug',
          `DNS tier '${event.tier}' failed for ${event.hostname}: ${event.error ?? 'unknown'}`,
        );
      }
    });
    this.once('done', () => setActiveDnsHook(null));
  }

  /**
   * One-shot environment diagnostics emitted as soon as a crawl starts.
   * Surfaces the proxy / TLS / runtime context to the log panel so a user
   * (or support) can tell at a glance whether a packaged-app crawl is
   * being intercepted by a corporate proxy or antivirus HTTPS inspection.
   * Each line is its own log entry so filtering by source = "crawler"
   * picks them up alongside the rest of the crawl noise.
   */
  private emitEnvDiagnostics(): void {
    const diag = collectNetworkDiagnostics({ proxyOverride: this.config.proxyUrl });
    this.emit(
      'info',
      `Runtime: Node ${process.version} on ${process.platform}/${process.arch}` +
        (diag.electronVersion ? ` (Electron ${diag.electronVersion})` : '') +
        (diag.undiciVersion ? `, undici ${diag.undiciVersion}` : ''),
    );
    if (diag.proxyUrl) {
      this.emit(
        'warn',
        `HTTP proxy active (${diag.proxySource}): ${diag.proxyUrl}` +
          (diag.noProxy ? ` — bypass list: ${diag.noProxy}` : ''),
      );
    } else {
      this.emit('info', 'No HTTP proxy configured (direct connections to origins).');
    }
    if (diag.caBundleSet) {
      this.emit(
        'info',
        'NODE_EXTRA_CA_CERTS is set — using a custom CA bundle (corporate root or self-signed).',
      );
    }
    if (!diag.tlsRejectUnauthorized) {
      this.emit(
        'warn',
        'NODE_TLS_REJECT_UNAUTHORIZED=0 — TLS certificate validation is DISABLED. Crawls will trust any cert; only set this for testing.',
      );
    }
    this.emit(
      'debug',
      `Crawl config: timeoutMs=${this.config.requestTimeoutMs}, retries=${this.config.retryAttempts}, ua="${this.config.userAgent}", followRedirects=${this.config.followRedirects}, respectRobots=${this.config.respectRobotsTxt}, sitemaps=${this.config.discoverSitemaps}`,
    );
  }

  /**
   * Apply the configured OS scheduling priority to the current process.
   * `os.setPriority` throws on unsupported platforms / EPERM, so failure
   * is logged-as-info, not fatal.
   */
  private applyProcessPriority(): void {
    const map: Record<CrawlConfig['processPriority'], number> = {
      normal: os.constants.priority.PRIORITY_NORMAL,
      'below-normal': os.constants.priority.PRIORITY_BELOW_NORMAL,
      idle: os.constants.priority.PRIORITY_LOW,
    };
    const target = map[this.config.processPriority];
    if (target === undefined) return;
    try {
      os.setPriority(0, target);
      if (this.config.processPriority !== 'normal') {
        this.emit('info', `Process priority set to ${this.config.processPriority}`);
      }
    } catch (err) {
      this.emit(
        'info',
        `Could not set process priority: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Soft memory cap. Polls RSS every 3s; when over `memoryLimitMb`, pauses
   * the queues (auto-paused flag distinguishes this from user-initiated
   * pause). When RSS drops below 80% of the cap, auto-resumes — but only
   * if the user hasn't separately paused. 0 disables the monitor.
   */
  private startMemoryMonitor(): void {
    const limitMb = this.config.memoryLimitMb;
    if (!limitMb || limitMb <= 0) return;
    const limitBytes = limitMb * 1024 * 1024;
    const resumeAtBytes = limitBytes * 0.8;
    this.memoryMonitorTimer = setInterval(() => {
      if (this.stopped) return;
      const rss = process.memoryUsage().rss;
      if (!this.memoryAutoPaused && !this.paused && rss > limitBytes) {
        this.memoryAutoPaused = true;
        this.queue.pause();
        this.externalQueue.pause();
        this.emit(
          'info',
          `Memory soft limit hit (${Math.round(rss / 1024 / 1024)} MB > ${limitMb} MB) — auto-pausing queue`,
        );
      } else if (this.memoryAutoPaused && rss < resumeAtBytes) {
        this.memoryAutoPaused = false;
        if (!this.paused) {
          this.queue.start();
          this.externalQueue.start();
          this.emit(
            'info',
            `Memory back under threshold (${Math.round(rss / 1024 / 1024)} MB) — resuming queue`,
          );
        }
      }
    }, 3000);
    // Don't keep the event loop alive for the timer alone.
    this.memoryMonitorTimer.unref?.();
  }

  private stopMemoryMonitor(): void {
    if (this.memoryMonitorTimer) {
      clearInterval(this.memoryMonitorTimer);
      this.memoryMonitorTimer = null;
    }
    this.memoryAutoPaused = false;
  }

  /** Re-queue a specific URL (e.g. user-triggered Re-Spider). */
  requeueUrl(url: string, depth = 0): void {
    if (this.stopped) return;
    this.seen.delete(url);
    this.enqueue({ url, depth });
  }

  /**
   * Manual URL injection for the running crawl — used by the TopBar
   * "Add URL…" affordance so the user can prod the queue with a URL
   * the spider didn't discover on its own. Bypasses the seen-set check
   * if the URL was already crawled (so re-crawl is possible) but still
   * respects robots/include-exclude/maxQueueSize.
   *
   * Returns whether the URL was actually accepted into the queue.
   */
  /** Wave 6 — Re-enqueue a checkpointed URL at its original depth.
   * Called by the crash-recovery flow after restoring the saved
   * pending list from `crawl_queue`. Bypasses the seen-set so the
   * URL is fetched again even though a partial crawl may already
   * have a row for it (the upsert handles dedup at the DB level).
   */
  enqueueCheckpointed(items: ReadonlyArray<{ url: string; depth: number }>): void {
    for (const item of items) {
      this.seen.delete(item.url);
      this.enqueue({ url: item.url, depth: item.depth });
    }
  }

  enqueueManual(rawUrl: string): boolean {
    if (this.stopped || !this.running) return false;
    let url: string;
    try {
      url = new URL(rawUrl).toString();
    } catch {
      return false;
    }
    // For manual injection we want re-crawl semantics, so clear the
    // seen flag if present. The DB upsert handles duplicate urls
    // idempotently.
    this.seen.delete(url);
    const before = this.seen.size;
    this.enqueue({ url, depth: 0 });
    return this.seen.size > before;
  }

  /**
   * Dispatch priority. Documents outrank subresources; p-queue runs the
   * highest number first and keeps FIFO order within a tier, so pages
   * still traverse breadth-first and resources still fetch in discovery
   * order — only the interleaving changes.
   *
   * `resourceRow` is exactly the right discriminator: `enqueueResources`
   * sets it for images / CSS / JS / media and nothing else does. Links,
   * sitemap entries, redirect hops, manual additions, and iframes (which
   * are documents that get parsed for their own links) all land in the
   * document tier.
   *
   * Why this matters: resources are enqueued before the link-follow loop
   * in `fetchAndProcess`, so under a flat FIFO queue a page's entire
   * asset set lands ahead of every link it found. On an image-heavy home
   * page that is ~90 fetches of images before the first category page —
   * the crawl looks stalled to anyone watching the (HTML-filtered) URL
   * table, and a `maxUrls` budget gets spent on assets instead of pages.
   * Nothing is skipped either way; assets are fetched as slots free up.
   */
  private static priorityFor(item: QueueItem): number {
    return item.resourceRow ? 0 : 1;
  }

  /**
   * Share of `maxUrls` that subresources may claim. `priorityFor` decides the
   * order pages and assets are *fetched* in; this decides how much of a
   * limited budget they are *allowed* in the queue for at all — the admission
   * cap in `enqueue` is first-come-first-served, and resources are enqueued
   * before the link-follow loop runs, so without a rail one image-heavy page
   * can spend the whole allowance before a single link is considered. On a
   * 90-URL budget that produced 83 images and exactly one page.
   *
   * A rail, not a redesign: it only binds on small budgets. Measured on a
   * 500-URL budget the mix moves 323→343 pages and 172→152 images, while a
   * 90-URL budget goes from 1 page to 55. Deliberately not a setting — the
   * failure it prevents is one users hit without knowing to look for it, and
   * an unlimited `maxUrls` (the default) never reaches the cap at all.
   */
  private static readonly SUBRESOURCE_BUDGET_SHARE = 0.4;

  /**
   * Subresources admitted against `maxUrls`. Seeded from the project on
   * resume so a continued crawl shares one allowance with the run that
   * created it rather than starting a fresh one.
   */
  private resourceAdmitted = 0;

  /**
   * Is `url` allowed by the robots.txt of ITS OWN origin? Caller guards on
   * `respectRobotsTxt`. Loads and caches a per-origin checker on first sight;
   * while a fetch is in flight the URL is allowed optimistically — the same
   * window the start origin already has before its own robots.txt finishes
   * loading (see `start`), so behaviour is consistent, just now correct for
   * additional origins instead of skipping them entirely.
   */
  private robotsAllows(url: string): boolean {
    let origin: string;
    try {
      origin = new URL(url).origin;
    } catch {
      return true;
    }
    const checker = this.robotsByOrigin.get(origin);
    if (checker) return checker.isAllowed(url);
    if (!this.robotsLoadingOrigins.has(origin)) {
      this.robotsLoadingOrigins.add(origin);
      void loadRobots(origin, this.config.userAgent)
        .then((r) => {
          if (!this.stopped) this.robotsByOrigin.set(origin, r);
        })
        .catch(() => undefined)
        .finally(() => this.robotsLoadingOrigins.delete(origin));
    }
    return true;
  }

  private enqueue(item: QueueItem): void {
    if (this.stopped) return;
    if (this.seen.has(item.url)) return;
    if (this.seen.size >= this.config.maxUrls) return;
    // Subresource share of the budget (see SUBRESOURCE_BUDGET_SHARE). Checked
    // after the overall cap so the budget total is unchanged — this only
    // decides who gets to claim the remaining slots.
    if (
      item.resourceRow &&
      this.resourceAdmitted >=
        Math.round(this.config.maxUrls * Crawler.SUBRESOURCE_BUDGET_SHARE)
    ) {
      return;
    }
    if (item.depth > this.config.maxDepth) return;
    // Link-loop guard, before robots/filters so a runaway `/a/a/a/...` fan-out
    // costs one cheap string check rather than a robots lookup per hop.
    // The start URL is exempt - the user asked for it explicitly.
    if (item.url !== this.config.startUrl && this.isLoopTrap(item.url)) {
      this.loopTrapsDropped++;
      return;
    }
    if (this.config.respectRobotsTxt && !this.robotsAllows(item.url)) {
      // Record it instead of dropping it silently. This is the whole point
      // of the "Blocked by robots.txt" counter — which was permanently 0
      // because the disallowed URL was never written anywhere. Mark it seen
      // so it is recorded exactly once, then persist a lightweight row.
      // Fire-and-forget to keep enqueue synchronous, matching the other
      // write paths.
      if (!this.seen.has(item.url) && this.seen.size < this.config.maxUrls) {
        this.seen.add(item.url);
        void this.dbCall<number>('upsertUrl', [
          {
            url: item.url,
            urlMalformed: isUrlMalformed(item.url) ? 1 : 0,
            urlTrap: this.trapKind(item.url),
            contentKind: 'html',
            statusCode: null,
            statusText: null,
            indexability: 'non-indexable:robots-blocked',
            indexabilityReason: 'Blocked by robots.txt',
            depth: item.depth,
          },
        ]).catch(() => {
          /* best-effort — a failed record must not break the crawl */
        });
      }
      return;
    }
    if (!this.passesUrlFilter(item.url)) return;
    if (!this.passesExtensionFilter(item.url)) return;
    // Hard cap on the in-memory pending queue. Beyond this we drop new
    // discoveries — the alternative is unbounded heap growth on big
    // sitemaps / dense link graphs. `seen` still grows, but each entry
    // is ~80 bytes vs a queued item carrying the closure + URL string.
    if (
      this.config.maxQueueSize > 0 &&
      this.queue.size + this.queue.pending >= this.config.maxQueueSize
    ) {
      return;
    }

    this.seen.add(item.url);
    if (item.resourceRow) this.resourceAdmitted++;
    this.pending++;
    this.pendingItems.set(item.url, item.depth);
    this.queueRemoved.delete(item.url);
    this.queueAdded.set(item.url, item.depth);
    this.queue
      .add(() => this.fetchAndProcess(item), { priority: Crawler.priorityFor(item) })
      .catch((err: unknown) => {
        this.emit(
          'error',
          `Queue error: ${err instanceof Error ? err.message : String(err)}`,
        );
      })
      .finally(() => {
        this.pending = Math.max(0, this.pending - 1);
        // Drop from the checkpoint set whether we succeeded or failed —
        // failures are recorded in the urls table and shouldn't be
        // retried by a resumed crawl.
        this.pendingItems.delete(item.url);
        this.queueAdded.delete(item.url);
        this.queueRemoved.add(item.url);
      });
  }

  /**
   * Enqueue the internal subresources of a freshly-parsed HTML page so they
   * become their own `urls` rows (Screaming Frog "Check Images / CSS / JS").
   * Gated per-type by the `checkImages` / `checkCss` / `checkJs` config flags.
   *
   * Resources are enqueued at the *referring page's* depth (not depth+1) so a
   * page within the depth limit always has its assets crawled. Only internal
   * resources are followed; the standard `enqueue` guards (maxUrls, robots,
   * include/exclude filters, dedupe) still apply. Non-HTML responses never
   * reach the link-follow path, so resources stay leaf nodes.
   */
  /**
   * The "Store" half of a Spider → Crawl resource row. Split out because
   * the decision is needed on the write path, far from `enqueueResources`
   * where the row was chosen.
   */
  private storesResourceRow(row: NonNullable<QueueItem['resourceRow']>): boolean {
    if (row === 'css') return this.config.storeCss;
    if (row === 'js') return this.config.storeJs;
    if (row === 'image') return this.config.storeImages;
    return this.config.storeMedia;
  }

  private enqueueResources(parsed: ParsedPage, depth: number): void {
    if (this.config.checkImages) {
      for (const img of parsed.images) {
        if (img.isInternal) this.enqueue({ url: img.src, depth, resourceRow: 'image' });
        // External images: status/size are filled by the post-crawl image
        // probe (images table), which now covers external images too — so
        // a dead external/CDN image still trips "Broken Image src".
      }
    }
    // Which Spider → Crawl row governs each resource kind. Fonts ride with
    // CSS (they're declared by stylesheets and font preloads); `'other'` is
    // only ever produced by the media extractor, so it maps to Media.
    const rowFor = (kind: ContentKind): QueueItem['resourceRow'] | null => {
      if (kind === 'css' || kind === 'font') return 'css';
      if (kind === 'js') return 'js';
      if (kind === 'image') return 'image';
      if (kind === 'other') return 'media';
      return null;
    };
    const shouldFollow = (row: NonNullable<QueueItem['resourceRow']>): boolean => {
      if (row === 'css') return this.config.checkCss;
      if (row === 'js') return this.config.checkJs;
      if (row === 'image') return this.config.checkImages;
      return this.config.crawlMedia;
    };
    for (const r of parsed.resources) {
      const row = rowFor(r.kind);
      if (!row || !shouldFollow(row)) continue;
      if (r.isInternal) {
        this.enqueue({ url: r.url, depth, resourceRow: row });
      } else {
        // External CSS/JS/font resources have no dedicated probe, so route
        // them through the external-stub probe to surface their status
        // (broken third-party scripts/styles show up in Broken Links).
        this.enqueueExternal(r.url);
      }
    }
    // Iframes are documents, not subresources: crawling one is a full page
    // fetch that extracts its own links, so it goes through the ordinary
    // queue at the next depth rather than the leaf-node resource path.
    if (this.config.crawlIframes) {
      for (const f of parsed.iframes) {
        if (f.isInternal) this.enqueue({ url: f.url, depth: depth + 1 });
        else this.enqueueExternal(f.url);
      }
    }
  }

  /**
   * Mine a fetched stylesheet for the resources it references — `url(...)`
   * targets (web fonts, background / mask images) and `@import` targets
   * (nested stylesheets) — and enqueue the INTERNAL ones so they land in the
   * Internal tab. This is the path that populates the "Font" filter, since
   * most web fonts are declared in CSS `@font-face` rather than on the page.
   * External CSS-referenced assets are intentionally skipped to avoid fanning
   * out into third-party font/CDN hosts. Iteration is capped so a pathological
   * stylesheet can't stall the crawl.
   */
  private enqueueCssResources(css: string, baseUrl: string, depth: number): void {
    const opts = {
      includeSubdomains: this.config.scope === 'all-subdomains',
      cdnHosts: this.config.cdnHosts,
    };
    const seenRaw = new Set<string>();
    const consider = (raw: string | undefined): void => {
      if (!raw) return;
      const ref = raw.trim().replace(/^['"]|['"]$/g, '').trim();
      if (!ref || ref.startsWith('data:') || ref.startsWith('#')) return;
      if (seenRaw.has(ref)) return;
      seenRaw.add(ref);
      const normalized = normalizeUrl(ref, baseUrl, this.urlRewrites);
      if (!normalized || !/^https?:/.test(normalized)) return;
      if (isSameHost(baseUrl, normalized, opts)) {
        this.enqueue({ url: normalized, depth });
      }
    };
    let m: RegExpExecArray | null;
    let count = 0;
    const urlRe = /url\(\s*([^)]+?)\s*\)/gi;
    while ((m = urlRe.exec(css)) !== null && count < 500) {
      count++;
      consider(m[1]);
    }
    const importRe = /@import\s+(?:url\(\s*)?['"]?([^'")\s;]+)/gi;
    count = 0;
    while ((m = importRe.exec(css)) !== null && count < 200) {
      count++;
      consider(m[1]);
    }
  }

  /**
   * Token gate for the global requests-per-second cap (`config.maxRps`).
   * Each caller reserves the next dispatch slot on a monotonic clock and
   * sleeps until it arrives; the read-compute-write of `nextDispatchAt` is
   * synchronous (no await between), so concurrent workers get distinct,
   * evenly-spaced slots. `maxRps <= 0` disables the gate (unlimited).
   */
  private async acquireRateSlot(): Promise<void> {
    // A robots.txt `Crawl-delay` means "one request every N seconds to this
    // origin" — a *global* spacing, not a per-worker one. Applying it as a
    // per-worker post-request sleep (as this used to) both violated the
    // directive (20 workers → 20 requests per window) and multiplied crawl
    // time by the worker count. Folding it into the dispatch gate honours it
    // literally when the user opts in. Only reached when `respectCrawlDelay`
    // is on — `robotsCrawlDelayMs` stays 0 otherwise.
    const rpsInterval = this.config.maxRps > 0 ? 1000 / this.config.maxRps : 0;
    const minInterval = Math.max(rpsInterval, this.robotsCrawlDelayMs);
    if (minInterval <= 0) return;
    const now = Date.now();
    const scheduled = Math.max(now, this.nextDispatchAt);
    this.nextDispatchAt = scheduled + minInterval;
    const waitMs = scheduled - now;
    if (waitMs > 0 && !this.stopped) await sleep(waitMs);
  }

  private async fetchAndProcess(item: QueueItem): Promise<void> {
    if (this.stopped) return;
    this.setOp(`crawl:fetch:${item.url}`);

    // I-1 — Cooperative yield BEFORE we start work on this URL. The
    // crawler runs in the same Node event loop as Electron's IPC
    // dispatcher; without an explicit yield, two adjacent fetches
    // (each landing several DB writes) run back-to-back and any UI
    // input mesajı that arrived in between waits for both to finish.
    // `setImmediate` adds at most one event-loop tick (< 1 ms on a
    // healthy system) and lets renderer-side IPC, lag heartbeats,
    // and progress event listeners run between URLs.
    await new Promise<void>((r) => setImmediate(r));

    // Global requests-per-second cap. Gates the DISPATCH time (before the
    // timeout starts and before responseTime is measured) rather than using
    // p-queue's intervalCap, which bucket-refills in bursts and can freeze
    // the queue between windows (see the constructor's queue comment). Waits
    // are bounded by ~concurrency / maxRps, so Stop stays responsive.
    await this.acquireRateSlot();
    if (this.stopped) return;

    const t0 = Date.now();
    const controller = new AbortController();
    this.inFlightFetchControllers.add(controller);
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
    // Wave 3 — Optional max-response-time hard cap. Distinct from
    // `requestTimeoutMs` (which is the connect+headers timeout): this
    // is an upper bound on the *total* request lifetime including body
    // download. Useful for capping individual slow pages without
    // lowering the overall fetch timeout.
    const respTimeTimer =
      this.config.maxResponseTimeMs > 0
        ? setTimeout(
            () => controller.abort(),
            this.config.maxResponseTimeMs,
          )
        : null;

    try {
      // Manual redirect handling — each hop becomes its own row so the
      // Response Codes > 3xx view and `redirect_target` column are
      // populated correctly. When followRedirects is on we enqueue the
      // target, producing a full chain across multiple crawl passes.
      const res = await this.fetchWithRetry(item.url, controller.signal);

      const responseTimeMs = Date.now() - t0;
      this.totalResponseTimeMs += responseTimeMs;

      // Wave 3 — Optional max file size filter. When the response's
      // declared `Content-Length` exceeds the configured ceiling we
      // discard the body and record a size-cap notice. The page row
      // is still created so links to it aren't lost; only the body
      // and downstream parsing are skipped.
      if (this.config.maxFileSizeBytes > 0) {
        const lenHeader = res.headers.get('content-length');
        const declaredLen = lenHeader ? Number.parseInt(lenHeader, 10) : NaN;
        if (Number.isFinite(declaredLen) && declaredLen > this.config.maxFileSizeBytes) {
          try {
            await res.body?.cancel();
          } catch {
            /* ignore */
          }
          this.failed++;
          this.emit(
            'warn',
            `Skipped ${item.url}: Content-Length ${declaredLen} > maxFileSizeBytes ${this.config.maxFileSizeBytes}`,
          );
          await this.dbCall<number>('upsertUrl', [
            {
              url: item.url,
              urlMalformed: isUrlMalformed(item.url) ? 1 : 0,
              urlTrap: this.trapKind(item.url),
              contentKind: 'other',
              statusCode: res.status,
              statusText: 'size-cap-exceeded',
              indexability: 'non-indexable:client-error',
              indexabilityReason: `Body skipped — Content-Length ${declaredLen} exceeds maxFileSizeBytes`,
              responseTimeMs,
              depth: item.depth,
              contentLength: declaredLen,
            },
          ]);
          return;
        }
      }
      this.responseSamples++;

      const statusCode = res.status;
      const contentType = res.headers.get('content-type');
      // Surface 4xx / 5xx in the log panel so users can see WAF / bot
      // responses (403 from Cloudflare, 429 rate limits, 503 outages, …).
      // Seed-URL non-2xx is escalated to error because the crawl will
      // produce zero pages without it.
      if (statusCode >= 400) {
        const isSeed = item.depth === 0 && item.url === this.config.startUrl;
        const serverHint = res.headers.get('server');
        const cfRay = res.headers.get('cf-ray');
        const wafHint = cfRay
          ? ` [Cloudflare ${cfRay}]`
          : serverHint
            ? ` [server: ${serverHint}]`
            : '';
        this.emit(
          isSeed ? 'error' : 'warn',
          `HTTP ${statusCode} on ${item.url}${wafHint} — likely ${
            statusCode === 403
              ? 'bot/WAF block (try a browser-like User-Agent in Settings)'
              : statusCode === 429
                ? 'rate limited (lower max RPS / concurrency in Settings)'
                : statusCode === 451
                  ? 'legal block / geofence'
                  : statusCode >= 500
                    ? 'server error'
                    : 'client error'
          }`,
        );
      }
      const contentLengthHeader = res.headers.get('content-length');
      const xRobotsTag = res.headers.get('x-robots-tag');
      // Security / performance headers — captured per URL for the Security
      // issue filters and the URL Details panel.
      const hsts = res.headers.get('strict-transport-security');
      const xFrameOptions = res.headers.get('x-frame-options');
      const xContentTypeOptions = res.headers.get('x-content-type-options');
      const contentEncoding = res.headers.get('content-encoding');
      const csp = res.headers.get('content-security-policy');
      const referrerPolicy = res.headers.get('referrer-policy');
      const permissionsPolicy = res.headers.get('permissions-policy');
      // CORS — captured raw so the issue filters can reason about wildcard
      // + credentials misconfigurations and the URL Details panel can show
      // the values verbatim. `Access-Control-Allow-Headers` is sometimes
      // very long (every API field listed); truncated to 1 KB to keep the
      // row size predictable.
      const corsAllowOrigin = res.headers.get('access-control-allow-origin');
      const corsAllowCredentialsHeader = res.headers.get('access-control-allow-credentials');
      const corsAllowCredentials =
        corsAllowCredentialsHeader === null
          ? -1
          : corsAllowCredentialsHeader.trim().toLowerCase() === 'true'
            ? 1
            : 0;
      const corsAllowMethods = res.headers.get('access-control-allow-methods');
      const corsAllowHeadersRaw = res.headers.get('access-control-allow-headers');
      const corsAllowHeaders =
        corsAllowHeadersRaw && corsAllowHeadersRaw.length > 1024
          ? `${corsAllowHeadersRaw.slice(0, 1024)}…`
          : corsAllowHeadersRaw;
      // Stack auditing — captured raw, no parsing. Sites typically return
      // `nginx/1.25.0`, `cloudflare`, `Apache/2.4.41`, `Microsoft-IIS/10`.
      const serverHeader = res.headers.get('server');
      // `Link: <url>; rel="canonical"` HTTP response header — Google honours
      // this in addition to (and equal weight to) the HTML <link rel=canonical>.
      // PDFs and other non-HTML resources can only express canonicals here.
      const linkHeader = res.headers.get('link');
      const canonicalHttpRaw = parseLinkRelCanonical(linkHeader);
      const canonicalHttp = canonicalHttpRaw
        ? normalizeUrl(canonicalHttpRaw, item.url, this.urlRewrites)
        : null;

      // HTTP protocol — heuristic via Alt-Svc (best-effort; undici doesn't
      // surface the actually-negotiated ALPN protocol on Response).
      const httpProtocol = detectHttpProtocol(res.headers.get('alt-svc'));

      // Query-string length — characters after the first `?` (no `?` → 0).
      const qIdx = item.url.indexOf('?');
      const queryStringLength = qIdx >= 0 ? item.url.length - qIdx - 1 : 0;

      // Keep-alive: HTTP/1.1 default is keep-alive; absence of an explicit
      // `Connection: close` is good. HTTP/2 multiplexes a single connection
      // — keep-alive is implicit and always true. We treat anything except
      // `Connection: close` as keep-alive enabled.
      const connectionHeader = (res.headers.get('connection') ?? '').toLowerCase();
      const keepAlive = !connectionHeader.includes('close');

      const kind = detectContentKind(item.url, contentType);

      // Materialize all response headers once — used for the HTTP Headers
      // tab in the URL Details panel. Built before each upsertUrl so we
      // can also call setUrlHeaders right after we have a urlId.
      const allHeaders: [string, string][] = [];
      res.headers.forEach((v, k) => allHeaders.push([k, v]));

      // Cookie security analysis — Set-Cookie response headers, parsed
      // into per-cookie rows so we can count missing Secure / HttpOnly /
      // SameSite flags. Cookie values themselves are never stored.
      // Wave 9 — Honour the cookie policy: `reject-all` skips analysis
      // entirely (zeros for the missing-flag counters); `block-third-
      // party` still records flag counts but only for cookies whose
      // Domain attribute matches the page's registrable domain (or is
      // absent — implicit first-party). `accept-all` keeps the legacy
      // behaviour of analysing every Set-Cookie regardless of scope.
      const cookieSummary = (() => {
        if (this.config.cookiePolicy === 'reject-all') {
          return {
            count: 0,
            insecureCount: 0,
            noHttpOnlyCount: 0,
            noSameSiteCount: 0,
          };
        }
        const setCookies = extractSetCookies(allHeaders);
        if (this.config.cookiePolicy === 'block-third-party') {
          // First-party = same registrable domain (last two labels).
          let pageRoot = '';
          try {
            pageRoot = new URL(item.url).hostname.split('.').slice(-2).join('.').toLowerCase();
          } catch {
            // fall through, no filter
          }
          if (pageRoot) {
            const filtered = setCookies.filter((sc) => {
              const m = /;\s*Domain=([^;]+)/i.exec(sc);
              if (!m) return true; // no Domain attribute = implicit first-party
              const domain = m[1]!.trim().toLowerCase().replace(/^\./, '');
              return domain.endsWith(pageRoot);
            });
            return analyseCookies(filtered);
          }
        }
        return analyseCookies(setCookies);
      })();

      // TTFB on the successful attempt (excludes retry overhead). Falls
      // back to total response time if for any reason ttfbMs wasn't set
      // (defensive — fetchWithRetry always assigns it).
      const ttfbMs = (res as { ttfbMs?: number }).ttfbMs ?? responseTimeMs;

      // 3xx redirect — record hop, optionally enqueue target, stop.
      if (statusCode >= 300 && statusCode < 400) {
        try {
          await res.text();
        } catch {
          /* ignore */
        }
        const locationHeader = res.headers.get('location');
        const target = locationHeader
          ? normalizeUrl(locationHeader, item.url, this.urlRewrites)
          : null;
        const redirectUrlId = await this.dbCall<number>('upsertUrl', [
          {
            url: item.url,
            urlMalformed: isUrlMalformed(item.url) ? 1 : 0,
            urlTrap: this.trapKind(item.url),
            contentKind: kind,
            statusCode,
            statusText: null,
            indexability: 'non-indexable:redirect',
            indexabilityReason: target ? `Redirects to ${target}` : `HTTP ${statusCode}`,
            contentType,
            contentLength: parseIntSafe(contentLengthHeader),
            xRobotsTag,
            responseTimeMs,
            ttfbMs,
            depth: item.depth,
            redirectTarget: target,
            hsts,
            xFrameOptions,
            xContentTypeOptions,
            contentEncoding,
            csp,
            referrerPolicy,
            permissionsPolicy,
            corsAllowOrigin,
            corsAllowCredentials,
            corsAllowMethods,
            corsAllowHeaders,
            canonicalHttp,
            cookiesCount: cookieSummary.count,
            cookiesInsecure: cookieSummary.insecureCount,
            cookiesNoHttpOnly: cookieSummary.noHttpOnlyCount,
            cookiesNoSameSite: cookieSummary.noSameSiteCount,
            httpProtocol,
            queryStringLength,
            keepAlive,
            serverHeader,
          },
        ]);
        if (redirectUrlId) await this.dbCall<void>('setUrlHeaders', [redirectUrlId, allHeaders]);
        this.crawled++;
        if (this.config.followRedirects && target) {
          // Hard cap on hop count — if the queued item already exceeds
          // `maxRedirects` we stop following the chain. Each enqueued
          // hop carries an integer that we increment here. Items
          // discovered via link extraction always start at 0.
          const hopCount = (item.redirectHopCount ?? 0) + 1;
          if (this.config.maxRedirects > 0 && hopCount > this.config.maxRedirects) {
            this.emit(
              'info',
              `Redirect chain capped at ${this.config.maxRedirects} hops: ${item.url} → … → (stopped)`,
            );
            return;
          }
          const inScope = isInScope(this.config.startUrl, target, this.config.scope);
          if (inScope || this.config.crawlExternal) {
            this.enqueue({ url: target, depth: item.depth, redirectHopCount: hopCount });
          } else if (!inScope) {
            // Record the target as an external stub so the hop chain is
            // visible in Outlinks even when we won't follow it.
            this.enqueueExternal(target);
          }
        }
        return;
      }

      if (kind !== 'html' || statusCode >= 400) {
        // Non-HTML / error responses are normally body-less in our model.
        // Exception: JSON responses (`application/json` APIs) are routed to
        // the JSONPath custom-extraction path — the only place non-HTML
        // bodies are parsed. We capture the body once so a configured
        // jsonpath rule can read it; otherwise it's drained and discarded.
        const needsJsonExtraction =
          statusCode < 400 &&
          (this.config.customExtractionRules ?? []).some((r) => r.type === 'jsonpath');
        // We also read the body for a successful CSS resource so we can mine
        // its `url(...)` / `@import` references (fonts, background images,
        // nested stylesheets) and crawl the internal ones — this is what
        // actually populates the Internal tab's "Font" filter.
        const needsCssParse =
          kind === 'css' &&
          statusCode >= 200 &&
          statusCode < 300 &&
          this.config.checkCss;
        // Otherwise only download the body when a JSONPath rule needs it.
        // `contentLength` is read from the Content-Length header (below), not
        // the body, so for plain resources (images, fonts, JS, PDFs) we
        // discard the stream without buffering megabytes into memory — this is
        // what makes "Check Images / CSS / JS" resource crawling lightweight.
        let nonHtmlBody = '';
        if (needsJsonExtraction || needsCssParse) {
          try {
            nonHtmlBody = await res.text();
          } catch {
            /* ignore */
          }
        } else {
          try {
            await res.body?.cancel();
          } catch {
            /* ignore */
          }
        }
        let jsonExtraction: Record<string, unknown> | null = null;
        if (needsJsonExtraction) {
          const ctLower = (contentType ?? '').toLowerCase();
          const looksJson = ctLower.includes('json') || /^\s*[[{]/.test(nonHtmlBody);
          if (looksJson) {
            try {
              jsonExtraction = runJsonExtractionRules(nonHtmlBody, this.config.customExtractionRules);
            } catch {
              jsonExtraction = null;
            }
          }
        }
        const indexability: Indexability =
          statusCode >= 500
            ? 'non-indexable:server-error'
            : statusCode >= 400
              ? 'non-indexable:client-error'
              : 'indexable';
        // Spider → Crawl "Store" for the row that queued this resource.
        // Turning it off keeps the fetch — which is what validates the
        // resource loads and what lets a stylesheet be mined for its
        // `@font-face` targets — but drops the URL row, so the Internal
        // tab isn't buried under a few hundred assets. Anything not
        // enqueued as a resource has no `resourceRow` and is unaffected.
        if (item.resourceRow && !this.storesResourceRow(item.resourceRow)) {
          this.crawled++;
          if (needsCssParse && nonHtmlBody) {
            this.enqueueCssResources(nonHtmlBody, item.url, item.depth);
          }
          return;
        }
        const nonHtmlUrlId = await this.dbCall<number>('upsertUrl', [
          {
            url: item.url,
            urlMalformed: isUrlMalformed(item.url) ? 1 : 0,
            urlTrap: this.trapKind(item.url),
            contentKind: kind,
            statusCode,
            statusText: null,
            indexability,
            indexabilityReason: indexability === 'indexable' ? null : `HTTP ${statusCode}`,
            contentType,
            extractionResults: jsonExtraction ? JSON.stringify(jsonExtraction) : null,
            contentLength: parseIntSafe(contentLengthHeader),
            xRobotsTag,
            responseTimeMs,
            ttfbMs,
            depth: item.depth,
            hsts,
            xFrameOptions,
            xContentTypeOptions,
            contentEncoding,
            csp,
            referrerPolicy,
            permissionsPolicy,
            corsAllowOrigin,
            corsAllowCredentials,
            corsAllowMethods,
            corsAllowHeaders,
            canonicalHttp,
            cookiesCount: cookieSummary.count,
            cookiesInsecure: cookieSummary.insecureCount,
            cookiesNoHttpOnly: cookieSummary.noHttpOnlyCount,
            cookiesNoSameSite: cookieSummary.noSameSiteCount,
            httpProtocol,
            queryStringLength,
            keepAlive,
            serverHeader,
          },
        ]);
        if (nonHtmlUrlId) await this.dbCall<void>('setUrlHeaders', [nonHtmlUrlId, allHeaders]);
        this.crawled++;
        if (needsCssParse && nonHtmlBody) {
          this.enqueueCssResources(nonHtmlBody, item.url, item.depth);
        }
        return;
      }

      const capRead = await readBodyCapped(res, this.config.maxFileSizeBytes);
      if (capRead.overCap) {
        // Chunked/streaming HTML with no Content-Length blew past the cap.
        // Mirror the declared-length skip branch: keep the row (so inlinks
        // survive) but drop the body and downstream parsing.
        this.failed++;
        this.emit(
          'warn',
          `Skipped ${item.url}: streamed body exceeded the ${effectiveBodyCap(
            this.config.maxFileSizeBytes,
          )} byte body cap`,
        );
        await this.dbCall<number>('upsertUrl', [
          {
            url: item.url,
            urlMalformed: isUrlMalformed(item.url) ? 1 : 0,
            urlTrap: this.trapKind(item.url),
            contentKind: 'other',
            statusCode,
            statusText: 'size-cap-exceeded',
            indexability: 'non-indexable:client-error',
            indexabilityReason: `Body skipped — streamed size exceeds the ${effectiveBodyCap(
              this.config.maxFileSizeBytes,
            )} byte body cap`,
            responseTimeMs,
            depth: item.depth,
          },
        ]);
        return;
      }
      const body = decodeBody(capRead.bytes, contentType);
      const bodyLength = parseIntSafe(contentLengthHeader) ?? capRead.bytes.length;

      // V2 Faz 1 — JavaScript rendering pass. When `renderingMode === 'js'`
      // and the host injected a Playwright renderer, fetch the post-JS DOM
      // and use it for link extraction + extraction rules. The raw HTTP body
      // stays in `url_sources.body`; the rendered DOM goes to
      // `url_sources.rendered_body`. Render failure is non-fatal — we fall
      // back to the static HTML so the crawl never stalls on a single page.
      let parseBody = body;
      let renderedHtml: string | null = null;
      let renderMs = 0;
      let renderScreenshots:
        | { fullpage?: string; fold?: string; mobile?: string }
        | null = null;
      let renderLcp:
        | {
            selector: string;
            tagName: string;
            width: number;
            height: number;
            coverage: number;
            resourceUrl: string | null;
          }
        | null = null;
      let renderMobile:
        | { ok: boolean; overflowPx: number; hasViewportMeta: boolean }
        | null = null;
      let renderA11y:
        | {
            lowContrast: number;
            sampled: number;
            focusSuppressed: boolean;
            smallFont: number;
            tapTargetsSmall: number;
            tapTargetsSampled: number;
          }
        | null = null;
      if (
        this.config.renderingMode === 'js' &&
        this.renderUrlHook &&
        statusCode < 400
      ) {
        this.setOp(`crawl:render:${item.url}`);
        try {
          // We pass `null` for urlId here — the writeFetchedUrl call
          // hasn't happened yet so we don't have one. The host can
          // either generate a temp id, or use the URL string as the
          // sidecar filename key. Screenshot paths are returned by
          // the host so the crawler can persist them after upsert.
          const renderRes = await this.renderUrlHook(
            item.url,
            null,
            controller.signal,
          );
          renderMs = renderRes.timingMs;
          if (renderRes.ok && renderRes.html) {
            parseBody = renderRes.html;
            renderedHtml = renderRes.html;
          } else if (renderRes.error) {
            this.emit(
              'warn',
              `JS render failed for ${item.url}: ${renderRes.error} (falling back to static HTML)`,
            );
          }
          if (renderRes.screenshots) renderScreenshots = renderRes.screenshots;
          if (renderRes.lcp) renderLcp = renderRes.lcp;
          if (renderRes.mobileUsability) renderMobile = renderRes.mobileUsability;
          if (renderRes.a11y) renderA11y = renderRes.a11y;
        } catch (err) {
          this.emit(
            'warn',
            `JS render threw for ${item.url}: ${err instanceof Error ? err.message : String(err)} (falling back to static HTML)`,
          );
        }
      }

      // Hand parsing to the worker pool when injected by the desktop
      // host; the CLI's default is the inline `parseHtml`. The
      // crawler doesn't care which one runs as long as the result
      // shape matches.
      this.setOp(`crawl:parse:${item.url}`);
      const parsed = await this.parsePage(parseBody, item.url, {
        includeSubdomains: this.config.scope === 'all-subdomains',
        cdnHosts: this.config.cdnHosts,
        customSearchTerms: this.config.customSearchTerms,
        urlRewrites: this.urlRewrites,
        customExtractionRules: this.config.customExtractionRules,
        contentAreaSelector: this.config.contentAreaSelector,
      });

      // Charset resolution — prefer the document's own declaration (HTML5
      // `<meta charset>` or legacy `<meta http-equiv>`); fall back to the
      // HTTP Content-Type header's `charset=` parameter so older sites
      // without a meta still surface a value.
      let charset: string | null = parsed.charset;
      if (!charset && contentType) {
        const m = contentType.toLowerCase().match(/charset\s*=\s*([^\s;]+)/);
        if (m && m[1]) charset = m[1];
      }

      // Honour bot-scoped directives correctly: `X-Robots-Tag: bingbot:
      // noindex` must NOT mark a page Google indexes as non-indexable.
      const headerDirectives = xRobotsTag
        ? xRobotsTagDirectives(xRobotsTag, robotsUserAgentToken(this.config.userAgent))
        : { noindex: false, nofollow: false };
      const headerNoindex = headerDirectives.noindex;

      let indexability: Indexability = 'indexable';
      let reason: string | null = null;
      if (parsed.hasNoindex) {
        indexability = 'non-indexable:noindex';
        reason = 'meta robots: noindex';
      } else if (headerNoindex) {
        indexability = 'non-indexable:noindex';
        reason = 'X-Robots-Tag: noindex';
      } else if (parsed.canonicalResolved && parsed.canonicalResolved !== item.url) {
        indexability = 'non-indexable:canonical';
        reason = `canonical points to ${parsed.canonical}`;
      } else if (!parsed.canonical && canonicalHttp && canonicalHttp !== item.url) {
        // No HTML canonical, but the HTTP `Link` header points elsewhere —
        // Google still treats the page as canonicalised to that target.
        indexability = 'non-indexable:canonical';
        reason = `HTTP canonical points to ${canonicalHttp}`;
      }

      // Respect-Nofollow default (Screaming-Frog style): `rel="nofollow"`
      // links are treated as hints that exist only for search engines, so
      // we drop them from persistence and from the crawl graph entirely.
      // Opt-in via `storeNofollowLinks` if the user wants them recorded.
      const storableLinks = this.config.storeNofollowLinks
        ? parsed.links
        : parsed.links.filter((l) => !l.rel?.includes('nofollow'));

      // Spider → Crawl "Store" for the two hyperlink rows. `storableLinks`
      // itself stays whole: traversal below and the page's outlink count
      // both describe what the page declared, which doesn't change just
      // because the user stopped recording one side of the graph.
      const persistedLinks: DiscoveredLink[] = [];
      if (this.config.storeInternalLinks || this.config.storeExternalLinks) {
        for (const l of storableLinks) {
          const keep = l.isInternal
            ? this.config.storeInternalLinks
            : this.config.storeExternalLinks;
          if (keep) persistedLinks.push(l);
        }
      }
      // Iframes join the link graph as `other`, so they show up in the
      // page's Outlinks and a dead embed surfaces in Broken Links. They
      // are excluded from `outlinks` above — an embed is not a hyperlink,
      // and counting it would move every "Too Many Links" verdict.
      if (this.config.storeIframes) {
        for (const f of parsed.iframes) {
          persistedLinks.push({
            fromUrl: item.url,
            toUrl: f.url,
            type: 'other',
            anchor: null,
            altText: null,
            rel: null,
            target: null,
            pathType: 'absolute',
            linkPath: null,
            linkPosition: 'content',
            linkOrigin: 'html',
            isInternal: f.isInternal,
          });
        }
      }
      // Malformed hrefs recorded verbatim. They can never resolve to a
      // crawled URL, so the broken-link join reports every one of them —
      // which is the whole point of asking for them.
      if (this.config.crawlInvalidLinks) {
        for (const raw of parsed.invalidLinks) {
          persistedLinks.push({
            fromUrl: item.url,
            toUrl: raw,
            type: 'other',
            anchor: null,
            altText: null,
            rel: null,
            target: null,
            pathType: 'absolute',
            linkPath: null,
            linkPosition: 'content',
            linkOrigin: 'html',
            isInternal: true,
          });
        }
      }

      const imagesMissingAlt = parsed.images.filter((img) => img.alt === null).length;
      // Phase 1b — Build the entire per-URL write payload up front and
      // ship it across the writer-worker boundary in one shot. The
      // worker runs the upsert + headers + body snapshot + links +
      // images inside a single SQLite transaction; the main thread
      // never blocks on `.run()` for the duration of those writes.
      // Falls back to an inline transaction in the no-worker (CLI)
      // case via the default `writeFetchedUrl` injected in the
      // constructor.
      this.setOp(`crawl:write:${item.url}`);
      const { urlId } = await this.writeFetchedUrl({
        upsert: {
          url: item.url,
          urlMalformed: isUrlMalformed(item.url) ? 1 : 0,
          urlTrap: this.trapKind(item.url),
          contentKind: 'html',
          statusCode,
          statusText: null,
          indexability,
          indexabilityReason: reason,
          title: parsed.title,
          metaDescription: parsed.metaDescription,
          h1: parsed.h1,
          h1Count: parsed.h1Count,
          h2Count: parsed.h2Count,
          h3Count: parsed.h3Count,
          h4Count: parsed.h4Count,
          h5Count: parsed.h5Count,
          h6Count: parsed.h6Count,
          wordCount: parsed.wordCount,
          // Spider → Crawl "Store" columns. Indexability was already
          // decided above from the live values, so switching a row off
          // empties its tab without silently re-labelling pages as
          // indexable — the verdict and the evidence stay in agreement.
          canonical: this.config.storeCanonicals ? parsed.canonical : null,
          canonicalResolved: this.config.storeCanonicals ? parsed.canonicalResolved : null,
          canonicalCount: this.config.storeCanonicals ? parsed.canonicalCount : 0,
          canonicalDistinctCount: this.config.storeCanonicals
            ? parsed.canonicalDistinctCount
            : 0,
          canonicalCrossDomain:
            this.config.storeCanonicals && parsed.canonicalCrossDomain ? 1 : 0,
          canonicalHttp: this.config.storeCanonicals ? canonicalHttp : null,
          metaRobots: parsed.metaRobots,
          xRobotsTag,
          contentType,
          contentLength: bodyLength,
          responseTimeMs,
          ttfbMs,
          depth: item.depth,
          outlinks: storableLinks.length,
          imagesCount: parsed.images.length,
          imagesMissingAlt,
          lang: parsed.lang,
          viewport: parsed.viewport,
          ogTitle: parsed.ogTitle,
          ogDescription: parsed.ogDescription,
          ogImage: parsed.ogImage,
          ogType: parsed.ogType,
          ogUrl: parsed.ogUrl,
          ogSiteName: parsed.ogSiteName,
          ogLocale: parsed.ogLocale,
          twitterCard: parsed.twitterCard,
          twitterTitle: parsed.twitterTitle,
          twitterDescription: parsed.twitterDescription,
          twitterImage: parsed.twitterImage,
          metaKeywords: parsed.metaKeywords,
          metaAuthor: parsed.metaAuthor,
          metaGenerator: parsed.metaGenerator,
          themeColor: parsed.themeColor,
          hsts,
          xFrameOptions,
          xContentTypeOptions,
          contentEncoding,
          csp,
          referrerPolicy,
          permissionsPolicy,
          customSearchHits:
            Object.keys(parsed.customSearchHits).length > 0
              ? JSON.stringify(parsed.customSearchHits)
              : null,
          schemaTypes: parsed.schemaTypes.length > 0 ? parsed.schemaTypes.join(', ') : null,
          schemaBlockCount: parsed.schemaBlockCount,
          schemaInvalidCount: parsed.schemaInvalidCount,
          paginationNext: this.config.storePagination ? parsed.paginationNext : null,
          paginationPrev: this.config.storePagination ? parsed.paginationPrev : null,
          hreflangs:
            this.config.storeHreflang && parsed.hreflangs.length > 0
              ? JSON.stringify(parsed.hreflangs)
              : null,
          hreflangCount: this.config.storeHreflang ? parsed.hreflangs.length : 0,
          videos: parsed.videos.length > 0 ? JSON.stringify(parsed.videos) : null,
          amphtml: this.config.storeAmp ? parsed.amphtml : null,
          ampPage: this.config.storeAmp ? parsed.ampPage : false,
          ampValidationErrors:
            this.config.storeAmp && parsed.ampValidationErrors.length > 0
              ? JSON.stringify(parsed.ampValidationErrors)
              : null,
          mobileAlternate: this.config.storeMobileAlternate
            ? parsed.mobileAlternate
            : null,
          favicon: parsed.favicon,
          appleTouchIcon: parsed.appleTouchIcon,
          androidIcon: parsed.androidIcon,
          manifestUrl: parsed.manifestUrl,
          feedUrl: parsed.feedUrl,
          mixedContentCount: parsed.mixedContentCount,
          mixedContentActive: parsed.mixedContentActive,
          mixedContentPassive: parsed.mixedContentPassive,
          metaRefresh: this.config.storeMetaRefresh ? parsed.metaRefresh : null,
          metaRefreshUrl: this.config.storeMetaRefresh ? parsed.metaRefreshUrl : null,
          charset,
          extractionResults: parsed.extractionResults
            ? JSON.stringify(parsed.extractionResults)
            : null,
          simhash: parsed.simhash,
          contentHash: parsed.contentHash,
          titleCount: parsed.titleCount,
          imagesEmptyAlt: parsed.imagesEmptyAlt,
          emptyAnchorCount: parsed.emptyAnchorCount,
          microdataCount: parsed.microdataCount,
          rdfaCount: parsed.rdfaCount,
          insecureFormActionCount: parsed.insecureFormActionCount,
          missingSriCount: parsed.missingSriCount,
          titlePixelWidth: estimatePixelWidth(parsed.title ?? ''),
          metaPixelWidth: estimatePixelWidth(parsed.metaDescription ?? ''),
          cookiesCount: cookieSummary.count,
          cookiesInsecure: cookieSummary.insecureCount,
          cookiesNoHttpOnly: cookieSummary.noHttpOnlyCount,
          cookiesNoSameSite: cookieSummary.noSameSiteCount,
          httpProtocol,
          queryStringLength,
          keepAlive,
          renderBlockingCount: parsed.renderBlockingCount,
          analyticsTrackers:
            parsed.analyticsTrackers.length > 0
              ? JSON.stringify(parsed.analyticsTrackers)
              : null,
          formInputCount: parsed.formInputCount,
          formInputUnlabeled: parsed.formInputUnlabeledCount,
          imagesLazy: parsed.imagesLazy,
          imagesResponsive: parsed.imagesResponsive,
          pictureCount: parsed.pictureCount,
          landmarkMain: parsed.hasMain ? 1 : 0,
          skipLinkPresent: parsed.skipLinkPresent ? 1 : 0,
          ariaInvalidRoles: parsed.ariaInvalidRolesCount,
          schemaDuplicateIds: parsed.schemaDuplicateIds,
          schemaUnknownTypes: parsed.schemaUnknownTypes,
          schemaMissingRequired: parsed.schemaMissingRequired,
          schemaMissingRecommended: parsed.schemaMissingRecommended,
          headingOrderViolations: parsed.headingOrderViolations,
          subresourceRequestCount: parsed.subresourceRequestCount,
          headings:
            parsed.headings.length > 0 ? JSON.stringify(parsed.headings) : null,
          serverHeader,
          jsOnlyLinksCount: this.config.storeUncrawlableLinks
            ? parsed.jsOnlyLinksCount
            : 0,
          textCodeRatio: parsed.textCodeRatio,
          fleschReadingEase: parsed.fleschReadingEase,
          fleschKincaidGrade: parsed.fleschKincaidGrade,
          gunningFogIndex: parsed.gunningFogIndex,
          sentenceCount: parsed.sentenceCount,
          complexWordCount: parsed.complexWordCount,
        },
        headers: allHeaders,
        storeBody: this.config.storeBodySnapshots
          ? {
              body,
              maxBytes:
                this.config.bodySnapshotMaxBytes > 0
                  ? this.config.bodySnapshotMaxBytes
                  : 1_048_576,
            }
          : null,
        links: persistedLinks,
        images: this.config.storeImages ? parsed.images : [],
        fromDepth: item.depth,
      });
      // V2 Faz 1 — Persist render artefacts inline so they finish before
      // the URL is considered done. Bug #8: previously these were
      // fire-and-forget, which let a Clear racing the crawler write
      // orphan rows into the freshly-reset DB. Awaiting here adds at
      // most 1-3 ms per URL but eliminates the race window.
      if (urlId) {
        const persistOps: Promise<unknown>[] = [];
        if (renderedHtml) {
          const cap =
            this.config.bodySnapshotMaxBytes > 0
              ? this.config.bodySnapshotMaxBytes
              : 1_048_576;
          persistOps.push(
            this.dbCall<void>('setUrlRenderedBody', [
              urlId,
              renderedHtml,
              renderMs,
              cap,
            ]),
          );
        }
        if (renderScreenshots) {
          persistOps.push(
            this.dbCall<void>('setUrlScreenshotPaths', [urlId, renderScreenshots]),
          );
        }
        if (renderLcp) {
          persistOps.push(this.dbCall<void>('setUrlLcpCandidate', [urlId, renderLcp]));
        }
        if (renderMobile) {
          persistOps.push(
            this.dbCall<void>('setUrlMobileUsability', [urlId, renderMobile]),
          );
        }
        if (renderA11y) {
          persistOps.push(this.dbCall<void>('setUrlA11y', [urlId, renderA11y]));
        }
        if (persistOps.length > 0) {
          const results = await Promise.allSettled(persistOps);
          for (const r of results) {
            if (r.status === 'rejected') {
              this.emit(
                'debug',
                `Render persistence failed for ${item.url}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`,
              );
            }
          }
        }
      }
      // List / Sitemap ("fixed-URL") modes crawl exactly the supplied set —
      // nothing the pages point at. External links and internal subresources
      // aren't part of that set, so probing/fetching them would balloon the
      // crawl far past the sitemap (the "it keeps crawling page links / I see
      // social links" report). Outlinks are still stored as link rows for the
      // Outlinks tab; they're just not fetched as their own URL rows here.
      const fixedUrlMode =
        this.config.mode === 'list' || this.config.mode === 'sitemap';
      if (!fixedUrlMode) {
        for (const link of storableLinks) {
          if (!link.isInternal) this.enqueueExternal(link.toUrl);
        }
      }
      this.crawled++;

      // Subresource crawling — fetch internal images / CSS / JS referenced by
      // this page so they appear in the Internal tab with their own status
      // code, content type, and size (Screaming Frog "Check Images/CSS/JS").
      // Done before the noindex/nofollow early-return so a page's assets are
      // crawled regardless of its own indexability. Resources are leaf nodes:
      // the non-HTML fetch path stores them without extracting further links.
      // Skipped in fixed-URL modes for the same reason as external probing.
      if (!fixedUrlMode) {
        this.enqueueResources(parsed, item.depth);
      }

      // Follow the page's links unless the page itself says nofollow —
      // from meta robots OR the X-Robots-Tag header. `noindex` alone does
      // NOT stop link following: `noindex, follow` is the standard
      // pattern for paginated archives ("don't index this list page, but
      // do crawl through to the items"), and gating on noindex here meant
      // every product/article reachable only from page 2+ was never
      // fetched and then reported as an orphan.
      if (parsed.hasNofollow || headerDirectives.nofollow) {
        return;
      }

      if (this.config.scope === 'exact-url' || item.checkOnly) {
        // exact-url / single-page mode: do not follow any links. Same for
        // a URL pulled in only to check its status (see `checkOnly`).
      } else {
        const nextDepth = item.depth + 1;
        // Spider → Crawl "Internal Hyperlinks / Crawl". Off leaves every
        // other discovery route (sitemaps, canonicals, pagination) intact,
        // so it audits a fixed set of pages without spidering outward.
        if (this.config.crawlInternalLinks) {
          for (const link of storableLinks) {
            const inScope = isInScope(this.config.startUrl, link.toUrl, this.config.scope);
            // With `scope: 'subfolder'`, "Check Links Outside of Start
            // Folder" fetches out-of-folder targets once so their status
            // is known, then stops — Screaming Frog draws the same line
            // between checking a link and crawling through it.
            const checkOnly =
              !inScope &&
              this.config.scope === 'subfolder' &&
              this.config.checkLinksOutsideStartFolder &&
              isInScope(this.config.startUrl, link.toUrl, 'subdomain');
            if (!inScope && !checkOnly && !this.config.crawlExternal) continue;
            // Wave 3 — nofollow follow toggle. By default nofollow links
            // are stored (when `storeNofollowLinks` is on) but never
            // recursed into. Turning the matching row on opts out of the
            // "respect nofollow" behaviour and treats them like any other
            // link for the follow decision — internal and external are
            // separate switches because sites nofollow them for opposite
            // reasons (crawl-budget shaping vs. not vouching for a third
            // party).
            if (link.rel?.includes('nofollow')) {
              const followThis = link.isInternal
                ? this.config.followNofollow
                : this.config.followExternalNofollow;
              if (!followThis) continue;
            }
            this.enqueue({ url: link.toUrl, depth: nextDepth, checkOnly });
          }
        }
        // Wave 3 — Pagination follow toggle. rel=next/prev are part of
        // the standard discovery graph; the toggle exists to debug
        // pagination-only loops without disabling all link follow.
        if (this.config.followPaginationLinks) {
          for (const target of [parsed.paginationNext, parsed.paginationPrev]) {
            if (!target) continue;
            const inScope = isInScope(this.config.startUrl, target, this.config.scope);
            if (!inScope && !this.config.crawlExternal) continue;
            this.enqueue({ url: target, depth: nextDepth });
          }
        }
        // Wave 3 — Canonical follow toggle. When on, a 200 page that
        // declares a canonical pointing to a different URL also
        // enqueues that target. Default off — most crawls treat
        // canonicals as a signal, not a navigation hint.
        if (
          this.config.followCanonicals &&
          parsed.canonicalResolved &&
          parsed.canonicalResolved !== item.url
        ) {
          // Resolved, not raw: a relative canonical passed verbatim to
          // isInScope/enqueue is not a URL and would either be dropped or
          // fetched against the wrong base.
          const inScope = isInScope(
            this.config.startUrl,
            parsed.canonicalResolved,
            this.config.scope,
          );
          if (inScope || this.config.crawlExternal) {
            this.enqueue({ url: parsed.canonicalResolved, depth: nextDepth });
          }
        }
        // Wave 3 — JS-style redirect follow. Currently covers
        // `<meta http-equiv="refresh">` content URLs; window.location
        // bodies aren't statically followable without a JS engine and
        // are out of scope.
        if (this.config.followJsRedirects && parsed.metaRefreshUrl) {
          const inScope = isInScope(
            this.config.startUrl,
            parsed.metaRefreshUrl,
            this.config.scope,
          );
          if (inScope || this.config.crawlExternal) {
            this.enqueue({ url: parsed.metaRefreshUrl, depth: nextDepth });
          }
        }
        // Spider → Crawl rows that only add discovery. Each one enqueues a
        // declared alternate — a translated page, an AMP variant, an m-dot
        // URL — that an ordinary hyperlink often never points at, which is
        // exactly why they go uncrawled without an explicit opt-in.
        const followDeclared = (target: string | null): void => {
          if (!target || target === item.url) return;
          const inScope = isInScope(this.config.startUrl, target, this.config.scope);
          if (!inScope && !this.config.crawlExternal) return;
          this.enqueue({ url: target, depth: nextDepth });
        };
        if (this.config.crawlHreflang) {
          for (const h of parsed.hreflangs) followDeclared(h.href);
        }
        if (this.config.crawlAmp) followDeclared(parsed.amphtml);
        if (this.config.crawlMobileAlternate) followDeclared(parsed.mobileAlternate);
      }
    } catch (err) {
      // Stop / Clear: abandon silently. No row is written, no failure
      // counter is bumped, the URL is not re-enqueued. Without this
      // gate the ~20 in-flight URLs after Stop would each land in the
      // table — and Clear's db.reset() races with their writes,
      // resurrecting "ghost" rows in a freshly-cleared table.
      if (this.stopped && controller.signal.aborted) {
        return;
      }
      // User-initiated Pause aborts every live controller. Don't treat
      // those as fetch failures — the URL hasn't been seen yet, so we
      // re-enqueue it directly (bypassing `enqueue` because the URL is
      // already in the `seen` set from the original dispatch). Without
      // this, Pause would mark `concurrency` (often 20) URLs as failed
      // and surface them as errors in the URL table. Re-enqueue lands
      // in a paused queue → resume() picks them up cleanly.
      if (this.paused && controller.signal.aborted) {
        this.queue
          .add(() => this.fetchAndProcess(item), { priority: Crawler.priorityFor(item) })
          .catch(() => undefined);
        return;
      }
      this.failed++;
      const detail = formatFetchError(err);
      const elapsed = Date.now() - t0;
      // Distinguish the seed URL (depth 0 means the user's start URL or a
      // top-level list entry) — its failure is much higher-signal because
      // the crawl can't make any progress without it.
      const isSeed = item.depth === 0 && item.url === this.config.startUrl;
      this.emit(
        isSeed ? 'error' : 'warn',
        `Fetch failed [${elapsed}ms] ${item.url}: ${detail}`,
      );
      await this.dbCall<number>('upsertUrl', [
        {
          url: item.url,
          urlMalformed: isUrlMalformed(item.url) ? 1 : 0,
          urlTrap: this.trapKind(item.url),
          contentKind: 'html',
          statusCode: null,
          statusText: detail,
          indexability: 'non-indexable:client-error',
          indexabilityReason: `Network error: ${detail}`,
          responseTimeMs: elapsed,
          depth: item.depth,
        },
      ]);
    } finally {
      this.inFlightFetchControllers.delete(controller);
      clearTimeout(timeout);
      if (respTimeTimer) clearTimeout(respTimeTimer);
      // Politeness delay — applied per worker *after* each request so a
      // higher concurrency still honours a "one request every N ms per slot"
      // contract on top of the global RPS cap. This is the user's own
      // `crawlDelayMs` setting only; a robots.txt Crawl-delay is enforced
      // globally in `acquireRateSlot` instead, which is what the directive
      // actually means (see there).
      const politenessMs = this.config.crawlDelayMs;
      if (politenessMs > 0 && !this.stopped) {
        await sleep(politenessMs);
      }
    }
  }

  /**
   * Fetch wrapper with exponential backoff on transient failures.
   * Retries are triggered by network errors, HTTP 429, and 5xx responses —
   * 3xx/4xx (except 429) are treated as final.
   */
  /**
   * Wave 9 — Resolve the User-Agent for a given URL. Walks the
   * `perHostUserAgents` rule list in order, returning the first
   * pattern whose host matches; falls back to the global
   * `config.userAgent`. Pattern syntax:
   *   - exact host         `m.example.com`
   *   - leading wildcard   `*.example.com` matches any subdomain
   *                        (does NOT match the apex `example.com`)
   * Match is case-insensitive on the URL host.
   */
  private resolveUserAgent(url: string): string {
    const rules = this.config.perHostUserAgents ?? [];
    if (rules.length === 0) return this.config.userAgent;
    let host = '';
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      return this.config.userAgent;
    }
    for (const rule of rules) {
      const pat = rule.hostPattern.trim().toLowerCase();
      if (!pat) continue;
      if (pat.startsWith('*.')) {
        const suffix = pat.slice(1); // ".example.com"
        if (host.endsWith(suffix) && host.length > suffix.length) {
          return rule.userAgent;
        }
      } else if (host === pat) {
        return rule.userAgent;
      }
    }
    return this.config.userAgent;
  }

  /**
   * Per-origin Digest challenge cache. The first request to a protection
   * space still costs one 401 to learn the realm/nonce; every subsequent
   * request to the same origin reuses the cached challenge and sends the
   * `Authorization: Digest …` header proactively (no 401 round-trip),
   * incrementing the nonce-count (`nc`) each time per RFC 2617/7616.
   */
  private readonly digestChallenges = new Map<
    string,
    { challenge: DigestChallenge; nc: number }
  >();

  /** Compute a proactive Digest Authorization header for `fetchUrl` from a
   *  previously-cached same-origin challenge, bumping the nonce count.
   *  Returns null when digest auth isn't configured or the origin's realm
   *  hasn't been learned yet (that first request still pays one 401). */
  private digestAuthHeader(fetchUrl: string, method = 'GET'): string | null {
    if (this.config.auth.type !== 'digest' || !(this.config.auth.username ?? '')) return null;
    let origin: string;
    try {
      origin = new URL(fetchUrl).origin;
    } catch {
      return null;
    }
    const entry = this.digestChallenges.get(origin);
    if (!entry) return null;
    entry.nc += 1;
    const u = new URL(fetchUrl);
    return buildDigestAuthHeader(entry.challenge, {
      method,
      uri: u.pathname + u.search,
      username: this.config.auth.username ?? '',
      password: this.config.auth.password ?? '',
      nc: entry.nc.toString(16).padStart(8, '0'),
    });
  }

  /**
   * Build request headers for a crawl fetch: defaults + auth + any
   * established session cookies. A user-supplied `Cookie` header (via
   * customHeaders) always wins over the session jar; `extra` (e.g. a
   * computed Digest Authorization) is applied last.
   */
  private requestHeaders(url: string, extra?: Record<string, string>): Record<string, string> {
    const headers = defaultRequestHeaders(
      this.resolveUserAgent(url),
      this.config.acceptLanguage,
      this.config.customHeaders,
      this.config.auth,
    );
    if (this.sessionJar) {
      const hasCookie = Object.keys(headers).some((k) => k.toLowerCase() === 'cookie');
      if (!hasCookie) {
        const ck = this.sessionJar.cookieHeader(url);
        if (ck) headers['cookie'] = ck;
      }
    }
    if (extra) Object.assign(headers, extra);
    return headers;
  }

  /** Capture Set-Cookie from a response into the session jar so a rotating
   *  login session stays alive. No-op when form login is off. */
  private refreshSessionJar(url: string, res: Response): void {
    if (!this.sessionJar) return;
    try {
      const setCookies =
        (res.headers as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
      if (setCookies.length) this.sessionJar.setFromResponse(url, setCookies);
    } catch {
      /* best-effort */
    }
  }

  /**
   * Execute the form-based login sequence before the crawl starts. Steps
   * run in order over one shared cookie jar; each step can capture values
   * (CSRF tokens, etc.) from its response via CSS selectors for `{{var}}`
   * interpolation in later steps. On success the jar is installed so its
   * cookies are replayed on every crawl request. Best-effort — a failed
   * step is logged and the crawl proceeds unauthenticated.
   */
  private async runFormLogin(): Promise<void> {
    const cfg = this.config.formLogin;
    if (!cfg || !cfg.enabled) return;
    if (cfg.mode === 'browser') {
      await this.runBrowserLogin();
      return;
    }
    if (cfg.steps.length === 0) return;

    const jar = new SessionCookieJar();
    const vars: Record<string, string> = {};
    const interp = (s: string): string =>
      s.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_m, name: string) => vars[name] ?? '');
    const cookieHeaderFor = (target: string): Record<string, string> => {
      const h = defaultRequestHeaders(
        this.config.userAgent,
        this.config.acceptLanguage,
        this.config.customHeaders,
        this.config.auth,
      );
      const ck = jar.cookieHeader(target);
      if (ck && !Object.keys(h).some((k) => k.toLowerCase() === 'cookie')) h['cookie'] = ck;
      return h;
    };

    this.setOp('crawl:login');
    for (let i = 0; i < cfg.steps.length; i++) {
      const step = cfg.steps[i]!;
      const stepUrl = interp(step.url).trim();
      if (!stepUrl) continue;
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        Math.max(5000, this.config.requestTimeoutMs),
      );
      try {
        const headers = cookieHeaderFor(stepUrl);
        let body: string | undefined;
        if (step.method === 'POST') {
          const form = new URLSearchParams();
          for (const f of step.fields) {
            if (f.name.trim()) form.append(f.name, interp(f.value));
          }
          body = form.toString();
          headers['content-type'] = 'application/x-www-form-urlencoded';
        }
        let current = await undiciFetch(stepUrl, {
          method: step.method,
          headers,
          body,
          redirect: 'manual',
          signal: controller.signal,
        });
        // Capture cookies, then follow up to 5 redirects manually so the
        // Set-Cookie on a post-login 30x is captured too.
        let hops = 0;
        for (;;) {
          const sc =
            (current.headers as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
          if (sc.length) jar.setFromResponse(stepUrl, sc);
          const loc = current.headers.get('location');
          if (!loc || hops >= 5 || current.status < 300 || current.status >= 400) break;
          hops++;
          const next = new URL(loc, stepUrl).toString();
          try {
            await current.body?.cancel();
          } catch {
            /* ignore */
          }
          current = await undiciFetch(next, {
            method: 'GET',
            headers: cookieHeaderFor(next),
            redirect: 'manual',
            signal: controller.signal,
          });
        }
        if (step.captures.length) {
          const html = await current.text().catch(() => '');
          if (html) {
            const $ = cheerioLoad(html);
            for (const cap of step.captures) {
              if (!cap.name.trim() || !cap.selector.trim()) continue;
              const el = $(cap.selector).first();
              const attr = (cap.attribute ?? 'value').trim() || 'value';
              const val = attr.toLowerCase() === 'text' ? el.text() : el.attr(attr);
              if (val !== undefined && val !== null) vars[cap.name.trim()] = String(val).trim();
            }
          }
        } else {
          try {
            await current.body?.cancel();
          } catch {
            /* ignore */
          }
        }
        this.emit(
          'info',
          `Form login step ${i + 1}/${cfg.steps.length}: ${step.method} ${stepUrl} -> ${current.status}`,
        );
      } catch (err) {
        this.emit(
          'warn',
          `Form login step ${i + 1} failed (${stepUrl}): ${formatFetchError(err)} — continuing unauthenticated`,
        );
      } finally {
        clearTimeout(timer);
      }
    }

    if (jar.size > 0) {
      this.sessionJar = jar;
      this.emit('info', `Form login established ${jar.size} session cookie(s).`);
    } else {
      this.emit('warn', 'Form login produced no cookies — the crawl will run unauthenticated.');
    }
  }

  /**
   * Browser-driven login (`formLogin.mode === 'browser'`). Drives a one-shot
   * Playwright Chromium through the SPA login form, then bridges the
   * resulting session cookies into the same jar the undici crawl replays.
   * Best-effort — a failure logs a warning and the crawl proceeds
   * unauthenticated.
   */
  private async runBrowserLogin(): Promise<void> {
    const b = this.config.formLogin.browser;
    if (!b || !b.loginUrl.trim()) {
      this.emit(
        'warn',
        'Browser login enabled but no login URL configured — running unauthenticated.',
      );
      return;
    }
    this.setOp('crawl:login');
    const jr = this.config.jsRender;
    try {
      const result = await runBrowserLogin(
        {
          loginUrl: b.loginUrl,
          usernameSelector: b.usernameSelector,
          usernameValue: b.usernameValue,
          passwordSelector: b.passwordSelector,
          passwordValue: b.passwordValue,
          submitSelector: b.submitSelector,
          successSelector: b.successSelector,
          waitMs: b.waitMs,
          allowInsecureTls: b.allowInsecureTls,
        },
        {
          headless: jr?.headless ?? true,
          channel: jr?.browserChannel || undefined,
          userAgent: this.config.userAgent,
          acceptLanguage: this.config.acceptLanguage,
          viewport: jr
            ? { width: jr.viewportWidth, height: jr.viewportHeight }
            : undefined,
          timeoutMs: Math.max(5000, this.config.requestTimeoutMs),
        },
      );
      const jar = new SessionCookieJar();
      jar.setFromBrowserCookies(result.cookies);
      if (jar.size > 0) {
        this.sessionJar = jar;
        this.emit(
          'info',
          `Browser login established ${jar.size} session cookie(s) (settled at ${result.finalUrl}).`,
        );
      } else {
        this.emit(
          'warn',
          'Browser login produced no cookies — the crawl will run unauthenticated.',
        );
      }
    } catch (err) {
      this.emit(
        'warn',
        `Browser login failed: ${formatFetchError(err)} — continuing unauthenticated.`,
      );
    }
  }

  private async fetchWithRetry(
    url: string,
    signal: AbortSignal,
  ): Promise<Response & { ttfbMs: number }> {
    const maxAttempts = Math.max(0, this.config.retryAttempts) + 1;
    const baseDelay = Math.max(0, this.config.retryInitialDelayMs);
    let lastError: unknown = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (this.stopped) throw lastError ?? new Error('crawler stopped');
      try {
        // TTFB is the time between request dispatch and headers received.
        // `await undiciFetch(...)` resolves once the response status line +
        // headers are in — body streaming hasn't started yet — so this is
        // the right place to mark the timestamp. Per-attempt so a retry's
        // TTFB doesn't include the failed first attempt's overhead.
        const tStart = Date.now();
        // Old AJAX Crawling Scheme — when enabled, hashbang URLs are
        // fetched in their `?_escaped_fragment_=` form so a pre-rendering
        // server returns the snapshot HTML. The DB row keeps the original
        // `url`; only the network request uses the transformed address.
        const fetchUrl =
          this.config.renderingMode === 'ajax'
            ? toEscapedFragmentUrl(url)
            : url;
        // Proactive Digest — if we already learned this origin's realm on
        // an earlier URL, send the Authorization header up-front so the
        // server doesn't need to issue a 401 first.
        const proactiveDigest = this.digestAuthHeader(fetchUrl);
        let res = await undiciFetch(fetchUrl, {
          method: 'GET',
          headers: proactiveDigest
            ? this.requestHeaders(url, { authorization: proactiveDigest })
            : this.requestHeaders(url),
          redirect: 'manual',
          signal,
        });
        // HTTP Digest — a 401 carries the `WWW-Authenticate: Digest`
        // challenge (or a fresh nonce on `stale=true`); cache it per-origin,
        // recompute the Authorization header, and retry once. Only when
        // digest auth is configured with a username.
        if (
          res.status === 401 &&
          this.config.auth.type === 'digest' &&
          (this.config.auth.username ?? '')
        ) {
          const challenge = parseDigestChallenge(res.headers.get('www-authenticate'));
          if (challenge) {
            try {
              await res.body?.cancel();
            } catch {
              /* ignore */
            }
            let origin: string;
            try {
              origin = new URL(fetchUrl).origin;
            } catch {
              origin = fetchUrl;
            }
            // Cache the (possibly rotated) challenge and reset its nonce
            // counter; digestAuthHeader bumps it to 1 for this retry.
            this.digestChallenges.set(origin, { challenge, nc: 0 });
            const authHeader = this.digestAuthHeader(fetchUrl);
            if (authHeader) {
              res = await undiciFetch(fetchUrl, {
                method: 'GET',
                headers: this.requestHeaders(url, { authorization: authHeader }),
                redirect: 'manual',
                signal,
              });
            }
          }
        }
        // Keep the login session alive — capture any rotated session cookies.
        this.refreshSessionJar(url, res);
        const ttfbMs = Date.now() - tStart;
        // Final attempt or non-retryable status — return as-is. We attach
        // ttfbMs as a non-enumerable property so the existing call sites
        // can read it without breaking the Response shape elsewhere.
        if (attempt === maxAttempts - 1 || !isRetryableStatus(res.status)) {
          (res as unknown as { ttfbMs: number }).ttfbMs = ttfbMs;
          return res as unknown as Response & { ttfbMs: number };
        }
        // Drain body so the connection can be reused, then back off.
        try {
          await res.body?.cancel();
        } catch {
          /* ignore */
        }
        lastError = new Error(`HTTP ${res.status}`);
        this.emit(
          'warn',
          `Retry ${attempt + 1}/${maxAttempts - 1} for ${url}: HTTP ${res.status} after ${ttfbMs}ms`,
        );
      } catch (err) {
        lastError = err;
        const elapsedMs = Date.now() - (this.startedAt > 0 ? this.startedAt : Date.now());
        // Don't keep retrying after stop() / timeout abort — the controller
        // has already fired, so further attempts will fail immediately.
        if (signal.aborted) {
          this.emit(
            'debug',
            `Fetch aborted ${url}: ${formatFetchError(err)} (signal already triggered, no further retries)`,
          );
          throw err;
        }
        if (attempt === maxAttempts - 1) {
          this.emit(
            'debug',
            `Final attempt ${attempt + 1}/${maxAttempts} failed for ${url}: ${formatFetchError(err)}`,
          );
          throw err;
        }
        this.emit(
          'warn',
          `Retry ${attempt + 1}/${maxAttempts - 1} for ${url}: ${formatFetchError(err)} (elapsed ${elapsedMs}ms)`,
        );
      }
      const delay = baseDelay * 2 ** attempt;
      await sleep(delay);
    }
    // Unreachable — the loop above always returns or throws — but TS wants it.
    throw lastError ?? new Error('retry loop exhausted');
  }

  /**
   * Adaptive concurrency state. We start at the user-configured ceiling
   * and shrink when the renderer's input lag spikes — typically because
   * SQLite is locked by a heavy SELECT or because the OS is paging.
   * Caller (the desktop main process) feeds lag samples via
   * `reportRendererLag()`; we adjust at most once per ADAPT_COOLDOWN_MS
   * so a single GC pause doesn't oscillate the queue.
   *
   * Targets:
   *   lag > 200 ms  → shrink concurrency by 1, floor 1
   *   lag < 30 ms   → grow concurrency by 1, ceiling = configured max
   */
  private currentConcurrency = 0;
  private lastAdaptTs = 0;
  private static readonly ADAPT_COOLDOWN_MS = 2_000;

  /**
   * Externally imposed concurrency scale, 0.1–1. Fed by the desktop
   * host from OS pressure signals — today macOS thermal state
   * (nominal 1 / fair 0.75 / serious 0.5 / critical 0.25), by design
   * open to other sources (memory pressure) later. Scales the ceiling
   * the lag-adaptive loop is allowed to reach, so the two mechanisms
   * compose instead of fighting: shrink is applied immediately
   * (Apple's guidance — react to `serious` at once, the OS is already
   * enacting countermeasures), recovery is gradual via
   * `reportRendererLag`'s +1-per-cooldown growth once the ceiling
   * lifts.
   */
  private throttleScale = 1;
  /**
   * Per-source throttle scales, so independent pressure signals compose
   * instead of overwriting each other. The effective scale is the MINIMUM
   * across sources — the tightest constraint wins. The source key is the
   * part of `reason` before the first `:` (e.g. `thermal:serious` →
   * `thermal`, `multi-session` → `multi-session`), so a source updating its
   * level (thermal fair→serious) replaces its own entry rather than piling
   * up. A scale of ≥1 removes the source (no longer constraining).
   */
  private readonly throttleScales = new Map<string, number>();

  /** Configured ceiling with the external throttle scale applied. */
  private effectiveCeiling(): number {
    const base = Math.max(1, Math.min(200, this.config.maxConcurrency));
    return Math.max(1, Math.round(base * this.throttleScale));
  }

  /** Public — the desktop main process maps thermal state + multi-session
   *  concurrency budget here. Sources compose via minimum (see field doc). */
  setThrottleScale(scale: number, reason: string): void {
    const s = Math.min(1, Math.max(0.1, scale));
    const source = reason.split(':')[0] || reason;
    if (scale >= 1) this.throttleScales.delete(source);
    else this.throttleScales.set(source, s);
    let min = 1;
    for (const v of this.throttleScales.values()) min = Math.min(min, v);
    if (min === this.throttleScale) return;
    this.throttleScale = min;
    const ceiling = this.effectiveCeiling();
    if (this.currentConcurrency === 0 || this.currentConcurrency > ceiling) {
      this.currentConcurrency = ceiling;
      this.queue.concurrency = ceiling;
    }
    // External probes get the same cut. Constructor band is 2..10;
    // under throttle we additionally allow dropping to 1 so a
    // `critical` state really does quiesce the network.
    this.externalQueue.concurrency = Math.max(1, Math.min(10, ceiling));
    this.emit(
      'info',
      `Throttle: concurrency ceiling → ${ceiling}/${Math.max(1, Math.min(200, this.config.maxConcurrency))} (${reason})`,
    );
  }

  /** Public so the desktop main process can pipe in renderer Lag reports. */
  reportRendererLag(lagMs: number): void {
    if (!this.running || this.paused) return;
    const now = Date.now();
    if (now - this.lastAdaptTs < Crawler.ADAPT_COOLDOWN_MS) return;
    const ceiling = this.effectiveCeiling();
    if (this.currentConcurrency === 0) this.currentConcurrency = ceiling;
    let next = this.currentConcurrency;
    // Floor 5 (was 1). The renderer's lag probe occasionally spikes
    // for unrelated reasons (GC, an input burst, devtools open) and
    // a 1-floor would let those one-off spikes corner the queue at
    // single-task dispatch — which on a slow remote server (avg resp
    // 1.5-2 s) cuts throughput from 10 URL/s to 0.5 URL/s and the
    // queue never recovers because the user never produces zero lag.
    // The floor never exceeds the throttled ceiling — under thermal
    // pressure the external cap wins.
    if (lagMs > 200) {
      next = Math.max(Math.min(5, ceiling), this.currentConcurrency - 1);
    } else if (lagMs < 30) {
      next = Math.min(ceiling, this.currentConcurrency + 1);
    }
    if (next !== this.currentConcurrency) {
      this.currentConcurrency = next;
      this.queue.concurrency = next;
      this.lastAdaptTs = now;
      this.emit(
        'debug',
        `adaptive concurrency → ${next} (lag ${lagMs} ms, ceiling ${ceiling})`,
      );
    }
  }

  private lastProgressEmitTs = 0;
  private progressTrailingTimer: ReturnType<typeof setTimeout> | null = null;
  /** Minimum gap between two progress events. 200 ms = 5 Hz, which is
   * dense enough that the user reads the URL/s + Crawled counters as
   * "live" but sparse enough that 200 URL/s of work isn't generating
   * 200 IPC messages/sec to the renderer (which then re-renders the
   * sidebar + status bar tree at the same rate). */
  private static readonly PROGRESS_THROTTLE_MS = 200;

  private emitProgress(): void {
    const now = Date.now();
    const elapsedSinceLast = now - this.lastProgressEmitTs;
    if (elapsedSinceLast < Crawler.PROGRESS_THROTTLE_MS) {
      // Schedule a trailing emit so the final state-change still
      // surfaces. Multiple calls within the throttle window collapse
      // into the same trailing timer.
      if (this.progressTrailingTimer === null) {
        const wait = Crawler.PROGRESS_THROTTLE_MS - elapsedSinceLast;
        this.progressTrailingTimer = setTimeout(() => {
          this.progressTrailingTimer = null;
          this.emitProgressNow();
        }, wait);
      }
      return;
    }
    this.emitProgressNow();
  }

  /**
   * Emit a progress frame immediately, bypassing the 5 Hz throttle.
   *
   * Every terminal state transition (crawl finished, paused, resumed)
   * MUST use this instead of `emitProgress()`. The throttle defers a
   * too-soon call by up to 200 ms via `progressTrailingTimer`, and the
   * `'done'` event that follows is emitted synchronously — so the host
   * processes 'done' first, unbinds this crawler as the session's
   * active one, and then DROPS the trailing `running: false` frame as
   * if it came from a superseded crawler. The renderer never learns the
   * crawl ended: the UI stays pinned to "Running" and Stop/Pause become
   * no-ops because the crawler they target is already detached.
   *
   * The gap only opens when the final frame lands within 200 ms of the
   * previous one — i.e. when post-crawl passes finish almost instantly,
   * which is exactly what a re-Start on an already-complete crawl does.
   */
  private emitProgressFinal(): void {
    this.emitProgressNow();
  }

  private emitProgressNow(): void {
    this.lastProgressEmitTs = Date.now();
    if (this.progressTrailingTimer !== null) {
      clearTimeout(this.progressTrailingTimer);
      this.progressTrailingTimer = null;
    }
    const elapsedMs = Date.now() - this.startedAt;
    const urlsPerSecond = elapsedMs > 0 ? (this.crawled / elapsedMs) * 1000 : 0;
    const avgResponseTimeMs =
      this.responseSamples > 0 ? Math.round(this.totalResponseTimeMs / this.responseSamples) : 0;
    const progress: CrawlProgress = {
      discovered: this.seen.size,
      crawled: this.crawled,
      failed: this.failed,
      pending: this.pending,
      currentDepth: 0,
      urlsPerSecond: Math.round(urlsPerSecond * 10) / 10,
      elapsedMs,
      avgResponseTimeMs,
      running: this.running,
      paused: this.paused,
      startUrl: this.config.startUrl,
    };
    this.emit('progress', progress);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Yield control back to the Node event loop so any queued IPC messages
 * (logs batch, progress emit, dataChanged) get a chance to dispatch
 * before the next synchronous SQL pass blocks the thread again.
 * `setImmediate` runs after I/O callbacks but before the next timers
 * phase — exactly the slot we want for "let everything else breathe".
 */
function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function compilePatterns(
  patterns: string[],
  onInvalid: (pattern: string, error: string) => void,
): RegExp[] {
  const out: RegExp[] = [];
  for (const raw of patterns) {
    const pattern = raw.trim();
    if (!pattern) continue;
    try {
      out.push(new RegExp(pattern));
    } catch (err) {
      onInvalid(pattern, err instanceof Error ? err.message : String(err));
    }
  }
  return out;
}

function parseIntSafe(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Absolute ceiling on a single response body, applied even when the user
 * has set no limit of their own.
 *
 * `maxFileSizeBytes` defaults to 0, and 0 meant "unbounded" — which
 * disabled the very protection `readBodyCapped` was written to provide.
 * An extension-less URL with no Content-Type is typed as `html`
 * (`contentKindFor`), so something like `/download/backup` was buffered
 * whole, and at concurrency 20 that is gigabytes in flight against
 * Electron's 4 GB heap cap. `Buffer.concat` then doubles the peak.
 *
 * 64 MB is far beyond any real HTML/CSS/JS document while still bounding
 * the worst case. A user-configured limit always wins — this only fills
 * in when there isn't one.
 */
const ABSOLUTE_BODY_CAP_BYTES = 64 * 1024 * 1024;

/** The byte cap actually enforced: the user's, or the safety ceiling. */
function effectiveBodyCap(configured: number): number {
  return configured > 0 ? configured : ABSOLUTE_BODY_CAP_BYTES;
}

/**
 * Read a fetch Response body as raw bytes with a hard byte cap. undici streams
 * the DECODED body (content-encoding already stripped), so this bounds the
 * actual memory a single page can consume. Content-Length is only advisory and
 * is absent on chunked / streaming responses — without this cap the body
 * buffers unbounded and a mislabeled multi-hundred-MB `text/html` endpoint OOMs
 * the process. Returns `{ overCap: true }` once the accumulated bytes exceed
 * `capBytes` (after cancelling the stream); otherwise the raw bytes, which the
 * caller decodes with the page's actual charset (NOT forced UTF-8).
 */
async function readBodyCapped(
  res: Response,
  capBytes: number,
): Promise<{ overCap: false; bytes: Buffer } | { overCap: true; bytes: null }> {
  const cap = effectiveBodyCap(capBytes);
  if (!res.body) {
    // No stream to meter. `arrayBuffer()` is still bounded in practice by
    // the Content-Length pre-check upstream.
    return { overCap: false, bytes: Buffer.from(await res.arrayBuffer()) };
  }
  capBytes = cap;
  const reader = (res.body as ReadableStream<Uint8Array>).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > capBytes) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        return { overCap: true, bytes: null };
      }
      chunks.push(value);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }
  return { overCap: false, bytes: Buffer.concat(chunks) };
}

/**
 * Detect the character encoding of an HTML/text body. undici (per the fetch
 * spec) always decodes bodies as UTF-8, which mojibakes legacy pages served as
 * ISO-8859-9 / windows-1254 (common on older Turkish sites), corrupting
 * titles, meta, word counts and duplicate fingerprints. Precedence follows the
 * HTML spec: Content-Type header charset → BOM → `<meta charset>` in the head.
 * Returns null when no signal is found (caller defaults to UTF-8).
 */
function detectCharset(bytes: Buffer, contentType: string | null): string | null {
  if (contentType) {
    const m = /charset\s*=\s*["']?\s*([^"';,\s]+)/i.exec(contentType);
    if (m && m[1]) return m[1].toLowerCase();
  }
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return 'utf-8';
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return 'utf-16le';
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return 'utf-16be';
  // Scan the first 2 KB as latin1 (ASCII-safe) for a <meta charset> declaration.
  const head = bytes.subarray(0, Math.min(bytes.length, 2048)).toString('latin1');
  const metaCharset = /<meta[^>]+charset\s*=\s*["']?\s*([a-z0-9_-]+)/i.exec(head);
  if (metaCharset && metaCharset[1]) return metaCharset[1].toLowerCase();
  const metaHttp = /<meta[^>]+content\s*=\s*["'][^"']*charset\s*=\s*([a-z0-9_-]+)/i.exec(head);
  if (metaHttp && metaHttp[1]) return metaHttp[1].toLowerCase();
  return null;
}

/**
 * Decode a body buffer using its detected charset. Falls back to UTF-8 when no
 * charset is declared or the label is unknown to the platform's TextDecoder
 * (Electron bundles full ICU, so legacy labels like `windows-1254` resolve).
 */
function decodeBody(bytes: Buffer, contentType: string | null): string {
  const charset = detectCharset(bytes, contentType);
  if (!charset || charset === 'utf-8' || charset === 'utf8') {
    return bytes.toString('utf8');
  }
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return bytes.toString('utf8');
  }
}

/**
 * Extract the URL of the first `rel="canonical"` entry from an RFC 8288
 * `Link:` HTTP header. Returns null when the header is absent or contains
 * no canonical entry.
 *
 * Format reminder: `<https://a/>; rel="next", <https://b/>; rel="canonical"`
 *  - entries are separated by commas, but commas inside `<…>` (URLs with
 *    encoded commas) must be ignored — we track angle-bracket depth to avoid
 *    splitting in the middle of a URL.
 *  - parameters are `;`-separated; `rel` may be quoted or bare and is
 *    case-insensitive.
 */
function parseLinkRelCanonical(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const entries: string[] = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < linkHeader.length; i++) {
    const ch = linkHeader[i]!;
    if (ch === '<') {
      depth++;
      cur += ch;
      continue;
    }
    if (ch === '>') {
      depth = Math.max(0, depth - 1);
      cur += ch;
      continue;
    }
    if (ch === ',' && depth === 0) {
      if (cur.trim()) entries.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) entries.push(cur);

  for (const entry of entries) {
    const m = entry.match(/^\s*<([^>]+)>\s*(.*)$/);
    if (!m) continue;
    const [, uri, rest] = m as unknown as [string, string, string];
    if (/(^|;)\s*rel\s*=\s*"?canonical"?\s*(;|$)/i.test(rest)) {
      const trimmed = uri.trim();
      return trimmed || null;
    }
  }
  return null;
}

function detectContentKind(url: string, contentType: string | null): ContentKind {
  const ct = contentType?.toLowerCase() ?? '';
  if (ct.includes('text/html') || ct.includes('application/xhtml')) return 'html';
  if (ct.includes('text/css')) return 'css';
  if (ct.includes('javascript')) return 'js';
  if (ct.startsWith('image/')) return 'image';
  if (ct.includes('application/pdf')) return 'pdf';
  if (ct.includes('font/') || ct.includes('application/font')) return 'font';

  // Extension-driven fallback when content-type is missing or generic
  // (typical for WAF / CDN bot-block responses where the gateway never
  // surfaces the real handler's `Content-Type`):
  //   - Explicit asset extension (.css/.png/.pdf/.zip…) → its `EXT_TO_KIND`
  //     entry, or `'other'` for anything in the map's tail.
  //   - No extension at all (`/kategori/x`, `/urun/y`, dynamic CMS routes)
  //     → `'html'`, matching the Screaming Frog convention. Without this
  //     default, Cloudflare 429/403 pages on extension-less URLs end up
  //     as `'other'` and disappear from the Internal-HTML view, leaving
  //     the user with an empty table after a bot-blocked crawl.
  const ext = extractExtension(url);
  if (ext) return EXT_TO_KIND[ext] ?? 'other';
  return 'html';
}
