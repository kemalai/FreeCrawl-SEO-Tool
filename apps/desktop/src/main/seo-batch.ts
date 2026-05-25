/**
 * Faz 7 — SEO authority batch runner.
 *
 * Same shape as the AI / PageSpeed batches: a small concurrency pool
 * fans `(url)` items through the chosen provider, reports each result
 * via `onResult`, and streams progress through `onProgress`. The
 * orchestrating IPC handler owns DB writes.
 */
import type { SeoMetrics, SeoProvider } from '@freecrawl/shared-types';
import { fetchSeoMetrics, SeoProviderError } from './seo-providers.js';
import * as logger from './logger.js';

const DEFAULT_CONCURRENCY = 2;

export interface SeoBatchOutcome {
  url: string;
  ok: boolean;
  metrics: SeoMetrics | null;
  error: string | null;
}

export interface SeoBatchOptions {
  provider: SeoProvider;
  urls: string[];
  isCancelled: () => boolean;
  onResult: (outcome: SeoBatchOutcome) => void;
  onProgress: (done: number, total: number, currentUrl: string | null) => void;
}

export interface SeoBatchResult {
  completed: number;
  failed: number;
  cancelled: boolean;
}

export async function runSeoBatch(opts: SeoBatchOptions): Promise<SeoBatchResult> {
  const { provider, urls, isCancelled, onResult, onProgress } = opts;
  const total = urls.length;
  let done = 0;
  let completed = 0;
  let failed = 0;
  let cursor = 0;
  onProgress(0, total, null);

  const worker = async (): Promise<void> => {
    for (;;) {
      if (isCancelled()) return;
      const index = cursor++;
      if (index >= total) return;
      const url = urls[index]!;
      onProgress(done, total, url);
      let outcome: SeoBatchOutcome;
      try {
        const metrics = await fetchSeoMetrics(provider, url);
        outcome = { url, ok: true, metrics, error: null };
      } catch (err) {
        const message =
          err instanceof SeoProviderError
            ? err.message
            : err instanceof Error
              ? err.message
              : String(err);
        outcome = { url, ok: false, metrics: null, error: message };
      }
      try {
        onResult(outcome);
      } catch (err) {
        logger.log(
          'error',
          'seo',
          `failed to persist SEO result for ${url}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
      done++;
      if (outcome.ok) completed++;
      else failed++;
      onProgress(done, total, null);
    }
  };

  const pool = Math.min(Math.max(1, DEFAULT_CONCURRENCY), Math.max(1, total));
  await Promise.all(Array.from({ length: pool }, () => worker()));

  const cancelled = isCancelled() && done < total;
  logger.log(
    'info',
    'seo',
    `${provider} batch finished — ${completed} ok, ${failed} failed${
      cancelled ? ', cancelled early' : ''
    } (${done}/${total})`,
  );
  return { completed, failed, cancelled };
}
