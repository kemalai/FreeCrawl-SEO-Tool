import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FreezeWatchdogSharedState,
  type CounterPatch,
} from './freeze-watchdog-shared.js';
import * as logger from './logger.js';

/**
 * Main-process façade for the freeze watchdog.
 *
 * Owns the SharedArrayBuffer and the worker thread. Exposes a tiny
 * imperative API the rest of the main process (and the crawler via
 * dependency injection) calls during normal operation:
 *
 *   - `setMainOp("crawl:fetch:" + url)` whenever a top-level operation
 *     starts on the main thread, so the watchdog has context if the
 *     thread blocks immediately afterwards.
 *   - `updateCounters({ crawled, pending })` for the snapshot fields.
 *   - `reportRendererLag(ms)` from the IPC handler that already
 *     receives renderer lag samples.
 *
 * The watchdog itself does the heartbeat tick on a 100 ms timer
 * inside `init()` — callers don't have to remember to ping.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.join(__dirname, 'freeze-watchdog-worker.js');

const MAIN_HEARTBEAT_INTERVAL_MS = 100;

class FreezeWatchdog {
  private worker: Worker | null = null;
  private state: FreezeWatchdogSharedState | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private terminated = false;

  /**
   * Spawn the watchdog worker, allocate the SharedArrayBuffer, and
   * start the main-thread heartbeat ticker. Idempotent.
   */
  init(debugFilePath: string): void {
    if (this.terminated) return;
    if (this.worker) return;
    let state: FreezeWatchdogSharedState;
    try {
      state = FreezeWatchdogSharedState.create();
    } catch (err) {
      logger.log(
        'warn',
        'main',
        `freeze-watchdog: SharedArrayBuffer allocation failed (${
          err instanceof Error ? err.message : String(err)
        }) — diagnostics disabled.`,
      );
      return;
    }
    try {
      this.worker = new Worker(WORKER_PATH, {
        workerData: {
          sab: state.sab,
          debugFilePath,
        },
      });
    } catch (err) {
      logger.log(
        'warn',
        'main',
        `freeze-watchdog worker spawn failed: ${
          err instanceof Error ? err.message : String(err)
        } — diagnostics disabled.`,
      );
      return;
    }
    this.state = state;
    this.worker.on('error', (err) => {
      logger.log('warn', 'main', `freeze-watchdog worker error: ${err.message}`);
    });
    this.worker.on('exit', (code) => {
      this.worker = null;
      if (!this.terminated && code !== 0) {
        logger.log(
          'warn',
          'main',
          `freeze-watchdog worker exited unexpectedly (code=${code})`,
        );
      }
    });
    // Heartbeat tick — independent of the rest of the app's setIntervals
    // so a crashed timer elsewhere doesn't silently disable detection.
    this.heartbeatTimer = setInterval(() => {
      this.state?.tickMainHeartbeat();
    }, MAIN_HEARTBEAT_INTERVAL_MS);
    logger.log('info', 'main', `freeze-watchdog started → ${debugFilePath}`);
  }

  /** Pass-through to the shared buffer so workers can attach. */
  get sharedBuffer(): SharedArrayBuffer | null {
    return this.state?.sab ?? null;
  }

  setMainOp(op: string): void {
    this.state?.setMainOp(op);
  }

  reportRendererLag(lagMs: number): void {
    this.state?.reportRendererLag(lagMs);
  }

  updateCounters(c: CounterPatch): void {
    this.state?.updateCounters(c);
  }

  /** Graceful shutdown — flushes the heartbeat timer and signals the
   * worker to exit cleanly so it can write a `[SHUTDOWN]` line. */
  async terminate(): Promise<void> {
    this.terminated = true;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.worker) {
      const w = this.worker;
      this.worker = null;
      try {
        w.postMessage({ type: 'shutdown' });
        // Give the worker up to 250 ms to write its shutdown line
        // before we forcibly terminate.
        await new Promise<void>((resolve) => setTimeout(resolve, 250));
        await w.terminate();
      } catch {
        /* already exited */
      }
    }
  }
}

export const freezeWatchdog = new FreezeWatchdog();
