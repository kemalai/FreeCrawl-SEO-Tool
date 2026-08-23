import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable, Transform } from 'node:stream';
import { createGzip } from 'node:zlib';
import path from 'node:path';
import type { ProjectDb } from '@freecrawl/db';

export type SitemapVariant =
  | 'standard'
  | 'image'
  | 'hreflang'
  | 'news'
  | 'video';

export interface SitemapOptions {
  /** Default `'weekly'`. Sitemaps.org change-frequency hint. */
  changefreq?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  /**
   * Depth-based priority (1.0 for depth 0, declines 0.1 per level, floor 0.1)
   * if `true` (default). If `false`, emits 0.5 uniformly.
   */
  depthPriority?: boolean;
  /**
   * Sitemap content variant.
   *  - `standard`  — plain `<url><loc>...</loc></url>` (sitemaps.org core).
   *  - `image`     — adds `<image:image><image:loc>...</image:loc></image:image>` per page (Google Images).
   *  - `hreflang`  — adds `<xhtml:link rel="alternate" hreflang="..." href="..." />` siblings (Google international).
   *  - `news`      — adds a `<news:news>` block (publication name/language, publication
   *                  date, title) per page (Google News). Publication name comes from
   *                  `og:site_name` (host fallback), language from the page `lang`
   *                  attribute, and the date from the crawl time — Google News also
   *                  expects only recent articles, so treat the output as a template.
   */
  variant?: SitemapVariant;
  /** Gzip the output (`.xml.gz`). When true the file path is auto-suffixed. */
  gzip?: boolean;
  /**
   * Per-file URL cap. The sitemap protocol mandates ≤50,000 URLs and
   * ≤50 MB per file. Setting this lower than 50,000 is occasionally
   * useful when individual entries are large (image variant).
   */
  splitAtUrlCount?: number;
  /**
   * Absolute base URL (origin) the sharded sitemap-index `<loc>` entries are
   * built from, e.g. `https://example.com`. The protocol requires index
   * `<loc>` values to be fully-qualified URLs; without this they fell back
   * to bare filenames and Search Console rejected the index. When omitted,
   * the origin is derived from the first crawled URL.
   */
  baseUrl?: string;
}

export interface SitemapExportResult {
  /** All sitemap files written, absolute paths. First entry is the index when split. */
  files: string[];
  /** Total URLs written across all parts. */
  urlsWritten: number;
  /** True when an explicit URL cap (default 50K) was hit and writing stopped. */
  truncated: boolean;
  /** True when the result was sharded into multiple parts under an index. */
  sharded: boolean;
}

const HARD_URL_LIMIT = 50_000;

function escapeXml(s: string): string {
  return (
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      // XML 1.0 forbids these regardless of escaping. They reach the news
      // variant through page titles and the image variant through `alt`
      // (which, unlike title, isn't trimmed), and one occurrence makes the
      // whole sitemap unreadable — Search Console reports "Sitemap could
      // not be read" with no indication of which URL caused it.
      // eslint-disable-next-line no-control-regex -- intentionally matching control chars to strip them
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  );
}

function formatLastmod(crawledAt: string): string {
  const date = crawledAt.slice(0, 10);
  return date.length === 10 ? date : new Date().toISOString().slice(0, 10);
}

function priorityForDepth(depth: number, depthBased: boolean): string {
  if (!depthBased) return '0.5';
  const p = Math.max(0.1, 1 - depth * 0.1);
  return p.toFixed(1);
}

/** Best-effort publication name for the news variant when `og:site_name`
 *  is absent — fall back to the URL's hostname (e.g. `www.example.com`). */
function hostnameOf(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname || rawUrl;
  } catch {
    return rawUrl;
  }
}

/** ISO 639-1 language code for `<news:language>`: take the primary subtag
 *  of the page `lang` (e.g. `en-US` → `en`), lowercased; default `en`. */
function newsLanguage(lang: string | null): string {
  const primary = (lang ?? '').trim().split(/[-_]/)[0]?.toLowerCase();
  return primary && /^[a-z]{2,3}$/.test(primary) ? primary : 'en';
}

/** Full W3C datetime for `<news:publication_date>` — the crawl timestamp is
 *  the only per-URL date we have; Google accepts complete ISO 8601. */
function newsPublicationDate(crawledAt: string): string {
  return crawledAt && crawledAt.length >= 10
    ? crawledAt
    : new Date().toISOString();
}

/**
 * Produce the right `<urlset>` opening tag for the chosen variant.
 * The XML namespace declarations are extension-aware so consumers
 * (Google Search Console, sitemaps.org validators) parse the file.
 */
function urlsetOpen(variant: SitemapVariant): string {
  const ns = ['xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'];
  if (variant === 'image') ns.push('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
  if (variant === 'hreflang') ns.push('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  if (variant === 'news') ns.push('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"');
  if (variant === 'video') ns.push('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"');
  return `<urlset ${ns.join(' ')}>\n`;
}

interface VideoRow {
  contentLoc: string | null;
  playerLoc: string | null;
  thumbnail: string | null;
}

interface UrlEntry {
  id: number;
  url: string;
  depth: number;
  crawledAt: string;
  hreflangs: string | null;
  title: string | null;
  lang: string | null;
  ogSiteName: string | null;
  videos: string | null;
  metaDescription: string | null;
  ogImage: string | null;
}

/** Google caps `<video:title>` at 100 chars and `<video:description>` at
 *  2048 — clamp so the sitemap validates. */
function clamp(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

async function writePart(
  filePath: string,
  entries: UrlEntry[],
  variant: SitemapVariant,
  changefreq: string,
  depthBased: boolean,
  gzip: boolean,
  imagesFor: (urlId: number) => { src: string; alt: string | null }[],
): Promise<void> {
  const gen = async function* (): AsyncGenerator<string> {
    yield '<?xml version="1.0" encoding="UTF-8"?>\n';
    yield urlsetOpen(variant);
    for (const e of entries) {
      yield '  <url>\n';
      yield `    <loc>${escapeXml(e.url)}</loc>\n`;
      // News entries carry their own <news:publication_date>; the core
      // <lastmod>/<changefreq>/<priority> hints aren't part of the news
      // schema, so we omit them for a clean, valid news sitemap.
      if (variant !== 'news') {
        if (e.crawledAt) yield `    <lastmod>${formatLastmod(e.crawledAt)}</lastmod>\n`;
        yield `    <changefreq>${changefreq}</changefreq>\n`;
        yield `    <priority>${priorityForDepth(e.depth, depthBased)}</priority>\n`;
      }

      if (variant === 'news') {
        const pubName = e.ogSiteName?.trim() || hostnameOf(e.url);
        yield '    <news:news>\n';
        yield '      <news:publication>\n';
        yield `        <news:name>${escapeXml(pubName)}</news:name>\n`;
        yield `        <news:language>${escapeXml(newsLanguage(e.lang))}</news:language>\n`;
        yield '      </news:publication>\n';
        yield `      <news:publication_date>${escapeXml(newsPublicationDate(e.crawledAt))}</news:publication_date>\n`;
        yield `      <news:title>${escapeXml(e.title?.trim() || e.url)}</news:title>\n`;
        yield '    </news:news>\n';
      }

      if (variant === 'video' && e.videos) {
        let vids: VideoRow[] = [];
        try {
          const parsed = JSON.parse(e.videos) as unknown;
          if (Array.isArray(parsed)) vids = parsed as VideoRow[];
        } catch {
          // Malformed JSON — skip this page's videos.
        }
        const title = clamp((e.title?.trim() || e.url), 100);
        const description = clamp(
          (e.metaDescription?.trim() || e.title?.trim() || e.url),
          2048,
        );
        for (const v of vids) {
          // Google requires a thumbnail; fall back to the page's og:image
          // when the video itself doesn't declare one, and skip the entry
          // if neither is available (an entry without one is invalid).
          const thumb = v.thumbnail?.trim() || e.ogImage?.trim() || '';
          const media = v.contentLoc?.trim() || v.playerLoc?.trim() || '';
          if (!thumb || !media) continue;
          yield '    <video:video>\n';
          yield `      <video:thumbnail_loc>${escapeXml(thumb)}</video:thumbnail_loc>\n`;
          yield `      <video:title>${escapeXml(title)}</video:title>\n`;
          yield `      <video:description>${escapeXml(description)}</video:description>\n`;
          if (v.contentLoc?.trim()) {
            yield `      <video:content_loc>${escapeXml(v.contentLoc.trim())}</video:content_loc>\n`;
          } else if (v.playerLoc?.trim()) {
            yield `      <video:player_loc>${escapeXml(v.playerLoc.trim())}</video:player_loc>\n`;
          }
          yield '    </video:video>\n';
        }
      }

      if (variant === 'image') {
        const imgs = imagesFor(e.id);
        for (const img of imgs) {
          yield '    <image:image>\n';
          yield `      <image:loc>${escapeXml(img.src)}</image:loc>\n`;
          if (img.alt) yield `      <image:caption>${escapeXml(img.alt)}</image:caption>\n`;
          yield '    </image:image>\n';
        }
      }

      if (variant === 'hreflang' && e.hreflangs) {
        try {
          const list = JSON.parse(e.hreflangs) as { lang?: string; href?: string }[];
          if (Array.isArray(list)) {
            for (const h of list) {
              if (typeof h.lang === 'string' && typeof h.href === 'string') {
                yield `    <xhtml:link rel="alternate" hreflang="${escapeXml(h.lang)}" href="${escapeXml(h.href)}" />\n`;
              }
            }
          }
        } catch {
          // Malformed JSON — skip hreflang block for this URL.
        }
      }

      yield '  </url>\n';
    }
    yield '</urlset>\n';
  };

  const source = Readable.from(gen());
  const sink = createWriteStream(filePath, { encoding: gzip ? undefined : 'utf8' });
  if (gzip) {
    await pipeline(
      source.pipe(stringEncodeStream()),
      createGzip(),
      sink,
    );
  } else {
    await pipeline(source, sink);
  }
}

/**
 * Tiny passthrough that converts the async-iterable's string chunks
 * into Buffer for the gzip stream. (Readable.from with an async
 * generator emits string objects in object-mode; gzip expects bytes.)
 */
function stringEncodeStream(): Transform {
  return new Transform({
    writableObjectMode: true,
    readableObjectMode: false,
    transform(chunk, _enc, cb) {
      cb(null, Buffer.from(chunk as string, 'utf8'));
    },
  });
}

async function writeIndex(
  filePath: string,
  partUrls: string[],
  gzip: boolean,
): Promise<void> {
  const gen = async function* (): AsyncGenerator<string> {
    yield '<?xml version="1.0" encoding="UTF-8"?>\n';
    yield '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    const today = new Date().toISOString().slice(0, 10);
    for (const u of partUrls) {
      yield '  <sitemap>\n';
      yield `    <loc>${escapeXml(u)}</loc>\n`;
      yield `    <lastmod>${today}</lastmod>\n`;
      yield '  </sitemap>\n';
    }
    yield '</sitemapindex>\n';
  };
  const source = Readable.from(gen());
  const sink = createWriteStream(filePath, { encoding: gzip ? undefined : 'utf8' });
  if (gzip) {
    await pipeline(source.pipe(stringEncodeStream()), createGzip(), sink);
  } else {
    await pipeline(source, sink);
  }
}

/**
 * Write a sitemap (or a multi-part sharded sitemap with index) from the
 * crawl DB's indexable internal HTML URLs. Returns the list of files
 * written so the UI can surface them all to the user.
 *
 * Sharding: when the input set exceeds `splitAtUrlCount` (default 50K),
 * the export switches to:
 *   - `<filePath>` (or `<filePath>.gz`) — the **index** file
 *   - `<filePath>-1.xml`, `<filePath>-2.xml`, … (or `.xml.gz`) — parts
 * Index file always points to the parts via fully-qualified URLs that
 * preserve the input file's extension (so the user can drop the whole
 * directory into a webroot as-is).
 */
export async function exportSitemap(
  db: ProjectDb,
  filePath: string,
  options: SitemapOptions = {},
): Promise<SitemapExportResult> {
  const changefreq = options.changefreq ?? 'weekly';
  const depthBased = options.depthPriority ?? true;
  const variant: SitemapVariant = options.variant ?? 'standard';
  const gzip = options.gzip ?? false;
  const splitAt = Math.min(HARD_URL_LIMIT, options.splitAtUrlCount ?? HARD_URL_LIMIT);

  // Snapshot all indexable URLs into memory — the worst case is 50K URLs
  // (sitemap-spec hard cap per file) so this is bounded. For sharded
  // outputs we still need the full set up front to compute part counts.
  const entries: UrlEntry[] = [];
  for (const row of db.iterateIndexableUrls()) {
    // A video sitemap only lists pages that actually have a video.
    if (variant === 'video' && (!row.videos || row.videos === '[]')) continue;
    entries.push({
      id: row.id,
      url: row.url,
      depth: row.depth,
      crawledAt: row.crawledAt,
      hreflangs: row.hreflangs,
      title: row.title,
      lang: row.lang,
      ogSiteName: row.ogSiteName,
      videos: row.videos,
      metaDescription: row.metaDescription,
      ogImage: row.ogImage,
    });
  }

  const ext = gzip ? '.xml.gz' : path.extname(filePath) || '.xml';
  const base =
    path.extname(filePath) === '.gz'
      ? filePath.replace(/\.xml\.gz$/i, '').replace(/\.gz$/i, '')
      : filePath.replace(/\.xml$/i, '');

  const imagesFor = (urlId: number) =>
    variant === 'image' ? db.imagesForUrl(urlId, 1000) : [];

  // Single-file path: total fits in one shard, no index needed.
  if (entries.length <= splitAt) {
    const out = gzip && !filePath.endsWith('.gz') ? `${filePath}.gz` : filePath;
    await writePart(out, entries, variant, changefreq, depthBased, gzip, imagesFor);
    return {
      files: [out],
      urlsWritten: entries.length,
      truncated: false,
      sharded: false,
    };
  }

  // Sharded — write parts then the index. Truncation only applies if the
  // user explicitly capped via `splitAtUrlCount`; we treat the protocol
  // 50K cap as the hard limit per part, not on the total set.
  const files: string[] = [];
  let written = 0;
  const partFiles: string[] = [];
  let partIndex = 1;
  for (let i = 0; i < entries.length; i += splitAt) {
    const slice = entries.slice(i, i + splitAt);
    const partPath = `${base}-${partIndex}${ext}`;
    await writePart(partPath, slice, variant, changefreq, depthBased, gzip, imagesFor);
    partFiles.push(partPath);
    files.push(partPath);
    written += slice.length;
    partIndex++;
  }

  const indexPath = gzip && !filePath.endsWith('.gz') ? `${filePath}.gz` : filePath;
  // The sitemap protocol requires index <loc> values to be fully-qualified
  // URLs — a bare filename makes Search Console reject the index. Resolve
  // the part filenames against the crawl origin (explicit baseUrl, else the
  // first crawled URL's origin). If no origin can be derived we fall back to
  // basenames rather than failing the export.
  let origin = '';
  const rawBase = (options.baseUrl ?? entries[0]?.url ?? '').trim();
  if (rawBase) {
    try {
      origin = new URL(rawBase).origin;
    } catch {
      origin = '';
    }
  }
  const locFor = (p: string): string => {
    const name = path.basename(p);
    return origin ? `${origin}/${name}` : name;
  };
  await writeIndex(indexPath, partFiles.map(locFor), gzip);
  files.unshift(indexPath);

  return {
    files,
    urlsWritten: written,
    truncated: false,
    sharded: true,
  };
}

/**
 * Sitemap protocol-validator. Cheap heuristic checks on a freshly-
 * generated (or fetched) sitemap file path. Returns a list of human-
 * readable findings — empty list = passes all checks. Used by the
 * "Validate Sitemap" dialog; cheap enough to run inline.
 */
export function validateSitemap(args: {
  /** URL count actually emitted to the file. */
  urlCount: number;
  /** File size in bytes (post-gzip if applicable). */
  fileBytes: number;
  /** Sample of `<lastmod>` strings, ≤10. */
  lastmodSamples: string[];
}): { ok: boolean; findings: string[] } {
  const findings: string[] = [];
  if (args.urlCount > 50_000) {
    findings.push(
      `URL count ${args.urlCount} exceeds the sitemaps.org per-file limit (50,000).`,
    );
  }
  if (args.fileBytes > 50 * 1024 * 1024) {
    findings.push(
      `File size ${(args.fileBytes / (1024 * 1024)).toFixed(1)} MB exceeds the protocol limit (50 MB uncompressed).`,
    );
  }
  // Validate sample of lastmod strings against the W3C subset Google
  // accepts: YYYY-MM-DD, or full RFC 3339 / ISO 8601 with timezone.
  const lastmodRe = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;
  for (const sample of args.lastmodSamples) {
    if (!lastmodRe.test(sample)) {
      findings.push(`Invalid <lastmod> value: "${sample}" (expected YYYY-MM-DD or RFC 3339).`);
      break;
    }
  }
  return { ok: findings.length === 0, findings };
}
