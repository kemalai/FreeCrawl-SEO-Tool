/**
 * Export file-name patterns (Settings → Storage → Export file names).
 *
 * A pattern is plain text with tokens the export fills in, so a user who
 * exports the same reports every week gets `example.com_2026-11-03_internal`
 * instead of overwriting `freecrawl-export.csv`. The default reproduces the
 * names the app always used.
 */

export const DEFAULT_EXPORT_FILENAME_PATTERN = 'freecrawl-{report}';

/** Tokens a pattern may use, in the order the settings panel lists them. */
export const EXPORT_FILENAME_TOKENS = [
  '{report}',
  '{date}',
  '{time}',
  '{datetime}',
  '{domain}',
  '{project}',
] as const;

export interface ExportFilenameContext {
  /** What is exported: `export`, `images`, `report`, a tab name… */
  report: string;
  /** Start URL (or any URL) of the crawl; its host becomes `{domain}`. */
  url?: string | null;
  /** Project name; `{project}` falls back to the domain, then `crawl`. */
  project?: string | null;
  date?: Date;
}

const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * Characters Windows rejects in a file name (`\ / : * ? " < > |`) and
 * control characters become `-`; leading / trailing dots and spaces are
 * trimmed (invalid on Windows too). Applied to every token value and to the
 * result, so the name is safe on all three platforms.
 */
function sanitizeFilePart(raw: string): string {
  return Array.from(raw)
    .map((ch) => (ch.codePointAt(0)! < 0x20 || '\\/:*?"<>|'.includes(ch) ? '-' : ch))
    .join('')
    .replace(/^[\s.]+|[\s.]+$/g, '');
}

function hostOf(url: string | null | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

/**
 * The file name (without extension) a pattern produces. Unknown `{tokens}`
 * are left as typed, so a typo is visible in the preview instead of
 * silently disappearing. An empty result falls back to the report name.
 * Capped at 120 characters so the full path stays clear of Windows' 260.
 */
export function applyExportFilenamePattern(
  pattern: string | null | undefined,
  ctx: ExportFilenameContext,
): string {
  const date = ctx.date ?? new Date();
  const ymd = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const hms = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
  const domain = hostOf(ctx.url);
  const values: Record<string, string> = {
    '{report}': ctx.report,
    '{date}': ymd,
    '{time}': hms,
    '{datetime}': `${ymd}_${hms}`,
    '{domain}': domain,
    '{project}': (ctx.project ?? '').trim() || domain || 'crawl',
  };
  const source = (pattern ?? '').trim() || DEFAULT_EXPORT_FILENAME_PATTERN;
  const filled = source.replace(/\{[a-z]+\}/g, (token) =>
    token in values ? sanitizeFilePart(values[token]!) : token,
  );
  const name = sanitizeFilePart(filled)
    // Tokens that came out empty leave doubled separators behind.
    .replace(/([-_ .])\1+/g, '$1')
    .replace(/^[-_ ]+|[-_ ]+$/g, '')
    .slice(0, 120);
  return name || sanitizeFilePart(ctx.report) || 'export';
}
