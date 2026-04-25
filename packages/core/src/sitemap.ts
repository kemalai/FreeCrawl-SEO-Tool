import * as cheerio from 'cheerio';
import { fetch as undiciFetch } from 'undici';
import { normalizeUrl } from './url-utils.js';
import { defaultRequestHeaders, formatFetchError } from './http-client.js';

export interface SitemapEntry {
  /** Absolute URL of the actual page (the sitemap's `<loc>` value). */
  url: string;
  /** ISO 8601 date or `null`. Stored as text (servers vary, no point parsing). */
  lastmod: string | null;
  /** 0.0–1.0 priority, or `null`. */
  priority: number | null;
  /** `always` / `hourly` / `daily` / `weekly` / `monthly` / `yearly` / `never`, or `null`. */
  changefreq: string | null;
  /** The sitemap URL where this entry was found (for traceability). */
  source: string;
}

interface ParsedSitemap {
  type: 'urlset' | 'sitemapindex' | 'unknown';
  entries: SitemapEntry[];
  childSitemaps: string[];
}

export interface SitemapDiscoveryResult {
  /** Sitemap URLs we attempted to fetch (root + nested via index). */
  sitemapsTried: string[];
  /** Sitemap URLs that returned valid XML and were parsed. */
  sitemapsParsed: string[];
  /** Per-sitemap error message (only sitemapsTried entries that failed). */
  errors: { sitemap: string; error: string }[];
  /** All entries flattened across every parsed sitemap, capped at `maxUrls`. */
  entries: SitemapEntry[];
  /** True if `maxUrls` cap was hit and additional entries were dropped. */
  truncated: boolean;
}

/**
 * Pull `Sitemap:` directives out of a robots.txt body. Falls back to the
 * two conventional locations when robots.txt is silent — these cover the
 * vast majority of real-world sites.
 */
function parseSitemapsFromRobots(robotsText: string): string[] {
  const out: string[] = [];
  for (const rawLine of robotsText.split(/\r?\n/)) {
    const m = /^\s*sitemap\s*:\s*(\S+)/i.exec(rawLine);
    if (m && m[1]) out.push(m[1].trim());
  }
  return out;
}

/**
 * Find candidate sitemap URLs for a given origin. Order:
 *   1. Sitemap directives in `<origin>/robots.txt`
 *   2. Default fallbacks `<origin>/sitemap.xml` and `/sitemap_index.xml`
 *
 * Always returns at least the two fallbacks even if robots.txt yields
 * sitemaps — some sites declare a partial set.
 */
export async function discoverSitemapUrls(
  origin: string,
  userAgent: string,
  signal: AbortSignal,
): Promise<string[]> {
  const candidates = new Set<string>();
  try {
    const res = await undiciFetch(`${origin}/robots.txt`, {
      method: 'GET',
      headers: defaultRequestHeaders(userAgent, 'en'),
      redirect: 'follow',
      signal,
    });
    if (res.ok) {
      const text = await res.text();
      for (const u of parseSitemapsFromRobots(text)) candidates.add(u);
    } else {
      try {
        await res.body?.cancel();
      } catch {
        /* ignore */
      }
    }
  } catch {
    // robots.txt unreachable — fall through to defaults.
  }
  candidates.add(`${origin}/sitemap.xml`);
  candidates.add(`${origin}/sitemap_index.xml`);
  return [...candidates];
}

/**
 * Parse a single sitemap or sitemap-index XML body. Uses cheerio's XML
 * mode — robust to namespace prefixes (`<xhtml:link>`) and odd whitespace.
 */
function parseSitemap(xml: string, sourceUrl: string): ParsedSitemap {
  const $ = cheerio.load(xml, { xmlMode: true });

  // Index — pointers to other sitemaps.
  const indexLocs: string[] = [];
  $('sitemapindex sitemap > loc').each((_, el) => {
    const u = $(el).text().trim();
    if (u) indexLocs.push(u);
  });
  if (indexLocs.length > 0) {
    return { type: 'sitemapindex', entries: [], childSitemaps: indexLocs };
  }

  // urlset — actual page entries.
  const entries: SitemapEntry[] = [];
  $('urlset url').each((_, el) => {
    const $u = $(el);
    const loc = $u.find('loc').first().text().trim();
    if (!loc) return;
    const lastmod = $u.find('lastmod').first().text().trim() || null;
    const changefreq = $u.find('changefreq').first().text().trim().toLowerCase() || null;
    const priorityRaw = $u.find('priority').first().text().trim();
    let priority: number | null = null;
    if (priorityRaw) {
      const p = Number.parseFloat(priorityRaw);
      if (Number.isFinite(p)) priority = Math.max(0, Math.min(1, p));
    }
    entries.push({ url: loc, lastmod, priority, changefreq, source: sourceUrl });
  });
  if (entries.length > 0) {
    return { type: 'urlset', entries, childSitemaps: [] };
  }

  return { type: 'unknown', entries: [], childSitemaps: [] };
}

interface FetchOpts {
  userAgent: string;
  signal: AbortSignal;
  timeoutMs: number;
  maxUrls: number;
  /** Max sitemap-index nesting (1 = root only, 2 = root + children, …). */
  maxDepth: number;
}

/**
 * BFS-walk the sitemap tree starting from `roots` (typically what
 * `discoverSitemapUrls` returns). Visited sitemap URLs are deduped so an
 * accidental cycle in `<sitemapindex>` can't loop forever. Caps total
 * entries at `maxUrls`; further finds are dropped silently and the
 * `truncated` flag flips on the result.
 */
export async function fetchSitemaps(
  roots: string[],
  opts: FetchOpts,
): Promise<SitemapDiscoveryResult> {
  const result: SitemapDiscoveryResult = {
    sitemapsTried: [],
    sitemapsParsed: [],
    errors: [],
    entries: [],
    truncated: false,
  };
  const visited = new Set<string>();
  type QueueItem = { url: string; depth: number };
  const queue: QueueItem[] = roots.map((url) => ({ url, depth: 1 }));

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    if (visited.has(item.url)) continue;
    if (item.depth > opts.maxDepth) continue;
    if (result.entries.length >= opts.maxUrls) {
      result.truncated = true;
      break;
    }
    visited.add(item.url);
    result.sitemapsTried.push(item.url);

    try {
      const res = await undiciFetch(item.url, {
        method: 'GET',
        headers: defaultRequestHeaders(opts.userAgent, 'en'),
        redirect: 'follow',
        signal: opts.signal,
      });
      if (!res.ok) {
        try {
          await res.body?.cancel();
        } catch {
          /* ignore */
        }
        result.errors.push({ sitemap: item.url, error: `HTTP ${res.status}` });
        continue;
      }
      const ct = (res.headers.get('content-type') ?? '').toLowerCase();
      // Skip gzipped sitemaps for V1 — supporting them needs zlib stream
      // handling which we'd rather not pull in until users actually need it.
      if (ct.includes('gzip') || item.url.toLowerCase().endsWith('.gz')) {
        result.errors.push({
          sitemap: item.url,
          error: 'Gzipped sitemap — not yet supported',
        });
        try {
          await res.body?.cancel();
        } catch {
          /* ignore */
        }
        continue;
      }
      const xml = await res.text();
      const parsed = parseSitemap(xml, item.url);
      if (parsed.type === 'unknown') {
        result.errors.push({ sitemap: item.url, error: 'Unrecognized sitemap format' });
        continue;
      }
      result.sitemapsParsed.push(item.url);
      for (const entry of parsed.entries) {
        if (result.entries.length >= opts.maxUrls) {
          result.truncated = true;
          break;
        }
        const norm = normalizeUrl(entry.url);
        if (!norm) continue;
        result.entries.push({ ...entry, url: norm });
      }
      for (const child of parsed.childSitemaps) {
        queue.push({ url: child, depth: item.depth + 1 });
      }
    } catch (err) {
      result.errors.push({ sitemap: item.url, error: formatFetchError(err) });
    }
  }
  return result;
}
