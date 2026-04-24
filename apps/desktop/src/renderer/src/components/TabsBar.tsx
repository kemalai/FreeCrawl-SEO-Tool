import clsx from 'clsx';
import { TAB_ORDER, useAppStore } from '../store.js';

export function TabsBar() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <div className="flex items-center overflow-x-auto border-b border-surface-800 bg-surface-900/30">
      {TAB_ORDER.map((t) => (
        <button
          key={t.key}
          className={clsx(
            'whitespace-nowrap px-3 py-2 text-[11px] font-medium border-b-2 border-transparent transition text-surface-400 hover:text-surface-100',
            activeTab === t.key && 'border-accent-500 text-surface-50 bg-surface-900/60',
          )}
          onClick={() => setActiveTab(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
