import { useEffect, useMemo, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { CrawlUrlRow, ExportTabularSection, UrlCategory } from '@freecrawl/shared-types';
import { TAB_ORDER, type TabKey } from '../store.js';
import { COLUMN_SPECS, columnId } from '../tabs/columns.js';
import { translateLabel } from '../i18n/labels.js';

type Format = 'csv' | 'xlsx';

interface ExportTab {
  key: TabKey;
  label: string;
  category: UrlCategory;
  columnKeys: (keyof CrawlUrlRow)[];
}

const TAB_CATEGORY: Record<TabKey, UrlCategory> = {
  internal: 'internal:html',
  external: 'external:all',
  'response-codes': 'all',
  url: 'internal:html',
  'page-titles': 'internal:html',
  'meta-description': 'internal:html',
  h1: 'internal:html',
  h2: 'internal:html',
  content: 'internal:html',
  images: 'internal:html',
  canonicals: 'internal:html',
  directives: 'internal:html',
  redirects: 'all',
  pagination: 'tab:pagination',
  hreflang: 'tab:hreflang',
  amp: 'tab:amp',
  'structured-data': 'tab:structured-data',
  'meta-refresh': 'tab:meta-refresh',
  'custom-extraction': 'tab:custom-extraction',
  'custom-search': 'tab:custom-search',
  security: 'tab:security',
  duplicates: 'tab:duplicates',
  links: 'all',
  'broken-links': 'all',
  serp: 'tab:serp',
  pagespeed: 'all',
  visualization: 'all',
};

function buildExportableTabs(): ExportTab[] {
  const out: ExportTab[] = [];
  for (const t of TAB_ORDER) {
    const cols = COLUMN_SPECS[t.key];
    // Tabs with their own non-URL-row layouts (Images / Broken Links)
    // have empty COLUMN_SPECS — skip them so the export grid only shows
    // categories that share the URL-row schema.
    if (!cols || cols.length === 0) continue;
    out.push({
      key: t.key,
      label: t.label,
      category: TAB_CATEGORY[t.key],
      columnKeys: cols.map((c) => c.key),
    });
  }
  return out;
}

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  /** The tab the user clicked Export from — drives the default selection. */
  defaultTab: TabKey;
  /** Row ids selected in the current table; falsy → export the whole filter set. */
  selectedIds?: number[];
}

export function ExportDialog({
  open,
  onClose,
  defaultTab,
  selectedIds,
}: ExportDialogProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const tabs = useMemo(() => buildExportableTabs(), []);
  const initialTabKey: TabKey = useMemo(() => {
    return tabs.find((t) => t.key === defaultTab)?.key ?? tabs[0]?.key ?? 'internal';
  }, [defaultTab, tabs]);

  const selectionCount = selectedIds?.length ?? 0;

  const [format, setFormat] = useState<Format>('csv');
  const [pickedTabs, setPickedTabs] = useState<Set<TabKey>>(() => new Set([initialTabKey]));
  const [pickedColumns, setPickedColumns] = useState<Set<string>>(() => {
    const t = tabs.find((x) => x.key === initialTabKey);
    return new Set((t?.columnKeys ?? []) as string[]);
  });
  const [useSelection, setUseSelection] = useState<boolean>(selectionCount > 0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>('');

  // The dialog is conditionally mounted by the parent (only when open=true),
  // so useState initializers above already populate the right defaults on
  // each open. Escape key dismissal is the only ambient behaviour we need.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Union of column keys exposed by every picked tab — these are the
  // columns the dialog offers; checked state lives in `pickedColumns`.
  const offeredColumns = useMemo(() => {
    const seen = new Set<string>();
    const out: { key: string; header: string; tab: TabKey }[] = [];
    for (const t of tabs) {
      if (!pickedTabs.has(t.key)) continue;
      const specs = COLUMN_SPECS[t.key];
      for (const spec of specs) {
        const id = columnId(spec);
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({ key: spec.key as string, header: spec.header, tab: t.key });
      }
    }
    return out;
  }, [pickedTabs, tabs]);

  const orderedColumnList = useMemo(
    () => offeredColumns.filter((c) => pickedColumns.has(c.key)).map((c) => c.key),
    [offeredColumns, pickedColumns],
  );

  if (!open) return null;

  const toggleTab = (key: TabKey) => {
    setPickedTabs((prev) => {
      const next = new Set(prev);
      let willBeRemoved = false;
      if (next.has(key)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(key);
        willBeRemoved = true;
      } else {
        next.add(key);
      }
      // Auto-tick the new tab's columns when it joins the picked set, so
      // the user doesn't have to re-check them. When a tab leaves we keep
      // the user's column picks alone — orderedColumnList already drops
      // any column not offered by remaining tabs.
      if (!willBeRemoved) {
        const t = tabs.find((x) => x.key === key);
        if (t) {
          setPickedColumns((prevCols) => {
            const nextCols = new Set(prevCols);
            for (const k of t.columnKeys) nextCols.add(k as string);
            return nextCols;
          });
        }
      }
      return next;
    });
  };

  const toggleColumn = (key: string) => {
    setPickedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const checkAllColumns = () => {
    setPickedColumns(new Set(offeredColumns.map((c) => c.key)));
  };

  const uncheckAllColumns = () => {
    setPickedColumns(new Set());
  };

  const submit = async () => {
    if (orderedColumnList.length === 0) {
      setStatus(t('export.errorNoColumn', { defaultValue: 'Pick at least one column.' }));
      return;
    }
    if (pickedTabs.size === 0) {
      setStatus(t('export.errorNoTable', { defaultValue: 'Pick at least one table.' }));
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const sections: ExportTabularSection[] = tabs
        .filter((tab) => pickedTabs.has(tab.key))
        .map((tab) => ({ label: tab.label, category: tab.category }));
      const result = await window.freecrawl.exportTabular({
        format,
        sections,
        columns: orderedColumnList,
        selectedIds:
          useSelection && selectedIds && selectedIds.length > 0
            ? selectedIds
            : undefined,
      });
      if (!result.filePath) {
        // User cancelled save / folder dialog.
        setBusy(false);
        return;
      }
      setStatus(
        t('export.successMsg', {
          defaultValue: 'Exported {{count}} row(s) to {{path}}',
          count: result.rowsWritten.toLocaleString(),
          path: result.filePath,
        }),
      );
      setBusy(false);
      setTimeout(() => onClose(), 700);
    } catch (err) {
      setBusy(false);
      setStatus(t('export.failedPrefix', { defaultValue: 'Export failed' }) + ': ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-[780px] max-w-[95vw] flex-col rounded-md border border-surface-700 bg-surface-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-surface-800 px-4 py-2.5">
          <div className="text-sm font-semibold text-surface-100">{t('export.title', { defaultValue: 'Export' })}</div>
          <button
            className="rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
            onClick={onClose}
            title={t('common.close', { defaultValue: 'Close' })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-4 py-3">
          <div className="grid grid-cols-2 gap-4">
            <section>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-surface-400">
                {t('export.tables', { defaultValue: 'Tables' })}
              </div>
              <div className="rounded border border-surface-800 bg-surface-950/50 p-2">
                <div className="grid grid-cols-1 gap-1">
                  {tabs.map((tab) => {
                    const checked = pickedTabs.has(tab.key);
                    const isDefault = tab.key === initialTabKey;
                    return (
                      <label
                        key={tab.key}
                        className={clsx(
                          'flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[12px]',
                          checked
                            ? 'bg-accent-500/10 text-surface-100'
                            : 'text-surface-300 hover:bg-surface-800/60',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5"
                          checked={checked}
                          onChange={() => toggleTab(tab.key)}
                        />
                        <span className="truncate">{translateLabel(tab.label, lang)}</span>
                        {isDefault && (
                          <span className="ml-auto rounded bg-surface-800 px-1 text-[9px] uppercase tracking-wide text-surface-400">
                            {t('export.active', { defaultValue: 'Active' })}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="flex min-h-0 flex-col">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-surface-400">
                  {t('urlsTab.columns', { defaultValue: 'Columns' })}
                </div>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    className="rounded border border-surface-700 px-1.5 py-0.5 text-surface-300 hover:bg-surface-800"
                    onClick={checkAllColumns}
                  >
                    {t('export.all', { defaultValue: 'All' })}
                  </button>
                  <button
                    type="button"
                    className="rounded border border-surface-700 px-1.5 py-0.5 text-surface-300 hover:bg-surface-800"
                    onClick={uncheckAllColumns}
                  >
                    {t('export.none', { defaultValue: 'None' })}
                  </button>
                </div>
              </div>
              <div className="max-h-[320px] overflow-auto rounded border border-surface-800 bg-surface-950/50 p-2">
                <div className="grid grid-cols-1 gap-1">
                  {offeredColumns.map((c) => {
                    const checked = pickedColumns.has(c.key);
                    return (
                      <label
                        key={c.key}
                        className={clsx(
                          'flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[12px]',
                          checked
                            ? 'bg-accent-500/10 text-surface-100'
                            : 'text-surface-300 hover:bg-surface-800/60',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5"
                          checked={checked}
                          onChange={() => toggleColumn(c.key)}
                        />
                        <span className="truncate">{translateLabel(c.header, lang)}</span>
                        <span className="ml-auto truncate font-mono text-[10px] text-surface-500">
                          {c.key}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-surface-400">
                {t('export.format', { defaultValue: 'Format' })}
              </span>
              <label className="flex cursor-pointer items-center gap-1 text-[12px] text-surface-200">
                <input
                  type="radio"
                  name="export-format"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                />
                CSV
              </label>
              <label className="flex cursor-pointer items-center gap-1 text-[12px] text-surface-200">
                <input
                  type="radio"
                  name="export-format"
                  checked={format === 'xlsx'}
                  onChange={() => setFormat('xlsx')}
                />
                Excel (.xlsx)
              </label>
            </div>

            {selectionCount > 0 && (
              <label className="flex cursor-pointer items-center gap-2 text-[12px] text-surface-200">
                <input
                  type="checkbox"
                  checked={useSelection}
                  onChange={(e) => setUseSelection(e.target.checked)}
                />
                <span>
                  {t('export.selectedOnly', { defaultValue: 'Selected rows only' })}{' '}
                  <span className="text-surface-500">
                    ({selectionCount.toLocaleString()})
                  </span>
                </span>
              </label>
            )}
          </div>

          {format === 'csv' && pickedTabs.size > 1 && (
            <div className="mt-2 rounded border border-amber-700/40 bg-amber-900/20 px-2 py-1 text-[11px] text-amber-200">
              {t('export.multiCsvNote', { defaultValue: 'Multiple tables + CSV → you\'ll be asked to pick a folder; one file is written per table.' })}
            </div>
          )}

          {status && (
            <div className="mt-3 truncate rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[11px] text-surface-200">
              {status}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-surface-800 px-4 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-surface-700 px-3 py-1 text-[12px] text-surface-300 hover:bg-surface-800"
            disabled={busy}
          >
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || pickedColumns.size === 0 || pickedTabs.size === 0}
            className={clsx(
              'inline-flex items-center gap-1 rounded border border-surface-700 px-3 py-1 text-[12px] text-surface-200 hover:bg-surface-800',
              (busy || pickedColumns.size === 0 || pickedTabs.size === 0) &&
                'cursor-not-allowed opacity-50 hover:bg-transparent',
            )}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('export.title', { defaultValue: 'Export' })}
          </button>
        </div>
      </div>
    </div>
  );
}
