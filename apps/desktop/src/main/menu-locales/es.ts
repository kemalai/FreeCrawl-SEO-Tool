/**
 * Spanish native menu / tray / dialog labels.
 *
 * See `../menu-i18n.ts` for why the main process keeps its own copy of
 * these strings instead of importing the renderer's locale JSON.
 */
import type { MenuLabels } from '../menu-i18n.js';

export const MENU_ES: MenuLabels = {
  file: 'Archivo',
  newProject: 'Nuevo proyecto',
  openProject: 'Abrir proyecto…',
  newProjectWindow: 'Nueva ventana de proyecto',
  openRecent: 'Abrir reciente',
  manageProjects: 'Gestionar proyectos…',
  clearRecent: 'Borrar recientes',
  emptyRecent: '(vacío)',
  clearCrawlData: 'Borrar datos del rastreo',
  exportAs: 'Exportar datos del rastreo…',
  generateSitemap: 'Generar sitemap XML',
  sitemapStandard: 'Estándar…',
  sitemapImages: 'Imágenes…',
  sitemapHreflang: 'Hreflang…',
  sitemapNews: 'Noticias…',
  sitemapVideo: 'Vídeo…',
  exportHtmlReport: 'Exportar informe HTML…',
  exportPdfReport: 'Exportar informe PDF…',
  exportSeoAudit: 'Exportar auditoría SEO (formato Screaming Frog)…',
  bulkExport: 'Exportación masiva…',
  exportSheets: 'Exportar a Google Sheets…',
  exportBigquery: 'Exportar a BigQuery…',
  compareWith: 'Comparar con proyecto…',
  scheduledCrawl: 'Rastreo programado…',
  scheduledCrawlTooltip:
    'Configura un rastreo recurrente dentro de la aplicación para el proyecto abierto. Solo se activa mientras FreeCrawl está abierto; usa la CLI y el programador del sistema para disparadores que sobrevivan a un reinicio.',
  saveProject: 'Guardar proyecto',
  saveProjectAs: 'Guardar proyecto como…',
  titleUntitledProject: 'Proyecto sin título',
  titleSaving: 'Guardando…',
  dlgSaveProjectAsTitle: 'Guardar proyecto como…',
  dlgExportTableTitle: 'Exportar tabla',
  dlgSaveFailedTitle: 'No se pudo guardar el proyecto',
  msgProjectSaved:
    'Guardado como un único archivo comprimido: {size} MB (desde {from} MB).',
  dlgUnsavedTitle: 'Cambios sin guardar',
  msgUnsavedChanges: 'Este proyecto tiene cambios que aún no se han guardado.',
  detailUnsavedChanges:
    'Los resultados del rastreo viven en una copia de trabajo hasta que los guardas en el archivo del proyecto.',
  btnSaveChanges: 'Guardar',
  btnDiscardChanges: 'No guardar',
  saveProjectEncrypted: 'Guardar instantánea cifrada…',
  saveProjectEncryptedTooltip:
    'Exporta el proyecto activo a un archivo .seoproject.enc cifrado con AES-256-GCM y protegido por contraseña.',
  openProjectEncrypted: 'Abrir proyecto cifrado…',
  openProjectEncryptedTooltip:
    'Descifra una instantánea .seoproject.enc con su contraseña y abre el proyecto recuperado.',
  settings: 'Ajustes…',
  edit: 'Editar',
  copy: 'Copiar',
  view: 'Ver',
  overviewSidebar: 'Barra lateral de resumen',
  detailPanel: 'Panel de detalle',
  fullscreen: 'Pantalla completa',
  theme: 'Tema',
  themeDark: 'Oscuro',
  themeLight: 'Claro',
  visualization: 'Visualización',
  openVisualizationWindow: 'Abrir ventana de visualización…',
  reports: 'Informes',
  reportsItem: 'Informes…',
  logAnalyzer: 'Analizador de logs',
  openLogAnalyzerWindow: 'Abrir ventana del analizador de logs…',
  openLogAnalyzerWindowTooltip:
    'Analiza logs de acceso del servidor (Apache / Nginx / IIS) — visitas de bots por URL, presupuesto de rastreo y detección de huérfanas cruzando rastreo y log, en una ventana independiente.',
  help: 'Ayuda',
  documentation: 'Documentación',
  showLogs: 'Mostrar logs…',
  trayShow: 'Mostrar FreeCrawl',
  trayHide: 'Ocultar en la bandeja',
  trayStopCrawl: 'Detener rastreo',
  trayQuit: 'Salir de FreeCrawl',
  openLogsFolder: 'Abrir carpeta de logs',
  openLogsFolderTooltip:
    'Abre el directorio donde se conservan en disco los archivos de log rotados',
  robotsTester: 'Probador de robots.txt…',
  sitemapValidator: 'Validador de sitemap…',
  resetDiagnostics: 'Restablecer avisos de diagnóstico',
  resetDiagnosticsTooltip:
    'Vuelve a habilitar los avisos emergentes que descartaste con «No volver a mostrar»',
  deleteDomainData: 'Eliminar datos de un dominio…',
  deleteDomainDataTooltip:
    'Borrado por dominio alineado con el RGPD. Elimina cada fila de URL cuyo host coincida con el dominio indicado, junto con todos sus registros dependientes (enlaces, cabeceras, imágenes, instantáneas del código fuente).',
  clearAllData: 'Borrar todos los datos…',
  clearAllDataTooltip:
    'Vacía por completo el proyecto activo (URL, enlaces, imágenes, cabeceras, instantáneas del código fuente, sitemaps). No se puede deshacer: usa antes Guardar proyecto como… si quieres una copia de seguridad.',
  checkForUpdates: 'Buscar actualizaciones…',
  checkForUpdatesTooltip:
    'Obtiene la última versión publicada en GitHub y la compara con la que tienes instalada. Sin consultas en segundo plano: solo se ejecuta cuando haces clic.',
  about: 'Acerca de FreeCrawl SEO',

  ctxCopy: 'Copiar',
  ctxOpenInBrowser: 'Abrir en el navegador',
  ctxRespider: 'Volver a rastrear',
  ctxStartCrawlFirst: 'Inicia primero un rastreo',
  ctxRemove: 'Eliminar',
  ctxOpenRobotsTxt: 'Abrir robots.txt',
  ctxCopyNUrls: 'Copiar {n} URL',
  ctxOpenNUrlsInBrowser: 'Abrir {n} URL en el navegador',
  ctxOpenLimitTooltip: 'Limitado a 20 URL para no abrir demasiadas pestañas',
  ctxRespiderNUrls: 'Volver a rastrear {n} URL',
  ctxRemoveNUrls: 'Eliminar {n} URL',
  ctxExportNUrlsAsCsv: 'Exportar {n} URL como CSV…',
  ctxCopyCell: 'Copiar celda',
  ctxCopyNCells: 'Copiar {n} celdas',
  ctxCopyRow: 'Copiar fila',
  ctxCopyNRows: 'Copiar {n} filas',
  ctxCopyColumn: 'Copiar columna',
  ctxCopyNColumns: 'Copiar {n} columnas',

  btnOk: 'Aceptar',
  btnCancel: 'Cancelar',
  btnClose: 'Cerrar',
  btnClear: 'Borrar',
  btnOpenFolder: 'Abrir carpeta',
  btnLater: 'Más tarde',
  btnOpenReleasePage: 'Abrir página de la versión',
  btnOpenReleasesPage: 'Abrir página de versiones',
  btnDownloadInstaller: 'Descargar instalador',
  btnDownloadNow: 'Descargar ahora',
  btnSkipJsRender: 'Omitir — desactivar el renderizado JS en esta ejecución',

  dlgOpenProjectTitle: 'Abrir proyecto',
  dlgOpenProjectFailedTitle: 'No se pudo abrir el proyecto',
  dlgLogsFolderUnavailableTitle: 'Carpeta de logs no disponible',
  dlgLogsFolderUnavailableMsg:
    'El registro en disco no se ha inicializado. En esta sesión los logs solo se conservan en memoria.',
  dlgDiagResetTitle: 'Avisos de diagnóstico restablecidos',
  dlgDiagResetNoneMsg: 'No hay avisos de diagnóstico silenciados que restablecer.',
  dlgDownloadCompleteTitle: 'Descarga completada',
  dlgDownloadFailedTitle: 'Descarga fallida',
  dlgDownloadStartFailedMsg: 'No se pudo iniciar la descarga.',
  dlgUpdateCheckFailedTitle: 'Comprobación de actualizaciones fallida',
  dlgUpdateCheckFailedMsg: 'No se pudo contactar con la API de versiones de GitHub.',
  dlgUpToDateTitle: 'Todo actualizado',
  dlgUpdateAvailableTitle: 'Actualización disponible',
  dlgOpenAccessLogTitle: 'Abrir log de acceso',
  dlgExportLogAnalysisTitle: 'Exportar análisis de logs',
  dlgExportExtractionRulesTitle: 'Exportar reglas de extracción',
  dlgImportExtractionRulesTitle: 'Importar reglas de extracción',
  dlgExportSettingsTitle: 'Exportar ajustes',
  dlgImportSettingsTitle: 'Importar ajustes',
  dlgImportFailedTitle: 'Importación fallida',
  dlgImportFailedNoSettingsMsg:
    'El archivo importado no contiene un objeto de ajustes.',
  dlgChooseFolderTitle: 'Elegir carpeta',
  dlgPlaywrightTitle: 'Renderizado de JavaScript — falta el navegador',
  dlgPlaywrightMsg:
    'Playwright necesita descargar un navegador Chromium antes de poder ejecutar el renderizado de JavaScript.',
  dlgBrowserInstallFailedTitle: 'Instalación del navegador fallida',
  dlgProjectSavedTitle: 'Proyecto guardado',
  dlgEncSnapshotSavedTitle: 'Instantánea cifrada guardada',
  dlgSaveDecryptedProjectTitle: 'Guardar proyecto descifrado como…',
  dlgBulkExportFolderTitle: 'Exportación masiva — elige la carpeta de salida',
  dlgBulkExportCompleteTitle: 'Exportación masiva completada',
  dlgHtmlReportSavedTitle: 'Informe HTML guardado',
  dlgPdfReportSavedTitle: 'Informe PDF guardado',
  dlgSeoAuditFolderTitle: 'Elige una carpeta para la exportación de la auditoría SEO',
  dlgSeoAuditCompleteTitle: 'Exportación de auditoría SEO completada',
  dlgPickLogoTitle: 'Elige un logotipo para el informe',
  msgLogoTooLarge: 'El logotipo debe pesar 1 MB o menos.',
  dlgSitemapGeneratedTitle: 'Sitemap generado',

  diagDnsRefusedTitle: 'Sin conectividad de red',
  diagDnsRefusedMsg:
    'FreeCrawl intentó la resolución DNS en 3 capas (sistema, servidores públicos en el puerto 53 y DNS sobre HTTPS en el puerto 443) y todas fueron rechazadas. Parece que tu equipo no tiene conexión a internet.',
  diagDnsRefusedDetail:
    'FreeCrawl ya intenta sortear automáticamente un DNS de sistema averiado: si ves este diálogo, incluso DNS sobre HTTPS por el puerto 443 falló.\n\n' +
    'Causas más probables (en orden):\n' +
    '  1. El antivirus o la seguridad de endpoint impide que FreeCrawl establezca CUALQUIER conexión saliente. Añade FreeCrawl a la lista de permitidos de tu software de seguridad.\n' +
    '  2. No tienes conexión a internet: revisa el Wi-Fi o el cable Ethernet.\n' +
    '  3. Un cortafuegos corporativo bloquea todo el tráfico saliente: define HTTPS_PROXY en Ajustes → Red.\n' +
    '  4. Una VPN activa está en mal estado: desconéctala y vuelve a intentarlo.\n\n' +
    'Haz clic en "Abrir registros" para ver la cadena de errores completa.',
  diagDnsDestroyedTitle: 'Pila de red sin respuesta',
  diagDnsDestroyedMsg:
    'El resolvedor DNS de tu sistema se colgó Y el desvío automático de FreeCrawl por DNS sobre HTTPS también falló. Eso significa que la pila de red está en mal estado, no solo el DNS.',
  diagDnsDestroyedDetail:
    'Normalmente FreeCrawl se recupera de un cliente DNS de Windows colgado enrutando las consultas por Cloudflare/Google sobre HTTPS:443. Si ves este diálogo, esa alternativa también falló, casi siempre porque la propia pila de red del sistema operativo necesita un reinicio.\n\n' +
    'Prueba una de estas opciones (de menor a mayor esfuerzo):\n' +
    '  1. Activa y desactiva el modo avión, o desconecta y reconecta el Wi-Fi.\n' +
    '  2. Reinicia el adaptador de red (Configuración → Red → Cambiar opciones del adaptador).\n' +
    '  3. Abre "services.msc", busca "DNS Client", haz clic derecho → Reiniciar (solo en Windows).\n' +
    '  4. Como último recurso, reinicia el equipo.\n\n' +
    'Haz clic en "Abrir registros" para ver la cadena de errores completa.',
  diagTlsTitle: 'Certificado TLS rechazado',
  diagTlsMsg:
    'Un certificado TLS no pasó la verificación, normalmente porque un antivirus o un proxy corporativo está interceptando HTTPS.',
  diagTlsDetail:
    'Culpables habituales: Kaspersky, ESET, Bitdefender, Zscaler, BlueCoat, Fortigate.\n\n' +
    'Prueba una de estas opciones:\n' +
    '  1. Añade FreeCrawl a la lista de permitidos de tu antivirus.\n' +
    '  2. Exporta la CA raíz del antivirus o del proxy en formato PEM y apunta la variable de entorno NODE_EXTRA_CA_CERTS a ese archivo antes de iniciar la aplicación.\n' +
    '  3. Desactiva temporalmente el análisis HTTPS de tu antivirus.\n\n' +
    'Haz clic en "Abrir registros" para ver la cadena de errores completa.',
  diagSeedTitle: 'URL inicial inaccesible',
  diagSeedMsg:
    'FreeCrawl no pudo acceder a la URL que introdujiste: ni HTTPS ni HTTP respondieron en 5 segundos.',
  diagSeedDetail:
    'Prueba una de estas opciones:\n' +
    '  1. Abre la URL en un navegador para confirmar que el sitio está activo.\n' +
    '  2. Revisa tu conexión a internet.\n' +
    '  3. Si usas una VPN o estás detrás de un proxy corporativo, define HTTPS_PROXY antes de iniciar la aplicación o configura Ajustes → Red → URL del proxy.\n' +
    '  4. Comprueba que la URL esté bien escrita (errores tipográficos en el host).\n\n' +
    'Haz clic en "Abrir registros" para ver el rastro de diagnóstico.',
  btnOpenLogs: 'Abrir registros',
  btnDismiss: 'Descartar',
  dlgDontShowAgain: 'No volver a mostrar esto',

  msgDownloadComplete: '{name} descargado.',
  detailDownloadSaved:
    'Guardado en:\n{path}\n\nSe ha abierto la carpeta de descargas: haz doble clic en el instalador para actualizar.',
  detailDownloadSmartScreen:
    'Windows SmartScreen puede mostrar "Aplicación no reconocida" porque el instalador no está firmado digitalmente. Haz clic en "Más información → Ejecutar de todas formas" para continuar.',
  detailDownloadGatekeeper:
    'Gatekeeper de macOS puede bloquear la aplicación al abrirla por primera vez porque no está notarizada. Haz clic derecho en el .dmg → Abrir para omitirlo.',
  msgDownloadFailed: 'No se pudo descargar {name}',
  detailDownloadFailed:
    'Estado de la descarga: {state}\n\nPuedes reintentarlo desde la página de GitHub Releases.',
  msgUnknownErrorGitHub: 'Error desconocido al contactar con GitHub',
  msgNoReleaseTag: 'La respuesta no incluye ninguna etiqueta de versión.',
  detailBrowseReleases: 'Puedes consultar las versiones manualmente en:\n{url}',
  msgUpToDate: 'Tienes la última versión (v{version}).',
  detailLatestRelease: 'Última versión en GitHub: {tag}',
  detailPublished: 'Publicada: {date}',
  msgUpdateAvailable: '{version} ya está disponible.',
  detailInstalledLatest: 'Instalada: v{installed}\nÚltima:    {latest}',
  detailReleaseNotes: 'Notas de la versión:',
  detailSeeReleasePage: 'Consulta la página de la versión para ver los cambios.',
  dlgDontShowVersionAgain: 'No volver a mostrar esta versión',

  winLogsTitle: 'FreeCrawl — Registros ({label})',
  winLabelPrimary: 'Principal',
  winVisualizationTitle: 'FreeCrawl — Visualización',
  winLogAnalyzerTitle: 'FreeCrawl — Analizador de registros',

  dlgPlaywrightDetail:
    'Es una descarga única de unos 250 MB que se ejecuta dentro de la aplicación, sin necesidad de terminal. El navegador se guarda en tu carpeta de usuario; solo se descarga el binario, desde cdn.playwright.dev.\n\n¿Descargar ahora?',
  msgBrowserInstallFailed:
    'No se pudo completar la descarga de Chromium.\n\n' +
    'Revisa tu conexión a internet (o la configuración del proxy) y vuelve a iniciar el rastreo: ' +
    'FreeCrawl reintentará la descarga automáticamente. El renderizado de JavaScript seguirá ' +
    'desactivado hasta que funcione; el rastreo en modo texto no se ve afectado.',

  notifCrawlFinished: 'Rastreo finalizado: {urls} URL · media de {ms} ms',

  dlgSaveEncSnapshotTitle: 'Guardar instantánea cifrada…',
  msgEncSnapshotWritten: 'Instantánea cifrada escrita: {size} MB.',
  detailEncSnapshotKeepPassword:
    'Guarda la contraseña en un lugar seguro: no se puede recuperar. Sin ella, el archivo es ilegible.',
  dlgOpenEncProjectTitle: 'Abrir proyecto cifrado…',

  dlgChooseExportFolderTitle: 'Elige la carpeta para la exportación {format}',
  msgBulkExportWritten: 'Archivos escritos: {files}. Filas en total: {rows}.',
  detailBulkExportErrors: 'Errores:',
  msgHtmlReportWritten: 'Informe escrito: {size} KB.',
  msgPdfReportWritten: 'PDF escrito: {size} KB.',
  msgSeoAuditWritten: '{files} archivos escritos ({rows} filas).',
  dlgCompareWithProjectTitle: 'Comparar con proyecto…',
  msgSitemapSharded:
    'Sitemap fragmentado escrito: {urls} URL repartidas en {parts} partes + índice.',
  msgSitemapWritten: 'Sitemap escrito con {urls} URL.',
  msgSitemapWrittenTruncated:
    'Sitemap escrito con {urls} URL (truncado en el límite de 50.000).',
  detailSitemapParts: 'Archivos de parte: {parts}, más el índice',

  msgCouldNotOpenPath: 'No se pudo abrir {path}.',
  msgCouldNotOpenSelected: 'No se pudo abrir el archivo seleccionado.',
  msgImportCannotParseJson: 'No se puede analizar el JSON: {error}',
  msgDiagResetDone:
    'Avisos reactivados: {n}. Volverán a aparecer la próxima vez que se produzca el problema subyacente.',

  filterFreeCrawlProject: 'Proyecto de FreeCrawl',
  filterFreeCrawlEncProject: 'Proyecto cifrado de FreeCrawl',
  filterAllFiles: 'Todos los archivos',
  filterLogFiles: 'Archivos de registro',
  filterExcelWorkbook: 'Libro de Excel',
  filterHtmlReport: 'Informe HTML',
  filterPdfReport: 'Informe PDF',
  filterImages: 'Imágenes',
  filterXmlSitemap: 'Sitemap XML',
  filterGzXmlSitemap: 'Sitemap XML comprimido (gzip)',

  spellUndetermined:
    'No se pudo determinar el idioma de la página: no declara html[lang] y contiene demasiado poco texto para detectarlo.',
  spellUnsupported: 'Este endpoint de LanguageTool no admite {lang}.',
  spellMismatchBailout:
    'LanguageTool dejó de revisar: la página no se lee como {lang}. Si es un error, fija el idioma en Ajustes → Ortografía.',
  spellMismatchRatio:
    'Al revisarla como {lang} se marcó el {pct}% de las palabras: la página casi con seguridad está escrita en otro idioma, así que los resultados se descartaron. Si es un error, fija el idioma en Ajustes → Ortografía.',
  spellTimeout: 'La solicitud a LanguageTool expiró tras {s}s',
  spellHttpError: 'LanguageTool devolvió HTTP {status}',

  dlgConfirmClearMsg: '¿Borrar todos los datos del rastreo?',
  dlgConfirmClearDetail:
    'Esto elimina de forma permanente cada URL rastreada, enlace, imagen, cabecera e instantánea del código fuente del proyecto activo. No se puede deshacer.',
  dlgDontAskAgain: 'No volver a preguntar',
};
