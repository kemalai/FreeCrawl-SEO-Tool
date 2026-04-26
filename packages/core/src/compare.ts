import type { ProjectDb } from '@freecrawl/db';

/**
 * Cross-project diff engine. Compares two crawl databases by URL key
 * and surfaces high-signal SEO field changes:
 *
 *  - URLs added in B but missing from A (new pages)
 *  - URLs removed in A but missing from B (deleted / no-longer-found pages)
 *  - URLs present in both whose status code, title, meta, H1, canonical,
 *    indexability, or response time changed beyond a configurable
 *    threshold
 *
 * Designed for the "before / after deploy" workflow — we cap each
 * change category at `perCategoryLimit` (default 5000) so a 1M-URL
 * compare doesn't allocate a 20 MB JSON payload to ship to the
 * renderer. The summary counts are exact regardless of the cap.
 */
export interface CompareOptions {
  /**
   * Hard cap per change category for the returned `samples`. Counts
   * remain accurate; samples are truncated. Default 5000.
   */
  perCategoryLimit?: number;
  /**
   * Minimum response-time delta (ms) to surface as a change. Smaller
   * fluctuations are network noise. Default 500 ms.
   */
  responseTimeThresholdMs?: number;
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
  /** Old value formatted for display (a-side). null = absent. */
  before: string | null;
  /** New value formatted for display (b-side). null = absent. */
  after: string | null;
}

export interface CompareSummary {
  /** Total URLs in each side. */
  totalA: number;
  totalB: number;
  /** Counts per category (exact, not capped). */
  counts: Record<CompareCategory, number>;
  /** Truncated sample rows per category (≤ perCategoryLimit). */
  samples: CompareDiffRow[];
}

interface MinimalRow {
  url: string;
  status_code: number | null;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  canonical: string | null;
  indexability: string;
  response_time_ms: number | null;
}

function loadAll(db: ProjectDb): MinimalRow[] {
  // Pull only the fields the diff needs — keeps memory bounded at 1M
  // URLs (~120 MB for the seven columns vs ~600 MB for the full table).
  // Reaches into the underlying DatabaseSync via ProjectDb.exec for the
  // raw SELECT — no public iterator covers exactly this projection and
  // the diff is a one-shot operation, so we keep the helper here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawDb = (db as any).db as {
    prepare: (sql: string) => { all: () => unknown };
  };
  return rawDb
    .prepare(
      `SELECT url, status_code, title, meta_description, h1, canonical,
              indexability, response_time_ms
         FROM urls
        WHERE is_external = 0 AND content_kind = 'html'`,
    )
    .all() as MinimalRow[];
}

const EMPTY_COUNTS: Record<CompareCategory, number> = {
  added: 0,
  removed: 0,
  status: 0,
  title: 0,
  meta: 0,
  h1: 0,
  canonical: 0,
  indexability: 0,
  response_time: 0,
};

export function compareCrawls(
  a: ProjectDb,
  b: ProjectDb,
  options: CompareOptions = {},
): CompareSummary {
  const limit = options.perCategoryLimit ?? 5000;
  const rtThreshold = options.responseTimeThresholdMs ?? 500;

  const rowsA = loadAll(a);
  const rowsB = loadAll(b);

  const mapA = new Map<string, MinimalRow>();
  for (const r of rowsA) mapA.set(r.url, r);
  const mapB = new Map<string, MinimalRow>();
  for (const r of rowsB) mapB.set(r.url, r);

  const counts: Record<CompareCategory, number> = { ...EMPTY_COUNTS };
  const samples: CompareDiffRow[] = [];

  const push = (row: CompareDiffRow): void => {
    counts[row.category]++;
    if (samples.filter((s) => s.category === row.category).length < limit) {
      samples.push(row);
    }
  };

  // Added: in B but not in A.
  for (const [url, r] of mapB) {
    if (!mapA.has(url)) {
      push({
        url,
        category: 'added',
        before: null,
        after: r.status_code !== null ? String(r.status_code) : null,
      });
    }
  }

  // Removed: in A but not in B. Scan the other direction so we don't
  // double-pass the larger of the two maps.
  for (const [url, r] of mapA) {
    if (!mapB.has(url)) {
      push({
        url,
        category: 'removed',
        before: r.status_code !== null ? String(r.status_code) : null,
        after: null,
      });
    }
  }

  // Field-level changes — present in both, value differs.
  for (const [url, ra] of mapA) {
    const rb = mapB.get(url);
    if (!rb) continue;

    if (ra.status_code !== rb.status_code) {
      push({
        url,
        category: 'status',
        before: ra.status_code !== null ? String(ra.status_code) : null,
        after: rb.status_code !== null ? String(rb.status_code) : null,
      });
    }
    if ((ra.title ?? '') !== (rb.title ?? '')) {
      push({
        url,
        category: 'title',
        before: ra.title,
        after: rb.title,
      });
    }
    if ((ra.meta_description ?? '') !== (rb.meta_description ?? '')) {
      push({
        url,
        category: 'meta',
        before: ra.meta_description,
        after: rb.meta_description,
      });
    }
    if ((ra.h1 ?? '') !== (rb.h1 ?? '')) {
      push({
        url,
        category: 'h1',
        before: ra.h1,
        after: rb.h1,
      });
    }
    if ((ra.canonical ?? '') !== (rb.canonical ?? '')) {
      push({
        url,
        category: 'canonical',
        before: ra.canonical,
        after: rb.canonical,
      });
    }
    if (ra.indexability !== rb.indexability) {
      push({
        url,
        category: 'indexability',
        before: ra.indexability,
        after: rb.indexability,
      });
    }
    // Response-time deltas are always noisy in the small. Apply a
    // configurable absolute-ms floor before flagging.
    const rtA = ra.response_time_ms ?? 0;
    const rtB = rb.response_time_ms ?? 0;
    if (Math.abs(rtA - rtB) >= rtThreshold) {
      push({
        url,
        category: 'response_time',
        before: ra.response_time_ms !== null ? `${ra.response_time_ms} ms` : null,
        after: rb.response_time_ms !== null ? `${rb.response_time_ms} ms` : null,
      });
    }
  }

  return {
    totalA: rowsA.length,
    totalB: rowsB.length,
    counts,
    samples,
  };
}
