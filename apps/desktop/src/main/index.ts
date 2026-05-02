import {
  app,
  BrowserWindow,
  clipboard,
  ipcMain,
  dialog,
  Menu,
  Notification,
  shell,
  type MenuItemConstructorOptions,
} from 'electron';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import {
  DEFAULT_CRAWL_CONFIG,
  IPC,
  type ConfirmClearResult,
  type CrawlConfig,
  type CrawlProgress,
  type CrawlSummary,
  type ExportCsvInput,
  type ExportCsvResult,
  type ExportJsonInput,
  type ExportJsonResult,
  type ExportXmlInput,
  type ExportXmlResult,
  type DataDeleteByDomainInput,
  type DataDeleteByDomainResult,
  type CrashRecoveryStatus,
  type ExportHtmlReportInput,
  type ExportHtmlReportResult,
  type BulkExportFile,
  type BulkExportResult,
  type UrlCategory,
  type CompareLoadInput,
  type CompareLoadResult,
  type GraphSnapshotInput,
  type GraphSnapshotResult,
  type AnchorTextRow,
  type RobotsTestInput,
  type SitemapValidateInput,
  type SitemapValidateResult,
  type TopUrlsInput,
  type TopUrlsRow,
  type ExternalDomainHealthRow,
  type AnalyticsCoverageRow,
  type LinkPositionRow,
  type ImageWeightRow,
  type BucketHistogramRow,
  type ServerHeaderRow,
  type WordCountPerDirectoryInput,
  type WordCountPerDirectoryRow,
  type SitemapOrphanRow,
  type SettingsExportInput,
  type SettingsExportResult,
  type SettingsImportResult,
  type PagesPerDirectoryInput,
  type ImagesQueryInput,
  type ImagesQueryResult,
  type BrokenLinksQueryInput,
  type BrokenLinksQueryResult,
  type OverviewCounts,
  type SitemapGenerateInput,
  type SitemapGenerateResult,
  type UrlBulkContextMenuInput,
  type UrlContextMenuInput,
  type UrlDetail,
  type UrlDetailInput,
  type UrlSourceInput,
  type UrlSourceResult,
  type UrlPageImagesInput,
  type UrlPageImagesResult,
  type UrlCertInfoInput,
  type UrlCertInfoResult,
  type UrlsQueryInput,
  type UrlsQueryResult,
} from '@freecrawl/shared-types';
import {
  Crawler,
  exportUrlsToCsv,
  exportUrlsToJson,
  exportUrlsToXml,
  exportSitemap,
  exportHtmlReport,
  compareCrawls,
  testUrlAgainstRobots,
  fetchSitemaps,
  validateSitemap,
} from '@freecrawl/core';
import { ProjectDb } from '@freecrawl/db';
import { buildAppMenu } from './menu.js';
import * as logger from './logger.js';
import { dbReaderPool, callReaderOrFallback } from './db-reader-pool.js';
import { dbWriterPool } from './db-writer-pool.js';
import { freezeWatchdog } from './freeze-watchdog.js';
import { parserPool } from './parser-pool.js';
import { parseHtml as inlineParseHtml } from '@freecrawl/core';
import type { ProjectDb as ProjectDbType } from '@freecrawl/db';

const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let logsWindow: BrowserWindow | null = null;
let db: ProjectDb | null = null;
let activeCrawler: Crawler | null = null;
/** Most-recent CrawlConfig — needed by the crash-recovery resume
 * flow so we can re-create the Crawler with the same knobs the user
 * had set, without re-prompting. Hydrated lazily from `project_meta`
 * on first DB open. */
let lastCrawlConfig: CrawlConfig | null = null;
/** In-memory snapshot of the previous session's checkpoint, captured
 * before `db.reset()` wipes it. Cleared once the user accepts or
 * discards the recovery prompt. */
let pendingRecoveryCheckpoint: { url: string; depth: number; seedUrl: string }[] = [];

// UI preferences (column widths, panel sizes, etc.) live in a JSON file
// under userData — separate from the crawl DB so "Clear" wipes crawl data
// without losing layout.
let prefsCache: Record<string, unknown> = {};
let prefsLoaded = false;
let prefsWriteTimer: NodeJS.Timeout | null = null;

function prefsFilePath(): string {
  return join(app.getPath('userData'), 'preferences.json');
}

function loadPrefs(): void {
  if (prefsLoaded) return;
  const path = prefsFilePath();
  try {
    if (existsSync(path)) {
      const raw = readFileSync(path, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        prefsCache = parsed as Record<string, unknown>;
      }
    }
  } catch {
    // Corrupted prefs file — start fresh rather than crashing the app.
    prefsCache = {};
  }
  prefsLoaded = true;
}

function schedulePrefsWrite(): void {
  if (prefsWriteTimer) clearTimeout(prefsWriteTimer);
  prefsWriteTimer = setTimeout(() => {
    prefsWriteTimer = null;
    try {
      writeFileSync(prefsFilePath(), JSON.stringify(prefsCache, null, 2), 'utf8');
    } catch {
      // ignore — best-effort persistence
    }
  }, 250);
}

function flushPrefs(): void {
  if (prefsWriteTimer) {
    clearTimeout(prefsWriteTimer);
    prefsWriteTimer = null;
  }
  try {
    writeFileSync(prefsFilePath(), JSON.stringify(prefsCache, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

function fireDataChanged(): void {
  mainWindow?.webContents.send(IPC.dataChanged);
}

/**
 * Per-app-session set of diagnostic categories already surfaced in a
 * popup. Cleared when the user starts a fresh crawl so re-running after
 * fixing the issue can show the dialog again if it recurs.
 */
const shownDiagnosticDialogs = new Set<string>();

interface DiagnosticDialog {
  key: string;
  title: string;
  message: string;
  detail: string;
}

/**
 * Match a crawler error string against environment-issue patterns and
 * return a user-facing dialog spec, or null when the error is site-
 * specific (404 / WAF block / timeout) and shouldn't pop a modal.
 */
function categorizeDiagnostic(msg: string): DiagnosticDialog | null {
  // Note: FreeCrawl now auto-bypasses broken DNS via a 3-tier cascade
  // (OS → public DNS UDP → DNS-over-HTTPS on port 443). Users almost
  // never see these dialogs in normal operation. This dialog only fires
  // when ALL THREE tiers failed — so the diagnosis is "internet is down
  // or the antivirus / firewall is blocking every form of outbound
  // traffic", not "restart Windows DNS Client".
  if (/\bquery(A|AAAA|Soa|Srv|Mx|Txt|Ns|Cname|Any|Naptr|Ptr)\b/i.test(msg) && /ECONNREFUSED/.test(msg)) {
    return {
      key: 'dns-refused',
      title: 'No Network Connectivity',
      message: 'FreeCrawl tried 3 layers of DNS lookup (system, public servers on port 53, and DNS-over-HTTPS on port 443) — every one was refused. Your machine appears to have no working internet connection.',
      detail:
        'FreeCrawl already attempts to bypass broken system DNS automatically — if you see this dialog, even DNS-over-HTTPS over port 443 failed.\n\n' +
        'Most likely causes (in order):\n' +
        '  1. Antivirus / endpoint security is blocking FreeCrawl from making ANY outbound connection. Whitelist FreeCrawl in your security software.\n' +
        '  2. You are not connected to the internet — check Wi-Fi / Ethernet.\n' +
        '  3. A corporate firewall is blocking all outbound traffic — set HTTPS_PROXY in Settings → Network.\n' +
        '  4. Active VPN is in a broken state — disconnect and try again.\n\n' +
        'Click "Open Logs" to see the full error chain.',
    };
  }
  if (/EDESTRUCTION/.test(msg)) {
    return {
      key: 'dns-destroyed',
      title: 'Network Stack Unresponsive',
      message:
        "Your system's DNS resolver crashed AND FreeCrawl's automatic DNS-over-HTTPS bypass also failed. This means the network stack is in a broken state — not just DNS.",
      detail:
        'FreeCrawl normally recovers from a crashed Windows DNS Client by routing lookups through Cloudflare/Google over HTTPS:443. If you are seeing this dialog, that fallback also failed — usually because the operating-system network stack itself needs a reset.\n\n' +
        'Try one of these (in order of effort):\n' +
        '  1. Toggle airplane mode / disconnect & reconnect Wi-Fi.\n' +
        '  2. Restart the network adapter (Settings → Network → Change adapter options).\n' +
        '  3. Open "services.msc", find "DNS Client", right-click → Restart (Windows only).\n' +
        '  4. As a last resort, restart the computer.\n\n' +
        'Click "Open Logs" to see the full error chain.',
    };
  }
  if (/UNABLE_TO_GET_ISSUER_CERT_LOCALLY|SELF_SIGNED_CERT_IN_CHAIN|UNABLE_TO_VERIFY_LEAF_SIGNATURE|DEPTH_ZERO_SELF_SIGNED_CERT/.test(msg)) {
    return {
      key: 'tls-inspection',
      title: 'TLS Certificate Rejected',
      message: 'A TLS certificate failed verification — usually because antivirus or a corporate proxy is intercepting HTTPS.',
      detail:
        'Common culprits: Kaspersky, ESET, Bitdefender, Zscaler, BlueCoat, Fortigate.\n\n' +
        'Try one of these:\n' +
        '  1. Whitelist FreeCrawl in your antivirus.\n' +
        '  2. Export the antivirus / proxy root CA as PEM and set the NODE_EXTRA_CA_CERTS environment variable to it before launching.\n' +
        '  3. Temporarily disable HTTPS scanning in your antivirus.\n\n' +
        'Click "Open Logs" to see the full error chain.',
    };
  }
  if (/Invalid start URL/.test(msg)) {
    return {
      key: 'seed-unreachable',
      title: 'Start URL Unreachable',
      message: 'FreeCrawl could not reach the URL you entered — neither HTTPS nor HTTP responded within 5 seconds.',
      detail:
        'Try one of these:\n' +
        '  1. Open the URL in a browser to confirm the site is up.\n' +
        '  2. Check your internet connection.\n' +
        '  3. If you are on a VPN or behind a corporate proxy, set HTTPS_PROXY before launching, or configure Settings → Network → Proxy URL.\n' +
        '  4. Verify the URL is spelled correctly (typos in the host).\n\n' +
        'Click "Open Logs" for the diagnostic trail.',
    };
  }
  return null;
}

function diagnosticDialogPrefKey(key: string): string {
  return `skipDiag:${key}`;
}

function isDontShowAgain(key: string): boolean {
  loadPrefs();
  return prefsCache[diagnosticDialogPrefKey(key)] === true;
}

/**
 * Modal dialog with "Open Logs" / "Dismiss" actions and a "Don't show
 * again" checkbox that persists to user prefs (per-diagnostic-key, so
 * dismissing the DNS dialog doesn't suppress TLS warnings).
 */
function showDiagnosticDialog(diag: DiagnosticDialog): void {
  const win = mainWindow;
  if (!win) return;
  void dialog
    .showMessageBox(win, {
      type: 'warning',
      title: diag.title,
      message: diag.message,
      detail: diag.detail,
      buttons: ['Open Logs', 'Dismiss'],
      defaultId: 0,
      cancelId: 1,
      checkboxLabel: "Don't show this again",
      checkboxChecked: false,
      noLink: true,
    })
    .then((res) => {
      if (res.checkboxChecked) {
        loadPrefs();
        prefsCache[diagnosticDialogPrefKey(diag.key)] = true;
        schedulePrefsWrite();
      }
      if (res.response === 0) openLogsWindow();
    });
}

function maybeShowDiagnosticDialog(msg: string): void {
  const diag = categorizeDiagnostic(msg);
  if (!diag) return;
  if (shownDiagnosticDialogs.has(diag.key)) return;
  if (isDontShowAgain(diag.key)) return;
  shownDiagnosticDialogs.add(diag.key);
  showDiagnosticDialog(diag);
}

/** Currently-open project file path (empty when using the default scratch DB). */
let currentProjectPath = '';

/**
 * Dispatch HTML parsing to the worker pool when ready, otherwise
 * fall back to the inline parser on the main thread. This wrapper is
 * passed into every `new Crawler(...)` call so the same code path
 * gets pool acceleration in the desktop app and stays simple in
 * tests / headless contexts.
 */
async function parseHtmlViaPool(
  html: string,
  pageUrl: string,
  opts: Parameters<typeof inlineParseHtml>[2],
): Promise<ReturnType<typeof inlineParseHtml>> {
  if (!parserPool.isReady()) {
    return inlineParseHtml(html, pageUrl, opts);
  }
  try {
    return await parserPool.parse(html, pageUrl, opts);
  } catch (err) {
    logger.log(
      'warn',
      'main',
      `parser-pool dispatch failed (${
        err instanceof Error ? err.message : String(err)
      }) — using inline parseHtml as fallback.`,
    );
    return inlineParseHtml(html, pageUrl, opts);
  }
}

/**
 * Dispatch a per-URL write batch to the writer worker. Same fall-back
 * pattern as the parser pool: when the worker is unhealthy we run
 * the write on the main-thread `ProjectDb` instance so the crawl
 * never silently drops data.
 */
async function writeFetchedUrlViaPool(
  payload: Parameters<ProjectDbType['writeFetchedUrl']>[0],
): Promise<{ urlId: number }> {
  if (!dbWriterPool.isReady()) {
    return getDb().writeFetchedUrl(payload);
  }
  try {
    return await dbWriterPool.call<{ urlId: number }>('writeFetchedUrl', [payload]);
  } catch (err) {
    logger.log(
      'warn',
      'main',
      `db-writer dispatch failed (${
        err instanceof Error ? err.message : String(err)
      }) — falling back to main-thread writeFetchedUrl.`,
    );
    return getDb().writeFetchedUrl(payload);
  }
}

function getDb(): ProjectDb {
  if (!db) {
    const dataDir = join(app.getPath('userData'), 'projects');
    mkdirSync(dataDir, { recursive: true });
    const defaultPath = join(dataDir, 'default.seoproject');
    db = new ProjectDb(defaultPath);
    currentProjectPath = '';
    // Wave 6 — Snapshot the previous session's crash-recovery state
    // BEFORE the reset wipes the project tables. We capture the
    // checkpointed pending queue + the cached crawl config so the
    // user can be offered a resume on app start. The DB tables go
    // back to empty after `reset()`; the in-memory snapshot stays
    // until the user accepts/discards the recovery prompt.
    try {
      const raw = db.getMeta('lastCrawlConfig');
      if (raw) lastCrawlConfig = JSON.parse(raw) as CrawlConfig;
    } catch {
      /* malformed JSON or missing key — recovery just won't fire */
    }
    pendingRecoveryCheckpoint = (() => {
      try {
        return db.loadQueueCheckpoint();
      } catch {
        return [];
      }
    })();
    // Fresh start on every app launch — clear any data carried over from
    // the previous session. Explicit Save Project will be added later.
    db.reset();
    // Spawn the read-only worker pointed at the same file. Migrations
    // already ran above (the writer owns them) so the worker just
    // attaches to the WAL and starts serving SELECTs concurrently.
    try {
      // Pass the freeze-watchdog SAB so the reader worker can publish
      // its own heartbeat + current op into the same diagnostic file.
      dbReaderPool.init(defaultPath, freezeWatchdog.sharedBuffer);
    } catch (err) {
      logger.log(
        'warn',
        'main',
        `db-reader pool init failed: ${err instanceof Error ? err.message : String(err)} — falling back to main-thread queries.`,
      );
    }
    try {
      dbWriterPool.init(defaultPath, freezeWatchdog.sharedBuffer);
    } catch (err) {
      logger.log(
        'warn',
        'main',
        `db-writer pool init failed: ${err instanceof Error ? err.message : String(err)} — writes fall back to main thread.`,
      );
    }
  }
  return db;
}

/**
 * Swap the active DB to an existing `.seoproject` file. Stops any running
 * crawl, closes the previous DB, and broadcasts `dataChanged` so the
 * renderer reloads its views. Used by File → Open Recent and Open Project.
 */
function openProjectAtPath(filePath: string): void {
  if (activeCrawler) {
    activeCrawler.stop();
    activeCrawler = null;
  }
  if (db) {
    try {
      db.close();
    } catch {
      // best-effort; new DB will replace it regardless
    }
    db = null;
  }
  db = new ProjectDb(filePath);
  currentProjectPath = filePath;
  // Re-point the read-only worker at the new file. `swap` cancels any
  // in-flight requests with `reader-swapped`; the next IPC call will
  // hit the freshly opened worker.
  try {
    dbReaderPool.swap(filePath, freezeWatchdog.sharedBuffer);
  } catch (err) {
    logger.log(
      'warn',
      'main',
      `db-reader pool swap failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  try {
    dbWriterPool.swap(filePath, freezeWatchdog.sharedBuffer);
  } catch (err) {
    logger.log(
      'warn',
      'main',
      `db-writer pool swap failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  pushRecentProject(filePath);
  rebuildMenu();
  if (mainWindow) {
    mainWindow.setTitle(`FreeCrawl SEO Tool v${app.getVersion()} — ${filePath}`);
  }
  fireDataChanged();
}

function getRecentProjects(): string[] {
  const raw = prefsCache['recentProjects'];
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is string => typeof p === 'string' && p.length > 0).slice(0, 10);
}

function pushRecentProject(filePath: string): void {
  const list = getRecentProjects().filter((p) => p !== filePath);
  list.unshift(filePath);
  prefsCache['recentProjects'] = list.slice(0, 10);
  schedulePrefsWrite();
}

function clearRecentProjects(): void {
  prefsCache['recentProjects'] = [];
  schedulePrefsWrite();
  rebuildMenu();
}

function rebuildMenu(): void {
  Menu.setApplicationMenu(
    buildAppMenu({
      onOpenLogs: openLogsWindow,
      onOpenProject: () => void promptOpenProject(),
      onOpenRecent: (path) => {
        try {
          openProjectAtPath(path);
        } catch (err) {
          dialog.showErrorBox(
            'Open Project Failed',
            `Could not open ${path}.\n\n${(err as Error).message}`,
          );
          // Drop the bad entry so it doesn't keep failing.
          const list = getRecentProjects().filter((p) => p !== path);
          prefsCache['recentProjects'] = list;
          schedulePrefsWrite();
          rebuildMenu();
        }
      },
      onClearRecent: () => clearRecentProjects(),
      recentProjects: getRecentProjects(),
      onResetDiagnosticDialogs: () => resetDiagnosticDialogs(),
      onOpenLogsFolder: () => openLogsFolder(),
    }),
  );
}

/**
 * Reveal the on-disk logs directory in the OS file manager. Falls back
 * to a dialog with the path if the directory hasn't been created yet
 * (e.g. running in a sandbox where userData is read-only).
 */
function openLogsFolder(): void {
  const dir = logger.getLogsDirectory();
  if (!dir) {
    if (mainWindow) {
      void dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Logs Folder Unavailable',
        message: 'Disk logging has not been initialised. Logs are kept in memory only for this session.',
        buttons: ['OK'],
        noLink: true,
      });
    }
    return;
  }
  void shell.openPath(dir);
}

/**
 * Wipe every `skipDiag:*` flag from the prefs so dismissed-with-checkbox
 * diagnostic popups can fire again. Logs a single line so the user gets
 * confirmation in the log panel.
 */
function resetDiagnosticDialogs(): void {
  loadPrefs();
  let removed = 0;
  for (const k of Object.keys(prefsCache)) {
    if (k.startsWith('skipDiag:')) {
      delete prefsCache[k];
      removed++;
    }
  }
  shownDiagnosticDialogs.clear();
  if (removed > 0) schedulePrefsWrite();
  logger.log(
    'info',
    'main',
    `Diagnostic warnings reset (${removed} suppressed dialog${removed === 1 ? '' : 's'} re-enabled).`,
  );
  if (mainWindow) {
    void dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Diagnostic Warnings Reset',
      message:
        removed === 0
          ? 'No suppressed diagnostic warnings to reset.'
          : `Re-enabled ${removed} previously dismissed warning${removed === 1 ? '' : 's'}. They will pop up again the next time the underlying issue occurs.`,
      buttons: ['OK'],
      noLink: true,
    });
  }
}

async function promptOpenProject(): Promise<void> {
  if (!mainWindow) return;
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Project',
    properties: ['openFile'],
    filters: [
      { name: 'FreeCrawl Project', extensions: ['seoproject', 'sqlite', 'db'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (res.canceled || res.filePaths.length === 0) return;
  try {
    openProjectAtPath(res.filePaths[0]!);
  } catch (err) {
    dialog.showErrorBox(
      'Open Project Failed',
      `Could not open the selected file.\n\n${(err as Error).message}`,
    );
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    autoHideMenuBar: false,
    backgroundColor: '#0a0a0a',
    title: `FreeCrawl SEO Tool v${app.getVersion()}`,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => mainWindow?.show());

  // Keep the versioned title — prevent the renderer's <title> from overriding it.
  mainWindow.on('page-title-updated', (e) => e.preventDefault());

  // ESC exits fullscreen (matches the F11-toggle pairing on Windows and
  // the macOS native behaviour). Same handler also swallows the default
  // Electron dev-tools shortcuts (F12 + Ctrl/Cmd+Shift+I + Ctrl/Cmd+Alt+I)
  // so users can't open the inspector — productisation choice, not a
  // security one (renderer is sandboxed regardless).
  mainWindow.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'Escape' && mainWindow?.isFullScreen()) {
      mainWindow.setFullScreen(false);
      return;
    }
    const key = input.key.toLowerCase();
    const mod = input.control || input.meta;
    const isF12 = key === 'f12';
    const isCtrlShiftI = mod && input.shift && key === 'i';
    const isCtrlAltI = mod && input.alt && key === 'i';
    const isCtrlShiftJ = mod && input.shift && key === 'j';
    const isCtrlShiftC = mod && input.shift && key === 'c';
    if (isF12 || isCtrlShiftI || isCtrlAltI || isCtrlShiftJ || isCtrlShiftC) {
      e.preventDefault();
    }
  });

  // Belt-and-braces: if anything else (extension, programmatic call) tries
  // to open dev tools, slam them shut immediately.
  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow?.webContents.closeDevTools();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

/**
 * Open (or focus) the Logs popup window. Loads the same renderer bundle
 * with `?logs=1` so the renderer entry branches to the LogsView component.
 * Single-instance — re-invocations focus the existing window.
 */
function openLogsWindow(): void {
  if (logsWindow && !logsWindow.isDestroyed()) {
    logsWindow.show();
    logsWindow.focus();
    return;
  }
  const win = new BrowserWindow({
    width: 1000,
    height: 640,
    minWidth: 560,
    minHeight: 320,
    show: false,
    backgroundColor: '#0a0a0a',
    title: 'FreeCrawl — Logs',
    // Intentionally NOT a child of mainWindow — `parent: mainWindow`
    // links the two windows in the OS compositor (DWM on Windows) so
    // that when the main process is busy doing post-crawl recompute /
    // SQL aggregates, the Logs window's frame production stalls along
    // with mainWindow's, causing the user-visible "totally frozen"
    // state right after a crawl finishes. Standalone window dispatches
    // its frames independently.
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      // Don't slow the renderer's frame loop just because the window
      // briefly loses focus during a drag.
      backgroundThrottling: false,
    },
  });
  win.setMenu(null);
  win.on('ready-to-show', () => win.show());
  win.on('page-title-updated', (e) => e.preventDefault());
  win.on('closed', () => {
    if (logsWindow === win) logsWindow = null;
  });

  // Same dev-tools lockdown as the main window.
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    const key = input.key.toLowerCase();
    const mod = input.control || input.meta;
    const isF12 = key === 'f12';
    const isCtrlShiftI = mod && input.shift && key === 'i';
    const isCtrlAltI = mod && input.alt && key === 'i';
    const isCtrlShiftJ = mod && input.shift && key === 'j';
    const isCtrlShiftC = mod && input.shift && key === 'c';
    if (isF12 || isCtrlShiftI || isCtrlAltI || isCtrlShiftJ || isCtrlShiftC) {
      e.preventDefault();
    }
  });
  win.webContents.on('devtools-opened', () => {
    win.webContents.closeDevTools();
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'] + '?logs=1');
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'), { search: 'logs=1' });
  }
  logsWindow = win;
  logger.log('info', 'main', 'Logs window opened');

  // Drag/resize busy signal — pause the renderer's live setState pump
  // while the user is moving/resizing the Logs window. Without this,
  // the renderer competes with the OS compositor for the main thread.
  //
  // Critical perf detail: Windows fires `move` once per pixel during
  // drag (50–80 calls/s). Doing meaningful work in that handler floods
  // the main process. We rate-limit the busy-signal handler to one
  // pass every ~150 ms — past that the busy state is already on, the
  // scheduled timeout already exists, and there is nothing for further
  // move ticks to do.
  let busyTimer: NodeJS.Timeout | null = null;
  let lastBusyTickMs = 0;
  let isBusy = false;
  const setBusy = (busy: boolean): void => {
    if (busy === isBusy) return;
    isBusy = busy;
    if (!win.isDestroyed()) win.webContents.send(IPC.logsBusy, busy);
  };
  const markBusy = (): void => {
    const now = Date.now();
    if (isBusy && now - lastBusyTickMs < 150) return; // already busy + recent tick
    lastBusyTickMs = now;
    setBusy(true);
    if (busyTimer) clearTimeout(busyTimer);
    // 200 ms after the last gesture tick → resume live updates.
    busyTimer = setTimeout(() => setBusy(false), 200);
  };
  win.on('move', markBusy);
  win.on('will-resize', markBusy);
  win.on('resize', markBusy);
  win.on('closed', () => {
    if (busyTimer) clearTimeout(busyTimer);
  });
}

function registerIpc(): void {
  ipcMain.handle(IPC.appVersion, () => app.getVersion());

  // Renderer → main heartbeat carrying live input-lag (ms). Forwarded
  // to the active crawler so it can adaptively shrink its concurrency
  // when the renderer's main thread is starved. `ipcMain.on` (not
  // `handle`) because the renderer uses `send`-no-wait — this stays
  // off the synchronous IPC reply path entirely.
  ipcMain.on(IPC.rendererLagReport, (_e, lagMs: number) => {
    if (typeof lagMs === 'number' && Number.isFinite(lagMs)) {
      activeCrawler?.reportRendererLag(lagMs);
      // Forward the same sample to the freeze-watchdog so a frozen
      // renderer surfaces in `debug.txt` even when no crawl is active.
      freezeWatchdog.reportRendererLag(lagMs);
    }
  });

  ipcMain.handle(IPC.logsGetAll, () => logger.getAll());
  ipcMain.handle(IPC.logsClear, () => {
    logger.clearAll();
    logger.log('info', 'main', 'Log buffer cleared');
  });
  ipcMain.handle(IPC.logsOpenWindow, () => openLogsWindow());

  ipcMain.handle(IPC.robotsTest, (_e, input: RobotsTestInput) =>
    testUrlAgainstRobots(input.url, input.userAgent, input.customRobots),
  );

  ipcMain.handle(
    IPC.sitemapValidate,
    async (_e, input: SitemapValidateInput): Promise<SitemapValidateResult> => {
      const ac = new AbortController();
      const timeout = setTimeout(() => ac.abort(), 30_000);
      try {
        const ua = input.userAgent || DEFAULT_CRAWL_CONFIG.userAgent;
        const result = await fetchSitemaps([input.url], {
          userAgent: ua,
          signal: ac.signal,
          timeoutMs: 30_000,
          maxUrls: 100_000,
          maxDepth: 3,
        });
        const lastmodSamples = result.entries
          .slice(0, 50)
          .map((e) => e.lastmod ?? '')
          .filter(Boolean)
          .slice(0, 10);
        const validation = validateSitemap({
          urlCount: result.entries.length,
          fileBytes: 0,
          lastmodSamples,
        });
        return {
          url: input.url,
          sitemapsTried: result.sitemapsTried,
          sitemapsParsed: result.sitemapsParsed,
          errors: result.errors,
          urlCount: result.entries.length,
          truncated: result.truncated,
          findings: validation.findings,
          lastmodSamples,
        };
      } finally {
        clearTimeout(timeout);
      }
    },
  );

  // Reports — every one of these is a SELECT-aggregate that benefits
  // from running off the main thread. Each handler routes through the
  // reader pool with a main-thread fallback so a worker crash doesn't
  // brick the Reports dialog.
  ipcMain.handle(
    IPC.reportsPagesPerDirectory,
    (_e, input: PagesPerDirectoryInput) =>
      callReaderOrFallback(
        'getPagesPerDirectory',
        [{ depth: input.depth, limit: input.limit }],
        () => getDb().getPagesPerDirectory({ depth: input.depth, limit: input.limit }),
      ),
  );

  ipcMain.handle(IPC.reportsStatusCodeHistogram, () =>
    callReaderOrFallback('getStatusCodeHistogram', [], () =>
      getDb().getStatusCodeHistogram(),
    ),
  );

  ipcMain.handle(IPC.reportsDepthHistogram, () =>
    callReaderOrFallback('getDepthHistogram', [], () => getDb().getDepthHistogram()),
  );

  ipcMain.handle(IPC.reportsResponseTimeHistogram, () =>
    callReaderOrFallback('getResponseTimeHistogram', [], () =>
      getDb().getResponseTimeHistogram(),
    ),
  );

  ipcMain.handle(
    IPC.reportsTopUrls,
    (_e, input: TopUrlsInput): Promise<TopUrlsRow[]> => {
      const limit = Math.min(500, Math.max(1, input.limit ?? 25));
      const column =
        input.metric === 'response-time'
          ? 'response_time_ms'
          : input.metric === 'inlinks'
            ? 'inlinks'
            : input.metric === 'outlinks'
              ? 'outlinks'
              : input.metric === 'depth'
                ? 'depth'
                : 'content_length';
      return callReaderOrFallback<TopUrlsRow[]>(
        'topUrlsBy',
        [column, limit],
        () => getDb().topUrlsBy(column, limit),
      );
    },
  );

  ipcMain.handle(
    IPC.reportsExternalDomainHealth,
    (_e, limit: number | undefined): Promise<ExternalDomainHealthRow[]> =>
      callReaderOrFallback<ExternalDomainHealthRow[]>(
        'externalDomainHealth',
        [limit ?? 100],
        () => getDb().externalDomainHealth(limit ?? 100),
      ),
  );

  ipcMain.handle(IPC.reportsAnalyticsCoverage, () =>
    callReaderOrFallback<AnalyticsCoverageRow[]>('analyticsCoverage', [], () =>
      getDb().analyticsCoverage(),
    ),
  );

  ipcMain.handle(IPC.reportsLinkPositions, () =>
    callReaderOrFallback<LinkPositionRow[]>('linkPositionBreakdown', [], () =>
      getDb().linkPositionBreakdown(),
    ),
  );

  ipcMain.handle(
    IPC.reportsImageWeightPerPage,
    (_e, limit: number | undefined): Promise<ImageWeightRow[]> =>
      callReaderOrFallback<ImageWeightRow[]>(
        'imageWeightPerPage',
        [limit ?? 25],
        () => getDb().imageWeightPerPage(limit ?? 25),
      ),
  );

  ipcMain.handle(IPC.reportsInlinksHistogram, () =>
    callReaderOrFallback<BucketHistogramRow[]>('inlinksHistogram', [], () =>
      getDb().inlinksHistogram(),
    ),
  );

  ipcMain.handle(IPC.reportsWordCountHistogram, () =>
    callReaderOrFallback<BucketHistogramRow[]>('wordCountHistogram', [], () =>
      getDb().wordCountHistogram(),
    ),
  );

  ipcMain.handle(IPC.reportsUrlLengthHistogram, () =>
    callReaderOrFallback<BucketHistogramRow[]>('urlLengthHistogram', [], () =>
      getDb().urlLengthHistogram(),
    ),
  );

  ipcMain.handle(
    IPC.reportsWordCountPerDirectory,
    (_e, input: WordCountPerDirectoryInput): Promise<WordCountPerDirectoryRow[]> =>
      callReaderOrFallback<WordCountPerDirectoryRow[]>(
        'wordCountPerDirectory',
        [{ depth: input.depth, limit: input.limit }],
        () =>
          getDb().wordCountPerDirectory({ depth: input.depth, limit: input.limit }),
      ),
  );

  ipcMain.handle(
    IPC.reportsSitemapOrphans,
    (_e, limit?: number): Promise<SitemapOrphanRow[]> =>
      callReaderOrFallback<SitemapOrphanRow[]>(
        'sitemapOrphans',
        [limit ?? 1000],
        () => getDb().sitemapOrphans(limit ?? 1000),
      ),
  );

  ipcMain.handle(IPC.reportsServerHeaders, () =>
    callReaderOrFallback<ServerHeaderRow[]>('serverHeaderBreakdown', [], () =>
      getDb().serverHeaderBreakdown(),
    ),
  );

  ipcMain.handle(
    IPC.prefsExportSettings,
    async (_e, input: SettingsExportInput): Promise<SettingsExportResult> => {
      let filePath = input.filePath ?? '';
      if (!filePath) {
        if (!mainWindow) return { filePath: '', bytesWritten: 0 };
        const res = await dialog.showSaveDialog(mainWindow, {
          title: 'Export Settings',
          defaultPath: 'freecrawl-settings.json',
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });
        if (res.canceled || !res.filePath) return { filePath: '', bytesWritten: 0 };
        filePath = res.filePath;
      }
      const payload = {
        // Lightweight envelope — version + timestamp lets future imports
        // detect schema drift without breaking on the raw config blob.
        format: 'freecrawl/settings',
        version: 1,
        exportedAt: new Date().toISOString(),
        config: input.config,
      };
      const json = JSON.stringify(payload, null, 2);
      writeFileSync(filePath, json, 'utf8');
      return { filePath, bytesWritten: Buffer.byteLength(json, 'utf8') };
    },
  );

  ipcMain.handle(
    IPC.prefsImportSettings,
    async (): Promise<SettingsImportResult> => {
      if (!mainWindow) return { filePath: '', config: null, unknownFields: [] };
      const res = await dialog.showOpenDialog(mainWindow, {
        title: 'Import Settings',
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      if (res.canceled || res.filePaths.length === 0) {
        return { filePath: '', config: null, unknownFields: [] };
      }
      const filePath = res.filePaths[0]!;
      let raw: unknown;
      try {
        const text = readFileSync(filePath, 'utf8');
        raw = JSON.parse(text);
      } catch (err) {
        dialog.showErrorBox(
          'Import Failed',
          `Cannot parse JSON: ${(err as Error).message}`,
        );
        return { filePath: '', config: null, unknownFields: [] };
      }
      // Accept both the wrapped envelope and a bare CrawlConfig object —
      // bare objects are useful for hand-edited setting fragments.
      const config =
        raw && typeof raw === 'object' && 'config' in (raw as Record<string, unknown>)
          ? ((raw as { config: unknown }).config as Record<string, unknown>)
          : (raw as Record<string, unknown>);
      if (!config || typeof config !== 'object') {
        dialog.showErrorBox(
          'Import Failed',
          'Imported file does not contain a settings object.',
        );
        return { filePath: '', config: null, unknownFields: [] };
      }
      const knownKeys = new Set(Object.keys(DEFAULT_CRAWL_CONFIG));
      const unknownFields = Object.keys(config).filter((k) => !knownKeys.has(k));
      return { filePath, config, unknownFields };
    },
  );

  // Stream new entries to the logs window in coalesced batches. A heavy
  // crawl emits 100–300 logs/s; sending each as its own IPC message
  // saturated the renderer's event loop and caused visible UI stutters
  // even with renderer-side batching, because every IPC dispatch
  // costs serialise + V8-deserialise + main-thread work in the
  // renderer process. Batching at 100 ms drops IPC volume by ~10–30×
  // while still feeling "live" in the log panel.
  let logsBatch: import('@freecrawl/shared-types').LogEntry[] = [];
  let logsFlushTimer: NodeJS.Timeout | null = null;
  const flushLogsBatch = (): void => {
    logsFlushTimer = null;
    if (logsBatch.length === 0) return;
    const payload = logsBatch;
    logsBatch = [];
    if (logsWindow && !logsWindow.isDestroyed()) {
      logsWindow.webContents.send(IPC.logsBatch, payload);
    }
  };
  logger.subscribe((entry) => {
    if (!logsWindow || logsWindow.isDestroyed()) return;
    logsBatch.push(entry);
    if (logsFlushTimer === null) {
      logsFlushTimer = setTimeout(flushLogsBatch, 100);
    }
  });

  // Prefs — synchronous bulk read so preload can hydrate before the
  // renderer renders (avoids column-width / panel-size flash on startup).
  ipcMain.on(IPC.prefsGetAllSync, (e) => {
    loadPrefs();
    e.returnValue = prefsCache;
  });
  ipcMain.handle(IPC.prefsSet, (_e, key: string, value: unknown) => {
    loadPrefs();
    prefsCache[key] = value;
    schedulePrefsWrite();
  });
  ipcMain.handle(IPC.prefsDelete, (_e, key: string) => {
    loadPrefs();
    delete prefsCache[key];
    schedulePrefsWrite();
  });

  /** Wave 6 — Cached most-recent crawl config so the crash-recovery
   * resume can re-create a Crawler without forcing the user to fill
   * in the Start dialog again. Persisted across restarts via DB
   * project_meta so it survives the very crash we're recovering from. */
  function attachCrawlerListeners(crawler: Crawler): void {
    crawler.on('progress', (p: CrawlProgress) => {
      if (activeCrawler !== crawler) return;
      mainWindow?.webContents.send(IPC.crawlProgress, p);
      freezeWatchdog.updateCounters({
        crawled: p.crawled,
        discovered: p.discovered,
        pending: p.pending,
        failed: p.failed,
      });
    });
    crawler.on('done', (summary: CrawlSummary) => {
      if (activeCrawler !== crawler) return;
      logger.log(
        'info',
        'crawler',
        `Crawl done: total=${summary.total} avgResp=${summary.avgResponseTimeMs}ms totalBytes=${summary.totalBytes}`,
      );
      mainWindow?.webContents.send(IPC.crawlDone, summary);
      activeCrawler = null;
      freezeWatchdog.setMainOp('idle');
      if (Notification.isSupported() && !mainWindow?.isFocused()) {
        try {
          new Notification({
            title: 'FreeCrawl SEO Tool',
            body: `Crawl finished: ${summary.total.toLocaleString()} URLs · avg ${Math.round(summary.avgResponseTimeMs)} ms`,
            silent: false,
          }).show();
        } catch {
          /* Linux without notification daemon — swallow */
        }
      }
    });
    crawler.on('error', (msg: string) => {
      if (activeCrawler !== crawler) return;
      logger.log('error', 'crawler', msg);
      mainWindow?.webContents.send(IPC.crawlError, msg);
      maybeShowDiagnosticDialog(msg);
    });
    crawler.on('warn', (msg: string) => {
      if (activeCrawler !== crawler) return;
      logger.log('warn', 'crawler', msg);
    });
    crawler.on('info', (msg: string) => {
      if (activeCrawler !== crawler) return;
      logger.log('info', 'crawler', msg);
    });
    crawler.on('debug', (msg: string) => {
      if (activeCrawler !== crawler) return;
      logger.log('debug', 'crawler', msg);
    });
  }

  ipcMain.handle(IPC.crawlStart, (_e, config: CrawlConfig) => {
    if (activeCrawler) {
      activeCrawler.stop();
      logger.log('info', 'crawler', 'Stopped previous crawl before starting a new one');
    }
    // Reset per-session diagnostic dedup so a re-run after fixing the
    // environment can pop the dialog again if the same issue recurs.
    shownDiagnosticDialogs.clear();
    logger.log(
      'info',
      'crawler',
      `Crawl starting: ${config.startUrl} (scope=${config.scope}, maxDepth=${config.maxDepth}, maxUrls=${config.maxUrls}, concurrency=${config.maxConcurrency}, rps=${config.maxRps})`,
    );
    const database = getDb();
    database.setMeta('lastStartUrl', config.startUrl);
    // Persist the config so a crash-then-resume can rehydrate it
    // without the user re-entering anything. Stored as JSON in
    // `project_meta` since the table is keyed by string.
    try {
      database.setMeta('lastCrawlConfig', JSON.stringify(config));
    } catch {
      /* never fatal */
    }
    lastCrawlConfig = config;
    const crawler = new Crawler(config, database, {
      setOp: (op: string) => freezeWatchdog.setMainOp(op),
      parseHtml: parseHtmlViaPool,
      writeFetchedUrl: writeFetchedUrlViaPool,
    });
    activeCrawler = crawler;
    attachCrawlerListeners(crawler);
    void crawler.start();
  });

  ipcMain.handle(IPC.crawlStop, () => {
    activeCrawler?.stop();
  });

  ipcMain.handle(IPC.crawlPause, () => {
    activeCrawler?.pause();
  });

  ipcMain.handle(IPC.crawlResume, () => {
    activeCrawler?.resume();
  });

  ipcMain.handle(IPC.crawlClear, () => {
    activeCrawler?.stop();
    activeCrawler = null;
    const database = getDb();
    database.reset();
    // Belt-and-braces: reset() above already includes a DELETE FROM
    // crawl_queue, but if anything (a late-firing checkpoint timer, a
    // half-finished post-crawl pass) writes to that table after the
    // exec() returns, the user would see a stale recovery prompt next
    // launch. An explicit second sweep here is cheap and guarantees
    // the queue is empty when the IPC handler resolves.
    try {
      database.clearQueueCheckpoint();
    } catch {
      /* table missing on very old DBs — recovery just won't fire */
    }
    // The in-memory recovery snapshot is captured at app boot from the
    // queue-on-disk; reset() now wipes that data, but the snapshot
    // mirror still holds the pre-reset entries. Drop it so a stale
    // dialog can't fire after Clear if the user cancelled the boot
    // prompt earlier.
    pendingRecoveryCheckpoint = [];
  });

  ipcMain.handle(IPC.crawlAddUrl, (_e, url: string): { accepted: boolean } => {
    if (!activeCrawler) return { accepted: false };
    const accepted = activeCrawler.enqueueManual(url);
    if (accepted) {
      logger.log('info', 'crawler', `Manual URL added: ${url}`);
    }
    return { accepted };
  });

  ipcMain.handle(
    IPC.projectSaveAs,
    async (): Promise<{ filePath: string; bytesWritten: number } | null> => {
      const win = mainWindow;
      if (!win) return null;
      const res = await dialog.showSaveDialog(win, {
        title: 'Save Project As…',
        defaultPath: 'crawl.seoproject',
        filters: [
          { name: 'FreeCrawl Project', extensions: ['seoproject'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      if (res.canceled || !res.filePath) return null;
      // Snapshot the live SQLite DB. WAL mode means a plain file copy
      // can miss in-flight writes — use the SQLite VACUUM INTO command,
      // which produces a self-contained, consistent snapshot atomically.
      const target = res.filePath;
      const database = getDb();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawDb = (database as any).db as { exec: (sql: string) => void };
      const escaped = target.replace(/'/g, "''");
      rawDb.exec(`VACUUM INTO '${escaped}'`);
      const { statSync } = await import('node:fs');
      const bytes = statSync(target).size;
      await dialog.showMessageBox(win, {
        type: 'info',
        title: 'Project Saved',
        message: `Snapshot written: ${(bytes / (1024 * 1024)).toFixed(1)} MB.`,
        detail: target,
        buttons: ['OK'],
        noLink: true,
      });
      // Saved snapshot is a valid project on disk — pin it as the active
      // project and add to recents.
      try {
        openProjectAtPath(target);
      } catch (err) {
        // Fall through; saving succeeded even if reopening failed for some
        // reason (rare — same file we just wrote).
        logger.log('warn', 'main', `Save Project As: reopen failed: ${(err as Error).message}`);
      }
      return { filePath: target, bytesWritten: bytes };
    },
  );

  ipcMain.handle(
    IPC.projectOpen,
    async (
      _e,
      filePath: string | undefined,
    ): Promise<{ filePath: string } | null> => {
      let target = filePath;
      if (!target) {
        if (!mainWindow) return null;
        const res = await dialog.showOpenDialog(mainWindow, {
          title: 'Open Project',
          properties: ['openFile'],
          filters: [
            { name: 'FreeCrawl Project', extensions: ['seoproject', 'sqlite', 'db'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });
        if (res.canceled || res.filePaths.length === 0) return null;
        target = res.filePaths[0]!;
      }
      try {
        openProjectAtPath(target);
        return { filePath: target };
      } catch (err) {
        if (mainWindow) {
          dialog.showErrorBox(
            'Open Project Failed',
            `Could not open ${target}.\n\n${(err as Error).message}`,
          );
        }
        return null;
      }
    },
  );

  ipcMain.handle(IPC.projectCurrentPath, (): string | null => {
    return currentProjectPath || null;
  });

  ipcMain.handle(IPC.confirmClear, async (): Promise<ConfirmClearResult> => {
    const win = mainWindow;
    if (!win) return { confirmed: false, skipNext: false };
    const res = await dialog.showMessageBox(win, {
      type: 'warning',
      buttons: ['Clear', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      title: 'Clear Crawl Data',
      message: 'Clear all crawl data?',
      detail:
        'This will remove all discovered URLs, links, and crawl metadata for this project. This action cannot be undone.',
      checkboxLabel: "Don't ask me again",
      checkboxChecked: false,
      noLink: true,
    });
    return {
      confirmed: res.response === 0,
      skipNext: res.response === 0 && res.checkboxChecked,
    };
  });

  // `setImmediate`-yield wrapper for read-heavy IPC handlers. Yielding
  // before running the SQL gives the Node event loop one tick to drain
  // pending IPC and crawler callbacks first — without this, two
  // simultaneous renderer queries (e.g. table chunk + sidebar refresh)
  // run back-to-back and freeze input for the duration of both. With
  // this wrapper they interleave with the crawler's per-URL DB writes
  // and any other queued IPC, keeping click → response under one frame
  // even on a saturated main thread. Cost per call: < 1 ms.
  const yieldThenRun = <T>(fn: () => T): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      setImmediate(() => {
        try {
          resolve(fn());
        } catch (err) {
          reject(err as Error);
        }
      });
    });

  ipcMain.handle(IPC.urlsQuery, async (_e, input: UrlsQueryInput): Promise<UrlsQueryResult> => {
    const args: Parameters<typeof ProjectDb.prototype.queryUrls> = [
      {
        limit: input.limit,
        offset: input.offset,
        category: input.category ?? 'all',
        search: input.search,
        sortBy: input.sortBy as string | undefined,
        sortDir: input.sortDir,
        filter: input.filter,
      },
    ];
    // Reader worker first (off-thread); on any failure (worker
    // crashed, swap in flight, timeout) fall back to the main-thread
    // ProjectDb so the UI never blocks on infrastructure trouble.
    return callReaderOrFallback<UrlsQueryResult>('queryUrls', args, () =>
      getDb().queryUrls(args[0]),
    );
  });

  ipcMain.handle(IPC.overviewGet, async (): Promise<OverviewCounts> =>
    callReaderOrFallback<OverviewCounts>('getOverviewCounts', [], () =>
      getDb().getOverviewCountsAsync(),
    ),
  );

  ipcMain.handle(
    IPC.imagesQuery,
    async (_e, input: ImagesQueryInput): Promise<ImagesQueryResult> => {
      const args: Parameters<typeof ProjectDb.prototype.queryImages> = [
        {
          limit: input.limit,
          offset: input.offset,
          search: input.search,
          missingAltOnly: input.missingAltOnly,
          internalOnly: input.internalOnly,
        },
      ];
      return callReaderOrFallback<ImagesQueryResult>('queryImages', args, () =>
        getDb().queryImages(args[0]),
      );
    },
  );

  ipcMain.handle(
    IPC.brokenLinksQuery,
    async (_e, input: BrokenLinksQueryInput): Promise<BrokenLinksQueryResult> => {
      const args: Parameters<typeof ProjectDb.prototype.queryBrokenLinks> = [
        {
          limit: input.limit,
          offset: input.offset,
          internal: input.internal,
          search: input.search,
        },
      ];
      return callReaderOrFallback<BrokenLinksQueryResult>(
        'queryBrokenLinks',
        args,
        () => getDb().queryBrokenLinks(args[0]),
      );
    },
  );

  ipcMain.handle(IPC.urlContextMenu, (e, input: UrlContextMenuInput) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const canRecrawl = activeCrawler !== null && activeCrawler.isRunning;

    const template: MenuItemConstructorOptions[] = [
      {
        label: 'Copy',
        click: () => clipboard.writeText(input.url),
      },
      {
        label: 'Open in Browser',
        click: () => void shell.openExternal(input.url),
      },
      { type: 'separator' },
      {
        label: 'Re-Spider',
        enabled: canRecrawl,
        toolTip: canRecrawl ? undefined : 'Start a crawl first',
        click: () => {
          const db = getDb();
          db.markUrlForRecrawl(input.urlId);
          if (activeCrawler) {
            activeCrawler.requeueUrl(input.url);
          }
          fireDataChanged();
        },
      },
      {
        label: 'Remove',
        click: () => {
          getDb().deleteUrl(input.urlId);
          fireDataChanged();
        },
      },
      { type: 'separator' },
      {
        label: 'Export',
        enabled: false,
        submenu: [{ label: 'Selected URLs as CSV', enabled: false }],
      },
      { label: 'Visualisations', enabled: false },
      { label: 'Check Index', enabled: false },
      { label: 'Backlinks', enabled: false },
      { label: 'Validation', enabled: false },
      { label: 'History', enabled: false },
      { label: 'Speed', enabled: false },
      { type: 'separator' },
      { label: 'Show Other Domains on IP', enabled: false },
      {
        label: 'Open robots.txt',
        click: () => {
          try {
            const origin = new URL(input.url).origin;
            void shell.openExternal(origin + '/robots.txt');
          } catch {
            /* ignore malformed URL */
          }
        },
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    if (win) menu.popup({ window: win });
    else menu.popup();
  });

  ipcMain.handle(
    IPC.urlBulkContextMenu,
    async (e, input: UrlBulkContextMenuInput) => {
      const win = BrowserWindow.fromWebContents(e.sender);
      const db = getDb();
      const ids = input.urlIds;
      if (ids.length === 0) return;
      const urls = db.getUrlsByIds(ids);
      const canRecrawl = activeCrawler !== null && activeCrawler.isRunning;
      const n = ids.length.toLocaleString();

      const template: MenuItemConstructorOptions[] = [
        {
          label: `Copy ${n} URLs`,
          click: () => clipboard.writeText(urls.join('\n')),
        },
        {
          label: `Open ${n} URLs in Browser`,
          // Guard: opening hundreds of tabs at once is a bad default.
          enabled: urls.length <= 20,
          toolTip:
            urls.length > 20 ? 'Limited to 20 URLs to avoid spawning too many tabs' : undefined,
          click: () => {
            for (const u of urls) void shell.openExternal(u);
          },
        },
        { type: 'separator' },
        {
          label: `Re-Spider ${n} URLs`,
          enabled: canRecrawl,
          toolTip: canRecrawl ? undefined : 'Start a crawl first',
          click: () => {
            db.markUrlsForRecrawl(ids);
            if (activeCrawler) {
              for (const u of urls) activeCrawler.requeueUrl(u);
            }
            fireDataChanged();
          },
        },
        {
          label: `Remove ${n} URLs`,
          click: () => {
            db.deleteUrls(ids);
            fireDataChanged();
          },
        },
        { type: 'separator' },
        {
          label: `Export ${n} URLs as CSV…`,
          click: async () => {
            const w = win ?? mainWindow;
            if (!w) return;
            const res = await dialog.showSaveDialog(w, {
              defaultPath: 'freecrawl-selected.csv',
              filters: [{ name: 'CSV', extensions: ['csv'] }],
            });
            if (res.canceled || !res.filePath) return;
            await exportUrlsToCsv(db, res.filePath, { selectedIds: ids });
          },
        },
      ];

      const menu = Menu.buildFromTemplate(template);
      if (win) menu.popup({ window: win });
      else menu.popup();
    },
  );

  ipcMain.handle(IPC.urlDetailGet, async (_e, input: UrlDetailInput): Promise<UrlDetail | null> =>
    callReaderOrFallback<UrlDetail | null>(
      'getUrlDetail',
      [input.id, input.linkLimit ?? 500],
      () => getDb().getUrlDetail(input.id, input.linkLimit ?? 500),
    ),
  );

  ipcMain.handle(
    IPC.urlSourceGet,
    (_e, input: UrlSourceInput): UrlSourceResult => {
      const r = getDb().getUrlSource(input.id);
      if (!r) {
        return { body: null, bodyLength: 0, truncated: false, capturedAt: null };
      }
      return {
        body: r.body,
        bodyLength: r.bodyLength,
        truncated: r.truncated,
        capturedAt: r.capturedAt,
      };
    },
  );

  ipcMain.handle(
    IPC.urlPageImages,
    (_e, input: UrlPageImagesInput): UrlPageImagesResult => {
      const rows = getDb().pageImagesDetailed(input.id, input.limit ?? 5000);
      return { rows };
    },
  );

  ipcMain.handle(
    IPC.urlCertInfo,
    (_e, input: UrlCertInfoInput): UrlCertInfoResult => {
      const r = getDb().getHostCertForUrl(input.id);
      if (!r) {
        return {
          host: null,
          validFrom: null,
          validTo: null,
          daysUntilExpiry: null,
          issuer: null,
          subject: null,
          signatureAlgorithm: null,
          protocol: null,
          probeStatus: -1,
          probeError: null,
          probedAt: null,
        };
      }
      return r;
    },
  );

  ipcMain.handle(IPC.summaryGet, (): Promise<CrawlSummary> =>
    callReaderOrFallback<CrawlSummary>('getSummary', [], () => getDb().getSummary()),
  );

  ipcMain.handle(
    IPC.exportCsv,
    async (_e, input: ExportCsvInput): Promise<ExportCsvResult> => {
      let filePath = input.filePath;
      const isSelection = (input.selectedIds?.length ?? 0) > 0;
      if (!filePath) {
        const res = await dialog.showSaveDialog(mainWindow!, {
          defaultPath: isSelection ? 'freecrawl-selected.csv' : 'freecrawl-export.csv',
          filters: [{ name: 'CSV', extensions: ['csv'] }],
        });
        if (res.canceled || !res.filePath) {
          return { filePath: '', rowsWritten: 0 };
        }
        filePath = res.filePath;
      }
      const { rowsWritten } = await exportUrlsToCsv(getDb(), filePath, {
        selectedIds: input.selectedIds,
      });
      return { filePath, rowsWritten };
    },
  );

  ipcMain.handle(
    IPC.exportJson,
    async (_e, input: ExportJsonInput): Promise<ExportJsonResult> => {
      let filePath = input.filePath;
      const isSelection = (input.selectedIds?.length ?? 0) > 0;
      if (!filePath) {
        const res = await dialog.showSaveDialog(mainWindow!, {
          defaultPath: isSelection ? 'freecrawl-selected.json' : 'freecrawl-export.json',
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });
        if (res.canceled || !res.filePath) {
          return { filePath: '', rowsWritten: 0 };
        }
        filePath = res.filePath;
      }
      const { rowsWritten } = await exportUrlsToJson(getDb(), filePath, {
        selectedIds: input.selectedIds,
        pretty: input.pretty,
      });
      return { filePath, rowsWritten };
    },
  );

  ipcMain.handle(
    IPC.exportXml,
    async (_e, input: ExportXmlInput): Promise<ExportXmlResult> => {
      let filePath = input.filePath;
      const isSelection = (input.selectedIds?.length ?? 0) > 0;
      if (!filePath) {
        const res = await dialog.showSaveDialog(mainWindow!, {
          defaultPath: isSelection ? 'freecrawl-selected.xml' : 'freecrawl-export.xml',
          filters: [{ name: 'XML', extensions: ['xml'] }],
        });
        if (res.canceled || !res.filePath) {
          return { filePath: '', rowsWritten: 0 };
        }
        filePath = res.filePath;
      }
      const { rowsWritten } = await exportUrlsToXml(getDb(), filePath, {
        selectedIds: input.selectedIds,
        category: input.category,
      });
      return { filePath, rowsWritten };
    },
  );

  ipcMain.handle(
    IPC.dataDeleteByDomain,
    async (
      _e,
      input: DataDeleteByDomainInput,
    ): Promise<DataDeleteByDomainResult> => {
      const { urlsDeleted, linksDeleted } = getDb().deleteByDomain(input.domain);
      // Force-invalidate UI caches: row counts, sidebar issues, etc.
      fireDataChanged();
      return { urlsDeleted, linksDeleted };
    },
  );

  // Wave 6 — Crash recovery handlers. The renderer asks `…Status` on
  // mount; if `pendingCount > 0` it shows a confirmation dialog and
  // routes the user's choice to `…Resume` or `…Discard`.
  ipcMain.handle(
    IPC.crashRecoveryStatus,
    async (): Promise<CrashRecoveryStatus> => {
      // Read from the in-memory snapshot we captured before
      // `db.reset()` wiped the previous session's data.
      if (pendingRecoveryCheckpoint.length === 0) {
        return { pendingCount: 0, seedUrl: '' };
      }
      return {
        pendingCount: pendingRecoveryCheckpoint.length,
        seedUrl: pendingRecoveryCheckpoint[0]?.seedUrl ?? '',
      };
    },
  );

  ipcMain.handle(
    IPC.crashRecoveryResume,
    async (): Promise<{ accepted: boolean }> => {
      if (activeCrawler) return { accepted: false };
      if (pendingRecoveryCheckpoint.length === 0) return { accepted: false };
      const seedUrl = pendingRecoveryCheckpoint[0]?.seedUrl ?? '';
      if (!seedUrl) return { accepted: false };
      const cfg = lastCrawlConfig
        ? { ...lastCrawlConfig, startUrl: seedUrl }
        : null;
      if (!cfg) return { accepted: false };
      const crawler = new Crawler(cfg, getDb(), {
        setOp: (op: string) => freezeWatchdog.setMainOp(op),
        parseHtml: parseHtmlViaPool,
        writeFetchedUrl: writeFetchedUrlViaPool,
      });
      activeCrawler = crawler;
      attachCrawlerListeners(crawler);
      const items = pendingRecoveryCheckpoint.map((c) => ({
        url: c.url,
        depth: c.depth,
      }));
      // Snapshot consumed — clear so a second click can't double-fire.
      pendingRecoveryCheckpoint = [];
      crawler.enqueueCheckpointed(items);
      void crawler.start();
      return { accepted: true };
    },
  );

  ipcMain.handle(IPC.crashRecoveryDiscard, async (): Promise<void> => {
    pendingRecoveryCheckpoint = [];
    // Wipe the on-disk crawl_queue too — without this, anything that
    // re-populates the queue between now and the next app launch would
    // resurrect the recovery prompt the user just dismissed.
    try {
      getDb().clearQueueCheckpoint();
    } catch (err) {
      logger.log(
        'warn',
        'main',
        `clearQueueCheckpoint failed on discard: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });

  ipcMain.handle(IPC.exportBulk, async (): Promise<BulkExportResult> => {
    if (!mainWindow) {
      return { outputDir: '', files: [], errors: [] };
    }
    const dirRes = await dialog.showOpenDialog(mainWindow, {
      title: 'Bulk Export — choose output folder',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (dirRes.canceled || dirRes.filePaths.length === 0) {
      return { outputDir: '', files: [], errors: [] };
    }
    const outputDir = dirRes.filePaths[0]!;
    const tasks: { label: string; file: string; category: UrlCategory }[] = [
      { label: 'All URLs', file: 'all-urls.csv', category: 'all' },
      { label: 'Internal HTML', file: 'internal-html.csv', category: 'internal:html' },
      { label: 'Internal All', file: 'internal-all.csv', category: 'internal:all' },
      { label: 'External All', file: 'external-all.csv', category: 'external:all' },
      { label: '2xx Success', file: 'status-2xx.csv', category: 'status:2xx' },
      { label: '3xx Redirects', file: 'status-3xx.csv', category: 'status:3xx' },
      { label: '4xx Client Errors', file: 'status-4xx.csv', category: 'status:4xx' },
      { label: '5xx Server Errors', file: 'status-5xx.csv', category: 'status:5xx' },
      { label: 'Indexable', file: 'indexable.csv', category: 'indexability:indexable' },
      {
        label: 'Non-Indexable',
        file: 'non-indexable.csv',
        category: 'indexability:non-indexable',
      },
      {
        label: 'Title Issues — Missing',
        file: 'issues-title-missing.csv',
        category: 'issues:title-missing',
      },
      {
        label: 'Title Issues — Duplicate',
        file: 'issues-title-duplicate.csv',
        category: 'issues:title-duplicate',
      },
      {
        label: 'Meta Description Issues — Missing',
        file: 'issues-meta-missing.csv',
        category: 'issues:meta-missing',
      },
      {
        label: 'H1 Issues — Missing',
        file: 'issues-h1-missing.csv',
        category: 'issues:h1-missing',
      },
      {
        label: 'Canonical Issues — Missing',
        file: 'issues-canonical-missing.csv',
        category: 'issues:canonical-missing',
      },
      {
        label: 'Pagination Broken',
        file: 'issues-pagination-broken.csv',
        category: 'issues:pagination-broken',
      },
      {
        label: 'Mixed Content',
        file: 'issues-mixed-content.csv',
        category: 'issues:mixed-content',
      },
      {
        label: 'Insecure Form Action',
        file: 'issues-insecure-form-action.csv',
        category: 'issues:insecure-form-action',
      },
      {
        label: 'Hreflang — Reciprocity Missing',
        file: 'hreflang-reciprocity-missing.csv',
        category: 'issues:hreflang-reciprocity-missing',
      },
      {
        label: 'Sitemap — Crawled, Not Listed',
        file: 'sitemap-crawled-not-in-sitemap.csv',
        category: 'issues:crawled-not-in-sitemap',
      },
      {
        label: 'Image Missing Alt',
        file: 'issues-image-missing-alt.csv',
        category: 'issues:image-missing-alt',
      },
      {
        label: 'Near-Duplicate Content',
        file: 'issues-near-duplicate.csv',
        category: 'issues:near-duplicate',
      },
    ];
    const files: BulkExportFile[] = [];
    const errors: { label: string; error: string }[] = [];
    const database = getDb();
    for (const task of tasks) {
      const filePath = join(outputDir, task.file);
      try {
        const { rowsWritten } = await exportUrlsToCsv(database, filePath, {
          category: task.category,
        });
        // Skip 0-row files — they bloat the bulk dump and the user almost
        // certainly doesn't want empty CSVs cluttering the directory.
        if (rowsWritten === 0) {
          try {
            const { unlinkSync } = await import('node:fs');
            unlinkSync(filePath);
          } catch {
            /* ignore */
          }
          continue;
        }
        files.push({ filePath, label: task.label, category: task.category, rowsWritten });
      } catch (err) {
        errors.push({ label: task.label, error: (err as Error).message });
      }
    }
    if (mainWindow) {
      const totalRows = files.reduce((s, f) => s + f.rowsWritten, 0);
      await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Bulk Export Complete',
        message: `${files.length} file(s) written, ${totalRows.toLocaleString()} row(s) total.`,
        detail:
          outputDir +
          (errors.length > 0
            ? `\n\nErrors:\n${errors.map((e) => `• ${e.label}: ${e.error}`).join('\n')}`
            : ''),
        buttons: ['OK', 'Open Folder'],
        defaultId: 0,
        noLink: true,
      }).then((res) => {
        if (res.response === 1) void shell.openPath(outputDir);
      });
    }
    return { outputDir, files, errors };
  });

  ipcMain.handle(
    IPC.exportHtmlReport,
    async (
      _e,
      input: ExportHtmlReportInput,
    ): Promise<ExportHtmlReportResult> => {
      let filePath = input.filePath;
      if (!filePath) {
        const res = await dialog.showSaveDialog(mainWindow!, {
          defaultPath: 'freecrawl-report.html',
          filters: [{ name: 'HTML Report', extensions: ['html'] }],
        });
        if (res.canceled || !res.filePath) {
          return { filePath: '', bytesWritten: 0 };
        }
        filePath = res.filePath;
      }
      const result = await exportHtmlReport(getDb(), filePath, {
        startUrl: getDb().getMeta('lastStartUrl') ?? '',
      });
      if (mainWindow) {
        await dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'HTML Report Saved',
          message: `Report written: ${(result.bytesWritten / 1024).toFixed(1)} KB.`,
          detail: result.filePath,
          buttons: ['OK'],
          noLink: true,
        });
      }
      return result;
    },
  );

  ipcMain.handle(
    IPC.sitemapGenerate,
    async (_e, input: SitemapGenerateInput): Promise<SitemapGenerateResult> => {
      let filePath = input.filePath;
      const variant = input.variant ?? 'standard';
      const gzip = input.gzip ?? false;
      if (!filePath) {
        const baseName =
          variant === 'image'
            ? 'sitemap-images.xml'
            : variant === 'hreflang'
              ? 'sitemap-hreflang.xml'
              : 'sitemap.xml';
        const defaultPath = gzip ? `${baseName}.gz` : baseName;
        const res = await dialog.showSaveDialog(mainWindow!, {
          defaultPath,
          filters: [
            gzip
              ? { name: 'Gzipped XML Sitemap', extensions: ['xml.gz', 'gz'] }
              : { name: 'XML Sitemap', extensions: ['xml'] },
          ],
        });
        if (res.canceled || !res.filePath) {
          return { filePath: '', urlsWritten: 0, truncated: false };
        }
        filePath = res.filePath;
      }
      const result = await exportSitemap(getDb(), filePath, {
        variant,
        gzip,
        splitAtUrlCount: input.splitAtUrlCount,
      });
      if (mainWindow) {
        const detail = result.sharded
          ? `${result.files.length - 1} part files + index\n${result.files.join('\n')}`
          : result.files[0] ?? filePath;
        await dialog.showMessageBox(mainWindow, {
          type: result.truncated ? 'warning' : 'info',
          title: 'Sitemap Generated',
          message: result.sharded
            ? `Sharded sitemap written: ${result.urlsWritten.toLocaleString()} URLs across ${
                result.files.length - 1
              } parts + index.`
            : `Sitemap written with ${result.urlsWritten.toLocaleString()} URLs${
                result.truncated ? ' (truncated at the 50,000 limit).' : '.'
              }`,
          detail,
          buttons: ['OK'],
          noLink: true,
        });
      }
      return {
        filePath,
        files: result.files,
        urlsWritten: result.urlsWritten,
        truncated: result.truncated,
        sharded: result.sharded,
      };
    },
  );

  ipcMain.handle(
    IPC.compareLoad,
    async (_e, input: CompareLoadInput): Promise<CompareLoadResult> => {
      let filePath = input.filePath;
      if (!filePath) {
        const res = await dialog.showOpenDialog(mainWindow!, {
          title: 'Compare With Project…',
          properties: ['openFile'],
          filters: [
            { name: 'FreeCrawl Project', extensions: ['seoproject', 'sqlite', 'db'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });
        if (res.canceled || res.filePaths.length === 0) {
          return {
            filePath: '',
            totalA: 0,
            totalB: 0,
            counts: {
              added: 0,
              removed: 0,
              status: 0,
              title: 0,
              meta: 0,
              h1: 0,
              canonical: 0,
              indexability: 0,
              response_time: 0,
            },
            samples: [],
          };
        }
        filePath = res.filePaths[0]!;
      }
      // Open the *other* project read-only — never mutate. The
      // ProjectDb constructor opens the file in default mode; that's
      // fine because we never call write methods on it during the diff.
      const otherDb = new ProjectDb(filePath);
      try {
        const summary = compareCrawls(getDb(), otherDb);
        return {
          filePath,
          totalA: summary.totalA,
          totalB: summary.totalB,
          counts: summary.counts,
          samples: summary.samples,
        };
      } finally {
        otherDb.close();
      }
    },
  );

  ipcMain.handle(
    IPC.graphSnapshot,
    (_e, input: GraphSnapshotInput): GraphSnapshotResult => {
      return getDb().graphSnapshot(input.nodeLimit ?? 1000);
    },
  );

  ipcMain.handle(
    IPC.topAnchorTexts,
    (_e, limit: number | undefined): AnchorTextRow[] => {
      return getDb().topAnchorTexts(limit ?? 200);
    },
  );
}

// Install console / crash hooks before anything else runs, so even the
// earliest startup noise (migration warnings, undici deprecations) is
// captured in the in-app log window.
logger.installGlobalHooks();
logger.log('info', 'main', `App bootstrap — Node ${process.version} on ${process.platform}`);

// Single-instance guard. Without this, double-clicking the launcher
// shortcut while the app is already open spawns a second Electron
// process that races for the same userData/Cache/GPUCache directories
// and produces the "Unable to move the cache: Erişim engellendi (0x5)"
// errors on stderr. The second instance is told to quit; the original
// window is brought to focus so the user gets the expected behaviour.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Suppress Chromium's GPU disk cache. Windows users whose %APPDATA%
// is synced by OneDrive / Dropbox / antivirus real-time scanners hit
// transient ACCESS_DENIED errors when Chromium tries to rotate or
// move its GPU shader cache. The cache only affects shader-compile
// warm-up time on second launch (~50 ms) so disabling it costs us
// nothing, while it removes a recurring source of stderr noise and
// startup-time errors.
app.commandLine.appendSwitch('disable-gpu-disk-cache');
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling');

void app.whenReady().then(() => {
  // Disk logging is bootstrapped after `app.whenReady()` — `getPath('userData')`
  // is only valid post-ready. Prior log lines are still in the ring buffer
  // and will be flushed to disk lazily via subsequent writes.
  try {
    logger.initFileLogging(app.getPath('userData'));
    const logFile = logger.getCurrentLogFile();
    if (logFile) logger.log('info', 'main', `Disk log file: ${logFile}`);
  } catch (err) {
    logger.log('warn', 'main', `Disk logging unavailable: ${(err as Error).message}`);
  }
  // Boot the freeze-watchdog before anything else CPU-heavy. The
  // worker writes to `<userData>/debug.txt` (separate from the
  // regular structured log so users + dev can grep stalls without
  // noise from normal app events).
  try {
    const debugPath = join(app.getPath('userData'), 'debug.txt');
    freezeWatchdog.init(debugPath);
  } catch (err) {
    logger.log('warn', 'main', `freeze-watchdog init failed: ${(err as Error).message}`);
  }
  freezeWatchdog.setMainOp('boot');
  // Spawn the parser worker pool so cheerio runs off the main thread.
  // Falls back to inline parseHtml automatically when init fails on a
  // constrained host (the pool's `parse()` rejects, the dispatch
  // helper below catches and falls back).
  try {
    parserPool.init();
  } catch (err) {
    logger.log(
      'warn',
      'main',
      `parser-pool init failed: ${(err as Error).message} — falling back to inline parseHtml.`,
    );
  }
  loadPrefs();
  rebuildMenu();
  registerIpc();
  createWindow();
  logger.log('info', 'main', `App ready — version ${app.getVersion()}`);
  freezeWatchdog.setMainOp('idle');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  activeCrawler?.stop();
  freezeWatchdog.setMainOp('shutdown');
  void freezeWatchdog.terminate();
  void parserPool.terminate();
  // Terminate the read-only worker BEFORE closing the writer connection.
  // Order matters on Windows: SQLite holds a file lock per connection
  // and the writer's WAL checkpoint at close-time can stall if a
  // reader is still mid-query.
  void dbReaderPool.terminate();
  void dbWriterPool.terminate();
  db?.close();
  db = null;
  flushPrefs();
  // Flush the disk log stream before exit so the last lines aren't lost
  // if the OS kills the process during a Quit-All cycle.
  logger.flushFileLogging();
  if (process.platform !== 'darwin') app.quit();
});
