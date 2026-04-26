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
  | 'issues:canonical-missing'
  | 'issues:canonical-self-referencing'
  | 'issues:canonical-non-self'
  | 'issues:canonical-mismatch'
  | 'issues:canonical-to-non-200'
  | 'issues:canonical-to-redirect'
  | 'issues:canonical-to-noindex'
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
  | 'issues:meta-refresh-used'
  | 'issues:charset-missing'
  | 'issues:broken-links-all'
  | 'issues:broken-links-internal'
  | 'issues:broken-links-external'
  | 'issues:near-duplicate'
  | 'issues:duplicate-content-exact'
  | 'issues:hreflang-invalid-code'
  | 'issues:hreflang-self-ref-missing'
  | 'issues:hreflang-reciprocity-missing'
  | 'issues:hreflang-target-issues'
  | 'issues:crawled-not-in-sitemap'
  | 'issues:redirect-in-sitemap';

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
  /** `<URL>; rel="canonical"` parsed out of the `Link:` HTTP response header. */
  canonicalHttp: string | null;
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
  /** Hreflang entries on this page whose `lang` is not a valid BCP-47 / `x-default` token. */
  hreflangInvalidCount: number;
  /** True if this page declares hreflang alternates but no self-referencing entry. */
  hreflangSelfRefMissing: boolean;
  /** Hreflang declarations on this page where the target does NOT declare a reciprocal link back. */
  hreflangReciprocityMissing: number;
  /** Hreflang targets that are non-200, noindex, or canonicalised away. */
  hreflangTargetIssues: number;
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
  /** Raw `content` attribute of `<meta http-equiv="refresh">`, e.g. "5; url=/foo". */
  metaRefresh: string | null;
  /** Absolute redirect URL parsed from the meta-refresh content, when present. */
  metaRefreshUrl: string | null;
  /**
   * Declared character encoding (lowercased). Sourced from `<meta charset>` /
   * `<meta http-equiv="Content-Type">`, with the HTTP Content-Type
   * `charset=` parameter as fallback. Null when the page declares neither.
   */
  charset: string | null;
  /**
   * JSON-stringified `{ ruleName: value, ... }` of custom-extraction
   * results, or null when no rules are configured / nothing matched.
   * Surfaced in the URL Details panel and exported in CSV/JSON.
   */
  extractionResults: string | null;
  /**
   * 64-bit Charikar SimHash of the body text shingles, hex-encoded (16
   * chars). Null when the page has too little usable content to fingerprint.
   * Drives the post-crawl near-duplicate clustering pass.
   */
  simhash: string | null;
  /**
   * 64-bit FNV-1a hash of the full normalised body token stream, hex-
   * encoded (16 chars). Two pages with the same `contentHash` have byte-
   * identical body text post-tokenisation — the basis for "Exact Duplicate
   * Content" detection.
   */
  contentHash: string | null;
  /**
   * Cluster ID assigned by `recomputeDuplicateClusters` (post-crawl pass).
   * 0 = singleton (no near-duplicates within the configured Hamming
   * threshold). >0 = member of a near-duplicate cluster of `clusterSize`
   * pages. Within a cluster, all members share the same `clusterId`.
   */
  clusterId: number;
  /** Number of pages in this URL's near-duplicate cluster (1 = singleton). */
  clusterSize: number;
  crawledAt: string;
}

/**
 * One row in the post-crawl near-duplicate clustering view. A cluster is a
 * connected component of pages whose pairwise SimHash hamming distance is
 * ≤ `nearDuplicateHammingThreshold`. We surface each member page with
 * the cluster size for the dedicated "Duplicates" tab.
 */
export interface DuplicateClusterRow {
  url: string;
  statusCode: number | null;
  indexability: Indexability;
  title: string | null;
  wordCount: number | null;
  inlinks: number;
  clusterId: number;
  clusterSize: number;
  /** SimHash hex of this URL — useful for spot-checking cluster cohesion. */
  simhash: string | null;
  /** Hamming distance to the cluster representative (0 for the rep itself). */
  hammingFromRep: number;
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
  /**
   * Hardware / resource caps. All `0` means unlimited.
   *
   *  - `memoryLimitMb`: when crawler RSS exceeds this, the queue is
   *    auto-paused. It auto-resumes once RSS falls below 80% of the limit.
   *    Lets the user run a 1M-URL crawl on a constrained machine without
   *    OOMs. Soft cap — not a hard `--max-old-space-size` enforcement.
   *  - `maxQueueSize`: hard cap on the in-memory pending queue (`enqueue`
   *    drops new items beyond this). Bounds peak heap during fan-out
   *    bursts (e.g. a sitemap dump of 100k URLs). `seen`-set still grows.
   *  - `processPriority`: OS scheduler hint. `idle` and `below-normal`
   *    let the user keep the machine usable while crawling.
   */
  memoryLimitMb: number;
  maxQueueSize: number;
  processPriority: 'normal' | 'below-normal' | 'idle';
  /**
   * Maximum SimHash hamming distance (0–64) at which two pages are still
   * considered near-duplicates. 3 (~95% similarity over the body text
   * shingles) is the default and matches Screaming Frog's tightest near-
   * duplicate filter. 0 disables near-duplicate clustering entirely.
   */
  nearDuplicateHammingThreshold: number;
  /**
   * If true, only pages flagged `indexability = 'indexable'` participate
   * in near-duplicate clustering. Indexability-blocked pages (noindex,
   * canonicalised, robots-blocked) are excluded so the duplicate report
   * surfaces issues that actually affect search visibility.
   */
  duplicatesOnlyIndexable: boolean;
  /**
   * Optional webhook URL that receives a single `POST` with a JSON
   * summary when a crawl finishes. Empty string disables it. Failures
   * are best-effort — surfaced as an `info` event but never break the
   * crawl. Used to integrate with Slack incoming webhooks, Zapier,
   * dashboards, etc.
   */
  webhookUrl: string;
  /**
   * Custom extraction rules — each rule is run against every crawled
   * HTML page; results are stored on the URL row as a JSON object
   * `{ ruleName: value, ... }`. Up to 10 rules supported (matches
   * Screaming Frog's free-tier cap; cost grows linearly).
   */
  customExtractionRules: CustomExtractionRule[];
  /**
   * HTTP authentication applied on every fetch. `none` is the default.
   * `basic` sends `Authorization: Basic <base64(user:pass)>`; `bearer`
   * sends `Authorization: Bearer <token>`. Digest auth is not supported
   * yet (challenge/response state-machine).
   */
  auth: HttpAuth;
  /**
   * Proxy URL — overrides `HTTPS_PROXY` / `HTTP_PROXY` env vars when
   * non-empty. Same syntax: `http://user:pass@host:port`.
   */
  proxyUrl: string;
  /**
   * URL path extensions to skip during enqueue (lowercase, without dot).
   * Useful for trimming PDFs / large media when only HTML matters.
   */
  excludeExtensions: string[];
  /**
   * Hard cap on redirect hops. Each 3xx is enqueued as its own URL so
   * exceeding this means we stop following the chain — the URL row
   * for the last hop is kept with its 3xx status. 0 disables.
   */
  maxRedirects: number;
}

export interface HttpAuth {
  type: 'none' | 'basic' | 'bearer';
  username?: string;
  password?: string;
  token?: string;
}

/**
 * One row of the Custom Extraction table. Either CSS-selector or regex
 * driven; output shape and multi-match handling are independently
 * configurable so the same rule schema covers "first occurrence",
 * "concatenated list", "count", etc.
 */
export interface CustomExtractionRule {
  /** User-visible name. Stored verbatim — also used as the JSON key. */
  name: string;
  /** Extraction strategy. `css` uses cheerio; `regex` runs against raw HTML. */
  type: 'css' | 'regex';
  /** CSS selector when `type = 'css'`; regex pattern (no flags) when `type = 'regex'`. */
  selector: string;
  /** Attribute to read when `output = 'attribute'`. Ignored otherwise. */
  attribute?: string;
  /**
   * What to read off each match.
   *  - `text`        — visible text content (CSS only).
   *  - `attribute`   — value of `attribute` (CSS only).
   *  - `inner_html`  — innerHTML (CSS only).
   *  - `outer_html`  — outerHTML (CSS only).
   *  - `count`       — match count, ignores `multi`.
   *  - `regex_group` — regex capture group 1 (regex only).
   */
  output: 'text' | 'attribute' | 'inner_html' | 'outer_html' | 'count' | 'regex_group';
  /**
   * What to do when multiple matches exist:
   *  - `first`  — return the first match (default).
   *  - `last`   — return the last match.
   *  - `all`    — return JSON array of all matches.
   *  - `concat` — join with " | " separator.
   *  - `count`  — return integer count.
   */
  multi: 'first' | 'last' | 'all' | 'concat' | 'count';
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
    canonicalMissing: number;
    canonicalSelfReferencing: number;
    canonicalNonSelf: number;
    canonicalMismatch: number;
    canonicalToNon200: number;
    canonicalToRedirect: number;
    canonicalToNoindex: number;
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
    metaRefreshUsed: number;
    charsetMissing: number;
    brokenLinksInternal: number;
    brokenLinksExternal: number;
    nearDuplicate: number;
    duplicateContentExact: number;
    hreflangInvalidCode: number;
    hreflangSelfRefMissing: number;
    hreflangReciprocityMissing: number;
    hreflangTargetIssues: number;
    crawledNotInSitemap: number;
    redirectInSitemap: number;
    /** Sitemap URL count that the crawl never reached (in sitemap_urls but not in urls). */
    sitemapNotCrawled: number;
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
  maxUrls: 1_000_000,
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
  memoryLimitMb: 0,
  maxQueueSize: 0,
  processPriority: 'normal',
  nearDuplicateHammingThreshold: 3,
  duplicatesOnlyIndexable: true,
  webhookUrl: '',
  customExtractionRules: [],
  auth: { type: 'none' },
  proxyUrl: '',
  excludeExtensions: [],
  maxRedirects: 10,
};
