import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type {
  CrawlUrlRow,
  LinkOrigin,
  LinkPathType,
  LinkPosition,
  LinkType,
  UrlDetail,
} from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

type SubTab =
  | 'url-details'
  | 'inlinks'
  | 'outlinks'
  | 'serp-snippet'
  | 'http-headers'
  | 'view-source';

const SUB_TABS: { key: SubTab; label: string; disabled?: boolean }[] = [
  { key: 'url-details', label: 'URL Details' },
  { key: 'inlinks', label: 'Inlinks' },
  { key: 'outlinks', label: 'Outlinks' },
  { key: 'serp-snippet', label: 'SERP Snippet' },
  { key: 'http-headers', label: 'HTTP Headers' },
  { key: 'view-source', label: 'View Source', disabled: true },
];

export function BottomDetailPanel() {
  const selectedUrlId = useAppStore((s) => s.selectedUrlId);
  const [detail, setDetail] = useState<UrlDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState<SubTab>('url-details');

  useEffect(() => {
    if (selectedUrlId === null) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const d = await window.freecrawl.urlDetailGet({ id: selectedUrlId });
        if (!cancelled) setDetail(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedUrlId]);

  return (
    <div className="flex h-full flex-col bg-surface-950">
      <div className="flex items-center border-b border-surface-800 bg-surface-900">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            disabled={t.disabled}
            className={clsx(
              'tab',
              subTab === t.key && 'tab-active',
              t.disabled && 'cursor-not-allowed opacity-40',
            )}
            onClick={() => !t.disabled && setSubTab(t.key)}
            title={t.disabled ? 'Coming soon' : undefined}
          >
            {t.label}
            {t.key === 'inlinks' && detail && (
              <span className="ml-1 text-surface-500">({detail.inlinksTotal})</span>
            )}
            {t.key === 'outlinks' && detail && (
              <span className="ml-1 text-surface-500">({detail.outlinksTotal})</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {selectedUrlId === null && (
          <div className="flex h-full items-center justify-center text-xs text-surface-500">
            Select a URL from the table to see details.
          </div>
        )}
        {selectedUrlId !== null && !detail && loading && (
          <div className="p-4 text-xs text-surface-500">Loading…</div>
        )}
        {detail && subTab === 'url-details' && <NameValueView row={detail.row} />}
        {detail && subTab === 'inlinks' && (
          <LinksView
            tableId="inlinks"
            selectedUrlId={selectedUrlId}
            total={detail.inlinksTotal}
            shown={detail.inlinks.length}
            columns={LINK_COLUMNS}
            rows={detail.inlinks.map((l) =>
              buildLinkRow({
                fromUrl: l.fromUrl,
                toUrl: detail.row.url,
                toStatusCode: l.toStatusCode,
                toSize: l.toSize,
                type: l.type,
                anchor: l.anchor,
                altText: l.altText,
                rel: l.rel,
                target: l.target,
                pathType: l.pathType,
                linkPath: l.linkPath,
                linkPosition: l.linkPosition,
                linkOrigin: l.linkOrigin,
              }),
            )}
          />
        )}
        {detail && subTab === 'outlinks' && (
          <LinksView
            tableId="outlinks"
            selectedUrlId={selectedUrlId}
            total={detail.outlinksTotal}
            shown={detail.outlinks.length}
            columns={LINK_COLUMNS}
            rows={detail.outlinks.map((l) =>
              buildLinkRow({
                fromUrl: detail.row.url,
                toUrl: l.toUrl,
                toStatusCode: l.toStatusCode,
                toSize: l.toSize,
                type: l.type,
                anchor: l.anchor,
                altText: l.altText,
                rel: l.rel,
                target: l.target,
                pathType: l.pathType,
                linkPath: l.linkPath,
                linkPosition: l.linkPosition,
                linkOrigin: l.linkOrigin,
              }),
            )}
          />
        )}
        {detail && subTab === 'serp-snippet' && <SerpSnippet row={detail.row} />}
        {detail && subTab === 'http-headers' && <HttpHeadersView headers={detail.headers} />}
      </div>
    </div>
  );
}

function HttpHeadersView({ headers }: { headers: { name: string; value: string }[] }) {
  if (headers.length === 0) {
    return (
      <div className="p-4 text-[11px] text-surface-500">
        No response headers captured for this URL.
      </div>
    );
  }
  return (
    <div className="p-3">
      <table className="w-full text-[11px]">
        <thead className="sticky top-0 bg-surface-900">
          <tr className="text-surface-400">
            <th className="w-64 py-1 pr-3 text-left font-medium">Header</th>
            <th className="py-1 text-left font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {headers.map((h) => (
            <tr key={h.name} className="border-b border-surface-900 last:border-0">
              <td className="py-1.5 pr-3 align-top font-mono text-surface-400">{h.name}</td>
              <td className="break-all py-1.5 align-top font-mono text-surface-100">
                {h.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NameValueView({ row }: { row: CrawlUrlRow }) {
  const pixelWidthTitle = row.title ? measurePixelWidth(row.title, 15) : null;
  const pixelWidthDesc = row.metaDescription ? measurePixelWidth(row.metaDescription, 13) : null;

  const fields: [string, string | number | null | undefined][] = [
    ['Address', row.url],
    ['Status Code', row.statusCode],
    ['Status', row.statusText ?? (row.statusCode === null ? null : httpStatusText(row.statusCode))],
    ['Indexability', row.indexability],
    ['Indexability Reason', row.indexabilityReason],
    ['Content Type', row.contentType],
    ['Content Kind', row.contentKind],
    ['Size (Bytes)', row.contentLength],
    ['Response Time (ms)', row.responseTimeMs],
    ['Title 1', row.title],
    ['Title 1 Length', row.titleLength],
    ['Title 1 Pixel Width', pixelWidthTitle],
    ['Meta Description 1', row.metaDescription],
    ['Meta Description 1 Length', row.metaDescriptionLength],
    ['Meta Description 1 Pixel Width', pixelWidthDesc],
    ['H1-1', row.h1],
    ['H1-1 Length', row.h1Length],
    ['H1 Count', row.h1Count],
    ['H2 Count', row.h2Count],
    ['Word Count', row.wordCount],
    ['Canonical Link Element 1', row.canonical],
    ['Meta Robots 1', row.metaRobots],
    ['X-Robots-Tag 1', row.xRobotsTag],
    ['HTML Lang', row.lang],
    ['Viewport', row.viewport],
    ['OG Title', row.ogTitle],
    ['OG Description', row.ogDescription],
    ['OG Image', row.ogImage],
    ['Twitter Card', row.twitterCard],
    ['Twitter Title', row.twitterTitle],
    ['Twitter Description', row.twitterDescription],
    ['Twitter Image', row.twitterImage],
    ['Meta Keywords', row.metaKeywords],
    ['Meta Author', row.metaAuthor],
    ['Meta Generator', row.metaGenerator],
    ['Theme Color', row.themeColor],
    ['Strict-Transport-Security', row.hsts],
    ['X-Frame-Options', row.xFrameOptions],
    ['X-Content-Type-Options', row.xContentTypeOptions],
    ['Content-Encoding', row.contentEncoding],
    ['Schema Types', row.schemaTypes],
    ['JSON-LD Blocks', row.schemaBlockCount],
    ['Invalid JSON-LD Blocks', row.schemaInvalidCount > 0 ? row.schemaInvalidCount : null],
    ['Pagination Next', row.paginationNext],
    ['Pagination Prev', row.paginationPrev],
    ['Hreflang Count', row.hreflangCount > 0 ? row.hreflangCount : null],
    ['Hreflangs', summarizeHreflangs(row.hreflangs)],
    ['AMP HTML', row.amphtml],
    ['Favicon', row.favicon],
    ['Mixed Content (subresources)', row.mixedContentCount > 0 ? row.mixedContentCount : null],
    [
      'Redirect Chain Length',
      row.redirectChainLength > 0 ? row.redirectChainLength : null,
    ],
    ['Redirect Final URL', row.redirectFinalUrl],
    ['Redirect Loop', row.redirectLoop ? 'YES' : null],
    ['Folder Depth', row.folderDepth],
    ['Query Param Count', row.queryParamCount > 0 ? row.queryParamCount : null],
    ['Crawl Depth', row.depth],
    ['Inlinks', row.inlinks],
    ['Outlinks', row.outlinks],
    ['Redirect URL', row.redirectTarget],
    ['Last Crawled', row.crawledAt],
  ];

  return (
    <div className="p-3">
      <table className="w-full text-[11px]">
        <thead className="sticky top-0 bg-surface-900">
          <tr className="text-surface-400">
            <th className="w-64 py-1 pr-3 text-left font-medium">Name</th>
            <th className="py-1 text-left font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(([label, value]) => (
            <tr key={label} className="border-b border-surface-900 last:border-0">
              <td className="py-1.5 pr-3 align-top text-surface-400">{label}</td>
              <td
                className="break-all py-1.5 font-mono text-surface-100"
                title={value !== null && value !== undefined ? String(value) : ''}
              >
                {value === null || value === undefined || value === '' ? (
                  <span className="text-surface-700">—</span>
                ) : (
                  String(value)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface LinksColumn {
  id: string;
  header: string;
  width: number;
}

/** Canonical 16-column schema for Inlinks / Outlinks (Screaming Frog parity). */
const LINK_COLUMNS: LinksColumn[] = [
  { id: 'type', header: 'Type', width: 90 },
  { id: 'from', header: 'From', width: 320 },
  { id: 'to', header: 'To', width: 320 },
  { id: 'anchor', header: 'Anchor Text', width: 220 },
  { id: 'alt-text', header: 'Alt Text', width: 180 },
  { id: 'follow', header: 'Follow', width: 70 },
  { id: 'target', header: 'Target', width: 90 },
  { id: 'rel', header: 'Rel', width: 110 },
  { id: 'status-code', header: 'Status Code', width: 90 },
  { id: 'status', header: 'Status', width: 110 },
  { id: 'path-type', header: 'Path Type', width: 130 },
  { id: 'link-path', header: 'Link Path', width: 200 },
  { id: 'link-position', header: 'Link Position', width: 110 },
  { id: 'link-origin', header: 'Link Origin', width: 100 },
  { id: 'size', header: 'Size', width: 90 },
  { id: 'transferred', header: 'Transferred', width: 100 },
];

interface LinkFactsRow {
  fromUrl: string;
  toUrl: string;
  toStatusCode: number | null;
  toSize: number | null;
  type: LinkType;
  anchor: string | null;
  altText: string | null;
  rel: string | null;
  target: string | null;
  pathType: LinkPathType | null;
  linkPath: string | null;
  linkPosition: LinkPosition | null;
  linkOrigin: LinkOrigin;
}

/** Collapse a full link record into the 16 column cells shown in the UI. */
function buildLinkRow(r: LinkFactsRow): string[] {
  const follow = r.rel?.toLowerCase().includes('nofollow') ? 'False' : 'True';
  const size = formatSize(r.toSize);
  return [
    capitalise(r.type),
    r.fromUrl,
    r.toUrl,
    r.anchor ?? '',
    r.altText ?? '',
    follow,
    r.target ?? '',
    r.rel ?? '',
    r.toStatusCode?.toString() ?? '',
    r.toStatusCode !== null && r.toStatusCode !== undefined
      ? httpStatusText(r.toStatusCode)
      : '',
    r.pathType ? capitalisePathType(r.pathType) : '',
    r.linkPath ?? '',
    r.linkPosition ? capitalise(r.linkPosition) : '',
    r.linkOrigin.toUpperCase(),
    size,
    // Transferred bytes aren't tracked separately yet (we store the
    // decoded body length); mirror Size so the column is meaningful.
    size,
  ];
}

function capitalise(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

function capitalisePathType(t: LinkPathType): string {
  switch (t) {
    case 'absolute':
      return 'Absolute';
    case 'root-relative':
      return 'Root-Relative';
    case 'path-relative':
      return 'Path-Relative';
    case 'protocol-relative':
      return 'Protocol-Relative';
  }
}

function formatSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const LINKS_MIN_COL_WIDTH = 60;
const LINKS_HEADER_HEIGHT = 24;
const LINKS_ROW_HEIGHT = 26;
const LINKS_PREFS_PREFIX = 'link-col-widths:';

function LinksView({
  tableId,
  selectedUrlId,
  total,
  shown,
  columns,
  rows,
}: {
  tableId: string;
  selectedUrlId: number | null;
  total: number;
  shown: number;
  columns: LinksColumn[];
  rows: string[][];
}) {
  const prefsKey = LINKS_PREFS_PREFIX + tableId;
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const v = window.freecrawl.prefsGet(prefsKey);
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return v as Record<string, number>;
    }
    return {};
  });
  // Selected cells keyed "rowIdx:colIdx" so the same cell set survives
  // across renders even when the rows array is reconstructed by the parent.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const anchor = useRef<{ r: number; c: number } | null>(null);
  // Drag-selection state — null when not dragging. `base` holds the
  // pre-drag snapshot so Ctrl+drag can union drag range with prior picks.
  const dragRef = useRef<
    | { kind: 'cell'; aR: number; aC: number; r: number; c: number; additive: boolean; base: Set<string> }
    | { kind: 'column'; aC: number; c: number; additive: boolean; base: Set<string> }
    | null
  >(null);

  // Reset selection when the detail target or table switches — otherwise
  // stale cells from a previous URL would remain highlighted.
  useEffect(() => {
    setSelected(new Set());
    anchor.current = null;
    dragRef.current = null;
  }, [selectedUrlId, tableId]);

  // Clearing the drag on any mouseup guarantees that releasing the button
  // outside the table doesn't leave a "sticky" drag that extends on the
  // next mouseenter.
  useEffect(() => {
    const onUp = () => {
      dragRef.current = null;
    };
    document.addEventListener('mouseup', onUp);
    return () => document.removeEventListener('mouseup', onUp);
  }, []);

  const getWidth = (c: LinksColumn): number => colWidths[c.id] ?? c.width;
  const totalWidth = columns.reduce((n, c) => n + getWidth(c), 0);

  const writeWidths = (next: Record<string, number>) => {
    if (Object.keys(next).length === 0) {
      window.freecrawl.prefsDelete(prefsKey);
    } else {
      window.freecrawl.prefsSet(prefsKey, next);
    }
  };

  const startResize = (id: string, startWidth: number, clientX: number) => {
    const startX = clientX;
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const next = Math.max(LINKS_MIN_COL_WIDTH, Math.round(startWidth + delta));
      setColWidths((prev) => {
        const updated = { ...prev, [id]: next };
        writeWidths(updated);
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

  const resetColumn = (id: string) => {
    setColWidths((prev) => {
      const next = { ...prev };
      delete next[id];
      writeWidths(next);
      return next;
    });
  };

  const cellKey = (r: number, c: number) => `${r}:${c}`;

  const handleCellClick = (r: number, c: number, e: React.MouseEvent) => {
    // Shift+Click extends a vertical range within the anchor column. Users
    // expect Excel-like behaviour; rectangular multi-column ranges can come
    // later.
    if (e.shiftKey && anchor.current) {
      const a = anchor.current;
      const next = new Set(selected);
      if (a.c === c) {
        const [lo, hi] = a.r < r ? [a.r, r] : [r, a.r];
        for (let i = lo; i <= hi; i++) next.add(cellKey(i, c));
      } else {
        next.add(cellKey(r, c));
      }
      setSelected(next);
      return;
    }
    // Ctrl/Cmd+Click: toggle the single cell in the current selection.
    if (e.ctrlKey || e.metaKey) {
      const next = new Set(selected);
      const k = cellKey(r, c);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      setSelected(next);
      anchor.current = { r, c };
      return;
    }
    // Plain click: single-cell. Clicking the only selected cell again
    // clears the selection (matches spreadsheet behaviour).
    const k = cellKey(r, c);
    if (selected.size === 1 && selected.has(k)) {
      setSelected(new Set());
      anchor.current = null;
      return;
    }
    setSelected(new Set([k]));
    anchor.current = { r, c };
  };

  const handleHeaderClick = (c: number, e: React.MouseEvent) => {
    const keys = rows.map((_, r) => cellKey(r, c));
    if (e.ctrlKey || e.metaKey) {
      const next = new Set(selected);
      const allSelected = keys.every((k) => next.has(k));
      if (allSelected) {
        for (const k of keys) next.delete(k);
      } else {
        for (const k of keys) next.add(k);
      }
      setSelected(next);
      return;
    }
    setSelected(new Set(keys));
    anchor.current = rows.length > 0 ? { r: 0, c } : null;
  };

  // ──────── Drag selection ────────
  const applyCellDrag = (toR: number, toC: number) => {
    const d = dragRef.current;
    if (!d || d.kind !== 'cell') return;
    d.r = toR;
    d.c = toC;
    const loR = Math.min(d.aR, toR);
    const hiR = Math.max(d.aR, toR);
    const loC = Math.min(d.aC, toC);
    const hiC = Math.max(d.aC, toC);
    const next = new Set(d.base);
    for (let r = loR; r <= hiR; r++) {
      for (let c = loC; c <= hiC; c++) {
        next.add(cellKey(r, c));
      }
    }
    setSelected(next);
  };

  const applyColumnDrag = (toC: number) => {
    const d = dragRef.current;
    if (!d || d.kind !== 'column') return;
    d.c = toC;
    const loC = Math.min(d.aC, toC);
    const hiC = Math.max(d.aC, toC);
    const next = new Set(d.base);
    for (let c = loC; c <= hiC; c++) {
      for (let r = 0; r < rows.length; r++) {
        next.add(cellKey(r, c));
      }
    }
    setSelected(next);
  };

  const beginCellDrag = (r: number, c: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (e.shiftKey) {
      handleCellClick(r, c, e);
      return;
    }
    e.preventDefault();
    const additive = e.ctrlKey || e.metaKey;
    dragRef.current = {
      kind: 'cell',
      aR: r,
      aC: c,
      r,
      c,
      additive,
      base: additive ? new Set(selected) : new Set(),
    };
    anchor.current = { r, c };
    applyCellDrag(r, c);
  };

  const beginColumnDrag = (c: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (e.shiftKey) {
      handleHeaderClick(c, e);
      return;
    }
    e.preventDefault();
    const additive = e.ctrlKey || e.metaKey;
    dragRef.current = {
      kind: 'column',
      aC: c,
      c,
      additive,
      base: additive ? new Set(selected) : new Set(),
    };
    anchor.current = rows.length > 0 ? { r: 0, c } : null;
    applyColumnDrag(c);
  };

  return (
    <div className="flex h-full select-none flex-col">
      <div className="shrink-0 px-3 pt-2 text-[11px] text-surface-500">
        Showing <span className="font-mono text-surface-200">{shown.toLocaleString()}</span> of{' '}
        <span className="font-mono text-surface-200">{total.toLocaleString()}</span>
      </div>
      {rows.length === 0 ? (
        <div className="py-8 text-center text-xs text-surface-500">No links.</div>
      ) : (
        <div className="mt-2 flex-1 overflow-auto">
          <div style={{ minWidth: totalWidth, width: '100%' }}>
            <div
              className="sticky top-0 z-10 flex bg-surface-900 text-[11px]"
              style={{
                minWidth: totalWidth,
                width: '100%',
                height: LINKS_HEADER_HEIGHT,
              }}
            >
              {columns.map((c, ci) => {
                const w = getWidth(c);
                return (
                  <div
                    key={c.id}
                    className="relative flex cursor-pointer items-center border-b border-r border-surface-800 pl-2 pr-3 font-medium text-surface-400 hover:text-surface-100"
                    style={{ width: w, minWidth: w, flex: `0 0 ${w}px` }}
                    onMouseDown={(e) => beginColumnDrag(ci, e)}
                    onMouseEnter={() => {
                      if (dragRef.current?.kind === 'column') applyColumnDrag(ci);
                    }}
                    title="Click to select column · drag across headers to select multiple · drag right edge to resize"
                  >
                    <span className="truncate">{c.header}</span>
                    <div
                      className="absolute -right-1 top-0 bottom-0 z-20 w-2 cursor-col-resize hover:bg-accent-500/40"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startResize(c.id, w, e.clientX);
                      }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        resetColumn(c.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      title="Drag to resize · double-click to reset"
                    />
                  </div>
                );
              })}
              <div className="flex-1 border-b border-surface-800" />
            </div>
            {rows.map((r, ri) => (
              <div
                key={ri}
                className="flex border-b border-surface-900 text-[11px]"
                style={{
                  minWidth: totalWidth,
                  width: '100%',
                  height: LINKS_ROW_HEIGHT,
                }}
              >
                {r.map((cell, ci) => {
                  const col = columns[ci];
                  if (!col) return null;
                  const w = getWidth(col);
                  const isSel = selected.has(cellKey(ri, ci));
                  return (
                    <div
                      key={ci}
                      className={clsx(
                        'flex cursor-cell items-center overflow-hidden border-r border-surface-900 px-2',
                        isSel
                          ? 'bg-accent-500/25 text-surface-50'
                          : 'text-surface-300 hover:bg-surface-900/60',
                        ci === 0 && !isSel && 'font-mono text-surface-100',
                        ci === 0 && isSel && 'font-mono',
                      )}
                      style={{ width: w, minWidth: w, flex: `0 0 ${w}px` }}
                      onMouseDown={(e) => beginCellDrag(ri, ci, e)}
                      onMouseEnter={() => {
                        if (dragRef.current?.kind === 'cell') applyCellDrag(ri, ci);
                      }}
                      title={cell}
                    >
                      <span className="block truncate">
                        {cell || <span className="text-surface-700">—</span>}
                      </span>
                    </div>
                  );
                })}
                <div className="flex-1" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SerpSnippet({ row }: { row: CrawlUrlRow }) {
  const title = row.title ?? '(no title)';
  const desc = row.metaDescription ?? '(no meta description)';
  const titlePx = row.title ? measurePixelWidth(row.title, 15) : 0;
  const descPx = row.metaDescription ? measurePixelWidth(row.metaDescription, 13) : 0;
  const titleLimit = 600;
  const descLimit = 990;

  return (
    <div className="p-5">
      <div className="max-w-[580px] rounded border border-surface-800 bg-surface-900 p-4">
        <div className="mb-1 truncate text-[12px] text-surface-400">{displayUrl(row.url)}</div>
        <div
          className="mb-1 text-[18px] leading-snug text-[#8ab4f8]"
          style={{ maxWidth: 600 }}
        >
          {title.length > 100 ? title.slice(0, 100) + '…' : title}
        </div>
        <div className="text-[13px] leading-snug text-surface-300" style={{ maxWidth: 600 }}>
          {desc.length > 200 ? desc.slice(0, 200) + '…' : desc}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
        <InfoLine label="Title pixel width" value={`${titlePx}px / ${titleLimit}px`} warn={titlePx > titleLimit} />
        <InfoLine label="Title length" value={String(row.titleLength ?? 0) + ' chars'} />
        <InfoLine
          label="Description pixel width"
          value={`${descPx}px / ${descLimit}px`}
          warn={descPx > descLimit}
        />
        <InfoLine
          label="Description length"
          value={String(row.metaDescriptionLength ?? 0) + ' chars'}
        />
      </div>
    </div>
  );
}

function InfoLine({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded border border-surface-800 bg-surface-900 px-3 py-2">
      <span className="text-surface-400">{label}</span>
      <span className={clsx('font-mono', warn ? 'text-amber-400' : 'text-surface-100')}>
        {value}
      </span>
    </div>
  );
}

function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname === '/' ? '' : u.pathname);
  } catch {
    return url;
  }
}

// Crude pixel-width approximation using a canvas
let canvas: HTMLCanvasElement | null = null;
function measurePixelWidth(text: string, fontPx: number): number {
  if (!canvas) {
    canvas = document.createElement('canvas');
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;
  ctx.font = `${fontPx}px Arial, sans-serif`;
  return Math.round(ctx.measureText(text).width);
}

function httpStatusText(code: number): string {
  if (code >= 200 && code < 300) return 'OK';
  if (code >= 300 && code < 400) return 'Redirect';
  if (code >= 400 && code < 500) return 'Client Error';
  if (code >= 500) return 'Server Error';
  return '';
}

/**
 * Render the JSON-stringified hreflang array as a single line of
 * `lang -> href` pairs, separated by ` · `. Returns null on empty/parse
 * failure so the row falls back to the "—" placeholder.
 */
function summarizeHreflangs(json: string | null): string | null {
  if (!json) return null;
  try {
    const arr = JSON.parse(json) as { lang: string; href: string }[];
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr.map((h) => `${h.lang} → ${h.href}`).join(' · ');
  } catch {
    return null;
  }
}
