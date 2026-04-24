import dns from 'node:dns';
import { Agent, setGlobalDispatcher } from 'undici';
import CacheableLookup from 'cacheable-lookup';

let initialized = false;

/**
 * Configure the global undici dispatcher and Node DNS once per process.
 *
 * - `cacheable-lookup` caches DNS results so we don't saturate libuv's
 *   4-thread lookup pool when running 50+ concurrent requests.
 * - `ipv4first` avoids 1–2s stalls when a host has a dead AAAA record.
 * - The Agent is tuned for crawler-style workloads: many concurrent
 *   connections per origin, long keep-alive, tight headers timeout so a
 *   stuck origin can't freeze the pool.
 */
export function initHttpClient(): void {
  if (initialized) return;
  initialized = true;

  dns.setDefaultResultOrder('ipv4first');

  const cacheable = new CacheableLookup({
    maxTtl: 300,
    errorTtl: 15,
  });

  const agent = new Agent({
    connections: 128,
    pipelining: 1,
    keepAliveTimeout: 60_000,
    keepAliveMaxTimeout: 120_000,
    headersTimeout: 10_000,
    bodyTimeout: 30_000,
    connect: {
      // cacheable-lookup.lookup matches Node's dns.lookup signature, which
      // is compatible with undici at runtime but the typings diverge.
      lookup: cacheable.lookup.bind(cacheable) as never,
    },
  });

  setGlobalDispatcher(agent);
}

/**
 * Headers every crawler request should send. Compression is requested so
 * servers can save 60–80% bandwidth on HTML; undici's fetch auto-decodes.
 */
export function defaultRequestHeaders(userAgent: string, acceptLanguage: string): Record<string, string> {
  return {
    'user-agent': userAgent,
    'accept-language': acceptLanguage,
    'accept-encoding': 'gzip, deflate, br',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  };
}
