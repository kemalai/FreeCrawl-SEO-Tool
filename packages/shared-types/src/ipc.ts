import type {
  AdvancedFilter,
  BrokenLinkRow,
  CrawlConfig,
  CrawlProgress,
  CrawlSummary,
  CrawlUrlRow,
  DuplicateClusterRow,
  DuplicateClustersListInput,
  CustomExtractionRule,
  ExtractionPreviewInput,
  ExtractionPreviewResult,
  ExtractionRulesExportResult,
  ExtractionRulesImportResult,
  ImageRow,
  Indexability,
  OverviewCounts,
  UrlCategory,
  UrlDetail,
} from './crawl.js';
import type { IntegrationsState } from './integrations.js';
import type {
  PagespeedRow,
  PagespeedRunStrategy,
} from './pagespeed.js';
import type { CruxRow, CruxRunFormFactor } from './crux.js';
import type { SpellingMatch, SpellingRow } from './spelling.js';
import type { RecentProject } from './project.js';
import type {
  GoogleAuthState,
  GoogleAuthResult,
  GscSite,
  GscRow,
  GscFetchMeta,
  Ga4Property,
  Ga4Row,
  Ga4FetchMeta,
  UrlAnalyticsDetail,
} from './google.js';
import type { AiProvider, AiRow } from './ai.js';
import type { SeoProvider, SeoRow } from './seo.js';
import type {
  LogAnalyzeInput,
  LogAnalyzeResult,
  LogOverview,
  LogUrlStatsInput,
  LogUrlStatsResult,
  LogBotRow,
  LogStatusRow,
  LogTrendRow,
  LogCrawlBudgetRow,
  LogOrphanRow,
  LogDiscoveryRow,
  LogSeedDiscoveryResult,
  LogExportInput,
  LogExportResult,
} from './loganalyzer.js';

export const IPC = {
  crawlStart: 'crawl:start',
  crawlStop: 'crawl:stop',
  crawlPause: 'crawl:pause',
  crawlResume: 'crawl:resume',
  crawlClear: 'crawl:clear',
  crawlAddUrl: 'crawl:add-url',
  projectSaveAs: 'project:save-as',
  projectOpen: 'project:open',
  projectCurrentPath: 'project:current-path',
  /** Per-project crawl config. `projectConfigGet` reads the active
   *  project's saved `CrawlConfig` (null on the default scratch DB, where
   *  global prefs apply); `projectConfigSet` persists edits to the active
   *  project's `project_meta.lastCrawlConfig`; `projectConfigChanged` is
   *  pushed main→renderer when a project opens so the UI rehydrates. */
  projectConfigGet: 'project:config-get',
  projectConfigSet: 'project:config-set',
  projectConfigChanged: 'project:config-changed',
  /** Recent-projects management (archiving / tagging). `recentProjectsList`
   *  returns the full list incl. archived; the mutators toggle the archived
   *  flag, replace tags, or drop an entry. */
  recentProjectsList: 'project:recent-list',
  recentProjectSetArchived: 'project:recent-set-archived',
  recentProjectSetTags: 'project:recent-set-tags',
  recentProjectRemove: 'project:recent-remove',
  /** V1 #4 — Save an AES-256-GCM-encrypted snapshot of the active
   *  `.seoproject` file. Renderer provides the password; main shows a
   *  save dialog for the destination `.seoproject.enc` path. */
  projectSaveEncrypted: 'project:save-encrypted',
  /** V1 #4 — Open an encrypted snapshot. Renderer provides the password;
   *  main shows an open dialog for the source `.seoproject.enc`, asks
   *  for a destination `.seoproject` path, decrypts, and opens it. */
  projectOpenEncrypted: 'project:open-encrypted',
  crawlProgress: 'crawl:progress',
  crawlDone: 'crawl:done',
  crawlError: 'crawl:error',
  urlsQuery: 'urls:query',
  urlDetailGet: 'urls:detail',
  urlSourceGet: 'urls:source',
  urlPageImages: 'urls:page-images',
  urlCertInfo: 'urls:cert-info',
  urlContextMenu: 'url:context-menu',
  urlBulkContextMenu: 'url:bulk-context-menu',
  imagesQuery: 'images:query',
  brokenLinksQuery: 'broken-links:query',
  overviewGet: 'overview:get',
  summaryGet: 'summary:get',
  exportCsv: 'export:csv',
  exportJson: 'export:json',
  exportXml: 'export:xml',
  /** Export the Broken Links tab to a CSV file. Honours the tab's
   *  internal/external scope filter. */
  exportBrokenLinks: 'export:broken-links',
  /** Export the Images tab to CSV. Honours the missing-alt scope
   *  filter so what the user sees is what they get. */
  exportImages: 'export:images',
  /** New unified tabular export with column selection + multi-tab support
   * (CSV / XLSX). Backs the in-table "Export" button. */
  exportTabular: 'export:tabular',
  /** GDPR-aligned per-domain delete. Wipes every row whose URL host
   * matches the given domain (and that domain's links/images/headers/
   * url_sources). Used by Settings → "Delete Domain Data". */
  dataDeleteByDomain: 'data:delete-by-domain',
  /** Wave 6 — Crash-recovery surface. Renderer asks the main process
   * whether the previous session left a non-empty `crawl_queue` table;
   * the response carries the seed URL + count so the user can be
   * shown a clear "Resume crawl of X (240 pending)?" prompt. */
  crashRecoveryStatus: 'crash:recovery-status',
  /** Trigger a resume — main process re-creates the Crawler with the
   * previously-saved start URL and enqueues the checkpointed pending
   * items at their original depth before kicking off the queue. */
  crashRecoveryResume: 'crash:recovery-resume',
  /** Discard the checkpoint without resuming. */
  crashRecoveryDiscard: 'crash:recovery-discard',
  exportHtmlReport: 'export:html-report',
  exportBulk: 'export:bulk',
  compareLoad: 'compare:load',
  graphSnapshot: 'graph:snapshot',
  crawlPath: 'graph:crawl-path',
  topAnchorTexts: 'graph:anchor-texts',
  sitemapGenerate: 'sitemap:generate',
  menuEvent: 'menu:event',
  dataChanged: 'data:changed',
  appVersion: 'app:version',
  /** Returns live process + system memory stats for the in-app
   * memory monitor (status bar). One-shot pull; renderer polls. */
  memoryStats: 'app:memory-stats',
  prefsGetAllSync: 'prefs:get-all-sync',
  prefsSet: 'prefs:set',
  prefsDelete: 'prefs:delete',
  confirmClear: 'confirm:clear',
  logsGetAll: 'logs:get-all',
  logsClear: 'logs:clear',
  /** Single log entry — kept for compatibility but not used for the
   * live tail anymore; high-volume crawls would saturate the IPC
   * channel. The renderer receives entries via `logsBatch` instead. */
  logsEntry: 'logs:entry',
  /** Coalesced batch of log entries delivered at most every ~100 ms.
   * One IPC round-trip carries 1–N entries — at 200 logs/s during
   * heavy crawls this drops IPC volume from ~200 msgs/s to ~10. */
  logsBatch: 'logs:batch',
  logsOpenWindow: 'logs:open-window',
  /** Renderer → main: open (or focus) the standalone Visualization
   *  popup window. The graph runs in its own native window so the user
   *  can park it on a second monitor while the main tab strip stays
   *  free for data tables. */
  visualizationOpenWindow: 'visualization:open-window',
  /** Renderer → main: read a captured screenshot PNG and return a
   *  data: URL the renderer can plug straight into `<img src>`. Avoids
   *  file:// CSP / sandbox headaches. */
  screenshotRead: 'screenshot:read',
  /** main → logs renderer: pause / resume the live setState pump while
   * the user is dragging or resizing the Logs window. Prevents the
   * renderer's render loop from competing with the OS compositor for
   * the main thread, which is what causes the visible "kasma" during
   * drag. */
  logsBusy: 'logs:busy',
  robotsTest: 'robots:test',
  robotsValidate: 'robots:validate',
  sitemapValidate: 'sitemap:validate',
  urlRewritePreview: 'url:rewrite-preview',
  urlClusterMembers: 'urls:cluster-members',
  /** Faz 7 — grouped Duplicates tab view: paginates near-duplicate cluster
   *  members ordered by cluster size DESC. Cluster headers / hamming
   *  distance to the representative are derived in {@link
   *  packages/db/src/project-db.ts#listDuplicateClusters}. */
  duplicateClustersList: 'duplicates:clusters-list',
  /** Faz 7 — total cluster-member row count, used by the grouped view to
   *  stop scrolling once every member has been fetched. */
  duplicateClustersCount: 'duplicates:clusters-count',
  /** Faz 11 — live preview of custom extraction rules against a single
   *  URL. Backs the "Preview" button in Settings → Custom Extraction so
   *  users can validate selectors / regex without committing to a full
   *  crawl. */
  extractionPreview: 'extraction:preview',
  /** Faz 11 — serialize the current rule set to a JSON file. Wraps the
   *  rules in a versioned envelope so future imports can detect schema
   *  drift. */
  extractionRulesExport: 'extraction:rules-export',
  /** Faz 11 — read a JSON file and validate its rules against the
   *  CustomExtractionRule schema. Returns the cleaned-up list plus a
   *  skipped-count so the renderer can warn about rejected entries. */
  extractionRulesImport: 'extraction:rules-import',
  reportsPagesPerDirectory: 'reports:pages-per-directory',
  reportsStatusCodeHistogram: 'reports:status-code-histogram',
  reportsIndexabilityDistribution: 'reports:indexability-distribution',
  reportsContentKindDistribution: 'reports:content-kind-distribution',
  reportsDepthHistogram: 'reports:depth-histogram',
  reportsResponseTimeHistogram: 'reports:response-time-histogram',
  reportsTopUrls: 'reports:top-urls',
  reportsExternalDomainHealth: 'reports:external-domain-health',
  reportsAnalyticsCoverage: 'reports:analytics-coverage',
  reportsLinkPositions: 'reports:link-positions',
  reportsImageWeightPerPage: 'reports:image-weight-per-page',
  reportsInlinksHistogram: 'reports:inlinks-histogram',
  reportsWordCountHistogram: 'reports:word-count-histogram',
  reportsUrlLengthHistogram: 'reports:url-length-histogram',
  reportsWordCountPerDirectory: 'reports:word-count-per-directory',
  reportsSitemapOrphans: 'reports:sitemap-orphans',
  reportsServerHeaders: 'reports:server-headers',
  reportsTopWords: 'reports:top-words',
  /**
   * Renderer → main heartbeat carrying the live input-lag estimate (ms).
   * The crawler subscribes to this so it can adaptively shrink its
   * concurrency when the renderer's main thread is starved — letting
   * low-end machines stay responsive without the user having to tune
   * `maxConcurrency` by hand.
   */
  rendererLagReport: 'renderer:lag-report',
  prefsExportSettings: 'prefs:export-settings',
  prefsImportSettings: 'prefs:import-settings',
  scheduleGet: 'schedule:get',
  scheduleSet: 'schedule:set',
  /** Faz 7 — integration credential store (safeStorage-encrypted).
   *  `integrationsGetAll` returns the redacted state map (secret values
   *  never leave the main process); `set` merges the supplied fields;
   *  `clear` wipes every field of one integration. */
  integrationsGetAll: 'integrations:get-all',
  integrationsSet: 'integrations:set',
  integrationsClear: 'integrations:clear',
  /** Open a native directory picker. Used by Settings → Storage to let the
   *  user choose the default folder for new `.seoproject` files. */
  pickDirectory: 'app:pick-directory',
  /** Returns the resolved default project save directory — the user's
   *  `projectSaveDir` pref when set, otherwise the OS Documents folder.
   *  Used by Settings → Storage to display the active path. */
  defaultProjectDir: 'app:default-project-dir',
  /** Storage mode the active DB connection is actually running in
   *  (`disk` | `ram`). Reflects what was resolved at launch, which may
   *  differ from the `storageMode` pref until the next restart. */
  storageModeActive: 'app:storage-mode-active',
  /** Faz 7 — Google PageSpeed Insights integration.
   *  `pagespeedQuery` lists crawled internal HTML pages joined with any
   *  stored audit results; `pagespeedRun` audits a user-selected set of
   *  URLs (the slow part — emits `pagespeedProgress` as it goes);
   *  `pagespeedCancel` stops an in-flight run early. */
  pagespeedQuery: 'pagespeed:query',
  pagespeedRun: 'pagespeed:run',
  pagespeedCancel: 'pagespeed:cancel',
  /** main → renderer: live progress of an in-flight PageSpeed run. */
  pagespeedProgress: 'pagespeed:progress',
  /** Chrome UX Report (CrUX) integration — real-user field metrics.
   *  `cruxQuery` lists crawled internal HTML pages joined with any stored
   *  field data; `cruxRun` fetches a user-selected set of URLs (emits
   *  `cruxProgress`); `cruxCancel` stops an in-flight run early. */
  cruxQuery: 'crux:query',
  cruxRun: 'crux:run',
  cruxCancel: 'crux:cancel',
  /** main → renderer: live progress of an in-flight CrUX run. */
  cruxProgress: 'crux:progress',
  /** Spelling & Grammar (LanguageTool) integration.
   *  `spellingQuery` lists crawled internal HTML pages joined with any
   *  stored check summary; `spellingRun` checks a user-selected set of
   *  URLs (emits `spellingProgress`); `spellingCancel` stops a run early;
   *  `spellingMatches` loads the full match list for one URL. */
  spellingQuery: 'spelling:query',
  spellingRun: 'spelling:run',
  spellingCancel: 'spelling:cancel',
  spellingMatches: 'spelling:matches',
  /** main → renderer: live progress of an in-flight spelling run. */
  spellingProgress: 'spelling:progress',
  /** Faz 7 — Google OAuth keystone (shared by Search Console, GA4,
   *  Sheets). `googleAuthStart` opens the consent screen in the browser
   *  and catches the loopback redirect; `googleAuthStatus` reports the
   *  stored connection; `googleAuthRevoke` deletes the tokens. */
  googleAuthStart: 'google:auth-start',
  googleAuthStatus: 'google:auth-status',
  googleAuthRevoke: 'google:auth-revoke',
  /** Faz 7 — Google Search Console. `gscListSites` lists the connected
   *  account's verified properties; `gscFetch` pulls per-page clicks /
   *  impressions / CTR / position for a date range; `gscQuery` lists
   *  crawled pages joined with that stored data. */
  gscListSites: 'gsc:list-sites',
  gscFetch: 'gsc:fetch',
  gscQuery: 'gsc:query',
  /** Faz 7 — Google Analytics 4. `ga4ListProperties` lists the connected
   *  account's GA4 properties; `ga4Fetch` pulls per-page sessions /
   *  users / pageviews / engagement / avg-duration; `ga4Query` lists
   *  crawled pages joined with that stored data. */
  ga4ListProperties: 'ga4:list-properties',
  ga4Fetch: 'ga4:fetch',
  ga4Query: 'ga4:query',
  /** Faz 7 — AI integrations (OpenAI / Anthropic / Ollama). `aiRun`
   *  applies a prompt template to each selected URL and stores the
   *  response; `aiQuery` lists crawled pages joined with the latest
   *  result for the selected provider; `aiCancel` aborts an in-flight
   *  run; `aiProgress` streams live progress. */
  aiRun: 'ai:run',
  aiCancel: 'ai:cancel',
  aiQuery: 'ai:query',
  aiProgress: 'ai:progress',
  /** Faz 7 — third-party SEO authority providers (Ahrefs / Majestic /
   *  Moz / Semrush). Same shape as the AI run: pick a provider, fetch
   *  per-URL metrics, store them, list joined with crawled pages. */
  seoRun: 'seo:run',
  seoCancel: 'seo:cancel',
  seoQuery: 'seo:query',
  seoProgress: 'seo:progress',
  /** Faz 7 — GSC URL Inspection API. `gscInspectRun` inspects the
   *  selected URLs against the chosen Search Console property and
   *  stores the index/coverage verdict per URL. */
  gscInspectRun: 'gsc:inspect-run',
  gscInspectCancel: 'gsc:inspect-cancel',
  gscInspectProgress: 'gsc:inspect-progress',
  /** Faz 7 — Google Sheets export. Writes a category's rows to a new
   *  spreadsheet on the connected account's Drive and returns the URL. */
  exportSheets: 'export:sheets',
  /** Faz 7 — Google BigQuery export. Service-account auth (no OAuth);
   *  creates a timestamped table in the user's project and streams the
   *  category's rows in via `tabledata.insertAll`. */
  exportBigquery: 'export:bigquery',
  /** Detail Panel — combined per-URL Analytics view (GSC + GA4 + GSC
   *  URL Inspection) for the selected URL. */
  urlAnalyticsGet: 'urls:analytics',
  /** Cross-source orphan-pages report — URLs seen in sitemap / GSC /
   *  GA4 but not in the crawled `urls` table. */
  reportsOrphanCrossSource: 'reports:orphan-cross-source',
  /** V2 Faz 2 — Log File Analyzer. `logAnalyzerOpenWindow` opens the
   *  standalone analysis window; `logAnalyze` ingests one access-log file
   *  (parse, bot-detect, aggregate, persist); the remaining channels read
   *  the persisted aggregates the window renders. */
  logAnalyzerOpenWindow: 'loganalyzer:open-window',
  logAnalyze: 'loganalyzer:analyze',
  logOverview: 'loganalyzer:overview',
  logUrlStats: 'loganalyzer:url-stats',
  logBots: 'loganalyzer:bots',
  logStatus: 'loganalyzer:status',
  logTrend: 'loganalyzer:trend',
  logCrawlBudget: 'loganalyzer:crawl-budget',
  logOrphans: 'loganalyzer:orphans',
  logDiscovery: 'loganalyzer:discovery',
  logSeedDiscovery: 'loganalyzer:seed-discovery',
  logExport: 'loganalyzer:export',
  logClear: 'loganalyzer:clear',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

/**
 * In-app scheduled crawl spec. One schedule per project (keyed by the
 * absolute `.seoproject` path in app-level prefs). Fires only while the
 * desktop app is open and the project is loaded — for triggers that
 * survive an app restart, drive the CLI via the OS scheduler (Windows
 * Task Scheduler / launchd / cron); that path is V2.
 */
export interface ScheduleSpec {
  enabled: boolean;
  /** `hourly` = every hour on the minute. `daily` = once at hourOfDay:
   *  minuteOfHour. `weekly` = once at dayOfWeek+hourOfDay:minuteOfHour.
   *  `custom` = every `intervalMinutes` (min 15). */
  cadence: 'hourly' | 'daily' | 'weekly' | 'custom';
  /** For `custom`. Minimum enforced at 15 to prevent runaway loops. */
  intervalMinutes?: number;
  /** 0–23. Used by daily/weekly. */
  hourOfDay?: number;
  /** 0–59. Used by daily/weekly. */
  minuteOfHour?: number;
  /** 0 = Sunday … 6 = Saturday. Used by weekly. */
  dayOfWeek?: number;
}

export interface ScheduleStatus {
  /** Epoch ms when last fire completed (success or failure). */
  lastFiredAt: number | null;
  /** Epoch ms when the next fire is due. Server-computed on set. */
  nextFiresAt: number | null;
  lastStatus: 'success' | 'failure' | 'running' | null;
}

export interface ScheduleEntry {
  spec: ScheduleSpec;
  status: ScheduleStatus;
}

export interface UrlsQueryInput {
  limit: number;
  offset: number;
  category?: UrlCategory;
  search?: string;
  sortBy?: keyof CrawlUrlRow;
  sortDir?: 'asc' | 'desc';
  filter?: AdvancedFilter;
}

export interface UrlsQueryResult {
  rows: CrawlUrlRow[];
  total: number;
}

export interface ImagesQueryInput {
  limit: number;
  offset: number;
  search?: string;
  missingAltOnly?: boolean;
  internalOnly?: boolean;
}

export interface ImagesQueryResult {
  rows: ImageRow[];
  total: number;
}

export interface BrokenLinksQueryInput {
  limit: number;
  offset: number;
  internal?: 'all' | 'internal' | 'external';
  search?: string;
}

export interface BrokenLinksQueryResult {
  rows: BrokenLinkRow[];
  /** Total broken-link rows (each = one from→to link instance). Scales
   *  with how many pages the crawl reached. */
  total: number;
  /** Distinct broken target URLs. Far more stable across crawls than
   *  `total` — one broken URL counts once no matter how many pages link
   *  to it. */
  uniqueTargets: number;
}

export interface ExportCsvInput {
  filePath: string;
  category?: UrlCategory;
  /** If set, only these URL ids are exported (used by "Export Selected"). */
  selectedIds?: number[];
}

export type MenuEvent =
  | 'new-project'
  | 'manage-projects'
  | 'clear-crawl'
  | 'toggle-sidebar'
  | 'toggle-detail-panel'
  | 'export-as'
  | 'export-html-report'
  | 'export-bulk'
  | 'export-sheets'
  | 'export-bigquery'
  | 'delete-domain-data'
  | 'clear-all-data'
  | 'compare-with-project'
  | 'save-project-as'
  | 'save-project-encrypted'
  | 'open-project-encrypted'
  | 'open-visualization'
  | 'generate-sitemap'
  | 'open-robots-tester'
  | 'open-sitemap-validator'
  | 'open-reports'
  | 'open-log-analyzer'
  | 'open-settings'
  | 'open-scheduled-crawl'
  | 'about';

export interface ExportCsvResult {
  filePath: string;
  rowsWritten: number;
}

export interface ExportJsonInput {
  filePath: string;
  category?: UrlCategory;
  selectedIds?: number[];
  /** Pretty-printed (2-space indent) when true. Default false (compact). */
  pretty?: boolean;
}

export interface ExportJsonResult {
  filePath: string;
  rowsWritten: number;
}

export interface ExportXmlInput {
  filePath: string;
  category?: UrlCategory;
  selectedIds?: number[];
}

export interface ExportXmlResult {
  filePath: string;
  rowsWritten: number;
}

export interface ExportBrokenLinksInput {
  /** Optional pre-resolved output path (skips the save dialog). */
  filePath?: string;
  /** Scope filter — matches the Broken Links tab's sidebar filter. */
  internal?: 'all' | 'internal' | 'external';
}

export interface ExportBrokenLinksResult {
  /** Empty when the user cancelled the save dialog. */
  filePath: string;
  rowsWritten: number;
}

export interface ExportImagesInput {
  /** Optional pre-resolved output path (skips the save dialog). */
  filePath?: string;
  /** When true, export only images with no `alt` attribute. Mirrors
   *  the Images tab's "Missing Alt only" sidebar filter. */
  missingAltOnly?: boolean;
  /** Free-text URL/alt filter (substring match, case-insensitive).
   *  Mirrors the tab's search box. */
  search?: string;
}

export interface ExportImagesResult {
  /** Empty when the user cancelled the save dialog. */
  filePath: string;
  rowsWritten: number;
}

/** One section / sheet of a tabular export — a single category fed into
 * the workbook (xlsx) or split into its own file (csv/json/xml). */
export interface ExportTabularSection {
  /** Display label — becomes the xlsx sheet name and the per-file label. */
  label: string;
  category: UrlCategory;
  /** Optional subdirectory under the chosen folder. When set, the section
   *  file lands at `<root>/<subdir>/<filename>.<ext>` instead of the flat
   *  `<root>/<filename>.<ext>`. Lets a hierarchical tree pick (Internal →
   *  HTML/JS/CSS) export under nested folders. Ignored for xlsx output
   *  (everything stays in a single workbook). */
  subdir?: string;
  /** Optional filename (without extension) — defaults to a sanitized label. */
  filename?: string;
}

export interface ExportTabularInput {
  format: 'csv' | 'xlsx' | 'json' | 'xml';
  /**
   * One or more sections. With CSV/JSON/XML + multiple sections, files are
   * written into a folder the user picks (one file per section, honouring
   * the optional `subdir`); xlsx always produces a single workbook with
   * one sheet per section.
   */
  sections: ExportTabularSection[];
  /** Keys of `CrawlUrlRow` to emit, in order. */
  columns: string[];
  /** Optional pre-resolved output path (skip the dialog). */
  filePath?: string;
  /** When set, restrict every section to these row ids. */
  selectedIds?: number[];
  /** When true, CSV files are written with a UTF-8 BOM so Excel for Windows
   *  opens them in the correct charset. Ignored for non-CSV formats. */
  csvBom?: boolean;
}

export interface ExportTabularResult {
  /** Output file (xlsx + single-section csv) or folder (multi-section csv). */
  filePath: string;
  /** Files actually written. Multi-section CSV writes one file per section. */
  files: string[];
  rowsWritten: number;
}

export interface DataDeleteByDomainInput {
  /** Hostname to wipe — case-insensitive, no scheme/port. */
  domain: string;
}

export interface CrashRecoveryStatus {
  /** Number of URLs the previous session left pending. 0 = nothing
   * to recover and the renderer skips the prompt. */
  pendingCount: number;
  /** The start URL the previous crawl was running against. */
  seedUrl: string;
}

/**
 * Snapshot of process + system memory used by the in-app memory
 * monitor. All values in bytes; the renderer formats for display.
 *
 * `urlsCrawled` lets the monitor compute the per-URL cost
 * (`rss / urlsCrawled`) and the projected ceiling for 1M / 5M / 10M
 * URLs without a separate IPC.
 */
export interface MemoryStats {
  /** `process.memoryUsage().rss` — resident set size in bytes. */
  rss: number;
  /** V8 heap currently in use. */
  heapUsed: number;
  /** V8 heap total reservation (committed). */
  heapTotal: number;
  /** Off-heap native allocations (Buffer, n-api, etc.). */
  external: number;
  /** ArrayBuffer-backed allocations counted toward `external`. */
  arrayBuffers: number;
  /** `os.totalmem()` — installed system memory in bytes. */
  systemTotal: number;
  /** `os.freemem()` — currently free system memory in bytes. */
  systemFree: number;
  /** Number of URLs in the active project DB (used for per-URL cost). */
  urlsCrawled: number;
}

export interface DataDeleteByDomainResult {
  /** Number of `urls` rows deleted. Cascade handles `links`, `images`,
   *  `headers`, `url_sources`, `urls_issues`. */
  urlsDeleted: number;
  /** Number of associated `links` rows wiped (informational). */
  linksDeleted: number;
}

export interface ExportHtmlReportInput {
  filePath: string;
}

export interface ExportHtmlReportResult {
  filePath: string;
  bytesWritten: number;
}

/** One file produced by a Bulk Export run. */
export interface BulkExportFile {
  /** Absolute output path. */
  filePath: string;
  /** Display label (e.g. "Internal HTML"). */
  label: string;
  /** Category that drove this export. */
  category: UrlCategory;
  rowsWritten: number;
}

export interface BulkExportResult {
  /** Empty if the user cancelled the folder picker. */
  outputDir: string;
  files: BulkExportFile[];
  /** Files that failed to write — exposed so the UI can summarise partial successes. */
  errors: { label: string; error: string }[];
}

export type CompareCategory =
  | 'added'
  | 'removed'
  | 'status'
  | 'title'
  | 'meta'
  | 'h1'
  | 'canonical'
  | 'indexability'
  | 'response_time';

export interface CompareDiffRow {
  url: string;
  category: CompareCategory;
  before: string | null;
  after: string | null;
}

export interface CompareLoadInput {
  /** Optional path; empty triggers an Open File dialog. */
  filePath?: string;
}

export interface CompareLoadResult {
  /** Empty when the user cancelled the file dialog. */
  filePath: string;
  totalA: number;
  totalB: number;
  counts: Record<CompareCategory, number>;
  samples: CompareDiffRow[];
}

export interface GraphNode {
  id: number;
  url: string;
  statusCode: number | null;
  depth: number;
  inlinks: number;
  indexability: Indexability;
  /** Largest-Contentful-Paint candidate captured during JS render (null
   *  when JS rendering wasn't used or no candidate was found). Powers the
   *  "LCP / above-the-fold" visualization overlay. */
  lcpTag: string | null;
  lcpResourceUrl: string | null;
  lcpCoverage: number | null;
  /** Internal PageRank / link score, 0..100 (100 = most-linked page).
   *  Null until the post-crawl link-score pass runs. Powers the
   *  "By Link Score" visualization colour mode. */
  linkScore: number | null;
}

export interface GraphEdge {
  source: number;
  target: number;
}

export interface GraphSnapshotInput {
  nodeLimit?: number;
}

export interface GraphSnapshotResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface CrawlPathInput {
  urlId: number;
}

export interface CrawlPathNode {
  id: number;
  url: string;
  depth: number;
  statusCode: number | null;
}

export interface CrawlPathResult {
  /** Ordered crawl root → target. Empty when the target id is unknown. */
  path: CrawlPathNode[];
  /** False when the walk stalled before the depth-0 root (orphan page). */
  reachedRoot: boolean;
}

export interface AnchorTextRow {
  anchor: string;
  count: number;
}

export interface SitemapGenerateInput {
  filePath: string;
  /**
   * Variant: `standard` (default), `image` (Google Images extension), or
   * `hreflang` (international targeting via `<xhtml:link>`).
   */
  variant?: 'standard' | 'image' | 'hreflang';
  /** Gzip the output (`.xml.gz`). Index file is gzipped too when sharded. */
  gzip?: boolean;
  /** Per-file URL cap (≤50,000). Sharding kicks in when exceeded. */
  splitAtUrlCount?: number;
}

export interface SitemapGenerateResult {
  filePath: string;
  /** All files written (index first when sharded). */
  files?: string[];
  urlsWritten: number;
  truncated: boolean;
  sharded?: boolean;
}

export interface UrlDetailInput {
  id: number;
  linkLimit?: number;
}

export interface UrlSourceInput {
  id: number;
}

export interface UrlSourceResult {
  /** Raw HTML body. Null when no snapshot was stored for this URL. */
  body: string | null;
  /** Pre-truncation byte length of the original response body. */
  bodyLength: number;
  /** True when the stored body was clipped at `bodySnapshotMaxBytes`. */
  truncated: boolean;
  /** ISO timestamp of when the snapshot was captured. */
  capturedAt: string | null;
  /** V2 Faz 1 — Post-JS rendered DOM dump. Null when JS render did not
   *  run for this URL (text/ajax mode or page rendered before V2). */
  renderedBody: string | null;
  /** Byte length of the rendered DOM before truncation. */
  renderedBodyLength: number | null;
  /** Total Playwright render time in ms (nav + wait + extract). */
  renderMs: number | null;
  /** Absolute path to the full-page screenshot PNG, when captured. */
  screenshotFullpagePath: string | null;
  /** Absolute path to the above-the-fold screenshot PNG, when captured. */
  screenshotFoldPath: string | null;
  /** Absolute path to the mobile-viewport screenshot PNG, when captured. */
  screenshotMobilePath: string | null;
}

export interface UrlPageImagesInput {
  /** ID of the page URL whose `<img>` references should be returned. */
  id: number;
  limit?: number;
}

export interface UrlCertInfoInput {
  /** ID of the page URL — its host is looked up against `host_certs`. */
  id: number;
}

/**
 * Cached TLS-probe result for the host of a single page. All fields are
 * null when the URL is HTTP-only or when no probe has run yet for this
 * host. `daysUntilExpiry` is computed at probe time, so a long-lived
 * project file might surface a stale negative value — re-crawl to refresh.
 */
export interface UrlCertInfoResult {
  host: string | null;
  validFrom: string | null;
  validTo: string | null;
  daysUntilExpiry: number | null;
  issuer: string | null;
  subject: string | null;
  signatureAlgorithm: string | null;
  protocol: string | null;
  /** Total certificates in the peer chain (1 = self-signed, 2 = leaf+root, ≥3 = with intermediates). */
  chainLength: number | null;
  /** Distinguished names of the certs in the chain, leaf-first, capped at 5 entries. */
  chainSubjects: string[] | null;
  /** 200 = handshake OK + cert read, 0 = error/timeout, -1 = no probe yet. */
  probeStatus: number;
  probeError: string | null;
  probedAt: string | null;
}

/**
 * One image reference on a single page. Combines the canonical entry from
 * the `images` table with the per-page alt text recorded in `image_usages`.
 * The Detail Panel renders these alongside missing-alt warnings.
 */
export interface UrlPageImageRow {
  src: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  isInternal: boolean;
  /** HEAD-probe Content-Length in bytes; null when not yet probed / no header. */
  byteSize: number | null;
}

export interface UrlPageImagesResult {
  rows: UrlPageImageRow[];
}

export interface UrlContextMenuInput {
  url: string;
  urlId: number;
}

export interface UrlBulkContextMenuInput {
  urlIds: number[];
}

export interface ConfirmClearResult {
  confirmed: boolean;
  skipNext: boolean;
}

export interface RobotsTestInput {
  url: string;
  userAgent: string;
  /**
   * Optional custom robots.txt body to test against, instead of fetching
   * the live robots.txt from the URL's origin. Useful for testing a
   * draft policy before deploying it. When set, no network request is
   * made and `result.robotsUrl` is the literal string `"<custom>"`.
   */
  customRobots?: string;
}

/**
 * One issue surfaced by `robots:validate`. Lines are 1-indexed
 * (matching what the user sees in the editor gutter). Re-exported
 * from `@freecrawl/core` so the renderer can type the IPC result
 * without depending on core directly.
 */
export interface RobotsValidationIssue {
  line: number;
  severity: 'error' | 'warning';
  message: string;
  directive: string | null;
}

export interface PagesPerDirectoryInput {
  /** Path-segment depth to group at (1 = top-level only). Default 1. */
  depth?: number;
  /** Max rows to return. Default 500. */
  limit?: number;
}

export interface PagesPerDirectoryRow {
  directory: string;
  count: number;
}

export interface StatusCodeHistogramRow {
  status: number | null;
  count: number;
}

export interface IndexabilityDistributionRow {
  /** `indexable` or one of `non-indexable:noindex` / `:canonical` /
   *  `:robots-blocked` / `:redirect` / `:client-error` / `:server-error`. */
  indexability: string;
  count: number;
}

export interface ContentKindDistributionRow {
  /** `html` / `css` / `js` / `image` / `font` / `pdf` / `other` — matches
   *  the `content_kind` column populated at insert time. */
  contentKind: string;
  count: number;
}

export interface DepthHistogramRow {
  depth: number;
  count: number;
}

export interface ResponseTimeHistogramRow {
  /** Bucket label (e.g. `"< 100ms"`, `"1–3s"`, `"No response"`). */
  label: string;
  count: number;
}

export type TopUrlMetric =
  | 'response-time'
  | 'inlinks'
  | 'outlinks'
  | 'depth'
  | 'page-size';

export interface TopUrlsInput {
  metric: TopUrlMetric;
  /** Default 25, capped at 500. */
  limit?: number;
  /**
   * Sort direction. `desc` (default) gives the conventional "Top N"
   * leaderboards (most inlinks, slowest, biggest, deepest). `asc`
   * surfaces the bottom of each metric — Least-Linked, fastest, smallest,
   * shallowest. ASC mode excludes rows where the metric is 0 so it
   * doesn't degenerate into an unlinked-pages report.
   */
  direction?: 'asc' | 'desc';
}

export interface TopUrlsRow {
  url: string;
  /** Numeric value for the chosen metric (ms / count / depth / bytes). */
  value: number | null;
}

export interface ExternalDomainHealthRow {
  domain: string;
  totalUrls: number;
  successCount: number;
  errorCount: number;
  /** Average response time across all probes for this domain (ms). */
  avgResponseTimeMs: number | null;
  errorRatePercent: number;
}

/**
 * One row in the Link Position report. Aggregates internal links by the
 * page region they live in (navigation / header / content / sidebar /
 * footer / aside) so the user can see how their internal-link weight is
 * distributed.
 */
export interface LinkPositionRow {
  position: string;
  count: number;
}

/**
 * One row in the Image Weight per Page report. `imageBytes` is the sum
 * of HEAD-probed `Content-Length` for every internal image referenced
 * from this page. Lets the user spot the image-heaviest pages without
 * having to inspect each detail panel one by one.
 */
export interface ImageWeightRow {
  url: string;
  imageBytes: number;
  imageCount: number;
}

/** Generic bucketed histogram row used by Inlinks / Word-Count reports. */
export interface BucketHistogramRow {
  label: string;
  count: number;
}

/**
 * One row in the Word Count per Directory report. Aggregated across
 * indexable HTML pages, grouped at the configured top-level path depth.
 * Sorted by `avgWordCount` desc so thin-content sections surface at the
 * bottom and long-form content clusters at the top.
 */
export interface WordCountPerDirectoryRow {
  directory: string;
  avgWordCount: number;
  pageCount: number;
}

export interface WordCountPerDirectoryInput {
  depth: number;
  limit: number;
}

/**
 * One row in the Sitemap Orphans report. A "sitemap orphan" is a URL
 * declared in `<urlset>` (or any nested sitemap-index entry) that the
 * crawl never reached — typically because no internal page linked to
 * it, or because include/exclude / scope rules filtered it out. Each
 * row carries the `<lastmod>` value (when present) so the user can
 * tell whether the entry is genuinely orphaned or merely stale.
 */
export interface SitemapOrphanRow {
  url: string;
  lastmod: string | null;
  sourceSitemap: string | null;
}

/** One row of the cross-source orphan-pages report. */
export interface OrphanCrossSourceRow {
  url: string;
  /** Which truth sources mentioned this URL — `sitemap`, `gsc`, `ga4`. */
  sources: string[];
  /** Search Console clicks for this URL, when it came from GSC. */
  gscClicks: number | null;
  /** Search Console impressions for this URL, when it came from GSC. */
  gscImpressions: number | null;
  /** Analytics 4 sessions for this URL, when it came from GA4. */
  ga4Sessions: number | null;
  /** `<lastmod>` from the sitemap, when it came from the sitemap. */
  lastmod: string | null;
}

/** One row in the Server Stack report — `Server` response-header rollup. */
export interface ServerHeaderRow {
  server: string;
  count: number;
}

/**
 * One row in the Top Words report — body-text frequency aggregation
 * over the title + meta description + H1 corpus of every indexable
 * 2xx HTML page. Stopwords (en/tr) and tokens shorter than the
 * configured `minLength` are filtered out before counting.
 *
 * `count` is total occurrences, `pages` is how many distinct pages
 * contained the word. The latter discriminates "site-wide topic"
 * (high pages) from "one page repeats this term" (high count, low pages).
 */
export interface TopWordsRow {
  word: string;
  count: number;
  pages: number;
}

export interface TopWordsInput {
  /** Max rows to return. Default 100, hard cap 1000. */
  limit?: number;
  /** Minimum word length. Default 3. */
  minLength?: number;
  /** Stopword set: `en`, `tr`, or `all` (union). Default `all`. */
  locale?: 'en' | 'tr' | 'all';
}

/**
 * One row in the Analytics Coverage report. Counts how many indexable HTML
 * pages declare a given tracker — useful to spot incomplete rollouts
 * ("GA4 only on 80% of pages") or duplicated stacks ("GTM and gtag both
 * loaded everywhere").
 */
export interface AnalyticsCoverageRow {
  /** Tracker product name, e.g. `"Google Analytics 4"`. */
  name: string;
  /** Number of pages on which this tracker was detected. */
  pageCount: number;
  /** Number of distinct IDs seen for this tracker (e.g. multiple GA4 properties). */
  distinctIds: number;
  /** Up to 5 sample IDs for quick eyeballing of the rollout. */
  sampleIds: string[];
}

export interface SettingsExportInput {
  /** Optional output path; absent triggers the file picker. */
  filePath?: string;
  /** Config payload to write — caller passes the in-memory CrawlConfig. */
  config: Record<string, unknown>;
}

export interface SettingsExportResult {
  /** Empty when the user cancelled the picker. */
  filePath: string;
  bytesWritten: number;
}

export interface SettingsImportResult {
  /** Empty when the user cancelled. */
  filePath: string;
  /** Parsed config object — caller merges into the active config. */
  config: Record<string, unknown> | null;
  /** Fields in the imported file that we don't recognise (ignored). */
  unknownFields: string[];
}

export interface RobotsTestResult {
  url: string;
  robotsUrl: string;
  status: number | null;
  body: string | null;
  allowed: boolean;
  crawlDelay: number | null;
  sitemaps: string[];
  error: string | null;
}

export interface SitemapValidateInput {
  /** A sitemap.xml or sitemap-index.xml URL to fetch and validate. */
  url: string;
  /** Optional User-Agent override (defaults to FreeCrawl's). */
  userAgent?: string;
}

export interface SitemapValidateResult {
  url: string;
  /** Sitemap URLs we attempted to fetch (root + children via index). */
  sitemapsTried: string[];
  /** Sitemap URLs that returned valid XML and were parsed. */
  sitemapsParsed: string[];
  /** Per-sitemap fetch errors. */
  errors: { sitemap: string; error: string }[];
  /** Total URL entries discovered across the (possibly nested) sitemap tree. */
  urlCount: number;
  /** True when the internal cap was hit while walking. */
  truncated: boolean;
  /** Findings from the protocol-validity check (URL count, file size, lastmod). */
  findings: string[];
  /** Sample of `<lastmod>` values from up to the first ~50 entries. */
  lastmodSamples: string[];
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Inputs for the URL rewrite preview IPC. The renderer sends a sample
 * URL plus the same set of normalisation knobs the crawler uses, so the
 * Settings → URL Rewriting tab can show users exactly what their config
 * will produce before they save it.
 */
export interface UrlRewritePreviewInput {
  url: string;
  stripWww: boolean;
  forceHttps: boolean;
  lowercasePath: boolean;
  trailingSlash: 'leave' | 'strip' | 'add';
  keepQueryParams: string[];
  urlRegexRewrites: Array<{ pattern: string; replacement: string; flags?: string }>;
}

/**
 * Per-URL near-duplicate cluster member row. Surfaced in the URL Details
 * panel's "Duplicates" sub-tab so the user can jump from one page in a
 * cluster to its sibling pages without leaving the detail context.
 */
export interface UrlClusterMember {
  url: string;
  statusCode: number | null;
  indexability: Indexability;
  title: string | null;
  wordCount: number | null;
  inlinks: number;
  /** SimHash hamming distance from the queried URL (0 = identical fingerprint). */
  hammingDistance: number;
}

export interface UrlRewritePreviewResult {
  /** Final URL string after all rewrites. `null` if normalisation failed. */
  result: string | null;
  /** Per-regex compile errors (if any). Empty when all patterns valid. */
  regexErrors: Array<{ pattern: string; error: string }>;
  /** Set when the input URL itself failed to parse. */
  parseError?: string;
}

/**
 * Inputs for the PageSpeed tab's candidate query. Returns crawled
 * internal HTML pages (the universe PSI can be run against) left-joined
 * with any audit results already stored for them.
 */
export interface PagespeedQueryInput {
  limit: number;
  offset: number;
  /** Substring match against the URL. */
  search?: string;
  /** `all` (default), `tested` (has ≥1 stored result), `untested`. */
  filter?: 'all' | 'tested' | 'untested';
}

export interface PagespeedQueryResult {
  rows: PagespeedRow[];
  /** Total candidate rows matching the filter (before pagination). */
  total: number;
}

export interface PagespeedRunInput {
  /** URLs to audit — taken from the candidate rows in the tab. */
  urls: string[];
  /** Which form factor(s) to audit. `both` doubles the API calls. */
  strategy: PagespeedRunStrategy;
}

export interface PagespeedRunResult {
  /** Number of (url × strategy) audits that completed successfully. */
  completed: number;
  /** Number that returned an error (URL unreachable, quota, etc.). */
  failed: number;
  /** True when the user cancelled the run before it finished. */
  cancelled: boolean;
}

/** main → renderer live progress while a PageSpeed run is in flight. */
export interface PagespeedProgress {
  /** Audits finished so far (success + failure). */
  done: number;
  /** Total audits in this run (urls × strategy count). */
  total: number;
  /** URL currently being audited, or null between items. */
  currentUrl: string | null;
  /** False once the run has fully stopped. */
  running: boolean;
}

/**
 * Inputs for the CrUX tab's candidate query — crawled internal HTML pages
 * left-joined with any stored field data.
 */
export interface CruxQueryInput {
  limit: number;
  offset: number;
  /** Substring match against the URL. */
  search?: string;
  /** `all` (default), `tested` (has ≥1 stored result), `untested`. */
  filter?: 'all' | 'tested' | 'untested';
}

export interface CruxQueryResult {
  rows: CruxRow[];
  /** Total candidate rows matching the filter (before pagination). */
  total: number;
}

export interface CruxRunInput {
  /** URLs to fetch — taken from the candidate rows in the tab. */
  urls: string[];
  /** Which form factor(s) to fetch. `both` doubles the API calls. */
  formFactor: CruxRunFormFactor;
}

export interface CruxRunResult {
  /** Number of (url × form-factor) records fetched with data. */
  completed: number;
  /** Number that returned an error or no data. */
  failed: number;
  /** True when the user cancelled the run before it finished. */
  cancelled: boolean;
}

/** main → renderer live progress while a CrUX run is in flight. */
export interface CruxProgress {
  done: number;
  total: number;
  currentUrl: string | null;
  running: boolean;
}

/** Inputs for the Spelling tab's candidate query. */
export interface SpellingQueryInput {
  limit: number;
  offset: number;
  /** Substring match against the URL. */
  search?: string;
  /** `all` (default), `checked`, `unchecked`, `errors` (matchCount > 0). */
  filter?: 'all' | 'checked' | 'unchecked' | 'errors';
}

export interface SpellingQueryResult {
  rows: SpellingRow[];
  /** Total candidate rows matching the filter (before pagination). */
  total: number;
}

export interface SpellingRunInput {
  /** URLs to check — taken from the candidate rows in the tab. */
  urls: string[];
}

export interface SpellingRunResult {
  /** Pages checked successfully (including clean pages). */
  completed: number;
  /** Pages that errored or were skipped for having no prose. */
  failed: number;
  cancelled: boolean;
}

/** main → renderer live progress while a spelling run is in flight. */
export interface SpellingProgress {
  done: number;
  total: number;
  currentUrl: string | null;
  running: boolean;
}

/** Full stored match list for one URL (Detail panel sub-tab). */
export interface SpellingMatchesResult {
  url: string;
  language: string | null;
  status: 'ok' | 'skipped' | 'error' | null;
  error: string | null;
  fetchedAt: string | null;
  matches: SpellingMatch[];
}

/** Result of `gscListSites` — the connected account's GSC properties. */
export interface GscListSitesResult {
  ok: boolean;
  error: string | null;
  sites: GscSite[];
}

export interface GscFetchInput {
  /** Search Console property to pull from (`siteUrl` from `GscSite`). */
  property: string;
  /** Trailing window in days (Search Console data lags ~2-3 days). */
  days: 7 | 28 | 90;
}

export interface GscFetchResult {
  ok: boolean;
  error: string | null;
  /** Page rows stored from this pull. */
  rowCount: number;
  meta: GscFetchMeta | null;
}

export interface GscQueryInput {
  limit: number;
  offset: number;
  search?: string;
  /** `all` (default), `with-data` (has GSC impressions), `without-data`. */
  filter?: 'all' | 'with-data' | 'without-data';
}

export interface GscQueryResult {
  rows: GscRow[];
  /** Total candidate rows matching the filter (before pagination). */
  total: number;
  /** Metadata about the stored pull, or null when none has run. */
  meta: GscFetchMeta | null;
}

export interface Ga4ListPropertiesResult {
  ok: boolean;
  error: string | null;
  properties: Ga4Property[];
}

export interface Ga4FetchInput {
  /** Property resource name (`properties/<id>`). */
  property: string;
  /** Friendly label persisted into the fetch meta for the UI. */
  propertyName: string;
  days: 7 | 28 | 90;
}

export interface Ga4FetchResult {
  ok: boolean;
  error: string | null;
  rowCount: number;
  meta: Ga4FetchMeta | null;
}

export interface Ga4QueryInput {
  limit: number;
  offset: number;
  search?: string;
  filter?: 'all' | 'with-data' | 'without-data';
}

export interface Ga4QueryResult {
  rows: Ga4Row[];
  total: number;
  meta: Ga4FetchMeta | null;
}

export interface AiRunInput {
  /** Provider to send the prompt to. */
  provider: AiProvider;
  /** Optional model override; blank uses the provider's default. */
  model?: string;
  /** Prompt template — `{url}` / `{title}` / `{description}` / `{h1}` /
   *  `{body}` are substituted per-URL at run time. */
  prompt: string;
  /** URLs to run against (taken from the candidate rows in the tab). */
  urls: string[];
}

export interface AiRunResult {
  /** URL × prompts that completed successfully. */
  completed: number;
  failed: number;
  cancelled: boolean;
}

/** main → renderer live progress while an AI run is in flight. */
export interface AiProgress {
  done: number;
  total: number;
  currentUrl: string | null;
  running: boolean;
}

export interface AiQueryInput {
  limit: number;
  offset: number;
  search?: string;
  /** Which provider's results to surface in the table. */
  provider: AiProvider;
  /** `all` (default), `with-data`, `without-data`, `error`. */
  filter?: 'all' | 'with-data' | 'without-data' | 'error';
}

export interface AiQueryResult {
  rows: AiRow[];
  total: number;
}

export interface SeoRunInput {
  provider: SeoProvider;
  urls: string[];
}

export interface SeoRunResult {
  completed: number;
  failed: number;
  cancelled: boolean;
}

export interface SeoProgress {
  done: number;
  total: number;
  currentUrl: string | null;
  running: boolean;
}

export interface SeoQueryInput {
  limit: number;
  offset: number;
  search?: string;
  provider: SeoProvider;
  filter?: 'all' | 'with-data' | 'without-data' | 'error';
}

export interface SeoQueryResult {
  rows: SeoRow[];
  total: number;
}

export interface GscInspectRunInput {
  /** Search Console property the URLs belong to. */
  property: string;
  urls: string[];
}

export interface GscInspectRunResult {
  completed: number;
  failed: number;
  cancelled: boolean;
}

export interface GscInspectProgress {
  done: number;
  total: number;
  currentUrl: string | null;
  running: boolean;
}

export interface ExportSheetsInput {
  /** Category to export — same enum the Bulk Export uses. */
  category: UrlCategory;
  /** Optional title for the new spreadsheet. Falls back to the
   *  category label + current date. */
  title?: string;
}

export interface ExportSheetsResult {
  ok: boolean;
  error: string | null;
  /** Browser URL of the new spreadsheet on success. */
  url: string | null;
  rowsWritten: number;
}

export interface ExportBigqueryInput {
  category: UrlCategory;
}

export interface ExportBigqueryResult {
  ok: boolean;
  error: string | null;
  /** GCP console URL pointing at the new table on success. */
  consoleUrl: string | null;
  /** Fully-qualified table reference, e.g. `myproj.freecrawl_seo.urls_1716391000`. */
  tableRef: string | null;
  rowsWritten: number;
}

export interface LogEntry {
  /** Monotonic sequence id, increments on every log call this session. */
  id: number;
  /** ISO 8601 timestamp. */
  ts: string;
  level: LogLevel;
  /** Originating subsystem: 'main', 'crawler', 'ipc', 'console', 'uncaught', 'renderer', 'fetch'. */
  source: string;
  message: string;
  /** Multi-window: `webContents.id` of the project window this entry belongs
   *  to (crawler activity is tagged per-window). Undefined for app-global
   *  infrastructure logs (main / mcp-bridge / console) that are relevant to
   *  every window's Logs view. */
  windowId?: number;
}

export interface FreeCrawlApi {
  crawlStart(config: CrawlConfig): Promise<void>;
  crawlStop(): Promise<void>;
  crawlPause(): Promise<void>;
  crawlResume(): Promise<void>;
  crawlClear(): Promise<void>;
  crawlAddUrl(url: string): Promise<{ accepted: boolean }>;
  projectSaveAs(): Promise<{ filePath: string; bytesWritten: number } | null>;
  projectOpen(filePath?: string): Promise<{ filePath: string } | null>;
  projectCurrentPath(): Promise<string | null>;
  /** Active project's saved crawl config, or null on the default scratch
   *  DB (renderer keeps its global-prefs config in that case). */
  projectConfigGet(): Promise<CrawlConfig | null>;
  /** Persist a crawl config to the active project (no-op on scratch DB). */
  projectConfigSet(config: CrawlConfig): Promise<void>;
  /** Fires when the active project changes; payload is the project's saved
   *  config, or null when it has none yet / is the scratch DB. */
  onProjectConfigChanged(cb: (config: CrawlConfig | null) => void): () => void;
  /** Full recent-projects list including archived entries. */
  recentProjectsList(): Promise<RecentProject[]>;
  /** Archive / unarchive a recent project (hides it from Open Recent). */
  recentProjectSetArchived(path: string, archived: boolean): Promise<void>;
  /** Replace the tag set on a recent project. */
  recentProjectSetTags(path: string, tags: string[]): Promise<void>;
  /** Drop a project from the recent list. */
  recentProjectRemove(path: string): Promise<void>;
  projectSaveEncrypted(
    password: string,
  ): Promise<{ filePath: string; bytesWritten: number } | { error: string } | null>;
  projectOpenEncrypted(
    password: string,
  ): Promise<{ filePath: string } | { error: string } | null>;
  urlsQuery(input: UrlsQueryInput): Promise<UrlsQueryResult>;
  urlDetailGet(input: UrlDetailInput): Promise<UrlDetail | null>;
  urlSourceGet(input: UrlSourceInput): Promise<UrlSourceResult>;
  urlPageImages(input: UrlPageImagesInput): Promise<UrlPageImagesResult>;
  urlCertInfo(input: UrlCertInfoInput): Promise<UrlCertInfoResult>;
  urlContextMenu(input: UrlContextMenuInput): Promise<void>;
  urlBulkContextMenu(input: UrlBulkContextMenuInput): Promise<void>;
  imagesQuery(input: ImagesQueryInput): Promise<ImagesQueryResult>;
  brokenLinksQuery(input: BrokenLinksQueryInput): Promise<BrokenLinksQueryResult>;
  overviewGet(): Promise<OverviewCounts>;
  summaryGet(): Promise<CrawlSummary>;
  exportCsv(input: ExportCsvInput): Promise<ExportCsvResult>;
  exportJson(input: ExportJsonInput): Promise<ExportJsonResult>;
  exportXml(input: ExportXmlInput): Promise<ExportXmlResult>;
  exportBrokenLinks(input: ExportBrokenLinksInput): Promise<ExportBrokenLinksResult>;
  exportImages(input: ExportImagesInput): Promise<ExportImagesResult>;
  exportTabular(input: ExportTabularInput): Promise<ExportTabularResult>;
  dataDeleteByDomain(
    input: DataDeleteByDomainInput,
  ): Promise<DataDeleteByDomainResult>;
  crashRecoveryStatus(): Promise<CrashRecoveryStatus>;
  crashRecoveryResume(): Promise<{ accepted: boolean }>;
  crashRecoveryDiscard(): Promise<void>;
  exportHtmlReport(input: ExportHtmlReportInput): Promise<ExportHtmlReportResult>;
  exportBulk(): Promise<BulkExportResult>;
  compareLoad(input: CompareLoadInput): Promise<CompareLoadResult>;
  graphSnapshot(input: GraphSnapshotInput): Promise<GraphSnapshotResult>;
  crawlPath(input: CrawlPathInput): Promise<CrawlPathResult>;
  topAnchorTexts(limit?: number): Promise<AnchorTextRow[]>;
  sitemapGenerate(input: SitemapGenerateInput): Promise<SitemapGenerateResult>;
  appVersion(): Promise<string>;
  memoryStats(): Promise<MemoryStats>;
  prefsGetAll(): Record<string, unknown>;
  prefsGet(key: string): unknown;
  prefsSet(key: string, value: unknown): void;
  prefsDelete(key: string): void;
  confirmClear(): Promise<ConfirmClearResult>;
  /** Snapshot of the live log ring. `ownerId` (a project window's
   *  webContents.id) scopes the result to that window's crawler entries plus
   *  app-global entries; omitted returns everything (primary/legacy view). */
  logsGetAll(ownerId?: number): Promise<LogEntry[]>;
  logsClear(): Promise<void>;
  logsOpenWindow(): Promise<void>;
  openVisualizationWindow(): Promise<void>;
  readScreenshot(absolutePath: string): Promise<string | null>;
  robotsTest(input: RobotsTestInput): Promise<RobotsTestResult>;
  robotsValidate(text: string): Promise<RobotsValidationIssue[]>;
  sitemapValidate(input: SitemapValidateInput): Promise<SitemapValidateResult>;
  urlRewritePreview(input: UrlRewritePreviewInput): Promise<UrlRewritePreviewResult>;
  urlClusterMembers(urlId: number): Promise<UrlClusterMember[]>;
  /** Paginates near-duplicate cluster members for the dedicated grouped
   *  Duplicates view. Pages are ordered by cluster size DESC, cluster id
   *  ASC, URL ASC so the largest clusters come first. */
  duplicateClustersList(input: DuplicateClustersListInput): Promise<DuplicateClusterRow[]>;
  /** Total cluster-member row count (cluster_id > 0). */
  duplicateClustersCount(): Promise<number>;
  /** Faz 11 — fetch the URL once, parse HTML, run every supplied rule
   *  against it and return the per-rule results so the user can spot
   *  broken selectors / regex before committing to a full crawl. */
  extractionPreview(input: ExtractionPreviewInput): Promise<ExtractionPreviewResult>;
  /** Faz 11 — opens a save dialog and writes `rules` as a versioned
   *  JSON envelope. `filePath` is empty when the user cancels. */
  extractionRulesExport(
    rules: CustomExtractionRule[],
  ): Promise<ExtractionRulesExportResult>;
  /** Faz 11 — opens an open dialog, parses + validates the JSON, and
   *  returns the cleaned-up rule list. `filePath` is empty when the
   *  user cancels. */
  extractionRulesImport(): Promise<ExtractionRulesImportResult>;
  reportsPagesPerDirectory(input: PagesPerDirectoryInput): Promise<PagesPerDirectoryRow[]>;
  reportsStatusCodeHistogram(): Promise<StatusCodeHistogramRow[]>;
  reportsIndexabilityDistribution(): Promise<IndexabilityDistributionRow[]>;
  reportsContentKindDistribution(): Promise<ContentKindDistributionRow[]>;
  reportsDepthHistogram(): Promise<DepthHistogramRow[]>;
  reportsResponseTimeHistogram(): Promise<ResponseTimeHistogramRow[]>;
  reportsTopUrls(input: TopUrlsInput): Promise<TopUrlsRow[]>;
  reportsExternalDomainHealth(limit?: number): Promise<ExternalDomainHealthRow[]>;
  reportsAnalyticsCoverage(): Promise<AnalyticsCoverageRow[]>;
  reportsLinkPositions(): Promise<LinkPositionRow[]>;
  reportsImageWeightPerPage(limit?: number): Promise<ImageWeightRow[]>;
  reportsInlinksHistogram(): Promise<BucketHistogramRow[]>;
  reportsWordCountHistogram(): Promise<BucketHistogramRow[]>;
  reportsUrlLengthHistogram(): Promise<BucketHistogramRow[]>;
  reportsWordCountPerDirectory(
    input: WordCountPerDirectoryInput,
  ): Promise<WordCountPerDirectoryRow[]>;
  reportsSitemapOrphans(limit?: number): Promise<SitemapOrphanRow[]>;
  /** Cross-source orphan URLs — sitemap ∪ GSC ∪ GA4 minus crawled. */
  reportsOrphanCrossSource(limit?: number): Promise<OrphanCrossSourceRow[]>;
  reportsServerHeaders(): Promise<ServerHeaderRow[]>;
  reportsTopWords(input: TopWordsInput): Promise<TopWordsRow[]>;
  /** Heartbeat: renderer reports its latest input-lag sample (ms). */
  reportRendererLag(lagMs: number): void;
  prefsExportSettings(input: SettingsExportInput): Promise<SettingsExportResult>;
  prefsImportSettings(): Promise<SettingsImportResult>;
  /** Read the schedule for the currently-loaded project. `null` when no
   *  project is open OR no schedule has been configured. */
  scheduleGet(): Promise<ScheduleEntry | null>;
  /** Save / update the schedule for the currently-loaded project. Passing
   *  `null` removes the schedule entirely. */
  scheduleSet(spec: ScheduleSpec | null): Promise<ScheduleEntry | null>;
  /** Faz 7 — read the redacted credential state of every integration.
   *  Secret field values are never returned, only a `set` flag. */
  integrationsGetAll(): Promise<IntegrationsState>;
  /** Save (merge) credential fields for one integration. Only the
   *  supplied fields are written; omitted fields keep their stored value. */
  integrationsSet(id: string, fields: Record<string, string>): Promise<IntegrationsState>;
  /** Wipe every stored credential field of one integration. */
  integrationsClear(id: string): Promise<IntegrationsState>;
  /** Open a native directory picker. Returns the chosen path or null on cancel. */
  pickDirectory(input?: { title?: string; defaultPath?: string }): Promise<string | null>;
  /** Resolved default save directory for new projects (Documents fallback when unset). */
  defaultProjectDir(): Promise<string>;
  /** Storage mode the active DB connection is running in (`disk` | `ram`).
   *  May lag the `storageMode` pref until the next launch. */
  storageModeActive(): Promise<'disk' | 'ram'>;
  /** Faz 7 — list crawled internal HTML pages joined with their stored
   *  PageSpeed Insights audit results. */
  pagespeedQuery(input: PagespeedQueryInput): Promise<PagespeedQueryResult>;
  /** Run a PageSpeed Insights audit over the given URLs. Resolves when
   *  the whole run finishes; subscribe to `onPagespeedProgress` for
   *  live progress. */
  pagespeedRun(input: PagespeedRunInput): Promise<PagespeedRunResult>;
  /** Request cancellation of an in-flight PageSpeed run. */
  pagespeedCancel(): Promise<void>;
  /** Live progress of an in-flight PageSpeed run. */
  onPagespeedProgress(cb: (p: PagespeedProgress) => void): () => void;
  /** List crawled internal HTML pages joined with their stored CrUX
   *  real-user field metrics. */
  cruxQuery(input: CruxQueryInput): Promise<CruxQueryResult>;
  /** Fetch CrUX field data for the given URLs. Resolves when the run
   *  finishes; subscribe to `onCruxProgress` for live progress. */
  cruxRun(input: CruxRunInput): Promise<CruxRunResult>;
  /** Request cancellation of an in-flight CrUX run. */
  cruxCancel(): Promise<void>;
  /** Live progress of an in-flight CrUX run. */
  onCruxProgress(cb: (p: CruxProgress) => void): () => void;
  /** List crawled internal HTML pages joined with their stored
   *  spelling / grammar check summary. */
  spellingQuery(input: SpellingQueryInput): Promise<SpellingQueryResult>;
  /** Run a LanguageTool check over the given URLs. Resolves when the run
   *  finishes; subscribe to `onSpellingProgress` for live progress. */
  spellingRun(input: SpellingRunInput): Promise<SpellingRunResult>;
  /** Request cancellation of an in-flight spelling run. */
  spellingCancel(): Promise<void>;
  /** Live progress of an in-flight spelling run. */
  onSpellingProgress(cb: (p: SpellingProgress) => void): () => void;
  /** Full stored match list for one URL. */
  spellingMatches(url: string): Promise<SpellingMatchesResult | null>;
  /** Faz 7 — start the interactive Google OAuth consent flow for one
   *  integration. Resolves once the user finishes (or cancels) in the
   *  browser. */
  googleAuthStart(integrationId: string): Promise<GoogleAuthResult>;
  /** Read the stored OAuth connection state of one Google integration. */
  googleAuthStatus(integrationId: string): Promise<GoogleAuthState>;
  /** Disconnect — wipe the stored OAuth tokens for one integration. */
  googleAuthRevoke(integrationId: string): Promise<GoogleAuthState>;
  /** List the connected account's Search Console properties. */
  gscListSites(): Promise<GscListSitesResult>;
  /** Pull per-page Search Console metrics for the given property + range. */
  gscFetch(input: GscFetchInput): Promise<GscFetchResult>;
  /** List crawled pages joined with their stored Search Console metrics. */
  gscQuery(input: GscQueryInput): Promise<GscQueryResult>;
  /** List the connected account's Google Analytics 4 properties. */
  ga4ListProperties(): Promise<Ga4ListPropertiesResult>;
  /** Pull per-page GA4 metrics for the given property + range. */
  ga4Fetch(input: Ga4FetchInput): Promise<Ga4FetchResult>;
  /** List crawled pages joined with their stored GA4 metrics. */
  ga4Query(input: Ga4QueryInput): Promise<Ga4QueryResult>;
  /** Run an AI prompt against the given URLs through the chosen
   *  provider. Resolves when the run finishes; subscribe to
   *  `onAiProgress` for live updates. */
  aiRun(input: AiRunInput): Promise<AiRunResult>;
  /** Request cancellation of an in-flight AI run. */
  aiCancel(): Promise<void>;
  /** List crawled pages joined with the latest AI result for the
   *  selected provider. */
  aiQuery(input: AiQueryInput): Promise<AiQueryResult>;
  /** Live progress of an in-flight AI run. */
  onAiProgress(cb: (p: AiProgress) => void): () => void;
  /** Faz 7 — run an SEO authority provider against the given URLs. */
  seoRun(input: SeoRunInput): Promise<SeoRunResult>;
  seoCancel(): Promise<void>;
  /** List crawled pages joined with their stored SEO provider metrics. */
  seoQuery(input: SeoQueryInput): Promise<SeoQueryResult>;
  onSeoProgress(cb: (p: SeoProgress) => void): () => void;
  /** Run GSC URL Inspection on the given URLs (rate-limited 2K/day). */
  gscInspectRun(input: GscInspectRunInput): Promise<GscInspectRunResult>;
  gscInspectCancel(): Promise<void>;
  onGscInspectProgress(cb: (p: GscInspectProgress) => void): () => void;
  /** Export a category's rows to a new Google Sheet. Requires the
   *  `sheets` Google integration to be connected. */
  exportSheets(input: ExportSheetsInput): Promise<ExportSheetsResult>;
  /** Export a category's rows to a new BigQuery table in the configured
   *  GCP project. Uses the `bigquery` service-account credentials. */
  exportBigquery(input: ExportBigqueryInput): Promise<ExportBigqueryResult>;
  /** Read the combined Analytics detail (GSC + GA4 + URL Inspection)
   *  for one URL. Returns null when the URL hasn't been crawled. */
  urlAnalyticsGet(url: string): Promise<UrlAnalyticsDetail | null>;
  onLogEntry(cb: (entry: LogEntry) => void): () => void;
  onLogsBatch(cb: (entries: LogEntry[]) => void): () => void;
  onLogsBusy(cb: (busy: boolean) => void): () => void;
  /** V2 Faz 2 — open (or focus) the standalone Log Analyzer window. */
  logAnalyzerOpenWindow(): Promise<void>;
  /** Ingest one access-log file: parse → bot-detect → aggregate → persist.
   *  Omitting `filePath` opens a native file picker. */
  logAnalyze(input: LogAnalyzeInput): Promise<LogAnalyzeResult>;
  /** Top-level roll-up across every ingested log file. */
  logOverview(): Promise<LogOverview>;
  /** Paginated per-URL log activity, joined with the crawl. */
  logUrlStats(input: LogUrlStatsInput): Promise<LogUrlStatsResult>;
  /** Per-bot roll-up (hits + verified-IP counts). */
  logBots(): Promise<LogBotRow[]>;
  /** Response-code distribution from the log. */
  logStatus(): Promise<LogStatusRow[]>;
  /** Daily bot/human hit trend. */
  logTrend(): Promise<LogTrendRow[]>;
  /** Crawled URLs ranked by Googlebot hit count (crawl budget). */
  logCrawlBudget(limit?: number): Promise<LogCrawlBudgetRow[]>;
  /** Bot-hit log URLs the crawl never reached (orphan candidates). */
  logOrphans(input: LogUrlStatsInput): Promise<LogUrlStatsResult>;
  /** Log URLs absent from the crawl, eligible to be seeded. */
  logDiscovery(limit?: number): Promise<LogDiscoveryRow[]>;
  /** Inject discovered log URLs into the active crawl (item 12). */
  logSeedDiscovery(limit?: number): Promise<LogSeedDiscoveryResult>;
  /** Export every analyzer table to a single CSV or multi-sheet XLSX. */
  logExport(input: LogExportInput): Promise<LogExportResult>;
  /** Wipe every ingested log aggregate from the project. */
  logClear(): Promise<void>;
  onProgress(cb: (p: CrawlProgress) => void): () => void;
  onDone(cb: (summary: CrawlSummary) => void): () => void;
  onError(cb: (message: string) => void): () => void;
  onMenuEvent(cb: (event: MenuEvent) => void): () => void;
  onDataChanged(cb: () => void): () => void;
}
