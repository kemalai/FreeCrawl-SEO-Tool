import { useState } from 'react';
import { Download } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { TabKey } from '../store.js';
import { ErrorBoundary } from './ErrorBoundary.js';
import { ExportDialog } from './ExportDialog.js';

/**
 * Toolbar "Export" for the integration + SERP tabs — the same control the
 * main URL table has, opening the Export dialog with this tab's table
 * pre-selected. The dialog owns format (Excel / CSV / JSON / XML) and the
 * column picker, so every tab exports through one path and the file a
 * user gets from Search Console looks like the one they get from Internal.
 */
export function TabExportButton({
  tab,
  defaultLeaf,
  disabled,
  className,
}: {
  tab: TabKey;
  /** Leaf to pre-select for tabs with provider children (`seo:ahrefs`). */
  defaultLeaf?: string;
  /** True when the tab has nothing loaded — keeps the button honest. */
  disabled?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={clsx(
          'inline-flex h-6 shrink-0 items-center gap-1.5 rounded border px-2 text-[11px] transition',
          disabled
            ? 'cursor-not-allowed border-surface-800 text-surface-600'
            : 'border-surface-700 text-surface-300 hover:bg-surface-800',
          className,
        )}
        title={
          disabled
            ? t('urlsTab.noDataToExport', { defaultValue: 'No data to export' })
            : t('urlsTab.exportThisTable', { defaultValue: 'Export this table' })
        }
      >
        <Download className="h-3.5 w-3.5" />
        <span>{t('urlsTab.export', { defaultValue: 'Export' })}</span>
      </button>
      <ErrorBoundary context="ExportDialog">
        {open && (
          <ExportDialog
            open={open}
            onClose={() => setOpen(false)}
            defaultTab={tab}
            defaultLeaf={defaultLeaf}
          />
        )}
      </ErrorBoundary>
    </>
  );
}
