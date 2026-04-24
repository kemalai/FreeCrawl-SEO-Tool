import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import {
  IPC,
  type ConfirmClearResult,
  type CrawlConfig,
  type CrawlProgress,
  type CrawlSummary,
  type ExportCsvInput,
  type ExportCsvResult,
  type FreeCrawlApi,
  type BrokenLinksQueryInput,
  type BrokenLinksQueryResult,
  type ImagesQueryInput,
  type ImagesQueryResult,
  type LogEntry,
  type MenuEvent,
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

function subscribe<T>(
  channel: string,
  cb: (payload: T) => void,
): () => void {
  const listener = (_e: IpcRendererEvent, payload: T): void => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

// Hydrate preferences synchronously so the renderer never sees a flash of
// default layout before prefs load. Written via async IPC afterwards.
const prefsCache: Record<string, unknown> =
  (ipcRenderer.sendSync(IPC.prefsGetAllSync) as Record<string, unknown>) ?? {};

const api: FreeCrawlApi = {
  crawlStart: (config: CrawlConfig) => ipcRenderer.invoke(IPC.crawlStart, config),
  crawlStop: () => ipcRenderer.invoke(IPC.crawlStop),
  crawlPause: () => ipcRenderer.invoke(IPC.crawlPause),
  crawlResume: () => ipcRenderer.invoke(IPC.crawlResume),
  crawlClear: () => ipcRenderer.invoke(IPC.crawlClear),
  urlsQuery: (input: UrlsQueryInput): Promise<UrlsQueryResult> =>
    ipcRenderer.invoke(IPC.urlsQuery, input),
  urlDetailGet: (input: UrlDetailInput): Promise<UrlDetail | null> =>
    ipcRenderer.invoke(IPC.urlDetailGet, input),
  urlContextMenu: (input: UrlContextMenuInput): Promise<void> =>
    ipcRenderer.invoke(IPC.urlContextMenu, input),
  urlBulkContextMenu: (input: UrlBulkContextMenuInput): Promise<void> =>
    ipcRenderer.invoke(IPC.urlBulkContextMenu, input),
  imagesQuery: (input: ImagesQueryInput): Promise<ImagesQueryResult> =>
    ipcRenderer.invoke(IPC.imagesQuery, input),
  brokenLinksQuery: (input: BrokenLinksQueryInput): Promise<BrokenLinksQueryResult> =>
    ipcRenderer.invoke(IPC.brokenLinksQuery, input),
  overviewGet: (): Promise<OverviewCounts> => ipcRenderer.invoke(IPC.overviewGet),
  summaryGet: (): Promise<CrawlSummary> => ipcRenderer.invoke(IPC.summaryGet),
  exportCsv: (input: ExportCsvInput): Promise<ExportCsvResult> =>
    ipcRenderer.invoke(IPC.exportCsv, input),
  sitemapGenerate: (input: SitemapGenerateInput): Promise<SitemapGenerateResult> =>
    ipcRenderer.invoke(IPC.sitemapGenerate, input),
  appVersion: (): Promise<string> => ipcRenderer.invoke(IPC.appVersion),
  prefsGetAll: () => ({ ...prefsCache }),
  prefsGet: (key) => prefsCache[key],
  prefsSet: (key, value) => {
    prefsCache[key] = value;
    void ipcRenderer.invoke(IPC.prefsSet, key, value);
  },
  prefsDelete: (key) => {
    delete prefsCache[key];
    void ipcRenderer.invoke(IPC.prefsDelete, key);
  },
  confirmClear: (): Promise<ConfirmClearResult> => ipcRenderer.invoke(IPC.confirmClear),
  logsGetAll: (): Promise<LogEntry[]> => ipcRenderer.invoke(IPC.logsGetAll),
  logsClear: (): Promise<void> => ipcRenderer.invoke(IPC.logsClear),
  logsOpenWindow: (): Promise<void> => ipcRenderer.invoke(IPC.logsOpenWindow),
  onLogEntry: (cb) => subscribe<LogEntry>(IPC.logsEntry, cb),
  onProgress: (cb) => subscribe<CrawlProgress>(IPC.crawlProgress, cb),
  onDone: (cb) => subscribe<CrawlSummary>(IPC.crawlDone, cb),
  onError: (cb) => subscribe<string>(IPC.crawlError, cb),
  onMenuEvent: (cb) => subscribe<MenuEvent>(IPC.menuEvent, cb),
  onDataChanged: (cb) => {
    const listener = (): void => cb();
    ipcRenderer.on(IPC.dataChanged, listener);
    return () => ipcRenderer.removeListener(IPC.dataChanged, listener);
  },
};

contextBridge.exposeInMainWorld('freecrawl', api);
