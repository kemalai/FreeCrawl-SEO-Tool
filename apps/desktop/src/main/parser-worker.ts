import { parentPort } from 'node:worker_threads';
import { parseHtml } from '@freecrawl/core';

/**
 * HTML-parser worker thread.
 *
 * Cheerio + the link/image/structured-data extractor is the hottest
 * CPU path in `fetchAndProcess`. On large mağaza listing / blog
 * pages it can spend 10-25 s of pure JS on a single document while
 * the main thread holds the Electron event loop. Running the parse
 * here means the main process only waits for the result via
 * postMessage — IPC pumps and crawler scheduling stay live.
 *
 * Protocol:
 *   main → worker:  `{ requestId, html, pageUrl, opts }`
 *   worker → main:  `{ requestId, ok: true, result }`
 *                or `{ requestId, ok: false, error }`
 *
 * One worker handles one request at a time; the pool spreads requests
 * across workers via round-robin (see `parser-pool.ts`).
 */

if (!parentPort) {
  throw new Error('parser-worker: must be loaded via worker_threads');
}

interface ParseRequest {
  requestId: number;
  html: string;
  pageUrl: string;
  opts: Parameters<typeof parseHtml>[2];
}

parentPort.on('message', (msg: ParseRequest) => {
  if (!msg || typeof msg.requestId !== 'number') return;
  try {
    const result = parseHtml(msg.html, msg.pageUrl, msg.opts);
    parentPort!.postMessage({ requestId: msg.requestId, ok: true, result });
  } catch (err) {
    parentPort!.postMessage({
      requestId: msg.requestId,
      ok: false,
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    });
  }
});
