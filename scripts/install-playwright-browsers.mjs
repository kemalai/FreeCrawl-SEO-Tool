#!/usr/bin/env node
/**
 * V2 Faz 1 — Ensures the Playwright browsers needed for JS rendering
 * are installed on this machine. Runs as `postinstall` so a fresh
 * `npm install` leaves the dev environment ready for JS-mode crawls.
 *
 * Behaviour:
 *  - Skips entirely when `PLAYWRIGHT_SKIP_BROWSER_INSTALL=1` (CI / Docker).
 *  - Checks whether `chromium.executablePath()` resolves to a file on
 *    disk; if so, exits with no work (idempotent).
 *  - Otherwise runs `playwright install chromium chromium-headless-shell`
 *    inheriting stdio so the user sees download progress.
 *
 * Pass `--force` to re-run the install even when the binaries are
 * already present (useful after upgrading Playwright).
 */

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const force = process.argv.includes('--force');

if (process.env.PLAYWRIGHT_SKIP_BROWSER_INSTALL === '1') {
  console.log('[install-playwright] PLAYWRIGHT_SKIP_BROWSER_INSTALL=1 — skipping browser install.');
  process.exit(0);
}

async function main() {
  let chromiumPath = '';
  try {
    const { chromium } = await import('playwright');
    chromiumPath = chromium.executablePath();
  } catch (err) {
    console.warn(
      '[install-playwright] Could not resolve Playwright entry — is the package installed yet?',
      err instanceof Error ? err.message : err,
    );
    process.exit(0);
  }

  const fullBrowserOk = chromiumPath && existsSync(chromiumPath);
  // Headless-shell binary path — derive by swapping the chromium-NNNN
  // directory for chromium_headless_shell-NNNN and the per-platform
  // folder for its headless-shell counterpart. Playwright stores the two
  // as siblings in the cache (same revision, different folder and exe
  // name) but only exposes the full browser through executablePath().
  // Since the move to Chrome-for-Testing builds these folder names are
  // arch-suffixed on macOS and Linux-x64 — matching that exactly is what
  // keeps this check from reporting "missing" on every single run.
  const headlessShellPath = (() => {
    if (!chromiumPath) return '';
    const base = chromiumPath.replace(/chromium-(\d+)/, 'chromium_headless_shell-$1');
    const rules = [
      // Windows: ...\chrome-win64\chrome.exe
      [/chrome-win64[\\/]chrome\.exe$/i, 'chrome-headless-shell-win64\\chrome-headless-shell.exe'],
      // macOS: .../chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/…
      [/chrome-mac-(arm64|x64)[\\/].*$/i, 'chrome-headless-shell-mac-$1/chrome-headless-shell'],
      // Linux x64: .../chrome-linux64/chrome
      [/chrome-linux64[\\/]chrome$/, 'chrome-headless-shell-linux64/chrome-headless-shell'],
      // Linux arm64: Playwright's own build, .../chrome-linux/chrome
      [/chrome-linux[\\/]chrome$/, 'chrome-linux/headless_shell'],
    ];
    for (const [pattern, replacement] of rules) {
      const out = base.replace(pattern, replacement);
      if (out !== base) return out;
    }
    return '';
  })();
  const headlessShellOk = headlessShellPath && existsSync(headlessShellPath);

  if (!force && fullBrowserOk && headlessShellOk) {
    console.log('[install-playwright] Browsers already present — nothing to do.');
    return;
  }

  const missing = [];
  if (!fullBrowserOk) missing.push('chromium');
  if (!headlessShellOk) missing.push('chromium-headless-shell');
  console.log(
    `[install-playwright] Installing browsers — ${
      force ? 'forced re-install' : `missing: ${missing.join(', ')}`
    } …`,
  );
  const result = spawnSync(
    'npx',
    ['playwright', 'install', 'chromium', 'chromium-headless-shell'],
    {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    },
  );
  if (result.status !== 0) {
    console.warn(
      `[install-playwright] Browser install exited with code ${result.status}. ` +
        'JS rendering will not work until this is resolved. Re-run `npm run playwright:install` once your network is back.',
    );
    process.exit(0);
  }
  console.log('[install-playwright] Done.');
}

void main();
