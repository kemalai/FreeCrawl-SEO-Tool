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
import type { GscSite } from '@freecrawl/shared-types';
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

/** List the connected account's Search Console properties. */
export async function listSites(): Promise<GscSite[]> {
  const token = await getAccessToken('gsc');
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

/**
 * Pull per-page Search Console metrics for `[startDate, endDate]`
 * (`YYYY-MM-DD`, inclusive). Pages transparently past the 25 000-row
 * API limit and returns the flattened list.
 */
export async function querySearchAnalytics(
  property: string,
  startDate: string,
  endDate: string,
): Promise<GscPageRow[]> {
  const token = await getAccessToken('gsc');
  const endpoint = `${API_BASE}/sites/${encodeURIComponent(
    property,
  )}/searchAnalytics/query`;
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
    if (rows.length < ROW_LIMIT || out.length >= MAX_ROWS) break;
    startRow += ROW_LIMIT;
  }
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
}

/**
 * Inspect one URL via the GSC URL Inspection API. Quota is 2 000
 * calls / day per property — callers must throttle their batch.
 */
export async function inspectUrl(
  property: string,
  url: string,
): Promise<GscInspectionRaw> {
  const token = await getAccessToken('gsc');
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
    inspectionResult?: { indexStatusResult?: Record<string, unknown> };
  } | null;
  if (!res.ok || !json) throw new Error(apiError(json, res.status));
  const idx = json.inspectionResult?.indexStatusResult ?? {};
  const s = (k: string): string | null =>
    typeof idx[k] === 'string' ? (idx[k] as string) : null;
  return {
    verdict: s('verdict'),
    coverageState: s('coverageState'),
    robotsTxtState: s('robotsTxtState'),
    indexingState: s('indexingState'),
    lastCrawlTime: s('lastCrawlTime'),
    googleCanonical: s('googleCanonical'),
    userCanonical: s('userCanonical'),
  };
}
