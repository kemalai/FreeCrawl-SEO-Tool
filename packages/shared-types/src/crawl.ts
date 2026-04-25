export type CrawlScope = 'subdomain' | 'subfolder' | 'all-subdomains' | 'exact-url';

/**
 * Top-level crawl mode.
 *  - `spider` — start from `startUrl`, follow links by `scope`. Default.
 *  - `list`   — fetch every URL in `urlList` exactly once, no link follow.
 *               Used to audit a curated set of URLs (sitemap export,
 *               GSC URL inspection list, etc.).
 */
export type CrawlMode = 'spider' | 'list';

export type UrlCategory =
  | 'all'
  | 'internal:all'
  | 'internal:html'
  | 'internal:js'
  | 'internal:css'
  | 'internal:image'
  | 'internal:pdf'
  | 'internal:font'
  | 'internal:other'
  | 'external:all'
  | 'external:html'
  | 'external:other'
  | 'status:blocked-robots'
  | 'status:no-response'
  | 'status:2xx'
  | 'status:3xx'
  | 'status:4xx'
  | 'status:5xx'
  | 'security:https'
  | 'security:http'
  | 'indexability:indexable'
  | 'indexability:non-indexable'
  | 'indexability:noindex'
  | 'indexability:canonicalised'
  | 'indexability:blocked-robots'
  | 'issues:title-missing'
  | 'issues:title-too-long'
  | 'issues:title-too-short'
  | 'issues:title-duplicate'
  | 'issues:meta-missing'
  | 'issues:meta-too-long'
  | 'issues:meta-too-short'
  | 'issues:meta-duplicate'
  | 'issues:h1-missing'
  | 'issues:h1-duplicate'
  | 'issues:h1-multiple'
  | 'issues:heading-skipped-level'
  | 'issues:multiple-canonicals'
  | 'issues:canonical-to-non-200'
  | 'issues:content-thin'
  | 'issues:response-slow'
  | 'issues:response-very-slow'
  | 'issues:page-large'
  | 'issues:url-too-long'
  | 'issues:url-uppercase'
  | 'issues:url-underscore'
  | 'issues:url-multiple-slashes'
  | 'issues:url-non-ascii'
  | 'issues:lang-missing'
  | 'issues:viewport-missing'
  | 'issues:og-missing'
  | 'issues:twitter-missing'
  | 'issues:hsts-missing'
  | 'issues:x-frame-options-missing'
  | 'issues:x-content-type-options-missing'
  | 'issues:csp-missing'
  | 'issues:structured-data-missing'
  | 'issues:structured-data-invalid'
  | 'issues:pagination-broken'
  | 'issues:hreflang-x-default-missing'
  | 'issues:mixed-content'
  | 'issues:favicon-missing'
  | 'issues:redirect-loop'
  | 'issues:redirect-chain-long'
  | 'issues:redirect-self'
  | 'issues:url-many-params'
  | 'issues:compression-missing'
  | 'issues:non-indexable-in-sitemap'
  | 'issues:non-200-in-sitemap'
  | 'issues:image-missing-alt'
  | 'issues:broken-links-all'
  | 'issues:broken-links-internal'
  | 'issues:broken-links-external';

export type Indexability =
  | 'indexable'
  | 'non-indexable:noindex'
  | 'non-indexable:canonical'
  | 'non-indexable:robots-blocked'
  | 'non-indexable:redirect'
  | 'non-indexable:client-error'
  | 'non-indexable:server-error';

export type ContentKind = 'html' | 'css' | 'js' | 'image' | 'pdf' | 'font' | 'other';

export interface CrawlUrlRow {
  id: number;
  url: string;
  contentKind: ContentKind;
  statusCode: number | null;
  statusText: string | null;
  indexability: Indexability;
  indexabilityReason: string | null;
  title: string | null;
  titleLength: number | null;
  metaDescription: string | null;
  metaDescriptionLength: number | null;
  h1: string | null;
  h1Length: number | null;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  h4Count: number;
  h5Count: number;
  h6Count: number;
  wordCount: number | null;
  canonical: string | null;
  canonicalCount: number;
  metaRobots: string | null;
  xRobotsTag: string | null;
  contentType: string | null;
  contentLength: number | null;
  responseTimeMs: number | null;
  depth: number;
  inlinks: number;
  outlinks: number;
  imagesCount: number;
  imagesMissingAlt: number;
  redirectTarget: string | null;
  lang: string | null;
  viewport: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  metaKeywords: string | null;
  metaAuthor: string | null;
  metaGenerator: string | null;
  themeColor: string | null;
  hsts: string | null;
  xFrameOptions: string | null;
  xContentTypeOptions: string | null;
  contentEncoding: string | null;
  schemaTypes: string | null;
  schemaBlockCount: number;
  schemaInvalidCount: number;
  paginationNext: string | null;
  paginationPrev: string | null;
  /** JSON-stringified array of `{ lang, href }` objects, or null. */
  hreflangs: string | null;
  hreflangCount: number;
  amphtml: string | null;
  favicon: string | null;
  mixedContentCount: number;
  redirectChainLength: number;
  redirectFinalUrl: string | null;
  redirectLoop: boolean;
  folderDepth: number;
  queryParamCount: number;
  csp: string | null;
  referrerPolicy: string | null;
  permissionsPolicy: string | null;
  /** JSON-stringified `{ term: count, ... }` or null. */
  customSearchHits: string | null;
  crawledAt: string;
}

export interface CrawlConfig {
  mode: CrawlMode;
  /** When `mode === 'list'`, URLs to fetch (one per entry). Ignored in spider mode. */
  urlList: string[];
  startUrl: string;
  scope: CrawlScope;
  maxDepth: number;
  maxUrls: number;
  maxConcurrency: number;
  maxRps: number;
  requestTimeoutMs: number;
  userAgent: string;
  followRedirects: boolean;
  respectRobotsTxt: boolean;
  crawlExternal: boolean;
  acceptLanguage: string;
  /** Per-worker delay inserted *after* each request (ms). 0 = disabled. */
  crawlDelayMs: number;
  /** Max retry attempts on network errors / 5xx / 429 (0 = no retry). */
  retryAttempts: number;
  /** Initial backoff (ms) — doubles on each attempt. */
  retryInitialDelayMs: number;
  /**
   * Persist `rel="nofollow"` links in the `links` table.
   * Default `false` — nofollow links are never stored, never probed as
   * externals, and don't count toward `urls.outlinks`. Screaming-Frog
   * style "Respect Nofollow" behaviour: nofollow links exist only as
   * hints to search engines, not as part of the crawl graph.
   */
  storeNofollowLinks: boolean;
  /**
   * Extra headers sent on every request — key/value pairs added on top of
   * the defaults (User-Agent, Accept-Language, Accept-Encoding). User
   * values override defaults when keys collide (case-insensitive).
   * Typical uses: auth tokens, custom routing hints, X-Forwarded-For.
   */
  customHeaders: Record<string, string>;
  /**
   * If non-empty, only URLs matching at least one of these regexes are
   * enqueued. The start URL is always crawled regardless. Patterns are
   * tested against the full URL string.
   */
  includePatterns: string[];
  /** URLs matching any of these regexes are skipped during enqueue. */
  excludePatterns: string[];
  /**
   * On crawl start, discover sitemap.xml URLs from robots.txt + default
   * paths and persist their entries into `sitemap_urls`. Used for the
   * post-crawl Sitemap issue filters (non-indexable URLs declared in the
   * sitemap, etc.). Default `true` — cheap I/O, high SEO value.
   */
  discoverSitemaps: boolean;
  /**
   * Free-form keyword/phrase list searched (case-insensitive, literal
   * substring) inside every crawled page's body text. Each term's hit
   * count is stored per URL — useful for content audits ("how many pages
   * mention 'pricing'?", "where do we still say 'beta'?"). Empty array
   * disables the scan entirely (cost: zero).
   */
  customSearchTerms: string[];
  /**
   * URL rewriting — applied at normalization time so the seen-set, link
   * graph, and DB rows all use the canonical form. All flags default off
   * (opt-in) because each one collapses what some sites treat as
   * distinct URLs and can mask bugs if applied incorrectly.
   */
  /** Strip leading `www.` from the host (`www.x.com/y` → `x.com/y`). */
  stripWww: boolean;
  /** Upgrade `http://` to `https://` before fetching. Breaks HTTP-only sites. */
  forceHttps: boolean;
  /** Lowercase the URL path component. Host is already case-insensitive per the URL spec. */
  lowercasePath: boolean;
  /**
   * Trailing-slash policy:
   *  - `leave`  — never touch (default)
   *  - `strip`  — `…/foo/` → `…/foo`  (root `/` stays as-is)
   *  - `add`    — `…/foo` → `…/foo/`  (only when path has no trailing `.ext`)
   */
  trailingSlash: 'leave' | 'strip' | 'add';
}

export interface OverviewCounts {
  summary: {
    totalInternalUrls: number;
    totalIndexable: number;
    totalNonIndexable: number;
    totalExternalUrls: number;
  };
  internal: Record<string, number>;
  external: Record<string, number>;
  responseCodes: {
    all: number;
    blockedRobots: number;
    noResponse: number;
    success2xx: number;
    redirect3xx: number;
    clientError4xx: number;
    serverError5xx: number;
  };
  security: { https: number; http: number };
  indexability: {
    indexable: number;
    nonIndexable: number;
    noindex: number;
    canonicalised: number;
    blockedRobots: number;
  };
  issues: {
    titleMissing: number;
    titleTooLong: number;
    titleTooShort: number;
    titleDuplicate: number;
    metaMissing: number;
    metaTooLong: number;
    metaTooShort: number;
    metaDuplicate: number;
    h1Missing: number;
    h1Duplicate: number;
    h1Multiple: number;
    headingSkippedLevel: number;
    multipleCanonicals: number;
    canonicalToNon200: number;
    contentThin: number;
    responseSlow: number;
    responseVerySlow: number;
    pageLarge: number;
    urlTooLong: number;
    urlUppercase: number;
    urlUnderscore: number;
    urlMultipleSlashes: number;
    urlNonAscii: number;
    langMissing: number;
    viewportMissing: number;
    ogMissing: number;
    twitterMissing: number;
    hstsMissing: number;
    xFrameOptionsMissing: number;
    xContentTypeOptionsMissing: number;
    cspMissing: number;
    structuredDataMissing: number;
    structuredDataInvalid: number;
    paginationBroken: number;
    hreflangXDefaultMissing: number;
    mixedContent: number;
    faviconMissing: number;
    redirectLoop: number;
    redirectChainLong: number;
    redirectSelf: number;
    urlManyParams: number;
    compressionMissing: number;
    nonIndexableInSitemap: number;
    non200InSitemap: number;
    imageMissingAlt: number;
    brokenLinksInternal: number;
    brokenLinksExternal: number;
  };
}

export interface CrawlProgress {
  discovered: number;
  crawled: number;
  failed: number;
  pending: number;
  currentDepth: number;
  urlsPerSecond: number;
  elapsedMs: number;
  avgResponseTimeMs: number;
  running: boolean;
  paused: boolean;
  startUrl: string;
}

export interface CrawlSummary {
  total: number;
  byStatus: Record<string, number>;
  byContentKind: Record<ContentKind, number>;
  byIndexability: Record<string, number>;
  avgResponseTimeMs: number;
  totalBytes: number;
}

export type LinkType = 'hyperlink' | 'image' | 'script' | 'stylesheet' | 'other';
export type LinkPathType =
  | 'absolute'
  | 'root-relative'
  | 'path-relative'
  | 'protocol-relative';
export type LinkPosition =
  | 'navigation'
  | 'header'
  | 'content'
  | 'sidebar'
  | 'footer'
  | 'aside';
export type LinkOrigin = 'html' | 'javascript' | 'css' | 'redirect' | 'canonical';

export interface DiscoveredLink {
  fromUrl: string;
  toUrl: string;
  type: LinkType;
  anchor: string | null;
  altText: string | null;
  rel: string | null;
  target: string | null;
  pathType: LinkPathType;
  linkPath: string | null;
  linkPosition: LinkPosition;
  linkOrigin: LinkOrigin;
  isInternal: boolean;
}

export interface DiscoveredImage {
  src: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  isInternal: boolean;
}

export interface ImageRow {
  id: number;
  src: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  isInternal: boolean;
  occurrences: number;
}

/** Columns that the Advanced Filter dialog exposes for querying. */
export type FilterField =
  | 'url'
  | 'content_kind'
  | 'status_code'
  | 'indexability'
  | 'title'
  | 'title_length'
  | 'meta_description'
  | 'meta_description_length'
  | 'h1'
  | 'h1_length'
  | 'h1_count'
  | 'h2_count'
  | 'word_count'
  | 'content_type'
  | 'content_length'
  | 'response_time_ms'
  | 'depth'
  | 'inlinks'
  | 'outlinks'
  | 'canonical'
  | 'meta_robots'
  | 'x_robots_tag'
  | 'redirect_target'
  | 'images_count'
  | 'images_missing_alt';

export type FilterOperator =
  | 'contains'
  | 'not_contains'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte';

export interface FilterClause {
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

/** Clauses inside a group are AND'd together. */
export interface FilterGroup {
  clauses: FilterClause[];
}

/** Groups are OR'd together. Empty groups / clauses are ignored. */
export interface AdvancedFilter {
  groups: FilterGroup[];
}

export interface BrokenLinkRow {
  fromUrl: string;
  fromStatusCode: number | null;
  toUrl: string;
  toStatusCode: number | null;
  anchor: string | null;
  rel: string | null;
  isInternal: boolean;
}

export interface InlinkRow {
  fromUrl: string;
  fromStatusCode: number | null;
  /** Status code of the page the inlink points *to* (the detail panel URL). */
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

export interface OutlinkRow {
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
  isInternal: boolean;
}

export interface HttpHeader {
  name: string;
  value: string;
}

export interface UrlDetail {
  row: CrawlUrlRow;
  inlinks: InlinkRow[];
  inlinksTotal: number;
  outlinks: OutlinkRow[];
  outlinksTotal: number;
  /** Captured response headers (all values), in original order. */
  headers: HttpHeader[];
}

export const DEFAULT_CRAWL_CONFIG: CrawlConfig = {
  mode: 'spider',
  urlList: [],
  startUrl: '',
  scope: 'subdomain',
  maxDepth: 10,
  maxUrls: 100_000,
  maxConcurrency: 20,
  maxRps: 20,
  requestTimeoutMs: 20_000,
  userAgent: 'FreeCrawlSEO/0.1 (+https://github.com/kemalai/FreeCrawl-SEO-Tool)',
  followRedirects: true,
  respectRobotsTxt: true,
  crawlExternal: false,
  acceptLanguage: 'tr,en;q=0.8',
  crawlDelayMs: 0,
  retryAttempts: 2,
  retryInitialDelayMs: 500,
  storeNofollowLinks: false,
  customHeaders: {},
  includePatterns: [],
  excludePatterns: [],
  discoverSitemaps: true,
  customSearchTerms: [],
  stripWww: false,
  forceHttps: false,
  lowercasePath: false,
  trailingSlash: 'leave',
};
