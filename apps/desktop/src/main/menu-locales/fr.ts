/**
 * French native menu / tray / dialog labels.
 *
 * See `../menu-i18n.ts` for why the main process keeps its own copy of
 * these strings instead of importing the renderer's locale JSON.
 */
import type { MenuLabels } from '../menu-i18n.js';

export const MENU_FR: MenuLabels = {
  file: 'Fichier',
  newProject: 'Nouveau projet',
  openProject: 'Ouvrir un projet…',
  newProjectWindow: 'Nouvelle fenêtre de projet',
  openRecent: 'Ouvrir un élément récent',
  manageProjects: 'Gérer les projets…',
  clearRecent: 'Effacer les éléments récents',
  emptyRecent: '(vide)',
  clearCrawlData: 'Effacer les données d’exploration',
  exportAs: 'Exporter les données d’exploration…',
  generateSitemap: 'Générer un sitemap XML',
  sitemapStandard: 'Standard…',
  sitemapImages: 'Images…',
  sitemapHreflang: 'Hreflang…',
  sitemapNews: 'Actualités…',
  sitemapVideo: 'Vidéo…',
  exportHtmlReport: 'Exporter le rapport HTML…',
  exportPdfReport: 'Exporter le rapport PDF…',
  exportSeoAudit: 'Exporter l\'audit SEO (format Screaming Frog)…',
  bulkExport: 'Export en masse…',
  exportSheets: 'Exporter vers Google Sheets…',
  exportBigquery: 'Exporter vers BigQuery…',
  compareWith: 'Comparer avec un projet…',
  scheduledCrawl: 'Exploration planifiée…',
  scheduledCrawlTooltip:
    'Configure une exploration récurrente dans l’application pour le projet ouvert. Elle ne se déclenche que si FreeCrawl est ouvert ; utilisez la CLI avec le planificateur du système pour des déclenchements qui survivent à un redémarrage.',
  saveProject: 'Enregistrer le projet',
  saveProjectAs: 'Enregistrer le projet sous…',
  titleUntitledProject: 'Projet sans titre',
  titleSaving: 'Enregistrement…',
  dlgSaveProjectAsTitle: 'Enregistrer le projet sous…',
  dlgExportTableTitle: 'Exporter le tableau',
  dlgSaveFailedTitle: 'Impossible d’enregistrer le projet',
  msgProjectSaved:
    'Enregistré en un seul fichier compressé : {size} Mo (au lieu de {from} Mo).',
  dlgUnsavedTitle: 'Modifications non enregistrées',
  msgUnsavedChanges: 'Ce projet comporte des modifications qui ne sont pas encore enregistrées.',
  detailUnsavedChanges:
    'Les résultats d’exploration restent dans une copie de travail jusqu’à ce que vous les enregistriez dans le fichier du projet.',
  btnSaveChanges: 'Enregistrer',
  btnDiscardChanges: 'Ne pas enregistrer',
  saveProjectEncrypted: 'Enregistrer un instantané chiffré…',
  saveProjectEncryptedTooltip:
    'Exporte le projet actif vers un fichier .seoproject.enc chiffré en AES-256-GCM et protégé par un mot de passe.',
  openProjectEncrypted: 'Ouvrir un projet chiffré…',
  openProjectEncryptedTooltip:
    'Déchiffre un instantané .seoproject.enc avec son mot de passe et ouvre le projet récupéré.',
  settings: 'Paramètres…',
  edit: 'Édition',
  copy: 'Copier',
  view: 'Affichage',
  overviewSidebar: 'Barre latérale de vue d’ensemble',
  detailPanel: 'Panneau de détail',
  fullscreen: 'Plein écran',
  theme: 'Thème',
  themeDark: 'Sombre',
  themeLight: 'Clair',
  visualization: 'Visualisation',
  openVisualizationWindow: 'Ouvrir la fenêtre de visualisation…',
  reports: 'Rapports',
  reportsItem: 'Rapports…',
  logAnalyzer: 'Analyseur de logs',
  openLogAnalyzerWindow: 'Ouvrir la fenêtre de l’analyseur de logs…',
  openLogAnalyzerWindowTooltip:
    'Analysez les logs d’accès du serveur (Apache / Nginx / IIS) — visites de robots par URL, budget d’exploration et détection des pages orphelines en croisant exploration et logs, dans une fenêtre indépendante.',
  help: 'Aide',
  documentation: 'Documentation',
  showLogs: 'Afficher les logs…',
  trayShow: 'Afficher FreeCrawl',
  trayHide: 'Masquer dans la zone de notification',
  trayStopCrawl: 'Arrêter l’exploration',
  trayQuit: 'Quitter FreeCrawl',
  openLogsFolder: 'Ouvrir le dossier des logs',
  openLogsFolderTooltip:
    'Ouvre le répertoire où les fichiers de log alternés sont conservés sur le disque',
  robotsTester: 'Testeur de robots.txt…',
  sitemapValidator: 'Validateur de sitemap…',
  resetDiagnostics: 'Réinitialiser les avertissements de diagnostic',
  resetDiagnosticsTooltip:
    'Réactive les avertissements que vous avez masqués avec « Ne plus afficher »',
  deleteDomainData: 'Supprimer les données d’un domaine…',
  deleteDomainDataTooltip:
    'Effacement par domaine conforme au RGPD. Supprime chaque ligne d’URL dont l’hôte correspond au domaine saisi, ainsi que tous les enregistrements dépendants (liens, en-têtes, images, instantanés du code source).',
  clearAllData: 'Effacer toutes les données…',
  clearAllDataTooltip:
    'Vide entièrement le projet actif (URL, liens, images, en-têtes, instantanés du code source, sitemaps). Irréversible — utilisez d’abord Enregistrer le projet sous… si vous voulez une sauvegarde.',
  checkForUpdates: 'Rechercher les mises à jour…',
  checkForUpdatesTooltip:
    'Récupère la dernière version publiée sur GitHub et la compare à celle que vous avez installée. Aucune interrogation en arrière-plan : cela ne s’exécute que sur clic.',
  about: 'À propos de FreeCrawl SEO',

  ctxCopy: 'Copier',
  ctxOpenInBrowser: 'Ouvrir dans le navigateur',
  ctxRespider: 'Explorer à nouveau',
  ctxStartCrawlFirst: 'Lancez d’abord une exploration',
  ctxRemove: 'Supprimer',
  ctxOpenRobotsTxt: 'Ouvrir robots.txt',
  ctxCopyNUrls: 'Copier {n} URL',
  ctxOpenNUrlsInBrowser: 'Ouvrir {n} URL dans le navigateur',
  ctxOpenLimitTooltip: 'Limité à 20 URL pour ne pas ouvrir trop d’onglets',
  ctxRespiderNUrls: 'Explorer à nouveau {n} URL',
  ctxRemoveNUrls: 'Supprimer {n} URL',
  ctxExportNUrlsAsCsv: 'Exporter {n} URL en CSV…',
  ctxCopyCell: 'Copier la cellule',
  ctxCopyNCells: 'Copier {n} cellules',
  ctxCopyRow: 'Copier la ligne',
  ctxCopyNRows: 'Copier {n} lignes',
  ctxCopyColumn: 'Copier la colonne',
  ctxCopyNColumns: 'Copier {n} colonnes',

  btnOk: 'OK',
  btnCancel: 'Annuler',
  btnClose: 'Fermer',
  btnClear: 'Effacer',
  btnOpenFolder: 'Ouvrir le dossier',
  btnLater: 'Plus tard',
  btnOpenReleasePage: 'Ouvrir la page de la version',
  btnOpenReleasesPage: 'Ouvrir la page des versions',
  btnDownloadInstaller: 'Télécharger le programme d’installation',
  btnDownloadNow: 'Télécharger maintenant',
  btnSkipJsRender: 'Ignorer — désactiver le rendu JS pour cette exécution',

  dlgOpenProjectTitle: 'Ouvrir un projet',
  dlgOpenProjectFailedTitle: 'Échec de l’ouverture du projet',
  dlgLogsFolderUnavailableTitle: 'Dossier des logs indisponible',
  dlgLogsFolderUnavailableMsg:
    'La journalisation sur disque n’a pas été initialisée. Pour cette session, les logs ne sont conservés qu’en mémoire.',
  dlgDiagResetTitle: 'Avertissements de diagnostic réinitialisés',
  dlgDiagResetNoneMsg: 'Aucun avertissement de diagnostic masqué à réinitialiser.',
  dlgDownloadCompleteTitle: 'Téléchargement terminé',
  dlgDownloadFailedTitle: 'Échec du téléchargement',
  dlgDownloadStartFailedMsg: 'Impossible de démarrer le téléchargement.',
  dlgUpdateCheckFailedTitle: 'Échec de la recherche de mises à jour',
  dlgUpdateCheckFailedMsg: 'Impossible de joindre l’API des versions GitHub.',
  dlgUpToDateTitle: 'À jour',
  dlgUpdateAvailableTitle: 'Mise à jour disponible',
  dlgOpenAccessLogTitle: 'Ouvrir un log d’accès',
  dlgExportLogAnalysisTitle: 'Exporter l’analyse des logs',
  dlgExportExtractionRulesTitle: 'Exporter les règles d’extraction',
  dlgImportExtractionRulesTitle: 'Importer des règles d’extraction',
  dlgExportSettingsTitle: 'Exporter les paramètres',
  dlgImportSettingsTitle: 'Importer des paramètres',
  dlgImportFailedTitle: 'Échec de l’importation',
  dlgImportFailedNoSettingsMsg:
    'Le fichier importé ne contient pas d’objet de paramètres.',
  dlgChooseFolderTitle: 'Choisir un dossier',
  dlgPlaywrightTitle: 'Rendu JavaScript — navigateur manquant',
  dlgPlaywrightMsg:
    'Playwright doit télécharger un navigateur Chromium avant que le rendu JavaScript puisse fonctionner.',
  dlgBrowserInstallFailedTitle: 'Échec de l’installation du navigateur',
  dlgProjectSavedTitle: 'Projet enregistré',
  dlgEncSnapshotSavedTitle: 'Instantané chiffré enregistré',
  dlgSaveDecryptedProjectTitle: 'Enregistrer le projet déchiffré sous…',
  dlgBulkExportFolderTitle: 'Export en masse — choisissez le dossier de sortie',
  dlgBulkExportCompleteTitle: 'Export en masse terminé',
  dlgHtmlReportSavedTitle: 'Rapport HTML enregistré',
  dlgPdfReportSavedTitle: 'Rapport PDF enregistré',
  dlgSeoAuditFolderTitle: 'Choisissez un dossier pour l\'export de l\'audit SEO',
  dlgSeoAuditCompleteTitle: 'Export de l\'audit SEO terminé',
  dlgPickLogoTitle: 'Choisissez un logo pour le rapport',
  msgLogoTooLarge: 'Le logo doit peser 1 Mo ou moins.',
  dlgSitemapGeneratedTitle: 'Sitemap généré',

  diagDnsRefusedTitle: 'Aucune connectivité réseau',
  diagDnsRefusedMsg:
    'FreeCrawl a tenté la résolution DNS sur 3 niveaux (système, serveurs publics sur le port 53 et DNS-over-HTTPS sur le port 443) : tous ont été refusés. Votre machine semble ne disposer d\'aucune connexion internet fonctionnelle.',
  diagDnsRefusedDetail:
    'FreeCrawl tente déjà de contourner automatiquement un DNS système défaillant : si cette boîte de dialogue s\'affiche, même le DNS-over-HTTPS sur le port 443 a échoué.\n\n' +
    'Causes les plus probables (par ordre) :\n' +
    '  1. L\'antivirus ou la sécurité du poste empêche FreeCrawl d\'établir la MOINDRE connexion sortante. Autorisez FreeCrawl dans votre logiciel de sécurité.\n' +
    '  2. Vous n\'êtes pas connecté à internet : vérifiez le Wi-Fi ou l\'Ethernet.\n' +
    '  3. Un pare-feu d\'entreprise bloque tout le trafic sortant : définissez HTTPS_PROXY dans Paramètres → Réseau.\n' +
    '  4. Un VPN actif est dans un état défaillant : déconnectez-le et réessayez.\n\n' +
    'Cliquez sur « Ouvrir les journaux » pour voir la chaîne d\'erreurs complète.',
  diagDnsDestroyedTitle: 'Pile réseau qui ne répond plus',
  diagDnsDestroyedMsg:
    'Le résolveur DNS de votre système a planté ET le contournement automatique de FreeCrawl par DNS-over-HTTPS a également échoué. C\'est donc la pile réseau qui est en défaut, et pas seulement le DNS.',
  diagDnsDestroyedDetail:
    'FreeCrawl se remet normalement d\'un client DNS Windows planté en routant les requêtes via Cloudflare/Google en HTTPS:443. Si ce message apparaît, ce repli a lui aussi échoué — le plus souvent parce que la pile réseau du système d\'exploitation elle-même a besoin d\'être réinitialisée.\n\n' +
    'Essayez l\'une de ces solutions (du plus simple au plus lourd) :\n' +
    '  1. Activez puis désactivez le mode avion, ou déconnectez et reconnectez le Wi-Fi.\n' +
    '  2. Redémarrez la carte réseau (Paramètres → Réseau → Modifier les options d\'adaptateur).\n' +
    '  3. Ouvrez « services.msc », trouvez « DNS Client », clic droit → Redémarrer (Windows uniquement).\n' +
    '  4. En dernier recours, redémarrez l\'ordinateur.\n\n' +
    'Cliquez sur « Ouvrir les journaux » pour voir la chaîne d\'erreurs complète.',
  diagTlsTitle: 'Certificat TLS rejeté',
  diagTlsMsg:
    'Un certificat TLS n\'a pas passé la vérification, généralement parce qu\'un antivirus ou un proxy d\'entreprise intercepte le HTTPS.',
  diagTlsDetail:
    'Coupables habituels : Kaspersky, ESET, Bitdefender, Zscaler, BlueCoat, Fortigate.\n\n' +
    'Essayez l\'une de ces solutions :\n' +
    '  1. Autorisez FreeCrawl dans votre antivirus.\n' +
    '  2. Exportez l\'autorité de certification racine de l\'antivirus ou du proxy au format PEM, puis faites pointer la variable d\'environnement NODE_EXTRA_CA_CERTS vers ce fichier avant le lancement.\n' +
    '  3. Désactivez temporairement l\'analyse HTTPS de votre antivirus.\n\n' +
    'Cliquez sur « Ouvrir les journaux » pour voir la chaîne d\'erreurs complète.',
  diagSeedTitle: 'URL de départ inaccessible',
  diagSeedMsg:
    'FreeCrawl n\'a pas pu joindre l\'URL saisie : ni HTTPS ni HTTP n\'ont répondu en 5 secondes.',
  diagSeedDetail:
    'Essayez l\'une de ces solutions :\n' +
    '  1. Ouvrez l\'URL dans un navigateur pour vérifier que le site est en ligne.\n' +
    '  2. Vérifiez votre connexion internet.\n' +
    '  3. Si vous utilisez un VPN ou êtes derrière un proxy d\'entreprise, définissez HTTPS_PROXY avant le lancement ou configurez Paramètres → Réseau → URL du proxy.\n' +
    '  4. Vérifiez l\'orthographe de l\'URL (fautes de frappe dans le nom d\'hôte).\n\n' +
    'Cliquez sur « Ouvrir les journaux » pour consulter la trace de diagnostic.',
  btnOpenLogs: 'Ouvrir les journaux',
  btnDismiss: 'Ignorer',
  dlgDontShowAgain: 'Ne plus afficher ce message',

  msgDownloadComplete: '{name} téléchargé.',
  detailDownloadSaved:
    'Enregistré dans :\n{path}\n\nLe dossier de téléchargements a été ouvert — double-cliquez sur le programme d\'installation pour effectuer la mise à jour.',
  detailDownloadSmartScreen:
    'Windows SmartScreen peut afficher « Application non reconnue » car le programme d\'installation n\'est pas signé. Cliquez sur « Informations complémentaires → Exécuter quand même » pour continuer.',
  detailDownloadGatekeeper:
    'Gatekeeper de macOS peut bloquer l\'application à la première ouverture car elle n\'est pas notariée. Clic droit sur le .dmg → Ouvrir pour contourner.',
  msgDownloadFailed: 'Impossible de télécharger {name}',
  detailDownloadFailed:
    'État du téléchargement : {state}\n\nVous pouvez réessayer depuis la page GitHub Releases.',
  msgUnknownErrorGitHub: 'Erreur inconnue lors de la connexion à GitHub',
  msgNoReleaseTag: 'Aucune étiquette de version dans la réponse.',
  detailBrowseReleases: 'Vous pouvez parcourir les versions manuellement ici :\n{url}',
  msgUpToDate: 'Vous utilisez la dernière version (v{version}).',
  detailLatestRelease: 'Dernière version GitHub : {tag}',
  detailPublished: 'Publiée le : {date}',
  msgUpdateAvailable: '{version} est disponible.',
  detailInstalledLatest: 'Installée : v{installed}\nDernière : {latest}',
  detailReleaseNotes: 'Notes de version :',
  detailSeeReleasePage: 'Consultez la page de la version pour le journal des modifications.',
  dlgDontShowVersionAgain: 'Ne plus afficher cette version',

  winLogsTitle: 'FreeCrawl — Journaux ({label})',
  winLabelPrimary: 'Principal',
  winVisualizationTitle: 'FreeCrawl — Visualisation',
  winLogAnalyzerTitle: 'FreeCrawl — Analyseur de journaux',

  dlgPlaywrightDetail:
    'Il s\'agit d\'un téléchargement unique d\'environ 250 Mo effectué depuis l\'application, sans terminal. Le navigateur est stocké dans votre dossier utilisateur ; seul le binaire est téléchargé, depuis cdn.playwright.dev.\n\nTélécharger maintenant ?',
  msgBrowserInstallFailed:
    'Le téléchargement de Chromium n\'a pas pu aboutir.\n\n' +
    'Vérifiez votre connexion internet (ou vos paramètres de proxy) et relancez l\'exploration : ' +
    'FreeCrawl réessaiera automatiquement. Le rendu JavaScript reste désactivé ' +
    'jusqu\'à ce que le téléchargement réussisse ; l\'exploration en mode texte n\'est pas affectée.',

  notifCrawlFinished: 'Exploration terminée : {urls} URL · {ms} ms en moyenne',

  dlgSaveEncSnapshotTitle: 'Enregistrer l\'instantané chiffré…',
  msgEncSnapshotWritten: 'Instantané chiffré écrit : {size} Mo.',
  detailEncSnapshotKeepPassword:
    'Conservez le mot de passe en sécurité : il est irrécupérable. Sans lui, le fichier est illisible.',
  dlgOpenEncProjectTitle: 'Ouvrir un projet chiffré…',

  dlgChooseExportFolderTitle: 'Choisissez le dossier pour l\'export {format}',
  msgBulkExportWritten: 'Fichiers écrits : {files}. Lignes au total : {rows}.',
  detailBulkExportErrors: 'Erreurs :',
  msgHtmlReportWritten: 'Rapport écrit : {size} Ko.',
  msgPdfReportWritten: 'PDF écrit : {size} Ko.',
  msgSeoAuditWritten: '{files} fichiers écrits ({rows} lignes).',
  dlgCompareWithProjectTitle: 'Comparer avec un projet…',
  msgSitemapSharded:
    'Sitemap fragmenté écrit : {urls} URL réparties sur {parts} parties + index.',
  msgSitemapWritten: 'Sitemap écrit avec {urls} URL.',
  msgSitemapWrittenTruncated:
    'Sitemap écrit avec {urls} URL (tronqué à la limite de 50 000).',
  detailSitemapParts: 'Fichiers de partie : {parts}, plus l\'index',

  msgCouldNotOpenPath: 'Impossible d\'ouvrir {path}.',
  msgCouldNotOpenSelected: 'Impossible d\'ouvrir le fichier sélectionné.',
  msgImportCannotParseJson: 'Impossible d\'analyser le JSON : {error}',
  msgDiagResetDone:
    'Avertissements réactivés : {n}. Ils réapparaîtront à la prochaine occurrence du problème sous-jacent.',

  filterFreeCrawlProject: 'Projet FreeCrawl',
  filterFreeCrawlEncProject: 'Projet FreeCrawl chiffré',
  filterAllFiles: 'Tous les fichiers',
  filterLogFiles: 'Fichiers journaux',
  filterExcelWorkbook: 'Classeur Excel',
  filterHtmlReport: 'Rapport HTML',
  filterPdfReport: 'Rapport PDF',
  filterImages: 'Images',
  filterXmlSitemap: 'Sitemap XML',
  filterGzXmlSitemap: 'Sitemap XML compressé (gzip)',

  spellUndetermined:
    'La langue de la page n\'a pas pu être déterminée : elle ne déclare aucun html[lang] et contient trop peu de texte pour une détection.',
  spellUnsupported: '{lang} n\'est pas pris en charge par ce point de terminaison LanguageTool.',
  spellMismatchBailout:
    'LanguageTool a interrompu la vérification : la page ne se lit pas comme du {lang}. Si c\'est une erreur, fixez la langue dans Paramètres → Orthographe.',
  spellMismatchRatio:
    'Vérifiée en {lang}, {pct} % des mots ont été signalés : la page est presque certainement rédigée dans une autre langue, les résultats ont donc été écartés. Si c\'est une erreur, fixez la langue dans Paramètres → Orthographe.',
  spellTimeout: 'La requête LanguageTool a expiré au bout de {s} s',
  spellHttpError: 'LanguageTool a renvoyé HTTP {status}',

  dlgConfirmClearMsg: 'Effacer toutes les données d’exploration ?',
  dlgConfirmClearDetail:
    'Cette action supprime définitivement chaque URL explorée, lien, image, en-tête et instantané du code source du projet actif. Elle est irréversible.',
  dlgDontAskAgain: 'Ne plus me demander',
};
