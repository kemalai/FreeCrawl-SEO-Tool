import { parentPort, workerData } from 'node:worker_threads';
import { upgradeProjectFile } from '@freecrawl/db';
import type { UpgradeWorkerInit, UpgradeWorkerMessage } from './project-upgrade.js';

/**
 * One-shot worker: brings a project file's schema up to date, then exits.
 * See `upgradeProjectOffThread` for why this is not done on the main thread.
 */
const init = workerData as UpgradeWorkerInit;
const post = (msg: UpgradeWorkerMessage): void => parentPort?.postMessage(msg);

try {
  upgradeProjectFile(init.dbPath, {
    discardCrawlData: init.discardCrawlData,
    onProgress: (progress) => post({ type: 'progress', progress }),
  });
  post({ type: 'done' });
} catch (err) {
  post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
}
