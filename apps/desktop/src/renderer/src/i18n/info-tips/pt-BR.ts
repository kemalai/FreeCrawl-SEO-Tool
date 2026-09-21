/**
 * Brazilian Portuguese InfoTip ([i] tooltip) bodies, keyed by the verbatim English
 * source string. See `../info-tips.ts` for the rationale.
 */

export const PT_BR_INFO_TIPS: Record<string, string> = {
  ["?page=1 / ?page=2 / ?page=4 → flags 'Sequence Break' on every member of the broken cluster."]:
    "?page=1 / ?page=2 / ?page=4 → marca 'Quebra de sequência' em cada membro do grupo quebrado.",
  ['`<a>` elements that look clickable but aren\'t crawlable (no href + onclick, `href="javascript:…"`, or `href="#"` with onclick).']:
    'Elementos `<a>` que parecem clicáveis mas não são rastreáveis (sem href + onclick, `href="javascript:…"` ou `href="#"` com onclick).',
  ['`<link rel="amphtml" href="…">` value — the AMP version of this page. Empty when the page does not declare an AMP alternate.']:
    'Valor de `<link rel="amphtml" href="…">` — a versão AMP desta página. Vazio quando a página não declara uma alternativa AMP.',
  ['`<link rel="next" href="…">` value resolved to absolute. Empty when the page is not paginated forward.']:
    'Valor de `<link rel="next" href="…">` resolvido para absoluto. Vazio quando a página não é paginada para frente.',
  ['`<link rel="prev" href="…">` value resolved to absolute. Empty when the page is the first in its pagination cluster.']:
    'Valor de `<link rel="prev" href="…">` resolvido para absoluto. Vazio quando a página é a primeira do seu grupo de paginação.',
  ['`css` runs against the parsed DOM; `regex` runs against raw HTML.']:
    '`css` roda sobre o DOM analisado; `regex` roda sobre o HTML bruto.',
  ['`none` disables auth; `basic` adds `Authorization: Basic <base64>`; `bearer` adds `Authorization: Bearer <token>`; `digest` performs the RFC 2617 challenge-response on the first 401.']:
    '`none` desativa a autenticação; `basic` adiciona `Authorization: Basic <base64>`; `bearer` adiciona `Authorization: Bearer <token>`; `digest` executa o desafio-resposta RFC 2617 no primeiro 401.',
  ['`POST <url>` is fired when the `done` event emits. 10 s timeout. Failures are logged as info events but never break the crawl.']:
    '`POST <url>` é disparado quando o evento `done` é emitido. Tempo limite de 10 s. Falhas são registradas como eventos informativos, mas nunca interrompem o rastreamento.',
  ['0 (no duplicates), 7 (member of cluster #7)']: '0 (sem duplicatas), 7 (membro do grupo nº 7)',
  ['0 = auto. 4 for 8GB RAM machines, 8+ for 16GB+.']:
    '0 = automático. 4 para máquinas com 8 GB de RAM, 8+ para 16 GB ou mais.',
  ["0 default; 250 ms when a host returns 429 with a 'too fast' message."]:
    "0 por padrão; 250 ms quando um host retorna 429 com uma mensagem de 'rápido demais'.",
  ['0 for SSR sites, 2000 for typical SPAs, 5000+ for heavy client-rendered apps.']:
    '0 para sites SSR, 2000 para SPAs típicas, 5000+ para aplicações pesadas renderizadas no cliente.',
  ["0.1 default (Google 'good'); 0 to disable."]:
    "0.1 por padrão ('bom' segundo o Google); 0 para desativar.",
  ['1 = unique, 5 = part of a 5-page near-duplicate group']:
    '1 = único, 5 = parte de um grupo de 5 páginas quase duplicadas',
  ['10 (default), 3 for very tight chains, 0 to remove the cap']:
    '10 (padrão), 3 para cadeias bem restritas, 0 para remover o limite',
  ['10 covers most sites; 3 limits crawls to top-of-funnel pages only.']:
    '10 cobre a maioria dos sites; 3 limita o rastreamento apenas às páginas do topo do funil.',
  ['100 default for most audits; 0 to disable the check.']:
    '100 por padrão para a maioria das auditorias; 0 para desativar a verificação.',
  ['100 default; 50 for tight on-page link discipline; 0 to disable the issue.']:
    '100 por padrão; 50 para uma disciplina rígida de links na página; 0 para desativar o problema.',
  ['1000000 (1M) for a full site audit; 5000 for spot checks.']:
    '1000000 (1M) para uma auditoria completa do site; 5000 para verificações pontuais.',
  ['1024 (1 MB) default; 150 for a lean HTML budget; 0 to disable.']:
    '1024 (1 MB) por padrão; 150 para um orçamento HTML enxuto; 0 para desativar.',
  ['1048576 (1 MB) default; 524288 (512 KB) on tight disks; 0 to disable truncation entirely.']:
    '1048576 (1 MB) por padrão; 524288 (512 KB) em discos apertados; 0 para desativar o truncamento por completo.',
  ['10485760 (10 MB) on bandwidth-tight crawls; 0 to download anything.']:
    '10485760 (10 MB) em rastreamentos com banda limitada; 0 para baixar qualquer coisa.',
  ['1366 = standard laptop, 1920 = full HD desktop, 375 = iPhone width.']:
    '1366 = notebook padrão, 1920 = desktop Full HD, 375 = largura de iPhone.',
  ['2 default; 0 to record errors immediately without retrying; 5 for unreliable upstreams.']:
    '2 por padrão; 0 para registrar erros imediatamente sem tentar de novo; 5 para servidores instáveis.',
  ['20 default; 50 on fast first-party servers; 5 if the site rate-limits or returns 429s.']:
    '20 por padrão; 50 em servidores próprios rápidos; 5 se o site limita a taxa ou retorna 429.',
  ['20 for typical sites; 5 to be polite on shared hosting; 60+ when crawling your own infra.']:
    '20 para sites típicos; 5 para ser educado em hospedagem compartilhada; 60+ ao rastrear sua própria infraestrutura.',
  ['20000 (20 s) for typical use; 5000 for fast spot checks; 60000 for slow APIs.']:
    '20000 (20 s) para uso típico; 5000 para verificações rápidas; 60000 para APIs lentas.',
  ['2048 (≈2 GB) on a 4 GB laptop; 8192 on a 16 GB workstation; 0 to disable.']:
    '2048 (≈2 GB) em um notebook de 4 GB; 8192 em uma estação de trabalho de 16 GB; 0 para desativar.',
  ['2048 default (RFC-suggested practical ceiling).']:
    '2048 por padrão (teto prático sugerido pela RFC).',
  ["2500 default (Google 'good'); 0 to disable."]:
    "2500 por padrão ('bom' segundo o Google); 0 para desativar.",
  ['3 = recommended; 5 catches looser duplicates (templated content with light variation); 0 turns the post-crawl pass off.']:
    '3 = recomendado; 5 captura duplicatas mais frouxas (conteúdo de template com pequenas variações); 0 desliga a etapa pós-rastreamento.',
  ['4 default; 6 on documentation sites with deep TOC trees; 0 to disable.']:
    '4 por padrão; 6 em sites de documentação com árvores de índice profundas; 0 para desativar.',
  ['500 default. Bump to 2000 when retrying against a flaky API.']:
    '500 por padrão. Suba para 2000 ao tentar de novo contra uma API instável.',
  ['50000 keeps RAM bounded during big sitemap fan-outs; 0 for typical crawls.']:
    '50000 mantém a RAM limitada durante grandes expansões de sitemaps; 0 para rastreamentos típicos.',
  ['60000 (1 minute) for huge resources; 0 to rely solely on the fetch timeout.']:
    '60000 (1 minuto) para recursos enormes; 0 para depender somente do tempo limite de busca.',
  ['64-bit SimHash + LSH bucketing + Union-Find clustering on body shingles. Most expensive pass — typical 5–10 s on a 100k crawl.']:
    'SimHash de 64 bits + agrupamento LSH + clustering Union-Find sobre shingles do corpo. A etapa mais cara — tipicamente 5–10 s em um rastreamento de 100k.',
  ['768 = standard laptop, 1080 = full HD desktop, 667 = iPhone 8 height.']:
    '768 = notebook padrão, 1080 = desktop Full HD, 667 = altura de iPhone 8.',
  ['800 default; 200 for CDN-backed static; 0 to disable.']:
    '800 por padrão; 200 para estáticos servidos por CDN; 0 para desativar.',
  ['Aborts @font-face / Google Fonts / WOFF2 requests. FOUT visible but text still renders.']:
    'Aborta requisições de @font-face / Google Fonts / WOFF2. FOUT visível, mas o texto ainda é renderizado.',
  ['Aborts <img>, <picture>, background-image requests. Recommended for SEO crawls — image metadata still comes from <img> tag attributes.']:
    'Aborta requisições de <img>, <picture> e background-image. Recomendado para rastreamentos SEO — os metadados de imagem continuam vindo dos atributos da tag <img>.',
  ['Aborts <video> / <audio> sources. Page DOM still includes the <video> tag.']:
    'Aborta as fontes de <video> / <audio>. O DOM da página ainda inclui a tag <video>.',
  ['Aborts all <script> requests. This defeats the purpose of JS rendering — use Text Only mode instead.']:
    'Aborta todas as requisições de <script>. Isso anula o propósito da renderização JS — use o modo Somente texto em vez disso.',
  ['Aborts external CSS. Inline styles still load. WARNING: many SPAs use CSS-driven visibility / lazy classes — blocking CSS may hide content that JS depends on.']:
    'Aborta o CSS externo. Estilos inline ainda carregam. AVISO: muitas SPAs usam visibilidade / classes lazy controladas por CSS — bloquear o CSS pode esconder conteúdo do qual o JS depende.',
  ['Aborts requests whose total lifetime (connect + headers + body) exceeds this. Distinct from `requestTimeoutMs` which is the headers timeout. Useful for capping individual slow pages without lowering the overall fetch timeout.']:
    'Aborta requisições cuja duração total (conexão + cabeçalhos + corpo) excede este valor. Diferente de `requestTimeoutMs`, que é o tempo limite dos cabeçalhos. Útil para limitar páginas lentas individuais sem baixar o tempo limite geral de busca.',
  ['Absolute redirect target parsed from the meta-refresh content. Empty when meta-refresh sets only a delay.']:
    'Destino de redirecionamento absoluto extraído do content do meta-refresh. Vazio quando o meta-refresh define apenas um atraso.',
  ['Literal target of a JavaScript redirect found in an inline script (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Followed when "Follow JavaScript redirects" is on.']:
    'Destino literal de um redirecionamento JavaScript encontrado em um script inline (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Seguido quando "Seguir redirecionamentos JavaScript" está ativado.',
  ['Additional time to wait after the chosen wait condition fires, for SPA hydration / late XHRs. 0 = no extra wait. Bounded by the request timeout.']:
    'Tempo adicional de espera depois que a condição escolhida dispara, para hidratação da SPA / XHRs tardios. 0 = sem espera extra. Limitado pelo tempo limite da requisição.',
  ['Anchor text of the broken link as rendered in the source page.']:
    'Texto âncora do link quebrado como renderizado na página de origem.',
  ['Audits the rendered DOM for WCAG AA colour-contrast failures (4.5:1 normal text, 3:1 large text) and stylesheet rules that suppress the keyboard focus outline without a :focus-visible fallback. Surfaces the Low-Contrast Text and Focus Outline Suppressed issue filters.']:
    'Audita o DOM renderizado em busca de falhas de contraste de cor WCAG AA (4.5:1 texto normal, 3:1 texto grande) e regras de folha de estilo que suprimem o contorno de foco do teclado sem alternativa :focus-visible. Alimenta os filtros de problemas Texto com baixo contraste e Contorno de foco suprimido.',
  ['basic/digest for /staging behind nginx; bearer for protected APIs']:
    'basic/digest para /staging atrás do nginx; bearer para APIs protegidas',
  ['Below Normal while you keep working in other apps; Idle for overnight unattended runs.']:
    'Abaixo do normal enquanto você continua trabalhando em outros aplicativos; Ociosa para execuções noturnas sem supervisão.',
  ['BFS click depth from the start URL. Start URL = 0; its outlinks = 1; etc. High depth often correlates with low importance.']:
    'Profundidade de cliques BFS a partir da URL inicial. URL inicial = 0; seus links de saída = 1; etc. Profundidade alta costuma se correlacionar com baixa importância.',
  ['Bodies over this are truncated and flagged. 1 MB covers the 99.9th percentile of HTML pages without letting one adversarial 50 MB page bloat the project file.']:
    'Corpos acima disso são truncados e sinalizados. 1 MB cobre o percentil 99,9 das páginas HTML sem deixar uma página hostil de 50 MB inflar o arquivo do projeto.',
  ['Buy Affordable Game Keys | Example Store']: 'Compre chaves de jogos baratas | Loja de exemplo',
  ['Character count of the first H1.']: 'Contagem de caracteres do primeiro H1.',
  ['Character count of the meta description. Recommended: 70–155 characters; over 155 risks truncation.']:
    'Contagem de caracteres da meta descrição. Recomendado: 70–155 caracteres; acima de 155 há risco de truncamento.',
  ['Character count of the title. Recommended: 30–60 characters; over 60 risks truncation in SERPs.']:
    'Contagem de caracteres do título. Recomendado: 30–60 caracteres; acima de 60 há risco de truncamento nas SERPs.',
  ['Charikar 64-bit SimHash of body shingles. Used by the post-crawl near-duplicate clustering pass. Two SimHashes within the configured Hamming threshold are considered similar.']:
    'SimHash Charikar de 64 bits dos shingles do corpo. Usado pela etapa pós-rastreamento de agrupamento de quase duplicatas. Dois SimHashes dentro do limite de Hamming configurado são considerados semelhantes.',
  ['Coarse content classification derived from URL extension and Content-Type header.']:
    'Classificação grosseira do conteúdo derivada da extensão da URL e do cabeçalho Content-Type.',
  ['Comma-joined sorted unique JSON-LD `@type` values declared on the page (Article, BreadcrumbList, Product, …).']:
    'Valores `@type` de JSON-LD únicos, ordenados e unidos por vírgula, declarados na página (Article, BreadcrumbList, Product, …).',
  ['Contents of the first <meta name="description"> tag. May be used as the SERP snippet.']:
    'Conteúdo da primeira tag <meta name="description">. Pode ser usado como snippet nas SERPs.',
  ['Contents of the first <meta name="robots"> tag. Controls per-page indexing/following behaviour.']:
    'Conteúdo da primeira tag <meta name="robots">. Controla o comportamento de indexação/seguimento por página.',
  ['Contents of the first <title> element. Google primarily uses this in SERP titles.']:
    'Conteúdo do primeiro elemento <title>. O Google o usa principalmente nos títulos das SERPs.',
  ['Counts how many internal pages link to each URL. Drives the Most-Linked URLs report and the per-row Inlinks column.']:
    'Conta quantas páginas internas apontam para cada URL. Alimenta o relatório de URLs mais linkadas e a coluna Links de entrada de cada linha.',
  ["Crawl 3xx redirect targets. Each hop is its own row; the chain is reconstructed in the Response Codes view. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced)."]:
    "Rastrear os destinos de redirecionamentos 3xx. Cada salto é sua própria linha; a cadeia é reconstruída na visão Códigos de resposta. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced).",
  ['Crawler RSS auto-pauses the queue when this is exceeded; resumes once memory drops to 80% of the cap. Soft cap — does not enforce a hard heap limit.']:
    'O RSS do rastreador pausa automaticamente a fila quando este valor é excedido; retoma quando a memória cai para 80% do limite. Limite suave — não impõe um limite rígido de heap.',
  ['css for selectors, regex for free-form patterns']:
    'css para seletores, regex para padrões livres',
  ["CSS selector that pins the duplicate-fingerprint text extraction to a specific page region. When set, the heuristic (main / role=main / article / body-minus-chrome) is bypassed and the selector wins. Useful on sites where the heuristic misclassifies — e.g. CMSes that wrap navigation inside `<main>` or sites with no semantic landmarks at all. Empty = use the heuristic. Invalid selectors silently fall back to the heuristic so a typo doesn't break the crawl."]:
    'Seletor CSS que fixa a extração de texto da impressão digital de duplicatas a uma região específica da página. Quando definido, a heurística (main / role=main / article / body-menos-chrome) é ignorada e o seletor vence. Útil em sites onde a heurística classifica errado — p. ex. CMSs que envolvem a navegação dentro de `<main>` ou sites sem nenhum landmark semântico. Vazio = usar a heurística. Seletores inválidos recorrem silenciosamente à heurística para que um erro de digitação não quebre o rastreamento.',
  ["Cumulative Layout Shift from PageSpeed Insights, when present. Google's 'good' CLS threshold is 0.1. Unitless; accepts decimals. Pages without PSI data are never flagged."]:
    "Cumulative Layout Shift do PageSpeed Insights, quando presente. O limite 'bom' de CLS do Google é 0.1. Sem unidade; aceita decimais. Páginas sem dados do PSI nunca são sinalizadas.",
  ['Drives the View Source detail tab. ~30–200 KB on disk per HTML page; turn off if you only need metadata and not full source viewing.']:
    'Alimenta a aba de detalhe Ver código-fonte. ~30–200 KB em disco por página HTML; desligue se você só precisa dos metadados e não da visualização completa do código.',
  ["Each rule runs JavaScript RegExp.replace on the fully-normalised URL. Flags default to 'g'. After all rules run, the result is re-parsed as a URL — if the rewrite produces an invalid URL, the link is dropped at normalisation time."]:
    "Cada regra executa RegExp.replace do JavaScript na URL totalmente normalizada. As flags padrão são 'g'. Depois que todas as regras rodam, o resultado é reanalisado como URL — se a reescrita produzir uma URL inválida, o link é descartado na normalização.",
  ["Empty = safest. 'chrome' if you want the same Chrome version your users see."]:
    "Vazio = mais seguro. 'chrome' se você quer a mesma versão do Chrome que seus usuários veem.",
  ["Empty = use the bundled Playwright Chromium build (recommended — pinned version, works everywhere). 'chrome' / 'msedge' uses the system-installed browser. Beta channels for testing newer features."]:
    "Vazio = usar a build do Chromium incluída no Playwright (recomendado — versão fixa, funciona em qualquer lugar). 'chrome' / 'msedge' usa o navegador instalado no sistema. Canais beta para testar recursos mais novos.",
  ["Fetch internal <img> resources (incl. srcset / <picture> sources) so they appear in the Internal tab with their own status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl)."]:
    "Buscar recursos <img> internos (incl. srcset / fontes de <picture>) para que apareçam na aba Interno com seu próprio código de status, tipo de conteúdo e tamanho. Cada um conta para Máx. URLs. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl).",
  ["Fetch internal <link rel=stylesheet> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl)."]:
    "Buscar recursos <link rel=stylesheet> internos para que apareçam na aba Interno com código de status, tipo de conteúdo e tamanho. Cada um conta para Máx. URLs. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl).",
  ["Fetch internal <script src> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl)."]:
    "Buscar recursos <script src> internos para que apareçam na aba Interno com código de status, tipo de conteúdo e tamanho. Cada um conta para Máx. URLs. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl).",
  ["Fetches /robots.txt sitemap directives + /sitemap.xml fallbacks. Powers the 'Non-Indexable in Sitemap' issue filter. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl)."]:
    "Busca as diretivas sitemap de /robots.txt + as alternativas /sitemap.xml. Alimenta o filtro de problemas 'Não indexável no sitemap'. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl).",
  ["first/last for single value, all for JSON array, concat for ' | ' joined string"]:
    "first/last para valor único, all para array JSON, concat para string unida por ' | '",
  ['FNV-1a 64-bit hash of the normalised body token stream. Two pages sharing this hash are byte-identical post-tokenisation — the basis of the Exact Duplicate filter.']:
    'Hash FNV-1a de 64 bits do fluxo de tokens normalizado do corpo. Duas páginas que compartilham este hash são idênticas byte a byte após a tokenização — a base do filtro Duplicata exata.',
  ['For Basic, sent base64-encoded; for Digest, hashed into the challenge response.']:
    'Para Basic, enviada codificada em base64; para Digest, incorporada ao hash da resposta ao desafio.',
  ['For regex: `regex_group` extracts capture group 1; otherwise the whole match is used.']:
    'Para regex: `regex_group` extrai o grupo de captura 1; caso contrário, a correspondência inteira é usada.',
  ['Full-page renders the entire scrollable canvas; Above-the-fold captures just the initial viewport (cheaper). Both writes two PNGs per URL.']:
    'Página inteira renderiza toda a área rolável; Above-the-fold captura só a viewport inicial (mais barato). Ambos gravam dois PNGs por URL.',
  ['Google\'s index status, pulled from the URL Inspection API — not the Fetch button. Click "Inspect (top 100)" to fill this column; Fetch only pulls clicks / impressions / position.']:
    'Status de indexação do Google, obtido da API URL Inspection — não do botão Buscar. Clique em "Inspecionar (top 100)" para preencher esta coluna; Buscar traz apenas cliques / impressões / posição.',
  ["Googlebot — Smartphone matches Google's mobile-first indexing crawler."]:
    'Googlebot — Smartphone corresponde ao rastreador de indexação mobile-first do Google.',
  ['Hard cap on pending URLs held in memory. Excess discoveries are dropped silently — bounds peak heap during fan-out bursts (big sitemaps, dense link graphs).']:
    'Limite rígido de URLs pendentes mantidas em memória. Descobertas excedentes são descartadas em silêncio — limita o pico de heap durante rajadas de expansão (sitemaps grandes, grafos de links densos).',
  ['Hard cap on the number of 3xx hops we follow for a single chain. Each hop is recorded as its own URL row regardless. 0 disables the cap (chain still ends at `redirect_loop`).']:
    'Limite rígido do número de saltos 3xx que seguimos em uma única cadeia. Cada salto é registrado como sua própria linha de URL de qualquer forma. 0 desativa o limite (a cadeia ainda termina em `redirect_loop`).',
  ["Hard cap on total URLs crawled. The crawl stops as soon as this is reached. Screaming Frog: 'Limit Crawl Total'."]:
    "Limite rígido do total de URLs rastreadas. O rastreamento para assim que é atingido. Screaming Frog: 'Limit Crawl Total'.",
  ["Hard ceiling on requests per second across all workers combined. Equivalent to Screaming Frog's 'Max URL/s'. Acts as a token bucket — even with high concurrency the crawler waits between bursts to stay below this rate."]:
    "Teto rígido de requisições por segundo somando todos os workers. Equivale ao 'Max URL/s' do Screaming Frog. Funciona como um token bucket — mesmo com alta concorrência o rastreador espera entre rajadas para ficar abaixo desta taxa.",
  ['Height attribute value (in pixels) declared on the <img> tag, when present.']:
    'Valor do atributo height (em pixels) declarado na tag <img>, quando presente.',
  ["Honor Disallow rules + crawl-delay declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "Respeitar as regras Disallow + crawl-delay declaradas em /robots.txt para o User-Agent configurado. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt).",
  ["Hop count from the start URL. Start URL is depth 0; its outlinks are depth 1, theirs depth 2, and so on. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits)."]:
    "Número de saltos a partir da URL inicial. A URL inicial tem profundidade 0; seus links de saída profundidade 1, os deles profundidade 2, e assim por diante. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits).",
  ['How many distinct pages reference this image. High values typically indicate site-wide assets (logos, icons).']:
    'Quantas páginas distintas referenciam esta imagem. Valores altos geralmente indicam recursos de todo o site (logotipos, ícones).',
  ["How to canonicalise paths with/without a trailing slash. 'Add' is file-extension aware — won't add a slash to /file.pdf or /image.png."]:
    "Como canonicalizar caminhos com/sem barra final. 'Adicionar' considera a extensão do arquivo — não adiciona barra a /file.pdf nem a /image.png.",
  ['HTML attribute name to read.']: 'Nome do atributo HTML a ler.',
  ['HTML transfer size of the page document. Heavy HTML payloads delay first paint. Stored as bytes internally; entered here in kilobytes.']:
    'Tamanho de transferência HTML do documento da página. Cargas HTML pesadas atrasam a primeira pintura. Armazenado em bytes internamente; informado aqui em kilobytes.',
  ['HTTP `<img>` / `<video>` / `<audio>` / `<source>` references on an HTTPS page — rendered but the URL bar reads "Not Secure".']:
    'Referências HTTP de `<img>` / `<video>` / `<audio>` / `<source>` em uma página HTTPS — renderizadas, mas a barra de endereço mostra "Não seguro".',
  ['HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` references on an HTTPS page — browsers BLOCK these silently.']:
    'Referências HTTP de `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` em uma página HTTPS — os navegadores as BLOQUEIAM silenciosamente.',
  ['HTTP response status code. Empty/Failed indicates a network error before any response was received.']:
    'Código de status da resposta HTTP. Vazio/Falhou indica um erro de rede antes de qualquer resposta ser recebida.',
  ['HTTP status of the source page itself. Usually 200; if non-2xx the broken link may be inherited.']:
    'Status HTTP da própria página de origem. Normalmente 200; se não for 2xx, o link quebrado pode ser herdado.',
  ['HTTP status returned by the target. 0 = network failure (DNS, TLS, timeout).']:
    'Status HTTP retornado pelo destino. 0 = falha de rede (DNS, TLS, tempo limite).',
  ["HTTP/HTTPS proxies route via undici's ProxyAgent; SOCKS proxies (socks5://, socks5h://, socks4://, socks4a://) tunnel via the socks client. The `h`/`4a` variants resolve DNS at the proxy. Leave empty to inherit HTTPS_PROXY/HTTP_PROXY env vars."]:
    'Proxies HTTP/HTTPS são roteados pelo ProxyAgent do undici; proxies SOCKS (socks5://, socks5h://, socks4://, socks4a://) são tunelados pelo cliente socks. As variantes `h`/`4a` resolvem o DNS no proxy. Deixe vazio para herdar as variáveis de ambiente HTTPS_PROXY/HTTP_PROXY.',
  ["Identifies the largest element visible in the initial viewport (likely LCP candidate per Google's heuristic) and stores its CSS selector, dimensions, and resource URL. Useful for spotting unoptimised LCP images without a PSI API call."]:
    'Identifica o maior elemento visível na viewport inicial (provável candidato a LCP pela heurística do Google) e armazena seu seletor CSS, dimensões e URL do recurso. Útil para encontrar imagens LCP não otimizadas sem uma chamada à API do PSI.',
  ['If set, Playwright waits for this CSS selector to appear in the DOM before extracting HTML. Overrides the extra-wait timeout when present. Useful when you know the SPA reveals a specific element after hydration.']:
    'Se definido, o Playwright espera este seletor CSS aparecer no DOM antes de extrair o HTML. Substitui o tempo de espera extra quando presente. Útil quando você sabe que a SPA revela um elemento específico após a hidratação.',
  ['Images on this page that have no alt attribute. WCAG accessibility issue + missed alt-as-anchor SEO opportunity.']:
    'Imagens desta página sem atributo alt. Problema de acessibilidade WCAG + oportunidade SEO perdida de alt como texto âncora.',
  ['Indexable / Non-Indexable']: 'Indexável / Não indexável',
  ['Internal PageRank, 0–100. Computed over the internal link graph (damping 0.85) and normalised so the most-linked page scores 100. Higher = more internal link equity.']:
    'PageRank interno, 0–100. Calculado sobre o grafo de links internos (amortecimento 0.85) e normalizado para que a página mais linkada pontue 100. Maior = mais equidade de links internos.',
  ['internal / external']: 'interno / externo',
  ['JavaScript executed in every page BEFORE navigation begins (init script). Use to set localStorage / cookies / mock APIs / disable animations. Runs in page context — no Node access.']:
    'JavaScript executado em cada página ANTES de a navegação começar (script de inicialização). Use para definir localStorage / cookies / simular APIs / desativar animações. Roda no contexto da página — sem acesso ao Node.',
  ['JavaScript regex (no flags — /g is implicit). Use a capture group with `output=regex_group` to extract just part of the match.']:
    'Regex JavaScript (sem flags — /g é implícito). Use um grupo de captura com `output=regex_group` para extrair apenas parte da correspondência.',
  ['JavaScript regex tested against the full URL. Empty = all URLs allowed. URL must match at least one to be enqueued. The start URL is always permitted regardless.']:
    'Regex JavaScript testada contra a URL completa. Vazio = todas as URLs permitidas. A URL deve corresponder a pelo menos uma para ser enfileirada. A URL inicial é sempre permitida.',
  ['JavaScript regex. Any match → URL is skipped, even if it would otherwise pass the include list. Common uses: skip admin areas, large file types, session-id query params.']:
    'Regex JavaScript. Qualquer correspondência → a URL é ignorada, mesmo que passasse pela lista de inclusão. Usos comuns: pular áreas administrativas, tipos de arquivo grandes, parâmetros de sessão na query.',
  ['JSON map of `{ term: count }` literal-substring hits from the configured Custom Search terms.']:
    'Mapa JSON de `{ term: count }` com ocorrências literais de substring dos termos de Busca personalizada configurados.',
  ['JSON-stringified array of `{ lang, href }` pairs. Heavy column — better consumed via the URL Details panel.']:
    'Array serializado em JSON de pares `{ lang, href }`. Coluna pesada — melhor consumir pelo painel Detalhes da URL.',
  ['JSON-stringified custom-extraction results map. Heavy column — render verbatim, easier to read in the URL Details panel.']:
    'Mapa de resultados de extração personalizada serializado em JSON. Coluna pesada — exibido como está, mais fácil de ler no painel Detalhes da URL.',
  ['JSONPath against a JSON response body (e.g. `application/json` APIs). Only runs on responses that parse as JSON — ignored on HTML pages.']:
    'JSONPath contra o corpo de uma resposta JSON (p. ex. APIs `application/json`). Só roda em respostas que são analisadas como JSON — ignorado em páginas HTML.',
  ['JSONPath returns the matched JSON value as-is; choose `Count` to return the number of matches instead.']:
    'JSONPath retorna o valor JSON correspondente como está; escolha `Count` para retornar o número de correspondências em vez disso.',
  ["Largest Contentful Paint from PageSpeed Insights lab data, when the URL has been audited. Google's 'good' LCP threshold is 2500 ms. Pages without PSI data are never flagged on this metric."]:
    "Largest Contentful Paint dos dados de laboratório do PageSpeed Insights, quando a URL foi auditada. O limite 'bom' de LCP do Google é 2500 ms. Páginas sem dados do PSI nunca são sinalizadas nesta métrica.",
  ['load = good default. networkidle for heavy SPAs. domcontentloaded if you only need raw HTML.']:
    'load = bom padrão. networkidle para SPAs pesadas. domcontentloaded se você só precisa do HTML bruto.',
  ['Location header value when status is 3xx. The URL the server points to next; chain length is in the URL Details panel.']:
    'Valor do cabeçalho Location quando o status é 3xx. A URL para a qual o servidor aponta a seguir; o comprimento da cadeia está no painel Detalhes da URL.',
  ['Lowercases the URL path component. Host is already case-insensitive per the URL spec, so this only affects the path.']:
    'Converte para minúsculas o componente de caminho da URL. O host já é insensível a maiúsculas pela especificação de URL, então isso afeta apenas o caminho.',
  ['Near-duplicate cluster ID assigned by the post-crawl SimHash pass. 0 = singleton (no near-duplicates within the configured Hamming threshold). Pages sharing a non-zero cluster ID are mutually similar.']:
    'ID do grupo de quase duplicatas atribuído pela etapa SimHash pós-rastreamento. 0 = singleton (sem quase duplicatas dentro do limite de Hamming configurado). Páginas que compartilham um ID diferente de zero são mutuamente semelhantes.',
  ['noindex, canonicalised, redirected, blocked-by-robots']:
    'noindex, canonicalizada, redirecionada, bloqueada por robots',
  ['None for fastest crawl. Above-the-fold for SERP-thumbnail-style preview. Full page when you need long-page snapshots.']:
    'Nenhuma para o rastreamento mais rápido. Above-the-fold para uma prévia estilo miniatura de SERP. Página inteira quando você precisa de capturas de páginas longas.',
  ['Number of `<form action="http://…">` declarations on an HTTPS page. Submitting one downgrades the connection.']:
    'Número de declarações `<form action="http://…">` em uma página HTTPS. Enviar uma delas rebaixa a conexão.',
  ['Number of `<link rel="alternate" hreflang>` entries declared on this page. 0 = no alternates declared.']:
    'Número de entradas `<link rel="alternate" hreflang>` declaradas nesta página. 0 = nenhuma alternativa declarada.',
  ['Number of `<link rel="canonical">` tags on the page. >1 is a "Multiple Canonicals" issue.']:
    'Número de tags `<link rel="canonical">` na página. >1 é um problema de "Múltiplos canonicals".',
  ['Number of `<script type="application/ld+json">` blocks parsed successfully on the page.']:
    'Número de blocos `<script type="application/ld+json">` analisados com sucesso na página.',
  ['Number of `<script type="application/ld+json">` blocks that failed to parse as JSON.']:
    'Número de blocos `<script type="application/ld+json">` que falharam ao ser analisados como JSON.',
  ['Number of <img> elements on the page.']: 'Número de elementos <img> na página.',
  ['Number of browser tabs the pool keeps warm in parallel. 0 = auto (matches crawler concurrency, capped at 8). More tabs = faster crawl but more RAM (each tab ~80–150 MB).']:
    'Número de abas do navegador que o pool mantém abertas em paralelo. 0 = automático (igual à concorrência do rastreador, com teto de 8). Mais abas = rastreamento mais rápido, porém mais RAM (cada aba ~80–150 MB).',
  ['Number of hreflang targets that are non-200, noindex, or canonicalised away. Aggregated by the post-crawl pass.']:
    'Número de destinos hreflang que não são 200, têm noindex ou foram canonicalizados para outra URL. Agregado pela etapa pós-rastreamento.',
  ["Number of HTTP requests in flight at any one time. Equivalent to Screaming Frog's 'Max Threads'. Higher = faster crawl + more load on the target server."]:
    "Número de requisições HTTP em andamento a qualquer momento. Equivale ao 'Max Threads' do Screaming Frog. Maior = rastreamento mais rápido + mais carga no servidor de destino.",
  ['Number of internal `<a>` elements with no usable anchor text or alt — accessibility / SEO regression.']:
    'Número de elementos `<a>` internos sem texto âncora ou alt utilizável — regressão de acessibilidade / SEO.',
  ['Number of internal pages that link to this URL. A rough internal-PageRank signal.']:
    'Número de páginas internas que apontam para esta URL. Um sinal aproximado de PageRank interno.',
  ["Number of pages in this URL's near-duplicate cluster (1 = no duplicates, ≥2 = part of a duplicate group). Tunable via Settings → Duplicates."]:
    'Número de páginas no grupo de quase duplicatas desta URL (1 = sem duplicatas, ≥2 = parte de um grupo de duplicatas). Ajustável em Configurações → Duplicatas.',
  ['Number of redirect hops from this URL to its terminal target. Filled by the post-crawl `recomputeRedirectChains` walker. >3 trips the "Long Chain" issue.']:
    'Número de saltos de redirecionamento desta URL até seu destino final. Preenchido pelo percurso `recomputeRedirectChains` pós-rastreamento. >3 dispara o problema "Cadeia longa".',
  ['Number of unique <a> links emitted from this page (internal + external).']:
    'Número de links <a> únicos emitidos desta página (internos + externos).',
  ['Off — only enable for testing edge cases.']:
    'Desligado — ative apenas para testar casos extremos.',
  ['Off — small speed gain not worth the fidelity loss.']:
    'Desligado — o pequeno ganho de velocidade não compensa a perda de fidelidade.',
  ['On — fonts add overhead without changing SEO output.']:
    'Ligado — fontes adicionam sobrecarga sem mudar o resultado SEO.',
  ['On (default) — cheap I/O, high SEO value.']: 'Ligado (padrão) — E/S barata, alto valor SEO.',
  ['On (default) — media is heavy and rarely SEO-relevant.']:
    'Ligado (padrão) — mídia é pesada e raramente relevante para SEO.',
  ['On (default) so the Internal tab shows images, not just HTML; off for HTML-only crawls.']:
    'Ligado (padrão) para que a aba Interno mostre imagens, não só HTML; desligado para rastreamentos somente HTML.',
  ['On (default); off for HTML-only crawls.']:
    'Ligado (padrão); desligado para rastreamentos somente HTML.',
  ['On (default). Off only when crawling sites you own and need to bypass.']:
    'Ligado (padrão). Desligue apenas ao rastrear sites seus que você precise contornar.',
  ['On for accessibility / WCAG audits.']: 'Ligado para auditorias de acessibilidade / WCAG.',
  ['On for max speed. Off if you need LCP candidate detection or visual screenshots later.']:
    'Ligado para velocidade máxima. Desligado se você precisar depois de detecção de candidatos a LCP ou capturas visuais.',
  ['On for modern sites that 301 http→https anyway; off for legacy intranet.']:
    'Ligado para sites modernos que de qualquer forma redirecionam 301 de http para https; desligado para intranets legadas.',
  ['On for normal audits; off when you only want to inspect raw 3xx behaviour.']:
    'Ligado para auditorias normais; desligado quando você quer apenas inspecionar o comportamento 3xx bruto.',
  ['On for outbound link audits; off for fast internal-only crawls.']:
    'Ligado para auditorias de links de saída; desligado para rastreamentos rápidos somente internos.',
  ['On for performance-focused audits that should fail pages over a target.']:
    'Ligado para auditorias focadas em desempenho que devem reprovar páginas acima de uma meta.',
  ['On for performance-focused audits.']: 'Ligado para auditorias focadas em desempenho.',
  ['On for production crawls. Off when debugging selector-not-found / hydration issues.']:
    'Ligado para rastreamentos de produção. Desligado ao depurar problemas de seletor não encontrado / hidratação.',
  ['ON for SEO audits (the typical case). Turn OFF to also cluster paginated / canonical-blocked variants for completeness.']:
    'LIGADO para auditorias SEO (o caso típico). DESLIGUE para agrupar também variantes paginadas / bloqueadas por canonical, por completude.',
  ["On for SEO audits that include Google's Mobile-Friendly checks."]:
    'Ligado para auditorias SEO que incluem as verificações Mobile-Friendly do Google.',
  ['On for SEO audits where View Source matters; off for 1M-URL crawls where disk is tight.']:
    'Ligado para auditorias SEO em que Ver código-fonte importa; desligado para rastreamentos de 1M de URLs com pouco espaço em disco.',
  ['ON for SEO audits. OFF only when you specifically need to inspect raw-URL collisions (e.g. case-sensitive filesystem CMSes).']:
    'LIGADO para auditorias SEO. DESLIGUE apenas quando precisar inspecionar especificamente colisões de URL bruta (p. ex. CMSs com sistema de arquivos sensível a maiúsculas).',
  ['On if you need nofollow attribute audits; off keeps the link graph cleaner.']:
    'Ligado se você precisa auditar o atributo nofollow; desligado mantém o grafo de links mais limpo.',
  ['On if your CMS serves the same page at mixed casing (/Foo and /foo).']:
    'Ligado se seu CMS serve a mesma página com maiúsculas e minúsculas misturadas (/Foo e /foo).',
  ['On if your site canonicalises to non-www but emits www links somewhere.']:
    'Ligado se seu site canonicaliza para sem www, mas emite links com www em algum lugar.',
  ["On network errors, 408/425/429/5xx responses, retry up to N more times before giving up. Each retry counts toward the URL's response time budget."]:
    'Em erros de rede e respostas 408/425/429/5xx, tentar de novo até N vezes antes de desistir. Cada nova tentativa conta para o orçamento de tempo de resposta da URL.',
  ['On when auditing mobile UX or capturing PageSpeed-style mobile previews.']:
    'Ligado ao auditar a UX mobile ou capturar prévias mobile no estilo PageSpeed.',
  ["One header per line in 'Key: Value' format. Added to every request — useful for auth tokens or custom routing hints. User values override defaults when keys collide."]:
    "Um cabeçalho por linha no formato 'Chave: Valor'. Adicionado a cada requisição — útil para tokens de autenticação ou dicas de roteamento personalizadas. Valores do usuário sobrescrevem os padrões quando as chaves colidem.",
  ['One sitemap URL per line. On top of following links from the start URL, the crawler fetches these sitemaps and queues every page they list as an extra seed — faster/more complete discovery, and reliable orphan detection even when the sitemap lives at a non-standard path. Leave empty to disable.']:
    'Uma URL de sitemap por linha. Além de seguir links a partir da URL inicial, o rastreador busca esses sitemaps e enfileira cada página listada como semente extra — descoberta mais rápida/completa e detecção confiável de órfãs mesmo quando o sitemap fica em um caminho fora do padrão. Deixe vazio para desativar.',
  ['One URL per line. Each is fetched exactly once; outlinks are NOT followed. Comments starting with # are ignored.']:
    'Uma URL por linha. Cada uma é buscada exatamente uma vez; links de saída NÃO são seguidos. Comentários começando com # são ignorados.',
  ['OS scheduler hint applied at crawl start. Lowering priority lets the rest of the machine stay responsive during heavy crawls. May require elevated privileges on some platforms.']:
    'Dica ao agendador do SO aplicada no início do rastreamento. Baixar a prioridade deixa o resto da máquina responsivo durante rastreamentos pesados. Pode exigir privilégios elevados em algumas plataformas.',
  ["Page A→B declared but B→A absent flags 'Reciprocity Missing'; same lang on two hrefs flags 'Inconsistent Lang'."]:
    "Página A→B declarada mas B→A ausente marca 'Reciprocidade ausente'; o mesmo lang em dois hrefs marca 'Lang inconsistente'.",
  ['Page that contains the broken link.']: 'Página que contém o link quebrado.',
  ["Pages with > this many outgoing links (internal + external) trip the 'Total Links per Page' issue. Google's historic recommendation is 100; mega-menus/hub-pages routinely blow past this."]:
    "Páginas com mais do que esta quantidade de links de saída (internos + externos) disparam o problema 'Total de links por página'. A recomendação histórica do Google é 100; megamenus/páginas hub ultrapassam isso rotineiramente.",
  ['PASS = indexed · FAIL = not indexed · PART/NEU = discovered but not yet indexed']:
    'PASS = indexada · FAIL = não indexada · PART/NEU = descoberta mas ainda não indexada',
  ['Pattern: ^https://m\\.(.+) · Replacement: https://www.$1 · Flags: i  (collapse mobile subdomain to www)']:
    'Padrão: ^https://m\\.(.+) · Substituição: https://www.$1 · Flags: i  (recolher o subdomínio mobile em www)',
  ["Per-request abort threshold. Pages that take longer than this are recorded as network errors. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — that one's in seconds, this is in milliseconds."]:
    "Limite de cancelamento por requisição. Páginas que demoram mais que isso são registradas como erros de rede. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — aquele é em segundos, este em milissegundos.",
  ['Persist rel="nofollow" links in the link graph. When off, nofollow links are dropped entirely (not counted in outlinks, not probed as externals). Screaming Frog inverse: turning this ON ≈ unchecking "Follow Internal/External Nofollow".']:
    'Manter links rel="nofollow" no grafo de links. Quando desligado, links nofollow são descartados por completo (não contam nos links de saída, não são sondados como externos). Inverso do Screaming Frog: ligar isto ≈ desmarcar "Follow Internal/External Nofollow".',
  ['Picking a preset fills the User-Agent field below — you can still hand-edit it afterwards. Switch between Googlebot Smartphone / Desktop to compare how a site responds to mobile vs desktop crawlers.']:
    'Escolher uma predefinição preenche o campo User-Agent abaixo — você ainda pode editá-lo à mão depois. Alterne entre Googlebot Smartphone / Desktop para comparar como um site responde a rastreadores mobile e desktop.',
  ["Picks one of the saved profiles by name. Empty = use the Proxy URL field above (or env vars when that's also empty)."]:
    'Escolhe um dos perfis salvos pelo nome. Vazio = usar o campo URL do proxy acima (ou as variáveis de ambiente quando ele também estiver vazio).',
  ['Pre-computes Dead External Domain, Duplicate URL post-norm, Canonical Chain Multi-hop. Without this the sidebar shows 0 for those three.']:
    'Pré-calcula Domínio externo morto, URL duplicada pós-normalização e Cadeia de canonicals multi-salto. Sem isso, a barra lateral mostra 0 para esses três.',
  ['After the crawl, re-fetches a sample of indexable pages with the opposite user agent (mobile when the crawl ran as desktop, desktop otherwise) and compares title, H1, meta description, canonical, robots, word count and link count. Differences feed the \'Mobile / Desktop Mismatch\' issue and the report of the same name.']:
    'Após o rastreamento, baixa novamente uma amostra de páginas indexáveis com o user agent oposto (mobile se o rastreamento foi desktop, e vice-versa) e compara título, H1, meta description, canonical, robots, contagem de palavras e de links. As diferenças alimentam o problema \'Divergência mobile / desktop\' e o relatório de mesmo nome.',
  ['How many pages the mobile-parity probe re-fetches, most-linked first. 0 = every indexable HTML page (doubles the crawl\'s traffic for that set).']:
    'Quantas páginas a sonda de paridade mobile baixa novamente, as mais linkadas primeiro. 0 = todas as páginas HTML indexáveis (dobra o tráfego do rastreamento para esse conjunto).',
  ["Probe outbound links to other hosts (HEAD only) so the Broken Links view catches dead externals. Screaming Frog: 'External Links' (Configuration → Spider → Crawl)."]:
    "Sondar links de saída para outros hosts (apenas HEAD) para que a visão Links quebrados capture externos mortos. Screaming Frog: 'External Links' (Configuration → Spider → Crawl).",
  ['Raw `Content-Security-Policy` response header. Empty when missing.']:
    'Cabeçalho de resposta `Content-Security-Policy` bruto. Vazio quando ausente.',
  ['Raw `content` attribute of `<meta http-equiv="refresh">`, e.g. "5; url=/foo".']:
    'Atributo `content` bruto de `<meta http-equiv="refresh">`, p. ex. "5; url=/foo".',
  ['Raw `Strict-Transport-Security` header. Empty when missing — for HTTPS pages this is a security regression.']:
    'Cabeçalho `Strict-Transport-Security` bruto. Vazio quando ausente — para páginas HTTPS isso é uma regressão de segurança.',
  ['Raw `X-Content-Type-Options` header. `nosniff` blocks MIME sniffing — prevents some XSS via content-type confusion.']:
    'Cabeçalho `X-Content-Type-Options` bruto. `nosniff` bloqueia o sniffing de MIME — evita alguns XSS por confusão de content-type.',
  ['Raw `X-Frame-Options` header. SAMEORIGIN / DENY / ALLOW-FROM. Clickjacking defence.']:
    'Cabeçalho `X-Frame-Options` bruto. SAMEORIGIN / DENY / ALLOW-FROM. Defesa contra clickjacking.',
  ['Raw value of the Content-Type response header (incl. charset).']:
    'Valor bruto do cabeçalho de resposta Content-Type (incl. charset).',
  ['Re-renders each page on a mobile viewport and checks viewport meta tag, horizontal overflow, font size legibility, and tap-target spacing. Stores a pass/fail verdict on the urls table.']:
    'Renderiza cada página novamente em uma viewport mobile e verifica a meta tag viewport, o transbordamento horizontal, a legibilidade do tamanho da fonte e o espaçamento dos alvos de toque. Armazena um veredito aprovado/reprovado na tabela urls.',
  ['Read the full article →']: 'Ler o artigo completo →',
  ["Reject-all = ignore Set-Cookie entirely (zero counts on cookie-flag issues). Block-third-party = analyse only first-party cookies (Domain attribute matches the page's registrable domain). Accept-all = analyse every Set-Cookie regardless of scope."]:
    'Rejeitar tudo = ignorar Set-Cookie por completo (contagens zero nos problemas de flags de cookie). Bloquear terceiros = analisar apenas cookies próprios (o atributo Domain corresponde ao domínio registrável da página). Aceitar tudo = analisar todo Set-Cookie independentemente do escopo.',
  ["Reject-all for stateless audits; Block-third-party to focus on the site's own cookie hygiene; Accept-all to also see ad/analytics tracker cookies."]:
    'Rejeitar tudo para auditorias sem estado; Bloquear terceiros para focar na higiene de cookies do próprio site; Aceitar tudo para ver também cookies de rastreadores de anúncios/analytics.',
  ["Removes the leading 'www.' from the host at normalisation time. The seen-set, redirect graph, and link extraction all use the rewritten form, so duplicates collapse correctly."]:
    "Remove o 'www.' inicial do host na normalização. O conjunto de vistos, o grafo de redirecionamentos e a extração de links usam a forma reescrita, então as duplicatas se consolidam corretamente.",
  ['Renders the page a second time on a mobile viewport and stores an above-the-fold PNG. Adds another full render + screenshot per URL.']:
    'Renderiza a página uma segunda vez em uma viewport mobile e armazena um PNG above-the-fold. Adiciona mais uma renderização completa + captura por URL.',
  ['Resolved absolute URL of the <img src> attribute.']:
    'URL absoluta resolvida do atributo <img src>.',
  ['Response body size in bytes (compressed transfer size, post-Content-Encoding).']:
    'Tamanho do corpo da resposta em bytes (tamanho de transferência comprimido, após Content-Encoding).',
  ['Rewrites http:// to https:// before fetching. Breaks HTTP-only sites.']:
    'Reescreve http:// para https:// antes de buscar. Quebra sites somente HTTP.',
  ['Run Chromium without a visible window. Turn off to debug rendering visually — useful when a page renders correctly in a normal browser but not under Playwright.']:
    'Executar o Chromium sem janela visível. Desligue para depurar a renderização visualmente — útil quando uma página renderiza corretamente em um navegador normal, mas não sob o Playwright.',
  ['Run the login steps once before the crawl, then replay the session cookies on every request.']:
    'Executar os passos de login uma vez antes do rastreamento e reutilizar os cookies de sessão em cada requisição.',
  ["Runs iterative PageRank (damping 0.85) over the internal link graph and normalises it to a 0–100 Link Score per page. Drives the Link Score column and the 'By Link Score' visualization colour mode."]:
    "Executa PageRank iterativo (amortecimento 0.85) sobre o grafo de links internos e o normaliza para uma Pontuação de links de 0–100 por página. Alimenta a coluna Pontuação de links e o modo de cor 'Por pontuação de links' da visualização.",
  ['Sends the URL through the same normalisation pipeline used by the crawler, with your unsaved settings applied. Useful for verifying regex rules before kicking off a crawl.']:
    'Passa a URL pelo mesmo pipeline de normalização usado pelo rastreador, com suas configurações não salvas aplicadas. Útil para verificar regras regex antes de iniciar um rastreamento.',
  ['Sent on every request as the User-Agent header. Identifies the crawler to servers; some sites serve different content based on UA.']:
    'Enviado em cada requisição como cabeçalho User-Agent. Identifica o rastreador aos servidores; alguns sites servem conteúdo diferente conforme o UA.',
  ['Sent on every request. Affects which locale a multi-lingual site serves you.']:
    'Enviado em cada requisição. Afeta qual localidade um site multilíngue serve a você.',
  ["Sent verbatim as `Bearer <token>`. Don't include the `Bearer ` prefix yourself."]:
    'Enviado literalmente como `Bearer <token>`. Não inclua você mesmo o prefixo `Bearer `.',
  ['Server response time (a TTFB proxy) measured during the crawl. Pages slower than this are flagged. Google considers a good server response time under 800 ms.']:
    'Tempo de resposta do servidor (uma aproximação de TTFB) medido durante o rastreamento. Páginas mais lentas que isso são sinalizadas. O Google considera bom um tempo de resposta do servidor abaixo de 800 ms.',
  ['Shop the latest game keys at unbeatable prices…']:
    'Compre as chaves de jogos mais recentes a preços imbatíveis…',
  ["Skips body parsing for pages whose Content-Length header exceeds this. The page row is still created so links to it aren't lost; only body parsing and source snapshot capture are skipped."]:
    'Pula a análise do corpo em páginas cujo cabeçalho Content-Length excede este valor. A linha da página ainda é criada para que os links para ela não se percam; só a análise do corpo e a captura do código-fonte são puladas.',
  ['Sleep this long on each worker AFTER a response completes, before it picks up the next URL. Stacks with the global RPS cap — useful for sites that rate-limit on inter-request gap rather than total throughput.']:
    'Dormir por este tempo em cada worker DEPOIS que uma resposta termina, antes de pegar a próxima URL. Soma-se ao teto global de RPS — útil para sites que limitam pelo intervalo entre requisições em vez do throughput total.',
  ['Specific reason a URL is non-indexable. For Indexable URLs this column is empty.']:
    'Motivo específico pelo qual uma URL não é indexável. Para URLs indexáveis esta coluna fica vazia.',
  ['Spider follows links from the start URL across the chosen scope. List fetches a fixed set of URLs once with no link-following. Sitemap fetches a sitemap URL and crawls every page it lists (no link-following).']:
    'Spider segue links a partir da URL inicial dentro do escopo escolhido. Lista busca um conjunto fixo de URLs uma vez sem seguir links. Sitemap busca uma URL de sitemap e rastreia cada página listada (sem seguir links).',
  ["Spider for full site audits; List for re-checking a known set of pages; Sitemap to audit exactly what's published in sitemap.xml."]:
    'Spider para auditorias completas do site; Lista para reverificar um conjunto conhecido de páginas; Sitemap para auditar exatamente o que está publicado no sitemap.xml.',
  ['Standard CSS selector — same syntax as `document.querySelectorAll`.']:
    'Seletor CSS padrão — mesma sintaxe de `document.querySelectorAll`.',
  ['Stored in your local prefs file as plain text. Treat the file accordingly.']:
    'Armazenado no seu arquivo de preferências local em texto puro. Trate o arquivo de acordo.',
  ['Strip if your site canonicalises /foo (no slash); Add for sites that canonicalise /foo/.']:
    'Remover se seu site canonicaliza /foo (sem barra); Adicionar para sites que canonicalizam /foo/.',
  ['Sunset over the mountain ridge']: 'Pôr do sol sobre a crista da montanha',
  ['Surplus `@id` occurrences across all JSON-LD blocks (page declares the same `@id` more than once).']:
    'Ocorrências excedentes de `@id` em todos os blocos JSON-LD (a página declara o mesmo `@id` mais de uma vez).',
  ['Terminal URL the redirect chain resolves to. Empty when this row is itself the terminal (i.e. status is 2xx/4xx/5xx) or when the chain hits a loop.']:
    'URL final para a qual a cadeia de redirecionamentos resolve. Vazio quando esta linha é ela mesma o terminal (ou seja, status 2xx/4xx/5xx) ou quando a cadeia entra em um loop.',
  ['Canonical hops walked after this page (or, on a redirect row, after the redirect\'s final URL) until a page that canonicalises to itself. 0 when the canonical is the page itself or absent.']:
    'Saltos canonical percorridos após esta página (ou, em uma linha de redirecionamento, após a URL final do redirecionamento) até uma página que se canonicaliza para si mesma. 0 quando o canonical é a própria página ou está ausente.',
  ['Where the canonical chain ends. Empty when the page is its own canonical, or when the chain loops.']:
    'Onde a cadeia canonical termina. Vazio quando a página é seu próprio canonical ou quando a cadeia entra em loop.',
  ['text for visible content, attribute for href/src, count for occurrence count']:
    'text para conteúdo visível, attribute para href/src, count para contagem de ocorrências',
  ['Text of the first <h1> on the page. Should match user intent and ideally complement (not duplicate) the title.']:
    'Texto do primeiro <h1> da página. Deve corresponder à intenção do usuário e idealmente complementar (não duplicar) o título.',
  ["Text Only fetches the raw HTML response as-is — fast and deterministic. Old AJAX Crawling Scheme rewrites hashbang (#!) URLs to Google's deprecated ?_escaped_fragment_= form so a pre-rendering server returns the snapshot. Full JavaScript rendering is a V2 item."]:
    'Somente texto busca a resposta HTML bruta como está — rápido e determinístico. O antigo AJAX Crawling Scheme reescreve URLs com hashbang (#!) para a forma obsoleta do Google ?_escaped_fragment_= para que um servidor de pré-renderização retorne o snapshot. A renderização JavaScript completa é um item da V2.',
  ['Text Only for server-rendered / static sites; Old AJAX only for legacy hashbang SPAs.']:
    'Somente texto para sites estáticos / renderizados no servidor; AJAX antigo apenas para SPAs legadas com hashbang.',
  ["The column / JSON-key name for this rule's output. Free-form."]:
    'Nome da coluna / chave JSON para a saída desta regra. Texto livre.',
  ['The fully normalised URL of the crawled resource (post URL-rewriting).']:
    'A URL totalmente normalizada do recurso rastreado (após a reescrita de URL).',
  ['The URL that fails to resolve (4xx/5xx/network error).']:
    'A URL que não resolve (4xx/5xx/erro de rede).',
  ['Third-party `<script>` / `<link rel=stylesheet>` references without an `integrity=` attribute. SRI is recommended for any cross-origin subresource.']:
    'Referências de terceiros `<script>` / `<link rel=stylesheet>` sem atributo `integrity=`. SRI é recomendado para qualquer subrecurso cross-origin.',
  ['Time-to-first-byte in milliseconds (network + server, excluding parse). Lower is better; >2000 ms is slow.']:
    'Tempo até o primeiro byte em milissegundos (rede + servidor, excluindo análise). Menor é melhor; >2000 ms é lento.',
  ['Total number of <h1> elements on the page. SEO best practice is exactly 1.']:
    'Número total de elementos <h1> na página. A boa prática SEO é exatamente 1.',
  ['Total number of <h2> elements on the page.']: 'Número total de elementos <h2> na página.',
  ['tr,en;q=0.8 — Turkish first, English fallback.']:
    'tr,en;q=0.8 — turco primeiro, inglês como alternativa.',
  ["Trips 'Folder Depth Too Deep' when the URL path's `/`-segment count exceeds this. Useful for spotting over-nested URL structures that bury content from crawlers."]:
    "Dispara 'Profundidade de pastas excessiva' quando o número de segmentos `/` do caminho da URL excede este valor. Útil para encontrar estruturas de URL aninhadas demais que escondem conteúdo dos rastreadores.",
  ["Trips 'Long Query String' when LENGTH(query) > this. Typical session-id sprawl + UTM tracking hits 100+ chars; over 200 starts to look like a bug."]:
    "Dispara 'Query string longa' quando LENGTH(query) > este valor. A típica proliferação de ids de sessão + rastreamento UTM chega a 100+ caracteres; acima de 200 começa a parecer um bug.",
  ["Trips the 'URL Too Long' issue when LENGTH(url) > this. RFC 7230 doesn't mandate a max but most servers + middleboxes fail above ~2 KB; Chrome itself caps at ~32 KB."]:
    "Dispara o problema 'URL longa demais' quando LENGTH(url) > este valor. A RFC 7230 não impõe um máximo, mas a maioria dos servidores e middleboxes falha acima de ~2 KB; o próprio Chrome limita a ~32 KB.",
  ["Two modes per line. (1) Wrap in slashes for a regex: /pattern/flags — supported flags imsuy (g is forced). Invalid patterns appear with count -1 in the detail panel so you can spot the typo. (2) Anything else is a literal case-insensitive substring — the legacy behaviour. Each term's per-page hit count is surfaced in the URL Details panel."]:
    'Dois modos por linha. (1) Envolva em barras para uma regex: /padrão/flags — flags suportadas imsuy (g é forçado). Padrões inválidos aparecem com contagem -1 no painel de detalhe para você achar o erro de digitação. (2) Qualquer outra coisa é uma substring literal sem distinção de maiúsculas — o comportamento legado. A contagem de ocorrências por página de cada termo aparece no painel Detalhes da URL.',
  ["Two pages are flagged as near-duplicates if their 64-bit SimHash differs by at most this many bits. 3 ≈ 95% similarity over body-text shingles (Screaming Frog's tightest filter). Set to 0 to skip clustering entirely."]:
    'Duas páginas são marcadas como quase duplicatas se seus SimHashes de 64 bits diferem em no máximo esta quantidade de bits. 3 ≈ 95% de similaridade sobre shingles do texto do corpo (o filtro mais rigoroso do Screaming Frog). Defina 0 para pular o agrupamento por completo.',
  ['URL declared by the first <link rel="canonical"> tag. Tells search engines which version to index when duplicates exist.']:
    'URL declarada pela primeira tag <link rel="canonical">. Diz aos mecanismos de busca qual versão indexar quando existem duplicatas.',
  ['URL paths ending in any of these extensions are not enqueued. Case-insensitive. Start URL is always crawled regardless.']:
    'Caminhos de URL que terminam em qualquer uma destas extensões não são enfileirados. Sem distinção de maiúsculas. A URL inicial é sempre rastreada de qualquer forma.',
  ['Value of the alt attribute. Empty cell = no alt declared (accessibility/SEO issue).']:
    'Valor do atributo alt. Célula vazia = nenhum alt declarado (problema de acessibilidade/SEO).',
  ['Value of the X-Robots-Tag HTTP response header. Same semantics as meta robots but applied at the server.']:
    'Valor do cabeçalho de resposta HTTP X-Robots-Tag. Mesma semântica do meta robots, mas aplicada no servidor.',
  ['Viewport height — affects above-the-fold detection and lazy-load triggers.']:
    'Altura da viewport — afeta a detecção above-the-fold e os gatilhos de carregamento lento.',
  ['Viewport width applied to every rendered page. Mobile audits typically use 360–414, desktop 1280–1920.']:
    'Largura da viewport aplicada a cada página renderizada. Auditorias mobile normalmente usam 360–414, desktop 1280–1920.',
  ['Visible body text word count (excludes <script>/<style>). Useful for identifying thin content.']:
    'Contagem de palavras do texto visível do corpo (exclui <script>/<style>). Útil para identificar conteúdo raso.',
  ['Wait this long before the FIRST retry, doubling on each subsequent attempt (500 → 1000 → 2000 …).']:
    'Esperar este tempo antes da PRIMEIRA nova tentativa, dobrando a cada tentativa seguinte (500 → 1000 → 2000 …).',
  ["Walks 3xx redirect chains, fills `redirect_chain_length` / `redirect_loop`. Drives the 'Long Chain' and 'Redirect Loop' issues + the Redirects tab."]:
    "Percorre cadeias de redirecionamento 3xx e preenche `redirect_chain_length` / `redirect_loop`. Alimenta os problemas 'Cadeia longa' e 'Loop de redirecionamento' + a aba Redirecionamentos.",
  ['Welcome to Example Store']: 'Bem-vindo à Loja de exemplo',
  ['What to do when multiple matches exist.']:
    'O que fazer quando existem múltiplas correspondências.',
  ['What to read off each matched element. Ignored for an XPath `/@attr` or `/text()` terminal — that value is used directly.']:
    'O que ler de cada elemento correspondente. Ignorado para um terminal XPath `/@attr` ou `/text()` — esse valor é usado diretamente.',
  ['When non-empty, ALL query parameters not on this list are dropped during normalisation (case-insensitive name match). Leave empty to keep the default behaviour, which strips just utm_*, fbclid, gclid, mc_cid, and mc_eid.']:
    'Quando não vazio, TODOS os parâmetros de query fora desta lista são removidos durante a normalização (correspondência de nome sem distinção de maiúsculas). Deixe vazio para manter o comportamento padrão, que remove apenas utm_*, fbclid, gclid, mc_cid e mc_eid.',
  ['When off, no budget evaluation runs and the verdict column is cleared. When on, the post-crawl pass scores every internal 200 HTML page against the ceilings below.']:
    'Quando desligado, nenhuma avaliação de orçamento roda e a coluna de veredito é limpa. Quando ligado, a etapa pós-rastreamento pontua cada página HTML 200 interna contra os tetos abaixo.',
  ['When on (default), pagination_next + pagination_prev URLs are post-fetch enqueued. Off only to debug pagination-only loops without disabling all link follow.']:
    'Quando ligado (padrão), as URLs pagination_next + pagination_prev são enfileiradas após a busca. Desligue apenas para depurar loops exclusivos de paginação sem desativar todo o seguimento de links.',
  ['When ON (default), the Duplicate URL filter compares URLs after lowercasing the host, dropping the query string, and trimming the trailing slash — the canonical SEO behaviour. When OFF, comparison is byte-exact, so the filter only fires on rows that share an identical raw URL string (rare since URLs are deduped at insert time).']:
    'Quando LIGADO (padrão), o filtro URL duplicada compara as URLs após converter o host para minúsculas, remover a query string e cortar a barra final — o comportamento SEO canônico. Quando DESLIGADO, a comparação é byte a byte, então o filtro só dispara em linhas que compartilham uma string de URL bruta idêntica (raro, já que as URLs são desduplicadas na inserção).',
  ["When on, `<meta http-equiv='refresh'>` content URLs are enqueued like a redirect target. window.location body redirects are heuristic-only and currently out of scope."]:
    "Quando ligado, as URLs do content de `<meta http-equiv='refresh'>` são enfileiradas como destino de redirecionamento. Redirecionamentos window.location no corpo são apenas heurísticos e atualmente fora do escopo.",
  ['When on, a 200 page declaring a canonical pointing elsewhere also enqueues that target. Default off — most crawls treat canonicals as a signal, not a navigation hint.']:
    'Quando ligado, uma página 200 que declara um canonical apontando para outro lugar também enfileira esse destino. Desligado por padrão — a maioria dos rastreamentos trata canonicals como sinal, não como dica de navegação.',
  ['When on, pages with noindex / canonicalised / robots-blocked indexability are excluded from clustering — the Near-Duplicate report then surfaces only issues that affect search visibility.']:
    'Quando ligado, páginas com indexabilidade noindex / canonicalizada / bloqueada por robots são excluídas do agrupamento — o relatório Quase duplicatas passa a mostrar apenas problemas que afetam a visibilidade na busca.',
  ["When on, rel=nofollow links are recursed into like any other link. Default off — Screaming Frog 'Respect Nofollow' default."]:
    "Quando ligado, links rel=nofollow são percorridos como qualquer outro link. Desligado por padrão — comportamento padrão 'Respect Nofollow' do Screaming Frog.",
  ['When Playwright considers navigation complete. domcontentloaded = HTML parsed but resources still loading. load = window.load fired. networkidle = no network activity for 500ms (best for SPA but slower). commit = just response committed (fastest, riskiest).']:
    'Quando o Playwright considera a navegação concluída. domcontentloaded = HTML analisado, mas recursos ainda carregando. load = window.load disparado. networkidle = sem atividade de rede por 500 ms (melhor para SPA, porém mais lento). commit = apenas resposta confirmada (mais rápido, mais arriscado).',
  ['Whether the broken target is on the same site (internal) or a different host (external).']:
    'Se o destino quebrado está no mesmo site (interno) ou em outro host (externo).',
  ['Whether the URL is eligible to appear in search results. Combines status code, robots directives, canonical, and meta-refresh signals.']:
    'Se a URL pode aparecer nos resultados de busca. Combina código de status, diretivas robots, canonical e sinais de meta-refresh.',
  ['Width attribute value (in pixels) declared on the <img> tag, when present.']:
    'Valor do atributo width (em pixels) declarado na tag <img>, quando presente.',
  ['XPath 1.0 subset over the parsed DOM. End in `/@attr` or `/text()` to read an attribute / text node. Predicates: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.']:
    'Subconjunto de XPath 1.0 sobre o DOM analisado. Termine em `/@attr` ou `/text()` para ler um atributo / nó de texto. Predicados: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.',
  ['Y when the page declares hreflang alternates but no entry whose `href` matches the page URL. Google requires a self-reference.']:
    'Y quando a página declara alternativas hreflang, mas nenhuma entrada cujo `href` corresponda à URL da página. O Google exige uma autorreferência.',
  ['Y when the redirect chain originating at this URL contains a cycle (A → B → A) detected by the cycle-safe walker; the chain is otherwise unwalked.']:
    'Y quando a cadeia de redirecionamento que parte desta URL contém um ciclo (A → B → A) detectado pelo percurso à prova de ciclos; caso contrário a cadeia não é percorrida.',
  ['Y when this URL belongs to a paginated cluster whose ordinal sequence has a gap (e.g. ?page=1, 2, 4 — page 3 missing). Set by the post-crawl `recomputePaginationSequence` pass.']:
    'Y quando esta URL pertence a um grupo paginado cuja sequência ordinal tem uma lacuna (p. ex. ?page=1, 2, 4 — página 3 faltando). Definido pela etapa `recomputePaginationSequence` pós-rastreamento.',
  ['SQL injection — the request tries to smuggle SQL into a parameter (UNION SELECT, sleep(), error-based functions) to read or alter your database.']:
    'Injeção de SQL — a requisição tenta contrabandear SQL em um parâmetro (UNION SELECT, sleep(), funções baseadas em erro) para ler ou alterar seu banco de dados.',
  ['Cross-site scripting — the request carries script markup or a javascript: URL in a parameter, hoping the page echoes it back into the HTML unescaped.']:
    'Cross-site scripting — a requisição carrega marcação de script ou uma URL javascript: em um parâmetro, esperando que a página a devolva no HTML sem escape.',
  ['Path traversal — the request walks out of the web root with ../ or encoded variants to reach files like /etc/passwd or win.ini.']:
    'Path traversal — a requisição sai da raiz web com ../ ou variantes codificadas para alcançar arquivos como /etc/passwd ou win.ini.',
  ['Command injection — the request appends shell syntax (;, |, backticks, $( )) to a parameter to run commands on the server.']:
    'Injeção de comando — a requisição anexa sintaxe de shell (;, |, crases, $( )) a um parâmetro para executar comandos no servidor.',
  ['Scanner probe — an automated vulnerability scanner walking a wordlist of known admin panels, installers and exploit paths (wp-login, phpmyadmin, /actuator, shell uploads). Not tailored to your site; it hits everyone.']:
    'Sonda de scanner — um scanner de vulnerabilidades automatizado percorrendo uma lista de painéis administrativos, instaladores e caminhos de exploit conhecidos (wp-login, phpmyadmin, /actuator, uploads de shell). Não é feito sob medida para seu site; atinge todo mundo.',
  ['Sensitive file fetch — a direct request for something that must never be public: .env, .git, backups, SQL dumps, private keys, config files.']:
    'Busca de arquivo sensível — uma requisição direta por algo que nunca deve ser público: .env, .git, backups, dumps SQL, chaves privadas, arquivos de configuração.',
  ['Anomaly — malformed or evasive input (null bytes, CRLF injection, over-encoding, absurd parameter lengths) that matches no single attack class but is not a normal browser request.']:
    'Anomalia — entrada malformada ou evasiva (bytes nulos, injeção CRLF, sobrecodificação, comprimentos de parâmetro absurdos) que não corresponde a nenhuma classe de ataque específica, mas não é uma requisição normal de navegador.',
  ['Sum of the weights of every attack signature the request matched. Each signature carries a weight by how conclusive it is (a UNION SELECT weighs 9, a stray quote 2), and a line is only flagged once the total reaches 5 — so one decisive pattern flags on its own, while weak hints have to add up. Higher score = less room for a false positive; sort by it to triage.']:
    'Soma dos pesos de cada assinatura de ataque com a qual a requisição correspondeu. Cada assinatura carrega um peso conforme o quão conclusiva é (um UNION SELECT pesa 9, uma aspa solta 2), e uma linha só é sinalizada quando o total chega a 5 — assim um padrão decisivo sinaliza sozinho, enquanto pistas fracas precisam se somar. Pontuação maior = menos margem para falso positivo; ordene por ela para priorizar.',
  ['Which attack class the strongest matching signature belongs to: SQL injection, XSS, path traversal, command injection, scanner probe, sensitive file, or anomaly. Hover any badge in this column for what that class means in practice.']:
    'A qual classe de ataque a assinatura correspondente mais forte pertence: injeção de SQL, XSS, path traversal, injeção de comando, sonda de scanner, arquivo sensível ou anomalia. Passe o mouse sobre qualquer selo desta coluna para ver o que essa classe significa na prática.',
  ["Filters on the Status column — the most recent response the log recorded for that path. The analyzer keeps one status per URL rather than a full distribution, so this answers 'what is this URL returning now'. Paths whose status could not be parsed are hidden while a class is selected."]:
    "Filtra pela coluna Status — a resposta mais recente que o log registrou para esse caminho. O analisador mantém um status por URL em vez de uma distribuição completa, então isso responde 'o que esta URL está retornando agora'. Caminhos cujo status não pôde ser analisado ficam ocultos enquanto uma classe está selecionada.",
  ['Most recent HTTP status the log recorded for this path. One value per URL, not a distribution — a path that returned 200 all week and 404 this morning shows 404.']:
    'Status HTTP mais recente que o log registrou para este caminho. Um valor por URL, não uma distribuição — um caminho que retornou 200 a semana toda e 404 hoje de manhã mostra 404.',
  ['A URL whose path repeats the same segment this many times or more (/shop/shop/shop/…) is treated as a link loop and skipped. This shape comes from a relative-href bug and has no legitimate counterpart. Skipped counts are reported when the crawl finishes.']:
    'Uma URL cujo caminho repete o mesmo segmento este número de vezes ou mais (/shop/shop/shop/…) é tratada como loop de links e pulada. Esse formato vem de um bug de href relativo e não tem equivalente legítimo. As contagens puladas são informadas quando o rastreamento termina.',
  ['3 is safe for every site; raise to 4–5 only if a real path legitimately repeats a segment; 0 disables the guard.']:
    '3 é seguro para qualquer site; suba para 4–5 só se um caminho real repetir legitimamente um segmento; 0 desativa a proteção.',
  ['URLs with more query parameters than this are flagged as faceted-navigation traps under Issues → URL → Crawl Trap. Detection only — the URLs are still crawled, because legitimate filter pages look the same.']:
    'URLs com mais parâmetros de query do que este valor são marcadas como armadilhas de navegação facetada em Problemas → URL → Armadilha de rastreamento. Apenas detecção — as URLs ainda são rastreadas, porque páginas de filtro legítimas têm a mesma aparência.',
  ['4 surfaces most faceted-nav explosions; 0 disables the check.']:
    '4 revela a maioria das explosões de navegação facetada; 0 desativa a verificação.',
  ["Honor Allow / Disallow rules declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "Respeitar as regras Allow / Disallow declaradas em /robots.txt para o User-Agent configurado. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt).",
  ["Honor a Crawl-delay directive as a global rate limit (one request every N seconds). Crawl-delay is not part of RFC 9309 — Google ignores it and Screaming Frog does not implement it — and published values are often stale: 'Crawl-delay: 30' turns a 500-URL crawl into hours. Ignored by default; the directive is still reported in the log when found."]:
    "Respeitar uma diretiva Crawl-delay como limite global de taxa (uma requisição a cada N segundos). Crawl-delay não faz parte da RFC 9309 — o Google a ignora e o Screaming Frog não a implementa — e os valores publicados costumam estar obsoletos: 'Crawl-delay: 30' transforma um rastreamento de 500 URLs em horas. Ignorada por padrão; a diretiva ainda é informada no log quando encontrada.",
  ['Off (default) for normal audits. On when an ops policy requires it — expect the crawl to take Crawl-delay seconds per URL.']:
    'Desligado (padrão) para auditorias normais. Ligado quando uma política operacional exigir — espere que o rastreamento leve Crawl-delay segundos por URL.',
  ['Crawl fetches internal <img> targets (incl. srcset / <picture> sources) so each appears in the Internal tab with status, content type, and size — every one counts toward Max URLs. Store keeps the <img> declarations in the Images tab, which works even with Crawl off: you get the full image inventory with alt text for the cost of zero extra requests.']:
    'Rastrear busca os destinos <img> internos (incl. srcset / fontes de <picture>) para que cada um apareça na aba Interno com status, tipo de conteúdo e tamanho — todos contam para Máx. URLs. Armazenar mantém as declarações <img> na aba Imagens, que funciona mesmo com Rastrear desligado: você obtém o inventário completo de imagens com texto alt ao custo de zero requisições extras.',
  ['Store on, Crawl off is the cheap alt-text audit. Both on for a full image health check.']:
    'Armazenar ligado, Rastrear desligado é a auditoria barata de texto alt. Ambos ligados para uma verificação completa da saúde das imagens.',
  ['<video> / <audio> and the <source> children they own. Off by default — media files are large and rarely what an SEO crawl is looking for.']:
    '<video> / <audio> e os filhos <source> que possuem. Desligado por padrão — arquivos de mídia são grandes e raramente são o que um rastreamento SEO procura.',
  ['On when auditing a video-heavy site for dead media URLs.']:
    'Ligado ao auditar um site com muitos vídeos em busca de URLs de mídia mortas.',
  ["<link rel=stylesheet> targets. Crawling a stylesheet is also what discovers the web fonts and background images declared inside it via @font-face / url() — so Crawl on with Store off still populates the Internal tab's Font filter without listing every stylesheet."]:
    'Destinos de <link rel=stylesheet>. Rastrear uma folha de estilo também é o que descobre as web fonts e imagens de fundo declaradas dentro dela via @font-face / url() — então Rastrear ligado com Armazenar desligado ainda preenche o filtro Fontes da aba Interno sem listar cada folha de estilo.',
  ['Crawl on, Store off when you want fonts discovered but not hundreds of CSS rows.']:
    'Rastrear ligado, Armazenar desligado quando você quer descobrir fontes, mas não centenas de linhas CSS.',
  ['<script src> targets, fetched so each gets its own row with status code, content type, and size. Headers only — the body is discarded, never executed.']:
    'Destinos de <script src>, buscados para que cada um tenha sua própria linha com código de status, tipo de conteúdo e tamanho. Apenas cabeçalhos — o corpo é descartado, nunca executado.',
  ['Both on to catch 404ing bundles; both off for HTML-only crawls.']:
    'Ambos ligados para pegar bundles com 404; ambos desligados para rastreamentos somente HTML.',
  ['<a href> targets on the same site. Crawl off turns the run into an audit of a fixed set of pages — sitemaps, canonicals, and the other declared alternates below still feed discovery. Store off empties the link graph: inlinks, outlinks, anchor-text reports, and link score all go with it.']:
    'Destinos de <a href> no mesmo site. Rastrear desligado transforma a execução em uma auditoria de um conjunto fixo de páginas — sitemaps, canonicals e as outras alternativas declaradas abaixo ainda alimentam a descoberta. Armazenar desligado esvazia o grafo de links: links de entrada, de saída, relatórios de texto âncora e pontuação de links vão embora com ele.',
  ['Leave both on. Crawl off only when a sitemap or URL list already defines the exact set you want.']:
    'Deixe ambos ligados. Rastrear desligado só quando um sitemap ou lista de URLs já define o conjunto exato que você quer.',
  ['Outbound links to other hosts are always status-checked (one HEAD each) so Broken Links catches dead externals — that does not depend on this row. Crawl here means fully crawling those pages, following their links onward too. Store keeps outbound links in the link graph.']:
    'Links de saída para outros hosts sempre têm o status verificado (um HEAD cada) para que Links quebrados capture externos mortos — isso não depende desta linha. Rastrear aqui significa rastrear essas páginas por completo, seguindo também os links delas. Armazenar mantém os links de saída no grafo de links.',
  ['Crawl off (default) — status-check externals without spidering the whole web.']:
    'Rastrear desligado (padrão) — verificar o status dos externos sem rastrear a web inteira.',
  ['<link rel=canonical> and its HTTP Link: header form. Crawl also enqueues the canonical target, treating it as a navigation hint. Store feeds the Canonicals tab and every canonical issue filter.']:
    '<link rel=canonical> e sua forma de cabeçalho HTTP Link:. Rastrear também enfileira o destino canonical, tratando-o como dica de navegação. Armazenar alimenta a aba Canonicals e todos os filtros de problemas de canonical.',
  ['Crawl off (default) — canonicals are a signal, not a route. Store on.']:
    'Rastrear desligado (padrão) — canonicals são um sinal, não uma rota. Armazenar ligado.',
  ['<link rel=next> / <link rel=prev>. Part of the standard discovery graph; turn Crawl off to isolate a pagination loop without disabling link-following everywhere.']:
    '<link rel=next> / <link rel=prev>. Parte do grafo de descoberta padrão; desligue Rastrear para isolar um loop de paginação sem desativar o seguimento de links em todo lugar.',
  ['Both on unless you are debugging an infinite paginated series.']:
    'Ambos ligados, a menos que você esteja depurando uma série paginada infinita.',
  ['<link rel=alternate hreflang>. Crawl enqueues every declared alternate, which is how you reach language versions nothing links to. Store feeds the Hreflang tab and the reciprocity / invalid-code audits.']:
    '<link rel=alternate hreflang>. Rastrear enfileira cada alternativa declarada, que é como você alcança versões de idioma para as quais nada aponta. Armazenar alimenta a aba Hreflang e as auditorias de reciprocidade / código inválido.',
  ['Crawl on for a multi-language audit — otherwise unlinked locales stay invisible.']:
    'Rastrear ligado para uma auditoria multilíngue — caso contrário, localidades não linkadas ficam invisíveis.',
  ['<link rel=amphtml>. Crawl fetches the AMP variant as its own URL; Store keeps the declaration plus the AMP smoke-validator findings.']:
    '<link rel=amphtml>. Rastrear busca a variante AMP como sua própria URL; Armazenar mantém a declaração mais os achados do validador básico de AMP.',
  ['Crawl on only if the site still ships AMP pages.']:
    'Rastrear ligado apenas se o site ainda publica páginas AMP.',
  ['<meta http-equiv="refresh">. Crawl enqueues the parsed target like a redirect; Store keeps the raw directive and its URL for the Meta Refresh tab.']:
    '<meta http-equiv="refresh">. Rastrear enfileira o destino analisado como um redirecionamento; Armazenar mantém a diretiva bruta e sua URL para a aba Meta Refresh.',
  ['Crawl on when auditing a legacy site that still redirects this way.']:
    'Rastrear ligado ao auditar um site legado que ainda redireciona desta forma.',
  ["<iframe src> documents. Crawl fetches each embedded page as its own URL, which can pull in a lot of third-party surface. Store records them in the link graph so a dead embed shows up in Outlinks and Broken Links — without counting toward the page's outlink total, since an embed is not a hyperlink."]:
    'Documentos <iframe src>. Rastrear busca cada página incorporada como sua própria URL, o que pode puxar muita superfície de terceiros. Armazenar os registra no grafo de links para que um embed morto apareça em Links de saída e Links quebrados — sem contar no total de links de saída da página, já que um embed não é um hiperlink.',
  ['Store on, Crawl off is usually the right pair.']:
    'Armazenar ligado, Rastrear desligado costuma ser a combinação certa.',
  ['The separate-URL (m-dot) mobile version: <link rel="alternate" media="only screen and (max-width: …)">. Null on responsive sites, which is most of them — a value here with no reciprocal canonical back is the classic broken m-dot setup.']:
    'A versão mobile com URL separada (m-dot): <link rel="alternate" media="only screen and (max-width: …)">. Nulo em sites responsivos, que são a maioria — um valor aqui sem canonical recíproco de volta é a clássica configuração m-dot quebrada.',
  ['Crawl on only when the site really does serve a separate mobile host.']:
    'Rastrear ligado apenas quando o site realmente serve um host mobile separado.',
  ['Links a search engine cannot follow: <a> with no href but an onclick, href="javascript:…", and href="#" placeholders wired to a handler. Store-only — an uncrawlable link is by definition never fetched. Drives the JS-Only Navigation issue filter.']:
    'Links que um mecanismo de busca não consegue seguir: <a> sem href mas com onclick, href="javascript:…" e placeholders href="#" ligados a um handler. Apenas Armazenar — um link não rastreável por definição nunca é buscado. Alimenta o filtro de problemas Navegação somente JS.',
  ['On — it is a count, so it costs nothing.']: 'Ligado — é uma contagem, então não custa nada.',
  ['With a Subfolder-scoped crawl, links pointing outside the start folder are fetched once so their status code is known, then stopped — they are checked, not crawled through. Off leaves them undiscovered entirely.']:
    'Com um rastreamento de escopo Subpasta, links que apontam para fora da pasta inicial são buscados uma vez para conhecer o código de status e depois interrompidos — são verificados, não rastreados a fundo. Desligado os deixa totalmente sem descoberta.',
  ['On — knowing a link out of /blog/ is a 404 costs one request.']:
    'Ligado — saber que um link para fora de /blog/ é 404 custa uma requisição.',
  ["Off restricts the crawl to URLs under the start URL's path (Crawl Scope = Subfolder). On lets it cover the whole host. This is a view of the Crawl Scope setting, not a separate switch, so the two can never disagree."]:
    'Desligado restringe o rastreamento às URLs sob o caminho da URL inicial (Escopo do rastreamento = Subpasta). Ligado permite cobrir o host inteiro. É uma visão da configuração Escopo do rastreamento, não um interruptor separado, então os dois nunca podem discordar.',
  ['Off to audit just /blog/; on for the whole site.']:
    'Desligado para auditar só /blog/; ligado para o site inteiro.',
  ['Treats every host sharing the registrable domain as internal — shop.example.com and blog.example.com crawl alongside example.com instead of counting as external. Another view of the Crawl Scope setting.']:
    'Trata todo host que compartilha o domínio registrável como interno — shop.example.com e blog.example.com são rastreados junto com example.com em vez de contar como externos. Outra visão da configuração Escopo do rastreamento.',
  ['On when subdomains are part of the same property.']:
    'Ligado quando os subdomínios fazem parte da mesma propriedade.',
  ['Crawl through rel="nofollow" links pointing at the same site. Off (default) is Screaming Frog "Respect Nofollow" behaviour. Internal and external are separate switches because sites nofollow them for opposite reasons — crawl-budget shaping vs. not vouching for a third party.']:
    'Rastrear através de links rel="nofollow" que apontam para o mesmo site. Desligado (padrão) é o comportamento "Respect Nofollow" do Screaming Frog. Interno e externo são interruptores separados porque os sites os usam por motivos opostos — moldar o orçamento de rastreamento vs. não avalizar um terceiro.',
  ['On when a site nofollows its own faceted navigation and you need behind it.']:
    'Ligado quando um site coloca nofollow na própria navegação facetada e você precisa passar por ela.',
  ['Crawl through rel="nofollow" links pointing at other hosts. Only has an effect while External Links → Crawl is on.']:
    'Rastrear através de links rel="nofollow" que apontam para outros hosts. Só tem efeito enquanto Links externos → Rastrear estiver ligado.',
  ['Off — nofollowed externals are exactly the ones you did not vouch for.']:
    'Desligado — externos com nofollow são exatamente aqueles que você não avalizou.',
  ['Record hrefs that cannot be parsed as a URL — unencoded whitespace inside the authority, doubled schemes, stray delimiters. They can never resolve to a crawled page, so every one is reported in Broken Links, which is the point. Deliberate non-navigable schemes (mailto:, tel:, #) are not malformed and never appear.']:
    'Registrar hrefs que não podem ser analisados como URL — espaços não codificados dentro da autoridade, esquemas duplicados, delimitadores soltos. Nunca podem resolver para uma página rastreada, então cada um é informado em Links quebrados, que é o objetivo. Esquemas não navegáveis deliberados (mailto:, tel:, #) não são malformados e nunca aparecem.',
  ['On when hunting hand-written markup errors; off keeps Broken Links focused on real 404s.']:
    'Ligado ao caçar erros de marcação escrita à mão; desligado mantém Links quebrados focado em 404s reais.',
  ['Off drops every discovered URL carrying a `?`, before robots and before a request goes out. That is the cheap way to stop a faceted navigation (?color=red&size=xl&sort=price) from spending the whole URL budget on one product listing wearing a thousand URLs. The start URL is always crawled, and subresources are exempt — style.css?v=7 is a cache-buster, not a facet. Skipped URLs are counted and reported in the log, never dropped silently.']:
    'Desligado descarta toda URL descoberta que carrega `?`, antes do robots e antes de qualquer requisição sair. É a forma barata de impedir que uma navegação facetada (?color=red&size=xl&sort=price) gaste todo o orçamento de URLs em uma única listagem de produtos disfarçada de mil URLs. A URL inicial é sempre rastreada, e subrecursos estão isentos — style.css?v=7 é um cache-buster, não uma faceta. URLs puladas são contadas e informadas no log, nunca descartadas em silêncio.',
  ['On (default). Off for a first pass over a shop with faceted filters.']:
    'Ligado (padrão). Desligado para uma primeira passada em uma loja com filtros facetados.',
  ['Parameter names that keep a URL in the crawl anyway — pagination, a language switch, a product id. Names only; values are not looked at, and matching ignores case. A URL is admitted only when every parameter it carries is on this list: ?page=2 passes, ?page=2&color=red does not. Any-match would defeat the point, since a facet URL nearly always carries the pagination parameter too.']:
    'Nomes de parâmetros que mantêm uma URL no rastreamento mesmo assim — paginação, troca de idioma, id de produto. Apenas nomes; os valores não são examinados, e a correspondência ignora maiúsculas. Uma URL é admitida apenas quando todo parâmetro que ela carrega está nesta lista: ?page=2 passa, ?page=2&color=red não. Correspondência parcial anularia o propósito, já que uma URL de faceta quase sempre carrega também o parâmetro de paginação.',
  ['page, lang — keeps paginated archives reachable while the facets stay out.']:
    'page, lang — mantém os arquivos paginados alcançáveis enquanto as facetas ficam de fora.',
  ['Auto-discovery on its own only records sitemap entries, which is what the sitemap issue filters compare the crawl against. Turning this on crawls them too — and that is what surfaces orphans: pages the sitemap declares but nothing on the site links to.']:
    'A descoberta automática sozinha apenas registra as entradas do sitemap, que é contra o que os filtros de problemas de sitemap comparam o rastreamento. Ligar isto também as rastreia — e é isso que revela as órfãs: páginas que o sitemap declara, mas para as quais nada no site aponta.',
  ['On for an orphan-page audit.']: 'Ligado para uma auditoria de páginas órfãs.',
  ['Reads Sitemap: directives from /robots.txt plus the conventional /sitemap.xml fallbacks at crawl start. Cheap I/O, and it powers every sitemap issue filter.']:
    'Lê as diretivas Sitemap: de /robots.txt mais as alternativas convencionais /sitemap.xml no início do rastreamento. E/S barata, e alimenta todos os filtros de problemas de sitemap.',
  ['On (default).']: 'Ligado (padrão).',
  ['Explicit sitemap URLs, one per line. Their entries are always both recorded and queued as crawl seeds — use this when the sitemap lives somewhere robots.txt never mentions.']:
    'URLs de sitemap explícitas, uma por linha. Suas entradas são sempre registradas e enfileiradas como sementes de rastreamento — use isto quando o sitemap fica em algum lugar que o robots.txt nunca menciona.',
  ['Treat the concurrency and RPS above as a ceiling and let the target server set the real pace. On a 429/503 (or a Retry-After header) the crawler pauses for the penalty window and steps the rate + concurrency down; after a sustained run of clean responses it grows them back toward the ceiling. Off = hold the configured rate no matter how the server responds.']:
    'Trata a concorrência e o RPS acima como um teto e deixa o servidor de destino definir o ritmo real. Em um 429/503 (ou cabeçalho Retry-After) o rastreador pausa pela janela de penalidade e reduz a taxa + concorrência; após uma sequência sustentada de respostas limpas, sobe de volta em direção ao teto. Desligado = manter a taxa configurada independentemente de como o servidor responde.',
  ['Turn on for sites behind Cloudflare / a WAF that returns 429s; leave off for your own infrastructure where the fixed rate is safe.']:
    'Ligue para sites atrás do Cloudflare / de um WAF que retorna 429; deixe desligado para sua própria infraestrutura onde a taxa fixa é segura.',
  ['Sorts query parameters alphabetically at normalisation time. Repeated keys keep their relative order, so ?tag=a&tag=b is preserved. Without this the two orderings occupy separate rows and read as duplicates.']:
    'Ordena os parâmetros de query alfabeticamente na normalização. Chaves repetidas mantêm a ordem relativa, então ?tag=a&tag=b é preservado. Sem isso, as duas ordenações ocupam linhas separadas e são lidas como duplicatas.',
  ['On for most sites; off if your server routes on positional parameter order.']:
    'Ligado para a maioria dos sites; desligado se seu servidor roteia pela ordem posicional dos parâmetros.',
  ['Collapses runs of slashes in the path to a single slash. Applied before the trailing-slash policy. Web servers serve these identically, so the duplicate-slash variant is normally a false duplicate.']:
    'Recolhe sequências de barras no caminho para uma única barra. Aplicado antes da política de barra final. Servidores web as servem de forma idêntica, então a variante com barra dupla normalmente é uma falsa duplicata.',
  ['On if a template bug emits //  in links; off if your framework uses empty path segments as data.']:
    'Ligado se um bug de template emite //  nos links; desligado se seu framework usa segmentos de caminho vazios como dados.',
  ["Off by default: verify the login page's TLS certificate before typing credentials into it. Enable only for a trusted internal host with a self-signed certificate — an unverifiable certificate on a login page is a man-in-the-middle risk."]:
    'Desligado por padrão: verificar o certificado TLS da página de login antes de digitar credenciais nela. Ative apenas para um host interno confiável com certificado autoassinado — um certificado não verificável em uma página de login é um risco de man-in-the-middle.',
  ["Hooks the History API before the page's own scripts run, so routes an SPA reaches via pushState / replaceState / popstate are discovered and crawled. Also keeps hash routes (#/about) as distinct URLs instead of collapsing them onto the shell document."]:
    'Intercepta a History API antes de os próprios scripts da página rodarem, de modo que rotas que uma SPA alcança via pushState / replaceState / popstate são descobertas e rastreadas. Também mantém rotas hash (#/about) como URLs distintas em vez de recolhê-las no documento shell.',
  ['On for React Router / Vue Router / Angular sites whose pages never produce a document request.']:
    'Ligado para sites com React Router / Vue Router / Angular cujas páginas nunca produzem uma requisição de documento.',
  ['`<link rel="alternate" media="only screen and (max-width: …)" href="…">` value — the separate-URL (m-dot) mobile version of this page. Empty on responsive sites, which is most of them. A value here with no reciprocal canonical pointing back is the classic broken m-dot setup.']:
    'Valor de `<link rel="alternate" media="only screen and (max-width: …)" href="…">` — a versão mobile com URL separada (m-dot) desta página. Vazio em sites responsivos, que são a maioria. Um valor aqui sem canonical recíproco apontando de volta é a clássica configuração m-dot quebrada.',
};
