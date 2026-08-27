import type { ProjectDb } from '@freecrawl/db';
import type { ExportDatasetKey } from '@freecrawl/shared-types';

/**
 * Row sources for the non-URL-row export tables (see `ExportDatasetKey`).
 *
 * Every dataset already has a paged query on `ProjectDb` that the matching
 * tab reads through IPC; the exporter walks the same query to its end so
 * the file holds the whole table, not the first screenful the tab happened
 * to load. Rows are yielded as the query returns them — nested (`gsc`,
 * `mobile`, `seo.metrics`) — and the writers read the dotted column keys
 * from `EXPORT_DATASET_COLUMNS` straight off that shape.
 */

/** Per-host context the datasets that are keyed by account need. */
export interface DatasetExportContext {
  /** Linked Google account whose Search Console pull to export. */
  gscAccountId?: string;
  /** Linked Google account whose GA4 pull to export. */
  ga4AccountId?: string;
  /** Search Console URL-matching options (Settings → Integrations → GSC). */
  gscMatchSlash?: boolean;
  gscMatchCase?: boolean;
}

const PAGE_SIZE = 2000;

function* paged<T>(
  fetchPage: (limit: number, offset: number) => { rows: T[] },
): Generator<T> {
  let offset = 0;
  for (;;) {
    const { rows } = fetchPage(PAGE_SIZE, offset);
    for (const row of rows) yield row;
    if (rows.length < PAGE_SIZE) return;
    offset += PAGE_SIZE;
  }
}

export function datasetRows(
  db: ProjectDb,
  dataset: ExportDatasetKey,
  ctx: DatasetExportContext = {},
): Iterable<Record<string, unknown>> {
  const asRecords = <T>(gen: Generator<T>): Iterable<Record<string, unknown>> =>
    gen as Iterable<unknown> as Iterable<Record<string, unknown>>;
  switch (dataset) {
    case 'images':
      return asRecords(paged((limit, offset) => db.queryImages({ limit, offset })));
    case 'broken-links':
      return asRecords(
        paged((limit, offset) => db.queryBrokenLinks({ limit, offset, internal: 'all' })),
      );
    case 'pagespeed':
      return asRecords(paged((limit, offset) => db.queryPagespeed({ limit, offset })));
    case 'crux':
      return asRecords(paged((limit, offset) => db.queryCrux({ limit, offset })));
    case 'spelling':
      return asRecords(paged((limit, offset) => db.querySpelling({ limit, offset })));
    case 'search-console':
      return asRecords(
        paged((limit, offset) =>
          db.queryGsc({
            limit,
            offset,
            accountId: ctx.gscAccountId,
            matchSlash: ctx.gscMatchSlash,
            matchCase: ctx.gscMatchCase,
          }),
        ),
      );
    case 'analytics':
      return asRecords(
        paged((limit, offset) => db.queryGa4({ limit, offset, accountId: ctx.ga4AccountId })),
      );
    default: {
      // Provider-keyed datasets: `ai:<provider>` / `seo:<provider>`.
      const sep = dataset.indexOf(':');
      const family = dataset.slice(0, sep);
      const provider = dataset.slice(sep + 1);
      if (family === 'ai') {
        return asRecords(
          paged((limit, offset) =>
            db.queryAi({ limit, offset, provider: provider as 'openai' | 'anthropic' | 'ollama' }),
          ),
        );
      }
      if (family === 'seo') {
        return asRecords(
          paged((limit, offset) =>
            db.querySeo({
              limit,
              offset,
              provider: provider as 'ahrefs' | 'majestic' | 'moz' | 'semrush',
            }),
          ),
        );
      }
      throw new Error(`exportTabular: unknown dataset '${dataset as string}'`);
    }
  }
}

/**
 * Read one export cell. Column keys are dotted paths (`gsc.clicks`) so a
 * dataset row's nested result objects export as flat columns; a missing
 * intermediate (`gsc: null` — no Search Console data for the page) reads
 * as an empty cell instead of throwing on the row.
 */
export function readCell(row: Record<string, unknown>, key: string): unknown {
  if (key.indexOf('.') < 0) return row[key];
  let cur: unknown = row;
  for (const part of key.split('.')) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return null;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur ?? null;
}
