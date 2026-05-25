/**
 * Faz 7 — Third-party SEO authority data providers.
 *
 * Ahrefs, Majestic, Moz, and Semrush all answer the same question with
 * a different number set: "what does the wider web think of this URL?"
 * One unified tab + one storage table keep the UI and DB simple — each
 * provider's specific metrics are serialised into a `metrics` JSON
 * value, and the UI switches the visible columns per provider.
 */

export type SeoProvider = 'ahrefs' | 'majestic' | 'moz' | 'semrush';

/** Ahrefs Site Explorer URL metrics. */
export interface AhrefsMetrics {
  domainRating: number | null;
  urlRating: number | null;
  backlinks: number | null;
  refDomains: number | null;
}

/** Majestic GetIndexItemInfo URL metrics. */
export interface MajesticMetrics {
  trustFlow: number | null;
  citationFlow: number | null;
  externalBacklinks: number | null;
  refDomains: number | null;
}

/** Moz Link Explorer / Mozscape URL metrics. */
export interface MozMetrics {
  domainAuthority: number | null;
  pageAuthority: number | null;
  spamScore: number | null;
  linkingDomains: number | null;
}

/** Semrush URL Overview metrics (organic side). */
export interface SemrushMetrics {
  organicKeywords: number | null;
  organicTraffic: number | null;
  /** Estimated equivalent paid-ads cost (USD). */
  organicCost: number | null;
  adwordsKeywords: number | null;
}

export type SeoMetrics =
  | AhrefsMetrics
  | MajesticMetrics
  | MozMetrics
  | SemrushMetrics;

/** Per-URL SEO authority result stored in `seo_results`. */
export interface SeoResult {
  provider: SeoProvider;
  /** Provider-specific metric object — type-narrowed at the call site. */
  metrics: SeoMetrics | null;
  status: 'ok' | 'error';
  error: string | null;
  fetchedAt: string;
}

/** One SEO tab row — a crawled page joined with its provider data. */
export interface SeoRow {
  url: string;
  statusCode: number | null;
  /** Null when this page has no result for the currently-queried provider. */
  seo: SeoResult | null;
}
