import { parentPort, workerData } from 'node:worker_threads';
import * as fs from 'node:fs';
import { FreezeWatchdogSharedState } from './freeze-watchdog-shared.js';
import { PhaseTracker, previousSessionVerdict } from './freeze-watchdog-report.js';

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
const STALL_THRESHOLD_WRITER_MS = 1000;
const STALL_THRESHOLD_RENDERER_LAG_MS = 500;
const STALL_THRESHOLD_RENDERER_SILENCE_MS = 1500;
/**
 * How long a stall must persist past detection before it is written to
 * the file.
 *
 * Detection thresholds are deliberately twitchy so the recorded gap and
 * op string come from the real onset of a freeze. Writing at that same
 * sensitivity is what made the log unreadable: with a 250 ms sample
 * interval and a 500 ms main threshold, ordinary GC pauses tripped the
 * detector constantly and over a third of the `STALL:MAIN` lines in a
 * real capture were `end after 250ms` — noise that buried the
 * multi-second freezes worth investigating. Detection is unchanged;
 * only the reporting waits for the stall to prove itself.
 */
const STALL_REPORT_FLOOR_MS = 1000;
const HEARTBEAT_LOG_INTERVAL_MS = 5000;

interface InitData {
  sab: SharedArrayBuffer;
  debugFilePath: string;
  /** One-line host description (app / Electron / OS / CPU / RAM). */
  envLine?: string;
}

/** Roll the file over past this size — keeps one predecessor. */
const DEBUG_MAX_BYTES = 25 * 1024 * 1024;

if (!parentPort) {
  throw new Error('freeze-watchdog-worker: must be loaded via worker_threads');
}

const init = workerData as InitData;
if (!init?.sab || !init?.debugFilePath) {
  throw new Error('freeze-watchdog-worker: workerData must include sab + debugFilePath');
}

const state = new FreezeWatchdogSharedState(init.sab);
const debugPath = init.debugFilePath;

/** Last ~4 KB of the existing file — enough for its final line. */
function readTail(): string {
  try {
    const fd = fs.openSync(debugPath, 'r');
    try {
      const size = fs.fstatSync(fd).size;
      const len = Math.min(size, 4096);
      if (len === 0) return '';
      const buf = Buffer.alloc(len);
      fs.readSync(fd, buf, 0, len, size - len);
      return buf.toString('utf8');
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return '';
  }
}

// Read before rotating: the verdict is about the file we are about to
// push aside. Rotation keeps one predecessor so a report that spans the
// boundary is still recoverable.
const prevSessionLine = previousSessionVerdict(readTail());
try {
  if (fs.statSync(debugPath).size > DEBUG_MAX_BYTES) {
    fs.renameSync(debugPath, debugPath.replace(/\.txt$/i, '') + '.1.txt');
  }
} catch {
  /* no file yet, or locked — append below either way */
}

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

/** Main-process notes ([CRAWL] / [STORAGE] / mirrored log lines) — same
 *  sanitising, longer cap: a mirrored error is already compacted. */
function sanitizeNote(line: string): string {
  return line.replace(/[\r\n\t]+/g, ' ').slice(0, 600);
}

interface StallTracker {
  /** Gap exceeded the threshold and we're timing it. */
  active: boolean;
  /** The `start` line has been written — so an `end` line is owed. */
  reported: boolean;
  startTs: number;
  startOp: string;
  /** `gap=612ms` / `silence=1709ms`, captured at onset. */
  detail: string;
  /** `crawled` at onset — the end line reports how far it moved. */
  startCrawled: number;
}

const newTracker = (): StallTracker => ({
  active: false,
  reported: false,
  startTs: 0,
  startOp: '',
  detail: '',
  startCrawled: 0,
});

const mainStall = newTracker();
const readerStall = newTracker();
const writerStall = newTracker();
const rendererStall = newTracker();

/**
 * Shared start/report/end bookkeeping. `onStart` and `onEnd` build the
 * log lines; neither runs unless the stall outlives
 * `STALL_REPORT_FLOOR_MS`, so a blip costs nothing but a few field
 * writes.
 */
function trackStall(
  t: StallTracker,
  stalled: boolean,
  now: number,
  op: string,
  detail: string,
  crawledNow: number,
  onStart: (t: StallTracker) => string,
  onEnd: (t: StallTracker, durationMs: number) => string,
): void {
  if (stalled) {
    if (!t.active) {
      t.active = true;
      t.reported = false;
      t.startTs = now;
      t.startOp = op;
      t.detail = detail;
      t.startCrawled = crawledNow;
    } else if (!t.reported && now - t.startTs >= STALL_REPORT_FLOOR_MS) {
      t.reported = true;
      appendLine(onStart(t));
    }
    return;
  }
  if (!t.active) return;
  if (t.reported) appendLine(onEnd(t, now - t.startTs));
  t.active = false;
  t.reported = false;
}

let lastHeartbeatLogTs = 0;
let bootLogged = false;
const phases = new PhaseTracker();

function check(): void {
  const now = Date.now();
  const counters = state.readCounters();
  const mainHb = state.readMainHeartbeatMs();
  const readerHb = state.readReaderHeartbeatMs();
  const writerHb = state.readWriterHeartbeatMs();
  const rendererTs = state.readRendererReportTsMs();
  const rendererLag = state.readRendererLagMs();
  const mainOp = sanitizeOp(state.readMainOp());
  const readerOp = sanitizeOp(state.readReaderOp());
  const writerOp = sanitizeOp(state.readWriterOp());
  const host = state.readHostStats();
  // Signed delta of the crawled counter across a stall: "+0" over two
  // minutes is a wedge, "+400" is a slow patch the crawl worked through.
  const crawledDelta = (t: StallTracker): string => {
    const d = counters.crawled - t.startCrawled;
    return `${d >= 0 ? '+' : ''}${d}`;
  };

  const mainGap = mainHb > 0 ? now - mainHb : 0;
  const readerGap = readerHb > 0 ? now - readerHb : 0;
  const writerGap = writerHb > 0 ? now - writerHb : 0;
  const rendererSilence = rendererTs > 0 ? now - rendererTs : 0;

  // ── Main thread stall ──
  trackStall(
    mainStall,
    mainHb > 0 && mainGap > STALL_THRESHOLD_MAIN_MS,
    now,
    mainOp,
    `gap=${mainGap}ms`,
    counters.crawled,
    (t) =>
      `${isoNow()} [STALL:MAIN start ${t.detail}] op="${t.startOp || '<unknown>'}" ` +
      `crawled=${counters.crawled} discovered=${counters.discovered} ` +
      `pending=${counters.pending} failed=${counters.failed}`,
    (t, dur) =>
      `${isoNow()} [STALL:MAIN end after ${dur}ms] startOp="${t.startOp}" endOp="${mainOp}" ` +
      `crawled_delta=${crawledDelta(t)} writer_op="${writerOp}" rss=${host.rssMb}MB heap=${host.heapMb}MB`,
  );

  // ── DB reader pool stall ──
  // Every reader worker ticks the same heartbeat, so this only fires
  // when *none* of them got a turn — i.e. the whole pool is blocked.
  trackStall(
    readerStall,
    readerHb > 0 && readerGap > STALL_THRESHOLD_READER_MS,
    now,
    readerOp,
    `gap=${readerGap}ms`,
    counters.crawled,
    (t) => `${isoNow()} [STALL:READER start ${t.detail}] op="${t.startOp || '<unknown>'}"`,
    (t, dur) =>
      `${isoNow()} [STALL:READER end after ${dur}ms] startOp="${t.startOp}" endOp="${readerOp}"`,
  );

  // ── DB writer thread stall ──
  // Its own heartbeat and its own op slot: a blocked writer holds up
  // every per-URL page write behind it, which surfaces as a crawl that
  // has stopped advancing, and that is worth telling apart from a
  // blocked reader pool (which only affects what the UI can display).
  trackStall(
    writerStall,
    writerHb > 0 && writerGap > STALL_THRESHOLD_WRITER_MS,
    now,
    writerOp,
    `gap=${writerGap}ms`,
    counters.crawled,
    (t) =>
      `${isoNow()} [STALL:WRITER start ${t.detail}] op="${t.startOp || '<unknown>'}" ` +
      `crawled=${counters.crawled} pending=${counters.pending}`,
    (t, dur) =>
      `${isoNow()} [STALL:WRITER end after ${dur}ms] startOp="${t.startOp}" endOp="${writerOp}" ` +
      `crawled_delta=${crawledDelta(t)} writer_q=${host.writerPending} main_op="${mainOp}"`,
  );

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
  trackStall(
    rendererStall,
    rendererStalled,
    now,
    mainOp,
    rendererReason,
    counters.crawled,
    (t) =>
      `${isoNow()} [STALL:RENDERER start ${t.detail}] last_main_op="${t.startOp || '<unknown>'}" ` +
      `crawled=${counters.crawled} pending=${counters.pending}`,
    (_t, dur) => `${isoNow()} [STALL:RENDERER end after ${dur}ms] last_lag=${rendererLag}ms`,
  );

  // ── Periodic heartbeat (so the file shows the app is alive even
  //    when nothing has stalled) ──
  if (!bootLogged) {
    bootLogged = true;
    appendLine(
      `${isoNow()} [BOOT] freeze-watchdog started ` +
        `thresholds: main>${STALL_THRESHOLD_MAIN_MS}ms reader>${STALL_THRESHOLD_READER_MS}ms ` +
        `writer>${STALL_THRESHOLD_WRITER_MS}ms ` +
        `renderer_lag>${STALL_THRESHOLD_RENDERER_LAG_MS}ms renderer_silence>${STALL_THRESHOLD_RENDERER_SILENCE_MS}ms ` +
        `report_floor=${STALL_REPORT_FLOOR_MS}ms`,
    );
    if (init.envLine) appendLine(`${isoNow()} [ENV] ${sanitizeNote(init.envLine)}`);
    if (prevSessionLine) appendLine(`${isoNow()} ${prevSessionLine}`);
  }
  const phaseLine = phases.observe(mainOp, now);
  if (phaseLine) appendLine(`${isoNow()} ${phaseLine}`);
  if (now - lastHeartbeatLogTs >= HEARTBEAT_LOG_INTERVAL_MS) {
    lastHeartbeatLogTs = now;
    appendLine(
      `${isoNow()} [HEARTBEAT] main_op="${mainOp}" reader_op="${readerOp}" ` +
        `writer_op="${writerOp}" ` +
        `crawled=${counters.crawled} discovered=${counters.discovered} ` +
        `pending=${counters.pending} failed=${counters.failed} renderer_lag=${rendererLag}ms ` +
        `rss=${host.rssMb}MB heap=${host.heapMb}MB loop_lag=${host.mainLoopLagMs}ms ` +
        `writer_q=${host.writerPending} writer_oldest=${host.writerOldestMs}ms`,
    );
  }
}

setInterval(check, CHECK_INTERVAL_MS);

// Accept a graceful-shutdown ping from the parent. We don't strictly
// need it (the worker exits with the parent), but logging the close
// lets the user see "watchdog stopped" instead of a silent truncation.
parentPort.on('message', (msg: { type?: string; line?: unknown }) => {
  // Main-process annotations — crawl start/stop, storage mode, mirrored
  // error lines. They queue behind a frozen main thread and land here in
  // order once it resumes, timestamped at write so the delay is visible.
  if (msg?.type === 'note' && typeof msg.line === 'string') {
    appendLine(`${isoNow()} ${sanitizeNote(msg.line)}`);
    return;
  }
  if (msg?.type === 'shutdown') {
    appendLine(`${isoNow()} [SHUTDOWN] watchdog received shutdown signal`);
    process.exit(0);
  }
});
