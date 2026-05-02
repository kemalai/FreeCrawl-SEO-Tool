import { useEffect, useMemo, useState } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { TopBar } from './components/TopBar.js';
import { StatsBar } from './components/StatsBar.js';
import { TabsBar } from './components/TabsBar.js';
import { OverviewSidebar } from './components/OverviewSidebar.js';
import { BottomDetailPanel } from './components/BottomDetailPanel.js';
import { RobotsTesterDialog } from './components/RobotsTesterDialog.js';
import { SitemapValidatorDialog } from './components/SitemapValidatorDialog.js';
import { ReportsDialog } from './components/ReportsDialog.js';
import { SettingsDialog } from './components/SettingsDialog.js';
import { CompareDialog } from './components/CompareDialog.js';
import { VisualizationDialog } from './components/VisualizationDialog.js';
import { UrlsTab } from './tabs/UrlsTab.js';
import { ImagesTab } from './tabs/ImagesTab.js';
import { BrokenLinksTab } from './tabs/BrokenLinksTab.js';
import { useAppStore } from './store.js';
import type { MenuEvent } from '@freecrawl/shared-types';
import { clearCrawlWithConfirm } from './utils/clearCrawl.js';

export function App() {
  const activeTab = useAppStore((s) => s.activeTab);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const detailPanelOpen = useAppStore((s) => s.detailPanelOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const toggleDetailPanel = useAppStore((s) => s.toggleDetailPanel);
  const setProgress = useAppStore((s) => s.setProgress);
  const setSummary = useAppStore((s) => s.setSummary);
  const setError = useAppStore((s) => s.setError);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const reset = useAppStore((s) => s.reset);
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const setConfig = useAppStore((s) => s.setConfig);
  const [robotsTesterOpen, setRobotsTesterOpen] = useState(false);
  const [sitemapValidatorOpen, setSitemapValidatorOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [visualizationOpen, setVisualizationOpen] = useState(false);
  const [dropFlash, setDropFlash] = useState<string | null>(null);

  // Drag & drop URL list — drop a `.txt` / `.csv` of URLs anywhere on the
  // window to populate List mode + open Settings so the user can review
  // before clicking Start. Lines starting with `#` are treated as comments
  // (matches the CLI `--list` parser semantics) and blank lines skipped.
  useEffect(() => {
    function onDragOver(e: DragEvent): void {
      // Cancel default so the drop event fires (browser otherwise opens the
      // file in-place, navigating away from the app).
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
      }
    }
    async function onDrop(e: DragEvent): Promise<void> {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file) return;
      const name = file.name.toLowerCase();
      // Wave 5 — `.seoproject` drop opens the project. Electron exposes
      // `file.path` (not part of the standard File API) when files come
      // from the OS file system; we route to `projectOpen` which swaps
      // the active DB and refreshes the UI.
      if (name.endsWith('.seoproject')) {
        e.preventDefault();
        const fileWithPath = file as File & { path?: string };
        const filePath = fileWithPath.path;
        if (!filePath) {
          setDropFlash(
            `Couldn't read the dropped path for ${file.name}. Use File → Open Project instead.`,
          );
          setTimeout(() => setDropFlash(null), 4000);
          return;
        }
        const result = await window.freecrawl.projectOpen(filePath);
        if (result) {
          setDropFlash(`Opened project: ${result.filePath}`);
        } else {
          setDropFlash(`Failed to open project: ${file.name}`);
        }
        setTimeout(() => setDropFlash(null), 4000);
        return;
      }
      if (!/\.(txt|csv|list)$/.test(name)) return;
      e.preventDefault();
      const text = await file.text();
      const urls: string[] = [];
      for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line) continue;
        if (line.startsWith('#')) continue;
        // CSV first column — stop at the first comma so a `url,note` file
        // is also accepted.
        const u = line.split(',')[0]?.trim();
        if (u && /^https?:\/\//i.test(u)) urls.push(u);
        else if (u) urls.push('https://' + u);
      }
      if (urls.length === 0) {
        setDropFlash(`No URLs found in ${file.name}.`);
        setTimeout(() => setDropFlash(null), 4000);
        return;
      }
      setConfig({ mode: 'list', urlList: urls, startUrl: urls[0] ?? '' });
      setSettingsOpen(true);
      setDropFlash(`Loaded ${urls.length} URLs from ${file.name} into List mode.`);
      setTimeout(() => setDropFlash(null), 4000);
    }
    const dropHandler = (e: DragEvent): void => {
      void onDrop(e);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', dropHandler);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', dropHandler);
    };
  }, [setConfig, setSettingsOpen]);

  // Redirect react-resizable-panels' persistence away from localStorage and
  // into our JSON prefs file so layout survives Clear (which wipes crawl
  // data) but stays out of the browser's localStorage.
  const panelStorage = useMemo(
    () => ({
      getItem(name: string): string | null {
        const v = window.freecrawl.prefsGet('panels:' + name);
        return typeof v === 'string' ? v : null;
      },
      setItem(name: string, value: string): void {
        window.freecrawl.prefsSet('panels:' + name, value);
      },
    }),
    [],
  );

  useEffect(() => {
    // Wave 6 — Crash-recovery prompt. Fires once on mount; if the
    // previous session left a non-empty checkpoint we ask whether to
    // resume. Discarding wipes the snapshot so the prompt doesn't
    // recur on next launch.
    void window.freecrawl.crashRecoveryStatus().then((status) => {
      if (status.pendingCount === 0) return;
      const proceed = window.confirm(
        `FreeCrawl detected a previous crawl that didn't finish cleanly:\n\n` +
          `  Start URL: ${status.seedUrl}\n` +
          `  Pending URLs: ${status.pendingCount.toLocaleString()}\n\n` +
          `Resume the crawl from where it stopped?\n\n` +
          `Click OK to resume, Cancel to discard the recovery state and start fresh.`,
      );
      if (proceed) {
        void window.freecrawl.crashRecoveryResume();
      } else {
        void window.freecrawl.crashRecoveryDiscard();
      }
    });

    // rAF-throttled progress dispatch. The crawler emits up to 5
    // progress events/sec and each one triggers a Zustand store
    // update — TopBar, StatsBar and App.tsx all subscribe to the
    // `progress` object reference, so every event fans out to a full
    // React reconciliation. Coalescing into one update per animation
    // frame caps the React work at 60 Hz worst-case (and at 5 Hz in
    // the common case where the crawler's throttle dominates), so a
    // user click never queues behind a stack of pending re-renders.
    let pendingProgress: import('@freecrawl/shared-types').CrawlProgress | null = null;
    let progressRafScheduled = false;
    const off1 = window.freecrawl.onProgress((p) => {
      pendingProgress = p;
      if (progressRafScheduled) return;
      progressRafScheduled = true;
      requestAnimationFrame(() => {
        progressRafScheduled = false;
        if (pendingProgress) {
          setProgress(pendingProgress);
          pendingProgress = null;
        }
      });
    });
    const off2 = window.freecrawl.onDone((s) => setSummary(s));
    const off3 = window.freecrawl.onError(setError);
    const offData = window.freecrawl.onDataChanged(() => bumpDataVersion());
    const off4 = window.freecrawl.onMenuEvent((event: MenuEvent) => {
      switch (event) {
        case 'toggle-sidebar':
          toggleSidebar();
          break;
        case 'toggle-detail-panel':
          toggleDetailPanel();
          break;
        case 'clear-crawl':
        case 'new-project':
          void clearCrawlWithConfirm().then((didClear) => {
            if (didClear) reset();
          });
          break;
        case 'export-csv':
          void window.freecrawl.exportCsv({ filePath: '' });
          break;
        case 'export-json':
          void window.freecrawl.exportJson({ filePath: '', pretty: true });
          break;
        case 'export-xml':
          void window.freecrawl.exportXml({ filePath: '' });
          break;
        case 'delete-domain-data': {
          const domain = window.prompt(
            'GDPR Domain Wipe — enter the host to delete (case-insensitive, exact match).\n\nExamples: example.com  ·  blog.example.com\n\nThis cannot be undone. Save Project As… first to keep a backup.',
            '',
          );
          if (!domain || !domain.trim()) break;
          const target = domain.trim();
          if (
            !window.confirm(
              `Delete every URL hosted on "${target}", along with its links, headers, images, and source snapshots?\n\nThis action cannot be undone.`,
            )
          ) {
            break;
          }
          void window.freecrawl.dataDeleteByDomain({ domain: target }).then((res) => {
            window.alert(
              `Deleted ${res.urlsDeleted.toLocaleString()} URL row${
                res.urlsDeleted === 1 ? '' : 's'
              } from ${target} (and ${res.linksDeleted.toLocaleString()} associated link${
                res.linksDeleted === 1 ? '' : 's'
              }).`,
            );
          });
          break;
        }
        case 'clear-all-data': {
          if (
            !window.confirm(
              'Clear ALL data in the active project?\n\nEvery URL, link, image, header, source snapshot, sitemap, and issue will be wiped. This cannot be undone — Save Project As… first if you want a backup.',
            )
          ) {
            break;
          }
          void window.freecrawl.crawlClear();
          break;
        }
        case 'open-robots-tester':
          setRobotsTesterOpen(true);
          break;
        case 'open-sitemap-validator':
          setSitemapValidatorOpen(true);
          break;
        case 'export-bulk':
          void window.freecrawl.exportBulk();
          break;
        case 'open-reports':
          setReportsOpen(true);
          break;
        case 'open-settings':
          setSettingsOpen(true);
          break;
        case 'generate-sitemap':
          void window.freecrawl.sitemapGenerate({ filePath: '' });
          break;
        case 'export-html-report':
          void window.freecrawl.exportHtmlReport({ filePath: '' });
          break;
        case 'compare-with-project':
          setCompareOpen(true);
          break;
        case 'save-project-as':
          void window.freecrawl.projectSaveAs();
          break;
        case 'open-visualization':
          setVisualizationOpen(true);
          break;
      }
    });
    return () => {
      off1();
      off2();
      off3();
      off4();
      offData();
    };
  }, [
    setProgress,
    setSummary,
    setError,
    toggleSidebar,
    toggleDetailPanel,
    reset,
    bumpDataVersion,
    setSettingsOpen,
  ]);

  return (
    <div className="flex h-full flex-col bg-surface-950 text-surface-100">
      <TopBar />
      {dropFlash && (
        <div className="border-b border-blue-700/50 bg-blue-900/30 px-4 py-1 text-[11px] text-blue-100">
          {dropFlash}
        </div>
      )}
      <TabsBar />
      <main className="relative flex-1 overflow-hidden">
        <PanelGroup
          direction="horizontal"
          autoSaveId="freecrawl:main-horizontal"
          storage={panelStorage}
          className="h-full w-full"
        >
          <Panel defaultSize={72} minSize={35} order={1} id="main-area">
            <PanelGroup
              direction="vertical"
              autoSaveId="freecrawl:main-vertical"
              storage={panelStorage}
              className="h-full w-full"
            >
              <Panel defaultSize={60} minSize={20} order={1} id="urls-area">
                {activeTab === 'images' ? (
                  <ImagesTab />
                ) : activeTab === 'broken-links' ? (
                  <BrokenLinksTab />
                ) : (
                  <UrlsTab />
                )}
              </Panel>
              {detailPanelOpen && (
                <>
                  <PanelResizeHandle className="group relative h-1.5 bg-surface-800 transition-colors hover:bg-accent-500/60 data-[resize-handle-state=drag]:bg-accent-500">
                    <div className="absolute inset-x-0 -top-1 -bottom-1" />
                  </PanelResizeHandle>
                  <Panel defaultSize={40} minSize={15} maxSize={75} order={2} id="detail-area">
                    <BottomDetailPanel />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
          {sidebarOpen && (
            <>
              <PanelResizeHandle className="group relative w-1.5 bg-surface-800 transition-colors hover:bg-accent-500/60 data-[resize-handle-state=drag]:bg-accent-500">
                <div className="absolute inset-y-0 -left-1 -right-1" />
              </PanelResizeHandle>
              <Panel defaultSize={28} minSize={16} maxSize={45} order={2} id="sidebar-area">
                <OverviewSidebar />
              </Panel>
            </>
          )}
        </PanelGroup>
      </main>
      <StatsBar />
      <RobotsTesterDialog
        open={robotsTesterOpen}
        onClose={() => setRobotsTesterOpen(false)}
      />
      <SitemapValidatorDialog
        open={sitemapValidatorOpen}
        onClose={() => setSitemapValidatorOpen(false)}
      />
      <ReportsDialog open={reportsOpen} onClose={() => setReportsOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CompareDialog open={compareOpen} onClose={() => setCompareOpen(false)} />
      <VisualizationDialog
        open={visualizationOpen}
        onClose={() => setVisualizationOpen(false)}
      />
    </div>
  );
}
