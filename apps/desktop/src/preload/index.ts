import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
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
  type ExportXmlInput,
  type ExportXmlResult,
  type ExportBrokenLinksInput,
  type ExportBrokenLinksResult,
  type ExportTabularInput,
  type ExportTabularResult,
  type DataDeleteByDomainInput,
  type DataDeleteByDomainResult,
  type CrashRecoveryStatus,
  type ExportHtmlReportInput,
  type ExportHtmlReportResult,
  type BulkExportResult,
  type CompareLoadInput,
  type CompareLoadResult,
  type GraphSnapshotInput,
  type GraphSnapshotResult,
  type AnchorTextRow,
  type FreeCrawlApi,
  type BrokenLinksQueryInput,
  type BrokenLinksQueryResult,
  type ImagesQueryInput,
  type ImagesQueryResult,
  type LogEntry,
  type MenuEvent,
  type RobotsTestInput,
  type RobotsTestResult,
  type RobotsValidationIssue,
  type SitemapValidateInput,
  type SitemapValidateResult,
  type UrlRewritePreviewInput,
  type UrlRewritePreviewResult,
  type UrlClusterMember,
  type PagesPerDirectoryInput,
  type PagesPerDirectoryRow,
  type StatusCodeHistogramRow,
  type IndexabilityDistributionRow,
  type ContentKindDistributionRow,
  type DepthHistogramRow,
  type ResponseTimeHistogramRow,
  type TopUrlsInput,
  type TopUrlsRow,
  type ExternalDomainHealthRow,
  type AnalyticsCoverageRow,
  type LinkPositionRow,
  type ImageWeightRow,
  type BucketHistogramRow,
  type ServerHeaderRow,
  type TopWordsInput,
  type TopWordsRow,
  type WordCountPerDirectoryInput,
  type WordCountPerDirectoryRow,
  type SitemapOrphanRow,
  type SettingsExportInput,
  type SettingsExportResult,
  type SettingsImportResult,
  type ScheduleEntry,
  type ScheduleSpec,
  type IntegrationsState,
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
  type MemoryStats,
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
  crawlAddUrl: (url: string): Promise<{ accepted: boolean }> =>
    ipcRenderer.invoke(IPC.crawlAddUrl, url),
  projectSaveAs: (): Promise<{ filePath: string; bytesWritten: number } | null> =>
    ipcRenderer.invoke(IPC.projectSaveAs),
  projectOpen: (filePath?: string): Promise<{ filePath: string } | null> =>
    ipcRenderer.invoke(IPC.projectOpen, filePath),
  projectCurrentPath: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC.projectCurrentPath),
  urlsQuery: (input: UrlsQueryInput): Promise<UrlsQueryResult> =>
    ipcRenderer.invoke(IPC.urlsQuery, input),
  urlDetailGet: (input: UrlDetailInput): Promise<UrlDetail | null> =>
    ipcRenderer.invoke(IPC.urlDetailGet, input),
  urlSourceGet: (input: UrlSourceInput): Promise<UrlSourceResult> =>
    ipcRenderer.invoke(IPC.urlSourceGet, input),
  urlPageImages: (input: UrlPageImagesInput): Promise<UrlPageImagesResult> =>
    ipcRenderer.invoke(IPC.urlPageImages, input),
  urlCertInfo: (input: UrlCertInfoInput): Promise<UrlCertInfoResult> =>
    ipcRenderer.invoke(IPC.urlCertInfo, input),
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
  exportJson: (input: ExportJsonInput): Promise<ExportJsonResult> =>
    ipcRenderer.invoke(IPC.exportJson, input),
  exportXml: (input: ExportXmlInput): Promise<ExportXmlResult> =>
    ipcRenderer.invoke(IPC.exportXml, input),
  exportBrokenLinks: (
    input: ExportBrokenLinksInput,
  ): Promise<ExportBrokenLinksResult> =>
    ipcRenderer.invoke(IPC.exportBrokenLinks, input),
  exportTabular: (input: ExportTabularInput): Promise<ExportTabularResult> =>
    ipcRenderer.invoke(IPC.exportTabular, input),
  dataDeleteByDomain: (
    input: DataDeleteByDomainInput,
  ): Promise<DataDeleteByDomainResult> =>
    ipcRenderer.invoke(IPC.dataDeleteByDomain, input),
  crashRecoveryStatus: (): Promise<CrashRecoveryStatus> =>
    ipcRenderer.invoke(IPC.crashRecoveryStatus),
  crashRecoveryResume: (): Promise<{ accepted: boolean }> =>
    ipcRenderer.invoke(IPC.crashRecoveryResume),
  crashRecoveryDiscard: (): Promise<void> =>
    ipcRenderer.invoke(IPC.crashRecoveryDiscard),
  exportHtmlReport: (input: ExportHtmlReportInput): Promise<ExportHtmlReportResult> =>
    ipcRenderer.invoke(IPC.exportHtmlReport, input),
  exportBulk: (): Promise<BulkExportResult> => ipcRenderer.invoke(IPC.exportBulk),
  compareLoad: (input: CompareLoadInput): Promise<CompareLoadResult> =>
    ipcRenderer.invoke(IPC.compareLoad, input),
  graphSnapshot: (input: GraphSnapshotInput): Promise<GraphSnapshotResult> =>
    ipcRenderer.invoke(IPC.graphSnapshot, input),
  topAnchorTexts: (limit?: number): Promise<AnchorTextRow[]> =>
    ipcRenderer.invoke(IPC.topAnchorTexts, limit),
  sitemapGenerate: (input: SitemapGenerateInput): Promise<SitemapGenerateResult> =>
    ipcRenderer.invoke(IPC.sitemapGenerate, input),
  appVersion: (): Promise<string> => ipcRenderer.invoke(IPC.appVersion),
  memoryStats: (): Promise<MemoryStats> => ipcRenderer.invoke(IPC.memoryStats),
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
  robotsTest: (input: RobotsTestInput): Promise<RobotsTestResult> =>
    ipcRenderer.invoke(IPC.robotsTest, input),
  robotsValidate: (text: string): Promise<RobotsValidationIssue[]> =>
    ipcRenderer.invoke(IPC.robotsValidate, text),
  sitemapValidate: (input: SitemapValidateInput): Promise<SitemapValidateResult> =>
    ipcRenderer.invoke(IPC.sitemapValidate, input),
  urlRewritePreview: (
    input: UrlRewritePreviewInput,
  ): Promise<UrlRewritePreviewResult> => ipcRenderer.invoke(IPC.urlRewritePreview, input),
  urlClusterMembers: (urlId: number): Promise<UrlClusterMember[]> =>
    ipcRenderer.invoke(IPC.urlClusterMembers, urlId),
  reportsPagesPerDirectory: (
    input: PagesPerDirectoryInput,
  ): Promise<PagesPerDirectoryRow[]> => ipcRenderer.invoke(IPC.reportsPagesPerDirectory, input),
  reportsStatusCodeHistogram: (): Promise<StatusCodeHistogramRow[]> =>
    ipcRenderer.invoke(IPC.reportsStatusCodeHistogram),
  reportsIndexabilityDistribution: (): Promise<IndexabilityDistributionRow[]> =>
    ipcRenderer.invoke(IPC.reportsIndexabilityDistribution),
  reportsContentKindDistribution: (): Promise<ContentKindDistributionRow[]> =>
    ipcRenderer.invoke(IPC.reportsContentKindDistribution),
  reportsDepthHistogram: (): Promise<DepthHistogramRow[]> =>
    ipcRenderer.invoke(IPC.reportsDepthHistogram),
  reportsResponseTimeHistogram: (): Promise<ResponseTimeHistogramRow[]> =>
    ipcRenderer.invoke(IPC.reportsResponseTimeHistogram),
  reportsTopUrls: (input: TopUrlsInput): Promise<TopUrlsRow[]> =>
    ipcRenderer.invoke(IPC.reportsTopUrls, input),
  reportsExternalDomainHealth: (
    limit?: number,
  ): Promise<ExternalDomainHealthRow[]> =>
    ipcRenderer.invoke(IPC.reportsExternalDomainHealth, limit),
  reportsAnalyticsCoverage: (): Promise<AnalyticsCoverageRow[]> =>
    ipcRenderer.invoke(IPC.reportsAnalyticsCoverage),
  reportsLinkPositions: (): Promise<LinkPositionRow[]> =>
    ipcRenderer.invoke(IPC.reportsLinkPositions),
  reportsImageWeightPerPage: (limit?: number): Promise<ImageWeightRow[]> =>
    ipcRenderer.invoke(IPC.reportsImageWeightPerPage, limit),
  reportsInlinksHistogram: (): Promise<BucketHistogramRow[]> =>
    ipcRenderer.invoke(IPC.reportsInlinksHistogram),
  reportsWordCountHistogram: (): Promise<BucketHistogramRow[]> =>
    ipcRenderer.invoke(IPC.reportsWordCountHistogram),
  reportsUrlLengthHistogram: (): Promise<BucketHistogramRow[]> =>
    ipcRenderer.invoke(IPC.reportsUrlLengthHistogram),
  reportsWordCountPerDirectory: (
    input: WordCountPerDirectoryInput,
  ): Promise<WordCountPerDirectoryRow[]> =>
    ipcRenderer.invoke(IPC.reportsWordCountPerDirectory, input),
  reportsSitemapOrphans: (limit?: number): Promise<SitemapOrphanRow[]> =>
    ipcRenderer.invoke(IPC.reportsSitemapOrphans, limit),
  // Fire-and-forget — `send` not `invoke` because we don't need a
  // response and we want this to be cheap (≤ 1 ms per call, no wait).
  reportRendererLag: (lagMs: number) => {
    ipcRenderer.send(IPC.rendererLagReport, lagMs);
  },
  reportsServerHeaders: (): Promise<ServerHeaderRow[]> =>
    ipcRenderer.invoke(IPC.reportsServerHeaders),
  reportsTopWords: (input: TopWordsInput): Promise<TopWordsRow[]> =>
    ipcRenderer.invoke(IPC.reportsTopWords, input),
  prefsExportSettings: (input: SettingsExportInput): Promise<SettingsExportResult> =>
    ipcRenderer.invoke(IPC.prefsExportSettings, input),
  prefsImportSettings: (): Promise<SettingsImportResult> =>
    ipcRenderer.invoke(IPC.prefsImportSettings),
  scheduleGet: (): Promise<ScheduleEntry | null> => ipcRenderer.invoke(IPC.scheduleGet),
  scheduleSet: (spec: ScheduleSpec | null): Promise<ScheduleEntry | null> =>
    ipcRenderer.invoke(IPC.scheduleSet, spec),
  pickDirectory: (input?: { title?: string; defaultPath?: string }): Promise<string | null> =>
    ipcRenderer.invoke(IPC.pickDirectory, input),
  defaultProjectDir: (): Promise<string> => ipcRenderer.invoke(IPC.defaultProjectDir),
  integrationsGetAll: (): Promise<IntegrationsState> =>
    ipcRenderer.invoke(IPC.integrationsGetAll),
  integrationsSet: (
    id: string,
    fields: Record<string, string>,
  ): Promise<IntegrationsState> => ipcRenderer.invoke(IPC.integrationsSet, id, fields),
  integrationsClear: (id: string): Promise<IntegrationsState> =>
    ipcRenderer.invoke(IPC.integrationsClear, id),
  onLogEntry: (cb) => subscribe<LogEntry>(IPC.logsEntry, cb),
  onLogsBatch: (cb) => subscribe<LogEntry[]>(IPC.logsBatch, cb),
  onLogsBusy: (cb) => subscribe<boolean>(IPC.logsBusy, cb),
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
