/**
 * Spelling & Grammar integration types (LanguageTool).
 *
 * FreeCrawl sends each selected page's prose to a LanguageTool `/v2/check`
 * endpoint — either the free public API, a self-hosted server, or a
 * Premium account — and stores the returned matches per URL.
 *
 * The check language is resolved locally before anything is sent: the
 * page's prose is fingerprinted with a trigram detector and reconciled
 * against its declared `html[lang]`, then validated against the languages
 * the configured endpoint actually supports. LanguageTool's own `auto`
 * mode is deliberately never used — it can only answer with a language it
 * supports, so it labels Turkish prose "English (99% confident)" and
 * returns a finding on every word. Results are fetched on-demand against a
 * user-selected subset (checking a whole crawl would blow through the
 * public API's rate limit), so this mirrors the PageSpeed / CrUX batch
 * model.
 */

/** LanguageTool rule strictness. `picky` enables style/typography rules. */
export type SpellingLevel = 'default' | 'picky';

/**
 * Outcome of one page's check.
 *
 * `ok`          — checked, `matches` is authoritative
 * `skipped`     — too little prose to check
 * `unsupported` — the page's language isn't offered by this endpoint
 *                 (Turkish, Hungarian, Czech, … are simply absent from
 *                 LanguageTool); no request was made
 * `mismatch`    — checked, but the finding density proves the resolved
 *                 language was wrong, so the findings are discarded
 *                 rather than shown as thousands of false positives
 * `error`       — transport or API failure
 */
export type SpellingStatus =
  | 'ok'
  | 'skipped'
  | 'unsupported'
  | 'mismatch'
  | 'error';

/**
 * Which checker produced a result.
 *
 * `languagetool` — the configured endpoint: spelling, grammar and style.
 * `local`        — a bundled Hunspell dictionary, used for languages
 *                  LanguageTool has no rules for. **Spelling only** — a
 *                  word list cannot judge grammar, and a clean result from
 *                  it must not be read as "the grammar is fine".
 */
export type SpellingEngine = 'languagetool' | 'local';

/** One spelling / grammar / style finding inside a page's prose. */
export interface SpellingMatch {
  /** Full human-readable explanation from LanguageTool. */
  message: string;
  /** Terse variant, when LanguageTool supplies one. */
  shortMessage: string | null;
  /** Character offset of the finding within the checked text. */
  offset: number;
  /** Character length of the offending span. */
  length: number;
  /** The offending surface text itself. */
  text: string;
  /** Surrounding snippet, for display. */
  context: string;
  /** Offset of `text` inside `context` — used to highlight the span. */
  contextOffset: number;
  /** Suggested corrections, best-first (may be empty). */
  replacements: string[];
  /** LanguageTool rule id, e.g. `MORFOLOGIK_RULE_EN_US`. */
  ruleId: string;
  /** Human-readable rule category, e.g. `Possible Typo`. */
  category: string;
  /** LanguageTool issue type: `misspelling`, `grammar`, `style`, … */
  issueType: string;
}

/** Stored check result for one URL. */
export interface SpellingResult {
  /** LanguageTool code the check ran under, e.g. `en-GB`. Null when no
   *  request was made (`skipped` / `unsupported`). */
  language: string | null;
  /** Primary code the trigram detector read out of the prose, e.g. `tr`.
   *  Null when the page carried too little text to fingerprint. */
  detectedLanguage: string | null;
  /** Primary code the page declared via `html[lang]`, e.g. `en`. Null when
   *  the page declares nothing usable. Differs from `detectedLanguage`
   *  when the declaration is boilerplate-wrong — a real SEO finding. */
  declaredLanguage: string | null;
  /** Number of matches after the ignore-dictionary filter. */
  matchCount: number;
  matches: SpellingMatch[];
  status: SpellingStatus;
  /** Which checker produced this result. Null when none ran. */
  engine: SpellingEngine | null;
  /** Failure reason for `error`, or the explanation for `unsupported` /
   *  `mismatch` — always user-facing prose naming the languages involved. */
  error: string | null;
  fetchedAt: string;
}

/**
 * One row in the Spelling tab — a crawled internal HTML page with its
 * stored check summary. Result fields are `null` until the page is checked.
 */
export interface SpellingRow {
  url: string;
  /** `html[lang]` captured during the crawl. */
  lang: string | null;
  wordCount: number | null;
  /** Language LanguageTool used for the check. */
  language: string | null;
  /** Language detected from the page's own prose. */
  detectedLanguage: string | null;
  matchCount: number | null;
  status: SpellingStatus | null;
  engine: SpellingEngine | null;
  error: string | null;
  fetchedAt: string | null;
}

/**
 * One language a LanguageTool endpoint offers, as returned by
 * `/v2/languages`. `code` is the primary subtag (`en`), `longCode` the
 * concrete variant to send (`en-GB`).
 */
export interface SpellingLanguageOption {
  name: string;
  code: string;
  longCode: string;
}
