/**
 * Faz 7 — Google PageSpeed Insights integration types.
 *
 * PSI runs a Lighthouse audit on a public URL and returns lab
 * performance metrics. FreeCrawl drives it on-demand against a
 * user-selected subset of crawled pages (PSI is slow — ~10–30 s per
 * URL — and rate-limited, so auto-probing a full crawl is never an
 * option). Results are stored per URL + strategy in the project DB.
 *
 * The PSI API works without a key at a low shared rate limit; a free
 * Google Cloud API key (the `pagespeed` integration in the credential
 * store) raises the throughput. The key is resolved in the main
 * process only — it never crosses into the renderer.
 */

/** Which form factor Lighthouse emulates for the audit. */
export type PagespeedStrategy = 'mobile' | 'desktop';

/** A run can target one form factor or both. */
export type PagespeedRunStrategy = PagespeedStrategy | 'both';

/**
 * Lighthouse lab metrics for one URL + strategy. All timing values are
 * milliseconds; `cls` is the unitless Cumulative Layout Shift score.
 * Any metric may be `null` when Lighthouse could not compute it.
 */
export interface PagespeedMetrics {
  /** Lighthouse Performance category score, 0–100. */
  performance: number | null;
  /** Largest Contentful Paint (ms). */
  lcp: number | null;
  /** Cumulative Layout Shift (unitless). */
  cls: number | null;
  /** First Contentful Paint (ms). */
  fcp: number | null;
  /** Total Blocking Time (ms). */
  tbt: number | null;
  /** Speed Index (ms). */
  speedIndex: number | null;
  /** Time to Interactive (ms) — lab audit `interactive`. */
  tti: number | null;
  /**
   * Max Potential First Input Delay (ms) — lab audit `max-potential-fid`,
   * Lighthouse's worst-case input-delay estimate. The closest lab proxy
   * for the deprecated field FID metric.
   */
  maxPotentialFid: number | null;
  /**
   * Interaction to Next Paint (ms) — the Core Web Vital that replaced FID
   * in March 2024. Field (CrUX) metric from the PSI `loadingExperience`
   * block; `null` when the URL has no real-user data yet.
   */
  inp: number | null;
  /** `ok` when the audit completed, `error` when PSI/Lighthouse failed. */
  status: 'ok' | 'error';
  /** Human-readable failure reason when `status` is `error`. */
  error: string | null;
  /** ISO 8601 timestamp of when the audit was fetched. */
  fetchedAt: string;
}

/**
 * One row in the PageSpeed tab — a crawled internal HTML page with its
 * stored audit results. `mobile` / `desktop` are `null` until that
 * strategy has been run for the URL.
 */
export interface PagespeedRow {
  url: string;
  statusCode: number | null;
  mobile: PagespeedMetrics | null;
  desktop: PagespeedMetrics | null;
}
