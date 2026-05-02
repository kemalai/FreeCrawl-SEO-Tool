import { useEffect, useMemo, useState } from 'react';
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
  Plus,
  Trash2,
  Shield,
  Network,
  Sparkles,
  Gauge,
  FileText,
  AlertTriangle,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import type {
  CrawlConfig,
  CrawlMode,
  CustomExtractionRule,
  HttpAuth,
} from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';
import { InfoTip, type FieldInfo } from './InfoTip.js';

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
  crawlExternal: boolean;
  storeNofollowLinks: boolean;
  discoverSitemaps: boolean;
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
  trailingSlash: 'leave' | 'strip' | 'add';
  // hardware
  memoryLimitMb: string;
  maxQueueSize: string;
  processPriority: 'normal' | 'below-normal' | 'idle';
  // duplicates
  nearDuplicateHammingThreshold: string;
  duplicatesOnlyIndexable: boolean;
  // custom extraction
  customExtractionRules: CustomExtractionRule[];
  // webhook
  webhookUrl: string;
  // auth + network
  auth: HttpAuth;
  proxyUrl: string;
  excludeExtensionsText: string;
  maxRedirects: string;
  // Wave 8 additions
  // crawl analysis (per-pass post-crawl toggles, Wave 6)
  analyseInlinks: boolean;
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
}

type SectionKey =
  | 'presets'
  | 'mode'
  | 'crawler'
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
  | 'per-host-ua';

interface SectionDef {
  key: SectionKey;
  label: string;
  icon: LucideIcon;
  /** Searchable keywords beyond the label. */
  keywords: string;
}

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
    keywords: 'auth authentication basic bearer token password http header',
  },
  {
    key: 'network',
    label: 'Network',
    icon: Network,
    keywords: 'network proxy https extension filter exclude redirect hop limit',
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
];

function configToForm(c: CrawlConfig): FormState {
  return {
    mode: c.mode,
    urlListText: (c.urlList ?? []).join('\n'),
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
    crawlExternal: c.crawlExternal,
    storeNofollowLinks: c.storeNofollowLinks,
    discoverSitemaps: c.discoverSitemaps,
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
    trailingSlash: c.trailingSlash,
    memoryLimitMb: String(c.memoryLimitMb),
    maxQueueSize: String(c.maxQueueSize),
    processPriority: c.processPriority,
    nearDuplicateHammingThreshold: String(c.nearDuplicateHammingThreshold),
    duplicatesOnlyIndexable: c.duplicatesOnlyIndexable,
    customExtractionRules: (c.customExtractionRules ?? []).map((r) => ({ ...r })),
    webhookUrl: c.webhookUrl ?? '',
    auth: { ...(c.auth ?? { type: 'none' }) },
    proxyUrl: c.proxyUrl ?? '',
    excludeExtensionsText: (c.excludeExtensions ?? []).join(', '),
    maxRedirects: String(c.maxRedirects ?? 10),
    analyseInlinks: c.analyseInlinks ?? true,
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
  const config = useAppStore((s) => s.config);
  const setConfig = useAppStore((s) => s.setConfig);
  const [form, setForm] = useState<FormState>(() => configToForm(config));
  const [active, setActive] = useState<SectionKey>('mode');
  const [search, setSearch] = useState('');

  // Re-seed the form whenever the dialog reopens — picks up any external
  // config change (e.g. URL/scope edits in the top bar) so the dialog
  // never shows stale values.
  useEffect(() => {
    if (open) {
      setForm(configToForm(config));
      setSearch('');
    }
  }, [open, config]);

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
    return SECTIONS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) || s.keywords.toLowerCase().includes(q),
    );
  }, [search]);

  // If the search filter hides the active section, jump to the first visible.
  useEffect(() => {
    if (visibleSections.length === 0) return;
    if (!visibleSections.some((s) => s.key === active)) {
      setActive(visibleSections[0]!.key);
    }
  }, [visibleSections, active]);

  if (!open) return null;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function save() {
    setConfig({
      mode: form.mode,
      urlList: parseLines(form.urlListText),
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
      crawlExternal: form.crawlExternal,
      storeNofollowLinks: form.storeNofollowLinks,
      discoverSitemaps: form.discoverSitemaps,
      userAgent: form.userAgent.trim() || config.userAgent,
      acceptLanguage: form.acceptLanguage.trim() || config.acceptLanguage,
      customHeaders: parseHeaders(form.customHeadersText),
      includePatterns: parseLines(form.includePatternsText),
      excludePatterns: parseLines(form.excludePatternsText),
      customSearchTerms: parseLines(form.customSearchTermsText),
      stripWww: form.stripWww,
      forceHttps: form.forceHttps,
      lowercasePath: form.lowercasePath,
      trailingSlash: form.trailingSlash,
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
      customExtractionRules: form.customExtractionRules
        .filter((r) => r.name.trim() && r.selector.trim())
        .slice(0, 10),
      webhookUrl: form.webhookUrl.trim(),
      auth: form.auth,
      proxyUrl: form.proxyUrl.trim(),
      excludeExtensions: form.excludeExtensionsText
        .split(/[\s,]+/)
        .map((s) => s.trim().toLowerCase().replace(/^\./, ''))
        .filter(Boolean),
      maxRedirects: Math.max(0, num(form.maxRedirects, config.maxRedirects)),
      analyseInlinks: form.analyseInlinks,
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
    });
    onClose();
  }

  const activeDef = SECTIONS.find((s) => s.key === active) ?? SECTIONS[0]!;

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
          <div className="text-sm font-semibold tracking-wide text-surface-100">Settings</div>
          <button
            className="ml-auto rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
            onClick={onClose}
            title="Close (Esc)"
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
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  spellCheck={false}
                />
              </div>
            </div>
            <nav className="flex-1 overflow-auto py-1">
              {visibleSections.length === 0 && (
                <div className="px-3 py-2 text-[11px] text-surface-500">No matches</div>
              )}
              {visibleSections.map((s) => {
                const Icon = s.icon;
                const isActive = s.key === active;
                return (
                  <button
                    key={s.key}
                    className={clsx(
                      'flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-colors',
                      isActive
                        ? 'bg-accent-600/20 text-accent-200 border-l-2 border-accent-500'
                        : 'border-l-2 border-transparent text-surface-300 hover:bg-surface-800 hover:text-surface-100',
                    )}
                    onClick={() => setActive(s.key)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex flex-1 flex-col min-w-0">
            <div className="border-b border-surface-800 px-5 py-2 text-[11px] text-surface-400">
              Settings <span className="mx-1 text-surface-600">›</span>
              <span className="text-surface-200">{activeDef.label}</span>
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
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-surface-800 px-4 py-2.5">
          <button
            className="rounded border border-surface-700 px-3 py-1 text-[11px] hover:bg-surface-800"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded bg-blue-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-500"
            onClick={save}
          >
            Save
          </button>
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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        One-click profiles for common crawl scenarios. Clicking a preset overwrites the affected
        fields only — your URL list, custom rules, filters, and extraction rules are preserved.
      </p>
      <div className="space-y-2">
        {PRESETS.map((p) => (
          <div
            key={p.key}
            className="flex items-start gap-3 rounded border border-surface-800 bg-surface-950/40 p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-surface-100">{p.label}</div>
              <div className="mt-0.5 text-[11px] text-surface-400">{p.description}</div>
              <div className="mt-1.5 flex flex-wrap gap-1 font-mono text-[10px] text-surface-500">
                {Object.entries(p.overrides).map(([k, v]) => (
                  <span key={k} className="rounded border border-surface-800 px-1.5 py-0.5">
                    {k}={String(v)}
                  </span>
                ))}
              </div>
            </div>
            <button
              className="rounded border border-blue-700/60 bg-blue-900/30 px-3 py-1 text-[11px] text-blue-200 hover:bg-blue-900/50"
              onClick={() => apply(p)}
            >
              Apply
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-surface-800 pt-4">
        <div className="mb-2 text-[12px] font-medium text-surface-100">Import / Export</div>
        <p className="mb-2 text-[11px] text-surface-400">
          Save the current settings to a JSON file (e.g. for sharing with a teammate or version
          control), or load a previously-exported settings file. Importing replaces the current
          form with the file's contents — press Save at the bottom to persist.
        </p>
        <div className="flex gap-2">
          <button
            className="rounded border border-surface-700 px-3 py-1 text-[11px] hover:bg-surface-800 disabled:opacity-50"
            onClick={async () => {
              setBusy(true);
              setMessage(null);
              try {
                await exportSettings();
                setMessage('Settings exported.');
              } catch (e) {
                setMessage(`Export failed: ${(e as Error).message}`);
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            Export…
          </button>
          <button
            className="rounded border border-surface-700 px-3 py-1 text-[11px] hover:bg-surface-800 disabled:opacity-50"
            onClick={async () => {
              setBusy(true);
              setMessage(null);
              try {
                await importSettings();
                setMessage('Settings imported.');
              } catch (e) {
                setMessage(`Import failed: ${(e as Error).message}`);
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            Import…
          </button>
          {message && <span className="self-center text-[10px] text-surface-400">{message}</span>}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-surface-500">
        After clicking Apply or Import, review each panel to verify the values, then press Save at
        the bottom to persist.
      </p>
    </>
  );
}

function ModePanel({ form, update }: PanelProps) {
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        Choose how the crawler discovers URLs. Spider follows links from a start URL; List fetches a fixed set.
      </p>
      <label className="mb-2 flex flex-col gap-1">
        <FieldLabel
          label="Crawl Mode"
          info="Spider follows links from the start URL across the chosen scope. List fetches a fixed set of URLs once with no link-following."
          example="Spider for full site audits; List for re-checking a known set of pages."
        />
        <select
          className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
          value={form.mode}
          onChange={(e) => update('mode', e.target.value as CrawlMode)}
        >
          <option value="spider">Spider — start URL + follow links</option>
          <option value="list">List — fetch a fixed URL list, no link follow</option>
        </select>
      </label>
      {form.mode === 'list' && (
        <Area
          label="URL List (one URL per line)"
          value={form.urlListText}
          onChange={(v) => update('urlListText', v)}
          rows={10}
          placeholder={'https://example.com/\nhttps://example.com/about\nhttps://example.com/contact'}
          info="One URL per line. Each is fetched exactly once; outlinks are NOT followed. Comments starting with # are ignored."
          example={'https://example.com/about\nhttps://example.com/pricing\n# old urls\nhttps://example.com/legacy'}
        />
      )}
    </>
  );
}

function CrawlerPanel({ form, update }: PanelProps) {
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        Throughput, concurrency, and traversal limits.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Num
          label="Max Depth"
          value={form.maxDepth}
          onChange={(v) => update('maxDepth', v)}
          info="Hop count from the start URL. Start URL is depth 0; its outlinks are depth 1, theirs depth 2, and so on."
          example="10 covers most sites; 3 limits crawls to top-of-funnel pages only."
        />
        <Num
          label="Max URLs"
          value={form.maxUrls}
          onChange={(v) => update('maxUrls', v)}
          info="Hard cap on total URLs crawled. The crawl stops as soon as this is reached."
          example="1000000 (1M) for a full site audit; 5000 for spot checks."
        />
        <Num
          label="Max Concurrency"
          value={form.maxConcurrency}
          onChange={(v) => update('maxConcurrency', v)}
          info="Number of parallel HTTP workers. Higher = faster crawl but more load on the target server."
          example="20 is a safe default; bump to 50 on fast servers, drop to 5 if the site rate-limits."
        />
        <Num
          label="Max RPS"
          value={form.maxRps}
          onChange={(v) => update('maxRps', v)}
          info="Requests per second cap across all workers combined. Hard rate limit independent of concurrency."
          example="20 for typical sites; 5 to be polite on shared hosting."
        />
        <Num
          label="Request Timeout (ms)"
          value={form.requestTimeoutMs}
          onChange={(v) => update('requestTimeoutMs', v)}
          info="Per-request abort threshold. Pages that take longer than this are recorded as network errors."
          example="20000 (20 s) for typical use; 5000 for fast spot checks; 60000 for slow APIs."
        />
        <Num
          label="Crawl Delay (ms, per worker)"
          value={form.crawlDelayMs}
          onChange={(v) => update('crawlDelayMs', v)}
          info="Sleep inserted after each request, applied per worker. Stacks with robots.txt's own crawl-delay if larger."
          example="0 disables; 250 for very polite crawling; 1000 to throttle aggressively."
        />
        <Num
          label="Retry Attempts"
          value={form.retryAttempts}
          onChange={(v) => update('retryAttempts', v)}
          info="How many times to retry on network errors / 5xx / 429. The original request is not counted."
          example="2 (default) means original + 2 retries (3 total). 0 disables retry."
        />
        <Num
          label="Retry Initial Delay (ms)"
          value={form.retryInitialDelayMs}
          onChange={(v) => update('retryInitialDelayMs', v)}
          info="Backoff before the first retry. Doubles each subsequent attempt (exponential backoff)."
          example="500 → next attempts wait 500 ms, then 1000 ms, then 2000 ms…"
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Bool
          label="Follow redirects"
          checked={form.followRedirects}
          onChange={(v) => update('followRedirects', v)}
          info="Crawl 3xx redirect targets. Each hop is its own row; the chain is reconstructed in the Response Codes view."
          example="On for normal audits; off when you only want to inspect raw 3xx behaviour."
        />
        <Bool
          label="Respect robots.txt"
          checked={form.respectRobotsTxt}
          onChange={(v) => update('respectRobotsTxt', v)}
          info="Honor Disallow rules + crawl-delay declared in /robots.txt for the configured User-Agent."
          example="On (default). Off only when crawling sites you own and need to bypass."
        />
        <Bool
          label="Crawl external links"
          checked={form.crawlExternal}
          onChange={(v) => update('crawlExternal', v)}
          info="Probe outbound links to other hosts (HEAD only) so the Broken Links view catches dead externals."
          example="On for outbound link audits; off for fast internal-only crawls."
        />
        <Bool
          label="Store nofollow links"
          checked={form.storeNofollowLinks}
          onChange={(v) => update('storeNofollowLinks', v)}
          hint="Default off (Screaming-Frog style 'Respect Nofollow')"
          info='Persist rel="nofollow" links in the link graph. When off, nofollow links are dropped entirely (not counted in outlinks, not probed as externals).'
          example="On if you need nofollow attribute audits; off keeps the link graph cleaner."
        />
        <Bool
          label="Discover sitemaps"
          checked={form.discoverSitemaps}
          onChange={(v) => update('discoverSitemaps', v)}
          hint="Read sitemap.xml from robots.txt + default paths at crawl start"
          info="Fetches /robots.txt sitemap directives + /sitemap.xml fallbacks. Powers the 'Non-Indexable in Sitemap' issue filter."
          example="On (default) — cheap I/O, high SEO value."
        />
      </div>
    </>
  );
}

function SpeedPanel({ form, update }: PanelProps) {
  // Mirror inputs of the values for the helper-text math; if they aren't
  // valid numbers we surface "—" instead of NaN. Cheap to recompute on
  // every render — these strings are short.
  const conc = Number.parseInt(form.maxConcurrency, 10);
  const rps = Number.parseInt(form.maxRps, 10);
  const delay = Number.parseInt(form.crawlDelayMs, 10);
  const retries = Number.parseInt(form.retryAttempts, 10);
  const effectiveRps =
    Number.isFinite(rps) && Number.isFinite(conc) ? Math.min(rps, conc * 5) : null;
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        Control crawl throughput. Increasing parallelism speeds the crawl, but every extra request
        adds load on the target server — pick numbers a host that you don't own can absorb without
        rate-limiting / 429s.
      </p>

      <div className="mb-4 rounded border border-blue-700/40 bg-blue-900/15 px-3 py-2 text-[11px] text-blue-200">
        <div className="mb-0.5 font-medium">Effective ceiling</div>
        <div className="text-blue-300/90">
          {effectiveRps !== null ? (
            <>
              ~{effectiveRps.toLocaleString()} URL/s ({Number.isFinite(conc) ? conc : '—'} parallel
              workers, ≤ {Number.isFinite(rps) ? rps : '—'} RPS rate-limit
              {Number.isFinite(delay) && delay > 0
                ? `, +${delay} ms post-request delay per worker`
                : ''}
              )
            </>
          ) : (
            'Set Max Concurrency and Max RPS to see the projected throughput.'
          )}
        </div>
      </div>

      <Num
        label="Max Concurrency (parallel workers)"
        value={form.maxConcurrency}
        onChange={(v) => update('maxConcurrency', v)}
        info="Number of HTTP requests in flight at any one time. Equivalent to Screaming Frog's 'Max Threads'. Higher = faster crawl + more load on the target server."
        example="20 default; 50 on fast first-party servers; 5 if the site rate-limits or returns 429s."
      />
      <Num
        label="Max URL/s (rate limit)"
        value={form.maxRps}
        onChange={(v) => update('maxRps', v)}
        info="Hard ceiling on requests per second across all workers combined. Equivalent to Screaming Frog's 'Max URL/s'. Acts as a token bucket — even with high concurrency the crawler waits between bursts to stay below this rate."
        example="20 for typical sites; 5 to be polite on shared hosting; 60+ when crawling your own infra."
      />
      <Num
        label="Per-Worker Delay (ms after each request)"
        value={form.crawlDelayMs}
        onChange={(v) => update('crawlDelayMs', v)}
        info="Sleep this long on each worker AFTER a response completes, before it picks up the next URL. Stacks with the global RPS cap — useful for sites that rate-limit on inter-request gap rather than total throughput."
        example="0 default; 250 ms when a host returns 429 with a 'too fast' message."
      />

      <div className="mt-4 mb-1.5 text-[11px] font-medium text-surface-300">Retries</div>
      <Num
        label="Retry Attempts (per URL on transient errors)"
        value={form.retryAttempts}
        onChange={(v) => update('retryAttempts', v)}
        info="On network errors, 408/425/429/5xx responses, retry up to N more times before giving up. Each retry counts toward the URL's response time budget."
        example="2 default; 0 to record errors immediately without retrying; 5 for unreliable upstreams."
      />
      <Num
        label="Initial Retry Delay (ms — exponential backoff)"
        value={form.retryInitialDelayMs}
        onChange={(v) => update('retryInitialDelayMs', v)}
        info="Wait this long before the FIRST retry, doubling on each subsequent attempt (500 → 1000 → 2000 …)."
        example="500 default. Bump to 2000 when retrying against a flaky API."
      />
      <p className="mt-1 text-[10px] text-surface-500">
        Worst-case delay per failed URL ≈ initialDelay × (2 ^ attempts − 1) ={' '}
        {Number.isFinite(retries) && Number.isFinite(delay)
          ? `${(Number.parseInt(form.retryInitialDelayMs, 10) || 500) *
              (2 ** Math.max(0, retries) - 1)} ms`
          : '—'}
      </p>

      <div className="mt-5 rounded border border-surface-800 bg-surface-950/40 px-3 py-2 text-[10px] text-surface-400">
        <div className="mb-1 font-medium text-surface-300">Throughput tips</div>
        <ul className="list-disc space-y-0.5 pl-4">
          <li>
            For a quick first sweep on a healthy site try the <strong>Fast</strong> preset (Settings
            → Presets) — concurrency 40, RPS 40, no retries.
          </li>
          <li>
            For unreliable origins or slow APIs try <strong>Thorough</strong> — concurrency 10, 3
            retries, 30 s timeout.
          </li>
          <li>
            Concurrency × HTTP keep-alive = the steady-state connection count. Most servers comfortably
            handle 20–40; corporate proxies / WAFs often cap at 8–10.
          </li>
        </ul>
      </div>
    </>
  );
}

function RequestsPanel({ form, update }: PanelProps) {
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        HTTP headers sent with every request.
      </p>
      <Text
        label="User-Agent"
        value={form.userAgent}
        onChange={(v) => update('userAgent', v)}
        info="Sent on every request as the User-Agent header. Identifies the crawler to servers; some sites serve different content based on UA."
        example="Mozilla/5.0 (compatible; FreeCrawlSEO/1.0; +https://yourdomain.com/bot)"
      />
      <Text
        label="Accept-Language"
        value={form.acceptLanguage}
        onChange={(v) => update('acceptLanguage', v)}
        info="Sent on every request. Affects which locale a multi-lingual site serves you."
        example="tr,en;q=0.8 — Turkish first, English fallback."
      />
      <Area
        label='Custom Headers (one per line, "Key: Value")'
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
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        URL allowlist/blocklist. Patterns are JavaScript regex tested against the full URL.
      </p>
      <Area
        label="Include Patterns (regex, one per line — empty = all allowed)"
        value={form.includePatternsText}
        onChange={(v) => update('includePatternsText', v)}
        rows={5}
        placeholder={'^https?://example\\.com/blog/\n/api/v2/'}
        info="JavaScript regex tested against the full URL. Empty = all URLs allowed. URL must match at least one to be enqueued. The start URL is always permitted regardless."
        example={'^https?://example\\.com/blog/\n/api/v2/'}
      />
      <Area
        label="Exclude Patterns (regex, one per line)"
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
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        Flag pages whose body contains any of these substrings (case-insensitive).
      </p>
      <Area
        label="Search Terms (case-insensitive literal substring; one per line)"
        value={form.customSearchTermsText}
        onChange={(v) => update('customSearchTermsText', v)}
        rows={8}
        placeholder={'pricing\nfree shipping\nlimited time'}
        info="Case-insensitive literal substring (NOT regex). Each term's per-page hit count is shown in the URL Details panel. Empty list disables the scan entirely."
        example={'free shipping\npricing\nbeta\ncoming soon'}
      />
    </>
  );
}

function UrlRewritingPanel({ form, update }: PanelProps) {
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        Normalisation applied before URLs are deduplicated and queued.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Bool
          label="Strip www."
          checked={form.stripWww}
          onChange={(v) => update('stripWww', v)}
          hint="Treat www.x.com and x.com as the same URL"
          info="Removes the leading 'www.' from the host at normalisation time. The seen-set, redirect graph, and link extraction all use the rewritten form, so duplicates collapse correctly."
          example="On if your site canonicalises to non-www but emits www links somewhere."
        />
        <Bool
          label="Force HTTPS"
          checked={form.forceHttps}
          onChange={(v) => update('forceHttps', v)}
          hint="Upgrade http:// → https:// before fetching"
          info="Rewrites http:// to https:// before fetching. Breaks HTTP-only sites."
          example="On for modern sites that 301 http→https anyway; off for legacy intranet."
        />
        <Bool
          label="Lowercase path"
          checked={form.lowercasePath}
          onChange={(v) => update('lowercasePath', v)}
          hint="Treat /Foo and /foo as the same URL"
          info="Lowercases the URL path component. Host is already case-insensitive per the URL spec, so this only affects the path."
          example="On if your CMS serves the same page at mixed casing (/Foo and /foo)."
        />
        <label className="flex flex-col gap-1">
          <FieldLabel
            label="Trailing slash policy"
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
            <option value="leave">Leave as-is</option>
            <option value="strip">Strip (/foo/ → /foo)</option>
            <option value="add">Add (/foo → /foo/)</option>
          </select>
        </label>
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
  const rules = form.customExtractionRules;
  const setRules = (next: CustomExtractionRule[]) => update('customExtractionRules', next);
  const updateRule = (i: number, patch: Partial<CustomExtractionRule>) => {
    const next = rules.slice();
    next[i] = { ...next[i]!, ...patch };
    setRules(next);
  };
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        Up to 10 custom extraction rules. Each runs against every crawled
        HTML page; results are stored on the URL row and visible in the
        URL Details panel under <strong>Extraction</strong>.
      </p>

      {rules.length === 0 && (
        <p className="mb-3 text-[11px] italic text-surface-500">No rules — click "Add Rule" to start.</p>
      )}

      {rules.map((r, i) => (
        <div
          key={i}
          className="mb-3 rounded border border-surface-800 bg-surface-950/40 p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
              Rule #{i + 1}
            </div>
            <button
              className="rounded p-1 text-surface-500 hover:bg-surface-800 hover:text-red-400"
              onClick={() => setRules(rules.filter((_, j) => j !== i))}
              title="Remove rule"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <FieldLabel
                label="Name"
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
                label="Type"
                info="`css` runs against the parsed DOM; `regex` runs against raw HTML."
                example="css for selectors, regex for free-form patterns"
              />
              <select
                className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                value={r.type}
                onChange={(e) =>
                  updateRule(i, { type: e.target.value as 'css' | 'regex' })
                }
              >
                <option value="css">CSS Selector</option>
                <option value="regex">Regex</option>
              </select>
            </label>
          </div>

          <label className="mb-2 flex flex-col gap-1">
            <FieldLabel
              label={r.type === 'css' ? 'CSS Selector' : 'Regex Pattern'}
              info={
                r.type === 'css'
                  ? 'Standard CSS selector — same syntax as `document.querySelectorAll`.'
                  : 'JavaScript regex (no flags — /g is implicit). Use a capture group with `output=regex_group` to extract just part of the match.'
              }
              example={
                r.type === 'css'
                  ? '.price > .amount,  meta[property="og:image"],  .breadcrumb li:last-child'
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
                label="Output"
                info={
                  r.type === 'css'
                    ? 'What to read off each matched element.'
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
                {r.type === 'css' ? (
                  <>
                    <option value="text">Text</option>
                    <option value="attribute">Attribute</option>
                    <option value="inner_html">Inner HTML</option>
                    <option value="outer_html">Outer HTML</option>
                    <option value="count">Count</option>
                  </>
                ) : (
                  <>
                    <option value="regex_group">Capture group 1</option>
                    <option value="text">Whole match</option>
                    <option value="count">Count</option>
                  </>
                )}
              </select>
            </label>
            {r.type === 'css' && r.output === 'attribute' ? (
              <label className="flex flex-col gap-1">
                <FieldLabel
                  label="Attribute"
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
                label="Multi-Match"
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
                <option value="first">First</option>
                <option value="last">Last</option>
                <option value="all">All (array)</option>
                <option value="concat">Concat (` | `)</option>
                <option value="count">Count</option>
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
          <Plus className="h-3 w-3" /> Add Rule
        </button>
      )}
      {rules.length >= 10 && (
        <p className="text-[10px] text-surface-500">Limit reached (10 rules).</p>
      )}
    </>
  );
}

function WebhookPanel({ form, update }: PanelProps) {
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        Webhook fired once when each crawl finishes. Single <code>POST</code>{' '}
        with a JSON summary (start URL, duration, total URLs, status mix,
        every non-zero issue count). Empty disables.
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <Text
          label="Webhook URL"
          value={form.webhookUrl}
          onChange={(v) => update('webhookUrl', v)}
          info="`POST <url>` is fired when the `done` event emits. 10 s timeout. Failures are logged as info events but never break the crawl."
          example="https://hooks.slack.com/services/T0/B0/abc, https://your-server.example/freecrawl-hook"
        />
        <p className="mt-1 text-[10px] text-surface-500">
          Compatible with Slack incoming webhooks (the JSON shape is rich
          enough for Slack to render plain text), Zapier "Catch Hook"
          triggers, Discord webhooks, and custom HTTP endpoints.
        </p>
      </div>
    </>
  );
}

function AuthPanel({ form, update }: PanelProps) {
  const auth = form.auth;
  const setAuth = (patch: Partial<HttpAuth>) =>
    update('auth', { ...auth, ...patch });
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        HTTP authentication applied on every request. Useful for staging
        environments behind Basic auth, or APIs that require a Bearer
        token. Digest is not supported (challenge-response state machine).
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <label className="mb-2 flex flex-col gap-1">
          <FieldLabel
            label="Auth scheme"
            info="`none` disables auth; `basic` adds `Authorization: Basic <base64>`; `bearer` adds `Authorization: Bearer <token>`."
            example="basic for /staging behind nginx; bearer for protected APIs"
          />
          <select
            className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
            value={auth.type}
            onChange={(e) =>
              setAuth({ type: e.target.value as HttpAuth['type'] })
            }
          >
            <option value="none">None</option>
            <option value="basic">Basic (username + password)</option>
            <option value="bearer">Bearer (token)</option>
          </select>
        </label>

        {auth.type === 'basic' && (
          <>
            <Text
              label="Username"
              value={auth.username ?? ''}
              onChange={(v) => setAuth({ username: v })}
              info="Sent base64-encoded as the first half of the credential pair."
              example="staging-user"
            />
            <Text
              label="Password"
              value={auth.password ?? ''}
              onChange={(v) => setAuth({ password: v })}
              info="Stored in your local prefs file as plain text. Treat the file accordingly."
              example="hunter2"
            />
          </>
        )}

        {auth.type === 'bearer' && (
          <Text
            label="Token"
            value={auth.token ?? ''}
            onChange={(v) => setAuth({ token: v })}
            info="Sent verbatim as `Bearer <token>`. Don't include the `Bearer ` prefix yourself."
            example="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          />
        )}
      </div>
    </>
  );
}

function NetworkPanel({ form, update }: PanelProps) {
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        Network-level controls: proxy override, file-extension exclusion,
        redirect hop cap.
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <Text
          label="Proxy URL (overrides HTTPS_PROXY)"
          value={form.proxyUrl}
          onChange={(v) => update('proxyUrl', v)}
          info="Same syntax as HTTPS_PROXY/HTTP_PROXY env vars. Leave empty to inherit env. Routes via undici's ProxyAgent."
          example="http://user:pass@proxy.corp:8080, http://10.0.0.5:3128"
        />
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          Saved Proxy Profiles
        </div>
        <p className="mb-2 text-[10px] text-surface-500">
          Save multiple `(name, URL)` pairs and switch between them via
          the dropdown below. The active profile overrides the Proxy URL
          field and the HTTPS_PROXY env var. Empty selection falls back
          to the Proxy URL above.
        </p>
        <label className="mb-3 flex flex-col gap-1">
          <FieldLabel
            label="Active profile"
            info="Picks one of the saved profiles by name. Empty = use the Proxy URL field above (or env vars when that's also empty)."
          />
          <select
            className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
            value={form.proxyProfileActive}
            onChange={(e) => update('proxyProfileActive', e.target.value)}
          >
            <option value="">— none (use Proxy URL above) —</option>
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
              No saved profiles — add one below.
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
                aria-label="Remove profile"
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
          <Plus className="h-3 w-3" /> Add proxy profile
        </button>
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <Text
          label="Exclude extensions (comma-separated)"
          value={form.excludeExtensionsText}
          onChange={(v) => update('excludeExtensionsText', v)}
          info="URL paths ending in any of these extensions are not enqueued. Case-insensitive. Start URL is always crawled regardless."
          example="pdf, jpg, png, woff2, mp4"
        />
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <Num
          label="Max redirect hops"
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
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        Near-duplicate detection. After every crawl, body text is hashed
        with a 64-bit SimHash, and pages whose hashes lie within the
        configured Hamming distance of each other are clustered as
        near-duplicates. Surfaced under <strong>Issues → Content → Near-Duplicate</strong>.
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          Threshold
        </div>
        <Num
          label="Max Hamming distance (0 = exact only, 12 = very loose, 0 disables)"
          value={form.nearDuplicateHammingThreshold}
          onChange={(v) => update('nearDuplicateHammingThreshold', v)}
          info="Two pages are flagged as near-duplicates if their 64-bit SimHash differs by at most this many bits. 3 ≈ 95% similarity over body-text shingles (Screaming Frog's tightest filter). Set to 0 to skip clustering entirely."
          example="3 = recommended; 5 catches looser duplicates (templated content with light variation); 0 turns the post-crawl pass off."
        />
        <p className="mt-1 text-[10px] text-surface-500">
          Lower = stricter. 3 is the SF-equivalent default. Pages with too
          little body content (&lt;50 characters) are excluded from
          clustering regardless of threshold.
        </p>
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          Scope
        </div>
        <Bool
          label="Only cluster indexable pages"
          checked={form.duplicatesOnlyIndexable}
          onChange={(v) => update('duplicatesOnlyIndexable', v)}
          info="When on, pages with noindex / canonicalised / robots-blocked indexability are excluded from clustering — the Near-Duplicate report then surfaces only issues that affect search visibility."
          example="ON for SEO audits (the typical case). Turn OFF to also cluster paginated / canonical-blocked variants for completeness."
        />
      </div>

      <div className="rounded border border-surface-800 bg-surface-950/40 p-3 text-[10px] text-surface-500">
        <strong className="text-surface-300">Cost:</strong> SimHash adds
        ~5-10 ms per page during crawl; clustering itself runs after the
        last URL completes (~3-10 s at 1M URLs, &lt;500 ms at 100K).
      </div>
    </>
  );
}

function HardwarePanel({ form, update }: PanelProps) {
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        Resource caps for the crawler process. Useful for keeping the
        machine usable while crawling large sites (1M+ URLs).
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          Memory
        </div>
        <Num
          label="Memory soft limit (MB) — 0 = unlimited"
          value={form.memoryLimitMb}
          onChange={(v) => update('memoryLimitMb', v)}
          info="Crawler RSS auto-pauses the queue when this is exceeded; resumes once memory drops to 80% of the cap. Soft cap — does not enforce a hard heap limit."
          example="2048 (≈2 GB) on a 4 GB laptop; 8192 on a 16 GB workstation; 0 to disable."
        />
        <p className="mt-1 text-[10px] text-surface-500">
          When the crawler's RSS exceeds this, the queue auto-pauses and
          resumes once memory drops below 80% of the cap. Soft cap — does
          not enforce a hard heap limit.
        </p>
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          Queue
        </div>
        <Num
          label="Max in-memory queue size — 0 = unlimited"
          value={form.maxQueueSize}
          onChange={(v) => update('maxQueueSize', v)}
          info="Hard cap on pending URLs held in memory. Excess discoveries are dropped silently — bounds peak heap during fan-out bursts (big sitemaps, dense link graphs)."
          example="50000 keeps RAM bounded during big sitemap fan-outs; 0 for typical crawls."
        />
        <p className="mt-1 text-[10px] text-surface-500">
          Hard cap on pending URLs held in memory. Excess discoveries are
          dropped silently — bounds peak heap during fan-out bursts (large
          sitemaps, dense link graphs). Set conservatively if memory is
          tight.
        </p>
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          CPU
        </div>
        <label className="mb-2 flex flex-col gap-1">
          <FieldLabel
            label="Process priority"
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
            <option value="normal">Normal</option>
            <option value="below-normal">Below Normal</option>
            <option value="idle">Idle (lowest)</option>
          </select>
        </label>
        <p className="text-[10px] text-surface-500">
          OS scheduler hint. Lowering priority lets the rest of the
          machine stay responsive during heavy crawls. Effective on next
          crawl start; may require elevated privileges on some platforms.
          For raw CPU concurrency, see <strong>Max Concurrency</strong> in the
          Crawler section.
        </p>
      </div>
    </>
  );
}

function ContentPanel({ form, update }: PanelProps) {
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        How crawled HTML is stored on disk. Disable body snapshots to keep
        the project file small when you don't need the View Source detail
        tab; tighten the cap for sites with adversarially-large pages.
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          Body Snapshots
        </div>
        <Bool
          label="Store raw HTML body per page"
          checked={form.storeBodySnapshots}
          onChange={(v) => update('storeBodySnapshots', v)}
          info="Drives the View Source detail tab. ~30–200 KB on disk per HTML page; turn off if you only need metadata and not full source viewing."
          example="On for SEO audits where View Source matters; off for 1M-URL crawls where disk is tight."
        />
        <div className="mt-3">
          <Num
            label="Body cap per page (bytes) — 0 = unbounded"
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
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        Per-pass post-crawl analysis toggles. Each pass runs after the
        HTTP fetch phase finishes and feeds different issue filters. Skip
        passes you don't need to shave wall-clock on large crawls; the
        related issue counters quietly read as 0 until the pass runs.
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3 space-y-2">
        <Bool
          label="Recompute inlinks"
          checked={form.analyseInlinks}
          onChange={(v) => update('analyseInlinks', v)}
          info="Counts how many internal pages link to each URL. Drives the Most-Linked URLs report and the per-row Inlinks column."
        />
        <Bool
          label="Recompute redirect chains"
          checked={form.analyseRedirectChains}
          onChange={(v) => update('analyseRedirectChains', v)}
          info="Walks 3xx redirect chains, fills `redirect_chain_length` / `redirect_loop`. Drives the 'Long Chain' and 'Redirect Loop' issues + the Redirects tab."
        />
        <Bool
          label="Hreflang reciprocity + inconsistent lang"
          checked={form.analyseHreflang}
          onChange={(v) => update('analyseHreflang', v)}
          info="Page A→B declared but B→A absent flags 'Reciprocity Missing'; same lang on two hrefs flags 'Inconsistent Lang'."
        />
        <Bool
          label="Near-duplicate clustering"
          checked={form.analyseDuplicates}
          onChange={(v) => update('analyseDuplicates', v)}
          info="64-bit SimHash + LSH bucketing + Union-Find clustering on body shingles. Most expensive pass — typical 5–10 s on a 100k crawl."
        />
        <Bool
          label="Pagination ordinal-gap detection"
          checked={form.analysePagination}
          onChange={(v) => update('analysePagination', v)}
          info="?page=1 / ?page=2 / ?page=4 → flags 'Sequence Break' on every member of the broken cluster."
        />
        <Bool
          label="Materialise heavy issue counters"
          checked={form.analyseIssues}
          onChange={(v) => update('analyseIssues', v)}
          info="Pre-computes Dead External Domain, Duplicate URL post-norm, Canonical Chain Multi-hop. Without this the sidebar shows 0 for those three."
        />
      </div>
    </>
  );
}

function IssuesPanel() {
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        Per-issue check on/off toggles.
      </p>
      <div className="rounded border border-amber-700/40 bg-amber-900/10 p-3 text-[11px] text-amber-200">
        <strong>Coming in V2.</strong> Today every issue check runs
        unconditionally and surfaces in the sidebar. The plan is to let
        you silence specific checks per-project (e.g. disable
        "Description = Title" on a CMS that's known to do it
        intentionally). Until that ships, hide rows you don't care about
        by collapsing the sidebar group, or filter them out via the
        Advanced filter on each tab.
      </div>
    </>
  );
}

function AdvancedPanel({ form, update }: PanelProps) {
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        Lower-level caps and link-follow toggles. Defaults are tuned for
        typical SEO audits — only touch these if you know why.
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          Link & Response Caps
        </div>
        <Num
          label="Max links per page (issue threshold)"
          value={form.maxLinksPerPage}
          onChange={(v) => update('maxLinksPerPage', v)}
          info="Pages with > this many outgoing links (internal + external) trip the 'Total Links per Page' issue. Google's historic recommendation is 100; mega-menus/hub-pages routinely blow past this."
          example="100 default; 50 for tight on-page link discipline; 0 to disable the issue."
        />
        <Num
          label="Max response time (ms) — 0 = disabled"
          value={form.maxResponseTimeMs}
          onChange={(v) => update('maxResponseTimeMs', v)}
          info="Aborts requests whose total lifetime (connect + headers + body) exceeds this. Distinct from `requestTimeoutMs` which is the headers timeout. Useful for capping individual slow pages without lowering the overall fetch timeout."
          example="60000 (1 minute) for huge resources; 0 to rely solely on the fetch timeout."
        />
        <Num
          label="Max file size (bytes) — 0 = disabled"
          value={form.maxFileSizeBytes}
          onChange={(v) => update('maxFileSizeBytes', v)}
          info="Skips body parsing for pages whose Content-Length header exceeds this. The page row is still created so links to it aren't lost; only body parsing and source snapshot capture are skipped."
          example="10485760 (10 MB) on bandwidth-tight crawls; 0 to download anything."
        />
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          URL Structure Thresholds
        </div>
        <Num
          label="Max URL length (chars)"
          value={form.maxUrlLength}
          onChange={(v) => update('maxUrlLength', v)}
          info="Trips the 'URL Too Long' issue when LENGTH(url) > this. RFC 7230 doesn't mandate a max but most servers + middleboxes fail above ~2 KB; Chrome itself caps at ~32 KB."
          example="2048 default (RFC-suggested practical ceiling)."
        />
        <Num
          label="Max query string length (chars) — 0 = disabled"
          value={form.maxQueryStringLength}
          onChange={(v) => update('maxQueryStringLength', v)}
          info="Trips 'Long Query String' when LENGTH(query) > this. Typical session-id sprawl + UTM tracking hits 100+ chars; over 200 starts to look like a bug."
          example="100 default for most audits; 0 to disable the check."
        />
        <Num
          label="Max folder depth — 0 = disabled"
          value={form.maxFolderDepth}
          onChange={(v) => update('maxFolderDepth', v)}
          info="Trips 'Folder Depth Too Deep' when the URL path's `/`-segment count exceeds this. Useful for spotting over-nested URL structures that bury content from crawlers."
          example="4 default; 6 on documentation sites with deep TOC trees; 0 to disable."
        />
      </div>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3 space-y-2">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          Link Follow Behaviour
        </div>
        <Bool
          label="Follow canonical targets"
          checked={form.followCanonicals}
          onChange={(v) => update('followCanonicals', v)}
          info="When on, a 200 page declaring a canonical pointing elsewhere also enqueues that target. Default off — most crawls treat canonicals as a signal, not a navigation hint."
        />
        <Bool
          label="Follow rel=next / rel=prev"
          checked={form.followPaginationLinks}
          onChange={(v) => update('followPaginationLinks', v)}
          info="When on (default), pagination_next + pagination_prev URLs are post-fetch enqueued. Off only to debug pagination-only loops without disabling all link follow."
        />
        <Bool
          label="Follow nofollow links (override 'respect nofollow')"
          checked={form.followNofollow}
          onChange={(v) => update('followNofollow', v)}
          info="When on, rel=nofollow links are recursed into like any other link. Default off — Screaming Frog 'Respect Nofollow' default."
        />
        <Bool
          label="Follow JS / meta-refresh redirects"
          checked={form.followJsRedirects}
          onChange={(v) => update('followJsRedirects', v)}
          info="When on, `<meta http-equiv='refresh'>` content URLs are enqueued like a redirect target. window.location body redirects are heuristic-only and currently out of scope."
        />
      </div>
    </>
  );
}

function CookiesPanel({ form, update }: PanelProps) {
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        Cookie policy applied to every fetch. The crawler is otherwise
        stateless across requests; this setting controls whether
        Set-Cookie response headers are recorded for the cookie-flag
        issue checks (Missing Secure / HttpOnly / SameSite).
      </p>

      <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
        <label className="flex flex-col gap-1">
          <FieldLabel
            label="Cookie policy"
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
            <option value="reject-all">Reject all (default — stateless)</option>
            <option value="accept-all">Accept all</option>
            <option value="block-third-party">Block third-party</option>
          </select>
        </label>
        <p className="mt-2 text-[10px] text-surface-500">
          Cookie values themselves are <strong>never</strong> stored in
          the project file regardless of this setting — only the security
          flag (Secure / HttpOnly / SameSite) counts are kept.
        </p>
      </div>
    </>
  );
}

function PerHostUaPanel({ form, update }: PanelProps) {
  const rules = form.perHostUserAgents;
  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        Override the User-Agent on a per-host basis. Useful when crawling
        a mobile subdomain with the mobile-Googlebot UA in the same run
        as the desktop site, or when a CDN serves a different page based
        on the requester's UA. The first matching pattern wins; the
        global User-Agent (Requests tab) is the fallback.
      </p>
      <div className="mb-3 rounded border border-surface-800 bg-surface-950/40 p-3">
        <p className="mb-2 text-[10px] text-surface-500">
          Pattern syntax: exact host (<code>m.example.com</code>) or
          leading wildcard (<code>*.example.com</code>) — the wildcard
          form matches any subdomain but <em>not</em> the apex.
        </p>
        <div className="space-y-2">
          {rules.length === 0 && (
            <div className="rounded border border-dashed border-surface-700 px-3 py-4 text-center text-[11px] text-surface-500">
              No per-host overrides yet — add one below.
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
                title="Remove"
                aria-label="Remove rule"
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
          <Plus className="h-3 w-3" /> Add per-host UA rule
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
  return (
    <span className={clsx('flex items-center gap-1 text-[10px] text-surface-400', className)}>
      <span>{label}</span>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & FieldInfo) {
  return (
    <label className="mb-3 flex flex-col gap-1">
      <FieldLabel label={label} info={info} example={example} />
      <input
        type="text"
        className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
        value={value}
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
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
} & FieldInfo) {
  return (
    <label className="flex items-start gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1">
          <span className="text-[12px] text-surface-100">{label}</span>
          <InfoTip info={info} example={example} />
        </span>
        {hint && <span className="text-[10px] text-surface-500">{hint}</span>}
      </div>
    </label>
  );
}
