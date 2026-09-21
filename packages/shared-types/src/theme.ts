/**
 * UI colour theme — the `uiTheme` app preference.
 *
 * Lives in shared-types so the main process (native menu radio, window
 * background, `nativeTheme`) and the renderer (`<html data-theme>`, the
 * canvas grid palette) resolve the pref exactly the same way. Dark is the
 * default and the fallback for any unknown stored value, so a pref written
 * by a future version never leaves a window unthemed.
 */
export const UI_THEMES = ['dark', 'light'] as const;
export type UiTheme = (typeof UI_THEMES)[number];

export const DEFAULT_UI_THEME: UiTheme = 'dark';

export function isUiTheme(v: unknown): v is UiTheme {
  return typeof v === 'string' && (UI_THEMES as readonly string[]).includes(v);
}

/** Stored pref value → theme, with dark as the floor for anything else. */
export function normalizeUiTheme(v: unknown): UiTheme {
  return isUiTheme(v) ? v : DEFAULT_UI_THEME;
}

/**
 * The `surface-950` page background per theme, as a hex the main process
 * hands to `BrowserWindow({ backgroundColor })` so a new window does not
 * flash the opposite shade before the renderer paints.
 */
export const UI_THEME_BACKGROUND: Record<UiTheme, string> = {
  dark: '#0a0a0a',
  light: '#fafafa',
};

/**
 * `autoSaveEveryUrls` app pref — while a crawl runs, the open `.seoproject`
 * is re-snapshotted every time this many more URLs have been crawled.
 * 0 (the default) turns it off. Each save is a full `VACUUM INTO` of the
 * working database, so the floor keeps a mistyped "5" from re-packing a
 * multi-gigabyte project every few seconds.
 */
export const AUTO_SAVE_MIN_URLS = 100;

/** Stored pref value → interval in URLs, or 0 when off / invalid / too small. */
export function normalizeAutoSaveEveryUrls(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return 0;
  const whole = Math.floor(n);
  return whole >= AUTO_SAVE_MIN_URLS ? whole : 0;
}
