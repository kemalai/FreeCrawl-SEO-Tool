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
  LogTrendRow,
  LogUrlStatRow,
  LogUrlStatsInput,
} from '@freecrawl/shared-types';

/**
 * V2 Faz 2 — standalone Log File Analyzer window (renderer `?loganalyzer=1`).
 * Ingests server access logs and surfaces every Faz 2 feature: bot hits per
 * URL, crawl-budget, response-code distribution, daily trend, crawl × log
 * orphan detection, and seeding log-discovered URLs into the active crawl.
 */

type Tab = 'urls' | 'bots' | 'status' | 'trend' | 'budget' | 'orphans' | 'discovery';

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
      if (res.ok && res.imported) {
        const i = res.imported;
        showToast(
          t('logAnalyzer.imported', {
            defaultValue: '{{file}} — parsed {{parsed}}/{{total}} lines ({{format}})',
            file: i.fileName,
            parsed: i.parsedLines.toLocaleString(),
            total: i.totalLines.toLocaleString(),
            format: i.format,
          }),
        );
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
    await window.freecrawl.logClear();
    refreshOverview();
    setVersion((v) => v + 1);
  }, [refreshOverview, t]);

  const onExport = useCallback(
    async (format: 'csv' | 'xlsx') => {
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
              : t('logAnalyzer.import', { defaultValue: 'Import Log File…' })}
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

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`sticky top-0 z-10 bg-surface-900 px-2 py-1 text-left font-medium text-surface-400 ${className}`}>
      {children}
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
  const [sortBy, setSortBy] = useState<NonNullable<LogUrlStatsInput['sortBy']>>('totalHits');

  useEffect(() => {
    if (mode === 'all') void window.freecrawl.logBots().then(setBotList);
  }, [version, mode]);

  useEffect(() => {
    setOffset(0);
  }, [search, filter, bot, sortBy, version]);

  useEffect(() => {
    // Cancellation guard: fast typing / filter changes fire overlapping
    // queries, and without this the slower (older) response can resolve last
    // and overwrite the newer result set, showing rows for a filter the user
    // no longer has selected.
    let cancelled = false;
    const input: LogUrlStatsInput = { limit: PAGE, offset, search, sortBy, filter, bot: bot || undefined };
    const call = mode === 'orphans' ? window.freecrawl.logOrphans(input) : window.freecrawl.logUrlStats(input);
    void call.then((r) => {
      if (cancelled) return;
      setRows(r.rows);
      setTotal(r.total);
    });
    return () => {
      cancelled = true;
    };
  }, [offset, search, filter, bot, sortBy, version, mode]);

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
              <Th className="text-right">{t('logAnalyzer.colStatus', { defaultValue: 'Status' })}</Th>
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
