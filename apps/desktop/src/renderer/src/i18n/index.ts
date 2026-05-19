import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import tr from './locales/tr.json';

/**
 * V1 Faz 8 — UI internationalisation.
 *
 * Persisted under the `uiLanguage` app pref. The renderer hydrates the
 * choice synchronously from the preload bridge, so there's no flash of
 * untranslated content on cold start. Falls back to `en` when no pref
 * is set OR when the saved code isn't one of the supported locales.
 */
export const SUPPORTED_LANGUAGES = ['en', 'tr'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function resolveInitialLanguage(): SupportedLanguage {
  try {
    const raw = window.freecrawl.prefsGet('uiLanguage');
    if (typeof raw === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(raw)) {
      return raw as SupportedLanguage;
    }
  } catch {
    /* ignore — preload not ready yet, default to en */
  }
  return 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
  },
  lng: resolveInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function changeLanguage(lng: SupportedLanguage): void {
  void i18n.changeLanguage(lng);
  try {
    window.freecrawl.prefsSet('uiLanguage', lng);
  } catch {
    /* ignore */
  }
}

export default i18n;
