import { useEffect, useMemo, useState } from 'react';
import { X, Clock, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { ScheduleAfterCrawl, ScheduleEntry, ScheduleSpec } from '@freecrawl/shared-types';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Cadence = 'hourly' | 'daily' | 'weekly' | 'custom';

const MIN_CUSTOM_INTERVAL = 15;

interface FormState {
  enabled: boolean;
  cadence: Cadence;
  intervalMinutes: string;
  hourOfDay: string;
  minuteOfHour: string;
  dayOfWeek: number;
  afterExport: ScheduleAfterCrawl['export'];
  afterOutputDir: string;
  afterSheets: boolean;
  afterWebhook: boolean;
}

const DEFAULT_FORM: FormState = {
  enabled: false,
  cadence: 'daily',
  intervalMinutes: '60',
  hourOfDay: '03',
  minuteOfHour: '00',
  dayOfWeek: 1,
  afterExport: 'none',
  afterOutputDir: '',
  afterSheets: false,
  afterWebhook: false,
};

function entryToForm(entry: ScheduleEntry | null): FormState {
  if (!entry) return DEFAULT_FORM;
  const { spec } = entry;
  return {
    enabled: spec.enabled,
    cadence: spec.cadence,
    intervalMinutes: String(spec.intervalMinutes ?? 60),
    hourOfDay: String(spec.hourOfDay ?? 3).padStart(2, '0'),
    minuteOfHour: String(spec.minuteOfHour ?? 0).padStart(2, '0'),
    dayOfWeek: spec.dayOfWeek ?? 1,
    afterExport: spec.afterCrawl?.export ?? 'none',
    afterOutputDir: spec.afterCrawl?.outputDir ?? '',
    afterSheets: spec.afterCrawl?.sheets ?? false,
    afterWebhook: spec.afterCrawl?.webhook ?? false,
  };
}

function formToSpec(form: FormState): ScheduleSpec {
  const out: ScheduleSpec = {
    enabled: form.enabled,
    cadence: form.cadence,
  };
  if (form.cadence === 'custom') {
    const n = Math.max(MIN_CUSTOM_INTERVAL, Math.floor(Number(form.intervalMinutes) || 0));
    out.intervalMinutes = n;
  }
  if (form.cadence === 'daily' || form.cadence === 'weekly') {
    out.hourOfDay = clampInt(Number(form.hourOfDay), 0, 23, 3);
    out.minuteOfHour = clampInt(Number(form.minuteOfHour), 0, 59, 0);
  }
  if (form.cadence === 'weekly') {
    out.dayOfWeek = clampInt(form.dayOfWeek, 0, 6, 1);
  }
  const outputDir = form.afterOutputDir.trim();
  const exportKind = form.afterExport !== 'none' && outputDir !== '' ? form.afterExport : 'none';
  if (exportKind !== 'none' || form.afterSheets || form.afterWebhook) {
    out.afterCrawl = {
      export: exportKind,
      outputDir,
      sheets: form.afterSheets,
      webhook: form.afterWebhook,
    };
  }
  return out;
}

function clampInt(v: number, min: number, max: number, fallback: number): number {
  const n = Math.floor(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function formatDateTime(ms: number | null): string {
  if (ms === null) return '—';
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduledCrawlDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const dayNames = [
    t('scheduled.daySun', { defaultValue: 'Sun' }),
    t('scheduled.dayMon', { defaultValue: 'Mon' }),
    t('scheduled.dayTue', { defaultValue: 'Tue' }),
    t('scheduled.dayWed', { defaultValue: 'Wed' }),
    t('scheduled.dayThu', { defaultValue: 'Thu' }),
    t('scheduled.dayFri', { defaultValue: 'Fri' }),
    t('scheduled.daySat', { defaultValue: 'Sat' }),
  ];
  const [entry, setEntry] = useState<ScheduleEntry | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-fetch the schedule each time the dialog reopens so any external
  // mutation (scheduled crawl fired → lastFiredAt updated) shows on the
  // status row immediately. Reset dirty flag so the Save button starts
  // disabled until the user actually edits something.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setDirty(false);
    void window.freecrawl.scheduleGet().then((e) => {
      setEntry(e);
      setForm(entryToForm(e));
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const spec = formToSpec(form);
      const result = await window.freecrawl.scheduleSet(spec);
      setEntry(result);
      setForm(entryToForm(result));
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function clearSchedule() {
    if (!entry) return;
    if (!window.confirm(t('scheduled.confirmRemove', { defaultValue: 'Remove the scheduled crawl for this project?' }))) return;
    setSaving(true);
    setError(null);
    try {
      await window.freecrawl.scheduleSet(null);
      setEntry(null);
      setForm(DEFAULT_FORM);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const showInterval = form.cadence === 'custom';
  const showTimeOfDay = form.cadence === 'daily' || form.cadence === 'weekly';
  const showDayOfWeek = form.cadence === 'weekly';

  const nextFiresHint = useMemo(() => {
    if (!form.enabled) return t('scheduled.hintDisabled', { defaultValue: 'Disabled — set "Enabled" and Save to arm the schedule.' });
    return t('scheduled.hintEnabled', { defaultValue: 'Save to compute the next fire time. The schedule only fires while FreeCrawl is open.' });
  }, [form.enabled, t]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-[520px] flex-col rounded-md border border-surface-700 bg-surface-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-surface-800 px-4 py-2.5">
          <Clock className="h-4 w-4 text-surface-300" />
          <div className="ml-2 text-sm font-semibold tracking-wide text-surface-100">
            {t('scheduled.title', { defaultValue: 'Scheduled Crawl' })}
          </div>
          <button
            className="ml-auto rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
            onClick={onClose}
            title={t('scheduled.closeEsc', { defaultValue: 'Close (Esc)' })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 text-[12px]">
          <div className="rounded border border-amber-700/40 bg-amber-900/20 px-3 py-2 text-[11px] text-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div>
                {t('scheduled.warningPrefix', { defaultValue: 'The schedule fires only while FreeCrawl is open on this project. For triggers that survive an app restart, run' })}
                <code className="mx-1 rounded bg-surface-950 px-1 font-mono">freecrawl</code>
                {t('scheduled.warningSuffix', { defaultValue: '(the CLI) from Windows Task Scheduler / macOS launchd / cron.' })}
              </div>
            </div>
          </div>

          <label className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => update('enabled', e.target.checked)}
              className="h-3.5 w-3.5 accent-blue-500"
            />
            <span className="font-medium text-surface-100">{t('scheduled.enabled', { defaultValue: 'Enabled' })}</span>
          </label>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-surface-400">{t('scheduled.cadence', { defaultValue: 'Cadence' })}</span>
              <select
                className="h-7 rounded border border-surface-700 bg-surface-950 px-2 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                value={form.cadence}
                onChange={(e) => update('cadence', e.target.value as Cadence)}
              >
                <option value="hourly">{t('scheduled.hourly', { defaultValue: 'Hourly' })}</option>
                <option value="daily">{t('scheduled.daily', { defaultValue: 'Daily' })}</option>
                <option value="weekly">{t('scheduled.weekly', { defaultValue: 'Weekly' })}</option>
                <option value="custom">{t('scheduled.customInterval', { defaultValue: 'Custom interval' })}</option>
              </select>
            </label>

            {showInterval && (
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-surface-400">
                  {t('scheduled.intervalMinutes', { defaultValue: 'Interval (minutes, min {{min}})', min: MIN_CUSTOM_INTERVAL })}
                </span>
                <input
                  type="number"
                  min={MIN_CUSTOM_INTERVAL}
                  step={5}
                  value={form.intervalMinutes}
                  onChange={(e) => update('intervalMinutes', e.target.value)}
                  className="h-7 rounded border border-surface-700 bg-surface-950 px-2 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                />
              </label>
            )}

            {showTimeOfDay && (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-surface-400">{t('scheduled.hour', { defaultValue: 'Hour (0–23)' })}</span>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={form.hourOfDay}
                    onChange={(e) => update('hourOfDay', e.target.value)}
                    className="h-7 rounded border border-surface-700 bg-surface-950 px-2 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-surface-400">{t('scheduled.minute', { defaultValue: 'Minute (0–59)' })}</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={form.minuteOfHour}
                    onChange={(e) => update('minuteOfHour', e.target.value)}
                    className="h-7 rounded border border-surface-700 bg-surface-950 px-2 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                  />
                </label>
              </>
            )}

            {showDayOfWeek && (
              <label className="col-span-2 flex flex-col gap-1">
                <span className="text-[11px] text-surface-400">{t('scheduled.dayOfWeek', { defaultValue: 'Day of week' })}</span>
                <div className="flex flex-wrap gap-1">
                  {dayNames.map((label, idx) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => update('dayOfWeek', idx)}
                      className={clsx(
                        'rounded border px-2 py-1 text-[11px] transition',
                        form.dayOfWeek === idx
                          ? 'border-blue-500 bg-blue-500/15 text-blue-200'
                          : 'border-surface-700 text-surface-300 hover:bg-surface-800',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </label>
            )}
          </div>

          <div className="mt-3 rounded border border-surface-800 bg-surface-950/40 px-3 py-2">
            <div className="mb-2 text-[11px] font-medium text-surface-200">
              {t('scheduled.afterTitle', { defaultValue: 'After each scheduled crawl' })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-surface-400">{t('scheduled.afterExport', { defaultValue: 'Export' })}</span>
                <select
                  value={form.afterExport}
                  onChange={(e) => update('afterExport', e.target.value as ScheduleAfterCrawl['export'])}
                  className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="none">{t('scheduled.exportNone', { defaultValue: 'Nothing' })}</option>
                  <option value="bulk">{t('scheduled.exportBulk', { defaultValue: 'Bulk export (CSV folder)' })}</option>
                  <option value="seo-audit">{t('scheduled.exportSeoAudit', { defaultValue: 'SEO Audit (Screaming Frog layout)' })}</option>
                  <option value="html">{t('scheduled.exportHtml', { defaultValue: 'HTML report' })}</option>
                  <option value="pdf">{t('scheduled.exportPdf', { defaultValue: 'PDF report' })}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-surface-400">{t('scheduled.outputDir', { defaultValue: 'Folder' })}</span>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={form.afterOutputDir}
                    onChange={(e) => update('afterOutputDir', e.target.value)}
                    disabled={form.afterExport === 'none'}
                    className="min-w-0 flex-1 rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={form.afterExport === 'none'}
                    onClick={() => {
                      void window.freecrawl
                        .pickDirectory({ defaultPath: form.afterOutputDir || undefined })
                        .then((dir) => {
                          if (dir) update('afterOutputDir', dir);
                        });
                    }}
                    className="rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-200 hover:border-blue-500 disabled:opacity-50"
                  >
                    {t('scheduled.browse', { defaultValue: 'Browse…' })}
                  </button>
                </div>
              </label>
            </div>
            {form.afterExport !== 'none' && form.afterOutputDir.trim() === '' && (
              <div className="mt-1 text-[11px] text-amber-300">
                {t('scheduled.outputDirHint', { defaultValue: 'Pick a folder — each run writes into a timestamped sub-folder there.' })}
              </div>
            )}
            <label className="mt-2 flex items-center gap-2 text-[11px] text-surface-200">
              <input
                type="checkbox"
                checked={form.afterSheets}
                onChange={(e) => update('afterSheets', e.target.checked)}
                className="h-3.5 w-3.5 accent-blue-500"
              />
              {t('scheduled.sheets', { defaultValue: 'Also push All URLs to a new Google Sheets spreadsheet' })}
            </label>
            <label className="mt-1 flex items-center gap-2 text-[11px] text-surface-200">
              <input
                type="checkbox"
                checked={form.afterWebhook}
                onChange={(e) => update('afterWebhook', e.target.checked)}
                className="h-3.5 w-3.5 accent-blue-500"
              />
              {t('scheduled.webhook', { defaultValue: 'Notify the project webhook with the file list (Settings → Webhook)' })}
            </label>
          </div>

          <div className="mt-3 rounded border border-surface-800 bg-surface-950/60 px-3 py-2">
            <div className="grid grid-cols-2 gap-y-1 text-[11px]">
              <span className="text-surface-400">{t('scheduled.nextFire', { defaultValue: 'Next fire' })}</span>
              <span className="font-mono text-surface-200">
                {entry ? formatDateTime(entry.status.nextFiresAt) : '—'}
              </span>
              <span className="text-surface-400">{t('scheduled.lastFired', { defaultValue: 'Last fired' })}</span>
              <span className="font-mono text-surface-200">
                {entry ? formatDateTime(entry.status.lastFiredAt) : '—'}
              </span>
              <span className="text-surface-400">{t('scheduled.lastStatus', { defaultValue: 'Last status' })}</span>
              <span
                className={clsx(
                  'font-mono',
                  entry?.status.lastStatus === 'success' && 'text-emerald-400',
                  entry?.status.lastStatus === 'failure' && 'text-red-400',
                  entry?.status.lastStatus === 'running' && 'text-blue-300',
                  !entry?.status.lastStatus && 'text-surface-500',
                )}
              >
                {entry?.status.lastStatus ?? '—'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-surface-500">{nextFiresHint}</div>
          </div>

          {error && (
            <div className="mt-3 rounded border border-red-700/50 bg-red-900/20 px-3 py-2 text-[11px] text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-surface-800 px-4 py-2.5">
          {entry && (
            <button
              type="button"
              onClick={clearSchedule}
              disabled={saving}
              className="rounded border border-red-700/60 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.remove', { defaultValue: 'Remove' })}
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded border border-surface-700 px-2.5 py-1 text-[11px] text-surface-300 hover:bg-surface-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="rounded bg-blue-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? t('scheduled.saving', { defaultValue: 'Saving…' }) : t('common.save', { defaultValue: 'Save' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
