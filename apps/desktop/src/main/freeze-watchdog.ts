import { Worker } from 'node:worker_threads';
import path from 'node:path';
import v8 from 'node:v8';
import { fileURLToPath } from 'node:url';
import {
  FreezeWatchdogSharedState,
  type CounterPatch,
  type HostStats,
} from './freeze-watchdog-shared.js';
import { toMb } from './freeze-watchdog-report.js';
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
/** Sample memory + writer queue every N heartbeat ticks (1 s). */
const HOST_STATS_EVERY_TICKS = 10;
/** Reset the loop-lag high-water mark every N ticks (5 s) — one
 *  heartbeat log line's worth, so a spike is not reported forever. */
const LOOP_LAG_WINDOW_TICKS = 50;

class FreezeWatchdog {
  private worker: Worker | null = null;
  private state: FreezeWatchdogSharedState | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private terminated = false;
  private statsProvider: (() => Partial<HostStats>) | null = null;

  /**
   * Spawn the watchdog worker, allocate the SharedArrayBuffer, and
   * start the main-thread heartbeat ticker. Idempotent.
   */
  init(debugFilePath: string, envLine = ''): void {
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
          envLine,
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
    let expectedAt = Date.now() + MAIN_HEARTBEAT_INTERVAL_MS;
    let maxLag = 0;
    let tick = 0;
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      // How late this tick fired is how long the loop was busy. The
      // watchdog's own gap detector only speaks up past 500 ms; this
      // catches the 80–400 ms stutters that make the UI feel sticky
      // without ever tripping it.
      maxLag = Math.max(maxLag, now - expectedAt);
      expectedAt = now + MAIN_HEARTBEAT_INTERVAL_MS;
      this.state?.tickMainHeartbeat();
      tick++;
      if (tick % HOST_STATS_EVERY_TICKS === 0) {
        let extra: Partial<HostStats> = {};
        try {
          extra = this.statsProvider?.() ?? {};
        } catch {
          /* a stats provider must never break the heartbeat */
        }
        this.state?.updateHostStats({
          rssMb: toMb(process.memoryUsage.rss()),
          heapMb: toMb(v8.getHeapStatistics().used_heap_size),
          mainLoopLagMs: Math.max(0, maxLag),
          ...extra,
        });
      }
      if (tick % LOOP_LAG_WINDOW_TICKS === 0) maxLag = 0;
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

  /** Source of the per-second writer-queue figures in the heartbeat. */
  setStatsProvider(fn: (() => Partial<HostStats>) | null): void {
    this.statsProvider = fn;
  }

  /**
   * Append one annotation line to debug.txt — `[CRAWL] start …`,
   * `[STORAGE] mode=ram`, a mirrored `[ERROR] …`. Goes through the
   * worker so the file has a single writer and the note lands in
   * sequence with the heartbeats around it. Dropped silently when the
   * watchdog never started; diagnostics must not become a failure mode.
   */
  note(line: string): void {
    if (!this.worker) return;
    try {
      this.worker.postMessage({ type: 'note', line });
    } catch {
      /* worker gone — nothing to record into */
    }
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
