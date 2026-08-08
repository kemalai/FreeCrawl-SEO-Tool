/**
 * Faz 7 — Google Analytics 4 API client.
 *
 *   - `listProperties()` — every GA4 property the connected account
 *     can read (Analytics Admin API `accountSummaries`).
 *   - `runReport()` — per-page sessions / users / pageviews /
 *     engagement-rate / avg-session-duration for a date range, joined
 *     against the crawled URLs via the `pageLocation` dimension
 *     (full URL — no host-prefix gymnastics required).
 *
 * Auth runs through the shared OAuth keystone (`google-oauth.ts`) —
 * `getAccessToken('ga4')` mints / refreshes the bearer token; nothing
 * here touches credentials directly.
 */
import type { Ga4Property } from '@freecrawl/shared-types';
import { getAccessToken } from './google-oauth.js';
import { apiFetch } from './api-fetch.js';
import * as logger from './logger.js';

const ADMIN_BASE = 'https://analyticsadmin.googleapis.com/v1beta';
const DATA_BASE = 'https://analyticsdata.googleapis.com/v1beta';
/** GA4 Data API hard cap is 100 000 per request; 25 000 keeps payloads modest. */
const PAGE_LIMIT = 25_000;
/** Hard ceiling so a runaway property can't loop forever. */
const MAX_ROWS = 250_000;

/** Metrics requested (order matters — used by index when parsing rows). */
const METRICS = [
  'sessions',
  'activeUsers',
  'screenPageViews',
  'engagementRate',
  'averageSessionDuration',
] as const;

function apiError(json: unknown, status: number): string {
  const err = (json as { error?: unknown } | null)?.error;
  if (err && typeof err === 'object') {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg) return msg;
  }
  if (status === 403) {
    return 'GA4 denied access — confirm the account can read this property and the Analytics Admin / Data APIs are enabled.';
  }
  return `Google Analytics API error (HTTP ${status})`;
}

/** Flatten the GA4 Admin `accountSummaries` tree into a flat property list. */
export async function listProperties(
  accountId?: string,
): Promise<Ga4Property[]> {
  const token = await getAccessToken('ga4', accountId);
  const out: Ga4Property[] = [];
  let pageToken: string | undefined;
  for (;;) {
    const url = `${ADMIN_BASE}/accountSummaries?pageSize=200${
      pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''
    }`;
    const res = await apiFetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30_000),
    });
    const json = (await res.json().catch(() => null)) as {
      accountSummaries?: {
        displayName?: unknown;
        propertySummaries?: {
          property?: unknown;
          displayName?: unknown;
        }[];
      }[];
      nextPageToken?: unknown;
    } | null;
    if (!res.ok || !json) throw new Error(apiError(json, res.status));

    const summaries = Array.isArray(json.accountSummaries)
      ? json.accountSummaries
      : [];
    for (const acct of summaries) {
      const accountName = typeof acct.displayName === 'string' ? acct.displayName : '';
      const props = Array.isArray(acct.propertySummaries) ? acct.propertySummaries : [];
      for (const p of props) {
        const propertyId = typeof p.property === 'string' ? p.property : '';
        if (!propertyId) continue;
        out.push({
          propertyId,
          displayName:
            typeof p.displayName === 'string' && p.displayName
              ? p.displayName
              : propertyId,
          accountName,
        });
      }
    }
    pageToken = typeof json.nextPageToken === 'string' ? json.nextPageToken : undefined;
    if (!pageToken) break;
  }
  return out;
}

/** One per-page GA4 metrics row. */
export interface Ga4PageRow {
  url: string;
  sessions: number;
  users: number;
  pageviews: number;
  engagementRate: number;
  avgSessionDuration: number;
}

/**
 * Pull per-page metrics for `[startDate, endDate]` (`YYYY-MM-DD`).
 * Transparently pages past `PAGE_LIMIT` rows and returns the flat list.
 */
export async function runReport(
  property: string,
  startDate: string,
  endDate: string,
  accountId?: string,
): Promise<Ga4PageRow[]> {
  const token = await getAccessToken('ga4', accountId);
  const endpoint = `${DATA_BASE}/${property}:runReport`;
  const out: Ga4PageRow[] = [];
  let offset = 0;

  for (;;) {
    const res = await apiFetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pageLocation' }],
        metrics: METRICS.map((name) => ({ name })),
        limit: PAGE_LIMIT,
        offset,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    const json = (await res.json().catch(() => null)) as {
      rows?: {
        dimensionValues?: { value?: unknown }[];
        metricValues?: { value?: unknown }[];
      }[];
      rowCount?: unknown;
    } | null;
    if (!res.ok || !json) throw new Error(apiError(json, res.status));

    const rows = Array.isArray(json.rows) ? json.rows : [];
    for (const r of rows) {
      const url =
        Array.isArray(r.dimensionValues) && r.dimensionValues[0]
          ? String(r.dimensionValues[0].value ?? '')
          : '';
      if (!url) continue;
      const m = Array.isArray(r.metricValues) ? r.metricValues : [];
      const n = (i: number): number =>
        i < m.length ? Number(m[i]?.value ?? 0) || 0 : 0;
      out.push({
        url,
        sessions: n(0),
        users: n(1),
        pageviews: n(2),
        engagementRate: n(3),
        avgSessionDuration: n(4),
      });
    }
    const totalRowCount =
      typeof json.rowCount === 'number' ? json.rowCount : out.length;
    offset += rows.length;
    if (
      rows.length === 0 ||
      offset >= totalRowCount ||
      out.length >= MAX_ROWS
    ) {
      break;
    }
  }
  logger.log(
    'info',
    'ga4',
    `GA4 report: ${out.length} page row(s) for ${property} (${startDate}…${endDate})`,
  );
  return out;
}
