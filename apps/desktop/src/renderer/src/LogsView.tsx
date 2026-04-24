import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
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

export function LogsView() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [minLevel, setMinLevel] = useState<LogLevel>('debug');
  const [filter, setFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Seed from the existing ring buffer, then stream new entries live.
  useEffect(() => {
    let cancelled = false;
    void window.freecrawl.logsGetAll().then((rows) => {
      if (!cancelled) setEntries(rows);
    });
    const off = window.freecrawl.onLogEntry((entry) => {
      setEntries((prev) => {
        const next = prev.concat(entry);
        // Cap UI memory at 5000 like the main buffer.
        if (next.length > 5000) next.splice(0, next.length - 5000);
        return next;
      });
    });
    return () => {
      cancelled = true;
      off();
    };
  }, []);

  useEffect(() => {
    if (!autoScroll) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries, autoScroll]);

  const minIdx = LEVEL_ORDER.indexOf(minLevel);
  const filterLower = filter.trim().toLowerCase();
  const visible = entries.filter((e) => {
    if (LEVEL_ORDER.indexOf(e.level) < minIdx) return false;
    if (filterLower === '') return true;
    return (
      e.message.toLowerCase().includes(filterLower) ||
      e.source.toLowerCase().includes(filterLower)
    );
  });

  async function clearAll() {
    await window.freecrawl.logsClear();
    setEntries([]);
  }

  async function copyAll() {
    const text = visible
      .map((e) => `${e.ts}  ${e.level.toUpperCase().padEnd(5)} [${e.source}] ${e.message}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback — write to a temp textarea. Usually only fails in very
      // locked-down renderer contexts; the copy-button is a nice-to-have.
    }
  }

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

      <div ref={listRef} className="flex-1 overflow-auto font-mono text-[11px]">
        {visible.length === 0 ? (
          <div className="p-6 text-center text-surface-500">No log entries.</div>
        ) : (
          <table className="w-full">
            <tbody>
              {visible.map((e) => (
                <tr key={e.id} className="border-b border-surface-900 align-top hover:bg-surface-900/50">
                  <td className="w-48 whitespace-nowrap py-1 pl-3 pr-2 text-surface-500">
                    {formatTs(e.ts)}
                  </td>
                  <td className="w-16 py-1 pr-2">
                    <span
                      className={clsx(
                        'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                        LEVEL_BADGE[e.level],
                      )}
                    >
                      {e.level}
                    </span>
                  </td>
                  <td className="w-28 py-1 pr-2 text-surface-400">{e.source}</td>
                  <td className={clsx('whitespace-pre-wrap py-1 pr-3', LEVEL_STYLES[e.level])}>
                    {e.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-surface-800 bg-surface-900/50 px-3 py-1.5 text-[11px] text-surface-500">
        <span>
          Showing <span className="font-mono text-surface-100">{visible.length}</span> /{' '}
          <span className="font-mono text-surface-100">{entries.length}</span> entries
        </span>
        <span className="ml-auto text-surface-600">
          Buffer keeps the last 5,000 entries — older ones are dropped.
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
