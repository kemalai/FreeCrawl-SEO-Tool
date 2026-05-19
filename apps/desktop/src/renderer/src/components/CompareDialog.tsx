import { useEffect, useState } from 'react';
import { X, FolderOpen, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type {
  CompareCategory,
  CompareDiffRow,
  CompareLoadResult,
} from '@freecrawl/shared-types';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface CategoryDef {
  key: CompareCategory;
  labelKey: string;
  fallback: string;
}

const CATEGORIES: CategoryDef[] = [
  { key: 'added', labelKey: 'compare.added', fallback: 'Added' },
  { key: 'removed', labelKey: 'compare.removed', fallback: 'Removed' },
  { key: 'status', labelKey: 'compare.statusChanged', fallback: 'Status Changed' },
  { key: 'title', labelKey: 'compare.titleChanged', fallback: 'Title Changed' },
  { key: 'meta', labelKey: 'compare.metaChanged', fallback: 'Meta Description Changed' },
  { key: 'h1', labelKey: 'compare.h1Changed', fallback: 'H1 Changed' },
  { key: 'canonical', labelKey: 'compare.canonicalChanged', fallback: 'Canonical Changed' },
  { key: 'indexability', labelKey: 'compare.indexabilityChanged', fallback: 'Indexability Changed' },
  { key: 'response_time', labelKey: 'compare.responseTimeDelta', fallback: 'Response Time Δ' },
];

export function CompareDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const [result, setResult] = useState<CompareLoadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<CompareCategory>('added');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Auto-trigger the file picker the first time the dialog opens — this
  // is a "Compare With Project…" affordance, the user already
  // committed to picking a file when they clicked the menu item.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setResult(null);
    void pick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function pick() {
    setLoading(true);
    setError(null);
    try {
      const r = await window.freecrawl.compareLoad({});
      if (!r.filePath) {
        // User cancelled the file dialog.
        onClose();
        return;
      }
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const sample =
    result?.samples.filter((r: CompareDiffRow) => r.category === active) ?? [];

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] max-h-[760px] w-[1080px] max-w-[95vw] flex-col overflow-hidden rounded-md border border-surface-700 bg-surface-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-surface-800 px-4 py-2.5">
          <div className="text-sm font-semibold tracking-wide text-surface-100">
            {t('compare.title', { defaultValue: 'Compare Crawls' })}
          </div>
          {result && (
            <div className="ml-3 truncate text-[11px] text-surface-400">
              <span className="text-surface-500">{t('compare.aCurrent', { defaultValue: 'A (current)' })}</span>{' '}
              {result.totalA.toLocaleString()} {t('compare.urlsUnit', { defaultValue: 'URLs' })} ·{' '}
              <span className="text-surface-500">B</span>{' '}
              {result.totalB.toLocaleString()} {t('compare.urlsUnit', { defaultValue: 'URLs' })} · {result.filePath}
            </div>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              className="flex items-center gap-1 rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-200 hover:border-blue-500 hover:bg-surface-800"
              onClick={pick}
              disabled={loading}
              title={t('compare.pickDifferent', { defaultValue: 'Pick a different project file' })}
            >
              {loading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <FolderOpen className="h-3 w-3" />
              )}
              {loading ? t('compare.comparing', { defaultValue: 'Comparing…' }) : t('compare.openOther', { defaultValue: 'Open Other Project' })}
            </button>
            <button
              className="rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
              onClick={onClose}
              title={t('scheduled.closeEsc', { defaultValue: 'Close (Esc)' })}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="border-b border-red-900 bg-red-950/40 px-4 py-2 text-[11px] text-red-300">
            {error}
          </div>
        )}

        {!result && !error && !loading && (
          <div className="flex flex-1 items-center justify-center text-[12px] text-surface-500">
            {t('compare.pickPrompt', { defaultValue: 'Pick a `.seoproject` file to diff against the current crawl.' })}
          </div>
        )}

        {result && (
          <div className="flex flex-1 min-h-0">
            <aside className="flex w-56 flex-col border-r border-surface-800 bg-surface-950/40">
              <nav className="flex-1 overflow-auto py-1">
                {CATEGORIES.map((c) => {
                  const count = result.counts[c.key] ?? 0;
                  const isActive = c.key === active;
                  return (
                    <button
                      key={c.key}
                      className={clsx(
                        'flex w-full items-center justify-between px-3 py-1.5 text-left text-[12px] transition-colors',
                        isActive
                          ? 'bg-accent-600/20 text-accent-200 border-l-2 border-accent-500'
                          : 'border-l-2 border-transparent text-surface-300 hover:bg-surface-800 hover:text-surface-100',
                        count === 0 && 'opacity-50',
                      )}
                      onClick={() => setActive(c.key)}
                    >
                      <span>{t(c.labelKey, { defaultValue: c.fallback })}</span>
                      <span className="font-mono text-[10px] text-surface-400">
                        {count.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="flex flex-1 flex-col min-w-0">
              <div className="border-b border-surface-800 px-4 py-2 text-[11px] text-surface-400">
                {t('compare.entriesShown', {
                  defaultValue: '{{shown}} of {{total}} entries shown',
                  shown: sample.length.toLocaleString(),
                  total: (result.counts[active] ?? 0).toLocaleString(),
                })}
                {result.counts[active] > sample.length && (
                  <span className="ml-1 text-surface-500">
                    {t('compare.truncated', { defaultValue: '(truncated — export CSV for the full set)' })}
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-surface-900">
                    <tr className="text-surface-400">
                      <th className="w-1/2 py-1.5 px-3 text-left font-medium">{t('compare.urlHeader', { defaultValue: 'URL' })}</th>
                      <th className="w-1/4 py-1.5 px-3 text-left font-medium">{t('compare.beforeHeader', { defaultValue: 'Before' })}</th>
                      <th className="w-1/4 py-1.5 px-3 text-left font-medium">{t('compare.afterHeader', { defaultValue: 'After' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sample.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-3 py-3 text-center text-[11px] italic text-surface-500"
                        >
                          {t('compare.noDiffs', { defaultValue: 'No diffs in this category.' })}
                        </td>
                      </tr>
                    )}
                    {sample.map((r: CompareDiffRow, i: number) => (
                      <tr
                        key={`${r.url}-${i}`}
                        className="border-b border-surface-900/60 hover:bg-surface-800/40"
                      >
                        <td className="py-1 px-3 font-mono text-[11px] text-surface-100">
                          {r.url}
                        </td>
                        <td className="py-1 px-3 font-mono text-[11px] text-red-300">
                          {r.before === null ? (
                            <span className="text-surface-700">—</span>
                          ) : (
                            r.before
                          )}
                        </td>
                        <td className="py-1 px-3 font-mono text-[11px] text-emerald-300">
                          {r.after === null ? (
                            <span className="text-surface-700">—</span>
                          ) : (
                            r.after
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
