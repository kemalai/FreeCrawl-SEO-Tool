import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { AlertCircle, Loader2, Play, X } from 'lucide-react';
import type {
  CustomExtractionRule,
  ExtractionPreviewResult,
} from '@freecrawl/shared-types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Current rules from the Custom Extraction panel — preview runs
   *  them as-is, even if the user hasn't hit Save yet. That's the
   *  whole point: validate before saving. */
  rules: CustomExtractionRule[];
  /** Optional default URL — typically the start URL from the in-form
   *  crawl config so the user doesn't have to type it. */
  defaultUrl?: string;
  userAgent?: string;
  acceptLanguage?: string;
}

export function ExtractionPreviewDialog({
  open,
  onClose,
  rules,
  defaultUrl,
  userAgent,
  acceptLanguage,
}: Props) {
  const { t } = useTranslation();
  const [url, setUrl] = useState(defaultUrl ?? '');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ExtractionPreviewResult | null>(null);

  useEffect(() => {
    if (open) {
      setUrl(defaultUrl ?? '');
      setResult(null);
    }
  }, [open, defaultUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const runPreview = async () => {
    if (running) return;
    if (!url.trim()) return;
    setRunning(true);
    setResult(null);
    try {
      const r = await window.freecrawl.extractionPreview({
        url: url.trim(),
        rules,
        userAgent,
        acceptLanguage,
      });
      setResult(r);
    } catch (e) {
      setResult({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setRunning(false);
    }
  };

  const ruleCount = rules.filter((r) => r.name.trim() && r.selector.trim())
    .length;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-surface-700 bg-surface-900 shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-surface-800 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-surface-100">
              {t('extractionPreview.title', {
                defaultValue: 'Custom Extraction Preview',
              })}
            </div>
            <div className="text-[11px] text-surface-500">
              {t('extractionPreview.subtitle', {
                defaultValue:
                  'Run all configured rules against a single URL to validate selectors / regex before crawling.',
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-200"
            title={t('common.close', { defaultValue: 'Close' })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* URL input + run */}
        <div className="flex shrink-0 items-center gap-2 border-b border-surface-800 bg-surface-900/40 px-4 py-3">
          <input
            type="text"
            className="flex-1 rounded border border-surface-700 bg-surface-950 px-2 py-1.5 font-mono text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
            placeholder="https://example.com/page"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void runPreview();
            }}
            spellCheck={false}
            autoFocus
          />
          <button
            type="button"
            onClick={runPreview}
            disabled={running || !url.trim() || ruleCount === 0}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-[12px] transition',
              running || !url.trim() || ruleCount === 0
                ? 'cursor-not-allowed border-surface-800 text-surface-600'
                : 'border-accent-500 bg-accent-500/15 text-accent-300 hover:bg-accent-500/25',
            )}
            title={
              ruleCount === 0
                ? t('extractionPreview.noRules', {
                    defaultValue:
                      'Add at least one rule (with a name and selector) before previewing.',
                  })
                : t('extractionPreview.runTitle', {
                    defaultValue: 'Fetch the URL and run every rule against the response.',
                  })
            }
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            <span>
              {running
                ? t('extractionPreview.running', { defaultValue: 'Running…' })
                : t('extractionPreview.run', {
                    defaultValue: 'Run preview ({{n}} rule(s))',
                    n: ruleCount,
                  })}
            </span>
          </button>
        </div>

        {/* Results */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!result && !running && (
            <div className="flex h-48 items-center justify-center text-center text-[12px] text-surface-500">
              {t('extractionPreview.idle', {
                defaultValue:
                  'Enter a URL above and click Run preview to fetch and apply every rule.',
              })}
            </div>
          )}
          {running && (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-[12px] text-surface-400">
              <Loader2 className="h-5 w-5 animate-spin text-accent-300" />
              <span>
                {t('extractionPreview.fetching', {
                  defaultValue: 'Fetching URL and parsing response…',
                })}
              </span>
            </div>
          )}
          {result && !result.ok && (
            <div className="flex items-start gap-2 px-4 py-3 text-[12px] text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-semibold">
                  {t('extractionPreview.failed', { defaultValue: 'Preview failed' })}
                </div>
                <div className="mt-1 text-surface-300">{result.error}</div>
                {result.statusCode !== undefined && (
                  <div className="mt-1 text-[11px] text-surface-500">
                    HTTP {result.statusCode} · {result.contentType || '(no content-type)'} · {result.fetchMs} ms
                  </div>
                )}
              </div>
            </div>
          )}
          {result && result.ok && (
            <>
              {/* Status strip */}
              <div className="flex flex-wrap items-center gap-3 border-b border-surface-800 bg-surface-950/40 px-4 py-2 text-[11px] text-surface-400">
                <span
                  className={clsx(
                    'inline-block rounded px-1.5 font-mono text-[10px]',
                    statusClasses(result.statusCode),
                  )}
                >
                  {result.statusCode ?? '—'}
                </span>
                {result.contentType && (
                  <span className="font-mono">{result.contentType}</span>
                )}
                {result.byteSize !== undefined && (
                  <span>
                    {(result.byteSize / 1024).toFixed(1)} KB
                  </span>
                )}
                {result.fetchMs !== undefined && (
                  <span>{result.fetchMs} ms</span>
                )}
                {result.finalUrl && result.finalUrl !== url && (
                  <span className="truncate font-mono text-surface-500" title={result.finalUrl}>
                    → {result.finalUrl}
                  </span>
                )}
              </div>

              {/* Per-rule results */}
              {result.results && result.results.length > 0 ? (
                <table className="w-full table-fixed text-[12px]">
                  <thead>
                    <tr className="border-b border-surface-800 bg-surface-900 text-left text-[10px] uppercase tracking-wider text-surface-500">
                      <th className="w-1/4 px-4 py-2 font-medium">
                        {t('extractionPreview.colName', { defaultValue: 'Rule' })}
                      </th>
                      <th className="px-4 py-2 font-medium">
                        {t('extractionPreview.colValue', { defaultValue: 'Value' })}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((r, i) => (
                      <tr
                        key={`${r.name}-${i}`}
                        className="border-b border-surface-900 align-top hover:bg-surface-900/40"
                      >
                        <td className="break-all px-4 py-2 font-mono text-surface-200">
                          {r.name}
                        </td>
                        <td className="px-4 py-2">
                          <RuleValueCell value={r.value} error={r.error} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex h-32 items-center justify-center text-[12px] text-surface-500">
                  {t('extractionPreview.noResults', {
                    defaultValue: 'No results — add rules in the Custom Extraction panel.',
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RuleValueCell({ value, error }: { value: unknown; error?: string }) {
  const { t } = useTranslation();
  if (error) {
    return (
      <div className="flex items-start gap-1.5 text-red-300">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span className="font-mono text-[11px]">{error}</span>
      </div>
    );
  }
  if (value === null || value === undefined) {
    return (
      <span className="italic text-surface-600">
        {t('extractionPreview.noMatch', { defaultValue: 'no match' })}
      </span>
    );
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span className="italic text-surface-600">
          {t('extractionPreview.noMatch', { defaultValue: 'no match' })}
        </span>
      );
    }
    return (
      <ol className="list-decimal space-y-0.5 pl-5 font-mono text-[11px] text-surface-100">
        {value.map((v, i) => (
          <li key={i} className="break-all">
            {String(v)}
          </li>
        ))}
      </ol>
    );
  }
  if (typeof value === 'number') {
    return (
      <span className="font-mono tabular-nums text-accent-300">
        {value.toLocaleString()}
      </span>
    );
  }
  return (
    <span className="block break-all font-mono text-surface-100">
      {String(value)}
    </span>
  );
}

function statusClasses(code: number | undefined): string {
  if (code === undefined) return 'bg-surface-800 text-surface-400';
  if (code >= 200 && code < 300) return 'bg-emerald-900/60 text-emerald-300';
  if (code >= 300 && code < 400) return 'bg-amber-900/60 text-amber-300';
  if (code >= 400 && code < 500) return 'bg-orange-900/60 text-orange-300';
  if (code >= 500) return 'bg-red-900/60 text-red-300';
  return 'bg-surface-800 text-surface-400';
}
