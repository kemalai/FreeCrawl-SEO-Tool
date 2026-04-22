import { useEffect } from 'react';
import { TopBar } from './components/TopBar.js';
import { StatsBar } from './components/StatsBar.js';
import { TabsBar } from './components/TabsBar.js';
import { OverviewTab } from './tabs/OverviewTab.js';
import { UrlsTab } from './tabs/UrlsTab.js';
import { useAppStore } from './store.js';

export function App() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setProgress = useAppStore((s) => s.setProgress);
  const setSummary = useAppStore((s) => s.setSummary);
  const setError = useAppStore((s) => s.setError);

  useEffect(() => {
    const off1 = window.freecrawl.onProgress(setProgress);
    const off2 = window.freecrawl.onDone((s) => {
      setSummary(s);
    });
    const off3 = window.freecrawl.onError(setError);
    return () => {
      off1();
      off2();
      off3();
    };
  }, [setProgress, setSummary, setError]);

  return (
    <div className="flex h-full flex-col bg-surface-950 text-surface-100">
      <TopBar />
      <StatsBar />
      <TabsBar />
      <main className="flex-1 overflow-hidden">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'internal' && <UrlsTab filter="internal" />}
        {activeTab === 'external' && <UrlsTab filter="external" />}
        {activeTab === 'issues' && <UrlsTab filter="errors" />}
      </main>
    </div>
  );
}
