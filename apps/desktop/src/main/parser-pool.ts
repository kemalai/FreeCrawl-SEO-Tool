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
 * Dispatch is least-busy with a round-robin tie-break. Blind round-robin
 * was not sufficient in practice: it hands out work without looking at
 * what a worker is already carrying, so with concurrency 20 against as
 * few as 2 workers (a 4-core machine) several slow pages stack on the
 * same thread and push each other past the parse timeout — and a worker
 * that has already blown the timeout kept receiving more work.
 *
 * A timed-out worker is recycled rather than reused: the parse is a
 * synchronous cheerio call inside the worker that cannot be cancelled,
 * so the only way to stop it burning a core is to terminate the thread
 * and spawn a replacement.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.join(__dirname, 'parser-worker.js');
const REQUEST_TIMEOUT_MS = 60_000;

/** Thrown when a parse exceeds REQUEST_TIMEOUT_MS. Distinguished from a
 *  crash/not-ready failure because the caller must NOT retry it inline on
 *  the main thread — a document heavy enough to wedge a worker will freeze
 *  the whole app there. */
export class ParserTimeoutError extends Error {
  constructor(ms: number) {
    super(`parser-pool: timeout > ${ms}ms`);
    this.name = 'ParserTimeoutError';
  }
}

type ParseHtmlArgs = Parameters<typeof parseHtml>;
type ParseOpts = ParseHtmlArgs[2];
type ParseResult = ReturnType<typeof parseHtml>;

interface PendingRequest {
  /** Which worker is carrying this request — needed to release its load
   *  counter and to fail everything queued on a wedged thread. */
  worker: Worker;
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
  /** In-flight parse count per worker, for least-busy dispatch. */
  private inFlight = new Map<Worker, number>();
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
        this.workers.push(this.spawnWorker());
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
    const worker = this.pickWorker();
    this.inFlight.set(worker, (this.inFlight.get(worker) ?? 0) + 1);
    return new Promise<ParseResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        this.releaseWorker(worker);
        reject(new ParserTimeoutError(REQUEST_TIMEOUT_MS));
        // Recycle AFTER rejecting this caller: the worker is stuck inside a
        // synchronous parse that can't be interrupted, so leaving it in the
        // pool means it keeps a core pinned and keeps being handed work.
        this.recycleWedged(worker);
      }, REQUEST_TIMEOUT_MS);
      this.pending.set(requestId, { worker, resolve, reject, timer });
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
    this.inFlight.clear();
    const workers = this.workers;
    this.workers = [];
    await Promise.allSettled(workers.map((w) => w.terminate()));
  }

  // ── private ──────────────────────────────────────────────────────

  /** Least in-flight requests wins; ties rotate so equally-idle workers
   *  don't all receive the next batch on the same thread. */
  private pickWorker(): Worker {
    const n = this.workers.length;
    let best = this.workers[this.nextWorkerIdx % n]!;
    let bestLoad = Number.POSITIVE_INFINITY;
    for (let i = 0; i < n; i++) {
      const w = this.workers[(this.nextWorkerIdx + i) % n]!;
      const load = this.inFlight.get(w) ?? 0;
      if (load < bestLoad) {
        best = w;
        bestLoad = load;
      }
    }
    this.nextWorkerIdx = (this.nextWorkerIdx + 1) % n;
    return best;
  }

  private releaseWorker(w: Worker): void {
    const cur = this.inFlight.get(w) ?? 0;
    if (cur <= 1) this.inFlight.delete(w);
    else this.inFlight.set(w, cur - 1);
  }

  /** Drop a worker that blew the parse timeout and put a fresh one in its
   *  place. Anything else queued behind it is failed rather than left to
   *  hang, since the thread is about to be terminated mid-parse. */
  private recycleWedged(w: Worker): void {
    const slot = this.workers.indexOf(w);
    if (slot < 0) return; // already recycled or removed
    // Remove it first so its own 'exit' handler treats it as replaced and
    // doesn't respawn a second time.
    this.workers.splice(slot, 1);
    this.inFlight.delete(w);
    for (const [id, p] of this.pending) {
      if (p.worker !== w) continue;
      clearTimeout(p.timer);
      this.pending.delete(id);
      p.reject(new ParserTimeoutError(REQUEST_TIMEOUT_MS));
    }
    logger.log(
      'warn',
      'main',
      `parser-worker exceeded ${REQUEST_TIMEOUT_MS}ms on a single document — terminating and respawning it.`,
    );
    void w.terminate().catch(() => undefined);
    const fresh = this.tryRespawn();
    if (fresh) this.workers.push(fresh);
  }

  private spawnWorker(): Worker {
    const w = new Worker(WORKER_PATH);
    w.on('message', (msg: ResponseMessage) => this.handleResponse(msg));
    w.on('error', (err) => {
      logger.log('error', 'main', `parser-worker error: ${err.message}`);
    });
    w.on('exit', (code) => {
      if (this.terminated) return;
      // Resolve this worker's CURRENT slot by identity — never trust a
      // captured index. An init-time spawn failure leaves the array
      // shorter than the logical worker count, so a captured index
      // would point at the wrong slot (or past the end).
      const slot = this.workers.indexOf(w);
      if (slot < 0) return; // already replaced / removed
      this.inFlight.delete(w);
      // Fail this worker's in-flight parses now instead of letting each one
      // sit out the full 60 s timeout for an answer that can never arrive.
      for (const [id, p] of this.pending) {
        if (p.worker !== w) continue;
        clearTimeout(p.timer);
        this.pending.delete(id);
        p.reject(new Error(`parser-worker exited (code=${code})`));
      }
      if (code === 0) {
        // Clean exit — drop the slot so `parse()` never dispatches to it.
        this.workers.splice(slot, 1);
        return;
      }
      logger.log(
        'warn',
        'main',
        `parser-worker exited (code=${code}) — respawning`,
      );
      const respawn = this.tryRespawn();
      if (respawn) {
        this.workers[slot] = respawn;
      } else {
        // Respawn failed — remove the dead worker so it is never picked.
        this.workers.splice(slot, 1);
      }
    });
    return w;
  }

  private tryRespawn(): Worker | null {
    if (this.terminated) return null;
    try {
      return this.spawnWorker();
    } catch (err) {
      logger.log(
        'error',
        'main',
        `parser-worker respawn failed: ${
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
    this.releaseWorker(pending.worker);
    if (msg.ok && msg.result !== undefined) {
      pending.resolve(msg.result);
    } else {
      pending.reject(new Error(msg.error ?? 'parser-pool: unknown error'));
    }
  }
}

export const parserPool = new ParserPool();
