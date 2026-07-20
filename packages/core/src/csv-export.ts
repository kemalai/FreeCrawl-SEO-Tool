import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { ProjectDb } from '@freecrawl/db';
import type { CrawlUrlRow, UrlCategory } from '@freecrawl/shared-types';

const CSV_COLUMNS: (keyof CrawlUrlRow)[] = [
  'url',
  'statusCode',
  'contentKind',
  'indexability',
  'indexabilityReason',
  'title',
  'titleLength',
  'metaDescription',
  'metaDescriptionLength',
  'h1',
  'h2Count',
  'wordCount',
  'canonical',
  'canonicalHttp',
  'metaRobots',
  'xRobotsTag',
  'contentType',
  'contentLength',
  'responseTimeMs',
  'depth',
  'inlinks',
  'outlinks',
  'redirectTarget',
  'crawledAt',
];

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportUrlsToCsv(
  db: ProjectDb,
  filePath: string,
  options: { selectedIds?: number[]; category?: UrlCategory } = {},
): Promise<{ rowsWritten: number }> {
  let rowsWritten = 0;
  const header = CSV_COLUMNS.join(',') + '\n';

  const source: Iterable<CrawlUrlRow> =
    options.selectedIds && options.selectedIds.length > 0
      ? db.iterateUrlsByIds(options.selectedIds)
      : options.category && options.category !== 'all'
        ? db.iterateUrlsByCategory(options.category)
        : db.iterateAllUrls();

  const generator = async function* (): AsyncGenerator<string> {
    yield '﻿' + header;
    for (const row of source) {
      const line = CSV_COLUMNS.map((col) => escapeCsv(row[col])).join(',') + '\n';
      rowsWritten++;
      yield line;
    }
  };

  await pipeline(Readable.from(generator()), createWriteStream(filePath, { encoding: 'utf8' }));

  return { rowsWritten };
}

/** Fixed column order for the Images CSV export. Matches the columns
 *  shown in the Images tab so the file is a 1:1 export of the grid. */
const IMAGES_CSV_HEADER = [
  'Image URL',
  'Alt',
  'Width',
  'Height',
  'Internal',
  'Occurrences',
] as const;

/**
 * Stream every image row to a CSV file. Honours the Images tab's
 * `missingAltOnly` + `search` filters so the export matches what the
 * user is currently looking at. Streamed row-by-row so a 100K-image
 * crawl never builds a giant string in memory.
 */
export async function exportImagesToCsv(
  db: ProjectDb,
  filePath: string,
  options: {
    missingAltOnly?: boolean;
    emptyAltOnly?: boolean;
    duplicateAltOnly?: boolean;
    search?: string;
  } = {},
): Promise<{ rowsWritten: number }> {
  let rowsWritten = 0;
  const header = IMAGES_CSV_HEADER.join(',') + '\n';

  const generator = async function* (): AsyncGenerator<string> {
    yield '﻿' + header;
    for (const row of db.iterateImages({
      missingAltOnly: options.missingAltOnly,
      emptyAltOnly: options.emptyAltOnly,
      duplicateAltOnly: options.duplicateAltOnly,
      search: options.search,
    })) {
      const cells = [
        row.src,
        row.alt,
        row.width,
        row.height,
        row.isInternal ? 'internal' : 'external',
        row.occurrences,
      ];
      rowsWritten++;
      yield cells.map(escapeCsv).join(',') + '\n';
    }
  };

  await pipeline(Readable.from(generator()), createWriteStream(filePath, { encoding: 'utf8' }));

  return { rowsWritten };
}

/** Fixed column order for the Broken Links CSV export. */
const BROKEN_LINK_CSV_HEADER = [
  'Source URL',
  'Source Status',
  'Target URL',
  'Target Status',
  'Anchor',
  'Rel',
  'Type',
] as const;

/**
 * Stream every broken link (target 4xx/5xx) to a CSV file. Mirrors the
 * Broken Links tab grid; `internal` scopes the export the same way the
 * tab's sidebar filter does. Streamed row-by-row so a large set never
 * builds a big string in memory.
 */
export async function exportBrokenLinksToCsv(
  db: ProjectDb,
  filePath: string,
  options: { internal?: 'all' | 'internal' | 'external' } = {},
): Promise<{ rowsWritten: number }> {
  let rowsWritten = 0;
  const header = BROKEN_LINK_CSV_HEADER.join(',') + '\n';

  const generator = async function* (): AsyncGenerator<string> {
    yield '﻿' + header;
    for (const row of db.iterateBrokenLinks(options.internal ?? 'all')) {
      const cells = [
        row.fromUrl,
        row.fromStatusCode,
        row.toUrl,
        row.toStatusCode,
        row.anchor,
        row.rel,
        row.isInternal ? 'internal' : 'external',
      ];
      rowsWritten++;
      yield cells.map(escapeCsv).join(',') + '\n';
    }
  };

  await pipeline(Readable.from(generator()), createWriteStream(filePath, { encoding: 'utf8' }));

  return { rowsWritten };
}
