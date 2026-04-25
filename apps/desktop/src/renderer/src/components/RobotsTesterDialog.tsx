import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import type { RobotsTestResult } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RobotsTesterDialog({ open, onClose }: Props) {
  const config = useAppStore((s) => s.config);
  const [url, setUrl] = useState('');
  const [userAgent, setUserAgent] = useState(config.userAgent);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RobotsTestResult | null>(null);

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
      const r = await window.freecrawl.robotsTest({ url: url.trim(), userAgent });
      setResult(r);
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
        className="flex max-h-[85vh] w-[720px] flex-col rounded-md border border-surface-700 bg-surface-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-surface-800 px-4 py-2.5">
          <div className="text-sm font-semibold tracking-wide text-surface-100">
            Robots.txt Tester
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
            <span className="text-[10px] text-surface-400">URL to test</span>
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
            <span className="text-[10px] text-surface-400">User-Agent</span>
            <input
              type="text"
              className="rounded border border-surface-700 bg-surface-950 px-2 py-1.5 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
              value={userAgent}
              onChange={(e) => setUserAgent(e.target.value)}
              spellCheck={false}
            />
          </label>

          <div className="mb-4 flex items-center gap-2">
            <button
              className="rounded bg-blue-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              onClick={runTest}
              disabled={running || !url.trim()}
            >
              {running ? 'Testing…' : 'Test'}
            </button>
            {result?.robotsUrl && (
              <span className="text-[10px] text-surface-500">
                robots.txt: <span className="font-mono text-surface-300">{result.robotsUrl}</span>
                {result.status !== null && (
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
                    ✓ <strong>Allowed</strong> by robots.txt for User-Agent{' '}
                    <code className="font-mono">{userAgent}</code>
                  </span>
                ) : (
                  <span>
                    ✗ <strong>Disallowed</strong> by robots.txt for User-Agent{' '}
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
                <Stat label="Crawl-Delay" value={result.crawlDelay !== null ? `${result.crawlDelay}s` : '—'} />
                <Stat label="Sitemaps declared" value={String(result.sitemaps.length)} />
              </div>

              {result.sitemaps.length > 0 && (
                <details className="text-[11px] text-surface-300">
                  <summary className="cursor-pointer text-surface-400 hover:text-surface-100">
                    Sitemaps ({result.sitemaps.length})
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
                    robots.txt body ({result.body.length} chars)
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
