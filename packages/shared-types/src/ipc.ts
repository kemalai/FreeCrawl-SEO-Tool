import type {
  AdvancedFilter,
  BrokenLinkRow,
  CrawlConfig,
  CrawlProgress,
  CrawlSummary,
  CrawlUrlRow,
  ImageRow,
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
  | 'generate-sitemap'
  | 'about';

export interface ExportCsvResult {
  filePath: string;
  rowsWritten: number;
}

export interface SitemapGenerateInput {
  filePath: string;
}

export interface SitemapGenerateResult {
  filePath: string;
  urlsWritten: number;
  truncated: boolean;
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
  urlsQuery(input: UrlsQueryInput): Promise<UrlsQueryResult>;
  urlDetailGet(input: UrlDetailInput): Promise<UrlDetail | null>;
  urlContextMenu(input: UrlContextMenuInput): Promise<void>;
  urlBulkContextMenu(input: UrlBulkContextMenuInput): Promise<void>;
  imagesQuery(input: ImagesQueryInput): Promise<ImagesQueryResult>;
  brokenLinksQuery(input: BrokenLinksQueryInput): Promise<BrokenLinksQueryResult>;
  overviewGet(): Promise<OverviewCounts>;
  summaryGet(): Promise<CrawlSummary>;
  exportCsv(input: ExportCsvInput): Promise<ExportCsvResult>;
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
  onLogEntry(cb: (entry: LogEntry) => void): () => void;
  onProgress(cb: (p: CrawlProgress) => void): () => void;
  onDone(cb: (summary: CrawlSummary) => void): () => void;
  onError(cb: (message: string) => void): () => void;
  onMenuEvent(cb: (event: MenuEvent) => void): () => void;
  onDataChanged(cb: () => void): () => void;
}
