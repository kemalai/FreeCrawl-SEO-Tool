import { useState } from 'react';
import { Play, Square, Download } from 'lucide-react';
import { useAppStore } from '../store.js';

export function TopBar() {
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);
  const progress = useAppStore((s) => s.progress);
  const reset = useAppStore((s) => s.reset);
  const setError = useAppStore((s) => s.setError);
  const [exporting, setExporting] = useState(false);

  const running = progress?.running === true;

  async function start() {
    if (!config.startUrl.trim()) {
      setError('Başlangıç URL girmelisin.');
      return;
    }
    reset();
    try {
      await window.freecrawl.crawlStart(config);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function stop() {
    await window.freecrawl.crawlStop();
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const res = await window.freecrawl.exportCsv({ filePath: '' });
      if (res.filePath) {
        console.log(`Exported ${res.rowsWritten} rows to ${res.filePath}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
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
        disabled={running}
        spellCheck={false}
      />
      <div className="flex items-center gap-1 text-xs text-surface-400">
        <label>Depth</label>
        <input
          type="number"
          className="input w-16"
          value={config.maxDepth}
          min={0}
          max={50}
          onChange={(e) =>
            setConfig({ maxDepth: Math.max(0, Number.parseInt(e.target.value, 10) || 0) })
          }
          disabled={running}
        />
        <label>URLs</label>
        <input
          type="number"
          className="input w-24"
          value={config.maxUrls}
          min={1}
          onChange={(e) =>
            setConfig({ maxUrls: Math.max(1, Number.parseInt(e.target.value, 10) || 1) })
          }
          disabled={running}
        />
        <label>Conc.</label>
        <input
          type="number"
          className="input w-14"
          value={config.maxConcurrency}
          min={1}
          max={50}
          onChange={(e) =>
            setConfig({
              maxConcurrency: Math.max(
                1,
                Math.min(50, Number.parseInt(e.target.value, 10) || 1),
              ),
            })
          }
          disabled={running}
        />
      </div>
      {running ? (
        <button className="btn btn-ghost" onClick={stop}>
          <Square className="h-3.5 w-3.5" /> Stop
        </button>
      ) : (
        <button className="btn btn-primary" onClick={start}>
          <Play className="h-3.5 w-3.5" /> Start
        </button>
      )}
      <button className="btn btn-ghost" onClick={exportCsv} disabled={exporting}>
        <Download className="h-3.5 w-3.5" /> {exporting ? 'Exporting…' : 'Export CSV'}
      </button>
    </div>
  );
}
