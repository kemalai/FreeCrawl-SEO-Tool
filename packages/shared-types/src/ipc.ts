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
  crawlProgress: 'crawl:progress',
  crawlDone: 'crawl:done',
  crawlError: 'crawl:error',
  urlsQuery: 'urls:query',
  urlDetailGet: 'urls:detail',
  urlContextMenu: 'url:context-menu',
  urlBulkContextMenu: 'url:bulk-context-menu',
  imagesQuery: 'images:query',
  brokenLinksQuery: 'broken-links:query',
  overviewGet: 'overview:get',
  summaryGet: 'summary:get',
  exportCsv: 'export:csv',
  exportJson: 'export:json',
  exportHtmlReport: 'export:html-report',
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
  logsEntry: 'logs:entry',
  logsOpenWindow: 'logs:open-window',
  robotsTest: 'robots:test',
  reportsPagesPerDirectory: 'reports:pages-per-directory',
  reportsStatusCodeHistogram: 'reports:status-code-histogram',
  reportsDepthHistogram: 'reports:depth-histogram',
  reportsResponseTimeHistogram: 'reports:response-time-histogram',
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
  | 'export-html-report'
  | 'compare-with-project'
  | 'save-project-as'
  | 'open-visualization'
  | 'generate-sitemap'
  | 'open-robots-tester'
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

export interface ExportHtmlReportInput {
  filePath: string;
}

export interface ExportHtmlReportResult {
  filePath: string;
  bytesWritten: number;
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
  urlsQuery(input: UrlsQueryInput): Promise<UrlsQueryResult>;
  urlDetailGet(input: UrlDetailInput): Promise<UrlDetail | null>;
  urlContextMenu(input: UrlContextMenuInput): Promise<void>;
  urlBulkContextMenu(input: UrlBulkContextMenuInput): Promise<void>;
  imagesQuery(input: ImagesQueryInput): Promise<ImagesQueryResult>;
  brokenLinksQuery(input: BrokenLinksQueryInput): Promise<BrokenLinksQueryResult>;
  overviewGet(): Promise<OverviewCounts>;
  summaryGet(): Promise<CrawlSummary>;
  exportCsv(input: ExportCsvInput): Promise<ExportCsvResult>;
  exportJson(input: ExportJsonInput): Promise<ExportJsonResult>;
  exportHtmlReport(input: ExportHtmlReportInput): Promise<ExportHtmlReportResult>;
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
  reportsPagesPerDirectory(input: PagesPerDirectoryInput): Promise<PagesPerDirectoryRow[]>;
  reportsStatusCodeHistogram(): Promise<StatusCodeHistogramRow[]>;
  reportsDepthHistogram(): Promise<DepthHistogramRow[]>;
  reportsResponseTimeHistogram(): Promise<ResponseTimeHistogramRow[]>;
  onLogEntry(cb: (entry: LogEntry) => void): () => void;
  onProgress(cb: (p: CrawlProgress) => void): () => void;
  onDone(cb: (summary: CrawlSummary) => void): () => void;
  onError(cb: (message: string) => void): () => void;
  onMenuEvent(cb: (event: MenuEvent) => void): () => void;
  onDataChanged(cb: () => void): () => void;
}
