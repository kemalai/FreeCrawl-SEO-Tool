import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ProjectDb } from '@freecrawl/db';
import type {
  CrawlSummary,
  IssueSeverity,
  IssueUrlSample,
  OverviewCounts,
  ReportBranding,
  UrlCategory,
} from '@freecrawl/shared-types';
import { SEVERITY_LABEL, summarizeIssues, type IssueSummary } from './issue-summary.js';

/**
 * Self-contained HTML audit report for a finished crawl. Single-file
 * deliverable — no external CSS, no JS, no remote assets — so it can be
 * emailed, archived, or hosted as-is. Designed to be readable on a
 * laptop screen and printable on A4 in portrait without re-flowing.
 *
 * Sections:
 *   - Header: site, run timestamp, total URL count, crawl duration.
 *   - Summary cards: status mix, indexability mix, payload mix.
 *   - Top issues table: every non-zero issue with its count, ranked by
 *     severity (critical → warning → info), each linking to its section.
 *   - Issue details: per issue, the advice and the first affected pages
 *     (`maxUrlsPerIssue`); the full lists are in the Issues export.
 *   - Sample tables: top 25 slowest URLs, top 25 deepest URLs, top 25
 *     URLs with the most outlinks. Capped on purpose — the user goes to
 *     the live UI for full data.
 *
 * Streams to disk via `Readable.from` + `pipeline` so memory stays
 * bounded even on a 1M-URL crawl.
 */
export interface HtmlReportOptions {
  startUrl: string;
  generatedAt?: Date;
  /** White-label header: brand name, logo, accent colour, "prepared by". */
  branding?: ReportBranding;
  /** Affected pages listed under each issue. Default 100. */
  maxUrlsPerIssue?: number;
  /**
   * The database reads, already done. The desktop app runs them on its
   * reader worker so a large project does not stall the main process;
   * without it they run here, on `db`.
   */
  data?: HtmlReportData;
}

/** Everything the report reads from the project — see {@link collectHtmlReportData}. */
export interface HtmlReportData {
  summary: CrawlSummary;
  counts: OverviewCounts;
  slowest: { url: string; value: number | null }[];
  deepest: { url: string; value: number | null }[];
  fanout: { url: string; value: number | null }[];
  /**
   * `issues:*` category → its first affected pages, fetched with
   * {@link issueSampleLimit} — one past the cap, so the report knows
   * whether the list goes on.
   */
  issueUrls: Record<string, IssueUrlSample[]>;
}

export const DEFAULT_MAX_URLS_PER_ISSUE = 100;

/** The issue categories whose affected pages the report lists. */
export function htmlReportIssueCategories(counts: OverviewCounts): UrlCategory[] {
  return summarizeIssues(counts).map((i) => i.category);
}

/** Rows to fetch per issue for a report listing `maxUrlsPerIssue`. */
export function issueSampleLimit(maxUrlsPerIssue = DEFAULT_MAX_URLS_PER_ISSUE): number {
  return maxUrlsPerIssue + 1;
}

/** Every read the report needs, done synchronously on `db`. */
export function collectHtmlReportData(db: ProjectDb, maxUrlsPerIssue?: number): HtmlReportData {
  const counts = db.getOverviewCounts();
  return {
    summary: db.getSummary(),
    counts,
    slowest: db.topUrlsBy('response_time_ms', 25),
    deepest: db.topUrlsBy('depth', 25),
    fanout: db.topUrlsBy('outlinks', 25),
    issueUrls: db.issueUrlSamples(
      htmlReportIssueCategories(counts),
      issueSampleLimit(maxUrlsPerIssue),
    ),
  };
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtNum(n: number): string {
  return n.toLocaleString();
}

const STYLE = `
body { font: 13px/1.5 -apple-system, "Segoe UI", system-ui, sans-serif;
  color: #1f2937; background: #f9fafb; margin: 0; padding: 24px; }
h1 { font-size: 20px; margin: 0 0 4px; color: var(--accent, #111827); }
.hdr { display: flex; align-items: center; gap: 14px; }
.hdr .logo { max-height: 44px; max-width: 160px; object-fit: contain; }
.recs { padding-left: 20px; margin: 0; }
.recs li { margin: 0 0 8px; }
.muted { color: #6b7280; font-size: 12px; }
.grid { display: grid; gap: 12px; grid-template-columns: repeat(4, 1fr); margin: 16px 0 24px; }
.card { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; }
.card .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .04em; }
.card .value { font-size: 22px; font-weight: 600; margin-top: 4px; color: #111827; }
section { margin: 28px 0 0; }
section > h2 { font-size: 14px; margin: 0 0 8px; color: #111827;
  border-bottom: 2px solid var(--accent, #e5e7eb); padding-bottom: 4px; }
table { width: 100%; border-collapse: collapse; background: white;
  border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #f3f4f6;
  font-size: 12px; vertical-align: top; }
th { background: #f9fafb; font-weight: 600; color: #374151; font-size: 11px;
  text-transform: uppercase; letter-spacing: .04em; }
tr:last-child td { border-bottom: none; }
.right { text-align: right; }
.mono { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px; word-break: break-all; }
.sev-critical { color: #dc2626; font-weight: 600; }
.sev-warning  { color: #d97706; font-weight: 600; }
.sev-info     { color: #2563eb; }
a { color: inherit; }
details.issue { margin: 0 0 14px; }
details.issue > summary { cursor: pointer; font-weight: 600; font-size: 13px; color: #111827; margin: 0 0 6px; }
details.issue p { margin: 0 0 6px; }
@media print { body { background: white; padding: 12px; } .card { break-inside: avoid; }
  details.issue > summary { break-after: avoid; } }
`;

/** Tier badge, styled `sev-critical` / `sev-warning` / `sev-info`. */
function sevBadge(severity: IssueSeverity): string {
  return `<span class="sev-${severity}">${SEVERITY_LABEL[severity].toUpperCase()}</span>`;
}

function issueAnchor(index: number): string {
  return `issue-${index + 1}`;
}

function urlWord(n: number): string {
  return n === 1 ? 'URL' : 'URLs';
}

function renderRecommendations(issues: IssueSummary[]): string {
  const top = issues.slice(0, 12);
  if (top.length === 0) return '<p class="muted">Nothing to recommend — no issues were detected.</p>';
  const items = top
    .map(
      (r) =>
        `<li><span class="sev-${r.severity}">${escape(r.title)}</span> <span class="muted">(${fmtNum(r.count)} ${urlWord(r.count)})</span><br>${escape(r.advice)}</li>`,
    )
    .join('');
  return `<ol class="recs">${items}</ol>`;
}

function renderHeader(options: HtmlReportOptions, generatedAt: Date): string {
  const b = options.branding ?? {};
  const brand = (b.brandName ?? '').trim();
  const logo = b.logoDataUrl && /^data:image\//.test(b.logoDataUrl)
    ? `<img class="logo" src="${b.logoDataUrl}" alt="" />`
    : '';
  const title = brand ? `${escape(brand)} — SEO Report` : 'FreeCrawl SEO Report';
  const preparedBy = (b.preparedBy ?? '').trim();
  return (
    `<header class="hdr">${logo}<div><h1>${title}</h1>` +
    `<div class="muted">Site: <span class="mono">${escape(options.startUrl)}</span> · Generated: ${escape(generatedAt.toISOString())}` +
    (preparedBy ? ` · Prepared by: ${escape(preparedBy)}` : '') +
    `</div></div></header>`
  );
}

function accentStyle(options: HtmlReportOptions): string {
  const raw = (options.branding?.accentColor ?? '').trim();
  const ok = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(raw);
  return ok ? `:root{--accent:${raw}}` : '';
}

/** Site-wide findings that belong to no single URL (shown above the issue table). */
function renderSiteNotices(counts: OverviewCounts): string {
  let out = '';
  const blocked = counts.site?.botBlocked;
  if (blocked) {
    out +=
      `<p><span class="sev-warning">WARNING</span> Bot protection blocked ${fmtNum(blocked.count)} ` +
      `URL${blocked.count === 1 ? '' : 's'}` +
      (blocked.sample ? ` (<span class="mono">${escape(blocked.sample)}</span>)` : '') +
      `: they were not crawled, so this report has no data on them and leaves them out of the ` +
      `broken-link and sitemap checks. Lower the crawl speed or allowlist the crawler, then re-crawl.</p>`;
  }
  const probe = counts.site?.soft404Probe;
  if (!probe) return out;
  const via = probe.finalUrl
    ? ` after redirecting to <span class="mono">${escape(probe.finalUrl)}</span>`
    : '';
  return (
    out +
    `<p><span class="sev-warning">WARNING</span> Missing pages return ${probe.status}: ` +
    `<span class="mono">${escape(probe.url)}</span>, a page that does not exist, was answered ` +
    `${probe.status}${via} instead of 404. Broken links on this site look like working pages ` +
    `to search engines (soft 404) — return a real 404 or 410 for missing URLs.</p>`
  );
}

function renderIssues(issues: IssueSummary[], counts: OverviewCounts): string {
  const notices = renderSiteNotices(counts);
  if (issues.length === 0) {
    return notices || '<p class="muted">No issues detected. Nice.</p>';
  }
  const body = issues
    .map(
      (r, i) => `<tr>
        <td>${sevBadge(r.severity)}</td>
        <td><a href="#${issueAnchor(i)}">${escape(r.title)}</a></td>
        <td class="right mono">${fmtNum(r.count)}</td>
      </tr>`,
    )
    .join('');
  return `${notices}<table><thead><tr><th>Severity</th><th>Issue</th><th class="right">URLs</th></tr></thead><tbody>${body}</tbody></table>`;
}

/**
 * One section per issue: the advice, then its first affected pages. Each
 * starts open (`<details open>`) so the PDF prints every list, while the
 * HTML file still lets a reader fold sections away.
 */
function renderIssueDetails(
  issues: IssueSummary[],
  issueUrls: Record<string, IssueUrlSample[]>,
  maxUrlsPerIssue: number,
): string {
  if (issues.length === 0) return '<p class="muted">No issues detected.</p>';
  return issues
    .map((issue, i) => {
      const sampled = issueUrls[issue.category] ?? [];
      const rows = sampled.slice(0, maxUrlsPerIssue);
      const table =
        rows.length === 0
          ? ''
          : `<table><thead><tr><th>URL</th><th class="right">Status</th><th>Indexability</th></tr></thead><tbody>${rows
              .map(
                (r) =>
                  `<tr><td class="mono">${escape(r.url)}</td><td class="right mono">${
                    r.statusCode === null ? '—' : r.statusCode
                  }</td><td>${escape(r.indexability ?? '')}</td></tr>`,
              )
              .join('')}</tbody></table>`;
      // Some counters count images or links (Images: Missing Alt, Links:
      // Broken) while the list holds the pages behind them, so "more" is
      // judged by the one extra sampled row, not by the count.
      const more =
        sampled.length > rows.length
          ? `<p class="muted">Showing the first ${fmtNum(rows.length)} affected pages. File → Export Issues Report lists all of them.</p>`
          : '';
      return (
        `<details class="issue" id="${issueAnchor(i)}" open>` +
        `<summary>${sevBadge(issue.severity)} ${escape(issue.title)} <span class="muted">— ${fmtNum(issue.count)} ${urlWord(issue.count)}</span></summary>` +
        `<p>${escape(issue.advice)}</p>${table}${more}</details>`
      );
    })
    .join('');
}

export async function exportHtmlReport(
  db: ProjectDb,
  filePath: string,
  options: HtmlReportOptions,
): Promise<{ filePath: string; bytesWritten: number }> {
  let bytesWritten = 0;
  const counter = new (await import('node:stream')).Transform({
    transform(chunk, _enc, cb) {
      bytesWritten += chunk.length;
      cb(null, chunk);
    },
  });
  await pipeline(
    Readable.from(htmlReportChunks(db, options)),
    counter,
    createWriteStream(filePath, { encoding: 'utf8' }),
  );
  return { filePath, bytesWritten };
}

/** The whole report as one string — what the PDF export hands to Chromium. */
export async function renderHtmlReport(db: ProjectDb, options: HtmlReportOptions): Promise<string> {
  const parts: string[] = [];
  for await (const chunk of htmlReportChunks(db, options)) parts.push(chunk);
  return parts.join('');
}

async function* htmlReportChunks(
  db: ProjectDb,
  options: HtmlReportOptions,
): AsyncGenerator<string> {
  // Sample tables are capped at 25 rows each to keep the report
  // scannable; the live UI is the right place for the full data set.
  const maxUrlsPerIssue = options.maxUrlsPerIssue ?? DEFAULT_MAX_URLS_PER_ISSUE;
  const data = options.data ?? collectHtmlReportData(db, maxUrlsPerIssue);
  const { summary, counts } = data;
  const issues = summarizeIssues(counts, db.getIssueSeverityOverrides());
  const generatedAt = options.generatedAt ?? new Date();

  function rowsTable(
    label: string,
    rows: { url: string; value: number | null }[],
    valueLabel: string,
  ): string {
    if (rows.length === 0) return `<p class="muted">No data — ${escape(label)}.</p>`;
    const body = rows
      .map(
        (r) =>
          `<tr><td class="mono">${escape(r.url)}</td><td class="right mono">${escape(
            r.value === null ? '—' : String(r.value),
          )}</td></tr>`,
      )
      .join('');
    return `<table><thead><tr><th>URL</th><th class="right">${escape(valueLabel)}</th></tr></thead><tbody>${body}</tbody></table>`;
  }

  const gen = async function* (): AsyncGenerator<string> {
    const brand = (options.branding?.brandName ?? '').trim();
    yield `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${escape(brand || 'FreeCrawl')} SEO Report — ${escape(options.startUrl)}</title><style>${STYLE}${accentStyle(options)}</style></head><body>`;
    yield renderHeader(options, generatedAt);

    yield `<div class="grid">
      <div class="card"><div class="label">URLs Crawled</div><div class="value">${fmtNum(summary.total)}</div></div>
      <div class="card"><div class="label">Indexable</div><div class="value">${fmtNum(summary.byIndexability['indexable'] ?? 0)}</div></div>
      <div class="card"><div class="label">Avg Response (ms)</div><div class="value">${fmtNum(Math.round(summary.avgResponseTimeMs))}</div></div>
      <div class="card"><div class="label">Total Bytes</div><div class="value">${fmtNum(summary.totalBytes)}</div></div>
    </div>`;

    yield `<section><h2>Issues</h2>${renderIssues(issues, counts)}</section>`;
    yield `<section><h2>Recommendations</h2>${renderRecommendations(issues)}</section>`;
    yield `<section><h2>Issue Details</h2>${renderIssueDetails(issues, data.issueUrls, maxUrlsPerIssue)}</section>`;
    yield `<section><h2>Top 25 Slowest URLs</h2>${rowsTable('slowest', data.slowest, 'ms')}</section>`;
    yield `<section><h2>Top 25 Deepest URLs</h2>${rowsTable('deepest', data.deepest, 'depth')}</section>`;
    yield `<section><h2>Top 25 Outlink-Heavy URLs</h2>${rowsTable('fanout', data.fanout, 'outlinks')}</section>`;
    yield `</body></html>`;
  };
  yield* gen();
}
