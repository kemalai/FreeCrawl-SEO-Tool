/**
 * InfoTip ([i] icon) tooltip bodies, keyed by the verbatim English source
 * string exactly like {@link ./labels.ts} — the ~330 `info` / `example`
 * props scattered across columns.ts and SettingsDialog.tsx stay as plain
 * English literals, and `InfoTip` looks the text up at render time. That
 * keeps one lookup in one component instead of threading `t()` calls
 * through every column spec and settings field.
 *
 * Anything absent from a locale's table renders in English (graceful
 * degradation), which is also what happens to technical example values —
 * regexes, header values, URLs — that are deliberately left untranslated
 * in every locale.
 *
 * Coverage: Turkish only for now. These are long-form prose (~48 KB of
 * source text) and were deliberately deferred when the UI went from 2 to
 * 11 locales, so the other ten read English here while the rest of the
 * interface is translated. The shape is already per-locale so filling one
 * in is a pure data addition — add `info-tips/<code>.ts` and one line to
 * `INFO_TIPS` below, no signature change.
 *
 * Hand-maintained: add the entry in the same commit as the tooltip.
 * `tests/settings-infotip-i18n.test.ts` enforces that for both places
 * tooltips are authored — SettingsDialog.tsx and tabs/columns.ts — and a
 * new prose tooltip with no Turkish entry fails the suite by file and
 * line. Technical sample values need no entry; the test tells a sentence
 * apart from a value list on its own.
 */
import { normalizeUiLanguage, type UiLanguage } from '@freecrawl/shared-types';
import { TR_INFO_TIPS } from './info-tips/tr.js';
import { AZ_INFO_TIPS } from './info-tips/az.js';
import { HI_INFO_TIPS } from './info-tips/hi.js';
import { KO_INFO_TIPS } from './info-tips/ko.js';
import { ZH_CN_INFO_TIPS } from './info-tips/zh-CN.js';
import { RU_INFO_TIPS } from './info-tips/ru.js';
import { IT_INFO_TIPS } from './info-tips/it.js';
import { PT_BR_INFO_TIPS } from './info-tips/pt-BR.js';
import { FR_INFO_TIPS } from './info-tips/fr.js';
import { ES_INFO_TIPS } from './info-tips/es.js';

/** Per-language tables. Exported for the parity test only. */
export const INFO_TIPS: Partial<Record<UiLanguage, Record<string, string>>> = {
  tr: TR_INFO_TIPS,
  az: AZ_INFO_TIPS,
  hi: HI_INFO_TIPS,
  ko: KO_INFO_TIPS,
  'zh-CN': ZH_CN_INFO_TIPS,
  ru: RU_INFO_TIPS,
  it: IT_INFO_TIPS,
  'pt-BR': PT_BR_INFO_TIPS,
  fr: FR_INFO_TIPS,
  es: ES_INFO_TIPS,
};

/**
 * Translate an InfoTip body. Returns the input unchanged for English, for
 * a locale with no table, for unknown strings, and for empty input.
 */
export function translateInfoTip(text: string | undefined, lang: string): string | undefined {
  if (!text) return text;
  const code = normalizeUiLanguage(lang);
  if (!code) return text;
  return INFO_TIPS[code]?.[text] ?? text;
}
