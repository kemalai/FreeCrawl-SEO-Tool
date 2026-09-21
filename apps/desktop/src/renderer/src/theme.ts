import { normalizeUiTheme, type UiTheme } from '@freecrawl/shared-types';

/**
 * Renderer side of the colour theme.
 *
 * Imported by `main.tsx` right after `i18n` so `<html data-theme>` is set
 * before React mounts — every window (project, Logs, Visualization, Log
 * Analyzer) loads the same bundle, so all of them pick the theme up here.
 *
 * The main process is the source of truth: a change made anywhere (the
 * View ▸ Theme menu, Settings ▸ Theme in any window) lands in the
 * `uiTheme` pref, and main fans it back out to every window through
 * `onThemeChanged`. `setTheme` applies locally first so the click feels
 * instant, then persists; the echo from main is a no-op.
 */
type Listener = (theme: UiTheme) => void;
const listeners = new Set<Listener>();
let current: UiTheme = 'dark';

export function getTheme(): UiTheme {
  return current;
}

/** Notified after `<html data-theme>` changes. Returns the unsubscribe. */
export function subscribeTheme(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function apply(theme: UiTheme): void {
  current = theme;
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.dataset['theme'] = theme;
    // Native form controls and scrollbars follow the page, not the OS.
    root.style.colorScheme = theme;
  }
  for (const l of listeners) l(theme);
}

export function resolveInitialTheme(): UiTheme {
  try {
    return normalizeUiTheme(window.freecrawl.prefsGet('uiTheme'));
  } catch {
    /* preload not ready yet — dark is the floor */
    return 'dark';
  }
}

export function setTheme(theme: UiTheme): void {
  if (theme === current) return;
  apply(theme);
  try {
    window.freecrawl.prefsSet('uiTheme', theme);
  } catch {
    /* ignore */
  }
}

apply(resolveInitialTheme());

try {
  window.freecrawl.onThemeChanged((theme) => {
    if (theme !== current) apply(theme);
  });
} catch {
  /* preload not ready — the pref read above already applied the theme */
}
