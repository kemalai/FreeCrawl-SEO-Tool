import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { ProjectDb } from '@freecrawl/db';
import type { CrawlUrlRow } from '@freecrawl/shared-types';

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
  options: { selectedIds?: number[] } = {},
): Promise<{ rowsWritten: number }> {
  let rowsWritten = 0;
  const header = CSV_COLUMNS.join(',') + '\n';

  const source: Iterable<CrawlUrlRow> =
    options.selectedIds && options.selectedIds.length > 0
      ? db.iterateUrlsByIds(options.selectedIds)
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
