import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ProjectDb } from '@freecrawl/db';
import type { CrawlSummary, OverviewCounts } from '@freecrawl/shared-types';

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
 *     severity bucket (errors → warnings → info).
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
h1 { font-size: 20px; margin: 0 0 4px; }
.muted { color: #6b7280; font-size: 12px; }
.grid { display: grid; gap: 12px; grid-template-columns: repeat(4, 1fr); margin: 16px 0 24px; }
.card { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; }
.card .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .04em; }
.card .value { font-size: 22px; font-weight: 600; margin-top: 4px; color: #111827; }
section { margin: 28px 0 0; }
section > h2 { font-size: 14px; margin: 0 0 8px; color: #111827;
  border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
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
.sev-error { color: #dc2626; font-weight: 600; }
.sev-warn  { color: #d97706; font-weight: 600; }
.sev-info  { color: #2563eb; }
@media print { body { background: white; padding: 12px; } .card { break-inside: avoid; } }
`;

interface IssueDef {
  key: keyof OverviewCounts['issues'];
  label: string;
  severity: 'error' | 'warn' | 'info';
}

const ISSUES: IssueDef[] = [
  { key: 'titleMissing', label: 'Title Missing', severity: 'error' },
  { key: 'titleDuplicate', label: 'Title Duplicate', severity: 'error' },
  { key: 'titleTooLong', label: 'Title Too Long (>60)', severity: 'warn' },
  { key: 'titleTooShort', label: 'Title Too Short (<30)', severity: 'warn' },
  { key: 'metaMissing', label: 'Meta Description Missing', severity: 'error' },
  { key: 'metaDuplicate', label: 'Meta Description Duplicate', severity: 'error' },
  { key: 'metaTooLong', label: 'Meta Description Too Long (>160)', severity: 'warn' },
  { key: 'metaTooShort', label: 'Meta Description Too Short (<120)', severity: 'warn' },
  { key: 'h1Missing', label: 'H1 Missing', severity: 'error' },
  { key: 'h1Duplicate', label: 'H1 Duplicate', severity: 'error' },
  { key: 'h1Multiple', label: 'Multiple H1s', severity: 'warn' },
  { key: 'headingSkippedLevel', label: 'Skipped Heading Level', severity: 'warn' },
  { key: 'multipleCanonicals', label: 'Multiple Canonicals', severity: 'error' },
  { key: 'canonicalMissing', label: 'Canonical Missing', severity: 'warn' },
  { key: 'canonicalToNon200', label: 'Canonical → Non-200', severity: 'error' },
  { key: 'canonicalToRedirect', label: 'Canonical → Redirect', severity: 'warn' },
  { key: 'canonicalToNoindex', label: 'Canonical → Noindex', severity: 'error' },
  { key: 'canonicalMismatch', label: 'Canonical HTTP/HTML Mismatch', severity: 'error' },
  { key: 'contentThin', label: 'Thin Content (<300 words)', severity: 'warn' },
  { key: 'nearDuplicate', label: 'Near-Duplicate Content', severity: 'warn' },
  { key: 'duplicateContentExact', label: 'Duplicate Content (exact)', severity: 'error' },
  { key: 'responseSlow', label: 'Slow Response (>1s)', severity: 'warn' },
  { key: 'responseVerySlow', label: 'Very Slow Response (>3s)', severity: 'error' },
  { key: 'pageLarge', label: 'Large Page (>1MB)', severity: 'warn' },
  { key: 'urlTooLong', label: 'URL Too Long (>2048)', severity: 'warn' },
  { key: 'urlManyParams', label: 'Many Query Params (>5)', severity: 'info' },
  { key: 'redirectLoop', label: 'Redirect Loop', severity: 'error' },
  { key: 'redirectChainLong', label: 'Long Redirect Chain (>3)', severity: 'warn' },
  { key: 'redirectSelf', label: 'Self-Redirect', severity: 'error' },
  { key: 'mixedContent', label: 'Mixed Content', severity: 'error' },
  { key: 'imageMissingAlt', label: 'Image Missing Alt', severity: 'warn' },
  { key: 'metaRefreshUsed', label: 'Meta Refresh Used', severity: 'warn' },
  { key: 'compressionMissing', label: 'Compression Missing', severity: 'warn' },
  { key: 'cspMissing', label: 'CSP Missing', severity: 'info' },
  { key: 'hstsMissing', label: 'HSTS Missing', severity: 'info' },
  { key: 'xFrameOptionsMissing', label: 'X-Frame-Options Missing', severity: 'info' },
  { key: 'xContentTypeOptionsMissing', label: 'X-Content-Type-Options Missing', severity: 'info' },
  { key: 'viewportMissing', label: 'Viewport Missing', severity: 'warn' },
  { key: 'langMissing', label: 'lang Attribute Missing', severity: 'info' },
  { key: 'ogMissing', label: 'OpenGraph Tags Missing', severity: 'info' },
  { key: 'twitterMissing', label: 'Twitter Card Missing', severity: 'info' },
  { key: 'structuredDataMissing', label: 'JSON-LD Missing', severity: 'info' },
  { key: 'structuredDataInvalid', label: 'Invalid JSON-LD', severity: 'error' },
  { key: 'paginationBroken', label: 'Pagination Broken', severity: 'error' },
  { key: 'hreflangXDefaultMissing', label: 'Hreflang x-default Missing', severity: 'warn' },
  { key: 'hreflangInvalidCode', label: 'Hreflang Invalid Code', severity: 'error' },
  { key: 'hreflangSelfRefMissing', label: 'Hreflang Self-Ref Missing', severity: 'error' },
  { key: 'hreflangReciprocityMissing', label: 'Hreflang Reciprocity Missing', severity: 'warn' },
  { key: 'hreflangTargetIssues', label: 'Hreflang Target Issues', severity: 'error' },
  { key: 'faviconMissing', label: 'Favicon Missing', severity: 'info' },
  { key: 'charsetMissing', label: 'Charset Missing', severity: 'warn' },
  { key: 'nonIndexableInSitemap', label: 'Non-Indexable in Sitemap', severity: 'error' },
  { key: 'non200InSitemap', label: 'Non-200 in Sitemap', severity: 'error' },
  { key: 'redirectInSitemap', label: 'Redirect in Sitemap', severity: 'warn' },
  { key: 'crawledNotInSitemap', label: 'Crawled, Not in Sitemap', severity: 'info' },
  { key: 'brokenLinksInternal', label: 'Broken Internal Links', severity: 'error' },
  { key: 'brokenLinksExternal', label: 'Broken External Links', severity: 'warn' },
];

const SEV_RANK: Record<IssueDef['severity'], number> = { error: 0, warn: 1, info: 2 };

function renderIssues(counts: OverviewCounts): string {
  const rows = ISSUES.map((d) => {
    const c = counts.issues[d.key] as number;
    return { ...d, count: c };
  })
    .filter((r) => r.count > 0)
    .sort((a, b) =>
      SEV_RANK[a.severity] - SEV_RANK[b.severity] || b.count - a.count,
    );
  if (rows.length === 0) {
    return '<p class="muted">No issues detected. Nice.</p>';
  }
  const body = rows
    .map(
      (r) => `<tr>
        <td><span class="sev-${r.severity === 'warn' ? 'warn' : r.severity === 'error' ? 'error' : 'info'}">${r.severity.toUpperCase()}</span></td>
        <td>${escape(r.label)}</td>
        <td class="right mono">${fmtNum(r.count)}</td>
      </tr>`,
    )
    .join('');
  return `<table><thead><tr><th>Severity</th><th>Issue</th><th class="right">URLs</th></tr></thead><tbody>${body}</tbody></table>`;
}

export async function exportHtmlReport(
  db: ProjectDb,
  filePath: string,
  options: HtmlReportOptions,
): Promise<{ filePath: string; bytesWritten: number }> {
  const summary: CrawlSummary = db.getSummary();
  const counts: OverviewCounts = db.getOverviewCounts();
  const generatedAt = options.generatedAt ?? new Date();

  // Sample tables — three small SELECTs straight out of the URL table.
  // Capped at 25 rows each to keep the report scannable; the live UI is
  // the right place for the full data set.
  const slowestRows = db.topUrlsBy('response_time_ms', 25);
  const deepestRows = db.topUrlsBy('depth', 25);
  const fanoutRows = db.topUrlsBy('outlinks', 25);

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

  let bytesWritten = 0;

  const gen = async function* (): AsyncGenerator<string> {
    yield `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>FreeCrawl SEO Report — ${escape(options.startUrl)}</title><style>${STYLE}</style></head><body>`;
    yield `<h1>FreeCrawl SEO Report</h1>`;
    yield `<div class="muted">Site: <span class="mono">${escape(options.startUrl)}</span> · Generated: ${escape(generatedAt.toISOString())}</div>`;

    yield `<div class="grid">
      <div class="card"><div class="label">URLs Crawled</div><div class="value">${fmtNum(summary.total)}</div></div>
      <div class="card"><div class="label">Indexable</div><div class="value">${fmtNum(summary.byIndexability['indexable'] ?? 0)}</div></div>
      <div class="card"><div class="label">Avg Response (ms)</div><div class="value">${fmtNum(Math.round(summary.avgResponseTimeMs))}</div></div>
      <div class="card"><div class="label">Total Bytes</div><div class="value">${fmtNum(summary.totalBytes)}</div></div>
    </div>`;

    yield `<section><h2>Issues</h2>${renderIssues(counts)}</section>`;
    yield `<section><h2>Top 25 Slowest URLs</h2>${rowsTable('slowest', slowestRows, 'ms')}</section>`;
    yield `<section><h2>Top 25 Deepest URLs</h2>${rowsTable('deepest', deepestRows, 'depth')}</section>`;
    yield `<section><h2>Top 25 Outlink-Heavy URLs</h2>${rowsTable('fanout', fanoutRows, 'outlinks')}</section>`;
    yield `</body></html>`;
  };

  const counter = new (await import('node:stream')).Transform({
    transform(chunk, _enc, cb) {
      bytesWritten += chunk.length;
      cb(null, chunk);
    },
  });

  await pipeline(
    Readable.from(gen()),
    counter,
    createWriteStream(filePath, { encoding: 'utf8' }),
  );

  return { filePath, bytesWritten };
}
