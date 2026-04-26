/**
 * "Crawl finished" webhook poster. Fires a single `POST <url>` with a
 * compact JSON summary so external systems (Slack via incoming webhook,
 * Discord, Zapier, an internal dashboard) can react to crawl completion
 * without tailing logs.
 *
 * Failures don't throw — they're returned in the result so the caller
 * can surface them as an info/warning event without aborting the crawl
 * teardown. Webhook delivery is best-effort by definition.
 */
import { fetch } from 'undici';
import type { CrawlSummary, OverviewCounts } from '@freecrawl/shared-types';

export interface WebhookPayload {
  /** ISO 8601 timestamp the crawl finished at. */
  finishedAt: string;
  /** The starting URL the crawl was anchored to. */
  startUrl: string;
  /** Total wall-clock duration in milliseconds. */
  durationMs: number;
  /** Aggregate counts from `db.getSummary()`. */
  summary: CrawlSummary;
  /** Top-level issue counts from `db.getOverviewCounts()`. */
  issues: OverviewCounts['issues'];
}

export interface WebhookResult {
  /** True iff the POST returned a 2xx response. */
  ok: boolean;
  /** HTTP status when reachable, else null. */
  status: number | null;
  /** First 500 chars of the response body or error message. */
  detail: string;
  /** Wall-clock latency of the POST. */
  durationMs: number;
}

export async function postCrawlCompleteWebhook(
  url: string,
  payload: WebhookPayload,
  timeoutMs = 10_000,
): Promise<WebhookResult> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'FreeCrawlSEO-Webhook/0.1',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      detail: text.slice(0, 500),
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      ok: false,
      status: null,
      detail: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  } finally {
    clearTimeout(t);
  }
}
