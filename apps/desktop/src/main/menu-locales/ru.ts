/**
 * Russian native menu / tray / dialog labels.
 *
 * See `../menu-i18n.ts` for why the main process keeps its own copy of
 * these strings instead of importing the renderer's locale JSON.
 */
import type { MenuLabels } from '../menu-i18n.js';

export const MENU_RU: MenuLabels = {
  file: 'Файл',
  newProject: 'Новый проект',
  openProject: 'Открыть проект…',
  newProjectWindow: 'Новое окно проекта',
  openRecent: 'Открыть недавние',
  manageProjects: 'Управление проектами…',
  clearRecent: 'Очистить недавние',
  emptyRecent: '(пусто)',
  clearCrawlData: 'Очистить данные обхода',
  exportAs: 'Экспортировать данные обхода…',
  generateSitemap: 'Создать XML-sitemap',
  sitemapStandard: 'Стандартный…',
  sitemapImages: 'Изображения…',
  sitemapHreflang: 'Hreflang…',
  sitemapNews: 'Новости…',
  sitemapVideo: 'Видео…',
  exportHtmlReport: 'Экспортировать HTML-отчёт…',
  exportPdfReport: 'Экспорт PDF-отчёта…',
  exportSeoAudit: 'Экспорт SEO-аудита (формат Screaming Frog)…',
  bulkExport: 'Массовый экспорт…',
  exportSheets: 'Экспорт в Google Sheets…',
  exportBigquery: 'Экспорт в BigQuery…',
  compareWith: 'Сравнить с проектом…',
  scheduledCrawl: 'Обход по расписанию…',
  scheduledCrawlTooltip:
    'Настройка повторяющегося обхода внутри приложения для открытого проекта. Срабатывает только пока FreeCrawl запущен; для запусков, переживающих перезагрузку, используйте CLI и планировщик операционной системы.',
  saveProject: 'Сохранить проект',
  saveProjectAs: 'Сохранить проект как…',
  titleUntitledProject: 'Проект без названия',
  titleSaving: 'Сохранение…',
  dlgSaveProjectAsTitle: 'Сохранить проект как…',
  dlgExportTableTitle: 'Экспорт таблицы',
  dlgSaveFailedTitle: 'Не удалось сохранить проект',
  msgProjectSaved:
    'Сохранено одним сжатым файлом: {size} МБ (было {from} МБ).',
  dlgUnsavedTitle: 'Несохранённые изменения',
  msgUnsavedChanges: 'В этом проекте есть изменения, которые ещё не сохранены.',
  detailUnsavedChanges:
    'Результаты обхода хранятся в рабочей копии, пока вы не сохраните их в файл проекта.',
  btnSaveChanges: 'Сохранить',
  btnDiscardChanges: 'Не сохранять',
  saveProjectEncrypted: 'Сохранить зашифрованный снимок…',
  saveProjectEncryptedTooltip:
    'Экспортирует активный проект в файл .seoproject.enc, зашифрованный алгоритмом AES-256-GCM и защищённый паролем.',
  openProjectEncrypted: 'Открыть зашифрованный проект…',
  openProjectEncryptedTooltip:
    'Расшифровывает снимок .seoproject.enc его паролем и открывает восстановленный проект.',
  settings: 'Настройки…',
  edit: 'Правка',
  copy: 'Копировать',
  view: 'Вид',
  overviewSidebar: 'Боковая панель обзора',
  detailPanel: 'Панель деталей',
  fullscreen: 'Во весь экран',
  theme: 'Тема',
  themeDark: 'Тёмная',
  themeLight: 'Светлая',
  visualization: 'Визуализация',
  openVisualizationWindow: 'Открыть окно визуализации…',
  reports: 'Отчёты',
  reportsItem: 'Отчёты…',
  logAnalyzer: 'Анализатор логов',
  openLogAnalyzerWindow: 'Открыть окно анализатора логов…',
  openLogAnalyzerWindowTooltip:
    'Анализ серверных логов доступа (Apache / Nginx / IIS) — обращения ботов по URL, краулинговый бюджет и поиск осиротевших страниц на стыке обхода и логов, в отдельном окне.',
  help: 'Справка',
  documentation: 'Документация',
  showLogs: 'Показать логи…',
  trayShow: 'Показать FreeCrawl',
  trayHide: 'Свернуть в трей',
  trayStopCrawl: 'Остановить обход',
  trayQuit: 'Выйти из FreeCrawl',
  openLogsFolder: 'Открыть папку логов',
  openLogsFolderTooltip:
    'Открывает каталог, где на диске хранятся ротируемые файлы логов',
  robotsTester: 'Тестер robots.txt…',
  sitemapValidator: 'Валидатор sitemap…',
  resetDiagnostics: 'Сбросить диагностические предупреждения',
  resetDiagnosticsTooltip:
    'Снова включает всплывающие предупреждения, скрытые вами через «Больше не показывать»',
  deleteDomainData: 'Удалить данные домена…',
  deleteDomainDataTooltip:
    'Удаление по домену в соответствии с GDPR. Убирает каждую строку URL, чей хост совпадает с указанным доменом, вместе со всеми зависимыми записями (ссылки, заголовки, изображения, снимки исходного кода).',
  clearAllData: 'Удалить все данные…',
  clearAllDataTooltip:
    'Полностью очищает активный проект (URL, ссылки, изображения, заголовки, снимки исходного кода, sitemap). Отменить нельзя — сначала используйте «Сохранить проект как…», если нужна резервная копия.',
  checkForUpdates: 'Проверить обновления…',
  checkForUpdatesTooltip:
    'Получает последний релиз с GitHub и сравнивает его с установленной версией. Фоновых опросов нет: запускается только по нажатию.',
  about: 'О программе FreeCrawl SEO',

  ctxCopy: 'Копировать',
  ctxOpenInBrowser: 'Открыть в браузере',
  ctxRespider: 'Обойти заново',
  ctxStartCrawlFirst: 'Сначала запустите обход',
  ctxRemove: 'Удалить',
  ctxOpenRobotsTxt: 'Открыть robots.txt',
  ctxCopyNUrls: 'Копировать {n} URL',
  ctxOpenNUrlsInBrowser: 'Открыть {n} URL в браузере',
  ctxOpenLimitTooltip: 'Не более 20 URL, чтобы не открывать слишком много вкладок',
  ctxRespiderNUrls: 'Обойти заново {n} URL',
  ctxRemoveNUrls: 'Удалить {n} URL',
  ctxExportNUrlsAsCsv: 'Экспортировать {n} URL в CSV…',
  ctxCopyCell: 'Копировать ячейку',
  ctxCopyNCells: 'Копировать ячейки: {n}',
  ctxCopyRow: 'Копировать строку',
  ctxCopyNRows: 'Копировать строки: {n}',
  ctxCopyColumn: 'Копировать столбец',
  ctxCopyNColumns: 'Копировать столбцы: {n}',

  btnOk: 'ОК',
  btnCancel: 'Отмена',
  btnClose: 'Закрыть',
  btnClear: 'Очистить',
  btnOpenFolder: 'Открыть папку',
  btnLater: 'Позже',
  btnOpenReleasePage: 'Открыть страницу релиза',
  btnOpenReleasesPage: 'Открыть страницу релизов',
  btnDownloadInstaller: 'Скачать установщик',
  btnDownloadNow: 'Скачать сейчас',
  btnSkipJsRender: 'Пропустить — отключить JS-рендеринг для этого запуска',

  dlgOpenProjectTitle: 'Открыть проект',
  dlgOpenProjectFailedTitle: 'Не удалось открыть проект',
  dlgLogsFolderUnavailableTitle: 'Папка логов недоступна',
  dlgLogsFolderUnavailableMsg:
    'Запись логов на диск не инициализирована. В этой сессии логи хранятся только в памяти.',
  dlgDiagResetTitle: 'Диагностические предупреждения сброшены',
  dlgDiagResetNoneMsg: 'Нет скрытых диагностических предупреждений для сброса.',
  dlgDownloadCompleteTitle: 'Загрузка завершена',
  dlgDownloadFailedTitle: 'Загрузка не удалась',
  dlgDownloadStartFailedMsg: 'Не удалось начать загрузку.',
  dlgUpdateCheckFailedTitle: 'Проверка обновлений не удалась',
  dlgUpdateCheckFailedMsg: 'Не удалось связаться с API релизов GitHub.',
  dlgUpToDateTitle: 'Установлена последняя версия',
  dlgUpdateAvailableTitle: 'Доступно обновление',
  dlgOpenAccessLogTitle: 'Открыть лог доступа',
  dlgExportLogAnalysisTitle: 'Экспорт анализа логов',
  dlgExportExtractionRulesTitle: 'Экспорт правил извлечения',
  dlgImportExtractionRulesTitle: 'Импорт правил извлечения',
  dlgExportSettingsTitle: 'Экспорт настроек',
  dlgImportSettingsTitle: 'Импорт настроек',
  dlgImportFailedTitle: 'Импорт не удался',
  dlgImportFailedNoSettingsMsg:
    'Импортированный файл не содержит объекта настроек.',
  dlgChooseFolderTitle: 'Выбор папки',
  dlgPlaywrightTitle: 'JavaScript-рендеринг — браузер отсутствует',
  dlgPlaywrightMsg:
    'Playwright должен загрузить браузер Chromium, прежде чем JavaScript-рендеринг сможет работать.',
  dlgBrowserInstallFailedTitle: 'Установка браузера не удалась',
  dlgProjectSavedTitle: 'Проект сохранён',
  dlgEncSnapshotSavedTitle: 'Зашифрованный снимок сохранён',
  dlgSaveDecryptedProjectTitle: 'Сохранить расшифрованный проект как…',
  dlgBulkExportFolderTitle: 'Массовый экспорт — выберите папку для вывода',
  dlgBulkExportCompleteTitle: 'Массовый экспорт завершён',
  dlgHtmlReportSavedTitle: 'HTML-отчёт сохранён',
  dlgPdfReportSavedTitle: 'PDF-отчёт сохранён',
  dlgSeoAuditFolderTitle: 'Выберите папку для экспорта SEO-аудита',
  dlgSeoAuditCompleteTitle: 'Экспорт SEO-аудита завершён',
  dlgPickLogoTitle: 'Выберите логотип для отчёта',
  msgLogoTooLarge: 'Логотип должен быть не больше 1 МБ.',
  dlgSitemapGeneratedTitle: 'Sitemap создан',

  diagDnsRefusedTitle: 'Нет сетевого подключения',
  diagDnsRefusedMsg:
    'FreeCrawl выполнил DNS-запрос по трём уровням (системный, публичные серверы на порту 53 и DNS-over-HTTPS на порту 443) — все они были отклонены. Похоже, на этом компьютере нет работающего подключения к интернету.',
  diagDnsRefusedDetail:
    'FreeCrawl уже пытается автоматически обойти неработающий системный DNS — если вы видите это окно, значит не сработал даже DNS-over-HTTPS через порт 443.\n\n' +
    'Наиболее вероятные причины (по порядку):\n' +
    '  1. Антивирус или система защиты рабочих станций не даёт FreeCrawl установить НИ ОДНО исходящее соединение. Добавьте FreeCrawl в список разрешённых программ.\n' +
    '  2. Нет подключения к интернету — проверьте Wi-Fi или Ethernet.\n' +
    '  3. Корпоративный брандмауэр блокирует весь исходящий трафик — задайте HTTPS_PROXY в «Настройки → Сеть».\n' +
    '  4. Активный VPN находится в нерабочем состоянии — отключите его и попробуйте снова.\n\n' +
    'Нажмите «Открыть журналы», чтобы увидеть всю цепочку ошибок.',
  diagDnsDestroyedTitle: 'Сетевой стек не отвечает',
  diagDnsDestroyedMsg:
    'DNS-резолвер системы аварийно завершился, И автоматический обход FreeCrawl через DNS-over-HTTPS тоже не сработал. Это значит, что нарушена работа всего сетевого стека, а не только DNS.',
  diagDnsDestroyedDetail:
    'Обычно FreeCrawl восстанавливается после сбоя службы DNS-клиента Windows, направляя запросы через Cloudflare/Google по HTTPS:443. Если вы видите это окно, этот резервный путь тоже не сработал — как правило, потому что сетевой стек операционной системы нужно сбросить.\n\n' +
    'Попробуйте один из вариантов (от простого к сложному):\n' +
    '  1. Включите и выключите режим «в самолёте» либо отключите и снова подключите Wi-Fi.\n' +
    '  2. Перезапустите сетевой адаптер («Параметры → Сеть → Настройка параметров адаптера»).\n' +
    '  3. Откройте «services.msc», найдите «DNS-клиент», щёлкните правой кнопкой → «Перезапустить» (только Windows).\n' +
    '  4. В крайнем случае перезагрузите компьютер.\n\n' +
    'Нажмите «Открыть журналы», чтобы увидеть всю цепочку ошибок.',
  diagTlsTitle: 'TLS-сертификат отклонён',
  diagTlsMsg:
    'TLS-сертификат не прошёл проверку — обычно из-за того, что антивирус или корпоративный прокси перехватывает HTTPS.',
  diagTlsDetail:
    'Обычные виновники: Kaspersky, ESET, Bitdefender, Zscaler, BlueCoat, Fortigate.\n\n' +
    'Попробуйте один из вариантов:\n' +
    '  1. Добавьте FreeCrawl в список разрешённых программ антивируса.\n' +
    '  2. Экспортируйте корневой сертификат антивируса или прокси в формате PEM и перед запуском укажите путь к нему в переменной окружения NODE_EXTRA_CA_CERTS.\n' +
    '  3. Временно отключите проверку HTTPS в антивирусе.\n\n' +
    'Нажмите «Открыть журналы», чтобы увидеть всю цепочку ошибок.',
  diagSeedTitle: 'Начальный URL недоступен',
  diagSeedMsg:
    'FreeCrawl не смог обратиться к указанному URL — ни HTTPS, ни HTTP не ответили за 5 секунд.',
  diagSeedDetail:
    'Попробуйте один из вариантов:\n' +
    '  1. Откройте URL в браузере, чтобы убедиться, что сайт работает.\n' +
    '  2. Проверьте подключение к интернету.\n' +
    '  3. Если вы используете VPN или находитесь за корпоративным прокси, задайте HTTPS_PROXY перед запуском либо настройте «Настройки → Сеть → URL прокси».\n' +
    '  4. Проверьте правильность написания URL (опечатки в имени хоста).\n\n' +
    'Нажмите «Открыть журналы», чтобы посмотреть диагностический след.',
  btnOpenLogs: 'Открыть журналы',
  btnDismiss: 'Закрыть',
  dlgDontShowAgain: 'Больше не показывать',

  msgDownloadComplete: '{name} загружен.',
  detailDownloadSaved:
    'Сохранено в:\n{path}\n\nПапка загрузок открыта — дважды щёлкните установщик, чтобы обновиться.',
  detailDownloadSmartScreen:
    'Windows SmartScreen может показать «Нераспознанное приложение», так как установщик не подписан. Нажмите «Подробнее → Выполнить в любом случае», чтобы продолжить.',
  detailDownloadGatekeeper:
    'Gatekeeper в macOS может заблокировать приложение при первом открытии, так как оно не нотаризовано. Щёлкните .dmg правой кнопкой → «Открыть», чтобы обойти блокировку.',
  msgDownloadFailed: 'Не удалось загрузить {name}',
  detailDownloadFailed:
    'Состояние загрузки: {state}\n\nПовторить попытку можно на странице GitHub Releases.',
  msgUnknownErrorGitHub: 'Неизвестная ошибка при обращении к GitHub',
  msgNoReleaseTag: 'В ответе нет тега выпуска.',
  detailBrowseReleases: 'Список выпусков можно посмотреть вручную:\n{url}',
  msgUpToDate: 'У вас установлена последняя версия (v{version}).',
  detailLatestRelease: 'Последний выпуск на GitHub: {tag}',
  detailPublished: 'Опубликован: {date}',
  msgUpdateAvailable: 'Доступна версия {version}.',
  detailInstalledLatest: 'Установлена: v{installed}\nПоследняя:   {latest}',
  detailReleaseNotes: 'Описание выпуска:',
  detailSeeReleasePage: 'Список изменений смотрите на странице выпуска.',
  dlgDontShowVersionAgain: 'Больше не показывать эту версию',

  winLogsTitle: 'FreeCrawl — журналы ({label})',
  winLabelPrimary: 'Основной',
  winVisualizationTitle: 'FreeCrawl — визуализация',
  winLogAnalyzerTitle: 'FreeCrawl — анализатор журналов',

  dlgPlaywrightDetail:
    'Это разовая загрузка объёмом около 250 МБ, которая выполняется внутри приложения — терминал не нужен. Браузер сохраняется в пользовательской папке; загружается только бинарный файл, с cdn.playwright.dev.\n\nЗагрузить сейчас?',
  msgBrowserInstallFailed:
    'Не удалось завершить загрузку Chromium.\n\n' +
    'Проверьте подключение к интернету (или настройки прокси) и запустите обход заново — ' +
    'FreeCrawl автоматически повторит загрузку. Рендеринг JavaScript останется ' +
    'отключённым до успешной загрузки; на текстовый режим обхода это не влияет.',

  notifCrawlFinished: 'Обход завершён: {urls} URL · в среднем {ms} мс',

  dlgSaveEncSnapshotTitle: 'Сохранить зашифрованный снимок…',
  msgEncSnapshotWritten: 'Зашифрованный снимок записан: {size} МБ.',
  detailEncSnapshotKeepPassword:
    'Храните пароль в надёжном месте — восстановить его невозможно. Без пароля файл не читается.',
  dlgOpenEncProjectTitle: 'Открыть зашифрованный проект…',

  dlgChooseExportFolderTitle: 'Выберите папку для экспорта в {format}',
  msgBulkExportWritten: 'Записано файлов: {files}. Строк всего: {rows}.',
  detailBulkExportErrors: 'Ошибки:',
  msgHtmlReportWritten: 'Отчёт записан: {size} КБ.',
  msgPdfReportWritten: 'PDF записан: {size} КБ.',
  msgSeoAuditWritten: 'Записано файлов: {files} (строк: {rows}).',
  dlgCompareWithProjectTitle: 'Сравнить с проектом…',
  msgSitemapSharded:
    'Карта сайта записана по частям: {urls} URL в {parts} частях + индекс.',
  msgSitemapWritten: 'Карта сайта записана, URL в ней: {urls}.',
  msgSitemapWrittenTruncated:
    'Карта сайта записана, URL в ней: {urls} (обрезано по лимиту 50 000).',
  detailSitemapParts: 'Файлов частей: {parts}, плюс индекс',

  msgCouldNotOpenPath: 'Не удалось открыть {path}.',
  msgCouldNotOpenSelected: 'Не удалось открыть выбранный файл.',
  msgImportCannotParseJson: 'Не удалось разобрать JSON: {error}',
  msgDiagResetDone:
    'Снова включено предупреждений: {n}. Они появятся опять, когда исходная проблема возникнет снова.',

  filterFreeCrawlProject: 'Проект FreeCrawl',
  filterFreeCrawlEncProject: 'Зашифрованный проект FreeCrawl',
  filterAllFiles: 'Все файлы',
  filterLogFiles: 'Файлы журналов',
  filterExcelWorkbook: 'Книга Excel',
  filterHtmlReport: 'Отчёт HTML',
  filterPdfReport: 'PDF-отчёт',
  filterImages: 'Изображения',
  filterXmlSitemap: 'Карта сайта XML',
  filterGzXmlSitemap: 'Карта сайта XML, сжатая gzip',

  spellUndetermined:
    'Не удалось определить язык страницы — в ней не объявлен html[lang], а текста слишком мало для распознавания.',
  spellUnsupported: 'Этот сервер LanguageTool не поддерживает {lang}.',
  spellMismatchBailout:
    'LanguageTool прекратил проверку — страница не читается как {lang}. Если это ошибка, закрепите язык в «Настройки → Орфография».',
  spellMismatchRatio:
    'При проверке как {lang} помечено {pct}% слов — страница почти наверняка написана на другом языке, поэтому результаты отброшены. Если это ошибка, закрепите язык в «Настройки → Орфография».',
  spellTimeout: 'Запрос к LanguageTool завершился по тайм-ауту через {s} с',
  spellHttpError: 'LanguageTool вернул HTTP {status}',

  dlgConfirmClearMsg: 'Очистить все данные обхода?',
  dlgConfirmClearDetail:
    'Это безвозвратно удалит каждый обойдённый URL, ссылку, изображение, заголовок и снимок исходного кода в активном проекте. Отменить нельзя.',
  dlgDontAskAgain: 'Больше не спрашивать',
};
