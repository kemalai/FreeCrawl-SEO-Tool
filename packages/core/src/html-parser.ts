import * as cheerio from 'cheerio';
import type {
  DiscoveredImage,
  DiscoveredLink,
  LinkPathType,
  LinkPosition,
} from '@freecrawl/shared-types';
import { normalizeUrl, isSameHost, type UrlRewriteOptions } from './url-utils.js';

export interface HreflangEntry {
  /** Language tag from `hreflang` attribute (e.g. "tr", "en-US", "x-default"). */
  lang: string;
  /** Resolved absolute URL of the alternate page. */
  href: string;
}

export interface ParsedPage {
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  h4Count: number;
  h5Count: number;
  h6Count: number;
  wordCount: number;
  canonical: string | null;
  /** Number of `<link rel="canonical">` elements declared. >1 is a confusion signal. */
  canonicalCount: number;
  metaRobots: string | null;
  lang: string | null;
  viewport: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  metaKeywords: string | null;
  metaAuthor: string | null;
  metaGenerator: string | null;
  themeColor: string | null;
  /** Sorted unique `@type` values collected from all JSON-LD blocks. */
  schemaTypes: string[];
  /** Total number of valid JSON-LD `<script>` blocks on the page. */
  schemaBlockCount: number;
  /** Number of JSON-LD blocks that failed to parse. */
  schemaInvalidCount: number;
  /** `<link rel="next">` href, normalized to absolute URL. */
  paginationNext: string | null;
  /** `<link rel="prev">` href, normalized to absolute URL. */
  paginationPrev: string | null;
  /** All `<link rel="alternate" hreflang>` entries on the page. */
  hreflangs: HreflangEntry[];
  /** `<link rel="amphtml" href>` if present, else null. */
  amphtml: string | null;
  /** Resolved favicon URL from `<link rel="icon">` / `shortcut icon`, else null. */
  favicon: string | null;
  /**
   * Number of `http://` subresources (img, script, stylesheet, iframe, …)
   * referenced from a HTTPS page — i.e. mixed-content findings. Always 0
   * when the page itself is served over plain HTTP.
   */
  mixedContentCount: number;
  /**
   * `{ "term1": count, "term2": count, ... }` — case-insensitive literal
   * substring match counts. Empty if no terms requested.
   */
  customSearchHits: Record<string, number>;
  /** Raw `content` attribute of `<meta http-equiv="refresh">`, else null. */
  metaRefresh: string | null;
  /**
   * Absolute redirect target parsed from the meta-refresh content's
   * `url=…` parameter, normalized via `normalizeUrl`. Null when the
   * meta-refresh sets only a delay (page reload), or has no parseable URL.
   */
  metaRefreshUrl: string | null;
  /**
   * Declared character encoding from the document itself — lowercased.
   * Looks at `<meta charset>` first, then `<meta http-equiv="Content-Type">`'s
   * `charset=` parameter. Null when neither is present (the HTTP
   * Content-Type header is checked separately by the crawler).
   */
  charset: string | null;
  links: DiscoveredLink[];
  images: DiscoveredImage[];
  hasNoindex: boolean;
  hasNofollow: boolean;
}

export function parseHtml(
  html: string,
  pageUrl: string,
  opts: {
    includeSubdomains?: boolean;
    customSearchTerms?: readonly string[];
    /** URL-rewrite policy applied to every link/image/canonical we resolve. */
    urlRewrites?: UrlRewriteOptions;
  } = {},
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
  const h3Count = $('h3').length;
  const h4Count = $('h4').length;
  const h5Count = $('h5').length;
  const h6Count = $('h6').length;
  const canonicalEls = $('link[rel="canonical"]');
  const canonical = (canonicalEls.first().attr('href') ?? '').trim() || null;
  const canonicalCount = canonicalEls.length;
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

  // Twitter Cards use `name=` (not `property=`) per Twitter's spec. Many
  // sites leave one set missing and rely on the other — we capture both.
  const twitterCard =
    ($('meta[name="twitter:card"]').attr('content') ?? '').trim().toLowerCase() || null;
  const twitterTitle =
    decodeEntities(($('meta[name="twitter:title"]').attr('content') ?? '').trim()) || null;
  const twitterDescription =
    decodeEntities(
      ($('meta[name="twitter:description"]').attr('content') ?? '').trim(),
    ) || null;
  const twitterImage =
    ($('meta[name="twitter:image"]').attr('content') ?? '').trim() || null;

  const metaKeywords =
    decodeEntities(($('meta[name="keywords"]').attr('content') ?? '').trim()) || null;
  const metaAuthor =
    decodeEntities(($('meta[name="author"]').attr('content') ?? '').trim()) || null;
  const metaGenerator =
    decodeEntities(($('meta[name="generator"]').attr('content') ?? '').trim()) || null;
  const themeColor =
    ($('meta[name="theme-color"]').attr('content') ?? '').trim() || null;

  // JSON-LD structured data — Google's preferred structured-data format.
  // Each page can have multiple <script type="application/ld+json"> blocks,
  // each block can be a single object, an array, or a graph via `@graph`.
  // We walk the parsed JSON recursively to collect every `@type` so the UI
  // can show the type set a page declares (Product, Article, BreadcrumbList…)
  // without having to inspect the raw payload.
  const schemaTypeSet = new Set<string>();
  let schemaBlockCount = 0;
  let schemaInvalidCount = 0;
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text().trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      collectSchemaTypes(parsed, schemaTypeSet);
      schemaBlockCount++;
    } catch {
      // Malformed JSON-LD — still count presence so Structured Data
      // Missing filter doesn't mistakenly claim "no structured data" when
      // the author just broke the syntax; surface via schemaInvalidCount.
      schemaInvalidCount++;
    }
  });
  const schemaTypes = [...schemaTypeSet].sort();

  // Pagination — `<link rel="next">` / `<link rel="prev">`. Resolved to
  // absolute via normalizeUrl so the values are comparable to the URLs
  // we crawl and store.
  const paginationNextRaw = ($('link[rel="next"]').attr('href') ?? '').trim();
  const paginationPrevRaw = ($('link[rel="prev"]').attr('href') ?? '').trim();
  const paginationNext = paginationNextRaw ? normalizeUrl(paginationNextRaw, pageUrl, opts.urlRewrites) : null;
  const paginationPrev = paginationPrevRaw ? normalizeUrl(paginationPrevRaw, pageUrl, opts.urlRewrites) : null;

  // Hreflang — `<link rel="alternate" hreflang="…" href="…">`. We dedupe
  // by lang+href because some sites repeat tags accidentally.
  const hreflangSet = new Set<string>();
  const hreflangs: HreflangEntry[] = [];
  $('link[rel="alternate"][hreflang]').each((_, el) => {
    const lang = ($(el).attr('hreflang') ?? '').trim();
    const rawHref = ($(el).attr('href') ?? '').trim();
    if (!lang || !rawHref) return;
    const href = normalizeUrl(rawHref, pageUrl, opts.urlRewrites);
    if (!href) return;
    const key = `${lang}|${href}`;
    if (hreflangSet.has(key)) return;
    hreflangSet.add(key);
    hreflangs.push({ lang, href });
  });

  // AMP variant — `<link rel="amphtml">` points to the AMP version of
  // the current page, when one exists.
  const amphtmlRaw = ($('link[rel="amphtml"]').attr('href') ?? '').trim();
  const amphtml = amphtmlRaw ? normalizeUrl(amphtmlRaw, pageUrl, opts.urlRewrites) : null;

  // Favicon — prefer modern `rel="icon"`, fall back to legacy
  // `rel="shortcut icon"`. We don't fabricate a default `/favicon.ico`;
  // only what the page actually declares.
  const faviconRaw =
    ($('link[rel="icon"]').first().attr('href') ?? '').trim() ||
    ($('link[rel="shortcut icon"]').first().attr('href') ?? '').trim();
  const favicon = faviconRaw ? normalizeUrl(faviconRaw, pageUrl, opts.urlRewrites) : null;

  // Meta refresh — `<meta http-equiv="refresh" content="N; url=…">`.
  // Even when the URL is absent (pure auto-reload) we still capture the
  // raw content so the issue filter can flag the page for using meta
  // refresh at all (Google explicitly discourages it as a redirect).
  const metaRefreshRaw = (
    $('meta[http-equiv="refresh"], meta[http-equiv="Refresh"], meta[http-equiv="REFRESH"]')
      .first()
      .attr('content') ?? ''
  ).trim();
  let metaRefresh: string | null = metaRefreshRaw || null;
  let metaRefreshUrl: string | null = null;
  if (metaRefresh) {
    // Format is `<seconds>[; url=<URL>]`. Parameters are case-insensitive
    // and may be separated by `;` or `,`. Quotes around the URL are
    // optional and we strip them defensively.
    const urlMatch = metaRefresh.match(/[;,]\s*url\s*=\s*['"]?([^'"\s;,]+)['"]?/i);
    if (urlMatch && urlMatch[1]) {
      metaRefreshUrl = normalizeUrl(urlMatch[1], pageUrl, opts.urlRewrites);
    }
  }

  // Document-declared character encoding. HTML5's `<meta charset>` wins;
  // legacy `<meta http-equiv="Content-Type">` is parsed as a fallback so
  // older sites still surface a value.
  let charset = ($('meta[charset]').first().attr('charset') ?? '').trim().toLowerCase() || null;
  if (!charset) {
    const ctMeta = (
      $('meta[http-equiv="Content-Type"], meta[http-equiv="content-type"]')
        .first()
        .attr('content') ?? ''
    ).toLowerCase();
    const m = ctMeta.match(/charset\s*=\s*([^\s;]+)/);
    if (m && m[1]) charset = m[1];
  }

  // Mixed content — only relevant on HTTPS pages. We scan the standard
  // subresource elements (Google's mixed-content audit list); plain
  // `<a href>` doesn't count because anchor links aren't subresources.
  let mixedContentCount = 0;
  if (pageUrl.startsWith('https://')) {
    $(
      'img[src], script[src], iframe[src], video[src], audio[src], source[src], embed[src], link[rel="stylesheet"][href]',
    ).each((_, el) => {
      const $el = $(el);
      const ref = ($el.attr('src') ?? $el.attr('href') ?? '').trim();
      if (ref.startsWith('http://')) mixedContentCount++;
    });
  }

  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = text.length > 0 ? text.split(' ').filter(Boolean).length : 0;

  // Custom search — count case-insensitive literal substring occurrences
  // in the visible body text (not raw HTML, to avoid attribute / inline-JS
  // false positives). Lowercase haystack/needle once per page rather than
  // per-term so cost stays linear in body size.
  const customSearchHits: Record<string, number> = {};
  if (opts.customSearchTerms && opts.customSearchTerms.length > 0 && text.length > 0) {
    const haystack = text.toLowerCase();
    for (const raw of opts.customSearchTerms) {
      const term = raw.trim();
      if (!term) continue;
      const needle = term.toLowerCase();
      let count = 0;
      let pos = 0;
      while ((pos = haystack.indexOf(needle, pos)) !== -1) {
        count++;
        pos += needle.length;
      }
      customSearchHits[term] = count;
    }
  }

  const hasNoindex = metaRobots !== null && metaRobots.includes('noindex');
  const hasNofollow = metaRobots !== null && metaRobots.includes('nofollow');

  const linkMap = new Map<string, DiscoveredLink>();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const normalized = normalizeUrl(href, pageUrl, opts.urlRewrites);
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
    const normalized = normalizeUrl(rawSrc, pageUrl, opts.urlRewrites);
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
    h3Count,
    h4Count,
    h5Count,
    h6Count,
    wordCount,
    canonical,
    canonicalCount,
    metaRobots,
    lang,
    viewport,
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
    metaKeywords,
    metaAuthor,
    metaGenerator,
    themeColor,
    schemaTypes,
    schemaBlockCount,
    schemaInvalidCount,
    paginationNext,
    paginationPrev,
    hreflangs,
    amphtml,
    favicon,
    mixedContentCount,
    customSearchHits,
    metaRefresh,
    metaRefreshUrl,
    charset,
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

/**
 * Walk a parsed JSON-LD payload and add every `@type` value it finds to
 * the provided set. Handles the three common shapes Google documents:
 *
 *   - top-level object:    { "@type": "Product", ... }
 *   - top-level array:     [ { "@type": "Article" }, { "@type": "Person" } ]
 *   - @graph container:    { "@graph": [ { "@type": "WebPage" }, ... ] }
 *
 * `@type` itself may be a string or an array of strings (the latter is
 * valid per the JSON-LD spec, e.g. `"@type": ["Product", "Offer"]`).
 * Nested objects/arrays are walked recursively so deeply-nested types
 * like breadcrumb list items are also captured.
 */
function collectSchemaTypes(node: unknown, out: Set<string>): void {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) collectSchemaTypes(item, out);
    return;
  }
  if (typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  const type = obj['@type'];
  if (typeof type === 'string' && type) out.add(type);
  else if (Array.isArray(type)) {
    for (const t of type) if (typeof t === 'string' && t) out.add(t);
  }
  for (const value of Object.values(obj)) {
    if (value && (typeof value === 'object' || Array.isArray(value))) {
      collectSchemaTypes(value, out);
    }
  }
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
