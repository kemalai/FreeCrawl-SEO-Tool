import * as cheerio from 'cheerio';
import { gunzipSync } from 'node:zlib';
import { fetch as undiciFetch } from 'undici';
import { normalizeUrl, type UrlRewriteOptions } from './url-utils.js';
import { defaultRequestHeaders, formatFetchError } from './http-client.js';

/**
 * sitemaps.org protocol limits. A sitemap breaching either is still parsed
 * (the data is useful and Google reads what it can), but the breach is
 * reported as a warning so the user can fix the generator.
 */
const SITEMAP_MAX_URLS = 50_000;
const SITEMAP_MAX_BYTES = 50 * 1024 * 1024;
/**
 * Hard ceiling on what a gzipped sitemap may inflate to.
 *
 * `SITEMAP_MAX_BYTES` above is the sitemaps.org limit, and breaching it is
 * deliberately only a warning — the data is still useful. But that check
 * ran *after* `gunzipSync` had already materialised the whole buffer, so
 * a decompression bomb (a few KB inflating to gigabytes) allocated all of
 * it first and could take the process down. Sitemaps are fetched with no
 * user action at all (`discoverSitemaps` defaults on), so the input is not
 * something the user chose to trust.
 *
 * 4× the protocol limit: no real sitemap comes close, and a bomb is orders
 * of magnitude past it.
 */
const SITEMAP_MAX_INFLATED_BYTES = SITEMAP_MAX_BYTES * 4;

/**
 * Content types a sitemap may legitimately arrive as. Servers are sloppy
 * here — `text/plain` and `application/octet-stream` are common for `.xml`
 * files on misconfigured hosts — so a mismatch is a warning, never a
 * rejection: the body is still parsed and only flagged.
 */
const SITEMAP_OK_CONTENT_TYPES = [
  'xml', // application/xml, text/xml, application/rss+xml, atom+xml
  'gzip',
  'x-gzip',
  'octet-stream',
  'text/plain',
];

/** Magic bytes every gzip member starts with (RFC 1952 §2.3.1). */
function looksGzipped(buf: Uint8Array): boolean {
  return buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b;
}

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
  /**
   * Non-fatal protocol breaches found while reading (sitemaps.org 50,000-URL
   * / 50 MB caps, unexpected content types). The sitemap was still parsed —
   * these are reported so the user can fix the generator.
   */
  warnings: { sitemap: string; warning: string }[];
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
  /**
   * The crawl's URL-rewrite policy. Sitemap entries MUST be normalised with
   * the same rewrites the crawler applies to page URLs — otherwise the
   * stored `sitemap_urls.url` (e.g. `…/about/`) never equals the crawled
   * `urls.url` (`…/about` under Trailing Slash = Strip), and every
   * sitemap↔crawl join silently reports "crawled but not in sitemap" for
   * every page and "sitemap orphan" for every sitemap entry.
   */
  rewrites?: UrlRewriteOptions;
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
    warnings: [],
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
      // Read as bytes, not text: a `.xml.gz` sitemap arrives as raw gzip
      // (Content-Type: application/gzip and NO Content-Encoding, so undici
      // does not decompress it for us). Decoding those bytes as UTF-8 would
      // yield mojibake that parses to zero URLs.
      const raw = new Uint8Array(await res.arrayBuffer());

      // Protocol size cap. Measured on the bytes actually served; the spec's
      // 50 MB is the *uncompressed* limit, so for gzip we re-check after
      // inflating below.
      if (raw.byteLength > SITEMAP_MAX_BYTES) {
        result.warnings.push({
          sitemap: item.url,
          warning: `Sitemap is ${(raw.byteLength / (1024 * 1024)).toFixed(1)} MB, over the sitemaps.org 50 MB limit.`,
        });
      }

      // Gzip detection by magic bytes rather than by header or extension:
      // plenty of servers mislabel `.xml.gz` as `text/xml`, and some serve a
      // plain XML file from a `.gz` URL. The bytes are the ground truth.
      let xml: string;
      if (looksGzipped(raw)) {
        try {
          // `maxOutputLength` makes zlib abort mid-inflation instead of
          // allocating the whole bomb and checking its size afterwards.
          const inflated = gunzipSync(raw, {
            maxOutputLength: SITEMAP_MAX_INFLATED_BYTES,
          });
          if (inflated.byteLength > SITEMAP_MAX_BYTES) {
            result.warnings.push({
              sitemap: item.url,
              warning: `Sitemap is ${(inflated.byteLength / (1024 * 1024)).toFixed(1)} MB uncompressed, over the sitemaps.org 50 MB limit.`,
            });
          }
          xml = inflated.toString('utf8');
        } catch (err) {
          result.errors.push({
            sitemap: item.url,
            error: `Corrupt gzip sitemap: ${err instanceof Error ? err.message : String(err)}`,
          });
          continue;
        }
      } else {
        xml = Buffer.from(raw).toString('utf8');
        // Only meaningful for non-gzip bodies — a gzipped sitemap that
        // inflated cleanly is self-evidently a sitemap whatever the header
        // claimed.
        if (ct && !SITEMAP_OK_CONTENT_TYPES.some((ok) => ct.includes(ok))) {
          result.warnings.push({
            sitemap: item.url,
            warning: `Unexpected Content-Type "${ct}" (expected an XML type).`,
          });
        }
      }

      const parsed = parseSitemap(xml, item.url);
      if (parsed.type === 'unknown') {
        result.errors.push({ sitemap: item.url, error: 'Unrecognized sitemap format' });
        continue;
      }
      result.sitemapsParsed.push(item.url);
      // Per-file URL cap (sitemapindex children are counted individually,
      // which is exactly what the protocol limits).
      if (parsed.entries.length > SITEMAP_MAX_URLS) {
        result.warnings.push({
          sitemap: item.url,
          warning: `Sitemap declares ${parsed.entries.length.toLocaleString()} URLs, over the sitemaps.org 50,000 limit.`,
        });
      }
      if (parsed.childSitemaps.length > SITEMAP_MAX_URLS) {
        result.warnings.push({
          sitemap: item.url,
          warning: `Sitemap index references ${parsed.childSitemaps.length.toLocaleString()} sitemaps, over the sitemaps.org 50,000 limit.`,
        });
      }
      for (const entry of parsed.entries) {
        if (result.entries.length >= opts.maxUrls) {
          result.truncated = true;
          break;
        }
        const norm = normalizeUrl(entry.url, undefined, opts.rewrites);
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
