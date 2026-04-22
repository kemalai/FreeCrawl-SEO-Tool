import type { CrawlConfig, CrawlProgress, CrawlSummary, CrawlUrlRow } from './crawl.js';

export const IPC = {
  crawlStart: 'crawl:start',
  crawlStop: 'crawl:stop',
  crawlProgress: 'crawl:progress',
  crawlDone: 'crawl:done',
  crawlError: 'crawl:error',
  urlsQuery: 'urls:query',
  urlsCount: 'urls:count',
  summaryGet: 'summary:get',
  exportCsv: 'export:csv',
  appVersion: 'app:version',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

export interface UrlsQueryInput {
  limit: number;
  offset: number;
  filter?: 'all' | 'internal' | 'external' | 'errors' | 'redirects';
  search?: string;
  sortBy?: keyof CrawlUrlRow;
  sortDir?: 'asc' | 'desc';
}

export interface UrlsQueryResult {
  rows: CrawlUrlRow[];
  total: number;
}

export interface ExportCsvInput {
  filePath: string;
  filter?: UrlsQueryInput['filter'];
}

export interface ExportCsvResult {
  filePath: string;
  rowsWritten: number;
}

export interface FreeCrawlApi {
  crawlStart(config: CrawlConfig): Promise<void>;
  crawlStop(): Promise<void>;
  urlsQuery(input: UrlsQueryInput): Promise<UrlsQueryResult>;
  summaryGet(): Promise<CrawlSummary>;
  exportCsv(input: ExportCsvInput): Promise<ExportCsvResult>;
  appVersion(): Promise<string>;
  onProgress(cb: (p: CrawlProgress) => void): () => void;
  onDone(cb: (summary: CrawlSummary) => void): () => void;
  onError(cb: (message: string) => void): () => void;
}
