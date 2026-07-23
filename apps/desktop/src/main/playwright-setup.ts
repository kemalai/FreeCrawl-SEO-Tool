/**
 * Playwright browser provisioning for the packaged desktop app.
 *
 * Three jobs, in the order they matter:
 *
 *  1. Decide which browser cache Playwright should read, and publish it
 *     through `PLAYWRIGHT_BROWSERS_PATH` BEFORE anything imports
 *     `playwright` (its registry latches the env var at module-eval
 *     time and never re-reads it). Preference order: the browsers
 *     bundled inside the installer → a writable per-user directory we
 *     download into → whatever Playwright would pick by default.
 *
 *  2. Report whether Chromium is actually usable on THIS machine. The
 *     bundle check is arch-aware on purpose: a release built on an
 *     Apple-silicon runner ships `chrome-mac-arm64`, which an Intel Mac
 *     cannot use, and silently falling back to a download beats
 *     pretending the bundle is fine.
 *
 *  3. Download the browsers when they're missing, WITHOUT `npx`. A
 *     packaged app has neither Node nor npm on its PATH — GUI processes
 *     on macOS inherit a minimal environment, so `spawn('npx', …)` dies
 *     with ENOENT and leaves the user stuck at a dialog telling them to
 *     open a terminal. Instead we re-exec our own Electron binary in
 *     Node mode (`ELECTRON_RUN_AS_NODE`) against Playwright's bundled
 *     CLI, which is always present inside the app bundle.
 */

import { app } from 'electron';
import { spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir, cpus } from 'node:os';
import { dirname, join } from 'node:path';

/** Browsers Playwright must have for JS rendering to work. */
const REQUIRED_BROWSERS = ['chromium', 'chromium-headless-shell'] as const;

/**
 * Playwright's per-platform folder names inside a `chromium-<rev>` /
 * `chromium_headless_shell-<rev>` directory. Mirrors its EXECUTABLE_PATHS
 * table — kept here (rather than asked of Playwright) because this check
 * has to run before `playwright` is loaded.
 */
function platformFolders(): { chromium: string; headlessShell: string } | null {
  if (process.platform === 'win32') {
    return { chromium: 'chrome-win64', headlessShell: 'chrome-headless-shell-win64' };
  }
  if (process.platform === 'darwin') {
    // Playwright picks the mac arch from the CPU model, not process.arch,
    // so an x64 build running under Rosetta still resolves the arm64
    // folder. Matching that exactly is the whole point of this check.
    const arch = cpus().some((c) => c.model.includes('Apple')) ? 'arm64' : 'x64';
    return {
      chromium: `chrome-mac-${arch}`,
      headlessShell: `chrome-headless-shell-mac-${arch}`,
    };
  }
  if (process.platform === 'linux') {
    if (process.arch === 'arm64') {
      // arm64 Linux still uses Playwright's own build, not Chrome-for-Testing.
      return { chromium: 'chrome-linux', headlessShell: 'chrome-linux' };
    }
    return {
      chromium: 'chrome-linux64',
      headlessShell: 'chrome-headless-shell-linux64',
    };
  }
  return null;
}

/**
 * True when `dir` holds a Chromium build this machine can actually run.
 * Both the full browser and the headless shell must be present — a
 * partial cache would launch-fail later with Playwright's ASCII banner.
 */
function dirHasUsableChromium(dir: string): boolean {
  const folders = platformFolders();
  if (!folders || !existsSync(dir)) return false;
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return false;
  }
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

/** Playwright's own default cache location, replicated. */
function defaultCacheDir(): string {
  if (process.platform === 'win32') {
    return join(
      process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'),
      'ms-playwright',
    );
  }
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Caches', 'ms-playwright');
  }
  return join(homedir(), '.cache', 'ms-playwright');
}

/** Browsers shipped inside the installer, if this build has any. */
function bundledDir(): string | null {
  if (!app.isPackaged || typeof process.resourcesPath !== 'string') return null;
  if (!process.resourcesPath) return null;
  return join(process.resourcesPath, 'playwright-browsers');
}

/**
 * Writable download target. Lives under userData so it survives app
 * upgrades and needs no elevation — the app bundle itself is read-only
 * on macOS and under Program Files on Windows.
 */
export function installTargetDir(): string {
  return join(app.getPath('userData'), 'playwright-browsers');
}

/** Set once by {@link setupPlaywrightBrowsersPath}; '' = Playwright default. */
let activeBrowsersPath = '';

/**
 * Pick the browser cache and export it to the environment. Call this as
 * early as possible in main — before the first `import('playwright')`.
 * Returns a short description of the decision for the startup log.
 */
export function setupPlaywrightBrowsersPath(): string {
  // Respect an explicit operator override (enterprise deployments that
  // pre-seed a shared cache) — never second-guess it.
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
    activeBrowsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
    return `using PLAYWRIGHT_BROWSERS_PATH from environment: ${activeBrowsersPath}`;
  }

  const bundled = bundledDir();
  if (bundled && dirHasUsableChromium(bundled)) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = bundled;
    activeBrowsersPath = bundled;
    return `using browsers bundled in the installer: ${bundled}`;
  }

  const target = installTargetDir();
  if (dirHasUsableChromium(target)) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = target;
    activeBrowsersPath = target;
    return `using previously downloaded browsers: ${target}`;
  }

  // Nothing installed yet. A dev machine (or a user who ran the
  // Playwright CLI themselves) has the default cache populated — use it
  // untouched. Otherwise point at the writable directory so the
  // background install and the runtime lookup agree on one location.
  if (dirHasUsableChromium(defaultCacheDir())) {
    activeBrowsersPath = '';
    return `using the default Playwright cache: ${defaultCacheDir()}`;
  }

  process.env.PLAYWRIGHT_BROWSERS_PATH = target;
  activeBrowsersPath = target;
  const why = bundled
    ? 'installer bundle missing or built for another architecture'
    : 'no bundled browsers in this build';
  return `no browsers found (${why}) — will download into ${target}`;
}

/**
 * Cheap, playwright-free installation check against the directory we
 * actually resolved. Safe to call at startup on the main thread.
 */
export function chromiumInstalled(): boolean {
  return dirHasUsableChromium(activeBrowsersPath || defaultCacheDir());
}

/**
 * Absolute path to Playwright's CLI entry point inside the app bundle.
 *
 * `cli.js` isn't listed in the package's `exports` map, so it can't be
 * required by subpath — resolve `package.json` (which is exported) and
 * walk to its sibling. Works inside app.asar; Electron's fs shim reads
 * archived files transparently.
 */
function playwrightCliPath(): string | null {
  const req = createRequire(import.meta.url);
  for (const pkg of ['playwright/package.json', 'playwright-core/package.json']) {
    try {
      const cli = join(dirname(req.resolve(pkg)), 'cli.js');
      if (existsSync(cli)) return cli;
    } catch {
      /* not resolvable from here — try the next candidate */
    }
  }
  return null;
}

export interface BrowserInstallProgress {
  /** 0-100, or null while Playwright is between downloads. */
  percent: number | null;
  /** Human-readable step, e.g. 'Downloading Chromium'. */
  message: string;
}

export type InstallResult =
  | { ok: true }
  | { ok: false; reason: 'no-cli' | 'spawn-failed' | 'exit-code'; detail: string };

let running: Promise<InstallResult> | null = null;
let runningChild: ChildProcess | null = null;

/** True while a download is in flight (so callers don't stack them). */
export function installInProgress(): boolean {
  return running !== null;
}

/**
 * Download Chromium + chrome-headless-shell into the writable cache.
 *
 * Concurrent callers share one download. The child is our own Electron
 * binary running in Node mode, so this works on a machine that has
 * never seen Node, npm or a terminal.
 */
export function installChromiumBrowsers(
  onProgress?: (p: BrowserInstallProgress) => void,
  onLog?: (line: string) => void,
): Promise<InstallResult> {
  if (running) return running;

  running = new Promise<InstallResult>((resolveInstall) => {
    const cli = playwrightCliPath();
    if (!cli) {
      resolveInstall({
        ok: false,
        reason: 'no-cli',
        detail: 'Playwright CLI not found inside the application bundle.',
      });
      return;
    }

    // Downloads must land somewhere writable. When the resolved path is
    // still the read-only installer bundle (partial cache) redirect the
    // install — and the subsequent lookup — to userData.
    let target = activeBrowsersPath;
    const bundled = bundledDir();
    if (!target || (bundled && target === bundled)) {
      target = installTargetDir();
      process.env.PLAYWRIGHT_BROWSERS_PATH = target;
      activeBrowsersPath = target;
    }
    try {
      mkdirSync(target, { recursive: true });
    } catch {
      /* creation also happens inside Playwright — ignore and let it report */
    }

    const child = spawn(process.execPath, [cli, 'install', ...REQUIRED_BROWSERS], {
      env: {
        ...process.env,
        // Turns the Electron binary into a plain Node runtime instead of
        // launching a second copy of the app.
        ELECTRON_RUN_AS_NODE: '1',
        PLAYWRIGHT_BROWSERS_PATH: target,
      },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    runningChild = child;

    let stderr = '';
    const handleChunk = (chunk: Buffer): void => {
      for (const raw of chunk.toString().split('\n')) {
        const line = raw.trim();
        if (!line) continue;
        onLog?.(line);
        // Playwright renders an ASCII progress bar: "|███   | 42% of 158 MiB"
        const pct = /(\d{1,3})%/.exec(line);
        if (pct?.[1]) {
          onProgress?.({ percent: Math.min(100, Number(pct[1])), message: 'download' });
        } else if (/^Downloading/i.test(line)) {
          onProgress?.({ percent: null, message: line });
        }
      }
    };
    child.stdout?.on('data', handleChunk);
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
      // Playwright writes its progress bar to stderr on some platforms.
      handleChunk(chunk);
    });

    child.on('error', (err) => {
      resolveInstall({ ok: false, reason: 'spawn-failed', detail: err.message });
    });
    child.on('close', (code) => {
      if (code === 0 && chromiumInstalled()) {
        resolveInstall({ ok: true });
        return;
      }
      resolveInstall({
        ok: false,
        reason: 'exit-code',
        detail:
          code === 0
            ? 'Playwright reported success but no usable Chromium is on disk.'
            : `Playwright install exited with code ${code}. ${stderr.slice(-400)}`.trim(),
      });
    });
  }).finally(() => {
    running = null;
    runningChild = null;
  });

  return running;
}

/** Kill an in-flight download (app shutdown). */
export function abortChromiumInstall(): void {
  runningChild?.kill();
}
