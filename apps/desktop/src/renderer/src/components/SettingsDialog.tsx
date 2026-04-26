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
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import type { CrawlConfig, CrawlMode } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

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
}

type SectionKey =
  | 'mode'
  | 'crawler'
  | 'requests'
  | 'filters'
  | 'custom-search'
  | 'url-rewriting'
  | 'hardware';

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
    key: 'url-rewriting',
    label: 'URL Rewriting',
    icon: Replace,
    keywords: 'url rewrite normalize www https lowercase trailing slash',
  },
  {
    key: 'hardware',
    label: 'Hardware',
    icon: Cpu,
    keywords: 'hardware cpu ram memory queue limit priority resource usage',
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
              {active === 'url-rewriting' && (
                <UrlRewritingPanel form={form} update={update} />
              )}
              {active === 'hardware' && (
                <HardwarePanel form={form} update={update} />
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
        <span className="text-[10px] text-surface-400">Crawl Mode</span>
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
        <Num label="Max Depth" value={form.maxDepth} onChange={(v) => update('maxDepth', v)} />
        <Num label="Max URLs" value={form.maxUrls} onChange={(v) => update('maxUrls', v)} />
        <Num
          label="Max Concurrency"
          value={form.maxConcurrency}
          onChange={(v) => update('maxConcurrency', v)}
        />
        <Num label="Max RPS" value={form.maxRps} onChange={(v) => update('maxRps', v)} />
        <Num
          label="Request Timeout (ms)"
          value={form.requestTimeoutMs}
          onChange={(v) => update('requestTimeoutMs', v)}
        />
        <Num
          label="Crawl Delay (ms, per worker)"
          value={form.crawlDelayMs}
          onChange={(v) => update('crawlDelayMs', v)}
        />
        <Num
          label="Retry Attempts"
          value={form.retryAttempts}
          onChange={(v) => update('retryAttempts', v)}
        />
        <Num
          label="Retry Initial Delay (ms)"
          value={form.retryInitialDelayMs}
          onChange={(v) => update('retryInitialDelayMs', v)}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Bool
          label="Follow redirects"
          checked={form.followRedirects}
          onChange={(v) => update('followRedirects', v)}
        />
        <Bool
          label="Respect robots.txt"
          checked={form.respectRobotsTxt}
          onChange={(v) => update('respectRobotsTxt', v)}
        />
        <Bool
          label="Crawl external links"
          checked={form.crawlExternal}
          onChange={(v) => update('crawlExternal', v)}
        />
        <Bool
          label="Store nofollow links"
          checked={form.storeNofollowLinks}
          onChange={(v) => update('storeNofollowLinks', v)}
          hint="Default off (Screaming-Frog style 'Respect Nofollow')"
        />
        <Bool
          label="Discover sitemaps"
          checked={form.discoverSitemaps}
          onChange={(v) => update('discoverSitemaps', v)}
          hint="Read sitemap.xml from robots.txt + default paths at crawl start"
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
      />
      <Text
        label="Accept-Language"
        value={form.acceptLanguage}
        onChange={(v) => update('acceptLanguage', v)}
      />
      <Area
        label='Custom Headers (one per line, "Key: Value")'
        value={form.customHeadersText}
        onChange={(v) => update('customHeadersText', v)}
        rows={6}
        placeholder={'Authorization: Bearer ...\nX-Custom: foo'}
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
      />
      <Area
        label="Exclude Patterns (regex, one per line)"
        value={form.excludePatternsText}
        onChange={(v) => update('excludePatternsText', v)}
        rows={5}
        placeholder={'/admin\n\\.pdf$'}
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
        />
        <Bool
          label="Force HTTPS"
          checked={form.forceHttps}
          onChange={(v) => update('forceHttps', v)}
          hint="Upgrade http:// → https:// before fetching"
        />
        <Bool
          label="Lowercase path"
          checked={form.lowercasePath}
          onChange={(v) => update('lowercasePath', v)}
          hint="Treat /Foo and /foo as the same URL"
        />
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-surface-400">Trailing slash policy</span>
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
          <span className="text-[10px] text-surface-400">Process priority</span>
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

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] text-surface-400">{label}</span>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="mb-3 flex flex-col gap-1">
      <span className="text-[10px] text-surface-400">{label}</span>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  placeholder?: string;
}) {
  return (
    <label className="mb-3 flex flex-col gap-1">
      <span className="text-[10px] text-surface-400">{label}</span>
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
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] text-surface-100">{label}</span>
        {hint && <span className="text-[10px] text-surface-500">{hint}</span>}
      </div>
    </label>
  );
}
