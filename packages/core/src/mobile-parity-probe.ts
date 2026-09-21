import { fetch as undiciFetch } from 'undici';
import type { CrawlConfig, MobileParityDiff, MobileParityField } from '@freecrawl/shared-types';
import { defaultRequestHeaders } from './http-client.js';
import type { ParsedPage } from './html-parser.js';

/**
 * Mobile-vs-desktop parity probe. After the crawl, a sample of indexable
 * pages is fetched again with the *other* user agent and the SEO fields
 * are compared. Sites that serve a different title, canonical, robots
 * directive or a much thinner body to phones are exactly what mobile-
 * first indexing punishes, and nothing else in the crawl can see it.
 */

const FETCH_TIMEOUT_MS = 30_000;
const MAX_BODY_BYTES = 4 * 1024 * 1024;

export interface ParityFetchResult {
  status: number | null;
  html: string | null;
}

/** GET `url` as `userAgent`; returns the HTML (or null for non-HTML / failures). */
export async function fetchForParity(
  url: string,
  userAgent: string,
  config: Pick<CrawlConfig, 'acceptLanguage' | 'customHeaders' | 'auth'>,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<ParityFetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = defaultRequestHeaders(
      userAgent,
      config.acceptLanguage,
      config.customHeaders,
      config.auth,
    );
    const res = await undiciFetch(url, {
      method: 'GET',
      headers,
      redirect: 'follow',
      signal: controller.signal,
    });
    const type = res.headers.get('content-type') ?? '';
    if (!/html|xhtml/i.test(type)) {
      await res.body?.cancel().catch(() => undefined);
      return { status: res.status, html: null };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, html: buf.subarray(0, MAX_BODY_BYTES).toString('utf8') };
  } catch {
    return { status: null, html: null };
  } finally {
    clearTimeout(timer);
  }
}

/** What the crawl itself recorded for the page — the "crawl" side of the diff. */
export interface ParityBaseline {
  status: number | null;
  title: string | null;
  h1: string | null;
  metaDescription: string | null;
  canonical: string | null;
  metaRobots: string | null;
  wordCount: number | null;
  outlinks: number;
}

const norm = (v: string | null | undefined): string | null => {
  const t = (v ?? '').replace(/\s+/g, ' ').trim();
  return t === '' ? null : t;
};

/** Relative difference above which a count is considered "different". */
const COUNT_TOLERANCE = 0.3;
function countsDiffer(a: number | null, b: number | null): boolean {
  const x = a ?? 0;
  const y = b ?? 0;
  if (x === y) return false;
  const base = Math.max(x, y);
  if (base < 20) return false; // tiny pages — noise
  return Math.abs(x - y) / base > COUNT_TOLERANCE;
}

/**
 * Compares the crawl's record against the alternate-UA parse. Returns
 * null when nothing material differs, so identical pages store nothing.
 */
export function diffParity(
  baseline: ParityBaseline,
  alternate: { status: number | null; page: ParsedPage | null; outlinks?: number },
  alternateKind: 'mobile' | 'desktop',
  now: Date = new Date(),
): MobileParityDiff | null {
  const fields: MobileParityField[] = [];
  const push = (field: string, crawl: string | null, alt: string | null): void => {
    fields.push({ field, crawl, alternate: alt });
  };
  const altOk = alternate.status !== null && alternate.status >= 200 && alternate.status < 300;
  if (!altOk || !alternate.page) {
    push('status', baseline.status === null ? null : String(baseline.status), alternate.status === null ? null : String(alternate.status));
    return { alternate: alternateKind, alternateStatus: alternate.status, checkedAt: now.toISOString(), fields };
  }
  const p = alternate.page;
  const text = (name: string, a: string | null | undefined, b: string | null | undefined): void => {
    const na = norm(a);
    const nb = norm(b);
    if (na !== nb) push(name, na, nb);
  };
  text('title', baseline.title, p.title);
  text('h1', baseline.h1, p.h1);
  text('metaDescription', baseline.metaDescription, p.metaDescription);
  text('canonical', baseline.canonical, p.canonicalResolved ?? p.canonical);
  text('metaRobots', baseline.metaRobots, p.metaRobots);
  if (countsDiffer(baseline.wordCount, p.wordCount)) {
    push('wordCount', String(baseline.wordCount ?? 0), String(p.wordCount));
  }
  // Same rule the crawl applied when it counted `outlinks` (nofollow
  // handling lives in the caller's config), else the raw parse count.
  const altLinks = alternate.outlinks ?? p.links.length;
  if (countsDiffer(baseline.outlinks, altLinks)) {
    push('outlinks', String(baseline.outlinks), String(altLinks));
  }
  if (fields.length === 0) return null;
  return { alternate: alternateKind, alternateStatus: alternate.status, checkedAt: now.toISOString(), fields };
}
