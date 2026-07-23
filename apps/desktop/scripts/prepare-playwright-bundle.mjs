#!/usr/bin/env node
/**
 * V2 Faz 1 — Optional bundling of Playwright browsers into the
 * installer. Reads `BUNDLE_PLAYWRIGHT=1` from the environment; when
 * set, copies the user's local Playwright cache into
 * `apps/desktop/resources/playwright-browsers/` so electron-builder's
 * `extraResources` rule packs it into the .exe / .dmg / .AppImage.
 *
 * When the env var is NOT set, the resources directory is wiped (or
 * left empty) so the installer stays small (~150 MB instead of ~400
 * MB) and users download the browser on demand via the in-app prompt.
 *
 * Invoke from the desktop workspace BEFORE `electron-builder`:
 *   $env:BUNDLE_PLAYWRIGHT='1'; node scripts/prepare-playwright-bundle.mjs
 *
 * Idempotent: safe to run multiple times.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { cpus, homedir, platform } from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const desktopDir = join(__filename, '..', '..');
const targetDir = join(desktopDir, 'resources', 'playwright-browsers');

function sourceCacheDir() {
  if (platform() === 'win32') {
    return join(
      process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'),
      'ms-playwright',
    );
  }
  if (platform() === 'darwin') {
    return join(homedir(), 'Library', 'Caches', 'ms-playwright');
  }
  return join(homedir(), '.cache', 'ms-playwright');
}

/**
 * Per-platform folder names Playwright looks for inside a
 * `chromium-<rev>` / `chromium_headless_shell-<rev>` directory. These are
 * arch-specific, which is the entire reason this check exists: bundling
 * an `chrome-mac-arm64` build into the Intel .dmg produced an installer
 * that shipped 250 MB of browser the app could never use.
 *
 * `PLAYWRIGHT_HOST_PLATFORM_OVERRIDE` is how CI cross-downloads the
 * Intel browsers on an Apple-silicon runner, so honour it here too.
 */
function expectedFolders() {
  const override = process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE ?? '';
  const isArm = override
    ? override.endsWith('arm64')
    : platform() === 'darwin'
      ? cpus().some((c) => c.model.includes('Apple'))
      : process.arch === 'arm64';
  const os = override
    ? override.startsWith('mac')
      ? 'darwin'
      : override.startsWith('win')
        ? 'win32'
        : 'linux'
    : platform();

  if (os === 'win32') {
    return { chromium: 'chrome-win64', headlessShell: 'chrome-headless-shell-win64' };
  }
  if (os === 'darwin') {
    const arch = isArm ? 'arm64' : 'x64';
    return {
      chromium: `chrome-mac-${arch}`,
      headlessShell: `chrome-headless-shell-mac-${arch}`,
    };
  }
  if (isArm) return { chromium: 'chrome-linux', headlessShell: 'chrome-linux' };
  return { chromium: 'chrome-linux64', headlessShell: 'chrome-headless-shell-linux64' };
}

/** True when `dir` holds a Chromium build for the platform being packaged. */
function hasUsableChromium(dir) {
  const folders = expectedFolders();
  if (!existsSync(dir)) return false;
  const entries = readdirSync(dir);
  const hasFull = entries.some(
    (e) => e.startsWith('chromium-') && existsSync(join(dir, e, folders.chromium)),
  );
  const hasShell = entries.some(
    (e) =>
      e.startsWith('chromium_headless_shell-') &&
      existsSync(join(dir, e, folders.headlessShell)),
  );
  return hasFull && hasShell;
}

if (process.env.BUNDLE_PLAYWRIGHT !== '1') {
  // Bundling disabled — wipe any leftover from a previous build so the
  // small-installer default produces a small file.
  if (existsSync(targetDir)) {
    rmSync(targetDir, { recursive: true, force: true });
  }
  // Create empty dir so electron-builder's `extraResources` glob doesn't
  // error on missing source.
  mkdirSync(targetDir, { recursive: true });
  console.log(
    '[prepare-playwright-bundle] BUNDLE_PLAYWRIGHT not set — skipping (installer will prompt for download).',
  );
  process.exit(0);
}

const src = sourceCacheDir();
if (!existsSync(src)) {
  console.error(
    `[prepare-playwright-bundle] BUNDLE_PLAYWRIGHT=1 but cache directory not found at ${src}.\n` +
      'Run "npm run playwright:install" from the monorepo root first.',
  );
  process.exit(1);
}

const folders = expectedFolders();
if (!hasUsableChromium(src)) {
  console.error(
    `[prepare-playwright-bundle] The cache at ${src} has no Chromium build for the ` +
      `platform being packaged (expected ${folders.chromium} + ${folders.headlessShell}).\n` +
      'Bundling it would ship an installer whose browser this machine cannot launch.\n' +
      'Run "npm run playwright:install" for the target platform first — cross-arch ' +
      'builds need PLAYWRIGHT_HOST_PLATFORM_OVERRIDE set to the target (e.g. mac15).',
  );
  process.exit(1);
}

console.log(`[prepare-playwright-bundle] Copying ${src} → ${targetDir} …`);
rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
// `verbatimSymlinks: true` preserves the symlinks Playwright uses
// inside the macOS .app bundle structure. Without this they'd be
// dereferenced, doubling the on-disk size and breaking the bundle's
// Mach-O loader paths.
cpSync(src, targetDir, { recursive: true, verbatimSymlinks: true });

if (!hasUsableChromium(targetDir)) {
  console.error(
    '[prepare-playwright-bundle] Copy finished but the bundled cache is not usable — aborting ' +
      'rather than publishing an installer whose JS rendering is dead on arrival.',
  );
  process.exit(1);
}
console.log(
  `[prepare-playwright-bundle] Done — bundled ${folders.chromium} + ${folders.headlessShell}.`,
);
