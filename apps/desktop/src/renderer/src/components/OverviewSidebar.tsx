import { memo, useEffect, useMemo, useRef, useState } from 'react';
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
      try {
        const o = await window.freecrawl.overviewGet();
        if (!cancelled) setOverview(o);
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
    void window.freecrawl.overviewGet().then((o) => setOverview(o));
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
  const tree = useMemo(() => buildTree(overview), [overview]);
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

const TreeNode = memo(function TreeNode({
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
});

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
            {
              key: 'issues-title-multiple',
              label: 'Multiple <title> Tags',
              count: o.issues.titleMultiple,
              category: 'issues:title-multiple',
            },
            {
              key: 'issues-title-pixel-width',
              label: 'Pixel Width Truncated (>600px)',
              count: o.issues.titlePixelWidthTooLong,
              category: 'issues:title-pixel-width-too-long',
            },
            {
              key: 'issues-title-placeholder',
              label: 'Placeholder Title',
              count: o.issues.titlePlaceholder,
              category: 'issues:title-placeholder',
            },
            {
              key: 'issues-title-single-word',
              label: 'Single-Word Title',
              count: o.issues.titleSingleWord,
              category: 'issues:title-single-word',
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
            {
              key: 'issues-meta-pixel-width',
              label: 'Pixel Width Truncated (>990px)',
              count: o.issues.metaPixelWidthTooLong,
              category: 'issues:meta-pixel-width-too-long',
            },
            {
              key: 'issues-description-equals-title',
              label: 'Description = Title',
              count: o.issues.descriptionEqualsTitle,
              category: 'issues:description-equals-title',
            },
            {
              key: 'issues-description-equals-h1',
              label: 'Description = H1',
              count: o.issues.descriptionEqualsH1,
              category: 'issues:description-equals-h1',
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
            {
              key: 'issues-h1-multiple',
              label: 'Multiple',
              count: o.issues.h1Multiple,
              category: 'issues:h1-multiple',
            },
            {
              key: 'issues-h1-empty',
              label: 'Empty',
              count: o.issues.h1Empty,
              category: 'issues:h1-empty',
            },
            {
              key: 'issues-h1-too-long',
              label: 'Over 70 Characters',
              count: o.issues.h1TooLong,
              category: 'issues:h1-too-long',
            },
            {
              key: 'issues-heading-skipped',
              label: 'Skipped Heading Level',
              count: o.issues.headingSkippedLevel,
              category: 'issues:heading-skipped-level',
            },
            {
              key: 'issues-h1-equals-title',
              label: 'H1 = Title',
              count: o.issues.h1EqualsTitle,
              category: 'issues:h1-equals-title',
            },
          ],
        },
        {
          key: 'issues-canonicals',
          label: 'Canonicals',
          children: [
            {
              key: 'issues-canonicals-missing',
              label: 'Canonical Missing',
              count: o.issues.canonicalMissing,
              category: 'issues:canonical-missing',
            },
            {
              key: 'issues-canonicals-self',
              label: 'Self-Referencing',
              count: o.issues.canonicalSelfReferencing,
              category: 'issues:canonical-self-referencing',
            },
            {
              key: 'issues-canonicals-non-self',
              label: 'Canonicalised (→ other)',
              count: o.issues.canonicalNonSelf,
              category: 'issues:canonical-non-self',
            },
            {
              key: 'issues-canonicals-mismatch',
              label: 'HTTP vs HTML Mismatch',
              count: o.issues.canonicalMismatch,
              category: 'issues:canonical-mismatch',
            },
            {
              key: 'issues-canonicals-multiple',
              label: 'Multiple Canonicals',
              count: o.issues.multipleCanonicals,
              category: 'issues:multiple-canonicals',
            },
            {
              key: 'issues-canonicals-non-200',
              label: 'Canonical → Non-200',
              count: o.issues.canonicalToNon200,
              category: 'issues:canonical-to-non-200',
            },
            {
              key: 'issues-canonicals-redirect',
              label: 'Canonical → Redirect',
              count: o.issues.canonicalToRedirect,
              category: 'issues:canonical-to-redirect',
            },
            {
              key: 'issues-canonicals-noindex',
              label: 'Canonical → Noindex',
              count: o.issues.canonicalToNoindex,
              category: 'issues:canonical-to-noindex',
            },
            {
              key: 'issues-canonical-not-absolute',
              label: 'Canonical Not Absolute',
              count: o.issues.canonicalNotAbsolute,
              category: 'issues:canonical-not-absolute',
            },
            {
              key: 'issues-canonical-chain-multi-hop',
              label: 'Canonical Chain (Multi-hop)',
              count: o.issues.canonicalChainMultiHop,
              category: 'issues:canonical-chain-multi-hop',
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
            {
              key: 'issues-page-empty',
              label: 'Empty Page (<30 words)',
              count: o.issues.pageEmpty,
              category: 'issues:page-empty',
            },
            {
              key: 'issues-near-duplicate',
              label: 'Near-Duplicate Content',
              count: o.issues.nearDuplicate,
              category: 'issues:near-duplicate',
            },
            {
              key: 'issues-duplicate-content-exact',
              label: 'Duplicate Content (exact)',
              count: o.issues.duplicateContentExact,
              category: 'issues:duplicate-content-exact',
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
            {
              key: 'issues-response-very-slow',
              label: 'Very Slow (>3s)',
              count: o.issues.responseVerySlow,
              category: 'issues:response-very-slow',
            },
            {
              key: 'issues-ttfb-slow',
              label: 'TTFB Slow (>600ms)',
              count: o.issues.ttfbSlow,
              category: 'issues:ttfb-slow',
            },
            {
              key: 'issues-ttfb-very-slow',
              label: 'TTFB Very Slow (>1.8s)',
              count: o.issues.ttfbVerySlow,
              category: 'issues:ttfb-very-slow',
            },
          ],
        },
        {
          key: 'issues-cookies',
          label: 'Cookies',
          children: [
            {
              key: 'issues-cookies-no-secure',
              label: 'Missing Secure (HTTPS)',
              count: o.issues.cookieNoSecure,
              category: 'issues:cookie-no-secure',
            },
            {
              key: 'issues-cookies-no-httponly',
              label: 'Missing HttpOnly',
              count: o.issues.cookieNoHttpOnly,
              category: 'issues:cookie-no-httponly',
            },
            {
              key: 'issues-cookies-no-samesite',
              label: 'Missing SameSite',
              count: o.issues.cookieNoSameSite,
              category: 'issues:cookie-no-samesite',
            },
          ],
        },
        {
          key: 'issues-page',
          label: 'Page',
          children: [
            {
              key: 'issues-page-large',
              label: 'Large (>1MB)',
              count: o.issues.pageLarge,
              category: 'issues:page-large',
            },
          ],
        },
        {
          key: 'issues-document',
          label: 'Document',
          children: [
            {
              key: 'issues-meta-refresh',
              label: 'Meta Refresh Used',
              count: o.issues.metaRefreshUsed,
              category: 'issues:meta-refresh-used',
            },
            {
              key: 'issues-charset-missing',
              label: 'Charset Missing',
              count: o.issues.charsetMissing,
              category: 'issues:charset-missing',
            },
          ],
        },
        {
          key: 'issues-url',
          label: 'URL',
          children: [
            {
              key: 'issues-url-too-long',
              label: 'Too Long (>2048 chars)',
              count: o.issues.urlTooLong,
              category: 'issues:url-too-long',
            },
            {
              key: 'issues-url-uppercase',
              label: 'Contains Uppercase',
              count: o.issues.urlUppercase,
              category: 'issues:url-uppercase',
            },
            {
              key: 'issues-url-underscore',
              label: 'Contains Underscore',
              count: o.issues.urlUnderscore,
              category: 'issues:url-underscore',
            },
            {
              key: 'issues-url-multiple-slashes',
              label: 'Multiple Slashes',
              count: o.issues.urlMultipleSlashes,
              category: 'issues:url-multiple-slashes',
            },
            {
              key: 'issues-url-non-ascii',
              label: 'Non-ASCII Characters',
              count: o.issues.urlNonAscii,
              category: 'issues:url-non-ascii',
            },
            {
              key: 'issues-url-many-params',
              label: 'Many Query Params (>5)',
              count: o.issues.urlManyParams,
              category: 'issues:url-many-params',
            },
            {
              key: 'issues-url-fragment',
              label: 'Fragment (#) in URL',
              count: o.issues.urlFragment,
              category: 'issues:url-fragment',
            },
            {
              key: 'issues-url-spaces',
              label: 'Spaces in URL',
              count: o.issues.urlSpaces,
              category: 'issues:url-spaces',
            },
            {
              key: 'issues-url-query-too-long',
              label: 'Long Query String (>100 chars)',
              count: o.issues.queryStringTooLong,
              category: 'issues:query-string-too-long',
            },
            {
              key: 'issues-url-folder-too-deep',
              label: 'Folder Depth >4',
              count: o.issues.folderDepthTooDeep,
              category: 'issues:folder-depth-too-deep',
            },
            {
              key: 'issues-duplicate-url-post-norm',
              label: 'Duplicate URL (post-norm)',
              count: o.issues.duplicateUrlPostNorm,
              category: 'issues:duplicate-url-post-norm',
            },
          ],
        },
        {
          key: 'issues-accessibility',
          label: 'Accessibility',
          children: [
            {
              key: 'issues-lang-missing',
              label: 'Lang Attribute Missing',
              count: o.issues.langMissing,
              category: 'issues:lang-missing',
            },
            {
              key: 'issues-form-input-unlabeled',
              label: 'Form Inputs Missing Label',
              count: o.issues.formInputUnlabeled,
              category: 'issues:form-input-unlabeled',
            },
          ],
        },
        {
          key: 'issues-mobile',
          label: 'Mobile',
          children: [
            {
              key: 'issues-viewport-missing',
              label: 'Viewport Meta Missing',
              count: o.issues.viewportMissing,
              category: 'issues:viewport-missing',
            },
          ],
        },
        {
          key: 'issues-social',
          label: 'Social',
          children: [
            {
              key: 'issues-og-missing',
              label: 'OpenGraph Tags Missing',
              count: o.issues.ogMissing,
              category: 'issues:og-missing',
            },
            {
              key: 'issues-twitter-missing',
              label: 'Twitter Card Missing',
              count: o.issues.twitterMissing,
              category: 'issues:twitter-missing',
            },
            {
              key: 'issues-og-image-not-absolute',
              label: 'OG Image Not Absolute',
              count: o.issues.ogImageNotAbsolute,
              category: 'issues:og-image-not-absolute',
            },
            {
              key: 'issues-twitter-image-not-absolute',
              label: 'Twitter Image Not Absolute',
              count: o.issues.twitterImageNotAbsolute,
              category: 'issues:twitter-image-not-absolute',
            },
            {
              key: 'issues-og-image-too-large',
              label: 'OG Image >5MB',
              count: o.issues.ogImageTooLarge,
              category: 'issues:og-image-too-large',
            },
            {
              key: 'issues-twitter-image-too-large',
              label: 'Twitter Image >5MB',
              count: o.issues.twitterImageTooLarge,
              category: 'issues:twitter-image-too-large',
            },
          ],
        },
        {
          key: 'issues-security-headers',
          label: 'Security Headers',
          children: [
            {
              key: 'issues-hsts-missing',
              label: 'HSTS Missing',
              count: o.issues.hstsMissing,
              category: 'issues:hsts-missing',
            },
            {
              key: 'issues-hsts-no-preload',
              label: 'HSTS Missing Preload',
              count: o.issues.hstsNoPreload,
              category: 'issues:hsts-no-preload',
            },
            {
              key: 'issues-hsts-max-age-short',
              label: 'HSTS Max-Age <1y',
              count: o.issues.hstsMaxAgeShort,
              category: 'issues:hsts-max-age-short',
            },
            {
              key: 'issues-hsts-no-includesubdomains',
              label: 'HSTS Missing includeSubDomains',
              count: o.issues.hstsNoIncludeSubdomains,
              category: 'issues:hsts-no-includesubdomains',
            },
            {
              key: 'issues-xframe-missing',
              label: 'X-Frame-Options Missing',
              count: o.issues.xFrameOptionsMissing,
              category: 'issues:x-frame-options-missing',
            },
            {
              key: 'issues-xcto-missing',
              label: 'X-Content-Type-Options Missing',
              count: o.issues.xContentTypeOptionsMissing,
              category: 'issues:x-content-type-options-missing',
            },
            {
              key: 'issues-csp-missing',
              label: 'CSP Missing',
              count: o.issues.cspMissing,
              category: 'issues:csp-missing',
            },
            {
              key: 'issues-mixed-content',
              label: 'Mixed Content',
              count: o.issues.mixedContent,
              category: 'issues:mixed-content',
            },
            {
              key: 'issues-insecure-form-action',
              label: 'Insecure Form Action',
              count: o.issues.insecureFormAction,
              category: 'issues:insecure-form-action',
            },
            {
              key: 'issues-missing-sri',
              label: 'Missing SRI (3rd-party)',
              count: o.issues.missingSri,
              category: 'issues:missing-sri',
            },
          ],
        },
        {
          key: 'issues-ssl',
          label: 'SSL / TLS',
          children: [
            {
              key: 'issues-ssl-cert-expired',
              label: 'Certificate Expired',
              count: o.issues.sslCertExpired,
              category: 'issues:ssl-cert-expired',
            },
            {
              key: 'issues-ssl-cert-expiring-soon',
              label: 'Certificate Expiring (≤30d)',
              count: o.issues.sslCertExpiringSoon,
              category: 'issues:ssl-cert-expiring-soon',
            },
            {
              key: 'issues-ssl-protocol-old',
              label: 'Deprecated TLS Protocol',
              count: o.issues.sslProtocolOld,
              category: 'issues:ssl-protocol-old',
            },
            {
              key: 'issues-ssl-signature-weak',
              label: 'Weak Signature Algorithm',
              count: o.issues.sslSignatureWeak,
              category: 'issues:ssl-signature-weak',
            },
          ],
        },
        {
          key: 'issues-technical',
          label: 'Technical',
          children: [
            {
              key: 'issues-favicon-missing',
              label: 'Favicon Missing',
              count: o.issues.faviconMissing,
              category: 'issues:favicon-missing',
            },
          ],
        },
        {
          key: 'issues-redirects',
          label: 'Redirects',
          children: [
            {
              key: 'issues-redirect-loop',
              label: 'Redirect Loop',
              count: o.issues.redirectLoop,
              category: 'issues:redirect-loop',
            },
            {
              key: 'issues-redirect-chain-long',
              label: 'Long Chain (>3 hops)',
              count: o.issues.redirectChainLong,
              category: 'issues:redirect-chain-long',
            },
            {
              key: 'issues-redirect-self',
              label: 'Self-Redirect',
              count: o.issues.redirectSelf,
              category: 'issues:redirect-self',
            },
          ],
        },
        {
          key: 'issues-perf',
          label: 'Performance',
          children: [
            {
              key: 'issues-compression-missing',
              label: 'Compression Missing',
              count: o.issues.compressionMissing,
              category: 'issues:compression-missing',
            },
            {
              key: 'issues-http2-not-supported',
              label: 'HTTP/2 Not Advertised',
              count: o.issues.http2NotSupported,
              category: 'issues:http2-not-supported',
            },
            {
              key: 'issues-render-blocking',
              label: 'Render-Blocking Head (>5)',
              count: o.issues.renderBlocking,
              category: 'issues:render-blocking',
            },
            {
              key: 'issues-render-blocking-critical',
              label: 'Render-Blocking Head (>20, critical)',
              count: o.issues.renderBlockingCritical,
              category: 'issues:render-blocking-critical',
            },
            {
              key: 'issues-text-code-ratio-low',
              label: 'Low Text/Code Ratio (<10%)',
              count: o.issues.textCodeRatioLow,
              category: 'issues:text-code-ratio-low',
            },
            {
              key: 'issues-keepalive-disabled',
              label: 'Keep-Alive Disabled',
              count: o.issues.keepaliveDisabled,
              category: 'issues:keepalive-disabled',
            },
            {
              key: 'issues-image-too-large',
              label: 'Large Image (>100KB)',
              count: o.issues.imageTooLarge,
              category: 'issues:image-too-large',
            },
          ],
        },
        {
          key: 'issues-sitemap',
          label: 'Sitemap',
          children: [
            {
              key: 'issues-sitemap-non-indexable',
              label: 'Non-Indexable in Sitemap',
              count: o.issues.nonIndexableInSitemap,
              category: 'issues:non-indexable-in-sitemap',
            },
            {
              key: 'issues-sitemap-non-200',
              label: 'Non-200 in Sitemap',
              count: o.issues.non200InSitemap,
              category: 'issues:non-200-in-sitemap',
            },
            {
              key: 'issues-sitemap-redirect',
              label: 'Redirect in Sitemap',
              count: o.issues.redirectInSitemap,
              category: 'issues:redirect-in-sitemap',
            },
            {
              key: 'issues-crawled-not-in-sitemap',
              label: 'Crawled, Not in Sitemap',
              count: o.issues.crawledNotInSitemap,
              category: 'issues:crawled-not-in-sitemap',
            },
          ],
        },
        {
          key: 'issues-structured-data',
          label: 'Structured Data',
          children: [
            {
              key: 'issues-schema-missing',
              label: 'No Structured Data',
              count: o.issues.structuredDataMissing,
              category: 'issues:structured-data-missing',
            },
            {
              key: 'issues-schema-invalid',
              label: 'Invalid JSON-LD',
              count: o.issues.structuredDataInvalid,
              category: 'issues:structured-data-invalid',
            },
          ],
        },
        {
          key: 'issues-analytics',
          label: 'Analytics',
          children: [
            {
              key: 'issues-analytics-missing',
              label: 'No Analytics Detected',
              count: o.issues.analyticsMissing,
              category: 'issues:analytics-missing',
            },
            {
              key: 'issues-analytics-multiple-ga4',
              label: 'Multiple GA4 IDs',
              count: o.issues.analyticsMultipleGa4,
              category: 'issues:analytics-multiple-ga4',
            },
            {
              key: 'issues-analytics-ua-legacy',
              label: 'Universal Analytics (Sunset)',
              count: o.issues.analyticsUaLegacy,
              category: 'issues:analytics-ua-legacy',
            },
            {
              key: 'issues-analytics-pixel-without-policy',
              label: 'Pixel Without Permissions-Policy',
              count: o.issues.analyticsPixelWithoutPolicy,
              category: 'issues:analytics-pixel-without-policy',
            },
          ],
        },
        {
          key: 'issues-pagination',
          label: 'Pagination',
          children: [
            {
              key: 'issues-pagination-broken',
              label: 'Broken Next/Prev Target',
              count: o.issues.paginationBroken,
              category: 'issues:pagination-broken',
            },
            {
              key: 'issues-pagination-sequence-break',
              label: 'Sequence Break (gap in numbering)',
              count: o.issues.paginationSequenceBreak,
              category: 'issues:pagination-sequence-break',
            },
          ],
        },
        {
          key: 'issues-hreflang',
          label: 'Hreflang',
          children: [
            {
              key: 'issues-hreflang-x-default',
              label: 'x-default Missing',
              count: o.issues.hreflangXDefaultMissing,
              category: 'issues:hreflang-x-default-missing',
            },
            {
              key: 'issues-hreflang-invalid-code',
              label: 'Invalid Code',
              count: o.issues.hreflangInvalidCode,
              category: 'issues:hreflang-invalid-code',
            },
            {
              key: 'issues-hreflang-self-ref-missing',
              label: 'Self-Ref Missing',
              count: o.issues.hreflangSelfRefMissing,
              category: 'issues:hreflang-self-ref-missing',
            },
            {
              key: 'issues-hreflang-reciprocity-missing',
              label: 'Reciprocity Missing',
              count: o.issues.hreflangReciprocityMissing,
              category: 'issues:hreflang-reciprocity-missing',
            },
            {
              key: 'issues-hreflang-target-issues',
              label: 'Target Issues',
              count: o.issues.hreflangTargetIssues,
              category: 'issues:hreflang-target-issues',
            },
            {
              key: 'issues-hreflang-inconsistent-lang',
              label: 'Inconsistent Lang (same lang, two hrefs)',
              count: o.issues.hreflangInconsistentLang,
              category: 'issues:hreflang-inconsistent-lang',
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
            {
              key: 'issues-images-empty-alt',
              label: 'Empty Alt',
              count: o.issues.imageEmptyAlt,
              category: 'issues:image-empty-alt',
            },
            {
              key: 'issues-images-no-lazy-loading',
              label: 'Low Lazy-Loading Adoption',
              count: o.issues.imagesNoLazyLoading,
              category: 'issues:images-no-lazy-loading',
            },
            {
              key: 'issues-image-broken-src',
              label: 'Broken Image Src',
              count: o.issues.imageBrokenSrc,
              category: 'issues:image-broken-src',
            },
            {
              key: 'issues-image-slow-loading',
              label: 'Slow-Loading Image (>200KB, no lazy)',
              count: o.issues.imageSlowLoading,
              category: 'issues:image-slow-loading',
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
            {
              key: 'issues-link-empty-anchor',
              label: 'Empty Anchor Text',
              count: o.issues.linkEmptyAnchor,
              category: 'issues:link-empty-anchor',
            },
            {
              key: 'issues-anchor-text-too-long',
              label: 'Anchor Text Too Long (>100)',
              count: o.issues.anchorTextTooLong,
              category: 'issues:anchor-text-too-long',
            },
            {
              key: 'issues-anchor-text-generic',
              label: 'Generic Anchor Text',
              count: o.issues.anchorTextGeneric,
              category: 'issues:anchor-text-generic',
            },
            {
              key: 'issues-target-blank-no-noopener',
              label: 'target=_blank without noopener',
              count: o.issues.targetBlankNoNoopener,
              category: 'issues:target-blank-no-noopener',
            },
            {
              key: 'issues-external-links-too-many',
              label: 'External Links > 100',
              count: o.issues.externalLinksTooMany,
              category: 'issues:external-links-too-many',
            },
            {
              key: 'issues-links-per-page-too-many',
              label: 'Total Links per Page > 100',
              count: o.issues.linksPerPageTooMany,
              category: 'issues:links-per-page-too-many',
            },
            {
              key: 'issues-outlinks-zero',
              label: 'No Outlinks (Dead-End)',
              count: o.issues.outlinksZero,
              category: 'issues:outlinks-zero',
            },
            {
              key: 'issues-internal-link-to-redirect',
              label: 'Internal Link → Redirect',
              count: o.issues.internalLinkToRedirect,
              category: 'issues:internal-link-to-redirect',
            },
            {
              key: 'issues-dead-external-domain',
              label: 'Dead External Domain',
              count: o.issues.deadExternalDomain,
              category: 'issues:dead-external-domain',
            },
            {
              key: 'issues-js-only-navigation',
              label: 'JS-Only Navigation',
              count: o.issues.jsOnlyNavigation,
              category: 'issues:js-only-navigation',
            },
          ],
        },
        {
          key: 'issues-pwa',
          label: 'PWA / Discovery',
          children: [
            {
              key: 'issues-apple-touch-missing',
              label: 'Apple Touch Icon Missing',
              count: o.issues.appleTouchIconMissing,
              category: 'issues:apple-touch-icon-missing',
            },
            {
              key: 'issues-manifest-missing',
              label: 'Web Manifest Missing',
              count: o.issues.manifestMissing,
              category: 'issues:manifest-missing',
            },
            {
              key: 'issues-feed-missing',
              label: 'RSS/Atom Feed Missing',
              count: o.issues.feedMissing,
              category: 'issues:feed-missing',
            },
          ],
        },
      ],
    },
  ];
}
