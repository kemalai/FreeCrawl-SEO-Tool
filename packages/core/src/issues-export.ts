import { writeFileSync } from 'node:fs';
import type { ProjectDb } from '@freecrawl/db';
import type { CrawlUrlRow, OverviewCounts } from '@freecrawl/shared-types';
import { ensureHeapHeadroom } from './heap-guard.js';
import { SEVERITY_LABEL, summarizeIssues } from './issue-summary.js';
import { buildXlsxBuffer, sanitizeSheetName, writeCsvFile } from './tabular-export.js';

/**
 * Issues report: every issue with its affected pages, in one file.
 *
 *   - `.xlsx` — an "Issues Overview" sheet (severity, issue, count,
 *     pages, advice, sheet name), then one sheet per issue listing the
 *     pages the sidebar filter shows for it, ranked like the overview.
 *   - `.csv`  — the same rows as one long table with Issue and Severity
 *     columns in front, for spreadsheets and scripts.
 *
 * Unlike the HTML / PDF report it lists every affected page. Built from
 * the sidebar's issue catalog, so it covers every check — Bulk Export
 * covers a fixed subset.
 */
export interface IssuesExportOptions {
  format: 'xlsx' | 'csv';
  /** Overview counts already computed (the desktop reads them on its
   *  reader worker); computed on `db` when absent. */
  counts?: OverviewCounts;
  /** Prefix the CSV with a UTF-8 BOM for Excel on Windows. Default true. */
  csvBom?: boolean;
}

export interface IssuesExportResult {
  filePath: string;
  /** Issues with at least one affected URL. */
  issues: number;
  /** Page rows written across every issue. */
  rowsWritten: number;
}

/** The page columns of every issue, in Screaming Frog's spelling. */
const PAGE_COLUMNS: readonly (readonly [header: string, read: (r: CrawlUrlRow) => unknown])[] = [
  ['Address', (r) => r.url],
  ['Content Type', (r) => r.contentType],
  ['Status Code', (r) => r.statusCode],
  ['Status', (r) => r.statusText],
  ['Indexability', (r) => r.indexability],
  ['Indexability Status', (r) => r.indexabilityReason],
  ['Title 1', (r) => r.title],
  ['Inlinks', (r) => r.inlinks],
  ['Crawl Depth', (r) => r.depth],
];
const PAGE_HEADERS = PAGE_COLUMNS.map(([header]) => header);

const OVERVIEW_HEADERS = ['Severity', 'Issue', 'Count', 'Affected Pages', 'How to Fix', 'Sheet'];

/** Data rows one worksheet can hold (1,048,576 minus the header row). */
const XLSX_MAX_DATA_ROWS = 1_048_575;

function pageRecord(row: CrawlUrlRow): Record<string, unknown> {
  const rec: Record<string, unknown> = {};
  for (const [header, read] of PAGE_COLUMNS) rec[header] = read(row);
  return rec;
}

export async function exportIssues(
  db: ProjectDb,
  outputPath: string,
  options: IssuesExportOptions,
): Promise<IssuesExportResult> {
  const issues = summarizeIssues(
    options.counts ?? db.getOverviewCounts(),
    db.getIssueSeverityOverrides(),
  );

  if (options.format === 'csv') {
    const source = (function* (): Generator<Record<string, unknown>> {
      for (const issue of issues) {
        for (const row of db.iterateUrlsByCategory(issue.category)) {
          yield { Issue: issue.title, Severity: SEVERITY_LABEL[issue.severity], ...pageRecord(row) };
        }
      }
    })();
    const rowsWritten = await writeCsvFile(
      source,
      outputPath,
      ['Issue', 'Severity', ...PAGE_HEADERS],
      options.csvBom !== false,
    );
    return { filePath: outputPath, issues: issues.length, rowsWritten };
  }

  // The xlsx container holds every sheet in memory at once (see
  // exportTabular): guard the heap while collecting, and fail with a
  // clear message rather than an out-of-memory abort of the app.
  const usedNames = new Set<string>();
  const overviewName = sanitizeSheetName('Issues Overview', usedNames);
  const overview: Record<string, unknown>[] = [];
  const sheets: { name: string; rows: Record<string, unknown>[]; columns: string[] }[] = [];
  let rowsWritten = 0;
  for (const issue of issues) {
    const rows: Record<string, unknown>[] = [];
    let truncated = false;
    for (const row of db.iterateUrlsByCategory(issue.category)) {
      if (rows.length >= XLSX_MAX_DATA_ROWS) {
        truncated = true;
        break;
      }
      rows.push(pageRecord(row));
      if (rows.length % 50_000 === 0) ensureHeapHeadroom('Issues export', 128 * 1024 * 1024);
    }
    const name = sanitizeSheetName(issue.title, usedNames);
    sheets.push({ name, rows, columns: PAGE_HEADERS });
    // "Count" is the sidebar counter, which for some checks counts images
    // or links; "Affected Pages" is how many pages the sheet lists.
    overview.push({
      Severity: SEVERITY_LABEL[issue.severity],
      Issue: issue.title,
      Count: issue.count,
      'Affected Pages': rows.length,
      'How to Fix': issue.advice,
      Sheet: truncated ? `${name} (first ${XLSX_MAX_DATA_ROWS.toLocaleString('en-US')} rows)` : name,
    });
    rowsWritten += rows.length;
  }
  // Workbook buffer is roughly cells × ~24 B of XML.
  ensureHeapHeadroom('Issues export', rowsWritten * PAGE_HEADERS.length * 24);
  const buf = buildXlsxBuffer([
    { name: overviewName, rows: overview, columns: OVERVIEW_HEADERS },
    ...sheets,
  ]);
  writeFileSync(outputPath, buf);
  return { filePath: outputPath, issues: issues.length, rowsWritten };
}
