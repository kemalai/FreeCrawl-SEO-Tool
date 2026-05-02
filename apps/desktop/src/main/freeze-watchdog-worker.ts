import { parentPort, workerData } from 'node:worker_threads';
import * as fs from 'node:fs';
import { FreezeWatchdogSharedState } from './freeze-watchdog-shared.js';

/**
 * Freeze-watchdog worker.
 *
 * Lives in its own `worker_thread`, so it has an independent V8
 * isolate and OS thread. Even when the Electron main thread, the
 * db-reader thread, or the renderer is fully blocked, this worker
 * keeps running and writes evidence to `debug.txt`.
 *
 * Protocol:
 *   - The main process owns a `SharedArrayBuffer` that this worker
 *     reads. There is no two-way IPC between main and watchdog
 *     during normal operation — IPC would itself stall when main
 *     stalls, defeating the purpose.
 *   - We poll the shared state every CHECK_INTERVAL_MS and append
 *     stall events to `debug.txt` synchronously.
 *
 * The worker writes nothing else — no console output, no events
 * back to main — so its only side effect is the debug file.
 */

const CHECK_INTERVAL_MS = 250;
const STALL_THRESHOLD_MAIN_MS = 500;
const STALL_THRESHOLD_READER_MS = 1000;
const STALL_THRESHOLD_RENDERER_LAG_MS = 500;
const STALL_THRESHOLD_RENDERER_SILENCE_MS = 1500;
const HEARTBEAT_LOG_INTERVAL_MS = 5000;

interface InitData {
  sab: SharedArrayBuffer;
  debugFilePath: string;
}

if (!parentPort) {
  throw new Error('freeze-watchdog-worker: must be loaded via worker_threads');
}

const init = workerData as InitData;
if (!init?.sab || !init?.debugFilePath) {
  throw new Error('freeze-watchdog-worker: workerData must include sab + debugFilePath');
}

const state = new FreezeWatchdogSharedState(init.sab);
const debugPath = init.debugFilePath;

// Silently swallow append failures — if the disk is full or the
// file is locked by AV, we can't recover, and writing would just
// thrash retries. The watchdog stays useful for the next stall.
function appendLine(line: string): void {
  try {
    fs.appendFileSync(debugPath, line + '\n');
  } catch {
    /* best-effort */
  }
}

function isoNow(): string {
  return new Date().toISOString();
}

function sanitizeOp(op: string): string {
  // Keep newlines/tabs out of the log line — they'd break grep.
  if (!op) return '';
  return op.replace(/[\r\n\t]+/g, ' ').slice(0, 240);
}

interface StallTracker {
  active: boolean;
  startTs: number;
  startOp: string;
}

const mainStall: StallTracker = { active: false, startTs: 0, startOp: '' };
const readerStall: StallTracker = { active: false, startTs: 0, startOp: '' };
const rendererStall: StallTracker = { active: false, startTs: 0, startOp: '' };

let lastHeartbeatLogTs = 0;
let bootLogged = false;

function check(): void {
  const now = Date.now();
  const counters = state.readCounters();
  const mainHb = state.readMainHeartbeatMs();
  const readerHb = state.readReaderHeartbeatMs();
  const rendererTs = state.readRendererReportTsMs();
  const rendererLag = state.readRendererLagMs();
  const mainOp = sanitizeOp(state.readMainOp());
  const readerOp = sanitizeOp(state.readReaderOp());

  const mainGap = mainHb > 0 ? now - mainHb : 0;
  const readerGap = readerHb > 0 ? now - readerHb : 0;
  const rendererSilence = rendererTs > 0 ? now - rendererTs : 0;

  // ── Main thread stall ──
  if (mainHb > 0 && mainGap > STALL_THRESHOLD_MAIN_MS) {
    if (!mainStall.active) {
      mainStall.active = true;
      mainStall.startTs = now;
      mainStall.startOp = mainOp;
      appendLine(
        `${isoNow()} [STALL:MAIN start gap=${mainGap}ms] op="${mainOp || '<unknown>'}" ` +
          `crawled=${counters.crawled} discovered=${counters.discovered} ` +
          `pending=${counters.pending} failed=${counters.failed}`,
      );
    }
  } else if (mainStall.active) {
    const dur = now - mainStall.startTs;
    appendLine(
      `${isoNow()} [STALL:MAIN end after ${dur}ms] startOp="${mainStall.startOp}" endOp="${mainOp}"`,
    );
    mainStall.active = false;
  }

  // ── DB reader thread stall ──
  if (readerHb > 0 && readerGap > STALL_THRESHOLD_READER_MS) {
    if (!readerStall.active) {
      readerStall.active = true;
      readerStall.startTs = now;
      readerStall.startOp = readerOp;
      appendLine(
        `${isoNow()} [STALL:READER start gap=${readerGap}ms] op="${readerOp || '<unknown>'}"`,
      );
    }
  } else if (readerStall.active) {
    const dur = now - readerStall.startTs;
    appendLine(
      `${isoNow()} [STALL:READER end after ${dur}ms] startOp="${readerStall.startOp}" endOp="${readerOp}"`,
    );
    readerStall.active = false;
  }

  // ── Renderer stall ──
  // We treat both an explicit high-lag report AND a long silence
  // (renderer hasn't pinged back) as stall signals. The silence
  // case catches a frozen renderer that can't even fire its
  // setTimeout-based lag probe.
  let rendererStalled = false;
  let rendererReason = '';
  if (rendererLag > STALL_THRESHOLD_RENDERER_LAG_MS) {
    rendererStalled = true;
    rendererReason = `lag=${rendererLag}ms`;
  } else if (rendererTs > 0 && rendererSilence > STALL_THRESHOLD_RENDERER_SILENCE_MS) {
    rendererStalled = true;
    rendererReason = `silence=${rendererSilence}ms`;
  }
  if (rendererStalled) {
    if (!rendererStall.active) {
      rendererStall.active = true;
      rendererStall.startTs = now;
      rendererStall.startOp = mainOp;
      appendLine(
        `${isoNow()} [STALL:RENDERER start ${rendererReason}] last_main_op="${mainOp || '<unknown>'}" ` +
          `crawled=${counters.crawled} pending=${counters.pending}`,
      );
    }
  } else if (rendererStall.active) {
    const dur = now - rendererStall.startTs;
    appendLine(
      `${isoNow()} [STALL:RENDERER end after ${dur}ms] last_lag=${rendererLag}ms`,
    );
    rendererStall.active = false;
  }

  // ── Periodic heartbeat (so the file shows the app is alive even
  //    when nothing has stalled) ──
  if (!bootLogged) {
    bootLogged = true;
    appendLine(
      `${isoNow()} [BOOT] freeze-watchdog started ` +
        `thresholds: main>${STALL_THRESHOLD_MAIN_MS}ms reader>${STALL_THRESHOLD_READER_MS}ms ` +
        `renderer_lag>${STALL_THRESHOLD_RENDERER_LAG_MS}ms renderer_silence>${STALL_THRESHOLD_RENDERER_SILENCE_MS}ms`,
    );
  }
  if (now - lastHeartbeatLogTs >= HEARTBEAT_LOG_INTERVAL_MS) {
    lastHeartbeatLogTs = now;
    appendLine(
      `${isoNow()} [HEARTBEAT] main_op="${mainOp}" reader_op="${readerOp}" ` +
        `crawled=${counters.crawled} discovered=${counters.discovered} ` +
        `pending=${counters.pending} renderer_lag=${rendererLag}ms`,
    );
  }
}

setInterval(check, CHECK_INTERVAL_MS);

// Accept a graceful-shutdown ping from the parent. We don't strictly
// need it (the worker exits with the parent), but logging the close
// lets the user see "watchdog stopped" instead of a silent truncation.
parentPort.on('message', (msg: { type?: string }) => {
  if (msg?.type === 'shutdown') {
    appendLine(`${isoNow()} [SHUTDOWN] watchdog received shutdown signal`);
    process.exit(0);
  }
});
