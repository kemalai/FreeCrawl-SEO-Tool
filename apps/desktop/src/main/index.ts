import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
import {
  IPC,
  type CrawlConfig,
  type CrawlProgress,
  type CrawlSummary,
  type ExportCsvInput,
  type ExportCsvResult,
  type UrlsQueryInput,
  type UrlsQueryResult,
} from '@freecrawl/shared-types';
import { Crawler, exportUrlsToCsv } from '@freecrawl/core';
import { ProjectDb } from '@freecrawl/db';

const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let db: ProjectDb | null = null;
let activeCrawler: Crawler | null = null;

function getDb(): ProjectDb {
  if (!db) {
    const dataDir = join(app.getPath('userData'), 'projects');
    mkdirSync(dataDir, { recursive: true });
    db = new ProjectDb(join(dataDir, 'default.seoproject'));
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
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0a',
    title: 'FreeCrawl SEO',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => mainWindow?.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function registerIpc(): void {
  ipcMain.handle(IPC.appVersion, () => app.getVersion());

  ipcMain.handle(IPC.crawlStart, async (_e, config: CrawlConfig) => {
    if (activeCrawler) {
      activeCrawler.stop();
    }
    const database = getDb();
    const crawler = new Crawler(config, database);
    activeCrawler = crawler;

    crawler.on('progress', (p: CrawlProgress) => {
      mainWindow?.webContents.send(IPC.crawlProgress, p);
    });
    crawler.on('done', (summary: CrawlSummary) => {
      mainWindow?.webContents.send(IPC.crawlDone, summary);
      if (activeCrawler === crawler) activeCrawler = null;
    });
    crawler.on('error', (msg: string) => {
      mainWindow?.webContents.send(IPC.crawlError, msg);
    });

    void crawler.start();
  });

  ipcMain.handle(IPC.crawlStop, () => {
    activeCrawler?.stop();
  });

  ipcMain.handle(IPC.urlsQuery, (_e, input: UrlsQueryInput): UrlsQueryResult => {
    return getDb().queryUrls({
      limit: input.limit,
      offset: input.offset,
      filter: input.filter ?? 'all',
      search: input.search,
      sortBy: input.sortBy as string | undefined,
      sortDir: input.sortDir,
    });
  });

  ipcMain.handle(IPC.summaryGet, (): CrawlSummary => {
    return getDb().getSummary();
  });

  ipcMain.handle(
    IPC.exportCsv,
    async (_e, input: ExportCsvInput): Promise<ExportCsvResult> => {
      let filePath = input.filePath;
      if (!filePath) {
        const res = await dialog.showSaveDialog(mainWindow!, {
          defaultPath: 'freecrawl-export.csv',
          filters: [{ name: 'CSV', extensions: ['csv'] }],
        });
        if (res.canceled || !res.filePath) {
          return { filePath: '', rowsWritten: 0 };
        }
        filePath = res.filePath;
      }
      const { rowsWritten } = await exportUrlsToCsv(getDb(), filePath);
      return { filePath, rowsWritten };
    },
  );
}

void app.whenReady().then(() => {
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  activeCrawler?.stop();
  db?.close();
  db = null;
  if (process.platform !== 'darwin') app.quit();
});
