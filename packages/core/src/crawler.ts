import { EventEmitter } from 'node:events';
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
import { defaultRequestHeaders, initHttpClient } from './http-client.js';

export interface CrawlerEvents {
  progress: (p: CrawlProgress) => void;
  done: (summary: CrawlSummary) => void;
  error: (message: string) => void;
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
  private robots: RobotsChecker | null = null;
  private progressTimer: NodeJS.Timeout | null = null;

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
  }

  async start(): Promise<void> {
    this.startedAt = Date.now();
    this.stopped = false;
    this.running = true;

    // Fire an immediate progress event so the UI can flip to "Running"
    // before we block on resolveStartUrl (which can spend several seconds
    // probing HTTPS then HTTP on unreachable hosts).
    this.emitProgress();

    const start = await resolveStartUrl(this.config.startUrl, this.config.userAgent);
    if (!start) {
      this.emit('error', `Invalid start URL: ${this.config.startUrl}`);
      return;
    }
    // Persist the resolved URL back into the active config so scope checks,
    // progress events, and link classification all see the same canonical value.
    this.config = { ...this.config, startUrl: start };

    // Fresh-start vs. resume decision. If the start URL matches the one
    // recorded from the previous crawl, we keep existing rows and resume.
    // If it differs (or there is no previous crawl), we wipe the tables.
    const previousStart = this.db.getMeta('startUrl');
    if (previousStart !== start) {
      this.db.reset();
    }
    this.db.setMeta('startUrl', start);

    const origin = new URL(start).origin;
    if (this.config.respectRobotsTxt) {
      this.robots = await loadRobots(origin, this.config.userAgent);
    }

    this.progressTimer = setInterval(() => this.emitProgress(), 500);

    // Hydrate in-memory state from the DB so resume starts from the right
    // point; then queue whatever work is still pending.
    this.hydrateFromDb();

    try {
      // Wait for internal crawl first, then drain any external probes still
      // in flight or queued (externals may have been enqueued during internal).
      await this.queue.onIdle();
      await this.externalQueue.onIdle();
    } finally {
      if (this.progressTimer) clearInterval(this.progressTimer);
      this.progressTimer = null;
    }

    this.db.recomputeInlinks();
    this.running = false;
    this.emitProgress();
    this.emit('done', this.db.getSummary());
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
        headers: defaultRequestHeaders(this.config.userAgent, this.config.acceptLanguage),
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
      const message = err instanceof Error ? err.message : String(err);
      this.db.updateExternalProbe(url, {
        statusCode: null,
        statusText: message,
        responseTimeMs: Date.now() - t0,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  stop(): void {
    this.stopped = true;
    this.running = false;
    this.queue.clear();
    this.externalQueue.clear();
  }

  get isRunning(): boolean {
    return !this.stopped;
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
      const res = await undiciFetch(item.url, {
        method: 'GET',
        headers: defaultRequestHeaders(this.config.userAgent, this.config.acceptLanguage),
        redirect: 'manual',
        signal: controller.signal,
      });

      const responseTimeMs = Date.now() - t0;
      this.totalResponseTimeMs += responseTimeMs;
      this.responseSamples++;

      const statusCode = res.status;
      const contentType = res.headers.get('content-type');
      const contentLengthHeader = res.headers.get('content-length');
      const xRobotsTag = res.headers.get('x-robots-tag');

      const kind = detectContentKind(item.url, contentType);

      // 3xx redirect — record hop, optionally enqueue target, stop.
      if (statusCode >= 300 && statusCode < 400) {
        try {
          await res.text();
        } catch {
          /* ignore */
        }
        const locationHeader = res.headers.get('location');
        const target = locationHeader ? normalizeUrl(locationHeader, item.url) : null;
        this.db.upsertUrl({
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
        });
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
        this.db.upsertUrl({
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
        });
        this.crawled++;
        return;
      }

      const body = await res.text();
      const bodyLength = parseIntSafe(contentLengthHeader) ?? Buffer.byteLength(body, 'utf8');
      const parsed = parseHtml(body, item.url, {
        includeSubdomains: this.config.scope === 'all-subdomains',
      });

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
      } else if (parsed.canonical && normalizeUrl(parsed.canonical, item.url) !== item.url) {
        indexability = 'non-indexable:canonical';
        reason = `canonical points to ${parsed.canonical}`;
      }

      const internalLinks = parsed.links.filter((l) => l.isInternal);
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
        wordCount: parsed.wordCount,
        canonical: parsed.canonical,
        metaRobots: parsed.metaRobots,
        xRobotsTag,
        contentType,
        contentLength: bodyLength,
        responseTimeMs,
        depth: item.depth,
        outlinks: parsed.links.length,
        imagesCount: parsed.images.length,
        imagesMissingAlt,
      });
      this.db.insertLinks(urlId, parsed.links, item.depth);
      this.db.insertImages(urlId, parsed.images);
      for (const link of parsed.links) {
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
        for (const link of parsed.links) {
          const inScope = isInScope(this.config.startUrl, link.toUrl, this.config.scope);
          if (!inScope && !this.config.crawlExternal) continue;
          if (link.rel?.includes('nofollow')) continue;
          this.enqueue({ url: link.toUrl, depth: nextDepth });
        }
      }
    } catch (err) {
      this.failed++;
      const message = err instanceof Error ? err.message : String(err);
      this.db.upsertUrl({
        url: item.url,
        contentKind: 'html',
        statusCode: null,
        statusText: message,
        indexability: 'non-indexable:client-error',
        indexabilityReason: `Network error: ${message}`,
        responseTimeMs: Date.now() - t0,
        depth: item.depth,
      });
    } finally {
      clearTimeout(timeout);
    }
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
      startUrl: this.config.startUrl,
    };
    this.emit('progress', progress);
  }
}

function parseIntSafe(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
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
