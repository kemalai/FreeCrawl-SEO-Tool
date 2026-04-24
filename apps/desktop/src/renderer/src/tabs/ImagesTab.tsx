import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import type { ImageRow } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

const ROW_HEIGHT = 24;
const HEADER_HEIGHT = 28;
const ROW_NUM_WIDTH = 56;
const STATUS_BAR_HEIGHT = 22;
const POLL_MS = 1500;
const PAGE_SIZE = 5000;

type SortKey = 'src' | 'alt' | 'width' | 'height' | 'occurrences';

export function ImagesTab() {
  const activeCategory = useAppStore((s) => s.activeCategory);
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [rows, setRows] = useState<ImageRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('occurrences');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Missing-alt filter is driven by the Overview sidebar's Issues section —
  // clicking "Images Missing Alt" switches category, which we watch here.
  const missingAltOnly = activeCategory === 'issues:image-missing-alt';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await window.freecrawl.imagesQuery({
        limit: PAGE_SIZE,
        offset: 0,
        search: search || undefined,
        missingAltOnly,
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
  }, [search, missingAltOnly, dataVersion]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      let cmp: number;
      if (av === null && bv === null) cmp = 0;
      else if (av === null) cmp = 1;
      else if (bv === null) cmp = -1;
      else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortBy, sortDir]);

  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 30,
    getItemKey: (index) => sorted[index]?.id ?? index,
  });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const columns: { key: SortKey; label: string; width: number; align?: 'right' }[] = [
    { key: 'src', label: 'Image URL', width: 520 },
    { key: 'alt', label: 'Alt', width: 320 },
    { key: 'width', label: 'Width', width: 80, align: 'right' },
    { key: 'height', label: 'Height', width: 80, align: 'right' },
    { key: 'occurrences', label: 'Occurrences', width: 100, align: 'right' },
  ];
  const colsWidth = columns.reduce((n, c) => n + c.width, 0);
  const totalWidth = ROW_NUM_WIDTH + colsWidth;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-surface-800 bg-surface-900/30 px-3 py-1.5">
        <input
          className="input w-96"
          placeholder="Search image URLs / alt…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          spellCheck={false}
        />
        {missingAltOnly && (
          <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
            Missing Alt only
          </span>
        )}
        <div className="ml-auto text-[11px] text-surface-500">
          <span className="font-mono text-surface-200">{total.toLocaleString()}</span> images
          <span className="ml-2 text-surface-600">({sorted.length.toLocaleString()} loaded)</span>
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
                className="flex cursor-pointer items-center gap-1 border-b border-r border-surface-800 pl-2 pr-3 font-medium text-surface-300 hover:text-surface-100"
                style={{ width: c.width, minWidth: c.width, flex: `0 0 ${c.width}px` }}
                onClick={() => handleSort(c.key)}
              >
                <span className={clsx('truncate', c.align === 'right' && 'ml-auto')}>
                  {c.label}
                </span>
                {sortBy === c.key && (
                  <span className="text-surface-500">{sortDir === 'asc' ? '▲' : '▼'}</span>
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
              const row = sorted[vi.index];
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
                    <span className="block truncate font-mono text-surface-100" title={row.src}>
                      {row.src}
                    </span>
                  </div>
                  <div
                    className="overflow-hidden px-2"
                    style={{
                      width: columns[1]!.width,
                      minWidth: columns[1]!.width,
                      flex: `0 0 ${columns[1]!.width}px`,
                    }}
                  >
                    <span
                      className={clsx(
                        'block truncate',
                        row.alt === null ? 'text-amber-400' : 'text-surface-200',
                      )}
                      title={row.alt === null ? 'Missing alt attribute' : row.alt}
                    >
                      {row.alt === null ? (
                        <span className="italic">missing</span>
                      ) : row.alt === '' ? (
                        <span className="text-surface-600">(empty — decorative)</span>
                      ) : (
                        row.alt
                      )}
                    </span>
                  </div>
                  <div
                    className="overflow-hidden px-2 text-right"
                    style={{
                      width: columns[2]!.width,
                      minWidth: columns[2]!.width,
                      flex: `0 0 ${columns[2]!.width}px`,
                    }}
                  >
                    <span className="block truncate font-mono tabular-nums text-surface-300">
                      {row.width ?? <span className="text-surface-700">—</span>}
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
                    <span className="block truncate font-mono tabular-nums text-surface-300">
                      {row.height ?? <span className="text-surface-700">—</span>}
                    </span>
                  </div>
                  <div
                    className="overflow-hidden px-2 text-right"
                    style={{
                      width: columns[4]!.width,
                      minWidth: columns[4]!.width,
                      flex: `0 0 ${columns[4]!.width}px`,
                    }}
                  >
                    <span className="block truncate font-mono tabular-nums text-surface-200">
                      {row.occurrences.toLocaleString()}
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
              <div className="mb-1 text-sm font-semibold text-surface-300">No images</div>
              <div className="text-xs text-surface-500">
                {missingAltOnly
                  ? 'No images without alt text.'
                  : 'Crawl a site to discover images.'}
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
