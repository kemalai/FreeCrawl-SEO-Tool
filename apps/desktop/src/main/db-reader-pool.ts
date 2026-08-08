import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as logger from './logger.js';

/**
 * Pool of N worker_threads, each holding its own read-only SQLite
 * connection. SQLite WAL mode allows arbitrary concurrent readers, so
 * spreading queries across multiple workers gives genuine parallelism
 * for UI reads — critical because:
 *
 *   - The OverviewSidebar refresh issues a 130-clause `getOverviewCounts`
 *     every few seconds. On a single-worker pool this serialises every
 *     other read behind it, freezing the URL table refresh and the
 *     bottom panel's per-URL detail / inlinks queries until the heavy
 *     pass completes.
 *   - Pool now lets the heavy aggregate run on one worker while the
 *     short, latency-sensitive queries (urlsQuery for the visible
 *     chunks, urlDetail for the bottom panel) run on the others.
 *
 * Routing: round-robin with a "least busy" tie-break — for each call
 * we pick the worker with the fewest pending requests, and on a tie
 * fall back to a rotating cursor so two same-loaded workers don't
 * always get the next call dropped on the same one.
 *
 * Lifecycle:
 *   - `init(dbPath)` spawns all workers, points them at the file.
 *   - `swap(newPath)` is called on Open Project — terminates every old
 *     worker and spawns a fresh set; in-flight requests are rejected
 *     with `Error('reader-swapped')` so callers can retry safely.
 *   - `terminate()` on app quit. After terminate, all `call()` resolve
 *     with `Error('reader-terminated')`.
 *
 * Crash recovery:
 *   - If a worker exits unexpectedly, that one slot auto-respawns up to
 *     MAX_RESTARTS within RESTART_WINDOW_MS. Other workers in the pool
 *     keep serving traffic.
 *   - In-flight requests on the crashed worker are rejected with
 *     `Error('reader-crashed')`. Callers fall back to the main-process
 *     ProjectDb (see `callReaderOrFallback`) so the UI stays alive.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.join(__dirname, 'db-reader-worker.js');

// 30 s default leaves headroom for SQLite read contention during the
// post-crawl recompute phase. Genuine worker hangs are still surfaced
// — just with a slightly longer detection window than before.
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

// Reader pool size. Four workers gives the typical UI workload (one
// long-running aggregate from the sidebar + visible-table chunk fetch
// + bottom-panel detail + crawl-engine background reads) a free slot
// for every concurrent request; bigger doesn't help because most UI
// reads are short and a dedicated worker per query becomes pure
// memory cost. Each worker keeps its own SQLite handle (~5 MB heap)
// and prepared-statement cache (~10 MB on a populated DB).
const POOL_SIZE = 4;

interface PendingRequest {
  workerIdx: number;
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  /** Caller already gave up (timeout) but the worker is still executing
   *  the query. The slot stays counted as busy until the reply lands. */
  abandoned?: boolean;
}

interface ResponseMessage {
  requestId: number;
  ok: boolean;
  result?: unknown;
  error?: string;
}

interface WorkerSlot {
  worker: Worker | null;
  pending: number;
  restartTimes: number[];
}

export class DbReaderPool {
  private slots: WorkerSlot[] = [];
  private dbPath: string | null = null;
  private freezeWatchdogSab: SharedArrayBuffer | null = null;
  private nextRequestId = 1;
  private pending = new Map<number, PendingRequest>();
  private rrCursor = 0;
  private terminated = false;

  /** Spawn (or respawn) the pool pointed at `dbPath`. Idempotent. */
  init(dbPath: string, freezeWatchdogSab: SharedArrayBuffer | null = null): void {
    if (this.terminated) {
      throw new Error('DbReaderPool: cannot init after terminate()');
    }
    this.freezeWatchdogSab = freezeWatchdogSab;
    if (this.dbPath === dbPath && this.slots.some((s) => s.worker !== null)) return;
    this.dbPath = dbPath;
    this.slots = Array.from({ length: POOL_SIZE }, () => ({
      worker: null,
      pending: 0,
      restartTimes: [],
    }));
    for (let i = 0; i < POOL_SIZE; i++) this.spawn(i);
  }

  /** Switch the pool to a different .seoproject file. */
  swap(newPath: string, freezeWatchdogSab: SharedArrayBuffer | null = null): void {
    if (freezeWatchdogSab !== null) this.freezeWatchdogSab = freezeWatchdogSab;
    if (this.dbPath === newPath && this.slots.some((s) => s.worker !== null)) return;
    this.failPendingWith('reader-swapped');
    this.dbPath = newPath;
    if (this.slots.length === 0) {
      this.slots = Array.from({ length: POOL_SIZE }, () => ({
        worker: null,
        pending: 0,
        restartTimes: [],
      }));
    }
    for (let i = 0; i < POOL_SIZE; i++) this.spawn(i);
  }

  /** Permanent shutdown — used on app quit. */
  async terminate(): Promise<void> {
    this.terminated = true;
    this.failPendingWith('reader-terminated');
    const workers = this.slots.map((s) => s.worker).filter((w): w is Worker => w !== null);
    for (const slot of this.slots) slot.worker = null;
    await Promise.all(
      workers.map((w) =>
        w.terminate().catch(() => undefined),
      ),
    );
  }

  /** True while at least one worker is up and ready. */
  isReady(): boolean {
    return !this.terminated && this.slots.some((s) => s.worker !== null);
  }

  /**
   * Dispatch a method call to the least-busy ready worker. Resolves
   * with the method's return value, rejects with an Error on worker
   * error / timeout / crash.
   */
  call<T>(method: string, args: unknown[] = []): Promise<T> {
    if (this.terminated) return Promise.reject(new Error('reader-terminated'));
    const slotIdx = this.pickSlot();
    if (slotIdx < 0) return Promise.reject(new Error('reader-not-initialised'));
    const slot = this.slots[slotIdx]!;
    const worker = slot.worker;
    if (!worker) return Promise.reject(new Error('reader-not-initialised'));
    const requestId = this.nextRequestId++;
    const timeoutMs = HEAVY_METHODS.has(method)
      ? HEAVY_REQUEST_TIMEOUT_MS
      : REQUEST_TIMEOUT_MS;
    slot.pending++;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        // A timeout frees the *caller*, not the worker: the query is
        // already running inside a synchronous SQLite call that cannot
        // be cancelled. Dropping the slot's pending count here made
        // `pickSlot` treat a worker that was minutes deep in a heavy
        // aggregate as idle and pile more work onto it, until every
        // worker in the pool was stacked with abandoned queries and no
        // UI read could get through. Keep the slot counted as busy and
        // release it when the reply actually arrives.
        const p = this.pending.get(requestId);
        if (p) p.abandoned = true;
        reject(new Error(`reader-timeout: ${method} > ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(requestId, {
        workerIdx: slotIdx,
        resolve: resolve as (v: unknown) => void,
        reject,
        timer,
      });
      worker.postMessage({ requestId, method, args });
    });
  }

  // ── private ──────────────────────────────────────────────────────────────

  /**
   * Pick the slot with the fewest pending requests. Ties are broken
   * by a round-robin cursor so identically-loaded workers don't all
   * receive their next call on the same slot.
   */
  private pickSlot(): number {
    let best = -1;
    let bestPending = Number.POSITIVE_INFINITY;
    // Start the scan from the rotating cursor so RR is honoured on ties.
    for (let i = 0; i < this.slots.length; i++) {
      const idx = (this.rrCursor + i) % this.slots.length;
      const s = this.slots[idx]!;
      if (!s.worker) continue;
      if (s.pending < bestPending) {
        best = idx;
        bestPending = s.pending;
      }
    }
    if (best >= 0) {
      this.rrCursor = (best + 1) % this.slots.length;
    }
    return best;
  }

  private spawn(slotIdx: number): void {
    if (!this.dbPath) return;
    const slot = this.slots[slotIdx];
    if (!slot) return;
    if (slot.worker) {
      const old = slot.worker;
      slot.worker = null;
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
        logger.log('error', 'db-reader', `worker[${slotIdx}] error: ${err.message}`);
      });
      w.on('exit', (code) => this.handleExit(slotIdx, code));
      slot.worker = w;
      slot.pending = 0;
      logger.log('info', 'db-reader', `worker[${slotIdx}] spawned for ${this.dbPath}`);
    } catch (err) {
      logger.log(
        'error',
        'db-reader',
        `worker[${slotIdx}] spawn failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      slot.worker = null;
    }
  }

  private handleResponse(msg: ResponseMessage): void {
    const pending = this.pending.get(msg.requestId);
    if (!pending) return;
    this.pending.delete(msg.requestId);
    clearTimeout(pending.timer);
    const slot = this.slots[pending.workerIdx];
    if (slot) slot.pending = Math.max(0, slot.pending - 1);
    // The caller was already rejected on timeout; this reply only
    // releases the slot.
    if (pending.abandoned) return;
    if (msg.ok) {
      pending.resolve(msg.result);
    } else {
      pending.reject(new Error(msg.error ?? 'reader-unknown-error'));
    }
  }

  private handleExit(slotIdx: number, code: number): void {
    const slot = this.slots[slotIdx];
    if (!slot) return;
    slot.worker = null;
    if (this.terminated) return;
    // Reject only this slot's in-flight requests.
    for (const [id, p] of this.pending) {
      if (p.workerIdx === slotIdx) {
        clearTimeout(p.timer);
        p.reject(new Error('reader-crashed'));
        this.pending.delete(id);
      }
    }
    slot.pending = 0;
    if (code === 0) return;
    const now = Date.now();
    slot.restartTimes = slot.restartTimes.filter((t) => now - t < RESTART_WINDOW_MS);
    if (slot.restartTimes.length >= MAX_RESTARTS) {
      logger.log(
        'error',
        'db-reader',
        `worker[${slotIdx}] crashed ${MAX_RESTARTS}× within ${RESTART_WINDOW_MS}ms — giving up on this slot.`,
      );
      return;
    }
    slot.restartTimes.push(now);
    logger.log(
      'warn',
      'db-reader',
      `worker[${slotIdx}] exited with code ${code}; respawning (${slot.restartTimes.length}/${MAX_RESTARTS})`,
    );
    this.spawn(slotIdx);
  }

  private failPendingWith(reason: string): void {
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error(reason));
    }
    this.pending.clear();
    for (const slot of this.slots) slot.pending = 0;
  }
}

// Process-wide singleton — the primary window's reader pool. Multi-window
// gives additional windows their own `DbReaderPool` instances.
export const dbReaderPool = new DbReaderPool();

/** Resolves which reader pool `callReaderOrFallback` should use. Defaults
 *  to the singleton; the desktop host injects a per-window resolver so a
 *  read IPC call hits the calling window's pool. */
let resolveReaderPool: () => DbReaderPool = () => dbReaderPool;

/** Inject a per-call reader-pool resolver (multi-window). */
export function setReaderPoolResolver(fn: () => DbReaderPool): void {
  resolveReaderPool = fn;
}

/**
 * Thin helper for IPC handlers: try the worker pool first, fall back
 * to the synchronous main-process DB on any worker error. The fallback
 * path keeps the UI working even if every worker is crashed/restarting,
 * at the cost of running on the main thread for that one query.
 *
 * HEAVY methods never fall back. If a heavy aggregate crashed or timed
 * out its reader worker, re-running the exact same query on the main
 * thread escalates a contained worker failure into a main-process
 * stall (multi-second aggregate blocking every IPC) or — for
 * OOM-class failures — a process crash, since Electron's V8 heap is
 * hard-capped at 4 GB per process. Callers get a rejection instead;
 * the sidebar keeps its previous counts and the next poll tick retries
 * against the (by then respawned) worker.
 */
export async function callReaderOrFallback<T>(
  method: string,
  args: unknown[],
  fallback: () => T | Promise<T>,
): Promise<T> {
  const pool = resolveReaderPool();
  const heavy = HEAVY_METHODS.has(method);
  if (!pool.isReady()) {
    if (heavy) {
      throw new Error(`reader-unavailable: '${method}' skips main-thread fallback`);
    }
    return fallback();
  }
  try {
    return await pool.call<T>(method, args);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (heavy) {
      logger.log(
        'warn',
        'db-reader',
        `'${method}' failed on reader pool (${msg}) — heavy query, NOT retrying on main thread.`,
      );
      throw err;
    }
    logger.log(
      'warn',
      'db-reader',
      `'${method}' fell back to main thread: ${msg}`,
    );
    return fallback();
  }
}
