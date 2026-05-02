import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

/**
 * Locate the desktop app's `default.seoproject` without depending on
 * Electron. The desktop app stores it under
 * `app.getPath('userData')/projects/default.seoproject`, where
 * `userData` resolves per-platform using the same rules Electron uses.
 *
 * The Electron-resolved userData path is:
 *   - Windows: %APPDATA%/<productName>
 *   - macOS:   ~/Library/Application Support/<productName>
 *   - Linux:   $XDG_CONFIG_HOME/<productName> or ~/.config/<productName>
 *
 * `productName` for FreeCrawl is `@freecrawl/desktop` (taken from
 * `apps/desktop/package.json`'s `name` field).
 */

const PRODUCT_NAME = '@freecrawl/desktop';
const PROJECT_FILENAME = 'default.seoproject';

export function defaultProjectPath(): string {
  // Explicit override always wins — handy for headless testing or
  // pointing at a non-default project.
  const override = process.env.FREECRAWL_PROJECT;
  if (override && override.trim().length > 0) return override.trim();

  const home = os.homedir();
  let userData: string;
  if (process.platform === 'win32') {
    userData = path.join(
      process.env.APPDATA ?? path.join(home, 'AppData', 'Roaming'),
      PRODUCT_NAME,
    );
  } else if (process.platform === 'darwin') {
    userData = path.join(home, 'Library', 'Application Support', PRODUCT_NAME);
  } else {
    userData = path.join(
      process.env.XDG_CONFIG_HOME ?? path.join(home, '.config'),
      PRODUCT_NAME,
    );
  }
  return path.join(userData, 'projects', PROJECT_FILENAME);
}

export function listProjectFiles(): string[] {
  const dir = path.dirname(defaultProjectPath());
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.seoproject'))
      .map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}
