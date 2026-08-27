import type { AiProvider } from './ai.js';
import type { SeoProvider } from './seo.js';

/**
 * Tables the Export dialog can emit that are NOT views over `CrawlUrlRow`.
 *
 * The main URL tabs (Internal, Page Titles, Directives, …) all project the
 * same `urls` row, so the tabular exporter streams `CrawlUrlRow`s and the
 * dialog offers `CrawlUrlRow` keys as columns. The integration and
 * link-graph tabs have their own row shapes — a Search Console row is a
 * page joined with its clicks / impressions / inspection verdict, a Broken
 * Links row is one edge of the link graph — and each has its own DB query.
 * A dataset key names one of those queries; its column catalogue below
 * tells the dialog what to offer and the exporter what to read.
 *
 * AI and SEO Authority results are stored per provider, so those datasets
 * are keyed by provider — one sheet per provider, each with the metric
 * columns that provider actually returns.
 */
export type ExportDatasetKey =
  | 'images'
  | 'broken-links'
  | 'pagespeed'
  | 'crux'
  | 'spelling'
  | 'search-console'
  | 'analytics'
  | `ai:${AiProvider}`
  | `seo:${SeoProvider}`;

export interface ExportDatasetColumn {
  /**
   * Dotted path into the dataset's row object — `gsc.clicks` reads
   * `row.gsc?.clicks`, so a page with no Search Console data exports an
   * empty cell rather than failing the row.
   */
  key: string;
  /** Column header, in English; translated through `labels.ts` in the UI. */
  header: string;
}

const PAGE: ExportDatasetColumn[] = [
  { key: 'url', header: 'URL' },
  { key: 'statusCode', header: 'Status' },
];

function pagespeedColumns(device: 'mobile' | 'desktop', label: string): ExportDatasetColumn[] {
  return [
    { key: `${device}.performance`, header: `${label} Performance` },
    { key: `${device}.lcp`, header: `${label} LCP` },
    { key: `${device}.cls`, header: `${label} CLS` },
    { key: `${device}.fcp`, header: `${label} FCP` },
    { key: `${device}.tbt`, header: `${label} TBT` },
    { key: `${device}.speedIndex`, header: `${label} Speed Index` },
    { key: `${device}.tti`, header: `${label} TTI` },
    { key: `${device}.inp`, header: `${label} INP` },
    { key: `${device}.status`, header: `${label} Result Status` },
    { key: `${device}.error`, header: `${label} Error` },
    { key: `${device}.fetchedAt`, header: `${label} Fetched At` },
  ];
}

function cruxColumns(device: 'phone' | 'desktop', label: string): ExportDatasetColumn[] {
  return [
    { key: `${device}.lcp`, header: `${label} LCP` },
    { key: `${device}.cls`, header: `${label} CLS` },
    { key: `${device}.inp`, header: `${label} INP` },
    { key: `${device}.fcp`, header: `${label} FCP` },
    { key: `${device}.ttfb`, header: `${label} TTFB` },
    { key: `${device}.status`, header: `${label} Result Status` },
    { key: `${device}.collectionPeriod`, header: `${label} Collection Period` },
    { key: `${device}.error`, header: `${label} Error` },
    { key: `${device}.fetchedAt`, header: `${label} Fetched At` },
  ];
}

const AI: ExportDatasetColumn[] = [
  ...PAGE,
  { key: 'ai.model', header: 'Model' },
  { key: 'ai.response', header: 'Response' },
  { key: 'ai.tokensIn', header: 'Tokens In' },
  { key: 'ai.tokensOut', header: 'Tokens Out' },
  { key: 'ai.status', header: 'Result Status' },
  { key: 'ai.error', header: 'Error' },
  { key: 'ai.fetchedAt', header: 'Fetched At' },
];

const SEO_TAIL: ExportDatasetColumn[] = [
  { key: 'seo.status', header: 'Result Status' },
  { key: 'seo.error', header: 'Error' },
  { key: 'seo.fetchedAt', header: 'Fetched At' },
];

export const EXPORT_DATASET_COLUMNS: Record<ExportDatasetKey, ExportDatasetColumn[]> = {
  images: [
    { key: 'src', header: 'Image URL' },
    { key: 'fromUrl', header: 'Page URL' },
    { key: 'alt', header: 'Alt Text' },
    { key: 'width', header: 'Width' },
    { key: 'height', header: 'Height' },
    { key: 'isInternal', header: 'Internal' },
    { key: 'occurrences', header: 'Occurrences' },
  ],
  'broken-links': [
    { key: 'fromUrl', header: 'Source' },
    { key: 'fromStatusCode', header: 'Source Status' },
    { key: 'toUrl', header: 'Destination' },
    { key: 'toStatusCode', header: 'Destination Status' },
    { key: 'anchor', header: 'Anchor' },
    { key: 'rel', header: 'Rel' },
    { key: 'isInternal', header: 'Internal' },
  ],
  pagespeed: [
    ...PAGE,
    ...pagespeedColumns('mobile', 'Mobile'),
    ...pagespeedColumns('desktop', 'Desktop'),
  ],
  crux: [...PAGE, ...cruxColumns('phone', 'Phone'), ...cruxColumns('desktop', 'Desktop')],
  spelling: [
    { key: 'url', header: 'URL' },
    { key: 'lang', header: 'HTML Lang' },
    { key: 'wordCount', header: 'Word Count' },
    { key: 'language', header: 'Check Language' },
    { key: 'detectedLanguage', header: 'Detected Language' },
    { key: 'matchCount', header: 'Matches' },
    { key: 'status', header: 'Check Status' },
    { key: 'engine', header: 'Engine' },
    { key: 'error', header: 'Error' },
    { key: 'fetchedAt', header: 'Checked At' },
  ],
  'search-console': [
    ...PAGE,
    { key: 'gsc.clicks', header: 'Clicks' },
    { key: 'gsc.impressions', header: 'Impressions' },
    { key: 'gsc.ctr', header: 'CTR' },
    { key: 'gsc.position', header: 'Position' },
    { key: 'gsc.fetchedAt', header: 'Fetched At' },
    { key: 'inspection.verdict', header: 'Index Verdict' },
    { key: 'inspection.coverageState', header: 'Coverage State' },
    { key: 'inspection.robotsTxtState', header: 'Robots.txt State' },
    { key: 'inspection.indexingState', header: 'Indexing State' },
    { key: 'inspection.lastCrawlTime', header: 'Last Crawl Time' },
    { key: 'inspection.googleCanonical', header: 'Google Canonical' },
    { key: 'inspection.userCanonical', header: 'User Canonical' },
    { key: 'inspection.mobileVerdict', header: 'Mobile Usability' },
    { key: 'inspection.ampVerdict', header: 'AMP Verdict' },
    { key: 'inspection.richResultsVerdict', header: 'Rich Results Verdict' },
  ],
  analytics: [
    ...PAGE,
    { key: 'ga4.sessions', header: 'Sessions' },
    { key: 'ga4.users', header: 'Users' },
    { key: 'ga4.pageviews', header: 'Pageviews' },
    { key: 'ga4.engagementRate', header: 'Engagement Rate' },
    { key: 'ga4.avgSessionDuration', header: 'Avg. Session Duration' },
    { key: 'ga4.fetchedAt', header: 'Fetched At' },
  ],
  'ai:openai': AI,
  'ai:anthropic': AI,
  'ai:ollama': AI,
  'seo:ahrefs': [
    ...PAGE,
    { key: 'seo.metrics.domainRating', header: 'Domain Rating' },
    { key: 'seo.metrics.urlRating', header: 'URL Rating' },
    { key: 'seo.metrics.backlinks', header: 'Backlinks' },
    { key: 'seo.metrics.refDomains', header: 'Referring Domains' },
    ...SEO_TAIL,
  ],
  'seo:majestic': [
    ...PAGE,
    { key: 'seo.metrics.trustFlow', header: 'Trust Flow' },
    { key: 'seo.metrics.citationFlow', header: 'Citation Flow' },
    { key: 'seo.metrics.externalBacklinks', header: 'External Backlinks' },
    { key: 'seo.metrics.refDomains', header: 'Referring Domains' },
    ...SEO_TAIL,
  ],
  'seo:moz': [
    ...PAGE,
    { key: 'seo.metrics.domainAuthority', header: 'Domain Authority' },
    { key: 'seo.metrics.pageAuthority', header: 'Page Authority' },
    { key: 'seo.metrics.spamScore', header: 'Spam Score' },
    { key: 'seo.metrics.linkingDomains', header: 'Linking Domains' },
    ...SEO_TAIL,
  ],
  'seo:semrush': [
    ...PAGE,
    { key: 'seo.metrics.organicKeywords', header: 'Organic Keywords' },
    { key: 'seo.metrics.organicTraffic', header: 'Organic Traffic' },
    { key: 'seo.metrics.organicCost', header: 'Organic Cost' },
    { key: 'seo.metrics.adwordsKeywords', header: 'AdWords Keywords' },
    ...SEO_TAIL,
  ],
};

export function isExportDatasetKey(value: string): value is ExportDatasetKey {
  return Object.prototype.hasOwnProperty.call(EXPORT_DATASET_COLUMNS, value);
}
