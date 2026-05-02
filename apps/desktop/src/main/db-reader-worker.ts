import { parentPort, workerData } from 'node:worker_threads';
import { ProjectDb } from '@freecrawl/db';
import { FreezeWatchdogSharedState } from './freeze-watchdog-shared.js';

/**
 * Read-only SQLite worker.
 *
 * Owns its own `ProjectDb` connection in shared read-only mode against
 * the same `.seoproject` file as the main process. Because both
 * connections agree on WAL journal mode (the writer set it during
 * migrations), this reader observes every committed write made by the
 * main process — without contending for SQLite's write lock.
 *
 * Protocol:
 *   main → worker:    `{ requestId, method, args }`
 *   worker → main:    `{ requestId, ok: true,  result }`
 *                  or `{ requestId, ok: false, error: string }`
 *
 * The worker is fully request-driven; it doesn't poll or push events.
 * Crash semantics: any uncaught exception inside a method handler is
 * caught at the dispatch level, sent back as `{ ok: false }`, and the
 * worker keeps serving subsequent requests. Truly fatal errors (DB
 * file vanished, OOM) trigger `process.exit(1)` and the pool restarts.
 */

if (!parentPort) {
  // Worker file imported outside a Worker context — bail loudly.
  throw new Error('db-reader-worker: must be loaded via worker_threads');
}

interface InitData {
  dbPath: string;
  freezeWatchdogSab?: SharedArrayBuffer | null;
}

const init = workerData as InitData;
if (!init?.dbPath) {
  throw new Error('db-reader-worker: workerData.dbPath required');
}

const db = new ProjectDb(init.dbPath, { readOnly: true });

// Freeze-watchdog plumbing. The reader thread publishes a heartbeat
// every 250 ms and updates `readerOp` to the currently-dispatching
// method name so the watchdog can spot a stuck SQLite query and
// surface "[STALL:READER ... op=getUrlDetail]" in debug.txt.
const watchdog = init.freezeWatchdogSab
  ? new FreezeWatchdogSharedState(init.freezeWatchdogSab)
  : null;
let watchdogHeartbeatTimer: NodeJS.Timeout | null = null;
if (watchdog) {
  watchdog.tickReaderHeartbeat();
  watchdog.setReaderOp('idle');
  watchdogHeartbeatTimer = setInterval(() => {
    watchdog.tickReaderHeartbeat();
  }, 250);
}

interface RequestMessage {
  requestId: number;
  method: string;
  args: unknown[];
}

// Whitelist of read methods the worker is allowed to dispatch. Stops
// a malicious or buggy main-side caller from poking at write methods
// (which would throw at SQLite anyway, but defence in depth).
const ALLOWED_METHODS = new Set<string>([
  'queryUrls',
  'queryImages',
  'queryBrokenLinks',
  'getOverviewCounts',
  'getOverviewCountsAsync',
  'getSummary',
  'getUrlDetail',
  'getUrlSource',
  'getUrlHeaders',
  'pageImagesDetailed',
  'topAnchorTexts',
  'topUrlsBy',
  'externalDomainHealth',
  'analyticsCoverage',
  'linkPositionBreakdown',
  'imageWeightPerPage',
  'serverHeaderBreakdown',
  'inlinksHistogram',
  'wordCountHistogram',
  'urlLengthHistogram',
  'wordCountPerDirectory',
  'sitemapOrphans',
  'getPagesPerDirectory',
  'getStatusCodeHistogram',
  'getDepthHistogram',
  'getResponseTimeHistogram',
  'countUrls',
  'countSitemapUrls',
]);

parentPort.on('message', async (msg: RequestMessage) => {
  if (!msg || typeof msg.requestId !== 'number') return;
  const { requestId, method, args } = msg;
  watchdog?.setReaderOp(method);
  try {
    if (!ALLOWED_METHODS.has(method)) {
      throw new Error(`db-reader-worker: method '${method}' is not whitelisted`);
    }
    const fn = (db as unknown as Record<string, unknown>)[method];
    if (typeof fn !== 'function') {
      throw new Error(`db-reader-worker: method '${method}' missing on ProjectDb`);
    }
    const out = (fn as (...a: unknown[]) => unknown).apply(db, args ?? []);
    // Methods may be sync or async — await uniformly.
    const result = out instanceof Promise ? await out : out;
    parentPort!.postMessage({ requestId, ok: true, result });
  } catch (err) {
    parentPort!.postMessage({
      requestId,
      ok: false,
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    });
  } finally {
    watchdog?.setReaderOp('idle');
  }
});

// Defensive shutdown: if the parent disappears, exit cleanly so the OS
// reaps the worker rather than leaving a zombie holding the SQLite
// file handle (which on Windows would block the project from being
// reopened until full process exit).
parentPort.on('close', () => {
  if (watchdogHeartbeatTimer) clearInterval(watchdogHeartbeatTimer);
  try {
    db.close();
  } catch {
    /* already closed */
  }
  process.exit(0);
});
