import * as cheerio from 'cheerio';
import type {
  CustomExtractionRule,
  DiscoveredImage,
  DiscoveredLink,
  LinkPathType,
  LinkPosition,
} from '@freecrawl/shared-types';
import { normalizeUrl, isSameHost, type UrlRewriteOptions } from './url-utils.js';
import { computeContentFingerprint } from './simhash.js';
import { runExtractionRules } from './extraction.js';

export interface HreflangEntry {
  /** Language tag from `hreflang` attribute (e.g. "tr", "en-US", "x-default"). */
  lang: string;
  /** Resolved absolute URL of the alternate page. */
  href: string;
}

/**
 * One detected third-party analytics / marketing tracker on a page. The
 * `name` is the canonical product name (e.g. `"Google Analytics 4"`). The
 * `id` is the account/property identifier when we can recover it from the
 * page (e.g. `G-ABC123` for GA4, `GTM-XYZ987` for GTM). Some trackers
 * (Hotjar, Clarity) also expose IDs; others (LinkedIn Insight, TikTok
 * Pixel) we only detect by their loader script and surface without an ID.
 */
export interface AnalyticsTracker {
  name: string;
  id: string | null;
}

export interface ParsedPage {
  title: string | null;
  /** Number of `<title>` elements in the document. >1 is a tag-duplication bug. */
  titleCount: number;
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
  /** Number of Microdata `itemscope` elements declared on the page. */
  microdataCount: number;
  /** Number of RDFa `typeof` / `vocab` / `property` attribute occurrences. */
  rdfaCount: number;
  /**
   * Number of `<form action="http://…">` elements declared on a HTTPS page.
   * 0 when the page itself is plain-HTTP (insecure already; no special
   * relationship to flag).
   */
  insecureFormActionCount: number;
  /**
   * Number of `<script>` / `<link rel="stylesheet">` referencing a third-
   * party origin without an `integrity` attribute. SRI is recommended for
   * any cross-origin subresource that you don't fully control.
   */
  missingSriCount: number;
  /**
   * Number of render-blocking resources in `<head>`: `<script src>` without
   * `async`/`defer`/`type=module`, plus `<link rel="stylesheet">` (excl.
   * `media=print`). These delay first-paint until fetched and parsed.
   */
  renderBlockingCount: number;
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
  /** Resolved `<link rel="apple-touch-icon">` URL, else null. */
  appleTouchIcon: string | null;
  /** Resolved `<link rel="manifest">` URL, else null. */
  manifestUrl: string | null;
  /** Resolved RSS / Atom feed `<link rel="alternate">` URL, else null. */
  feedUrl: string | null;
  /** Number of internal hyperlinks with no usable anchor text or image alt. */
  emptyAnchorCount: number;
  /**
   * Number of `<a>` elements that look clickable but are NOT crawlable —
   * either no `href` at all (with `onclick`), `href="javascript:…"`, or
   * `href="#"` paired with an `onclick`. Search engines can't follow
   * these so any navigation that depends on them is invisible to crawl.
   * Excludes `href="#"` without `onclick` (legitimate scroll anchors)
   * and `href="#section-id"` (in-page jumps — crawlable as the same URL).
   */
  jsOnlyLinksCount: number;
  /**
   * Visible-text bytes divided by total HTML bytes, expressed as an
   * integer percent (0–100). Low ratio (typically <10%) suggests heavy
   * JavaScript / template scaffolding with little crawlable content;
   * high ratio (>30%) is content-rich. Null on non-HTML or empty pages.
   */
  textCodeRatio: number | null;
  /** Number of `<img>` with explicit `alt=""` (decorative — distinct from missing alt). */
  imagesEmptyAlt: number;
  /**
   * Number of `<img>` declaring `loading="lazy"`. Combined with the total
   * image count this lets the UI surface pages where lazy-loading isn't
   * adopted on image-heavy pages — a common LCP / CLS optimisation lever.
   */
  imagesLazy: number;
  /**
   * Total user-facing form inputs on the page (`<input>`, `<textarea>`,
   * `<select>`), excluding `type=hidden / submit / button / image / reset`
   * because those don't accept user data and don't need labels.
   */
  formInputCount: number;
  /**
   * Form inputs that lack any accessible name source — no associated
   * `<label for="…">`, no enclosing `<label>`, no `aria-label`,
   * `aria-labelledby`, or `title` attribute. These fail WCAG 1.3.1 /
   * 4.1.2 and ship as "unlabeled form field" in axe / Lighthouse audits.
   */
  formInputUnlabeledCount: number;
  /**
   * Document outline — every `<h1>`–`<h6>` in source order, capped at
   * 200 entries so a 5000-heading CMS dump can't bloat the row. Drives
   * the Detail Panel "Outline" sub-tab (skipped-level highlighting,
   * heading count etc.). `text` is whitespace-collapsed and sliced to
   * 200 chars per heading to keep the JSON payload small.
   */
  headings: { level: number; text: string }[];
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
  /**
   * Custom-extraction results map — JSON-serialisable values keyed by
   * rule name, or null when no rules configured / nothing matched.
   */
  extractionResults: Record<string, unknown> | null;
  /**
   * 64-bit Charikar SimHash of body text shingles (hex, 16 chars). Used by
   * the post-crawl near-duplicate clustering pass. Null when the page has
   * too little usable content to fingerprint (<50 chars / <3 tokens).
   */
  simhash: string | null;
  /**
   * 64-bit FNV-1a hash of the full normalised body token stream (hex, 16
   * chars). Two pages whose `contentHash` collides have byte-identical
   * tokenised body — the basis for the "Exact Duplicate Content" issue.
   */
  contentHash: string | null;
  /**
   * Detected third-party analytics / marketing trackers on this page. Empty
   * array when none. Populated by `detectAnalyticsTrackers`.
   */
  analyticsTrackers: AnalyticsTracker[];
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
    /** Hostnames (or `*.suffix.example`) treated as same-host for scope. */
    cdnHosts?: readonly string[];
    customSearchTerms?: readonly string[];
    /** URL-rewrite policy applied to every link/image/canonical we resolve. */
    urlRewrites?: UrlRewriteOptions;
    /** Custom Extraction rules to run against this page. */
    customExtractionRules?: ReadonlyArray<CustomExtractionRule>;
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
  const titleEls = $('title');
  const titleCount = titleEls.length;
  const title = decodeEntities(titleEls.first().text().trim()) || null;
  const metaDescription =
    decodeEntities(($('meta[name="description"]').attr('content') ?? '').trim()) || null;
  const h1 = decodeEntities($('h1').first().text().trim()) || null;
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  const h4Count = $('h4').length;
  const h5Count = $('h5').length;
  const h6Count = $('h6').length;

  // Document outline — every heading in source order, capped at 200
  // entries. Used by the Detail Panel "Outline" sub-tab to render the
  // page's structural hierarchy and flag skipped levels (h1 → h3 with
  // no h2 in between).
  const headings: { level: number; text: string }[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    if (headings.length >= 200) return;
    const tag = (el as { name?: string }).name?.toLowerCase() ?? '';
    const level = parseInt(tag.slice(1), 10);
    if (!Number.isFinite(level) || level < 1 || level > 6) return;
    const raw = $(el).text().replace(/\s+/g, ' ').trim();
    const text = decodeEntities(raw).slice(0, 200);
    headings.push({ level, text });
  });
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

  // Microdata & RDFa — alternative structured-data formats. We only count
  // occurrences (not the type vocabulary), because the data model varies
  // per author and the Issues panel only needs presence/absence to flag a
  // missing-structured-data page. Schema.org microdata uses `itemscope`;
  // RDFa uses `typeof` / `vocab` / `property`.
  const microdataCount = $('[itemscope]').length;
  const rdfaCount =
    $('[typeof]').length + $('[vocab]').length + $('[property]').length;

  // Insecure form action — HTTPS page with `<form action="http://…">`.
  // Browsers warn ("not secure" interstitial) when the user submits.
  let insecureFormActionCount = 0;
  if (pageUrl.startsWith('https://')) {
    $('form[action]').each((_, el) => {
      const action = ($(el).attr('action') ?? '').trim();
      if (action.startsWith('http://')) insecureFormActionCount++;
    });
  }

  // Subresource Integrity — flag third-party `<script>` / `<link rel=stylesheet>`
  // without an `integrity` attribute. We compare hosts so first-party
  // resources (same origin) don't trip the count; SRI is mainly a
  // recommendation for CDN-hosted dependencies.
  let missingSriCount = 0;
  let pageHost = '';
  try {
    pageHost = new URL(pageUrl).host;
  } catch {
    /* no-op */
  }
  if (pageHost) {
    $('script[src], link[rel="stylesheet"][href]').each((_, el) => {
      const $el = $(el);
      const ref = ($el.attr('src') ?? $el.attr('href') ?? '').trim();
      if (!ref || ref.startsWith('data:')) return;
      let host = '';
      try {
        host = new URL(ref, pageUrl).host;
      } catch {
        return;
      }
      if (!host || host === pageHost) return;
      const integrity = ($el.attr('integrity') ?? '').trim();
      if (!integrity) missingSriCount++;
    });
  }

  // Render-blocking resources — `<head>` `<script>` without `async`/`defer`
  // and `<link rel="stylesheet">` (any). Both block first-paint until
  // they're fetched + parsed. Lighthouse audits these as the #1 LCP
  // optimisation lever for content-heavy pages.
  let renderBlockingCount = 0;
  $('head script[src]').each((_, el) => {
    const $el = $(el);
    const isAsync = $el.attr('async') !== undefined;
    const isDefer = $el.attr('defer') !== undefined;
    const isModule = ($el.attr('type') ?? '').toLowerCase() === 'module';
    // ES modules are deferred by spec — not render-blocking.
    if (!isAsync && !isDefer && !isModule) renderBlockingCount++;
  });
  $('head link[rel="stylesheet"]').each((_, el) => {
    const $el = $(el);
    // Stylesheets with a `media` of `print` / `all` (default) are not
    // render-blocking when print-only. We only count default + screen.
    const media = ($el.attr('media') ?? '').trim().toLowerCase();
    if (media === 'print') return;
    // `<link rel="preload" as="style">` doesn't block; only true rel=stylesheet
    // counts here (selector already excludes preload).
    renderBlockingCount++;
  });

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

  // Apple touch icon — iOS/iPadOS home-screen icon. Multiple sizes can be
  // declared; we surface the first to keep the column simple.
  const appleTouchRaw =
    ($('link[rel="apple-touch-icon"]').first().attr('href') ?? '').trim() ||
    ($('link[rel="apple-touch-icon-precomposed"]').first().attr('href') ?? '').trim();
  const appleTouchIcon = appleTouchRaw
    ? normalizeUrl(appleTouchRaw, pageUrl, opts.urlRewrites)
    : null;

  // Web app manifest — PWA support signal.
  const manifestRaw = ($('link[rel="manifest"]').first().attr('href') ?? '').trim();
  const manifestUrl = manifestRaw
    ? normalizeUrl(manifestRaw, pageUrl, opts.urlRewrites)
    : null;

  // RSS / Atom feed — `<link rel="alternate" type="application/rss+xml">` or
  // atom equivalent. We surface the first declared feed; many sites declare
  // both.
  const feedRaw =
    (
      $('link[rel="alternate"][type="application/rss+xml"]').first().attr('href') ?? ''
    ).trim() ||
    (
      $('link[rel="alternate"][type="application/atom+xml"]').first().attr('href') ?? ''
    ).trim();
  const feedUrl = feedRaw ? normalizeUrl(feedRaw, pageUrl, opts.urlRewrites) : null;

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

  // Analytics / marketing trackers — fingerprinted by script src + inline
  // JS substrings + meta tags. Cheaper to scan once over `$` than per-tracker.
  const analyticsTrackers = detectAnalyticsTrackers($, html);

  // Content fingerprint for the post-crawl duplicate clustering pass.
  // Uses the same trimmed body text as wordCount so the work is reused.
  const { simhash, contentHash } = computeContentFingerprint(text);

  // Custom Extraction — runs after all standard fields so the cheerio
  // tree is fully populated. Per-rule failures are isolated; the worst
  // case is `null` for that rule's column.
  const extractionResults =
    opts.customExtractionRules && opts.customExtractionRules.length > 0
      ? runExtractionRules(html, $, opts.customExtractionRules)
      : null;

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

  // Text/code ratio — visible body text bytes divided by raw HTML bytes,
  // rounded to integer percent. Cheap to compute right next to the body
  // text-length pass below. We strip <script>/<style>/<noscript> contents
  // out of the visible-text count because their inner text isn't user-
  // facing content (and would inflate the ratio on JS-heavy SPAs that
  // ship a 200 KB script tag with no markup). Null when the body is
  // empty or the HTML body byte count is zero.
  const totalHtmlBytes = Buffer.byteLength(html, 'utf8');
  let textCodeRatio: number | null = null;
  if (totalHtmlBytes > 0) {
    const $body = $('body').clone();
    $body.find('script, style, noscript').remove();
    const visibleText = $body.text().replace(/\s+/g, ' ').trim();
    const visibleBytes = Buffer.byteLength(visibleText, 'utf8');
    textCodeRatio = Math.min(100, Math.round((visibleBytes / totalHtmlBytes) * 100));
  }

  let emptyAnchorCount = 0;
  // JS-only / non-crawlable anchors. Three patterns count toward this
  // number — see the field doc on `parseHtml` return for the rationale:
  //   1. `<a onclick="…">`               (no href at all)
  //   2. `<a href="javascript:…">`       (href is a JS URI scheme)
  //   3. `<a href="#" onclick="…">`      (placeholder href + JS handler)
  // We scan ALL `<a>` (not just `a[href]`) because pattern 1 has no href.
  let jsOnlyLinksCount = 0;
  $('a').each((_, el) => {
    const $el = $(el);
    const rawHref = $el.attr('href');
    const onclick = $el.attr('onclick');
    if (rawHref === undefined) {
      if (onclick && onclick.trim() !== '') jsOnlyLinksCount++;
      return;
    }
    const href = rawHref.trim();
    // RFC 3986 — `javascript:` scheme is the canonical JS-only marker.
    // Lowercased before match to handle `JavaScript:` casing in the wild.
    if (/^javascript:/i.test(href)) {
      jsOnlyLinksCount++;
      return;
    }
    // `#` exactly = placeholder; only counts when an onclick is wired.
    // `#section-id` (length > 1) is a legitimate in-page jump — skip.
    if (href === '#' && onclick && onclick.trim() !== '') {
      jsOnlyLinksCount++;
    }
  });

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

    // Empty anchor: no usable text inside the <a> AND no alt on a nested
    // image. Common accessibility/SEO failure on icon-only or image-only
    // links. Only count internal links — externals aren't our problem.
    if (isInternal && !anchor && !altText) emptyAnchorCount++;

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

  // Form accessibility — count user-facing inputs (not type=hidden /
   // submit / button / image / reset, which don't accept user data) and
   // flag those without an accessible name source. The label association
   // can come from a wrapping `<label>`, a `<label for="…">` referencing
   // the input's id, an `aria-label`, an `aria-labelledby`, or a `title`.
  let formInputCount = 0;
  let formInputUnlabeledCount = 0;
  const labelForIds = new Set<string>();
  $('label[for]').each((_, el) => {
    const v = ($(el).attr('for') ?? '').trim();
    if (v) labelForIds.add(v);
  });
  $('input, textarea, select').each((_, el) => {
    const $el = $(el);
    const tag = (el as { name?: string }).name?.toLowerCase() ?? '';
    if (tag === 'input') {
      const t = ($el.attr('type') ?? 'text').toLowerCase();
      if (
        t === 'hidden' ||
        t === 'submit' ||
        t === 'button' ||
        t === 'image' ||
        t === 'reset'
      ) {
        return;
      }
    }
    formInputCount++;
    const id = ($el.attr('id') ?? '').trim();
    const ariaLabel = ($el.attr('aria-label') ?? '').trim();
    const ariaLabelledBy = ($el.attr('aria-labelledby') ?? '').trim();
    const titleAttr = ($el.attr('title') ?? '').trim();
    const wrappingLabel = $el.parents('label').length > 0;
    const labeledByFor = id !== '' && labelForIds.has(id);
    if (
      !wrappingLabel &&
      !labeledByFor &&
      !ariaLabel &&
      !ariaLabelledBy &&
      !titleAttr
    ) {
      formInputUnlabeledCount++;
    }
  });

  let imagesEmptyAlt = 0;
  let imagesLazy = 0;
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
    // Count `alt=""` (decorative) separately from missing alt — Screaming
    // Frog distinguishes them in its accessibility filters and so should we.
    if (altAttr !== undefined && (alt === '' || alt === null)) {
      // alt="" specifically; missing-alt is tallied at the DB level via
      // image_usages rows whose alt is null.
      if (altAttr.trim() === '') imagesEmptyAlt++;
    }
    const width = parseIntAttr($(el).attr('width'));
    const height = parseIntAttr($(el).attr('height'));
    const isInternal = isSameHost(pageUrl, normalized, opts);

    // Lazy-loading adoption — `loading="lazy"` is the native browser
    // attribute and the only signal that's reliable without rendering JS.
    if (($(el).attr('loading') ?? '').trim().toLowerCase() === 'lazy') {
      imagesLazy++;
    }

    imageMap.set(normalized, {
      src: normalized,
      alt,
      width,
      height,
      isInternal,
    });
  });

  // OG / Twitter share-card images. They rarely appear inside `<img>`
  // tags so the loop above misses them, but we want them in the probe
  // pipeline so the size-validation issue filters can see whether
  // Facebook/Twitter will refuse to render the card. We stub them as
  // image rows with no alt/dimensions; the existing size-probe pass
  // will fill `byte_size` automatically post-crawl.
  for (const ogish of [ogImage, twitterImage]) {
    if (!ogish) continue;
    const normalized = normalizeUrl(ogish, pageUrl, opts.urlRewrites);
    if (!normalized) continue;
    if (!/^https?:/.test(normalized)) continue;
    if (imageMap.has(normalized)) continue;
    imageMap.set(normalized, {
      src: normalized,
      alt: null,
      width: null,
      height: null,
      isInternal: isSameHost(pageUrl, normalized, opts),
    });
  }

  return {
    title,
    titleCount,
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
    microdataCount,
    rdfaCount,
    insecureFormActionCount,
    missingSriCount,
    renderBlockingCount,
    paginationNext,
    paginationPrev,
    hreflangs,
    amphtml,
    favicon,
    appleTouchIcon,
    manifestUrl,
    feedUrl,
    emptyAnchorCount,
    jsOnlyLinksCount,
    textCodeRatio,
    imagesEmptyAlt,
    imagesLazy,
    formInputCount,
    formInputUnlabeledCount,
    headings,
    mixedContentCount,
    customSearchHits,
    metaRefresh,
    metaRefreshUrl,
    charset,
    extractionResults,
    simhash,
    contentHash,
    analyticsTrackers,
    links: [...linkMap.values()],
    images: [...imageMap.values()],
    hasNoindex,
    hasNofollow,
  };
}

/**
 * Fingerprint scan for ~15 popular analytics / marketing trackers. The
 * detection mixes three signals so we still catch self-hosted / proxied
 * loaders while avoiding scanning the entire HTML repeatedly:
 *
 *  1. `<script src=…>` host or path matches against a known loader URL.
 *  2. Inline `<script>` body matches a init-snippet substring (e.g. `fbq(`).
 *  3. Meta tag presence (e.g. `<meta name="google-site-verification">`).
 *
 * IDs are recovered when the script URL or inline snippet exposes them in
 * a stable position; otherwise the tracker is reported with `id = null`.
 * Each tracker appears at most once in the output, even when multiple
 * loader scripts reference it.
 */
function detectAnalyticsTrackers(
  $: cheerio.CheerioAPI,
  rawHtml: string,
): AnalyticsTracker[] {
  const found = new Map<string, AnalyticsTracker>();
  const add = (name: string, id: string | null = null): void => {
    const existing = found.get(name);
    // Keep the more specific (id-bearing) record if we see the same tracker twice.
    if (!existing || (existing.id === null && id !== null)) {
      found.set(name, { name, id });
    }
  };

  const scriptSrcs: string[] = [];
  $('script[src]').each((_, el) => {
    const src = ($(el).attr('src') ?? '').trim();
    if (src) scriptSrcs.push(src);
  });
  const inlineScripts: string[] = [];
  $('script:not([src])').each((_, el) => {
    const body = $(el).text();
    if (body) inlineScripts.push(body);
  });
  const inlineBlob = inlineScripts.join('\n');

  // Google Tag Manager — `GTM-XXXXX`. The container URL is the canonical
  // signal; inline `dataLayer` push by itself is too broad to use.
  for (const src of scriptSrcs) {
    const m = src.match(/googletagmanager\.com\/gtm\.js\?id=(GTM-[A-Z0-9]+)/i);
    if (m && m[1]) add('Google Tag Manager', m[1].toUpperCase());
  }
  const gtmInline = inlineBlob.match(/GTM-[A-Z0-9]{4,10}/);
  if (gtmInline) add('Google Tag Manager', gtmInline[0].toUpperCase());

  // GA4 — `G-XXXXXXX` measurement ID. Loader is `gtag/js?id=G-…`. Old
  // Universal Analytics IDs (`UA-…`) still exist on legacy sites — surface
  // them as a separate tracker since Google deprecated UA in July 2023.
  for (const src of scriptSrcs) {
    const m = src.match(/gtag\/js\?id=(G-[A-Z0-9]+)/i);
    if (m && m[1]) add('Google Analytics 4', m[1].toUpperCase());
  }
  const ga4Inline = inlineBlob.match(/['"](G-[A-Z0-9]{6,})['"]/);
  if (ga4Inline && ga4Inline[1]) add('Google Analytics 4', ga4Inline[1].toUpperCase());
  const uaInline = inlineBlob.match(/UA-\d{4,10}-\d{1,4}/);
  if (uaInline) add('Google Analytics (UA)', uaInline[0]);

  // Facebook / Meta Pixel — inline `fbq('init', '<id>')`. Loader is
  // `connect.facebook.net/.../fbevents.js`.
  if (
    scriptSrcs.some((s) => /connect\.facebook\.net\/.+\/fbevents\.js/i.test(s)) ||
    /\bfbq\s*\(\s*['"]init['"]/.test(inlineBlob)
  ) {
    const m = inlineBlob.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d{6,})['"]/);
    add('Facebook Pixel', m && m[1] ? m[1] : null);
  }

  // Hotjar — `hjid:<id>` in inline init. Loader: `static.hotjar.com`.
  if (
    scriptSrcs.some((s) => /static\.hotjar\.com/i.test(s)) ||
    /hjid\s*:\s*\d+/.test(inlineBlob)
  ) {
    const m = inlineBlob.match(/hjid\s*:\s*(\d+)/);
    add('Hotjar', m && m[1] ? m[1] : null);
  }

  // Microsoft Clarity — loader `clarity.ms`. ID encoded in inline init.
  if (
    scriptSrcs.some((s) => /clarity\.ms\/tag\//i.test(s)) ||
    /clarity\.ms\/tag\//.test(inlineBlob)
  ) {
    const m = inlineBlob.match(/clarity\.ms\/tag\/([a-z0-9]+)/i);
    add('Microsoft Clarity', m && m[1] ? m[1] : null);
  }

  // Matomo (Piwik) — `_paq.push` is the canonical signal; loader at
  // `matomo.js` / `piwik.js`. Self-hosted, so script src is per-site.
  if (/_paq\s*=\s*window\._paq/.test(inlineBlob) || /_paq\.push/.test(inlineBlob)) {
    const m = inlineBlob.match(/setSiteId['"]?\s*,\s*['"]?(\d+)['"]?/);
    add('Matomo', m && m[1] ? m[1] : null);
  }

  // Adobe Analytics — loader at `omtrdc.net` (collection edge) or hosted
  // `s_code.js`. ID isn't reliably recoverable from the page.
  if (
    scriptSrcs.some((s) => /omtrdc\.net|s_code\.js|adobedtm\.com/i.test(s))
  ) {
    add('Adobe Analytics', null);
  }

  // Mixpanel
  if (
    scriptSrcs.some((s) => /cdn\.mxpnl\.com\/libs\/mixpanel/i.test(s)) ||
    /mixpanel\.init\(/.test(inlineBlob)
  ) {
    const m = inlineBlob.match(/mixpanel\.init\(\s*['"]([a-f0-9]{32})['"]/i);
    add('Mixpanel', m && m[1] ? m[1] : null);
  }

  // Yandex Metrica — `mc.yandex.ru/metrika`. Counter ID is in the loader URL.
  for (const src of scriptSrcs) {
    const m = src.match(/mc\.yandex\.ru\/metrika\/tag\.js/i);
    if (m) {
      const idMatch = inlineBlob.match(/ym\(\s*(\d{4,12})/);
      add('Yandex Metrica', idMatch && idMatch[1] ? idMatch[1] : null);
    }
  }

  // LinkedIn Insight Tag
  if (
    scriptSrcs.some((s) => /snap\.licdn\.com\/li\.lms-analytics/i.test(s)) ||
    /_linkedin_partner_id/.test(inlineBlob)
  ) {
    const m = inlineBlob.match(/_linkedin_partner_id\s*=\s*['"]?(\d+)/);
    add('LinkedIn Insight Tag', m && m[1] ? m[1] : null);
  }

  // Pinterest Tag
  if (
    scriptSrcs.some((s) => /s\.pinimg\.com\/ct\/core\.js/i.test(s)) ||
    /pintrk\(/.test(inlineBlob)
  ) {
    const m = inlineBlob.match(/pintrk\s*\(\s*['"]load['"]\s*,\s*['"](\d+)/);
    add('Pinterest Tag', m && m[1] ? m[1] : null);
  }

  // TikTok Pixel
  if (
    scriptSrcs.some((s) => /analytics\.tiktok\.com\/i18n\/pixel/i.test(s)) ||
    /ttq\.load/.test(inlineBlob)
  ) {
    const m = inlineBlob.match(/ttq\.load\(\s*['"]([A-Z0-9]{15,25})['"]/);
    add('TikTok Pixel', m && m[1] ? m[1] : null);
  }

  // Segment
  if (
    scriptSrcs.some((s) => /cdn\.segment\.com\/analytics\.js/i.test(s)) ||
    /analytics\.load\(/.test(inlineBlob)
  ) {
    add('Segment', null);
  }

  // Plausible (privacy-friendly analytics)
  if (scriptSrcs.some((s) => /plausible\.io\/js\//i.test(s))) {
    add('Plausible Analytics', null);
  }

  // Cloudflare Web Analytics
  if (scriptSrcs.some((s) => /static\.cloudflareinsights\.com\/beacon/i.test(s))) {
    add('Cloudflare Web Analytics', null);
  }

  // Intercom (support / messenger; tracks visitors)
  if (
    scriptSrcs.some((s) => /widget\.intercom\.io\/widget\//i.test(s)) ||
    /Intercom\(['"]boot['"]/.test(inlineBlob)
  ) {
    const m = scriptSrcs
      .map((s) => s.match(/widget\.intercom\.io\/widget\/([a-z0-9]+)/i))
      .find(Boolean);
    add('Intercom', m && m[1] ? m[1] : null);
  }

  // Cheap last-resort tail-scan over the raw HTML for trackers whose only
  // signal is a noscript pixel (e.g. Facebook, LinkedIn fallback). Skipped
  // when the cheerio-based pass already found them.
  if (!found.has('Facebook Pixel') && /facebook\.com\/tr\?id=/.test(rawHtml)) {
    const m = rawHtml.match(/facebook\.com\/tr\?id=(\d+)/);
    add('Facebook Pixel', m && m[1] ? m[1] : null);
  }

  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
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
 * Approximate pixel width of `text` rendered in Arial 18 px (Google SERP
 * title font). Uses a per-character width table derived from canvas
 * measurements — accuracy is ~±2% which is plenty for the usual "is the
 * title going to truncate?" question. Skipping HTML canvas keeps this
 * pure-Node so the same code runs in CLI and tests.
 *
 * Reference truncation thresholds (Google):
 *   - Title: ~600 px before "..." appears
 *   - Meta description: ~990 px (mobile) / ~920 px (desktop)
 */
const ARIAL_18_WIDTHS: Record<string, number> = {
  // Narrow
  i: 5, l: 5, '!': 5, '|': 5, '.': 5, ',': 5, ';': 5, ':': 5, "'": 4, '`': 6,
  // Medium-narrow
  f: 6, j: 5, t: 6, r: 6, ' ': 5,
  // Average lowercase
  a: 10, b: 10, c: 9, d: 10, e: 10, g: 10, h: 10, k: 9, n: 10, o: 10, p: 10,
  q: 10, s: 9, u: 10, v: 9, x: 9, y: 9, z: 9,
  // Wide lowercase
  m: 15, w: 13,
  // Average uppercase
  A: 12, B: 12, C: 13, D: 13, E: 12, F: 11, G: 14, H: 13, I: 5, J: 9,
  K: 12, L: 10, N: 13, O: 14, P: 12, Q: 14, R: 13, S: 12, T: 11, U: 13,
  V: 12, X: 12, Y: 12, Z: 11,
  // Wide uppercase
  M: 15, W: 17,
  // Digits + common punctuation
  '0': 10, '1': 10, '2': 10, '3': 10, '4': 10, '5': 10, '6': 10, '7': 10,
  '8': 10, '9': 10, '-': 6, '_': 10, '/': 5, '?': 10, '(': 6, ')': 6,
  '[': 6, ']': 6, '{': 6, '}': 6, '"': 7, '*': 7, '+': 11, '=': 11, '<': 11, '>': 11,
  '#': 11, '$': 10, '%': 16, '&': 12, '@': 18,
};
const ARIAL_18_DEFAULT = 10;

export function estimatePixelWidth(text: string): number {
  if (!text) return 0;
  let total = 0;
  for (const ch of text) {
    total += ARIAL_18_WIDTHS[ch] ?? ARIAL_18_DEFAULT;
  }
  return total;
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
