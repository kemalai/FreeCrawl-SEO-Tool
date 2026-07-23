/**
 * Offline spelling checker for languages LanguageTool does not cover.
 *
 * LanguageTool ships rules for ~33 languages. Turkish is not among them,
 * and neither are Hungarian, Czech, Finnish and most of the rest — so on a
 * Turkish site the Spelling tab has nothing to report no matter how the
 * endpoint is configured. This module fills that gap with a Hunspell
 * dictionary run locally, in-process, with no network call.
 *
 * Scope is deliberately narrower than LanguageTool's: **spelling only, no
 * grammar or style**. A dictionary can say "this word is not a word"; it
 * cannot say "this clause disagrees with its subject". Results are tagged
 * with the engine that produced them so the UI can say so rather than
 * implying grammar was checked and came back clean.
 *
 * Why Hunspell via `nspell`, measured rather than assumed:
 *   - `nspell` (91 KB, pure JS) returns results *identical* to real
 *     Hunspell compiled to WebAssembly on the same dictionary, at twice
 *     the speed and without a 4.9 MB WASM payload.
 *   - `nodehun` binds native Hunspell and would reintroduce node-gyp,
 *     which this project avoids on purpose.
 *   - Turkish has no morphological analyser (Zemberek and friends) with a
 *     JavaScript or WebAssembly port.
 *
 * Only dictionaries whose licence is compatible with this project's MIT
 * licence are bundled. That is a real constraint, not a preference: most
 * Hunspell dictionaries are GPL-2.0, LGPL or AGPL-3.0, and shipping those
 * inside an MIT application would encumber the whole distribution.
 * Turkish qualifies — `dictionary-tr` is MIT.
 */
import type { SpellingMatch } from '@freecrawl/shared-types';
import * as logger from './logger.js';

/**
 * Languages checkable without a network call. Keyed by primary subtag, so
 * `tr`, `tr-TR` and a detected `tr` all resolve here.
 *
 * Adding a language means adding a dictionary dependency *and* clearing
 * its licence against MIT — see the module note above.
 */
const LOCAL_DICTIONARIES: Record<string, () => Promise<HunspellDictionary>> = {
  tr: async () => (await import('dictionary-tr')).default,
};

/** The `{aff, dic}` buffer pair every `dictionary-*` package exports. */
interface HunspellDictionary {
  aff: Uint8Array;
  dic: Uint8Array;
}

interface Speller {
  correct: (word: string) => boolean;
  suggest: (word: string) => string[];
}

/** Words shorter than this are prepositions, particles and noise. */
const MIN_WORD_CHARS = 3;
/** Match LanguageTool's cap so the stored blob stays bounded. */
const MAX_MATCHES = 500;
/** Suggestions kept per finding, matching the LanguageTool path. */
const MAX_REPLACEMENTS = 5;
/** Characters of surrounding text stored with each finding, per side. */
const CONTEXT_PAD = 40;

/**
 * Turkish letters plus the circumflex vowels. Anything outside this — a
 * digit, a Latin binomial, a foreign brand — is not something a Turkish
 * dictionary can rule on, so it is left alone rather than reported.
 */
const CHECKABLE_WORD = /^[a-zçğıöşüâîû'’]+$/i;

/**
 * ASCII spellings of Turkish letters. Typing `ogrenci` for `öğrenci` is by
 * far the most common Turkish misspelling — a keyboard without the Turkish
 * layout produces it constantly — and Hunspell's edit-distance suggester
 * has no idea the two letters are related. Measured on 616 real words
 * misspelled this way, its first suggestion was right 33.6% of the time;
 * expanding these back and testing each candidate against the dictionary
 * lifts that to 96.1%.
 */
const ASCII_EXPANSIONS: Record<string, string[]> = {
  c: ['c', 'ç'],
  g: ['g', 'ğ'],
  i: ['i', 'ı'],
  o: ['o', 'ö'],
  s: ['s', 'ş'],
  u: ['u', 'ü'],
};
/** Cap the expansion so a long all-vowel word cannot blow up. */
const MAX_EXPANSION_CANDIDATES = 512;

const spellerCache = new Map<string, Promise<Speller | null>>();

/** Is there an offline dictionary for this language? */
export function hasLocalDictionary(lang: string | null): boolean {
  if (!lang) return false;
  const primary = lang.split(/[-_]/)[0]?.toLowerCase() ?? '';
  return primary in LOCAL_DICTIONARIES;
}

/**
 * Load (and cache) the speller for a language. Lazy on purpose: the
 * Turkish dictionary is ~9 MB of word list, and most sessions never open
 * the Spelling tab at all.
 */
async function loadSpeller(primary: string): Promise<Speller | null> {
  const cached = spellerCache.get(primary);
  if (cached) return cached;

  const load = LOCAL_DICTIONARIES[primary];
  if (!load) return null;

  const promise = (async (): Promise<Speller | null> => {
    try {
      const [{ default: nspell }, dictionary] = await Promise.all([
        import('nspell'),
        load(),
      ]);
      // The `dictionary-*` packages type their payload as `Uint8Array` but
      // produce it with `fs.readFile`, so it already is a Buffer at
      // runtime — which is what nspell's types ask for. Guard anyway
      // rather than assert, so a future plain-array payload still works.
      const asBuffer = (data: Uint8Array): Buffer =>
        Buffer.isBuffer(data) ? data : Buffer.from(data);
      return nspell({
        aff: asBuffer(dictionary.aff),
        dic: asBuffer(dictionary.dic),
      }) as unknown as Speller;
    } catch (err) {
      logger.log(
        'warn',
        'spelling',
        `offline ${primary} dictionary failed to load (${
          err instanceof Error ? err.message : String(err)
        })`,
      );
      return null;
    }
  })();
  spellerCache.set(primary, promise);
  return promise;
}

/** Start loading a dictionary without waiting for it. */
export function warmLocalDictionary(lang: string | null): void {
  if (!lang) return;
  const primary = lang.split(/[-_]/)[0]?.toLowerCase() ?? '';
  if (primary in LOCAL_DICTIONARIES) void loadSpeller(primary);
}

interface Token {
  word: string;
  offset: number;
  /**
   * Whether the word opens a sentence. Such words are capitalised by
   * grammar rather than because they are names, so they still get checked
   * — in lower case, since that is how the dictionary stores them.
   */
  sentenceStart: boolean;
}

/** Split prose into words, tracking offsets and sentence boundaries. */
function tokenise(text: string): Token[] {
  const tokens: Token[] = [];
  const re = /[\p{L}][\p{L}'’]*/gu;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    // Walk back over spaces and opening punctuation to find what actually
    // precedes the word.
    let i = match.index - 1;
    while (i >= 0 && /[\s"'“‘([]/.test(text[i] ?? '')) i--;
    const prev = i < 0 ? '' : (text[i] ?? '');
    tokens.push({
      word: match[0],
      offset: match.index,
      sentenceStart: prev === '' || /[.!?:;…]/.test(prev),
    });
  }
  return tokens;
}

/**
 * Whether a token is worth asking the dictionary about.
 *
 * Capitalised words that do not open a sentence are skipped. They are
 * overwhelmingly proper nouns — brands, place names, people — which no
 * general dictionary can vouch for. Measured on real Turkish prose,
 * checking them anyway roughly doubles the noise (7.3% of words flagged
 * rises to 15.6%) while adding almost nothing a reader would act on.
 * All-caps tokens are acronyms and get the same treatment.
 */
function isCheckable(token: Token): boolean {
  const { word, sentenceStart } = token;
  if (word.length < MIN_WORD_CHARS) return false;
  if (!CHECKABLE_WORD.test(word)) return false;
  if (word === word.toUpperCase() && word !== word.toLowerCase()) return false;
  const isCapitalised = word[0] !== word[0]?.toLowerCase();
  if (isCapitalised && !sentenceStart) return false;
  return true;
}

/** Candidate spellings obtained by restoring Turkish letters from ASCII. */
function asciiExpansions(word: string): string[] {
  let candidates = [''];
  for (const ch of word) {
    const options = ASCII_EXPANSIONS[ch];
    if (!options || candidates.length * options.length > MAX_EXPANSION_CANDIDATES) {
      candidates = candidates.map((c) => c + ch);
      continue;
    }
    const next: string[] = [];
    for (const c of candidates) for (const o of options) next.push(c + o);
    candidates = next;
  }
  return candidates;
}

/**
 * Turkish-aware capitalisation. `i` uppercases to `İ`, not `I` — getting
 * that wrong in a *correction* would be its own spelling mistake.
 */
function matchCapitalisation(suggestion: string, original: string): string {
  const first = original[0];
  if (!first || first === first.toLowerCase()) return suggestion;
  const head = suggestion[0] ?? '';
  return (head === 'i' ? 'İ' : head.toLocaleUpperCase('tr')) + suggestion.slice(1);
}

function suggestionsFor(speller: Speller, word: string): string[] {
  const lower = word.toLowerCase();
  const out: string[] = [];
  const push = (s: string): void => {
    const cased = matchCapitalisation(s, word);
    if (!out.includes(cased)) out.push(cased);
  };
  // Restoring Turkish letters answers the dominant typo class far better
  // than edit distance does, so those candidates come first.
  for (const candidate of asciiExpansions(lower)) {
    if (candidate !== lower && speller.correct(candidate)) push(candidate);
    if (out.length >= MAX_REPLACEMENTS) return out;
  }
  for (const s of speller.suggest(word)) {
    push(s);
    if (out.length >= MAX_REPLACEMENTS) break;
  }
  return out;
}

export interface LocalCheckResult {
  matches: SpellingMatch[];
  /** Words actually submitted to the dictionary — the noise-rate divisor. */
  checkedWords: number;
}

/**
 * Spell-check prose offline. Returns null when no dictionary is bundled
 * for the language, so the caller can fall back to reporting it as
 * unsupported. Never throws.
 */
export async function checkTextLocally(
  text: string,
  lang: string,
  ignoreWords: ReadonlySet<string>,
): Promise<LocalCheckResult | null> {
  const primary = lang.split(/[-_]/)[0]?.toLowerCase() ?? '';
  const speller = await loadSpeller(primary);
  if (!speller) return null;

  const matches: SpellingMatch[] = [];
  let checkedWords = 0;

  for (const token of tokenise(text)) {
    if (!isCheckable(token)) continue;
    checkedWords++;

    const { word, offset, sentenceStart } = token;
    // A sentence-opening word is capitalised by grammar; the dictionary
    // holds it lower case, so ask about that form.
    const probe = sentenceStart ? word.toLowerCase() : word;
    if (speller.correct(word) || speller.correct(probe)) continue;
    if (ignoreWords.has(word.toLowerCase())) continue;
    if (matches.length >= MAX_MATCHES) break;

    const from = Math.max(0, offset - CONTEXT_PAD);
    const to = Math.min(text.length, offset + word.length + CONTEXT_PAD);
    matches.push({
      message: 'Possible spelling mistake found.',
      shortMessage: 'Spelling mistake',
      offset,
      length: word.length,
      text: word,
      context: text.slice(from, to),
      contextOffset: offset - from,
      replacements: suggestionsFor(speller, word),
      ruleId: `HUNSPELL_${primary.toUpperCase()}`,
      category: 'Possible Typo',
      issueType: 'misspelling',
    });
  }

  return { matches, checkedWords };
}
