import { useAppStore } from '../store.js';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-surface-500">{label}</span>
      <span className="font-mono font-medium text-surface-100">{value}</span>
    </div>
  );
}

export function StatsBar() {
  const progress = useAppStore((s) => s.progress);
  const error = useAppStore((s) => s.error);
  const setError = useAppStore((s) => s.setError);

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
      <div className="ml-auto flex items-center gap-2">
        {progress?.running ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-emerald-400">Running</span>
          </span>
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
