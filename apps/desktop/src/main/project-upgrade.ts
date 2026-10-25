import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectNeedsUpgrade, type MigrationProgress } from '@freecrawl/db';
import * as logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.join(__dirname, 'db-upgrade-worker.js');

export interface UpgradeWorkerInit {
  dbPath: string;
  discardCrawlData: boolean;
}

export type UpgradeWorkerMessage =
  | { type: 'progress'; progress: MigrationProgress }
  | { type: 'done' }
  | { type: 'error'; message: string };

/**
 * Applies a project file's pending migrations on a worker thread, before
 * the main process opens it.
 *
 * Opening a `ProjectDb` migrates on the thread that opens it, and the
 * desktop app opens its writer connection on the main thread. A large
 * project saved by an older version can take seconds there (migration 104
 * re-indexes every link: ~5 s on 3M links), and for that long the window
 * cannot be moved or redrawn and Windows marks it "Not responding". Done
 * here first, the main thread stays free, `onProgress` can drive a dialog,
 * and the `new ProjectDb` afterwards finds nothing left to do.
 *
 * Resolves without doing anything when the file is already current. A
 * migration that fails rejects with its error, before the caller has
 * touched the project it has open. If the worker itself cannot run, it
 * resolves anyway and the main-thread open migrates as it always has.
 */
export function upgradeProjectOffThread(
  dbPath: string,
  opts: { discardCrawlData?: boolean; onProgress?: (progress: MigrationProgress) => void } = {},
): Promise<void> {
  if (!projectNeedsUpgrade(dbPath)) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const fallBack = (reason: string): void => {
      if (settled) return;
      settled = true;
      logger.log(
        'warn',
        'main',
        `Project upgrade worker unavailable (${reason}) — migrating on the main thread.`,
      );
      resolve();
    };
    let worker: Worker;
    try {
      const workerData: UpgradeWorkerInit = {
        dbPath,
        discardCrawlData: opts.discardCrawlData === true,
      };
      worker = new Worker(WORKER_PATH, { workerData });
    } catch (err) {
      fallBack(err instanceof Error ? err.message : String(err));
      return;
    }
    const started = Date.now();
    worker.on('message', (msg: UpgradeWorkerMessage) => {
      if (settled) return;
      if (msg.type === 'progress') {
        opts.onProgress?.(msg.progress);
      } else if (msg.type === 'done') {
        settled = true;
        logger.log(
          'info',
          'main',
          `Project schema upgraded off-thread in ${Date.now() - started} ms: ${path.basename(dbPath)}`,
        );
        resolve();
      } else {
        settled = true;
        reject(new Error(msg.message));
      }
    });
    worker.on('error', (err) => fallBack(err.message));
    worker.on('exit', (code) => fallBack(`exited with code ${code}`));
  });
}
