import { EventEmitter } from 'node:events';
import { fetch as undiciFetch } from 'undici';
import PQueue from 'p-queue';
import type {
  ContentKind,
  CrawlConfig,
  CrawlProgress,
  CrawlSummary,
  DiscoveredLink,
  Indexability,
} from '@freecrawl/shared-types';
import type { ProjectDb } from '@freecrawl/db';
import { normalizeUrl, isSameHost, extractExtension } from './url-utils.js';
import { parseHtml } from './html-parser.js';
import { loadRobots, type RobotsChecker } from './robots.js';

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
  private readonly config: CrawlConfig;
  private readonly db: ProjectDb;
  private queue: PQueue;
  private seen = new Set<string>();
  private pending = 0;
  private crawled = 0;
  private failed = 0;
  private totalResponseTimeMs = 0;
  private responseSamples = 0;
  private startedAt = 0;
  private stopped = false;
  private robots: RobotsChecker | null = null;
  private progressTimer: NodeJS.Timeout | null = null;

  constructor(config: CrawlConfig, db: ProjectDb) {
    super();
    this.config = config;
    this.db = db;
    this.queue = new PQueue({
      concurrency: Math.max(1, Math.min(50, config.maxConcurrency)),
      interval: 1000,
      intervalCap: Math.max(1, config.maxRps),
    });
  }

  async start(): Promise<void> {
    this.startedAt = Date.now();
    this.stopped = false;
    this.db.reset();

    const start = normalizeUrl(this.config.startUrl);
    if (!start) {
      this.emit('error', `Invalid start URL: ${this.config.startUrl}`);
      return;
    }

    const origin = new URL(start).origin;
    if (this.config.respectRobotsTxt) {
      this.robots = await loadRobots(origin, this.config.userAgent);
    }

    this.progressTimer = setInterval(() => this.emitProgress(), 500);

    this.enqueue({ url: start, depth: 0 });

    try {
      await this.queue.onIdle();
    } finally {
      if (this.progressTimer) clearInterval(this.progressTimer);
      this.progressTimer = null;
    }

    this.db.recomputeInlinks();
    this.emitProgress();
    this.emit('done', this.db.getSummary());
  }

  stop(): void {
    this.stopped = true;
    this.queue.clear();
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
      const res = await undiciFetch(item.url, {
        method: 'GET',
        headers: {
          'user-agent': this.config.userAgent,
          'accept-language': this.config.acceptLanguage,
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        redirect: this.config.followRedirects ? 'follow' : 'manual',
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
        includeSubdomains: this.config.includeSubdomains,
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
      });
      this.db.insertLinks(urlId, parsed.links);
      this.crawled++;

      if (parsed.hasNofollow || indexability === 'non-indexable:noindex') {
        return;
      }

      const nextDepth = item.depth + 1;
      for (const link of parsed.links) {
        if (!link.isInternal && !this.config.crawlExternal) continue;
        if (!isSameHost(this.config.startUrl, link.toUrl, {
          includeSubdomains: this.config.includeSubdomains,
        }) && !this.config.crawlExternal) {
          continue;
        }
        if (link.rel?.includes('nofollow')) continue;
        this.enqueue({ url: link.toUrl, depth: nextDepth });
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
      running: !this.stopped && this.queue.size + this.queue.pending > 0,
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
