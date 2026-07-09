/**
 * Spelling & Grammar integration types (LanguageTool).
 *
 * FreeCrawl sends each selected page's prose to a LanguageTool `/v2/check`
 * endpoint — either the free public API, a self-hosted server, or a
 * Premium account — and stores the returned matches per URL.
 *
 * Language is taken from the page's `html[lang]` when present, falling
 * back to LanguageTool's own auto-detection. Results are fetched
 * on-demand against a user-selected subset (checking a whole crawl would
 * blow through the public API's rate limit), so this mirrors the
 * PageSpeed / CrUX batch model.
 */

/** LanguageTool rule strictness. `picky` enables style/typography rules. */
export type SpellingLevel = 'default' | 'picky';

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
  /** Language code LanguageTool actually used (may be auto-detected). */
  language: string | null;
  /** Number of matches after the ignore-dictionary filter. */
  matchCount: number;
  matches: SpellingMatch[];
  /**
   * `ok` — checked; `skipped` — page had too little prose to check;
   * `error` — the request failed.
   */
  status: 'ok' | 'skipped' | 'error';
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
  matchCount: number | null;
  status: 'ok' | 'skipped' | 'error' | null;
  error: string | null;
  fetchedAt: string | null;
}
