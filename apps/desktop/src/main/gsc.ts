/**
 * Faz 7 — Google Search Console API client.
 *
 * Two calls back the Search Console tab:
 *   - `listSites()`        — the connected account's verified properties.
 *   - `querySearchAnalytics()` — per-page clicks / impressions / CTR /
 *     position for a date range (one bulk `page`-dimension query,
 *     transparently paged past the 25 000-row API limit).
 *
 * Authentication runs through the shared OAuth keystone
 * (`google-oauth.ts`) — `getAccessToken('gsc')` mints / refreshes the
 * bearer token; nothing here touches credentials directly.
 */
import type {
  GscSite,
  GscIntegrationSettings,
  GscSearchType,
} from '@freecrawl/shared-types';
import { getAccessToken } from './google-oauth.js';
import { apiFetch } from './api-fetch.js';
import * as logger from './logger.js';

const API_BASE = 'https://www.googleapis.com/webmasters/v3';
/** Search Console caps a single Search Analytics response at 25 000 rows. */
const ROW_LIMIT = 25000;
/** Hard ceiling on paging so a pathological site can't loop forever. */
const MAX_ROWS = 200_000;

/** Extract the human-readable message from a Google API error envelope. */
function apiError(json: unknown, status: number): string {
  const err = (json as { error?: unknown } | null)?.error;
  if (err && typeof err === 'object') {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg) return msg;
  }
  if (status === 403) {
    return 'Search Console denied access — check the account has access to this property and the Search Console API is enabled.';
  }
  return `Search Console API error (HTTP ${status})`;
}

/** List one connected account's Search Console properties. */
export async function listSites(accountId?: string): Promise<GscSite[]> {
  const token = await getAccessToken('gsc', accountId);
  const res = await apiFetch(`${API_BASE}/sites`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  });
  const json = (await res.json().catch(() => null)) as {
    siteEntry?: { siteUrl?: unknown; permissionLevel?: unknown }[];
  } | null;
  if (!res.ok || !json) throw new Error(apiError(json, res.status));
  const entries = Array.isArray(json.siteEntry) ? json.siteEntry : [];
  return entries
    .map((e) => ({
      siteUrl: typeof e.siteUrl === 'string' ? e.siteUrl : '',
      permissionLevel:
        typeof e.permissionLevel === 'string' ? e.permissionLevel : 'unknown',
    }))
    .filter((e) => e.siteUrl.length > 0);
}

/** One page-level Search Console metrics row. */
export interface GscPageRow {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/** One API dimension filter (`dimensionFilterGroups[].filters[]`). */
interface GscDimensionFilter {
  dimension: string;
  operator: string;
  expression: string;
}

/**
 * Shaping options for a Search Analytics pull, derived from the
 * per-project GSC settings (search type, device/country/query dimension
 * filters, total-row cap). Empty options reproduce the previous
 * behaviour exactly (web search, no filters, 200 K row ceiling).
 */
export interface GscQueryOptions {
  type?: GscSearchType;
  dimensionFilterGroups?: { groupType: 'and'; filters: GscDimensionFilter[] }[];
  /** Total-row cap across all pages (SF "Limit Max Results"). */
  maxRows?: number;
}

/**
 * Resolve the `[startDate, endDate]` window from the settings' date
 * range. Non-custom ranges end ~2 days ago (Search Console's data lag)
 * and span back the preset's width; `16m` uses the API's 16-month max.
 */
export function resolveGscDateRange(settings: GscIntegrationSettings): {
  startDate: string;
  endDate: string;
} {
  const isoDate = (d: Date): string => d.toISOString().slice(0, 10);
  if (settings.dateRange === 'custom' && settings.startDate && settings.endDate) {
    return { startDate: settings.startDate, endDate: settings.endDate };
  }
  const daysBack =
    settings.dateRange === '7d'
      ? 7
      : settings.dateRange === '90d'
        ? 90
        : settings.dateRange === '16m'
          ? 480
          : 28;
  const end = new Date(Date.now() - 2 * 86_400_000);
  const start = new Date(end.getTime() - (daysBack - 1) * 86_400_000);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

/** Build the API query options (type + dimension filters + row cap) from
 *  the per-project GSC settings. */
export function buildGscQueryOptions(
  settings: GscIntegrationSettings,
): GscQueryOptions {
  const filters: GscDimensionFilter[] = [];
  if (settings.deviceFilter !== 'all') {
    filters.push({
      dimension: 'device',
      operator: 'equals',
      expression: settings.deviceFilter,
    });
  }
  if (settings.countryFilter) {
    filters.push({
      dimension: 'country',
      operator: 'equals',
      expression: settings.countryFilter,
    });
  }
  if (settings.queryFilterMode !== 'none' && settings.queryFilterValue) {
    filters.push({
      dimension: 'query',
      operator: settings.queryFilterMode,
      expression: settings.queryFilterValue,
    });
  }
  const opts: GscQueryOptions = { type: settings.searchType };
  if (filters.length > 0) {
    opts.dimensionFilterGroups = [{ groupType: 'and', filters }];
  }
  if (settings.limitMaxResults) {
    opts.maxRows = Math.max(1, Math.min(1_000_000, settings.maxResults || 100000));
  }
  return opts;
}

/**
 * Pull per-page Search Console metrics for `[startDate, endDate]`
 * (`YYYY-MM-DD`, inclusive). Pages transparently past the 25 000-row
 * API limit and returns the flattened list. `opts` shapes the query
 * (search type, dimension filters, total-row cap).
 */
export async function querySearchAnalytics(
  property: string,
  startDate: string,
  endDate: string,
  opts: GscQueryOptions = {},
  accountId?: string,
): Promise<GscPageRow[]> {
  const token = await getAccessToken('gsc', accountId);
  const endpoint = `${API_BASE}/sites/${encodeURIComponent(
    property,
  )}/searchAnalytics/query`;
  const maxRows = Math.max(1, Math.min(1_000_000, opts.maxRows ?? MAX_ROWS));
  const out: GscPageRow[] = [];
  let startRow = 0;

  for (;;) {
    const res = await apiFetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: ROW_LIMIT,
        startRow,
        ...(opts.type ? { type: opts.type } : {}),
        ...(opts.dimensionFilterGroups
          ? { dimensionFilterGroups: opts.dimensionFilterGroups }
          : {}),
      }),
      signal: AbortSignal.timeout(60_000),
    });
    const json = (await res.json().catch(() => null)) as {
      rows?: {
        keys?: unknown;
        clicks?: unknown;
        impressions?: unknown;
        ctr?: unknown;
        position?: unknown;
      }[];
    } | null;
    if (!res.ok || !json) throw new Error(apiError(json, res.status));

    const rows = Array.isArray(json.rows) ? json.rows : [];
    for (const r of rows) {
      const url = Array.isArray(r.keys) ? String(r.keys[0] ?? '') : '';
      if (!url) continue;
      out.push({
        url,
        clicks: Number(r.clicks) || 0,
        impressions: Number(r.impressions) || 0,
        ctr: Number(r.ctr) || 0,
        position: Number(r.position) || 0,
      });
    }
    if (rows.length < ROW_LIMIT || out.length >= maxRows) break;
    startRow += ROW_LIMIT;
  }
  if (out.length > maxRows) out.length = maxRows;
  logger.log(
    'info',
    'gsc',
    `Search Analytics: ${out.length} page row(s) for ${property} (${startDate}…${endDate})`,
  );
  return out;
}

/** Result of one URL Inspection call — flat shape matching the DB row. */
export interface GscInspectionRaw {
  verdict: string | null;
  coverageState: string | null;
  robotsTxtState: string | null;
  indexingState: string | null;
  lastCrawlTime: string | null;
  googleCanonical: string | null;
  userCanonical: string | null;
  mobileVerdict: string | null;
  ampVerdict: string | null;
  richResultsVerdict: string | null;
}

/**
 * Inspect one URL via the GSC URL Inspection API. Quota is 2 000
 * calls / day per property — callers must throttle their batch.
 */
export async function inspectUrl(
  property: string,
  url: string,
  accountId?: string,
): Promise<GscInspectionRaw> {
  const token = await getAccessToken('gsc', accountId);
  const res = await apiFetch(
    'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inspectionUrl: url, siteUrl: property }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  const json = (await res.json().catch(() => null)) as {
    inspectionResult?: {
      indexStatusResult?: Record<string, unknown>;
      mobileUsabilityResult?: Record<string, unknown>;
      ampResult?: Record<string, unknown>;
      richResultsResult?: Record<string, unknown>;
    };
  } | null;
  if (!res.ok || !json) throw new Error(apiError(json, res.status));
  const idx = json.inspectionResult?.indexStatusResult ?? {};
  const s = (k: string): string | null =>
    typeof idx[k] === 'string' ? (idx[k] as string) : null;
  // The mobile / AMP / rich-result facets each carry their own verdict;
  // absent facets (page has no AMP, no rich results) stay null.
  const facetVerdict = (
    facet: Record<string, unknown> | undefined,
  ): string | null =>
    facet && typeof facet['verdict'] === 'string'
      ? (facet['verdict'] as string)
      : null;
  return {
    verdict: s('verdict'),
    coverageState: s('coverageState'),
    robotsTxtState: s('robotsTxtState'),
    indexingState: s('indexingState'),
    lastCrawlTime: s('lastCrawlTime'),
    googleCanonical: s('googleCanonical'),
    userCanonical: s('userCanonical'),
    mobileVerdict: facetVerdict(json.inspectionResult?.mobileUsabilityResult),
    ampVerdict: facetVerdict(json.inspectionResult?.ampResult),
    richResultsVerdict: facetVerdict(json.inspectionResult?.richResultsResult),
  };
}
