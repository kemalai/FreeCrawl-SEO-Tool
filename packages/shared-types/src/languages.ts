/**
 * UI language registry — the single source of truth for which locales the
 * interface ships in, and how an arbitrary BCP-47 tag resolves onto one.
 *
 * Why this lives in `shared-types` rather than next to the i18next
 * resources: both processes need the list and the resolver, and they are
 * separate bundles. The renderer reads it to pick the initial i18next
 * language and to render the Settings → Language picker; the main process
 * reads it to pick the native menu / tray / dialog label set. Before this
 * module the two validated the `uiLanguage` pref against their own
 * hardcoded lists (`isMenuLang` in main, `SUPPORTED_LANGUAGES.includes` in
 * the renderer), which could — and did — drift apart.
 *
 * Only the *list* and the *resolver* are shared. Translated label bodies
 * stay per-bundle (see `apps/desktop/src/main/menu-i18n.ts` for why the
 * main process keeps its own copy of the menu strings).
 *
 * Adding a language means touching four places:
 *   1. `UI_LANGUAGES` + `UI_LANGUAGE_NAMES` here
 *   2. `apps/desktop/src/renderer/src/i18n/locales/<code>.json`
 *   3. `apps/desktop/src/renderer/src/i18n/labels/<code>.ts`
 *   4. `apps/desktop/src/main/menu-locales/<code>.ts`
 * Steps 2–4 are compile-time-enforced by `Record<UiLanguage, …>` lookups,
 * so a forgotten locale fails `npm run typecheck` rather than shipping.
 */

/**
 * Locales the UI ships in. `en` is the fallback and the language the
 * source literals are authored in.
 *
 * Region subtags appear only where the variant is the actual translation
 * target rather than a neutral base: `pt-BR` (Brazilian Portuguese) and
 * `zh-CN` (Simplified Chinese).
 */
export const UI_LANGUAGES = [
  'en',
  'tr',
  'az',
  'zh-CN',
  'fr',
  'hi',
  'it',
  'ko',
  'pt-BR',
  'ru',
  'es',
] as const;

export type UiLanguage = (typeof UI_LANGUAGES)[number];

/** The fallback locale, used whenever nothing else resolves. */
export const DEFAULT_UI_LANGUAGE: UiLanguage = 'en';

/**
 * Display names for the language picker. Both halves are shown
 * (`简体中文 · Chinese (Simplified)`) so a user who lands in a script they
 * cannot read can still find their way back — the English half stays
 * legible when the UI is Hindi, and the native half stays legible when
 * the UI is English.
 */
export const UI_LANGUAGE_NAMES: Record<UiLanguage, { native: string; english: string }> = {
  en: { native: 'English', english: 'English' },
  tr: { native: 'Türkçe', english: 'Turkish' },
  az: { native: 'Azərbaycan dili', english: 'Azerbaijani' },
  'zh-CN': { native: '简体中文', english: 'Chinese (Simplified)' },
  fr: { native: 'Français', english: 'French' },
  hi: { native: 'हिन्दी', english: 'Hindi' },
  it: { native: 'Italiano', english: 'Italian' },
  ko: { native: '한국어', english: 'Korean' },
  'pt-BR': { native: 'Português (Brasil)', english: 'Portuguese (Brazil)' },
  ru: { native: 'Русский', english: 'Russian' },
  es: { native: 'Español', english: 'Spanish' },
};

/**
 * Order the picker renders in: the two original locales first (they are
 * what existing users look for), then the rest alphabetically by English
 * name — a stable order that does not shuffle as the UI language changes.
 */
export const UI_LANGUAGE_PICKER_ORDER: readonly UiLanguage[] = [
  'en',
  'tr',
  'az',
  'zh-CN',
  'fr',
  'hi',
  'it',
  'ko',
  'pt-BR',
  'ru',
  'es',
];

/**
 * Primary-subtag → locale map for tags that carry no exact match.
 *
 * Two entries are deliberate compromises rather than identities:
 *   - every `pt-*` (including `pt-PT`) lands on `pt-BR`, the only
 *     Portuguese translation we ship;
 *   - every `zh-*` (including Traditional: `zh-TW` / `zh-HK` / `zh-Hant`)
 *     lands on `zh-CN`, the only Chinese translation we ship. Simplified
 *     text is a poor fit for a Traditional reader, but it is a better
 *     starting point than English. Adding `zh-TW` later removes this.
 */
const PRIMARY_SUBTAG_TO_LOCALE: Record<string, UiLanguage> = {
  en: 'en',
  tr: 'tr',
  az: 'az',
  zh: 'zh-CN',
  fr: 'fr',
  hi: 'hi',
  it: 'it',
  ko: 'ko',
  pt: 'pt-BR',
  ru: 'ru',
  es: 'es',
};

/** Exact-tag lookup, lowercased, so `ZH-cn` and `zh-CN` both hit. */
const EXACT_TAG_TO_LOCALE: Record<string, UiLanguage> = Object.fromEntries(
  UI_LANGUAGES.map((code) => [code.toLowerCase(), code]),
) as Record<string, UiLanguage>;

/** Narrow an unknown (e.g. a value read back out of the prefs file). */
export function isUiLanguage(value: unknown): value is UiLanguage {
  return typeof value === 'string' && (UI_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Resolve one BCP-47 tag onto a shipped locale, or `undefined` when the
 * language is not one we have.
 *
 * Matches the full tag first (so `pt-BR` and `zh-CN` win over their own
 * primary-subtag fallbacks) and then the primary subtag, which drops any
 * script and region: `az-Latn-AZ` → `az`, `es-419` → `es`, `en-GB` → `en`.
 */
export function normalizeUiLanguage(tag: string): UiLanguage | undefined {
  if (!tag) return undefined;
  const lower = tag.toLowerCase().replace(/_/g, '-');
  const exact = EXACT_TAG_TO_LOCALE[lower];
  if (exact) return exact;
  const primary = lower.split('-')[0];
  if (!primary) return undefined;
  return PRIMARY_SUBTAG_TO_LOCALE[primary];
}

/**
 * Resolve an ordered preference list (as `app.getPreferredSystemLanguages()`
 * returns it) onto a shipped locale, falling back to English.
 *
 * The list is walked in order so a user whose OS preferences read
 * `['pl-PL', 'ru-RU']` gets Russian rather than English — the first
 * *supported* preference wins, not just the first preference.
 */
export function resolveUiLanguage(preferred: readonly string[] | undefined): UiLanguage {
  for (const tag of preferred ?? []) {
    if (typeof tag !== 'string') continue;
    const match = normalizeUiLanguage(tag);
    if (match) return match;
  }
  return DEFAULT_UI_LANGUAGE;
}

/**
 * Pick the UI language for a fresh render: an explicit saved choice wins
 * over the system language, and the system language wins over English.
 *
 * The absence of a saved value is what means "the user has never chosen" —
 * the `uiLanguage` pref is written only by the Settings picker, so there is
 * no separate "explicit choice" flag to keep in sync. Both processes call
 * this so the native menu and the renderer can never disagree on startup.
 */
export function pickUiLanguage(
  savedPref: unknown,
  systemLanguages: readonly string[] | undefined,
): UiLanguage {
  if (isUiLanguage(savedPref)) return savedPref;
  return resolveUiLanguage(systemLanguages);
}
