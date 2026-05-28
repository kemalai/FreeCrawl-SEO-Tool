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

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, platform } from 'node:os';
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

console.log(`[prepare-playwright-bundle] Copying ${src} → ${targetDir} …`);
rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
// `verbatimSymlinks: true` preserves the symlinks Playwright uses
// inside the macOS .app bundle structure. Without this they'd be
// dereferenced, doubling the on-disk size and breaking the bundle's
// Mach-O loader paths.
cpSync(src, targetDir, { recursive: true, verbatimSymlinks: true });
console.log('[prepare-playwright-bundle] Done.');
