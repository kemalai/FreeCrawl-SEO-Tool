import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  defaultGa4Settings,
  type GoogleAccount,
  type Ga4IntegrationSettings,
} from '@freecrawl/shared-types';

/**
 * Per-integration behaviour settings for Google Analytics 4, rendered
 * inside the GA4 card in Settings → Integrations. Smaller than the GSC
 * equivalent — the Data API call takes no dimension filters — but it
 * carries the same per-project account + date-range choice, so a project
 * remembers which of several linked GA4 accounts it reports on.
 */
export function Ga4SettingsSection() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Ga4IntegrationSettings | null>(null);
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [stored, list] = await Promise.all([
          window.freecrawl.integrationSettingsGet('ga4'),
          window.freecrawl.googleAccountsList('ga4'),
        ]);
        if (cancelled) return;
        setAccounts(list);
        setSettings({
          ...defaultGa4Settings(),
          ...(stored ?? {}),
        } as Ga4IntegrationSettings);
      } catch (e) {
        if (cancelled) return;
        // See GscSettingsSection — an unguarded rejection removed this
        // section from Settings entirely. Report it instead, and do not
        // substitute defaults for settings we could not read.
        setLoadError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <div className="text-[11px]">
        <div className="font-semibold text-rose-300">
          {t('common.loadFailedTitle', { defaultValue: "Couldn't load this view" })}
        </div>
        <div className="mt-0.5 break-words text-surface-500">{loadError}</div>
      </div>
    );
  }
  if (!settings) return null;

  const update = <K extends keyof Ga4IntegrationSettings>(
    key: K,
    value: Ga4IntegrationSettings[K],
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    void window.freecrawl.integrationSettingsSet('ga4', {
      [key]: value,
    } as Record<string, unknown>);
  };

  const selectCls =
    'h-6 rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none';

  return (
    <div className="mt-3 rounded border border-surface-800 bg-surface-950/60 p-2.5">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
        {t('ga4Settings.title', { defaultValue: 'Analytics 4 Settings' })}
      </div>

      {accounts.length > 1 && (
        <div className="mb-3">
          <div className="mb-1 text-[10px] font-medium text-surface-300">
            {t('ga4Settings.account', { defaultValue: 'Account' })}
          </div>
          <select
            className={`${selectCls} max-w-full`}
            value={settings.accountId || accounts[0]?.accountId || ''}
            onChange={(e) => update('accountId', e.target.value)}
            title={t('ga4Settings.accountHint', {
              defaultValue:
                'Which linked Google account this project pulls Analytics data with.',
            })}
          >
            {accounts.map((a) => (
              <option key={a.accountId} value={a.accountId}>
                {a.email ?? a.accountId}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <div className="mb-1 text-[10px] font-medium text-surface-300">
          {t('ga4Settings.dateRange', { defaultValue: 'Date Range' })}
        </div>
        <select
          className={selectCls}
          value={settings.days}
          onChange={(e) =>
            update('days', Number(e.target.value) as Ga4IntegrationSettings['days'])
          }
        >
          <option value={7}>
            {t('ga4Settings.range7', { defaultValue: 'Last 7 days' })}
          </option>
          <option value={28}>
            {t('ga4Settings.range28', { defaultValue: 'Last 28 days' })}
          </option>
          <option value={90}>
            {t('ga4Settings.range90', { defaultValue: 'Last 90 days' })}
          </option>
        </select>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-surface-500">
        {t('ga4Settings.hint', {
          defaultValue:
            'The property is picked in the GA4 tab toolbar. Analytics data is near-realtime, so the range ends today.',
        })}
      </p>
    </div>
  );
}
