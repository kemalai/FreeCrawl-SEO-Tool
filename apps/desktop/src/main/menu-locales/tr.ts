/**
 * Turkish native menu / tray / dialog labels.
 *
 * See `../menu-i18n.ts` for why the main process keeps its own copy of
 * these strings instead of importing the renderer's locale JSON.
 */
import type { MenuLabels } from '../menu-i18n.js';

export const MENU_TR: MenuLabels = {
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
  exportPdfReport: 'PDF Rapor Dışa Aktar…',
  exportSeoAudit: 'SEO Denetimi Dışa Aktar (Screaming Frog düzeni)…',
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
  titleSaving: 'Kaydediliyor…',
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
  theme: 'Tema',
  themeDark: 'Koyu',
  themeLight: 'Açık',
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
  dlgPdfReportSavedTitle: 'PDF Rapor Kaydedildi',
  dlgSeoAuditFolderTitle: 'SEO Denetimi dışa aktarımı için klasör seçin',
  dlgSeoAuditCompleteTitle: 'SEO Denetimi Dışa Aktarımı Tamamlandı',
  dlgPickLogoTitle: 'Rapor logosu seçin',
  msgLogoTooLarge: 'Logo 1 MB veya daha küçük olmalı.',
  dlgSitemapGeneratedTitle: 'Sitemap Oluşturuldu',

  diagDnsRefusedTitle: 'Ağ Bağlantısı Yok',
  diagDnsRefusedMsg:
    'FreeCrawl DNS aramasını 3 katmanda denedi (sistem, 53 portundaki genel sunucular ve 443 portundaki DNS-over-HTTPS) — hepsi reddedildi. Makinenizde çalışan bir internet bağlantısı yok gibi görünüyor.',
  diagDnsRefusedDetail:
    'FreeCrawl bozuk sistem DNS\'ini otomatik olarak atlamayı zaten deniyor — bu pencereyi görüyorsanız 443 portu üzerinden DNS-over-HTTPS bile başarısız oldu.\n\n' +
    'En olası nedenler (sırayla):\n' +
    '  1. Antivirüs / uç nokta güvenliği FreeCrawl\'ın HİÇBİR dışa bağlantı kurmasına izin vermiyor. Güvenlik yazılımınızda FreeCrawl\'a izin verin.\n' +
    '  2. İnternete bağlı değilsiniz — Wi-Fi / Ethernet bağlantınızı kontrol edin.\n' +
    '  3. Kurumsal bir güvenlik duvarı tüm dışa trafiği engelliyor — Ayarlar → Ağ bölümünde HTTPS_PROXY tanımlayın.\n' +
    '  4. Etkin VPN bozuk durumda — bağlantıyı kesip yeniden deneyin.\n\n' +
    'Hata zincirinin tamamını görmek için "Kayıtları Aç"a tıklayın.',
  diagDnsDestroyedTitle: 'Ağ Yığını Yanıt Vermiyor',
  diagDnsDestroyedMsg:
    'Sisteminizin DNS çözümleyicisi çöktü VE FreeCrawl\'ın otomatik DNS-over-HTTPS atlaması da başarısız oldu. Bu, yalnızca DNS\'in değil, ağ yığınının bozuk durumda olduğu anlamına gelir.',
  diagDnsDestroyedDetail:
    'FreeCrawl normalde çöken Windows DNS İstemcisini, aramaları Cloudflare/Google üzerinden HTTPS:443 ile yönlendirerek telafi eder. Bu pencereyi görüyorsanız o yedek yol da başarısız olmuştur — genellikle işletim sisteminin ağ yığınının kendisi sıfırlanmaya ihtiyaç duyduğu için.\n\n' +
    'Şunlardan birini deneyin (kolaydan zora):\n' +
    '  1. Uçak modunu aç/kapat veya Wi-Fi bağlantısını kesip yeniden kurun.\n' +
    '  2. Ağ bağdaştırıcısını yeniden başlatın (Ayarlar → Ağ → Bağdaştırıcı seçeneklerini değiştir).\n' +
    '  3. "services.msc" açın, "DNS Client"ı bulun, sağ tıklayıp → Yeniden Başlat (yalnızca Windows).\n' +
    '  4. Son çare olarak bilgisayarı yeniden başlatın.\n\n' +
    'Hata zincirinin tamamını görmek için "Kayıtları Aç"a tıklayın.',
  diagTlsTitle: 'TLS Sertifikası Reddedildi',
  diagTlsMsg:
    'Bir TLS sertifikası doğrulamayı geçemedi — genellikle antivirüs veya kurumsal bir proxy HTTPS trafiğini araya girip incelediği için.',
  diagTlsDetail:
    'Sık görülen nedenler: Kaspersky, ESET, Bitdefender, Zscaler, BlueCoat, Fortigate.\n\n' +
    'Şunlardan birini deneyin:\n' +
    '  1. Antivirüsünüzde FreeCrawl\'a izin verin.\n' +
    '  2. Antivirüs / proxy kök CA\'sını PEM olarak dışa aktarın ve uygulamayı başlatmadan önce NODE_EXTRA_CA_CERTS ortam değişkenini bu dosyaya ayarlayın.\n' +
    '  3. Antivirüsünüzde HTTPS taramasını geçici olarak devre dışı bırakın.\n\n' +
    'Hata zincirinin tamamını görmek için "Kayıtları Aç"a tıklayın.',
  diagSeedTitle: 'Başlangıç URL\'sine Ulaşılamıyor',
  diagSeedMsg:
    'FreeCrawl girdiğiniz URL\'ye ulaşamadı — 5 saniye içinde ne HTTPS ne de HTTP yanıt verdi.',
  diagSeedDetail:
    'Şunlardan birini deneyin:\n' +
    '  1. Sitenin ayakta olduğunu doğrulamak için URL\'yi bir tarayıcıda açın.\n' +
    '  2. İnternet bağlantınızı kontrol edin.\n' +
    '  3. VPN kullanıyorsanız veya kurumsal bir proxy arkasındaysanız, başlatmadan önce HTTPS_PROXY tanımlayın ya da Ayarlar → Ağ → Proxy URL\'sini yapılandırın.\n' +
    '  4. URL\'nin doğru yazıldığını doğrulayın (ana makine adındaki yazım hataları).\n\n' +
    'Teşhis izini görmek için "Kayıtları Aç"a tıklayın.',
  btnOpenLogs: 'Kayıtları Aç',
  btnDismiss: 'Kapat',
  dlgDontShowAgain: 'Bunu bir daha gösterme',

  msgDownloadComplete: '{name} indirildi.',
  detailDownloadSaved:
    'Kaydedildi:\n{path}\n\nİndirilenler klasörü açıldı — yükseltmek için yükleyiciye çift tıklayın.',
  detailDownloadSmartScreen:
    'Yükleyici kod imzalı olmadığı için Windows SmartScreen "Tanınmayan uygulama" uyarısı gösterebilir. Devam etmek için "Ek bilgi → Yine de çalıştır"a tıklayın.',
  detailDownloadGatekeeper:
    'Uygulama notarize edilmediği için macOS Gatekeeper ilk açılışta engelleyebilir. Atlamak için .dmg dosyasına sağ tıklayıp → Aç seçin.',
  msgDownloadFailed: '{name} indirilemedi',
  detailDownloadFailed:
    'İndirme durumu: {state}\n\nGitHub Releases sayfasından yeniden deneyebilirsiniz.',
  msgUnknownErrorGitHub: 'GitHub ile iletişimde bilinmeyen hata',
  msgNoReleaseTag: 'Yanıtta sürüm etiketi yok.',
  detailBrowseReleases: 'Sürümlere elle şu adresten göz atabilirsiniz:\n{url}',
  msgUpToDate: 'En son sürümü kullanıyorsunuz (v{version}).',
  detailLatestRelease: 'En son GitHub sürümü: {tag}',
  detailPublished: 'Yayınlanma: {date}',
  msgUpdateAvailable: '{version} yayınlandı.',
  detailInstalledLatest: 'Kurulu: v{installed}\nEn son:  {latest}',
  detailReleaseNotes: 'Sürüm notları:',
  detailSeeReleasePage: 'Değişiklik listesi için sürüm sayfasına bakın.',
  dlgDontShowVersionAgain: 'Bu sürümü bir daha gösterme',

  winLogsTitle: 'FreeCrawl — Kayıtlar ({label})',
  winLabelPrimary: 'Birincil',
  winVisualizationTitle: 'FreeCrawl — Görselleştirme',
  winLogAnalyzerTitle: 'FreeCrawl — Kayıt Analizcisi',

  dlgPlaywrightDetail:
    'Bu, uygulamanın içinde çalışan tek seferlik ~250 MB\'lık bir indirmedir — terminale gerek yok. Tarayıcı kullanıcı klasörünüzde saklanır; yalnızca ikili dosya, cdn.playwright.dev adresinden indirilir.\n\nŞimdi indirilsin mi?',
  msgBrowserInstallFailed:
    'Chromium indirmesi tamamlanamadı.\n\n' +
    'İnternet bağlantınızı (veya proxy ayarlarınızı) kontrol edip taramayı yeniden başlatın — ' +
    'FreeCrawl indirmeyi otomatik olarak yeniden dener. Başarılı olana kadar JavaScript ' +
    'render\'ı devre dışı kalır; metin modunda tarama bundan etkilenmez.',

  notifCrawlFinished: 'Tarama bitti: {urls} URL · ortalama {ms} ms',

  dlgSaveEncSnapshotTitle: 'Şifreli Anlık Görüntüyü Kaydet…',
  msgEncSnapshotWritten: 'Şifreli anlık görüntü yazıldı: {size} MB.',
  detailEncSnapshotKeepPassword:
    'Parolayı güvende tutun — kurtarılamaz. Parola olmadan dosya okunamaz.',
  dlgOpenEncProjectTitle: 'Şifreli Projeyi Aç…',

  dlgChooseExportFolderTitle: '{format} dışa aktarımı için klasör seçin',
  msgBulkExportWritten: 'Yazılan dosya: {files}. Toplam satır: {rows}.',
  detailBulkExportErrors: 'Hatalar:',
  msgHtmlReportWritten: 'Rapor yazıldı: {size} KB.',
  msgPdfReportWritten: 'PDF yazıldı: {size} KB.',
  msgSeoAuditWritten: '{files} dosya yazıldı ({rows} satır).',
  dlgCompareWithProjectTitle: 'Projeyle Karşılaştır…',
  msgSitemapSharded:
    'Parçalı site haritası yazıldı: {parts} parça + dizin içinde {urls} URL.',
  msgSitemapWritten: 'Site haritası {urls} URL ile yazıldı.',
  msgSitemapWrittenTruncated:
    'Site haritası {urls} URL ile yazıldı (50.000 sınırında kesildi).',
  detailSitemapParts: 'Parça dosyası: {parts}, artı dizin',

  msgCouldNotOpenPath: '{path} açılamadı.',
  msgCouldNotOpenSelected: 'Seçilen dosya açılamadı.',
  msgImportCannotParseJson: 'JSON ayrıştırılamıyor: {error}',
  msgDiagResetDone:
    'Yeniden etkinleştirilen uyarı: {n}. Altta yatan sorun bir daha oluştuğunda tekrar görünecekler.',

  filterFreeCrawlProject: 'FreeCrawl Projesi',
  filterFreeCrawlEncProject: 'FreeCrawl Şifreli Projesi',
  filterAllFiles: 'Tüm Dosyalar',
  filterLogFiles: 'Kayıt Dosyaları',
  filterExcelWorkbook: 'Excel Çalışma Kitabı',
  filterHtmlReport: 'HTML Raporu',
  filterPdfReport: 'PDF Raporu',
  filterImages: 'Görseller',
  filterXmlSitemap: 'XML Site Haritası',
  filterGzXmlSitemap: 'Gzip\'li XML Site Haritası',

  spellUndetermined:
    'Sayfanın dili belirlenemedi — html[lang] bildirmiyor ve tespit için fazla az düzyazı içeriyor.',
  spellUnsupported: '{lang} bu LanguageTool uç noktası tarafından desteklenmiyor.',
  spellMismatchBailout:
    'LanguageTool denetimi durdurdu — sayfa {lang} gibi okunmuyor. Bu yanlışsa dili Ayarlar → Yazım altında sabitleyin.',
  spellMismatchRatio:
    '{lang} olarak denetlendiğinde kelimelerin %{pct}\'i işaretlendi — sayfa neredeyse kesinlikle başka bir dilde yazılmış, bu yüzden bulgular atıldı. Bu yanlışsa dili Ayarlar → Yazım altında sabitleyin.',
  spellTimeout: 'LanguageTool isteği {s}s sonra zaman aşımına uğradı',
  spellHttpError: 'LanguageTool HTTP {status} döndürdü',

  dlgConfirmClearMsg: 'Tüm crawl verileri temizlensin mi?',
  dlgConfirmClearDetail:
    'Bu işlem, aktif projedeki taranmış her URL, link, görsel, başlık ve kaynak snapshot\'ını kalıcı olarak siler. Geri alınamaz.',
  dlgDontAskAgain: 'Bir daha sorma',
};
