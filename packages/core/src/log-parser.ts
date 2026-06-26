/**
 * V2 Faz 2 — access-log line parser.
 *
 * Covers the four formats the Log File Analyzer ingests:
 *   - Apache Common Log Format (CLF)
 *   - Apache / Nginx Combined Log Format (CLF + "referer" "user-agent")
 *   - IIS W3C Extended (field-directive driven, space-separated)
 *   - Custom (user-supplied named-group regex)
 *
 * The parser is stateful only for IIS (it has to remember the most recent
 * `#Fields:` directive), so it is exposed as a small {@link LogParser}
 * object rather than a pure function. Each `feed(line)` returns a
 * {@link ParsedLogLine}, `null` (unparseable data line), or the
 * `DIRECTIVE` sentinel (a comment / header line that carries no hit).
 */

import type { LogFormat, LogFormatChoice } from '@freecrawl/shared-types';

export interface ParsedLogLine {
  ip: string | null;
  /** Epoch ms, or null when the timestamp could not be parsed. */
  ts: number | null;
  method: string | null;
  /** Request target (path + query), fragment stripped. */
  path: string | null;
  status: number | null;
  bytes: number | null;
  userAgent: string | null;
  referer: string | null;
}

/** Returned by `feed()` for comment / `#Fields:` lines — not a hit. */
export const DIRECTIVE = Symbol('log-directive');
export type FeedResult = ParsedLogLine | null | typeof DIRECTIVE;

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

// `10/Oct/2000:13:55:36 -0700`
const APACHE_TS_RE =
  /^(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s*([+-]\d{4})?$/;

/** Parse an Apache/Nginx `[day/Mon/year:HH:MM:SS +zzzz]` stamp to epoch ms. */
export function parseApacheTimestamp(raw: string): number | null {
  const m = APACHE_TS_RE.exec(raw.trim());
  if (!m) return null;
  const [, dd, mon, yyyy, hh, mi, ss, tz] = m;
  const month = MONTHS[mon!];
  if (month === undefined) return null;
  let ms = Date.UTC(
    Number(yyyy),
    month,
    Number(dd),
    Number(hh),
    Number(mi),
    Number(ss),
  );
  if (tz && tz.length === 5) {
    const sign = tz[0] === '-' ? -1 : 1;
    const offMin = Number(tz.slice(1, 3)) * 60 + Number(tz.slice(3, 5));
    ms -= sign * offMin * 60_000;
  }
  return Number.isFinite(ms) ? ms : null;
}

/** Combine an IIS W3C `date`(YYYY-MM-DD) + `time`(HH:MM:SS) pair (UTC). */
function parseIisTimestamp(date: string | undefined, time: string | undefined): number | null {
  if (!date || !time) return null;
  const ms = Date.parse(`${date}T${time}Z`);
  return Number.isFinite(ms) ? ms : null;
}

/** Strip a trailing `#fragment` (logs rarely carry one, but be safe). */
function cleanPath(raw: string | null | undefined): string | null {
  if (!raw || raw === '-') return null;
  const hash = raw.indexOf('#');
  return hash >= 0 ? raw.slice(0, hash) : raw;
}

function toInt(raw: string | null | undefined): number | null {
  if (raw == null || raw === '-' || raw === '') return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

// Apache/Nginx combined: ip - - [ts] "METHOD path proto" status bytes "ref" "ua"
// The request-line group tolerates a missing protocol and odd methods.
const COMBINED_RE =
  /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"([A-Z!]+)\s+(\S+)(?:\s+[^"]*)?"\s+(\d{3})\s+(\S+)\s+"([^"]*)"\s+"([^"]*)"/;
// Apache common: same, minus the two trailing quoted fields.
const COMMON_RE =
  /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"([A-Z!]+)\s+(\S+)(?:\s+[^"]*)?"\s+(\d{3})\s+(\S+)/;

/**
 * Sniff the dialect from a handful of sample lines. Falls back to
 * `apache-combined` (the most common web-server default).
 */
export function detectLogFormat(sampleLines: string[]): LogFormat {
  let apacheCommon = 0;
  let apacheCombined = 0;
  for (const raw of sampleLines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      // `#Fields:` / `#Software: Microsoft Internet Information Services`
      if (/^#(Fields|Software|Version|Date):/i.test(line)) return 'iis-w3c';
      continue;
    }
    if (COMBINED_RE.test(line)) apacheCombined++;
    else if (COMMON_RE.test(line)) apacheCommon++;
  }
  if (apacheCombined === 0 && apacheCommon === 0) {
    // No Apache-shaped lines but data present → likely IIS data without a
    // visible header in the sample, or an unknown shape. Prefer IIS when
    // lines look space-delimited with an ISO date up front.
    const isoFirst = sampleLines.some((l) =>
      /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s/.test(l.trim()),
    );
    if (isoFirst) return 'iis-w3c';
  }
  return apacheCombined >= apacheCommon ? 'apache-combined' : 'apache-common';
}

export interface LogParser {
  readonly format: LogFormat;
  feed(line: string): FeedResult;
}

/**
 * Build a parser for the chosen format. `auto` requires the caller to
 * have resolved the concrete format first (via {@link detectLogFormat});
 * passing `auto` here defaults to `apache-combined`.
 */
export function createLogParser(opts: {
  format: LogFormatChoice;
  customRegex?: string;
}): LogParser {
  const format: LogFormat = opts.format === 'auto' ? 'apache-combined' : opts.format;

  if (format === 'iis-w3c') return new IisParser();
  if (format === 'custom') return new CustomParser(opts.customRegex ?? '');
  return new ApacheParser(format);
}

class ApacheParser implements LogParser {
  readonly format: LogFormat;
  constructor(format: LogFormat) {
    this.format = format;
  }
  feed(raw: string): FeedResult {
    const line = raw.trim();
    if (!line) return null;
    if (line.startsWith('#')) return DIRECTIVE;
    // Try combined first (superset), fall back to common.
    const c = COMBINED_RE.exec(line);
    if (c) {
      return {
        ip: c[1] === '-' ? null : c[1]!,
        ts: parseApacheTimestamp(c[2]!),
        method: c[3]!,
        path: cleanPath(c[4]),
        status: toInt(c[5]),
        bytes: toInt(c[6]),
        referer: c[7] && c[7] !== '-' ? c[7] : null,
        userAgent: c[8] && c[8] !== '-' ? c[8] : null,
      };
    }
    const m = COMMON_RE.exec(line);
    if (m) {
      return {
        ip: m[1] === '-' ? null : m[1]!,
        ts: parseApacheTimestamp(m[2]!),
        method: m[3]!,
        path: cleanPath(m[4]),
        status: toInt(m[5]),
        bytes: toInt(m[6]),
        referer: null,
        userAgent: null,
      };
    }
    return null;
  }
}

/**
 * IIS W3C Extended. Data lines are space-separated values whose meaning
 * comes from the most recent `#Fields:` directive. Standard field tokens:
 *   date time s-ip cs-method cs-uri-stem cs-uri-query s-port cs-username
 *   c-ip cs(User-Agent) cs(Referer) sc-status sc-substatus sc-win32-status
 *   sc-bytes time-taken
 */
class IisParser implements LogParser {
  readonly format: LogFormat = 'iis-w3c';
  private fields: string[] | null = null;

  feed(raw: string): FeedResult {
    const line = raw.trim();
    if (!line) return null;
    if (line.startsWith('#')) {
      const m = /^#Fields:\s*(.+)$/i.exec(line);
      if (m) this.fields = m[1]!.trim().split(/\s+/);
      return DIRECTIVE;
    }
    if (!this.fields) return null; // data before any #Fields header — unusable
    const parts = line.split(/\s+/);
    if (parts.length < this.fields.length) {
      // Quoted UA can contain spaces; IIS escapes them as '+', so a short
      // split is usually a malformed line. Skip it.
      return null;
    }
    const get = (name: string): string | undefined => {
      const idx = this.fields!.indexOf(name);
      return idx >= 0 ? parts[idx] : undefined;
    };
    const stem = get('cs-uri-stem');
    if (!stem) return null;
    const query = get('cs-uri-query');
    const path =
      query && query !== '-' ? `${stem}?${query.replace(/^\?/, '')}` : stem;
    const ua = get('cs(User-Agent)');
    const referer = get('cs(Referer)');
    // IIS encodes spaces in UA as '+'. Decode for matching.
    const decodedUa = ua && ua !== '-' ? ua.replace(/\+/g, ' ') : null;
    return {
      // Prefer the client IP; fall back to server IP only if absent.
      ip: pick(get('c-ip')) ?? pick(get('s-ip')),
      ts: parseIisTimestamp(get('date'), get('time')),
      method: pick(get('cs-method')),
      path: cleanPath(path),
      status: toInt(get('sc-status')),
      bytes: toInt(get('sc-bytes')),
      userAgent: decodedUa,
      referer: referer && referer !== '-' ? referer : null,
    };
  }
}

function pick(v: string | undefined): string | null {
  return v && v !== '-' ? v : null;
}

/**
 * Custom format driven by a user-supplied named-group regex. Recognised
 * groups: ip, ts, method, path, status, bytes, ua, referer. The `ts`
 * group is parsed by the Apache stamp parser first, then `Date.parse`
 * as a fallback (handles ISO-8601 / RFC-2822).
 */
class CustomParser implements LogParser {
  readonly format: LogFormat = 'custom';
  private re: RegExp | null = null;
  private compileError: string | null = null;

  constructor(pattern: string) {
    try {
      this.re = new RegExp(pattern);
    } catch (err) {
      this.compileError = err instanceof Error ? err.message : String(err);
    }
  }

  feed(raw: string): FeedResult {
    const line = raw.trim();
    if (!line) return null;
    if (line.startsWith('#')) return DIRECTIVE;
    if (!this.re) {
      // Surface the compile error once, then behave as "everything skips".
      if (this.compileError) {
        const e = this.compileError;
        this.compileError = null;
        throw new Error(`Invalid custom log regex: ${e}`);
      }
      return null;
    }
    const m = this.re.exec(line);
    const g = m?.groups;
    if (!g) return null;
    const tsRaw = g['ts'];
    let ts: number | null = null;
    if (tsRaw) {
      ts = parseApacheTimestamp(tsRaw);
      if (ts === null) {
        const p = Date.parse(tsRaw);
        ts = Number.isFinite(p) ? p : null;
      }
    }
    return {
      ip: pick(g['ip']),
      ts,
      method: pick(g['method']),
      path: cleanPath(g['path']),
      status: toInt(g['status']),
      bytes: toInt(g['bytes']),
      userAgent: pick(g['ua']),
      referer: pick(g['referer']),
    };
  }
}
