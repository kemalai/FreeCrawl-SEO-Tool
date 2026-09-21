/**
 * Russian integration setup guides. Generated from the guide source —
 * see `./index.ts` for how a locale is picked. Keep the step count,
 * links and `lastReviewed` in lockstep with `en.ts`; the parity test
 * in `tests/` compares them.
 */
import type { Guide } from './types.js';

export const GUIDES_RU: Record<string, Guide> = {
  openai: {
    intro:
      'Запускайте свой промпт для каждого URL через API OpenAI — анализ контента, идеи заголовков, резюме. Использование оплачивается с вашего собственного аккаунта OpenAI; FreeCrawl — бесплатный посредник, вызовы API оплачиваете вы.',
    prereqs: [
      'Аккаунт OpenAI (бесплатная регистрация на https://platform.openai.com).',
      'Действующий способ оплаты — OpenAI требует минимальный баланс 5 $, прежде чем ключи заработают.',
    ],
    steps: [
      {
        title: 'Войдите на platform.openai.com',
        detail: 'Используйте свой аккаунт OpenAI. Если его ещё нет — "Sign up".',
        link: {
          label: 'platform.openai.com',
          url: 'https://platform.openai.com',
        },
      },
      {
        title: 'Нажмите "API keys" в левой боковой панели',
        detail: 'Пункт меню с иконкой ключа слева. Можно также перейти сразу по URL.',
        link: {
          label: 'Страница API keys',
          url: 'https://platform.openai.com/api-keys',
        },
      },
      {
        title: 'Нажмите "+ Create new secret key" (справа вверху)',
        detail:
          'В диалоге:\n• Name: "FreeCrawl SEO Tool" (любая метка-напоминание)\n• Project: Default project или на ваш выбор\n• Permissions: All (проще всего; ограниченные области тоже работают)\nзатем "Create secret key".',
      },
      {
        title: 'СКОПИРУЙТЕ ключ — он больше не будет показан',
        detail:
          'Ключ начинается с `sk-...`. Если не скопировать сейчас, он потерян навсегда (придётся создавать новый). Сохраните его в менеджере паролей — не оставляйте во вкладке браузера.',
      },
      {
        title: 'Вставьте его в поле "API Key" этой панели + нажмите Сохранить',
        detail:
          'FreeCrawl хранит ключ в зашифрованном виде в хранилище учётных данных ОС (Windows DPAPI, Связка ключей macOS, Secret Service Linux). Никогда не записывается открытым текстом.',
      },
      {
        title: 'Проверьте во вкладке AI',
        detail:
          'Закройте Настройки → перейдите на верхнюю вкладку "AI" → выберите несколько URL из сканирования → нажмите "Run AI". Первый вызов занимает ~2-3 с.',
      },
    ],
    troubleshooting: [
      {
        problem: '"You exceeded your current quota"',
        solution:
          'На вашем аккаунте OpenAI нет баланса. Перейдите на platform.openai.com → Billing → "Add payment method" → добавьте карту и пополните на 5 $ или больше. Новые аккаунты не получают кредит автоматически; нужно пополнить.',
      },
      {
        problem: '"Incorrect API key provided" / 401',
        solution:
          'Скорее всего, в ключе лишний пробел в начале или в конце. Создайте новый и скопируйте аккуратно. Старый отзовите.',
      },
      {
        problem: '"Rate limit exceeded"',
        solution:
          'Слишком много параллельных запросов. Снизьте параллельность в Настройки → AI (по умолчанию: 3). Аккаунты Tier 1 работают на 500-3500 RPM в зависимости от модели.',
      },
    ],
    notes: [
      'Цены (2026-06): gpt-4o-mini ~0,15 $/1M входных токенов, gpt-4o ~2,50 $/1M входных. 1000 URL с типичным промптом + ответом: ~0,50-2 $.',
      'Установите жёсткий месячный лимит на странице Usage limits — вам не нужен счёт на 1000 $ от вышедшего из-под контроля сканирования на 1M URL.',
    ],
    lastReviewed: '2026-06-01',
  },
  anthropic: {
    intro:
      'Запускайте промпты к Claude через API Anthropic. Топовые модели Claude (Sonnet 4.6, Opus 4.8) дают SEO-результат с меньшим «привкусом ИИ», чем у конкурентов. Оплачивается с вашего аккаунта Anthropic.',
    prereqs: [
      'Аккаунт Anthropic (https://console.anthropic.com).',
      'Привязанный способ оплаты (новые пользователи получают промо-кредит 5 $).',
    ],
    steps: [
      {
        title: 'Войдите на console.anthropic.com',
        link: {
          label: 'console.anthropic.com',
          url: 'https://console.anthropic.com',
        },
      },
      {
        title: 'Откройте страницу "API Keys" из выпадающего меню справа вверху',
        detail: 'В меню Settings — пункт "API Keys".',
        link: {
          label: 'Страница API Keys',
          url: 'https://console.anthropic.com/settings/keys',
        },
      },
      {
        title: 'Нажмите "+ Create Key"',
        detail:
          'В диалоге:\n• Name: "FreeCrawl SEO Tool"\n• Workspace: Default workspace\n• Environment: Production\nзатем "Create Key".',
      },
      {
        title: 'СКОПИРУЙТЕ ключ — он больше не будет показан',
        detail: 'Ключ начинается с `sk-ant-...`. Потеряли — создавайте новый.',
      },
      {
        title: 'Вставьте его в поле "API Key" + Сохранить',
      },
      {
        title: 'Необязательно: выберите модель',
        detail:
          'В Настройки → AI поле "Model" принимает идентификатор модели (по умолчанию: claude-sonnet-4-6). Приоритет скорости: claude-haiku-4-5 (~в 10 раз дешевле, в 3 раза быстрее). Приоритет качества: claude-opus-4-8.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Your credit balance is too low"',
        solution: 'console.anthropic.com → Settings → Billing → "Add credits" — минимум 5 $.',
      },
      {
        problem: '"Number of request tokens has exceeded your rate limit"',
        solution:
          'Аккаунты Tier 1 — ~50 RPM. Снизьте параллельность до 2-3 в Настройки → AI. Для более высоких уровней нужно потратить 25 $ и более (Tier 2: 1000 RPM).',
      },
      {
        problem: '"Invalid API key"',
        solution:
          'Убедитесь, что префикс "sk-ant-" цел и нет лишних пробелов. Проверьте страницу API Keys — если ключ там показан активным, сам ключ в порядке.',
      },
    ],
    notes: [
      'Цены (2026-06): Haiku 4.5 ~0,25 $/1,25 $ (вход/выход за 1M токенов), Sonnet 4.6 ~3 $/15 $, Opus 4.8 ~15 $/75 $.',
      'Anthropic поддерживает кэширование промптов — повторяющиеся длинные системные промпты в течение 5 мин идут со скидкой 90 % (панель AI FreeCrawl пока не использует кэш — появится в следующих версиях).',
    ],
    lastReviewed: '2026-06-01',
  },
  ollama: {
    intro:
      'Ollama — открытая среда выполнения для локально размещённых LLM. БЕЗ ключа API, бесплатно навсегда, даже интернет не нужен. Стоимость нулевая; единственный минус — VRAM/RAM для больших моделей.',
    prereqs: [
      'macOS 12+, Windows 10+ или Linux (рекомендуется Ubuntu 22.04+).',
      'Не менее 8 ГБ ОЗУ (небольшие модели). Llama 3.2 3B требует ~2 ГБ VRAM/RAM.',
      'GPU рекомендуется, но не обязателен — CPU работает (медленнее).',
    ],
    steps: [
      {
        title: 'Скачайте + установите Ollama',
        detail:
          'Выберите установщик под свою ОС:\n• Windows: OllamaSetup.exe\n• macOS: Ollama.dmg\n• Linux: curl -fsSL https://ollama.com/install.sh | sh\n\nПосле установки Ollama работает в фоне (значок в системном трее).',
        link: {
          label: 'ollama.com/download',
          url: 'https://ollama.com/download',
        },
      },
      {
        title: 'Загрузите модель',
        detail:
          'Откройте терминал и выполните:\n\n  ollama pull llama3.2\n\nllama3.2 (3B параметров) — ~2 ГБ, быстрая, нетребовательная. Варианты побольше:\n  ollama pull llama3.3:70b   (~40 ГБ, только мощный GPU)\n  ollama pull qwen2.5:7b     (~4 ГБ, сбалансированная)\n  ollama pull mistral:7b     (~4 ГБ, альтернатива)',
      },
      {
        title: 'Быстро проверьте модель',
        detail:
          'В терминале:\n  ollama run llama3.2\n\nОткроется интерактивный чат. Наберите "hello" — если пришёл ответ, всё в порядке. Ctrl+D для выхода.',
      },
      {
        title: 'Укажите адрес Ollama в этой панели',
        detail:
          'По умолчанию: http://localhost:11434 (уже подставлен). Измените, если Ollama работает на другом порту.',
      },
      {
        title: 'Укажите имя загруженной модели',
        detail:
          'Например "llama3.2" или "qwen2.5:7b". Оставьте пустым, чтобы FreeCrawl взял первую доступную модель.',
      },
      {
        title: 'Сохраните + проверьте',
        detail: 'Запустите небольшую партию во вкладке AI. Только CPU: ~5-15 с/URL. GPU: ~1-3 с.',
      },
    ],
    troubleshooting: [
      {
        problem: 'AI tab says "Connection refused"',
        solution:
          'Ollama не запущена. В терминале выполните "ollama serve" или запустите приложение Ollama из системного трея / меню Пуск.',
      },
      {
        problem: '"model \'X\' not found"',
        solution:
          'Модель не загружена. Выполните "ollama pull <имя-модели>". "ollama list" покажет, что уже есть на диске.',
      },
      {
        problem: 'Replies are very slow (>30 s/URL)',
        solution:
          'Модель не помещается в VRAM и уходит на CPU. Попробуйте модель поменьше (llama3.2:1b или phi3:mini). Требования к VRAM: 3B ~2 ГБ, 7B ~4 ГБ, 13B ~8 ГБ.',
      },
    ],
    notes: [
      'Полностью офлайн — сканирование + ИИ-анализ продолжают работать даже без интернета.',
      'Качество локального SEO-анализа: модели 3B слабоваты, 7-13B приемлемы, 70B на уровне GPT-4 (но требует мощного железа).',
      'В Настройки → AI держите параллельность 1-2 — локальные модели выполняют параллельные запросы последовательно.',
    ],
    lastReviewed: '2026-06-01',
  },
  pagespeed: {
    intro:
      'Google PageSpeed Insights проверяет каждый URL через Lighthouse и возвращает оценки Производительность/SEO/Доступность/Лучшие практики + Core Web Vitals (LCP/CLS/INP). Бесплатный ключ API даёт 25 000 проверок/день.',
    prereqs: ['Аккаунт Google.', 'Проект в Google Cloud Console (можно создать в шагах ниже).'],
    steps: [
      {
        title: 'Откройте Google Cloud Console',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Выберите или создайте проект',
        detail:
          'Выпадающий список проектов слева вверху → "New Project" → имя: "FreeCrawl SEO" → Create. Платёжный аккаунт НЕ нужен — бесплатному уровню PSI учётные данные нужны только для аутентификации.',
      },
      {
        title: 'Включите PageSpeed Insights API',
        detail: 'Эта прямая ссылка ведёт на страницу включения API:',
        link: {
          label: 'PageSpeed Insights API → Enable',
          url: 'https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com',
        },
      },
      {
        title: 'Нажмите синюю кнопку "Enable" → подождите 30 с',
      },
      {
        title: 'Перейдите в Credentials',
        link: {
          label: 'Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'Нажмите "+ Create Credentials" → "API key"',
        detail: 'Будет создан ключ API (начинается с `AIzaSy...`). Сразу скопируйте его.',
      },
      {
        title: 'Необязательно: ограничьте ключ API (рекомендуется)',
        detail:
          'Нажмите "Edit API key" → "Restrict key":\n• API restrictions: "Restrict key" → "PageSpeed Insights API"\n• Application restrictions: "None" (FreeCrawl — настольное приложение, фильтрация по referrer/IP не сработает)\nНеограниченные ключи тоже работают, но мы рекомендуем ограничить.',
      },
      {
        title: 'Вставьте ключ в поле "API Key" этой панели + Сохранить',
      },
      {
        title: 'Проверьте во вкладке PageSpeed',
        detail:
          'Верхняя вкладка "PageSpeed" → выберите несколько URL → "Run audit". Первая проверка занимает ~10-15 с.',
      },
    ],
    troubleshooting: [
      {
        problem: '"This API method requires billing to be enabled"',
        solution:
          'Вы включили не тот API (например, старый "Cloud PageSpeed Insights API"). Правильный — "PageSpeed Insights API" (pagespeedonline.googleapis.com). Снова откройте ссылку из шага 3.',
      },
      {
        problem: '"API key not valid"',
        solution:
          'Ограничения ключа заданы неверно. Cloud Console → Credentials → нажмите на ключ → убедитесь, что "PageSpeed Insights API" есть среди разрешённых API. Или временно снимите ограничения для проверки.',
      },
      {
        problem: '"Quota exceeded" — before hitting 25,000',
        solution:
          'Есть ещё поминутный лимит: 240 запросов/мин. В Настройки → PageSpeed держите параллельность 2-3. Дневной потолок 25K огромен — в обычной работе вы его не увидите.',
      },
    ],
    notes: [
      'Стоимость: БЕСПЛАТНО — один из немногих API Google без обязательной оплаты. Режим без ключа/анонимный теперь даёт 0 запросов/день (закрыт в начале 2026), так что ключ обязателен.',
      'Скорость: каждый URL ~5-10 с (Google действительно запускает экземпляр Lighthouse). 1000 URL ~2 часа.',
      'Mobile + Desktop считаются отдельными вызовами API — выбор «оба» удваивает расход квоты.',
    ],
    lastReviewed: '2026-06-01',
  },
  ahrefs: {
    intro:
      'Получайте число обратных ссылок, domain rating, ссылающиеся домены и количество органических ключевых слов для каждого URL через API Ahrefs. Это самая дорогая интеграция Ahrefs — доступ к API открыт только на тарифах от 500 $/мес.',
    prereqs: [
      'Подписка Ahrefs Standard (249 $/мес) или выше.',
      'Дополнительный уровень "API" (ещё 500 $/мес поверх базового тарифа или другой уровень).',
    ],
    steps: [
      {
        title: 'Войдите в Ahrefs → страница API',
        link: {
          label: 'ahrefs.com/api',
          url: 'https://ahrefs.com/api',
        },
      },
      {
        title: 'Выберите подписку (если у вас ещё нет доступа к API)',
        detail:
          'Доступ к API v3 входит в уровень Enterprise и выделенные API-тарифы. Обратитесь в отдел продаж за расчётом.',
      },
      {
        title: 'Создайте API-токен в своём аккаунте',
        detail:
          'Панель Ahrefs → Account settings → API → Generate token. Формат токена: `sk-...` или похожий.',
      },
      {
        title: 'Вставьте его в поле "API Key" + Сохранить',
      },
      {
        title: 'Проверьте во вкладке SEO Authority',
        detail:
          'Верхняя вкладка "SEO Authority" → провайдер: "Ahrefs" → выберите несколько URL → "Run".',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient credits"',
        solution:
          'Единицы строк API израсходованы. Панель Ahrefs → API → вкладка "Usage". Повысьте тариф или дождитесь следующего расчётного периода.',
      },
      {
        problem: '"Unauthorized"',
        solution:
          'Ваша подписка не включает доступ к API. Один только "Ahrefs Standard" прав на API не даёт — нужен отдельный уровень API поверх него.',
      },
    ],
    notes: [
      'Стоимость: примерно 1-5 строк API на проверку URL. Тариф API Standard ~25K строк/мес.',
      'Более дешёвые альтернативы: Moz (99 $/мес, Domain Authority) или Majestic.',
    ],
    lastReviewed: '2026-06-01',
  },
  majestic: {
    intro:
      'Получайте Trust Flow, Citation Flow и число обратных ссылок через API Majestic. Самый экономичный провайдер, ориентированный на обратные ссылки.',
    prereqs: ['Подписка Majestic Lite (49,99 $/мес) или выше.', 'Доступ к API — входит в Lite.'],
    steps: [
      {
        title: 'Откройте панель разработчика Majestic',
        link: {
          label: 'majestic.com/account/api',
          url: 'https://majestic.com/account/api',
        },
      },
      {
        title: 'Создайте ключ API',
        detail: 'Панель → вкладка "Open API" → "Generate new key" → скопируйте.',
      },
      {
        title: 'Вставьте его в эту панель + Сохранить',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient resources" / "No analysis units"',
        solution:
          'Месячная квота единиц анализа исчерпана. Тариф Lite: 1000 единиц/мес; Pro: 20K+. Проверьте панель Majestic → API → использование.',
      },
    ],
    notes: [
      'Стоимость: 1 запрос обратных ссылок URL = 5 единиц. Тариф Lite (1000 единиц) ~200 URL/мес.',
    ],
    lastReviewed: '2026-06-01',
  },
  moz: {
    intro:
      'Получайте Domain Authority (DA), Page Authority (PA) и Spam Score через API Moz. Самый популярный выбор при небольшом бюджете.',
    prereqs: ['Подписка Moz Pro Standard (99 $/мес) или выше с включённым дополнением "Moz API".'],
    steps: [
      {
        title: 'Откройте страницу API Moz',
        link: {
          label: 'moz.com/api',
          url: 'https://moz.com/api',
        },
      },
      {
        title: 'Account → API → "Generate Credentials"',
        detail: 'Будут созданы два значения: "Access ID" и "Secret Key". Скопируйте оба.',
      },
      {
        title: 'Вставьте их в поля "Access ID" + "Secret Key" этой панели + Сохранить',
        detail: 'Два отдельных поля — заполните по порядку.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Authentication failed"',
        solution:
          'Access ID или Secret Key скопированы с ошибкой. Скопируйте заново из панели Moz — Access ID короткий (~13 символов), Secret Key длинный (~40 символов).',
      },
    ],
    notes: [
      'Стоимость: тариф Standard (1500 строк/мес), Medium (10K строк/мес), Large (100K строк/мес).',
    ],
    lastReviewed: '2026-06-01',
  },
  semrush: {
    intro:
      'Получайте органические ключевые слова, оценки трафика и элементы выдачи через API Semrush. Самые полные данные по ключевым словам + трафику.',
    prereqs: [
      'Подписка Semrush Pro (129 $/мес) или выше.',
      '"API units", привязанные к аккаунту (уровень Guru и выше включают доступ к API).',
    ],
    steps: [
      {
        title: 'Войдите в Semrush → Subscription info → API',
        link: {
          label: 'Доступ к API Semrush',
          url: 'https://www.semrush.com/accounts/subscription-info/api-units/',
        },
      },
      {
        title: 'Скопируйте ключ API',
      },
      {
        title: 'Вставьте его в эту панель + Сохранить',
      },
    ],
    troubleshooting: [
      {
        problem: '"API units exhausted"',
        solution:
          'Месячная квота единиц исчерпана. Тариф Guru: 7K единиц/мес, Business: 25K+. Проверьте панель Semrush → API → использование.',
      },
    ],
    notes: ['Стоимость: 1 запрос обратных ссылок URL = 10 единиц; 1 обзор домена = 1 единица.'],
    lastReviewed: '2026-06-01',
  },
  gsc: {
    intro:
      'Получайте метрики Search Console по URL (клики, показы, CTR, средняя позиция) через Google Search Console API. URL Inspection API также даёт вердикт покрытия + время последнего сканирования. Модель «принесите свой клиент» — вы создаёте собственный OAuth-клиент в Google Cloud и вставляете его; FreeCrawl не использует общее приложение-посредник.',
    prereqs: [
      'Аккаунт Google (должен быть владельцем / совладельцем ресурса GSC, который вы подключаете).',
      'Хотя бы один ресурс Google Search Console добавлен + подтверждён.',
    ],
    steps: [
      {
        title: 'Откройте Google Cloud Console и создайте новый проект',
        detail:
          'Выпадающий список проектов слева вверху → "New Project" → имя: "FreeCrawl SEO Integrations" (любое) → Create. Этот проект нужен только для учётных данных OAuth — оплата не требуется.',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Откройте Google Auth Platform → Branding',
        detail:
          'Левое меню "APIs & Services" → "OAuth consent screen" (новый интерфейс: "Google Auth Platform → Branding"). User Type: "External" → Create.',
        link: {
          label: 'OAuth consent screen',
          url: 'https://console.cloud.google.com/auth/branding',
        },
      },
      {
        title: 'Заполните экран согласия OAuth',
        detail:
          'Только обязательные поля:\n• App name: "FreeCrawl Local"\n• User support email: ваш e-mail\n• Developer contact information: ваш e-mail\nОстальное оставьте пустым. Save and Continue → Save and Continue → Save and Continue → Back to Dashboard.',
      },
      {
        title: 'КРИТИЧНО: добавьте себя как Test User',
        detail:
          'Левое меню → "Audience" (старый интерфейс "Test users") → "Add users" → вставьте Gmail, который будете подключать → Save.\n\nВНИМАНИЕ: НЕ ПРОПУСКАЙТЕ ЭТОТ ШАГ. Пропуск приводит к 403 access_denied при OAuth — приложения в статусе "Testing" пускают только аккаунты из списка тестовых пользователей.',
        link: {
          label: 'Страница Audience',
          url: 'https://console.cloud.google.com/auth/audience',
        },
      },
      {
        title: 'Включите Google Search Console API',
        detail:
          'Эта ссылка ведёт прямо на страницу включения → нажмите синюю кнопку "Enable" → подождите 30 с.',
        link: {
          label: 'Search Console API → Enable',
          url: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com',
        },
      },
      {
        title: 'Создайте OAuth Client ID',
        detail:
          'Левое меню → "Credentials" (новый интерфейс "Google Auth Platform → Clients") → "+ Create credentials" → "OAuth client ID".',
        link: {
          label: 'Страница Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'Выберите тип OAuth-клиента "Desktop app" (НЕ Web app!)',
        detail:
          'Выпадающий список Application type → "Desktop app". Name: "FreeCrawl SEO Tool". Create → диалог покажет Client ID + Client Secret. Сразу скопируйте оба (Secret больше не показывается).\n\nПОЧЕМУ DESKTOP: FreeCrawl использует случайный локальный порт (например 127.0.0.1:63092) для каждого подключения. "Web application" требует фиксированный список redirect URI — случайный порт не совпадёт → ошибка. "Desktop app" автоматически принимает loopback-перенаправления независимо от порта.',
      },
      {
        title: 'Вставьте Client ID + Client Secret в эту панель + Сохранить',
        detail:
          'Два поля: "OAuth Client ID" (...apps.googleusercontent.com) и "OAuth Client Secret" (GOCSPX-...). Сохранить.',
      },
      {
        title: 'Нажмите «Подключить» — откроется браузер',
        detail:
          'После сохранения на карточке появится кнопка «Подключить». Нажмите → экран согласия Google откроется в браузере по умолчанию.',
      },
      {
        title: 'Войдите с аккаунтом Google, добавленным как тестовый пользователь',
        detail:
          'В выборе аккаунта укажите e-mail, добавленный в тестовые пользователи. "Continue" → предупреждение "Google hasn\'t verified this app" (ожидаемо в режиме тестирования). "Advanced" → "Go to FreeCrawl Local (unsafe)" → примите разрешения → Allow.',
      },
      {
        title: 'Вернитесь в FreeCrawl — должно появиться «Настроено»',
        detail:
          'Карточка Search Console в Настройках теперь показывает зелёный значок «Настроено». Можно перейти на верхнюю вкладку "Search Console", чтобы получить список ресурсов + данные.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 access_denied"',
        solution:
          'Вы не добавили тестового пользователя или входите не с тем аккаунтом Google. Вернитесь на страницу Audience и проверьте, что используемый аккаунт есть в списке тестовых пользователей. Если у вас несколько аккаунтов Google, посмотрите, какой выбирает окно выбора аккаунта.',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'Либо не был включён Search Console API, ЛИБО на экране согласия OAuth была снята галочка разрешения "View Search Console data for your verified sites". (1) Включите Search Console API (шаг 5), (2) myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → снова нажмите «Подключить» и отметьте все разрешения на экране согласия.',
      },
      {
        problem: '"redirect_uri_mismatch"',
        solution:
          'Неверный тип OAuth-клиента. Удалите клиент на странице Credentials и создайте заново как "Desktop app" (шаг 7). "Web application" для этого потока никогда не заработает.',
      },
      {
        problem: '"This app isn\'t verified" warning',
        solution:
          'Ожидаемое поведение (приложение в режиме тестирования + чувствительная область доступа). Нажмите "Advanced" → "Go to <app> (unsafe)", чтобы продолжить. Приложение в режиме тестирования пускает только тестовых пользователей — это безопасно.',
      },
      {
        problem: 'Connection broke after 7 days',
        solution:
          'В режиме тестирования refresh-токены OAuth истекают каждые 7 дней. Настройки → Интеграции → Search Console → «Отключить» → «Подключить» для повторной авторизации. Чтобы избавиться от истечения, нужно провести приложение через проверку Google (1-4 недели).',
      },
    ],
    notes: [
      'Ресурсы, которыми вы владеете (sc-domain:example.com или https://example.com/), включают все сайты, подтверждённые вашим аккаунтом.',
      'Данные GSC запаздывают на ~2 дня — сегодняшние клики появятся не сразу.',
      'Бесплатная квота: 1200 запросов/мин, 25 000 запросов/день — в обычной работе вы её не достигнете.',
    ],
    lastReviewed: '2026-06-01',
  },
  ga4: {
    intro:
      'Получайте метрики GA4 по URL (сеансы, пользователи, показатель отказов, вовлечённость, конверсии). «Принесите свой клиент» — используется ваш собственный OAuth-клиент GCP.',
    prereqs: [
      'Аккаунт Google с правами не ниже Читателя на подключаемом ресурсе GA4.',
      'Можно ПОВТОРНО ИСПОЛЬЗОВАТЬ OAuth-клиент, созданный для GSC — просто включите нужные API.',
    ],
    steps: [
      {
        title: 'Если GSC уже настроен: ИСПОЛЬЗУЙТЕ тот же OAuth-клиент',
        detail:
          'Если Search Console уже настроен, можно использовать тот же проект Google Cloud и те же OAuth Client ID + Secret. Пересоздавать не нужно — просто включите API ниже и вставьте учётные данные сюда.',
      },
      {
        title: 'Включите ОБА API GA4',
        detail:
          'GA4 нужны два разных API:\n\n1. Google Analytics Admin API (для списка ресурсов)\n2. Google Analytics Data API (для самих отчётов)\n\nЕсли не включить оба, будут ошибки "API not enabled".',
        link: {
          label: 'Admin API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com',
        },
      },
      {
        title: 'Включите и Data API',
        link: {
          label: 'Data API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
        },
      },
      {
        title: 'Вставьте те же Client ID + Secret, что использовали для GSC',
        detail:
          'Если GSC уже подключён, возможно, даже вставлять не придётся — карточки могут делить учётные данные. Если настраиваете GA4 с нуля, скопируйте ID/Secret из клиента GSC в эту панель.',
      },
      {
        title: '«Подключить» → войдите через Google + подтвердите область GA4',
        detail:
          'Войдите с аккаунтом Google, добавленным как тестовый пользователь. На экране согласия убедитесь, что отмечено разрешение "Google Analytics: View Google Analytics property data".',
      },
      {
        title: 'Список ресурсов + загрузка во вкладке GA4',
        detail:
          'Перейдите на верхнюю вкладку "GA4" → "List Properties" покажет все ресурсы GA4, доступные аккаунту → выберите один → выберите окно (7/28/90 дней) → "Fetch". GA4 почти в реальном времени, результаты появляются сразу.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Google Analytics Admin API has not been used in project X"',
        solution:
          'Admin API не включён. Откройте ссылку из шага 2 → Enable. Подождите 30 с, повторите. Дальше будет та же ошибка для Data API — откройте ссылку из шага 3 и включите его тоже.',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'Область OAuth не покрывает GA4. Перейдите на myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → снова нажмите «Подключить» → отметьте галочку разрешения Google Analytics.',
      },
      {
        problem: 'Property list comes back empty',
        solution:
          'У подключённого аккаунта Google нет роли ни на одном ресурсе GA4. Панель GA4 → Admin → Property Access Management → убедитесь, что у вашего e-mail есть хотя бы Читатель.',
      },
    ],
    notes: [
      'Данные GA4 почти в реальном времени — сегодняшние появляются в течение 4-24 часов.',
      'Бесплатная квота: 200K запросов/день, 50 запросов/мин на ресурс.',
    ],
    lastReviewed: '2026-06-01',
  },
  sheets: {
    intro:
      'Экспортируйте результаты сканирования прямо в Google Таблицу. Лучше, чем «скачать CSV → открыть в Excel», когда вы работаете с коллегами в общем живом документе.',
    prereqs: ['Аккаунт Google.', 'Можно ПОВТОРНО ИСПОЛЬЗОВАТЬ OAuth-клиент, созданный для GSC.'],
    steps: [
      {
        title: 'Если настроены GSC/GA4: ИСПОЛЬЗУЙТЕ тот же OAuth-клиент',
        detail: 'Вставьте те же OAuth Client ID + Secret (или они уже могут быть сохранены).',
      },
      {
        title: 'Включите Google Sheets API',
        link: {
          label: 'Sheets API → Enable',
          url: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
        },
      },
      {
        title: 'Включите и Google Drive API',
        detail: 'Sheets API также требует область Drive для создания/чтения таблиц.',
        link: {
          label: 'Drive API → Enable',
          url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
        },
      },
      {
        title: 'Вставьте Client ID + Secret + Сохранить',
      },
      {
        title: '«Подключить» → подтвердите Sheets + Drive на экране согласия',
        detail:
          'Поток OAuth покажет два разрешения:\n• See, edit, create, and delete all your Google Sheets spreadsheets\n• See, edit, create, and delete only the specific Google Drive files used with this app\nОтметьте оба.',
      },
      {
        title: 'Проверьте через меню Экспорт',
        detail:
          'Файл → Экспорт → «Экспорт в Google Таблицы». Новая таблица создаётся автоматически, URL копируется в буфер обмена.',
      },
    ],
    troubleshooting: [
      {
        problem: '"insufficient authentication scopes"',
        solution:
          'При подключении вы не отметили галочку разрешения Drive. Отключите + подключите заново, отметив оба разрешения.',
      },
    ],
    notes: [
      'Жёсткий лимит Sheets: 10M ячеек на таблицу — крупные сканирования (>500K URL) разбиваются.',
      'Область Drive — "drive.file": доступны только файлы, созданные FreeCrawl, а не ваши существующие файлы.',
    ],
    lastReviewed: '2026-06-01',
  },
  bigquery: {
    intro:
      'Передавайте данные сканирования напрямую в набор данных BigQuery. Удобно для накопления датированных снимков в хранилище данных и визуализации трендов сканирования в BI-инструменте (Looker Studio, Tableau, Metabase).',
    prereqs: [
      'Проект Google Cloud с включённым BigQuery API.',
      'Уже созданный набор данных BigQuery.',
      'JSON сервисного аккаунта (НЕ OAuth — аутентификация сервер-сервер).',
      'Проект GCP с включённой оплатой (бесплатный уровень BigQuery: 10 ГБ хранилища/мес + 1 ТБ запросов/мес; сверх этого платно).',
    ],
    steps: [
      {
        title: 'Создайте набор данных BigQuery',
        detail:
          'Консоль BigQuery → выберите проект → "Create dataset" → ID: "freecrawl_seo" (или любое имя) → Location: "EU" или "US" (важно — потом не изменить) → Create dataset.',
        link: {
          label: 'Консоль BigQuery',
          url: 'https://console.cloud.google.com/bigquery',
        },
      },
      {
        title: 'Создайте сервисный аккаунт',
        detail:
          'IAM & Admin → Service Accounts → "+ Create service account" → имя: "freecrawl-bigquery" → Create and continue.',
        link: {
          label: 'Service Accounts',
          url: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
        },
      },
      {
        title: 'Добавьте роли',
        detail:
          'На шаге 2 "Grant this service account access to project" → добавьте две роли:\n• BigQuery Data Editor\n• BigQuery Job User\nЗатем "Continue" → "Done".',
      },
      {
        title: 'Скачайте JSON-ключ',
        detail:
          'В списке сервисных аккаунтов нажмите на только что созданный → вкладка "Keys" → "Add key" → "Create new key" → Type: JSON → Create.\n\nJSON скачается автоматически. Откройте его в текстовом редакторе и скопируйте всё содержимое.\n\nВНИМАНИЕ: этот JSON содержит все учётные данные — обращайтесь с ним как с паролем. Никогда не добавляйте его в систему контроля версий.',
      },
      {
        title: 'Вставьте его в поле "Service Account JSON" этой панели',
        detail:
          'Вставьте JSON целиком (от открывающей `{` до закрывающей `}`). FreeCrawl хранит JSON в зашифрованном виде в хранилище учётных данных ОС.',
      },
      {
        title: 'Заполните "GCP Project ID"',
        detail:
          'Идентификатор вашего проекта GCP (показан в выпадающем списке слева вверху Cloud Console, например "my-gcp-project-12345"). В JSON тоже есть поле "project_id" — можно скопировать оттуда.',
      },
      {
        title: 'Введите имя набора данных + Сохранить',
        detail: 'Имя набора данных, созданного на шаге 1 (например "freecrawl_seo").',
      },
      {
        title: 'Проверьте через меню Экспорт',
        detail:
          'Файл → Экспорт → «Экспорт в BigQuery» → выберите имя/формат таблицы → запустите. Убедитесь, что таблица появилась в консоли BigQuery.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 PermissionDenied: caller does not have permission"',
        solution:
          'У сервисного аккаунта нет нужных ролей IAM. IAM & Admin → IAM → найдите e-mail сервисного аккаунта → убедитесь, что назначены и "BigQuery Data Editor", и "BigQuery Job User".',
      },
      {
        problem: '"Dataset X not found"',
        solution:
          'Неверное имя набора данных ИЛИ несовпадение расположения (мультирегион "EU" против региона "europe-west1"). Скопируйте точное имя набора данных из консоли BigQuery.',
      },
      {
        problem: '"Invalid JSON"',
        solution:
          'Вы вставили только часть JSON или по краям попал лишний символ. Откройте JSON-файл сервисного аккаунта в настоящем редакторе (рекомендуется VS Code, НЕ Блокнот), Ctrl+A для выделения всего, скопируйте, очистите поле FreeCrawl, вставьте.',
      },
    ],
    notes: [
      'Стоимость: бесплатный уровень BigQuery (10 ГБ хранилища + 1 ТБ запросов/мес) покрывает обычное использование. Сканирование на 1M URL — это ~500 МБ; стоимость запросов зависит от вашего SQL.',
      'Эволюция схемы: FreeCrawl создаёт/обновляет таблицу экспорта автоматически. Если в схеме CrawlUrlRow появятся новые столбцы, таблица экспорта их подхватит (гибкость DDL BigQuery).',
    ],
    lastReviewed: '2026-06-01',
  },
};
