import type {
  AdvancedFilter,
  BrokenLinkRow,
  CrawlConfig,
  CrawlProgress,
  CrawlSummary,
  CrawlUrlRow,
  ImageRow,
  Indexability,
  OverviewCounts,
  UrlCategory,
  UrlDetail,
} from './crawl.js';

export const IPC = {
  crawlStart: 'crawl:start',
  crawlStop: 'crawl:stop',
  crawlPause: 'crawl:pause',
  crawlResume: 'crawl:resume',
  crawlClear: 'crawl:clear',
  crawlAddUrl: 'crawl:add-url',
  projectSaveAs: 'project:save-as',
  projectOpen: 'project:open',
  projectCurrentPath: 'project:current-path',
  crawlProgress: 'crawl:progress',
  crawlDone: 'crawl:done',
  crawlError: 'crawl:error',
  urlsQuery: 'urls:query',
  urlDetailGet: 'urls:detail',
  urlSourceGet: 'urls:source',
  urlPageImages: 'urls:page-images',
  urlCertInfo: 'urls:cert-info',
  urlContextMenu: 'url:context-menu',
  urlBulkContextMenu: 'url:bulk-context-menu',
  imagesQuery: 'images:query',
  brokenLinksQuery: 'broken-links:query',
  overviewGet: 'overview:get',
  summaryGet: 'summary:get',
  exportCsv: 'export:csv',
  exportJson: 'export:json',
  exportXml: 'export:xml',
  /** GDPR-aligned per-domain delete. Wipes every row whose URL host
   * matches the given domain (and that domain's links/images/headers/
   * url_sources). Used by Settings → "Delete Domain Data". */
  dataDeleteByDomain: 'data:delete-by-domain',
  /** Wave 6 — Crash-recovery surface. Renderer asks the main process
   * whether the previous session left a non-empty `crawl_queue` table;
   * the response carries the seed URL + count so the user can be
   * shown a clear "Resume crawl of X (240 pending)?" prompt. */
  crashRecoveryStatus: 'crash:recovery-status',
  /** Trigger a resume — main process re-creates the Crawler with the
   * previously-saved start URL and enqueues the checkpointed pending
   * items at their original depth before kicking off the queue. */
  crashRecoveryResume: 'crash:recovery-resume',
  /** Discard the checkpoint without resuming. */
  crashRecoveryDiscard: 'crash:recovery-discard',
  exportHtmlReport: 'export:html-report',
  exportBulk: 'export:bulk',
  compareLoad: 'compare:load',
  graphSnapshot: 'graph:snapshot',
  topAnchorTexts: 'graph:anchor-texts',
  sitemapGenerate: 'sitemap:generate',
  menuEvent: 'menu:event',
  dataChanged: 'data:changed',
  appVersion: 'app:version',
  prefsGetAllSync: 'prefs:get-all-sync',
  prefsSet: 'prefs:set',
  prefsDelete: 'prefs:delete',
  confirmClear: 'confirm:clear',
  logsGetAll: 'logs:get-all',
  logsClear: 'logs:clear',
  /** Single log entry — kept for compatibility but not used for the
   * live tail anymore; high-volume crawls would saturate the IPC
   * channel. The renderer receives entries via `logsBatch` instead. */
  logsEntry: 'logs:entry',
  /** Coalesced batch of log entries delivered at most every ~100 ms.
   * One IPC round-trip carries 1–N entries — at 200 logs/s during
   * heavy crawls this drops IPC volume from ~200 msgs/s to ~10. */
  logsBatch: 'logs:batch',
  logsOpenWindow: 'logs:open-window',
  /** main → logs renderer: pause / resume the live setState pump while
   * the user is dragging or resizing the Logs window. Prevents the
   * renderer's render loop from competing with the OS compositor for
   * the main thread, which is what causes the visible "kasma" during
   * drag. */
  logsBusy: 'logs:busy',
  robotsTest: 'robots:test',
  sitemapValidate: 'sitemap:validate',
  reportsPagesPerDirectory: 'reports:pages-per-directory',
  reportsStatusCodeHistogram: 'reports:status-code-histogram',
  reportsDepthHistogram: 'reports:depth-histogram',
  reportsResponseTimeHistogram: 'reports:response-time-histogram',
  reportsTopUrls: 'reports:top-urls',
  reportsExternalDomainHealth: 'reports:external-domain-health',
  reportsAnalyticsCoverage: 'reports:analytics-coverage',
  reportsLinkPositions: 'reports:link-positions',
  reportsImageWeightPerPage: 'reports:image-weight-per-page',
  reportsInlinksHistogram: 'reports:inlinks-histogram',
  reportsWordCountHistogram: 'reports:word-count-histogram',
  reportsUrlLengthHistogram: 'reports:url-length-histogram',
  reportsWordCountPerDirectory: 'reports:word-count-per-directory',
  reportsSitemapOrphans: 'reports:sitemap-orphans',
  reportsServerHeaders: 'reports:server-headers',
  /**
   * Renderer → main heartbeat carrying the live input-lag estimate (ms).
   * The crawler subscribes to this so it can adaptively shrink its
   * concurrency when the renderer's main thread is starved — letting
   * low-end machines stay responsive without the user having to tune
   * `maxConcurrency` by hand.
   */
  rendererLagReport: 'renderer:lag-report',
  prefsExportSettings: 'prefs:export-settings',
  prefsImportSettings: 'prefs:import-settings',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

export interface UrlsQueryInput {
  limit: number;
  offset: number;
  category?: UrlCategory;
  search?: string;
  sortBy?: keyof CrawlUrlRow;
  sortDir?: 'asc' | 'desc';
  filter?: AdvancedFilter;
}

export interface UrlsQueryResult {
  rows: CrawlUrlRow[];
  total: number;
}

export interface ImagesQueryInput {
  limit: number;
  offset: number;
  search?: string;
  missingAltOnly?: boolean;
  internalOnly?: boolean;
}

export interface ImagesQueryResult {
  rows: ImageRow[];
  total: number;
}

export interface BrokenLinksQueryInput {
  limit: number;
  offset: number;
  internal?: 'all' | 'internal' | 'external';
  search?: string;
}

export interface BrokenLinksQueryResult {
  rows: BrokenLinkRow[];
  total: number;
}

export interface ExportCsvInput {
  filePath: string;
  category?: UrlCategory;
  /** If set, only these URL ids are exported (used by "Export Selected"). */
  selectedIds?: number[];
}

export type MenuEvent =
  | 'new-project'
  | 'clear-crawl'
  | 'toggle-sidebar'
  | 'toggle-detail-panel'
  | 'export-csv'
  | 'export-json'
  | 'export-xml'
  | 'export-html-report'
  | 'export-bulk'
  | 'delete-domain-data'
  | 'clear-all-data'
  | 'compare-with-project'
  | 'save-project-as'
  | 'open-visualization'
  | 'generate-sitemap'
  | 'open-robots-tester'
  | 'open-sitemap-validator'
  | 'open-reports'
  | 'open-settings'
  | 'about';

export interface ExportCsvResult {
  filePath: string;
  rowsWritten: number;
}

export interface ExportJsonInput {
  filePath: string;
  category?: UrlCategory;
  selectedIds?: number[];
  /** Pretty-printed (2-space indent) when true. Default false (compact). */
  pretty?: boolean;
}

export interface ExportJsonResult {
  filePath: string;
  rowsWritten: number;
}

export interface ExportXmlInput {
  filePath: string;
  category?: UrlCategory;
  selectedIds?: number[];
}

export interface ExportXmlResult {
  filePath: string;
  rowsWritten: number;
}

export interface DataDeleteByDomainInput {
  /** Hostname to wipe — case-insensitive, no scheme/port. */
  domain: string;
}

export interface CrashRecoveryStatus {
  /** Number of URLs the previous session left pending. 0 = nothing
   * to recover and the renderer skips the prompt. */
  pendingCount: number;
  /** The start URL the previous crawl was running against. */
  seedUrl: string;
}

export interface DataDeleteByDomainResult {
  /** Number of `urls` rows deleted. Cascade handles `links`, `images`,
   *  `headers`, `url_sources`, `urls_issues`. */
  urlsDeleted: number;
  /** Number of associated `links` rows wiped (informational). */
  linksDeleted: number;
}

export interface ExportHtmlReportInput {
  filePath: string;
}

export interface ExportHtmlReportResult {
  filePath: string;
  bytesWritten: number;
}

/** One file produced by a Bulk Export run. */
export interface BulkExportFile {
  /** Absolute output path. */
  filePath: string;
  /** Display label (e.g. "Internal HTML"). */
  label: string;
  /** Category that drove this export. */
  category: UrlCategory;
  rowsWritten: number;
}

export interface BulkExportResult {
  /** Empty if the user cancelled the folder picker. */
  outputDir: string;
  files: BulkExportFile[];
  /** Files that failed to write — exposed so the UI can summarise partial successes. */
  errors: { label: string; error: string }[];
}

export type CompareCategory =
  | 'added'
  | 'removed'
  | 'status'
  | 'title'
  | 'meta'
  | 'h1'
  | 'canonical'
  | 'indexability'
  | 'response_time';

export interface CompareDiffRow {
  url: string;
  category: CompareCategory;
  before: string | null;
  after: string | null;
}

export interface CompareLoadInput {
  /** Optional path; empty triggers an Open File dialog. */
  filePath?: string;
}

export interface CompareLoadResult {
  /** Empty when the user cancelled the file dialog. */
  filePath: string;
  totalA: number;
  totalB: number;
  counts: Record<CompareCategory, number>;
  samples: CompareDiffRow[];
}

export interface GraphNode {
  id: number;
  url: string;
  statusCode: number | null;
  depth: number;
  inlinks: number;
  indexability: Indexability;
}

export interface GraphEdge {
  source: number;
  target: number;
}

export interface GraphSnapshotInput {
  nodeLimit?: number;
}

export interface GraphSnapshotResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AnchorTextRow {
  anchor: string;
  count: number;
}

export interface SitemapGenerateInput {
  filePath: string;
  /**
   * Variant: `standard` (default), `image` (Google Images extension), or
   * `hreflang` (international targeting via `<xhtml:link>`).
   */
  variant?: 'standard' | 'image' | 'hreflang';
  /** Gzip the output (`.xml.gz`). Index file is gzipped too when sharded. */
  gzip?: boolean;
  /** Per-file URL cap (≤50,000). Sharding kicks in when exceeded. */
  splitAtUrlCount?: number;
}

export interface SitemapGenerateResult {
  filePath: string;
  /** All files written (index first when sharded). */
  files?: string[];
  urlsWritten: number;
  truncated: boolean;
  sharded?: boolean;
}

export interface UrlDetailInput {
  id: number;
  linkLimit?: number;
}

export interface UrlSourceInput {
  id: number;
}

export interface UrlSourceResult {
  /** Raw HTML body. Null when no snapshot was stored for this URL. */
  body: string | null;
  /** Pre-truncation byte length of the original response body. */
  bodyLength: number;
  /** True when the stored body was clipped at `bodySnapshotMaxBytes`. */
  truncated: boolean;
  /** ISO timestamp of when the snapshot was captured. */
  capturedAt: string | null;
}

export interface UrlPageImagesInput {
  /** ID of the page URL whose `<img>` references should be returned. */
  id: number;
  limit?: number;
}

export interface UrlCertInfoInput {
  /** ID of the page URL — its host is looked up against `host_certs`. */
  id: number;
}

/**
 * Cached TLS-probe result for the host of a single page. All fields are
 * null when the URL is HTTP-only or when no probe has run yet for this
 * host. `daysUntilExpiry` is computed at probe time, so a long-lived
 * project file might surface a stale negative value — re-crawl to refresh.
 */
export interface UrlCertInfoResult {
  host: string | null;
  validFrom: string | null;
  validTo: string | null;
  daysUntilExpiry: number | null;
  issuer: string | null;
  subject: string | null;
  signatureAlgorithm: string | null;
  protocol: string | null;
  /** 200 = handshake OK + cert read, 0 = error/timeout, -1 = no probe yet. */
  probeStatus: number;
  probeError: string | null;
  probedAt: string | null;
}

/**
 * One image reference on a single page. Combines the canonical entry from
 * the `images` table with the per-page alt text recorded in `image_usages`.
 * The Detail Panel renders these alongside missing-alt warnings.
 */
export interface UrlPageImageRow {
  src: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  isInternal: boolean;
  /** HEAD-probe Content-Length in bytes; null when not yet probed / no header. */
  byteSize: number | null;
}

export interface UrlPageImagesResult {
  rows: UrlPageImageRow[];
}

export interface UrlContextMenuInput {
  url: string;
  urlId: number;
}

export interface UrlBulkContextMenuInput {
  urlIds: number[];
}

export interface ConfirmClearResult {
  confirmed: boolean;
  skipNext: boolean;
}

export interface RobotsTestInput {
  url: string;
  userAgent: string;
  /**
   * Optional custom robots.txt body to test against, instead of fetching
   * the live robots.txt from the URL's origin. Useful for testing a
   * draft policy before deploying it. When set, no network request is
   * made and `result.robotsUrl` is the literal string `"<custom>"`.
   */
  customRobots?: string;
}

export interface PagesPerDirectoryInput {
  /** Path-segment depth to group at (1 = top-level only). Default 1. */
  depth?: number;
  /** Max rows to return. Default 500. */
  limit?: number;
}

export interface PagesPerDirectoryRow {
  directory: string;
  count: number;
}

export interface StatusCodeHistogramRow {
  status: number | null;
  count: number;
}

export interface DepthHistogramRow {
  depth: number;
  count: number;
}

export interface ResponseTimeHistogramRow {
  /** Bucket label (e.g. `"< 100ms"`, `"1–3s"`, `"No response"`). */
  label: string;
  count: number;
}

export type TopUrlMetric =
  | 'response-time'
  | 'inlinks'
  | 'outlinks'
  | 'depth'
  | 'page-size';

export interface TopUrlsInput {
  metric: TopUrlMetric;
  /** Default 25, capped at 500. */
  limit?: number;
}

export interface TopUrlsRow {
  url: string;
  /** Numeric value for the chosen metric (ms / count / depth / bytes). */
  value: number | null;
}

export interface ExternalDomainHealthRow {
  domain: string;
  totalUrls: number;
  successCount: number;
  errorCount: number;
  /** Average response time across all probes for this domain (ms). */
  avgResponseTimeMs: number | null;
  errorRatePercent: number;
}

/**
 * One row in the Link Position report. Aggregates internal links by the
 * page region they live in (navigation / header / content / sidebar /
 * footer / aside) so the user can see how their internal-link weight is
 * distributed.
 */
export interface LinkPositionRow {
  position: string;
  count: number;
}

/**
 * One row in the Image Weight per Page report. `imageBytes` is the sum
 * of HEAD-probed `Content-Length` for every internal image referenced
 * from this page. Lets the user spot the image-heaviest pages without
 * having to inspect each detail panel one by one.
 */
export interface ImageWeightRow {
  url: string;
  imageBytes: number;
  imageCount: number;
}

/** Generic bucketed histogram row used by Inlinks / Word-Count reports. */
export interface BucketHistogramRow {
  label: string;
  count: number;
}

/**
 * One row in the Word Count per Directory report. Aggregated across
 * indexable HTML pages, grouped at the configured top-level path depth.
 * Sorted by `avgWordCount` desc so thin-content sections surface at the
 * bottom and long-form content clusters at the top.
 */
export interface WordCountPerDirectoryRow {
  directory: string;
  avgWordCount: number;
  pageCount: number;
}

export interface WordCountPerDirectoryInput {
  depth: number;
  limit: number;
}

/**
 * One row in the Sitemap Orphans report. A "sitemap orphan" is a URL
 * declared in `<urlset>` (or any nested sitemap-index entry) that the
 * crawl never reached — typically because no internal page linked to
 * it, or because include/exclude / scope rules filtered it out. Each
 * row carries the `<lastmod>` value (when present) so the user can
 * tell whether the entry is genuinely orphaned or merely stale.
 */
export interface SitemapOrphanRow {
  url: string;
  lastmod: string | null;
  sourceSitemap: string | null;
}

/** One row in the Server Stack report — `Server` response-header rollup. */
export interface ServerHeaderRow {
  server: string;
  count: number;
}

/**
 * One row in the Analytics Coverage report. Counts how many indexable HTML
 * pages declare a given tracker — useful to spot incomplete rollouts
 * ("GA4 only on 80% of pages") or duplicated stacks ("GTM and gtag both
 * loaded everywhere").
 */
export interface AnalyticsCoverageRow {
  /** Tracker product name, e.g. `"Google Analytics 4"`. */
  name: string;
  /** Number of pages on which this tracker was detected. */
  pageCount: number;
  /** Number of distinct IDs seen for this tracker (e.g. multiple GA4 properties). */
  distinctIds: number;
  /** Up to 5 sample IDs for quick eyeballing of the rollout. */
  sampleIds: string[];
}

export interface SettingsExportInput {
  /** Optional output path; absent triggers the file picker. */
  filePath?: string;
  /** Config payload to write — caller passes the in-memory CrawlConfig. */
  config: Record<string, unknown>;
}

export interface SettingsExportResult {
  /** Empty when the user cancelled the picker. */
  filePath: string;
  bytesWritten: number;
}

export interface SettingsImportResult {
  /** Empty when the user cancelled. */
  filePath: string;
  /** Parsed config object — caller merges into the active config. */
  config: Record<string, unknown> | null;
  /** Fields in the imported file that we don't recognise (ignored). */
  unknownFields: string[];
}

export interface RobotsTestResult {
  url: string;
  robotsUrl: string;
  status: number | null;
  body: string | null;
  allowed: boolean;
  crawlDelay: number | null;
  sitemaps: string[];
  error: string | null;
}

export interface SitemapValidateInput {
  /** A sitemap.xml or sitemap-index.xml URL to fetch and validate. */
  url: string;
  /** Optional User-Agent override (defaults to FreeCrawl's). */
  userAgent?: string;
}

export interface SitemapValidateResult {
  url: string;
  /** Sitemap URLs we attempted to fetch (root + children via index). */
  sitemapsTried: string[];
  /** Sitemap URLs that returned valid XML and were parsed. */
  sitemapsParsed: string[];
  /** Per-sitemap fetch errors. */
  errors: { sitemap: string; error: string }[];
  /** Total URL entries discovered across the (possibly nested) sitemap tree. */
  urlCount: number;
  /** True when the internal cap was hit while walking. */
  truncated: boolean;
  /** Findings from the protocol-validity check (URL count, file size, lastmod). */
  findings: string[];
  /** Sample of `<lastmod>` values from up to the first ~50 entries. */
  lastmodSamples: string[];
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  /** Monotonic sequence id, increments on every log call this session. */
  id: number;
  /** ISO 8601 timestamp. */
  ts: string;
  level: LogLevel;
  /** Originating subsystem: 'main', 'crawler', 'ipc', 'console', 'uncaught', 'renderer', 'fetch'. */
  source: string;
  message: string;
}

export interface FreeCrawlApi {
  crawlStart(config: CrawlConfig): Promise<void>;
  crawlStop(): Promise<void>;
  crawlPause(): Promise<void>;
  crawlResume(): Promise<void>;
  crawlClear(): Promise<void>;
  crawlAddUrl(url: string): Promise<{ accepted: boolean }>;
  projectSaveAs(): Promise<{ filePath: string; bytesWritten: number } | null>;
  projectOpen(filePath?: string): Promise<{ filePath: string } | null>;
  projectCurrentPath(): Promise<string | null>;
  urlsQuery(input: UrlsQueryInput): Promise<UrlsQueryResult>;
  urlDetailGet(input: UrlDetailInput): Promise<UrlDetail | null>;
  urlSourceGet(input: UrlSourceInput): Promise<UrlSourceResult>;
  urlPageImages(input: UrlPageImagesInput): Promise<UrlPageImagesResult>;
  urlCertInfo(input: UrlCertInfoInput): Promise<UrlCertInfoResult>;
  urlContextMenu(input: UrlContextMenuInput): Promise<void>;
  urlBulkContextMenu(input: UrlBulkContextMenuInput): Promise<void>;
  imagesQuery(input: ImagesQueryInput): Promise<ImagesQueryResult>;
  brokenLinksQuery(input: BrokenLinksQueryInput): Promise<BrokenLinksQueryResult>;
  overviewGet(): Promise<OverviewCounts>;
  summaryGet(): Promise<CrawlSummary>;
  exportCsv(input: ExportCsvInput): Promise<ExportCsvResult>;
  exportJson(input: ExportJsonInput): Promise<ExportJsonResult>;
  exportXml(input: ExportXmlInput): Promise<ExportXmlResult>;
  dataDeleteByDomain(
    input: DataDeleteByDomainInput,
  ): Promise<DataDeleteByDomainResult>;
  crashRecoveryStatus(): Promise<CrashRecoveryStatus>;
  crashRecoveryResume(): Promise<{ accepted: boolean }>;
  crashRecoveryDiscard(): Promise<void>;
  exportHtmlReport(input: ExportHtmlReportInput): Promise<ExportHtmlReportResult>;
  exportBulk(): Promise<BulkExportResult>;
  compareLoad(input: CompareLoadInput): Promise<CompareLoadResult>;
  graphSnapshot(input: GraphSnapshotInput): Promise<GraphSnapshotResult>;
  topAnchorTexts(limit?: number): Promise<AnchorTextRow[]>;
  sitemapGenerate(input: SitemapGenerateInput): Promise<SitemapGenerateResult>;
  appVersion(): Promise<string>;
  prefsGetAll(): Record<string, unknown>;
  prefsGet(key: string): unknown;
  prefsSet(key: string, value: unknown): void;
  prefsDelete(key: string): void;
  confirmClear(): Promise<ConfirmClearResult>;
  logsGetAll(): Promise<LogEntry[]>;
  logsClear(): Promise<void>;
  logsOpenWindow(): Promise<void>;
  robotsTest(input: RobotsTestInput): Promise<RobotsTestResult>;
  sitemapValidate(input: SitemapValidateInput): Promise<SitemapValidateResult>;
  reportsPagesPerDirectory(input: PagesPerDirectoryInput): Promise<PagesPerDirectoryRow[]>;
  reportsStatusCodeHistogram(): Promise<StatusCodeHistogramRow[]>;
  reportsDepthHistogram(): Promise<DepthHistogramRow[]>;
  reportsResponseTimeHistogram(): Promise<ResponseTimeHistogramRow[]>;
  reportsTopUrls(input: TopUrlsInput): Promise<TopUrlsRow[]>;
  reportsExternalDomainHealth(limit?: number): Promise<ExternalDomainHealthRow[]>;
  reportsAnalyticsCoverage(): Promise<AnalyticsCoverageRow[]>;
  reportsLinkPositions(): Promise<LinkPositionRow[]>;
  reportsImageWeightPerPage(limit?: number): Promise<ImageWeightRow[]>;
  reportsInlinksHistogram(): Promise<BucketHistogramRow[]>;
  reportsWordCountHistogram(): Promise<BucketHistogramRow[]>;
  reportsUrlLengthHistogram(): Promise<BucketHistogramRow[]>;
  reportsWordCountPerDirectory(
    input: WordCountPerDirectoryInput,
  ): Promise<WordCountPerDirectoryRow[]>;
  reportsSitemapOrphans(limit?: number): Promise<SitemapOrphanRow[]>;
  reportsServerHeaders(): Promise<ServerHeaderRow[]>;
  /** Heartbeat: renderer reports its latest input-lag sample (ms). */
  reportRendererLag(lagMs: number): void;
  prefsExportSettings(input: SettingsExportInput): Promise<SettingsExportResult>;
  prefsImportSettings(): Promise<SettingsImportResult>;
  onLogEntry(cb: (entry: LogEntry) => void): () => void;
  onLogsBatch(cb: (entries: LogEntry[]) => void): () => void;
  onLogsBusy(cb: (busy: boolean) => void): () => void;
  onProgress(cb: (p: CrawlProgress) => void): () => void;
  onDone(cb: (summary: CrawlSummary) => void): () => void;
  onError(cb: (message: string) => void): () => void;
  onMenuEvent(cb: (event: MenuEvent) => void): () => void;
  onDataChanged(cb: () => void): () => void;
}
