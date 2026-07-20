import { useState } from 'react';
import { Play, Square, Pause, Eraser, ChevronDown, Settings, History, Plus, ListChecks, Monitor, Smartphone } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { CrawlScope, CrawlMode } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';
import { clearCrawlWithConfirm } from '../utils/clearCrawl.js';

export function TopBar() {
  const { t } = useTranslation();
  const scopeOptions: { value: CrawlScope; label: string; hint: string }[] = [
    { value: 'subdomain', label: t('topbar.scope.subdomain'), hint: t('topbar.scope.subdomainHint') },
    { value: 'subfolder', label: t('topbar.scope.subfolder'), hint: t('topbar.scope.subfolderHint') },
    { value: 'all-subdomains', label: t('topbar.scope.allSubdomains'), hint: t('topbar.scope.allSubdomainsHint') },
    { value: 'exact-url', label: t('topbar.scope.exactUrl'), hint: t('topbar.scope.exactUrlHint') },
  ];
  // Crawl mode sits to the LEFT of the URL bar: it determines what the URL
  // field means (start URL / sitemap URL) or, for List, replaces it with a
  // URL-list editor. Mirrors Screaming Frog's top-left Mode menu.
  const modeOptions: { value: CrawlMode; label: string; hint: string }[] = [
    { value: 'spider', label: t('topbar.mode.spider', { defaultValue: 'Spider' }), hint: t('topbar.mode.spiderHint', { defaultValue: 'Start URL + follow links' }) },
    { value: 'list', label: t('topbar.mode.list', { defaultValue: 'List' }), hint: t('topbar.mode.listHint', { defaultValue: 'Crawl a fixed URL list, no link follow' }) },
    { value: 'sitemap', label: t('topbar.mode.sitemap', { defaultValue: 'Sitemap' }), hint: t('topbar.mode.sitemapHint', { defaultValue: 'Crawl the URLs listed in a sitemap' }) },
  ];
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);
  // Scalar subscriptions instead of the full `progress` object — TopBar
  // only needs a handful of fields, and Zustand bails out of the
  // re-render when the SCALAR values are unchanged. With the full
  // object subscription a new reference on every emitProgress() pinned
  // this component to the renderer's hot path.
  const running = useAppStore((s) => s.progress?.running === true);
  const paused = useAppStore((s) => s.progress?.paused === true);
  const progressDiscovered = useAppStore((s) => s.progress?.discovered ?? 0);
  const progressCrawled = useAppStore((s) => s.progress?.crawled ?? 0);
  const setProgress = useAppStore((s) => s.setProgress);
  const summaryTotal = useAppStore((s) => s.summary?.total ?? 0);
  const overviewInternalTotal = useAppStore(
    (s) => s.overview?.summary.totalInternalUrls ?? 0,
  );
  const overviewExternalTotal = useAppStore(
    (s) => s.overview?.summary.totalExternalUrls ?? 0,
  );
  const reset = useAppStore((s) => s.reset);
  const setError = useAppStore((s) => s.setError);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const recentUrls = useAppStore((s) => s.recentUrls);
  const addRecentUrl = useAppStore((s) => s.addRecentUrl);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  // Raw textarea buffer for the List editor. Kept separate from
  // `config.urlList` so a mid-typing newline isn't collapsed on every
  // keystroke — we parse into the config but render the raw text.
  const [listText, setListText] = useState('');

  function openListEditor() {
    setListText(config.urlList.join('\n'));
    setListOpen(true);
  }

  // Clear is enabled whenever there's anything to wipe. Four signals
  // because each one alone is incomplete (fresh run vs. post-`done`
  // state vs. project opened from disk vs. paused crawl with rows).
  const hasData =
    progressDiscovered > 0 ||
    progressCrawled > 0 ||
    summaryTotal > 0 ||
    overviewInternalTotal > 0 ||
    overviewExternalTotal > 0;
  const activeScope = scopeOptions.find((o) => o.value === config.scope)!;
  const activeMode = modeOptions.find((o) => o.value === config.mode)!;
  const urlPlaceholder =
    config.mode === 'sitemap'
      ? t('topbar.sitemapPlaceholder', { defaultValue: 'https://example.com/sitemap.xml' })
      : t('topbar.urlPlaceholder');

  async function start() {
    // List mode has no start URL — it runs off `config.urlList`.
    if (config.mode === 'list') {
      if (config.urlList.length === 0) {
        setError(t('topbar.errorEmptyList', { defaultValue: 'Add at least one URL to the list first.' }));
        setListOpen(true);
        return;
      }
    } else {
      const trimmed = config.startUrl.trim();
      if (!trimmed) {
        setError(
          config.mode === 'sitemap'
            ? t('topbar.errorEmptySitemap', { defaultValue: 'Enter a sitemap URL first.' })
            : t('topbar.errorEmptyUrl'),
        );
        return;
      }
      addRecentUrl(trimmed);
    }
    setRecentOpen(false);
    reset();
    // Flip the UI to "Running" immediately so the user gets feedback
    // before the IPC round-trip and resolveStartUrl probe complete.
    // The real progress events from the crawler will overwrite this.
    setProgress({
      discovered: 0,
      crawled: 0,
      failed: 0,
      pending: 0,
      currentDepth: 0,
      urlsPerSecond: 0,
      elapsedMs: 0,
      avgResponseTimeMs: 0,
      running: true,
      paused: false,
      startUrl: config.startUrl,
    });
    try {
      await window.freecrawl.crawlStart(config);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function stop() {
    await window.freecrawl.crawlStop();
  }

  async function pauseCrawl() {
    await window.freecrawl.crawlPause();
  }

  async function resumeCrawl() {
    await window.freecrawl.crawlResume();
  }

  async function clearCrawl() {
    const didClear = await clearCrawlWithConfirm();
    if (didClear) reset();
  }

  async function addManualUrl() {
    const raw = window.prompt(t('topbar.addUrlPrompt'), '');
    if (!raw) return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    const r = await window.freecrawl.crawlAddUrl(trimmed);
    if (!r.accepted) {
      setError(t('topbar.errorAddUrl'));
    }
  }

  return (
    <div className="flex items-center gap-2 border-b border-surface-800 bg-surface-900 px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-surface-400">
        FreeCrawl
      </div>
      <div className="mx-2 h-5 w-px bg-surface-800" />

      {/* Crawl mode — determines what the URL bar means (Spider/Sitemap) or
          swaps it for a URL-list editor (List). */}
      <div className="relative">
        <button
          className="btn btn-ghost whitespace-nowrap border border-surface-700 px-2 py-1.5"
          onClick={() => setModeOpen((v) => !v)}
          disabled={running}
          title={activeMode.hint}
        >
          {activeMode.label}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {modeOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setModeOpen(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded border border-surface-700 bg-surface-900 shadow-xl">
              {modeOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={clsx(
                    'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-[11px] hover:bg-surface-800',
                    config.mode === opt.value && 'bg-surface-800',
                  )}
                  onClick={() => {
                    setConfig({ mode: opt.value });
                    setModeOpen(false);
                    // Jump straight to the list editor so the user sees where
                    // the URLs go the moment they pick List.
                    if (opt.value === 'list') openListEditor();
                  }}
                >
                  <span className="font-medium text-surface-100">{opt.label}</span>
                  <span className="text-surface-500">{opt.hint}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {config.mode === 'list' ? (
        <div className="relative flex-1">
          <button
            className="btn btn-ghost w-full justify-start border border-surface-700 px-3 py-1.5 text-left text-surface-300"
            onClick={() => (listOpen ? setListOpen(false) : openListEditor())}
            disabled={running}
          >
            <ListChecks className="h-3.5 w-3.5 shrink-0" />
            {config.urlList.length > 0
              ? t('topbar.editList', { defaultValue: 'Edit URL list ({{n}})', n: config.urlList.length })
              : t('topbar.addList', { defaultValue: 'Add URL list…' })}
          </button>
          {listOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setListOpen(false)} />
              <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded border border-surface-700 bg-surface-900 p-2 shadow-xl">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-surface-500">
                    {t('topbar.listTitle', { defaultValue: 'URL list — one per line' })}
                  </span>
                  <button
                    className="text-[11px] text-blue-400 hover:text-blue-300"
                    onClick={() => setListOpen(false)}
                  >
                    {t('topbar.listDone', { defaultValue: 'Done' })}
                  </button>
                </div>
                <textarea
                  className="input h-40 w-full resize-y font-mono text-[11px]"
                  placeholder={'https://example.com/\nhttps://example.com/about'}
                  value={listText}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setListText(raw);
                    setConfig({
                      urlList: raw
                        .split('\n')
                        .map((s) => s.trim())
                        .filter((l) => l.length > 0 && !l.startsWith('#')),
                    });
                  }}
                  spellCheck={false}
                  autoFocus
                />
                <div className="mt-1 text-[10px] text-surface-500">
                  {t('topbar.listCount', { defaultValue: '{{n}} URL(s)', n: config.urlList.length })}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="relative flex-1">
          <input
            className="input w-full"
            placeholder={urlPlaceholder}
            value={config.startUrl}
            onChange={(e) => setConfig({ startUrl: e.target.value })}
            onFocus={() => {
              if (recentUrls.length > 0) setRecentOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !running) void start();
              if (e.key === 'Escape') setRecentOpen(false);
            }}
            disabled={running}
            spellCheck={false}
          />
          {recentOpen && recentUrls.length > 0 && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setRecentOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded border border-surface-700 bg-surface-900 shadow-xl">
                <div className="flex items-center gap-1.5 border-b border-surface-800 px-3 py-1.5 text-[10px] uppercase tracking-wider text-surface-500">
                  <History className="h-3 w-3" />
                  {t('topbar.recentUrls')}
                </div>
                {recentUrls.map((url) => (
                  <button
                    key={url}
                    className="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-surface-200 hover:bg-surface-800"
                    onMouseDown={(e) => {
                      // mousedown so input blur doesn't race with click
                      e.preventDefault();
                      setConfig({ startUrl: url });
                      setRecentOpen(false);
                    }}
                    title={url}
                  >
                    <span className="truncate">{url}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Device toggle — Desktop (default) vs Mobile. Mobile swaps the
          crawl's User-Agent to a smartphone UA so servers that serve a
          different mobile HTML return their mobile version. */}
      <div className="flex items-center overflow-hidden rounded border border-surface-700">
        <button
          type="button"
          className={clsx(
            'flex items-center px-2 py-1.5',
            config.deviceMode !== 'mobile'
              ? 'bg-surface-700 text-surface-50'
              : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200',
          )}
          onClick={() => setConfig({ deviceMode: 'desktop' })}
          disabled={running}
          title={t('topbar.device.desktop', { defaultValue: 'Desktop crawl' })}
          aria-label={t('topbar.device.desktop', { defaultValue: 'Desktop crawl' })}
          aria-pressed={config.deviceMode !== 'mobile'}
        >
          <Monitor className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={clsx(
            'flex items-center border-l border-surface-700 px-2 py-1.5',
            config.deviceMode === 'mobile'
              ? 'bg-surface-700 text-surface-50'
              : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200',
          )}
          onClick={() => setConfig({ deviceMode: 'mobile' })}
          disabled={running}
          title={t('topbar.device.mobile', {
            defaultValue: 'Mobile crawl — crawl the site’s mobile version (mobile User-Agent)',
          })}
          aria-label={t('topbar.device.mobile', {
            defaultValue: 'Mobile crawl — crawl the site’s mobile version (mobile User-Agent)',
          })}
          aria-pressed={config.deviceMode === 'mobile'}
        >
          <Smartphone className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="relative">
        <button
          className="btn btn-ghost border border-surface-700 px-2 py-1.5"
          onClick={() => setScopeOpen((v) => !v)}
          disabled={running || config.mode !== 'spider'}
          title={
            config.mode !== 'spider'
              ? t('topbar.scopeSpiderOnly', {
                  defaultValue: 'Scope applies to Spider mode only',
                })
              : undefined
          }
        >
          {activeScope.label}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {scopeOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setScopeOpen(false)} />
            <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded border border-surface-700 bg-surface-900 shadow-xl">
              {scopeOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={clsx(
                    'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-[11px] hover:bg-surface-800',
                    config.scope === opt.value && 'bg-surface-800',
                  )}
                  onClick={() => {
                    setConfig({ scope: opt.value });
                    setScopeOpen(false);
                  }}
                >
                  <span className="font-medium text-surface-100">{opt.label}</span>
                  <span className="text-surface-500">{opt.hint}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {running ? (
        <>
          {paused ? (
            <button
              className="btn btn-ghost border border-amber-700/60 text-amber-300"
              onClick={resumeCrawl}
              title={t('topbar.resumeTooltip')}
            >
              <Play className="h-3.5 w-3.5" /> {t('topbar.resume')}
            </button>
          ) : (
            <button
              className="btn btn-ghost border border-surface-700"
              onClick={pauseCrawl}
              title={t('topbar.pauseTooltip')}
            >
              <Pause className="h-3.5 w-3.5" /> {t('topbar.pause')}
            </button>
          )}
          <button className="btn btn-ghost border border-red-700/50 text-red-300" onClick={stop}>
            <Square className="h-3.5 w-3.5" /> {t('topbar.stop')}
          </button>
          <button
            className="btn btn-ghost border border-surface-700"
            onClick={addManualUrl}
            title={t('topbar.addUrlTooltip')}
          >
            <Plus className="h-3.5 w-3.5" /> {t('topbar.addUrl')}
          </button>
        </>
      ) : (
        <button className="btn btn-primary" onClick={start}>
          <Play className="h-3.5 w-3.5" /> {t('topbar.start')}
        </button>
      )}
      <button
        className="btn btn-ghost border border-surface-700"
        onClick={clearCrawl}
        disabled={running || !hasData}
        title={!hasData ? t('topbar.nothingToClear') : undefined}
      >
        <Eraser className="h-3.5 w-3.5" /> {t('topbar.clear')}
      </button>
      <button
        className="btn btn-ghost border border-surface-700 px-2 py-1.5"
        onClick={() => setSettingsOpen(true)}
        title={t('topbar.settings')}
        disabled={running}
      >
        <Settings className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
