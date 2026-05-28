import { useEffect } from 'react';
import { useAppStore } from './store.js';
import { VisualizationTab } from './tabs/VisualizationTab.js';
import { useTranslation } from 'react-i18next';

/**
 * Standalone Visualization window — mounted only when the renderer
 * boots with `?visualization=1` (i.e. via the native popup window
 * spawned from File menu → Visualization). The View renders the same
 * Cytoscape graph as the embedded tab used to, but in its own native
 * window with no main-app chrome (sidebar, top tabs, status bar).
 *
 * Wiring: subscribes to `dataChanged` so the graph refreshes when the
 * main process broadcasts a new crawl event. Drops the heavy main-App
 * IPC subscriptions (logs batch, progress, etc.) — the popup is
 * read-only and doesn't need them.
 */
export function VisualizationView() {
  const { t } = useTranslation();
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);

  useEffect(() => {
    const offData = window.freecrawl.onDataChanged(() => bumpDataVersion());
    return () => {
      offData();
    };
  }, [bumpDataVersion]);

  return (
    <div className="flex h-screen w-screen flex-col bg-surface-950 text-surface-100">
      <div className="flex shrink-0 items-center gap-2 border-b border-surface-800 bg-surface-900 px-3 py-1.5 text-[12px]">
        <span className="font-semibold tracking-wide text-surface-200">
          {t('visualization.windowTitle', { defaultValue: 'Crawl Visualization' })}
        </span>
        <span className="text-surface-500">·</span>
        <span className="text-surface-500">
          {t('visualization.windowHint', {
            defaultValue: 'Standalone window — close to detach from the main app',
          })}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <VisualizationTab />
      </div>
    </div>
  );
}
