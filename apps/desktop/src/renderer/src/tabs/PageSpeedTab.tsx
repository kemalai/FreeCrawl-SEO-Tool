import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import { Smartphone, Monitor, Loader2 } from 'lucide-react';
import type {
  PagespeedMetrics,
  PagespeedProgress,
  PagespeedRow,
  PagespeedRunStrategy,
} from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

const TOOLBAR_HEIGHT = 36;
const HEADER_HEIGHT = 46;
const STATUS_BAR_HEIGHT = 22;
const ROW_HEIGHT = 30;
const PAGE_SIZE = 2000;
const POLL_MS_RUNNING = 5000;
/** Above this many audits, warn before kicking off the run. */
const CONFIRM_THRESHOLD = 30;

type FilterMode = 'all' | 'tested' | 'untested';

/** Lighthouse score bands → cell colour. */
function scoreClass(v: number | null): string {
  if (v === null) return 'text-surface-600';
  if (v >= 90) return 'text-emerald-400';
  if (v >= 50) return 'text-amber-400';
  return 'text-red-400';
}

/** Core Web Vitals thresholds → cell colour. */
function cwvClass(
  v: number | null,
  good: number,
  poor: number,
): string {
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

function fmtScore(v: number | null): string {
  return v === null ? '—' : String(v);
}

/** Short relative time for the "Last run" column. */
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

export function PageSpeedTab() {
  const { t } = useTranslation();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const crawlProgress = useAppStore((s) => s.progress);

  const [rows, setRows] = useState<PagespeedRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [strategy, setStrategy] = useState<PagespeedRunStrategy>('mobile');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [psProgress, setPsProgress] = useState<PagespeedProgress | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    const res = await window.freecrawl.pagespeedQuery({
      limit: PAGE_SIZE,
      offset: 0,
      search: search || undefined,
      filter,
    });
    setRows(res.rows);
    setTotal(res.total);
  }, [search, filter]);

  // Candidate list — reloads on filter/search/crawl-data changes, and
  // polls while a crawl is discovering new pages.
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

  // Whether the PageSpeed integration has an API key — surfaces the
  // keyless-mode warning banner when it doesn't.
  useEffect(() => {
    void window.freecrawl.integrationsGetAll().then((state) => {
      setHasApiKey(state['pagespeed']?.fields?.['apiKey']?.set ?? false);
    });
  }, []);

  // Live progress of an in-flight run. Refresh the table whenever an
  // audit completes (events without a `currentUrl`) so partial results
  // appear as the run proceeds.
  useEffect(() => {
    const off = window.freecrawl.onPagespeedProgress((p) => {
      setPsProgress(p.running ? p : null);
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
      new Set(
        rows.filter((r) => !r.mobile && !r.desktop).map((r) => r.url),
      ),
    );
  }, [rows]);

  const strategyCount = strategy === 'both' ? 2 : 1;
  const auditCount = selected.size * strategyCount;

  const runAudit = useCallback(async () => {
    const urls = [...selected];
    if (urls.length === 0 || running) return;
    if (
      auditCount > CONFIRM_THRESHOLD &&
      !window.confirm(
        t('pagespeedTab.confirmRun', {
          defaultValue:
            'This will request {{count}} PageSpeed audits. Each audit takes ~10–30s and{{keyless}} may take a while. Continue?',
          count: auditCount,
          keyless: hasApiKey
            ? ''
            : t('pagespeedTab.confirmKeyless', {
                defaultValue: ' — without an API key (low rate limit) —',
              }),
        }),
      )
    ) {
      return;
    }
    setRunning(true);
    setPsProgress({ done: 0, total: auditCount, currentUrl: null, running: true });
    try {
      await window.freecrawl.pagespeedRun({ urls, strategy });
    } finally {
      setRunning(false);
      setPsProgress(null);
      void reload();
    }
  }, [selected, running, auditCount, strategy, hasApiKey, t, reload]);

  const cancelRun = useCallback(() => {
    void window.freecrawl.pagespeedCancel();
  }, []);

  const testedCount = useMemo(
    () => rows.filter((r) => r.mobile || r.desktop).length,
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
          {t('pagespeedTab.title', { defaultValue: 'PageSpeed Insights' })}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('pagespeedTab.filterPlaceholder', {
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
            {t('pagespeedTab.filterAll', { defaultValue: 'All pages' })}
          </option>
          <option value="tested">
            {t('pagespeedTab.filterTested', { defaultValue: 'Tested only' })}
          </option>
          <option value="untested">
            {t('pagespeedTab.filterUntested', { defaultValue: 'Untested only' })}
          </option>
        </select>
        <label className="flex items-center gap-1 text-[11px] text-surface-400">
          {t('pagespeedTab.strategy', { defaultValue: 'Device:' })}
          <select
            className="h-6 rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
            value={strategy}
            onChange={(e) =>
              setStrategy(e.target.value as PagespeedRunStrategy)
            }
            disabled={running}
          >
            <option value="mobile">
              {t('pagespeedTab.deviceMobile', { defaultValue: 'Mobile' })}
            </option>
            <option value="desktop">
              {t('pagespeedTab.deviceDesktop', { defaultValue: 'Desktop' })}
            </option>
            <option value="both">
              {t('pagespeedTab.deviceBoth', { defaultValue: 'Mobile + Desktop' })}
            </option>
          </select>
        </label>
        <button
          type="button"
          onClick={selectUntested}
          disabled={running || rows.length === 0}
          className="h-6 rounded border border-surface-700 bg-surface-800 px-2 text-[11px] text-surface-200 hover:bg-surface-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('pagespeedTab.selectUntested', { defaultValue: 'Select untested' })}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {running && psProgress ? (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-surface-300">
                <Loader2 size={12} className="animate-spin text-blue-400" />
                {t('pagespeedTab.runProgress', {
                  defaultValue: 'Auditing {{done}} / {{total}}',
                  done: psProgress.done,
                  total: psProgress.total,
                })}
              </span>
              <button
                type="button"
                onClick={cancelRun}
                className="h-6 rounded border border-red-700 bg-red-900/40 px-2.5 text-[11px] font-medium text-red-200 hover:bg-red-900/70"
              >
                {t('pagespeedTab.cancel', { defaultValue: 'Cancel' })}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void runAudit()}
              disabled={selected.size === 0 || running}
              className="h-6 rounded bg-blue-600 px-3 text-[11px] font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-surface-700 disabled:text-surface-500"
            >
              {t('pagespeedTab.run', {
                defaultValue: 'Run PageSpeed ({{count}})',
                count: auditCount,
              })}
            </button>
          )}
        </div>
      </div>

      {/* Keyless-mode banner */}
      {!hasApiKey && (
        <div className="border-b border-amber-700/40 bg-amber-900/20 px-3 py-1 text-[10px] text-amber-200">
          {t('pagespeedTab.noKeyBanner', {
            defaultValue:
              'No PageSpeed API key — audits run keyless at a low rate limit. Add a free key in Settings → Integrations for faster runs.',
          })}
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
                el.indeterminate =
                  selected.size > 0 && !allLoadedSelected;
              }
            }}
            onChange={toggleAll}
            disabled={rows.length === 0}
            className="h-3 w-3 accent-blue-500"
          />
        </div>
        <div className="flex flex-1 flex-col justify-end border-r border-surface-800 px-2 pb-1">
          {t('pagespeedTab.colUrl', { defaultValue: 'URL' })}
        </div>
        <div className="flex w-[54px] flex-col justify-end border-r border-surface-800 px-1 pb-1 text-center">
          {t('pagespeedTab.colStatus', { defaultValue: 'Status' })}
        </div>
        {/* Mobile group */}
        <div className="flex w-[162px] flex-col border-r border-surface-800">
          <div className="flex h-[22px] items-center justify-center gap-1 border-b border-surface-800 bg-surface-900/80 text-surface-300">
            <Smartphone size={11} />
            {t('pagespeedTab.groupMobile', { defaultValue: 'Mobile' })}
          </div>
          <div className="flex flex-1 items-end pb-1 text-center">
            <div className="w-[50px]">{t('pagespeedTab.colPerf', { defaultValue: 'Perf' })}</div>
            <div className="w-[60px]">{t('pagespeedTab.colLcp', { defaultValue: 'LCP' })}</div>
            <div className="w-[52px]">{t('pagespeedTab.colCls', { defaultValue: 'CLS' })}</div>
          </div>
        </div>
        {/* Desktop group */}
        <div className="flex w-[162px] flex-col border-r border-surface-800">
          <div className="flex h-[22px] items-center justify-center gap-1 border-b border-surface-800 bg-surface-900/80 text-surface-300">
            <Monitor size={11} />
            {t('pagespeedTab.groupDesktop', { defaultValue: 'Desktop' })}
          </div>
          <div className="flex flex-1 items-end pb-1 text-center">
            <div className="w-[50px]">{t('pagespeedTab.colPerf', { defaultValue: 'Perf' })}</div>
            <div className="w-[60px]">{t('pagespeedTab.colLcp', { defaultValue: 'LCP' })}</div>
            <div className="w-[52px]">{t('pagespeedTab.colCls', { defaultValue: 'CLS' })}</div>
          </div>
        </div>
        <div className="flex w-[96px] flex-col justify-end px-2 pb-1 text-right">
          {t('pagespeedTab.colLastRun', { defaultValue: 'Last run' })}
        </div>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-[12px] text-surface-500">
            {total === 0
              ? t('pagespeedTab.emptyNoData', {
                  defaultValue:
                    'No internal HTML pages crawled yet — run a crawl, then select pages to audit.',
                })
              : t('pagespeedTab.emptyNoMatch', {
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
                  <PageSpeedRow
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
          {t('pagespeedTab.summary', {
            defaultValue: '{{shown}} pages · {{tested}} tested · {{selected}} selected',
            shown: rows.length.toLocaleString(),
            tested: testedCount.toLocaleString(),
            selected: selected.size.toLocaleString(),
          })}
          {total > rows.length &&
            ' ' +
              t('pagespeedTab.firstN', {
                defaultValue: '(first {{n}})',
                n: PAGE_SIZE.toLocaleString(),
              })}
        </span>
        {running && psProgress?.currentUrl && (
          <span className="truncate text-surface-500">
            {t('pagespeedTab.auditing', {
              defaultValue: 'Auditing: {{url}}',
              url: psProgress.currentUrl,
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
  title,
}: {
  text: string;
  cls: string;
  width: number;
  title?: string;
}) {
  return (
    <div
      className={`shrink-0 text-center tabular-nums ${cls}`}
      style={{ width }}
      title={title}
    >
      {text}
    </div>
  );
}

function StrategyCells({ m }: { m: PagespeedMetrics | null }) {
  if (!m) {
    return (
      <>
        <MetricCell text="—" cls="text-surface-700" width={50} />
        <MetricCell text="—" cls="text-surface-700" width={60} />
        <MetricCell text="—" cls="text-surface-700" width={52} />
      </>
    );
  }
  if (m.status === 'error') {
    return (
      <div
        className="flex w-[162px] shrink-0 items-center justify-center text-red-400"
        title={m.error ?? 'Audit failed'}
      >
        ERR
      </div>
    );
  }
  return (
    <>
      <MetricCell
        text={fmtScore(m.performance)}
        cls={scoreClass(m.performance)}
        width={50}
      />
      <MetricCell
        text={fmtMs(m.lcp)}
        cls={cwvClass(m.lcp, 2500, 4000)}
        width={60}
      />
      <MetricCell
        text={fmtCls(m.cls)}
        cls={cwvClass(m.cls, 0.1, 0.25)}
        width={52}
      />
    </>
  );
}

function PageSpeedRow({
  row,
  selected,
  onToggle,
}: {
  row: PagespeedRow;
  selected: boolean;
  onToggle: () => void;
}) {
  const lastRun = useMemo(() => {
    const candidates = [row.mobile?.fetchedAt, row.desktop?.fetchedAt].filter(
      (v): v is string => !!v,
    );
    if (candidates.length === 0) return '';
    return candidates.sort().reverse()[0] ?? '';
  }, [row.mobile, row.desktop]);

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
      <div
        className="flex-1 truncate px-2 text-surface-200"
        title={row.url}
      >
        {row.url}
      </div>
      <div className={`w-[54px] shrink-0 text-center tabular-nums ${statusCls}`}>
        {status ?? '—'}
      </div>
      <StrategyCells m={row.mobile} />
      <StrategyCells m={row.desktop} />
      <div className="w-[96px] shrink-0 truncate px-2 text-right text-surface-500">
        {lastRun ? relativeTime(lastRun) : '—'}
      </div>
    </div>
  );
}
