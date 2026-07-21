/**
 * JS-heap headroom guard for large single-shot materialisations.
 *
 * Electron enables V8 pointer compression, which hard-caps every
 * process's JS heap at 4 GB regardless of machine RAM — and unlike
 * plain Node, Buffer/ArrayBuffer data counts against the same cage.
 * When V8 can't allocate it doesn't throw a catchable error; it aborts
 * the whole process (`FatalProcessOutOfMemory`). So any code path that
 * is about to build a large in-memory artefact (an XLSX workbook, a
 * whole-file encryption buffer) must check headroom BEFORE allocating
 * and fail with a normal, user-visible error instead of a crash.
 *
 * The check is advisory — `estimatedBytes` is a rough upper bound, and
 * a healthy RESERVE is kept free for GC churn and concurrent
 * allocations. Callers on genuinely unbounded paths should prefer
 * streaming (see tabular-export's CSV writer) and use this guard only
 * where the format itself forces full materialisation.
 */

import v8 from 'node:v8';

/** Slack kept free below the heap limit — GC needs breathing room, and
 *  other subsystems (IPC buffers, SQLite rows in flight) allocate
 *  concurrently with the guarded operation. */
const RESERVE_BYTES = 256 * 1024 * 1024;

const MB = 1024 * 1024;

/** Bytes currently available before the hard heap ceiling. */
export function heapHeadroomBytes(): number {
  const s = v8.getHeapStatistics();
  return Math.max(0, s.heap_size_limit - s.used_heap_size);
}

/**
 * Throw a descriptive Error when `estimatedBytes` more allocation
 * would push the heap within RESERVE of its hard limit. No-op when
 * there is room. `label` names the operation in the error message the
 * user sees (e.g. "XLSX export").
 */
export function ensureHeapHeadroom(label: string, estimatedBytes: number): void {
  const available = heapHeadroomBytes();
  if (estimatedBytes + RESERVE_BYTES <= available) return;
  throw new Error(
    `${label}: not enough memory headroom — needs ~${Math.ceil(estimatedBytes / MB)} MB ` +
      `but only ${Math.floor(available / MB)} MB of JS heap remains ` +
      `(hard limit ${Math.round(v8.getHeapStatistics().heap_size_limit / MB)} MB). ` +
      'Try a streaming format (CSV/JSON) or export a smaller selection.',
  );
}
