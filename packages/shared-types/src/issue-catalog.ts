import type { OverviewCounts, UrlCategory } from './crawl.js';

/** A field of `OverviewCounts.issues` — the sidebar counter behind one check. */
export type IssueCountKey = keyof OverviewCounts['issues'];

/** One issue check: its sidebar label, filter category and counter. */
export interface IssueCheckDef {
  /** Stable sidebar node id (`issues-title-missing`). */
  key: string;
  /** English label; the renderer translates it through `translateLabel`. */
  label: string;
  /** The `issues:*` filter category the check flags URLs into. */
  category: UrlCategory;
  /**
   * The `OverviewCounts.issues` field that counts it. A tuple sums several
   * fields (Broken Links (All) = internal + external); such a composite
   * check is hidden and its filter emptied when disabled, but the summed
   * counters stay live because sibling checks own them.
   */
  count: IssueCountKey | readonly IssueCountKey[];
  /** Denominator for the sidebar percentage; `images` = total image count. */
  percentBase?: 'images';
}

/** A sidebar group (Page Titles, Meta Descriptions, …) and its checks. */
export interface IssueGroupDef {
  key: string;
  label: string;
  items: readonly IssueCheckDef[];
}

/**
 * The issue-check catalog: every check the Overview Sidebar lists, in
 * sidebar order. Single source for the sidebar tree, the Settings →
 * Issues toggles and the category → counter mapping the database uses
 * to silence disabled checks. Keep new checks here, not in the sidebar.
 */
export const ISSUE_GROUPS: readonly IssueGroupDef[] = [
  {
    key: 'issues-title',
    label: 'Page Titles',
    items: [
      { key: 'issues-title-missing', label: 'Missing', category: 'issues:title-missing', count: 'titleMissing' },
      { key: 'issues-title-too-long', label: 'Over 60 Characters', category: 'issues:title-too-long', count: 'titleTooLong' },
      { key: 'issues-title-too-short', label: 'Below 30 Characters', category: 'issues:title-too-short', count: 'titleTooShort' },
      { key: 'issues-title-duplicate', label: 'Duplicate', category: 'issues:title-duplicate', count: 'titleDuplicate' },
      { key: 'issues-title-multiple', label: 'Multiple <title> Tags', category: 'issues:title-multiple', count: 'titleMultiple' },
      { key: 'issues-title-pixel-width', label: 'Pixel Width Truncated (>600px)', category: 'issues:title-pixel-width-too-long', count: 'titlePixelWidthTooLong' },
      { key: 'issues-title-placeholder', label: 'Placeholder Title', category: 'issues:title-placeholder', count: 'titlePlaceholder' },
      { key: 'issues-title-single-word', label: 'Single-Word Title', category: 'issues:title-single-word', count: 'titleSingleWord' },
    ],
  },
  {
    key: 'issues-meta',
    label: 'Meta Descriptions',
    items: [
      { key: 'issues-meta-missing', label: 'Missing', category: 'issues:meta-missing', count: 'metaMissing' },
      { key: 'issues-meta-too-long', label: 'Over 160 Characters', category: 'issues:meta-too-long', count: 'metaTooLong' },
      { key: 'issues-meta-too-short', label: 'Below 120 Characters', category: 'issues:meta-too-short', count: 'metaTooShort' },
      { key: 'issues-meta-duplicate', label: 'Duplicate', category: 'issues:meta-duplicate', count: 'metaDuplicate' },
      { key: 'issues-meta-pixel-width', label: 'Pixel Width Truncated (>990px)', category: 'issues:meta-pixel-width-too-long', count: 'metaPixelWidthTooLong' },
      { key: 'issues-description-equals-title', label: 'Description = Title', category: 'issues:description-equals-title', count: 'descriptionEqualsTitle' },
      { key: 'issues-description-equals-h1', label: 'Description = H1', category: 'issues:description-equals-h1', count: 'descriptionEqualsH1' },
    ],
  },
  {
    key: 'issues-h1',
    label: 'H1',
    items: [
      { key: 'issues-h1-missing', label: 'Missing', category: 'issues:h1-missing', count: 'h1Missing' },
      { key: 'issues-h1-duplicate', label: 'Duplicate', category: 'issues:h1-duplicate', count: 'h1Duplicate' },
      { key: 'issues-h1-multiple', label: 'Multiple', category: 'issues:h1-multiple', count: 'h1Multiple' },
      { key: 'issues-h1-empty', label: 'Empty', category: 'issues:h1-empty', count: 'h1Empty' },
      { key: 'issues-h1-too-long', label: 'Over 70 Characters', category: 'issues:h1-too-long', count: 'h1TooLong' },
      { key: 'issues-heading-skipped', label: 'Skipped Heading Level', category: 'issues:heading-skipped-level', count: 'headingSkippedLevel' },
      { key: 'issues-h1-equals-title', label: 'H1 = Title', category: 'issues:h1-equals-title', count: 'h1EqualsTitle' },
    ],
  },
  {
    key: 'issues-canonicals',
    label: 'Canonicals',
    items: [
      { key: 'issues-canonicals-missing', label: 'Canonical Missing', category: 'issues:canonical-missing', count: 'canonicalMissing' },
      { key: 'issues-canonicals-self', label: 'Self-Referencing', category: 'issues:canonical-self-referencing', count: 'canonicalSelfReferencing' },
      { key: 'issues-canonicals-non-self', label: 'Canonicalised (→ other)', category: 'issues:canonical-non-self', count: 'canonicalNonSelf' },
      { key: 'issues-canonicals-mismatch', label: 'HTTP vs HTML Mismatch', category: 'issues:canonical-mismatch', count: 'canonicalMismatch' },
      { key: 'issues-canonicals-multiple', label: 'Multiple Canonicals', category: 'issues:multiple-canonicals', count: 'multipleCanonicals' },
      { key: 'issues-canonicals-conflicting', label: 'Conflicting Canonicals', category: 'issues:canonical-conflicting', count: 'canonicalConflicting' },
      { key: 'issues-canonicals-cross-domain', label: 'Canonical → Cross-Domain', category: 'issues:canonical-cross-domain', count: 'canonicalCrossDomain' },
      { key: 'issues-canonicals-noindex-conflict', label: 'Noindex + Canonical Conflict', category: 'issues:noindex-canonical-conflict', count: 'noindexCanonicalConflict' },
      { key: 'issues-canonicals-non-200', label: 'Canonical → Non-200', category: 'issues:canonical-to-non-200', count: 'canonicalToNon200' },
      { key: 'issues-canonicals-redirect', label: 'Canonical → Redirect', category: 'issues:canonical-to-redirect', count: 'canonicalToRedirect' },
      { key: 'issues-canonicals-noindex', label: 'Canonical → Noindex', category: 'issues:canonical-to-noindex', count: 'canonicalToNoindex' },
      { key: 'issues-canonical-not-absolute', label: 'Canonical Not Absolute', category: 'issues:canonical-not-absolute', count: 'canonicalNotAbsolute' },
      { key: 'issues-canonical-chain-multi-hop', label: 'Canonical Chain (Multi-hop)', category: 'issues:canonical-chain-multi-hop', count: 'canonicalChainMultiHop' },
      { key: 'issues-canonical-conflict-near-duplicate', label: 'Canonical Conflict (Near-Duplicate)', category: 'issues:canonical-conflict-near-duplicate', count: 'canonicalConflictNearDuplicate' },
    ],
  },
  {
    key: 'issues-content',
    label: 'Content',
    items: [
      { key: 'issues-content-thin', label: 'Thin Content (<300 words)', category: 'issues:content-thin', count: 'contentThin' },
      { key: 'issues-spelling-grammar', label: 'Spelling/Grammar Issues', category: 'issues:spelling-grammar', count: 'spellingGrammar' },
      { key: 'issues-page-empty', label: 'Empty Page (<30 words)', category: 'issues:page-empty', count: 'pageEmpty' },
      { key: 'issues-high-boilerplate', label: 'High Boilerplate (>50%)', category: 'issues:high-boilerplate', count: 'highBoilerplate' },
      { key: 'issues-near-duplicate', label: 'Near-Duplicate Content', category: 'issues:near-duplicate', count: 'nearDuplicate' },
      { key: 'issues-duplicate-content-exact', label: 'Duplicate Content (exact)', category: 'issues:duplicate-content-exact', count: 'duplicateContentExact' },
      { key: 'issues-flesch-very-difficult', label: 'Hard to Read (Flesch <30)', category: 'issues:flesch-very-difficult', count: 'fleschVeryDifficult' },
      { key: 'issues-gunning-fog-very-high', label: 'Gunning Fog >17', category: 'issues:gunning-fog-very-high', count: 'gunningFogVeryHigh' },
    ],
  },
  {
    key: 'issues-response',
    label: 'Response',
    items: [
      { key: 'issues-response-slow', label: 'Slow (>1s)', category: 'issues:response-slow', count: 'responseSlow' },
      { key: 'issues-response-very-slow', label: 'Very Slow (>3s)', category: 'issues:response-very-slow', count: 'responseVerySlow' },
      { key: 'issues-ttfb-slow', label: 'TTFB Slow (>600ms)', category: 'issues:ttfb-slow', count: 'ttfbSlow' },
      { key: 'issues-ttfb-very-slow', label: 'TTFB Very Slow (>1.8s)', category: 'issues:ttfb-very-slow', count: 'ttfbVerySlow' },
      { key: 'issues-over-budget', label: 'Over Performance Budget', category: 'issues:over-budget', count: 'overBudget' },
    ],
  },
  {
    key: 'issues-cookies',
    label: 'Cookies',
    items: [
      { key: 'issues-cookies-no-secure', label: 'Missing Secure (HTTPS)', category: 'issues:cookie-no-secure', count: 'cookieNoSecure' },
      { key: 'issues-cookies-no-httponly', label: 'Missing HttpOnly', category: 'issues:cookie-no-httponly', count: 'cookieNoHttpOnly' },
      { key: 'issues-cookies-no-samesite', label: 'Missing SameSite', category: 'issues:cookie-no-samesite', count: 'cookieNoSameSite' },
    ],
  },
  {
    key: 'issues-page',
    label: 'Page',
    items: [
      { key: 'issues-page-large', label: 'Large (>1MB)', category: 'issues:page-large', count: 'pageLarge' },
      { key: 'issues-page-too-large-critical', label: 'Critical Size (>3MB)', category: 'issues:page-too-large-critical', count: 'pageTooLargeCritical' },
    ],
  },
  {
    key: 'issues-document',
    label: 'Document',
    items: [
      { key: 'issues-meta-refresh', label: 'Meta Refresh Used', category: 'issues:meta-refresh-used', count: 'metaRefreshUsed' },
      { key: 'issues-charset-missing', label: 'Charset Missing', category: 'issues:charset-missing', count: 'charsetMissing' },
      { key: 'issues-amp-validation', label: 'AMP Validation Errors', category: 'issues:amp-validation-errors', count: 'ampValidationErrors' },
    ],
  },
  {
    key: 'issues-url',
    label: 'URL',
    items: [
      { key: 'issues-url-too-long', label: 'Too Long (>2048 chars)', category: 'issues:url-too-long', count: 'urlTooLong' },
      { key: 'issues-url-uppercase', label: 'Contains Uppercase', category: 'issues:url-uppercase', count: 'urlUppercase' },
      { key: 'issues-url-underscore', label: 'Contains Underscore', category: 'issues:url-underscore', count: 'urlUnderscore' },
      { key: 'issues-url-multiple-slashes', label: 'Multiple Slashes', category: 'issues:url-multiple-slashes', count: 'urlMultipleSlashes' },
      { key: 'issues-url-non-ascii', label: 'Non-ASCII Characters', category: 'issues:url-non-ascii', count: 'urlNonAscii' },
      { key: 'issues-url-many-params', label: 'Many Query Params (>5)', category: 'issues:url-many-params', count: 'urlManyParams' },
      { key: 'issues-url-fragment', label: 'Fragment (#) in URL', category: 'issues:url-fragment', count: 'urlFragment' },
      { key: 'issues-url-spaces', label: 'Spaces in URL', category: 'issues:url-spaces', count: 'urlSpaces' },
      { key: 'issues-url-malformed', label: 'Malformed URL', category: 'issues:url-malformed', count: 'urlMalformed' },
      { key: 'issues-url-crawl-trap', label: 'Crawl Trap', category: 'issues:crawl-trap', count: 'crawlTrap' },
      { key: 'issues-url-query-too-long', label: 'Long Query String (>100 chars)', category: 'issues:query-string-too-long', count: 'queryStringTooLong' },
      { key: 'issues-url-folder-too-deep', label: 'Folder Depth >4', category: 'issues:folder-depth-too-deep', count: 'folderDepthTooDeep' },
      { key: 'issues-duplicate-url-post-norm', label: 'Duplicate URL (post-norm)', category: 'issues:duplicate-url-post-norm', count: 'duplicateUrlPostNorm' },
    ],
  },
  {
    key: 'issues-accessibility',
    label: 'Accessibility',
    items: [
      { key: 'issues-lang-missing', label: 'Lang Attribute Missing', category: 'issues:lang-missing', count: 'langMissing' },
      { key: 'issues-form-input-unlabeled', label: 'Form Inputs Missing Label', category: 'issues:form-input-unlabeled', count: 'formInputUnlabeled' },
      { key: 'issues-landmark-main-missing', label: 'Main Landmark Missing', category: 'issues:landmark-main-missing', count: 'landmarkMainMissing' },
      { key: 'issues-skip-link-missing', label: 'Skip Link Missing', category: 'issues:skip-link-missing', count: 'skipLinkMissing' },
      { key: 'issues-aria-invalid-role', label: 'Invalid ARIA Role', category: 'issues:aria-invalid-role', count: 'ariaInvalidRole' },
      { key: 'issues-low-contrast-text', label: 'Low Contrast Text', category: 'issues:low-contrast-text', count: 'lowContrastText' },
      { key: 'issues-focus-outline-suppressed', label: 'Focus Outline Suppressed', category: 'issues:focus-outline-suppressed', count: 'focusOutlineSuppressed' },
      { key: 'issues-font-too-small', label: 'Font Size Too Small', category: 'issues:font-too-small', count: 'fontTooSmall' },
      { key: 'issues-tap-targets-too-small', label: 'Tap Target Too Small', category: 'issues:tap-targets-too-small', count: 'tapTargetsTooSmall' },
    ],
  },
  {
    key: 'issues-mobile',
    label: 'Mobile',
    items: [
      { key: 'issues-viewport-missing', label: 'Viewport Meta Missing', category: 'issues:viewport-missing', count: 'viewportMissing' },
      { key: 'issues-mobile-parity', label: 'Mobile / Desktop Mismatch', category: 'issues:mobile-parity-mismatch', count: 'mobileParityMismatch' },
      { key: 'issues-content-wider-than-screen', label: 'Content Wider Than Screen', category: 'issues:content-wider-than-screen', count: 'contentWiderThanScreen' },
    ],
  },
  {
    key: 'issues-social',
    label: 'Social',
    items: [
      { key: 'issues-og-missing', label: 'OpenGraph Tags Missing', category: 'issues:og-missing', count: 'ogMissing' },
      { key: 'issues-twitter-missing', label: 'Twitter Card Missing', category: 'issues:twitter-missing', count: 'twitterMissing' },
      { key: 'issues-og-image-not-absolute', label: 'OG Image Not Absolute', category: 'issues:og-image-not-absolute', count: 'ogImageNotAbsolute' },
      { key: 'issues-twitter-image-not-absolute', label: 'Twitter Image Not Absolute', category: 'issues:twitter-image-not-absolute', count: 'twitterImageNotAbsolute' },
      { key: 'issues-og-image-too-large', label: 'OG Image >5MB', category: 'issues:og-image-too-large', count: 'ogImageTooLarge' },
      { key: 'issues-twitter-image-too-large', label: 'Twitter Image >5MB', category: 'issues:twitter-image-too-large', count: 'twitterImageTooLarge' },
      { key: 'issues-og-image-wrong-aspect', label: 'OG Image Wrong Aspect Ratio', category: 'issues:og-image-wrong-aspect', count: 'ogImageWrongAspect' },
      { key: 'issues-twitter-image-wrong-aspect', label: 'Twitter Image Wrong Aspect Ratio', category: 'issues:twitter-image-wrong-aspect', count: 'twitterImageWrongAspect' },
    ],
  },
  {
    key: 'issues-security-headers',
    label: 'Security Headers',
    items: [
      { key: 'issues-hsts-missing', label: 'HSTS Missing', category: 'issues:hsts-missing', count: 'hstsMissing' },
      { key: 'issues-hsts-no-preload', label: 'HSTS Missing Preload', category: 'issues:hsts-no-preload', count: 'hstsNoPreload' },
      { key: 'issues-hsts-max-age-short', label: 'HSTS Max-Age <1y', category: 'issues:hsts-max-age-short', count: 'hstsMaxAgeShort' },
      { key: 'issues-hsts-no-includesubdomains', label: 'HSTS Missing includeSubDomains', category: 'issues:hsts-no-includesubdomains', count: 'hstsNoIncludeSubdomains' },
      { key: 'issues-xframe-missing', label: 'X-Frame-Options Missing', category: 'issues:x-frame-options-missing', count: 'xFrameOptionsMissing' },
      { key: 'issues-xcto-missing', label: 'X-Content-Type-Options Missing', category: 'issues:x-content-type-options-missing', count: 'xContentTypeOptionsMissing' },
      { key: 'issues-csp-missing', label: 'CSP Missing', category: 'issues:csp-missing', count: 'cspMissing' },
      { key: 'issues-mixed-content', label: 'Mixed Content (any)', category: 'issues:mixed-content', count: 'mixedContent' },
      { key: 'issues-mixed-content-active', label: 'Mixed Content Active (Blocked)', category: 'issues:mixed-content-active', count: 'mixedContentActive' },
      { key: 'issues-mixed-content-passive', label: 'Mixed Content Passive (Warning)', category: 'issues:mixed-content-passive', count: 'mixedContentPassive' },
      { key: 'issues-insecure-form-action', label: 'Insecure Form Action', category: 'issues:insecure-form-action', count: 'insecureFormAction' },
      { key: 'issues-missing-sri', label: 'Missing SRI (3rd-party)', category: 'issues:missing-sri', count: 'missingSri' },
      { key: 'issues-cors-wildcard-with-credentials', label: 'CORS Wildcard + Credentials', category: 'issues:cors-wildcard-with-credentials', count: 'corsWildcardWithCredentials' },
      { key: 'issues-cors-wildcard-origin', label: 'CORS Wildcard Origin', category: 'issues:cors-wildcard-origin', count: 'corsWildcardOrigin' },
      { key: 'issues-http-not-https', label: 'HTTP (not HTTPS)', category: 'issues:http-not-https', count: 'httpNotHttps' },
    ],
  },
  {
    key: 'issues-ssl',
    label: 'SSL / TLS',
    items: [
      { key: 'issues-ssl-cert-expired', label: 'Certificate Expired', category: 'issues:ssl-cert-expired', count: 'sslCertExpired' },
      { key: 'issues-ssl-cert-expiring-soon', label: 'Certificate Expiring (≤30d)', category: 'issues:ssl-cert-expiring-soon', count: 'sslCertExpiringSoon' },
      { key: 'issues-ssl-protocol-old', label: 'Deprecated TLS Protocol', category: 'issues:ssl-protocol-old', count: 'sslProtocolOld' },
      { key: 'issues-ssl-signature-weak', label: 'Weak Signature Algorithm', category: 'issues:ssl-signature-weak', count: 'sslSignatureWeak' },
    ],
  },
  {
    key: 'issues-technical',
    label: 'Technical',
    items: [
      { key: 'issues-favicon-missing', label: 'Favicon Missing', category: 'issues:favicon-missing', count: 'faviconMissing' },
    ],
  },
  {
    key: 'issues-redirects',
    label: 'Redirects',
    items: [
      { key: 'issues-redirect-loop', label: 'Redirect Loop', category: 'issues:redirect-loop', count: 'redirectLoop' },
      { key: 'issues-redirect-canonical-chain', label: 'Redirect → Canonical Chain', category: 'issues:redirect-canonical-chain', count: 'redirectCanonicalChain' },
      { key: 'issues-redirect-chain-long', label: 'Long Chain (>3 hops)', category: 'issues:redirect-chain-long', count: 'redirectChainLong' },
      { key: 'issues-redirect-self', label: 'Self-Redirect', category: 'issues:redirect-self', count: 'redirectSelf' },
      { key: 'issues-redirect-to-noindex', label: 'Redirect → Noindex', category: 'issues:redirect-to-noindex', count: 'redirectToNoindex' },
    ],
  },
  {
    key: 'issues-perf',
    label: 'Performance',
    items: [
      { key: 'issues-compression-missing', label: 'Compression Missing', category: 'issues:compression-missing', count: 'compressionMissing' },
      { key: 'issues-http2-not-supported', label: 'HTTP/2 Not Advertised', category: 'issues:http2-not-supported', count: 'http2NotSupported' },
      { key: 'issues-http3-not-supported', label: 'HTTP/3 Not Advertised', category: 'issues:http3-not-supported', count: 'http3NotSupported' },
      { key: 'issues-render-blocking', label: 'Render-Blocking Head (>5)', category: 'issues:render-blocking', count: 'renderBlocking' },
      { key: 'issues-render-blocking-critical', label: 'Render-Blocking Head (>20, critical)', category: 'issues:render-blocking-critical', count: 'renderBlockingCritical' },
      { key: 'issues-page-many-requests', label: 'Too Many Requests (>100 subresources)', category: 'issues:page-many-requests', count: 'pageManyRequests' },
      { key: 'issues-text-code-ratio-low', label: 'Low Text/Code Ratio (<10%)', category: 'issues:text-code-ratio-low', count: 'textCodeRatioLow' },
      { key: 'issues-keepalive-disabled', label: 'Keep-Alive Disabled', category: 'issues:keepalive-disabled', count: 'keepaliveDisabled' },
      { key: 'issues-image-too-large', label: 'Large Image (>100KB)', category: 'issues:image-too-large', count: 'imageTooLarge' },
    ],
  },
  {
    key: 'issues-sitemap',
    label: 'Sitemap',
    items: [
      { key: 'issues-sitemap-non-indexable', label: 'Non-Indexable in Sitemap', category: 'issues:non-indexable-in-sitemap', count: 'nonIndexableInSitemap' },
      { key: 'issues-sitemap-non-200', label: 'Non-200 in Sitemap', category: 'issues:non-200-in-sitemap', count: 'non200InSitemap' },
      { key: 'issues-sitemap-redirect', label: 'Redirect in Sitemap', category: 'issues:redirect-in-sitemap', count: 'redirectInSitemap' },
      { key: 'issues-crawled-not-in-sitemap', label: 'Crawled, Not in Sitemap', category: 'issues:crawled-not-in-sitemap', count: 'crawledNotInSitemap' },
    ],
  },
  {
    key: 'issues-structured-data',
    label: 'Structured Data',
    items: [
      { key: 'issues-schema-missing', label: 'No Structured Data', category: 'issues:structured-data-missing', count: 'structuredDataMissing' },
      { key: 'issues-schema-invalid', label: 'Invalid JSON-LD', category: 'issues:structured-data-invalid', count: 'structuredDataInvalid' },
      { key: 'issues-schema-duplicate-id', label: 'Duplicate @id', category: 'issues:schema-duplicate-id', count: 'schemaDuplicateId' },
      { key: 'issues-schema-unknown-type', label: 'Malformed @type', category: 'issues:schema-unknown-type', count: 'schemaUnknownType' },
      { key: 'issues-schema-missing-required', label: 'Missing Required Property', category: 'issues:schema-missing-required', count: 'schemaMissingRequired' },
      { key: 'issues-schema-missing-recommended', label: 'Missing Recommended Property', category: 'issues:schema-missing-recommended', count: 'schemaMissingRecommended' },
    ],
  },
  {
    key: 'issues-analytics',
    label: 'Analytics',
    items: [
      { key: 'issues-analytics-missing', label: 'No Analytics Detected', category: 'issues:analytics-missing', count: 'analyticsMissing' },
      { key: 'issues-analytics-multiple-ga4', label: 'Multiple GA4 IDs', category: 'issues:analytics-multiple-ga4', count: 'analyticsMultipleGa4' },
      { key: 'issues-analytics-ua-legacy', label: 'Universal Analytics (Sunset)', category: 'issues:analytics-ua-legacy', count: 'analyticsUaLegacy' },
      { key: 'issues-analytics-pixel-without-policy', label: 'Pixel Without Permissions-Policy', category: 'issues:analytics-pixel-without-policy', count: 'analyticsPixelWithoutPolicy' },
    ],
  },
  {
    key: 'issues-pagination',
    label: 'Pagination',
    items: [
      { key: 'issues-pagination-broken', label: 'Broken Next/Prev Target', category: 'issues:pagination-broken', count: 'paginationBroken' },
      { key: 'issues-pagination-sequence-break', label: 'Sequence Break (gap in numbering)', category: 'issues:pagination-sequence-break', count: 'paginationSequenceBreak' },
      { key: 'issues-pagination-canonical-conflict', label: 'Canonical Conflict', category: 'issues:pagination-canonical-conflict', count: 'paginationCanonicalConflict' },
    ],
  },
  {
    key: 'issues-hreflang',
    label: 'Hreflang',
    items: [
      { key: 'issues-hreflang-x-default', label: 'x-default Missing', category: 'issues:hreflang-x-default-missing', count: 'hreflangXDefaultMissing' },
      { key: 'issues-hreflang-invalid-code', label: 'Invalid Code', category: 'issues:hreflang-invalid-code', count: 'hreflangInvalidCode' },
      { key: 'issues-hreflang-self-ref-missing', label: 'Self-Ref Missing', category: 'issues:hreflang-self-ref-missing', count: 'hreflangSelfRefMissing' },
      { key: 'issues-hreflang-reciprocity-missing', label: 'Reciprocity Missing', category: 'issues:hreflang-reciprocity-missing', count: 'hreflangReciprocityMissing' },
      { key: 'issues-hreflang-target-issues', label: 'Target Issues', category: 'issues:hreflang-target-issues', count: 'hreflangTargetIssues' },
      { key: 'issues-hreflang-unlinked', label: 'Unlinked Targets', category: 'issues:hreflang-unlinked', count: 'hreflangUnlinked' },
      { key: 'issues-hreflang-inconsistent-lang', label: 'Inconsistent Lang (same lang, two hrefs)', category: 'issues:hreflang-inconsistent-lang', count: 'hreflangInconsistentLang' },
    ],
  },
  {
    key: 'issues-images',
    label: 'Images',
    items: [
      { key: 'issues-images-missing-alt', label: 'Missing Alt', category: 'issues:image-missing-alt', count: 'imageMissingAlt', percentBase: 'images' },
      { key: 'issues-images-empty-alt', label: 'Empty Alt', category: 'issues:image-empty-alt', count: 'imageEmptyAlt', percentBase: 'images' },
      { key: 'issues-images-duplicate-alt', label: 'Duplicate Alt Text', category: 'issues:image-duplicate-alt', count: 'imageDuplicateAlt', percentBase: 'images' },
      { key: 'issues-images-no-lazy-loading', label: 'Low Lazy-Loading Adoption', category: 'issues:images-no-lazy-loading', count: 'imagesNoLazyLoading' },
      { key: 'issues-images-no-responsive', label: 'Low Responsive Image Adoption', category: 'issues:images-no-responsive', count: 'imagesNoResponsive' },
      { key: 'issues-image-broken-src', label: 'Broken Image Src', category: 'issues:image-broken-src', count: 'imageBrokenSrc' },
      { key: 'issues-image-slow-loading', label: 'Slow-Loading Image (>200KB, no lazy)', category: 'issues:image-slow-loading', count: 'imageSlowLoading' },
    ],
  },
  {
    key: 'issues-links',
    label: 'Links',
    items: [
      { key: 'issues-orphan-page', label: 'Orphan Pages (No Inlinks)', category: 'issues:orphan-page', count: 'orphanPage' },
      { key: 'issues-broken-all', label: 'Broken (All)', category: 'issues:broken-links-all', count: ['brokenLinksInternal', 'brokenLinksExternal'] },
      { key: 'issues-broken-internal', label: 'Broken Internal', category: 'issues:broken-links-internal', count: 'brokenLinksInternal' },
      { key: 'issues-broken-external', label: 'Broken External', category: 'issues:broken-links-external', count: 'brokenLinksExternal' },
      { key: 'issues-link-empty-anchor', label: 'Empty Anchor Text', category: 'issues:link-empty-anchor', count: 'linkEmptyAnchor' },
      { key: 'issues-anchor-text-too-long', label: 'Anchor Text Too Long (>100)', category: 'issues:anchor-text-too-long', count: 'anchorTextTooLong' },
      { key: 'issues-anchor-text-generic', label: 'Generic Anchor Text', category: 'issues:anchor-text-generic', count: 'anchorTextGeneric' },
      { key: 'issues-target-blank-no-noopener', label: 'target=_blank without noopener', category: 'issues:target-blank-no-noopener', count: 'targetBlankNoNoopener' },
      { key: 'issues-external-links-too-many', label: 'External Links > 100', category: 'issues:external-links-too-many', count: 'externalLinksTooMany' },
      { key: 'issues-links-per-page-too-many', label: 'Total Links per Page > 100', category: 'issues:links-per-page-too-many', count: 'linksPerPageTooMany' },
      { key: 'issues-outlinks-zero', label: 'No Outlinks (Dead-End)', category: 'issues:outlinks-zero', count: 'outlinksZero' },
      { key: 'issues-internal-link-to-redirect', label: 'Internal Link → Redirect', category: 'issues:internal-link-to-redirect', count: 'internalLinkToRedirect' },
      { key: 'issues-dead-external-domain', label: 'Dead External Domain', category: 'issues:dead-external-domain', count: 'deadExternalDomain' },
      { key: 'issues-js-only-navigation', label: 'JS-Only Navigation', category: 'issues:js-only-navigation', count: 'jsOnlyNavigation' },
    ],
  },
  {
    key: 'issues-pwa',
    label: 'PWA / Discovery',
    items: [
      { key: 'issues-apple-touch-missing', label: 'Apple Touch Icon Missing', category: 'issues:apple-touch-icon-missing', count: 'appleTouchIconMissing' },
      { key: 'issues-manifest-missing', label: 'Web Manifest Missing', category: 'issues:manifest-missing', count: 'manifestMissing' },
      { key: 'issues-feed-missing', label: 'RSS/Atom Feed Missing', category: 'issues:feed-missing', count: 'feedMissing' },
    ],
  },
];

/** `issues:*` category → the `OverviewCounts.issues` field that counts it. */
export const ISSUE_COUNT_KEY: ReadonlyMap<UrlCategory, IssueCountKey> = new Map(
  ISSUE_GROUPS.flatMap((g) =>
    g.items.flatMap((i) => (typeof i.count === 'string' ? [[i.category, i.count] as const] : [])),
  ),
);

/** Reads a check's counter, summing composite ones. */
export function issueCount(issues: OverviewCounts['issues'], def: IssueCheckDef): number {
  return typeof def.count === 'string'
    ? issues[def.count]
    : def.count.reduce((acc, k) => acc + issues[k], 0);
}

/** Every toggleable issue category, in sidebar order. */
export const ISSUE_CATEGORIES: readonly UrlCategory[] = ISSUE_GROUPS.flatMap((g) =>
  g.items.map((i) => i.category),
);

/**
 * Normalises a saved `disabledIssues` list: drops unknown ids (a check
 * renamed since the project was saved) and duplicates, keeps sidebar order.
 */
export function normalizeDisabledIssues(list: readonly string[] | undefined): UrlCategory[] {
  if (!list || list.length === 0) return [];
  const wanted = new Set(list);
  return ISSUE_CATEGORIES.filter((c) => wanted.has(c));
}
