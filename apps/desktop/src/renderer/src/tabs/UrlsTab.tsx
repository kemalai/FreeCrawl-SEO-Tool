import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import type { CrawlUrlRow } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

type Filter = 'all' | 'internal' | 'external' | 'errors' | 'redirects';

const PAGE_SIZE = 500;

const columnHelper = createColumnHelper<CrawlUrlRow>();
const columns = [
  columnHelper.accessor('url', {
    header: 'URL',
    cell: (i) => (
      <span className="truncate font-mono text-[11px] text-surface-100" title={i.getValue()}>
        {i.getValue()}
      </span>
    ),
    size: 520,
  }),
  columnHelper.accessor('statusCode', {
    header: 'Status',
    cell: (i) => {
      const v = i.getValue();
      return (
        <span
          className={clsx(
            'inline-block rounded px-1.5 font-mono text-[10px]',
            statusClasses(v),
          )}
        >
          {v ?? '—'}
        </span>
      );
    },
    size: 70,
  }),
  columnHelper.accessor('contentKind', { header: 'Type', size: 70 }),
  columnHelper.accessor('indexability', {
    header: 'Indexability',
    cell: (i) => {
      const v = i.getValue();
      return (
        <span
          className={clsx(
            'truncate',
            v === 'indexable' ? 'text-emerald-400' : 'text-amber-400',
          )}
          title={v}
        >
          {v === 'indexable' ? 'Indexable' : 'Non-indexable'}
        </span>
      );
    },
    size: 120,
  }),
  columnHelper.accessor('title', {
    header: 'Title',
    cell: (i) => <span className="truncate" title={i.getValue() ?? ''}>{i.getValue() ?? ''}</span>,
    size: 300,
  }),
  columnHelper.accessor('titleLength', { header: 'Title Len', size: 80 }),
  columnHelper.accessor('metaDescription', {
    header: 'Meta Description',
    cell: (i) => (
      <span className="truncate text-surface-300" title={i.getValue() ?? ''}>
        {i.getValue() ?? ''}
      </span>
    ),
    size: 320,
  }),
  columnHelper.accessor('metaDescriptionLength', { header: 'Meta Len', size: 80 }),
  columnHelper.accessor('h1', {
    header: 'H1',
    cell: (i) => <span className="truncate" title={i.getValue() ?? ''}>{i.getValue() ?? ''}</span>,
    size: 240,
  }),
  columnHelper.accessor('wordCount', { header: 'Words', size: 70 }),
  columnHelper.accessor('responseTimeMs', { header: 'Resp (ms)', size: 90 }),
  columnHelper.accessor('depth', { header: 'Depth', size: 60 }),
  columnHelper.accessor('inlinks', { header: 'Inlinks', size: 70 }),
  columnHelper.accessor('outlinks', { header: 'Outlinks', size: 80 }),
];

export function UrlsTab({ filter }: { filter: Filter }) {
  const progress = useAppStore((s) => s.progress);
  const [rows, setRows] = useState<CrawlUrlRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const sortBy = (sorting[0]?.id as keyof CrawlUrlRow | undefined) ?? 'id';
      const sortDir = sorting[0]?.desc ? 'desc' : 'asc';
      const res = await window.freecrawl.urlsQuery({
        limit: PAGE_SIZE,
        offset: 0,
        filter,
        search: search.trim() || undefined,
        sortBy,
        sortDir,
      });
      setRows(res.rows);
      setTotal(res.total);
    };
    void load();
    const id = setInterval(load, 1500);
    return () => clearInterval(id);
  }, [filter, search, sorting, progress?.crawled]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
  });

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 28,
    overscan: 12,
  });

  const visibleColumnsWidth = useMemo(
    () => columns.reduce((sum, c) => sum + (c.size ?? 100), 0),
    [],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-surface-800 bg-surface-900/30 px-3 py-1.5">
        <input
          className="input w-80"
          placeholder="Search URLs / titles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          spellCheck={false}
        />
        <div className="ml-auto text-[11px] text-surface-500">
          Showing <span className="font-mono text-surface-200">{rows.length.toLocaleString()}</span>{' '}
          of <span className="font-mono text-surface-200">{total.toLocaleString()}</span>
          {total > PAGE_SIZE && (
            <span className="ml-1 text-surface-600">(first {PAGE_SIZE} shown)</span>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="relative flex-1 overflow-auto">
        <table className="w-max border-collapse" style={{ minWidth: visibleColumnsWidth }}>
          <thead className="sticky top-0 z-10 bg-surface-900 text-[11px]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="select-none border-b border-surface-800 px-2 py-1.5 text-left font-medium text-surface-300"
                    style={{ width: h.getSize() }}
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getIsSorted() === 'asc' && '▲'}
                      {h.column.getIsSorted() === 'desc' && '▼'}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody style={{ height: rowVirtualizer.getTotalSize(), display: 'block', position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((vi) => {
              const row = table.getRowModel().rows[vi.index];
              if (!row) return null;
              return (
                <tr
                  key={row.id}
                  className="absolute left-0 top-0 flex items-center border-b border-surface-900 text-[11px] hover:bg-surface-900/60"
                  style={{ transform: `translateY(${vi.start}px)`, height: vi.size }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="overflow-hidden px-2"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusClasses(code: number | null): string {
  if (code === null) return 'bg-surface-800 text-surface-400';
  if (code >= 200 && code < 300) return 'bg-emerald-900/60 text-emerald-300';
  if (code >= 300 && code < 400) return 'bg-amber-900/60 text-amber-300';
  if (code >= 400 && code < 500) return 'bg-orange-900/60 text-orange-300';
  if (code >= 500) return 'bg-red-900/60 text-red-300';
  return 'bg-surface-800 text-surface-400';
}
