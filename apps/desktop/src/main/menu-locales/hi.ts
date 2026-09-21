/**
 * Hindi native menu / tray / dialog labels.
 *
 * See `../menu-i18n.ts` for why the main process keeps its own copy of
 * these strings instead of importing the renderer's locale JSON.
 */
import type { MenuLabels } from '../menu-i18n.js';

export const MENU_HI: MenuLabels = {
  file: 'फ़ाइल',
  newProject: 'नया प्रोजेक्ट',
  openProject: 'प्रोजेक्ट खोलें…',
  newProjectWindow: 'नई प्रोजेक्ट विंडो',
  openRecent: 'हाल का खोलें',
  manageProjects: 'प्रोजेक्ट प्रबंधित करें…',
  clearRecent: 'हाल की सूची साफ़ करें',
  emptyRecent: '(खाली)',
  clearCrawlData: 'क्रॉल डेटा साफ़ करें',
  exportAs: 'क्रॉल डेटा निर्यात करें…',
  generateSitemap: 'XML साइटमैप बनाएँ',
  sitemapStandard: 'मानक…',
  sitemapImages: 'छवियाँ…',
  sitemapHreflang: 'Hreflang…',
  sitemapNews: 'समाचार…',
  sitemapVideo: 'वीडियो…',
  exportHtmlReport: 'HTML रिपोर्ट निर्यात करें…',
  exportPdfReport: 'PDF रिपोर्ट निर्यात करें…',
  exportSeoAudit: 'SEO ऑडिट निर्यात करें (Screaming Frog लेआउट)…',
  bulkExport: 'थोक निर्यात…',
  exportSheets: 'Google Sheets में निर्यात करें…',
  exportBigquery: 'BigQuery में निर्यात करें…',
  compareWith: 'प्रोजेक्ट से तुलना करें…',
  scheduledCrawl: 'निर्धारित क्रॉल…',
  scheduledCrawlTooltip:
    'खुले हुए प्रोजेक्ट के लिए ऐप के भीतर दोहराया जाने वाला क्रॉल सेट करें। यह केवल तब चलता है जब FreeCrawl खुला हो; ऐसे ट्रिगर के लिए जो पुनरारंभ के बाद भी बने रहें, CLI और ऑपरेटिंग सिस्टम के शेड्यूलर का उपयोग करें।',
  saveProject: 'प्रोजेक्ट सहेजें',
  saveProjectAs: 'प्रोजेक्ट इस रूप में सहेजें…',
  titleUntitledProject: 'बिना शीर्षक प्रोजेक्ट',
  titleSaving: 'सहेजा जा रहा है…',
  dlgSaveProjectAsTitle: 'प्रोजेक्ट इस रूप में सहेजें…',
  dlgExportTableTitle: 'तालिका निर्यात करें',
  dlgSaveFailedTitle: 'प्रोजेक्ट सहेजा नहीं जा सका',
  msgProjectSaved:
    'एक ही संपीड़ित फ़ाइल के रूप में सहेजा गया: {size} MB ({from} MB से)।',
  dlgUnsavedTitle: 'बिना सहेजे बदलाव',
  msgUnsavedChanges: 'इस प्रोजेक्ट में ऐसे बदलाव हैं जो अभी सहेजे नहीं गए हैं।',
  detailUnsavedChanges:
    'क्रॉल के परिणाम एक कार्यशील प्रतिलिपि में रहते हैं, जब तक आप उन्हें प्रोजेक्ट फ़ाइल में सहेज नहीं देते।',
  btnSaveChanges: 'सहेजें',
  btnDiscardChanges: 'सहेजें नहीं',
  saveProjectEncrypted: 'एन्क्रिप्टेड स्नैपशॉट सहेजें…',
  saveProjectEncryptedTooltip:
    'सक्रिय प्रोजेक्ट को पासवर्ड से सुरक्षित, AES-256-GCM एन्क्रिप्टेड .seoproject.enc फ़ाइल में निर्यात करता है।',
  openProjectEncrypted: 'एन्क्रिप्टेड प्रोजेक्ट खोलें…',
  openProjectEncryptedTooltip:
    '.seoproject.enc स्नैपशॉट को उसके पासवर्ड से डिक्रिप्ट करता है और पुनर्प्राप्त प्रोजेक्ट खोलता है।',
  settings: 'सेटिंग्स…',
  edit: 'संपादन',
  copy: 'कॉपी करें',
  view: 'दृश्य',
  overviewSidebar: 'अवलोकन साइडबार',
  detailPanel: 'विवरण पैनल',
  fullscreen: 'पूर्ण स्क्रीन',
  theme: 'थीम',
  themeDark: 'डार्क',
  themeLight: 'लाइट',
  visualization: 'विज़ुअलाइज़ेशन',
  openVisualizationWindow: 'विज़ुअलाइज़ेशन विंडो खोलें…',
  reports: 'रिपोर्ट',
  reportsItem: 'रिपोर्ट…',
  logAnalyzer: 'लॉग विश्लेषक',
  openLogAnalyzerWindow: 'लॉग विश्लेषक विंडो खोलें…',
  openLogAnalyzerWindowTooltip:
    'सर्वर एक्सेस लॉग (Apache / Nginx / IIS) का एक अलग विंडो में विश्लेषण करें — प्रति URL बॉट हिट, क्रॉल बजट, और क्रॉल तथा लॉग की तुलना से अनाथ पृष्ठों की पहचान।',
  help: 'सहायता',
  documentation: 'दस्तावेज़ीकरण',
  showLogs: 'लॉग दिखाएँ…',
  trayShow: 'FreeCrawl दिखाएँ',
  trayHide: 'ट्रे में छिपाएँ',
  trayStopCrawl: 'क्रॉल रोकें',
  trayQuit: 'FreeCrawl से बाहर निकलें',
  openLogsFolder: 'लॉग फ़ोल्डर खोलें',
  openLogsFolderTooltip:
    'वह डायरेक्टरी खोलता है जहाँ घुमाई गई लॉग फ़ाइलें डिस्क पर रखी जाती हैं',
  robotsTester: 'robots.txt परीक्षक…',
  sitemapValidator: 'साइटमैप सत्यापक…',
  resetDiagnostics: 'डायग्नोस्टिक चेतावनियाँ रीसेट करें',
  resetDiagnosticsTooltip:
    'वे पॉपअप चेतावनियाँ फिर से सक्षम करता है जिन्हें आपने "फिर न दिखाएँ" से बंद किया था',
  deleteDomainData: 'डोमेन डेटा हटाएँ…',
  deleteDomainDataTooltip:
    'GDPR के अनुरूप प्रति-डोमेन सफ़ाई। दर्ज किए गए डोमेन से मेल खाने वाले होस्ट की हर URL पंक्ति और उससे जुड़े सभी रिकॉर्ड (लिंक, हेडर, छवियाँ, स्रोत स्नैपशॉट) हटा देता है।',
  clearAllData: 'सारा डेटा साफ़ करें…',
  clearAllDataTooltip:
    'पूरे सक्रिय प्रोजेक्ट को खाली कर देता है (URL, लिंक, छवियाँ, हेडर, स्रोत स्नैपशॉट, साइटमैप)। इसे पूर्ववत नहीं किया जा सकता — बैकअप चाहिए तो पहले "प्रोजेक्ट इस रूप में सहेजें…" का उपयोग करें।',
  checkForUpdates: 'अपडेट देखें…',
  checkForUpdatesTooltip:
    'GitHub पर प्रकाशित नवीनतम रिलीज़ लाकर उसकी तुलना आपके स्थापित संस्करण से करता है। पृष्ठभूमि में कोई जाँच नहीं — यह केवल क्लिक करने पर चलता है।',
  about: 'FreeCrawl SEO के बारे में',

  ctxCopy: 'कॉपी करें',
  ctxOpenInBrowser: 'ब्राउज़र में खोलें',
  ctxRespider: 'फिर से क्रॉल करें',
  ctxStartCrawlFirst: 'पहले एक क्रॉल शुरू करें',
  ctxRemove: 'हटाएँ',
  ctxOpenRobotsTxt: 'robots.txt खोलें',
  ctxCopyNUrls: '{n} URL कॉपी करें',
  ctxOpenNUrlsInBrowser: 'ब्राउज़र में {n} URL खोलें',
  ctxOpenLimitTooltip: 'बहुत अधिक टैब खुलने से बचाने के लिए 20 URL तक सीमित',
  ctxRespiderNUrls: '{n} URL फिर से क्रॉल करें',
  ctxRemoveNUrls: '{n} URL हटाएँ',
  ctxExportNUrlsAsCsv: '{n} URL को CSV के रूप में निर्यात करें…',
  ctxCopyCell: 'सेल कॉपी करें',
  ctxCopyNCells: '{n} सेल कॉपी करें',
  ctxCopyRow: 'पंक्ति कॉपी करें',
  ctxCopyNRows: '{n} पंक्तियाँ कॉपी करें',
  ctxCopyColumn: 'स्तंभ कॉपी करें',
  ctxCopyNColumns: '{n} स्तंभ कॉपी करें',

  btnOk: 'ठीक',
  btnCancel: 'रद्द करें',
  btnClose: 'बंद करें',
  btnClear: 'साफ़ करें',
  btnOpenFolder: 'फ़ोल्डर खोलें',
  btnLater: 'बाद में',
  btnOpenReleasePage: 'रिलीज़ पृष्ठ खोलें',
  btnOpenReleasesPage: 'रिलीज़ सूची पृष्ठ खोलें',
  btnDownloadInstaller: 'इंस्टॉलर डाउनलोड करें',
  btnDownloadNow: 'अभी डाउनलोड करें',
  btnSkipJsRender: 'छोड़ें — इस बार JS रेंडरिंग बंद रखें',

  dlgOpenProjectTitle: 'प्रोजेक्ट खोलें',
  dlgOpenProjectFailedTitle: 'प्रोजेक्ट खोलना विफल',
  dlgLogsFolderUnavailableTitle: 'लॉग फ़ोल्डर उपलब्ध नहीं',
  dlgLogsFolderUnavailableMsg:
    'डिस्क लॉगिंग आरंभ नहीं हुई है। इस सत्र के लॉग केवल मेमोरी में रखे जाते हैं।',
  dlgDiagResetTitle: 'डायग्नोस्टिक चेतावनियाँ रीसेट हुईं',
  dlgDiagResetNoneMsg: 'रीसेट करने के लिए कोई दबाई गई डायग्नोस्टिक चेतावनी नहीं है।',
  dlgDownloadCompleteTitle: 'डाउनलोड पूर्ण',
  dlgDownloadFailedTitle: 'डाउनलोड विफल',
  dlgDownloadStartFailedMsg: 'डाउनलोड शुरू नहीं किया जा सका।',
  dlgUpdateCheckFailedTitle: 'अपडेट जाँच विफल',
  dlgUpdateCheckFailedMsg: 'GitHub रिलीज़ API तक नहीं पहुँचा जा सका।',
  dlgUpToDateTitle: 'अद्यतित है',
  dlgUpdateAvailableTitle: 'अपडेट उपलब्ध',
  dlgOpenAccessLogTitle: 'एक्सेस लॉग खोलें',
  dlgExportLogAnalysisTitle: 'लॉग विश्लेषण निर्यात करें',
  dlgExportExtractionRulesTitle: 'निष्कर्षण नियम निर्यात करें',
  dlgImportExtractionRulesTitle: 'निष्कर्षण नियम आयात करें',
  dlgExportSettingsTitle: 'सेटिंग्स निर्यात करें',
  dlgImportSettingsTitle: 'सेटिंग्स आयात करें',
  dlgImportFailedTitle: 'आयात विफल',
  dlgImportFailedNoSettingsMsg:
    'आयात की गई फ़ाइल में सेटिंग्स ऑब्जेक्ट नहीं है।',
  dlgChooseFolderTitle: 'फ़ोल्डर चुनें',
  dlgPlaywrightTitle: 'JavaScript रेंडरिंग — ब्राउज़र अनुपलब्ध',
  dlgPlaywrightMsg:
    'JavaScript रेंडरिंग चलने से पहले Playwright को एक Chromium ब्राउज़र डाउनलोड करना होगा।',
  dlgBrowserInstallFailedTitle: 'ब्राउज़र स्थापना विफल',
  dlgProjectSavedTitle: 'प्रोजेक्ट सहेजा गया',
  dlgEncSnapshotSavedTitle: 'एन्क्रिप्टेड स्नैपशॉट सहेजा गया',
  dlgSaveDecryptedProjectTitle: 'डिक्रिप्ट किया प्रोजेक्ट इस रूप में सहेजें…',
  dlgBulkExportFolderTitle: 'थोक निर्यात — आउटपुट फ़ोल्डर चुनें',
  dlgBulkExportCompleteTitle: 'थोक निर्यात पूर्ण',
  dlgHtmlReportSavedTitle: 'HTML रिपोर्ट सहेजी गई',
  dlgPdfReportSavedTitle: 'PDF रिपोर्ट सहेजी गई',
  dlgSeoAuditFolderTitle: 'SEO ऑडिट निर्यात के लिए फ़ोल्डर चुनें',
  dlgSeoAuditCompleteTitle: 'SEO ऑडिट निर्यात पूर्ण',
  dlgPickLogoTitle: 'रिपोर्ट लोगो चुनें',
  msgLogoTooLarge: 'लोगो 1 MB या उससे छोटा होना चाहिए।',
  dlgSitemapGeneratedTitle: 'साइटमैप बन गया',

  diagDnsRefusedTitle: 'कोई नेटवर्क कनेक्टिविटी नहीं',
  diagDnsRefusedMsg:
    'FreeCrawl ने DNS लुकअप की तीन परतें आज़माईं (सिस्टम, पोर्ट 53 पर सार्वजनिक सर्वर, और पोर्ट 443 पर DNS-over-HTTPS) — हर एक अस्वीकार हो गई। ऐसा लगता है कि आपकी मशीन पर कोई चालू इंटरनेट कनेक्शन नहीं है।',
  diagDnsRefusedDetail:
    'FreeCrawl खराब सिस्टम DNS को स्वतः बायपास करने की कोशिश पहले से करता है — यह डायलॉग दिख रहा है, तो पोर्ट 443 पर DNS-over-HTTPS भी विफल रहा।\n\n' +
    'सबसे संभावित कारण (क्रम में):\n' +
    '  1. एंटीवायरस / एंडपॉइंट सुरक्षा FreeCrawl को कोई भी आउटबाउंड कनेक्शन बनाने से रोक रही है। अपने सुरक्षा सॉफ़्टवेयर में FreeCrawl को अनुमति दें।\n' +
    '  2. आप इंटरनेट से जुड़े नहीं हैं — Wi-Fi / ईथरनेट जाँचें।\n' +
    '  3. कोई कॉर्पोरेट फ़ायरवॉल सारा आउटबाउंड ट्रैफ़िक रोक रहा है — सेटिंग्स → नेटवर्क में HTTPS_PROXY सेट करें।\n' +
    '  4. चालू VPN खराब स्थिति में है — उसे डिस्कनेक्ट करके फिर कोशिश करें।\n\n' +
    'पूरी त्रुटि श्रृंखला देखने के लिए "लॉग खोलें" पर क्लिक करें।',
  diagDnsDestroyedTitle: 'नेटवर्क स्टैक जवाब नहीं दे रहा',
  diagDnsDestroyedMsg:
    'आपके सिस्टम का DNS रिज़ॉल्वर क्रैश हो गया और FreeCrawl का स्वचालित DNS-over-HTTPS बायपास भी विफल रहा। इसका मतलब है कि केवल DNS नहीं, पूरा नेटवर्क स्टैक खराब स्थिति में है।',
  diagDnsDestroyedDetail:
    'आम तौर पर FreeCrawl क्रैश हुए Windows DNS Client से उबरने के लिए लुकअप को Cloudflare/Google के ज़रिए HTTPS:443 पर भेज देता है। यह डायलॉग दिख रहा है, तो वह विकल्प भी विफल रहा — आम तौर पर इसलिए कि ऑपरेटिंग सिस्टम के नेटवर्क स्टैक को ही रीसेट करने की ज़रूरत है।\n\n' +
    'इनमें से कोई एक आज़माएँ (आसान से कठिन क्रम में):\n' +
    '  1. एयरप्लेन मोड चालू-बंद करें, या Wi-Fi डिस्कनेक्ट करके फिर जोड़ें।\n' +
    '  2. नेटवर्क अडैप्टर पुनः आरंभ करें (सेटिंग्स → नेटवर्क → अडैप्टर विकल्प बदलें)।\n' +
    '  3. "services.msc" खोलें, "DNS Client" ढूँढें, राइट-क्लिक → पुनः आरंभ करें (केवल Windows)।\n' +
    '  4. अंतिम उपाय के रूप में कंप्यूटर पुनः आरंभ करें।\n\n' +
    'पूरी त्रुटि श्रृंखला देखने के लिए "लॉग खोलें" पर क्लिक करें।',
  diagTlsTitle: 'TLS प्रमाणपत्र अस्वीकृत',
  diagTlsMsg:
    'एक TLS प्रमाणपत्र सत्यापन में विफल रहा — आम तौर पर इसलिए कि एंटीवायरस या कॉर्पोरेट प्रॉक्सी HTTPS को बीच में पकड़ रहा है।',
  diagTlsDetail:
    'आम वजहें: Kaspersky, ESET, Bitdefender, Zscaler, BlueCoat, Fortigate।\n\n' +
    'इनमें से कोई एक आज़माएँ:\n' +
    '  1. अपने एंटीवायरस में FreeCrawl को अनुमति दें।\n' +
    '  2. एंटीवायरस / प्रॉक्सी की रूट CA को PEM के रूप में एक्सपोर्ट करें और ऐप शुरू करने से पहले NODE_EXTRA_CA_CERTS एनवायरनमेंट वेरिएबल उसी फ़ाइल पर सेट करें।\n' +
    '  3. अपने एंटीवायरस में HTTPS स्कैनिंग अस्थायी रूप से बंद करें।\n\n' +
    'पूरी त्रुटि श्रृंखला देखने के लिए "लॉग खोलें" पर क्लिक करें।',
  diagSeedTitle: 'प्रारंभिक URL तक पहुँच नहीं',
  diagSeedMsg:
    'FreeCrawl आपके दर्ज किए URL तक नहीं पहुँच सका — 5 सेकंड में न HTTPS ने जवाब दिया, न HTTP ने।',
  diagSeedDetail:
    'इनमें से कोई एक आज़माएँ:\n' +
    '  1. साइट चालू है या नहीं, इसकी पुष्टि के लिए URL को ब्राउज़र में खोलें।\n' +
    '  2. अपना इंटरनेट कनेक्शन जाँचें।\n' +
    '  3. यदि आप VPN पर हैं या कॉर्पोरेट प्रॉक्सी के पीछे हैं, तो ऐप शुरू करने से पहले HTTPS_PROXY सेट करें, या सेटिंग्स → नेटवर्क → प्रॉक्सी URL कॉन्फ़िगर करें।\n' +
    '  4. जाँचें कि URL की वर्तनी सही है (होस्ट में टाइपिंग की गलती)।\n\n' +
    'निदान विवरण देखने के लिए "लॉग खोलें" पर क्लिक करें।',
  btnOpenLogs: 'लॉग खोलें',
  btnDismiss: 'खारिज करें',
  dlgDontShowAgain: 'यह दोबारा न दिखाएँ',

  msgDownloadComplete: '{name} डाउनलोड हो गया।',
  detailDownloadSaved:
    'यहाँ सहेजा गया:\n{path}\n\nडाउनलोड फ़ोल्डर खुल गया है — अपग्रेड करने के लिए इंस्टॉलर पर डबल-क्लिक करें।',
  detailDownloadSmartScreen:
    'इंस्टॉलर कोड-साइन्ड नहीं है, इसलिए Windows SmartScreen "अपरिचित ऐप" दिखा सकता है। आगे बढ़ने के लिए "अधिक जानकारी → फिर भी चलाएँ" पर क्लिक करें।',
  detailDownloadGatekeeper:
    'ऐप नोटराइज़ नहीं है, इसलिए macOS Gatekeeper पहली बार खोलने पर इसे रोक सकता है। बायपास करने के लिए .dmg पर राइट-क्लिक → खोलें चुनें।',
  msgDownloadFailed: '{name} डाउनलोड नहीं हो सका',
  detailDownloadFailed:
    'डाउनलोड स्थिति: {state}\n\nआप GitHub Releases पृष्ठ से दोबारा कोशिश कर सकते हैं।',
  msgUnknownErrorGitHub: 'GitHub से संपर्क करते समय अज्ञात त्रुटि',
  msgNoReleaseTag: 'प्रतिक्रिया में कोई रिलीज़ टैग नहीं है।',
  detailBrowseReleases: 'आप रिलीज़ यहाँ स्वयं देख सकते हैं:\n{url}',
  msgUpToDate: 'आपके पास नवीनतम संस्करण है (v{version})।',
  detailLatestRelease: 'GitHub पर नवीनतम रिलीज़: {tag}',
  detailPublished: 'प्रकाशित: {date}',
  msgUpdateAvailable: '{version} उपलब्ध है।',
  detailInstalledLatest: 'स्थापित: v{installed}\nनवीनतम:  {latest}',
  detailReleaseNotes: 'रिलीज़ नोट्स:',
  detailSeeReleasePage: 'बदलावों की सूची के लिए रिलीज़ पृष्ठ देखें।',
  dlgDontShowVersionAgain: 'यह संस्करण दोबारा न दिखाएँ',

  winLogsTitle: 'FreeCrawl — लॉग ({label})',
  winLabelPrimary: 'मुख्य',
  winVisualizationTitle: 'FreeCrawl — विज़ुअलाइज़ेशन',
  winLogAnalyzerTitle: 'FreeCrawl — लॉग विश्लेषक',

  dlgPlaywrightDetail:
    'यह लगभग 250 MB का एक-बार का डाउनलोड है, जो ऐप के भीतर ही चलता है — टर्मिनल की ज़रूरत नहीं। ब्राउज़र आपके यूज़र फ़ोल्डर में रखा जाता है; केवल बाइनरी, cdn.playwright.dev से डाउनलोड होती है।\n\nअब डाउनलोड करें?',
  msgBrowserInstallFailed:
    'Chromium का डाउनलोड पूरा नहीं हो सका।\n\n' +
    'अपना इंटरनेट कनेक्शन (या प्रॉक्सी सेटिंग्स) जाँचें और क्रॉल दोबारा शुरू करें — ' +
    'FreeCrawl डाउनलोड स्वतः फिर कोशिश करेगा। सफल होने तक JavaScript रेंडरिंग ' +
    'बंद रहेगी; टेक्स्ट-मोड क्रॉलिंग पर कोई असर नहीं पड़ता।',

  notifCrawlFinished: 'क्रॉल पूरा: {urls} URL · औसत {ms} ms',

  dlgSaveEncSnapshotTitle: 'एन्क्रिप्टेड स्नैपशॉट सहेजें…',
  msgEncSnapshotWritten: 'एन्क्रिप्टेड स्नैपशॉट लिखा गया: {size} MB।',
  detailEncSnapshotKeepPassword:
    'पासवर्ड सुरक्षित रखें — इसे वापस नहीं पाया जा सकता। इसके बिना फ़ाइल पढ़ी नहीं जा सकती।',
  dlgOpenEncProjectTitle: 'एन्क्रिप्टेड प्रोजेक्ट खोलें…',

  dlgChooseExportFolderTitle: '{format} एक्सपोर्ट के लिए फ़ोल्डर चुनें',
  msgBulkExportWritten: 'लिखी गई फ़ाइलें: {files}। कुल पंक्तियाँ: {rows}।',
  detailBulkExportErrors: 'त्रुटियाँ:',
  msgHtmlReportWritten: 'रिपोर्ट लिखी गई: {size} KB।',
  msgPdfReportWritten: 'PDF लिखी गई: {size} KB.',
  msgSeoAuditWritten: '{files} फ़ाइलें लिखी गईं ({rows} पंक्तियाँ)।',
  dlgCompareWithProjectTitle: 'प्रोजेक्ट से तुलना करें…',
  msgSitemapSharded:
    'खंडित साइटमैप लिखा गया: {parts} भागों + इंडेक्स में {urls} URL।',
  msgSitemapWritten: 'साइटमैप {urls} URL के साथ लिखा गया।',
  msgSitemapWrittenTruncated:
    'साइटमैप {urls} URL के साथ लिखा गया (50,000 की सीमा पर काटा गया)।',
  detailSitemapParts: 'भाग फ़ाइलें: {parts}, साथ में इंडेक्स',

  msgCouldNotOpenPath: '{path} नहीं खुल सका।',
  msgCouldNotOpenSelected: 'चुनी गई फ़ाइल नहीं खुल सकी।',
  msgImportCannotParseJson: 'JSON पार्स नहीं हो सका: {error}',
  msgDiagResetDone:
    'पुनः सक्रिय की गई चेतावनियाँ: {n}। मूल समस्या दोबारा होने पर वे फिर दिखेंगी।',

  filterFreeCrawlProject: 'FreeCrawl प्रोजेक्ट',
  filterFreeCrawlEncProject: 'FreeCrawl एन्क्रिप्टेड प्रोजेक्ट',
  filterAllFiles: 'सभी फ़ाइलें',
  filterLogFiles: 'लॉग फ़ाइलें',
  filterExcelWorkbook: 'Excel वर्कबुक',
  filterHtmlReport: 'HTML रिपोर्ट',
  filterPdfReport: 'PDF रिपोर्ट',
  filterImages: 'छवियाँ',
  filterXmlSitemap: 'XML साइटमैप',
  filterGzXmlSitemap: 'Gzip किया गया XML साइटमैप',

  spellUndetermined:
    'पृष्ठ की भाषा तय नहीं हो सकी — इसमें html[lang] घोषित नहीं है और पहचान के लिए पर्याप्त लेखन भी नहीं है।',
  spellUnsupported: 'यह LanguageTool एंडपॉइंट {lang} का समर्थन नहीं करता।',
  spellMismatchBailout:
    'LanguageTool ने जाँच रोक दी — पृष्ठ {lang} जैसा नहीं पढ़ा जाता। यदि यह गलत है, तो सेटिंग्स → वर्तनी में भाषा तय कर दें।',
  spellMismatchRatio:
    '{lang} मानकर जाँचने पर {pct}% शब्द चिह्नित हुए — पृष्ठ लगभग निश्चित रूप से किसी दूसरी भाषा में लिखा है, इसलिए परिणाम छोड़ दिए गए। यदि यह गलत है, तो सेटिंग्स → वर्तनी में भाषा तय कर दें।',
  spellTimeout: 'LanguageTool अनुरोध {s}s बाद टाइम आउट हो गया',
  spellHttpError: 'LanguageTool ने HTTP {status} लौटाया',

  dlgConfirmClearMsg: 'सारा क्रॉल डेटा साफ़ करें?',
  dlgConfirmClearDetail:
    'यह सक्रिय प्रोजेक्ट के हर क्रॉल किए गए URL, लिंक, छवि, हेडर और स्रोत स्नैपशॉट को स्थायी रूप से हटा देता है। इसे पूर्ववत नहीं किया जा सकता।',
  dlgDontAskAgain: 'मुझसे फिर न पूछें',
};
