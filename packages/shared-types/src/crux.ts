/**
 * Chrome UX Report (CrUX) integration types.
 *
 * CrUX exposes **field** data — the 75th-percentile Core Web Vitals of
 * real Chrome users over a rolling 28-day window — via the CrUX API
 * (`chromeuxreport.googleapis.com`). Unlike PageSpeed Insights (which is
 * synthetic *lab* data from a single Lighthouse run), CrUX answers "how
 * fast is this page for actual visitors?". It is per-URL and per-origin,
 * sub-second to fetch, and requires a Google API key (no keyless mode).
 *
 * FreeCrawl drives it on-demand against a user-selected subset of crawled
 * pages and stores results per URL + form factor in the project DB. The
 * key is resolved in the main process only — it never crosses into the
 * renderer.
 */

/** Which device class CrUX aggregates real-user data for. */
export type CruxFormFactor = 'phone' | 'desktop';

/** A run can target one form factor or both. */
export type CruxRunFormFactor = CruxFormFactor | 'both';

/**
 * Field (real-user) Core Web Vitals for one URL + form factor, each the
 * 75th-percentile value across the collection window. Timing values are
 * milliseconds; `cls` is the unitless Cumulative Layout Shift score. Any
 * metric may be `null` when CrUX has no percentile for it.
 */
export interface CruxMetrics {
  /** Largest Contentful Paint p75 (ms). */
  lcp: number | null;
  /** Cumulative Layout Shift p75 (unitless). */
  cls: number | null;
  /** Interaction to Next Paint p75 (ms). */
  inp: number | null;
  /** First Contentful Paint p75 (ms). */
  fcp: number | null;
  /** Time to First Byte p75 (ms) — experimental CrUX metric. */
  ttfb: number | null;
  /**
   * `ok` — data returned; `nodata` — URL/origin has too little real-user
   * traffic for CrUX (HTTP 404, not an error); `error` — request failed.
   */
  status: 'ok' | 'nodata' | 'error';
  /** Human-readable failure reason when `status` is `error`. */
  error: string | null;
  /** Collection-period end date (`YYYY-MM-DD`) when available. */
  collectionPeriod: string | null;
  /** ISO 8601 timestamp of when the record was fetched. */
  fetchedAt: string;
}

/**
 * One row in the CrUX tab — a crawled internal HTML page with its stored
 * field metrics. `phone` / `desktop` are `null` until that form factor
 * has been fetched for the URL.
 */
export interface CruxRow {
  url: string;
  statusCode: number | null;
  phone: CruxMetrics | null;
  desktop: CruxMetrics | null;
}
