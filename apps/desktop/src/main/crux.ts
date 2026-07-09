/**
 * Chrome UX Report (CrUX) API client.
 *
 * CrUX returns the 75th-percentile Core Web Vitals of real Chrome users
 * over a rolling 28-day window (`chromeuxreport.googleapis.com`). Unlike
 * PageSpeed Insights (synthetic lab data from one Lighthouse run), this is
 * *field* data — how the page actually performs for visitors. It is fast
 * (sub-second), requires an API key (no keyless mode), and returns HTTP
 * 404 when a URL/origin has too little real-user traffic ("no data", not
 * an error).
 *
 * Two layers, mirroring `pagespeed.ts`:
 *   - `fetchCruxRecord` — one URL + form factor → metrics (never throws;
 *     a 404 becomes a `nodata` result, any other failure an `error`).
 *   - `runCruxBatch` — a small concurrency pool over many (url, formFactor)
 *     items with progress + cooperative cancellation.
 */
import type { CruxMetrics, CruxFormFactor } from '@freecrawl/shared-types';
import { Agent, ProxyAgent, fetch as undiciFetch, type Dispatcher } from 'undici';
import * as logger from './logger.js';

const CRUX_ENDPOINT =
  'https://chromeuxreport.googleapis.com/v1/records:queryRecord';

/** CrUX responds fast; cap a single request at 30 s. */
const REQUEST_TIMEOUT_MS = 30_000;

/** CrUX is quick and key-gated, so we can parallelise more than PSI. */
const CONCURRENCY = 8;

/** The CrUX metrics we request per record. */
const CRUX_METRICS = [
  'largest_contentful_paint',
  'cumulative_layout_shift',
  'interaction_to_next_paint',
  'first_contentful_paint',
  'experimental_time_to_first_byte',
];

/**
 * Dedicated undici dispatcher for CrUX requests. The crawler installs a
 * process-global dispatcher with a 10 s `headersTimeout`; a plain fetch
 * inherits it. CrUX is fast so that rarely bites, but under batch
 * concurrency a slow response could still be strangled — use our own
 * dispatcher (with proxy support to match the crawler) to be safe.
 */
function createCruxDispatcher(): Dispatcher {
  const timeouts = {
    headersTimeout: REQUEST_TIMEOUT_MS + 5_000,
    bodyTimeout: REQUEST_TIMEOUT_MS + 5_000,
  };
  const proxy =
    process.env['HTTPS_PROXY'] ??
    process.env['https_proxy'] ??
    process.env['HTTP_PROXY'] ??
    process.env['http_proxy'] ??
    null;
  if (proxy) return new ProxyAgent({ uri: proxy, ...timeouts });
  return new Agent({ ...timeouts, connect: { autoSelectFamily: true } });
}

const cruxDispatcher = createCruxDispatcher();

function baseMetrics(
  fetchedAt: string,
  status: CruxMetrics['status'],
  error: string | null,
): CruxMetrics {
  return {
    lcp: null,
    cls: null,
    inp: null,
    fcp: null,
    ttfb: null,
    status,
    error,
    collectionPeriod: null,
    fetchedAt,
  };
}

/** Pull the p75 value out of a CrUX metric object (may arrive as a string). */
function p75(
  metrics: Record<string, unknown> | undefined,
  key: string,
  decimals = 0,
): number | null {
  const m = metrics?.[key] as
    | { percentiles?: { p75?: unknown } }
    | undefined;
  const raw = m?.percentiles?.p75;
  const n = typeof raw === 'string' ? Number(raw) : raw;
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

/** Format a CrUX `{year,month,day}` date part as `YYYY-MM-DD`. */
function formatDate(d: unknown): string | null {
  const date = d as { year?: number; month?: number; day?: number } | undefined;
  if (!date || typeof date.year !== 'number') return null;
  const mm = String(date.month ?? 1).padStart(2, '0');
  const dd = String(date.day ?? 1).padStart(2, '0');
  return `${date.year}-${mm}-${dd}`;
}

/**
 * Fetch one CrUX record for one URL + form factor. Never throws: a 404
 * (insufficient real-user data) resolves to a `nodata` result and any
 * other failure to an `error` result, so a single URL never aborts a batch.
 */
export async function fetchCruxRecord(
  url: string,
  formFactor: CruxFormFactor,
  apiKey: string,
): Promise<CruxMetrics> {
  const fetchedAt = new Date().toISOString();
  const body = JSON.stringify({
    url,
    formFactor: formFactor === 'phone' ? 'PHONE' : 'DESKTOP',
    metrics: CRUX_METRICS,
  });

  try {
    const res = await undiciFetch(
      `${CRUX_ENDPOINT}?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body,
        dispatcher: cruxDispatcher,
      },
    );
    const json = (await res.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (res.status === 404) {
      // CrUX has no aggregated data for this URL at this form factor —
      // expected for low-traffic pages, not a failure.
      return baseMetrics(fetchedAt, 'nodata', null);
    }
    if (!res.ok) {
      const apiErr = json?.['error'] as { message?: string } | undefined;
      return baseMetrics(
        fetchedAt,
        'error',
        apiErr?.message ?? `CrUX API returned HTTP ${res.status}`,
      );
    }
    if (!json) {
      return baseMetrics(fetchedAt, 'error', 'CrUX API returned an empty response');
    }

    const record = json['record'] as Record<string, unknown> | undefined;
    const metrics = record?.['metrics'] as Record<string, unknown> | undefined;
    if (!metrics) {
      return baseMetrics(fetchedAt, 'nodata', null);
    }
    const period = record?.['collectionPeriod'] as
      | { lastDate?: unknown }
      | undefined;

    return {
      lcp: p75(metrics, 'largest_contentful_paint'),
      cls: p75(metrics, 'cumulative_layout_shift', 3),
      inp: p75(metrics, 'interaction_to_next_paint'),
      fcp: p75(metrics, 'first_contentful_paint'),
      ttfb: p75(metrics, 'experimental_time_to_first_byte'),
      status: 'ok',
      error: null,
      collectionPeriod: formatDate(period?.lastDate),
      fetchedAt,
    };
  } catch (err) {
    const name = (err as { name?: string } | null)?.name;
    const cause = (err as { cause?: unknown } | null)?.cause as
      | { code?: string; message?: string }
      | undefined;
    const code = cause?.code;
    const isTimeout =
      name === 'TimeoutError' ||
      name === 'AbortError' ||
      code === 'UND_ERR_HEADERS_TIMEOUT' ||
      code === 'UND_ERR_BODY_TIMEOUT' ||
      code === 'UND_ERR_CONNECT_TIMEOUT';
    const message = isTimeout
      ? `CrUX request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`
      : err instanceof Error
        ? cause?.message
          ? `${err.message} (${cause.message})`
          : err.message
        : String(err);
    return baseMetrics(fetchedAt, 'error', message);
  }
}

/** One (url, formFactor) fetch unit of work. */
export interface CruxBatchItem {
  url: string;
  formFactor: CruxFormFactor;
}

export interface CruxBatchOptions {
  items: CruxBatchItem[];
  apiKey: string;
  isCancelled: () => boolean;
  onResult: (
    url: string,
    formFactor: CruxFormFactor,
    metrics: CruxMetrics,
  ) => void;
  onProgress: (done: number, total: number, currentUrl: string | null) => void;
}

export interface CruxBatchResult {
  completed: number;
  failed: number;
  cancelled: boolean;
}

/**
 * Run a CrUX fetch over many items with a small concurrency pool.
 * Cancellation gates new items only — records already in flight finish
 * and are persisted. A `nodata` record counts as failed (nothing stored
 * that the user can act on) but is not logged as an error.
 */
export async function runCruxBatch(
  opts: CruxBatchOptions,
): Promise<CruxBatchResult> {
  const { items, apiKey, isCancelled, onResult, onProgress } = opts;
  const total = items.length;
  let done = 0;
  let completed = 0;
  let failed = 0;
  let cursor = 0;

  const ERROR_LOG_LIMIT_PER_KIND = 3;
  const errorCounts = new Map<string, number>();
  function recordFailure(url: string, message: string): void {
    const prev = errorCounts.get(message) ?? 0;
    errorCounts.set(message, prev + 1);
    if (prev < ERROR_LOG_LIMIT_PER_KIND) {
      logger.log('warn', 'crux', `${url} — ${message}`);
    }
  }

  onProgress(0, total, null);

  const worker = async (): Promise<void> => {
    for (;;) {
      if (isCancelled()) return;
      const index = cursor++;
      if (index >= total) return;
      const item = items[index];
      if (!item) return;
      onProgress(done, total, item.url);
      const metrics = await fetchCruxRecord(item.url, item.formFactor, apiKey);
      try {
        onResult(item.url, item.formFactor, metrics);
      } catch (err) {
        logger.log(
          'error',
          'crux',
          `failed to persist CrUX record for ${item.url}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
      done++;
      if (metrics.status === 'ok') {
        completed++;
      } else {
        failed++;
        if (metrics.status === 'error') {
          recordFailure(item.url, metrics.error ?? 'Unknown error');
        }
      }
      onProgress(done, total, null);
    }
  };

  const poolSize = Math.min(CONCURRENCY, Math.max(1, total));
  await Promise.all(Array.from({ length: poolSize }, () => worker()));

  const cancelled = isCancelled() && done < total;
  logger.log(
    'info',
    'crux',
    `batch finished — ${completed} with data, ${failed} no-data/failed${
      cancelled ? ', cancelled early' : ''
    } (${done}/${total})`,
  );
  if (errorCounts.size > 0) {
    const sorted = [...errorCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [message, count] of sorted) {
      logger.log('warn', 'crux', `failure summary — ${count}× "${message}"`);
    }
  }
  return { completed, failed, cancelled };
}
