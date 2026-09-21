/**
 * Brazilian Portuguese native menu / tray / dialog labels.
 *
 * See `../menu-i18n.ts` for why the main process keeps its own copy of
 * these strings instead of importing the renderer's locale JSON.
 */
import type { MenuLabels } from '../menu-i18n.js';

export const MENU_PT_BR: MenuLabels = {
  file: 'Arquivo',
  newProject: 'Novo projeto',
  openProject: 'Abrir projeto…',
  newProjectWindow: 'Nova janela de projeto',
  openRecent: 'Abrir recente',
  manageProjects: 'Gerenciar projetos…',
  clearRecent: 'Limpar recentes',
  emptyRecent: '(vazio)',
  clearCrawlData: 'Limpar dados do rastreamento',
  exportAs: 'Exportar dados do rastreamento…',
  generateSitemap: 'Gerar sitemap XML',
  sitemapStandard: 'Padrão…',
  sitemapImages: 'Imagens…',
  sitemapHreflang: 'Hreflang…',
  sitemapNews: 'Notícias…',
  sitemapVideo: 'Vídeo…',
  exportHtmlReport: 'Exportar relatório HTML…',
  exportPdfReport: 'Exportar relatório PDF…',
  exportSeoAudit: 'Exportar auditoria SEO (layout Screaming Frog)…',
  bulkExport: 'Exportação em massa…',
  exportSheets: 'Exportar para o Google Sheets…',
  exportBigquery: 'Exportar para o BigQuery…',
  compareWith: 'Comparar com projeto…',
  scheduledCrawl: 'Rastreamento agendado…',
  scheduledCrawlTooltip:
    'Configura um rastreamento recorrente dentro do aplicativo para o projeto aberto. Só dispara enquanto o FreeCrawl estiver aberto; use a CLI com o agendador do sistema para disparos que sobrevivam a uma reinicialização.',
  saveProject: 'Salvar projeto',
  saveProjectAs: 'Salvar projeto como…',
  titleUntitledProject: 'Projeto sem título',
  titleSaving: 'Salvando…',
  dlgSaveProjectAsTitle: 'Salvar projeto como…',
  dlgExportTableTitle: 'Exportar tabela',
  dlgSaveFailedTitle: 'Não foi possível salvar o projeto',
  msgProjectSaved:
    'Salvo como um único arquivo compactado: {size} MB (de {from} MB).',
  dlgUnsavedTitle: 'Alterações não salvas',
  msgUnsavedChanges: 'Este projeto tem alterações que ainda não foram salvas.',
  detailUnsavedChanges:
    'Os resultados do rastreamento ficam em uma cópia de trabalho até você salvá-los no arquivo do projeto.',
  btnSaveChanges: 'Salvar',
  btnDiscardChanges: 'Não salvar',
  saveProjectEncrypted: 'Salvar snapshot criptografado…',
  saveProjectEncryptedTooltip:
    'Exporta o projeto ativo para um arquivo .seoproject.enc criptografado com AES-256-GCM e protegido por senha.',
  openProjectEncrypted: 'Abrir projeto criptografado…',
  openProjectEncryptedTooltip:
    'Descriptografa um snapshot .seoproject.enc com a senha dele e abre o projeto recuperado.',
  settings: 'Configurações…',
  edit: 'Editar',
  copy: 'Copiar',
  view: 'Exibir',
  overviewSidebar: 'Barra lateral de visão geral',
  detailPanel: 'Painel de detalhes',
  fullscreen: 'Tela cheia',
  theme: 'Tema',
  themeDark: 'Escuro',
  themeLight: 'Claro',
  visualization: 'Visualização',
  openVisualizationWindow: 'Abrir janela de visualização…',
  reports: 'Relatórios',
  reportsItem: 'Relatórios…',
  logAnalyzer: 'Analisador de logs',
  openLogAnalyzerWindow: 'Abrir janela do analisador de logs…',
  openLogAnalyzerWindowTooltip:
    'Analise logs de acesso do servidor (Apache / Nginx / IIS) — acessos de bots por URL, orçamento de rastreamento e detecção de páginas órfãs cruzando rastreamento e log, em uma janela independente.',
  help: 'Ajuda',
  documentation: 'Documentação',
  showLogs: 'Mostrar logs…',
  trayShow: 'Mostrar o FreeCrawl',
  trayHide: 'Ocultar na bandeja',
  trayStopCrawl: 'Parar rastreamento',
  trayQuit: 'Sair do FreeCrawl',
  openLogsFolder: 'Abrir pasta de logs',
  openLogsFolderTooltip:
    'Abre o diretório onde os arquivos de log rotacionados são mantidos em disco',
  robotsTester: 'Testador de robots.txt…',
  sitemapValidator: 'Validador de sitemap…',
  resetDiagnostics: 'Redefinir avisos de diagnóstico',
  resetDiagnosticsTooltip:
    'Reativa os avisos pop-up que você descartou com "Não mostrar novamente"',
  deleteDomainData: 'Excluir dados de um domínio…',
  deleteDomainDataTooltip:
    'Limpeza por domínio alinhada à LGPD/GDPR. Remove cada linha de URL cujo host corresponda ao domínio informado, junto com todos os registros dependentes (links, cabeçalhos, imagens, snapshots do código-fonte).',
  clearAllData: 'Limpar todos os dados…',
  clearAllDataTooltip:
    'Esvazia todo o projeto ativo (URLs, links, imagens, cabeçalhos, snapshots do código-fonte, sitemaps). Não pode ser desfeito — use antes Salvar projeto como… se quiser um backup.',
  checkForUpdates: 'Verificar atualizações…',
  checkForUpdatesTooltip:
    'Busca a versão mais recente publicada no GitHub e compara com a que você tem instalada. Sem consultas em segundo plano: só é executado quando você clica.',
  about: 'Sobre o FreeCrawl SEO',

  ctxCopy: 'Copiar',
  ctxOpenInBrowser: 'Abrir no navegador',
  ctxRespider: 'Rastrear novamente',
  ctxStartCrawlFirst: 'Inicie um rastreamento primeiro',
  ctxRemove: 'Remover',
  ctxOpenRobotsTxt: 'Abrir robots.txt',
  ctxCopyNUrls: 'Copiar {n} URLs',
  ctxOpenNUrlsInBrowser: 'Abrir {n} URLs no navegador',
  ctxOpenLimitTooltip: 'Limitado a 20 URLs para não abrir abas demais',
  ctxRespiderNUrls: 'Rastrear novamente {n} URLs',
  ctxRemoveNUrls: 'Remover {n} URLs',
  ctxExportNUrlsAsCsv: 'Exportar {n} URLs como CSV…',
  ctxCopyCell: 'Copiar célula',
  ctxCopyNCells: 'Copiar {n} células',
  ctxCopyRow: 'Copiar linha',
  ctxCopyNRows: 'Copiar {n} linhas',
  ctxCopyColumn: 'Copiar coluna',
  ctxCopyNColumns: 'Copiar {n} colunas',

  btnOk: 'OK',
  btnCancel: 'Cancelar',
  btnClose: 'Fechar',
  btnClear: 'Limpar',
  btnOpenFolder: 'Abrir pasta',
  btnLater: 'Mais tarde',
  btnOpenReleasePage: 'Abrir página da versão',
  btnOpenReleasesPage: 'Abrir página de versões',
  btnDownloadInstaller: 'Baixar instalador',
  btnDownloadNow: 'Baixar agora',
  btnSkipJsRender: 'Pular — desativar a renderização JS nesta execução',

  dlgOpenProjectTitle: 'Abrir projeto',
  dlgOpenProjectFailedTitle: 'Falha ao abrir o projeto',
  dlgLogsFolderUnavailableTitle: 'Pasta de logs indisponível',
  dlgLogsFolderUnavailableMsg:
    'O registro em disco não foi inicializado. Nesta sessão, os logs são mantidos apenas na memória.',
  dlgDiagResetTitle: 'Avisos de diagnóstico redefinidos',
  dlgDiagResetNoneMsg: 'Nenhum aviso de diagnóstico silenciado para redefinir.',
  dlgDownloadCompleteTitle: 'Download concluído',
  dlgDownloadFailedTitle: 'Falha no download',
  dlgDownloadStartFailedMsg: 'Não foi possível iniciar o download.',
  dlgUpdateCheckFailedTitle: 'Falha na verificação de atualizações',
  dlgUpdateCheckFailedMsg: 'Não foi possível acessar a API de versões do GitHub.',
  dlgUpToDateTitle: 'Tudo atualizado',
  dlgUpdateAvailableTitle: 'Atualização disponível',
  dlgOpenAccessLogTitle: 'Abrir log de acesso',
  dlgExportLogAnalysisTitle: 'Exportar análise de logs',
  dlgExportExtractionRulesTitle: 'Exportar regras de extração',
  dlgImportExtractionRulesTitle: 'Importar regras de extração',
  dlgExportSettingsTitle: 'Exportar configurações',
  dlgImportSettingsTitle: 'Importar configurações',
  dlgImportFailedTitle: 'Falha na importação',
  dlgImportFailedNoSettingsMsg:
    'O arquivo importado não contém um objeto de configurações.',
  dlgChooseFolderTitle: 'Escolher pasta',
  dlgPlaywrightTitle: 'Renderização de JavaScript — navegador ausente',
  dlgPlaywrightMsg:
    'O Playwright precisa baixar um navegador Chromium antes que a renderização de JavaScript possa funcionar.',
  dlgBrowserInstallFailedTitle: 'Falha na instalação do navegador',
  dlgProjectSavedTitle: 'Projeto salvo',
  dlgEncSnapshotSavedTitle: 'Snapshot criptografado salvo',
  dlgSaveDecryptedProjectTitle: 'Salvar projeto descriptografado como…',
  dlgBulkExportFolderTitle: 'Exportação em massa — escolha a pasta de saída',
  dlgBulkExportCompleteTitle: 'Exportação em massa concluída',
  dlgHtmlReportSavedTitle: 'Relatório HTML salvo',
  dlgPdfReportSavedTitle: 'Relatório PDF salvo',
  dlgSeoAuditFolderTitle: 'Escolha uma pasta para a exportação da auditoria SEO',
  dlgSeoAuditCompleteTitle: 'Exportação da auditoria SEO concluída',
  dlgPickLogoTitle: 'Escolha um logotipo para o relatório',
  msgLogoTooLarge: 'O logotipo deve ter 1 MB ou menos.',
  dlgSitemapGeneratedTitle: 'Sitemap gerado',

  diagDnsRefusedTitle: 'Sem conectividade de rede',
  diagDnsRefusedMsg:
    'O FreeCrawl tentou a resolução de DNS em 3 camadas (sistema, servidores públicos na porta 53 e DNS sobre HTTPS na porta 443) e todas foram recusadas. Sua máquina parece não ter conexão de internet funcionando.',
  diagDnsRefusedDetail:
    'O FreeCrawl já tenta contornar automaticamente um DNS de sistema com defeito — se você está vendo esta caixa de diálogo, até o DNS sobre HTTPS na porta 443 falhou.\n\n' +
    'Causas mais prováveis (em ordem):\n' +
    '  1. O antivírus ou a proteção de endpoint está impedindo o FreeCrawl de abrir QUALQUER conexão de saída. Libere o FreeCrawl no seu software de segurança.\n' +
    '  2. Você não está conectado à internet — verifique o Wi-Fi ou o cabo Ethernet.\n' +
    '  3. Um firewall corporativo está bloqueando todo o tráfego de saída — defina HTTPS_PROXY em Configurações → Rede.\n' +
    '  4. Uma VPN ativa está em estado inconsistente — desconecte e tente novamente.\n\n' +
    'Clique em "Abrir logs" para ver a cadeia de erros completa.',
  diagDnsDestroyedTitle: 'Pilha de rede sem resposta',
  diagDnsDestroyedMsg:
    'O resolvedor de DNS do seu sistema travou E o desvio automático do FreeCrawl por DNS sobre HTTPS também falhou. Isso significa que a pilha de rede está com defeito, não apenas o DNS.',
  diagDnsDestroyedDetail:
    'Normalmente o FreeCrawl se recupera de um Cliente DNS do Windows travado roteando as consultas pela Cloudflare/Google via HTTPS:443. Se você está vendo esta mensagem, essa alternativa também falhou — em geral porque a própria pilha de rede do sistema operacional precisa ser reiniciada.\n\n' +
    'Tente uma destas opções (da mais simples à mais trabalhosa):\n' +
    '  1. Ligue e desligue o modo avião, ou desconecte e reconecte o Wi-Fi.\n' +
    '  2. Reinicie o adaptador de rede (Configurações → Rede → Alterar opções de adaptador).\n' +
    '  3. Abra o "services.msc", localize o "DNS Client", clique com o botão direito → Reiniciar (somente no Windows).\n' +
    '  4. Em último caso, reinicie o computador.\n\n' +
    'Clique em "Abrir logs" para ver a cadeia de erros completa.',
  diagTlsTitle: 'Certificado TLS rejeitado',
  diagTlsMsg:
    'Um certificado TLS não passou na verificação — normalmente porque um antivírus ou proxy corporativo está interceptando o HTTPS.',
  diagTlsDetail:
    'Responsáveis mais comuns: Kaspersky, ESET, Bitdefender, Zscaler, BlueCoat, Fortigate.\n\n' +
    'Tente uma destas opções:\n' +
    '  1. Libere o FreeCrawl no seu antivírus.\n' +
    '  2. Exporte a CA raiz do antivírus ou do proxy em formato PEM e aponte a variável de ambiente NODE_EXTRA_CA_CERTS para esse arquivo antes de iniciar o aplicativo.\n' +
    '  3. Desative temporariamente a verificação de HTTPS no seu antivírus.\n\n' +
    'Clique em "Abrir logs" para ver a cadeia de erros completa.',
  diagSeedTitle: 'URL inicial inacessível',
  diagSeedMsg:
    'O FreeCrawl não conseguiu acessar a URL informada — nem HTTPS nem HTTP responderam em 5 segundos.',
  diagSeedDetail:
    'Tente uma destas opções:\n' +
    '  1. Abra a URL em um navegador para confirmar que o site está no ar.\n' +
    '  2. Verifique sua conexão de internet.\n' +
    '  3. Se você usa VPN ou está atrás de um proxy corporativo, defina HTTPS_PROXY antes de iniciar o aplicativo ou configure Configurações → Rede → URL do proxy.\n' +
    '  4. Confirme se a URL está escrita corretamente (erros de digitação no host).\n\n' +
    'Clique em "Abrir logs" para ver o rastro de diagnóstico.',
  btnOpenLogs: 'Abrir logs',
  btnDismiss: 'Descartar',
  dlgDontShowAgain: 'Não mostrar isso novamente',

  msgDownloadComplete: '{name} baixado.',
  detailDownloadSaved:
    'Salvo em:\n{path}\n\nA pasta de downloads foi aberta — clique duas vezes no instalador para atualizar.',
  detailDownloadSmartScreen:
    'O Windows SmartScreen pode exibir "Aplicativo não reconhecido" porque o instalador não tem assinatura digital. Clique em "Mais informações → Executar assim mesmo" para continuar.',
  detailDownloadGatekeeper:
    'O Gatekeeper do macOS pode bloquear o aplicativo na primeira abertura porque ele não é notarizado. Clique com o botão direito no .dmg → Abrir para contornar.',
  msgDownloadFailed: 'Não foi possível baixar {name}',
  detailDownloadFailed:
    'Estado do download: {state}\n\nVocê pode tentar novamente na página do GitHub Releases.',
  msgUnknownErrorGitHub: 'Erro desconhecido ao contatar o GitHub',
  msgNoReleaseTag: 'A resposta não traz nenhuma tag de versão.',
  detailBrowseReleases: 'Você pode consultar as versões manualmente em:\n{url}',
  msgUpToDate: 'Você está na versão mais recente (v{version}).',
  detailLatestRelease: 'Versão mais recente no GitHub: {tag}',
  detailPublished: 'Publicada em: {date}',
  msgUpdateAvailable: 'A versão {version} está disponível.',
  detailInstalledLatest: 'Instalada: v{installed}\nMais recente: {latest}',
  detailReleaseNotes: 'Notas da versão:',
  detailSeeReleasePage: 'Veja a página da versão para o changelog.',
  dlgDontShowVersionAgain: 'Não mostrar esta versão novamente',

  winLogsTitle: 'FreeCrawl — Logs ({label})',
  winLabelPrimary: 'Principal',
  winVisualizationTitle: 'FreeCrawl — Visualização',
  winLogAnalyzerTitle: 'FreeCrawl — Analisador de logs',

  dlgPlaywrightDetail:
    'É um download único de cerca de 250 MB feito dentro do aplicativo — sem terminal. O navegador fica na sua pasta de usuário; apenas o binário é baixado, de cdn.playwright.dev.\n\nBaixar agora?',
  msgBrowserInstallFailed:
    'Não foi possível concluir o download do Chromium.\n\n' +
    'Verifique sua conexão de internet (ou as configurações de proxy) e inicie o rastreamento novamente — ' +
    'o FreeCrawl tentará baixar outra vez automaticamente. A renderização de JavaScript continua ' +
    'desativada até que o download funcione; o rastreamento em modo texto não é afetado.',

  notifCrawlFinished: 'Rastreamento concluído: {urls} URLs · média de {ms} ms',

  dlgSaveEncSnapshotTitle: 'Salvar snapshot criptografado…',
  msgEncSnapshotWritten: 'Snapshot criptografado gravado: {size} MB.',
  detailEncSnapshotKeepPassword:
    'Guarde a senha em local seguro — ela não pode ser recuperada. Sem ela, o arquivo é ilegível.',
  dlgOpenEncProjectTitle: 'Abrir projeto criptografado…',

  dlgChooseExportFolderTitle: 'Escolha a pasta para a exportação {format}',
  msgBulkExportWritten: 'Arquivos gravados: {files}. Linhas no total: {rows}.',
  detailBulkExportErrors: 'Erros:',
  msgHtmlReportWritten: 'Relatório gravado: {size} KB.',
  msgPdfReportWritten: 'PDF gravado: {size} KB.',
  msgSeoAuditWritten: '{files} arquivos gravados ({rows} linhas).',
  dlgCompareWithProjectTitle: 'Comparar com projeto…',
  msgSitemapSharded:
    'Sitemap fragmentado gravado: {urls} URLs distribuídas em {parts} partes + índice.',
  msgSitemapWritten: 'Sitemap gravado com {urls} URLs.',
  msgSitemapWrittenTruncated:
    'Sitemap gravado com {urls} URLs (truncado no limite de 50.000).',
  detailSitemapParts: 'Arquivos de parte: {parts}, mais o índice',

  msgCouldNotOpenPath: 'Não foi possível abrir {path}.',
  msgCouldNotOpenSelected: 'Não foi possível abrir o arquivo selecionado.',
  msgImportCannotParseJson: 'Não é possível analisar o JSON: {error}',
  msgDiagResetDone:
    'Avisos reativados: {n}. Eles voltarão a aparecer na próxima vez que o problema subjacente ocorrer.',

  filterFreeCrawlProject: 'Projeto do FreeCrawl',
  filterFreeCrawlEncProject: 'Projeto criptografado do FreeCrawl',
  filterAllFiles: 'Todos os arquivos',
  filterLogFiles: 'Arquivos de log',
  filterExcelWorkbook: 'Pasta de trabalho do Excel',
  filterHtmlReport: 'Relatório HTML',
  filterPdfReport: 'Relatório PDF',
  filterImages: 'Imagens',
  filterXmlSitemap: 'Sitemap XML',
  filterGzXmlSitemap: 'Sitemap XML compactado (gzip)',

  spellUndetermined:
    'Não foi possível determinar o idioma da página — ela não declara html[lang] e tem texto insuficiente para detecção.',
  spellUnsupported: 'Este endpoint do LanguageTool não dá suporte a {lang}.',
  spellMismatchBailout:
    'O LanguageTool interrompeu a verificação — a página não se lê como {lang}. Se isso estiver errado, fixe o idioma em Configurações → Ortografia.',
  spellMismatchRatio:
    'Verificada como {lang}, {pct}% das palavras foram sinalizadas — a página quase certamente está escrita em outro idioma, então os resultados foram descartados. Se isso estiver errado, fixe o idioma em Configurações → Ortografia.',
  spellTimeout: 'A requisição ao LanguageTool expirou após {s}s',
  spellHttpError: 'O LanguageTool retornou HTTP {status}',

  dlgConfirmClearMsg: 'Limpar todos os dados do rastreamento?',
  dlgConfirmClearDetail:
    'Isso exclui permanentemente cada URL rastreada, link, imagem, cabeçalho e snapshot do código-fonte do projeto ativo. Não pode ser desfeito.',
  dlgDontAskAgain: 'Não perguntar novamente',
};
