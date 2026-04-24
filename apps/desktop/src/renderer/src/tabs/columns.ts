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
}

export function columnId(c: ColumnSpec): string {
  return c.id ?? (c.key as string);
}

const COL = {
  url: { key: 'url', header: 'URL', size: 460, kind: 'mono' } as ColumnSpec,
  status: { key: 'statusCode', header: 'Status', size: 72, kind: 'status' } as ColumnSpec,
  contentKind: { key: 'contentKind', header: 'Type', size: 72, kind: 'text' } as ColumnSpec,
  indexability: {
    key: 'indexability',
    header: 'Indexability',
    size: 130,
    kind: 'indexability',
  } as ColumnSpec,
  indexabilityStatus: {
    id: 'indexability-status',
    key: 'indexability',
    header: 'Indexability Status',
    size: 200,
    kind: 'indexability-status',
  } as ColumnSpec,
  title: { key: 'title', header: 'Title 1', size: 320, kind: 'text' } as ColumnSpec,
  titleLength: {
    key: 'titleLength',
    header: 'Title 1 Length',
    size: 96,
    kind: 'number',
  } as ColumnSpec,
  metaDescription: {
    key: 'metaDescription',
    header: 'Meta Description 1',
    size: 340,
    kind: 'text',
  } as ColumnSpec,
  metaDescriptionLength: {
    key: 'metaDescriptionLength',
    header: 'Meta Description 1 Length',
    size: 140,
    kind: 'number',
  } as ColumnSpec,
  h1: { key: 'h1', header: 'H1-1', size: 260, kind: 'text' } as ColumnSpec,
  h1Length: {
    key: 'h1Length',
    header: 'H1-1 Length',
    size: 96,
    kind: 'number',
  } as ColumnSpec,
  h1Count: { key: 'h1Count', header: 'H1 Count', size: 80, kind: 'number' } as ColumnSpec,
  h2Count: { key: 'h2Count', header: 'H2 Count', size: 80, kind: 'number' } as ColumnSpec,
  wordCount: { key: 'wordCount', header: 'Word Count', size: 96, kind: 'number' } as ColumnSpec,
  canonical: {
    key: 'canonical',
    header: 'Canonical Link Element 1',
    size: 360,
    kind: 'mono',
  } as ColumnSpec,
  metaRobots: {
    key: 'metaRobots',
    header: 'Meta Robots 1',
    size: 180,
    kind: 'text',
  } as ColumnSpec,
  xRobotsTag: {
    key: 'xRobotsTag',
    header: 'X-Robots-Tag 1',
    size: 180,
    kind: 'text',
  } as ColumnSpec,
  responseTime: {
    key: 'responseTimeMs',
    header: 'Response Time',
    size: 110,
    kind: 'number',
  } as ColumnSpec,
  contentType: {
    key: 'contentType',
    header: 'Content Type',
    size: 170,
    kind: 'text',
  } as ColumnSpec,
  contentLength: {
    key: 'contentLength',
    header: 'Size (Bytes)',
    size: 100,
    kind: 'number',
  } as ColumnSpec,
  depth: { key: 'depth', header: 'Crawl Depth', size: 96, kind: 'number' } as ColumnSpec,
  inlinks: { key: 'inlinks', header: 'Inlinks', size: 80, kind: 'number' } as ColumnSpec,
  outlinks: { key: 'outlinks', header: 'Outlinks', size: 84, kind: 'number' } as ColumnSpec,
  imagesCount: {
    key: 'imagesCount',
    header: 'Images',
    size: 80,
    kind: 'number',
  } as ColumnSpec,
  imagesMissingAlt: {
    key: 'imagesMissingAlt',
    header: 'Imgs Missing Alt',
    size: 120,
    kind: 'number',
  } as ColumnSpec,
  redirectTarget: {
    key: 'redirectTarget',
    header: 'Redirect URL',
    size: 360,
    kind: 'mono',
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
