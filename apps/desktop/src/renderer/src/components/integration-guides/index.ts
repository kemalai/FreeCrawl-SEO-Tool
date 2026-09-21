/**
 * Integration setup guides, one set per UI language.
 *
 * Content is embedded in the binary rather than fetched from a docs site
 * so the walkthrough can't drift from the app that ships it. English is
 * the source; the other ten sets mirror its guide ids, step count, links
 * and `lastReviewed` (the parity test in `tests/` enforces that). When
 * Google or a provider renames a UI label, update the step text in every
 * file — the labels are quoted verbatim in each language on purpose,
 * because that is what the user has to click.
 */
import { normalizeUiLanguage, type UiLanguage } from '@freecrawl/shared-types';
import type { Guide } from './types.js';
import { GUIDES_EN } from './en.js';
import { GUIDES_TR } from './tr.js';
import { GUIDES_ES } from './es.js';
import { GUIDES_FR } from './fr.js';
import { GUIDES_PT_BR } from './pt-BR.js';
import { GUIDES_IT } from './it.js';
import { GUIDES_RU } from './ru.js';
import { GUIDES_ZH_CN } from './zh-CN.js';
import { GUIDES_KO } from './ko.js';
import { GUIDES_HI } from './hi.js';
import { GUIDES_AZ } from './az.js';

export type { Guide, GuideStep, GuideTroubleshoot } from './types.js';

/** Every language's guide set. `Record` (not `Partial`) so a language
 *  added to `UI_LANGUAGES` without a guide file is a compile error. */
export const GUIDES: Record<UiLanguage, Record<string, Guide>> = {
  en: GUIDES_EN,
  tr: GUIDES_TR,
  es: GUIDES_ES,
  fr: GUIDES_FR,
  'pt-BR': GUIDES_PT_BR,
  it: GUIDES_IT,
  ru: GUIDES_RU,
  'zh-CN': GUIDES_ZH_CN,
  ko: GUIDES_KO,
  hi: GUIDES_HI,
  az: GUIDES_AZ,
};

/** Guide set for a UI language tag; unknown tags fall back to English. */
export function resolveGuides(lang: string): Record<string, Guide> {
  const code = normalizeUiLanguage(lang);
  return (code && GUIDES[code]) || GUIDES_EN;
}
