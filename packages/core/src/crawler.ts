import { EventEmitter } from 'node:events';
import * as os from 'node:os';
import { fetch as undiciFetch } from 'undici';
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
  isUrlMalformed,
  resolveStartUrl,
  compileUrlRegexRewrites,
  toEscapedFragmentUrl,
} from './url-utils.js';
import { parseHtml, estimatePixelWidth } from './html-parser.js';
import { analyseCookies, extractSetCookies } from './cookies.js';
import { loadRobots, type RobotsChecker } from './robots.js';
import {
  collectNetworkDiagnostics,
  defaultRequestHeaders,
  detectHttpProtocol,
  formatFetchError,
  initHttpClient,
} from './http-client.js';
import { setActiveDnsHook } from './dns-resolver.js';
import { discoverSitemapUrls, fetchSitemaps } from './sitemap.js';

export interface CrawlerEvents {
  progress: (p: CrawlProgress) => void;
  done: (summary: CrawlSummary) => void;
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
}

const EXT_TO_KIND: Record<string, ContentKind> = {
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
  private robots: RobotsChecker | null = null;
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
  private startQueueCheckpointTimer(): void {
    if (this.queueCheckpointTimer) return;
    this.queueCheckpointTimer = setInterval(() => {
      if (this.stopped || !this.running) return;
      const items = Array.from(this.pendingItems.entries()).map(([url, depth]) => ({
        url,
        depth,
      }));
      void this.dbCall<void>('checkpointQueue', [items, this.config.startUrl]).catch((err) => {
        this.emit(
          'debug',
          `queue checkpoint failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    }, Crawler.QUEUE_CHECKPOINT_INTERVAL_MS);
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
  private readonly urlRewrites: import('./url-utils.js').UrlRewriteOptions;

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
      }>;
    } = {},
  ) {
    super();
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

    if (this.config.mode === 'list') {
      await this.startListMode();
      return;
    }

    const startProbeT0 = Date.now();
    const start = await resolveStartUrl(this.config.startUrl, this.config.userAgent, 5000, (info) => {
      this.emit(
        'debug',
        `resolveStartUrl: ${info.method} ${info.url} -> ${info.outcome}${
          info.detail ? ` (${info.detail})` : ''
        }`,
      );
    });
    if (!start) {
      this.emit(
        'error',
        `Invalid start URL: ${this.config.startUrl} — neither https:// nor http:// responded within 5s. Check that the host is reachable from this machine (try opening it in a browser).`,
      );
      this.running = false;
      this.emitProgress();
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

    // Fresh-start vs. resume decision. If the start URL matches the one
    // recorded from the previous crawl, we keep existing rows and resume.
    // If it differs (or there is no previous crawl), we wipe the tables.
    const previousStart = this.db.getMeta('startUrl');
    if (previousStart !== start) {
      this.db.reset();
    }
    this.db.setMeta('startUrl', start);

    const origin = new URL(start).origin;
    // robots.txt + sitemap discovery used to block the crawl start
    // sequentially (~1–4 s before the first row appeared). Both are now
    // fire-and-forget. The robots check in enqueue() short-circuits when
    // `this.robots === null`; by the time the start URL has been fetched
    // (~500 ms) and outlinks are enqueued, robots.txt has typically
    // loaded. Both promises are awaited at end-of-crawl so post-crawl
    // recompute and sitemap-derived issue counts use the full data set.
    const robotsPromise = this.config.respectRobotsTxt
      ? loadRobots(origin, this.config.userAgent).then((r) => {
          if (!this.stopped) this.robots = r;
        })
      : Promise.resolve();
    const sitemapPromise = this.config.discoverSitemaps
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
          this.pause();
        } else if (autoPaused && this.paused && rssMb < resumeAt) {
          this.emit(
            'info',
            `Memory dropped to ${rssMb} MB (< ${resumeAt} MB) — resuming crawler.`,
          );
          autoPaused = false;
          this.resume();
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
    this.hydrateFromDb();

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

    // Post-crawl heavy lifting. Each step is a synchronous SQL pass
    // that can take 1–3 s on a 1M-URL crawl; if we run them all in a
    // tight sequence the main process JS thread stays blocked for the
    // entire duration, IPC dispatch starves, and any other window
    // (especially Logs) freezes visibly. Yielding to the event loop
    // between steps lets queued IPC mesajları (logs:batch, progress,
    // dataChanged) get serviced.
    // Wave 6 — Per-pass crawl-analysis toggles. Each pass is gated
    // by its config flag so users running tight time-budget audits
    // can skip steps they don't need (e.g. duplicate clustering can
    // be 5–10 s on a 100k-URL crawl).
    if (this.config.analyseInlinks) {
      await yieldToEventLoop();
      this.emit('info', 'Recomputing inlinks…');
      this.setOp('post-crawl:recompute-inlinks');
      await this.runDbPass('recomputeInlinks');
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
      // running inline via `db.recomputeUrlsIssuesYielding`. Without
      // offloading, a 5K-URL crawl freezes the main process for
      // ~45 s in post-crawl, tripping Electron's "Not Responding"
      // dialog.
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
    this.running = false;
    this.stopMemoryMonitor();
    // Release per-URL dedup sets — at 1M URLs this is ~80–120 MB of string
    // heap that's no longer needed once the queue is drained.
    this.seen.clear();
    this.externalSeen.clear();
    this.emitProgress();
    this.setOp('idle');
    // Suppress 'done' if a stop() ran during teardown — otherwise the
    // zombie crawler's done-event clobbers the new crawl's UI state.
    if (!this.stopped) {
      this.emit('done', this.db.getSummary());
      this.fireWebhook();
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
          this.emit('info', `Webhook posted to ${url} (${res.status} in ${res.durationMs} ms)`);
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
   * Post-crawl HEAD probe over internal images so the DB knows their byte
   * size for the "Large Image" issue. HEAD-only — no body download — so
   * cost is one round-trip per image. Concurrency is bounded by the same
   * setting as the main crawl; failures are silent (probe_status stays
   * null and the issue check skips them rather than false-positives).
   */
  private async runImageSizeProbes(): Promise<void> {
    if (!this.config.probeImageSizes) return;
    if (this.stopped) return;
    let unprobed: { id: number; src: string }[] = [];
    try {
      unprobed = this.db.unprobedInternalImages(20_000);
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
    const userAgent = this.config.userAgent;

    const worker = async (): Promise<void> => {
      while (!this.stopped) {
        const idx = cursor++;
        if (idx >= unprobed.length) return;
        const entry = unprobed[idx];
        if (!entry) return;
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
              this.config.customHeaders,
              this.config.auth,
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
    const urls: string[] = [];
    const seenInList = new Set<string>();
    for (const raw of this.config.urlList) {
      const norm = normalizeUrl(raw, undefined, this.urlRewrites);
      if (!norm) continue;
      if (seenInList.has(norm)) continue;
      seenInList.add(norm);
      urls.push(norm);
    }
    if (urls.length === 0) {
      this.emit('error', 'List mode: urlList is empty (or no entries normalised to valid URLs).');
      this.running = false;
      this.emitProgress();
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

    // Fingerprint: list signature is "list:<count>:<first-url>". Two crawls
    // with the same first URL + same count look identical — good enough
    // heuristic; users who really want a fresh start can use Clear.
    const fingerprint = `list:${urls.length}:${urls[0] ?? ''}`;
    const previousStart = this.db.getMeta('startUrl');
    if (previousStart !== fingerprint) {
      this.db.reset();
    }
    this.db.setMeta('startUrl', fingerprint);

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

    // Same yielding strategy as spider mode — see the comment block
    // above the spider-mode recompute. SQL aggregates blocking the JS
    // thread starve IPC dispatch and freeze every other window.
    // Toggles match the spider-mode gates so a single config controls
    // both modes' post-crawl pipeline.
    if (this.config.analyseInlinks) {
      await yieldToEventLoop();
      this.db.recomputeInlinks();
    }
    if (this.config.analyseRedirectChains) {
      await yieldToEventLoop();
      this.db.recomputeRedirectChains();
    }
    if (this.config.analyseHreflang) {
      await yieldToEventLoop();
      this.db.recomputeHreflangAnalysis();
      await yieldToEventLoop();
      this.db.recomputeHreflangInconsistent();
    }
    if (this.config.analyseDuplicates) {
      await yieldToEventLoop();
      this.runDuplicateClustering();
    }
    if (this.config.analysePagination) {
      await yieldToEventLoop();
      this.db.recomputePaginationSequence();
    }
    if (this.config.analyseIssues) {
      await yieldToEventLoop();
      this.db.recomputeUrlsIssues(EXPENSIVE_ISSUE_DEFINITIONS);
    }
    await yieldToEventLoop();
    await this.runImageSizeProbes();
    await yieldToEventLoop();
    await this.runTlsCertProbes();
    this.running = false;
    this.stopMemoryMonitor();
    this.seen.clear();
    this.externalSeen.clear();
    this.emitProgress();
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
        const roots = await discoverSitemapUrls(
          origin,
          this.config.userAgent,
          controller.signal,
        );
        // If stop() ran while we were discovering, bail without ingesting
        // — otherwise a zombie 'info' / 'sitemap_urls' write leaks into
        // whatever crawl ran next.
        if (this.stopped) return;
        // Sitemap entry cap follows the crawl-level cap so 1M-URL crawls
        // can ingest the full sitemap, with a sensible floor for tiny caps.
        const sitemapMaxUrls = Math.max(50_000, this.config.maxUrls);
        const result = await fetchSitemaps(roots, {
          userAgent: this.config.userAgent,
          signal: controller.signal,
          timeoutMs: this.config.requestTimeoutMs,
          maxUrls: sitemapMaxUrls,
          maxDepth: 3,
        });
        if (this.stopped) return;
        await this.dbCall<void>('setSitemapUrls', [result.entries]);
        if (result.entries.length > 0) {
          this.emit(
            'info',
            `Sitemap: parsed ${result.sitemapsParsed.length}/${result.sitemapsTried.length}, ${result.entries.length} URLs${result.truncated ? ` (truncated at ${sitemapMaxUrls.toLocaleString()})` : ''}`,
          );
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

  private hydrateFromDb(): void {
    // Mark every already-known URL as "seen" so enqueue can skip them.
    for (const url of this.db.getAllUrls()) {
      this.seen.add(url);
    }
    this.crawled = this.db.countCrawledUrls();

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
    const t0 = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
    const doFetch = async (method: 'HEAD' | 'GET') =>
      undiciFetch(url, {
        method,
        headers: defaultRequestHeaders(
          this.resolveUserAgent(url),
          this.config.acceptLanguage,
          this.config.customHeaders,
          this.config.auth,
        ),
        redirect: this.config.followRedirects ? 'follow' : 'manual',
        signal: controller.signal,
      });

    try {
      let res;
      try {
        res = await doFetch('HEAD');
      } catch {
        // Some hosts / WAFs reject HEAD — fall back to GET and discard body.
        res = await doFetch('GET');
      }
      // If HEAD returned a suspicious status (405/403) try GET once to confirm
      if (res.status === 405 || res.status === 501) {
        try {
          res = await doFetch('GET');
        } catch {
          /* keep HEAD result */
        }
      }
      try {
        await res.body?.cancel();
      } catch {
        /* ignore */
      }
      await this.dbCall<void>('updateExternalProbe', [
        url,
        {
          statusCode: res.status,
          contentType: res.headers.get('content-type'),
          contentLength: parseIntSafe(res.headers.get('content-length')),
          responseTimeMs: Date.now() - t0,
        },
      ]);
    } catch (err) {
      await this.dbCall<void>('updateExternalProbe', [
        url,
        {
          statusCode: null,
          statusText: formatFetchError(err),
          responseTimeMs: Date.now() - t0,
        },
      ]);
    } finally {
      clearTimeout(timeout);
    }
  }

  stop(): void {
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
    this.emitProgress();
  }

  resume(): void {
    if (this.stopped || !this.paused) return;
    this.paused = false;
    this.queue.start();
    this.externalQueue.start();
    this.setOp('idle');
    this.emitProgress();
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

  private enqueue(item: QueueItem): void {
    if (this.stopped) return;
    if (this.seen.has(item.url)) return;
    if (this.seen.size >= this.config.maxUrls) return;
    if (item.depth > this.config.maxDepth) return;
    if (this.robots && !this.robots.isAllowed(item.url)) return;
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
    this.pending++;
    this.pendingItems.set(item.url, item.depth);
    this.queue
      .add(() => this.fetchAndProcess(item))
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
      });
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
        try {
          await res.text();
        } catch {
          /* ignore */
        }
        const indexability: Indexability =
          statusCode >= 500
            ? 'non-indexable:server-error'
            : statusCode >= 400
              ? 'non-indexable:client-error'
              : 'indexable';
        const nonHtmlUrlId = await this.dbCall<number>('upsertUrl', [
          {
            url: item.url,
            urlMalformed: isUrlMalformed(item.url) ? 1 : 0,
            contentKind: kind,
            statusCode,
            statusText: null,
            indexability,
            indexabilityReason: indexability === 'indexable' ? null : `HTTP ${statusCode}`,
            contentType,
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
        return;
      }

      const body = await res.text();
      const bodyLength = parseIntSafe(contentLengthHeader) ?? Buffer.byteLength(body, 'utf8');

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

      const xRobotsLower = xRobotsTag?.toLowerCase() ?? '';
      const headerNoindex = xRobotsLower.includes('noindex');

      let indexability: Indexability = 'indexable';
      let reason: string | null = null;
      if (parsed.hasNoindex) {
        indexability = 'non-indexable:noindex';
        reason = 'meta robots: noindex';
      } else if (headerNoindex) {
        indexability = 'non-indexable:noindex';
        reason = 'X-Robots-Tag: noindex';
      } else if (
        parsed.canonical &&
        normalizeUrl(parsed.canonical, item.url, this.urlRewrites) !== item.url
      ) {
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
          canonical: parsed.canonical,
          canonicalCount: parsed.canonicalCount,
          canonicalHttp,
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
          paginationNext: parsed.paginationNext,
          paginationPrev: parsed.paginationPrev,
          hreflangs: parsed.hreflangs.length > 0 ? JSON.stringify(parsed.hreflangs) : null,
          hreflangCount: parsed.hreflangs.length,
          amphtml: parsed.amphtml,
          favicon: parsed.favicon,
          appleTouchIcon: parsed.appleTouchIcon,
          androidIcon: parsed.androidIcon,
          manifestUrl: parsed.manifestUrl,
          feedUrl: parsed.feedUrl,
          mixedContentCount: parsed.mixedContentCount,
          mixedContentActive: parsed.mixedContentActive,
          mixedContentPassive: parsed.mixedContentPassive,
          metaRefresh: parsed.metaRefresh,
          metaRefreshUrl: parsed.metaRefreshUrl,
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
          headingOrderViolations: parsed.headingOrderViolations,
          subresourceRequestCount: parsed.subresourceRequestCount,
          headings:
            parsed.headings.length > 0 ? JSON.stringify(parsed.headings) : null,
          serverHeader,
          jsOnlyLinksCount: parsed.jsOnlyLinksCount,
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
        links: storableLinks,
        images: parsed.images,
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
      for (const link of storableLinks) {
        if (!link.isInternal) this.enqueueExternal(link.toUrl);
      }
      this.crawled++;

      if (parsed.hasNofollow || indexability === 'non-indexable:noindex') {
        return;
      }

      if (this.config.scope === 'exact-url') {
        // exact-url / single-page mode: do not follow any links.
      } else {
        const nextDepth = item.depth + 1;
        for (const link of storableLinks) {
          const inScope = isInScope(this.config.startUrl, link.toUrl, this.config.scope);
          if (!inScope && !this.config.crawlExternal) continue;
          // Wave 3 — nofollow follow toggle. By default nofollow links
          // are stored (when `storeNofollowLinks` is on) but never
          // recursed into. `followNofollow=true` opts out of the
          // "respect nofollow" behaviour and treats them like any
          // other link for the follow decision.
          if (link.rel?.includes('nofollow') && !this.config.followNofollow) continue;
          this.enqueue({ url: link.toUrl, depth: nextDepth });
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
          parsed.canonical &&
          parsed.canonical !== item.url
        ) {
          const inScope = isInScope(
            this.config.startUrl,
            parsed.canonical,
            this.config.scope,
          );
          if (inScope || this.config.crawlExternal) {
            this.enqueue({ url: parsed.canonical, depth: nextDepth });
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
        this.queue.add(() => this.fetchAndProcess(item)).catch(() => undefined);
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
      // contract on top of the global RPS cap.
      if (this.config.crawlDelayMs > 0 && !this.stopped) {
        await sleep(this.config.crawlDelayMs);
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
        const res = await undiciFetch(fetchUrl, {
          method: 'GET',
          headers: defaultRequestHeaders(
            this.resolveUserAgent(url),
            this.config.acceptLanguage,
            this.config.customHeaders,
            this.config.auth,
          ),
          redirect: 'manual',
          signal,
        });
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
  /** Public so the desktop main process can pipe in renderer Lag reports. */
  reportRendererLag(lagMs: number): void {
    if (!this.running || this.paused) return;
    const now = Date.now();
    if (now - this.lastAdaptTs < Crawler.ADAPT_COOLDOWN_MS) return;
    const ceiling = Math.max(1, Math.min(200, this.config.maxConcurrency));
    if (this.currentConcurrency === 0) this.currentConcurrency = ceiling;
    let next = this.currentConcurrency;
    // Floor 5 (was 1). The renderer's lag probe occasionally spikes
    // for unrelated reasons (GC, an input burst, devtools open) and
    // a 1-floor would let those one-off spikes corner the queue at
    // single-task dispatch — which on a slow remote server (avg resp
    // 1.5-2 s) cuts throughput from 10 URL/s to 0.5 URL/s and the
    // queue never recovers because the user never produces zero lag.
    if (lagMs > 200) {
      next = Math.max(5, this.currentConcurrency - 1);
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
