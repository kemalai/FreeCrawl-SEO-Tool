/**
 * Faz 7 — AI batch runner.
 *
 * Same shape as the PageSpeed batch (`pagespeed.ts#runPagespeedBatch`):
 * a small concurrency pool walks a list of `(url, prompt)` items,
 * dispatches each to the selected provider, and reports completed
 * results + live progress through callbacks. The orchestrating IPC
 * handler owns prompt substitution and DB writes.
 */
import type { AiProvider } from '@freecrawl/shared-types';
import { runPrompt, AiRunError, type AiRunOutput } from './ai-providers.js';
import * as logger from './logger.js';

export interface AiBatchItem {
  url: string;
  prompt: string;
}

export interface AiBatchOutcome {
  url: string;
  ok: boolean;
  output: AiRunOutput | null;
  error: string | null;
}

export interface AiBatchOptions {
  provider: AiProvider;
  model: string;
  concurrency: number;
  items: AiBatchItem[];
  isCancelled: () => boolean;
  onResult: (outcome: AiBatchOutcome) => void;
  onProgress: (done: number, total: number, currentUrl: string | null) => void;
}

export interface AiBatchResult {
  completed: number;
  failed: number;
  cancelled: boolean;
}

export async function runAiBatch(opts: AiBatchOptions): Promise<AiBatchResult> {
  const { provider, model, concurrency, items, isCancelled, onResult, onProgress } = opts;
  const total = items.length;
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
      const item = items[index];
      if (!item) return;
      onProgress(done, total, item.url);
      let outcome: AiBatchOutcome;
      try {
        const output = await runPrompt(provider, model, item.prompt);
        outcome = { url: item.url, ok: true, output, error: null };
      } catch (err) {
        const message =
          err instanceof AiRunError
            ? err.message
            : err instanceof Error
              ? err.message
              : String(err);
        outcome = { url: item.url, ok: false, output: null, error: message };
      }
      try {
        onResult(outcome);
      } catch (err) {
        logger.log(
          'error',
          'ai',
          `failed to persist AI result for ${item.url}: ${
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

  const pool = Math.min(Math.max(1, concurrency), Math.max(1, total));
  await Promise.all(Array.from({ length: pool }, () => worker()));

  const cancelled = isCancelled() && done < total;
  logger.log(
    'info',
    'ai',
    `${provider}/${model} batch finished — ${completed} ok, ${failed} failed${
      cancelled ? ', cancelled early' : ''
    } (${done}/${total})`,
  );
  return { completed, failed, cancelled };
}
