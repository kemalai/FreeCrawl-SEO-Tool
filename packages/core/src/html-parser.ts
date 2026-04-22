import * as cheerio from 'cheerio';
import type { DiscoveredLink } from '@freecrawl/shared-types';
import { normalizeUrl, isSameHost } from './url-utils.js';

export interface ParsedPage {
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h2Count: number;
  wordCount: number;
  canonical: string | null;
  metaRobots: string | null;
  lang: string | null;
  links: DiscoveredLink[];
  hasNoindex: boolean;
  hasNofollow: boolean;
}

export function parseHtml(
  html: string,
  pageUrl: string,
  opts: { includeSubdomains?: boolean } = {},
): ParsedPage {
  const $ = cheerio.load(html);

  const title = $('title').first().text().trim() || null;
  const metaDescription = ($('meta[name="description"]').attr('content') ?? '').trim() || null;
  const h1 = $('h1').first().text().trim() || null;
  const h2Count = $('h2').length;
  const canonical = ($('link[rel="canonical"]').attr('href') ?? '').trim() || null;
  const metaRobots = ($('meta[name="robots"]').attr('content') ?? '').trim().toLowerCase() || null;
  const lang = ($('html').attr('lang') ?? '').trim() || null;

  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = text.length > 0 ? text.split(' ').filter(Boolean).length : 0;

  const hasNoindex = metaRobots !== null && metaRobots.includes('noindex');
  const hasNofollow = metaRobots !== null && metaRobots.includes('nofollow');

  const linkMap = new Map<string, DiscoveredLink>();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const normalized = normalizeUrl(href, pageUrl);
    if (!normalized) return;
    if (!/^https?:/.test(normalized)) return;
    if (linkMap.has(normalized)) return;

    const rel = ($(el).attr('rel') ?? '').trim().toLowerCase() || null;
    const anchor = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 200) || null;
    const isInternal = isSameHost(pageUrl, normalized, opts);

    linkMap.set(normalized, {
      fromUrl: pageUrl,
      toUrl: normalized,
      anchor,
      rel,
      isInternal,
    });
  });

  return {
    title,
    metaDescription,
    h1,
    h2Count,
    wordCount,
    canonical,
    metaRobots,
    lang,
    links: [...linkMap.values()],
    hasNoindex,
    hasNofollow,
  };
}
