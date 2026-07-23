import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store.js';
import { usePerfMeter } from '../hooks/usePerfMeter.js';
import { useMemoryMonitor } from '../hooks/useMemoryMonitor.js';
import { useBrowserInstall } from '../hooks/useBrowserInstall.js';

function Stat({
  label,
  value,
  valueClassName,
  title,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
  title?: string;
}) {
  return (
    <div className="flex items-center gap-1.5" title={title}>
      <span className="text-surface-500">{label}</span>
      <span
        className={clsx(
          'font-mono font-medium',
          valueClassName ?? 'text-surface-100',
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Map FPS to a Tailwind text colour so the user can spot kasma at a glance. */
function fpsClass(fps: number): string {
  if (fps >= 50) return 'text-emerald-300';
  if (fps >= 30) return 'text-amber-300';
  return 'text-red-300';
}

/** Same idea for renderer heap — the Electron renderer is comfortable
 * up to ~500 MB; over 1 GB is almost always a listener / cache leak. */
function heapClass(heapMb: number | null): string {
  if (heapMb === null) return 'text-surface-100';
  if (heapMb >= 1024) return 'text-red-300';
  if (heapMb >= 500) return 'text-amber-300';
  return 'text-surface-100';
}

/** Format bytes for the status bar. Uses MB / GB depending on
 * magnitude — RSS routinely sits at 250-1500 MB on a busy crawl, so
 * we render in MB until the value crosses 1 GB to keep the column
 * width stable. */
function formatBytes(b: number): string {
  if (b >= 1024 * 1024 * 1024) return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (b >= 1024 * 1024) return `${Math.round(b / (1024 * 1024))} MB`;
  if (b >= 1024) return `${Math.round(b / 1024)} KB`;
  return `${b} B`;
}

/** Compact integer (1.2K / 850K / 5.3M / 12.4B) — used for the
 *  "Capacity" projection so a 1 234 567 estimate doesn't blow out
 *  the StatsBar layout. */
function formatCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
}

/** RSS colour. Electron base + main + workers idle around 250-400 MB;
 *  during heavy crawls 800-1500 MB is normal; > 2 GB on a 4 GB box is
 *  a memory-leak red flag. We tier against the system total so a 32 GB
 *  workstation isn't flagged at 1.5 GB. */
function rssClass(rss: number, systemTotal: number): string {
  if (systemTotal === 0) return 'text-surface-100';
  const ratio = rss / systemTotal;
  if (ratio >= 0.5) return 'text-red-300';
  if (ratio >= 0.25) return 'text-amber-300';
  return 'text-surface-100';
}

/** System-free colour. Lower than 10% remaining = OS will start
 *  swapping; 10-25% = pause-soon territory; > 25% = fine. */
function systemFreeClass(freeBytes: number, totalBytes: number): string {
  if (totalBytes === 0) return 'text-surface-100';
  const ratio = freeBytes / totalBytes;
  if (ratio < 0.1) return 'text-red-300';
  if (ratio < 0.25) return 'text-amber-300';
  return 'text-emerald-300';
}

/** Input lag colour. The same numbers a user "feels":
 *   < 16 ms = one frame at 60 Hz (input feels instant)
 *   16–50 ms = a couple of frames late (subtle drag stutter)
 *   > 50 ms = clearly laggy clicks / drags
 */
function lagClass(lagMs: number): string {
  if (lagMs < 16) return 'text-emerald-300';
  if (lagMs < 50) return 'text-amber-300';
  return 'text-red-300';
}

export function StatsBar() {
  const { t } = useTranslation();
  const progress = useAppStore((s) => s.progress);
  const error = useAppStore((s) => s.error);
  const setError = useAppStore((s) => s.setError);
  const perf = usePerfMeter();
  const mem = useMemoryMonitor();
  const browser = useBrowserInstall();

  const elapsed = progress?.elapsedMs ?? 0;
  const elapsedStr = formatElapsed(elapsed);

  // Per-URL memory cost = RSS / urlsCrawled. Suppressed below 100 URLs
  // because the Electron base footprint dominates the calculation and
  // the projection becomes meaningless (e.g. one URL would imply a
  // 400 MB/page cost). Capacity = systemFree / perUrlCost — projects
  // how many MORE URLs the current process can fit in remaining
  // system memory at the observed cost.
  const perUrlCost =
    mem && mem.urlsCrawled >= 100 ? mem.rss / mem.urlsCrawled : null;
  const capacity =
    perUrlCost && perUrlCost > 0 ? mem!.systemFree / perUrlCost : null;

  return (
    <div className="flex shrink-0 items-center gap-5 border-t border-surface-800 bg-surface-900/50 px-3 py-1.5 text-[11px]">
      <Stat label={t('stats.discovered')} value={progress?.discovered ?? 0} />
      <Stat label={t('stats.crawled')} value={progress?.crawled ?? 0} />
      <Stat label={t('stats.pending')} value={progress?.pending ?? 0} />
      <Stat label={t('stats.failed')} value={progress?.failed ?? 0} />
      <Stat label={t('stats.urlPerSec')} value={progress?.urlsPerSecond?.toFixed(1) ?? '0.0'} />
      <Stat label={t('stats.avgResp')} value={`${progress?.avgResponseTimeMs ?? 0}ms`} />
      <Stat label={t('stats.elapsed')} value={elapsedStr} />
      <Stat
        label={t('stats.fps')}
        value={perf.fps}
        valueClassName={fpsClass(perf.fps)}
        title={
          perf.fps >= 50
            ? t('stats.fpsSmoothTitle', { defaultValue: 'Renderer is smooth (≥ 50 fps)' })
            : perf.fps >= 30
              ? t('stats.fpsDegradedTitle', {
                  defaultValue: 'Renderer is degraded (30–49 fps) — likely competing with crawl IPC',
                })
              : t('stats.fpsStalledTitle', {
                  defaultValue:
                    'Renderer is stalled (< 30 fps) — main thread starved; pause crawl or close Logs window',
                })
        }
      />
      {perf.heapMb !== null && (
        <Stat
          label={t('stats.heap')}
          value={`${perf.heapMb} MB`}
          valueClassName={heapClass(perf.heapMb)}
          title={t('stats.heapTitle', {
            defaultValue: 'Renderer JS heap. >500 MB = warm, >1 GB = likely a listener / cache leak',
          })}
        />
      )}
      {mem && (
        <>
          <Stat
            label={t('stats.rss')}
            value={formatBytes(mem.rss)}
            valueClassName={rssClass(mem.rss, mem.systemTotal)}
            title={t('stats.rssTitle', {
              defaultValue:
                'Main-process resident set size (Electron + workers). System total: {{total}}.',
              total: formatBytes(mem.systemTotal),
            })}
          />
          <Stat
            label={t('stats.sysFree')}
            value={formatBytes(mem.systemFree)}
            valueClassName={systemFreeClass(mem.systemFree, mem.systemTotal)}
            title={t('stats.sysFreeTitle', {
              defaultValue:
                'OS-reported free memory. < 10% of system total triggers swap; pause the crawl before that. System total: {{total}}.',
              total: formatBytes(mem.systemTotal),
            })}
          />
          {perUrlCost !== null && (
            <Stat
              label={t('stats.perUrl')}
              value={formatBytes(perUrlCost)}
              title={t('stats.perUrlTitle', {
                defaultValue:
                  'Average bytes of RSS per crawled URL ({{urls}} URLs). Includes Electron overhead, so the marginal cost on real-world large crawls is typically lower.',
                urls: mem.urlsCrawled.toLocaleString(),
              })}
            />
          )}
          {capacity !== null && (
            <Stat
              label={t('stats.capacity')}
              value={formatCount(capacity)}
              title={t('stats.capacityTitle', {
                defaultValue:
                  'Estimated additional URLs that fit in remaining system memory at the current per-URL cost. Calc: systemFree / perUrlCost. Treat as an upper bound — sustained throughput is usually CPU-bound first.',
              })}
            />
          )}
        </>
      )}
      <Stat
        label={t('stats.lag')}
        value={`${perf.inputLagMs}ms`}
        valueClassName={lagClass(perf.inputLagMs)}
        title={
          perf.inputLagMs < 16
            ? t('stats.lagResponsiveTitle', {
                defaultValue: 'Main thread is responsive — input feels instant',
              })
            : perf.inputLagMs < 50
              ? t('stats.lagContendedTitle', {
                  defaultValue: 'Main thread is contended — light click stutter',
                })
              : t('stats.lagBusyTitle', {
                  defaultValue:
                    'Main thread is busy — IPC backed up; most likely sidebar SQL or table chunk fetch competing with the crawler',
                })
        }
      />

      <div className="ml-auto flex items-center gap-2">
        {/* JS-rendering browser provisioning. Silent when everything is
            already in place — only surfaces while downloading or after a
            failure, where it doubles as the retry button. */}
        {browser.state.state === 'downloading' && (
          <span
            className="inline-flex items-center gap-1.5 text-sky-300"
            title={t('browserInstall.downloadingTitle', {
              defaultValue:
                'Downloading the Chromium browser used for JavaScript rendering. Crawling in text mode is unaffected.',
            })}
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />
            <span>
              {t('browserInstall.downloading', { defaultValue: 'Browser' })}{' '}
              {browser.state.percent !== null ? `${browser.state.percent}%` : '…'}
            </span>
          </span>
        )}
        {browser.state.state === 'failed' && (
          <button
            className="rounded bg-amber-900/50 px-2 py-0.5 text-amber-200 hover:bg-amber-900/70"
            onClick={browser.retry}
            title={browser.state.error}
          >
            {t('browserInstall.failed', {
              defaultValue: 'Browser download failed — retry',
            })}
          </button>
        )}
        {progress?.running ? (
          progress.paused ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-amber-400">{t('stats.paused')}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-emerald-400">{t('stats.running')}</span>
            </span>
          )
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-surface-600" />
            <span className="text-surface-500">{t('stats.idle')}</span>
          </span>
        )}
        {error && (
          <button
            className="rounded bg-red-900/50 px-2 py-0.5 text-red-200 hover:bg-red-900/70"
            onClick={() => setError(null)}
            title={error}
          >
            ⚠ {error.length > 60 ? error.slice(0, 60) + '…' : error} ({t('stats.dismiss')})
          </button>
        )}
      </div>
    </div>
  );
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
}
