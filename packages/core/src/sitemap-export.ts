import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { ProjectDb } from '@freecrawl/db';

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
}

const SITEMAP_URL_LIMIT = 50_000;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatLastmod(crawledAt: string): string {
  // DB stores CURRENT_TIMESTAMP as 'YYYY-MM-DD HH:MM:SS'. Sitemap spec
  // accepts ISO 8601; the date-only form is simplest and valid.
  const date = crawledAt.slice(0, 10);
  return date.length === 10 ? date : new Date().toISOString().slice(0, 10);
}

function priorityForDepth(depth: number, depthBased: boolean): string {
  if (!depthBased) return '0.5';
  const p = Math.max(0.1, 1 - depth * 0.1);
  return p.toFixed(1);
}

/**
 * Write a sitemap.xml from the crawl DB's indexable internal HTML URLs.
 * Returns `{ urlsWritten, truncated }`; `truncated` is true when the set
 * exceeded the 50K single-file limit and was clipped (multi-file sitemap
 * index is a future enhancement).
 */
export async function exportSitemap(
  db: ProjectDb,
  filePath: string,
  options: SitemapOptions = {},
): Promise<{ urlsWritten: number; truncated: boolean }> {
  const changefreq = options.changefreq ?? 'weekly';
  const depthBased = options.depthPriority ?? true;

  let urlsWritten = 0;
  let truncated = false;

  const generator = async function* (): AsyncGenerator<string> {
    yield '<?xml version="1.0" encoding="UTF-8"?>\n';
    yield '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (const row of db.iterateIndexableUrls()) {
      if (urlsWritten >= SITEMAP_URL_LIMIT) {
        truncated = true;
        break;
      }
      yield '  <url>\n';
      yield `    <loc>${escapeXml(row.url)}</loc>\n`;
      if (row.crawledAt) {
        yield `    <lastmod>${formatLastmod(row.crawledAt)}</lastmod>\n`;
      }
      yield `    <changefreq>${changefreq}</changefreq>\n`;
      yield `    <priority>${priorityForDepth(row.depth, depthBased)}</priority>\n`;
      yield '  </url>\n';
      urlsWritten++;
    }
    yield '</urlset>\n';
  };

  await pipeline(
    Readable.from(generator()),
    createWriteStream(filePath, { encoding: 'utf8' }),
  );

  return { urlsWritten, truncated };
}
