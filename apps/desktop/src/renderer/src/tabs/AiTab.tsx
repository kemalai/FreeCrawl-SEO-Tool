import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import { Loader2, Search, Play, AlertTriangle } from 'lucide-react';
import type {
  AiProgress,
  AiProvider,
  AiResult,
  AiRow,
  IntegrationsState,
} from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

const TOOLBAR_HEIGHT = 36;
const PROMPT_PANEL_HEIGHT = 100;
const HEADER_HEIGHT = 26;
const STATUS_BAR_HEIGHT = 22;
const ROW_HEIGHT = 32;
const PAGE_SIZE = 2000;
const POLL_MS_RUNNING = 5000;
const CONFIRM_THRESHOLD = 30;

const DEFAULT_PROMPT =
  'Summarize the page below in 2-3 sentences for an SEO audit.\n\n' +
  'URL: {url}\nTitle: {title}\nMeta description: {description}\nH1: {h1}\n\n' +
  'Body:\n{body}';

const PROVIDER_LABEL: Record<AiProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  ollama: 'Ollama (local)',
};

type FilterMode = 'all' | 'with-data' | 'without-data' | 'error';

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

function fmtTokens(a: AiResult): string {
  const i = a.tokensIn ?? 0;
  const o = a.tokensOut ?? 0;
  if (!i && !o) return '—';
  return `${i.toLocaleString()} / ${o.toLocaleString()}`;
}

export function AiTab() {
  const { t } = useTranslation();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const crawlProgress = useAppStore((s) => s.progress);

  const [provider, setProvider] = useState<AiProvider>('openai');
  const [model, setModel] = useState('');
  const [promptTemplate, setPromptTemplate] = useState<string>(() => {
    const saved = window.freecrawl?.prefsGet('ai-tab:prompt');
    return typeof saved === 'string' && saved.trim() ? saved : DEFAULT_PROMPT;
  });
  const [rows, setRows] = useState<AiRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<AiProgress | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationsState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    const res = await window.freecrawl.aiQuery({
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
    const off = window.freecrawl.onAiProgress((p) => {
      setProgress(p.running ? p : null);
      if (!p.currentUrl) void reload();
    });
    return off;
  }, [reload]);

  // Persist the prompt — it's expensive to craft, cheap to remember.
  useEffect(() => {
    try {
      window.freecrawl?.prefsSet('ai-tab:prompt', promptTemplate);
    } catch {
      /* best-effort persistence */
    }
  }, [promptTemplate]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
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
      if (rows.length > 0 && rows.every((r) => prev.has(r.url))) {
        return new Set();
      }
      return new Set(rows.map((r) => r.url));
    });
  }, [rows]);

  const selectUntested = useCallback(() => {
    setSelected(new Set(rows.filter((r) => !r.ai).map((r) => r.url)));
  }, [rows]);

  const providerConfigured =
    integrations?.[provider]?.configured ?? false;

  const runAi = useCallback(async () => {
    const urls = [...selected];
    if (urls.length === 0 || running) return;
    if (!promptTemplate.trim()) return;
    if (!providerConfigured) return;
    if (
      urls.length > CONFIRM_THRESHOLD &&
      !window.confirm(
        t('aiTab.confirmRun', {
          defaultValue:
            'This will send {{count}} prompts to {{provider}}. Continue?',
          count: urls.length,
          provider: PROVIDER_LABEL[provider],
        }),
      )
    ) {
      return;
    }
    setRunning(true);
    setProgress({ done: 0, total: urls.length, currentUrl: null, running: true });
    try {
      await window.freecrawl.aiRun({
        provider,
        model: model.trim() || undefined,
        prompt: promptTemplate,
        urls,
      });
    } finally {
      setRunning(false);
      setProgress(null);
      void reload();
    }
  }, [
    selected,
    running,
    promptTemplate,
    providerConfigured,
    provider,
    model,
    t,
    reload,
  ]);

  const cancelRun = useCallback(() => {
    void window.freecrawl.aiCancel();
  }, []);

  const testedCount = useMemo(() => rows.filter((r) => r.ai).length, [rows]);
  const errorCount = useMemo(
    () => rows.filter((r) => r.ai?.status === 'error').length,
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
          {t('aiTab.title', { defaultValue: 'AI' })}
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
            placeholder={t('aiTab.filterPlaceholder', { defaultValue: 'Filter by URL…' })}
            className="h-6 w-44 rounded border border-surface-700 bg-surface-950 pl-6 pr-2 text-[11px] text-surface-100 placeholder-surface-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <select
          className="h-6 rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterMode)}
        >
          <option value="all">{t('aiTab.filterAll', { defaultValue: 'All pages' })}</option>
          <option value="with-data">{t('aiTab.filterWith', { defaultValue: 'With response' })}</option>
          <option value="without-data">{t('aiTab.filterWithout', { defaultValue: 'No response' })}</option>
          <option value="error">{t('aiTab.filterError', { defaultValue: 'Errors only' })}</option>
        </select>
        <label className="flex items-center gap-1 text-[11px] text-surface-400">
          {t('aiTab.provider', { defaultValue: 'Provider:' })}
          <select
            className="h-6 rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
            value={provider}
            onChange={(e) => setProvider(e.target.value as AiProvider)}
            disabled={running}
          >
            <option value="openai">{PROVIDER_LABEL.openai}</option>
            <option value="anthropic">{PROVIDER_LABEL.anthropic}</option>
            <option value="ollama">{PROVIDER_LABEL.ollama}</option>
          </select>
        </label>
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={t('aiTab.modelPlaceholder', { defaultValue: 'Model (optional)' })}
          disabled={running}
          className="h-6 w-36 rounded border border-surface-700 bg-surface-950 px-2 text-[11px] text-surface-100 placeholder-surface-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={selectUntested}
          disabled={running || rows.length === 0}
          className="h-6 rounded border border-surface-700 bg-surface-800 px-2 text-[11px] text-surface-200 hover:bg-surface-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('aiTab.selectUntested', { defaultValue: 'Select untested' })}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {running && progress ? (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-surface-300">
                <Loader2 size={12} className="animate-spin text-blue-400" />
                {t('aiTab.runProgress', {
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
                {t('aiTab.cancel', { defaultValue: 'Cancel' })}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void runAi()}
              disabled={
                selected.size === 0 ||
                running ||
                !providerConfigured ||
                !promptTemplate.trim()
              }
              className="inline-flex h-6 items-center gap-1.5 rounded bg-blue-600 px-3 text-[11px] font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-surface-700 disabled:text-surface-500"
            >
              <Play size={11} />
              {t('aiTab.run', {
                defaultValue: 'Run ({{count}})',
                count: selected.size,
              })}
            </button>
          )}
        </div>
      </div>

      {/* Configuration warning */}
      {!providerConfigured && (
        <div className="flex items-center gap-2 border-b border-amber-700/40 bg-amber-900/20 px-3 py-1 text-[10px] text-amber-200">
          <AlertTriangle size={11} />
          {t('aiTab.notConfigured', {
            defaultValue:
              '{{provider}} is not configured — set its credentials in Settings → Integrations to run prompts.',
            provider: PROVIDER_LABEL[provider],
          })}
        </div>
      )}

      {/* Prompt template panel */}
      <div
        className="flex shrink-0 flex-col border-b border-surface-800 bg-surface-900/20"
        style={{ height: PROMPT_PANEL_HEIGHT }}
      >
        <div className="flex items-center gap-2 px-3 py-1 text-[10px] text-surface-500">
          <span className="font-semibold uppercase tracking-wide">
            {t('aiTab.promptLabel', { defaultValue: 'Prompt template' })}
          </span>
          <span>
            {t('aiTab.promptVars', {
              defaultValue:
                'variables: {url} · {title} · {description} · {h1} · {body} (truncated to 2 KB)',
            })}
          </span>
        </div>
        <textarea
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
          spellCheck={false}
          className="flex-1 resize-none border-0 bg-transparent px-3 pb-2 font-mono text-[11px] leading-snug text-surface-100 outline-none placeholder-surface-600"
          placeholder={DEFAULT_PROMPT}
        />
      </div>

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
        <div className="flex-1 px-2">{t('aiTab.colUrl', { defaultValue: 'URL' })}</div>
        <div className="w-[54px] shrink-0 text-center">{t('aiTab.colStatus', { defaultValue: 'Status' })}</div>
        <div className="w-[380px] shrink-0 px-2">{t('aiTab.colResponse', { defaultValue: 'Response' })}</div>
        <div className="w-[100px] shrink-0 px-2">{t('aiTab.colModel', { defaultValue: 'Model' })}</div>
        <div className="w-[88px] shrink-0 text-right px-2">{t('aiTab.colTokens', { defaultValue: 'Tokens' })}</div>
        <div className="w-[80px] shrink-0 px-2 text-right">{t('aiTab.colFetched', { defaultValue: 'Fetched' })}</div>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-[12px] text-surface-500">
            {total === 0
              ? t('aiTab.emptyNoData', {
                  defaultValue:
                    'No internal HTML pages crawled yet — run a crawl, then select pages and Run.',
                })
              : t('aiTab.emptyNoMatch', { defaultValue: 'No pages match the current filter.' })}
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
                  <AiDataRow
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
          {t('aiTab.summary', {
            defaultValue:
              '{{shown}} pages · {{tested}} with response · {{errors}} errors · {{selected}} selected',
            shown: rows.length.toLocaleString(),
            tested: testedCount.toLocaleString(),
            errors: errorCount.toLocaleString(),
            selected: selected.size.toLocaleString(),
          })}
        </span>
        {running && progress?.currentUrl && (
          <span className="truncate text-surface-500">
            {t('aiTab.running', { defaultValue: 'Running: {{url}}', url: progress.currentUrl })}
          </span>
        )}
      </div>
    </div>
  );
}

function AiDataRow({
  row,
  selected,
  onToggle,
}: {
  row: AiRow;
  selected: boolean;
  onToggle: () => void;
}) {
  const a = row.ai;
  const status = row.statusCode;
  const statusCls =
    status === null
      ? 'text-surface-600'
      : status >= 200 && status < 300
        ? 'text-emerald-400'
        : status >= 300 && status < 400
          ? 'text-blue-400'
          : 'text-red-400';

  let responseCell: ReactNode;
  if (!a) {
    responseCell = <span className="text-surface-600">—</span>;
  } else if (a.status === 'error') {
    responseCell = (
      <span className="text-red-400" title={a.error ?? 'Error'}>
        {a.error ?? 'Error'}
      </span>
    );
  } else {
    responseCell = (
      <span className="text-surface-200" title={a.response}>
        {a.response}
      </span>
    );
  }

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
      <div className={`w-[54px] shrink-0 text-center tabular-nums ${statusCls}`}>
        {status ?? '—'}
      </div>
      <div className="w-[380px] shrink-0 truncate px-2">{responseCell}</div>
      <div
        className="w-[100px] shrink-0 truncate px-2 text-surface-400"
        title={a?.model ?? ''}
      >
        {a?.model ?? '—'}
      </div>
      <div className="w-[88px] shrink-0 text-right px-2 tabular-nums text-surface-400">
        {a ? fmtTokens(a) : '—'}
      </div>
      <div className="w-[80px] shrink-0 truncate px-2 text-right text-surface-500">
        {a ? relativeTime(a.fetchedAt) : '—'}
      </div>
    </div>
  );
}
