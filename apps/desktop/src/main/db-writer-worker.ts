import { parentPort, workerData } from 'node:worker_threads';
import { ProjectDb } from '@freecrawl/db';
import { FreezeWatchdogSharedState } from './freeze-watchdog-shared.js';

/**
 * Writer worker — owns a SQLite writer connection and runs every
 * write the desktop main process used to run synchronously on its
 * own event loop.
 *
 * Why a dedicated thread:
 *   - `node:sqlite` is synchronous; each `.run()` blocks the JS
 *     thread until SQLite returns. With 20 concurrent fetches all
 *     inserting per-URL data, the main thread used to block ~250 ms
 *     per second on writes alone — visible as IPC stalls.
 *   - Moving the writer into a worker frees the main loop for IPC
 *     dispatch and queue scheduling. The worker still serialises
 *     writes one at a time (SQLite's single-writer model is
 *     unchanged), but main never feels it.
 *
 *   Two writer connections (this worker + the main process's
 *   ProjectDb instance, which is still used for some methods that
 *   weren't worth refactoring) share the same DB file. WAL +
 *   `busy_timeout` makes SQLite serialise the two cleanly — at the
 *   small risk of a SQLITE_BUSY error if both fight for the lock
 *   for longer than the timeout, which we treat as best-effort and
 *   surface to the caller.
 *
 * Protocol:
 *   main → worker:    `{ requestId, method, args }`
 *   worker → main:    `{ requestId, ok: true,  result }`
 *                  or `{ requestId, ok: false, error: string }`
 */

if (!parentPort) {
  throw new Error('db-writer-worker: must be loaded via worker_threads');
}

interface InitData {
  dbPath: string;
  freezeWatchdogSab?: SharedArrayBuffer | null;
}

const init = workerData as InitData;
if (!init?.dbPath) {
  throw new Error('db-writer-worker: workerData.dbPath required');
}

const db = new ProjectDb(init.dbPath);
// `busy_timeout` is set inside ProjectDb's constructor — no per-worker
// override needed. We rely on it to serialise this writer connection
// with the main process's writer instead of throwing SQLITE_BUSY when
// both happen to want the lock at the same moment.

const watchdog = init.freezeWatchdogSab
  ? new FreezeWatchdogSharedState(init.freezeWatchdogSab)
  : null;

// Publish into the writer's own slot and keep its own heartbeat. This
// thread used to write the *reader* op string while never ticking any
// heartbeat, which meant a stalled reader pool got logged with whatever
// write happened to run last pinned to it, and a genuinely stuck writer
// produced no evidence at all.
const WATCHDOG_HEARTBEAT_INTERVAL_MS = 100;
if (watchdog) {
  watchdog.tickWriterHeartbeat();
  watchdog.setWriterOp('idle');
  setInterval(() => {
    watchdog.tickWriterHeartbeat();
  }, WATCHDOG_HEARTBEAT_INTERVAL_MS).unref();
}

/**
 * Requests interleave: the handler below is async, and a yielding pass
 * (`recomputeUrlsIssuesYielding`) hands the loop back between
 * definitions, so a per-URL write can run — and finish — while the pass
 * is still open. Its `finally` used to overwrite the op slot with
 * `idle`, and the pass's next multi-second statement then reached
 * debug.txt as an `idle → idle` writer stall: real time lost, wrong
 * label. The slot now names the oldest request still open (the one a
 * long statement belongs to) and only reads `idle` once none is.
 */
const inFlight = new Map<number, string>();
function publishOp(): void {
  if (!watchdog) return;
  const oldest = inFlight.values().next();
  watchdog.setWriterOp(oldest.done ? 'idle' : oldest.value);
}

interface RequestMessage {
  requestId: number;
  method: string;
  args: unknown[];
}

// Whitelist mirrors ProjectDb's write surface. Reading methods stay
// off this list — those go to the read-only worker.
const ALLOWED_METHODS = new Set<string>([
  'writeFetchedUrl',
  'upsertUrl',
  'insertLinks',
  'insertImages',
  'setUrlHeaders',
  'setUrlSource',
  'setUrlRenderedBody',
  'setUrlScreenshotPaths',
  'setUrlLcpCandidate',
  'setUrlMobileUsability',
  'setUrlA11y',
  'setSitemapUrls',
  'setHostCert',
  'setImageSize',
  'applyProbeWrites',
  'setMeta',
  'updateExternalProbe',
  'recomputeInlinks',
  'recomputeRedirectChains',
  'recomputeLinkScore',
  'recomputeHreflangAnalysis',
  'recomputeHreflangInconsistent',
  'recomputeDuplicateClusters',
  'recomputeBoilerplateCoverage',
  'recomputePaginationSequence',
  'recomputeUrlsIssues',
  'recomputeUrlsIssuesYielding',
  'checkpointQueue',
  'clearQueueCheckpoint',
  'walCheckpoint',
  'optimize',
  'markUrlForRecrawl',
  'markUrlsForRecrawl',
  'deleteUrl',
  'deleteUrls',
  'reset',
  'deleteByDomain',
]);

parentPort.on('message', async (msg: RequestMessage) => {
  if (!msg || typeof msg.requestId !== 'number') return;
  const { requestId, method, args } = msg;
  inFlight.set(requestId, method);
  publishOp();
  try {
    if (!ALLOWED_METHODS.has(method)) {
      throw new Error(`db-writer-worker: method '${method}' is not whitelisted`);
    }
    const fn = (db as unknown as Record<string, unknown>)[method];
    if (typeof fn !== 'function') {
      throw new Error(`db-writer-worker: method '${method}' missing on ProjectDb`);
    }
    let result: unknown;
    if (method === 'recomputeUrlsIssuesYielding' && watchdog) {
      // Publish per-definition progress into the watchdog op slot so
      // the pool's slow-call warner (and debug.txt) can distinguish
      // "long pass, still advancing" from a genuinely wedged worker.
      const defs = (args?.[0] ?? []) as ReadonlyArray<readonly [string, string]>;
      result = await db.recomputeUrlsIssuesYielding(defs, (done, total) => {
        inFlight.set(requestId, `recomputeUrlsIssuesYielding ${done}/${total}`);
        publishOp();
      });
    } else {
      const out = (fn as (...a: unknown[]) => unknown).apply(db, args ?? []);
      result = out instanceof Promise ? await out : out;
    }
    parentPort!.postMessage({ requestId, ok: true, result });
  } catch (err) {
    parentPort!.postMessage({
      requestId,
      ok: false,
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    });
  } finally {
    inFlight.delete(requestId);
    publishOp();
  }
});

parentPort.on('close', () => {
  try {
    db.close();
  } catch {
    /* already closed */
  }
  process.exit(0);
});
