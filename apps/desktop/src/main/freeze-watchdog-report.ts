/**
 * Pure helpers behind the lines the freeze watchdog writes to
 * `debug.txt`. Kept free of Electron / worker imports so the logic that
 * decides *what* gets recorded can be unit-tested, and so `logger.ts` can
 * use the mirror filter without importing the watchdog (which imports the
 * logger — a cycle).
 *
 * `debug.txt` is the one file a remote user is asked to send. Every
 * helper here exists because a real investigation of that file had to
 * guess at something it should have simply stated: which storage mode
 * the session ran in, what the crawl was configured to do, whether the
 * app was killed or exited, how long each post-crawl phase took, and
 * which errors the main log had recorded meanwhile.
 */

import type { LogLevel } from '@freecrawl/shared-types';

/** Cap on the message part of a mirrored log line. Stacks and SQL are
 *  in the main log; the debug file wants the headline. */
export const MIRROR_MAX_CHARS = 300;

/**
 * Which logger entries are worth a copy in `debug.txt`.
 *
 * Errors always — a `database is locked`, a worker exit, an unhandled
 * rejection are exactly what a stall needs next to it. Warnings too,
 * except the crawler's: per-URL fetch failures arrive by the thousand on
 * a slow host and would drown the timeline (the heartbeat's `failed`
 * counter already carries their number).
 */
export function shouldMirrorToDebug(level: LogLevel, source: string): boolean {
  if (level === 'error') return true;
  if (level === 'warn') return source !== 'crawler';
  return false;
}

/** First line of a message, whitespace collapsed, capped — one log line. */
export function compactForDebug(message: string): string {
  const firstLine = message.split(/\r?\n/, 1)[0] ?? '';
  const flat = firstLine.replace(/\s+/g, ' ').trim();
  return flat.length > MIRROR_MAX_CHARS ? `${flat.slice(0, MIRROR_MAX_CHARS - 1)}…` : flat;
}

/** Render one mirrored entry as a debug line (without the timestamp). */
export function formatMirroredLog(level: LogLevel, source: string, message: string): string {
  return `[${level.toUpperCase()}] ${source}: ${compactForDebug(message)}`;
}

/**
 * What the tail of the previous debug file says about how that session
 * ended. A clean exit always leaves `[SHUTDOWN]` as its last line; any
 * other last line means the process was killed, crashed, or the machine
 * went down — and the line itself says what the app was doing at the
 * time, which is usually the whole answer to "why did it stop".
 *
 * Returns null when there is nothing to report (fresh file, or a clean
 * shutdown).
 */
export function previousSessionVerdict(tail: string): string | null {
  const lines = tail.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const last = lines[lines.length - 1];
  if (!last) return null;
  if (last.includes('[SHUTDOWN]')) return null;
  const ts = last.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)/)?.[1] ?? 'unknown time';
  const body = last.replace(/^\S+\s*/, '');
  const clipped = body.length > 220 ? `${body.slice(0, 219)}…` : body;
  const doing = /main_op="(crawl|post-crawl):/.test(last)
    ? ' (a crawl was in progress)'
    : '';
  return `[PREV] previous session ended without a clean shutdown at ${ts}${doing} — last line: ${clipped}`;
}

/**
 * Turns the main-thread op stream into phase durations.
 *
 * Ops arrive as `post-crawl:image-probes`, `post-crawl:tls-probes`, …;
 * the tracker reports when one such phase gives way to the next, with
 * how long it ran. A phase that swallows half an hour (16 k image
 * probes) is then a single line, instead of something reconstructed from
 * 360 identical heartbeats.
 */
export class PhaseTracker {
  private current: string | null = null;
  private since = 0;

  /** Feed the current main op; returns a report line when a phase ended. */
  observe(mainOp: string, nowMs: number): string | null {
    const phase = PhaseTracker.phaseOf(mainOp);
    if (phase === this.current) return null;
    let line: string | null = null;
    if (this.current !== null) {
      const secs = Math.max(0, Math.round((nowMs - this.since) / 1000));
      line = `[PHASE] ${this.current} took ${secs}s`;
    }
    this.current = phase;
    this.since = nowMs;
    return line;
  }

  /** Only the post-crawl passes are phases; everything else is `null`. */
  static phaseOf(mainOp: string): string | null {
    if (!mainOp.startsWith('post-crawl:')) return null;
    // `post-crawl:image-probes` stays whole; a URL-suffixed op would be
    // cut at its second colon so the phase name never carries a URL.
    const second = mainOp.indexOf(':', 'post-crawl:'.length);
    return second < 0 ? mainOp : mainOp.slice(0, second);
  }
}

/** Kilobytes → whole megabytes, for the heartbeat's memory fields. */
export function toMb(bytes: number): number {
  return Math.round(bytes / (1024 * 1024));
}
