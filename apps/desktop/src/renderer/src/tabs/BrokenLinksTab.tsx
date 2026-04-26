import { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import type { BrokenLinkRow } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';
import { InfoTip } from '../components/InfoTip.js';

const ROW_HEIGHT = 24;
const HEADER_HEIGHT = 28;
const ROW_NUM_WIDTH = 56;
const STATUS_BAR_HEIGHT = 22;
const POLL_MS = 1500;
const PAGE_SIZE = 5000;

export function BrokenLinksTab() {
  const activeCategory = useAppStore((s) => s.activeCategory);
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [rows, setRows] = useState<BrokenLinkRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // The sidebar toggles between "all", "internal-only", and "external-only"
  // via activeCategory; everything else stays "all".
  const internal: 'all' | 'internal' | 'external' =
    activeCategory === 'issues:broken-links-internal'
      ? 'internal'
      : activeCategory === 'issues:broken-links-external'
        ? 'external'
        : 'all';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await window.freecrawl.brokenLinksQuery({
        limit: PAGE_SIZE,
        offset: 0,
        search: search || undefined,
        internal,
      });
      if (cancelled) return;
      setRows(res.rows);
      setTotal(res.total);
    };
    void load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [search, internal, dataVersion]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 30,
    getItemKey: (index) => {
      const r = rows[index];
      return r ? `${r.fromUrl}|${r.toUrl}|${index}` : `idx-${index}`;
    },
  });

  const columns: {
    key: string;
    label: string;
    width: number;
    align?: 'right';
    info?: string;
    example?: string;
  }[] = [
    {
      key: 'fromUrl',
      label: 'Source URL',
      width: 400,
      info: 'Page that contains the broken link.',
      example: 'https://example.com/blog/post-1',
    },
    {
      key: 'fromStatus',
      label: 'Source Status',
      width: 110,
      align: 'right',
      info: 'HTTP status of the source page itself. Usually 200; if non-2xx the broken link may be inherited.',
      example: '200',
    },
    {
      key: 'toUrl',
      label: 'Target URL',
      width: 400,
      info: 'The URL that fails to resolve (4xx/5xx/network error).',
      example: 'https://other.com/missing-page',
    },
    {
      key: 'toStatus',
      label: 'Target Status',
      width: 110,
      align: 'right',
      info: 'HTTP status returned by the target. 0 = network failure (DNS, TLS, timeout).',
      example: '404',
    },
    {
      key: 'anchor',
      label: 'Anchor',
      width: 240,
      info: 'Anchor text of the broken link as rendered in the source page.',
      example: 'Read the full article →',
    },
    {
      key: 'isInternal',
      label: 'Type',
      width: 80,
      info: 'Whether the broken target is on the same site (internal) or a different host (external).',
      example: 'internal / external',
    },
  ];
  const totalWidth = ROW_NUM_WIDTH + columns.reduce((n, c) => n + c.width, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-surface-800 bg-surface-900/30 px-3 py-1.5">
        <input
          className="input w-96"
          placeholder="Search source / target…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          spellCheck={false}
        />
        {internal !== 'all' && (
          <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
            {internal === 'internal' ? 'Internal only' : 'External only'}
          </span>
        )}
        <div className="ml-auto text-[11px] text-surface-500">
          <span className="font-mono text-surface-200">{total.toLocaleString()}</span> broken links
          <span className="ml-2 text-surface-600">({rows.length.toLocaleString()} loaded)</span>
        </div>
      </div>

      <div ref={scrollRef} className="relative flex-1 select-none overflow-auto">
        <div style={{ minWidth: totalWidth, width: '100%' }}>
          <div
            className="sticky top-0 z-10 flex bg-surface-900 text-[11px]"
            style={{ minWidth: totalWidth, width: '100%', height: HEADER_HEIGHT }}
          >
            <div
              className="flex items-center justify-end border-b border-r border-surface-800 px-2 font-medium text-surface-400"
              style={{
                width: ROW_NUM_WIDTH,
                minWidth: ROW_NUM_WIDTH,
                flex: `0 0 ${ROW_NUM_WIDTH}px`,
              }}
            >
              Row
            </div>
            {columns.map((c) => (
              <div
                key={c.key}
                className="flex items-center gap-1 border-b border-r border-surface-800 pl-2 pr-3 font-medium text-surface-300"
                style={{ width: c.width, minWidth: c.width, flex: `0 0 ${c.width}px` }}
              >
                <span className={clsx('truncate', c.align === 'right' && 'ml-auto')}>
                  {c.label}
                </span>
                {(c.info || c.example) && (
                  <span className="shrink-0">
                    <InfoTip info={c.info} example={c.example} />
                  </span>
                )}
              </div>
            ))}
            <div className="flex-1 border-b border-surface-800" />
          </div>

          <div
            className="relative"
            style={{
              height: virtualizer.getTotalSize(),
              minWidth: totalWidth,
              width: '100%',
            }}
          >
            {virtualizer.getVirtualItems().map((vi) => {
              const row = rows[vi.index];
              if (!row) return null;
              return (
                <div
                  key={vi.key}
                  data-index={vi.index}
                  className="absolute left-0 top-0 flex items-center border-b border-surface-900 text-[11px] hover:bg-surface-900/60"
                  style={{
                    transform: `translateY(${vi.start}px)`,
                    height: ROW_HEIGHT,
                    minWidth: totalWidth,
                    width: '100%',
                  }}
                >
                  <div
                    className="flex items-center justify-end overflow-hidden border-r border-surface-900 px-2 font-mono tabular-nums text-surface-500"
                    style={{
                      width: ROW_NUM_WIDTH,
                      minWidth: ROW_NUM_WIDTH,
                      flex: `0 0 ${ROW_NUM_WIDTH}px`,
                    }}
                  >
                    {vi.index + 1}
                  </div>
                  <div
                    className="overflow-hidden px-2"
                    style={{
                      width: columns[0]!.width,
                      minWidth: columns[0]!.width,
                      flex: `0 0 ${columns[0]!.width}px`,
                    }}
                  >
                    <span className="block truncate font-mono text-surface-100" title={row.fromUrl}>
                      {row.fromUrl}
                    </span>
                  </div>
                  <div
                    className="overflow-hidden px-2 text-right"
                    style={{
                      width: columns[1]!.width,
                      minWidth: columns[1]!.width,
                      flex: `0 0 ${columns[1]!.width}px`,
                    }}
                  >
                    <span
                      className={clsx(
                        'inline-block rounded px-1.5 font-mono text-[10px]',
                        statusClasses(row.fromStatusCode),
                      )}
                    >
                      {row.fromStatusCode ?? '—'}
                    </span>
                  </div>
                  <div
                    className="overflow-hidden px-2"
                    style={{
                      width: columns[2]!.width,
                      minWidth: columns[2]!.width,
                      flex: `0 0 ${columns[2]!.width}px`,
                    }}
                  >
                    <span className="block truncate font-mono text-surface-100" title={row.toUrl}>
                      {row.toUrl}
                    </span>
                  </div>
                  <div
                    className="overflow-hidden px-2 text-right"
                    style={{
                      width: columns[3]!.width,
                      minWidth: columns[3]!.width,
                      flex: `0 0 ${columns[3]!.width}px`,
                    }}
                  >
                    <span
                      className={clsx(
                        'inline-block rounded px-1.5 font-mono text-[10px]',
                        statusClasses(row.toStatusCode),
                      )}
                    >
                      {row.toStatusCode ?? '—'}
                    </span>
                  </div>
                  <div
                    className="overflow-hidden px-2"
                    style={{
                      width: columns[4]!.width,
                      minWidth: columns[4]!.width,
                      flex: `0 0 ${columns[4]!.width}px`,
                    }}
                  >
                    <span
                      className="block truncate text-surface-200"
                      title={row.anchor ?? undefined}
                    >
                      {row.anchor ?? <span className="text-surface-700">—</span>}
                    </span>
                  </div>
                  <div
                    className="overflow-hidden px-2"
                    style={{
                      width: columns[5]!.width,
                      minWidth: columns[5]!.width,
                      flex: `0 0 ${columns[5]!.width}px`,
                    }}
                  >
                    <span
                      className={clsx(
                        'text-[10px]',
                        row.isInternal ? 'text-surface-300' : 'text-surface-500',
                      )}
                    >
                      {row.isInternal ? 'internal' : 'external'}
                    </span>
                  </div>
                  <div className="flex-1" />
                </div>
              );
            })}
          </div>
        </div>

        {total === 0 && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ top: HEADER_HEIGHT }}
          >
            <div className="max-w-md text-center">
              <div className="mb-1 text-sm font-semibold text-surface-300">No broken links</div>
              <div className="text-xs text-surface-500">
                Every link in the crawl resolves to a healthy response.
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className="flex shrink-0 items-center justify-end gap-4 border-t border-surface-800 bg-surface-900/60 px-3 text-[11px] text-surface-400"
        style={{ height: STATUS_BAR_HEIGHT }}
      >
        <span>
          Total:{' '}
          <span className="font-mono tabular-nums text-surface-200">
            {total.toLocaleString()}
          </span>
        </span>
      </div>
    </div>
  );
}

function statusClasses(code: number | null): string {
  if (code === null) return 'bg-surface-800 text-surface-400';
  if (code >= 400 && code < 500) return 'bg-orange-900/60 text-orange-300';
  if (code >= 500) return 'bg-red-900/60 text-red-300';
  if (code >= 300 && code < 400) return 'bg-amber-900/60 text-amber-300';
  if (code >= 200 && code < 300) return 'bg-emerald-900/60 text-emerald-300';
  return 'bg-surface-800 text-surface-400';
}
