import {
  app,
  BrowserWindow,
  clipboard,
  ipcMain,
  dialog,
  Menu,
  Notification,
  session,
  shell,
  type DownloadItem,
  type MenuItemConstructorOptions,
} from 'electron';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join, resolve as resolvePath, sep as pathSep } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { totalmem, freemem } from 'node:os';
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
  type ExportBrokenLinksInput,
  type ExportBrokenLinksResult,
  type ExportImagesInput,
  type ExportImagesResult,
  type ExportTabularInput,
  type ExportTabularResult,
  type DataDeleteByDomainInput,
  type DataDeleteByDomainResult,
  type CrashRecoveryStatus,
  type ExportHtmlReportInput,
  type ExportHtmlReportResult,
  type BulkExportResult,
  type UrlCategory,
  type CompareLoadInput,
  type CompareLoadResult,
  type GraphSnapshotInput,
  type GraphSnapshotResult,
  type CrawlPathInput,
  type CrawlPathResult,
  type AnchorTextRow,
  type RobotsTestInput,
  type SitemapValidateInput,
  type SitemapValidateResult,
  type UrlRewritePreviewInput,
  type UrlRewritePreviewResult,
  type CustomExtractionRule,
  type ExtractionPreviewInput,
  type ExtractionPreviewResult,
  type ExtractionRulesExportResult,
  type ExtractionRulesImportResult,
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
  type PagespeedQueryInput,
  type PagespeedQueryResult,
  type PagespeedRunInput,
  type PagespeedRunResult,
  type PagespeedStrategy,
  type CruxQueryInput,
  type CruxQueryResult,
  type CruxRunInput,
  type CruxRunResult,
  type CruxFormFactor,
  type SpellingQueryInput,
  type SpellingQueryResult,
  type SpellingRunInput,
  type SpellingRunResult,
  type SpellingMatchesResult,
  type SpellingLevel,
  type GoogleAuthState,
  type GoogleAuthResult,
  type GscListSitesResult,
  type GscFetchInput,
  type GscFetchResult,
  type GscFetchMeta,
  type GscQueryInput,
  type GscQueryResult,
  type Ga4ListPropertiesResult,
  type Ga4FetchInput,
  type Ga4FetchResult,
  type Ga4FetchMeta,
  type Ga4QueryInput,
  type Ga4QueryResult,
  type AiRunInput,
  type AiRunResult,
  type AiQueryInput,
  type AiQueryResult,
  type SeoRunInput,
  type SeoRunResult,
  type SeoQueryInput,
  type SeoQueryResult,
  type GscInspectRunInput,
  type GscInspectRunResult,
  type ExportSheetsInput,
  type ExportSheetsResult,
  type ExportBigqueryInput,
  type ExportBigqueryResult,
  type GscInspectionResult,
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
  type LogIngestInput,
  type LogImportSummary,
  type LogExportInput,
  type LogExportResult,
  type LogEntry,
} from '@freecrawl/shared-types';
import {
  BrowserPool,
  PlaywrightBrowserMissingError,
  Crawler,
  renderUrl,
  auditMobileUsability,
  exportUrlsToCsv,
  exportBrokenLinksToCsv,
  exportImagesToCsv,
  exportUrlsToJson,
  exportUrlsToXml,
  exportTabular,
  exportSitemap,
  exportHtmlReport,
  compareCrawls,
  testUrlAgainstRobots,
  validateRobotsTxt,
  aggregateTopWords,
  fetchSitemaps,
  validateSitemap,
  normalizeUrl,
  compileUrlRegexRewrites,
  previewExtractionRules,
  runBulkExport,
  analyzeLogFile,
  buildLogExportXlsx,
  buildLogExportCsv,
  extractProseText,
  type LogAnalysisResult,
  type LogExportTables,
} from '@freecrawl/core';
import { fetch as undiciFetch } from 'undici';
import { apiFetch } from './api-fetch.js';
import { spawn } from 'node:child_process';
import { ProjectDb } from '@freecrawl/db';
import { buildAppMenu } from './menu.js';
import { getMenuLabels, isMenuLang, type MenuLang } from './menu-i18n.js';
import {
  getState as getIntegrationsState,
  setCredentials as setIntegrationCredentials,
  clearCredentials as clearIntegrationCredentials,
  resolveCredentials,
} from './credentials.js';
import { runPagespeedBatch, type PagespeedBatchItem } from './pagespeed.js';
import { runCruxBatch, type CruxBatchItem } from './crux.js';
import {
  runSpellingBatch,
  PUBLIC_LT_ENDPOINT,
  type SpellingCheckOptions,
} from './languagetool.js';
import { startAuth, getAuthState, revokeAuth } from './google-oauth.js';
import { listSites, querySearchAnalytics, inspectUrl } from './gsc.js';
import { exportCategoryToSheets } from './sheets-export.js';
import { exportCategoryToBigQuery } from './bigquery-export.js';
import { listProperties as ga4ListProperties, runReport as ga4RunReport } from './ga4.js';
import { runAiBatch, type AiBatchItem } from './ai-batch.js';
import { resolveModel, defaultConcurrency } from './ai-providers.js';
import { runSeoBatch } from './seo-batch.js';
import * as logger from './logger.js';
import { dbReaderPool, callReaderOrFallback } from './db-reader-pool.js';
import { dbWriterPool } from './db-writer-pool.js';
import { freezeWatchdog } from './freeze-watchdog.js';
import { parserPool } from './parser-pool.js';
import { parseHtml as inlineParseHtml } from '@freecrawl/core';
import {
  startMcpBridge,
  stopMcpBridge,
  type McpStartCrawlInput,
} from './mcp-bridge.js';
import {
  claimIfDue,
  getSchedule,
  recordFireResult,
  setSchedule,
  type SchedulerStore,
} from './scheduler.js';
import type { ProjectDb as ProjectDbType } from '@freecrawl/db';

const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let logsWindow: BrowserWindow | null = null;
/** Standalone Visualization popup — single-instance, native window. */
let visualizationWindow: BrowserWindow | null = null;
/** V2 Faz 2 — standalone Log File Analyzer popup, single-instance. */
let logAnalyzerWindow: BrowserWindow | null = null;
let db: ProjectDb | null = null;
let activeCrawler: Crawler | null = null;
/** V2 Faz 1 — Playwright browser pool, lazily started when a JS-mode
 *  crawl launches. Disposed on crawl stop/clear/app quit. */
let activeBrowserPool: BrowserPool | null = null;
/** Faz 7 — PageSpeed run guard. Only one PSI batch may run at a time;
 *  `pagespeedCancelRequested` is the cooperative cancel flag. */
let pagespeedRunActive = false;
let pagespeedCancelRequested = false;
/** Faz 7 — AI run guard. Same shape as the PSI guard. */
let aiRunActive = false;
let aiCancelRequested = false;
/** Faz 7 — SEO provider run guard. */
let seoRunActive = false;
let seoCancelRequested = false;
/**
 * V2 Faz 0.5 Increment 5 — live snapshot of each slow batch-fetch run
 * (PageSpeed / AI / SEO), polled by the MCP `get_fetch_progress` tool.
 * The shared run-job helpers below update these whether the run was
 * triggered from the renderer or the MCP bridge, so an agent can watch a
 * user-started run too. The renderer keeps consuming its own `*Progress`
 * IPC events — this snapshot is purely the MCP poll surface.
 */
interface FetchRunSnapshot {
  running: boolean;
  done: number;
  total: number;
  completed: number;
  failed: number;
  currentUrl: string | null;
  cancelled: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  /** Provider id for ai/seo runs; null for pagespeed. */
  provider: string | null;
  /** Set when the run threw before finishing. */
  error: string | null;
}
function idleFetchSnapshot(): FetchRunSnapshot {
  return {
    running: false,
    done: 0,
    total: 0,
    completed: 0,
    failed: 0,
    currentUrl: null,
    cancelled: false,
    startedAt: null,
    finishedAt: null,
    provider: null,
    error: null,
  };
}
let pagespeedRunSnapshot: FetchRunSnapshot = idleFetchSnapshot();
let aiRunSnapshot: FetchRunSnapshot = idleFetchSnapshot();
let seoRunSnapshot: FetchRunSnapshot = idleFetchSnapshot();
/** CrUX run guard + MCP poll snapshot — same shape as the PSI guard. */
let cruxRunActive = false;
let cruxCancelRequested = false;
let cruxRunSnapshot: FetchRunSnapshot = idleFetchSnapshot();
/** LanguageTool (spelling & grammar) run guard + MCP poll snapshot. */
let spellingRunActive = false;
let spellingCancelRequested = false;
let spellingRunSnapshot: FetchRunSnapshot = idleFetchSnapshot();
/** Faz 7 — GSC URL Inspection run guard. */
let gscInspectRunActive = false;
let gscInspectCancelRequested = false;
/** Most-recent CrawlConfig — needed by the crash-recovery resume
 * flow so we can re-create the Crawler with the same knobs the user
 * had set, without re-prompting. Hydrated lazily from `project_meta`
 * on first DB open. */
let lastCrawlConfig: CrawlConfig | null = null;
/** Latest `CrawlProgress` event captured from the active Crawler.
 * Exposed to the MCP bridge so external agents (Claude Code, etc.)
 * can poll live crawl state without a renderer subscription. Null
 * when no crawl has run since app launch. */
let latestProgress: CrawlProgress | null = null;
/** Handle to the in-process crawl control primitives. Populated by
 * `registerIpc()` so the MCP bridge can drive Start/Stop/Pause/Resume
 * through the same code path as the renderer's IPC handlers — without
 * having to know about the closure-scoped helpers. Null before
 * `registerIpc()` runs. */
let crawlController: {
  launchCrawl: (config: CrawlConfig) => Promise<void>;
  stopCrawl: () => void;
  pauseCrawl: () => void;
  resumeCrawl: () => void;
  /** Wipe URL/links/images/headers/queue tables. Same primitive the
   *  desktop "Clear" button calls — wired here so the MCP bridge can
   *  invoke it without duplicating the writer-pool serialisation +
   *  recovery-checkpoint reset logic. */
  clearCrawl: () => Promise<void>;
  /** Generic MCP action dispatch table. Built once inside the IPC
   *  registration scope (which captures closures over getDb /
   *  mainWindow / schedulerStore / etc) and handed to the bridge's
   *  generic `/v1/action/<name>` route. Keys are short kebab-case
   *  action names matching the MCP tool's `bridgeRequest` path. */
  actions: Record<string, (input: unknown) => Promise<unknown>>;
} | null = null;
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
  // Never write a cache that was never loaded — `prefsCache` is still
  // the empty default. This guards the rejected second instance: its
  // `before-quit` → `performShutdown` runs `flushPrefs`, and writing
  // `{}` here would clobber the running first instance's saved prefs.
  if (!prefsLoaded) return;
  try {
    writeFileSync(prefsFilePath(), JSON.stringify(prefsCache, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

function fireDataChanged(): void {
  mainWindow?.webContents.send(IPC.dataChanged);
  // Mirror the event to the standalone Visualization window so its
  // Cytoscape graph repaints when a crawl finishes or rows change.
  if (visualizationWindow && !visualizationWindow.isDestroyed()) {
    visualizationWindow.webContents.send(IPC.dataChanged);
  }
  // V2 Faz 2 — keep the Log Analyzer window's crawl × log joins fresh
  // when the crawl mutates (orphan/budget reports depend on the URL set).
  if (logAnalyzerWindow && !logAnalyzerWindow.isDestroyed()) {
    logAnalyzerWindow.webContents.send(IPC.dataChanged);
  }
}

/**
 * Schedule-store adapter — bridges the scheduler module to the prefs
 * cache. `load()` always returns a fresh object reference so the
 * module's mutate-then-save flow can't leak references back into the
 * prefs cache without an explicit `save()`.
 */
const schedulerStore: SchedulerStore = {
  load() {
    const raw = prefsCache['schedules'];
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      // Shallow clone — callers mutate this map.
      return { ...(raw as Record<string, ScheduleEntry>) };
    }
    return {};
  },
  save(map) {
    prefsCache['schedules'] = map;
    schedulePrefsWrite();
  },
};

let schedulerTickTimer: NodeJS.Timeout | null = null;
/** Set to true at the moment the scheduler tick calls `launchCrawl`,
 *  cleared on the next crawl-done / crawl-error event. Lets the
 *  done/error handlers update the schedule's `lastStatus` without
 *  duplicating the launch path for user-initiated crawls. */
let crawlerStartedByScheduler = false;

/**
 * Scheduler tick — invoked every 60 s while the app is open. Checks
 * whether the currently-loaded project has a due schedule and, if so,
 * launches the crawl using the last-used CrawlConfig.
 *
 * No-ops when:
 *   - No project is loaded
 *   - A crawl is already running (we don't preempt a manual crawl)
 *   - The schedule isn't due yet
 *   - No CrawlConfig has ever been saved (we'd have nothing to fire)
 */
function schedulerTick(): void {
  if (!currentProjectPath) return;
  if (activeCrawler) return;
  const entry = claimIfDue(schedulerStore, currentProjectPath);
  if (!entry) return;
  if (!lastCrawlConfig) {
    // No saved config — record a failure so the dialog surfaces the
    // condition rather than silently retrying on the next tick.
    recordFireResult(schedulerStore, currentProjectPath, 'failure');
    logger.log(
      'warn',
      'scheduler',
      `Schedule due for ${currentProjectPath} but no CrawlConfig saved yet — run a crawl manually once first.`,
    );
    return;
  }
  if (!crawlController) {
    recordFireResult(schedulerStore, currentProjectPath, 'failure');
    return;
  }
  logger.log(
    'info',
    'scheduler',
    `Scheduled crawl firing: ${lastCrawlConfig.startUrl} (cadence=${entry.spec.cadence})`,
  );
  crawlerStartedByScheduler = true;
  void crawlController.launchCrawl(lastCrawlConfig);
}

function startScheduler(): void {
  if (schedulerTickTimer) return;
  // 60 s tick is granular enough for hourly/daily/weekly cadences and
  // for the 15-min minimum custom interval. Wall-clock drift across an
  // hour-long browser session is negligible at this resolution.
  schedulerTickTimer = setInterval(schedulerTick, 60_000);
  // Fire once shortly after startup so a daily schedule whose target
  // time-of-day has already passed today doesn't wait 60 s before
  // checking. 3 s lets the renderer mount + initial DB load finish.
  setTimeout(schedulerTick, 3_000);
}

function stopScheduler(): void {
  if (schedulerTickTimer) {
    clearInterval(schedulerTickTimer);
    schedulerTickTimer = null;
  }
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

/** Storage mode the active DB connection was opened in. Resolved from the
 *  `storageMode` pref at first open; `ram` means the project lives in an
 *  in-memory database and the worker pools are disabled. */
let storageModeActive: 'disk' | 'ram' = 'disk';

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

/**
 * Run the post-crawl issue recompute on the writer worker. This pass
 * has 70+ correlated SQL subqueries against the urls table; on a
 * 5K-URL crawl it takes ~45 s, and running it on the main thread
 * freezes the renderer for that entire window (the "Not Responding"
 * dialog). Routing through the writer worker keeps main free.
 */
async function recomputeIssuesViaPool(
  definitions: ReadonlyArray<readonly [string, string]>,
): Promise<void> {
  if (!dbWriterPool.isReady()) {
    return getDb().recomputeUrlsIssuesYielding(definitions);
  }
  try {
    await dbWriterPool.call<void>('recomputeUrlsIssuesYielding', [definitions]);
  } catch (err) {
    logger.log(
      'warn',
      'main',
      `recomputeUrlsIssuesYielding dispatch failed (${
        err instanceof Error ? err.message : String(err)
      }) — falling back to main-thread recompute.`,
    );
    await getDb().recomputeUrlsIssuesYielding(definitions);
  }
}

/**
 * Generic post-crawl pass dispatcher. Routes recomputeInlinks,
 * recomputeRedirectChains, recomputeHreflangAnalysis,
 * recomputeHreflangInconsistent, and recomputePaginationSequence
 * through the writer worker so the main thread stays responsive to
 * Stop/Pause clicks and IPC traffic during the post-crawl phase.
 * Without this, those five sync SQL passes combined freeze main for
 * 5–15 s on a 5K-URL crawl — exactly the window where users hit
 * Stop/Pause and "nothing happens".
 */
async function runDbPassViaPool(method: string): Promise<void> {
  if (!dbWriterPool.isReady()) {
    const fn = (getDb() as unknown as Record<string, unknown>)[method];
    if (typeof fn === 'function') (fn as () => void).call(getDb());
    return;
  }
  try {
    await dbWriterPool.call<void>(method, []);
  } catch (err) {
    logger.log(
      'warn',
      'main',
      `${method} dispatch failed (${
        err instanceof Error ? err.message : String(err)
      }) — falling back to main-thread.`,
    );
    const fn = (getDb() as unknown as Record<string, unknown>)[method];
    if (typeof fn === 'function') (fn as () => void).call(getDb());
  }
}

/**
 * Generic per-call writer dispatcher used by the crawler's hot-path
 * sync writes (`upsertUrl` for redirects/non-HTML/network-fail rows,
 * `updateExternalProbe`, `setUrlHeaders`, `setSitemapUrls`,
 * `checkpointQueue`). Routing them through the writer worker keeps
 * SQLite to a single writer connection during a crawl — `busy_timeout`
 * is no longer load-bearing because there is nothing to contend with.
 * Falls back to running on the main-thread `ProjectDb` when the worker
 * is crashed/restarting so writes still happen.
 */
async function dbCallViaPool<T>(method: string, args: unknown[]): Promise<T> {
  if (!dbWriterPool.isReady()) {
    const fn = (getDb() as unknown as Record<string, unknown>)[method];
    if (typeof fn !== 'function') {
      throw new Error(`dbCallViaPool: unknown method ${method}`);
    }
    return (fn as (...a: unknown[]) => T).apply(getDb(), args);
  }
  try {
    return await dbWriterPool.call<T>(method, args);
  } catch (err) {
    logger.log(
      'warn',
      'main',
      `dbCall(${method}) fell back to main-thread: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    const fn = (getDb() as unknown as Record<string, unknown>)[method];
    if (typeof fn !== 'function') {
      throw new Error(`dbCallViaPool fallback: unknown method ${method}`);
    }
    return (fn as (...a: unknown[]) => T).apply(getDb(), args);
  }
}

function getDb(): ProjectDb {
  if (!db) {
    loadPrefs();
    // Storage mode (Settings → Storage). RAM-only keeps the whole project
    // in an in-memory SQLite database (`:memory:`) — fastest, nothing
    // touches disk until Save As serialises it out. A `:memory:` DB is
    // private to a single connection, so the reader/writer worker pools are
    // disabled in this mode and every query runs on the main-thread
    // connection (the pool-call wrappers already fall back to it when the
    // pools aren't ready). Applies at first open, i.e. on the next launch.
    const ramMode = prefsCache['storageMode'] === 'ram';
    storageModeActive = ramMode ? 'ram' : 'disk';
    const dataDir = join(app.getPath('userData'), 'projects');
    mkdirSync(dataDir, { recursive: true });
    const defaultPath = join(dataDir, 'default.seoproject');
    db = new ProjectDb(ramMode ? ':memory:' : defaultPath);
    currentProjectPath = '';
    // Wave 6 — Snapshot the previous session's crash-recovery state
    // BEFORE the reset wipes the project tables. We capture the
    // checkpointed pending queue + the cached crawl config so the
    // user can be offered a resume on app start. The DB tables go
    // back to empty after `reset()`; the in-memory snapshot stays
    // until the user accepts/discards the recovery prompt.
    try {
      const raw = db.getMeta('lastCrawlConfig');
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CrawlConfig>;
        lastCrawlConfig = {
          ...DEFAULT_CRAWL_CONFIG,
          ...parsed,
          jsRender: {
            ...DEFAULT_CRAWL_CONFIG.jsRender,
            ...(parsed.jsRender ?? {}),
            blockResources: {
              ...DEFAULT_CRAWL_CONFIG.jsRender.blockResources,
              ...(parsed.jsRender?.blockResources ?? {}),
            },
            screenshotMode:
              parsed.jsRender?.screenshotMode ??
              DEFAULT_CRAWL_CONFIG.jsRender.screenshotMode,
            mobileScreenshot:
              parsed.jsRender?.mobileScreenshot ??
              DEFAULT_CRAWL_CONFIG.jsRender.mobileScreenshot,
            mobileUsability:
              parsed.jsRender?.mobileUsability ??
              DEFAULT_CRAWL_CONFIG.jsRender.mobileUsability,
            lcpCandidate:
              parsed.jsRender?.lcpCandidate ??
              DEFAULT_CRAWL_CONFIG.jsRender.lcpCandidate,
            a11yAudit:
              parsed.jsRender?.a11yAudit ??
              DEFAULT_CRAWL_CONFIG.jsRender.a11yAudit,
          },
          performanceBudget: {
            ...DEFAULT_CRAWL_CONFIG.performanceBudget,
            ...(parsed.performanceBudget ?? {}),
          },
        };
      }
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
    if (ramMode) {
      // In-memory DB can't be shared across worker connections, so keep
      // everything on the main-thread connection. Save As (`VACUUM INTO`)
      // serialises it to disk and switches back to a pooled disk project.
      logger.log(
        'info',
        'main',
        'Storage mode: RAM-only — project held in an in-memory database; worker pools disabled. Save As writes it to disk.',
      );
    } else {
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
  // Opening a real `.seoproject` file always lands us in disk mode, even
  // when the previous project was an in-memory (RAM-only) scratch DB — the
  // pool `swap` below spins the worker pools up against the disk file.
  storageModeActive = 'disk';
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

function getMenuLang(): MenuLang {
  const raw = prefsCache['uiLanguage'];
  return isMenuLang(raw) ? raw : 'en';
}

/** Localized menu/dialog labels for the active UI language. Lets native
 *  dialogs pull `L().dlgX` inline without threading a param through handlers. */
function L(): ReturnType<typeof getMenuLabels> {
  return getMenuLabels(getMenuLang());
}

function rebuildMenu(): void {
  Menu.setApplicationMenu(
    buildAppMenu({
      lang: getMenuLang(),
      onOpenLogs: openLogsWindow,
      onOpenProject: () => void promptOpenProject(),
      onOpenRecent: (path) => {
        try {
          openProjectAtPath(path);
        } catch (err) {
          dialog.showErrorBox(
            L().dlgOpenProjectFailedTitle,
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
      onCheckForUpdates: () => void checkForUpdates(),
      onOpenLogAnalyzer: () => openLogAnalyzerWindow(),
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
        title: L().dlgLogsFolderUnavailableTitle,
        message: L().dlgLogsFolderUnavailableMsg,
        buttons: [L().btnOk],
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
      title: L().dlgDiagResetTitle,
      message:
        removed === 0
          ? 'No suppressed diagnostic warnings to reset.'
          : `Re-enabled ${removed} previously dismissed warning${removed === 1 ? '' : 's'}. They will pop up again the next time the underlying issue occurs.`,
      buttons: [L().btnOk],
      noLink: true,
    });
  }
}

/**
 * Compare two semver strings (X.Y.Z, optional `v` prefix). Returns
 *   -1 if `a < b`,  0 if equal,  +1 if `a > b`.
 * Pre-release suffixes are ignored — the user's installed build is
 * compared against the release tag's release-line only. Sufficient for
 * a "should I show an update prompt?" decision; full semver semantics
 * would need a dependency we'd rather not pull in for one menu item.
 */
function compareSemver(a: string, b: string): number {
  const norm = (s: string) =>
    s
      .trim()
      .replace(/^v/, '')
      .split('-')[0]!
      .split('.')
      .map((p) => parseInt(p, 10) || 0);
  const pa = norm(a);
  const pb = norm(b);
  for (let i = 0; i < 3; i++) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
}

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
  size?: number;
}

interface GitHubLatestRelease {
  tag_name?: string;
  name?: string;
  html_url?: string;
  body?: string;
  draft?: boolean;
  prerelease?: boolean;
  published_at?: string;
  assets?: GitHubReleaseAsset[];
}

/**
 * Pick the installer asset for the current host platform/arch from a
 * GitHub Release's asset list. Returns null if no matching asset is
 * found — caller falls back to "open release page" so the user can
 * pick manually. Excludes electron-builder's `.blockmap` siblings; we
 * only want the user-runnable installer.
 */
function pickInstallerAsset(assets: GitHubReleaseAsset[]): GitHubReleaseAsset | null {
  const list = (assets ?? []).filter(
    (a) => a && typeof a.name === 'string' && !a.name.endsWith('.blockmap'),
  );
  if (process.platform === 'win32') {
    // The Windows release ships two `.exe` assets — the NSIS installer
    // (`…Setup….exe`) and the standalone portable build
    // (`…-portable.exe`). "Check for Updates" must offer the installer:
    // prefer the `Setup` asset, fall back to any non-portable `.exe`,
    // and only as a last resort take whatever `.exe` exists.
    const exes = list.filter((a) => /\.exe$/i.test(a.name));
    return (
      exes.find((a) => /setup/i.test(a.name)) ??
      exes.find((a) => !/portable/i.test(a.name)) ??
      exes[0] ??
      null
    );
  }
  if (process.platform === 'darwin') {
    const isArm = process.arch === 'arm64';
    if (isArm) {
      return list.find((a) => /-arm64\.dmg$/i.test(a.name)) ?? null;
    }
    // Intel Macs: pick the `.dmg` that is NOT the arm64 build.
    return list.find((a) => /\.dmg$/i.test(a.name) && !/arm64/i.test(a.name)) ?? null;
  }
  // Linux installers aren't published yet; caller falls back to release page.
  return null;
}

/**
 * Strip a subset of GitHub-flavoured Markdown so it renders cleanly in
 * Electron's plain-text `dialog.showMessageBox` `detail` field. The
 * native dialog doesn't support markdown; this turns `**bold**`,
 * `[text](url)`, headings, code fences, and bullets into readable
 * plain text instead of leaving the raw `**` / `[…](…)` punctuation
 * in the user's face. Lossy by design — full notes are one click away
 * via "Open Release Page".
 */
function stripMarkdownToPlain(md: string): string {
  if (!md) return '';
  return md
    // Code fences: keep the inner code lines, drop the ``` markers.
    .replace(/```[^\n]*\n([\s\S]*?)```/g, (_m, code: string) => code.trimEnd())
    // Inline code: drop the backticks.
    .replace(/`([^`]+)`/g, '$1')
    // Images: ![alt](url) -> alt (drop URL since alt is the human-readable bit)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Links: [text](url) -> text (url) so the URL is still visible.
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    // Bold: **x** / __x__
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Italic: *x* / _x_ (single delimiter)
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1$2')
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1$2')
    // Strikethrough
    .replace(/~~([^~]+)~~/g, '$1')
    // Headings: drop the leading #'s, keep the text.
    .replace(/^#{1,6}\s+/gm, '')
    // Bullet list markers -> "• "
    .replace(/^\s*[-*+]\s+/gm, '• ')
    // Collapse runs of blank lines to at most one.
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Pref-key namespace for "Don't show again — version X.Y.Z" — re-uses
 * the existing `skipDiag:` prefix so the Help → Reset Diagnostic
 * Warnings menu also clears these. Keying is per-version so a NEW
 * release surfaces a fresh prompt even if the user dismissed the
 * previous one.
 */
function dismissedUpdatePrefKey(tag: string): string {
  return `skipDiag:update-${tag}`;
}

function isUpdateVersionDismissed(tag: string): boolean {
  loadPrefs();
  return prefsCache[dismissedUpdatePrefKey(tag)] === true;
}

function dismissUpdateVersion(tag: string): void {
  loadPrefs();
  prefsCache[dismissedUpdatePrefKey(tag)] = true;
  schedulePrefsWrite();
}

/**
 * Download an installer asset to the user's Downloads folder via
 * Electron's session download infrastructure (Chromium handles
 * redirects + connection management; we get progress + cancel events).
 * On success reveals the file in the OS file manager so the user can
 * double-click to install. Progress is surfaced through the main
 * window's taskbar/dock progress bar — no extra UI needed.
 *
 * No code-signing, so we cannot auto-execute the installer for the
 * user. Reveal-in-folder is the safest middle ground: kullanıcı one
 * click yapıyor, OS uyarısını bilinçli olarak geçiyor.
 */
async function downloadAndRevealInstaller(asset: GitHubReleaseAsset): Promise<void> {
  const win = mainWindow;
  if (!win) return;
  const downloadsDir = app.getPath('downloads');
  try {
    mkdirSync(downloadsDir, { recursive: true });
  } catch {
    /* getPath('downloads') always exists on Win/macOS but be defensive */
  }
  const savePath = join(downloadsDir, asset.name);

  await new Promise<void>((resolve) => {
    const handler = (
      _e: { preventDefault: () => void; readonly defaultPrevented: boolean },
      item: DownloadItem,
    ) => {
      const url = item.getURL();
      // GitHub redirects browser_download_url → S3; both share the asset
      // filename, so we match on filename rather than exact URL.
      if (!url.includes(asset.name)) return;
      session.defaultSession.removeListener('will-download', handler);
      item.setSavePath(savePath);

      item.on('updated', (_evt, state) => {
        if (state === 'progressing' && !item.isPaused()) {
          const total = item.getTotalBytes();
          const received = item.getReceivedBytes();
          if (total > 0) {
            try {
              win.setProgressBar(received / total);
            } catch {
              /* window may be destroyed mid-download */
            }
          }
        }
      });

      item.once('done', (_evt, state) => {
        try {
          win.setProgressBar(-1);
        } catch {
          /* ignore */
        }
        if (state === 'completed') {
          try {
            shell.showItemInFolder(savePath);
          } catch {
            /* ignore — user can navigate manually */
          }
          void dialog.showMessageBox(win, {
            type: 'info',
            title: L().dlgDownloadCompleteTitle,
            message: `${asset.name} downloaded.`,
            detail:
              `Saved to:\n${savePath}\n\n` +
              `The Downloads folder has been opened — double-click the installer to upgrade.\n\n` +
              (process.platform === 'win32'
                ? 'Windows SmartScreen may show "Unrecognized app" because the installer is not code-signed. Click "More info → Run anyway" to proceed.'
                : process.platform === 'darwin'
                  ? 'macOS Gatekeeper may block the app on first open because it is not notarised. Right-click the .dmg → Open to bypass.'
                  : ''),
            buttons: [L().btnOk],
            noLink: true,
          });
        } else {
          void dialog.showMessageBox(win, {
            type: 'error',
            title: L().dlgDownloadFailedTitle,
            message: `Could not download ${asset.name}`,
            detail: `Download state: ${state}\n\nYou can retry from the GitHub Releases page.`,
            buttons: [L().btnOk],
            noLink: true,
          });
        }
        resolve();
      });
    };
    session.defaultSession.on('will-download', handler);
    try {
      session.defaultSession.downloadURL(asset.browser_download_url);
    } catch (err) {
      session.defaultSession.removeListener('will-download', handler);
      void dialog.showMessageBox(win, {
        type: 'error',
        title: L().dlgDownloadFailedTitle,
        message: L().dlgDownloadStartFailedMsg,
        detail: err instanceof Error ? err.message : String(err),
        buttons: [L().btnOk],
        noLink: true,
      });
      resolve();
    }
  });
}

/**
 * Update check. Hits the GitHub Releases API for the latest non-draft,
 * non-prerelease tag, compares it with `app.getVersion()`, and surfaces
 * a native dialog. Three outcomes:
 *   - up-to-date           → "You're on the latest version (vX.Y.Z)"
 *   - update available     → "v0.X.Y is available" + Download / Open Release Page / Later
 *   - network error / rate → "Couldn't check" with the underlying error
 *
 * `silent: true` is used by the one-shot startup auto-check — only the
 * "update available AND not dismissed by the user" outcome surfaces a
 * dialog; up-to-date / network errors / dismissed-versions stay quiet.
 * The manual menu invocation passes `silent: false` and always shows.
 *
 * No `electron-updater` dependency, no auto-install (that would need
 * macOS notarisation + Windows code-signing first). The Download
 * Installer button fetches the platform-matched asset to the user's
 * Downloads folder and reveals it in Explorer / Finder; user double-
 * clicks to upgrade.
 */
/**
 * Re-entrancy guard for `checkForUpdates`. Prevents stacked dialogs
 * when (a) the user clicks Help → Check for Updates while the silent
 * startup auto-check is still resolving its GitHub API request, or
 * (b) the user double-clicks the menu item before the first dialog
 * paints. Cleared in the `finally` block of `checkForUpdates`.
 */
let updateCheckInFlight = false;

async function checkForUpdates(opts: { silent?: boolean } = {}): Promise<void> {
  const silent = opts.silent === true;
  if (updateCheckInFlight) {
    logger.log(
      'debug',
      'main',
      `checkForUpdates skipped — another check is in progress (silent=${silent}).`,
    );
    return;
  }
  updateCheckInFlight = true;
  try {
    await runUpdateCheck(silent);
  } finally {
    updateCheckInFlight = false;
  }
}

async function runUpdateCheck(silent: boolean): Promise<void> {
  const win = mainWindow;
  if (!win) return;
  const installed = app.getVersion();
  const apiUrl =
    'https://api.github.com/repos/kemalai/FreeCrawl-SEO-Tool/releases/latest';

  let release: GitHubLatestRelease | null = null;
  let fetchError: string | null = null;
  try {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 10_000);
    try {
      const res = await apiFetch(apiUrl, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': `FreeCrawl-SEO-Tool/${installed}`,
        },
        signal: ac.signal,
      });
      if (!res.ok) {
        fetchError = `GitHub API returned ${res.status} ${res.statusText}`;
      } else {
        release = (await res.json()) as GitHubLatestRelease;
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    fetchError =
      err instanceof Error ? err.message : 'Unknown error contacting GitHub';
  }

  if (fetchError || !release || !release.tag_name) {
    if (silent) {
      logger.log(
        'debug',
        'main',
        `Startup update check skipped: ${fetchError ?? 'no tag in response'}`,
      );
      return;
    }
    void dialog.showMessageBox(win, {
      type: 'warning',
      title: L().dlgUpdateCheckFailedTitle,
      message: "Couldn't reach the GitHub Releases API.",
      detail:
        (fetchError ?? 'No release tag in response.') +
        '\n\nYou can browse releases manually at:\nhttps://github.com/kemalai/FreeCrawl-SEO-Tool/releases',
      buttons: [L().btnOpenReleasesPage, L().btnClose],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    }).then((r) => {
      if (r.response === 0) {
        void shell.openExternal(
          'https://github.com/kemalai/FreeCrawl-SEO-Tool/releases',
        );
      }
    });
    return;
  }

  const latest = release.tag_name;
  const cmp = compareSemver(installed, latest);
  if (cmp >= 0) {
    if (silent) return;
    void dialog.showMessageBox(win, {
      type: 'info',
      title: L().dlgUpToDateTitle,
      message: `You're on the latest version (v${installed}).`,
      detail: release.published_at
        ? `Latest GitHub release: ${latest}\nPublished: ${new Date(release.published_at).toLocaleString()}`
        : `Latest GitHub release: ${latest}`,
      buttons: [L().btnOk],
      noLink: true,
    });
    return;
  }

  // User-suppressed this version via "Don't show this version again".
  // Startup auto-check honours the dismissal silently. Manual click
  // still shows so the user can re-decide / hit Download anyway.
  if (silent && isUpdateVersionDismissed(latest)) {
    logger.log('debug', 'main', `Startup update check: ${latest} dismissed by user.`);
    return;
  }

  // Newer version available. Strip raw markdown for a readable plain-
  // text preview in the native dialog (which doesn't support markdown);
  // the dialog stays roomy for ~1500 chars now that the user can stay
  // in-app to download instead of jumping to a browser.
  const notes = stripMarkdownToPlain(release.body ?? '');
  const notesPreview =
    notes.length > 1500 ? notes.slice(0, 1500).trimEnd() + '\n…' : notes;
  const installerAsset = pickInstallerAsset(release.assets ?? []);
  const detail =
    `Installed: v${installed}\nLatest:    ${latest}\n\n` +
    (notesPreview
      ? `Release notes:\n${notesPreview}`
      : 'See the release page for the changelog.');

  // Three-way choice: in-app download (primary, when an asset matches the
  // host platform), open release page (always available — fallback for
  // Linux / unmatched arch), Later. Plus a "Don't show this version
  // again" checkbox keyed by tag so a NEW release re-prompts.
  const buttons = installerAsset
    ? ['Download Installer', 'Open Release Page', 'Later']
    : ['Open Release Page', 'Later'];
  const downloadBtn = installerAsset ? 0 : -1;
  const releasePageBtn = installerAsset ? 1 : 0;
  const laterBtn = installerAsset ? 2 : 1;

  const result = await dialog.showMessageBox(win, {
    type: 'info',
    title: L().dlgUpdateAvailableTitle,
    message: `${latest} is available.`,
    detail,
    buttons,
    defaultId: downloadBtn >= 0 ? downloadBtn : releasePageBtn,
    cancelId: laterBtn,
    checkboxLabel: "Don't show this version again",
    checkboxChecked: false,
    noLink: true,
  });

  if (result.checkboxChecked) {
    dismissUpdateVersion(latest);
  }

  if (result.response === downloadBtn && installerAsset) {
    await downloadAndRevealInstaller(installerAsset);
    return;
  }
  if (result.response === releasePageBtn) {
    const url =
      release?.html_url ??
      'https://github.com/kemalai/FreeCrawl-SEO-Tool/releases/latest';
    void shell.openExternal(url);
  }
}

async function promptOpenProject(): Promise<void> {
  if (!mainWindow) return;
  const res = await dialog.showOpenDialog(mainWindow, {
    title: L().dlgOpenProjectTitle,
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
      L().dlgOpenProjectFailedTitle,
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
      // Keep the renderer's frame loop at full rate even when the window
      // loses focus — otherwise focusing the Logs window throttles this
      // window's requestAnimationFrame, dropping its FPS and starving
      // the freeze-watchdog's renderer heartbeat (it then logs a false
      // STALL:RENDERER). The Logs window already sets this; the main
      // window needs it for the same reason.
      backgroundThrottling: false,
    },
  });

  mainWindow.on('ready-to-show', () => mainWindow?.show());

  // V1 Faz 8 — Custom CSS override. Lets users tweak colours / spacing
  // / typography without rebuilding the app. The file is read once per
  // window lifetime; users have to relaunch (or refocus) to pick up
  // edits. Best-effort: any read / inject error is logged and ignored
  // so a typo'd CSS file never bricks startup.
  mainWindow.webContents.on('did-finish-load', () => {
    try {
      const themePath = join(app.getPath('userData'), 'custom-theme.css');
      if (!existsSync(themePath)) return;
      const css = readFileSync(themePath, 'utf8');
      if (!css.trim()) return;
      void mainWindow?.webContents.insertCSS(css);
      logger.log('info', 'main', `Custom theme CSS injected from ${themePath}`);
    } catch (err) {
      logger.log(
        'warn',
        'main',
        `Custom theme CSS load failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });

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
    // Only hand real web / mail links to the OS. Without a scheme allowlist a
    // crawl-derived `file://` / `smb://` / custom-protocol URL would be opened
    // with the user's privileges.
    if (isSafeExternalUrl(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });

  // Null the reference when the window closes so the ~15 `mainWindow?.…send()`
  // sites short-circuit instead of throwing "Object has been destroyed" — a
  // closed-but-non-null BrowserWindow still throws on `.webContents`. Matches
  // the Logs / Visualization / Log Analyzer windows, which already do this.
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

/**
 * Whether a renderer-supplied URL is safe to hand to `shell.openExternal`.
 * Restricts to the schemes a user actually expects a browser / mail client to
 * handle, blocking `file:`, `smb:`, and OS custom-protocol handlers.
 */
function isSafeExternalUrl(raw: string): boolean {
  try {
    const scheme = new URL(raw).protocol.toLowerCase();
    return scheme === 'http:' || scheme === 'https:' || scheme === 'mailto:';
  } catch {
    return false;
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

/**
 * V2 — Standalone Visualization window. Single-instance; the same
 * renderer bundle loads with `?visualization=1` so React mounts only
 * `VisualizationView` (the Cytoscape graph) instead of the full App.
 * Keeps the visualization off the main tab strip and gives it its own
 * OS window the user can move to a second monitor.
 */
function openVisualizationWindow(): void {
  if (visualizationWindow && !visualizationWindow.isDestroyed()) {
    visualizationWindow.show();
    visualizationWindow.focus();
    return;
  }
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    show: false,
    backgroundColor: '#0a0a0a',
    title: 'FreeCrawl — Visualization',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });
  win.setMenu(null);
  win.on('ready-to-show', () => win.show());
  win.on('page-title-updated', (e) => e.preventDefault());
  win.on('closed', () => {
    if (visualizationWindow === win) visualizationWindow = null;
  });
  // Mirror the main window's dev-tools lockdown.
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
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'] + '?visualization=1');
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'), {
      search: 'visualization=1',
    });
  }
  visualizationWindow = win;
  logger.log('info', 'main', 'Visualization window opened');
}

/**
 * V2 Faz 2 — Standalone Log File Analyzer window. Same renderer bundle
 * with `?loganalyzer=1` so React mounts `LogAnalyzerView` only. Keeps the
 * log-analysis surface off the main tab strip; single-instance.
 */
function openLogAnalyzerWindow(): void {
  if (logAnalyzerWindow && !logAnalyzerWindow.isDestroyed()) {
    logAnalyzerWindow.show();
    logAnalyzerWindow.focus();
    return;
  }
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 720,
    minHeight: 480,
    show: false,
    backgroundColor: '#0a0a0a',
    title: 'FreeCrawl — Log Analyzer',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });
  win.setMenu(null);
  win.on('ready-to-show', () => win.show());
  win.on('page-title-updated', (e) => e.preventDefault());
  win.on('closed', () => {
    if (logAnalyzerWindow === win) logAnalyzerWindow = null;
  });
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
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'] + '?loganalyzer=1');
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'), {
      search: 'loganalyzer=1',
    });
  }
  logAnalyzerWindow = win;
  logger.log('info', 'main', 'Log Analyzer window opened');
}

/**
 * V2 Faz 2 — flatten the core analyzer's Map aggregates into the plain
 * arrays the DB ingest expects, then persist. Returns the import summary.
 */
function ingestLogResult(filePath: string, result: LogAnalysisResult): LogImportSummary {
  const fileName = basename(filePath);
  const payload: LogIngestInput = {
    file: {
      filePath,
      fileName,
      format: result.format,
      totalLines: result.totalLines,
      parsedLines: result.parsedLines,
      skippedLines: result.skippedLines,
      minTs: result.minTs,
      maxTs: result.maxTs,
    },
    urlStats: Array.from(result.urlStats.values()).map((u) => ({
      path: u.path,
      totalHits: u.totalHits,
      botHits: u.botHits,
      googlebotHits: u.googlebotHits,
      bingbotHits: u.bingbotHits,
      yandexbotHits: u.yandexbotHits,
      otherBotHits: u.otherBotHits,
      lastStatus: u.lastStatus,
      firstTs: u.firstTs,
      lastTs: u.lastTs,
    })),
    daily: Array.from(result.daily.entries()).map(([key, hits]) => {
      // Key is `${day}\t${bucket}` (tab-separated in log-analyzer.ts).
      const sp = key.indexOf('\t');
      return { day: key.slice(0, sp), bucket: key.slice(sp + 1), hits };
    }),
    status: Array.from(result.status.entries()).map(([status, v]) => ({
      status,
      count: v.count,
      botCount: v.botCount,
    })),
    bots: Array.from(result.bots.entries()).map(([bot, agg]) => ({
      bot,
      family: agg.family,
      hits: agg.hits,
      totalIps: agg.ips.size,
      verifiedIps: agg.verifiedIps,
      verifiable: agg.verifiable,
    })),
    urlBots: Array.from(result.urlStats.values()).flatMap((u) =>
      Array.from(u.botCounts.entries()).map(([bot, hits]) => ({ path: u.path, bot, hits })),
    ),
  };
  return getDb().ingestLogAnalysis(payload);
}

/**
 * V2 Faz 2 (item 12) — inject log-discovered URLs (paths the crawl never
 * reached) into the active crawl as fresh seeds. Reconstructs absolute
 * URLs from the project's base origin; no-op when no crawl is running.
 */
function seedDiscoveryUrls(limit: number): LogSeedDiscoveryResult {
  const db = getDb();
  let origin: string | null = null;
  const start = db.getMeta('lastStartUrl');
  if (start) {
    try {
      origin = new URL(start).origin;
    } catch {
      origin = null;
    }
  }
  if (!origin) {
    const sample = db.queryUrls({ category: 'internal:all', limit: 1, offset: 0 }).rows[0];
    if (sample?.url) {
      try {
        origin = new URL(sample.url).origin;
      } catch {
        origin = null;
      }
    }
  }
  if (!origin) {
    return { enqueued: 0, hasActiveCrawl: activeCrawler?.isRunning === true, reason: 'no-base-origin' };
  }
  if (!activeCrawler || !activeCrawler.isRunning) {
    return { enqueued: 0, hasActiveCrawl: false, reason: 'no-active-crawl' };
  }
  const rows = db.getLogDiscovery(limit);
  let enqueued = 0;
  for (const r of rows) {
    if (activeCrawler.enqueueManual(origin + r.path)) enqueued++;
  }
  if (enqueued > 0) fireDataChanged();
  return { enqueued, hasActiveCrawl: true };
}

function registerIpc(): void {
  ipcMain.handle(IPC.appVersion, () => app.getVersion());

  // Live memory snapshot for the in-app monitor (status bar). Returns
  // process RSS / heap + system total/free + the active project's URL
  // count so the renderer can derive per-URL cost + capacity ceilings
  // (1M / 5M / 10M projection) without separate round-trips.
  // `urlsCrawled = 0` when no project is open — the renderer suppresses
  // the per-URL cost UI in that case.
  ipcMain.handle(IPC.memoryStats, () => {
    const mu = process.memoryUsage();
    let urlsCrawled = 0;
    try {
      urlsCrawled = getDb().countUrls();
    } catch {
      // DB may be mid-truncate or closed — treat as 0 rather than throwing.
    }
    return {
      rss: mu.rss,
      heapUsed: mu.heapUsed,
      heapTotal: mu.heapTotal,
      external: mu.external,
      arrayBuffers: mu.arrayBuffers,
      systemTotal: totalmem(),
      systemFree: freemem(),
      urlsCrawled,
    };
  });

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
  ipcMain.handle(IPC.visualizationOpenWindow, () => openVisualizationWindow());

  // ── V2 Faz 2 — Log File Analyzer IPC surface ───────────────────────
  ipcMain.handle(IPC.logAnalyzerOpenWindow, () => openLogAnalyzerWindow());

  ipcMain.handle(
    IPC.logAnalyze,
    async (e, input: LogAnalyzeInput): Promise<LogAnalyzeResult> => {
      let filePath = input?.filePath;
      if (!filePath) {
        const parent =
          BrowserWindow.fromWebContents(e.sender) ?? logAnalyzerWindow ?? mainWindow;
        if (!parent) {
          return { ok: false, error: 'No window available for the file picker.', imported: null, overview: null };
        }
        const res = await dialog.showOpenDialog(parent, {
          title: L().dlgOpenAccessLogTitle,
          properties: ['openFile'],
          filters: [
            { name: 'Log Files', extensions: ['log', 'txt', 'gz', 'out', 'access'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });
        if (res.canceled || res.filePaths.length === 0) {
          return { ok: false, error: undefined, imported: null, overview: getDb().getLogOverview() };
        }
        filePath = res.filePaths[0]!;
      }
      try {
        const result = await analyzeLogFile(filePath, {
          format: input?.format ?? 'auto',
          customRegex: input?.customRegex,
          verifyBots: input?.verifyBots === true,
        });
        const imported = ingestLogResult(filePath, result);
        if (result.urlCapHit) {
          logger.log('warn', 'main', `Log Analyzer: distinct-URL cap hit while ingesting ${basename(filePath)}; some long-tail URLs were dropped.`);
        }
        logger.log(
          'info',
          'main',
          `Log Analyzer ingested ${basename(filePath)} (${result.format}): ${result.parsedLines}/${result.totalLines} lines, ${result.bots.size} bot type(s).`,
        );
        fireDataChanged();
        return { ok: true, imported, overview: getDb().getLogOverview() };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        logger.log('warn', 'main', `Log Analyzer failed on ${filePath}: ${error}`);
        return { ok: false, error, imported: null, overview: getDb().getLogOverview() };
      }
    },
  );

  ipcMain.handle(IPC.logOverview, (): LogOverview => getDb().getLogOverview());
  ipcMain.handle(
    IPC.logUrlStats,
    (_e, input: LogUrlStatsInput): LogUrlStatsResult => getDb().queryLogUrlStats(input),
  );
  ipcMain.handle(IPC.logBots, (): LogBotRow[] => getDb().getLogBots());
  ipcMain.handle(IPC.logStatus, (): LogStatusRow[] => getDb().getLogStatusDistribution());
  ipcMain.handle(IPC.logTrend, (): LogTrendRow[] => getDb().getLogTrend());
  ipcMain.handle(
    IPC.logCrawlBudget,
    (_e, limit?: number): LogCrawlBudgetRow[] => getDb().getLogCrawlBudget(limit ?? 200),
  );
  ipcMain.handle(
    IPC.logOrphans,
    (_e, input: LogUrlStatsInput): LogUrlStatsResult =>
      getDb().queryLogUrlStats({ ...input, filter: 'orphans' }),
  );
  ipcMain.handle(
    IPC.logDiscovery,
    (_e, limit?: number): LogDiscoveryRow[] => getDb().getLogDiscovery(limit ?? 500),
  );
  ipcMain.handle(
    IPC.logSeedDiscovery,
    (_e, limit?: number): LogSeedDiscoveryResult => seedDiscoveryUrls(limit ?? 500),
  );
  ipcMain.handle(
    IPC.logExport,
    async (e, input: LogExportInput): Promise<LogExportResult> => {
      const format = input?.format === 'csv' ? 'csv' : 'xlsx';
      let filePath = input?.filePath;
      if (!filePath) {
        const parent =
          BrowserWindow.fromWebContents(e.sender) ?? logAnalyzerWindow ?? mainWindow;
        if (!parent) return { filePath: '', bytesWritten: 0 };
        const res = await dialog.showSaveDialog(parent, {
          title: L().dlgExportLogAnalysisTitle,
          defaultPath: `log-analysis.${format}`,
          filters: [
            format === 'csv'
              ? { name: 'CSV', extensions: ['csv'] }
              : { name: 'Excel Workbook', extensions: ['xlsx'] },
          ],
        });
        if (res.canceled || !res.filePath) return { filePath: '', bytesWritten: 0 };
        filePath = res.filePath;
      }
      const db = getDb();
      const tables: LogExportTables = {
        overview: db.getLogOverview(),
        urlStats: db.queryLogUrlStats({ limit: 100_000, offset: 0, sortBy: 'totalHits', filter: 'all' }).rows,
        orphans: db.queryLogUrlStats({ limit: 100_000, offset: 0, filter: 'orphans' }).rows,
        bots: db.getLogBots(),
        status: db.getLogStatusDistribution(),
        trend: db.getLogTrend(),
        crawlBudget: db.getLogCrawlBudget(5000),
        discovery: db.getLogDiscovery(50_000),
      };
      const { writeFileSync } = await import('node:fs');
      if (format === 'csv') {
        const csv = buildLogExportCsv(tables);
        writeFileSync(filePath, csv, 'utf8');
        return { filePath, bytesWritten: Buffer.byteLength(csv, 'utf8') };
      }
      const buf = buildLogExportXlsx(tables);
      writeFileSync(filePath, buf);
      return { filePath, bytesWritten: buf.length };
    },
  );
  ipcMain.handle(IPC.logClear, (): void => {
    getDb().clearLogData();
    fireDataChanged();
    logger.log('info', 'main', 'Log Analyzer data cleared');
  });

  ipcMain.handle(
    IPC.screenshotRead,
    async (_e, absolutePath: string): Promise<string | null> => {
      if (typeof absolutePath !== 'string' || absolutePath.length === 0) return null;
      // Resolve both the requested file AND the allowed root so `..`
      // traversal can't escape the sidecar. Without `path.resolve` the
      // naive startsWith() lets `<root>/../../../etc/passwd` pass.
      const resolved = resolvePath(absolutePath);
      const allowedRoots: string[] = [];
      if (currentProjectPath) {
        const dir = resolveScreenshotDir(currentProjectPath);
        if (dir) allowedRoots.push(resolvePath(dir));
      }
      // Append the separator so that `<root>` doesn't match `<root>2`.
      const safe = allowedRoots.some(
        (root) => resolved === root || resolved.startsWith(root + pathSep),
      );
      if (!safe) return null;
      // Only allow PNGs — extra defence in depth against the guard
      // returning unintended files if the roots set ever broadens.
      if (!resolved.toLowerCase().endsWith('.png')) return null;
      try {
        const buf = readFileSync(resolved);
        return `data:image/png;base64,${buf.toString('base64')}`;
      } catch {
        return null;
      }
    },
  );

  ipcMain.handle(IPC.robotsValidate, (_e, text: string) =>
    validateRobotsTxt(typeof text === 'string' ? text : ''),
  );

  ipcMain.handle(IPC.robotsTest, (_e, input: RobotsTestInput) =>
    testUrlAgainstRobots(input.url, input.userAgent, input.customRobots),
  );

  ipcMain.handle(
    IPC.urlRewritePreview,
    (_e, input: UrlRewritePreviewInput): UrlRewritePreviewResult => {
      const errors: Array<{ pattern: string; error: string }> = [];
      const compiled = compileUrlRegexRewrites(input.urlRegexRewrites, (p, err) =>
        errors.push({ pattern: p, error: err }),
      );
      let result: string | null = null;
      let parseError: string | undefined;
      try {
        result = normalizeUrl(input.url, undefined, {
          stripWww: input.stripWww,
          forceHttps: input.forceHttps,
          lowercasePath: input.lowercasePath,
          trailingSlash: input.trailingSlash,
          keepQueryParams: input.keepQueryParams,
          regexRewrites: compiled,
        });
        if (result === null) parseError = 'URL failed to parse or rewrite produced an invalid URL';
      } catch (err) {
        parseError = err instanceof Error ? err.message : String(err);
      }
      return { result, regexErrors: errors, parseError };
    },
  );

  ipcMain.handle(
    IPC.extractionPreview,
    async (_e, input: ExtractionPreviewInput): Promise<ExtractionPreviewResult> => {
      // Live preview of Custom Extraction rules against a single URL.
      // Mirrors the production crawler's parse pipeline (cheerio + the
      // shared `previewExtractionRules` helper) so what the user sees
      // here matches what would be stored per-URL after a full crawl.
      // The fetch is one-shot — no retry, no robots.txt, no rate
      // limiting; the user explicitly asked for this URL so we honour
      // it directly.
      const url = (input.url ?? '').trim();
      if (!url) {
        return { ok: false, error: 'URL is required' };
      }
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return { ok: false, error: 'Invalid URL' };
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { ok: false, error: 'Only http:// or https:// URLs are supported' };
      }

      const userAgent =
        (input.userAgent ?? '').trim() ||
        'FreeCrawl SEO Tool (extraction preview)';
      const acceptLanguage = (input.acceptLanguage ?? '').trim() || 'en';

      const controller = new AbortController();
      const timeoutMs = 15_000;
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const startedAt = Date.now();

      let response: Response | null = null;
      try {
        response = (await undiciFetch(parsed.href, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': userAgent,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': acceptLanguage,
          },
          signal: controller.signal,
        })) as unknown as Response;
      } catch (err) {
        clearTimeout(timer);
        const msg = err instanceof Error ? err.message : String(err);
        return {
          ok: false,
          error: controller.signal.aborted
            ? `Fetch timed out after ${timeoutMs / 1000}s`
            : `Fetch failed: ${msg}`,
        };
      }
      clearTimeout(timer);

      const fetchMs = Date.now() - startedAt;
      const contentType = response.headers.get('content-type') ?? '';
      const finalUrl = response.url || parsed.href;

      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          ok: false,
          statusCode: response.status,
          finalUrl,
          contentType,
          fetchMs,
          error: `Body read failed: ${msg}`,
        };
      }
      const byteSize = Buffer.byteLength(bodyText, 'utf8');

      const results = previewExtractionRules(bodyText, input.rules ?? []).map(
        (r) => ({
          name: r.name,
          value: r.value,
          ...(r.error !== undefined && { error: r.error }),
        }),
      );

      return {
        ok: true,
        statusCode: response.status,
        finalUrl,
        contentType,
        byteSize,
        fetchMs,
        results,
      };
    },
  );

  ipcMain.handle(
    IPC.extractionRulesExport,
    async (
      _e,
      rules: CustomExtractionRule[],
    ): Promise<ExtractionRulesExportResult> => {
      if (!mainWindow) return { filePath: '', bytesWritten: 0 };
      const res = await dialog.showSaveDialog(mainWindow, {
        title: L().dlgExportExtractionRulesTitle,
        defaultPath: 'freecrawl-extraction-rules.json',
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      if (res.canceled || !res.filePath) {
        return { filePath: '', bytesWritten: 0 };
      }
      // Versioned envelope — same pattern as prefsExportSettings so
      // future imports can detect schema drift without breaking on the
      // raw rule blob.
      const payload = {
        format: 'freecrawl/extraction-rules',
        version: 1,
        exportedAt: new Date().toISOString(),
        rules,
      };
      const json = JSON.stringify(payload, null, 2);
      writeFileSync(res.filePath, json, 'utf8');
      return {
        filePath: res.filePath,
        bytesWritten: Buffer.byteLength(json, 'utf8'),
      };
    },
  );

  ipcMain.handle(
    IPC.extractionRulesImport,
    async (): Promise<ExtractionRulesImportResult> => {
      if (!mainWindow) {
        return { filePath: '', rules: [], skippedCount: 0 };
      }
      const res = await dialog.showOpenDialog(mainWindow, {
        title: L().dlgImportExtractionRulesTitle,
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      if (res.canceled || res.filePaths.length === 0) {
        return { filePath: '', rules: [], skippedCount: 0 };
      }
      const filePath = res.filePaths[0]!;
      let raw: unknown;
      try {
        const text = readFileSync(filePath, 'utf8');
        raw = JSON.parse(text);
      } catch (err) {
        return {
          filePath: '',
          rules: [],
          skippedCount: 0,
          error: `Cannot parse JSON: ${(err as Error).message}`,
        };
      }
      // Accept either the wrapped envelope { rules: [...] } or a bare
      // array — bare arrays let users share rule snippets without the
      // boilerplate.
      const candidates: unknown[] = Array.isArray(raw)
        ? raw
        : raw &&
            typeof raw === 'object' &&
            Array.isArray((raw as { rules?: unknown }).rules)
          ? ((raw as { rules: unknown[] }).rules)
          : [];
      if (candidates.length === 0) {
        return {
          filePath: '',
          rules: [],
          skippedCount: 0,
          error: 'File does not contain a rules array.',
        };
      }
      const validTypes = new Set(['css', 'regex', 'xpath', 'jsonpath']);
      const validOutputs = new Set([
        'text',
        'attribute',
        'inner_html',
        'outer_html',
        'count',
        'regex_group',
      ]);
      const validMulti = new Set(['first', 'last', 'all', 'concat', 'count']);
      const accepted: CustomExtractionRule[] = [];
      let skippedCount = 0;
      for (const item of candidates) {
        if (!item || typeof item !== 'object') {
          skippedCount++;
          continue;
        }
        const o = item as Record<string, unknown>;
        if (
          typeof o['name'] !== 'string' ||
          typeof o['selector'] !== 'string' ||
          typeof o['type'] !== 'string' ||
          !validTypes.has(o['type']) ||
          typeof o['output'] !== 'string' ||
          !validOutputs.has(o['output'] as string) ||
          typeof o['multi'] !== 'string' ||
          !validMulti.has(o['multi'] as string)
        ) {
          skippedCount++;
          continue;
        }
        // Hard cap at 10 to match the in-app limit; everything past the
        // cap is reported as skipped so the user knows truncation happened.
        if (accepted.length >= 10) {
          skippedCount++;
          continue;
        }
        const rule: CustomExtractionRule = {
          name: o['name'] as string,
          type: o['type'] as CustomExtractionRule['type'],
          selector: o['selector'] as string,
          output: o['output'] as CustomExtractionRule['output'],
          multi: o['multi'] as CustomExtractionRule['multi'],
        };
        if (typeof o['attribute'] === 'string') {
          rule.attribute = o['attribute'];
        }
        accepted.push(rule);
      }
      return { filePath, rules: accepted, skippedCount };
    },
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

  ipcMain.handle(IPC.reportsIndexabilityDistribution, () =>
    callReaderOrFallback('getIndexabilityDistribution', [], () =>
      getDb().getIndexabilityDistribution(),
    ),
  );

  ipcMain.handle(IPC.reportsContentKindDistribution, () =>
    callReaderOrFallback('getContentKindDistribution', [], () =>
      getDb().getContentKindDistribution(),
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
      const direction = input.direction === 'asc' ? 'asc' : 'desc';
      return callReaderOrFallback<TopUrlsRow[]>(
        'topUrlsBy',
        [column, limit, direction],
        () => getDb().topUrlsBy(column, limit, direction),
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

  ipcMain.handle(
    IPC.reportsOrphanCrossSource,
    (_e, limit?: number): Promise<OrphanCrossSourceRow[]> =>
      callReaderOrFallback<OrphanCrossSourceRow[]>(
        'orphanPagesCrossSource',
        [limit ?? 1000],
        () => getDb().orphanPagesCrossSource(limit ?? 1000),
      ),
  );

  ipcMain.handle(IPC.reportsServerHeaders, () =>
    callReaderOrFallback<ServerHeaderRow[]>('serverHeaderBreakdown', [], () =>
      getDb().serverHeaderBreakdown(),
    ),
  );

  // Top Words — pull the title+meta+H1 corpus from the active DB then
  // aggregate via core's `aggregateTopWords` (kept in core because the
  // db package isn't allowed to depend on core per the monorepo
  // dependency graph). Aggregation is sync + cheap so we don't need
  // the reader pool's worker offload here.
  ipcMain.handle(
    IPC.reportsTopWords,
    (_e, input: TopWordsInput): TopWordsRow[] => {
      const corpus = getDb().seoTextCorpus();
      return aggregateTopWords(corpus, {
        limit: input.limit,
        minLength: input.minLength,
        locale: input.locale,
      });
    },
  );

  ipcMain.handle(
    IPC.prefsExportSettings,
    async (_e, input: SettingsExportInput): Promise<SettingsExportResult> => {
      let filePath = input.filePath ?? '';
      if (!filePath) {
        if (!mainWindow) return { filePath: '', bytesWritten: 0 };
        const res = await dialog.showSaveDialog(mainWindow, {
          title: L().dlgExportSettingsTitle,
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
        title: L().dlgImportSettingsTitle,
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

  // V1 Faz 6 — Scheduled crawl IPC. One schedule per project, stored
  // app-level under the `schedules` prefs key keyed by project path.
  ipcMain.handle(IPC.scheduleGet, () => {
    return getSchedule(schedulerStore, currentProjectPath);
  });
  ipcMain.handle(IPC.scheduleSet, (_e, spec: ScheduleSpec | null) => {
    return setSchedule(schedulerStore, currentProjectPath, spec);
  });

  // V1 Faz 9 — directory picker for Settings → Storage. Returns the chosen
  // absolute path, or null if the user cancelled.
  ipcMain.handle(
    IPC.pickDirectory,
    async (
      _e,
      input?: { title?: string; defaultPath?: string },
    ): Promise<string | null> => {
      const win = mainWindow;
      if (!win) return null;
      const res = await dialog.showOpenDialog(win, {
        title: input?.title ?? L().dlgChooseFolderTitle,
        defaultPath: input?.defaultPath,
        properties: ['openDirectory', 'createDirectory'],
      });
      if (res.canceled || res.filePaths.length === 0) return null;
      return res.filePaths[0]!;
    },
  );

  // V1 Faz 9 — resolved default project save dir. Returns the user's
  // configured `projectSaveDir` pref when set & non-empty, otherwise the
  // OS Documents folder. Used by Settings → Storage to display the active
  // value, and by `projectSaveAs` as the dialog's starting directory.
  ipcMain.handle(IPC.defaultProjectDir, (): string => {
    loadPrefs();
    const raw = prefsCache['projectSaveDir'];
    if (typeof raw === 'string' && raw.trim().length > 0) return raw;
    return app.getPath('documents');
  });

  ipcMain.handle(IPC.storageModeActive, (): 'disk' | 'ram' => {
    // Ensure the DB has been resolved at least once so the mode is set.
    getDb();
    return storageModeActive;
  });

  // V1 Faz 7 — integration credential store. Secrets are encrypted at
  // rest with safeStorage; the renderer only ever sees the redacted
  // state map (secret values blanked, non-secret values round-tripped).
  ipcMain.handle(IPC.integrationsGetAll, () => getIntegrationsState());
  ipcMain.handle(
    IPC.integrationsSet,
    (_e, id: string, fields: Record<string, string>) => {
      return setIntegrationCredentials(id, fields);
    },
  );
  ipcMain.handle(IPC.integrationsClear, (_e, id: string) => {
    return clearIntegrationCredentials(id);
  });

  // V1 Faz 7 — Google PageSpeed Insights. `pagespeedQuery` lists the
  // crawled internal HTML pages joined with any stored audit results;
  // `pagespeedRun` audits a user-selected subset (the slow part — PSI
  // takes ~10–30 s per URL — so it streams `pagespeedProgress` events
  // and can be cancelled mid-run).
  ipcMain.handle(
    IPC.pagespeedQuery,
    async (_e, input: PagespeedQueryInput): Promise<PagespeedQueryResult> => {
      const params = {
        limit: input.limit,
        offset: input.offset,
        search: input.search,
        filter: input.filter,
      };
      return callReaderOrFallback<PagespeedQueryResult>(
        'queryPagespeed',
        [params],
        () => getDb().queryPagespeed(params),
      );
    },
  );

  // Shared PSI batch orchestrator — driven by both the renderer's
  // `pagespeedRun` IPC (which awaits the result) and the MCP bridge's
  // non-blocking `pagespeed-run` action (which fires-and-forgets and
  // lets the agent poll `fetch-progress`). Updates `pagespeedRunSnapshot`
  // throughout so the MCP poll surface reflects either trigger path.
  async function runPagespeedJob(
    input: PagespeedRunInput,
  ): Promise<PagespeedRunResult> {
    if (pagespeedRunActive) {
      return { completed: 0, failed: 0, cancelled: true };
    }
    const urls = Array.from(
      new Set(
        (input.urls ?? []).filter(
          (u): u is string => typeof u === 'string' && u.length > 0,
        ),
      ),
    );
    if (urls.length === 0) {
      pagespeedRunSnapshot = {
        ...idleFetchSnapshot(),
        finishedAt: new Date().toISOString(),
      };
      return { completed: 0, failed: 0, cancelled: false };
    }
    const strategies: PagespeedStrategy[] =
      input.strategy === 'both' ? ['mobile', 'desktop'] : [input.strategy];
    const items: PagespeedBatchItem[] = [];
    for (const url of urls) {
      for (const strategy of strategies) items.push({ url, strategy });
    }
    const apiKeyRaw = resolveCredentials('pagespeed')['apiKey'];
    const apiKey =
      apiKeyRaw && apiKeyRaw.trim().length > 0 ? apiKeyRaw.trim() : undefined;

    pagespeedRunActive = true;
    pagespeedCancelRequested = false;
    // Set synchronously (before the first await) so the MCP `pagespeed-run`
    // action can read an accurate snapshot right after kicking us off.
    pagespeedRunSnapshot = {
      ...idleFetchSnapshot(),
      running: true,
      total: items.length,
      startedAt: new Date().toISOString(),
    };
    // Pin writes to the project that was active when the run started —
    // a PSI run can last minutes, and resolving `getDb()` per result
    // would leak audits into a different project if the user opens
    // one mid-run.
    const runDb = getDb();
    logger.log(
      'info',
      'pagespeed',
      `run started — ${items.length} audit(s): ${urls.length} URL(s) × ${strategies.length} strategy${
        apiKey ? ' (keyed)' : ' (keyless — low rate limit)'
      }`,
    );
    try {
      const result = await runPagespeedBatch({
        items,
        apiKey,
        isCancelled: () => pagespeedCancelRequested,
        onResult: (url, strategy, metrics) => {
          try {
            runDb.upsertPagespeedResult(url, strategy, metrics);
          } catch (err) {
            logger.log(
              'error',
              'pagespeed',
              `DB write failed for ${url}: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
          }
          if (metrics.status === 'ok') pagespeedRunSnapshot.completed++;
          else pagespeedRunSnapshot.failed++;
        },
        onProgress: (done, total, currentUrl) => {
          pagespeedRunSnapshot.done = done;
          pagespeedRunSnapshot.total = total;
          pagespeedRunSnapshot.currentUrl = currentUrl;
          mainWindow?.webContents.send(IPC.pagespeedProgress, {
            done,
            total,
            currentUrl,
            running: true,
          });
        },
      });
      pagespeedRunSnapshot = {
        ...pagespeedRunSnapshot,
        running: false,
        done: result.completed + result.failed,
        completed: result.completed,
        failed: result.failed,
        cancelled: result.cancelled,
        currentUrl: null,
        finishedAt: new Date().toISOString(),
      };
      mainWindow?.webContents.send(IPC.pagespeedProgress, {
        done: result.completed + result.failed,
        total: items.length,
        currentUrl: null,
        running: false,
      });
      fireDataChanged();
      return result;
    } catch (err) {
      pagespeedRunSnapshot = {
        ...pagespeedRunSnapshot,
        running: false,
        currentUrl: null,
        finishedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
      };
      throw err;
    } finally {
      pagespeedRunActive = false;
      pagespeedCancelRequested = false;
    }
  }

  ipcMain.handle(
    IPC.pagespeedRun,
    async (_e, input: PagespeedRunInput): Promise<PagespeedRunResult> =>
      runPagespeedJob(input),
  );

  ipcMain.handle(IPC.pagespeedCancel, () => {
    if (pagespeedRunActive) {
      pagespeedCancelRequested = true;
      logger.log('info', 'pagespeed', 'run cancellation requested');
    }
  });

  // ---- Chrome UX Report (CrUX) — real-user field metrics ----
  ipcMain.handle(
    IPC.cruxQuery,
    async (_e, input: CruxQueryInput): Promise<CruxQueryResult> => {
      const params = {
        limit: input.limit,
        offset: input.offset,
        search: input.search,
        filter: input.filter,
      };
      return callReaderOrFallback<CruxQueryResult>(
        'queryCrux',
        [params],
        () => getDb().queryCrux(params),
      );
    },
  );

  // Shared CrUX batch orchestrator — driven by both the renderer's
  // `cruxRun` IPC and the MCP bridge's `crux-run` action. Mirrors
  // `runPagespeedJob`; updates `cruxRunSnapshot` throughout.
  async function runCruxJob(input: CruxRunInput): Promise<CruxRunResult> {
    if (cruxRunActive) {
      return { completed: 0, failed: 0, cancelled: true };
    }
    const urls = Array.from(
      new Set(
        (input.urls ?? []).filter(
          (u): u is string => typeof u === 'string' && u.length > 0,
        ),
      ),
    );
    if (urls.length === 0) {
      cruxRunSnapshot = {
        ...idleFetchSnapshot(),
        finishedAt: new Date().toISOString(),
      };
      return { completed: 0, failed: 0, cancelled: false };
    }
    const formFactors: CruxFormFactor[] =
      input.formFactor === 'both'
        ? ['phone', 'desktop']
        : [input.formFactor];
    const items: CruxBatchItem[] = [];
    for (const url of urls) {
      for (const formFactor of formFactors) items.push({ url, formFactor });
    }
    const apiKeyRaw = resolveCredentials('crux')['apiKey'];
    const apiKey =
      apiKeyRaw && apiKeyRaw.trim().length > 0 ? apiKeyRaw.trim() : '';
    if (!apiKey) {
      // CrUX has no keyless mode — surface a clear failure instead of a
      // batch of 400s.
      cruxRunSnapshot = {
        ...idleFetchSnapshot(),
        finishedAt: new Date().toISOString(),
        error: 'No CrUX API key configured (Settings → Integrations → Chrome UX Report).',
      };
      logger.log(
        'warn',
        'crux',
        'run aborted — no API key (Settings → Integrations → Chrome UX Report)',
      );
      return { completed: 0, failed: items.length, cancelled: false };
    }

    cruxRunActive = true;
    cruxCancelRequested = false;
    cruxRunSnapshot = {
      ...idleFetchSnapshot(),
      running: true,
      total: items.length,
      startedAt: new Date().toISOString(),
    };
    const runDb = getDb();
    logger.log(
      'info',
      'crux',
      `run started — ${items.length} record(s): ${urls.length} URL(s) × ${formFactors.length} form factor`,
    );
    try {
      const result = await runCruxBatch({
        items,
        apiKey,
        isCancelled: () => cruxCancelRequested,
        onResult: (url, formFactor, metrics) => {
          try {
            runDb.upsertCruxResult(url, formFactor, metrics);
          } catch (err) {
            logger.log(
              'error',
              'crux',
              `DB write failed for ${url}: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
          }
          if (metrics.status === 'ok') cruxRunSnapshot.completed++;
          else cruxRunSnapshot.failed++;
        },
        onProgress: (done, total, currentUrl) => {
          cruxRunSnapshot.done = done;
          cruxRunSnapshot.total = total;
          cruxRunSnapshot.currentUrl = currentUrl;
          mainWindow?.webContents.send(IPC.cruxProgress, {
            done,
            total,
            currentUrl,
            running: true,
          });
        },
      });
      cruxRunSnapshot = {
        ...cruxRunSnapshot,
        running: false,
        done: result.completed + result.failed,
        completed: result.completed,
        failed: result.failed,
        cancelled: result.cancelled,
        currentUrl: null,
        finishedAt: new Date().toISOString(),
      };
      mainWindow?.webContents.send(IPC.cruxProgress, {
        done: result.completed + result.failed,
        total: items.length,
        currentUrl: null,
        running: false,
      });
      fireDataChanged();
      return result;
    } catch (err) {
      cruxRunSnapshot = {
        ...cruxRunSnapshot,
        running: false,
        currentUrl: null,
        finishedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
      };
      throw err;
    } finally {
      cruxRunActive = false;
      cruxCancelRequested = false;
    }
  }

  ipcMain.handle(
    IPC.cruxRun,
    async (_e, input: CruxRunInput): Promise<CruxRunResult> =>
      runCruxJob(input),
  );

  ipcMain.handle(IPC.cruxCancel, () => {
    if (cruxRunActive) {
      cruxCancelRequested = true;
      logger.log('info', 'crux', 'run cancellation requested');
    }
  });

  // ---- Spelling & Grammar (LanguageTool) ----
  ipcMain.handle(
    IPC.spellingQuery,
    async (_e, input: SpellingQueryInput): Promise<SpellingQueryResult> => {
      const params = {
        limit: input.limit,
        offset: input.offset,
        search: input.search,
        filter: input.filter,
      };
      return callReaderOrFallback<SpellingQueryResult>(
        'querySpelling',
        [params],
        () => getDb().querySpelling(params),
      );
    },
  );

  ipcMain.handle(
    IPC.spellingMatches,
    async (_e, url: string): Promise<SpellingMatchesResult | null> =>
      callReaderOrFallback<SpellingMatchesResult | null>(
        'getSpellingMatches',
        [url],
        () => getDb().getSpellingMatches(url),
      ),
  );

  /** Resolve the LanguageTool endpoint + credentials + user preferences. */
  function resolveSpellingOptions(): SpellingCheckOptions {
    loadPrefs();
    const creds = resolveCredentials('languagetool');
    const endpointRaw = (creds['endpoint'] ?? '').trim();
    const level: SpellingLevel =
      prefsCache['spellingLevel'] === 'picky' ? 'picky' : 'default';
    const ignoreRaw = prefsCache['spellingIgnoreWords'];
    const ignoreWords = new Set<string>(
      (typeof ignoreRaw === 'string' ? ignoreRaw : '')
        .split(/[\s,;\n]+/)
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length > 0),
    );
    return {
      endpoint: endpointRaw.length > 0 ? endpointRaw : PUBLIC_LT_ENDPOINT,
      username: (creds['username'] ?? '').trim() || undefined,
      apiKey: (creds['apiKey'] ?? '').trim() || undefined,
      level,
      ignoreWords,
    };
  }

  /**
   * Resolve one page's prose for the checker. Prefers the crawl-time raw
   * HTML snapshot (`url_sources.body`); when body snapshots were disabled
   * the page is re-fetched once over HTTP. Either way the HTML is reduced
   * to prose (chrome, script/style and code blocks stripped) before it
   * leaves the machine.
   */
  async function loadSpellingPage(
    db: ProjectDb,
    url: string,
  ): Promise<{ text: string | null; lang: string | null }> {
    const stored = db.getUrlBodyAndLang(url);
    const lang = stored?.lang ?? null;
    if (stored?.body && stored.body.length > 0) {
      return { text: extractProseText(stored.body), lang };
    }
    try {
      const res = await undiciFetch(url, {
        signal: AbortSignal.timeout(30_000),
        headers: { Accept: 'text/html,application/xhtml+xml' },
      });
      if (!res.ok) return { text: null, lang };
      const html = await res.text();
      return { text: extractProseText(html), lang };
    } catch {
      return { text: null, lang };
    }
  }

  // Shared LanguageTool batch orchestrator — driven by both the renderer's
  // `spellingRun` IPC and the MCP bridge's `spelling-run` action.
  async function runSpellingJob(
    input: SpellingRunInput,
  ): Promise<SpellingRunResult> {
    if (spellingRunActive) {
      return { completed: 0, failed: 0, cancelled: true };
    }
    const urls = Array.from(
      new Set(
        (input.urls ?? []).filter(
          (u): u is string => typeof u === 'string' && u.length > 0,
        ),
      ),
    );
    if (urls.length === 0) {
      spellingRunSnapshot = {
        ...idleFetchSnapshot(),
        finishedAt: new Date().toISOString(),
      };
      return { completed: 0, failed: 0, cancelled: false };
    }

    const check = resolveSpellingOptions();
    spellingRunActive = true;
    spellingCancelRequested = false;
    spellingRunSnapshot = {
      ...idleFetchSnapshot(),
      running: true,
      total: urls.length,
      startedAt: new Date().toISOString(),
    };
    const runDb = getDb();
    logger.log(
      'info',
      'languagetool',
      `run started — ${urls.length} page(s) against ${check.endpoint} (level: ${check.level}, ${check.ignoreWords.size} ignored word(s))`,
    );
    try {
      const result = await runSpellingBatch({
        urls,
        check,
        loadPage: (url) => loadSpellingPage(runDb, url),
        isCancelled: () => spellingCancelRequested,
        onResult: (url, r) => {
          try {
            runDb.upsertSpellingResult(url, r);
          } catch (err) {
            logger.log(
              'error',
              'languagetool',
              `DB write failed for ${url}: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
          }
          if (r.status === 'ok') spellingRunSnapshot.completed++;
          else spellingRunSnapshot.failed++;
        },
        onProgress: (done, total, currentUrl) => {
          spellingRunSnapshot.done = done;
          spellingRunSnapshot.total = total;
          spellingRunSnapshot.currentUrl = currentUrl;
          mainWindow?.webContents.send(IPC.spellingProgress, {
            done,
            total,
            currentUrl,
            running: true,
          });
        },
      });
      spellingRunSnapshot = {
        ...spellingRunSnapshot,
        running: false,
        done: result.completed + result.failed,
        completed: result.completed,
        failed: result.failed,
        cancelled: result.cancelled,
        currentUrl: null,
        finishedAt: new Date().toISOString(),
      };
      mainWindow?.webContents.send(IPC.spellingProgress, {
        done: result.completed + result.failed,
        total: urls.length,
        currentUrl: null,
        running: false,
      });
      fireDataChanged();
      return result;
    } catch (err) {
      spellingRunSnapshot = {
        ...spellingRunSnapshot,
        running: false,
        currentUrl: null,
        finishedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
      };
      throw err;
    } finally {
      spellingRunActive = false;
      spellingCancelRequested = false;
    }
  }

  ipcMain.handle(
    IPC.spellingRun,
    async (_e, input: SpellingRunInput): Promise<SpellingRunResult> =>
      runSpellingJob(input),
  );

  ipcMain.handle(IPC.spellingCancel, () => {
    if (spellingRunActive) {
      spellingCancelRequested = true;
      logger.log('info', 'languagetool', 'run cancellation requested');
    }
  });

  // V1 Faz 7 — Google OAuth keystone. The interactive consent flow runs
  // entirely in the main process (loopback HTTP server + system
  // browser); the renderer only ever sees the redacted GoogleAuthState.
  ipcMain.handle(
    IPC.googleAuthStatus,
    (_e, id: string): GoogleAuthState => getAuthState(id),
  );
  ipcMain.handle(
    IPC.googleAuthStart,
    async (_e, id: string): Promise<GoogleAuthResult> => {
      try {
        const state = await startAuth(id);
        return { ok: true, error: null, state };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          state: getAuthState(id),
        };
      }
    },
  );
  ipcMain.handle(
    IPC.googleAuthRevoke,
    (_e, id: string): Promise<GoogleAuthState> => revokeAuth(id),
  );

  // V1 Faz 7 — Google Search Console. `gscFetch` pulls per-page metrics
  // for a date range and wholesale-replaces the stored snapshot;
  // `gscQuery` lists crawled pages joined with that data.
  ipcMain.handle(
    IPC.gscListSites,
    async (): Promise<GscListSitesResult> => {
      try {
        return { ok: true, error: null, sites: await listSites() };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          sites: [],
        };
      }
    },
  );
  ipcMain.handle(
    IPC.gscFetch,
    async (_e, input: GscFetchInput): Promise<GscFetchResult> => {
      if (!input.property) {
        return {
          ok: false,
          error: 'No Search Console property selected.',
          rowCount: 0,
          meta: null,
        };
      }
      // Search Console data lags ~2 days — end the window there and
      // span `days` back so the range only covers data that exists.
      const isoDate = (d: Date): string => d.toISOString().slice(0, 10);
      const end = new Date(Date.now() - 2 * 86_400_000);
      const start = new Date(end.getTime() - (input.days - 1) * 86_400_000);
      const startDate = isoDate(start);
      const endDate = isoDate(end);
      // Pin the DB to the project active when the pull started.
      const runDb = getDb();
      try {
        const rows = await querySearchAnalytics(
          input.property,
          startDate,
          endDate,
        );
        const fetchedAt = new Date().toISOString();
        runDb.replaceGscResults(rows, fetchedAt);
        const meta: GscFetchMeta = {
          property: input.property,
          startDate,
          endDate,
          fetchedAt,
          rowCount: rows.length,
        };
        runDb.setMeta('gscFetchMeta', JSON.stringify(meta));
        fireDataChanged();
        logger.log(
          'info',
          'gsc',
          `Search Console pull stored — ${rows.length} page row(s)`,
        );
        return { ok: true, error: null, rowCount: rows.length, meta };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          rowCount: 0,
          meta: null,
        };
      }
    },
  );
  ipcMain.handle(
    IPC.gscQuery,
    async (_e, input: GscQueryInput): Promise<GscQueryResult> => {
      const params = {
        limit: input.limit,
        offset: input.offset,
        search: input.search,
        filter: input.filter,
      };
      const result = await callReaderOrFallback<{
        rows: GscQueryResult['rows'];
        total: number;
      }>('queryGsc', [params], () => getDb().queryGsc(params));
      let meta: GscFetchMeta | null = null;
      try {
        const raw = getDb().getMeta('gscFetchMeta');
        if (raw) meta = JSON.parse(raw) as GscFetchMeta;
      } catch {
        /* no / corrupt meta — render without the context line */
      }
      return { rows: result.rows, total: result.total, meta };
    },
  );

  // V1 Faz 7 — Google Analytics 4. Same shape as GSC: list properties,
  // fetch a date-range snapshot, query crawled pages joined with the
  // stored data. Auth runs through the shared OAuth keystone.
  ipcMain.handle(
    IPC.ga4ListProperties,
    async (): Promise<Ga4ListPropertiesResult> => {
      try {
        return { ok: true, error: null, properties: await ga4ListProperties() };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          properties: [],
        };
      }
    },
  );
  ipcMain.handle(
    IPC.ga4Fetch,
    async (_e, input: Ga4FetchInput): Promise<Ga4FetchResult> => {
      if (!input.property) {
        return {
          ok: false,
          error: 'No GA4 property selected.',
          rowCount: 0,
          meta: null,
        };
      }
      // GA4 data is near-realtime — end the range at today.
      const isoDate = (d: Date): string => d.toISOString().slice(0, 10);
      const end = new Date();
      const start = new Date(end.getTime() - (input.days - 1) * 86_400_000);
      const startDate = isoDate(start);
      const endDate = isoDate(end);
      const runDb = getDb();
      try {
        const rows = await ga4RunReport(input.property, startDate, endDate);
        const fetchedAt = new Date().toISOString();
        runDb.replaceGa4Results(rows, fetchedAt);
        const meta: Ga4FetchMeta = {
          property: input.property,
          propertyName: input.propertyName || input.property,
          startDate,
          endDate,
          fetchedAt,
          rowCount: rows.length,
        };
        runDb.setMeta('ga4FetchMeta', JSON.stringify(meta));
        fireDataChanged();
        logger.log(
          'info',
          'ga4',
          `GA4 pull stored — ${rows.length} page row(s)`,
        );
        return { ok: true, error: null, rowCount: rows.length, meta };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          rowCount: 0,
          meta: null,
        };
      }
    },
  );
  ipcMain.handle(
    IPC.ga4Query,
    async (_e, input: Ga4QueryInput): Promise<Ga4QueryResult> => {
      const params = {
        limit: input.limit,
        offset: input.offset,
        search: input.search,
        filter: input.filter,
      };
      const result = await callReaderOrFallback<{
        rows: Ga4QueryResult['rows'];
        total: number;
      }>('queryGa4', [params], () => getDb().queryGa4(params));
      let meta: Ga4FetchMeta | null = null;
      try {
        const raw = getDb().getMeta('ga4FetchMeta');
        if (raw) meta = JSON.parse(raw) as Ga4FetchMeta;
      } catch {
        /* no / corrupt meta — render without the context line */
      }
      return { rows: result.rows, total: result.total, meta };
    },
  );

  // V1 Faz 7 — AI integrations (OpenAI / Anthropic / Ollama). The
  // renderer hands over a prompt template + URL list; the handler
  // substitutes per-URL variables from the crawl DB, then drives a
  // small concurrency pool through the chosen provider.
  const substitutePrompt = (
    template: string,
    ctx: {
      url: string;
      title: string | null;
      metaDescription: string | null;
      h1: string | null;
      body: string | null;
    },
  ): string => {
    /** Body cap — keep prompts under control on long pages. */
    const BODY_MAX = 2000;
    const body = (ctx.body ?? '').slice(0, BODY_MAX);
    return template
      .replace(/\{url\}/g, ctx.url)
      .replace(/\{title\}/g, ctx.title ?? '')
      .replace(/\{description\}/g, ctx.metaDescription ?? '')
      .replace(/\{h1\}/g, ctx.h1 ?? '')
      .replace(/\{body\}/g, body);
  };

  // Shared AI batch orchestrator — driven by the renderer's `aiRun` IPC
  // (awaits) and the MCP bridge's non-blocking `ai-run` action (polls
  // `fetch-progress`). Updates `aiRunSnapshot` throughout.
  async function runAiJob(input: AiRunInput): Promise<AiRunResult> {
    if (aiRunActive) {
      return { completed: 0, failed: 0, cancelled: true };
    }
    const urls = Array.from(
      new Set(
        (input.urls ?? []).filter(
          (u): u is string => typeof u === 'string' && u.length > 0,
        ),
      ),
    );
    if (urls.length === 0 || !input.prompt?.trim()) {
      aiRunSnapshot = {
        ...idleFetchSnapshot(),
        provider: input.provider,
        finishedAt: new Date().toISOString(),
      };
      return { completed: 0, failed: 0, cancelled: false };
    }
    const runDb = getDb();
    const model = resolveModel(input.provider, input.model);
    const concurrency = defaultConcurrency(input.provider);

    // Build per-URL prompts up-front so a missing page doesn't get
    // queued; URLs that aren't in the DB are skipped silently.
    const items: AiBatchItem[] = [];
    for (const url of urls) {
      const ctx = runDb.getAiContext(url);
      if (!ctx) continue;
      items.push({
        url,
        prompt: substitutePrompt(input.prompt, ctx),
      });
    }
    if (items.length === 0) {
      aiRunSnapshot = {
        ...idleFetchSnapshot(),
        provider: input.provider,
        finishedAt: new Date().toISOString(),
      };
      return { completed: 0, failed: 0, cancelled: false };
    }

    aiRunActive = true;
    aiCancelRequested = false;
    aiRunSnapshot = {
      ...idleFetchSnapshot(),
      running: true,
      total: items.length,
      provider: input.provider,
      startedAt: new Date().toISOString(),
    };
    logger.log(
      'info',
      'ai',
      `${input.provider}/${model} run started — ${items.length} prompt(s) (concurrency=${concurrency})`,
    );
    try {
      const result = await runAiBatch({
        provider: input.provider,
        model,
        concurrency,
        items,
        isCancelled: () => aiCancelRequested,
        onResult: (outcome) => {
          try {
            const fetchedAt = new Date().toISOString();
            if (outcome.ok && outcome.output) {
              runDb.upsertAiResult(
                outcome.url,
                input.provider,
                outcome.output.model,
                outcome.output.text,
                outcome.output.tokensIn,
                outcome.output.tokensOut,
                'ok',
                null,
                fetchedAt,
              );
            } else {
              runDb.upsertAiResult(
                outcome.url,
                input.provider,
                model,
                '',
                null,
                null,
                'error',
                outcome.error ?? 'Unknown error',
                fetchedAt,
              );
            }
          } catch (err) {
            logger.log(
              'error',
              'ai',
              `DB write failed for ${outcome.url}: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
          }
          if (outcome.ok) aiRunSnapshot.completed++;
          else aiRunSnapshot.failed++;
        },
        onProgress: (done, total, currentUrl) => {
          aiRunSnapshot.done = done;
          aiRunSnapshot.total = total;
          aiRunSnapshot.currentUrl = currentUrl;
          mainWindow?.webContents.send(IPC.aiProgress, {
            done,
            total,
            currentUrl,
            running: true,
          });
        },
      });
      aiRunSnapshot = {
        ...aiRunSnapshot,
        running: false,
        done: result.completed + result.failed,
        completed: result.completed,
        failed: result.failed,
        cancelled: result.cancelled,
        currentUrl: null,
        finishedAt: new Date().toISOString(),
      };
      mainWindow?.webContents.send(IPC.aiProgress, {
        done: result.completed + result.failed,
        total: items.length,
        currentUrl: null,
        running: false,
      });
      fireDataChanged();
      return result;
    } catch (err) {
      aiRunSnapshot = {
        ...aiRunSnapshot,
        running: false,
        currentUrl: null,
        finishedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
      };
      throw err;
    } finally {
      aiRunActive = false;
      aiCancelRequested = false;
    }
  }

  ipcMain.handle(
    IPC.aiRun,
    async (_e, input: AiRunInput): Promise<AiRunResult> => runAiJob(input),
  );

  ipcMain.handle(IPC.aiCancel, () => {
    if (aiRunActive) {
      aiCancelRequested = true;
      logger.log('info', 'ai', 'run cancellation requested');
    }
  });

  ipcMain.handle(
    IPC.aiQuery,
    async (_e, input: AiQueryInput): Promise<AiQueryResult> => {
      const params = {
        limit: input.limit,
        offset: input.offset,
        search: input.search,
        provider: input.provider,
        filter: input.filter,
      };
      return callReaderOrFallback<AiQueryResult>(
        'queryAi',
        [params],
        () => getDb().queryAi(params),
      );
    },
  );

  // V1 Faz 7 — third-party SEO authority providers (Ahrefs / Majestic /
  // Moz / Semrush). Same shape as the AI run: pin the DB to the active
  // project, fan URLs through the provider's per-URL endpoint, persist
  // ok/error rows so partial outages are visible in the UI.
  // Shared SEO-authority batch orchestrator — driven by the renderer's
  // `seoRun` IPC (awaits) and the MCP bridge's non-blocking `seo-run`
  // action (polls `fetch-progress`). Updates `seoRunSnapshot` throughout.
  async function runSeoJob(input: SeoRunInput): Promise<SeoRunResult> {
    if (seoRunActive) return { completed: 0, failed: 0, cancelled: true };
    const urls = Array.from(
      new Set(
        (input.urls ?? []).filter(
          (u): u is string => typeof u === 'string' && u.length > 0,
        ),
      ),
    );
    if (urls.length === 0) {
      seoRunSnapshot = {
        ...idleFetchSnapshot(),
        provider: input.provider,
        finishedAt: new Date().toISOString(),
      };
      return { completed: 0, failed: 0, cancelled: false };
    }
    const runDb = getDb();
    seoRunActive = true;
    seoCancelRequested = false;
    seoRunSnapshot = {
      ...idleFetchSnapshot(),
      running: true,
      total: urls.length,
      provider: input.provider,
      startedAt: new Date().toISOString(),
    };
    logger.log('info', 'seo', `${input.provider} run started — ${urls.length} URL(s)`);
    try {
      const result = await runSeoBatch({
        provider: input.provider,
        urls,
        isCancelled: () => seoCancelRequested,
        onResult: (outcome) => {
          try {
            runDb.upsertSeoResult(
              outcome.url,
              input.provider,
              outcome.metrics,
              outcome.ok ? 'ok' : 'error',
              outcome.error,
              new Date().toISOString(),
            );
          } catch (err) {
            logger.log(
              'error',
              'seo',
              `DB write failed for ${outcome.url}: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
          }
          if (outcome.ok) seoRunSnapshot.completed++;
          else seoRunSnapshot.failed++;
        },
        onProgress: (done, total, currentUrl) => {
          seoRunSnapshot.done = done;
          seoRunSnapshot.total = total;
          seoRunSnapshot.currentUrl = currentUrl;
          mainWindow?.webContents.send(IPC.seoProgress, {
            done,
            total,
            currentUrl,
            running: true,
          });
        },
      });
      seoRunSnapshot = {
        ...seoRunSnapshot,
        running: false,
        done: result.completed + result.failed,
        completed: result.completed,
        failed: result.failed,
        cancelled: result.cancelled,
        currentUrl: null,
        finishedAt: new Date().toISOString(),
      };
      mainWindow?.webContents.send(IPC.seoProgress, {
        done: result.completed + result.failed,
        total: urls.length,
        currentUrl: null,
        running: false,
      });
      fireDataChanged();
      return result;
    } catch (err) {
      seoRunSnapshot = {
        ...seoRunSnapshot,
        running: false,
        currentUrl: null,
        finishedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
      };
      throw err;
    } finally {
      seoRunActive = false;
      seoCancelRequested = false;
    }
  }

  ipcMain.handle(
    IPC.seoRun,
    async (_e, input: SeoRunInput): Promise<SeoRunResult> => runSeoJob(input),
  );
  ipcMain.handle(IPC.seoCancel, () => {
    if (seoRunActive) {
      seoCancelRequested = true;
      logger.log('info', 'seo', 'run cancellation requested');
    }
  });
  ipcMain.handle(
    IPC.seoQuery,
    async (_e, input: SeoQueryInput): Promise<SeoQueryResult> => {
      const params = {
        limit: input.limit,
        offset: input.offset,
        search: input.search,
        provider: input.provider,
        filter: input.filter,
      };
      return callReaderOrFallback<SeoQueryResult>(
        'querySeo',
        [params],
        () => getDb().querySeo(params),
      );
    },
  );

  // V1 Faz 7 — Google Search Console URL Inspection. Sequential — the
  // API caps at 2 000 calls / day per property; running in parallel
  // doesn't speed it up materially and risks burning quota on errors.
  ipcMain.handle(
    IPC.gscInspectRun,
    async (_e, input: GscInspectRunInput): Promise<GscInspectRunResult> => {
      if (gscInspectRunActive) {
        return { completed: 0, failed: 0, cancelled: true };
      }
      const urls = Array.from(
        new Set(
          (input.urls ?? []).filter(
            (u): u is string => typeof u === 'string' && u.length > 0,
          ),
        ),
      );
      if (!input.property || urls.length === 0) {
        return { completed: 0, failed: 0, cancelled: false };
      }
      const runDb = getDb();
      gscInspectRunActive = true;
      gscInspectCancelRequested = false;
      let completed = 0;
      let failed = 0;
      let done = 0;
      logger.log(
        'info',
        'gsc',
        `URL Inspection run started — ${urls.length} URL(s) for ${input.property}`,
      );
      mainWindow?.webContents.send(IPC.gscInspectProgress, {
        done: 0,
        total: urls.length,
        currentUrl: null,
        running: true,
      });
      try {
        for (const url of urls) {
          if (gscInspectCancelRequested) break;
          mainWindow?.webContents.send(IPC.gscInspectProgress, {
            done,
            total: urls.length,
            currentUrl: url,
            running: true,
          });
          const fetchedAt = new Date().toISOString();
          try {
            const raw = await inspectUrl(input.property, url);
            const result: GscInspectionResult = {
              ...raw,
              status: 'ok',
              error: null,
              fetchedAt,
            };
            runDb.upsertGscInspection(url, result);
            completed++;
          } catch (err) {
            runDb.upsertGscInspection(url, {
              verdict: null,
              coverageState: null,
              robotsTxtState: null,
              indexingState: null,
              lastCrawlTime: null,
              googleCanonical: null,
              userCanonical: null,
              status: 'error',
              error: err instanceof Error ? err.message : String(err),
              fetchedAt,
            });
            failed++;
          }
          done++;
        }
        mainWindow?.webContents.send(IPC.gscInspectProgress, {
          done,
          total: urls.length,
          currentUrl: null,
          running: false,
        });
        fireDataChanged();
        return {
          completed,
          failed,
          cancelled: gscInspectCancelRequested && done < urls.length,
        };
      } finally {
        gscInspectRunActive = false;
        gscInspectCancelRequested = false;
      }
    },
  );
  ipcMain.handle(IPC.gscInspectCancel, () => {
    if (gscInspectRunActive) {
      gscInspectCancelRequested = true;
      logger.log('info', 'gsc', 'URL Inspection cancellation requested');
    }
  });

  // V1 Faz 7 — Google Sheets export. Uses the shared OAuth keystone
  // (the user connects once on the GSC/GA4 flows or via the Sheets
  // integration card). Creates a fresh spreadsheet per export.
  ipcMain.handle(
    IPC.exportSheets,
    async (_e, input: ExportSheetsInput): Promise<ExportSheetsResult> => {
      try {
        const title =
          input.title?.trim() ||
          `FreeCrawl — ${input.category} — ${new Date().toISOString().slice(0, 10)}`;
        const result = await exportCategoryToSheets(getDb(), input.category, title);
        return {
          ok: true,
          error: null,
          url: result.spreadsheetUrl,
          rowsWritten: result.rowsWritten,
        };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          url: null,
          rowsWritten: 0,
        };
      }
    },
  );

  // V1 Faz 7 — BigQuery export. Service-account auth (JWT-bearer
  // grant); paste the JSON key + project ID in Settings → Integrations.
  // V1 closeout — Detail Panel Analytics sub-tab. One read query
  // merges GSC + GA4 + URL Inspection for the selected URL.
  ipcMain.handle(
    IPC.urlAnalyticsGet,
    async (_e, url: string): Promise<UrlAnalyticsDetail | null> => {
      if (!url) return null;
      return callReaderOrFallback<UrlAnalyticsDetail | null>(
        'getUrlAnalytics',
        [url],
        () => getDb().getUrlAnalytics(url),
      );
    },
  );

  ipcMain.handle(
    IPC.exportBigquery,
    async (_e, input: ExportBigqueryInput): Promise<ExportBigqueryResult> => {
      try {
        const result = await exportCategoryToBigQuery(getDb(), input.category);
        return {
          ok: true,
          error: null,
          consoleUrl: result.consoleUrl,
          tableRef: result.tableRef,
          rowsWritten: result.rowsWritten,
        };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          consoleUrl: null,
          tableRef: null,
          rowsWritten: 0,
        };
      }
    },
  );

  // Stream new entries to the logs window in coalesced batches. A heavy
  // crawl emits 100–300 logs/s; sending each as its own IPC message
  // saturated the renderer's event loop and caused visible UI stutters
  // even with renderer-side batching, because every IPC dispatch
  // costs serialise + V8-deserialise + main-thread work in the
  // renderer process. Batching at 100 ms drops IPC volume by ~10–30×
  // while still feeling "live" in the log panel.
  let logsBatch: LogEntry[] = [];
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
    // V1 Faz 8 Phase 2 — when the renderer switches language, rebuild the
    // app menu so File/View/Help/etc. labels follow immediately. Cheap;
    // rebuildMenu is also the recent-projects refresh path.
    if (key === 'uiLanguage' && isMenuLang(value)) {
      rebuildMenu();
    }
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
      latestProgress = p;
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
      // V1 Faz 6 — if this run was kicked off by the scheduler, record
      // the result so the dialog's "Last status" row reflects the
      // outcome. The schedule has already been re-armed (nextFiresAt
      // advanced) at claim time; we only need to flip the status from
      // `running` to a terminal value.
      if (crawlerStartedByScheduler) {
        crawlerStartedByScheduler = false;
        recordFireResult(schedulerStore, currentProjectPath, 'success');
      }
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
      if (crawlerStartedByScheduler) {
        crawlerStartedByScheduler = false;
        recordFireResult(schedulerStore, currentProjectPath, 'failure');
      }
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

  async function launchCrawl(config: CrawlConfig): Promise<void> {
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

    // V2 Faz 1 — Spin up the Playwright browser pool when JS rendering
    // is enabled. Pool start is lazy (Chromium launches on first
    // acquire) so HTTP-only crawls pay nothing. Dispose any previous
    // pool first; pool reuse across runs would carry over routes /
    // viewport from a config that may have changed.
    void disposeBrowserPool();
    let renderHook:
      | ((
          url: string,
          urlId: number | null,
          signal: AbortSignal,
        ) => Promise<{
          ok: boolean;
          html: string;
          timingMs: number;
          error?: string;
          screenshots?: { fullpage?: string; fold?: string; mobile?: string };
          lcp?: {
            selector: string;
            tagName: string;
            width: number;
            height: number;
            coverage: number;
            resourceUrl: string | null;
          } | null;
          mobileUsability?: {
            ok: boolean;
            overflowPx: number;
            hasViewportMeta: boolean;
          } | null;
          a11y?: {
            lowContrast: number;
            sampled: number;
            focusSuppressed: boolean;
          } | null;
        }>)
      | undefined;
    if (config.renderingMode === 'js') {
      const blocked = new Set<string>();
      if (config.jsRender.blockResources.image) blocked.add('image');
      if (config.jsRender.blockResources.font) blocked.add('font');
      if (config.jsRender.blockResources.media) blocked.add('media');
      if (config.jsRender.blockResources.stylesheet) blocked.add('stylesheet');
      if (config.jsRender.blockResources.script) blocked.add('script');
      activeBrowserPool = new BrowserPool({
        maxPages:
          config.jsRender.maxPages > 0
            ? config.jsRender.maxPages
            : Math.max(1, Math.min(8, config.maxConcurrency)),
        headless: config.jsRender.headless,
        viewport: {
          width: config.jsRender.viewportWidth,
          height: config.jsRender.viewportHeight,
        },
        userAgent: config.userAgent || undefined,
        acceptLanguage: config.acceptLanguage || undefined,
        channel: config.jsRender.browserChannel || undefined,
        blockResourceTypes: blocked.size > 0 ? blocked : undefined,
        // Bug #2 — register once at context level. Setting it on
        // each page accumulated across reused slots; a long crawl
        // ran the snippet N times per navigation.
        prerenderJs: config.jsRender.prerenderJs || undefined,
      });
      const pool = activeBrowserPool;

      // V2 Faz 1 — Eagerly start the pool so we can detect a missing
      // Playwright browser BEFORE any URL hits the render hook.
      // Without this, the binary-missing error fires once per URL as
      // a "JS render threw" warning, spamming logs and never giving
      // the user a chance to install. Now: one prompt, install (if
      // accepted), retry once. If still missing, drop JS render for
      // this crawl and continue with text-only mode.
      try {
        await pool.start();
      } catch (err) {
        if (err instanceof PlaywrightBrowserMissingError) {
          logger.log(
            'warn',
            'crawler',
            'JS render disabled — Playwright browser binary missing. Prompting user to install.',
          );
          const installed = await offerPlaywrightInstall();
          if (installed) {
            try {
              // Pool's `closed` was never set; just retry start.
              await pool.start();
            } catch (retryErr) {
              logger.log(
                'error',
                'crawler',
                `JS render pool still failed after install: ${retryErr instanceof Error ? retryErr.message : String(retryErr)} — falling back to text mode for this crawl.`,
              );
              await disposeBrowserPool();
              config = { ...config, renderingMode: 'text' };
              renderHook = undefined;
            }
          } else {
            logger.log(
              'warn',
              'crawler',
              'User declined Playwright install — falling back to text mode for this crawl.',
            );
            await disposeBrowserPool();
            config = { ...config, renderingMode: 'text' };
            renderHook = undefined;
          }
        } else {
          logger.log(
            'error',
            'crawler',
            `Browser pool start failed: ${err instanceof Error ? err.message : String(err)} — falling back to text mode.`,
          );
          await disposeBrowserPool();
          config = { ...config, renderingMode: 'text' };
          renderHook = undefined;
        }
      }
      const screenshotDir = resolveScreenshotDir(currentProjectPath);
      const wantsScreenshot = config.jsRender.screenshotMode !== 'none';
      const wantsMobile =
        config.jsRender.mobileScreenshot || config.jsRender.mobileUsability;
      renderHook = async (url: string, _urlId: number | null, signal: AbortSignal) => {
        if (!pool || pool.isClosed()) {
          return { ok: false, html: '', timingMs: 0, error: 'pool closed' };
        }
        let screenshotPaths: { fullpage?: string; fold?: string } | undefined;
        if (wantsScreenshot && screenshotDir) {
          try {
            mkdirSync(screenshotDir, { recursive: true });
          } catch {
            /* failure here just disables screenshot for this URL */
          }
          const stem = hashUrlStem(url);
          const mode = config.jsRender.screenshotMode;
          screenshotPaths = {};
          if (mode === 'fullpage' || mode === 'both') {
            screenshotPaths.fullpage = join(screenshotDir, `${stem}-fullpage.png`);
          }
          if (mode === 'fold' || mode === 'both') {
            screenshotPaths.fold = join(screenshotDir, `${stem}-fold.png`);
          }
        }
        const res = await renderUrl(
          url,
          pool,
          {
            timeoutMs: Math.max(5000, config.requestTimeoutMs),
            ajaxTimeoutMs: config.jsRender.ajaxTimeoutMs,
            waitSelector: config.jsRender.waitSelector || undefined,
            waitUntil: config.jsRender.waitUntil,
            screenshotMode: config.jsRender.screenshotMode,
            detectLcp: config.jsRender.lcpCandidate,
            detectA11y: config.jsRender.a11yAudit,
            screenshotPaths,
          },
          signal,
        );
        // Mobile pass — runs only when screenshot or usability is opted-in.
        // Reuses the same pool but flips viewport temporarily; the
        // function restores the previous size before releasing the page.
        let mobileScreenshotPath: string | undefined;
        let mobileUsability:
          | { ok: boolean; overflowPx: number; hasViewportMeta: boolean }
          | null = null;
        if (wantsMobile && pool && !pool.isClosed() && res.ok) {
          try {
            if (config.jsRender.mobileScreenshot && screenshotDir) {
              const stem = hashUrlStem(url);
              const path = join(screenshotDir, `${stem}-mobile.png`);
              const mobileRes = await renderUrl(
                url,
                pool,
                {
                  timeoutMs: Math.max(5000, config.requestTimeoutMs),
                  ajaxTimeoutMs: Math.min(config.jsRender.ajaxTimeoutMs, 1000),
                  waitUntil: config.jsRender.waitUntil,
                  screenshotMode: 'fold',
                  screenshotPaths: { fold: path },
                  // Bug #1 — actually use a mobile viewport so the PNG
                  // matches the column name. Without this, the file
                  // was a duplicate of the desktop above-the-fold.
                  viewport: { width: 375, height: 667 },
                },
                signal,
              );
              if (mobileRes.ok && mobileRes.screenshots?.fold) {
                mobileScreenshotPath = mobileRes.screenshots.fold;
              }
            }
            if (config.jsRender.mobileUsability) {
              const audit = await auditMobileUsability(
                url,
                pool,
                {
                  timeoutMs: Math.max(5000, config.requestTimeoutMs),
                  waitUntil: config.jsRender.waitUntil,
                },
                signal,
              );
              if (audit) {
                mobileUsability = {
                  ok: audit.ok,
                  overflowPx: audit.overflowPx,
                  hasViewportMeta: audit.hasViewportMeta,
                };
              }
            }
          } catch (err) {
            logger.log(
              'debug',
              'crawler',
              `mobile pass failed for ${url}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }
        const screenshots =
          res.screenshots || mobileScreenshotPath
            ? {
                ...(res.screenshots ?? {}),
                ...(mobileScreenshotPath ? { mobile: mobileScreenshotPath } : {}),
              }
            : undefined;
        return {
          ok: res.ok,
          html: res.html,
          timingMs: res.timingMs,
          error: res.error,
          screenshots,
          lcp: res.lcp ?? null,
          mobileUsability,
          a11y: res.a11y ?? null,
        };
      };
    }

    const crawler = new Crawler(config, database, {
      setOp: (op: string) => freezeWatchdog.setMainOp(op),
      parseHtml: parseHtmlViaPool,
      writeFetchedUrl: writeFetchedUrlViaPool,
      recomputeIssues: recomputeIssuesViaPool,
      runDbPass: runDbPassViaPool,
      dbCall: dbCallViaPool,
      renderUrl: renderHook,
    });
    activeCrawler = crawler;
    attachCrawlerListeners(crawler);
    crawler.on('done', () => {
      // Best-effort dispose — keeps Chromium from lingering after a
      // crawl ends. Pool is recreated on next JS-mode launch.
      void disposeBrowserPool();
    });
    crawler.on('error', () => {
      void disposeBrowserPool();
    });
    void crawler.start();
  }

  /**
   * V2 Faz 1 — Resolve the per-project screenshots sidecar directory.
   * Lives alongside the `.seoproject` file as `<project>.screenshots/`
   * so it tracks with Save As / move operations.
   */
  /**
   * V2 Faz 1 — Once-per-session prompt asking the user to install the
   * Playwright browser binaries when JS rendering is enabled but the
   * binaries are missing on disk. Spawned via `npx playwright install`
   * inheriting the user-data env so the cache lands in the standard
   * location. Returns true when the install command finished cleanly
   * (the caller can then retry the BrowserPool start).
   */
  let playwrightInstallPromise: Promise<boolean> | null = null;
  async function offerPlaywrightInstall(): Promise<boolean> {
    if (playwrightInstallPromise) return playwrightInstallPromise;
    if (!mainWindow) return false;
    const res = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      title: L().dlgPlaywrightTitle,
      message:
        'Playwright needs to download a Chromium browser before JavaScript rendering can run.',
      detail:
        'This is a one-time ~250 MB download. The browser is stored in your user cache; FreeCrawl never sends any data to Playwright servers — only the binary is downloaded from cdn.playwright.dev.\n\nDownload now?',
      buttons: [L().btnDownloadNow, L().btnSkipJsRender],
      defaultId: 0,
      cancelId: 1,
    });
    if (res.response !== 0) return false;
    playwrightInstallPromise = new Promise<boolean>((resolve) => {
      const proc = spawn(
        'npx',
        ['playwright', 'install', 'chromium', 'chromium-headless-shell'],
        {
          shell: process.platform === 'win32',
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
      let stderr = '';
      proc.stdout?.on('data', (chunk: Buffer) => {
        const line = chunk.toString().trim();
        if (line) logger.log('info', 'playwright-install', line);
      });
      proc.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      proc.on('close', (code) => {
        playwrightInstallPromise = null;
        if (code === 0) {
          logger.log('info', 'playwright-install', 'Browser install complete.');
          resolve(true);
        } else {
          logger.log(
            'error',
            'playwright-install',
            `Browser install failed (exit ${code}). stderr: ${stderr.slice(0, 500)}`,
          );
          dialog.showErrorBox(
            L().dlgBrowserInstallFailedTitle,
            `Playwright install exited with code ${code}.\n\n` +
              `Try running "npx playwright install chromium chromium-headless-shell" manually from a terminal in the FreeCrawl source folder.\n\n${stderr.slice(0, 400)}`,
          );
          resolve(false);
        }
      });
      proc.on('error', (err) => {
        playwrightInstallPromise = null;
        logger.log('error', 'playwright-install', `spawn failed: ${err.message}`);
        dialog.showErrorBox(
          L().dlgBrowserInstallFailedTitle,
          `Could not run "npx playwright install": ${err.message}\n\nPlease install Playwright browsers manually from a terminal.`,
        );
        resolve(false);
      });
    });
    return playwrightInstallPromise;
  }

  function resolveScreenshotDir(projectPath: string): string | null {
    if (!projectPath) return null;
    const dir = dirname(projectPath);
    const base = basename(projectPath);
    return join(dir, `${base}.screenshots`);
  }

  /**
   * Stable 16-char hex stem derived from the URL. Used as the screenshot
   * filename prefix so re-crawls overwrite the previous capture instead
   * of accumulating files.
   */
  function hashUrlStem(url: string): string {
    return createHash('sha1').update(url).digest('hex').slice(0, 16);
  }

  async function disposeBrowserPool(): Promise<void> {
    if (!activeBrowserPool) return;
    const p = activeBrowserPool;
    activeBrowserPool = null;
    try {
      await p.close();
    } catch (err) {
      logger.log(
        'warn',
        'crawler',
        `Browser pool close failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  ipcMain.handle(IPC.crawlStart, async (_e, config: CrawlConfig) => {
    await launchCrawl(config);
  });

  ipcMain.handle(IPC.crawlStop, () => {
    activeCrawler?.stop();
    void disposeBrowserPool();
  });

  ipcMain.handle(IPC.crawlPause, () => {
    activeCrawler?.pause();
  });

  ipcMain.handle(IPC.crawlResume, () => {
    activeCrawler?.resume();
  });

  // Expose the same primitives to the MCP bridge so external agents
  // (Claude Code, etc.) can drive Start/Stop/Pause/Resume through the
  // exact same code path the renderer does.
  // Generic MCP action dispatch table — kebab-case names map to closures
  // that perform actions. Each closure reuses the same util functions as
  // the desktop's IPC handlers, but skips the user dialog popups (MCP
  // requires explicit `filePath`'s instead of blocking the agent on a
  // file picker). Validation is intentionally light — the bridge layer
  // already requires an authenticated request, and a misshapen payload
  // throws which the bridge wraps into a 500 with the underlying error
  // message. The MCP tool definitions on the other side enforce schema.
  // Resolve the target URL list for a batch-fetch action (pagespeed-run /
  // ai-run / seo-run): an explicit `urls` array wins; otherwise pull from
  // the active project by `category` (+ optional `search`), capped by
  // `limit` (default 100, max 5000). `truncated` flags when the category
  // matched more rows than the cap. Category resolution is preferred over
  // a giant `urls` array because the bridge caps request bodies at 64 KB.
  function resolveActionUrls(input: {
    urls?: unknown;
    category?: unknown;
    search?: unknown;
    limit?: unknown;
  }): { urls: string[]; truncated: boolean } {
    const explicit = Array.isArray(input.urls)
      ? input.urls.filter(
          (u): u is string => typeof u === 'string' && u.length > 0,
        )
      : [];
    if (explicit.length > 0) {
      return { urls: Array.from(new Set(explicit)), truncated: false };
    }
    const category =
      typeof input.category === 'string'
        ? (input.category as UrlCategory)
        : 'all';
    const search = typeof input.search === 'string' ? input.search : undefined;
    const limit =
      typeof input.limit === 'number' && Number.isFinite(input.limit)
        ? Math.max(1, Math.min(5000, Math.floor(input.limit)))
        : 100;
    const { rows, total } = getDb().queryUrls({
      category,
      search,
      limit,
      offset: 0,
    });
    const urls = Array.from(
      new Set(
        rows
          .map((r) => r.url)
          .filter((u): u is string => typeof u === 'string' && u.length > 0),
      ),
    );
    return { urls, truncated: total > urls.length };
  }

  const mcpActions: Record<string, (input: unknown) => Promise<unknown>> = {
    'crawl-add-url': async (input) => {
      const url = (input as { url?: string }).url ?? '';
      if (!activeCrawler) return { accepted: false, reason: 'no-active-crawl' };
      const accepted = activeCrawler.enqueueManual(url);
      return { accepted };
    },

    'export-csv': async (input) => {
      const i = input as ExportCsvInput;
      if (!i.filePath) throw new Error('filePath is required (MCP cannot open dialogs).');
      const { rowsWritten } = await exportUrlsToCsv(getDb(), i.filePath, {
        selectedIds: i.selectedIds,
      });
      return { filePath: i.filePath, rowsWritten };
    },

    'export-json': async (input) => {
      const i = input as ExportJsonInput;
      if (!i.filePath) throw new Error('filePath is required.');
      const { rowsWritten } = await exportUrlsToJson(getDb(), i.filePath, {
        selectedIds: i.selectedIds,
        pretty: i.pretty,
      });
      return { filePath: i.filePath, rowsWritten };
    },

    'export-xml': async (input) => {
      const i = input as ExportXmlInput;
      if (!i.filePath) throw new Error('filePath is required.');
      const { rowsWritten } = await exportUrlsToXml(getDb(), i.filePath, {
        selectedIds: i.selectedIds,
        category: i.category,
      });
      return { filePath: i.filePath, rowsWritten };
    },

    'export-html-report': async (input) => {
      const i = input as ExportHtmlReportInput;
      if (!i.filePath) throw new Error('filePath is required.');
      const result = await exportHtmlReport(getDb(), i.filePath, {
        startUrl: getDb().getMeta('lastStartUrl') ?? '',
      });
      return { filePath: result.filePath, bytesWritten: result.bytesWritten };
    },

    'sitemap-generate': async (input) => {
      const i = input as SitemapGenerateInput;
      if (!i.filePath) throw new Error('filePath is required.');
      return exportSitemap(getDb(), i.filePath, {
        variant: i.variant,
        gzip: i.gzip,
        splitAtUrlCount: i.splitAtUrlCount,
      });
    },

    'sitemap-validate': async (input) => {
      const i = input as SitemapValidateInput;
      if (!i.url) throw new Error('url is required.');
      const ac = new AbortController();
      const timeout = setTimeout(() => ac.abort(), 30_000);
      try {
        const ua = i.userAgent || DEFAULT_CRAWL_CONFIG.userAgent;
        const result = await fetchSitemaps([i.url], {
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
          url: i.url,
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

    'robots-test': async (input) => {
      const i = input as RobotsTestInput;
      if (!i.url || !i.userAgent) {
        throw new Error('url and userAgent are required.');
      }
      return testUrlAgainstRobots(i.url, i.userAgent, i.customRobots);
    },

    'robots-validate': async (input) => {
      const text = typeof (input as { text?: string }).text === 'string'
        ? (input as { text: string }).text
        : '';
      return validateRobotsTxt(text);
    },

    'compare-load': async (input) => {
      const i = input as CompareLoadInput;
      if (!i.filePath) throw new Error('filePath is required (MCP cannot open dialogs).');
      const otherDb = new ProjectDb(i.filePath);
      try {
        const summary = compareCrawls(getDb(), otherDb);
        return {
          filePath: i.filePath,
          totalA: summary.totalA,
          totalB: summary.totalB,
          counts: summary.counts,
          samples: summary.samples,
        };
      } finally {
        otherDb.close?.();
      }
    },

    'schedule-get': async () => {
      return getSchedule(schedulerStore, currentProjectPath);
    },

    'schedule-set': async (input) => {
      const spec = (input as { spec?: ScheduleSpec | null }).spec ?? null;
      return setSchedule(schedulerStore, currentProjectPath, spec);
    },

    'report-top-words': async (input) => {
      const i = (input ?? {}) as { limit?: number; minLength?: number; locale?: 'en' | 'tr' | 'all' };
      const corpus = getDb().seoTextCorpus();
      return aggregateTopWords(corpus, {
        limit: i.limit ?? 100,
        minLength: i.minLength ?? 3,
        locale: i.locale ?? 'all',
      });
    },

    // ---- Faz 0.5 Increment 3 — URL mutation, exports, config, integrations, project file ----

    'respider-urls': async (input) => {
      // Mirrors the URL-bulk context menu's "Re-Spider" item. Requires
      // an active crawler — the queued URLs are re-fetched live as part
      // of the existing crawl. With no active crawl, the DB rows are
      // still marked dirty so the NEXT crawl will pick them up.
      const ids = (input as { urlIds?: number[] }).urlIds ?? [];
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('urlIds is required (non-empty array).');
      }
      const db = getDb();
      db.markUrlsForRecrawl(ids);
      let requeued = 0;
      if (activeCrawler && activeCrawler.isRunning) {
        const urls = db.getUrlsByIds(ids);
        for (const u of urls) {
          activeCrawler.requeueUrl(u);
          requeued++;
        }
      }
      fireDataChanged();
      return { marked: ids.length, requeued, hasActiveCrawl: activeCrawler?.isRunning === true };
    },

    'remove-urls': async (input) => {
      const ids = (input as { urlIds?: number[] }).urlIds ?? [];
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('urlIds is required (non-empty array).');
      }
      getDb().deleteUrls(ids);
      fireDataChanged();
      return { removed: ids.length };
    },

    'data-delete-by-domain': async (input) => {
      const domain = (input as { domain?: string }).domain ?? '';
      if (!domain.trim()) throw new Error('domain is required.');
      const result = getDb().deleteByDomain(domain.trim().toLowerCase());
      fireDataChanged();
      return result;
    },

    'export-broken-links': async (input) => {
      const i = input as { filePath?: string; internal?: 'all' | 'internal' | 'external' };
      if (!i.filePath) throw new Error('filePath is required.');
      const { rowsWritten } = await exportBrokenLinksToCsv(getDb(), i.filePath, {
        internal: i.internal ?? 'all',
      });
      return { filePath: i.filePath, rowsWritten };
    },

    'export-images': async (input) => {
      const i = input as { filePath?: string; missingAltOnly?: boolean; search?: string };
      if (!i.filePath) throw new Error('filePath is required.');
      const { rowsWritten } = await exportImagesToCsv(getDb(), i.filePath, {
        missingAltOnly: i.missingAltOnly,
        search: i.search,
      });
      return { filePath: i.filePath, rowsWritten };
    },

    'export-tabular': async (input) => {
      const i = input as ExportTabularInput;
      if (!i.filePath) throw new Error('filePath is required.');
      return exportTabular(getDb(), i.filePath, {
        format: i.format,
        sections: i.sections,
        columns: i.columns,
        selectedIds: i.selectedIds,
      });
    },

    'get-crawl-config': async () => {
      // Mirrors what the renderer hydrates from prefs at boot — the
      // current saved `lastCrawlConfig` if present, else the factory
      // default. Lets an agent see what's saved before calling
      // `start_crawl` without overrides.
      return lastCrawlConfig ?? { ...DEFAULT_CRAWL_CONFIG };
    },

    'set-crawl-config': async (input) => {
      // Persists the supplied CrawlConfig as the "last used" — the next
      // `start_crawl` call without overrides will use this. Whitelist
      // is intentionally loose (full CrawlConfig) because the desktop's
      // Settings dialog has dozens of fields and gating MCP narrower
      // than the UI would be arbitrary. The crawler itself validates
      // ranges at launch time.
      const cfg = input as CrawlConfig;
      if (!cfg || typeof cfg !== 'object') {
        throw new Error('CrawlConfig object required.');
      }
      lastCrawlConfig = { ...DEFAULT_CRAWL_CONFIG, ...cfg };
      try {
        getDb().setMeta('lastCrawlConfig', JSON.stringify(lastCrawlConfig));
      } catch {
        /* non-fatal — config still set in memory */
      }
      return { ok: true, config: lastCrawlConfig };
    },

    'url-rewrite-preview': async (input) => {
      const i = input as UrlRewritePreviewInput;
      const errors: Array<{ pattern: string; error: string }> = [];
      const compiled = compileUrlRegexRewrites(i.urlRegexRewrites, (p, err) =>
        errors.push({ pattern: p, error: err }),
      );
      let result: string | null = null;
      let parseError: string | undefined;
      try {
        result = normalizeUrl(i.url, undefined, {
          stripWww: i.stripWww,
          forceHttps: i.forceHttps,
          lowercasePath: i.lowercasePath,
          trailingSlash: i.trailingSlash,
          keepQueryParams: i.keepQueryParams,
          regexRewrites: compiled,
        });
        if (result === null) parseError = 'URL failed to parse or rewrite produced an invalid URL';
      } catch (err) {
        parseError = err instanceof Error ? err.message : String(err);
      }
      return { result, regexErrors: errors, parseError };
    },

    'extraction-preview': async (input) => {
      // Same shape as the IPC `extraction:preview` handler — fetches
      // the URL once and runs rules against it. Used by the Settings →
      // Custom Extraction "Preview" button on the desktop; exposed
      // here so an agent can iterate on selectors without a full crawl.
      const i = input as ExtractionPreviewInput;
      if (!i.url) return { ok: false, error: 'URL is required' };
      let parsed: URL;
      try {
        parsed = new URL(i.url);
      } catch {
        return { ok: false, error: 'Invalid URL' };
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { ok: false, error: 'Only http(s) URLs supported' };
      }
      const userAgent = (i.userAgent ?? '').trim() || 'FreeCrawl SEO Tool (extraction preview)';
      const acceptLanguage = (i.acceptLanguage ?? '').trim() || 'en';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      const startedAt = Date.now();
      let response: Response | null = null;
      try {
        response = (await undiciFetch(parsed.href, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': userAgent,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': acceptLanguage,
          },
          signal: controller.signal,
        })) as unknown as Response;
      } catch (err) {
        clearTimeout(timer);
        return {
          ok: false,
          error: controller.signal.aborted
            ? 'Fetch timed out after 15s'
            : `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
      clearTimeout(timer);
      const bodyText = await response.text();
      const results = previewExtractionRules(bodyText, i.rules ?? []).map((r) => ({
        name: r.name,
        value: r.value,
        ...(r.error !== undefined && { error: r.error }),
      }));
      return {
        ok: true,
        statusCode: response.status,
        finalUrl: response.url || parsed.href,
        contentType: response.headers.get('content-type') ?? '',
        byteSize: Buffer.byteLength(bodyText, 'utf8'),
        fetchMs: Date.now() - startedAt,
        results,
      };
    },

    'graph-snapshot': async (input) => {
      const i = (input ?? {}) as { nodeLimit?: number };
      return getDb().graphSnapshot(i.nodeLimit ?? 5000);
    },

    'crawl-path': async (input) => {
      const i = (input ?? {}) as { urlId?: number; url?: string };
      let id = i.urlId;
      if (id === undefined && typeof i.url === 'string') {
        id = getDb().getUrlIdByUrl(i.url) ?? undefined;
      }
      if (id === undefined) {
        return { path: [], reachedRoot: false };
      }
      return getDb().crawlPath(id);
    },

    // ---- Faz 0.5 Increment 4 — Integration fetch triggers (simple ones). ----
    // GSC and GA4 fetches are single blocking API calls, no progress
    // streaming — safe to expose to MCP. PSI / AI / SEO have multi-URL
    // batches with progress events + cancellation flags; those stay
    // desktop-only until a polling tool pattern is designed.

    'gsc-list-sites': async () => {
      try {
        return { ok: true, error: null, sites: await listSites() };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          sites: [],
        };
      }
    },

    'gsc-fetch': async (input) => {
      // Mirrors the desktop's `gsc:fetch` IPC handler exactly — same
      // window-end-lags-by-2-days logic so the date range only covers
      // data Search Console has actually published.
      const i = input as GscFetchInput;
      if (!i.property) {
        return {
          ok: false,
          error: 'property is required (e.g. "sc-domain:example.com").',
          rowCount: 0,
          meta: null,
        };
      }
      const days = (i.days ?? 28) as 7 | 28 | 90;
      const isoDate = (d: Date): string => d.toISOString().slice(0, 10);
      const end = new Date(Date.now() - 2 * 86_400_000);
      const start = new Date(end.getTime() - (days - 1) * 86_400_000);
      const startDate = isoDate(start);
      const endDate = isoDate(end);
      const runDb = getDb();
      try {
        const rows = await querySearchAnalytics(i.property, startDate, endDate);
        const fetchedAt = new Date().toISOString();
        runDb.replaceGscResults(rows, fetchedAt);
        const meta = {
          property: i.property,
          startDate,
          endDate,
          fetchedAt,
          rowCount: rows.length,
        };
        runDb.setMeta('gscFetchMeta', JSON.stringify(meta));
        fireDataChanged();
        return { ok: true, error: null, rowCount: rows.length, meta };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          rowCount: 0,
          meta: null,
        };
      }
    },

    'ga4-list-properties': async () => {
      try {
        return { ok: true, error: null, properties: await ga4ListProperties() };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          properties: [],
        };
      }
    },

    'ga4-fetch': async (input) => {
      // Mirrors the desktop's `ga4:fetch` IPC handler exactly — GA4 data
      // is near-realtime so the range ends at today (unlike GSC's 2-day lag).
      const i = input as Ga4FetchInput;
      if (!i.property) {
        return {
          ok: false,
          error: 'property is required (e.g. "properties/123456").',
          rowCount: 0,
          meta: null,
        };
      }
      const days = (i.days ?? 28) as 7 | 28 | 90;
      const isoDate = (d: Date): string => d.toISOString().slice(0, 10);
      const end = new Date();
      const start = new Date(end.getTime() - (days - 1) * 86_400_000);
      const startDate = isoDate(start);
      const endDate = isoDate(end);
      const runDb = getDb();
      try {
        const rows = await ga4RunReport(i.property, startDate, endDate);
        const fetchedAt = new Date().toISOString();
        runDb.replaceGa4Results(rows, fetchedAt);
        const meta = {
          property: i.property,
          propertyName: i.propertyName || i.property,
          startDate,
          endDate,
          fetchedAt,
          rowCount: rows.length,
        };
        runDb.setMeta('ga4FetchMeta', JSON.stringify(meta));
        fireDataChanged();
        return { ok: true, error: null, rowCount: rows.length, meta };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          rowCount: 0,
          meta: null,
        };
      }
    },

    'google-auth-status': async (input) => {
      const id = (input as { integrationId?: string }).integrationId ?? '';
      if (!id) throw new Error('integrationId is required (e.g. "gsc" or "ga4").');
      return getAuthState(id);
    },

    // ---- Faz 0.5 Increment 5 — slow batch-fetch triggers (PSI / AI /
    // SEO). Non-blocking: each *-run kicks off the shared run-job WITHOUT
    // awaiting it (the job populates its snapshot synchronously before its
    // first await, so the response below is accurate) and returns at once.
    // The agent polls `fetch-progress` and may `fetch-cancel`. This
    // mirrors crawl start / progress / stop — the MCP wire protocol can't
    // stream, so the same poll model is reused.

    'pagespeed-run': async (input) => {
      const i = (input ?? {}) as {
        urls?: unknown;
        category?: unknown;
        search?: unknown;
        limit?: unknown;
        strategy?: unknown;
      };
      if (pagespeedRunActive) {
        return {
          started: false,
          reason:
            'A PageSpeed run is already in progress — poll get_fetch_progress or cancel_fetch first.',
          state: pagespeedRunSnapshot,
        };
      }
      const { urls, truncated } = resolveActionUrls(i);
      if (urls.length === 0) {
        return {
          started: false,
          reason:
            'No URLs matched — pass an explicit `urls` array or a `category` that has rows in this project.',
          state: pagespeedRunSnapshot,
        };
      }
      const strategy =
        i.strategy === 'desktop'
          ? ('desktop' as const)
          : i.strategy === 'both'
            ? ('both' as const)
            : ('mobile' as const);
      void runPagespeedJob({ urls, strategy }).catch((err) => {
        logger.log(
          'error',
          'pagespeed',
          `MCP-triggered run failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
      return {
        started: pagespeedRunActive,
        total: pagespeedRunSnapshot.total,
        truncated,
        state: pagespeedRunSnapshot,
      };
    },

    'crux-run': async (input) => {
      const i = (input ?? {}) as {
        urls?: unknown;
        category?: unknown;
        search?: unknown;
        limit?: unknown;
        formFactor?: unknown;
      };
      if (cruxRunActive) {
        return {
          started: false,
          reason:
            'A CrUX run is already in progress — poll get_fetch_progress or cancel_fetch first.',
          state: cruxRunSnapshot,
        };
      }
      const { urls, truncated } = resolveActionUrls(i);
      if (urls.length === 0) {
        return {
          started: false,
          reason:
            'No URLs matched — pass an explicit `urls` array or a `category` that has rows in this project.',
          state: cruxRunSnapshot,
        };
      }
      const formFactor =
        i.formFactor === 'desktop'
          ? ('desktop' as const)
          : i.formFactor === 'both'
            ? ('both' as const)
            : ('phone' as const);
      void runCruxJob({ urls, formFactor }).catch((err) => {
        logger.log(
          'error',
          'crux',
          `MCP-triggered run failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
      return {
        started: cruxRunActive,
        total: cruxRunSnapshot.total,
        truncated,
        state: cruxRunSnapshot,
      };
    },

    'spelling-run': async (input) => {
      const i = (input ?? {}) as {
        urls?: unknown;
        category?: unknown;
        search?: unknown;
        limit?: unknown;
      };
      if (spellingRunActive) {
        return {
          started: false,
          reason:
            'A spelling run is already in progress — poll get_fetch_progress or cancel_fetch first.',
          state: spellingRunSnapshot,
        };
      }
      const { urls, truncated } = resolveActionUrls(i);
      if (urls.length === 0) {
        return {
          started: false,
          reason:
            'No URLs matched — pass an explicit `urls` array or a `category` that has rows in this project.',
          state: spellingRunSnapshot,
        };
      }
      void runSpellingJob({ urls }).catch((err) => {
        logger.log(
          'error',
          'languagetool',
          `MCP-triggered run failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
      return {
        started: spellingRunActive,
        total: spellingRunSnapshot.total,
        truncated,
        state: spellingRunSnapshot,
      };
    },

    'ai-run': async (input) => {
      const i = (input ?? {}) as {
        provider?: unknown;
        model?: unknown;
        prompt?: unknown;
        urls?: unknown;
        category?: unknown;
        search?: unknown;
        limit?: unknown;
      };
      const provider = typeof i.provider === 'string' ? i.provider : '';
      if (
        provider !== 'openai' &&
        provider !== 'anthropic' &&
        provider !== 'ollama'
      ) {
        throw new Error(
          'ai_run requires `provider` to be one of: openai, anthropic, ollama.',
        );
      }
      const prompt = typeof i.prompt === 'string' ? i.prompt : '';
      if (prompt.trim() === '') {
        throw new Error(
          'ai_run requires a non-empty `prompt` (supports {url}/{title}/{description}/{h1}/{body} placeholders).',
        );
      }
      if (aiRunActive) {
        return {
          started: false,
          reason:
            'An AI run is already in progress — poll get_fetch_progress or cancel_fetch first.',
          state: aiRunSnapshot,
        };
      }
      const { urls, truncated } = resolveActionUrls(i);
      if (urls.length === 0) {
        return {
          started: false,
          reason:
            'No URLs matched — pass an explicit `urls` array or a `category` that has rows in this project.',
          state: aiRunSnapshot,
        };
      }
      const model = typeof i.model === 'string' ? i.model : undefined;
      void runAiJob({ provider, model, prompt, urls }).catch((err) => {
        logger.log(
          'error',
          'ai',
          `MCP-triggered run failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
      // runAiJob skips URLs with no crawled page context; if that leaves
      // nothing it returns synchronously without flipping the active flag.
      if (!aiRunActive) {
        return {
          started: false,
          reason:
            'None of the matched URLs are crawled in this project, so there is no page context to build prompts from.',
          state: aiRunSnapshot,
        };
      }
      return {
        started: true,
        total: aiRunSnapshot.total,
        truncated,
        state: aiRunSnapshot,
      };
    },

    'seo-run': async (input) => {
      const i = (input ?? {}) as {
        provider?: unknown;
        urls?: unknown;
        category?: unknown;
        search?: unknown;
        limit?: unknown;
      };
      const provider = typeof i.provider === 'string' ? i.provider : '';
      if (
        provider !== 'ahrefs' &&
        provider !== 'majestic' &&
        provider !== 'moz' &&
        provider !== 'semrush'
      ) {
        throw new Error(
          'seo_run requires `provider` to be one of: ahrefs, majestic, moz, semrush.',
        );
      }
      if (seoRunActive) {
        return {
          started: false,
          reason:
            'An SEO run is already in progress — poll get_fetch_progress or cancel_fetch first.',
          state: seoRunSnapshot,
        };
      }
      const { urls, truncated } = resolveActionUrls(i);
      if (urls.length === 0) {
        return {
          started: false,
          reason:
            'No URLs matched — pass an explicit `urls` array or a `category` that has rows in this project.',
          state: seoRunSnapshot,
        };
      }
      void runSeoJob({ provider, urls }).catch((err) => {
        logger.log(
          'error',
          'seo',
          `MCP-triggered run failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
      return {
        started: seoRunActive,
        total: seoRunSnapshot.total,
        truncated,
        state: seoRunSnapshot,
      };
    },

    'fetch-progress': async (input) => {
      const kind = (input as { kind?: unknown } | null)?.kind;
      const all = {
        pagespeed: pagespeedRunSnapshot,
        crux: cruxRunSnapshot,
        spelling: spellingRunSnapshot,
        ai: aiRunSnapshot,
        seo: seoRunSnapshot,
      };
      if (
        kind === 'pagespeed' ||
        kind === 'crux' ||
        kind === 'spelling' ||
        kind === 'ai' ||
        kind === 'seo'
      ) {
        return { [kind]: all[kind] };
      }
      return all;
    },

    'fetch-cancel': async (input) => {
      const kind = (input as { kind?: unknown } | null)?.kind;
      const cancelled: Record<string, { wasRunning: boolean }> = {};
      const cancelPagespeed = (): void => {
        const was = pagespeedRunActive;
        if (was) pagespeedCancelRequested = true;
        cancelled.pagespeed = { wasRunning: was };
      };
      const cancelAi = (): void => {
        const was = aiRunActive;
        if (was) aiCancelRequested = true;
        cancelled.ai = { wasRunning: was };
      };
      const cancelSeo = (): void => {
        const was = seoRunActive;
        if (was) seoCancelRequested = true;
        cancelled.seo = { wasRunning: was };
      };
      const cancelCrux = (): void => {
        const was = cruxRunActive;
        if (was) cruxCancelRequested = true;
        cancelled.crux = { wasRunning: was };
      };
      const cancelSpelling = (): void => {
        const was = spellingRunActive;
        if (was) spellingCancelRequested = true;
        cancelled.spelling = { wasRunning: was };
      };
      if (kind === 'pagespeed') cancelPagespeed();
      else if (kind === 'crux') cancelCrux();
      else if (kind === 'spelling') cancelSpelling();
      else if (kind === 'ai') cancelAi();
      else if (kind === 'seo') cancelSeo();
      else {
        cancelPagespeed();
        cancelCrux();
        cancelSpelling();
        cancelAi();
        cancelSeo();
      }
      return { ok: true, cancelled };
    },

    // ---- Faz 0.5 closeout — bulk export + project-file actions. These
    // were the last `[⏸]` items: dialog-driven in the desktop, exposed
    // here with explicit paths (an agent can't drive a save/open dialog). ----

    'export-bulk': async (input) => {
      const dir = (input as { outputDir?: string }).outputDir;
      if (!dir) throw new Error('outputDir is required (MCP cannot open dialogs).');
      return runBulkExport(getDb(), dir);
    },

    'project-save-as': async (input) => {
      // Snapshot the live DB to a new .seoproject via VACUUM INTO (atomic,
      // WAL-safe). Unlike the desktop handler this does NOT switch the
      // active project — an agent snapshotting shouldn't yank the UI.
      const target = (input as { filePath?: string }).filePath;
      if (!target) throw new Error('filePath is required (MCP cannot open dialogs).');
      const database = getDb();
      try {
        database.walCheckpoint();
      } catch {
        /* best-effort */
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawDb = (database as any).db as { exec: (sql: string) => void };
      rawDb.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
      const { statSync } = await import('node:fs');
      return { filePath: target, bytesWritten: statSync(target).size };
    },

    'project-save-encrypted': async (input) => {
      const i = input as { filePath?: string; password?: string };
      if (!i.filePath) throw new Error('filePath is required.');
      if (!i.password) throw new Error('password is required.');
      const tmpPath = join(app.getPath('temp'), `freecrawl-enc-${Date.now()}.seoproject`);
      try {
        const database = getDb();
        try {
          database.walCheckpoint();
        } catch {
          /* best-effort */
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawDb = (database as any).db as { exec: (sql: string) => void };
        rawDb.exec(`VACUUM INTO '${tmpPath.replace(/'/g, "''")}'`);
        const { encryptFile } = await import('./project-encryption.js');
        const result = encryptFile(tmpPath, i.filePath, i.password);
        return { filePath: i.filePath, bytesWritten: result.bytesWritten };
      } finally {
        try {
          const { unlinkSync } = await import('node:fs');
          unlinkSync(tmpPath);
        } catch {
          /* best-effort tmp cleanup */
        }
      }
    },

    'project-open-encrypted': async (input) => {
      // Decrypt a .seoproject.enc to an explicit destination, then make it
      // the desktop's active project (this DOES switch the UI).
      const i = input as { filePath?: string; password?: string; destPath?: string };
      if (!i.filePath) throw new Error('filePath is required (source .seoproject.enc).');
      if (!i.password) throw new Error('password is required.');
      if (!i.destPath) throw new Error('destPath is required (output .seoproject path).');
      const { decryptFile } = await import('./project-encryption.js');
      decryptFile(i.filePath, i.destPath, i.password);
      openProjectAtPath(i.destPath);
      return { filePath: i.destPath };
    },
  };

  crawlController = {
    launchCrawl,
    stopCrawl: () => activeCrawler?.stop(),
    pauseCrawl: () => activeCrawler?.pause(),
    resumeCrawl: () => activeCrawler?.resume(),
    clearCrawl: () => clearCrawlDb(),
    actions: mcpActions,
  };

  // Shared between the renderer's IPC `crawl:clear` and the MCP bridge's
  // `POST /v1/crawl/clear` — keeps the two surfaces from drifting (e.g.
  // remembering to drop `pendingRecoveryCheckpoint` and fire
  // `dataChanged` in both places). Without this helper an MCP-driven
  // re-start after a completed crawl is a no-op because the crawler's
  // resume-vs-fresh decision keeps existing rows when the start URL
  // matches the previous one.
  async function clearCrawlDb(): Promise<void> {
    const t0 = Date.now();
    activeCrawler?.stop();
    activeCrawler = null;
    await disposeBrowserPool();
    const database = getDb();
    // Route reset() through the writer pool so it sits behind any
    // in-flight writeFetchedUrl RPCs in the worker's FIFO. Without
    // this, the main process truncates the urls table while the
    // writer worker is still draining the last batch of per-URL
    // writes — those writes win the SQLite lock race and resurrect
    // ~19 rows in the table after Clear. Going through the pool
    // serialises naturally: every queued write completes, then reset
    // runs against an already-stopped crawler.
    if (dbWriterPool.isReady()) {
      try {
        await dbWriterPool.call('reset', []);
      } catch {
        // Worker terminated or RPC timed out — fall back to direct
        // reset rather than leaving the table half-cleared.
        database.reset();
      }
    } else {
      database.reset();
    }
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
    // Broadcast `dataChanged` so any open table / overview / detail
    // panel re-queries against the now-empty DB instead of showing
    // stale rows until the next refresh tick.
    fireDataChanged();
    logger.log('info', 'main', `Clear completed in ${Date.now() - t0} ms`);
  }

  ipcMain.handle(IPC.crawlClear, () => clearCrawlDb());

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
      // Honour the user-configured default save directory (Settings →
      // Storage). Falls back to the OS Documents folder when unset.
      loadPrefs();
      const baseDir = (() => {
        const raw = prefsCache['projectSaveDir'];
        if (typeof raw === 'string' && raw.trim().length > 0) return raw;
        return app.getPath('documents');
      })();
      const res = await dialog.showSaveDialog(win, {
        title: 'Save Project As…',
        defaultPath: join(baseDir, 'crawl.seoproject'),
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
        title: L().dlgProjectSavedTitle,
        message: `Snapshot written: ${(bytes / (1024 * 1024)).toFixed(1)} MB.`,
        detail: target,
        buttons: [L().btnOk],
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
          title: L().dlgOpenProjectTitle,
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
            L().dlgOpenProjectFailedTitle,
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

  // V1 #4 — Encrypted snapshot export. Flow:
  //   1. WAL checkpoint so the .seoproject file on disk is consistent.
  //   2. VACUUM INTO a tmp .seoproject to capture an atomic snapshot of
  //      the live DB without racing the writer worker.
  //   3. Ask the user for a destination .seoproject.enc path.
  //   4. AES-256-GCM encrypt the snapshot, write to dst, delete the tmp.
  ipcMain.handle(
    IPC.projectSaveEncrypted,
    async (
      _e,
      password: string,
    ): Promise<{ filePath: string; bytesWritten: number } | { error: string } | null> => {
      const win = mainWindow;
      if (!win) return null;
      if (typeof password !== 'string' || password.length === 0) {
        return { error: 'Password is required.' };
      }
      loadPrefs();
      const baseDir = (() => {
        const raw = prefsCache['projectSaveDir'];
        if (typeof raw === 'string' && raw.trim().length > 0) return raw;
        return app.getPath('documents');
      })();
      const res = await dialog.showSaveDialog(win, {
        title: 'Save Encrypted Snapshot…',
        defaultPath: join(baseDir, 'crawl.seoproject.enc'),
        filters: [
          { name: 'FreeCrawl Encrypted Project', extensions: ['enc', 'seoproject.enc'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      if (res.canceled || !res.filePath) return null;
      const target = res.filePath;

      const tmpPath = join(app.getPath('temp'), `freecrawl-enc-${Date.now()}.seoproject`);
      try {
        const database = getDb();
        try {
          database.walCheckpoint();
        } catch {
          /* checkpoint is best-effort; VACUUM INTO still snapshots consistently */
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawDb = (database as any).db as { exec: (sql: string) => void };
        const escaped = tmpPath.replace(/'/g, "''");
        rawDb.exec(`VACUUM INTO '${escaped}'`);

        const { encryptFile } = await import('./project-encryption.js');
        const result = encryptFile(tmpPath, target, password);

        await dialog.showMessageBox(win, {
          type: 'info',
          title: L().dlgEncSnapshotSavedTitle,
          message: `Encrypted snapshot written: ${(result.bytesWritten / (1024 * 1024)).toFixed(1)} MB.`,
          detail:
            `${target}\n\n` +
            'Keep the password safe — it cannot be recovered. Without it, the file is unreadable.',
          buttons: [L().btnOk],
          noLink: true,
        });
        return { filePath: target, bytesWritten: result.bytesWritten };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.log('warn', 'main', `projectSaveEncrypted failed: ${message}`);
        return { error: message };
      } finally {
        try {
          const { unlinkSync } = await import('node:fs');
          unlinkSync(tmpPath);
        } catch {
          /* best-effort tmp cleanup */
        }
      }
    },
  );

  ipcMain.handle(
    IPC.projectOpenEncrypted,
    async (
      _e,
      password: string,
    ): Promise<{ filePath: string } | { error: string } | null> => {
      const win = mainWindow;
      if (!win) return null;
      if (typeof password !== 'string' || password.length === 0) {
        return { error: 'Password is required.' };
      }
      const open = await dialog.showOpenDialog(win, {
        title: 'Open Encrypted Project…',
        properties: ['openFile'],
        filters: [
          { name: 'FreeCrawl Encrypted Project', extensions: ['enc', 'seoproject.enc'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      if (open.canceled || open.filePaths.length === 0) return null;
      const srcPath = open.filePaths[0]!;

      loadPrefs();
      const baseDir = (() => {
        const raw = prefsCache['projectSaveDir'];
        if (typeof raw === 'string' && raw.trim().length > 0) return raw;
        return app.getPath('documents');
      })();
      const save = await dialog.showSaveDialog(win, {
        title: L().dlgSaveDecryptedProjectTitle,
        defaultPath: join(baseDir, 'recovered.seoproject'),
        filters: [
          { name: 'FreeCrawl Project', extensions: ['seoproject'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      if (save.canceled || !save.filePath) return null;
      const dstPath = save.filePath;

      try {
        const { decryptFile } = await import('./project-encryption.js');
        decryptFile(srcPath, dstPath, password);
        openProjectAtPath(dstPath);
        return { filePath: dstPath };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.log('warn', 'main', `projectOpenEncrypted failed: ${message}`);
        return { error: message };
      }
    },
  );

  ipcMain.handle(IPC.confirmClear, async (): Promise<ConfirmClearResult> => {
    const win = mainWindow;
    if (!win) return { confirmed: false, skipNext: false };
    const L = getMenuLabels(getMenuLang());
    const res = await dialog.showMessageBox(win, {
      type: 'warning',
      buttons: [L.btnClear, L.btnCancel],
      defaultId: 1,
      cancelId: 1,
      title: L.clearCrawlData,
      message: L.dlgConfirmClearMsg,
      detail: L.dlgConfirmClearDetail,
      checkboxLabel: L.dlgDontAskAgain,
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
    const L = getMenuLabels(getMenuLang());

    const template: MenuItemConstructorOptions[] = [
      {
        label: L.ctxCopy,
        click: () => clipboard.writeText(input.url),
      },
      {
        label: L.ctxOpenInBrowser,
        click: () => {
          if (isSafeExternalUrl(input.url)) void shell.openExternal(input.url);
        },
      },
      { type: 'separator' },
      {
        label: L.ctxRespider,
        enabled: canRecrawl,
        toolTip: canRecrawl ? undefined : L.ctxStartCrawlFirst,
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
        label: L.ctxRemove,
        click: () => {
          getDb().deleteUrl(input.urlId);
          fireDataChanged();
        },
      },
      { type: 'separator' },
      {
        label: L.ctxOpenRobotsTxt,
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
      const L = getMenuLabels(getMenuLang());

      const template: MenuItemConstructorOptions[] = [
        {
          label: L.ctxCopyNUrls.replace('{n}', n),
          click: () => clipboard.writeText(urls.join('\n')),
        },
        {
          label: L.ctxOpenNUrlsInBrowser.replace('{n}', n),
          // Guard: opening hundreds of tabs at once is a bad default.
          enabled: urls.length <= 20,
          toolTip: urls.length > 20 ? L.ctxOpenLimitTooltip : undefined,
          click: () => {
            for (const u of urls) if (isSafeExternalUrl(u)) void shell.openExternal(u);
          },
        },
        { type: 'separator' },
        {
          label: L.ctxRespiderNUrls.replace('{n}', n),
          enabled: canRecrawl,
          toolTip: canRecrawl ? undefined : L.ctxStartCrawlFirst,
          click: () => {
            db.markUrlsForRecrawl(ids);
            if (activeCrawler) {
              for (const u of urls) activeCrawler.requeueUrl(u);
            }
            fireDataChanged();
          },
        },
        {
          label: L.ctxRemoveNUrls.replace('{n}', n),
          click: () => {
            db.deleteUrls(ids);
            fireDataChanged();
          },
        },
        { type: 'separator' },
        {
          label: L.ctxExportNUrlsAsCsv.replace('{n}', n),
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
        return {
          body: null,
          bodyLength: 0,
          truncated: false,
          capturedAt: null,
          renderedBody: null,
          renderedBodyLength: null,
          renderMs: null,
          screenshotFullpagePath: null,
          screenshotFoldPath: null,
          screenshotMobilePath: null,
        };
      }
      return {
        body: r.body,
        bodyLength: r.bodyLength,
        truncated: r.truncated,
        capturedAt: r.capturedAt,
        renderedBody: r.renderedBody,
        renderedBodyLength: r.renderedBodyLength,
        renderMs: r.renderMs,
        screenshotFullpagePath: r.screenshotFullpagePath,
        screenshotFoldPath: r.screenshotFoldPath,
        screenshotMobilePath: r.screenshotMobilePath,
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

  ipcMain.handle(IPC.urlClusterMembers, (_e, urlId: number) =>
    getDb().urlClusterMembers(urlId),
  );

  ipcMain.handle(
    IPC.duplicateClustersList,
    (_e, input: { offset: number; limit: number }) =>
      getDb().listDuplicateClusters(input.offset, input.limit),
  );

  ipcMain.handle(IPC.duplicateClustersCount, () =>
    getDb().countDuplicateClusterMembers(),
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
          chainLength: null,
          chainSubjects: null,
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
    IPC.exportBrokenLinks,
    async (
      _e,
      input: ExportBrokenLinksInput,
    ): Promise<ExportBrokenLinksResult> => {
      let filePath = input.filePath;
      if (!filePath) {
        const res = await dialog.showSaveDialog(mainWindow!, {
          defaultPath: 'freecrawl-broken-links.csv',
          filters: [{ name: 'CSV', extensions: ['csv'] }],
        });
        if (res.canceled || !res.filePath) {
          return { filePath: '', rowsWritten: 0 };
        }
        filePath = res.filePath;
      }
      const { rowsWritten } = await exportBrokenLinksToCsv(getDb(), filePath, {
        internal: input.internal,
      });
      return { filePath, rowsWritten };
    },
  );

  ipcMain.handle(
    IPC.exportImages,
    async (
      _e,
      input: ExportImagesInput,
    ): Promise<ExportImagesResult> => {
      let filePath = input.filePath;
      if (!filePath) {
        const res = await dialog.showSaveDialog(mainWindow!, {
          defaultPath: 'freecrawl-images.csv',
          filters: [{ name: 'CSV', extensions: ['csv'] }],
        });
        if (res.canceled || !res.filePath) {
          return { filePath: '', rowsWritten: 0 };
        }
        filePath = res.filePath;
      }
      const { rowsWritten } = await exportImagesToCsv(getDb(), filePath, {
        missingAltOnly: input.missingAltOnly,
        search: input.search,
      });
      return { filePath, rowsWritten };
    },
  );

  ipcMain.handle(
    IPC.exportTabular,
    async (_e, input: ExportTabularInput): Promise<ExportTabularResult> => {
      const { format, sections, columns, selectedIds, csvBom } = input;
      let outputPath = input.filePath ?? '';
      const isSelection = (selectedIds?.length ?? 0) > 0;
      const multiSection = sections.length > 1;
      // Hierarchical export (any section with a subdir) always lands in
      // a folder root so the tree can be reconstructed under it.
      const hasSubdirs = sections.some((s) => !!s.subdir);
      const needsFolder = format !== 'xlsx' && (multiSection || hasSubdirs);
      if (!outputPath) {
        if (needsFolder) {
          const res = await dialog.showOpenDialog(mainWindow!, {
            properties: ['openDirectory', 'createDirectory'],
            title: `Choose folder for ${format.toUpperCase()} export`,
          });
          if (res.canceled || res.filePaths.length === 0) {
            return { filePath: '', files: [], rowsWritten: 0 };
          }
          outputPath = res.filePaths[0]!;
        } else {
          const ext = format;
          const filterName =
            format === 'xlsx'
              ? 'Excel Workbook'
              : format === 'csv'
                ? 'CSV (UTF-8)'
                : format === 'json'
                  ? 'JSON'
                  : 'XML';
          const baseName = isSelection ? 'freecrawl-selected' : 'freecrawl-export';
          const res = await dialog.showSaveDialog(mainWindow!, {
            defaultPath: `${baseName}.${ext}`,
            filters: [{ name: filterName, extensions: [ext] }],
          });
          if (res.canceled || !res.filePath) {
            return { filePath: '', files: [], rowsWritten: 0 };
          }
          outputPath = res.filePath;
        }
      }
      const result = await exportTabular(getDb(), outputPath, {
        format,
        sections,
        columns,
        selectedIds,
        csvBom,
      });
      return result;
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
        recomputeIssues: recomputeIssuesViaPool,
        runDbPass: runDbPassViaPool,
        dbCall: dbCallViaPool,
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
      title: L().dlgBulkExportFolderTitle,
      properties: ['openDirectory', 'createDirectory'],
    });
    if (dirRes.canceled || dirRes.filePaths.length === 0) {
      return { outputDir: '', files: [], errors: [] };
    }
    const outputDir = dirRes.filePaths[0]!;
    // Task list + per-category writing live in @freecrawl/core's runBulkExport
    // so the desktop handler and the MCP `export_bulk` action stay in sync.
    const { files, errors } = await runBulkExport(getDb(), outputDir);
    if (mainWindow) {
      const totalRows = files.reduce((s, f) => s + f.rowsWritten, 0);
      await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: L().dlgBulkExportCompleteTitle,
        message: `${files.length} file(s) written, ${totalRows.toLocaleString()} row(s) total.`,
        detail:
          outputDir +
          (errors.length > 0
            ? `\n\nErrors:\n${errors.map((e) => `• ${e.label}: ${e.error}`).join('\n')}`
            : ''),
        buttons: [L().btnOk, L().btnOpenFolder],
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
          title: L().dlgHtmlReportSavedTitle,
          message: `Report written: ${(result.bytesWritten / 1024).toFixed(1)} KB.`,
          detail: result.filePath,
          buttons: [L().btnOk],
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
          title: L().dlgSitemapGeneratedTitle,
          message: result.sharded
            ? `Sharded sitemap written: ${result.urlsWritten.toLocaleString()} URLs across ${
                result.files.length - 1
              } parts + index.`
            : `Sitemap written with ${result.urlsWritten.toLocaleString()} URLs${
                result.truncated ? ' (truncated at the 50,000 limit).' : '.'
              }`,
          detail,
          buttons: [L().btnOk],
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
    IPC.crawlPath,
    (_e, input: CrawlPathInput): CrawlPathResult => {
      return getDb().crawlPath(input.urlId);
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
  app.on('second-instance', (_e, argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
    // V1 Faz 8 — File association on Windows/Linux. A double-click on
    // a `.seoproject` while the app is already running spawns a second
    // process whose `argv` carries the path; this handler opens it in
    // the existing window.
    const path = pickProjectPathFromArgv(argv);
    if (path) {
      try {
        openProjectAtPath(path);
      } catch (err) {
        logger.log(
          'warn',
          'main',
          `Open project from second-instance argv failed: ${(err as Error).message}`,
        );
      }
    }
  });
}

// V1 Faz 8 — macOS file-association entry point. `open-file` fires
// before `whenReady` on cold-start double-clicks, so we stash the path
// and replay it after the main window is created.
let pendingOpenFilePath: string | null = null;
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow) {
    try {
      openProjectAtPath(filePath);
    } catch (err) {
      logger.log('warn', 'main', `Open project from open-file event failed: ${(err as Error).message}`);
    }
  } else {
    pendingOpenFilePath = filePath;
  }
});

/**
 * Extract a `.seoproject` (or .sqlite / .db) path from a process argv
 * array. Returns null when nothing usable was passed (the common
 * desktop-shortcut launch). The first matching path wins.
 */
function pickProjectPathFromArgv(argv: readonly string[]): string | null {
  for (const a of argv) {
    if (typeof a !== 'string') continue;
    if (a.startsWith('-')) continue;
    if (/\.(seoproject|sqlite|db)$/i.test(a) && existsSync(a)) return a;
  }
  return null;
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

// V2 Faz 1 — Production builds may ship the Playwright browser cache
// inside the installer (when `BUNDLE_PLAYWRIGHT=1` is set at build
// time, see apps/desktop/scripts/prepare-playwright-bundle.mjs).
// Playwright reads PLAYWRIGHT_BROWSERS_PATH at module load, so we
// must set it BEFORE the BrowserPool import gets touched. Setting it
// to a path that doesn't exist is harmless — Playwright simply falls
// back to its default cache lookup.
//
// Must run before `app.whenReady()` so subsequent `import('playwright')`
// calls inherit the env. `process.resourcesPath` is undefined in dev
// (`electron-vite dev`) so the bundled-browser branch is production-only.
try {
  if (
    app.isPackaged &&
    typeof process.resourcesPath === 'string' &&
    process.resourcesPath
  ) {
    const bundled = join(process.resourcesPath, 'playwright-browsers');
    if (existsSync(bundled)) {
      process.env.PLAYWRIGHT_BROWSERS_PATH = bundled;
    }
  }
} catch {
  /* fall through to default Playwright lookup */
}

void app.whenReady().then(async () => {
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

  // Open the localhost MCP bridge so Claude Code / Claude Desktop can
  // drive crawls + poll progress against this running instance. Bind
  // failure is logged but non-fatal: the desktop app keeps working,
  // only MCP-driven crawl control is disabled.
  try {
    const bridge = await startMcpBridge({
      userDataDir: app.getPath('userData'),
      startCrawl: async (input: McpStartCrawlInput) => {
        if (!crawlController) {
          return { ok: false as const, error: 'IPC handlers not registered yet — try again in a moment.' };
        }
        // Layer the supplied overrides on top of the last-used config
        // (so a `start_crawl` with just a `startUrl` keeps the user's
        // saved scope/threads/RPS). Fall back to factory defaults when
        // there is no saved config.
        const base: CrawlConfig =
          lastCrawlConfig !== null ? lastCrawlConfig : { ...DEFAULT_CRAWL_CONFIG };
        const overrides = input.configOverrides ?? {};
        const resolved: CrawlConfig = {
          ...base,
          ...overrides,
          startUrl: (input.startUrl ?? base.startUrl ?? '').trim(),
        };
        if (!resolved.startUrl) {
          return {
            ok: false as const,
            error: 'startUrl is empty — pass it in the request or run a crawl from the desktop UI at least once so the bridge has a saved default.',
          };
        }
        await crawlController.launchCrawl(resolved);
        return { ok: true as const, config: resolved };
      },
      stopCrawl: () => crawlController?.stopCrawl(),
      pauseCrawl: () => crawlController?.pauseCrawl(),
      resumeCrawl: () => crawlController?.resumeCrawl(),
      clearCrawl: async () => {
        if (crawlController) await crawlController.clearCrawl();
      },
      // Lazy lookup — crawlController is set inside the IPC registration
      // scope (which runs before the bridge starts), but using a getter
      // here keeps the wire-up symmetric with the other deps and avoids
      // a "TDZ between registerIpc() and startMcpBridge()" footgun.
      actions: new Proxy({}, {
        get: (_t, name) => {
          if (typeof name !== 'string') return undefined;
          return crawlController?.actions[name];
        },
        has: (_t, name) =>
          typeof name === 'string' && crawlController?.actions[name] !== undefined,
      }) as Record<string, (input: unknown) => Promise<unknown>>,
      getProgress: () => latestProgress,
      getProjectPath: () => currentProjectPath || null,
      getUrlCount: () => {
        try {
          return getDb().countUrls();
        } catch {
          return 0;
        }
      },
      log: (level, msg) => logger.log(level, 'mcp-bridge', msg),
    });
    if (bridge) {
      logger.log(
        'info',
        'mcp-bridge',
        `MCP bridge ready on 127.0.0.1:${bridge.port}. Discovery file written to userData/mcp-bridge.json.`,
      );
    }
  } catch (err) {
    logger.log(
      'warn',
      'mcp-bridge',
      `MCP bridge failed to start: ${err instanceof Error ? err.message : String(err)} — MCP crawl control disabled this session.`,
    );
  }

  // One-shot silent update check 8 s after launch. Ignores network /
  // up-to-date outcomes (no popup), only opens the Update Available
  // dialog when there is a newer release that hasn't been dismissed.
  // The 8 s delay lets the renderer finish first paint so the prompt
  // doesn't compete with the loading UI.
  setTimeout(() => {
    void checkForUpdates({ silent: true });
  }, 8_000);

  // V1 Faz 6 — start the in-app crawl scheduler. The tick is a no-op
  // until the user configures a schedule via the Scheduled Crawl
  // dialog, so it's safe to leave running for the lifetime of the app.
  startScheduler();

  // V1 Faz 8 — Cold-start file association. On Windows/Linux the OS
  // appends the double-clicked file path to argv; on macOS it arrived
  // via the `open-file` event before this point and is parked in
  // `pendingOpenFilePath`. Either way, open it now that the window and
  // DB layer are ready.
  const coldStartPath =
    pendingOpenFilePath ?? pickProjectPathFromArgv(process.argv);
  pendingOpenFilePath = null;
  if (coldStartPath) {
    try {
      openProjectAtPath(coldStartPath);
    } catch (err) {
      logger.log(
        'warn',
        'main',
        `Open project from cold-start argv failed: ${(err as Error).message}`,
      );
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Full teardown — DB, worker pools, watchdog, MCP bridge, prefs flush.
// This lives in `before-quit`, NOT `window-all-closed`: on macOS the app
// stays resident after its window closes (standard platform behaviour),
// and terminating the worker pools there would make a later reopen from
// the dock throw `cannot init after terminate()`. Runs exactly once.
let shutdownComplete = false;
function performShutdown(): void {
  if (shutdownComplete) return;
  shutdownComplete = true;
  // Close ancillary popup windows first so their renderers can flush
  // any in-flight IPC before the worker pools shut down.
  if (visualizationWindow && !visualizationWindow.isDestroyed()) {
    try {
      visualizationWindow.close();
    } catch {
      /* ignore */
    }
    visualizationWindow = null;
  }
  if (logAnalyzerWindow && !logAnalyzerWindow.isDestroyed()) {
    try {
      logAnalyzerWindow.close();
    } catch {
      /* ignore */
    }
    logAnalyzerWindow = null;
  }
  activeCrawler?.stop();
  // V2 Faz 1 — Tear down Playwright before worker pools so a hung
  // Chromium process can't keep the app alive after the renderer
  // window closes.
  if (activeBrowserPool) {
    const pool = activeBrowserPool;
    activeBrowserPool = null;
    void pool.close().catch(() => {});
  }
  stopScheduler();
  // Tear down the MCP bridge first so any in-flight HTTP calls fail
  // fast rather than racing with the DB shutdown that follows.
  try {
    stopMcpBridge();
  } catch {
    /* best-effort */
  }
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
}

app.on('before-quit', () => {
  performShutdown();
});

app.on('window-all-closed', () => {
  // Stop any active crawl when the UI goes away, but keep the DB and
  // worker pools alive so macOS reopen-from-dock works. The full
  // teardown happens in `before-quit`.
  activeCrawler?.stop();
  if (process.platform !== 'darwin') app.quit();
});
