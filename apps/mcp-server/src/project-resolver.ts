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

/**
 * Resolve the Electron `userData` directory the desktop app uses. The
 * MCP bridge's discovery file (`mcp-bridge.json`) lives here too, so
 * the bridge client re-uses this helper rather than duplicating the
 * per-platform logic.
 */
export function userDataDir(): string {
  const home = os.homedir();
  if (process.platform === 'win32') {
    return path.join(
      process.env.APPDATA ?? path.join(home, 'AppData', 'Roaming'),
      PRODUCT_NAME,
    );
  }
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', PRODUCT_NAME);
  }
  return path.join(
    process.env.XDG_CONFIG_HOME ?? path.join(home, '.config'),
    PRODUCT_NAME,
  );
}

export function defaultProjectPath(): string {
  // Explicit override always wins — handy for headless testing or
  // pointing at a non-default project.
  const override = process.env.FREECRAWL_PROJECT;
  if (override && override.trim().length > 0) return override.trim();
  return path.join(userDataDir(), 'projects', PROJECT_FILENAME);
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
