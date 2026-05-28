import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { CrawlUrlRow, ExportTabularSection, UrlCategory } from '@freecrawl/shared-types';
import { TAB_ORDER, type TabKey } from '../store.js';
import { COLUMN_SPECS, columnId } from '../tabs/columns.js';
import { translateLabel } from '../i18n/labels.js';

type Format = 'csv' | 'xlsx' | 'json' | 'xml';

interface SubCategory {
  /** Child label shown beneath the parent (translated via labels.ts). */
  label: string;
  category: UrlCategory;
  /** Filename stem written under the parent's subdir. */
  filename: string;
}

interface ExportNode {
  /** Unique key within the tree. */
  key: string;
  /** TabKey for column-spec lookup. */
  tabKey: TabKey;
  /** Top-level label. */
  label: string;
  /** Folder name when this node has children; '' when no nesting. */
  subdir: string;
  /** Default category when the parent itself is exported (no children selected). */
  category: UrlCategory;
  /** Optional structural sub-categories. Empty array = leaf node. */
  children: SubCategory[];
}

/**
 * Structural sub-categories per tab. These mirror the OverviewSidebar's
 * Crawl Data + Response Codes + Security + Indexability groupings — the
 * "issue filter" pages under Overview are intentionally excluded.
 */
const TAB_CHILDREN: Partial<Record<TabKey, { subdir: string; children: SubCategory[] }>> = {
  internal: {
    subdir: 'internal',
    children: [
      { label: 'All', category: 'internal:all', filename: 'all' },
      { label: 'HTML', category: 'internal:html', filename: 'html' },
      { label: 'JavaScript', category: 'internal:js', filename: 'javascript' },
      { label: 'CSS', category: 'internal:css', filename: 'css' },
      { label: 'Images', category: 'internal:image', filename: 'images' },
      { label: 'PDF', category: 'internal:pdf', filename: 'pdf' },
      { label: 'Fonts', category: 'internal:font', filename: 'fonts' },
      { label: 'Other', category: 'internal:other', filename: 'other' },
    ],
  },
  external: {
    subdir: 'external',
    children: [
      { label: 'All', category: 'external:all', filename: 'all' },
      { label: 'HTML', category: 'external:html', filename: 'html' },
      { label: 'Other', category: 'external:other', filename: 'other' },
    ],
  },
  'response-codes': {
    subdir: 'response-codes',
    children: [
      { label: 'All', category: 'all', filename: 'all' },
      { label: 'Blocked by Robots', category: 'status:blocked-robots', filename: 'blocked-robots' },
      { label: 'No Response', category: 'status:no-response', filename: 'no-response' },
      { label: 'Success (2xx)', category: 'status:2xx', filename: '2xx-success' },
      { label: 'Redirection (3xx)', category: 'status:3xx', filename: '3xx-redirect' },
      { label: 'Client Error (4xx)', category: 'status:4xx', filename: '4xx-client-error' },
      { label: 'Server Error (5xx)', category: 'status:5xx', filename: '5xx-server-error' },
    ],
  },
  security: {
    subdir: 'security',
    children: [
      { label: 'HTTPS URLs', category: 'security:https', filename: 'https' },
      { label: 'HTTP URLs', category: 'security:http', filename: 'http' },
    ],
  },
  directives: {
    subdir: 'indexability',
    children: [
      { label: 'Indexable', category: 'indexability:indexable', filename: 'indexable' },
      { label: 'Non-Indexable', category: 'indexability:non-indexable', filename: 'non-indexable' },
      { label: 'Noindex', category: 'indexability:noindex', filename: 'noindex' },
      { label: 'Canonicalised', category: 'indexability:canonicalised', filename: 'canonicalised' },
      { label: 'Blocked by Robots', category: 'indexability:blocked-robots', filename: 'blocked-robots' },
    ],
  },
};

/** Tabs that aren't exportable via the URL-row schema (Images / Broken
 *  Links use their own per-tab CSV exporter; Visualization is a graph). */
const SKIPPED_TABS = new Set<TabKey>(['images', 'broken-links']);

/** Default category for top-level tabs that don't have structural
 *  sub-categories. Issues / filter content is intentionally NOT broken
 *  out — the user explicitly asked to exclude Overview issue filters. */
const TAB_CATEGORY: Partial<Record<TabKey, UrlCategory>> = {
  url: 'internal:html',
  'page-titles': 'internal:html',
  'meta-description': 'internal:html',
  h1: 'internal:html',
  h2: 'internal:html',
  content: 'internal:html',
  canonicals: 'internal:html',
  redirects: 'all',
  pagination: 'tab:pagination',
  hreflang: 'tab:hreflang',
  amp: 'tab:amp',
  'structured-data': 'tab:structured-data',
  'meta-refresh': 'tab:meta-refresh',
  'custom-extraction': 'tab:custom-extraction',
  'custom-search': 'tab:custom-search',
  duplicates: 'tab:duplicates',
  links: 'all',
  serp: 'tab:serp',
  pagespeed: 'all',
  'search-console': 'all',
  analytics: 'all',
  ai: 'all',
  seo: 'all',
};

function buildTree(): ExportNode[] {
  const out: ExportNode[] = [];
  for (const t of TAB_ORDER) {
    if (SKIPPED_TABS.has(t.key)) continue;
    const cols = COLUMN_SPECS[t.key];
    if (!cols || cols.length === 0) continue;
    const sub = TAB_CHILDREN[t.key];
    out.push({
      key: t.key,
      tabKey: t.key,
      label: t.label,
      subdir: sub ? sub.subdir : '',
      category: sub ? sub.children[0]!.category : TAB_CATEGORY[t.key] ?? 'internal:html',
      children: sub ? sub.children : [],
    });
  }
  return out;
}

/** Stable leaf identifier for the "what's checked" set — parents with
 *  children are not selectable directly; their `<tabKey>:<filename>`
 *  child IDs are. Childless tabs use `<tabKey>` as their own leaf id. */
function leafId(node: ExportNode, child?: SubCategory): string {
  return child ? `${node.key}:${child.filename}` : node.key;
}

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  /** The tab the user clicked Export from — drives the default selection
   *  when invoked from a per-tab button. When opened from the File menu
   *  this is just used to bias the "Active" tag and starting checkbox. */
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
  const tree = useMemo(() => buildTree(), []);
  const initialTabKey: TabKey = useMemo(() => {
    return tree.find((n) => n.tabKey === defaultTab)?.tabKey ?? tree[0]?.tabKey ?? 'internal';
  }, [defaultTab, tree]);

  const selectionCount = selectedIds?.length ?? 0;

  const [format, setFormat] = useState<Format>('xlsx');
  const [csvBom, setCsvBom] = useState<boolean>(true);

  // Picked leaves — childless tabs use the tab key, child rows use
  // `<tabKey>:<filename>`. Defaults to the active tab's first leaf so
  // the dialog always has something to export.
  const [pickedLeaves, setPickedLeaves] = useState<Set<string>>(() => {
    const node = tree.find((n) => n.tabKey === initialTabKey);
    if (!node) return new Set();
    if (node.children.length === 0) return new Set([leafId(node)]);
    return new Set([leafId(node, node.children[0])]);
  });

  // Expanded parent rows in the tree — closed nodes still let their
  // leaves be exported (the user just doesn't see them). Defaults to
  // the active tab being open.
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const node = tree.find((n) => n.tabKey === initialTabKey);
    return new Set(node && node.children.length > 0 ? [node.key] : []);
  });

  const [pickedColumns, setPickedColumns] = useState<Set<string>>(() => {
    const node = tree.find((n) => n.tabKey === initialTabKey);
    const specs = node ? COLUMN_SPECS[node.tabKey] : [];
    return new Set(specs.map((s) => s.key as string));
  });
  const [useSelection, setUseSelection] = useState<boolean>(selectionCount > 0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /** Tabs whose leaves currently have at least one pick — drives the
   *  column picker (union of selected tabs' columns). */
  const pickedTabKeys = useMemo(() => {
    const set = new Set<TabKey>();
    for (const node of tree) {
      if (node.children.length === 0) {
        if (pickedLeaves.has(leafId(node))) set.add(node.tabKey);
      } else {
        for (const child of node.children) {
          if (pickedLeaves.has(leafId(node, child))) {
            set.add(node.tabKey);
            break;
          }
        }
      }
    }
    return set;
  }, [pickedLeaves, tree]);

  const offeredColumns = useMemo(() => {
    const seen = new Set<string>();
    const out: { key: string; header: string; tab: TabKey }[] = [];
    for (const node of tree) {
      if (!pickedTabKeys.has(node.tabKey)) continue;
      const specs = COLUMN_SPECS[node.tabKey];
      for (const spec of specs) {
        const id = columnId(spec);
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({ key: spec.key as string, header: spec.header, tab: node.tabKey });
      }
    }
    return out;
  }, [pickedTabKeys, tree]);

  const orderedColumnList = useMemo(
    () => offeredColumns.filter((c) => pickedColumns.has(c.key)).map((c) => c.key),
    [offeredColumns, pickedColumns],
  );

  if (!open) return null;

  const totalLeafSelections = pickedLeaves.size;

  function parentState(node: ExportNode): 'all' | 'some' | 'none' {
    if (node.children.length === 0) {
      return pickedLeaves.has(leafId(node)) ? 'all' : 'none';
    }
    let picked = 0;
    for (const child of node.children) {
      if (pickedLeaves.has(leafId(node, child))) picked++;
    }
    if (picked === 0) return 'none';
    if (picked === node.children.length) return 'all';
    return 'some';
  }

  const toggleParent = (node: ExportNode) => {
    const state = parentState(node);
    setPickedLeaves((prev) => {
      const next = new Set(prev);
      if (node.children.length === 0) {
        if (state === 'all') next.delete(leafId(node));
        else next.add(leafId(node));
        return next;
      }
      if (state === 'all') {
        for (const child of node.children) next.delete(leafId(node, child));
      } else {
        for (const child of node.children) next.add(leafId(node, child));
      }
      return next;
    });
    // Bug #12 — only auto-add the tab's columns the FIRST time it gains
    // any leaf. If the user previously hand-toggled columns off for this
    // tab, respect that decision across tab on/off cycles. We detect
    // "first time" by whether the user has any of this tab's columns
    // currently in pickedColumns.
    if (state !== 'all') {
      setPickedColumns((prev) => {
        const specs = COLUMN_SPECS[node.tabKey] ?? [];
        const hasAny = specs.some((spec) => prev.has(spec.key as string));
        if (hasAny) return prev;
        const next = new Set(prev);
        for (const spec of specs) next.add(spec.key as string);
        return next;
      });
    }
  };

  const toggleLeaf = (node: ExportNode, child: SubCategory) => {
    setPickedLeaves((prev) => {
      const next = new Set(prev);
      const id = leafId(node, child);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Bug #12 — same conditional auto-add as toggleParent.
    setPickedColumns((prev) => {
      const specs = COLUMN_SPECS[node.tabKey] ?? [];
      const hasAny = specs.some((spec) => prev.has(spec.key as string));
      if (hasAny) return prev;
      const next = new Set(prev);
      for (const spec of specs) next.add(spec.key as string);
      return next;
    });
  };

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const checkAllParents = () => {
    setPickedLeaves((prev) => {
      const next = new Set(prev);
      for (const node of tree) {
        if (node.children.length === 0) {
          next.add(leafId(node));
        } else {
          for (const child of node.children) next.add(leafId(node, child));
        }
      }
      return next;
    });
  };

  const uncheckAllParents = () => {
    setPickedLeaves(new Set());
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
    if (totalLeafSelections === 0) {
      setStatus(t('export.errorNoTable', { defaultValue: 'Pick at least one table.' }));
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const sections: ExportTabularSection[] = [];
      for (const node of tree) {
        if (node.children.length === 0) {
          if (pickedLeaves.has(leafId(node))) {
            sections.push({ label: node.label, category: node.category });
          }
          continue;
        }
        for (const child of node.children) {
          if (!pickedLeaves.has(leafId(node, child))) continue;
          sections.push({
            label: `${node.label} — ${child.label}`,
            category: child.category,
            subdir: node.subdir,
            filename: child.filename,
          });
        }
      }
      const result = await window.freecrawl.exportTabular({
        format,
        sections,
        columns: orderedColumnList,
        csvBom: format === 'csv' ? csvBom : undefined,
        selectedIds:
          useSelection && selectedIds && selectedIds.length > 0
            ? selectedIds
            : undefined,
      });
      if (!result.filePath) {
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
      setTimeout(() => onClose(), 900);
    } catch (err) {
      setBusy(false);
      setStatus(
        t('export.failedPrefix', { defaultValue: 'Export failed' }) +
          ': ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const showFolderHint = format !== 'xlsx' && (totalLeafSelections > 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-[860px] max-w-[95vw] flex-col rounded-md border border-surface-700 bg-surface-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-surface-800 px-4 py-2.5">
          <div className="text-sm font-semibold text-surface-100">
            {t('export.exportAsTitle', { defaultValue: 'Export As…' })}
          </div>
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
            <section className="flex min-h-0 flex-col">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-surface-400">
                  {t('export.tablesTree', { defaultValue: 'Tables (hierarchical)' })}
                </div>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    className="rounded border border-surface-700 px-1.5 py-0.5 text-surface-300 hover:bg-surface-800"
                    onClick={checkAllParents}
                  >
                    {t('export.all', { defaultValue: 'All' })}
                  </button>
                  <button
                    type="button"
                    className="rounded border border-surface-700 px-1.5 py-0.5 text-surface-300 hover:bg-surface-800"
                    onClick={uncheckAllParents}
                  >
                    {t('export.none', { defaultValue: 'None' })}
                  </button>
                </div>
              </div>
              <div className="max-h-[420px] overflow-auto rounded border border-surface-800 bg-surface-950/50 p-2">
                <div className="flex flex-col gap-0.5">
                  {tree.map((node) => {
                    const state = parentState(node);
                    const isOpen = expanded.has(node.key);
                    const hasChildren = node.children.length > 0;
                    const isActive = node.tabKey === initialTabKey;
                    return (
                      <div key={node.key}>
                        <div
                          className={clsx(
                            'flex items-center gap-1 rounded px-1.5 py-1 text-[12px]',
                            state !== 'none'
                              ? 'bg-accent-500/10 text-surface-100'
                              : 'text-surface-300 hover:bg-surface-800/60',
                          )}
                        >
                          {hasChildren ? (
                            <button
                              type="button"
                              className="rounded p-0.5 text-surface-500 hover:bg-surface-800 hover:text-surface-200"
                              onClick={() => toggleExpanded(node.key)}
                              title={isOpen ? 'Collapse' : 'Expand'}
                            >
                              {isOpen ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="inline-block h-3.5 w-3.5" />
                          )}
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5"
                            checked={state === 'all'}
                            ref={(el) => {
                              if (el) el.indeterminate = state === 'some';
                            }}
                            onChange={() => toggleParent(node)}
                          />
                          <span className="truncate">
                            {translateLabel(node.label, lang)}
                          </span>
                          {hasChildren && (
                            <span className="ml-1 rounded bg-surface-800 px-1 text-[9px] uppercase tracking-wide text-surface-500">
                              {node.children.length}
                            </span>
                          )}
                          {isActive && (
                            <span className="ml-auto rounded bg-surface-800 px-1 text-[9px] uppercase tracking-wide text-surface-400">
                              {t('export.active', { defaultValue: 'Active' })}
                            </span>
                          )}
                        </div>
                        {hasChildren && isOpen && (
                          <div className="ml-7 flex flex-col gap-0.5 border-l border-surface-800 pl-2">
                            {node.children.map((child) => {
                              const checked = pickedLeaves.has(leafId(node, child));
                              return (
                                <label
                                  key={child.filename}
                                  className={clsx(
                                    'flex cursor-pointer items-center gap-2 rounded px-1.5 py-0.5 text-[11.5px]',
                                    checked
                                      ? 'bg-accent-500/10 text-surface-100'
                                      : 'text-surface-300 hover:bg-surface-800/60',
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    className="h-3 w-3"
                                    checked={checked}
                                    onChange={() => toggleLeaf(node, child)}
                                  />
                                  <span className="truncate">
                                    {translateLabel(child.label, lang)}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
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
              <div className="max-h-[420px] overflow-auto rounded border border-surface-800 bg-surface-950/50 p-2">
                <div className="grid grid-cols-1 gap-1">
                  {offeredColumns.length === 0 ? (
                    <div className="px-2 py-4 text-center text-[11px] text-surface-500">
                      {t('export.emptyCols', {
                        defaultValue: 'Pick a table on the left to load its columns.',
                      })}
                    </div>
                  ) : (
                    offeredColumns.map((c) => {
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
                    })
                  )}
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
                  checked={format === 'xlsx'}
                  onChange={() => setFormat('xlsx')}
                />
                Excel (.xlsx)
              </label>
              <label className="flex cursor-pointer items-center gap-1 text-[12px] text-surface-200">
                <input
                  type="radio"
                  name="export-format"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                />
                CSV (UTF-8)
              </label>
              <label className="flex cursor-pointer items-center gap-1 text-[12px] text-surface-200">
                <input
                  type="radio"
                  name="export-format"
                  checked={format === 'json'}
                  onChange={() => setFormat('json')}
                />
                JSON
              </label>
              <label className="flex cursor-pointer items-center gap-1 text-[12px] text-surface-200">
                <input
                  type="radio"
                  name="export-format"
                  checked={format === 'xml'}
                  onChange={() => setFormat('xml')}
                />
                XML
              </label>
            </div>

            {format === 'csv' && (
              <label className="flex cursor-pointer items-center gap-1 text-[11.5px] text-surface-300">
                <input
                  type="checkbox"
                  checked={csvBom}
                  onChange={(e) => setCsvBom(e.target.checked)}
                />
                <span>
                  {t('export.csvBom', { defaultValue: 'UTF-8 BOM (Excel-friendly)' })}
                </span>
              </label>
            )}

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

          {showFolderHint && (
            <div className="mt-2 rounded border border-amber-700/40 bg-amber-900/20 px-2 py-1 text-[11px] text-amber-200">
              {t('export.folderNote', {
                defaultValue:
                  'Multiple sections + {{fmt}} → you\'ll be asked to pick a folder; one file is written per section, nested under sub-folders where applicable.',
                fmt: format.toUpperCase(),
              })}
            </div>
          )}

          {format === 'xlsx' && totalLeafSelections > 1 && (
            <div className="mt-2 rounded border border-blue-700/40 bg-blue-900/20 px-2 py-1 text-[11px] text-blue-200">
              {t('export.xlsxNote', {
                defaultValue:
                  'Excel output → single .xlsx workbook with one sheet per section.',
              })}
            </div>
          )}

          {status && (
            <div className="mt-3 truncate rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[11px] text-surface-200">
              {status}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-surface-800 px-4 py-2.5">
          <div className="text-[11px] text-surface-500">
            {t('export.summary', {
              defaultValue: '{{n}} section(s) · {{c}} column(s)',
              n: totalLeafSelections,
              c: orderedColumnList.length,
            })}
          </div>
          <div className="flex gap-2">
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
              disabled={busy || pickedColumns.size === 0 || totalLeafSelections === 0}
              className={clsx(
                'inline-flex items-center gap-1 rounded border border-blue-600 bg-blue-600/20 px-3 py-1 text-[12px] text-blue-100 hover:bg-blue-600/30',
                (busy || pickedColumns.size === 0 || totalLeafSelections === 0) &&
                  'cursor-not-allowed opacity-50 hover:bg-blue-600/20',
              )}
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('export.exportButton', { defaultValue: 'Export' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
