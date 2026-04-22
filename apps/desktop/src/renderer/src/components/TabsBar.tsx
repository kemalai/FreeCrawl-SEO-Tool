import clsx from 'clsx';
import { useAppStore, type TabKey } from '../store.js';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'internal', label: 'Internal URLs' },
  { key: 'external', label: 'External URLs' },
  { key: 'issues', label: 'Issues' },
];

export function TabsBar() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <div className="flex items-center gap-0 border-b border-surface-800 bg-surface-900/30 px-2">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={clsx('tab', activeTab === t.key && 'tab-active')}
          onClick={() => setActiveTab(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
