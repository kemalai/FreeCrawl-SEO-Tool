import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as logger from './logger.js';
import { FreezeWatchdogSharedState } from './freeze-watchdog-shared.js';

/**
 * Single-worker pool for SQLite writes. Mirrors the structure of
 * `db-reader-pool.ts` so the rest of the main process talks to both
 * via the same `call<T>(method, args)` shape.
 *
 * The pool is intentionally a "pool of one": SQLite's writer model
 * is single-writer-at-a-time. A second writer worker would just
 * serialise behind the first via `busy_timeout`, gaining no
 * parallelism. The wrapper exists to:
 *   1. Move the synchronous `.run()` calls off the Electron main
 *      thread so IPC + queue scheduling stay live during writes.
 *   2. Give us one centralised place to add batching / rate-limiting
 *      later (Phase 2 — micro-batching).
 *
 * ── Why there is deliberately NO per-request timeout ──────────────
 * The pool used to reject any call still pending after 60 s. That
 * reject did NOT cancel the job — the worker kept executing it — so
 * every "timeout → main-thread fallback" ran the SAME write twice on
 * TWO writer connections. On big projects the post-crawl issue
 * recompute legitimately exceeds 60 s, at which point the fallback
 * collided with the still-running worker pass: `database is locked`
 * (SQLITE_BUSY after `busy_timeout`), a torn `urls_issues` table, and
 * an unhandledRejection that aborted crawl teardown.
 *
 * The invariant is: while the worker is ALIVE, it is the only writer.
 * A pending call therefore waits until the worker answers or dies.
 * Diagnostics are preserved by the slow-call warner below, and a
 * genuinely wedged worker (zero JS activity for `WEDGE_TIMEOUT_MS`
 * with work pending — an infinite-loop class bug, since SQLite
 * statements always terminate) is recovered by terminating the worker
 * FIRST: only once its connection is dead do pending calls reject
 * (`WriterUnavailableError`) and the main-thread fallback run, so the
 * single-writer invariant holds on every path.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.join(__dirname, 'db-writer-worker.js');

const MAX_RESTARTS = 3;
const RESTART_WINDOW_MS = 60_000;
/** Log a warn for any call still pending after this long (and again
 *  every interval after) — visibility without control-flow impact. */
const SLOW_CALL_WARN_MS = 30_000;
const MONITOR_INTERVAL_MS = 15_000;
/** Worker heartbeat ticks every 100 ms whenever its event loop is
 *  free; long sync SQL blocks it between yields. Zero ticks for this
 *  long WITH a request pending means the thread has executed no JS at
 *  all for 10 minutes — treat as wedged and recycle the worker. */
const WEDGE_TIMEOUT_MS = 10 * 60_000;
/** Fallback wedge threshold when there is no freeze-watchdog SAB to read a
 *  heartbeat from: recycle a worker whose oldest pending call has been
 *  outstanding this long. Set generously (2×) above the heartbeat threshold
 *  because without the heartbeat we can't tell a wedged thread from a
 *  legitimately very slow query, so we err toward patience. */
const NO_SAB_WEDGE_TIMEOUT_MS = 20 * 60_000;

/**
 * Rejection type for "the worker cannot run this job at all" —
 * crashed, terminated, swapped away, or never spawned. This is the
 * ONLY error class on which callers may fall back to the main-thread
 * `ProjectDb`: in every one of these states the worker's SQLite
 * connection is gone, so a main-thread run cannot collide with it.
 * Any other rejection means the worker is alive (the job itself
 * threw) — falling back there would double-write.
 */
export class WriterUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WriterUnavailableError';
  }
}

interface PendingRequest {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  method: string;
  startedAt: number;
  lastWarnAt: number;
}

interface ResponseMessage {
  requestId: number;
  ok: boolean;
  result?: unknown;
  error?: string;
}

export class DbWriterPool {
  private worker: Worker | null = null;
  private dbPath: string | null = null;
  private freezeWatchdogSab: SharedArrayBuffer | null = null;
  private watchdogState: FreezeWatchdogSharedState | null = null;
  private nextRequestId = 1;
  private pending = new Map<number, PendingRequest>();
  private restartTimes: number[] = [];
  private terminated = false;
  private monitorTimer: ReturnType<typeof setInterval> | null = null;

  init(dbPath: string, freezeWatchdogSab: SharedArrayBuffer | null = null): void {
    if (this.terminated) {
      throw new Error('DbWriterPool: cannot init after terminate()');
    }
    this.setWatchdogSab(freezeWatchdogSab);
    if (this.dbPath === dbPath && this.worker !== null) return;
    this.dbPath = dbPath;
    this.spawn();
  }

  swap(newPath: string, freezeWatchdogSab: SharedArrayBuffer | null = null): void {
    if (freezeWatchdogSab !== null) this.setWatchdogSab(freezeWatchdogSab);
    if (this.dbPath === newPath && this.worker !== null) return;
    this.failPendingWith('writer-swapped');
    this.dbPath = newPath;
    this.spawn();
  }

  isReady(): boolean {
    return this.worker !== null && !this.terminated;
  }

  call<T>(method: string, args: unknown[] = []): Promise<T> {
    if (this.terminated) {
      return Promise.reject(new WriterUnavailableError('writer-terminated'));
    }
    if (!this.worker) {
      return Promise.reject(new WriterUnavailableError('writer-not-initialised'));
    }
    const requestId = this.nextRequestId++;
    return new Promise<T>((resolve, reject) => {
      const now = Date.now();
      this.pending.set(requestId, {
        resolve: resolve as (v: unknown) => void,
        reject,
        method,
        startedAt: now,
        lastWarnAt: now,
      });
      this.worker!.postMessage({ requestId, method, args });
    });
  }

  async terminate(): Promise<void> {
    this.terminated = true;
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
    this.failPendingWith('writer-terminated');
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

  private setWatchdogSab(sab: SharedArrayBuffer | null): void {
    if (sab === null) return;
    if (this.freezeWatchdogSab === sab && this.watchdogState !== null) return;
    this.freezeWatchdogSab = sab;
    this.watchdogState = new FreezeWatchdogSharedState(sab);
  }

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
        logger.log('error', 'main', `db-writer worker error: ${err.message}`);
      });
      w.on('exit', (code) => this.handleExit(code));
      this.worker = w;
      this.startMonitor();
      logger.log('info', 'main', `db-writer worker spawned for ${this.dbPath}`);
    } catch (err) {
      logger.log(
        'error',
        'main',
        `db-writer worker spawn failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.worker = null;
    }
  }

  /**
   * Periodic health sweep over pending calls. Two duties:
   *   1. Slow-call visibility — a warn line (with the worker's current
   *      op from the freeze-watchdog SAB) for every call running past
   *      `SLOW_CALL_WARN_MS`, repeated so long stalls stay visible in
   *      the log without ever rejecting the call.
   *   2. Wedge recovery — if calls are pending but the worker thread
   *      has executed no JS whatsoever for `WEDGE_TIMEOUT_MS`
   *      (heartbeat frozen), terminate it. `handleExit` then rejects
   *      the pending calls with `WriterUnavailableError` and respawns,
   *      so fallbacks only ever run against a dead worker connection.
   */
  private startMonitor(): void {
    if (this.monitorTimer) return;
    this.monitorTimer = setInterval(() => this.monitorTick(), MONITOR_INTERVAL_MS);
    this.monitorTimer.unref();
  }

  private monitorTick(): void {
    if (this.pending.size === 0) return;
    const now = Date.now();
    let oldestStartedAt = now;
    for (const p of this.pending.values()) {
      oldestStartedAt = Math.min(oldestStartedAt, p.startedAt);
      const elapsed = now - p.startedAt;
      if (elapsed >= SLOW_CALL_WARN_MS && now - p.lastWarnAt >= SLOW_CALL_WARN_MS) {
        p.lastWarnAt = now;
        const op = this.watchdogState?.readWriterOp() ?? 'unknown';
        logger.log(
          'warn',
          'main',
          `db-writer '${p.method}' still running after ${Math.round(elapsed / 1000)}s (worker op: ${op}) — waiting, not falling back`,
        );
      }
    }
    if (!this.worker) return;
    if (!this.watchdogState) {
      // No SAB heartbeat available — fall back to a plain outstanding-time
      // check so a genuinely wedged worker still gets recycled instead of
      // hanging every pending write forever. Coarser (no per-op detail) and
      // more patient to avoid killing a slow-but-live query.
      if (now - oldestStartedAt >= NO_SAB_WEDGE_TIMEOUT_MS) {
        logger.log(
          'error',
          'main',
          `db-writer worker appears wedged: oldest of ${this.pending.size} pending call(s) outstanding for ${Math.round((now - oldestStartedAt) / 1000)}s (no heartbeat available) — terminating and respawning`,
        );
        void this.worker.terminate().catch(() => undefined);
      }
      return;
    }
    const heartbeatAge = now - this.watchdogState.readWriterHeartbeatMs();
    if (heartbeatAge >= WEDGE_TIMEOUT_MS && now - oldestStartedAt >= WEDGE_TIMEOUT_MS) {
      const op = this.watchdogState.readWriterOp();
      logger.log(
        'error',
        'main',
        `db-writer worker wedged: no JS activity for ${Math.round(heartbeatAge / 1000)}s with ${this.pending.size} call(s) pending (worker op: ${op}) — terminating and respawning`,
      );
      // terminate() fires 'exit' → handleExit rejects pending calls
      // (WriterUnavailableError) and respawns. Fallbacks stay safe:
      // the wedged connection is dead before any main-thread write.
      void this.worker.terminate().catch(() => undefined);
    }
  }

  private handleResponse(msg: ResponseMessage): void {
    const pending = this.pending.get(msg.requestId);
    if (!pending) return;
    this.pending.delete(msg.requestId);
    if (msg.ok) {
      pending.resolve(msg.result);
    } else {
      // Worker is alive and the job itself threw — NOT a
      // WriterUnavailableError, so callers must not fall back.
      pending.reject(new Error(msg.error ?? 'writer-unknown-error'));
    }
  }

  private handleExit(code: number): void {
    this.worker = null;
    if (this.terminated) return;
    // Settle in-flight writes BEFORE the clean-exit early return. The pool
    // has no request timeout, so a worker that exits with code 0 while
    // holding pending calls would leave those promises unsettled forever —
    // and every caller awaiting one hangs with it.
    this.failPendingWith('writer-crashed');
    if (code === 0) return;
    const now = Date.now();
    this.restartTimes = this.restartTimes.filter((t) => now - t < RESTART_WINDOW_MS);
    if (this.restartTimes.length >= MAX_RESTARTS) {
      logger.log(
        'error',
        'main',
        `db-writer worker crashed ${MAX_RESTARTS}× within ${RESTART_WINDOW_MS}ms — giving up. Writes fall back to main-thread DB.`,
      );
      return;
    }
    this.restartTimes.push(now);
    logger.log(
      'warn',
      'main',
      `db-writer worker exited with code ${code}; respawning (${this.restartTimes.length}/${MAX_RESTARTS})`,
    );
    this.spawn();
  }

  private failPendingWith(reason: string): void {
    for (const p of this.pending.values()) {
      p.reject(new WriterUnavailableError(reason));
    }
    this.pending.clear();
  }
}

// Process-wide singleton — the primary window's writer pool. Multi-window
// gives additional windows their own `DbWriterPool` instances.
export const dbWriterPool = new DbWriterPool();

/** Resolves which writer pool `callWriterOrFallback` should use. Defaults to
 *  the singleton; the desktop host injects a per-window resolver so a write
 *  hits the calling window's pool — mirrors `setReaderPoolResolver`. Without
 *  this, a per-window write helper would silently target the primary window's
 *  DB, the same multi-window footgun the clear/reset path once had. */
let resolveWriterPool: () => DbWriterPool = () => dbWriterPool;

/** Inject a per-call writer-pool resolver (multi-window). */
export function setWriterPoolResolver(fn: () => DbWriterPool): void {
  resolveWriterPool = fn;
}

/**
 * Helper: try the worker first, fall back to a synchronous main-thread
 * call ONLY when the worker cannot run the job at all
 * (`WriterUnavailableError`: crashed / terminated / swapped / never
 * spawned — its SQLite connection is gone, so a main-thread run can't
 * collide with it). Errors thrown by the job itself propagate: the
 * worker is alive, and re-running the same write on a second
 * connection is exactly the double-writer bug this pool exists to
 * prevent.
 */
export async function callWriterOrFallback<T>(
  method: string,
  args: unknown[],
  fallback: () => T | Promise<T>,
): Promise<T> {
  const pool = resolveWriterPool();
  if (!pool.isReady()) {
    return fallback();
  }
  try {
    return await pool.call<T>(method, args);
  } catch (err) {
    if (!(err instanceof WriterUnavailableError)) throw err;
    logger.log(
      'warn',
      'main',
      `'${method}' fell back to main-thread writer: ${err.message}`,
    );
    return fallback();
  }
}
