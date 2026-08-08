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

/**
 * One connected Google account for an integration. A user can link
 * several accounts to the same integration (e.g. their own Search
 * Console plus a client's), each with its own refresh token; the
 * per-project settings pick which one a crawl's data comes from.
 */
export interface GoogleAccount {
  /** Opaque stable id — the key the token store and `account_id`
   *  columns use. Never the email, so a renamed/aliased address can't
   *  orphan the stored rows. */
  accountId: string;
  /** The Google account address, when the userinfo call succeeded. */
  email: string | null;
  /** ISO timestamp this account was connected. */
  connectedAt: string;
}

/** Connection state of one OAuth-BYOC Google integration. */
export interface GoogleAuthState {
  /** True once at least one account is connected. */
  connected: boolean;
  /** First connected account's email — kept for single-account callers. */
  email: string | null;
  /** ISO timestamp the first connection was established. */
  connectedAt: string | null;
  /** Every connected account, in connection order. */
  accounts: GoogleAccount[];
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
  /** Mobile Usability verdict — `PASS` / `FAIL` / `NEUTRAL` /
   *  `VERDICT_UNSPECIFIED`. Null when inspection predates this column. */
  mobileVerdict: string | null;
  /** AMP result verdict, when the page declares an AMP version. */
  ampVerdict: string | null;
  /** Rich-results verdict across all detected structured-data items. */
  richResultsVerdict: string | null;
  status: 'ok' | 'error';
  error: string | null;
  fetchedAt: string;
}

/**
 * Quick-filter presets for the Search Console tab, mirroring Screaming
 * Frog's "verified in GSC" filter dropdown. `all` / `with-data` /
 * `without-data` are the legacy values the MCP `query_gsc` tool still
 * sends; the rest are the SF-parity presets. Presets past
 * `non-indexable-with-data` need URL Inspection data to have been run;
 * `orphan` widens the candidate set to GSC URLs missing from the crawl.
 */
export type GscPreset =
  | 'all'
  | 'with-data'
  | 'without-data'
  | 'clicks-above-0'
  | 'non-indexable-with-data'
  | 'orphan'
  | 'not-on-google'
  | 'indexable-not-indexed'
  | 'on-google-with-issues'
  | 'canonical-mismatch'
  | 'not-mobile-friendly'
  | 'amp-invalid'
  | 'rich-result-invalid';

/** Date-range presets for a GSC pull. `16m` is the API's 16-month max;
 *  `custom` uses the explicit `startDate` / `endDate`. */
export type GscDateRange = '7d' | '28d' | '90d' | '16m' | 'custom';
/** Device dimension filter — API values (or `all` for no filter). */
export type GscDeviceFilter = 'all' | 'DESKTOP' | 'MOBILE' | 'TABLET';
/** Search-appearance type the metrics are pulled for. */
export type GscSearchType =
  | 'web'
  | 'image'
  | 'video'
  | 'news'
  | 'discover'
  | 'googleNews';
/** Query dimension filter operator. */
export type GscQueryFilterMode =
  | 'none'
  | 'contains'
  | 'notContains'
  | 'equals'
  | 'notEquals'
  | 'includingRegex'
  | 'excludingRegex';

/**
 * Per-project Google Search Console integration settings — the FreeCrawl
 * equivalent of Screaming Frog's "API Access → Google Search Console"
 * dialog. Stored per project (encrypted credentials stay separate); the
 * fetch reads these to shape the Search Analytics query and to decide
 * whether newly-discovered GSC URLs are crawled.
 */
export interface GscIntegrationSettings {
  /** Which connected Google account this project pulls from. Empty means
   *  "the first connected account" — the state every pre-multi-account
   *  project is in. */
  accountId: string;
  /** Last-selected Search Console property (`siteUrl`). */
  property: string;
  dateRange: GscDateRange;
  /** `YYYY-MM-DD`, only used when `dateRange === 'custom'`. */
  startDate: string;
  endDate: string;
  deviceFilter: GscDeviceFilter;
  /** ISO-3166-1 alpha-3 country code, lowercase (e.g. `usa`); '' = none. */
  countryFilter: string;
  searchType: GscSearchType;
  queryFilterMode: GscQueryFilterMode;
  queryFilterValue: string;
  /** Match trailing vs non-trailing-slash URL variants when comparing
   *  GSC URLs against crawled URLs (SF: "Match Trailing and Non-Trailing
   *  Slash URLs"). */
  matchSlash: boolean;
  /** Match uppercase vs lowercase URL variants (SF: "Match Uppercase &
   *  Lowercase URLs"). */
  matchCase: boolean;
  /** Cap the number of rows pulled (SF: "Limit Max Results"). */
  limitMaxResults: boolean;
  maxResults: number;
  /** SF: "Crawl New URLs Discovered In Google Search Console" — after a
   *  pull, feed GSC URLs that aren't in the crawl into the crawler. */
  crawlNewUrls: boolean;
}

/** Factory for the default GSC settings (a fresh object each call so the
 *  shared default can't be mutated). */
export function defaultGscSettings(): GscIntegrationSettings {
  return {
    accountId: '',
    property: '',
    dateRange: '28d',
    startDate: '',
    endDate: '',
    deviceFilter: 'all',
    countryFilter: '',
    searchType: 'web',
    queryFilterMode: 'none',
    queryFilterValue: '',
    matchSlash: true,
    matchCase: false,
    limitMaxResults: true,
    maxResults: 100000,
    crawlNewUrls: false,
  };
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

/**
 * Per-project Google Analytics 4 integration settings. Smaller than the
 * GSC equivalent — the Data API call takes no dimension filters here —
 * but it carries the same account/property selection so a project
 * remembers which of several linked GA4 accounts it reports on.
 */
export interface Ga4IntegrationSettings {
  /** Which connected Google account this project pulls from. Empty means
   *  "the first connected account". */
  accountId: string;
  /** Last-selected property resource name (`properties/<id>`). */
  property: string;
  /** Friendly label for that property, for the fetch meta line. */
  propertyName: string;
  /** Trailing window in days. */
  days: 7 | 28 | 90;
}

/** Factory for the default GA4 settings (fresh object each call). */
export function defaultGa4Settings(): Ga4IntegrationSettings {
  return { accountId: '', property: '', propertyName: '', days: 28 };
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
