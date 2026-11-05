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
  // Canonicals that disagree with each other are discarded wholesale by
  // search engines, and a noindex sitting on a canonicalised page cancels
  // the consolidation outright — both break indexing, not just degrade it.
  'issues:canonical-conflicting',
  'issues:noindex-canonical-conflict',
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
  'issues:http-not-https',
  'issues:mixed-content-active',
];

/** Suboptimal but non-breaking issues worth fixing. */
const WARNING: UrlCategory[] = [
  // A self-only hreflang set declares no alternates at all, and a self
  // annotation that contradicts html[lang] means one of the two is wrong —
  // both leave the language targeting unusable. `<a href="">` is a link
  // to nowhere that users can still click.
  'issues:hreflang-self-only',
  'issues:hreflang-lang-mismatch',
  'issues:link-empty-href',
  // A share image that does not load leaves the card without a picture.
  'issues:og-image-not-200',
  'issues:twitter-image-not-200',
  'issues:redirect-canonical-chain',
  'issues:orphan-page',
  'issues:mobile-parity-mismatch',
  'issues:content-wider-than-screen',
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
  'issues:spelling-grammar',
  'issues:response-slow',
  'issues:page-large',
  'issues:viewport-missing',
  'issues:hsts-missing',
  'issues:x-frame-options-missing',
  'issues:x-content-type-options-missing',
  // Browsers reject a credentialed response with ACAO `*`, so this is a
  // broken CORS config (credentialed requests fail), not a data leak.
  'issues:cors-wildcard-with-credentials',
  'issues:structured-data-invalid',
  'issues:pagination-broken',
  'issues:redirect-chain-long',
  'issues:redirect-chain',
  'issues:charset-mismatch',
  'issues:canonical-outside-head',
  'issues:hreflang-outside-head',
  'issues:lang-content-mismatch',
  'issues:soft-404',
  'issues:blocked-by-robots',
  'issues:noindex-js-injected',
  'issues:title-changed-by-js',
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
  // Both are legitimate in some setups (syndication; a redirect that
  // deliberately lands on a noindexed page), so they warn rather than fail.
  'issues:canonical-cross-domain',
  'issues:redirect-to-noindex',
  // Faceted / calendar / session-ID URL spaces waste crawl budget on
  // near-identical pages, but plenty of them are legitimate archive pages.
  'issues:crawl-trap',
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
  'issues:font-too-small',
  'issues:tap-targets-too-small',
  'issues:hreflang-inconsistent-lang',
  'issues:over-budget',
];

/** Informational / stylistic / nice-to-have signals. */
const INFO: UrlCategory[] = [
  'issues:hreflang-unlinked',
  // Google recommends x-default but never requires it — a missing one is
  // a suggestion, not a defect.
  'issues:hreflang-x-default-missing',
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
  'issues:image-duplicate-alt',
  'issues:high-boilerplate',
  'issues:crawled-not-in-sitemap',
  'issues:h1-too-long',
  'issues:url-fragment',
  'issues:link-empty-anchor',
  'issues:image-missing-title',
  'issues:og-incomplete',
  'issues:twitter-incomplete',
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

/** Per-project severity changes (Settings → Issues): category → tier. */
export type IssueSeverityOverrides = Partial<Record<UrlCategory, IssueSeverity>>;

const TIERS: readonly IssueSeverity[] = ['critical', 'warning', 'info'];

/**
 * A saved overrides map, cleaned: unknown categories and tiers are dropped,
 * and so is any entry equal to the built-in tier (it changes nothing, and
 * keeping it would pin the check if the default is revised later).
 */
export function normalizeSeverityOverrides(raw: unknown): IssueSeverityOverrides {
  const out: IssueSeverityOverrides = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [cat, tier] of Object.entries(raw as Record<string, unknown>)) {
    const builtIn = ISSUE_SEVERITY[cat as UrlCategory];
    if (!builtIn) continue;
    if (typeof tier !== 'string' || !TIERS.includes(tier as IssueSeverity)) continue;
    if (tier === builtIn) continue;
    out[cat as UrlCategory] = tier as IssueSeverity;
  }
  return out;
}

/** The tier a check is reported under: the project's override, else the built-in one. */
export function effectiveIssueSeverity(
  cat: UrlCategory,
  overrides?: IssueSeverityOverrides,
): IssueSeverity | undefined {
  return overrides?.[cat] ?? ISSUE_SEVERITY[cat];
}

/** The `issues:*` categories belonging to one severity tier, after the
 *  project's overrides move checks between tiers. */
export function issueCategoriesBySeverity(
  tier: IssueSeverity,
  overrides?: IssueSeverityOverrides,
): UrlCategory[] {
  const base = tier === 'critical' ? CRITICAL : tier === 'warning' ? WARNING : INFO;
  if (!overrides || Object.keys(overrides).length === 0) return base;
  const out = base.filter((c) => (overrides[c] ?? tier) === tier);
  for (const [cat, t] of Object.entries(overrides) as [UrlCategory, IssueSeverity][]) {
    if (t === tier && !out.includes(cat)) out.push(cat);
  }
  return out;
}

/** Maps a severity tier to its virtual rollup UrlCategory. */
export const SEVERITY_CATEGORY: Record<IssueSeverity, UrlCategory> = {
  critical: 'issues:severity-critical',
  warning: 'issues:severity-warning',
  info: 'issues:severity-info',
};
