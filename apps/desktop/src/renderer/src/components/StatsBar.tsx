import clsx from 'clsx';
import { useAppStore } from '../store.js';
import { usePerfMeter } from '../hooks/usePerfMeter.js';

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
  const progress = useAppStore((s) => s.progress);
  const error = useAppStore((s) => s.error);
  const setError = useAppStore((s) => s.setError);
  const perf = usePerfMeter();

  const elapsed = progress?.elapsedMs ?? 0;
  const elapsedStr = formatElapsed(elapsed);

  return (
    <div className="flex shrink-0 items-center gap-5 border-t border-surface-800 bg-surface-900/50 px-3 py-1.5 text-[11px]">
      <Stat label="Discovered" value={progress?.discovered ?? 0} />
      <Stat label="Crawled" value={progress?.crawled ?? 0} />
      <Stat label="Pending" value={progress?.pending ?? 0} />
      <Stat label="Failed" value={progress?.failed ?? 0} />
      <Stat label="URL/s" value={progress?.urlsPerSecond?.toFixed(1) ?? '0.0'} />
      <Stat label="Avg resp" value={`${progress?.avgResponseTimeMs ?? 0}ms`} />
      <Stat label="Elapsed" value={elapsedStr} />
      <Stat
        label="FPS"
        value={perf.fps}
        valueClassName={fpsClass(perf.fps)}
        title={
          perf.fps >= 50
            ? 'Renderer is smooth (≥ 50 fps)'
            : perf.fps >= 30
              ? 'Renderer is degraded (30–49 fps) — likely competing with crawl IPC'
              : 'Renderer is stalled (< 30 fps) — main thread starved; pause crawl or close Logs window'
        }
      />
      {perf.heapMb !== null && (
        <Stat
          label="Heap"
          value={`${perf.heapMb} MB`}
          valueClassName={heapClass(perf.heapMb)}
          title="Renderer JS heap. >500 MB = warm, >1 GB = likely a listener / cache leak"
        />
      )}
      <Stat
        label="Lag"
        value={`${perf.inputLagMs}ms`}
        valueClassName={lagClass(perf.inputLagMs)}
        title={
          perf.inputLagMs < 16
            ? 'Main thread is responsive — input feels instant'
            : perf.inputLagMs < 50
              ? 'Main thread is contended — light click stutter'
              : 'Main thread is busy — IPC backed up; most likely sidebar SQL or table chunk fetch competing with the crawler'
        }
      />

      <div className="ml-auto flex items-center gap-2">
        {progress?.running ? (
          progress.paused ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-amber-400">Paused</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-emerald-400">Running</span>
            </span>
          )
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-surface-600" />
            <span className="text-surface-500">Idle</span>
          </span>
        )}
        {error && (
          <button
            className="rounded bg-red-900/50 px-2 py-0.5 text-red-200 hover:bg-red-900/70"
            onClick={() => setError(null)}
            title={error}
          >
            ⚠ {error.length > 60 ? error.slice(0, 60) + '…' : error} (dismiss)
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
