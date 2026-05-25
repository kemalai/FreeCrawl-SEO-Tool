/**
 * Faz 7 — Google BigQuery export.
 *
 * Service-account auth (no OAuth keystone — BigQuery clients typically
 * authenticate as a *service*, not a user). The user pastes a Google
 * Cloud service-account JSON in Settings → Integrations; this module
 * signs a short-lived JWT with the embedded private key (RS256),
 * exchanges it at Google's token endpoint for an access token, then
 * uses that token to:
 *   1. Ensure the `freecrawl_seo` dataset exists in the user's project.
 *   2. Create a fresh timestamped `urls_<unix>` table with a fixed
 *      schema.
 *   3. Stream the category's URL rows in via `tabledata.insertAll` in
 *      500-row chunks.
 *
 * Per-process token cache — JWT round-trips are cheap but a single
 * export typically fits inside one token lifetime (1 hr).
 */
import { createSign } from 'node:crypto';
import type { ProjectDb } from '@freecrawl/db';
import type { CrawlUrlRow, UrlCategory } from '@freecrawl/shared-types';
import { resolveCredentials } from './credentials.js';
import * as logger from './logger.js';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const BIGQUERY_API = 'https://bigquery.googleapis.com/bigquery/v2';
const SCOPE = 'https://www.googleapis.com/auth/bigquery';

/** Fixed dataset FreeCrawl writes into. The user can move tables out
 *  afterwards; using a stable name keeps the export idempotent. */
const DATASET_ID = 'freecrawl_seo';
const INSERT_CHUNK = 500;
const TOKEN_EXPIRY_SKEW_MS = 60_000;

/** BigQuery schema for the exported URL rows — matches the Sheets
 *  export so both targets receive the same shape. */
const URL_TABLE_SCHEMA = {
  fields: [
    { name: 'url', type: 'STRING', mode: 'REQUIRED' },
    { name: 'status_code', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'title', type: 'STRING', mode: 'NULLABLE' },
    { name: 'meta_description', type: 'STRING', mode: 'NULLABLE' },
    { name: 'h1', type: 'STRING', mode: 'NULLABLE' },
    { name: 'indexability', type: 'STRING', mode: 'NULLABLE' },
    { name: 'response_time_ms', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'depth', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'inlinks', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'outlinks', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'word_count', type: 'INTEGER', mode: 'NULLABLE' },
  ],
};

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id?: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}
let tokenCache: CachedToken | null = null;

function base64url(buf: Buffer | string): string {
  return (Buffer.isBuffer(buf) ? buf : Buffer.from(buf)).toString('base64url');
}

/** Parse and validate the stored service-account JSON. */
function parseServiceAccount(raw: string): ServiceAccount {
  if (!raw.trim()) {
    throw new Error(
      'No BigQuery service account — paste the JSON key in Settings → Integrations.',
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Service account JSON failed to parse: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Service account JSON is not an object.');
  }
  const sa = parsed as Partial<ServiceAccount>;
  if (typeof sa.client_email !== 'string' || !sa.client_email) {
    throw new Error('Service account JSON missing `client_email`.');
  }
  if (typeof sa.private_key !== 'string' || !sa.private_key.includes('PRIVATE KEY')) {
    throw new Error('Service account JSON missing `private_key`.');
  }
  return sa as ServiceAccount;
}

/** Mint a Google access token via the JWT-bearer grant. */
async function mintAccessToken(sa: ServiceAccount): Promise<string> {
  if (tokenCache && tokenCache.expiresAt - TOKEN_EXPIRY_SKEW_MS > Date.now()) {
    return tokenCache.token;
  }
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: SCOPE,
    aud: TOKEN_ENDPOINT,
    exp: now + 3600,
    iat: now,
  };
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(claim));
  const signingInput = `${header}.${body}`;
  const signature = createSign('RSA-SHA256')
    .update(signingInput)
    .sign(sa.private_key, 'base64url');
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
    signal: AbortSignal.timeout(30_000),
  });
  const json = (await res.json().catch(() => null)) as {
    access_token?: unknown;
    expires_in?: unknown;
    error?: unknown;
    error_description?: unknown;
  } | null;
  if (!res.ok || !json || typeof json.access_token !== 'string') {
    const msg =
      (json?.error_description as string | undefined) ??
      (json?.error as string | undefined) ??
      `token exchange failed (HTTP ${res.status})`;
    throw new Error(`BigQuery auth: ${msg}`);
  }
  const expiresIn =
    typeof json.expires_in === 'number' ? (json.expires_in as number) : 3600;
  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  return tokenCache.token;
}

/** Helper — turn a non-2xx BigQuery response into a useful error. */
async function bqError(res: Response, fallback: string): Promise<Error> {
  let msg = fallback;
  try {
    const j = (await res.json()) as { error?: { message?: unknown } };
    if (j?.error?.message && typeof j.error.message === 'string') {
      msg = j.error.message;
    }
  } catch {
    /* response wasn't JSON */
  }
  return new Error(`BigQuery: ${msg}`);
}

/** Create the dataset if it doesn't already exist (409 conflict OK). */
async function ensureDataset(
  projectId: string,
  token: string,
  datasetId: string,
): Promise<void> {
  const res = await fetch(
    `${BIGQUERY_API}/projects/${encodeURIComponent(projectId)}/datasets`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datasetReference: { projectId, datasetId },
        location: 'US',
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (res.ok) return;
  if (res.status === 409) return; // already exists
  throw await bqError(res, `dataset create failed (HTTP ${res.status})`);
}

async function createTable(
  projectId: string,
  token: string,
  datasetId: string,
  tableId: string,
): Promise<void> {
  const res = await fetch(
    `${BIGQUERY_API}/projects/${encodeURIComponent(projectId)}/datasets/${encodeURIComponent(
      datasetId,
    )}/tables`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tableReference: { projectId, datasetId, tableId },
        schema: URL_TABLE_SCHEMA,
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!res.ok) {
    throw await bqError(res, `table create failed (HTTP ${res.status})`);
  }
}

interface InsertAllResponse {
  insertErrors?: { index?: number; errors?: { message?: string }[] }[];
}

async function insertAllChunk(
  projectId: string,
  token: string,
  datasetId: string,
  tableId: string,
  rows: { json: Record<string, string | number | null> }[],
): Promise<number> {
  const res = await fetch(
    `${BIGQUERY_API}/projects/${encodeURIComponent(projectId)}/datasets/${encodeURIComponent(
      datasetId,
    )}/tables/${encodeURIComponent(tableId)}/insertAll`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rows }),
      signal: AbortSignal.timeout(120_000),
    },
  );
  if (!res.ok) {
    throw await bqError(res, `insertAll failed (HTTP ${res.status})`);
  }
  const json = (await res.json().catch(() => null)) as InsertAllResponse | null;
  const errors = json?.insertErrors?.length ?? 0;
  if (errors > 0) {
    const first = json?.insertErrors?.[0]?.errors?.[0]?.message;
    logger.log(
      'warn',
      'bigquery',
      `insertAll: ${errors} row(s) rejected; first error: ${first ?? 'unknown'}`,
    );
  }
  return rows.length - errors;
}

function rowToJson(r: CrawlUrlRow): Record<string, string | number | null> {
  return {
    url: r.url,
    status_code: r.statusCode ?? null,
    title: r.title ?? null,
    meta_description: r.metaDescription ?? null,
    h1: r.h1 ?? null,
    indexability: r.indexability ?? null,
    response_time_ms: r.responseTimeMs ?? null,
    depth: r.depth ?? null,
    inlinks: r.inlinks ?? null,
    outlinks: r.outlinks ?? null,
    word_count: r.wordCount ?? null,
  };
}

export interface BigQueryExportOutput {
  tableId: string;
  tableRef: string;
  consoleUrl: string;
  rowsWritten: number;
}

export async function exportCategoryToBigQuery(
  db: ProjectDb,
  category: UrlCategory,
): Promise<BigQueryExportOutput> {
  const creds = resolveCredentials('bigquery');
  const projectId = (creds['projectId'] ?? '').trim();
  if (!projectId) {
    throw new Error(
      'No BigQuery project — paste the GCP project ID in Settings → Integrations.',
    );
  }
  const sa = parseServiceAccount(creds['serviceAccountJson'] ?? '');
  const token = await mintAccessToken(sa);

  await ensureDataset(projectId, token, DATASET_ID);

  const tableId = `urls_${Math.floor(Date.now() / 1000)}`;
  await createTable(projectId, token, DATASET_ID, tableId);
  logger.log(
    'info',
    'bigquery',
    `created table ${projectId}.${DATASET_ID}.${tableId}`,
  );

  // Stream rows in chunks. `tabledata.insertAll` caps at 10 MB / request;
  // 500 rows × ~600 bytes ≈ 300 KB so we stay well under.
  let rowsWritten = 0;
  let buf: { json: Record<string, string | number | null> }[] = [];
  for (const row of db.iterateUrlsByCategory(category)) {
    buf.push({ json: rowToJson(row) });
    if (buf.length >= INSERT_CHUNK) {
      rowsWritten += await insertAllChunk(projectId, token, DATASET_ID, tableId, buf);
      buf = [];
    }
  }
  if (buf.length > 0) {
    rowsWritten += await insertAllChunk(projectId, token, DATASET_ID, tableId, buf);
  }

  const tableRef = `${projectId}.${DATASET_ID}.${tableId}`;
  const consoleUrl =
    `https://console.cloud.google.com/bigquery?` +
    `project=${encodeURIComponent(projectId)}&p=${encodeURIComponent(
      projectId,
    )}&d=${DATASET_ID}&t=${tableId}&page=table`;
  logger.log(
    'info',
    'bigquery',
    `exported ${rowsWritten} row(s) into ${tableRef}`,
  );
  return { tableId, tableRef, consoleUrl, rowsWritten };
}
