import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { ProjectDb } from '@freecrawl/db';
import type { CrawlUrlRow } from '@freecrawl/shared-types';

export interface JsonExportOptions {
  /** When set, export only these URL ids (used by "Export Selected"). */
  selectedIds?: number[];
  /** Pretty-print with 2-space indent. Default `false` — newline-delimited compact JSON. */
  pretty?: boolean;
}

/**
 * Stream every URL row as a JSON array — every column the Crawler captures
 * (security headers, structured-data summary, hreflang JSON, pagination,
 * custom search hits, redirect chain, …) is included verbatim. Unlike the
 * CSV exporter, no fields are dropped: this is the canonical "give me
 * everything" dump for downstream tooling / pipelines.
 *
 * Memory profile is bounded — rows are written as we iterate from
 * SQLite, never held in a JS array. Safe for 1M-row exports.
 */
export async function exportUrlsToJson(
  db: ProjectDb,
  filePath: string,
  options: JsonExportOptions = {},
): Promise<{ rowsWritten: number }> {
  let rowsWritten = 0;
  const indent = options.pretty ? '  ' : '';
  const sep = options.pretty ? ',\n' : ',';
  const lead = options.pretty ? '\n' : '';
  const tail = options.pretty ? '\n' : '';

  const source: Iterable<CrawlUrlRow> =
    options.selectedIds && options.selectedIds.length > 0
      ? db.iterateUrlsByIds(options.selectedIds)
      : db.iterateAllUrls();

  const generator = async function* (): AsyncGenerator<string> {
    yield '[' + lead;
    let first = true;
    for (const row of source) {
      const json = options.pretty
        ? JSON.stringify(row, null, 2).replace(/^/gm, indent).slice(indent.length)
        : JSON.stringify(row);
      yield (first ? indent : sep + indent) + json;
      first = false;
      rowsWritten++;
    }
    yield tail + ']\n';
  };

  await pipeline(Readable.from(generator()), createWriteStream(filePath, { encoding: 'utf8' }));

  return { rowsWritten };
}
