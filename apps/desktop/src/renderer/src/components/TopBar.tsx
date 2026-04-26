import { useState } from 'react';
import { Play, Square, Pause, Eraser, ChevronDown, Settings, History, Plus } from 'lucide-react';
import clsx from 'clsx';
import type { CrawlScope } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';
import { clearCrawlWithConfirm } from '../utils/clearCrawl.js';

const SCOPE_OPTIONS: { value: CrawlScope; label: string; hint: string }[] = [
  { value: 'subdomain', label: 'Subdomain', hint: 'Same subdomain only' },
  { value: 'subfolder', label: 'Subfolder', hint: 'Only under the start URL path' },
  { value: 'all-subdomains', label: 'All Subdomains', hint: '*.example.com' },
  { value: 'exact-url', label: 'Exact URL', hint: 'Single URL, no link following' },
];

export function TopBar() {
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);
  const progress = useAppStore((s) => s.progress);
  const setProgress = useAppStore((s) => s.setProgress);
  const reset = useAppStore((s) => s.reset);
  const setError = useAppStore((s) => s.setError);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const recentUrls = useAppStore((s) => s.recentUrls);
  const addRecentUrl = useAppStore((s) => s.addRecentUrl);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);

  const running = progress?.running === true;
  const paused = progress?.paused === true;
  // Clear only makes sense when there's something to wipe — disable it
  // when the crawl table is empty so it can't be clicked accidentally.
  const hasData = (progress?.discovered ?? 0) > 0 || (progress?.crawled ?? 0) > 0;
  const activeScope = SCOPE_OPTIONS.find((o) => o.value === config.scope)!;

  async function start() {
    const trimmed = config.startUrl.trim();
    if (!trimmed) {
      setError('Please enter a starting URL.');
      return;
    }
    addRecentUrl(trimmed);
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
    const raw = window.prompt('Add URL to queue:', '');
    if (!raw) return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    const r = await window.freecrawl.crawlAddUrl(trimmed);
    if (!r.accepted) {
      setError('URL not accepted (invalid format, already crawled at full depth, or queue full).');
    }
  }

  return (
    <div className="flex items-center gap-2 border-b border-surface-800 bg-surface-900 px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-surface-400">
        FreeCrawl
      </div>
      <div className="mx-2 h-5 w-px bg-surface-800" />
      <div className="relative flex-1">
        <input
          className="input w-full"
          placeholder="https://example.com"
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
                Recent URLs
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

      <div className="relative">
        <button
          className="btn btn-ghost border border-surface-700 px-2 py-1.5"
          onClick={() => setScopeOpen((v) => !v)}
          disabled={running}
        >
          {activeScope.label}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {scopeOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setScopeOpen(false)} />
            <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded border border-surface-700 bg-surface-900 shadow-xl">
              {SCOPE_OPTIONS.map((opt) => (
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
              title="Resume crawl"
            >
              <Play className="h-3.5 w-3.5" /> Resume
            </button>
          ) : (
            <button
              className="btn btn-ghost border border-surface-700"
              onClick={pauseCrawl}
              title="Pause crawl (in-flight requests will finish)"
            >
              <Pause className="h-3.5 w-3.5" /> Pause
            </button>
          )}
          <button className="btn btn-ghost border border-red-700/50 text-red-300" onClick={stop}>
            <Square className="h-3.5 w-3.5" /> Stop
          </button>
          <button
            className="btn btn-ghost border border-surface-700"
            onClick={addManualUrl}
            title="Inject a URL into the running queue"
          >
            <Plus className="h-3.5 w-3.5" /> Add URL
          </button>
        </>
      ) : (
        <button className="btn btn-primary" onClick={start}>
          <Play className="h-3.5 w-3.5" /> Start
        </button>
      )}
      <button
        className="btn btn-ghost border border-surface-700"
        onClick={clearCrawl}
        disabled={running || !hasData}
        title={!hasData ? 'Nothing to clear' : undefined}
      >
        <Eraser className="h-3.5 w-3.5" /> Clear
      </button>
      <button
        className="btn btn-ghost border border-surface-700 px-2 py-1.5"
        onClick={() => setSettingsOpen(true)}
        title="Settings"
        disabled={running}
      >
        <Settings className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
