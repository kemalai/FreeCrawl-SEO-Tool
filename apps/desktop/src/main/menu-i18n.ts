/**
 * V1 Faz 8 Phase 2 — menu labels mirrored for main-process consumption.
 *
 * Why duplicate the strings instead of importing the renderer JSON?
 * The renderer locale files live under `src/renderer/src/i18n/locales/`
 * and electron-vite bundles them into the renderer chunk only. The main
 * process is its own bundle (no renderer dependencies), so we keep an
 * independent copy here. Menu strings are < 40 entries; the duplication
 * cost is tiny compared with cross-bundle import plumbing.
 *
 * When updating menu translations: edit both this file and the
 * renderer's `en.json` / `tr.json` (under the `menu.*` namespace) so
 * the two surfaces stay in sync.
 */

export type MenuLang = 'en' | 'tr';

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
  dlgSitemapGeneratedTitle: string;

  // ── Clear-crawl confirmation (migrated off inline isTr) ──
  dlgConfirmClearMsg: string;
  dlgConfirmClearDetail: string;
  dlgDontAskAgain: string;
}

const MENU_EN: MenuLabels = {
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
  dlgSitemapGeneratedTitle: 'Sitemap Generated',

  dlgConfirmClearMsg: 'Clear all crawl data?',
  dlgConfirmClearDetail:
    'This permanently deletes every crawled URL, link, image, header and source snapshot in the active project. This cannot be undone.',
  dlgDontAskAgain: "Don't ask me again",
};

const MENU_TR: MenuLabels = {
  file: 'Dosya',
  newProject: 'Yeni Proje',
  openProject: 'Proje Aç…',
  newProjectWindow: 'Yeni Proje Penceresi',
  openRecent: 'Son Açılanlar',
  manageProjects: 'Projeleri Yönet…',
  clearRecent: 'Son Açılanları Temizle',
  emptyRecent: '(boş)',
  clearCrawlData: 'Crawl Verilerini Temizle',
  exportAs: 'Crawl Verilerini Dışa Aktar…',
  generateSitemap: 'XML Sitemap Oluştur',
  sitemapStandard: 'Standart…',
  sitemapImages: 'Görseller…',
  sitemapHreflang: 'Hreflang…',
  sitemapNews: 'Haber…',
  sitemapVideo: 'Video…',
  exportHtmlReport: 'HTML Rapor Dışa Aktar…',
  bulkExport: 'Toplu Dışa Aktarım…',
  exportSheets: 'Google Sheets\'e Aktar…',
  exportBigquery: 'BigQuery\'ye Aktar…',
  compareWith: 'Projeyle Karşılaştır…',
  scheduledCrawl: 'Zamanlanmış Crawl…',
  scheduledCrawlTooltip:
    'Şu an açık olan proje için uygulama içi tekrarlayan crawl kur. Yalnızca FreeCrawl açıkken çalışır; yeniden başlatmaya dayanan tetikler için CLI + OS zamanlayıcısını kullan.',
  saveProject: 'Projeyi Kaydet',
  saveProjectAs: 'Projeyi Farklı Kaydet…',
  titleUntitledProject: 'Adsız proje',
  dlgSaveProjectAsTitle: 'Projeyi Farklı Kaydet…',
  dlgExportTableTitle: 'Tabloyu Dışa Aktar',
  dlgSaveFailedTitle: 'Proje Kaydedilemedi',
  msgProjectSaved: 'Tek sıkıştırılmış dosya olarak kaydedildi: {size} MB ({from} MB yerine).',
  dlgUnsavedTitle: 'Kaydedilmemiş Değişiklikler',
  msgUnsavedChanges: 'Bu projede henüz kaydedilmemiş değişiklikler var.',
  detailUnsavedChanges:
    'Crawl sonuçları, proje dosyasına kaydedene kadar bir çalışma kopyasında tutulur.',
  btnSaveChanges: 'Kaydet',
  btnDiscardChanges: 'Kaydetme',
  saveProjectEncrypted: 'Şifreli Snapshot Kaydet…',
  saveProjectEncryptedTooltip:
    'Aktif projeyi parolayla korunan AES-256-GCM şifreli .seoproject.enc dosyasına dışa aktar.',
  openProjectEncrypted: 'Şifreli Proje Aç…',
  openProjectEncryptedTooltip:
    'Bir .seoproject.enc snapshot\'ını parolasıyla çöz ve kurtarılan projeyi aç.',
  settings: 'Ayarlar…',
  edit: 'Düzen',
  copy: 'Kopyala',
  view: 'Görünüm',
  overviewSidebar: 'Genel Bakış Kenar Çubuğu',
  detailPanel: 'Detay Paneli',
  fullscreen: 'Tam Ekran',
  visualization: 'Görselleştirme',
  openVisualizationWindow: 'Görselleştirme Penceresini Aç…',
  reports: 'Raporlar',
  reportsItem: 'Raporlar…',
  logAnalyzer: 'Log Analizi',
  openLogAnalyzerWindow: 'Log Analiz Penceresini Aç…',
  openLogAnalyzerWindowTooltip:
    'Sunucu erişim loglarını analiz et (Apache / Nginx / IIS) — URL başına bot isabeti, crawl bütçesi ve crawl × log yetim tespiti ayrı bir pencerede.',
  help: 'Yardım',
  documentation: 'Dokümantasyon',
  showLogs: 'Logları Göster…',
  trayShow: 'FreeCrawl\'i Göster',
  trayHide: 'Tepsiye Gizle',
  trayStopCrawl: 'Taramayı Durdur',
  trayQuit: 'FreeCrawl\'ten Çık',
  openLogsFolder: 'Log Klasörünü Aç',
  openLogsFolderTooltip:
    'Diske kayıtlı, dönen log dosyalarının olduğu dizini aç',
  robotsTester: 'Robots.txt Test Aracı…',
  sitemapValidator: 'Sitemap Doğrulayıcı…',
  resetDiagnostics: 'Tanı Uyarılarını Sıfırla',
  resetDiagnosticsTooltip:
    'Daha önce "Bir daha gösterme" ile kapattığınız popup uyarılarını yeniden etkinleştir',
  deleteDomainData: 'Alan Verilerini Sil…',
  deleteDomainDataTooltip:
    'GDPR uyumlu, alan başına temizleme. Girdiğiniz alana ait her URL satırını + bağlı kayıtları (linkler, başlıklar, görseller, kaynak snapshot\'ları) siler.',
  clearAllData: 'Tüm Veriyi Temizle…',
  clearAllDataTooltip:
    'Aktif projenin tamamını sil (URL\'ler, linkler, görseller, başlıklar, kaynak snapshot\'ları, sitemap\'ler). Geri alınamaz — yedek istiyorsanız önce Projeyi Farklı Kaydet.',
  checkForUpdates: 'Güncellemeleri Kontrol Et…',
  checkForUpdatesTooltip:
    'En son GitHub release\'ini çek ve kurulu sürümünüzle karşılaştır. Arka planda yoklama yok — yalnızca tıkladığınızda çalışır.',
  about: 'FreeCrawl SEO Hakkında',

  ctxCopy: 'Kopyala',
  ctxOpenInBrowser: 'Tarayıcıda Aç',
  ctxRespider: 'Yeniden Tara',
  ctxStartCrawlFirst: 'Önce bir crawl başlatın',
  ctxRemove: 'Kaldır',
  ctxOpenRobotsTxt: 'robots.txt\'yi Aç',
  ctxCopyNUrls: '{n} URL\'yi Kopyala',
  ctxOpenNUrlsInBrowser: '{n} URL\'yi Tarayıcıda Aç',
  ctxOpenLimitTooltip: 'Çok fazla sekme açılmasını önlemek için 20 URL ile sınırlı',
  ctxRespiderNUrls: '{n} URL\'yi Yeniden Tara',
  ctxRemoveNUrls: '{n} URL\'yi Kaldır',
  ctxExportNUrlsAsCsv: '{n} URL\'yi CSV Olarak Dışa Aktar…',
  ctxCopyCell: 'Hücreyi Kopyala',
  ctxCopyNCells: '{n} Hücreyi Kopyala',
  ctxCopyRow: 'Satırı Kopyala',
  ctxCopyNRows: '{n} Satırı Kopyala',
  ctxCopyColumn: 'Sütunu Kopyala',
  ctxCopyNColumns: '{n} Sütunu Kopyala',

  btnOk: 'Tamam',
  btnCancel: 'İptal',
  btnClose: 'Kapat',
  btnClear: 'Temizle',
  btnOpenFolder: 'Klasörü Aç',
  btnLater: 'Sonra',
  btnOpenReleasePage: 'Release Sayfasını Aç',
  btnOpenReleasesPage: 'Release Sayfasını Aç',
  btnDownloadInstaller: 'Kurulumu İndir',
  btnDownloadNow: 'Şimdi indir',
  btnSkipJsRender: 'Atla — bu çalıştırmada JS render\'ı devre dışı bırak',

  dlgOpenProjectTitle: 'Proje Aç',
  dlgOpenProjectFailedTitle: 'Proje Açılamadı',
  dlgLogsFolderUnavailableTitle: 'Log Klasörü Kullanılamıyor',
  dlgLogsFolderUnavailableMsg:
    'Diske log yazma başlatılmadı. Loglar bu oturum için yalnızca bellekte tutuluyor.',
  dlgDiagResetTitle: 'Tanı Uyarıları Sıfırlandı',
  dlgDiagResetNoneMsg: 'Sıfırlanacak bastırılmış tanı uyarısı yok.',
  dlgDownloadCompleteTitle: 'İndirme Tamamlandı',
  dlgDownloadFailedTitle: 'İndirme Başarısız',
  dlgDownloadStartFailedMsg: 'İndirme başlatılamadı.',
  dlgUpdateCheckFailedTitle: 'Güncelleme Kontrolü Başarısız',
  dlgUpdateCheckFailedMsg: 'GitHub Releases API\'sine ulaşılamadı.',
  dlgUpToDateTitle: 'Güncel',
  dlgUpdateAvailableTitle: 'Güncelleme Mevcut',
  dlgOpenAccessLogTitle: 'Erişim Logu Aç',
  dlgExportLogAnalysisTitle: 'Log Analizini Dışa Aktar',
  dlgExportExtractionRulesTitle: 'Çıkarım Kurallarını Dışa Aktar',
  dlgImportExtractionRulesTitle: 'Çıkarım Kurallarını İçe Aktar',
  dlgExportSettingsTitle: 'Ayarları Dışa Aktar',
  dlgImportSettingsTitle: 'Ayarları İçe Aktar',
  dlgImportFailedTitle: 'İçe Aktarma Başarısız',
  dlgImportFailedNoSettingsMsg: 'İçe aktarılan dosya bir ayarlar nesnesi içermiyor.',
  dlgChooseFolderTitle: 'Klasör Seç',
  dlgPlaywrightTitle: 'JavaScript Render — Tarayıcı Eksik',
  dlgPlaywrightMsg:
    'JavaScript render çalışabilmeden önce Playwright\'ın bir Chromium tarayıcısı indirmesi gerekiyor.',
  dlgBrowserInstallFailedTitle: 'Tarayıcı Kurulumu Başarısız',
  dlgProjectSavedTitle: 'Proje Kaydedildi',
  dlgEncSnapshotSavedTitle: 'Şifreli Snapshot Kaydedildi',
  dlgSaveDecryptedProjectTitle: 'Çözülmüş Projeyi Farklı Kaydet…',
  dlgBulkExportFolderTitle: 'Toplu Dışa Aktarım — çıktı klasörünü seçin',
  dlgBulkExportCompleteTitle: 'Toplu Dışa Aktarım Tamamlandı',
  dlgHtmlReportSavedTitle: 'HTML Rapor Kaydedildi',
  dlgSitemapGeneratedTitle: 'Sitemap Oluşturuldu',

  dlgConfirmClearMsg: 'Tüm crawl verileri temizlensin mi?',
  dlgConfirmClearDetail:
    'Bu işlem, aktif projedeki taranmış her URL, link, görsel, başlık ve kaynak snapshot\'ını kalıcı olarak siler. Geri alınamaz.',
  dlgDontAskAgain: 'Bir daha sorma',
};

export function getMenuLabels(lang: MenuLang): MenuLabels {
  return lang === 'tr' ? MENU_TR : MENU_EN;
}

export function isMenuLang(value: unknown): value is MenuLang {
  return value === 'en' || value === 'tr';
}
