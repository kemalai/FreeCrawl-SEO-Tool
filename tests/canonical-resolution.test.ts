import { describe, it, expect } from 'vitest';
import { ProjectDb } from '../packages/db/src/project-db.js';
import { normalizeUrl, detectUrlTrap } from '../packages/core/src/url-utils.js';
import { parseHtml } from '../packages/core/src/html-parser.js';

// FEATURES.md gaps 1–5: canonical comparisons were done against the raw
// authored href, so a relative canonical never matched any absolute URL.
// These lock in the resolved-canonical behaviour end-to-end: parse → store
// → the SQL predicates the sidebar and drill-down both read.

function makeDb(): ProjectDb {
  return new ProjectDb(':memory:');
}

/** Upsert a crawled HTML page the way the crawler does. */
function page(
  db: ProjectDb,
  url: string,
  extra: Record<string, unknown> = {},
): void {
  db.upsertUrl({
    url,
    depth: 0,
    statusCode: 200,
    contentKind: 'html',
    indexability: 'indexable',
    ...extra,
  } as Parameters<ProjectDb['upsertUrl']>[0]);
}

describe('gap #3 — relative canonical resolves before comparison', () => {
  it('parses a relative canonical into an absolute resolved form', () => {
    const parsed = parseHtml(
      '<html><head><link rel="canonical" href="/page/"></head><body>hi</body></html>',
      'https://ex.com/page/',
    );
    expect(parsed.canonical).toBe('/page/'); // raw kept verbatim
    expect(parsed.canonicalResolved).toBe('https://ex.com/page/');
  });

  it('counts a relative self-canonical as self-referencing, not canonicalised away', () => {
    const db = makeDb();
    page(db, 'https://ex.com/page/', {
      canonical: '/page/',
      canonicalResolved: 'https://ex.com/page/',
      canonicalCount: 1,
      canonicalDistinctCount: 1,
    });
    const c = db.getOverviewCounts().issues;
    expect(c.canonicalSelfReferencing).toBe(1);
    // The bug: this used to be 1 because '/page/' !== the absolute url.
    expect(c.canonicalNonSelf).toBe(0);
  });

  it('still reports a genuinely non-self canonical', () => {
    const db = makeDb();
    page(db, 'https://ex.com/a', {
      canonical: '/b',
      canonicalResolved: 'https://ex.com/b',
      canonicalCount: 1,
      canonicalDistinctCount: 1,
    });
    const c = db.getOverviewCounts().issues;
    expect(c.canonicalNonSelf).toBe(1);
    expect(c.canonicalSelfReferencing).toBe(0);
  });

  it('joins canonical → target on the resolved value', () => {
    const db = makeDb();
    // /a canonicalises to /gone (relative href), which 404s.
    page(db, 'https://ex.com/a', {
      canonical: '/gone',
      canonicalResolved: 'https://ex.com/gone',
      canonicalCount: 1,
      canonicalDistinctCount: 1,
    });
    page(db, 'https://ex.com/gone', { statusCode: 404 });
    // Previously 0 — 't.url = urls.canonical' never matched '/gone'.
    expect(db.getOverviewCounts().issues.canonicalToNon200).toBe(1);
  });

  it('does not flag a relative canonical as an HTTP/HTML mismatch', () => {
    const db = makeDb();
    page(db, 'https://ex.com/a', {
      canonical: '/a',
      canonicalResolved: 'https://ex.com/a',
      canonicalHttp: 'https://ex.com/a',
      canonicalCount: 1,
      canonicalDistinctCount: 1,
    });
    expect(db.getOverviewCounts().issues.canonicalMismatch).toBe(0);
  });

  it('keeps working on legacy rows that predate canonical_resolved', () => {
    const db = makeDb();
    // No canonicalResolved written — the COALESCE must fall back to raw.
    page(db, 'https://ex.com/a', {
      canonical: 'https://ex.com/a',
      canonicalCount: 1,
    });
    expect(db.getOverviewCounts().issues.canonicalSelfReferencing).toBe(1);
  });
});

describe('gap #1 — unusual canonical combinations', () => {
  it('separates repeated-but-identical canonicals from disagreeing ones', () => {
    const html = (hrefs: string[]): string =>
      `<html><head>${hrefs
        .map((h) => `<link rel="canonical" href="${h}">`)
        .join('')}</head><body>x</body></html>`;

    // Same target declared twice — noisy, but not a conflict.
    const same = parseHtml(html(['/a', 'https://ex.com/a']), 'https://ex.com/a');
    expect(same.canonicalCount).toBe(2);
    expect(same.canonicalDistinctCount).toBe(1);

    // Two different targets — search engines discard both.
    const diff = parseHtml(html(['/a', '/b']), 'https://ex.com/a');
    expect(diff.canonicalCount).toBe(2);
    expect(diff.canonicalDistinctCount).toBe(2);
  });

  it('counts conflicting canonicals as an issue', () => {
    const db = makeDb();
    page(db, 'https://ex.com/a', {
      canonical: '/a',
      canonicalResolved: 'https://ex.com/a',
      canonicalCount: 2,
      canonicalDistinctCount: 2,
    });
    page(db, 'https://ex.com/b', {
      canonical: '/b',
      canonicalResolved: 'https://ex.com/b',
      canonicalCount: 2,
      canonicalDistinctCount: 1, // repeated but identical
    });
    const c = db.getOverviewCounts().issues;
    expect(c.canonicalConflicting).toBe(1);
    expect(c.multipleCanonicals).toBe(2); // both still count as "multiple"
  });

  it('detects a cross-domain canonical at parse time and counts it', () => {
    const off = parseHtml(
      '<html><head><link rel="canonical" href="https://other.com/x"></head></html>',
      'https://ex.com/a',
    );
    expect(off.canonicalCrossDomain).toBe(true);

    // A subdomain of the same registrable domain is NOT cross-domain.
    const sub = parseHtml(
      '<html><head><link rel="canonical" href="https://www.ex.com/a"></head></html>',
      'https://ex.com/a',
    );
    expect(sub.canonicalCrossDomain).toBe(false);

    const db = makeDb();
    page(db, 'https://ex.com/a', {
      canonical: 'https://other.com/x',
      canonicalResolved: 'https://other.com/x',
      canonicalCount: 1,
      canonicalDistinctCount: 1,
      canonicalCrossDomain: 1,
    });
    expect(db.getOverviewCounts().issues.canonicalCrossDomain).toBe(1);
  });
});

describe('gap #2 — redirect / canonical / noindex relationships', () => {
  it('flags noindex sitting on a page canonicalised elsewhere', () => {
    const db = makeDb();
    page(db, 'https://ex.com/a', {
      canonical: '/b',
      canonicalResolved: 'https://ex.com/b',
      canonicalCount: 1,
      canonicalDistinctCount: 1,
      metaRobots: 'noindex, follow',
      indexability: 'non-indexable:noindex',
    });
    // A self-canonical + noindex is not a conflict — nothing is being
    // consolidated, so there is no contradiction to report.
    page(db, 'https://ex.com/c', {
      canonical: '/c',
      canonicalResolved: 'https://ex.com/c',
      canonicalCount: 1,
      canonicalDistinctCount: 1,
      metaRobots: 'noindex',
      indexability: 'non-indexable:noindex',
    });
    expect(db.getOverviewCounts().issues.noindexCanonicalConflict).toBe(1);
  });

  it('flags a redirect whose final destination is noindexed', () => {
    const db = makeDb();
    db.upsertUrl({
      url: 'https://ex.com/old',
      depth: 0,
      statusCode: 301,
      contentKind: 'html',
      indexability: 'non-indexable:redirect',
      redirectTarget: 'https://ex.com/new',
    } as Parameters<ProjectDb['upsertUrl']>[0]);
    page(db, 'https://ex.com/new', {
      metaRobots: 'noindex',
      indexability: 'non-indexable:noindex',
    });
    // `redirect_final_url` is written by the post-crawl chain walk, not by
    // upsert — the filter reads the terminus, so multi-hop chains resolve.
    db.recomputeRedirectChains();
    expect(db.getOverviewCounts().issues.redirectToNoindex).toBe(1);
  });

  it('does not flag a redirect landing on an indexable page', () => {
    const db = makeDb();
    db.upsertUrl({
      url: 'https://ex.com/old',
      depth: 0,
      statusCode: 301,
      contentKind: 'html',
      indexability: 'non-indexable:redirect',
      redirectTarget: 'https://ex.com/new',
    } as Parameters<ProjectDb['upsertUrl']>[0]);
    page(db, 'https://ex.com/new');
    db.recomputeRedirectChains();
    expect(db.getOverviewCounts().issues.redirectToNoindex).toBe(0);
  });
});

describe('gaps #4 / #5 — URL normalisation completeness', () => {
  it('folds percent-escape case (RFC 3986) by default', () => {
    expect(normalizeUrl('https://x.com/a%2fb')).toBe(
      normalizeUrl('https://x.com/a%2Fb'),
    );
    expect(normalizeUrl('https://x.com/p?q=%2fc')).toBe(
      normalizeUrl('https://x.com/p?q=%2Fc'),
    );
  });

  it('keeps an encoded slash distinct from a literal one', () => {
    expect(normalizeUrl('https://x.com/a%2Fb')).not.toBe(
      normalizeUrl('https://x.com/a/b'),
    );
  });

  it('leaves a bare percent sign alone', () => {
    expect(normalizeUrl('https://x.com/100%pure')).toBe('https://x.com/100%pure');
  });

  it('sorts query params only when asked', () => {
    const a = 'https://x.com/p?b=2&a=1';
    const b = 'https://x.com/p?a=1&b=2';
    expect(normalizeUrl(a)).not.toBe(normalizeUrl(b));
    expect(normalizeUrl(a, undefined, { sortQueryParams: true })).toBe(
      normalizeUrl(b, undefined, { sortQueryParams: true }),
    );
  });

  it('preserves repeated-key order when sorting', () => {
    expect(
      normalizeUrl('https://x.com/p?tag=z&a=1&tag=b', undefined, {
        sortQueryParams: true,
      }),
    ).toBe('https://x.com/p?a=1&tag=z&tag=b');
  });

  it('collapses duplicate slashes only when asked', () => {
    const dup = 'https://x.com//a//b';
    expect(normalizeUrl(dup)).not.toBe(normalizeUrl('https://x.com/a/b'));
    expect(normalizeUrl(dup, undefined, { collapseDuplicateSlashes: true })).toBe(
      'https://x.com/a/b',
    );
  });

  it('collapses before applying the trailing-slash policy', () => {
    expect(
      normalizeUrl('https://x.com/a//b//', undefined, {
        collapseDuplicateSlashes: true,
        trailingSlash: 'strip',
      }),
    ).toBe('https://x.com/a/b');
  });
});

describe('gap #8 — crawl-trap heuristics', () => {
  const REPEAT = { maxRepeatedSegments: 3 };

  it('detects a repeated-segment link loop', () => {
    expect(detectUrlTrap('https://x.com/shop/shop/shop/', REPEAT)).toBe(
      'repeated-segment',
    );
    expect(detectUrlTrap('https://x.com/a/b/a/b/a/b', REPEAT)).toBe(
      'repeated-segment',
    );
    // Case-folded: /Shop/shop/SHOP is the same loop.
    expect(detectUrlTrap('https://x.com/Shop/shop/SHOP', REPEAT)).toBe(
      'repeated-segment',
    );
  });

  it('leaves ordinary deep paths alone', () => {
    expect(
      detectUrlTrap('https://x.com/blog/2026/03/how-to-crawl', REPEAT),
    ).toBeNull();
    // Twice is not a loop — only the configured threshold is.
    expect(detectUrlTrap('https://x.com/shop/cat/shop', REPEAT)).toBeNull();
  });

  it('honours the threshold and can be disabled', () => {
    const url = 'https://x.com/a/a/a';
    expect(detectUrlTrap(url, { maxRepeatedSegments: 4 })).toBeNull();
    expect(detectUrlTrap(url, { maxRepeatedSegments: 0 })).toBeNull();
  });

  it('detects session-id parameters', () => {
    expect(detectUrlTrap('https://x.com/p?PHPSESSID=abc123')).toBe('session-id');
    expect(detectUrlTrap('https://x.com/p?jsessionid=zz')).toBe('session-id');
  });

  it('detects a calendar navigator but not a plain archive page', () => {
    expect(detectUrlTrap('https://x.com/events?year=2026&month=03')).toBe(
      'calendar',
    );
    expect(detectUrlTrap('https://x.com/events?year=2026')).toBeNull();
  });

  it('detects faceted navigation only when a cap is set', () => {
    const faceted = 'https://x.com/p?a=1&b=2&c=3&d=4&e=5';
    expect(detectUrlTrap(faceted)).toBeNull();
    expect(detectUrlTrap(faceted, { maxQueryParams: 4 })).toBe('query-params');
    expect(detectUrlTrap(faceted, { maxQueryParams: 5 })).toBeNull();
  });

  it('surfaces flagged traps through the issue filter', () => {
    const db = makeDb();
    page(db, 'https://x.com/p?PHPSESSID=abc', { urlTrap: 'session-id' });
    page(db, 'https://x.com/events?year=2026&month=3', { urlTrap: 'calendar' });
    page(db, 'https://x.com/normal');
    expect(db.getOverviewCounts().issues.crawlTrap).toBe(2);
  });
});
