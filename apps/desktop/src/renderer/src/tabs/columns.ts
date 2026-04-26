import type { CrawlUrlRow } from '@freecrawl/shared-types';
import type { TabKey } from '../store.js';

export interface ColumnSpec {
  /**
   * Unique UI id for this column (React key, width storage, resize). Defaults
   * to `key`, but two specs can share the same data `key` — e.g. Indexability
   * and Indexability Status both read `indexability` but must render as
   * separate columns with their own widths.
   */
  id?: string;
  key: keyof CrawlUrlRow;
  header: string;
  size: number;
  align?: 'left' | 'right';
  kind?: 'status' | 'mono' | 'number' | 'indexability' | 'indexability-status' | 'text';
  /** Tooltip description shown next to the header (info icon). */
  info?: string;
  /** Concrete example/value rendered under "Example" in the header tooltip. */
  example?: string;
}

export function columnId(c: ColumnSpec): string {
  return c.id ?? (c.key as string);
}

const COL = {
  url: {
    key: 'url',
    header: 'URL',
    size: 460,
    kind: 'mono',
    info: 'The fully normalised URL of the crawled resource (post URL-rewriting).',
    example: 'https://example.com/blog/post-1',
  } as ColumnSpec,
  status: {
    key: 'statusCode',
    header: 'Status',
    size: 72,
    kind: 'status',
    info: 'HTTP response status code. Empty/Failed indicates a network error before any response was received.',
    example: '200, 301, 404, 500',
  } as ColumnSpec,
  contentKind: {
    key: 'contentKind',
    header: 'Type',
    size: 72,
    kind: 'text',
    info: 'Coarse content classification derived from URL extension and Content-Type header.',
    example: 'html, js, css, image, pdf, font, other',
  } as ColumnSpec,
  indexability: {
    key: 'indexability',
    header: 'Indexability',
    size: 130,
    kind: 'indexability',
    info: 'Whether the URL is eligible to appear in search results. Combines status code, robots directives, canonical, and meta-refresh signals.',
    example: 'Indexable / Non-Indexable',
  } as ColumnSpec,
  indexabilityStatus: {
    id: 'indexability-status',
    key: 'indexability',
    header: 'Indexability Status',
    size: 200,
    kind: 'indexability-status',
    info: 'Specific reason a URL is non-indexable. For Indexable URLs this column is empty.',
    example: 'noindex, canonicalised, redirected, blocked-by-robots',
  } as ColumnSpec,
  title: {
    key: 'title',
    header: 'Title 1',
    size: 320,
    kind: 'text',
    info: 'Contents of the first <title> element. Google primarily uses this in SERP titles.',
    example: 'Buy Affordable Game Keys | Example Store',
  } as ColumnSpec,
  titleLength: {
    key: 'titleLength',
    header: 'Title 1 Length',
    size: 96,
    kind: 'number',
    info: 'Character count of the title. Recommended: 30–60 characters; over 60 risks truncation in SERPs.',
    example: '52',
  } as ColumnSpec,
  metaDescription: {
    key: 'metaDescription',
    header: 'Meta Description 1',
    size: 340,
    kind: 'text',
    info: 'Contents of the first <meta name="description"> tag. May be used as the SERP snippet.',
    example: 'Shop the latest game keys at unbeatable prices…',
  } as ColumnSpec,
  metaDescriptionLength: {
    key: 'metaDescriptionLength',
    header: 'Meta Description 1 Length',
    size: 140,
    kind: 'number',
    info: 'Character count of the meta description. Recommended: 70–155 characters; over 155 risks truncation.',
    example: '142',
  } as ColumnSpec,
  h1: {
    key: 'h1',
    header: 'H1-1',
    size: 260,
    kind: 'text',
    info: 'Text of the first <h1> on the page. Should match user intent and ideally complement (not duplicate) the title.',
    example: 'Welcome to Example Store',
  } as ColumnSpec,
  h1Length: {
    key: 'h1Length',
    header: 'H1-1 Length',
    size: 96,
    kind: 'number',
    info: 'Character count of the first H1.',
    example: '24',
  } as ColumnSpec,
  h1Count: {
    key: 'h1Count',
    header: 'H1 Count',
    size: 80,
    kind: 'number',
    info: 'Total number of <h1> elements on the page. SEO best practice is exactly 1.',
    example: '1',
  } as ColumnSpec,
  h2Count: {
    key: 'h2Count',
    header: 'H2 Count',
    size: 80,
    kind: 'number',
    info: 'Total number of <h2> elements on the page.',
    example: '4',
  } as ColumnSpec,
  wordCount: {
    key: 'wordCount',
    header: 'Word Count',
    size: 96,
    kind: 'number',
    info: 'Visible body text word count (excludes <script>/<style>). Useful for identifying thin content.',
    example: '650',
  } as ColumnSpec,
  canonical: {
    key: 'canonical',
    header: 'Canonical Link Element 1',
    size: 360,
    kind: 'mono',
    info: 'URL declared by the first <link rel="canonical"> tag. Tells search engines which version to index when duplicates exist.',
    example: 'https://example.com/canonical-version',
  } as ColumnSpec,
  metaRobots: {
    key: 'metaRobots',
    header: 'Meta Robots 1',
    size: 180,
    kind: 'text',
    info: 'Contents of the first <meta name="robots"> tag. Controls per-page indexing/following behaviour.',
    example: 'index,follow / noindex,nofollow',
  } as ColumnSpec,
  xRobotsTag: {
    key: 'xRobotsTag',
    header: 'X-Robots-Tag 1',
    size: 180,
    kind: 'text',
    info: 'Value of the X-Robots-Tag HTTP response header. Same semantics as meta robots but applied at the server.',
    example: 'noindex, nofollow',
  } as ColumnSpec,
  responseTime: {
    key: 'responseTimeMs',
    header: 'Response Time',
    size: 110,
    kind: 'number',
    info: 'Time-to-first-byte in milliseconds (network + server, excluding parse). Lower is better; >2000 ms is slow.',
    example: '243',
  } as ColumnSpec,
  contentType: {
    key: 'contentType',
    header: 'Content Type',
    size: 170,
    kind: 'text',
    info: 'Raw value of the Content-Type response header (incl. charset).',
    example: 'text/html; charset=utf-8',
  } as ColumnSpec,
  contentLength: {
    key: 'contentLength',
    header: 'Size (Bytes)',
    size: 100,
    kind: 'number',
    info: 'Response body size in bytes (compressed transfer size, post-Content-Encoding).',
    example: '24560',
  } as ColumnSpec,
  depth: {
    key: 'depth',
    header: 'Crawl Depth',
    size: 96,
    kind: 'number',
    info: 'BFS click depth from the start URL. Start URL = 0; its outlinks = 1; etc. High depth often correlates with low importance.',
    example: '3',
  } as ColumnSpec,
  inlinks: {
    key: 'inlinks',
    header: 'Inlinks',
    size: 80,
    kind: 'number',
    info: 'Number of internal pages that link to this URL. A rough internal-PageRank signal.',
    example: '47',
  } as ColumnSpec,
  outlinks: {
    key: 'outlinks',
    header: 'Outlinks',
    size: 84,
    kind: 'number',
    info: 'Number of unique <a> links emitted from this page (internal + external).',
    example: '32',
  } as ColumnSpec,
  imagesCount: {
    key: 'imagesCount',
    header: 'Images',
    size: 80,
    kind: 'number',
    info: 'Number of <img> elements on the page.',
    example: '12',
  } as ColumnSpec,
  imagesMissingAlt: {
    key: 'imagesMissingAlt',
    header: 'Imgs Missing Alt',
    size: 120,
    kind: 'number',
    info: 'Images on this page that have no alt attribute. WCAG accessibility issue + missed alt-as-anchor SEO opportunity.',
    example: '3',
  } as ColumnSpec,
  redirectTarget: {
    key: 'redirectTarget',
    header: 'Redirect URL',
    size: 360,
    kind: 'mono',
    info: 'Location header value when status is 3xx. The URL the server points to next; chain length is in the URL Details panel.',
    example: 'https://example.com/new-path',
  } as ColumnSpec,
  clusterId: {
    key: 'clusterId',
    header: 'Cluster',
    size: 72,
    kind: 'number',
    align: 'right',
    info: 'Near-duplicate cluster ID assigned by the post-crawl SimHash pass. 0 = singleton (no near-duplicates within the configured Hamming threshold). Pages sharing a non-zero cluster ID are mutually similar.',
    example: '0 (no duplicates), 7 (member of cluster #7)',
  } as ColumnSpec,
  clusterSize: {
    key: 'clusterSize',
    header: 'Cluster Size',
    size: 88,
    kind: 'number',
    align: 'right',
    info: 'Number of pages in this URL\'s near-duplicate cluster (1 = no duplicates, ≥2 = part of a duplicate group). Tunable via Settings → Duplicates.',
    example: '1 = unique, 5 = part of a 5-page near-duplicate group',
  } as ColumnSpec,
};

export const COLUMN_SPECS: Record<TabKey, ColumnSpec[]> = {
  internal: [
    COL.url,
    COL.contentKind,
    COL.status,
    COL.indexability,
    COL.indexabilityStatus,
    COL.title,
    COL.titleLength,
    COL.metaDescription,
    COL.metaDescriptionLength,
    COL.h1,
    COL.wordCount,
    COL.responseTime,
    COL.contentLength,
    COL.depth,
    COL.inlinks,
    COL.outlinks,
    COL.imagesCount,
    COL.imagesMissingAlt,
  ],
  external: [
    COL.url,
    COL.contentKind,
    COL.status,
    COL.contentType,
    COL.contentLength,
    COL.responseTime,
    COL.inlinks,
  ],
  'response-codes': [
    COL.url,
    COL.status,
    COL.contentKind,
    COL.redirectTarget,
    COL.indexability,
    COL.responseTime,
    COL.inlinks,
  ],
  url: [COL.url, COL.status, COL.contentKind, COL.indexability, COL.depth, COL.inlinks],
  'page-titles': [
    COL.url,
    COL.title,
    COL.titleLength,
    COL.status,
    COL.indexability,
    COL.inlinks,
  ],
  'meta-description': [
    COL.url,
    COL.metaDescription,
    COL.metaDescriptionLength,
    COL.status,
    COL.indexability,
    COL.inlinks,
  ],
  h1: [
    COL.url,
    COL.h1,
    COL.h1Length,
    COL.h1Count,
    COL.status,
    COL.indexability,
    COL.inlinks,
  ],
  h2: [COL.url, COL.h2Count, COL.status, COL.indexability, COL.inlinks],
  content: [
    COL.url,
    COL.wordCount,
    COL.contentLength,
    COL.clusterId,
    COL.clusterSize,
    COL.status,
    COL.indexability,
    COL.inlinks,
  ],
  // Images / Broken Links tabs have their own table layouts (separate
  // components) and don't share the URL-row column schema. Entries kept
  // so Record<TabKey, ...> is total.
  images: [],
  'broken-links': [],
  canonicals: [
    COL.url,
    COL.canonical,
    COL.indexability,
    COL.indexabilityStatus,
    COL.status,
    COL.inlinks,
  ],
  directives: [
    COL.url,
    COL.metaRobots,
    COL.xRobotsTag,
    COL.canonical,
    COL.indexability,
    COL.status,
  ],
  links: [COL.url, COL.inlinks, COL.outlinks, COL.status, COL.indexability],
};
