/**
 * In-app crawl scheduler. One schedule per project, persisted in
 * `userData/preferences.json` under the `schedules` key as a map keyed
 * by absolute `.seoproject` path:
 *
 *   "schedules": {
 *     "/abs/path/project.seoproject": { spec: {...}, status: {...} }
 *   }
 *
 * The main process ticks every 60 s and fires the schedule for the
 * currently-loaded project when due (`nextFiresAt <= now`) — and only
 * when no crawl is already in progress. Closed-app firing is out of
 * scope; the OS-scheduler-via-CLI path is V2.
 */

import type { ScheduleEntry, ScheduleSpec, ScheduleStatus } from '@freecrawl/shared-types';

/**
 * Minimum interval the `custom` cadence will honour. Anything below this
 * is clamped — prevents an accidental "every 1 minute" schedule that
 * would saturate a target server.
 */
const MIN_CUSTOM_INTERVAL_MIN = 15;

export interface SchedulerStore {
  /** Read the schedules map. Caller mutates and writes back via `save`. */
  load: () => Record<string, ScheduleEntry>;
  save: (map: Record<string, ScheduleEntry>) => void;
}

export function getSchedule(
  store: SchedulerStore,
  projectPath: string,
): ScheduleEntry | null {
  if (!projectPath) return null;
  const map = store.load();
  return map[projectPath] ?? null;
}

export function setSchedule(
  store: SchedulerStore,
  projectPath: string,
  spec: ScheduleSpec | null,
  now: number = Date.now(),
): ScheduleEntry | null {
  if (!projectPath) return null;
  const map = store.load();
  if (spec === null) {
    if (map[projectPath]) {
      delete map[projectPath];
      store.save(map);
    }
    return null;
  }
  const normalized = normalizeSpec(spec);
  const previousStatus = map[projectPath]?.status;
  const entry: ScheduleEntry = {
    spec: normalized,
    status: {
      lastFiredAt: previousStatus?.lastFiredAt ?? null,
      lastStatus: previousStatus?.lastStatus ?? null,
      nextFiresAt: normalized.enabled ? computeNextFire(normalized, now, null) : null,
    },
  };
  map[projectPath] = entry;
  store.save(map);
  return entry;
}

/**
 * Determine which schedule (if any) is due to fire for the given
 * project. Returns the updated entry with status flipped to `running`
 * and `nextFiresAt` re-computed for the *next* tick so the same
 * schedule can't double-fire while a crawl is in progress.
 */
export function claimIfDue(
  store: SchedulerStore,
  projectPath: string,
  now: number = Date.now(),
): ScheduleEntry | null {
  if (!projectPath) return null;
  const map = store.load();
  const entry = map[projectPath];
  if (!entry || !entry.spec.enabled) return null;
  const due = entry.status.nextFiresAt;
  if (due === null || due > now) return null;
  const nextStatus: ScheduleStatus = {
    lastFiredAt: now,
    lastStatus: 'running',
    nextFiresAt: computeNextFire(entry.spec, now, now),
  };
  const updated: ScheduleEntry = { spec: entry.spec, status: nextStatus };
  map[projectPath] = updated;
  store.save(map);
  return updated;
}

export function recordFireResult(
  store: SchedulerStore,
  projectPath: string,
  result: 'success' | 'failure',
): void {
  if (!projectPath) return;
  const map = store.load();
  const entry = map[projectPath];
  if (!entry) return;
  entry.status.lastStatus = result;
  map[projectPath] = entry;
  store.save(map);
}

function normalizeSpec(spec: ScheduleSpec): ScheduleSpec {
  const out: ScheduleSpec = {
    enabled: !!spec.enabled,
    cadence: spec.cadence,
  };
  if (spec.cadence === 'custom') {
    const raw = Math.floor(spec.intervalMinutes ?? MIN_CUSTOM_INTERVAL_MIN);
    out.intervalMinutes = Math.max(MIN_CUSTOM_INTERVAL_MIN, raw);
  }
  if (spec.cadence === 'daily' || spec.cadence === 'weekly') {
    out.hourOfDay = clampInt(spec.hourOfDay ?? 3, 0, 23);
    out.minuteOfHour = clampInt(spec.minuteOfHour ?? 0, 0, 59);
  }
  if (spec.cadence === 'weekly') {
    out.dayOfWeek = clampInt(spec.dayOfWeek ?? 1, 0, 6);
  }
  return out;
}

/**
 * Compute the next fire timestamp (epoch ms) for the given spec.
 *
 * - `from` anchors when we're computing relative to. For a fresh save,
 *   pass the user's "now". For a just-fired schedule, pass `lastFiredAt`
 *   so `daily`/`weekly` still target the same time-of-day on the next
 *   calendar slot regardless of when the crawl actually completed.
 * - `lastFiredAt` only matters for `hourly`/`custom` — those advance
 *   from when the last fire happened (so the cadence stays steady even
 *   if the previous crawl was late).
 */
export function computeNextFire(
  spec: ScheduleSpec,
  now: number,
  lastFiredAt: number | null,
): number {
  if (spec.cadence === 'hourly') {
    const base = lastFiredAt ?? now;
    return base + 60 * 60 * 1000;
  }
  if (spec.cadence === 'custom') {
    const interval =
      Math.max(MIN_CUSTOM_INTERVAL_MIN, spec.intervalMinutes ?? MIN_CUSTOM_INTERVAL_MIN) *
      60 *
      1000;
    const base = lastFiredAt ?? now;
    return base + interval;
  }
  // Daily / weekly — pin to time-of-day in local timezone. We always
  // advance by at least 1 minute past `now` to avoid an immediate
  // re-fire when the saved spec matches the current clock.
  const hour = spec.hourOfDay ?? 3;
  const minute = spec.minuteOfHour ?? 0;
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (spec.cadence === 'daily') {
    if (target.getTime() <= now) {
      target.setDate(target.getDate() + 1);
    }
    return target.getTime();
  }
  // weekly
  const targetDay = spec.dayOfWeek ?? 1;
  let delta = (targetDay - target.getDay() + 7) % 7;
  if (delta === 0 && target.getTime() <= now) {
    delta = 7;
  }
  target.setDate(target.getDate() + delta);
  return target.getTime();
}

function clampInt(v: number, min: number, max: number): number {
  const n = Math.floor(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
