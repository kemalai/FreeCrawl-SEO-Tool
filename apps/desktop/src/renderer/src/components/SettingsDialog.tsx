import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
  SUPPORTED_LANGUAGES,
  changeLanguage,
  type SupportedLanguage,
} from '../i18n/index.js';
import { translateLabel } from '../i18n/labels.js';
import {
  X,
  ListChecks,
  Bug,
  Send,
  Filter,
  Search,
  Replace,
  Cpu,
  Copy,
  Code2,
  Cookie,
  Webhook,
  Download,
  Play,
  Plus,
  Trash2,
  Upload,
  Shield,
  Network,
  Sparkles,
  Gauge,
  FileText,
  AlertTriangle,
  Wrench,
  FolderOpen,
  SpellCheck,
  Lock,
  Languages,
  Plug,
  ExternalLink,
  BookOpen,
  Chrome,
  Target,
  Check,
  Workflow,
  ChevronRight,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import type {
  BrowserLoginConfig,
  CrawlConfig,
  CrawlMode,
  CrawlScope,
  CustomExtractionRule,
  FormLoginStep,
  HttpAuth,
  IntegrationDef,
  IntegrationsState,
  SpellingLanguageOption,
} from '@freecrawl/shared-types';
import { DEFAULT_CRAWL_CONFIG, INTEGRATIONS } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';
import { InfoTip, type FieldInfo } from './InfoTip.js';
import { ExtractionPreviewDialog } from './ExtractionPreviewDialog.js';
import { IntegrationSetupGuideModal } from './IntegrationSetupGuideModal.js';
import { GscSettingsSection } from './GscSettingsSection.js';
import { Ga4SettingsSection } from './Ga4SettingsSection.js';
import { GoogleAccountsSection } from './GoogleAccountsSection.js';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Local form state mirrors `CrawlConfig` but flattens the bag fields into
 * textarea-friendly strings. Only converted back to the structured shape
 * on Save, so a malformed regex / header line doesn't break the live
 * crawler config until the user explicitly commits.
 */
interface FormState {
  // mode
  mode: CrawlMode;
  urlListText: string;
  seedSitemapText: string;
  // crawler
  maxDepth: string;
  maxUrls: string;
  maxConcurrency: string;
  maxRps: string;
  requestTimeoutMs: string;
  crawlDelayMs: string;
  retryAttempts: string;
  retryInitialDelayMs: string;
  followRedirects: boolean;
  respectRobotsTxt: boolean;
  respectCrawlDelay: boolean;
  crawlExternal: boolean;
  checkImages: boolean;
  checkCss: boolean;
  checkJs: boolean;
  storeNofollowLinks: boolean;
  discoverSitemaps: boolean;
  // spider → crawl matrix
  scope: CrawlScope;
  storeImages: boolean;
  crawlMedia: boolean;
  storeMedia: boolean;
  storeCss: boolean;
  storeJs: boolean;
  crawlInternalLinks: boolean;
  storeInternalLinks: boolean;
  storeExternalLinks: boolean;
  storeCanonicals: boolean;
  storePagination: boolean;
  crawlHreflang: boolean;
  storeHreflang: boolean;
  crawlAmp: boolean;
  storeAmp: boolean;
  storeMetaRefresh: boolean;
  crawlIframes: boolean;
  storeIframes: boolean;
  crawlMobileAlternate: boolean;
  storeMobileAlternate: boolean;
  storeUncrawlableLinks: boolean;
  checkLinksOutsideStartFolder: boolean;
  followExternalNofollow: boolean;
  crawlInvalidLinks: boolean;
  crawlLinkedSitemaps: boolean;
  // requests
  userAgent: string;
  acceptLanguage: string;
  customHeadersText: string;
  // filters
  includePatternsText: string;
  excludePatternsText: string;
  customSearchTermsText: string;
  // url rewrites
  stripWww: boolean;
  forceHttps: boolean;
  lowercasePath: boolean;
  sortQueryParams: boolean;
  collapseDuplicateSlashes: boolean;
  maxRepeatedPathSegments: string;
  maxQueryParams: string;
  trailingSlash: 'leave' | 'strip' | 'add';
  keepQueryParamsText: string;
  urlRegexRewrites: Array<{ pattern: string; replacement: string; flags?: string }>;
  urlRewritePreview: string;
  // hardware
  memoryLimitMb: string;
  maxQueueSize: string;
  processPriority: 'normal' | 'below-normal' | 'idle';
  // duplicates
  nearDuplicateHammingThreshold: string;
  duplicatesOnlyIndexable: boolean;
  dedupePreNormalize: boolean;
  contentAreaSelector: string;
  // custom extraction
  customExtractionRules: CustomExtractionRule[];
  // webhook
  webhookUrl: string;
  // auth + network
  auth: HttpAuth;
  formLoginEnabled: boolean;
  formLoginMode: 'http' | 'browser';
  formLoginSteps: FormLoginStep[];
  formLoginBrowser: BrowserLoginConfig;
  proxyUrl: string;
  excludeExtensionsText: string;
  maxRedirects: string;
  // Wave 8 additions
  // crawl analysis (per-pass post-crawl toggles, Wave 6)
  analyseInlinks: boolean;
  analyseLinkScore: boolean;
  analyseRedirectChains: boolean;
  analyseHreflang: boolean;
  analyseDuplicates: boolean;
  analysePagination: boolean;
  analyseIssues: boolean;
  // content (body snapshot)
  storeBodySnapshots: boolean;
  bodySnapshotMaxBytes: string;
  // advanced (Wave 3 caps + URL/query thresholds)
  maxLinksPerPage: string;
  maxResponseTimeMs: string;
  maxFileSizeBytes: string;
  maxUrlLength: string;
  maxQueryStringLength: string;
  maxFolderDepth: string;
  followCanonicals: boolean;
  followPaginationLinks: boolean;
  followNofollow: boolean;
  followJsRedirects: boolean;
  // Wave 9 — Cookies / per-host UA / proxy profiles
  cookiePolicy: 'reject-all' | 'accept-all' | 'block-third-party';
  perHostUserAgents: { hostPattern: string; userAgent: string }[];
  proxyProfiles: { name: string; url: string }[];
  proxyProfileActive: string;
  // Faz 10 — page rendering strategy
  renderingMode: 'text' | 'ajax' | 'js';
  // V2 Faz 1 — JS render controls (only consulted when renderingMode = 'js')
  jsRenderHeadless: boolean;
  jsViewportWidth: string;
  jsViewportHeight: string;
  jsAjaxTimeoutMs: string;
  jsWaitSelector: string;
  jsWaitUntil: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
  jsBlockImages: boolean;
  jsBlockFonts: boolean;
  jsBlockMedia: boolean;
  jsBlockStylesheets: boolean;
  jsBlockScripts: boolean;
  jsBrowserChannel: '' | 'chrome' | 'msedge' | 'chrome-beta' | 'msedge-beta';
  jsPrerenderJs: string;
  jsMaxPages: string;
  // V2 Faz 1 Increment 3+4 — screenshot capture + mobile usability + LCP
  jsScreenshotMode: 'none' | 'fullpage' | 'fold' | 'both';
  jsMobileScreenshot: boolean;
  jsMobileUsability: boolean;
  jsLcpCandidate: boolean;
  jsA11yAudit: boolean;
  // V2 Faz 15 — performance budget
  budgetEnabled: boolean;
  budgetMaxResponseMs: string;
  budgetMaxPageKb: string;
  budgetMaxLcpMs: string;
  budgetMaxCls: string;
}

/**
 * Exported so callers elsewhere in the app can deep-link into a panel —
 * see `SettingsTarget` in the store.
 */
export type SettingsSectionKey =
  | 'presets'
  | 'mode'
  | 'crawler'
  | 'spider-crawl'
  | 'speed'
  | 'requests'
  | 'filters'
  | 'content'
  | 'custom-search'
  | 'custom-extraction'
  | 'url-rewriting'
  | 'duplicates'
  | 'auth'
  | 'network'
  | 'hardware'
  | 'webhook'
  | 'crawl-analysis'
  | 'issues'
  | 'advanced'
  | 'cookies'
  | 'per-host-ua'
  | 'integrations'
  | 'rendering'
  | 'performance-budget'
  | 'storage'
  | 'spelling'
  | 'privacy'
  | 'language'
  /** Per-integration sub-page, e.g. `integration:gsc`. Each integration
   *  gets its own page under the "Integrations" group header, so a
   *  provider's credentials and its behaviour settings are never mixed
   *  in with a dozen other providers on one scrolling page. */
  | `integration:${string}`;

/** Local alias — the exported name is the one other modules import. */
type SectionKey = SettingsSectionKey;

/** Sidebar key prefix for per-integration sub-pages. */
const INTEGRATION_KEY_PREFIX = 'integration:';

/** Build the sidebar key for one integration's sub-page. */
function integrationSectionKey(id: string): SectionKey {
  return `${INTEGRATION_KEY_PREFIX}${id}` as SectionKey;
}

/** Extract the integration id from a sub-page key (null when not one). */
function integrationIdFromSection(key: SectionKey): string | null {
  return key.startsWith(INTEGRATION_KEY_PREFIX)
    ? key.slice(INTEGRATION_KEY_PREFIX.length)
    : null;
}

interface SectionDef {
  key: SectionKey;
  label: string;
  icon: LucideIcon;
  /** Searchable keywords beyond the label. */
  keywords: string;
  /** A collapsible header rather than a page — clicking it expands its
   *  children instead of selecting content. */
  group?: true;
  /** Parent group key, for entries nested under a header. */
  parent?: SectionKey;
}

/** Sidebar icon per integration category — keeps the sub-page list
 *  scannable without inventing a bespoke icon for every provider. */
const INTEGRATION_CATEGORY_ICON: Record<IntegrationDef['category'], LucideIcon> = {
  ai: Sparkles,
  performance: Gauge,
  seo: Target,
  google: Chrome,
};

const SECTIONS: SectionDef[] = [
  {
    key: 'presets',
    label: 'Presets',
    icon: Sparkles,
    keywords: 'preset profile fast thorough mobile desktop aggressive',
  },
  {
    key: 'mode',
    label: 'Mode',
    icon: ListChecks,
    keywords: 'spider list url crawl mode',
  },
  {
    key: 'crawler',
    label: 'Crawler',
    icon: Bug,
    keywords:
      'depth max urls concurrency rps timeout delay retry follow redirects robots external nofollow sitemap',
  },
  {
    key: 'spider-crawl',
    label: 'Spider Crawl',
    icon: Workflow,
    keywords:
      'spider crawl store link types resource links page links images media css javascript internal hyperlinks external canonicals pagination hreflang amp meta refresh iframes mobile alternate uncrawlable start folder subdomains nofollow invalid xml sitemaps',
  },
  {
    key: 'speed',
    label: 'Speed',
    icon: Gauge,
    keywords:
      'speed throughput concurrency threads rps requests per second rate limit crawl delay throttle',
  },
  {
    key: 'requests',
    label: 'Requests',
    icon: Send,
    keywords: 'user agent accept language custom headers',
  },
  {
    key: 'filters',
    label: 'Include/Exclude',
    icon: Filter,
    keywords: 'include exclude patterns regex filter',
  },
  {
    key: 'custom-search',
    label: 'Custom Search',
    icon: Search,
    keywords: 'custom search term keyword substring text',
  },
  {
    key: 'custom-extraction',
    label: 'Custom Extraction',
    icon: Code2,
    keywords: 'custom extraction css selector xpath regex attribute scrape rule',
  },
  {
    key: 'url-rewriting',
    label: 'URL Rewriting',
    icon: Replace,
    keywords: 'url rewrite normalize www https lowercase trailing slash',
  },
  {
    key: 'auth',
    label: 'Authentication',
    icon: Shield,
    keywords: 'auth authentication basic bearer digest token password http header form login session cookie csrf',
  },
  {
    key: 'network',
    label: 'Network',
    icon: Network,
    keywords: 'network proxy https socks socks5 extension filter exclude redirect hop limit',
  },
  {
    key: 'duplicates',
    label: 'Duplicates',
    icon: Copy,
    keywords:
      'duplicate near similar content simhash hamming threshold cluster fingerprint',
  },
  {
    key: 'hardware',
    label: 'Hardware',
    icon: Cpu,
    keywords: 'hardware cpu ram memory queue limit priority resource usage',
  },
  {
    key: 'webhook',
    label: 'Webhook',
    icon: Webhook,
    keywords: 'webhook notify slack discord zapier post crawl complete',
  },
  {
    key: 'content',
    label: 'Content',
    icon: FileText,
    keywords:
      'content body source snapshot store html size cap thin word count text view source',
  },
  {
    key: 'crawl-analysis',
    label: 'Crawl Analysis',
    icon: ListChecks,
    keywords:
      'analysis post crawl inlinks redirect hreflang duplicate pagination issues materialise pass toggle',
  },
  {
    key: 'issues',
    label: 'Issues',
    icon: AlertTriangle,
    keywords: 'issues check filter enable disable severity false positive',
  },
  {
    key: 'advanced',
    label: 'Advanced',
    icon: Wrench,
    keywords:
      'advanced max links per page response time file size url length query folder depth follow canonical pagination nofollow js redirect',
  },
  {
    key: 'cookies',
    label: 'Cookies',
    icon: Cookie,
    keywords: 'cookie session reject accept block third party set-cookie policy',
  },
  {
    key: 'per-host-ua',
    label: 'Per-Host UA',
    icon: Send,
    keywords: 'per host user agent subdomain mobile desktop pattern wildcard',
  },
  {
    key: 'integrations',
    label: 'Integrations',
    icon: Plug,
    keywords:
      'integrations api key oauth google search console analytics gsc ga4 pagespeed ahrefs moz semrush majestic openai anthropic claude ollama sheets bigquery credentials',
    group: true,
  },
  // One sub-page per integration, generated from the shared catalog so a
  // new provider shows up in the sidebar without touching this file.
  ...INTEGRATIONS.map(
    (def): SectionDef => ({
      key: integrationSectionKey(def.id),
      label: def.name,
      icon: INTEGRATION_CATEGORY_ICON[def.category],
      keywords: `integration ${def.id} ${def.name} ${def.category} ${def.authType} ${def.description}`,
      parent: 'integrations',
    }),
  ),
  {
    key: 'rendering',
    label: 'Rendering',
    icon: Chrome,
    keywords:
      'rendering javascript js render playwright chromium browser headless headful viewport mobile desktop ajax timeout wait selector resource block image font script media css spa hydration',
  },
  {
    key: 'performance-budget',
    label: 'Performance Budget',
    icon: Target,
    keywords:
      'performance budget threshold response time ttfb page size weight lcp cls core web vitals ceiling limit over budget',
  },
  {
    key: 'storage',
    label: 'Storage',
    icon: FolderOpen,
    keywords: 'storage save folder directory project location path documents disk',
  },
  {
    key: 'spelling',
    label: 'Spelling',
    icon: SpellCheck,
    keywords: 'spelling grammar languagetool dictionary ignore words picky rule level yazım dilbilgisi sözlük',
  },
  {
    key: 'privacy',
    label: 'Privacy',
    icon: Lock,
    keywords: 'privacy telemetry analytics anonymous opt in out tracking data',
  },
  {
    key: 'language',
    label: 'Language',
    icon: Languages,
    keywords: 'language dil locale i18n internationalization english turkish ingilizce türkçe tr en',
  },
];

function configToForm(c: CrawlConfig): FormState {
  return {
    mode: c.mode,
    urlListText: (c.urlList ?? []).join('\n'),
    seedSitemapText: (c.seedSitemapUrls ?? []).join('\n'),
    maxDepth: String(c.maxDepth),
    maxUrls: String(c.maxUrls),
    maxConcurrency: String(c.maxConcurrency),
    maxRps: String(c.maxRps),
    requestTimeoutMs: String(c.requestTimeoutMs),
    crawlDelayMs: String(c.crawlDelayMs),
    retryAttempts: String(c.retryAttempts),
    retryInitialDelayMs: String(c.retryInitialDelayMs),
    followRedirects: c.followRedirects,
    respectRobotsTxt: c.respectRobotsTxt,
    respectCrawlDelay: c.respectCrawlDelay,
    crawlExternal: c.crawlExternal,
    checkImages: c.checkImages,
    checkCss: c.checkCss,
    checkJs: c.checkJs,
    storeNofollowLinks: c.storeNofollowLinks,
    discoverSitemaps: c.discoverSitemaps,
    scope: c.scope,
    storeImages: c.storeImages ?? true,
    crawlMedia: c.crawlMedia ?? false,
    storeMedia: c.storeMedia ?? false,
    storeCss: c.storeCss ?? true,
    storeJs: c.storeJs ?? true,
    crawlInternalLinks: c.crawlInternalLinks ?? true,
    storeInternalLinks: c.storeInternalLinks ?? true,
    storeExternalLinks: c.storeExternalLinks ?? true,
    storeCanonicals: c.storeCanonicals ?? true,
    storePagination: c.storePagination ?? true,
    crawlHreflang: c.crawlHreflang ?? false,
    storeHreflang: c.storeHreflang ?? true,
    crawlAmp: c.crawlAmp ?? false,
    storeAmp: c.storeAmp ?? true,
    storeMetaRefresh: c.storeMetaRefresh ?? true,
    crawlIframes: c.crawlIframes ?? false,
    storeIframes: c.storeIframes ?? false,
    crawlMobileAlternate: c.crawlMobileAlternate ?? false,
    storeMobileAlternate: c.storeMobileAlternate ?? true,
    storeUncrawlableLinks: c.storeUncrawlableLinks ?? true,
    checkLinksOutsideStartFolder: c.checkLinksOutsideStartFolder ?? true,
    followExternalNofollow: c.followExternalNofollow ?? false,
    crawlInvalidLinks: c.crawlInvalidLinks ?? false,
    crawlLinkedSitemaps: c.crawlLinkedSitemaps ?? false,
    userAgent: c.userAgent,
    acceptLanguage: c.acceptLanguage,
    customHeadersText: Object.entries(c.customHeaders ?? {})
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n'),
    includePatternsText: (c.includePatterns ?? []).join('\n'),
    excludePatternsText: (c.excludePatterns ?? []).join('\n'),
    customSearchTermsText: (c.customSearchTerms ?? []).join('\n'),
    stripWww: c.stripWww,
    forceHttps: c.forceHttps,
    lowercasePath: c.lowercasePath,
    sortQueryParams: c.sortQueryParams,
    collapseDuplicateSlashes: c.collapseDuplicateSlashes,
    maxRepeatedPathSegments: String(c.maxRepeatedPathSegments),
    maxQueryParams: String(c.maxQueryParams),
    trailingSlash: c.trailingSlash,
    keepQueryParamsText: (c.keepQueryParams ?? []).join('\n'),
    urlRegexRewrites: (c.urlRegexRewrites ?? []).map((r) => ({ ...r })),
    urlRewritePreview: '',
    memoryLimitMb: String(c.memoryLimitMb),
    maxQueueSize: String(c.maxQueueSize),
    processPriority: c.processPriority,
    nearDuplicateHammingThreshold: String(c.nearDuplicateHammingThreshold),
    duplicatesOnlyIndexable: c.duplicatesOnlyIndexable,
    dedupePreNormalize: c.dedupePreNormalize ?? true,
    contentAreaSelector: c.contentAreaSelector ?? '',
    customExtractionRules: (c.customExtractionRules ?? []).map((r) => ({ ...r })),
    webhookUrl: c.webhookUrl ?? '',
    auth: { ...(c.auth ?? { type: 'none' }) },
    formLoginEnabled: c.formLogin?.enabled ?? false,
    formLoginMode: c.formLogin?.mode ?? 'http',
    formLoginSteps: (c.formLogin?.steps ?? []).map((s) => ({
      ...s,
      fields: (s.fields ?? []).map((f) => ({ ...f })),
      captures: (s.captures ?? []).map((cp) => ({ ...cp })),
    })),
    formLoginBrowser: {
      loginUrl: c.formLogin?.browser?.loginUrl ?? '',
      usernameSelector: c.formLogin?.browser?.usernameSelector ?? '',
      usernameValue: c.formLogin?.browser?.usernameValue ?? '',
      passwordSelector: c.formLogin?.browser?.passwordSelector ?? '',
      passwordValue: c.formLogin?.browser?.passwordValue ?? '',
      submitSelector: c.formLogin?.browser?.submitSelector ?? '',
      successSelector: c.formLogin?.browser?.successSelector ?? '',
      waitMs: c.formLogin?.browser?.waitMs ?? 0,
    },
    proxyUrl: c.proxyUrl ?? '',
    excludeExtensionsText: (c.excludeExtensions ?? []).join(', '),
    maxRedirects: String(c.maxRedirects ?? 10),
    analyseInlinks: c.analyseInlinks ?? true,
    analyseLinkScore: c.analyseLinkScore ?? true,
    analyseRedirectChains: c.analyseRedirectChains ?? true,
    analyseHreflang: c.analyseHreflang ?? true,
    analyseDuplicates: c.analyseDuplicates ?? true,
    analysePagination: c.analysePagination ?? true,
    analyseIssues: c.analyseIssues ?? true,
    storeBodySnapshots: c.storeBodySnapshots ?? true,
    bodySnapshotMaxBytes: String(c.bodySnapshotMaxBytes ?? 1_048_576),
    maxLinksPerPage: String(c.maxLinksPerPage ?? 100),
    maxResponseTimeMs: String(c.maxResponseTimeMs ?? 0),
    maxFileSizeBytes: String(c.maxFileSizeBytes ?? 0),
    maxUrlLength: String(c.maxUrlLength ?? 2048),
    maxQueryStringLength: String(c.maxQueryStringLength ?? 0),
    maxFolderDepth: String(c.maxFolderDepth ?? 0),
    followCanonicals: c.followCanonicals ?? false,
    followPaginationLinks: c.followPaginationLinks ?? true,
    followNofollow: c.followNofollow ?? false,
    followJsRedirects: c.followJsRedirects ?? false,
    cookiePolicy: c.cookiePolicy ?? 'reject-all',
    perHostUserAgents: (c.perHostUserAgents ?? []).map((r) => ({ ...r })),
    proxyProfiles: (c.proxyProfiles ?? []).map((p) => ({ ...p })),
    proxyProfileActive: c.proxyProfileActive ?? '',
    renderingMode: c.renderingMode ?? 'text',
    jsRenderHeadless: c.jsRender?.headless ?? true,
    jsViewportWidth: String(c.jsRender?.viewportWidth ?? 1366),
    jsViewportHeight: String(c.jsRender?.viewportHeight ?? 768),
    jsAjaxTimeoutMs: String(c.jsRender?.ajaxTimeoutMs ?? 2000),
    jsWaitSelector: c.jsRender?.waitSelector ?? '',
    jsWaitUntil: c.jsRender?.waitUntil ?? 'load',
    jsBlockImages: c.jsRender?.blockResources?.image ?? false,
    jsBlockFonts: c.jsRender?.blockResources?.font ?? false,
    jsBlockMedia: c.jsRender?.blockResources?.media ?? true,
    jsBlockStylesheets: c.jsRender?.blockResources?.stylesheet ?? false,
    jsBlockScripts: c.jsRender?.blockResources?.script ?? false,
    jsBrowserChannel: c.jsRender?.browserChannel ?? '',
    jsPrerenderJs: c.jsRender?.prerenderJs ?? '',
    jsMaxPages: String(c.jsRender?.maxPages ?? 0),
    jsScreenshotMode: c.jsRender?.screenshotMode ?? 'none',
    jsMobileScreenshot: c.jsRender?.mobileScreenshot ?? false,
    jsMobileUsability: c.jsRender?.mobileUsability ?? false,
    jsLcpCandidate: c.jsRender?.lcpCandidate ?? false,
    jsA11yAudit: c.jsRender?.a11yAudit ?? false,
    budgetEnabled: c.performanceBudget?.enabled ?? false,
    budgetMaxResponseMs: String(c.performanceBudget?.maxResponseMs ?? 800),
    budgetMaxPageKb: String(
      Math.round((c.performanceBudget?.maxPageBytes ?? 1048576) / 1024),
    ),
    budgetMaxLcpMs: String(c.performanceBudget?.maxLcpMs ?? 2500),
    budgetMaxCls: String(c.performanceBudget?.maxCls ?? 0.1),
  };
}

function parseHeaders(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}

function parseLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function num(v: string, fallback: number): number {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function SettingsDialog({ open, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);
  const target = useAppStore((s) => s.settingsTarget);
  const [form, setForm] = useState<FormState>(() => configToForm(config));
  const [active, setActive] = useState<SectionKey>('mode');
  const [search, setSearch] = useState('');
  /** Collapsible sidebar groups the user has opened. */
  const [expandedGroups, setExpandedGroups] = useState<Set<SectionKey>>(
    () => new Set(),
  );

  // Re-seed the form whenever the dialog reopens — picks up any external
  // config change (e.g. URL/scope edits in the top bar) so the dialog
  // never shows stale values.
  useEffect(() => {
    if (open) {
      setForm(configToForm(config));
      setSearch('');
    }
  }, [open, config]);

  // Follow a deep link ("Add API Key…" and friends). Without a target the
  // dialog stays on whichever section the user last used. A target naming
  // an integration lands on that provider's own sub-page (and opens the
  // group so the selection is visible in the sidebar); a bare
  // `integrations` target falls back to the first provider, since the
  // group header itself is no longer a page.
  useEffect(() => {
    if (!open || !target) return;
    if (target.section === 'integrations') {
      const id = target.integration ?? INTEGRATIONS[0]?.id;
      if (id) {
        setActive(integrationSectionKey(id));
        setExpandedGroups((prev) => new Set(prev).add('integrations'));
      }
      return;
    }
    setActive(target.section);
  }, [open, target]);

  // Selecting a nested page opens its group so the highlighted row is
  // actually visible in the sidebar. Applied as a state change (not a
  // derived override) so the header stays collapsible afterwards.
  useEffect(() => {
    const parent = SECTIONS.find((s) => s.key === active)?.parent;
    if (!parent) return;
    setExpandedGroups((prev) => (prev.has(parent) ? prev : new Set(prev).add(parent)));
  }, [active]);

  // ESC closes — common modal expectation.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const visibleSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SECTIONS;
    const matches = (s: SectionDef): boolean =>
      s.label.toLowerCase().includes(q) || s.keywords.toLowerCase().includes(q);
    // Keep parent/child pairs intact. A matching child always brings its
    // header along, so no row is orphaned. A matching group expands to all
    // its children only when no child matched on its own — otherwise
    // searching "gsc" would list every provider, since the group's own
    // keywords name them all.
    const keep = new Set<SectionKey>();
    for (const s of SECTIONS) {
      if (matches(s) && !s.group) {
        keep.add(s.key);
        if (s.parent) keep.add(s.parent);
      }
    }
    for (const s of SECTIONS) {
      if (!s.group || !matches(s)) continue;
      keep.add(s.key);
      const children = SECTIONS.filter((c) => c.parent === s.key);
      if (!children.some((c) => keep.has(c.key))) {
        for (const c of children) keep.add(c.key);
      }
    }
    return SECTIONS.filter((s) => keep.has(s.key));
  }, [search]);

  // If the search filter hides the active section, jump to the first visible
  // page — group headers are skipped since they render no content.
  useEffect(() => {
    const pages = visibleSections.filter((s) => !s.group);
    if (pages.length === 0) return;
    if (!pages.some((s) => s.key === active)) {
      setActive(pages[0]!.key);
    }
  }, [visibleSections, active]);

  if (!open) return null;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  /**
   * Reset the in-progress form to the factory `DEFAULT_CRAWL_CONFIG`.
   * Only touches the local form — the user still has to click Save to
   * persist, and Cancel discards. We confirm first because this wipes
   * include/exclude patterns, custom-extraction rules, auth, proxy
   * profiles, etc. — all of which live in the same form.
   */
  function resetToDefaults() {
    const ok = window.confirm(
      t('settings.resetConfirm', {
        defaultValue:
          'Reset ALL crawl settings to their defaults?\n\nThis clears include/exclude patterns, custom search & extraction rules, URL rewrites, auth, proxy profiles, per-host user-agents, and webhook URL. Nothing is saved until you click Save — Cancel still discards.',
      }),
    );
    if (!ok) return;
    setForm(configToForm(DEFAULT_CRAWL_CONFIG));
  }

  function save() {
    setConfig({
      mode: form.mode,
      urlList: parseLines(form.urlListText),
      seedSitemapUrls: parseLines(form.seedSitemapText),
      maxDepth: Math.max(0, num(form.maxDepth, config.maxDepth)),
      maxUrls: Math.max(1, num(form.maxUrls, config.maxUrls)),
      maxConcurrency: Math.max(1, Math.min(200, num(form.maxConcurrency, config.maxConcurrency))),
      maxRps: Math.max(1, num(form.maxRps, config.maxRps)),
      requestTimeoutMs: Math.max(1000, num(form.requestTimeoutMs, config.requestTimeoutMs)),
      crawlDelayMs: Math.max(0, num(form.crawlDelayMs, config.crawlDelayMs)),
      retryAttempts: Math.max(0, num(form.retryAttempts, config.retryAttempts)),
      retryInitialDelayMs: Math.max(0, num(form.retryInitialDelayMs, config.retryInitialDelayMs)),
      followRedirects: form.followRedirects,
      respectRobotsTxt: form.respectRobotsTxt,
      respectCrawlDelay: form.respectCrawlDelay,
      crawlExternal: form.crawlExternal,
      checkImages: form.checkImages,
      checkCss: form.checkCss,
      checkJs: form.checkJs,
      storeNofollowLinks: form.storeNofollowLinks,
      discoverSitemaps: form.discoverSitemaps,
      scope: form.scope,
      storeImages: form.storeImages,
      crawlMedia: form.crawlMedia,
      storeMedia: form.storeMedia,
      storeCss: form.storeCss,
      storeJs: form.storeJs,
      crawlInternalLinks: form.crawlInternalLinks,
      storeInternalLinks: form.storeInternalLinks,
      storeExternalLinks: form.storeExternalLinks,
      storeCanonicals: form.storeCanonicals,
      storePagination: form.storePagination,
      crawlHreflang: form.crawlHreflang,
      storeHreflang: form.storeHreflang,
      crawlAmp: form.crawlAmp,
      storeAmp: form.storeAmp,
      storeMetaRefresh: form.storeMetaRefresh,
      crawlIframes: form.crawlIframes,
      storeIframes: form.storeIframes,
      crawlMobileAlternate: form.crawlMobileAlternate,
      storeMobileAlternate: form.storeMobileAlternate,
      storeUncrawlableLinks: form.storeUncrawlableLinks,
      checkLinksOutsideStartFolder: form.checkLinksOutsideStartFolder,
      followExternalNofollow: form.followExternalNofollow,
      crawlInvalidLinks: form.crawlInvalidLinks,
      crawlLinkedSitemaps: form.crawlLinkedSitemaps,
      userAgent: form.userAgent.trim() || config.userAgent,
      acceptLanguage: form.acceptLanguage.trim() || config.acceptLanguage,
      customHeaders: parseHeaders(form.customHeadersText),
      includePatterns: parseLines(form.includePatternsText),
      excludePatterns: parseLines(form.excludePatternsText),
      customSearchTerms: parseLines(form.customSearchTermsText),
      stripWww: form.stripWww,
      forceHttps: form.forceHttps,
      lowercasePath: form.lowercasePath,
      sortQueryParams: form.sortQueryParams,
      collapseDuplicateSlashes: form.collapseDuplicateSlashes,
      maxRepeatedPathSegments: Math.max(0, num(form.maxRepeatedPathSegments, config.maxRepeatedPathSegments)),
      maxQueryParams: Math.max(0, num(form.maxQueryParams, config.maxQueryParams)),
      trailingSlash: form.trailingSlash,
      keepQueryParams: parseLines(form.keepQueryParamsText)
        .map((s) => s.trim())
        .filter(Boolean),
      urlRegexRewrites: form.urlRegexRewrites
        .map((r) => ({
          pattern: r.pattern.trim(),
          replacement: r.replacement,
          flags: r.flags?.trim() || undefined,
        }))
        .filter((r) => r.pattern !== ''),
      memoryLimitMb: Math.max(0, num(form.memoryLimitMb, config.memoryLimitMb)),
      maxQueueSize: Math.max(0, num(form.maxQueueSize, config.maxQueueSize)),
      processPriority: form.processPriority,
      nearDuplicateHammingThreshold: Math.max(
        0,
        Math.min(
          12,
          num(form.nearDuplicateHammingThreshold, config.nearDuplicateHammingThreshold),
        ),
      ),
      duplicatesOnlyIndexable: form.duplicatesOnlyIndexable,
      dedupePreNormalize: form.dedupePreNormalize,
      contentAreaSelector: form.contentAreaSelector.trim(),
      customExtractionRules: form.customExtractionRules
        .filter((r) => r.name.trim() && r.selector.trim())
        .slice(0, 10),
      webhookUrl: form.webhookUrl.trim(),
      auth: form.auth,
      formLogin: {
        enabled: form.formLoginEnabled,
        mode: form.formLoginMode,
        steps: form.formLoginSteps
          .map((s) => ({
            url: s.url.trim(),
            method: s.method,
            fields: (s.fields ?? []).filter((f) => f.name.trim()),
            captures: (s.captures ?? []).filter((c) => c.name.trim() && c.selector.trim()),
          }))
          .filter((s) => s.url),
        browser: {
          loginUrl: form.formLoginBrowser.loginUrl.trim(),
          usernameSelector: form.formLoginBrowser.usernameSelector.trim(),
          usernameValue: form.formLoginBrowser.usernameValue,
          passwordSelector: form.formLoginBrowser.passwordSelector.trim(),
          passwordValue: form.formLoginBrowser.passwordValue,
          submitSelector: form.formLoginBrowser.submitSelector.trim(),
          successSelector: (form.formLoginBrowser.successSelector ?? '').trim(),
          waitMs: Math.max(0, num(String(form.formLoginBrowser.waitMs ?? 0), 0)),
        },
      },
      proxyUrl: form.proxyUrl.trim(),
      excludeExtensions: form.excludeExtensionsText
        .split(/[\s,]+/)
        .map((s) => s.trim().toLowerCase().replace(/^\./, ''))
        .filter(Boolean),
      maxRedirects: Math.max(0, num(form.maxRedirects, config.maxRedirects)),
      analyseInlinks: form.analyseInlinks,
      analyseLinkScore: form.analyseLinkScore,
      analyseRedirectChains: form.analyseRedirectChains,
      analyseHreflang: form.analyseHreflang,
      analyseDuplicates: form.analyseDuplicates,
      analysePagination: form.analysePagination,
      analyseIssues: form.analyseIssues,
      storeBodySnapshots: form.storeBodySnapshots,
      bodySnapshotMaxBytes: Math.max(
        0,
        num(form.bodySnapshotMaxBytes, config.bodySnapshotMaxBytes),
      ),
      maxLinksPerPage: Math.max(0, num(form.maxLinksPerPage, config.maxLinksPerPage)),
      maxResponseTimeMs: Math.max(
        0,
        num(form.maxResponseTimeMs, config.maxResponseTimeMs),
      ),
      maxFileSizeBytes: Math.max(
        0,
        num(form.maxFileSizeBytes, config.maxFileSizeBytes),
      ),
      maxUrlLength: Math.max(0, num(form.maxUrlLength, config.maxUrlLength)),
      maxQueryStringLength: Math.max(
        0,
        num(form.maxQueryStringLength, config.maxQueryStringLength),
      ),
      maxFolderDepth: Math.max(0, num(form.maxFolderDepth, config.maxFolderDepth)),
      followCanonicals: form.followCanonicals,
      followPaginationLinks: form.followPaginationLinks,
      followNofollow: form.followNofollow,
      followJsRedirects: form.followJsRedirects,
      cookiePolicy: form.cookiePolicy,
      perHostUserAgents: form.perHostUserAgents
        .map((r) => ({
          hostPattern: r.hostPattern.trim(),
          userAgent: r.userAgent.trim(),
        }))
        .filter((r) => r.hostPattern && r.userAgent),
      proxyProfiles: form.proxyProfiles
        .map((p) => ({ name: p.name.trim(), url: p.url.trim() }))
        .filter((p) => p.name && p.url),
      proxyProfileActive: form.proxyProfileActive.trim(),
      renderingMode: form.renderingMode,
      jsRender: {
        headless: form.jsRenderHeadless,
        viewportWidth:
          Number.parseInt(form.jsViewportWidth, 10) > 0
            ? Number.parseInt(form.jsViewportWidth, 10)
            : 1366,
        viewportHeight:
          Number.parseInt(form.jsViewportHeight, 10) > 0
            ? Number.parseInt(form.jsViewportHeight, 10)
            : 768,
        ajaxTimeoutMs:
          Number.parseInt(form.jsAjaxTimeoutMs, 10) >= 0
            ? Number.parseInt(form.jsAjaxTimeoutMs, 10)
            : 2000,
        waitSelector: form.jsWaitSelector.trim(),
        waitUntil: form.jsWaitUntil,
        blockResources: {
          image: form.jsBlockImages,
          font: form.jsBlockFonts,
          media: form.jsBlockMedia,
          stylesheet: form.jsBlockStylesheets,
          script: form.jsBlockScripts,
        },
        browserChannel: form.jsBrowserChannel,
        prerenderJs: form.jsPrerenderJs,
        maxPages:
          Number.parseInt(form.jsMaxPages, 10) >= 0
            ? Number.parseInt(form.jsMaxPages, 10)
            : 0,
        screenshotMode: form.jsScreenshotMode,
        mobileScreenshot: form.jsMobileScreenshot,
        mobileUsability: form.jsMobileUsability,
        lcpCandidate: form.jsLcpCandidate,
        a11yAudit: form.jsA11yAudit,
      },
      performanceBudget: {
        enabled: form.budgetEnabled,
        maxResponseMs: Math.max(0, num(form.budgetMaxResponseMs, 800)),
        maxPageBytes: Math.max(0, num(form.budgetMaxPageKb, 1024)) * 1024,
        maxLcpMs: Math.max(0, num(form.budgetMaxLcpMs, 2500)),
        maxCls: Math.max(0, Number.parseFloat(form.budgetMaxCls) || 0),
      },
    });
    onClose();
  }

  const activeDef = SECTIONS.find((s) => s.key === active) ?? SECTIONS[0]!;
  const parentDef = activeDef.parent
    ? SECTIONS.find((s) => s.key === activeDef.parent)
    : undefined;
  const searching = search.trim().length > 0;

  /** A group renders open when the user opened it, or while a search is
   *  narrowing the list (so matches are never hidden behind a collapsed
   *  header). Selecting a child auto-opens its group once, via the effect
   *  above — deriving openness from the selection instead would make the
   *  header un-collapsible while one of its pages is active. */
  function isGroupOpen(key: SectionKey): boolean {
    return searching || expandedGroups.has(key);
  }

  function toggleGroup(key: SectionKey) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] max-h-[760px] w-[920px] max-w-[95vw] flex-col overflow-hidden rounded-md border border-surface-700 bg-surface-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-surface-800 px-4 py-2.5">
          <div className="text-sm font-semibold tracking-wide text-surface-100">
            {t('settings.title', { defaultValue: 'Settings' })}
          </div>
          <button
            className="ml-auto rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
            onClick={onClose}
            title={t('settings.closeTooltip', { defaultValue: 'Close (Esc)' })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <aside className="flex w-56 flex-col border-r border-surface-800 bg-surface-950/40">
            <div className="border-b border-surface-800 p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-500" />
                <input
                  className="w-full rounded border border-surface-700 bg-surface-950 py-1 pl-7 pr-2 text-[11px] text-surface-100 placeholder-surface-500 focus:border-blue-500 focus:outline-none"
                  placeholder={t('settings.searchPlaceholder', { defaultValue: 'Search…' })}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  spellCheck={false}
                />
              </div>
            </div>
            <nav className="flex-1 overflow-auto py-1">
              {visibleSections.length === 0 && (
                <div className="px-3 py-2 text-[11px] text-surface-500">
                  {t('settings.noMatches', { defaultValue: 'No matches' })}
                </div>
              )}
              {visibleSections.map((s) => {
                const Icon = s.icon;

                // Group header — expands/collapses its children instead of
                // selecting a page of its own.
                if (s.group) {
                  const open = isGroupOpen(s.key);
                  const Chevron = open ? ChevronDown : ChevronRight;
                  return (
                    <button
                      key={s.key}
                      className="flex w-full items-center gap-2 border-l-2 border-transparent px-3 py-1.5 text-left text-[12px] text-surface-300 transition-colors hover:bg-surface-800 hover:text-surface-100"
                      onClick={() => toggleGroup(s.key)}
                      aria-expanded={open}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{translateLabel(s.label, lang)}</span>
                      <Chevron className="ml-auto h-3.5 w-3.5 text-surface-500" />
                    </button>
                  );
                }

                // Child page — only rendered while its group is open.
                if (s.parent && !isGroupOpen(s.parent)) return null;

                const isActive = s.key === active;
                return (
                  <button
                    key={s.key}
                    className={clsx(
                      'flex w-full items-center gap-2 py-1.5 text-left text-[12px] transition-colors',
                      s.parent ? 'pl-8 pr-3' : 'px-3',
                      isActive
                        ? 'bg-accent-600/20 text-accent-200 border-l-2 border-accent-500'
                        : 'border-l-2 border-transparent text-surface-300 hover:bg-surface-800 hover:text-surface-100',
                    )}
                    onClick={() => setActive(s.key)}
                    // Long provider names truncate in the narrow sidebar.
                    title={translateLabel(s.label, lang)}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{translateLabel(s.label, lang)}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex flex-1 flex-col min-w-0">
            <div className="border-b border-surface-800 px-5 py-2 text-[11px] text-surface-400">
              {t('settings.title', { defaultValue: 'Settings' })}{' '}
              <span className="mx-1 text-surface-600">›</span>
              {parentDef && (
                <>
                  <span>{translateLabel(parentDef.label, lang)}</span>
                  <span className="mx-1 text-surface-600">›</span>
                </>
              )}
              <span className="text-surface-200">{translateLabel(activeDef.label, lang)}</span>
            </div>
            <div className="flex-1 overflow-auto px-5 py-4 text-[12px]">
              {active === 'presets' && (
                <PresetsPanel
                  applyPreset={(p) => setForm((s) => applyPreset(s, p))}
                  exportSettings={async () => {
                    // Export the saved CrawlConfig (not the in-progress form),
                    // so what's exported matches what's been persisted.
                    await window.freecrawl.prefsExportSettings({
                      config: config as unknown as Record<string, unknown>,
                    });
                  }}
                  importSettings={async () => {
                    const r = await window.freecrawl.prefsImportSettings();
                    if (!r.config) return;
                    // Apply the imported config to the live store. The form
                    // re-seeds via useEffect when `config` changes.
                    setConfig(r.config as Partial<CrawlConfig>);
                    if (r.unknownFields.length > 0) {
                      // Surface unknown fields as a non-fatal warning by
                      // logging — Settings UI doesn't have a toast system.
                      // eslint-disable-next-line no-console
                      console.warn(
                        `Import: ignored unknown fields: ${r.unknownFields.join(', ')}`,
                      );
                    }
                  }}
                />
              )}
              {active === 'mode' && (
                <ModePanel form={form} update={update} />
              )}
              {active === 'crawler' && (
                <CrawlerPanel form={form} update={update} />
              )}
              {active === 'spider-crawl' && (
                <SpiderCrawlPanel form={form} update={update} />
              )}
              {active === 'speed' && (
                <SpeedPanel form={form} update={update} />
              )}
              {active === 'requests' && (
                <RequestsPanel form={form} update={update} />
              )}
              {active === 'filters' && (
                <FiltersPanel form={form} update={update} />
              )}
              {active === 'custom-search' && (
                <CustomSearchPanel form={form} update={update} />
              )}
              {active === 'custom-extraction' && (
                <CustomExtractionPanel form={form} update={update} />
              )}
              {active === 'url-rewriting' && (
                <UrlRewritingPanel form={form} update={update} />
              )}
              {active === 'duplicates' && (
                <DuplicatesPanel form={form} update={update} />
              )}
              {active === 'auth' && (
                <AuthPanel form={form} update={update} />
              )}
              {active === 'network' && (
                <NetworkPanel form={form} update={update} />
              )}
              {active === 'hardware' && (
                <HardwarePanel form={form} update={update} />
              )}
              {active === 'webhook' && (
                <WebhookPanel form={form} update={update} />
              )}
              {active === 'content' && (
                <ContentPanel form={form} update={update} />
              )}
              {active === 'crawl-analysis' && (
                <CrawlAnalysisPanel form={form} update={update} />
              )}
              {active === 'issues' && <IssuesPanel />}
              {active === 'advanced' && (
                <AdvancedPanel form={form} update={update} />
              )}
              {active === 'cookies' && (
                <CookiesPanel form={form} update={update} />
              )}
              {active === 'per-host-ua' && (
                <PerHostUaPanel form={form} update={update} />
              )}
              {integrationIdFromSection(active) && (
                <IntegrationPage id={integrationIdFromSection(active)!} />
              )}
              {active === 'rendering' && (
                <RenderingPanel form={form} update={update} />
              )}
              {active === 'performance-budget' && (
                <PerformanceBudgetPanel form={form} update={update} />
              )}
              {active === 'storage' && <StoragePanel />}
              {active === 'spelling' && <SpellingPanel />}
              {active === 'privacy' && <PrivacyPanel />}
              {active === 'language' && <LanguagePanel />}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-surface-800 px-4 py-2.5">
          <button
            className="rounded border border-surface-700 px-3 py-1 text-[11px] text-surface-300 hover:bg-surface-800 hover:text-surface-100"
            onClick={resetToDefaults}
            title={t('settings.resetTooltip', {
              defaultValue:
                'Reset every crawl setting to its factory default (you still have to Save)',
            })}
          >
            {t('settings.resetToDefaults', { defaultValue: 'Reset to Defaults' })}
          </button>
          <div className="flex items-center gap-2">
            <button
              className="rounded border border-surface-700 px-3 py-1 text-[11px] hover:bg-surface-800"
              onClick={onClose}
            >
              {t('settings.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              className="rounded bg-blue-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-500"
              onClick={save}
            >
              {t('settings.save', { defaultValue: 'Save' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PanelProps {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}

type PresetKey = 'fast' | 'thorough' | 'mobile' | 'desktop' | 'aggressive';

interface PresetDef {
  key: PresetKey;
  label: string;
  description: string;
  /** Field overrides applied when the user clicks the preset. */
  overrides: Partial<FormState>;
}

const UA_GOOGLEBOT_DESKTOP =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const UA_GOOGLEBOT_MOBILE =
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const UA_CHROME_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';
const UA_CHROME_MOBILE =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36';
const UA_BINGBOT =
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)';
const UA_FREECRAWL = DEFAULT_CRAWL_CONFIG.userAgent;

/**
 * Quick-switch User-Agent presets. Picking one fills the User-Agent
 * field below — the user can still hand-edit afterwards. The first
 * entry is a no-op placeholder so the select can show "Custom / pick a
 * preset…" while the field holds an unrecognised string.
 */
const UA_PRESETS: { label: string; ua: string }[] = [
  { label: 'Googlebot — Smartphone', ua: UA_GOOGLEBOT_MOBILE },
  { label: 'Googlebot — Desktop', ua: UA_GOOGLEBOT_DESKTOP },
  { label: 'Chrome — Desktop', ua: UA_CHROME_DESKTOP },
  { label: 'Chrome — Mobile (Pixel)', ua: UA_CHROME_MOBILE },
  { label: 'Bingbot', ua: UA_BINGBOT },
  { label: 'FreeCrawl SEO (default)', ua: UA_FREECRAWL },
];

const PRESETS: PresetDef[] = [
  {
    key: 'fast',
    label: 'Fast',
    description:
      'High concurrency, short timeouts — for a quick first sweep on a healthy site. Skips media + retries.',
    overrides: {
      maxConcurrency: '40',
      maxRps: '40',
      requestTimeoutMs: '10000',
      crawlDelayMs: '0',
      retryAttempts: '0',
      retryInitialDelayMs: '250',
      excludeExtensionsText: 'pdf,zip,mp4,mp3,webm,mov,avi,iso,exe,dmg',
      maxRedirects: '5',
    },
  },
  {
    key: 'thorough',
    label: 'Thorough',
    description:
      'Lower concurrency + extra retries; captures more on flaky origins. The default for large audits.',
    overrides: {
      maxConcurrency: '10',
      maxRps: '10',
      requestTimeoutMs: '30000',
      crawlDelayMs: '0',
      retryAttempts: '3',
      retryInitialDelayMs: '750',
      maxRedirects: '15',
    },
  },
  {
    key: 'mobile',
    label: 'Mobile-only',
    description:
      'Mimic Googlebot Smartphone — primary signal for mobile-first indexing. Combine with viewport audits.',
    overrides: {
      userAgent: UA_GOOGLEBOT_MOBILE,
      acceptLanguage: 'en-US,en;q=0.9',
      maxConcurrency: '15',
      maxRps: '15',
    },
  },
  {
    key: 'desktop',
    label: 'Desktop-only',
    description: 'Mimic legacy Googlebot Desktop. Useful for comparing mobile vs. desktop renders.',
    overrides: {
      userAgent: UA_GOOGLEBOT_DESKTOP,
      acceptLanguage: 'en-US,en;q=0.9',
      maxConcurrency: '15',
      maxRps: '15',
    },
  },
  {
    key: 'aggressive',
    label: 'Aggressive',
    description:
      'High parallelism + ignore robots — only for sites you own. Can trip rate-limit / WAF rules; use with caution.',
    overrides: {
      maxConcurrency: '60',
      maxRps: '60',
      requestTimeoutMs: '15000',
      crawlDelayMs: '0',
      retryAttempts: '2',
      respectRobotsTxt: false,
      crawlExternal: false,
    },
  },
];

function applyPreset(state: FormState, preset: PresetDef): FormState {
  // Spread the preset's overrides over the current form so untouched
  // fields (custom search terms, extraction rules, etc.) survive a preset
  // switch — only the dimensions the preset cares about change.
  return { ...state, ...preset.overrides };
}

function PresetsPanel({
  applyPreset: apply,
  exportSettings,
  importSettings,
}: {
  applyPreset: (p: PresetDef) => void;
  exportSettings: () => Promise<void>;
  importSettings: () => Promise<void>;
}) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Which preset was just applied. Drives the confirmation banner + the
  // button's "Applied ✓" state so the click has a visible result — the
  // fields it changes live on other panels, so without this the button
  // looks inert.
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  const appliedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (appliedTimer.current) clearTimeout(appliedTimer.current);
    },
    [],
  );

  const onApply = (p: PresetDef) => {
    apply(p);
    setAppliedKey(p.key);
    if (appliedTimer.current) clearTimeout(appliedTimer.current);
    appliedTimer.current = setTimeout(() => setAppliedKey(null), 4000);
  };

  const appliedPreset = PRESETS.find((p) => p.key === appliedKey) ?? null;

  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.presets.intro', { defaultValue: 'One-click profiles for common crawl scenarios. Clicking a preset overwrites the affected fields only — your URL list, custom rules, filters, and extraction rules are preserved.' })}
      </p>
      {appliedPreset && (
        <div className="mb-3 flex items-center gap-2 rounded border border-emerald-700/50 bg-emerald-900/25 px-3 py-1.5 text-[11px] text-emerald-200">
          <Check className="h-3.5 w-3.5 shrink-0" />
          <span>
            {t('settingsPanels.presets.applied', {
              defaultValue:
                '"{{name}}" preset applied — review the panels, then press Save to keep the changes.',
              name: translateLabel(appliedPreset.label, i18n.language),
            })}
          </span>
        </div>
      )}
      <div className="space-y-2">
        {PRESETS.map((p) => {
          const justApplied = appliedKey === p.key;
          return (
            <div
              key={p.key}
              className={clsx(
                'flex items-start gap-3 rounded border bg-surface-950/40 p-3 transition-colors',
                justApplied ? 'border-emerald-700/50' : 'border-surface-800',
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-surface-100">{translateLabel(p.label, i18n.language)}</div>
                <div className="mt-0.5 text-[11px] text-surface-400">{translateLabel(p.description, i18n.language)}</div>
                <div className="mt-1.5 flex flex-wrap gap-1 font-mono text-[10px] text-surface-500">
                  {Object.entries(p.overrides).map(([k, v]) => (
                    <span key={k} className="rounded border border-surface-800 px-1.5 py-0.5">
                      {k}={String(v)}
                    </span>
                  ))}
                </div>
              </div>
              <button
                className={clsx(
                  'inline-flex items-center gap-1 rounded border px-3 py-1 text-[11px] transition-colors',
                  justApplied
                    ? 'border-emerald-600/70 bg-emerald-900/40 text-emerald-200'
                    : 'border-blue-700/60 bg-blue-900/30 text-blue-200 hover:bg-blue-900/50',
                )}
                onClick={() => onApply(p)}
              >
                {justApplied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    {t('common.applied', { defaultValue: 'Applied' })}
                  </>
                ) : (
                  t('common.apply', { defaultValue: 'Apply' })
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-5 border-t border-surface-800 pt-4">
        <div className="mb-2 text-[12px] font-medium text-surface-100">{t('settingsPanels.presets.importExport', { defaultValue: 'Import / Export' })}</div>
        <p className="mb-2 text-[11px] text-surface-400">
          {t('settingsPanels.presets.importExportIntro', { defaultValue: "Save the current settings to a JSON file (e.g. for sharing with a teammate or version control), or load a previously-exported settings file. Importing replaces the current form with the file's contents — press Save at the bottom to persist." })}
        </p>
        <div className="flex gap-2">
          <button
            className="rounded border border-surface-700 px-3 py-1 text-[11px] hover:bg-surface-800 disabled:opacity-50"
            onClick={async () => {
              setBusy(true);
              setMessage(null);
              try {
                await exportSettings();
                setMessage(t('settingsPanels.presets.exported', { defaultValue: 'Settings exported.' }));
              } catch (e) {
                setMessage(t('settingsPanels.presets.exportFailed', { defaultValue: 'Export failed: {{msg}}', msg: (e as Error).message }));
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            {t('settingsPanels.presets.exportBtn', { defaultValue: 'Export…' })}
          </button>
          <button
            className="rounded border border-surface-700 px-3 py-1 text-[11px] hover:bg-surface-800 disabled:opacity-50"
            onClick={async () => {
              setBusy(true);
              setMessage(null);
              try {
                await importSettings();
                setMessage(t('settingsPanels.presets.imported', { defaultValue: 'Settings imported.' }));
              } catch (e) {
                setMessage(t('settingsPanels.presets.importFailed', { defaultValue: 'Import failed: {{msg}}', msg: (e as Error).message }));
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            {t('settingsPanels.presets.importBtn', { defaultValue: 'Import…' })}
          </button>
          {message && <span className="self-center text-[10px] text-surface-400">{message}</span>}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-surface-500">
        {t('settingsPanels.presets.outro', { defaultValue: 'After clicking Apply or Import, review each panel to verify the values, then press Save at the bottom to persist.' })}
      </p>
    </>
  );
}

function ModePanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.mode.intro', { defaultValue: 'Choose how the crawler discovers URLs. Spider follows links from a start URL; List fetches a fixed set; Sitemap crawls the URLs listed in a sitemap.' })}
      </p>
      <label className="mb-2 flex flex-col gap-1">
        <FieldLabel
          label={t('settingsPanels.mode.crawlMode', { defaultValue: 'Crawl Mode' })}
          info="Spider follows links from the start URL across the chosen scope. List fetches a fixed set of URLs once with no link-following. Sitemap fetches a sitemap URL and crawls every page it lists (no link-following)."
          example="Spider for full site audits; List for re-checking a known set of pages; Sitemap to audit exactly what's published in sitemap.xml."
        />
        <select
          className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
          value={form.mode}
          onChange={(e) => update('mode', e.target.value as CrawlMode)}
        >
          <option value="spider">
            {t('settingsPanels.mode.spiderOption', { defaultValue: 'Spider — start URL + follow links' })}
          </option>
          <option value="list">
            {t('settingsPanels.mode.listOption', { defaultValue: 'List — fetch a fixed URL list, no link follow' })}
          </option>
          <option value="sitemap">
            {t('settingsPanels.mode.sitemapOption', { defaultValue: 'Sitemap — crawl the URLs listed in a sitemap' })}
          </option>
        </select>
      </label>
      {form.mode === 'list' && (
        <Area
          label={t('settingsPanels.mode.urlList', { defaultValue: 'URL List (one URL per line)' })}
          value={form.urlListText}
          onChange={(v) => update('urlListText', v)}
          rows={10}
          placeholder={'https://example.com/\nhttps://example.com/about\nhttps://example.com/contact'}
          info="One URL per line. Each is fetched exactly once; outlinks are NOT followed. Comments starting with # are ignored."
          example={'https://example.com/about\nhttps://example.com/pricing\n# old urls\nhttps://example.com/legacy'}
        />
      )}
      {form.mode === 'sitemap' && (
        <p className="rounded border border-blue-700/40 bg-blue-900/15 px-3 py-2 text-[11px] text-blue-200">
          {t('settingsPanels.mode.sitemapHint', {
            defaultValue:
              'Enter the sitemap (or sitemap-index) URL in the top bar, then press Start. Every page listed is crawled once and also recorded for the orphan / sitemap reports.',
          })}
        </p>
      )}
      {form.mode === 'spider' && (
        <Area
          label={t('settingsPanels.mode.seedSitemap', { defaultValue: 'Seed from sitemap URL(s) — optional' })}
          value={form.seedSitemapText}
          onChange={(v) => update('seedSitemapText', v)}
          rows={4}
          placeholder={'https://example.com/sitemap.xml'}
          info="One sitemap URL per line. On top of following links from the start URL, the crawler fetches these sitemaps and queues every page they list as an extra seed — faster/more complete discovery, and reliable orphan detection even when the sitemap lives at a non-standard path. Leave empty to disable."
          example={'https://example.com/sitemap_index.xml\nhttps://example.com/news-sitemap.xml'}
        />
      )}
    </>
  );
}

function CrawlerPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.crawler.intro', { defaultValue: 'Traversal limits and crawl-scope toggles. Screaming Frog equivalents shown in parentheses.' })}
      </p>

      <div className="mb-4 rounded border border-blue-700/40 bg-blue-900/15 px-3 py-2 text-[11px] text-blue-200">
        <span className="font-medium">{t('settingsPanels.crawler.speedHintPrefix', { defaultValue: 'Looking for crawl speed?' })}</span>{' '}
        {t('settingsPanels.crawler.speedHintBody', { defaultValue: 'Thread count, requests per second, per-request delay, and retries live in the' })}{' '}
        <span className="font-medium">{t('settingsPanels.crawler.speedHintLink', { defaultValue: 'Speed' })}</span>{' '}
        {t('settingsPanels.crawler.speedHintSuffix', { defaultValue: "section — that's where you cap how fast the crawler hits a server." })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Num
          label={t('settingsPanels.crawler.maxDepth', { defaultValue: 'Crawl Depth Limit (Max Depth)' })}
          value={form.maxDepth}
          onChange={(v) => update('maxDepth', v)}
          info="Hop count from the start URL. Start URL is depth 0; its outlinks are depth 1, theirs depth 2, and so on. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits)."
          example="10 covers most sites; 3 limits crawls to top-of-funnel pages only."
        />
        <Num
          label={t('settingsPanels.crawler.maxUrls', { defaultValue: 'Crawl Total Limit (Max URLs)' })}
          value={form.maxUrls}
          onChange={(v) => update('maxUrls', v)}
          info="Hard cap on total URLs crawled. The crawl stops as soon as this is reached. Screaming Frog: 'Limit Crawl Total'."
          example="1000000 (1M) for a full site audit; 5000 for spot checks."
        />
        <Num
          label={t('settingsPanels.crawler.requestTimeoutMs', { defaultValue: 'Response Timeout (ms)' })}
          value={form.requestTimeoutMs}
          onChange={(v) => update('requestTimeoutMs', v)}
          info="Per-request abort threshold. Pages that take longer than this are recorded as network errors. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — that one's in seconds, this is in milliseconds."
          example="20000 (20 s) for typical use; 5000 for fast spot checks; 60000 for slow APIs."
        />
        <Num
          label={t('settingsPanels.crawler.maxRepeatedPathSegments', { defaultValue: 'Crawl trap: repeated path segments — 0 = off' })}
          value={form.maxRepeatedPathSegments}
          onChange={(v) => update('maxRepeatedPathSegments', v)}
          info="A URL whose path repeats the same segment this many times or more (/shop/shop/shop/…) is treated as a link loop and skipped. This shape comes from a relative-href bug and has no legitimate counterpart. Skipped counts are reported when the crawl finishes."
          example="3 is safe for every site; raise to 4–5 only if a real path legitimately repeats a segment; 0 disables the guard."
        />
        <Num
          label={t('settingsPanels.crawler.maxQueryParams', { defaultValue: 'Crawl trap: max query parameters — 0 = off' })}
          value={form.maxQueryParams}
          onChange={(v) => update('maxQueryParams', v)}
          info="URLs with more query parameters than this are flagged as faceted-navigation traps under Issues → URL → Crawl Trap. Detection only — the URLs are still crawled, because legitimate filter pages look the same."
          example="4 surfaces most faceted-nav explosions; 0 disables the check."
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Bool
          label={t('settingsPanels.crawler.followRedirects', { defaultValue: 'Always Follow Redirects' })}
          checked={form.followRedirects}
          onChange={(v) => update('followRedirects', v)}
          info="Crawl 3xx redirect targets. Each hop is its own row; the chain is reconstructed in the Response Codes view. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced)."
          example="On for normal audits; off when you only want to inspect raw 3xx behaviour."
        />
        <Bool
          label={t('settingsPanels.crawler.respectRobotsTxt', { defaultValue: 'Respect robots.txt' })}
          checked={form.respectRobotsTxt}
          onChange={(v) => update('respectRobotsTxt', v)}
          info="Honor Allow / Disallow rules declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."
          example="On (default). Off only when crawling sites you own and need to bypass."
        />
        <Bool
          label={t('settingsPanels.crawler.respectCrawlDelay', {
            defaultValue: 'Respect robots.txt Crawl-delay',
          })}
          checked={form.respectCrawlDelay}
          onChange={(v) => update('respectCrawlDelay', v)}
          disabled={!form.respectRobotsTxt}
          info="Honor a Crawl-delay directive as a global rate limit (one request every N seconds). Crawl-delay is not part of RFC 9309 — Google ignores it and Screaming Frog does not implement it — and published values are often stale: 'Crawl-delay: 30' turns a 500-URL crawl into hours. Ignored by default; the directive is still reported in the log when found."
          example="Off (default) for normal audits. On when an ops policy requires it — expect the crawl to take Crawl-delay seconds per URL."
        />
        <Bool
          label={t('settingsPanels.crawler.crawlExternal', { defaultValue: 'Check External Links' })}
          checked={form.crawlExternal}
          onChange={(v) => update('crawlExternal', v)}
          info="Probe outbound links to other hosts (HEAD only) so the Broken Links view catches dead externals. Screaming Frog: 'External Links' (Configuration → Spider → Crawl)."
          example="On for outbound link audits; off for fast internal-only crawls."
        />
        <Bool
          label={t('settingsPanels.crawler.checkImages', { defaultValue: 'Check Images' })}
          checked={form.checkImages}
          onChange={(v) => update('checkImages', v)}
          info="Fetch internal <img> resources (incl. srcset / <picture> sources) so they appear in the Internal tab with their own status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl)."
          example="On (default) so the Internal tab shows images, not just HTML; off for HTML-only crawls."
        />
        <Bool
          label={t('settingsPanels.crawler.checkCss', { defaultValue: 'Check CSS' })}
          checked={form.checkCss}
          onChange={(v) => update('checkCss', v)}
          info="Fetch internal <link rel=stylesheet> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl)."
          example="On (default); off for HTML-only crawls."
        />
        <Bool
          label={t('settingsPanels.crawler.checkJs', { defaultValue: 'Check JavaScript' })}
          checked={form.checkJs}
          onChange={(v) => update('checkJs', v)}
          info="Fetch internal <script src> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl)."
          example="On (default); off for HTML-only crawls."
        />
        <Bool
          label={t('settingsPanels.crawler.storeNofollow', { defaultValue: 'Follow / Store Nofollow Links' })}
          checked={form.storeNofollowLinks}
          onChange={(v) => update('storeNofollowLinks', v)}
          hint={t('settingsPanels.crawler.storeNofollowHint', { defaultValue: "Default off — Screaming Frog 'Respect Nofollow' behaviour" })}
          info='Persist rel="nofollow" links in the link graph. When off, nofollow links are dropped entirely (not counted in outlinks, not probed as externals). Screaming Frog inverse: turning this ON ≈ unchecking "Follow Internal/External Nofollow".'
          example="On if you need nofollow attribute audits; off keeps the link graph cleaner."
        />
        <Bool
          label={t('settingsPanels.crawler.discoverSitemaps', { defaultValue: 'Auto-Discover XML Sitemaps' })}
          checked={form.discoverSitemaps}
          onChange={(v) => update('discoverSitemaps', v)}
          hint={t('settingsPanels.crawler.discoverSitemapsHint', { defaultValue: 'Reads sitemap.xml from robots.txt + default paths at crawl start' })}
          info="Fetches /robots.txt sitemap directives + /sitemap.xml fallbacks. Powers the 'Non-Indexable in Sitemap' issue filter. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl)."
          example="On (default) — cheap I/O, high SEO value."
        />
      </div>

      <div className="mt-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <label className="flex flex-col gap-1">
          <FieldLabel
            label={t('settingsPanels.crawler.renderingMode', { defaultValue: 'Rendering Mode' })}
            info="Text Only fetches the raw HTML response as-is — fast and deterministic. Old AJAX Crawling Scheme rewrites hashbang (#!) URLs to Google's deprecated ?_escaped_fragment_= form so a pre-rendering server returns the snapshot. Full JavaScript rendering is a V2 item."
            example="Text Only for server-rendered / static sites; Old AJAX only for legacy hashbang SPAs."
          />
          <select
            className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
            value={form.renderingMode}
            onChange={(e) =>
              update('renderingMode', e.target.value as 'text' | 'ajax' | 'js')
            }
          >
            <option value="text">
              {t('settingsPanels.crawler.renderTextOnly', { defaultValue: 'Text Only (default)' })}
            </option>
            <option value="ajax">
              {t('settingsPanels.crawler.renderAjax', { defaultValue: 'Old AJAX Crawling Scheme (_escaped_fragment_)' })}
            </option>
            <option value="js">
              {t('settingsPanels.crawler.renderJs', { defaultValue: 'JavaScript Rendering (Playwright)' })}
            </option>
          </select>
          {form.renderingMode === 'js' ? (
            <p className="mt-1 text-[11px] text-amber-300">
              {t('settingsPanels.crawler.renderJsHint', {
                defaultValue:
                  'JS rendering uses a headless Chromium per page — significantly slower than text mode. Configure viewport, wait conditions, and resource blocking in the Rendering tab.',
              })}
            </p>
          ) : null}
        </label>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Spider → Crawl — the per-link-type crawl/store matrix, laid out like
 * Screaming Frog's Configuration → Spider → Crawl tab.
 *
 * Two switches per row, and they are genuinely independent: "store but
 * don't crawl" lists a declaration without spending a request on it,
 * "crawl but don't store" fetches a resource for its side effects
 * (proving it loads, mining a stylesheet for its font targets) without
 * burying the Internal tab under it.
 *
 * Screaming Frog's SWF row has no counterpart here — Flash reached
 * end-of-life in 2020.
 * ------------------------------------------------------------------ */

/** One bordered group with a legend, mirroring SF's fieldset boxes. */
function CrawlGroup({
  title,
  columns,
  children,
}: {
  title: string;
  /** Render the Crawl / Store column captions above the first row. */
  columns?: { crawl: string; store: string };
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded border border-surface-800 bg-surface-950/40 px-3 pb-3 pt-2">
      <legend className="px-1 text-[11px] font-medium text-surface-300">{title}</legend>
      {columns ? (
        <div className="mb-1 flex items-center gap-2 border-b border-surface-800/70 pb-1">
          <span className="flex-1" />
          <span className="w-[58px] text-center text-[10px] uppercase tracking-wide text-surface-500">
            {columns.crawl}
          </span>
          <span className="w-[58px] text-center text-[10px] uppercase tracking-wide text-surface-500">
            {columns.store}
          </span>
        </div>
      ) : null}
      <div className="flex flex-col gap-1">{children}</div>
    </fieldset>
  );
}

/**
 * One matrix row: a label plus up to two checkboxes in fixed columns.
 * A `null` switch renders an empty cell — Uncrawlable Links has no
 * crawl side, because an uncrawlable link is by definition not fetched.
 */
function CrawlRow({
  label,
  info,
  example,
  crawl,
  store,
}: {
  label: string;
  crawl: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; title?: string } | null;
  store: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; title?: string } | null;
} & FieldInfo) {
  const { i18n } = useTranslation();
  const cell = (
    box: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; title?: string } | null,
  ) => (
    <span className="flex w-[58px] justify-center">
      {box ? (
        <input
          type="checkbox"
          checked={box.checked}
          disabled={box.disabled}
          title={box.title}
          onChange={(e) => box.onChange(e.target.checked)}
          className={clsx(box.disabled && 'cursor-not-allowed opacity-40')}
        />
      ) : null}
    </span>
  );
  return (
    <div className="flex items-center gap-2 py-[1px]">
      <span className="flex flex-1 items-center gap-1">
        <span className="text-[12px] text-surface-100">
          {translateLabel(label, i18n.language)}
        </span>
        <InfoTip info={info} example={example} />
      </span>
      {cell(crawl)}
      {cell(store)}
    </div>
  );
}

function SpiderCrawlPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  const cols = {
    crawl: t('spiderCrawl.colCrawl', { defaultValue: 'Crawl' }),
    store: t('spiderCrawl.colStore', { defaultValue: 'Store' }),
  };
  // Resource rows have nothing to keep unless they were fetched, so their
  // Store box follows the Crawl box instead of pretending otherwise. The
  // image row is the exception: `<img>` declarations land in the images
  // table whether or not the bytes were ever requested.
  const storeNeedsCrawl = t('spiderCrawl.storeNeedsCrawl', {
    defaultValue: 'Requires Crawl — an un-fetched resource has no row to store.',
  });

  // "Crawl Outside of Start Folder" and "Crawl All Subdomains" are two
  // views of the one scope setting rather than fields of their own, so
  // they can never contradict it or each other. `exact-url` is a
  // single-page crawl where neither applies.
  const scope = form.scope;
  const scopeLocked = scope === 'exact-url';
  const outsideStartFolder = scope !== 'subfolder';
  const allSubdomains = scope === 'all-subdomains';

  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('spiderCrawl.intro', {
          defaultValue:
            'Choose which link types to crawl and store. Crawl fetches the target so it gets its own row; Store keeps what the page declared so the matching tab has data. These settings shape how many URLs are discovered, crawled, and reported.',
        })}
      </p>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="flex flex-col gap-3">
          <CrawlGroup
            title={t('spiderCrawl.resourceLinks', { defaultValue: 'Resource Links' })}
            columns={cols}
          >
            <CrawlRow
              label="Images"
              info="Crawl fetches internal <img> targets (incl. srcset / <picture> sources) so each appears in the Internal tab with status, content type, and size — every one counts toward Max URLs. Store keeps the <img> declarations in the Images tab, which works even with Crawl off: you get the full image inventory with alt text for the cost of zero extra requests."
              example="Store on, Crawl off is the cheap alt-text audit. Both on for a full image health check."
              crawl={{ checked: form.checkImages, onChange: (v) => update('checkImages', v) }}
              store={{ checked: form.storeImages, onChange: (v) => update('storeImages', v) }}
            />
            <CrawlRow
              label="Media"
              info="<video> / <audio> and the <source> children they own. Off by default — media files are large and rarely what an SEO crawl is looking for."
              example="On when auditing a video-heavy site for dead media URLs."
              crawl={{ checked: form.crawlMedia, onChange: (v) => update('crawlMedia', v) }}
              store={{
                checked: form.storeMedia,
                onChange: (v) => update('storeMedia', v),
                disabled: !form.crawlMedia,
                title: form.crawlMedia ? undefined : storeNeedsCrawl,
              }}
            />
            <CrawlRow
              label="CSS"
              info="<link rel=stylesheet> targets. Crawling a stylesheet is also what discovers the web fonts and background images declared inside it via @font-face / url() — so Crawl on with Store off still populates the Internal tab's Font filter without listing every stylesheet."
              example="Crawl on, Store off when you want fonts discovered but not hundreds of CSS rows."
              crawl={{ checked: form.checkCss, onChange: (v) => update('checkCss', v) }}
              store={{
                checked: form.storeCss,
                onChange: (v) => update('storeCss', v),
                disabled: !form.checkCss,
                title: form.checkCss ? undefined : storeNeedsCrawl,
              }}
            />
            <CrawlRow
              label="JavaScript"
              info="<script src> targets, fetched so each gets its own row with status code, content type, and size. Headers only — the body is discarded, never executed."
              example="Both on to catch 404ing bundles; both off for HTML-only crawls."
              crawl={{ checked: form.checkJs, onChange: (v) => update('checkJs', v) }}
              store={{
                checked: form.storeJs,
                onChange: (v) => update('storeJs', v),
                disabled: !form.checkJs,
                title: form.checkJs ? undefined : storeNeedsCrawl,
              }}
            />
          </CrawlGroup>

          <CrawlGroup
            title={t('spiderCrawl.pageLinks', { defaultValue: 'Page Links' })}
            columns={cols}
          >
            <CrawlRow
              label="Internal Hyperlinks"
              info="<a href> targets on the same site. Crawl off turns the run into an audit of a fixed set of pages — sitemaps, canonicals, and the other declared alternates below still feed discovery. Store off empties the link graph: inlinks, outlinks, anchor-text reports, and link score all go with it."
              example="Leave both on. Crawl off only when a sitemap or URL list already defines the exact set you want."
              crawl={{
                checked: form.crawlInternalLinks,
                onChange: (v) => update('crawlInternalLinks', v),
              }}
              store={{
                checked: form.storeInternalLinks,
                onChange: (v) => update('storeInternalLinks', v),
              }}
            />
            <CrawlRow
              label="External Links"
              info="Outbound links to other hosts are always status-checked (one HEAD each) so Broken Links catches dead externals — that does not depend on this row. Crawl here means fully crawling those pages, following their links onward too. Store keeps outbound links in the link graph."
              example="Crawl off (default) — status-check externals without spidering the whole web."
              crawl={{ checked: form.crawlExternal, onChange: (v) => update('crawlExternal', v) }}
              store={{
                checked: form.storeExternalLinks,
                onChange: (v) => update('storeExternalLinks', v),
              }}
            />
            <CrawlRow
              label="Canonicals"
              info="<link rel=canonical> and its HTTP Link: header form. Crawl also enqueues the canonical target, treating it as a navigation hint. Store feeds the Canonicals tab and every canonical issue filter."
              example="Crawl off (default) — canonicals are a signal, not a route. Store on."
              crawl={{ checked: form.followCanonicals, onChange: (v) => update('followCanonicals', v) }}
              store={{ checked: form.storeCanonicals, onChange: (v) => update('storeCanonicals', v) }}
            />
            <CrawlRow
              label="Pagination (Rel Next/Prev)"
              info="<link rel=next> / <link rel=prev>. Part of the standard discovery graph; turn Crawl off to isolate a pagination loop without disabling link-following everywhere."
              example="Both on unless you are debugging an infinite paginated series."
              crawl={{
                checked: form.followPaginationLinks,
                onChange: (v) => update('followPaginationLinks', v),
              }}
              store={{ checked: form.storePagination, onChange: (v) => update('storePagination', v) }}
            />
            <CrawlRow
              label="Hreflang"
              info="<link rel=alternate hreflang>. Crawl enqueues every declared alternate, which is how you reach language versions nothing links to. Store feeds the Hreflang tab and the reciprocity / invalid-code audits."
              example="Crawl on for a multi-language audit — otherwise unlinked locales stay invisible."
              crawl={{ checked: form.crawlHreflang, onChange: (v) => update('crawlHreflang', v) }}
              store={{ checked: form.storeHreflang, onChange: (v) => update('storeHreflang', v) }}
            />
            <CrawlRow
              label="AMP"
              info="<link rel=amphtml>. Crawl fetches the AMP variant as its own URL; Store keeps the declaration plus the AMP smoke-validator findings."
              example="Crawl on only if the site still ships AMP pages."
              crawl={{ checked: form.crawlAmp, onChange: (v) => update('crawlAmp', v) }}
              store={{ checked: form.storeAmp, onChange: (v) => update('storeAmp', v) }}
            />
            <CrawlRow
              label="Meta Refresh"
              info='<meta http-equiv="refresh">. Crawl enqueues the parsed target like a redirect; Store keeps the raw directive and its URL for the Meta Refresh tab.'
              example="Crawl on when auditing a legacy site that still redirects this way."
              crawl={{ checked: form.followJsRedirects, onChange: (v) => update('followJsRedirects', v) }}
              store={{ checked: form.storeMetaRefresh, onChange: (v) => update('storeMetaRefresh', v) }}
            />
            <CrawlRow
              label="iframes"
              info="<iframe src> documents. Crawl fetches each embedded page as its own URL, which can pull in a lot of third-party surface. Store records them in the link graph so a dead embed shows up in Outlinks and Broken Links — without counting toward the page's outlink total, since an embed is not a hyperlink."
              example="Store on, Crawl off is usually the right pair."
              crawl={{ checked: form.crawlIframes, onChange: (v) => update('crawlIframes', v) }}
              store={{ checked: form.storeIframes, onChange: (v) => update('storeIframes', v) }}
            />
            <CrawlRow
              label="Mobile Alternate"
              info='The separate-URL (m-dot) mobile version: <link rel="alternate" media="only screen and (max-width: …)">. Null on responsive sites, which is most of them — a value here with no reciprocal canonical back is the classic broken m-dot setup.'
              example="Crawl on only when the site really does serve a separate mobile host."
              crawl={{
                checked: form.crawlMobileAlternate,
                onChange: (v) => update('crawlMobileAlternate', v),
              }}
              store={{
                checked: form.storeMobileAlternate,
                onChange: (v) => update('storeMobileAlternate', v),
              }}
            />
            <CrawlRow
              label="Uncrawlable Links"
              info={'Links a search engine cannot follow: <a> with no href but an onclick, href="javascript:…", and href="#" placeholders wired to a handler. Store-only — an uncrawlable link is by definition never fetched. Drives the JS-Only Navigation issue filter.'}
              example="On — it is a count, so it costs nothing."
              crawl={null}
              store={{
                checked: form.storeUncrawlableLinks,
                onChange: (v) => update('storeUncrawlableLinks', v),
              }}
            />
          </CrawlGroup>
        </div>

        <div className="flex flex-col gap-3">
          <CrawlGroup title={t('spiderCrawl.behaviour', { defaultValue: 'Crawl Behaviour' })}>
            <Bool
              label={t('spiderCrawl.checkOutsideFolder', {
                defaultValue: 'Check Links Outside of Start Folder',
              })}
              checked={form.checkLinksOutsideStartFolder}
              onChange={(v) => update('checkLinksOutsideStartFolder', v)}
              disabled={scope !== 'subfolder'}
              hint={
                scope === 'subfolder'
                  ? undefined
                  : t('spiderCrawl.subfolderOnly', {
                      defaultValue: 'Only applies while Crawl Scope is Subfolder',
                    })
              }
              info="With a Subfolder-scoped crawl, links pointing outside the start folder are fetched once so their status code is known, then stopped — they are checked, not crawled through. Off leaves them undiscovered entirely."
              example="On — knowing a link out of /blog/ is a 404 costs one request."
            />
            <Bool
              label={t('spiderCrawl.crawlOutsideFolder', {
                defaultValue: 'Crawl Outside of Start Folder',
              })}
              checked={outsideStartFolder}
              disabled={scopeLocked}
              onChange={(v) => update('scope', v ? 'subdomain' : 'subfolder')}
              hint={
                scopeLocked
                  ? t('spiderCrawl.scopeExactUrl', {
                      defaultValue: 'Disabled — Crawl Scope is Exact URL (single page)',
                    })
                  : t('spiderCrawl.scopeBound', {
                      defaultValue: 'Same setting as Crawl Scope — changing either updates both',
                    })
              }
              info="Off restricts the crawl to URLs under the start URL's path (Crawl Scope = Subfolder). On lets it cover the whole host. This is a view of the Crawl Scope setting, not a separate switch, so the two can never disagree."
              example="Off to audit just /blog/; on for the whole site."
            />
            <Bool
              label={t('spiderCrawl.crawlAllSubdomains', {
                defaultValue: 'Crawl All Subdomains',
              })}
              checked={allSubdomains}
              disabled={scopeLocked}
              onChange={(v) => update('scope', v ? 'all-subdomains' : 'subdomain')}
              hint={
                scopeLocked
                  ? t('spiderCrawl.scopeExactUrl', {
                      defaultValue: 'Disabled — Crawl Scope is Exact URL (single page)',
                    })
                  : t('spiderCrawl.scopeBound', {
                      defaultValue: 'Same setting as Crawl Scope — changing either updates both',
                    })
              }
              info="Treats every host sharing the registrable domain as internal — shop.example.com and blog.example.com crawl alongside example.com instead of counting as external. Another view of the Crawl Scope setting."
              example="On when subdomains are part of the same property."
            />
            <Bool
              label={t('spiderCrawl.followInternalNofollow', {
                defaultValue: 'Follow Internal "nofollow"',
              })}
              checked={form.followNofollow}
              onChange={(v) => update('followNofollow', v)}
              info='Crawl through rel="nofollow" links pointing at the same site. Off (default) is Screaming Frog "Respect Nofollow" behaviour. Internal and external are separate switches because sites nofollow them for opposite reasons — crawl-budget shaping vs. not vouching for a third party.'
              example="On when a site nofollows its own faceted navigation and you need behind it."
            />
            <Bool
              label={t('spiderCrawl.followExternalNofollow', {
                defaultValue: 'Follow External "nofollow"',
              })}
              checked={form.followExternalNofollow}
              onChange={(v) => update('followExternalNofollow', v)}
              info='Crawl through rel="nofollow" links pointing at other hosts. Only has an effect while External Links → Crawl is on.'
              example="Off — nofollowed externals are exactly the ones you did not vouch for."
            />
            <Bool
              label={t('spiderCrawl.crawlInvalidLinks', { defaultValue: 'Crawl Invalid Links' })}
              checked={form.crawlInvalidLinks}
              onChange={(v) => update('crawlInvalidLinks', v)}
              info="Record hrefs that cannot be parsed as a URL — unencoded whitespace inside the authority, doubled schemes, stray delimiters. They can never resolve to a crawled page, so every one is reported in Broken Links, which is the point. Deliberate non-navigable schemes (mailto:, tel:, #) are not malformed and never appear."
              example="On when hunting hand-written markup errors; off keeps Broken Links focused on real 404s."
            />
          </CrawlGroup>

          <CrawlGroup title={t('spiderCrawl.xmlSitemaps', { defaultValue: 'XML Sitemaps' })}>
            <Bool
              label={t('spiderCrawl.crawlLinkedSitemaps', {
                defaultValue: 'Crawl Linked XML Sitemaps',
              })}
              checked={form.crawlLinkedSitemaps}
              onChange={(v) => update('crawlLinkedSitemaps', v)}
              hint={
                form.discoverSitemaps
                  ? undefined
                  : t('spiderCrawl.needsDiscovery', {
                      defaultValue: 'Needs Auto-Discover or an explicit sitemap below',
                    })
              }
              info="Auto-discovery on its own only records sitemap entries, which is what the sitemap issue filters compare the crawl against. Turning this on crawls them too — and that is what surfaces orphans: pages the sitemap declares but nothing on the site links to."
              example="On for an orphan-page audit."
            />
            <Bool
              label={t('spiderCrawl.autoDiscover', {
                defaultValue: 'Auto Discover XML Sitemaps via robots.txt',
              })}
              checked={form.discoverSitemaps}
              onChange={(v) => update('discoverSitemaps', v)}
              info="Reads Sitemap: directives from /robots.txt plus the conventional /sitemap.xml fallbacks at crawl start. Cheap I/O, and it powers every sitemap issue filter."
              example="On (default)."
            />
            <div className="mt-1">
              <Area
                label={t('spiderCrawl.crawlTheseSitemaps', {
                  defaultValue: 'Crawl These Sitemaps',
                })}
                value={form.seedSitemapText}
                onChange={(v) => update('seedSitemapText', v)}
                rows={6}
                placeholder={'https://example.com/sitemap_index.xml\nhttps://example.com/news-sitemap.xml'}
                info="Explicit sitemap URLs, one per line. Their entries are always both recorded and queued as crawl seeds — use this when the sitemap lives somewhere robots.txt never mentions."
                example="https://example.com/sitemap_index.xml"
              />
            </div>
          </CrawlGroup>
        </div>
      </div>
    </>
  );
}

function SpeedPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  const conc = Number.parseInt(form.maxConcurrency, 10);
  const rps = Number.parseInt(form.maxRps, 10);
  const delay = Number.parseInt(form.crawlDelayMs, 10);
  const retries = Number.parseInt(form.retryAttempts, 10);
  const effectiveRps =
    Number.isFinite(rps) && Number.isFinite(conc) ? Math.min(rps, conc * 5) : null;
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.speed.intro', { defaultValue: "Control crawl throughput. Increasing parallelism speeds the crawl, but every extra request adds load on the target server — pick numbers a host that you don't own can absorb without rate-limiting / 429s." })}
      </p>

      <div className="mb-4 rounded border border-blue-700/40 bg-blue-900/15 px-3 py-2 text-[11px] text-blue-200">
        <div className="mb-0.5 font-medium">{t('settingsPanels.speed.effectiveCeiling', { defaultValue: 'Effective ceiling' })}</div>
        <div className="text-blue-300/90">
          {effectiveRps !== null
            ? t('settingsPanels.speed.ceilingValue', {
                defaultValue:
                  '~{{rps}} URL/s ({{workers}} parallel workers, ≤ {{cap}} RPS rate-limit{{delaySuffix}})',
                rps: effectiveRps.toLocaleString(),
                workers: Number.isFinite(conc) ? conc : '—',
                cap: Number.isFinite(rps) ? rps : '—',
                delaySuffix:
                  Number.isFinite(delay) && delay > 0
                    ? t('settingsPanels.speed.ceilingDelaySuffix', {
                        defaultValue: ', +{{delay}} ms post-request delay per worker',
                        delay,
                      })
                    : '',
              })
            : t('settingsPanels.speed.ceilingEmpty', {
                defaultValue: 'Set Max Concurrency and Max RPS to see the projected throughput.',
              })}
        </div>
      </div>

      <Num
        label={t('settingsPanels.speed.maxConcurrency', { defaultValue: 'Max Concurrency (parallel workers)' })}
        value={form.maxConcurrency}
        onChange={(v) => update('maxConcurrency', v)}
        info="Number of HTTP requests in flight at any one time. Equivalent to Screaming Frog's 'Max Threads'. Higher = faster crawl + more load on the target server."
        example="20 default; 50 on fast first-party servers; 5 if the site rate-limits or returns 429s."
      />
      <Num
        label={t('settingsPanels.speed.maxRps', { defaultValue: 'Max URL/s (rate limit)' })}
        value={form.maxRps}
        onChange={(v) => update('maxRps', v)}
        info="Hard ceiling on requests per second across all workers combined. Equivalent to Screaming Frog's 'Max URL/s'. Acts as a token bucket — even with high concurrency the crawler waits between bursts to stay below this rate."
        example="20 for typical sites; 5 to be polite on shared hosting; 60+ when crawling your own infra."
      />
      <Num
        label={t('settingsPanels.speed.crawlDelayMs', { defaultValue: 'Per-Worker Delay (ms after each request)' })}
        value={form.crawlDelayMs}
        onChange={(v) => update('crawlDelayMs', v)}
        info="Sleep this long on each worker AFTER a response completes, before it picks up the next URL. Stacks with the global RPS cap — useful for sites that rate-limit on inter-request gap rather than total throughput."
        example="0 default; 250 ms when a host returns 429 with a 'too fast' message."
      />

      <div className="mt-4 mb-1.5 text-[11px] font-medium text-surface-300">
        {t('settingsPanels.speed.retriesHeading', { defaultValue: 'Retries' })}
      </div>
      <Num
        label={t('settingsPanels.speed.retryAttempts', { defaultValue: 'Retry Attempts (per URL on transient errors)' })}
        value={form.retryAttempts}
        onChange={(v) => update('retryAttempts', v)}
        info="On network errors, 408/425/429/5xx responses, retry up to N more times before giving up. Each retry counts toward the URL's response time budget."
        example="2 default; 0 to record errors immediately without retrying; 5 for unreliable upstreams."
      />
      <Num
        label={t('settingsPanels.speed.retryInitialDelayMs', { defaultValue: 'Initial Retry Delay (ms — exponential backoff)' })}
        value={form.retryInitialDelayMs}
        onChange={(v) => update('retryInitialDelayMs', v)}
        info="Wait this long before the FIRST retry, doubling on each subsequent attempt (500 → 1000 → 2000 …)."
        example="500 default. Bump to 2000 when retrying against a flaky API."
      />
      <p className="mt-1 text-[10px] text-surface-500">
        {t('settingsPanels.speed.worstCaseDelay', {
          defaultValue:
            'Worst-case delay per failed URL ≈ initialDelay × (2 ^ attempts − 1) = {{value}}',
          value:
            Number.isFinite(retries) && Number.isFinite(delay)
              ? `${
                  (Number.parseInt(form.retryInitialDelayMs, 10) || 500) *
                  (2 ** Math.max(0, retries) - 1)
                } ms`
              : '—',
        })}
      </p>

      <div className="mt-5 rounded border border-surface-800 bg-surface-950/40 px-3 py-2 text-[10px] text-surface-400">
        <div className="mb-1 font-medium text-surface-300">
          {t('settingsPanels.speed.tipsHeading', { defaultValue: 'Throughput tips' })}
        </div>
        <ul className="list-disc space-y-0.5 pl-4">
          <li>
            <Trans
              i18nKey="settingsPanels.speed.tip1"
              defaults="For a quick first sweep on a healthy site try the <bold>Fast</bold> preset (Settings → Presets) — concurrency 40, RPS 40, no retries."
              components={{ bold: <strong /> }}
            />
          </li>
          <li>
            <Trans
              i18nKey="settingsPanels.speed.tip2"
              defaults="For unreliable origins or slow APIs try <bold>Thorough</bold> — concurrency 10, 3 retries, 30 s timeout."
              components={{ bold: <strong /> }}
            />
          </li>
          <li>
            {t('settingsPanels.speed.tip3', {
              defaultValue:
                'Concurrency × HTTP keep-alive = the steady-state connection count. Most servers comfortably handle 20–40; corporate proxies / WAFs often cap at 8–10.',
            })}
          </li>
        </ul>
      </div>
    </>
  );
}

function RequestsPanel({ form, update }: PanelProps) {
  const { t, i18n } = useTranslation();
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.requests.intro', { defaultValue: 'HTTP headers sent with every request.' })}
      </p>
      <label className="mb-2 flex flex-col gap-1">
        <FieldLabel
          label={t('settingsPanels.requests.uaPreset', { defaultValue: 'Quick User-Agent preset' })}
          info="Picking a preset fills the User-Agent field below — you can still hand-edit it afterwards. Switch between Googlebot Smartphone / Desktop to compare how a site responds to mobile vs desktop crawlers."
          example="Googlebot — Smartphone matches Google's mobile-first indexing crawler."
        />
        <select
          className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
          value={UA_PRESETS.find((p) => p.ua === form.userAgent)?.ua ?? ''}
          onChange={(e) => {
            if (e.target.value) update('userAgent', e.target.value);
          }}
        >
          <option value="">
            {t('settingsPanels.requests.uaCustom', { defaultValue: 'Custom / pick a preset…' })}
          </option>
          {UA_PRESETS.map((p) => (
            <option key={p.label} value={p.ua}>
              {translateLabel(p.label, i18n.language)}
            </option>
          ))}
        </select>
      </label>
      <Text
        label={t('settingsPanels.requests.userAgent', { defaultValue: 'User-Agent' })}
        value={form.userAgent}
        onChange={(v) => update('userAgent', v)}
        info="Sent on every request as the User-Agent header. Identifies the crawler to servers; some sites serve different content based on UA."
        example="Mozilla/5.0 (compatible; FreeCrawlSEO/1.0; +https://yourdomain.com/bot)"
      />
      <Text
        label={t('settingsPanels.requests.acceptLanguage', { defaultValue: 'Accept-Language' })}
        value={form.acceptLanguage}
        onChange={(v) => update('acceptLanguage', v)}
        info="Sent on every request. Affects which locale a multi-lingual site serves you."
        example="tr,en;q=0.8 — Turkish first, English fallback."
      />
      <Area
        label={t('settingsPanels.requests.customHeaders', { defaultValue: 'Custom Headers (one per line, "Key: Value")' })}
        value={form.customHeadersText}
        onChange={(v) => update('customHeadersText', v)}
        rows={6}
        placeholder={'Authorization: Bearer ...\nX-Custom: foo'}
        info="One header per line in 'Key: Value' format. Added to every request — useful for auth tokens or custom routing hints. User values override defaults when keys collide."
        example={'Authorization: Bearer abc123xyz\nX-Forwarded-For: 1.2.3.4\nCookie: session=...'}
      />
    </>
  );
}

function FiltersPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.filters.intro', { defaultValue: 'URL allowlist/blocklist. Patterns are JavaScript regex tested against the full URL.' })}
      </p>
      <Area
        label={t('settingsPanels.filters.includePatterns', { defaultValue: 'Include Patterns (regex, one per line — empty = all allowed)' })}
        value={form.includePatternsText}
        onChange={(v) => update('includePatternsText', v)}
        rows={5}
        placeholder={'^https?://example\\.com/blog/\n/api/v2/'}
        info="JavaScript regex tested against the full URL. Empty = all URLs allowed. URL must match at least one to be enqueued. The start URL is always permitted regardless."
        example={'^https?://example\\.com/blog/\n/api/v2/'}
      />
      <Area
        label={t('settingsPanels.filters.excludePatterns', { defaultValue: 'Exclude Patterns (regex, one per line)' })}
        value={form.excludePatternsText}
        onChange={(v) => update('excludePatternsText', v)}
        rows={5}
        placeholder={'/admin\n\\.pdf$'}
        info="JavaScript regex. Any match → URL is skipped, even if it would otherwise pass the include list. Common uses: skip admin areas, large file types, session-id query params."
        example={'/admin\n\\.pdf$\n\\?session='}
      />
    </>
  );
}

function CustomSearchPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.customSearch.intro1', { defaultValue: 'Flag pages whose body contains any of these terms. Two modes per line:' })}
        <span className="ml-1 font-mono text-surface-200">/pattern/flags</span>{' '}
        {t('settingsPanels.customSearch.intro2', { defaultValue: 'for regex,' })}
        <span className="ml-1 font-mono text-surface-200">{t('settingsPanels.customSearch.anythingElse', { defaultValue: 'anything else' })}</span>{' '}
        {t('settingsPanels.customSearch.intro3', { defaultValue: 'for literal case-insensitive substring.' })}
      </p>
      <Area
        label="Search Terms (one per line; /…/ = regex, plain = literal)"
        value={form.customSearchTermsText}
        onChange={(v) => update('customSearchTermsText', v)}
        rows={8}
        placeholder={'pricing\nfree shipping\n/coming\\s+soon/i\n/(call|contact)\\s+us/i'}
        info="Two modes per line. (1) Wrap in slashes for a regex: /pattern/flags — supported flags imsuy (g is forced). Invalid patterns appear with count -1 in the detail panel so you can spot the typo. (2) Anything else is a literal case-insensitive substring — the legacy behaviour. Each term's per-page hit count is surfaced in the URL Details panel."
        example={'free shipping\npricing\n/(?:^|\\s)beta(?:\\s|$)/i\n/coming\\s+soon/i'}
      />
    </>
  );
}

function UrlRewritingPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  const [previewState, setPreviewState] = useState<{
    pending: boolean;
    result?: string | null;
    parseError?: string;
    regexErrors?: Array<{ pattern: string; error: string }>;
  }>({ pending: false });

  const updateRegexRow = (i: number, patch: Partial<{ pattern: string; replacement: string; flags?: string }>) => {
    const next = form.urlRegexRewrites.slice();
    next[i] = { ...next[i]!, ...patch };
    update('urlRegexRewrites', next);
  };
  const removeRegexRow = (i: number) => {
    const next = form.urlRegexRewrites.slice();
    next.splice(i, 1);
    update('urlRegexRewrites', next);
  };
  const addRegexRow = () => {
    update('urlRegexRewrites', [
      ...form.urlRegexRewrites,
      { pattern: '', replacement: '', flags: 'g' },
    ]);
  };

  const runPreview = async () => {
    const sample = form.urlRewritePreview.trim();
    if (!sample) {
      setPreviewState({ pending: false, parseError: t('settingsPanels.urlRewriting.enterUrlAbove', { defaultValue: 'Enter a URL above to preview' }) });
      return;
    }
    setPreviewState({ pending: true });
    try {
      const keep = form.keepQueryParamsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const rewrites = form.urlRegexRewrites
        .map((r) => ({
          pattern: r.pattern.trim(),
          replacement: r.replacement,
          flags: r.flags?.trim() || undefined,
        }))
        .filter((r) => r.pattern !== '');
      const res = await window.freecrawl.urlRewritePreview({
        url: sample,
        stripWww: form.stripWww,
        forceHttps: form.forceHttps,
        lowercasePath: form.lowercasePath,
        sortQueryParams: form.sortQueryParams,
        collapseDuplicateSlashes: form.collapseDuplicateSlashes,
        trailingSlash: form.trailingSlash,
        keepQueryParams: keep,
        urlRegexRewrites: rewrites,
      });
      setPreviewState({
        pending: false,
        result: res.result,
        parseError: res.parseError,
        regexErrors: res.regexErrors,
      });
    } catch (err) {
      setPreviewState({
        pending: false,
        parseError: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.urlRewriting.intro', { defaultValue: 'Normalisation applied before URLs are deduplicated and queued.' })}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Bool
          label={t('settingsPanels.urlRewriting.stripWww', { defaultValue: 'Strip www.' })}
          checked={form.stripWww}
          onChange={(v) => update('stripWww', v)}
          hint={t('settingsPanels.urlRewriting.stripWwwHint', { defaultValue: 'Treat www.x.com and x.com as the same URL' })}
          info="Removes the leading 'www.' from the host at normalisation time. The seen-set, redirect graph, and link extraction all use the rewritten form, so duplicates collapse correctly."
          example="On if your site canonicalises to non-www but emits www links somewhere."
        />
        <Bool
          label={t('settingsPanels.urlRewriting.forceHttps', { defaultValue: 'Force HTTPS' })}
          checked={form.forceHttps}
          onChange={(v) => update('forceHttps', v)}
          hint={t('settingsPanels.urlRewriting.forceHttpsHint', { defaultValue: 'Upgrade http:// → https:// before fetching' })}
          info="Rewrites http:// to https:// before fetching. Breaks HTTP-only sites."
          example="On for modern sites that 301 http→https anyway; off for legacy intranet."
        />
        <Bool
          label={t('settingsPanels.urlRewriting.lowercasePath', { defaultValue: 'Lowercase path' })}
          checked={form.lowercasePath}
          onChange={(v) => update('lowercasePath', v)}
          hint={t('settingsPanels.urlRewriting.lowercasePathHint', { defaultValue: 'Treat /Foo and /foo as the same URL' })}
          info="Lowercases the URL path component. Host is already case-insensitive per the URL spec, so this only affects the path."
          example="On if your CMS serves the same page at mixed casing (/Foo and /foo)."
        />
        <Bool
          label={t('settingsPanels.urlRewriting.sortQueryParams', { defaultValue: 'Sort query parameters' })}
          checked={form.sortQueryParams}
          onChange={(v) => update('sortQueryParams', v)}
          hint={t('settingsPanels.urlRewriting.sortQueryParamsHint', { defaultValue: 'Treat ?b=2&a=1 and ?a=1&b=2 as the same URL' })}
          info="Sorts query parameters alphabetically at normalisation time. Repeated keys keep their relative order, so ?tag=a&tag=b is preserved. Without this the two orderings occupy separate rows and read as duplicates."
          example="On for most sites; off if your server routes on positional parameter order."
        />
        <Bool
          label={t('settingsPanels.urlRewriting.collapseDuplicateSlashes', { defaultValue: 'Collapse duplicate slashes' })}
          checked={form.collapseDuplicateSlashes}
          onChange={(v) => update('collapseDuplicateSlashes', v)}
          hint={t('settingsPanels.urlRewriting.collapseDuplicateSlashesHint', { defaultValue: 'Treat /a//b and /a/b as the same URL' })}
          info="Collapses runs of slashes in the path to a single slash. Applied before the trailing-slash policy. Web servers serve these identically, so the duplicate-slash variant is normally a false duplicate."
          example="On if a template bug emits //  in links; off if your framework uses empty path segments as data."
        />
        <label className="flex flex-col gap-1">
          <FieldLabel
            label={t('settingsPanels.urlRewriting.trailingSlashPolicy', { defaultValue: 'Trailing slash policy' })}
            info="How to canonicalise paths with/without a trailing slash. 'Add' is file-extension aware — won't add a slash to /file.pdf or /image.png."
            example="Strip if your site canonicalises /foo (no slash); Add for sites that canonicalise /foo/."
          />
          <select
            className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
            value={form.trailingSlash}
            onChange={(e) =>
              update('trailingSlash', e.target.value as 'leave' | 'strip' | 'add')
            }
          >
            <option value="leave">{t('settingsPanels.urlRewriting.trailingSlashLeave', { defaultValue: 'Leave as-is' })}</option>
            <option value="strip">{t('settingsPanels.urlRewriting.trailingSlashStrip', { defaultValue: 'Strip (/foo/ → /foo)' })}</option>
            <option value="add">{t('settingsPanels.urlRewriting.trailingSlashAdd', { defaultValue: 'Add (/foo → /foo/)' })}</option>
          </select>
        </label>
      </div>

      <div className="mt-4 border-t border-surface-800 pt-3">
        <Area
          label={t('settingsPanels.urlRewriting.keepQueryParams', { defaultValue: 'Keep query parameters (whitelist; one per line)' })}
          value={form.keepQueryParamsText}
          onChange={(v) => update('keepQueryParamsText', v)}
          rows={4}
          placeholder={'id\npage\nlang'}
          info="When non-empty, ALL query parameters not on this list are dropped during normalisation (case-insensitive name match). Leave empty to keep the default behaviour, which strips just utm_*, fbclid, gclid, mc_cid, and mc_eid."
          example={'id\npage\nlang\nproduct'}
        />
      </div>

      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between">
          <FieldLabel
            label={t('settingsPanels.urlRewriting.regexRewrites', { defaultValue: 'Regex rewrites (applied to the final URL string in order)' })}
            info="Each rule runs JavaScript RegExp.replace on the fully-normalised URL. Flags default to 'g'. After all rules run, the result is re-parsed as a URL — if the rewrite produces an invalid URL, the link is dropped at normalisation time."
            example="Pattern: ^https://m\\.(.+) · Replacement: https://www.$1 · Flags: i  (collapse mobile subdomain to www)"
          />
          <button
            type="button"
            onClick={addRegexRow}
            className="inline-flex items-center gap-1 rounded border border-surface-700 px-2 py-0.5 text-[10px] text-surface-300 hover:bg-surface-800"
          >
            <Plus size={11} /> {t('settingsPanels.urlRewriting.addRule', { defaultValue: 'Add rule' })}
          </button>
        </div>
        {form.urlRegexRewrites.length === 0 ? (
          <div className="rounded border border-dashed border-surface-800 p-2 text-[10px] text-surface-500">
            {t('settingsPanels.urlRewriting.noRegexRules', { defaultValue: 'No regex rules. Click "Add rule" to define one.' })}
          </div>
        ) : (
          <div className="space-y-1">
            {form.urlRegexRewrites.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_60px_24px] gap-1 items-center">
                <input
                  type="text"
                  className="rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
                  placeholder="Pattern (regex)"
                  value={row.pattern}
                  onChange={(e) => updateRegexRow(i, { pattern: e.target.value })}
                  spellCheck={false}
                />
                <input
                  type="text"
                  className="rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
                  placeholder="Replacement (use $1, $2 …)"
                  value={row.replacement}
                  onChange={(e) => updateRegexRow(i, { replacement: e.target.value })}
                  spellCheck={false}
                />
                <input
                  type="text"
                  className="rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
                  placeholder="g"
                  value={row.flags ?? ''}
                  onChange={(e) => updateRegexRow(i, { flags: e.target.value })}
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => removeRegexRow(i)}
                  className="rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-red-400"
                  title={t('settingsPanels.urlRewriting.removeRule', { defaultValue: 'Remove rule' })}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-surface-800 pt-3">
        <FieldLabel
          label={t('settingsPanels.urlRewriting.previewLabel', { defaultValue: 'Preview — test a URL against current settings' })}
          info="Sends the URL through the same normalisation pipeline used by the crawler, with your unsaved settings applied. Useful for verifying regex rules before kicking off a crawl."
        />
        <div className="mt-1 grid grid-cols-[1fr_auto] gap-1">
          <input
            type="text"
            className="rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
            placeholder="https://www.example.com/Path/?utm_source=x&id=42"
            value={form.urlRewritePreview}
            onChange={(e) => update('urlRewritePreview', e.target.value)}
            spellCheck={false}
          />
          <button
            type="button"
            onClick={runPreview}
            disabled={previewState.pending}
            className="rounded border border-surface-700 px-3 py-1 text-[11px] text-surface-200 hover:bg-surface-800 disabled:opacity-50"
          >
            {previewState.pending ? t('settingsPanels.urlRewriting.running', { defaultValue: 'Running…' }) : t('settingsPanels.urlRewriting.preview', { defaultValue: 'Preview' })}
          </button>
        </div>
        {(previewState.result !== undefined || previewState.parseError) && (
          <div className="mt-2 rounded border border-surface-800 bg-surface-950 p-2 text-[11px]">
            {previewState.parseError ? (
              <div className="text-red-400">{previewState.parseError}</div>
            ) : previewState.result === null ? (
              <div className="text-red-400">{t('settingsPanels.urlRewriting.cannotNormalise', { defaultValue: 'URL could not be normalised.' })}</div>
            ) : (
              <div className="break-all font-mono text-emerald-300">{previewState.result}</div>
            )}
            {previewState.regexErrors && previewState.regexErrors.length > 0 && (
              <ul className="mt-1 list-disc pl-4 text-amber-400">
                {previewState.regexErrors.map((e, i) => (
                  <li key={i}>
                    <span className="font-mono">{e.pattern}</span> — {e.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const DEFAULT_RULE: CustomExtractionRule = {
  name: '',
  type: 'css',
  selector: '',
  attribute: '',
  output: 'text',
  multi: 'first',
};

function CustomExtractionPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  const rules = form.customExtractionRules;
  // Default URL for the preview dialog — startUrl isn't part of
  // FormState (TopBar owns it) so we pull from the store directly.
  // Falls back to empty so the user types something themselves when no
  // crawl has been kicked off yet.
  const currentStartUrl = useAppStore((s) => s.config.startUrl);
  const setRules = (next: CustomExtractionRule[]) => update('customExtractionRules', next);
  const updateRule = (i: number, patch: Partial<CustomExtractionRule>) => {
    const next = rules.slice();
    next[i] = { ...next[i]!, ...patch };
    setRules(next);
  };
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewableRules = rules.filter(
    (r) => r.name.trim() && r.selector.trim(),
  ).length;
  return (
    <>
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-[11px] text-surface-400">
          {t('settingsPanels.customExtraction.intro1', { defaultValue: 'Up to 10 custom extraction rules. Each runs against every crawled HTML page; results are stored on the URL row and visible in the URL Details panel under' })}{' '}
          <strong>{t('settingsPanels.customExtraction.extractionLabel', { defaultValue: 'Extraction' })}</strong>.
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={async () => {
              const result = await window.freecrawl.extractionRulesImport();
              if (!result.filePath) {
                if (result.error) {
                  // Surface main-process parse errors inline rather than
                  // silently dropping — invalid JSON is the most common
                  // import failure mode and the user needs to know.
                  // eslint-disable-next-line no-alert
                  alert(
                    t('settingsPanels.customExtraction.importFailedAlert', {
                      defaultValue: 'Import failed: {{error}}',
                      error: result.error,
                    }),
                  );
                }
                return;
              }
              if (result.rules.length === 0) {
                // eslint-disable-next-line no-alert
                alert(
                  result.error ??
                    t('settingsPanels.customExtraction.noValidRules', {
                      defaultValue: 'No valid rules found in the file.',
                    }),
                );
                return;
              }
              if (rules.length > 0) {
                // eslint-disable-next-line no-alert, no-restricted-globals
                const ok = confirm(
                  t('settingsPanels.customExtraction.importConfirm', {
                    defaultValue:
                      'Replace {{existing}} existing rule(s) with {{incoming}} imported rule(s)?',
                    existing: rules.length,
                    incoming: result.rules.length,
                  }) as string,
                );
                if (!ok) return;
              }
              setRules(result.rules);
              if (result.skippedCount > 0) {
                // eslint-disable-next-line no-alert
                alert(
                  t('settingsPanels.customExtraction.importSkipped', {
                    defaultValue:
                      'Imported {{ok}} rule(s). {{skipped}} entries were skipped (invalid shape or over the 10-rule cap).',
                    ok: result.rules.length,
                    skipped: result.skippedCount,
                  }) as string,
                );
              }
            }}
            className="inline-flex items-center gap-1.5 rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-300 hover:bg-surface-800"
            title={t('settingsPanels.customExtraction.importTitle', {
              defaultValue:
                'Replace current rules with a JSON file. Accepts {rules: [...]} envelope or a bare array.',
            })}
          >
            <Upload className="h-3 w-3" />
            {t('settingsPanels.customExtraction.import', { defaultValue: 'Import' })}
          </button>
          <button
            type="button"
            onClick={() => {
              void window.freecrawl.extractionRulesExport(rules);
            }}
            disabled={rules.length === 0}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] transition',
              rules.length === 0
                ? 'cursor-not-allowed border-surface-800 text-surface-600'
                : 'border-surface-700 text-surface-300 hover:bg-surface-800',
            )}
            title={
              rules.length === 0
                ? t('settingsPanels.customExtraction.exportDisabled', {
                    defaultValue: 'Add at least one rule before exporting.',
                  })
                : t('settingsPanels.customExtraction.exportTitle', {
                    defaultValue:
                      'Save the current rule set as a JSON file. Versioned envelope, safe to commit to source control.',
                  })
            }
          >
            <Download className="h-3 w-3" />
            {t('settingsPanels.customExtraction.export', { defaultValue: 'Export' })}
          </button>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            disabled={previewableRules === 0}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] transition',
              previewableRules === 0
                ? 'cursor-not-allowed border-surface-800 text-surface-600'
                : 'border-accent-500/60 text-accent-300 hover:bg-accent-500/15',
            )}
            title={
              previewableRules === 0
                ? t('settingsPanels.customExtraction.previewDisabled', {
                    defaultValue:
                      'Add at least one rule with a name and selector to enable preview.',
                  })
                : t('settingsPanels.customExtraction.previewTitle', {
                    defaultValue:
                      'Test current rules against a URL before saving — no full crawl needed.',
                  })
            }
          >
            <Play className="h-3 w-3" />
            {t('settingsPanels.customExtraction.preview', { defaultValue: 'Preview' })}
          </button>
        </div>
      </div>

      {rules.length === 0 && (
        <p className="mb-3 text-[11px] italic text-surface-500">{t('settingsPanels.customExtraction.empty', { defaultValue: 'No rules — click "Add Rule" to start.' })}</p>
      )}

      {rules.map((r, i) => (
        <div
          key={i}
          className="mb-3 rounded border border-surface-800 bg-surface-950/40 p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
              {t('settingsGroups.ruleN', { defaultValue: 'Rule #{{n}}', n: i + 1 })}
            </div>
            <button
              className="rounded p-1 text-surface-500 hover:bg-surface-800 hover:text-red-400"
              onClick={() => setRules(rules.filter((_, j) => j !== i))}
              title={t('settingsPanels.customExtraction.removeRule', { defaultValue: 'Remove rule' })}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <FieldLabel
                label={t('settingsPanels.customExtraction.name', { defaultValue: 'Name' })}
                info="The column / JSON-key name for this rule's output. Free-form."
                example="product_price, sku, breadcrumb_last"
              />
              <input
                className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                value={r.name}
                onChange={(e) => updateRule(i, { name: e.target.value })}
                placeholder="e.g. product_price"
              />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel
                label={t('settingsPanels.customExtraction.type', { defaultValue: 'Type' })}
                info="`css` runs against the parsed DOM; `regex` runs against raw HTML."
                example="css for selectors, regex for free-form patterns"
              />
              <select
                className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                value={r.type}
                onChange={(e) =>
                  updateRule(i, { type: e.target.value as CustomExtractionRule['type'] })
                }
              >
                <option value="css">{t('settingsPanels.customExtraction.cssSelector', { defaultValue: 'CSS Selector' })}</option>
                <option value="xpath">{t('settingsPanels.customExtraction.xpath', { defaultValue: 'XPath' })}</option>
                <option value="regex">{t('settingsPanels.customExtraction.regex', { defaultValue: 'Regex' })}</option>
                <option value="jsonpath">{t('settingsPanels.customExtraction.jsonpath', { defaultValue: 'JSONPath (JSON response)' })}</option>
              </select>
            </label>
          </div>

          <label className="mb-2 flex flex-col gap-1">
            <FieldLabel
              label={
                r.type === 'css'
                  ? t('settingsPanels.customExtraction.cssSelector', { defaultValue: 'CSS Selector' })
                  : r.type === 'xpath'
                    ? t('settingsPanels.customExtraction.xpathExpr', { defaultValue: 'XPath Expression' })
                    : r.type === 'jsonpath'
                      ? t('settingsPanels.customExtraction.jsonpathExpr', { defaultValue: 'JSONPath Expression' })
                      : t('settingsPanels.customExtraction.regexPattern', { defaultValue: 'Regex Pattern' })
              }
              info={
                r.type === 'css'
                  ? 'Standard CSS selector — same syntax as `document.querySelectorAll`.'
                  : r.type === 'xpath'
                    ? 'XPath 1.0 subset over the parsed DOM. End in `/@attr` or `/text()` to read an attribute / text node. Predicates: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.'
                    : r.type === 'jsonpath'
                      ? 'JSONPath against a JSON response body (e.g. `application/json` APIs). Only runs on responses that parse as JSON — ignored on HTML pages.'
                      : 'JavaScript regex (no flags — /g is implicit). Use a capture group with `output=regex_group` to extract just part of the match.'
              }
              example={
                r.type === 'css'
                  ? '.price > .amount,  meta[property="og:image"],  .breadcrumb li:last-child'
                  : r.type === 'xpath'
                    ? "//meta[@property='og:title']/@content,  //h1,  //div[@class='price']"
                    : r.type === 'jsonpath'
                      ? '$.products[*].price,  $..author,  $.data.items[0].title'
                      : 'sku-([A-Z0-9]+),  "price"\\s*:\\s*"([^"]+)"'
              }
            />
            <input
              className="rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
              value={r.selector}
              onChange={(e) => updateRule(i, { selector: e.target.value })}
              spellCheck={false}
            />
          </label>

          <div className="mb-2 grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1">
              <FieldLabel
                label={t('settingsPanels.customExtraction.output', { defaultValue: 'Output' })}
                info={
                  r.type === 'css' || r.type === 'xpath'
                    ? 'What to read off each matched element. Ignored for an XPath `/@attr` or `/text()` terminal — that value is used directly.'
                    : r.type === 'jsonpath'
                      ? 'JSONPath returns the matched JSON value as-is; choose `Count` to return the number of matches instead.'
                      : 'For regex: `regex_group` extracts capture group 1; otherwise the whole match is used.'
                }
                example="text for visible content, attribute for href/src, count for occurrence count"
              />
              <select
                className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                value={r.output}
                onChange={(e) =>
                  updateRule(i, { output: e.target.value as CustomExtractionRule['output'] })
                }
              >
                {r.type === 'css' || r.type === 'xpath' ? (
                  <>
                    <option value="text">{t('settingsPanels.customExtraction.outputText', { defaultValue: 'Text' })}</option>
                    <option value="attribute">{t('settingsPanels.customExtraction.outputAttribute', { defaultValue: 'Attribute' })}</option>
                    <option value="inner_html">{t('settingsPanels.customExtraction.outputInnerHtml', { defaultValue: 'Inner HTML' })}</option>
                    <option value="outer_html">{t('settingsPanels.customExtraction.outputOuterHtml', { defaultValue: 'Outer HTML' })}</option>
                    <option value="count">{t('settingsPanels.customExtraction.outputCount', { defaultValue: 'Count' })}</option>
                  </>
                ) : r.type === 'jsonpath' ? (
                  <>
                    <option value="text">{t('settingsPanels.customExtraction.outputValue', { defaultValue: 'Value' })}</option>
                    <option value="count">{t('settingsPanels.customExtraction.outputCount', { defaultValue: 'Count' })}</option>
                  </>
                ) : (
                  <>
                    <option value="regex_group">{t('settingsPanels.customExtraction.outputCaptureGroup', { defaultValue: 'Capture group 1' })}</option>
                    <option value="text">{t('settingsPanels.customExtraction.outputWholeMatch', { defaultValue: 'Whole match' })}</option>
                    <option value="count">{t('settingsPanels.customExtraction.outputCount', { defaultValue: 'Count' })}</option>
                  </>
                )}
              </select>
            </label>
            {(r.type === 'css' || r.type === 'xpath') && r.output === 'attribute' ? (
              <label className="flex flex-col gap-1">
                <FieldLabel
                  label={t('settingsPanels.customExtraction.attribute', { defaultValue: 'Attribute' })}
                  info="HTML attribute name to read."
                  example="href, src, content, data-id"
                />
                <input
                  className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                  value={r.attribute ?? ''}
                  onChange={(e) => updateRule(i, { attribute: e.target.value })}
                  placeholder="href"
                />
              </label>
            ) : (
              <div />
            )}
            <label className="flex flex-col gap-1">
              <FieldLabel
                label={t('settingsPanels.customExtraction.multiMatch', { defaultValue: 'Multi-Match' })}
                info="What to do when multiple matches exist."
                example="first/last for single value, all for JSON array, concat for ' | ' joined string"
              />
              <select
                className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                value={r.multi}
                onChange={(e) =>
                  updateRule(i, { multi: e.target.value as CustomExtractionRule['multi'] })
                }
              >
                <option value="first">{t('settingsPanels.customExtraction.multiFirst', { defaultValue: 'First' })}</option>
                <option value="last">{t('settingsPanels.customExtraction.multiLast', { defaultValue: 'Last' })}</option>
                <option value="all">{t('settingsPanels.customExtraction.multiAll', { defaultValue: 'All (array)' })}</option>
                <option value="concat">{t('settingsPanels.customExtraction.multiConcat', { defaultValue: 'Concat (` | `)' })}</option>
                <option value="count">{t('settingsPanels.customExtraction.multiCount', { defaultValue: 'Count' })}</option>
              </select>
            </label>
          </div>
        </div>
      ))}

      {rules.length < 10 && (
        <button
          className="flex items-center gap-1 rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-200 hover:border-blue-500 hover:bg-surface-800"
          onClick={() => setRules([...rules, { ...DEFAULT_RULE }])}
        >
          <Plus className="h-3 w-3" /> {t('settingsPanels.customExtraction.addRule', { defaultValue: 'Add Rule' })}
        </button>
      )}
      {rules.length >= 10 && (
        <p className="text-[10px] text-surface-500">{t('settingsPanels.customExtraction.limitReached', { defaultValue: 'Limit reached (10 rules).' })}</p>
      )}

      <ExtractionPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        rules={rules}
        defaultUrl={currentStartUrl}
        userAgent={form.userAgent}
        acceptLanguage={form.acceptLanguage}
      />
    </>
  );
}

function WebhookPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.webhook.intro1', { defaultValue: 'Webhook fired once when each crawl finishes. Single' })}{' '}
        <code>POST</code>{' '}
        {t('settingsPanels.webhook.intro2', { defaultValue: 'with a JSON summary (start URL, duration, total URLs, status mix, every non-zero issue count). Empty disables.' })}
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <Text
          label={t('settingsPanels.webhook.url', { defaultValue: 'Webhook URL' })}
          value={form.webhookUrl}
          onChange={(v) => update('webhookUrl', v)}
          info="`POST <url>` is fired when the `done` event emits. 10 s timeout. Failures are logged as info events but never break the crawl."
          example="https://hooks.slack.com/services/T0/B0/abc, https://your-server.example/freecrawl-hook"
        />
        <p className="mt-1 text-[10px] text-surface-500">
          {t('settingsPanels.webhook.outro', { defaultValue: 'Compatible with Slack incoming webhooks (the JSON shape is rich enough for Slack to render plain text), Zapier "Catch Hook" triggers, Discord webhooks, and custom HTTP endpoints.' })}
        </p>
      </div>
    </>
  );
}

function AuthPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  const auth = form.auth;
  const setAuth = (patch: Partial<HttpAuth>) =>
    update('auth', { ...auth, ...patch });
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.auth.intro', { defaultValue: 'HTTP authentication applied on every request. Useful for staging environments behind Basic/Digest auth, or APIs that require a Bearer token. For sites behind an HTML login form, use Form Login below instead.' })}
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <label className="mb-2 flex flex-col gap-1">
          <FieldLabel
            label={t('settingsPanels.auth.scheme', { defaultValue: 'Auth scheme' })}
            info="`none` disables auth; `basic` adds `Authorization: Basic <base64>`; `bearer` adds `Authorization: Bearer <token>`; `digest` performs the RFC 2617 challenge-response on the first 401."
            example="basic/digest for /staging behind nginx; bearer for protected APIs"
          />
          <select
            className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
            value={auth.type}
            onChange={(e) =>
              setAuth({ type: e.target.value as HttpAuth['type'] })
            }
          >
            <option value="none">{t('settingsPanels.auth.schemeNone', { defaultValue: 'None' })}</option>
            <option value="basic">{t('settingsPanels.auth.schemeBasic', { defaultValue: 'Basic (username + password)' })}</option>
            <option value="digest">{t('settingsPanels.auth.schemeDigest', { defaultValue: 'Digest (username + password)' })}</option>
            <option value="bearer">{t('settingsPanels.auth.schemeBearer', { defaultValue: 'Bearer (token)' })}</option>
          </select>
        </label>

        {(auth.type === 'basic' || auth.type === 'digest') && (
          <>
            <Text
              label={t('settingsPanels.auth.username', { defaultValue: 'Username' })}
              value={auth.username ?? ''}
              onChange={(v) => setAuth({ username: v })}
              info="For Basic, sent base64-encoded; for Digest, hashed into the challenge response."
              example="staging-user"
            />
            <Text
              label={t('settingsPanels.auth.password', { defaultValue: 'Password' })}
              value={auth.password ?? ''}
              onChange={(v) => setAuth({ password: v })}
              info="Stored in your local prefs file as plain text. Treat the file accordingly."
              example="hunter2"
            />
          </>
        )}

        {auth.type === 'bearer' && (
          <Text
            label={t('settingsPanels.auth.token', { defaultValue: 'Token' })}
            value={auth.token ?? ''}
            onChange={(v) => setAuth({ token: v })}
            info="Sent verbatim as `Bearer <token>`. Don't include the `Bearer ` prefix yourself."
            example="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          />
        )}
      </div>

      <FormLoginEditor form={form} update={update} />
    </>
  );
}

function FormLoginEditor({ form, update }: PanelProps) {
  const { t } = useTranslation();
  const steps = form.formLoginSteps;
  const setSteps = (next: FormLoginStep[]) => update('formLoginSteps', next);
  const updateStep = (i: number, patch: Partial<FormLoginStep>) => {
    const next = steps.slice();
    next[i] = { ...next[i]!, ...patch };
    setSteps(next);
  };
  const addStep = () =>
    setSteps([...steps, { url: '', method: 'POST', fields: [], captures: [] }]);
  const browser = form.formLoginBrowser;
  const updateBrowser = (patch: Partial<BrowserLoginConfig>) =>
    update('formLoginBrowser', { ...browser, ...patch });

  return (
    <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settingsGroups.formLogin', { defaultValue: 'Form-Based Login' })}
        </div>
        <Bool
          label={t('settingsPanels.formLogin.enabled', { defaultValue: 'Enabled' })}
          checked={form.formLoginEnabled}
          onChange={(v) => update('formLoginEnabled', v)}
          info="Run the login steps once before the crawl, then replay the session cookies on every request."
        />
      </div>
      <p className="mb-3 text-[10px] text-surface-500">
        {t('settingsPanels.formLogin.intro', {
          defaultValue:
            'Steps run in order over one shared cookie jar. A GET step can capture a CSRF token from the page; a POST step submits credentials (and the captured token) as a form. Reference captured values with {{name}}.',
        })}
      </p>

      <label className="mb-3 flex items-center gap-2 text-[11px] text-surface-300">
        {t('settingsPanels.formLogin.mode', { defaultValue: 'Login method' })}
        <select
          className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
          value={form.formLoginMode}
          onChange={(e) => update('formLoginMode', e.target.value as 'http' | 'browser')}
        >
          <option value="http">
            {t('settingsPanels.formLogin.modeHttp', { defaultValue: 'HTTP (form POST + CSRF)' })}
          </option>
          <option value="browser">
            {t('settingsPanels.formLogin.modeBrowser', { defaultValue: 'Browser (SPA / JS login)' })}
          </option>
        </select>
      </label>

      {form.formLoginMode === 'browser' && (
        <div className="mb-2 rounded border border-surface-800 bg-surface-900/40 p-2">
          <p className="mb-2 text-[10px] text-surface-500">
            {t('settingsPanels.formLogin.browserIntro', {
              defaultValue:
                'Drives a real Chromium through the login form once (for JS-heavy / SPA logins), then replays the captured session cookies on the undici crawl. Requires the bundled Playwright browser.',
            })}
          </p>
          <Text
            label={t('settingsPanels.formLogin.loginUrl', { defaultValue: 'Login page URL' })}
            value={browser.loginUrl}
            onChange={(v) => updateBrowser({ loginUrl: v })}
            placeholder="https://app.example.com/login"
          />
          <div className="grid grid-cols-2 gap-2">
            <Text
              label={t('settingsPanels.formLogin.userSelector', { defaultValue: 'Username selector' })}
              value={browser.usernameSelector}
              onChange={(v) => updateBrowser({ usernameSelector: v })}
              placeholder="#email"
            />
            <Text
              label={t('settingsPanels.formLogin.userValue', { defaultValue: 'Username' })}
              value={browser.usernameValue}
              onChange={(v) => updateBrowser({ usernameValue: v })}
            />
            <Text
              label={t('settingsPanels.formLogin.passSelector', { defaultValue: 'Password selector' })}
              value={browser.passwordSelector}
              onChange={(v) => updateBrowser({ passwordSelector: v })}
              placeholder="#password"
            />
            <Text
              label={t('settingsPanels.formLogin.passValue', { defaultValue: 'Password' })}
              value={browser.passwordValue}
              onChange={(v) => updateBrowser({ passwordValue: v })}
              type="password"
            />
            <Text
              label={t('settingsPanels.formLogin.submitSelector', { defaultValue: 'Submit selector' })}
              value={browser.submitSelector}
              onChange={(v) => updateBrowser({ submitSelector: v })}
              placeholder="button[type=submit]"
            />
            <Text
              label={t('settingsPanels.formLogin.successSelector', {
                defaultValue: 'Logged-in selector (optional)',
              })}
              value={browser.successSelector ?? ''}
              onChange={(v) => updateBrowser({ successSelector: v })}
              placeholder="a[href*='logout']"
            />
          </div>
        </div>
      )}

      {form.formLoginMode === 'http' && (
        <>
      {steps.length === 0 && (
        <p className="mb-2 text-[11px] italic text-surface-500">
          {t('settingsPanels.formLogin.empty', { defaultValue: 'No steps — add one to define the login flow.' })}
        </p>
      )}

      {steps.map((step, i) => (
        <div key={i} className="mb-3 rounded border border-surface-800 bg-surface-900/40 p-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
              {t('settingsPanels.formLogin.stepN', { defaultValue: 'Step #{{n}}', n: i + 1 })}
            </div>
            <button
              className="rounded p-1 text-surface-500 hover:bg-surface-800 hover:text-red-400"
              onClick={() => setSteps(steps.filter((_, j) => j !== i))}
              title={t('settingsPanels.formLogin.removeStep', { defaultValue: 'Remove step' })}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mb-2 flex gap-2">
            <select
              className="w-24 rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
              value={step.method}
              onChange={(e) => updateStep(i, { method: e.target.value as FormLoginStep['method'] })}
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
            </select>
            <input
              className="flex-1 rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
              placeholder="https://example.com/login"
              value={step.url}
              spellCheck={false}
              onChange={(e) => updateStep(i, { url: e.target.value })}
            />
          </div>

          {step.method === 'POST' && (
            <div className="mb-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                {t('settingsPanels.formLogin.fields', { defaultValue: 'Form fields (name = value)' })}
              </div>
              {step.fields.map((f, fi) => (
                <div key={fi} className="mb-1 flex items-center gap-2">
                  <input
                    className="w-32 rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                    placeholder="username"
                    value={f.name}
                    onChange={(e) => {
                      const next = step.fields.slice();
                      next[fi] = { ...f, name: e.target.value };
                      updateStep(i, { fields: next });
                    }}
                  />
                  <input
                    className="flex-1 rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                    placeholder="admin  /  {{csrf}}"
                    value={f.value}
                    onChange={(e) => {
                      const next = step.fields.slice();
                      next[fi] = { ...f, value: e.target.value };
                      updateStep(i, { fields: next });
                    }}
                  />
                  <button
                    className="rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-300 hover:border-red-500 hover:text-red-300"
                    onClick={() => updateStep(i, { fields: step.fields.filter((_, j) => j !== fi) })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                className="mt-1 flex items-center gap-1 rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-200 hover:border-blue-500 hover:bg-surface-800"
                onClick={() => updateStep(i, { fields: [...step.fields, { name: '', value: '' }] })}
              >
                <Plus className="h-3 w-3" /> {t('settingsPanels.formLogin.addField', { defaultValue: 'Add field' })}
              </button>
            </div>
          )}

          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
              {t('settingsPanels.formLogin.captures', { defaultValue: 'Capture from response (name ← CSS selector)' })}
            </div>
            {step.captures.map((c, ci) => (
              <div key={ci} className="mb-1 flex items-center gap-2">
                <input
                  className="w-28 rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                  placeholder="csrf"
                  value={c.name}
                  onChange={(e) => {
                    const next = step.captures.slice();
                    next[ci] = { ...c, name: e.target.value };
                    updateStep(i, { captures: next });
                  }}
                />
                <input
                  className="flex-1 rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                  placeholder='input[name="_csrf"]'
                  spellCheck={false}
                  value={c.selector}
                  onChange={(e) => {
                    const next = step.captures.slice();
                    next[ci] = { ...c, selector: e.target.value };
                    updateStep(i, { captures: next });
                  }}
                />
                <input
                  className="w-20 rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                  placeholder="value"
                  value={c.attribute ?? ''}
                  onChange={(e) => {
                    const next = step.captures.slice();
                    next[ci] = { ...c, attribute: e.target.value };
                    updateStep(i, { captures: next });
                  }}
                />
                <button
                  className="rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-300 hover:border-red-500 hover:text-red-300"
                  onClick={() => updateStep(i, { captures: step.captures.filter((_, j) => j !== ci) })}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              className="mt-1 flex items-center gap-1 rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-200 hover:border-blue-500 hover:bg-surface-800"
              onClick={() =>
                updateStep(i, { captures: [...step.captures, { name: '', selector: '', attribute: 'value' }] })
              }
            >
              <Plus className="h-3 w-3" /> {t('settingsPanels.formLogin.addCapture', { defaultValue: 'Add capture' })}
            </button>
          </div>
        </div>
      ))}

      <button
        className="flex items-center gap-1 rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-200 hover:border-blue-500 hover:bg-surface-800"
        onClick={addStep}
      >
        <Plus className="h-3 w-3" /> {t('settingsPanels.formLogin.addStep', { defaultValue: 'Add login step' })}
      </button>
        </>
      )}
    </div>
  );
}

function NetworkPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.network.intro', { defaultValue: 'Network-level controls: proxy override, file-extension exclusion, redirect hop cap.' })}
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <Text
          label={t('settingsPanels.network.proxyUrl', { defaultValue: 'Proxy URL (overrides HTTPS_PROXY)' })}
          value={form.proxyUrl}
          onChange={(v) => update('proxyUrl', v)}
          info="HTTP/HTTPS proxies route via undici's ProxyAgent; SOCKS proxies (socks5://, socks5h://, socks4://, socks4a://) tunnel via the socks client. The `h`/`4a` variants resolve DNS at the proxy. Leave empty to inherit HTTPS_PROXY/HTTP_PROXY env vars."
          example="http://user:pass@proxy.corp:8080, socks5h://127.0.0.1:9050"
        />
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settingsGroups.savedProxyProfiles', { defaultValue: 'Saved Proxy Profiles' })}
        </div>
        <p className="mb-2 text-[10px] text-surface-500">
          {t('settingsPanels.network.savedProfilesDesc', { defaultValue: 'Save multiple `(name, URL)` pairs and switch between them via the dropdown below. The active profile overrides the Proxy URL field and the HTTPS_PROXY env var. Empty selection falls back to the Proxy URL above.' })}
        </p>
        <label className="mb-3 flex flex-col gap-1">
          <FieldLabel
            label={t('settingsPanels.network.activeProfile', { defaultValue: 'Active profile' })}
            info="Picks one of the saved profiles by name. Empty = use the Proxy URL field above (or env vars when that's also empty)."
          />
          <select
            className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
            value={form.proxyProfileActive}
            onChange={(e) => update('proxyProfileActive', e.target.value)}
          >
            <option value="">{t('settingsPanels.network.noneUseProxyAbove', { defaultValue: '— none (use Proxy URL above) —' })}</option>
            {form.proxyProfiles.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="space-y-2">
          {form.proxyProfiles.length === 0 && (
            <div className="rounded border border-dashed border-surface-700 px-3 py-3 text-center text-[11px] text-surface-500">
              {t('settingsPanels.network.noSavedProfiles', { defaultValue: 'No saved profiles — add one below.' })}
            </div>
          )}
          {form.proxyProfiles.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="w-32 rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                placeholder="Office"
                value={p.name}
                onChange={(e) => {
                  const next = [...form.proxyProfiles];
                  next[i] = { ...p, name: e.target.value };
                  update('proxyProfiles', next);
                }}
              />
              <input
                className="flex-1 rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                placeholder="http://proxy.corp:8080"
                value={p.url}
                onChange={(e) => {
                  const next = [...form.proxyProfiles];
                  next[i] = { ...p, url: e.target.value };
                  update('proxyProfiles', next);
                }}
              />
              <button
                className="rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-300 hover:border-red-500 hover:text-red-300"
                onClick={() => {
                  const next = form.proxyProfiles.filter((_, j) => j !== i);
                  update('proxyProfiles', next);
                  if (form.proxyProfileActive === p.name) {
                    update('proxyProfileActive', '');
                  }
                }}
                aria-label={t('settingsPanels.network.removeProfile', { defaultValue: 'Remove profile' })}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <button
          className="mt-2 flex items-center gap-1 rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-200 hover:border-blue-500 hover:bg-surface-800"
          onClick={() =>
            update('proxyProfiles', [...form.proxyProfiles, { name: '', url: '' }])
          }
        >
          <Plus className="h-3 w-3" /> {t('settingsPanels.network.addProxyProfile', { defaultValue: 'Add proxy profile' })}
        </button>
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <Text
          label={t('settingsPanels.network.excludeExtensions', { defaultValue: 'Exclude extensions (comma-separated)' })}
          value={form.excludeExtensionsText}
          onChange={(v) => update('excludeExtensionsText', v)}
          info="URL paths ending in any of these extensions are not enqueued. Case-insensitive. Start URL is always crawled regardless."
          example="pdf, jpg, png, woff2, mp4"
        />
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <Num
          label={t('settingsPanels.network.maxRedirects', { defaultValue: 'Max redirect hops' })}
          value={form.maxRedirects}
          onChange={(v) => update('maxRedirects', v)}
          info="Hard cap on the number of 3xx hops we follow for a single chain. Each hop is recorded as its own URL row regardless. 0 disables the cap (chain still ends at `redirect_loop`)."
          example="10 (default), 3 for very tight chains, 0 to remove the cap"
        />
      </div>
    </>
  );
}

function DuplicatesPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.duplicates.intro', { defaultValue: 'Near-duplicate detection. After every crawl, body text is hashed with a 64-bit SimHash, and pages whose hashes lie within the configured Hamming distance of each other are clustered as near-duplicates. Surfaced under' })}{' '}
        <strong>{t('settingsPanels.duplicates.path', { defaultValue: 'Issues → Content → Near-Duplicate' })}</strong>.
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settingsGroups.threshold', { defaultValue: 'Threshold' })}
        </div>
        <Num
          label={t('settingsPanels.duplicates.maxHamming', { defaultValue: 'Max Hamming distance (0 = exact only, 12 = very loose, 0 disables)' })}
          value={form.nearDuplicateHammingThreshold}
          onChange={(v) => update('nearDuplicateHammingThreshold', v)}
          info="Two pages are flagged as near-duplicates if their 64-bit SimHash differs by at most this many bits. 3 ≈ 95% similarity over body-text shingles (Screaming Frog's tightest filter). Set to 0 to skip clustering entirely."
          example="3 = recommended; 5 catches looser duplicates (templated content with light variation); 0 turns the post-crawl pass off."
        />
        <p className="mt-1 text-[10px] text-surface-500">
          {t('settingsPanels.duplicates.thresholdHint', { defaultValue: 'Lower = stricter. 3 is the SF-equivalent default. Pages with too little body content (<50 characters) are excluded from clustering regardless of threshold.' })}
        </p>
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settingsGroups.scope', { defaultValue: 'Scope' })}
        </div>
        <Bool
          label={t('settingsPanels.duplicates.onlyIndexable', { defaultValue: 'Only cluster indexable pages' })}
          checked={form.duplicatesOnlyIndexable}
          onChange={(v) => update('duplicatesOnlyIndexable', v)}
          info="When on, pages with noindex / canonicalised / robots-blocked indexability are excluded from clustering — the Near-Duplicate report then surfaces only issues that affect search visibility."
          example="ON for SEO audits (the typical case). Turn OFF to also cluster paginated / canonical-blocked variants for completeness."
        />
        <Bool
          label={t('settingsPanels.duplicates.preNormalize', { defaultValue: 'Normalise URLs before duplicate-URL check' })}
          checked={form.dedupePreNormalize}
          onChange={(v) => update('dedupePreNormalize', v)}
          info="When ON (default), the Duplicate URL filter compares URLs after lowercasing the host, dropping the query string, and trimming the trailing slash — the canonical SEO behaviour. When OFF, comparison is byte-exact, so the filter only fires on rows that share an identical raw URL string (rare since URLs are deduped at insert time)."
          example="ON for SEO audits. OFF only when you specifically need to inspect raw-URL collisions (e.g. case-sensitive filesystem CMSes)."
        />
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settingsGroups.contentArea', { defaultValue: 'Content area' })}
        </div>
        <Text
          label={t('settingsPanels.duplicates.contentAreaSelector', {
            defaultValue: 'Content area CSS selector (optional)',
          })}
          value={form.contentAreaSelector}
          onChange={(v) => update('contentAreaSelector', v)}
          info="CSS selector that pins the duplicate-fingerprint text extraction to a specific page region. When set, the heuristic (main / role=main / article / body-minus-chrome) is bypassed and the selector wins. Useful on sites where the heuristic misclassifies — e.g. CMSes that wrap navigation inside `<main>` or sites with no semantic landmarks at all. Empty = use the heuristic. Invalid selectors silently fall back to the heuristic so a typo doesn't break the crawl."
          example="article.main-content, #post-body, .article-body, div[itemprop='articleBody']"
        />
        <p className="mt-1 text-[10px] text-surface-500">
          {t('settingsPanels.duplicates.contentAreaHint', {
            defaultValue:
              'Applies to NEW crawls. Existing crawls keep their old fingerprints until you re-crawl.',
          })}
        </p>
      </div>

      <div className="rounded border border-surface-800 bg-surface-950/40 p-3 text-[10px] text-surface-500">
        <strong className="text-surface-300">{t('settingsPanels.duplicates.costLabel', { defaultValue: 'Cost:' })}</strong>{' '}
        {t('settingsPanels.duplicates.costBody', { defaultValue: 'SimHash adds ~5-10 ms per page during crawl; clustering itself runs after the last URL completes (~3-10 s at 1M URLs, <500 ms at 100K).' })}
      </div>
    </>
  );
}

function HardwarePanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.hardware.intro', { defaultValue: 'Resource caps for the crawler process. Useful for keeping the machine usable while crawling large sites (1M+ URLs).' })}
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settingsGroups.memory', { defaultValue: 'Memory' })}
        </div>
        <Num
          label={t('settingsPanels.hardware.memorySoftLimit', { defaultValue: 'Memory soft limit (MB) — 0 = unlimited' })}
          value={form.memoryLimitMb}
          onChange={(v) => update('memoryLimitMb', v)}
          info="Crawler RSS auto-pauses the queue when this is exceeded; resumes once memory drops to 80% of the cap. Soft cap — does not enforce a hard heap limit."
          example="2048 (≈2 GB) on a 4 GB laptop; 8192 on a 16 GB workstation; 0 to disable."
        />
        <p className="mt-1 text-[10px] text-surface-500">
          {t('settingsPanels.hardware.memoryHint', { defaultValue: "When the crawler's RSS exceeds this, the queue auto-pauses and resumes once memory drops below 80% of the cap. Soft cap — does not enforce a hard heap limit." })}
        </p>
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settingsGroups.queue', { defaultValue: 'Queue' })}
        </div>
        <Num
          label={t('settingsPanels.hardware.maxQueueSize', { defaultValue: 'Max in-memory queue size — 0 = unlimited' })}
          value={form.maxQueueSize}
          onChange={(v) => update('maxQueueSize', v)}
          info="Hard cap on pending URLs held in memory. Excess discoveries are dropped silently — bounds peak heap during fan-out bursts (big sitemaps, dense link graphs)."
          example="50000 keeps RAM bounded during big sitemap fan-outs; 0 for typical crawls."
        />
        <p className="mt-1 text-[10px] text-surface-500">
          {t('settingsPanels.hardware.queueHint', { defaultValue: 'Hard cap on pending URLs held in memory. Excess discoveries are dropped silently — bounds peak heap during fan-out bursts (large sitemaps, dense link graphs). Set conservatively if memory is tight.' })}
        </p>
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settingsGroups.cpu', { defaultValue: 'CPU' })}
        </div>
        <label className="mb-2 flex flex-col gap-1">
          <FieldLabel
            label={t('settingsPanels.hardware.processPriority', { defaultValue: 'Process priority' })}
            info="OS scheduler hint applied at crawl start. Lowering priority lets the rest of the machine stay responsive during heavy crawls. May require elevated privileges on some platforms."
            example="Below Normal while you keep working in other apps; Idle for overnight unattended runs."
          />
          <select
            className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
            value={form.processPriority}
            onChange={(e) =>
              update(
                'processPriority',
                e.target.value as 'normal' | 'below-normal' | 'idle',
              )
            }
          >
            <option value="normal">{t('settingsPanels.hardware.priorityNormal', { defaultValue: 'Normal' })}</option>
            <option value="below-normal">{t('settingsPanels.hardware.priorityBelowNormal', { defaultValue: 'Below Normal' })}</option>
            <option value="idle">{t('settingsPanels.hardware.priorityIdle', { defaultValue: 'Idle (lowest)' })}</option>
          </select>
        </label>
        <p className="text-[10px] text-surface-500">
          {t('settingsPanels.hardware.priorityHint1', { defaultValue: 'OS scheduler hint. Lowering priority lets the rest of the machine stay responsive during heavy crawls. Effective on next crawl start; may require elevated privileges on some platforms. For raw CPU concurrency, see' })}{' '}
          <strong>{t('settingsPanels.hardware.maxConcurrencyRef', { defaultValue: 'Max Concurrency' })}</strong>{' '}
          {t('settingsPanels.hardware.priorityHint2', { defaultValue: 'in the Crawler section.' })}
        </p>
      </div>
    </>
  );
}

function ContentPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.content.intro', { defaultValue: "How crawled HTML is stored on disk. Disable body snapshots to keep the project file small when you don't need the View Source detail tab; tighten the cap for sites with adversarially-large pages." })}
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settingsGroups.bodySnapshots', { defaultValue: 'Body Snapshots' })}
        </div>
        <Bool
          label={t('settingsPanels.content.storeBody', { defaultValue: 'Store raw HTML body per page' })}
          checked={form.storeBodySnapshots}
          onChange={(v) => update('storeBodySnapshots', v)}
          info="Drives the View Source detail tab. ~30–200 KB on disk per HTML page; turn off if you only need metadata and not full source viewing."
          example="On for SEO audits where View Source matters; off for 1M-URL crawls where disk is tight."
        />
        <div className="mt-3">
          <Num
            label={t('settingsPanels.content.bodyCap', { defaultValue: 'Body cap per page (bytes) — 0 = unbounded' })}
            value={form.bodySnapshotMaxBytes}
            onChange={(v) => update('bodySnapshotMaxBytes', v)}
            info="Bodies over this are truncated and flagged. 1 MB covers the 99.9th percentile of HTML pages without letting one adversarial 50 MB page bloat the project file."
            example="1048576 (1 MB) default; 524288 (512 KB) on tight disks; 0 to disable truncation entirely."
          />
        </div>
      </div>
    </>
  );
}

function CrawlAnalysisPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.crawlAnalysis.intro', { defaultValue: "Per-pass post-crawl analysis toggles. Each pass runs after the HTTP fetch phase finishes and feeds different issue filters. Skip passes you don't need to shave wall-clock on large crawls; the related issue counters quietly read as 0 until the pass runs." })}
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3 space-y-2">
        <Bool
          label={t('settingsPanels.crawlAnalysis.recomputeInlinks', { defaultValue: 'Recompute inlinks' })}
          checked={form.analyseInlinks}
          onChange={(v) => update('analyseInlinks', v)}
          info="Counts how many internal pages link to each URL. Drives the Most-Linked URLs report and the per-row Inlinks column."
        />
        <Bool
          label={t('settingsPanels.crawlAnalysis.linkScore', { defaultValue: 'Compute link score (internal PageRank)' })}
          checked={form.analyseLinkScore}
          onChange={(v) => update('analyseLinkScore', v)}
          info="Runs iterative PageRank (damping 0.85) over the internal link graph and normalises it to a 0–100 Link Score per page. Drives the Link Score column and the 'By Link Score' visualization colour mode."
        />
        <Bool
          label={t('settingsPanels.crawlAnalysis.recomputeRedirectChains', { defaultValue: 'Recompute redirect chains' })}
          checked={form.analyseRedirectChains}
          onChange={(v) => update('analyseRedirectChains', v)}
          info="Walks 3xx redirect chains, fills `redirect_chain_length` / `redirect_loop`. Drives the 'Long Chain' and 'Redirect Loop' issues + the Redirects tab."
        />
        <Bool
          label={t('settingsPanels.crawlAnalysis.hreflang', { defaultValue: 'Hreflang reciprocity + inconsistent lang' })}
          checked={form.analyseHreflang}
          onChange={(v) => update('analyseHreflang', v)}
          info="Page A→B declared but B→A absent flags 'Reciprocity Missing'; same lang on two hrefs flags 'Inconsistent Lang'."
        />
        <Bool
          label={t('settingsPanels.crawlAnalysis.nearDuplicate', { defaultValue: 'Near-duplicate clustering' })}
          checked={form.analyseDuplicates}
          onChange={(v) => update('analyseDuplicates', v)}
          info="64-bit SimHash + LSH bucketing + Union-Find clustering on body shingles. Most expensive pass — typical 5–10 s on a 100k crawl."
        />
        <Bool
          label={t('settingsPanels.crawlAnalysis.paginationGap', { defaultValue: 'Pagination ordinal-gap detection' })}
          checked={form.analysePagination}
          onChange={(v) => update('analysePagination', v)}
          info="?page=1 / ?page=2 / ?page=4 → flags 'Sequence Break' on every member of the broken cluster."
        />
        <Bool
          label={t('settingsPanels.crawlAnalysis.materialiseIssues', { defaultValue: 'Materialise heavy issue counters' })}
          checked={form.analyseIssues}
          onChange={(v) => update('analyseIssues', v)}
          info="Pre-computes Dead External Domain, Duplicate URL post-norm, Canonical Chain Multi-hop. Without this the sidebar shows 0 for those three."
        />
      </div>
    </>
  );
}

function IssuesPanel() {
  const { t } = useTranslation();
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.issues.intro', { defaultValue: 'Per-issue check on/off toggles.' })}
      </p>
      <div className="rounded border border-amber-700/40 bg-amber-900/10 p-3 text-[11px] text-amber-200">
        <strong>{t('settingsPanels.issues.v2Prefix', { defaultValue: 'Coming in V2.' })}</strong>{' '}
        {t('settingsPanels.issues.v2Body', { defaultValue: 'Today every issue check runs unconditionally and surfaces in the sidebar. The plan is to let you silence specific checks per-project (e.g. disable "Description = Title" on a CMS that\'s known to do it intentionally). Until that ships, hide rows you don\'t care about by collapsing the sidebar group, or filter them out via the Advanced filter on each tab.' })}
      </div>
    </>
  );
}

function AdvancedPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.advanced.intro', { defaultValue: 'Lower-level caps and link-follow toggles. Defaults are tuned for typical SEO audits — only touch these if you know why.' })}
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settingsGroups.linkResponseCaps', { defaultValue: 'Link & Response Caps' })}
        </div>
        <Num
          label={t('settingsPanels.advanced.maxLinksPerPage', { defaultValue: 'Max links per page (issue threshold)' })}
          value={form.maxLinksPerPage}
          onChange={(v) => update('maxLinksPerPage', v)}
          info="Pages with > this many outgoing links (internal + external) trip the 'Total Links per Page' issue. Google's historic recommendation is 100; mega-menus/hub-pages routinely blow past this."
          example="100 default; 50 for tight on-page link discipline; 0 to disable the issue."
        />
        <Num
          label={t('settingsPanels.advanced.maxResponseTime', { defaultValue: 'Max response time (ms) — 0 = disabled' })}
          value={form.maxResponseTimeMs}
          onChange={(v) => update('maxResponseTimeMs', v)}
          info="Aborts requests whose total lifetime (connect + headers + body) exceeds this. Distinct from `requestTimeoutMs` which is the headers timeout. Useful for capping individual slow pages without lowering the overall fetch timeout."
          example="60000 (1 minute) for huge resources; 0 to rely solely on the fetch timeout."
        />
        <Num
          label={t('settingsPanels.advanced.maxFileSize', { defaultValue: 'Max file size (bytes) — 0 = disabled' })}
          value={form.maxFileSizeBytes}
          onChange={(v) => update('maxFileSizeBytes', v)}
          info="Skips body parsing for pages whose Content-Length header exceeds this. The page row is still created so links to it aren't lost; only body parsing and source snapshot capture are skipped."
          example="10485760 (10 MB) on bandwidth-tight crawls; 0 to download anything."
        />
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settingsGroups.urlStructureThresholds', { defaultValue: 'URL Structure Thresholds' })}
        </div>
        <Num
          label={t('settingsPanels.advanced.maxUrlLength', { defaultValue: 'Max URL length (chars)' })}
          value={form.maxUrlLength}
          onChange={(v) => update('maxUrlLength', v)}
          info="Trips the 'URL Too Long' issue when LENGTH(url) > this. RFC 7230 doesn't mandate a max but most servers + middleboxes fail above ~2 KB; Chrome itself caps at ~32 KB."
          example="2048 default (RFC-suggested practical ceiling)."
        />
        <Num
          label={t('settingsPanels.advanced.maxQueryStringLength', { defaultValue: 'Max query string length (chars) — 0 = disabled' })}
          value={form.maxQueryStringLength}
          onChange={(v) => update('maxQueryStringLength', v)}
          info="Trips 'Long Query String' when LENGTH(query) > this. Typical session-id sprawl + UTM tracking hits 100+ chars; over 200 starts to look like a bug."
          example="100 default for most audits; 0 to disable the check."
        />
        <Num
          label={t('settingsPanels.advanced.maxFolderDepth', { defaultValue: 'Max folder depth — 0 = disabled' })}
          value={form.maxFolderDepth}
          onChange={(v) => update('maxFolderDepth', v)}
          info="Trips 'Folder Depth Too Deep' when the URL path's `/`-segment count exceeds this. Useful for spotting over-nested URL structures that bury content from crawlers."
          example="4 default; 6 on documentation sites with deep TOC trees; 0 to disable."
        />
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3 space-y-2">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settingsGroups.linkFollowBehaviour', { defaultValue: 'Link Follow Behaviour' })}
        </div>
        <Bool
          label={t('settingsPanels.advanced.followCanonical', { defaultValue: 'Follow canonical targets' })}
          checked={form.followCanonicals}
          onChange={(v) => update('followCanonicals', v)}
          info="When on, a 200 page declaring a canonical pointing elsewhere also enqueues that target. Default off — most crawls treat canonicals as a signal, not a navigation hint."
        />
        <Bool
          label={t('settingsPanels.advanced.followNextPrev', { defaultValue: 'Follow rel=next / rel=prev' })}
          checked={form.followPaginationLinks}
          onChange={(v) => update('followPaginationLinks', v)}
          info="When on (default), pagination_next + pagination_prev URLs are post-fetch enqueued. Off only to debug pagination-only loops without disabling all link follow."
        />
        <Bool
          label={t('settingsPanels.advanced.followNofollow', { defaultValue: "Follow nofollow links (override 'respect nofollow')" })}
          checked={form.followNofollow}
          onChange={(v) => update('followNofollow', v)}
          info="When on, rel=nofollow links are recursed into like any other link. Default off — Screaming Frog 'Respect Nofollow' default."
        />
        <Bool
          label={t('settingsPanels.advanced.followJsMetaRefresh', { defaultValue: 'Follow JS / meta-refresh redirects' })}
          checked={form.followJsRedirects}
          onChange={(v) => update('followJsRedirects', v)}
          info="When on, `<meta http-equiv='refresh'>` content URLs are enqueued like a redirect target. window.location body redirects are heuristic-only and currently out of scope."
        />
      </div>
    </>
  );
}

function CookiesPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.cookies.intro', { defaultValue: 'Cookie policy applied to every fetch. The crawler is otherwise stateless across requests; this setting controls whether Set-Cookie response headers are recorded for the cookie-flag issue checks (Missing Secure / HttpOnly / SameSite).' })}
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <label className="flex flex-col gap-1">
          <FieldLabel
            label={t('settingsPanels.cookies.policy', { defaultValue: 'Cookie policy' })}
            info="Reject-all = ignore Set-Cookie entirely (zero counts on cookie-flag issues). Block-third-party = analyse only first-party cookies (Domain attribute matches the page's registrable domain). Accept-all = analyse every Set-Cookie regardless of scope."
            example="Reject-all for stateless audits; Block-third-party to focus on the site's own cookie hygiene; Accept-all to also see ad/analytics tracker cookies."
          />
          <select
            className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
            value={form.cookiePolicy}
            onChange={(e) =>
              update(
                'cookiePolicy',
                e.target.value as 'reject-all' | 'accept-all' | 'block-third-party',
              )
            }
          >
            <option value="reject-all">{t('settingsPanels.cookies.rejectAll', { defaultValue: 'Reject all (default — stateless)' })}</option>
            <option value="accept-all">{t('settingsPanels.cookies.acceptAll', { defaultValue: 'Accept all' })}</option>
            <option value="block-third-party">{t('settingsPanels.cookies.blockThirdParty', { defaultValue: 'Block third-party' })}</option>
          </select>
        </label>
        <p className="mt-2 text-[10px] text-surface-500">
          {t('settingsPanels.cookies.valuesNeverStored1', { defaultValue: 'Cookie values themselves are' })}{' '}
          <strong>{t('settingsPanels.cookies.never', { defaultValue: 'never' })}</strong>{' '}
          {t('settingsPanels.cookies.valuesNeverStored2', { defaultValue: 'stored in the project file regardless of this setting — only the security flag (Secure / HttpOnly / SameSite) counts are kept.' })}
        </p>
      </div>
    </>
  );
}

function PerHostUaPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  const rules = form.perHostUserAgents;
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.perHostUa.intro', { defaultValue: "Override the User-Agent on a per-host basis. Useful when crawling a mobile subdomain with the mobile-Googlebot UA in the same run as the desktop site, or when a CDN serves a different page based on the requester's UA. The first matching pattern wins; the global User-Agent (Requests tab) is the fallback." })}
      </p>
      <div className="mb-3 rounded border border-surface-800 bg-surface-950/40 p-3">
        <p className="mb-2 text-[10px] text-surface-500">
          {t('settingsPanels.perHostUa.syntax1', { defaultValue: 'Pattern syntax: exact host' })}{' '}(<code>m.example.com</code>){' '}
          {t('settingsPanels.perHostUa.syntax2', { defaultValue: 'or leading wildcard' })}{' '}(<code>*.example.com</code>) {' '}
          {t('settingsPanels.perHostUa.syntax3', { defaultValue: '— the wildcard form matches any subdomain but' })}{' '}
          <em>{t('settingsPanels.perHostUa.notApex', { defaultValue: 'not' })}</em>{' '}{t('settingsPanels.perHostUa.theApex', { defaultValue: 'the apex.' })}
        </p>
        <div className="space-y-2">
          {rules.length === 0 && (
            <div className="rounded border border-dashed border-surface-700 px-3 py-4 text-center text-[11px] text-surface-500">
              {t('settingsPanels.perHostUa.empty', { defaultValue: 'No per-host overrides yet — add one below.' })}
            </div>
          )}
          {rules.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="flex-1 rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                placeholder="*.m.example.com"
                value={r.hostPattern}
                onChange={(e) => {
                  const next = [...rules];
                  next[i] = { ...r, hostPattern: e.target.value };
                  update('perHostUserAgents', next);
                }}
              />
              <input
                className="flex-[2] rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                placeholder="Mozilla/5.0 (iPhone; …)"
                value={r.userAgent}
                onChange={(e) => {
                  const next = [...rules];
                  next[i] = { ...r, userAgent: e.target.value };
                  update('perHostUserAgents', next);
                }}
              />
              <button
                className="rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-300 hover:border-red-500 hover:text-red-300"
                onClick={() => {
                  const next = rules.filter((_, j) => j !== i);
                  update('perHostUserAgents', next);
                }}
                title={t('common.remove', { defaultValue: 'Remove' })}
                aria-label={t('settingsPanels.perHostUa.removeRule', { defaultValue: 'Remove rule' })}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <button
          className="mt-3 flex items-center gap-1 rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-200 hover:border-blue-500 hover:bg-surface-800"
          onClick={() =>
            update('perHostUserAgents', [
              ...rules,
              { hostPattern: '', userAgent: '' },
            ])
          }
        >
          <Plus className="h-3 w-3" />{' '}
          {t('settingsPanels.perHostUa.addRule', { defaultValue: 'Add per-host UA rule' })}
        </button>
      </div>
    </>
  );
}

function FieldLabel({
  label,
  info,
  example,
  className,
}: {
  label: string;
  info?: string;
  example?: string;
  className?: string;
}) {
  const { i18n } = useTranslation();
  return (
    <span className={clsx('flex items-center gap-1 text-[10px] text-surface-400', className)}>
      <span>{translateLabel(label, i18n.language)}</span>
      <InfoTip info={info} example={example} />
    </span>
  );
}

function Num({
  label,
  value,
  onChange,
  info,
  example,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & FieldInfo) {
  return (
    <label className="flex flex-col gap-1">
      <FieldLabel label={label} info={info} example={example} />
      <input
        type="number"
        className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Text({
  label,
  value,
  onChange,
  info,
  example,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
} & FieldInfo) {
  return (
    <label className="mb-3 flex flex-col gap-1">
      <FieldLabel label={label} info={info} example={example} />
      <input
        type={type}
        className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
  rows,
  placeholder,
  info,
  example,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  placeholder?: string;
} & FieldInfo) {
  return (
    <label className="mb-3 flex flex-col gap-1">
      <FieldLabel label={label} info={info} example={example} />
      <textarea
        className="rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        spellCheck={false}
      />
    </label>
  );
}

function Bool({
  label,
  checked,
  onChange,
  hint,
  info,
  example,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  /** Greys the row out when the setting cannot apply in the current
   *  configuration, rather than letting a click silently override the
   *  setting that is actually in charge. */
  disabled?: boolean;
} & FieldInfo) {
  return (
    <label className={clsx('flex items-start gap-2', disabled && 'opacity-50')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className={clsx('mt-0.5', disabled && 'cursor-not-allowed')}
      />
      <BoolLabel label={label} info={info} example={example} hint={hint} />
    </label>
  );
}

function BoolLabel({
  label,
  info,
  example,
  hint,
}: {
  label: string;
  info?: string;
  example?: string;
  hint?: string;
}) {
  const { i18n } = useTranslation();
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1">
        <span className="text-[12px] text-surface-100">{translateLabel(label, i18n.language)}</span>
        <InfoTip info={info} example={example} />
      </span>
      {hint && <span className="text-[10px] text-surface-500">{hint}</span>}
    </div>
  );
}

/**
 * V1 Faz 7 — Integrations panel. The credential-management foundation:
 * lists every integration from the `INTEGRATIONS` catalog grouped by
 * category, lets the user paste API keys / OAuth client credentials,
 * and stores them safeStorage-encrypted via the credential-store IPC.
 *
 * Secret field values never come back from the main process — a
 * configured secret renders as a "saved" placeholder; typing replaces
 * it. The actual provider API calls land in follow-up work; this panel
 * is the storage + status surface they will read from.
 */
const INTEGRATION_CATEGORIES: { key: IntegrationDef['category']; label: string }[] = [
  { key: 'ai', label: 'AI' },
  { key: 'performance', label: 'Performance' },
  { key: 'seo', label: 'SEO Data' },
  { key: 'google', label: 'Google' },
];

const AUTH_TYPE_LABEL: Record<IntegrationDef['authType'], string> = {
  'api-key': 'API Key',
  'oauth-byoc': 'OAuth (your own client)',
  'service-account': 'Service Account',
  local: 'Local',
};

function RenderingPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  const enabled = form.renderingMode === 'js';
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.rendering.intro', {
          defaultValue:
            'JavaScript rendering uses headless Chromium (Playwright) to fetch the post-load DOM after scripts execute. Required for SPA / hydration-only content. Significantly slower than text mode — every URL pays a browser-launch and wait cost. Enable in the Crawler panel under Rendering Mode.',
        })}
      </p>

      {!enabled ? (
        <div className="mb-4 rounded border border-amber-800/60 bg-amber-950/30 p-3 text-[11px] text-amber-200">
          {t('settingsPanels.rendering.disabledHint', {
            defaultValue:
              'Rendering Mode is currently set to Text or Old AJAX. Switch to JavaScript Rendering in the Crawler panel to apply the settings below.',
          })}
        </div>
      ) : null}

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[11px] font-semibold text-surface-200">
          {t('settingsPanels.rendering.viewport', { defaultValue: 'Viewport' })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <FieldLabel
              label={t('settingsPanels.rendering.viewportWidth', { defaultValue: 'Width (px)' })}
              info="Viewport width applied to every rendered page. Mobile audits typically use 360–414, desktop 1280–1920."
              example="1366 = standard laptop, 1920 = full HD desktop, 375 = iPhone width."
            />
            <input
              type="number"
              min={320}
              max={3840}
              className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              disabled={!enabled}
              value={form.jsViewportWidth}
              onChange={(e) => update('jsViewportWidth', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <FieldLabel
              label={t('settingsPanels.rendering.viewportHeight', { defaultValue: 'Height (px)' })}
              info="Viewport height — affects above-the-fold detection and lazy-load triggers."
              example="768 = standard laptop, 1080 = full HD desktop, 667 = iPhone 8 height."
            />
            <input
              type="number"
              min={240}
              max={2160}
              className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              disabled={!enabled}
              value={form.jsViewportHeight}
              onChange={(e) => update('jsViewportHeight', e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[11px] font-semibold text-surface-200">
          {t('settingsPanels.rendering.waitConditions', { defaultValue: 'Wait Conditions' })}
        </div>
        <label className="mb-3 flex flex-col gap-1">
          <FieldLabel
            label={t('settingsPanels.rendering.waitUntil', { defaultValue: 'Wait until' })}
            info="When Playwright considers navigation complete. domcontentloaded = HTML parsed but resources still loading. load = window.load fired. networkidle = no network activity for 500ms (best for SPA but slower). commit = just response committed (fastest, riskiest)."
            example="load = good default. networkidle for heavy SPAs. domcontentloaded if you only need raw HTML."
          />
          <select
            className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            disabled={!enabled}
            value={form.jsWaitUntil}
            onChange={(e) =>
              update(
                'jsWaitUntil',
                e.target.value as 'load' | 'domcontentloaded' | 'networkidle' | 'commit',
              )
            }
          >
            <option value="load">load (default)</option>
            <option value="domcontentloaded">domcontentloaded</option>
            <option value="networkidle">networkidle</option>
            <option value="commit">commit (fastest)</option>
          </select>
        </label>
        <label className="mb-3 flex flex-col gap-1">
          <FieldLabel
            label={t('settingsPanels.rendering.ajaxTimeoutMs', { defaultValue: 'Extra wait after load (ms)' })}
            info="Additional time to wait after the chosen wait condition fires, for SPA hydration / late XHRs. 0 = no extra wait. Bounded by the request timeout."
            example="0 for SSR sites, 2000 for typical SPAs, 5000+ for heavy client-rendered apps."
          />
          <input
            type="number"
            min={0}
            max={60000}
            step={500}
            className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            disabled={!enabled}
            value={form.jsAjaxTimeoutMs}
            onChange={(e) => update('jsAjaxTimeoutMs', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <FieldLabel
            label={t('settingsPanels.rendering.waitSelector', { defaultValue: 'Wait for CSS selector (optional)' })}
            info="If set, Playwright waits for this CSS selector to appear in the DOM before extracting HTML. Overrides the extra-wait timeout when present. Useful when you know the SPA reveals a specific element after hydration."
            example="#app-loaded, .product-listing, [data-hydrated='true']"
          />
          <input
            type="text"
            placeholder="#app-loaded"
            className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            disabled={!enabled}
            value={form.jsWaitSelector}
            onChange={(e) => update('jsWaitSelector', e.target.value)}
          />
        </label>
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[11px] font-semibold text-surface-200">
          {t('settingsPanels.rendering.resourceBlocking', { defaultValue: 'Resource Blocking' })}
        </div>
        <p className="mb-2 text-[11px] text-surface-400">
          {t('settingsPanels.rendering.resourceBlockingHint', {
            defaultValue:
              'Block resource types before they hit the network — speeds up rendering at the cost of fidelity. Images and fonts are typically safe to block for SEO crawls; blocking scripts defeats the point of JS rendering.',
          })}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Bool
            label={t('settingsPanels.rendering.blockImages', { defaultValue: 'Block images' })}
            checked={form.jsBlockImages}
            onChange={(v) => update('jsBlockImages', v)}
            hint=""
            info="Aborts <img>, <picture>, background-image requests. Recommended for SEO crawls — image metadata still comes from <img> tag attributes."
            example="On for max speed. Off if you need LCP candidate detection or visual screenshots later."
          />
          <Bool
            label={t('settingsPanels.rendering.blockFonts', { defaultValue: 'Block fonts' })}
            checked={form.jsBlockFonts}
            onChange={(v) => update('jsBlockFonts', v)}
            hint=""
            info="Aborts @font-face / Google Fonts / WOFF2 requests. FOUT visible but text still renders."
            example="On — fonts add overhead without changing SEO output."
          />
          <Bool
            label={t('settingsPanels.rendering.blockMedia', { defaultValue: 'Block media (video/audio)' })}
            checked={form.jsBlockMedia}
            onChange={(v) => update('jsBlockMedia', v)}
            hint=""
            info="Aborts <video> / <audio> sources. Page DOM still includes the <video> tag."
            example="On (default) — media is heavy and rarely SEO-relevant."
          />
          <Bool
            label={t('settingsPanels.rendering.blockStylesheets', { defaultValue: 'Block stylesheets' })}
            checked={form.jsBlockStylesheets}
            onChange={(v) => update('jsBlockStylesheets', v)}
            hint=""
            info="Aborts external CSS. Inline styles still load. WARNING: many SPAs use CSS-driven visibility / lazy classes — blocking CSS may hide content that JS depends on."
            example="Off — small speed gain not worth the fidelity loss."
          />
          <Bool
            label={t('settingsPanels.rendering.blockScripts', { defaultValue: 'Block scripts (defeats JS render!)' })}
            checked={form.jsBlockScripts}
            onChange={(v) => update('jsBlockScripts', v)}
            hint=""
            info="Aborts all <script> requests. This defeats the purpose of JS rendering — use Text Only mode instead."
            example="Off — only enable for testing edge cases."
          />
        </div>
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[11px] font-semibold text-surface-200">
          {t('settingsPanels.rendering.browserConfig', { defaultValue: 'Browser' })}
        </div>
        <div className="mb-3">
          <Bool
            label={t('settingsPanels.rendering.headless', { defaultValue: 'Headless (no visible window)' })}
            checked={form.jsRenderHeadless}
            onChange={(v) => update('jsRenderHeadless', v)}
            hint="Default on"
            info="Run Chromium without a visible window. Turn off to debug rendering visually — useful when a page renders correctly in a normal browser but not under Playwright."
            example="On for production crawls. Off when debugging selector-not-found / hydration issues."
          />
        </div>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <FieldLabel
              label={t('settingsPanels.rendering.browserChannel', { defaultValue: 'Chromium channel' })}
              info="Empty = use the bundled Playwright Chromium build (recommended — pinned version, works everywhere). 'chrome' / 'msedge' uses the system-installed browser. Beta channels for testing newer features."
              example="Empty = safest. 'chrome' if you want the same Chrome version your users see."
            />
            <select
              className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              disabled={!enabled}
              value={form.jsBrowserChannel}
              onChange={(e) =>
                update(
                  'jsBrowserChannel',
                  e.target.value as '' | 'chrome' | 'msedge' | 'chrome-beta' | 'msedge-beta',
                )
              }
            >
              <option value="">Bundled Chromium (default)</option>
              <option value="chrome">Chrome (system)</option>
              <option value="msedge">Edge (system)</option>
              <option value="chrome-beta">Chrome Beta</option>
              <option value="msedge-beta">Edge Beta</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <FieldLabel
              label={t('settingsPanels.rendering.maxPages', { defaultValue: 'Parallel render pages' })}
              info="Number of browser tabs the pool keeps warm in parallel. 0 = auto (matches crawler concurrency, capped at 8). More tabs = faster crawl but more RAM (each tab ~80–150 MB)."
              example="0 = auto. 4 for 8GB RAM machines, 8+ for 16GB+."
            />
            <input
              type="number"
              min={0}
              max={32}
              className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              disabled={!enabled}
              value={form.jsMaxPages}
              onChange={(e) => update('jsMaxPages', e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <label className="flex flex-col gap-1">
          <FieldLabel
            label={t('settingsPanels.rendering.prerenderJs', { defaultValue: 'Pre-navigation JS snippet (optional)' })}
            info="JavaScript executed in every page BEFORE navigation begins (init script). Use to set localStorage / cookies / mock APIs / disable animations. Runs in page context — no Node access."
            example={"window.localStorage.setItem('cookie-consent', 'accepted');"}
          />
          <textarea
            rows={5}
            placeholder="window.localStorage.setItem('cookie-consent', 'accepted');"
            className="rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            disabled={!enabled}
            value={form.jsPrerenderJs}
            onChange={(e) => update('jsPrerenderJs', e.target.value)}
          />
        </label>
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[11px] font-semibold text-surface-200">
          {t('settingsPanels.rendering.screenshot', { defaultValue: 'Screenshot Capture' })}
        </div>
        <p className="mb-2 text-[11px] text-surface-400">
          {t('settingsPanels.rendering.screenshotHint', {
            defaultValue:
              'PNG screenshots written to a sidecar folder next to the .seoproject file. Adds ~150–500ms per URL — leave off unless you need them for the visual audit.',
          })}
        </p>
        <label className="mb-3 flex flex-col gap-1">
          <FieldLabel
            label={t('settingsPanels.rendering.screenshotMode', { defaultValue: 'Capture mode' })}
            info="Full-page renders the entire scrollable canvas; Above-the-fold captures just the initial viewport (cheaper). Both writes two PNGs per URL."
            example="None for fastest crawl. Above-the-fold for SERP-thumbnail-style preview. Full page when you need long-page snapshots."
          />
          <select
            className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            disabled={!enabled}
            value={form.jsScreenshotMode}
            onChange={(e) =>
              update(
                'jsScreenshotMode',
                e.target.value as 'none' | 'fullpage' | 'fold' | 'both',
              )
            }
          >
            <option value="none">{t('settingsPanels.rendering.screenshotNone', { defaultValue: 'None (default)' })}</option>
            <option value="fold">{t('settingsPanels.rendering.screenshotFold', { defaultValue: 'Above the fold' })}</option>
            <option value="fullpage">{t('settingsPanels.rendering.screenshotFull', { defaultValue: 'Full page' })}</option>
            <option value="both">{t('settingsPanels.rendering.screenshotBoth', { defaultValue: 'Both (full page + fold)' })}</option>
          </select>
        </label>
        <Bool
          label={t('settingsPanels.rendering.mobileScreenshot', { defaultValue: 'Also capture mobile viewport (375×667)' })}
          checked={form.jsMobileScreenshot}
          onChange={(v) => update('jsMobileScreenshot', v)}
          hint=""
          info="Renders the page a second time on a mobile viewport and stores an above-the-fold PNG. Adds another full render + screenshot per URL."
          example="On when auditing mobile UX or capturing PageSpeed-style mobile previews."
        />
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[11px] font-semibold text-surface-200">
          {t('settingsPanels.rendering.advancedAudits', { defaultValue: 'Advanced Audits' })}
        </div>
        <div className="flex flex-col gap-2">
          <Bool
            label={t('settingsPanels.rendering.mobileUsability', { defaultValue: 'Mobile Usability audit' })}
            checked={form.jsMobileUsability}
            onChange={(v) => update('jsMobileUsability', v)}
            hint=""
            info="Re-renders each page on a mobile viewport and checks viewport meta tag, horizontal overflow, font size legibility, and tap-target spacing. Stores a pass/fail verdict on the urls table."
            example="On for SEO audits that include Google's Mobile-Friendly checks."
          />
          <Bool
            label={t('settingsPanels.rendering.lcpCandidate', { defaultValue: 'LCP candidate detection' })}
            checked={form.jsLcpCandidate}
            onChange={(v) => update('jsLcpCandidate', v)}
            hint=""
            info="Identifies the largest element visible in the initial viewport (likely LCP candidate per Google's heuristic) and stores its CSS selector, dimensions, and resource URL. Useful for spotting unoptimised LCP images without a PSI API call."
            example="On for performance-focused audits."
          />
          <Bool
            label={t('settingsPanels.rendering.a11yAudit', { defaultValue: 'Accessibility audit (contrast + focus)' })}
            checked={form.jsA11yAudit}
            onChange={(v) => update('jsA11yAudit', v)}
            hint=""
            info="Audits the rendered DOM for WCAG AA colour-contrast failures (4.5:1 normal text, 3:1 large text) and stylesheet rules that suppress the keyboard focus outline without a :focus-visible fallback. Surfaces the Low-Contrast Text and Focus Outline Suppressed issue filters."
            example="On for accessibility / WCAG audits."
          />
        </div>
      </div>
    </>
  );
}

function PerformanceBudgetPanel({ form, update }: PanelProps) {
  const { t } = useTranslation();
  const on = form.budgetEnabled;
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settingsPanels.performanceBudget.intro', {
          defaultValue:
            'Set per-page performance ceilings. After each crawl, internal HTML pages that exceed any enabled threshold are flagged under the "Over Performance Budget" issue filter. Response time and page size come from the crawl itself; LCP and CLS use PageSpeed Insights data when present. Set any field to 0 to disable that individual check.',
        })}
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <Bool
          label={t('settingsPanels.performanceBudget.enabled', { defaultValue: 'Enable performance budget' })}
          checked={form.budgetEnabled}
          onChange={(v) => update('budgetEnabled', v)}
          hint=""
          info="When off, no budget evaluation runs and the verdict column is cleared. When on, the post-crawl pass scores every internal 200 HTML page against the ceilings below."
          example="On for performance-focused audits that should fail pages over a target."
        />
      </div>

      <div className={clsx('mb-4 rounded border border-surface-800 bg-surface-950/40 p-3', !on && 'opacity-50')}>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settingsGroups.budgetThresholds', { defaultValue: 'Budget Thresholds' })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Num
            label={t('settingsPanels.performanceBudget.maxResponseMs', { defaultValue: 'Max response time (ms)' })}
            value={form.budgetMaxResponseMs}
            onChange={(v) => update('budgetMaxResponseMs', v)}
            info="Server response time (a TTFB proxy) measured during the crawl. Pages slower than this are flagged. Google considers a good server response time under 800 ms."
            example="800 default; 200 for CDN-backed static; 0 to disable."
          />
          <Num
            label={t('settingsPanels.performanceBudget.maxPageKb', { defaultValue: 'Max page size (KB)' })}
            value={form.budgetMaxPageKb}
            onChange={(v) => update('budgetMaxPageKb', v)}
            info="HTML transfer size of the page document. Heavy HTML payloads delay first paint. Stored as bytes internally; entered here in kilobytes."
            example="1024 (1 MB) default; 150 for a lean HTML budget; 0 to disable."
          />
          <Num
            label={t('settingsPanels.performanceBudget.maxLcpMs', { defaultValue: 'Max LCP (ms)' })}
            value={form.budgetMaxLcpMs}
            onChange={(v) => update('budgetMaxLcpMs', v)}
            info="Largest Contentful Paint from PageSpeed Insights lab data, when the URL has been audited. Google's 'good' LCP threshold is 2500 ms. Pages without PSI data are never flagged on this metric."
            example="2500 default (Google 'good'); 0 to disable."
          />
          <Num
            label={t('settingsPanels.performanceBudget.maxCls', { defaultValue: 'Max CLS' })}
            value={form.budgetMaxCls}
            onChange={(v) => update('budgetMaxCls', v)}
            info="Cumulative Layout Shift from PageSpeed Insights, when present. Google's 'good' CLS threshold is 0.1. Unitless; accepts decimals. Pages without PSI data are never flagged."
            example="0.1 default (Google 'good'); 0 to disable."
          />
        </div>
      </div>
    </>
  );
}

/**
 * One integration's own settings page. Every provider gets a dedicated
 * sub-page under the "Integrations" sidebar group — credentials plus any
 * behaviour settings the provider defines (e.g. the GSC date range and
 * dimension filters). The previous single scrolling page listed a
 * dozen-plus providers at once, which buried each one's settings.
 *
 * @param id Integration id from the shared `INTEGRATIONS` catalog.
 */
function IntegrationPage({ id }: { id: string }) {
  const { t, i18n } = useTranslation();
  const def = INTEGRATIONS.find((i) => i.id === id);
  const [state, setState] = useState<IntegrationsState | null>(null);
  // Per-field draft text. Only fields the user has actually typed into
  // are tracked; a save sends just these so an untouched "saved" secret
  // is never overwritten.
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | undefined>();
  /** Bumped whenever an account is linked/unlinked, to re-seed the
   *  provider settings section's account dropdown. */
  const [accountsVersion, setAccountsVersion] = useState(0);

  useEffect(() => {
    void window.freecrawl.integrationsGetAll().then(setState);
  }, []);

  // Switching provider must not carry the previous page's draft or
  // "Saved." notice across.
  useEffect(() => {
    setDraft({});
    setNotice(undefined);
  }, [id]);

  if (!def) return null;

  const category = INTEGRATION_CATEGORIES.find((c) => c.key === def.category);

  const save = async () => {
    if (Object.keys(draft).length === 0) return;
    setBusy(true);
    try {
      setState(await window.freecrawl.integrationsSet(def.id, draft));
      setDraft({});
      setNotice(t('integrations.saved', { defaultValue: 'Saved.' }));
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (!window.confirm(t('integrations.confirmClear', { defaultValue: 'Remove all stored credentials for this integration?' }))) {
      return;
    }
    setBusy(true);
    try {
      setState(await window.freecrawl.integrationsClear(def.id));
      setDraft({});
      setNotice(t('integrations.cleared', { defaultValue: 'Removed.' }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[13px] font-semibold text-surface-100">{def.name}</span>
        {category && (
          <span className="rounded bg-surface-800 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-surface-400">
            {translateLabel(category.label, i18n.language)}
          </span>
        )}
      </div>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('integrations.intro', { defaultValue: 'Connect external services with your own credentials. API keys and secrets are encrypted at rest using your operating system\'s secure storage and never leave this machine.' })}
      </p>
      {def.authType === 'oauth-byoc' && (
        <div className="mb-3 rounded border border-blue-700/40 bg-blue-900/15 px-3 py-2 text-[11px] text-blue-200">
          {t('integrations.byocNote', { defaultValue: 'Google integrations use a "bring your own client" model — you create your own Google Cloud OAuth client and paste its ID/secret, so no shared FreeCrawl app or verification is involved.' })}
        </div>
      )}

      <IntegrationCard
        def={def}
        state={state?.[def.id]}
        draft={draft}
        busy={busy}
        notice={notice}
        onDraft={(k, v) => setDraft((d) => ({ ...d, [k]: v }))}
        onSave={() => void save()}
        onClear={() => void clear()}
      />

      {/* Linked Google accounts — several can share one OAuth client. */}
      {def.authType === 'oauth-byoc' && (
        <GoogleAccountsSection
          integrationId={def.id}
          configured={state?.[def.id]?.configured ?? false}
          onChange={() => setAccountsVersion((v) => v + 1)}
        />
      )}

      {/* Provider-specific behaviour settings, kept separate from the
          credential card above. Re-mounted when the account list changes
          so their account dropdowns pick up a new or removed link. */}
      {def.id === 'gsc' && <GscSettingsSection key={accountsVersion} />}
      {def.id === 'ga4' && <Ga4SettingsSection key={accountsVersion} />}
    </>
  );
}

function IntegrationCard({
  def,
  state,
  draft,
  busy,
  notice,
  onDraft,
  onSave,
  onClear,
}: {
  def: IntegrationDef;
  state: IntegrationsState[string] | undefined;
  draft: Record<string, string>;
  busy: boolean;
  notice: string | undefined;
  onDraft: (key: string, value: string) => void;
  onSave: () => void;
  onClear: () => void;
}) {
  const { t, i18n } = useTranslation();
  const configured = state?.configured ?? false;
  const hasDraft = Object.values(draft).some((v) => v.length > 0);
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="rounded border border-surface-800 bg-surface-950/40 p-3">
      <div className="mb-1 flex items-center gap-2">
        {/* The provider name lives in the page header above — the card
            only carries its credential model + connection status. */}
        <span className="rounded bg-surface-800 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-surface-400">
          {translateLabel(AUTH_TYPE_LABEL[def.authType], i18n.language)}
        </span>
        <span
          className={clsx(
            'ml-auto rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide',
            configured
              ? 'bg-emerald-900/40 text-emerald-300'
              : 'bg-surface-800 text-surface-500',
          )}
        >
          {configured
            ? t('integrations.connected', { defaultValue: 'Configured' })
            : t('integrations.notConfigured', { defaultValue: 'Not set' })}
        </span>
      </div>
      <p className="mb-2 text-[11px] text-surface-400">{def.description}</p>

      <div className="space-y-2">
        {def.fields.map((field) => {
          const fieldState = state?.fields[field.key];
          const savedSecret = field.secret && (fieldState?.set ?? false);
          // Non-secret fields show their stored value until edited;
          // secret fields show a "saved" placeholder and only carry a
          // draft once the user types.
          const value =
            field.key in draft
              ? draft[field.key]!
              : field.secret
                ? ''
                : (fieldState?.value ?? '');
          const placeholder = savedSecret
            ? t('integrations.savedPlaceholder', { defaultValue: 'Saved — type to replace' })
            : (field.placeholder ?? '');
          return (
            <label key={field.key} className="flex flex-col gap-0.5">
              <span className="text-[10px] text-surface-400">
                {field.label}
                {field.optional && (
                  <span className="ml-1 text-surface-600">
                    {t('integrations.optional', { defaultValue: '(optional)' })}
                  </span>
                )}
              </span>
              {field.multiline ? (
                <textarea
                  className="h-20 resize-y rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
                  value={value}
                  placeholder={placeholder}
                  onChange={(e) => onDraft(field.key, e.target.value)}
                  spellCheck={false}
                />
              ) : (
                <input
                  type={field.secret ? 'password' : 'text'}
                  className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                  value={value}
                  placeholder={placeholder}
                  onChange={(e) => onDraft(field.key, e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                />
              )}
            </label>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-surface-500">{def.setupHint}</p>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          className="rounded bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onSave}
          disabled={busy || !hasDraft}
        >
          {t('common.save', { defaultValue: 'Save' })}
        </button>
        {configured && (
          <button
            type="button"
            className="rounded border border-red-700/60 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClear}
            disabled={busy}
          >
            {t('common.remove', { defaultValue: 'Remove' })}
          </button>
        )}
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className="ml-auto inline-flex items-center gap-1 rounded border border-accent-500/50 px-2 py-0.5 text-[10px] text-accent-300 hover:bg-accent-500/15"
          title={t('integrations.setupGuideTitle', {
            defaultValue:
              'Step-by-step setup walkthrough — OAuth client, test users, API enable, common errors.',
          })}
        >
          <BookOpen className="h-3 w-3" />
          {t('integrations.setupGuide', { defaultValue: 'Setup Guide' })}
        </button>
        <a
          href={def.helpUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300"
        >
          {t('integrations.getCredentials', { defaultValue: 'Get credentials' })}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      {notice && <div className="mt-1.5 text-[10px] text-emerald-400">{notice}</div>}

      <IntegrationSetupGuideModal
        open={guideOpen}
        integration={def}
        onClose={() => setGuideOpen(false)}
      />
    </div>
  );
}

/**
 * V1 Faz 9 — Storage panel. Lets the user pick a default folder for new
 * `.seoproject` files. Saved immediately to app prefs (not the per-crawl
 * `CrawlConfig`), so there's no Save/Cancel cycle and no dependency on
 * the surrounding form state.
 *
 * When the override is blank the OS Documents folder is used. The panel
 * shows the resolved path so the user always sees where new projects
 * will land, regardless of whether they've customised it.
 */
/**
 * Spelling & Grammar panel — rule strictness + the custom dictionary.
 * Both are app preferences read by the main process when a LanguageTool
 * run starts; the endpoint and any Premium credentials live under
 * Settings → Integrations → LanguageTool.
 */
function SpellingPanel() {
  const { t } = useTranslation();
  const [level, setLevel] = useState<'default' | 'picky'>(() =>
    window.freecrawl.prefsGet('spellingLevel') === 'picky' ? 'picky' : 'default',
  );
  const [ignoreWords, setIgnoreWords] = useState<string>(() => {
    const raw = window.freecrawl.prefsGet('spellingIgnoreWords');
    return typeof raw === 'string' ? raw : '';
  });
  const [language, setLanguage] = useState<string>(() => {
    const raw = window.freecrawl.prefsGet('spellingLanguage');
    return typeof raw === 'string' ? raw : '';
  });
  const [languages, setLanguages] = useState<SpellingLanguageOption[]>([]);
  const [languagesLoaded, setLanguagesLoaded] = useState(false);

  // Asked of the configured endpoint rather than hardcoded — a self-hosted
  // LanguageTool ships whichever language modules its operator installed.
  useEffect(() => {
    let cancelled = false;
    void window.freecrawl
      .spellingLanguages()
      .then((list) => {
        if (cancelled) return;
        setLanguages(list);
        setLanguagesLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLanguagesLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function pickLanguage(code: string) {
    setLanguage(code);
    // Empty means auto — clear the pref rather than storing a sentinel.
    if (code) window.freecrawl.prefsSet('spellingLanguage', code);
    else window.freecrawl.prefsDelete('spellingLanguage');
  }

  function pickLevel(l: 'default' | 'picky') {
    setLevel(l);
    // `default` is the default — clear the pref rather than storing it.
    if (l === 'picky') window.freecrawl.prefsSet('spellingLevel', 'picky');
    else window.freecrawl.prefsDelete('spellingLevel');
  }

  function saveIgnoreWords(value: string) {
    setIgnoreWords(value);
    if (value.trim().length > 0) {
      window.freecrawl.prefsSet('spellingIgnoreWords', value);
    } else {
      window.freecrawl.prefsDelete('spellingIgnoreWords');
    }
  }

  const wordCount = ignoreWords
    .split(/[\s,;\n]+/)
    .map((w) => w.trim())
    .filter(Boolean).length;

  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settings.spelling.intro', { defaultValue: "Spelling, grammar and style checks run through LanguageTool against pages you select in the Spelling tab. Each page's language is detected from its own text and cross-checked against html[lang]; pages in a language LanguageTool has no rules for are reported as unsupported rather than graded against the wrong dictionary. Configure the endpoint (public API or self-hosted) under Integrations → LanguageTool." })}
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settings.spelling.languageLabel', { defaultValue: "Language" })}
        </div>
        <p className="mb-2 text-[11px] text-surface-400">
          {t('settings.spelling.languageHint', { defaultValue: "Leave on auto unless detection gets a site wrong. Pinning a language forces every page to be checked in it — useful for a single-language site whose html[lang] is wrong, and it also turns off the safety check that discards implausibly noisy results." })}
        </p>
        <select
          className="h-7 w-full rounded border border-surface-700 bg-surface-950 px-2 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
          value={language}
          onChange={(e) => pickLanguage(e.target.value)}
          disabled={!languagesLoaded}
        >
          <option value="">
            {t('settings.spelling.languageAuto', { defaultValue: "Auto — detect from each page's text (recommended)" })}
          </option>
          {languages.map((l) => (
            <option key={l.longCode} value={l.longCode}>
              {l.name} ({l.longCode})
            </option>
          ))}
        </select>
        {languagesLoaded && languages.length > 0 && (
          <p className="mt-1 text-[10px] text-surface-500">
            {t('settings.spelling.languageCount', {
              defaultValue: "This endpoint offers {{n}} language variant(s). Languages outside that list — Turkish, Hungarian, Czech and others — cannot be checked by LanguageTool at all.",
              n: languages.length,
            })}
          </p>
        )}
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settings.spelling.levelLabel', { defaultValue: "Rule Level" })}
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="spelling-level"
              className="mt-0.5"
              checked={level === 'default'}
              onChange={() => pickLevel('default')}
            />
            <span className="text-[12px] text-surface-100">
              {t('settings.spelling.levelDefault', { defaultValue: "Default — spelling and grammar errors only" })}
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="spelling-level"
              className="mt-0.5"
              checked={level === 'picky'}
              onChange={() => pickLevel('picky')}
            />
            <span className="text-[12px] text-surface-100">
              {t('settings.spelling.levelPicky', { defaultValue: "Picky — also flags style, typography and wordiness" })}
            </span>
          </label>
        </div>
      </div>

      <div className="rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settings.spelling.dictionaryLabel', { defaultValue: "Custom Dictionary" })}
        </div>
        <p className="mb-2 text-[11px] text-surface-400">
          {t('settings.spelling.dictionaryHint', { defaultValue: "Words to never flag — brand names, product names, industry jargon. One per line, or separated by commas. Case-insensitive." })}
        </p>
        <textarea
          className="h-32 w-full resize-y rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
          placeholder={"FreeCrawl\nhreflang\ncanonicalisation"}
          value={ignoreWords}
          onChange={(e) => saveIgnoreWords(e.target.value)}
          spellCheck={false}
        />
        <p className="mt-1 text-[10px] text-surface-500">
          {t('settings.spelling.dictionaryCount', {
            defaultValue: "{{n}} word(s) ignored",
            n: wordCount,
          })}
        </p>
      </div>
    </>
  );
}

/**
 * Settings for parallel MCP agent sessions (Issue #12): how many headless
 * sessions may run at once, and how long an idle one lives before it is
 * auto-closed (saved first if it has a document). Persisted as prefs the main
 * process reads directly (`maxAgentSessions`, `agentSessionIdleMinutes`).
 */
function AgentSessionsSettings() {
  const { t } = useTranslation();
  const [maxSessions, setMaxSessions] = useState<number>(() => {
    const raw = window.freecrawl.prefsGet('maxAgentSessions');
    return typeof raw === 'number' ? Math.max(1, Math.min(8, Math.floor(raw))) : 3;
  });
  const [idleMinutes, setIdleMinutes] = useState<number>(() => {
    const raw = window.freecrawl.prefsGet('agentSessionIdleMinutes');
    return typeof raw === 'number' ? Math.max(1, Math.min(1440, Math.floor(raw))) : 30;
  });

  function applyMax(n: number) {
    const clamped = Math.max(1, Math.min(8, Math.floor(n)));
    setMaxSessions(clamped);
    if (clamped === 3) window.freecrawl.prefsDelete('maxAgentSessions');
    else window.freecrawl.prefsSet('maxAgentSessions', clamped);
  }
  function applyIdle(n: number) {
    const clamped = Math.max(1, Math.min(1440, Math.floor(n)));
    setIdleMinutes(clamped);
    if (clamped === 30) window.freecrawl.prefsDelete('agentSessionIdleMinutes');
    else window.freecrawl.prefsSet('agentSessionIdleMinutes', clamped);
  }

  return (
    <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
        {t('settings.agents.title', { defaultValue: 'Agent Sessions (MCP)' })}
      </div>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settings.agents.intro', {
          defaultValue:
            'AI agents can open their own isolated crawl sessions inside this app over MCP. These limits keep several parallel agents from oversubscribing the machine.',
        })}
      </p>
      <div className="flex flex-col gap-3">
        <label className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-surface-100">
            {t('settings.agents.maxSessions', { defaultValue: 'Max concurrent agent sessions' })}
          </span>
          <input
            type="number"
            min={1}
            max={8}
            value={maxSessions}
            onChange={(e) => applyMax(Number(e.target.value))}
            className="w-20 rounded border border-surface-700 bg-surface-950 px-2 py-1 text-right text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-surface-100">
            {t('settings.agents.idleMinutes', {
              defaultValue: 'Auto-close idle agent sessions after (minutes)',
            })}
          </span>
          <input
            type="number"
            min={1}
            max={1440}
            value={idleMinutes}
            onChange={(e) => applyIdle(Number(e.target.value))}
            className="w-20 rounded border border-surface-700 bg-surface-950 px-2 py-1 text-right text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
          />
        </label>
      </div>
      <p className="mt-2 text-[10px] text-surface-500">
        {t('settings.agents.note', {
          defaultValue:
            'An idle session with a saved project is saved before it is closed. Changes apply to sessions created from now on.',
        })}
      </p>
    </div>
  );
}

function StoragePanel() {
  const { t } = useTranslation();
  const [override, setOverride] = useState<string>(() => {
    const raw = window.freecrawl.prefsGet('projectSaveDir');
    return typeof raw === 'string' ? raw : '';
  });
  const [resolved, setResolved] = useState<string>('');
  const [mode, setMode] = useState<'disk' | 'ram'>(() =>
    window.freecrawl.prefsGet('storageMode') === 'ram' ? 'ram' : 'disk',
  );
  const [activeMode, setActiveMode] = useState<'disk' | 'ram' | null>(null);

  useEffect(() => {
    let cancelled = false;
    void window.freecrawl.defaultProjectDir().then((p) => {
      if (!cancelled) setResolved(p);
    });
    return () => {
      cancelled = true;
    };
  }, [override]);

  useEffect(() => {
    let cancelled = false;
    void window.freecrawl.storageModeActive().then((m) => {
      if (!cancelled) setActiveMode(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function pickMode(m: 'disk' | 'ram') {
    setMode(m);
    // Disk is the default, so a `ram` pick persists the pref and a `disk`
    // pick clears it back to the default rather than storing a redundant key.
    if (m === 'ram') window.freecrawl.prefsSet('storageMode', 'ram');
    else window.freecrawl.prefsDelete('storageMode');
  }

  async function browse() {
    const chosen = await window.freecrawl.pickDirectory({
      title: 'Choose Default Project Folder',
      defaultPath: resolved || undefined,
    });
    if (!chosen) return;
    setOverride(chosen);
    window.freecrawl.prefsSet('projectSaveDir', chosen);
  }

  function reset() {
    setOverride('');
    window.freecrawl.prefsDelete('projectSaveDir');
  }

  const isCustom = override.trim().length > 0;

  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settings.storage.intro', { defaultValue: "Default folder for new .seoproject files. Save As dialogs open here by default; the Open dialog is not constrained." })}
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settings.storage.modeLabel', { defaultValue: "Storage Mode" })}
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="storage-mode"
              className="mt-0.5"
              checked={mode === 'disk'}
              onChange={() => pickMode('disk')}
            />
            <span className="text-[12px] text-surface-100">
              {t('settings.storage.modeDisk', { defaultValue: "Disk (SQLite file) — persistent, resumable, uses worker pools" })}
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="storage-mode"
              className="mt-0.5"
              checked={mode === 'ram'}
              onChange={() => pickMode('ram')}
            />
            <span className="text-[12px] text-surface-100">
              {t('settings.storage.modeRam', { defaultValue: "RAM-only (in-memory) — fastest, nothing written to disk until Save As" })}
            </span>
          </label>
        </div>
        <p className="mt-2 text-[10px] text-surface-500">
          {activeMode && activeMode !== mode
            ? t('settings.storage.modeRestart', {
                defaultValue: "Applies the next time FreeCrawl starts (currently running in {{active}} mode).",
                active: activeMode.toUpperCase(),
              })
            : t('settings.storage.modeActiveNote', {
                defaultValue: "Currently running in {{active}} mode.",
                active: (activeMode ?? mode).toUpperCase(),
              })}
        </p>
        {mode === 'ram' && (
          <p className="mt-1 text-[10px] text-amber-500/80">
            {t('settings.storage.modeRamWarning', { defaultValue: "In-memory projects are lost on exit unless you Save As. Crash recovery is off and very large crawls are bounded by available RAM." })}
          </p>
        )}
      </div>

      <AgentSessionsSettings />

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settings.storage.defaultSaveFolder', { defaultValue: "Default Save Folder" })}
        </div>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
            placeholder={t('settings.storage.placeholder', { defaultValue: "(System Documents folder)" })}
            value={override}
            readOnly
            spellCheck={false}
          />
          <button
            className="rounded border border-surface-700 px-3 py-1 text-[11px] text-surface-200 hover:bg-surface-800 hover:text-surface-100"
            onClick={browse}
          >
            {t('common.browse')}
          </button>
          {isCustom && (
            <button
              className="rounded border border-surface-700 px-3 py-1 text-[11px] text-surface-400 hover:bg-surface-800 hover:text-surface-100"
              onClick={reset}
              title={t('settings.storage.resetTitle', { defaultValue: "Reset to the OS Documents folder" })}
            >
              {t('common.reset')}
            </button>
          )}
        </div>
        <p className="mt-2 text-[10px] text-surface-500">
          {t('settings.storage.resolvedPath', { defaultValue: "Resolved path" })}:{' '}
          <span className="text-surface-300">{resolved || '…'}</span>
        </p>
      </div>

      <div className="rounded border border-surface-800 bg-surface-950/40 p-3 text-[11px] text-surface-400">
        {t('settings.storage.note', { defaultValue: "Active crawl data lives in the app's user-data directory until you Save As — the path above only controls where Save As starts. Changing this won't move any existing project files." })}
      </div>
    </>
  );
}

/**
 * V1 Faz 9 — Privacy panel. Single toggle for anonymous telemetry opt-in.
 * No telemetry backend is wired up yet (default off, no events fire);
 * this preference is kept so future opt-in metrics ship with consent
 * already gathered and the default remains opt-out.
 */
function PrivacyPanel() {
  const { t } = useTranslation();
  const [telemetryOptIn, setTelemetryOptIn] = useState<boolean>(() => {
    return window.freecrawl.prefsGet('telemetryOptIn') === true;
  });

  function toggle(v: boolean) {
    setTelemetryOptIn(v);
    window.freecrawl.prefsSet('telemetryOptIn', v);
  }

  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settings.privacy.intro', { defaultValue: "FreeCrawl is local-first — crawl results, project files, and URLs you visit never leave your machine." })}
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settings.privacy.telemetryHeading', { defaultValue: "Anonymous Telemetry" })}
        </div>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={telemetryOptIn}
            onChange={(e) => toggle(e.target.checked)}
            className="mt-0.5"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] text-surface-100">
              {t('settings.privacy.telemetryLabel', { defaultValue: "Send anonymous usage telemetry (opt-in)" })}
            </span>
            <span className="text-[10px] text-surface-500">
              {t('settings.privacy.telemetryHelp', { defaultValue: "Off by default. When on, aggregated counts of feature use (e.g. \"export ran\", \"report opened\") may be sent — never URLs, project contents, or crawl results." })}
            </span>
          </div>
        </label>
      </div>

      <div className="rounded border border-amber-700/40 bg-amber-900/10 p-3 text-[11px] text-amber-200">
        {t('settings.privacy.statusNote', { defaultValue: "No telemetry endpoint is currently wired up. Toggling this preference is recorded but nothing is transmitted in the current build. The toggle is exposed now so consent state persists across upgrades when a future build adds an endpoint." })}
      </div>
    </>
  );
}

/**
 * V1 Faz 8 — UI language switcher. Persists the choice under the
 * `uiLanguage` app pref via `changeLanguage` and applies it instantly
 * through react-i18next.
 */
function LanguagePanel() {
  const { t, i18n } = useTranslation();
  const current = (i18n.language?.split('-')[0] ?? 'en') as SupportedLanguage;

  function pick(lng: SupportedLanguage) {
    if (lng === current) return;
    changeLanguage(lng);
  }

  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settings.language.intro', { defaultValue: "Select the UI display language. Applied immediately." })}
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('settings.language.label', { defaultValue: "UI language" })}
        </div>
        <div className="flex flex-col gap-2">
          {SUPPORTED_LANGUAGES.map((lng) => (
            <label key={lng} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ui-language"
                checked={current === lng}
                onChange={() => pick(lng)}
              />
              <span className="text-[12px] text-surface-100">
                {t(`settings.language.${lng}`)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded border border-amber-700/40 bg-amber-900/10 p-3 text-[11px] text-amber-200">
        {t('settings.language.note', { defaultValue: "Some deep panels and dialogs may still display English while broader coverage is being added." })}
      </div>
    </>
  );
}
