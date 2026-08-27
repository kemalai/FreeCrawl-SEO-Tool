import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronsUpDown,
  Columns3,
  Download,
  Filter,
  GripVertical,
  Layers,
  List,
  Network,
  Pin,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type {
  AdvancedFilter,
  CrawlUrlRow,
  UrlCategory,
  UrlGridMenuScope,
} from '@freecrawl/shared-types';
import { useAppStore, TAB_QUICK_FILTERS, type TabKey } from '../store.js';
import { COLUMN_SPECS, columnId, type ColumnSpec } from './columns.js';
import { useLazyUrlRows } from '../hooks/useLazyUrlRows.js';
import { AdvancedFilterDialog } from '../components/AdvancedFilterDialog.js';
import { DuplicatesGroupedView } from '../components/DuplicatesGroupedView.js';
import { UrlTreeView } from '../components/UrlTreeView.js';
import { ErrorBoundary } from '../components/ErrorBoundary.js';
import { ExportDialog } from '../components/ExportDialog.js';
import { InfoTip } from '../components/InfoTip.js';
import { translateLabel } from '../i18n/labels.js';
import {
  copySelection,
  isAdditiveClick,
  isGridCopyShortcut,
  isMacSecondaryClick,
  markGridActive,
  ownsGridCopy,
  toTsvLine,
  writeTextToClipboard,
  type CellSource,
} from '../utils/clipboard.js';

const ROW_HEIGHT = 24;
const HEADER_HEIGHT = 28;
const MIN_COL_WIDTH = 48;
const ROW_NUM_DEFAULT_WIDTH = 56;
const ROW_NUM_KEY = '__row_num__';
const STATUS_BAR_HEIGHT = 22;
/** Identifies this grid to the copy-shortcut arbitration in `clipboard.ts`. */
const GRID_ID = 'urls';
// Rows pulled per query when copying whole columns. Big enough that a
// 100k-row table is ~50 round-trips, small enough that each one stays a
// short job on the reader worker instead of a multi-second stall.
const COPY_FETCH_CHUNK = 2000;
// How long the "copied N cells" acknowledgement stays up.
const COPY_ACK_MS = 2500;
const PREFS_PREFIX = 'col-widths:';
const PREFS_HIDDEN_PREFIX = 'col-hidden:';
const PREFS_PINNED_LEFT_PREFIX = 'col-pinned-left:';
const PREFS_ORDER_PREFIX = 'col-order:';

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

/** Per-tab persistence for the pinned-left column set. Order is preserved
 *  so users can pin columns in the order they want them stacked at the
 *  left edge — first-pinned ends up nearest the row-number column. */
function loadPinnedLeft(tab: TabKey): string[] {
  const value = window.freecrawl.prefsGet(PREFS_PINNED_LEFT_PREFIX + tab);
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  return [];
}

function savePinnedLeft(tab: TabKey, pinned: string[]): void {
  try {
    window.freecrawl.prefsSet(PREFS_PINNED_LEFT_PREFIX + tab, pinned);
  } catch {
    /* best-effort */
  }
}

/** Per-tab user-defined column ordering, applied AFTER hide-filter +
 *  pin-prepend. Stored as an array of column ids in left-to-right order
 *  for the *unpinned* region. Columns that don't appear in the stored
 *  array fall through to their `COLUMN_SPECS` default position so a
 *  partial preference (the user dragged only one column) doesn't reset
 *  everything else. */
function loadColumnOrder(tab: TabKey): string[] {
  const value = window.freecrawl.prefsGet(PREFS_ORDER_PREFIX + tab);
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  return [];
}

function saveColumnOrder(tab: TabKey, order: string[]): void {
  try {
    window.freecrawl.prefsSet(PREFS_ORDER_PREFIX + tab, order);
  } catch {
    /* best-effort */
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
  // Active custom-extraction rule names → offered as filterable fields in
  // the Advanced Filter dialog. Reference is stable unless the config edits.
  const customExtractionRules = useAppStore((s) => s.config.customExtractionRules);
  const extractionFieldNames = useMemo(
    () =>
      (customExtractionRules ?? [])
        .map((r) => r.name)
        .filter((n) => n.trim().length > 0),
    [customExtractionRules],
  );
  const setTabView = useAppStore((s) => s.setTabView);
  // Seed search / sort / filter from this tab's saved view state (if the user
  // set one earlier this session and came back). The [activeTab] effect below
  // restores on later tab switches and its cleanup saves the outgoing tab's
  // state; these lazy initialisers cover the fresh mount after a full unmount
  // (e.g. returning from Visualization / PageSpeed). Read once from the store
  // at mount — the initialisers only run then.
  const [search, setSearch] = useState(
    () => useAppStore.getState().tabView[activeTab]?.search ?? '',
  );
  const [sortBy, setSortBy] = useState<keyof CrawlUrlRow | undefined>(
    () => useAppStore.getState().tabView[activeTab]?.sortBy,
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(
    () => useAppStore.getState().tabView[activeTab]?.sortDir ?? 'asc',
  );
  const [filter, setFilter] = useState<AdvancedFilter | null>(
    () => useAppStore.getState().tabView[activeTab]?.filter ?? null,
  );
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  // Mirror the live view state so the [activeTab] effect's cleanup can save
  // the latest values for the tab being left without re-subscribing.
  const viewStateRef = useRef({ search, sortBy, sortDir, filter });
  viewStateRef.current = { search, sortBy, sortDir, filter };
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  /** View mode toggle — list (flat virtual table), tree (URL-path
   *  hierarchy), or cluster (Duplicates-tab-only near-duplicate cluster
   *  grouping). Per-tab + persisted across mounts via prefs. */
  const [viewMode, setViewMode] = useState<'list' | 'tree' | 'cluster'>(() => {
    const stored = window.freecrawl.prefsGet(`view-mode:${activeTab}`);
    if (stored === 'tree') return 'tree';
    if (stored === 'cluster' && activeTab === 'duplicates') return 'cluster';
    return 'list';
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
  /** Row data captured the moment a row is pulled into a selection.
   *
   *  The selection sets deliberately store url ids, not row indexes, so
   *  they survive the re-sorts a running crawl causes. A copy, though,
   *  needs two things ids alone can't give: the row's values and its
   *  position in the table. The lazy loader holds at most ~8k rows and
   *  evicts by LRU, so rows the user selected can be gone from its cache
   *  by the time Ctrl+C is pressed — capturing them here is what keeps a
   *  large drag-selection copyable in full instead of silently
   *  truncated. Fresh data still wins: the copy re-reads the live row
   *  whenever the loader still has it and only then falls back here. */
  const rowSnapshots = useRef(new Map<number, { index: number; row: CrawlUrlRow }>());
  const rememberRow = useCallback((index: number, row: CrawlUrlRow) => {
    rowSnapshots.current.set(row.id, { index, row });
  }, []);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    loadStoredWidths(activeTab),
  );
  const [hiddenColumns, setHiddenColumnsState] = useState<Set<string>>(() =>
    loadHiddenColumns(activeTab),
  );
  /** Ordered list of column ids pinned to the left edge. Order = stacking
   *  order from inner (next to row-num) outward. Stored as a list (not a
   *  Set) so the stacking order is deterministic across reloads. */
  const [pinnedLeftOrder, setPinnedLeftOrderState] = useState<string[]>(() =>
    loadPinnedLeft(activeTab),
  );
  /** User-defined order of UNPINNED columns. Pinned columns are
   *  positioned via {@link pinnedLeftOrder}; this list governs only the
   *  scrollable region. Drag-drop on a header writes here. */
  const [columnOrder, setColumnOrderState] = useState<string[]>(() =>
    loadColumnOrder(activeTab),
  );
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Ref on the "Columns" toolbar button so the popover (rendered via
   *  portal at document.body) can compute its position from the
   *  anchor's bounding rect — without the portal it would be clipped
   *  by the resizable bottom detail panel which lives in a separate
   *  stacking context. */
  const columnsAnchorRef = useRef<HTMLButtonElement>(null);

  const allColumns = COLUMN_SPECS[activeTab];
  // Visible columns drive the rendered header + body. Hidden ids that no
  // longer exist on the active tab (e.g. user switched between tabs with
  // different specs) are silently filtered out — they remain in the saved
  // set so toggling back to the originating tab restores them.
  //
  // Pinned columns are floated to the head of the visible list (in the
  // order persisted to prefs) so the row render loop sees pinned cells
  // first — that order, combined with the cumulative-offset table built
  // below, drives the CSS `position: sticky; left: …` layout. Visual
  // outcome: the row-number cell, then the pinned strip in user-chosen
  // order, then the scrollable region.
  const columns = useMemo(() => {
    const visible = allColumns.filter((c) => !hiddenColumns.has(columnId(c)));
    const byId = new Map(visible.map((c) => [columnId(c), c] as const));

    // (1) Pinned region in pin-stack order.
    const pinned: ColumnSpec[] = [];
    for (const id of pinnedLeftOrder) {
      const c = byId.get(id);
      if (c) {
        pinned.push(c);
        byId.delete(id);
      }
    }

    // (2) Unpinned region — explicit user order (drag-drop) first, then
    // anything left over in `COLUMN_SPECS` default order so partial
    // preferences don't reset newly-added columns.
    const unpinned: ColumnSpec[] = [];
    for (const id of columnOrder) {
      const c = byId.get(id);
      if (c) {
        unpinned.push(c);
        byId.delete(id);
      }
    }
    for (const c of allColumns) {
      const id = columnId(c);
      if (byId.has(id)) {
        unpinned.push(c);
        byId.delete(id);
      }
    }

    return [...pinned, ...unpinned];
  }, [allColumns, hiddenColumns, pinnedLeftOrder, columnOrder]);

  const setHiddenColumns = useCallback(
    (next: Set<string>) => {
      setHiddenColumnsState(next);
      saveHiddenColumns(activeTab, next);
    },
    [activeTab],
  );

  const setPinnedLeftOrder = useCallback(
    (next: string[]) => {
      setPinnedLeftOrderState(next);
      savePinnedLeft(activeTab, next);
    },
    [activeTab],
  );

  const setColumnOrder = useCallback(
    (next: string[]) => {
      setColumnOrderState(next);
      saveColumnOrder(activeTab, next);
    },
    [activeTab],
  );

  /** Set view for callers that only need membership lookups. */
  const pinnedLeftSet = useMemo(
    () => new Set(pinnedLeftOrder),
    [pinnedLeftOrder],
  );

  /** Toggle a column id between pinned and unpinned. When pinning, the
   *  new id is appended to the right end of the pinned strip so the
   *  newest pin sits next to the unpinned region — keeps existing pins
   *  visually stable. */
  const togglePinned = useCallback(
    (id: string) => {
      const idx = pinnedLeftOrder.indexOf(id);
      if (idx >= 0) {
        setPinnedLeftOrder(pinnedLeftOrder.filter((x) => x !== id));
      } else {
        setPinnedLeftOrder([...pinnedLeftOrder, id]);
      }
    },
    [pinnedLeftOrder, setPinnedLeftOrder],
  );

  /** dnd-kit pointer sensor with a 5 px activation constraint so a quick
   *  click on the grip handle doesn't start a drag (the user still has
   *  to deliberately drag). Without this, clicks would race the cell's
   *  onMouseDown handler for column-selection drag. */
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    setColumnWidths(loadStoredWidths(activeTab));
    setHiddenColumnsState(loadHiddenColumns(activeTab));
    setPinnedLeftOrderState(loadPinnedLeft(activeTab));
    setColumnOrderState(loadColumnOrder(activeTab));
    setColumnPickerOpen(false);
    // Restore this tab's saved view state (search box / sort column /
    // advanced filter) rather than blank it. This state is scoped PER TAB —
    // a sort by "depth" on Internal makes no sense on Response Codes, a filter
    // clause on `images_missing_alt` is meaningless outside Images — so it
    // must never leak across tabs (the 2026-06-01 bug). Per-tab keying is what
    // prevents that leak; blank-on-switch also threw the state away when the
    // user merely left and returned to the SAME tab, which is the regression
    // being fixed here. The cleanup below saves the outgoing tab's state.
    const saved = useAppStore.getState().tabView[activeTab];
    setSearch(saved?.search ?? '');
    setSortBy(saved?.sortBy);
    setSortDir(saved?.sortDir ?? 'asc');
    setFilter(saved?.filter ?? null);
    setFilterDialogOpen(false);
    // Pick up the persisted view-mode for the new tab. Cluster mode is
    // duplicates-tab-only — switching to any other tab while it was the
    // active mode falls back to list so the toolbar toggle doesn't get
    // stuck in an unreachable state.
    const stored = window.freecrawl.prefsGet(`view-mode:${activeTab}`);
    if (stored === 'tree') setViewMode('tree');
    else if (stored === 'cluster' && activeTab === 'duplicates') setViewMode('cluster');
    else setViewMode('list');
    // Save the outgoing tab's latest view state on the way out (tab switch or
    // full unmount into a non-table view). `activeTab` here is captured as the
    // tab being left; the ref carries its current search / sort / filter.
    return () => {
      setTabView(activeTab, viewStateRef.current);
    };
  }, [activeTab, setTabView]);

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
    rowSnapshots.current.clear();
  }, [activeCategory, activeTab, search, sortBy, sortDir, hiddenColumns]);

  // Cell and column selections are keyed by column *index*, so any
  // reshuffle of the column layout silently re-points them at a
  // different column — the highlight jumps and a copy would hand over
  // the wrong values. Show/hide is covered by the reset above (it keys
  // on `hiddenColumns`); reorder and pin need their own clear. Row
  // selection is index-free, so it survives.
  useEffect(() => {
    setSelectedCells(new Set());
    setSelectedColumns(new Set());
    cellAnchor.current = null;
  }, [columnOrder, pinnedLeftOrder]);

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

  /** Cumulative left-offset for each pinned column. Maps column id →
   *  pixel offset from the table's left edge so the cell's
   *  `position: sticky; left: <offset>` lands flush against the previous
   *  pinned column. Pinned columns are always rendered first in
   *  `columns`, so iterating from the front stops as soon as we hit a
   *  non-pinned column. */
  const pinnedLeftOffsets = useMemo(() => {
    const map = new Map<string, number>();
    let acc = rowNumWidth;
    for (const c of columns) {
      const id = columnId(c);
      if (!pinnedLeftSet.has(id)) break;
      map.set(id, acc);
      acc += getWidth(c);
    }
    return map;
  }, [columns, pinnedLeftSet, getWidth, rowNumWidth]);

  /** Number of pinned columns currently rendered as sticky — used by
   *  the resize handler to recompute downstream offsets implicitly via
   *  state change. */
  const pinnedCount = pinnedLeftOffsets.size;

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

  /** Apply a drag-drop column reorder. Pin state is preserved: drags
   *  inside the pinned strip reorder `pinnedLeftOrder`; drags inside the
   *  unpinned strip reorder `columnOrder`. Cross-strip drags snap back
   *  silently — the user has to explicitly toggle pin via the column
   *  picker if they want to change the partition. This keeps pin /
   *  reorder as two orthogonal concepts the user can reason about
   *  independently. */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const fromId = String(active.id);
      const toId = String(over.id);
      const fromIsPinned = pinnedLeftSet.has(fromId);
      const toIsPinned = pinnedLeftSet.has(toId);
      if (fromIsPinned !== toIsPinned) return;

      if (fromIsPinned) {
        const list = pinnedLeftOrder.slice();
        const fi = list.indexOf(fromId);
        const ti = list.indexOf(toId);
        if (fi < 0 || ti < 0) return;
        list.splice(fi, 1);
        list.splice(ti, 0, fromId);
        setPinnedLeftOrder(list);
      } else {
        // Snapshot the *currently displayed* unpinned order — the stored
        // `columnOrder` may be partial, but what's visible is what the
        // user is reordering, so persist the full sequence to avoid
        // surprising fall-through behaviour for never-dragged columns.
        const unpinnedIds: string[] = [];
        for (const c of columns) {
          const id = columnId(c);
          if (!pinnedLeftSet.has(id)) unpinnedIds.push(id);
        }
        const fi = unpinnedIds.indexOf(fromId);
        const ti = unpinnedIds.indexOf(toId);
        if (fi < 0 || ti < 0) return;
        unpinnedIds.splice(fi, 1);
        unpinnedIds.splice(ti, 0, fromId);
        setColumnOrder(unpinnedIds);
      }
    },
    [columns, pinnedLeftOrder, pinnedLeftSet, setColumnOrder, setPinnedLeftOrder],
  );

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
    const clicked = lazy.rowAt(rowIndex);
    if (clicked) rememberRow(rowIndex, clicked);
    if (e.shiftKey && selectionAnchor.current !== null) {
      const anchorIdx = selectionAnchor.current;
      const [lo, hi] = anchorIdx < rowIndex ? [anchorIdx, rowIndex] : [rowIndex, anchorIdx];
      const next = new Set(selectedIds);
      for (let i = lo; i <= hi; i++) {
        const r = lazy.rowAt(i);
        if (r) {
          next.add(r.id);
          rememberRow(i, r);
        }
      }
      setSelectedIds(next);
      setSelectedUrlId(rowId);
      return;
    }
    if (isAdditiveClick(e)) {
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
    const clicked = lazy.rowAt(rowIndex);
    if (clicked) rememberRow(rowIndex, clicked);

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
        if (r) {
          next.add(`${r.id}:${colIdx}`);
          rememberRow(i, r);
        }
      }
      setSelectedCells(next);
      setSelectedUrlId(rowId);
      return;
    }
    if (isAdditiveClick(e)) {
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
    if (isAdditiveClick(e)) {
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
        rememberRow(i, r);
        for (let c = loC; c <= hiC; c++) {
          next.add(`${r.id}:${c}`);
        }
      }
      setSelectedCells(next);
      const endRow = lazy.rowAt(toIdx);
      if (endRow) setSelectedUrlId(endRow.id);
    },
    [lazy, rememberRow, setSelectedUrlId],
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
        if (r) {
          next.add(r.id);
          rememberRow(i, r);
        }
      }
      setSelectedIds(next);
      const endRow = lazy.rowAt(toIdx);
      if (endRow) setSelectedUrlId(endRow.id);
    },
    [lazy, rememberRow, setSelectedUrlId],
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
    // macOS Ctrl+click is the OS secondary click: it fires mousedown *and*
    // contextmenu. Starting a drag here would grow the selection at the
    // exact moment the menu is about to act on it.
    if (isMacSecondaryClick(e)) return;
    // Shift extends from the existing anchor using click semantics — no drag.
    if (e.shiftKey) {
      handleCellClick(rowId, colIdx, idx, e);
      return;
    }
    e.preventDefault();
    const additive = isAdditiveClick(e);
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
    // macOS Ctrl+click is the OS secondary click: it fires mousedown *and*
    // contextmenu. Starting a drag here would grow the selection at the
    // exact moment the menu is about to act on it.
    if (isMacSecondaryClick(e)) return;
    if (e.shiftKey) {
      handleRowClick(rowId, idx, e);
      return;
    }
    e.preventDefault();
    const additive = isAdditiveClick(e);
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
    // macOS Ctrl+click is the OS secondary click: it fires mousedown *and*
    // contextmenu. Starting a drag here would grow the selection at the
    // exact moment the menu is about to act on it.
    if (isMacSecondaryClick(e)) return;
    if (e.shiftKey) {
      handleHeaderClick(colIdx, e);
      return;
    }
    e.preventDefault();
    const additive = isAdditiveClick(e);
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

  // ──────── Clipboard ────────

  const [copyState, setCopyState] = useState<
    { phase: 'copying' } | { phase: 'done'; cells: number } | null
  >(null);
  const copyInFlight = useRef(false);

  /** Everything the document-level Ctrl+C listener needs, refreshed on
   *  every render. A ref rather than effect deps so the listener is
   *  registered once instead of being torn down and re-added on every
   *  mouseenter of a drag-select. */
  const copyContext: CopyContext = {
    columns,
    lang,
    rowAt: lazy.rowAt,
    selectedCells,
    selectedIds,
    selectedColumns,
    snapshots: rowSnapshots.current,
    total: lazy.total,
    query: {
      category: activeCategory,
      search: search || undefined,
      sortBy,
      sortDir,
      filter: filter ?? undefined,
    },
  };
  const copyCtx = useRef(copyContext);
  copyCtx.current = copyContext;

  /**
   * Copy the current selection to the clipboard as TSV.
   *
   * The three selection layers are three different asks: a column pick
   * means "the whole column", a cell pick means "these values", a row
   * pick means "these records" (every visible column of each). Cells and
   * rows resolve locally from the snapshot map; a column has to go back
   * to SQLite, because it extends far past anything the lazy loader is
   * holding.
   *
   * `scope` is passed by the context menu, which already decided which
   * layer the right-click landed in — the layers can overlap (Ctrl+click
   * a header while cells are picked), and the menu's label has to match
   * what actually gets copied. Ctrl+C omits it and takes the default
   * precedence instead.
   */
  const copySelectionToClipboard = useCallback(
    async (scope?: CopyScope): Promise<void> => {
      if (copyInFlight.current) return;
      const ctx = copyCtx.current;
      const effective =
        scope ??
        (ctx.selectedColumns.size > 0
          ? 'columns'
          : ctx.selectedCells.size > 0
            ? 'cells'
            : ctx.selectedIds.size > 0
              ? 'rows'
              : null);
      if (effective === null) return;
      copyInFlight.current = true;
      try {
        if (effective === 'columns') {
          setCopyState({ phase: 'copying' });
          setCopyState({ phase: 'done', cells: await copyWholeColumns(ctx) });
          return;
        }
        backfillSnapshots(
          ctx,
          effective === 'cells' ? rowIdsInKeys(ctx.selectedCells) : ctx.selectedIds,
        );
        const source = cellSource(ctx);
        if (effective === 'cells') {
          setCopyState({
            phase: 'done',
            cells: await copySelection(ctx.selectedCells, source),
          });
          return;
        }
        // Rows: "these records" — every visible column of each.
        const keys = new Set<string>();
        for (const id of ctx.selectedIds) {
          for (let c = 0; c < ctx.columns.length; c++) keys.add(`${id}:${c}`);
        }
        setCopyState({ phase: 'done', cells: await copySelection(keys, source) });
      } catch {
        // A failed copy leaves the clipboard untouched; drop the pending
        // "Copying…" so the status bar doesn't hang on it forever.
        setCopyState(null);
      } finally {
        copyInFlight.current = false;
      }
    },
    [],
  );

  // Ctrl/Cmd+C copies the selection. Document-level, so having a
  // selection is the only precondition — the user doesn't have to focus
  // the table first. preventDefault does more than suppress the native
  // copy here: on macOS the Edit ▸ Copy item re-dispatches a synthetic
  // keydown and reads `defaultPrevented` to decide whether to fall
  // through to the native copy (see menu.ts / App.tsx).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isGridCopyShortcut(e)) return;
      // Tree and cluster views render their own bodies — the table's
      // selection isn't on screen, so Ctrl+C isn't ours to claim.
      if (viewMode !== 'list') return;
      // Nor is it when the user's last click was in the detail panel's
      // links table, which keeps its own selection and its own listener.
      if (!ownsGridCopy(GRID_ID)) return;
      const ctx = copyCtx.current;
      if (
        ctx.selectedCells.size === 0 &&
        ctx.selectedIds.size === 0 &&
        ctx.selectedColumns.size === 0
      ) {
        return;
      }
      e.preventDefault();
      void copySelectionToClipboard();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [copySelectionToClipboard, viewMode]);

  // The acknowledgement fades on its own — it confirms an action, it
  // isn't a state the user has to dismiss.
  useEffect(() => {
    if (copyState?.phase !== 'done') return;
    const id = setTimeout(() => setCopyState(null), COPY_ACK_MS);
    return () => clearTimeout(id);
  }, [copyState]);

  // Release the snapshots once nothing is selected. Without this, a long
  // session of drag-selecting across a 100k-row table would keep every
  // row it ever touched alive on the heap.
  useEffect(() => {
    if (selectedCells.size === 0 && selectedIds.size === 0) {
      rowSnapshots.current.clear();
    }
  }, [selectedCells, selectedIds]);

  // ──────── Context menu ────────

  /** Scope of the menu currently open, for the pushed-back Copy item. */
  const pendingCopyScope = useRef<CopyScope | null>(null);

  // The context menu's Copy item is executed here, not in main — main
  // has no idea what a cell says. Scope comes from the click that opened
  // the menu so the copy matches the item's label.
  useEffect(() => {
    const off = window.freecrawl.onUrlGridCopy(() => {
      const scope = pendingCopyScope.current;
      if (scope === null) return;
      pendingCopyScope.current = null;
      void copySelectionToClipboard(scope);
    });
    return off;
  }, [copySelectionToClipboard]);

  /** Url ids in the order their rows appear in the table. */
  const inDisplayOrder = (ids: Iterable<number>): number[] =>
    [...new Set(ids)].sort(
      (a, b) =>
        (rowSnapshots.current.get(a)?.index ?? Number.MAX_SAFE_INTEGER) -
        (rowSnapshots.current.get(b)?.index ?? Number.MAX_SAFE_INTEGER),
    );

  /** Distinct rows touched by the current cell selection, in display order. */
  const rowIdsFromCells = (): number[] => inDisplayOrder(rowIdsInKeys(selectedCells));

  /** Whether any cell of this row is in the cell selection. Linear, but
   *  it only runs on right-click and the selection bounds it. */
  const rowHasSelectedCell = (id: number): boolean => {
    const prefix = `${id}:`;
    for (const k of selectedCells) if (k.startsWith(prefix)) return true;
    return false;
  };

  /**
   * Right-click inside the grid.
   *
   * This used to collapse everything to the clicked row before showing a
   * menu, which threw away whatever the user had just selected — pick
   * eight cells, right-click one of them, and you were left with one row
   * and a menu that could only act on it. A click *inside* any of the
   * three selection layers now keeps that selection and scopes the menu
   * to it; only a click outside every layer replaces the selection,
   * which is what a grid is expected to do.
   *
   * `colIdx` is null for the row-number cell, where a click is
   * row-semantic by definition.
   */
  const handleContextMenu = (
    row: CrawlUrlRow,
    rowIndex: number,
    colIdx: number | null,
    e: React.MouseEvent,
  ): void => {
    e.preventDefault();
    e.stopPropagation();

    // On a data cell, "inside the selection" means that exact cell. On
    // the row-number cell there is no column to match, so any selected
    // cell in the row counts — right-clicking the row number of a row
    // you just drag-selected shouldn't throw the selection away either.
    const inCells =
      selectedCells.size > 0 &&
      (colIdx !== null
        ? selectedCells.has(`${row.id}:${colIdx}`)
        : rowHasSelectedCell(row.id));
    const inColumns = colIdx !== null && selectedColumns.has(colIdx);
    const inRows = selectedIds.has(row.id);

    let scope: UrlGridMenuScope;
    let urlIds: number[];
    if (inCells) {
      scope = 'cells';
      urlIds = rowIdsFromCells();
    } else if (inColumns) {
      // A column selection spans the whole table, so Re-Spider / Remove
      // at that scale would be a footgun — they stay on the clicked row.
      // Only the copy item honours the full column.
      scope = 'columns';
      urlIds = [row.id];
    } else if (inRows) {
      scope = selectedIds.size > 1 ? 'rows' : 'row';
      urlIds = inDisplayOrder(selectedIds);
    } else {
      clearCellAndColumn();
      setSelectedIds(new Set([row.id]));
      setSelectedUrlId(row.id);
      selectionAnchor.current = rowIndex;
      rememberRow(rowIndex, row);
      scope = 'row';
      urlIds = [row.id];
    }

    // Remembered for the Copy item, which main pushes back rather than
    // returning (see the `urlGridCopy` channel). Only one context menu
    // can be open at a time, so a single slot is enough.
    pendingCopyScope.current =
      scope === 'cells' ? 'cells' : scope === 'columns' ? 'columns' : 'rows';
    void window.freecrawl.urlGridContextMenu({
      scope,
      urlIds,
      url: row.url,
      cellCount: selectedCells.size,
      columnCount: selectedColumns.size,
    });
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
          {activeTab === 'duplicates' && (
            <button
              type="button"
              onClick={() => setViewMode('cluster')}
              className={clsx(
                'inline-flex items-center justify-center border-l border-surface-700 px-2 py-1 text-[11px] transition',
                viewMode === 'cluster'
                  ? 'bg-accent-500/15 text-accent-300'
                  : 'text-surface-300 hover:bg-surface-800',
              )}
              title={t('urlsTab.clusterView', {
                defaultValue: 'Cluster view (grouped by near-duplicate clusters)',
              })}
            >
              <Layers className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="relative">
          <button
            ref={columnsAnchorRef}
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
              anchorRef={columnsAnchorRef}
              allColumns={allColumns}
              hiddenColumns={hiddenColumns}
              pinnedLeft={pinnedLeftSet}
              onChange={setHiddenColumns}
              onTogglePin={togglePinned}
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
      ) : viewMode === 'cluster' ? (
        <DuplicatesGroupedView />
      ) : (
      <div
        ref={scrollRef}
        className="relative flex-1 select-none overflow-auto"
        onMouseDown={() => markGridActive(GRID_ID)}
      >
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
                // Row-number cell is always pinned at the table's left
                // edge so the index never scrolls out of view. Background
                // matches the header so cells scrolling underneath are
                // masked.
                position: 'sticky',
                left: 0,
                zIndex: 13,
                background: 'rgb(23 23 23)',
              }}
              title={t('urlsTab.rowNumberTitle', { defaultValue: 'Row number' })}
            >
              {t('urlsTab.rowHeader', { defaultValue: 'Row' })}
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
                title={t('urlsTab.resizeHint', {
                  defaultValue: 'Drag to resize · double-click to reset',
                })}
              />
            </div>
            <DndContext
              sensors={dndSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columns.map((c) => columnId(c))}
                strategy={horizontalListSortingStrategy}
              >
                {columns.map((c, colIdx) => {
                  const id = columnId(c);
                  const stickyLeft = pinnedLeftOffsets.get(id);
                  return (
                    <SortableHeaderCell
                      key={id}
                      id={id}
                      spec={c}
                      colIdx={colIdx}
                      width={getWidth(c)}
                      lang={lang}
                      isColSelected={selectedColumns.has(colIdx)}
                      isSortCol={sortBy === c.key}
                      sortDir={sortDir}
                      stickyLeft={stickyLeft}
                      isPinned={stickyLeft !== undefined}
                      isLastPinned={stickyLeft !== undefined && colIdx + 1 === pinnedCount}
                      onSort={handleSort}
                      onBeginColumnDrag={beginColumnDrag}
                      onColumnMouseEnter={() => {
                        if (dragRef.current?.kind === 'column') applyColumnDrag(colIdx);
                      }}
                      onContextHide={(hid) => {
                        const next = new Set(hiddenColumns);
                        next.add(hid);
                        setHiddenColumns(next);
                      }}
                      onStartResize={startResize}
                      onResetColumn={resetColumn}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
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
                  // Row-level fallback: the row-number cell and the
                  // trailing filler. Data cells handle it themselves so
                  // the menu knows which column was clicked.
                  onContextMenu={(e) => {
                    if (row) handleContextMenu(row, vi.index, null, e);
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
                      // Always-pinned row index. Solid background masks
                      // cells scrolling underneath; selection state still
                      // wins (the conditional bg-accent-500/30 class
                      // overrides the inline background via class
                      // ordering, but Tailwind's accent class won't beat
                      // an inline style, so paint the body-default and
                      // let the selected highlight come from the cell's
                      // outer ring + text colour).
                      position: 'sticky',
                      left: 0,
                      zIndex: 9,
                      background: rowSelected
                        ? 'rgb(37 99 235 / 0.30)'
                        : 'rgb(10 10 10)',
                    }}
                    onMouseDown={(e) => {
                      if (row) beginRowDrag(row.id, vi.index, e);
                    }}
                    onMouseEnter={() => {
                      if (dragRef.current?.kind === 'row') applyRowDrag(vi.index);
                    }}
                    title={t('urlsTab.rowSelectHint', {
                      defaultValue: 'Click to select row · drag to select multiple rows',
                    })}
                  >
                    {vi.index + 1}
                  </div>
                  {columns.map((c, colIdx) => {
                    const w = getWidth(c);
                    const id = columnId(c);
                    const cellSel =
                      row !== null &&
                      (selectedCells.has(`${row.id}:${colIdx}`) ||
                        selectedColumns.has(colIdx));
                    const stickyLeft = pinnedLeftOffsets.get(id);
                    const isPinned = stickyLeft !== undefined;
                    const isLastPinned = isPinned && colIdx + 1 === pinnedCount;
                    return (
                      <div
                        key={id}
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
                          ...(isPinned && {
                            position: 'sticky' as const,
                            left: stickyLeft,
                            zIndex: 8,
                            background: cellSel
                              ? 'rgb(37 99 235 / 0.30)'
                              : rowSelected
                                ? 'rgb(37 99 235 / 0.15)'
                                : 'rgb(10 10 10)',
                            boxShadow: isLastPinned
                              ? '2px 0 4px rgba(0,0,0,0.4)'
                              : undefined,
                          }),
                        }}
                        onMouseDown={(e) => {
                          if (row) beginCellDrag(row.id, vi.index, colIdx, e);
                        }}
                        onMouseEnter={() => {
                          if (dragRef.current?.kind === 'cell') {
                            applyCellDrag(vi.index, colIdx);
                          }
                        }}
                        onContextMenu={(e) => {
                          if (row) handleContextMenu(row, vi.index, colIdx, e);
                        }}
                      >
                        <Cell row={row} spec={c} lang={lang} />
                      </div>
                    );
                  })}
                  <div className="flex-1" />
                </div>
              );
            })}
          </div>
        </div>

        {lazy.error && (
          <div
            className="absolute inset-x-0 z-20 flex items-center gap-2 border-b border-red-900/60 bg-red-950/70 px-3 py-1 text-[11px] text-red-200"
            style={{ top: HEADER_HEIGHT }}
          >
            <span className="min-w-0 flex-1 truncate" title={lazy.error}>
              {t('urlsTab.loadFailed', {
                defaultValue: 'Could not load this filter: {{detail}}',
                detail: lazy.error,
              })}
            </span>
            <button
              type="button"
              onClick={() => lazy.retry()}
              className="shrink-0 rounded border border-red-700/60 px-2 py-0.5 text-red-100 hover:bg-red-900/50"
            >
              {t('urlsTab.retry', { defaultValue: 'Retry' })}
            </button>
          </div>
        )}
        {lazy.total === 0 && lazy.isLoading && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ top: HEADER_HEIGHT }}
          >
            <div className="text-xs text-surface-500">{t('common.loading', { defaultValue: 'Loading…' })}</div>
          </div>
        )}
        {lazy.total === 0 && !lazy.isLoading && !lazy.error && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ top: HEADER_HEIGHT }}
          >
            <div className="max-w-md text-center">
              <div className="mb-1 text-sm font-semibold text-surface-300">{t('urlsTab.noUrlsToShow', { defaultValue: 'No URLs to show' })}</div>
              <div className="text-xs text-surface-500">
                {t('urlsTab.noUrlsHint', {
                  defaultValue: 'Start a crawl or choose a different category.',
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      )}
      <div
        className="flex shrink-0 items-center gap-4 border-t border-surface-800 bg-surface-900/60 px-3 text-[11px] text-surface-400"
        style={{ height: STATUS_BAR_HEIGHT }}
      >
        <span className="flex-1 truncate text-surface-500">
          {copyState?.phase === 'copying' &&
            t('urlsTab.copying', { defaultValue: 'Copying…' })}
          {copyState?.phase === 'done' &&
            (copyState.cells > 0
              ? t('urlsTab.copiedCells', {
                  defaultValue: '{{n}} cell(s) copied',
                  n: copyState.cells.toLocaleString(),
                })
              : t('urlsTab.copiedNothing', { defaultValue: 'Nothing to copy' }))}
        </span>
        <span>
          {t('urlsTab.statusUrls', { defaultValue: 'URLs:' })}{' '}
          <span className="font-mono tabular-nums text-surface-200">
            {lazy.total.toLocaleString()}
          </span>
          <span className="ml-1 text-surface-600">
            ({t('urlsTab.statusLoaded', {
              defaultValue: '{{count}} loaded',
              count: lazy.loadedRows.toLocaleString(),
            })})
          </span>
        </span>
        <span>
          {t('urlsTab.statusSelectedRows', { defaultValue: 'Selected Rows:' })}{' '}
          <span className="font-mono tabular-nums text-surface-200">
            {selectedIds.size.toLocaleString()}
          </span>
        </span>
        <span>
          {t('urlsTab.statusSelectedCells', { defaultValue: 'Selected Cells:' })}{' '}
          <span className="font-mono tabular-nums text-surface-200">
            {selectedCells.size.toLocaleString()}
          </span>
        </span>
        <span>
          {t('urlsTab.statusSelectedColumns', { defaultValue: 'Selected Columns:' })}{' '}
          <span className="font-mono tabular-nums text-surface-200">
            {selectedColumns.size.toLocaleString()}
          </span>
        </span>
      </div>

      <AdvancedFilterDialog
        open={filterDialogOpen}
        initial={filter}
        extractionFields={extractionFieldNames}
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
            search={search || undefined}
            filter={filter ?? undefined}
          />
        )}
      </ErrorBoundary>
    </div>
  );
}

/**
 * One header cell wrapped in {@link useSortable} so the whole row of
 * headers can be reordered by dragging the {@link GripVertical} handle
 * on the left. The handle is the only drag-trigger: clicking anywhere
 * else on the header preserves the existing semantics — left-click for
 * column-selection drag, the sort-arrow button for sort, the resize
 * handle on the right edge for resize, right-click to hide. Activation
 * distance of 5 px (set on the parent's PointerSensor) makes the handle
 * forgiving — a quick click doesn't slip into a drag.
 *
 * Sticky-left pin styling is preserved during drag (the cell stays
 * pinned visually as the user drags it around), and the drag transform
 * is composed on top so the cell follows the pointer.
 */
function SortableHeaderCell(props: {
  id: string;
  spec: ColumnSpec;
  colIdx: number;
  width: number;
  lang: string;
  isColSelected: boolean;
  isSortCol: boolean;
  sortDir: 'asc' | 'desc';
  stickyLeft: number | undefined;
  isPinned: boolean;
  isLastPinned: boolean;
  onSort: (key: keyof CrawlUrlRow) => void;
  onBeginColumnDrag: (colIdx: number, e: React.MouseEvent) => void;
  onColumnMouseEnter: () => void;
  onContextHide: (id: string) => void;
  onStartResize: (id: string, w: number, clientX: number) => void;
  onResetColumn: (id: string) => void;
}) {
  const { t } = useTranslation();
  const {
    id,
    spec: c,
    colIdx,
    width: w,
    lang,
    isColSelected,
    isSortCol,
    sortDir,
    stickyLeft,
    isPinned,
    isLastPinned,
    onSort,
    onBeginColumnDrag,
    onColumnMouseEnter,
    onContextHide,
    onStartResize,
    onResetColumn,
  } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    width: w,
    minWidth: w,
    flex: `0 0 ${w}px`,
    ...(isPinned && {
      position: 'sticky' as const,
      left: stickyLeft,
      zIndex: 12,
      background: 'rgb(23 23 23)',
      boxShadow: isLastPinned ? '2px 0 4px rgba(0,0,0,0.4)' : undefined,
    }),
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'group/header relative flex select-none items-center gap-1 border-b border-r border-surface-800 pl-1 pr-1 font-medium',
        isColSelected
          ? 'bg-accent-500/25 text-surface-50'
          : 'text-surface-300 hover:text-surface-100',
      )}
      style={style}
      onMouseDown={(e) => onBeginColumnDrag(colIdx, e)}
      onMouseEnter={onColumnMouseEnter}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextHide(id);
      }}
      title={
        translateLabel(c.header, lang) +
        ' ' +
        t('urlsTab.columnHeaderHint', {
          defaultValue:
            '(click to select · drag to multi-select · right-click to hide)',
        })
      }
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        // Drag-handle isolation — don't let the grip's mousedown bubble
        // up to the cell's column-selection drag handler, and don't let
        // a click fall through to anything else.
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="flex shrink-0 cursor-grab items-center text-surface-600 opacity-0 transition-opacity hover:text-surface-300 group-hover/header:opacity-100 active:cursor-grabbing"
        title={t('urlsTab.reorderColumn', { defaultValue: 'Drag to reorder column' })}
      >
        <GripVertical className="h-3 w-3" />
      </button>
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
          onSort(c.key);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        title={
          isSortCol
            ? t('urlsTab.columnSortedHint', {
                defaultValue: 'Sorted {{dir}} — click to flip',
                dir:
                  sortDir === 'asc'
                    ? t('urlsTab.sortAsc', { defaultValue: 'ascending' })
                    : t('urlsTab.sortDesc', { defaultValue: 'descending' }),
              })
            : t('urlsTab.sortByColumn', { defaultValue: 'Sort by this column' })
        }
      >
        {isSortCol ? (
          <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
        ) : (
          <ChevronsUpDown className="h-3 w-3" />
        )}
      </button>
      <div
        className="absolute -right-1 top-0 bottom-0 z-20 w-2 cursor-col-resize hover:bg-accent-500/40"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onStartResize(id, w, e.clientX);
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onResetColumn(id);
        }}
        onClick={(e) => e.stopPropagation()}
        title={t('urlsTab.resizeHint', {
          defaultValue: 'Drag to resize · double-click to reset',
        })}
      />
    </div>
  );
}

function ColumnPickerPopover({
  anchorRef,
  allColumns,
  hiddenColumns,
  pinnedLeft,
  onChange,
  onTogglePin,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  allColumns: ColumnSpec[];
  hiddenColumns: Set<string>;
  pinnedLeft: Set<string>;
  onChange: (next: Set<string>) => void;
  onTogglePin: (id: string) => void;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const popRef = useRef<HTMLDivElement | null>(null);
  /** Viewport-relative position derived from the anchor button's
   *  bounding rect. Recomputed on every open + on window resize. The
   *  popover is rendered into document.body via a portal so it isn't
   *  clipped by the parent's overflow region or any sibling stacking
   *  context (the bottom detail panel) — both of which previously hid
   *  the lower checkboxes. */
  const [pos, setPos] = useState<{
    top: number;
    right: number;
    maxHeight: number;
  } | null>(null);

  useLayoutEffect(() => {
    const updatePos = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const margin = 8;
      const top = rect.bottom + 4;
      const right = window.innerWidth - rect.right;
      // Reserve `margin` px above the viewport bottom so the popover
      // doesn't bleed off-screen on small viewports. Internal scroll
      // (`overflow-y-auto` on the list region) takes over past that.
      const maxHeight = Math.max(120, window.innerHeight - top - margin);
      setPos({ top, right, maxHeight });
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [anchorRef]);
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

  if (!pos) return null;

  const headerHeight = 33; /* matches py-2 + line-height of the top strip */

  return createPortal(
    <div
      ref={popRef}
      className="w-80 rounded-md border border-surface-700 bg-surface-900 shadow-2xl"
      style={{
        position: 'fixed',
        top: pos.top,
        right: pos.right,
        // Cap to whatever room is left between the anchor and the bottom
        // of the viewport. The internal list takes overflow-y-auto.
        maxHeight: pos.maxHeight,
        display: 'flex',
        flexDirection: 'column',
        // Beat the bottom detail panel + StatsBar + any toolbar overlays
        // — both live in sibling stacking contexts.
        zIndex: 100,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="flex shrink-0 items-center justify-between border-b border-surface-800 px-3 py-2"
        style={{ minHeight: headerHeight }}
      >
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
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {allColumns.map((c) => {
          const id = columnId(c);
          const visible = !hiddenColumns.has(id);
          const isPinned = pinnedLeft.has(id);
          return (
            <div
              key={id}
              className="flex items-center gap-2 px-3 py-1 text-[11px] text-surface-200 hover:bg-surface-800"
            >
              <label className="flex flex-1 cursor-pointer items-center gap-2 truncate">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={() => toggle(id)}
                  className="h-3 w-3 accent-blue-500"
                />
                <span className="truncate">{translateLabel(c.header, lang)}</span>
              </label>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(id);
                }}
                className={clsx(
                  'flex shrink-0 items-center rounded p-0.5 transition',
                  isPinned
                    ? 'text-accent-300 hover:bg-accent-500/20'
                    : 'text-surface-600 hover:bg-surface-700 hover:text-surface-300',
                )}
                title={
                  isPinned
                    ? t('urlsTab.unpinColumn', { defaultValue: 'Unpin this column' })
                    : t('urlsTab.pinColumn', {
                        defaultValue: 'Pin this column to the left edge',
                      })
                }
              >
                <Pin
                  className={clsx('h-3 w-3', isPinned && 'rotate-45 fill-current')}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

/** Hover text for the green `*`. Kept as a constant because `Cell` runs
 *  for every visible cell and looking the string up through the shared
 *  label dictionary avoids a `useTranslation` hook on that path. */
const CHANGED_MARKER_TITLE = 'Changed since the previous crawl';

function Cell({
  row,
  spec,
  lang,
}: {
  row: CrawlUrlRow | null;
  spec: ColumnSpec;
  lang: string;
}) {
  if (row === null) {
    return <span className="text-surface-700">…</span>;
  }
  const raw = row[spec.key];

  if (spec.kind === 'status') {
    const code = row.statusCode;
    // A robots-blocked URL also has no status — but because the crawler
    // chose not to request it, not because the request failed. Painting
    // it in the failure red said "this broke" about a crawl the status
    // bar reports as Failed 0.
    if (
      (code === null || code === undefined) &&
      row.indexability === 'non-indexable:robots-blocked'
    ) {
      return (
        <span
          className="inline-block rounded bg-surface-800 px-1.5 font-mono text-[10px] text-amber-400"
          title={translateLabel(ROBOTS_STATUS_TITLE, lang)}
        >
          {translateLabel('Robots', lang)}
        </span>
      );
    }
    // No HTTP status (DNS/TLS/connect/timeout failure): a bare "—" hides the
    // reason the crawler already captured. Show a compact token (DNS / TLS /
    // Timeout / …) with the full error text on hover.
    if (code === null || code === undefined) {
      return (
        <span
          className="inline-block rounded bg-rose-950/60 px-1.5 font-mono text-[10px] text-rose-300"
          title={row.statusText ?? undefined}
        >
          {shortFailureLabel(row.statusText)}
        </span>
      );
    }
    return (
      <span
        className={clsx(
          'inline-block rounded px-1.5 font-mono text-[10px]',
          statusClasses(code),
        )}
      >
        {code}
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
        {translateLabel(v === 'indexable' ? 'Indexable' : 'Non-Indexable', lang)}
      </span>
    );
  }

  if (spec.kind === 'indexability-status') {
    const label = indexabilityStatusLabel(row.indexability);
    if (label === '') {
      return <span className="text-surface-700">—</span>;
    }
    const localized = translateLabel(label, lang);
    return (
      <span className="block truncate text-surface-200" title={localized}>
        {localized}
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

  // Shared with the clipboard path so what you copy is what you read —
  // booleans as "Y"/blank, nulls as empty (the "—" below is presentation
  // only). Derived here rather than at the top of the function so the
  // branches above, which format their own values, don't pay for it.
  const value = cellText(row, spec, lang);

  if (spec.kind === 'mono') {
    // Re-crawl change marker. Sits outside the truncating span so it
    // survives a URL too long for the column — the whole point is that
    // it can be spotted by scanning the list, and a marker that
    // disappears exactly on the long URLs would be worse than none.
    if (spec.key === 'url' && row.changed) {
      return (
        <span className="flex w-full items-baseline overflow-hidden" title={value}>
          {/* min-w-0 is what lets a flex child actually truncate — without
              it the item refuses to shrink below its content width. */}
          <span className="min-w-0 truncate font-mono text-surface-100">{value}</span>
          <span
            className="shrink-0 pl-1 font-mono font-bold text-emerald-400"
            title={translateLabel(CHANGED_MARKER_TITLE, lang)}
          >
            *
          </span>
        </span>
      );
    }
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

/** Which selection layer a copy reads from. */
type CopyScope = 'columns' | 'cells' | 'rows';

/** Everything a clipboard copy needs from the live table. */
interface CopyContext {
  columns: ColumnSpec[];
  lang: string;
  rowAt: (index: number) => CrawlUrlRow | null;
  selectedCells: Set<string>;
  selectedIds: Set<number>;
  selectedColumns: Set<number>;
  snapshots: Map<number, { index: number; row: CrawlUrlRow }>;
  /** Row count of the current view — the backfill scan's upper bound. */
  total: number;
  /** The query that produced the current view — replayed verbatim when
   *  a whole-column copy has to re-read the table from SQLite. */
  query: {
    category: UrlCategory;
    search: string | undefined;
    sortBy: keyof CrawlUrlRow | undefined;
    sortDir: 'asc' | 'desc';
    filter: AdvancedFilter | undefined;
  };
}

/** Row ids embedded in `"<urlId>:<colIdx>"` selection keys. */
function rowIdsInKeys(keys: Iterable<string>): number[] {
  const out: number[] = [];
  for (const k of keys) {
    const id = Number(k.slice(0, k.lastIndexOf(':')));
    if (Number.isFinite(id)) out.push(id);
  }
  return out;
}

/**
 * Record display positions for selected rows that were never dragged
 * over.
 *
 * Selections normally build their snapshots as they go, but not every
 * path goes through the grid — picking a node in tree view sets a row
 * selection too, and switching back to the list leaves that row with no
 * snapshot at all, so a copy would drop it silently. Scans only what the
 * lazy loader is currently holding, and only when something is missing.
 */
function backfillSnapshots(ctx: CopyContext, ids: Iterable<number>): void {
  const missing = new Set<number>();
  for (const id of ids) if (!ctx.snapshots.has(id)) missing.add(id);
  if (missing.size === 0) return;
  for (let i = 0; i < ctx.total && missing.size > 0; i++) {
    const row = ctx.rowAt(i);
    if (row && missing.delete(row.id)) {
      ctx.snapshots.set(row.id, { index: i, row });
    }
  }
}

/**
 * Resolve `"<urlId>:<colIdx>"` selection keys into ordered plain text.
 *
 * Order comes from the snapshot's row index — where the row sat when it
 * was selected. Values prefer the live row, so a copy taken mid-crawl
 * carries what the table shows now rather than what it showed at click
 * time, and fall back to the snapshot once the lazy loader has evicted
 * the row.
 */
function cellSource(ctx: CopyContext): CellSource {
  const resolve = (id: number): CrawlUrlRow | null => {
    const snap = ctx.snapshots.get(id);
    if (!snap) return null;
    const live = ctx.rowAt(snap.index);
    return live && live.id === id ? live : snap.row;
  };
  return {
    order: (id) => ctx.snapshots.get(id)?.index ?? Number.MAX_SAFE_INTEGER,
    text: (id, colIdx) => {
      const spec = ctx.columns[colIdx];
      if (!spec) return null;
      const row = resolve(id);
      return row ? cellText(row, spec, ctx.lang) : null;
    },
  };
}

/**
 * Copy whole selected columns.
 *
 * Unlike a cell or row copy this can't be served from what's on screen:
 * selecting a column header means every row of the current view, and the
 * lazy loader only ever holds a few thousand of them. Page back through
 * SQLite in the view's own sort order so the clipboard gets the complete
 * column instead of the visible slice.
 *
 * @returns the number of cells written.
 */
async function copyWholeColumns(ctx: CopyContext): Promise<number> {
  const specs = [...ctx.selectedColumns]
    .sort((a, b) => a - b)
    .map((c) => ctx.columns[c])
    .filter((c): c is ColumnSpec => c !== undefined);
  if (specs.length === 0) return 0;

  const lines: string[] = [];
  for (let offset = 0; ; offset += COPY_FETCH_CHUNK) {
    const { rows } = await window.freecrawl.urlsQuery({
      limit: COPY_FETCH_CHUNK,
      offset,
      ...ctx.query,
    });
    for (const row of rows) {
      lines.push(toTsvLine(specs.map((s) => cellText(row, s, ctx.lang))));
    }
    if (rows.length < COPY_FETCH_CHUNK) break;
  }
  if (lines.length === 0) return 0;
  await writeTextToClipboard(lines.join('\n'));
  return lines.length * specs.length;
}

/**
 * Plain-text value of one cell — the clipboard counterpart of
 * {@link Cell}, and the single place the two agree on what a cell "says".
 *
 * Two deliberate departures from what's painted on screen, both because
 * the consumer here is a spreadsheet rather than a reader: numbers are
 * emitted unformatted (thousands separators would arrive as text, not a
 * number), and an absent value is emitted as an empty string rather than
 * the "—" placeholder.
 */
function cellText(row: CrawlUrlRow, spec: ColumnSpec, lang: string): string {
  if (spec.kind === 'status') {
    const code = row.statusCode;
    if (code !== null && code !== undefined) return String(code);
    if (row.indexability === 'non-indexable:robots-blocked') {
      return translateLabel('Robots', lang);
    }
    const label = shortFailureLabel(row.statusText);
    return label === '—' ? '' : label;
  }

  if (spec.kind === 'indexability') {
    return translateLabel(
      row.indexability === 'indexable' ? 'Indexable' : 'Non-Indexable',
      lang,
    );
  }

  if (spec.kind === 'indexability-status') {
    const label = indexabilityStatusLabel(row.indexability);
    return label === '' ? '' : translateLabel(label, lang);
  }

  // Custom-extraction column holds a `{ruleName: value}` JSON map. Showing
  // the raw `{"h2":"…"}` in the cell reads as noise — the preview and Detail
  // panel already unwrap it, so match them here (single rule → just the
  // value; multiple → `name: value` pairs). Full JSON stays in the Detail
  // panel and in exports (which format from the DB, not this path).
  if (spec.key === 'extractionResults') {
    const rawEx = row[spec.key];
    return typeof rawEx === 'string' && rawEx ? formatExtractionCell(rawEx) : '';
  }

  const raw = row[spec.key];
  if (raw === null || raw === undefined) return '';
  // Booleans render as "Y" / blank rather than the JS-default
  // "true"/"false" — matches the compact flag-column convention.
  if (typeof raw === 'boolean') return raw ? 'Y' : '';
  return String(raw);
}

/**
 * Flatten the `extraction_results` `{ruleName: value}` map into one compact
 * line for the table cell. Single rule → the value alone; multiple rules →
 * `name: value` pairs joined by " · ". Arrays (multi: all/concat) join with
 * " | ". Malformed JSON falls back to the raw string so nothing is hidden.
 */
function formatExtractionCell(raw: string): string {
  let obj: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return raw;
    }
    obj = parsed as Record<string, unknown>;
  } catch {
    return raw;
  }
  const fmt = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    if (Array.isArray(v)) return v.map(String).join(' | ');
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };
  const entries = Object.entries(obj);
  if (entries.length === 0) return '';
  if (entries.length === 1) return fmt(entries[0]![1]);
  return entries.map(([name, v]) => `${name}: ${fmt(v)}`).join('  ·  ');
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

/**
 * Compact token for a no-HTTP-response failure, derived from the crawler's
 * captured `statusText`. Technical protocol abbreviations (DNS/TLS/H2/…) — not
 * localized, same convention as the numeric status codes themselves. The full
 * diagnostic is on hover (title) and in the URL Details → HTTP Headers tab.
 */
/** Tooltip for the Robots status badge — dictionary key, so the grid
 *  cell stays free of a `useTranslation` hook. */
const ROBOTS_STATUS_TITLE = 'Not requested — disallowed by robots.txt';

function shortFailureLabel(statusText: string | null): string {
  if (!statusText) return '—';
  if (/ENOTFOUND|EAI_AGAIN|ENODATA|ESERVFAIL|getaddrinfo|DNS/i.test(statusText)) return 'DNS';
  if (/UNABLE_TO_VERIFY|CERT|SSL|TLSV1|HANDSHAKE|EPROTO/i.test(statusText)) return 'TLS';
  if (/ECONNREFUSED/i.test(statusText)) return 'Refused';
  if (/ECONNRESET|SOCKET|EPIPE|reset/i.test(statusText)) return 'Reset';
  if (/HTTP2|NGHTTP2|GOAWAY|PROTOCOL_ERROR/i.test(statusText)) return 'H2 err';
  if (/CONNECT_TIMEOUT|ETIMEDOUT|HEADERS_TIMEOUT|BODY_TIMEOUT|aborted|timeout/i.test(statusText))
    return 'Timeout';
  return 'Failed';
}

function statusClasses(code: number | null): string {
  if (code === null) return 'bg-surface-800 text-surface-400';
  if (code >= 200 && code < 300) return 'bg-emerald-900/60 text-emerald-300';
  if (code >= 300 && code < 400) return 'bg-amber-900/60 text-amber-300';
  if (code >= 400 && code < 500) return 'bg-orange-900/60 text-orange-300';
  if (code >= 500) return 'bg-red-900/60 text-red-300';
  return 'bg-surface-800 text-surface-400';
}
