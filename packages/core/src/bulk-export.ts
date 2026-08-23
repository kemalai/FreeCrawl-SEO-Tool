/**
 * Bulk export — writes one CSV per category/issue family into a target
 * folder. Shared by the desktop's File → Bulk Export (dialog-driven) and
 * the MCP `export_bulk` action (path-driven) so the long task list lives
 * in exactly one place.
 *
 * `import type` keeps `@freecrawl/db` a compile-time-only reference (core
 * must not take a runtime dependency on db) — same pattern as csv-export.
 */

import { join } from 'node:path';
import { unlink } from 'node:fs/promises';
import type { ProjectDb } from '@freecrawl/db';
import type {
  BulkExportFile,
  BulkExportResult,
  CrawlUrlRow,
  UrlCategory,
} from '@freecrawl/shared-types';
import { exportUrlsToCsv } from './csv-export.js';

export interface BulkExportTask {
  label: string;
  file: string;
  category: UrlCategory;
  /** Column override for topic files whose whole point is a field the
   *  generic column set omits (extraction results, hreflang, security
   *  headers). When set these are appended to the base columns. */
  columns?: (keyof CrawlUrlRow)[];
}

/** Base columns every bulk file carries (mirrors csv-export's CSV_COLUMNS). */
const BULK_BASE_COLUMNS: (keyof CrawlUrlRow)[] = [
  'url',
  'statusCode',
  'contentKind',
  'indexability',
  'indexabilityReason',
  'title',
  'inlinks',
  'outlinks',
  'depth',
];

/** Every category/issue family the bulk dump emits, in display order. */
export const BULK_EXPORT_TASKS: BulkExportTask[] = [
  { label: 'All URLs', file: 'all-urls.csv', category: 'all' },
  { label: 'Internal HTML', file: 'internal-html.csv', category: 'internal:html' },
  { label: 'Internal All', file: 'internal-all.csv', category: 'internal:all' },
  { label: 'External All', file: 'external-all.csv', category: 'external:all' },
  { label: '2xx Success', file: 'status-2xx.csv', category: 'status:2xx' },
  { label: '3xx Redirects', file: 'status-3xx.csv', category: 'status:3xx' },
  { label: '4xx Client Errors', file: 'status-4xx.csv', category: 'status:4xx' },
  { label: '5xx Server Errors', file: 'status-5xx.csv', category: 'status:5xx' },
  { label: 'Indexable', file: 'indexable.csv', category: 'indexability:indexable' },
  { label: 'Non-Indexable', file: 'non-indexable.csv', category: 'indexability:non-indexable' },
  { label: 'Title Issues — Missing', file: 'issues-title-missing.csv', category: 'issues:title-missing' },
  { label: 'Title Issues — Duplicate', file: 'issues-title-duplicate.csv', category: 'issues:title-duplicate' },
  { label: 'Meta Description Issues — Missing', file: 'issues-meta-missing.csv', category: 'issues:meta-missing' },
  { label: 'H1 Issues — Missing', file: 'issues-h1-missing.csv', category: 'issues:h1-missing' },
  { label: 'Canonical Issues — Missing', file: 'issues-canonical-missing.csv', category: 'issues:canonical-missing' },
  { label: 'Pagination Broken', file: 'issues-pagination-broken.csv', category: 'issues:pagination-broken' },
  { label: 'Mixed Content', file: 'issues-mixed-content.csv', category: 'issues:mixed-content' },
  { label: 'Insecure Form Action', file: 'issues-insecure-form-action.csv', category: 'issues:insecure-form-action' },
  { label: 'Hreflang — Reciprocity Missing', file: 'hreflang-reciprocity-missing.csv', category: 'issues:hreflang-reciprocity-missing' },
  { label: 'Sitemap — Crawled, Not Listed', file: 'sitemap-crawled-not-in-sitemap.csv', category: 'issues:crawled-not-in-sitemap' },
  { label: 'Image Missing Alt', file: 'issues-image-missing-alt.csv', category: 'issues:image-missing-alt' },
  { label: 'Near-Duplicate Content', file: 'issues-near-duplicate.csv', category: 'issues:near-duplicate' },
  { label: 'All Redirects', file: 'all-redirects.csv', category: 'tab:redirects' },
  { label: 'Redirect Chains (Long)', file: 'redirect-chains-long.csv', category: 'issues:redirect-chain-long' },
  { label: 'Redirect Loops', file: 'redirect-loops.csv', category: 'issues:redirect-loop' },
  { label: 'Self-Redirects', file: 'redirect-self.csv', category: 'issues:redirect-self' },
  { label: 'All Canonicals', file: 'all-canonicals.csv', category: 'tab:canonicals' },
  { label: 'Canonical — Non Self-Referencing', file: 'canonical-non-self.csv', category: 'issues:canonical-non-self' },
  { label: 'Canonical — To Non-200', file: 'canonical-to-non-200.csv', category: 'issues:canonical-to-non-200' },
  { label: 'Canonical — To Redirect', file: 'canonical-to-redirect.csv', category: 'issues:canonical-to-redirect' },
  { label: 'Canonical — To Noindex', file: 'canonical-to-noindex.csv', category: 'issues:canonical-to-noindex' },
  { label: 'Canonical — Multi-Hop Chain', file: 'canonical-chain-multi-hop.csv', category: 'issues:canonical-chain-multi-hop' },
  { label: 'Multiple Canonicals', file: 'canonical-multiple.csv', category: 'issues:multiple-canonicals' },
  { label: 'All Pagination', file: 'all-pagination.csv', category: 'tab:pagination' },
  { label: 'Pagination — Sequence Break', file: 'pagination-sequence-break.csv', category: 'issues:pagination-sequence-break' },
  { label: 'Pagination — Canonical Conflict', file: 'pagination-canonical-conflict.csv', category: 'issues:pagination-canonical-conflict' },
  {
    label: 'Hreflang — All',
    file: 'hreflang-all.csv',
    category: 'tab:hreflang',
    columns: [...BULK_BASE_COLUMNS, 'hreflangs'],
  },
  { label: 'Hreflang — x-default Missing', file: 'hreflang-x-default-missing.csv', category: 'issues:hreflang-x-default-missing' },
  { label: 'Hreflang — Invalid Language Code', file: 'hreflang-invalid-code.csv', category: 'issues:hreflang-invalid-code' },
  { label: 'Hreflang — Self-Ref Missing', file: 'hreflang-self-ref-missing.csv', category: 'issues:hreflang-self-ref-missing' },
  { label: 'Hreflang — Target Issues', file: 'hreflang-target-issues.csv', category: 'issues:hreflang-target-issues' },
  { label: 'Hreflang — Inconsistent Language', file: 'hreflang-inconsistent-lang.csv', category: 'issues:hreflang-inconsistent-lang' },
  { label: 'Duplicate Pages', file: 'duplicate-pages.csv', category: 'tab:duplicates' },
  { label: 'Duplicate Content — Exact', file: 'duplicate-content-exact.csv', category: 'issues:duplicate-content-exact' },
  {
    label: 'Custom Extraction Results',
    file: 'custom-extraction.csv',
    category: 'tab:custom-extraction',
    columns: [...BULK_BASE_COLUMNS, 'extractionResults'],
  },
  {
    label: 'Custom Search Hits',
    file: 'custom-search.csv',
    category: 'tab:custom-search',
    columns: [...BULK_BASE_COLUMNS, 'customSearchHits'],
  },
  { label: 'Structured Data — Missing', file: 'structured-data-missing.csv', category: 'issues:structured-data-missing' },
  { label: 'Structured Data — Invalid', file: 'structured-data-invalid.csv', category: 'issues:structured-data-invalid' },
  { label: 'Structured Data — Duplicate @id', file: 'structured-data-duplicate-id.csv', category: 'issues:schema-duplicate-id' },
  { label: 'Structured Data — Missing Required Property', file: 'structured-data-missing-required.csv', category: 'issues:schema-missing-required' },
  { label: 'AMP Pages', file: 'amp-pages.csv', category: 'tab:amp' },
  { label: 'Image — Missing Alt', file: 'image-missing-alt.csv', category: 'issues:image-missing-alt' },
  { label: 'Image — Empty Alt', file: 'image-empty-alt.csv', category: 'issues:image-empty-alt' },
  { label: 'Image — Too Large', file: 'image-too-large.csv', category: 'issues:image-too-large' },
  { label: 'Image — Broken Src', file: 'image-broken-src.csv', category: 'issues:image-broken-src' },
  {
    label: 'Security Audit',
    file: 'security-audit.csv',
    category: 'tab:security',
    columns: [
      ...BULK_BASE_COLUMNS,
      'hsts',
      'csp',
      'xFrameOptions',
      'xContentTypeOptions',
    ],
  },
  { label: 'Mixed Content — Active', file: 'mixed-content-active.csv', category: 'issues:mixed-content-active' },
  { label: 'Mixed Content — Passive', file: 'mixed-content-passive.csv', category: 'issues:mixed-content-passive' },
  { label: 'HSTS Missing', file: 'security-hsts-missing.csv', category: 'issues:hsts-missing' },
  { label: 'CSP Missing', file: 'security-csp-missing.csv', category: 'issues:csp-missing' },
  { label: 'SERP Summary', file: 'serp-summary.csv', category: 'tab:serp' },
  { label: 'Outlinks Zero', file: 'outlinks-zero.csv', category: 'issues:outlinks-zero' },
];

/**
 * Write every {@link BULK_EXPORT_TASKS} category to a CSV under
 * `outputDir`. Zero-row categories are written then deleted so the dump
 * folder isn't littered with empty files. Per-task write failures are
 * collected (never abort the whole run). Caller owns any UI / dialogs.
 */
export async function runBulkExport(
  db: ProjectDb,
  outputDir: string,
): Promise<BulkExportResult> {
  const files: BulkExportFile[] = [];
  const errors: { label: string; error: string }[] = [];
  for (const task of BULK_EXPORT_TASKS) {
    const filePath = join(outputDir, task.file);
    try {
      const { rowsWritten } = await exportUrlsToCsv(db, filePath, {
        category: task.category,
        columns: task.columns,
      });
      if (rowsWritten === 0) {
        await unlink(filePath).catch(() => undefined);
        continue;
      }
      files.push({ filePath, label: task.label, category: task.category, rowsWritten });
    } catch (err) {
      errors.push({ label: task.label, error: (err as Error).message });
    }
  }
  return { outputDir, files, errors };
}
