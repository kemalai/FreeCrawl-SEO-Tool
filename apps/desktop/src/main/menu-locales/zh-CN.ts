/**
 * Simplified Chinese native menu / tray / dialog labels.
 *
 * See `../menu-i18n.ts` for why the main process keeps its own copy of
 * these strings instead of importing the renderer's locale JSON.
 */
import type { MenuLabels } from '../menu-i18n.js';

export const MENU_ZH_CN: MenuLabels = {
  file: '文件',
  newProject: '新建项目',
  openProject: '打开项目…',
  newProjectWindow: '新建项目窗口',
  openRecent: '打开最近使用',
  manageProjects: '管理项目…',
  clearRecent: '清除最近记录',
  emptyRecent: '（空）',
  clearCrawlData: '清除抓取数据',
  exportAs: '导出抓取数据…',
  generateSitemap: '生成 XML 站点地图',
  sitemapStandard: '标准…',
  sitemapImages: '图片…',
  sitemapHreflang: 'Hreflang…',
  sitemapNews: '新闻…',
  sitemapVideo: '视频…',
  exportHtmlReport: '导出 HTML 报告…',
  exportPdfReport: '导出 PDF 报告…',
  exportSeoAudit: '导出 SEO 审计（Screaming Frog 布局）…',
  bulkExport: '批量导出…',
  exportSheets: '导出到 Google Sheets…',
  exportBigquery: '导出到 BigQuery…',
  compareWith: '与项目比较…',
  scheduledCrawl: '定时抓取…',
  scheduledCrawlTooltip:
    '为当前打开的项目设置应用内的周期性抓取。仅在 FreeCrawl 运行时触发；若需要在重启后依然生效的触发方式，请配合命令行工具与操作系统的计划任务。',
  saveProject: '保存项目',
  saveProjectAs: '项目另存为…',
  titleUntitledProject: '未命名项目',
  titleSaving: '正在保存…',
  dlgSaveProjectAsTitle: '项目另存为…',
  dlgExportTableTitle: '导出表格',
  dlgSaveFailedTitle: '无法保存项目',
  msgProjectSaved: '已保存为单个压缩文件：{size} MB（原 {from} MB）。',
  dlgUnsavedTitle: '未保存的更改',
  msgUnsavedChanges: '此项目有尚未保存的更改。',
  detailUnsavedChanges: '抓取结果暂存在工作副本中，直到你将它们保存进项目文件。',
  btnSaveChanges: '保存',
  btnDiscardChanges: '不保存',
  saveProjectEncrypted: '保存加密快照…',
  saveProjectEncryptedTooltip:
    '将当前项目导出为使用 AES-256-GCM 加密、由密码保护的 .seoproject.enc 文件。',
  openProjectEncrypted: '打开加密项目…',
  openProjectEncryptedTooltip:
    '用密码解密 .seoproject.enc 快照，并打开恢复出的项目。',
  settings: '设置…',
  edit: '编辑',
  copy: '复制',
  view: '视图',
  overviewSidebar: '概览侧边栏',
  detailPanel: '详情面板',
  fullscreen: '全屏',
  theme: '主题',
  themeDark: '深色',
  themeLight: '浅色',
  visualization: '可视化',
  openVisualizationWindow: '打开可视化窗口…',
  reports: '报告',
  reportsItem: '报告…',
  logAnalyzer: '日志分析器',
  openLogAnalyzerWindow: '打开日志分析器窗口…',
  openLogAnalyzerWindowTooltip:
    '在独立窗口中分析服务器访问日志（Apache / Nginx / IIS）——按 URL 统计机器人访问、抓取预算，以及通过抓取与日志交叉比对发现孤立页面。',
  help: '帮助',
  documentation: '文档',
  showLogs: '显示日志…',
  trayShow: '显示 FreeCrawl',
  trayHide: '最小化到托盘',
  trayStopCrawl: '停止抓取',
  trayQuit: '退出 FreeCrawl',
  openLogsFolder: '打开日志文件夹',
  openLogsFolderTooltip: '打开磁盘上保存轮转日志文件的目录',
  robotsTester: 'robots.txt 测试器…',
  sitemapValidator: '站点地图校验器…',
  resetDiagnostics: '重置诊断警告',
  resetDiagnosticsTooltip: '重新启用你之前用“不再显示”关闭的弹出警告',
  deleteDomainData: '删除域名数据…',
  deleteDomainDataTooltip:
    '符合 GDPR 的按域名清除。移除主机名与所输入域名匹配的每一行 URL，以及全部关联记录（链接、响应头、图片、源码快照）。',
  clearAllData: '清除全部数据…',
  clearAllDataTooltip:
    '清空整个当前项目（URL、链接、图片、响应头、源码快照、站点地图）。此操作无法撤销——如需备份，请先使用“项目另存为…”。',
  checkForUpdates: '检查更新…',
  checkForUpdatesTooltip:
    '获取 GitHub 上的最新发布版本，并与已安装的版本比较。不做后台轮询：仅在你点击时运行。',
  about: '关于 FreeCrawl SEO',

  ctxCopy: '复制',
  ctxOpenInBrowser: '在浏览器中打开',
  ctxRespider: '重新抓取',
  ctxStartCrawlFirst: '请先开始一次抓取',
  ctxRemove: '移除',
  ctxOpenRobotsTxt: '打开 robots.txt',
  ctxCopyNUrls: '复制 {n} 个 URL',
  ctxOpenNUrlsInBrowser: '在浏览器中打开 {n} 个 URL',
  ctxOpenLimitTooltip: '上限为 20 个 URL，以免打开过多标签页',
  ctxRespiderNUrls: '重新抓取 {n} 个 URL',
  ctxRemoveNUrls: '移除 {n} 个 URL',
  ctxExportNUrlsAsCsv: '将 {n} 个 URL 导出为 CSV…',
  ctxCopyCell: '复制单元格',
  ctxCopyNCells: '复制 {n} 个单元格',
  ctxCopyRow: '复制行',
  ctxCopyNRows: '复制 {n} 行',
  ctxCopyColumn: '复制列',
  ctxCopyNColumns: '复制 {n} 列',

  btnOk: '确定',
  btnCancel: '取消',
  btnClose: '关闭',
  btnClear: '清除',
  btnOpenFolder: '打开文件夹',
  btnLater: '稍后',
  btnOpenReleasePage: '打开发布页面',
  btnOpenReleasesPage: '打开发布列表页面',
  btnDownloadInstaller: '下载安装程序',
  btnDownloadNow: '立即下载',
  btnSkipJsRender: '跳过——本次运行禁用 JS 渲染',

  dlgOpenProjectTitle: '打开项目',
  dlgOpenProjectFailedTitle: '打开项目失败',
  dlgLogsFolderUnavailableTitle: '日志文件夹不可用',
  dlgLogsFolderUnavailableMsg:
    '磁盘日志尚未初始化。本次会话的日志仅保存在内存中。',
  dlgDiagResetTitle: '诊断警告已重置',
  dlgDiagResetNoneMsg: '没有被屏蔽的诊断警告需要重置。',
  dlgDownloadCompleteTitle: '下载完成',
  dlgDownloadFailedTitle: '下载失败',
  dlgDownloadStartFailedMsg: '无法开始下载。',
  dlgUpdateCheckFailedTitle: '检查更新失败',
  dlgUpdateCheckFailedMsg: '无法连接 GitHub 发布版本 API。',
  dlgUpToDateTitle: '已是最新版本',
  dlgUpdateAvailableTitle: '有可用更新',
  dlgOpenAccessLogTitle: '打开访问日志',
  dlgExportLogAnalysisTitle: '导出日志分析',
  dlgExportExtractionRulesTitle: '导出提取规则',
  dlgImportExtractionRulesTitle: '导入提取规则',
  dlgExportSettingsTitle: '导出设置',
  dlgImportSettingsTitle: '导入设置',
  dlgImportFailedTitle: '导入失败',
  dlgImportFailedNoSettingsMsg: '导入的文件不包含设置对象。',
  dlgChooseFolderTitle: '选择文件夹',
  dlgPlaywrightTitle: 'JavaScript 渲染——缺少浏览器',
  dlgPlaywrightMsg:
    'Playwright 需要先下载 Chromium 浏览器，JavaScript 渲染才能运行。',
  dlgBrowserInstallFailedTitle: '浏览器安装失败',
  dlgProjectSavedTitle: '项目已保存',
  dlgEncSnapshotSavedTitle: '加密快照已保存',
  dlgSaveDecryptedProjectTitle: '将解密后的项目另存为…',
  dlgBulkExportFolderTitle: '批量导出——请选择输出文件夹',
  dlgBulkExportCompleteTitle: '批量导出完成',
  dlgHtmlReportSavedTitle: 'HTML 报告已保存',
  dlgPdfReportSavedTitle: 'PDF 报告已保存',
  dlgSeoAuditFolderTitle: '选择 SEO 审计导出文件夹',
  dlgSeoAuditCompleteTitle: 'SEO 审计导出完成',
  dlgPickLogoTitle: '选择报告 Logo',
  msgLogoTooLarge: 'Logo 必须不超过 1 MB。',
  dlgSitemapGeneratedTitle: '站点地图已生成',

  diagDnsRefusedTitle: '无网络连接',
  diagDnsRefusedMsg:
    'FreeCrawl 尝试了三层 DNS 查询（系统解析、53 端口的公共 DNS 服务器、443 端口的 DNS-over-HTTPS），全部被拒绝。您的设备似乎没有可用的互联网连接。',
  diagDnsRefusedDetail:
    'FreeCrawl 本来就会自动绕过失效的系统 DNS——如果您看到此对话框，说明连 443 端口上的 DNS-over-HTTPS 也失败了。\n\n' +
    '最可能的原因（按可能性排序）：\n' +
    '  1. 杀毒软件或终端安全软件阻止 FreeCrawl 建立任何出站连接。请在安全软件中将 FreeCrawl 加入白名单。\n' +
    '  2. 设备未联网——请检查 Wi-Fi 或以太网连接。\n' +
    '  3. 企业防火墙拦截了全部出站流量——请在“设置 → 网络”中配置 HTTPS_PROXY。\n' +
    '  4. 已启用的 VPN 处于异常状态——请断开后重试。\n\n' +
    '点击“打开日志”查看完整的错误链。',
  diagDnsDestroyedTitle: '网络堆栈无响应',
  diagDnsDestroyedMsg:
    '系统的 DNS 解析器已崩溃，并且 FreeCrawl 自动改用 DNS-over-HTTPS 的备用方案同样失败。这说明出问题的是整个网络堆栈，而不只是 DNS。',
  diagDnsDestroyedDetail:
    '通常 FreeCrawl 会在 Windows DNS Client 服务崩溃后，把查询改由 Cloudflare/Google 经 HTTPS:443 转发来自动恢复。如果您看到此对话框，说明该备用方案也失败了——一般是因为操作系统的网络堆栈本身需要重置。\n\n' +
    '请按以下顺序尝试（由易到难）：\n' +
    '  1. 开启再关闭飞行模式，或断开后重新连接 Wi-Fi。\n' +
    '  2. 重启网络适配器（设置 → 网络 → 更改适配器选项）。\n' +
    '  3. 打开“services.msc”，找到“DNS Client”，右键单击 → 重新启动（仅 Windows）。\n' +
    '  4. 作为最后手段，重启计算机。\n\n' +
    '点击“打开日志”查看完整的错误链。',
  diagTlsTitle: 'TLS 证书被拒绝',
  diagTlsMsg:
    '某个 TLS 证书未通过验证——通常是因为杀毒软件或企业代理在中间拦截 HTTPS。',
  diagTlsDetail:
    '常见原因：Kaspersky、ESET、Bitdefender、Zscaler、BlueCoat、Fortigate。\n\n' +
    '请尝试以下方法之一：\n' +
    '  1. 在杀毒软件中将 FreeCrawl 加入白名单。\n' +
    '  2. 将杀毒软件或代理的根 CA 导出为 PEM 格式，并在启动前把环境变量 NODE_EXTRA_CA_CERTS 指向该文件。\n' +
    '  3. 暂时关闭杀毒软件的 HTTPS 扫描。\n\n' +
    '点击“打开日志”查看完整的错误链。',
  diagSeedTitle: '无法访问起始网址',
  diagSeedMsg:
    'FreeCrawl 无法访问您输入的网址——HTTPS 和 HTTP 在 5 秒内均无响应。',
  diagSeedDetail:
    '请尝试以下方法之一：\n' +
    '  1. 在浏览器中打开该网址，确认网站可以访问。\n' +
    '  2. 检查您的互联网连接。\n' +
    '  3. 如果使用 VPN 或处于企业代理之后，请在启动前设置 HTTPS_PROXY，或在“设置 → 网络 → 代理网址”中配置。\n' +
    '  4. 确认网址拼写正确（主机名是否有误）。\n\n' +
    '点击“打开日志”查看诊断记录。',
  btnOpenLogs: '打开日志',
  btnDismiss: '忽略',
  dlgDontShowAgain: '不再显示此提示',

  msgDownloadComplete: '{name} 已下载。',
  detailDownloadSaved:
    '保存位置：\n{path}\n\n下载文件夹已打开——双击安装程序即可升级。',
  detailDownloadSmartScreen:
    '由于安装程序未进行代码签名，Windows SmartScreen 可能提示“无法识别的应用”。点击“更多信息 → 仍要运行”即可继续。',
  detailDownloadGatekeeper:
    '由于应用未经过公证，macOS Gatekeeper 可能在首次打开时拦截它。右键单击 .dmg → 打开，即可绕过。',
  msgDownloadFailed: '无法下载 {name}',
  detailDownloadFailed:
    '下载状态：{state}\n\n您可以在 GitHub Releases 页面重试。',
  msgUnknownErrorGitHub: '连接 GitHub 时发生未知错误',
  msgNoReleaseTag: '响应中没有发布标签。',
  detailBrowseReleases: '您也可以手动浏览发布列表：\n{url}',
  msgUpToDate: '您使用的已是最新版本（v{version}）。',
  detailLatestRelease: 'GitHub 最新版本：{tag}',
  detailPublished: '发布时间：{date}',
  msgUpdateAvailable: '{version} 已发布。',
  detailInstalledLatest: '已安装：v{installed}\n最新：  {latest}',
  detailReleaseNotes: '版本说明：',
  detailSeeReleasePage: '更新日志请查看发布页面。',
  dlgDontShowVersionAgain: '不再提示此版本',

  winLogsTitle: 'FreeCrawl — 日志（{label}）',
  winLabelPrimary: '主窗口',
  winVisualizationTitle: 'FreeCrawl — 可视化',
  winLogAnalyzerTitle: 'FreeCrawl — 日志分析器',

  dlgPlaywrightDetail:
    '这是一次性的约 250 MB 下载，在应用内完成——无需使用终端。浏览器保存在您的用户文件夹中；只会从 cdn.playwright.dev 下载二进制文件。\n\n现在下载吗？',
  msgBrowserInstallFailed:
    'Chromium 下载未能完成。\n\n' +
    '请检查您的互联网连接（或代理设置）后重新开始抓取——' +
    'FreeCrawl 会自动重试下载。在下载成功之前，JavaScript 渲染将保持' +
    '禁用状态；文本模式抓取不受影响。',

  notifCrawlFinished: '抓取完成：{urls} 个网址 · 平均 {ms} 毫秒',

  dlgSaveEncSnapshotTitle: '保存加密快照…',
  msgEncSnapshotWritten: '加密快照已写入：{size} MB。',
  detailEncSnapshotKeepPassword:
    '请妥善保管密码——密码无法恢复。没有密码，该文件将无法读取。',
  dlgOpenEncProjectTitle: '打开加密项目…',

  dlgChooseExportFolderTitle: '选择 {format} 导出的目标文件夹',
  msgBulkExportWritten: '已写入文件：{files}。总行数：{rows}。',
  detailBulkExportErrors: '错误：',
  msgHtmlReportWritten: '报告已写入：{size} KB。',
  msgPdfReportWritten: 'PDF 已写入：{size} KB。',
  msgSeoAuditWritten: '已写入 {files} 个文件（{rows} 行）。',
  dlgCompareWithProjectTitle: '与项目比较…',
  msgSitemapSharded:
    '已写入分片站点地图：{urls} 个网址，分为 {parts} 个分片 + 索引。',
  msgSitemapWritten: '站点地图已写入，共 {urls} 个网址。',
  msgSitemapWrittenTruncated:
    '站点地图已写入，共 {urls} 个网址（已按 50,000 条上限截断）。',
  detailSitemapParts: '分片文件数：{parts}，另有索引',

  msgCouldNotOpenPath: '无法打开 {path}。',
  msgCouldNotOpenSelected: '无法打开所选文件。',
  msgImportCannotParseJson: '无法解析 JSON：{error}',
  msgDiagResetDone:
    '已重新启用的警告数：{n}。当相关问题再次发生时，它们会重新弹出。',

  filterFreeCrawlProject: 'FreeCrawl 项目',
  filterFreeCrawlEncProject: 'FreeCrawl 加密项目',
  filterAllFiles: '所有文件',
  filterLogFiles: '日志文件',
  filterExcelWorkbook: 'Excel 工作簿',
  filterHtmlReport: 'HTML 报告',
  filterPdfReport: 'PDF 报告',
  filterImages: '图片',
  filterXmlSitemap: 'XML 站点地图',
  filterGzXmlSitemap: 'Gzip 压缩的 XML 站点地图',

  spellUndetermined:
    '无法确定页面语言——该页面未声明 html[lang]，正文内容也太少，无法检测。',
  spellUnsupported: '此 LanguageTool 服务端不支持 {lang}。',
  spellMismatchBailout:
    'LanguageTool 已停止检查——该页面读起来不像 {lang}。如果判断有误，请在“设置 → 拼写”中固定语言。',
  spellMismatchRatio:
    '按 {lang} 检查时有 {pct}% 的词被标记——该页面几乎肯定是用其他语言写的，因此结果已被丢弃。如果判断有误，请在“设置 → 拼写”中固定语言。',
  spellTimeout: 'LanguageTool 请求在 {s} 秒后超时',
  spellHttpError: 'LanguageTool 返回 HTTP {status}',

  dlgConfirmClearMsg: '要清除所有抓取数据吗？',
  dlgConfirmClearDetail:
    '此操作将永久删除当前项目中每个已抓取的 URL、链接、图片、响应头和源码快照，且无法撤销。',
  dlgDontAskAgain: '不再询问',
};
