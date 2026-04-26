import { Info } from 'lucide-react';

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
  if (!info && !example) return null;
  return (
    <span className="group relative inline-flex">
      <Info
        className="h-3 w-3 cursor-help text-surface-500 transition-colors group-hover:text-surface-200"
        tabIndex={0}
        aria-label={info ?? 'More info'}
      />
      <span className="pointer-events-none invisible absolute left-4 top-0 z-50 w-64 rounded border border-surface-700 bg-surface-900 p-2 text-[10px] leading-relaxed text-surface-200 opacity-0 shadow-xl transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        {info && <span className="block">{info}</span>}
        {example && (
          <>
            <span className="mt-1.5 block text-[9px] font-semibold uppercase tracking-wider text-surface-500">
              Example
            </span>
            <span className="mt-0.5 block break-words font-mono text-[10px] text-surface-300">
              {example}
            </span>
          </>
        )}
      </span>
    </span>
  );
}
