/**
 * V1 Faz 8 Phase 2 — menu labels mirrored for main-process consumption.
 *
 * Why duplicate the strings instead of importing the renderer JSON?
 * The renderer locale files live under `src/renderer/src/i18n/locales/`
 * and electron-vite bundles them into the renderer chunk only. The main
 * process is its own bundle (no renderer dependencies), so we keep an
 * independent copy here, one file per locale under `./menu-locales/`.
 * Menu strings are ~137 entries; the duplication cost is tiny compared
 * with cross-bundle import plumbing.
 *
 * The language *list* and the tag resolver are NOT duplicated — they come
 * from `@freecrawl/shared-types`, which both bundles can import. That is
 * what keeps the main process and the renderer from disagreeing about
 * which locales exist or how `uiLanguage` resolves.
 *
 * When updating menu translations: edit the file under `./menu-locales/`
 * and the renderer's matching `locales/<code>.json` (under the `menu.*`
 * namespace) so the two surfaces stay in sync.
 */
import { isUiLanguage, type UiLanguage } from '@freecrawl/shared-types';
import { MENU_EN } from './menu-locales/en.js';
import { MENU_TR } from './menu-locales/tr.js';
import { MENU_AZ } from './menu-locales/az.js';
import { MENU_ZH_CN } from './menu-locales/zh-CN.js';
import { MENU_FR } from './menu-locales/fr.js';
import { MENU_HI } from './menu-locales/hi.js';
import { MENU_IT } from './menu-locales/it.js';
import { MENU_KO } from './menu-locales/ko.js';
import { MENU_PT_BR } from './menu-locales/pt-BR.js';
import { MENU_RU } from './menu-locales/ru.js';
import { MENU_ES } from './menu-locales/es.js';

/** Alias kept so `menu.ts` and `index.ts` read in menu terms. */
export type MenuLang = UiLanguage;

export interface MenuLabels {
  file: string;
  newProject: string;
  newProjectWindow: string;
  openProject: string;
  openRecent: string;
  clearRecent: string;
  emptyRecent: string;
  manageProjects: string;
  clearCrawlData: string;
  exportAs: string;
  generateSitemap: string;
  sitemapStandard: string;
  sitemapImages: string;
  sitemapHreflang: string;
  sitemapNews: string;
  sitemapVideo: string;
  exportHtmlReport: string;
  exportPdfReport: string;
  exportSeoAudit: string;
  bulkExport: string;
  exportSheets: string;
  exportBigquery: string;
  compareWith: string;
  scheduledCrawl: string;
  scheduledCrawlTooltip: string;
  saveProject: string;
  saveProjectAs: string;
  /** Window title shown before a project has been saved to disk. */
  titleUntitledProject: string;
  /** Window-title prefix while the project snapshot is being written. */
  titleSaving: string;
  dlgSaveProjectAsTitle: string;
  dlgExportTableTitle: string;
  dlgSaveFailedTitle: string;
  /** `{size}` = archive MB, `{from}` = uncompressed MB. */
  msgProjectSaved: string;
  dlgUnsavedTitle: string;
  msgUnsavedChanges: string;
  detailUnsavedChanges: string;
  btnSaveChanges: string;
  btnDiscardChanges: string;
  saveProjectEncrypted: string;
  saveProjectEncryptedTooltip: string;
  openProjectEncrypted: string;
  openProjectEncryptedTooltip: string;
  settings: string;
  edit: string;
  copy: string;
  view: string;
  overviewSidebar: string;
  detailPanel: string;
  fullscreen: string;
  /** View ▸ Theme submenu + its two radio items. */
  theme: string;
  themeDark: string;
  themeLight: string;
  visualization: string;
  openVisualizationWindow: string;
  reports: string;
  reportsItem: string;
  logAnalyzer: string;
  openLogAnalyzerWindow: string;
  openLogAnalyzerWindowTooltip: string;
  help: string;
  documentation: string;
  showLogs: string;
  trayShow: string;
  trayHide: string;
  trayStopCrawl: string;
  trayQuit: string;
  openLogsFolder: string;
  openLogsFolderTooltip: string;
  robotsTester: string;
  sitemapValidator: string;
  resetDiagnostics: string;
  resetDiagnosticsTooltip: string;
  deleteDomainData: string;
  deleteDomainDataTooltip: string;
  clearAllData: string;
  clearAllDataTooltip: string;
  checkForUpdates: string;
  checkForUpdatesTooltip: string;
  about: string;

  // ── Right-click context menus (URL table) ──
  ctxCopy: string;
  ctxOpenInBrowser: string;
  ctxRespider: string;
  ctxStartCrawlFirst: string;
  ctxRemove: string;
  ctxOpenRobotsTxt: string;
  /** `{n}` placeholder → selection count. */
  ctxCopyNUrls: string;
  ctxOpenNUrlsInBrowser: string;
  ctxOpenLimitTooltip: string;
  ctxRespiderNUrls: string;
  ctxRemoveNUrls: string;
  ctxExportNUrlsAsCsv: string;
  /** Selection-scoped copy items. `{n}` → cell / row / column count. */
  ctxCopyCell: string;
  ctxCopyNCells: string;
  ctxCopyRow: string;
  ctxCopyNRows: string;
  ctxCopyColumn: string;
  ctxCopyNColumns: string;

  // ── Recurring dialog buttons ──
  btnOk: string;
  btnCancel: string;
  btnClose: string;
  btnClear: string;
  btnOpenFolder: string;
  btnLater: string;
  btnOpenReleasePage: string;
  btnOpenReleasesPage: string;
  btnDownloadInstaller: string;
  btnDownloadNow: string;
  btnSkipJsRender: string;

  // ── Native dialog titles ──
  dlgOpenProjectTitle: string;
  dlgOpenProjectFailedTitle: string;
  dlgLogsFolderUnavailableTitle: string;
  dlgLogsFolderUnavailableMsg: string;
  dlgDiagResetTitle: string;
  dlgDiagResetNoneMsg: string;
  dlgDownloadCompleteTitle: string;
  dlgDownloadFailedTitle: string;
  dlgDownloadStartFailedMsg: string;
  dlgUpdateCheckFailedTitle: string;
  dlgUpdateCheckFailedMsg: string;
  dlgUpToDateTitle: string;
  dlgUpdateAvailableTitle: string;
  dlgOpenAccessLogTitle: string;
  dlgExportLogAnalysisTitle: string;
  dlgExportExtractionRulesTitle: string;
  dlgImportExtractionRulesTitle: string;
  dlgExportSettingsTitle: string;
  dlgImportSettingsTitle: string;
  dlgImportFailedTitle: string;
  dlgImportFailedNoSettingsMsg: string;
  dlgChooseFolderTitle: string;
  dlgPlaywrightTitle: string;
  dlgPlaywrightMsg: string;
  dlgBrowserInstallFailedTitle: string;
  dlgProjectSavedTitle: string;
  dlgEncSnapshotSavedTitle: string;
  dlgSaveDecryptedProjectTitle: string;
  dlgBulkExportFolderTitle: string;
  dlgBulkExportCompleteTitle: string;
  dlgHtmlReportSavedTitle: string;
  dlgPdfReportSavedTitle: string;
  dlgSeoAuditFolderTitle: string;
  dlgSeoAuditCompleteTitle: string;
  dlgPickLogoTitle: string;
  msgLogoTooLarge: string;
  dlgSitemapGeneratedTitle: string;

  // ── Environment diagnostic dialogs (crawl-time popups) ──
  /** Every `{n}` / `{name}` style placeholder below is substituted with
   *  `.replace()` at the call site. The main process has no i18next, so
   *  count-dependent sentences are written count-neutrally rather than
   *  pluralised — see the note on `msgDiagResetDone`. */
  diagDnsRefusedTitle: string;
  diagDnsRefusedMsg: string;
  diagDnsRefusedDetail: string;
  diagDnsDestroyedTitle: string;
  diagDnsDestroyedMsg: string;
  diagDnsDestroyedDetail: string;
  diagTlsTitle: string;
  diagTlsMsg: string;
  diagTlsDetail: string;
  diagSeedTitle: string;
  diagSeedMsg: string;
  diagSeedDetail: string;
  btnOpenLogs: string;
  btnDismiss: string;
  dlgDontShowAgain: string;

  // ── Update check / installer download ──
  /** `{name}` = asset file name. */
  msgDownloadComplete: string;
  /** `{path}` = save path. */
  detailDownloadSaved: string;
  detailDownloadSmartScreen: string;
  detailDownloadGatekeeper: string;
  /** `{name}` = asset file name. */
  msgDownloadFailed: string;
  /** `{state}` = Electron download state. */
  detailDownloadFailed: string;
  msgUnknownErrorGitHub: string;
  msgNoReleaseTag: string;
  /** `{url}` = releases page URL. */
  detailBrowseReleases: string;
  /** `{version}` = installed version. */
  msgUpToDate: string;
  /** `{tag}` = latest release tag. */
  detailLatestRelease: string;
  /** `{date}` = localised publish date. */
  detailPublished: string;
  /** `{version}` = latest release tag. */
  msgUpdateAvailable: string;
  /** `{installed}` / `{latest}` = version strings. */
  detailInstalledLatest: string;
  detailReleaseNotes: string;
  detailSeeReleasePage: string;
  dlgDontShowVersionAgain: string;

  // ── Secondary window titles ──
  /** `{label}` = project name, or `winLabelPrimary` / `titleUntitledProject`. */
  winLogsTitle: string;
  winLabelPrimary: string;
  winVisualizationTitle: string;
  winLogAnalyzerTitle: string;

  // ── Playwright / Chromium install ──
  dlgPlaywrightDetail: string;
  msgBrowserInstallFailed: string;

  // ── Crawl-finished desktop notification ──
  /** `{urls}` = grouped URL count, `{ms}` = average response time. */
  notifCrawlFinished: string;

  // ── Encrypted project snapshots ──
  dlgSaveEncSnapshotTitle: string;
  /** `{size}` = snapshot size in MB. */
  msgEncSnapshotWritten: string;
  detailEncSnapshotKeepPassword: string;
  dlgOpenEncProjectTitle: string;

  // ── Export / sitemap results ──
  /** `{format}` = upper-cased format name (CSV / JSON / …). */
  dlgChooseExportFolderTitle: string;
  /** `{files}` = file count, `{rows}` = grouped row count. */
  msgBulkExportWritten: string;
  detailBulkExportErrors: string;
  /** `{size}` = report size in KB. */
  msgHtmlReportWritten: string;
  /** `{size}` = report size in KB. */
  msgPdfReportWritten: string;
  /** `{files}` files, `{rows}` rows. */
  msgSeoAuditWritten: string;
  dlgCompareWithProjectTitle: string;
  /** `{urls}` = grouped URL count, `{parts}` = shard count. */
  msgSitemapSharded: string;
  /** `{urls}` = grouped URL count. */
  msgSitemapWritten: string;
  msgSitemapWrittenTruncated: string;
  /** `{parts}` = shard count. */
  detailSitemapParts: string;

  // ── Project open / import failures ──
  /** `{path}` = project path. */
  msgCouldNotOpenPath: string;
  msgCouldNotOpenSelected: string;
  /** `{error}` = parser message. */
  msgImportCannotParseJson: string;
  /** `{n}` = number of re-enabled warnings. Count-neutral on purpose: the
   *  main process has no plural engine, so the sentence must read correctly
   *  for every `n` in all 11 languages. */
  msgDiagResetDone: string;

  // ── Native file-dialog filter names ──
  /** Format tokens (`CSV`, `JSON`, `XML`) stay untranslated by policy —
   *  only the filters carrying prose are localised. */
  filterFreeCrawlProject: string;
  filterFreeCrawlEncProject: string;
  filterAllFiles: string;
  filterLogFiles: string;
  filterExcelWorkbook: string;
  filterHtmlReport: string;
  filterPdfReport: string;
  filterImages: string;
  filterXmlSitemap: string;
  filterGzXmlSitemap: string;

  // ── Spelling / page-language messages ──
  /** These are generated during a crawl and persisted to `spelling_results.
   *  error`, so a project carries the wording of whatever UI language was
   *  active when it was crawled; changing the language later does not
   *  rewrite stored rows. Accepted: the alternative is storing a reason
   *  code and re-rendering in the renderer, which is a schema change.
   *  `{lang}` is an English language name (`language-detect.ts` LANG_NAMES) —
   *  translating the ~70 names is deliberately out of scope. */
  spellUndetermined: string;
  /** `{lang}` = English language name. */
  spellUnsupported: string;
  /** `{lang}` = English language name. */
  spellMismatchBailout: string;
  /** `{pct}` = flagged-word percentage, `{lang}` = English language name. */
  spellMismatchRatio: string;
  /** `{s}` = timeout in seconds. */
  spellTimeout: string;
  /** `{status}` = HTTP status code. */
  spellHttpError: string;

  // ── Clear-crawl confirmation (migrated off inline isTr) ──
  dlgConfirmClearMsg: string;
  dlgConfirmClearDetail: string;
  dlgDontAskAgain: string;
}

const MENU_LABELS: Record<UiLanguage, MenuLabels> = {
  en: MENU_EN,
  tr: MENU_TR,
  az: MENU_AZ,
  'zh-CN': MENU_ZH_CN,
  fr: MENU_FR,
  hi: MENU_HI,
  it: MENU_IT,
  ko: MENU_KO,
  'pt-BR': MENU_PT_BR,
  ru: MENU_RU,
  es: MENU_ES,
};

export function getMenuLabels(lang: MenuLang): MenuLabels {
  return MENU_LABELS[lang] ?? MENU_EN;
}

/** Narrow a raw `uiLanguage` pref value. Delegates to the shared registry
 *  so main and renderer can't validate against different lists. */
export const isMenuLang = isUiLanguage;

/**
 * Active-language provider, installed by `index.ts` at startup.
 *
 * `getMenuLang()` reads the `uiLanguage` pref plus the OS preference
 * list, and both live in `index.ts`. Modules that produce user-facing
 * text without a menu (`languagetool.ts`, `language-detect.ts`) would
 * have to import `index.ts` to reach it — a cycle, since `index.ts`
 * imports them. Injecting the getter here instead lets every main-process
 * module call `L()` with no import cycle and no threaded parameter.
 *
 * Before `index.ts` installs the real provider the default returns
 * English, so an early call degrades to readable English rather than
 * throwing.
 */
let activeLangProvider: () => MenuLang = () => 'en';

export function setMenuLangProvider(fn: () => MenuLang): void {
  activeLangProvider = fn;
}

/** Localized menu/dialog labels for the active UI language. Lets native
 *  dialogs pull `L().dlgX` inline without threading a param through
 *  handlers. */
export function L(): MenuLabels {
  return getMenuLabels(activeLangProvider());
}
