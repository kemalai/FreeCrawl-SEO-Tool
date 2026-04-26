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
  Webhook,
  Plus,
  Trash2,
  Shield,
  Network,
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
}

type SectionKey =
  | 'mode'
  | 'crawler'
  | 'requests'
  | 'filters'
  | 'custom-search'
  | 'custom-extraction'
  | 'url-rewriting'
  | 'duplicates'
  | 'auth'
  | 'network'
  | 'hardware'
  | 'webhook';

interface SectionDef {
  key: SectionKey;
  label: string;
  icon: LucideIcon;
  /** Searchable keywords beyond the label. */
  keywords: string;
}

const SECTIONS: SectionDef[] = [
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
              {active === 'mode' && (
                <ModePanel form={form} update={update} />
              )}
              {active === 'crawler' && (
                <CrawlerPanel form={form} update={update} />
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
