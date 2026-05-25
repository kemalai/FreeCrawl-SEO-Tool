import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  PagesPerDirectoryRow,
  StatusCodeHistogramRow,
  IndexabilityDistributionRow,
  ContentKindDistributionRow,
  DepthHistogramRow,
  ResponseTimeHistogramRow,
  TopUrlsRow,
  TopUrlMetric,
  ExternalDomainHealthRow,
  AnalyticsCoverageRow,
  LinkPositionRow,
  ImageWeightRow,
  BucketHistogramRow,
  ServerHeaderRow,
  TopWordsRow,
  WordCountPerDirectoryRow,
  SitemapOrphanRow,
  OrphanCrossSourceRow,
} from '@freecrawl/shared-types';

interface Props {
  open: boolean;
  onClose: () => void;
}

type ReportKind =
  | 'pages-per-dir'
  | 'status-codes'
  | 'indexability-distribution'
  | 'content-kind-distribution'
  | 'depth'
  | 'response-time'
  | 'slowest-urls'
  | 'most-inlinks'
  | 'least-inlinks'
  | 'most-outlinks'
  | 'biggest-pages'
  | 'deepest-urls'
  | 'external-domain-health'
  | 'analytics-coverage'
  | 'link-positions'
  | 'image-weight'
  | 'inlinks-histogram'
  | 'word-count-histogram'
  | 'url-length-histogram'
  | 'word-count-per-dir'
  | 'sitemap-orphans'
  | 'orphan-cross-source'
  | 'server-headers'
  | 'top-words';

interface ReportRow {
  /** Display key (directory path / status code / depth label). */
  key: string;
  /** Optional column shown left-of-key (e.g. status-class label). */
  badge?: string;
  count: number;
  /**
   * Optional secondary numeric value (response time ms, page bytes, etc.).
   * When present, rows render `count` as the bar metric and `valueLabel`
   * as a separate "Value" column.
   */
  valueLabel?: string;
}

const REPORT_LABELS: Record<ReportKind, string> = {
  'pages-per-dir': 'Pages per Directory',
  'status-codes': 'Status Code Histogram',
  'indexability-distribution': 'Indexability Distribution',
  'content-kind-distribution': 'Content-Type Distribution',
  depth: 'Depth Histogram',
  'response-time': 'Response Time Histogram',
  'slowest-urls': 'Slowest URLs (Top 25)',
  'most-inlinks': 'Most-Linked URLs (Top 25)',
  'least-inlinks': 'Least-Linked URLs (Bottom 25, indexable HTML)',
  'most-outlinks': 'Most-Outlinking URLs (Top 25)',
  'biggest-pages': 'Biggest Pages (Top 25)',
  'deepest-urls': 'Deepest URLs (Top 25)',
  'external-domain-health': 'External Domain Health',
  'analytics-coverage': 'Analytics Tracker Coverage',
  'link-positions': 'Internal Link Positions',
  'image-weight': 'Image Weight per Page (Top 25)',
  'inlinks-histogram': 'Inlinks Histogram',
  'word-count-histogram': 'Word Count Histogram',
  'url-length-histogram': 'URL Length Histogram',
  'word-count-per-dir': 'Word Count per Directory',
  'sitemap-orphans': 'Sitemap Orphans (Top 1000)',
  'orphan-cross-source': 'Orphan Pages — Sitemap + GSC + GA4 (Top 1000)',
  'server-headers': 'Server Stack (Server Header)',
  'top-words': 'Top Words (Title + Meta + H1, Top 100)',
};

const KEY_LABELS: Record<ReportKind, string> = {
  'pages-per-dir': 'Directory',
  'status-codes': 'Status',
  'indexability-distribution': 'Indexability',
  'content-kind-distribution': 'Content Type',
  depth: 'Depth',
  'response-time': 'Bucket',
  'slowest-urls': 'URL',
  'most-inlinks': 'URL',
  'least-inlinks': 'URL',
  'most-outlinks': 'URL',
  'biggest-pages': 'URL',
  'deepest-urls': 'URL',
  'external-domain-health': 'Domain',
  'analytics-coverage': 'Tracker',
  'link-positions': 'Position',
  'image-weight': 'URL',
  'inlinks-histogram': 'Bucket',
  'word-count-histogram': 'Bucket',
  'url-length-histogram': 'Bucket',
  'word-count-per-dir': 'Directory',
  'sitemap-orphans': 'URL',
  'orphan-cross-source': 'URL',
  'server-headers': 'Server',
  'top-words': 'Word',
};

const TOP_URL_METRIC: Record<ReportKind, TopUrlMetric | null> = {
  'pages-per-dir': null,
  'status-codes': null,
  'indexability-distribution': null,
  'content-kind-distribution': null,
  depth: null,
  'response-time': null,
  'slowest-urls': 'response-time',
  'most-inlinks': 'inlinks',
  'least-inlinks': 'inlinks',
  'most-outlinks': 'outlinks',
  'biggest-pages': 'page-size',
  'deepest-urls': 'depth',
  'external-domain-health': null,
  'analytics-coverage': null,
  'link-positions': null,
  'image-weight': null,
  'inlinks-histogram': null,
  'word-count-histogram': null,
  'url-length-histogram': null,
  'word-count-per-dir': null,
  'sitemap-orphans': null,
  'orphan-cross-source': null,
  'server-headers': null,
  'top-words': null,
};

const VALUE_FORMAT: Record<ReportKind, (v: number | null) => string> = {
  'pages-per-dir': (v) => (v ?? 0).toLocaleString(),
  'status-codes': (v) => (v ?? 0).toLocaleString(),
  'indexability-distribution': (v) => (v ?? 0).toLocaleString(),
  'content-kind-distribution': (v) => (v ?? 0).toLocaleString(),
  depth: (v) => (v ?? 0).toLocaleString(),
  'response-time': (v) => (v ?? 0).toLocaleString(),
  'slowest-urls': (v) => (v == null ? '—' : `${v.toLocaleString()} ms`),
  'most-inlinks': (v) => (v ?? 0).toLocaleString(),
  'least-inlinks': (v) => (v ?? 0).toLocaleString(),
  'most-outlinks': (v) => (v ?? 0).toLocaleString(),
  'biggest-pages': (v) => (v == null ? '—' : `${(v / 1024).toFixed(1)} KB`),
  'deepest-urls': (v) => (v ?? 0).toLocaleString(),
  'external-domain-health': (v) => (v ?? 0).toLocaleString(),
  'analytics-coverage': (v) => (v ?? 0).toLocaleString(),
  'link-positions': (v) => (v ?? 0).toLocaleString(),
  'image-weight': (v) => {
    if (v == null) return '—';
    if (v < 1024) return `${v} B`;
    if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
    return `${(v / 1024 / 1024).toFixed(2)} MB`;
  },
  'inlinks-histogram': (v) => (v ?? 0).toLocaleString(),
  'word-count-histogram': (v) => (v ?? 0).toLocaleString(),
  'url-length-histogram': (v) => (v ?? 0).toLocaleString(),
  'word-count-per-dir': (v) => (v ?? 0).toLocaleString(),
  'sitemap-orphans': (v) => (v ?? 0).toLocaleString(),
  'orphan-cross-source': (v) => (v ?? 0).toLocaleString(),
  'server-headers': (v) => (v ?? 0).toLocaleString(),
  'top-words': (v) => (v ?? 0).toLocaleString(),
};

export function ReportsDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<ReportKind>('pages-per-dir');
  const [depth, setDepth] = useState(1);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Localised label maps. Memoised on `t` so they only rebuild when the
  // language changes, not on every render.
  const reportLabels = useMemo<Record<ReportKind, string>>(() => ({
    'pages-per-dir': t('reports.report.pagesPerDir', { defaultValue: REPORT_LABELS['pages-per-dir'] }),
    'status-codes': t('reports.report.statusCodes', { defaultValue: REPORT_LABELS['status-codes'] }),
    'indexability-distribution': t('reports.report.indexabilityDistribution', { defaultValue: REPORT_LABELS['indexability-distribution'] }),
    'content-kind-distribution': t('reports.report.contentKindDistribution', { defaultValue: REPORT_LABELS['content-kind-distribution'] }),
    depth: t('reports.report.depth', { defaultValue: REPORT_LABELS.depth }),
    'response-time': t('reports.report.responseTime', { defaultValue: REPORT_LABELS['response-time'] }),
    'slowest-urls': t('reports.report.slowestUrls', { defaultValue: REPORT_LABELS['slowest-urls'] }),
    'most-inlinks': t('reports.report.mostInlinks', { defaultValue: REPORT_LABELS['most-inlinks'] }),
    'least-inlinks': t('reports.report.leastInlinks', { defaultValue: REPORT_LABELS['least-inlinks'] }),
    'most-outlinks': t('reports.report.mostOutlinks', { defaultValue: REPORT_LABELS['most-outlinks'] }),
    'biggest-pages': t('reports.report.biggestPages', { defaultValue: REPORT_LABELS['biggest-pages'] }),
    'deepest-urls': t('reports.report.deepestUrls', { defaultValue: REPORT_LABELS['deepest-urls'] }),
    'external-domain-health': t('reports.report.externalDomainHealth', { defaultValue: REPORT_LABELS['external-domain-health'] }),
    'analytics-coverage': t('reports.report.analyticsCoverage', { defaultValue: REPORT_LABELS['analytics-coverage'] }),
    'link-positions': t('reports.report.linkPositions', { defaultValue: REPORT_LABELS['link-positions'] }),
    'image-weight': t('reports.report.imageWeight', { defaultValue: REPORT_LABELS['image-weight'] }),
    'inlinks-histogram': t('reports.report.inlinksHistogram', { defaultValue: REPORT_LABELS['inlinks-histogram'] }),
    'word-count-histogram': t('reports.report.wordCountHistogram', { defaultValue: REPORT_LABELS['word-count-histogram'] }),
    'url-length-histogram': t('reports.report.urlLengthHistogram', { defaultValue: REPORT_LABELS['url-length-histogram'] }),
    'word-count-per-dir': t('reports.report.wordCountPerDir', { defaultValue: REPORT_LABELS['word-count-per-dir'] }),
    'sitemap-orphans': t('reports.report.sitemapOrphans', { defaultValue: REPORT_LABELS['sitemap-orphans'] }),
    'orphan-cross-source': t('reports.report.orphanCrossSource', { defaultValue: REPORT_LABELS['orphan-cross-source'] }),
    'server-headers': t('reports.report.serverHeaders', { defaultValue: REPORT_LABELS['server-headers'] }),
    'top-words': t('reports.report.topWords', { defaultValue: REPORT_LABELS['top-words'] }),
  }), [t]);
  const keyLabels = useMemo<Record<ReportKind, string>>(() => ({
    'pages-per-dir': t('reports.keyDirectory', { defaultValue: 'Directory' }),
    'status-codes': t('reports.keyStatus', { defaultValue: 'Status' }),
    'indexability-distribution': t('reports.keyIndexability', { defaultValue: 'Indexability' }),
    'content-kind-distribution': t('reports.keyContentType', { defaultValue: 'Content Type' }),
    depth: t('reports.keyDepth', { defaultValue: 'Depth' }),
    'response-time': t('reports.keyBucket', { defaultValue: 'Bucket' }),
    'slowest-urls': 'URL',
    'most-inlinks': 'URL',
    'least-inlinks': 'URL',
    'most-outlinks': 'URL',
    'biggest-pages': 'URL',
    'deepest-urls': 'URL',
    'external-domain-health': t('reports.keyDomain', { defaultValue: 'Domain' }),
    'analytics-coverage': t('reports.keyTracker', { defaultValue: 'Tracker' }),
    'link-positions': t('reports.keyPosition', { defaultValue: 'Position' }),
    'image-weight': 'URL',
    'inlinks-histogram': t('reports.keyBucket', { defaultValue: 'Bucket' }),
    'word-count-histogram': t('reports.keyBucket', { defaultValue: 'Bucket' }),
    'url-length-histogram': t('reports.keyBucket', { defaultValue: 'Bucket' }),
    'word-count-per-dir': t('reports.keyDirectory', { defaultValue: 'Directory' }),
    'sitemap-orphans': 'URL',
    'orphan-cross-source': 'URL',
    'server-headers': t('reports.keyServer', { defaultValue: 'Server' }),
    'top-words': t('reports.keyWord', { defaultValue: 'Word' }),
  }), [t]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        if (kind === 'pages-per-dir') {
          const r = await window.freecrawl.reportsPagesPerDirectory({ depth, limit: 1000 });
          if (!cancelled)
            setRows(r.map((x: PagesPerDirectoryRow) => ({ key: x.directory, count: x.count })));
        } else if (kind === 'status-codes') {
          const r = await window.freecrawl.reportsStatusCodeHistogram();
          if (!cancelled)
            setRows(
              r.map((x: StatusCodeHistogramRow) => ({
                key: x.status === null ? 'No response' : String(x.status),
                badge: statusBadge(x.status),
                count: x.count,
              })),
            );
        } else if (kind === 'indexability-distribution') {
          const r = await window.freecrawl.reportsIndexabilityDistribution();
          if (!cancelled)
            setRows(
              r.map((x: IndexabilityDistributionRow) => ({
                key: indexabilityLabel(x.indexability),
                badge: x.indexability === 'indexable' ? 'OK' : 'NON',
                count: x.count,
              })),
            );
        } else if (kind === 'content-kind-distribution') {
          const r = await window.freecrawl.reportsContentKindDistribution();
          if (!cancelled)
            setRows(
              r.map((x: ContentKindDistributionRow) => ({
                key: contentKindLabel(x.contentKind),
                count: x.count,
              })),
            );
        } else if (kind === 'depth') {
          const r = await window.freecrawl.reportsDepthHistogram();
          if (!cancelled)
            setRows(r.map((x: DepthHistogramRow) => ({ key: String(x.depth), count: x.count })));
        } else if (kind === 'response-time') {
          const r = await window.freecrawl.reportsResponseTimeHistogram();
          if (!cancelled)
            setRows(
              r.map((x: ResponseTimeHistogramRow) => ({
                key: x.label,
                badge: rtBadge(x.label),
                count: x.count,
              })),
            );
        } else if (kind === 'external-domain-health') {
          const r = await window.freecrawl.reportsExternalDomainHealth(100);
          if (!cancelled)
            setRows(
              r.map((x: ExternalDomainHealthRow) => ({
                key: x.domain,
                badge:
                  x.errorRatePercent === 0
                    ? 'OK'
                    : x.errorRatePercent < 10
                      ? 'WARN'
                      : 'BAD',
                // Bar = error count so the worst domains spike visually;
                // value label shows the breakdown.
                count: x.errorCount,
                valueLabel: `${x.successCount}/${x.totalUrls} OK · ${x.errorRatePercent}% err${
                  x.avgResponseTimeMs !== null ? ` · ${x.avgResponseTimeMs}ms avg` : ''
                }`,
              })),
            );
        } else if (kind === 'analytics-coverage') {
          const r = await window.freecrawl.reportsAnalyticsCoverage();
          if (!cancelled)
            setRows(
              r.map((x: AnalyticsCoverageRow) => ({
                key: x.name,
                count: x.pageCount,
                valueLabel: `${x.pageCount.toLocaleString()} pages · ${x.distinctIds} distinct ID${
                  x.distinctIds === 1 ? '' : 's'
                }${x.sampleIds.length > 0 ? ` · ${x.sampleIds.join(', ')}` : ''}`,
              })),
            );
        } else if (kind === 'link-positions') {
          const r = await window.freecrawl.reportsLinkPositions();
          if (!cancelled)
            setRows(
              r.map((x: LinkPositionRow) => ({
                key: x.position,
                count: x.count,
              })),
            );
        } else if (kind === 'image-weight') {
          const r = await window.freecrawl.reportsImageWeightPerPage(25);
          if (!cancelled)
            setRows(
              r.map((x: ImageWeightRow) => ({
                key: x.url,
                count: x.imageBytes,
                valueLabel: `${VALUE_FORMAT['image-weight'](x.imageBytes)} · ${
                  x.imageCount
                } image${x.imageCount === 1 ? '' : 's'}`,
              })),
            );
        } else if (kind === 'inlinks-histogram') {
          const r = await window.freecrawl.reportsInlinksHistogram();
          if (!cancelled)
            setRows(r.map((x: BucketHistogramRow) => ({ key: x.label, count: x.count })));
        } else if (kind === 'word-count-histogram') {
          const r = await window.freecrawl.reportsWordCountHistogram();
          if (!cancelled)
            setRows(r.map((x: BucketHistogramRow) => ({ key: x.label, count: x.count })));
        } else if (kind === 'url-length-histogram') {
          const r = await window.freecrawl.reportsUrlLengthHistogram();
          if (!cancelled)
            setRows(r.map((x: BucketHistogramRow) => ({ key: x.label, count: x.count })));
        } else if (kind === 'word-count-per-dir') {
          const r = await window.freecrawl.reportsWordCountPerDirectory({
            depth,
            limit: 1000,
          });
          if (!cancelled)
            setRows(
              r.map((x: WordCountPerDirectoryRow) => ({
                key: x.directory,
                // Bar metric is the avg word count so the deepest-content
                // directories visually spike; secondary value shows page
                // count so the user can spot single-page outliers.
                count: x.avgWordCount,
                valueLabel: `${x.avgWordCount.toLocaleString()} avg · ${x.pageCount.toLocaleString()} page${
                  x.pageCount === 1 ? '' : 's'
                }`,
              })),
            );
        } else if (kind === 'sitemap-orphans') {
          const r = await window.freecrawl.reportsSitemapOrphans(1000);
          if (!cancelled)
            setRows(
              r.map((x: SitemapOrphanRow) => ({
                key: x.url,
                // Constant bar (1) keeps every row visually equal — there
                // is no metric to scale against; the meaning is "this URL
                // is in the sitemap but never crawled". Lastmod + source
                // sitemap go to the secondary value column.
                count: 1,
                valueLabel: [
                  x.lastmod ? `lastmod ${x.lastmod}` : null,
                  x.sourceSitemap ? `from ${x.sourceSitemap}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || '—',
              })),
            );
        } else if (kind === 'orphan-cross-source') {
          const r = await window.freecrawl.reportsOrphanCrossSource(1000);
          if (!cancelled)
            setRows(
              r.map((x: OrphanCrossSourceRow) => ({
                key: x.url,
                count: 1,
                // `sources` (sitemap / gsc / ga4) goes in the secondary
                // value column so the user can triage why each URL was
                // missed by the crawl — sitemap-only often means a
                // broken internal-link path; GSC + GA4 means real
                // user-visited pages no crawl path reaches.
                valueLabel: x.sources.join(' + '),
              })),
            );
        } else if (kind === 'server-headers') {
          const r = await window.freecrawl.reportsServerHeaders();
          if (!cancelled)
            setRows(r.map((x: ServerHeaderRow) => ({ key: x.server, count: x.count })));
        } else if (kind === 'top-words') {
          const r = await window.freecrawl.reportsTopWords({ limit: 100, minLength: 3 });
          if (!cancelled)
            setRows(
              r.map((x: TopWordsRow) => ({
                key: x.word,
                // Bar metric is total occurrence count so the loudest
                // terms spike visually. Page-coverage is shown beside it
                // so the user can spot "high count, narrow coverage" =
                // a single page repeating a word.
                count: x.count,
                valueLabel: `${x.count.toLocaleString()} hits · ${x.pages.toLocaleString()} page${
                  x.pages === 1 ? '' : 's'
                }`,
              })),
            );
        } else {
          const metric = TOP_URL_METRIC[kind];
          if (metric) {
            const direction = kind === 'least-inlinks' ? 'asc' : 'desc';
            const r = await window.freecrawl.reportsTopUrls({
              metric,
              limit: 25,
              direction,
            });
            if (!cancelled)
              setRows(
                r.map((x: TopUrlsRow) => ({
                  key: x.url,
                  // Bar metric is the value itself (response time, inlinks, etc.).
                  count: x.value ?? 0,
                  valueLabel: VALUE_FORMAT[kind](x.value),
                })),
              );
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, kind, depth]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-[760px] flex-col rounded-md border border-surface-700 bg-surface-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-surface-800 px-4 py-2.5">
          <div className="text-sm font-semibold tracking-wide text-surface-100">
            {reportLabels[kind]}
          </div>
          <button
            className="ml-auto rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
            onClick={onClose}
            title={t('scheduled.closeEsc', { defaultValue: 'Close (Esc)' })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-surface-800 bg-surface-900/50 px-4 py-2 text-[11px]">
          <label className="flex items-center gap-1.5">
            <span className="text-surface-400">{t('reports.reportLabel', { defaultValue: 'Report' })}</span>
            <select
              className="rounded border border-surface-700 bg-surface-950 px-2 py-0.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
              value={kind}
              onChange={(e) => setKind(e.target.value as ReportKind)}
            >
              {(Object.keys(reportLabels) as ReportKind[]).map((k) => (
                <option key={k} value={k}>{reportLabels[k]}</option>
              ))}
            </select>
          </label>
          {(kind === 'pages-per-dir' || kind === 'word-count-per-dir') && (
            <label className="flex items-center gap-1.5">
              <span className="text-surface-400">{t('reports.groupAtDepth', { defaultValue: 'Group at depth' })}</span>
              <select
                className="rounded border border-surface-700 bg-surface-950 px-2 py-0.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
                value={depth}
                onChange={(e) => setDepth(Number.parseInt(e.target.value, 10))}
              >
                <option value={1}>{t('reports.depthTopLevel', { defaultValue: '1 (top-level)' })}</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </label>
          )}
          <span className="ml-auto text-surface-500">
            {loading
              ? t('common.loading', { defaultValue: 'Loading…' })
              : t('reports.summary', {
                  defaultValue: '{{rows}} rows · {{urls}} URLs',
                  rows: rows.length.toLocaleString(),
                  urls: total.toLocaleString(),
                })}
          </span>
        </div>

        <div className="flex-1 overflow-auto px-4 py-3 text-[11px]">
          {rows.length === 0 && !loading && (
            <div className="p-6 text-center text-surface-500">
              {t('reports.noData', { defaultValue: 'No data — run a crawl first.' })}
            </div>
          )}
          {rows.length > 0 && (
            <table className="w-full">
              <thead className="sticky top-0 bg-surface-900">
                <tr className="text-surface-400">
                  <th className="w-2/3 py-1 pr-3 text-left font-medium">{keyLabels[kind]}</th>
                  <th className="w-24 py-1 pr-3 text-right font-medium">{t('reports.count', { defaultValue: 'Count' })}</th>
                  <th className="py-1 text-left font-medium">{t('reports.share', { defaultValue: 'Share' })}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const widthPct = max > 0 ? Math.round((r.count / max) * 100) : 0;
                  const sharePct = total > 0 ? ((r.count / total) * 100).toFixed(1) : '0.0';
                  return (
                    <tr
                      key={r.key}
                      className="border-b border-surface-900 last:border-0 hover:bg-surface-900/50"
                    >
                      <td className="break-all py-1 pr-3 align-top font-mono text-surface-100">
                        {r.badge && (
                          <span className="mr-2 rounded bg-surface-800 px-1.5 py-0.5 text-[9px] uppercase text-surface-400">
                            {r.badge}
                          </span>
                        )}
                        {r.key}
                      </td>
                      <td className="py-1 pr-3 text-right align-top font-mono text-surface-100">
                        {r.valueLabel ?? r.count.toLocaleString()}
                      </td>
                      <td className="py-1 align-top">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-32 rounded bg-surface-800">
                            <div
                              className="h-full rounded bg-blue-600"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-surface-400">
                            {sharePct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-surface-800 px-4 py-2.5">
          <button
            className="rounded border border-surface-700 px-3 py-1 text-[11px] hover:bg-surface-800"
            onClick={onClose}
          >
            {t('common.close', { defaultValue: 'Close' })}
          </button>
        </div>
      </div>
    </div>
  );
}

function statusBadge(status: number | null): string {
  if (status === null) return 'NET';
  if (status >= 200 && status < 300) return '2xx';
  if (status >= 300 && status < 400) return '3xx';
  if (status >= 400 && status < 500) return '4xx';
  if (status >= 500 && status < 600) return '5xx';
  return '?';
}

/**
 * One-letter perf class for a response-time bucket label. Lets users skim
 * the histogram for "where am I losing performance?" without re-reading
 * the bucket boundaries.
 */
function rtBadge(label: string): string {
  if (label === 'No response') return 'ERR';
  if (label === '< 100ms' || label === '100–500ms') return 'OK';
  if (label === '500ms–1s') return 'WARN';
  return 'SLOW';
}

/**
 * Friendly label for the `indexability` enum the crawler writes. Keeps the
 * machine-friendly token (`non-indexable:robots-blocked`) out of the UI so
 * the dropdown reads naturally — Title Case + human-readable suffix.
 */
function indexabilityLabel(value: string): string {
  switch (value) {
    case 'indexable':
      return 'Indexable';
    case 'non-indexable:noindex':
      return 'Non-indexable — noindex';
    case 'non-indexable:canonical':
      return 'Non-indexable — canonicalised';
    case 'non-indexable:robots-blocked':
      return 'Non-indexable — robots-blocked';
    case 'non-indexable:redirect':
      return 'Non-indexable — redirect';
    case 'non-indexable:client-error':
      return 'Non-indexable — 4xx';
    case 'non-indexable:server-error':
      return 'Non-indexable — 5xx';
    default:
      return value;
  }
}

/**
 * Friendly label for the `content_kind` enum (html / css / js / image /
 * font / pdf / other). Upper-cases acronyms (HTML/CSS/JS/PDF) so the chart
 * matches the way users talk about file types.
 */
function contentKindLabel(value: string): string {
  switch (value) {
    case 'html':
      return 'HTML';
    case 'css':
      return 'CSS';
    case 'js':
      return 'JavaScript';
    case 'image':
      return 'Image';
    case 'font':
      return 'Font';
    case 'pdf':
      return 'PDF';
    case 'other':
      return 'Other';
    default:
      return value;
  }
}
