import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { TAB_ORDER, useAppStore, type TabKey } from '../store.js';

/** Convert dashed TabKey ('response-codes') to the camelCase key used in
 *  the locale JSON ('responseCodes'). Lets the JSON keep flat, dot-safe
 *  paths under the `tabs` namespace. */
function tabI18nKey(key: TabKey): string {
  return key.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
}

export function TabsBar() {
  const { t } = useTranslation();
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <div className="flex items-center overflow-x-auto border-b border-surface-800 bg-surface-900/30">
      {TAB_ORDER.map((tab) => (
        <button
          key={tab.key}
          className={clsx(
            'whitespace-nowrap px-3 py-2 text-[11px] font-medium border-b-2 border-transparent transition text-surface-400 hover:text-surface-100',
            activeTab === tab.key && 'border-accent-500 text-surface-50 bg-surface-900/60',
          )}
          onClick={() => setActiveTab(tab.key)}
        >
          {t(`tabs.${tabI18nKey(tab.key)}`, { defaultValue: tab.label })}
        </button>
      ))}
    </div>
  );
}
