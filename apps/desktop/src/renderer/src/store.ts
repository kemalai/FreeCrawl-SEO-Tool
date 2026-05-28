import { create } from 'zustand';
import {
  DEFAULT_CRAWL_CONFIG,
  type CrawlConfig,
  type CrawlProgress,
  type CrawlSummary,
  type OverviewCounts,
  type UrlCategory,
} from '@freecrawl/shared-types';

export type TabKey =
  | 'internal'
  | 'external'
  | 'response-codes'
  | 'url'
  | 'page-titles'
  | 'meta-description'
  | 'h1'
  | 'h2'
  | 'content'
  | 'images'
  | 'canonicals'
  | 'directives'
  | 'redirects'
  | 'pagination'
  | 'hreflang'
  | 'amp'
  | 'structured-data'
  | 'meta-refresh'
  | 'custom-extraction'
  | 'custom-search'
  | 'security'
  | 'duplicates'
  | 'links'
  | 'broken-links'
  | 'serp'
  | 'pagespeed'
  | 'search-console'
  | 'analytics'
  | 'ai'
  | 'seo';

export const TAB_ORDER: { key: TabKey; label: string }[] = [
  { key: 'internal', label: 'Internal' },
  { key: 'external', label: 'External' },
  { key: 'response-codes', label: 'Response Codes' },
  { key: 'url', label: 'URL' },
  { key: 'page-titles', label: 'Page Titles' },
  { key: 'meta-description', label: 'Meta Description' },
  { key: 'h1', label: 'H1' },
  { key: 'h2', label: 'H2' },
  { key: 'content', label: 'Content' },
  { key: 'images', label: 'Images' },
  { key: 'canonicals', label: 'Canonicals' },
  { key: 'directives', label: 'Directives' },
  { key: 'redirects', label: 'Redirects' },
  { key: 'pagination', label: 'Pagination' },
  { key: 'hreflang', label: 'Hreflang' },
  { key: 'amp', label: 'AMP' },
  { key: 'structured-data', label: 'Structured Data' },
  { key: 'meta-refresh', label: 'Meta Refresh' },
  { key: 'custom-extraction', label: 'Custom Extraction' },
  { key: 'custom-search', label: 'Custom Search' },
  { key: 'security', label: 'Security' },
  { key: 'duplicates', label: 'Duplicates' },
  { key: 'links', label: 'Links' },
  { key: 'broken-links', label: 'Broken Links' },
  { key: 'serp', label: 'SERP' },
  { key: 'pagespeed', label: 'PageSpeed' },
  { key: 'search-console', label: 'Search Console' },
  { key: 'analytics', label: 'GA4' },
  { key: 'ai', label: 'AI' },
  { key: 'seo', label: 'SEO Authority' },
];

/**
 * Per-tab quick-filter dropdown options. Mirrors the OverviewSidebar's
 * structural sub-categories for tabs that have them; tabs without a
 * predefined sub-grouping (Page Titles, Meta Description, H1, …) get
 * just an `All` entry so the dropdown stays consistent.
 *
 * Labels here are the English source strings — they go through
 * `translateLabel(label, lang)` at render time, identical to how the
 * sidebar handles localisation.
 */
export interface TabQuickFilter {
  label: string;
  category: UrlCategory;
}

export const TAB_QUICK_FILTERS: Partial<Record<TabKey, TabQuickFilter[]>> = {
  // ─── Structural content-kind / status / security / indexability splits ──
  internal: [
    { label: 'All', category: 'internal:all' },
    { label: 'HTML', category: 'internal:html' },
    { label: 'JavaScript', category: 'internal:js' },
    { label: 'CSS', category: 'internal:css' },
    { label: 'Images', category: 'internal:image' },
    { label: 'PDF', category: 'internal:pdf' },
    { label: 'Fonts', category: 'internal:font' },
    { label: 'Other', category: 'internal:other' },
  ],
  external: [
    { label: 'All', category: 'external:all' },
    { label: 'HTML', category: 'external:html' },
    { label: 'Other', category: 'external:other' },
  ],
  'response-codes': [
    { label: 'All', category: 'all' },
    { label: 'Blocked by Robots', category: 'status:blocked-robots' },
    { label: 'No Response', category: 'status:no-response' },
    { label: 'Success (2xx)', category: 'status:2xx' },
    { label: 'Redirection (3xx)', category: 'status:3xx' },
    { label: 'Client Error (4xx)', category: 'status:4xx' },
    { label: 'Server Error (5xx)', category: 'status:5xx' },
    { label: 'Slow (>1s)', category: 'issues:response-slow' },
    { label: 'Very Slow (>3s)', category: 'issues:response-very-slow' },
    { label: 'TTFB Slow (>600ms)', category: 'issues:ttfb-slow' },
    { label: 'TTFB Very Slow (>1.8s)', category: 'issues:ttfb-very-slow' },
  ],
  security: [
    { label: 'HTTPS URLs', category: 'security:https' },
    { label: 'HTTP URLs', category: 'security:http' },
    // Cookies
    { label: 'Missing Secure (HTTPS)', category: 'issues:cookie-no-secure' },
    { label: 'Missing HttpOnly', category: 'issues:cookie-no-httponly' },
    { label: 'Missing SameSite', category: 'issues:cookie-no-samesite' },
    // Security headers
    { label: 'HSTS Missing', category: 'issues:hsts-missing' },
    { label: 'HSTS Missing Preload', category: 'issues:hsts-no-preload' },
    { label: 'HSTS Max-Age <1y', category: 'issues:hsts-max-age-short' },
    { label: 'HSTS Missing includeSubDomains', category: 'issues:hsts-no-includesubdomains' },
    { label: 'X-Frame-Options Missing', category: 'issues:x-frame-options-missing' },
    { label: 'X-Content-Type-Options Missing', category: 'issues:x-content-type-options-missing' },
    { label: 'CSP Missing', category: 'issues:csp-missing' },
    { label: 'Mixed Content (any)', category: 'issues:mixed-content' },
    { label: 'Mixed Content Active (Blocked)', category: 'issues:mixed-content-active' },
    { label: 'Mixed Content Passive (Warning)', category: 'issues:mixed-content-passive' },
    { label: 'Insecure Form Action', category: 'issues:insecure-form-action' },
    { label: 'Missing SRI (3rd-party)', category: 'issues:missing-sri' },
    { label: 'CORS Wildcard + Credentials', category: 'issues:cors-wildcard-with-credentials' },
    { label: 'CORS Wildcard Origin', category: 'issues:cors-wildcard-origin' },
    { label: 'HTTP (not HTTPS)', category: 'issues:http-not-https' },
    // SSL/TLS
    { label: 'Certificate Expired', category: 'issues:ssl-cert-expired' },
    { label: 'Certificate Expiring (≤30d)', category: 'issues:ssl-cert-expiring-soon' },
    { label: 'Deprecated TLS Protocol', category: 'issues:ssl-protocol-old' },
    { label: 'Weak Signature Algorithm', category: 'issues:ssl-signature-weak' },
  ],
  directives: [
    { label: 'Indexable', category: 'indexability:indexable' },
    { label: 'Non-Indexable', category: 'indexability:non-indexable' },
    { label: 'Noindex', category: 'indexability:noindex' },
    { label: 'Canonicalised', category: 'indexability:canonicalised' },
    { label: 'Blocked by Robots', category: 'indexability:blocked-robots' },
  ],

  // ─── URL tab ────────────────────────────────────────────────────────────
  url: [
    { label: 'All', category: 'internal:html' },
    { label: 'Too Long (>2048 chars)', category: 'issues:url-too-long' },
    { label: 'Contains Uppercase', category: 'issues:url-uppercase' },
    { label: 'Contains Underscore', category: 'issues:url-underscore' },
    { label: 'Multiple Slashes', category: 'issues:url-multiple-slashes' },
    { label: 'Non-ASCII Characters', category: 'issues:url-non-ascii' },
    { label: 'Many Query Params (>5)', category: 'issues:url-many-params' },
    { label: 'Fragment (#) in URL', category: 'issues:url-fragment' },
    { label: 'Spaces in URL', category: 'issues:url-spaces' },
    { label: 'Malformed URL', category: 'issues:url-malformed' },
    { label: 'Long Query String (>100 chars)', category: 'issues:query-string-too-long' },
    { label: 'Folder Depth >4', category: 'issues:folder-depth-too-deep' },
    { label: 'Duplicate URL (post-norm)', category: 'issues:duplicate-url-post-norm' },
  ],

  // ─── Page Titles tab ────────────────────────────────────────────────────
  'page-titles': [
    { label: 'All', category: 'internal:html' },
    { label: 'Missing', category: 'issues:title-missing' },
    { label: 'Over 60 Characters', category: 'issues:title-too-long' },
    { label: 'Below 30 Characters', category: 'issues:title-too-short' },
    { label: 'Duplicate', category: 'issues:title-duplicate' },
    { label: 'Multiple <title> Tags', category: 'issues:title-multiple' },
    { label: 'Pixel Width Truncated (>600px)', category: 'issues:title-pixel-width-too-long' },
    { label: 'Placeholder Title', category: 'issues:title-placeholder' },
    { label: 'Single-Word Title', category: 'issues:title-single-word' },
  ],

  // ─── Meta Description tab ───────────────────────────────────────────────
  'meta-description': [
    { label: 'All', category: 'internal:html' },
    { label: 'Missing', category: 'issues:meta-missing' },
    { label: 'Over 160 Characters', category: 'issues:meta-too-long' },
    { label: 'Below 120 Characters', category: 'issues:meta-too-short' },
    { label: 'Duplicate', category: 'issues:meta-duplicate' },
    { label: 'Pixel Width Truncated (>990px)', category: 'issues:meta-pixel-width-too-long' },
    { label: 'Description = Title', category: 'issues:description-equals-title' },
    { label: 'Description = H1', category: 'issues:description-equals-h1' },
  ],

  // ─── H1 tab ─────────────────────────────────────────────────────────────
  h1: [
    { label: 'All', category: 'internal:html' },
    { label: 'Missing', category: 'issues:h1-missing' },
    { label: 'Duplicate', category: 'issues:h1-duplicate' },
    { label: 'Multiple', category: 'issues:h1-multiple' },
    { label: 'Empty', category: 'issues:h1-empty' },
    { label: 'Over 70 Characters', category: 'issues:h1-too-long' },
    { label: 'H1 = Title', category: 'issues:h1-equals-title' },
  ],

  // ─── H2 tab ─────────────────────────────────────────────────────────────
  h2: [
    { label: 'All', category: 'internal:html' },
    { label: 'Skipped Heading Level', category: 'issues:heading-skipped-level' },
  ],

  // ─── Content tab ────────────────────────────────────────────────────────
  content: [
    { label: 'All', category: 'internal:html' },
    { label: 'Thin Content (<300 words)', category: 'issues:content-thin' },
    { label: 'Empty Page (<30 words)', category: 'issues:page-empty' },
    { label: 'Hard to Read (Flesch <30)', category: 'issues:flesch-very-difficult' },
    { label: 'Gunning Fog >17', category: 'issues:gunning-fog-very-high' },
    { label: 'Large (>1MB)', category: 'issues:page-large' },
    { label: 'Critical Size (>3MB)', category: 'issues:page-too-large-critical' },
    { label: 'Charset Missing', category: 'issues:charset-missing' },
  ],

  // ─── Canonicals tab ─────────────────────────────────────────────────────
  canonicals: [
    { label: 'All', category: 'internal:html' },
    { label: 'Canonical Missing', category: 'issues:canonical-missing' },
    { label: 'Self-Referencing', category: 'issues:canonical-self-referencing' },
    { label: 'Canonicalised (→ other)', category: 'issues:canonical-non-self' },
    { label: 'HTTP vs HTML Mismatch', category: 'issues:canonical-mismatch' },
    { label: 'Multiple Canonicals', category: 'issues:multiple-canonicals' },
    { label: 'Canonical → Non-200', category: 'issues:canonical-to-non-200' },
    { label: 'Canonical → Redirect', category: 'issues:canonical-to-redirect' },
    { label: 'Canonical → Noindex', category: 'issues:canonical-to-noindex' },
    { label: 'Canonical Not Absolute', category: 'issues:canonical-not-absolute' },
    { label: 'Canonical Chain (Multi-hop)', category: 'issues:canonical-chain-multi-hop' },
  ],

  // ─── Redirects tab ──────────────────────────────────────────────────────
  redirects: [
    { label: 'All', category: 'tab:redirects' },
    { label: 'Redirect Loop', category: 'issues:redirect-loop' },
    { label: 'Long Chain (>3 hops)', category: 'issues:redirect-chain-long' },
    { label: 'Self-Redirect', category: 'issues:redirect-self' },
  ],

  // ─── Pagination tab ─────────────────────────────────────────────────────
  pagination: [
    { label: 'All', category: 'tab:pagination' },
    { label: 'Broken Next/Prev Target', category: 'issues:pagination-broken' },
    { label: 'Sequence Break', category: 'issues:pagination-sequence-break' },
    { label: 'Canonical Conflict', category: 'issues:pagination-canonical-conflict' },
  ],

  // ─── Hreflang tab ───────────────────────────────────────────────────────
  hreflang: [
    { label: 'All', category: 'tab:hreflang' },
    { label: 'X-Default Missing', category: 'issues:hreflang-x-default-missing' },
    { label: 'Invalid Code', category: 'issues:hreflang-invalid-code' },
    { label: 'Self-Ref Missing', category: 'issues:hreflang-self-ref-missing' },
    { label: 'Reciprocity Missing', category: 'issues:hreflang-reciprocity-missing' },
    { label: 'Target Issues', category: 'issues:hreflang-target-issues' },
    { label: 'Inconsistent Lang', category: 'issues:hreflang-inconsistent-lang' },
  ],

  // ─── Structured Data tab ────────────────────────────────────────────────
  'structured-data': [
    { label: 'All', category: 'tab:structured-data' },
    { label: 'No Structured Data', category: 'issues:structured-data-missing' },
    { label: 'Invalid JSON-LD', category: 'issues:structured-data-invalid' },
    { label: 'Duplicate @id', category: 'issues:schema-duplicate-id' },
    { label: 'Malformed @type', category: 'issues:schema-unknown-type' },
    { label: 'Missing Required Property', category: 'issues:schema-missing-required' },
  ],

  // ─── Meta Refresh tab ───────────────────────────────────────────────────
  'meta-refresh': [
    { label: 'All', category: 'tab:meta-refresh' },
    { label: 'Meta Refresh Used', category: 'issues:meta-refresh-used' },
  ],

  // ─── Duplicates tab ─────────────────────────────────────────────────────
  duplicates: [
    { label: 'All', category: 'tab:duplicates' },
    { label: 'Near-Duplicate Content', category: 'issues:near-duplicate' },
    { label: 'Duplicate Content (exact)', category: 'issues:duplicate-content-exact' },
  ],

  // ─── Links tab ──────────────────────────────────────────────────────────
  links: [
    { label: 'All', category: 'all' },
    { label: 'Broken (All)', category: 'issues:broken-links-all' },
    { label: 'Broken Internal', category: 'issues:broken-links-internal' },
    { label: 'Broken External', category: 'issues:broken-links-external' },
    { label: 'Empty Anchor Text', category: 'issues:link-empty-anchor' },
    { label: 'Anchor Text Too Long (>100)', category: 'issues:anchor-text-too-long' },
    { label: 'Generic Anchor Text', category: 'issues:anchor-text-generic' },
    { label: 'Target=_blank No Noopener', category: 'issues:target-blank-no-noopener' },
    { label: 'External Links > 100', category: 'issues:external-links-too-many' },
    { label: 'Total Links per Page > 100', category: 'issues:links-per-page-too-many' },
    { label: 'No Outlinks (Dead-End)', category: 'issues:outlinks-zero' },
    { label: 'Internal Link → Redirect', category: 'issues:internal-link-to-redirect' },
    { label: 'Dead External Domain', category: 'issues:dead-external-domain' },
    { label: 'JS-Only Navigation', category: 'issues:js-only-navigation' },
  ],

  // ─── Analytics tab ──────────────────────────────────────────────────────
  analytics: [
    { label: 'All', category: 'all' },
    { label: 'No Analytics Detected', category: 'issues:analytics-missing' },
    { label: 'Multiple GA4 IDs', category: 'issues:analytics-multiple-ga4' },
    { label: 'Universal Analytics (Sunset)', category: 'issues:analytics-ua-legacy' },
    { label: 'Pixel Without Permissions-Policy', category: 'issues:analytics-pixel-without-policy' },
  ],
};

interface AppState {
  config: CrawlConfig;
  progress: CrawlProgress | null;
  summary: CrawlSummary | null;
  overview: OverviewCounts | null;
  activeTab: TabKey;
  activeCategory: UrlCategory;
  error: string | null;
  selectedUrlId: number | null;
  /** Multi-row selection in the main URLs table. Used by sub-tab views
   * (Inlinks / Outlinks / Images / Resources) to aggregate data across
   * every selected row instead of just the primary `selectedUrlId`. When
   * the user has only one row selected this mirrors `[selectedUrlId]`. */
  selectedUrlIds: number[];
  sidebarOpen: boolean;
  detailPanelOpen: boolean;
  settingsOpen: boolean;
  recentUrls: string[];
  dataVersion: number;
  setConfig: (patch: Partial<CrawlConfig>) => void;
  setProgress: (p: CrawlProgress) => void;
  setSummary: (s: CrawlSummary) => void;
  setOverview: (o: OverviewCounts) => void;
  setActiveTab: (t: TabKey) => void;
  setActiveCategory: (c: UrlCategory) => void;
  navigateToCategory: (c: UrlCategory) => void;
  setError: (e: string | null) => void;
  setSelectedUrlId: (id: number | null) => void;
  setSelectedUrlIds: (ids: number[]) => void;
  toggleSidebar: () => void;
  toggleDetailPanel: () => void;
  setSettingsOpen: (open: boolean) => void;
  addRecentUrl: (url: string) => void;
  bumpDataVersion: () => void;
  reset: () => void;
}

const RECENT_URLS_MAX = 5;
const RECENT_URLS_KEY = 'recent-urls';

function loadRecentUrls(): string[] {
  if (typeof window === 'undefined' || !window.freecrawl) return [];
  const saved = window.freecrawl.prefsGet(RECENT_URLS_KEY);
  if (!Array.isArray(saved)) return [];
  return saved
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .slice(0, RECENT_URLS_MAX);
}

/**
 * Hydrate the stored CrawlConfig once at module load. Anything saved by
 * the Settings dialog merges over the defaults so new fields added in
 * later versions still surface (the merge order is `defaults <- saved`).
 *
 * `startUrl` is intentionally NOT restored — every launch starts with an
 * empty URL bar; recent URLs are surfaced via a dropdown instead.
 */
function loadInitialConfig(): CrawlConfig {
  if (typeof window === 'undefined' || !window.freecrawl) return DEFAULT_CRAWL_CONFIG;
  const saved = window.freecrawl.prefsGet('crawl-config');
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_CRAWL_CONFIG, startUrl: '' };
  return { ...DEFAULT_CRAWL_CONFIG, ...(saved as Partial<CrawlConfig>), startUrl: '' };
}

export const useAppStore = create<AppState>((set) => ({
  config: loadInitialConfig(),
  progress: null,
  summary: null,
  overview: null,
  activeTab: 'internal',
  activeCategory: 'internal:html',
  error: null,
  selectedUrlId: null,
  selectedUrlIds: [],
  sidebarOpen: true,
  detailPanelOpen: true,
  settingsOpen: false,
  recentUrls: loadRecentUrls(),
  dataVersion: 0,
  setConfig: (patch) =>
    set((state) => {
      const next = { ...state.config, ...patch };
      // Persist every config edit so the next launch starts from the
      // user's last settings — even fields the Settings dialog doesn't
      // expose (e.g. live URL / scope edits in the top bar).
      try {
        window.freecrawl?.prefsSet('crawl-config', next);
      } catch {
        // best-effort persistence
      }
      return { config: next };
    }),
  setProgress: (p) => set({ progress: p }),
  setSummary: (s) => set({ summary: s }),
  setOverview: (o) => set({ overview: o }),
  setActiveTab: (t) => set({ activeTab: t, activeCategory: categoryForTab(t) }),
  setActiveCategory: (c) => set({ activeCategory: c }),
  navigateToCategory: (c) => {
    // Some categories are only meaningful on specific tabs — switch the
    // active tab along with the category so the correct view renders.
    const tab = tabForCategory(c);
    set(tab ? { activeCategory: c, activeTab: tab } : { activeCategory: c });
  },
  setError: (e) => set({ error: e }),
  setSelectedUrlId: (id) => set({ selectedUrlId: id }),
  setSelectedUrlIds: (ids) => set({ selectedUrlIds: ids }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleDetailPanel: () => set((s) => ({ detailPanelOpen: !s.detailPanelOpen })),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  addRecentUrl: (url) =>
    set((state) => {
      const trimmed = url.trim();
      if (!trimmed) return state;
      const next = [trimmed, ...state.recentUrls.filter((u) => u !== trimmed)].slice(
        0,
        RECENT_URLS_MAX,
      );
      try {
        window.freecrawl?.prefsSet(RECENT_URLS_KEY, next);
      } catch {
        // best-effort persistence
      }
      return { recentUrls: next };
    }),
  bumpDataVersion: () => set((s) => ({ dataVersion: s.dataVersion + 1 })),
  reset: () =>
    set({
      progress: null,
      summary: null,
      overview: null,
      error: null,
      selectedUrlId: null,
      selectedUrlIds: [],
    }),
}));

function tabForCategory(cat: UrlCategory): TabKey | null {
  // V2 — Comprehensive sidebar-click → top-level tab routing. Lets the
  // user click any OverviewSidebar entry and land on the tab whose
  // table is best suited to render the filtered rows. Issue
  // sub-categories whose home tab isn't obvious stay on the current
  // tab (returning null leaves activeTab untouched).

  // Crawl Data → Internal tab
  if (cat.startsWith('internal:')) return 'internal';
  // External
  if (cat.startsWith('external:')) return 'external';
  // Response Codes group — including the bare 'all' entry which the
  // sidebar uses as the Response-Codes parent.
  if (cat === 'all' || cat.startsWith('status:')) return 'response-codes';
  // Security
  if (cat.startsWith('security:')) return 'security';
  // Indexability (Directives tab)
  if (cat.startsWith('indexability:')) return 'directives';

  // Tab-keyed categories — the OverviewSidebar uses these for the
  // dedicated tab landing entries.
  if (cat === 'tab:pagination') return 'pagination';
  if (cat === 'tab:hreflang') return 'hreflang';
  if (cat === 'tab:amp') return 'amp';
  if (cat === 'tab:structured-data') return 'structured-data';
  if (cat === 'tab:meta-refresh') return 'meta-refresh';
  if (cat === 'tab:custom-extraction') return 'custom-extraction';
  if (cat === 'tab:custom-search') return 'custom-search';
  if (cat === 'tab:security') return 'security';
  if (cat === 'tab:duplicates') return 'duplicates';
  if (cat === 'tab:serp') return 'serp';
  if (cat === 'tab:canonicals') return 'canonicals';
  if (cat === 'tab:directives') return 'directives';
  if (cat === 'tab:redirects') return 'redirects';

  // Issue groupings whose home tab is obvious.
  if (cat === 'issues:image-missing-alt' || cat === 'issues:image-empty-alt') {
    return 'images';
  }
  if (
    cat === 'issues:broken-links-all' ||
    cat === 'issues:broken-links-internal' ||
    cat === 'issues:broken-links-external' ||
    cat === 'issues:link-empty-anchor'
  ) {
    return 'broken-links';
  }
  if (cat.startsWith('issues:title-') || cat === 'issues:title-pixel-width-too-long') {
    return 'page-titles';
  }
  if (
    cat.startsWith('issues:meta-') ||
    cat === 'issues:description-equals-title' ||
    cat === 'issues:description-equals-h1'
  ) {
    // Note: meta-refresh-used is in the Document sidebar group — routed
    // to meta-refresh tab below to match the dedicated panel.
    if (cat === 'issues:meta-refresh-used') return 'meta-refresh';
    return 'meta-description';
  }
  if (cat.startsWith('issues:h1-')) return 'h1';
  if (cat === 'issues:heading-skipped-level') return 'h2';
  if (cat.startsWith('issues:canonical-')) return 'canonicals';
  if (cat === 'issues:multiple-canonicals') return 'canonicals';
  if (
    cat === 'issues:content-thin' ||
    cat === 'issues:page-empty' ||
    cat === 'issues:flesch-very-difficult' ||
    cat === 'issues:gunning-fog-very-high' ||
    cat === 'issues:page-large' ||
    cat === 'issues:page-too-large-critical' ||
    cat === 'issues:charset-missing'
  ) {
    return 'content';
  }
  if (
    cat.startsWith('issues:url-') ||
    cat === 'issues:query-string-too-long' ||
    cat === 'issues:folder-depth-too-deep' ||
    cat === 'issues:duplicate-url-post-norm'
  ) {
    return 'url';
  }
  if (cat.startsWith('issues:hreflang-')) return 'hreflang';
  if (cat.startsWith('issues:structured-data-') || cat.startsWith('issues:schema-')) {
    return 'structured-data';
  }
  if (cat.startsWith('issues:pagination-')) return 'pagination';
  if (
    cat === 'issues:near-duplicate' ||
    cat === 'issues:duplicate-content-exact'
  ) {
    return 'duplicates';
  }
  if (cat.startsWith('issues:redirect-')) return 'redirects';
  if (
    cat === 'issues:hsts-missing' ||
    cat === 'issues:hsts-no-preload' ||
    cat === 'issues:hsts-max-age-short' ||
    cat === 'issues:hsts-no-includesubdomains' ||
    cat === 'issues:x-frame-options-missing' ||
    cat === 'issues:x-content-type-options-missing' ||
    cat === 'issues:csp-missing' ||
    cat === 'issues:mixed-content' ||
    cat === 'issues:mixed-content-active' ||
    cat === 'issues:mixed-content-passive' ||
    cat === 'issues:insecure-form-action' ||
    cat === 'issues:missing-sri' ||
    cat === 'issues:cors-wildcard-with-credentials' ||
    cat === 'issues:cors-wildcard-origin' ||
    cat === 'issues:http-not-https' ||
    cat === 'issues:cookie-no-secure' ||
    cat === 'issues:cookie-no-httponly' ||
    cat === 'issues:cookie-no-samesite' ||
    cat.startsWith('issues:ssl-')
  ) {
    return 'security';
  }
  if (
    cat === 'issues:response-slow' ||
    cat === 'issues:response-very-slow' ||
    cat === 'issues:ttfb-slow' ||
    cat === 'issues:ttfb-very-slow'
  ) {
    return 'response-codes';
  }
  if (cat.startsWith('issues:analytics-')) return 'analytics';
  if (
    cat === 'issues:anchor-text-too-long' ||
    cat === 'issues:anchor-text-generic' ||
    cat === 'issues:target-blank-no-noopener' ||
    cat === 'issues:external-links-too-many' ||
    cat === 'issues:links-per-page-too-many' ||
    cat === 'issues:outlinks-zero' ||
    cat === 'issues:internal-link-to-redirect' ||
    cat === 'issues:dead-external-domain' ||
    cat === 'issues:js-only-navigation'
  ) {
    return 'links';
  }
  return null;
}

function categoryForTab(tab: TabKey): UrlCategory {
  switch (tab) {
    case 'internal':
      return 'internal:html';
    case 'external':
      return 'external:all';
    case 'response-codes':
      return 'all';
    case 'images':
      return 'all';
    case 'broken-links':
      return 'issues:broken-links-all';
    case 'canonicals':
      return 'tab:canonicals';
    case 'directives':
      return 'tab:directives';
    case 'redirects':
      return 'tab:redirects';
    case 'pagination':
      return 'tab:pagination';
    case 'hreflang':
      return 'tab:hreflang';
    case 'amp':
      return 'tab:amp';
    case 'structured-data':
      return 'tab:structured-data';
    case 'meta-refresh':
      return 'tab:meta-refresh';
    case 'custom-extraction':
      return 'tab:custom-extraction';
    case 'custom-search':
      return 'tab:custom-search';
    case 'security':
      return 'tab:security';
    case 'duplicates':
      return 'tab:duplicates';
    case 'serp':
      return 'tab:serp';
    default:
      return 'internal:html';
  }
}
