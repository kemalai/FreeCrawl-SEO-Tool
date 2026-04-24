import * as cheerio from 'cheerio';
import type {
  DiscoveredImage,
  DiscoveredLink,
  LinkPathType,
  LinkPosition,
} from '@freecrawl/shared-types';
import { normalizeUrl, isSameHost } from './url-utils.js';

export interface ParsedPage {
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h1Count: number;
  h2Count: number;
  wordCount: number;
  canonical: string | null;
  metaRobots: string | null;
  lang: string | null;
  viewport: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  links: DiscoveredLink[];
  images: DiscoveredImage[];
  hasNoindex: boolean;
  hasNofollow: boolean;
}

export function parseHtml(
  html: string,
  pageUrl: string,
  opts: { includeSubdomains?: boolean } = {},
): ParsedPage {
  // Fast path: force the htmlparser2 backend and skip entity decoding.
  // ~2–3x faster than cheerio's default parse5 mode, which we don't need
  // because SEO extraction doesn't require strict HTML5 tree construction.
  const $ = cheerio.load(html, {
    xml: false,
    xmlMode: false,
    // @ts-expect-error — _useHtmlParser2 is a documented option on the
    // htmlparser2 backend; the typings lag behind the implementation.
    _useHtmlParser2: true,
    decodeEntities: false,
  });

  // We parse with decodeEntities:false for speed, so extracted strings
  // contain raw entities like `&#39;` or `&amp;`. Decode them before
  // storing so UI / CSV export / search see human-readable text.
  const title = decodeEntities($('title').first().text().trim()) || null;
  const metaDescription =
    decodeEntities(($('meta[name="description"]').attr('content') ?? '').trim()) || null;
  const h1 = decodeEntities($('h1').first().text().trim()) || null;
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const canonical = ($('link[rel="canonical"]').attr('href') ?? '').trim() || null;
  const metaRobots = ($('meta[name="robots"]').attr('content') ?? '').trim().toLowerCase() || null;
  const lang = ($('html').attr('lang') ?? '').trim() || null;
  const viewport = ($('meta[name="viewport"]').attr('content') ?? '').trim() || null;
  const ogTitle =
    decodeEntities(($('meta[property="og:title"]').attr('content') ?? '').trim()) || null;
  const ogDescription =
    decodeEntities(
      ($('meta[property="og:description"]').attr('content') ?? '').trim(),
    ) || null;
  const ogImage = ($('meta[property="og:image"]').attr('content') ?? '').trim() || null;

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

    const $el = $(el);
    const rel = ($el.attr('rel') ?? '').trim().toLowerCase() || null;
    const target = ($el.attr('target') ?? '').trim() || null;
    const rawAnchor = $el.text().replace(/\s+/g, ' ').trim().slice(0, 200) || null;
    const anchor = rawAnchor ? decodeEntities(rawAnchor) : null;

    // Image inside <a>: capture its alt attribute so the detail table can
    // show it alongside the plain anchor text.
    let altText: string | null = null;
    const imgAlt = $el.find('img[alt]').first().attr('alt');
    if (imgAlt !== undefined) {
      altText = decodeEntities(imgAlt.trim());
      if (altText === '') altText = null;
    }

    const isInternal = isSameHost(pageUrl, normalized, opts);
    const pathType = detectPathType(href);
    const linkPath = buildLinkPath(el);
    const linkPosition = detectLinkPosition(el);

    linkMap.set(normalized, {
      fromUrl: pageUrl,
      toUrl: normalized,
      type: 'hyperlink',
      anchor,
      altText,
      rel,
      target,
      pathType,
      linkPath,
      linkPosition,
      linkOrigin: 'html',
      isInternal,
    });
  });

  const imageMap = new Map<string, DiscoveredImage>();
  $('img[src]').each((_, el) => {
    const rawSrc = $(el).attr('src');
    if (!rawSrc) return;
    // Skip inline data URIs — they're not "web resources" in the crawler
    // sense and would bloat the images table fast on any CMS.
    if (rawSrc.startsWith('data:')) return;
    const normalized = normalizeUrl(rawSrc, pageUrl);
    if (!normalized) return;
    if (!/^https?:/.test(normalized)) return;
    if (imageMap.has(normalized)) return;

    const altAttr = $(el).attr('alt');
    const alt =
      altAttr === undefined
        ? null // alt missing entirely (accessibility issue)
        : decodeEntities(altAttr.trim()); // empty string means decorative — kept as ''
    const width = parseIntAttr($(el).attr('width'));
    const height = parseIntAttr($(el).attr('height'));
    const isInternal = isSameHost(pageUrl, normalized, opts);

    imageMap.set(normalized, {
      src: normalized,
      alt,
      width,
      height,
      isInternal,
    });
  });

  return {
    title,
    metaDescription,
    h1,
    h1Count,
    h2Count,
    wordCount,
    canonical,
    metaRobots,
    lang,
    viewport,
    ogTitle,
    ogDescription,
    ogImage,
    links: [...linkMap.values()],
    images: [...imageMap.values()],
    hasNoindex,
    hasNofollow,
  };
}

function parseIntAttr(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function detectPathType(rawHref: string): LinkPathType {
  const h = rawHref.trim();
  if (/^https?:\/\//i.test(h)) return 'absolute';
  if (h.startsWith('//')) return 'protocol-relative';
  if (h.startsWith('/')) return 'root-relative';
  return 'path-relative';
}

/**
 * Crude DOM breadcrumb for a link element — e.g. "body > main > article > a".
 * Includes up to 8 ancestors so very deep DOMs don't produce huge strings.
 */
function buildLinkPath(el: unknown): string | null {
  const parts: string[] = [];
  let cur: { type?: string; name?: string; parent?: unknown } | null = el as {
    type?: string;
    name?: string;
    parent?: unknown;
  };
  let hops = 0;
  while (cur && hops < 12) {
    if (cur.type === 'tag' && cur.name) {
      parts.unshift(cur.name);
    }
    cur = cur.parent as typeof cur;
    hops++;
  }
  if (parts.length === 0) return null;
  return parts.slice(-8).join(' > ');
}

/**
 * Infer the page region a link lives in based on its ancestor landmark
 * elements. Walks up the parent chain and returns the first match.
 */
function detectLinkPosition(el: unknown): LinkPosition {
  let cur: { type?: string; name?: string; parent?: unknown } | null = el as {
    type?: string;
    name?: string;
    parent?: unknown;
  };
  while (cur) {
    if (cur.type === 'tag' && cur.name) {
      const name = cur.name.toLowerCase();
      if (name === 'nav') return 'navigation';
      if (name === 'header') return 'header';
      if (name === 'footer') return 'footer';
      if (name === 'aside') return 'sidebar';
      if (name === 'main' || name === 'article') return 'content';
    }
    cur = cur.parent as typeof cur;
  }
  return 'content';
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
};

function decodeEntities(s: string): string {
  if (!s || s.indexOf('&') === -1) return s;
  return s.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (m, dec, hex, name) => {
    if (dec) {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    if (hex) {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return NAMED_ENTITIES[name.toLowerCase()] ?? m;
  });
}
