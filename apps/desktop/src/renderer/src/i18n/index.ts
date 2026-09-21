import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  UI_LANGUAGES,
  normalizeUiLanguage,
  pickUiLanguage,
  type UiLanguage,
} from '@freecrawl/shared-types';
import en from './locales/en.json';
import tr from './locales/tr.json';
import az from './locales/az.json';
import zhCN from './locales/zh-CN.json';
import fr from './locales/fr.json';
import hi from './locales/hi.json';
import it from './locales/it.json';
import ko from './locales/ko.json';
import ptBR from './locales/pt-BR.json';
import ru from './locales/ru.json';
import es from './locales/es.json';

/**
 * V1 Faz 8 — UI internationalisation.
 *
 * Startup locale, in priority order:
 *   1. the `uiLanguage` app pref — an explicit choice from Settings → Language
 *   2. the OS's language preferences, resolved onto a shipped locale
 *   3. English
 *
 * The *absence* of the pref is what means "the user has never chosen", so
 * there is no separate flag to keep in sync: `changeLanguage` is the only
 * writer, and once it has written, step 1 wins forever. That is what makes
 * an explicit pick of English stick on a Turkish machine.
 *
 * Every locale is imported eagerly rather than dynamically. i18next is
 * initialised synchronously (this module is imported for its side effect in
 * `main.tsx`, before `createRoot`), and the active locale is not knowable
 * at build time — a dynamic import would make init async and put a flash of
 * untranslated content on every cold start. The cost is the bundled string
 * tables, which is the right trade for an app that loads off local disk.
 *
 * The language list and the tag resolver live in `@freecrawl/shared-types`
 * so the main process (native menu / tray / dialogs) resolves the pref
 * exactly the same way this does.
 */
export { UI_LANGUAGES, UI_LANGUAGE_NAMES, UI_LANGUAGE_PICKER_ORDER } from '@freecrawl/shared-types';
export type { UiLanguage } from '@freecrawl/shared-types';

/** @deprecated Use `UI_LANGUAGES`. Kept so older imports keep resolving. */
export const SUPPORTED_LANGUAGES = UI_LANGUAGES;
/** @deprecated Use `UiLanguage`. */
export type SupportedLanguage = UiLanguage;

export function resolveInitialLanguage(): UiLanguage {
  try {
    return pickUiLanguage(
      window.freecrawl.prefsGet('uiLanguage'),
      window.freecrawl.systemLanguages(),
    );
  } catch {
    /* preload not ready yet — English is the safe floor */
    return 'en';
  }
}

/**
 * Mirror the active locale onto `<html lang>`.
 *
 * Not cosmetic: CSS keys the per-script font stacks off `html[lang]` (Inter
 * has no CJK or Devanagari coverage), `text-transform: uppercase` is only
 * locale-correct with a language declared — Turkish and Azerbaijani need it
 * for `i` → `İ` — and CJK line breaking, `<input>` spellcheck and
 * screen-reader pronunciation all read it.
 */
function applyDocumentLanguage(lng: string): void {
  const code = normalizeUiLanguage(lng) ?? 'en';
  if (typeof document !== 'undefined') {
    document.documentElement.lang = code;
  }
}

const initialLanguage = resolveInitialLanguage();

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
    az: { translation: az },
    'zh-CN': { translation: zhCN },
    fr: { translation: fr },
    hi: { translation: hi },
    it: { translation: it },
    ko: { translation: ko },
    'pt-BR': { translation: ptBR },
    ru: { translation: ru },
    es: { translation: es },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  // Region-coded locales are the real translation targets here (`pt-BR`,
  // `zh-CN`), so don't let i18next strip the region and look for a
  // non-existent `pt` / `zh` bundle.
  load: 'currentOnly',
  nonExplicitSupportedLngs: false,
  supportedLngs: [...UI_LANGUAGES],
  interpolation: { escapeValue: false },
  returnNull: false,
});

applyDocumentLanguage(initialLanguage);

export function changeLanguage(lng: UiLanguage): void {
  void i18n.changeLanguage(lng);
  applyDocumentLanguage(lng);
  try {
    window.freecrawl.prefsSet('uiLanguage', lng);
  } catch {
    /* ignore */
  }
}

export default i18n;
