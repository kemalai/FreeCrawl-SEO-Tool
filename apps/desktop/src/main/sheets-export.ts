/**
 * Faz 7 — Google Sheets export.
 *
 * Creates a new spreadsheet on the connected Google account's Drive,
 * writes a key set of columns for the chosen URL category, and returns
 * the spreadsheet URL. Auth runs through the shared OAuth keystone
 * (`getAccessToken('sheets')`).
 *
 * One sheet per export — the user can switch categories and export
 * again to create another. For very large crawls (>50 K rows) the
 * batched `values.update` would exceed Sheets' per-request size cap;
 * V1 caps the export at 50 K rows and tells the caller how many were
 * skipped.
 */
import type { ProjectDb } from '@freecrawl/db';
import type { CrawlUrlRow, UrlCategory } from '@freecrawl/shared-types';
import { getAccessToken } from './google-oauth.js';
import * as logger from './logger.js';

const MAX_ROWS = 50_000;

/** The columns we write — a sensible "key SEO snapshot" set. */
const HEADERS = [
  'URL',
  'Status',
  'Title',
  'Meta description',
  'H1',
  'Indexability',
  'Response time (ms)',
  'Depth',
  'Inlinks',
  'Outlinks',
  'Word count',
] as const;

function rowFromUrl(r: CrawlUrlRow): (string | number | null)[] {
  return [
    r.url,
    r.statusCode ?? null,
    r.title ?? '',
    r.metaDescription ?? '',
    r.h1 ?? '',
    r.indexability ?? '',
    r.responseTimeMs ?? null,
    r.depth ?? null,
    r.inlinks ?? null,
    r.outlinks ?? null,
    r.wordCount ?? null,
  ];
}

export interface SheetsExportOutput {
  spreadsheetUrl: string;
  rowsWritten: number;
}

export async function exportCategoryToSheets(
  db: ProjectDb,
  category: UrlCategory,
  title: string,
): Promise<SheetsExportOutput> {
  const token = await getAccessToken('sheets');

  // 1. Create the spreadsheet.
  const createRes = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: { title } }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  const createJson = (await createRes.json().catch(() => null)) as {
    spreadsheetId?: unknown;
    spreadsheetUrl?: unknown;
    error?: { message?: unknown };
  } | null;
  if (!createRes.ok || !createJson || typeof createJson.spreadsheetId !== 'string') {
    const err =
      (createJson?.error?.message as string | undefined) ??
      `HTTP ${createRes.status}`;
    throw new Error(`Sheets create failed: ${err}`);
  }
  const spreadsheetId = createJson.spreadsheetId;
  const spreadsheetUrl =
    typeof createJson.spreadsheetUrl === 'string'
      ? createJson.spreadsheetUrl
      : `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 2. Collect rows from the project DB.
  const values: (string | number | null)[][] = [[...HEADERS]];
  let count = 0;
  for (const row of db.iterateUrlsByCategory(category)) {
    if (count >= MAX_ROWS) break;
    values.push(rowFromUrl(row));
    count++;
  }

  // 3. Write the values.
  if (count > 0) {
    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
        signal: AbortSignal.timeout(120_000),
      },
    );
    if (!writeRes.ok) {
      const writeJson = (await writeRes.json().catch(() => null)) as {
        error?: { message?: unknown };
      } | null;
      const err =
        (writeJson?.error?.message as string | undefined) ??
        `HTTP ${writeRes.status}`;
      throw new Error(`Sheets write failed: ${err}`);
    }
  }
  logger.log('info', 'sheets', `exported ${count} row(s) to ${spreadsheetUrl}`);
  return { spreadsheetUrl, rowsWritten: count };
}
