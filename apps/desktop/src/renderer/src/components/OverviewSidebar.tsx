import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { OverviewCounts, UrlCategory } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

interface Node {
  key: string;
  label: string;
  category?: UrlCategory;
  count?: number;
  children?: Node[];
}

export function OverviewSidebar() {
  const overview = useAppStore((s) => s.overview);
  const setOverview = useAppStore((s) => s.setOverview);
  const progress = useAppStore((s) => s.progress);
  const dataVersion = useAppStore((s) => s.dataVersion);
  const activeCategory = useAppStore((s) => s.activeCategory);
  const navigateToCategory = useAppStore((s) => s.navigateToCategory);
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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const o = await window.freecrawl.overviewGet();
      if (!cancelled) setOverview(o);
    };
    void load();
    const id = setInterval(load, 1500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [progress?.crawled, dataVersion, setOverview]);

  const toggle = (k: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const tree = buildTree(overview);
  const totalForPercent = overview?.summary.totalInternalUrls ?? 0;

  return (
    <div className="flex h-full flex-col bg-surface-900">
      <div className="flex items-center border-b border-surface-800 bg-surface-850 px-2 py-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-surface-400">
          Overview
        </div>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-surface-500">
          <span>URLs</span>
          <span>% of Total</span>
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  expanded,
  toggle,
  activeCategory,
  onClick,
  total,
}: {
  node: Node;
  depth: number;
  expanded: Set<string>;
  toggle: (k: string) => void;
  activeCategory: UrlCategory;
  onClick: (c: UrlCategory) => void;
  total: number;
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
        <span className="min-w-0 flex-1 truncate text-surface-200">{node.label}</span>
        {node.count !== undefined && (
          <>
            <span className="font-mono tabular-nums text-surface-300">
              {node.count.toLocaleString()}
            </span>
            <span className="w-14 text-right font-mono tabular-nums text-surface-500">
              {total > 0 ? ((node.count / total) * 100).toFixed(2) + '%' : '—'}
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
          />
        ))}
    </>
  );
}

function buildTree(o: OverviewCounts | null): Node[] {
  if (!o) return [];
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
        { key: 'rc-all', label: 'All', count: o.responseCodes.all, category: 'all' },
        {
          key: 'rc-blocked',
          label: 'Blocked by Robots',
          count: o.responseCodes.blockedRobots,
          category: 'status:blocked-robots',
        },
        {
          key: 'rc-none',
          label: 'No Response',
          count: o.responseCodes.noResponse,
          category: 'status:no-response',
        },
        { key: 'rc-2xx', label: 'Success (2xx)', count: o.responseCodes.success2xx, category: 'status:2xx' },
        {
          key: 'rc-3xx',
          label: 'Redirection (3xx)',
          count: o.responseCodes.redirect3xx,
          category: 'status:3xx',
        },
        {
          key: 'rc-4xx',
          label: 'Client Error (4xx)',
          count: o.responseCodes.clientError4xx,
          category: 'status:4xx',
        },
        {
          key: 'rc-5xx',
          label: 'Server Error (5xx)',
          count: o.responseCodes.serverError5xx,
          category: 'status:5xx',
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
        },
        { key: 'sec-http', label: 'HTTP URLs', count: o.security.http, category: 'security:http' },
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
      children: [
        {
          key: 'issues-title',
          label: 'Page Titles',
          children: [
            {
              key: 'issues-title-missing',
              label: 'Missing',
              count: o.issues.titleMissing,
              category: 'issues:title-missing',
            },
            {
              key: 'issues-title-too-long',
              label: 'Over 60 Characters',
              count: o.issues.titleTooLong,
              category: 'issues:title-too-long',
            },
            {
              key: 'issues-title-too-short',
              label: 'Below 30 Characters',
              count: o.issues.titleTooShort,
              category: 'issues:title-too-short',
            },
            {
              key: 'issues-title-duplicate',
              label: 'Duplicate',
              count: o.issues.titleDuplicate,
              category: 'issues:title-duplicate',
            },
          ],
        },
        {
          key: 'issues-meta',
          label: 'Meta Descriptions',
          children: [
            {
              key: 'issues-meta-missing',
              label: 'Missing',
              count: o.issues.metaMissing,
              category: 'issues:meta-missing',
            },
            {
              key: 'issues-meta-too-long',
              label: 'Over 160 Characters',
              count: o.issues.metaTooLong,
              category: 'issues:meta-too-long',
            },
            {
              key: 'issues-meta-too-short',
              label: 'Below 120 Characters',
              count: o.issues.metaTooShort,
              category: 'issues:meta-too-short',
            },
            {
              key: 'issues-meta-duplicate',
              label: 'Duplicate',
              count: o.issues.metaDuplicate,
              category: 'issues:meta-duplicate',
            },
          ],
        },
        {
          key: 'issues-h1',
          label: 'H1',
          children: [
            {
              key: 'issues-h1-missing',
              label: 'Missing',
              count: o.issues.h1Missing,
              category: 'issues:h1-missing',
            },
            {
              key: 'issues-h1-duplicate',
              label: 'Duplicate',
              count: o.issues.h1Duplicate,
              category: 'issues:h1-duplicate',
            },
          ],
        },
        {
          key: 'issues-content',
          label: 'Content',
          children: [
            {
              key: 'issues-content-thin',
              label: 'Thin Content (<300 words)',
              count: o.issues.contentThin,
              category: 'issues:content-thin',
            },
          ],
        },
        {
          key: 'issues-response',
          label: 'Response',
          children: [
            {
              key: 'issues-response-slow',
              label: 'Slow (>1s)',
              count: o.issues.responseSlow,
              category: 'issues:response-slow',
            },
          ],
        },
        {
          key: 'issues-images',
          label: 'Images',
          children: [
            {
              key: 'issues-images-missing-alt',
              label: 'Missing Alt',
              count: o.issues.imageMissingAlt,
              category: 'issues:image-missing-alt',
            },
          ],
        },
        {
          key: 'issues-links',
          label: 'Links',
          children: [
            {
              key: 'issues-broken-all',
              label: 'Broken (All)',
              count: o.issues.brokenLinksInternal + o.issues.brokenLinksExternal,
              category: 'issues:broken-links-all',
            },
            {
              key: 'issues-broken-internal',
              label: 'Broken Internal',
              count: o.issues.brokenLinksInternal,
              category: 'issues:broken-links-internal',
            },
            {
              key: 'issues-broken-external',
              label: 'Broken External',
              count: o.issues.brokenLinksExternal,
              category: 'issues:broken-links-external',
            },
          ],
        },
      ],
    },
  ];
}
