import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProjectOpenProgress } from '@freecrawl/shared-types';

/** An open that finishes sooner than this shows no dialog at all. */
const SHOW_DELAY_MS = 400;
/** Once shown, the dialog stays at least this long, so it never just blinks. */
const MIN_VISIBLE_MS = 500;

/**
 * Progress dialog for File → Open: unpacking the project and, for one saved
 * by an older version, upgrading it to the current schema (seconds on a
 * large crawl). The main process does that work on worker threads, so this
 * keeps animating and closes on its own when the project is open.
 */
export function ProjectOpenDialog() {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<ProjectOpenProgress | null>(null);
  const [visible, setVisible] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let shownAt: number | null = null;
    let sawEvent = false;

    const apply = (p: ProjectOpenProgress): void => {
      if (p.phase === 'done') {
        if (showTimer) clearTimeout(showTimer);
        showTimer = null;
        if (shownAt === null) {
          setProgress(null);
          return;
        }
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(
          () => {
            hideTimer = null;
            shownAt = null;
            setVisible(false);
            setProgress(null);
          },
          Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt)),
        );
        return;
      }
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = null;
      setProgress(p);
      if (shownAt === null && showTimer === null) {
        showTimer = setTimeout(() => {
          showTimer = null;
          shownAt = Date.now();
          setVisible(true);
        }, SHOW_DELAY_MS);
      }
    };

    const off = window.freecrawl.onProjectOpenProgress((p) => {
      sawEvent = true;
      apply(p);
    });
    // A project double-clicked while the app is closed starts opening
    // before this mounts; pick up where that open is.
    void window.freecrawl.projectOpenProgressGet().then((p) => {
      if (p && !sawEvent) apply(p);
    });
    return () => {
      off();
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (visible) boxRef.current?.focus();
  }, [visible]);

  if (!visible || progress === null || progress.phase === 'done') return null;

  const upgrading = progress.phase === 'upgrading';
  const percent =
    upgrading && progress.fraction !== null ? Math.round(progress.fraction * 100) : null;
  const title = upgrading
    ? t('projectOpen.upgradingTitle', { defaultValue: 'Updating project for this version' })
    : t('projectOpen.openingTitle', { defaultValue: 'Opening project…' });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-busy="true"
        aria-labelledby="project-open-title"
        tabIndex={-1}
        className="w-[420px] rounded-md border border-surface-700 bg-surface-900 p-5 text-surface-100 shadow-xl outline-none"
      >
        <h2 id="project-open-title" className="mb-2 text-[15px] font-semibold">
          {title}
        </h2>
        {upgrading && (
          <p className="mb-4 text-[12px] text-surface-300">
            {t('projectOpen.upgradingNote', {
              defaultValue:
                'This happens only once, for projects saved with an earlier version. The project opens as soon as it is done.',
            })}
          </p>
        )}
        <div
          role="progressbar"
          aria-label={title}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent ?? undefined}
          className={`relative h-1.5 overflow-hidden rounded-full bg-surface-800 ${upgrading ? '' : 'mt-4'}`}
        >
          {percent === null ? (
            <div className="project-open-indeterminate absolute inset-y-0 left-0 w-1/3 rounded-full bg-accent-500" />
          ) : (
            <div
              className="project-open-fill relative h-full rounded-full bg-accent-500 transition-[width] duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          )}
        </div>
        <div className="mt-2 flex h-4 items-center justify-between text-[11px] tabular-nums text-surface-400">
          <span>
            {upgrading && progress.steps > 1
              ? t('projectOpen.step', {
                  defaultValue: 'Step {{step}} of {{steps}}',
                  step: progress.step,
                  steps: progress.steps,
                })
              : ''}
          </span>
          <span>{percent !== null ? `${percent}%` : ''}</span>
        </div>
      </div>
    </div>
  );
}
