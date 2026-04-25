import {
  app,
  BrowserWindow,
  clipboard,
  ipcMain,
  dialog,
  Menu,
  shell,
  type MenuItemConstructorOptions,
} from 'electron';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import {
  IPC,
  type ConfirmClearResult,
  type CrawlConfig,
  type CrawlProgress,
  type CrawlSummary,
  type ExportCsvInput,
  type ExportCsvResult,
  type ExportJsonInput,
  type ExportJsonResult,
  type RobotsTestInput,
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
  type UrlsQueryInput,
  type UrlsQueryResult,
} from '@freecrawl/shared-types';
import {
  Crawler,
  exportUrlsToCsv,
  exportUrlsToJson,
  exportSitemap,
  testUrlAgainstRobots,
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

function getDb(): ProjectDb {
  if (!db) {
    const dataDir = join(app.getPath('userData'), 'projects');
    mkdirSync(dataDir, { recursive: true });
    db = new ProjectDb(join(dataDir, 'default.seoproject'));
    // Fresh start on every app launch — clear any data carried over from
    // the previous session. Explicit Save Project will be added later.
    db.reset();
  }
  return db;
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
  // the macOS native behaviour).
  mainWindow.webContents.on('before-input-event', (_e, input) => {
    if (input.type === 'keyDown' && input.key === 'Escape' && mainWindow?.isFullScreen()) {
      mainWindow.setFullScreen(false);
    }
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
    testUrlAgainstRobots(input.url, input.userAgent),
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
    const crawler = new Crawler(config, database);
    activeCrawler = crawler;

    crawler.on('progress', (p: CrawlProgress) => {
      mainWindow?.webContents.send(IPC.crawlProgress, p);
    });
    crawler.on('done', (summary: CrawlSummary) => {
      logger.log(
        'info',
        'crawler',
        `Crawl done: total=${summary.total} avgResp=${summary.avgResponseTimeMs}ms totalBytes=${summary.totalBytes}`,
      );
      mainWindow?.webContents.send(IPC.crawlDone, summary);
      if (activeCrawler === crawler) activeCrawler = null;
    });
    crawler.on('error', (msg: string) => {
      logger.log('error', 'crawler', msg);
      mainWindow?.webContents.send(IPC.crawlError, msg);
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

  ipcMain.handle(
    IPC.sitemapGenerate,
    async (_e, input: SitemapGenerateInput): Promise<SitemapGenerateResult> => {
      let filePath = input.filePath;
      if (!filePath) {
        const res = await dialog.showSaveDialog(mainWindow!, {
          defaultPath: 'sitemap.xml',
          filters: [{ name: 'XML Sitemap', extensions: ['xml'] }],
        });
        if (res.canceled || !res.filePath) {
          return { filePath: '', urlsWritten: 0, truncated: false };
        }
        filePath = res.filePath;
      }
      const { urlsWritten, truncated } = await exportSitemap(getDb(), filePath);
      if (mainWindow) {
        await dialog.showMessageBox(mainWindow, {
          type: truncated ? 'warning' : 'info',
          title: 'Sitemap Generated',
          message: truncated
            ? `Sitemap written with ${urlsWritten.toLocaleString()} URLs (truncated at the 50,000 limit).`
            : `Sitemap written with ${urlsWritten.toLocaleString()} URLs.`,
          detail: filePath,
          buttons: ['OK'],
          noLink: true,
        });
      }
      return { filePath, urlsWritten, truncated };
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
  Menu.setApplicationMenu(buildAppMenu({ onOpenLogs: openLogsWindow }));
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
