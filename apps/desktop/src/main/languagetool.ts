/**
 * LanguageTool client — spelling, grammar and style checking.
 *
 * Talks to a LanguageTool `/v2/check` endpoint: the free public API
 * (rate-limited), a self-hosted server, or a Premium account. The
 * endpoint / credentials come from the `languagetool` integration in the
 * credential store and are resolved in the main process only.
 *
 * Three layers, mirroring `pagespeed.ts` / `crux.ts`:
 *   - `fetchSupportedLanguages` — what this endpoint actually offers,
 *     cached per endpoint. Every check is validated against it.
 *   - `checkText` — one page's prose → matches (never throws; failures
 *     resolve to an `error` result so a single bad page can't abort a run).
 *   - `runSpellingBatch` — a concurrency pool over many URLs, with progress
 *     and cooperative cancellation. Text is supplied lazily per item by the
 *     caller so a 1000-page run never holds every page body in memory.
 *
 * The check language is resolved locally (see `language-detect.ts`) and
 * `auto` is never sent. LanguageTool's detector can only answer with a
 * language it supports, so on a Turkish page it reports "English, 0.99
 * confident" and flags every word — output that is indistinguishable from
 * a genuinely error-ridden page once it reaches the UI.
 */
import type {
  SpellingLanguageOption,
  SpellingLevel,
  SpellingMatch,
  SpellingResult,
} from '@freecrawl/shared-types';
import { Agent, ProxyAgent, fetch as undiciFetch, type Dispatcher } from 'undici';
import {
  indexSupportedLanguages,
  languageName,
  resolveCheckLanguage,
  type SupportedLanguages,
} from './language-detect.js';
import { checkTextLocally } from './local-spell.js';
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
 * Share of words that may be flagged as *misspellings* before the result
 * is treated as a language mismatch rather than a finding list.
 *
 * Calibrated against real responses: clean Spanish prose graded as
 * Galician — two languages close enough that detection can confuse them —
 * comes back at 24%, well under LanguageTool's own 60% bail-out, so
 * relying on that alone lets a whole page of false positives through.
 * Genuinely sloppy copy in the right language sits in the low single
 * digits. 20% separates the two with room to spare.
 *
 * Misspellings only: grammar and style rules fire on correct prose too, so
 * counting them would drag legitimate pages over the line. Applied only
 * above `MISMATCH_MIN_WORDS`, and never when the user pinned the language.
 */
const MISMATCH_RATIO = 0.2;
const MISMATCH_MIN_WORDS = 40;

/** How long a fetched `/v2/languages` list stays fresh. */
const LANGUAGES_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Languages the public API offered as of writing. Used only when
 * `/v2/languages` cannot be reached, so a transient network failure
 * degrades to a slightly stale list instead of blocking every check.
 */
const FALLBACK_LANGUAGES: SpellingLanguageOption[] = [
  { name: 'Arabic', code: 'ar', longCode: 'ar' },
  { name: 'Asturian', code: 'ast', longCode: 'ast-ES' },
  { name: 'Belarusian', code: 'be', longCode: 'be-BY' },
  { name: 'Breton', code: 'br', longCode: 'br-FR' },
  { name: 'Catalan', code: 'ca', longCode: 'ca-ES' },
  { name: 'Crimean Tatar', code: 'crh', longCode: 'crh-UA' },
  { name: 'Danish', code: 'da', longCode: 'da-DK' },
  { name: 'German (Germany)', code: 'de', longCode: 'de-DE' },
  { name: 'German (Austria)', code: 'de', longCode: 'de-AT' },
  { name: 'German (Swiss)', code: 'de', longCode: 'de-CH' },
  { name: 'Greek', code: 'el', longCode: 'el-GR' },
  { name: 'English (US)', code: 'en', longCode: 'en-US' },
  { name: 'English (GB)', code: 'en', longCode: 'en-GB' },
  { name: 'English (Australian)', code: 'en', longCode: 'en-AU' },
  { name: 'English (Canadian)', code: 'en', longCode: 'en-CA' },
  { name: 'English (New Zealand)', code: 'en', longCode: 'en-NZ' },
  { name: 'English (South African)', code: 'en', longCode: 'en-ZA' },
  { name: 'Esperanto', code: 'eo', longCode: 'eo' },
  { name: 'Spanish', code: 'es', longCode: 'es-ES' },
  { name: 'Spanish (Argentina)', code: 'es', longCode: 'es-AR' },
  { name: 'Persian', code: 'fa', longCode: 'fa-IR' },
  { name: 'French', code: 'fr', longCode: 'fr-FR' },
  { name: 'French (Belgium)', code: 'fr', longCode: 'fr-BE' },
  { name: 'French (Canada)', code: 'fr', longCode: 'fr-CA' },
  { name: 'French (Switzerland)', code: 'fr', longCode: 'fr-CH' },
  { name: 'Irish', code: 'ga', longCode: 'ga-IE' },
  { name: 'Galician', code: 'gl', longCode: 'gl-ES' },
  { name: 'Italian', code: 'it', longCode: 'it-IT' },
  { name: 'Japanese', code: 'ja', longCode: 'ja-JP' },
  { name: 'Khmer', code: 'km', longCode: 'km-KH' },
  { name: 'Norwegian (Bokmål)', code: 'nb', longCode: 'nb-NO' },
  { name: 'Dutch', code: 'nl', longCode: 'nl-NL' },
  { name: 'Dutch (Belgium)', code: 'nl', longCode: 'nl-BE' },
  { name: 'Polish', code: 'pl', longCode: 'pl-PL' },
  { name: 'Portuguese (Portugal)', code: 'pt', longCode: 'pt-PT' },
  { name: 'Portuguese (Brazil)', code: 'pt', longCode: 'pt-BR' },
  { name: 'Romanian', code: 'ro', longCode: 'ro-RO' },
  { name: 'Russian', code: 'ru', longCode: 'ru-RU' },
  { name: 'Slovak', code: 'sk', longCode: 'sk-SK' },
  { name: 'Slovenian', code: 'sl', longCode: 'sl-SI' },
  { name: 'Swedish', code: 'sv', longCode: 'sv-SE' },
  { name: 'Tamil', code: 'ta', longCode: 'ta-IN' },
  { name: 'Tagalog', code: 'tl', longCode: 'tl-PH' },
  { name: 'Ukrainian', code: 'uk', longCode: 'uk-UA' },
  { name: 'Chinese', code: 'zh', longCode: 'zh-CN' },
];

interface LanguagesCacheEntry {
  at: number;
  supported: SupportedLanguages;
}

const languagesCache = new Map<string, LanguagesCacheEntry>();

function normaliseEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, '');
}

/**
 * The set of languages one endpoint offers. Self-hosted servers ship
 * different language modules than the public API — and an n-gram-less
 * build offers fewer still — so this must be asked per endpoint rather
 * than assumed. Cached for `LANGUAGES_TTL_MS`; a failure falls back to the
 * bundled snapshot and is not cached, so the next run retries.
 */
export async function fetchSupportedLanguages(
  endpoint: string,
): Promise<SupportedLanguages> {
  const base = normaliseEndpoint(endpoint);
  const cached = languagesCache.get(base);
  if (cached && Date.now() - cached.at < LANGUAGES_TTL_MS) {
    return cached.supported;
  }
  try {
    const res = await undiciFetch(`${base}/v2/languages`, {
      method: 'GET',
      signal: AbortSignal.timeout(20_000),
      headers: { Accept: 'application/json' },
      dispatcher: ltDispatcher,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as unknown;
    if (!Array.isArray(json) || json.length === 0) {
      throw new Error('empty language list');
    }
    const options: SpellingLanguageOption[] = [];
    for (const entry of json as Record<string, unknown>[]) {
      const name = typeof entry['name'] === 'string' ? entry['name'] : '';
      const code = typeof entry['code'] === 'string' ? entry['code'] : '';
      const longCode =
        typeof entry['longCode'] === 'string' ? entry['longCode'] : code;
      if (!code || !longCode) continue;
      options.push({ name: name || longCode, code, longCode });
    }
    if (options.length === 0) throw new Error('no usable language entries');
    const supported = indexSupportedLanguages(options);
    languagesCache.set(base, { at: Date.now(), supported });
    return supported;
  } catch (err) {
    logger.log(
      'warn',
      'languagetool',
      `could not read supported languages from ${base} (${
        err instanceof Error ? err.message : String(err)
      }) — using the bundled list`,
    );
    return indexSupportedLanguages(FALLBACK_LANGUAGES);
  }
}

/** Drop the cached language list — call when the endpoint changes. */
export function clearSupportedLanguagesCache(): void {
  languagesCache.clear();
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

/** A result carrying no findings — the shape shared by every non-`ok` outcome. */
function emptyResult(
  fetchedAt: string,
  status: SpellingResult['status'],
  message: string | null,
  lang: {
    language?: string | null;
    detected?: string | null;
    declared?: string | null;
  } = {},
): SpellingResult {
  return {
    language: lang.language ?? null,
    detectedLanguage: lang.detected ?? null,
    declaredLanguage: lang.declared ?? null,
    matchCount: 0,
    matches: [],
    status,
    engine: null,
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
  /** Languages this endpoint offers — every check is validated against it. */
  supported: SupportedLanguages;
  /**
   * User-pinned LanguageTool code from Settings. When set it wins over
   * both the page's `html[lang]` and local detection, and disables the
   * mismatch guard — the user has asserted the answer.
   */
  languageOverride?: string | undefined;
}

/** undici's Response — inferred rather than cast to the DOM `Response`. */
type LtResponse = Awaited<ReturnType<typeof undiciFetch>>;

/**
 * POST one check. The body is read as text first and only then parsed:
 * LanguageTool reports failures as a plain-text `Error: …` line, not JSON,
 * so parsing straight to JSON throws away the one thing that explains what
 * went wrong — including its "this text isn't in that language" verdict.
 */
async function postCheck(
  text: string,
  language: string,
  opts: SpellingCheckOptions,
): Promise<{
  res: LtResponse;
  json: Record<string, unknown> | null;
  body: string;
}> {
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
  const raw = await res.text().catch(() => '');
  let json: Record<string, unknown> | null = null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      json = parsed as Record<string, unknown>;
    }
  } catch {
    // Plain-text error body — `raw` carries the message.
  }
  return { res, json, body: raw };
}

/** Rough word count of the checked sample, for the mismatch ratio. */
function countWords(text: string): number {
  const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu);
  return words ? words.length : 0;
}

/**
 * LanguageTool's own bail-out when the text is clearly in another
 * language: `Text checking was stopped due to too many errors (more than
 * 60% of words seem to have an error)`. That is a language verdict, not a
 * transport failure, and reads far better as one.
 */
function isLanguageBailout(message: string): boolean {
  return /too many errors|correct text language/i.test(message);
}

/**
 * Check one page's prose. Never throws.
 *
 * The language is resolved locally first — from the prose itself,
 * reconciled with `html[lang]` — and validated against the endpoint's own
 * language list. A page whose language this endpoint does not offer
 * resolves to `unsupported` *without* a request: substituting the nearest
 * supported language (which is what LanguageTool's `auto` does) returns a
 * finding on almost every word, and those findings are worse than none.
 *
 * A result that comes back with an implausible share of the page flagged
 * is treated the same way — `mismatch` — because that is what a wrong
 * language looks like from the outside.
 */
export async function checkText(
  text: string,
  pageLang: string | null,
  opts: SpellingCheckOptions,
): Promise<SpellingResult> {
  const fetchedAt = new Date().toISOString();
  const prose = text.trim();
  if (prose.length < MIN_PROSE_CHARS) {
    return emptyResult(fetchedAt, 'skipped', null);
  }
  const clipped =
    prose.length > MAX_TEXT_CHARS ? prose.slice(0, MAX_TEXT_CHARS) : prose;

  const decision = await resolveCheckLanguage({
    text: clipped,
    pageLang,
    supported: opts.supported,
    override: opts.languageOverride,
  });
  const langInfo = {
    detected: decision.detected,
    declared: decision.declared,
  };

  if (!decision.language) {
    // LanguageTool cannot check this language — but a bundled Hunspell
    // dictionary may still be able to. Spelling only; the result records
    // which engine ran so nothing implies the grammar was examined.
    const fallbackLang = decision.detected ?? decision.declared;
    if (decision.reason === 'unsupported' && fallbackLang) {
      const local = await checkTextLocally(
        clipped,
        fallbackLang,
        opts.ignoreWords,
      );
      if (local) {
        return {
          language: fallbackLang,
          detectedLanguage: decision.detected,
          declaredLanguage: decision.declared,
          matchCount: local.matches.length,
          matches: local.matches,
          status: 'ok',
          engine: 'local',
          error: null,
          fetchedAt,
        };
      }
    }
    return emptyResult(
      fetchedAt,
      decision.reason === 'unsupported' ? 'unsupported' : 'skipped',
      decision.message,
      langInfo,
    );
  }
  const language = decision.language;

  try {
    const { res, json, body } = await postCheck(clipped, language, opts);
    if (!res.ok) {
      const apiErr =
        (json?.['message'] as string | undefined) ??
        (json?.['error'] as string | undefined) ??
        // Plain-text `Error: …` body, trimmed to something a table cell
        // and a tooltip can carry.
        (body.trim().length > 0
          ? body.trim().replace(/^Error:\s*/i, '').slice(0, 400)
          : `LanguageTool returned HTTP ${res.status}`);
      if (isLanguageBailout(apiErr)) {
        return emptyResult(
          fetchedAt,
          'mismatch',
          `LanguageTool stopped checking — the page does not read as ${languageName(language)}. Pin the language under Settings → Spelling if this is wrong.`,
          { ...langInfo, language },
        );
      }
      return emptyResult(fetchedAt, 'error', apiErr, {
        ...langInfo,
        language,
      });
    }
    if (!json) {
      return emptyResult(
        fetchedAt,
        'error',
        'LanguageTool returned an empty response',
        { ...langInfo, language },
      );
    }

    const langBlock = json['language'] as { code?: unknown } | undefined;
    const usedLang =
      typeof langBlock?.code === 'string' ? langBlock.code : language;

    const rawMatches = Array.isArray(json['matches'])
      ? (json['matches'] as LtMatch[])
      : [];
    const matches = rawMatches
      .map(mapMatch)
      .filter((m): m is SpellingMatch => m !== null)
      // Custom dictionary — drop findings on words the user whitelisted.
      .filter((m) => !opts.ignoreWords.has(m.text.toLowerCase()))
      .slice(0, MAX_STORED_MATCHES);

    // Density guard — the last line of defence against a wrong language
    // reaching the UI as a finding list.
    //
    // Only consulted when the language was actually in doubt. If the page's
    // own `html[lang]` and the trigram detector independently named the
    // same language, two signals already agree and a high error rate is the
    // finding, not a reason to doubt them — a genuinely typo-ridden English
    // page must still report its typos. Likewise skipped when the user
    // pinned the language: they overruled the detector on purpose.
    if (!opts.languageOverride && !decision.agreed) {
      const words = countWords(clipped);
      const misspellings = matches.filter(
        (m) => m.issueType === 'misspelling',
      ).length;
      if (
        words >= MISMATCH_MIN_WORDS &&
        misspellings / words > MISMATCH_RATIO
      ) {
        return emptyResult(
          fetchedAt,
          'mismatch',
          `${Math.round((misspellings / words) * 100)}% of words were flagged when checked as ${languageName(usedLang)} — the page is almost certainly written in another language, so the findings were discarded. Pin the language under Settings → Spelling if this is wrong.`,
          { ...langInfo, language: usedLang },
        );
      }
    }

    return {
      language: usedLang,
      detectedLanguage: decision.detected,
      declaredLanguage: decision.declared,
      matchCount: matches.length,
      matches,
      status: 'ok',
      engine: 'languagetool',
      error: null,
      fetchedAt,
    };
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
    return emptyResult(fetchedAt, 'error', message, {
      ...langInfo,
      language,
    });
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
  /** Pages whose language this endpoint does not support. */
  unsupported: number;
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
  let unsupported = 0;
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
  /** Languages seen that this endpoint cannot check, for the summary line. */
  const unsupportedLangs = new Map<string, number>();

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
          result = emptyResult(fetchedAt, 'skipped', null);
        } else {
          result = await checkText(page.text, page.lang, check);
        }
      } catch (err) {
        result = emptyResult(
          fetchedAt,
          'error',
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
        } else if (result.status === 'unsupported') {
          unsupported++;
          const lang = languageName(
            result.detectedLanguage ?? result.declaredLanguage,
          );
          unsupportedLangs.set(lang, (unsupportedLangs.get(lang) ?? 0) + 1);
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
  if (unsupportedLangs.size > 0) {
    const breakdown = [...unsupportedLangs.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([lang, count]) => `${count}× ${lang}`)
      .join(', ');
    logger.log(
      'warn',
      'languagetool',
      `${unsupported} page(s) were not checked — LanguageTool has no rules for their language (${breakdown}). This is a limitation of LanguageTool itself, not of the crawl.`,
    );
  }
  return { completed, failed, unsupported, cancelled };
}
