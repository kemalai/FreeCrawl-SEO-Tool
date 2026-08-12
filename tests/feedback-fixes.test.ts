import { describe, it, expect } from 'vitest';
import { ProjectDb } from '../packages/db/src/project-db.js';
import type { AdvancedFilter, FilterClause } from '@freecrawl/shared-types';

// These exercise the DB-layer fixes end-to-end against a real (in-memory)
// migrated ProjectDb — the highest-risk SQL changes from the feedback pass:
//   #13  redirect/error pages must NOT count as "missing" on-page elements
//   #14  GSC data must attach across a trailing-slash URL variant
//   #2   Advanced filter must query custom-extraction values (and stay safe)

function makeDb(): ProjectDb {
  // runMigrations runs inside the constructor for a writable connection, so
  // an in-memory file is a fully-formed, empty project.
  return new ProjectDb(':memory:');
}

const filter = (clauses: FilterClause[]): AdvancedFilter => ({
  groups: [{ clauses }],
});

describe('#13 — no fake SEO errors on 3xx/4xx pages', () => {
  it('excludes a 301 redirect from the "missing element" counters', () => {
    const db = makeDb();
    // A real 200 page with no title/meta/h1/lang/viewport — genuinely missing.
    db.upsertUrl({ url: 'https://x.com/ok', depth: 0, statusCode: 200, contentKind: 'html' });
    // A 301 redirect carries none of those by nature — must NOT be flagged.
    db.upsertUrl({
      url: 'https://x.com/redir',
      depth: 0,
      statusCode: 301,
      contentKind: 'html',
      indexability: 'non-indexable:redirect',
    });

    const issues = db.getOverviewCounts().issues;
    expect(issues.titleMissing).toBe(1);
    expect(issues.metaMissing).toBe(1);
    expect(issues.h1Missing).toBe(1);
    expect(issues.langMissing).toBe(1);
    expect(issues.viewportMissing).toBe(1);

    // The drill-down table must agree with the counter (only the 200 page).
    const drill = db.queryUrls({ limit: 100, offset: 0, category: 'issues:title-missing' });
    expect(drill.total).toBe(1);
    expect(drill.rows[0]?.url).toBe('https://x.com/ok');
    db.close();
  });

  it('still flags genuinely-missing elements on 200 pages', () => {
    const db = makeDb();
    db.upsertUrl({ url: 'https://x.com/a', depth: 0, statusCode: 200, contentKind: 'html' });
    db.upsertUrl({
      url: 'https://x.com/b',
      depth: 0,
      statusCode: 200,
      contentKind: 'html',
      title: 'Has title',
      metaDescription: 'Has meta',
      h1: 'Has H1',
      lang: 'en',
      viewport: 'width=device-width',
    });
    const issues = db.getOverviewCounts().issues;
    expect(issues.titleMissing).toBe(1); // only /a
    expect(issues.viewportMissing).toBe(1);
    db.close();
  });
});

describe('#14 — GSC join tolerates trailing-slash URL variants', () => {
  it('attaches GSC data to a crawled /page/ from a GSC /page (slash-insensitive default)', () => {
    const db = makeDb();
    db.upsertUrl({ url: 'https://x.com/page/', depth: 0, statusCode: 200, contentKind: 'html' });
    db.replaceGscResults(
      [{ url: 'https://x.com/page', clicks: 5, impressions: 100, ctr: 0.05, position: 3 }],
      '2026-01-01T00:00:00Z',
    );

    const tol = db.queryGsc({ limit: 100, offset: 0, filter: 'all', matchSlash: true });
    const row = tol.rows.find((r) => r.url === 'https://x.com/page/');
    expect(row?.gsc?.impressions).toBe(100);

    // With slash-matching turned off the exact string differs → no attach.
    const exact = db.queryGsc({ limit: 100, offset: 0, filter: 'all', matchSlash: false });
    const rowExact = exact.rows.find((r) => r.url === 'https://x.com/page/');
    expect(rowExact?.gsc).toBeNull();
    db.close();
  });
});

describe('#2 — Advanced filter on custom-extraction values', () => {
  it('filters rows by an extracted field value', () => {
    const db = makeDb();
    db.upsertUrl({
      url: 'https://x.com/a',
      depth: 0,
      statusCode: 200,
      contentKind: 'html',
      extractionResults: JSON.stringify({ h2: 'Recommended Products' }),
    });
    db.upsertUrl({
      url: 'https://x.com/b',
      depth: 0,
      statusCode: 200,
      contentKind: 'html',
      extractionResults: JSON.stringify({ h2: 'Newsletter' }),
    });
    db.upsertUrl({ url: 'https://x.com/c', depth: 0, statusCode: 200, contentKind: 'html' });

    const contains = db.queryUrls({
      limit: 100,
      offset: 0,
      filter: filter([{ field: 'extraction', extractionKey: 'h2', operator: 'contains', value: 'Recommend' }]),
    });
    expect(contains.total).toBe(1);
    expect(contains.rows[0]?.url).toBe('https://x.com/a');

    const none = db.queryUrls({
      limit: 100,
      offset: 0,
      filter: filter([{ field: 'extraction', extractionKey: 'h2', operator: 'contains', value: 'zzz' }]),
    });
    expect(none.total).toBe(0);

    const empty = db.queryUrls({
      limit: 100,
      offset: 0,
      filter: filter([{ field: 'extraction', extractionKey: 'h2', operator: 'is_empty', value: '' }]),
    });
    expect(empty.rows.map((r) => r.url)).toEqual(['https://x.com/c']);
    db.close();
  });

  it('drops (does not execute) an unsafe extraction key instead of crashing', () => {
    const db = makeDb();
    db.upsertUrl({
      url: 'https://x.com/a',
      depth: 0,
      statusCode: 200,
      contentKind: 'html',
      extractionResults: JSON.stringify({ h2: 'x' }),
    });
    db.upsertUrl({ url: 'https://x.com/b', depth: 0, statusCode: 200, contentKind: 'html' });

    // A key with a double-quote would break the JSON path / could be an
    // injection vector — the clause must be rejected, the query must not
    // throw, and with no valid clause the filter is a no-op (all rows).
    const res = db.queryUrls({
      limit: 100,
      offset: 0,
      filter: filter([
        { field: 'extraction', extractionKey: 'h2"} OR 1=1 --', operator: 'contains', value: 'x' },
      ]),
    });
    expect(res.total).toBe(2);
    db.close();
  });
});
