import { useEffect, useMemo, useState } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { TopBar } from './components/TopBar.js';
import { StatsBar } from './components/StatsBar.js';
import { TabsBar } from './components/TabsBar.js';
import { OverviewSidebar } from './components/OverviewSidebar.js';
import { BottomDetailPanel } from './components/BottomDetailPanel.js';
import { RobotsTesterDialog } from './components/RobotsTesterDialog.js';
import { ReportsDialog } from './components/ReportsDialog.js';
import { SettingsDialog } from './components/SettingsDialog.js';
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
  const [robotsTesterOpen, setRobotsTesterOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

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
    const off1 = window.freecrawl.onProgress(setProgress);
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
        case 'open-robots-tester':
          setRobotsTesterOpen(true);
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
      <ReportsDialog open={reportsOpen} onClose={() => setReportsOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
