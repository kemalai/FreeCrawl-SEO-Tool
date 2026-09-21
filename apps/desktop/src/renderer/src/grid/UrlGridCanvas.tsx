import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { CrawlUrlRow } from '@freecrawl/shared-types';
import type { ColumnSpec } from '../tabs/columns.js';
import {
  createMeasureCache,
  fitText,
  hitTest,
  visibleColumnRange,
  visibleRowRange,
  type GridHit,
  type GridLayout,
} from './canvas-grid-layout.js';
import { cellPaint, CHANGED_MARKER_TITLE, GRID_COLORS, type CellPaint } from './url-cell-model.js';
import { translateLabel } from '../i18n/labels.js';
import { subscribeTheme } from '../theme.js';

/**
 * The body of the URL grid, drawn on one canvas.
 *
 * The DOM version rendered every visible row as ~30 elements, and each
 * live-refresh tick or drag-select re-reconciled all of them on the one
 * thread Chromium gives a page for scripting, style, layout and paint.
 * Past ~25k rows that thread could not keep up with a scroll, and the
 * table went black behind it. Here a frame is one `fillRect` and a few
 * hundred `fillText` calls, regardless of how many rows the table holds.
 *
 * What stays in the DOM: the header row (sorting, drag-reorder, resize,
 * tooltips), the scroll container and its native scrollbars, and the
 * loading / empty / error overlays. This component owns only the rows.
 *
 * Layout trick: a zero-sized `position: sticky` wrapper pins the canvas
 * to the scrollport's top-left corner while a plain spacer div gives the
 * container its full scroll height, so wheel, keyboard and scrollbar
 * scrolling are all native; the canvas repaints from `scrollTop` /
 * `scrollLeft` on every scroll event.
 */

/** Horizontal padding inside a cell — Tailwind `px-2`. */
const CELL_PAD = 8;
/** Gap between a URL and its `*` change marker — Tailwind `pl-1`. */
const MARKER_GAP = 4;
const BADGE_HEIGHT = 16;
const BADGE_PAD = 6;
const BADGE_RADIUS = 4;
/** Width of the drop shadow at the right edge of the pinned strip. */
const PINNED_SHADOW_WIDTH = 6;
/** How long after the last scroll event the grid still counts as scrolling. */
const SCROLL_IDLE_MS = 150;
const MONO_FAMILY = '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

export interface UrlGridCanvasProps {
  /** The `overflow: auto` container the header and this body scroll in. */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  headerHeight: number;
  rowHeight: number;
  layout: GridLayout;
  columns: ColumnSpec[];
  lang: string;
  total: number;
  rowAt: (index: number) => CrawlUrlRow | null;
  selectedIds: Set<number>;
  selectedCells: Set<string>;
  selectedColumns: Set<number>;
  /** Rows kept loaded beyond the viewport, each side. */
  overscan: number;
  /** Tooltip for the row-number column. */
  rowNumTitle: string;
  ariaLabel: string;
  /** Written by the grid: true while the user is scrolling. */
  scrollingRef: React.MutableRefObject<boolean>;
  /** The rows the viewport (plus overscan) now covers — inclusive. */
  onRangeChange: (start: number, end: number) => void;
  /**
   * The pointer moved onto a different cell, or the grid scrolled under
   * a stationary pointer. The DOM grid's per-cell `mouseenter`.
   */
  onHit: (hit: GridHit) => void;
  onMouseDown: (hit: GridHit, e: React.MouseEvent) => void;
  onContextMenu: (hit: GridHit, e: React.MouseEvent) => void;
}

interface Fonts {
  sans: string;
  mono: string;
  monoBold: string;
  badge: string;
}

function sameHit(a: GridHit | null, b: GridHit): boolean {
  if (a === null) return false;
  if (a.kind !== b.kind) return false;
  if (a.kind === 'none' || b.kind === 'none') return true;
  if (a.rowIndex !== b.rowIndex) return false;
  return a.kind === 'cell' && b.kind === 'cell' ? a.colIdx === b.colIdx : true;
}

export function UrlGridCanvas(props: UrlGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** CSS size of the canvas and the device pixel ratio it was sized for. */
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const hoverRef = useRef<GridHit | null>(null);
  /** Last pointer position inside the canvas, for re-hit-testing on scroll. */
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const paintQueued = useRef(false);
  const scrollIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fontsRef = useRef<Fonts>({
    sans: '11px sans-serif',
    mono: `11px ${MONO_FAMILY}`,
    monoBold: `bold 11px ${MONO_FAMILY}`,
    badge: `10px ${MONO_FAMILY}`,
  });

  // The latest props, for handlers and paints that run outside React's
  // render (scroll, pointer move) — registered once, never stale.
  const stateRef = useRef(props);
  stateRef.current = props;

  const measure = useMemo(() => {
    const cached = createMeasureCache((font, s) => {
      const ctx = canvasRef.current!.getContext('2d')!;
      ctx.font = font;
      return ctx.measureText(s).width;
    });
    // Before the canvas mounts nothing can be measured, and a 0 must not
    // be remembered as the width of that string.
    return (font: string, s: string): number =>
      canvasRef.current?.getContext('2d') ? cached(font, s) : 0;
  }, []);

  const paint = useCallback((): void => {
    const canvas = canvasRef.current;
    const scroll = stateRef.current.scrollRef.current;
    if (!canvas || !scroll) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w, h, dpr } = sizeRef.current;
    if (w <= 0 || h <= 0) return;
    const st = stateRef.current;
    const { layout, rowHeight, total, rowAt, selectedIds, selectedCells, selectedColumns } = st;
    const fonts = fontsRef.current;
    const scrollTop = scroll.scrollTop;
    const scrollLeft = scroll.scrollLeft;
    const hover = hoverRef.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = GRID_COLORS.background;
    ctx.fillRect(0, 0, w, h);
    ctx.textBaseline = 'middle';

    const rows = visibleRowRange(scrollTop, h, rowHeight, total, 0);
    if (rows.end < rows.start) return;
    const rowsTop = rows.start * rowHeight - scrollTop;
    const rowsBottom = (rows.end + 1) * rowHeight - scrollTop;
    const ucols = visibleColumnRange(layout, scrollLeft, w);

    // Row data for the span, resolved once.
    const rowOf: (CrawlUrlRow | null)[] = [];
    const rowSelected: boolean[] = [];
    for (let r = rows.start; r <= rows.end; r++) {
      const row = rowAt(r);
      rowOf.push(row);
      rowSelected.push(row !== null && selectedIds.has(row.id));
    }
    const rowY = (r: number): number => r * rowHeight - scrollTop;

    // ── Row backgrounds — hover / selected tint across the full width,
    //    then the bottom border. ──
    for (let r = rows.start; r <= rows.end; r++) {
      const i = r - rows.start;
      const y = rowY(r);
      if (rowSelected[i]) {
        ctx.fillStyle = GRID_COLORS.rowSelected;
        ctx.fillRect(0, y, w, rowHeight);
      } else if (hover && hover.kind !== 'none' && hover.rowIndex === r) {
        ctx.fillStyle = GRID_COLORS.rowHover;
        ctx.fillRect(0, y, w, rowHeight);
      }
    }

    const paintCell = (
      r: number,
      colIdx: number,
      x: number,
      width: number,
      pinned: boolean,
    ): void => {
      const i = r - rows.start;
      const row = rowOf[i] ?? null;
      const y = rowY(r);
      const cy = y + rowHeight / 2;
      const cellSel =
        row !== null && (selectedCells.has(`${row.id}:${colIdx}`) || selectedColumns.has(colIdx));
      if (pinned) {
        // Opaque base so scrolled cells never show through the strip.
        ctx.fillStyle = GRID_COLORS.background;
        ctx.fillRect(x, y, width, rowHeight);
        if (rowSelected[i]) {
          ctx.fillStyle = GRID_COLORS.rowSelected;
          ctx.fillRect(x, y, width, rowHeight);
        }
      }
      if (cellSel) {
        ctx.fillStyle = GRID_COLORS.cellSelected;
        ctx.fillRect(x, y, width, rowHeight);
      } else if (hover && hover.kind === 'cell' && hover.rowIndex === r && hover.colIdx === colIdx) {
        ctx.fillStyle = GRID_COLORS.cellHover;
        ctx.fillRect(x, y, width, rowHeight);
      }
      const textX = x + CELL_PAD;
      const avail = width - CELL_PAD * 2;
      if (row === null) {
        ctx.font = fonts.sans;
        ctx.fillStyle = GRID_COLORS.placeholder;
        ctx.fillText('…', textX, cy);
        return;
      }
      const spec = st.columns[colIdx];
      if (!spec) return;
      const model: CellPaint = cellPaint(row, spec, st.lang);
      if (model.kind === 'placeholder') {
        ctx.font = fonts.sans;
        ctx.fillStyle = GRID_COLORS.placeholder;
        ctx.fillText('—', textX, cy);
        return;
      }
      if (model.kind === 'badge') {
        const tw = measure(fonts.badge, model.text);
        const bw = tw + BADGE_PAD * 2;
        const by = y + (rowHeight - BADGE_HEIGHT) / 2;
        const clip = bw > avail;
        if (clip) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, Math.max(0, width - 1), rowHeight);
          ctx.clip();
        }
        ctx.fillStyle = model.bg;
        ctx.beginPath();
        ctx.roundRect(textX, by, bw, BADGE_HEIGHT, BADGE_RADIUS);
        ctx.fill();
        ctx.font = fonts.badge;
        ctx.fillStyle = model.fg;
        ctx.fillText(model.text, textX + BADGE_PAD, cy);
        if (clip) ctx.restore();
        return;
      }
      const font = model.mono ? fonts.mono : fonts.sans;
      let textAvail = avail;
      let markerW = 0;
      if (model.marker) {
        markerW = measure(fonts.monoBold, '*') + MARKER_GAP;
        textAvail -= markerW;
      }
      const shown = fitText((s) => measure(font, s), model.text, textAvail);
      ctx.font = font;
      ctx.fillStyle = model.color;
      ctx.fillText(shown, textX, cy);
      if (model.marker) {
        // Measure first: a cache miss inside measure() sets ctx.font.
        const markerX = textX + measure(font, shown) + MARKER_GAP;
        ctx.font = fonts.monoBold;
        ctx.fillStyle = GRID_COLORS.good;
        ctx.fillText('*', markerX, cy);
      }
    };

    // ── Scrolled columns, clipped to the right of the pinned strip. ──
    if (ucols.end >= ucols.start) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(layout.pinnedWidth, 0, Math.max(0, w - layout.pinnedWidth), h);
      ctx.clip();
      for (let c = ucols.start; c <= ucols.end; c++) {
        const col = layout.columns[c]!;
        const x = col.x - scrollLeft;
        for (let r = rows.start; r <= rows.end; r++) paintCell(r, c, x, col.width, false);
        ctx.fillStyle = GRID_COLORS.border;
        ctx.fillRect(x + col.width - 1, rowsTop, 1, rowsBottom - rowsTop);
      }
      ctx.restore();
    }

    // ── Pinned strip: row numbers, then pinned columns, then its shadow. ──
    for (let r = rows.start; r <= rows.end; r++) {
      const i = r - rows.start;
      const y = rowY(r);
      ctx.fillStyle = GRID_COLORS.background;
      ctx.fillRect(0, y, layout.rowNumWidth, rowHeight);
      if (rowSelected[i]) {
        ctx.fillStyle = GRID_COLORS.cellSelected;
        ctx.fillRect(0, y, layout.rowNumWidth, rowHeight);
      } else if (hover && hover.kind === 'rownum' && hover.rowIndex === r) {
        ctx.fillStyle = GRID_COLORS.rowNumHover;
        ctx.fillRect(0, y, layout.rowNumWidth, rowHeight);
      }
      ctx.font = fonts.mono;
      ctx.fillStyle = rowSelected[i] ? GRID_COLORS.selectedText : GRID_COLORS.rowNum;
      ctx.textAlign = 'right';
      ctx.fillText(String(r + 1), layout.rowNumWidth - CELL_PAD, y + rowHeight / 2);
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = GRID_COLORS.border;
    ctx.fillRect(layout.rowNumWidth - 1, rowsTop, 1, rowsBottom - rowsTop);
    for (let c = 0; c < layout.pinnedCount; c++) {
      const col = layout.columns[c]!;
      for (let r = rows.start; r <= rows.end; r++) paintCell(r, c, col.x, col.width, true);
      ctx.fillStyle = GRID_COLORS.border;
      ctx.fillRect(col.x + col.width - 1, rowsTop, 1, rowsBottom - rowsTop);
    }
    if (layout.pinnedCount > 0) {
      const grad = ctx.createLinearGradient(
        layout.pinnedWidth,
        0,
        layout.pinnedWidth + PINNED_SHADOW_WIDTH,
        0,
      );
      grad.addColorStop(0, GRID_COLORS.pinnedShadow);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(layout.pinnedWidth, rowsTop, PINNED_SHADOW_WIDTH, rowsBottom - rowsTop);
    }

    // ── Row bottom borders, over everything. ──
    ctx.fillStyle = GRID_COLORS.border;
    for (let r = rows.start; r <= rows.end; r++) {
      ctx.fillRect(0, rowY(r) + rowHeight - 1, w, 1);
    }
  }, [measure]);

  /** Coalesce paints requested outside a scroll event into one frame. */
  const schedulePaint = useCallback((): void => {
    if (paintQueued.current) return;
    paintQueued.current = true;
    requestAnimationFrame(() => {
      paintQueued.current = false;
      paint();
    });
  }, [paint]);

  /** Tell the loader which rows the viewport now needs. Cheap enough to
   *  call on every render, scroll and resize — and it has to be, since
   *  it is also what re-requests a chunk once a failed fetch's back-off
   *  has expired. */
  const syncRange = useCallback((): void => {
    const scroll = stateRef.current.scrollRef.current;
    if (!scroll) return;
    const { rowHeight, total, overscan } = stateRef.current;
    const r = visibleRowRange(scroll.scrollTop, sizeRef.current.h, rowHeight, total, overscan);
    if (r.end >= r.start) stateRef.current.onRangeChange(r.start, r.end);
  }, []);

  const hitAt = useCallback((x: number, y: number): GridHit => {
    const scroll = stateRef.current.scrollRef.current;
    if (!scroll) return { kind: 'none' };
    const { layout, rowHeight, total } = stateRef.current;
    return hitTest(layout, x, y, scroll.scrollLeft, scroll.scrollTop, rowHeight, total);
  }, []);

  /** Native tooltip text for what's under the pointer. */
  const tooltipFor = useCallback(
    (hit: GridHit, x: number): string => {
      const st = stateRef.current;
      if (hit.kind === 'rownum') return st.rowNumTitle;
      if (hit.kind !== 'cell') return '';
      const row = st.rowAt(hit.rowIndex);
      const spec = st.columns[hit.colIdx];
      const col = st.layout.columns[hit.colIdx];
      if (!row || !spec || !col) return '';
      const model = cellPaint(row, spec, st.lang);
      if (model.kind === 'badge') return model.title ?? '';
      if (model.kind !== 'text') return '';
      if (model.marker) {
        // Hovering the `*` itself explains the marker, as the DOM span did.
        const fonts = fontsRef.current;
        const font = model.mono ? fonts.mono : fonts.sans;
        const markerW = measure(fonts.monoBold, '*') + MARKER_GAP;
        const cellX = col.pinned ? col.x : col.x - (st.scrollRef.current?.scrollLeft ?? 0);
        const shown = fitText(
          (s) => measure(font, s),
          model.text,
          col.width - CELL_PAD * 2 - markerW,
        );
        const markerX = cellX + CELL_PAD + measure(font, shown) + MARKER_GAP;
        if (x >= markerX && x <= markerX + markerW) {
          return translateLabel(CHANGED_MARKER_TITLE, st.lang);
        }
      }
      return model.title ?? '';
    },
    [measure],
  );

  const applyHover = useCallback(
    (hit: GridHit, x: number, notify: boolean): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (sameHit(hoverRef.current, hit)) return;
      hoverRef.current = hit;
      canvas.title = tooltipFor(hit, x);
      canvas.style.cursor =
        hit.kind === 'rownum' ? 'pointer' : hit.kind === 'cell' ? 'cell' : '';
      schedulePaint();
      if (notify) stateRef.current.onHit(hit);
    },
    [schedulePaint, tooltipFor],
  );

  // Size the canvas to the scrollport (minus the header) and keep the
  // backing store at device resolution.
  useEffect(() => {
    const scroll = props.scrollRef.current;
    const canvas = canvasRef.current;
    if (!scroll || !canvas) return;
    let disposed = false;
    let dprQuery: MediaQueryList | null = null;

    const resize = (): void => {
      if (disposed) return;
      const dpr = window.devicePixelRatio || 1;
      const w = scroll.clientWidth;
      const h = Math.max(0, scroll.clientHeight - stateRef.current.headerHeight);
      sizeRef.current = { w, h, dpr };
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      syncRange();
      paint();
      // Re-arm for the next ratio change (moving the window between
      // monitors, OS zoom).
      dprQuery?.removeEventListener('change', resize);
      dprQuery = window.matchMedia(`(resolution: ${dpr}dppx)`);
      dprQuery.addEventListener('change', resize);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(scroll);
    return () => {
      disposed = true;
      ro.disconnect();
      dprQuery?.removeEventListener('change', resize);
    };
  }, [props.scrollRef, paint, syncRange]);

  // Scroll: repaint at once (the canvas is pinned, so its content is stale
  // by the scroll delta until we do), refresh the loaded range, and treat
  // the cell that slid under a stationary pointer as newly entered.
  useEffect(() => {
    const scroll = props.scrollRef.current;
    if (!scroll) return;
    const onScroll = (): void => {
      props.scrollingRef.current = true;
      if (scrollIdleTimer.current !== null) clearTimeout(scrollIdleTimer.current);
      scrollIdleTimer.current = setTimeout(() => {
        props.scrollingRef.current = false;
        scrollIdleTimer.current = null;
      }, SCROLL_IDLE_MS);
      syncRange();
      paint();
      const p = pointerRef.current;
      if (p) applyHover(hitAt(p.x, p.y), p.x, true);
    };
    scroll.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroll.removeEventListener('scroll', onScroll);
      if (scrollIdleTimer.current !== null) clearTimeout(scrollIdleTimer.current);
      props.scrollingRef.current = false;
    };
  }, [props.scrollRef, props.scrollingRef, applyHover, hitAt, paint, syncRange]);

  // The UI font follows the interface language (see styles.css); pick it
  // up from the container so CJK / Devanagari glyphs get their fallback.
  useEffect(() => {
    const scroll = props.scrollRef.current;
    const family = scroll ? getComputedStyle(scroll).fontFamily : 'sans-serif';
    fontsRef.current = {
      sans: `11px ${family}`,
      mono: `11px ${MONO_FAMILY}`,
      monoBold: `bold 11px ${MONO_FAMILY}`,
      badge: `10px ${MONO_FAMILY}`,
    };
    schedulePaint();
    // Fonts that arrive after first paint (system font loading) would
    // otherwise leave the first frame in a fallback face.
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) schedulePaint();
    });
    return () => {
      cancelled = true;
    };
  }, [props.lang, props.scrollRef, schedulePaint]);

  // The palette object is swapped in place on a theme change (see
  // url-cell-model); the canvas only needs to know to paint again.
  useEffect(() => subscribeTheme(() => schedulePaint()), [schedulePaint]);

  // Every render carries something the picture depends on — rows, a
  // selection, column widths — so paint after each one, synchronously,
  // before the browser shows the frame; and re-state the needed range,
  // which a new total (tab or filter switch) or an expired back-off
  // may have changed the answer to.
  useLayoutEffect(() => {
    paint();
    syncRange();
  });

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pointerRef.current = { x, y };
    applyHover(hitAt(x, y), x, true);
  };

  const onMouseLeave = (): void => {
    pointerRef.current = null;
    const canvas = canvasRef.current;
    if (hoverRef.current === null || !canvas) return;
    hoverRef.current = null;
    canvas.title = '';
    canvas.style.cursor = '';
    schedulePaint();
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    props.onMouseDown(hitAt(e.clientX - rect.left, e.clientY - rect.top), e);
  };

  const onContextMenu = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    props.onContextMenu(hitAt(e.clientX - rect.left, e.clientY - rect.top), e);
  };

  return (
    <>
      <div
        style={{
          position: 'sticky',
          top: props.headerHeight,
          left: 0,
          width: 0,
          height: 0,
          overflow: 'visible',
        }}
      >
        <canvas
          ref={canvasRef}
          role="grid"
          aria-label={props.ariaLabel}
          aria-rowcount={props.total}
          aria-colcount={props.columns.length + 1}
          style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          onMouseDown={onMouseDown}
          onContextMenu={onContextMenu}
        />
      </div>
      {/* Scroll height for the rows the canvas draws. */}
      <div
        style={{
          height: props.total * props.rowHeight,
          minWidth: props.layout.totalWidth,
          width: '100%',
        }}
      />
    </>
  );
}
