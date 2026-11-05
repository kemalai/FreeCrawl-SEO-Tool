import { useEffect, useRef, useState } from 'react';
import { Gauge, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store.js';

/** More than this many 429 / 503 answers in one crawl triggers the notice. */
const THRESHOLD = 5;
const HIDE_KEY = 'freecrawl.rateLimitNotice.hidden';

function readHidden(): boolean {
  try {
    return window.localStorage.getItem(HIDE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeHidden(): void {
  try {
    window.localStorage.setItem(HIDE_KEY, '1');
  } catch {
    /* storage unavailable — the notice just shows again next crawl */
  }
}

/**
 * Shown once per crawl when the site keeps answering 429 / 503 while
 * Adaptive speed is off. It only explains and points to the setting —
 * turning it on is the user's call, so nothing here changes the config.
 */
export function RateLimitNotice() {
  const { t } = useTranslation();
  const running = useAppStore((s) => s.progress?.running ?? false);
  const limited = useAppStore((s) => s.progress?.rateLimitedCount ?? 0);
  const adaptive = useAppStore((s) => s.config.adaptiveSpeed);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const shownThisCrawl = useRef(false);
  const wasRunning = useRef(false);

  useEffect(() => {
    // A new crawl gets its own chance to show the notice.
    if (running && !wasRunning.current) shownThisCrawl.current = false;
    wasRunning.current = running;
    if (!running || adaptive || shownThisCrawl.current) return;
    if (limited <= THRESHOLD || readHidden()) return;
    shownThisCrawl.current = true;
    setDontShow(false);
    setOpen(true);
  }, [running, limited, adaptive]);

  // Turning the setting on (here or elsewhere) makes the notice moot.
  useEffect(() => {
    if (adaptive) setOpen(false);
  }, [adaptive]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function close() {
    if (dontShow) writeHidden();
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rate-limit-notice-title"
        className="w-[480px] max-w-[calc(100vw-32px)] rounded-md border border-amber-700/50 bg-surface-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-surface-800 px-4 py-2.5">
          <Gauge className="h-4 w-4 text-amber-400" />
          <h2 id="rate-limit-notice-title" className="text-[13px] font-semibold text-surface-100">
            {t('rateLimitNotice.title', { defaultValue: 'The site is limiting the crawl' })}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label={t('common.close', { defaultValue: 'Close' })}
            className="ml-auto rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-3 px-4 py-3 text-[12px] leading-relaxed text-surface-300">
          <p>
            {t('rateLimitNotice.body', {
              defaultValue_one:
                'The server answered {{count}} request with 429 (Too Many Requests) or 503 (Service Unavailable). Adaptive speed is off, so the crawl keeps its fixed pace and more pages may fail.',
              defaultValue_other:
                'The server answered {{count}} requests with 429 (Too Many Requests) or 503 (Service Unavailable). Adaptive speed is off, so the crawl keeps its fixed pace and more pages may fail.',
              defaultValue:
                'The server answered {{count}} requests with 429 (Too Many Requests) or 503 (Service Unavailable). Adaptive speed is off, so the crawl keeps its fixed pace and more pages may fail.',
              count: limited,
            })}
          </p>
          <p>
            {t('rateLimitNotice.benefit', {
              defaultValue:
                'If you turn on Adaptive speed, the crawl speed adjusts automatically: it slows down while the server pushes back and speeds up again once responses are clean. Saving it applies to this crawl too.',
            })}
          </p>
          <div className="rounded border border-surface-700 bg-surface-850 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-surface-500">
              {t('rateLimitNotice.where', { defaultValue: 'Where to turn it on' })}
            </div>
            <div className="mt-0.5 font-medium text-surface-100">
              {t('rateLimitNotice.path', { defaultValue: 'Settings → Speed → Adaptive speed' })}
            </div>
          </div>
          <label className="flex items-center gap-2 text-[11px] text-surface-400">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
            />
            {t('rateLimitNotice.dontShow', { defaultValue: "Don't show this again" })}
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-surface-800 px-4 py-2.5">
          <button
            type="button"
            onClick={close}
            className="rounded border border-surface-700 px-2.5 py-1 text-[11px] text-surface-300 hover:bg-surface-800"
          >
            {t('rateLimitNotice.notNow', { defaultValue: 'Not now' })}
          </button>
          <button
            type="button"
            onClick={() => {
              close();
              setSettingsOpen(true, { section: 'speed' });
            }}
            className="rounded bg-blue-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-500"
          >
            {t('rateLimitNotice.openSettings', { defaultValue: 'Open Speed settings' })}
          </button>
        </div>
      </div>
    </div>
  );
}
