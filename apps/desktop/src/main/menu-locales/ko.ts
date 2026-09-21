/**
 * Korean native menu / tray / dialog labels.
 *
 * See `../menu-i18n.ts` for why the main process keeps its own copy of
 * these strings instead of importing the renderer's locale JSON.
 */
import type { MenuLabels } from '../menu-i18n.js';

export const MENU_KO: MenuLabels = {
  file: '파일',
  newProject: '새 프로젝트',
  openProject: '프로젝트 열기…',
  newProjectWindow: '새 프로젝트 창',
  openRecent: '최근 항목 열기',
  manageProjects: '프로젝트 관리…',
  clearRecent: '최근 항목 지우기',
  emptyRecent: '(없음)',
  clearCrawlData: '크롤 데이터 지우기',
  exportAs: '크롤 데이터 내보내기…',
  generateSitemap: 'XML 사이트맵 생성',
  sitemapStandard: '표준…',
  sitemapImages: '이미지…',
  sitemapHreflang: 'Hreflang…',
  sitemapNews: '뉴스…',
  sitemapVideo: '비디오…',
  exportHtmlReport: 'HTML 보고서 내보내기…',
  exportPdfReport: 'PDF 보고서 내보내기…',
  exportSeoAudit: 'SEO 감사 내보내기 (Screaming Frog 레이아웃)…',
  bulkExport: '일괄 내보내기…',
  exportSheets: 'Google Sheets로 내보내기…',
  exportBigquery: 'BigQuery로 내보내기…',
  compareWith: '프로젝트와 비교…',
  scheduledCrawl: '예약 크롤…',
  scheduledCrawlTooltip:
    '현재 열려 있는 프로젝트에 대해 앱 내에서 반복 크롤을 설정합니다. FreeCrawl이 실행 중일 때만 동작하므로, 재시작 후에도 유지되는 트리거가 필요하면 CLI와 운영체제의 작업 스케줄러를 사용하십시오.',
  saveProject: '프로젝트 저장',
  saveProjectAs: '다른 이름으로 프로젝트 저장…',
  titleUntitledProject: '제목 없는 프로젝트',
  titleSaving: '저장 중…',
  dlgSaveProjectAsTitle: '다른 이름으로 프로젝트 저장…',
  dlgExportTableTitle: '표 내보내기',
  dlgSaveFailedTitle: '프로젝트를 저장할 수 없음',
  msgProjectSaved: '단일 압축 파일로 저장했습니다: {size} MB({from} MB에서).',
  dlgUnsavedTitle: '저장하지 않은 변경 사항',
  msgUnsavedChanges: '이 프로젝트에는 아직 저장되지 않은 변경 사항이 있습니다.',
  detailUnsavedChanges:
    '크롤 결과는 프로젝트 파일에 저장할 때까지 작업 사본에 보관됩니다.',
  btnSaveChanges: '저장',
  btnDiscardChanges: '저장 안 함',
  saveProjectEncrypted: '암호화된 스냅샷 저장…',
  saveProjectEncryptedTooltip:
    '현재 프로젝트를 비밀번호로 보호된 AES-256-GCM 암호화 .seoproject.enc 파일로 내보냅니다.',
  openProjectEncrypted: '암호화된 프로젝트 열기…',
  openProjectEncryptedTooltip:
    '.seoproject.enc 스냅샷을 해당 비밀번호로 복호화하여 복원된 프로젝트를 엽니다.',
  settings: '설정…',
  edit: '편집',
  copy: '복사',
  view: '보기',
  overviewSidebar: '개요 사이드바',
  detailPanel: '상세 패널',
  fullscreen: '전체 화면',
  theme: '테마',
  themeDark: '다크',
  themeLight: '라이트',
  visualization: '시각화',
  openVisualizationWindow: '시각화 창 열기…',
  reports: '보고서',
  reportsItem: '보고서…',
  logAnalyzer: '로그 분석기',
  openLogAnalyzerWindow: '로그 분석기 창 열기…',
  openLogAnalyzerWindowTooltip:
    '서버 접근 로그(Apache / Nginx / IIS)를 별도 창에서 분석합니다 — URL별 봇 방문, 크롤 예산, 그리고 크롤과 로그를 교차 비교한 고립 페이지 탐지.',
  help: '도움말',
  documentation: '문서',
  showLogs: '로그 보기…',
  trayShow: 'FreeCrawl 표시',
  trayHide: '트레이로 숨기기',
  trayStopCrawl: '크롤 중지',
  trayQuit: 'FreeCrawl 종료',
  openLogsFolder: '로그 폴더 열기',
  openLogsFolderTooltip: '순환 저장된 로그 파일이 디스크에 보관되는 디렉터리를 엽니다',
  robotsTester: 'robots.txt 테스터…',
  sitemapValidator: '사이트맵 검사기…',
  resetDiagnostics: '진단 경고 초기화',
  resetDiagnosticsTooltip:
    '"다시 표시하지 않음"으로 닫았던 팝업 경고를 다시 활성화합니다',
  deleteDomainData: '도메인 데이터 삭제…',
  deleteDomainDataTooltip:
    'GDPR에 맞춘 도메인 단위 삭제입니다. 입력한 도메인과 호스트가 일치하는 모든 URL 행과 그에 딸린 모든 레코드(링크, 헤더, 이미지, 소스 스냅샷)를 제거합니다.',
  clearAllData: '모든 데이터 지우기…',
  clearAllDataTooltip:
    '현재 프로젝트 전체(URL, 링크, 이미지, 헤더, 소스 스냅샷, 사이트맵)를 비웁니다. 되돌릴 수 없으므로 백업이 필요하면 먼저 "다른 이름으로 프로젝트 저장…"을 사용하십시오.',
  checkForUpdates: '업데이트 확인…',
  checkForUpdatesTooltip:
    'GitHub의 최신 릴리스를 가져와 설치된 버전과 비교합니다. 백그라운드 조회는 없으며 클릭할 때만 실행됩니다.',
  about: 'FreeCrawl SEO 정보',

  ctxCopy: '복사',
  ctxOpenInBrowser: '브라우저에서 열기',
  ctxRespider: '다시 크롤',
  ctxStartCrawlFirst: '먼저 크롤을 시작하십시오',
  ctxRemove: '제거',
  ctxOpenRobotsTxt: 'robots.txt 열기',
  ctxCopyNUrls: 'URL {n}개 복사',
  ctxOpenNUrlsInBrowser: '브라우저에서 URL {n}개 열기',
  ctxOpenLimitTooltip: '탭이 너무 많이 열리지 않도록 URL 20개로 제한됩니다',
  ctxRespiderNUrls: 'URL {n}개 다시 크롤',
  ctxRemoveNUrls: 'URL {n}개 제거',
  ctxExportNUrlsAsCsv: 'URL {n}개를 CSV로 내보내기…',
  ctxCopyCell: '셀 복사',
  ctxCopyNCells: '셀 {n}개 복사',
  ctxCopyRow: '행 복사',
  ctxCopyNRows: '행 {n}개 복사',
  ctxCopyColumn: '열 복사',
  ctxCopyNColumns: '열 {n}개 복사',

  btnOk: '확인',
  btnCancel: '취소',
  btnClose: '닫기',
  btnClear: '지우기',
  btnOpenFolder: '폴더 열기',
  btnLater: '나중에',
  btnOpenReleasePage: '릴리스 페이지 열기',
  btnOpenReleasesPage: '릴리스 목록 페이지 열기',
  btnDownloadInstaller: '설치 프로그램 다운로드',
  btnDownloadNow: '지금 다운로드',
  btnSkipJsRender: '건너뛰기 — 이번 실행에서 JS 렌더링 비활성화',

  dlgOpenProjectTitle: '프로젝트 열기',
  dlgOpenProjectFailedTitle: '프로젝트 열기 실패',
  dlgLogsFolderUnavailableTitle: '로그 폴더를 사용할 수 없음',
  dlgLogsFolderUnavailableMsg:
    '디스크 로깅이 초기화되지 않았습니다. 이 세션의 로그는 메모리에만 보관됩니다.',
  dlgDiagResetTitle: '진단 경고가 초기화됨',
  dlgDiagResetNoneMsg: '초기화할 숨겨진 진단 경고가 없습니다.',
  dlgDownloadCompleteTitle: '다운로드 완료',
  dlgDownloadFailedTitle: '다운로드 실패',
  dlgDownloadStartFailedMsg: '다운로드를 시작할 수 없습니다.',
  dlgUpdateCheckFailedTitle: '업데이트 확인 실패',
  dlgUpdateCheckFailedMsg: 'GitHub 릴리스 API에 연결할 수 없습니다.',
  dlgUpToDateTitle: '최신 버전입니다',
  dlgUpdateAvailableTitle: '업데이트 사용 가능',
  dlgOpenAccessLogTitle: '접근 로그 열기',
  dlgExportLogAnalysisTitle: '로그 분석 내보내기',
  dlgExportExtractionRulesTitle: '추출 규칙 내보내기',
  dlgImportExtractionRulesTitle: '추출 규칙 가져오기',
  dlgExportSettingsTitle: '설정 내보내기',
  dlgImportSettingsTitle: '설정 가져오기',
  dlgImportFailedTitle: '가져오기 실패',
  dlgImportFailedNoSettingsMsg: '가져온 파일에 설정 객체가 없습니다.',
  dlgChooseFolderTitle: '폴더 선택',
  dlgPlaywrightTitle: 'JavaScript 렌더링 — 브라우저 없음',
  dlgPlaywrightMsg:
    'JavaScript 렌더링을 실행하려면 Playwright가 먼저 Chromium 브라우저를 다운로드해야 합니다.',
  dlgBrowserInstallFailedTitle: '브라우저 설치 실패',
  dlgProjectSavedTitle: '프로젝트 저장됨',
  dlgEncSnapshotSavedTitle: '암호화된 스냅샷 저장됨',
  dlgSaveDecryptedProjectTitle: '복호화된 프로젝트를 다른 이름으로 저장…',
  dlgBulkExportFolderTitle: '일괄 내보내기 — 출력 폴더를 선택하십시오',
  dlgBulkExportCompleteTitle: '일괄 내보내기 완료',
  dlgHtmlReportSavedTitle: 'HTML 보고서 저장됨',
  dlgPdfReportSavedTitle: 'PDF 보고서 저장됨',
  dlgSeoAuditFolderTitle: 'SEO 감사 내보내기 폴더 선택',
  dlgSeoAuditCompleteTitle: 'SEO 감사 내보내기 완료',
  dlgPickLogoTitle: '보고서 로고 선택',
  msgLogoTooLarge: '로고는 1 MB 이하여야 합니다.',
  dlgSitemapGeneratedTitle: '사이트맵 생성됨',

  diagDnsRefusedTitle: '네트워크 연결 없음',
  diagDnsRefusedMsg:
    'FreeCrawl이 DNS 조회를 3단계(시스템, 53번 포트의 공용 서버, 443번 포트의 DNS-over-HTTPS)로 시도했지만 모두 거부되었습니다. 이 컴퓨터에 작동하는 인터넷 연결이 없는 것으로 보입니다.',
  diagDnsRefusedDetail:
    'FreeCrawl은 고장 난 시스템 DNS를 자동으로 우회하려고 이미 시도합니다. 이 대화 상자가 보인다면 443번 포트의 DNS-over-HTTPS까지 실패한 것입니다.\n\n' +
    '가장 가능성이 높은 원인(순서대로):\n' +
    '  1. 백신 또는 엔드포인트 보안이 FreeCrawl의 모든 외부 연결을 차단하고 있습니다. 보안 소프트웨어에서 FreeCrawl을 허용 목록에 추가하세요.\n' +
    '  2. 인터넷에 연결되어 있지 않습니다. Wi-Fi 또는 이더넷을 확인하세요.\n' +
    '  3. 회사 방화벽이 모든 외부 트래픽을 차단하고 있습니다. 설정 → 네트워크에서 HTTPS_PROXY를 지정하세요.\n' +
    '  4. 사용 중인 VPN이 비정상 상태입니다. 연결을 끊고 다시 시도하세요.\n\n' +
    '전체 오류 사슬을 보려면 "로그 열기"를 클릭하세요.',
  diagDnsDestroyedTitle: '네트워크 스택이 응답하지 않음',
  diagDnsDestroyedMsg:
    '시스템의 DNS 확인자가 중단되었고, FreeCrawl의 자동 DNS-over-HTTPS 우회도 실패했습니다. DNS만이 아니라 네트워크 스택 전체가 비정상 상태라는 뜻입니다.',
  diagDnsDestroyedDetail:
    'FreeCrawl은 보통 Windows DNS Client가 중단되면 조회를 Cloudflare/Google의 HTTPS:443으로 우회해 스스로 복구합니다. 이 대화 상자가 보인다면 그 대체 경로까지 실패한 것으로, 대개 운영체제의 네트워크 스택 자체를 초기화해야 하는 경우입니다.\n\n' +
    '다음 중 하나를 시도하세요(쉬운 것부터):\n' +
    '  1. 비행기 모드를 켜고 끄거나, Wi-Fi를 끊고 다시 연결합니다.\n' +
    '  2. 네트워크 어댑터를 다시 시작합니다(설정 → 네트워크 → 어댑터 옵션 변경).\n' +
    '  3. "services.msc"를 열고 "DNS Client"를 찾아 마우스 오른쪽 버튼 클릭 → 다시 시작(Windows 전용).\n' +
    '  4. 최후의 수단으로 컴퓨터를 재부팅합니다.\n\n' +
    '전체 오류 사슬을 보려면 "로그 열기"를 클릭하세요.',
  diagTlsTitle: 'TLS 인증서 거부됨',
  diagTlsMsg:
    'TLS 인증서 검증에 실패했습니다. 보통 백신이나 회사 프록시가 HTTPS를 가로채기 때문입니다.',
  diagTlsDetail:
    '흔한 원인: Kaspersky, ESET, Bitdefender, Zscaler, BlueCoat, Fortigate.\n\n' +
    '다음 중 하나를 시도하세요:\n' +
    '  1. 백신에서 FreeCrawl을 허용 목록에 추가합니다.\n' +
    '  2. 백신 또는 프록시의 루트 CA를 PEM으로 내보내고, 실행하기 전에 환경 변수 NODE_EXTRA_CA_CERTS가 그 파일을 가리키도록 설정합니다.\n' +
    '  3. 백신의 HTTPS 검사를 일시적으로 끕니다.\n\n' +
    '전체 오류 사슬을 보려면 "로그 열기"를 클릭하세요.',
  diagSeedTitle: '시작 URL에 연결할 수 없음',
  diagSeedMsg:
    'FreeCrawl이 입력한 URL에 연결하지 못했습니다. HTTPS와 HTTP 모두 5초 안에 응답하지 않았습니다.',
  diagSeedDetail:
    '다음 중 하나를 시도하세요:\n' +
    '  1. 브라우저에서 URL을 열어 사이트가 정상인지 확인합니다.\n' +
    '  2. 인터넷 연결을 확인합니다.\n' +
    '  3. VPN을 쓰거나 회사 프록시 뒤에 있다면 실행 전에 HTTPS_PROXY를 지정하거나 설정 → 네트워크 → 프록시 URL을 구성합니다.\n' +
    '  4. URL의 철자를 확인합니다(호스트 이름의 오타).\n\n' +
    '진단 기록을 보려면 "로그 열기"를 클릭하세요.',
  btnOpenLogs: '로그 열기',
  btnDismiss: '닫기',
  dlgDontShowAgain: '이 알림 다시 표시 안 함',

  msgDownloadComplete: '{name} 다운로드 완료.',
  detailDownloadSaved:
    '저장 위치:\n{path}\n\n다운로드 폴더를 열었습니다. 설치 파일을 두 번 클릭해 업그레이드하세요.',
  detailDownloadSmartScreen:
    '설치 파일에 코드 서명이 없어 Windows SmartScreen이 "알 수 없는 앱"이라고 표시할 수 있습니다. "추가 정보 → 실행"을 클릭하면 계속됩니다.',
  detailDownloadGatekeeper:
    '앱이 공증되지 않았기 때문에 macOS Gatekeeper가 첫 실행을 차단할 수 있습니다. .dmg 파일을 마우스 오른쪽 버튼으로 클릭 → 열기를 선택하면 우회됩니다.',
  msgDownloadFailed: '{name}을(를) 다운로드할 수 없습니다',
  detailDownloadFailed:
    '다운로드 상태: {state}\n\nGitHub Releases 페이지에서 다시 시도할 수 있습니다.',
  msgUnknownErrorGitHub: 'GitHub 연결 중 알 수 없는 오류',
  msgNoReleaseTag: '응답에 릴리스 태그가 없습니다.',
  detailBrowseReleases: '릴리스 목록은 다음에서 직접 볼 수 있습니다:\n{url}',
  msgUpToDate: '최신 버전을 사용하고 있습니다(v{version}).',
  detailLatestRelease: 'GitHub 최신 릴리스: {tag}',
  detailPublished: '게시: {date}',
  msgUpdateAvailable: '{version}이(가) 배포되었습니다.',
  detailInstalledLatest: '설치됨: v{installed}\n최신:   {latest}',
  detailReleaseNotes: '릴리스 노트:',
  detailSeeReleasePage: '변경 내역은 릴리스 페이지를 확인하세요.',
  dlgDontShowVersionAgain: '이 버전 다시 표시 안 함',

  winLogsTitle: 'FreeCrawl — 로그 ({label})',
  winLabelPrimary: '기본',
  winVisualizationTitle: 'FreeCrawl — 시각화',
  winLogAnalyzerTitle: 'FreeCrawl — 로그 분석기',

  dlgPlaywrightDetail:
    '앱 안에서 진행되는 약 250 MB의 일회성 다운로드이며 터미널은 필요하지 않습니다. 브라우저는 사용자 폴더에 저장되고, cdn.playwright.dev에서 바이너리만 받아옵니다.\n\n지금 다운로드하시겠습니까?',
  msgBrowserInstallFailed:
    'Chromium 다운로드를 완료할 수 없습니다.\n\n' +
    '인터넷 연결(또는 프록시 설정)을 확인하고 크롤을 다시 시작하세요. ' +
    'FreeCrawl이 다운로드를 자동으로 재시도합니다. 성공할 때까지 JavaScript ' +
    '렌더링은 꺼진 상태로 유지되며, 텍스트 모드 크롤링에는 영향이 없습니다.',

  notifCrawlFinished: '크롤 완료: URL {urls}개 · 평균 {ms} ms',

  dlgSaveEncSnapshotTitle: '암호화된 스냅샷 저장…',
  msgEncSnapshotWritten: '암호화된 스냅샷 기록: {size} MB.',
  detailEncSnapshotKeepPassword:
    '비밀번호를 안전하게 보관하세요. 복구할 수 없으며, 비밀번호가 없으면 파일을 읽을 수 없습니다.',
  dlgOpenEncProjectTitle: '암호화된 프로젝트 열기…',

  dlgChooseExportFolderTitle: '{format} 내보내기 폴더 선택',
  msgBulkExportWritten: '기록된 파일: {files}. 전체 행: {rows}.',
  detailBulkExportErrors: '오류:',
  msgHtmlReportWritten: '보고서 기록: {size} KB.',
  msgPdfReportWritten: 'PDF 작성됨: {size} KB.',
  msgSeoAuditWritten: '{files}개 파일 작성됨 ({rows}행).',
  dlgCompareWithProjectTitle: '프로젝트와 비교…',
  msgSitemapSharded:
    '분할 사이트맵 기록: URL {urls}개를 {parts}개 조각 + 인덱스로 나눔.',
  msgSitemapWritten: '사이트맵에 URL {urls}개를 기록했습니다.',
  msgSitemapWrittenTruncated:
    '사이트맵에 URL {urls}개를 기록했습니다(50,000개 한도에서 잘림).',
  detailSitemapParts: '조각 파일 {parts}개, 인덱스 포함',

  msgCouldNotOpenPath: '{path}을(를) 열 수 없습니다.',
  msgCouldNotOpenSelected: '선택한 파일을 열 수 없습니다.',
  msgImportCannotParseJson: 'JSON을 해석할 수 없습니다: {error}',
  msgDiagResetDone:
    '다시 활성화된 경고: {n}개. 원인이 되는 문제가 다시 발생하면 또 표시됩니다.',

  filterFreeCrawlProject: 'FreeCrawl 프로젝트',
  filterFreeCrawlEncProject: 'FreeCrawl 암호화 프로젝트',
  filterAllFiles: '모든 파일',
  filterLogFiles: '로그 파일',
  filterExcelWorkbook: 'Excel 통합 문서',
  filterHtmlReport: 'HTML 보고서',
  filterPdfReport: 'PDF 보고서',
  filterImages: '이미지',
  filterXmlSitemap: 'XML 사이트맵',
  filterGzXmlSitemap: 'Gzip 압축 XML 사이트맵',

  spellUndetermined:
    '페이지 언어를 확인할 수 없습니다. html[lang]을 선언하지 않았고 본문도 감지하기에 너무 적습니다.',
  spellUnsupported: '이 LanguageTool 엔드포인트는 {lang}을(를) 지원하지 않습니다.',
  spellMismatchBailout:
    'LanguageTool이 검사를 중단했습니다. 페이지가 {lang}처럼 읽히지 않습니다. 잘못된 판단이라면 설정 → 맞춤법에서 언어를 고정하세요.',
  spellMismatchRatio:
    '{lang}으로 검사했을 때 단어의 {pct}%가 표시되었습니다. 페이지가 거의 확실히 다른 언어로 작성되어 결과를 폐기했습니다. 잘못된 판단이라면 설정 → 맞춤법에서 언어를 고정하세요.',
  spellTimeout: 'LanguageTool 요청이 {s}초 후 시간 초과되었습니다',
  spellHttpError: 'LanguageTool이 HTTP {status}을(를) 반환했습니다',

  dlgConfirmClearMsg: '모든 크롤 데이터를 지우시겠습니까?',
  dlgConfirmClearDetail:
    '현재 프로젝트에서 크롤된 모든 URL, 링크, 이미지, 헤더, 소스 스냅샷이 영구적으로 삭제됩니다. 되돌릴 수 없습니다.',
  dlgDontAskAgain: '다시 묻지 않기',
};
