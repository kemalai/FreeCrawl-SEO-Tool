import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import { TabExportButton } from '../components/TabExportButton.js';
import { Loader2 } from 'lucide-react';
import type { SpellingProgress, SpellingRow } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

const TOOLBAR_HEIGHT = 36;
const HEADER_HEIGHT = 26;
const STATUS_BAR_HEIGHT = 22;
const ROW_HEIGHT = 28;
const PAGE_SIZE = 2000;
const POLL_MS_RUNNING = 5000;
/** The public LanguageTool API allows ~20 requests/min — warn past this. */
const CONFIRM_THRESHOLD = 20;

type FilterMode = 'all' | 'checked' | 'unchecked' | 'errors' | 'unsupported';

/** Colour the match count by severity. */
function countClass(n: number | null): string {
  if (n === null) return 'text-surface-700';
  if (n === 0) return 'text-emerald-400';
  if (n <= 5) return 'text-amber-400';
  return 'text-red-400';
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const min = Math.floor((Date.now() - then) / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function SpellingTab() {
  const { t } = useTranslation();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const crawlProgress = useAppStore((s) => s.progress);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  const [rows, setRows] = useState<SpellingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<SpellingProgress | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    const res = await window.freecrawl.spellingQuery({
      limit: PAGE_SIZE,
      offset: 0,
      search: search || undefined,
      filter,
    });
    setRows(res.rows);
    setTotal(res.total);
  }, [search, filter]);

  useEffect(() => {
    let cancelled = false;
    void reload();
    if (!crawlProgress?.running) return;
    const id = setInterval(() => {
      if (!cancelled) void reload();
    }, POLL_MS_RUNNING);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [reload, dataVersion, crawlProgress?.running]);

  useEffect(() => {
    const off = window.freecrawl.onSpellingProgress((p) => {
      setProgress(p.running ? p : null);
      if (!p.currentUrl) void reload();
    });
    return off;
  }, [reload]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 16,
    getItemKey: (index) => rows[index]?.url ?? `idx-${index}`,
  });

  const allLoadedSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.url));

  const toggleRow = useCallback((url: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (rows.length > 0 && rows.every((r) => prev.has(r.url))) {
        return new Set();
      }
      return new Set(rows.map((r) => r.url));
    });
  }, [rows]);

  const selectUnchecked = useCallback(() => {
    setSelected(new Set(rows.filter((r) => r.status === null).map((r) => r.url)));
  }, [rows]);

  const runCheck = useCallback(async () => {
    const urls = [...selected];
    if (urls.length === 0 || running) return;
    if (
      urls.length > CONFIRM_THRESHOLD &&
      !window.confirm(
        t('spellingTab.confirmRun', {
          defaultValue:
            'This will check {{count}} pages with LanguageTool. The free public API is rate-limited (~20 requests/min), so this may take a while. Continue?',
          count: urls.length,
        }),
      )
    ) {
      return;
    }
    setRunning(true);
    setProgress({ done: 0, total: urls.length, currentUrl: null, running: true });
    try {
      await window.freecrawl.spellingRun({ urls });
    } finally {
      setRunning(false);
      setProgress(null);
      void reload();
    }
  }, [selected, running, t, reload]);

  const cancelRun = useCallback(() => {
    void window.freecrawl.spellingCancel();
  }, []);

  const checkedCount = useMemo(
    () => rows.filter((r) => r.status === 'ok').length,
    [rows],
  );
  const withErrors = useMemo(
    () => rows.filter((r) => r.status === 'ok' && (r.matchCount ?? 0) > 0).length,
    [rows],
  );
  const unsupportedCount = useMemo(
    () => rows.filter((r) => r.status === 'unsupported').length,
    [rows],
  );
  /**
   * The languages that came back unsupported, for the banner. Every
   * unsupported row carries the language it was detected as, so a Turkish
   * site names Turkish rather than leaving the user to guess why an entire
   * crawl produced no findings.
   */
  const unsupportedLangs = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.status === 'unsupported') {
        set.add(r.detectedLanguage ?? r.lang ?? '?');
      }
    }
    return [...set].sort();
  }, [rows]);

  return (
    <div className="flex h-full w-full flex-col bg-surface-950">
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 border-b border-surface-800 bg-surface-900/40 px-3"
        style={{ height: TOOLBAR_HEIGHT }}
      >
        <div className="text-[12px] font-semibold tracking-wide text-surface-100">
          {t('spellingTab.title', { defaultValue: 'Spelling & Grammar' })}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('spellingTab.filterPlaceholder', {
            defaultValue: 'Filter by URL…',
          })}
          className="h-6 w-56 rounded border border-surface-700 bg-surface-950 px-2 text-[11px] text-surface-100 placeholder-surface-500 focus:border-blue-500 focus:outline-none"
        />
        <select
          className="h-6 rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterMode)}
        >
          <option value="all">
            {t('spellingTab.filterAll', { defaultValue: 'All pages' })}
          </option>
          <option value="checked">
            {t('spellingTab.filterChecked', { defaultValue: 'Checked only' })}
          </option>
          <option value="unchecked">
            {t('spellingTab.filterUnchecked', { defaultValue: 'Unchecked only' })}
          </option>
          <option value="errors">
            {t('spellingTab.filterErrors', { defaultValue: 'With findings' })}
          </option>
          <option value="unsupported">
            {t('spellingTab.filterUnsupported', {
              defaultValue: 'Unsupported language',
            })}
          </option>
        </select>
        <button
          type="button"
          onClick={selectUnchecked}
          disabled={running || rows.length === 0}
          className="h-6 rounded border border-surface-700 bg-surface-800 px-2 text-[11px] text-surface-200 hover:bg-surface-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('spellingTab.selectUnchecked', { defaultValue: 'Select unchecked' })}
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true, { section: 'spelling' })}
          className="h-6 rounded border border-surface-700 bg-surface-800 px-2 text-[11px] text-surface-300 hover:bg-surface-700"
          title={t('spellingTab.optionsTitle', {
            defaultValue: 'Rule level and custom dictionary live in Settings → Spelling.',
          })}
        >
          {t('spellingTab.options', { defaultValue: 'Options…' })}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {running && progress ? (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-surface-300">
                <Loader2 size={12} className="animate-spin text-blue-400" />
                {t('spellingTab.runProgress', {
                  defaultValue: 'Checking {{done}} / {{total}}',
                  done: progress.done,
                  total: progress.total,
                })}
              </span>
              <button
                type="button"
                onClick={cancelRun}
                className="h-6 rounded border border-red-700 bg-red-900/40 px-2.5 text-[11px] font-medium text-red-200 hover:bg-red-900/70"
              >
                {t('spellingTab.cancel', { defaultValue: 'Cancel' })}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void runCheck()}
              disabled={selected.size === 0 || running}
              className="h-6 rounded bg-blue-600 px-3 text-[11px] font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-surface-700 disabled:text-surface-500"
            >
              {t('spellingTab.run', {
                defaultValue: 'Check Spelling ({{count}})',
                count: selected.size,
              })}
            </button>
          )}
          <TabExportButton tab="spelling" disabled={total === 0} />
        </div>
      </div>

      {/* LanguageTool ships rules for ~33 languages; Turkish, Hungarian,
          Czech, Finnish and many others are simply not among them. Saying
          so once, plainly, beats leaving the user to wonder why a whole
          crawl came back empty. */}
      {unsupportedCount > 0 && (
        <div className="shrink-0 border-b border-amber-900/60 bg-amber-950/40 px-3 py-1.5 text-[11px] text-amber-200">
          {t('spellingTab.unsupportedBanner', {
            defaultValue:
              '{{count}} page(s) left unchecked: LanguageTool has no rules for {{langs}}, and grading that text against a substitute language would report an error on nearly every word. Nothing here is misconfigured — no setting makes this engine check {{langs}}.',
            count: unsupportedCount,
            langs: unsupportedLangs.join(', '),
          })}
        </div>
      )}

      {/* Column header */}
      <div
        className="flex shrink-0 select-none items-center border-b border-surface-800 bg-surface-900/60 text-[10px] font-medium text-surface-400"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex w-[30px] items-center justify-center">
          <input
            type="checkbox"
            checked={allLoadedSelected}
            ref={(el) => {
              if (el) el.indeterminate = selected.size > 0 && !allLoadedSelected;
            }}
            onChange={toggleAll}
            disabled={rows.length === 0}
            className="h-3 w-3 accent-blue-500"
          />
        </div>
        <div className="flex-1 px-2">
          {t('spellingTab.colUrl', { defaultValue: 'URL' })}
        </div>
        <div className="w-[76px] shrink-0 text-center">
          {t('spellingTab.colLang', { defaultValue: 'Lang' })}
        </div>
        <div className="w-[76px] shrink-0 text-right">
          {t('spellingTab.colWords', { defaultValue: 'Words' })}
        </div>
        <div className="w-[80px] shrink-0 text-right">
          {t('spellingTab.colIssues', { defaultValue: 'Findings' })}
        </div>
        <div className="w-[78px] shrink-0 text-center">
          {t('spellingTab.colStatus', { defaultValue: 'Status' })}
        </div>
        <div className="w-[92px] shrink-0 px-2 text-right">
          {t('spellingTab.colChecked', { defaultValue: 'Checked' })}
        </div>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-[12px] text-surface-500">
            {total === 0
              ? t('spellingTab.emptyNoData', {
                  defaultValue:
                    'No internal HTML pages crawled yet — run a crawl, then select pages to check.',
                })
              : t('spellingTab.emptyNoMatch', {
                  defaultValue: 'No pages match the current filter.',
                })}
          </div>
        ) : (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((vRow) => {
              const row = rows[vRow.index];
              if (!row) return null;
              return (
                <div
                  key={vRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: ROW_HEIGHT,
                    transform: `translateY(${vRow.start}px)`,
                  }}
                >
                  <SpellingTableRow
                    row={row}
                    selected={selected.has(row.url)}
                    onToggle={() => toggleRow(row.url)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center gap-3 border-t border-surface-800 bg-surface-900/40 px-3 text-[11px] text-surface-400"
        style={{ height: STATUS_BAR_HEIGHT }}
      >
        <span>
          {t('spellingTab.summary', {
            defaultValue:
              '{{shown}} pages · {{checked}} checked · {{errors}} with findings · {{unsupported}} unsupported · {{selected}} selected',
            shown: rows.length.toLocaleString(),
            checked: checkedCount.toLocaleString(),
            errors: withErrors.toLocaleString(),
            unsupported: unsupportedCount.toLocaleString(),
            selected: selected.size.toLocaleString(),
          })}
          {total > rows.length &&
            ' ' +
              t('spellingTab.firstN', {
                defaultValue: '(first {{n}})',
                n: PAGE_SIZE.toLocaleString(),
              })}
        </span>
        {running && progress?.currentUrl && (
          <span className="truncate text-surface-500">
            {t('spellingTab.checking', {
              defaultValue: 'Checking: {{url}}',
              url: progress.currentUrl,
            })}
          </span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ row }: { row: SpellingRow }) {
  const { t } = useTranslation();
  if (row.status === null) {
    return <span className="text-surface-700">—</span>;
  }
  if (row.status === 'error') {
    return (
      <span
        className="cursor-help font-semibold text-red-400"
        title={row.error ?? 'Check failed'}
      >
        {t('spellingTab.statusError', { defaultValue: 'ERR' })}
      </span>
    );
  }
  // Neither of these is a failure — LanguageTool simply has no rules for
  // the page's language, or the check came back so noisy that the language
  // must have been wrong. Both are amber, not red, and both explain
  // themselves on hover.
  if (row.status === 'unsupported') {
    return (
      <span
        className="cursor-help text-amber-400"
        title={
          row.error ??
          t('spellingTab.statusUnsupportedTip', {
            defaultValue:
              'LanguageTool has no rules for this page’s language, so it was not checked.',
          })
        }
      >
        {t('spellingTab.statusUnsupported', { defaultValue: 'n/a' })}
      </span>
    );
  }
  if (row.status === 'mismatch') {
    return (
      <span
        className="cursor-help text-amber-400"
        title={
          row.error ??
          t('spellingTab.statusMismatchTip', {
            defaultValue:
              'The findings were discarded — the page does not read as the language it was checked in.',
          })
        }
      >
        {t('spellingTab.statusMismatch', { defaultValue: 'lang?' })}
      </span>
    );
  }
  if (row.status === 'skipped') {
    return (
      <span
        className="cursor-help text-surface-500"
        // A page can also be skipped for declaring no language and carrying
        // too little text to detect one — that reason is stored, so prefer
        // it over the generic tooltip.
        title={
          row.error ??
          t('spellingTab.statusSkippedTip', {
            defaultValue: 'Too little prose on the page to check.',
          })
        }
      >
        {t('spellingTab.statusSkipped', { defaultValue: 'skipped' })}
      </span>
    );
  }
  // Checked, but by the offline dictionary — spelling only. Marked so a
  // clean row is not read as "grammar checked and fine".
  if (row.engine === 'local') {
    return (
      <span
        className="cursor-help text-emerald-400"
        title={t('spellingTab.statusOkLocalTip', {
          defaultValue:
            'Checked with the offline dictionary: spelling only, no grammar. LanguageTool has no rules for this language.',
        })}
      >
        {t('spellingTab.statusOkLocal', { defaultValue: 'ok*' })}
      </span>
    );
  }
  return (
    <span className="text-emerald-400">
      {t('spellingTab.statusOk', { defaultValue: 'ok' })}
    </span>
  );
}

/**
 * Language cell — the code the check ran under, or the code detected from
 * the page's prose when it hasn't run. When the page's own `html[lang]`
 * disagrees with what the prose reads as, the cell is marked: that is a
 * genuine SEO defect (a stale `lang="en"` on a theme is common) and it is
 * also the reason the old auto-detected results were nonsense.
 */
function LangCell({ row }: { row: SpellingRow }) {
  const { t } = useTranslation();
  const used = row.language ?? row.detectedLanguage ?? row.lang ?? null;
  const declaredPrimary = row.lang?.split(/[-_]/)[0]?.toLowerCase() ?? null;
  const detected = row.detectedLanguage;
  const conflict =
    !!detected && !!declaredPrimary && detected !== declaredPrimary;

  return (
    <div
      className={`w-[76px] shrink-0 truncate text-center ${
        conflict ? 'cursor-help text-amber-400' : 'text-surface-400'
      }`}
      title={
        conflict
          ? t('spellingTab.langConflict', {
              defaultValue:
                'The page declares lang="{{declared}}" but its text reads as {{detected}}. The check used {{used}}.',
              declared: row.lang ?? '',
              detected,
              used: used ?? detected,
            })
          : undefined
      }
    >
      {used ?? '—'}
      {conflict && ' ⚠'}
    </div>
  );
}

function SpellingTableRow({
  row,
  selected,
  onToggle,
}: {
  row: SpellingRow;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`flex h-full cursor-pointer items-center text-[11px] ${
        selected
          ? 'bg-blue-900/30'
          : 'odd:bg-surface-900/20 hover:bg-surface-800/40'
      }`}
    >
      <div className="flex w-[30px] items-center justify-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="h-3 w-3 accent-blue-500"
        />
      </div>
      <div className="flex-1 truncate px-2 text-surface-200" title={row.url}>
        {row.url}
      </div>
      <LangCell row={row} />
      <div className="w-[76px] shrink-0 text-right tabular-nums text-surface-400">
        {row.wordCount?.toLocaleString() ?? '—'}
      </div>
      <div
        className={`w-[80px] shrink-0 text-right font-mono tabular-nums ${
          row.status === 'ok' ? countClass(row.matchCount) : 'text-surface-700'
        }`}
      >
        {/* A count is only meaningful when the page was actually checked —
            an unsupported or mismatched page has zero findings because none
            were collected, not because the copy is clean. */}
        {row.status === 'ok' ? (row.matchCount?.toLocaleString() ?? '—') : '—'}
      </div>
      <div className="w-[78px] shrink-0 text-center">
        <StatusBadge row={row} />
      </div>
      <div className="w-[92px] shrink-0 truncate px-2 text-right text-surface-500">
        {relativeTime(row.fetchedAt)}
      </div>
    </div>
  );
}
