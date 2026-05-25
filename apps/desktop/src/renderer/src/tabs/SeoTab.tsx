import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import { Loader2, Search, Play, AlertTriangle } from 'lucide-react';
import type {
  AhrefsMetrics,
  IntegrationsState,
  MajesticMetrics,
  MozMetrics,
  SemrushMetrics,
  SeoMetrics,
  SeoProgress,
  SeoProvider,
  SeoRow,
} from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

const TOOLBAR_HEIGHT = 36;
const HEADER_HEIGHT = 26;
const STATUS_BAR_HEIGHT = 22;
const ROW_HEIGHT = 30;
const PAGE_SIZE = 2000;
const POLL_MS_RUNNING = 5000;
const CONFIRM_THRESHOLD = 30;

const PROVIDER_LABEL: Record<SeoProvider, string> = {
  ahrefs: 'Ahrefs',
  majestic: 'Majestic',
  moz: 'Moz',
  semrush: 'Semrush',
};

type FilterMode = 'all' | 'with-data' | 'without-data' | 'error';

/** Per-provider column headers + a value extractor for each metric. */
const PROVIDER_COLUMNS: Record<
  SeoProvider,
  { label: string; key: string }[]
> = {
  ahrefs: [
    { label: 'DR', key: 'domainRating' },
    { label: 'UR', key: 'urlRating' },
    { label: 'Backlinks', key: 'backlinks' },
    { label: 'Ref Domains', key: 'refDomains' },
  ],
  majestic: [
    { label: 'TF', key: 'trustFlow' },
    { label: 'CF', key: 'citationFlow' },
    { label: 'Ext Backlinks', key: 'externalBacklinks' },
    { label: 'Ref Domains', key: 'refDomains' },
  ],
  moz: [
    { label: 'DA', key: 'domainAuthority' },
    { label: 'PA', key: 'pageAuthority' },
    { label: 'Spam', key: 'spamScore' },
    { label: 'Linking Domains', key: 'linkingDomains' },
  ],
  semrush: [
    { label: 'Org KW', key: 'organicKeywords' },
    { label: 'Org Traffic', key: 'organicTraffic' },
    { label: 'Org Cost ($)', key: 'organicCost' },
    { label: 'Paid KW', key: 'adwordsKeywords' },
  ],
};

function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1000) return v.toLocaleString();
  return String(Math.round(v * 100) / 100);
}

function relativeTime(iso: string): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const min = Math.floor((Date.now() - then) / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function metricValue(provider: SeoProvider, metrics: SeoMetrics | null, key: string): number | null {
  if (!metrics) return null;
  // Each provider's metrics object only carries its own keys — narrow by
  // provider so TS knows the shape.
  switch (provider) {
    case 'ahrefs':
      return (metrics as AhrefsMetrics)[key as keyof AhrefsMetrics] ?? null;
    case 'majestic':
      return (metrics as MajesticMetrics)[key as keyof MajesticMetrics] ?? null;
    case 'moz':
      return (metrics as MozMetrics)[key as keyof MozMetrics] ?? null;
    case 'semrush':
      return (metrics as SemrushMetrics)[key as keyof SemrushMetrics] ?? null;
  }
}

export function SeoTab() {
  const { t } = useTranslation();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const crawlProgress = useAppStore((s) => s.progress);

  const [provider, setProvider] = useState<SeoProvider>('ahrefs');
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<SeoProgress | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationsState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    const res = await window.freecrawl.seoQuery({
      limit: PAGE_SIZE,
      offset: 0,
      search: search || undefined,
      provider,
      filter,
    });
    setRows(res.rows);
    setTotal(res.total);
  }, [search, filter, provider]);

  useEffect(() => {
    let cancelled = false;
    void reload();
    if (!crawlProgress?.running) return;
    const id = setInterval(() => {
      if (!cancelled) void reload();
    }, POLL_MS_RUNNING);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [reload, dataVersion, crawlProgress?.running]);

  useEffect(() => {
    void window.freecrawl.integrationsGetAll().then(setIntegrations);
  }, [provider]);

  useEffect(() => {
    const off = window.freecrawl.onSeoProgress((p) => {
      setProgress(p.running ? p : null);
      if (!p.currentUrl) void reload();
    });
    return off;
  }, [reload]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 16,
    getItemKey: (i) => rows[i]?.url ?? `idx-${i}`,
  });

  const allLoadedSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.url));

  const toggleRow = useCallback((url: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }, []);
  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (rows.length > 0 && rows.every((r) => prev.has(r.url))) return new Set();
      return new Set(rows.map((r) => r.url));
    });
  }, [rows]);
  const selectUntested = useCallback(() => {
    setSelected(new Set(rows.filter((r) => !r.seo).map((r) => r.url)));
  }, [rows]);

  const providerConfigured = integrations?.[provider]?.configured ?? false;

  const runSeo = useCallback(async () => {
    const urls = [...selected];
    if (urls.length === 0 || running) return;
    if (!providerConfigured) return;
    if (
      urls.length > CONFIRM_THRESHOLD &&
      !window.confirm(
        t('seoTab.confirmRun', {
          defaultValue:
            'This will fetch {{count}} URLs from {{provider}}. Continue?',
          count: urls.length,
          provider: PROVIDER_LABEL[provider],
        }),
      )
    )
      return;
    setRunning(true);
    setProgress({ done: 0, total: urls.length, currentUrl: null, running: true });
    try {
      await window.freecrawl.seoRun({ provider, urls });
    } finally {
      setRunning(false);
      setProgress(null);
      void reload();
    }
  }, [selected, running, providerConfigured, provider, t, reload]);

  const cancelRun = useCallback(() => {
    void window.freecrawl.seoCancel();
  }, []);

  const cols = PROVIDER_COLUMNS[provider];
  const testedCount = useMemo(() => rows.filter((r) => r.seo).length, [rows]);
  const errorCount = useMemo(
    () => rows.filter((r) => r.seo?.status === 'error').length,
    [rows],
  );

  return (
    <div className="flex h-full w-full flex-col bg-surface-950">
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 border-b border-surface-800 bg-surface-900/40 px-3"
        style={{ height: TOOLBAR_HEIGHT }}
      >
        <div className="text-[12px] font-semibold tracking-wide text-surface-100">
          {t('seoTab.title', { defaultValue: 'SEO Authority' })}
        </div>
        <div className="relative">
          <Search
            size={12}
            className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-surface-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('seoTab.filterPlaceholder', { defaultValue: 'Filter by URL…' })}
            className="h-6 w-48 rounded border border-surface-700 bg-surface-950 pl-6 pr-2 text-[11px] text-surface-100 placeholder-surface-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <select
          className="h-6 rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterMode)}
        >
          <option value="all">{t('seoTab.filterAll', { defaultValue: 'All pages' })}</option>
          <option value="with-data">{t('seoTab.filterWith', { defaultValue: 'With data' })}</option>
          <option value="without-data">{t('seoTab.filterWithout', { defaultValue: 'No data' })}</option>
          <option value="error">{t('seoTab.filterError', { defaultValue: 'Errors only' })}</option>
        </select>
        <label className="flex items-center gap-1 text-[11px] text-surface-400">
          {t('seoTab.provider', { defaultValue: 'Provider:' })}
          <select
            className="h-6 rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
            value={provider}
            onChange={(e) => setProvider(e.target.value as SeoProvider)}
            disabled={running}
          >
            <option value="ahrefs">{PROVIDER_LABEL.ahrefs}</option>
            <option value="majestic">{PROVIDER_LABEL.majestic}</option>
            <option value="moz">{PROVIDER_LABEL.moz}</option>
            <option value="semrush">{PROVIDER_LABEL.semrush}</option>
          </select>
        </label>
        <button
          type="button"
          onClick={selectUntested}
          disabled={running || rows.length === 0}
          className="h-6 rounded border border-surface-700 bg-surface-800 px-2 text-[11px] text-surface-200 hover:bg-surface-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('seoTab.selectUntested', { defaultValue: 'Select untested' })}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {running && progress ? (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-surface-300">
                <Loader2 size={12} className="animate-spin text-blue-400" />
                {t('seoTab.runProgress', {
                  defaultValue: '{{done}} / {{total}}',
                  done: progress.done,
                  total: progress.total,
                })}
              </span>
              <button
                type="button"
                onClick={cancelRun}
                className="h-6 rounded border border-red-700 bg-red-900/40 px-2.5 text-[11px] font-medium text-red-200 hover:bg-red-900/70"
              >
                {t('seoTab.cancel', { defaultValue: 'Cancel' })}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void runSeo()}
              disabled={selected.size === 0 || running || !providerConfigured}
              className="inline-flex h-6 items-center gap-1.5 rounded bg-blue-600 px-3 text-[11px] font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-surface-700 disabled:text-surface-500"
            >
              <Play size={11} />
              {t('seoTab.run', {
                defaultValue: 'Fetch ({{count}})',
                count: selected.size,
              })}
            </button>
          )}
        </div>
      </div>

      {!providerConfigured && (
        <div className="flex items-center gap-2 border-b border-amber-700/40 bg-amber-900/20 px-3 py-1 text-[10px] text-amber-200">
          <AlertTriangle size={11} />
          {t('seoTab.notConfigured', {
            defaultValue:
              '{{provider}} is not configured — set its credentials in Settings → Integrations to fetch data.',
            provider: PROVIDER_LABEL[provider],
          })}
        </div>
      )}

      {/* Column header */}
      <div
        className="flex shrink-0 select-none items-center border-b border-surface-800 bg-surface-900/60 text-[10px] font-medium text-surface-400"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex w-[30px] items-center justify-center">
          <input
            type="checkbox"
            checked={allLoadedSelected}
            ref={(el) => {
              if (el) el.indeterminate = selected.size > 0 && !allLoadedSelected;
            }}
            onChange={toggleAll}
            disabled={rows.length === 0}
            className="h-3 w-3 accent-blue-500"
          />
        </div>
        <div className="flex-1 px-2">{t('seoTab.colUrl', { defaultValue: 'URL' })}</div>
        <div className="w-[54px] shrink-0 text-center">{t('seoTab.colStatus', { defaultValue: 'Status' })}</div>
        {cols.map((c) => (
          <div key={c.key} className="w-[110px] shrink-0 text-right px-2">
            {c.label}
          </div>
        ))}
        <div className="w-[88px] shrink-0 px-2 text-right">
          {t('seoTab.colFetched', { defaultValue: 'Fetched' })}
        </div>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-[12px] text-surface-500">
            {total === 0
              ? t('seoTab.emptyNoData', {
                  defaultValue:
                    'No internal HTML pages crawled yet — run a crawl, then select pages and Fetch.',
                })
              : t('seoTab.emptyNoMatch', { defaultValue: 'No pages match the current filter.' })}
          </div>
        ) : (
          <div
            style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}
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
                    height: ROW_HEIGHT,
                    transform: `translateY(${vRow.start}px)`,
                  }}
                >
                  <SeoDataRow
                    row={row}
                    provider={provider}
                    cols={cols}
                    selected={selected.has(row.url)}
                    onToggle={() => toggleRow(row.url)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center gap-3 border-t border-surface-800 bg-surface-900/40 px-3 text-[11px] text-surface-400"
        style={{ height: STATUS_BAR_HEIGHT }}
      >
        <span>
          {t('seoTab.summary', {
            defaultValue:
              '{{shown}} pages · {{tested}} with data · {{errors}} errors · {{selected}} selected',
            shown: rows.length.toLocaleString(),
            tested: testedCount.toLocaleString(),
            errors: errorCount.toLocaleString(),
            selected: selected.size.toLocaleString(),
          })}
        </span>
        {running && progress?.currentUrl && (
          <span className="truncate text-surface-500">
            {t('seoTab.running', { defaultValue: 'Fetching: {{url}}', url: progress.currentUrl })}
          </span>
        )}
      </div>
    </div>
  );
}

function SeoDataRow({
  row,
  provider,
  cols,
  selected,
  onToggle,
}: {
  row: SeoRow;
  provider: SeoProvider;
  cols: { label: string; key: string }[];
  selected: boolean;
  onToggle: () => void;
}) {
  const s = row.seo;
  const status = row.statusCode;
  const statusCls =
    status === null
      ? 'text-surface-600'
      : status >= 200 && status < 300
        ? 'text-emerald-400'
        : status >= 300 && status < 400
          ? 'text-blue-400'
          : 'text-red-400';

  return (
    <div
      onClick={onToggle}
      className={`flex h-full cursor-pointer items-center text-[11px] ${
        selected ? 'bg-blue-900/30' : 'odd:bg-surface-900/20 hover:bg-surface-800/40'
      }`}
    >
      <div className="flex w-[30px] items-center justify-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="h-3 w-3 accent-blue-500"
        />
      </div>
      <div className="flex-1 truncate px-2 text-surface-200" title={row.url}>
        {row.url}
      </div>
      <div className={`w-[54px] shrink-0 text-center tabular-nums ${statusCls}`}>
        {status ?? '—'}
      </div>
      {s?.status === 'error' ? (
        <div
          className="w-[440px] shrink-0 truncate px-2 text-red-400"
          title={s.error ?? 'Error'}
          style={{ width: cols.length * 110 }}
        >
          {s.error ?? 'Error'}
        </div>
      ) : (
        cols.map((c) => (
          <div
            key={c.key}
            className="w-[110px] shrink-0 text-right px-2 tabular-nums text-surface-200"
          >
            {fmtNum(metricValue(provider, s?.metrics ?? null, c.key))}
          </div>
        ))
      )}
      <div className="w-[88px] shrink-0 truncate px-2 text-right text-surface-500">
        {s ? relativeTime(s.fetchedAt) : '—'}
      </div>
    </div>
  );
}
