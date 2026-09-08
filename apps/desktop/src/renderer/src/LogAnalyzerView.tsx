import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  LogAnalyzeResult,
  LogBotRow,
  LogCrawlBudgetRow,
  LogDiscoveryRow,
  LogFormatChoice,
  LogOverview,
  LogStatusRow,
  LogThreatCategory,
  LogThreatRow,
  LogThreatsInput,
  LogThreatSummary,
  LogTrendRow,
  LogUrlStatRow,
  LogUrlStatsInput,
} from '@freecrawl/shared-types';
import { writeTextToClipboard } from './utils/clipboard.js';
import { InfoTip } from './components/InfoTip.js';
import { translateInfoTip } from './i18n/info-tips.js';

/**
 * V2 Faz 2 — standalone Log File Analyzer window (renderer `?loganalyzer=1`).
 * Ingests server access logs and surfaces every Faz 2 feature: bot hits per
 * URL, crawl-budget, response-code distribution, daily trend, crawl × log
 * orphan detection, and seeding log-discovered URLs into the active crawl.
 */

type Tab = 'urls' | 'bots' | 'status' | 'trend' | 'budget' | 'orphans' | 'discovery' | 'threats';

const FAMILY_COLORS: Record<string, string> = {
  googlebot: 'text-blue-300 bg-blue-500/15',
  bingbot: 'text-teal-300 bg-teal-500/15',
  yandexbot: 'text-red-300 bg-red-500/15',
  search: 'text-green-300 bg-green-500/15',
  ai: 'text-purple-300 bg-purple-500/15',
  social: 'text-pink-300 bg-pink-500/15',
  'seo-tool': 'text-amber-300 bg-amber-500/15',
  other: 'text-surface-300 bg-surface-700/40',
  human: 'text-surface-400 bg-surface-700/30',
};

function fmtNum(n: number | null | undefined): string {
  return typeof n === 'number' ? n.toLocaleString() : '—';
}

function fmtTs(ts: number | null): string {
  if (ts === null) return '—';
  try {
    return new Date(ts).toISOString().replace('T', ' ').slice(0, 16);
  } catch {
    return '—';
  }
}

export function LogAnalyzerView() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<LogOverview | null>(null);
  const [tab, setTab] = useState<Tab>('urls');
  const [format, setFormat] = useState<LogFormatChoice>('auto');
  const [customRegex, setCustomRegex] = useState('');
  const [verifyBots, setVerifyBots] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refreshOverview = useCallback(() => {
    void window.freecrawl.logOverview().then(setOverview);
  }, []);

  useEffect(() => {
    refreshOverview();
    const off = window.freecrawl.onDataChanged(() => {
      refreshOverview();
      setVersion((v) => v + 1);
    });
    return () => off();
  }, [refreshOverview]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const onImport = useCallback(async () => {
    setBusy(true);
    try {
      const res: LogAnalyzeResult = await window.freecrawl.logAnalyze({
        format,
        customRegex: format === 'custom' ? customRegex : undefined,
        verifyBots,
      });
      if (res.overview) setOverview(res.overview);
      const batch = res.batch ?? (res.imported ? [res.imported] : []);
      const failed = res.errors?.length ?? 0;
      if (res.ok && batch.length > 0) {
        if (batch.length === 1) {
          const i = batch[0]!;
          showToast(
            t('logAnalyzer.imported', {
              defaultValue: '{{file}} — parsed {{parsed}}/{{total}} lines ({{format}})',
              file: i.fileName,
              parsed: i.parsedLines.toLocaleString(),
              total: i.totalLines.toLocaleString(),
              format: i.format,
            }),
          );
        } else {
          const parsed = batch.reduce((s, b) => s + b.parsedLines, 0);
          const total = batch.reduce((s, b) => s + b.totalLines, 0);
          showToast(
            t('logAnalyzer.importedBatch', {
              defaultValue: '{{files}} files — parsed {{parsed}}/{{total}} lines',
              files: batch.length,
              parsed: parsed.toLocaleString(),
              total: total.toLocaleString(),
            }) +
              (failed > 0
                ? ` · ${t('logAnalyzer.importedFailed', { defaultValue: '{{n}} failed', n: failed })}`
                : ''),
          );
        }
        setVersion((v) => v + 1);
      } else if (res.error) {
        showToast(t('logAnalyzer.importError', { defaultValue: 'Import failed: {{err}}', err: res.error }));
      }
    } finally {
      setBusy(false);
    }
  }, [format, customRegex, verifyBots, showToast, t]);

  const onClear = useCallback(async () => {
    if (!window.confirm(t('logAnalyzer.clearConfirm', { defaultValue: 'Clear all ingested log data from this project?' }))) {
      return;
    }
    try {
      await window.freecrawl.logClear();
    } catch (e) {
      // Destructive and previously silent: on failure the refresh below
      // still ran, so the view could look cleared while the project kept
      // a partially-deleted log set.
      showToast(
        t('logAnalyzer.clearFailed', {
          defaultValue: 'Could not clear log data: {{detail}}',
          detail: e instanceof Error ? e.message : String(e),
        }),
      );
      return;
    }
    refreshOverview();
    setVersion((v) => v + 1);
  }, [refreshOverview, showToast, t]);

  const onExport = useCallback(
    async (format: 'csv' | 'xlsx') => {
      try {
        const r = await window.freecrawl.logExport({ format });
        if (r.filePath) {
          showToast(
            t('logAnalyzer.exported', {
              defaultValue: 'Exported {{size}} KB → {{path}}',
              size: Math.max(1, Math.round(r.bytesWritten / 1024)),
              path: r.filePath,
            }),
          );
        }
      } catch (e) {
        // Without this the export just produced no toast and no file —
        // indistinguishable from never having clicked the button.
        showToast(
          t('logAnalyzer.exportFailed', {
            defaultValue: 'Export failed: {{detail}}',
            detail: e instanceof Error ? e.message : String(e),
          }),
        );
      }
    },
    [showToast, t],
  );

  const hasData = overview?.hasData ?? false;

  return (
    <div className="flex h-screen w-screen flex-col bg-surface-950 text-surface-100">
      {/* Title bar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-surface-800 bg-surface-900 px-3 py-1.5 text-[12px]">
        <span className="font-semibold tracking-wide text-surface-200">
          {t('logAnalyzer.title', { defaultValue: 'Log File Analyzer' })}
        </span>
        <span className="text-surface-500">·</span>
        <span className="text-surface-500">
          {t('logAnalyzer.windowHint', {
            defaultValue: 'Apache / Nginx / IIS access logs — bot activity, crawl budget, crawl × log join',
          })}
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-surface-800 bg-surface-900/60 px-3 py-2 text-[12px]">
        <label className="text-surface-400">{t('logAnalyzer.format', { defaultValue: 'Format' })}</label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as LogFormatChoice)}
          className="rounded border border-surface-700 bg-surface-800 px-2 py-1 text-surface-100"
        >
          <option value="auto">{t('logAnalyzer.fmtAuto', { defaultValue: 'Auto-detect' })}</option>
          <option value="apache-combined">{t('logAnalyzer.fmtApacheCombined', { defaultValue: 'Apache / Nginx Combined' })}</option>
          <option value="apache-common">{t('logAnalyzer.fmtApacheCommon', { defaultValue: 'Apache Common (CLF)' })}</option>
          <option value="nginx">{t('logAnalyzer.fmtNginx', { defaultValue: 'Nginx' })}</option>
          <option value="iis-w3c">{t('logAnalyzer.fmtIis', { defaultValue: 'IIS W3C Extended' })}</option>
          <option value="custom">{t('logAnalyzer.fmtCustom', { defaultValue: 'Custom (regex)' })}</option>
        </select>
        {format === 'custom' && (
          <input
            value={customRegex}
            onChange={(e) => setCustomRegex(e.target.value)}
            placeholder={t('logAnalyzer.customRegexPlaceholder', {
              defaultValue: 'Named-group regex: (?<ip>…) (?<ts>…) (?<method>…) (?<path>…) (?<status>…) (?<ua>…)',
            })}
            className="min-w-[320px] flex-1 rounded border border-surface-700 bg-surface-800 px-2 py-1 font-mono text-[11px] text-surface-100"
          />
        )}
        <label className="ml-1 flex items-center gap-1 text-surface-300" title={t('logAnalyzer.verifyBotsHint', { defaultValue: 'Reverse-DNS verify a sample of bot IPs (slower; catches spoofed user-agents)' })}>
          <input type="checkbox" checked={verifyBots} onChange={(e) => setVerifyBots(e.target.checked)} />
          {t('logAnalyzer.verifyBots', { defaultValue: 'Verify bots (rDNS)' })}
        </label>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => void onImport()}
            disabled={busy}
            className="rounded bg-blue-600 px-3 py-1 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {busy
              ? t('logAnalyzer.analyzing', { defaultValue: 'Analyzing…' })
              : t('logAnalyzer.import', { defaultValue: 'Import Log Files…' })}
          </button>
          {hasData && <ExportMenu onExport={onExport} />}
          {hasData && (
            <button
              onClick={() => void onClear()}
              className="rounded border border-surface-700 px-2 py-1 text-surface-300 hover:bg-surface-800"
            >
              {t('logAnalyzer.clear', { defaultValue: 'Clear' })}
            </button>
          )}
        </div>
      </div>

      {!hasData ? (
        <EmptyState />
      ) : (
        <>
          <SummaryCards overview={overview!} />
          <TabStrip tab={tab} setTab={setTab} />
          <div className="min-h-0 flex-1 overflow-auto">
            {tab === 'urls' && <UrlStatsTab version={version} mode="all" />}
            {tab === 'orphans' && <UrlStatsTab version={version} mode="orphans" />}
            {tab === 'bots' && <BotsTab version={version} />}
            {tab === 'status' && <StatusTab version={version} />}
            {tab === 'trend' && <TrendTab version={version} />}
            {tab === 'budget' && <BudgetTab version={version} />}
            {tab === 'discovery' && <DiscoveryTab version={version} onToast={showToast} />}
            {tab === 'threats' && <ThreatsTab version={version} onToast={showToast} />}
          </div>
        </>
      )}

      {toast && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-surface-800 px-4 py-2 text-[12px] text-surface-100 shadow-lg ring-1 ring-surface-700">
          {toast}
        </div>
      )}
    </div>
  );
}

function ExportMenu({ onExport }: { onExport: (format: 'csv' | 'xlsx') => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const choose = (format: 'csv' | 'xlsx'): void => {
    setOpen(false);
    onExport(format);
  };
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded border border-surface-700 px-2 py-1 text-surface-200 hover:bg-surface-800"
      >
        {t('logAnalyzer.export', { defaultValue: 'Export' })}
        <span className="text-[9px] text-surface-400">▼</span>
      </button>
      {open && (
        <>
          {/* click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded border border-surface-700 bg-surface-800 shadow-lg">
            <button
              onClick={() => choose('csv')}
              className="block w-full px-3 py-1.5 text-left text-surface-200 hover:bg-surface-700"
            >
              {t('logAnalyzer.exportCsv', { defaultValue: 'CSV (all tables)' })}
            </button>
            <button
              onClick={() => choose('xlsx')}
              className="block w-full px-3 py-1.5 text-left text-surface-200 hover:bg-surface-700"
            >
              {t('logAnalyzer.exportXlsx', { defaultValue: 'Excel (.xlsx, one sheet each)' })}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-surface-400">
      <div className="text-[14px] font-medium text-surface-200">
        {t('logAnalyzer.noData', { defaultValue: 'No log data yet' })}
      </div>
      <p className="max-w-md text-[12px] leading-relaxed">
        {t('logAnalyzer.noDataHint', {
          defaultValue:
            'Import a server access log (Apache, Nginx, or IIS W3C) to see which URLs search-engine bots crawl, how response codes are distributed in the log, and which logged URLs your crawl never reached.',
        })}
      </p>
    </div>
  );
}

function SummaryCards({ overview }: { overview: LogOverview }) {
  const { t } = useTranslation();
  const cards: { label: string; value: string }[] = [
    { label: t('logAnalyzer.cardTotalHits', { defaultValue: 'Total Hits' }), value: fmtNum(overview.totalHits) },
    { label: t('logAnalyzer.cardBotHits', { defaultValue: 'Bot Hits' }), value: fmtNum(overview.botHits) },
    { label: t('logAnalyzer.cardHumanHits', { defaultValue: 'Human Hits' }), value: fmtNum(overview.humanHits) },
    { label: t('logAnalyzer.cardVerified', { defaultValue: 'Verified Bot Hits' }), value: fmtNum(overview.verifiedBotHits) },
    { label: t('logAnalyzer.cardUrls', { defaultValue: 'Distinct URLs' }), value: fmtNum(overview.distinctUrls) },
    {
      label: t('logAnalyzer.cardThreats', { defaultValue: 'Suspicious Requests' }),
      value:
        overview.threatHits > 0
          ? `${fmtNum(overview.threatHits)} · ${fmtNum(overview.threatIps)} IP`
          : '0',
    },
    {
      label: t('logAnalyzer.cardRange', { defaultValue: 'Date Range' }),
      value: overview.minTs ? `${fmtTs(overview.minTs)} → ${fmtTs(overview.maxTs)}` : '—',
    },
  ];
  return (
    <div className="shrink-0 border-b border-surface-800 bg-surface-900/40 px-3 py-2">
      <div className="flex flex-wrap gap-2">
        {cards.map((c) => (
          <div key={c.label} className="min-w-[120px] flex-1 rounded border border-surface-800 bg-surface-900 px-3 py-1.5">
            <div className="text-[10px] uppercase tracking-wide text-surface-500">{c.label}</div>
            <div className="font-mono text-[13px] text-surface-100">{c.value}</div>
          </div>
        ))}
      </div>
      {overview.files.length > 0 && (
        <div className="mt-1.5 text-[10px] text-surface-500">
          {t('logAnalyzer.filesIngested', { defaultValue: '{{n}} file(s) ingested', n: overview.files.length })}:{' '}
          {overview.files.map((f) => f.fileName).join(', ')}
        </div>
      )}
    </div>
  );
}

function TabStrip({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const { t } = useTranslation();
  const tabs: { id: Tab; label: string }[] = [
    { id: 'urls', label: t('logAnalyzer.tabUrls', { defaultValue: 'URL Hits' }) },
    { id: 'bots', label: t('logAnalyzer.tabBots', { defaultValue: 'Bots' }) },
    { id: 'status', label: t('logAnalyzer.tabStatus', { defaultValue: 'Status Codes' }) },
    { id: 'trend', label: t('logAnalyzer.tabTrend', { defaultValue: 'Trend' }) },
    { id: 'budget', label: t('logAnalyzer.tabBudget', { defaultValue: 'Crawl Budget' }) },
    { id: 'orphans', label: t('logAnalyzer.tabOrphans', { defaultValue: 'Orphans' }) },
    { id: 'discovery', label: t('logAnalyzer.tabDiscovery', { defaultValue: 'Discovery' }) },
    { id: 'threats', label: t('logAnalyzer.tabThreats', { defaultValue: 'Suspicious Requests' }) },
  ];
  return (
    <div className="flex shrink-0 gap-1 border-b border-surface-800 bg-surface-900/60 px-2 text-[12px]">
      {tabs.map((tb) => (
        <button
          key={tb.id}
          onClick={() => setTab(tb.id)}
          className={`border-b-2 px-3 py-1.5 ${
            tab === tb.id
              ? 'border-blue-500 text-surface-100'
              : 'border-transparent text-surface-400 hover:text-surface-200'
          }`}
        >
          {tb.label}
        </button>
      ))}
    </div>
  );
}

function Th({
  children,
  className = '',
  info,
}: {
  children: React.ReactNode;
  className?: string;
  /** English tooltip body — rendered as the standard [i] icon, translated
   *  through the shared InfoTip dictionary. */
  info?: string;
}) {
  return (
    <th className={`sticky top-0 z-10 bg-surface-900 px-2 py-1 text-left font-medium text-surface-400 ${className}`}>
      {info ? (
        <span
          className={`inline-flex items-center gap-1 ${className.includes('text-right') ? 'flex-row-reverse' : ''}`}
        >
          {children}
          <InfoTip info={info} />
        </span>
      ) : (
        children
      )}
    </th>
  );
}

function FamilyBadge({ family }: { family: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] ${FAMILY_COLORS[family] ?? FAMILY_COLORS.other}`}>
      {family}
    </span>
  );
}

const PAGE = 100;

function UrlStatsTab({ version, mode }: { version: number; mode: 'all' | 'orphans' }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<LogUrlStatRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<NonNullable<LogUrlStatsInput['filter']>>(mode === 'orphans' ? 'orphans' : 'all');
  const [bot, setBot] = useState('');
  const [botList, setBotList] = useState<LogBotRow[]>([]);
  const [status, setStatus] = useState<NonNullable<LogUrlStatsInput['status']>>('all');
  const [sortBy, setSortBy] = useState<NonNullable<LogUrlStatsInput['sortBy']>>('totalHits');

  useEffect(() => {
    if (mode === 'all') void window.freecrawl.logBots().then(setBotList);
  }, [version, mode]);

  useEffect(() => {
    setOffset(0);
  }, [search, filter, bot, status, sortBy, version]);

  useEffect(() => {
    // Cancellation guard: fast typing / filter changes fire overlapping
    // queries, and without this the slower (older) response can resolve last
    // and overwrite the newer result set, showing rows for a filter the user
    // no longer has selected.
    let cancelled = false;
    const input: LogUrlStatsInput = {
      limit: PAGE,
      offset,
      search,
      sortBy,
      filter,
      bot: bot || undefined,
      status,
    };
    const call = mode === 'orphans' ? window.freecrawl.logOrphans(input) : window.freecrawl.logUrlStats(input);
    void call.then((r) => {
      if (cancelled) return;
      setRows(r.rows);
      setTotal(r.total);
    });
    return () => {
      cancelled = true;
    };
  }, [offset, search, filter, bot, status, sortBy, version, mode]);

  // The single filter <select> carries either a membership token
  // (all/bots/orphans/crawled) or a `bot:<name>` per-bot selection.
  const selValue = bot ? `bot:${bot}` : filter;
  const onFilterChange = (v: string): void => {
    if (v.startsWith('bot:')) {
      setBot(v.slice(4));
      setFilter('all');
    } else {
      setFilter(v as NonNullable<LogUrlStatsInput['filter']>);
      setBot('');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-surface-800 px-3 py-1.5 text-[11px]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('logAnalyzer.searchPath', { defaultValue: 'Filter by path…' })}
          className="w-56 rounded border border-surface-700 bg-surface-800 px-2 py-1 text-surface-100"
        />
        {mode === 'all' && (
          <select
            value={selValue}
            onChange={(e) => onFilterChange(e.target.value)}
            className="max-w-[220px] rounded border border-surface-700 bg-surface-800 px-2 py-1 text-surface-100"
          >
            <option value="all">{t('logAnalyzer.filterAll', { defaultValue: 'All URLs' })}</option>
            <option value="bots">{t('logAnalyzer.filterBots', { defaultValue: 'Bot-touched' })}</option>
            <option value="orphans">{t('logAnalyzer.filterOrphans', { defaultValue: 'Orphans (not crawled)' })}</option>
            <option value="crawled">{t('logAnalyzer.filterCrawled', { defaultValue: 'Crawled' })}</option>
            {botList.length > 0 && (
              <optgroup label={t('logAnalyzer.filterByBot', { defaultValue: 'By bot' })}>
                {botList.map((b) => (
                  <option key={b.bot} value={`bot:${b.bot}`}>
                    {b.bot} ({b.hits.toLocaleString()})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        )}
        <span className="inline-flex items-center gap-1">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as NonNullable<LogUrlStatsInput['status']>)}
            className="rounded border border-surface-700 bg-surface-800 px-2 py-1 text-surface-100"
          >
            <option value="all">{t('logAnalyzer.urlStatusAll', { defaultValue: 'Any status' })}</option>
            <option value="2xx">2xx</option>
            <option value="3xx">3xx</option>
            <option value="4xx">{t('logAnalyzer.urlStatus4xx', { defaultValue: '4xx (errors)' })}</option>
            <option value="5xx">{t('logAnalyzer.urlStatus5xx', { defaultValue: '5xx (server errors)' })}</option>
          </select>
          <InfoTip info="Filters on the Status column — the most recent response the log recorded for that path. The analyzer keeps one status per URL rather than a full distribution, so this answers 'what is this URL returning now'. Paths whose status could not be parsed are hidden while a class is selected." />
        </span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as NonNullable<LogUrlStatsInput['sortBy']>)}
          className="rounded border border-surface-700 bg-surface-800 px-2 py-1 text-surface-100"
        >
          <option value="totalHits">{t('logAnalyzer.sortTotal', { defaultValue: 'Sort: Total hits' })}</option>
          <option value="botHits">{t('logAnalyzer.sortBots', { defaultValue: 'Sort: Bot hits' })}</option>
          <option value="googlebotHits">{t('logAnalyzer.sortGoogle', { defaultValue: 'Sort: Googlebot hits' })}</option>
          <option value="lastHitAt">{t('logAnalyzer.sortRecent', { defaultValue: 'Sort: Most recent' })}</option>
        </select>
        <Pager offset={offset} total={total} onPrev={() => setOffset(Math.max(0, offset - PAGE))} onNext={() => setOffset(offset + PAGE)} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <Th>{t('logAnalyzer.colPath', { defaultValue: 'Path' })}</Th>
              <Th className="text-right">{t('logAnalyzer.colTotal', { defaultValue: 'Total' })}</Th>
              <Th className="text-right">{t('logAnalyzer.colBots', { defaultValue: 'Bots' })}</Th>
              <Th className="text-right">Googlebot</Th>
              <Th className="text-right">Bingbot</Th>
              <Th className="text-right">Yandex</Th>
              <Th
                className="text-right"
                info="Most recent HTTP status the log recorded for this path. One value per URL, not a distribution — a path that returned 200 all week and 404 this morning shows 404."
              >
                {t('logAnalyzer.colStatus', { defaultValue: 'Status' })}
              </Th>
              <Th>{t('logAnalyzer.colLast', { defaultValue: 'Last Hit' })}</Th>
              <Th>{t('logAnalyzer.colCrawl', { defaultValue: 'In Crawl' })}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.path} className="border-b border-surface-800/60 hover:bg-surface-900/40">
                <td className="max-w-[420px] truncate px-2 py-1 font-mono text-surface-200" title={r.path}>{r.path}</td>
                <td className="px-2 py-1 text-right font-mono">{fmtNum(r.totalHits)}</td>
                <td className="px-2 py-1 text-right font-mono text-surface-300">{fmtNum(r.botHits)}</td>
                <td className="px-2 py-1 text-right font-mono text-blue-300">{fmtNum(r.googlebotHits)}</td>
                <td className="px-2 py-1 text-right font-mono text-teal-300">{fmtNum(r.bingbotHits)}</td>
                <td className="px-2 py-1 text-right font-mono text-red-300">{fmtNum(r.yandexbotHits)}</td>
                <td className="px-2 py-1 text-right font-mono">{r.lastStatus ?? '—'}</td>
                <td className="px-2 py-1 text-surface-400">{fmtTs(r.lastHitAt)}</td>
                <td className="px-2 py-1">
                  {r.inCrawl ? (
                    <span className="text-green-400">✓</span>
                  ) : (
                    <span className="text-amber-400">{t('logAnalyzer.orphan', { defaultValue: 'orphan' })}</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-surface-500">
                  {t('logAnalyzer.noRows', { defaultValue: 'No matching URLs.' })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Pager({ offset, total, onPrev, onNext }: { offset: number; total: number; onPrev: () => void; onNext: () => void }) {
  const { t } = useTranslation();
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PAGE, total);
  return (
    <div className="ml-auto flex items-center gap-2 text-surface-400">
      <span>
        {t('logAnalyzer.pageRange', { defaultValue: '{{from}}–{{to}} of {{total}}', from, to, total: total.toLocaleString() })}
      </span>
      <button onClick={onPrev} disabled={offset === 0} className="rounded border border-surface-700 px-2 py-0.5 disabled:opacity-40">‹</button>
      <button onClick={onNext} disabled={to >= total} className="rounded border border-surface-700 px-2 py-0.5 disabled:opacity-40">›</button>
    </div>
  );
}

function BotsTab({ version }: { version: number }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<LogBotRow[]>([]);
  useEffect(() => {
    void window.freecrawl.logBots().then(setRows);
  }, [version]);
  return (
    <table className="w-full border-collapse text-[11px]">
      <thead>
        <tr>
          <Th>{t('logAnalyzer.colBot', { defaultValue: 'Bot' })}</Th>
          <Th>{t('logAnalyzer.colFamily', { defaultValue: 'Family' })}</Th>
          <Th className="text-right">{t('logAnalyzer.colHits', { defaultValue: 'Hits' })}</Th>
          <Th className="text-right">{t('logAnalyzer.colIps', { defaultValue: 'IPs' })}</Th>
          <Th className="text-right">{t('logAnalyzer.colVerified', { defaultValue: 'Verified IPs' })}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((b) => (
          <tr key={b.bot} className="border-b border-surface-800/60 hover:bg-surface-900/40">
            <td className="px-2 py-1 text-surface-100">{b.bot}</td>
            <td className="px-2 py-1"><FamilyBadge family={b.family} /></td>
            <td className="px-2 py-1 text-right font-mono">{fmtNum(b.hits)}</td>
            <td className="px-2 py-1 text-right font-mono text-surface-300">{fmtNum(b.totalIps)}</td>
            <td className="px-2 py-1 text-right font-mono">
              {b.verifiable ? (
                <span className={b.verifiedIps > 0 ? 'text-green-400' : 'text-surface-500'}>
                  {b.verifiedIps}/{b.totalIps}
                </span>
              ) : (
                <span className="text-surface-600">{t('logAnalyzer.naVerify', { defaultValue: 'n/a' })}</span>
              )}
            </td>
          </tr>
        ))}
        {rows.length === 0 && <EmptyRow cols={5} />}
      </tbody>
    </table>
  );
}

function StatusTab({ version }: { version: number }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<LogStatusRow[]>([]);
  useEffect(() => {
    void window.freecrawl.logStatus().then(setRows);
  }, [version]);
  const max = useMemo(() => Math.max(1, ...rows.map((r) => r.count)), [rows]);
  return (
    <table className="w-full border-collapse text-[11px]">
      <thead>
        <tr>
          <Th>{t('logAnalyzer.colStatus', { defaultValue: 'Status' })}</Th>
          <Th className="text-right">{t('logAnalyzer.colCount', { defaultValue: 'Count' })}</Th>
          <Th className="text-right">{t('logAnalyzer.colBotCount', { defaultValue: 'Bot Count' })}</Th>
          <Th className="w-1/2">{t('logAnalyzer.colShare', { defaultValue: 'Share' })}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.status} className="border-b border-surface-800/60">
            <td className="px-2 py-1 font-mono">{r.status}</td>
            <td className="px-2 py-1 text-right font-mono">{fmtNum(r.count)}</td>
            <td className="px-2 py-1 text-right font-mono text-surface-300">{fmtNum(r.botCount)}</td>
            <td className="px-2 py-1">
              <div className="h-2 rounded bg-blue-500/60" style={{ width: `${(r.count / max) * 100}%` }} />
            </td>
          </tr>
        ))}
        {rows.length === 0 && <EmptyRow cols={4} />}
      </tbody>
    </table>
  );
}

function TrendTab({ version }: { version: number }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<LogTrendRow[]>([]);
  useEffect(() => {
    void window.freecrawl.logTrend().then(setRows);
  }, [version]);
  const days = useMemo(() => {
    const map = new Map<string, { total: number; googlebot: number; bingbot: number; yandexbot: number; otherBot: number; human: number }>();
    for (const r of rows) {
      const d = map.get(r.day) ?? { total: 0, googlebot: 0, bingbot: 0, yandexbot: 0, otherBot: 0, human: 0 };
      d.total += r.hits;
      if (r.bucket === 'googlebot') d.googlebot += r.hits;
      else if (r.bucket === 'bingbot') d.bingbot += r.hits;
      else if (r.bucket === 'yandexbot') d.yandexbot += r.hits;
      else if (r.bucket === 'human') d.human += r.hits;
      else d.otherBot += r.hits;
      map.set(r.day, d);
    }
    return Array.from(map.entries()).map(([day, v]) => ({ day, ...v }));
  }, [rows]);
  const max = useMemo(() => Math.max(1, ...days.map((d) => d.total)), [days]);
  return (
    <table className="w-full border-collapse text-[11px]">
      <thead>
        <tr>
          <Th>{t('logAnalyzer.colDay', { defaultValue: 'Day' })}</Th>
          <Th className="text-right">{t('logAnalyzer.colTotal', { defaultValue: 'Total' })}</Th>
          <Th className="text-right">Googlebot</Th>
          <Th className="text-right">Bingbot</Th>
          <Th className="text-right">Yandex</Th>
          <Th className="text-right">{t('logAnalyzer.colOtherBots', { defaultValue: 'Other bots' })}</Th>
          <Th className="text-right">{t('logAnalyzer.colHuman', { defaultValue: 'Human' })}</Th>
          <Th className="w-1/3">{t('logAnalyzer.colVolume', { defaultValue: 'Volume' })}</Th>
        </tr>
      </thead>
      <tbody>
        {days.map((d) => (
          <tr key={d.day} className="border-b border-surface-800/60">
            <td className="px-2 py-1 font-mono">{d.day}</td>
            <td className="px-2 py-1 text-right font-mono">{fmtNum(d.total)}</td>
            <td className="px-2 py-1 text-right font-mono text-blue-300">{fmtNum(d.googlebot)}</td>
            <td className="px-2 py-1 text-right font-mono text-teal-300">{fmtNum(d.bingbot)}</td>
            <td className="px-2 py-1 text-right font-mono text-red-300">{fmtNum(d.yandexbot)}</td>
            <td className="px-2 py-1 text-right font-mono text-surface-300">{fmtNum(d.otherBot)}</td>
            <td className="px-2 py-1 text-right font-mono text-surface-400">{fmtNum(d.human)}</td>
            <td className="px-2 py-1">
              <div className="h-2 rounded bg-blue-500/50" style={{ width: `${(d.total / max) * 100}%` }} />
            </td>
          </tr>
        ))}
        {days.length === 0 && <EmptyRow cols={8} />}
      </tbody>
    </table>
  );
}

function BudgetTab({ version }: { version: number }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<LogCrawlBudgetRow[]>([]);
  useEffect(() => {
    void window.freecrawl.logCrawlBudget(500).then(setRows);
  }, [version]);
  return (
    <table className="w-full border-collapse text-[11px]">
      <thead>
        <tr>
          <Th>{t('logAnalyzer.colUrl', { defaultValue: 'URL' })}</Th>
          <Th className="text-right">Googlebot</Th>
          <Th className="text-right">{t('logAnalyzer.colBots', { defaultValue: 'Bots' })}</Th>
          <Th className="text-right">{t('logAnalyzer.colTotal', { defaultValue: 'Total' })}</Th>
          <Th className="text-right">{t('logAnalyzer.colStatus', { defaultValue: 'Status' })}</Th>
          <Th>{t('logAnalyzer.colIndexability', { defaultValue: 'Indexability' })}</Th>
          <Th className="text-right">{t('logAnalyzer.colDepth', { defaultValue: 'Depth' })}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.url} className="border-b border-surface-800/60 hover:bg-surface-900/40">
            <td className="max-w-[460px] truncate px-2 py-1 font-mono text-surface-200" title={r.url}>{r.url}</td>
            <td className="px-2 py-1 text-right font-mono text-blue-300">{fmtNum(r.googlebotHits)}</td>
            <td className="px-2 py-1 text-right font-mono text-surface-300">{fmtNum(r.botHits)}</td>
            <td className="px-2 py-1 text-right font-mono">{fmtNum(r.totalHits)}</td>
            <td className="px-2 py-1 text-right font-mono">{r.statusCode ?? '—'}</td>
            <td className="px-2 py-1 text-surface-300">{r.indexability ?? '—'}</td>
            <td className="px-2 py-1 text-right font-mono">{r.depth ?? '—'}</td>
          </tr>
        ))}
        {rows.length === 0 && <EmptyRow cols={7} />}
      </tbody>
    </table>
  );
}

function DiscoveryTab({ version, onToast }: { version: number; onToast: (m: string) => void }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<LogDiscoveryRow[]>([]);
  const [seeding, setSeeding] = useState(false);
  useEffect(() => {
    void window.freecrawl.logDiscovery(500).then(setRows);
  }, [version]);
  const onSeed = useCallback(async () => {
    setSeeding(true);
    try {
      const r = await window.freecrawl.logSeedDiscovery(500);
      if (r.enqueued > 0) {
        onToast(t('logAnalyzer.seeded', { defaultValue: 'Seeded {{n}} URL(s) into the active crawl', n: r.enqueued }));
      } else if (r.reason === 'no-active-crawl') {
        onToast(t('logAnalyzer.seedNoActive', { defaultValue: 'No active crawl — start a crawl first, then seed.' }));
      } else if (r.reason === 'no-base-origin') {
        onToast(t('logAnalyzer.seedNoOrigin', { defaultValue: 'No crawled URLs yet to derive a base origin from.' }));
      } else {
        onToast(t('logAnalyzer.seedNone', { defaultValue: 'Nothing new to seed.' }));
      }
    } finally {
      setSeeding(false);
    }
  }, [onToast, t]);
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-surface-800 px-3 py-1.5 text-[11px] text-surface-400">
        <span>
          {t('logAnalyzer.discoveryHint', {
            defaultValue: 'URLs seen in the log but never reached by the crawl. Seed them into a running crawl.',
          })}
        </span>
        <button
          onClick={() => void onSeed()}
          disabled={seeding || rows.length === 0}
          className="ml-auto rounded bg-blue-600 px-3 py-1 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {t('logAnalyzer.seedBtn', { defaultValue: 'Seed into active crawl' })}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <Th>{t('logAnalyzer.colPath', { defaultValue: 'Path' })}</Th>
              <Th className="text-right">{t('logAnalyzer.colBots', { defaultValue: 'Bots' })}</Th>
              <Th className="text-right">{t('logAnalyzer.colTotal', { defaultValue: 'Total' })}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.path} className="border-b border-surface-800/60">
                <td className="max-w-[560px] truncate px-2 py-1 font-mono text-surface-200" title={r.path}>{r.path}</td>
                <td className="px-2 py-1 text-right font-mono text-surface-300">{fmtNum(r.botHits)}</td>
                <td className="px-2 py-1 text-right font-mono">{fmtNum(r.totalHits)}</td>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow cols={3} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const THREAT_CATEGORIES: LogThreatCategory[] = [
  'sqli',
  'xss',
  'traversal',
  'cmdi',
  'scanner',
  'sensitive-file',
  'anomaly',
];

/**
 * What each category actually means, in the site owner's terms. Shown as
 * the hover text on every category badge (table rows and the filter
 * chips) and collected into the Category column's [i] tooltip, because
 * "Scanner probe" is only obvious to someone who already knows.
 */
const THREAT_CATEGORY_INFO: Record<LogThreatCategory, string> = {
  sqli: 'SQL injection — the request tries to smuggle SQL into a parameter (UNION SELECT, sleep(), error-based functions) to read or alter your database.',
  xss: 'Cross-site scripting — the request carries script markup or a javascript: URL in a parameter, hoping the page echoes it back into the HTML unescaped.',
  traversal: 'Path traversal — the request walks out of the web root with ../ or encoded variants to reach files like /etc/passwd or win.ini.',
  cmdi: 'Command injection — the request appends shell syntax (;, |, backticks, $( )) to a parameter to run commands on the server.',
  scanner: 'Scanner probe — an automated vulnerability scanner walking a wordlist of known admin panels, installers and exploit paths (wp-login, phpmyadmin, /actuator, shell uploads). Not tailored to your site; it hits everyone.',
  'sensitive-file': 'Sensitive file fetch — a direct request for something that must never be public: .env, .git, backups, SQL dumps, private keys, config files.',
  anomaly: 'Anomaly — malformed or evasive input (null bytes, CRLF injection, over-encoding, absurd parameter lengths) that matches no single attack class but is not a normal browser request.',
};

/** How a request earns its score — the answer to "what is this number?". */
const THREAT_SCORE_INFO =
  'Sum of the weights of every attack signature the request matched. Each signature carries a weight by how conclusive it is (a UNION SELECT weighs 9, a stray quote 2), and a line is only flagged once the total reaches 5 — so one decisive pattern flags on its own, while weak hints have to add up. Higher score = less room for a false positive; sort by it to triage.';

const THREAT_COLORS: Record<LogThreatCategory, string> = {
  sqli: 'text-red-300 bg-red-500/15',
  xss: 'text-orange-300 bg-orange-500/15',
  traversal: 'text-amber-300 bg-amber-500/15',
  cmdi: 'text-rose-300 bg-rose-500/15',
  scanner: 'text-purple-300 bg-purple-500/15',
  'sensitive-file': 'text-pink-300 bg-pink-500/15',
  anomaly: 'text-surface-300 bg-surface-700/40',
};

function useThreatCategoryLabel(): (cat: LogThreatCategory) => string {
  const { t } = useTranslation();
  return useCallback(
    (cat: LogThreatCategory): string => {
      switch (cat) {
        case 'sqli':
          return t('logAnalyzer.threatCatSqli', { defaultValue: 'SQL injection' });
        case 'xss':
          return t('logAnalyzer.threatCatXss', { defaultValue: 'XSS' });
        case 'traversal':
          return t('logAnalyzer.threatCatTraversal', { defaultValue: 'Path traversal' });
        case 'cmdi':
          return t('logAnalyzer.threatCatCmdi', { defaultValue: 'Command injection' });
        case 'scanner':
          return t('logAnalyzer.threatCatScanner', { defaultValue: 'Scanner probe' });
        case 'sensitive-file':
          return t('logAnalyzer.threatCatSensitiveFile', { defaultValue: 'Sensitive file' });
        default:
          return t('logAnalyzer.threatCatAnomaly', { defaultValue: 'Anomaly' });
      }
    },
    [t],
  );
}

function ThreatBadge({
  category,
  label,
  title,
}: {
  category: LogThreatCategory;
  label: string;
  /** Extra hover text appended to the category's own explanation. */
  title?: string;
}) {
  const { i18n } = useTranslation();
  const info = translateInfoTip(THREAT_CATEGORY_INFO[category], i18n.language);
  return (
    <span
      className={`cursor-help whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] ${THREAT_COLORS[category]}`}
      title={title ? `${info}

${title}` : info}
    >
      {label}
    </span>
  );
}

function fmtTsFull(ts: number | null): string {
  if (ts === null) return '—';
  try {
    return new Date(ts).toISOString().replace('T', ' ').slice(0, 19);
  } catch {
    return '—';
  }
}

/** Decoded payload with the rule evidence wrapped in <mark>. The evidence
 *  was matched on a `+`→space normalised copy, so fall back to that. */
function HighlightedPayload({ text, evidence }: { text: string; evidence: string }) {
  const needle = evidence.replace(/…$/, '');
  let hay = text;
  let idx = needle ? hay.toLowerCase().indexOf(needle.toLowerCase()) : -1;
  if (idx < 0 && needle) {
    hay = text.replace(/\+/g, ' ');
    idx = hay.toLowerCase().indexOf(needle.toLowerCase());
  }
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {hay.slice(0, idx)}
      <mark className="rounded bg-red-500/30 px-0.5 text-red-100">{hay.slice(idx, idx + needle.length)}</mark>
      {hay.slice(idx + needle.length)}
    </>
  );
}

type BlocklistFormat = 'plain' | 'nginx' | 'apache';

function renderBlocklist(ips: string[], format: BlocklistFormat): string {
  if (format === 'nginx') return ips.map((ip) => `deny ${ip};`).join('\n') + '\n';
  if (format === 'apache') {
    return ['<RequireAll>', '  Require all granted', ...ips.map((ip) => `  Require not ip ${ip}`), '</RequireAll>'].join('\n') + '\n';
  }
  return ips.join('\n') + '\n';
}

function BlocklistMenu({ onCopy }: { onCopy: (format: BlocklistFormat) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const choose = (format: BlocklistFormat): void => {
    setOpen(false);
    onCopy(format);
  };
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded border border-surface-700 px-2 py-1 text-surface-200 hover:bg-surface-800"
      >
        {t('logAnalyzer.threatCopyMenu', { defaultValue: 'Copy blocklist' })}
        <span className="text-[9px] text-surface-400">▼</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded border border-surface-700 bg-surface-800 shadow-lg">
            <button onClick={() => choose('plain')} className="block w-full px-3 py-1.5 text-left text-surface-200 hover:bg-surface-700">
              {t('logAnalyzer.threatCopyPlain', { defaultValue: 'Plain IP list' })}
            </button>
            <button onClick={() => choose('nginx')} className="block w-full px-3 py-1.5 text-left text-surface-200 hover:bg-surface-700">
              {t('logAnalyzer.threatCopyNginx', { defaultValue: 'nginx deny rules' })}
            </button>
            <button onClick={() => choose('apache')} className="block w-full px-3 py-1.5 text-left text-surface-200 hover:bg-surface-700">
              {t('logAnalyzer.threatCopyApache', { defaultValue: 'Apache Require not ip' })}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ThreatsTab({ version, onToast }: { version: number; onToast: (m: string) => void }) {
  const { t } = useTranslation();
  const catLabel = useThreatCategoryLabel();
  const [summary, setSummary] = useState<LogThreatSummary | null>(null);
  const [rows, setRows] = useState<LogThreatRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<NonNullable<LogThreatsInput['category']>>('all');
  const [status, setStatus] = useState<NonNullable<LogThreatsInput['status']>>('all');
  const [ip, setIp] = useState('');
  const [sortBy, setSortBy] = useState<NonNullable<LogThreatsInput['sortBy']>>('ts');
  const [selected, setSelected] = useState<LogThreatRow | null>(null);

  useEffect(() => {
    void window.freecrawl.logThreatSummary().then(setSummary);
  }, [version]);

  useEffect(() => {
    setOffset(0);
    setSelected(null);
  }, [search, category, status, ip, sortBy, version]);

  useEffect(() => {
    let cancelled = false;
    const input: LogThreatsInput = {
      limit: PAGE,
      offset,
      search,
      category,
      status,
      ip: ip || undefined,
      sortBy,
    };
    void window.freecrawl.logThreats(input).then((r) => {
      if (cancelled) return;
      setRows(r.rows);
      setTotal(r.total);
    });
    return () => {
      cancelled = true;
    };
  }, [offset, search, category, status, ip, sortBy, version]);

  const copyBlocklist = useCallback(
    async (format: BlocklistFormat) => {
      const senders = await window.freecrawl.logThreatIps(100_000);
      // Search-engine infrastructure is never a blocklist candidate.
      const ips = senders.filter((s) => !s.ipOwner).map((s) => s.ip);
      if (ips.length === 0) {
        onToast(t('logAnalyzer.threatCopyEmpty', { defaultValue: 'No IPs to copy' }));
        return;
      }
      const ok = await writeTextToClipboard(renderBlocklist(ips, format));
      onToast(
        ok
          ? t('logAnalyzer.threatCopied', {
              defaultValue: 'Copied {{n}} IP(s) to the clipboard (search-engine infrastructure excluded)',
              n: ips.length,
            })
          : t('logAnalyzer.threatCopyFailed', { defaultValue: 'Could not copy to the clipboard' }),
      );
    },
    [onToast, t],
  );

  const copyIp = useCallback(
    async (value: string) => {
      const ok = await writeTextToClipboard(value);
      if (!ok) onToast(t('logAnalyzer.threatCopyFailed', { defaultValue: 'Could not copy to the clipboard' }));
    },
    [onToast, t],
  );

  const hasThreats = (summary?.totalHits ?? 0) > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Summary strip */}
      <div className="shrink-0 border-b border-surface-800 bg-surface-900/40 px-3 py-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-surface-400">
            {t('logAnalyzer.threatIntro', {
              defaultValue:
                'Requests that look like attacks or vulnerability probes — SQL injection, XSS, path traversal, command injection, scanner paths, sensitive-file fetches — with the sender IP and the decoded payload.',
            })}
          </span>
          {hasThreats && (
            <div className="ml-auto">
              <BlocklistMenu onCopy={(f) => void copyBlocklist(f)} />
            </div>
          )}
        </div>
        {summary && hasThreats && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-surface-200">
              {t('logAnalyzer.threatStats', {
                defaultValue: '{{hits}} flagged request(s) from {{ips}} IP(s)',
                hits: summary.totalHits.toLocaleString(),
                ips: summary.distinctIps.toLocaleString(),
              })}
            </span>
            <span className="text-surface-600">·</span>
            {summary.servedHits > 0 ? (
              <span className="text-amber-300">
                {t('logAnalyzer.threatServed', {
                  defaultValue:
                    '{{n}} answered 2xx — the server processed those payloads; check the application, not just the log',
                  n: summary.servedHits.toLocaleString(),
                })}
              </span>
            ) : (
              <span className="text-green-400">
                {t('logAnalyzer.threatServedNone', { defaultValue: 'none answered 2xx' })}
              </span>
            )}
            {summary.capHit && (
              <span className="text-amber-400">
                {t('logAnalyzer.threatCapHit', { defaultValue: 'The per-file cap was reached — this list is partial.' })}
              </span>
            )}
          </div>
        )}
        {summary && hasThreats && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCategory('all')}
              className={`rounded border px-2 py-0.5 ${category === 'all' ? 'border-blue-500 text-surface-100' : 'border-surface-700 text-surface-400 hover:text-surface-200'}`}
            >
              {t('logAnalyzer.threatCatAll', { defaultValue: 'All categories' })} ({summary.totalHits.toLocaleString()})
            </button>
            {summary.byCategory.map((c) => (
              <button
                key={c.category}
                onClick={() => setCategory(category === c.category ? 'all' : c.category)}
                className={`rounded border px-2 py-0.5 ${category === c.category ? 'border-blue-500' : 'border-surface-800 hover:border-surface-600'}`}
              >
                <ThreatBadge
                  category={c.category}
                  label={`${catLabel(c.category)} ${c.hits.toLocaleString()}`}
                  title={t('logAnalyzer.threatChipIps', {
                    defaultValue: '{{n}} distinct IP(s)',
                    n: c.ips.toLocaleString(),
                  })}
                />
              </button>
            ))}
          </div>
        )}
        {summary && summary.topIps.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-surface-500">{t('logAnalyzer.threatTopIps', { defaultValue: 'Top senders' })}:</span>
            {summary.topIps.slice(0, 10).map((s) => (
              <button
                key={s.ip}
                onClick={() => setIp(ip === s.ip ? '' : s.ip)}
                className={`rounded border px-1.5 py-0.5 font-mono ${ip === s.ip ? 'border-blue-500 text-surface-100' : 'border-surface-800 text-surface-300 hover:border-surface-600'}`}
                title={s.categories.map(catLabel).join(', ')}
              >
                {s.ip} <span className="text-surface-500">×{s.hits.toLocaleString()}</span>
                {s.servedHits > 0 && <span className="ml-1 text-amber-400">{s.servedHits}·2xx</span>}
                {s.ipOwner && <span className="ml-1 text-blue-300">{s.ipOwner}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-surface-800 px-3 py-1.5 text-[11px]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('logAnalyzer.threatSearch', { defaultValue: 'Filter by payload, IP or user-agent…' })}
          className="w-64 rounded border border-surface-700 bg-surface-800 px-2 py-1 text-surface-100"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as NonNullable<LogThreatsInput['category']>)}
          className="rounded border border-surface-700 bg-surface-800 px-2 py-1 text-surface-100"
        >
          <option value="all">{t('logAnalyzer.threatCatAll', { defaultValue: 'All categories' })}</option>
          {THREAT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {catLabel(c)}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as NonNullable<LogThreatsInput['status']>)}
          className="rounded border border-surface-700 bg-surface-800 px-2 py-1 text-surface-100"
        >
          <option value="all">{t('logAnalyzer.threatStatusAll', { defaultValue: 'Any status' })}</option>
          <option value="2xx">{t('logAnalyzer.threatStatus2xx', { defaultValue: '2xx (served)' })}</option>
          <option value="3xx">3xx</option>
          <option value="4xx">4xx</option>
          <option value="5xx">5xx</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as NonNullable<LogThreatsInput['sortBy']>)}
          className="rounded border border-surface-700 bg-surface-800 px-2 py-1 text-surface-100"
        >
          <option value="ts">{t('logAnalyzer.threatSortRecent', { defaultValue: 'Sort: Most recent' })}</option>
          <option value="score">{t('logAnalyzer.threatSortScore', { defaultValue: 'Sort: Score' })}</option>
          <option value="status">{t('logAnalyzer.threatSortStatus', { defaultValue: 'Sort: Status' })}</option>
        </select>
        {ip && (
          <button
            onClick={() => setIp('')}
            className="rounded border border-blue-500/60 px-2 py-0.5 font-mono text-blue-200 hover:bg-surface-800"
            title={t('logAnalyzer.threatClearIp', { defaultValue: 'Clear IP filter' })}
          >
            {t('logAnalyzer.threatIpFilter', { defaultValue: 'IP: {{ip}}', ip })} ✕
          </button>
        )}
        <Pager offset={offset} total={total} onPrev={() => setOffset(Math.max(0, offset - PAGE))} onNext={() => setOffset(offset + PAGE)} />
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <Th>{t('logAnalyzer.colTime', { defaultValue: 'Time' })}</Th>
              <Th>IP</Th>
              <Th>{t('logAnalyzer.colMethod', { defaultValue: 'Method' })}</Th>
              <Th>{t('logAnalyzer.colRequest', { defaultValue: 'Request (decoded)' })}</Th>
              <Th className="text-right">{t('logAnalyzer.colStatus', { defaultValue: 'Status' })}</Th>
              <Th info="Which attack class the strongest matching signature belongs to: SQL injection, XSS, path traversal, command injection, scanner probe, sensitive file, or anomaly. Hover any badge in this column for what that class means in practice.">
                {t('logAnalyzer.colCategory', { defaultValue: 'Category' })}
              </Th>
              <Th className="text-right" info={THREAT_SCORE_INFO}>
                {t('logAnalyzer.colScore', { defaultValue: 'Score' })}
              </Th>
              <Th>{t('logAnalyzer.colEvidence', { defaultValue: 'Evidence' })}</Th>
              <Th>{t('logAnalyzer.colDeclaredBot', { defaultValue: 'Declared Bot' })}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const served = r.status !== null && r.status >= 200 && r.status < 300;
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelected(selected?.id === r.id ? null : r)}
                  className={`cursor-pointer border-b border-surface-800/60 hover:bg-surface-900/40 ${selected?.id === r.id ? 'bg-surface-900/70' : ''}`}
                >
                  <td className="whitespace-nowrap px-2 py-1 font-mono text-surface-400">{fmtTsFull(r.ts)}</td>
                  <td className="whitespace-nowrap px-2 py-1 font-mono text-surface-200">
                    {r.ip ?? '—'}
                    {r.ipOwner && <span className="ml-1 text-blue-300">{r.ipOwner}</span>}
                  </td>
                  <td className="px-2 py-1 font-mono text-surface-300">{r.method ?? '—'}</td>
                  <td className="max-w-[420px] truncate px-2 py-1 font-mono text-surface-200" title={r.decoded}>
                    {r.decoded}
                  </td>
                  <td className={`px-2 py-1 text-right font-mono ${served ? 'text-amber-300' : 'text-surface-300'}`}>
                    {r.status ?? '—'}
                    {served && (
                      <span className="ml-1 text-[9px] uppercase text-amber-400">
                        {t('logAnalyzer.threatServedBadge', { defaultValue: 'served' })}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1"><ThreatBadge category={r.category} label={catLabel(r.category)} /></td>
                  <td className="px-2 py-1 text-right font-mono">{r.score}</td>
                  <td className="max-w-[240px] truncate px-2 py-1 font-mono text-red-200/80" title={r.evidence}>{r.evidence}</td>
                  <td className="px-2 py-1 text-surface-400">{r.bot ?? '—'}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-surface-500">
                  {t('logAnalyzer.threatNone', { defaultValue: 'No suspicious requests in the ingested logs.' })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="max-h-[40%] shrink-0 overflow-auto border-t border-surface-700 bg-surface-900/80 px-3 py-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <ThreatBadge category={selected.category} label={catLabel(selected.category)} />
            <span className="font-mono text-surface-200">{selected.ip ?? '—'}</span>
            <span className="text-surface-500">{fmtTsFull(selected.ts)}</span>
            <span className="font-mono text-surface-400">{selected.method ?? '—'} · {selected.status ?? '—'}</span>
            <span className={selected.targetInCrawl ? 'text-blue-300' : 'text-surface-500'}>
              {selected.targetInCrawl
                ? t('logAnalyzer.threatTargetInCrawl', { defaultValue: 'Target exists in the crawl' })
                : t('logAnalyzer.threatTargetProbe', { defaultValue: 'Blind probe — target not in the crawl' })}
            </span>
            <div className="ml-auto flex items-center gap-1">
              {selected.ip && (
                <>
                  <button onClick={() => setIp(selected.ip!)} className="rounded border border-surface-700 px-2 py-0.5 text-surface-300 hover:bg-surface-800">
                    {t('logAnalyzer.threatFilterIp', { defaultValue: 'Only this IP' })}
                  </button>
                  <button onClick={() => void copyIp(selected.ip!)} className="rounded border border-surface-700 px-2 py-0.5 text-surface-300 hover:bg-surface-800">
                    {t('logAnalyzer.threatCopyIp', { defaultValue: 'Copy IP' })}
                  </button>
                </>
              )}
              <button onClick={() => setSelected(null)} className="rounded border border-surface-700 px-2 py-0.5 text-surface-300 hover:bg-surface-800">
                {t('logAnalyzer.threatClose', { defaultValue: 'Close' })}
              </button>
            </div>
          </div>
          {selected.ipOwner && (
            <div className="mt-2 rounded border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-blue-200">
              {t('logAnalyzer.threatOwnerWarning', {
                defaultValue:
                  "This IP resolves to {{owner}}'s own infrastructure — the payload was relayed through the search engine (Lens, Translate, a fetch of a crafted URL). Blocking the IP would block {{owner}}; fix the application instead.",
                owner: selected.ipOwner,
              })}
            </div>
          )}
          <pre className="mt-2 whitespace-pre-wrap break-all rounded bg-surface-950 px-2 py-1.5 font-mono text-surface-100">
            <HighlightedPayload text={selected.decoded} evidence={selected.evidence} />
          </pre>
          <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-surface-400">
            <span>{t('logAnalyzer.threatDetailRaw', { defaultValue: 'Raw request target' })}</span>
            <code className="break-all text-surface-300">{selected.path}</code>
            <span>{t('logAnalyzer.threatDetailRules', { defaultValue: 'Matched rules' })}</span>
            <code className="text-surface-300">{selected.rules.join(', ')}</code>
            <span>User-Agent</span>
            <code className="break-all text-surface-300">{selected.userAgent ?? '—'}</code>
            <span>Referer</span>
            <code className="break-all text-surface-300">{selected.referer ?? '—'}</code>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  const { t } = useTranslation();
  return (
    <tr>
      <td colSpan={cols} className="px-3 py-6 text-center text-surface-500">
        {t('logAnalyzer.noRows', { defaultValue: 'No data.' })}
      </td>
    </tr>
  );
}
