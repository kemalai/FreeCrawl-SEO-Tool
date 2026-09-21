/**
 * Italian native menu / tray / dialog labels.
 *
 * See `../menu-i18n.ts` for why the main process keeps its own copy of
 * these strings instead of importing the renderer's locale JSON.
 */
import type { MenuLabels } from '../menu-i18n.js';

export const MENU_IT: MenuLabels = {
  file: 'File',
  newProject: 'Nuovo progetto',
  openProject: 'Apri progetto…',
  newProjectWindow: 'Nuova finestra progetto',
  openRecent: 'Apri recenti',
  manageProjects: 'Gestisci progetti…',
  clearRecent: 'Cancella recenti',
  emptyRecent: '(vuoto)',
  clearCrawlData: 'Cancella dati della scansione',
  exportAs: 'Esporta dati della scansione…',
  generateSitemap: 'Genera sitemap XML',
  sitemapStandard: 'Standard…',
  sitemapImages: 'Immagini…',
  sitemapHreflang: 'Hreflang…',
  sitemapNews: 'Notizie…',
  sitemapVideo: 'Video…',
  exportHtmlReport: 'Esporta report HTML…',
  exportPdfReport: 'Esporta report PDF…',
  exportSeoAudit: 'Esporta audit SEO (layout Screaming Frog)…',
  bulkExport: 'Esportazione in blocco…',
  exportSheets: 'Esporta su Google Sheets…',
  exportBigquery: 'Esporta su BigQuery…',
  compareWith: 'Confronta con progetto…',
  scheduledCrawl: 'Scansione pianificata…',
  scheduledCrawlTooltip:
    'Imposta una scansione ricorrente nell’applicazione per il progetto aperto. Si attiva solo mentre FreeCrawl è aperto; usa la CLI con lo scheduler del sistema per attivazioni che sopravvivano a un riavvio.',
  saveProject: 'Salva progetto',
  saveProjectAs: 'Salva progetto con nome…',
  titleUntitledProject: 'Progetto senza titolo',
  titleSaving: 'Salvataggio…',
  dlgSaveProjectAsTitle: 'Salva progetto con nome…',
  dlgExportTableTitle: 'Esporta tabella',
  dlgSaveFailedTitle: 'Impossibile salvare il progetto',
  msgProjectSaved:
    'Salvato come singolo file compresso: {size} MB (da {from} MB).',
  dlgUnsavedTitle: 'Modifiche non salvate',
  msgUnsavedChanges: 'Questo progetto contiene modifiche non ancora salvate.',
  detailUnsavedChanges:
    'I risultati della scansione restano in una copia di lavoro finché non li salvi nel file di progetto.',
  btnSaveChanges: 'Salva',
  btnDiscardChanges: 'Non salvare',
  saveProjectEncrypted: 'Salva snapshot cifrato…',
  saveProjectEncryptedTooltip:
    'Esporta il progetto attivo in un file .seoproject.enc cifrato con AES-256-GCM e protetto da password.',
  openProjectEncrypted: 'Apri progetto cifrato…',
  openProjectEncryptedTooltip:
    'Decifra uno snapshot .seoproject.enc con la sua password e apre il progetto recuperato.',
  settings: 'Impostazioni…',
  edit: 'Modifica',
  copy: 'Copia',
  view: 'Visualizza',
  overviewSidebar: 'Barra laterale panoramica',
  detailPanel: 'Pannello dettagli',
  fullscreen: 'Schermo intero',
  theme: 'Tema',
  themeDark: 'Scuro',
  themeLight: 'Chiaro',
  visualization: 'Visualizzazione',
  openVisualizationWindow: 'Apri finestra di visualizzazione…',
  reports: 'Report',
  reportsItem: 'Report…',
  logAnalyzer: 'Analizzatore di log',
  openLogAnalyzerWindow: 'Apri finestra dell’analizzatore di log…',
  openLogAnalyzerWindowTooltip:
    'Analizza i log di accesso del server (Apache / Nginx / IIS) — visite dei bot per URL, budget di scansione e rilevamento delle pagine orfane incrociando scansione e log, in una finestra indipendente.',
  help: 'Aiuto',
  documentation: 'Documentazione',
  showLogs: 'Mostra log…',
  trayShow: 'Mostra FreeCrawl',
  trayHide: 'Riduci nell’area di notifica',
  trayStopCrawl: 'Interrompi scansione',
  trayQuit: 'Esci da FreeCrawl',
  openLogsFolder: 'Apri cartella dei log',
  openLogsFolderTooltip:
    'Apre la directory in cui i file di log ruotati sono conservati su disco',
  robotsTester: 'Tester robots.txt…',
  sitemapValidator: 'Validatore di sitemap…',
  resetDiagnostics: 'Reimposta avvisi diagnostici',
  resetDiagnosticsTooltip:
    'Riattiva gli avvisi che avevi chiuso con «Non mostrare più»',
  deleteDomainData: 'Elimina dati di un dominio…',
  deleteDomainDataTooltip:
    'Cancellazione per dominio conforme al GDPR. Rimuove ogni riga di URL il cui host corrisponde al dominio inserito, insieme a tutti i record dipendenti (link, header, immagini, snapshot del codice sorgente).',
  clearAllData: 'Cancella tutti i dati…',
  clearAllDataTooltip:
    'Svuota completamente il progetto attivo (URL, link, immagini, header, snapshot del codice sorgente, sitemap). Non è reversibile — usa prima Salva progetto con nome… se vuoi un backup.',
  checkForUpdates: 'Controlla aggiornamenti…',
  checkForUpdatesTooltip:
    'Recupera l’ultima release pubblicata su GitHub e la confronta con la versione installata. Nessun controllo in background: viene eseguito solo quando fai clic.',
  about: 'Informazioni su FreeCrawl SEO',

  ctxCopy: 'Copia',
  ctxOpenInBrowser: 'Apri nel browser',
  ctxRespider: 'Scansiona di nuovo',
  ctxStartCrawlFirst: 'Avvia prima una scansione',
  ctxRemove: 'Rimuovi',
  ctxOpenRobotsTxt: 'Apri robots.txt',
  ctxCopyNUrls: 'Copia {n} URL',
  ctxOpenNUrlsInBrowser: 'Apri {n} URL nel browser',
  ctxOpenLimitTooltip: 'Limitato a 20 URL per non aprire troppe schede',
  ctxRespiderNUrls: 'Scansiona di nuovo {n} URL',
  ctxRemoveNUrls: 'Rimuovi {n} URL',
  ctxExportNUrlsAsCsv: 'Esporta {n} URL come CSV…',
  ctxCopyCell: 'Copia cella',
  ctxCopyNCells: 'Copia {n} celle',
  ctxCopyRow: 'Copia riga',
  ctxCopyNRows: 'Copia {n} righe',
  ctxCopyColumn: 'Copia colonna',
  ctxCopyNColumns: 'Copia {n} colonne',

  btnOk: 'OK',
  btnCancel: 'Annulla',
  btnClose: 'Chiudi',
  btnClear: 'Cancella',
  btnOpenFolder: 'Apri cartella',
  btnLater: 'Più tardi',
  btnOpenReleasePage: 'Apri pagina della release',
  btnOpenReleasesPage: 'Apri pagina delle release',
  btnDownloadInstaller: 'Scarica il programma di installazione',
  btnDownloadNow: 'Scarica ora',
  btnSkipJsRender: 'Salta — disattiva il rendering JS per questa esecuzione',

  dlgOpenProjectTitle: 'Apri progetto',
  dlgOpenProjectFailedTitle: 'Apertura del progetto non riuscita',
  dlgLogsFolderUnavailableTitle: 'Cartella dei log non disponibile',
  dlgLogsFolderUnavailableMsg:
    'La registrazione su disco non è stata inizializzata. In questa sessione i log sono conservati solo in memoria.',
  dlgDiagResetTitle: 'Avvisi diagnostici reimpostati',
  dlgDiagResetNoneMsg: 'Nessun avviso diagnostico silenziato da reimpostare.',
  dlgDownloadCompleteTitle: 'Download completato',
  dlgDownloadFailedTitle: 'Download non riuscito',
  dlgDownloadStartFailedMsg: 'Impossibile avviare il download.',
  dlgUpdateCheckFailedTitle: 'Controllo aggiornamenti non riuscito',
  dlgUpdateCheckFailedMsg: 'Impossibile raggiungere l’API delle release di GitHub.',
  dlgUpToDateTitle: 'Aggiornato',
  dlgUpdateAvailableTitle: 'Aggiornamento disponibile',
  dlgOpenAccessLogTitle: 'Apri log di accesso',
  dlgExportLogAnalysisTitle: 'Esporta analisi dei log',
  dlgExportExtractionRulesTitle: 'Esporta regole di estrazione',
  dlgImportExtractionRulesTitle: 'Importa regole di estrazione',
  dlgExportSettingsTitle: 'Esporta impostazioni',
  dlgImportSettingsTitle: 'Importa impostazioni',
  dlgImportFailedTitle: 'Importazione non riuscita',
  dlgImportFailedNoSettingsMsg:
    'Il file importato non contiene un oggetto di impostazioni.',
  dlgChooseFolderTitle: 'Scegli cartella',
  dlgPlaywrightTitle: 'Rendering JavaScript — browser mancante',
  dlgPlaywrightMsg:
    'Playwright deve scaricare un browser Chromium prima che il rendering JavaScript possa funzionare.',
  dlgBrowserInstallFailedTitle: 'Installazione del browser non riuscita',
  dlgProjectSavedTitle: 'Progetto salvato',
  dlgEncSnapshotSavedTitle: 'Snapshot cifrato salvato',
  dlgSaveDecryptedProjectTitle: 'Salva progetto decifrato con nome…',
  dlgBulkExportFolderTitle: 'Esportazione in blocco — scegli la cartella di output',
  dlgBulkExportCompleteTitle: 'Esportazione in blocco completata',
  dlgHtmlReportSavedTitle: 'Report HTML salvato',
  dlgPdfReportSavedTitle: 'Report PDF salvato',
  dlgSeoAuditFolderTitle: 'Scegli una cartella per l\'esportazione dell\'audit SEO',
  dlgSeoAuditCompleteTitle: 'Esportazione audit SEO completata',
  dlgPickLogoTitle: 'Scegli un logo per il report',
  msgLogoTooLarge: 'Il logo deve pesare 1 MB o meno.',
  dlgSitemapGeneratedTitle: 'Sitemap generata',

  diagDnsRefusedTitle: 'Nessuna connettività di rete',
  diagDnsRefusedMsg:
    'FreeCrawl ha tentato la risoluzione DNS su 3 livelli (sistema, server pubblici sulla porta 53 e DNS-over-HTTPS sulla porta 443): tutti sono stati rifiutati. Il computer sembra non avere una connessione internet funzionante.',
  diagDnsRefusedDetail:
    'FreeCrawl tenta già di aggirare automaticamente un DNS di sistema guasto: se vedi questa finestra, anche il DNS-over-HTTPS sulla porta 443 non ha funzionato.\n\n' +
    'Cause più probabili (in ordine):\n' +
    '  1. L\'antivirus o la sicurezza endpoint impedisce a FreeCrawl QUALSIASI connessione in uscita. Autorizza FreeCrawl nel tuo software di sicurezza.\n' +
    '  2. Non sei connesso a internet: controlla il Wi-Fi o il cavo Ethernet.\n' +
    '  3. Un firewall aziendale blocca tutto il traffico in uscita: imposta HTTPS_PROXY in Impostazioni → Rete.\n' +
    '  4. Una VPN attiva è in uno stato inconsistente: disconnettila e riprova.\n\n' +
    'Fai clic su "Apri log" per vedere la catena completa degli errori.',
  diagDnsDestroyedTitle: 'Stack di rete non risponde',
  diagDnsDestroyedMsg:
    'Il resolver DNS del sistema si è arrestato E anche l\'aggiramento automatico di FreeCrawl tramite DNS-over-HTTPS non ha funzionato. Significa che è lo stack di rete a essere guasto, non solo il DNS.',
  diagDnsDestroyedDetail:
    'Normalmente FreeCrawl recupera da un Client DNS di Windows arrestato instradando le richieste tramite Cloudflare/Google su HTTPS:443. Se vedi questo messaggio, anche quel ripiego ha fallito, di solito perché lo stack di rete del sistema operativo ha bisogno di un ripristino.\n\n' +
    'Prova una di queste soluzioni (dalla più semplice alla più impegnativa):\n' +
    '  1. Attiva e disattiva la modalità aereo, oppure disconnetti e riconnetti il Wi-Fi.\n' +
    '  2. Riavvia la scheda di rete (Impostazioni → Rete → Modifica opzioni scheda).\n' +
    '  3. Apri "services.msc", individua "DNS Client", clic destro → Riavvia (solo Windows).\n' +
    '  4. Come ultima risorsa, riavvia il computer.\n\n' +
    'Fai clic su "Apri log" per vedere la catena completa degli errori.',
  diagTlsTitle: 'Certificato TLS rifiutato',
  diagTlsMsg:
    'Un certificato TLS non ha superato la verifica, di solito perché un antivirus o un proxy aziendale intercetta l\'HTTPS.',
  diagTlsDetail:
    'Responsabili più comuni: Kaspersky, ESET, Bitdefender, Zscaler, BlueCoat, Fortigate.\n\n' +
    'Prova una di queste soluzioni:\n' +
    '  1. Autorizza FreeCrawl nel tuo antivirus.\n' +
    '  2. Esporta la CA radice dell\'antivirus o del proxy in formato PEM e fai puntare la variabile d\'ambiente NODE_EXTRA_CA_CERTS a quel file prima dell\'avvio.\n' +
    '  3. Disattiva temporaneamente la scansione HTTPS nel tuo antivirus.\n\n' +
    'Fai clic su "Apri log" per vedere la catena completa degli errori.',
  diagSeedTitle: 'URL iniziale non raggiungibile',
  diagSeedMsg:
    'FreeCrawl non è riuscito a raggiungere l\'URL inserito: né HTTPS né HTTP hanno risposto entro 5 secondi.',
  diagSeedDetail:
    'Prova una di queste soluzioni:\n' +
    '  1. Apri l\'URL in un browser per verificare che il sito sia attivo.\n' +
    '  2. Controlla la connessione a internet.\n' +
    '  3. Se usi una VPN o sei dietro un proxy aziendale, imposta HTTPS_PROXY prima dell\'avvio oppure configura Impostazioni → Rete → URL del proxy.\n' +
    '  4. Verifica che l\'URL sia scritto correttamente (errori di battitura nell\'host).\n\n' +
    'Fai clic su "Apri log" per consultare la traccia diagnostica.',
  btnOpenLogs: 'Apri log',
  btnDismiss: 'Ignora',
  dlgDontShowAgain: 'Non mostrare più questo messaggio',

  msgDownloadComplete: '{name} scaricato.',
  detailDownloadSaved:
    'Salvato in:\n{path}\n\nLa cartella dei download è stata aperta: fai doppio clic sull\'installer per aggiornare.',
  detailDownloadSmartScreen:
    'Windows SmartScreen potrebbe mostrare "App non riconosciuta" perché l\'installer non è firmato digitalmente. Fai clic su "Ulteriori informazioni → Esegui comunque" per procedere.',
  detailDownloadGatekeeper:
    'Gatekeeper di macOS potrebbe bloccare l\'app alla prima apertura perché non è notarizzata. Clic destro sul .dmg → Apri per aggirare il blocco.',
  msgDownloadFailed: 'Impossibile scaricare {name}',
  detailDownloadFailed:
    'Stato del download: {state}\n\nPuoi riprovare dalla pagina GitHub Releases.',
  msgUnknownErrorGitHub: 'Errore sconosciuto durante il contatto con GitHub',
  msgNoReleaseTag: 'Nessun tag di versione nella risposta.',
  detailBrowseReleases: 'Puoi consultare le versioni manualmente qui:\n{url}',
  msgUpToDate: 'Stai usando la versione più recente (v{version}).',
  detailLatestRelease: 'Ultima versione su GitHub: {tag}',
  detailPublished: 'Pubblicata il: {date}',
  msgUpdateAvailable: 'La versione {version} è disponibile.',
  detailInstalledLatest: 'Installata: v{installed}\nUltima:     {latest}',
  detailReleaseNotes: 'Note di versione:',
  detailSeeReleasePage: 'Consulta la pagina della versione per il changelog.',
  dlgDontShowVersionAgain: 'Non mostrare più questa versione',

  winLogsTitle: 'FreeCrawl — Log ({label})',
  winLabelPrimary: 'Principale',
  winVisualizationTitle: 'FreeCrawl — Visualizzazione',
  winLogAnalyzerTitle: 'FreeCrawl — Analizzatore di log',

  dlgPlaywrightDetail:
    'È un download una tantum di circa 250 MB che avviene dentro l\'applicazione, senza terminale. Il browser viene salvato nella tua cartella utente; viene scaricato solo il binario, da cdn.playwright.dev.\n\nScaricare adesso?',
  msgBrowserInstallFailed:
    'Il download di Chromium non è stato completato.\n\n' +
    'Controlla la connessione a internet (o le impostazioni del proxy) e riavvia la scansione: ' +
    'FreeCrawl riprova automaticamente il download. Il rendering JavaScript resta ' +
    'disattivato fino a quando non riesce; la scansione in modalità testo non è interessata.',

  notifCrawlFinished: 'Scansione completata: {urls} URL · media {ms} ms',

  dlgSaveEncSnapshotTitle: 'Salva snapshot crittografato…',
  msgEncSnapshotWritten: 'Snapshot crittografato scritto: {size} MB.',
  detailEncSnapshotKeepPassword:
    'Conserva la password in un luogo sicuro: non può essere recuperata. Senza di essa il file è illeggibile.',
  dlgOpenEncProjectTitle: 'Apri progetto crittografato…',

  dlgChooseExportFolderTitle: 'Scegli la cartella per l\'esportazione {format}',
  msgBulkExportWritten: 'File scritti: {files}. Righe in totale: {rows}.',
  detailBulkExportErrors: 'Errori:',
  msgHtmlReportWritten: 'Report scritto: {size} KB.',
  msgPdfReportWritten: 'PDF scritto: {size} KB.',
  msgSeoAuditWritten: '{files} file scritti ({rows} righe).',
  dlgCompareWithProjectTitle: 'Confronta con progetto…',
  msgSitemapSharded:
    'Sitemap suddivisa scritta: {urls} URL distribuite su {parts} parti + indice.',
  msgSitemapWritten: 'Sitemap scritta con {urls} URL.',
  msgSitemapWrittenTruncated:
    'Sitemap scritta con {urls} URL (troncata al limite di 50.000).',
  detailSitemapParts: 'File di parte: {parts}, più l\'indice',

  msgCouldNotOpenPath: 'Impossibile aprire {path}.',
  msgCouldNotOpenSelected: 'Impossibile aprire il file selezionato.',
  msgImportCannotParseJson: 'Impossibile analizzare il JSON: {error}',
  msgDiagResetDone:
    'Avvisi riattivati: {n}. Ricompariranno alla prossima occorrenza del problema che li causa.',

  filterFreeCrawlProject: 'Progetto FreeCrawl',
  filterFreeCrawlEncProject: 'Progetto FreeCrawl crittografato',
  filterAllFiles: 'Tutti i file',
  filterLogFiles: 'File di log',
  filterExcelWorkbook: 'Cartella di lavoro di Excel',
  filterHtmlReport: 'Report HTML',
  filterPdfReport: 'Report PDF',
  filterImages: 'Immagini',
  filterXmlSitemap: 'Sitemap XML',
  filterGzXmlSitemap: 'Sitemap XML compressa (gzip)',

  spellUndetermined:
    'Non è stato possibile determinare la lingua della pagina: non dichiara html[lang] e contiene troppo poco testo per il rilevamento.',
  spellUnsupported: 'Questo endpoint LanguageTool non supporta {lang}.',
  spellMismatchBailout:
    'LanguageTool ha interrotto il controllo: la pagina non si legge come {lang}. Se è un errore, fissa la lingua in Impostazioni → Ortografia.',
  spellMismatchRatio:
    'Controllata come {lang}, il {pct}% delle parole è stato segnalato: la pagina è quasi certamente scritta in un\'altra lingua, quindi i risultati sono stati scartati. Se è un errore, fissa la lingua in Impostazioni → Ortografia.',
  spellTimeout: 'La richiesta a LanguageTool è scaduta dopo {s}s',
  spellHttpError: 'LanguageTool ha restituito HTTP {status}',

  dlgConfirmClearMsg: 'Cancellare tutti i dati della scansione?',
  dlgConfirmClearDetail:
    'Questa operazione elimina in modo permanente ogni URL scansionato, link, immagine, header e snapshot del codice sorgente nel progetto attivo. Non è reversibile.',
  dlgDontAskAgain: 'Non chiedermelo più',
};
