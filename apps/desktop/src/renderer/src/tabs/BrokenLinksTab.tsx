import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Download } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { BrokenLinkRow } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';
import { InfoTip } from '../components/InfoTip.js';
import { translateLabel } from '../i18n/labels.js';

const ROW_HEIGHT = 24;
const HEADER_HEIGHT = 28;
const ROW_NUM_WIDTH = 56;
const STATUS_BAR_HEIGHT = 22;
// I-4 — Crawl-aware polling cadence. Live during a crawl, idle when
// just viewing existing project data. The 30 s idle poll exists only
// to catch external invalidations (Open Project, Bulk Export); the
// crawler's per-50-URL push refetch handles the live case.
const POLL_MS_RUNNING = 3000;
const POLL_MS_IDLE = 30_000;
const PAGE_SIZE = 5000;

interface BrokenColumn {
  key: string;
  label: string;
  width: number;
  align?: 'right';
  info?: string;
  example?: string;
}

const COLUMNS: BrokenColumn[] = [
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

/** Plain-text value of one cell — used for copy + clipboard. */
function cellValue(row: BrokenLinkRow, colIdx: number): string {
  switch (COLUMNS[colIdx]?.key) {
    case 'fromUrl':
      return row.fromUrl;
    case 'fromStatus':
      return row.fromStatusCode === null ? '' : String(row.fromStatusCode);
    case 'toUrl':
      return row.toUrl;
    case 'toStatus':
      return row.toStatusCode === null ? '' : String(row.toStatusCode);
    case 'anchor':
      return row.anchor ?? '';
    case 'isInternal':
      return row.isInternal ? 'internal' : 'external';
    default:
      return '';
  }
}

/** True when the row set shifted enough to invalidate index-keyed
 *  cell selection (a live-crawl poll can insert / reorder rows). */
function brokenRowsChanged(
  prev: BrokenLinkRow[],
  next: BrokenLinkRow[],
): boolean {
  if (prev.length !== next.length) return true;
  for (let i = 0; i < next.length; i++) {
    const p = prev[i];
    const n = next[i];
    if (!p || !n || p.fromUrl !== n.fromUrl || p.toUrl !== n.toUrl) return true;
  }
  return false;
}

export function BrokenLinksTab() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const activeCategory = useAppStore((s) => s.activeCategory);
  const dataVersion = useAppStore((s) => s.dataVersion);
  const progress = useAppStore((s) => s.progress);
  const [rows, setRows] = useState<BrokenLinkRow[]>([]);
  const [total, setTotal] = useState(0);
  // Distinct broken target URLs — stable across crawls of different
  // sizes, unlike the row `total` which scales with how many pages the
  // crawl reached.
  const [uniqueTargets, setUniqueTargets] = useState(0);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ---- Cell selection -----------------------------------------------------
  // Keyed "rowIdx:colIdx". Index-based (matches the detail panel's
  // Links view): reset whenever the row set is rebuilt by a filter
  // change so stale indices can't linger.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const anchorRef = useRef<{ r: number; c: number } | null>(null);
  // Drag-selection snapshot. `base` is the pre-drag selection so a
  // Ctrl+drag unions the dragged rectangle with prior picks.
  const dragRef = useRef<
    | { aR: number; aC: number; additive: boolean; base: Set<string> }
    | null
  >(null);
  const [menu, setMenu] = useState<
    { x: number; y: number; rowIdx: number; colIdx: number } | null
  >(null);
  // Latest selection + rows for the document-level Ctrl+C listener.
  const selectedRef = useRef(selected);
  const rowsRef = useRef(rows);
  selectedRef.current = selected;
  rowsRef.current = rows;

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
      // A live-crawl poll can insert / reorder broken-link rows. The
      // cell selection is index-keyed ("rowIdx:colIdx"), so once the row
      // set shifts the old keys point at different rows — drop the
      // selection rather than highlight / copy the wrong cells.
      if (
        selectedRef.current.size > 0 &&
        brokenRowsChanged(rowsRef.current, res.rows)
      ) {
        setSelected(new Set());
        setMenu(null);
        anchorRef.current = null;
        dragRef.current = null;
      }
      setRows(res.rows);
      setTotal(res.total);
      setUniqueTargets(res.uniqueTargets);
    };
    void load();
    const cadence = progress?.running ? POLL_MS_RUNNING : POLL_MS_IDLE;
    const id = setInterval(load, cadence);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [search, internal, dataVersion, progress?.running]);

  // Drop the cell selection when the filter changes — row indices are
  // about to be reassigned, so keeping the old keys would highlight the
  // wrong cells. A poll refresh keeps the same filter, so selection
  // survives that.
  useEffect(() => {
    setSelected(new Set());
    setMenu(null);
    anchorRef.current = null;
    dragRef.current = null;
  }, [search, internal]);

  // Any mouseup ends a drag — even one released outside the table.
  useEffect(() => {
    const onUp = () => {
      dragRef.current = null;
    };
    document.addEventListener('mouseup', onUp);
    return () => document.removeEventListener('mouseup', onUp);
  }, []);

  // Ctrl/Cmd+C copies the selected cells as TSV.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key !== 'c' && e.key !== 'C') return;
      const sel = selectedRef.current;
      if (sel.size === 0) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }
      e.preventDefault();
      void copySelectedCells(sel, rowsRef.current);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close the context menu on outside click / scroll / Escape.
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', close, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', close, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

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

  const totalWidth = ROW_NUM_WIDTH + COLUMNS.reduce((n, c) => n + c.width, 0);

  // Export every broken link (not just the loaded page) to CSV. The
  // export honours the active internal/external scope filter so what
  // you see is what you get.
  const handleExport = async () => {
    if (total === 0 || exporting) return;
    setExporting(true);
    try {
      await window.freecrawl.exportBrokenLinks({ internal });
    } finally {
      setExporting(false);
    }
  };

  // --- selection handlers --------------------------------------------------
  const cellMouseDown = (r: number, c: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // left button only
    if (e.shiftKey && anchorRef.current) {
      // Extend a rectangle from the existing anchor.
      setSelected(rangeKeys(anchorRef.current.r, anchorRef.current.c, r, c));
      dragRef.current = { aR: anchorRef.current.r, aC: anchorRef.current.c, additive: false, base: new Set() };
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      // Toggle this cell, keep the rest.
      setSelected((prev) => {
        const next = new Set(prev);
        const k = `${r}:${c}`;
        if (next.has(k)) next.delete(k);
        else next.add(k);
        anchorRef.current = { r, c };
        dragRef.current = { aR: r, aC: c, additive: true, base: new Set(next) };
        return next;
      });
      return;
    }
    // Plain click — select just this cell and arm a drag from it.
    anchorRef.current = { r, c };
    dragRef.current = { aR: r, aC: c, additive: false, base: new Set() };
    setSelected(new Set([`${r}:${c}`]));
  };

  const cellMouseEnter = (r: number, c: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = rangeKeys(drag.aR, drag.aC, r, c);
    if (drag.additive) {
      for (const k of drag.base) rect.add(k);
    }
    setSelected(rect);
  };

  const cellContextMenu = (r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault();
    // If the right-clicked cell isn't already selected, select just it
    // so the menu's "Copy cells" scope is unambiguous.
    if (!selected.has(`${r}:${c}`)) {
      anchorRef.current = { r, c };
      setSelected(new Set([`${r}:${c}`]));
    }
    setMenu({ x: e.clientX, y: e.clientY, rowIdx: r, colIdx: c });
  };

  const isSelected = (r: number, c: number): boolean => selected.has(`${r}:${c}`);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-surface-800 bg-surface-900/30 px-3 py-1.5">
        <input
          className="input w-96"
          placeholder={t('brokenTab.searchPlaceholder', { defaultValue: 'Search broken target URLs…' })}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          spellCheck={false}
        />
        {internal !== 'all' && (
          <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
            {internal === 'internal' ? t('brokenTab.internalOnly', { defaultValue: 'Internal only' }) : t('brokenTab.externalOnly', { defaultValue: 'External only' })}
          </span>
        )}
        <div className="ml-auto text-[11px] text-surface-500">
          <span className="font-mono text-surface-200">{total.toLocaleString()}</span> {t('brokenTab.linksUnit', { defaultValue: 'broken links' })}
          <span className="mx-1 text-surface-700">·</span>
          <span className="font-mono text-surface-200">{uniqueTargets.toLocaleString()}</span> {t('brokenTab.uniqueUnit', { defaultValue: 'unique URLs' })}
          <span className="ml-2 text-surface-600">({t('imagesTab.loaded', { defaultValue: '{{n}} loaded', n: rows.length.toLocaleString() })})</span>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={total === 0 || exporting}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] transition',
            total === 0 || exporting
              ? 'cursor-not-allowed border-surface-800 text-surface-600'
              : 'border-surface-700 text-surface-300 hover:bg-surface-800',
          )}
          title={
            total === 0
              ? t('urlsTab.noDataToExport', { defaultValue: 'No data to export' })
              : t('urlsTab.exportThisTable', { defaultValue: 'Export this table' })
          }
        >
          <Download className="h-3.5 w-3.5" />
          <span>{t('urlsTab.export', { defaultValue: 'Export' })}</span>
        </button>
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
              {t('imagesTab.row', { defaultValue: 'Row' })}
            </div>
            {COLUMNS.map((c) => (
              <div
                key={c.key}
                className="flex items-center gap-1 border-b border-r border-surface-800 pl-2 pr-3 font-medium text-surface-300"
                style={{ width: c.width, minWidth: c.width, flex: `0 0 ${c.width}px` }}
              >
                <span className={clsx('truncate', c.align === 'right' && 'ml-auto')}>
                  {translateLabel(c.label, lang)}
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
                  className="absolute left-0 top-0 flex items-center border-b border-surface-900 text-[11px] hover:bg-surface-900/40"
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
                  {COLUMNS.map((c, colIdx) => (
                    <div
                      key={c.key}
                      className={clsx(
                        'flex cursor-cell items-center overflow-hidden border-r border-surface-900 px-2',
                        c.align === 'right' && 'justify-end',
                        isSelected(vi.index, colIdx) && 'bg-accent-500/30 text-surface-50',
                      )}
                      style={{
                        width: c.width,
                        minWidth: c.width,
                        flex: `0 0 ${c.width}px`,
                        height: '100%',
                      }}
                      onMouseDown={(e) => cellMouseDown(vi.index, colIdx, e)}
                      onMouseEnter={() => cellMouseEnter(vi.index, colIdx)}
                      onContextMenu={(e) => cellContextMenu(vi.index, colIdx, e)}
                    >
                      {renderCellContent(row, c.key)}
                    </div>
                  ))}
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
              <div className="mb-1 text-sm font-semibold text-surface-300">{t('brokenTab.noBrokenLinks', { defaultValue: 'No broken links' })}</div>
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
        {selected.size > 0 && (
          <span className="mr-auto text-surface-500">
            {t('brokenTab.cellsSelected', { defaultValue: '{{n}} cell(s) selected', n: selected.size.toLocaleString() })}
          </span>
        )}
        <span>
          {t('brokenTab.uniqueLabel', { defaultValue: 'Unique broken URLs' })}:{' '}
          <span className="font-mono tabular-nums text-surface-200">
            {uniqueTargets.toLocaleString()}
          </span>
        </span>
        <span>
          {t('brokenTab.totalLabel', { defaultValue: 'Total rows' })}:{' '}
          <span className="font-mono tabular-nums text-surface-200">
            {total.toLocaleString()}
          </span>
        </span>
      </div>

      {menu && rows[menu.rowIdx] && (
        <BrokenLinkCellMenu
          x={menu.x}
          y={menu.y}
          row={rows[menu.rowIdx]!}
          selectionSize={selected.size}
          onCopyCells={() => {
            void copySelectedCells(selected, rows);
            setMenu(null);
          }}
          onCopySource={() => {
            void writeTextToClipboard(rows[menu.rowIdx]!.fromUrl);
            setMenu(null);
          }}
          onCopyTarget={() => {
            void writeTextToClipboard(rows[menu.rowIdx]!.toUrl);
            setMenu(null);
          }}
          onOpenSource={() => {
            window.open(rows[menu.rowIdx]!.fromUrl, '_blank');
            setMenu(null);
          }}
          onOpenTarget={() => {
            window.open(rows[menu.rowIdx]!.toUrl, '_blank');
            setMenu(null);
          }}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

/** Render the visible content of one broken-link cell. */
function renderCellContent(row: BrokenLinkRow, colKey: string): ReactNode {
  switch (colKey) {
    case 'fromUrl':
      return (
        <span className="block truncate font-mono text-surface-100" title={row.fromUrl}>
          {row.fromUrl}
        </span>
      );
    case 'fromStatus':
      return (
        <span
          className={clsx(
            'inline-block rounded px-1.5 font-mono text-[10px]',
            statusClasses(row.fromStatusCode),
          )}
        >
          {row.fromStatusCode ?? '—'}
        </span>
      );
    case 'toUrl':
      return (
        <span className="block truncate font-mono text-surface-100" title={row.toUrl}>
          {row.toUrl}
        </span>
      );
    case 'toStatus':
      return (
        <span
          className={clsx(
            'inline-block rounded px-1.5 font-mono text-[10px]',
            statusClasses(row.toStatusCode),
          )}
        >
          {row.toStatusCode ?? '—'}
        </span>
      );
    case 'anchor':
      return (
        <span className="block truncate text-surface-200" title={row.anchor ?? undefined}>
          {row.anchor ?? <span className="text-surface-700">—</span>}
        </span>
      );
    case 'isInternal':
      return (
        <span
          className={clsx(
            'text-[10px]',
            row.isInternal ? 'text-surface-300' : 'text-surface-500',
          )}
        >
          {row.isInternal ? 'internal' : 'external'}
        </span>
      );
    default:
      return null;
  }
}

/** Every "rowIdx:colIdx" key inside the rectangle spanned by two cells. */
function rangeKeys(aR: number, aC: number, r: number, c: number): Set<string> {
  const minR = Math.min(aR, r);
  const maxR = Math.max(aR, r);
  const minC = Math.min(aC, c);
  const maxC = Math.max(aC, c);
  const out = new Set<string>();
  for (let row = minR; row <= maxR; row++) {
    for (let col = minC; col <= maxC; col++) {
      out.add(`${row}:${col}`);
    }
  }
  return out;
}

/**
 * Copy the selected cells to the clipboard as TSV — grouped by row,
 * columns ascending, so a paste into a spreadsheet lands in matching
 * grid positions.
 */
async function copySelectedCells(
  selected: Set<string>,
  rows: BrokenLinkRow[],
): Promise<void> {
  if (selected.size === 0) return;
  const byRow = new Map<number, number[]>();
  for (const k of selected) {
    const [rs, cs] = k.split(':');
    const r = Number(rs);
    const c = Number(cs);
    if (!Number.isFinite(r) || !Number.isFinite(c)) continue;
    const list = byRow.get(r);
    if (list) list.push(c);
    else byRow.set(r, [c]);
  }
  const lines: string[] = [];
  for (const r of [...byRow.keys()].sort((a, b) => a - b)) {
    const row = rows[r];
    if (!row) continue;
    const cols = (byRow.get(r) ?? []).sort((a, b) => a - b);
    lines.push(cols.map((c) => cellValue(row, c)).join('\t'));
  }
  await writeTextToClipboard(lines.join('\n'));
}

/** Clipboard write with a hidden-textarea fallback for unfocused windows. */
async function writeTextToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
    }
  }
}

function statusClasses(code: number | null): string {
  if (code === null) return 'bg-surface-800 text-surface-400';
  if (code >= 400 && code < 500) return 'bg-orange-900/60 text-orange-300';
  if (code >= 500) return 'bg-red-900/60 text-red-300';
  if (code >= 300 && code < 400) return 'bg-amber-900/60 text-amber-300';
  if (code >= 200 && code < 300) return 'bg-emerald-900/60 text-emerald-300';
  return 'bg-surface-800 text-surface-400';
}

/** In-page right-click menu for a broken-link cell. */
function BrokenLinkCellMenu({
  x,
  y,
  row,
  selectionSize,
  onCopyCells,
  onCopySource,
  onCopyTarget,
  onOpenSource,
  onOpenTarget,
  onClose,
}: {
  x: number;
  y: number;
  row: BrokenLinkRow;
  selectionSize: number;
  onCopyCells: () => void;
  onCopySource: () => void;
  onCopyTarget: () => void;
  onOpenSource: () => void;
  onOpenTarget: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const items: { label: string; action: () => void; disabled?: boolean }[] = [
    {
      label:
        selectionSize > 1
          ? t('cellMenu.copyCells', { defaultValue: 'Copy {{n}} Cells', n: selectionSize.toLocaleString() })
          : t('cellMenu.copyCell', { defaultValue: 'Copy Cell' }),
      action: onCopyCells,
      disabled: selectionSize === 0,
    },
    { label: t('cellMenu.copySourceUrl', { defaultValue: 'Copy Source URL' }), action: onCopySource },
    { label: t('cellMenu.copyTargetUrl', { defaultValue: 'Copy Target URL' }), action: onCopyTarget },
    { label: t('cellMenu.openSourceUrl', { defaultValue: 'Open Source URL' }), action: onOpenSource },
    { label: t('cellMenu.openTargetUrl', { defaultValue: 'Open Target URL' }), action: onOpenTarget },
  ];
  // Reference `row` so the menu re-anchors if the underlying row swaps.
  void row;
  return (
    <div
      className="fixed z-50 min-w-[180px] rounded border border-surface-700 bg-surface-900 py-1 text-[11px] shadow-lg"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          disabled={it.disabled}
          onClick={() => !it.disabled && it.action()}
          className={clsx(
            'block w-full px-3 py-1 text-left',
            it.disabled
              ? 'cursor-not-allowed text-surface-600'
              : 'text-surface-200 hover:bg-accent-500/30 hover:text-surface-50',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
