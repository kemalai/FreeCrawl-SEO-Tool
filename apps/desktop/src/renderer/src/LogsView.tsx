import {
  memo,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { LogEntry, LogLevel } from '@freecrawl/shared-types';

const LEVEL_ORDER: LogLevel[] = ['debug', 'info', 'warn', 'error'];

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: 'text-surface-400',
  info: 'text-surface-100',
  warn: 'text-amber-300',
  error: 'text-red-300',
};

const LEVEL_BADGE: Record<LogLevel, string> = {
  debug: 'bg-surface-700 text-surface-300',
  info: 'bg-emerald-900/40 text-emerald-300',
  warn: 'bg-amber-900/40 text-amber-300',
  error: 'bg-red-900/40 text-red-300',
};

const ROW_HEIGHT = 22;
/** UI ring buffer cap. 200 entries × ~200 bytes = ~40 KB heap, small
 * enough that the major-GC pause when the cap rolls over is invisible.
 * Full history lives on disk (Help → Open Logs Folder). */
const MAX_ENTRIES = 200;
/** Maximum live setState frequency. 250 ms = 4 fps render — well under
 * a 60 Hz window-drag refresh, so the OS compositor always has free
 * main-thread time to repaint the window frame smoothly. */
const FLUSH_INTERVAL_MS = 250;

interface RowProps {
  entry: LogEntry;
  start: number;
  size: number;
}

/** Memoised row with a strict comparator. Reference-stable LogEntry +
 * exact-equal start/size means a row already in the DOM is never
 * reconciled when the parent re-renders due to a new entry being
 * appended. The default React.memo comparator achieves the same here
 * because all three props are primitives or stable references, but
 * we keep an explicit comparator so accidental prop renaming during
 * future refactors doesn't silently regress this hot path. */
const Row = memo(
  function Row({ entry, start, size }: RowProps) {
  return (
    <div
      className="absolute left-0 right-0 flex items-start gap-2 border-b border-surface-900 px-3"
      style={{
        transform: `translateY(${start}px)`,
        height: size,
        contain: 'layout paint style',
      }}
    >
      <span className="w-32 shrink-0 whitespace-nowrap pt-1 text-surface-500">
        {formatTs(entry.ts)}
      </span>
      <span
        className={clsx(
          'mt-1 inline-flex h-[14px] w-12 shrink-0 items-center justify-center rounded text-[10px] font-semibold uppercase',
          LEVEL_BADGE[entry.level],
        )}
      >
        {entry.level}
      </span>
      <span className="w-24 shrink-0 truncate pt-1 text-surface-400">{entry.source}</span>
      <span
        className={clsx('min-w-0 flex-1 truncate pt-1 pr-3', LEVEL_STYLES[entry.level])}
        title={entry.message}
      >
        {entry.message}
      </span>
    </div>
  );
  },
  (prev, next) =>
    prev.entry === next.entry && prev.start === next.start && prev.size === next.size,
);

export function LogsView() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [minLevel, setMinLevel] = useState<LogLevel>('info');
  const [filter, setFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  // Pending batches — main process already coalesces entries on a
  // 100 ms window, so the renderer's only job is to apply the batch.
  // Drag/resize busy signal still pauses application so the OS
  // compositor never competes with React reconciliation.
  const pendingRef = useRef<LogEntry[]>([]);
  const isBusyRef = useRef(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(autoScroll);
  autoScrollRef.current = autoScroll;

  useEffect(() => {
    let cancelled = false;
    void window.freecrawl.logsGetAll().then((rows) => {
      if (!cancelled) {
        setEntries(rows.length > MAX_ENTRIES ? rows.slice(rows.length - MAX_ENTRIES) : rows);
      }
    });

    const flush = (): void => {
      if (isBusyRef.current) return; // window is being dragged/resized — defer
      if (pendingRef.current.length === 0) return;
      const incoming = pendingRef.current;
      pendingRef.current = [];
      // startTransition lets the compositor + input handlers preempt
      // this update, so a concurrent drag/scroll/click stays smooth even
      // if the entries list is large.
      startTransition(() => {
        setEntries((prev) => {
          if (prev.length + incoming.length > MAX_ENTRIES) {
            return prev.concat(incoming).slice(-MAX_ENTRIES);
          }
          return prev.concat(incoming);
        });
      });
    };

    const handleBatch = (batch: LogEntry[]): void => {
      pendingRef.current.push(...batch);
      // Cap the pending pile to ~2× the live tail — under sustained
      // 200 logs/s the array is naturally tiny since flush runs every
      // 250 ms, but a long busy/drag pause shouldn't grow it unbounded.
      if (pendingRef.current.length > MAX_ENTRIES * 2) {
        pendingRef.current = pendingRef.current.slice(-MAX_ENTRIES);
      }
    };
    const offBatch = window.freecrawl.onLogsBatch(handleBatch);
    const offBusy = window.freecrawl.onLogsBusy((busy) => {
      isBusyRef.current = busy;
    });

    const interval = window.setInterval(flush, FLUSH_INTERVAL_MS);
    return () => {
      cancelled = true;
      offBatch();
      offBusy();
      window.clearInterval(interval);
    };
  }, []);

  // useDeferredValue lets React keep the filter input snappy: the
  // expensive filter-pass on `entries` is computed against the
  // deferred (potentially stale) value, while typing in the input
  // updates `filter` immediately. Without this, every keystroke
  // re-filters 200 entries synchronously and the input feels mushy.
  const deferredFilter = useDeferredValue(filter);
  const deferredMinLevel = useDeferredValue(minLevel);

  const visible = useMemo(() => {
    const minIdx = LEVEL_ORDER.indexOf(deferredMinLevel);
    const filterLower = deferredFilter.trim().toLowerCase();
    if (minIdx === 0 && filterLower === '') return entries;
    return entries.filter((e) => {
      if (LEVEL_ORDER.indexOf(e.level) < minIdx) return false;
      if (filterLower === '') return true;
      return (
        e.message.toLowerCase().includes(filterLower) ||
        e.source.toLowerCase().includes(filterLower)
      );
    });
  }, [entries, deferredMinLevel, deferredFilter]);

  const rowVirtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => scrollerRef.current,
    estimateSize: () => ROW_HEIGHT,
    // Smaller overscan = fewer mounted DOM rows. The Logs window is a
    // tail viewer, not a deep-scroll experience — 3 rows of overscan is
    // plenty for smooth scroll while keeping mount count near minimum.
    overscan: 3,
    getItemKey: (i) => visible[i]?.id ?? i,
  });

  // Auto-scroll runs once per `entries` reference change. Using
  // `visible.length` as the trigger broke once the buffer reached its
  // cap (length plateaus at MAX_ENTRIES so the effect never fires
  // again). `entries` reference is fresh on every successful flush, so
  // the effect runs exactly when new content actually arrives.
  useEffect(() => {
    if (!autoScrollRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries]);

  async function clearAll() {
    await window.freecrawl.logsClear();
    setEntries([]);
    pendingRef.current = [];
  }

  async function copyAll() {
    const text = visible
      .map((e) => `${e.ts}  ${e.level.toUpperCase().padEnd(5)} [${e.source}] ${e.message}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard may be unavailable in locked-down renderer contexts */
    }
  }

  const totalHeight = rowVirtualizer.getTotalSize();
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="flex h-screen flex-col bg-surface-950 text-surface-100">
      <div className="flex items-center gap-2 border-b border-surface-800 bg-surface-900 px-3 py-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-surface-400">
          Logs
        </div>
        <div className="mx-2 h-5 w-px bg-surface-800" />
        <label className="flex items-center gap-1.5 text-[11px] text-surface-400">
          Level
          <select
            className="rounded border border-surface-700 bg-surface-900 px-2 py-1 text-[11px] text-surface-100"
            value={minLevel}
            onChange={(e) => setMinLevel(e.target.value as LogLevel)}
          >
            {LEVEL_ORDER.map((l) => (
              <option key={l} value={l}>
                {l}+
              </option>
            ))}
          </select>
        </label>
        <input
          className="flex-1 rounded border border-surface-700 bg-surface-900 px-2 py-1 text-[11px]"
          placeholder="Filter messages / sources…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          spellCheck={false}
        />
        <label className="flex items-center gap-1 text-[11px] text-surface-400">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
          />
          Auto-scroll
        </label>
        <button
          className="rounded border border-surface-700 px-2 py-1 text-[11px] hover:bg-surface-800"
          onClick={copyAll}
          title="Copy visible entries to clipboard"
        >
          Copy
        </button>
        <button
          className="rounded border border-red-800/60 px-2 py-1 text-[11px] text-red-300 hover:bg-red-900/30"
          onClick={clearAll}
        >
          Clear
        </button>
      </div>

      <div
        ref={scrollerRef}
        className="flex-1 overflow-auto font-mono text-[11px]"
        style={{ contain: 'strict' }}
      >
        {visible.length === 0 ? (
          <div className="p-6 text-center text-surface-500">No log entries.</div>
        ) : (
          <div
            style={{
              height: totalHeight,
              position: 'relative',
              width: '100%',
              contain: 'layout paint style',
            }}
          >
            {virtualItems.map((vi) => {
              const e = visible[vi.index];
              if (!e) return null;
              return <Row key={vi.key} entry={e} start={vi.start} size={vi.size} />;
            })}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-surface-800 bg-surface-900/50 px-3 py-1.5 text-[11px] text-surface-500">
        <span>
          Showing <span className="font-mono text-surface-100">{visible.length}</span> /{' '}
          <span className="font-mono text-surface-100">{entries.length}</span> entries
        </span>
        <span className="ml-auto text-surface-600">
          Live tail keeps the last {MAX_ENTRIES.toLocaleString()} entries — full history persisted to disk (Help → Open Logs Folder).
        </span>
      </div>
    </div>
  );
}

function formatTs(iso: string): string {
  // "2026-04-24T22:41:38.123Z" -> "22:41:38.123"
  const m = /T(\d{2}:\d{2}:\d{2}(?:\.\d+)?)/.exec(iso);
  return m ? (m[1] ?? iso) : iso;
}
