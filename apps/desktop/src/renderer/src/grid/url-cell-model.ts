import type { CrawlUrlRow } from '@freecrawl/shared-types';
import type { ColumnSpec } from '../tabs/columns.js';
import { translateLabel } from '../i18n/labels.js';
import { getTheme, subscribeTheme } from '../theme.js';

/**
 * What a URL-grid cell says and how it is painted.
 *
 * The grid body is drawn on a canvas, so a cell has no DOM to carry its
 * text, colour and tooltip — this module is the single description of
 * all three. The clipboard reads {@link cellText} from the same place, so
 * what you copy is what you read.
 *
 * Colours are the Tailwind palette values the DOM cells used, spelled out
 * because a canvas cannot resolve utility classes.
 */

/** The Tailwind palette the grid body paints with — dark theme values. */
const GRID_DARK = {
  /** surface-950 — the body background. */
  background: '#0a0a0a',
  /** surface-900 — row and cell borders. */
  border: '#171717',
  /** surface-900/30 — hovered row. */
  rowHover: 'rgba(23, 23, 23, 0.3)',
  /** surface-800/40 — hovered data cell. */
  cellHover: 'rgba(38, 38, 38, 0.4)',
  /** surface-800/60 — hovered row-number cell. */
  rowNumHover: 'rgba(38, 38, 38, 0.6)',
  /** accent-500/15 — a selected row. */
  rowSelected: 'rgba(37, 99, 235, 0.15)',
  /** accent-500/30 — a selected cell, column or row-number cell. */
  cellSelected: 'rgba(37, 99, 235, 0.3)',
  /** surface-50 — text inside a selected cell. */
  selectedText: '#fafafa',
  /** surface-100 — mono text (URLs). */
  mono: '#f5f5f5',
  /** surface-200 — plain text and numbers. */
  text: '#e5e5e5',
  /** surface-500 — row numbers. */
  rowNum: '#737373',
  /** surface-700 — the "—" / "…" placeholders. */
  placeholder: '#404040',
  /** emerald-400 — Indexable, and the re-crawl change marker. */
  good: '#34d399',
  /** amber-400 — Non-Indexable, and the Robots badge text. */
  warn: '#fbbf24',
  /** The drop shadow at the right edge of the pinned strip. */
  pinnedShadow: 'rgba(0, 0, 0, 0.4)',
} as const;

type GridColors = { -readonly [K in keyof typeof GRID_DARK]: string };

/** The same roles on the mirrored (light) surface scale — see styles.css. */
const GRID_LIGHT: GridColors = {
  background: '#fafafa',
  border: '#e5e5e5',
  rowHover: 'rgba(23, 23, 23, 0.05)',
  cellHover: 'rgba(38, 38, 38, 0.08)',
  rowNumHover: 'rgba(38, 38, 38, 0.12)',
  rowSelected: 'rgba(37, 99, 235, 0.12)',
  cellSelected: 'rgba(37, 99, 235, 0.28)',
  selectedText: '#0a0a0a',
  mono: '#171717',
  text: '#262626',
  rowNum: '#737373',
  placeholder: '#d4d4d4',
  good: '#059669',
  warn: '#d97706',
  pinnedShadow: 'rgba(0, 0, 0, 0.12)',
};

/**
 * The live palette. A plain mutable object rather than a getter so the
 * paint loop reads it as cheaply as before; `applyGridTheme` swaps its
 * fields in place when the theme changes and the canvas repaints.
 */
export const GRID_COLORS: GridColors = { ...GRID_DARK };

/** Badge palettes for the Status column, keyed by what the cell shows. */
const BADGES_DARK = {
  /** 2xx — emerald-900/60 on emerald-300. */
  ok: { bg: 'rgba(6, 78, 59, 0.6)', fg: '#6ee7b7' },
  /** 3xx — amber-900/60 on amber-300. */
  redirect: { bg: 'rgba(120, 53, 15, 0.6)', fg: '#fcd34d' },
  /** 4xx — orange-900/60 on orange-300. */
  clientError: { bg: 'rgba(124, 45, 18, 0.6)', fg: '#fdba74' },
  /** 5xx — red-900/60 on red-300. */
  serverError: { bg: 'rgba(127, 29, 29, 0.6)', fg: '#fca5a5' },
  /** 1xx and anything else — surface-800 on surface-400. */
  other: { bg: '#262626', fg: '#a3a3a3' },
  /** Robots-blocked — surface-800 on amber-400. */
  robots: { bg: '#262626', fg: '#fbbf24' },
  /** No HTTP response — rose-950/60 on rose-300. */
  failure: { bg: 'rgba(76, 5, 25, 0.6)', fg: '#fda4af' },
} as const;

type StatusBadges = { -readonly [K in keyof typeof BADGES_DARK]: { bg: string; fg: string } };

/** Light theme: the -100 tint under the -700 ink of the same hue. */
const BADGES_LIGHT: StatusBadges = {
  ok: { bg: '#d1fae5', fg: '#047857' },
  redirect: { bg: '#fef3c7', fg: '#b45309' },
  clientError: { bg: '#ffedd5', fg: '#c2410c' },
  serverError: { bg: '#fee2e2', fg: '#b91c1c' },
  other: { bg: '#e5e5e5', fg: '#525252' },
  robots: { bg: '#e5e5e5', fg: '#b45309' },
  failure: { bg: '#ffe4e6', fg: '#be123c' },
};

const STATUS_BADGES: StatusBadges = { ...BADGES_DARK };

function applyGridTheme(theme: 'dark' | 'light'): void {
  Object.assign(GRID_COLORS, theme === 'light' ? GRID_LIGHT : GRID_DARK);
  Object.assign(STATUS_BADGES, theme === 'light' ? BADGES_LIGHT : BADGES_DARK);
}

applyGridTheme(getTheme());
subscribeTheme(applyGridTheme);

/** Hover text for the green `*` after a URL that changed since the previous crawl. */
export const CHANGED_MARKER_TITLE = 'Changed since the previous crawl';

/** Tooltip for the Robots status badge. */
export const ROBOTS_STATUS_TITLE = 'Not requested — disallowed by robots.txt';

/** How one cell is painted. */
export type CellPaint =
  /** An absent value — the muted "—". */
  | { kind: 'placeholder' }
  /** A rounded pill with its own background (the Status column). */
  | { kind: 'badge'; text: string; bg: string; fg: string; title: string | null }
  /** Plain text, truncated with an ellipsis when the column is too narrow. */
  | {
      kind: 'text';
      text: string;
      color: string;
      mono: boolean;
      title: string | null;
      /** Append the green `*` re-crawl change marker after the text. */
      marker: boolean;
    };

/** Badge palette for a numeric HTTP status. */
function statusBadge(code: number): { bg: string; fg: string } {
  if (code >= 200 && code < 300) return STATUS_BADGES.ok;
  if (code >= 300 && code < 400) return STATUS_BADGES.redirect;
  if (code >= 400 && code < 500) return STATUS_BADGES.clientError;
  if (code >= 500) return STATUS_BADGES.serverError;
  return STATUS_BADGES.other;
}

/**
 * Describe how `spec`'s cell of `row` is painted — the canvas counterpart
 * of the JSX the DOM grid used to render per cell.
 */
export function cellPaint(row: CrawlUrlRow, spec: ColumnSpec, lang: string): CellPaint {
  if (spec.kind === 'status') {
    const code = row.statusCode;
    // A robots-blocked URL also has no status — but because the crawler
    // chose not to request it, not because the request failed. Painting
    // it in the failure red said "this broke" about a crawl the status
    // bar reports as Failed 0.
    if (
      (code === null || code === undefined) &&
      row.indexability === 'non-indexable:robots-blocked'
    ) {
      return {
        kind: 'badge',
        text: translateLabel('Robots', lang),
        ...STATUS_BADGES.robots,
        title: translateLabel(ROBOTS_STATUS_TITLE, lang),
      };
    }
    // No HTTP status (DNS/TLS/connect/timeout failure): a bare "—" hides
    // the reason the crawler already captured. Show a compact token (DNS /
    // TLS / Timeout / …) with the full error text on hover.
    if (code === null || code === undefined) {
      return {
        kind: 'badge',
        text: shortFailureLabel(row.statusText),
        ...STATUS_BADGES.failure,
        title: row.statusText ?? null,
      };
    }
    return { kind: 'badge', text: String(code), ...statusBadge(code), title: null };
  }

  if (spec.kind === 'indexability') {
    const v = row.indexability;
    return {
      kind: 'text',
      text: translateLabel(v === 'indexable' ? 'Indexable' : 'Non-Indexable', lang),
      color: v === 'indexable' ? GRID_COLORS.good : GRID_COLORS.warn,
      mono: false,
      title: v,
      marker: false,
    };
  }

  if (spec.kind === 'indexability-status') {
    const label = indexabilityStatusLabel(row.indexability);
    if (label === '') return { kind: 'placeholder' };
    const localized = translateLabel(label, lang);
    return {
      kind: 'text',
      text: localized,
      color: GRID_COLORS.text,
      mono: false,
      title: localized,
      marker: false,
    };
  }

  if (spec.kind === 'number') {
    const raw = row[spec.key];
    return {
      kind: 'text',
      text: raw === null || raw === undefined ? '—' : Number(raw).toLocaleString(),
      color: GRID_COLORS.text,
      mono: true,
      title: null,
      marker: false,
    };
  }

  const value = cellText(row, spec, lang);
  if (spec.kind === 'mono') {
    if (value === '' && !(spec.key === 'url' && row.changed)) return { kind: 'placeholder' };
    return {
      kind: 'text',
      text: value,
      color: GRID_COLORS.mono,
      mono: true,
      title: value,
      // Re-crawl change marker. Painted after the (possibly truncated)
      // text so it survives a URL too long for the column — the whole
      // point is that it can be spotted by scanning the list.
      marker: spec.key === 'url' && row.changed,
    };
  }

  if (value === '') return { kind: 'placeholder' };
  return {
    kind: 'text',
    text: value,
    color: GRID_COLORS.text,
    mono: false,
    title: value,
    marker: false,
  };
}

/**
 * Plain-text value of one cell — the clipboard counterpart of
 * {@link cellPaint}, and the single place the two agree on what a cell
 * "says".
 *
 * Two deliberate departures from what's painted on screen, both because
 * the consumer here is a spreadsheet rather than a reader: numbers are
 * emitted unformatted (thousands separators would arrive as text, not a
 * number), and an absent value is emitted as an empty string rather than
 * the "—" placeholder.
 */
export function cellText(row: CrawlUrlRow, spec: ColumnSpec, lang: string): string {
  if (spec.kind === 'status') {
    const code = row.statusCode;
    if (code !== null && code !== undefined) return String(code);
    if (row.indexability === 'non-indexable:robots-blocked') {
      return translateLabel('Robots', lang);
    }
    const label = shortFailureLabel(row.statusText);
    return label === '—' ? '' : label;
  }

  if (spec.kind === 'indexability') {
    return translateLabel(row.indexability === 'indexable' ? 'Indexable' : 'Non-Indexable', lang);
  }

  if (spec.kind === 'indexability-status') {
    const label = indexabilityStatusLabel(row.indexability);
    return label === '' ? '' : translateLabel(label, lang);
  }

  // Custom-extraction column holds a `{ruleName: value}` JSON map. Showing
  // the raw `{"h2":"…"}` in the cell reads as noise — the preview and Detail
  // panel already unwrap it, so match them here (single rule → just the
  // value; multiple → `name: value` pairs). Full JSON stays in the Detail
  // panel and in exports (which format from the DB, not this path).
  if (spec.key === 'extractionResults') {
    const rawEx = row[spec.key];
    if (typeof rawEx !== 'string' || !rawEx) return '';
    if (spec.extractionRule !== undefined) return extractionRuleValue(row, rawEx, spec.extractionRule);
    return formatExtractionCell(rawEx);
  }

  const raw = row[spec.key];
  if (raw === null || raw === undefined) return '';
  // Booleans render as "Y" / blank rather than the JS-default
  // "true"/"false" — matches the compact flag-column convention.
  if (typeof raw === 'boolean') return raw ? 'Y' : '';
  return String(raw);
}

/**
 * Flatten the `extraction_results` `{ruleName: value}` map into one compact
 * line for the table cell. Single rule → the value alone; multiple rules →
 * `name: value` pairs joined by " · ". Arrays (multi: all/concat) join with
 * " | ". Malformed JSON falls back to the raw string so nothing is hidden.
 */
/**
 * Parsed `extractionResults` per row, so a tab with ten per-rule columns
 * parses the JSON once per row rather than once per cell. Rows are the
 * lazy loader's cached objects, hence a WeakMap keyed by identity; the
 * raw string is checked so a re-fetched row with new data re-parses.
 */
const EXTRACTION_CACHE = new WeakMap<
  CrawlUrlRow,
  { raw: string; obj: Record<string, unknown> | null }
>();

function extractionRuleValue(row: CrawlUrlRow, raw: string, rule: string): string {
  let entry = EXTRACTION_CACHE.get(row);
  if (!entry || entry.raw !== raw) {
    let obj: Record<string, unknown> | null = null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        obj = parsed as Record<string, unknown>;
      }
    } catch {
      obj = null;
    }
    entry = { raw, obj };
    EXTRACTION_CACHE.set(row, entry);
  }
  const v = entry.obj?.[rule];
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.map(String).join(' | ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function formatExtractionCell(raw: string): string {
  let obj: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return raw;
    }
    obj = parsed as Record<string, unknown>;
  } catch {
    return raw;
  }
  const fmt = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    if (Array.isArray(v)) return v.map(String).join(' | ');
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };
  const entries = Object.entries(obj);
  if (entries.length === 0) return '';
  if (entries.length === 1) return fmt(entries[0]![1]);
  return entries.map(([name, v]) => `${name}: ${fmt(v)}`).join('  ·  ');
}

export function indexabilityStatusLabel(v: CrawlUrlRow['indexability']): string {
  switch (v) {
    case 'indexable':
      return '';
    case 'non-indexable:noindex':
      return 'noindex';
    case 'non-indexable:canonical':
      return 'Canonicalised';
    case 'non-indexable:robots-blocked':
      return 'Blocked by robots.txt';
    case 'non-indexable:redirect':
      return 'Redirected';
    case 'non-indexable:client-error':
      return 'Client Error';
    case 'non-indexable:server-error':
      return 'Server Error';
    default:
      return v;
  }
}

/**
 * Compact token for a no-HTTP-response failure, derived from the crawler's
 * captured `statusText`. Technical protocol abbreviations (DNS/TLS/H2/…) — not
 * localized, same convention as the numeric status codes themselves. The full
 * diagnostic is on hover (title) and in the URL Details → HTTP Headers tab.
 */
export function shortFailureLabel(statusText: string | null): string {
  if (!statusText) return '—';
  if (/ENOTFOUND|EAI_AGAIN|ENODATA|ESERVFAIL|getaddrinfo|DNS/i.test(statusText)) return 'DNS';
  if (/UNABLE_TO_VERIFY|CERT|SSL|TLSV1|HANDSHAKE|EPROTO/i.test(statusText)) return 'TLS';
  if (/ECONNREFUSED/i.test(statusText)) return 'Refused';
  if (/ECONNRESET|SOCKET|EPIPE|reset/i.test(statusText)) return 'Reset';
  if (/HTTP2|NGHTTP2|GOAWAY|PROTOCOL_ERROR/i.test(statusText)) return 'H2 err';
  if (/CONNECT_TIMEOUT|ETIMEDOUT|HEADERS_TIMEOUT|BODY_TIMEOUT|aborted|timeout/i.test(statusText))
    return 'Timeout';
  return 'Failed';
}
