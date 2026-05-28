import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ChevronsUpDown,
  Columns3,
  Download,
  Filter,
  List,
  Network,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type {
  AdvancedFilter,
  CrawlUrlRow,
  UrlCategory,
} from '@freecrawl/shared-types';
import { useAppStore, TAB_QUICK_FILTERS, type TabKey } from '../store.js';
import { COLUMN_SPECS, columnId, type ColumnSpec } from './columns.js';
import { useLazyUrlRows } from '../hooks/useLazyUrlRows.js';
import { AdvancedFilterDialog } from '../components/AdvancedFilterDialog.js';
import { UrlTreeView } from '../components/UrlTreeView.js';
import { ErrorBoundary } from '../components/ErrorBoundary.js';
import { ExportDialog } from '../components/ExportDialog.js';
import { InfoTip } from '../components/InfoTip.js';
import { translateLabel } from '../i18n/labels.js';

const ROW_HEIGHT = 24;
const HEADER_HEIGHT = 28;
const MIN_COL_WIDTH = 48;
const ROW_NUM_DEFAULT_WIDTH = 56;
const ROW_NUM_KEY = '__row_num__';
const STATUS_BAR_HEIGHT = 22;
const PREFS_PREFIX = 'col-widths:';
const PREFS_HIDDEN_PREFIX = 'col-hidden:';

function loadStoredWidths(tab: TabKey): Record<string, number> {
  const value = window.freecrawl.prefsGet(PREFS_PREFIX + tab);
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, number>;
  }
  return {};
}

function loadHiddenColumns(tab: TabKey): Set<string> {
  const value = window.freecrawl.prefsGet(PREFS_HIDDEN_PREFIX + tab);
  if (Array.isArray(value)) {
    return new Set(value.filter((v): v is string => typeof v === 'string'));
  }
  return new Set();
}

function saveHiddenColumns(tab: TabKey, hidden: Set<string>): void {
  try {
    window.freecrawl.prefsSet(PREFS_HIDDEN_PREFIX + tab, [...hidden]);
  } catch {
    // best-effort persistence
  }
}

export function UrlsTab() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const activeTab = useAppStore((s) => s.activeTab);
  const activeCategory = useAppStore((s) => s.activeCategory);
  const setActiveCategory = useAppStore((s) => s.setActiveCategory);
  const selectedUrlId = useAppStore((s) => s.selectedUrlId);
  const setSelectedUrlId = useAppStore((s) => s.setSelectedUrlId);
  const setSelectedUrlIds = useAppStore((s) => s.setSelectedUrlIds);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof CrawlUrlRow | undefined>(undefined);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState<AdvancedFilter | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  /** View mode toggle — list (default flat virtual table) or tree
   *  (URL-path hierarchy). Per-tab + persisted across mounts via prefs. */
  const [viewMode, setViewMode] = useState<'list' | 'tree'>(() => {
    const stored = window.freecrawl.prefsGet(`view-mode:${activeTab}`);
    return stored === 'tree' ? 'tree' : 'list';
  });
  const quickFilters = TAB_QUICK_FILTERS[activeTab];
  const activeQuickFilter = useMemo(() => {
    if (!quickFilters) return null;
    return quickFilters.find((q) => q.category === activeCategory) ?? null;
  }, [quickFilters, activeCategory]);
  // Three orthogonal selection layers:
  // - selectedIds: row-level selection driven by the Row-number column.
  //   Feeds the bulk context menu (Copy/Open/Re-Spider/Remove/Export).
  // - selectedCells: explicit per-cell picks, "urlId:colIdx" keyed so it
  //   survives live refresh reshuffles.
  // - selectedColumns: colIdx set for whole-column header clicks. A cell
  //   is "selected" if its column is in this set OR its key is in
  //   selectedCells.
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [selectedColumns, setSelectedColumns] = useState<Set<number>>(new Set());
  const selectionAnchor = useRef<number | null>(null);
  const cellAnchor = useRef<{ col: number; index: number } | null>(null);
  // Mouse-drag selection. Null when no drag in progress. `base*` holds the
  // snapshot from the moment the drag began so Ctrl+drag can union the
  // drag range with what was already picked.
  const dragRef = useRef<
    | {
        kind: 'cell';
        anchorIdx: number;
        anchorCol: number;
        idx: number;
        col: number;
        additive: boolean;
        baseCells: Set<string>;
      }
    | {
        kind: 'row';
        anchorIdx: number;
        idx: number;
        additive: boolean;
        baseIds: Set<number>;
      }
    | {
        kind: 'column';
        anchorCol: number;
        col: number;
        additive: boolean;
        baseCols: Set<number>;
      }
    | null
  >(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    loadStoredWidths(activeTab),
  );
  const [hiddenColumns, setHiddenColumnsState] = useState<Set<string>>(() =>
    loadHiddenColumns(activeTab),
  );
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allColumns = COLUMN_SPECS[activeTab];
  // Visible columns drive the rendered header + body. Hidden ids that no
  // longer exist on the active tab (e.g. user switched between tabs with
  // different specs) are silently filtered out — they remain in the saved
  // set so toggling back to the originating tab restores them.
  const columns = useMemo(
    () => allColumns.filter((c) => !hiddenColumns.has(columnId(c))),
    [allColumns, hiddenColumns],
  );

  const setHiddenColumns = useCallback(
    (next: Set<string>) => {
      setHiddenColumnsState(next);
      saveHiddenColumns(activeTab, next);
    },
    [activeTab],
  );

  useEffect(() => {
    setColumnWidths(loadStoredWidths(activeTab));
    setHiddenColumnsState(loadHiddenColumns(activeTab));
    setColumnPickerOpen(false);
    // Pick up the persisted view-mode for the new tab.
    const stored = window.freecrawl.prefsGet(`view-mode:${activeTab}`);
    setViewMode(stored === 'tree' ? 'tree' : 'list');
  }, [activeTab]);

  // Persist viewMode whenever the user toggles it.
  useEffect(() => {
    try {
      window.freecrawl.prefsSet(`view-mode:${activeTab}`, viewMode);
    } catch {
      /* best-effort */
    }
  }, [activeTab, viewMode]);

  useEffect(() => {
    setSelectedIds(new Set());
    setSelectedCells(new Set());
    setSelectedColumns(new Set());
    selectionAnchor.current = null;
    cellAnchor.current = null;
    dragRef.current = null;
  }, [activeCategory, activeTab, search, sortBy, sortDir, hiddenColumns]);

  // Clear the drag flag on any mouseup anywhere — without this, releasing
  // the button outside a cell would leave `dragRef` dangling and the next
  // `mouseenter` would mistakenly extend the "dragged" range.
  useEffect(() => {
    const onUp = () => {
      dragRef.current = null;
    };
    document.addEventListener('mouseup', onUp);
    return () => document.removeEventListener('mouseup', onUp);
  }, []);

  // Mirror the multi-selection into the store so the bottom detail
  // panel can aggregate sub-tabs (Inlinks / Outlinks / Images / Resources)
  // across every selected URL instead of only the primary `selectedUrlId`.
  // Two sources contribute distinct URL ids:
  //   1. selectedIds — explicit Row-number column picks.
  //   2. selectedCells — keyed `${urlId}:${colIdx}`, so each entry's URL
  //      counts toward multi-aggregation even when the user picked a
  //      single value cell instead of the whole row.
  useEffect(() => {
    const ids = new Set<number>(selectedIds);
    for (const k of selectedCells) {
      const [idStr] = k.split(':');
      const id = Number(idStr);
      if (Number.isFinite(id)) ids.add(id);
    }
    setSelectedUrlIds([...ids]);
  }, [selectedIds, selectedCells, setSelectedUrlIds]);

  const getWidth = useCallback(
    (c: ColumnSpec): number => columnWidths[columnId(c)] ?? c.size,
    [columnWidths],
  );

  const rowNumWidth = columnWidths[ROW_NUM_KEY] ?? ROW_NUM_DEFAULT_WIDTH;

  const totalWidth = useMemo(
    () => rowNumWidth + columns.reduce((n, c) => n + getWidth(c), 0),
    [columns, getWidth, rowNumWidth],
  );

  // Only dataVersion (context-menu mutations like Remove / Re-Spider) forces
  // a snapshot rebuild. Crawler progress ticks intentionally do NOT rebuild
  // — the user sees a "N new rows · Refresh" pill instead so the sorted
  // view stays stable while they're reading it.
  const dataVersion = useAppStore((s) => s.dataVersion);
  const lazy = useLazyUrlRows({
    category: activeCategory,
    search,
    sortBy,
    sortDir,
    filter: filter ?? undefined,
    refreshKey: dataVersion,
  });

  const activeClauseCount = filter
    ? filter.groups.reduce((n, g) => n + g.clauses.length, 0)
    : 0;

  const virtualizer = useVirtualizer({
    count: lazy.total,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 30,
    // Anchor each virtual row to the underlying url id so React reuses the
    // same DOM node across live refresh ticks — only the cell contents
    // re-render, the row never unmounts/remounts, so the table never
    // flashes even while the crawler is writing new rows beneath it.
    getItemKey: (index) => {
      const row = lazy.rowAt(index);
      return row ? `id-${row.id}` : `idx-${index}`;
    },
  });

  const virtualRows = virtualizer.getVirtualItems();
  useEffect(() => {
    if (virtualRows.length === 0) return;
    const first = virtualRows[0]!.index;
    const last = virtualRows[virtualRows.length - 1]!.index;
    lazy.ensureRange(first, last);
  }, [virtualRows, lazy]);

  const handleSort = (key: keyof CrawlUrlRow) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const clearCellAndColumn = () => {
    setSelectedCells(new Set());
    setSelectedColumns(new Set());
    cellAnchor.current = null;
  };

  const clearRow = () => {
    setSelectedIds(new Set());
    selectionAnchor.current = null;
  };

  const handleRowClick = (rowId: number, rowIndex: number, e: React.MouseEvent) => {
    // Row-number cell click — selects the whole row. Clears any cell/column
    // selection because row and cell selections are mutually exclusive
    // semantically (row → "this URL as a record", cell → "this value").
    clearCellAndColumn();
    if (e.shiftKey && selectionAnchor.current !== null) {
      const anchorIdx = selectionAnchor.current;
      const [lo, hi] = anchorIdx < rowIndex ? [anchorIdx, rowIndex] : [rowIndex, anchorIdx];
      const next = new Set(selectedIds);
      for (let i = lo; i <= hi; i++) {
        const r = lazy.rowAt(i);
        if (r) next.add(r.id);
      }
      setSelectedIds(next);
      setSelectedUrlId(rowId);
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      const next = new Set(selectedIds);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      setSelectedIds(next);
      selectionAnchor.current = rowIndex;
      setSelectedUrlId(next.has(rowId) ? rowId : null);
      return;
    }
    if (selectedIds.size === 1 && selectedIds.has(rowId)) {
      setSelectedIds(new Set());
      setSelectedUrlId(null);
      selectionAnchor.current = null;
      return;
    }
    setSelectedIds(new Set([rowId]));
    setSelectedUrlId(rowId);
    selectionAnchor.current = rowIndex;
  };

  const handleCellClick = (
    rowId: number,
    colIdx: number,
    rowIndex: number,
    e: React.MouseEvent,
  ) => {
    // Cell click clears row-level selection (they're mutually exclusive).
    // Column set also clears — if you had "whole Title column" selected
    // and click a single cell, the column selection collapses to that cell.
    clearRow();
    setSelectedColumns(new Set());

    const k = `${rowId}:${colIdx}`;

    // Shift+Click within the same column extends the vertical range from
    // the anchor. Cross-column shift-click falls back to single-pick
    // (rectangular ranges are left for a future iteration).
    if (e.shiftKey && cellAnchor.current && cellAnchor.current.col === colIdx) {
      const anchor = cellAnchor.current;
      const [lo, hi] =
        anchor.index < rowIndex ? [anchor.index, rowIndex] : [rowIndex, anchor.index];
      const next = new Set(selectedCells);
      for (let i = lo; i <= hi; i++) {
        const r = lazy.rowAt(i);
        if (r) next.add(`${r.id}:${colIdx}`);
      }
      setSelectedCells(next);
      setSelectedUrlId(rowId);
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      const next = new Set(selectedCells);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      setSelectedCells(next);
      cellAnchor.current = { col: colIdx, index: rowIndex };
      setSelectedUrlId(rowId);
      return;
    }
    // Plain click — single cell. Clicking the only selected cell again
    // deselects.
    if (selectedCells.size === 1 && selectedCells.has(k)) {
      setSelectedCells(new Set());
      cellAnchor.current = null;
      setSelectedUrlId(null);
      return;
    }
    setSelectedCells(new Set([k]));
    cellAnchor.current = { col: colIdx, index: rowIndex };
    setSelectedUrlId(rowId);
  };

  const handleHeaderClick = (colIdx: number, e: React.MouseEvent) => {
    // Column selection — mutually exclusive with row selection, lives
    // alongside per-cell selection but replaces it on plain clicks.
    clearRow();
    if (e.ctrlKey || e.metaKey) {
      const next = new Set(selectedColumns);
      if (next.has(colIdx)) next.delete(colIdx);
      else next.add(colIdx);
      setSelectedColumns(next);
      return;
    }
    setSelectedCells(new Set());
    if (selectedColumns.size === 1 && selectedColumns.has(colIdx)) {
      setSelectedColumns(new Set());
      return;
    }
    setSelectedColumns(new Set([colIdx]));
  };

  // ──────── Drag selection ────────
  // Each drag starts on mousedown of a row-number cell, a data cell, or a
  // header. Entering a new target via onMouseEnter grows the rectangle /
  // list until mouseup anywhere cancels the drag.

  const applyCellDrag = useCallback(
    (toIdx: number, toCol: number) => {
      const d = dragRef.current;
      if (!d || d.kind !== 'cell') return;
      d.idx = toIdx;
      d.col = toCol;
      const loR = Math.min(d.anchorIdx, toIdx);
      const hiR = Math.max(d.anchorIdx, toIdx);
      const loC = Math.min(d.anchorCol, toCol);
      const hiC = Math.max(d.anchorCol, toCol);
      const next = new Set(d.baseCells);
      for (let i = loR; i <= hiR; i++) {
        const r = lazy.rowAt(i);
        if (!r) continue;
        for (let c = loC; c <= hiC; c++) {
          next.add(`${r.id}:${c}`);
        }
      }
      setSelectedCells(next);
      const endRow = lazy.rowAt(toIdx);
      if (endRow) setSelectedUrlId(endRow.id);
    },
    [lazy, setSelectedUrlId],
  );

  const applyRowDrag = useCallback(
    (toIdx: number) => {
      const d = dragRef.current;
      if (!d || d.kind !== 'row') return;
      d.idx = toIdx;
      const lo = Math.min(d.anchorIdx, toIdx);
      const hi = Math.max(d.anchorIdx, toIdx);
      const next = new Set(d.baseIds);
      for (let i = lo; i <= hi; i++) {
        const r = lazy.rowAt(i);
        if (r) next.add(r.id);
      }
      setSelectedIds(next);
      const endRow = lazy.rowAt(toIdx);
      if (endRow) setSelectedUrlId(endRow.id);
    },
    [lazy, setSelectedUrlId],
  );

  const applyColumnDrag = useCallback((toCol: number) => {
    const d = dragRef.current;
    if (!d || d.kind !== 'column') return;
    d.col = toCol;
    const lo = Math.min(d.anchorCol, toCol);
    const hi = Math.max(d.anchorCol, toCol);
    const next = new Set(d.baseCols);
    for (let c = lo; c <= hi; c++) next.add(c);
    setSelectedColumns(next);
  }, []);

  const beginCellDrag = (
    rowId: number,
    idx: number,
    colIdx: number,
    e: React.MouseEvent,
  ) => {
    if (e.button !== 0) return;
    // Shift extends from the existing anchor using click semantics — no drag.
    if (e.shiftKey) {
      handleCellClick(rowId, colIdx, idx, e);
      return;
    }
    e.preventDefault();
    const additive = e.ctrlKey || e.metaKey;
    clearRow();
    setSelectedColumns(new Set());
    dragRef.current = {
      kind: 'cell',
      anchorIdx: idx,
      anchorCol: colIdx,
      idx,
      col: colIdx,
      additive,
      baseCells: additive ? new Set(selectedCells) : new Set(),
    };
    cellAnchor.current = { col: colIdx, index: idx };
    setSelectedUrlId(rowId);
    applyCellDrag(idx, colIdx);
  };

  const beginRowDrag = (rowId: number, idx: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (e.shiftKey) {
      handleRowClick(rowId, idx, e);
      return;
    }
    e.preventDefault();
    const additive = e.ctrlKey || e.metaKey;
    setSelectedCells(new Set());
    setSelectedColumns(new Set());
    dragRef.current = {
      kind: 'row',
      anchorIdx: idx,
      idx,
      additive,
      baseIds: additive ? new Set(selectedIds) : new Set(),
    };
    selectionAnchor.current = idx;
    setSelectedUrlId(rowId);
    applyRowDrag(idx);
  };

  const beginColumnDrag = (colIdx: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (e.shiftKey) {
      handleHeaderClick(colIdx, e);
      return;
    }
    e.preventDefault();
    const additive = e.ctrlKey || e.metaKey;
    clearRow();
    setSelectedCells(new Set());
    dragRef.current = {
      kind: 'column',
      anchorCol: colIdx,
      col: colIdx,
      additive,
      baseCols: additive ? new Set(selectedColumns) : new Set(),
    };
    applyColumnDrag(colIdx);
  };

  const startResize = (colKey: string, startWidth: number, clientX: number) => {
    const startX = clientX;
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const next = Math.max(MIN_COL_WIDTH, Math.round(startWidth + delta));
      setColumnWidths((prev) => {
        const updated = { ...prev, [colKey]: next };
        window.freecrawl.prefsSet(PREFS_PREFIX + activeTab, updated);
        return updated;
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const resetColumn = (colKey: string) => {
    setColumnWidths((prev) => {
      const updated = { ...prev };
      delete updated[colKey];
      if (Object.keys(updated).length === 0) {
        window.freecrawl.prefsDelete(PREFS_PREFIX + activeTab);
      } else {
        window.freecrawl.prefsSet(PREFS_PREFIX + activeTab, updated);
      }
      return updated;
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-surface-800 bg-surface-900/30 px-3 py-1.5">
        <input
          className="input w-96"
          placeholder={t('urlsTab.searchPlaceholder', { defaultValue: 'Search URLs / titles…' })}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          spellCheck={false}
        />
        {quickFilters && quickFilters.length > 0 && (
          <select
            className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[11px] text-surface-200 focus:border-blue-500 focus:outline-none"
            // Bug #6 — when activeCategory isn't one of the predefined
            // quick-filter options, fall back to an explicit placeholder
            // value so the dropdown doesn't silently mislabel itself as
            // the first option.
            value={activeQuickFilter?.category ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              if (v) setActiveCategory(v as UrlCategory);
            }}
            title={t('urlsTab.quickFilterTitle', { defaultValue: 'Quick filter for this tab' })}
          >
            {!activeQuickFilter && (
              <option value="" disabled>
                {t('urlsTab.quickFilterCustom', {
                  defaultValue: '— Custom filter —',
                })}
              </option>
            )}
            {quickFilters.map((q) => (
              <option key={q.category} value={q.category}>
                {translateLabel(q.label, lang)}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={() => setFilterDialogOpen(true)}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] transition',
            activeClauseCount > 0
              ? 'border-accent-500/60 bg-accent-500/15 text-accent-300 hover:bg-accent-500/25'
              : 'border-surface-700 text-surface-300 hover:bg-surface-800',
          )}
          title={t('urlsTab.advancedFilterTitle', { defaultValue: 'Advanced filter' })}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>{t('urlsTab.advanced', { defaultValue: 'Advanced' })}</span>
          {activeClauseCount > 0 && (
            <span className="rounded bg-accent-500/20 px-1 font-mono text-[10px]">
              {activeClauseCount}
            </span>
          )}
        </button>
        {activeClauseCount > 0 && (
          <button
            type="button"
            onClick={() => setFilter(null)}
            className="inline-flex items-center gap-1 rounded border border-surface-700 px-1.5 py-1 text-[11px] text-surface-400 hover:bg-surface-800 hover:text-surface-200"
            title={t('urlsTab.clearAdvancedFilter', { defaultValue: 'Clear advanced filter' })}
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <div className="ml-auto inline-flex overflow-hidden rounded border border-surface-700">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={clsx(
              'inline-flex items-center justify-center px-2 py-1 text-[11px] transition',
              viewMode === 'list'
                ? 'bg-accent-500/15 text-accent-300'
                : 'text-surface-300 hover:bg-surface-800',
            )}
            title={t('urlsTab.listView', { defaultValue: 'List view' })}
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tree')}
            className={clsx(
              'inline-flex items-center justify-center border-l border-surface-700 px-2 py-1 text-[11px] transition',
              viewMode === 'tree'
                ? 'bg-accent-500/15 text-accent-300'
                : 'text-surface-300 hover:bg-surface-800',
            )}
            title={t('urlsTab.treeView', { defaultValue: 'Tree view (URL hierarchy)' })}
          >
            <Network className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="relative">
          <button
            type="button"
            data-columns-anchor="1"
            onClick={() => setColumnPickerOpen((v) => !v)}
            disabled={allColumns.length === 0}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] transition',
              allColumns.length === 0
                ? 'cursor-not-allowed border-surface-800 text-surface-600'
                : columnPickerOpen
                  ? 'border-accent-500 bg-accent-500/15 text-accent-300'
                  : hiddenColumns.size > 0
                    ? 'border-accent-500/60 bg-accent-500/10 text-accent-300 hover:bg-accent-500/20'
                    : 'border-surface-700 text-surface-300 hover:bg-surface-800',
            )}
            title={
              allColumns.length === 0
                ? t('urlsTab.noToggleableColumns', { defaultValue: 'This tab has no toggleable columns' })
                : t('urlsTab.showHideColumns', { defaultValue: 'Show/hide columns' })
            }
          >
            <Columns3 className="h-3.5 w-3.5" />
            <span>{t('urlsTab.columns', { defaultValue: 'Columns' })}</span>
            {hiddenColumns.size > 0 && (
              <span className="rounded bg-accent-500/20 px-1 font-mono text-[10px]">
                {allColumns.length - hiddenColumns.size}/{allColumns.length}
              </span>
            )}
          </button>
          {columnPickerOpen && (
            <ColumnPickerPopover
              allColumns={allColumns}
              hiddenColumns={hiddenColumns}
              onChange={setHiddenColumns}
              onClose={() => setColumnPickerOpen(false)}
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => setExportDialogOpen(true)}
          disabled={lazy.total === 0}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] transition',
            lazy.total === 0
              ? 'cursor-not-allowed border-surface-800 text-surface-600'
              : 'border-surface-700 text-surface-300 hover:bg-surface-800',
          )}
          title={lazy.total === 0 ? t('urlsTab.noDataToExport', { defaultValue: 'No data to export' }) : t('urlsTab.exportThisTable', { defaultValue: 'Export this table' })}
        >
          <Download className="h-3.5 w-3.5" />
          <span>{t('urlsTab.export', { defaultValue: 'Export' })}</span>
        </button>
      </div>

      {viewMode === 'tree' ? (
        <UrlTreeView
          category={activeCategory}
          search={search}
          filter={filter}
          refreshKey={dataVersion}
          selectedUrlId={selectedUrlId}
          onSelect={(id) => {
            setSelectedUrlId(id);
            if (id !== null) {
              setSelectedIds(new Set([id]));
              setSelectedUrlIds([id]);
            } else {
              setSelectedIds(new Set());
              setSelectedUrlIds([]);
            }
          }}
        />
      ) : (
      <div ref={scrollRef} className="relative flex-1 select-none overflow-auto">
        <div style={{ minWidth: totalWidth, width: '100%' }}>
          {/* Header row */}
          <div
            className="sticky top-0 z-10 flex bg-surface-900 text-[11px]"
            style={{ minWidth: totalWidth, width: '100%', height: HEADER_HEIGHT }}
          >
            <div
              className="relative flex select-none items-center justify-end border-b border-r border-surface-800 px-2 font-medium text-surface-400"
              style={{
                width: rowNumWidth,
                minWidth: rowNumWidth,
                flex: `0 0 ${rowNumWidth}px`,
              }}
              title="Row number"
            >
              Row
              <div
                className="absolute -right-1 top-0 bottom-0 z-20 w-2 cursor-col-resize group hover:bg-accent-500/40"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startResize(ROW_NUM_KEY, rowNumWidth, e.clientX);
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  resetColumn(ROW_NUM_KEY);
                }}
                onClick={(e) => e.stopPropagation()}
                title="Drag to resize · double-click to reset"
              />
            </div>
            {columns.map((c, colIdx) => {
              const w = getWidth(c);
              const id = columnId(c);
              const isColSelected = selectedColumns.has(colIdx);
              const isSortCol = sortBy === c.key;
              return (
                <div
                  key={id}
                  className={clsx(
                    'group/header relative flex select-none items-center gap-1 border-b border-r border-surface-800 pl-2 pr-1 font-medium',
                    isColSelected
                      ? 'bg-accent-500/25 text-surface-50'
                      : 'text-surface-300 hover:text-surface-100',
                  )}
                  style={{ width: w, minWidth: w, flex: `0 0 ${w}px` }}
                  onMouseDown={(e) => beginColumnDrag(colIdx, e)}
                  onMouseEnter={() => {
                    if (dragRef.current?.kind === 'column') applyColumnDrag(colIdx);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const next = new Set(hiddenColumns);
                    next.add(columnId(c));
                    setHiddenColumns(next);
                  }}
                  title={translateLabel(c.header, lang) + ' ' + t('urlsTab.columnHeaderHint', { defaultValue: '(click to select · drag to multi-select · right-click to hide)' })}
                >
                  <span className="cursor-pointer truncate">{translateLabel(c.header, lang)}</span>
                  {(c.info || c.example) && (
                    <span
                      className="shrink-0"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <InfoTip info={c.info} example={c.example} />
                    </span>
                  )}
                  <button
                    type="button"
                    className={clsx(
                      'ml-auto flex shrink-0 items-center rounded px-0.5 hover:bg-surface-800',
                      isSortCol ? 'text-accent-300' : 'text-surface-600 hover:text-surface-300',
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSort(c.key);
                    }}
                    title={
                      isSortCol
                        ? `Sorted ${sortDir === 'asc' ? 'ascending' : 'descending'} — click to flip`
                        : 'Sort by this column'
                    }
                  >
                    {isSortCol ? (
                      <span className="text-[10px]">
                        {sortDir === 'asc' ? '▲' : '▼'}
                      </span>
                    ) : (
                      <ChevronsUpDown className="h-3 w-3" />
                    )}
                  </button>
                  <div
                    className="absolute -right-1 top-0 bottom-0 z-20 w-2 cursor-col-resize hover:bg-accent-500/40"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startResize(id, w, e.clientX);
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      resetColumn(id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    title="Drag to resize · double-click to reset"
                  />
                </div>
              );
            })}
            {/* Filler cell — extends the header bar across the remaining
                empty space so the table doesn't look truncated when the
                viewport is wider than the summed column widths. */}
            <div className="flex-1 border-b border-surface-800" />
          </div>

          {/* Rows viewport */}
          <div
            className="relative"
            style={{ height: virtualizer.getTotalSize(), minWidth: totalWidth, width: '100%' }}
          >
            {virtualRows.map((vi) => {
              const row = lazy.rowAt(vi.index);
              const rowSelected = row !== null && selectedIds.has(row.id);
              return (
                <div
                  key={vi.key}
                  data-index={vi.index}
                  ref={virtualizer.measureElement}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (!row) return;
                    // Right-click is always row-semantic. If the clicked
                    // row isn't in the bulk selection, replace it (and
                    // drop any cell/column picks so the menu scope is
                    // unambiguous).
                    if (!selectedIds.has(row.id)) {
                      setSelectedIds(new Set([row.id]));
                      setSelectedUrlId(row.id);
                      selectionAnchor.current = vi.index;
                      setSelectedCells(new Set());
                      setSelectedColumns(new Set());
                      void window.freecrawl.urlContextMenu({
                        url: row.url,
                        urlId: row.id,
                      });
                      return;
                    }
                    if (selectedIds.size > 1) {
                      void window.freecrawl.urlBulkContextMenu({
                        urlIds: [...selectedIds],
                      });
                    } else {
                      void window.freecrawl.urlContextMenu({
                        url: row.url,
                        urlId: row.id,
                      });
                    }
                  }}
                  className={clsx(
                    'absolute left-0 top-0 flex items-center border-b border-surface-900 text-[11px]',
                    rowSelected ? 'bg-accent-500/15' : 'hover:bg-surface-900/30',
                  )}
                  style={{
                    transform: `translateY(${vi.start}px)`,
                    height: ROW_HEIGHT,
                    minWidth: totalWidth,
                    width: '100%',
                  }}
                >
                  <div
                    className={clsx(
                      'flex cursor-pointer items-center justify-end overflow-hidden border-r border-surface-900 px-2 font-mono tabular-nums',
                      rowSelected
                        ? 'bg-accent-500/30 text-surface-50'
                        : 'text-surface-500 hover:bg-surface-800/60',
                    )}
                    style={{
                      width: rowNumWidth,
                      minWidth: rowNumWidth,
                      flex: `0 0 ${rowNumWidth}px`,
                      height: '100%',
                    }}
                    onMouseDown={(e) => {
                      if (row) beginRowDrag(row.id, vi.index, e);
                    }}
                    onMouseEnter={() => {
                      if (dragRef.current?.kind === 'row') applyRowDrag(vi.index);
                    }}
                    title="Click to select row · drag to select multiple rows"
                  >
                    {vi.index + 1}
                  </div>
                  {columns.map((c, colIdx) => {
                    const w = getWidth(c);
                    const cellSel =
                      row !== null &&
                      (selectedCells.has(`${row.id}:${colIdx}`) ||
                        selectedColumns.has(colIdx));
                    return (
                      <div
                        key={columnId(c)}
                        className={clsx(
                          'flex cursor-cell items-center overflow-hidden border-r border-surface-900 px-2',
                          cellSel
                            ? 'bg-accent-500/30 text-surface-50'
                            : 'hover:bg-surface-800/40',
                        )}
                        style={{
                          width: w,
                          minWidth: w,
                          flex: `0 0 ${w}px`,
                          height: '100%',
                        }}
                        onMouseDown={(e) => {
                          if (row) beginCellDrag(row.id, vi.index, colIdx, e);
                        }}
                        onMouseEnter={() => {
                          if (dragRef.current?.kind === 'cell') {
                            applyCellDrag(vi.index, colIdx);
                          }
                        }}
                      >
                        <Cell row={row} spec={c} />
                      </div>
                    );
                  })}
                  <div className="flex-1" />
                </div>
              );
            })}
          </div>
        </div>

        {lazy.total === 0 && lazy.isLoading && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ top: HEADER_HEIGHT }}
          >
            <div className="text-xs text-surface-500">{t('common.loading', { defaultValue: 'Loading…' })}</div>
          </div>
        )}
        {lazy.total === 0 && !lazy.isLoading && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ top: HEADER_HEIGHT }}
          >
            <div className="max-w-md text-center">
              <div className="mb-1 text-sm font-semibold text-surface-300">{t('urlsTab.noUrlsToShow', { defaultValue: 'No URLs to show' })}</div>
              <div className="text-xs text-surface-500">
                Start a crawl or choose a different category.
              </div>
            </div>
          </div>
        )}
      </div>
      )}
      <div
        className="flex shrink-0 items-center justify-end gap-4 border-t border-surface-800 bg-surface-900/60 px-3 text-[11px] text-surface-400"
        style={{ height: STATUS_BAR_HEIGHT }}
      >
        <span>
          URLs:{' '}
          <span className="font-mono tabular-nums text-surface-200">
            {lazy.total.toLocaleString()}
          </span>
          <span className="ml-1 text-surface-600">
            ({lazy.loadedRows.toLocaleString()} loaded)
          </span>
        </span>
        <span>
          Selected Rows:{' '}
          <span className="font-mono tabular-nums text-surface-200">
            {selectedIds.size.toLocaleString()}
          </span>
        </span>
        <span>
          Selected Cells:{' '}
          <span className="font-mono tabular-nums text-surface-200">
            {selectedCells.size.toLocaleString()}
          </span>
        </span>
        <span>
          Selected Columns:{' '}
          <span className="font-mono tabular-nums text-surface-200">
            {selectedColumns.size.toLocaleString()}
          </span>
        </span>
      </div>

      <AdvancedFilterDialog
        open={filterDialogOpen}
        initial={filter}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(f) => setFilter(f)}
      />

      <ErrorBoundary context="ExportDialog">
        {exportDialogOpen && (
          <ExportDialog
            open={exportDialogOpen}
            onClose={() => setExportDialogOpen(false)}
            defaultTab={activeTab}
            selectedIds={selectedIds.size > 0 ? [...selectedIds] : undefined}
          />
        )}
      </ErrorBoundary>
    </div>
  );
}

function ColumnPickerPopover({
  allColumns,
  hiddenColumns,
  onChange,
  onClose,
}: {
  allColumns: ColumnSpec[];
  hiddenColumns: Set<string>;
  onChange: (next: Set<string>) => void;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const popRef = useRef<HTMLDivElement | null>(null);
  // Outside-click closes the popover. We attach to mousedown so the
  // listener fires before any click handler inside the table can fire
  // and reopen us in the same gesture. Clicks on the anchoring "Columns"
  // button are exempted via the `data-columns-anchor` guard.
  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!popRef.current) return;
      if (popRef.current.contains(e.target as Node)) return;
      let n = e.target as HTMLElement | null;
      while (n) {
        if (n.dataset && n.dataset['columnsAnchor'] === '1') return;
        n = n.parentElement;
      }
      onClose();
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [onClose]);

  // Escape closes too — keeps the popover keyboard-accessible.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (id: string) => {
    const next = new Set(hiddenColumns);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const visibleCount = allColumns.length - hiddenColumns.size;

  return (
    <div
      ref={popRef}
      className="absolute right-0 top-full z-30 mt-1 w-80 rounded-md border border-surface-700 bg-surface-900 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-surface-800 px-3 py-2">
        <div className="text-[12px] font-semibold text-surface-100">
          {t('urlsTab.columns', { defaultValue: 'Columns' })} ({visibleCount}/{allColumns.length})
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => onChange(new Set())}
            className="rounded border border-surface-700 px-1.5 py-0.5 text-surface-300 hover:bg-surface-800"
            title={t('urlsTab.makeAllVisible', { defaultValue: 'Make every column visible' })}
          >
            {t('urlsTab.showAll', { defaultValue: 'Show all' })}
          </button>
          <button
            type="button"
            onClick={() => onChange(new Set(allColumns.map((c) => columnId(c))))}
            className="rounded border border-surface-700 px-1.5 py-0.5 text-surface-300 hover:bg-surface-800"
            title={t('urlsTab.hideAllExceptRow', { defaultValue: 'Hide every column except Row #' })}
          >
            {t('urlsTab.hideAll', { defaultValue: 'Hide all' })}
          </button>
        </div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto py-1">
        {allColumns.map((c) => {
          const id = columnId(c);
          const visible = !hiddenColumns.has(id);
          return (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2 px-3 py-1 text-[11px] text-surface-200 hover:bg-surface-800"
            >
              <input
                type="checkbox"
                checked={visible}
                onChange={() => toggle(id)}
                className="h-3 w-3 accent-blue-500"
              />
              <span className="truncate">{translateLabel(c.header, lang)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function Cell({ row, spec }: { row: CrawlUrlRow | null; spec: ColumnSpec }) {
  if (row === null) {
    return <span className="text-surface-700">…</span>;
  }
  const raw = row[spec.key];
  // Booleans render as "Y" / "—" rather than the JS-default "true"/"false".
  // Matches Screaming Frog's compact convention for flag columns
  // (Loop, Sequence Break, Self-Ref Missing, …).
  const value =
    raw === null || raw === undefined
      ? ''
      : typeof raw === 'boolean'
        ? raw ? 'Y' : ''
        : String(raw);

  if (spec.kind === 'status') {
    const code = row.statusCode;
    return (
      <span
        className={clsx(
          'inline-block rounded px-1.5 font-mono text-[10px]',
          statusClasses(code),
        )}
      >
        {code ?? '—'}
      </span>
    );
  }

  if (spec.kind === 'indexability') {
    const v = row.indexability;
    return (
      <span
        className={clsx('truncate', v === 'indexable' ? 'text-emerald-400' : 'text-amber-400')}
        title={v}
      >
        {v === 'indexable' ? 'Indexable' : 'Non-Indexable'}
      </span>
    );
  }

  if (spec.kind === 'indexability-status') {
    const label = indexabilityStatusLabel(row.indexability);
    if (label === '') {
      return <span className="text-surface-700">—</span>;
    }
    return (
      <span className="block truncate text-surface-200" title={label}>
        {label}
      </span>
    );
  }

  if (spec.kind === 'number') {
    return (
      <span className="block truncate font-mono tabular-nums text-surface-200">
        {raw === null || raw === undefined ? '—' : Number(raw).toLocaleString()}
      </span>
    );
  }

  if (spec.kind === 'mono') {
    return (
      <span className="block truncate font-mono text-surface-100" title={value}>
        {value || <span className="text-surface-700">—</span>}
      </span>
    );
  }

  return (
    <span className="block truncate text-surface-200" title={value}>
      {value || <span className="text-surface-700">—</span>}
    </span>
  );
}

function indexabilityStatusLabel(v: CrawlUrlRow['indexability']): string {
  switch (v) {
    case 'indexable':
      return '';
    case 'non-indexable:noindex':
      return 'noindex';
    case 'non-indexable:canonical':
      return 'Canonicalised';
    case 'non-indexable:robots-blocked':
      return 'Blocked by robots.txt';
    case 'non-indexable:redirect':
      return 'Redirected';
    case 'non-indexable:client-error':
      return 'Client Error';
    case 'non-indexable:server-error':
      return 'Server Error';
    default:
      return v;
  }
}

function statusClasses(code: number | null): string {
  if (code === null) return 'bg-surface-800 text-surface-400';
  if (code >= 200 && code < 300) return 'bg-emerald-900/60 text-emerald-300';
  if (code >= 300 && code < 400) return 'bg-amber-900/60 text-amber-300';
  if (code >= 400 && code < 500) return 'bg-orange-900/60 text-orange-300';
  if (code >= 500) return 'bg-red-900/60 text-red-300';
  return 'bg-surface-800 text-surface-400';
}
