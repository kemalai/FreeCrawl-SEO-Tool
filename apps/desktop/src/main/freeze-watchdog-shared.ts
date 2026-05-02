/**
 * Shared SharedArrayBuffer layout for the freeze watchdog.
 *
 * Three execution contexts read/write to the same SAB:
 *   1. The Electron main process (the writer for `mainHB`, counters,
 *      `mainOp`, and rendererLag forwarded from IPC).
 *   2. The db-reader worker thread (writes its own `readerHB` and
 *      `readerOp`).
 *   3. The freeze-watchdog worker thread (reads everything; writes
 *      nothing — its job is purely observational).
 *
 * All scalar reads/writes use `Atomics.{load,store}` so the watchdog
 * is guaranteed to see the latest value even if the writer is mid-
 * function. The op-string regions are written non-atomically (a 256-
 * byte memcpy isn't atomic on any CPU) — we accept torn reads there
 * because the op string is best-effort context, not a correctness
 * boundary; the heartbeat timestamp is what tells us whether a
 * thread is alive, and that IS atomic.
 *
 * Layout (1024 bytes total, generous for future fields):
 *   [0..32)    BigInt64Array(4)  — heartbeat timestamps + spare
 *      [0]    main heartbeat (ms since epoch)
 *      [1]    db-reader heartbeat
 *      [2]    last renderer lag-report timestamp
 *      [3]    spare
 *   [32..96)   Int32Array(16)    — counters + op-string lengths
 *      [0]    renderer lag (ms)
 *      [1]    crawled
 *      [2]    discovered
 *      [3]    pending
 *      [4]    failed
 *      [5]    main op string byte length
 *      [6]    reader op string byte length
 *      [7..15] spare
 *   [96..)     Uint8Array        — op string bytes (UTF-8)
 *      [0..256)    main op
 *      [256..512)  reader op
 */

const I64_BYTE_OFFSET = 0;
const I64_LEN = 4;
const I32_BYTE_OFFSET = 32;
const I32_LEN = 16;
const U8_BYTE_OFFSET = 96;

const MAIN_OP_OFFSET_IN_U8 = 0;
const READER_OP_OFFSET_IN_U8 = 256;
const OP_MAX_BYTES = 255;

const I64_IDX_MAIN_HB = 0;
const I64_IDX_READER_HB = 1;
const I64_IDX_RENDERER_REPORT_TS = 2;

const I32_IDX_RENDERER_LAG = 0;
const I32_IDX_CRAWLED = 1;
const I32_IDX_DISCOVERED = 2;
const I32_IDX_PENDING = 3;
const I32_IDX_FAILED = 4;
const I32_IDX_MAIN_OP_LEN = 5;
const I32_IDX_READER_OP_LEN = 6;

export const SAB_BYTE_LENGTH = 1024;

export interface CounterPatch {
  crawled?: number;
  discovered?: number;
  pending?: number;
  failed?: number;
}

export interface CounterSnapshot {
  crawled: number;
  discovered: number;
  pending: number;
  failed: number;
}

/**
 * Wraps a `SharedArrayBuffer` with typed accessors. Construct one in
 * the main process via `FreezeWatchdogSharedState.create()`, then pass
 * `state.sab` to each worker via `workerData` so all sides share the
 * same memory.
 */
export class FreezeWatchdogSharedState {
  private readonly i64: BigInt64Array;
  private readonly i32: Int32Array;
  private readonly u8: Uint8Array;

  static create(): FreezeWatchdogSharedState {
    return new FreezeWatchdogSharedState(new SharedArrayBuffer(SAB_BYTE_LENGTH));
  }

  constructor(public readonly sab: SharedArrayBuffer) {
    this.i64 = new BigInt64Array(sab, I64_BYTE_OFFSET, I64_LEN);
    this.i32 = new Int32Array(sab, I32_BYTE_OFFSET, I32_LEN);
    this.u8 = new Uint8Array(sab, U8_BYTE_OFFSET, sab.byteLength - U8_BYTE_OFFSET);
  }

  // ── Writers ───────────────────────────────────────────────────────

  tickMainHeartbeat(): void {
    Atomics.store(this.i64, I64_IDX_MAIN_HB, BigInt(Date.now()));
  }

  tickReaderHeartbeat(): void {
    Atomics.store(this.i64, I64_IDX_READER_HB, BigInt(Date.now()));
  }

  reportRendererLag(lagMs: number): void {
    Atomics.store(this.i32, I32_IDX_RENDERER_LAG, lagMs | 0);
    Atomics.store(this.i64, I64_IDX_RENDERER_REPORT_TS, BigInt(Date.now()));
  }

  setMainOp(op: string): void {
    this.writeOpString(op, MAIN_OP_OFFSET_IN_U8, I32_IDX_MAIN_OP_LEN);
  }

  setReaderOp(op: string): void {
    this.writeOpString(op, READER_OP_OFFSET_IN_U8, I32_IDX_READER_OP_LEN);
  }

  updateCounters(c: CounterPatch): void {
    if (c.crawled !== undefined) {
      Atomics.store(this.i32, I32_IDX_CRAWLED, c.crawled | 0);
    }
    if (c.discovered !== undefined) {
      Atomics.store(this.i32, I32_IDX_DISCOVERED, c.discovered | 0);
    }
    if (c.pending !== undefined) {
      Atomics.store(this.i32, I32_IDX_PENDING, c.pending | 0);
    }
    if (c.failed !== undefined) {
      Atomics.store(this.i32, I32_IDX_FAILED, c.failed | 0);
    }
  }

  // ── Readers (used by the watchdog worker) ─────────────────────────

  readMainHeartbeatMs(): number {
    return Number(Atomics.load(this.i64, I64_IDX_MAIN_HB));
  }

  readReaderHeartbeatMs(): number {
    return Number(Atomics.load(this.i64, I64_IDX_READER_HB));
  }

  readRendererReportTsMs(): number {
    return Number(Atomics.load(this.i64, I64_IDX_RENDERER_REPORT_TS));
  }

  readRendererLagMs(): number {
    return Atomics.load(this.i32, I32_IDX_RENDERER_LAG);
  }

  readCounters(): CounterSnapshot {
    return {
      crawled: Atomics.load(this.i32, I32_IDX_CRAWLED),
      discovered: Atomics.load(this.i32, I32_IDX_DISCOVERED),
      pending: Atomics.load(this.i32, I32_IDX_PENDING),
      failed: Atomics.load(this.i32, I32_IDX_FAILED),
    };
  }

  readMainOp(): string {
    return this.readOpString(MAIN_OP_OFFSET_IN_U8, I32_IDX_MAIN_OP_LEN);
  }

  readReaderOp(): string {
    return this.readOpString(READER_OP_OFFSET_IN_U8, I32_IDX_READER_OP_LEN);
  }

  // ── Internals ─────────────────────────────────────────────────────

  private writeOpString(op: string, offset: number, lenIdx: number): void {
    const bytes = new TextEncoder().encode(op);
    const len = Math.min(bytes.length, OP_MAX_BYTES);
    // Order matters: write the bytes first, then the length last.
    // A reader that races could see the new length before the bytes
    // land, so reading old bytes with new length would corrupt; the
    // reverse (old length, partial new bytes) is safe — the reader
    // reads only `len` bytes from the head, ignoring the tail.
    this.u8.set(bytes.subarray(0, len), offset);
    Atomics.store(this.i32, lenIdx, len);
  }

  private readOpString(offset: number, lenIdx: number): string {
    const len = Atomics.load(this.i32, lenIdx);
    if (len <= 0) return '';
    const slice = this.u8.slice(offset, offset + Math.min(len, OP_MAX_BYTES));
    try {
      return new TextDecoder('utf-8', { fatal: false }).decode(slice);
    } catch {
      return '';
    }
  }
}
