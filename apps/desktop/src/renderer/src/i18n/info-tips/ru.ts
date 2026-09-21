/**
 * Russian InfoTip ([i] tooltip) bodies, keyed by the verbatim English
 * source string. See `../info-tips.ts` for the rationale.
 */

export const RU_INFO_TIPS: Record<string, string> = {
  ["?page=1 / ?page=2 / ?page=4 → flags 'Sequence Break' on every member of the broken cluster."]:
    '?page=1 / ?page=2 / ?page=4 → помечает «Разрыв последовательности» у каждого члена сломанной группы.',
  ['`<a>` elements that look clickable but aren\'t crawlable (no href + onclick, `href="javascript:…"`, or `href="#"` with onclick).']:
    'Элементы `<a>`, которые выглядят кликабельными, но не сканируются (нет href + onclick, `href="javascript:…"` или `href="#"` с onclick).',
  ['`<link rel="amphtml" href="…">` value — the AMP version of this page. Empty when the page does not declare an AMP alternate.']:
    'Значение `<link rel="amphtml" href="…">` — AMP-версия этой страницы. Пусто, если страница не объявляет AMP-альтернативу.',
  ['`<link rel="next" href="…">` value resolved to absolute. Empty when the page is not paginated forward.']:
    'Значение `<link rel="next" href="…">`, приведённое к абсолютному. Пусто, если у страницы нет пагинации вперёд.',
  ['`<link rel="prev" href="…">` value resolved to absolute. Empty when the page is the first in its pagination cluster.']:
    'Значение `<link rel="prev" href="…">`, приведённое к абсолютному. Пусто, если страница — первая в своей группе пагинации.',
  ['`css` runs against the parsed DOM; `regex` runs against raw HTML.']:
    '`css` работает по разобранному DOM; `regex` работает по сырому HTML.',
  ['`none` disables auth; `basic` adds `Authorization: Basic <base64>`; `bearer` adds `Authorization: Bearer <token>`; `digest` performs the RFC 2617 challenge-response on the first 401.']:
    '`none` отключает аутентификацию; `basic` добавляет `Authorization: Basic <base64>`; `bearer` добавляет `Authorization: Bearer <token>`; `digest` выполняет challenge-response по RFC 2617 при первом 401.',
  ['`POST <url>` is fired when the `done` event emits. 10 s timeout. Failures are logged as info events but never break the crawl.']:
    '`POST <url>` отправляется при событии `done`. Тайм-аут 10 с. Ошибки записываются как информационные события, но никогда не прерывают сканирование.',
  ['0 (no duplicates), 7 (member of cluster #7)']: '0 (дубликатов нет), 7 (член кластера № 7)',
  ['0 = auto. 4 for 8GB RAM machines, 8+ for 16GB+.']:
    '0 = авто. 4 для машин с 8 ГБ ОЗУ, 8+ для 16 ГБ и более.',
  ["0 default; 250 ms when a host returns 429 with a 'too fast' message."]:
    '0 по умолчанию; 250 мс, если хост возвращает 429 с сообщением «слишком быстро».',
  ['0 for SSR sites, 2000 for typical SPAs, 5000+ for heavy client-rendered apps.']:
    '0 для SSR-сайтов, 2000 для типичных SPA, 5000+ для тяжёлых приложений с клиентским рендерингом.',
  ["0.1 default (Google 'good'); 0 to disable."]:
    '0.1 по умолчанию («хорошо» по Google); 0 — отключить.',
  ['1 = unique, 5 = part of a 5-page near-duplicate group']:
    '1 = уникальна, 5 = входит в группу из 5 почти дублирующихся страниц',
  ['10 (default), 3 for very tight chains, 0 to remove the cap']:
    '10 (по умолчанию), 3 для очень жёстких цепочек, 0 — снять ограничение',
  ['10 covers most sites; 3 limits crawls to top-of-funnel pages only.']:
    '10 покрывает большинство сайтов; 3 ограничивает сканирование только верхними страницами воронки.',
  ['100 default for most audits; 0 to disable the check.']:
    '100 по умолчанию для большинства аудитов; 0 — отключить проверку.',
  ['100 default; 50 for tight on-page link discipline; 0 to disable the issue.']:
    '100 по умолчанию; 50 для строгой дисциплины ссылок на странице; 0 — отключить проблему.',
  ['1000000 (1M) for a full site audit; 5000 for spot checks.']:
    '1000000 (1M) для полного аудита сайта; 5000 для выборочных проверок.',
  ['1024 (1 MB) default; 150 for a lean HTML budget; 0 to disable.']:
    '1024 (1 МБ) по умолчанию; 150 для экономного HTML-бюджета; 0 — отключить.',
  ['1048576 (1 MB) default; 524288 (512 KB) on tight disks; 0 to disable truncation entirely.']:
    '1048576 (1 МБ) по умолчанию; 524288 (512 КБ) при нехватке диска; 0 — полностью отключить усечение.',
  ['10485760 (10 MB) on bandwidth-tight crawls; 0 to download anything.']:
    '10485760 (10 МБ) при ограниченной полосе; 0 — скачивать что угодно.',
  ['1366 = standard laptop, 1920 = full HD desktop, 375 = iPhone width.']:
    '1366 = обычный ноутбук, 1920 = Full HD-десктоп, 375 = ширина iPhone.',
  ['2 default; 0 to record errors immediately without retrying; 5 for unreliable upstreams.']:
    '2 по умолчанию; 0 — фиксировать ошибки сразу без повторов; 5 для ненадёжных серверов.',
  ['20 default; 50 on fast first-party servers; 5 if the site rate-limits or returns 429s.']:
    '20 по умолчанию; 50 на быстрых собственных серверах; 5, если сайт ограничивает частоту или возвращает 429.',
  ['20 for typical sites; 5 to be polite on shared hosting; 60+ when crawling your own infra.']:
    '20 для типичных сайтов; 5 — из вежливости на общем хостинге; 60+ при сканировании собственной инфраструктуры.',
  ['20000 (20 s) for typical use; 5000 for fast spot checks; 60000 for slow APIs.']:
    '20000 (20 с) для обычного использования; 5000 для быстрых проверок; 60000 для медленных API.',
  ['2048 (≈2 GB) on a 4 GB laptop; 8192 on a 16 GB workstation; 0 to disable.']:
    '2048 (≈2 ГБ) на ноутбуке с 4 ГБ; 8192 на рабочей станции с 16 ГБ; 0 — отключить.',
  ['2048 default (RFC-suggested practical ceiling).']:
    '2048 по умолчанию (практический потолок, рекомендованный RFC).',
  ["2500 default (Google 'good'); 0 to disable."]:
    '2500 по умолчанию («хорошо» по Google); 0 — отключить.',
  ['3 = recommended; 5 catches looser duplicates (templated content with light variation); 0 turns the post-crawl pass off.']:
    '3 = рекомендуется; 5 ловит более свободные дубликаты (шаблонный контент с небольшими вариациями); 0 выключает проход после сканирования.',
  ['4 default; 6 on documentation sites with deep TOC trees; 0 to disable.']:
    '4 по умолчанию; 6 на сайтах документации с глубокими оглавлениями; 0 — отключить.',
  ['500 default. Bump to 2000 when retrying against a flaky API.']:
    '500 по умолчанию. Поднимите до 2000 при повторах к нестабильному API.',
  ['50000 keeps RAM bounded during big sitemap fan-outs; 0 for typical crawls.']:
    '50000 держит ОЗУ в рамках при больших разворотах sitemap; 0 для обычных сканирований.',
  ['60000 (1 minute) for huge resources; 0 to rely solely on the fetch timeout.']:
    '60000 (1 минута) для огромных ресурсов; 0 — полагаться только на тайм-аут запроса.',
  ['64-bit SimHash + LSH bucketing + Union-Find clustering on body shingles. Most expensive pass — typical 5–10 s on a 100k crawl.']:
    '64-битный SimHash + LSH-бакетинг + кластеризация Union-Find по шинглам тела. Самый дорогой проход — обычно 5–10 с на сканировании в 100k.',
  ['768 = standard laptop, 1080 = full HD desktop, 667 = iPhone 8 height.']:
    '768 = обычный ноутбук, 1080 = Full HD-десктоп, 667 = высота iPhone 8.',
  ['800 default; 200 for CDN-backed static; 0 to disable.']:
    '800 по умолчанию; 200 для статики за CDN; 0 — отключить.',
  ['Aborts @font-face / Google Fonts / WOFF2 requests. FOUT visible but text still renders.']:
    'Прерывает запросы @font-face / Google Fonts / WOFF2. Виден FOUT, но текст всё равно отрисовывается.',
  ['Aborts <img>, <picture>, background-image requests. Recommended for SEO crawls — image metadata still comes from <img> tag attributes.']:
    'Прерывает запросы <img>, <picture> и background-image. Рекомендуется для SEO-сканирований — метаданные изображений всё равно берутся из атрибутов тега <img>.',
  ['Aborts <video> / <audio> sources. Page DOM still includes the <video> tag.']:
    'Прерывает источники <video> / <audio>. В DOM страницы тег <video> остаётся.',
  ['Aborts all <script> requests. This defeats the purpose of JS rendering — use Text Only mode instead.']:
    'Прерывает все запросы <script>. Это лишает смысла JS-рендеринг — используйте вместо этого режим «Только текст».',
  ['Aborts external CSS. Inline styles still load. WARNING: many SPAs use CSS-driven visibility / lazy classes — blocking CSS may hide content that JS depends on.']:
    'Прерывает внешний CSS. Инлайновые стили по-прежнему загружаются. ВНИМАНИЕ: многие SPA управляют видимостью / lazy-классами через CSS — блокировка CSS может скрыть контент, от которого зависит JS.',
  ['Aborts requests whose total lifetime (connect + headers + body) exceeds this. Distinct from `requestTimeoutMs` which is the headers timeout. Useful for capping individual slow pages without lowering the overall fetch timeout.']:
    'Прерывает запросы, чьё общее время (соединение + заголовки + тело) превышает это значение. Отличается от `requestTimeoutMs`, который является тайм-аутом заголовков. Полезно, чтобы ограничить отдельные медленные страницы, не снижая общий тайм-аут запроса.',
  ['Absolute redirect target parsed from the meta-refresh content. Empty when meta-refresh sets only a delay.']:
    'Абсолютная цель перенаправления, извлечённая из content мета-обновления. Пусто, если meta-refresh задаёт только задержку.',
  ['Literal target of a JavaScript redirect found in an inline script (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Followed when "Follow JavaScript redirects" is on.']:
    'Литеральная цель JavaScript-редиректа, найденного во встроенном скрипте (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Переход выполняется, если включено «Следовать JavaScript-редиректам».',
  ['Additional time to wait after the chosen wait condition fires, for SPA hydration / late XHRs. 0 = no extra wait. Bounded by the request timeout.']:
    'Дополнительное ожидание после срабатывания выбранного условия — для гидратации SPA / поздних XHR. 0 = без дополнительного ожидания. Ограничено тайм-аутом запроса.',
  ['Anchor text of the broken link as rendered in the source page.']:
    'Текст анкора битой ссылки в том виде, как он отображён на исходной странице.',
  ['Audits the rendered DOM for WCAG AA colour-contrast failures (4.5:1 normal text, 3:1 large text) and stylesheet rules that suppress the keyboard focus outline without a :focus-visible fallback. Surfaces the Low-Contrast Text and Focus Outline Suppressed issue filters.']:
    'Проверяет отрендеренный DOM на нарушения контраста WCAG AA (4.5:1 для обычного текста, 3:1 для крупного) и правила стилей, подавляющие контур фокуса клавиатуры без запасного :focus-visible. Питает фильтры проблем «Текст с низким контрастом» и «Подавлен контур фокуса».',
  ['basic/digest for /staging behind nginx; bearer for protected APIs']:
    'basic/digest для /staging за nginx; bearer для защищённых API',
  ['Below Normal while you keep working in other apps; Idle for overnight unattended runs.']:
    'Ниже обычного, пока вы работаете в других приложениях; Простой для ночных запусков без присмотра.',
  ['BFS click depth from the start URL. Start URL = 0; its outlinks = 1; etc. High depth often correlates with low importance.']:
    'Глубина кликов BFS от стартового URL. Стартовый URL = 0; его исходящие ссылки = 1; и т. д. Большая глубина часто коррелирует с низкой важностью.',
  ['Bodies over this are truncated and flagged. 1 MB covers the 99.9th percentile of HTML pages without letting one adversarial 50 MB page bloat the project file.']:
    'Тела больше этого размера усекаются и помечаются. 1 МБ покрывает 99,9-й процентиль HTML-страниц, не давая одной вредоносной странице в 50 МБ раздуть файл проекта.',
  ['Buy Affordable Game Keys | Example Store']: 'Купить недорогие ключи игр | Магазин-пример',
  ['Character count of the first H1.']: 'Число символов первого H1.',
  ['Character count of the meta description. Recommended: 70–155 characters; over 155 risks truncation.']:
    'Число символов мета-описания. Рекомендуется: 70–155 символов; свыше 155 — риск усечения.',
  ['Character count of the title. Recommended: 30–60 characters; over 60 risks truncation in SERPs.']:
    'Число символов заголовка. Рекомендуется: 30–60 символов; свыше 60 — риск усечения в выдаче.',
  ['Charikar 64-bit SimHash of body shingles. Used by the post-crawl near-duplicate clustering pass. Two SimHashes within the configured Hamming threshold are considered similar.']:
    '64-битный SimHash Чарикара по шинглам тела. Используется проходом кластеризации почти дубликатов после сканирования. Два SimHash в пределах настроенного порога Хэмминга считаются похожими.',
  ['Coarse content classification derived from URL extension and Content-Type header.']:
    'Грубая классификация контента по расширению URL и заголовку Content-Type.',
  ['Comma-joined sorted unique JSON-LD `@type` values declared on the page (Article, BreadcrumbList, Product, …).']:
    'Уникальные значения JSON-LD `@type`, объявленные на странице, отсортированные и объединённые запятыми (Article, BreadcrumbList, Product, …).',
  ['Contents of the first <meta name="description"> tag. May be used as the SERP snippet.']:
    'Содержимое первого тега <meta name="description">. Может использоваться как сниппет в выдаче.',
  ['Contents of the first <meta name="robots"> tag. Controls per-page indexing/following behaviour.']:
    'Содержимое первого тега <meta name="robots">. Управляет индексацией/переходом по ссылкам для страницы.',
  ['Contents of the first <title> element. Google primarily uses this in SERP titles.']:
    'Содержимое первого элемента <title>. Google в основном использует его для заголовков в выдаче.',
  ['Counts how many internal pages link to each URL. Drives the Most-Linked URLs report and the per-row Inlinks column.']:
    'Подсчитывает, сколько внутренних страниц ссылаются на каждый URL. Питает отчёт «Самые ссылаемые URL» и колонку «Входящие ссылки» в каждой строке.',
  ["Crawl 3xx redirect targets. Each hop is its own row; the chain is reconstructed in the Response Codes view. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced)."]:
    "Сканировать цели 3xx-перенаправлений. Каждый переход — отдельная строка; цепочка восстанавливается в представлении «Коды ответов». Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced).",
  ['Crawler RSS auto-pauses the queue when this is exceeded; resumes once memory drops to 80% of the cap. Soft cap — does not enforce a hard heap limit.']:
    'При превышении этого значения RSS краулера автоматически ставит очередь на паузу; возобновляет, когда память опускается до 80 % от лимита. Мягкий лимит — жёсткое ограничение кучи не применяется.',
  ['css for selectors, regex for free-form patterns']:
    'css для селекторов, regex для произвольных шаблонов',
  ["CSS selector that pins the duplicate-fingerprint text extraction to a specific page region. When set, the heuristic (main / role=main / article / body-minus-chrome) is bypassed and the selector wins. Useful on sites where the heuristic misclassifies — e.g. CMSes that wrap navigation inside `<main>` or sites with no semantic landmarks at all. Empty = use the heuristic. Invalid selectors silently fall back to the heuristic so a typo doesn't break the crawl."]:
    'CSS-селектор, ограничивающий извлечение текста для отпечатка дубликатов конкретной областью страницы. Если задан, эвристика (main / role=main / article / body-минус-обвязка) обходится и побеждает селектор. Полезно на сайтах, где эвристика ошибается — например, CMS, оборачивающие навигацию в `<main>`, или сайты вовсе без семантических ориентиров. Пусто = использовать эвристику. Некорректные селекторы молча откатываются к эвристике, чтобы опечатка не сломала сканирование.',
  ["Cumulative Layout Shift from PageSpeed Insights, when present. Google's 'good' CLS threshold is 0.1. Unitless; accepts decimals. Pages without PSI data are never flagged."]:
    'Cumulative Layout Shift из PageSpeed Insights, если есть. Порог «хорошо» для CLS по Google — 0.1. Без единиц; допускает десятичные. Страницы без данных PSI никогда не помечаются.',
  ['Drives the View Source detail tab. ~30–200 KB on disk per HTML page; turn off if you only need metadata and not full source viewing.']:
    'Питает вкладку деталей «Исходный код». ~30–200 КБ на диске на HTML-страницу; отключите, если нужны только метаданные, а не просмотр полного исходника.',
  ["Each rule runs JavaScript RegExp.replace on the fully-normalised URL. Flags default to 'g'. After all rules run, the result is re-parsed as a URL — if the rewrite produces an invalid URL, the link is dropped at normalisation time."]:
    "Каждое правило выполняет JavaScript RegExp.replace над полностью нормализованным URL. Флаги по умолчанию — 'g'. После всех правил результат заново разбирается как URL — если переписывание даёт некорректный URL, ссылка отбрасывается на этапе нормализации.",
  ["Empty = safest. 'chrome' if you want the same Chrome version your users see."]:
    "Пусто = безопаснее всего. 'chrome', если нужна та же версия Chrome, что у ваших пользователей.",
  ["Empty = use the bundled Playwright Chromium build (recommended — pinned version, works everywhere). 'chrome' / 'msedge' uses the system-installed browser. Beta channels for testing newer features."]:
    "Пусто = использовать встроенную сборку Chromium из Playwright (рекомендуется — зафиксированная версия, работает везде). 'chrome' / 'msedge' использует браузер, установленный в системе. Бета-каналы — для тестирования новых функций.",
  ["Fetch internal <img> resources (incl. srcset / <picture> sources) so they appear in the Internal tab with their own status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl)."]:
    "Загружать внутренние ресурсы <img> (включая srcset / источники <picture>), чтобы они появлялись во вкладке «Внутренние» со своим кодом состояния, типом контента и размером. Каждый засчитывается в «Макс. URL». Screaming Frog: 'Check Images' (Configuration → Spider → Crawl).",
  ["Fetch internal <link rel=stylesheet> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl)."]:
    "Загружать внутренние ресурсы <link rel=stylesheet>, чтобы они появлялись во вкладке «Внутренние» с кодом состояния, типом контента и размером. Каждый засчитывается в «Макс. URL». Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl).",
  ["Fetch internal <script src> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl)."]:
    "Загружать внутренние ресурсы <script src>, чтобы они появлялись во вкладке «Внутренние» с кодом состояния, типом контента и размером. Каждый засчитывается в «Макс. URL». Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl).",
  ["Fetches /robots.txt sitemap directives + /sitemap.xml fallbacks. Powers the 'Non-Indexable in Sitemap' issue filter. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl)."]:
    "Получает директивы sitemap из /robots.txt + запасные /sitemap.xml. Питает фильтр проблем «Неиндексируемый в sitemap». Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl).",
  ["first/last for single value, all for JSON array, concat for ' | ' joined string"]:
    "first/last для одного значения, all для JSON-массива, concat для строки, объединённой через ' | '",
  ['FNV-1a 64-bit hash of the normalised body token stream. Two pages sharing this hash are byte-identical post-tokenisation — the basis of the Exact Duplicate filter.']:
    '64-битный хэш FNV-1a нормализованного потока токенов тела. Две страницы с одинаковым хэшем побайтово идентичны после токенизации — основа фильтра «Точный дубликат».',
  ['For Basic, sent base64-encoded; for Digest, hashed into the challenge response.']:
    'Для Basic отправляется в base64; для Digest хэшируется в ответ на challenge.',
  ['For regex: `regex_group` extracts capture group 1; otherwise the whole match is used.']:
    'Для regex: `regex_group` извлекает группу захвата 1; иначе используется всё совпадение.',
  ['Full-page renders the entire scrollable canvas; Above-the-fold captures just the initial viewport (cheaper). Both writes two PNGs per URL.']:
    '«Вся страница» рендерит весь прокручиваемый холст; «Первый экран» захватывает только начальный вьюпорт (дешевле). Оба пишут два PNG на URL.',
  ['Google\'s index status, pulled from the URL Inspection API — not the Fetch button. Click "Inspect (top 100)" to fill this column; Fetch only pulls clicks / impressions / position.']:
    'Статус индексации Google, полученный через API URL Inspection — не кнопкой «Получить». Нажмите «Проверить (топ-100)», чтобы заполнить эту колонку; «Получить» подтягивает только клики / показы / позицию.',
  ["Googlebot — Smartphone matches Google's mobile-first indexing crawler."]:
    'Googlebot — Smartphone соответствует mobile-first краулеру индексации Google.',
  ['Hard cap on pending URLs held in memory. Excess discoveries are dropped silently — bounds peak heap during fan-out bursts (big sitemaps, dense link graphs).']:
    'Жёсткий лимит ожидающих URL в памяти. Лишние находки молча отбрасываются — ограничивает пиковую кучу при взрывном росте (большие sitemap, плотные графы ссылок).',
  ['Hard cap on the number of 3xx hops we follow for a single chain. Each hop is recorded as its own URL row regardless. 0 disables the cap (chain still ends at `redirect_loop`).']:
    'Жёсткий лимит числа 3xx-переходов в одной цепочке. Каждый переход всё равно записывается отдельной строкой URL. 0 снимает лимит (цепочка всё равно заканчивается на `redirect_loop`).',
  ["Hard cap on total URLs crawled. The crawl stops as soon as this is reached. Screaming Frog: 'Limit Crawl Total'."]:
    "Жёсткий лимит общего числа просканированных URL. Сканирование останавливается сразу по достижении. Screaming Frog: 'Limit Crawl Total'.",
  ["Hard ceiling on requests per second across all workers combined. Equivalent to Screaming Frog's 'Max URL/s'. Acts as a token bucket — even with high concurrency the crawler waits between bursts to stay below this rate."]:
    "Жёсткий потолок запросов в секунду по всем воркерам вместе. Эквивалент 'Max URL/s' в Screaming Frog. Работает как token bucket — даже при высокой параллельности краулер выжидает между всплесками, чтобы оставаться ниже этой частоты.",
  ['Height attribute value (in pixels) declared on the <img> tag, when present.']:
    'Значение атрибута height (в пикселях), объявленное на теге <img>, если есть.',
  ["Honor Disallow rules + crawl-delay declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "Соблюдать правила Disallow + crawl-delay из /robots.txt для настроенного User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt).",
  ["Hop count from the start URL. Start URL is depth 0; its outlinks are depth 1, theirs depth 2, and so on. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits)."]:
    "Число переходов от стартового URL. Стартовый URL — глубина 0; его исходящие ссылки — глубина 1, их ссылки — глубина 2 и т. д. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits).",
  ['How many distinct pages reference this image. High values typically indicate site-wide assets (logos, icons).']:
    'Сколько разных страниц ссылаются на это изображение. Большие значения обычно означают общесайтовые ресурсы (логотипы, иконки).',
  ["How to canonicalise paths with/without a trailing slash. 'Add' is file-extension aware — won't add a slash to /file.pdf or /image.png."]:
    'Как канонизировать пути с завершающим слэшем и без. «Добавить» учитывает расширение файла — не добавит слэш к /file.pdf или /image.png.',
  ['HTML attribute name to read.']: 'Имя HTML-атрибута для чтения.',
  ['HTML transfer size of the page document. Heavy HTML payloads delay first paint. Stored as bytes internally; entered here in kilobytes.']:
    'Размер передачи HTML-документа страницы. Тяжёлый HTML задерживает первую отрисовку. Внутри хранится в байтах; здесь вводится в килобайтах.',
  ['HTTP `<img>` / `<video>` / `<audio>` / `<source>` references on an HTTPS page — rendered but the URL bar reads "Not Secure".']:
    'HTTP-ссылки `<img>` / `<video>` / `<audio>` / `<source>` на HTTPS-странице — отрисовываются, но в адресной строке «Не защищено».',
  ['HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` references on an HTTPS page — browsers BLOCK these silently.']:
    'HTTP-ссылки `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` на HTTPS-странице — браузеры молча их БЛОКИРУЮТ.',
  ['HTTP response status code. Empty/Failed indicates a network error before any response was received.']:
    'Код состояния HTTP-ответа. Пусто/Ошибка означает сетевую ошибку до получения какого-либо ответа.',
  ['HTTP status of the source page itself. Usually 200; if non-2xx the broken link may be inherited.']:
    'HTTP-статус самой исходной страницы. Обычно 200; если не 2xx, битая ссылка может быть унаследована.',
  ['HTTP status returned by the target. 0 = network failure (DNS, TLS, timeout).']:
    'HTTP-статус, возвращённый целью. 0 = сетевой сбой (DNS, TLS, тайм-аут).',
  ["HTTP/HTTPS proxies route via undici's ProxyAgent; SOCKS proxies (socks5://, socks5h://, socks4://, socks4a://) tunnel via the socks client. The `h`/`4a` variants resolve DNS at the proxy. Leave empty to inherit HTTPS_PROXY/HTTP_PROXY env vars."]:
    'HTTP/HTTPS-прокси идут через ProxyAgent из undici; SOCKS-прокси (socks5://, socks5h://, socks4://, socks4a://) туннелируются через socks-клиент. Варианты `h`/`4a` резолвят DNS на прокси. Оставьте пустым, чтобы наследовать переменные окружения HTTPS_PROXY/HTTP_PROXY.',
  ["Identifies the largest element visible in the initial viewport (likely LCP candidate per Google's heuristic) and stores its CSS selector, dimensions, and resource URL. Useful for spotting unoptimised LCP images without a PSI API call."]:
    'Определяет самый крупный элемент, видимый в начальном вьюпорте (вероятный кандидат LCP по эвристике Google), и сохраняет его CSS-селектор, размеры и URL ресурса. Полезно для поиска неоптимизированных LCP-изображений без обращения к API PSI.',
  ['If set, Playwright waits for this CSS selector to appear in the DOM before extracting HTML. Overrides the extra-wait timeout when present. Useful when you know the SPA reveals a specific element after hydration.']:
    'Если задано, Playwright ждёт появления этого CSS-селектора в DOM перед извлечением HTML. При наличии переопределяет тайм-аут дополнительного ожидания. Полезно, когда вы знаете, что SPA показывает конкретный элемент после гидратации.',
  ['Images on this page that have no alt attribute. WCAG accessibility issue + missed alt-as-anchor SEO opportunity.']:
    'Изображения на этой странице без атрибута alt. Проблема доступности WCAG + упущенная SEO-возможность использовать alt как анкор.',
  ['Indexable / Non-Indexable']: 'Индексируемая / Неиндексируемая',
  ['Internal PageRank, 0–100. Computed over the internal link graph (damping 0.85) and normalised so the most-linked page scores 100. Higher = more internal link equity.']:
    'Внутренний PageRank, 0–100. Считается по графу внутренних ссылок (затухание 0.85) и нормализуется так, что самая ссылаемая страница получает 100. Выше = больше внутреннего ссылочного веса.',
  ['internal / external']: 'внутренняя / внешняя',
  ['JavaScript executed in every page BEFORE navigation begins (init script). Use to set localStorage / cookies / mock APIs / disable animations. Runs in page context — no Node access.']:
    'JavaScript, выполняемый на каждой странице ДО начала навигации (init-скрипт). Используйте для задания localStorage / cookie / подмены API / отключения анимаций. Работает в контексте страницы — доступа к Node нет.',
  ['JavaScript regex (no flags — /g is implicit). Use a capture group with `output=regex_group` to extract just part of the match.']:
    'JavaScript-регулярное выражение (без флагов — /g подразумевается). Используйте группу захвата с `output=regex_group`, чтобы извлечь только часть совпадения.',
  ['JavaScript regex tested against the full URL. Empty = all URLs allowed. URL must match at least one to be enqueued. The start URL is always permitted regardless.']:
    'JavaScript-регулярное выражение, проверяемое по полному URL. Пусто = разрешены все URL. Чтобы попасть в очередь, URL должен совпасть хотя бы с одним. Стартовый URL разрешён всегда.',
  ['JavaScript regex. Any match → URL is skipped, even if it would otherwise pass the include list. Common uses: skip admin areas, large file types, session-id query params.']:
    'JavaScript-регулярное выражение. Любое совпадение → URL пропускается, даже если он прошёл бы список включения. Типичное применение: пропуск админ-разделов, крупных типов файлов, параметров session-id в запросе.',
  ['JSON map of `{ term: count }` literal-substring hits from the configured Custom Search terms.']:
    'JSON-карта `{ term: count }` литеральных подстроковых совпадений настроенных терминов «Пользовательского поиска».',
  ['JSON-stringified array of `{ lang, href }` pairs. Heavy column — better consumed via the URL Details panel.']:
    'JSON-сериализованный массив пар `{ lang, href }`. Тяжёлая колонка — удобнее смотреть в панели «Детали URL».',
  ['JSON-stringified custom-extraction results map. Heavy column — render verbatim, easier to read in the URL Details panel.']:
    'JSON-сериализованная карта результатов пользовательского извлечения. Тяжёлая колонка — выводится как есть, удобнее читать в панели «Детали URL».',
  ['JSONPath against a JSON response body (e.g. `application/json` APIs). Only runs on responses that parse as JSON — ignored on HTML pages.']:
    'JSONPath по телу JSON-ответа (например, API `application/json`). Выполняется только для ответов, разбираемых как JSON — на HTML-страницах игнорируется.',
  ['JSONPath returns the matched JSON value as-is; choose `Count` to return the number of matches instead.']:
    'JSONPath возвращает совпавшее JSON-значение как есть; выберите `Count`, чтобы вместо этого вернуть число совпадений.',
  ["Largest Contentful Paint from PageSpeed Insights lab data, when the URL has been audited. Google's 'good' LCP threshold is 2500 ms. Pages without PSI data are never flagged on this metric."]:
    'Largest Contentful Paint из лабораторных данных PageSpeed Insights, если URL был проверен. Порог «хорошо» для LCP по Google — 2500 мс. Страницы без данных PSI по этой метрике никогда не помечаются.',
  ['load = good default. networkidle for heavy SPAs. domcontentloaded if you only need raw HTML.']:
    'load = хороший вариант по умолчанию. networkidle для тяжёлых SPA. domcontentloaded, если нужен только сырой HTML.',
  ['Location header value when status is 3xx. The URL the server points to next; chain length is in the URL Details panel.']:
    'Значение заголовка Location при статусе 3xx. URL, куда сервер указывает далее; длина цепочки — в панели «Детали URL».',
  ['Lowercases the URL path component. Host is already case-insensitive per the URL spec, so this only affects the path.']:
    'Переводит компонент пути URL в нижний регистр. Хост по спецификации URL и так регистронезависим, поэтому это затрагивает только путь.',
  ['Near-duplicate cluster ID assigned by the post-crawl SimHash pass. 0 = singleton (no near-duplicates within the configured Hamming threshold). Pages sharing a non-zero cluster ID are mutually similar.']:
    'ID кластера почти дубликатов, присвоенный проходом SimHash после сканирования. 0 = одиночка (нет почти дубликатов в пределах настроенного порога Хэмминга). Страницы с одним ненулевым ID кластера взаимно похожи.',
  ['noindex, canonicalised, redirected, blocked-by-robots']:
    'noindex, канонизирована, перенаправлена, заблокирована robots',
  ['None for fastest crawl. Above-the-fold for SERP-thumbnail-style preview. Full page when you need long-page snapshots.']:
    'Нет — для самого быстрого сканирования. «Первый экран» — для превью в стиле миниатюры выдачи. «Вся страница» — когда нужны снимки длинных страниц.',
  ['Number of `<form action="http://…">` declarations on an HTTPS page. Submitting one downgrades the connection.']:
    'Число объявлений `<form action="http://…">` на HTTPS-странице. Отправка такой формы понижает защищённость соединения.',
  ['Number of `<link rel="alternate" hreflang>` entries declared on this page. 0 = no alternates declared.']:
    'Число записей `<link rel="alternate" hreflang>`, объявленных на этой странице. 0 = альтернативы не объявлены.',
  ['Number of `<link rel="canonical">` tags on the page. >1 is a "Multiple Canonicals" issue.']:
    'Число тегов `<link rel="canonical">` на странице. >1 — проблема «Несколько canonical».',
  ['Number of `<script type="application/ld+json">` blocks parsed successfully on the page.']:
    'Число блоков `<script type="application/ld+json">`, успешно разобранных на странице.',
  ['Number of `<script type="application/ld+json">` blocks that failed to parse as JSON.']:
    'Число блоков `<script type="application/ld+json">`, которые не удалось разобрать как JSON.',
  ['Number of <img> elements on the page.']: 'Число элементов <img> на странице.',
  ['Number of browser tabs the pool keeps warm in parallel. 0 = auto (matches crawler concurrency, capped at 8). More tabs = faster crawl but more RAM (each tab ~80–150 MB).']:
    'Число вкладок браузера, которые пул держит открытыми параллельно. 0 = авто (равно параллельности краулера, не более 8). Больше вкладок = быстрее сканирование, но больше ОЗУ (каждая вкладка ~80–150 МБ).',
  ['Number of hreflang targets that are non-200, noindex, or canonicalised away. Aggregated by the post-crawl pass.']:
    'Число целей hreflang, которые не отдают 200, имеют noindex или канонизированы в другое место. Агрегируется проходом после сканирования.',
  ["Number of HTTP requests in flight at any one time. Equivalent to Screaming Frog's 'Max Threads'. Higher = faster crawl + more load on the target server."]:
    "Число одновременно выполняемых HTTP-запросов. Эквивалент 'Max Threads' в Screaming Frog. Выше = быстрее сканирование + больше нагрузка на целевой сервер.",
  ['Number of internal `<a>` elements with no usable anchor text or alt — accessibility / SEO regression.']:
    'Число внутренних элементов `<a>` без пригодного текста анкора или alt — регресс доступности / SEO.',
  ['Number of internal pages that link to this URL. A rough internal-PageRank signal.']:
    'Число внутренних страниц, ссылающихся на этот URL. Грубый сигнал внутреннего PageRank.',
  ["Number of pages in this URL's near-duplicate cluster (1 = no duplicates, ≥2 = part of a duplicate group). Tunable via Settings → Duplicates."]:
    'Число страниц в кластере почти дубликатов этого URL (1 = дубликатов нет, ≥2 = входит в группу дубликатов). Настраивается в Настройки → Дубликаты.',
  ['Number of redirect hops from this URL to its terminal target. Filled by the post-crawl `recomputeRedirectChains` walker. >3 trips the "Long Chain" issue.']:
    'Число переходов перенаправления от этого URL до конечной цели. Заполняется обходом `recomputeRedirectChains` после сканирования. >3 вызывает проблему «Длинная цепочка».',
  ['Number of unique <a> links emitted from this page (internal + external).']:
    'Число уникальных ссылок <a>, исходящих с этой страницы (внутренние + внешние).',
  ['Off — only enable for testing edge cases.']:
    'Выкл. — включайте только для тестирования крайних случаев.',
  ['Off — small speed gain not worth the fidelity loss.']:
    'Выкл. — небольшой выигрыш в скорости не стоит потери точности.',
  ['On — fonts add overhead without changing SEO output.']:
    'Вкл. — шрифты добавляют накладные расходы, не меняя SEO-результат.',
  ['On (default) — cheap I/O, high SEO value.']:
    'Вкл. (по умолчанию) — дешёвый ввод-вывод, высокая SEO-ценность.',
  ['On (default) — media is heavy and rarely SEO-relevant.']:
    'Вкл. (по умолчанию) — медиа тяжёлые и редко значимы для SEO.',
  ['On (default) so the Internal tab shows images, not just HTML; off for HTML-only crawls.']:
    'Вкл. (по умолчанию), чтобы во вкладке «Внутренние» были изображения, а не только HTML; выкл. для сканирований только HTML.',
  ['On (default); off for HTML-only crawls.']:
    'Вкл. (по умолчанию); выкл. для сканирований только HTML.',
  ['On (default). Off only when crawling sites you own and need to bypass.']:
    'Вкл. (по умолчанию). Выключайте только при сканировании собственных сайтов, где нужно обойти ограничения.',
  ['On for accessibility / WCAG audits.']: 'Вкл. для аудитов доступности / WCAG.',
  ['On for max speed. Off if you need LCP candidate detection or visual screenshots later.']:
    'Вкл. для максимальной скорости. Выкл., если позже понадобится определение кандидата LCP или визуальные скриншоты.',
  ['On for modern sites that 301 http→https anyway; off for legacy intranet.']:
    'Вкл. для современных сайтов, которые всё равно делают 301 с http на https; выкл. для устаревших интранетов.',
  ['On for normal audits; off when you only want to inspect raw 3xx behaviour.']:
    'Вкл. для обычных аудитов; выкл., если нужно лишь изучить сырое поведение 3xx.',
  ['On for outbound link audits; off for fast internal-only crawls.']:
    'Вкл. для аудитов исходящих ссылок; выкл. для быстрых сканирований только внутренних страниц.',
  ['On for performance-focused audits that should fail pages over a target.']:
    'Вкл. для аудитов производительности, которые должны «проваливать» страницы выше целевого порога.',
  ['On for performance-focused audits.']:
    'Вкл. для аудитов, ориентированных на производительность.',
  ['On for production crawls. Off when debugging selector-not-found / hydration issues.']:
    'Вкл. для рабочих сканирований. Выкл. при отладке проблем «селектор не найден» / гидратации.',
  ['ON for SEO audits (the typical case). Turn OFF to also cluster paginated / canonical-blocked variants for completeness.']:
    'ВКЛ. для SEO-аудитов (типичный случай). ВЫКЛЮЧИТЕ, чтобы для полноты также кластеризовать пагинированные / заблокированные canonical варианты.',
  ["On for SEO audits that include Google's Mobile-Friendly checks."]:
    'Вкл. для SEO-аудитов, включающих проверки Google Mobile-Friendly.',
  ['On for SEO audits where View Source matters; off for 1M-URL crawls where disk is tight.']:
    'Вкл. для SEO-аудитов, где важен «Исходный код»; выкл. для сканирований на 1M URL при нехватке диска.',
  ['ON for SEO audits. OFF only when you specifically need to inspect raw-URL collisions (e.g. case-sensitive filesystem CMSes).']:
    'ВКЛ. для SEO-аудитов. ВЫКЛЮЧАЙТЕ только когда нужно специально изучить коллизии сырых URL (например, CMS на регистрозависимой файловой системе).',
  ['On if you need nofollow attribute audits; off keeps the link graph cleaner.']:
    'Вкл., если нужен аудит атрибута nofollow; выкл. держит граф ссылок чище.',
  ['On if your CMS serves the same page at mixed casing (/Foo and /foo).']:
    'Вкл., если ваша CMS отдаёт одну и ту же страницу в разном регистре (/Foo и /foo).',
  ['On if your site canonicalises to non-www but emits www links somewhere.']:
    'Вкл., если сайт канонизируется на версию без www, но где-то выдаёт ссылки с www.',
  ["On network errors, 408/425/429/5xx responses, retry up to N more times before giving up. Each retry counts toward the URL's response time budget."]:
    'При сетевых ошибках и ответах 408/425/429/5xx повторять до N дополнительных раз, прежде чем сдаться. Каждый повтор засчитывается в бюджет времени ответа URL.',
  ['On when auditing mobile UX or capturing PageSpeed-style mobile previews.']:
    'Вкл. при аудите мобильного UX или для мобильных превью в стиле PageSpeed.',
  ["One header per line in 'Key: Value' format. Added to every request — useful for auth tokens or custom routing hints. User values override defaults when keys collide."]:
    "Один заголовок на строку в формате 'Ключ: Значение'. Добавляется к каждому запросу — полезно для токенов аутентификации или подсказок маршрутизации. Значения пользователя перекрывают значения по умолчанию при совпадении ключей.",
  ['One sitemap URL per line. On top of following links from the start URL, the crawler fetches these sitemaps and queues every page they list as an extra seed — faster/more complete discovery, and reliable orphan detection even when the sitemap lives at a non-standard path. Leave empty to disable.']:
    'Один URL sitemap на строку. Помимо перехода по ссылкам со стартового URL, краулер загружает эти sitemap и ставит каждую перечисленную страницу в очередь как дополнительное зерно — более быстрое/полное обнаружение и надёжный поиск сирот, даже если sitemap лежит по нестандартному пути. Оставьте пустым, чтобы отключить.',
  ['One URL per line. Each is fetched exactly once; outlinks are NOT followed. Comments starting with # are ignored.']:
    'Один URL на строку. Каждый загружается ровно один раз; по исходящим ссылкам переход НЕ выполняется. Комментарии, начинающиеся с #, игнорируются.',
  ['OS scheduler hint applied at crawl start. Lowering priority lets the rest of the machine stay responsive during heavy crawls. May require elevated privileges on some platforms.']:
    'Подсказка планировщику ОС, применяемая при старте сканирования. Понижение приоритета сохраняет отзывчивость остальной системы во время тяжёлых сканирований. На некоторых платформах может требовать повышенных прав.',
  ["Page A→B declared but B→A absent flags 'Reciprocity Missing'; same lang on two hrefs flags 'Inconsistent Lang'."]:
    'Страница A→B объявлена, а B→A отсутствует — помечается «Нет взаимности»; один и тот же lang на двух href — «Несогласованный lang».',
  ['Page that contains the broken link.']: 'Страница, содержащая битую ссылку.',
  ["Pages with > this many outgoing links (internal + external) trip the 'Total Links per Page' issue. Google's historic recommendation is 100; mega-menus/hub-pages routinely blow past this."]:
    'Страницы с числом исходящих ссылок (внутренних + внешних) выше этого значения вызывают проблему «Всего ссылок на странице». Историческая рекомендация Google — 100; мега-меню/хабы регулярно её превышают.',
  ['PASS = indexed · FAIL = not indexed · PART/NEU = discovered but not yet indexed']:
    'PASS = проиндексирована · FAIL = не проиндексирована · PART/NEU = обнаружена, но ещё не проиндексирована',
  ['Pattern: ^https://m\\.(.+) · Replacement: https://www.$1 · Flags: i  (collapse mobile subdomain to www)']:
    'Шаблон: ^https://m\\.(.+) · Замена: https://www.$1 · Флаги: i  (свернуть мобильный поддомен в www)',
  ["Per-request abort threshold. Pages that take longer than this are recorded as network errors. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — that one's in seconds, this is in milliseconds."]:
    "Порог прерывания на запрос. Страницы, отвечающие дольше, записываются как сетевые ошибки. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — там в секундах, здесь в миллисекундах.",
  ['Persist rel="nofollow" links in the link graph. When off, nofollow links are dropped entirely (not counted in outlinks, not probed as externals). Screaming Frog inverse: turning this ON ≈ unchecking "Follow Internal/External Nofollow".']:
    'Сохранять ссылки rel="nofollow" в графе ссылок. Если выключено, nofollow-ссылки отбрасываются полностью (не считаются в исходящих, не проверяются как внешние). Обратное к Screaming Frog: включить это ≈ снять галочку "Follow Internal/External Nofollow".',
  ['Picking a preset fills the User-Agent field below — you can still hand-edit it afterwards. Switch between Googlebot Smartphone / Desktop to compare how a site responds to mobile vs desktop crawlers.']:
    'Выбор пресета заполняет поле User-Agent ниже — потом его всё равно можно править вручную. Переключайтесь между Googlebot Smartphone / Desktop, чтобы сравнить, как сайт отвечает мобильному и десктопному краулеру.',
  ["Picks one of the saved profiles by name. Empty = use the Proxy URL field above (or env vars when that's also empty)."]:
    'Выбирает один из сохранённых профилей по имени. Пусто = использовать поле «URL прокси» выше (или переменные окружения, если и оно пустое).',
  ['Pre-computes Dead External Domain, Duplicate URL post-norm, Canonical Chain Multi-hop. Without this the sidebar shows 0 for those three.']:
    'Предварительно вычисляет «Мёртвый внешний домен», «Дубликат URL после нормализации», «Многошаговая цепочка canonical». Без этого боковая панель показывает 0 для этих трёх.',
  ['After the crawl, re-fetches a sample of indexable pages with the opposite user agent (mobile when the crawl ran as desktop, desktop otherwise) and compares title, H1, meta description, canonical, robots, word count and link count. Differences feed the \'Mobile / Desktop Mismatch\' issue and the report of the same name.']:
    'После обхода повторно загружает выборку индексируемых страниц с противоположным user agent (мобильным, если обход был десктопным, и наоборот) и сравнивает title, H1, meta description, canonical, robots, число слов и ссылок. Различия попадают в проблему «Расхождение мобильной и десктопной версий» и одноимённый отчёт.',
  ['How many pages the mobile-parity probe re-fetches, most-linked first. 0 = every indexable HTML page (doubles the crawl\'s traffic for that set).']:
    'Сколько страниц повторно загружает проверка паритета, сначала самые ссылаемые. 0 = все индексируемые HTML-страницы (удваивает трафик обхода для этого набора).',
  ["Probe outbound links to other hosts (HEAD only) so the Broken Links view catches dead externals. Screaming Frog: 'External Links' (Configuration → Spider → Crawl)."]:
    "Проверять исходящие ссылки на другие хосты (только HEAD), чтобы представление «Битые ссылки» ловило мёртвые внешние. Screaming Frog: 'External Links' (Configuration → Spider → Crawl).",
  ['Raw `Content-Security-Policy` response header. Empty when missing.']:
    'Сырой заголовок ответа `Content-Security-Policy`. Пусто, если отсутствует.',
  ['Raw `content` attribute of `<meta http-equiv="refresh">`, e.g. "5; url=/foo".']:
    'Сырой атрибут `content` из `<meta http-equiv="refresh">`, например "5; url=/foo".',
  ['Raw `Strict-Transport-Security` header. Empty when missing — for HTTPS pages this is a security regression.']:
    'Сырой заголовок `Strict-Transport-Security`. Пусто, если отсутствует — для HTTPS-страниц это регресс безопасности.',
  ['Raw `X-Content-Type-Options` header. `nosniff` blocks MIME sniffing — prevents some XSS via content-type confusion.']:
    'Сырой заголовок `X-Content-Type-Options`. `nosniff` блокирует MIME-сниффинг — предотвращает некоторые XSS через путаницу content-type.',
  ['Raw `X-Frame-Options` header. SAMEORIGIN / DENY / ALLOW-FROM. Clickjacking defence.']:
    'Сырой заголовок `X-Frame-Options`. SAMEORIGIN / DENY / ALLOW-FROM. Защита от кликджекинга.',
  ['Raw value of the Content-Type response header (incl. charset).']:
    'Сырое значение заголовка ответа Content-Type (включая charset).',
  ['Re-renders each page on a mobile viewport and checks viewport meta tag, horizontal overflow, font size legibility, and tap-target spacing. Stores a pass/fail verdict on the urls table.']:
    'Повторно рендерит каждую страницу в мобильном вьюпорте и проверяет мета-тег viewport, горизонтальное переполнение, читаемость размера шрифта и расстояние между целями касания. Сохраняет вердикт «пройдено/не пройдено» в таблице urls.',
  ['Read the full article →']: 'Читать статью полностью →',
  ["Reject-all = ignore Set-Cookie entirely (zero counts on cookie-flag issues). Block-third-party = analyse only first-party cookies (Domain attribute matches the page's registrable domain). Accept-all = analyse every Set-Cookie regardless of scope."]:
    '«Отклонять все» = полностью игнорировать Set-Cookie (нулевые счётчики по проблемам флагов cookie). «Блокировать сторонние» = анализировать только собственные cookie (атрибут Domain совпадает с регистрируемым доменом страницы). «Принимать все» = анализировать каждый Set-Cookie независимо от области.',
  ["Reject-all for stateless audits; Block-third-party to focus on the site's own cookie hygiene; Accept-all to also see ad/analytics tracker cookies."]:
    '«Отклонять все» для аудитов без состояния; «Блокировать сторонние», чтобы сосредоточиться на гигиене cookie самого сайта; «Принимать все», чтобы видеть и cookie рекламных/аналитических трекеров.',
  ["Removes the leading 'www.' from the host at normalisation time. The seen-set, redirect graph, and link extraction all use the rewritten form, so duplicates collapse correctly."]:
    "Убирает ведущий 'www.' из хоста при нормализации. Множество увиденных, граф перенаправлений и извлечение ссылок используют переписанную форму, поэтому дубликаты корректно схлопываются.",
  ['Renders the page a second time on a mobile viewport and stores an above-the-fold PNG. Adds another full render + screenshot per URL.']:
    'Рендерит страницу второй раз в мобильном вьюпорте и сохраняет PNG первого экрана. Добавляет ещё один полный рендер + скриншот на URL.',
  ['Resolved absolute URL of the <img src> attribute.']:
    'Разрешённый абсолютный URL атрибута <img src>.',
  ['Response body size in bytes (compressed transfer size, post-Content-Encoding).']:
    'Размер тела ответа в байтах (сжатый размер передачи, после Content-Encoding).',
  ['Rewrites http:// to https:// before fetching. Breaks HTTP-only sites.']:
    'Переписывает http:// на https:// перед загрузкой. Ломает сайты только на HTTP.',
  ['Run Chromium without a visible window. Turn off to debug rendering visually — useful when a page renders correctly in a normal browser but not under Playwright.']:
    'Запускать Chromium без видимого окна. Выключите, чтобы отлаживать рендеринг визуально — полезно, когда страница корректно рендерится в обычном браузере, но не под Playwright.',
  ['Run the login steps once before the crawl, then replay the session cookies on every request.']:
    'Выполнить шаги входа один раз перед сканированием, затем воспроизводить cookie сессии в каждом запросе.',
  ["Runs iterative PageRank (damping 0.85) over the internal link graph and normalises it to a 0–100 Link Score per page. Drives the Link Score column and the 'By Link Score' visualization colour mode."]:
    'Выполняет итеративный PageRank (затухание 0.85) по графу внутренних ссылок и нормализует его в «Ссылочный балл» 0–100 для каждой страницы. Питает колонку «Ссылочный балл» и режим окраски визуализации «По ссылочному баллу».',
  ['Sends the URL through the same normalisation pipeline used by the crawler, with your unsaved settings applied. Useful for verifying regex rules before kicking off a crawl.']:
    'Пропускает URL через тот же конвейер нормализации, что и краулер, с применением ваших несохранённых настроек. Полезно для проверки regex-правил перед запуском сканирования.',
  ['Sent on every request as the User-Agent header. Identifies the crawler to servers; some sites serve different content based on UA.']:
    'Отправляется в каждом запросе как заголовок User-Agent. Идентифицирует краулер для серверов; некоторые сайты отдают разный контент в зависимости от UA.',
  ['Sent on every request. Affects which locale a multi-lingual site serves you.']:
    'Отправляется в каждом запросе. Влияет на то, какую локаль отдаёт вам многоязычный сайт.',
  ["Sent verbatim as `Bearer <token>`. Don't include the `Bearer ` prefix yourself."]:
    'Отправляется как есть в виде `Bearer <token>`. Не добавляйте префикс `Bearer ` самостоятельно.',
  ['Server response time (a TTFB proxy) measured during the crawl. Pages slower than this are flagged. Google considers a good server response time under 800 ms.']:
    'Время ответа сервера (приближение TTFB), измеренное во время сканирования. Страницы медленнее этого значения помечаются. Google считает хорошим время ответа сервера до 800 мс.',
  ['Shop the latest game keys at unbeatable prices…']:
    'Покупайте новейшие ключи игр по лучшим ценам…',
  ["Skips body parsing for pages whose Content-Length header exceeds this. The page row is still created so links to it aren't lost; only body parsing and source snapshot capture are skipped."]:
    'Пропускает разбор тела для страниц, чей заголовок Content-Length превышает это значение. Строка страницы всё равно создаётся, чтобы ссылки на неё не терялись; пропускаются только разбор тела и снимок исходника.',
  ['Sleep this long on each worker AFTER a response completes, before it picks up the next URL. Stacks with the global RPS cap — useful for sites that rate-limit on inter-request gap rather than total throughput.']:
    'Каждый воркер спит указанное время ПОСЛЕ завершения ответа, прежде чем взять следующий URL. Складывается с глобальным потолком RPS — полезно для сайтов, ограничивающих по интервалу между запросами, а не по общей пропускной способности.',
  ['Specific reason a URL is non-indexable. For Indexable URLs this column is empty.']:
    'Конкретная причина, по которой URL неиндексируем. Для индексируемых URL эта колонка пуста.',
  ['Spider follows links from the start URL across the chosen scope. List fetches a fixed set of URLs once with no link-following. Sitemap fetches a sitemap URL and crawls every page it lists (no link-following).']:
    'Spider переходит по ссылкам со стартового URL в выбранной области. «Список» загружает фиксированный набор URL один раз без переходов по ссылкам. «Sitemap» загружает URL sitemap и сканирует каждую перечисленную страницу (без переходов по ссылкам).',
  ["Spider for full site audits; List for re-checking a known set of pages; Sitemap to audit exactly what's published in sitemap.xml."]:
    'Spider для полных аудитов сайта; «Список» для повторной проверки известного набора страниц; «Sitemap» для аудита ровно того, что опубликовано в sitemap.xml.',
  ['Standard CSS selector — same syntax as `document.querySelectorAll`.']:
    'Стандартный CSS-селектор — тот же синтаксис, что у `document.querySelectorAll`.',
  ['Stored in your local prefs file as plain text. Treat the file accordingly.']:
    'Хранится в вашем локальном файле настроек открытым текстом. Относитесь к файлу соответственно.',
  ['Strip if your site canonicalises /foo (no slash); Add for sites that canonicalise /foo/.']:
    '«Убрать», если сайт канонизирует /foo (без слэша); «Добавить» для сайтов, канонизирующих /foo/.',
  ['Sunset over the mountain ridge']: 'Закат над горным хребтом',
  ['Surplus `@id` occurrences across all JSON-LD blocks (page declares the same `@id` more than once).']:
    'Лишние вхождения `@id` по всем блокам JSON-LD (страница объявляет один и тот же `@id` более одного раза).',
  ['Terminal URL the redirect chain resolves to. Empty when this row is itself the terminal (i.e. status is 2xx/4xx/5xx) or when the chain hits a loop.']:
    'Конечный URL, к которому приходит цепочка перенаправлений. Пусто, если эта строка сама является конечной (статус 2xx/4xx/5xx) или если цепочка упирается в петлю.',
  ['Canonical hops walked after this page (or, on a redirect row, after the redirect\'s final URL) until a page that canonicalises to itself. 0 when the canonical is the page itself or absent.']:
    'Число canonical-переходов после этой страницы (или, в строке редиректа, после конечного URL редиректа) до страницы, которая ссылается canonical на саму себя. 0, если canonical — сама страница или отсутствует.',
  ['Where the canonical chain ends. Empty when the page is its own canonical, or when the chain loops.']:
    'Где заканчивается цепочка canonical. Пусто, если страница сама себе canonical или цепочка зациклена.',
  ['text for visible content, attribute for href/src, count for occurrence count']:
    'text для видимого содержимого, attribute для href/src, count для числа вхождений',
  ['Text of the first <h1> on the page. Should match user intent and ideally complement (not duplicate) the title.']:
    'Текст первого <h1> на странице. Должен соответствовать намерению пользователя и в идеале дополнять (а не дублировать) заголовок.',
  ["Text Only fetches the raw HTML response as-is — fast and deterministic. Old AJAX Crawling Scheme rewrites hashbang (#!) URLs to Google's deprecated ?_escaped_fragment_= form so a pre-rendering server returns the snapshot. Full JavaScript rendering is a V2 item."]:
    '«Только текст» загружает сырой HTML-ответ как есть — быстро и детерминированно. Старая схема AJAX Crawling переписывает hashbang-URL (#!) в устаревшую форму Google ?_escaped_fragment_=, чтобы сервер пререндеринга вернул снимок. Полный JavaScript-рендеринг — пункт V2.',
  ['Text Only for server-rendered / static sites; Old AJAX only for legacy hashbang SPAs.']:
    '«Только текст» для серверных / статических сайтов; «Старый AJAX» только для устаревших hashbang-SPA.',
  ["The column / JSON-key name for this rule's output. Free-form."]:
    'Имя колонки / JSON-ключа для вывода этого правила. Произвольное.',
  ['The fully normalised URL of the crawled resource (post URL-rewriting).']:
    'Полностью нормализованный URL просканированного ресурса (после переписывания URL).',
  ['The URL that fails to resolve (4xx/5xx/network error).']:
    'URL, который не разрешается (4xx/5xx/сетевая ошибка).',
  ['Third-party `<script>` / `<link rel=stylesheet>` references without an `integrity=` attribute. SRI is recommended for any cross-origin subresource.']:
    'Сторонние ссылки `<script>` / `<link rel=stylesheet>` без атрибута `integrity=`. SRI рекомендуется для любого кросс-доменного подресурса.',
  ['Time-to-first-byte in milliseconds (network + server, excluding parse). Lower is better; >2000 ms is slow.']:
    'Время до первого байта в миллисекундах (сеть + сервер, без разбора). Чем меньше, тем лучше; >2000 мс — медленно.',
  ['Total number of <h1> elements on the page. SEO best practice is exactly 1.']:
    'Общее число элементов <h1> на странице. Лучшая SEO-практика — ровно 1.',
  ['Total number of <h2> elements on the page.']: 'Общее число элементов <h2> на странице.',
  ['tr,en;q=0.8 — Turkish first, English fallback.']:
    'tr,en;q=0.8 — сначала турецкий, английский как запасной.',
  ["Trips 'Folder Depth Too Deep' when the URL path's `/`-segment count exceeds this. Useful for spotting over-nested URL structures that bury content from crawlers."]:
    'Вызывает «Слишком глубокая вложенность папок», когда число сегментов `/` в пути URL превышает это значение. Полезно для поиска чрезмерно вложенных структур URL, прячущих контент от краулеров.',
  ["Trips 'Long Query String' when LENGTH(query) > this. Typical session-id sprawl + UTM tracking hits 100+ chars; over 200 starts to look like a bug."]:
    'Вызывает «Длинная строка запроса», когда LENGTH(query) > этого значения. Типичное разрастание session-id + UTM-меток достигает 100+ символов; свыше 200 уже похоже на баг.',
  ["Trips the 'URL Too Long' issue when LENGTH(url) > this. RFC 7230 doesn't mandate a max but most servers + middleboxes fail above ~2 KB; Chrome itself caps at ~32 KB."]:
    'Вызывает проблему «Слишком длинный URL», когда LENGTH(url) > этого значения. RFC 7230 не задаёт максимум, но большинство серверов и промежуточных узлов отказывают выше ~2 КБ; сам Chrome ограничивает ~32 КБ.',
  ["Two modes per line. (1) Wrap in slashes for a regex: /pattern/flags — supported flags imsuy (g is forced). Invalid patterns appear with count -1 in the detail panel so you can spot the typo. (2) Anything else is a literal case-insensitive substring — the legacy behaviour. Each term's per-page hit count is surfaced in the URL Details panel."]:
    'Два режима на строку. (1) Заключите в слэши для regex: /шаблон/флаги — поддерживаются флаги imsuy (g принудительно). Некорректные шаблоны показываются со счётчиком -1 в панели деталей, чтобы заметить опечатку. (2) Всё остальное — литеральная регистронезависимая подстрока — прежнее поведение. Число совпадений каждого термина на странице видно в панели «Детали URL».',
  ["Two pages are flagged as near-duplicates if their 64-bit SimHash differs by at most this many bits. 3 ≈ 95% similarity over body-text shingles (Screaming Frog's tightest filter). Set to 0 to skip clustering entirely."]:
    'Две страницы помечаются как почти дубликаты, если их 64-битные SimHash различаются не более чем на это число бит. 3 ≈ 95 % сходства по шинглам текста тела (самый строгий фильтр Screaming Frog). Установите 0, чтобы полностью пропустить кластеризацию.',
  ['URL declared by the first <link rel="canonical"> tag. Tells search engines which version to index when duplicates exist.']:
    'URL, объявленный первым тегом <link rel="canonical">. Сообщает поисковым системам, какую версию индексировать при наличии дубликатов.',
  ['URL paths ending in any of these extensions are not enqueued. Case-insensitive. Start URL is always crawled regardless.']:
    'Пути URL, оканчивающиеся на любое из этих расширений, не ставятся в очередь. Без учёта регистра. Стартовый URL сканируется всегда.',
  ['Value of the alt attribute. Empty cell = no alt declared (accessibility/SEO issue).']:
    'Значение атрибута alt. Пустая ячейка = alt не объявлен (проблема доступности/SEO).',
  ['Value of the X-Robots-Tag HTTP response header. Same semantics as meta robots but applied at the server.']:
    'Значение HTTP-заголовка ответа X-Robots-Tag. Та же семантика, что у meta robots, но применяется на сервере.',
  ['Viewport height — affects above-the-fold detection and lazy-load triggers.']:
    'Высота вьюпорта — влияет на определение первого экрана и триггеры ленивой загрузки.',
  ['Viewport width applied to every rendered page. Mobile audits typically use 360–414, desktop 1280–1920.']:
    'Ширина вьюпорта для каждой рендерящейся страницы. Мобильные аудиты обычно используют 360–414, десктопные — 1280–1920.',
  ['Visible body text word count (excludes <script>/<style>). Useful for identifying thin content.']:
    'Число слов видимого текста тела (без <script>/<style>). Полезно для выявления тонкого контента.',
  ['Wait this long before the FIRST retry, doubling on each subsequent attempt (500 → 1000 → 2000 …).']:
    'Ждать это время перед ПЕРВЫМ повтором, удваивая при каждой следующей попытке (500 → 1000 → 2000 …).',
  ["Walks 3xx redirect chains, fills `redirect_chain_length` / `redirect_loop`. Drives the 'Long Chain' and 'Redirect Loop' issues + the Redirects tab."]:
    'Обходит цепочки 3xx-перенаправлений, заполняет `redirect_chain_length` / `redirect_loop`. Питает проблемы «Длинная цепочка» и «Петля перенаправлений» + вкладку «Перенаправления».',
  ['Welcome to Example Store']: 'Добро пожаловать в Магазин-пример',
  ['What to do when multiple matches exist.']: 'Что делать при нескольких совпадениях.',
  ['What to read off each matched element. Ignored for an XPath `/@attr` or `/text()` terminal — that value is used directly.']:
    'Что читать из каждого совпавшего элемента. Игнорируется для XPath, оканчивающегося на `/@attr` или `/text()` — это значение используется напрямую.',
  ['When non-empty, ALL query parameters not on this list are dropped during normalisation (case-insensitive name match). Leave empty to keep the default behaviour, which strips just utm_*, fbclid, gclid, mc_cid, and mc_eid.']:
    'Если не пусто, ВСЕ параметры запроса, не входящие в этот список, удаляются при нормализации (сопоставление имён без учёта регистра). Оставьте пустым для поведения по умолчанию, которое убирает только utm_*, fbclid, gclid, mc_cid и mc_eid.',
  ['When off, no budget evaluation runs and the verdict column is cleared. When on, the post-crawl pass scores every internal 200 HTML page against the ceilings below.']:
    'Если выключено, оценка бюджета не выполняется, а колонка вердикта очищается. Если включено, проход после сканирования оценивает каждую внутреннюю HTML-страницу с кодом 200 по порогам ниже.',
  ['When on (default), pagination_next + pagination_prev URLs are post-fetch enqueued. Off only to debug pagination-only loops without disabling all link follow.']:
    'Если включено (по умолчанию), URL из pagination_next + pagination_prev ставятся в очередь после загрузки. Выключайте только для отладки петель пагинации, не отключая переходы по ссылкам целиком.',
  ['When ON (default), the Duplicate URL filter compares URLs after lowercasing the host, dropping the query string, and trimming the trailing slash — the canonical SEO behaviour. When OFF, comparison is byte-exact, so the filter only fires on rows that share an identical raw URL string (rare since URLs are deduped at insert time).']:
    'Если ВКЛ. (по умолчанию), фильтр «Дубликат URL» сравнивает URL после приведения хоста к нижнему регистру, отбрасывания строки запроса и удаления завершающего слэша — каноническое SEO-поведение. Если ВЫКЛ., сравнение побайтовое, поэтому фильтр срабатывает только на строках с идентичной сырой строкой URL (редко, так как URL дедуплицируются при вставке).',
  ["When on, `<meta http-equiv='refresh'>` content URLs are enqueued like a redirect target. window.location body redirects are heuristic-only and currently out of scope."]:
    "Если включено, URL из content `<meta http-equiv='refresh'>` ставятся в очередь как цель перенаправления. Перенаправления window.location в теле — только эвристика и сейчас вне области.",
  ['When on, a 200 page declaring a canonical pointing elsewhere also enqueues that target. Default off — most crawls treat canonicals as a signal, not a navigation hint.']:
    'Если включено, страница 200, объявляющая canonical на другой адрес, также ставит эту цель в очередь. По умолчанию выключено — большинство сканирований трактуют canonical как сигнал, а не как подсказку навигации.',
  ['When on, pages with noindex / canonicalised / robots-blocked indexability are excluded from clustering — the Near-Duplicate report then surfaces only issues that affect search visibility.']:
    'Если включено, страницы с индексируемостью noindex / канонизирована / заблокирована robots исключаются из кластеризации — отчёт «Почти дубликаты» тогда показывает только проблемы, влияющие на видимость в поиске.',
  ["When on, rel=nofollow links are recursed into like any other link. Default off — Screaming Frog 'Respect Nofollow' default."]:
    "Если включено, ссылки rel=nofollow обходятся как любые другие. По умолчанию выключено — поведение Screaming Frog 'Respect Nofollow' по умолчанию.",
  ['When Playwright considers navigation complete. domcontentloaded = HTML parsed but resources still loading. load = window.load fired. networkidle = no network activity for 500ms (best for SPA but slower). commit = just response committed (fastest, riskiest).']:
    'Когда Playwright считает навигацию завершённой. domcontentloaded = HTML разобран, ресурсы ещё грузятся. load = сработал window.load. networkidle = нет сетевой активности 500 мс (лучше для SPA, но медленнее). commit = только зафиксирован ответ (быстрее всего, рискованнее всего).',
  ['Whether the broken target is on the same site (internal) or a different host (external).']:
    'Находится ли битая цель на том же сайте (внутренняя) или на другом хосте (внешняя).',
  ['Whether the URL is eligible to appear in search results. Combines status code, robots directives, canonical, and meta-refresh signals.']:
    'Может ли URL появляться в результатах поиска. Сочетает код состояния, директивы robots, canonical и сигналы meta-refresh.',
  ['Width attribute value (in pixels) declared on the <img> tag, when present.']:
    'Значение атрибута width (в пикселях), объявленное на теге <img>, если есть.',
  ['XPath 1.0 subset over the parsed DOM. End in `/@attr` or `/text()` to read an attribute / text node. Predicates: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.']:
    'Подмножество XPath 1.0 по разобранному DOM. Завершите `/@attr` или `/text()`, чтобы прочитать атрибут / текстовый узел. Предикаты: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.',
  ['Y when the page declares hreflang alternates but no entry whose `href` matches the page URL. Google requires a self-reference.']:
    'Y, если страница объявляет hreflang-альтернативы, но нет записи, чей `href` совпадает с URL страницы. Google требует самоссылку.',
  ['Y when the redirect chain originating at this URL contains a cycle (A → B → A) detected by the cycle-safe walker; the chain is otherwise unwalked.']:
    'Y, если цепочка перенаправлений, начинающаяся с этого URL, содержит цикл (A → B → A), обнаруженный обходом с защитой от циклов; иначе цепочка не обходится.',
  ['Y when this URL belongs to a paginated cluster whose ordinal sequence has a gap (e.g. ?page=1, 2, 4 — page 3 missing). Set by the post-crawl `recomputePaginationSequence` pass.']:
    'Y, если этот URL входит в пагинированную группу, в порядковой последовательности которой есть пропуск (например, ?page=1, 2, 4 — нет страницы 3). Ставится проходом `recomputePaginationSequence` после сканирования.',
  ['SQL injection — the request tries to smuggle SQL into a parameter (UNION SELECT, sleep(), error-based functions) to read or alter your database.']:
    'SQL-инъекция — запрос пытается протащить SQL в параметр (UNION SELECT, sleep(), функции на основе ошибок), чтобы прочитать или изменить вашу базу данных.',
  ['Cross-site scripting — the request carries script markup or a javascript: URL in a parameter, hoping the page echoes it back into the HTML unescaped.']:
    'Межсайтовый скриптинг — запрос несёт разметку script или URL javascript: в параметре в расчёте, что страница вернёт его в HTML без экранирования.',
  ['Path traversal — the request walks out of the web root with ../ or encoded variants to reach files like /etc/passwd or win.ini.']:
    'Обход путей — запрос выходит за пределы веб-корня через ../ или закодированные варианты, чтобы добраться до файлов вроде /etc/passwd или win.ini.',
  ['Command injection — the request appends shell syntax (;, |, backticks, $( )) to a parameter to run commands on the server.']:
    'Инъекция команд — запрос добавляет к параметру синтаксис оболочки (;, |, обратные кавычки, $( )), чтобы выполнить команды на сервере.',
  ['Scanner probe — an automated vulnerability scanner walking a wordlist of known admin panels, installers and exploit paths (wp-login, phpmyadmin, /actuator, shell uploads). Not tailored to your site; it hits everyone.']:
    'Зонд сканера — автоматический сканер уязвимостей, перебирающий список известных админ-панелей, установщиков и путей эксплойтов (wp-login, phpmyadmin, /actuator, загрузки шеллов). Не нацелен на ваш сайт; бьёт по всем.',
  ['Sensitive file fetch — a direct request for something that must never be public: .env, .git, backups, SQL dumps, private keys, config files.']:
    'Запрос чувствительного файла — прямой запрос того, что никогда не должно быть публичным: .env, .git, бэкапы, SQL-дампы, приватные ключи, файлы конфигурации.',
  ['Anomaly — malformed or evasive input (null bytes, CRLF injection, over-encoding, absurd parameter lengths) that matches no single attack class but is not a normal browser request.']:
    'Аномалия — некорректный или уклончивый ввод (нулевые байты, CRLF-инъекция, избыточное кодирование, абсурдная длина параметров), не подходящий ни под один класс атак, но не являющийся обычным браузерным запросом.',
  ['Sum of the weights of every attack signature the request matched. Each signature carries a weight by how conclusive it is (a UNION SELECT weighs 9, a stray quote 2), and a line is only flagged once the total reaches 5 — so one decisive pattern flags on its own, while weak hints have to add up. Higher score = less room for a false positive; sort by it to triage.']:
    'Сумма весов всех сигнатур атак, совпавших с запросом. У каждой сигнатуры вес по степени убедительности (UNION SELECT весит 9, одиночная кавычка 2), а строка помечается только когда сумма достигает 5 — так один решающий шаблон срабатывает сам по себе, а слабые намёки должны накопиться. Выше балл = меньше шансов на ложное срабатывание; сортируйте по нему для триажа.',
  ['Which attack class the strongest matching signature belongs to: SQL injection, XSS, path traversal, command injection, scanner probe, sensitive file, or anomaly. Hover any badge in this column for what that class means in practice.']:
    'К какому классу атак относится сильнейшая совпавшая сигнатура: SQL-инъекция, XSS, обход путей, инъекция команд, зонд сканера, чувствительный файл или аномалия. Наведите на любой бейдж в этой колонке, чтобы узнать, что этот класс означает на практике.',
  ["Filters on the Status column — the most recent response the log recorded for that path. The analyzer keeps one status per URL rather than a full distribution, so this answers 'what is this URL returning now'. Paths whose status could not be parsed are hidden while a class is selected."]:
    'Фильтр по колонке «Статус» — самый свежий ответ, записанный логом для этого пути. Анализатор хранит один статус на URL, а не полное распределение, поэтому это отвечает на вопрос «что этот URL возвращает сейчас». Пути, чей статус не удалось разобрать, скрываются, пока выбран класс.',
  ['Most recent HTTP status the log recorded for this path. One value per URL, not a distribution — a path that returned 200 all week and 404 this morning shows 404.']:
    'Самый свежий HTTP-статус, записанный логом для этого пути. Одно значение на URL, не распределение — путь, отдававший 200 всю неделю и 404 сегодня утром, показывает 404.',
  ['A URL whose path repeats the same segment this many times or more (/shop/shop/shop/…) is treated as a link loop and skipped. This shape comes from a relative-href bug and has no legitimate counterpart. Skipped counts are reported when the crawl finishes.']:
    'URL, в чьём пути один и тот же сегмент повторяется столько раз или больше (/shop/shop/shop/…), считается петлёй ссылок и пропускается. Такая форма возникает из-за бага относительного href и не имеет законного аналога. Число пропусков сообщается по завершении сканирования.',
  ['3 is safe for every site; raise to 4–5 only if a real path legitimately repeats a segment; 0 disables the guard.']:
    '3 безопасно для любого сайта; поднимайте до 4–5, только если реальный путь законно повторяет сегмент; 0 отключает защиту.',
  ['URLs with more query parameters than this are flagged as faceted-navigation traps under Issues → URL → Crawl Trap. Detection only — the URLs are still crawled, because legitimate filter pages look the same.']:
    'URL с числом параметров запроса больше этого помечаются как ловушки фасетной навигации в Проблемы → URL → Ловушка сканирования. Только обнаружение — URL всё равно сканируются, потому что легитимные страницы фильтров выглядят так же.',
  ['4 surfaces most faceted-nav explosions; 0 disables the check.']:
    '4 выявляет большинство взрывов фасетной навигации; 0 отключает проверку.',
  ["Honor Allow / Disallow rules declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "Соблюдать правила Allow / Disallow из /robots.txt для настроенного User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt).",
  ["Honor a Crawl-delay directive as a global rate limit (one request every N seconds). Crawl-delay is not part of RFC 9309 — Google ignores it and Screaming Frog does not implement it — and published values are often stale: 'Crawl-delay: 30' turns a 500-URL crawl into hours. Ignored by default; the directive is still reported in the log when found."]:
    "Соблюдать директиву Crawl-delay как глобальное ограничение частоты (один запрос каждые N секунд). Crawl-delay не входит в RFC 9309 — Google её игнорирует, а Screaming Frog не реализует — и опубликованные значения часто устарели: 'Crawl-delay: 30' превращает сканирование 500 URL в часы. По умолчанию игнорируется; найденная директива всё равно отмечается в логе.",
  ['Off (default) for normal audits. On when an ops policy requires it — expect the crawl to take Crawl-delay seconds per URL.']:
    'Выкл. (по умолчанию) для обычных аудитов. Вкл., когда этого требует политика эксплуатации — ожидайте Crawl-delay секунд на каждый URL.',
  ['Crawl fetches internal <img> targets (incl. srcset / <picture> sources) so each appears in the Internal tab with status, content type, and size — every one counts toward Max URLs. Store keeps the <img> declarations in the Images tab, which works even with Crawl off: you get the full image inventory with alt text for the cost of zero extra requests.']:
    '«Сканировать» загружает внутренние цели <img> (включая srcset / источники <picture>), чтобы каждая появилась во вкладке «Внутренние» со статусом, типом контента и размером — каждая засчитывается в «Макс. URL». «Сохранять» держит объявления <img> во вкладке «Изображения», которая работает и при выключенном «Сканировать»: вы получаете полный инвентарь изображений с alt-текстом ценой нуля дополнительных запросов.',
  ['Store on, Crawl off is the cheap alt-text audit. Both on for a full image health check.']:
    '«Сохранять» вкл., «Сканировать» выкл. — дешёвый аудит alt-текста. Оба вкл. — полная проверка здоровья изображений.',
  ['<video> / <audio> and the <source> children they own. Off by default — media files are large and rarely what an SEO crawl is looking for.']:
    '<video> / <audio> и принадлежащие им дочерние <source>. По умолчанию выкл. — медиафайлы большие и редко нужны SEO-сканированию.',
  ['On when auditing a video-heavy site for dead media URLs.']:
    'Вкл. при аудите сайта с большим количеством видео на предмет мёртвых медиа-URL.',
  ["<link rel=stylesheet> targets. Crawling a stylesheet is also what discovers the web fonts and background images declared inside it via @font-face / url() — so Crawl on with Store off still populates the Internal tab's Font filter without listing every stylesheet."]:
    'Цели <link rel=stylesheet>. Сканирование таблицы стилей — это ещё и способ обнаружить веб-шрифты и фоновые изображения, объявленные внутри через @font-face / url(), — поэтому «Сканировать» вкл. при «Сохранять» выкл. всё равно наполняет фильтр «Шрифты» во вкладке «Внутренние», не перечисляя каждую таблицу стилей.',
  ['Crawl on, Store off when you want fonts discovered but not hundreds of CSS rows.']:
    '«Сканировать» вкл., «Сохранять» выкл., когда нужно обнаружить шрифты, но не сотни строк CSS.',
  ['<script src> targets, fetched so each gets its own row with status code, content type, and size. Headers only — the body is discarded, never executed.']:
    'Цели <script src>, загружаемые так, чтобы у каждой была своя строка с кодом состояния, типом контента и размером. Только заголовки — тело отбрасывается, никогда не выполняется.',
  ['Both on to catch 404ing bundles; both off for HTML-only crawls.']:
    'Оба вкл., чтобы ловить бандлы с 404; оба выкл. для сканирований только HTML.',
  ['<a href> targets on the same site. Crawl off turns the run into an audit of a fixed set of pages — sitemaps, canonicals, and the other declared alternates below still feed discovery. Store off empties the link graph: inlinks, outlinks, anchor-text reports, and link score all go with it.']:
    'Цели <a href> на том же сайте. «Сканировать» выкл. превращает запуск в аудит фиксированного набора страниц — sitemap, canonical и прочие объявленные альтернативы ниже по-прежнему питают обнаружение. «Сохранять» выкл. опустошает граф ссылок: входящие, исходящие, отчёты по анкорам и ссылочный балл уходят вместе с ним.',
  ['Leave both on. Crawl off only when a sitemap or URL list already defines the exact set you want.']:
    'Оставьте оба вкл. «Сканировать» выкл. — только когда sitemap или список URL уже задаёт точный нужный набор.',
  ['Outbound links to other hosts are always status-checked (one HEAD each) so Broken Links catches dead externals — that does not depend on this row. Crawl here means fully crawling those pages, following their links onward too. Store keeps outbound links in the link graph.']:
    'Исходящие ссылки на другие хосты всегда проверяются на статус (по одному HEAD), чтобы «Битые ссылки» ловили мёртвые внешние — это не зависит от этой строки. «Сканировать» здесь означает полное сканирование тех страниц с переходом и по их ссылкам. «Сохранять» держит исходящие ссылки в графе ссылок.',
  ['Crawl off (default) — status-check externals without spidering the whole web.']:
    '«Сканировать» выкл. (по умолчанию) — проверять статус внешних, не обходя весь интернет.',
  ['<link rel=canonical> and its HTTP Link: header form. Crawl also enqueues the canonical target, treating it as a navigation hint. Store feeds the Canonicals tab and every canonical issue filter.']:
    '<link rel=canonical> и его форма в HTTP-заголовке Link:. «Сканировать» также ставит цель canonical в очередь как подсказку навигации. «Сохранять» питает вкладку «Canonical» и все фильтры проблем canonical.',
  ['Crawl off (default) — canonicals are a signal, not a route. Store on.']:
    '«Сканировать» выкл. (по умолчанию) — canonical это сигнал, а не маршрут. «Сохранять» вкл.',
  ['<link rel=next> / <link rel=prev>. Part of the standard discovery graph; turn Crawl off to isolate a pagination loop without disabling link-following everywhere.']:
    '<link rel=next> / <link rel=prev>. Часть стандартного графа обнаружения; выключите «Сканировать», чтобы изолировать петлю пагинации, не отключая переходы по ссылкам повсюду.',
  ['Both on unless you are debugging an infinite paginated series.']:
    'Оба вкл., если только вы не отлаживаете бесконечную пагинированную серию.',
  ['<link rel=alternate hreflang>. Crawl enqueues every declared alternate, which is how you reach language versions nothing links to. Store feeds the Hreflang tab and the reciprocity / invalid-code audits.']:
    '<link rel=alternate hreflang>. «Сканировать» ставит в очередь каждую объявленную альтернативу — так вы добираетесь до языковых версий, на которые ничто не ссылается. «Сохранять» питает вкладку «Hreflang» и аудиты взаимности / некорректных кодов.',
  ['Crawl on for a multi-language audit — otherwise unlinked locales stay invisible.']:
    '«Сканировать» вкл. для многоязычного аудита — иначе несвязанные локали остаются невидимыми.',
  ['<link rel=amphtml>. Crawl fetches the AMP variant as its own URL; Store keeps the declaration plus the AMP smoke-validator findings.']:
    '<link rel=amphtml>. «Сканировать» загружает AMP-вариант как отдельный URL; «Сохранять» держит объявление плюс находки базового AMP-валидатора.',
  ['Crawl on only if the site still ships AMP pages.']:
    '«Сканировать» вкл. только если сайт всё ещё отдаёт AMP-страницы.',
  ['<meta http-equiv="refresh">. Crawl enqueues the parsed target like a redirect; Store keeps the raw directive and its URL for the Meta Refresh tab.']:
    '<meta http-equiv="refresh">. «Сканировать» ставит разобранную цель в очередь как перенаправление; «Сохранять» держит сырую директиву и её URL для вкладки «Meta Refresh».',
  ['Crawl on when auditing a legacy site that still redirects this way.']:
    '«Сканировать» вкл. при аудите устаревшего сайта, который всё ещё перенаправляет таким способом.',
  ["<iframe src> documents. Crawl fetches each embedded page as its own URL, which can pull in a lot of third-party surface. Store records them in the link graph so a dead embed shows up in Outlinks and Broken Links — without counting toward the page's outlink total, since an embed is not a hyperlink."]:
    'Документы <iframe src>. «Сканировать» загружает каждую встроенную страницу как отдельный URL, что может затянуть много стороннего материала. «Сохранять» записывает их в граф ссылок, чтобы мёртвое встраивание показывалось в «Исходящих ссылках» и «Битых ссылках» — не засчитываясь в итог исходящих ссылок страницы, поскольку встраивание не является гиперссылкой.',
  ['Store on, Crawl off is usually the right pair.']:
    '«Сохранять» вкл., «Сканировать» выкл. — обычно правильная пара.',
  ['The separate-URL (m-dot) mobile version: <link rel="alternate" media="only screen and (max-width: …)">. Null on responsive sites, which is most of them — a value here with no reciprocal canonical back is the classic broken m-dot setup.']:
    'Мобильная версия на отдельном URL (m-dot): <link rel="alternate" media="only screen and (max-width: …)">. Null на адаптивных сайтах, а таких большинство — значение здесь без ответного canonical назад — классическая сломанная m-dot-настройка.',
  ['Crawl on only when the site really does serve a separate mobile host.']:
    '«Сканировать» вкл. только когда сайт действительно отдаёт отдельный мобильный хост.',
  ['Links a search engine cannot follow: <a> with no href but an onclick, href="javascript:…", and href="#" placeholders wired to a handler. Store-only — an uncrawlable link is by definition never fetched. Drives the JS-Only Navigation issue filter.']:
    'Ссылки, по которым поисковик не может перейти: <a> без href, но с onclick, href="javascript:…" и заглушки href="#" с обработчиком. Только «Сохранять» — несканируемая ссылка по определению никогда не загружается. Питает фильтр проблем «Навигация только через JS».',
  ['On — it is a count, so it costs nothing.']: 'Вкл. — это счётчик, поэтому он ничего не стоит.',
  ['With a Subfolder-scoped crawl, links pointing outside the start folder are fetched once so their status code is known, then stopped — they are checked, not crawled through. Off leaves them undiscovered entirely.']:
    'При сканировании в области «Подпапка» ссылки, ведущие за пределы стартовой папки, загружаются один раз ради кода состояния и на этом останавливаются — они проверяются, а не сканируются насквозь. Выкл. оставляет их вовсе необнаруженными.',
  ['On — knowing a link out of /blog/ is a 404 costs one request.']:
    'Вкл. — узнать, что ссылка из /blog/ ведёт на 404, стоит одного запроса.',
  ["Off restricts the crawl to URLs under the start URL's path (Crawl Scope = Subfolder). On lets it cover the whole host. This is a view of the Crawl Scope setting, not a separate switch, so the two can never disagree."]:
    'Выкл. ограничивает сканирование URL под путём стартового URL (Область сканирования = Подпапка). Вкл. позволяет охватить весь хост. Это представление настройки «Область сканирования», а не отдельный переключатель, поэтому они никогда не противоречат друг другу.',
  ['Off to audit just /blog/; on for the whole site.']:
    'Выкл. — аудит только /blog/; вкл. — весь сайт.',
  ['Treats every host sharing the registrable domain as internal — shop.example.com and blog.example.com crawl alongside example.com instead of counting as external. Another view of the Crawl Scope setting.']:
    'Считает внутренним каждый хост с тем же регистрируемым доменом — shop.example.com и blog.example.com сканируются наравне с example.com, а не считаются внешними. Ещё одно представление настройки «Область сканирования».',
  ['On when subdomains are part of the same property.']:
    'Вкл., когда поддомены — часть той же площадки.',
  ['Crawl through rel="nofollow" links pointing at the same site. Off (default) is Screaming Frog "Respect Nofollow" behaviour. Internal and external are separate switches because sites nofollow them for opposite reasons — crawl-budget shaping vs. not vouching for a third party.']:
    'Переходить по ссылкам rel="nofollow", ведущим на тот же сайт. Выкл. (по умолчанию) — поведение Screaming Frog "Respect Nofollow". Внутренние и внешние — отдельные переключатели, потому что сайты ставят nofollow по противоположным причинам: управление краулинговым бюджетом vs. отказ ручаться за третью сторону.',
  ['On when a site nofollows its own faceted navigation and you need behind it.']:
    'Вкл., когда сайт закрывает nofollow собственную фасетную навигацию, а вам нужно попасть за неё.',
  ['Crawl through rel="nofollow" links pointing at other hosts. Only has an effect while External Links → Crawl is on.']:
    'Переходить по ссылкам rel="nofollow", ведущим на другие хосты. Действует только пока включено «Внешние ссылки → Сканировать».',
  ['Off — nofollowed externals are exactly the ones you did not vouch for.']:
    'Выкл. — внешние с nofollow это ровно те, за которые вы не ручались.',
  ['Record hrefs that cannot be parsed as a URL — unencoded whitespace inside the authority, doubled schemes, stray delimiters. They can never resolve to a crawled page, so every one is reported in Broken Links, which is the point. Deliberate non-navigable schemes (mailto:, tel:, #) are not malformed and never appear.']:
    'Записывать href, которые не разбираются как URL — незакодированные пробелы внутри authority, удвоенные схемы, лишние разделители. Они никогда не разрешатся в просканированную страницу, поэтому каждый попадает в «Битые ссылки» — в этом и смысл. Намеренно ненавигационные схемы (mailto:, tel:, #) не считаются некорректными и никогда не показываются.',
  ['On when hunting hand-written markup errors; off keeps Broken Links focused on real 404s.']:
    'Вкл. при охоте за ошибками в рукописной разметке; выкл. держит «Битые ссылки» сосредоточенными на настоящих 404.',
  ['Off drops every discovered URL carrying a `?`, before robots and before a request goes out. That is the cheap way to stop a faceted navigation (?color=red&size=xl&sort=price) from spending the whole URL budget on one product listing wearing a thousand URLs. The start URL is always crawled, and subresources are exempt — style.css?v=7 is a cache-buster, not a facet. Skipped URLs are counted and reported in the log, never dropped silently.']:
    'Выкл. отбрасывает каждый обнаруженный URL с `?` — до robots и до отправки запроса. Это дешёвый способ не дать фасетной навигации (?color=red&size=xl&sort=price) потратить весь бюджет URL на один список товаров в тысяче обличий. Стартовый URL сканируется всегда, а подресурсы исключены — style.css?v=7 это cache-buster, а не фасет. Пропущенные URL подсчитываются и отмечаются в логе, а не отбрасываются молча.',
  ['On (default). Off for a first pass over a shop with faceted filters.']:
    'Вкл. (по умолчанию). Выкл. для первого прохода по магазину с фасетными фильтрами.',
  ['Parameter names that keep a URL in the crawl anyway — pagination, a language switch, a product id. Names only; values are not looked at, and matching ignores case. A URL is admitted only when every parameter it carries is on this list: ?page=2 passes, ?page=2&color=red does not. Any-match would defeat the point, since a facet URL nearly always carries the pagination parameter too.']:
    'Имена параметров, при которых URL всё же остаётся в сканировании — пагинация, переключатель языка, id товара. Только имена; значения не рассматриваются, регистр не учитывается. URL допускается только если каждый его параметр есть в списке: ?page=2 проходит, ?page=2&color=red — нет. Совпадение по любому параметру обесценило бы идею, так как фасетный URL почти всегда несёт и параметр пагинации.',
  ['page, lang — keeps paginated archives reachable while the facets stay out.']:
    'page, lang — оставляет пагинированные архивы доступными, а фасеты — снаружи.',
  ['Auto-discovery on its own only records sitemap entries, which is what the sitemap issue filters compare the crawl against. Turning this on crawls them too — and that is what surfaces orphans: pages the sitemap declares but nothing on the site links to.']:
    'Автообнаружение само по себе только записывает записи sitemap — с ними фильтры проблем sitemap сравнивают сканирование. Включение также сканирует их — именно это выявляет сирот: страницы, объявленные в sitemap, на которые ничто на сайте не ссылается.',
  ['On for an orphan-page audit.']: 'Вкл. для аудита страниц-сирот.',
  ['Reads Sitemap: directives from /robots.txt plus the conventional /sitemap.xml fallbacks at crawl start. Cheap I/O, and it powers every sitemap issue filter.']:
    'Читает директивы Sitemap: из /robots.txt плюс общепринятые запасные /sitemap.xml при старте сканирования. Дешёвый ввод-вывод, питает все фильтры проблем sitemap.',
  ['On (default).']: 'Вкл. (по умолчанию).',
  ['Explicit sitemap URLs, one per line. Their entries are always both recorded and queued as crawl seeds — use this when the sitemap lives somewhere robots.txt never mentions.']:
    'Явные URL sitemap, по одному на строку. Их записи всегда и сохраняются, и ставятся в очередь как зёрна сканирования — используйте, когда sitemap лежит там, где robots.txt её никогда не упоминает.',
  ['Treat the concurrency and RPS above as a ceiling and let the target server set the real pace. On a 429/503 (or a Retry-After header) the crawler pauses for the penalty window and steps the rate + concurrency down; after a sustained run of clean responses it grows them back toward the ceiling. Off = hold the configured rate no matter how the server responds.']:
    'Считает параллельность и RPS выше потолком и позволяет целевому серверу задавать реальный темп. При 429/503 (или заголовке Retry-After) краулер выдерживает штрафное окно и понижает частоту + параллельность; после устойчивой серии чистых ответов возвращает их к потолку. Выкл. = держать настроенную частоту, как бы сервер ни отвечал.',
  ['Turn on for sites behind Cloudflare / a WAF that returns 429s; leave off for your own infrastructure where the fixed rate is safe.']:
    'Включите для сайтов за Cloudflare / WAF, отдающих 429; оставьте выключенным для своей инфраструктуры, где фиксированная частота безопасна.',
  ['Sorts query parameters alphabetically at normalisation time. Repeated keys keep their relative order, so ?tag=a&tag=b is preserved. Without this the two orderings occupy separate rows and read as duplicates.']:
    'Сортирует параметры запроса по алфавиту при нормализации. Повторяющиеся ключи сохраняют относительный порядок, поэтому ?tag=a&tag=b сохраняется. Без этого два порядка занимают разные строки и читаются как дубликаты.',
  ['On for most sites; off if your server routes on positional parameter order.']:
    'Вкл. для большинства сайтов; выкл., если сервер маршрутизирует по позиционному порядку параметров.',
  ['Collapses runs of slashes in the path to a single slash. Applied before the trailing-slash policy. Web servers serve these identically, so the duplicate-slash variant is normally a false duplicate.']:
    'Схлопывает серии слэшей в пути до одного. Применяется до политики завершающего слэша. Веб-серверы отдают их одинаково, так что вариант с двойным слэшем обычно ложный дубликат.',
  ['On if a template bug emits //  in links; off if your framework uses empty path segments as data.']:
    'Вкл., если баг шаблона выдаёт //  в ссылках; выкл., если фреймворк использует пустые сегменты пути как данные.',
  ["Off by default: verify the login page's TLS certificate before typing credentials into it. Enable only for a trusted internal host with a self-signed certificate — an unverifiable certificate on a login page is a man-in-the-middle risk."]:
    'По умолчанию выкл.: проверять TLS-сертификат страницы входа, прежде чем вводить в неё учётные данные. Включайте только для доверенного внутреннего хоста с самоподписанным сертификатом — непроверяемый сертификат на странице входа это риск атаки «человек посередине».',
  ["Hooks the History API before the page's own scripts run, so routes an SPA reaches via pushState / replaceState / popstate are discovered and crawled. Also keeps hash routes (#/about) as distinct URLs instead of collapsing them onto the shell document."]:
    'Перехватывает History API до запуска собственных скриптов страницы, поэтому маршруты, до которых SPA добирается через pushState / replaceState / popstate, обнаруживаются и сканируются. Также сохраняет hash-маршруты (#/about) как отдельные URL, а не схлопывает их на документ-оболочку.',
  ['On for React Router / Vue Router / Angular sites whose pages never produce a document request.']:
    'Вкл. для сайтов на React Router / Vue Router / Angular, чьи страницы никогда не порождают запрос документа.',
  ['`<link rel="alternate" media="only screen and (max-width: …)" href="…">` value — the separate-URL (m-dot) mobile version of this page. Empty on responsive sites, which is most of them. A value here with no reciprocal canonical pointing back is the classic broken m-dot setup.']:
    'Значение `<link rel="alternate" media="only screen and (max-width: …)" href="…">` — мобильная версия этой страницы на отдельном URL (m-dot). Пусто на адаптивных сайтах, а таких большинство. Значение здесь без ответного canonical назад — классическая сломанная m-dot-настройка.',
};
