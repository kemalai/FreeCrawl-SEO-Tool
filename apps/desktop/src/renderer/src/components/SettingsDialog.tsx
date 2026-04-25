import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
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
}

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

  // Re-seed the form whenever the dialog reopens — picks up any external
  // config change (e.g. URL/scope edits in the top bar) so the dialog
  // never shows stale values.
  useEffect(() => {
    if (open) setForm(configToForm(config));
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
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-[680px] flex-col rounded-md border border-surface-700 bg-surface-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-surface-800 px-4 py-2.5">
          <div className="text-sm font-semibold tracking-wide text-surface-100">
            Settings
          </div>
          <button
            className="ml-auto rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
            onClick={onClose}
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4 text-[12px]">
          <Section title="Mode">
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
                rows={6}
                placeholder={'https://example.com/\nhttps://example.com/about\nhttps://example.com/contact'}
              />
            )}
          </Section>

          <Section title="Crawler">
            <div className="grid grid-cols-2 gap-3">
              <Num label="Max Depth" value={form.maxDepth} onChange={(v) => update('maxDepth', v)} />
              <Num
                label="Max URLs"
                value={form.maxUrls}
                onChange={(v) => update('maxUrls', v)}
              />
              <Num
                label="Max Concurrency"
                value={form.maxConcurrency}
                onChange={(v) => update('maxConcurrency', v)}
              />
              <Num
                label="Max RPS"
                value={form.maxRps}
                onChange={(v) => update('maxRps', v)}
              />
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
            <div className="mt-3 grid grid-cols-2 gap-2">
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
          </Section>

          <Section title="Requests">
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
              rows={4}
              placeholder={'Authorization: Bearer ...\nX-Custom: foo'}
            />
          </Section>

          <Section title="Filters">
            <Area
              label="Include Patterns (regex, one per line — empty = all allowed)"
              value={form.includePatternsText}
              onChange={(v) => update('includePatternsText', v)}
              rows={3}
              placeholder={'^https?://example\\.com/blog/\n/api/v2/'}
            />
            <Area
              label="Exclude Patterns (regex, one per line)"
              value={form.excludePatternsText}
              onChange={(v) => update('excludePatternsText', v)}
              rows={3}
              placeholder={'/admin\n\\.pdf$'}
            />
          </Section>

          <Section title="Custom Search">
            <Area
              label="Search Terms (case-insensitive literal substring; one per line)"
              value={form.customSearchTermsText}
              onChange={(v) => update('customSearchTermsText', v)}
              rows={3}
              placeholder={'pricing\nfree shipping\nlimited time'}
            />
          </Section>

          <Section title="URL Rewriting">
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
          </Section>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
        {title}
      </div>
      {children}
    </div>
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
    <label className="mb-2 flex flex-col gap-1">
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
    <label className="mb-2 flex flex-col gap-1">
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
