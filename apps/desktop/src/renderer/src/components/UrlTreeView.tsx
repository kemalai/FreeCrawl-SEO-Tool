import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronRight, ChevronDown, FolderTree, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { CrawlUrlRow, UrlCategory, AdvancedFilter } from '@freecrawl/shared-types';

const ROW_HEIGHT = 24;
const TREE_LIMIT = 5000;
const INDENT_PX = 14;

/** One node in the URL tree — either a synthesized folder (path
 *  segment with one or more descendants) or a leaf row from the DB. */
type TreeNode =
  | { kind: 'folder'; key: string; label: string; depth: number; count: number; children: TreeNode[] }
  | { kind: 'leaf'; key: string; depth: number; row: CrawlUrlRow };

interface FlatRow {
  node: TreeNode;
  depth: number;
}

function splitPathSegments(rawUrl: string): { origin: string; segments: string[] } {
  try {
    const u = new URL(rawUrl);
    const origin = `${u.protocol}//${u.host}`;
    const path = u.pathname.replace(/^\//, '').replace(/\/$/, '');
    const segments = path ? path.split('/') : [];
    const suffix = (u.search ?? '') + (u.hash ?? '');
    if (suffix) {
      // Append the query/hash to the last path segment so `?a=1` and
      // `?a=2` show up as distinct leaves. For root URLs (no path
      // segments yet) synthesize the suffix itself as the leaf — `/?a=1`.
      if (segments.length > 0) {
        segments[segments.length - 1] = segments[segments.length - 1] + suffix;
      } else {
        segments.push(suffix);
      }
    }
    return { origin, segments };
  } catch {
    return { origin: rawUrl, segments: [] };
  }
}

/** Group URLs into a hierarchy keyed by origin → path segments. The
 *  resulting tree is sorted alphabetically at every level so siblings
 *  appear in a natural file-tree order. */
function buildTree(rows: CrawlUrlRow[]): TreeNode[] {
  interface Builder {
    folders: Map<string, Builder>;
    leaves: { row: CrawlUrlRow; key: string }[];
  }
  const roots = new Map<string, Builder>();
  for (const row of rows) {
    const { origin, segments } = splitPathSegments(row.url);
    let bucket = roots.get(origin);
    if (!bucket) {
      bucket = { folders: new Map(), leaves: [] };
      roots.set(origin, bucket);
    }
    if (segments.length === 0) {
      bucket.leaves.push({ row, key: `${origin}|root|${row.id}` });
      continue;
    }
    let cur = bucket;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i]!;
      let child = cur.folders.get(seg);
      if (!child) {
        child = { folders: new Map(), leaves: [] };
        cur.folders.set(seg, child);
      }
      cur = child;
    }
    cur.leaves.push({
      row,
      key: `${origin}|${segments.join('/')}|${row.id}`,
    });
  }
  // Walk the Builders into TreeNode objects with stable keys.
  function materialise(
    builder: Builder,
    pathPrefix: string,
    depth: number,
  ): { children: TreeNode[]; count: number } {
    let total = 0;
    const out: TreeNode[] = [];
    const folderEntries = [...builder.folders.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );
    for (const [name, sub] of folderEntries) {
      const subPath = pathPrefix ? `${pathPrefix}/${name}` : name;
      const inner = materialise(sub, subPath, depth + 1);
      total += inner.count;
      out.push({
        kind: 'folder',
        key: `f:${subPath}`,
        label: name,
        depth,
        count: inner.count,
        children: inner.children,
      });
    }
    const leaves = [...builder.leaves].sort((a, b) => a.row.url.localeCompare(b.row.url));
    for (const leaf of leaves) {
      out.push({ kind: 'leaf', key: `l:${leaf.row.id}`, depth, row: leaf.row });
      total += 1;
    }
    return { children: out, count: total };
  }
  const result: TreeNode[] = [];
  const originEntries = [...roots.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [origin, bucket] of originEntries) {
    const inner = materialise(bucket, '', 1);
    result.push({
      kind: 'folder',
      key: `o:${origin}`,
      label: origin,
      depth: 0,
      count: inner.count,
      children: inner.children,
    });
  }
  return result;
}

function flatten(nodes: TreeNode[], expanded: Set<string>, acc: FlatRow[]): void {
  for (const node of nodes) {
    acc.push({ node, depth: node.depth });
    if (node.kind === 'folder' && expanded.has(node.key)) {
      flatten(node.children, expanded, acc);
    }
  }
}

interface UrlTreeViewProps {
  category: UrlCategory;
  search: string;
  filter: AdvancedFilter | null;
  refreshKey: number;
  /** Currently selected URL id — drives highlighting. */
  selectedUrlId: number | null;
  onSelect: (id: number | null) => void;
}

export function UrlTreeView({
  category,
  search,
  filter,
  refreshKey,
  selectedUrlId,
  onSelect,
}: UrlTreeViewProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<CrawlUrlRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void window.freecrawl
      .urlsQuery({
        limit: TREE_LIMIT,
        offset: 0,
        category,
        search: search || undefined,
        filter: filter ?? undefined,
        sortBy: 'url',
        sortDir: 'asc',
      })
      .then((res) => {
        if (cancelled) return;
        setRows(res.rows);
        setTotal(res.total);
        // Default-expand the origin folders so the user sees something
        // immediately; deeper folders stay collapsed until clicked.
        const origins = new Set<string>();
        for (const r of res.rows) {
          try {
            const u = new URL(r.url);
            origins.add(`o:${u.protocol}//${u.host}`);
          } catch {
            /* skip malformed */
          }
        }
        setExpanded(origins);
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, search, filter, refreshKey]);

  const tree = useMemo(() => buildTree(rows), [rows]);
  const flat = useMemo(() => {
    const out: FlatRow[] = [];
    flatten(tree, expanded, out);
    return out;
  }, [tree, expanded]);

  const virtualizer = useVirtualizer({
    count: flat.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 30,
    getItemKey: (i) => flat[i]?.node.key ?? `idx-${i}`,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const truncated = total > TREE_LIMIT;

  function toggleFolder(key: string): void {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function expandAll(): void {
    const all = new Set<string>();
    function walk(nodes: TreeNode[]): void {
      for (const n of nodes) {
        if (n.kind === 'folder') {
          all.add(n.key);
          walk(n.children);
        }
      }
    }
    walk(tree);
    setExpanded(all);
  }

  function collapseAll(): void {
    setExpanded(new Set());
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-surface-800 bg-surface-900/30 px-3 py-1 text-[11px] text-surface-400">
        <FolderTree className="h-3.5 w-3.5" />
        <span>
          {t('urlsTab.treeStatus', {
            defaultValue: 'Tree view · {{rows}} URL · {{folders}} folder',
            rows: rows.length.toLocaleString(),
            folders: countFolders(tree).toLocaleString(),
          })}
        </span>
        {truncated && (
          <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
            {t('urlsTab.treeTruncated', {
              defaultValue: 'truncated to first {{cap}}',
              cap: TREE_LIMIT.toLocaleString(),
            })}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={expandAll}
            className="rounded border border-surface-700 px-2 py-0.5 text-[10px] text-surface-300 hover:bg-surface-800"
          >
            {t('urlsTab.expandAll', { defaultValue: 'Expand all' })}
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded border border-surface-700 px-2 py-0.5 text-[10px] text-surface-300 hover:bg-surface-800"
          >
            {t('urlsTab.collapseAll', { defaultValue: 'Collapse all' })}
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto bg-surface-950 font-mono">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-[12px] text-surface-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('urlsTab.treeLoading', { defaultValue: 'Loading URL tree…' })}
          </div>
        ) : flat.length === 0 ? (
          <div className="px-3 py-8 text-center text-[12px] text-surface-500">
            {t('urlsTab.treeEmpty', {
              defaultValue: 'No URLs to display — crawl a site or change the filter.',
            })}
          </div>
        ) : (
          <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
            {virtualRows.map((vi) => {
              const item = flat[vi.index]!;
              const isSelected =
                item.node.kind === 'leaf' && item.node.row.id === selectedUrlId;
              const isFolder = item.node.kind === 'folder';
              const expandedNow = isFolder && expanded.has(item.node.key);
              return (
                <div
                  key={vi.key}
                  data-index={vi.index}
                  className={clsx(
                    'absolute left-0 top-0 flex w-full items-center gap-1 border-b border-surface-900/60 pr-3 text-[11px] transition',
                    isSelected
                      ? 'bg-accent-500/15 text-surface-100'
                      : isFolder
                        ? 'text-surface-200 hover:bg-surface-900/40'
                        : 'text-surface-300 hover:bg-surface-900/40',
                  )}
                  style={{
                    transform: `translateY(${vi.start}px)`,
                    height: ROW_HEIGHT,
                    paddingLeft: 8 + item.depth * INDENT_PX,
                  }}
                  onClick={() => {
                    if (item.node.kind === 'folder') {
                      toggleFolder(item.node.key);
                    } else {
                      onSelect(item.node.row.id);
                    }
                  }}
                >
                  {isFolder ? (
                    <span className="text-surface-500">
                      {expandedNow ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </span>
                  ) : (
                    <span className="inline-block h-3.5 w-3.5" />
                  )}
                  {isFolder ? (
                    <>
                      <span className="truncate font-semibold">
                        {(item.node as { label: string }).label || '/'}
                      </span>
                      <span className="text-surface-500">
                        ({(item.node as { count: number }).count.toLocaleString()})
                      </span>
                    </>
                  ) : (
                    <LeafRow row={(item.node as { row: CrawlUrlRow }).row} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function countFolders(nodes: TreeNode[]): number {
  let n = 0;
  for (const node of nodes) {
    if (node.kind === 'folder') {
      n++;
      n += countFolders(node.children);
    }
  }
  return n;
}

function LeafRow({ row }: { row: CrawlUrlRow }) {
  const status = row.statusCode ?? 0;
  const statusClass =
    status >= 500
      ? 'bg-red-900/50 text-red-200'
      : status >= 400
        ? 'bg-orange-900/50 text-orange-200'
        : status >= 300
          ? 'bg-amber-900/40 text-amber-200'
          : status >= 200
            ? 'bg-emerald-900/40 text-emerald-200'
            : 'bg-surface-800 text-surface-400';
  const title = row.title ?? '';
  const { segments } = splitPathSegments(row.url);
  const last = segments[segments.length - 1] ?? '/';
  return (
    <>
      <span className="truncate" title={row.url}>
        {last}
      </span>
      {status > 0 && (
        <span
          className={clsx(
            'ml-2 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase',
            statusClass,
          )}
        >
          {status}
        </span>
      )}
      {title && (
        <span className="ml-2 truncate text-surface-500" title={title}>
          · {title}
        </span>
      )}
    </>
  );
}
