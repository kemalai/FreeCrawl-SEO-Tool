import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, ChevronRight, Layers, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { DuplicateClusterRow } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

const HEADER_ROW_HEIGHT = 32;
const MEMBER_ROW_HEIGHT = 24;
const PAGE_SIZE = 5000;
/** Soft upper-bound on rows fetched in a single load. A cluster member
 *  row is < 200 B in renderer-side memory, so 50k keeps the worst-case
 *  payload around ~10 MB and the scroll grid responsive. Crawls that
 *  exceed this cap will lose the long tail of the smallest clusters —
 *  the largest, most actionable ones (sorted DESC by cluster size at
 *  the DB layer) are always retained. */
const MAX_ROWS = 50_000;

/** One row in the virtualized list. Cluster headers sit above their
 *  members; collapsing a header hides its members but keeps the header
 *  visible so the user can see how many clusters exist at a glance. */
type Item =
  | {
      kind: 'header';
      clusterId: number;
      clusterSize: number;
      memberCount: number;
      repUrl: string;
      maxHamming: number;
    }
  | { kind: 'member'; clusterId: number; row: DuplicateClusterRow };

export function DuplicatesGroupedView() {
  const { t } = useTranslation();
  const selectedUrlId = useAppStore((s) => s.selectedUrlId);
  const setSelectedUrlId = useAppStore((s) => s.setSelectedUrlId);
  const setSelectedUrlIds = useAppStore((s) => s.setSelectedUrlIds);
  const dataVersion = useAppStore((s) => s.dataVersion);

  const [rows, setRows] = useState<DuplicateClusterRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const count = await window.freecrawl.duplicateClustersCount();
        if (cancelled) return;
        setTotal(count);

        const cap = Math.min(count, MAX_ROWS);
        const all: DuplicateClusterRow[] = [];
        for (let off = 0; off < cap; off += PAGE_SIZE) {
          const page = await window.freecrawl.duplicateClustersList({
            offset: off,
            limit: Math.min(PAGE_SIZE, cap - off),
          });
          if (cancelled) return;
          all.push(...page);
          if (page.length < PAGE_SIZE) break;
        }
        if (!cancelled) {
          setRows(all);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setRows([]);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dataVersion]);

  /** Flatten paginated cluster rows into a [header, ...members]+ stream.
   *  Rows are pre-sorted by the DB query (cluster_size DESC, cluster_id
   *  ASC, url ASC), so a single pass detects cluster boundaries.
   *  Collapsed clusters keep their header and drop their members.
   *  Header carries derived stats — representative URL (alphabetically
   *  first) and the max Hamming distance present in the cluster, which
   *  is a quick "how tight is this cluster" signal. */
  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];
    let i = 0;
    while (i < rows.length) {
      const head = rows[i]!;
      const cid = head.clusterId;
      let j = i;
      let repUrl = head.url;
      let maxHamming = 0;
      while (j < rows.length && rows[j]!.clusterId === cid) {
        const m = rows[j]!;
        if (m.url < repUrl) repUrl = m.url;
        if (m.hammingFromRep > maxHamming) maxHamming = m.hammingFromRep;
        j++;
      }
      list.push({
        kind: 'header',
        clusterId: cid,
        clusterSize: head.clusterSize,
        memberCount: j - i,
        repUrl,
        maxHamming,
      });
      if (!collapsed.has(cid)) {
        for (let k = i; k < j; k++) {
          list.push({ kind: 'member', clusterId: cid, row: rows[k]! });
        }
      }
      i = j;
    }
    return list;
  }, [rows, collapsed]);

  /** Header rows are taller than members. Estimate accordingly so
   *  virtual scrolling reserves space correctly without measuring. */
  const estimateSize = (idx: number): number => {
    const it = items[idx];
    if (!it) return MEMBER_ROW_HEIGHT;
    return it.kind === 'header' ? HEADER_ROW_HEIGHT : MEMBER_ROW_HEIGHT;
  };

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize,
    overscan: 25,
    getItemKey: (idx) => {
      const it = items[idx];
      if (!it) return `idx-${idx}`;
      return it.kind === 'header'
        ? `h-${it.clusterId}`
        : `m-${it.row.urlId}`;
    },
  });

  const clusterCount = items.reduce((n, it) => (it.kind === 'header' ? n + 1 : n), 0);

  const toggleCluster = (cid: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cid)) next.delete(cid);
      else next.add(cid);
      return next;
    });
  };

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => {
    const next = new Set<number>();
    for (const it of items) if (it.kind === 'header') next.add(it.clusterId);
    setCollapsed(next);
  };

  const handleMemberClick = (row: DuplicateClusterRow) => {
    setSelectedUrlId(row.urlId);
    setSelectedUrlIds([row.urlId]);
  };

  if (loading && rows.length === 0) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-xs text-surface-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {t('duplicates.loadingClusters', { defaultValue: 'Loading near-duplicate clusters…' })}
      </div>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 text-center text-xs text-surface-500">
        <Layers className="h-6 w-6 text-surface-700" />
        <div className="max-w-md">
          <div className="mb-1 text-sm font-semibold text-surface-300">
            {t('duplicates.noClustersTitle', { defaultValue: 'No near-duplicate clusters' })}
          </div>
          <div>
            {t('duplicates.noClustersHint', {
              defaultValue:
                'Run a crawl and let post-crawl analysis finish — clusters appear once two or more pages share enough content to fall under the SimHash Hamming threshold (Settings → Duplicates).',
            })}
          </div>
        </div>
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-surface-800 bg-surface-900/40 px-3 py-1.5 text-[11px] text-surface-400">
        <span className="inline-flex items-center gap-1.5 text-surface-300">
          <Layers className="h-3.5 w-3.5" />
          {t('duplicates.statusClusters', {
            defaultValue: '{{clusters}} cluster · {{members}} pages',
            clusters: clusterCount.toLocaleString(),
            members: rows.length.toLocaleString(),
          })}
        </span>
        {total > rows.length && (
          <span className="text-amber-400">
            {t('duplicates.truncated', {
              defaultValue: 'truncated to first {{cap}} rows',
              cap: MAX_ROWS.toLocaleString(),
            })}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={expandAll}
            className="rounded border border-surface-700 px-1.5 py-0.5 text-[10px] text-surface-300 hover:bg-surface-800"
          >
            {t('urlsTab.expandAll', { defaultValue: 'Expand all' })}
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded border border-surface-700 px-1.5 py-0.5 text-[10px] text-surface-300 hover:bg-surface-800"
          >
            {t('urlsTab.collapseAll', { defaultValue: 'Collapse all' })}
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="relative flex-1 select-none overflow-auto">
        <div
          className="relative"
          style={{ height: virtualizer.getTotalSize(), minWidth: '100%' }}
        >
          {virtualItems.map((vi) => {
            const it = items[vi.index];
            if (!it) return null;
            if (it.kind === 'header') {
              const isCollapsed = collapsed.has(it.clusterId);
              return (
                <div
                  key={vi.key}
                  data-index={vi.index}
                  className={clsx(
                    'absolute left-0 top-0 flex w-full cursor-pointer items-center gap-2 border-b border-surface-800 bg-surface-900/80 px-3 text-[11px] font-semibold text-surface-100 hover:bg-surface-800/80',
                  )}
                  style={{
                    transform: `translateY(${vi.start}px)`,
                    height: HEADER_ROW_HEIGHT,
                  }}
                  onClick={() => toggleCluster(it.clusterId)}
                  title={t('duplicates.toggleClusterTitle', {
                    defaultValue: 'Click to expand/collapse this cluster',
                  })}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-surface-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-surface-400" />
                  )}
                  <span className="font-mono tabular-nums text-accent-300">
                    #{it.clusterId}
                  </span>
                  <span className="text-surface-400">·</span>
                  <span className="text-surface-200">
                    {t('duplicates.headerSize', {
                      defaultValue: '{{n}} pages',
                      n: it.memberCount,
                    })}
                  </span>
                  <span className="text-surface-400">·</span>
                  <span
                    className="truncate text-surface-300"
                    title={it.repUrl}
                  >
                    {it.repUrl}
                  </span>
                  <span className="ml-auto shrink-0 rounded bg-surface-800 px-1.5 py-0.5 font-mono text-[10px] text-surface-300">
                    {t('duplicates.maxHamming', {
                      defaultValue: 'max Δ {{n}} bits',
                      n: it.maxHamming,
                    })}
                  </span>
                </div>
              );
            }
            const row = it.row;
            const isSelected = selectedUrlId === row.urlId;
            return (
              <div
                key={vi.key}
                data-index={vi.index}
                className={clsx(
                  'absolute left-0 top-0 flex w-full cursor-pointer items-center gap-2 border-b border-surface-900 pl-8 pr-3 text-[11px]',
                  isSelected
                    ? 'bg-accent-500/20 text-surface-50'
                    : 'text-surface-300 hover:bg-surface-900/40',
                )}
                style={{
                  transform: `translateY(${vi.start}px)`,
                  height: MEMBER_ROW_HEIGHT,
                }}
                onClick={() => handleMemberClick(row)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  void window.freecrawl.urlContextMenu({
                    url: row.url,
                    urlId: row.urlId,
                  });
                }}
                title={row.url}
              >
                <span
                  className={clsx(
                    'inline-block w-12 shrink-0 rounded px-1 text-center font-mono text-[10px]',
                    statusClasses(row.statusCode),
                  )}
                >
                  {row.statusCode ?? '—'}
                </span>
                <span
                  className={clsx(
                    'inline-block w-20 shrink-0 truncate',
                    row.indexability === 'indexable'
                      ? 'text-emerald-400'
                      : 'text-amber-400',
                  )}
                  title={row.indexability}
                >
                  {row.indexability === 'indexable' ? 'Indexable' : 'Non-Indexable'}
                </span>
                <span className="flex-1 truncate font-mono text-surface-200">
                  {row.url}
                </span>
                <span className="w-44 shrink-0 truncate text-surface-400" title={row.title ?? ''}>
                  {row.title ?? <span className="text-surface-700">—</span>}
                </span>
                <span className="w-14 shrink-0 text-right font-mono tabular-nums text-surface-300">
                  {row.wordCount === null ? '—' : row.wordCount.toLocaleString()}
                </span>
                <span className="w-14 shrink-0 text-right font-mono tabular-nums text-surface-300">
                  {row.inlinks.toLocaleString()}
                </span>
                <span
                  className={clsx(
                    'w-14 shrink-0 text-right font-mono tabular-nums',
                    row.hammingFromRep === 0
                      ? 'text-emerald-400'
                      : row.hammingFromRep <= 3
                        ? 'text-amber-300'
                        : 'text-orange-300',
                  )}
                  title={t('duplicates.hammingFromRepTitle', {
                    defaultValue:
                      'SimHash Hamming distance from the cluster representative — 0 means the rep itself, higher = further from the rep',
                  })}
                >
                  Δ{row.hammingFromRep}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function statusClasses(code: number | null): string {
  if (code === null) return 'bg-surface-800 text-surface-400';
  if (code >= 200 && code < 300) return 'bg-emerald-900/60 text-emerald-300';
  if (code >= 300 && code < 400) return 'bg-amber-900/60 text-amber-300';
  if (code >= 400 && code < 500) return 'bg-orange-900/60 text-orange-300';
  if (code >= 500) return 'bg-red-900/60 text-red-300';
  return 'bg-surface-800 text-surface-400';
}
