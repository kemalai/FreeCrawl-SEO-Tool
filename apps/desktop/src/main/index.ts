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

const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let logsWindow: BrowserWindow | null = null;
let db: ProjectDb | null = null;
let activeCrawler: Crawler | null = null;

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

/** Currently-open project file path (empty when using the default scratch DB). */
let currentProjectPath = '';

function getDb(): ProjectDb {
  if (!db) {
    const dataDir = join(app.getPath('userData'), 'projects');
    mkdirSync(dataDir, { recursive: true });
    const defaultPath = join(dataDir, 'default.seoproject');
    db = new ProjectDb(defaultPath);
    currentProjectPath = '';
    // Fresh start on every app launch — clear any data carried over from
    // the previous session. Explicit Save Project will be added later.
    db.reset();
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
    }),
  );
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
    parent: mainWindow ?? undefined,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
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
}

function registerIpc(): void {
  ipcMain.handle(IPC.appVersion, () => app.getVersion());

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

  ipcMain.handle(
    IPC.reportsPagesPerDirectory,
    (_e, input: PagesPerDirectoryInput) =>
      getDb().getPagesPerDirectory({ depth: input.depth, limit: input.limit }),
  );

  ipcMain.handle(IPC.reportsStatusCodeHistogram, () => getDb().getStatusCodeHistogram());

  ipcMain.handle(IPC.reportsDepthHistogram, () => getDb().getDepthHistogram());

  ipcMain.handle(IPC.reportsResponseTimeHistogram, () =>
    getDb().getResponseTimeHistogram(),
  );

  ipcMain.handle(
    IPC.reportsTopUrls,
    (_e, input: TopUrlsInput): TopUrlsRow[] => {
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
      return getDb().topUrlsBy(column, limit);
    },
  );

  ipcMain.handle(
    IPC.reportsExternalDomainHealth,
    (_e, limit: number | undefined): ExternalDomainHealthRow[] =>
      getDb().externalDomainHealth(limit ?? 100),
  );

  ipcMain.handle(
    IPC.reportsAnalyticsCoverage,
    (): AnalyticsCoverageRow[] => getDb().analyticsCoverage(),
  );

  ipcMain.handle(
    IPC.reportsLinkPositions,
    (): LinkPositionRow[] => getDb().linkPositionBreakdown(),
  );

  ipcMain.handle(
    IPC.reportsImageWeightPerPage,
    (_e, limit: number | undefined): ImageWeightRow[] =>
      getDb().imageWeightPerPage(limit ?? 25),
  );

  ipcMain.handle(
    IPC.reportsInlinksHistogram,
    (): BucketHistogramRow[] => getDb().inlinksHistogram(),
  );

  ipcMain.handle(
    IPC.reportsWordCountHistogram,
    (): BucketHistogramRow[] => getDb().wordCountHistogram(),
  );

  ipcMain.handle(
    IPC.reportsServerHeaders,
    (): ServerHeaderRow[] => getDb().serverHeaderBreakdown(),
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

  // Stream every new entry to the logs window if it's open. Subscriber
  // is registered for the process lifetime — the log window can come
  // and go, we just check before sending.
  logger.subscribe((entry) => {
    if (logsWindow && !logsWindow.isDestroyed()) {
      logsWindow.webContents.send(IPC.logsEntry, entry);
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

  ipcMain.handle(IPC.crawlStart, (_e, config: CrawlConfig) => {
    if (activeCrawler) {
      activeCrawler.stop();
      logger.log('info', 'crawler', 'Stopped previous crawl before starting a new one');
    }
    logger.log(
      'info',
      'crawler',
      `Crawl starting: ${config.startUrl} (scope=${config.scope}, maxDepth=${config.maxDepth}, maxUrls=${config.maxUrls}, concurrency=${config.maxConcurrency}, rps=${config.maxRps})`,
    );
    const database = getDb();
    database.setMeta('lastStartUrl', config.startUrl);
    const crawler = new Crawler(config, database);
    activeCrawler = crawler;

    // Every event handler is gated by `activeCrawler === crawler`. A
    // stopped crawler can still emit late events (e.g. an in-flight
    // sitemap fetch resolving after Stop, or a queued done-event) — if
    // we forwarded those to the UI they'd clobber the new crawl's state
    // (the "pır pır" effect: rapid Running ↔ Done flicker).
    crawler.on('progress', (p: CrawlProgress) => {
      if (activeCrawler !== crawler) return;
      mainWindow?.webContents.send(IPC.crawlProgress, p);
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
      // OS-level toast — only when the window isn't focused, so the
      // user actually benefits (Electron suppresses the notification
      // sound on focused windows on most platforms anyway, but we
      // gate explicitly to avoid distracting users who're watching).
      if (Notification.isSupported() && !mainWindow?.isFocused()) {
        try {
          new Notification({
            title: 'FreeCrawl SEO Tool',
            body: `Crawl finished: ${summary.total.toLocaleString()} URLs · avg ${Math.round(summary.avgResponseTimeMs)} ms`,
            silent: false,
          }).show();
        } catch {
          // Notification can throw on some Linux distros without a
          // notification daemon. Swallow — the in-app done banner
          // already surfaces completion.
        }
      }
    });
    crawler.on('error', (msg: string) => {
      if (activeCrawler !== crawler) return;
      logger.log('error', 'crawler', msg);
      mainWindow?.webContents.send(IPC.crawlError, msg);
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
    getDb().reset();
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

  ipcMain.handle(IPC.urlsQuery, (_e, input: UrlsQueryInput): UrlsQueryResult => {
    return getDb().queryUrls({
      limit: input.limit,
      offset: input.offset,
      category: input.category ?? 'all',
      search: input.search,
      sortBy: input.sortBy as string | undefined,
      sortDir: input.sortDir,
      filter: input.filter,
    });
  });

  ipcMain.handle(IPC.overviewGet, (): OverviewCounts => {
    return getDb().getOverviewCounts();
  });

  ipcMain.handle(
    IPC.imagesQuery,
    (_e, input: ImagesQueryInput): ImagesQueryResult => {
      return getDb().queryImages({
        limit: input.limit,
        offset: input.offset,
        search: input.search,
        missingAltOnly: input.missingAltOnly,
        internalOnly: input.internalOnly,
      });
    },
  );

  ipcMain.handle(
    IPC.brokenLinksQuery,
    (_e, input: BrokenLinksQueryInput): BrokenLinksQueryResult => {
      return getDb().queryBrokenLinks({
        limit: input.limit,
        offset: input.offset,
        internal: input.internal,
        search: input.search,
      });
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

  ipcMain.handle(IPC.urlDetailGet, (_e, input: UrlDetailInput): UrlDetail | null => {
    return getDb().getUrlDetail(input.id, input.linkLimit ?? 500);
  });

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

  ipcMain.handle(IPC.summaryGet, (): CrawlSummary => {
    return getDb().getSummary();
  });

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

void app.whenReady().then(() => {
  loadPrefs();
  rebuildMenu();
  registerIpc();
  createWindow();
  logger.log('info', 'main', `App ready — version ${app.getVersion()}`);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  activeCrawler?.stop();
  db?.close();
  db = null;
  flushPrefs();
  if (process.platform !== 'darwin') app.quit();
});
