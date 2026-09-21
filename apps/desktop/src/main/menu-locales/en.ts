/**
 * English native menu / tray / dialog labels.
 *
 * See `../menu-i18n.ts` for why the main process keeps its own copy of
 * these strings instead of importing the renderer's locale JSON.
 */
import type { MenuLabels } from '../menu-i18n.js';

export const MENU_EN: MenuLabels = {
  file: 'File',
  newProject: 'New Project',
  openProject: 'Open Project…',
  newProjectWindow: 'New Project Window',
  openRecent: 'Open Recent',
  manageProjects: 'Manage Projects…',
  clearRecent: 'Clear Recent',
  emptyRecent: '(empty)',
  clearCrawlData: 'Clear Crawl Data',
  exportAs: 'Export Crawl Data…',
  generateSitemap: 'Generate XML Sitemap',
  sitemapStandard: 'Standard…',
  sitemapImages: 'Images…',
  sitemapHreflang: 'Hreflang…',
  sitemapNews: 'News…',
  sitemapVideo: 'Video…',
  exportHtmlReport: 'Export HTML Report…',
  exportPdfReport: 'Export PDF Report…',
  exportSeoAudit: 'Export SEO Audit (Screaming Frog layout)…',
  bulkExport: 'Bulk Export…',
  exportSheets: 'Export to Google Sheets…',
  exportBigquery: 'Export to BigQuery…',
  compareWith: 'Compare With Project…',
  scheduledCrawl: 'Scheduled Crawl…',
  scheduledCrawlTooltip:
    'Set up an in-app recurring crawl for the currently-open project. Fires only while FreeCrawl is open; use the CLI + OS scheduler for triggers that survive restarts.',
  saveProject: 'Save Project',
  saveProjectAs: 'Save Project As…',
  titleUntitledProject: 'Untitled project',
  titleSaving: 'Saving…',
  dlgSaveProjectAsTitle: 'Save Project As…',
  dlgExportTableTitle: 'Export Table',
  dlgSaveFailedTitle: 'Could Not Save Project',
  msgProjectSaved: 'Saved as a single compressed file: {size} MB (from {from} MB).',
  dlgUnsavedTitle: 'Unsaved Changes',
  msgUnsavedChanges: 'This project has changes that are not saved yet.',
  detailUnsavedChanges:
    'Crawl results live in a working copy until you save them into the project file.',
  btnSaveChanges: 'Save',
  btnDiscardChanges: "Don't Save",
  saveProjectEncrypted: 'Save Encrypted Snapshot…',
  saveProjectEncryptedTooltip:
    'Export the active project to an AES-256-GCM-encrypted .seoproject.enc file protected by a password.',
  openProjectEncrypted: 'Open Encrypted Project…',
  openProjectEncryptedTooltip:
    'Decrypt a .seoproject.enc snapshot with its password and open the recovered project.',
  settings: 'Settings…',
  edit: 'Edit',
  copy: 'Copy',
  view: 'View',
  overviewSidebar: 'Overview Sidebar',
  detailPanel: 'Detail Panel',
  fullscreen: 'Fullscreen',
  theme: 'Theme',
  themeDark: 'Dark',
  themeLight: 'Light',
  visualization: 'Visualization',
  openVisualizationWindow: 'Open Visualization Window…',
  reports: 'Reports',
  reportsItem: 'Reports…',
  logAnalyzer: 'Log Analyzer',
  openLogAnalyzerWindow: 'Open Log Analyzer Window…',
  openLogAnalyzerWindowTooltip:
    'Analyze server access logs (Apache / Nginx / IIS) — bot hits per URL, crawl budget, and crawl × log orphan detection in a standalone window.',
  help: 'Help',
  documentation: 'Documentation',
  showLogs: 'Show Logs…',
  trayShow: 'Show FreeCrawl',
  trayHide: 'Hide to Tray',
  trayStopCrawl: 'Stop Crawl',
  trayQuit: 'Quit FreeCrawl',
  openLogsFolder: 'Open Logs Folder',
  openLogsFolderTooltip:
    'Open the directory where rotated log files are persisted on disk',
  robotsTester: 'Robots.txt Tester…',
  sitemapValidator: 'Sitemap Validator…',
  resetDiagnostics: 'Reset Diagnostic Warnings',
  resetDiagnosticsTooltip:
    'Re-enable popup warnings you previously dismissed with "Don\'t show again"',
  deleteDomainData: 'Delete Domain Data…',
  deleteDomainDataTooltip:
    'GDPR-aligned per-domain wipe. Removes every URL row whose host matches the entered domain plus every dependent record (links, headers, images, source snapshots).',
  clearAllData: 'Clear All Data…',
  clearAllDataTooltip:
    'Wipe the entire active project (URLs, links, images, headers, source snapshots, sitemaps). Cannot be undone — Save Project As… first if you want a backup.',
  checkForUpdates: 'Check for Updates…',
  checkForUpdatesTooltip:
    'Fetch the latest GitHub release and compare it with your installed version. No background polling — runs only when you click.',
  about: 'About FreeCrawl SEO',

  ctxCopy: 'Copy',
  ctxOpenInBrowser: 'Open in Browser',
  ctxRespider: 'Re-Spider',
  ctxStartCrawlFirst: 'Start a crawl first',
  ctxRemove: 'Remove',
  ctxOpenRobotsTxt: 'Open robots.txt',
  ctxCopyNUrls: 'Copy {n} URLs',
  ctxOpenNUrlsInBrowser: 'Open {n} URLs in Browser',
  ctxOpenLimitTooltip: 'Limited to 20 URLs to avoid spawning too many tabs',
  ctxRespiderNUrls: 'Re-Spider {n} URLs',
  ctxRemoveNUrls: 'Remove {n} URLs',
  ctxExportNUrlsAsCsv: 'Export {n} URLs as CSV…',
  ctxCopyCell: 'Copy Cell',
  ctxCopyNCells: 'Copy {n} Cells',
  ctxCopyRow: 'Copy Row',
  ctxCopyNRows: 'Copy {n} Rows',
  ctxCopyColumn: 'Copy Column',
  ctxCopyNColumns: 'Copy {n} Columns',

  btnOk: 'OK',
  btnCancel: 'Cancel',
  btnClose: 'Close',
  btnClear: 'Clear',
  btnOpenFolder: 'Open Folder',
  btnLater: 'Later',
  btnOpenReleasePage: 'Open Release Page',
  btnOpenReleasesPage: 'Open Releases Page',
  btnDownloadInstaller: 'Download Installer',
  btnDownloadNow: 'Download now',
  btnSkipJsRender: 'Skip — disable JS render for this run',

  dlgOpenProjectTitle: 'Open Project',
  dlgOpenProjectFailedTitle: 'Open Project Failed',
  dlgLogsFolderUnavailableTitle: 'Logs Folder Unavailable',
  dlgLogsFolderUnavailableMsg:
    'Disk logging has not been initialised. Logs are kept in memory only for this session.',
  dlgDiagResetTitle: 'Diagnostic Warnings Reset',
  dlgDiagResetNoneMsg: 'No suppressed diagnostic warnings to reset.',
  dlgDownloadCompleteTitle: 'Download Complete',
  dlgDownloadFailedTitle: 'Download Failed',
  dlgDownloadStartFailedMsg: 'Could not start the download.',
  dlgUpdateCheckFailedTitle: 'Update Check Failed',
  dlgUpdateCheckFailedMsg: "Couldn't reach the GitHub Releases API.",
  dlgUpToDateTitle: 'Up to Date',
  dlgUpdateAvailableTitle: 'Update Available',
  dlgOpenAccessLogTitle: 'Open Access Log',
  dlgExportLogAnalysisTitle: 'Export Log Analysis',
  dlgExportExtractionRulesTitle: 'Export Extraction Rules',
  dlgImportExtractionRulesTitle: 'Import Extraction Rules',
  dlgExportSettingsTitle: 'Export Settings',
  dlgImportSettingsTitle: 'Import Settings',
  dlgImportFailedTitle: 'Import Failed',
  dlgImportFailedNoSettingsMsg: 'Imported file does not contain a settings object.',
  dlgChooseFolderTitle: 'Choose Folder',
  dlgPlaywrightTitle: 'JavaScript Rendering — Browser Missing',
  dlgPlaywrightMsg:
    'Playwright needs to download a Chromium browser before JavaScript rendering can run.',
  dlgBrowserInstallFailedTitle: 'Browser Install Failed',
  dlgProjectSavedTitle: 'Project Saved',
  dlgEncSnapshotSavedTitle: 'Encrypted Snapshot Saved',
  dlgSaveDecryptedProjectTitle: 'Save Decrypted Project As…',
  dlgBulkExportFolderTitle: 'Bulk Export — choose output folder',
  dlgBulkExportCompleteTitle: 'Bulk Export Complete',
  dlgHtmlReportSavedTitle: 'HTML Report Saved',
  dlgPdfReportSavedTitle: 'PDF Report Saved',
  dlgSeoAuditFolderTitle: 'Choose a folder for the SEO Audit export',
  dlgSeoAuditCompleteTitle: 'SEO Audit Export Complete',
  dlgPickLogoTitle: 'Choose a report logo',
  msgLogoTooLarge: 'The logo must be 1 MB or smaller.',
  dlgSitemapGeneratedTitle: 'Sitemap Generated',

  diagDnsRefusedTitle: 'No Network Connectivity',
  diagDnsRefusedMsg:
    'FreeCrawl tried 3 layers of DNS lookup (system, public servers on port 53, and DNS-over-HTTPS on port 443) — every one was refused. Your machine appears to have no working internet connection.',
  diagDnsRefusedDetail:
    'FreeCrawl already attempts to bypass broken system DNS automatically — if you see this dialog, even DNS-over-HTTPS over port 443 failed.\n\n' +
    'Most likely causes (in order):\n' +
    '  1. Antivirus / endpoint security is blocking FreeCrawl from making ANY outbound connection. Whitelist FreeCrawl in your security software.\n' +
    '  2. You are not connected to the internet — check Wi-Fi / Ethernet.\n' +
    '  3. A corporate firewall is blocking all outbound traffic — set HTTPS_PROXY in Settings → Network.\n' +
    '  4. Active VPN is in a broken state — disconnect and try again.\n\n' +
    'Click "Open Logs" to see the full error chain.',
  diagDnsDestroyedTitle: 'Network Stack Unresponsive',
  diagDnsDestroyedMsg:
    "Your system's DNS resolver crashed AND FreeCrawl's automatic DNS-over-HTTPS bypass also failed. This means the network stack is in a broken state — not just DNS.",
  diagDnsDestroyedDetail:
    'FreeCrawl normally recovers from a crashed Windows DNS Client by routing lookups through Cloudflare/Google over HTTPS:443. If you are seeing this dialog, that fallback also failed — usually because the operating-system network stack itself needs a reset.\n\n' +
    'Try one of these (in order of effort):\n' +
    '  1. Toggle airplane mode / disconnect & reconnect Wi-Fi.\n' +
    '  2. Restart the network adapter (Settings → Network → Change adapter options).\n' +
    '  3. Open "services.msc", find "DNS Client", right-click → Restart (Windows only).\n' +
    '  4. As a last resort, restart the computer.\n\n' +
    'Click "Open Logs" to see the full error chain.',
  diagTlsTitle: 'TLS Certificate Rejected',
  diagTlsMsg:
    'A TLS certificate failed verification — usually because antivirus or a corporate proxy is intercepting HTTPS.',
  diagTlsDetail:
    'Common culprits: Kaspersky, ESET, Bitdefender, Zscaler, BlueCoat, Fortigate.\n\n' +
    'Try one of these:\n' +
    '  1. Whitelist FreeCrawl in your antivirus.\n' +
    '  2. Export the antivirus / proxy root CA as PEM and set the NODE_EXTRA_CA_CERTS environment variable to it before launching.\n' +
    '  3. Temporarily disable HTTPS scanning in your antivirus.\n\n' +
    'Click "Open Logs" to see the full error chain.',
  diagSeedTitle: 'Start URL Unreachable',
  diagSeedMsg:
    'FreeCrawl could not reach the URL you entered — neither HTTPS nor HTTP responded within 5 seconds.',
  diagSeedDetail:
    'Try one of these:\n' +
    '  1. Open the URL in a browser to confirm the site is up.\n' +
    '  2. Check your internet connection.\n' +
    '  3. If you are on a VPN or behind a corporate proxy, set HTTPS_PROXY before launching, or configure Settings → Network → Proxy URL.\n' +
    '  4. Verify the URL is spelled correctly (typos in the host).\n\n' +
    'Click "Open Logs" for the diagnostic trail.',
  btnOpenLogs: 'Open Logs',
  btnDismiss: 'Dismiss',
  dlgDontShowAgain: "Don't show this again",

  msgDownloadComplete: '{name} downloaded.',
  detailDownloadSaved:
    'Saved to:\n{path}\n\nThe Downloads folder has been opened — double-click the installer to upgrade.',
  detailDownloadSmartScreen:
    'Windows SmartScreen may show "Unrecognized app" because the installer is not code-signed. Click "More info → Run anyway" to proceed.',
  detailDownloadGatekeeper:
    'macOS Gatekeeper may block the app on first open because it is not notarised. Right-click the .dmg → Open to bypass.',
  msgDownloadFailed: 'Could not download {name}',
  detailDownloadFailed:
    'Download state: {state}\n\nYou can retry from the GitHub Releases page.',
  msgUnknownErrorGitHub: 'Unknown error contacting GitHub',
  msgNoReleaseTag: 'No release tag in response.',
  detailBrowseReleases: 'You can browse releases manually at:\n{url}',
  msgUpToDate: "You're on the latest version (v{version}).",
  detailLatestRelease: 'Latest GitHub release: {tag}',
  detailPublished: 'Published: {date}',
  msgUpdateAvailable: '{version} is available.',
  detailInstalledLatest: 'Installed: v{installed}\nLatest:    {latest}',
  detailReleaseNotes: 'Release notes:',
  detailSeeReleasePage: 'See the release page for the changelog.',
  dlgDontShowVersionAgain: "Don't show this version again",

  winLogsTitle: 'FreeCrawl — Logs ({label})',
  winLabelPrimary: 'Primary',
  winVisualizationTitle: 'FreeCrawl — Visualization',
  winLogAnalyzerTitle: 'FreeCrawl — Log Analyzer',

  dlgPlaywrightDetail:
    'This is a one-time ~250 MB download that runs inside the app — no terminal needed. The browser is stored in your user folder; only the binary is downloaded, from cdn.playwright.dev.\n\nDownload now?',
  msgBrowserInstallFailed:
    'The Chromium download could not be completed.\n\n' +
    'Check your internet connection (or proxy settings) and start the crawl again — ' +
    'FreeCrawl will retry the download automatically. JavaScript rendering stays ' +
    'disabled until it succeeds; text-mode crawling is unaffected.',

  notifCrawlFinished: 'Crawl finished: {urls} URLs · avg {ms} ms',

  dlgSaveEncSnapshotTitle: 'Save Encrypted Snapshot…',
  msgEncSnapshotWritten: 'Encrypted snapshot written: {size} MB.',
  detailEncSnapshotKeepPassword:
    'Keep the password safe — it cannot be recovered. Without it, the file is unreadable.',
  dlgOpenEncProjectTitle: 'Open Encrypted Project…',

  dlgChooseExportFolderTitle: 'Choose folder for {format} export',
  msgBulkExportWritten: 'Files written: {files}. Rows in total: {rows}.',
  detailBulkExportErrors: 'Errors:',
  msgHtmlReportWritten: 'Report written: {size} KB.',
  msgPdfReportWritten: 'PDF written: {size} KB.',
  msgSeoAuditWritten: '{files} files written ({rows} rows).',
  dlgCompareWithProjectTitle: 'Compare With Project…',
  msgSitemapSharded:
    'Sharded sitemap written: {urls} URLs across {parts} parts + index.',
  msgSitemapWritten: 'Sitemap written with {urls} URLs.',
  msgSitemapWrittenTruncated:
    'Sitemap written with {urls} URLs (truncated at the 50,000 limit).',
  detailSitemapParts: 'Part files: {parts}, plus index',

  msgCouldNotOpenPath: 'Could not open {path}.',
  msgCouldNotOpenSelected: 'Could not open the selected file.',
  msgImportCannotParseJson: 'Cannot parse JSON: {error}',
  msgDiagResetDone:
    'Warnings re-enabled: {n}. They will pop up again the next time the underlying issue occurs.',

  filterFreeCrawlProject: 'FreeCrawl Project',
  filterFreeCrawlEncProject: 'FreeCrawl Encrypted Project',
  filterAllFiles: 'All Files',
  filterLogFiles: 'Log Files',
  filterExcelWorkbook: 'Excel Workbook',
  filterHtmlReport: 'HTML Report',
  filterPdfReport: 'PDF Report',
  filterImages: 'Images',
  filterXmlSitemap: 'XML Sitemap',
  filterGzXmlSitemap: 'Gzipped XML Sitemap',

  spellUndetermined:
    'Page language could not be determined — it declares no html[lang] and carries too little prose to detect.',
  spellUnsupported: '{lang} is not supported by this LanguageTool endpoint.',
  spellMismatchBailout:
    'LanguageTool stopped checking — the page does not read as {lang}. Pin the language under Settings → Spelling if this is wrong.',
  spellMismatchRatio:
    '{pct}% of words were flagged when checked as {lang} — the page is almost certainly written in another language, so the findings were discarded. Pin the language under Settings → Spelling if this is wrong.',
  spellTimeout: 'LanguageTool request timed out after {s}s',
  spellHttpError: 'LanguageTool returned HTTP {status}',

  dlgConfirmClearMsg: 'Clear all crawl data?',
  dlgConfirmClearDetail:
    'This permanently deletes every crawled URL, link, image, header and source snapshot in the active project. This cannot be undone.',
  dlgDontAskAgain: "Don't ask me again",
};
