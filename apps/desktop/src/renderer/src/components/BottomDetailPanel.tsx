import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { translateLabel } from '../i18n/labels.js';
import type {
  CrawlConfig,
  CrawlUrlRow,
  LinkOrigin,
  LinkPathType,
  LinkPosition,
  LinkType,
  UrlCertInfoResult,
  UrlClusterMember,
  UrlDetail,
  UrlPageImageRow,
  UrlSourceResult,
  UrlAnalyticsDetail,
} from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';
import { diagnoseStatus, type StatusDiagnosis } from '../utils/statusDiagnosis.js';

type SubTab =
  | 'url-details'
  | 'outline'
  | 'inlinks'
  | 'outlinks'
  | 'images'
  | 'resources'
  | 'extracted-data'
  | 'serp-snippet'
  | 'http-headers'
  | 'cookies'
  | 'structured-data'
  | 'view-source'
  | 'view-rendered'
  | 'screenshot'
  | 'duplicates'
  | 'analytics';

const SUB_TABS: { key: SubTab; label: string; disabled?: boolean }[] = [
  { key: 'url-details', label: 'URL Details' },
  { key: 'outline', label: 'Outline' },
  { key: 'inlinks', label: 'Inlinks' },
  { key: 'outlinks', label: 'Outlinks' },
  { key: 'images', label: 'Images' },
  { key: 'resources', label: 'Resources' },
  { key: 'extracted-data', label: 'Extracted Data' },
  { key: 'serp-snippet', label: 'SERP Snippet' },
  { key: 'http-headers', label: 'HTTP Headers' },
  { key: 'cookies', label: 'Cookies' },
  { key: 'structured-data', label: 'Structured Data' },
  { key: 'view-source', label: 'View Source' },
  { key: 'view-rendered', label: 'View Rendered' },
  { key: 'screenshot', label: 'Screenshot' },
  { key: 'duplicates', label: 'Duplicates' },
  { key: 'analytics', label: 'Analytics' },
];

// Maximum number of URLs we aggregate over in one go. Anything larger is
// treated as a "too many" hint so the user can narrow the selection
// before we burn N parallel reader-pool requests on it.
const MULTI_DETAIL_LIMIT = 50;

// Tabs that pivot on a single page (HTTP response, snippet, source, etc.)
// — when the user has multi-selected rows we keep these scoped to the
// primary URL and surface a banner so the scope is clear.
const SINGLE_URL_ONLY_TABS: ReadonlySet<SubTab> = new Set([
  'url-details',
  'outline',
  'extracted-data',
  'serp-snippet',
  'http-headers',
  'cookies',
  'structured-data',
  'view-source',
  'view-rendered',
  'screenshot',
  'duplicates',
  'analytics',
]);

export function BottomDetailPanel() {
  const { t: tx, i18n } = useTranslation();
  const lang = i18n.language;
  const selectedUrlId = useAppStore((s) => s.selectedUrlId);
  const selectedUrlIds = useAppStore((s) => s.selectedUrlIds);
  const [detail, setDetail] = useState<UrlDetail | null>(null);
  const [details, setDetails] = useState<UrlDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState<SubTab>('url-details');

  // Effective scope: if the user has 2+ rows selected we aggregate; one
  // row (or none) keeps the existing single-URL behaviour intact.
  const effectiveIds = useMemo(() => {
    if (selectedUrlIds.length > 1) return selectedUrlIds;
    if (selectedUrlId !== null) return [selectedUrlId];
    return [];
  }, [selectedUrlId, selectedUrlIds]);

  const isMulti = effectiveIds.length > 1;
  const truncated = isMulti && effectiveIds.length > MULTI_DETAIL_LIMIT;
  const fetchIds = useMemo(
    () => (truncated ? effectiveIds.slice(0, MULTI_DETAIL_LIMIT) : effectiveIds),
    [effectiveIds, truncated],
  );

  // Stable cache key so we don't re-fetch on every render of the same set.
  const fetchKey = fetchIds.join(',');

  useEffect(() => {
    if (fetchIds.length === 0) {
      setDetail(null);
      setDetails([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        if (fetchIds.length === 1) {
          const d = await window.freecrawl.urlDetailGet({ id: fetchIds[0]! });
          if (!cancelled) {
            setDetail(d);
            setDetails(d ? [d] : []);
          }
        } else {
          const results = await Promise.all(
            fetchIds.map((id) => window.freecrawl.urlDetailGet({ id })),
          );
          if (!cancelled) {
            const list = results.filter((r): r is UrlDetail => r !== null);
            setDetails(list);
            // The "primary" detail is the one matching `selectedUrlId`
            // (last clicked); fall back to the first if it's missing.
            const primary =
              list.find((r) => r.row.id === selectedUrlId) ?? list[0] ?? null;
            setDetail(primary);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
    // selectedUrlId is intentionally excluded from deps — it only steers
    // which entry of `details` becomes "primary" and we resolve that
    // inside the load() body. fetchKey covers multi-set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey]);

  // When only the primary id changes (e.g. user clicked a different cell
  // within the same multi-selection set), re-pick the primary detail
  // without re-fetching the whole batch.
  useEffect(() => {
    if (!isMulti || details.length === 0) return;
    const primary =
      details.find((r) => r.row.id === selectedUrlId) ?? details[0] ?? null;
    setDetail(primary);
  }, [selectedUrlId, details, isMulti]);

  // Aggregated link rows: each detail's inlinks/outlinks already carry
  // their fromUrl / toUrl so concatenation is enough — the From / To
  // columns in the table naturally distinguish which page each row
  // belongs to.
  const aggregatedInlinks = useMemo<string[][]>(() => {
    if (details.length === 0) return [];
    const rows: string[][] = [];
    for (const d of details) {
      for (const l of d.inlinks) {
        rows.push(
          buildLinkRow({
            fromUrl: l.fromUrl,
            toUrl: d.row.url,
            toStatusCode: l.toStatusCode,
            toSize: l.toSize,
            type: l.type,
            anchor: l.anchor,
            altText: l.altText,
            rel: l.rel,
            target: l.target,
            pathType: l.pathType,
            linkPath: l.linkPath,
            linkPosition: l.linkPosition,
            linkOrigin: l.linkOrigin,
          }),
        );
      }
    }
    return rows;
  }, [details]);

  const aggregatedOutlinks = useMemo<string[][]>(() => {
    if (details.length === 0) return [];
    const rows: string[][] = [];
    for (const d of details) {
      for (const l of d.outlinks) {
        rows.push(
          buildLinkRow({
            fromUrl: d.row.url,
            toUrl: l.toUrl,
            toStatusCode: l.toStatusCode,
            toSize: l.toSize,
            type: l.type,
            anchor: l.anchor,
            altText: l.altText,
            rel: l.rel,
            target: l.target,
            pathType: l.pathType,
            linkPath: l.linkPath,
            linkPosition: l.linkPosition,
            linkOrigin: l.linkOrigin,
          }),
        );
      }
    }
    return rows;
  }, [details]);

  const aggregatedInlinksTotal = useMemo(
    () => details.reduce((n, d) => n + d.inlinksTotal, 0),
    [details],
  );
  const aggregatedOutlinksTotal = useMemo(
    () => details.reduce((n, d) => n + d.outlinksTotal, 0),
    [details],
  );

  // For Images / Resources we collect (urlId, row) pairs so the dedicated
  // multi-views can spread their fetches across the same set the user
  // picked in the main table.
  const multiPages = useMemo(
    () => details.map((d) => ({ id: d.row.id, row: d.row })),
    [details],
  );

  const inlinksCountLabel = isMulti ? aggregatedInlinksTotal : detail?.inlinksTotal;
  const outlinksCountLabel = isMulti ? aggregatedOutlinksTotal : detail?.outlinksTotal;

  const showSingleScopeBanner = isMulti && SINGLE_URL_ONLY_TABS.has(subTab);

  return (
    <div className="flex h-full flex-col bg-surface-950">
      <div className="flex items-center border-b border-surface-800 bg-surface-900">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            disabled={tab.disabled}
            className={clsx(
              'tab',
              subTab === tab.key && 'tab-active',
              tab.disabled && 'cursor-not-allowed opacity-40',
            )}
            onClick={() => !tab.disabled && setSubTab(tab.key)}
            title={tab.disabled ? tx('detail.comingSoon', { defaultValue: 'Coming soon' }) : undefined}
          >
            {translateLabel(tab.label, lang)}
            {tab.key === 'inlinks' && inlinksCountLabel !== undefined && (
              <span className="ml-1 text-surface-500">
                ({inlinksCountLabel.toLocaleString()})
              </span>
            )}
            {tab.key === 'outlinks' && outlinksCountLabel !== undefined && (
              <span className="ml-1 text-surface-500">
                ({outlinksCountLabel.toLocaleString()})
              </span>
            )}
          </button>
        ))}
        {isMulti && (
          <div className="ml-auto px-3 text-[10.5px] text-surface-400">
            <span className="font-mono text-accent-300">
              {effectiveIds.length.toLocaleString()}
            </span>{' '}
            {tx('detail.urlsSelected', { defaultValue: 'URLs selected' })}
            {truncated && (
              <span className="ml-2 text-amber-400">
                · {tx('detail.aggregatingFirst', { defaultValue: 'aggregating first {{n}}', n: MULTI_DETAIL_LIMIT })}
              </span>
            )}
          </div>
        )}
      </div>

      {showSingleScopeBanner && detail && (
        <div className="shrink-0 border-b border-surface-800 bg-surface-900/40 px-3 py-1 text-[10.5px] text-surface-400">
          {tx('detail.perPagePrefix', { defaultValue: 'This tab is per-page — showing data for' })}{' '}
          <span className="font-mono text-surface-200">{detail.row.url}</span>{' '}
          {tx('detail.perPageSuffix', { defaultValue: '(primary URL of the selection).' })}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {effectiveIds.length === 0 && (
          <div className="flex h-full items-center justify-center text-xs text-surface-500">
            {tx('detail.selectUrl', { defaultValue: 'Select a URL from the table to see details.' })}
          </div>
        )}
        {effectiveIds.length > 0 && !detail && loading && (
          <div className="p-4 text-xs text-surface-500">{tx('common.loading', { defaultValue: 'Loading…' })}</div>
        )}
        {detail && subTab === 'url-details' && <NameValueView row={detail.row} />}
        {subTab === 'inlinks' &&
          (isMulti ? (
            details.length > 0 && (
              <LinksView
                tableId="inlinks-multi"
                selectedUrlId={detail?.row.id ?? null}
                total={aggregatedInlinksTotal}
                shown={aggregatedInlinks.length}
                columns={LINK_COLUMNS}
                rows={aggregatedInlinks}
              />
            )
          ) : (
            detail && (
              <LinksView
                tableId="inlinks"
                selectedUrlId={detail.row.id}
                total={detail.inlinksTotal}
                shown={detail.inlinks.length}
                columns={LINK_COLUMNS}
                rows={detail.inlinks.map((l) =>
                  buildLinkRow({
                    fromUrl: l.fromUrl,
                    toUrl: detail.row.url,
                    toStatusCode: l.toStatusCode,
                    toSize: l.toSize,
                    type: l.type,
                    anchor: l.anchor,
                    altText: l.altText,
                    rel: l.rel,
                    target: l.target,
                    pathType: l.pathType,
                    linkPath: l.linkPath,
                    linkPosition: l.linkPosition,
                    linkOrigin: l.linkOrigin,
                  }),
                )}
              />
            )
          ))}
        {subTab === 'outlinks' &&
          (isMulti ? (
            details.length > 0 && (
              <LinksView
                tableId="outlinks-multi"
                selectedUrlId={detail?.row.id ?? null}
                total={aggregatedOutlinksTotal}
                shown={aggregatedOutlinks.length}
                columns={LINK_COLUMNS}
                rows={aggregatedOutlinks}
              />
            )
          ) : (
            detail && (
              <LinksView
                tableId="outlinks"
                selectedUrlId={detail.row.id}
                total={detail.outlinksTotal}
                shown={detail.outlinks.length}
                columns={LINK_COLUMNS}
                rows={detail.outlinks.map((l) =>
                  buildLinkRow({
                    fromUrl: detail.row.url,
                    toUrl: l.toUrl,
                    toStatusCode: l.toStatusCode,
                    toSize: l.toSize,
                    type: l.type,
                    anchor: l.anchor,
                    altText: l.altText,
                    rel: l.rel,
                    target: l.target,
                    pathType: l.pathType,
                    linkPath: l.linkPath,
                    linkPosition: l.linkPosition,
                    linkOrigin: l.linkOrigin,
                  }),
                )}
              />
            )
          ))}
        {detail && subTab === 'outline' && <OutlineView row={detail.row} />}
        {subTab === 'images' &&
          (isMulti ? (
            <MultiImagesView pages={multiPages} />
          ) : (
            detail && <ImagesView urlId={detail.row.id} row={detail.row} />
          ))}
        {subTab === 'resources' &&
          (isMulti ? (
            <MultiResourcesView pages={multiPages} />
          ) : (
            detail && <ResourcesView urlId={detail.row.id} row={detail.row} />
          ))}
        {detail && subTab === 'extracted-data' && (
          <ExtractedDataView row={detail.row} />
        )}
        {detail && subTab === 'serp-snippet' && <SerpSnippet row={detail.row} />}
        {detail && subTab === 'http-headers' && (
          <HttpHeadersView headers={detail.headers} row={detail.row} />
        )}
        {detail && subTab === 'cookies' && (
          <CookiesView row={detail.row} headers={detail.headers} />
        )}
        {detail && subTab === 'structured-data' && (
          <StructuredDataView urlId={detail.row.id} row={detail.row} />
        )}
        {detail && subTab === 'view-source' && (
          <ViewSourceView urlId={detail.row.id} pageUrl={detail.row.url} kind="raw" />
        )}
        {detail && subTab === 'view-rendered' && (
          <ViewSourceView urlId={detail.row.id} pageUrl={detail.row.url} kind="rendered" />
        )}
        {detail && subTab === 'screenshot' && (
          <ScreenshotView urlId={detail.row.id} />
        )}
        {detail && subTab === 'duplicates' && (
          <DuplicatesView urlId={detail.row.id} row={detail.row} />
        )}
        {detail && subTab === 'analytics' && (
          <AnalyticsView pageUrl={detail.row.url} />
        )}
      </div>
    </div>
  );
}

function AnalyticsView({ pageUrl }: { pageUrl: string }) {
  const { t } = useTranslation();
  const [data, setData] = useState<UrlAnalyticsDetail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const dataVersion = useAppStore((s) => s.dataVersion);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    void window.freecrawl.urlAnalyticsGet(pageUrl).then((res) => {
      if (cancelled) return;
      setData(res);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [pageUrl, dataVersion]);

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-surface-500">
        {t('analyticsView.loading', { defaultValue: 'Loading…' })}
      </div>
    );
  }

  if (!data || (!data.gsc && !data.ga4 && !data.inspection)) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-[12px] text-surface-500">
        {t('analyticsView.empty', {
          defaultValue:
            'No Search Console / Analytics 4 / URL Inspection data for this URL yet. Fetch it from the GA4 / Search Console tabs.',
        })}
      </div>
    );
  }

  const { gsc, ga4, inspection } = data;
  return (
    <div className="grid grid-cols-1 gap-3 overflow-y-auto p-3 lg:grid-cols-3">
      <AnalyticsCard
        title={t('analyticsView.gscTitle', { defaultValue: 'Search Console' })}
        empty={t('analyticsView.gscEmpty', { defaultValue: 'No clicks / impressions data yet.' })}
        present={!!gsc}
      >
        {gsc && (
          <>
            <AnalyticsRow label="Clicks" value={gsc.clicks.toLocaleString()} />
            <AnalyticsRow label="Impressions" value={gsc.impressions.toLocaleString()} />
            <AnalyticsRow label="CTR" value={`${(gsc.ctr * 100).toFixed(1)}%`} />
            <AnalyticsRow label="Avg position" value={gsc.position.toFixed(1)} />
          </>
        )}
      </AnalyticsCard>
      <AnalyticsCard
        title={t('analyticsView.ga4Title', { defaultValue: 'Analytics 4' })}
        empty={t('analyticsView.ga4Empty', { defaultValue: 'No GA4 traffic data yet.' })}
        present={!!ga4}
      >
        {ga4 && (
          <>
            <AnalyticsRow label="Sessions" value={ga4.sessions.toLocaleString()} />
            <AnalyticsRow label="Users" value={ga4.users.toLocaleString()} />
            <AnalyticsRow label="Pageviews" value={ga4.pageviews.toLocaleString()} />
            <AnalyticsRow
              label="Engagement rate"
              value={`${(ga4.engagementRate * 100).toFixed(1)}%`}
            />
            <AnalyticsRow
              label="Avg session duration"
              value={`${Math.round(ga4.avgSessionDuration)} s`}
            />
          </>
        )}
      </AnalyticsCard>
      <AnalyticsCard
        title={t('analyticsView.inspectionTitle', { defaultValue: 'URL Inspection' })}
        empty={t('analyticsView.inspectionEmpty', {
          defaultValue: 'No URL Inspection result yet — run it from the Search Console tab.',
        })}
        present={!!inspection}
      >
        {inspection && (
          <>
            <AnalyticsRow label="Verdict" value={inspection.verdict ?? '—'} />
            <AnalyticsRow label="Coverage" value={inspection.coverageState ?? '—'} />
            <AnalyticsRow label="Indexing" value={inspection.indexingState ?? '—'} />
            <AnalyticsRow label="robots.txt" value={inspection.robotsTxtState ?? '—'} />
            <AnalyticsRow
              label="Last crawl"
              value={inspection.lastCrawlTime ?? '—'}
            />
            <AnalyticsRow
              label="Google canonical"
              value={inspection.googleCanonical ?? '—'}
            />
            <AnalyticsRow
              label="User canonical"
              value={inspection.userCanonical ?? '—'}
            />
          </>
        )}
      </AnalyticsCard>
    </div>
  );
}

function AnalyticsCard({
  title,
  present,
  empty,
  children,
}: {
  title: string;
  present: boolean;
  empty: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded border border-surface-800 bg-surface-900/40 p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-surface-300">
        {title}
      </div>
      {present ? (
        <div className="space-y-1">{children}</div>
      ) : (
        <div className="text-[11px] text-surface-500">{empty}</div>
      )}
    </div>
  );
}

function AnalyticsRow({ label, value }: { label: string; value: string }) {
  const { i18n } = useTranslation();
  return (
    <div className="flex items-baseline gap-3 text-[11px]">
      <div className="w-32 shrink-0 text-surface-500">{translateLabel(label, i18n.language)}</div>
      <div className="min-w-0 flex-1 truncate text-surface-100" title={value}>
        {value}
      </div>
    </div>
  );
}

/**
 * V2 Faz 1 Increment 3 — Screenshot sub-tab. Reads the captured PNG
 * paths from `url_sources` and serves the bytes via `readScreenshot`
 * IPC (returns a data: URL). Toggle row picks between Full-Page /
 * Above-The-Fold / Mobile variants.
 */
function ScreenshotView({ urlId }: { urlId: number | null }) {
  const { t } = useTranslation();
  const [src, setSrc] = useState<UrlSourceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [variant, setVariant] = useState<'fullpage' | 'fold' | 'mobile'>('fullpage');
  const [imgData, setImgData] = useState<string | null>(null);
  const [imgError, setImgError] = useState<string | null>(null);

  useEffect(() => {
    if (urlId === null) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void window.freecrawl
      .urlSourceGet({ id: urlId })
      .then((r) => {
        if (!cancelled) setSrc(r);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [urlId]);

  // Pick the best default variant for this URL — falls back to whichever
  // file was actually captured so the user sees something on first open.
  useEffect(() => {
    if (!src) return;
    if (variant === 'fullpage' && !src.screenshotFullpagePath) {
      if (src.screenshotFoldPath) setVariant('fold');
      else if (src.screenshotMobilePath) setVariant('mobile');
    }
  }, [src, variant]);

  const activePath =
    variant === 'fullpage'
      ? src?.screenshotFullpagePath
      : variant === 'fold'
        ? src?.screenshotFoldPath
        : src?.screenshotMobilePath;

  useEffect(() => {
    setImgData(null);
    setImgError(null);
    if (!activePath) return;
    let cancelled = false;
    void window.freecrawl
      .readScreenshot(activePath)
      .then((dataUrl) => {
        if (cancelled) return;
        if (dataUrl) setImgData(dataUrl);
        else
          setImgError(
            t('screenshot.readFailed', {
              defaultValue: 'Screenshot file could not be read from disk.',
            }),
          );
      })
      .catch((err) => {
        if (!cancelled) setImgError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [activePath, t]);

  const noneCaptured =
    !!src &&
    !src.screenshotFullpagePath &&
    !src.screenshotFoldPath &&
    !src.screenshotMobilePath;

  if (loading && !src) {
    return (
      <div className="p-4 text-[11px] text-surface-500">
        {t('screenshot.loading', { defaultValue: 'Loading screenshot…' })}
      </div>
    );
  }
  if (noneCaptured) {
    return (
      <div className="p-4 text-[11px] text-surface-500">
        {t('screenshot.empty', {
          defaultValue: 'No screenshots stored for this URL.',
        })}
        <div className="mt-1 text-[10px] text-surface-600">
          {t('screenshot.emptyHint', {
            defaultValue:
              'Screenshots are only captured when Rendering Mode = JavaScript Rendering and Screenshot Capture is enabled in Settings → Rendering. Re-crawl the URL with those options on.',
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-surface-800 bg-surface-900/50 px-3 py-1.5 text-[11px]">
        <span className="text-surface-500">
          {t('screenshot.variant', { defaultValue: 'Variant' })}:
        </span>
        <button
          type="button"
          disabled={!src?.screenshotFullpagePath}
          onClick={() => setVariant('fullpage')}
          className={clsx(
            'rounded border px-2 py-0.5 text-[10px] transition',
            !src?.screenshotFullpagePath
              ? 'cursor-not-allowed border-surface-800 text-surface-600'
              : variant === 'fullpage'
                ? 'border-accent-500/60 bg-accent-500/15 text-accent-300'
                : 'border-surface-700 text-surface-300 hover:bg-surface-800',
          )}
        >
          {t('screenshot.fullpage', { defaultValue: 'Full page' })}
        </button>
        <button
          type="button"
          disabled={!src?.screenshotFoldPath}
          onClick={() => setVariant('fold')}
          className={clsx(
            'rounded border px-2 py-0.5 text-[10px] transition',
            !src?.screenshotFoldPath
              ? 'cursor-not-allowed border-surface-800 text-surface-600'
              : variant === 'fold'
                ? 'border-accent-500/60 bg-accent-500/15 text-accent-300'
                : 'border-surface-700 text-surface-300 hover:bg-surface-800',
          )}
        >
          {t('screenshot.fold', { defaultValue: 'Above the fold' })}
        </button>
        <button
          type="button"
          disabled={!src?.screenshotMobilePath}
          onClick={() => setVariant('mobile')}
          className={clsx(
            'rounded border px-2 py-0.5 text-[10px] transition',
            !src?.screenshotMobilePath
              ? 'cursor-not-allowed border-surface-800 text-surface-600'
              : variant === 'mobile'
                ? 'border-accent-500/60 bg-accent-500/15 text-accent-300'
                : 'border-surface-700 text-surface-300 hover:bg-surface-800',
          )}
        >
          {t('screenshot.mobile', { defaultValue: 'Mobile' })}
        </button>
        {activePath && (
          <span className="ml-auto truncate font-mono text-[10px] text-surface-500" title={activePath}>
            {activePath}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto bg-surface-950 p-3">
        {imgError ? (
          <div className="rounded border border-red-800/60 bg-red-950/30 px-3 py-2 text-[11px] text-red-200">
            {imgError}
          </div>
        ) : imgData ? (
          <img
            src={imgData}
            alt="Captured screenshot"
            className="max-w-full rounded border border-surface-800"
          />
        ) : (
          <div className="px-3 py-4 text-[11px] text-surface-500">
            {t('screenshot.loading', { defaultValue: 'Loading screenshot…' })}
          </div>
        )}
      </div>
    </div>
  );
}

function ViewSourceView({
  urlId,
  pageUrl,
  kind = 'raw',
}: {
  urlId: number | null;
  pageUrl: string;
  /** 'raw' = HTTP response body, 'rendered' = post-JS DOM dump. */
  kind?: 'raw' | 'rendered';
}) {
  const { t } = useTranslation();
  const [src, setSrc] = useState<UrlSourceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [wrap, setWrap] = useState(false);
  // Active match index (0-based). When the user presses Enter (next) or
  // Shift+Enter (prev) we cycle through matches and the active one is
  // scrolled into view + highlighted in a stronger colour.
  const [activeMatch, setActiveMatch] = useState(0);
  const preRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (urlId === null) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void window.freecrawl
      .urlSourceGet({ id: urlId })
      .then((r) => {
        if (!cancelled) setSrc(r);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [urlId]);

  // When the search term changes, reset the cycle to the first match so
  // a fresh query doesn't carry over a stale index from a longer match
  // list. Also runs when the user clears the term entirely.
  useEffect(() => {
    setActiveMatch(0);
  }, [search, urlId]);

  const activeBody = kind === 'rendered' ? src?.renderedBody ?? null : src?.body ?? null;
  // Memoize the full-body scans so they only re-run when the body, query, or
  // active-match index actually change — NOT on every keystroke or parent
  // re-render. On a multi-MB snapshot, an unmemoized countMatches +
  // renderHighlighted per render stalls typing in the search box by 100 ms+.
  const matches = useMemo(
    () => (activeBody && search ? countMatches(activeBody, search) : 0),
    [activeBody, search],
  );
  // Clamp active match into the current range so a shrinking match count
  // (after the user typed an extra character) doesn't point past the end.
  const safeActive = matches > 0 ? activeMatch % matches : 0;
  const highlightedBody = useMemo(
    () => (activeBody && search ? renderHighlighted(activeBody, search, safeActive) : null),
    [activeBody, search, safeActive],
  );

  if (loading && !src) {
    return <div className="p-4 text-[11px] text-surface-500">{t('viewSource.loadingSource', { defaultValue: 'Loading source…' })}</div>;
  }
  if (!src || activeBody === null) {
    if (kind === 'rendered') {
      return (
        <div className="p-4 text-[11px] text-surface-500">
          {t('viewRendered.noBody', {
            defaultValue: 'No rendered DOM stored for this URL.',
          })}
          <div className="mt-1 text-[10px] text-surface-600">
            {t('viewRendered.noBodyHint', {
              defaultValue:
                'View Rendered is only populated when the page was crawled with Rendering Mode = JavaScript Rendering. Switch to JS mode in Settings → Crawler and re-crawl the URL to capture the post-JS DOM.',
            })}
          </div>
        </div>
      );
    }
    return (
      <div className="p-4 text-[11px] text-surface-500">
        {t('viewSource.noBody', { defaultValue: 'No HTML body stored for this URL.' })}
        <div className="mt-1 text-[10px] text-surface-600">
          {t('viewSource.noBodyHint1', { defaultValue: 'View Source is only captured for HTML pages crawled with the' })}{' '}
          <span className="font-mono">storeBodySnapshots</span>{' '}
          {t('viewSource.noBodyHint2', { defaultValue: 'setting enabled.' })}
        </div>
      </div>
    );
  }

  const body = activeBody;
  const activeLength =
    kind === 'rendered' ? src.renderedBodyLength ?? body.length : src.bodyLength;

  function step(delta: number): void {
    if (matches === 0) return;
    setActiveMatch((cur) => {
      const next = (cur + delta + matches) % matches;
      return next;
    });
  }

  function copy() {
    void navigator.clipboard.writeText(body);
  }

  function download() {
    const blob = new Blob([body], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    let filename = 'page.html';
    try {
      const u = new URL(pageUrl);
      const seg = u.pathname.replace(/\/+$/, '').split('/').pop() || u.hostname;
      filename = `${(seg || 'page').replace(/[^a-z0-9._-]/gi, '_')}.html`;
    } catch {
      /* ignore */
    }
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5_000);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-surface-800 bg-surface-900/50 px-3 py-1.5 text-[11px]">
        <span className="text-surface-500">
          {(activeLength / 1024).toFixed(1)} KB
          {src.truncated && kind === 'raw' && (
            <span className="ml-1 rounded bg-amber-900/40 px-1.5 py-0.5 text-[9px] uppercase text-amber-300">
              truncated
            </span>
          )}
          {kind === 'rendered' && src.renderMs !== null && (
            <span className="ml-2 rounded bg-blue-900/40 px-1.5 py-0.5 text-[9px] uppercase text-blue-300">
              {t('viewRendered.renderMs', { defaultValue: 'render {{ms}}ms', ms: src.renderMs })}
            </span>
          )}
        </span>
        {src.capturedAt && (
          <span className="text-surface-600">· captured {src.capturedAt}</span>
        )}
        <input
          type="text"
          className="ml-3 w-48 rounded border border-surface-700 bg-surface-950 px-2 py-0.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
          placeholder={t('viewSource.searchPlaceholder', { defaultValue: 'Search source…' })}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            // Enter / Shift+Enter cycle through matches in place — the
            // input keeps focus so the user can keep typing or step
            // again without re-clicking. Escape clears the search.
            if (e.key === 'Enter') {
              e.preventDefault();
              step(e.shiftKey ? -1 : 1);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setSearch('');
            }
          }}
          spellCheck={false}
        />
        {search && matches > 0 && (
          <>
            <span className="text-surface-500">
              {t('viewSource.matchOf', { defaultValue: '{{n}} of {{total}}', n: safeActive + 1, total: matches })}
            </span>
            <button
              className="rounded border border-surface-700 px-1.5 py-0.5 text-surface-300 hover:bg-surface-800 disabled:opacity-40"
              onClick={() => step(-1)}
              disabled={matches < 2}
              title={t('viewSource.prevMatch', { defaultValue: 'Previous match (Shift+Enter)' })}
            >
              ↑
            </button>
            <button
              className="rounded border border-surface-700 px-1.5 py-0.5 text-surface-300 hover:bg-surface-800 disabled:opacity-40"
              onClick={() => step(1)}
              disabled={matches < 2}
              title={t('viewSource.nextMatch', { defaultValue: 'Next match (Enter)' })}
            >
              ↓
            </button>
          </>
        )}
        {search && matches === 0 && (
          <span className="text-surface-500">{t('viewSource.noMatches', { defaultValue: 'No matches' })}</span>
        )}
        <label className="flex items-center gap-1 text-surface-400">
          <input
            type="checkbox"
            checked={wrap}
            onChange={(e) => setWrap(e.target.checked)}
            className="h-3 w-3"
          />
          {t('viewSource.wrap', { defaultValue: 'Wrap' })}
        </label>
        <div className="ml-auto flex gap-1.5">
          <button
            className="rounded border border-surface-700 px-2 py-0.5 text-[10px] hover:bg-surface-800"
            onClick={copy}
          >
            {t('logs.copy', { defaultValue: 'Copy' })}
          </button>
          <button
            className="rounded border border-surface-700 px-2 py-0.5 text-[10px] hover:bg-surface-800"
            onClick={download}
          >
            {t('viewSource.download', { defaultValue: 'Download' })}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-surface-950 p-3">
        <pre
          ref={preRef}
          className={clsx(
            'font-mono text-[10.5px] leading-[14px] text-surface-200',
            wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre',
          )}
        >
          {search ? highlightedBody : body}
        </pre>
      </div>
      <ViewSourceScrollEffect
        preRef={preRef}
        depKey={`${urlId}|${search}|${safeActive}`}
        enabled={search.length > 0 && matches > 0}
      />
    </div>
  );
}

/**
 * Scrolls the active `<mark data-active="true">` highlight into view
 * inside the `<pre>` block whenever the active match index changes.
 * Implemented as a tiny child component so the effect's dep array can
 * be tied to a string key without polluting the parent's render.
 */
function ViewSourceScrollEffect({
  preRef,
  depKey,
  enabled,
}: {
  preRef: React.RefObject<HTMLPreElement | null>;
  depKey: string;
  enabled: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;
    const pre = preRef.current;
    if (!pre) return;
    const active = pre.querySelector<HTMLElement>('mark[data-active="true"]');
    if (!active) return;
    // `block: 'nearest'` avoids snap-jumping when the active hit is
    // already visible. `behavior: 'smooth'` reads better than instant
    // jumps for a 200 KB body.
    active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey, enabled]);
  return null;
}

function DuplicatesView({ urlId, row }: { urlId: number; row: CrawlUrlRow }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [members, setMembers] = useState<UrlClusterMember[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMembers(null);
    window.freecrawl
      .urlClusterMembers(urlId)
      .then((rows) => {
        if (!cancelled) setMembers(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [urlId]);

  if (loading) {
    return <div className="p-3 text-[11px] text-surface-400">{t('common.loading', { defaultValue: 'Loading…' })}</div>;
  }
  if (row.clusterId === 0 || (row.clusterSize ?? 1) <= 1) {
    return (
      <div className="p-3 text-[11px] text-surface-500">
        {t('duplicates.notInCluster', { defaultValue: 'This URL is not part of a near-duplicate cluster. Run Crawl Analysis on a finished crawl, or lower the Hamming threshold in Settings → Duplicates, to widen what counts as a near-duplicate.' })}
      </div>
    );
  }
  if (!members || members.length === 0) {
    return (
      <div className="p-3 text-[11px] text-surface-500">
        {t('duplicates.noOtherMembers', { defaultValue: 'No other members in this cluster. (Cluster size {{n}}.)', n: row.clusterSize })}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-surface-800 bg-surface-900 px-3 py-1.5 text-[10px] text-surface-400">
        <span>
          {t('duplicates.cluster', { defaultValue: 'Cluster' })} <span className="text-surface-200">#{row.clusterId}</span>
        </span>
        <span>
          {t('duplicates.membersTotal', { defaultValue: '{{n}} member(s) total', n: members.length + 1 })}
        </span>
        <span className="text-surface-500">
          {t('duplicates.hammingHint', { defaultValue: '(Hamming distance from this URL — lower means more similar)' })}
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-surface-900 text-left text-[10px] text-surface-400">
            <tr>
              <th className="px-3 py-1 font-normal">{translateLabel('Hamming', lang)}</th>
              <th className="px-3 py-1 font-normal">URL</th>
              <th className="px-3 py-1 font-normal">{translateLabel('Status', lang)}</th>
              <th className="px-3 py-1 font-normal">{translateLabel('Indexability', lang)}</th>
              <th className="px-3 py-1 font-normal">{translateLabel('Words', lang)}</th>
              <th className="px-3 py-1 font-normal">{translateLabel('Inlinks', lang)}</th>
              <th className="px-3 py-1 font-normal">{translateLabel('Title', lang)}</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr
                key={m.url}
                className="border-t border-surface-800 hover:bg-surface-900"
              >
                <td className="px-3 py-1 font-mono text-emerald-300">
                  {m.hammingDistance}
                </td>
                <td
                  className="px-3 py-1 text-surface-200"
                  title={m.url}
                >
                  <a
                    href={m.url}
                    onClick={(e) => {
                      e.preventDefault();
                      void window.open(m.url, '_blank');
                    }}
                    className="hover:text-blue-400 hover:underline"
                  >
                    {m.url}
                  </a>
                </td>
                <td className="px-3 py-1 text-surface-300">{m.statusCode ?? '—'}</td>
                <td className="px-3 py-1 text-surface-300">{m.indexability}</td>
                <td className="px-3 py-1 text-surface-300">{m.wordCount ?? '—'}</td>
                <td className="px-3 py-1 text-surface-300">{m.inlinks}</td>
                <td className="px-3 py-1 text-surface-400 truncate max-w-[280px]" title={m.title ?? ''}>
                  {m.title ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function countMatches(haystack: string, needle: string): number {
  if (!needle) return 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  let count = 0;
  let pos = 0;
  while ((pos = h.indexOf(n, pos)) !== -1) {
    count++;
    pos += n.length;
  }
  return count;
}

function renderHighlighted(
  body: string,
  needle: string,
  activeIndex = -1,
): ReactNode {
  if (!needle) return body;
  const out: ReactNode[] = [];
  const lower = body.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  let pos = 0;
  // Cap at 5000 highlights so a runaway search term ("a") doesn't tank
  // the renderer with hundreds of thousands of <mark> nodes.
  const MAX_HITS = 5000;
  let hits = 0;
  while (pos < body.length && hits < MAX_HITS) {
    const idx = lower.indexOf(lowerNeedle, pos);
    if (idx === -1) {
      out.push(body.slice(pos));
      break;
    }
    if (idx > pos) out.push(body.slice(pos, idx));
    const isActive = hits === activeIndex;
    out.push(
      <mark
        key={`m${idx}`}
        data-active={isActive ? 'true' : undefined}
        className={
          isActive
            ? 'rounded bg-amber-400 text-surface-950 outline outline-1 outline-amber-200'
            : 'rounded bg-amber-500/40 text-amber-100'
        }
      >
        {body.slice(idx, idx + needle.length)}
      </mark>,
    );
    pos = idx + needle.length;
    hits++;
  }
  if (pos < body.length && hits >= MAX_HITS) {
    out.push(body.slice(pos));
  }
  return out;
}

function HttpHeadersView({
  headers,
  row,
}: {
  headers: { name: string; value: string }[];
  row: CrawlUrlRow;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const config = useAppStore((s) => s.config);
  const [side, setSide] = useState<'response' | 'request'>('response');
  // Request headers reconstructed from the active crawl config — the
  // same defaults the crawler dispatches (`defaultRequestHeaders` in
  // `@freecrawl/core/http-client`) using a renderer-safe basic-auth
  // builder. This is reconstructed-not-stored because per-URL request
  // headers are deterministic from (config, URL) and storing them
  // would multiply the row size by ~5x for zero diagnostic gain.
  const requestHeaders = useMemo(
    () => buildPreviewRequestHeaders(config, row.url),
    [config, row.url],
  );
  // Decode the status code (esp. Cloudflare 52x / 530, 4xx bot blocks,
  // 5xx-under-load) into a plain-English explanation enriched with
  // signals read off the response headers (Retry-After, cf-ray, …).
  const diag = useMemo(
    () => diagnoseStatus(row.statusCode, row.statusText, headers),
    [row.statusCode, row.statusText, headers],
  );
  const rows = side === 'response' ? headers : requestHeaders;
  // Only surface the diagnosis banner when there's something worth
  // saying — i.e. not on a clean 2xx.
  const showDiag = diag.severity !== 'ok';

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 flex shrink-0 items-center gap-1 border-b border-surface-800 bg-surface-900 px-3 py-1.5 text-[11px]">
        <button
          className={clsx(
            'rounded px-2 py-0.5',
            side === 'response'
              ? 'bg-surface-800 text-surface-100'
              : 'text-surface-400 hover:bg-surface-800/60 hover:text-surface-200',
          )}
          onClick={() => setSide('response')}
        >
          {t('detail.httpResponseTab', {
            defaultValue: 'Response ({{count}})',
            count: headers.length,
          })}
        </button>
        <button
          className={clsx(
            'rounded px-2 py-0.5',
            side === 'request'
              ? 'bg-surface-800 text-surface-100'
              : 'text-surface-400 hover:bg-surface-800/60 hover:text-surface-200',
          )}
          onClick={() => setSide('request')}
        >
          {t('detail.httpRequestTab', {
            defaultValue: 'Request ({{count}})',
            count: requestHeaders.length,
          })}
        </button>
        <span className="ml-auto text-surface-500">
          {side === 'request'
            ? t('detail.headersReconstructedNote', {
                defaultValue:
                  'Reconstructed from active crawl config — actual values may have differed if config changed since crawl.',
              })
            : t('detail.headersCapturedNote', { defaultValue: 'Captured at crawl time.' })}
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        {showDiag && <StatusDiagnosisBanner diag={diag} />}
        {rows.length === 0 ? (
          <div className="p-4 text-[11px] text-surface-500">
            {side === 'response'
              ? t('detail.noResponseHeaders', {
                  defaultValue: 'No response headers captured for this URL.',
                })
              : t('detail.noRequestHeaders', {
                  defaultValue: 'No request headers — config may be empty.',
                })}
          </div>
        ) : (
          <div className="p-3">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-surface-900">
                <tr className="text-surface-400">
                  <th className="w-64 py-1 pr-3 text-left font-medium">{translateLabel('Header', lang)}</th>
                  <th className="py-1 text-left font-medium">{translateLabel('Value', lang)}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((h) => (
                  <tr key={h.name} className="border-b border-surface-900 last:border-0">
                    <td className="py-1.5 pr-3 align-top font-mono text-surface-400">{h.name}</td>
                    <td className="break-all py-1.5 align-top font-mono text-surface-100">
                      {h.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDiagnosisBanner({ diag }: { diag: StatusDiagnosis }) {
  const { t } = useTranslation();
  const tone =
    diag.severity === 'error'
      ? { border: 'border-red-700/50', bg: 'bg-red-900/15', text: 'text-red-200', head: 'text-red-300' }
      : diag.severity === 'warning'
        ? { border: 'border-amber-700/50', bg: 'bg-amber-900/15', text: 'text-amber-200', head: 'text-amber-300' }
        : { border: 'border-blue-700/40', bg: 'bg-blue-900/15', text: 'text-blue-200', head: 'text-blue-300' };
  return (
    <div className={clsx('m-3 mb-2 rounded border px-3 py-2.5 text-[11px]', tone.border, tone.bg, tone.text)}>
      <div className={clsx('mb-1 text-[12px] font-semibold', tone.head)}>{diag.title}</div>
      <p className="leading-relaxed text-surface-200">{diag.explanation}</p>
      {diag.signals.length > 0 && (
        <div className="mt-2">
          <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-surface-400">
            {t('diag.fromHeaders', { defaultValue: 'From the response headers' })}
          </div>
          <ul className="list-disc space-y-0.5 pl-4 text-surface-200">
            {diag.signals.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {diag.causes.length > 0 && (
        <div className="mt-2">
          <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-surface-400">
            {t('diag.likelyCauses', { defaultValue: 'Likely causes' })}
          </div>
          <ul className="list-disc space-y-0.5 pl-4 text-surface-300">
            {diag.causes.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {diag.whatToDo.length > 0 && (
        <div className="mt-2">
          <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-surface-400">
            {t('diag.whatToDo', { defaultValue: 'What to do' })}
          </div>
          <ul className="list-disc space-y-0.5 pl-4 text-surface-200">
            {diag.whatToDo.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Renderer-side counterpart to `defaultRequestHeaders` in
 * `@freecrawl/core/http-client`. Kept inline (not imported from core)
 * because (a) the basic-auth path uses Node's `Buffer` which isn't
 * available in the browser, and (b) the renderer doesn't otherwise
 * pull core, so dragging it in would bloat the renderer bundle for
 * one display-only helper.
 *
 * Per-host UA matching mirrors `Crawler.resolveUserAgent`. Auth /
 * custom headers / accept-language come straight from the active
 * config. This is reconstructed at render time, so if the user
 * changed the config since the crawl ran the values reflect the
 * NEW config — that's noted to the user via the panel header banner.
 */
function buildPreviewRequestHeaders(
  config: CrawlConfig,
  url: string,
): { name: string; value: string }[] {
  const userAgent = resolvePreviewUserAgent(config, url);
  const map = new Map<string, string>();
  map.set('user-agent', userAgent);
  map.set('accept-language', config.acceptLanguage || 'en');
  map.set('accept-encoding', 'gzip, deflate, br');
  map.set(
    'accept',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  );
  if (config.auth.type === 'basic' && config.auth.username) {
    // btoa is browser-safe; the crawler uses Buffer.from(...).toString('base64')
    // which produces the same encoding.
    const creds = btoa(`${config.auth.username}:${config.auth.password ?? ''}`);
    map.set('authorization', `Basic ${creds}`);
  } else if (config.auth.type === 'bearer' && config.auth.token) {
    map.set('authorization', `Bearer ${config.auth.token}`);
  }
  // Custom headers override defaults (case-insensitive). Same logic
  // as `defaultRequestHeaders` so the preview matches reality.
  for (const [rawKey, value] of Object.entries(config.customHeaders ?? {})) {
    const key = rawKey.trim();
    if (!key) continue;
    const lower = key.toLowerCase();
    for (const existing of [...map.keys()]) {
      if (existing.toLowerCase() === lower) map.delete(existing);
    }
    map.set(key, value);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

/**
 * Renderer counterpart to `Crawler.resolveUserAgent`. Walks
 * `perHostUserAgents` in order; first match wins. Pattern syntax:
 * exact host (`m.example.com`) or leading wildcard (`*.example.com`).
 */
function resolvePreviewUserAgent(config: CrawlConfig, url: string): string {
  const rules = config.perHostUserAgents ?? [];
  if (rules.length === 0) return config.userAgent;
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return config.userAgent;
  }
  for (const rule of rules) {
    const pat = rule.hostPattern.trim().toLowerCase();
    if (!pat) continue;
    if (pat.startsWith('*.')) {
      const suffix = pat.slice(1);
      if (host.endsWith(suffix) && host.length > suffix.length) {
        return rule.userAgent;
      }
    } else if (host === pat) {
      return rule.userAgent;
    }
  }
  return config.userAgent;
}

function fleschBand(score: number): string {
  if (score >= 90) return 'very easy';
  if (score >= 80) return 'easy';
  if (score >= 70) return 'fairly easy';
  if (score >= 60) return 'standard';
  if (score >= 50) return 'fairly difficult';
  if (score >= 30) return 'difficult';
  return 'very difficult';
}

function NameValueView({ row }: { row: CrawlUrlRow }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  // Server-side pixel-width is the source of truth (drives the issue
  // filters); fall back to the renderer estimate only when the column is
  // legitimately 0 because the title/desc is empty.
  const pixelWidthTitle =
    row.title && row.titlePixelWidth > 0
      ? row.titlePixelWidth
      : row.title
        ? measurePixelWidth(row.title, 15)
        : null;
  const pixelWidthDesc =
    row.metaDescription && row.metaPixelWidth > 0
      ? row.metaPixelWidth
      : row.metaDescription
        ? measurePixelWidth(row.metaDescription, 13)
        : null;

  // Lazy-load TLS cert info for HTTPS URLs only. The lookup is cheap
  // (single primary-key fetch on `host_certs`) but skipped entirely for
  // HTTP URLs so we don't pay an IPC round-trip on every selection.
  const [cert, setCert] = useState<UrlCertInfoResult | null>(null);
  useEffect(() => {
    if (!row.url.startsWith('https://')) {
      setCert(null);
      return;
    }
    let cancelled = false;
    void window.freecrawl
      .urlCertInfo({ id: row.id })
      .then((r) => {
        if (!cancelled) setCert(r);
      })
      .catch(() => {
        /* ignore — cert info is best-effort */
      });
    return () => {
      cancelled = true;
    };
  }, [row.id, row.url]);

  const certExpiryLabel =
    cert && cert.daysUntilExpiry !== null
      ? cert.daysUntilExpiry < 0
        ? `EXPIRED (${Math.abs(cert.daysUntilExpiry)} days ago)`
        : cert.daysUntilExpiry <= 30
          ? `Expires in ${cert.daysUntilExpiry} days (renew soon)`
          : `Expires in ${cert.daysUntilExpiry} days`
      : null;

  const fields: [string, string | number | null | undefined][] = [
    ['Address', row.url],
    ['Status Code', row.statusCode],
    ['Status', row.statusText ?? (row.statusCode === null ? null : httpStatusText(row.statusCode))],
    ['Indexability', row.indexability],
    ['Indexability Reason', row.indexabilityReason],
    ['Content Type', row.contentType],
    ['Content Kind', row.contentKind],
    ['Size (Bytes)', row.contentLength],
    ['Response Time (ms)', row.responseTimeMs],
    ['TTFB (ms)', row.ttfbMs],
    ['HTTP Protocol', row.httpProtocol],
    ['Server', row.serverHeader],
    ['Query String Length', row.queryStringLength > 0 ? row.queryStringLength : null],
    [
      'Render-Blocking (head)',
      row.renderBlockingCount > 0 ? row.renderBlockingCount : null,
    ],
    ['Keep-Alive', row.keepAlive ? 'yes' : null],
    ['Title 1', row.title],
    ['Title 1 Length', row.titleLength],
    ['Title 1 Pixel Width', pixelWidthTitle],
    ['Meta Description 1', row.metaDescription],
    ['Meta Description 1 Length', row.metaDescriptionLength],
    ['Meta Description 1 Pixel Width', pixelWidthDesc],
    ['H1-1', row.h1],
    ['H1-1 Length', row.h1Length],
    ['H1 Count', row.h1Count],
    ['H2 Count', row.h2Count],
    ['H3 Count', row.h3Count > 0 ? row.h3Count : null],
    ['H4 Count', row.h4Count > 0 ? row.h4Count : null],
    ['H5 Count', row.h5Count > 0 ? row.h5Count : null],
    ['H6 Count', row.h6Count > 0 ? row.h6Count : null],
    ['Word Count', row.wordCount],
    [
      'Boilerplate Coverage',
      // Post-crawl pass samples up to ~2K pages; URLs outside the
      // sample (or pages without a body snapshot) keep null. Show "—"
      // for null instead of "0%" so the user can tell "not computed"
      // apart from "0% boilerplate".
      row.boilerplateCoverage !== null && row.boilerplateCoverage !== undefined
        ? `${row.boilerplateCoverage}%`
        : null,
    ],
    ['Sentence Count', row.sentenceCount > 0 ? row.sentenceCount : null],
    [
      'Flesch Reading Ease',
      row.fleschReadingEase !== null
        ? `${row.fleschReadingEase} (${fleschBand(row.fleschReadingEase)})`
        : null,
    ],
    [
      'Flesch–Kincaid Grade',
      row.fleschKincaidGrade !== null ? row.fleschKincaidGrade : null,
    ],
    [
      'Gunning Fog Index',
      row.gunningFogIndex !== null ? row.gunningFogIndex : null,
    ],
    ['Complex Words', row.complexWordCount > 0 ? row.complexWordCount : null],
    ['Canonical Link Element 1', row.canonical],
    ['Canonical Count', row.canonicalCount > 1 ? row.canonicalCount : null],
    ['Canonical HTTP Header', row.canonicalHttp],
    ['Meta Robots 1', row.metaRobots],
    ['X-Robots-Tag 1', row.xRobotsTag],
    ['HTML Lang', row.lang],
    ['Viewport', row.viewport],
    ['OG Title', row.ogTitle],
    ['OG Description', row.ogDescription],
    ['OG Image', row.ogImage],
    [
      'OG Image Dimensions',
      row.ogImageWidth && row.ogImageWidth > 0 && row.ogImageHeight && row.ogImageHeight > 0
        ? `${row.ogImageWidth} × ${row.ogImageHeight}`
        : null,
    ],
    ['OG Type', row.ogType],
    ['OG URL', row.ogUrl],
    ['OG Site Name', row.ogSiteName],
    ['OG Locale', row.ogLocale],
    ['Twitter Card', row.twitterCard],
    ['Twitter Title', row.twitterTitle],
    ['Twitter Description', row.twitterDescription],
    ['Twitter Image', row.twitterImage],
    [
      'Twitter Image Dimensions',
      row.twitterImageWidth &&
      row.twitterImageWidth > 0 &&
      row.twitterImageHeight &&
      row.twitterImageHeight > 0
        ? `${row.twitterImageWidth} × ${row.twitterImageHeight}`
        : null,
    ],
    ['Meta Keywords', row.metaKeywords],
    ['Meta Author', row.metaAuthor],
    ['Meta Generator', row.metaGenerator],
    ['Theme Color', row.themeColor],
    ['Charset', row.charset],
    ['Meta Refresh', row.metaRefresh],
    ['Meta Refresh URL', row.metaRefreshUrl],
    ['TLS Protocol', cert?.protocol ?? null],
    ['TLS Cert Issuer', cert?.issuer ?? null],
    ['TLS Cert Subject', cert?.subject ?? null],
    ['TLS Cert Signature Alg', cert?.signatureAlgorithm ?? null],
    [
      'TLS Cert Chain',
      cert?.chainLength
        ? cert.chainSubjects && cert.chainSubjects.length > 0
          ? `${cert.chainLength} cert(s): ${cert.chainSubjects.join(' ← ')}`
          : `${cert.chainLength} cert(s)`
        : null,
    ],
    ['TLS Cert Valid From', cert?.validFrom ?? null],
    ['TLS Cert Valid To', cert?.validTo ?? null],
    ['TLS Cert Status', certExpiryLabel],
    ['Strict-Transport-Security', row.hsts],
    ['X-Frame-Options', row.xFrameOptions],
    ['X-Content-Type-Options', row.xContentTypeOptions],
    ['Content-Security-Policy', row.csp],
    ['Referrer-Policy', row.referrerPolicy],
    ['Permissions-Policy', row.permissionsPolicy],
    ['Access-Control-Allow-Origin', row.corsAllowOrigin],
    [
      'Access-Control-Allow-Credentials',
      row.corsAllowCredentials === -1
        ? null
        : row.corsAllowCredentials === 1
          ? 'true'
          : 'false',
    ],
    ['Access-Control-Allow-Methods', row.corsAllowMethods],
    ['Access-Control-Allow-Headers', row.corsAllowHeaders],
    ['Content-Encoding', row.contentEncoding],
    ['Analytics Tags', summarizeAnalyticsTrackers(row.analyticsTrackers)],
    ['Schema Types', row.schemaTypes],
    ['JSON-LD Blocks', row.schemaBlockCount],
    ['Invalid JSON-LD Blocks', row.schemaInvalidCount > 0 ? row.schemaInvalidCount : null],
    ['Microdata Items', row.microdataCount > 0 ? row.microdataCount : null],
    ['RDFa Attributes', row.rdfaCount > 0 ? row.rdfaCount : null],
    ['Insecure Form Actions', row.insecureFormActionCount > 0 ? row.insecureFormActionCount : null],
    ['Missing SRI (3rd-party)', row.missingSriCount > 0 ? row.missingSriCount : null],
    ['Cookies Set', row.cookiesCount > 0 ? row.cookiesCount : null],
    ['Cookies Missing Secure', row.cookiesInsecure > 0 ? row.cookiesInsecure : null],
    ['Cookies Missing HttpOnly', row.cookiesNoHttpOnly > 0 ? row.cookiesNoHttpOnly : null],
    ['Cookies Missing SameSite', row.cookiesNoSameSite > 0 ? row.cookiesNoSameSite : null],
    ['Pagination Next', row.paginationNext],
    ['Pagination Prev', row.paginationPrev],
    ['Hreflang Count', row.hreflangCount > 0 ? row.hreflangCount : null],
    ['Hreflangs', summarizeHreflangs(row.hreflangs)],
    ['AMP HTML', row.amphtml],
    ['AMP Page', row.ampPage ? 'Yes' : null],
    [
      'AMP Validation Errors',
      // The DB stores a JSON array; show "OK" when the column is empty
      // and the page IS AMP (clean validation), otherwise pretty-print
      // the comma-joined error codes so users see exactly which checks
      // failed without scrolling through a JSON literal.
      row.ampPage
        ? (() => {
            if (!row.ampValidationErrors) return 'OK';
            try {
              const parsed = JSON.parse(row.ampValidationErrors) as string[];
              if (!Array.isArray(parsed) || parsed.length === 0) return 'OK';
              return parsed.join(', ');
            } catch {
              return row.ampValidationErrors;
            }
          })()
        : null,
    ],
    ['Favicon', row.favicon],
    ['Apple Touch Icon', row.appleTouchIcon],
    ['Android / PWA Icon', row.androidIcon],
    ['Web Manifest', row.manifestUrl],
    ['Manifest Theme Color', row.manifestThemeColor],
    ['Manifest Short Name', row.manifestShortName],
    ['Manifest Display Mode', row.manifestDisplay],
    ['Manifest Scope', row.manifestScope],
    ['Manifest Icon Count', row.manifestIconCount > 0 ? row.manifestIconCount : null],
    ['PDF Title', row.pdfTitle],
    ['PDF Author', row.pdfAuthor],
    ['PDF Page Count', row.pdfPageCount],
    ['PDF Created', row.pdfCreationDate],
    ['PDF Producer', row.pdfProducer],
    ['RSS / Atom Feed', row.feedUrl],
    ['Title Tag Count', row.titleCount > 1 ? row.titleCount : null],
    ['Empty-Alt Images', row.imagesEmptyAlt > 0 ? row.imagesEmptyAlt : null],
    [
      'Lazy-Loaded Images',
      row.imagesCount > 0
        ? `${row.imagesLazy} / ${row.imagesCount} (${Math.round(
            (row.imagesLazy / row.imagesCount) * 100,
          )}%)`
        : null,
    ],
    [
      'Responsive Images',
      row.imagesCount > 0
        ? `${row.imagesResponsive} / ${row.imagesCount} (${Math.round(
            (row.imagesResponsive / row.imagesCount) * 100,
          )}%)`
        : null,
    ],
    ['<picture> Elements', row.pictureCount > 0 ? row.pictureCount : null],
    ['Form Inputs', row.formInputCount > 0 ? row.formInputCount : null],
    [
      'Form Inputs Without Label',
      row.formInputUnlabeled > 0 ? row.formInputUnlabeled : null,
    ],
    [
      'Low Contrast Elements',
      row.a11yLowContrast !== null && row.a11yLowContrast !== undefined
        ? row.a11yLowContrast
        : null,
    ],
    [
      'Focus Outline Suppressed',
      row.a11yFocusSuppressed === 1
        ? 'Yes'
        : row.a11yFocusSuppressed === 0
          ? 'No'
          : null,
    ],
    [
      'Performance Budget',
      (() => {
        const s = row.budgetStatus;
        if (s === null || s === undefined) return null;
        if (s === 0) return 'Within budget';
        const parts: string[] = [];
        if (s & 1) parts.push('Response');
        if (s & 2) parts.push('Size');
        if (s & 4) parts.push('LCP');
        if (s & 8) parts.push('CLS');
        return `Over: ${parts.join(', ')}`;
      })(),
    ],
    ['Empty Anchor Links', row.emptyAnchorCount > 0 ? row.emptyAnchorCount : null],
    ['Mixed Content (subresources)', row.mixedContentCount > 0 ? row.mixedContentCount : null],
    [
      'Mixed Content Active (blocked)',
      row.mixedContentActive > 0 ? row.mixedContentActive : null,
    ],
    [
      'Mixed Content Passive (warning)',
      row.mixedContentPassive > 0 ? row.mixedContentPassive : null,
    ],
    [
      'Redirect Chain Length',
      row.redirectChainLength > 0 ? row.redirectChainLength : null,
    ],
    ['Redirect Final URL', row.redirectFinalUrl],
    ['Redirect Loop', row.redirectLoop ? 'YES' : null],
    ['Folder Depth', row.folderDepth],
    ['Query Param Count', row.queryParamCount > 0 ? row.queryParamCount : null],
    ...customSearchRows(row.customSearchHits),
    ...extractionRows(row.extractionResults),
    ['Crawl Depth', row.depth],
    ['Inlinks', row.inlinks],
    ['Outlinks', row.outlinks],
    ['Redirect URL', row.redirectTarget],
    ['Last Crawled', row.crawledAt],
  ];

  return (
    <div className="p-3">
      <table className="w-full text-[11px]">
        <thead className="sticky top-0 bg-surface-900">
          <tr className="text-surface-400">
            <th className="w-64 py-1 pr-3 text-left font-medium">{translateLabel('Name', lang)}</th>
            <th className="py-1 text-left font-medium">{translateLabel('Value', lang)}</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(([label, value]) => (
            <tr key={label} className="border-b border-surface-900 last:border-0">
              <td className="py-1.5 pr-3 align-top text-surface-400">{translateLabel(label, lang)}</td>
              <td
                className="break-all py-1.5 font-mono text-surface-100"
                title={value !== null && value !== undefined ? String(value) : ''}
              >
                {value === null || value === undefined || value === '' ? (
                  <span className="text-surface-700">—</span>
                ) : (
                  String(value)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface LinksColumn {
  id: string;
  header: string;
  width: number;
}

/** Canonical 16-column schema for Inlinks / Outlinks (Screaming Frog parity). */
const LINK_COLUMNS: LinksColumn[] = [
  { id: 'type', header: 'Type', width: 90 },
  { id: 'from', header: 'From', width: 320 },
  { id: 'to', header: 'To', width: 320 },
  { id: 'anchor', header: 'Anchor Text', width: 220 },
  { id: 'alt-text', header: 'Alt Text', width: 180 },
  { id: 'follow', header: 'Follow', width: 70 },
  { id: 'target', header: 'Target', width: 90 },
  { id: 'rel', header: 'Rel', width: 110 },
  { id: 'status-code', header: 'Status Code', width: 90 },
  { id: 'status', header: 'Status', width: 110 },
  { id: 'path-type', header: 'Path Type', width: 130 },
  { id: 'link-path', header: 'Link Path', width: 200 },
  { id: 'link-position', header: 'Link Position', width: 110 },
  { id: 'link-origin', header: 'Link Origin', width: 100 },
  { id: 'size', header: 'Size', width: 90 },
  { id: 'transferred', header: 'Transferred', width: 100 },
];

interface LinkFactsRow {
  fromUrl: string;
  toUrl: string;
  toStatusCode: number | null;
  toSize: number | null;
  type: LinkType;
  anchor: string | null;
  altText: string | null;
  rel: string | null;
  target: string | null;
  pathType: LinkPathType | null;
  linkPath: string | null;
  linkPosition: LinkPosition | null;
  linkOrigin: LinkOrigin;
}

/** Collapse a full link record into the 16 column cells shown in the UI. */
function buildLinkRow(r: LinkFactsRow): string[] {
  const follow = r.rel?.toLowerCase().includes('nofollow') ? 'False' : 'True';
  const size = formatSize(r.toSize);
  return [
    capitalise(r.type),
    r.fromUrl,
    r.toUrl,
    r.anchor ?? '',
    r.altText ?? '',
    follow,
    r.target ?? '',
    r.rel ?? '',
    r.toStatusCode?.toString() ?? '',
    r.toStatusCode !== null && r.toStatusCode !== undefined
      ? httpStatusText(r.toStatusCode)
      : '',
    r.pathType ? capitalisePathType(r.pathType) : '',
    r.linkPath ?? '',
    r.linkPosition ? capitalise(r.linkPosition) : '',
    r.linkOrigin.toUpperCase(),
    size,
    // Transferred bytes aren't tracked separately yet (we store the
    // decoded body length); mirror Size so the column is meaningful.
    size,
  ];
}

function capitalise(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

function capitalisePathType(t: LinkPathType): string {
  switch (t) {
    case 'absolute':
      return 'Absolute';
    case 'root-relative':
      return 'Root-Relative';
    case 'path-relative':
      return 'Path-Relative';
    case 'protocol-relative':
      return 'Protocol-Relative';
  }
}

function formatSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const LINKS_MIN_COL_WIDTH = 60;
const LINKS_HEADER_HEIGHT = 24;
const LINKS_ROW_HEIGHT = 26;
const LINKS_PREFS_PREFIX = 'link-col-widths:';

function LinksView({
  tableId,
  selectedUrlId,
  total,
  shown,
  columns,
  rows,
}: {
  tableId: string;
  selectedUrlId: number | null;
  total: number;
  shown: number;
  columns: LinksColumn[];
  rows: string[][];
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const prefsKey = LINKS_PREFS_PREFIX + tableId;
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const v = window.freecrawl.prefsGet(prefsKey);
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return v as Record<string, number>;
    }
    return {};
  });
  // Selected cells keyed "rowIdx:colIdx" so the same cell set survives
  // across renders even when the rows array is reconstructed by the parent.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const anchor = useRef<{ r: number; c: number } | null>(null);
  // Drag-selection state — null when not dragging. `base` holds the
  // pre-drag snapshot so Ctrl+drag can union drag range with prior picks.
  const dragRef = useRef<
    | { kind: 'cell'; aR: number; aC: number; r: number; c: number; additive: boolean; base: Set<string> }
    | { kind: 'column'; aC: number; c: number; additive: boolean; base: Set<string> }
    | null
  >(null);
  // Right-click context-menu position. Null = menu hidden. The menu is a
  // small in-page popover (not the native Electron menu) so we can wire
  // it up without round-tripping through IPC for every click.
  const [menu, setMenu] = useState<
    | { x: number; y: number; row: number; col: number }
    | null
  >(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  // Virtualize the rows — multi-select aggregates up to 50 URLs' links
  // (MULTI_DETAIL_LIMIT), so this table can hit 25k+ rows and a plain
  // rows.map would render ~400k DOM nodes and freeze the renderer. Fixed
  // row height keeps estimateSize exact; overscan masks the sticky-header
  // offset the same way the main URLs table does (CLAUDE.md 4.5).
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => LINKS_ROW_HEIGHT,
    overscan: 20,
  });
  // `selected` and `rows` change every render; keep the latest in refs
  // so the document-level keydown listener can read them without being
  // re-attached on every state change.
  const selectedRef = useRef(selected);
  const rowsRef = useRef(rows);
  selectedRef.current = selected;
  rowsRef.current = rows;

  // Reset selection when the detail target or table switches — otherwise
  // stale cells from a previous URL would remain highlighted.
  useEffect(() => {
    setSelected(new Set());
    setMenu(null);
    anchor.current = null;
    dragRef.current = null;
  }, [selectedUrlId, tableId]);

  // Clearing the drag on any mouseup guarantees that releasing the button
  // outside the table doesn't leave a "sticky" drag that extends on the
  // next mouseenter.
  useEffect(() => {
    const onUp = () => {
      dragRef.current = null;
    };
    document.addEventListener('mouseup', onUp);
    return () => document.removeEventListener('mouseup', onUp);
  }, []);

  // Ctrl/Cmd+C: copy the current cell selection to the clipboard as TSV.
  // Listening at the document level means the user doesn't have to focus
  // the table first — pressing the shortcut while there's at least one
  // selected cell in this LinksView is enough.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key !== 'c' && e.key !== 'C') return;
      const sel = selectedRef.current;
      if (sel.size === 0) return;
      // Don't override copy when the user is in an input/textarea — they
      // probably want the input's selection, not ours.
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }
      e.preventDefault();
      void copyCellsToClipboard(sel, rowsRef.current);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close the context menu on outside click / scroll / escape so it
  // doesn't get left dangling when the user clicks elsewhere.
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', close, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', close, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const getWidth = (c: LinksColumn): number => colWidths[c.id] ?? c.width;
  const totalWidth = columns.reduce((n, c) => n + getWidth(c), 0);

  const writeWidths = (next: Record<string, number>) => {
    if (Object.keys(next).length === 0) {
      window.freecrawl.prefsDelete(prefsKey);
    } else {
      window.freecrawl.prefsSet(prefsKey, next);
    }
  };

  const startResize = (id: string, startWidth: number, clientX: number) => {
    const startX = clientX;
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const next = Math.max(LINKS_MIN_COL_WIDTH, Math.round(startWidth + delta));
      setColWidths((prev) => {
        const updated = { ...prev, [id]: next };
        writeWidths(updated);
        return updated;
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const resetColumn = (id: string) => {
    setColWidths((prev) => {
      const next = { ...prev };
      delete next[id];
      writeWidths(next);
      return next;
    });
  };

  const cellKey = (r: number, c: number) => `${r}:${c}`;

  const handleCellClick = (r: number, c: number, e: React.MouseEvent) => {
    // Shift+Click extends a vertical range within the anchor column. Users
    // expect Excel-like behaviour; rectangular multi-column ranges can come
    // later.
    if (e.shiftKey && anchor.current) {
      const a = anchor.current;
      const next = new Set(selected);
      if (a.c === c) {
        const [lo, hi] = a.r < r ? [a.r, r] : [r, a.r];
        for (let i = lo; i <= hi; i++) next.add(cellKey(i, c));
      } else {
        next.add(cellKey(r, c));
      }
      setSelected(next);
      return;
    }
    // Ctrl/Cmd+Click: toggle the single cell in the current selection.
    if (e.ctrlKey || e.metaKey) {
      const next = new Set(selected);
      const k = cellKey(r, c);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      setSelected(next);
      anchor.current = { r, c };
      return;
    }
    // Plain click: single-cell. Clicking the only selected cell again
    // clears the selection (matches spreadsheet behaviour).
    const k = cellKey(r, c);
    if (selected.size === 1 && selected.has(k)) {
      setSelected(new Set());
      anchor.current = null;
      return;
    }
    setSelected(new Set([k]));
    anchor.current = { r, c };
  };

  const handleHeaderClick = (c: number, e: React.MouseEvent) => {
    const keys = rows.map((_, r) => cellKey(r, c));
    if (e.ctrlKey || e.metaKey) {
      const next = new Set(selected);
      const allSelected = keys.every((k) => next.has(k));
      if (allSelected) {
        for (const k of keys) next.delete(k);
      } else {
        for (const k of keys) next.add(k);
      }
      setSelected(next);
      return;
    }
    setSelected(new Set(keys));
    anchor.current = rows.length > 0 ? { r: 0, c } : null;
  };

  // ──────── Drag selection ────────
  const applyCellDrag = (toR: number, toC: number) => {
    const d = dragRef.current;
    if (!d || d.kind !== 'cell') return;
    d.r = toR;
    d.c = toC;
    const loR = Math.min(d.aR, toR);
    const hiR = Math.max(d.aR, toR);
    const loC = Math.min(d.aC, toC);
    const hiC = Math.max(d.aC, toC);
    const next = new Set(d.base);
    for (let r = loR; r <= hiR; r++) {
      for (let c = loC; c <= hiC; c++) {
        next.add(cellKey(r, c));
      }
    }
    setSelected(next);
  };

  const applyColumnDrag = (toC: number) => {
    const d = dragRef.current;
    if (!d || d.kind !== 'column') return;
    d.c = toC;
    const loC = Math.min(d.aC, toC);
    const hiC = Math.max(d.aC, toC);
    const next = new Set(d.base);
    for (let c = loC; c <= hiC; c++) {
      for (let r = 0; r < rows.length; r++) {
        next.add(cellKey(r, c));
      }
    }
    setSelected(next);
  };

  const beginCellDrag = (r: number, c: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (e.shiftKey) {
      handleCellClick(r, c, e);
      return;
    }
    e.preventDefault();
    const additive = e.ctrlKey || e.metaKey;
    dragRef.current = {
      kind: 'cell',
      aR: r,
      aC: c,
      r,
      c,
      additive,
      base: additive ? new Set(selected) : new Set(),
    };
    anchor.current = { r, c };
    applyCellDrag(r, c);
  };

  const beginColumnDrag = (c: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (e.shiftKey) {
      handleHeaderClick(c, e);
      return;
    }
    e.preventDefault();
    const additive = e.ctrlKey || e.metaKey;
    dragRef.current = {
      kind: 'column',
      aC: c,
      c,
      additive,
      base: additive ? new Set(selected) : new Set(),
    };
    anchor.current = rows.length > 0 ? { r: 0, c } : null;
    applyColumnDrag(c);
  };

  const menuClickedCell =
    menu !== null ? rows[menu.row]?.[menu.col] ?? '' : '';
  const menuClickedIsUrl = isUrlLike(menuClickedCell);

  return (
    <div ref={rootRef} className="relative flex h-full select-none flex-col">
      <div className="shrink-0 px-3 pt-2 text-[11px] text-surface-500">
        {t('links.showing', { defaultValue: 'Showing' })}{' '}
        <span className="font-mono text-surface-200">{shown.toLocaleString()}</span>{' '}
        {t('links.of', { defaultValue: 'of' })}{' '}
        <span className="font-mono text-surface-200">{total.toLocaleString()}</span>
      </div>
      {rows.length === 0 ? (
        <div className="py-8 text-center text-xs text-surface-500">{t('links.noLinks', { defaultValue: 'No links.' })}</div>
      ) : (
        <div ref={scrollRef} className="mt-2 flex-1 overflow-auto">
          <div style={{ minWidth: totalWidth, width: '100%' }}>
            <div
              className="sticky top-0 z-10 flex bg-surface-900 text-[11px]"
              style={{
                minWidth: totalWidth,
                width: '100%',
                height: LINKS_HEADER_HEIGHT,
              }}
            >
              {columns.map((c, ci) => {
                const w = getWidth(c);
                return (
                  <div
                    key={c.id}
                    className="relative flex cursor-pointer items-center border-b border-r border-surface-800 pl-2 pr-3 font-medium text-surface-400 hover:text-surface-100"
                    style={{ width: w, minWidth: w, flex: `0 0 ${w}px` }}
                    onMouseDown={(e) => beginColumnDrag(ci, e)}
                    onMouseEnter={() => {
                      if (dragRef.current?.kind === 'column') applyColumnDrag(ci);
                    }}
                    title={t('links.columnHint', { defaultValue: 'Click to select column · drag across headers to select multiple · drag right edge to resize' })}
                  >
                    <span className="truncate">{translateLabel(c.header, lang)}</span>
                    <div
                      className="absolute -right-1 top-0 bottom-0 z-20 w-2 cursor-col-resize hover:bg-accent-500/40"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startResize(c.id, w, e.clientX);
                      }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        resetColumn(c.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      title={t('links.dragResize', { defaultValue: 'Drag to resize · double-click to reset' })}
                    />
                  </div>
                );
              })}
              <div className="flex-1 border-b border-surface-800" />
            </div>
            <div
              className="relative"
              style={{
                height: rowVirtualizer.getTotalSize(),
                minWidth: totalWidth,
                width: '100%',
              }}
            >
            {rowVirtualizer.getVirtualItems().map((vi) => {
              const ri = vi.index;
              const r = rows[ri];
              if (!r) return null;
              return (
              <div
                key={ri}
                className="absolute left-0 top-0 flex border-b border-surface-900 text-[11px]"
                style={{
                  transform: `translateY(${vi.start}px)`,
                  minWidth: totalWidth,
                  width: '100%',
                  height: LINKS_ROW_HEIGHT,
                }}
              >
                {r.map((cell, ci) => {
                  const col = columns[ci];
                  if (!col) return null;
                  const w = getWidth(col);
                  const isSel = selected.has(cellKey(ri, ci));
                  return (
                    <div
                      key={ci}
                      className={clsx(
                        'flex cursor-cell items-center overflow-hidden border-r border-surface-900 px-2',
                        isSel
                          ? 'bg-accent-500/25 text-surface-50'
                          : 'text-surface-300 hover:bg-surface-900/60',
                        ci === 0 && !isSel && 'font-mono text-surface-100',
                        ci === 0 && isSel && 'font-mono',
                      )}
                      style={{ width: w, minWidth: w, flex: `0 0 ${w}px` }}
                      onMouseDown={(e) => beginCellDrag(ri, ci, e)}
                      onMouseEnter={() => {
                        if (dragRef.current?.kind === 'cell') applyCellDrag(ri, ci);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        // If this cell wasn't already in the selection,
                        // promote it so the menu's "Copy" scope matches
                        // the right-clicked cell — matches main-table
                        // behaviour.
                        if (!selected.has(cellKey(ri, ci))) {
                          setSelected(new Set([cellKey(ri, ci)]));
                          anchor.current = { r: ri, c: ci };
                        }
                        setMenu({ x: e.clientX, y: e.clientY, row: ri, col: ci });
                      }}
                      title={cell}
                    >
                      <span className="block truncate">
                        {cell || <span className="text-surface-700">—</span>}
                      </span>
                    </div>
                  );
                })}
                <div className="flex-1" />
              </div>
              );
            })}
            </div>
          </div>
        </div>
      )}
      {menu && (
        <CellContextMenu
          x={menu.x}
          y={menu.y}
          selectionSize={selected.size}
          clickedValue={menuClickedCell}
          clickedIsUrl={menuClickedIsUrl}
          urlCountInSelection={collectUrlsFromSelection(selected, rows).length}
          onCopy={() => {
            void copyCellsToClipboard(selected, rows);
            setMenu(null);
          }}
          onCopyValue={() => {
            void navigator.clipboard.writeText(menuClickedCell);
            setMenu(null);
          }}
          onCopyUrls={() => {
            const urls = collectUrlsFromSelection(selected, rows);
            if (urls.length > 0) {
              void writeTextToClipboard(urls.join('\n'));
            }
            setMenu(null);
          }}
          onOpen={() => {
            void window.open(menuClickedCell, '_blank');
            setMenu(null);
          }}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

/**
 * In-page context menu for the Inlinks/Outlinks tables. Lives inside the
 * LinksView so it can read the same `selected` set without prop-drilling
 * an entire menu component.
 */
function CellContextMenu({
  x,
  y,
  selectionSize,
  clickedValue,
  clickedIsUrl,
  urlCountInSelection,
  onCopy,
  onCopyValue,
  onCopyUrls,
  onOpen,
  onClose,
}: {
  x: number;
  y: number;
  selectionSize: number;
  clickedValue: string;
  clickedIsUrl: boolean;
  urlCountInSelection: number;
  onCopy: () => void;
  onCopyValue: () => void;
  onCopyUrls: () => void;
  onOpen: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const items: { label: string; action: () => void; disabled?: boolean }[] = [
    {
      label:
        selectionSize > 1
          ? t('cellMenu.copyCells', { defaultValue: 'Copy {{n}} Cells', n: selectionSize.toLocaleString() })
          : t('cellMenu.copyCell', { defaultValue: 'Copy Cell' }),
      action: onCopy,
      disabled: selectionSize === 0,
    },
  ];
  if (clickedIsUrl) {
    if (urlCountInSelection > 1) {
      items.push({
        label: t('cellMenu.copyUrls', { defaultValue: 'Copy {{n}} URLs', n: urlCountInSelection.toLocaleString() }),
        action: onCopyUrls,
      });
    } else {
      items.push({ label: t('cellMenu.copyUrl', { defaultValue: 'Copy URL' }), action: onCopyValue });
    }
    items.push({ label: t('cellMenu.openInBrowser', { defaultValue: 'Open in Browser' }), action: onOpen });
  } else if (clickedValue) {
    items.push({ label: t('cellMenu.copyValue', { defaultValue: 'Copy Value' }), action: onCopyValue });
  }

  return (
    <div
      className="fixed z-50 min-w-[180px] rounded border border-surface-700 bg-surface-900 py-1 text-[11px] shadow-lg"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          disabled={it.disabled}
          onClick={() => !it.disabled && it.action()}
          className={clsx(
            'block w-full px-3 py-1 text-left',
            it.disabled
              ? 'cursor-not-allowed text-surface-600'
              : 'text-surface-200 hover:bg-accent-500/30 hover:text-surface-50',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function isUrlLike(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

/**
 * Pull every URL-looking cell value out of the current selection,
 * de-duplicate while preserving first-seen order (row → column), and
 * return them as an array. Used by the right-click "Copy N URLs"
 * action so a multi-cell selection in the From / To columns produces
 * one URL per line on the clipboard.
 */
function collectUrlsFromSelection(
  selected: Set<string>,
  rows: string[][],
): string[] {
  if (selected.size === 0) return [];
  const keys = [...selected].sort((a, b) => {
    const [ra, ca] = a.split(':').map((n) => Number(n));
    const [rb, cb] = b.split(':').map((n) => Number(n));
    return (ra ?? 0) - (rb ?? 0) || (ca ?? 0) - (cb ?? 0);
  });
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of keys) {
    const [rs, cs] = k.split(':');
    const r = Number(rs);
    const c = Number(cs);
    if (!Number.isFinite(r) || !Number.isFinite(c)) continue;
    const value = rows[r]?.[c] ?? '';
    if (isUrlLike(value) && !seen.has(value)) {
      seen.add(value);
      out.push(value);
    }
  }
  return out;
}

/**
 * Write `text` to the OS clipboard with the same fallback chain as
 * `copyCellsToClipboard` — async API first, hidden textarea +
 * execCommand if the API is unavailable or permission-denied.
 */
async function writeTextToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
    }
  }
}

/**
 * Build a TSV string from the selected cells of a 2-D table and write it
 * to the OS clipboard. Cells are grouped by row (preserving the row
 * order shown in the UI) and within a row by ascending column index, so
 * paste-ing into a spreadsheet drops cells into matching grid positions.
 */
async function copyCellsToClipboard(
  selected: Set<string>,
  rows: string[][],
): Promise<void> {
  if (selected.size === 0) return;
  // Group selected cells by row index → list of column indexes.
  const byRow = new Map<number, number[]>();
  for (const k of selected) {
    const [rs, cs] = k.split(':');
    const r = Number(rs);
    const c = Number(cs);
    if (!Number.isFinite(r) || !Number.isFinite(c)) continue;
    const list = byRow.get(r);
    if (list) list.push(c);
    else byRow.set(r, [c]);
  }
  const sortedRows = [...byRow.keys()].sort((a, b) => a - b);
  const lines: string[] = [];
  for (const r of sortedRows) {
    const row = rows[r];
    if (!row) continue;
    const cols = (byRow.get(r) ?? []).sort((a, b) => a - b);
    lines.push(cols.map((c) => row[c] ?? '').join('\t'));
  }
  const text = lines.join('\n');
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Clipboard API can fail (e.g. when window not focused); fall back
    // to a hidden textarea + execCommand which works in Electron even
    // when the clipboard permission is unset.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
    }
  }
}

function SerpSnippet({ row }: { row: CrawlUrlRow }) {
  const { t } = useTranslation();
  const title = row.title ?? t('serp.noTitle', { defaultValue: '(no title)' });
  const desc = row.metaDescription ?? t('serp.noMeta', { defaultValue: '(no meta description)' });
  const titlePx = row.title ? measurePixelWidth(row.title, 15) : 0;
  const descPx = row.metaDescription ? measurePixelWidth(row.metaDescription, 13) : 0;
  const titleLimit = 600;
  const descLimit = 990;
  const charsSuffix = t('serp.chars', { defaultValue: 'chars' });

  return (
    <div className="p-5">
      <div className="max-w-[580px] rounded border border-surface-800 bg-surface-900 p-4">
        <div className="mb-1 truncate text-[12px] text-surface-400">{displayUrl(row.url)}</div>
        <div
          className="mb-1 text-[18px] leading-snug text-[#8ab4f8]"
          style={{ maxWidth: 600 }}
        >
          {title.length > 100 ? title.slice(0, 100) + '…' : title}
        </div>
        <div className="text-[13px] leading-snug text-surface-300" style={{ maxWidth: 600 }}>
          {desc.length > 200 ? desc.slice(0, 200) + '…' : desc}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
        <InfoLine label={t('serp.titlePixelWidth', { defaultValue: 'Title pixel width' })} value={`${titlePx}px / ${titleLimit}px`} warn={titlePx > titleLimit} />
        <InfoLine label={t('serp.titleLength', { defaultValue: 'Title length' })} value={String(row.titleLength ?? 0) + ' ' + charsSuffix} />
        <InfoLine
          label={t('serp.descriptionPixelWidth', { defaultValue: 'Description pixel width' })}
          value={`${descPx}px / ${descLimit}px`}
          warn={descPx > descLimit}
        />
        <InfoLine
          label={t('serp.descriptionLength', { defaultValue: 'Description length' })}
          value={String(row.metaDescriptionLength ?? 0) + ' ' + charsSuffix}
        />
      </div>
    </div>
  );
}

function InfoLine({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded border border-surface-800 bg-surface-900 px-3 py-2">
      <span className="text-surface-400">{label}</span>
      <span className={clsx('font-mono', warn ? 'text-amber-400' : 'text-surface-100')}>
        {value}
      </span>
    </div>
  );
}

function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname === '/' ? '' : u.pathname);
  } catch {
    return url;
  }
}

// Crude pixel-width approximation using a canvas
let canvas: HTMLCanvasElement | null = null;
function measurePixelWidth(text: string, fontPx: number): number {
  if (!canvas) {
    canvas = document.createElement('canvas');
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;
  ctx.font = `${fontPx}px Arial, sans-serif`;
  return Math.round(ctx.measureText(text).width);
}

function httpStatusText(code: number): string {
  if (code >= 200 && code < 300) return 'OK';
  if (code >= 300 && code < 400) return 'Redirect';
  if (code >= 400 && code < 500) return 'Client Error';
  if (code >= 500) return 'Server Error';
  return '';
}

/**
 * Render the JSON-stringified hreflang array as a single line of
 * `lang -> href` pairs, separated by ` · `. Returns null on empty/parse
 * failure so the row falls back to the "—" placeholder.
 */
/**
 * Expand the `custom_search_hits` JSON into one detail-panel row per
 * search term (`Custom: <term>` → `<count>`). Returns an empty array on
 * absent or malformed JSON so the surrounding row list isn't disturbed.
 */
/**
 * Expand the `extraction_results` JSON into one detail-panel row per
 * configured rule (`Extract: <name>` → `<value>`). Arrays are joined
 * with " | " for compact display; objects are pretty-stringified.
 * Empty array on absent / malformed JSON.
 */
function extractionRows(
  json: string | null,
): [string, string | number | null][] {
  if (!json) return [];
  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    if (!obj || typeof obj !== 'object') return [];
    const out: [string, string | number | null][] = [];
    for (const [name, raw] of Object.entries(obj)) {
      let display: string | number | null = null;
      if (raw === null || raw === undefined) display = null;
      else if (typeof raw === 'string') display = raw;
      else if (typeof raw === 'number') display = raw;
      else if (Array.isArray(raw)) display = raw.map(String).join(' | ');
      else display = JSON.stringify(raw);
      out.push([`Extract: ${name}`, display]);
    }
    return out;
  } catch {
    return [];
  }
}

function customSearchRows(
  json: string | null,
): [string, number | string | null][] {
  if (!json) return [];
  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    if (!obj || typeof obj !== 'object') return [];
    const out: [string, number | string | null][] = [];
    for (const [term, raw] of Object.entries(obj)) {
      const count = typeof raw === 'number' ? raw : null;
      // -1 is a sentinel for "regex pattern failed to compile" — surface
      // it explicitly so the user can fix the typo. 0 is hidden to keep
      // the panel compact (users care about hits, not absences).
      if (count === -1) {
        out.push([`Custom: "${term}"`, 'invalid regex']);
      } else {
        out.push([`Custom: "${term}"`, count && count > 0 ? count : null]);
      }
    }
    return out;
  } catch {
    return [];
  }
}

function summarizeHreflangs(json: string | null): string | null {
  if (!json) return null;
  try {
    const arr = JSON.parse(json) as { lang: string; href: string }[];
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr.map((h) => `${h.lang} → ${h.href}`).join(' · ');
  } catch {
    return null;
  }
}

interface AnalyticsTrackerEntry {
  name: string;
  id: string | null;
}

function parseAnalyticsTrackers(json: string | null): AnalyticsTrackerEntry[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json) as AnalyticsTrackerEntry[];
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (t) => t && typeof t.name === 'string' && t.name.length > 0,
    );
  } catch {
    return [];
  }
}

function summarizeAnalyticsTrackers(json: string | null): string | null {
  const list = parseAnalyticsTrackers(json);
  if (list.length === 0) return null;
  return list.map((t) => (t.id ? `${t.name} (${t.id})` : t.name)).join(' · ');
}

interface ParsedCookie {
  name: string;
  domain: string | null;
  path: string | null;
  expires: string | null;
  maxAge: string | null;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string | null;
}

/**
 * Parse a single Set-Cookie header into its name + security attributes.
 * The cookie value itself is intentionally discarded — we only show what
 * matters for an SEO/security audit (name + flags + scope).
 */
function parseSetCookieHeader(raw: string): ParsedCookie | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const segments = trimmed.split(';').map((s) => s.trim());
  const first = segments[0] ?? '';
  const eq = first.indexOf('=');
  const name = eq >= 0 ? first.slice(0, eq).trim() : first;
  if (!name) return null;
  let domain: string | null = null;
  let path: string | null = null;
  let expires: string | null = null;
  let maxAge: string | null = null;
  let secure = false;
  let httpOnly = false;
  let sameSite: string | null = null;
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i] ?? '';
    if (!seg) continue;
    const lower = seg.toLowerCase();
    if (lower === 'secure') secure = true;
    else if (lower === 'httponly') httpOnly = true;
    else if (lower.startsWith('domain=')) domain = seg.slice(7).trim() || null;
    else if (lower.startsWith('path=')) path = seg.slice(5).trim() || null;
    else if (lower.startsWith('expires=')) expires = seg.slice(8).trim() || null;
    else if (lower.startsWith('max-age=')) maxAge = seg.slice(8).trim() || null;
    else if (lower.startsWith('samesite=')) sameSite = seg.slice(9).trim() || null;
  }
  return { name, domain, path, expires, maxAge, secure, httpOnly, sameSite };
}

/**
 * Same comma-handling logic as `extractSetCookies` in the core package, but
 * client-side because the renderer can't import from `@freecrawl/core`
 * (Node-only).
 */
function splitJoinedSetCookie(joined: string): string[] {
  const out: string[] = [];
  let buf = '';
  for (let i = 0; i < joined.length; i++) {
    const ch = joined[i];
    if (ch === ',') {
      let j = i + 1;
      while (j < joined.length && joined[j] === ' ') j++;
      const rest = joined.slice(j);
      if (/^[!#$%&'*+\-.^_`|~A-Za-z0-9]+\s*=/.test(rest)) {
        if (buf.trim()) out.push(buf.trim());
        buf = '';
        continue;
      }
    }
    buf += ch ?? '';
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function CookiesView({
  row,
  headers,
}: {
  row: CrawlUrlRow;
  headers: { name: string; value: string }[];
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const cookies: ParsedCookie[] = [];
  for (const h of headers) {
    if (h.name.toLowerCase() !== 'set-cookie') continue;
    for (const raw of splitJoinedSetCookie(h.value)) {
      const parsed = parseSetCookieHeader(raw);
      if (parsed) cookies.push(parsed);
    }
  }

  if (cookies.length === 0) {
    return (
      <div className="p-4 text-[11px] text-surface-500">
        {t('cookies.emptyPrefix', { defaultValue: 'This page did not set any cookies (no' })}{' '}
        <span className="font-mono">Set-Cookie</span>{' '}
        {t('cookies.emptySuffix', { defaultValue: 'response headers).' })}
        <div className="mt-2 text-[10px] text-surface-600">
          {t('cookies.emptyNote', { defaultValue: 'Note: only first-party cookies set by the page itself are listed here. Cookies set by third-party scripts (analytics, ads) are set in the browser at runtime and are not visible to a static crawler.' })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="mb-2 flex flex-wrap gap-3 text-[11px] text-surface-400">
        <span>
          <span className="font-medium text-surface-200">{cookies.length}</span> {t('cookies.cookiesSet', { defaultValue: 'cookies set' })}
        </span>
        {row.cookiesInsecure > 0 && (
          <span className="text-amber-400">
            {t('cookies.missing', { defaultValue: '{{n}} missing', n: row.cookiesInsecure })} <code>Secure</code>
          </span>
        )}
        {row.cookiesNoHttpOnly > 0 && (
          <span className="text-amber-400">
            {t('cookies.missing', { defaultValue: '{{n}} missing', n: row.cookiesNoHttpOnly })} <code>HttpOnly</code>
          </span>
        )}
        {row.cookiesNoSameSite > 0 && (
          <span className="text-amber-400">
            {t('cookies.missing', { defaultValue: '{{n}} missing', n: row.cookiesNoSameSite })} <code>SameSite</code>
          </span>
        )}
      </div>
      <table className="w-full text-[11px]">
        <thead className="sticky top-0 bg-surface-900">
          <tr className="text-surface-400">
            <th className="py-1 pr-3 text-left font-medium">{translateLabel('Name', lang)}</th>
            <th className="py-1 pr-3 text-left font-medium">{translateLabel('Domain', lang)}</th>
            <th className="py-1 pr-3 text-left font-medium">{translateLabel('Path', lang)}</th>
            <th className="py-1 pr-3 text-left font-medium">{translateLabel('Expires', lang)}</th>
            <th className="py-1 pr-3 text-center font-medium">Secure</th>
            <th className="py-1 pr-3 text-center font-medium">HttpOnly</th>
            <th className="py-1 text-left font-medium">SameSite</th>
          </tr>
        </thead>
        <tbody>
          {cookies.map((c, idx) => (
            <tr
              key={`${c.name}-${idx}`}
              className="border-b border-surface-900 last:border-0"
            >
              <td className="py-1.5 pr-3 align-top font-mono text-surface-100">{c.name}</td>
              <td className="py-1.5 pr-3 align-top font-mono text-surface-300">
                {c.domain ?? <span className="text-surface-700">—</span>}
              </td>
              <td className="py-1.5 pr-3 align-top font-mono text-surface-300">
                {c.path ?? <span className="text-surface-700">/</span>}
              </td>
              <td className="py-1.5 pr-3 align-top font-mono text-surface-400">
                {c.expires ?? (c.maxAge ? `Max-Age ${c.maxAge}` : <span className="text-surface-700">session</span>)}
              </td>
              <td className="py-1.5 pr-3 text-center align-top">
                {c.secure ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span className="text-amber-400">✗</span>
                )}
              </td>
              <td className="py-1.5 pr-3 text-center align-top">
                {c.httpOnly ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span className="text-amber-400">✗</span>
                )}
              </td>
              <td className="py-1.5 align-top font-mono text-surface-300">
                {c.sameSite ?? <span className="text-amber-400">missing</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface JsonLdBlock {
  index: number;
  raw: string;
  parsed: unknown;
  ok: boolean;
}

/**
 * Pull every `<script type="application/ld+json">` block out of a raw HTML
 * body. Used by the Structured Data sub-tab to surface the actual payload
 * the page declares — supplements the per-URL `schema_types` summary with
 * the underlying JSON the parser saw.
 */
function extractJsonLdBlocks(html: string): JsonLdBlock[] {
  const blocks: JsonLdBlock[] = [];
  const re =
    /<script\b[^>]*\btype\s*=\s*['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(html)) !== null) {
    const raw = (match[1] ?? '').trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      blocks.push({ index: i, raw, parsed, ok: true });
    } catch {
      blocks.push({ index: i, raw, parsed: null, ok: false });
    }
    i++;
  }
  return blocks;
}

function StructuredDataView({
  urlId,
  row,
}: {
  urlId: number | null;
  row: CrawlUrlRow;
}) {
  const { t } = useTranslation();
  const [src, setSrc] = useState<UrlSourceResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlId === null) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void window.freecrawl
      .urlSourceGet({ id: urlId })
      .then((r) => {
        if (!cancelled) setSrc(r);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [urlId]);

  const types = (row.schemaTypes ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const blocks = src && src.body ? extractJsonLdBlocks(src.body) : [];
  const hasAnyData =
    types.length > 0 ||
    row.schemaBlockCount > 0 ||
    row.microdataCount > 0 ||
    row.rdfaCount > 0 ||
    blocks.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-surface-800 bg-surface-900/50 px-3 py-1.5 text-[11px] text-surface-400">
        <span>
          <span className="font-medium text-surface-200">{row.schemaBlockCount}</span> JSON-LD{' '}
          {t('structured.blocks', { defaultValue: 'block(s)' })}
        </span>
        {row.schemaInvalidCount > 0 && (
          <span className="text-amber-400">{t('structured.invalid', { defaultValue: '{{n}} invalid', n: row.schemaInvalidCount })}</span>
        )}
        {row.schemaMissingRequired > 0 && (
          <span className="text-red-400">{t('structured.missingRequired', { defaultValue: '{{n}} missing required', n: row.schemaMissingRequired })}</span>
        )}
        {row.schemaMissingRecommended > 0 && (
          <span className="text-amber-400">{t('structured.missingRecommended', { defaultValue: '{{n}} missing recommended', n: row.schemaMissingRecommended })}</span>
        )}
        <span>
          <span className="font-medium text-surface-200">{row.microdataCount}</span> {t('structured.microdataItems', { defaultValue: 'microdata items' })}
        </span>
        <span>
          <span className="font-medium text-surface-200">{row.rdfaCount}</span> {t('structured.rdfaAttrs', { defaultValue: 'RDFa attrs' })}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {!hasAnyData && (
          <div className="text-[11px] text-surface-500">
            {t('structured.empty', { defaultValue: 'No structured data declared on this page (no JSON-LD, microdata or RDFa).' })}
          </div>
        )}

        {types.length > 0 && (
          <div className="mb-3">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-surface-500">
              {t('structured.schemaTypes', { defaultValue: 'Schema types' })}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {types.map((t) => (
                <span
                  key={t}
                  className="rounded border border-surface-700 bg-surface-900 px-2 py-0.5 font-mono text-[11px] text-surface-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {loading && blocks.length === 0 && (
          <div className="text-[11px] text-surface-500">{t('structured.loadingSource', { defaultValue: 'Loading source…' })}</div>
        )}

        {blocks.length > 0 && (
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-wide text-surface-500">
              {t('structured.jsonLdBlocks', { defaultValue: 'JSON-LD blocks' })} ({blocks.length})
            </div>
            {blocks.map((b) => (
              <div
                key={b.index}
                className="rounded border border-surface-800 bg-surface-900/40"
              >
                <div className="flex items-center gap-2 border-b border-surface-800 px-2 py-1 text-[10px] text-surface-400">
                  <span className="font-mono">{t('structured.blockN', { defaultValue: 'Block #{{n}}', n: b.index + 1 })}</span>
                  {b.ok ? (
                    <span className="text-emerald-400">{t('structured.parsedOk', { defaultValue: 'parsed OK' })}</span>
                  ) : (
                    <span className="text-amber-400">{t('structured.parseFailed', { defaultValue: 'parse failed' })}</span>
                  )}
                </div>
                <pre className="overflow-auto p-2 font-mono text-[10.5px] leading-[14px] text-surface-200">
                  {b.ok
                    ? JSON.stringify(b.parsed, null, 2)
                    : b.raw}
                </pre>
              </div>
            ))}
          </div>
        )}

        {!loading && blocks.length === 0 && row.schemaBlockCount > 0 && (
          <div className="mt-2 text-[10px] text-surface-600">
            {t('structured.snapshotUnavailable1', { defaultValue: 'JSON-LD blocks were detected during crawl but the page body snapshot is unavailable. Re-crawl with' })}{' '}
            <span className="font-mono">storeBodySnapshots</span>{' '}
            {t('structured.snapshotUnavailable2', { defaultValue: 'enabled to view the raw payload.' })}
          </div>
        )}
      </div>
    </div>
  );
}

function ImagesView({
  urlId,
  row,
}: {
  urlId: number | null;
  row: CrawlUrlRow;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [rows, setRows] = useState<UrlPageImageRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlId === null) {
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void window.freecrawl
      .urlPageImages({ id: urlId })
      .then((r) => {
        if (!cancelled) setRows(r.rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [urlId]);

  if (loading && rows.length === 0) {
    return <div className="p-4 text-[11px] text-surface-500">{t('imagesView.loading', { defaultValue: 'Loading images…' })}</div>;
  }
  if (rows.length === 0) {
    return (
      <div className="p-4 text-[11px] text-surface-500">
        {t('imagesView.emptyPrefix', { defaultValue: 'No' })}{' '}
        <code>&lt;img&gt;</code>{' '}
        {t('imagesView.emptySuffix', { defaultValue: 'tags discovered on this page.' })}
      </div>
    );
  }

  const missingAlt = rows.filter((r) => r.alt === null).length;
  const emptyAlt = rows.filter((r) => r.alt === '').length;
  const externalCount = rows.filter((r) => !r.isInternal).length;
  const LARGE_BYTES = 102_400;
  const largeCount = rows.filter(
    (r) => r.byteSize !== null && r.byteSize > LARGE_BYTES,
  ).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-surface-800 bg-surface-900/50 px-3 py-1.5 text-[11px] text-surface-400">
        <span>
          <span className="font-medium text-surface-200">{rows.length}</span> {t('imagesView.images', { defaultValue: 'images' })}
        </span>
        {missingAlt > 0 && (
          <span className="text-amber-400">{t('imagesView.missingAlt', { defaultValue: '{{n}} missing alt', n: missingAlt })}</span>
        )}
        {emptyAlt > 0 && (
          <span className="text-surface-300">{t('imagesView.emptyAlt', { defaultValue: '{{n}} empty alt (decorative)', n: emptyAlt })}</span>
        )}
        {externalCount > 0 && (
          <span>
            <span className="font-medium text-surface-200">{externalCount}</span> {t('imagesView.external', { defaultValue: 'external' })}
          </span>
        )}
        {largeCount > 0 && (
          <span className="text-amber-400">
            {t('imagesView.largeCount', { defaultValue: '{{n}} > 100 KB', n: largeCount })}
          </span>
        )}
        {row.imagesCount > rows.length && (
          <span className="text-surface-500">
            ({t('imagesView.showingFirst', {
              defaultValue: 'showing first {{shown}} of {{total}}',
              shown: rows.length,
              total: row.imagesCount,
            })})
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto p-3">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-surface-900">
            <tr className="text-surface-400">
              <th className="py-1 pr-3 text-left font-medium">{translateLabel('Source', lang)}</th>
              <th className="py-1 pr-3 text-left font-medium">{translateLabel('Alt', lang)}</th>
              <th className="py-1 pr-3 text-right font-medium">W</th>
              <th className="py-1 pr-3 text-right font-medium">H</th>
              <th className="py-1 pr-3 text-right font-medium">{translateLabel('Size', lang)}</th>
              <th className="py-1 text-left font-medium">{translateLabel('Scope', lang)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={`${r.src}-${i}`}
                className="border-b border-surface-900 last:border-0"
              >
                <td className="break-all py-1.5 pr-3 align-top font-mono text-surface-100">
                  <a
                    href={r.src}
                    onClick={(e) => {
                      e.preventDefault();
                      void window.open(r.src, '_blank');
                    }}
                    className="text-blue-300 hover:text-blue-200"
                  >
                    {r.src}
                  </a>
                </td>
                <td className="py-1.5 pr-3 align-top text-surface-200">
                  {r.alt === null ? (
                    <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-[10px] uppercase text-amber-300">
                      missing
                    </span>
                  ) : r.alt === '' ? (
                    <span className="rounded bg-surface-800 px-1.5 py-0.5 text-[10px] uppercase text-surface-400">
                      empty
                    </span>
                  ) : (
                    r.alt
                  )}
                </td>
                <td className="py-1.5 pr-3 text-right align-top font-mono text-surface-400">
                  {r.width ?? '—'}
                </td>
                <td className="py-1.5 pr-3 text-right align-top font-mono text-surface-400">
                  {r.height ?? '—'}
                </td>
                <td
                  className={clsx(
                    'py-1.5 pr-3 text-right align-top font-mono',
                    r.byteSize !== null && r.byteSize > LARGE_BYTES
                      ? 'text-amber-400'
                      : 'text-surface-400',
                  )}
                >
                  {r.byteSize === null ? '—' : formatBytesShort(r.byteSize)}
                </td>
                <td className="py-1.5 align-top text-surface-300">
                  {r.isInternal ? 'internal' : 'external'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatBytesShort(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

interface ResourceEntry {
  type: 'script' | 'stylesheet' | 'font' | 'image' | 'iframe' | 'preload';
  url: string;
  isExternal: boolean;
  attrs: Record<string, string>;
}

/**
 * Walk the body snapshot for `<script>`, `<link rel="stylesheet">`,
 * `<link rel="preload" as="font|style|script">`, and `<iframe>` references
 * — i.e. the resources the browser actually fetches when rendering the
 * page. Doesn't follow CSS @import chains; that would require fetching
 * each stylesheet which the View Source data alone can't do.
 */
function extractResources(html: string, pageUrl: string): ResourceEntry[] {
  const out: ResourceEntry[] = [];
  let pageHost = '';
  try {
    pageHost = new URL(pageUrl).host;
  } catch {
    /* ignore */
  }

  function pushRef(type: ResourceEntry['type'], rawUrl: string, attrs: Record<string, string>) {
    if (!rawUrl) return;
    if (rawUrl.startsWith('data:')) return;
    let resolved = rawUrl;
    let host = '';
    try {
      const u = new URL(rawUrl, pageUrl);
      resolved = u.href;
      host = u.host;
    } catch {
      return;
    }
    out.push({
      type,
      url: resolved,
      isExternal: host !== '' && pageHost !== '' && host !== pageHost,
      attrs,
    });
  }

  function attrMap(tag: string): Record<string, string> {
    const m: Record<string, string> = {};
    const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let mm: RegExpExecArray | null;
    while ((mm = re.exec(tag)) !== null) {
      const key = (mm[1] ?? '').toLowerCase();
      const value = mm[3] ?? mm[4] ?? mm[5] ?? '';
      m[key] = value;
    }
    return m;
  }

  const scriptRe = /<script\b([^>]*)>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRe.exec(html)) !== null) {
    const tag = match[0];
    const attrs = attrMap(tag);
    if (attrs['src']) {
      pushRef('script', attrs['src'], attrs);
    }
  }

  const linkRe = /<link\b([^>]*)>/gi;
  while ((match = linkRe.exec(html)) !== null) {
    const tag = match[0];
    const attrs = attrMap(tag);
    const rel = (attrs['rel'] ?? '').toLowerCase();
    const href = attrs['href'] ?? '';
    if (!href) continue;
    if (rel.includes('stylesheet')) {
      pushRef('stylesheet', href, attrs);
    } else if (rel.includes('preload')) {
      const as = (attrs['as'] ?? '').toLowerCase();
      if (as === 'font') pushRef('font', href, attrs);
      else if (as === 'style') pushRef('stylesheet', href, attrs);
      else if (as === 'script') pushRef('script', href, attrs);
      else if (as === 'image') pushRef('image', href, attrs);
      else pushRef('preload', href, attrs);
    }
  }

  const iframeRe = /<iframe\b([^>]*)>/gi;
  while ((match = iframeRe.exec(html)) !== null) {
    const tag = match[0];
    const attrs = attrMap(tag);
    if (attrs['src']) pushRef('iframe', attrs['src'], attrs);
  }

  return out;
}

function ResourcesView({
  urlId,
  row,
}: {
  urlId: number | null;
  row: CrawlUrlRow;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [src, setSrc] = useState<UrlSourceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<
    'all' | 'script' | 'stylesheet' | 'font' | 'iframe' | 'external'
  >('all');

  useEffect(() => {
    if (urlId === null) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void window.freecrawl
      .urlSourceGet({ id: urlId })
      .then((r) => {
        if (!cancelled) setSrc(r);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [urlId]);

  if (loading && !src) {
    return <div className="p-4 text-[11px] text-surface-500">{t('resources.loadingSource', { defaultValue: 'Loading source…' })}</div>;
  }
  if (!src || src.body === null) {
    return (
      <div className="p-4 text-[11px] text-surface-500">
        {t('resources.requiresSnapshot', { defaultValue: 'Resources view requires a stored HTML body snapshot.' })}
        <div className="mt-1 text-[10px] text-surface-600">
          {t('resources.recrawlPrefix', { defaultValue: 'Re-crawl with the' })}{' '}
          <span className="font-mono">storeBodySnapshots</span>{' '}
          {t('resources.recrawlSuffix', { defaultValue: 'setting enabled.' })}
        </div>
      </div>
    );
  }

  const resources = extractResources(src.body, row.url);
  const filtered =
    filter === 'all'
      ? resources
      : filter === 'external'
        ? resources.filter((r) => r.isExternal)
        : resources.filter((r) => r.type === filter);
  const counts = {
    all: resources.length,
    script: resources.filter((r) => r.type === 'script').length,
    stylesheet: resources.filter((r) => r.type === 'stylesheet').length,
    font: resources.filter((r) => r.type === 'font').length,
    iframe: resources.filter((r) => r.type === 'iframe').length,
    external: resources.filter((r) => r.isExternal).length,
  };

  const FILTERS: { key: typeof filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'script', label: 'Scripts', count: counts.script },
    { key: 'stylesheet', label: 'Stylesheets', count: counts.stylesheet },
    { key: 'font', label: 'Fonts', count: counts.font },
    { key: 'iframe', label: 'Iframes', count: counts.iframe },
    { key: 'external', label: 'External (3rd-party)', count: counts.external },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-surface-800 bg-surface-900/50 px-3 py-1.5 text-[11px]">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              'rounded border px-2 py-0.5 text-[10.5px]',
              filter === f.key
                ? 'border-blue-600 bg-blue-900/40 text-blue-100'
                : 'border-surface-700 text-surface-300 hover:bg-surface-800',
            )}
          >
            {translateLabel(f.label, lang)} <span className="text-surface-500">({f.count})</span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3">
        {filtered.length === 0 ? (
          <div className="text-[11px] text-surface-500">{t('resources.noMatch', { defaultValue: 'No resources match this filter.' })}</div>
        ) : (
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-surface-900">
              <tr className="text-surface-400">
                <th className="w-24 py-1 pr-3 text-left font-medium">{translateLabel('Type', lang)}</th>
                <th className="py-1 pr-3 text-left font-medium">URL</th>
                <th className="w-16 py-1 pr-3 text-center font-medium">3rd-party</th>
                <th className="py-1 text-left font-medium">{translateLabel('Hints', lang)}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const hints: string[] = [];
                if (r.attrs['async'] !== undefined) hints.push('async');
                if (r.attrs['defer'] !== undefined) hints.push('defer');
                if (
                  (r.attrs['type'] ?? '').toLowerCase() === 'module'
                ) {
                  hints.push('module');
                }
                if (r.attrs['crossorigin']) {
                  hints.push(`crossorigin=${r.attrs['crossorigin'] || 'anonymous'}`);
                }
                if (r.attrs['integrity']) hints.push('SRI');
                if ((r.attrs['media'] ?? '').toLowerCase() === 'print') {
                  hints.push('print-only');
                }
                return (
                  <tr
                    key={`${r.url}-${i}`}
                    className="border-b border-surface-900 last:border-0"
                  >
                    <td className="py-1.5 pr-3 align-top font-mono text-surface-300">
                      {r.type}
                    </td>
                    <td className="break-all py-1.5 pr-3 align-top font-mono text-surface-100">
                      <a
                        href={r.url}
                        onClick={(e) => {
                          e.preventDefault();
                          void window.open(r.url, '_blank');
                        }}
                        className="text-blue-300 hover:text-blue-200"
                      >
                        {r.url}
                      </a>
                    </td>
                    <td className="py-1.5 pr-3 text-center align-top">
                      {r.isExternal ? (
                        <span className="text-amber-400">✓</span>
                      ) : (
                        <span className="text-surface-700">—</span>
                      )}
                    </td>
                    <td className="py-1.5 align-top font-mono text-[10px] text-surface-400">
                      {hints.join(' · ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

interface MultiPage {
  id: number;
  row: CrawlUrlRow;
}

/**
 * Multi-URL Images view — used when the user has 2+ rows selected in the
 * main table. Fetches `<img>` references for each page in parallel and
 * shows them in a single flat table with a leading Page column so the
 * source URL of each image is unambiguous.
 */
function MultiImagesView({ pages }: { pages: MultiPage[] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [byPage, setByPage] = useState<Map<number, UrlPageImageRow[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const key = pages.map((p) => p.id).join(',');

  useEffect(() => {
    if (pages.length === 0) {
      setByPage(new Map());
      return;
    }
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      const results = await Promise.all(
        pages.map((p) =>
          window.freecrawl
            .urlPageImages({ id: p.id })
            .then((r): [number, UrlPageImageRow[]] => [p.id, r.rows])
            .catch((): [number, UrlPageImageRow[]] => [p.id, []]),
        ),
      );
      if (cancelled) return;
      setByPage(new Map(results));
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (loading && byPage.size === 0) {
    return <div className="p-4 text-[11px] text-surface-500">{t('imagesView.loading', { defaultValue: 'Loading images…' })}</div>;
  }
  let total = 0;
  let missingAlt = 0;
  let externalCount = 0;
  let largeCount = 0;
  const LARGE_BYTES = 102_400;
  for (const rows of byPage.values()) {
    total += rows.length;
    for (const r of rows) {
      if (r.alt === null) missingAlt++;
      if (!r.isInternal) externalCount++;
      if (r.byteSize !== null && r.byteSize > LARGE_BYTES) largeCount++;
    }
  }

  if (total === 0) {
    return (
      <div className="p-4 text-[11px] text-surface-500">
        {t('imagesView.multiEmpty', { defaultValue: 'No <img> tags discovered across the {{n}} selected pages.', n: pages.length })}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-surface-800 bg-surface-900/50 px-3 py-1.5 text-[11px] text-surface-400">
        <span>
          <span className="font-medium text-surface-200">{total.toLocaleString()}</span>{' '}
          {t('imagesView.multiSummary', { defaultValue: 'images across {{n}} pages', n: pages.length })}
        </span>
        {missingAlt > 0 && <span className="text-amber-400">{t('imagesView.missingAlt', { defaultValue: '{{n}} missing alt', n: missingAlt })}</span>}
        {externalCount > 0 && (
          <span>
            <span className="font-medium text-surface-200">{externalCount}</span> {t('imagesView.external', { defaultValue: 'external' })}
          </span>
        )}
        {largeCount > 0 && (
          <span className="text-amber-400">{t('imagesView.largeCount', { defaultValue: '{{n}} > 100 KB', n: largeCount })}</span>
        )}
      </div>
      <div className="flex-1 overflow-auto p-3">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-surface-900">
            <tr className="text-surface-400">
              <th className="py-1 pr-3 text-left font-medium">{translateLabel('Page', lang)}</th>
              <th className="py-1 pr-3 text-left font-medium">{translateLabel('Source', lang)}</th>
              <th className="py-1 pr-3 text-left font-medium">{translateLabel('Alt', lang)}</th>
              <th className="py-1 pr-3 text-right font-medium">W</th>
              <th className="py-1 pr-3 text-right font-medium">H</th>
              <th className="py-1 pr-3 text-right font-medium">{translateLabel('Size', lang)}</th>
              <th className="py-1 text-left font-medium">{translateLabel('Scope', lang)}</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => {
              const rows = byPage.get(p.id) ?? [];
              return rows.map((r, i) => (
                <tr
                  key={`${p.id}-${r.src}-${i}`}
                  className="border-b border-surface-900 last:border-0"
                >
                  <td
                    className="break-all py-1.5 pr-3 align-top font-mono text-[10px] text-surface-400"
                    title={p.row.url}
                  >
                    {p.row.url}
                  </td>
                  <td className="break-all py-1.5 pr-3 align-top font-mono text-surface-100">
                    <a
                      href={r.src}
                      onClick={(e) => {
                        e.preventDefault();
                        void window.open(r.src, '_blank');
                      }}
                      className="text-blue-300 hover:text-blue-200"
                    >
                      {r.src}
                    </a>
                  </td>
                  <td className="py-1.5 pr-3 align-top text-surface-200">
                    {r.alt === null ? (
                      <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-[10px] uppercase text-amber-300">
                        missing
                      </span>
                    ) : r.alt === '' ? (
                      <span className="rounded bg-surface-800 px-1.5 py-0.5 text-[10px] uppercase text-surface-400">
                        empty
                      </span>
                    ) : (
                      r.alt
                    )}
                  </td>
                  <td className="py-1.5 pr-3 text-right align-top font-mono text-surface-400">
                    {r.width ?? '—'}
                  </td>
                  <td className="py-1.5 pr-3 text-right align-top font-mono text-surface-400">
                    {r.height ?? '—'}
                  </td>
                  <td
                    className={clsx(
                      'py-1.5 pr-3 text-right align-top font-mono',
                      r.byteSize !== null && r.byteSize > LARGE_BYTES
                        ? 'text-amber-400'
                        : 'text-surface-400',
                    )}
                  >
                    {r.byteSize === null ? '—' : formatBytesShort(r.byteSize)}
                  </td>
                  <td className="py-1.5 align-top text-surface-300">
                    {r.isInternal ? 'internal' : 'external'}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Multi-URL Resources view — fetches each page's stored body snapshot in
 * parallel, runs the same `extractResources` parser per page, and merges
 * everything into one flat table with a leading Page column.
 */
function MultiResourcesView({ pages }: { pages: MultiPage[] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [byPage, setByPage] = useState<Map<number, ResourceEntry[]>>(new Map());
  const [missingSnapshots, setMissingSnapshots] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<
    'all' | 'script' | 'stylesheet' | 'font' | 'iframe' | 'external'
  >('all');
  const key = pages.map((p) => p.id).join(',');

  useEffect(() => {
    if (pages.length === 0) {
      setByPage(new Map());
      return;
    }
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      const results = await Promise.all(
        pages.map((p) =>
          window.freecrawl
            .urlSourceGet({ id: p.id })
            .then((r): [number, ResourceEntry[] | null] => {
              if (!r || r.body === null) return [p.id, null];
              return [p.id, extractResources(r.body, p.row.url)];
            })
            .catch((): [number, ResourceEntry[] | null] => [p.id, null]),
        ),
      );
      if (cancelled) return;
      const map = new Map<number, ResourceEntry[]>();
      let missing = 0;
      for (const [id, entries] of results) {
        if (entries === null) missing++;
        else map.set(id, entries);
      }
      setByPage(map);
      setMissingSnapshots(missing);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (loading && byPage.size === 0 && missingSnapshots === 0) {
    return <div className="p-4 text-[11px] text-surface-500">{t('resources.loadingResources', { defaultValue: 'Loading resources…' })}</div>;
  }

  const allEntries: { page: MultiPage; entry: ResourceEntry }[] = [];
  for (const p of pages) {
    const list = byPage.get(p.id);
    if (!list) continue;
    for (const entry of list) allEntries.push({ page: p, entry });
  }

  const filtered =
    filter === 'all'
      ? allEntries
      : filter === 'external'
        ? allEntries.filter((x) => x.entry.isExternal)
        : allEntries.filter((x) => x.entry.type === filter);
  const counts = {
    all: allEntries.length,
    script: allEntries.filter((x) => x.entry.type === 'script').length,
    stylesheet: allEntries.filter((x) => x.entry.type === 'stylesheet').length,
    font: allEntries.filter((x) => x.entry.type === 'font').length,
    iframe: allEntries.filter((x) => x.entry.type === 'iframe').length,
    external: allEntries.filter((x) => x.entry.isExternal).length,
  };
  const FILTERS: { key: typeof filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'script', label: 'Scripts', count: counts.script },
    { key: 'stylesheet', label: 'Stylesheets', count: counts.stylesheet },
    { key: 'font', label: 'Fonts', count: counts.font },
    { key: 'iframe', label: 'Iframes', count: counts.iframe },
    { key: 'external', label: 'External (3rd-party)', count: counts.external },
  ];

  if (allEntries.length === 0 && missingSnapshots === pages.length) {
    return (
      <div className="p-4 text-[11px] text-surface-500">
        {t('resources.multiRequiresSnapshot', { defaultValue: 'Resources view requires a stored HTML body snapshot for each page.' })}
        <div className="mt-1 text-[10px] text-surface-600">
          {t('resources.recrawlPrefix', { defaultValue: 'Re-crawl with the' })}{' '}
          <span className="font-mono">storeBodySnapshots</span>{' '}
          {t('resources.recrawlSuffix', { defaultValue: 'setting enabled.' })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-surface-800 bg-surface-900/50 px-3 py-1.5 text-[11px]">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              'rounded border px-2 py-0.5 text-[10.5px]',
              filter === f.key
                ? 'border-blue-600 bg-blue-900/40 text-blue-100'
                : 'border-surface-700 text-surface-300 hover:bg-surface-800',
            )}
          >
            {translateLabel(f.label, lang)} <span className="text-surface-500">({f.count})</span>
          </button>
        ))}
        {missingSnapshots > 0 && (
          <span className="ml-2 text-[10px] text-amber-400">
            {t('resources.missingSnapshots', { defaultValue: '{{missing}} of {{total}} pages have no stored body', missing: missingSnapshots, total: pages.length })}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto p-3">
        {filtered.length === 0 ? (
          <div className="text-[11px] text-surface-500">{t('resources.noMatch', { defaultValue: 'No resources match this filter.' })}</div>
        ) : (
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-surface-900">
              <tr className="text-surface-400">
                <th className="py-1 pr-3 text-left font-medium">{translateLabel('Page', lang)}</th>
                <th className="w-24 py-1 pr-3 text-left font-medium">{translateLabel('Type', lang)}</th>
                <th className="py-1 pr-3 text-left font-medium">URL</th>
                <th className="w-16 py-1 pr-3 text-center font-medium">3rd-party</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ page, entry }, i) => (
                <tr
                  key={`${page.id}-${entry.url}-${i}`}
                  className="border-b border-surface-900 last:border-0"
                >
                  <td
                    className="break-all py-1.5 pr-3 align-top font-mono text-[10px] text-surface-400"
                    title={page.row.url}
                  >
                    {page.row.url}
                  </td>
                  <td className="py-1.5 pr-3 align-top font-mono text-surface-300">
                    {entry.type}
                  </td>
                  <td className="break-all py-1.5 pr-3 align-top font-mono text-surface-100">
                    <a
                      href={entry.url}
                      onClick={(e) => {
                        e.preventDefault();
                        void window.open(entry.url, '_blank');
                      }}
                      className="text-blue-300 hover:text-blue-200"
                    >
                      {entry.url}
                    </a>
                  </td>
                  <td className="py-1.5 pr-3 text-center align-top">
                    {entry.isExternal ? (
                      <span className="text-amber-400">✓</span>
                    ) : (
                      <span className="text-surface-700">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ExtractedDataView({ row }: { row: CrawlUrlRow }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const extraction = row.extractionResults
    ? safeJsonParse(row.extractionResults)
    : null;
  const search = row.customSearchHits ? safeJsonParse(row.customSearchHits) : null;

  const hasExtraction =
    extraction !== null &&
    typeof extraction === 'object' &&
    Object.keys(extraction as Record<string, unknown>).length > 0;
  const hasSearch =
    search !== null &&
    typeof search === 'object' &&
    Object.keys(search as Record<string, unknown>).length > 0;

  if (!hasExtraction && !hasSearch) {
    return (
      <div className="p-4 text-[11px] text-surface-500">
        {t('extraction.empty1', { defaultValue: 'No custom extraction rules or search terms have produced data for this page.' })}
        <div className="mt-2 text-[10px] text-surface-600">
          {t('extraction.empty2', { defaultValue: 'Configure rules in' })}{' '}
          <span className="font-mono">Settings → Extraction</span>{' '}
          {t('extraction.empty3', { defaultValue: 'or search terms in' })}{' '}
          <span className="font-mono">Settings → Custom Search</span>, {t('extraction.empty4', { defaultValue: 'then re-crawl.' })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-3">
      {hasExtraction && (
        <section>
          <div className="mb-2 text-[10px] uppercase tracking-wide text-surface-500">
            {t('extraction.customExtraction', { defaultValue: 'Custom Extraction' })}
          </div>
          <table className="w-full text-[11px]">
            <thead className="bg-surface-900">
              <tr className="text-surface-400">
                <th className="w-64 py-1 pr-3 text-left font-medium">{translateLabel('Rule', lang)}</th>
                <th className="py-1 text-left font-medium">{translateLabel('Value', lang)}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(extraction as Record<string, unknown>).map(([k, v]) => (
                <tr key={k} className="border-b border-surface-900 last:border-0">
                  <td className="py-1.5 pr-3 align-top font-mono text-surface-300">{k}</td>
                  <td className="break-all py-1.5 align-top font-mono text-surface-100">
                    {formatExtractedValue(v)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {hasSearch && (
        <section>
          <div className="mb-2 text-[10px] uppercase tracking-wide text-surface-500">
            {t('extraction.customSearchHits', { defaultValue: 'Custom Search hits' })}
          </div>
          <table className="w-full text-[11px]">
            <thead className="bg-surface-900">
              <tr className="text-surface-400">
                <th className="w-64 py-1 pr-3 text-left font-medium">{translateLabel('Term', lang)}</th>
                <th className="py-1 text-right font-medium">{translateLabel('Hits', lang)}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(search as Record<string, unknown>).map(([term, count]) => (
                <tr key={term} className="border-b border-surface-900 last:border-0">
                  <td className="py-1.5 pr-3 align-top font-mono text-surface-100">{term}</td>
                  <td className="py-1.5 text-right align-top font-mono text-surface-200">
                    {Number(count).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function formatExtractedValue(v: unknown): ReactNode {
  if (v === null || v === undefined) {
    return <span className="text-surface-700">—</span>;
  }
  if (Array.isArray(v)) {
    return (
      <pre className="whitespace-pre-wrap break-all">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  }
  if (typeof v === 'object') {
    return (
      <pre className="whitespace-pre-wrap break-all">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  }
  return String(v);
}

interface HeadingEntry {
  level: number;
  text: string;
}

function parseHeadings(json: string | null): HeadingEntry[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json) as HeadingEntry[];
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (h) =>
        h &&
        typeof h.level === 'number' &&
        h.level >= 1 &&
        h.level <= 6 &&
        typeof h.text === 'string',
    );
  } catch {
    return [];
  }
}

function OutlineView({ row }: { row: CrawlUrlRow }) {
  const { t } = useTranslation();
  const outline = parseHeadings(row.headings);

  if (outline.length === 0) {
    return (
      <div className="p-4 text-[11px] text-surface-500">
        {t('outline.emptyPrefix', { defaultValue: 'This page has no detected headings (no' })}{' '}
        <code>&lt;h1&gt;</code>–<code>&lt;h6&gt;</code>{' '}
        {t('outline.emptySuffix', { defaultValue: 'elements). Pages without headings are harder for screen readers to navigate and may rank poorly for long-form queries.' })}
      </div>
    );
  }

  let prevLevel: number | null = null;
  const annotated = outline.map((h) => {
    const skipped =
      prevLevel !== null && h.level > prevLevel + 1
        ? t('outline.skipped', { defaultValue: 'Skipped: previous was h{{n}}', n: prevLevel })
        : null;
    prevLevel = h.level;
    return { ...h, skipped };
  });

  const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 } as Record<
    string,
    number
  >;
  for (const h of outline) counts[`h${h.level}`] = (counts[`h${h.level}`] ?? 0) + 1;
  const skippedCount = annotated.filter((h) => h.skipped).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-surface-800 bg-surface-900/50 px-3 py-1.5 text-[11px] text-surface-400">
        <span>
          <span className="font-medium text-surface-200">{outline.length}</span> {t('outline.headings', { defaultValue: 'headings' })}
        </span>
        {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((k) =>
          counts[k] && counts[k] > 0 ? (
            <span key={k}>
              <span className="font-mono uppercase">{k}</span> ×{counts[k]}
            </span>
          ) : null,
        )}
        {skippedCount > 0 && (
          <span className="text-amber-400">
            {t('outline.skippedCount', { defaultValue: '{{n}} skipped level(s)', n: skippedCount })}
          </span>
        )}
        {outline.length === 200 && (
          <span className="text-surface-500">{t('outline.capped', { defaultValue: '(capped at 200)' })}</span>
        )}
      </div>
      <div className="flex-1 overflow-auto p-3">
        <ol className="space-y-1 text-[11px]">
          {annotated.map((h, i) => (
            <li
              key={i}
              className={clsx(
                'flex items-start gap-2 rounded border px-2 py-1',
                h.skipped
                  ? 'border-amber-700/40 bg-amber-900/15'
                  : 'border-surface-800 bg-surface-900/40',
              )}
              style={{ marginLeft: (h.level - 1) * 18 }}
            >
              <span
                className={clsx(
                  'inline-flex h-5 min-w-[26px] items-center justify-center rounded font-mono text-[10px]',
                  h.level === 1 && 'bg-blue-700/40 text-blue-100',
                  h.level === 2 && 'bg-emerald-700/40 text-emerald-100',
                  h.level === 3 && 'bg-cyan-700/40 text-cyan-100',
                  h.level === 4 && 'bg-purple-700/40 text-purple-100',
                  h.level === 5 && 'bg-pink-700/40 text-pink-100',
                  h.level === 6 && 'bg-surface-700 text-surface-200',
                )}
              >
                H{h.level}
              </span>
              <span className="flex-1 break-words text-surface-100">
                {h.text || (
                  <span className="italic text-surface-600">{t('outline.emptyHeading', { defaultValue: '(empty heading)' })}</span>
                )}
                {h.skipped && (
                  <span className="ml-2 text-[10px] text-amber-400">
                    ⚠ {h.skipped}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
