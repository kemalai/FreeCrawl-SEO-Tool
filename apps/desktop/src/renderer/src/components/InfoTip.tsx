import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translateInfoTip } from '../i18n/info-tips.js';

export interface FieldInfo {
  /** One-line description of what the field/column means. */
  info?: string;
  /** Concrete example value or usage hint. Rendered under "Example:" in the tooltip. */
  example?: string;
}

/**
 * Hover/focus tooltip used next to setting labels and table column
 * headers. Renders an [i] icon; the popover surfaces a description and
 * an optional concrete example. `pointer-events-none` lets the mouse
 * pass through, so hovering the icon doesn't block clicks on the
 * column-header sort/resize controls underneath.
 */
export function InfoTip({ info, example }: FieldInfo) {
  const { t, i18n } = useTranslation();
  if (!info && !example) return null;
  // Tooltip bodies are passed in as English literals by ~170 column
  // specs and settings fields; the translation happens here, once, so
  // none of those call sites has to thread a `t()` call through. Unknown
  // strings — and deliberately untranslated technical examples like
  // regexes and header values — fall through unchanged.
  const localizedInfo = translateInfoTip(info, i18n.language);
  const localizedExample = translateInfoTip(example, i18n.language);
  return (
    <span className="group relative inline-flex">
      <Info
        className="h-3 w-3 cursor-help text-surface-500 transition-colors group-hover:text-surface-200"
        tabIndex={0}
        aria-label={localizedInfo ?? t('infoTip.moreInfo', { defaultValue: 'More info' })}
      />
      <span className="pointer-events-none invisible absolute left-4 top-0 z-50 w-64 rounded border border-surface-700 bg-surface-900 p-2 text-[10px] leading-relaxed text-surface-200 opacity-0 shadow-xl transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        {localizedInfo && <span className="block">{localizedInfo}</span>}
        {localizedExample && (
          <>
            <span className="mt-1.5 block text-[9px] font-semibold uppercase tracking-wider text-surface-500">
              {t('infoTip.example', { defaultValue: 'Example' })}
            </span>
            <span className="mt-0.5 block break-words font-mono text-[10px] text-surface-300">
              {localizedExample}
            </span>
          </>
        )}
      </span>
    </span>
  );
}
