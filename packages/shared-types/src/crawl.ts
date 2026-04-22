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
  h2Count: number;
  wordCount: number | null;
  canonical: string | null;
  metaRobots: string | null;
  xRobotsTag: string | null;
  contentType: string | null;
  contentLength: number | null;
  responseTimeMs: number | null;
  depth: number;
  inlinks: number;
  outlinks: number;
  redirectTarget: string | null;
  crawledAt: string;
}

export interface CrawlConfig {
  startUrl: string;
  maxDepth: number;
  maxUrls: number;
  maxConcurrency: number;
  maxRps: number;
  requestTimeoutMs: number;
  userAgent: string;
  followRedirects: boolean;
  respectRobotsTxt: boolean;
  crawlExternal: boolean;
  includeSubdomains: boolean;
  acceptLanguage: string;
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

export interface DiscoveredLink {
  fromUrl: string;
  toUrl: string;
  anchor: string | null;
  rel: string | null;
  isInternal: boolean;
}

export const DEFAULT_CRAWL_CONFIG: CrawlConfig = {
  startUrl: '',
  maxDepth: 10,
  maxUrls: 100_000,
  maxConcurrency: 5,
  maxRps: 5,
  requestTimeoutMs: 20_000,
  userAgent: 'FreeCrawlSEO/0.1 (+https://github.com/kemalai/FreeCrawl-SEO-Tool)',
  followRedirects: true,
  respectRobotsTxt: true,
  crawlExternal: false,
  includeSubdomains: false,
  acceptLanguage: 'tr,en;q=0.8',
};
