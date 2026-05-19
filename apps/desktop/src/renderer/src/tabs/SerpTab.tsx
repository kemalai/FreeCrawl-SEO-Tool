import { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import type { CrawlUrlRow } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

const CARD_HEIGHT = 132;
const HEADER_HEIGHT = 32;
const STATUS_BAR_HEIGHT = 22;
const PAGE_SIZE = 2000;
const POLL_MS_RUNNING = 3000;
const POLL_MS_IDLE = 30_000;

// Google's mobile SERP truncates titles around 600 px and descriptions
// around 990 px (rendered with their UI font). We approximate with Arial
// at the same point sizes — close enough to flag over-budget snippets
// without false negatives.
const TITLE_PX_LIMIT = 600;
const DESC_PX_LIMIT = 990;
const TITLE_CHAR_HARD_CAP = 100;
const DESC_CHAR_HARD_CAP = 200;

type SortMode = 'inlinks' | 'url' | 'title-length-desc' | 'desc-length-desc';

export function SerpTab() {
  const { t } = useTranslation();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const progress = useAppStore((s) => s.progress);
  const setSelectedUrlId = useAppStore((s) => s.setSelectedUrlId);
  const selectedUrlId = useAppStore((s) => s.selectedUrlId);
  const [rows, setRows] = useState<CrawlUrlRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('inlinks');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const sortBy =
        sortMode === 'inlinks'
          ? 'inlinks'
          : sortMode === 'url'
            ? 'url'
            : sortMode === 'title-length-desc'
              ? 'titleLength'
              : 'metaDescriptionLength';
      const sortDir: 'asc' | 'desc' = sortMode === 'url' ? 'asc' : 'desc';
      const res = await window.freecrawl.urlsQuery({
        limit: PAGE_SIZE,
        offset: 0,
        category: 'tab:serp',
        search: search || undefined,
        sortBy,
        sortDir,
      });
      if (cancelled) return;
      setRows(res.rows);
      setTotal(res.total);
    };
    void load();
    const cadence = progress?.running ? POLL_MS_RUNNING : POLL_MS_IDLE;
    const id = setInterval(load, cadence);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [search, sortMode, dataVersion, progress?.running]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_HEIGHT,
    overscan: 12,
    getItemKey: (index) => {
      const r = rows[index];
      return r ? r.id : `idx-${index}`;
    },
  });

  return (
    <div className="flex h-full w-full flex-col bg-surface-950">
      <div
        className="flex items-center gap-3 border-b border-surface-800 bg-surface-900/40 px-3"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="text-[12px] font-semibold tracking-wide text-surface-100">
          {t('serpTab.title', { defaultValue: 'SERP Preview' })}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('serpTab.filterPlaceholder', { defaultValue: 'Filter by URL or title…' })}
          className="h-6 w-72 rounded border border-surface-700 bg-surface-950 px-2 text-[11px] text-surface-100 placeholder-surface-500 focus:border-blue-500 focus:outline-none"
        />
        <label className="flex items-center gap-1 text-[11px] text-surface-400">
          {t('serpTab.sort', { defaultValue: 'Sort:' })}
          <select
            className="h-6 rounded border border-surface-700 bg-surface-950 px-2 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="inlinks">{t('serpTab.sortInlinks', { defaultValue: 'Inlinks (most-linked first)' })}</option>
            <option value="url">{t('serpTab.sortUrl', { defaultValue: 'URL (alphabetical)' })}</option>
            <option value="title-length-desc">{t('serpTab.sortTitleLen', { defaultValue: 'Longest title first' })}</option>
            <option value="desc-length-desc">{t('serpTab.sortDescLen', { defaultValue: 'Longest description first' })}</option>
          </select>
        </label>
        <div className="ml-auto text-[11px] text-surface-500">
          {t('serpTab.summary', {
            defaultValue: '{{shown}} of {{total}} indexable pages',
            shown: rows.length.toLocaleString(),
            total: total.toLocaleString(),
          })}
          {total > rows.length && ' ' + t('serpTab.firstN', { defaultValue: '(first {{n}})', n: PAGE_SIZE.toLocaleString() })}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-surface-950 px-6 py-4"
      >
        {rows.length === 0 && (
          <div className="flex h-full items-center justify-center text-[12px] text-surface-500">
            {total === 0
              ? t('serpTab.emptyNoData', { defaultValue: 'No indexable HTML pages with a title yet — run a crawl to populate SERP previews.' })
              : t('serpTab.emptyNoMatch', { defaultValue: 'No pages match the current filter.' })}
          </div>
        )}
        {rows.length > 0 && (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((vRow) => {
              const row = rows[vRow.index];
              if (!row) return null;
              return (
                <div
                  key={vRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: CARD_HEIGHT,
                    transform: `translateY(${vRow.start}px)`,
                  }}
                  className="pb-3"
                >
                  <SerpCard
                    row={row}
                    active={selectedUrlId === row.id}
                    onClick={() => setSelectedUrlId(row.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="flex items-center gap-3 border-t border-surface-800 bg-surface-900/40 px-3 text-[11px] text-surface-400"
        style={{ height: STATUS_BAR_HEIGHT }}
      >
        <span>
          Click a card to select that URL · Title budget {TITLE_PX_LIMIT}px · Description budget {DESC_PX_LIMIT}px
        </span>
      </div>
    </div>
  );
}

function SerpCard({
  row,
  active,
  onClick,
}: {
  row: CrawlUrlRow;
  active: boolean;
  onClick: () => void;
}) {
  const title = row.title ?? '(no title)';
  const desc = row.metaDescription ?? '';
  const titlePx = row.title ? measurePixelWidth(row.title, 15) : 0;
  const descPx = desc ? measurePixelWidth(desc, 13) : 0;
  const titleOver = titlePx > TITLE_PX_LIMIT;
  const descOver = descPx > DESC_PX_LIMIT;

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'group block w-full max-w-[760px] cursor-pointer rounded border bg-surface-900 px-4 py-2.5 text-left transition ' +
        (active
          ? 'border-blue-500 ring-1 ring-blue-500/40'
          : 'border-surface-800 hover:border-blue-500/60 hover:bg-surface-900/80')
      }
    >
      <div className="mb-0.5 truncate text-[12px] text-surface-400">
        {displayUrl(row.url)}
      </div>
      <div
        className="mb-0.5 line-clamp-1 text-[18px] leading-snug text-[#8ab4f8]"
        title={title}
      >
        {title.length > TITLE_CHAR_HARD_CAP
          ? title.slice(0, TITLE_CHAR_HARD_CAP) + '…'
          : title}
      </div>
      <div
        className="mb-1 line-clamp-2 text-[13px] leading-snug text-surface-300"
        title={desc || '(no meta description)'}
      >
        {desc ? (
          desc.length > DESC_CHAR_HARD_CAP ? (
            desc.slice(0, DESC_CHAR_HARD_CAP) + '…'
          ) : (
            desc
          )
        ) : (
          <span className="italic text-surface-500">
            (no meta description — Google falls back to page text)
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[10px] text-surface-500">
        <span className={titleOver ? 'text-amber-400' : ''}>
          Title: {titlePx}px / {TITLE_PX_LIMIT}px · {row.titleLength ?? 0} chars
        </span>
        {desc && (
          <span className={descOver ? 'text-amber-400' : ''}>
            Desc: {descPx}px / {DESC_PX_LIMIT}px · {row.metaDescriptionLength ?? 0} chars
          </span>
        )}
        <span>Inlinks: {(row.inlinks ?? 0).toLocaleString()}</span>
      </div>
    </button>
  );
}

function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const path = u.pathname === '/' ? '' : u.pathname;
    return `${host}${path}`;
  } catch {
    return url;
  }
}

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
