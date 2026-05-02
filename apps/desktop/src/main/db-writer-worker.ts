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
  'setSitemapUrls',
  'setHostCert',
  'setImageSize',
  'setMeta',
  'updateExternalProbe',
  'recomputeInlinks',
  'recomputeRedirectChains',
  'recomputeHreflangAnalysis',
  'recomputeHreflangInconsistent',
  'recomputeDuplicateClusters',
  'recomputePaginationSequence',
  'recomputeUrlsIssues',
  'recomputeUrlsIssuesYielding',
  'checkpointQueue',
  'clearQueueCheckpoint',
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
  if (watchdog) watchdog.setReaderOp('writer:' + method);
  try {
    if (!ALLOWED_METHODS.has(method)) {
      throw new Error(`db-writer-worker: method '${method}' is not whitelisted`);
    }
    const fn = (db as unknown as Record<string, unknown>)[method];
    if (typeof fn !== 'function') {
      throw new Error(`db-writer-worker: method '${method}' missing on ProjectDb`);
    }
    const out = (fn as (...a: unknown[]) => unknown).apply(db, args ?? []);
    const result = out instanceof Promise ? await out : out;
    parentPort!.postMessage({ requestId, ok: true, result });
  } catch (err) {
    parentPort!.postMessage({
      requestId,
      ok: false,
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    });
  } finally {
    if (watchdog) watchdog.setReaderOp('idle');
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
