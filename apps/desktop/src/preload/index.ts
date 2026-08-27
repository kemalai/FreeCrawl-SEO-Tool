import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import {
  IPC,
  type BridgeSessionInfo,
  type BrowserInstallState,
  type ConfirmClearResult,
  type CrawlConfig,
  type RecentProject,
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
  type ExportImagesInput,
  type ExportImagesResult,
  type ExportTabularInput,
  type ExportTabularResult,
  type ExportGridInput,
  type ExportGridResult,
  type DataDeleteByDomainInput,
  type DataDeleteByDomainResult,
  type CrashRecoveryResumeResult,
  type CrashRecoveryStatus,
  type ExportHtmlReportInput,
  type ExportHtmlReportResult,
  type BulkExportResult,
  type CompareLoadInput,
  type CompareLoadResult,
  type GraphSnapshotInput,
  type GraphSnapshotResult,
  type CrawlPathInput,
  type CrawlPathResult,
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
  type CustomExtractionRule,
  type ExtractionPreviewInput,
  type ExtractionPreviewResult,
  type ExtractionRulesExportResult,
  type ExtractionRulesImportResult,
  type UrlClusterMember,
  type DuplicateClusterRow,
  type DuplicateClustersListInput,
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
  type OrphanCrossSourceRow,
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
  type UrlGridContextMenuInput,
  type UrlGridCopyEvent,
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
  type PagespeedQueryInput,
  type PagespeedQueryResult,
  type PagespeedRunInput,
  type PagespeedRunResult,
  type PagespeedProgress,
  type CruxQueryInput,
  type CruxQueryResult,
  type CruxRunInput,
  type CruxRunResult,
  type CruxProgress,
  type SpellingQueryInput,
  type SpellingQueryResult,
  type SpellingRunInput,
  type SpellingRunResult,
  type SpellingProgress,
  type SpellingMatchesResult,
  type SpellingLanguageOption,
  type GoogleAuthState,
  type GoogleAccount,
  type GoogleAuthResult,
  type GscListSitesResult,
  type GscFetchInput,
  type GscFetchResult,
  type GscQueryInput,
  type GscQueryResult,
  type GscCrawlNewUrlsResult,
  type Ga4ListPropertiesResult,
  type Ga4FetchInput,
  type Ga4FetchResult,
  type Ga4QueryInput,
  type Ga4QueryResult,
  type AiRunInput,
  type AiRunResult,
  type AiQueryInput,
  type AiQueryResult,
  type AiProgress,
  type SeoRunInput,
  type SeoRunResult,
  type SeoQueryInput,
  type SeoQueryResult,
  type SeoProgress,
  type GscInspectRunInput,
  type GscInspectRunResult,
  type GscInspectProgress,
  type ExportSheetsInput,
  type ExportSheetsResult,
  type ExportBigqueryInput,
  type ExportBigqueryResult,
  type UrlAnalyticsDetail,
  type LogAnalyzeInput,
  type LogAnalyzeResult,
  type LogOverview,
  type LogUrlStatsInput,
  type LogUrlStatsResult,
  type LogBotRow,
  type LogStatusRow,
  type LogTrendRow,
  type LogCrawlBudgetRow,
  type LogDiscoveryRow,
  type LogSeedDiscoveryResult,
  type LogExportInput,
  type LogExportResult,
  type LogThreatsInput,
  type LogThreatsResult,
  type LogThreatSummary,
  type LogThreatIpRow,
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
  projectSave: (): Promise<{ filePath: string; bytesWritten: number } | null> =>
    ipcRenderer.invoke(IPC.projectSave),
  projectOpen: (filePath?: string): Promise<{ filePath: string } | null> =>
    ipcRenderer.invoke(IPC.projectOpen, filePath),
  projectCurrentPath: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC.projectCurrentPath),
  projectConfigGet: (): Promise<CrawlConfig | null> =>
    ipcRenderer.invoke(IPC.projectConfigGet),
  projectConfigSet: (config: CrawlConfig): Promise<void> =>
    ipcRenderer.invoke(IPC.projectConfigSet, config),
  onProjectConfigChanged: (cb: (config: CrawlConfig | null) => void) =>
    subscribe<CrawlConfig | null>(IPC.projectConfigChanged, cb),
  browserInstallGet: (): Promise<BrowserInstallState> =>
    ipcRenderer.invoke(IPC.browserInstallGet),
  browserInstallStart: (): Promise<BrowserInstallState> =>
    ipcRenderer.invoke(IPC.browserInstallStart),
  onBrowserInstallState: (cb: (state: BrowserInstallState) => void) =>
    subscribe<BrowserInstallState>(IPC.browserInstallState, cb),
  agentsList: (): Promise<BridgeSessionInfo[]> =>
    ipcRenderer.invoke(IPC.agentsList),
  agentsClose: (sessionId: string): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke(IPC.agentsClose, sessionId),
  onAgentsChanged: (cb: () => void) =>
    subscribe<void>(IPC.agentsChanged, () => cb()),
  recentProjectsList: (): Promise<RecentProject[]> =>
    ipcRenderer.invoke(IPC.recentProjectsList),
  recentProjectSetArchived: (path: string, archived: boolean): Promise<void> =>
    ipcRenderer.invoke(IPC.recentProjectSetArchived, path, archived),
  recentProjectSetTags: (path: string, tags: string[]): Promise<void> =>
    ipcRenderer.invoke(IPC.recentProjectSetTags, path, tags),
  recentProjectRemove: (path: string): Promise<void> =>
    ipcRenderer.invoke(IPC.recentProjectRemove, path),
  projectSaveEncrypted: (
    password: string,
  ): Promise<{ filePath: string; bytesWritten: number } | { error: string } | null> =>
    ipcRenderer.invoke(IPC.projectSaveEncrypted, password),
  projectOpenEncrypted: (
    password: string,
  ): Promise<{ filePath: string } | { error: string } | null> =>
    ipcRenderer.invoke(IPC.projectOpenEncrypted, password),
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
  urlGridContextMenu: (input: UrlGridContextMenuInput): Promise<void> =>
    ipcRenderer.invoke(IPC.urlGridContextMenu, input),
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
  exportImages: (input: ExportImagesInput): Promise<ExportImagesResult> =>
    ipcRenderer.invoke(IPC.exportImages, input),
  exportTabular: (input: ExportTabularInput): Promise<ExportTabularResult> =>
    ipcRenderer.invoke(IPC.exportTabular, input),
  exportGrid: (input: ExportGridInput): Promise<ExportGridResult> =>
    ipcRenderer.invoke(IPC.exportGrid, input),
  dataDeleteByDomain: (
    input: DataDeleteByDomainInput,
  ): Promise<DataDeleteByDomainResult> =>
    ipcRenderer.invoke(IPC.dataDeleteByDomain, input),
  crashRecoveryStatus: (): Promise<CrashRecoveryStatus> =>
    ipcRenderer.invoke(IPC.crashRecoveryStatus),
  crashRecoveryResume: (): Promise<CrashRecoveryResumeResult> =>
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
  crawlPath: (input: CrawlPathInput): Promise<CrawlPathResult> =>
    ipcRenderer.invoke(IPC.crawlPath, input),
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
  logsGetAll: (ownerId?: number): Promise<LogEntry[]> =>
    ipcRenderer.invoke(IPC.logsGetAll, ownerId),
  logsClear: (): Promise<void> => ipcRenderer.invoke(IPC.logsClear),
  clipboardWriteText: (text: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.clipboardWriteText, text),
  logsOpenWindow: (): Promise<void> => ipcRenderer.invoke(IPC.logsOpenWindow),
  openVisualizationWindow: (): Promise<void> =>
    ipcRenderer.invoke(IPC.visualizationOpenWindow),
  readScreenshot: (absolutePath: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC.screenshotRead, absolutePath),
  robotsTest: (input: RobotsTestInput): Promise<RobotsTestResult> =>
    ipcRenderer.invoke(IPC.robotsTest, input),
  robotsValidate: (text: string): Promise<RobotsValidationIssue[]> =>
    ipcRenderer.invoke(IPC.robotsValidate, text),
  sitemapValidate: (input: SitemapValidateInput): Promise<SitemapValidateResult> =>
    ipcRenderer.invoke(IPC.sitemapValidate, input),
  urlRewritePreview: (
    input: UrlRewritePreviewInput,
  ): Promise<UrlRewritePreviewResult> => ipcRenderer.invoke(IPC.urlRewritePreview, input),
  extractionPreview: (
    input: ExtractionPreviewInput,
  ): Promise<ExtractionPreviewResult> =>
    ipcRenderer.invoke(IPC.extractionPreview, input),
  extractionRulesExport: (
    rules: CustomExtractionRule[],
  ): Promise<ExtractionRulesExportResult> =>
    ipcRenderer.invoke(IPC.extractionRulesExport, rules),
  extractionRulesImport: (): Promise<ExtractionRulesImportResult> =>
    ipcRenderer.invoke(IPC.extractionRulesImport),
  urlClusterMembers: (urlId: number): Promise<UrlClusterMember[]> =>
    ipcRenderer.invoke(IPC.urlClusterMembers, urlId),
  duplicateClustersList: (
    input: DuplicateClustersListInput,
  ): Promise<DuplicateClusterRow[]> =>
    ipcRenderer.invoke(IPC.duplicateClustersList, input),
  duplicateClustersCount: (): Promise<number> =>
    ipcRenderer.invoke(IPC.duplicateClustersCount),
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
  reportsOrphanCrossSource: (limit?: number): Promise<OrphanCrossSourceRow[]> =>
    ipcRenderer.invoke(IPC.reportsOrphanCrossSource, limit),
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
  storageModeActive: (): Promise<'disk' | 'ram'> =>
    ipcRenderer.invoke(IPC.storageModeActive),
  integrationsGetAll: (): Promise<IntegrationsState> =>
    ipcRenderer.invoke(IPC.integrationsGetAll),
  integrationsSet: (
    id: string,
    fields: Record<string, string>,
  ): Promise<IntegrationsState> => ipcRenderer.invoke(IPC.integrationsSet, id, fields),
  integrationsClear: (id: string): Promise<IntegrationsState> =>
    ipcRenderer.invoke(IPC.integrationsClear, id),
  integrationSettingsGet: (
    id: string,
  ): Promise<Record<string, unknown> | null> =>
    ipcRenderer.invoke(IPC.integrationSettingsGet, id),
  integrationSettingsSet: (
    id: string,
    settings: Record<string, unknown>,
  ): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke(IPC.integrationSettingsSet, id, settings),
  pagespeedQuery: (input: PagespeedQueryInput): Promise<PagespeedQueryResult> =>
    ipcRenderer.invoke(IPC.pagespeedQuery, input),
  pagespeedRun: (input: PagespeedRunInput): Promise<PagespeedRunResult> =>
    ipcRenderer.invoke(IPC.pagespeedRun, input),
  pagespeedCancel: (): Promise<void> => ipcRenderer.invoke(IPC.pagespeedCancel),
  onPagespeedProgress: (cb) =>
    subscribe<PagespeedProgress>(IPC.pagespeedProgress, cb),
  cruxQuery: (input: CruxQueryInput): Promise<CruxQueryResult> =>
    ipcRenderer.invoke(IPC.cruxQuery, input),
  cruxRun: (input: CruxRunInput): Promise<CruxRunResult> =>
    ipcRenderer.invoke(IPC.cruxRun, input),
  cruxCancel: (): Promise<void> => ipcRenderer.invoke(IPC.cruxCancel),
  onCruxProgress: (cb) => subscribe<CruxProgress>(IPC.cruxProgress, cb),
  spellingQuery: (input: SpellingQueryInput): Promise<SpellingQueryResult> =>
    ipcRenderer.invoke(IPC.spellingQuery, input),
  spellingRun: (input: SpellingRunInput): Promise<SpellingRunResult> =>
    ipcRenderer.invoke(IPC.spellingRun, input),
  spellingCancel: (): Promise<void> => ipcRenderer.invoke(IPC.spellingCancel),
  onSpellingProgress: (cb) =>
    subscribe<SpellingProgress>(IPC.spellingProgress, cb),
  spellingMatches: (url: string): Promise<SpellingMatchesResult | null> =>
    ipcRenderer.invoke(IPC.spellingMatches, url),
  spellingLanguages: (): Promise<SpellingLanguageOption[]> =>
    ipcRenderer.invoke(IPC.spellingLanguages),
  googleAuthStart: (id: string): Promise<GoogleAuthResult> =>
    ipcRenderer.invoke(IPC.googleAuthStart, id),
  googleAuthStatus: (id: string): Promise<GoogleAuthState> =>
    ipcRenderer.invoke(IPC.googleAuthStatus, id),
  googleAuthRevoke: (id: string, accountId?: string): Promise<GoogleAuthState> =>
    ipcRenderer.invoke(IPC.googleAuthRevoke, id, accountId),
  gscListSites: (accountId?: string): Promise<GscListSitesResult> =>
    ipcRenderer.invoke(IPC.gscListSites, accountId),
  googleAccountsList: (integrationId: string): Promise<GoogleAccount[]> =>
    ipcRenderer.invoke(IPC.googleAccountsList, integrationId),
  gscFetch: (input: GscFetchInput): Promise<GscFetchResult> =>
    ipcRenderer.invoke(IPC.gscFetch, input),
  gscQuery: (input: GscQueryInput): Promise<GscQueryResult> =>
    ipcRenderer.invoke(IPC.gscQuery, input),
  gscCrawlNewUrls: (): Promise<GscCrawlNewUrlsResult> =>
    ipcRenderer.invoke(IPC.gscCrawlNewUrls),
  ga4ListProperties: (accountId?: string): Promise<Ga4ListPropertiesResult> =>
    ipcRenderer.invoke(IPC.ga4ListProperties, accountId),
  ga4Fetch: (input: Ga4FetchInput): Promise<Ga4FetchResult> =>
    ipcRenderer.invoke(IPC.ga4Fetch, input),
  ga4Query: (input: Ga4QueryInput): Promise<Ga4QueryResult> =>
    ipcRenderer.invoke(IPC.ga4Query, input),
  aiRun: (input: AiRunInput): Promise<AiRunResult> =>
    ipcRenderer.invoke(IPC.aiRun, input),
  aiCancel: (): Promise<void> => ipcRenderer.invoke(IPC.aiCancel),
  aiQuery: (input: AiQueryInput): Promise<AiQueryResult> =>
    ipcRenderer.invoke(IPC.aiQuery, input),
  onAiProgress: (cb) => subscribe<AiProgress>(IPC.aiProgress, cb),
  seoRun: (input: SeoRunInput): Promise<SeoRunResult> =>
    ipcRenderer.invoke(IPC.seoRun, input),
  seoCancel: (): Promise<void> => ipcRenderer.invoke(IPC.seoCancel),
  seoQuery: (input: SeoQueryInput): Promise<SeoQueryResult> =>
    ipcRenderer.invoke(IPC.seoQuery, input),
  onSeoProgress: (cb) => subscribe<SeoProgress>(IPC.seoProgress, cb),
  gscInspectRun: (input: GscInspectRunInput): Promise<GscInspectRunResult> =>
    ipcRenderer.invoke(IPC.gscInspectRun, input),
  gscInspectCancel: (): Promise<void> => ipcRenderer.invoke(IPC.gscInspectCancel),
  onGscInspectProgress: (cb) =>
    subscribe<GscInspectProgress>(IPC.gscInspectProgress, cb),
  exportSheets: (input: ExportSheetsInput): Promise<ExportSheetsResult> =>
    ipcRenderer.invoke(IPC.exportSheets, input),
  exportBigquery: (input: ExportBigqueryInput): Promise<ExportBigqueryResult> =>
    ipcRenderer.invoke(IPC.exportBigquery, input),
  urlAnalyticsGet: (url: string): Promise<UrlAnalyticsDetail | null> =>
    ipcRenderer.invoke(IPC.urlAnalyticsGet, url),
  logAnalyzerOpenWindow: (): Promise<void> =>
    ipcRenderer.invoke(IPC.logAnalyzerOpenWindow),
  logAnalyze: (input: LogAnalyzeInput): Promise<LogAnalyzeResult> =>
    ipcRenderer.invoke(IPC.logAnalyze, input),
  logOverview: (): Promise<LogOverview> => ipcRenderer.invoke(IPC.logOverview),
  logUrlStats: (input: LogUrlStatsInput): Promise<LogUrlStatsResult> =>
    ipcRenderer.invoke(IPC.logUrlStats, input),
  logBots: (): Promise<LogBotRow[]> => ipcRenderer.invoke(IPC.logBots),
  logStatus: (): Promise<LogStatusRow[]> => ipcRenderer.invoke(IPC.logStatus),
  logTrend: (): Promise<LogTrendRow[]> => ipcRenderer.invoke(IPC.logTrend),
  logCrawlBudget: (limit?: number): Promise<LogCrawlBudgetRow[]> =>
    ipcRenderer.invoke(IPC.logCrawlBudget, limit),
  logOrphans: (input: LogUrlStatsInput): Promise<LogUrlStatsResult> =>
    ipcRenderer.invoke(IPC.logOrphans, input),
  logDiscovery: (limit?: number): Promise<LogDiscoveryRow[]> =>
    ipcRenderer.invoke(IPC.logDiscovery, limit),
  logSeedDiscovery: (limit?: number): Promise<LogSeedDiscoveryResult> =>
    ipcRenderer.invoke(IPC.logSeedDiscovery, limit),
  logExport: (input: LogExportInput): Promise<LogExportResult> =>
    ipcRenderer.invoke(IPC.logExport, input),
  logClear: (): Promise<void> => ipcRenderer.invoke(IPC.logClear),
  logThreats: (input: LogThreatsInput): Promise<LogThreatsResult> =>
    ipcRenderer.invoke(IPC.logThreats, input),
  logThreatSummary: (): Promise<LogThreatSummary> => ipcRenderer.invoke(IPC.logThreatSummary),
  logThreatIps: (limit?: number): Promise<LogThreatIpRow[]> =>
    ipcRenderer.invoke(IPC.logThreatIps, limit),
  onLogEntry: (cb) => subscribe<LogEntry>(IPC.logsEntry, cb),
  onLogsBatch: (cb) => subscribe<LogEntry[]>(IPC.logsBatch, cb),
  onLogsBusy: (cb) => subscribe<boolean>(IPC.logsBusy, cb),
  onProgress: (cb) => subscribe<CrawlProgress>(IPC.crawlProgress, cb),
  onDone: (cb) => subscribe<CrawlSummary>(IPC.crawlDone, cb),
  onError: (cb) => subscribe<string>(IPC.crawlError, cb),
  onMenuEvent: (cb) => subscribe<MenuEvent>(IPC.menuEvent, cb),
  onUrlGridCopy: (cb) => subscribe<UrlGridCopyEvent>(IPC.urlGridCopy, cb),
  editCopyNative: (): Promise<void> => ipcRenderer.invoke(IPC.editCopyNative),
  onDataChanged: (cb) => {
    const listener = (): void => cb();
    ipcRenderer.on(IPC.dataChanged, listener);
    return () => ipcRenderer.removeListener(IPC.dataChanged, listener);
  },
};

contextBridge.exposeInMainWorld('freecrawl', api);
