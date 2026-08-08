import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import { Loader2, Search, RefreshCw } from 'lucide-react';
import {
  defaultGa4Settings,
  type Ga4FetchMeta,
  type Ga4Property,
  type Ga4Row,
  type GoogleAccount,
  type GoogleAuthState,
} from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

const TOOLBAR_HEIGHT = 36;
const HEADER_HEIGHT = 26;
const STATUS_BAR_HEIGHT = 22;
const ROW_HEIGHT = 30;
const PAGE_SIZE = 2000;
const POLL_MS_RUNNING = 5000;

type FilterMode = 'all' | 'with-data' | 'without-data';
type RangeDays = 7 | 28 | 90;
type Stage = 'loading' | 'unconfigured' | 'disconnected' | 'ready';

/** Engagement-rate bands → cell colour. Higher is better. */
function engagementClass(v: number): string {
  if (v <= 0) return 'text-surface-600';
  if (v >= 0.6) return 'text-emerald-400';
  if (v >= 0.3) return 'text-amber-400';
  return 'text-red-400';
}

function fmtDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '—';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

function relativeTime(iso: string): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const min = Math.floor((Date.now() - then) / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function AnalyticsTab() {
  const { t } = useTranslation();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const crawlProgress = useAppStore((s) => s.progress);

  const [stage, setStage] = useState<Stage>('loading');
  const [authState, setAuthState] = useState<GoogleAuthState | null>(null);
  const [properties, setProperties] = useState<Ga4Property[]>([]);
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [accountId, setAccountId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [days, setDays] = useState<RangeDays>(28);
  const [rows, setRows] = useState<Ga4Row[]>([]);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<Ga4FetchMeta | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [connecting, setConnecting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadProperties = useCallback(async (account?: string) => {
    const res = await window.freecrawl.ga4ListProperties(account);
    if (!res.ok) {
      setError(res.error);
      setProperties([]);
      return;
    }
    setError(null);
    setProperties(res.properties);
    setPropertyId((prev) =>
      // Keep the current property only if the account can still see it.
      prev && res.properties.some((p) => p.propertyId === prev)
        ? prev
        : (res.properties[0]?.propertyId ?? ''),
    );
  }, []);

  /** Switch the project to another linked Google account: persist it,
   *  re-list that account's properties, reload the table. */
  const changeAccount = useCallback(
    (next: string) => {
      setAccountId(next);
      void window.freecrawl.integrationSettingsSet('ga4', { accountId: next });
      void loadProperties(next);
    },
    [loadProperties],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [integrations, auth, ga4Settings] = await Promise.all([
        window.freecrawl.integrationsGetAll(),
        window.freecrawl.googleAuthStatus('ga4'),
        window.freecrawl.integrationSettingsGet('ga4'),
      ]);
      if (cancelled) return;
      setAuthState(auth);
      setAccounts(auth.accounts);
      // Seed from the stored per-project settings; a stored account that
      // has since been unlinked falls back to the first one.
      const s = { ...defaultGa4Settings(), ...(ga4Settings ?? {}) };
      const account =
        auth.accounts.find((a) => a.accountId === s.accountId)?.accountId ??
        auth.accounts[0]?.accountId ??
        '';
      setAccountId(account);
      setDays(s.days);
      if (s.property) setPropertyId(s.property);
      const configured = integrations['ga4']?.configured ?? false;
      if (!configured) {
        setStage('unconfigured');
      } else if (!auth.connected) {
        setStage('disconnected');
      } else {
        setStage('ready');
        void loadProperties(account);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProperties]);

  const reload = useCallback(async () => {
    const res = await window.freecrawl.ga4Query({
      limit: PAGE_SIZE,
      offset: 0,
      search: search || undefined,
      filter,
      accountId: accountId || undefined,
    });
    setRows(res.rows);
    setTotal(res.total);
    setMeta(res.meta);
  }, [search, filter, accountId]);

  useEffect(() => {
    if (stage !== 'ready') return;
    let cancelled = false;
    void reload();
    if (!crawlProgress?.running) return;
    const id = setInterval(() => {
      if (!cancelled) void reload();
    }, POLL_MS_RUNNING);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [stage, reload, dataVersion, crawlProgress?.running]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 16,
    getItemKey: (index) => rows[index]?.url ?? `idx-${index}`,
  });

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const res = await window.freecrawl.googleAuthStart('ga4');
      setAuthState(res.state);
      setAccounts(res.state.accounts);
      if (res.ok && res.state.connected) {
        const account = res.state.accounts[0]?.accountId ?? '';
        setAccountId(account);
        setStage('ready');
        void loadProperties(account);
      } else if (res.error) {
        setError(res.error);
      }
    } finally {
      setConnecting(false);
    }
  }, [loadProperties]);

  /** Unlink the account currently selected in the toolbar; with several
   *  linked, the tab stays usable and falls back to the next one. */
  const disconnect = useCallback(async () => {
    const next = await window.freecrawl.googleAuthRevoke(
      'ga4',
      accountId || undefined,
    );
    setAuthState(next);
    setAccounts(next.accounts);
    setProperties([]);
    setPropertyId('');
    if (!next.connected) {
      setAccountId('');
      setStage('disconnected');
      return;
    }
    const fallback = next.accounts[0]!.accountId;
    setAccountId(fallback);
    void window.freecrawl.integrationSettingsSet('ga4', { accountId: fallback });
    void loadProperties(fallback);
  }, [accountId, loadProperties]);

  const runFetch = useCallback(async () => {
    if (!propertyId || fetching) return;
    const selected = properties.find((p) => p.propertyId === propertyId);
    setFetching(true);
    setError(null);
    try {
      const res = await window.freecrawl.ga4Fetch({
        property: propertyId,
        propertyName: selected?.displayName || propertyId,
        days,
        accountId: accountId || undefined,
      });
      if (!res.ok) {
        setError(res.error);
      } else {
        setMeta(res.meta);
        await reload();
      }
    } finally {
      setFetching(false);
    }
  }, [propertyId, properties, days, accountId, fetching, reload]);

  // ── Gate states ──────────────────────────────────────────────────────
  if (stage === 'loading') {
    return (
      <div className="flex h-full items-center justify-center bg-surface-950 text-[12px] text-surface-500">
        <Loader2 size={14} className="mr-2 animate-spin" />
        {t('ga4Tab.loading', { defaultValue: 'Loading…' })}
      </div>
    );
  }

  if (stage === 'unconfigured') {
    return (
      <GateMessage
        title={t('ga4Tab.unconfiguredTitle', {
          defaultValue: 'Google Analytics 4 is not set up',
        })}
        body={t('ga4Tab.unconfiguredBody', {
          defaultValue:
            'Open Settings → Integrations → Google Analytics 4 and paste your own Google Cloud OAuth client ID + secret (Desktop app type). Then come back here to connect.',
        })}
      />
    );
  }

  if (stage === 'disconnected') {
    return (
      <GateMessage
        title={t('ga4Tab.disconnectedTitle', {
          defaultValue: 'Connect your Analytics 4 account',
        })}
        body={t('ga4Tab.disconnectedBody', {
          defaultValue:
            'Sign in with the Google account that owns the GA4 property. A browser window opens for consent — nothing leaves your machine except the standard Google OAuth exchange.',
        })}
      >
        <button
          type="button"
          onClick={() => void connect()}
          disabled={connecting}
          className="mt-3 inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-blue-500 disabled:bg-surface-700 disabled:text-surface-500"
        >
          {connecting && <Loader2 size={13} className="animate-spin" />}
          {t('ga4Tab.connect', { defaultValue: 'Connect with Google' })}
        </button>
        {error && (
          <div className="mt-3 max-w-md text-[11px] text-red-400">{error}</div>
        )}
      </GateMessage>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-surface-950">
      <div
        className="flex items-center gap-2 border-b border-surface-800 bg-surface-900/40 px-3"
        style={{ height: TOOLBAR_HEIGHT }}
      >
        <div className="text-[12px] font-semibold tracking-wide text-surface-100">
          {t('ga4Tab.title', { defaultValue: 'Google Analytics 4' })}
        </div>
        <div className="relative">
          <Search
            size={12}
            className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-surface-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('ga4Tab.filterPlaceholder', {
              defaultValue: 'Filter by URL…',
            })}
            className="h-6 w-48 rounded border border-surface-700 bg-surface-950 pl-6 pr-2 text-[11px] text-surface-100 placeholder-surface-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <select
          className="h-6 rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterMode)}
        >
          <option value="all">
            {t('ga4Tab.filterAll', { defaultValue: 'All pages' })}
          </option>
          <option value="with-data">
            {t('ga4Tab.filterWith', { defaultValue: 'With GA4 data' })}
          </option>
          <option value="without-data">
            {t('ga4Tab.filterWithout', { defaultValue: 'No GA4 data' })}
          </option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          {accounts.length > 1 && (
            <select
              className="h-6 max-w-[170px] rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
              value={accountId}
              onChange={(e) => changeAccount(e.target.value)}
              disabled={fetching}
              title={t('ga4Tab.accountTitle', {
                defaultValue:
                  'Which linked Google account this project reports on. Each account keeps its own stored data.',
              })}
            >
              {accounts.map((a) => (
                <option key={a.accountId} value={a.accountId}>
                  {a.email ?? a.accountId}
                </option>
              ))}
            </select>
          )}
          <select
            className="h-6 max-w-[260px] rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            disabled={fetching || properties.length === 0}
            title={propertyId}
          >
            {properties.length === 0 && (
              <option value="">
                {t('ga4Tab.noProperties', { defaultValue: 'No properties' })}
              </option>
            )}
            {properties.map((p) => (
              <option key={p.propertyId} value={p.propertyId}>
                {p.displayName}
                {p.accountName ? ` — ${p.accountName}` : ''}
              </option>
            ))}
          </select>
          <select
            className="h-6 rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
            value={days}
            onChange={(e) => setDays(Number(e.target.value) as RangeDays)}
            disabled={fetching}
          >
            <option value={7}>{t('ga4Tab.days7', { defaultValue: 'Last 7 days' })}</option>
            <option value={28}>{t('ga4Tab.days28', { defaultValue: 'Last 28 days' })}</option>
            <option value={90}>{t('ga4Tab.days90', { defaultValue: 'Last 90 days' })}</option>
          </select>
          <button
            type="button"
            onClick={() => void runFetch()}
            disabled={fetching || !propertyId}
            className="inline-flex h-6 items-center gap-1.5 rounded bg-blue-600 px-2.5 text-[11px] font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-surface-700 disabled:text-surface-500"
          >
            {fetching ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            {t('ga4Tab.fetch', { defaultValue: 'Fetch' })}
          </button>
        </div>
      </div>

      {/* Context line — connection + last pull */}
      <div className="flex items-center gap-2 border-b border-surface-800 bg-surface-900/20 px-3 py-1 text-[10px] text-surface-500">
        <span>
          {t('ga4Tab.connectedAs', {
            defaultValue: 'Connected as {{email}}',
            email:
              accounts.find((a) => a.accountId === accountId)?.email ??
              authState?.email ??
              'Google account',
          })}
        </span>
        <button
          type="button"
          onClick={() => void disconnect()}
          className="text-surface-500 underline decoration-dotted hover:text-surface-300"
        >
          {t('ga4Tab.disconnect', { defaultValue: 'Disconnect' })}
        </button>
        {meta && (
          <span className="ml-auto">
            {t('ga4Tab.metaLine', {
              defaultValue:
                '{{property}} · {{start}} → {{end}} · {{rows}} pages · fetched {{ago}}',
              property: meta.propertyName,
              start: meta.startDate,
              end: meta.endDate,
              rows: meta.rowCount.toLocaleString(),
              ago: relativeTime(meta.fetchedAt),
            })}
          </span>
        )}
      </div>

      {error && (
        <div className="border-b border-red-700/40 bg-red-900/20 px-3 py-1 text-[10px] text-red-300">
          {error}
        </div>
      )}

      {/* Column header */}
      <div
        className="flex shrink-0 select-none items-center border-b border-surface-800 bg-surface-900/60 text-[10px] font-medium text-surface-400"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex-1 px-2">{t('ga4Tab.colUrl', { defaultValue: 'URL' })}</div>
        <div className="w-[54px] shrink-0 text-center">{t('ga4Tab.colStatus', { defaultValue: 'Status' })}</div>
        <div className="w-[72px] shrink-0 text-right">{t('ga4Tab.colSessions', { defaultValue: 'Sessions' })}</div>
        <div className="w-[72px] shrink-0 text-right">{t('ga4Tab.colUsers', { defaultValue: 'Users' })}</div>
        <div className="w-[84px] shrink-0 text-right">{t('ga4Tab.colViews', { defaultValue: 'Pageviews' })}</div>
        <div className="w-[80px] shrink-0 text-right">{t('ga4Tab.colEng', { defaultValue: 'Engagement' })}</div>
        <div className="w-[80px] shrink-0 text-right">{t('ga4Tab.colDuration', { defaultValue: 'Avg duration' })}</div>
        <div className="w-[88px] shrink-0 px-2 text-right">{t('ga4Tab.colFetched', { defaultValue: 'Fetched' })}</div>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-[12px] text-surface-500">
            {total === 0
              ? t('ga4Tab.emptyNoData', {
                  defaultValue:
                    'No internal HTML pages crawled yet — run a crawl, then fetch GA4 data.',
                })
              : t('ga4Tab.emptyNoMatch', {
                  defaultValue: 'No pages match the current filter.',
                })}
          </div>
        ) : (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((vRow) => {
              const row = rows[vRow.index];
              if (!row) return null;
              return (
                <div
                  key={vRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: ROW_HEIGHT,
                    transform: `translateY(${vRow.start}px)`,
                  }}
                >
                  <Ga4DataRow row={row} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center gap-3 border-t border-surface-800 bg-surface-900/40 px-3 text-[11px] text-surface-400"
        style={{ height: STATUS_BAR_HEIGHT }}
      >
        <span>
          {t('ga4Tab.summary', {
            defaultValue: '{{shown}} pages',
            shown: rows.length.toLocaleString(),
          })}
          {total > rows.length &&
            ' ' +
              t('ga4Tab.firstN', {
                defaultValue: '(first {{n}})',
                n: PAGE_SIZE.toLocaleString(),
              })}
        </span>
        {fetching && (
          <span className="flex items-center gap-1.5 text-surface-500">
            <Loader2 size={11} className="animate-spin text-blue-400" />
            {t('ga4Tab.fetching', { defaultValue: 'Fetching from GA4…' })}
          </span>
        )}
      </div>
    </div>
  );
}

function Ga4DataRow({ row }: { row: Ga4Row }) {
  const a = row.ga4;
  const status = row.statusCode;
  const statusCls =
    status === null
      ? 'text-surface-600'
      : status >= 200 && status < 300
        ? 'text-emerald-400'
        : status >= 300 && status < 400
          ? 'text-blue-400'
          : 'text-red-400';

  return (
    <div className="flex h-full items-center text-[11px] odd:bg-surface-900/20 hover:bg-surface-800/40">
      <div className="flex-1 truncate px-2 text-surface-200" title={row.url}>
        {row.url}
      </div>
      <div className={`w-[54px] shrink-0 text-center tabular-nums ${statusCls}`}>
        {status ?? '—'}
      </div>
      <div className="w-[72px] shrink-0 text-right tabular-nums text-surface-200">
        {a ? a.sessions.toLocaleString() : '—'}
      </div>
      <div className="w-[72px] shrink-0 text-right tabular-nums text-surface-300">
        {a ? a.users.toLocaleString() : '—'}
      </div>
      <div className="w-[84px] shrink-0 text-right tabular-nums text-surface-300">
        {a ? a.pageviews.toLocaleString() : '—'}
      </div>
      <div
        className={`w-[80px] shrink-0 text-right tabular-nums ${
          a ? engagementClass(a.engagementRate) : 'text-surface-600'
        }`}
      >
        {a ? `${(a.engagementRate * 100).toFixed(1)}%` : '—'}
      </div>
      <div className="w-[80px] shrink-0 text-right tabular-nums text-surface-300">
        {a ? fmtDuration(a.avgSessionDuration) : '—'}
      </div>
      <div className="w-[88px] shrink-0 truncate px-2 text-right text-surface-500">
        {a ? relativeTime(a.fetchedAt) : '—'}
      </div>
    </div>
  );
}

function GateMessage({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full items-center justify-center bg-surface-950 px-6">
      <div className="max-w-md text-center">
        <div className="mb-1.5 text-[13px] font-semibold text-surface-200">
          {title}
        </div>
        <div className="text-[11px] leading-relaxed text-surface-500">{body}</div>
        {children}
      </div>
    </div>
  );
}
