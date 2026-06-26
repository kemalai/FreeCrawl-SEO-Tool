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
  openProject: string;
  openRecent: string;
  clearRecent: string;
  emptyRecent: string;
  clearCrawlData: string;
  exportAs: string;
  generateSitemap: string;
  exportHtmlReport: string;
  bulkExport: string;
  exportSheets: string;
  exportBigquery: string;
  compareWith: string;
  scheduledCrawl: string;
  scheduledCrawlTooltip: string;
  saveProjectAs: string;
  saveProjectEncrypted: string;
  saveProjectEncryptedTooltip: string;
  openProjectEncrypted: string;
  openProjectEncryptedTooltip: string;
  settings: string;
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
}

const MENU_EN: MenuLabels = {
  file: 'File',
  newProject: 'New Project',
  openProject: 'Open Project…',
  openRecent: 'Open Recent',
  clearRecent: 'Clear Recent',
  emptyRecent: '(empty)',
  clearCrawlData: 'Clear Crawl Data',
  exportAs: 'Export Crawl Data…',
  generateSitemap: 'Generate XML Sitemap…',
  exportHtmlReport: 'Export HTML Report…',
  bulkExport: 'Bulk Export…',
  exportSheets: 'Export to Google Sheets…',
  exportBigquery: 'Export to BigQuery…',
  compareWith: 'Compare With Project…',
  scheduledCrawl: 'Scheduled Crawl…',
  scheduledCrawlTooltip:
    'Set up an in-app recurring crawl for the currently-open project. Fires only while FreeCrawl is open; use the CLI + OS scheduler for triggers that survive restarts.',
  saveProjectAs: 'Save Project As…',
  saveProjectEncrypted: 'Save Encrypted Snapshot…',
  saveProjectEncryptedTooltip:
    'Export the active project to an AES-256-GCM-encrypted .seoproject.enc file protected by a password.',
  openProjectEncrypted: 'Open Encrypted Project…',
  openProjectEncryptedTooltip:
    'Decrypt a .seoproject.enc snapshot with its password and open the recovered project.',
  settings: 'Settings…',
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
};

const MENU_TR: MenuLabels = {
  file: 'Dosya',
  newProject: 'Yeni Proje',
  openProject: 'Proje Aç…',
  openRecent: 'Son Açılanlar',
  clearRecent: 'Son Açılanları Temizle',
  emptyRecent: '(boş)',
  clearCrawlData: 'Crawl Verilerini Temizle',
  exportAs: 'Crawl Verilerini Dışa Aktar…',
  generateSitemap: 'XML Sitemap Oluştur…',
  exportHtmlReport: 'HTML Rapor Dışa Aktar…',
  bulkExport: 'Toplu Dışa Aktarım…',
  exportSheets: 'Google Sheets\'e Aktar…',
  exportBigquery: 'BigQuery\'ye Aktar…',
  compareWith: 'Projeyle Karşılaştır…',
  scheduledCrawl: 'Zamanlanmış Crawl…',
  scheduledCrawlTooltip:
    'Şu an açık olan proje için uygulama içi tekrarlayan crawl kur. Yalnızca FreeCrawl açıkken çalışır; yeniden başlatmaya dayanan tetikler için CLI + OS zamanlayıcısını kullan.',
  saveProjectAs: 'Projeyi Farklı Kaydet…',
  saveProjectEncrypted: 'Şifreli Snapshot Kaydet…',
  saveProjectEncryptedTooltip:
    'Aktif projeyi parolayla korunan AES-256-GCM şifreli .seoproject.enc dosyasına dışa aktar.',
  openProjectEncrypted: 'Şifreli Proje Aç…',
  openProjectEncryptedTooltip:
    'Bir .seoproject.enc snapshot\'ını parolasıyla çöz ve kurtarılan projeyi aç.',
  settings: 'Ayarlar…',
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
};

export function getMenuLabels(lang: MenuLang): MenuLabels {
  return lang === 'tr' ? MENU_TR : MENU_EN;
}

export function isMenuLang(value: unknown): value is MenuLang {
  return value === 'en' || value === 'tr';
}
