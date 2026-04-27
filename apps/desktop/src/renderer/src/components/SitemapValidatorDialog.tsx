import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import type { SitemapValidateResult } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SitemapValidatorDialog({ open, onClose }: Props) {
  const config = useAppStore((s) => s.config);
  const [url, setUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SitemapValidateResult | null>(null);

  useEffect(() => {
    if (!open) return;
    // Pre-fill with the start URL's likely sitemap so a single-click run
    // works for the "did the site I just crawled have a valid sitemap?"
    // path that brings most users into this dialog.
    let suggested = '';
    if (config.startUrl) {
      try {
        suggested = new URL('/sitemap.xml', config.startUrl).toString();
      } catch {
        suggested = '';
      }
    }
    setUrl(suggested);
    setResult(null);
    setError(null);
  }, [open, config.startUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function runValidate() {
    if (!url.trim()) return;
    setRunning(true);
    setError(null);
    try {
      const r = await window.freecrawl.sitemapValidate({
        url: url.trim(),
        userAgent: config.userAgent,
      });
      setResult(r);
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-[760px] flex-col rounded-md border border-surface-700 bg-surface-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-surface-800 px-4 py-2.5">
          <div className="text-sm font-semibold tracking-wide text-surface-100">
            Sitemap Validator
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
          <label className="mb-3 flex flex-col gap-1">
            <span className="text-[10px] text-surface-400">Sitemap URL</span>
            <input
              type="text"
              className="rounded border border-surface-700 bg-surface-950 px-2 py-1.5 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !running) void runValidate();
              }}
              placeholder="https://example.com/sitemap.xml"
              spellCheck={false}
              autoFocus
            />
          </label>

          <div className="mb-4 flex items-center gap-2">
            <button
              className="rounded bg-blue-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              onClick={runValidate}
              disabled={running || !url.trim()}
            >
              {running ? 'Validating…' : 'Validate'}
            </button>
            <span className="text-[10px] text-surface-500">
              Walks nested sitemap-index entries up to depth 3 / 100K URLs.
            </span>
          </div>

          {error && (
            <div className="mb-3 rounded border border-red-700/60 bg-red-900/20 px-3 py-2 text-[11px] text-red-200">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div
                className={clsx(
                  'rounded border px-3 py-2 text-[12px]',
                  result.findings.length === 0 && result.errors.length === 0
                    ? 'border-emerald-700/60 bg-emerald-900/20 text-emerald-200'
                    : 'border-amber-700/60 bg-amber-900/20 text-amber-200',
                )}
              >
                {result.findings.length === 0 && result.errors.length === 0 ? (
                  <span>
                    ✓ <strong>Valid</strong> — {result.urlCount.toLocaleString()} URL
                    {result.urlCount === 1 ? '' : 's'}
                    {result.truncated ? ' (truncated)' : ''}
                  </span>
                ) : (
                  <span>
                    ⚠ <strong>{result.findings.length + result.errors.length} finding(s)</strong>
                    {result.urlCount > 0
                      ? ` — ${result.urlCount.toLocaleString()} URL${result.urlCount === 1 ? '' : 's'} parsed`
                      : ''}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <Stat
                  label="Sitemaps tried"
                  value={String(result.sitemapsTried.length)}
                />
                <Stat
                  label="Sitemaps parsed"
                  value={String(result.sitemapsParsed.length)}
                />
                <Stat label="URL entries" value={result.urlCount.toLocaleString()} />
              </div>

              {result.findings.length > 0 && (
                <div>
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-amber-300">
                    Findings
                  </div>
                  <ul className="space-y-1 rounded border border-surface-800 bg-surface-950 p-2 font-mono text-[10px] text-amber-100">
                    {result.findings.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.errors.length > 0 && (
                <div>
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-red-300">
                    Fetch errors
                  </div>
                  <ul className="space-y-1 rounded border border-surface-800 bg-surface-950 p-2 font-mono text-[10px] text-red-100">
                    {result.errors.map((e, i) => (
                      <li key={i} className="break-all">
                        <span className="text-surface-400">{e.sitemap}</span>: {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.lastmodSamples.length > 0 && (
                <details className="text-[11px] text-surface-300">
                  <summary className="cursor-pointer text-surface-400 hover:text-surface-100">
                    Sample lastmod values ({result.lastmodSamples.length})
                  </summary>
                  <ul className="mt-1 space-y-0.5 pl-4 font-mono text-[10px]">
                    {result.lastmodSamples.map((s, i) => (
                      <li key={i} className="break-all">
                        {s}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {result.sitemapsTried.length > 0 && (
                <details className="text-[11px] text-surface-300">
                  <summary className="cursor-pointer text-surface-400 hover:text-surface-100">
                    Sitemaps walked ({result.sitemapsTried.length})
                  </summary>
                  <ul className="mt-1 space-y-0.5 pl-4 font-mono text-[10px]">
                    {result.sitemapsTried.map((s) => (
                      <li key={s} className="break-all">
                        {s}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-surface-800 px-4 py-2.5">
          <button
            className="rounded border border-surface-700 px-3 py-1 text-[11px] hover:bg-surface-800"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-surface-800 bg-surface-950 px-2 py-1">
      <span className="text-surface-400">{label}</span>
      <span className="font-mono text-surface-100">{value}</span>
    </div>
  );
}
