import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as logger from './logger.js';

/**
 * Pool of one worker_thread holding a read-only SQLite connection.
 * "Pool" is forward-compatible naming — for now we run a single worker
 * because SQLite's WAL allows arbitrary concurrent readers but adding a
 * second worker would just double our cache footprint without gaining
 * parallelism on a single physical disk.
 *
 * Lifecycle:
 *   - `init(dbPath)` spawns the worker, points it at the file.
 *   - `swap(newPath)` is called on Open Project — terminates the old
 *     worker and spawns a fresh one; in-flight requests are rejected
 *     with `Error('reader-swapped')` so callers can retry safely.
 *   - `terminate()` on app quit. After terminate, all `call()` resolve
 *     with `Error('reader-terminated')`.
 *
 * Crash recovery:
 *   - If the worker exits unexpectedly (`exit` event with non-zero code
 *     while we still have a path) we auto-respawn up to MAX_RESTARTS
 *     within RESTART_WINDOW_MS. After the cap we surface the failure
 *     and stop trying — the user gets a clear log entry instead of a
 *     restart loop.
 *   - In-flight requests during a crash are rejected with
 *     `Error('reader-crashed')`. Callers fall back to the main-process
 *     ProjectDb (see `dbReaderCallOrFallback`) so the UI stays alive.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// The worker is built alongside the main bundle as `db-reader-worker.js`
// (electron-vite produces flat output in `out/main/`). In dev mode
// electron-vite uses the same convention.
const WORKER_PATH = path.join(__dirname, 'db-reader-worker.js');

// 30 s default leaves headroom for SQLite read contention during the
// post-crawl recompute phase (recomputeUrlsIssues holds a writer
// transaction that can keep reader queries blocked behind earlier
// queued requests for several seconds at a time on large crawls).
// Genuine worker hangs are still surfaced — just with a slightly
// longer detection window than before.
const REQUEST_TIMEOUT_MS = 30_000;
// Heavy aggregate queries (the overview sidebar's 130-counter pass and
// the post-crawl materialiser's counter fan-out) can run past the
// default budget on million-URL projects, so they get their own
// bigger ceiling.
const HEAVY_REQUEST_TIMEOUT_MS = 60_000;
const HEAVY_METHODS = new Set<string>([
  'getOverviewCounts',
  'getOverviewCountsAsync',
]);
const MAX_RESTARTS = 3;
const RESTART_WINDOW_MS = 60_000;

interface PendingRequest {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface ResponseMessage {
  requestId: number;
  ok: boolean;
  result?: unknown;
  error?: string;
}

class DbReaderPool {
  private worker: Worker | null = null;
  private dbPath: string | null = null;
  private freezeWatchdogSab: SharedArrayBuffer | null = null;
  private nextRequestId = 1;
  private pending = new Map<number, PendingRequest>();
  private restartTimes: number[] = [];
  private terminated = false;

  /** Spawn (or respawn) the worker pointed at `dbPath`. Idempotent.
   *
   *   `freezeWatchdogSab` — if provided, the worker will tick its
   *   own heartbeat + publish its current method into this shared
   *   buffer so the freeze-watchdog thread can detect a stuck
   *   reader. Pass `null` to disable diagnostics. */
  init(dbPath: string, freezeWatchdogSab: SharedArrayBuffer | null = null): void {
    if (this.terminated) {
      throw new Error('DbReaderPool: cannot init after terminate()');
    }
    this.freezeWatchdogSab = freezeWatchdogSab;
    if (this.dbPath === dbPath && this.worker !== null) return;
    this.dbPath = dbPath;
    this.spawn();
  }

  /** Switch the worker to a different .seoproject file. */
  swap(newPath: string, freezeWatchdogSab: SharedArrayBuffer | null = null): void {
    if (freezeWatchdogSab !== null) this.freezeWatchdogSab = freezeWatchdogSab;
    if (this.dbPath === newPath && this.worker !== null) return;
    this.failPendingWith('reader-swapped');
    this.dbPath = newPath;
    this.spawn();
  }

  /** Permanent shutdown — used on app quit. */
  async terminate(): Promise<void> {
    this.terminated = true;
    this.failPendingWith('reader-terminated');
    if (this.worker) {
      const w = this.worker;
      this.worker = null;
      try {
        await w.terminate();
      } catch {
        /* already gone */
      }
    }
  }

  /** True while a worker is up and ready to receive requests. */
  isReady(): boolean {
    return this.worker !== null && !this.terminated;
  }

  /**
   * Dispatch a method call to the worker. Callers should use the typed
   * wrapper `callReader<T>(method, args)` declared in the main process
   * IPC layer. Resolves with the method's return value, rejects with
   * an Error on worker error / timeout / crash.
   */
  call<T>(method: string, args: unknown[] = []): Promise<T> {
    if (this.terminated) return Promise.reject(new Error('reader-terminated'));
    if (!this.worker) return Promise.reject(new Error('reader-not-initialised'));
    const requestId = this.nextRequestId++;
    const timeoutMs = HEAVY_METHODS.has(method)
      ? HEAVY_REQUEST_TIMEOUT_MS
      : REQUEST_TIMEOUT_MS;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`reader-timeout: ${method} > ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(requestId, {
        resolve: resolve as (v: unknown) => void,
        reject,
        timer,
      });
      this.worker!.postMessage({ requestId, method, args });
    });
  }

  // ── private ──────────────────────────────────────────────────────────────

  private spawn(): void {
    if (!this.dbPath) return;
    if (this.worker) {
      const old = this.worker;
      this.worker = null;
      void old.terminate().catch(() => undefined);
    }
    try {
      const w = new Worker(WORKER_PATH, {
        workerData: {
          dbPath: this.dbPath,
          freezeWatchdogSab: this.freezeWatchdogSab,
        },
      });
      w.on('message', (msg: ResponseMessage) => this.handleResponse(msg));
      w.on('error', (err) => {
        logger.log('error', 'db-reader', `worker error: ${err.message}`);
      });
      w.on('exit', (code) => this.handleExit(code));
      this.worker = w;
      logger.log('info', 'db-reader', `worker spawned for ${this.dbPath}`);
    } catch (err) {
      logger.log(
        'error',
        'db-reader',
        `worker spawn failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.worker = null;
    }
  }

  private handleResponse(msg: ResponseMessage): void {
    const pending = this.pending.get(msg.requestId);
    if (!pending) return;
    this.pending.delete(msg.requestId);
    clearTimeout(pending.timer);
    if (msg.ok) {
      pending.resolve(msg.result);
    } else {
      pending.reject(new Error(msg.error ?? 'reader-unknown-error'));
    }
  }

  private handleExit(code: number): void {
    this.worker = null;
    if (this.terminated) return;
    if (code === 0) return;
    this.failPendingWith('reader-crashed');
    // Restart bookkeeping: drop entries older than the window so a
    // long-lived process that crashes once a day doesn't permanently
    // exhaust its restart budget.
    const now = Date.now();
    this.restartTimes = this.restartTimes.filter((t) => now - t < RESTART_WINDOW_MS);
    if (this.restartTimes.length >= MAX_RESTARTS) {
      logger.log(
        'error',
        'db-reader',
        `worker crashed ${MAX_RESTARTS}× within ${RESTART_WINDOW_MS}ms — giving up. UI queries fall back to main-process DB.`,
      );
      return;
    }
    this.restartTimes.push(now);
    logger.log(
      'warn',
      'db-reader',
      `worker exited with code ${code}; respawning (${this.restartTimes.length}/${MAX_RESTARTS})`,
    );
    this.spawn();
  }

  private failPendingWith(reason: string): void {
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error(reason));
    }
    this.pending.clear();
  }
}

// Process-wide singleton — only one worker pool ever exists.
export const dbReaderPool = new DbReaderPool();

/**
 * Thin helper for IPC handlers: try the worker first, fall back to the
 * synchronous main-process DB on any worker error. The fallback path
 * keeps the UI working even if the worker is crashed/restarting, at
 * the cost of running on the main thread for that one query.
 */
export async function callReaderOrFallback<T>(
  method: string,
  args: unknown[],
  fallback: () => T | Promise<T>,
): Promise<T> {
  if (!dbReaderPool.isReady()) {
    return fallback();
  }
  try {
    return await dbReaderPool.call<T>(method, args);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.log(
      'warn',
      'db-reader',
      `'${method}' fell back to main thread: ${msg}`,
    );
    return fallback();
  }
}
