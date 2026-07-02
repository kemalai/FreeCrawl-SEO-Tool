/**
 * Shared undici dispatcher for main-process API integrations — AI providers,
 * Search Console, GA4, Google Sheets / BigQuery, OAuth, SEO providers and the
 * update check.
 *
 * The crawler installs a *process-global* dispatcher via `setGlobalDispatcher`
 * with `headersTimeout: 10_000` (see packages/core `http-client.ts`). That is
 * correct for crawling — a stuck origin can't freeze the connection pool — but
 * fatal for these clients: a plain global `fetch` inherits the global
 * dispatcher, so any API whose response takes more than 10 s to the first byte
 * (a slow LLM completion, a large GSC/GA4 report, a Sheets/BigQuery write) is
 * killed at the transport layer as a generic "fetch failed"
 * (UND_ERR_HEADERS_TIMEOUT), regardless of the client's own longer
 * `AbortSignal`. The failure only appears *after* the first crawl of a session
 * installs the global dispatcher, which makes it maddening to diagnose.
 *
 * This dedicated dispatcher uses generous header/body timeouts (each client
 * still enforces its real cap via `AbortSignal`) and honours HTTPS_PROXY /
 * HTTP_PROXY so corporate-proxy users keep working, mirroring the PSI client
 * in `pagespeed.ts` that already solved this for its own requests.
 */
import { Agent, ProxyAgent, fetch as undiciFetch, type Dispatcher } from 'undici';

/** Above the longest client-side AbortSignal (120 s in sheets-export). */
const TIMEOUT_MS = 125_000;

function createApiDispatcher(): Dispatcher {
  const timeouts = { headersTimeout: TIMEOUT_MS, bodyTimeout: TIMEOUT_MS };
  const proxy =
    process.env['HTTPS_PROXY'] ??
    process.env['https_proxy'] ??
    process.env['HTTP_PROXY'] ??
    process.env['http_proxy'] ??
    null;
  if (proxy) {
    return new ProxyAgent({ uri: proxy, ...timeouts });
  }
  return new Agent({ ...timeouts, connect: { autoSelectFamily: true } });
}

const apiDispatcher = createApiDispatcher();

type FetchParams = Parameters<typeof undiciFetch>;

/**
 * Drop-in replacement for the global `fetch` in main-process integration
 * clients. Pins every request to the dedicated integration dispatcher above so
 * it never inherits the crawler's aggressive global `headersTimeout`.
 */
export function apiFetch(input: FetchParams[0], init?: FetchParams[1]) {
  return undiciFetch(input, { ...(init ?? {}), dispatcher: apiDispatcher });
}
