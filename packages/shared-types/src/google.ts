/**
 * Faz 7 — Google OAuth + Search Console shared types.
 *
 * The Google integrations (Search Console, Analytics 4, Sheets) all
 * authenticate through the same OAuth "loopback" keystone: the user
 * brings their own Google Cloud OAuth Desktop client (BYOC — id +
 * secret entered in Settings → Integrations), the main process opens
 * the consent screen in the system browser, and a short-lived
 * localhost HTTP server catches the redirect. Refresh tokens are
 * encrypted at rest with `safeStorage`, exactly like API keys.
 */

/** Connection state of one OAuth-BYOC Google integration. */
export interface GoogleAuthState {
  /** True once a refresh token is stored — the integration is connected. */
  connected: boolean;
  /** The Google account email the tokens belong to, when known. */
  email: string | null;
  /** ISO timestamp the connection was established. */
  connectedAt: string | null;
}

/** Result of an interactive `googleAuthStart` consent flow. */
export interface GoogleAuthResult {
  ok: boolean;
  /** Human-readable reason when `ok` is false (cancelled, denied, …). */
  error: string | null;
  state: GoogleAuthState;
}

/** One verified property from the user's Search Console account. */
export interface GscSite {
  /** Property URL — `https://example.com/` or `sc-domain:example.com`. */
  siteUrl: string;
  /** `siteOwner` / `siteFullUser` / `siteRestrictedUser` / `siteUnverifiedUser`. */
  permissionLevel: string;
}

/** Per-URL Search Console metrics for a date range. */
export interface GscMetrics {
  clicks: number;
  impressions: number;
  /** Click-through rate, 0–1. */
  ctr: number;
  /** Average position (1 = top of the results). */
  position: number;
  /** ISO timestamp of the pull this row came from. */
  fetchedAt: string;
}

/** One Search Console tab row — a crawled page joined with its GSC data. */
export interface GscRow {
  url: string;
  statusCode: number | null;
  /** Null when this page has no Search Console impressions in the range. */
  gsc: GscMetrics | null;
  /** Null when URL Inspection has not been run for this page. */
  inspection: GscInspectionResult | null;
}

/** Result of a GSC URL Inspection API call for one URL. */
export interface GscInspectionResult {
  /** Overall verdict — `PASS` / `NEUTRAL` / `PARTIAL` / `FAIL` /
   *  `VERDICT_UNSPECIFIED`. */
  verdict: string | null;
  /** Human-readable coverage state, e.g. "Submitted and indexed". */
  coverageState: string | null;
  robotsTxtState: string | null;
  indexingState: string | null;
  /** ISO timestamp of Google's last crawl. */
  lastCrawlTime: string | null;
  /** The canonical Google picked for this page. */
  googleCanonical: string | null;
  /** The canonical the page declared. */
  userCanonical: string | null;
  status: 'ok' | 'error';
  error: string | null;
  fetchedAt: string;
}

/** Metadata describing the most recent GSC pull for the active project. */
export interface GscFetchMeta {
  /** The Search Console property the data was pulled from. */
  property: string;
  /** Date range (inclusive), `YYYY-MM-DD`. */
  startDate: string;
  endDate: string;
  fetchedAt: string;
  /** Number of page rows Search Console returned. */
  rowCount: number;
}

/** One Google Analytics 4 property the connected account can read. */
export interface Ga4Property {
  /** API resource name, e.g. `properties/123456789`. */
  propertyId: string;
  /** Friendly label, e.g. `"Acme – Marketing Site"`. */
  displayName: string;
  /** Display name of the parent account, for disambiguation. */
  accountName: string;
}

/** Per-page Google Analytics 4 metrics for a date range. */
export interface Ga4Metrics {
  sessions: number;
  users: number;
  pageviews: number;
  /** Engagement rate, 0–1 (the share of engaged sessions). */
  engagementRate: number;
  /** Average session duration in seconds. */
  avgSessionDuration: number;
  fetchedAt: string;
}

/** One Analytics tab row — a crawled page joined with its GA4 data. */
export interface Ga4Row {
  url: string;
  statusCode: number | null;
  /** Null when the page had no GA4 traffic in the range. */
  ga4: Ga4Metrics | null;
}

/** Combined per-URL Analytics view — GSC Search Analytics + GA4 +
 *  GSC URL Inspection, returned by `urlAnalyticsGet` for the detail
 *  panel's Analytics sub-tab. Any field is null when no data exists. */
export interface UrlAnalyticsDetail {
  url: string;
  gsc: GscMetrics | null;
  ga4: Ga4Metrics | null;
  inspection: GscInspectionResult | null;
}

/** Metadata describing the most recent GA4 pull for the active project. */
export interface Ga4FetchMeta {
  /** API resource name (`properties/<id>`) the data was pulled from. */
  property: string;
  /** Friendly label for the property — what the UI shows. */
  propertyName: string;
  /** Inclusive date range, `YYYY-MM-DD`. */
  startDate: string;
  endDate: string;
  fetchedAt: string;
  /** Number of page rows GA4 returned. */
  rowCount: number;
}
