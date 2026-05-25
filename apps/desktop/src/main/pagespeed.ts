/**
 * Faz 7 — Google PageSpeed Insights API client.
 *
 * PSI runs a Lighthouse audit on a publicly reachable URL and returns
 * lab performance metrics. It works without a key at a low shared rate
 * limit; a free Google Cloud API key (the `pagespeed` integration in
 * the credential store) raises throughput. The key is resolved in the
 * main process only and never crosses into the renderer.
 *
 * Two layers:
 *   - `fetchPagespeedAudit` — one URL + strategy → metrics (or an
 *     `error` result on any failure, so a single bad URL never aborts
 *     a batch).
 *   - `runPagespeedBatch` — a small concurrency pool over many
 *     (url, strategy) items, with progress callbacks and cooperative
 *     cancellation. PSI is slow (~10–30 s per audit), so the renderer
 *     drives this on-demand against a user-selected subset, never the
 *     whole crawl.
 */
import type { PagespeedMetrics, PagespeedStrategy } from '@freecrawl/shared-types';
import * as logger from './logger.js';

const PSI_ENDPOINT =
  'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

/** A single Lighthouse audit can legitimately take ~30 s; cap at 90 s. */
const REQUEST_TIMEOUT_MS = 90_000;

/** Concurrency: a key lifts the quota enough for modest parallelism;
 *  keyless calls share a tiny global pool and 429 instantly, so they
 *  run strictly one at a time. */
const CONCURRENCY_WITH_KEY = 4;
const CONCURRENCY_NO_KEY = 1;

function errorMetrics(fetchedAt: string, message: string): PagespeedMetrics {
  return {
    performance: null,
    lcp: null,
    cls: null,
    fcp: null,
    tbt: null,
    speedIndex: null,
    status: 'error',
    error: message,
    fetchedAt,
  };
}

/** Pull `numericValue` out of a Lighthouse audit object, rounded. */
function auditValue(
  audits: Record<string, unknown>,
  key: string,
  decimals = 0,
): number | null {
  const audit = audits[key];
  if (!audit || typeof audit !== 'object') return null;
  const v = (audit as { numericValue?: unknown }).numericValue;
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  const factor = 10 ** decimals;
  return Math.round(v * factor) / factor;
}

/**
 * Audit one URL for one form factor. Never throws — any network /
 * quota / Lighthouse failure resolves to an `error` PagespeedMetrics
 * so the caller can record it and move on.
 */
export async function fetchPagespeedAudit(
  url: string,
  strategy: PagespeedStrategy,
  apiKey: string | undefined,
): Promise<PagespeedMetrics> {
  const fetchedAt = new Date().toISOString();
  const params = new URLSearchParams({
    url,
    strategy,
    category: 'performance',
  });
  if (apiKey) params.set('key', apiKey);

  try {
    const res = await fetch(`${PSI_ENDPOINT}?${params.toString()}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { Accept: 'application/json' },
    });
    const json = (await res.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!res.ok) {
      const apiErr = json?.['error'] as { message?: string } | undefined;
      return errorMetrics(
        fetchedAt,
        apiErr?.message ?? `PageSpeed API returned HTTP ${res.status}`,
      );
    }
    if (!json) {
      return errorMetrics(fetchedAt, 'PageSpeed API returned an empty response');
    }

    const lhr = json['lighthouseResult'] as Record<string, unknown> | undefined;
    if (!lhr) {
      return errorMetrics(fetchedAt, 'No Lighthouse result in PageSpeed response');
    }
    const audits = (lhr['audits'] as Record<string, unknown>) ?? {};
    const categories = lhr['categories'] as
      | { performance?: { score?: unknown } }
      | undefined;
    const score = categories?.performance?.score;

    return {
      performance:
        typeof score === 'number' ? Math.round(score * 100) : null,
      lcp: auditValue(audits, 'largest-contentful-paint'),
      cls: auditValue(audits, 'cumulative-layout-shift', 3),
      fcp: auditValue(audits, 'first-contentful-paint'),
      tbt: auditValue(audits, 'total-blocking-time'),
      speedIndex: auditValue(audits, 'speed-index'),
      status: 'ok',
      error: null,
      fetchedAt,
    };
  } catch (err) {
    // `AbortSignal.timeout` rejects with a DOMException, which is not
    // always an `instanceof Error` in Node — sniff `.name` directly.
    const name = (err as { name?: string } | null)?.name;
    const message =
      name === 'TimeoutError' || name === 'AbortError'
        ? `PageSpeed audit timed out after ${REQUEST_TIMEOUT_MS / 1000}s`
        : err instanceof Error
          ? err.message
          : String(err);
    return errorMetrics(fetchedAt, message);
  }
}

/** One (url, strategy) audit unit of work. */
export interface PagespeedBatchItem {
  url: string;
  strategy: PagespeedStrategy;
}

export interface PagespeedBatchOptions {
  items: PagespeedBatchItem[];
  /** Resolved PSI API key, or undefined for keyless (low-rate) calls. */
  apiKey: string | undefined;
  /** Cooperative cancel — checked before each item is dequeued. */
  isCancelled: () => boolean;
  /** Persist one completed audit. */
  onResult: (
    url: string,
    strategy: PagespeedStrategy,
    metrics: PagespeedMetrics,
  ) => void;
  /** Live progress — `currentUrl` is the URL just about to be audited. */
  onProgress: (done: number, total: number, currentUrl: string | null) => void;
}

export interface PagespeedBatchResult {
  completed: number;
  failed: number;
  cancelled: boolean;
}

/**
 * Run a PageSpeed audit over many items with a small concurrency pool.
 * Cancellation gates new items only — audits already in flight finish
 * and are persisted (a completed audit is always worth keeping).
 */
export async function runPagespeedBatch(
  opts: PagespeedBatchOptions,
): Promise<PagespeedBatchResult> {
  const { items, apiKey, isCancelled, onResult, onProgress } = opts;
  const total = items.length;
  let done = 0;
  let completed = 0;
  let failed = 0;
  let cursor = 0;

  // Per-error dedupe so a batch of 2000 URLs that all hit the same
  // Google quota cap doesn't spam the log with 2000 identical warn
  // lines. First N occurrences of each distinct error are logged with
  // the offending URL; further occurrences are silently counted and
  // summarised in the final batch line.
  const ERROR_LOG_LIMIT_PER_KIND = 3;
  const errorCounts = new Map<string, number>();
  function recordFailure(url: string, message: string): void {
    const prev = errorCounts.get(message) ?? 0;
    errorCounts.set(message, prev + 1);
    if (prev < ERROR_LOG_LIMIT_PER_KIND) {
      logger.log('warn', 'pagespeed', `${url} — ${message}`);
      if (prev + 1 === ERROR_LOG_LIMIT_PER_KIND) {
        logger.log(
          'warn',
          'pagespeed',
          `(further "${message.slice(0, 80)}${message.length > 80 ? '…' : ''}" errors will be summarised at end)`,
        );
      }
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
      const metrics = await fetchPagespeedAudit(
        item.url,
        item.strategy,
        apiKey,
      );
      try {
        onResult(item.url, item.strategy, metrics);
      } catch (err) {
        logger.log(
          'error',
          'pagespeed',
          `failed to persist audit for ${item.url}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
      done++;
      if (metrics.status === 'ok') {
        completed++;
      } else {
        failed++;
        recordFailure(item.url, metrics.error ?? 'Unknown error');
      }
      onProgress(done, total, null);
    }
  };

  const poolSize = Math.min(
    apiKey ? CONCURRENCY_WITH_KEY : CONCURRENCY_NO_KEY,
    Math.max(1, total),
  );
  await Promise.all(Array.from({ length: poolSize }, () => worker()));

  const cancelled = isCancelled() && done < total;
  logger.log(
    'info',
    'pagespeed',
    `batch finished — ${completed} ok, ${failed} failed${
      cancelled ? ', cancelled early' : ''
    } (${done}/${total})`,
  );
  if (errorCounts.size > 0) {
    const sorted = [...errorCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [message, count] of sorted) {
      logger.log(
        'warn',
        'pagespeed',
        `failure summary — ${count}× "${message}"`,
      );
    }
    // Specific advisory when EVERY failure is the keyless quota hit —
    // tells the user exactly what to do instead of leaving them to
    // decode Google's error string. Google's keyless shared project
    // currently has a hard 0/day quota for PSI v5 (see Settings →
    // Integrations → PageSpeed Insights for a free key).
    const allQuota =
      failed > 0 &&
      sorted.every(([m]) => /quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(m));
    if (allQuota && !apiKey) {
      logger.log(
        'warn',
        'pagespeed',
        "Google's keyless PageSpeed quota is currently 0/day — add a free API key under Settings → Integrations → PageSpeed Insights to run audits.",
      );
    }
  }
  return { completed, failed, cancelled };
}
