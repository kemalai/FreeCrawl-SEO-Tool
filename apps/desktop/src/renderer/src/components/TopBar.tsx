import { useState } from 'react';
import { Play, Square, Pause, Eraser, ChevronDown, Settings } from 'lucide-react';
import clsx from 'clsx';
import type { CrawlScope } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';
import { clearCrawlWithConfirm } from '../utils/clearCrawl.js';
import { SettingsDialog } from './SettingsDialog.js';

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
  const [scopeOpen, setScopeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const running = progress?.running === true;
  const paused = progress?.paused === true;
  // Clear only makes sense when there's something to wipe — disable it
  // when the crawl table is empty so it can't be clicked accidentally.
  const hasData = (progress?.discovered ?? 0) > 0 || (progress?.crawled ?? 0) > 0;
  const activeScope = SCOPE_OPTIONS.find((o) => o.value === config.scope)!;

  async function start() {
    if (!config.startUrl.trim()) {
      setError('Please enter a starting URL.');
      return;
    }
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

  return (
    <div className="flex items-center gap-2 border-b border-surface-800 bg-surface-900 px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-surface-400">
        FreeCrawl
      </div>
      <div className="mx-2 h-5 w-px bg-surface-800" />
      <input
        className="input flex-1"
        placeholder="https://example.com"
        value={config.startUrl}
        onChange={(e) => setConfig({ startUrl: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !running) void start();
        }}
        disabled={running}
        spellCheck={false}
      />

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
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
