import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { RobotsTestResult, RobotsValidationIssue } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RobotsTesterDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const config = useAppStore((s) => s.config);
  const [url, setUrl] = useState('');
  const [userAgent, setUserAgent] = useState(config.userAgent);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RobotsTestResult | null>(null);
  // Custom-policy mode lets the user paste a draft robots.txt and test it
  // against URLs without deploying. Off by default so the basic flow
  // (probe live robots.txt) still works in one click.
  const [useCustom, setUseCustom] = useState(false);
  const [customRobots, setCustomRobots] = useState('');
  // Live syntax-validation results for the custom robots.txt body.
  // Recomputed in main process via `robots:validate` whenever the body
  // changes (debounced 250 ms — local lint is cheap but pure-IPC churn
  // on every keystroke would still be noisy).
  const [validation, setValidation] = useState<RobotsValidationIssue[]>([]);

  // Re-lint the custom-robots body whenever it changes. Validation is
  // sync + pure, so we don't need cancellation; the debounce is only
  // about smoothing keystrokes.
  useEffect(() => {
    if (!useCustom) {
      setValidation([]);
      return;
    }
    if (!customRobots.trim()) {
      setValidation([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void window.freecrawl
        .robotsValidate(customRobots)
        .then(setValidation)
        .catch(() => setValidation([]));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [useCustom, customRobots]);

  // Re-seed inputs whenever the dialog opens — pre-fills the URL with the
  // current crawl's start URL (handy: most "why is this blocked?" checks
  // are about the very URL you just tried to crawl) and the user agent
  // with whatever Settings has saved.
  useEffect(() => {
    if (!open) return;
    setUrl(config.startUrl || '');
    setUserAgent(config.userAgent);
    setResult(null);
  }, [open, config.startUrl, config.userAgent]);

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

  async function runTest() {
    if (!url.trim()) return;
    setRunning(true);
    try {
      const r = await window.freecrawl.robotsTest({
        url: url.trim(),
        userAgent,
        customRobots: useCustom ? customRobots : undefined,
      });
      setResult(r);
    } finally {
      setRunning(false);
    }
  }

  async function loadFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain,robots.txt';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      setCustomRobots(text);
      setUseCustom(true);
    };
    input.click();
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-[720px] flex-col rounded-md border border-surface-700 bg-surface-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-surface-800 px-4 py-2.5">
          <div className="text-sm font-semibold tracking-wide text-surface-100">
            {t('robots.title', { defaultValue: 'Robots.txt Tester' })}
          </div>
          <button
            className="ml-auto rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
            onClick={onClose}
            title={t('scheduled.closeEsc', { defaultValue: 'Close (Esc)' })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4 text-[12px]">
          <label className="mb-3 flex flex-col gap-1">
            <span className="text-[10px] text-surface-400">{t('robots.urlToTest', { defaultValue: 'URL to test' })}</span>
            <input
              type="text"
              className="rounded border border-surface-700 bg-surface-950 px-2 py-1.5 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !running) void runTest();
              }}
              placeholder="https://example.com/some/path"
              spellCheck={false}
              autoFocus
            />
          </label>

          <label className="mb-3 flex flex-col gap-1">
            <span className="text-[10px] text-surface-400">{t('robots.userAgent', { defaultValue: 'User-Agent' })}</span>
            <input
              type="text"
              className="rounded border border-surface-700 bg-surface-950 px-2 py-1.5 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
              value={userAgent}
              onChange={(e) => setUserAgent(e.target.value)}
              spellCheck={false}
            />
          </label>

          <div className="mb-3 flex items-center gap-2 rounded border border-surface-800 bg-surface-950 px-2 py-1.5">
            <label className="flex items-center gap-1.5 text-[11px] text-surface-300">
              <input
                type="checkbox"
                checked={useCustom}
                onChange={(e) => setUseCustom(e.target.checked)}
                className="h-3 w-3"
              />
              {t('robots.customMode', { defaultValue: 'Test against a custom robots.txt (draft mode)' })}
            </label>
            <button
              type="button"
              className="ml-auto rounded border border-surface-700 px-2 py-0.5 text-[10px] hover:bg-surface-800"
              onClick={() => void loadFromFile()}
              disabled={running}
            >
              {t('robots.loadFromFile', { defaultValue: 'Load from file…' })}
            </button>
          </div>

          {useCustom && (
            <>
              <label className="mb-3 flex flex-col gap-1">
                <span className="text-[10px] text-surface-400">
                  {t('robots.customBodyLabel', { defaultValue: 'Custom robots.txt body (parsed — no fetch)' })}
                </span>
                <textarea
                  className="h-40 w-full resize-y rounded border border-surface-700 bg-surface-950 px-2 py-1.5 font-mono text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
                  value={customRobots}
                  onChange={(e) => setCustomRobots(e.target.value)}
                  placeholder={`User-agent: *\nDisallow: /admin/\nDisallow: /private/\nSitemap: https://example.com/sitemap.xml`}
                  spellCheck={false}
                />
              </label>
              <ValidationPanel issues={validation} bodyEmpty={!customRobots.trim()} />
            </>
          )}

          <div className="mb-4 flex items-center gap-2">
            <button
              className="rounded bg-blue-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              onClick={runTest}
              disabled={running || !url.trim()}
            >
              {running ? t('robots.testing', { defaultValue: 'Testing…' }) : useCustom ? t('robots.testCustom', { defaultValue: 'Test (custom)' }) : t('robots.test', { defaultValue: 'Test' })}
            </button>
            {result?.robotsUrl && (
              <span className="text-[10px] text-surface-500">
                robots.txt: <span className="font-mono text-surface-300">{result.robotsUrl}</span>
                {result.status !== null && result.status > 0 && (
                  <span className="ml-2">→ HTTP {result.status}</span>
                )}
              </span>
            )}
          </div>

          {result && (
            <div className="space-y-3">
              <div
                className={clsx(
                  'rounded border px-3 py-2 text-[12px]',
                  result.allowed
                    ? 'border-emerald-700/60 bg-emerald-900/20 text-emerald-200'
                    : 'border-red-700/60 bg-red-900/20 text-red-200',
                )}
              >
                {result.allowed ? (
                  <span>
                    ✓ <strong>{t('robots.allowed', { defaultValue: 'Allowed' })}</strong> {t('robots.byRobotsFor', { defaultValue: 'by robots.txt for User-Agent' })}{' '}
                    <code className="font-mono">{userAgent}</code>
                  </span>
                ) : (
                  <span>
                    ✗ <strong>{t('robots.disallowed', { defaultValue: 'Disallowed' })}</strong> {t('robots.byRobotsFor', { defaultValue: 'by robots.txt for User-Agent' })}{' '}
                    <code className="font-mono">{userAgent}</code>
                  </span>
                )}
              </div>

              {result.error && (
                <div className="rounded border border-amber-700/60 bg-amber-900/20 px-3 py-2 text-[11px] text-amber-200">
                  {result.error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <Stat label={t('robots.crawlDelay', { defaultValue: 'Crawl-Delay' })} value={result.crawlDelay !== null ? `${result.crawlDelay}s` : '—'} />
                <Stat label={t('robots.sitemapsDeclared', { defaultValue: 'Sitemaps declared' })} value={String(result.sitemaps.length)} />
              </div>

              {result.sitemaps.length > 0 && (
                <details className="text-[11px] text-surface-300">
                  <summary className="cursor-pointer text-surface-400 hover:text-surface-100">
                    {t('robots.sitemapsHeader', { defaultValue: 'Sitemaps' })} ({result.sitemaps.length})
                  </summary>
                  <ul className="mt-1 space-y-0.5 pl-4 font-mono">
                    {result.sitemaps.map((s) => (
                      <li key={s} className="break-all">
                        {s}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {result.body !== null && (
                <details className="text-[11px] text-surface-300">
                  <summary className="cursor-pointer text-surface-400 hover:text-surface-100">
                    {t('robots.bodyHeader', { defaultValue: 'robots.txt body' })} ({t('robots.charsCount', { defaultValue: '{{n}} chars', n: result.body.length })})
                  </summary>
                  <pre className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap rounded border border-surface-800 bg-surface-950 p-2 font-mono text-[10px] text-surface-200">
                    {result.body}
                  </pre>
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
            {t('common.close', { defaultValue: 'Close' })}
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

function ValidationPanel({
  issues,
  bodyEmpty,
}: {
  issues: RobotsValidationIssue[];
  bodyEmpty: boolean;
}) {
  const { t } = useTranslation();
  if (bodyEmpty) {
    return (
      <div className="mb-3 rounded border border-surface-800 bg-surface-950 px-2 py-1.5 text-[10px] text-surface-500">
        {t('robots.lintPrompt', { defaultValue: 'Paste a draft robots.txt above to lint syntax.' })}
      </div>
    );
  }
  if (issues.length === 0) {
    return (
      <div className="mb-3 rounded border border-emerald-700/60 bg-emerald-900/20 px-2 py-1.5 text-[11px] text-emerald-200">
        ✓ {t('robots.noIssues', { defaultValue: 'No syntax issues detected.' })}
      </div>
    );
  }
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.length - errors;
  return (
    <div className="mb-3 rounded border border-amber-700/60 bg-amber-900/15">
      <div className="flex items-center gap-3 border-b border-amber-700/30 px-2 py-1 text-[10px] text-amber-300">
        <span>
          {errors > 0 && <span className="font-medium">{t('robots.errorCount', { defaultValue: '{{n}} error(s)', n: errors })}</span>}
          {errors > 0 && warnings > 0 && <span> · </span>}
          {warnings > 0 && (
            <span className="font-medium text-amber-200/80">
              {t('robots.warningCount', { defaultValue: '{{n}} warning(s)', n: warnings })}
            </span>
          )}
        </span>
      </div>
      <ul className="max-h-40 overflow-auto px-2 py-1 text-[10px]">
        {issues.map((issue, idx) => (
          <li
            key={idx}
            className={clsx(
              'flex items-start gap-2 py-0.5 font-mono',
              issue.severity === 'error' ? 'text-red-300' : 'text-amber-200/80',
            )}
          >
            <span className="w-12 shrink-0 text-right text-surface-500">L{issue.line}</span>
            <span
              className={clsx(
                'inline-block w-12 shrink-0 rounded px-1 text-center text-[9px] uppercase tracking-wider',
                issue.severity === 'error'
                  ? 'bg-red-900/40 text-red-200'
                  : 'bg-amber-900/30 text-amber-200',
              )}
            >
              {issue.severity}
            </span>
            <span className="text-[10px] leading-snug text-surface-200">{issue.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
