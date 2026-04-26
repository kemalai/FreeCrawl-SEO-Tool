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
import type { ProjectDb } from '@freecrawl/db';
import {
  normalizeUrl,
  isSameHost,
  extractExtension,
  isInScope,
  resolveStartUrl,
} from './url-utils.js';
import { parseHtml } from './html-parser.js';
import { loadRobots, type RobotsChecker } from './robots.js';
import { defaultRequestHeaders, formatFetchError, initHttpClient } from './http-client.js';
import { discoverSitemapUrls, fetchSitemaps } from './sitemap.js';

export interface CrawlerEvents {
  progress: (p: CrawlProgress) => void;
  done: (summary: CrawlSummary) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

interface QueueItem {
  url: string;
  depth: number;
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
  private robots: RobotsChecker | null = null;
  private progressTimer: NodeJS.Timeout | null = null;
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
  private readonly urlRewrites: {
    stripWww?: boolean;
    forceHttps?: boolean;
    lowercasePath?: boolean;
    trailingSlash?: 'leave' | 'strip' | 'add';
  };

  constructor(config: CrawlConfig, db: ProjectDb) {
    super();
    initHttpClient();
    this.config = config;
    this.db = db;
    const concurrency = Math.max(1, Math.min(200, config.maxConcurrency));
    const intervalCap = Math.max(1, config.maxRps);
    this.queue = new PQueue({ concurrency, interval: 1000, intervalCap });
    // External probes run on a separate queue so slow third-party hosts
    // don't block the main crawl.
    this.externalQueue = new PQueue({
      concurrency: Math.max(2, Math.min(10, concurrency)),
      interval: 1000,
      intervalCap: Math.max(2, intervalCap),
    });
    // Compile include/exclude patterns once — an invalid pattern should
    // surface to the user as a crawler error, not a silent miss.
    this.includeRegexes = compilePatterns(config.includePatterns, (p, err) => {
      this.emit('error', `Invalid include pattern "${p}": ${err}`);
    });
    this.excludeRegexes = compilePatterns(config.excludePatterns, (p, err) => {
      this.emit('error', `Invalid exclude pattern "${p}": ${err}`);
    });
    this.urlRewrites = {
      stripWww: config.stripWww,
      forceHttps: config.forceHttps,
      lowercasePath: config.lowercasePath,
      trailingSlash: config.trailingSlash,
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

  async start(): Promise<void> {
    this.startedAt = Date.now();
    this.stopped = false;
    this.running = true;

    // Fire an immediate progress event so the UI can flip to "Running"
    // before we block on resolveStartUrl (which can spend several seconds
    // probing HTTPS then HTTP on unreachable hosts).
    this.emitProgress();

    if (this.config.mode === 'list') {
      await this.startListMode();
      return;
    }

    const start = await resolveStartUrl(this.config.startUrl, this.config.userAgent);
    if (!start) {
      this.emit('error', `Invalid start URL: ${this.config.startUrl}`);
      return;
    }
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

    // Hydrate in-memory state from the DB so resume starts from the right
    // point; then queue whatever work is still pending.
    this.hydrateFromDb();

    try {
      // Wait for internal crawl first, then drain any external probes still
      // in flight or queued (externals may have been enqueued during internal).
      await this.queue.onIdle();
      await this.externalQueue.onIdle();
      // robots.txt + sitemap discovery may still be running — wait for
      // both before the post-crawl recompute so issue filters depending
      // on `sitemap_urls` (Non-Indexable in Sitemap, Non-200 in Sitemap)
      // see the full set, and so the robots checker is settled.
      await Promise.all([robotsPromise, sitemapPromise]);
    } finally {
      if (this.progressTimer) clearInterval(this.progressTimer);
      this.progressTimer = null;
    }

    this.db.recomputeInlinks();
    this.db.recomputeRedirectChains();
    this.running = false;
    this.stopMemoryMonitor();
    // Release per-URL dedup sets — at 1M URLs this is ~80–120 MB of string
    // heap that's no longer needed once the queue is drained.
    this.seen.clear();
    this.externalSeen.clear();
    this.emitProgress();
    // Suppress 'done' if a stop() ran during teardown — otherwise the
    // zombie crawler's done-event clobbers the new crawl's UI state.
    if (!this.stopped) this.emit('done', this.db.getSummary());
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
      if (!this.stopped) this.emit('done', this.db.getSummary());
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

    for (const u of urls) {
      this.enqueue({ url: u, depth: 0 });
    }

    try {
      await this.queue.onIdle();
      await this.externalQueue.onIdle();
    } finally {
      if (this.progressTimer) clearInterval(this.progressTimer);
      this.progressTimer = null;
    }

    this.db.recomputeInlinks();
    this.db.recomputeRedirectChains();
    this.running = false;
    this.stopMemoryMonitor();
    this.seen.clear();
    this.externalSeen.clear();
    this.emitProgress();
    if (!this.stopped) this.emit('done', this.db.getSummary());
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
        this.db.setSitemapUrls(result.entries);
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
      this.enqueue({ url: this.config.startUrl, depth: 0 });
    }

    // Re-queue any internal link targets that were discovered before the
    // previous Stop but never actually fetched.
    for (const pending of this.db.getPendingInternalLinks()) {
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
          this.config.userAgent,
          this.config.acceptLanguage,
          this.config.customHeaders,
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
      this.db.updateExternalProbe(url, {
        statusCode: res.status,
        contentType: res.headers.get('content-type'),
        contentLength: parseIntSafe(res.headers.get('content-length')),
        responseTimeMs: Date.now() - t0,
      });
    } catch (err) {
      this.db.updateExternalProbe(url, {
        statusCode: null,
        statusText: formatFetchError(err),
        responseTimeMs: Date.now() - t0,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  stop(): void {
    this.stopped = true;
    this.running = false;
    this.paused = false;
    this.stopMemoryMonitor();
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
    // Drop any queued work. If paused, unblock onIdle() so start() can resolve.
    this.queue.clear();
    this.externalQueue.clear();
    this.queue.start();
    this.externalQueue.start();
  }

  pause(): void {
    if (this.stopped || this.paused) return;
    this.paused = true;
    // PQueue.pause() halts dispatch but lets in-flight tasks finish naturally.
    this.queue.pause();
    this.externalQueue.pause();
    this.emitProgress();
  }

  resume(): void {
    if (this.stopped || !this.paused) return;
    this.paused = false;
    this.queue.start();
    this.externalQueue.start();
    this.emitProgress();
  }

  get isRunning(): boolean {
    return !this.stopped;
  }

  get isPaused(): boolean {
    return this.paused;
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

  private enqueue(item: QueueItem): void {
    if (this.stopped) return;
    if (this.seen.has(item.url)) return;
    if (this.seen.size >= this.config.maxUrls) return;
    if (item.depth > this.config.maxDepth) return;
    if (this.robots && !this.robots.isAllowed(item.url)) return;
    if (!this.passesUrlFilter(item.url)) return;
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
      });
  }

  private async fetchAndProcess(item: QueueItem): Promise<void> {
    if (this.stopped) return;

    const t0 = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      // Manual redirect handling — each hop becomes its own row so the
      // Response Codes > 3xx view and `redirect_target` column are
      // populated correctly. When followRedirects is on we enqueue the
      // target, producing a full chain across multiple crawl passes.
      const res = await this.fetchWithRetry(item.url, controller.signal);

      const responseTimeMs = Date.now() - t0;
      this.totalResponseTimeMs += responseTimeMs;
      this.responseSamples++;

      const statusCode = res.status;
      const contentType = res.headers.get('content-type');
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
      // `Link: <url>; rel="canonical"` HTTP response header — Google honours
      // this in addition to (and equal weight to) the HTML <link rel=canonical>.
      // PDFs and other non-HTML resources can only express canonicals here.
      const linkHeader = res.headers.get('link');
      const canonicalHttpRaw = parseLinkRelCanonical(linkHeader);
      const canonicalHttp = canonicalHttpRaw
        ? normalizeUrl(canonicalHttpRaw, item.url, this.urlRewrites)
        : null;

      const kind = detectContentKind(item.url, contentType);

      // Materialize all response headers once — used for the HTTP Headers
      // tab in the URL Details panel. Built before each upsertUrl so we
      // can also call setUrlHeaders right after we have a urlId.
      const allHeaders: [string, string][] = [];
      res.headers.forEach((v, k) => allHeaders.push([k, v]));

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
        const redirectUrlId = this.db.upsertUrl({
          url: item.url,
          contentKind: kind,
          statusCode,
          statusText: null,
          indexability: 'non-indexable:redirect',
          indexabilityReason: target ? `Redirects to ${target}` : `HTTP ${statusCode}`,
          contentType,
          contentLength: parseIntSafe(contentLengthHeader),
          xRobotsTag,
          responseTimeMs,
          depth: item.depth,
          redirectTarget: target,
          hsts,
          xFrameOptions,
          xContentTypeOptions,
          contentEncoding,
          csp,
          referrerPolicy,
          permissionsPolicy,
          canonicalHttp,
        });
        if (redirectUrlId) this.db.setUrlHeaders(redirectUrlId, allHeaders);
        this.crawled++;
        if (this.config.followRedirects && target) {
          const inScope = isInScope(this.config.startUrl, target, this.config.scope);
          if (inScope || this.config.crawlExternal) {
            this.enqueue({ url: target, depth: item.depth });
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
        const nonHtmlUrlId = this.db.upsertUrl({
          url: item.url,
          contentKind: kind,
          statusCode,
          statusText: null,
          indexability,
          indexabilityReason: indexability === 'indexable' ? null : `HTTP ${statusCode}`,
          contentType,
          contentLength: parseIntSafe(contentLengthHeader),
          xRobotsTag,
          responseTimeMs,
          depth: item.depth,
          hsts,
          xFrameOptions,
          xContentTypeOptions,
          contentEncoding,
          csp,
          referrerPolicy,
          permissionsPolicy,
          canonicalHttp,
        });
        if (nonHtmlUrlId) this.db.setUrlHeaders(nonHtmlUrlId, allHeaders);
        this.crawled++;
        return;
      }

      const body = await res.text();
      const bodyLength = parseIntSafe(contentLengthHeader) ?? Buffer.byteLength(body, 'utf8');
      const parsed = parseHtml(body, item.url, {
        includeSubdomains: this.config.scope === 'all-subdomains',
        customSearchTerms: this.config.customSearchTerms,
        urlRewrites: this.urlRewrites,
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
      const urlId = this.db.upsertUrl({
        url: item.url,
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
        depth: item.depth,
        outlinks: storableLinks.length,
        imagesCount: parsed.images.length,
        imagesMissingAlt,
        lang: parsed.lang,
        viewport: parsed.viewport,
        ogTitle: parsed.ogTitle,
        ogDescription: parsed.ogDescription,
        ogImage: parsed.ogImage,
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
        mixedContentCount: parsed.mixedContentCount,
        metaRefresh: parsed.metaRefresh,
        metaRefreshUrl: parsed.metaRefreshUrl,
        charset,
      });
      if (urlId) this.db.setUrlHeaders(urlId, allHeaders);
      this.db.insertLinks(urlId, storableLinks, item.depth);
      this.db.insertImages(urlId, parsed.images);
      for (const link of storableLinks) {
        if (!link.isInternal) this.enqueueExternal(link.toUrl);
      }
      this.crawled++;

      if (parsed.hasNofollow || indexability === 'non-indexable:noindex') {
        return;
      }

      if (this.config.scope === 'exact-url') {
        // exact-url mode: do not follow any links
      } else {
        const nextDepth = item.depth + 1;
        for (const link of storableLinks) {
          const inScope = isInScope(this.config.startUrl, link.toUrl, this.config.scope);
          if (!inScope && !this.config.crawlExternal) continue;
          // Belt-and-braces: when storeNofollowLinks=true we still respect
          // nofollow for the *follow* decision — store the hint, don't
          // recurse into it.
          if (link.rel?.includes('nofollow')) continue;
          this.enqueue({ url: link.toUrl, depth: nextDepth });
        }
      }
    } catch (err) {
      this.failed++;
      const detail = formatFetchError(err);
      this.db.upsertUrl({
        url: item.url,
        contentKind: 'html',
        statusCode: null,
        statusText: detail,
        indexability: 'non-indexable:client-error',
        indexabilityReason: `Network error: ${detail}`,
        responseTimeMs: Date.now() - t0,
        depth: item.depth,
      });
    } finally {
      clearTimeout(timeout);
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
  private async fetchWithRetry(url: string, signal: AbortSignal) {
    const maxAttempts = Math.max(0, this.config.retryAttempts) + 1;
    const baseDelay = Math.max(0, this.config.retryInitialDelayMs);
    let lastError: unknown = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (this.stopped) throw lastError ?? new Error('crawler stopped');
      try {
        const res = await undiciFetch(url, {
          method: 'GET',
          headers: defaultRequestHeaders(
            this.config.userAgent,
            this.config.acceptLanguage,
            this.config.customHeaders,
          ),
          redirect: 'manual',
          signal,
        });
        // Final attempt or non-retryable status — return as-is.
        if (attempt === maxAttempts - 1 || !isRetryableStatus(res.status)) {
          return res;
        }
        // Drain body so the connection can be reused, then back off.
        try {
          await res.body?.cancel();
        } catch {
          /* ignore */
        }
        lastError = new Error(`HTTP ${res.status}`);
      } catch (err) {
        lastError = err;
        // Don't keep retrying after stop() / timeout abort — the controller
        // has already fired, so further attempts will fail immediately.
        if (signal.aborted) throw err;
        if (attempt === maxAttempts - 1) throw err;
      }
      const delay = baseDelay * 2 ** attempt;
      await sleep(delay);
    }
    // Unreachable — the loop above always returns or throws — but TS wants it.
    throw lastError ?? new Error('retry loop exhausted');
  }

  private emitProgress(): void {
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

  const ext = extractExtension(url);
  return EXT_TO_KIND[ext] ?? 'other';
}
