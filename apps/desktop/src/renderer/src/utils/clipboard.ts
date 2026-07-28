/**
 * Shared clipboard helpers for the selectable data grids.
 *
 * Every grid in the app keys its cell selection the same way — a
 * `Set<string>` of `"<rowKey>:<colIdx>"` — but they disagree on what a
 * row key means. The detail-panel and Broken Links grids hold their rows
 * in a plain array, so the key is the array index. The URLs grid is
 * lazily paged out of SQLite and re-sorts underneath the user mid-crawl,
 * so it keys on the stable url id instead and resolves display order
 * separately. {@link CellSource} is the seam: give it an order function
 * and a text function and the TSV assembly is identical for all of them.
 */

/** Resolves a grid's selection keys into ordered, plain-text cells. */
export interface CellSource {
  /**
   * Display-order rank of a row key — lower sorts first. For an
   * array-backed grid this is the identity function.
   */
  order: (rowKey: number) => number;
  /**
   * Plain text of one cell, or `null` when the row is no longer
   * available (evicted from a cache, deleted mid-crawl). Null rows are
   * dropped from the output rather than emitted as blank lines.
   */
  text: (rowKey: number, colIdx: number) => string | null;
}

/**
 * Flatten a cell value into something a spreadsheet can take.
 *
 * Tabs and newlines are the TSV field/record separators, so a value
 * containing either (a meta description with a hard line break, an
 * anchor text with a tab) would silently shift every following cell into
 * the wrong column. Collapse them to spaces — the value stays readable
 * and the grid stays aligned.
 */
function sanitize(value: string): string {
  if (!/[\t\r\n]/.test(value)) return value;
  return value.replace(/[\t\r\n]+/g, ' ').trim();
}

/** Join one row's values into a TSV line, separator-safe. */
export function toTsvLine(values: readonly string[]): string {
  return values.map(sanitize).join('\t');
}

/**
 * Build a TSV block from a cell selection — grouped by row in display
 * order, columns ascending — so a paste into a spreadsheet drops the
 * cells into matching grid positions.
 *
 * `cells` counts what actually made it into the text, which is less than
 * the selection size whenever a row has gone away underneath it.
 */
export function selectionToTsv(
  selected: Iterable<string>,
  src: CellSource,
): { text: string; cells: number } {
  const byRow = new Map<number, number[]>();
  for (const k of selected) {
    const sep = k.lastIndexOf(':');
    if (sep < 0) continue;
    const r = Number(k.slice(0, sep));
    const c = Number(k.slice(sep + 1));
    if (!Number.isFinite(r) || !Number.isFinite(c)) continue;
    const list = byRow.get(r);
    if (list) list.push(c);
    else byRow.set(r, [c]);
  }
  const rowKeys = [...byRow.keys()].sort((a, b) => src.order(a) - src.order(b));
  const lines: string[] = [];
  let cells = 0;
  for (const rowKey of rowKeys) {
    const cols = (byRow.get(rowKey) ?? []).sort((a, b) => a - b);
    const values: string[] = [];
    let alive = false;
    for (const c of cols) {
      const v = src.text(rowKey, c);
      if (v !== null) alive = true;
      values.push(v ?? '');
    }
    if (alive) {
      lines.push(toTsvLine(values));
      cells += values.length;
    }
  }
  return { text: lines.join('\n'), cells };
}

/**
 * Copy a cell selection to the OS clipboard as TSV.
 *
 * @returns the number of cells actually written — callers use it to
 *          confirm the copy in the UI, and to stay silent on a no-op.
 */
export async function copySelection(
  selected: Set<string>,
  src: CellSource,
): Promise<number> {
  if (selected.size === 0) return 0;
  const { text, cells } = selectionToTsv(selected, src);
  if (cells === 0) return 0;
  await writeTextToClipboard(text);
  return cells;
}

/**
 * Write `text` to the OS clipboard.
 *
 * The async Clipboard API is tried first and covers the normal case. It
 * rejects when the renderer isn't focused or the clipboard permission is
 * unset — situations that do occur in Electron — so a hidden textarea +
 * `execCommand('copy')` backs it up. The deprecated call is deliberate:
 * it is the only path that works without focus.
 */
export async function writeTextToClipboard(text: string): Promise<void> {
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

/**
 * True when the keyboard event should be treated as "copy the grid
 * selection" rather than the browser's own copy.
 *
 * Both Ctrl and Cmd are accepted on every platform: macOS delivers ⌘C
 * through the Edit ▸ Copy round-trip in `menu.ts` (which synthesises a
 * `metaKey` keydown), and a Mac user who reaches for Ctrl+C out of habit
 * gets the same result rather than nothing.
 *
 * Inputs, textareas and contenteditable regions keep the native copy —
 * the user pressing Ctrl+C inside a filter box means the box's text, not
 * whatever cells happen to be selected behind it.
 */
export function isGridCopyShortcut(e: KeyboardEvent): boolean {
  if (!(e.ctrlKey || e.metaKey)) return false;
  if (e.key !== 'c' && e.key !== 'C') return false;
  const target = e.target as HTMLElement | null;
  const tag = target?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return false;
  return true;
}

/** True on macOS. The renderer has no `process`, so sniff the UA. */
export const IS_MAC = /Mac|iPhone|iPad/i.test(navigator.userAgent);

/**
 * The modifier that means "add to the selection" on this platform.
 *
 * On Windows and Linux that's Ctrl. On macOS it is ⌘ *only*: there,
 * Ctrl+click is the OS-level secondary click, so treating it as additive
 * would grow the selection at the exact moment the user is opening a
 * context menu — and the menu would then act on a cell they never meant
 * to pick.
 */
export function isAdditiveClick(e: { ctrlKey: boolean; metaKey: boolean }): boolean {
  return IS_MAC ? e.metaKey : e.ctrlKey || e.metaKey;
}

/**
 * True when this mouse event is macOS's Ctrl+click secondary click.
 *
 * Chromium on macOS fires both `mousedown` (button 0, ctrlKey) and
 * `contextmenu` for that gesture. Grids use it to skip drag-selection so
 * the gesture opens a menu and nothing else.
 */
export function isMacSecondaryClick(e: {
  button: number;
  ctrlKey: boolean;
}): boolean {
  return IS_MAC && e.button === 0 && e.ctrlKey;
}

// ──────── Which grid owns the copy shortcut ────────

/**
 * Several grids can be on screen at once — the URL table and the detail
 * panel's Inlinks/Outlinks table, say — and each listens for
 * Ctrl/Cmd+C at the document level. A user holding a live selection in
 * both would otherwise fire every handler on one keypress and get
 * whichever async clipboard write happened to land last.
 *
 * The grid the user most recently pressed a mouse button inside wins.
 * That is also the grid they are looking at, and since a selection can
 * only be made by clicking inside a grid, whichever grid has something
 * to copy has necessarily claimed ownership at some point.
 */
let activeGrid: string | null = null;

/** Claim the copy shortcut for `id`. Call from the grid root's mousedown. */
export function markGridActive(id: string): void {
  activeGrid = id;
}

/**
 * Whether `id` should handle a copy shortcut right now. Nothing has been
 * clicked yet → nobody owns it, and nobody has a selection either, so
 * letting every grid through is harmless.
 */
export function ownsGridCopy(id: string): boolean {
  return activeGrid === null || activeGrid === id;
}
