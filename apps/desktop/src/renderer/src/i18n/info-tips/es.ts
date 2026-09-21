/**
 * Spanish InfoTip ([i] tooltip) bodies, keyed by the verbatim English
 * source string. See `../info-tips.ts` for the rationale.
 */

export const ES_INFO_TIPS: Record<string, string> = {
  ["?page=1 / ?page=2 / ?page=4 → flags 'Sequence Break' on every member of the broken cluster."]:
    "?page=1 / ?page=2 / ?page=4 → marca 'Ruptura de secuencia' en cada miembro del grupo roto.",
  ['`<a>` elements that look clickable but aren\'t crawlable (no href + onclick, `href="javascript:…"`, or `href="#"` with onclick).']:
    'Elementos `<a>` que parecen clicables pero no son rastreables (sin href + onclick, `href="javascript:…"`, o `href="#"` con onclick).',
  ['`<link rel="amphtml" href="…">` value — the AMP version of this page. Empty when the page does not declare an AMP alternate.']:
    'Valor de `<link rel="amphtml" href="…">` — la versión AMP de esta página. Vacío cuando la página no declara una alternativa AMP.',
  ['`<link rel="next" href="…">` value resolved to absolute. Empty when the page is not paginated forward.']:
    'Valor de `<link rel="next" href="…">` resuelto a absoluto. Vacío cuando la página no está paginada hacia adelante.',
  ['`<link rel="prev" href="…">` value resolved to absolute. Empty when the page is the first in its pagination cluster.']:
    'Valor de `<link rel="prev" href="…">` resuelto a absoluto. Vacío cuando la página es la primera de su grupo de paginación.',
  ['`css` runs against the parsed DOM; `regex` runs against raw HTML.']:
    '`css` se ejecuta sobre el DOM analizado; `regex` se ejecuta sobre el HTML sin procesar.',
  ['`none` disables auth; `basic` adds `Authorization: Basic <base64>`; `bearer` adds `Authorization: Bearer <token>`; `digest` performs the RFC 2617 challenge-response on the first 401.']:
    '`none` desactiva la autenticación; `basic` añade `Authorization: Basic <base64>`; `bearer` añade `Authorization: Bearer <token>`; `digest` realiza el desafío-respuesta RFC 2617 en el primer 401.',
  ['`POST <url>` is fired when the `done` event emits. 10 s timeout. Failures are logged as info events but never break the crawl.']:
    'Se envía `POST <url>` cuando se emite el evento `done`. Tiempo de espera de 10 s. Los fallos se registran como eventos informativos pero nunca interrumpen el rastreo.',
  ['0 (no duplicates), 7 (member of cluster #7)']:
    '0 (sin duplicados), 7 (miembro del grupo n.º 7)',
  ['0 = auto. 4 for 8GB RAM machines, 8+ for 16GB+.']:
    '0 = automático. 4 en máquinas con 8 GB de RAM, 8+ con 16 GB o más.',
  ["0 default; 250 ms when a host returns 429 with a 'too fast' message."]:
    "0 por defecto; 250 ms cuando un host devuelve 429 con un mensaje de 'demasiado rápido'.",
  ['0 for SSR sites, 2000 for typical SPAs, 5000+ for heavy client-rendered apps.']:
    '0 para sitios SSR, 2000 para SPA típicas, 5000+ para aplicaciones pesadas renderizadas en cliente.',
  ["0.1 default (Google 'good'); 0 to disable."]:
    "0.1 por defecto ('bueno' según Google); 0 para desactivar.",
  ['1 = unique, 5 = part of a 5-page near-duplicate group']:
    '1 = único, 5 = parte de un grupo de 5 páginas casi duplicadas',
  ['10 (default), 3 for very tight chains, 0 to remove the cap']:
    '10 (por defecto), 3 para cadenas muy estrictas, 0 para eliminar el límite',
  ['10 covers most sites; 3 limits crawls to top-of-funnel pages only.']:
    '10 cubre la mayoría de los sitios; 3 limita el rastreo solo a las páginas superiores del embudo.',
  ['100 default for most audits; 0 to disable the check.']:
    '100 por defecto para la mayoría de auditorías; 0 para desactivar la comprobación.',
  ['100 default; 50 for tight on-page link discipline; 0 to disable the issue.']:
    '100 por defecto; 50 para una disciplina estricta de enlaces en página; 0 para desactivar el problema.',
  ['1000000 (1M) for a full site audit; 5000 for spot checks.']:
    '1000000 (1M) para una auditoría completa del sitio; 5000 para comprobaciones puntuales.',
  ['1024 (1 MB) default; 150 for a lean HTML budget; 0 to disable.']:
    '1024 (1 MB) por defecto; 150 para un presupuesto HTML ajustado; 0 para desactivar.',
  ['1048576 (1 MB) default; 524288 (512 KB) on tight disks; 0 to disable truncation entirely.']:
    '1048576 (1 MB) por defecto; 524288 (512 KB) en discos ajustados; 0 para desactivar el truncado por completo.',
  ['10485760 (10 MB) on bandwidth-tight crawls; 0 to download anything.']:
    '10485760 (10 MB) en rastreos con ancho de banda limitado; 0 para descargar cualquier cosa.',
  ['1366 = standard laptop, 1920 = full HD desktop, 375 = iPhone width.']:
    '1366 = portátil estándar, 1920 = escritorio Full HD, 375 = ancho de iPhone.',
  ['2 default; 0 to record errors immediately without retrying; 5 for unreliable upstreams.']:
    '2 por defecto; 0 para registrar errores de inmediato sin reintentar; 5 para servidores poco fiables.',
  ['20 default; 50 on fast first-party servers; 5 if the site rate-limits or returns 429s.']:
    '20 por defecto; 50 en servidores propios rápidos; 5 si el sitio limita la tasa o devuelve 429.',
  ['20 for typical sites; 5 to be polite on shared hosting; 60+ when crawling your own infra.']:
    '20 para sitios típicos; 5 para ser cortés en hosting compartido; 60+ al rastrear tu propia infraestructura.',
  ['20000 (20 s) for typical use; 5000 for fast spot checks; 60000 for slow APIs.']:
    '20000 (20 s) para uso típico; 5000 para comprobaciones rápidas; 60000 para API lentas.',
  ['2048 (≈2 GB) on a 4 GB laptop; 8192 on a 16 GB workstation; 0 to disable.']:
    '2048 (≈2 GB) en un portátil de 4 GB; 8192 en una estación de trabajo de 16 GB; 0 para desactivar.',
  ['2048 default (RFC-suggested practical ceiling).']:
    '2048 por defecto (techo práctico sugerido por el RFC).',
  ["2500 default (Google 'good'); 0 to disable."]:
    "2500 por defecto ('bueno' según Google); 0 para desactivar.",
  ['3 = recommended; 5 catches looser duplicates (templated content with light variation); 0 turns the post-crawl pass off.']:
    '3 = recomendado; 5 detecta duplicados más laxos (contenido de plantilla con ligeras variaciones); 0 desactiva la pasada posterior al rastreo.',
  ['4 default; 6 on documentation sites with deep TOC trees; 0 to disable.']:
    '4 por defecto; 6 en sitios de documentación con árboles de índice profundos; 0 para desactivar.',
  ['500 default. Bump to 2000 when retrying against a flaky API.']:
    '500 por defecto. Súbelo a 2000 al reintentar contra una API inestable.',
  ['50000 keeps RAM bounded during big sitemap fan-outs; 0 for typical crawls.']:
    '50000 mantiene la RAM acotada durante grandes expansiones de sitemaps; 0 para rastreos típicos.',
  ['60000 (1 minute) for huge resources; 0 to rely solely on the fetch timeout.']:
    '60000 (1 minuto) para recursos enormes; 0 para depender únicamente del tiempo de espera de la petición.',
  ['64-bit SimHash + LSH bucketing + Union-Find clustering on body shingles. Most expensive pass — typical 5–10 s on a 100k crawl.']:
    'SimHash de 64 bits + agrupación LSH + clustering Union-Find sobre shingles del cuerpo. La pasada más costosa — típicamente 5–10 s en un rastreo de 100k.',
  ['768 = standard laptop, 1080 = full HD desktop, 667 = iPhone 8 height.']:
    '768 = portátil estándar, 1080 = escritorio Full HD, 667 = alto de iPhone 8.',
  ['800 default; 200 for CDN-backed static; 0 to disable.']:
    '800 por defecto; 200 para estáticos servidos por CDN; 0 para desactivar.',
  ['Aborts @font-face / Google Fonts / WOFF2 requests. FOUT visible but text still renders.']:
    'Aborta las peticiones de @font-face / Google Fonts / WOFF2. Se ve FOUT pero el texto sigue renderizándose.',
  ['Aborts <img>, <picture>, background-image requests. Recommended for SEO crawls — image metadata still comes from <img> tag attributes.']:
    'Aborta las peticiones de <img>, <picture> y background-image. Recomendado para rastreos SEO — los metadatos de imagen siguen viniendo de los atributos de la etiqueta <img>.',
  ['Aborts <video> / <audio> sources. Page DOM still includes the <video> tag.']:
    'Aborta las fuentes de <video> / <audio>. El DOM de la página sigue incluyendo la etiqueta <video>.',
  ['Aborts all <script> requests. This defeats the purpose of JS rendering — use Text Only mode instead.']:
    'Aborta todas las peticiones de <script>. Esto anula el propósito del renderizado JS — usa el modo Solo texto en su lugar.',
  ['Aborts external CSS. Inline styles still load. WARNING: many SPAs use CSS-driven visibility / lazy classes — blocking CSS may hide content that JS depends on.']:
    'Aborta el CSS externo. Los estilos en línea siguen cargándose. AVISO: muchas SPA usan visibilidad / clases lazy controladas por CSS — bloquear el CSS puede ocultar contenido del que depende el JS.',
  ['Aborts requests whose total lifetime (connect + headers + body) exceeds this. Distinct from `requestTimeoutMs` which is the headers timeout. Useful for capping individual slow pages without lowering the overall fetch timeout.']:
    'Aborta las peticiones cuya duración total (conexión + cabeceras + cuerpo) supere este valor. Distinto de `requestTimeoutMs`, que es el tiempo de espera de las cabeceras. Útil para limitar páginas lentas individuales sin bajar el tiempo de espera global.',
  ['Absolute redirect target parsed from the meta-refresh content. Empty when meta-refresh sets only a delay.']:
    'Destino de redirección absoluto extraído del content del meta-refresh. Vacío cuando el meta-refresh solo define un retardo.',
  ['Literal target of a JavaScript redirect found in an inline script (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Followed when "Follow JavaScript redirects" is on.']:
    'Destino literal de una redirección JavaScript hallada en un script en línea (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Se sigue cuando "Seguir redirecciones JavaScript" está activado.',
  ['Additional time to wait after the chosen wait condition fires, for SPA hydration / late XHRs. 0 = no extra wait. Bounded by the request timeout.']:
    'Tiempo adicional de espera tras dispararse la condición elegida, para la hidratación de la SPA / XHR tardíos. 0 = sin espera extra. Limitado por el tiempo de espera de la petición.',
  ['Anchor text of the broken link as rendered in the source page.']:
    'Texto ancla del enlace roto tal como se renderiza en la página de origen.',
  ['Audits the rendered DOM for WCAG AA colour-contrast failures (4.5:1 normal text, 3:1 large text) and stylesheet rules that suppress the keyboard focus outline without a :focus-visible fallback. Surfaces the Low-Contrast Text and Focus Outline Suppressed issue filters.']:
    'Audita el DOM renderizado en busca de fallos de contraste de color WCAG AA (4.5:1 texto normal, 3:1 texto grande) y reglas de hoja de estilo que suprimen el contorno de foco del teclado sin alternativa :focus-visible. Alimenta los filtros de problemas Texto de bajo contraste y Contorno de foco suprimido.',
  ['basic/digest for /staging behind nginx; bearer for protected APIs']:
    'basic/digest para /staging tras nginx; bearer para API protegidas',
  ['Below Normal while you keep working in other apps; Idle for overnight unattended runs.']:
    'Inferior a lo normal mientras sigues trabajando en otras aplicaciones; Inactiva para ejecuciones nocturnas desatendidas.',
  ['BFS click depth from the start URL. Start URL = 0; its outlinks = 1; etc. High depth often correlates with low importance.']:
    'Profundidad de clics BFS desde la URL inicial. URL inicial = 0; sus enlaces salientes = 1; etc. Una profundidad alta suele correlacionar con poca importancia.',
  ['Bodies over this are truncated and flagged. 1 MB covers the 99.9th percentile of HTML pages without letting one adversarial 50 MB page bloat the project file.']:
    'Los cuerpos mayores que esto se truncan y se marcan. 1 MB cubre el percentil 99,9 de las páginas HTML sin dejar que una página hostil de 50 MB infle el archivo del proyecto.',
  ['Buy Affordable Game Keys | Example Store']:
    'Compra claves de juegos baratas | Tienda de ejemplo',
  ['Character count of the first H1.']: 'Número de caracteres del primer H1.',
  ['Character count of the meta description. Recommended: 70–155 characters; over 155 risks truncation.']:
    'Número de caracteres de la meta descripción. Recomendado: 70–155 caracteres; por encima de 155 hay riesgo de truncado.',
  ['Character count of the title. Recommended: 30–60 characters; over 60 risks truncation in SERPs.']:
    'Número de caracteres del título. Recomendado: 30–60 caracteres; por encima de 60 hay riesgo de truncado en las SERP.',
  ['Charikar 64-bit SimHash of body shingles. Used by the post-crawl near-duplicate clustering pass. Two SimHashes within the configured Hamming threshold are considered similar.']:
    'SimHash Charikar de 64 bits de los shingles del cuerpo. Lo usa la pasada de agrupación de casi duplicados posterior al rastreo. Dos SimHash dentro del umbral de Hamming configurado se consideran similares.',
  ['Coarse content classification derived from URL extension and Content-Type header.']:
    'Clasificación gruesa del contenido derivada de la extensión de la URL y la cabecera Content-Type.',
  ['Comma-joined sorted unique JSON-LD `@type` values declared on the page (Article, BreadcrumbList, Product, …).']:
    'Valores `@type` de JSON-LD únicos, ordenados y unidos por comas, declarados en la página (Article, BreadcrumbList, Product, …).',
  ['Contents of the first <meta name="description"> tag. May be used as the SERP snippet.']:
    'Contenido de la primera etiqueta <meta name="description">. Puede usarse como fragmento en las SERP.',
  ['Contents of the first <meta name="robots"> tag. Controls per-page indexing/following behaviour.']:
    'Contenido de la primera etiqueta <meta name="robots">. Controla el comportamiento de indexación/seguimiento por página.',
  ['Contents of the first <title> element. Google primarily uses this in SERP titles.']:
    'Contenido del primer elemento <title>. Google lo usa principalmente en los títulos de las SERP.',
  ['Counts how many internal pages link to each URL. Drives the Most-Linked URLs report and the per-row Inlinks column.']:
    'Cuenta cuántas páginas internas enlazan a cada URL. Alimenta el informe de URL más enlazadas y la columna Enlaces entrantes de cada fila.',
  ["Crawl 3xx redirect targets. Each hop is its own row; the chain is reconstructed in the Response Codes view. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced)."]:
    "Rastrear los destinos de redirecciones 3xx. Cada salto es su propia fila; la cadena se reconstruye en la vista Códigos de respuesta. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced).",
  ['Crawler RSS auto-pauses the queue when this is exceeded; resumes once memory drops to 80% of the cap. Soft cap — does not enforce a hard heap limit.']:
    'El RSS del rastreador pausa automáticamente la cola al superarse este valor; se reanuda cuando la memoria baja al 80 % del límite. Límite blando — no impone un límite duro del heap.',
  ['css for selectors, regex for free-form patterns']:
    'css para selectores, regex para patrones libres',
  ["CSS selector that pins the duplicate-fingerprint text extraction to a specific page region. When set, the heuristic (main / role=main / article / body-minus-chrome) is bypassed and the selector wins. Useful on sites where the heuristic misclassifies — e.g. CMSes that wrap navigation inside `<main>` or sites with no semantic landmarks at all. Empty = use the heuristic. Invalid selectors silently fall back to the heuristic so a typo doesn't break the crawl."]:
    'Selector CSS que fija la extracción de texto para la huella de duplicados a una región concreta de la página. Cuando está definido, la heurística (main / role=main / article / body-menos-chrome) se omite y gana el selector. Útil en sitios donde la heurística clasifica mal — p. ej. CMS que envuelven la navegación dentro de `<main>` o sitios sin landmarks semánticos. Vacío = usar la heurística. Los selectores no válidos recurren silenciosamente a la heurística para que una errata no rompa el rastreo.',
  ["Cumulative Layout Shift from PageSpeed Insights, when present. Google's 'good' CLS threshold is 0.1. Unitless; accepts decimals. Pages without PSI data are never flagged."]:
    "Cumulative Layout Shift de PageSpeed Insights, cuando está presente. El umbral 'bueno' de CLS según Google es 0.1. Sin unidades; acepta decimales. Las páginas sin datos de PSI nunca se marcan.",
  ['Drives the View Source detail tab. ~30–200 KB on disk per HTML page; turn off if you only need metadata and not full source viewing.']:
    'Alimenta la pestaña de detalle Ver código fuente. ~30–200 KB en disco por página HTML; desactívalo si solo necesitas metadatos y no la vista del código completo.',
  ["Each rule runs JavaScript RegExp.replace on the fully-normalised URL. Flags default to 'g'. After all rules run, the result is re-parsed as a URL — if the rewrite produces an invalid URL, the link is dropped at normalisation time."]:
    "Cada regla ejecuta RegExp.replace de JavaScript sobre la URL completamente normalizada. Los flags por defecto son 'g'. Tras ejecutar todas las reglas, el resultado se vuelve a analizar como URL — si la reescritura produce una URL no válida, el enlace se descarta en la normalización.",
  ["Empty = safest. 'chrome' if you want the same Chrome version your users see."]:
    "Vacío = lo más seguro. 'chrome' si quieres la misma versión de Chrome que ven tus usuarios.",
  ["Empty = use the bundled Playwright Chromium build (recommended — pinned version, works everywhere). 'chrome' / 'msedge' uses the system-installed browser. Beta channels for testing newer features."]:
    "Vacío = usar la build de Chromium incluida con Playwright (recomendado — versión fijada, funciona en todas partes). 'chrome' / 'msedge' usa el navegador instalado en el sistema. Canales beta para probar funciones más recientes.",
  ["Fetch internal <img> resources (incl. srcset / <picture> sources) so they appear in the Internal tab with their own status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl)."]:
    "Descargar los recursos <img> internos (incl. srcset / fuentes de <picture>) para que aparezcan en la pestaña Interno con su propio código de estado, tipo de contenido y tamaño. Cada uno cuenta para Máx. URL. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl).",
  ["Fetch internal <link rel=stylesheet> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl)."]:
    "Descargar los recursos <link rel=stylesheet> internos para que aparezcan en la pestaña Interno con código de estado, tipo de contenido y tamaño. Cada uno cuenta para Máx. URL. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl).",
  ["Fetch internal <script src> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl)."]:
    "Descargar los recursos <script src> internos para que aparezcan en la pestaña Interno con código de estado, tipo de contenido y tamaño. Cada uno cuenta para Máx. URL. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl).",
  ["Fetches /robots.txt sitemap directives + /sitemap.xml fallbacks. Powers the 'Non-Indexable in Sitemap' issue filter. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl)."]:
    "Obtiene las directivas sitemap de /robots.txt + las alternativas /sitemap.xml. Alimenta el filtro de problemas 'No indexable en el sitemap'. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl).",
  ["first/last for single value, all for JSON array, concat for ' | ' joined string"]:
    "first/last para un solo valor, all para un array JSON, concat para una cadena unida con ' | '",
  ['FNV-1a 64-bit hash of the normalised body token stream. Two pages sharing this hash are byte-identical post-tokenisation — the basis of the Exact Duplicate filter.']:
    'Hash FNV-1a de 64 bits del flujo de tokens normalizado del cuerpo. Dos páginas que comparten este hash son idénticas byte a byte tras la tokenización — la base del filtro Duplicado exacto.',
  ['For Basic, sent base64-encoded; for Digest, hashed into the challenge response.']:
    'Para Basic se envía codificada en base64; para Digest se incorpora al hash de la respuesta al desafío.',
  ['For regex: `regex_group` extracts capture group 1; otherwise the whole match is used.']:
    'Para regex: `regex_group` extrae el grupo de captura 1; en caso contrario se usa la coincidencia completa.',
  ['Full-page renders the entire scrollable canvas; Above-the-fold captures just the initial viewport (cheaper). Both writes two PNGs per URL.']:
    'Página completa renderiza todo el lienzo desplazable; Above-the-fold captura solo la ventana inicial (más barato). Ambos escriben dos PNG por URL.',
  ['Google\'s index status, pulled from the URL Inspection API — not the Fetch button. Click "Inspect (top 100)" to fill this column; Fetch only pulls clicks / impressions / position.']:
    'Estado de indexación de Google, obtenido de la API URL Inspection — no del botón Obtener. Haz clic en "Inspeccionar (top 100)" para rellenar esta columna; Obtener solo trae clics / impresiones / posición.',
  ["Googlebot — Smartphone matches Google's mobile-first indexing crawler."]:
    'Googlebot — Smartphone coincide con el rastreador de indexación mobile-first de Google.',
  ['Hard cap on pending URLs held in memory. Excess discoveries are dropped silently — bounds peak heap during fan-out bursts (big sitemaps, dense link graphs).']:
    'Límite duro de URL pendientes mantenidas en memoria. Los descubrimientos sobrantes se descartan en silencio — acota el heap máximo durante ráfagas de expansión (sitemaps grandes, grafos de enlaces densos).',
  ['Hard cap on the number of 3xx hops we follow for a single chain. Each hop is recorded as its own URL row regardless. 0 disables the cap (chain still ends at `redirect_loop`).']:
    'Límite duro del número de saltos 3xx que seguimos en una sola cadena. Cada salto se registra como su propia fila de URL de todos modos. 0 desactiva el límite (la cadena sigue terminando en `redirect_loop`).',
  ["Hard cap on total URLs crawled. The crawl stops as soon as this is reached. Screaming Frog: 'Limit Crawl Total'."]:
    "Límite duro del total de URL rastreadas. El rastreo se detiene en cuanto se alcanza. Screaming Frog: 'Limit Crawl Total'.",
  ["Hard ceiling on requests per second across all workers combined. Equivalent to Screaming Frog's 'Max URL/s'. Acts as a token bucket — even with high concurrency the crawler waits between bursts to stay below this rate."]:
    "Techo duro de peticiones por segundo entre todos los workers combinados. Equivale al 'Max URL/s' de Screaming Frog. Funciona como un token bucket — incluso con alta concurrencia el rastreador espera entre ráfagas para mantenerse por debajo de esta tasa.",
  ['Height attribute value (in pixels) declared on the <img> tag, when present.']:
    'Valor del atributo height (en píxeles) declarado en la etiqueta <img>, cuando existe.',
  ["Honor Disallow rules + crawl-delay declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "Respetar las reglas Disallow + crawl-delay declaradas en /robots.txt para el User-Agent configurado. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt).",
  ["Hop count from the start URL. Start URL is depth 0; its outlinks are depth 1, theirs depth 2, and so on. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits)."]:
    "Número de saltos desde la URL inicial. La URL inicial tiene profundidad 0; sus enlaces salientes profundidad 1, los de estos profundidad 2, y así sucesivamente. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits).",
  ['How many distinct pages reference this image. High values typically indicate site-wide assets (logos, icons).']:
    'Cuántas páginas distintas hacen referencia a esta imagen. Valores altos suelen indicar recursos de todo el sitio (logotipos, iconos).',
  ["How to canonicalise paths with/without a trailing slash. 'Add' is file-extension aware — won't add a slash to /file.pdf or /image.png."]:
    "Cómo canonicalizar rutas con/sin barra final. 'Añadir' tiene en cuenta la extensión de archivo — no añadirá una barra a /file.pdf ni a /image.png.",
  ['HTML attribute name to read.']: 'Nombre del atributo HTML a leer.',
  ['HTML transfer size of the page document. Heavy HTML payloads delay first paint. Stored as bytes internally; entered here in kilobytes.']:
    'Tamaño de transferencia HTML del documento de la página. Las cargas HTML pesadas retrasan el primer pintado. Se almacena en bytes internamente; aquí se introduce en kilobytes.',
  ['HTTP `<img>` / `<video>` / `<audio>` / `<source>` references on an HTTPS page — rendered but the URL bar reads "Not Secure".']:
    'Referencias HTTP de `<img>` / `<video>` / `<audio>` / `<source>` en una página HTTPS — se renderizan pero la barra de direcciones muestra "No es seguro".',
  ['HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` references on an HTTPS page — browsers BLOCK these silently.']:
    'Referencias HTTP de `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` en una página HTTPS — los navegadores las BLOQUEAN silenciosamente.',
  ['HTTP response status code. Empty/Failed indicates a network error before any response was received.']:
    'Código de estado de la respuesta HTTP. Vacío/Fallido indica un error de red antes de recibir ninguna respuesta.',
  ['HTTP status of the source page itself. Usually 200; if non-2xx the broken link may be inherited.']:
    'Estado HTTP de la propia página de origen. Normalmente 200; si no es 2xx, el enlace roto puede ser heredado.',
  ['HTTP status returned by the target. 0 = network failure (DNS, TLS, timeout).']:
    'Estado HTTP devuelto por el destino. 0 = fallo de red (DNS, TLS, tiempo de espera).',
  ["HTTP/HTTPS proxies route via undici's ProxyAgent; SOCKS proxies (socks5://, socks5h://, socks4://, socks4a://) tunnel via the socks client. The `h`/`4a` variants resolve DNS at the proxy. Leave empty to inherit HTTPS_PROXY/HTTP_PROXY env vars."]:
    'Los proxies HTTP/HTTPS se enrutan mediante el ProxyAgent de undici; los proxies SOCKS (socks5://, socks5h://, socks4://, socks4a://) se tunelizan mediante el cliente socks. Las variantes `h`/`4a` resuelven el DNS en el proxy. Déjalo vacío para heredar las variables de entorno HTTPS_PROXY/HTTP_PROXY.',
  ["Identifies the largest element visible in the initial viewport (likely LCP candidate per Google's heuristic) and stores its CSS selector, dimensions, and resource URL. Useful for spotting unoptimised LCP images without a PSI API call."]:
    'Identifica el elemento más grande visible en la ventana inicial (candidato probable a LCP según la heurística de Google) y almacena su selector CSS, dimensiones y URL del recurso. Útil para detectar imágenes LCP sin optimizar sin una llamada a la API de PSI.',
  ['If set, Playwright waits for this CSS selector to appear in the DOM before extracting HTML. Overrides the extra-wait timeout when present. Useful when you know the SPA reveals a specific element after hydration.']:
    'Si se define, Playwright espera a que este selector CSS aparezca en el DOM antes de extraer el HTML. Anula el tiempo de espera adicional cuando está presente. Útil cuando sabes que la SPA muestra un elemento concreto tras la hidratación.',
  ['Images on this page that have no alt attribute. WCAG accessibility issue + missed alt-as-anchor SEO opportunity.']:
    'Imágenes de esta página sin atributo alt. Problema de accesibilidad WCAG + oportunidad SEO perdida de alt como texto ancla.',
  ['Indexable / Non-Indexable']: 'Indexable / No indexable',
  ['Internal PageRank, 0–100. Computed over the internal link graph (damping 0.85) and normalised so the most-linked page scores 100. Higher = more internal link equity.']:
    'PageRank interno, 0–100. Calculado sobre el grafo de enlaces internos (amortiguación 0.85) y normalizado para que la página más enlazada puntúe 100. Más alto = más equidad de enlaces internos.',
  ['internal / external']: 'interno / externo',
  ['JavaScript executed in every page BEFORE navigation begins (init script). Use to set localStorage / cookies / mock APIs / disable animations. Runs in page context — no Node access.']:
    'JavaScript ejecutado en cada página ANTES de que comience la navegación (script de inicio). Úsalo para definir localStorage / cookies / simular API / desactivar animaciones. Se ejecuta en el contexto de la página — sin acceso a Node.',
  ['JavaScript regex (no flags — /g is implicit). Use a capture group with `output=regex_group` to extract just part of the match.']:
    'Regex de JavaScript (sin flags — /g es implícito). Usa un grupo de captura con `output=regex_group` para extraer solo parte de la coincidencia.',
  ['JavaScript regex tested against the full URL. Empty = all URLs allowed. URL must match at least one to be enqueued. The start URL is always permitted regardless.']:
    'Regex de JavaScript probada contra la URL completa. Vacío = todas las URL permitidas. La URL debe coincidir con al menos una para encolarse. La URL inicial siempre se permite.',
  ['JavaScript regex. Any match → URL is skipped, even if it would otherwise pass the include list. Common uses: skip admin areas, large file types, session-id query params.']:
    'Regex de JavaScript. Cualquier coincidencia → la URL se omite, aunque pasara la lista de inclusión. Usos comunes: omitir áreas de administración, tipos de archivo grandes, parámetros de sesión en la query.',
  ['JSON map of `{ term: count }` literal-substring hits from the configured Custom Search terms.']:
    'Mapa JSON de `{ term: count }` con coincidencias literales de subcadena de los términos de Búsqueda personalizada configurados.',
  ['JSON-stringified array of `{ lang, href }` pairs. Heavy column — better consumed via the URL Details panel.']:
    'Array serializado en JSON de pares `{ lang, href }`. Columna pesada — mejor consumirla desde el panel Detalles de URL.',
  ['JSON-stringified custom-extraction results map. Heavy column — render verbatim, easier to read in the URL Details panel.']:
    'Mapa de resultados de extracción personalizada serializado en JSON. Columna pesada — se muestra tal cual, más fácil de leer en el panel Detalles de URL.',
  ['JSONPath against a JSON response body (e.g. `application/json` APIs). Only runs on responses that parse as JSON — ignored on HTML pages.']:
    'JSONPath contra el cuerpo de una respuesta JSON (p. ej. API `application/json`). Solo se ejecuta en respuestas que se analizan como JSON — se ignora en páginas HTML.',
  ['JSONPath returns the matched JSON value as-is; choose `Count` to return the number of matches instead.']:
    'JSONPath devuelve el valor JSON coincidente tal cual; elige `Count` para devolver el número de coincidencias en su lugar.',
  ["Largest Contentful Paint from PageSpeed Insights lab data, when the URL has been audited. Google's 'good' LCP threshold is 2500 ms. Pages without PSI data are never flagged on this metric."]:
    "Largest Contentful Paint de los datos de laboratorio de PageSpeed Insights, cuando la URL ha sido auditada. El umbral 'bueno' de LCP según Google es 2500 ms. Las páginas sin datos de PSI nunca se marcan por esta métrica.",
  ['load = good default. networkidle for heavy SPAs. domcontentloaded if you only need raw HTML.']:
    'load = buen valor por defecto. networkidle para SPA pesadas. domcontentloaded si solo necesitas el HTML sin procesar.',
  ['Location header value when status is 3xx. The URL the server points to next; chain length is in the URL Details panel.']:
    'Valor de la cabecera Location cuando el estado es 3xx. La URL a la que apunta el servidor a continuación; la longitud de la cadena está en el panel Detalles de URL.',
  ['Lowercases the URL path component. Host is already case-insensitive per the URL spec, so this only affects the path.']:
    'Pasa a minúsculas el componente de ruta de la URL. El host ya es insensible a mayúsculas según la especificación de URL, así que esto solo afecta a la ruta.',
  ['Near-duplicate cluster ID assigned by the post-crawl SimHash pass. 0 = singleton (no near-duplicates within the configured Hamming threshold). Pages sharing a non-zero cluster ID are mutually similar.']:
    'ID del grupo de casi duplicados asignado por la pasada SimHash posterior al rastreo. 0 = singleton (sin casi duplicados dentro del umbral de Hamming configurado). Las páginas que comparten un ID distinto de cero son mutuamente similares.',
  ['noindex, canonicalised, redirected, blocked-by-robots']:
    'noindex, canonicalizada, redirigida, bloqueada por robots',
  ['None for fastest crawl. Above-the-fold for SERP-thumbnail-style preview. Full page when you need long-page snapshots.']:
    'Ninguna para el rastreo más rápido. Above-the-fold para una vista previa tipo miniatura de SERP. Página completa cuando necesitas instantáneas de páginas largas.',
  ['Number of `<form action="http://…">` declarations on an HTTPS page. Submitting one downgrades the connection.']:
    'Número de declaraciones `<form action="http://…">` en una página HTTPS. Enviar una degrada la conexión.',
  ['Number of `<link rel="alternate" hreflang>` entries declared on this page. 0 = no alternates declared.']:
    'Número de entradas `<link rel="alternate" hreflang>` declaradas en esta página. 0 = no se declaran alternativas.',
  ['Number of `<link rel="canonical">` tags on the page. >1 is a "Multiple Canonicals" issue.']:
    'Número de etiquetas `<link rel="canonical">` en la página. >1 es un problema de "Múltiples canonicals".',
  ['Number of `<script type="application/ld+json">` blocks parsed successfully on the page.']:
    'Número de bloques `<script type="application/ld+json">` analizados correctamente en la página.',
  ['Number of `<script type="application/ld+json">` blocks that failed to parse as JSON.']:
    'Número de bloques `<script type="application/ld+json">` que no se pudieron analizar como JSON.',
  ['Number of <img> elements on the page.']: 'Número de elementos <img> en la página.',
  ['Number of browser tabs the pool keeps warm in parallel. 0 = auto (matches crawler concurrency, capped at 8). More tabs = faster crawl but more RAM (each tab ~80–150 MB).']:
    'Número de pestañas del navegador que el pool mantiene abiertas en paralelo. 0 = automático (coincide con la concurrencia del rastreador, con un máximo de 8). Más pestañas = rastreo más rápido pero más RAM (cada pestaña ~80–150 MB).',
  ['Number of hreflang targets that are non-200, noindex, or canonicalised away. Aggregated by the post-crawl pass.']:
    'Número de destinos hreflang que no son 200, tienen noindex o están canonicalizados a otra URL. Agregado por la pasada posterior al rastreo.',
  ["Number of HTTP requests in flight at any one time. Equivalent to Screaming Frog's 'Max Threads'. Higher = faster crawl + more load on the target server."]:
    "Número de peticiones HTTP en vuelo en un momento dado. Equivale al 'Max Threads' de Screaming Frog. Más alto = rastreo más rápido + más carga en el servidor de destino.",
  ['Number of internal `<a>` elements with no usable anchor text or alt — accessibility / SEO regression.']:
    'Número de elementos `<a>` internos sin texto ancla ni alt utilizable — regresión de accesibilidad / SEO.',
  ['Number of internal pages that link to this URL. A rough internal-PageRank signal.']:
    'Número de páginas internas que enlazan a esta URL. Una señal aproximada de PageRank interno.',
  ["Number of pages in this URL's near-duplicate cluster (1 = no duplicates, ≥2 = part of a duplicate group). Tunable via Settings → Duplicates."]:
    'Número de páginas en el grupo de casi duplicados de esta URL (1 = sin duplicados, ≥2 = parte de un grupo duplicado). Ajustable en Ajustes → Duplicados.',
  ['Number of redirect hops from this URL to its terminal target. Filled by the post-crawl `recomputeRedirectChains` walker. >3 trips the "Long Chain" issue.']:
    'Número de saltos de redirección desde esta URL hasta su destino final. Lo rellena el recorrido `recomputeRedirectChains` posterior al rastreo. >3 dispara el problema "Cadena larga".',
  ['Number of unique <a> links emitted from this page (internal + external).']:
    'Número de enlaces <a> únicos emitidos desde esta página (internos + externos).',
  ['Off — only enable for testing edge cases.']:
    'Desactivado — actívalo solo para probar casos límite.',
  ['Off — small speed gain not worth the fidelity loss.']:
    'Desactivado — la pequeña ganancia de velocidad no compensa la pérdida de fidelidad.',
  ['On — fonts add overhead without changing SEO output.']:
    'Activado — las fuentes añaden sobrecarga sin cambiar el resultado SEO.',
  ['On (default) — cheap I/O, high SEO value.']:
    'Activado (por defecto) — E/S barata, alto valor SEO.',
  ['On (default) — media is heavy and rarely SEO-relevant.']:
    'Activado (por defecto) — los medios son pesados y rara vez relevantes para SEO.',
  ['On (default) so the Internal tab shows images, not just HTML; off for HTML-only crawls.']:
    'Activado (por defecto) para que la pestaña Interno muestre imágenes y no solo HTML; desactivado para rastreos solo HTML.',
  ['On (default); off for HTML-only crawls.']:
    'Activado (por defecto); desactivado para rastreos solo HTML.',
  ['On (default). Off only when crawling sites you own and need to bypass.']:
    'Activado (por defecto). Desactívalo solo al rastrear sitios de tu propiedad que necesites saltarte.',
  ['On for accessibility / WCAG audits.']: 'Activado para auditorías de accesibilidad / WCAG.',
  ['On for max speed. Off if you need LCP candidate detection or visual screenshots later.']:
    'Activado para máxima velocidad. Desactivado si más adelante necesitas detección de candidatos LCP o capturas visuales.',
  ['On for modern sites that 301 http→https anyway; off for legacy intranet.']:
    'Activado para sitios modernos que de todos modos redirigen 301 de http a https; desactivado para intranets heredadas.',
  ['On for normal audits; off when you only want to inspect raw 3xx behaviour.']:
    'Activado para auditorías normales; desactivado cuando solo quieres inspeccionar el comportamiento 3xx sin procesar.',
  ['On for outbound link audits; off for fast internal-only crawls.']:
    'Activado para auditorías de enlaces salientes; desactivado para rastreos rápidos solo internos.',
  ['On for performance-focused audits that should fail pages over a target.']:
    'Activado para auditorías centradas en rendimiento que deban suspender las páginas por encima de un objetivo.',
  ['On for performance-focused audits.']: 'Activado para auditorías centradas en rendimiento.',
  ['On for production crawls. Off when debugging selector-not-found / hydration issues.']:
    'Activado para rastreos de producción. Desactivado al depurar problemas de selector no encontrado / hidratación.',
  ['ON for SEO audits (the typical case). Turn OFF to also cluster paginated / canonical-blocked variants for completeness.']:
    'ACTIVADO para auditorías SEO (el caso típico). DESACTÍVALO para agrupar también variantes paginadas / bloqueadas por canonical, por exhaustividad.',
  ["On for SEO audits that include Google's Mobile-Friendly checks."]:
    'Activado para auditorías SEO que incluyan las comprobaciones Mobile-Friendly de Google.',
  ['On for SEO audits where View Source matters; off for 1M-URL crawls where disk is tight.']:
    'Activado para auditorías SEO donde importa Ver código fuente; desactivado para rastreos de 1M de URL con poco espacio en disco.',
  ['ON for SEO audits. OFF only when you specifically need to inspect raw-URL collisions (e.g. case-sensitive filesystem CMSes).']:
    'ACTIVADO para auditorías SEO. DESACTÍVALO solo cuando necesites inspeccionar específicamente colisiones de URL sin procesar (p. ej. CMS con sistemas de archivos sensibles a mayúsculas).',
  ['On if you need nofollow attribute audits; off keeps the link graph cleaner.']:
    'Activado si necesitas auditar el atributo nofollow; desactivado mantiene el grafo de enlaces más limpio.',
  ['On if your CMS serves the same page at mixed casing (/Foo and /foo).']:
    'Activado si tu CMS sirve la misma página con mayúsculas y minúsculas mezcladas (/Foo y /foo).',
  ['On if your site canonicalises to non-www but emits www links somewhere.']:
    'Activado si tu sitio canonicaliza a sin www pero emite enlaces con www en algún lugar.',
  ["On network errors, 408/425/429/5xx responses, retry up to N more times before giving up. Each retry counts toward the URL's response time budget."]:
    'Ante errores de red o respuestas 408/425/429/5xx, reintentar hasta N veces más antes de desistir. Cada reintento cuenta para el presupuesto de tiempo de respuesta de la URL.',
  ['On when auditing mobile UX or capturing PageSpeed-style mobile previews.']:
    'Activado al auditar la UX móvil o capturar vistas previas móviles estilo PageSpeed.',
  ["One header per line in 'Key: Value' format. Added to every request — useful for auth tokens or custom routing hints. User values override defaults when keys collide."]:
    "Una cabecera por línea en formato 'Clave: Valor'. Se añade a cada petición — útil para tokens de autenticación o indicaciones de enrutado personalizadas. Los valores del usuario prevalecen sobre los predeterminados cuando las claves coinciden.",
  ['One sitemap URL per line. On top of following links from the start URL, the crawler fetches these sitemaps and queues every page they list as an extra seed — faster/more complete discovery, and reliable orphan detection even when the sitemap lives at a non-standard path. Leave empty to disable.']:
    'Una URL de sitemap por línea. Además de seguir los enlaces desde la URL inicial, el rastreador obtiene estos sitemaps y encola cada página que listan como semilla extra — descubrimiento más rápido/completo y detección fiable de páginas huérfanas incluso cuando el sitemap está en una ruta no estándar. Déjalo vacío para desactivar.',
  ['One URL per line. Each is fetched exactly once; outlinks are NOT followed. Comments starting with # are ignored.']:
    'Una URL por línea. Cada una se obtiene exactamente una vez; los enlaces salientes NO se siguen. Los comentarios que empiezan por # se ignoran.',
  ['OS scheduler hint applied at crawl start. Lowering priority lets the rest of the machine stay responsive during heavy crawls. May require elevated privileges on some platforms.']:
    'Indicación al planificador del SO aplicada al inicio del rastreo. Bajar la prioridad permite que el resto de la máquina siga respondiendo durante rastreos pesados. Puede requerir privilegios elevados en algunas plataformas.',
  ["Page A→B declared but B→A absent flags 'Reciprocity Missing'; same lang on two hrefs flags 'Inconsistent Lang'."]:
    "Página A→B declarada pero B→A ausente marca 'Reciprocidad ausente'; el mismo lang en dos href marca 'Lang inconsistente'.",
  ['Page that contains the broken link.']: 'Página que contiene el enlace roto.',
  ["Pages with > this many outgoing links (internal + external) trip the 'Total Links per Page' issue. Google's historic recommendation is 100; mega-menus/hub-pages routinely blow past this."]:
    "Las páginas con más de esta cantidad de enlaces salientes (internos + externos) disparan el problema 'Enlaces totales por página'. La recomendación histórica de Google es 100; los megamenús/páginas hub la superan de forma rutinaria.",
  ['PASS = indexed · FAIL = not indexed · PART/NEU = discovered but not yet indexed']:
    'PASS = indexada · FAIL = no indexada · PART/NEU = descubierta pero aún no indexada',
  ['Pattern: ^https://m\\.(.+) · Replacement: https://www.$1 · Flags: i  (collapse mobile subdomain to www)']:
    'Patrón: ^https://m\\.(.+) · Reemplazo: https://www.$1 · Flags: i  (fusionar el subdominio móvil en www)',
  ["Per-request abort threshold. Pages that take longer than this are recorded as network errors. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — that one's in seconds, this is in milliseconds."]:
    "Umbral de cancelación por petición. Las páginas que tardan más que esto se registran como errores de red. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — aquel está en segundos, este en milisegundos.",
  ['Persist rel="nofollow" links in the link graph. When off, nofollow links are dropped entirely (not counted in outlinks, not probed as externals). Screaming Frog inverse: turning this ON ≈ unchecking "Follow Internal/External Nofollow".']:
    'Conservar los enlaces rel="nofollow" en el grafo de enlaces. Cuando está desactivado, los enlaces nofollow se descartan por completo (no cuentan en los enlaces salientes, no se sondean como externos). Inverso de Screaming Frog: activar esto ≈ desmarcar "Follow Internal/External Nofollow".',
  ['Picking a preset fills the User-Agent field below — you can still hand-edit it afterwards. Switch between Googlebot Smartphone / Desktop to compare how a site responds to mobile vs desktop crawlers.']:
    'Elegir un preajuste rellena el campo User-Agent de abajo — después puedes editarlo a mano. Alterna entre Googlebot Smartphone / Desktop para comparar cómo responde un sitio a rastreadores móviles y de escritorio.',
  ["Picks one of the saved profiles by name. Empty = use the Proxy URL field above (or env vars when that's also empty)."]:
    'Elige uno de los perfiles guardados por nombre. Vacío = usar el campo URL de proxy de arriba (o las variables de entorno cuando también esté vacío).',
  ['Pre-computes Dead External Domain, Duplicate URL post-norm, Canonical Chain Multi-hop. Without this the sidebar shows 0 for those three.']:
    'Precalcula Dominio externo muerto, URL duplicada tras normalizar y Cadena de canonicals multisalto. Sin esto, la barra lateral muestra 0 en esos tres.',
  ['After the crawl, re-fetches a sample of indexable pages with the opposite user agent (mobile when the crawl ran as desktop, desktop otherwise) and compares title, H1, meta description, canonical, robots, word count and link count. Differences feed the \'Mobile / Desktop Mismatch\' issue and the report of the same name.']:
    'Tras el rastreo, vuelve a descargar una muestra de páginas indexables con el user agent opuesto (móvil si el rastreo fue de escritorio, y viceversa) y compara título, H1, meta descripción, canonical, robots, número de palabras y de enlaces. Las diferencias alimentan el problema \'Discrepancia móvil / escritorio\' y el informe homónimo.',
  ['How many pages the mobile-parity probe re-fetches, most-linked first. 0 = every indexable HTML page (doubles the crawl\'s traffic for that set).']:
    'Cuántas páginas vuelve a descargar la sonda de paridad móvil, primero las más enlazadas. 0 = todas las páginas HTML indexables (duplica el tráfico del rastreo para ese conjunto).',
  ["Probe outbound links to other hosts (HEAD only) so the Broken Links view catches dead externals. Screaming Frog: 'External Links' (Configuration → Spider → Crawl)."]:
    "Sondear los enlaces salientes a otros hosts (solo HEAD) para que la vista Enlaces rotos detecte externos muertos. Screaming Frog: 'External Links' (Configuration → Spider → Crawl).",
  ['Raw `Content-Security-Policy` response header. Empty when missing.']:
    'Cabecera de respuesta `Content-Security-Policy` sin procesar. Vacía cuando falta.',
  ['Raw `content` attribute of `<meta http-equiv="refresh">`, e.g. "5; url=/foo".']:
    'Atributo `content` sin procesar de `<meta http-equiv="refresh">`, p. ej. "5; url=/foo".',
  ['Raw `Strict-Transport-Security` header. Empty when missing — for HTTPS pages this is a security regression.']:
    'Cabecera `Strict-Transport-Security` sin procesar. Vacía cuando falta — para páginas HTTPS esto es una regresión de seguridad.',
  ['Raw `X-Content-Type-Options` header. `nosniff` blocks MIME sniffing — prevents some XSS via content-type confusion.']:
    'Cabecera `X-Content-Type-Options` sin procesar. `nosniff` bloquea el sniffing de MIME — evita algunos XSS por confusión de content-type.',
  ['Raw `X-Frame-Options` header. SAMEORIGIN / DENY / ALLOW-FROM. Clickjacking defence.']:
    'Cabecera `X-Frame-Options` sin procesar. SAMEORIGIN / DENY / ALLOW-FROM. Defensa contra clickjacking.',
  ['Raw value of the Content-Type response header (incl. charset).']:
    'Valor sin procesar de la cabecera de respuesta Content-Type (incl. charset).',
  ['Re-renders each page on a mobile viewport and checks viewport meta tag, horizontal overflow, font size legibility, and tap-target spacing. Stores a pass/fail verdict on the urls table.']:
    'Vuelve a renderizar cada página en una ventana móvil y comprueba la etiqueta meta viewport, el desbordamiento horizontal, la legibilidad del tamaño de fuente y el espaciado de los objetivos táctiles. Almacena un veredicto pasa/falla en la tabla urls.',
  ['Read the full article →']: 'Leer el artículo completo →',
  ["Reject-all = ignore Set-Cookie entirely (zero counts on cookie-flag issues). Block-third-party = analyse only first-party cookies (Domain attribute matches the page's registrable domain). Accept-all = analyse every Set-Cookie regardless of scope."]:
    'Rechazar todo = ignorar Set-Cookie por completo (cero recuentos en los problemas de flags de cookies). Bloquear terceros = analizar solo cookies propias (el atributo Domain coincide con el dominio registrable de la página). Aceptar todo = analizar cada Set-Cookie sin importar el alcance.',
  ["Reject-all for stateless audits; Block-third-party to focus on the site's own cookie hygiene; Accept-all to also see ad/analytics tracker cookies."]:
    'Rechazar todo para auditorías sin estado; Bloquear terceros para centrarse en la higiene de cookies del propio sitio; Aceptar todo para ver también cookies de rastreadores de anuncios/analítica.',
  ["Removes the leading 'www.' from the host at normalisation time. The seen-set, redirect graph, and link extraction all use the rewritten form, so duplicates collapse correctly."]:
    "Elimina el 'www.' inicial del host en la normalización. El conjunto de vistos, el grafo de redirecciones y la extracción de enlaces usan la forma reescrita, así que los duplicados se fusionan correctamente.",
  ['Renders the page a second time on a mobile viewport and stores an above-the-fold PNG. Adds another full render + screenshot per URL.']:
    'Renderiza la página una segunda vez en una ventana móvil y almacena un PNG above-the-fold. Añade otro renderizado completo + captura por URL.',
  ['Resolved absolute URL of the <img src> attribute.']:
    'URL absoluta resuelta del atributo <img src>.',
  ['Response body size in bytes (compressed transfer size, post-Content-Encoding).']:
    'Tamaño del cuerpo de la respuesta en bytes (tamaño de transferencia comprimido, tras Content-Encoding).',
  ['Rewrites http:// to https:// before fetching. Breaks HTTP-only sites.']:
    'Reescribe http:// a https:// antes de obtener. Rompe los sitios solo HTTP.',
  ['Run Chromium without a visible window. Turn off to debug rendering visually — useful when a page renders correctly in a normal browser but not under Playwright.']:
    'Ejecutar Chromium sin ventana visible. Desactívalo para depurar el renderizado visualmente — útil cuando una página se renderiza correctamente en un navegador normal pero no bajo Playwright.',
  ['Run the login steps once before the crawl, then replay the session cookies on every request.']:
    'Ejecutar los pasos de inicio de sesión una vez antes del rastreo y reutilizar las cookies de sesión en cada petición.',
  ["Runs iterative PageRank (damping 0.85) over the internal link graph and normalises it to a 0–100 Link Score per page. Drives the Link Score column and the 'By Link Score' visualization colour mode."]:
    "Ejecuta PageRank iterativo (amortiguación 0.85) sobre el grafo de enlaces internos y lo normaliza a una Puntuación de enlaces de 0–100 por página. Alimenta la columna Puntuación de enlaces y el modo de color 'Por puntuación de enlaces' de la visualización.",
  ['Sends the URL through the same normalisation pipeline used by the crawler, with your unsaved settings applied. Useful for verifying regex rules before kicking off a crawl.']:
    'Pasa la URL por la misma canalización de normalización que usa el rastreador, con tus ajustes sin guardar aplicados. Útil para verificar reglas regex antes de lanzar un rastreo.',
  ['Sent on every request as the User-Agent header. Identifies the crawler to servers; some sites serve different content based on UA.']:
    'Se envía en cada petición como cabecera User-Agent. Identifica el rastreador ante los servidores; algunos sitios sirven contenido distinto según el UA.',
  ['Sent on every request. Affects which locale a multi-lingual site serves you.']:
    'Se envía en cada petición. Afecta a qué configuración regional te sirve un sitio multilingüe.',
  ["Sent verbatim as `Bearer <token>`. Don't include the `Bearer ` prefix yourself."]:
    'Se envía tal cual como `Bearer <token>`. No incluyas tú el prefijo `Bearer `.',
  ['Server response time (a TTFB proxy) measured during the crawl. Pages slower than this are flagged. Google considers a good server response time under 800 ms.']:
    'Tiempo de respuesta del servidor (un indicador de TTFB) medido durante el rastreo. Las páginas más lentas que esto se marcan. Google considera bueno un tiempo de respuesta del servidor por debajo de 800 ms.',
  ['Shop the latest game keys at unbeatable prices…']:
    'Compra las últimas claves de juegos a precios imbatibles…',
  ["Skips body parsing for pages whose Content-Length header exceeds this. The page row is still created so links to it aren't lost; only body parsing and source snapshot capture are skipped."]:
    'Omite el análisis del cuerpo en páginas cuya cabecera Content-Length supere este valor. La fila de la página se crea igualmente para no perder los enlaces hacia ella; solo se omiten el análisis del cuerpo y la captura del código fuente.',
  ['Sleep this long on each worker AFTER a response completes, before it picks up the next URL. Stacks with the global RPS cap — useful for sites that rate-limit on inter-request gap rather than total throughput.']:
    'Dormir este tiempo en cada worker DESPUÉS de completarse una respuesta, antes de tomar la siguiente URL. Se acumula con el límite global de RPS — útil para sitios que limitan según el intervalo entre peticiones en lugar del rendimiento total.',
  ['Specific reason a URL is non-indexable. For Indexable URLs this column is empty.']:
    'Motivo concreto por el que una URL no es indexable. Para URL indexables esta columna está vacía.',
  ['Spider follows links from the start URL across the chosen scope. List fetches a fixed set of URLs once with no link-following. Sitemap fetches a sitemap URL and crawls every page it lists (no link-following).']:
    'Spider sigue los enlaces desde la URL inicial dentro del alcance elegido. Lista obtiene un conjunto fijo de URL una vez sin seguir enlaces. Sitemap obtiene una URL de sitemap y rastrea cada página que lista (sin seguir enlaces).',
  ["Spider for full site audits; List for re-checking a known set of pages; Sitemap to audit exactly what's published in sitemap.xml."]:
    'Spider para auditorías completas del sitio; Lista para volver a comprobar un conjunto conocido de páginas; Sitemap para auditar exactamente lo publicado en sitemap.xml.',
  ['Standard CSS selector — same syntax as `document.querySelectorAll`.']:
    'Selector CSS estándar — misma sintaxis que `document.querySelectorAll`.',
  ['Stored in your local prefs file as plain text. Treat the file accordingly.']:
    'Se guarda en tu archivo de preferencias local como texto sin cifrar. Trata el archivo en consecuencia.',
  ['Strip if your site canonicalises /foo (no slash); Add for sites that canonicalise /foo/.']:
    'Quitar si tu sitio canonicaliza /foo (sin barra); Añadir para sitios que canonicalizan /foo/.',
  ['Sunset over the mountain ridge']: 'Atardecer sobre la cresta de la montaña',
  ['Surplus `@id` occurrences across all JSON-LD blocks (page declares the same `@id` more than once).']:
    'Apariciones sobrantes de `@id` en todos los bloques JSON-LD (la página declara el mismo `@id` más de una vez).',
  ['Terminal URL the redirect chain resolves to. Empty when this row is itself the terminal (i.e. status is 2xx/4xx/5xx) or when the chain hits a loop.']:
    'URL final a la que resuelve la cadena de redirecciones. Vacío cuando esta fila es en sí el final (es decir, el estado es 2xx/4xx/5xx) o cuando la cadena entra en un bucle.',
  ['Canonical hops walked after this page (or, on a redirect row, after the redirect\'s final URL) until a page that canonicalises to itself. 0 when the canonical is the page itself or absent.']:
    'Saltos canonical recorridos después de esta página (o, en una fila de redirección, después de la URL final de la redirección) hasta una página que se canonicaliza a sí misma. 0 cuando el canonical es la propia página o no existe.',
  ['Where the canonical chain ends. Empty when the page is its own canonical, or when the chain loops.']:
    'Dónde termina la cadena canonical. Vacío cuando la página es su propio canonical o cuando la cadena forma un bucle.',
  ['text for visible content, attribute for href/src, count for occurrence count']:
    'text para el contenido visible, attribute para href/src, count para el número de apariciones',
  ['Text of the first <h1> on the page. Should match user intent and ideally complement (not duplicate) the title.']:
    'Texto del primer <h1> de la página. Debe coincidir con la intención del usuario e idealmente complementar (no duplicar) el título.',
  ["Text Only fetches the raw HTML response as-is — fast and deterministic. Old AJAX Crawling Scheme rewrites hashbang (#!) URLs to Google's deprecated ?_escaped_fragment_= form so a pre-rendering server returns the snapshot. Full JavaScript rendering is a V2 item."]:
    'Solo texto obtiene la respuesta HTML sin procesar tal cual — rápido y determinista. El antiguo AJAX Crawling Scheme reescribe las URL con hashbang (#!) a la forma obsoleta de Google ?_escaped_fragment_= para que un servidor de prerenderizado devuelva la instantánea. El renderizado JavaScript completo es un elemento de V2.',
  ['Text Only for server-rendered / static sites; Old AJAX only for legacy hashbang SPAs.']:
    'Solo texto para sitios estáticos / renderizados en servidor; AJAX antiguo solo para SPA heredadas con hashbang.',
  ["The column / JSON-key name for this rule's output. Free-form."]:
    'Nombre de columna / clave JSON para la salida de esta regla. Texto libre.',
  ['The fully normalised URL of the crawled resource (post URL-rewriting).']:
    'La URL completamente normalizada del recurso rastreado (tras la reescritura de URL).',
  ['The URL that fails to resolve (4xx/5xx/network error).']:
    'La URL que no se resuelve (4xx/5xx/error de red).',
  ['Third-party `<script>` / `<link rel=stylesheet>` references without an `integrity=` attribute. SRI is recommended for any cross-origin subresource.']:
    'Referencias de terceros `<script>` / `<link rel=stylesheet>` sin atributo `integrity=`. Se recomienda SRI para cualquier subrecurso de origen cruzado.',
  ['Time-to-first-byte in milliseconds (network + server, excluding parse). Lower is better; >2000 ms is slow.']:
    'Tiempo hasta el primer byte en milisegundos (red + servidor, sin incluir el análisis). Cuanto menor, mejor; >2000 ms es lento.',
  ['Total number of <h1> elements on the page. SEO best practice is exactly 1.']:
    'Número total de elementos <h1> en la página. La buena práctica SEO es exactamente 1.',
  ['Total number of <h2> elements on the page.']: 'Número total de elementos <h2> en la página.',
  ['tr,en;q=0.8 — Turkish first, English fallback.']:
    'tr,en;q=0.8 — turco primero, inglés como alternativa.',
  ["Trips 'Folder Depth Too Deep' when the URL path's `/`-segment count exceeds this. Useful for spotting over-nested URL structures that bury content from crawlers."]:
    "Dispara 'Profundidad de carpetas excesiva' cuando el número de segmentos `/` de la ruta de la URL supera este valor. Útil para detectar estructuras de URL demasiado anidadas que entierran el contenido para los rastreadores.",
  ["Trips 'Long Query String' when LENGTH(query) > this. Typical session-id sprawl + UTM tracking hits 100+ chars; over 200 starts to look like a bug."]:
    "Dispara 'Cadena de consulta larga' cuando LENGTH(query) > este valor. La típica proliferación de ids de sesión + seguimiento UTM alcanza los 100+ caracteres; por encima de 200 empieza a parecer un error.",
  ["Trips the 'URL Too Long' issue when LENGTH(url) > this. RFC 7230 doesn't mandate a max but most servers + middleboxes fail above ~2 KB; Chrome itself caps at ~32 KB."]:
    "Dispara el problema 'URL demasiado larga' cuando LENGTH(url) > este valor. El RFC 7230 no impone un máximo, pero la mayoría de servidores y middleboxes fallan por encima de ~2 KB; el propio Chrome limita a ~32 KB.",
  ["Two modes per line. (1) Wrap in slashes for a regex: /pattern/flags — supported flags imsuy (g is forced). Invalid patterns appear with count -1 in the detail panel so you can spot the typo. (2) Anything else is a literal case-insensitive substring — the legacy behaviour. Each term's per-page hit count is surfaced in the URL Details panel."]:
    'Dos modos por línea. (1) Envuelve entre barras para una regex: /patrón/flags — flags admitidos imsuy (g se fuerza). Los patrones no válidos aparecen con recuento -1 en el panel de detalle para que veas la errata. (2) Cualquier otra cosa es una subcadena literal sin distinguir mayúsculas — el comportamiento heredado. El recuento de coincidencias por página de cada término se muestra en el panel Detalles de URL.',
  ["Two pages are flagged as near-duplicates if their 64-bit SimHash differs by at most this many bits. 3 ≈ 95% similarity over body-text shingles (Screaming Frog's tightest filter). Set to 0 to skip clustering entirely."]:
    'Dos páginas se marcan como casi duplicadas si su SimHash de 64 bits difiere como máximo en esta cantidad de bits. 3 ≈ 95 % de similitud sobre shingles del texto del cuerpo (el filtro más estricto de Screaming Frog). Pon 0 para omitir la agrupación por completo.',
  ['URL declared by the first <link rel="canonical"> tag. Tells search engines which version to index when duplicates exist.']:
    'URL declarada por la primera etiqueta <link rel="canonical">. Indica a los buscadores qué versión indexar cuando existen duplicados.',
  ['URL paths ending in any of these extensions are not enqueued. Case-insensitive. Start URL is always crawled regardless.']:
    'Las rutas de URL que terminan en cualquiera de estas extensiones no se encolan. Sin distinguir mayúsculas. La URL inicial siempre se rastrea de todos modos.',
  ['Value of the alt attribute. Empty cell = no alt declared (accessibility/SEO issue).']:
    'Valor del atributo alt. Celda vacía = sin alt declarado (problema de accesibilidad/SEO).',
  ['Value of the X-Robots-Tag HTTP response header. Same semantics as meta robots but applied at the server.']:
    'Valor de la cabecera de respuesta HTTP X-Robots-Tag. Misma semántica que meta robots pero aplicada en el servidor.',
  ['Viewport height — affects above-the-fold detection and lazy-load triggers.']:
    'Alto de la ventana — afecta a la detección above-the-fold y a los disparadores de carga diferida.',
  ['Viewport width applied to every rendered page. Mobile audits typically use 360–414, desktop 1280–1920.']:
    'Ancho de la ventana aplicado a cada página renderizada. Las auditorías móviles suelen usar 360–414, las de escritorio 1280–1920.',
  ['Visible body text word count (excludes <script>/<style>). Useful for identifying thin content.']:
    'Número de palabras del texto visible del cuerpo (excluye <script>/<style>). Útil para identificar contenido escaso.',
  ['Wait this long before the FIRST retry, doubling on each subsequent attempt (500 → 1000 → 2000 …).']:
    'Esperar este tiempo antes del PRIMER reintento, duplicándolo en cada intento siguiente (500 → 1000 → 2000 …).',
  ["Walks 3xx redirect chains, fills `redirect_chain_length` / `redirect_loop`. Drives the 'Long Chain' and 'Redirect Loop' issues + the Redirects tab."]:
    "Recorre las cadenas de redirecciones 3xx y rellena `redirect_chain_length` / `redirect_loop`. Alimenta los problemas 'Cadena larga' y 'Bucle de redirección' + la pestaña Redirecciones.",
  ['Welcome to Example Store']: 'Bienvenido a la Tienda de ejemplo',
  ['What to do when multiple matches exist.']: 'Qué hacer cuando existen múltiples coincidencias.',
  ['What to read off each matched element. Ignored for an XPath `/@attr` or `/text()` terminal — that value is used directly.']:
    'Qué leer de cada elemento coincidente. Se ignora para un terminal XPath `/@attr` o `/text()` — ese valor se usa directamente.',
  ['When non-empty, ALL query parameters not on this list are dropped during normalisation (case-insensitive name match). Leave empty to keep the default behaviour, which strips just utm_*, fbclid, gclid, mc_cid, and mc_eid.']:
    'Cuando no está vacío, TODOS los parámetros de consulta que no estén en esta lista se eliminan durante la normalización (coincidencia de nombre sin distinguir mayúsculas). Déjalo vacío para mantener el comportamiento por defecto, que elimina solo utm_*, fbclid, gclid, mc_cid y mc_eid.',
  ['When off, no budget evaluation runs and the verdict column is cleared. When on, the post-crawl pass scores every internal 200 HTML page against the ceilings below.']:
    'Cuando está desactivado, no se evalúa ningún presupuesto y la columna de veredicto se vacía. Cuando está activado, la pasada posterior al rastreo puntúa cada página HTML 200 interna contra los techos de abajo.',
  ['When on (default), pagination_next + pagination_prev URLs are post-fetch enqueued. Off only to debug pagination-only loops without disabling all link follow.']:
    'Cuando está activado (por defecto), las URL pagination_next + pagination_prev se encolan tras la obtención. Desactívalo solo para depurar bucles exclusivos de paginación sin desactivar todo el seguimiento de enlaces.',
  ['When ON (default), the Duplicate URL filter compares URLs after lowercasing the host, dropping the query string, and trimming the trailing slash — the canonical SEO behaviour. When OFF, comparison is byte-exact, so the filter only fires on rows that share an identical raw URL string (rare since URLs are deduped at insert time).']:
    'Cuando está ACTIVADO (por defecto), el filtro URL duplicada compara las URL tras pasar el host a minúsculas, eliminar la cadena de consulta y recortar la barra final — el comportamiento SEO canónico. Cuando está DESACTIVADO, la comparación es byte a byte, así que el filtro solo salta en filas que comparten una cadena de URL idéntica sin procesar (raro, ya que las URL se deduplican al insertarse).',
  ["When on, `<meta http-equiv='refresh'>` content URLs are enqueued like a redirect target. window.location body redirects are heuristic-only and currently out of scope."]:
    "Cuando está activado, las URL del content de `<meta http-equiv='refresh'>` se encolan como un destino de redirección. Las redirecciones window.location del cuerpo son solo heurísticas y actualmente están fuera del alcance.",
  ['When on, a 200 page declaring a canonical pointing elsewhere also enqueues that target. Default off — most crawls treat canonicals as a signal, not a navigation hint.']:
    'Cuando está activado, una página 200 que declara un canonical apuntando a otro lugar también encola ese destino. Desactivado por defecto — la mayoría de rastreos tratan los canonicals como una señal, no como una indicación de navegación.',
  ['When on, pages with noindex / canonicalised / robots-blocked indexability are excluded from clustering — the Near-Duplicate report then surfaces only issues that affect search visibility.']:
    'Cuando está activado, las páginas con indexabilidad noindex / canonicalizada / bloqueada por robots se excluyen de la agrupación — el informe de Casi duplicados muestra entonces solo problemas que afectan a la visibilidad en buscadores.',
  ["When on, rel=nofollow links are recursed into like any other link. Default off — Screaming Frog 'Respect Nofollow' default."]:
    "Cuando está activado, los enlaces rel=nofollow se recorren como cualquier otro enlace. Desactivado por defecto — comportamiento por defecto de 'Respect Nofollow' de Screaming Frog.",
  ['When Playwright considers navigation complete. domcontentloaded = HTML parsed but resources still loading. load = window.load fired. networkidle = no network activity for 500ms (best for SPA but slower). commit = just response committed (fastest, riskiest).']:
    'Cuándo Playwright considera completada la navegación. domcontentloaded = HTML analizado pero recursos aún cargando. load = window.load disparado. networkidle = sin actividad de red durante 500 ms (lo mejor para SPA pero más lento). commit = solo respuesta confirmada (lo más rápido, lo más arriesgado).',
  ['Whether the broken target is on the same site (internal) or a different host (external).']:
    'Si el destino roto está en el mismo sitio (interno) o en otro host (externo).',
  ['Whether the URL is eligible to appear in search results. Combines status code, robots directives, canonical, and meta-refresh signals.']:
    'Si la URL puede aparecer en los resultados de búsqueda. Combina el código de estado, las directivas robots, el canonical y las señales de meta-refresh.',
  ['Width attribute value (in pixels) declared on the <img> tag, when present.']:
    'Valor del atributo width (en píxeles) declarado en la etiqueta <img>, cuando existe.',
  ['XPath 1.0 subset over the parsed DOM. End in `/@attr` or `/text()` to read an attribute / text node. Predicates: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.']:
    'Subconjunto de XPath 1.0 sobre el DOM analizado. Termina en `/@attr` o `/text()` para leer un atributo / nodo de texto. Predicados: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.',
  ['Y when the page declares hreflang alternates but no entry whose `href` matches the page URL. Google requires a self-reference.']:
    'Y cuando la página declara alternativas hreflang pero ninguna entrada cuyo `href` coincida con la URL de la página. Google exige una autorreferencia.',
  ['Y when the redirect chain originating at this URL contains a cycle (A → B → A) detected by the cycle-safe walker; the chain is otherwise unwalked.']:
    'Y cuando la cadena de redirecciones que parte de esta URL contiene un ciclo (A → B → A) detectado por el recorrido a prueba de ciclos; en caso contrario la cadena no se recorre.',
  ['Y when this URL belongs to a paginated cluster whose ordinal sequence has a gap (e.g. ?page=1, 2, 4 — page 3 missing). Set by the post-crawl `recomputePaginationSequence` pass.']:
    'Y cuando esta URL pertenece a un grupo paginado cuya secuencia ordinal tiene un hueco (p. ej. ?page=1, 2, 4 — falta la página 3). Lo define la pasada `recomputePaginationSequence` posterior al rastreo.',
  ['SQL injection — the request tries to smuggle SQL into a parameter (UNION SELECT, sleep(), error-based functions) to read or alter your database.']:
    'Inyección SQL — la petición intenta colar SQL en un parámetro (UNION SELECT, sleep(), funciones basadas en errores) para leer o alterar tu base de datos.',
  ['Cross-site scripting — the request carries script markup or a javascript: URL in a parameter, hoping the page echoes it back into the HTML unescaped.']:
    'Cross-site scripting — la petición lleva marcado de script o una URL javascript: en un parámetro, esperando que la página lo devuelva en el HTML sin escapar.',
  ['Path traversal — the request walks out of the web root with ../ or encoded variants to reach files like /etc/passwd or win.ini.']:
    'Path traversal — la petición sale de la raíz web con ../ o variantes codificadas para alcanzar archivos como /etc/passwd o win.ini.',
  ['Command injection — the request appends shell syntax (;, |, backticks, $( )) to a parameter to run commands on the server.']:
    'Inyección de comandos — la petición añade sintaxis de shell (;, |, acentos graves, $( )) a un parámetro para ejecutar comandos en el servidor.',
  ['Scanner probe — an automated vulnerability scanner walking a wordlist of known admin panels, installers and exploit paths (wp-login, phpmyadmin, /actuator, shell uploads). Not tailored to your site; it hits everyone.']:
    'Sonda de escáner — un escáner de vulnerabilidades automatizado recorriendo una lista de paneles de administración, instaladores y rutas de exploits conocidos (wp-login, phpmyadmin, /actuator, subidas de shell). No está adaptado a tu sitio; golpea a todos.',
  ['Sensitive file fetch — a direct request for something that must never be public: .env, .git, backups, SQL dumps, private keys, config files.']:
    'Obtención de archivo sensible — una petición directa de algo que nunca debe ser público: .env, .git, copias de seguridad, volcados SQL, claves privadas, archivos de configuración.',
  ['Anomaly — malformed or evasive input (null bytes, CRLF injection, over-encoding, absurd parameter lengths) that matches no single attack class but is not a normal browser request.']:
    'Anomalía — entrada malformada o evasiva (bytes nulos, inyección CRLF, sobrecodificación, longitudes de parámetro absurdas) que no coincide con ninguna clase de ataque concreta pero no es una petición normal de navegador.',
  ['Sum of the weights of every attack signature the request matched. Each signature carries a weight by how conclusive it is (a UNION SELECT weighs 9, a stray quote 2), and a line is only flagged once the total reaches 5 — so one decisive pattern flags on its own, while weak hints have to add up. Higher score = less room for a false positive; sort by it to triage.']:
    'Suma de los pesos de cada firma de ataque con la que coincidió la petición. Cada firma tiene un peso según lo concluyente que sea (un UNION SELECT pesa 9, una comilla suelta 2), y una línea solo se marca cuando el total llega a 5 — así un patrón decisivo se marca por sí solo, mientras que las pistas débiles tienen que sumarse. Puntuación más alta = menos margen para un falso positivo; ordena por ella para priorizar.',
  ['Which attack class the strongest matching signature belongs to: SQL injection, XSS, path traversal, command injection, scanner probe, sensitive file, or anomaly. Hover any badge in this column for what that class means in practice.']:
    'A qué clase de ataque pertenece la firma coincidente más fuerte: inyección SQL, XSS, path traversal, inyección de comandos, sonda de escáner, archivo sensible o anomalía. Pasa el ratón por cualquier insignia de esta columna para saber qué significa esa clase en la práctica.',
  ["Filters on the Status column — the most recent response the log recorded for that path. The analyzer keeps one status per URL rather than a full distribution, so this answers 'what is this URL returning now'. Paths whose status could not be parsed are hidden while a class is selected."]:
    "Filtra por la columna Estado — la respuesta más reciente que el registro guardó para esa ruta. El analizador conserva un estado por URL en lugar de una distribución completa, así que esto responde a 'qué devuelve esta URL ahora'. Las rutas cuyo estado no se pudo analizar se ocultan mientras hay una clase seleccionada.",
  ['Most recent HTTP status the log recorded for this path. One value per URL, not a distribution — a path that returned 200 all week and 404 this morning shows 404.']:
    'Estado HTTP más reciente que el registro guardó para esta ruta. Un valor por URL, no una distribución — una ruta que devolvió 200 toda la semana y 404 esta mañana muestra 404.',
  ['A URL whose path repeats the same segment this many times or more (/shop/shop/shop/…) is treated as a link loop and skipped. This shape comes from a relative-href bug and has no legitimate counterpart. Skipped counts are reported when the crawl finishes.']:
    'Una URL cuya ruta repite el mismo segmento este número de veces o más (/shop/shop/shop/…) se trata como un bucle de enlaces y se omite. Esta forma procede de un error de href relativo y no tiene equivalente legítimo. Los recuentos omitidos se informan al terminar el rastreo.',
  ['3 is safe for every site; raise to 4–5 only if a real path legitimately repeats a segment; 0 disables the guard.']:
    '3 es seguro para cualquier sitio; súbelo a 4–5 solo si una ruta real repite legítimamente un segmento; 0 desactiva la protección.',
  ['URLs with more query parameters than this are flagged as faceted-navigation traps under Issues → URL → Crawl Trap. Detection only — the URLs are still crawled, because legitimate filter pages look the same.']:
    'Las URL con más parámetros de consulta que este valor se marcan como trampas de navegación por facetas en Problemas → URL → Trampa de rastreo. Solo detección — las URL se rastrean igualmente, porque las páginas de filtro legítimas tienen el mismo aspecto.',
  ['4 surfaces most faceted-nav explosions; 0 disables the check.']:
    '4 detecta la mayoría de explosiones de navegación por facetas; 0 desactiva la comprobación.',
  ["Honor Allow / Disallow rules declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "Respetar las reglas Allow / Disallow declaradas en /robots.txt para el User-Agent configurado. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt).",
  ["Honor a Crawl-delay directive as a global rate limit (one request every N seconds). Crawl-delay is not part of RFC 9309 — Google ignores it and Screaming Frog does not implement it — and published values are often stale: 'Crawl-delay: 30' turns a 500-URL crawl into hours. Ignored by default; the directive is still reported in the log when found."]:
    "Respetar una directiva Crawl-delay como límite de tasa global (una petición cada N segundos). Crawl-delay no forma parte del RFC 9309 — Google lo ignora y Screaming Frog no lo implementa — y los valores publicados suelen estar obsoletos: 'Crawl-delay: 30' convierte un rastreo de 500 URL en horas. Ignorado por defecto; la directiva se sigue informando en el registro cuando se encuentra.",
  ['Off (default) for normal audits. On when an ops policy requires it — expect the crawl to take Crawl-delay seconds per URL.']:
    'Desactivado (por defecto) para auditorías normales. Activado cuando una política operativa lo exija — espera que el rastreo tarde Crawl-delay segundos por URL.',
  ['Crawl fetches internal <img> targets (incl. srcset / <picture> sources) so each appears in the Internal tab with status, content type, and size — every one counts toward Max URLs. Store keeps the <img> declarations in the Images tab, which works even with Crawl off: you get the full image inventory with alt text for the cost of zero extra requests.']:
    'Rastrear descarga los destinos <img> internos (incl. srcset / fuentes de <picture>) para que cada uno aparezca en la pestaña Interno con estado, tipo de contenido y tamaño — todos cuentan para Máx. URL. Almacenar conserva las declaraciones <img> en la pestaña Imágenes, que funciona incluso con Rastrear desactivado: obtienes el inventario completo de imágenes con texto alt a coste de cero peticiones extra.',
  ['Store on, Crawl off is the cheap alt-text audit. Both on for a full image health check.']:
    'Almacenar activado, Rastrear desactivado es la auditoría barata de texto alt. Ambos activados para una revisión completa de la salud de las imágenes.',
  ['<video> / <audio> and the <source> children they own. Off by default — media files are large and rarely what an SEO crawl is looking for.']:
    '<video> / <audio> y los hijos <source> que poseen. Desactivado por defecto — los archivos multimedia son grandes y rara vez son lo que busca un rastreo SEO.',
  ['On when auditing a video-heavy site for dead media URLs.']:
    'Activado al auditar un sitio con mucho vídeo en busca de URL multimedia muertas.',
  ["<link rel=stylesheet> targets. Crawling a stylesheet is also what discovers the web fonts and background images declared inside it via @font-face / url() — so Crawl on with Store off still populates the Internal tab's Font filter without listing every stylesheet."]:
    'Destinos de <link rel=stylesheet>. Rastrear una hoja de estilos es también lo que descubre las fuentes web e imágenes de fondo declaradas dentro mediante @font-face / url() — así que Rastrear activado con Almacenar desactivado sigue llenando el filtro Fuentes de la pestaña Interno sin listar cada hoja de estilos.',
  ['Crawl on, Store off when you want fonts discovered but not hundreds of CSS rows.']:
    'Rastrear activado, Almacenar desactivado cuando quieres descubrir las fuentes pero no cientos de filas CSS.',
  ['<script src> targets, fetched so each gets its own row with status code, content type, and size. Headers only — the body is discarded, never executed.']:
    'Destinos de <script src>, descargados para que cada uno tenga su propia fila con código de estado, tipo de contenido y tamaño. Solo cabeceras — el cuerpo se descarta, nunca se ejecuta.',
  ['Both on to catch 404ing bundles; both off for HTML-only crawls.']:
    'Ambos activados para detectar bundles que dan 404; ambos desactivados para rastreos solo HTML.',
  ['<a href> targets on the same site. Crawl off turns the run into an audit of a fixed set of pages — sitemaps, canonicals, and the other declared alternates below still feed discovery. Store off empties the link graph: inlinks, outlinks, anchor-text reports, and link score all go with it.']:
    'Destinos de <a href> en el mismo sitio. Rastrear desactivado convierte la ejecución en una auditoría de un conjunto fijo de páginas — los sitemaps, canonicals y demás alternativas declaradas abajo siguen alimentando el descubrimiento. Almacenar desactivado vacía el grafo de enlaces: enlaces entrantes, salientes, informes de texto ancla y puntuación de enlaces desaparecen con él.',
  ['Leave both on. Crawl off only when a sitemap or URL list already defines the exact set you want.']:
    'Deja ambos activados. Rastrear desactivado solo cuando un sitemap o una lista de URL ya define el conjunto exacto que quieres.',
  ['Outbound links to other hosts are always status-checked (one HEAD each) so Broken Links catches dead externals — that does not depend on this row. Crawl here means fully crawling those pages, following their links onward too. Store keeps outbound links in the link graph.']:
    'Los enlaces salientes a otros hosts siempre se comprueban por estado (un HEAD cada uno) para que Enlaces rotos detecte externos muertos — eso no depende de esta fila. Rastrear aquí significa rastrear por completo esas páginas, siguiendo también sus enlaces. Almacenar conserva los enlaces salientes en el grafo de enlaces.',
  ['Crawl off (default) — status-check externals without spidering the whole web.']:
    'Rastrear desactivado (por defecto) — comprobar el estado de los externos sin rastrear toda la web.',
  ['<link rel=canonical> and its HTTP Link: header form. Crawl also enqueues the canonical target, treating it as a navigation hint. Store feeds the Canonicals tab and every canonical issue filter.']:
    '<link rel=canonical> y su forma de cabecera HTTP Link:. Rastrear también encola el destino canonical, tratándolo como una indicación de navegación. Almacenar alimenta la pestaña Canonicals y todos los filtros de problemas de canonical.',
  ['Crawl off (default) — canonicals are a signal, not a route. Store on.']:
    'Rastrear desactivado (por defecto) — los canonicals son una señal, no una ruta. Almacenar activado.',
  ['<link rel=next> / <link rel=prev>. Part of the standard discovery graph; turn Crawl off to isolate a pagination loop without disabling link-following everywhere.']:
    '<link rel=next> / <link rel=prev>. Parte del grafo de descubrimiento estándar; desactiva Rastrear para aislar un bucle de paginación sin desactivar el seguimiento de enlaces en todas partes.',
  ['Both on unless you are debugging an infinite paginated series.']:
    'Ambos activados salvo que estés depurando una serie paginada infinita.',
  ['<link rel=alternate hreflang>. Crawl enqueues every declared alternate, which is how you reach language versions nothing links to. Store feeds the Hreflang tab and the reciprocity / invalid-code audits.']:
    '<link rel=alternate hreflang>. Rastrear encola cada alternativa declarada, que es como llegas a versiones de idioma a las que nada enlaza. Almacenar alimenta la pestaña Hreflang y las auditorías de reciprocidad / código no válido.',
  ['Crawl on for a multi-language audit — otherwise unlinked locales stay invisible.']:
    'Rastrear activado para una auditoría multilingüe — de lo contrario, las configuraciones regionales no enlazadas permanecen invisibles.',
  ['<link rel=amphtml>. Crawl fetches the AMP variant as its own URL; Store keeps the declaration plus the AMP smoke-validator findings.']:
    '<link rel=amphtml>. Rastrear descarga la variante AMP como su propia URL; Almacenar conserva la declaración más los hallazgos del validador básico de AMP.',
  ['Crawl on only if the site still ships AMP pages.']:
    'Rastrear activado solo si el sitio aún publica páginas AMP.',
  ['<meta http-equiv="refresh">. Crawl enqueues the parsed target like a redirect; Store keeps the raw directive and its URL for the Meta Refresh tab.']:
    '<meta http-equiv="refresh">. Rastrear encola el destino analizado como una redirección; Almacenar conserva la directiva sin procesar y su URL para la pestaña Meta Refresh.',
  ['Crawl on when auditing a legacy site that still redirects this way.']:
    'Rastrear activado al auditar un sitio heredado que aún redirige de esta forma.',
  ["<iframe src> documents. Crawl fetches each embedded page as its own URL, which can pull in a lot of third-party surface. Store records them in the link graph so a dead embed shows up in Outlinks and Broken Links — without counting toward the page's outlink total, since an embed is not a hyperlink."]:
    'Documentos <iframe src>. Rastrear descarga cada página incrustada como su propia URL, lo que puede arrastrar mucha superficie de terceros. Almacenar los registra en el grafo de enlaces para que un embed muerto aparezca en Enlaces salientes y Enlaces rotos — sin contar en el total de enlaces salientes de la página, ya que un embed no es un hipervínculo.',
  ['Store on, Crawl off is usually the right pair.']:
    'Almacenar activado, Rastrear desactivado suele ser la combinación correcta.',
  ['The separate-URL (m-dot) mobile version: <link rel="alternate" media="only screen and (max-width: …)">. Null on responsive sites, which is most of them — a value here with no reciprocal canonical back is the classic broken m-dot setup.']:
    'La versión móvil con URL separada (m-dot): <link rel="alternate" media="only screen and (max-width: …)">. Nulo en sitios responsive, que son la mayoría — un valor aquí sin canonical recíproco de vuelta es la clásica configuración m-dot rota.',
  ['Crawl on only when the site really does serve a separate mobile host.']:
    'Rastrear activado solo cuando el sitio realmente sirve un host móvil separado.',
  ['Links a search engine cannot follow: <a> with no href but an onclick, href="javascript:…", and href="#" placeholders wired to a handler. Store-only — an uncrawlable link is by definition never fetched. Drives the JS-Only Navigation issue filter.']:
    'Enlaces que un buscador no puede seguir: <a> sin href pero con onclick, href="javascript:…" y marcadores href="#" conectados a un manejador. Solo Almacenar — un enlace no rastreable por definición nunca se descarga. Alimenta el filtro de problemas Navegación solo JS.',
  ['On — it is a count, so it costs nothing.']:
    'Activado — es un recuento, así que no cuesta nada.',
  ['With a Subfolder-scoped crawl, links pointing outside the start folder are fetched once so their status code is known, then stopped — they are checked, not crawled through. Off leaves them undiscovered entirely.']:
    'Con un rastreo de alcance Subcarpeta, los enlaces que apuntan fuera de la carpeta inicial se descargan una vez para conocer su código de estado y luego se detienen — se comprueban, no se rastrean a fondo. Desactivado los deja sin descubrir por completo.',
  ['On — knowing a link out of /blog/ is a 404 costs one request.']:
    'Activado — saber que un enlace fuera de /blog/ es un 404 cuesta una petición.',
  ["Off restricts the crawl to URLs under the start URL's path (Crawl Scope = Subfolder). On lets it cover the whole host. This is a view of the Crawl Scope setting, not a separate switch, so the two can never disagree."]:
    'Desactivado restringe el rastreo a las URL bajo la ruta de la URL inicial (Alcance del rastreo = Subcarpeta). Activado le permite cubrir todo el host. Es una vista del ajuste Alcance del rastreo, no un interruptor aparte, así que los dos nunca pueden discrepar.',
  ['Off to audit just /blog/; on for the whole site.']:
    'Desactivado para auditar solo /blog/; activado para todo el sitio.',
  ['Treats every host sharing the registrable domain as internal — shop.example.com and blog.example.com crawl alongside example.com instead of counting as external. Another view of the Crawl Scope setting.']:
    'Trata cada host que comparte el dominio registrable como interno — shop.example.com y blog.example.com se rastrean junto a example.com en lugar de contar como externos. Otra vista del ajuste Alcance del rastreo.',
  ['On when subdomains are part of the same property.']:
    'Activado cuando los subdominios forman parte de la misma propiedad.',
  ['Crawl through rel="nofollow" links pointing at the same site. Off (default) is Screaming Frog "Respect Nofollow" behaviour. Internal and external are separate switches because sites nofollow them for opposite reasons — crawl-budget shaping vs. not vouching for a third party.']:
    'Rastrear a través de enlaces rel="nofollow" que apuntan al mismo sitio. Desactivado (por defecto) es el comportamiento "Respect Nofollow" de Screaming Frog. Interno y externo son interruptores separados porque los sitios los usan por motivos opuestos — modelar el presupuesto de rastreo frente a no avalar a un tercero.',
  ['On when a site nofollows its own faceted navigation and you need behind it.']:
    'Activado cuando un sitio pone nofollow a su propia navegación por facetas y necesitas llegar detrás.',
  ['Crawl through rel="nofollow" links pointing at other hosts. Only has an effect while External Links → Crawl is on.']:
    'Rastrear a través de enlaces rel="nofollow" que apuntan a otros hosts. Solo tiene efecto mientras Enlaces externos → Rastrear esté activado.',
  ['Off — nofollowed externals are exactly the ones you did not vouch for.']:
    'Desactivado — los externos con nofollow son exactamente los que no avalaste.',
  ['Record hrefs that cannot be parsed as a URL — unencoded whitespace inside the authority, doubled schemes, stray delimiters. They can never resolve to a crawled page, so every one is reported in Broken Links, which is the point. Deliberate non-navigable schemes (mailto:, tel:, #) are not malformed and never appear.']:
    'Registrar los href que no se pueden analizar como URL — espacios sin codificar dentro de la autoridad, esquemas duplicados, delimitadores sueltos. Nunca pueden resolverse a una página rastreada, así que cada uno se informa en Enlaces rotos, que es la idea. Los esquemas no navegables deliberados (mailto:, tel:, #) no están malformados y nunca aparecen.',
  ['On when hunting hand-written markup errors; off keeps Broken Links focused on real 404s.']:
    'Activado al cazar errores de marcado escrito a mano; desactivado mantiene Enlaces rotos centrado en 404 reales.',
  ['Off drops every discovered URL carrying a `?`, before robots and before a request goes out. That is the cheap way to stop a faceted navigation (?color=red&size=xl&sort=price) from spending the whole URL budget on one product listing wearing a thousand URLs. The start URL is always crawled, and subresources are exempt — style.css?v=7 is a cache-buster, not a facet. Skipped URLs are counted and reported in the log, never dropped silently.']:
    'Desactivado descarta cada URL descubierta que lleve `?`, antes de robots y antes de que salga una petición. Es la forma barata de impedir que una navegación por facetas (?color=red&size=xl&sort=price) gaste todo el presupuesto de URL en un solo listado de productos disfrazado de mil URL. La URL inicial siempre se rastrea, y los subrecursos están exentos — style.css?v=7 es un cache-buster, no una faceta. Las URL omitidas se cuentan e informan en el registro, nunca se descartan en silencio.',
  ['On (default). Off for a first pass over a shop with faceted filters.']:
    'Activado (por defecto). Desactivado para una primera pasada sobre una tienda con filtros por facetas.',
  ['Parameter names that keep a URL in the crawl anyway — pagination, a language switch, a product id. Names only; values are not looked at, and matching ignores case. A URL is admitted only when every parameter it carries is on this list: ?page=2 passes, ?page=2&color=red does not. Any-match would defeat the point, since a facet URL nearly always carries the pagination parameter too.']:
    'Nombres de parámetros que mantienen una URL en el rastreo de todos modos — paginación, un cambio de idioma, un id de producto. Solo nombres; los valores no se miran, y la coincidencia ignora mayúsculas. Una URL se admite solo cuando cada parámetro que lleva está en esta lista: ?page=2 pasa, ?page=2&color=red no. Una coincidencia parcial anularía el propósito, ya que una URL de faceta casi siempre lleva también el parámetro de paginación.',
  ['page, lang — keeps paginated archives reachable while the facets stay out.']:
    'page, lang — mantiene accesibles los archivos paginados mientras las facetas quedan fuera.',
  ['Auto-discovery on its own only records sitemap entries, which is what the sitemap issue filters compare the crawl against. Turning this on crawls them too — and that is what surfaces orphans: pages the sitemap declares but nothing on the site links to.']:
    'El descubrimiento automático por sí solo únicamente registra las entradas del sitemap, que es contra lo que los filtros de problemas de sitemap comparan el rastreo. Activar esto también las rastrea — y eso es lo que saca a la luz las páginas huérfanas: páginas que el sitemap declara pero a las que nada en el sitio enlaza.',
  ['On for an orphan-page audit.']: 'Activado para una auditoría de páginas huérfanas.',
  ['Reads Sitemap: directives from /robots.txt plus the conventional /sitemap.xml fallbacks at crawl start. Cheap I/O, and it powers every sitemap issue filter.']:
    'Lee las directivas Sitemap: de /robots.txt más las alternativas convencionales /sitemap.xml al inicio del rastreo. E/S barata, y alimenta todos los filtros de problemas de sitemap.',
  ['On (default).']: 'Activado (por defecto).',
  ['Explicit sitemap URLs, one per line. Their entries are always both recorded and queued as crawl seeds — use this when the sitemap lives somewhere robots.txt never mentions.']:
    'URL de sitemap explícitas, una por línea. Sus entradas siempre se registran y se encolan como semillas de rastreo — úsalo cuando el sitemap está en algún lugar que robots.txt nunca menciona.',
  ['Treat the concurrency and RPS above as a ceiling and let the target server set the real pace. On a 429/503 (or a Retry-After header) the crawler pauses for the penalty window and steps the rate + concurrency down; after a sustained run of clean responses it grows them back toward the ceiling. Off = hold the configured rate no matter how the server responds.']:
    'Trata la concurrencia y los RPS de arriba como un techo y deja que el servidor de destino marque el ritmo real. Ante un 429/503 (o una cabecera Retry-After) el rastreador se pausa durante la ventana de penalización y reduce la tasa + concurrencia; tras una racha sostenida de respuestas limpias las vuelve a subir hacia el techo. Desactivado = mantener la tasa configurada sin importar cómo responda el servidor.',
  ['Turn on for sites behind Cloudflare / a WAF that returns 429s; leave off for your own infrastructure where the fixed rate is safe.']:
    'Actívalo para sitios detrás de Cloudflare / un WAF que devuelve 429; déjalo desactivado para tu propia infraestructura donde la tasa fija es segura.',
  ['Sorts query parameters alphabetically at normalisation time. Repeated keys keep their relative order, so ?tag=a&tag=b is preserved. Without this the two orderings occupy separate rows and read as duplicates.']:
    'Ordena alfabéticamente los parámetros de consulta en la normalización. Las claves repetidas conservan su orden relativo, así que ?tag=a&tag=b se preserva. Sin esto, las dos ordenaciones ocupan filas separadas y se leen como duplicados.',
  ['On for most sites; off if your server routes on positional parameter order.']:
    'Activado para la mayoría de sitios; desactivado si tu servidor enruta según el orden posicional de los parámetros.',
  ['Collapses runs of slashes in the path to a single slash. Applied before the trailing-slash policy. Web servers serve these identically, so the duplicate-slash variant is normally a false duplicate.']:
    'Fusiona las secuencias de barras de la ruta en una sola barra. Se aplica antes de la política de barra final. Los servidores web las sirven de forma idéntica, así que la variante con barra duplicada suele ser un falso duplicado.',
  ['On if a template bug emits //  in links; off if your framework uses empty path segments as data.']:
    'Activado si un error de plantilla emite //  en los enlaces; desactivado si tu framework usa segmentos de ruta vacíos como datos.',
  ["Off by default: verify the login page's TLS certificate before typing credentials into it. Enable only for a trusted internal host with a self-signed certificate — an unverifiable certificate on a login page is a man-in-the-middle risk."]:
    'Desactivado por defecto: verifica el certificado TLS de la página de inicio de sesión antes de escribir credenciales en ella. Actívalo solo para un host interno de confianza con certificado autofirmado — un certificado no verificable en una página de inicio de sesión es un riesgo de man-in-the-middle.',
  ["Hooks the History API before the page's own scripts run, so routes an SPA reaches via pushState / replaceState / popstate are discovered and crawled. Also keeps hash routes (#/about) as distinct URLs instead of collapsing them onto the shell document."]:
    'Engancha la History API antes de que se ejecuten los propios scripts de la página, de modo que las rutas que una SPA alcanza mediante pushState / replaceState / popstate se descubren y rastrean. También conserva las rutas hash (#/about) como URL distintas en lugar de fusionarlas en el documento shell.',
  ['On for React Router / Vue Router / Angular sites whose pages never produce a document request.']:
    'Activado para sitios con React Router / Vue Router / Angular cuyas páginas nunca producen una petición de documento.',
  ['`<link rel="alternate" media="only screen and (max-width: …)" href="…">` value — the separate-URL (m-dot) mobile version of this page. Empty on responsive sites, which is most of them. A value here with no reciprocal canonical pointing back is the classic broken m-dot setup.']:
    'Valor de `<link rel="alternate" media="only screen and (max-width: …)" href="…">` — la versión móvil con URL separada (m-dot) de esta página. Vacío en sitios responsive, que son la mayoría. Un valor aquí sin canonical recíproco que apunte de vuelta es la clásica configuración m-dot rota.',
};
