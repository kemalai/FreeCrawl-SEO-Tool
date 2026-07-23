/**
 * Page-language resolution for the spelling checker.
 *
 * LanguageTool's `auto` mode cannot be trusted for this job: it only knows
 * the ~33 languages it ships rules for, so it answers with the *closest*
 * supported language no matter what it is handed, at a confidence that is
 * always ~0.99. Turkish prose comes back as "English (US), 0.99" with a
 * misspelling reported on every single word; a longer sample comes back as
 * "Crimean Tatar". Neither is recoverable downstream — the findings look
 * like real data.
 *
 * So the language is decided here, before anything leaves the machine:
 *
 *  1. Fingerprint the prose with two independent detectors (see
 *     `detectLanguageRanking`).
 *  2. Reconcile that against the page's declared `html[lang]`. The
 *     declaration wins when the two agree or are near-neighbours (pt vs
 *     gl, nl vs af, en-GB vs en-US) so the regional variant is preserved;
 *     the detector wins when they flatly disagree, because a stale
 *     `lang="en-US"` left in a CMS theme on an otherwise Turkish site is
 *     far more common than a page written in a language it doesn't claim.
 *  3. Validate the result against what the endpoint actually offers, and
 *     refuse to check rather than substituting a wrong language.
 */
import { francAll } from 'franc';
import type { SpellingLanguageOption } from '@freecrawl/shared-types';
import * as logger from './logger.js';

/**
 * Below this many characters of prose detection is guessing. Benchmarked
 * over 161 native Wikipedia samples across 41 languages, scored on the
 * decision this module actually makes (right LanguageTool language, or a
 * correct refusal): ELD reads 83.9% at 50 characters, where franc alone
 * managed 70.8% even at 60. Pages under the bar fall back to `html[lang]`.
 *
 * Prose shorter than 40 characters never reaches here — `MIN_PROSE_CHARS`
 * in the checker skips those pages outright — so the band this actually
 * governs is 40–60 characters of body copy.
 */
const MIN_DETECT_CHARS = 50;

/**
 * How close a runner-up must score to the winner before a *declared*
 * language is allowed to override it. franc normalises the top hit to
 * 1.00, so this is a relative distance. Portuguese prose scores
 * `glg:1.00 por:0.95`; a page declaring `pt` should stay Portuguese.
 */
const CLOSE_CALL = 0.9;

/** How deep into franc's ranking a declared language may be rescued. */
const CLOSE_CALL_DEPTH = 6;

/**
 * ISO 639-3 (what franc returns) → ISO 639-1 (what LanguageTool speaks).
 * Covers every language LanguageTool supports plus the widely-used ones it
 * does not, so `unsupported` results can name the language they found
 * instead of reporting a bare code.
 */
const ISO3_TO_ISO1: Record<string, string> = {
  // — LanguageTool-supported —
  arb: 'ar',
  ara: 'ar',
  ast: 'ast',
  bel: 'be',
  bre: 'br',
  cat: 'ca',
  crh: 'crh',
  dan: 'da',
  deu: 'de',
  ell: 'el',
  eng: 'en',
  epo: 'eo',
  spa: 'es',
  pes: 'fa',
  fas: 'fa',
  fra: 'fr',
  gle: 'ga',
  glg: 'gl',
  ita: 'it',
  jpn: 'ja',
  khm: 'km',
  nob: 'nb',
  nno: 'nn',
  nor: 'no',
  nld: 'nl',
  pol: 'pl',
  por: 'pt',
  ron: 'ro',
  rus: 'ru',
  slk: 'sk',
  slv: 'sl',
  swe: 'sv',
  tam: 'ta',
  tgl: 'tl',
  ukr: 'uk',
  cmn: 'zh',
  zho: 'zh',
  yue: 'zh',
  // — common, and *not* supported by LanguageTool —
  tur: 'tr',
  azj: 'az',
  aze: 'az',
  tuk: 'tk',
  uzn: 'uz',
  kaz: 'kk',
  kir: 'ky',
  hun: 'hu',
  ces: 'cs',
  fin: 'fi',
  est: 'et',
  lvs: 'lv',
  lav: 'lv',
  lit: 'lt',
  heb: 'he',
  hin: 'hi',
  urd: 'ur',
  ben: 'bn',
  pan: 'pa',
  mar: 'mr',
  tel: 'te',
  guj: 'gu',
  kan: 'kn',
  mal: 'ml',
  tam_: 'ta',
  ind: 'id',
  zsm: 'ms',
  zlm: 'ms',
  vie: 'vi',
  tha: 'th',
  kor: 'ko',
  bul: 'bg',
  srp: 'sr',
  hrv: 'hr',
  bos: 'bs',
  mkd: 'mk',
  sqi: 'sq',
  als: 'sq',
  isl: 'is',
  kat: 'ka',
  hye: 'hy',
  afr: 'af',
  swh: 'sw',
  amh: 'am',
  npi: 'ne',
  sin: 'si',
  mya: 'my',
  lao: 'lo',
  ckb: 'ku',
  kmr: 'ku',
  pbu: 'ps',
  hat: 'ht',
  ltz: 'lb',
  cym: 'cy',
  eus: 'eu',
  mlt: 'mt',
  yid: 'yi',
};

/** Display names for the codes above — used in user-facing messages. */
const LANG_NAMES: Record<string, string> = {
  af: 'Afrikaans',
  am: 'Amharic',
  ar: 'Arabic',
  ast: 'Asturian',
  az: 'Azerbaijani',
  be: 'Belarusian',
  bg: 'Bulgarian',
  bn: 'Bengali',
  br: 'Breton',
  bs: 'Bosnian',
  ca: 'Catalan',
  crh: 'Crimean Tatar',
  cs: 'Czech',
  cy: 'Welsh',
  da: 'Danish',
  de: 'German',
  el: 'Greek',
  en: 'English',
  eo: 'Esperanto',
  es: 'Spanish',
  et: 'Estonian',
  eu: 'Basque',
  fa: 'Persian',
  fi: 'Finnish',
  fr: 'French',
  ga: 'Irish',
  gl: 'Galician',
  gu: 'Gujarati',
  he: 'Hebrew',
  hi: 'Hindi',
  hr: 'Croatian',
  ht: 'Haitian Creole',
  hu: 'Hungarian',
  hy: 'Armenian',
  id: 'Indonesian',
  is: 'Icelandic',
  it: 'Italian',
  ja: 'Japanese',
  ka: 'Georgian',
  kk: 'Kazakh',
  km: 'Khmer',
  kn: 'Kannada',
  ko: 'Korean',
  ku: 'Kurdish',
  ky: 'Kyrgyz',
  lb: 'Luxembourgish',
  lo: 'Lao',
  lt: 'Lithuanian',
  lv: 'Latvian',
  mk: 'Macedonian',
  ml: 'Malayalam',
  mr: 'Marathi',
  ms: 'Malay',
  mt: 'Maltese',
  my: 'Burmese',
  nb: 'Norwegian Bokmål',
  ne: 'Nepali',
  nl: 'Dutch',
  nn: 'Norwegian Nynorsk',
  no: 'Norwegian',
  pa: 'Punjabi',
  pl: 'Polish',
  ps: 'Pashto',
  pt: 'Portuguese',
  ro: 'Romanian',
  ru: 'Russian',
  si: 'Sinhala',
  sk: 'Slovak',
  sl: 'Slovenian',
  sq: 'Albanian',
  sr: 'Serbian',
  sv: 'Swedish',
  sw: 'Swahili',
  ta: 'Tamil',
  te: 'Telugu',
  th: 'Thai',
  tk: 'Turkmen',
  tl: 'Tagalog',
  tr: 'Turkish',
  uk: 'Ukrainian',
  ur: 'Urdu',
  uz: 'Uzbek',
  vi: 'Vietnamese',
  yi: 'Yiddish',
  zh: 'Chinese',
};

/** Human name for a language code, falling back to the code itself. */
export function languageName(code: string | null): string {
  if (!code) return 'unknown';
  const primary = code.split('-')[0]?.toLowerCase() ?? '';
  return LANG_NAMES[primary] ?? code;
}

/**
 * Which concrete variant to prefer when a page only says `en` / `de` /
 * `pt`. LanguageTool's bare codes exist but carry the weaker generic
 * dictionary, so a real variant produces better findings.
 */
const PREFERRED_VARIANT: Record<string, string> = {
  en: 'en-US',
  de: 'de-DE',
  pt: 'pt-PT',
  ca: 'ca-ES',
  zh: 'zh-CN',
  nl: 'nl-NL',
  fr: 'fr-FR',
  es: 'es-ES',
  no: 'nb-NO',
};

/** Normalise a raw `html[lang]` to its primary subtag, or null if unusable. */
export function declaredPrimary(pageLang: string | null): string | null {
  const raw = (pageLang ?? '').trim().toLowerCase();
  if (!raw) return null;
  const primary = raw.split(/[-_]/)[0] ?? '';
  // `x-default` (an hreflang value that leaks into lang attributes),
  // `und`, and single letters carry no information.
  if (primary.length < 2 || primary === 'x' || primary === 'und') return null;
  if (!/^[a-z]{2,3}$/.test(primary)) return null;
  return primary;
}

/** Full declared tag normalised to LanguageTool's casing, e.g. `en-GB`. */
function declaredLongCode(pageLang: string | null): string | null {
  const raw = (pageLang ?? '').trim();
  if (!raw) return null;
  const parts = raw.split(/[-_]/);
  const primary = parts[0]?.toLowerCase() ?? '';
  const region = parts[1];
  if (!primary || !region) return null;
  return `${primary}-${region.toUpperCase()}`;
}

export interface DetectionRank {
  /** ISO 639-1 (or 639-3 where no 639-1 exists) primary code. */
  code: string;
  /** Relative confidence — the winner is always 1. */
  score: number;
}

export interface DetectionResult {
  /** Candidate languages, best first. Empty when the sample is too short. */
  ranks: DetectionRank[];
  /**
   * Whether the detectors actually recognised the text, as opposed to
   * returning the nearest thing they know. False means the reading is too
   * weak to overrule an explicit `html[lang]`.
   */
  confident: boolean;
}

/**
 * ELD's `eld/large` database, loaded on first use.
 *
 * Deliberately lazy: it is ~4.5 MB of n-gram tables and a spelling run is
 * on-demand, so paying for it at app start would slow every launch for a
 * feature most sessions never touch.
 *
 * ELD exports a module singleton and each size entry loads into the same
 * object, so importing more than one silently leaves whichever landed last
 * — `eld/large` is imported here and nowhere else.
 */
type EldDetector = {
  detect: (text: string) => {
    language: string;
    getScores: () => Record<string, number>;
    isReliable: () => boolean;
  };
};
let eldPromise: Promise<EldDetector | null> | null = null;

function loadEld(): Promise<EldDetector | null> {
  eldPromise ??= import('eld/large')
    .then((m) => m.eld as EldDetector)
    .catch((err: unknown) => {
      logger.log(
        'warn',
        'languagetool',
        `ELD language model failed to load (${
          err instanceof Error ? err.message : String(err)
        }) — falling back to franc alone`,
      );
      return null;
    });
  return eldPromise;
}

/**
 * Start loading the detector without waiting for it. Called when a run is
 * being set up so the model arrives while the endpoint's language list is
 * still in flight, rather than stalling the first page of the batch.
 */
export function warmLanguageDetector(): void {
  void loadEld();
}

/** Rescale a score map so the best entry is 1, matching franc's convention. */
function normaliseScores(scores: Record<string, number>): Map<string, number> {
  const out = new Map<string, number>();
  let top = 0;
  for (const v of Object.values(scores)) if (v > top) top = v;
  if (top <= 0) return out;
  for (const [code, v] of Object.entries(scores)) {
    const primary = code.split(/[-_]/)[0]?.toLowerCase();
    if (primary) out.set(primary, v / top);
  }
  return out;
}

/**
 * Fingerprint prose with both detectors and merge them into one ranking.
 * Returns an empty ranking when the sample is too short to be meaningful
 * rather than guessing.
 *
 * Two engines because each covers the other's blind spot, measured over
 * 161 native Wikipedia samples in 41 languages:
 *
 *  - **ELD leads.** On the decision that matters here it scored 97.5% /
 *    96.3% / 91.3% at ~1000 / 150 / 70 characters, against franc's 96.9% /
 *    91.3% / 72.7%, and runs ~7× faster. Short page copy is where franc
 *    fell apart, and short page copy is common.
 *  - **franc stays for coverage.** ELD knows 60 languages and cannot name
 *    seven that LanguageTool supports — Galician, Irish, Esperanto, Khmer,
 *    Asturian, Breton, Crimean Tatar. Handed Galician it answers
 *    Portuguese or Spanish, which is precisely the wrong-language check
 *    this module exists to prevent. franc knows all seven.
 *
 * So ELD's answer takes the top slot, while franc's ranking is preserved
 * behind it. That placement is what makes the rescue work: a genuinely
 * Galician page declaring `lang="gl"` has `gl` sitting in the ranking at
 * franc's full score, and `resolveCheckLanguage`'s close-call reconciliation
 * promotes it. A Portuguese page declaring `lang="pt"` keeps Portuguese,
 * because ELD won the top slot and the declaration agrees with it.
 *
 * Note that a bigger model is *not* the same as a better one: `franc-all`,
 * with 414 languages instead of 187, scored worse at every length (90.7% /
 * 77.0% / 51.6% raw accuracy) because the extra candidates let it prefer
 * Gagauz over Turkish and Ladino over Spanish.
 */
export async function detectLanguageRanking(
  text: string,
): Promise<DetectionResult> {
  const sample = text.trim();
  if (sample.length < MIN_DETECT_CHARS) {
    return { ranks: [], confident: false };
  }

  const francScores = new Map<string, number>();
  for (const [iso3, score] of francAll(sample, {
    minLength: MIN_DETECT_CHARS,
  })) {
    if (iso3 === 'und') continue;
    const code = ISO3_TO_ISO1[iso3];
    if (!code || francScores.has(code)) continue;
    francScores.set(code, score);
  }

  const eld = await loadEld();
  let eldTop: string | null = null;
  let eldScores = new Map<string, number>();
  // With no ELD at all (load failure) franc is the only opinion available,
  // so its answer is taken at face value as it was before ELD existed.
  let confident = true;
  if (eld) {
    try {
      const res = eld.detect(sample);
      const primary = res.language.split(/[-_]/)[0]?.toLowerCase();
      eldScores = normaliseScores(res.getScores());
      confident = res.isReliable();
      // An unreliable verdict is a guess, and a guess must not outrank the
      // broader model. Measured: where ELD reports unreliable its accuracy
      // collapses from ~91% to 25%, and it reports unreliable exactly on
      // the languages it has no model for — Irish prose comes back
      // "Romanian, top score 0.45, second 0.42".
      if (primary && confident) eldTop = primary;
    } catch {
      // A detector failure must not cost the page its check — franc alone
      // still produces a usable ranking.
    }
  }

  // A language either engine rates highly stays a candidate; the merged
  // score is the better of the two so a close-call rescue can fire on
  // either engine's evidence.
  const merged = new Map<string, number>(francScores);
  for (const [code, score] of eldScores) {
    merged.set(code, Math.max(merged.get(code) ?? 0, score));
  }
  if (eldTop) merged.set(eldTop, 1);

  const ranks = [...merged]
    .map(([code, score]) => ({ code, score }))
    .sort((a, b) => {
      if (eldTop) {
        if (a.code === eldTop) return -1;
        if (b.code === eldTop) return 1;
      }
      return b.score - a.score;
    })
    .slice(0, 12);
  return { ranks, confident };
}

/** Index the endpoint's `/v2/languages` payload for lookup. */
export interface SupportedLanguages {
  /** Every concrete code the endpoint accepts, e.g. `en-GB`, `pl-PL`. */
  longCodes: Set<string>;
  /** Primary subtags with at least one usable variant, e.g. `en`, `pl`. */
  primaries: Set<string>;
  /** Best concrete code per primary subtag. */
  bestByPrimary: Map<string, string>;
  options: SpellingLanguageOption[];
}

export function indexSupportedLanguages(
  options: SpellingLanguageOption[],
): SupportedLanguages {
  const longCodes = new Set<string>();
  const primaries = new Set<string>();
  const byPrimary = new Map<string, string[]>();

  for (const opt of options) {
    const longCode = (opt.longCode || opt.code || '').trim();
    if (!longCode) continue;
    longCodes.add(longCode);
    const primary = (longCode.split('-')[0] ?? '').toLowerCase();
    if (!primary) continue;
    primaries.add(primary);
    const list = byPrimary.get(primary);
    if (list) list.push(longCode);
    else byPrimary.set(primary, [longCode]);
  }

  const bestByPrimary = new Map<string, string>();
  for (const [primary, codes] of byPrimary) {
    const preferred = PREFERRED_VARIANT[primary];
    if (preferred && codes.includes(preferred)) {
      bestByPrimary.set(primary, preferred);
      continue;
    }
    // A concrete regional variant beats the bare code; `x-simple-language`
    // and similar pseudo-variants are never a sensible default.
    const regional = codes.find(
      (c) => c.includes('-') && !c.includes('-x-') && c.length <= 6,
    );
    bestByPrimary.set(primary, regional ?? codes[0] ?? primary);
  }

  return { longCodes, primaries, bestByPrimary, options };
}

export interface LanguageDecision {
  /** LanguageTool code to send. Null means: do not make the request. */
  language: string | null;
  /** Primary code read out of the prose (null when undetectable). */
  detected: string | null;
  /** Primary code declared by `html[lang]` (null when absent/unusable). */
  declared: string | null;
  /** Populated only when `language` is null. */
  reason: 'unsupported' | 'undetermined' | null;
  /** User-facing explanation for `reason`. */
  message: string | null;
  /** True when the declaration and the prose disagree outright. */
  mismatch: boolean;
  /**
   * True when two independent signals — the page's own `html[lang]` and the
   * trigram detector — named the same language. Callers use this to decide
   * whether a noisy result means "wrong language" or "badly written page":
   * with both signals agreeing, a high error rate is the finding, not a
   * reason to doubt the language.
   */
  agreed: boolean;
}

/**
 * Decide which language to check a page in.
 *
 * `override` short-circuits everything — when the user pins a language in
 * Settings they have told us the answer, including for sites the detector
 * would read differently page by page.
 */
export async function resolveCheckLanguage(params: {
  text: string;
  pageLang: string | null;
  supported: SupportedLanguages;
  override?: string | undefined;
}): Promise<LanguageDecision> {
  const { text, pageLang, supported, override } = params;

  const declared = declaredPrimary(pageLang);
  const { ranks: ranking, confident } = await detectLanguageRanking(text);
  const detected = ranking[0]?.code ?? null;

  if (override && override.trim().length > 0) {
    const forced = override.trim();
    if (supported.longCodes.has(forced)) {
      return {
        language: forced,
        detected,
        declared,
        reason: null,
        message: null,
        mismatch: false,
        agreed: !!detected && detected === declared,
      };
    }
    const best = supported.bestByPrimary.get(forced.split('-')[0] ?? '');
    if (best) {
      return {
        language: best,
        detected,
        declared,
        reason: null,
        message: null,
        mismatch: false,
        agreed: !!detected && detected === declared,
      };
    }
    // A pinned language the endpoint dropped — fall through to detection
    // rather than silently checking in the wrong one.
  }

  // Reconcile declaration against prose. `agreed` records the strongest
  // case — both signals present and naming the same language — which lets
  // the caller trust a noisy result instead of second-guessing it.
  const agreed = !!detected && detected === declared;
  let chosen: string | null;
  let mismatch = false;
  if (!detected) {
    chosen = declared;
  } else if (!declared) {
    chosen = detected;
  } else if (declared === detected) {
    chosen = declared;
  } else {
    // Near-neighbour languages (pt/gl, nl/af, da/nb) are the detector's
    // known weak spot — let a declaration that is still ranked highly win.
    const near = ranking
      .slice(0, CLOSE_CALL_DEPTH)
      .find((r) => r.code === declared);
    if (near && near.score >= CLOSE_CALL) {
      chosen = declared;
    } else if (!confident) {
      // The detectors did not recognise this text; they returned the
      // nearest thing they know. That is not evidence against an explicit
      // declaration, so the declaration stands. Irish prose is the worked
      // example: ELD has no model for it and answers "Romanian" at a flat
      // 0.45, while franc does not rank Irish at all — overruling
      // `lang="ga"` there would grade Irish against Romanian rules.
      chosen = declared;
    } else {
      chosen = detected;
      mismatch = true;
    }
  }

  if (!chosen) {
    return {
      language: null,
      detected,
      declared,
      reason: 'undetermined',
      message:
        'Page language could not be determined — it declares no html[lang] and carries too little prose to detect.',
      mismatch: false,
      agreed: false,
    };
  }

  if (!supported.primaries.has(chosen)) {
    return {
      language: null,
      detected,
      declared,
      reason: 'unsupported',
      message: `${languageName(chosen)} is not supported by this LanguageTool endpoint.`,
      mismatch,
      agreed,
    };
  }

  // Preserve the page's own regional variant when it is one the endpoint
  // offers — `en-GB` prose should not be graded against `en-US` rules.
  const longCode = declaredLongCode(pageLang);
  if (
    chosen === declared &&
    longCode &&
    supported.longCodes.has(longCode)
  ) {
    return {
      language: longCode,
      detected,
      declared,
      reason: null,
      message: null,
      mismatch: false,
      agreed,
    };
  }

  return {
    language: supported.bestByPrimary.get(chosen) ?? chosen,
    detected,
    declared,
    reason: null,
    message: null,
    mismatch,
    agreed,
  };
}
