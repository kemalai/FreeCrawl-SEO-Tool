/**
 * Korean integration setup guides. Generated from the guide source —
 * see `./index.ts` for how a locale is picked. Keep the step count,
 * links and `lastReviewed` in lockstep with `en.ts`; the parity test
 * in `tests/` compares them.
 */
import type { Guide } from './types.js';

export const GUIDES_KO: Record<string, Guide> = {
  openai: {
    intro:
      'OpenAI API를 통해 URL마다 사용자 지정 프롬프트를 실행합니다 — 콘텐츠 분석, 제목 아이디어, 요약. 사용량은 본인의 OpenAI 계정에 청구됩니다. FreeCrawl은 무료 중개 도구일 뿐이며 API 호출 비용은 사용자 부담입니다.',
    prereqs: [
      'OpenAI 계정(https://platform.openai.com 에서 무료 가입).',
      '유효한 결제 수단 — OpenAI는 키가 작동하기 전에 최소 5달러 잔액을 요구합니다.',
    ],
    steps: [
      {
        title: 'platform.openai.com 에 로그인',
        detail: 'OpenAI 계정을 사용하세요. 아직 없다면 "Sign up".',
        link: {
          label: 'platform.openai.com',
          url: 'https://platform.openai.com',
        },
      },
      {
        title: '왼쪽 사이드바에서 "API keys" 클릭',
        detail: '왼쪽의 열쇠 아이콘 메뉴 항목입니다. URL로 바로 이동해도 됩니다.',
        link: {
          label: 'API keys 페이지',
          url: 'https://platform.openai.com/api-keys',
        },
      },
      {
        title: '"+ Create new secret key" 클릭(오른쪽 상단)',
        detail:
          '대화상자에서:\n• Name: "FreeCrawl SEO Tool"(아무 메모용 이름)\n• Project: Default project 또는 원하는 프로젝트\n• Permissions: All(가장 간단; 제한된 범위도 작동)\n그다음 "Create secret key".',
      },
      {
        title: '키를 복사하세요 — 다시는 표시되지 않습니다',
        detail:
          '키는 `sk-...`로 시작합니다. 지금 복사하지 않으면 영영 잃습니다(새로 만들어야 함). 비밀번호 관리자에 저장하세요 — 브라우저 탭에 두지 마세요.',
      },
      {
        title: '이 패널의 "API Key" 필드에 붙여넣기 + 저장 클릭',
        detail:
          'FreeCrawl은 키를 OS 자격 증명 저장소(Windows DPAPI, macOS 키체인, Linux Secret Service)에 암호화해 저장합니다. 절대 평문으로 기록되지 않습니다.',
      },
      {
        title: 'AI 탭에서 테스트',
        detail:
          '설정을 닫고 → 상단 "AI" 탭으로 전환 → 크롤링 결과에서 URL 몇 개 선택 → "Run AI" 클릭. 첫 호출은 약 2-3초 걸립니다.',
      },
    ],
    troubleshooting: [
      {
        problem: '"You exceeded your current quota"',
        solution:
          'OpenAI 계정에 잔액이 없습니다. platform.openai.com → Billing → "Add payment method" → 카드를 추가하고 5달러 이상 충전하세요. 신규 계정은 자동 크레딧을 받지 않으므로 직접 충전해야 합니다.',
      },
      {
        problem: '"Incorrect API key provided" / 401',
        solution:
          '키 앞뒤에 공백이 섞였을 가능성이 큽니다. 새로 생성해 신중하게 복사하세요. 이전 키는 폐기하세요.',
      },
      {
        problem: '"Rate limit exceeded"',
        solution:
          '병렬 요청이 너무 많습니다. 설정 → AI에서 동시성을 낮추세요(기본값: 3). Tier 1 계정은 모델에 따라 500-3500 RPM으로 동작합니다.',
      },
    ],
    notes: [
      '가격(2026-06): gpt-4o-mini 입력 100만 토큰당 약 0.15달러, gpt-4o 입력 100만당 약 2.50달러. 일반적인 프롬프트 + 응답으로 URL 1000개: 약 0.50-2달러.',
      'Usage limits 페이지에서 월간 하드 리밋을 설정하세요 — 통제 불능의 100만 URL 크롤링이 1000달러 청구서를 만드는 걸 원치 않을 테니까요.',
    ],
    lastReviewed: '2026-06-01',
  },
  anthropic: {
    intro:
      'Anthropic API를 통해 Claude에 프롬프트를 실행합니다. Claude의 최상위 모델(Sonnet 4.6, Opus 4.8)은 경쟁사보다 "AI 냄새"가 덜한 SEO 결과를 냅니다. 본인의 Anthropic 계정에 청구됩니다.',
    prereqs: [
      'Anthropic 계정(https://console.anthropic.com).',
      '등록된 결제 수단(신규 사용자는 5달러 프로모션 크레딧 제공).',
    ],
    steps: [
      {
        title: 'console.anthropic.com 에 로그인',
        link: {
          label: 'console.anthropic.com',
          url: 'https://console.anthropic.com',
        },
      },
      {
        title: '오른쪽 상단 드롭다운에서 "API Keys" 페이지 열기',
        detail: 'Settings 메뉴 아래 "API Keys" 항목.',
        link: {
          label: 'API Keys 페이지',
          url: 'https://console.anthropic.com/settings/keys',
        },
      },
      {
        title: '"+ Create Key" 클릭',
        detail:
          '대화상자에서:\n• Name: "FreeCrawl SEO Tool"\n• Workspace: Default workspace\n• Environment: Production\n그다음 "Create Key".',
      },
      {
        title: '키를 복사하세요 — 다시는 표시되지 않습니다',
        detail: '키는 `sk-ant-...`로 시작합니다. 잃어버리면 새로 만드세요.',
      },
      {
        title: '"API Key" 필드에 붙여넣기 + 저장',
      },
      {
        title: '선택: 모델 고르기',
        detail:
          '설정 → AI의 "Model" 필드는 모델 ID를 받습니다(기본값: claude-sonnet-4-6). 속도 우선: claude-haiku-4-5(약 10배 저렴, 3배 빠름). 품질 우선: claude-opus-4-8.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Your credit balance is too low"',
        solution: 'console.anthropic.com → Settings → Billing → "Add credits" — 최소 5달러.',
      },
      {
        problem: '"Number of request tokens has exceeded your rate limit"',
        solution:
          'Tier 1 계정은 약 50 RPM입니다. 설정 → AI에서 동시성을 2-3으로 낮추세요. 상위 티어는 25달러 이상 사용해야 합니다(Tier 2: 1000 RPM).',
      },
      {
        problem: '"Invalid API key"',
        solution:
          '"sk-ant-" 접두사가 온전하고 불필요한 공백이 없는지 확인하세요. API Keys 페이지를 확인하세요 — 거기서 키가 활성으로 보이면 키 자체는 정상입니다.',
      },
    ],
    notes: [
      '가격(2026-06): Haiku 4.5 약 0.25/1.25달러(100만 토큰당 입력/출력), Sonnet 4.6 약 3/15달러, Opus 4.8 약 15/75달러.',
      'Anthropic은 프롬프트 캐싱을 지원합니다 — 5분 내 반복되는 긴 시스템 프롬프트는 90% 할인됩니다(FreeCrawl AI 패널은 아직 캐싱을 사용하지 않음 — 이후 릴리스에서 지원 예정).',
    ],
    lastReviewed: '2026-06-01',
  },
  ollama: {
    intro:
      'Ollama는 로컬에 호스팅되는 LLM용 오픈소스 런타임입니다. API 키 불필요, 영원히 무료, 인터넷조차 필요 없습니다. 비용 제로; 유일한 단점은 큰 모델에 필요한 VRAM/RAM입니다.',
    prereqs: [
      'macOS 12+, Windows 10+ 또는 Linux(Ubuntu 22.04+ 권장).',
      '최소 8 GB RAM(작은 모델). Llama 3.2 3B는 약 2 GB VRAM/RAM이 필요합니다.',
      'GPU 권장이지만 필수는 아님 — CPU도 동작합니다(느림).',
    ],
    steps: [
      {
        title: 'Ollama 다운로드 + 설치',
        detail:
          'OS에 맞는 설치 파일을 선택하세요:\n• Windows: OllamaSetup.exe\n• macOS: Ollama.dmg\n• Linux: curl -fsSL https://ollama.com/install.sh | sh\n\n설치 후 Ollama는 백그라운드에서 실행됩니다(시스템 트레이 아이콘).',
        link: {
          label: 'ollama.com/download',
          url: 'https://ollama.com/download',
        },
      },
      {
        title: '모델 받기',
        detail:
          '터미널을 열고 실행:\n\n  ollama pull llama3.2\n\nllama3.2(3B 파라미터)는 약 2GB로 빠르고 가볍습니다. 더 큰 옵션:\n  ollama pull llama3.3:70b   (약 40GB, 고성능 GPU 전용)\n  ollama pull qwen2.5:7b     (약 4GB, 균형형)\n  ollama pull mistral:7b     (약 4GB, 대안)',
      },
      {
        title: '모델 간단 테스트',
        detail:
          '터미널에서:\n  ollama run llama3.2\n\n대화형 채팅이 열립니다. "hello"를 입력하세요 — 답이 오면 정상입니다. Ctrl+D로 종료.',
      },
      {
        title: '이 패널에 Ollama 엔드포인트 입력',
        detail:
          '기본값: http://localhost:11434(이미 채워져 있음). Ollama가 다른 포트에서 실행되면 변경하세요.',
      },
      {
        title: '받은 모델 이름 입력',
        detail:
          '예: "llama3.2" 또는 "qwen2.5:7b". 비워 두면 FreeCrawl이 첫 번째 사용 가능한 모델을 선택합니다.',
      },
      {
        title: '저장 + 테스트',
        detail: 'AI 탭에서 작은 배치를 실행하세요. CPU 전용: URL당 약 5-15초. GPU: 약 1-3초.',
      },
    ],
    troubleshooting: [
      {
        problem: 'AI tab says "Connection refused"',
        solution:
          'Ollama가 실행 중이 아닙니다. 터미널에서 "ollama serve"를 실행하거나 시스템 트레이 / 시작 메뉴에서 Ollama 앱을 실행하세요.',
      },
      {
        problem: '"model \'X\' not found"',
        solution:
          '모델을 받지 않았습니다. "ollama pull <모델-이름>"을 실행하세요. "ollama list"로 디스크에 이미 있는 모델을 확인하세요.',
      },
      {
        problem: 'Replies are very slow (>30 s/URL)',
        solution:
          '모델이 VRAM에 맞지 않아 CPU로 넘어갑니다. 더 작은 모델(llama3.2:1b 또는 phi3:mini)을 시도하세요. VRAM 필요량: 3B 약 2GB, 7B 약 4GB, 13B 약 8GB.',
      },
    ],
    notes: [
      '완전 오프라인 — 인터넷 없이도 크롤링 + AI 분석이 계속 동작합니다.',
      '로컬 SEO 분석 품질: 3B 모델은 다소 약하고, 7-13B는 괜찮으며, 70B는 GPT-4 수준(단, 무거운 하드웨어 필요).',
      '설정 → AI에서 동시성을 1-2로 유지하세요 — 로컬 모델은 병렬 요청을 직렬화합니다.',
    ],
    lastReviewed: '2026-06-01',
  },
  pagespeed: {
    intro:
      'Google PageSpeed Insights는 Lighthouse로 각 URL을 감사하고 성능/SEO/접근성/권장사항 점수 + Core Web Vitals(LCP/CLS/INP)를 반환합니다. 무료 API 키로 하루 25,000회 감사할 수 있습니다.',
    prereqs: ['Google 계정.', 'Google Cloud Console 프로젝트(아래 단계에서 만들 수 있음).'],
    steps: [
      {
        title: 'Google Cloud Console 열기',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: '프로젝트 선택 또는 생성',
        detail:
          '왼쪽 상단 프로젝트 드롭다운 → "New Project" → 이름: "FreeCrawl SEO" → Create. 결제 계정 불필요 — PSI 무료 티어는 인증용 자격 증명만 있으면 됩니다.',
      },
      {
        title: 'PageSpeed Insights API 사용 설정',
        detail: '이 딥링크는 API 사용 설정 페이지로 바로 이동합니다:',
        link: {
          label: 'PageSpeed Insights API → Enable',
          url: 'https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com',
        },
      },
      {
        title: '파란색 "Enable" 버튼 클릭 → 30초 대기',
      },
      {
        title: 'Credentials로 이동',
        link: {
          label: 'Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: '"+ Create Credentials" → "API key" 클릭',
        detail: 'API 키가 생성됩니다(`AIzaSy...`로 시작). 즉시 복사하세요.',
      },
      {
        title: '선택: API 키 제한(권장)',
        detail:
          '"Edit API key" → "Restrict key" 클릭:\n• API restrictions: "Restrict key" → "PageSpeed Insights API"\n• Application restrictions: "None"(FreeCrawl은 데스크톱 앱이므로 리퍼러/IP 필터링이 동작하지 않음)\n제한하지 않은 키도 동작하지만 제한을 권장합니다.',
      },
      {
        title: '이 패널의 "API Key" 필드에 키 붙여넣기 + 저장',
      },
      {
        title: 'PageSpeed 탭에서 테스트',
        detail: '상단 "PageSpeed" 탭 → URL 몇 개 선택 → "Run audit". 첫 감사는 약 10-15초.',
      },
    ],
    troubleshooting: [
      {
        problem: '"This API method requires billing to be enabled"',
        solution:
          '잘못된 API를 사용 설정했습니다(예: 오래된 "Cloud PageSpeed Insights API"). 올바른 것은 "PageSpeed Insights API"(pagespeedonline.googleapis.com)입니다. 3단계의 링크를 다시 여세요.',
      },
      {
        problem: '"API key not valid"',
        solution:
          '키 제한이 잘못되었습니다. Cloud Console → Credentials → 키 클릭 → 허용된 API에 "PageSpeed Insights API"가 있는지 확인하세요. 또는 검증을 위해 제한을 잠시 해제하세요.',
      },
      {
        problem: '"Quota exceeded" — before hitting 25,000',
        solution:
          '분당 한도도 있습니다: 240 쿼리/분. 설정 → PageSpeed에서 동시성을 2-3으로 유지하세요. 일일 25K 상한은 매우 높아 일반 사용에서는 볼 일이 없습니다.',
      },
    ],
    notes: [
      '비용: 무료 — 결제가 필요 없는 몇 안 되는 Google API 중 하나입니다. 키 없는/익명 모드는 이제 하루 0 쿼리(2026년 초 폐쇄)이므로 키가 필수입니다.',
      '속도: URL당 약 5-10초(Google이 실제로 Lighthouse 인스턴스를 실행). URL 1000개 약 2시간.',
      '모바일 + 데스크톱은 별도의 API 호출로 계산됩니다 — "둘 다"를 선택하면 할당량 사용이 두 배가 됩니다.',
    ],
    lastReviewed: '2026-06-01',
  },
  ahrefs: {
    intro:
      'Ahrefs API로 URL별 백링크 수, domain rating, 참조 도메인, 자연 키워드 수를 가져옵니다. Ahrefs에서 가장 비싼 통합입니다 — API 접근은 월 500달러 이상 요금제에서만 가능합니다.',
    prereqs: [
      'Ahrefs Standard(월 249달러) 이상 구독.',
      '추가 "API" 티어(기본 요금제에 월 500달러 추가, 또는 다른 티어).',
    ],
    steps: [
      {
        title: 'Ahrefs 로그인 → API 페이지',
        link: {
          label: 'ahrefs.com/api',
          url: 'https://ahrefs.com/api',
        },
      },
      {
        title: '구독 선택(아직 API 접근 권한이 없다면)',
        detail:
          'API v3 접근은 Enterprise 티어와 전용 API 요금제에 포함됩니다. 견적은 영업팀에 문의하세요.',
      },
      {
        title: '계정에서 API 토큰 생성',
        detail:
          'Ahrefs 대시보드 → Account settings → API → Generate token. 토큰 형식: `sk-...` 또는 유사.',
      },
      {
        title: '"API Key" 필드에 붙여넣기 + 저장',
      },
      {
        title: 'SEO Authority 탭에서 테스트',
        detail: '상단 "SEO Authority" 탭 → 제공자: "Ahrefs" → URL 몇 개 선택 → "Run".',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient credits"',
        solution:
          'API 행 단위를 모두 사용했습니다. Ahrefs 대시보드 → API → "Usage" 탭. 요금제를 업그레이드하거나 다음 청구 주기를 기다리세요.',
      },
      {
        problem: '"Unauthorized"',
        solution:
          '구독에 API 접근이 포함되지 않았습니다. "Ahrefs Standard"만으로는 API 권한이 없습니다 — 별도의 명시적 API 티어가 필요합니다.',
      },
    ],
    notes: [
      '비용: URL 감사당 대략 1-5 API 행. Standard API 요금제 월 약 25K 행.',
      '더 저렴한 대안: Moz(월 99달러, Domain Authority) 또는 Majestic.',
    ],
    lastReviewed: '2026-06-01',
  },
  majestic: {
    intro:
      'Majestic API로 Trust Flow, Citation Flow, 백링크 수를 가져옵니다. 백링크 중심 제공자 중 가장 비용 효율적입니다.',
    prereqs: ['Majestic Lite(월 49.99달러) 이상 구독.', 'API 접근 — Lite에 포함.'],
    steps: [
      {
        title: 'Majestic 개발자 대시보드 열기',
        link: {
          label: 'majestic.com/account/api',
          url: 'https://majestic.com/account/api',
        },
      },
      {
        title: 'API 키 생성',
        detail: '대시보드 → "Open API" 탭 → "Generate new key" → 복사.',
      },
      {
        title: '이 패널에 붙여넣기 + 저장',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient resources" / "No analysis units"',
        solution:
          '월간 분석 단위 할당량을 모두 사용했습니다. Lite 요금제: 월 1000 단위; Pro: 20K+. Majestic 대시보드 → API → 사용량을 확인하세요.',
      },
    ],
    notes: ['비용: URL 백링크 조회 1회 = 5 단위. Lite 요금제(1000 단위) 월 약 200 URL.'],
    lastReviewed: '2026-06-01',
  },
  moz: {
    intro:
      'Moz API로 Domain Authority(DA), Page Authority(PA), Spam Score를 가져옵니다. 낮은 예산에서 가장 인기 있는 선택입니다.',
    prereqs: ['"Moz API" 애드온이 활성화된 Moz Pro Standard(월 99달러) 이상 구독.'],
    steps: [
      {
        title: 'Moz API 페이지 열기',
        link: {
          label: 'moz.com/api',
          url: 'https://moz.com/api',
        },
      },
      {
        title: 'Account → API → "Generate Credentials"',
        detail: '두 값이 생성됩니다: "Access ID"와 "Secret Key". 둘 다 복사하세요.',
      },
      {
        title: '이 패널의 "Access ID" + "Secret Key" 필드에 각각 붙여넣기 + 저장',
        detail: '두 개의 별도 필드 — 순서대로 입력하세요.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Authentication failed"',
        solution:
          'Access ID 또는 Secret Key가 잘못 복사되었습니다. Moz 대시보드에서 다시 복사하세요 — Access ID는 짧고(약 13자), Secret Key는 깁니다(약 40자).',
      },
    ],
    notes: ['비용: Standard 요금제(월 1500 행), Medium(월 10K 행), Large(월 100K 행).'],
    lastReviewed: '2026-06-01',
  },
  semrush: {
    intro:
      'Semrush API로 자연 키워드, 트래픽 추정치, SERP 기능을 가져옵니다. 가장 포괄적인 키워드 + 트래픽 데이터입니다.',
    prereqs: [
      'Semrush Pro(월 129달러) 이상 구독.',
      '계정에 연결된 "API units"(Guru 티어 이상은 API 접근 포함).',
    ],
    steps: [
      {
        title: 'Semrush 로그인 → Subscription info → API',
        link: {
          label: 'Semrush API 접근',
          url: 'https://www.semrush.com/accounts/subscription-info/api-units/',
        },
      },
      {
        title: 'API 키 복사',
      },
      {
        title: '이 패널에 붙여넣기 + 저장',
      },
    ],
    troubleshooting: [
      {
        problem: '"API units exhausted"',
        solution:
          '월간 단위 할당량을 모두 사용했습니다. Guru 요금제: 월 7K 단위, Business: 25K+. Semrush 대시보드 → API → 사용량을 확인하세요.',
      },
    ],
    notes: ['비용: URL 백링크 쿼리 1회 = 10 단위; 도메인 개요 1회 = 1 단위.'],
    lastReviewed: '2026-06-01',
  },
  gsc: {
    intro:
      'Google Search Console API로 URL별 Search Console 지표(클릭, 노출, CTR, 평균 순위)를 가져옵니다. URL Inspection API는 색인 범위 판정 + 마지막 크롤링 시각도 제공합니다. "자체 클라이언트 사용" 모델 — 본인의 Google Cloud OAuth 클라이언트를 만들어 붙여넣습니다. FreeCrawl은 공유 중개 앱을 사용하지 않습니다.',
    prereqs: [
      'Google 계정(연결할 GSC 속성을 소유 / 공동 소유해야 함).',
      '추가 + 확인된 Google Search Console 속성 최소 하나.',
    ],
    steps: [
      {
        title: 'Google Cloud Console을 열고 새 프로젝트 생성',
        detail:
          '왼쪽 상단 프로젝트 드롭다운 → "New Project" → 이름: "FreeCrawl SEO Integrations"(원하는 대로) → Create. 이 프로젝트는 OAuth 자격 증명 전용입니다 — 결제 불필요.',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Google Auth Platform → Branding 열기',
        detail:
          '왼쪽 메뉴 "APIs & Services" → "OAuth consent screen"(새 UI: "Google Auth Platform → Branding"). User Type: "External" → Create.',
        link: {
          label: 'OAuth consent screen',
          url: 'https://console.cloud.google.com/auth/branding',
        },
      },
      {
        title: 'OAuth 동의 화면 작성',
        detail:
          '필수 필드만:\n• App name: "FreeCrawl Local"\n• User support email: 본인 이메일\n• Developer contact information: 본인 이메일\n나머지는 비워 두세요. Save and Continue → Save and Continue → Save and Continue → Back to Dashboard.',
      },
      {
        title: '중요: 자신을 Test User로 추가',
        detail:
          '왼쪽 메뉴 → "Audience"(이전 UI "Test users") → "Add users" → 연결할 Gmail 붙여넣기 → Save.\n\n경고: 이 단계를 건너뛰지 마세요. 건너뛰면 OAuth 중 403 access_denied가 발생합니다 — "Testing" 상태의 앱은 테스트 사용자 목록의 계정만 연결을 허용합니다.',
        link: {
          label: 'Audience 페이지',
          url: 'https://console.cloud.google.com/auth/audience',
        },
      },
      {
        title: 'Google Search Console API 사용 설정',
        detail: '이 링크는 사용 설정 페이지로 바로 이동합니다 → 파란색 "Enable" 클릭 → 30초 대기.',
        link: {
          label: 'Search Console API → Enable',
          url: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com',
        },
      },
      {
        title: 'OAuth Client ID 생성',
        detail:
          '왼쪽 메뉴 → "Credentials"(새 UI "Google Auth Platform → Clients") → "+ Create credentials" → "OAuth client ID".',
        link: {
          label: 'Credentials 페이지',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'OAuth Client 유형으로 "Desktop app" 선택(Web app 아님!)',
        detail:
          'Application type 드롭다운 → "Desktop app". Name: "FreeCrawl SEO Tool". Create → 대화상자에 Client ID + Client Secret이 표시됩니다. 즉시 둘 다 복사하세요(Secret은 다시 표시되지 않음).\n\n왜 DESKTOP인가: FreeCrawl은 연결마다 무작위 로컬 포트(예: 127.0.0.1:63092)를 사용합니다. "Web application"은 고정된 리디렉션 URI 목록이 필요합니다 — 무작위 포트는 일치할 수 없음 → 실패. "Desktop app"은 포트에 상관없이 루프백 리디렉션을 자동으로 허용합니다.',
      },
      {
        title: 'Client ID + Client Secret을 이 패널에 붙여넣기 + 저장',
        detail:
          '두 필드: "OAuth Client ID"(...apps.googleusercontent.com)와 "OAuth Client Secret"(GOCSPX-...). 저장.',
      },
      {
        title: '"연결" 클릭 — 브라우저가 열립니다',
        detail:
          '저장 후 카드에 "연결" 버튼이 표시됩니다. 클릭 → Google 동의 화면이 기본 브라우저에서 열립니다.',
      },
      {
        title: '테스트 사용자로 추가한 Google 계정으로 로그인',
        detail:
          '계정 선택기에서 테스트 사용자에 추가한 이메일을 선택하세요. "Continue" → "Google hasn\'t verified this app" 경고(테스트 모드에서 정상). "Advanced" → "Go to FreeCrawl Local (unsafe)" → 권한 수락 → Allow.',
      },
      {
        title: 'FreeCrawl로 돌아오면 "구성됨"이 보여야 합니다',
        detail:
          '설정의 Search Console 카드에 이제 녹색 "구성됨" 배지가 표시됩니다. 이제 상단 "Search Console" 탭으로 전환해 속성을 나열하고 데이터를 가져올 수 있습니다.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 access_denied"',
        solution:
          '테스트 사용자를 추가하지 않았거나 잘못된 Google 계정으로 로그인하고 있습니다. Audience 페이지로 돌아가 사용 중인 계정이 테스트 사용자 목록에 있는지 확인하세요. Google 계정이 여러 개라면 계정 선택기가 어떤 계정을 쓰는지 확인하세요.',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'Search Console API가 사용 설정되지 않았거나, OAuth 동의 화면에서 "View Search Console data for your verified sites" 권한 체크박스가 해제되어 있었습니다. (1) Search Console API 사용 설정(5단계), (2) myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → 연결을 다시 클릭하고 동의 화면에서 모든 권한을 체크하세요.',
      },
      {
        problem: '"redirect_uri_mismatch"',
        solution:
          'OAuth 클라이언트 유형이 잘못되었습니다. Credentials 페이지에서 클라이언트를 삭제하고 "Desktop app"으로 다시 만드세요(7단계). "Web application"은 이 흐름에서 절대 동작하지 않습니다.',
      },
      {
        problem: '"This app isn\'t verified" warning',
        solution:
          '예상된 동작입니다(테스트 모드 앱 + 민감한 범위). "Advanced" → "Go to <app> (unsafe)"를 클릭해 진행하세요. 앱은 테스트 모드이며 테스트 사용자만 들어올 수 있습니다 — 안전합니다.',
      },
      {
        problem: 'Connection broke after 7 days',
        solution:
          '테스트 모드에서는 OAuth 리프레시 토큰이 7일마다 만료됩니다. 설정 → 통합 → Search Console → "연결 해제" → "연결"로 다시 인증하세요. 만료를 없애려면 앱을 Google 검증 절차(1-4주)에 통과시켜야 합니다.',
      },
    ],
    notes: [
      '소유한 속성(sc-domain:example.com 또는 https://example.com/)에는 계정이 확인한 모든 사이트가 포함됩니다.',
      'GSC 데이터는 약 2일 지연됩니다 — 오늘의 클릭은 즉시 표시되지 않습니다.',
      '무료 할당량: 분당 1200 쿼리, 하루 25,000 쿼리 — 일반 사용에서는 절대 도달하지 않습니다.',
    ],
    lastReviewed: '2026-06-01',
  },
  ga4: {
    intro:
      'URL별 GA4 지표(세션, 사용자, 이탈률, 참여율, 전환)를 가져옵니다. "자체 클라이언트 사용" — 본인의 GCP OAuth 클라이언트를 사용합니다.',
    prereqs: [
      '연결할 GA4 속성에 최소 뷰어 권한이 있는 Google 계정.',
      'GSC용으로 설정한 OAuth 클라이언트를 재사용할 수 있습니다 — 올바른 API만 사용 설정하면 됩니다.',
    ],
    steps: [
      {
        title: '이미 GSC를 설정했다면: 그 OAuth 클라이언트를 재사용',
        detail:
          'Search Console이 이미 구성되어 있다면 같은 Google Cloud 프로젝트와 같은 OAuth Client ID + Secret을 사용할 수 있습니다. 다시 만들 필요 없음 — 아래 API만 사용 설정하고 자격 증명을 여기에 붙여넣으세요.',
      },
      {
        title: '두 GA4 API 모두 사용 설정',
        detail:
          'GA4에는 두 개의 별도 API가 필요합니다:\n\n1. Google Analytics Admin API(속성 목록용)\n2. Google Analytics Data API(실제 보고서용)\n\n둘 다 사용 설정하지 않으면 "API not enabled" 오류가 표시됩니다.',
        link: {
          label: 'Admin API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com',
        },
      },
      {
        title: 'Data API도 사용 설정',
        link: {
          label: 'Data API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
        },
      },
      {
        title: 'GSC에 사용한 것과 같은 Client ID + Secret 붙여넣기',
        detail:
          'GSC가 이미 연결되어 있다면 붙여넣을 필요조차 없을 수 있습니다 — 카드끼리 자격 증명을 공유할 수 있습니다. GA4를 처음부터 설정한다면 GSC 클라이언트의 ID/Secret을 이 패널에 복사하세요.',
      },
      {
        title: '"연결" → Google로 로그인 + GA4 범위 승인',
        detail:
          '테스트 사용자로 추가한 Google 계정으로 로그인하세요. 동의 화면에서 "Google Analytics: View Google Analytics property data" 권한이 체크되어 있는지 확인하세요.',
      },
      {
        title: 'GA4 탭에서 속성 나열 + 가져오기',
        detail:
          '상단 "GA4" 탭으로 전환 → "List Properties"가 계정이 볼 수 있는 모든 GA4 속성을 표시 → 하나 선택 → 기간 선택(7/28/90일) → "Fetch". GA4는 거의 실시간이라 결과가 즉시 나타납니다.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Google Analytics Admin API has not been used in project X"',
        solution:
          'Admin API가 사용 설정되지 않았습니다. 2단계 링크 열기 → Enable. 30초 기다린 뒤 재시도. 다음에는 Data API에서 같은 오류가 납니다 — 3단계 링크를 열어 그것도 사용 설정하세요.',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'OAuth 범위가 GA4를 포함하지 않습니다. myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → 연결을 다시 클릭 → Google Analytics 권한 체크박스를 체크하세요.',
      },
      {
        problem: 'Property list comes back empty',
        solution:
          '연결한 Google 계정에 GA4 속성에 대한 역할이 없습니다. GA4 대시보드 → Admin → Property Access Management → 이메일에 최소 뷰어 권한이 있는지 확인하세요.',
      },
    ],
    notes: [
      'GA4 데이터는 거의 실시간입니다 — 오늘 데이터는 4-24시간 내에 표시됩니다.',
      '무료 할당량: 하루 200K 요청, 속성당 분당 50 요청.',
    ],
    lastReviewed: '2026-06-01',
  },
  sheets: {
    intro:
      '크롤링 결과를 Google 스프레드시트로 바로 내보냅니다. 팀원과 공유 실시간 문서로 협업할 때 "CSV 다운로드 → Excel에서 열기"보다 낫습니다.',
    prereqs: ['Google 계정.', 'GSC용으로 설정한 OAuth 클라이언트를 재사용할 수 있습니다.'],
    steps: [
      {
        title: 'GSC/GA4를 설정했다면: 그 OAuth 클라이언트를 재사용',
        detail: '같은 OAuth Client ID + Secret을 붙여넣으세요(이미 저장되어 있을 수도 있음).',
      },
      {
        title: 'Google Sheets API 사용 설정',
        link: {
          label: 'Sheets API → Enable',
          url: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
        },
      },
      {
        title: 'Google Drive API도 사용 설정',
        detail: 'Sheets API는 스프레드시트를 만들고 읽기 위해 Drive 범위도 필요합니다.',
        link: {
          label: 'Drive API → Enable',
          url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
        },
      },
      {
        title: 'Client ID + Secret 붙여넣기 + 저장',
      },
      {
        title: '"연결" → 동의 화면에서 Sheets + Drive 승인',
        detail:
          'OAuth 흐름에 두 권한이 표시됩니다:\n• See, edit, create, and delete all your Google Sheets spreadsheets\n• See, edit, create, and delete only the specific Google Drive files used with this app\n둘 다 체크하세요.',
      },
      {
        title: '내보내기 메뉴에서 테스트',
        detail:
          '파일 → 내보내기 → "Google 스프레드시트로 내보내기". 새 시트가 자동 생성되고 URL이 클립보드에 복사됩니다.',
      },
    ],
    troubleshooting: [
      {
        problem: '"insufficient authentication scopes"',
        solution:
          '연결 시 Drive 권한 체크박스를 체크하지 않았습니다. 연결 해제 + 다시 연결하고 두 권한을 모두 체크하세요.',
      },
    ],
    notes: [
      'Sheets 하드 리밋: 스프레드시트당 1000만 셀 — 대형 크롤링(>50만 URL)은 분할됩니다.',
      'Drive 범위는 "drive.file"입니다 — FreeCrawl이 만든 파일만 접근 가능하며 기존 파일은 접근할 수 없습니다.',
    ],
    lastReviewed: '2026-06-01',
  },
  bigquery: {
    intro:
      '크롤링 데이터를 BigQuery 데이터셋으로 직접 스트리밍합니다. 데이터 웨어하우스에 날짜별 스냅샷을 쌓고 BI 도구(Looker Studio, Tableau, Metabase)로 크롤링 추세를 시각화할 때 유용합니다.',
    prereqs: [
      'BigQuery API가 사용 설정된 Google Cloud 프로젝트.',
      '이미 생성된 BigQuery 데이터셋.',
      '서비스 계정 JSON(OAuth 아님 — 서버 간 인증).',
      '결제가 사용 설정된 GCP 프로젝트(BigQuery 무료 티어: 월 10GB 저장 + 월 1TB 쿼리; 초과 시 과금).',
    ],
    steps: [
      {
        title: 'BigQuery 데이터셋 생성',
        detail:
          'BigQuery 콘솔 → 프로젝트 선택 → "Create dataset" → ID: "freecrawl_seo"(또는 아무 이름) → Location: "EU" 또는 "US"(중요 — 나중에 변경 불가) → Create dataset.',
        link: {
          label: 'BigQuery 콘솔',
          url: 'https://console.cloud.google.com/bigquery',
        },
      },
      {
        title: '서비스 계정 생성',
        detail:
          'IAM & Admin → Service Accounts → "+ Create service account" → 이름: "freecrawl-bigquery" → Create and continue.',
        link: {
          label: 'Service Accounts',
          url: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
        },
      },
      {
        title: '역할 추가',
        detail:
          '2단계 "Grant this service account access to project"에서 → 두 역할 추가:\n• BigQuery Data Editor\n• BigQuery Job User\n그다음 "Continue" → "Done".',
      },
      {
        title: 'JSON 키 다운로드',
        detail:
          '서비스 계정 목록에서 방금 만든 계정 클릭 → "Keys" 탭 → "Add key" → "Create new key" → Type: JSON → Create.\n\nJSON이 자동으로 다운로드됩니다. 텍스트 편집기로 열어 전체 내용을 복사하세요.\n\n경고: 이 JSON에는 모든 자격 증명이 들어 있습니다 — 비밀번호처럼 다루세요. 절대 소스 관리에 커밋하지 마세요.',
      },
      {
        title: '이 패널의 "Service Account JSON" 필드에 붙여넣기',
        detail:
          '전체 JSON(여는 `{`부터 닫는 `}`까지)을 붙여넣으세요. FreeCrawl은 JSON을 OS 자격 증명 저장소에 암호화해 저장합니다.',
      },
      {
        title: '"GCP Project ID" 입력',
        detail:
          'GCP 프로젝트 ID(Cloud Console 왼쪽 상단 드롭다운에 표시, 예: "my-gcp-project-12345"). JSON에도 "project_id" 필드가 있습니다 — 거기서 복사해도 됩니다.',
      },
      {
        title: '데이터셋 이름 입력 + 저장',
        detail: '1단계에서 만든 데이터셋 이름(예: "freecrawl_seo").',
      },
      {
        title: '내보내기 메뉴에서 테스트',
        detail:
          '파일 → 내보내기 → "BigQuery로 내보내기" → 테이블 이름/형식 선택 → 실행. BigQuery 콘솔에서 테이블이 나타났는지 확인하세요.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 PermissionDenied: caller does not have permission"',
        solution:
          '서비스 계정의 IAM 역할이 없습니다. IAM & Admin → IAM → 서비스 계정 이메일 찾기 → "BigQuery Data Editor"와 "BigQuery Job User"가 모두 할당되어 있는지 확인하세요.',
      },
      {
        problem: '"Dataset X not found"',
        solution:
          '데이터셋 이름이 틀렸거나 위치가 불일치합니다(멀티 리전 "EU" vs 리전 "europe-west1"). BigQuery 콘솔에서 정확한 데이터셋 이름을 복사하세요.',
      },
      {
        problem: '"Invalid JSON"',
        solution:
          'JSON의 일부만 붙여넣었거나 양끝에 불필요한 문자가 있습니다. 서비스 계정 JSON 파일을 제대로 된 편집기(VS Code 권장, 메모장 금지)로 열고 Ctrl+A로 전체 선택, 복사, FreeCrawl 필드를 비우고 붙여넣으세요.',
      },
    ],
    notes: [
      '비용: BigQuery 무료 티어(10GB 저장 + 월 1TB 쿼리)로 일반 사용은 충분합니다. 100만 URL 크롤링은 약 500MB; 쿼리 비용은 SQL에 따라 다릅니다.',
      '스키마 진화: FreeCrawl이 내보내기 테이블을 자동으로 생성/갱신합니다. CrawlUrlRow 스키마에 새 열이 생기면 내보내기 테이블이 이를 반영합니다(BigQuery DDL 유연성).',
    ],
    lastReviewed: '2026-06-01',
  },
};
