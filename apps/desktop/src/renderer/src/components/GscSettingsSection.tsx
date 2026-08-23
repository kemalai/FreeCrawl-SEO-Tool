import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  defaultGscSettings,
  type GoogleAccount,
  type GscIntegrationSettings,
} from '@freecrawl/shared-types';

/**
 * Per-integration behaviour settings for Google Search Console — the
 * FreeCrawl equivalent of Screaming Frog's "API Access → Google Search
 * Console" dialog. Rendered inside the GSC card in Settings →
 * Integrations. Stored per project via `integrationSettingsSet('gsc')`;
 * the Search Console tab's Fetch button reads these to shape the pull.
 */
export function GscSettingsSection() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<GscIntegrationSettings | null>(null);
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [stored, list] = await Promise.all([
          window.freecrawl.integrationSettingsGet('gsc'),
          window.freecrawl.googleAccountsList('gsc'),
        ]);
        if (cancelled) return;
        setAccounts(list);
        setSettings({
          ...defaultGscSettings(),
          ...(stored ?? {}),
        } as GscIntegrationSettings);
      } catch (e) {
        if (cancelled) return;
        // `settings` is the sole gate on rendering, so a rejection made
        // this whole section vanish from Settings with no spinner and no
        // message. Deliberately do NOT fall back to defaults: rendering
        // blank fields over settings we failed to read invites the user
        // to save them away.
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

  const update = <K extends keyof GscIntegrationSettings>(
    key: K,
    value: GscIntegrationSettings[K],
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    void window.freecrawl.integrationSettingsSet('gsc', {
      [key]: value,
    } as Record<string, unknown>);
  };

  const selectCls =
    'h-6 rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none';
  const inputCls =
    'h-6 rounded border border-surface-700 bg-surface-950 px-2 text-[11px] text-surface-100 placeholder-surface-600 focus:border-blue-500 focus:outline-none';

  return (
    <div className="mt-3 rounded border border-surface-800 bg-surface-950/60 p-2.5">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
        {t('gscSettings.title', { defaultValue: 'Search Console Settings' })}
      </div>

      {/* ── Account ────────────────────────────────────────────── */}
      {accounts.length > 1 && (
        <div className="mb-3">
          <div className="mb-1 text-[10px] font-medium text-surface-300">
            {t('gscSettings.account', { defaultValue: 'Account' })}
          </div>
          <select
            className={`${selectCls} max-w-full`}
            value={settings.accountId || accounts[0]?.accountId || ''}
            onChange={(e) => update('accountId', e.target.value)}
            title={t('gscSettings.accountHint', {
              defaultValue:
                'Which linked Google account this project pulls Search Console data with.',
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

      {/* ── Date Range ─────────────────────────────────────────── */}
      <div className="mb-3">
        <div className="mb-1 text-[10px] font-medium text-surface-300">
          {t('gscSettings.dateRange', { defaultValue: 'Date Range' })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className={selectCls}
            value={settings.dateRange}
            onChange={(e) =>
              update(
                'dateRange',
                e.target.value as GscIntegrationSettings['dateRange'],
              )
            }
          >
            <option value="7d">
              {t('gscSettings.range7', { defaultValue: 'Last 7 days' })}
            </option>
            <option value="28d">
              {t('gscSettings.range28', { defaultValue: 'Last 28 days' })}
            </option>
            <option value="90d">
              {t('gscSettings.range90', { defaultValue: 'Last 90 days' })}
            </option>
            <option value="16m">
              {t('gscSettings.range16m', { defaultValue: 'Last 16 months' })}
            </option>
            <option value="custom">
              {t('gscSettings.rangeCustom', { defaultValue: 'Custom' })}
            </option>
          </select>
          {settings.dateRange === 'custom' && (
            <>
              <input
                type="date"
                className={inputCls}
                value={settings.startDate}
                onChange={(e) => update('startDate', e.target.value)}
                title={t('gscSettings.startDate', { defaultValue: 'Start date' })}
              />
              <span className="text-[11px] text-surface-500">→</span>
              <input
                type="date"
                className={inputCls}
                value={settings.endDate}
                onChange={(e) => update('endDate', e.target.value)}
                title={t('gscSettings.endDate', { defaultValue: 'End date' })}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Dimension Filter ───────────────────────────────────── */}
      <div className="mb-3">
        <div className="mb-1 text-[10px] font-medium text-surface-300">
          {t('gscSettings.dimensionFilter', { defaultValue: 'Dimension Filter' })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-surface-500">
              {t('gscSettings.device', { defaultValue: 'Device' })}
            </span>
            <select
              className={selectCls}
              value={settings.deviceFilter}
              onChange={(e) =>
                update(
                  'deviceFilter',
                  e.target.value as GscIntegrationSettings['deviceFilter'],
                )
              }
            >
              <option value="all">
                {t('gscSettings.deviceAll', { defaultValue: 'All' })}
              </option>
              <option value="DESKTOP">
                {t('gscSettings.deviceDesktop', { defaultValue: 'Desktop' })}
              </option>
              <option value="MOBILE">
                {t('gscSettings.deviceMobile', { defaultValue: 'Mobile' })}
              </option>
              <option value="TABLET">
                {t('gscSettings.deviceTablet', { defaultValue: 'Tablet' })}
              </option>
            </select>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-surface-500">
              {t('gscSettings.type', { defaultValue: 'Search Type' })}
            </span>
            <select
              className={selectCls}
              value={settings.searchType}
              onChange={(e) =>
                update(
                  'searchType',
                  e.target.value as GscIntegrationSettings['searchType'],
                )
              }
            >
              <option value="web">
                {t('gscSettings.typeWeb', { defaultValue: 'Web' })}
              </option>
              <option value="image">
                {t('gscSettings.typeImage', { defaultValue: 'Image' })}
              </option>
              <option value="video">
                {t('gscSettings.typeVideo', { defaultValue: 'Video' })}
              </option>
              <option value="news">
                {t('gscSettings.typeNews', { defaultValue: 'News' })}
              </option>
              <option value="discover">
                {t('gscSettings.typeDiscover', { defaultValue: 'Discover' })}
              </option>
              <option value="googleNews">
                {t('gscSettings.typeGoogleNews', { defaultValue: 'Google News' })}
              </option>
            </select>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-surface-500">
              {t('gscSettings.country', { defaultValue: 'Country' })}
            </span>
            <input
              type="text"
              className={inputCls}
              value={settings.countryFilter}
              placeholder={t('gscSettings.countryPlaceholder', {
                defaultValue: 'e.g. usa (ISO code) — blank for all',
              })}
              onChange={(e) =>
                update('countryFilter', e.target.value.trim().toLowerCase())
              }
              spellCheck={false}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-surface-500">
              {t('gscSettings.queryFilter', { defaultValue: 'Search Query' })}
            </span>
            <div className="flex gap-1">
              <select
                className={selectCls}
                value={settings.queryFilterMode}
                onChange={(e) =>
                  update(
                    'queryFilterMode',
                    e.target.value as GscIntegrationSettings['queryFilterMode'],
                  )
                }
              >
                <option value="none">
                  {t('gscSettings.queryNone', { defaultValue: 'None' })}
                </option>
                <option value="contains">
                  {t('gscSettings.queryContains', { defaultValue: 'Contains' })}
                </option>
                <option value="notContains">
                  {t('gscSettings.queryNotContains', {
                    defaultValue: "Doesn't contain",
                  })}
                </option>
                <option value="equals">
                  {t('gscSettings.queryEquals', { defaultValue: 'Equals' })}
                </option>
                <option value="notEquals">
                  {t('gscSettings.queryNotEquals', {
                    defaultValue: "Doesn't equal",
                  })}
                </option>
                <option value="includingRegex">
                  {t('gscSettings.queryRegex', { defaultValue: 'Matches regex' })}
                </option>
                <option value="excludingRegex">
                  {t('gscSettings.queryNotRegex', {
                    defaultValue: "Doesn't match regex",
                  })}
                </option>
              </select>
              <input
                type="text"
                className={`${inputCls} min-w-0 flex-1`}
                value={settings.queryFilterValue}
                disabled={settings.queryFilterMode === 'none'}
                placeholder={t('gscSettings.queryValuePlaceholder', {
                  defaultValue: 'Query…',
                })}
                onChange={(e) => update('queryFilterValue', e.target.value)}
                spellCheck={false}
              />
            </div>
          </label>
        </div>
      </div>

      {/* ── General ────────────────────────────────────────────── */}
      <div>
        <div className="mb-1 text-[10px] font-medium text-surface-300">
          {t('gscSettings.general', { defaultValue: 'General' })}
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[11px] text-surface-200">
            <input
              type="checkbox"
              className="accent-blue-500"
              checked={settings.matchSlash}
              onChange={(e) => update('matchSlash', e.target.checked)}
            />
            {t('gscSettings.matchSlash', {
              defaultValue: 'Match Trailing and Non-Trailing Slash URLs',
            })}
          </label>
          <label className="flex items-center gap-2 text-[11px] text-surface-200">
            <input
              type="checkbox"
              className="accent-blue-500"
              checked={settings.matchCase}
              onChange={(e) => update('matchCase', e.target.checked)}
            />
            {t('gscSettings.matchCase', {
              defaultValue: 'Match Uppercase & Lowercase URLs',
            })}
          </label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-[11px] text-surface-200">
              <input
                type="checkbox"
                className="accent-blue-500"
                checked={settings.limitMaxResults}
                onChange={(e) => update('limitMaxResults', e.target.checked)}
              />
              {t('gscSettings.limitMaxResults', {
                defaultValue: 'Limit Max Results',
              })}
            </label>
            <input
              type="number"
              min={1}
              step={1000}
              className={`${inputCls} w-24`}
              value={settings.maxResults}
              disabled={!settings.limitMaxResults}
              onChange={(e) =>
                update(
                  'maxResults',
                  Math.max(1, Math.floor(Number(e.target.value) || 0)),
                )
              }
            />
          </div>
          <label className="flex items-center gap-2 text-[11px] text-surface-200">
            <input
              type="checkbox"
              className="accent-blue-500"
              checked={settings.crawlNewUrls}
              onChange={(e) => update('crawlNewUrls', e.target.checked)}
            />
            {t('gscSettings.crawlNewUrls', {
              defaultValue: 'Crawl New URLs Discovered In Google Search Console',
            })}
          </label>
          <p className="pl-6 text-[10px] leading-relaxed text-surface-500">
            {t('gscSettings.crawlNewUrlsHint', {
              defaultValue:
                'After each Search Console pull, URLs that appear in GSC but were not found by the crawl are added to the crawl queue.',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
