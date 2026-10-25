import {
  ISSUE_GROUPS,
  ISSUE_SEVERITY,
  type IssueCountKey,
  type IssueSeverity,
  type OverviewCounts,
  type UrlCategory,
} from '@freecrawl/shared-types';

/**
 * Every issue check with affected URLs, in the shape the reports share:
 * the HTML / PDF report (summary table, recommendations, per-issue
 * sections) and the Issues export (overview sheet + one sheet per issue).
 * Built from the sidebar's issue catalog, so a new check reaches every
 * report without a second list to maintain.
 */
export interface IssueSummary {
  category: UrlCategory;
  /** Sidebar group and check label: `Page Titles: Missing`. */
  title: string;
  severity: IssueSeverity;
  count: number;
  /** One-line, action-oriented advice. */
  advice: string;
}

const SEVERITY_RANK: Record<IssueSeverity, number> = { critical: 0, warning: 1, info: 2 };

/** Report copy for a severity tier: `Critical` / `Warning` / `Info`. */
export const SEVERITY_LABEL: Record<IssueSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
};

/**
 * Non-zero issues ranked critical → warning → info, larger counts first
 * within a tier (catalog order breaks ties). Disabled checks already read
 * 0 in `counts`. Composite checks (Broken (All)) are skipped: they only
 * sum siblings that are listed on their own.
 */
export function summarizeIssues(counts: OverviewCounts): IssueSummary[] {
  const out: IssueSummary[] = [];
  for (const group of ISSUE_GROUPS) {
    for (const item of group.items) {
      if (typeof item.count !== 'string') continue;
      const count = counts.issues[item.count];
      if (count == null || !(count > 0)) continue;
      const severity = ISSUE_SEVERITY[item.category] ?? 'info';
      out.push({
        category: item.category,
        title: `${group.label}: ${item.label}`,
        severity,
        count,
        advice: ISSUE_ADVICE[item.count] ?? SEVERITY_FALLBACK[severity],
      });
    }
  }
  return out.sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.count - a.count,
  );
}

/**
 * One line of advice per check. Report copy stays English (the files are
 * shared and machine-read); a check without a tailored line falls back to
 * its severity's generic advice.
 */
const ISSUE_ADVICE: Partial<Record<IssueCountKey, string>> = {
  titleMissing: 'Write a unique, descriptive <title> (50–60 characters) for every page; it is the strongest on-page ranking and click-through signal.',
  titleDuplicate: 'Give each page its own title — duplicates make search engines pick one page and suppress the rest.',
  titleTooLong: 'Trim titles to about 60 characters so they are not truncated in results; front-load the primary keyword.',
  titleTooShort: 'Expand titles below 30 characters with the page topic and brand so they describe the page.',
  titlePlaceholder: 'Replace placeholder titles ("Untitled", "Home") with real page titles.',
  titleMultiple: 'Keep exactly one <title> element per page; search engines use only one and may pick the wrong one.',
  titlePixelWidthTooLong: 'Shorten titles wider than about 600 px so they are not truncated in search results.',
  titleSingleWord: 'Expand single-word titles into a descriptive phrase with the page topic and brand.',
  metaMissing: 'Add a meta description (120–160 characters) that summarises the page and invites the click.',
  metaDuplicate: 'Write page-specific meta descriptions; duplicated snippets lower click-through and get rewritten by Google.',
  metaTooLong: 'Shorten meta descriptions to about 160 characters so the snippet is not cut off.',
  metaTooShort: 'Extend meta descriptions below 120 characters to make full use of the snippet.',
  metaPixelWidthTooLong: 'Shorten meta descriptions wider than about 990 px so the snippet is not truncated.',
  descriptionEqualsTitle: 'Write a meta description that adds to the title instead of repeating it.',
  descriptionEqualsH1: 'Write a meta description that summarises the page instead of repeating the H1.',
  h1Missing: 'Add a single H1 that states the page topic; screen readers and crawlers use it as the page headline.',
  h1Duplicate: 'Make H1s unique per page so each page targets its own topic.',
  h1Multiple: 'Keep one H1 per page and demote the rest to H2/H3.',
  h1Empty: 'Fill empty H1 elements with the page headline, or remove them.',
  h1TooLong: 'Keep H1s under about 70 characters so they read as a clear headline.',
  h1EqualsTitle: 'Consider varying the H1 and the title to cover related phrasing; identical text is allowed but wastes an opportunity.',
  headingSkippedLevel: 'Restore the heading hierarchy (H1 → H2 → H3) — skipped levels hurt accessibility and outline parsing.',
  multipleCanonicals: 'Leave exactly one canonical tag per page; conflicting canonicals are ignored by Google.',
  canonicalMissing: 'Add a self-referencing canonical to indexable pages to consolidate parameter and duplicate variants.',
  canonicalToNon200: 'Point canonicals at live 200 pages; a canonical to an error page is discarded.',
  canonicalToRedirect: 'Canonicalise directly to the final URL instead of a redirecting one.',
  canonicalToNoindex: 'Never canonicalise to a noindex page — the signals contradict each other.',
  canonicalMismatch: 'Align HTML and HTTP canonicals so they name the same URL.',
  canonicalConflicting: 'Remove the conflicting canonical tags so each page names one canonical URL; search engines ignore conflicting ones.',
  canonicalConflictNearDuplicate: 'Near-duplicate pages declare different canonicals; pick one preferred URL and canonicalise the others to it.',
  canonicalChainMultiHop: 'Point canonicals straight at the final canonical URL, not at a page that canonicalises elsewhere.',
  canonicalCrossDomain: 'Confirm cross-domain canonicals are intentional (syndicated content); otherwise point them at this site\'s own URL.',
  canonicalNonSelf: 'Check that pages canonicalised to another URL really are duplicates, and link internally to the canonical URL.',
  canonicalNotAbsolute: 'Use absolute URLs (protocol and host included) in canonical tags so they cannot resolve to the wrong address.',
  canonicalSelfReferencing: 'No action needed — a self-referencing canonical is the recommended setup for indexable pages.',
  noindexCanonicalConflict: 'Pick one signal: either noindex the page or canonicalise it to another URL, not both.',
  redirectCanonicalChain: 'Make redirect targets self-canonical, or redirect straight to the canonical URL.',
  redirectToNoindex: 'Do not redirect to noindex pages; redirect to an indexable equivalent or return 404/410.',
  contentThin: 'Expand thin pages with substantive content or consolidate them into stronger pages.',
  pageEmpty: 'Add real content to near-empty pages, or remove or noindex them.',
  textCodeRatioLow: 'Raise the share of visible text against markup: trim inline scripts and styles, add substantive content.',
  fleschVeryDifficult: 'Simplify very hard-to-read copy: shorter sentences, common words, clear structure.',
  gunningFogVeryHigh: 'Shorten sentences and replace complex words; a Gunning Fog index above 17 reads like a graduate-level text.',
  spellingGrammar: 'Correct the spelling and grammar issues listed in the Spelling tab.',
  nearDuplicate: 'Merge or differentiate near-duplicate pages, or canonicalise them to the preferred version.',
  duplicateContentExact: 'Serve exact-duplicate pages from one URL and redirect or canonicalise the others.',
  duplicateUrlPostNorm: 'Link to one consistent URL form (case, trailing slash, parameters) and redirect or canonicalise the variants.',
  responseSlow: 'Bring server response time under 1 s: cache HTML, tune the database, use a CDN.',
  responseVerySlow: 'Investigate pages over 3 s first — they hurt crawl budget and Core Web Vitals most.',
  ttfbSlow: 'Reduce time-to-first-byte with server-side caching and faster hosting.',
  ttfbVerySlow: 'TTFB above 1.8 s fails Core Web Vitals; profile the backend and add edge caching.',
  pageLarge: 'Cut page weight: compress images, defer non-critical scripts, remove unused CSS.',
  pageTooLargeCritical: 'Pages over 3 MB load slowly on mobile; remove heavy assets and split oversized pages.',
  pageManyRequests: 'Cut the number of subresources below 100: bundle scripts and styles, inline or sprite small images.',
  overBudget: 'Bring these pages back under the performance budget set in Settings: lighter assets, fewer requests, faster responses.',
  renderBlocking: 'Defer or async non-critical scripts and inline critical CSS to unblock rendering.',
  renderBlockingCritical: 'More than 20 render-blocking head resources delay first paint badly; defer, async or inline them.',
  keepaliveDisabled: 'Enable HTTP keep-alive so browsers reuse connections.',
  compressionMissing: 'Enable gzip or Brotli compression for text responses.',
  http2NotSupported: 'Enable HTTP/2 (or HTTP/3) on the server for multiplexed, faster page loads.',
  http3NotSupported: 'Optional: enable HTTP/3 (QUIC) on the server or CDN to cut connection setup time.',
  urlTooLong: 'Shorten URLs; keep them readable and under ~100 characters where possible.',
  urlManyParams: 'Reduce query parameters and canonicalise parameterised variants to a clean URL.',
  queryStringTooLong: 'Shorten long query strings; give content that should be indexed a clean path.',
  urlFragment: 'Serve distinct content on distinct paths; search engines ignore everything after #.',
  urlSpaces: 'Replace spaces in URLs with hyphens; encoded spaces (%20) break when URLs are copied or shared.',
  urlMalformed: 'Fix malformed link URLs (invalid characters, broken encoding) so they resolve consistently.',
  urlMultipleSlashes: 'Remove repeated slashes from URLs and redirect the variants to the clean form.',
  urlNonAscii: 'Make sure non-ASCII URLs are linked consistently percent-encoded, or transliterate them.',
  urlUnderscore: 'Prefer hyphens over underscores as word separators in URLs.',
  urlUppercase: 'Use lowercase URLs and redirect uppercase variants so the same page is not reachable twice.',
  folderDepthTooDeep: 'Flatten deep folder structures so important pages sit closer to the root.',
  crawlTrap: 'Stop generating endless URL variants (calendars, repeated path segments, session IDs, facets) or block them in robots.txt.',
  redirectLoop: 'Break redirect loops — they return no content and waste crawl budget.',
  redirectChainLong: 'Collapse redirect chains so every link points straight to the final URL.',
  redirectChain: 'Point links and redirects straight at the final URL.',
  redirectSelf: 'Fix URLs that redirect to themselves; they never resolve.',
  metaRefreshUsed: 'Replace meta refresh with a server-side 301 redirect.',
  soft404: 'Return 404/410 for pages that no longer exist instead of a 200 "not found" page.',
  blockedByRobots: 'Unblock the URL in robots.txt or stop linking to it internally.',
  httpNotHttps: 'Serve these pages over HTTPS and 301-redirect the HTTP versions.',
  mixedContent: 'Load every sub-resource over HTTPS to remove "Not Secure" warnings.',
  mixedContentActive: 'Load scripts, stylesheets and iframes over HTTPS — browsers block active mixed content outright.',
  mixedContentPassive: 'Load images, audio and video over HTTPS to remove the mixed-content warning.',
  insecureFormAction: 'Submit forms over HTTPS; an HTTP action leaks form data.',
  missingSri: 'Add integrity attributes to third-party scripts and stylesheets.',
  cspMissing: 'Add a Content-Security-Policy header to mitigate XSS and injection.',
  hstsMissing: 'Send Strict-Transport-Security on HTTPS pages so browsers never downgrade to HTTP.',
  hstsMaxAgeShort: 'Raise the HSTS max-age to at least one year (31536000 seconds).',
  hstsNoIncludeSubdomains: 'Add includeSubDomains to the HSTS header once every subdomain serves HTTPS.',
  hstsNoPreload: 'Add the preload directive and submit the domain to the HSTS preload list once all subdomains are HTTPS-only.',
  xFrameOptionsMissing: 'Send X-Frame-Options (or CSP frame-ancestors) to prevent clickjacking.',
  xContentTypeOptionsMissing: 'Send X-Content-Type-Options: nosniff.',
  corsWildcardOrigin: 'Replace Access-Control-Allow-Origin: * with an allow-list of trusted origins on responses that carry private data.',
  corsWildcardWithCredentials: 'Browsers reject a wildcard origin with credentials, so these requests fail; allow-list specific origins instead.',
  cookieNoSecure: 'Set the Secure flag on cookies served over HTTPS.',
  cookieNoHttpOnly: 'Set HttpOnly on session cookies so scripts cannot read them.',
  cookieNoSameSite: 'Set SameSite on cookies to limit cross-site requests.',
  sslCertExpired: 'Renew the expired TLS certificate now — browsers block the site with a security warning.',
  sslCertExpiringSoon: 'Renew the TLS certificate before it expires, or automate renewal.',
  sslProtocolOld: 'Disable TLS 1.0 and 1.1 on the server and keep TLS 1.2 and 1.3.',
  sslSignatureWeak: 'Reissue the certificate with a SHA-256 (or stronger) signature; SHA-1 and MD5 are broken.',
  viewportMissing: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile rendering.',
  contentWiderThanScreen: 'Fix elements wider than the mobile viewport (fixed widths, large images, tables) so pages do not scroll sideways.',
  mobileParityMismatch: 'Serve the same main content, links and metadata to mobile and desktop — Google indexes the mobile version.',
  tapTargetsTooSmall: 'Make buttons and links at least 24×24 px, or space them apart, so they are easy to tap.',
  fontTooSmall: 'Use body text of at least 12 px (16 px recommended) so pages are readable on mobile without zooming.',
  langMissing: 'Set the html lang attribute so browsers, screen readers and search engines know the page language.',
  langContentMismatch: 'Set html[lang] to the language the page is actually written in.',
  lowContrastText: 'Raise text contrast to at least 4.5:1 (3:1 for large text) to meet WCAG AA.',
  focusOutlineSuppressed: 'Restore a visible focus indicator (for example a :focus-visible style) so keyboard users can see where they are.',
  formInputUnlabeled: 'Give every form input a <label> or aria-label so screen-reader users know what to enter.',
  ariaInvalidRole: 'Use only valid WAI-ARIA role values; assistive technologies ignore unknown roles.',
  landmarkMainMissing: 'Wrap the primary content in a <main> element so assistive technology can jump straight to it.',
  skipLinkMissing: 'Add a "Skip to content" link as the first focusable element for keyboard users.',
  ogMissing: 'Add Open Graph title, description and image so shares render a rich preview.',
  ogImageNotAbsolute: 'Use an absolute URL in og:image; social platforms do not resolve relative paths.',
  ogImageTooLarge: 'Keep og:image files under 5 MB, or social platforms will not show the preview.',
  ogImageWrongAspect: 'Use a 1.91:1 og:image (for example 1200×630) so the preview is not cropped.',
  twitterMissing: 'Add Twitter Card tags (card type + image) for X/Twitter previews.',
  twitterImageNotAbsolute: 'Use an absolute URL in twitter:image.',
  twitterImageTooLarge: 'Keep twitter:image files under 5 MB so the card renders.',
  twitterImageWrongAspect: 'Match the twitter:image aspect ratio to the card type: 2:1 for summary_large_image, 1:1 for summary.',
  structuredDataMissing: 'Add JSON-LD structured data for the page type to qualify for rich results.',
  structuredDataInvalid: 'Fix JSON-LD syntax errors; invalid blocks are ignored entirely.',
  schemaDuplicateId: 'Give each structured-data entity its own @id; reuse an @id only to reference the same entity.',
  schemaUnknownType: 'Use valid Schema.org type names (PascalCase, for example "Product") in @type.',
  schemaMissingRequired: 'Add the required properties for the schema type; without them the page cannot get the rich result.',
  schemaMissingRecommended: 'Add the recommended properties for the schema type to strengthen rich-result eligibility.',
  ampValidationErrors: 'Fix AMP validation errors or the AMP version will not be served.',
  paginationBroken: 'Point rel=next / rel=prev at live pages in the sequence.',
  paginationSequenceBreak: 'Fix the gaps in the pagination numbering so every page of the series is linked.',
  paginationCanonicalConflict: 'Let paginated pages canonicalise to themselves, not to page 1, so items on later pages stay indexable.',
  hreflangXDefaultMissing: 'Add an x-default hreflang for visitors who match no listed language.',
  hreflangInvalidCode: 'Use valid ISO 639-1 language (and optional ISO 3166-1 region) codes in hreflang.',
  hreflangSelfRefMissing: 'Include a self-referencing hreflang on every page in the cluster.',
  hreflangReciprocityMissing: 'Make hreflang annotations reciprocal — every target must link back.',
  hreflangTargetIssues: 'Point hreflang at live, indexable, self-canonical pages.',
  hreflangInconsistentLang: 'List one URL per language-region code in each cluster; remove the duplicate hreflang entries.',
  hreflangUnlinked: 'Link to these language versions from the site as well; an hreflang annotation should not be their only way in.',
  canonicalOutsideHead: 'Move rel=canonical into <head>; search engines ignore it in <body>.',
  hreflangOutsideHead: 'Move hreflang <link> tags into <head>; search engines ignore them in <body>.',
  charsetMissing: 'Declare the character encoding (meta charset or Content-Type header).',
  charsetMismatch: 'Make the Content-Type header charset match the meta charset — browsers obey the header.',
  faviconMissing: 'Add a favicon; it appears next to the site in mobile results.',
  appleTouchIconMissing: 'Add an apple-touch-icon so iOS shows a proper icon when the site is saved to the home screen.',
  manifestMissing: 'Add a web app manifest if the site should be installable or show a branded mobile experience.',
  feedMissing: 'Publish an RSS or Atom feed for content sections so readers and aggregators can follow updates.',
  nonIndexableInSitemap: 'Remove noindex / canonicalised URLs from the XML sitemap.',
  non200InSitemap: 'Remove error and redirecting URLs from the XML sitemap.',
  redirectInSitemap: 'List final URLs in the sitemap, not redirecting ones.',
  crawledNotInSitemap: 'Add indexable pages missing from the sitemap so they are discovered promptly.',
  noindexJsInjected: 'Put noindex in the served HTML or X-Robots-Tag; Google may index before rendering.',
  titleChangedByJs: 'Serve the final <title> in the HTML instead of rewriting it with JavaScript.',
  jsOnlyNavigation: 'Use real <a href> links for navigation; links that only work through JavaScript may not be crawled.',
  imageMissingAlt: 'Add descriptive alt text to content images (empty alt for decorative ones).',
  imageEmptyAlt: 'Confirm images with empty alt are decorative; give meaningful images real alt text.',
  imageDuplicateAlt: 'Vary alt text so different images are not described identically.',
  imagesNoLazyLoading: 'Add loading="lazy" to below-the-fold images to speed up the initial page load.',
  imagesNoResponsive: 'Serve responsive images with srcset/sizes or <picture> so small screens download smaller files.',
  imageBrokenSrc: 'Fix or remove image references that return 4xx/5xx errors.',
  imageSlowLoading: 'Compress images over 200 KB, or lazy-load them when they are below the fold.',
  imageTooLarge: 'Compress internal images over 100 KB and serve modern formats (WebP/AVIF) at the displayed size.',
  orphanPage: 'Link to orphan pages from relevant pages or the navigation, or remove them if they are no longer needed.',
  brokenLinksInternal: 'Fix or remove internal links to 4xx/5xx pages.',
  brokenLinksExternal: 'Update or remove external links to dead pages.',
  linkEmptyAnchor: 'Give links descriptive anchor text (or alt text on image links).',
  anchorTextTooLong: 'Shorten anchor texts over 100 characters to a concise description of the target page.',
  anchorTextGeneric: 'Replace generic anchors like "click here" or "read more" with text that describes the target page.',
  targetBlankNoNoopener: 'Add rel="noopener" to links that open in a new tab.',
  externalLinksTooMany: 'Prune pages with over 100 external links, and mark paid or user-generated links rel="sponsored" / "ugc".',
  linksPerPageTooMany: 'Reduce pages with more than 100 links so the important links keep their weight.',
  outlinksZero: 'Add links from dead-end pages to related content so users and crawlers can continue.',
  internalLinkToRedirect: 'Update internal links to point at the final URL instead of a redirect.',
  deadExternalDomain: 'Remove or replace links to external domains that no longer resolve.',
  highBoilerplate: 'Increase unique main content relative to navigation and footer boilerplate.',
  analyticsMissing: 'Add your analytics tag to these pages, or they stay invisible in your traffic reports.',
  analyticsMultipleGa4: 'Check pages that load several GA4 measurement IDs; unintended extra tags split or inflate your traffic data.',
  analyticsUaLegacy: 'Universal Analytics stopped processing data in July 2023; move these pages to GA4.',
  analyticsPixelWithoutPolicy: 'Pages load an advertising pixel without a Permissions-Policy header; add one to limit what third-party scripts may use.',
};

const SEVERITY_FALLBACK: Record<IssueSeverity, string> = {
  critical: 'Fix these pages first — this check marks a problem that blocks indexing or breaks the user experience.',
  warning: 'Review and correct where practical; this weakens rankings or usability without blocking them.',
  info: 'Informational — worth tidying when the affected template is next touched.',
};
