/**
 * V1 Faz 8 Phase 2 — flat lookup table for the OverviewSidebar's ~200
 * labels, plus column headers and a few dialog field names.
 *
 * Why not put these in the main `en.json` / `tr.json` resources? The
 * sidebar tree builder produces label strings in plain English and we
 * want a one-call lookup at render time without restructuring the
 * tree-building code. A flat dictionary keyed by the English label
 * keeps the source unchanged (the existing `label: 'Summary'`
 * declarations don't have to be replaced with key strings) and lets
 * us drop in translations side-by-side with the canonical English
 * text. Columns and a few dialog labels use the same pattern.
 *
 * One file per locale under `./labels/`; English is deliberately absent
 * because the key *is* the English text. Coverage is intentionally
 * `Partial` — anything a locale hasn't translated renders in English
 * rather than throwing or showing a key, which is what lets a locale
 * land incrementally.
 *
 * When adding a new label: drop the English text verbatim as the key,
 * and the translation as the value, in each locale file.
 */
import { normalizeUiLanguage, type UiLanguage } from '@freecrawl/shared-types';
import { TR_LABELS } from './labels/tr.js';
import { AZ_LABELS } from './labels/az.js';
import { ZH_CN_LABELS } from './labels/zh-CN.js';
import { FR_LABELS } from './labels/fr.js';
import { HI_LABELS } from './labels/hi.js';
import { IT_LABELS } from './labels/it.js';
import { KO_LABELS } from './labels/ko.js';
import { PT_BR_LABELS } from './labels/pt-BR.js';
import { RU_LABELS } from './labels/ru.js';
import { ES_LABELS } from './labels/es.js';

const LABELS: Partial<Record<UiLanguage, Record<string, string>>> = {
  tr: TR_LABELS,
  az: AZ_LABELS,
  'zh-CN': ZH_CN_LABELS,
  fr: FR_LABELS,
  hi: HI_LABELS,
  it: IT_LABELS,
  ko: KO_LABELS,
  'pt-BR': PT_BR_LABELS,
  ru: RU_LABELS,
  es: ES_LABELS,
};

/**
 * Translate a sidebar/column label. Returns the English string verbatim
 * when no translation is registered for the active language — keeps
 * partial coverage graceful.
 *
 * `lang` is whatever `i18n.language` currently holds, so it can carry a
 * region (`pt-BR`) or arrive from a prop typed as plain `string`;
 * `normalizeUiLanguage` is what maps it onto a shipped table.
 */
export function translateLabel(label: string, lang: string): string {
  const code = normalizeUiLanguage(lang);
  if (!code) return label;
  return LABELS[code]?.[label] ?? label;
}
