import { useState } from 'react';
import { Download } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export interface GridExportData {
  headers: string[];
  rows: (string | number | boolean | null)[][];
}

/**
 * Per-sub-tab export button for the URL Details panel.
 *
 * Every sub-tab shows a different table, so rather than one panel-wide
 * export that would have to know all of them, each view drops this button
 * in its own header and hands over its own rows. The data is produced
 * lazily by `getData()` — building a few thousand cells is wasted work on
 * every render when the user may never click.
 *
 * Format (CSV vs Excel) is chosen in the native save dialog by the file
 * type the user picks, which keeps the button itself to a single control.
 */
export function GridExportButton({
  fileName,
  sheetName,
  getData,
  disabled,
  className,
}: {
  /** File name stem, without extension. Sanitised in the main process. */
  fileName: string;
  /** Worksheet name for xlsx. Defaults to the file name. */
  sheetName?: string;
  getData: () => GridExportData;
  disabled?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const run = async (): Promise<void> => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const { headers, rows } = getData();
      if (headers.length === 0) return;
      await window.freecrawl.exportGrid({ fileName, sheetName, headers, rows });
    } catch {
      // The main process logs the cause; a failed export must not take
      // the panel down with it.
    } finally {
      setBusy(false);
    }
  };

  const inert = disabled || busy;
  return (
    <button
      type="button"
      onClick={() => void run()}
      disabled={inert}
      className={clsx(
        'inline-flex shrink-0 items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] transition',
        inert
          ? 'cursor-not-allowed border-surface-800 text-surface-600'
          : 'border-surface-700 text-surface-300 hover:bg-surface-800',
        className,
      )}
      title={
        disabled
          ? t('detailExport.nothing', { defaultValue: 'Nothing to export' })
          : t('detailExport.title', {
              defaultValue: 'Export this table to Excel or CSV',
            })
      }
    >
      <Download className="h-3.5 w-3.5" />
      <span>{t('detailExport.label', { defaultValue: 'Export' })}</span>
    </button>
  );
}
