import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import type { parseHtml } from '@freecrawl/core';
import * as logger from './logger.js';

/**
 * Round-robin pool of parser worker threads.
 *
 * Why a pool, not a single worker:
 *   - Cheerio is single-threaded inside the worker. One worker can
 *     parse one document at a time.
 *   - The crawler runs at concurrency 20 by default, so up to 20
 *     pages return their HTML body simultaneously. With one worker
 *     they would serialise behind it, defeating the point.
 *   - 4-8 workers (capped to physical cores - 2) saturate the CPU
 *     while leaving the main thread headroom for IPC and queue
 *     scheduling.
 *
 * Round-robin dispatch is sufficient: parse durations are roughly
 * proportional to body size, and the crawler's URL mix makes it
 * unlikely that long-tail pages all land on the same worker. A
 * least-loaded scheduler would add complexity for marginal gain.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.join(__dirname, 'parser-worker.js');
const REQUEST_TIMEOUT_MS = 60_000;

type ParseHtmlArgs = Parameters<typeof parseHtml>;
type ParseOpts = ParseHtmlArgs[2];
type ParseResult = ReturnType<typeof parseHtml>;

interface PendingRequest {
  resolve: (v: ParseResult) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface ResponseMessage {
  requestId: number;
  ok: boolean;
  result?: ParseResult;
  error?: string;
}

class ParserPool {
  private workers: Worker[] = [];
  private pending = new Map<number, PendingRequest>();
  private nextRequestId = 1;
  private nextWorkerIdx = 0;
  private terminated = false;

  /**
   * Spawn the worker pool. Idempotent — calling init() twice is a
   * no-op once workers are already running.
   *
   *   `size` — number of worker threads. Defaults to a sensible
   *   value based on CPU count (cores - 2, clamped to [2, 8]).
   *   Leave room for the main thread + db-reader + db-writer +
   *   freeze-watchdog so the crawler isn't competing with its own
   *   plumbing for cores.
   */
  init(size?: number): void {
    if (this.terminated) {
      throw new Error('ParserPool: cannot init after terminate()');
    }
    if (this.workers.length > 0) return;
    const cpuCount = os.cpus().length;
    const target =
      size ?? Math.max(2, Math.min(8, cpuCount - 2));
    for (let i = 0; i < target; i++) {
      try {
        this.workers.push(this.spawnWorker(i));
      } catch (err) {
        logger.log(
          'warn',
          'main',
          `parser-pool: worker ${i} spawn failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
    if (this.workers.length === 0) {
      logger.log(
        'warn',
        'main',
        'parser-pool: no workers spawned — falling back to inline parseHtml.',
      );
    } else {
      logger.log(
        'info',
        'main',
        `parser-pool: spawned ${this.workers.length} parser worker(s)`,
      );
    }
  }

  /** True when at least one worker is running and accepting requests. */
  isReady(): boolean {
    return this.workers.length > 0 && !this.terminated;
  }

  /**
   * Dispatch a parse request to the next available worker.
   * Resolves with the parsed page; rejects on timeout or worker
   * crash. Caller is expected to fall back to inline `parseHtml`
   * if the pool isn't ready.
   */
  parse(html: string, pageUrl: string, opts: ParseOpts = {}): Promise<ParseResult> {
    if (this.terminated || this.workers.length === 0) {
      return Promise.reject(new Error('parser-pool: not ready'));
    }
    const requestId = this.nextRequestId++;
    const worker = this.workers[this.nextWorkerIdx % this.workers.length]!;
    this.nextWorkerIdx++;
    return new Promise<ParseResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`parser-pool: timeout > ${REQUEST_TIMEOUT_MS}ms`));
      }, REQUEST_TIMEOUT_MS);
      this.pending.set(requestId, { resolve, reject, timer });
      worker.postMessage({ requestId, html, pageUrl, opts });
    });
  }

  async terminate(): Promise<void> {
    this.terminated = true;
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error('parser-pool: terminated'));
    }
    this.pending.clear();
    const workers = this.workers;
    this.workers = [];
    await Promise.allSettled(workers.map((w) => w.terminate()));
  }

  // ── private ──────────────────────────────────────────────────────

  private spawnWorker(index: number): Worker {
    const w = new Worker(WORKER_PATH);
    w.on('message', (msg: ResponseMessage) => this.handleResponse(msg));
    w.on('error', (err) => {
      logger.log('error', 'main', `parser-worker[${index}] error: ${err.message}`);
    });
    w.on('exit', (code) => {
      if (this.terminated) return;
      if (code === 0) return;
      logger.log(
        'warn',
        'main',
        `parser-worker[${index}] exited (code=${code}) — respawning`,
      );
      const respawn = this.tryRespawn(index);
      if (respawn) this.workers[index] = respawn;
    });
    return w;
  }

  private tryRespawn(index: number): Worker | null {
    if (this.terminated) return null;
    try {
      return this.spawnWorker(index);
    } catch (err) {
      logger.log(
        'error',
        'main',
        `parser-worker[${index}] respawn failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return null;
    }
  }

  private handleResponse(msg: ResponseMessage): void {
    const pending = this.pending.get(msg.requestId);
    if (!pending) return;
    this.pending.delete(msg.requestId);
    clearTimeout(pending.timer);
    if (msg.ok && msg.result !== undefined) {
      pending.resolve(msg.result);
    } else {
      pending.reject(new Error(msg.error ?? 'parser-pool: unknown error'));
    }
  }
}

export const parserPool = new ParserPool();
