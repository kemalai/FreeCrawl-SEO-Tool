import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import { Smartphone, Monitor, Loader2 } from 'lucide-react';
import type {
  CruxMetrics,
  CruxProgress,
  CruxRow,
  CruxRunFormFactor,
} from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

const TOOLBAR_HEIGHT = 36;
const HEADER_HEIGHT = 46;
const STATUS_BAR_HEIGHT = 22;
const ROW_HEIGHT = 30;
const PAGE_SIZE = 2000;
const POLL_MS_RUNNING = 5000;
/** Above this many records, warn before kicking off the run. */
const CONFIRM_THRESHOLD = 50;

/** Pixel widths of the five CrUX metric cells (shared by header + rows). */
const W_LCP = 58;
const W_INP = 52;
const W_CLS = 50;
const W_FCP = 58;
const W_TTFB = 58;
const GROUP_WIDTH = W_LCP + W_INP + W_CLS + W_FCP + W_TTFB;

type FilterMode = 'all' | 'tested' | 'untested';

/** Core Web Vitals thresholds → cell colour. */
function cwvClass(v: number | null, good: number, poor: number): string {
  if (v === null) return 'text-surface-600';
  if (v <= good) return 'text-emerald-400';
  if (v <= poor) return 'text-amber-400';
  return 'text-red-400';
}

/** Format a millisecond timing compactly (e.g. `1.8s`, `420ms`). */
function fmtMs(v: number | null): string {
  if (v === null) return '—';
  if (v >= 1000) return `${(v / 1000).toFixed(1)}s`;
  return `${Math.round(v)}ms`;
}

function fmtCls(v: number | null): string {
  return v === null ? '—' : v.toFixed(3);
}

/** Short relative time for the "Fetched" column. */
function relativeTime(iso: string): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function CruxTab() {
  const { t } = useTranslation();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const crawlProgress = useAppStore((s) => s.progress);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  const [rows, setRows] = useState<CruxRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [formFactor, setFormFactor] = useState<CruxRunFormFactor>('phone');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<CruxProgress | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    const res = await window.freecrawl.cruxQuery({
      limit: PAGE_SIZE,
      offset: 0,
      search: search || undefined,
      filter,
    });
    setRows(res.rows);
    setTotal(res.total);
  }, [search, filter]);

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

  // CrUX has no keyless mode — surface the gate banner when unset.
  useEffect(() => {
    void window.freecrawl.integrationsGetAll().then((state) => {
      setHasApiKey(state['crux']?.fields?.['apiKey']?.set ?? false);
    });
  }, []);

  useEffect(() => {
    const off = window.freecrawl.onCruxProgress((p) => {
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
    getItemKey: (index) => rows[index]?.url ?? `idx-${index}`,
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
      if (rows.length > 0 && rows.every((r) => prev.has(r.url))) {
        return new Set();
      }
      return new Set(rows.map((r) => r.url));
    });
  }, [rows]);

  const selectUntested = useCallback(() => {
    setSelected(
      new Set(rows.filter((r) => !r.phone && !r.desktop).map((r) => r.url)),
    );
  }, [rows]);

  const ffCount = formFactor === 'both' ? 2 : 1;
  const recordCount = selected.size * ffCount;

  const runFetch = useCallback(async () => {
    const urls = [...selected];
    if (urls.length === 0 || running || !hasApiKey) return;
    if (
      recordCount > CONFIRM_THRESHOLD &&
      !window.confirm(
        t('cruxTab.confirmRun', {
          defaultValue:
            'This will request CrUX data for {{count}} records. Continue?',
          count: recordCount,
        }),
      )
    ) {
      return;
    }
    setRunning(true);
    setProgress({ done: 0, total: recordCount, currentUrl: null, running: true });
    try {
      await window.freecrawl.cruxRun({ urls, formFactor });
    } finally {
      setRunning(false);
      setProgress(null);
      void reload();
    }
  }, [selected, running, recordCount, formFactor, hasApiKey, t, reload]);

  const cancelRun = useCallback(() => {
    void window.freecrawl.cruxCancel();
  }, []);

  const testedCount = useMemo(
    () => rows.filter((r) => r.phone || r.desktop).length,
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
          {t('cruxTab.title', { defaultValue: 'Chrome UX Report' })}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('cruxTab.filterPlaceholder', {
            defaultValue: 'Filter by URL…',
          })}
          className="h-6 w-56 rounded border border-surface-700 bg-surface-950 px-2 text-[11px] text-surface-100 placeholder-surface-500 focus:border-blue-500 focus:outline-none"
        />
        <select
          className="h-6 rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterMode)}
        >
          <option value="all">
            {t('cruxTab.filterAll', { defaultValue: 'All pages' })}
          </option>
          <option value="tested">
            {t('cruxTab.filterTested', { defaultValue: 'Fetched only' })}
          </option>
          <option value="untested">
            {t('cruxTab.filterUntested', { defaultValue: 'Not fetched only' })}
          </option>
        </select>
        <label className="flex items-center gap-1 text-[11px] text-surface-400">
          {t('cruxTab.formFactor', { defaultValue: 'Device:' })}
          <select
            className="h-6 rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
            value={formFactor}
            onChange={(e) => setFormFactor(e.target.value as CruxRunFormFactor)}
            disabled={running}
          >
            <option value="phone">
              {t('cruxTab.devicePhone', { defaultValue: 'Phone' })}
            </option>
            <option value="desktop">
              {t('cruxTab.deviceDesktop', { defaultValue: 'Desktop' })}
            </option>
            <option value="both">
              {t('cruxTab.deviceBoth', { defaultValue: 'Phone + Desktop' })}
            </option>
          </select>
        </label>
        <button
          type="button"
          onClick={selectUntested}
          disabled={running || rows.length === 0}
          className="h-6 rounded border border-surface-700 bg-surface-800 px-2 text-[11px] text-surface-200 hover:bg-surface-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('cruxTab.selectUntested', { defaultValue: 'Select not fetched' })}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {running && progress ? (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-surface-300">
                <Loader2 size={12} className="animate-spin text-blue-400" />
                {t('cruxTab.runProgress', {
                  defaultValue: 'Fetching {{done}} / {{total}}',
                  done: progress.done,
                  total: progress.total,
                })}
              </span>
              <button
                type="button"
                onClick={cancelRun}
                className="h-6 rounded border border-red-700 bg-red-900/40 px-2.5 text-[11px] font-medium text-red-200 hover:bg-red-900/70"
              >
                {t('cruxTab.cancel', { defaultValue: 'Cancel' })}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void runFetch()}
              disabled={selected.size === 0 || running || !hasApiKey}
              title={
                !hasApiKey
                  ? t('cruxTab.runDisabledNoKey', {
                      defaultValue:
                        'Add a Chrome UX Report API key in Settings → Integrations to enable fetching.',
                    })
                  : undefined
              }
              className="h-6 rounded bg-blue-600 px-3 text-[11px] font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-surface-700 disabled:text-surface-500"
            >
              {t('cruxTab.run', {
                defaultValue: 'Fetch CrUX ({{count}})',
                count: recordCount,
              })}
            </button>
          )}
        </div>
      </div>

      {/* No-key gate — CrUX has no keyless mode at all. */}
      {!hasApiKey && (
        <div className="flex items-center gap-2 border-b border-amber-700/50 bg-amber-900/25 px-3 py-1.5 text-[11px] text-amber-100">
          <span className="font-semibold">⚠</span>
          <span className="flex-1">
            {t('cruxTab.noKeyGate', {
              defaultValue:
                'The Chrome UX Report API needs a free Google API key (no keyless mode). Enable the "Chrome UX Report API" on your key.',
            })}
          </span>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded border border-amber-500/60 bg-amber-700/40 px-2 py-0.5 text-[10px] font-medium text-amber-50 hover:bg-amber-700/70"
          >
            {t('cruxTab.addKeyCta', { defaultValue: 'Add API Key…' })}
          </button>
        </div>
      )}

      {/* Column header (two-tier: device groups + metric labels) */}
      <div
        className="flex shrink-0 select-none items-stretch border-b border-surface-800 bg-surface-900/60 text-[10px] font-medium text-surface-400"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex w-[30px] items-center justify-center border-r border-surface-800">
          <input
            type="checkbox"
            checked={allLoadedSelected}
            ref={(el) => {
              if (el) {
                el.indeterminate = selected.size > 0 && !allLoadedSelected;
              }
            }}
            onChange={toggleAll}
            disabled={rows.length === 0}
            className="h-3 w-3 accent-blue-500"
          />
        </div>
        <div className="flex flex-1 flex-col justify-end border-r border-surface-800 px-2 pb-1">
          {t('cruxTab.colUrl', { defaultValue: 'URL' })}
        </div>
        {(['phone', 'desktop'] as const).map((ff) => (
          <div
            key={ff}
            className="flex flex-col border-r border-surface-800"
            style={{ width: GROUP_WIDTH }}
          >
            <div className="flex h-[22px] items-center justify-center gap-1 border-b border-surface-800 bg-surface-900/80 text-surface-300">
              {ff === 'phone' ? <Smartphone size={11} /> : <Monitor size={11} />}
              {ff === 'phone'
                ? t('cruxTab.groupPhone', { defaultValue: 'Phone' })
                : t('cruxTab.groupDesktop', { defaultValue: 'Desktop' })}
            </div>
            <div className="flex flex-1 items-end pb-1 text-center">
              <div style={{ width: W_LCP }}>{t('cruxTab.colLcp', { defaultValue: 'LCP' })}</div>
              <div style={{ width: W_INP }}>{t('cruxTab.colInp', { defaultValue: 'INP' })}</div>
              <div style={{ width: W_CLS }}>{t('cruxTab.colCls', { defaultValue: 'CLS' })}</div>
              <div style={{ width: W_FCP }}>{t('cruxTab.colFcp', { defaultValue: 'FCP' })}</div>
              <div style={{ width: W_TTFB }}>{t('cruxTab.colTtfb', { defaultValue: 'TTFB' })}</div>
            </div>
          </div>
        ))}
        <div className="flex w-[96px] flex-col justify-end px-2 pb-1 text-right">
          {t('cruxTab.colFetched', { defaultValue: 'Fetched' })}
        </div>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-[12px] text-surface-500">
            {total === 0
              ? t('cruxTab.emptyNoData', {
                  defaultValue:
                    'No internal HTML pages crawled yet — run a crawl, then select pages to fetch field data for.',
                })
              : t('cruxTab.emptyNoMatch', {
                  defaultValue: 'No pages match the current filter.',
                })}
          </div>
        ) : (
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
                    height: ROW_HEIGHT,
                    transform: `translateY(${vRow.start}px)`,
                  }}
                >
                  <CruxTableRow
                    row={row}
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
          {t('cruxTab.summary', {
            defaultValue: '{{shown}} pages · {{tested}} with data · {{selected}} selected',
            shown: rows.length.toLocaleString(),
            tested: testedCount.toLocaleString(),
            selected: selected.size.toLocaleString(),
          })}
          {total > rows.length &&
            ' ' +
              t('cruxTab.firstN', {
                defaultValue: '(first {{n}})',
                n: PAGE_SIZE.toLocaleString(),
              })}
        </span>
        {running && progress?.currentUrl && (
          <span className="truncate text-surface-500">
            {t('cruxTab.fetching', {
              defaultValue: 'Fetching: {{url}}',
              url: progress.currentUrl,
            })}
          </span>
        )}
      </div>
    </div>
  );
}

function MetricCell({
  text,
  cls,
  width,
}: {
  text: string;
  cls: string;
  width: number;
}) {
  return (
    <div
      className={`shrink-0 text-center tabular-nums ${cls}`}
      style={{ width }}
    >
      {text}
    </div>
  );
}

function FormFactorCells({ m }: { m: CruxMetrics | null }) {
  const { t } = useTranslation();
  if (!m) {
    return (
      <>
        <MetricCell text="—" cls="text-surface-700" width={W_LCP} />
        <MetricCell text="—" cls="text-surface-700" width={W_INP} />
        <MetricCell text="—" cls="text-surface-700" width={W_CLS} />
        <MetricCell text="—" cls="text-surface-700" width={W_FCP} />
        <MetricCell text="—" cls="text-surface-700" width={W_TTFB} />
      </>
    );
  }
  if (m.status === 'nodata') {
    return (
      <div
        className="flex shrink-0 items-center justify-center text-surface-500"
        style={{ width: GROUP_WIDTH }}
        title={t('cruxTab.noDataTip', {
          defaultValue: 'CrUX has too little real-user traffic for this page.',
        })}
      >
        {t('cruxTab.noData', { defaultValue: 'no data' })}
      </div>
    );
  }
  if (m.status === 'error') {
    return (
      <div
        className="flex shrink-0 cursor-help items-center justify-center gap-1 text-red-400"
        style={{ width: GROUP_WIDTH }}
        title={m.error ?? 'Fetch failed'}
      >
        <span className="font-semibold">ERR</span>
        <span className="text-[9px] text-red-300/70">ⓘ</span>
      </div>
    );
  }
  return (
    <>
      <MetricCell text={fmtMs(m.lcp)} cls={cwvClass(m.lcp, 2500, 4000)} width={W_LCP} />
      <MetricCell text={fmtMs(m.inp)} cls={cwvClass(m.inp, 200, 500)} width={W_INP} />
      <MetricCell text={fmtCls(m.cls)} cls={cwvClass(m.cls, 0.1, 0.25)} width={W_CLS} />
      <MetricCell text={fmtMs(m.fcp)} cls={cwvClass(m.fcp, 1800, 3000)} width={W_FCP} />
      <MetricCell text={fmtMs(m.ttfb)} cls={cwvClass(m.ttfb, 800, 1800)} width={W_TTFB} />
    </>
  );
}

function CruxTableRow({
  row,
  selected,
  onToggle,
}: {
  row: CruxRow;
  selected: boolean;
  onToggle: () => void;
}) {
  const fetched = useMemo(() => {
    const candidates = [row.phone?.fetchedAt, row.desktop?.fetchedAt].filter(
      (v): v is string => !!v,
    );
    if (candidates.length === 0) return '';
    return candidates.sort().reverse()[0] ?? '';
  }, [row.phone, row.desktop]);

  return (
    <div
      onClick={onToggle}
      className={`flex h-full cursor-pointer items-center text-[11px] ${
        selected
          ? 'bg-blue-900/30'
          : 'odd:bg-surface-900/20 hover:bg-surface-800/40'
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
      <div className="flex shrink-0 items-center" style={{ width: GROUP_WIDTH }}>
        <FormFactorCells m={row.phone} />
      </div>
      <div className="flex shrink-0 items-center" style={{ width: GROUP_WIDTH }}>
        <FormFactorCells m={row.desktop} />
      </div>
      <div className="w-[96px] shrink-0 truncate px-2 text-right text-surface-500">
        {fetched ? relativeTime(fetched) : '—'}
      </div>
    </div>
  );
}
