/**
 * LanguageTool client — spelling, grammar and style checking.
 *
 * Talks to a LanguageTool `/v2/check` endpoint: the free public API
 * (rate-limited), a self-hosted server, or a Premium account. The
 * endpoint / credentials come from the `languagetool` integration in the
 * credential store and are resolved in the main process only.
 *
 * Two layers, mirroring `pagespeed.ts` / `crux.ts`:
 *   - `checkText` — one page's prose → matches (never throws; failures
 *     resolve to an `error` result so a single bad page can't abort a run).
 *   - `runSpellingBatch` — a concurrency pool over many URLs, with progress
 *     and cooperative cancellation. Text is supplied lazily per item by the
 *     caller so a 1000-page run never holds every page body in memory.
 */
import type {
  SpellingLevel,
  SpellingMatch,
  SpellingResult,
} from '@freecrawl/shared-types';
import { Agent, ProxyAgent, fetch as undiciFetch, type Dispatcher } from 'undici';
import * as logger from './logger.js';

export const PUBLIC_LT_ENDPOINT = 'https://api.languagetool.org';

const REQUEST_TIMEOUT_MS = 60_000;

/** LanguageTool's public API rejects payloads above 20 KB of text. */
const MAX_TEXT_CHARS = 20_000;
/** Below this, a page is navigation/boilerplate — checking it is noise. */
const MIN_PROSE_CHARS = 40;
/** Bound the stored JSON blob for pathological pages. */
const MAX_STORED_MATCHES = 500;
/** Suggestions kept per match. */
const MAX_REPLACEMENTS = 5;

/** The public API is aggressively rate-limited; self-hosted is not. */
const CONCURRENCY_PUBLIC = 1;
const CONCURRENCY_SELF_HOSTED = 4;

/**
 * Languages LanguageTool refuses to accept as a bare code — it demands an
 * explicit regional variant. Everything else passes through as-is.
 */
const VARIANT_REQUIRED: Record<string, string> = {
  en: 'en-US',
  de: 'de-DE',
  pt: 'pt-PT',
  ca: 'ca-ES',
};

/**
 * Map a page's `html[lang]` to a LanguageTool language code. Returns
 * `auto` when the page declares nothing, letting LanguageTool detect it.
 */
export function resolveLanguage(pageLang: string | null): string {
  const raw = (pageLang ?? '').trim().toLowerCase();
  if (!raw) return 'auto';
  const parts = raw.split('-');
  const primary = parts[0] ?? '';
  if (!primary) return 'auto';
  if (parts.length >= 2 && parts[1]) {
    return `${primary}-${parts[1].toUpperCase()}`;
  }
  return VARIANT_REQUIRED[primary] ?? primary;
}

function createLtDispatcher(): Dispatcher {
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

const ltDispatcher = createLtDispatcher();

function errorResult(fetchedAt: string, message: string): SpellingResult {
  return {
    language: null,
    matchCount: 0,
    matches: [],
    status: 'error',
    error: message,
    fetchedAt,
  };
}

/** Shape of a single LanguageTool `/v2/check` match. */
interface LtMatch {
  message?: unknown;
  shortMessage?: unknown;
  offset?: unknown;
  length?: unknown;
  replacements?: unknown;
  context?: { text?: unknown; offset?: unknown; length?: unknown };
  rule?: {
    id?: unknown;
    issueType?: unknown;
    category?: { name?: unknown };
  };
}

function mapMatch(m: LtMatch): SpellingMatch | null {
  const ctxText = typeof m.context?.text === 'string' ? m.context.text : '';
  const ctxOffset =
    typeof m.context?.offset === 'number' ? m.context.offset : 0;
  const ctxLength =
    typeof m.context?.length === 'number' ? m.context.length : 0;
  const surface = ctxText.substr(ctxOffset, ctxLength);
  if (!surface) return null;

  const replacements = Array.isArray(m.replacements)
    ? (m.replacements as { value?: unknown }[])
        .map((r) => (typeof r.value === 'string' ? r.value : null))
        .filter((v): v is string => !!v)
        .slice(0, MAX_REPLACEMENTS)
    : [];

  return {
    message: typeof m.message === 'string' ? m.message : '',
    shortMessage:
      typeof m.shortMessage === 'string' && m.shortMessage.length > 0
        ? m.shortMessage
        : null,
    offset: typeof m.offset === 'number' ? m.offset : 0,
    length: typeof m.length === 'number' ? m.length : surface.length,
    text: surface,
    context: ctxText,
    contextOffset: ctxOffset,
    replacements,
    ruleId: typeof m.rule?.id === 'string' ? m.rule.id : '',
    category:
      typeof m.rule?.category?.name === 'string' ? m.rule.category.name : '',
    issueType:
      typeof m.rule?.issueType === 'string' ? m.rule.issueType : 'misc',
  };
}

export interface SpellingCheckOptions {
  /** Base URL, e.g. `https://api.languagetool.org` or a self-hosted one. */
  endpoint: string;
  username?: string | undefined;
  apiKey?: string | undefined;
  level: SpellingLevel;
  /** Lower-cased surface forms to suppress (the custom dictionary). */
  ignoreWords: ReadonlySet<string>;
}

/** undici's Response — inferred rather than cast to the DOM `Response`. */
type LtResponse = Awaited<ReturnType<typeof undiciFetch>>;

async function postCheck(
  text: string,
  language: string,
  opts: SpellingCheckOptions,
): Promise<{ res: LtResponse; json: Record<string, unknown> | null }> {
  const body = new URLSearchParams({
    text,
    language,
    level: opts.level,
  });
  // Premium auth is a username + key pair; both must be present.
  if (opts.username && opts.apiKey) {
    body.set('username', opts.username);
    body.set('apiKey', opts.apiKey);
  }
  const base = opts.endpoint.replace(/\/+$/, '');
  const res = await undiciFetch(`${base}/v2/check`, {
    method: 'POST',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
    dispatcher: ltDispatcher,
  });
  const json = (await res.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  return { res, json };
}

/**
 * Check one page's prose. Never throws. A page with too little prose
 * resolves to `skipped`; a transport/API failure to `error`.
 *
 * When the declared `html[lang]` is a code LanguageTool rejects, the call
 * is retried once with `auto` so a bad lang attribute doesn't silently
 * cost the user the whole page.
 */
export async function checkText(
  text: string,
  pageLang: string | null,
  opts: SpellingCheckOptions,
): Promise<SpellingResult> {
  const fetchedAt = new Date().toISOString();
  const prose = text.trim();
  if (prose.length < MIN_PROSE_CHARS) {
    return {
      language: null,
      matchCount: 0,
      matches: [],
      status: 'skipped',
      error: null,
      fetchedAt,
    };
  }
  const clipped =
    prose.length > MAX_TEXT_CHARS ? prose.slice(0, MAX_TEXT_CHARS) : prose;

  const attempt = async (
    language: string,
  ): Promise<{ ok: boolean; result: SpellingResult }> => {
    const { res, json } = await postCheck(clipped, language, opts);
    if (!res.ok) {
      const apiErr =
        (json?.['message'] as string | undefined) ??
        (json?.['error'] as string | undefined);
      return {
        ok: false,
        result: errorResult(
          fetchedAt,
          apiErr ?? `LanguageTool returned HTTP ${res.status}`,
        ),
      };
    }
    if (!json) {
      return {
        ok: false,
        result: errorResult(fetchedAt, 'LanguageTool returned an empty response'),
      };
    }
    const langBlock = json['language'] as
      | { code?: unknown; detectedLanguage?: { code?: unknown } }
      | undefined;
    const usedLang =
      typeof langBlock?.code === 'string'
        ? langBlock.code
        : typeof langBlock?.detectedLanguage?.code === 'string'
          ? langBlock.detectedLanguage.code
          : null;

    const rawMatches = Array.isArray(json['matches'])
      ? (json['matches'] as LtMatch[])
      : [];
    const matches = rawMatches
      .map(mapMatch)
      .filter((m): m is SpellingMatch => m !== null)
      // Custom dictionary — drop findings on words the user whitelisted.
      .filter((m) => !opts.ignoreWords.has(m.text.toLowerCase()))
      .slice(0, MAX_STORED_MATCHES);

    return {
      ok: true,
      result: {
        language: usedLang,
        matchCount: matches.length,
        matches,
        status: 'ok',
        error: null,
        fetchedAt,
      },
    };
  };

  try {
    const language = resolveLanguage(pageLang);
    const first = await attempt(language);
    if (first.ok) return first.result;
    // A rejected language code is the one failure worth retrying — fall
    // back to LanguageTool's own detection rather than losing the page.
    if (language !== 'auto' && /lang/i.test(first.result.error ?? '')) {
      const retry = await attempt('auto');
      if (retry.ok) return retry.result;
    }
    return first.result;
  } catch (err) {
    const name = (err as { name?: string } | null)?.name;
    const cause = (err as { cause?: unknown } | null)?.cause as
      | { code?: string; message?: string }
      | undefined;
    const isTimeout =
      name === 'TimeoutError' ||
      name === 'AbortError' ||
      cause?.code === 'UND_ERR_HEADERS_TIMEOUT' ||
      cause?.code === 'UND_ERR_BODY_TIMEOUT' ||
      cause?.code === 'UND_ERR_CONNECT_TIMEOUT';
    const message = isTimeout
      ? `LanguageTool request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`
      : err instanceof Error
        ? cause?.message
          ? `${err.message} (${cause.message})`
          : err.message
        : String(err);
    return errorResult(fetchedAt, message);
  }
}

export interface SpellingBatchOptions {
  urls: string[];
  check: SpellingCheckOptions;
  /**
   * Resolve one page's prose + declared language. Returning `null` text
   * marks the page `skipped` without hitting the API.
   */
  loadPage: (
    url: string,
  ) => Promise<{ text: string | null; lang: string | null }>;
  isCancelled: () => boolean;
  onResult: (url: string, result: SpellingResult) => void;
  onProgress: (done: number, total: number, currentUrl: string | null) => void;
}

export interface SpellingBatchResult {
  completed: number;
  failed: number;
  cancelled: boolean;
}

/**
 * Check many pages with a small concurrency pool. The public API allows
 * roughly 20 requests/minute, so it runs strictly serially; a self-hosted
 * endpoint gets real parallelism.
 */
export async function runSpellingBatch(
  opts: SpellingBatchOptions,
): Promise<SpellingBatchResult> {
  const { urls, check, loadPage, isCancelled, onResult, onProgress } = opts;
  const total = urls.length;
  let done = 0;
  let completed = 0;
  let failed = 0;
  let cursor = 0;

  const ERROR_LOG_LIMIT = 3;
  const errorCounts = new Map<string, number>();
  const recordFailure = (url: string, message: string): void => {
    const prev = errorCounts.get(message) ?? 0;
    errorCounts.set(message, prev + 1);
    if (prev < ERROR_LOG_LIMIT) {
      logger.log('warn', 'languagetool', `${url} — ${message}`);
    }
  };

  onProgress(0, total, null);

  const worker = async (): Promise<void> => {
    for (;;) {
      if (isCancelled()) return;
      const index = cursor++;
      if (index >= total) return;
      const url = urls[index];
      if (!url) return;
      onProgress(done, total, url);

      const fetchedAt = new Date().toISOString();
      let result: SpellingResult;
      try {
        const page = await loadPage(url);
        if (!page.text || page.text.trim().length === 0) {
          result = {
            language: null,
            matchCount: 0,
            matches: [],
            status: 'skipped',
            error: null,
            fetchedAt,
          };
        } else {
          result = await checkText(page.text, page.lang, check);
        }
      } catch (err) {
        result = errorResult(
          fetchedAt,
          err instanceof Error ? err.message : String(err),
        );
      }

      try {
        onResult(url, result);
      } catch (err) {
        logger.log(
          'error',
          'languagetool',
          `failed to persist result for ${url}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
      done++;
      if (result.status === 'ok') {
        completed++;
      } else {
        failed++;
        if (result.status === 'error') {
          recordFailure(url, result.error ?? 'Unknown error');
        }
      }
      onProgress(done, total, null);
    }
  };

  const isPublic = check.endpoint
    .replace(/\/+$/, '')
    .startsWith(PUBLIC_LT_ENDPOINT);
  const poolSize = Math.min(
    isPublic ? CONCURRENCY_PUBLIC : CONCURRENCY_SELF_HOSTED,
    Math.max(1, total),
  );
  await Promise.all(Array.from({ length: poolSize }, () => worker()));

  const cancelled = isCancelled() && done < total;
  logger.log(
    'info',
    'languagetool',
    `batch finished — ${completed} checked, ${failed} skipped/failed${
      cancelled ? ', cancelled early' : ''
    } (${done}/${total})`,
  );
  if (errorCounts.size > 0) {
    for (const [message, count] of [...errorCounts.entries()].sort(
      (a, b) => b[1] - a[1],
    )) {
      logger.log(
        'warn',
        'languagetool',
        `failure summary — ${count}× "${message}"`,
      );
    }
    if (isPublic) {
      logger.log(
        'warn',
        'languagetool',
        'The public LanguageTool API is rate-limited (~20 requests/min). Self-host LanguageTool or add Premium credentials under Settings → Integrations for larger runs.',
      );
    }
  }
  return { completed, failed, cancelled };
}
