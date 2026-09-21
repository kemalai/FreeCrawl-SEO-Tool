/**
 * Korean InfoTip ([i] tooltip) bodies, keyed by the verbatim English
 * source string. See `../info-tips.ts` for the rationale.
 */

export const KO_INFO_TIPS: Record<string, string> = {
  ["?page=1 / ?page=2 / ?page=4 → flags 'Sequence Break' on every member of the broken cluster."]:
    "?page=1 / ?page=2 / ?page=4 → 끊어진 그룹의 모든 구성원에 '시퀀스 단절'을 표시합니다.",
  ['`<a>` elements that look clickable but aren\'t crawlable (no href + onclick, `href="javascript:…"`, or `href="#"` with onclick).']:
    '클릭 가능해 보이지만 크롤링할 수 없는 `<a>` 요소(href 없이 onclick만 있음, `href="javascript:…"`, 또는 onclick이 붙은 `href="#"`).',
  ['`<link rel="amphtml" href="…">` value — the AMP version of this page. Empty when the page does not declare an AMP alternate.']:
    '`<link rel="amphtml" href="…">` 값 — 이 페이지의 AMP 버전. 페이지가 AMP 대체 버전을 선언하지 않으면 비어 있습니다.',
  ['`<link rel="next" href="…">` value resolved to absolute. Empty when the page is not paginated forward.']:
    '절대 경로로 변환된 `<link rel="next" href="…">` 값. 페이지에 다음 페이지네이션이 없으면 비어 있습니다.',
  ['`<link rel="prev" href="…">` value resolved to absolute. Empty when the page is the first in its pagination cluster.']:
    '절대 경로로 변환된 `<link rel="prev" href="…">` 값. 페이지가 페이지네이션 그룹의 첫 페이지이면 비어 있습니다.',
  ['`css` runs against the parsed DOM; `regex` runs against raw HTML.']:
    '`css`는 파싱된 DOM에서, `regex`는 원시 HTML에서 실행됩니다.',
  ['`none` disables auth; `basic` adds `Authorization: Basic <base64>`; `bearer` adds `Authorization: Bearer <token>`; `digest` performs the RFC 2617 challenge-response on the first 401.']:
    '`none`은 인증을 끕니다. `basic`은 `Authorization: Basic <base64>`를, `bearer`는 `Authorization: Bearer <token>`을 추가합니다. `digest`는 첫 401에서 RFC 2617 챌린지-응답을 수행합니다.',
  ['`POST <url>` is fired when the `done` event emits. 10 s timeout. Failures are logged as info events but never break the crawl.']:
    '`done` 이벤트가 발생하면 `POST <url>`이 전송됩니다. 타임아웃 10초. 실패는 정보 이벤트로 기록되지만 크롤링을 중단시키지는 않습니다.',
  ['0 (no duplicates), 7 (member of cluster #7)']: '0(중복 없음), 7(클러스터 #7의 구성원)',
  ['0 = auto. 4 for 8GB RAM machines, 8+ for 16GB+.']:
    '0 = 자동. 8GB RAM 머신은 4, 16GB 이상은 8+.',
  ["0 default; 250 ms when a host returns 429 with a 'too fast' message."]:
    "기본값 0. 호스트가 '너무 빠름' 메시지와 함께 429를 반환하면 250ms.",
  ['0 for SSR sites, 2000 for typical SPAs, 5000+ for heavy client-rendered apps.']:
    'SSR 사이트는 0, 일반적인 SPA는 2000, 무거운 클라이언트 렌더링 앱은 5000+.',
  ["0.1 default (Google 'good'); 0 to disable."]: "기본값 0.1(Google '양호' 기준). 0이면 비활성화.",
  ['1 = unique, 5 = part of a 5-page near-duplicate group']:
    '1 = 고유, 5 = 5페이지짜리 유사 중복 그룹의 일부',
  ['10 (default), 3 for very tight chains, 0 to remove the cap']:
    '10(기본값), 매우 엄격한 체인은 3, 상한을 없애려면 0',
  ['10 covers most sites; 3 limits crawls to top-of-funnel pages only.']:
    '10이면 대부분의 사이트를 커버합니다. 3은 크롤링을 퍼널 상단 페이지로만 제한합니다.',
  ['100 default for most audits; 0 to disable the check.']:
    '대부분의 감사에서 기본값 100. 검사를 비활성화하려면 0.',
  ['100 default; 50 for tight on-page link discipline; 0 to disable the issue.']:
    '기본값 100. 엄격한 페이지 내 링크 규율에는 50. 이 문제를 비활성화하려면 0.',
  ['1000000 (1M) for a full site audit; 5000 for spot checks.']:
    '전체 사이트 감사에는 1000000(1M), 부분 점검에는 5000.',
  ['1024 (1 MB) default; 150 for a lean HTML budget; 0 to disable.']:
    '기본값 1024(1 MB). 가벼운 HTML 예산에는 150. 비활성화하려면 0.',
  ['1048576 (1 MB) default; 524288 (512 KB) on tight disks; 0 to disable truncation entirely.']:
    '기본값 1048576(1 MB). 디스크가 부족하면 524288(512 KB). 잘라내기를 완전히 끄려면 0.',
  ['10485760 (10 MB) on bandwidth-tight crawls; 0 to download anything.']:
    '대역폭이 제한된 크롤링에는 10485760(10 MB). 무엇이든 다운로드하려면 0.',
  ['1366 = standard laptop, 1920 = full HD desktop, 375 = iPhone width.']:
    '1366 = 표준 노트북, 1920 = Full HD 데스크톱, 375 = iPhone 너비.',
  ['2 default; 0 to record errors immediately without retrying; 5 for unreliable upstreams.']:
    '기본값 2. 재시도 없이 즉시 오류를 기록하려면 0. 불안정한 업스트림에는 5.',
  ['20 default; 50 on fast first-party servers; 5 if the site rate-limits or returns 429s.']:
    '기본값 20. 빠른 자체 서버에는 50. 사이트가 속도를 제한하거나 429를 반환하면 5.',
  ['20 for typical sites; 5 to be polite on shared hosting; 60+ when crawling your own infra.']:
    '일반적인 사이트는 20. 공유 호스팅에서 예의를 지키려면 5. 자체 인프라를 크롤링할 때는 60+.',
  ['20000 (20 s) for typical use; 5000 for fast spot checks; 60000 for slow APIs.']:
    '일반 용도 20000(20초). 빠른 점검 5000. 느린 API 60000.',
  ['2048 (≈2 GB) on a 4 GB laptop; 8192 on a 16 GB workstation; 0 to disable.']:
    '4 GB 노트북은 2048(≈2 GB), 16 GB 워크스테이션은 8192. 비활성화하려면 0.',
  ['2048 default (RFC-suggested practical ceiling).']: '기본값 2048(RFC가 제안하는 실질적 상한).',
  ["2500 default (Google 'good'); 0 to disable."]:
    "기본값 2500(Google '양호' 기준). 0이면 비활성화.",
  ['3 = recommended; 5 catches looser duplicates (templated content with light variation); 0 turns the post-crawl pass off.']:
    '3 = 권장. 5는 더 느슨한 중복(약간의 변형이 있는 템플릿 콘텐츠)까지 잡습니다. 0은 크롤링 후 처리 단계를 끕니다.',
  ['4 default; 6 on documentation sites with deep TOC trees; 0 to disable.']:
    '기본값 4. 깊은 목차 트리가 있는 문서 사이트는 6. 비활성화하려면 0.',
  ['500 default. Bump to 2000 when retrying against a flaky API.']:
    '기본값 500. 불안정한 API에 재시도할 때는 2000으로 올리세요.',
  ['50000 keeps RAM bounded during big sitemap fan-outs; 0 for typical crawls.']:
    '50000은 대규모 사이트맵 확장 중에도 RAM을 제한합니다. 일반적인 크롤링은 0.',
  ['60000 (1 minute) for huge resources; 0 to rely solely on the fetch timeout.']:
    '거대한 리소스에는 60000(1분). 가져오기 타임아웃에만 의존하려면 0.',
  ['64-bit SimHash + LSH bucketing + Union-Find clustering on body shingles. Most expensive pass — typical 5–10 s on a 100k crawl.']:
    '본문 shingle에 대한 64비트 SimHash + LSH 버킷팅 + Union-Find 클러스터링. 가장 비용이 큰 단계 — 10만 페이지 크롤링에서 보통 5–10초.',
  ['768 = standard laptop, 1080 = full HD desktop, 667 = iPhone 8 height.']:
    '768 = 표준 노트북, 1080 = Full HD 데스크톱, 667 = iPhone 8 높이.',
  ['800 default; 200 for CDN-backed static; 0 to disable.']:
    '기본값 800. CDN 기반 정적 사이트는 200. 비활성화하려면 0.',
  ['Aborts @font-face / Google Fonts / WOFF2 requests. FOUT visible but text still renders.']:
    '@font-face / Google Fonts / WOFF2 요청을 중단합니다. FOUT가 보이지만 텍스트는 여전히 렌더링됩니다.',
  ['Aborts <img>, <picture>, background-image requests. Recommended for SEO crawls — image metadata still comes from <img> tag attributes.']:
    '<img>, <picture>, background-image 요청을 중단합니다. SEO 크롤링에 권장 — 이미지 메타데이터는 여전히 <img> 태그 속성에서 가져옵니다.',
  ['Aborts <video> / <audio> sources. Page DOM still includes the <video> tag.']:
    '<video> / <audio> 소스를 중단합니다. 페이지 DOM에는 <video> 태그가 그대로 남습니다.',
  ['Aborts all <script> requests. This defeats the purpose of JS rendering — use Text Only mode instead.']:
    '모든 <script> 요청을 중단합니다. JS 렌더링의 목적 자체를 무력화하므로 대신 텍스트 전용 모드를 사용하세요.',
  ['Aborts external CSS. Inline styles still load. WARNING: many SPAs use CSS-driven visibility / lazy classes — blocking CSS may hide content that JS depends on.']:
    '외부 CSS를 중단합니다. 인라인 스타일은 여전히 로드됩니다. 경고: 많은 SPA가 CSS 기반 가시성 / lazy 클래스를 사용합니다 — CSS를 차단하면 JS가 의존하는 콘텐츠가 숨겨질 수 있습니다.',
  ['Aborts requests whose total lifetime (connect + headers + body) exceeds this. Distinct from `requestTimeoutMs` which is the headers timeout. Useful for capping individual slow pages without lowering the overall fetch timeout.']:
    '총 소요 시간(연결 + 헤더 + 본문)이 이 값을 초과하는 요청을 중단합니다. 헤더 타임아웃인 `requestTimeoutMs`와는 다릅니다. 전체 가져오기 타임아웃을 낮추지 않고 개별 느린 페이지를 제한할 때 유용합니다.',
  ['Absolute redirect target parsed from the meta-refresh content. Empty when meta-refresh sets only a delay.']:
    'meta-refresh content에서 파싱한 절대 리디렉션 대상. meta-refresh가 지연만 설정하면 비어 있습니다.',
  ['Literal target of a JavaScript redirect found in an inline script (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Followed when "Follow JavaScript redirects" is on.']:
    '인라인 스크립트에서 발견된 JavaScript 리디렉션의 리터럴 대상(`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). "JavaScript 리디렉션 따라가기"가 켜져 있으면 따라갑니다.',
  ['Additional time to wait after the chosen wait condition fires, for SPA hydration / late XHRs. 0 = no extra wait. Bounded by the request timeout.']:
    '선택한 대기 조건이 충족된 후 SPA 하이드레이션 / 늦은 XHR을 위해 추가로 기다리는 시간. 0 = 추가 대기 없음. 요청 타임아웃에 의해 제한됩니다.',
  ['Anchor text of the broken link as rendered in the source page.']:
    '소스 페이지에 렌더링된 깨진 링크의 앵커 텍스트.',
  ['Audits the rendered DOM for WCAG AA colour-contrast failures (4.5:1 normal text, 3:1 large text) and stylesheet rules that suppress the keyboard focus outline without a :focus-visible fallback. Surfaces the Low-Contrast Text and Focus Outline Suppressed issue filters.']:
    '렌더링된 DOM에서 WCAG AA 색상 대비 실패(일반 텍스트 4.5:1, 큰 텍스트 3:1)와 :focus-visible 대체 없이 키보드 포커스 윤곽을 억제하는 스타일시트 규칙을 감사합니다. 저대비 텍스트 및 포커스 윤곽 억제 문제 필터에 데이터를 제공합니다.',
  ['basic/digest for /staging behind nginx; bearer for protected APIs']:
    'nginx 뒤의 /staging에는 basic/digest, 보호된 API에는 bearer',
  ['Below Normal while you keep working in other apps; Idle for overnight unattended runs.']:
    '다른 앱에서 계속 작업할 때는 보통 이하, 밤새 무인 실행에는 유휴.',
  ['BFS click depth from the start URL. Start URL = 0; its outlinks = 1; etc. High depth often correlates with low importance.']:
    '시작 URL로부터의 BFS 클릭 깊이. 시작 URL = 0, 그 아웃링크 = 1, 이런 식입니다. 깊이가 클수록 중요도가 낮은 경향이 있습니다.',
  ['Bodies over this are truncated and flagged. 1 MB covers the 99.9th percentile of HTML pages without letting one adversarial 50 MB page bloat the project file.']:
    '이 값을 넘는 본문은 잘리고 표시됩니다. 1 MB는 HTML 페이지의 99.9 백분위를 커버하면서 악의적인 50 MB 페이지 하나가 프로젝트 파일을 부풀리는 것을 막습니다.',
  ['Buy Affordable Game Keys | Example Store']: '저렴한 게임 키 구매 | 예시 스토어',
  ['Character count of the first H1.']: '첫 번째 H1의 글자 수.',
  ['Character count of the meta description. Recommended: 70–155 characters; over 155 risks truncation.']:
    '메타 설명의 글자 수. 권장: 70–155자. 155자를 넘으면 잘릴 위험이 있습니다.',
  ['Character count of the title. Recommended: 30–60 characters; over 60 risks truncation in SERPs.']:
    '제목의 글자 수. 권장: 30–60자. 60자를 넘으면 검색 결과에서 잘릴 위험이 있습니다.',
  ['Charikar 64-bit SimHash of body shingles. Used by the post-crawl near-duplicate clustering pass. Two SimHashes within the configured Hamming threshold are considered similar.']:
    '본문 shingle의 Charikar 64비트 SimHash. 크롤링 후 유사 중복 클러스터링 단계에서 사용됩니다. 설정된 해밍 임계값 내의 두 SimHash는 유사한 것으로 간주됩니다.',
  ['Coarse content classification derived from URL extension and Content-Type header.']:
    'URL 확장자와 Content-Type 헤더에서 도출한 대략적인 콘텐츠 분류.',
  ['Comma-joined sorted unique JSON-LD `@type` values declared on the page (Article, BreadcrumbList, Product, …).']:
    '페이지에 선언된 고유 JSON-LD `@type` 값을 정렬해 쉼표로 연결한 것(Article, BreadcrumbList, Product, …).',
  ['Contents of the first <meta name="description"> tag. May be used as the SERP snippet.']:
    '첫 번째 <meta name="description"> 태그의 내용. 검색 결과 스니펫으로 사용될 수 있습니다.',
  ['Contents of the first <meta name="robots"> tag. Controls per-page indexing/following behaviour.']:
    '첫 번째 <meta name="robots"> 태그의 내용. 페이지별 색인/링크 추적 동작을 제어합니다.',
  ['Contents of the first <title> element. Google primarily uses this in SERP titles.']:
    '첫 번째 <title> 요소의 내용. Google은 주로 이를 검색 결과 제목에 사용합니다.',
  ['Counts how many internal pages link to each URL. Drives the Most-Linked URLs report and the per-row Inlinks column.']:
    '각 URL로 링크하는 내부 페이지 수를 셉니다. 가장 많이 링크된 URL 보고서와 행별 인링크 열에 데이터를 제공합니다.',
  ["Crawl 3xx redirect targets. Each hop is its own row; the chain is reconstructed in the Response Codes view. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced)."]:
    "3xx 리디렉션 대상을 크롤링합니다. 각 홉은 별도의 행이며, 체인은 응답 코드 보기에서 재구성됩니다. Screaming Frog: 'Always Follow Redirects'(Configuration → Spider → Advanced).",
  ['Crawler RSS auto-pauses the queue when this is exceeded; resumes once memory drops to 80% of the cap. Soft cap — does not enforce a hard heap limit.']:
    '이 값을 초과하면 크롤러 RSS가 큐를 자동으로 일시 정지하고, 메모리가 상한의 80%로 떨어지면 재개합니다. 소프트 상한 — 하드 힙 제한을 강제하지 않습니다.',
  ['css for selectors, regex for free-form patterns']: '선택자에는 css, 자유 형식 패턴에는 regex',
  ["CSS selector that pins the duplicate-fingerprint text extraction to a specific page region. When set, the heuristic (main / role=main / article / body-minus-chrome) is bypassed and the selector wins. Useful on sites where the heuristic misclassifies — e.g. CMSes that wrap navigation inside `<main>` or sites with no semantic landmarks at all. Empty = use the heuristic. Invalid selectors silently fall back to the heuristic so a typo doesn't break the crawl."]:
    '중복 지문 텍스트 추출을 페이지의 특정 영역에 고정하는 CSS 선택자. 설정하면 휴리스틱(main / role=main / article / 크롬을 뺀 body)을 건너뛰고 선택자가 우선합니다. 휴리스틱이 잘못 분류하는 사이트 — 예: 내비게이션을 `<main>` 안에 감싸는 CMS나 시맨틱 랜드마크가 전혀 없는 사이트 — 에 유용합니다. 비어 있으면 휴리스틱을 사용합니다. 잘못된 선택자는 조용히 휴리스틱으로 대체되어 오타가 크롤링을 망가뜨리지 않습니다.',
  ["Cumulative Layout Shift from PageSpeed Insights, when present. Google's 'good' CLS threshold is 0.1. Unitless; accepts decimals. Pages without PSI data are never flagged."]:
    "PageSpeed Insights의 Cumulative Layout Shift(있는 경우). Google의 CLS '양호' 기준은 0.1입니다. 단위 없음, 소수 허용. PSI 데이터가 없는 페이지는 표시되지 않습니다.",
  ['Drives the View Source detail tab. ~30–200 KB on disk per HTML page; turn off if you only need metadata and not full source viewing.']:
    '소스 보기 상세 탭에 데이터를 제공합니다. HTML 페이지당 디스크 약 30–200 KB. 전체 소스 보기가 아니라 메타데이터만 필요하면 끄세요.',
  ["Each rule runs JavaScript RegExp.replace on the fully-normalised URL. Flags default to 'g'. After all rules run, the result is re-parsed as a URL — if the rewrite produces an invalid URL, the link is dropped at normalisation time."]:
    "각 규칙은 완전히 정규화된 URL에 JavaScript RegExp.replace를 실행합니다. 플래그 기본값은 'g'입니다. 모든 규칙 실행 후 결과는 URL로 다시 파싱됩니다 — 재작성 결과가 잘못된 URL이면 정규화 시점에 링크가 폐기됩니다.",
  ["Empty = safest. 'chrome' if you want the same Chrome version your users see."]:
    "비어 있음 = 가장 안전. 사용자가 보는 것과 같은 Chrome 버전을 원하면 'chrome'.",
  ["Empty = use the bundled Playwright Chromium build (recommended — pinned version, works everywhere). 'chrome' / 'msedge' uses the system-installed browser. Beta channels for testing newer features."]:
    "비어 있음 = Playwright에 번들된 Chromium 빌드 사용(권장 — 고정 버전, 어디서나 동작). 'chrome' / 'msedge'는 시스템에 설치된 브라우저를 사용합니다. 베타 채널은 새 기능 테스트용입니다.",
  ["Fetch internal <img> resources (incl. srcset / <picture> sources) so they appear in the Internal tab with their own status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl)."]:
    "내부 <img> 리소스(srcset / <picture> 소스 포함)를 가져와 내부 탭에 자체 상태 코드, 콘텐츠 유형, 크기와 함께 표시합니다. 각각 최대 URL 수에 포함됩니다. Screaming Frog: 'Check Images'(Configuration → Spider → Crawl).",
  ["Fetch internal <link rel=stylesheet> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl)."]:
    "내부 <link rel=stylesheet> 리소스를 가져와 내부 탭에 상태 코드, 콘텐츠 유형, 크기와 함께 표시합니다. 각각 최대 URL 수에 포함됩니다. Screaming Frog: 'Check CSS'(Configuration → Spider → Crawl).",
  ["Fetch internal <script src> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl)."]:
    "내부 <script src> 리소스를 가져와 내부 탭에 상태 코드, 콘텐츠 유형, 크기와 함께 표시합니다. 각각 최대 URL 수에 포함됩니다. Screaming Frog: 'Check JavaScript'(Configuration → Spider → Crawl).",
  ["Fetches /robots.txt sitemap directives + /sitemap.xml fallbacks. Powers the 'Non-Indexable in Sitemap' issue filter. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl)."]:
    "/robots.txt의 sitemap 지시문 + /sitemap.xml 대체 경로를 가져옵니다. '사이트맵 내 색인 불가' 문제 필터에 데이터를 제공합니다. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt'(Configuration → Spider → Crawl).",
  ["first/last for single value, all for JSON array, concat for ' | ' joined string"]:
    "단일 값은 first/last, JSON 배열은 all, ' | '로 연결된 문자열은 concat",
  ['FNV-1a 64-bit hash of the normalised body token stream. Two pages sharing this hash are byte-identical post-tokenisation — the basis of the Exact Duplicate filter.']:
    '정규화된 본문 토큰 스트림의 FNV-1a 64비트 해시. 이 해시를 공유하는 두 페이지는 토큰화 후 바이트 단위로 동일합니다 — 정확한 중복 필터의 기반입니다.',
  ['For Basic, sent base64-encoded; for Digest, hashed into the challenge response.']:
    'Basic은 base64로 인코딩해 전송하고, Digest는 챌린지 응답에 해시로 넣습니다.',
  ['For regex: `regex_group` extracts capture group 1; otherwise the whole match is used.']:
    'regex의 경우: `regex_group`은 캡처 그룹 1을 추출하고, 그 외에는 전체 일치를 사용합니다.',
  ['Full-page renders the entire scrollable canvas; Above-the-fold captures just the initial viewport (cheaper). Both writes two PNGs per URL.']:
    '전체 페이지는 스크롤 가능한 캔버스 전체를 렌더링하고, 상단 영역은 초기 뷰포트만 캡처합니다(저렴). 둘 다 URL당 PNG 두 개를 씁니다.',
  ['Google\'s index status, pulled from the URL Inspection API — not the Fetch button. Click "Inspect (top 100)" to fill this column; Fetch only pulls clicks / impressions / position.']:
    'URL Inspection API에서 가져온 Google 색인 상태 — 가져오기 버튼이 아닙니다. "검사(상위 100개)"를 클릭해 이 열을 채우세요. 가져오기는 클릭 / 노출 / 순위만 가져옵니다.',
  ["Googlebot — Smartphone matches Google's mobile-first indexing crawler."]:
    'Googlebot — Smartphone은 Google의 모바일 우선 색인 크롤러와 일치합니다.',
  ['Hard cap on pending URLs held in memory. Excess discoveries are dropped silently — bounds peak heap during fan-out bursts (big sitemaps, dense link graphs).']:
    '메모리에 보관되는 대기 URL의 하드 상한. 초과 발견은 조용히 폐기됩니다 — 확장 폭주(대규모 사이트맵, 조밀한 링크 그래프) 중 최대 힙을 제한합니다.',
  ['Hard cap on the number of 3xx hops we follow for a single chain. Each hop is recorded as its own URL row regardless. 0 disables the cap (chain still ends at `redirect_loop`).']:
    '단일 체인에서 따라가는 3xx 홉 수의 하드 상한. 각 홉은 어쨌든 별도의 URL 행으로 기록됩니다. 0은 상한을 없앱니다(체인은 여전히 `redirect_loop`에서 끝납니다).',
  ["Hard cap on total URLs crawled. The crawl stops as soon as this is reached. Screaming Frog: 'Limit Crawl Total'."]:
    "크롤링되는 총 URL의 하드 상한. 도달하는 즉시 크롤링이 멈춥니다. Screaming Frog: 'Limit Crawl Total'.",
  ["Hard ceiling on requests per second across all workers combined. Equivalent to Screaming Frog's 'Max URL/s'. Acts as a token bucket — even with high concurrency the crawler waits between bursts to stay below this rate."]:
    "모든 워커를 합친 초당 요청 수의 하드 상한. Screaming Frog의 'Max URL/s'에 해당합니다. 토큰 버킷처럼 동작합니다 — 동시성이 높아도 크롤러는 이 속도 아래에 머물도록 버스트 사이에 대기합니다.",
  ['Height attribute value (in pixels) declared on the <img> tag, when present.']:
    '<img> 태그에 선언된 height 속성 값(픽셀), 있는 경우.',
  ["Honor Disallow rules + crawl-delay declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "설정된 User-Agent에 대해 /robots.txt에 선언된 Disallow 규칙 + crawl-delay를 준수합니다. Screaming Frog: 'Respect robots.txt'(Configuration → robots.txt).",
  ["Hop count from the start URL. Start URL is depth 0; its outlinks are depth 1, theirs depth 2, and so on. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits)."]:
    "시작 URL로부터의 홉 수. 시작 URL은 깊이 0, 그 아웃링크는 깊이 1, 그 다음은 깊이 2, 이런 식입니다. Screaming Frog: 'Limit Crawl Depth'(Configuration → Spider → Limits).",
  ['How many distinct pages reference this image. High values typically indicate site-wide assets (logos, icons).']:
    '이 이미지를 참조하는 서로 다른 페이지 수. 값이 크면 보통 사이트 전체 자산(로고, 아이콘)입니다.',
  ["How to canonicalise paths with/without a trailing slash. 'Add' is file-extension aware — won't add a slash to /file.pdf or /image.png."]:
    "후행 슬래시가 있는/없는 경로를 정규화하는 방법. '추가'는 파일 확장자를 인식합니다 — /file.pdf나 /image.png에는 슬래시를 붙이지 않습니다.",
  ['HTML attribute name to read.']: '읽을 HTML 속성 이름.',
  ['HTML transfer size of the page document. Heavy HTML payloads delay first paint. Stored as bytes internally; entered here in kilobytes.']:
    '페이지 문서의 HTML 전송 크기. 무거운 HTML 페이로드는 첫 페인트를 지연시킵니다. 내부적으로 바이트로 저장되며 여기서는 킬로바이트로 입력합니다.',
  ['HTTP `<img>` / `<video>` / `<audio>` / `<source>` references on an HTTPS page — rendered but the URL bar reads "Not Secure".']:
    'HTTPS 페이지의 HTTP `<img>` / `<video>` / `<audio>` / `<source>` 참조 — 렌더링되지만 주소창에 "안전하지 않음"이 표시됩니다.',
  ['HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` references on an HTTPS page — browsers BLOCK these silently.']:
    'HTTPS 페이지의 HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` 참조 — 브라우저가 조용히 차단합니다.',
  ['HTTP response status code. Empty/Failed indicates a network error before any response was received.']:
    'HTTP 응답 상태 코드. 비어 있음/실패는 응답을 받기 전에 네트워크 오류가 발생했음을 뜻합니다.',
  ['HTTP status of the source page itself. Usually 200; if non-2xx the broken link may be inherited.']:
    '소스 페이지 자체의 HTTP 상태. 보통 200이며, 2xx가 아니면 깨진 링크가 상속된 것일 수 있습니다.',
  ['HTTP status returned by the target. 0 = network failure (DNS, TLS, timeout).']:
    '대상이 반환한 HTTP 상태. 0 = 네트워크 실패(DNS, TLS, 타임아웃).',
  ["HTTP/HTTPS proxies route via undici's ProxyAgent; SOCKS proxies (socks5://, socks5h://, socks4://, socks4a://) tunnel via the socks client. The `h`/`4a` variants resolve DNS at the proxy. Leave empty to inherit HTTPS_PROXY/HTTP_PROXY env vars."]:
    'HTTP/HTTPS 프록시는 undici의 ProxyAgent를 통해 라우팅되고, SOCKS 프록시(socks5://, socks5h://, socks4://, socks4a://)는 socks 클라이언트로 터널링됩니다. `h`/`4a` 변형은 프록시에서 DNS를 해석합니다. 비워 두면 HTTPS_PROXY/HTTP_PROXY 환경 변수를 상속합니다.',
  ["Identifies the largest element visible in the initial viewport (likely LCP candidate per Google's heuristic) and stores its CSS selector, dimensions, and resource URL. Useful for spotting unoptimised LCP images without a PSI API call."]:
    '초기 뷰포트에서 보이는 가장 큰 요소(Google 휴리스틱 기준 LCP 후보일 가능성이 큼)를 식별하고 CSS 선택자, 크기, 리소스 URL을 저장합니다. PSI API 호출 없이 최적화되지 않은 LCP 이미지를 찾는 데 유용합니다.',
  ['If set, Playwright waits for this CSS selector to appear in the DOM before extracting HTML. Overrides the extra-wait timeout when present. Useful when you know the SPA reveals a specific element after hydration.']:
    '설정하면 Playwright는 HTML을 추출하기 전에 이 CSS 선택자가 DOM에 나타날 때까지 기다립니다. 있으면 추가 대기 타임아웃보다 우선합니다. SPA가 하이드레이션 후 특정 요소를 드러낸다는 것을 알 때 유용합니다.',
  ['Images on this page that have no alt attribute. WCAG accessibility issue + missed alt-as-anchor SEO opportunity.']:
    '이 페이지에서 alt 속성이 없는 이미지. WCAG 접근성 문제 + alt를 앵커로 활용할 SEO 기회 상실.',
  ['Indexable / Non-Indexable']: '색인 가능 / 색인 불가',
  ['Internal PageRank, 0–100. Computed over the internal link graph (damping 0.85) and normalised so the most-linked page scores 100. Higher = more internal link equity.']:
    '내부 PageRank, 0–100. 내부 링크 그래프(감쇠 0.85)로 계산하고 가장 많이 링크된 페이지가 100이 되도록 정규화합니다. 높을수록 내부 링크 자산이 많습니다.',
  ['internal / external']: '내부 / 외부',
  ['JavaScript executed in every page BEFORE navigation begins (init script). Use to set localStorage / cookies / mock APIs / disable animations. Runs in page context — no Node access.']:
    '탐색이 시작되기 전에 모든 페이지에서 실행되는 JavaScript(초기화 스크립트). localStorage / 쿠키 설정 / API 모킹 / 애니메이션 비활성화에 사용하세요. 페이지 컨텍스트에서 실행됩니다 — Node 접근 불가.',
  ['JavaScript regex (no flags — /g is implicit). Use a capture group with `output=regex_group` to extract just part of the match.']:
    'JavaScript 정규식(플래그 없음 — /g는 암묵적). `output=regex_group`과 함께 캡처 그룹을 사용하면 일치의 일부만 추출할 수 있습니다.',
  ['JavaScript regex tested against the full URL. Empty = all URLs allowed. URL must match at least one to be enqueued. The start URL is always permitted regardless.']:
    '전체 URL에 대해 테스트되는 JavaScript 정규식. 비어 있으면 모든 URL 허용. 큐에 들어가려면 URL이 최소 하나와 일치해야 합니다. 시작 URL은 항상 허용됩니다.',
  ['JavaScript regex. Any match → URL is skipped, even if it would otherwise pass the include list. Common uses: skip admin areas, large file types, session-id query params.']:
    'JavaScript 정규식. 하나라도 일치하면 → 포함 목록을 통과하더라도 URL을 건너뜁니다. 일반적인 용도: 관리자 영역, 큰 파일 유형, 세션 ID 쿼리 매개변수 건너뛰기.',
  ['JSON map of `{ term: count }` literal-substring hits from the configured Custom Search terms.']:
    '설정된 사용자 지정 검색어의 리터럴 부분 문자열 일치를 담은 `{ term: count }` JSON 맵.',
  ['JSON-stringified array of `{ lang, href }` pairs. Heavy column — better consumed via the URL Details panel.']:
    '`{ lang, href }` 쌍의 JSON 직렬화 배열. 무거운 열 — URL 상세 패널에서 보는 것이 낫습니다.',
  ['JSON-stringified custom-extraction results map. Heavy column — render verbatim, easier to read in the URL Details panel.']:
    'JSON으로 직렬화된 사용자 지정 추출 결과 맵. 무거운 열 — 있는 그대로 렌더링되며 URL 상세 패널에서 읽기가 더 쉽습니다.',
  ['JSONPath against a JSON response body (e.g. `application/json` APIs). Only runs on responses that parse as JSON — ignored on HTML pages.']:
    'JSON 응답 본문(예: `application/json` API)에 대한 JSONPath. JSON으로 파싱되는 응답에서만 실행되며 HTML 페이지에서는 무시됩니다.',
  ['JSONPath returns the matched JSON value as-is; choose `Count` to return the number of matches instead.']:
    'JSONPath는 일치한 JSON 값을 그대로 반환합니다. 대신 일치 개수를 반환하려면 `Count`를 선택하세요.',
  ["Largest Contentful Paint from PageSpeed Insights lab data, when the URL has been audited. Google's 'good' LCP threshold is 2500 ms. Pages without PSI data are never flagged on this metric."]:
    "URL이 감사된 경우 PageSpeed Insights 실험실 데이터의 Largest Contentful Paint. Google의 LCP '양호' 기준은 2500 ms입니다. PSI 데이터가 없는 페이지는 이 지표로 표시되지 않습니다.",
  ['load = good default. networkidle for heavy SPAs. domcontentloaded if you only need raw HTML.']:
    'load = 무난한 기본값. 무거운 SPA에는 networkidle. 원시 HTML만 필요하면 domcontentloaded.',
  ['Location header value when status is 3xx. The URL the server points to next; chain length is in the URL Details panel.']:
    '상태가 3xx일 때의 Location 헤더 값. 서버가 다음으로 가리키는 URL이며, 체인 길이는 URL 상세 패널에 있습니다.',
  ['Lowercases the URL path component. Host is already case-insensitive per the URL spec, so this only affects the path.']:
    'URL 경로 부분을 소문자로 바꿉니다. 호스트는 URL 규격상 이미 대소문자를 구분하지 않으므로 경로에만 영향을 줍니다.',
  ['Near-duplicate cluster ID assigned by the post-crawl SimHash pass. 0 = singleton (no near-duplicates within the configured Hamming threshold). Pages sharing a non-zero cluster ID are mutually similar.']:
    '크롤링 후 SimHash 단계에서 할당된 유사 중복 클러스터 ID. 0 = 단독(설정된 해밍 임계값 내 유사 중복 없음). 0이 아닌 같은 클러스터 ID를 공유하는 페이지는 서로 유사합니다.',
  ['noindex, canonicalised, redirected, blocked-by-robots']:
    'noindex, 표준화됨, 리디렉션됨, robots에 의해 차단됨',
  ['None for fastest crawl. Above-the-fold for SERP-thumbnail-style preview. Full page when you need long-page snapshots.']:
    '가장 빠른 크롤링에는 없음. 검색 결과 썸네일 스타일 미리보기에는 상단 영역. 긴 페이지 스냅샷이 필요하면 전체 페이지.',
  ['Number of `<form action="http://…">` declarations on an HTTPS page. Submitting one downgrades the connection.']:
    'HTTPS 페이지의 `<form action="http://…">` 선언 수. 하나라도 제출하면 연결이 다운그레이드됩니다.',
  ['Number of `<link rel="alternate" hreflang>` entries declared on this page. 0 = no alternates declared.']:
    '이 페이지에 선언된 `<link rel="alternate" hreflang>` 항목 수. 0 = 선언된 대체 버전 없음.',
  ['Number of `<link rel="canonical">` tags on the page. >1 is a "Multiple Canonicals" issue.']:
    '페이지의 `<link rel="canonical">` 태그 수. >1이면 "다중 표준 링크" 문제입니다.',
  ['Number of `<script type="application/ld+json">` blocks parsed successfully on the page.']:
    '페이지에서 성공적으로 파싱된 `<script type="application/ld+json">` 블록 수.',
  ['Number of `<script type="application/ld+json">` blocks that failed to parse as JSON.']:
    'JSON으로 파싱하지 못한 `<script type="application/ld+json">` 블록 수.',
  ['Number of <img> elements on the page.']: '페이지의 <img> 요소 수.',
  ['Number of browser tabs the pool keeps warm in parallel. 0 = auto (matches crawler concurrency, capped at 8). More tabs = faster crawl but more RAM (each tab ~80–150 MB).']:
    '풀이 병렬로 준비 상태로 유지하는 브라우저 탭 수. 0 = 자동(크롤러 동시성과 동일, 최대 8). 탭이 많을수록 크롤링은 빨라지지만 RAM이 더 필요합니다(탭당 약 80–150 MB).',
  ['Number of hreflang targets that are non-200, noindex, or canonicalised away. Aggregated by the post-crawl pass.']:
    '200이 아니거나 noindex이거나 다른 곳으로 표준화된 hreflang 대상 수. 크롤링 후 단계에서 집계됩니다.',
  ["Number of HTTP requests in flight at any one time. Equivalent to Screaming Frog's 'Max Threads'. Higher = faster crawl + more load on the target server."]:
    "한 시점에 진행 중인 HTTP 요청 수. Screaming Frog의 'Max Threads'에 해당합니다. 높을수록 크롤링이 빠르고 대상 서버 부하가 커집니다.",
  ['Number of internal `<a>` elements with no usable anchor text or alt — accessibility / SEO regression.']:
    '사용 가능한 앵커 텍스트나 alt가 없는 내부 `<a>` 요소 수 — 접근성 / SEO 퇴행.',
  ['Number of internal pages that link to this URL. A rough internal-PageRank signal.']:
    '이 URL로 링크하는 내부 페이지 수. 대략적인 내부 PageRank 신호입니다.',
  ["Number of pages in this URL's near-duplicate cluster (1 = no duplicates, ≥2 = part of a duplicate group). Tunable via Settings → Duplicates."]:
    '이 URL의 유사 중복 클러스터에 속한 페이지 수(1 = 중복 없음, ≥2 = 중복 그룹의 일부). 설정 → 중복에서 조정할 수 있습니다.',
  ['Number of redirect hops from this URL to its terminal target. Filled by the post-crawl `recomputeRedirectChains` walker. >3 trips the "Long Chain" issue.']:
    '이 URL에서 최종 대상까지의 리디렉션 홉 수. 크롤링 후 `recomputeRedirectChains` 워커가 채웁니다. >3이면 "긴 체인" 문제가 발생합니다.',
  ['Number of unique <a> links emitted from this page (internal + external).']:
    '이 페이지에서 나가는 고유 <a> 링크 수(내부 + 외부).',
  ['Off — only enable for testing edge cases.']: '끔 — 엣지 케이스 테스트에만 켜세요.',
  ['Off — small speed gain not worth the fidelity loss.']:
    '끔 — 약간의 속도 향상이 정확도 손실을 감수할 만큼은 아닙니다.',
  ['On — fonts add overhead without changing SEO output.']:
    '켬 — 폰트는 SEO 결과를 바꾸지 않으면서 오버헤드만 늘립니다.',
  ['On (default) — cheap I/O, high SEO value.']:
    '켬(기본값) — I/O 비용이 낮고 SEO 가치가 높습니다.',
  ['On (default) — media is heavy and rarely SEO-relevant.']:
    '켬(기본값) — 미디어는 무겁고 SEO와 관련 있는 경우가 드뭅니다.',
  ['On (default) so the Internal tab shows images, not just HTML; off for HTML-only crawls.']:
    '켬(기본값)이면 내부 탭에 HTML뿐 아니라 이미지도 표시됩니다. HTML 전용 크롤링에는 끄세요.',
  ['On (default); off for HTML-only crawls.']: '켬(기본값). HTML 전용 크롤링에는 끔.',
  ['On (default). Off only when crawling sites you own and need to bypass.']:
    '켬(기본값). 우회가 필요한 자신의 사이트를 크롤링할 때만 끄세요.',
  ['On for accessibility / WCAG audits.']: '접근성 / WCAG 감사에는 켬.',
  ['On for max speed. Off if you need LCP candidate detection or visual screenshots later.']:
    '최대 속도에는 켬. 나중에 LCP 후보 감지나 시각적 스크린샷이 필요하면 끔.',
  ['On for modern sites that 301 http→https anyway; off for legacy intranet.']:
    '어차피 http→https로 301하는 현대 사이트에는 켬. 레거시 인트라넷에는 끔.',
  ['On for normal audits; off when you only want to inspect raw 3xx behaviour.']:
    '일반 감사에는 켬. 원시 3xx 동작만 검사하려면 끔.',
  ['On for outbound link audits; off for fast internal-only crawls.']:
    '아웃바운드 링크 감사에는 켬. 빠른 내부 전용 크롤링에는 끔.',
  ['On for performance-focused audits that should fail pages over a target.']:
    '목표를 초과하는 페이지를 실패 처리해야 하는 성능 중심 감사에는 켬.',
  ['On for performance-focused audits.']: '성능 중심 감사에는 켬.',
  ['On for production crawls. Off when debugging selector-not-found / hydration issues.']:
    '프로덕션 크롤링에는 켬. 선택자 미발견 / 하이드레이션 문제를 디버깅할 때는 끔.',
  ['ON for SEO audits (the typical case). Turn OFF to also cluster paginated / canonical-blocked variants for completeness.']:
    'SEO 감사(일반적인 경우)에는 켬. 완전성을 위해 페이지네이션 / 표준 링크로 차단된 변형까지 클러스터링하려면 끔.',
  ["On for SEO audits that include Google's Mobile-Friendly checks."]:
    'Google 모바일 친화성 검사를 포함하는 SEO 감사에는 켬.',
  ['On for SEO audits where View Source matters; off for 1M-URL crawls where disk is tight.']:
    '소스 보기가 중요한 SEO 감사에는 켬. 디스크가 부족한 100만 URL 크롤링에는 끔.',
  ['ON for SEO audits. OFF only when you specifically need to inspect raw-URL collisions (e.g. case-sensitive filesystem CMSes).']:
    'SEO 감사에는 켬. 원시 URL 충돌(예: 대소문자를 구분하는 파일 시스템 CMS)을 특별히 검사해야 할 때만 끄세요.',
  ['On if you need nofollow attribute audits; off keeps the link graph cleaner.']:
    'nofollow 속성 감사가 필요하면 켬. 끄면 링크 그래프가 더 깔끔해집니다.',
  ['On if your CMS serves the same page at mixed casing (/Foo and /foo).']:
    'CMS가 같은 페이지를 대소문자가 섞인 형태(/Foo와 /foo)로 제공하면 켬.',
  ['On if your site canonicalises to non-www but emits www links somewhere.']:
    '사이트가 www 없는 형태로 표준화하지만 어딘가에서 www 링크를 내보내면 켬.',
  ["On network errors, 408/425/429/5xx responses, retry up to N more times before giving up. Each retry counts toward the URL's response time budget."]:
    '네트워크 오류 및 408/425/429/5xx 응답 시 포기하기 전에 최대 N번 더 재시도합니다. 각 재시도는 URL의 응답 시간 예산에 포함됩니다.',
  ['On when auditing mobile UX or capturing PageSpeed-style mobile previews.']:
    '모바일 UX를 감사하거나 PageSpeed 스타일 모바일 미리보기를 캡처할 때 켬.',
  ["One header per line in 'Key: Value' format. Added to every request — useful for auth tokens or custom routing hints. User values override defaults when keys collide."]:
    "'Key: Value' 형식으로 한 줄에 헤더 하나. 모든 요청에 추가됩니다 — 인증 토큰이나 사용자 지정 라우팅 힌트에 유용합니다. 키가 겹치면 사용자 값이 기본값을 덮어씁니다.",
  ['One sitemap URL per line. On top of following links from the start URL, the crawler fetches these sitemaps and queues every page they list as an extra seed — faster/more complete discovery, and reliable orphan detection even when the sitemap lives at a non-standard path. Leave empty to disable.']:
    '한 줄에 사이트맵 URL 하나. 시작 URL에서 링크를 따라가는 것에 더해 크롤러가 이 사이트맵들을 가져와 나열된 모든 페이지를 추가 시드로 큐에 넣습니다 — 더 빠르고 완전한 발견, 그리고 사이트맵이 비표준 경로에 있어도 신뢰할 수 있는 고아 페이지 감지. 비활성화하려면 비워 두세요.',
  ['One URL per line. Each is fetched exactly once; outlinks are NOT followed. Comments starting with # are ignored.']:
    '한 줄에 URL 하나. 각각 정확히 한 번만 가져오며 아웃링크는 따라가지 않습니다. #으로 시작하는 주석은 무시됩니다.',
  ['OS scheduler hint applied at crawl start. Lowering priority lets the rest of the machine stay responsive during heavy crawls. May require elevated privileges on some platforms.']:
    '크롤링 시작 시 적용되는 OS 스케줄러 힌트. 우선순위를 낮추면 무거운 크롤링 중에도 나머지 시스템이 응답성을 유지합니다. 일부 플랫폼에서는 상승된 권한이 필요할 수 있습니다.',
  ["Page A→B declared but B→A absent flags 'Reciprocity Missing'; same lang on two hrefs flags 'Inconsistent Lang'."]:
    "페이지 A→B는 선언됐지만 B→A가 없으면 '상호 참조 누락'을, 두 href에 같은 lang이 있으면 'lang 불일치'를 표시합니다.",
  ['Page that contains the broken link.']: '깨진 링크를 포함한 페이지.',
  ["Pages with > this many outgoing links (internal + external) trip the 'Total Links per Page' issue. Google's historic recommendation is 100; mega-menus/hub-pages routinely blow past this."]:
    "나가는 링크(내부 + 외부)가 이 수를 넘는 페이지는 '페이지당 총 링크 수' 문제를 유발합니다. Google의 오랜 권장치는 100이며, 메가 메뉴/허브 페이지는 흔히 이를 크게 넘습니다.",
  ['PASS = indexed · FAIL = not indexed · PART/NEU = discovered but not yet indexed']:
    'PASS = 색인됨 · FAIL = 색인 안 됨 · PART/NEU = 발견됐지만 아직 색인 안 됨',
  ['Pattern: ^https://m\\.(.+) · Replacement: https://www.$1 · Flags: i  (collapse mobile subdomain to www)']:
    '패턴: ^https://m\\.(.+) · 치환: https://www.$1 · 플래그: i  (모바일 서브도메인을 www로 병합)',
  ["Per-request abort threshold. Pages that take longer than this are recorded as network errors. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — that one's in seconds, this is in milliseconds."]:
    "요청당 중단 임계값. 이보다 오래 걸리는 페이지는 네트워크 오류로 기록됩니다. Screaming Frog: 'Response Timeout (secs)'(Configuration → Spider → Advanced) — 그쪽은 초 단위, 여기는 밀리초 단위입니다.",
  ['Persist rel="nofollow" links in the link graph. When off, nofollow links are dropped entirely (not counted in outlinks, not probed as externals). Screaming Frog inverse: turning this ON ≈ unchecking "Follow Internal/External Nofollow".']:
    'rel="nofollow" 링크를 링크 그래프에 유지합니다. 끄면 nofollow 링크는 완전히 버려집니다(아웃링크에 포함되지 않고 외부 링크로 검사되지 않음). Screaming Frog의 반대: 이것을 켜는 것 ≈ "Follow Internal/External Nofollow" 체크 해제.',
  ['Picking a preset fills the User-Agent field below — you can still hand-edit it afterwards. Switch between Googlebot Smartphone / Desktop to compare how a site responds to mobile vs desktop crawlers.']:
    '프리셋을 선택하면 아래 User-Agent 필드가 채워집니다 — 이후 직접 수정할 수 있습니다. Googlebot Smartphone / Desktop을 전환해 사이트가 모바일과 데스크톱 크롤러에 어떻게 응답하는지 비교하세요.',
  ["Picks one of the saved profiles by name. Empty = use the Proxy URL field above (or env vars when that's also empty)."]:
    '저장된 프로필 중 하나를 이름으로 선택합니다. 비어 있으면 위의 프록시 URL 필드를 사용합니다(그것도 비어 있으면 환경 변수).',
  ['Pre-computes Dead External Domain, Duplicate URL post-norm, Canonical Chain Multi-hop. Without this the sidebar shows 0 for those three.']:
    '죽은 외부 도메인, 정규화 후 중복 URL, 다중 홉 표준 링크 체인을 미리 계산합니다. 이것이 없으면 사이드바에 이 세 항목이 0으로 표시됩니다.',
  ['After the crawl, re-fetches a sample of indexable pages with the opposite user agent (mobile when the crawl ran as desktop, desktop otherwise) and compares title, H1, meta description, canonical, robots, word count and link count. Differences feed the \'Mobile / Desktop Mismatch\' issue and the report of the same name.']:
    '크롤 후 색인 가능한 페이지 샘플을 반대 사용자 에이전트(데스크톱 크롤이면 모바일, 그 반대도 마찬가지)로 다시 가져와 제목, H1, 메타 설명, 캐노니컬, robots, 단어 수, 링크 수를 비교합니다. 차이는 \'모바일 / 데스크톱 불일치\' 이슈와 같은 이름의 보고서에 반영됩니다.',
  ['How many pages the mobile-parity probe re-fetches, most-linked first. 0 = every indexable HTML page (doubles the crawl\'s traffic for that set).']:
    '모바일 패리티 프로브가 다시 가져오는 페이지 수이며 인링크가 많은 순입니다. 0 = 모든 색인 가능 HTML 페이지(해당 집합의 크롤 트래픽이 두 배가 됨).',
  ["Probe outbound links to other hosts (HEAD only) so the Broken Links view catches dead externals. Screaming Frog: 'External Links' (Configuration → Spider → Crawl)."]:
    "다른 호스트로 나가는 링크를 검사(HEAD만)하여 깨진 링크 보기가 죽은 외부 링크를 잡아냅니다. Screaming Frog: 'External Links'(Configuration → Spider → Crawl).",
  ['Raw `Content-Security-Policy` response header. Empty when missing.']:
    '원시 `Content-Security-Policy` 응답 헤더. 없으면 비어 있습니다.',
  ['Raw `content` attribute of `<meta http-equiv="refresh">`, e.g. "5; url=/foo".']:
    '`<meta http-equiv="refresh">`의 원시 `content` 속성, 예: "5; url=/foo".',
  ['Raw `Strict-Transport-Security` header. Empty when missing — for HTTPS pages this is a security regression.']:
    '원시 `Strict-Transport-Security` 헤더. 없으면 비어 있습니다 — HTTPS 페이지에서는 보안 퇴행입니다.',
  ['Raw `X-Content-Type-Options` header. `nosniff` blocks MIME sniffing — prevents some XSS via content-type confusion.']:
    '원시 `X-Content-Type-Options` 헤더. `nosniff`는 MIME 스니핑을 차단합니다 — content-type 혼동을 통한 일부 XSS를 막습니다.',
  ['Raw `X-Frame-Options` header. SAMEORIGIN / DENY / ALLOW-FROM. Clickjacking defence.']:
    '원시 `X-Frame-Options` 헤더. SAMEORIGIN / DENY / ALLOW-FROM. 클릭재킹 방어.',
  ['Raw value of the Content-Type response header (incl. charset).']:
    'Content-Type 응답 헤더의 원시 값(charset 포함).',
  ['Re-renders each page on a mobile viewport and checks viewport meta tag, horizontal overflow, font size legibility, and tap-target spacing. Stores a pass/fail verdict on the urls table.']:
    '각 페이지를 모바일 뷰포트에서 다시 렌더링하고 viewport 메타 태그, 가로 넘침, 글꼴 크기 가독성, 탭 대상 간격을 검사합니다. 통과/실패 판정을 urls 테이블에 저장합니다.',
  ['Read the full article →']: '전체 글 읽기 →',
  ["Reject-all = ignore Set-Cookie entirely (zero counts on cookie-flag issues). Block-third-party = analyse only first-party cookies (Domain attribute matches the page's registrable domain). Accept-all = analyse every Set-Cookie regardless of scope."]:
    '모두 거부 = Set-Cookie를 완전히 무시(쿠키 플래그 문제 카운트 0). 서드파티 차단 = 퍼스트파티 쿠키만 분석(Domain 속성이 페이지의 등록 가능 도메인과 일치). 모두 허용 = 범위와 무관하게 모든 Set-Cookie 분석.',
  ["Reject-all for stateless audits; Block-third-party to focus on the site's own cookie hygiene; Accept-all to also see ad/analytics tracker cookies."]:
    '상태 비저장 감사에는 모두 거부. 사이트 자체 쿠키 위생에 집중하려면 서드파티 차단. 광고/분석 트래커 쿠키까지 보려면 모두 허용.',
  ["Removes the leading 'www.' from the host at normalisation time. The seen-set, redirect graph, and link extraction all use the rewritten form, so duplicates collapse correctly."]:
    "정규화 시 호스트 앞의 'www.'를 제거합니다. 방문 집합, 리디렉션 그래프, 링크 추출이 모두 재작성된 형태를 사용하므로 중복이 올바르게 합쳐집니다.",
  ['Renders the page a second time on a mobile viewport and stores an above-the-fold PNG. Adds another full render + screenshot per URL.']:
    '페이지를 모바일 뷰포트에서 한 번 더 렌더링하고 상단 영역 PNG를 저장합니다. URL당 전체 렌더링 + 스크린샷이 하나 더 추가됩니다.',
  ['Resolved absolute URL of the <img src> attribute.']: '<img src> 속성의 변환된 절대 URL.',
  ['Response body size in bytes (compressed transfer size, post-Content-Encoding).']:
    '응답 본문 크기(바이트, Content-Encoding 이후의 압축 전송 크기).',
  ['Rewrites http:// to https:// before fetching. Breaks HTTP-only sites.']:
    '가져오기 전에 http://를 https://로 재작성합니다. HTTP 전용 사이트는 동작하지 않게 됩니다.',
  ['Run Chromium without a visible window. Turn off to debug rendering visually — useful when a page renders correctly in a normal browser but not under Playwright.']:
    '보이는 창 없이 Chromium을 실행합니다. 렌더링을 시각적으로 디버깅하려면 끄세요 — 일반 브라우저에서는 정상 렌더링되지만 Playwright에서는 아닐 때 유용합니다.',
  ['Run the login steps once before the crawl, then replay the session cookies on every request.']:
    '크롤링 전에 로그인 단계를 한 번 실행한 뒤, 모든 요청에 세션 쿠키를 재사용합니다.',
  ["Runs iterative PageRank (damping 0.85) over the internal link graph and normalises it to a 0–100 Link Score per page. Drives the Link Score column and the 'By Link Score' visualization colour mode."]:
    "내부 링크 그래프에서 반복 PageRank(감쇠 0.85)를 실행하고 페이지당 0–100 링크 점수로 정규화합니다. 링크 점수 열과 시각화의 '링크 점수별' 색상 모드에 데이터를 제공합니다.",
  ['Sends the URL through the same normalisation pipeline used by the crawler, with your unsaved settings applied. Useful for verifying regex rules before kicking off a crawl.']:
    '저장하지 않은 설정을 적용한 상태로 크롤러와 동일한 정규화 파이프라인에 URL을 통과시킵니다. 크롤링을 시작하기 전에 정규식 규칙을 검증할 때 유용합니다.',
  ['Sent on every request as the User-Agent header. Identifies the crawler to servers; some sites serve different content based on UA.']:
    '모든 요청에 User-Agent 헤더로 전송됩니다. 서버에 크롤러를 식별시키며, 일부 사이트는 UA에 따라 다른 콘텐츠를 제공합니다.',
  ['Sent on every request. Affects which locale a multi-lingual site serves you.']:
    '모든 요청에 전송됩니다. 다국어 사이트가 어떤 로캘을 제공할지에 영향을 줍니다.',
  ["Sent verbatim as `Bearer <token>`. Don't include the `Bearer ` prefix yourself."]:
    '`Bearer <token>` 형태로 그대로 전송됩니다. `Bearer ` 접두사를 직접 넣지 마세요.',
  ['Server response time (a TTFB proxy) measured during the crawl. Pages slower than this are flagged. Google considers a good server response time under 800 ms.']:
    '크롤링 중 측정한 서버 응답 시간(TTFB 대용). 이보다 느린 페이지가 표시됩니다. Google은 800 ms 미만의 서버 응답 시간을 양호하다고 봅니다.',
  ['Shop the latest game keys at unbeatable prices…']: '최신 게임 키를 최저가로 구매하세요…',
  ["Skips body parsing for pages whose Content-Length header exceeds this. The page row is still created so links to it aren't lost; only body parsing and source snapshot capture are skipped."]:
    'Content-Length 헤더가 이 값을 초과하는 페이지의 본문 파싱을 건너뜁니다. 해당 페이지로 향하는 링크가 유실되지 않도록 페이지 행은 여전히 생성되며, 본문 파싱과 소스 스냅샷 캡처만 건너뜁니다.',
  ['Sleep this long on each worker AFTER a response completes, before it picks up the next URL. Stacks with the global RPS cap — useful for sites that rate-limit on inter-request gap rather than total throughput.']:
    '각 워커가 응답 완료 후 다음 URL을 집어 들기 전에 이만큼 대기합니다. 전역 RPS 상한과 중첩됩니다 — 총 처리량이 아니라 요청 간격으로 속도를 제한하는 사이트에 유용합니다.',
  ['Specific reason a URL is non-indexable. For Indexable URLs this column is empty.']:
    'URL이 색인 불가인 구체적인 이유. 색인 가능한 URL에서는 이 열이 비어 있습니다.',
  ['Spider follows links from the start URL across the chosen scope. List fetches a fixed set of URLs once with no link-following. Sitemap fetches a sitemap URL and crawls every page it lists (no link-following).']:
    'Spider는 선택한 범위에서 시작 URL로부터 링크를 따라갑니다. 목록은 고정된 URL 집합을 링크 추적 없이 한 번 가져옵니다. 사이트맵은 사이트맵 URL을 가져와 나열된 모든 페이지를 크롤링합니다(링크 추적 없음).',
  ["Spider for full site audits; List for re-checking a known set of pages; Sitemap to audit exactly what's published in sitemap.xml."]:
    '전체 사이트 감사에는 Spider, 알려진 페이지 집합을 재확인하려면 목록, sitemap.xml에 게시된 내용을 정확히 감사하려면 사이트맵.',
  ['Standard CSS selector — same syntax as `document.querySelectorAll`.']:
    '표준 CSS 선택자 — `document.querySelectorAll`과 같은 문법.',
  ['Stored in your local prefs file as plain text. Treat the file accordingly.']:
    '로컬 환경설정 파일에 일반 텍스트로 저장됩니다. 파일을 그에 맞게 다루세요.',
  ['Strip if your site canonicalises /foo (no slash); Add for sites that canonicalise /foo/.']:
    '사이트가 /foo(슬래시 없음)로 표준화하면 제거, /foo/로 표준화하면 추가.',
  ['Sunset over the mountain ridge']: '산등성이 위의 일몰',
  ['Surplus `@id` occurrences across all JSON-LD blocks (page declares the same `@id` more than once).']:
    '모든 JSON-LD 블록에 걸친 잉여 `@id` 출현(페이지가 같은 `@id`를 두 번 이상 선언).',
  ['Terminal URL the redirect chain resolves to. Empty when this row is itself the terminal (i.e. status is 2xx/4xx/5xx) or when the chain hits a loop.']:
    '리디렉션 체인이 최종적으로 도달하는 URL. 이 행 자체가 종점(즉 상태가 2xx/4xx/5xx)이거나 체인이 루프에 빠지면 비어 있습니다.',
  ['Canonical hops walked after this page (or, on a redirect row, after the redirect\'s final URL) until a page that canonicalises to itself. 0 when the canonical is the page itself or absent.']:
    '이 페이지(리디렉션 행에서는 리디렉션의 최종 URL) 이후 자기 자신을 캐노니컬로 가리키는 페이지까지 따라간 캐노니컬 홉 수. 캐노니컬이 페이지 자신이거나 없으면 0.',
  ['Where the canonical chain ends. Empty when the page is its own canonical, or when the chain loops.']:
    '캐노니컬 체인이 끝나는 위치. 페이지가 자기 자신의 캐노니컬이거나 체인이 순환하면 비어 있습니다.',
  ['text for visible content, attribute for href/src, count for occurrence count']:
    '보이는 콘텐츠는 text, href/src는 attribute, 출현 횟수는 count',
  ['Text of the first <h1> on the page. Should match user intent and ideally complement (not duplicate) the title.']:
    '페이지 첫 <h1>의 텍스트. 사용자 의도와 맞아야 하며, 제목을 중복하지 않고 보완하는 것이 이상적입니다.',
  ["Text Only fetches the raw HTML response as-is — fast and deterministic. Old AJAX Crawling Scheme rewrites hashbang (#!) URLs to Google's deprecated ?_escaped_fragment_= form so a pre-rendering server returns the snapshot. Full JavaScript rendering is a V2 item."]:
    '텍스트 전용은 원시 HTML 응답을 있는 그대로 가져옵니다 — 빠르고 결정적입니다. 구 AJAX 크롤링 스킴은 해시뱅(#!) URL을 Google의 폐기된 ?_escaped_fragment_= 형식으로 재작성해 프리렌더링 서버가 스냅샷을 반환하게 합니다. 완전한 JavaScript 렌더링은 V2 항목입니다.',
  ['Text Only for server-rendered / static sites; Old AJAX only for legacy hashbang SPAs.']:
    '서버 렌더링 / 정적 사이트에는 텍스트 전용, 레거시 해시뱅 SPA에만 구 AJAX.',
  ["The column / JSON-key name for this rule's output. Free-form."]:
    '이 규칙의 출력에 사용할 열 / JSON 키 이름. 자유 형식.',
  ['The fully normalised URL of the crawled resource (post URL-rewriting).']:
    '크롤링된 리소스의 완전히 정규화된 URL(URL 재작성 이후).',
  ['The URL that fails to resolve (4xx/5xx/network error).']:
    '해석에 실패하는 URL(4xx/5xx/네트워크 오류).',
  ['Third-party `<script>` / `<link rel=stylesheet>` references without an `integrity=` attribute. SRI is recommended for any cross-origin subresource.']:
    '`integrity=` 속성이 없는 서드파티 `<script>` / `<link rel=stylesheet>` 참조. 모든 교차 출처 하위 리소스에 SRI가 권장됩니다.',
  ['Time-to-first-byte in milliseconds (network + server, excluding parse). Lower is better; >2000 ms is slow.']:
    '첫 바이트까지의 시간(밀리초, 네트워크 + 서버, 파싱 제외). 낮을수록 좋으며 >2000 ms는 느립니다.',
  ['Total number of <h1> elements on the page. SEO best practice is exactly 1.']:
    '페이지의 <h1> 요소 총 수. SEO 모범 사례는 정확히 1개입니다.',
  ['Total number of <h2> elements on the page.']: '페이지의 <h2> 요소 총 수.',
  ['tr,en;q=0.8 — Turkish first, English fallback.']: 'tr,en;q=0.8 — 터키어 우선, 영어 대체.',
  ["Trips 'Folder Depth Too Deep' when the URL path's `/`-segment count exceeds this. Useful for spotting over-nested URL structures that bury content from crawlers."]:
    "URL 경로의 `/` 구간 수가 이 값을 초과하면 '폴더 깊이 과다'가 발생합니다. 콘텐츠를 크롤러로부터 깊이 묻어 버리는 과도하게 중첩된 URL 구조를 찾는 데 유용합니다.",
  ["Trips 'Long Query String' when LENGTH(query) > this. Typical session-id sprawl + UTM tracking hits 100+ chars; over 200 starts to look like a bug."]:
    "LENGTH(query) > 이 값이면 '긴 쿼리 문자열'이 발생합니다. 흔한 세션 ID 확산 + UTM 추적은 100자 이상에 이르며, 200을 넘으면 버그처럼 보이기 시작합니다.",
  ["Trips the 'URL Too Long' issue when LENGTH(url) > this. RFC 7230 doesn't mandate a max but most servers + middleboxes fail above ~2 KB; Chrome itself caps at ~32 KB."]:
    "LENGTH(url) > 이 값이면 'URL이 너무 김' 문제가 발생합니다. RFC 7230은 최대치를 정하지 않지만 대부분의 서버와 중간 장비는 약 2 KB 이상에서 실패하며, Chrome 자체는 약 32 KB로 제한합니다.",
  ["Two modes per line. (1) Wrap in slashes for a regex: /pattern/flags — supported flags imsuy (g is forced). Invalid patterns appear with count -1 in the detail panel so you can spot the typo. (2) Anything else is a literal case-insensitive substring — the legacy behaviour. Each term's per-page hit count is surfaced in the URL Details panel."]:
    '한 줄당 두 가지 모드. (1) 정규식은 슬래시로 감쌉니다: /패턴/플래그 — 지원 플래그 imsuy(g는 강제). 잘못된 패턴은 상세 패널에 카운트 -1로 표시되어 오타를 찾을 수 있습니다. (2) 그 외는 모두 대소문자를 구분하지 않는 리터럴 부분 문자열 — 기존 동작입니다. 각 검색어의 페이지별 일치 수는 URL 상세 패널에 표시됩니다.',
  ["Two pages are flagged as near-duplicates if their 64-bit SimHash differs by at most this many bits. 3 ≈ 95% similarity over body-text shingles (Screaming Frog's tightest filter). Set to 0 to skip clustering entirely."]:
    '두 페이지의 64비트 SimHash가 이 비트 수 이하로 다르면 유사 중복으로 표시됩니다. 3 ≈ 본문 텍스트 shingle 기준 95% 유사도(Screaming Frog의 가장 엄격한 필터). 클러스터링을 완전히 건너뛰려면 0으로 설정하세요.',
  ['URL declared by the first <link rel="canonical"> tag. Tells search engines which version to index when duplicates exist.']:
    '첫 번째 <link rel="canonical"> 태그가 선언한 URL. 중복이 있을 때 검색 엔진에 어떤 버전을 색인할지 알려줍니다.',
  ['URL paths ending in any of these extensions are not enqueued. Case-insensitive. Start URL is always crawled regardless.']:
    '이 확장자 중 하나로 끝나는 URL 경로는 큐에 넣지 않습니다. 대소문자 구분 없음. 시작 URL은 항상 크롤링됩니다.',
  ['Value of the alt attribute. Empty cell = no alt declared (accessibility/SEO issue).']:
    'alt 속성 값. 빈 셀 = alt가 선언되지 않음(접근성/SEO 문제).',
  ['Value of the X-Robots-Tag HTTP response header. Same semantics as meta robots but applied at the server.']:
    'X-Robots-Tag HTTP 응답 헤더 값. meta robots와 같은 의미지만 서버에서 적용됩니다.',
  ['Viewport height — affects above-the-fold detection and lazy-load triggers.']:
    '뷰포트 높이 — 상단 영역 감지와 지연 로드 트리거에 영향을 줍니다.',
  ['Viewport width applied to every rendered page. Mobile audits typically use 360–414, desktop 1280–1920.']:
    '렌더링되는 모든 페이지에 적용되는 뷰포트 너비. 모바일 감사는 보통 360–414, 데스크톱은 1280–1920을 사용합니다.',
  ['Visible body text word count (excludes <script>/<style>). Useful for identifying thin content.']:
    '보이는 본문 텍스트의 단어 수(<script>/<style> 제외). 빈약한 콘텐츠를 식별하는 데 유용합니다.',
  ['Wait this long before the FIRST retry, doubling on each subsequent attempt (500 → 1000 → 2000 …).']:
    '첫 번째 재시도 전에 이만큼 기다리고, 이후 시도마다 두 배로 늘립니다(500 → 1000 → 2000 …).',
  ["Walks 3xx redirect chains, fills `redirect_chain_length` / `redirect_loop`. Drives the 'Long Chain' and 'Redirect Loop' issues + the Redirects tab."]:
    "3xx 리디렉션 체인을 따라가며 `redirect_chain_length` / `redirect_loop`를 채웁니다. '긴 체인'과 '리디렉션 루프' 문제 + 리디렉션 탭에 데이터를 제공합니다.",
  ['Welcome to Example Store']: '예시 스토어에 오신 것을 환영합니다',
  ['What to do when multiple matches exist.']: '일치가 여러 개일 때 어떻게 할지.',
  ['What to read off each matched element. Ignored for an XPath `/@attr` or `/text()` terminal — that value is used directly.']:
    '일치한 각 요소에서 무엇을 읽을지. `/@attr` 또는 `/text()`로 끝나는 XPath에서는 무시되며 해당 값이 직접 사용됩니다.',
  ['When non-empty, ALL query parameters not on this list are dropped during normalisation (case-insensitive name match). Leave empty to keep the default behaviour, which strips just utm_*, fbclid, gclid, mc_cid, and mc_eid.']:
    '비어 있지 않으면 이 목록에 없는 모든 쿼리 매개변수가 정규화 중 제거됩니다(이름 일치는 대소문자 구분 없음). 비워 두면 utm_*, fbclid, gclid, mc_cid, mc_eid만 제거하는 기본 동작을 유지합니다.',
  ['When off, no budget evaluation runs and the verdict column is cleared. When on, the post-crawl pass scores every internal 200 HTML page against the ceilings below.']:
    '끄면 예산 평가가 실행되지 않고 판정 열이 비워집니다. 켜면 크롤링 후 단계가 모든 내부 200 HTML 페이지를 아래 상한에 대해 채점합니다.',
  ['When on (default), pagination_next + pagination_prev URLs are post-fetch enqueued. Off only to debug pagination-only loops without disabling all link follow.']:
    '켜면(기본값) pagination_next + pagination_prev URL이 가져온 뒤 큐에 들어갑니다. 모든 링크 추적을 끄지 않고 페이지네이션 전용 루프만 디버깅할 때만 끄세요.',
  ['When ON (default), the Duplicate URL filter compares URLs after lowercasing the host, dropping the query string, and trimming the trailing slash — the canonical SEO behaviour. When OFF, comparison is byte-exact, so the filter only fires on rows that share an identical raw URL string (rare since URLs are deduped at insert time).']:
    '켜면(기본값) 중복 URL 필터가 호스트를 소문자로 바꾸고 쿼리 문자열을 버리고 후행 슬래시를 제거한 뒤 URL을 비교합니다 — 표준적인 SEO 동작입니다. 끄면 바이트 단위로 정확히 비교하므로 동일한 원시 URL 문자열을 공유하는 행에서만 필터가 발동합니다(URL은 삽입 시 중복 제거되므로 드뭅니다).',
  ["When on, `<meta http-equiv='refresh'>` content URLs are enqueued like a redirect target. window.location body redirects are heuristic-only and currently out of scope."]:
    "켜면 `<meta http-equiv='refresh'>` content의 URL이 리디렉션 대상처럼 큐에 들어갑니다. 본문의 window.location 리디렉션은 휴리스틱에 불과하며 현재 범위 밖입니다.",
  ['When on, a 200 page declaring a canonical pointing elsewhere also enqueues that target. Default off — most crawls treat canonicals as a signal, not a navigation hint.']:
    '켜면 다른 곳을 가리키는 canonical을 선언한 200 페이지가 그 대상도 큐에 넣습니다. 기본값은 끔 — 대부분의 크롤링은 canonical을 탐색 힌트가 아닌 신호로 취급합니다.',
  ['When on, pages with noindex / canonicalised / robots-blocked indexability are excluded from clustering — the Near-Duplicate report then surfaces only issues that affect search visibility.']:
    '켜면 색인 가능성이 noindex / 표준화됨 / robots 차단인 페이지가 클러스터링에서 제외됩니다 — 유사 중복 보고서에는 검색 가시성에 영향을 주는 문제만 나타납니다.',
  ["When on, rel=nofollow links are recursed into like any other link. Default off — Screaming Frog 'Respect Nofollow' default."]:
    "켜면 rel=nofollow 링크도 다른 링크처럼 재귀적으로 따라갑니다. 기본값은 끔 — Screaming Frog 'Respect Nofollow' 기본값.",
  ['When Playwright considers navigation complete. domcontentloaded = HTML parsed but resources still loading. load = window.load fired. networkidle = no network activity for 500ms (best for SPA but slower). commit = just response committed (fastest, riskiest).']:
    'Playwright가 탐색 완료로 간주하는 시점. domcontentloaded = HTML은 파싱됐지만 리소스는 아직 로드 중. load = window.load 발생. networkidle = 500ms 동안 네트워크 활동 없음(SPA에 최적이지만 느림). commit = 응답만 커밋됨(가장 빠르고 가장 위험).',
  ['Whether the broken target is on the same site (internal) or a different host (external).']:
    '깨진 대상이 같은 사이트(내부)에 있는지 다른 호스트(외부)에 있는지.',
  ['Whether the URL is eligible to appear in search results. Combines status code, robots directives, canonical, and meta-refresh signals.']:
    'URL이 검색 결과에 나타날 자격이 있는지. 상태 코드, robots 지시문, canonical, meta-refresh 신호를 종합합니다.',
  ['Width attribute value (in pixels) declared on the <img> tag, when present.']:
    '<img> 태그에 선언된 width 속성 값(픽셀), 있는 경우.',
  ['XPath 1.0 subset over the parsed DOM. End in `/@attr` or `/text()` to read an attribute / text node. Predicates: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.']:
    '파싱된 DOM에 대한 XPath 1.0 부분집합. `/@attr` 또는 `/text()`로 끝내면 속성 / 텍스트 노드를 읽습니다. 술어: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.',
  ['Y when the page declares hreflang alternates but no entry whose `href` matches the page URL. Google requires a self-reference.']:
    '페이지가 hreflang 대체 버전을 선언했지만 `href`가 페이지 URL과 일치하는 항목이 없으면 Y. Google은 자기 참조를 요구합니다.',
  ['Y when the redirect chain originating at this URL contains a cycle (A → B → A) detected by the cycle-safe walker; the chain is otherwise unwalked.']:
    '이 URL에서 시작하는 리디렉션 체인에 순환 안전 워커가 감지한 사이클(A → B → A)이 있으면 Y. 그 외에는 체인을 따라가지 않습니다.',
  ['Y when this URL belongs to a paginated cluster whose ordinal sequence has a gap (e.g. ?page=1, 2, 4 — page 3 missing). Set by the post-crawl `recomputePaginationSequence` pass.']:
    '이 URL이 서수 시퀀스에 빈틈이 있는 페이지네이션 클러스터에 속하면 Y(예: ?page=1, 2, 4 — 3페이지 누락). 크롤링 후 `recomputePaginationSequence` 단계에서 설정됩니다.',
  ['SQL injection — the request tries to smuggle SQL into a parameter (UNION SELECT, sleep(), error-based functions) to read or alter your database.']:
    'SQL 인젝션 — 요청이 데이터베이스를 읽거나 변조하려고 매개변수에 SQL(UNION SELECT, sleep(), 오류 기반 함수)을 밀어 넣으려 합니다.',
  ['Cross-site scripting — the request carries script markup or a javascript: URL in a parameter, hoping the page echoes it back into the HTML unescaped.']:
    '크로스 사이트 스크립팅 — 요청이 매개변수에 스크립트 마크업이나 javascript: URL을 담아, 페이지가 이를 이스케이프하지 않고 HTML에 되돌려 주기를 노립니다.',
  ['Path traversal — the request walks out of the web root with ../ or encoded variants to reach files like /etc/passwd or win.ini.']:
    '경로 순회 — 요청이 ../ 또는 인코딩된 변형으로 웹 루트를 벗어나 /etc/passwd나 win.ini 같은 파일에 접근하려 합니다.',
  ['Command injection — the request appends shell syntax (;, |, backticks, $( )) to a parameter to run commands on the server.']:
    '명령 인젝션 — 요청이 서버에서 명령을 실행하려고 매개변수에 셸 문법(;, |, 백틱, $( ))을 덧붙입니다.',
  ['Scanner probe — an automated vulnerability scanner walking a wordlist of known admin panels, installers and exploit paths (wp-login, phpmyadmin, /actuator, shell uploads). Not tailored to your site; it hits everyone.']:
    '스캐너 탐침 — 자동화된 취약점 스캐너가 알려진 관리자 패널, 설치 프로그램, 익스플로잇 경로(wp-login, phpmyadmin, /actuator, 셸 업로드) 단어 목록을 훑습니다. 당신의 사이트를 겨냥한 것이 아니라 모두를 때립니다.',
  ['Sensitive file fetch — a direct request for something that must never be public: .env, .git, backups, SQL dumps, private keys, config files.']:
    '민감 파일 요청 — 절대 공개되면 안 되는 것에 대한 직접 요청: .env, .git, 백업, SQL 덤프, 개인 키, 설정 파일.',
  ['Anomaly — malformed or evasive input (null bytes, CRLF injection, over-encoding, absurd parameter lengths) that matches no single attack class but is not a normal browser request.']:
    '이상 — 어떤 단일 공격 유형에도 맞지 않지만 정상적인 브라우저 요청도 아닌, 잘못됐거나 회피적인 입력(널 바이트, CRLF 인젝션, 과다 인코딩, 터무니없는 매개변수 길이).',
  ['Sum of the weights of every attack signature the request matched. Each signature carries a weight by how conclusive it is (a UNION SELECT weighs 9, a stray quote 2), and a line is only flagged once the total reaches 5 — so one decisive pattern flags on its own, while weak hints have to add up. Higher score = less room for a false positive; sort by it to triage.']:
    '요청이 일치한 모든 공격 시그니처 가중치의 합. 각 시그니처는 결정적인 정도에 따라 가중치를 가지며(UNION SELECT는 9, 떠도는 따옴표는 2), 합계가 5에 도달해야 줄이 표시됩니다 — 결정적 패턴 하나면 단독으로 표시되고 약한 단서는 쌓여야 합니다. 점수가 높을수록 오탐 여지가 적으니 이 열로 정렬해 우선순위를 정하세요.',
  ['Which attack class the strongest matching signature belongs to: SQL injection, XSS, path traversal, command injection, scanner probe, sensitive file, or anomaly. Hover any badge in this column for what that class means in practice.']:
    '가장 강한 일치 시그니처가 속한 공격 유형: SQL 인젝션, XSS, 경로 순회, 명령 인젝션, 스캐너 탐침, 민감 파일 또는 이상. 이 열의 배지에 마우스를 올리면 그 유형이 실제로 무엇을 뜻하는지 볼 수 있습니다.',
  ["Filters on the Status column — the most recent response the log recorded for that path. The analyzer keeps one status per URL rather than a full distribution, so this answers 'what is this URL returning now'. Paths whose status could not be parsed are hidden while a class is selected."]:
    "상태 열로 필터링 — 로그가 해당 경로에 기록한 가장 최근 응답. 분석기는 전체 분포가 아니라 URL당 상태 하나를 유지하므로 '이 URL이 지금 무엇을 반환하는가'에 답합니다. 유형이 선택된 동안 상태를 파싱할 수 없는 경로는 숨겨집니다.",
  ['Most recent HTTP status the log recorded for this path. One value per URL, not a distribution — a path that returned 200 all week and 404 this morning shows 404.']:
    '로그가 이 경로에 기록한 가장 최근 HTTP 상태. 분포가 아니라 URL당 값 하나 — 일주일 내내 200을 반환하다 오늘 아침 404를 반환한 경로는 404로 표시됩니다.',
  ['A URL whose path repeats the same segment this many times or more (/shop/shop/shop/…) is treated as a link loop and skipped. This shape comes from a relative-href bug and has no legitimate counterpart. Skipped counts are reported when the crawl finishes.']:
    '경로에서 같은 구간이 이 횟수 이상 반복되는 URL(/shop/shop/shop/…)은 링크 루프로 취급되어 건너뜁니다. 이 형태는 상대 href 버그에서 비롯되며 정당한 대응물이 없습니다. 건너뛴 수는 크롤링이 끝날 때 보고됩니다.',
  ['3 is safe for every site; raise to 4–5 only if a real path legitimately repeats a segment; 0 disables the guard.']:
    '3은 모든 사이트에 안전합니다. 실제 경로가 정당하게 구간을 반복할 때만 4–5로 올리고, 0은 보호를 끕니다.',
  ['URLs with more query parameters than this are flagged as faceted-navigation traps under Issues → URL → Crawl Trap. Detection only — the URLs are still crawled, because legitimate filter pages look the same.']:
    '쿼리 매개변수가 이 값보다 많은 URL은 문제 → URL → 크롤링 트랩 아래에 패싯 탐색 트랩으로 표시됩니다. 감지만 합니다 — 정당한 필터 페이지도 똑같이 보이므로 URL은 여전히 크롤링됩니다.',
  ['4 surfaces most faceted-nav explosions; 0 disables the check.']:
    '4면 대부분의 패싯 탐색 폭발을 잡아냅니다. 0은 검사를 끕니다.',
  ["Honor Allow / Disallow rules declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "설정된 User-Agent에 대해 /robots.txt에 선언된 Allow / Disallow 규칙을 준수합니다. Screaming Frog: 'Respect robots.txt'(Configuration → robots.txt).",
  ["Honor a Crawl-delay directive as a global rate limit (one request every N seconds). Crawl-delay is not part of RFC 9309 — Google ignores it and Screaming Frog does not implement it — and published values are often stale: 'Crawl-delay: 30' turns a 500-URL crawl into hours. Ignored by default; the directive is still reported in the log when found."]:
    "Crawl-delay 지시문을 전역 속도 제한(N초마다 요청 하나)으로 준수합니다. Crawl-delay는 RFC 9309에 포함되지 않으며 — Google은 무시하고 Screaming Frog는 구현하지 않습니다 — 게시된 값은 오래된 경우가 많습니다: 'Crawl-delay: 30'은 500개 URL 크롤링을 몇 시간짜리로 만듭니다. 기본적으로 무시되며, 발견되면 로그에는 여전히 보고됩니다.",
  ['Off (default) for normal audits. On when an ops policy requires it — expect the crawl to take Crawl-delay seconds per URL.']:
    '일반 감사에는 끔(기본값). 운영 정책이 요구할 때 켬 — URL당 Crawl-delay 초가 걸릴 것을 감안하세요.',
  ['Crawl fetches internal <img> targets (incl. srcset / <picture> sources) so each appears in the Internal tab with status, content type, and size — every one counts toward Max URLs. Store keeps the <img> declarations in the Images tab, which works even with Crawl off: you get the full image inventory with alt text for the cost of zero extra requests.']:
    '크롤링은 내부 <img> 대상(srcset / <picture> 소스 포함)을 가져와 각각 상태, 콘텐츠 유형, 크기와 함께 내부 탭에 표시합니다 — 모두 최대 URL 수에 포함됩니다. 저장은 <img> 선언을 이미지 탭에 유지하며 크롤링이 꺼져 있어도 동작합니다: 추가 요청 없이 alt 텍스트가 포함된 전체 이미지 목록을 얻습니다.',
  ['Store on, Crawl off is the cheap alt-text audit. Both on for a full image health check.']:
    '저장 켬, 크롤링 끔은 저렴한 alt 텍스트 감사입니다. 완전한 이미지 상태 점검에는 둘 다 켜세요.',
  ['<video> / <audio> and the <source> children they own. Off by default — media files are large and rarely what an SEO crawl is looking for.']:
    '<video> / <audio>와 그에 속한 <source> 자식. 기본값 끔 — 미디어 파일은 크고 SEO 크롤링이 찾는 대상인 경우가 드뭅니다.',
  ['On when auditing a video-heavy site for dead media URLs.']:
    '동영상이 많은 사이트에서 죽은 미디어 URL을 감사할 때 켬.',
  ["<link rel=stylesheet> targets. Crawling a stylesheet is also what discovers the web fonts and background images declared inside it via @font-face / url() — so Crawl on with Store off still populates the Internal tab's Font filter without listing every stylesheet."]:
    '<link rel=stylesheet> 대상. 스타일시트를 크롤링하는 것은 그 안에 @font-face / url()로 선언된 웹 폰트와 배경 이미지를 발견하는 방법이기도 합니다 — 따라서 크롤링 켬에 저장 끔이면 모든 스타일시트를 나열하지 않고도 내부 탭의 폰트 필터가 채워집니다.',
  ['Crawl on, Store off when you want fonts discovered but not hundreds of CSS rows.']:
    '폰트는 발견하되 수백 개의 CSS 행은 원치 않을 때 크롤링 켬, 저장 끔.',
  ['<script src> targets, fetched so each gets its own row with status code, content type, and size. Headers only — the body is discarded, never executed.']:
    '<script src> 대상. 각각 상태 코드, 콘텐츠 유형, 크기가 있는 자체 행을 갖도록 가져옵니다. 헤더만 — 본문은 버려지고 절대 실행되지 않습니다.',
  ['Both on to catch 404ing bundles; both off for HTML-only crawls.']:
    '404가 나는 번들을 잡으려면 둘 다 켬. HTML 전용 크롤링에는 둘 다 끔.',
  ['<a href> targets on the same site. Crawl off turns the run into an audit of a fixed set of pages — sitemaps, canonicals, and the other declared alternates below still feed discovery. Store off empties the link graph: inlinks, outlinks, anchor-text reports, and link score all go with it.']:
    '같은 사이트의 <a href> 대상. 크롤링을 끄면 실행이 고정된 페이지 집합의 감사로 바뀝니다 — 사이트맵, canonical, 아래의 다른 선언된 대체 버전은 여전히 발견에 기여합니다. 저장을 끄면 링크 그래프가 비워집니다: 인링크, 아웃링크, 앵커 텍스트 보고서, 링크 점수가 모두 사라집니다.',
  ['Leave both on. Crawl off only when a sitemap or URL list already defines the exact set you want.']:
    '둘 다 켜 두세요. 사이트맵이나 URL 목록이 원하는 정확한 집합을 이미 정의할 때만 크롤링을 끄세요.',
  ['Outbound links to other hosts are always status-checked (one HEAD each) so Broken Links catches dead externals — that does not depend on this row. Crawl here means fully crawling those pages, following their links onward too. Store keeps outbound links in the link graph.']:
    '다른 호스트로 나가는 링크는 항상 상태 검사(각각 HEAD 한 번)를 받아 깨진 링크가 죽은 외부 링크를 잡습니다 — 이는 이 행에 의존하지 않습니다. 여기서 크롤링은 그 페이지들을 완전히 크롤링하고 그 링크까지 따라간다는 뜻입니다. 저장은 아웃바운드 링크를 링크 그래프에 유지합니다.',
  ['Crawl off (default) — status-check externals without spidering the whole web.']:
    '크롤링 끔(기본값) — 웹 전체를 스파이더링하지 않고 외부 링크 상태만 검사합니다.',
  ['<link rel=canonical> and its HTTP Link: header form. Crawl also enqueues the canonical target, treating it as a navigation hint. Store feeds the Canonicals tab and every canonical issue filter.']:
    '<link rel=canonical>과 그 HTTP Link: 헤더 형식. 크롤링은 canonical 대상도 탐색 힌트로 취급해 큐에 넣습니다. 저장은 표준 링크 탭과 모든 canonical 문제 필터에 데이터를 제공합니다.',
  ['Crawl off (default) — canonicals are a signal, not a route. Store on.']:
    '크롤링 끔(기본값) — canonical은 경로가 아니라 신호입니다. 저장 켬.',
  ['<link rel=next> / <link rel=prev>. Part of the standard discovery graph; turn Crawl off to isolate a pagination loop without disabling link-following everywhere.']:
    '<link rel=next> / <link rel=prev>. 표준 발견 그래프의 일부입니다. 모든 곳의 링크 추적을 끄지 않고 페이지네이션 루프만 격리하려면 크롤링을 끄세요.',
  ['Both on unless you are debugging an infinite paginated series.']:
    '무한 페이지네이션 시리즈를 디버깅하는 게 아니라면 둘 다 켬.',
  ['<link rel=alternate hreflang>. Crawl enqueues every declared alternate, which is how you reach language versions nothing links to. Store feeds the Hreflang tab and the reciprocity / invalid-code audits.']:
    '<link rel=alternate hreflang>. 크롤링은 선언된 모든 대체 버전을 큐에 넣습니다 — 아무것도 링크하지 않는 언어 버전에 도달하는 방법입니다. 저장은 Hreflang 탭과 상호 참조 / 잘못된 코드 감사에 데이터를 제공합니다.',
  ['Crawl on for a multi-language audit — otherwise unlinked locales stay invisible.']:
    '다국어 감사에는 크롤링 켬 — 그렇지 않으면 링크되지 않은 로캘은 보이지 않습니다.',
  ['<link rel=amphtml>. Crawl fetches the AMP variant as its own URL; Store keeps the declaration plus the AMP smoke-validator findings.']:
    '<link rel=amphtml>. 크롤링은 AMP 변형을 자체 URL로 가져오고, 저장은 선언과 AMP 기본 검사기 결과를 유지합니다.',
  ['Crawl on only if the site still ships AMP pages.']:
    '사이트가 여전히 AMP 페이지를 제공할 때만 크롤링 켬.',
  ['<meta http-equiv="refresh">. Crawl enqueues the parsed target like a redirect; Store keeps the raw directive and its URL for the Meta Refresh tab.']:
    '<meta http-equiv="refresh">. 크롤링은 파싱된 대상을 리디렉션처럼 큐에 넣고, 저장은 원시 지시문과 그 URL을 Meta Refresh 탭용으로 유지합니다.',
  ['Crawl on when auditing a legacy site that still redirects this way.']:
    '아직 이런 방식으로 리디렉션하는 레거시 사이트를 감사할 때 크롤링 켬.',
  ["<iframe src> documents. Crawl fetches each embedded page as its own URL, which can pull in a lot of third-party surface. Store records them in the link graph so a dead embed shows up in Outlinks and Broken Links — without counting toward the page's outlink total, since an embed is not a hyperlink."]:
    '<iframe src> 문서. 크롤링은 각 임베드 페이지를 자체 URL로 가져오며, 많은 서드파티 표면을 끌어들일 수 있습니다. 저장은 이를 링크 그래프에 기록해 죽은 임베드가 아웃링크와 깨진 링크에 나타나게 합니다 — 임베드는 하이퍼링크가 아니므로 페이지의 아웃링크 합계에는 포함되지 않습니다.',
  ['Store on, Crawl off is usually the right pair.']:
    '저장 켬, 크롤링 끔이 보통 올바른 조합입니다.',
  ['The separate-URL (m-dot) mobile version: <link rel="alternate" media="only screen and (max-width: …)">. Null on responsive sites, which is most of them — a value here with no reciprocal canonical back is the classic broken m-dot setup.']:
    '별도 URL(m-dot) 모바일 버전: <link rel="alternate" media="only screen and (max-width: …)">. 반응형 사이트(대부분)에서는 null입니다 — 여기 값이 있는데 되돌아오는 상호 canonical이 없으면 전형적인 깨진 m-dot 설정입니다.',
  ['Crawl on only when the site really does serve a separate mobile host.']:
    '사이트가 실제로 별도의 모바일 호스트를 제공할 때만 크롤링 켬.',
  ['Links a search engine cannot follow: <a> with no href but an onclick, href="javascript:…", and href="#" placeholders wired to a handler. Store-only — an uncrawlable link is by definition never fetched. Drives the JS-Only Navigation issue filter.']:
    '검색 엔진이 따라갈 수 없는 링크: href 없이 onclick만 있는 <a>, href="javascript:…", 핸들러에 연결된 href="#" 자리표시자. 저장 전용 — 크롤링할 수 없는 링크는 정의상 절대 가져오지 않습니다. JS 전용 탐색 문제 필터에 데이터를 제공합니다.',
  ['On — it is a count, so it costs nothing.']: '켬 — 카운트일 뿐이라 비용이 없습니다.',
  ['With a Subfolder-scoped crawl, links pointing outside the start folder are fetched once so their status code is known, then stopped — they are checked, not crawled through. Off leaves them undiscovered entirely.']:
    '하위 폴더 범위 크롤링에서 시작 폴더 밖을 가리키는 링크는 상태 코드를 알기 위해 한 번 가져온 뒤 멈춥니다 — 검사만 하고 크롤링하지 않습니다. 끄면 전혀 발견하지 않습니다.',
  ['On — knowing a link out of /blog/ is a 404 costs one request.']:
    '켬 — /blog/ 밖으로 나가는 링크가 404인지 아는 데는 요청 하나면 됩니다.',
  ["Off restricts the crawl to URLs under the start URL's path (Crawl Scope = Subfolder). On lets it cover the whole host. This is a view of the Crawl Scope setting, not a separate switch, so the two can never disagree."]:
    '끄면 크롤링을 시작 URL 경로 아래의 URL로 제한합니다(크롤링 범위 = 하위 폴더). 켜면 호스트 전체를 다룹니다. 이는 별도 스위치가 아니라 크롤링 범위 설정의 한 보기이므로 둘이 어긋날 수 없습니다.',
  ['Off to audit just /blog/; on for the whole site.']: '/blog/만 감사하려면 끔, 사이트 전체는 켬.',
  ['Treats every host sharing the registrable domain as internal — shop.example.com and blog.example.com crawl alongside example.com instead of counting as external. Another view of the Crawl Scope setting.']:
    '등록 가능 도메인을 공유하는 모든 호스트를 내부로 취급합니다 — shop.example.com과 blog.example.com이 외부로 계산되지 않고 example.com과 함께 크롤링됩니다. 크롤링 범위 설정의 또 다른 보기입니다.',
  ['On when subdomains are part of the same property.']: '서브도메인이 같은 자산의 일부일 때 켬.',
  ['Crawl through rel="nofollow" links pointing at the same site. Off (default) is Screaming Frog "Respect Nofollow" behaviour. Internal and external are separate switches because sites nofollow them for opposite reasons — crawl-budget shaping vs. not vouching for a third party.']:
    '같은 사이트를 가리키는 rel="nofollow" 링크를 통과해 크롤링합니다. 끔(기본값)은 Screaming Frog "Respect Nofollow" 동작입니다. 사이트가 정반대의 이유로 nofollow를 쓰기 때문에 내부와 외부는 별도 스위치입니다 — 크롤링 예산 조절 vs. 서드파티를 보증하지 않음.',
  ['On when a site nofollows its own faceted navigation and you need behind it.']:
    '사이트가 자체 패싯 탐색에 nofollow를 걸었는데 그 뒤로 들어가야 할 때 켬.',
  ['Crawl through rel="nofollow" links pointing at other hosts. Only has an effect while External Links → Crawl is on.']:
    '다른 호스트를 가리키는 rel="nofollow" 링크를 통과해 크롤링합니다. 외부 링크 → 크롤링이 켜져 있을 때만 효과가 있습니다.',
  ['Off — nofollowed externals are exactly the ones you did not vouch for.']:
    '끔 — nofollow된 외부 링크는 바로 당신이 보증하지 않은 링크입니다.',
  ['Record hrefs that cannot be parsed as a URL — unencoded whitespace inside the authority, doubled schemes, stray delimiters. They can never resolve to a crawled page, so every one is reported in Broken Links, which is the point. Deliberate non-navigable schemes (mailto:, tel:, #) are not malformed and never appear.']:
    'URL로 파싱할 수 없는 href를 기록합니다 — 권한 부분 안의 인코딩되지 않은 공백, 중복된 스킴, 떠도는 구분자. 절대 크롤링된 페이지로 해석될 수 없으므로 모두 깨진 링크에 보고되며, 그것이 목적입니다. 의도적으로 탐색 불가능한 스킴(mailto:, tel:, #)은 잘못된 것이 아니며 절대 나타나지 않습니다.',
  ['On when hunting hand-written markup errors; off keeps Broken Links focused on real 404s.']:
    '손으로 쓴 마크업 오류를 찾을 때는 켬. 끄면 깨진 링크가 실제 404에 집중됩니다.',
  ['Off drops every discovered URL carrying a `?`, before robots and before a request goes out. That is the cheap way to stop a faceted navigation (?color=red&size=xl&sort=price) from spending the whole URL budget on one product listing wearing a thousand URLs. The start URL is always crawled, and subresources are exempt — style.css?v=7 is a cache-buster, not a facet. Skipped URLs are counted and reported in the log, never dropped silently.']:
    '끄면 robots 이전, 요청이 나가기 전에 `?`가 있는 모든 발견 URL을 버립니다. 패싯 탐색(?color=red&size=xl&sort=price)이 천 개의 URL로 변장한 단일 상품 목록에 전체 URL 예산을 쓰는 것을 막는 저렴한 방법입니다. 시작 URL은 항상 크롤링되며 하위 리소스는 면제됩니다 — style.css?v=7은 패싯이 아니라 캐시 버스터입니다. 건너뛴 URL은 세어 로그에 보고되며 조용히 버려지지 않습니다.',
  ['On (default). Off for a first pass over a shop with faceted filters.']:
    '켬(기본값). 패싯 필터가 있는 쇼핑몰의 첫 패스에는 끔.',
  ['Parameter names that keep a URL in the crawl anyway — pagination, a language switch, a product id. Names only; values are not looked at, and matching ignores case. A URL is admitted only when every parameter it carries is on this list: ?page=2 passes, ?page=2&color=red does not. Any-match would defeat the point, since a facet URL nearly always carries the pagination parameter too.']:
    '그래도 URL을 크롤링에 남겨 두는 매개변수 이름 — 페이지네이션, 언어 전환, 상품 ID. 이름만 봅니다. 값은 보지 않으며 일치는 대소문자를 무시합니다. URL이 가진 모든 매개변수가 이 목록에 있을 때만 허용됩니다: ?page=2는 통과, ?page=2&color=red는 불통과. 패싯 URL은 거의 항상 페이지네이션 매개변수도 함께 갖기 때문에 하나만 일치해도 허용하면 의미가 없어집니다.',
  ['page, lang — keeps paginated archives reachable while the facets stay out.']:
    'page, lang — 패싯은 밖에 두면서 페이지네이션된 아카이브는 도달 가능하게 유지합니다.',
  ['Auto-discovery on its own only records sitemap entries, which is what the sitemap issue filters compare the crawl against. Turning this on crawls them too — and that is what surfaces orphans: pages the sitemap declares but nothing on the site links to.']:
    '자동 발견만으로는 사이트맵 항목만 기록하며, 사이트맵 문제 필터는 이를 크롤링과 비교합니다. 이를 켜면 그것들도 크롤링합니다 — 그것이 고아 페이지를 드러내는 방법입니다: 사이트맵은 선언하지만 사이트의 어느 것도 링크하지 않는 페이지.',
  ['On for an orphan-page audit.']: '고아 페이지 감사에는 켬.',
  ['Reads Sitemap: directives from /robots.txt plus the conventional /sitemap.xml fallbacks at crawl start. Cheap I/O, and it powers every sitemap issue filter.']:
    '크롤링 시작 시 /robots.txt의 Sitemap: 지시문과 관례적인 /sitemap.xml 대체 경로를 읽습니다. 저렴한 I/O이며 모든 사이트맵 문제 필터에 데이터를 제공합니다.',
  ['On (default).']: '켬(기본값).',
  ['Explicit sitemap URLs, one per line. Their entries are always both recorded and queued as crawl seeds — use this when the sitemap lives somewhere robots.txt never mentions.']:
    '명시적 사이트맵 URL, 한 줄에 하나. 그 항목은 항상 기록되고 크롤링 시드로 큐에 들어갑니다 — robots.txt가 언급하지 않는 곳에 사이트맵이 있을 때 사용하세요.',
  ['Treat the concurrency and RPS above as a ceiling and let the target server set the real pace. On a 429/503 (or a Retry-After header) the crawler pauses for the penalty window and steps the rate + concurrency down; after a sustained run of clean responses it grows them back toward the ceiling. Off = hold the configured rate no matter how the server responds.']:
    '위의 동시성과 RPS를 상한으로 취급하고 대상 서버가 실제 속도를 정하게 합니다. 429/503(또는 Retry-After 헤더)이 오면 크롤러는 페널티 기간 동안 일시 정지하고 속도 + 동시성을 낮추며, 깨끗한 응답이 지속되면 다시 상한을 향해 올립니다. 끔 = 서버가 어떻게 응답하든 설정된 속도를 유지합니다.',
  ['Turn on for sites behind Cloudflare / a WAF that returns 429s; leave off for your own infrastructure where the fixed rate is safe.']:
    '429를 반환하는 Cloudflare / WAF 뒤의 사이트에는 켜고, 고정 속도가 안전한 자체 인프라에는 꺼 두세요.',
  ['Sorts query parameters alphabetically at normalisation time. Repeated keys keep their relative order, so ?tag=a&tag=b is preserved. Without this the two orderings occupy separate rows and read as duplicates.']:
    '정규화 시 쿼리 매개변수를 알파벳순으로 정렬합니다. 반복되는 키는 상대 순서를 유지하므로 ?tag=a&tag=b는 보존됩니다. 이것이 없으면 두 순서가 별도의 행을 차지해 중복으로 읽힙니다.',
  ['On for most sites; off if your server routes on positional parameter order.']:
    '대부분의 사이트는 켬. 서버가 매개변수의 위치 순서로 라우팅한다면 끔.',
  ['Collapses runs of slashes in the path to a single slash. Applied before the trailing-slash policy. Web servers serve these identically, so the duplicate-slash variant is normally a false duplicate.']:
    '경로의 연속된 슬래시를 하나로 합칩니다. 후행 슬래시 정책 전에 적용됩니다. 웹 서버는 이를 동일하게 제공하므로 이중 슬래시 변형은 보통 가짜 중복입니다.',
  ['On if a template bug emits //  in links; off if your framework uses empty path segments as data.']:
    '템플릿 버그가 링크에 //  를 내보내면 켬. 프레임워크가 빈 경로 구간을 데이터로 사용하면 끔.',
  ["Off by default: verify the login page's TLS certificate before typing credentials into it. Enable only for a trusted internal host with a self-signed certificate — an unverifiable certificate on a login page is a man-in-the-middle risk."]:
    '기본값 끔: 로그인 페이지에 자격 증명을 입력하기 전에 TLS 인증서를 검증합니다. 자체 서명 인증서를 쓰는 신뢰할 수 있는 내부 호스트에만 켜세요 — 로그인 페이지의 검증 불가 인증서는 중간자 공격 위험입니다.',
  ["Hooks the History API before the page's own scripts run, so routes an SPA reaches via pushState / replaceState / popstate are discovered and crawled. Also keeps hash routes (#/about) as distinct URLs instead of collapsing them onto the shell document."]:
    '페이지 자체 스크립트가 실행되기 전에 History API를 후킹하여, SPA가 pushState / replaceState / popstate로 도달하는 라우트를 발견하고 크롤링합니다. 또한 해시 라우트(#/about)를 셸 문서로 합치지 않고 별개의 URL로 유지합니다.',
  ['On for React Router / Vue Router / Angular sites whose pages never produce a document request.']:
    '페이지가 문서 요청을 전혀 만들지 않는 React Router / Vue Router / Angular 사이트에는 켬.',
  ['`<link rel="alternate" media="only screen and (max-width: …)" href="…">` value — the separate-URL (m-dot) mobile version of this page. Empty on responsive sites, which is most of them. A value here with no reciprocal canonical pointing back is the classic broken m-dot setup.']:
    '`<link rel="alternate" media="only screen and (max-width: …)" href="…">` 값 — 이 페이지의 별도 URL(m-dot) 모바일 버전. 반응형 사이트(대부분)에서는 비어 있습니다. 여기 값이 있는데 되돌아오는 상호 canonical이 없으면 전형적인 깨진 m-dot 설정입니다.',
};
