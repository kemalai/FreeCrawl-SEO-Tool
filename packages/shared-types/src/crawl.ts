/**
 * Crawl scope. Determines which links are followed.
 *  - `subdomain`        — same registrable domain + same exact host
 *                         (default; tightest "this site" definition)
 *  - `subfolder`        — same host AND target's path starts with the
 *                         start URL's path. Use to crawl a single
 *                         section of a large site (e.g. `/blog/` only).
 *  - `all-subdomains`   — any host that shares the registrable domain
 *                         (`*.example.com` ∪ `example.com`)
 *  - `exact-url`        — only the start URL itself; no link-follow.
 *                         Equivalent to "single-page" mode.
 */
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
  | 'issues:image-empty-alt'
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
  | 'issues:redirect-in-sitemap'
  | 'issues:h1-empty'
  | 'issues:h1-too-long'
  | 'issues:title-multiple'
  | 'issues:url-fragment'
  | 'issues:url-spaces'
  | 'issues:link-empty-anchor'
  | 'issues:apple-touch-icon-missing'
  | 'issues:manifest-missing'
  | 'issues:feed-missing'
  | 'issues:title-pixel-width-too-long'
  | 'issues:meta-pixel-width-too-long'
  | 'issues:insecure-form-action'
  | 'issues:missing-sri'
  | 'issues:ttfb-slow'
  | 'issues:ttfb-very-slow'
  | 'issues:cookie-no-secure'
  | 'issues:cookie-no-httponly'
  | 'issues:cookie-no-samesite'
  | 'issues:query-string-too-long'
  | 'issues:folder-depth-too-deep'
  | 'issues:http2-not-supported'
  | 'issues:render-blocking'
  | 'issues:keepalive-disabled'
  | 'issues:title-placeholder'
  | 'issues:analytics-missing'
  | 'issues:analytics-multiple-ga4'
  | 'issues:analytics-ua-legacy'
  | 'issues:analytics-pixel-without-policy'
  | 'issues:image-too-large'
  | 'issues:ssl-cert-expired'
  | 'issues:ssl-cert-expiring-soon'
  | 'issues:ssl-protocol-old'
  | 'issues:ssl-signature-weak'
  | 'issues:hsts-no-preload'
  | 'issues:hsts-max-age-short'
  | 'issues:hsts-no-includesubdomains'
  | 'issues:anchor-text-too-long'
  | 'issues:anchor-text-generic'
  | 'issues:form-input-unlabeled'
  | 'issues:images-no-lazy-loading'
  | 'issues:image-broken-src'
  | 'issues:target-blank-no-noopener'
  | 'issues:page-empty'
  | 'issues:og-image-not-absolute'
  | 'issues:twitter-image-not-absolute'
  | 'issues:canonical-not-absolute'
  | 'issues:description-equals-title'
  | 'issues:title-single-word'
  | 'issues:external-links-too-many'
  | 'issues:outlinks-zero'
  | 'issues:internal-link-to-redirect'
  | 'issues:h1-equals-title'
  | 'issues:dead-external-domain'
  | 'issues:duplicate-url-post-norm'
  | 'issues:canonical-chain-multi-hop'
  | 'issues:image-slow-loading'
  | 'issues:description-equals-h1'
  | 'issues:js-only-navigation'
  | 'issues:text-code-ratio-low'
  | 'issues:render-blocking-critical'
  | 'issues:og-image-too-large'
  | 'issues:twitter-image-too-large'
  | 'issues:pagination-sequence-break'
  | 'issues:links-per-page-too-many'
  | 'tab:redirects'
  | 'tab:canonicals'
  | 'tab:directives'
  | 'issues:hreflang-inconsistent-lang'

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
  /**
   * Time-to-first-byte (ms) — measured as the interval between request
   * dispatch and headers receipt. `responseTimeMs - ttfbMs` therefore
   * approximates body-transfer time on the wire. Null when no successful
   * request was made (network error or pre-fetch abort).
   */
  ttfbMs: number | null;
  depth: number;
  inlinks: number;
  outlinks: number;
  imagesCount: number;
  imagesMissingAlt: number;
  /** Number of `<img>` tags with `alt=""` (decorative, distinct from missing alt). */
  imagesEmptyAlt: number;
  /** Number of `<img>` tags with `loading="lazy"`. */
  imagesLazy: number;
  /** Total user-facing form inputs (input/textarea/select, excluding hidden/submit/button/image/reset). */
  formInputCount: number;
  /** Form inputs without label / aria-label / title (WCAG 1.3.1, 4.1.2 violation). */
  formInputUnlabeled: number;
  /**
   * JSON-stringified `Array<{ level: 1..6, text: string }>` of every
   * heading on the page in source order, or null when the page has no
   * headings. Capped at 200 entries server-side.
   */
  headings: string | null;
  /**
   * Raw `Server` response header (e.g. `"nginx/1.25.0"`, `"cloudflare"`,
   * `"Apache/2.4.41 (Ubuntu)"`). Useful for stack auditing — surfaces
   * what server software the site is running and its version. Null when
   * the server didn't send a `Server` header.
   */
  serverHeader: string | null;
  /**
   * Per-page count of `<a>` elements that look clickable but are NOT
   * crawlable (no href + onclick, `href="javascript:…"`, or `href="#"`
   * with onclick). Surfaces in the "JS-Only Navigation" issue filter.
   */
  jsOnlyLinksCount: number;
  /**
   * Visible-text bytes / total HTML bytes as integer percent (0–100).
   * Low ratio (<10%) suggests heavy script/template scaffolding with
   * little crawlable content. Null on non-HTML or empty pages.
   */
  textCodeRatio: number | null;
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
  /** Microdata `[itemscope]` element count on the page. */
  microdataCount: number;
  /** RDFa `[typeof]` / `[vocab]` / `[property]` attribute count. */
  rdfaCount: number;
  /** `<form action="http://…">` count when the page itself is HTTPS. */
  insecureFormActionCount: number;
  /** Third-party `<script>` / `<link rel=stylesheet>` without `integrity`. */
  missingSriCount: number;
  /** Render-blocking `<head>` resources count (script/link rel=stylesheet). */
  renderBlockingCount: number;
  /** Whether the response declared `Connection: keep-alive` / HTTP/1.1 implicit keep-alive. */
  keepAlive: boolean;
  /**
   * JSON-stringified array of detected analytics / marketing trackers, e.g.
   * `[{"name":"Google Analytics 4","id":"G-ABC123"}]`. Null when no
   * trackers were detected. Schema: `Array<{ name: string; id: string | null }>`.
   */
  analyticsTrackers: string | null;
  /** Estimated SERP pixel width of `title` (Arial 18 px). 0 when no title. */
  titlePixelWidth: number;
  /** Estimated SERP pixel width of `metaDescription` (Arial 13 px-equiv). */
  metaPixelWidth: number;
  /** Total Set-Cookie response-headers seen on this page. */
  cookiesCount: number;
  /** Cookies that don't set the `Secure` flag. */
  cookiesInsecure: number;
  /** Cookies that don't set `HttpOnly`. */
  cookiesNoHttpOnly: number;
  /** Cookies that don't set `SameSite=…`. */
  cookiesNoSameSite: number;
  /**
   * Best-effort HTTP protocol indicator inferred from the `Alt-Svc`
   * response header. `'h2'` / `'h3'` when the origin advertises HTTP/2
   * or HTTP/3 support, `'http/1.1'` otherwise. Null when no Alt-Svc was
   * observed and we have no other signal.
   */
  httpProtocol: string | null;
  /** Query-string length in characters (0 when no `?`). */
  queryStringLength: number;
  paginationNext: string | null;
  paginationPrev: string | null;
  /** True when this URL is part of a paginated cluster whose ordinal
   * sequence has a gap (e.g. ?page=1, ?page=2, ?page=4 — 3 missing).
   * Set by the post-crawl `recomputePaginationSequence()` pass. */
  paginationSequenceBreak: boolean;
  /** JSON-stringified array of `{ lang, href }` objects, or null. */
  hreflangs: string | null;
  hreflangCount: number;
  amphtml: string | null;
  favicon: string | null;
  /** Resolved `<link rel="apple-touch-icon">` URL, else null. */
  appleTouchIcon: string | null;
  /** Resolved `<link rel="manifest">` URL (web app manifest), else null. */
  manifestUrl: string | null;
  /** Resolved RSS / Atom `<link rel="alternate" type="application/rss+xml|atom+xml">` URL, else null. */
  feedUrl: string | null;
  mixedContentCount: number;
  /** Number of `<title>` elements (>1 is a duplicate-tag issue). */
  titleCount: number;
  /** Number of internal hyperlinks with no anchor text or alt — accessibility/SEO issue. */
  emptyAnchorCount: number;
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
  /**
   * URL length warning threshold (chars). The "URL Too Long" issue trips
   * when `LENGTH(url) > maxUrlLength`. Default 2048 (RFC-suggested
   * practical ceiling). 0 disables the check.
   */
  maxUrlLength: number;
  /**
   * Query-string length warning threshold (chars). Trips "Query String
   * Too Long" when `LENGTH(query) > maxQueryStringLength`. 0 disables.
   */
  maxQueryStringLength: number;
  /**
   * Path-segment depth threshold. Trips "Folder Depth Too Deep" when
   * `folder_depth > maxFolderDepth`. 0 disables. Useful for spotting
   * over-nested URL structures that bury content from crawlers.
   */
  maxFolderDepth: number;
  /**
   * Persist a per-page raw HTML snapshot in the project file so the
   * View Source detail tab can show the body. Default `true`. Disable
   * for crawls that don't need source browsing — saves ~ avg HTML size
   * per crawled URL on disk (typically 30-200 KB / page).
   */
  storeBodySnapshots: boolean;
  /**
   * Per-page body cap (bytes) when `storeBodySnapshots` is on. Bodies
   * over this are truncated and flagged. Default 1 MB — covers the
   * 99.9th percentile of HTML pages without letting one adversarial
   * 50 MB page bloat the DB. 0 disables truncation (not recommended).
   */
  bodySnapshotMaxBytes: number;
  /**
   * After the HTML crawl finishes, run a HEAD probe against every
   * internal image referenced from a crawled page so the DB picks up
   * `Content-Length` for the "Large Image" issue check. Only HEAD —
   * no body download — so cost is minimal even for image-heavy sites.
   * Default `true`. Disable to skip image weighing entirely.
   */
  probeImageSizes: boolean;
  /**
   * Image-size warning threshold (bytes). Trips the "Large Image" issue
   * when an internal image's `Content-Length` exceeds this. Default
   * 102 400 (100 KB) — Google's PageSpeed audit threshold.
   */
  largeImageBytes: number;
  /**
   * After the HTML crawl finishes, open one TLS handshake per unique
   * HTTPS host so the DB picks up cert expiry / issuer / signature
   * algorithm / protocol for the SSL audit issues. Default `true`. One
   * connect per host — typically a handful of probes for a site crawl.
   */
  probeTlsCerts: boolean;
  /**
   * Hostnames (lowercase, no scheme/port) that should be treated as
   * "same host" for scope purposes — used to keep CDN-served subdomains
   * (`cdn.example.com`, `static.example.com`, custom Cloudflare /
   * Fastly hostnames) within the internal crawl set rather than being
   * counted as external. Wildcards via leading `*.` are supported, e.g.
   * `*.cloudfront.net`.
   */
  cdnHosts: string[];
  /**
   * Maximum total links per page (internal + external) before the
   * "Too Many Links per Page" issue trips. Default 100 — Google's
   * historical recommendation; pages above this start to look like
   * link-farm SERPs. 0 disables the check.
   */
  maxLinksPerPage: number;
  /**
   * Maximum response time (ms). Requests that exceed this are aborted
   * and recorded as a network error — distinct from `requestTimeoutMs`
   * which is the connect+headers timeout. Use to cap individual slow
   * pages without lowering the overall fetch timeout. 0 disables.
   */
  maxResponseTimeMs: number;
  /**
   * Maximum response body size (bytes). When the `Content-Length`
   * header on the response exceeds this, the body is discarded and
   * the page is recorded with status only. Useful for trimming large
   * downloads (PDFs, archives) on bandwidth-constrained connections.
   * 0 disables.
   */
  maxFileSizeBytes: number;
  /**
   * Follow `<link rel="canonical">` like a redirect — when a 200 page
   * declares a canonical pointing elsewhere, also enqueue the canonical
   * target. Default `false` — most crawls treat canonicals as a
   * signal, not a navigation hint.
   */
  followCanonicals: boolean;
  /**
   * Cookie policy applied to every fetch. The crawler is otherwise
   * stateless across requests; this knob lets users opt into
   * session-cookie behaviour when crawling sites that gate content
   * behind a session.
   *  - `reject-all`         (default) — never send Cookie header,
   *                          discard Set-Cookie response headers
   *  - `accept-all`         — round-trip cookies via an in-memory
   *                          jar keyed by host
   *  - `block-third-party`  — accept first-party cookies only
   *                          (same registrable domain as the page)
   */
  cookiePolicy: 'reject-all' | 'accept-all' | 'block-third-party';
  /**
   * Per-host User-Agent overrides. Map of host pattern → UA string.
   * Patterns support exact host (`m.example.com`) or leading wildcard
   * (`*.example.com`); wildcard matches any subdomain. The first
   * matching pattern wins; falls back to the global `userAgent` when
   * none match. Useful for crawling a mobile subdomain with the
   * mobile-Googlebot UA in the same run as the desktop site.
   */
  perHostUserAgents: { hostPattern: string; userAgent: string }[];
  /**
   * Named proxy profiles. The user can save multiple `(name, url)`
   * entries and pick one by name in `proxyProfileActive`. Empty
   * `proxyProfileActive` falls back to the legacy `proxyUrl` /
   * `HTTPS_PROXY` env var.
   */
  proxyProfiles: { name: string; url: string }[];
  /** Currently-selected proxy profile name. Empty = use proxyUrl
   *  (or env vars) directly without profile lookup. */
  proxyProfileActive: string;
  /**
   * Follow `<link rel="next">` and `<link rel="prev">` for pagination
   * link discovery. Default `true` — these are part of the standard
   * crawl graph; off only to debug pagination-specific issues.
   */
  followPaginationLinks: boolean;
  /**
   * Follow `<a rel="nofollow">` links (still respecting all other
   * filters). Default `false` — Screaming Frog "Respect Nofollow"
   * default. Combined with `storeNofollowLinks` for the storage side.
   */
  followNofollow: boolean;
  /**
   * Follow JavaScript-style redirects discovered in the HTML body
   * (`<meta http-equiv="refresh">` content URL, `window.location` JS
   * statements). Default `false` — these are heuristics; when on,
   * the meta-refresh URL is also enqueued like a redirect target.
   */
  followJsRedirects: boolean;
  /**
   * Wave 6 — Per-pass crawl-analysis toggles. Each post-crawl pass
   * can be independently disabled when the user knows the data isn't
   * needed for their audit; saves wall-clock on large crawls. All
   * default `true` because the corresponding issue filters/reports
   * silently fall back to "no data" when their pass didn't run.
   */
  /** Recompute `inlinks` count per URL after the crawl. */
  analyseInlinks: boolean;
  /** Walk redirect chains, fill `redirect_chain_length` / `redirect_loop`. */
  analyseRedirectChains: boolean;
  /** Hreflang reciprocity + invalid code + target health. */
  analyseHreflang: boolean;
  /** SimHash + LSH near-duplicate clustering. */
  analyseDuplicates: boolean;
  /** Pagination ordinal-gap detection. */
  analysePagination: boolean;
  /** Materialise the heavy `urls_issues` counters (Dead External Domain,
   * Duplicate URL post-norm, Canonical Chain Multi-hop). */
  analyseIssues: boolean;
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
    h1Empty: number;
    h1TooLong: number;
    titleMultiple: number;
    urlFragment: number;
    urlSpaces: number;
    imageEmptyAlt: number;
    linkEmptyAnchor: number;
    appleTouchIconMissing: number;
    manifestMissing: number;
    feedMissing: number;
    titlePixelWidthTooLong: number;
    metaPixelWidthTooLong: number;
    insecureFormAction: number;
    missingSri: number;
    ttfbSlow: number;
    ttfbVerySlow: number;
    cookieNoSecure: number;
    cookieNoHttpOnly: number;
    cookieNoSameSite: number;
    queryStringTooLong: number;
    folderDepthTooDeep: number;
    http2NotSupported: number;
    renderBlocking: number;
    keepaliveDisabled: number;
    titlePlaceholder: number;
    /** Indexable HTML pages with no detected analytics tracker at all. */
    analyticsMissing: number;
    /** Pages with more than one GA4 measurement ID (configuration error). */
    analyticsMultipleGa4: number;
    /** Pages still loading legacy Universal Analytics (UA-XXXXX-Y). */
    analyticsUaLegacy: number;
    /** Pages running a tracking pixel (FB / TikTok / Pinterest / LinkedIn) without a Permissions-Policy. */
    analyticsPixelWithoutPolicy: number;
    /** Pages referencing at least one internal image whose `Content-Length` exceeds the configured large-image threshold. */
    imageTooLarge: number;
    /** HTTPS pages whose host's certificate is already past `valid_to`. */
    sslCertExpired: number;
    /** HTTPS pages whose host's certificate expires within the next 30 days. */
    sslCertExpiringSoon: number;
    /** HTTPS pages negotiated on a deprecated TLS version (TLSv1.0 / TLSv1.1). */
    sslProtocolOld: number;
    /** HTTPS pages whose certificate uses a deprecated signature algorithm (SHA1 / MD5). */
    sslSignatureWeak: number;
    /** HTTPS pages whose HSTS header is missing the `preload` directive. */
    hstsNoPreload: number;
    /** HTTPS pages whose HSTS `max-age` is below the 1-year preload threshold (31536000). */
    hstsMaxAgeShort: number;
    /** HTTPS pages whose HSTS header lacks `includeSubDomains`. */
    hstsNoIncludeSubdomains: number;
    /** Pages with at least one outgoing link whose anchor text exceeds 100 chars. */
    anchorTextTooLong: number;
    /** Pages with at least one outgoing link whose anchor is a generic phrase ("click here", "read more", …). */
    anchorTextGeneric: number;
    /** Pages with at least one form input that has no associated `<label>` / aria-label / title. */
    formInputUnlabeled: number;
    /** Pages with ≥5 images but lazy-loading adoption below 50%. */
    imagesNoLazyLoading: number;
    /** Pages referencing at least one image whose HEAD probe returned a 4xx/5xx status. */
    imageBrokenSrc: number;
    /** Pages with at least one `<a target="_blank">` without `rel="noopener"` (reverse-tabnabbing risk). */
    targetBlankNoNoopener: number;
    /** 2xx HTML pages whose body has fewer than 30 words (near-empty / placeholder). */
    pageEmpty: number;
    /** Pages whose `og:image` is a relative URL — Facebook / LinkedIn require absolute URLs. */
    ogImageNotAbsolute: number;
    /** Pages whose `twitter:image` is a relative URL — Twitter requires absolute URLs. */
    twitterImageNotAbsolute: number;
    /** Pages whose `<link rel="canonical">` points to a relative URL — Google recommends absolute. */
    canonicalNotAbsolute: number;
    /** Pages whose meta description text matches the title verbatim (lazy SEO copy-paste). */
    descriptionEqualsTitle: number;
    /** Pages whose title is a single token (likely too generic, no SERP CTR). */
    titleSingleWord: number;
    /** Pages with > 100 outgoing external links (link-farm / spam signal). */
    externalLinksTooMany: number;
    /** Indexable HTML pages with zero outlinks (link dead-end / orphan leaf). */
    outlinksZero: number;
    /**
     * Pages with at least one internal link pointing to a 3xx redirect.
     * Wastes crawl budget and dilutes link equity — best practice is to
     * update the link to point directly at the final URL.
     */
    internalLinkToRedirect: number;
    /**
     * Pages where the H1 text equals the title text (case-insensitive,
     * trimmed). Often a CMS-default rather than an intentional SEO
     * decision — wastes the second on-page signal.
     */
    h1EqualsTitle: number;
    /**
     * Pages with at least one outgoing link to an external domain whose
     * crawled pages are mostly broken (≥3 attempts AND ≥80% error rate).
     * Hurts user experience + signals abandonment to crawlers.
     */
    deadExternalDomain: number;
    /**
     * Pages whose URL collides with another page after applying the
     * configured URL normalisation (lowercase host, trailing-slash
     * harmonisation, query-strip). Highlights canonicalisation gaps that
     * waste crawl budget and split link equity.
     */
    duplicateUrlPostNorm: number;
    /**
     * Pages whose canonical points to another canonicalised page,
     * forming a chain of length ≥ 2. Search engines may or may not
     * follow the chain — best practice is to point every page directly
     * at the final canonical.
     */
    canonicalChainMultiHop: number;
    /**
     * Pages that load at least one image larger than 200 KB without
     * `loading="lazy"` — the slowest-loading category for any page that
     * reaches LCP from a non-optimised hero image.
     */
    imageSlowLoading: number;
    /**
     * Meta description text equals the H1 text (case-insensitive,
     * trimmed) — duplicates a content signal across two channels and
     * usually means the description was never customised for SERP CTR.
     */
    descriptionEqualsH1: number;
    /**
     * Pages with at least one `<a>` element that is clickable but not
     * crawlable (no href + onclick, `href="javascript:…"`, or
     * `href="#"` paired with onclick). Search-engine bots can't follow
     * these — any navigation that depends on them is invisible.
     */
    jsOnlyNavigation: number;
    /**
     * Pages whose visible-text-to-HTML byte ratio is < 10% — heavy
     * JavaScript / template scaffolding with little crawlable content.
     */
    textCodeRatioLow: number;
    /**
     * Pages with > 20 render-blocking head resources (escalated tier
     * above the existing > 5 "Render-Blocking Head" issue) — almost
     * always a third-party tag bloat that murders LCP.
     */
    renderBlockingCritical: number;
    /**
     * Pages whose `og:image` exceeds 5 MB — Facebook's documented hard
     * cap is 8 MB and OG images > 5 MB are routinely silently dropped
     * by share-card renderers. Determined via the post-crawl image
     * HEAD probe `Content-Length`.
     */
    ogImageTooLarge: number;
    /**
     * Pages whose `twitter:image` exceeds 5 MB. Twitter's documented
     * max is 5 MB for JPG/PNG and 15 MB for GIF — we use 5 MB as the
     * conservative threshold that catches both card types' renderer.
     */
    twitterImageTooLarge: number;
    /**
     * Pages part of a paginated cluster whose ordinals have a gap
     * (e.g. ?page=1, ?page=2, ?page=4 — page 3 missing). Set by the
     * post-crawl `recomputePaginationSequence()` pass.
     */
    paginationSequenceBreak: number;
    /**
     * Pages whose total outgoing link count (internal + external)
     * exceeds the configured `maxLinksPerPage` threshold (default 100).
     */
    linksPerPageTooMany: number;
    /**
     * Pages declaring the same `hreflang` value with two different
     * target URLs — i.e. the page can't decide which page is the "es"
     * version. Detected by post-crawl pass `recomputeHreflangInconsistent`
     * which writes a boolean flag onto each affected URL.
     */
    hreflangInconsistentLang: number;
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
  maxUrlLength: 2048,
  maxQueryStringLength: 0,
  maxFolderDepth: 0,
  storeBodySnapshots: true,
  bodySnapshotMaxBytes: 1_048_576,
  probeImageSizes: true,
  largeImageBytes: 102_400,
  probeTlsCerts: true,
  cdnHosts: [],
  maxLinksPerPage: 100,
  maxResponseTimeMs: 0,
  maxFileSizeBytes: 0,
  followCanonicals: false,
  followPaginationLinks: true,
  followNofollow: false,
  followJsRedirects: false,
  analyseInlinks: true,
  analyseRedirectChains: true,
  analyseHreflang: true,
  analyseDuplicates: true,
  analysePagination: true,
  analyseIssues: true,
  cookiePolicy: 'reject-all',
  perHostUserAgents: [],
  proxyProfiles: [],
  proxyProfileActive: '',
};
