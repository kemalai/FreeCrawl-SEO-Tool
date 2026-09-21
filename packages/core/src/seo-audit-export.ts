import { join } from 'node:path';
import { createWriteStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { ProjectDb } from '@freecrawl/db';
import type { CrawlUrlRow, UrlCategory } from '@freecrawl/shared-types';
import { escapeCsv } from './spreadsheet.js';

/**
 * "SEO Audit" folder export in Screaming Frog's layout: the same file
 * names Screaming Frog's Bulk Export writes (`internal_all.csv`,
 * `page_titles_all.csv`, …) and the Internal:All column headers
 * (`Address`, `Status Code`, `Title 1`, `Meta Description 1 Length`, …).
 * Audit spreadsheets, Looker templates and scripts written against a
 * Screaming Frog crawl read these files without remapping.
 *
 * Columns FreeCrawl does not track (`Last Modified`, `HTTP rel="next"`)
 * are present but empty so the header row still matches.
 */

export const SEO_AUDIT_HEADERS = [
  'Address',
  'Content Type',
  'Status Code',
  'Status',
  'Indexability',
  'Indexability Status',
  'Title 1',
  'Title 1 Length',
  'Title 1 Pixel Width',
  'Meta Description 1',
  'Meta Description 1 Length',
  'Meta Description 1 Pixel Width',
  'Meta Keywords 1',
  'H1-1',
  'H1-1 Length',
  'Meta Robots 1',
  'X-Robots-Tag 1',
  'Meta Refresh 1',
  'Canonical Link Element 1',
  'rel="next" 1',
  'rel="prev" 1',
  'HTTP rel="next" 1',
  'HTTP rel="prev" 1',
  'amphtml Link Element',
  'Size (bytes)',
  'Word Count',
  'Text Ratio',
  'Crawl Depth',
  'Folder Depth',
  'Link Score',
  'Inlinks',
  'Unique Inlinks',
  'Outlinks',
  'Unique Outlinks',
  'Hash',
  'Response Time',
  'Last Modified',
  'Redirect URL',
  'Redirect Type',
  'Language',
  'Crawl Timestamp',
] as const;

/** Screaming Frog's "Indexability Status" wording for our reason codes. */
function indexabilityStatus(row: CrawlUrlRow): string {
  const raw = row.indexabilityReason ?? row.indexability ?? '';
  const tail = raw.includes(':') ? raw.slice(raw.indexOf(':') + 1) : raw;
  return tail
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function redirectType(row: CrawlUrlRow): string {
  const code = row.statusCode ?? 0;
  if (code >= 300 && code < 400) return 'HTTP Redirect';
  if (row.metaRefreshUrl) return 'Meta Refresh';
  if (row.jsRedirectUrl) return 'JavaScript Redirect';
  return '';
}

function redirectUrl(row: CrawlUrlRow): string | null {
  const code = row.statusCode ?? 0;
  if (code >= 300 && code < 400) return row.redirectTarget;
  return row.metaRefreshUrl ?? row.jsRedirectUrl ?? null;
}

/** One row in Screaming Frog's column order. */
export function seoAuditRow(row: CrawlUrlRow): (string | number | null)[] {
  return [
    row.url,
    row.contentType,
    row.statusCode,
    row.statusText,
    row.indexability === 'indexable' ? 'Indexable' : 'Non-Indexable',
    row.indexability === 'indexable' ? '' : indexabilityStatus(row),
    row.title,
    row.titleLength,
    row.titlePixelWidth,
    row.metaDescription,
    row.metaDescriptionLength,
    row.metaPixelWidth,
    row.metaKeywords,
    row.h1,
    row.h1Length,
    row.metaRobots,
    row.xRobotsTag,
    row.metaRefresh,
    row.canonical,
    row.paginationNext,
    row.paginationPrev,
    '',
    '',
    row.amphtml,
    row.contentLength,
    row.wordCount,
    row.textCodeRatio,
    row.depth,
    row.folderDepth,
    row.linkScore,
    row.inlinks,
    row.inlinks,
    row.outlinks,
    row.outlinks,
    row.contentHash,
    row.responseTimeMs === null || row.responseTimeMs === undefined
      ? null
      : Math.round(row.responseTimeMs) / 1000,
    '',
    redirectUrl(row),
    redirectType(row),
    row.lang,
    row.crawledAt,
  ];
}

interface AuditFile {
  label: string;
  file: string;
  category: UrlCategory;
}

/** Screaming Frog Bulk Export file names → the FreeCrawl category behind each. */
export const SEO_AUDIT_FILES: readonly AuditFile[] = [
  { label: 'Internal: All', file: 'internal_all.csv', category: 'internal:all' },
  { label: 'Internal: HTML', file: 'internal_html.csv', category: 'internal:html' },
  { label: 'External: All', file: 'external_all.csv', category: 'external:all' },
  { label: 'Response Codes: All', file: 'response_codes_all.csv', category: 'all' },
  { label: 'Response Codes: Redirection (3xx)', file: 'response_codes_redirection_3xx.csv', category: 'status:3xx' },
  { label: 'Response Codes: Client Error (4xx)', file: 'response_codes_client_error_4xx.csv', category: 'status:4xx' },
  { label: 'Response Codes: Server Error (5xx)', file: 'response_codes_server_error_5xx.csv', category: 'status:5xx' },
  { label: 'Page Titles: All', file: 'page_titles_all.csv', category: 'internal:html' },
  { label: 'Page Titles: Missing', file: 'page_titles_missing.csv', category: 'issues:title-missing' },
  { label: 'Page Titles: Duplicate', file: 'page_titles_duplicate.csv', category: 'issues:title-duplicate' },
  { label: 'Meta Description: All', file: 'meta_description_all.csv', category: 'internal:html' },
  { label: 'Meta Description: Missing', file: 'meta_description_missing.csv', category: 'issues:meta-missing' },
  { label: 'Meta Description: Duplicate', file: 'meta_description_duplicate.csv', category: 'issues:meta-duplicate' },
  { label: 'H1: All', file: 'h1_all.csv', category: 'internal:html' },
  { label: 'H1: Missing', file: 'h1_missing.csv', category: 'issues:h1-missing' },
  { label: 'Canonicals: All', file: 'canonicals_all.csv', category: 'tab:canonicals' },
  { label: 'Directives: All', file: 'directives_all.csv', category: 'tab:directives' },
  { label: 'Hreflang: All', file: 'hreflang_all.csv', category: 'tab:hreflang' },
  { label: 'Pagination: All', file: 'pagination_all.csv', category: 'tab:pagination' },
  { label: 'Structured Data: All', file: 'structured_data_all.csv', category: 'tab:structured-data' },
  { label: 'AMP: All', file: 'amp_all.csv', category: 'tab:amp' },
  { label: 'Security: All', file: 'security_all.csv', category: 'tab:security' },
];

export interface SeoAuditExportResult {
  outputDir: string;
  files: { filePath: string; label: string; rowsWritten: number }[];
  errors: { label: string; error: string }[];
}

async function writeAuditFile(
  db: ProjectDb,
  filePath: string,
  category: UrlCategory,
): Promise<number> {
  let rowsWritten = 0;
  const generator = async function* (): AsyncGenerator<string> {
    yield '\ufeff' + SEO_AUDIT_HEADERS.join(',') + '\n';
    for (const row of db.iterateUrlsByCategory(category)) {
      rowsWritten++;
      yield seoAuditRow(row).map(escapeCsv).join(',') + '\n';
    }
  };
  await pipeline(Readable.from(generator()), createWriteStream(filePath, { encoding: 'utf8' }));
  return rowsWritten;
}

export async function runSeoAuditExport(
  db: ProjectDb,
  outputDir: string,
): Promise<SeoAuditExportResult> {
  const files: SeoAuditExportResult['files'] = [];
  const errors: SeoAuditExportResult['errors'] = [];
  const disabled = db.getDisabledIssues();
  for (const f of SEO_AUDIT_FILES) {
    if (disabled.has(f.category)) continue;
    const filePath = join(outputDir, f.file);
    try {
      const rowsWritten = await writeAuditFile(db, filePath, f.category);
      if (rowsWritten === 0) {
        await unlink(filePath).catch(() => undefined);
        continue;
      }
      files.push({ filePath, label: f.label, rowsWritten });
    } catch (err) {
      errors.push({ label: f.label, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return { outputDir, files, errors };
}
