/**
 * V2 Faz 15 — issue → severity classification.
 *
 * A single source of truth mapping every `issues:*` UrlCategory to one of
 * three severity tiers (Critical / Warning / Info). Powers the "split
 * bulk export by severity" feature (three rollup files/sheets) and the
 * virtual `issues:severity-*` categories, and is reusable anywhere a
 * machine-readable issue severity is useful (sidebar, MCP, reports).
 *
 * Tiering rationale:
 *   - `critical` — actively breaks indexing/crawling, security holes, or
 *     broken resources (missing title, broken internal links, redirect
 *     loops, canonical→non-200/noindex, expired TLS, mixed/insecure
 *     content, empty page, exact duplicate content).
 *   - `warning`  — suboptimal and worth fixing but not breaking (length
 *     limits, duplicate meta/H1, missing alt/security headers, slow TTFB,
 *     schema gaps, social-image problems, accessibility defects).
 *   - `info`     — informational / stylistic / nice-to-have (URL cosmetics,
 *     self-referencing canonical, missing favicon/manifest, protocol
 *     advertisements, readability scores).
 *
 * Severity is inherently a judgement call; this is a sensible default an
 * auditor can reason about, not an authoritative standard.
 */
import type { UrlCategory } from './crawl.js';

export type IssueSeverity = 'critical' | 'warning' | 'info';

/** Issue categories that break indexing/crawling, security, or resources. */
const CRITICAL: UrlCategory[] = [
  'issues:title-missing',
  'issues:multiple-canonicals',
  'issues:canonical-mismatch',
  'issues:canonical-to-non-200',
  'issues:canonical-to-noindex',
  'issues:response-very-slow',
  'issues:mixed-content',
  'issues:redirect-loop',
  'issues:redirect-self',
  'issues:broken-links-all',
  'issues:broken-links-internal',
  'issues:duplicate-content-exact',
  'issues:insecure-form-action',
  'issues:title-placeholder',
  'issues:ssl-cert-expired',
  'issues:page-too-large-critical',
  'issues:page-empty',
  'issues:cors-wildcard-with-credentials',
  'issues:http-not-https',
  'issues:mixed-content-active',
];

/** Suboptimal but non-breaking issues worth fixing. */
const WARNING: UrlCategory[] = [
  'issues:title-too-long',
  'issues:title-too-short',
  'issues:title-duplicate',
  'issues:meta-missing',
  'issues:meta-too-long',
  'issues:meta-too-short',
  'issues:meta-duplicate',
  'issues:h1-missing',
  'issues:h1-duplicate',
  'issues:h1-multiple',
  'issues:canonical-missing',
  'issues:canonical-to-redirect',
  'issues:content-thin',
  'issues:response-slow',
  'issues:page-large',
  'issues:viewport-missing',
  'issues:hsts-missing',
  'issues:x-frame-options-missing',
  'issues:x-content-type-options-missing',
  'issues:structured-data-invalid',
  'issues:pagination-broken',
  'issues:hreflang-x-default-missing',
  'issues:redirect-chain-long',
  'issues:compression-missing',
  'issues:non-indexable-in-sitemap',
  'issues:non-200-in-sitemap',
  'issues:image-missing-alt',
  'issues:meta-refresh-used',
  'issues:charset-missing',
  'issues:amp-validation-errors',
  'issues:canonical-conflict-near-duplicate',
  'issues:broken-links-external',
  'issues:near-duplicate',
  'issues:hreflang-invalid-code',
  'issues:hreflang-self-ref-missing',
  'issues:hreflang-reciprocity-missing',
  'issues:hreflang-target-issues',
  'issues:redirect-in-sitemap',
  'issues:h1-empty',
  'issues:title-multiple',
  'issues:url-spaces',
  'issues:url-malformed',
  'issues:title-pixel-width-too-long',
  'issues:meta-pixel-width-too-long',
  'issues:ttfb-slow',
  'issues:ttfb-very-slow',
  'issues:cookie-no-secure',
  'issues:cookie-no-httponly',
  'issues:render-blocking',
  'issues:analytics-multiple-ga4',
  'issues:image-too-large',
  'issues:ssl-cert-expiring-soon',
  'issues:ssl-protocol-old',
  'issues:ssl-signature-weak',
  'issues:form-input-unlabeled',
  'issues:image-broken-src',
  'issues:aria-invalid-role',
  'issues:pagination-canonical-conflict',
  'issues:schema-duplicate-id',
  'issues:schema-unknown-type',
  'issues:schema-missing-required',
  'issues:og-image-not-absolute',
  'issues:twitter-image-not-absolute',
  'issues:canonical-not-absolute',
  'issues:title-single-word',
  'issues:internal-link-to-redirect',
  'issues:dead-external-domain',
  'issues:canonical-chain-multi-hop',
  'issues:image-slow-loading',
  'issues:js-only-navigation',
  'issues:mixed-content-passive',
  'issues:render-blocking-critical',
  'issues:og-image-too-large',
  'issues:twitter-image-too-large',
  'issues:og-image-wrong-aspect',
  'issues:twitter-image-wrong-aspect',
  'issues:low-contrast-text',
  'issues:focus-outline-suppressed',
  'issues:hreflang-inconsistent-lang',
  'issues:over-budget',
];

/** Informational / stylistic / nice-to-have signals. */
const INFO: UrlCategory[] = [
  'issues:heading-skipped-level',
  'issues:canonical-self-referencing',
  'issues:canonical-non-self',
  'issues:url-too-long',
  'issues:url-uppercase',
  'issues:url-underscore',
  'issues:url-multiple-slashes',
  'issues:url-non-ascii',
  'issues:lang-missing',
  'issues:og-missing',
  'issues:twitter-missing',
  'issues:csp-missing',
  'issues:structured-data-missing',
  'issues:favicon-missing',
  'issues:url-many-params',
  'issues:image-empty-alt',
  'issues:high-boilerplate',
  'issues:crawled-not-in-sitemap',
  'issues:h1-too-long',
  'issues:url-fragment',
  'issues:link-empty-anchor',
  'issues:apple-touch-icon-missing',
  'issues:manifest-missing',
  'issues:feed-missing',
  'issues:missing-sri',
  'issues:cookie-no-samesite',
  'issues:query-string-too-long',
  'issues:folder-depth-too-deep',
  'issues:http2-not-supported',
  'issues:http3-not-supported',
  'issues:keepalive-disabled',
  'issues:analytics-missing',
  'issues:analytics-ua-legacy',
  'issues:analytics-pixel-without-policy',
  'issues:hsts-no-preload',
  'issues:hsts-max-age-short',
  'issues:hsts-no-includesubdomains',
  'issues:anchor-text-too-long',
  'issues:anchor-text-generic',
  'issues:images-no-lazy-loading',
  'issues:images-no-responsive',
  'issues:landmark-main-missing',
  'issues:skip-link-missing',
  'issues:schema-missing-recommended',
  'issues:target-blank-no-noopener',
  'issues:description-equals-title',
  'issues:external-links-too-many',
  'issues:outlinks-zero',
  'issues:h1-equals-title',
  'issues:duplicate-url-post-norm',
  'issues:description-equals-h1',
  'issues:text-code-ratio-low',
  'issues:flesch-very-difficult',
  'issues:gunning-fog-very-high',
  'issues:cors-wildcard-origin',
  'issues:pagination-sequence-break',
  'issues:links-per-page-too-many',
  'issues:page-many-requests',
];

/** Lookup: `issues:*` category → severity tier. Non-issue categories absent. */
export const ISSUE_SEVERITY: Partial<Record<UrlCategory, IssueSeverity>> = {};
for (const cat of CRITICAL) ISSUE_SEVERITY[cat] = 'critical';
for (const cat of WARNING) ISSUE_SEVERITY[cat] = 'warning';
for (const cat of INFO) ISSUE_SEVERITY[cat] = 'info';

/** The `issues:*` categories belonging to one severity tier. */
export function issueCategoriesBySeverity(tier: IssueSeverity): UrlCategory[] {
  if (tier === 'critical') return CRITICAL;
  if (tier === 'warning') return WARNING;
  return INFO;
}

/** Maps a severity tier to its virtual rollup UrlCategory. */
export const SEVERITY_CATEGORY: Record<IssueSeverity, UrlCategory> = {
  critical: 'issues:severity-critical',
  warning: 'issues:severity-warning',
  info: 'issues:severity-info',
};
