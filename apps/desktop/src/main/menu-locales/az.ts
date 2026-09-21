/**
 * Azerbaijani native menu / tray / dialog labels.
 *
 * See `../menu-i18n.ts` for why the main process keeps its own copy of
 * these strings instead of importing the renderer's locale JSON.
 *
 * Azerbaijani is close enough to Turkish that copying `MENU_TR` would
 * "work"; it is not translated that way. Native forms are preferred
 * throughout (`keçid` not `bağlantı`, `sorğu` not `istek`, `parametrlər`
 * not `ayarlar`) -- see `docs/i18n-glossary.md`.
 */
import type { MenuLabels } from '../menu-i18n.js';

export const MENU_AZ: MenuLabels = {
  file: 'Fayl',
  newProject: 'Yeni layihə',
  openProject: 'Layihəni aç…',
  newProjectWindow: 'Yeni layihə pəncərəsi',
  openRecent: 'Son istifadə olunanları aç',
  manageProjects: 'Layihələri idarə et…',
  clearRecent: 'Son siyahını təmizlə',
  emptyRecent: '(boş)',
  clearCrawlData: 'Tarama məlumatlarını təmizlə',
  exportAs: 'Tarama məlumatlarını ixrac et…',
  generateSitemap: 'XML sitemap yarat',
  sitemapStandard: 'Standart…',
  sitemapImages: 'Şəkillər…',
  sitemapHreflang: 'Hreflang…',
  sitemapNews: 'Xəbərlər…',
  sitemapVideo: 'Video…',
  exportHtmlReport: 'HTML hesabatı ixrac et…',
  exportPdfReport: 'PDF hesabatı ixrac et…',
  exportSeoAudit: 'SEO auditini ixrac et (Screaming Frog düzəni)…',
  bulkExport: 'Toplu ixrac…',
  exportSheets: 'Google Sheets-ə ixrac et…',
  exportBigquery: 'BigQuery-yə ixrac et…',
  compareWith: 'Layihə ilə müqayisə et…',
  scheduledCrawl: 'Cədvəlli tarama…',
  scheduledCrawlTooltip:
    'Açıq layihə üçün tətbiq daxilində təkrarlanan tarama qurun. Yalnız FreeCrawl açıq olduqda işə düşür; yenidən başlatmadan sonra da qalan tətikləyicilər üçün CLI ilə əməliyyat sisteminin cədvəlləyicisindən istifadə edin.',
  saveProject: 'Layihəni saxla',
  saveProjectAs: 'Layihəni fərqli saxla…',
  titleUntitledProject: 'Adsız layihə',
  titleSaving: 'Yadda saxlanılır…',
  dlgSaveProjectAsTitle: 'Layihəni fərqli saxla…',
  dlgExportTableTitle: 'Cədvəli ixrac et',
  dlgSaveFailedTitle: 'Layihə saxlanıla bilmədi',
  msgProjectSaved:
    'Tək sıxılmış fayl kimi saxlanıldı: {size} MB ({from} MB-dan).',
  dlgUnsavedTitle: 'Saxlanılmamış dəyişikliklər',
  msgUnsavedChanges: 'Bu layihədə hələ saxlanılmamış dəyişikliklər var.',
  detailUnsavedChanges:
    'Tarama nəticələri layihə faylına saxlanılana qədər işçi kopyada qalır.',
  btnSaveChanges: 'Saxla',
  btnDiscardChanges: 'Saxlama',
  saveProjectEncrypted: 'Şifrələnmiş anlıq görüntü saxla…',
  saveProjectEncryptedTooltip:
    'Aktiv layihəni parolla qorunan, AES-256-GCM ilə şifrələnmiş .seoproject.enc faylına ixrac edir.',
  openProjectEncrypted: 'Şifrələnmiş layihəni aç…',
  openProjectEncryptedTooltip:
    '.seoproject.enc anlıq görüntüsünü parolu ilə deşifrə edib bərpa olunmuş layihəni açır.',
  settings: 'Parametrlər…',
  edit: 'Redaktə',
  copy: 'Kopyala',
  view: 'Görünüş',
  overviewSidebar: 'Ümumi baxış yan paneli',
  detailPanel: 'Təfərrüat paneli',
  fullscreen: 'Tam ekran',
  theme: 'Mövzu',
  themeDark: 'Tünd',
  themeLight: 'Açıq',
  visualization: 'Vizuallaşdırma',
  openVisualizationWindow: 'Vizuallaşdırma pəncərəsini aç…',
  reports: 'Hesabatlar',
  reportsItem: 'Hesabatlar…',
  logAnalyzer: 'Log analizatoru',
  openLogAnalyzerWindow: 'Log analizatoru pəncərəsini aç…',
  openLogAnalyzerWindowTooltip:
    'Server müraciət loglarını (Apache / Nginx / IIS) ayrı pəncərədə təhlil edin — URL üzrə bot müraciətləri, tarama büdcəsi və tarama ilə logun tutuşdurulmasından yetim səhifələrin aşkarlanması.',
  help: 'Kömək',
  documentation: 'Sənədləşmə',
  showLogs: 'Logları göstər…',
  trayShow: 'FreeCrawl-u göstər',
  trayHide: 'Treyə yığ',
  trayStopCrawl: 'Taramanı dayandır',
  trayQuit: 'FreeCrawl-dan çıx',
  openLogsFolder: 'Log qovluğunu aç',
  openLogsFolderTooltip:
    'Növbələnmiş log fayllarının diskdə saxlanıldığı qovluğu açır',
  robotsTester: 'robots.txt test edicisi…',
  sitemapValidator: 'Sitemap yoxlayıcısı…',
  resetDiagnostics: 'Diaqnostika xəbərdarlıqlarını sıfırla',
  resetDiagnosticsTooltip:
    '«Bir daha göstərmə» ilə bağladığınız açılan xəbərdarlıqları yenidən aktivləşdirir',
  deleteDomainData: 'Domen məlumatlarını sil…',
  deleteDomainDataTooltip:
    'GDPR-a uyğun domen üzrə təmizləmə. Daxil edilən domenlə uyğun gələn hər URL sətrini və ona bağlı bütün qeydləri (keçidlər, başlıqlar, şəkillər, mənbə görüntüləri) silir.',
  clearAllData: 'Bütün məlumatları təmizlə…',
  clearAllDataTooltip:
    'Aktiv layihəni tamamilə boşaldır (URL-lər, keçidlər, şəkillər, başlıqlar, mənbə görüntüləri, sitemap-lar). Geri qaytarıla bilməz — ehtiyat nüsxə istəyirsinizsə, əvvəlcə «Layihəni fərqli saxla…» seçin.',
  checkForUpdates: 'Yeniləmələri yoxla…',
  checkForUpdatesTooltip:
    'GitHub-dakı son buraxılışı gətirib quraşdırılmış versiyanızla müqayisə edir. Fonda sorğu yoxdur: yalnız siz kliklədikdə işləyir.',
  about: 'FreeCrawl SEO haqqında',

  ctxCopy: 'Kopyala',
  ctxOpenInBrowser: 'Brauzerdə aç',
  ctxRespider: 'Yenidən tara',
  ctxStartCrawlFirst: 'Əvvəlcə bir tarama başladın',
  ctxRemove: 'Sil',
  ctxOpenRobotsTxt: 'robots.txt-i aç',
  ctxCopyNUrls: '{n} URL kopyala',
  ctxOpenNUrlsInBrowser: '{n} URL-i brauzerdə aç',
  ctxOpenLimitTooltip: 'Çox sayda tab açılmasın deyə 20 URL ilə məhdudlaşdırılıb',
  ctxRespiderNUrls: '{n} URL-i yenidən tara',
  ctxRemoveNUrls: '{n} URL sil',
  ctxExportNUrlsAsCsv: '{n} URL-i CSV kimi ixrac et…',
  ctxCopyCell: 'Xanəni kopyala',
  ctxCopyNCells: '{n} xanə kopyala',
  ctxCopyRow: 'Sətri kopyala',
  ctxCopyNRows: '{n} sətir kopyala',
  ctxCopyColumn: 'Sütunu kopyala',
  ctxCopyNColumns: '{n} sütun kopyala',

  btnOk: 'Oldu',
  btnCancel: 'Ləğv et',
  btnClose: 'Bağla',
  btnClear: 'Təmizlə',
  btnOpenFolder: 'Qovluğu aç',
  btnLater: 'Sonra',
  btnOpenReleasePage: 'Buraxılış səhifəsini aç',
  btnOpenReleasesPage: 'Buraxılışlar səhifəsini aç',
  btnDownloadInstaller: 'Quraşdırıcını endir',
  btnDownloadNow: 'İndi endir',
  btnSkipJsRender: 'Ötür — bu işləmə üçün JS renderini söndür',

  dlgOpenProjectTitle: 'Layihəni aç',
  dlgOpenProjectFailedTitle: 'Layihə açıla bilmədi',
  dlgLogsFolderUnavailableTitle: 'Log qovluğu əlçatan deyil',
  dlgLogsFolderUnavailableMsg:
    'Diskə loglama işə salınmayıb. Bu sessiyanın logları yalnız yaddaşda saxlanılır.',
  dlgDiagResetTitle: 'Diaqnostika xəbərdarlıqları sıfırlandı',
  dlgDiagResetNoneMsg: 'Sıfırlanacaq susdurulmuş diaqnostika xəbərdarlığı yoxdur.',
  dlgDownloadCompleteTitle: 'Endirmə tamamlandı',
  dlgDownloadFailedTitle: 'Endirmə alınmadı',
  dlgDownloadStartFailedMsg: 'Endirmə başladıla bilmədi.',
  dlgUpdateCheckFailedTitle: 'Yeniləmə yoxlanışı alınmadı',
  dlgUpdateCheckFailedMsg: 'GitHub buraxılışlar API-sinə qoşulmaq mümkün olmadı.',
  dlgUpToDateTitle: 'Ən son versiyadır',
  dlgUpdateAvailableTitle: 'Yeniləmə mövcuddur',
  dlgOpenAccessLogTitle: 'Müraciət logunu aç',
  dlgExportLogAnalysisTitle: 'Log təhlilini ixrac et',
  dlgExportExtractionRulesTitle: 'Çıxarış qaydalarını ixrac et',
  dlgImportExtractionRulesTitle: 'Çıxarış qaydalarını idxal et',
  dlgExportSettingsTitle: 'Parametrləri ixrac et',
  dlgImportSettingsTitle: 'Parametrləri idxal et',
  dlgImportFailedTitle: 'İdxal alınmadı',
  dlgImportFailedNoSettingsMsg:
    'İdxal edilən faylda parametrlər obyekti yoxdur.',
  dlgChooseFolderTitle: 'Qovluq seçin',
  dlgPlaywrightTitle: 'JavaScript renderi — brauzer yoxdur',
  dlgPlaywrightMsg:
    'JavaScript renderi işləməzdən əvvəl Playwright bir Chromium brauzeri endirməlidir.',
  dlgBrowserInstallFailedTitle: 'Brauzerin quraşdırılması alınmadı',
  dlgProjectSavedTitle: 'Layihə saxlanıldı',
  dlgEncSnapshotSavedTitle: 'Şifrələnmiş anlıq görüntü saxlanıldı',
  dlgSaveDecryptedProjectTitle: 'Deşifrə olunmuş layihəni fərqli saxla…',
  dlgBulkExportFolderTitle: 'Toplu ixrac — çıxış qovluğunu seçin',
  dlgBulkExportCompleteTitle: 'Toplu ixrac tamamlandı',
  dlgHtmlReportSavedTitle: 'HTML hesabat saxlanıldı',
  dlgPdfReportSavedTitle: 'PDF hesabat yadda saxlanıldı',
  dlgSeoAuditFolderTitle: 'SEO audit ixracı üçün qovluq seçin',
  dlgSeoAuditCompleteTitle: 'SEO audit ixracı tamamlandı',
  dlgPickLogoTitle: 'Hesabat loqosu seçin',
  msgLogoTooLarge: 'Loqo 1 MB və ya daha kiçik olmalıdır.',
  dlgSitemapGeneratedTitle: 'Sitemap yaradıldı',

  diagDnsRefusedTitle: 'Şəbəkə bağlantısı yoxdur',
  diagDnsRefusedMsg:
    'FreeCrawl DNS sorğusunu üç səviyyədə sınadı (sistem, 53 portundaki ictimai serverlər və 443 portundaki DNS-over-HTTPS) — hamısı rədd edildi. Görünür, kompüterinizdə işlək internet bağlantısı yoxdur.',
  diagDnsRefusedDetail:
    'FreeCrawl nasaz sistem DNS-ini avtomatik yan keçməyə artıq cəhd edir — bu pəncərəni görürsünüzsə, 443 portu üzərindən DNS-over-HTTPS də alınmadı.\n\n' +
    'Ən ehtimallı səbəblər (sıra ilə):\n' +
    '  1. Antivirus / son nöqtə təhlükəsizliyi FreeCrawl-a HEÇ BİR çıxış bağlantısı qurmağa icazə vermir. Təhlükəsizlik proqramınızda FreeCrawl-a icazə verin.\n' +
    '  2. İnternetə qoşulmamısınız — Wi-Fi / Ethernet bağlantısını yoxlayın.\n' +
    '  3. Korporativ təhlükəsizlik divarı bütün çıxış trafikini bağlayır — Parametrlər → Şəbəkə bölməsində HTTPS_PROXY təyin edin.\n' +
    '  4. Aktiv VPN nasaz vəziyyətdədir — bağlantını kəsib yenidən sınayın.\n\n' +
    'Bütün xəta zəncirini görmək üçün "Qeydləri aç" düyməsini basın.',
  diagDnsDestroyedTitle: 'Şəbəkə yığını cavab vermir',
  diagDnsDestroyedMsg:
    'Sisteminizin DNS həlledicisi çökdü VƏ FreeCrawl-ın avtomatik DNS-over-HTTPS yan keçidi də alınmadı. Bu, yalnız DNS-in deyil, bütün şəbəkə yığınının nasaz olduğunu göstərir.',
  diagDnsDestroyedDetail:
    'FreeCrawl adətən çökmüş Windows DNS Client xidmətindən sorğuları Cloudflare/Google üzərindən HTTPS:443 ilə yönləndirərək bərpa olunur. Bu pəncərəni görürsünüzsə, həmin ehtiyat yol da alınmayıb — bu, çox vaxt əməliyyat sisteminin şəbəkə yığınının özünün sıfırlanmasına ehtiyac duyduğu deməkdir.\n\n' +
    'Bunlardan birini sınayın (asandan çətinə):\n' +
    '  1. Təyyarə rejimini yandırıb söndürün və ya Wi-Fi bağlantısını kəsib yenidən qurun.\n' +
    '  2. Şəbəkə adapterini yenidən başladın (Parametrlər → Şəbəkə → Adapter seçimlərini dəyiş).\n' +
    '  3. "services.msc" açın, "DNS Client" tapın, sağ düymə → Yenidən başlat (yalnız Windows).\n' +
    '  4. Son çarə olaraq kompüteri yenidən başladın.\n\n' +
    'Bütün xəta zəncirini görmək üçün "Qeydləri aç" düyməsini basın.',
  diagTlsTitle: 'TLS sertifikatı rədd edildi',
  diagTlsMsg:
    'TLS sertifikatı yoxlamadan keçmədi — adətən antivirus və ya korporativ proksi HTTPS-i araya girib oxuduğu üçün.',
  diagTlsDetail:
    'Adətən səbəb olanlar: Kaspersky, ESET, Bitdefender, Zscaler, BlueCoat, Fortigate.\n\n' +
    'Bunlardan birini sınayın:\n' +
    '  1. Antivirusunuzda FreeCrawl-a icazə verin.\n' +
    '  2. Antivirusun / proksinin kök CA sertifikatını PEM formatında ixrac edin və proqramı başlatmadan əvvəl NODE_EXTRA_CA_CERTS mühit dəyişənini həmin fayla yönəldin.\n' +
    '  3. Antivirusunuzda HTTPS yoxlamasını müvəqqəti söndürün.\n\n' +
    'Bütün xəta zəncirini görmək üçün "Qeydləri aç" düyməsini basın.',
  diagSeedTitle: 'Başlanğıc URL əlçatan deyil',
  diagSeedMsg:
    'FreeCrawl daxil etdiyiniz URL-ə çata bilmədi — 5 saniyə içində nə HTTPS, nə də HTTP cavab verdi.',
  diagSeedDetail:
    'Bunlardan birini sınayın:\n' +
    '  1. Saytın işlədiyini yoxlamaq üçün URL-i brauzerdə açın.\n' +
    '  2. İnternet bağlantınızı yoxlayın.\n' +
    '  3. VPN istifadə edirsinizsə və ya korporativ proksinin arxasındasınızsa, başlatmadan əvvəl HTTPS_PROXY təyin edin, ya da Parametrlər → Şəbəkə → Proksi URL-ini tənzimləyin.\n' +
    '  4. URL-in düzgün yazıldığını yoxlayın (host adındaki yazı səhvləri).\n\n' +
    'Diaqnostika izini görmək üçün "Qeydləri aç" düyməsini basın.',
  btnOpenLogs: 'Qeydləri aç',
  btnDismiss: 'Bağla',
  dlgDontShowAgain: 'Bunu bir daha göstərmə',

  msgDownloadComplete: '{name} endirildi.',
  detailDownloadSaved:
    'Saxlanıldı:\n{path}\n\nEndirmələr qovluğu açıldı — yeniləmək üçün quraşdırıcıya iki dəfə klikləyin.',
  detailDownloadSmartScreen:
    'Quraşdırıcı kod imzalı olmadığı üçün Windows SmartScreen "Tanınmayan tətbiq" xəbərdarlığı göstərə bilər. Davam etmək üçün "Ətraflı məlumat → Hər halda işlət" seçin.',
  detailDownloadGatekeeper:
    'Tətbiq notarial təsdiqdən keçmədiyi üçün macOS Gatekeeper ilk açılışda onu bağlaya bilər. Yan keçmək üçün .dmg faylına sağ düymə ilə klikləyib → Aç seçin.',
  msgDownloadFailed: '{name} endirilə bilmədi',
  detailDownloadFailed:
    'Endirmə vəziyyəti: {state}\n\nGitHub Releases səhifəsindən yenidən cəhd edə bilərsiniz.',
  msgUnknownErrorGitHub: 'GitHub ilə əlaqədə bilinməyən xəta',
  msgNoReleaseTag: 'Cavabda buraxılış etiketi yoxdur.',
  detailBrowseReleases: 'Buraxılışlara özünüz bu ünvandan baxa bilərsiniz:\n{url}',
  msgUpToDate: 'Ən son versiyadan istifadə edirsiniz (v{version}).',
  detailLatestRelease: 'GitHub-daki ən son buraxılış: {tag}',
  detailPublished: 'Dərc olunub: {date}',
  msgUpdateAvailable: '{version} əlçatandır.',
  detailInstalledLatest: 'Quraşdırılmış: v{installed}\nƏn son:       {latest}',
  detailReleaseNotes: 'Buraxılış qeydləri:',
  detailSeeReleasePage: 'Dəyişikliklər siyahısı üçün buraxılış səhifəsinə baxın.',
  dlgDontShowVersionAgain: 'Bu versiyanı bir daha göstərmə',

  winLogsTitle: 'FreeCrawl — Qeydlər ({label})',
  winLabelPrimary: 'Əsas',
  winVisualizationTitle: 'FreeCrawl — Vizuallaşdırma',
  winLogAnalyzerTitle: 'FreeCrawl — Qeyd analizatoru',

  dlgPlaywrightDetail:
    'Bu, tətbiqin içində gedən təkrarsız, təxminən 250 MB-lıq endirmədir — terminal lazım deyil. Brauzer istifadəçi qovluğunuzda saxlanılır; yalnız ikili fayl, cdn.playwright.dev ünvanından endirilir.\n\nİndi endirilsin?',
  msgBrowserInstallFailed:
    'Chromium endirməsi tamamlana bilmədi.\n\n' +
    'İnternet bağlantınızı (və ya proksi parametrlərinizi) yoxlayıb taramanı yenidən başladın — ' +
    'FreeCrawl endirməni avtomatik olaraq yenidən sınayacaq. Uğurlu olana qədər JavaScript ' +
    'renderi söndürülü qalır; mətn rejimində tarama bundan təsirlənmir.',

  notifCrawlFinished: 'Tarama bitdi: {urls} URL · orta {ms} ms',

  dlgSaveEncSnapshotTitle: 'Şifrələnmiş anlıq görüntünü saxla…',
  msgEncSnapshotWritten: 'Şifrələnmiş anlıq görüntü yazıldı: {size} MB.',
  detailEncSnapshotKeepPassword:
    'Şifrəni etibarlı yerdə saxlayın — onu bərpa etmək mümkün deyil. Şifrə olmadan fayl oxunmur.',
  dlgOpenEncProjectTitle: 'Şifrələnmiş layihəni aç…',

  dlgChooseExportFolderTitle: '{format} ixracı üçün qovluq seçin',
  msgBulkExportWritten: 'Yazılan fayl: {files}. Ümumi sətir: {rows}.',
  detailBulkExportErrors: 'Xətalar:',
  msgHtmlReportWritten: 'Hesabat yazıldı: {size} KB.',
  msgPdfReportWritten: 'PDF yazıldı: {size} KB.',
  msgSeoAuditWritten: '{files} fayl yazıldı ({rows} sətir).',
  dlgCompareWithProjectTitle: 'Layihə ilə müqayisə et…',
  msgSitemapSharded:
    'Hissələnmiş sayt xəritəsi yazıldı: {parts} hissə + indeks daxilində {urls} URL.',
  msgSitemapWritten: 'Sayt xəritəsi {urls} URL ilə yazıldı.',
  msgSitemapWrittenTruncated:
    'Sayt xəritəsi {urls} URL ilə yazıldı (50.000 həddində kəsildi).',
  detailSitemapParts: 'Hissə faylı: {parts}, üstəgəl indeks',

  msgCouldNotOpenPath: '{path} açıla bilmədi.',
  msgCouldNotOpenSelected: 'Seçilmiş fayl açıla bilmədi.',
  msgImportCannotParseJson: 'JSON təhlil edilə bilmir: {error}',
  msgDiagResetDone:
    'Yenidən aktivləşdirilən xəbərdarlıq: {n}. Əsas problem bir daha baş verdikdə onlar yenə görünəcək.',

  filterFreeCrawlProject: 'FreeCrawl layihəsi',
  filterFreeCrawlEncProject: 'FreeCrawl şifrələnmiş layihəsi',
  filterAllFiles: 'Bütün fayllar',
  filterLogFiles: 'Qeyd faylları',
  filterExcelWorkbook: 'Excel iş kitabı',
  filterHtmlReport: 'HTML hesabatı',
  filterPdfReport: 'PDF hesabatı',
  filterImages: 'Şəkillər',
  filterXmlSitemap: 'XML sayt xəritəsi',
  filterGzXmlSitemap: 'Gzip ilə sıxılmış XML sayt xəritəsi',

  spellUndetermined:
    'Səhifənin dili təyin edilə bilmədi — html[lang] bildirmir və aşkarlamaq üçün həddən artıq az mətn daşıyır.',
  spellUnsupported: 'Bu LanguageTool son nöqtəsi {lang} dilini dəstəkləmir.',
  spellMismatchBailout:
    'LanguageTool yoxlamanı dayandırdı — səhifə {lang} kimi oxunmur. Bu səhvdirsə, dili Parametrlər → Orfoqrafiya bölməsində sabitləyin.',
  spellMismatchRatio:
    '{lang} kimi yoxlandıqda sözlərin {pct}%-i işarələndi — səhifə az qala mütləq başqa dildə yazılıb, ona görə nəticələr atıldı. Bu səhvdirsə, dili Parametrlər → Orfoqrafiya bölməsində sabitləyin.',
  spellTimeout: 'LanguageTool sorğusu {s}s sonra vaxt aşımına düşdü',
  spellHttpError: 'LanguageTool HTTP {status} qaytardı',

  dlgConfirmClearMsg: 'Bütün tarama məlumatları təmizlənsin?',
  dlgConfirmClearDetail:
    'Bu, aktiv layihədəki hər taranmış URL-i, keçidi, şəkli, başlığı və mənbə görüntüsünü həmişəlik silir. Geri qaytarıla bilməz.',
  dlgDontAskAgain: 'Bir daha soruşma',
};
