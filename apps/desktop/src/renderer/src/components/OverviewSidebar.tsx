import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import {
  ISSUE_GROUPS,
  issueCount,
  type OverviewCounts,
  type UrlCategory,
} from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';
import { translateLabel } from '../i18n/labels.js';

interface Node {
  key: string;
  label: string;
  category?: UrlCategory;
  count?: number;
  /** Denominator for this node's "% of Total". Defaults to the tree-wide
   *  total (internal URLs). Nodes whose count isn't internal-scoped override
   *  it: image nodes use the total image count (so an image ÷ page ratio is
   *  never bogus), and Response Codes / Security use internal+external (they
   *  count external URLs, so an internal-only base would exceed 100%). */
  percentBase?: number;
  children?: Node[];
}

export function OverviewSidebar() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const overview = useAppStore((s) => s.overview);
  const setOverview = useAppStore((s) => s.setOverview);
  const dataVersion = useAppStore((s) => s.dataVersion);
  // Subscribe to scalar fields of `progress` rather than the whole
  // object. Zustand re-renders this component only when these specific
  // values change — so the 5/s progress events that don't move the
  // crawled count (the in-flight pending fluctuates every poll) no
  // longer trigger a full sidebar re-render.
  const progressRunning = useAppStore((s) => s.progress?.running ?? false);
  const progressCrawled = useAppStore((s) => s.progress?.crawled ?? 0);
  const activeCategory = useAppStore((s) => s.activeCategory);
  const navigateToCategory = useAppStore((s) => s.navigateToCategory);
  // Monotonic guard shared by the polling effect and the progress-driven
  // refetch — both call overviewGet(), and on the multi-worker reader
  // pool a slower response can resolve after a fresher one. Applying
  // results strictly in issue order stops a stale count overwriting a
  // newer one.
  const overviewSeqRef = useRef(0);
  const overviewAppliedRef = useRef(0);
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set([
      'summary',
      'crawl-data',
      'response-codes',
      'security',
      'indexability',
      'issues',
      'issues-title',
      'issues-meta',
      'issues-h1',
      'issues-content',
      'issues-response',
      'issues-images',
      'issues-links',
    ]),
  );

  // Background polling. Independent of `progress.crawled` so a busy
  // crawl that fires progress events twice per second doesn't restart
  // the interval (and re-fire `load()` immediately) on every tick.
  // Dependency is `dataVersion` only — bumped from elsewhere when a
  // user-initiated mutation needs an immediate refresh.
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const load = async () => {
      // Coalesce overlapping calls — getOverviewCounts is an aggregate
      // SQL pass over 70+ issue WHERE clauses; on a 1M-URL DB it can
      // run ~200–500 ms and main-process IPC handlers run serially, so
      // overlapping calls just queue up and starve other IPCs.
      if (inFlight) return;
      inFlight = true;
      const seq = ++overviewSeqRef.current;
      try {
        const o = await window.freecrawl.overviewGet();
        if (!cancelled && seq > overviewAppliedRef.current) {
          overviewAppliedRef.current = seq;
          setOverview(o);
        }
      } catch {
        // Heavy aggregates no longer fall back to the main thread when
        // the reader worker is down — the call rejects instead. Keep
        // the previous counts; the next poll tick retries against the
        // respawned worker.
      } finally {
        inFlight = false;
      }
    };
    // Wrap in requestIdleCallback so the 70+ issue-counter aggregate
    // only fires when the renderer's event loop is idle. The tick still
    // runs at 3 s cadence (the interval itself), but each individual
    // tick yields to user input — the difference between "click → 200
    // ms freeze" and "click → instant" while crawl is running.
    interface RequestIdleCallback {
      (cb: () => void, opts?: { timeout: number }): number;
    }
    const w = window as Window & { requestIdleCallback?: RequestIdleCallback };
    const scheduleLoad = (): void => {
      if (typeof w.requestIdleCallback === 'function') {
        w.requestIdleCallback(() => void load(), { timeout: 4000 });
      } else {
        void load();
      }
    };
    scheduleLoad();
    // I-4 — Crawl-aware cadence. While the crawler is running we want
    // sub-5-second freshness so the sidebar feels live; idle (no
    // crawl, viewing existing project data) we slow to 30 s because
    // the data isn't changing and burning a 130-counter aggregate
    // every 3 s for nothing wastes battery and disk on laptops.
    // The crawler's `progress` event also bumps `progress.crawled`
    // which triggers a separate progress-driven refetch below, so
    // this interval is just a safety net.
    const intervalMs = progressRunning ? 3000 : 30_000;
    const id = setInterval(scheduleLoad, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [dataVersion, setOverview, progressRunning]);

  // Progress-driven refetch. When the crawler reports a meaningful
  // change (every 50 URLs crawled) we trigger an immediate sidebar
  // refresh — push semantics on top of the polling safety-net above.
  // `lastRefetchAt` ref prevents the same crawled-bucket from firing
  // twice if React re-renders for an unrelated reason.
  const lastRefetchAtRef = useRef(0);
  useEffect(() => {
    if (!progressRunning) return;
    const bucket = Math.floor(progressCrawled / 50);
    if (bucket === lastRefetchAtRef.current) return;
    lastRefetchAtRef.current = bucket;
    const seq = ++overviewSeqRef.current;
    void window.freecrawl
      .overviewGet()
      .then((o) => {
        if (seq > overviewAppliedRef.current) {
          overviewAppliedRef.current = seq;
          setOverview(o);
        }
      })
      .catch(() => {
        // Reader worker down — keep previous counts, retry next bucket.
      });
  }, [progressCrawled, progressRunning, setOverview]);

  const toggle = (k: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  // The tree itself only depends on `overview`. Memoising it skips the
  // 150-node object construction on every progress-driven render.
  const disabledIssues = useAppStore((s) => s.config.disabledIssues);
  const disabledSet = useMemo(() => new Set<string>(disabledIssues ?? []), [disabledIssues]);
  const tree = useMemo(() => buildTree(overview, disabledSet), [overview, disabledSet]);
  const totalForPercent = overview?.summary.totalInternalUrls ?? 0;

  return (
    <div className="flex h-full flex-col bg-surface-900">
      <div className="flex items-center border-b border-surface-800 bg-surface-850 px-2 py-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-surface-400">
          {t('sidebar.overview', { defaultValue: 'Overview' })}
        </div>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-surface-500">
          <span>{t('sidebar.urls', { defaultValue: 'URLs' })}</span>
          <span>{t('sidebar.percentOfTotal', { defaultValue: '% of Total' })}</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="py-1 text-[11px]">
          {tree.map((node) => (
            <TreeNode
              key={node.key}
              node={node}
              depth={0}
              expanded={expanded}
              toggle={toggle}
              activeCategory={activeCategory}
              onClick={navigateToCategory}
              total={totalForPercent}
              lang={lang}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const TreeNode = memo(function TreeNode({
  node,
  depth,
  expanded,
  toggle,
  activeCategory,
  onClick,
  total,
  lang,
}: {
  node: Node;
  depth: number;
  expanded: Set<string>;
  toggle: (k: string) => void;
  activeCategory: UrlCategory;
  onClick: (c: UrlCategory) => void;
  total: number;
  lang: string;
}) {
  const isExpanded = expanded.has(node.key);
  const isActive = node.category && node.category === activeCategory;
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <>
      <div
        className={clsx(
          'group flex cursor-pointer items-center gap-1 px-2 py-1 hover:bg-surface-800',
          isActive && 'bg-accent-500/20 text-surface-50',
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={() => {
          if (hasChildren) toggle(node.key);
          if (node.category) onClick(node.category);
        }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-surface-500" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-surface-500" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span className="min-w-0 flex-1 truncate text-surface-200">{translateLabel(node.label, lang)}</span>
        {node.count !== undefined && (
          <>
            <span className="font-mono tabular-nums text-surface-300">
              {node.count.toLocaleString()}
            </span>
            <span className="w-14 text-right font-mono tabular-nums text-surface-500">
              {(() => {
                const base = node.percentBase ?? total;
                return base > 0 ? ((node.count / base) * 100).toFixed(2) + '%' : '—';
              })()}
            </span>
          </>
        )}
      </div>
      {isExpanded &&
        node.children?.map((child) => (
          <TreeNode
            key={child.key}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            toggle={toggle}
            activeCategory={activeCategory}
            onClick={onClick}
            total={total}
            lang={lang}
          />
        ))}
    </>
  );
});

function buildTree(o: OverviewCounts | null, disabled: ReadonlySet<string>): Node[] {
  if (!o) return [];
  // Response Codes and Security deliberately count external URLs too (that's
  // how a broken outbound link surfaces), so their numerators exceed the
  // internal-only URL count. Their "% of Total" must therefore divide by the
  // full crawled set (internal + external), not `totalInternalUrls` — else
  // "All 6,657 / 6,555 = 109.30%" reads as a broken crawl. Every other group
  // is internal-scoped and keeps the default (internal) base.
  const allUrls = o.summary.totalInternalUrls + o.summary.totalExternalUrls;
  return [
    {
      key: 'summary',
      label: 'Summary',
      children: [
        {
          key: 'summary-internal',
          label: 'Total Internal URLs',
          count: o.summary.totalInternalUrls,
          category: 'internal:all',
        },
        {
          key: 'summary-indexable',
          label: 'Internal Indexable',
          count: o.summary.totalIndexable,
          category: 'indexability:indexable',
        },
        {
          key: 'summary-nonindexable',
          label: 'Internal Non-Indexable',
          count: o.summary.totalNonIndexable,
          category: 'indexability:non-indexable',
        },
      ],
    },
    {
      key: 'crawl-data',
      label: 'Crawl Data',
      children: [
        {
          key: 'internal',
          label: 'Internal',
          count: o.internal['all'],
          category: 'internal:all',
          children: [
            { key: 'int-html', label: 'HTML', count: o.internal['html'], category: 'internal:html' },
            { key: 'int-js', label: 'JavaScript', count: o.internal['js'], category: 'internal:js' },
            { key: 'int-css', label: 'CSS', count: o.internal['css'], category: 'internal:css' },
            {
              key: 'int-image',
              label: 'Images',
              count: o.internal['image'],
              category: 'internal:image',
            },
            { key: 'int-pdf', label: 'PDF', count: o.internal['pdf'], category: 'internal:pdf' },
            { key: 'int-font', label: 'Fonts', count: o.internal['font'], category: 'internal:font' },
            {
              key: 'int-other',
              label: 'Other',
              count: o.internal['other'],
              category: 'internal:other',
            },
          ],
        },
      ],
    },
    {
      key: 'response-codes',
      label: 'Response Codes',
      children: [
        { key: 'rc-all', label: 'All', count: o.responseCodes.all, category: 'all', percentBase: allUrls },
        {
          key: 'rc-blocked',
          label: 'Blocked by Robots',
          count: o.responseCodes.blockedRobots,
          category: 'status:blocked-robots',
          percentBase: allUrls,
        },
        {
          key: 'rc-none',
          label: 'No Response',
          count: o.responseCodes.noResponse,
          category: 'status:no-response',
          percentBase: allUrls,
        },
        { key: 'rc-2xx', label: 'Success (2xx)', count: o.responseCodes.success2xx, category: 'status:2xx', percentBase: allUrls },
        {
          key: 'rc-3xx',
          label: 'Redirection (3xx)',
          count: o.responseCodes.redirect3xx,
          category: 'status:3xx',
          percentBase: allUrls,
        },
        {
          key: 'rc-4xx',
          label: 'Client Error (4xx)',
          count: o.responseCodes.clientError4xx,
          category: 'status:4xx',
          percentBase: allUrls,
        },
        {
          key: 'rc-5xx',
          label: 'Server Error (5xx)',
          count: o.responseCodes.serverError5xx,
          category: 'status:5xx',
          percentBase: allUrls,
        },
      ],
    },
    {
      key: 'security',
      label: 'Security',
      children: [
        {
          key: 'sec-https',
          label: 'HTTPS URLs',
          count: o.security.https,
          category: 'security:https',
          percentBase: allUrls,
        },
        {
          key: 'sec-http',
          label: 'HTTP URLs',
          count: o.security.http,
          category: 'security:http',
          percentBase: allUrls,
        },
      ],
    },
    {
      key: 'indexability',
      label: 'Indexability',
      children: [
        {
          key: 'ix-indexable',
          label: 'Indexable',
          count: o.indexability.indexable,
          category: 'indexability:indexable',
        },
        {
          key: 'ix-noindex',
          label: 'Noindex',
          count: o.indexability.noindex,
          category: 'indexability:noindex',
        },
        {
          key: 'ix-canonical',
          label: 'Canonicalised',
          count: o.indexability.canonicalised,
          category: 'indexability:canonicalised',
        },
        {
          key: 'ix-blocked',
          label: 'Blocked by Robots',
          count: o.indexability.blockedRobots,
          category: 'indexability:blocked-robots',
        },
      ],
    },
    {
      key: 'issues',
      label: 'Issues',
      // Generated from the shared issue catalog so the sidebar, the
      // Settings → Issues toggles and the database silence list can never
      // disagree about which checks exist. Disabled checks drop out of the
      // tree; a group with nothing left drops out with them.
      children: ISSUE_GROUPS.map((g) => ({
        key: g.key,
        label: g.label,
        children: g.items
          .filter((i) => !disabled.has(i.category))
          .map((i) => ({
            key: i.key,
            label: i.label,
            count: issueCount(o.issues, i),
            category: i.category,
            ...(i.percentBase === 'images' ? { percentBase: o.summary.totalImages } : {}),
          })),
      })).filter((g) => g.children.length > 0),
    },
  ];
}
