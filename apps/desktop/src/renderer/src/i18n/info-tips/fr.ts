/**
 * French InfoTip ([i] tooltip) bodies, keyed by the verbatim English
 * source string. See `../info-tips.ts` for the rationale.
 */

export const FR_INFO_TIPS: Record<string, string> = {
  ["?page=1 / ?page=2 / ?page=4 → flags 'Sequence Break' on every member of the broken cluster."]:
    '?page=1 / ?page=2 / ?page=4 → signale « Rupture de séquence » sur chaque membre du groupe cassé.',
  ['`<a>` elements that look clickable but aren\'t crawlable (no href + onclick, `href="javascript:…"`, or `href="#"` with onclick).']:
    'Éléments `<a>` qui semblent cliquables mais ne sont pas explorables (pas de href + onclick, `href="javascript:…"`, ou `href="#"` avec onclick).',
  ['`<link rel="amphtml" href="…">` value — the AMP version of this page. Empty when the page does not declare an AMP alternate.']:
    'Valeur de `<link rel="amphtml" href="…">` — la version AMP de cette page. Vide lorsque la page ne déclare pas d\'alternative AMP.',
  ['`<link rel="next" href="…">` value resolved to absolute. Empty when the page is not paginated forward.']:
    'Valeur de `<link rel="next" href="…">` résolue en absolu. Vide lorsque la page n\'est pas paginée vers l\'avant.',
  ['`<link rel="prev" href="…">` value resolved to absolute. Empty when the page is the first in its pagination cluster.']:
    'Valeur de `<link rel="prev" href="…">` résolue en absolu. Vide lorsque la page est la première de son groupe de pagination.',
  ['`css` runs against the parsed DOM; `regex` runs against raw HTML.']:
    "`css` s'exécute sur le DOM analysé ; `regex` s'exécute sur le HTML brut.",
  ['`none` disables auth; `basic` adds `Authorization: Basic <base64>`; `bearer` adds `Authorization: Bearer <token>`; `digest` performs the RFC 2617 challenge-response on the first 401.']:
    "`none` désactive l'authentification ; `basic` ajoute `Authorization: Basic <base64>` ; `bearer` ajoute `Authorization: Bearer <token>` ; `digest` effectue le challenge-response RFC 2617 au premier 401.",
  ['`POST <url>` is fired when the `done` event emits. 10 s timeout. Failures are logged as info events but never break the crawl.']:
    "`POST <url>` est envoyé lorsque l'événement `done` est émis. Délai d'attente de 10 s. Les échecs sont journalisés comme événements d'information mais n'interrompent jamais l'exploration.",
  ['0 (no duplicates), 7 (member of cluster #7)']: '0 (aucun doublon), 7 (membre du groupe n° 7)',
  ['0 = auto. 4 for 8GB RAM machines, 8+ for 16GB+.']:
    '0 = auto. 4 pour les machines avec 8 Go de RAM, 8+ pour 16 Go et plus.',
  ["0 default; 250 ms when a host returns 429 with a 'too fast' message."]:
    "0 par défaut ; 250 ms lorsqu'un hôte renvoie 429 avec un message « trop rapide ».",
  ['0 for SSR sites, 2000 for typical SPAs, 5000+ for heavy client-rendered apps.']:
    '0 pour les sites SSR, 2000 pour les SPA classiques, 5000+ pour les applications lourdes rendues côté client.',
  ["0.1 default (Google 'good'); 0 to disable."]:
    '0.1 par défaut (« bon » selon Google) ; 0 pour désactiver.',
  ['1 = unique, 5 = part of a 5-page near-duplicate group']:
    "1 = unique, 5 = fait partie d'un groupe de 5 pages quasi dupliquées",
  ['10 (default), 3 for very tight chains, 0 to remove the cap']:
    '10 (par défaut), 3 pour des chaînes très strictes, 0 pour supprimer la limite',
  ['10 covers most sites; 3 limits crawls to top-of-funnel pages only.']:
    "10 couvre la plupart des sites ; 3 limite l'exploration aux seules pages du haut de l'entonnoir.",
  ['100 default for most audits; 0 to disable the check.']:
    '100 par défaut pour la plupart des audits ; 0 pour désactiver la vérification.',
  ['100 default; 50 for tight on-page link discipline; 0 to disable the issue.']:
    '100 par défaut ; 50 pour une discipline stricte des liens en page ; 0 pour désactiver le problème.',
  ['1000000 (1M) for a full site audit; 5000 for spot checks.']:
    '1000000 (1M) pour un audit complet du site ; 5000 pour des vérifications ponctuelles.',
  ['1024 (1 MB) default; 150 for a lean HTML budget; 0 to disable.']:
    '1024 (1 Mo) par défaut ; 150 pour un budget HTML serré ; 0 pour désactiver.',
  ['1048576 (1 MB) default; 524288 (512 KB) on tight disks; 0 to disable truncation entirely.']:
    '1048576 (1 Mo) par défaut ; 524288 (512 Ko) sur des disques contraints ; 0 pour désactiver totalement la troncature.',
  ['10485760 (10 MB) on bandwidth-tight crawls; 0 to download anything.']:
    '10485760 (10 Mo) pour les explorations à bande passante limitée ; 0 pour tout télécharger.',
  ['1366 = standard laptop, 1920 = full HD desktop, 375 = iPhone width.']:
    "1366 = ordinateur portable standard, 1920 = bureau Full HD, 375 = largeur d'iPhone.",
  ['2 default; 0 to record errors immediately without retrying; 5 for unreliable upstreams.']:
    '2 par défaut ; 0 pour enregistrer les erreurs immédiatement sans réessayer ; 5 pour des serveurs amont peu fiables.',
  ['20 default; 50 on fast first-party servers; 5 if the site rate-limits or returns 429s.']:
    '20 par défaut ; 50 sur des serveurs propres rapides ; 5 si le site limite le débit ou renvoie des 429.',
  ['20 for typical sites; 5 to be polite on shared hosting; 60+ when crawling your own infra.']:
    '20 pour les sites classiques ; 5 pour rester courtois sur un hébergement mutualisé ; 60+ pour explorer votre propre infrastructure.',
  ['20000 (20 s) for typical use; 5000 for fast spot checks; 60000 for slow APIs.']:
    '20000 (20 s) pour un usage courant ; 5000 pour des vérifications rapides ; 60000 pour des API lentes.',
  ['2048 (≈2 GB) on a 4 GB laptop; 8192 on a 16 GB workstation; 0 to disable.']:
    '2048 (≈2 Go) sur un portable de 4 Go ; 8192 sur une station de travail de 16 Go ; 0 pour désactiver.',
  ['2048 default (RFC-suggested practical ceiling).']:
    '2048 par défaut (plafond pratique suggéré par la RFC).',
  ["2500 default (Google 'good'); 0 to disable."]:
    '2500 par défaut (« bon » selon Google) ; 0 pour désactiver.',
  ['3 = recommended; 5 catches looser duplicates (templated content with light variation); 0 turns the post-crawl pass off.']:
    '3 = recommandé ; 5 attrape des doublons plus lâches (contenu de gabarit avec de légères variations) ; 0 désactive la passe post-exploration.',
  ['4 default; 6 on documentation sites with deep TOC trees; 0 to disable.']:
    '4 par défaut ; 6 sur les sites de documentation à arborescence profonde ; 0 pour désactiver.',
  ['500 default. Bump to 2000 when retrying against a flaky API.']:
    '500 par défaut. Montez à 2000 lors de nouvelles tentatives contre une API instable.',
  ['50000 keeps RAM bounded during big sitemap fan-outs; 0 for typical crawls.']:
    '50000 garde la RAM bornée pendant les grandes expansions de sitemaps ; 0 pour les explorations classiques.',
  ['60000 (1 minute) for huge resources; 0 to rely solely on the fetch timeout.']:
    '60000 (1 minute) pour des ressources énormes ; 0 pour ne dépendre que du délai de récupération.',
  ['64-bit SimHash + LSH bucketing + Union-Find clustering on body shingles. Most expensive pass — typical 5–10 s on a 100k crawl.']:
    'SimHash 64 bits + regroupement LSH + clustering Union-Find sur les shingles du corps. La passe la plus coûteuse — typiquement 5–10 s sur une exploration de 100k.',
  ['768 = standard laptop, 1080 = full HD desktop, 667 = iPhone 8 height.']:
    "768 = ordinateur portable standard, 1080 = bureau Full HD, 667 = hauteur d'iPhone 8.",
  ['800 default; 200 for CDN-backed static; 0 to disable.']:
    '800 par défaut ; 200 pour du statique servi par CDN ; 0 pour désactiver.',
  ['Aborts @font-face / Google Fonts / WOFF2 requests. FOUT visible but text still renders.']:
    "Abandonne les requêtes @font-face / Google Fonts / WOFF2. FOUT visible mais le texte s'affiche quand même.",
  ['Aborts <img>, <picture>, background-image requests. Recommended for SEO crawls — image metadata still comes from <img> tag attributes.']:
    "Abandonne les requêtes <img>, <picture> et background-image. Recommandé pour les explorations SEO — les métadonnées d'image proviennent toujours des attributs de la balise <img>.",
  ['Aborts <video> / <audio> sources. Page DOM still includes the <video> tag.']:
    'Abandonne les sources <video> / <audio>. Le DOM de la page contient toujours la balise <video>.',
  ['Aborts all <script> requests. This defeats the purpose of JS rendering — use Text Only mode instead.']:
    "Abandonne toutes les requêtes <script>. Cela va à l'encontre du rendu JS — utilisez plutôt le mode Texte seul.",
  ['Aborts external CSS. Inline styles still load. WARNING: many SPAs use CSS-driven visibility / lazy classes — blocking CSS may hide content that JS depends on.']:
    'Abandonne le CSS externe. Les styles en ligne se chargent toujours. ATTENTION : beaucoup de SPA utilisent une visibilité / des classes lazy pilotées par CSS — bloquer le CSS peut masquer du contenu dont dépend le JS.',
  ['Aborts requests whose total lifetime (connect + headers + body) exceeds this. Distinct from `requestTimeoutMs` which is the headers timeout. Useful for capping individual slow pages without lowering the overall fetch timeout.']:
    'Abandonne les requêtes dont la durée totale (connexion + en-têtes + corps) dépasse cette valeur. Distinct de `requestTimeoutMs`, qui est le délai des en-têtes. Utile pour plafonner des pages lentes individuelles sans baisser le délai global de récupération.',
  ['Absolute redirect target parsed from the meta-refresh content. Empty when meta-refresh sets only a delay.']:
    "Cible de redirection absolue extraite du content du meta-refresh. Vide lorsque le meta-refresh ne définit qu'un délai.",
  ['Literal target of a JavaScript redirect found in an inline script (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Followed when "Follow JavaScript redirects" is on.']:
    'Cible littérale d\'une redirection JavaScript trouvée dans un script inline (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Suivie lorsque « Suivre les redirections JavaScript » est activé.',
  ['Additional time to wait after the chosen wait condition fires, for SPA hydration / late XHRs. 0 = no extra wait. Bounded by the request timeout.']:
    "Temps d'attente supplémentaire après le déclenchement de la condition choisie, pour l'hydratation de la SPA / les XHR tardifs. 0 = pas d'attente supplémentaire. Borné par le délai de la requête.",
  ['Anchor text of the broken link as rendered in the source page.']:
    "Texte d'ancre du lien cassé tel qu'il est rendu dans la page source.",
  ['Audits the rendered DOM for WCAG AA colour-contrast failures (4.5:1 normal text, 3:1 large text) and stylesheet rules that suppress the keyboard focus outline without a :focus-visible fallback. Surfaces the Low-Contrast Text and Focus Outline Suppressed issue filters.']:
    "Audite le DOM rendu à la recherche d'échecs de contraste de couleur WCAG AA (4.5:1 texte normal, 3:1 texte large) et de règles de feuille de style qui suppriment le contour de focus clavier sans repli :focus-visible. Alimente les filtres de problèmes Texte à faible contraste et Contour de focus supprimé.",
  ['basic/digest for /staging behind nginx; bearer for protected APIs']:
    'basic/digest pour /staging derrière nginx ; bearer pour les API protégées',
  ['Below Normal while you keep working in other apps; Idle for overnight unattended runs.']:
    "Inférieure à la normale pendant que vous travaillez dans d'autres applications ; Inactive pour les exécutions nocturnes sans surveillance.",
  ['BFS click depth from the start URL. Start URL = 0; its outlinks = 1; etc. High depth often correlates with low importance.']:
    "Profondeur de clics BFS depuis l'URL de départ. URL de départ = 0 ; ses liens sortants = 1 ; etc. Une grande profondeur est souvent corrélée à une faible importance.",
  ['Bodies over this are truncated and flagged. 1 MB covers the 99.9th percentile of HTML pages without letting one adversarial 50 MB page bloat the project file.']:
    'Les corps dépassant cette taille sont tronqués et signalés. 1 Mo couvre le 99,9e centile des pages HTML sans laisser une page hostile de 50 Mo gonfler le fichier projet.',
  ['Buy Affordable Game Keys | Example Store']:
    'Achetez des clés de jeux abordables | Boutique exemple',
  ['Character count of the first H1.']: 'Nombre de caractères du premier H1.',
  ['Character count of the meta description. Recommended: 70–155 characters; over 155 risks truncation.']:
    'Nombre de caractères de la meta description. Recommandé : 70–155 caractères ; au-delà de 155, risque de troncature.',
  ['Character count of the title. Recommended: 30–60 characters; over 60 risks truncation in SERPs.']:
    'Nombre de caractères du titre. Recommandé : 30–60 caractères ; au-delà de 60, risque de troncature dans les SERP.',
  ['Charikar 64-bit SimHash of body shingles. Used by the post-crawl near-duplicate clustering pass. Two SimHashes within the configured Hamming threshold are considered similar.']:
    'SimHash Charikar 64 bits des shingles du corps. Utilisé par la passe post-exploration de regroupement des quasi-doublons. Deux SimHash à moins du seuil de Hamming configuré sont considérés comme similaires.',
  ['Coarse content classification derived from URL extension and Content-Type header.']:
    "Classification grossière du contenu dérivée de l'extension de l'URL et de l'en-tête Content-Type.",
  ['Comma-joined sorted unique JSON-LD `@type` values declared on the page (Article, BreadcrumbList, Product, …).']:
    'Valeurs `@type` JSON-LD uniques, triées et jointes par des virgules, déclarées sur la page (Article, BreadcrumbList, Product, …).',
  ['Contents of the first <meta name="description"> tag. May be used as the SERP snippet.']:
    'Contenu de la première balise <meta name="description">. Peut servir d\'extrait dans les SERP.',
  ['Contents of the first <meta name="robots"> tag. Controls per-page indexing/following behaviour.']:
    'Contenu de la première balise <meta name="robots">. Contrôle le comportement d\'indexation/suivi par page.',
  ['Contents of the first <title> element. Google primarily uses this in SERP titles.']:
    "Contenu du premier élément <title>. Google l'utilise principalement pour les titres dans les SERP.",
  ['Counts how many internal pages link to each URL. Drives the Most-Linked URLs report and the per-row Inlinks column.']:
    'Compte combien de pages internes pointent vers chaque URL. Alimente le rapport des URL les plus liées et la colonne Liens entrants de chaque ligne.',
  ["Crawl 3xx redirect targets. Each hop is its own row; the chain is reconstructed in the Response Codes view. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced)."]:
    "Explorer les cibles des redirections 3xx. Chaque saut a sa propre ligne ; la chaîne est reconstituée dans la vue Codes de réponse. Screaming Frog : 'Always Follow Redirects' (Configuration → Spider → Advanced).",
  ['Crawler RSS auto-pauses the queue when this is exceeded; resumes once memory drops to 80% of the cap. Soft cap — does not enforce a hard heap limit.']:
    "Le RSS de l'explorateur met automatiquement la file en pause lorsque cette valeur est dépassée ; reprend une fois la mémoire retombée à 80 % du plafond. Plafond souple — n'impose pas de limite stricte du tas.",
  ['css for selectors, regex for free-form patterns']:
    'css pour les sélecteurs, regex pour les motifs libres',
  ["CSS selector that pins the duplicate-fingerprint text extraction to a specific page region. When set, the heuristic (main / role=main / article / body-minus-chrome) is bypassed and the selector wins. Useful on sites where the heuristic misclassifies — e.g. CMSes that wrap navigation inside `<main>` or sites with no semantic landmarks at all. Empty = use the heuristic. Invalid selectors silently fall back to the heuristic so a typo doesn't break the crawl."]:
    "Sélecteur CSS qui restreint l'extraction du texte servant à l'empreinte de doublon à une région précise de la page. Lorsqu'il est défini, l'heuristique (main / role=main / article / body-moins-chrome) est contournée et le sélecteur l'emporte. Utile sur les sites où l'heuristique se trompe — p. ex. des CMS qui enveloppent la navigation dans `<main>` ou des sites sans aucun repère sémantique. Vide = utiliser l'heuristique. Les sélecteurs invalides retombent silencieusement sur l'heuristique pour qu'une faute de frappe ne casse pas l'exploration.",
  ["Cumulative Layout Shift from PageSpeed Insights, when present. Google's 'good' CLS threshold is 0.1. Unitless; accepts decimals. Pages without PSI data are never flagged."]:
    "Cumulative Layout Shift issu de PageSpeed Insights, lorsqu'il est présent. Le seuil « bon » de CLS selon Google est 0.1. Sans unité ; accepte les décimales. Les pages sans données PSI ne sont jamais signalées.",
  ['Drives the View Source detail tab. ~30–200 KB on disk per HTML page; turn off if you only need metadata and not full source viewing.']:
    "Alimente l'onglet de détail Voir la source. ~30–200 Ko sur disque par page HTML ; désactivez si vous n'avez besoin que des métadonnées et non de l'affichage complet de la source.",
  ["Each rule runs JavaScript RegExp.replace on the fully-normalised URL. Flags default to 'g'. After all rules run, the result is re-parsed as a URL — if the rewrite produces an invalid URL, the link is dropped at normalisation time."]:
    "Chaque règle exécute RegExp.replace de JavaScript sur l'URL entièrement normalisée. Les flags par défaut sont 'g'. Une fois toutes les règles exécutées, le résultat est réanalysé comme URL — si la réécriture produit une URL invalide, le lien est abandonné à la normalisation.",
  ["Empty = safest. 'chrome' if you want the same Chrome version your users see."]:
    "Vide = le plus sûr. 'chrome' si vous voulez la même version de Chrome que celle de vos utilisateurs.",
  ["Empty = use the bundled Playwright Chromium build (recommended — pinned version, works everywhere). 'chrome' / 'msedge' uses the system-installed browser. Beta channels for testing newer features."]:
    "Vide = utiliser la build Chromium fournie avec Playwright (recommandé — version figée, fonctionne partout). 'chrome' / 'msedge' utilise le navigateur installé sur le système. Canaux bêta pour tester des fonctionnalités plus récentes.",
  ["Fetch internal <img> resources (incl. srcset / <picture> sources) so they appear in the Internal tab with their own status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl)."]:
    "Récupérer les ressources <img> internes (y compris srcset / sources <picture>) pour qu'elles apparaissent dans l'onglet Interne avec leur propre code d'état, type de contenu et taille. Chacune compte dans Max URL. Screaming Frog : 'Check Images' (Configuration → Spider → Crawl).",
  ["Fetch internal <link rel=stylesheet> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl)."]:
    "Récupérer les ressources <link rel=stylesheet> internes pour qu'elles apparaissent dans l'onglet Interne avec code d'état, type de contenu et taille. Chacune compte dans Max URL. Screaming Frog : 'Check CSS' (Configuration → Spider → Crawl).",
  ["Fetch internal <script src> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl)."]:
    "Récupérer les ressources <script src> internes pour qu'elles apparaissent dans l'onglet Interne avec code d'état, type de contenu et taille. Chacune compte dans Max URL. Screaming Frog : 'Check JavaScript' (Configuration → Spider → Crawl).",
  ["Fetches /robots.txt sitemap directives + /sitemap.xml fallbacks. Powers the 'Non-Indexable in Sitemap' issue filter. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl)."]:
    "Récupère les directives sitemap de /robots.txt + les replis /sitemap.xml. Alimente le filtre de problèmes « Non indexable dans le sitemap ». Screaming Frog : 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl).",
  ["first/last for single value, all for JSON array, concat for ' | ' joined string"]:
    "first/last pour une valeur unique, all pour un tableau JSON, concat pour une chaîne jointe par ' | '",
  ['FNV-1a 64-bit hash of the normalised body token stream. Two pages sharing this hash are byte-identical post-tokenisation — the basis of the Exact Duplicate filter.']:
    'Hachage FNV-1a 64 bits du flux de jetons normalisé du corps. Deux pages partageant ce hachage sont identiques octet pour octet après tokenisation — la base du filtre Doublon exact.',
  ['For Basic, sent base64-encoded; for Digest, hashed into the challenge response.']:
    'Pour Basic, envoyé encodé en base64 ; pour Digest, intégré au hachage de la réponse au challenge.',
  ['For regex: `regex_group` extracts capture group 1; otherwise the whole match is used.']:
    'Pour regex : `regex_group` extrait le groupe de capture 1 ; sinon la correspondance entière est utilisée.',
  ['Full-page renders the entire scrollable canvas; Above-the-fold captures just the initial viewport (cheaper). Both writes two PNGs per URL.']:
    'Page entière rend tout le canevas défilable ; Above-the-fold ne capture que la fenêtre initiale (moins coûteux). Les deux écrivent deux PNG par URL.',
  ['Google\'s index status, pulled from the URL Inspection API — not the Fetch button. Click "Inspect (top 100)" to fill this column; Fetch only pulls clicks / impressions / position.']:
    "Statut d'indexation Google, tiré de l'API URL Inspection — pas du bouton Récupérer. Cliquez sur « Inspecter (top 100) » pour remplir cette colonne ; Récupérer ne rapporte que clics / impressions / position.",
  ["Googlebot — Smartphone matches Google's mobile-first indexing crawler."]:
    "Googlebot — Smartphone correspond au robot d'indexation mobile-first de Google.",
  ['Hard cap on pending URLs held in memory. Excess discoveries are dropped silently — bounds peak heap during fan-out bursts (big sitemaps, dense link graphs).']:
    "Plafond strict des URL en attente conservées en mémoire. Les découvertes excédentaires sont abandonnées en silence — borne le tas maximal pendant les rafales d'expansion (grands sitemaps, graphes de liens denses).",
  ['Hard cap on the number of 3xx hops we follow for a single chain. Each hop is recorded as its own URL row regardless. 0 disables the cap (chain still ends at `redirect_loop`).']:
    "Plafond strict du nombre de sauts 3xx suivis pour une seule chaîne. Chaque saut est de toute façon enregistré comme sa propre ligne d'URL. 0 désactive le plafond (la chaîne se termine toujours à `redirect_loop`).",
  ["Hard cap on total URLs crawled. The crawl stops as soon as this is reached. Screaming Frog: 'Limit Crawl Total'."]:
    "Plafond strict du nombre total d'URL explorées. L'exploration s'arrête dès qu'il est atteint. Screaming Frog : 'Limit Crawl Total'.",
  ["Hard ceiling on requests per second across all workers combined. Equivalent to Screaming Frog's 'Max URL/s'. Acts as a token bucket — even with high concurrency the crawler waits between bursts to stay below this rate."]:
    "Plafond strict de requêtes par seconde pour tous les workers combinés. Équivalent du 'Max URL/s' de Screaming Frog. Fonctionne comme un seau à jetons — même avec une forte concurrence, l'explorateur attend entre les rafales pour rester sous ce débit.",
  ['Height attribute value (in pixels) declared on the <img> tag, when present.']:
    "Valeur de l'attribut height (en pixels) déclarée sur la balise <img>, lorsqu'elle est présente.",
  ["Honor Disallow rules + crawl-delay declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "Respecter les règles Disallow + crawl-delay déclarées dans /robots.txt pour le User-Agent configuré. Screaming Frog : 'Respect robots.txt' (Configuration → robots.txt).",
  ["Hop count from the start URL. Start URL is depth 0; its outlinks are depth 1, theirs depth 2, and so on. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits)."]:
    "Nombre de sauts depuis l'URL de départ. L'URL de départ est à la profondeur 0 ; ses liens sortants à la profondeur 1, les leurs à la profondeur 2, et ainsi de suite. Screaming Frog : 'Limit Crawl Depth' (Configuration → Spider → Limits).",
  ['How many distinct pages reference this image. High values typically indicate site-wide assets (logos, icons).']:
    'Combien de pages distinctes référencent cette image. Des valeurs élevées indiquent généralement des ressources communes à tout le site (logos, icônes).',
  ["How to canonicalise paths with/without a trailing slash. 'Add' is file-extension aware — won't add a slash to /file.pdf or /image.png."]:
    "Comment canoniser les chemins avec/sans barre oblique finale. « Ajouter » tient compte de l'extension de fichier — n'ajoutera pas de barre à /file.pdf ni à /image.png.",
  ['HTML attribute name to read.']: "Nom de l'attribut HTML à lire.",
  ['HTML transfer size of the page document. Heavy HTML payloads delay first paint. Stored as bytes internally; entered here in kilobytes.']:
    'Taille de transfert HTML du document de la page. Les charges HTML lourdes retardent le premier affichage. Stockée en octets en interne ; saisie ici en kilo-octets.',
  ['HTTP `<img>` / `<video>` / `<audio>` / `<source>` references on an HTTPS page — rendered but the URL bar reads "Not Secure".']:
    "Références HTTP `<img>` / `<video>` / `<audio>` / `<source>` sur une page HTTPS — rendues, mais la barre d'adresse affiche « Non sécurisé ».",
  ['HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` references on an HTTPS page — browsers BLOCK these silently.']:
    'Références HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` sur une page HTTPS — les navigateurs les BLOQUENT silencieusement.',
  ['HTTP response status code. Empty/Failed indicates a network error before any response was received.']:
    "Code d'état de la réponse HTTP. Vide/Échec indique une erreur réseau avant toute réponse.",
  ['HTTP status of the source page itself. Usually 200; if non-2xx the broken link may be inherited.']:
    "Statut HTTP de la page source elle-même. Généralement 200 ; s'il n'est pas 2xx, le lien cassé peut être hérité.",
  ['HTTP status returned by the target. 0 = network failure (DNS, TLS, timeout).']:
    'Statut HTTP renvoyé par la cible. 0 = échec réseau (DNS, TLS, délai dépassé).',
  ["HTTP/HTTPS proxies route via undici's ProxyAgent; SOCKS proxies (socks5://, socks5h://, socks4://, socks4a://) tunnel via the socks client. The `h`/`4a` variants resolve DNS at the proxy. Leave empty to inherit HTTPS_PROXY/HTTP_PROXY env vars."]:
    "Les proxies HTTP/HTTPS passent par le ProxyAgent d'undici ; les proxies SOCKS (socks5://, socks5h://, socks4://, socks4a://) sont tunnelisés via le client socks. Les variantes `h`/`4a` résolvent le DNS au niveau du proxy. Laissez vide pour hériter des variables d'environnement HTTPS_PROXY/HTTP_PROXY.",
  ["Identifies the largest element visible in the initial viewport (likely LCP candidate per Google's heuristic) and stores its CSS selector, dimensions, and resource URL. Useful for spotting unoptimised LCP images without a PSI API call."]:
    "Identifie le plus grand élément visible dans la fenêtre initiale (candidat LCP probable selon l'heuristique de Google) et stocke son sélecteur CSS, ses dimensions et l'URL de sa ressource. Utile pour repérer des images LCP non optimisées sans appel à l'API PSI.",
  ['If set, Playwright waits for this CSS selector to appear in the DOM before extracting HTML. Overrides the extra-wait timeout when present. Useful when you know the SPA reveals a specific element after hydration.']:
    "Si défini, Playwright attend que ce sélecteur CSS apparaisse dans le DOM avant d'extraire le HTML. Remplace le délai d'attente supplémentaire lorsqu'il est présent. Utile quand vous savez que la SPA révèle un élément précis après hydratation.",
  ['Images on this page that have no alt attribute. WCAG accessibility issue + missed alt-as-anchor SEO opportunity.']:
    "Images de cette page sans attribut alt. Problème d'accessibilité WCAG + opportunité SEO manquée d'alt comme ancre.",
  ['Indexable / Non-Indexable']: 'Indexable / Non indexable',
  ['Internal PageRank, 0–100. Computed over the internal link graph (damping 0.85) and normalised so the most-linked page scores 100. Higher = more internal link equity.']:
    "PageRank interne, 0–100. Calculé sur le graphe de liens internes (amortissement 0.85) et normalisé pour que la page la plus liée obtienne 100. Plus élevé = plus d'équité de liens internes.",
  ['internal / external']: 'interne / externe',
  ['JavaScript executed in every page BEFORE navigation begins (init script). Use to set localStorage / cookies / mock APIs / disable animations. Runs in page context — no Node access.']:
    "JavaScript exécuté sur chaque page AVANT le début de la navigation (script d'initialisation). Sert à définir localStorage / cookies / simuler des API / désactiver les animations. S'exécute dans le contexte de la page — pas d'accès à Node.",
  ['JavaScript regex (no flags — /g is implicit). Use a capture group with `output=regex_group` to extract just part of the match.']:
    "Regex JavaScript (sans flags — /g est implicite). Utilisez un groupe de capture avec `output=regex_group` pour n'extraire qu'une partie de la correspondance.",
  ['JavaScript regex tested against the full URL. Empty = all URLs allowed. URL must match at least one to be enqueued. The start URL is always permitted regardless.']:
    "Regex JavaScript testée sur l'URL complète. Vide = toutes les URL autorisées. L'URL doit correspondre à au moins une pour être mise en file. L'URL de départ est toujours autorisée.",
  ['JavaScript regex. Any match → URL is skipped, even if it would otherwise pass the include list. Common uses: skip admin areas, large file types, session-id query params.']:
    "Regex JavaScript. Toute correspondance → l'URL est ignorée, même si elle passerait la liste d'inclusion. Usages courants : ignorer les zones d'administration, les gros types de fichiers, les paramètres d'identifiant de session.",
  ['JSON map of `{ term: count }` literal-substring hits from the configured Custom Search terms.']:
    'Carte JSON `{ term: count }` des occurrences littérales de sous-chaînes des termes de Recherche personnalisée configurés.',
  ['JSON-stringified array of `{ lang, href }` pairs. Heavy column — better consumed via the URL Details panel.']:
    "Tableau sérialisé en JSON de paires `{ lang, href }`. Colonne lourde — mieux vaut la consulter via le panneau Détails de l'URL.",
  ['JSON-stringified custom-extraction results map. Heavy column — render verbatim, easier to read in the URL Details panel.']:
    "Carte des résultats d'extraction personnalisée sérialisée en JSON. Colonne lourde — affichée telle quelle, plus lisible dans le panneau Détails de l'URL.",
  ['JSONPath against a JSON response body (e.g. `application/json` APIs). Only runs on responses that parse as JSON — ignored on HTML pages.']:
    "JSONPath appliqué au corps d'une réponse JSON (p. ex. des API `application/json`). Ne s'exécute que sur les réponses analysables en JSON — ignoré sur les pages HTML.",
  ['JSONPath returns the matched JSON value as-is; choose `Count` to return the number of matches instead.']:
    'JSONPath renvoie la valeur JSON correspondante telle quelle ; choisissez `Count` pour renvoyer plutôt le nombre de correspondances.',
  ["Largest Contentful Paint from PageSpeed Insights lab data, when the URL has been audited. Google's 'good' LCP threshold is 2500 ms. Pages without PSI data are never flagged on this metric."]:
    "Largest Contentful Paint issu des données de laboratoire PageSpeed Insights, lorsque l'URL a été auditée. Le seuil « bon » de LCP selon Google est 2500 ms. Les pages sans données PSI ne sont jamais signalées sur cette métrique.",
  ['load = good default. networkidle for heavy SPAs. domcontentloaded if you only need raw HTML.']:
    "load = bon choix par défaut. networkidle pour les SPA lourdes. domcontentloaded si vous n'avez besoin que du HTML brut.",
  ['Location header value when status is 3xx. The URL the server points to next; chain length is in the URL Details panel.']:
    "Valeur de l'en-tête Location lorsque le statut est 3xx. L'URL vers laquelle le serveur pointe ensuite ; la longueur de la chaîne se trouve dans le panneau Détails de l'URL.",
  ['Lowercases the URL path component. Host is already case-insensitive per the URL spec, so this only affects the path.']:
    "Met en minuscules la composante chemin de l'URL. L'hôte est déjà insensible à la casse selon la spécification des URL, donc cela n'affecte que le chemin.",
  ['Near-duplicate cluster ID assigned by the post-crawl SimHash pass. 0 = singleton (no near-duplicates within the configured Hamming threshold). Pages sharing a non-zero cluster ID are mutually similar.']:
    'ID du groupe de quasi-doublons attribué par la passe SimHash post-exploration. 0 = singleton (aucun quasi-doublon dans le seuil de Hamming configuré). Les pages partageant un ID non nul sont mutuellement similaires.',
  ['noindex, canonicalised, redirected, blocked-by-robots']:
    'noindex, canonisée, redirigée, bloquée par robots',
  ['None for fastest crawl. Above-the-fold for SERP-thumbnail-style preview. Full page when you need long-page snapshots.']:
    "Aucune pour l'exploration la plus rapide. Above-the-fold pour un aperçu façon vignette SERP. Page entière lorsque vous avez besoin de captures de pages longues.",
  ['Number of `<form action="http://…">` declarations on an HTTPS page. Submitting one downgrades the connection.']:
    'Nombre de déclarations `<form action="http://…">` sur une page HTTPS. En soumettre une dégrade la connexion.',
  ['Number of `<link rel="alternate" hreflang>` entries declared on this page. 0 = no alternates declared.']:
    'Nombre d\'entrées `<link rel="alternate" hreflang>` déclarées sur cette page. 0 = aucune alternative déclarée.',
  ['Number of `<link rel="canonical">` tags on the page. >1 is a "Multiple Canonicals" issue.']:
    'Nombre de balises `<link rel="canonical">` sur la page. >1 est un problème « Canoniques multiples ».',
  ['Number of `<script type="application/ld+json">` blocks parsed successfully on the page.']:
    'Nombre de blocs `<script type="application/ld+json">` analysés avec succès sur la page.',
  ['Number of `<script type="application/ld+json">` blocks that failed to parse as JSON.']:
    'Nombre de blocs `<script type="application/ld+json">` dont l\'analyse JSON a échoué.',
  ['Number of <img> elements on the page.']: "Nombre d'éléments <img> sur la page.",
  ['Number of browser tabs the pool keeps warm in parallel. 0 = auto (matches crawler concurrency, capped at 8). More tabs = faster crawl but more RAM (each tab ~80–150 MB).']:
    "Nombre d'onglets de navigateur que le pool garde ouverts en parallèle. 0 = auto (aligné sur la concurrence de l'explorateur, plafonné à 8). Plus d'onglets = exploration plus rapide mais plus de RAM (chaque onglet ~80–150 Mo).",
  ['Number of hreflang targets that are non-200, noindex, or canonicalised away. Aggregated by the post-crawl pass.']:
    'Nombre de cibles hreflang qui ne sont pas en 200, sont en noindex ou canonisées ailleurs. Agrégé par la passe post-exploration.',
  ["Number of HTTP requests in flight at any one time. Equivalent to Screaming Frog's 'Max Threads'. Higher = faster crawl + more load on the target server."]:
    "Nombre de requêtes HTTP en cours à un instant donné. Équivalent du 'Max Threads' de Screaming Frog. Plus élevé = exploration plus rapide + plus de charge sur le serveur cible.",
  ['Number of internal `<a>` elements with no usable anchor text or alt — accessibility / SEO regression.']:
    "Nombre d'éléments `<a>` internes sans texte d'ancre ni alt exploitable — régression d'accessibilité / SEO.",
  ['Number of internal pages that link to this URL. A rough internal-PageRank signal.']:
    'Nombre de pages internes pointant vers cette URL. Un signal approximatif de PageRank interne.',
  ["Number of pages in this URL's near-duplicate cluster (1 = no duplicates, ≥2 = part of a duplicate group). Tunable via Settings → Duplicates."]:
    "Nombre de pages dans le groupe de quasi-doublons de cette URL (1 = aucun doublon, ≥2 = fait partie d'un groupe de doublons). Réglable dans Paramètres → Doublons.",
  ['Number of redirect hops from this URL to its terminal target. Filled by the post-crawl `recomputeRedirectChains` walker. >3 trips the "Long Chain" issue.']:
    'Nombre de sauts de redirection entre cette URL et sa cible finale. Rempli par le parcours `recomputeRedirectChains` post-exploration. >3 déclenche le problème « Chaîne longue ».',
  ['Number of unique <a> links emitted from this page (internal + external).']:
    'Nombre de liens <a> uniques émis depuis cette page (internes + externes).',
  ['Off — only enable for testing edge cases.']:
    "Désactivé — n'activez que pour tester des cas limites.",
  ['Off — small speed gain not worth the fidelity loss.']:
    'Désactivé — le petit gain de vitesse ne vaut pas la perte de fidélité.',
  ['On — fonts add overhead without changing SEO output.']:
    'Activé — les polices ajoutent de la charge sans changer le résultat SEO.',
  ['On (default) — cheap I/O, high SEO value.']:
    'Activé (par défaut) — E/S bon marché, forte valeur SEO.',
  ['On (default) — media is heavy and rarely SEO-relevant.']:
    'Activé (par défaut) — les médias sont lourds et rarement pertinents pour le SEO.',
  ['On (default) so the Internal tab shows images, not just HTML; off for HTML-only crawls.']:
    "Activé (par défaut) pour que l'onglet Interne affiche les images et pas seulement le HTML ; désactivé pour les explorations HTML uniquement.",
  ['On (default); off for HTML-only crawls.']:
    'Activé (par défaut) ; désactivé pour les explorations HTML uniquement.',
  ['On (default). Off only when crawling sites you own and need to bypass.']:
    'Activé (par défaut). Désactivez uniquement pour explorer des sites qui vous appartiennent et que vous devez contourner.',
  ['On for accessibility / WCAG audits.']: "Activé pour les audits d'accessibilité / WCAG.",
  ['On for max speed. Off if you need LCP candidate detection or visual screenshots later.']:
    'Activé pour une vitesse maximale. Désactivé si vous aurez besoin plus tard de la détection des candidats LCP ou de captures visuelles.',
  ['On for modern sites that 301 http→https anyway; off for legacy intranet.']:
    'Activé pour les sites modernes qui redirigent de toute façon http→https en 301 ; désactivé pour les intranets hérités.',
  ['On for normal audits; off when you only want to inspect raw 3xx behaviour.']:
    'Activé pour les audits classiques ; désactivé lorsque vous voulez seulement inspecter le comportement 3xx brut.',
  ['On for outbound link audits; off for fast internal-only crawls.']:
    'Activé pour les audits de liens sortants ; désactivé pour des explorations rapides internes uniquement.',
  ['On for performance-focused audits that should fail pages over a target.']:
    "Activé pour les audits axés sur la performance qui doivent faire échouer les pages au-delà d'une cible.",
  ['On for performance-focused audits.']: 'Activé pour les audits axés sur la performance.',
  ['On for production crawls. Off when debugging selector-not-found / hydration issues.']:
    'Activé pour les explorations de production. Désactivé pour déboguer des problèmes de sélecteur introuvable / hydratation.',
  ['ON for SEO audits (the typical case). Turn OFF to also cluster paginated / canonical-blocked variants for completeness.']:
    "ACTIVÉ pour les audits SEO (le cas typique). DÉSACTIVEZ pour regrouper aussi les variantes paginées / bloquées par canonique, par souci d'exhaustivité.",
  ["On for SEO audits that include Google's Mobile-Friendly checks."]:
    'Activé pour les audits SEO incluant les vérifications Mobile-Friendly de Google.',
  ['On for SEO audits where View Source matters; off for 1M-URL crawls where disk is tight.']:
    "Activé pour les audits SEO où Voir la source compte ; désactivé pour les explorations d'1M d'URL où le disque est contraint.",
  ['ON for SEO audits. OFF only when you specifically need to inspect raw-URL collisions (e.g. case-sensitive filesystem CMSes).']:
    "ACTIVÉ pour les audits SEO. DÉSACTIVEZ uniquement lorsque vous devez spécifiquement inspecter les collisions d'URL brutes (p. ex. des CMS à système de fichiers sensible à la casse).",
  ['On if you need nofollow attribute audits; off keeps the link graph cleaner.']:
    "Activé si vous devez auditer l'attribut nofollow ; désactivé garde le graphe de liens plus propre.",
  ['On if your CMS serves the same page at mixed casing (/Foo and /foo).']:
    'Activé si votre CMS sert la même page avec une casse mixte (/Foo et /foo).',
  ['On if your site canonicalises to non-www but emits www links somewhere.']:
    'Activé si votre site canonise vers la version sans www mais émet des liens en www quelque part.',
  ["On network errors, 408/425/429/5xx responses, retry up to N more times before giving up. Each retry counts toward the URL's response time budget."]:
    "Sur erreurs réseau et réponses 408/425/429/5xx, réessayer jusqu'à N fois supplémentaires avant d'abandonner. Chaque nouvel essai compte dans le budget de temps de réponse de l'URL.",
  ['On when auditing mobile UX or capturing PageSpeed-style mobile previews.']:
    "Activé pour auditer l'UX mobile ou capturer des aperçus mobiles façon PageSpeed.",
  ["One header per line in 'Key: Value' format. Added to every request — useful for auth tokens or custom routing hints. User values override defaults when keys collide."]:
    "Un en-tête par ligne au format 'Clé: Valeur'. Ajouté à chaque requête — utile pour les jetons d'authentification ou des indications de routage personnalisées. Les valeurs de l'utilisateur remplacent les valeurs par défaut en cas de collision de clés.",
  ['One sitemap URL per line. On top of following links from the start URL, the crawler fetches these sitemaps and queues every page they list as an extra seed — faster/more complete discovery, and reliable orphan detection even when the sitemap lives at a non-standard path. Leave empty to disable.']:
    "Une URL de sitemap par ligne. En plus de suivre les liens depuis l'URL de départ, l'explorateur récupère ces sitemaps et met en file chaque page listée comme graine supplémentaire — découverte plus rapide/complète, et détection fiable des orphelines même lorsque le sitemap se trouve à un chemin non standard. Laissez vide pour désactiver.",
  ['One URL per line. Each is fetched exactly once; outlinks are NOT followed. Comments starting with # are ignored.']:
    'Une URL par ligne. Chacune est récupérée exactement une fois ; les liens sortants ne sont PAS suivis. Les commentaires commençant par # sont ignorés.',
  ['OS scheduler hint applied at crawl start. Lowering priority lets the rest of the machine stay responsive during heavy crawls. May require elevated privileges on some platforms.']:
    "Indication au planificateur de l'OS appliquée au début de l'exploration. Baisser la priorité permet au reste de la machine de rester réactif pendant les explorations lourdes. Peut nécessiter des privilèges élevés sur certaines plateformes.",
  ["Page A→B declared but B→A absent flags 'Reciprocity Missing'; same lang on two hrefs flags 'Inconsistent Lang'."]:
    'Page A→B déclarée mais B→A absente signale « Réciprocité manquante » ; la même lang sur deux href signale « Lang incohérente ».',
  ['Page that contains the broken link.']: 'Page contenant le lien cassé.',
  ["Pages with > this many outgoing links (internal + external) trip the 'Total Links per Page' issue. Google's historic recommendation is 100; mega-menus/hub-pages routinely blow past this."]:
    'Les pages avec plus de ce nombre de liens sortants (internes + externes) déclenchent le problème « Liens totaux par page ». La recommandation historique de Google est 100 ; les méga-menus/pages hub la dépassent régulièrement.',
  ['PASS = indexed · FAIL = not indexed · PART/NEU = discovered but not yet indexed']:
    'PASS = indexée · FAIL = non indexée · PART/NEU = découverte mais pas encore indexée',
  ['Pattern: ^https://m\\.(.+) · Replacement: https://www.$1 · Flags: i  (collapse mobile subdomain to www)']:
    'Motif : ^https://m\\.(.+) · Remplacement : https://www.$1 · Flags : i  (fusionner le sous-domaine mobile dans www)',
  ["Per-request abort threshold. Pages that take longer than this are recorded as network errors. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — that one's in seconds, this is in milliseconds."]:
    "Seuil d'abandon par requête. Les pages qui prennent plus longtemps sont enregistrées comme erreurs réseau. Screaming Frog : 'Response Timeout (secs)' (Configuration → Spider → Advanced) — celui-là est en secondes, celui-ci en millisecondes.",
  ['Persist rel="nofollow" links in the link graph. When off, nofollow links are dropped entirely (not counted in outlinks, not probed as externals). Screaming Frog inverse: turning this ON ≈ unchecking "Follow Internal/External Nofollow".']:
    'Conserver les liens rel="nofollow" dans le graphe de liens. Désactivé, les liens nofollow sont entièrement abandonnés (non comptés dans les liens sortants, non sondés comme externes). Inverse de Screaming Frog : activer ceci ≈ décocher "Follow Internal/External Nofollow".',
  ['Picking a preset fills the User-Agent field below — you can still hand-edit it afterwards. Switch between Googlebot Smartphone / Desktop to compare how a site responds to mobile vs desktop crawlers.']:
    "Choisir un préréglage remplit le champ User-Agent ci-dessous — vous pouvez toujours le modifier ensuite à la main. Basculez entre Googlebot Smartphone / Desktop pour comparer la réponse d'un site aux robots mobiles et bureau.",
  ["Picks one of the saved profiles by name. Empty = use the Proxy URL field above (or env vars when that's also empty)."]:
    "Choisit un des profils enregistrés par son nom. Vide = utiliser le champ URL du proxy ci-dessus (ou les variables d'environnement lorsqu'il est vide lui aussi).",
  ['Pre-computes Dead External Domain, Duplicate URL post-norm, Canonical Chain Multi-hop. Without this the sidebar shows 0 for those three.']:
    'Précalcule Domaine externe mort, URL dupliquée après normalisation et Chaîne de canoniques multi-sauts. Sans cela, la barre latérale affiche 0 pour ces trois-là.',
  ['After the crawl, re-fetches a sample of indexable pages with the opposite user agent (mobile when the crawl ran as desktop, desktop otherwise) and compares title, H1, meta description, canonical, robots, word count and link count. Differences feed the \'Mobile / Desktop Mismatch\' issue and the report of the same name.']:
    'Après l\'exploration, recharge un échantillon de pages indexables avec l\'agent utilisateur opposé (mobile si l\'exploration était bureau, et inversement) et compare titre, H1, meta description, canonical, robots, nombre de mots et de liens. Les écarts alimentent le problème « Écart mobile / bureau » et le rapport du même nom.',
  ['How many pages the mobile-parity probe re-fetches, most-linked first. 0 = every indexable HTML page (doubles the crawl\'s traffic for that set).']:
    'Nombre de pages que la sonde de parité mobile recharge, les plus liées d\'abord. 0 = toutes les pages HTML indexables (double le trafic de l\'exploration pour cet ensemble).',
  ["Probe outbound links to other hosts (HEAD only) so the Broken Links view catches dead externals. Screaming Frog: 'External Links' (Configuration → Spider → Crawl)."]:
    "Sonder les liens sortants vers d'autres hôtes (HEAD uniquement) pour que la vue Liens cassés détecte les externes morts. Screaming Frog : 'External Links' (Configuration → Spider → Crawl).",
  ['Raw `Content-Security-Policy` response header. Empty when missing.']:
    "En-tête de réponse `Content-Security-Policy` brut. Vide lorsqu'il est absent.",
  ['Raw `content` attribute of `<meta http-equiv="refresh">`, e.g. "5; url=/foo".']:
    'Attribut `content` brut de `<meta http-equiv="refresh">`, p. ex. "5; url=/foo".',
  ['Raw `Strict-Transport-Security` header. Empty when missing — for HTTPS pages this is a security regression.']:
    "En-tête `Strict-Transport-Security` brut. Vide lorsqu'il est absent — pour les pages HTTPS, c'est une régression de sécurité.",
  ['Raw `X-Content-Type-Options` header. `nosniff` blocks MIME sniffing — prevents some XSS via content-type confusion.']:
    'En-tête `X-Content-Type-Options` brut. `nosniff` bloque le reniflage MIME — empêche certains XSS par confusion de content-type.',
  ['Raw `X-Frame-Options` header. SAMEORIGIN / DENY / ALLOW-FROM. Clickjacking defence.']:
    'En-tête `X-Frame-Options` brut. SAMEORIGIN / DENY / ALLOW-FROM. Défense contre le clickjacking.',
  ['Raw value of the Content-Type response header (incl. charset).']:
    "Valeur brute de l'en-tête de réponse Content-Type (charset inclus).",
  ['Re-renders each page on a mobile viewport and checks viewport meta tag, horizontal overflow, font size legibility, and tap-target spacing. Stores a pass/fail verdict on the urls table.']:
    "Rend à nouveau chaque page dans une fenêtre mobile et vérifie la balise meta viewport, le débordement horizontal, la lisibilité de la taille de police et l'espacement des cibles tactiles. Stocke un verdict réussite/échec dans la table urls.",
  ['Read the full article →']: "Lire l'article complet →",
  ["Reject-all = ignore Set-Cookie entirely (zero counts on cookie-flag issues). Block-third-party = analyse only first-party cookies (Domain attribute matches the page's registrable domain). Accept-all = analyse every Set-Cookie regardless of scope."]:
    "Tout rejeter = ignorer complètement Set-Cookie (zéro décompte sur les problèmes de flags de cookies). Bloquer les tiers = n'analyser que les cookies propriétaires (l'attribut Domain correspond au domaine enregistrable de la page). Tout accepter = analyser chaque Set-Cookie quelle que soit sa portée.",
  ["Reject-all for stateless audits; Block-third-party to focus on the site's own cookie hygiene; Accept-all to also see ad/analytics tracker cookies."]:
    "Tout rejeter pour des audits sans état ; Bloquer les tiers pour se concentrer sur l'hygiène des cookies du site lui-même ; Tout accepter pour voir aussi les cookies des traceurs publicitaires/analytiques.",
  ["Removes the leading 'www.' from the host at normalisation time. The seen-set, redirect graph, and link extraction all use the rewritten form, so duplicates collapse correctly."]:
    "Supprime le 'www.' initial de l'hôte à la normalisation. L'ensemble des vus, le graphe de redirections et l'extraction de liens utilisent tous la forme réécrite, donc les doublons se fusionnent correctement.",
  ['Renders the page a second time on a mobile viewport and stores an above-the-fold PNG. Adds another full render + screenshot per URL.']:
    'Rend la page une seconde fois dans une fenêtre mobile et stocke un PNG above-the-fold. Ajoute un rendu complet + une capture supplémentaires par URL.',
  ['Resolved absolute URL of the <img src> attribute.']:
    "URL absolue résolue de l'attribut <img src>.",
  ['Response body size in bytes (compressed transfer size, post-Content-Encoding).']:
    'Taille du corps de la réponse en octets (taille de transfert compressée, après Content-Encoding).',
  ['Rewrites http:// to https:// before fetching. Breaks HTTP-only sites.']:
    'Réécrit http:// en https:// avant la récupération. Casse les sites HTTP uniquement.',
  ['Run Chromium without a visible window. Turn off to debug rendering visually — useful when a page renders correctly in a normal browser but not under Playwright.']:
    "Exécuter Chromium sans fenêtre visible. Désactivez pour déboguer le rendu visuellement — utile lorsqu'une page se rend correctement dans un navigateur normal mais pas sous Playwright.",
  ['Run the login steps once before the crawl, then replay the session cookies on every request.']:
    "Exécuter les étapes de connexion une fois avant l'exploration, puis rejouer les cookies de session sur chaque requête.",
  ["Runs iterative PageRank (damping 0.85) over the internal link graph and normalises it to a 0–100 Link Score per page. Drives the Link Score column and the 'By Link Score' visualization colour mode."]:
    'Exécute un PageRank itératif (amortissement 0.85) sur le graphe de liens internes et le normalise en un Score de liens de 0–100 par page. Alimente la colonne Score de liens et le mode de couleur « Par score de liens » de la visualisation.',
  ['Sends the URL through the same normalisation pipeline used by the crawler, with your unsaved settings applied. Useful for verifying regex rules before kicking off a crawl.']:
    "Fait passer l'URL par le même pipeline de normalisation que l'explorateur, avec vos paramètres non enregistrés appliqués. Utile pour vérifier des règles regex avant de lancer une exploration.",
  ['Sent on every request as the User-Agent header. Identifies the crawler to servers; some sites serve different content based on UA.']:
    "Envoyé à chaque requête comme en-tête User-Agent. Identifie l'explorateur auprès des serveurs ; certains sites servent un contenu différent selon l'UA.",
  ['Sent on every request. Affects which locale a multi-lingual site serves you.']:
    'Envoyé à chaque requête. Détermine quelle langue un site multilingue vous sert.',
  ["Sent verbatim as `Bearer <token>`. Don't include the `Bearer ` prefix yourself."]:
    "Envoyé tel quel comme `Bearer <token>`. N'ajoutez pas vous-même le préfixe `Bearer `.",
  ['Server response time (a TTFB proxy) measured during the crawl. Pages slower than this are flagged. Google considers a good server response time under 800 ms.']:
    "Temps de réponse du serveur (un indicateur de TTFB) mesuré pendant l'exploration. Les pages plus lentes sont signalées. Google considère comme bon un temps de réponse serveur inférieur à 800 ms.",
  ['Shop the latest game keys at unbeatable prices…']:
    'Achetez les dernières clés de jeux à des prix imbattables…',
  ["Skips body parsing for pages whose Content-Length header exceeds this. The page row is still created so links to it aren't lost; only body parsing and source snapshot capture are skipped."]:
    "Ignore l'analyse du corps pour les pages dont l'en-tête Content-Length dépasse cette valeur. La ligne de la page est quand même créée pour que les liens vers elle ne soient pas perdus ; seuls l'analyse du corps et la capture de la source sont ignorées.",
  ['Sleep this long on each worker AFTER a response completes, before it picks up the next URL. Stacks with the global RPS cap — useful for sites that rate-limit on inter-request gap rather than total throughput.']:
    "Faire dormir chaque worker pendant cette durée APRÈS la fin d'une réponse, avant qu'il ne prenne l'URL suivante. Se cumule avec le plafond RPS global — utile pour les sites qui limitent selon l'intervalle entre requêtes plutôt que le débit total.",
  ['Specific reason a URL is non-indexable. For Indexable URLs this column is empty.']:
    "Raison précise pour laquelle une URL n'est pas indexable. Pour les URL indexables, cette colonne est vide.",
  ['Spider follows links from the start URL across the chosen scope. List fetches a fixed set of URLs once with no link-following. Sitemap fetches a sitemap URL and crawls every page it lists (no link-following).']:
    "Spider suit les liens depuis l'URL de départ dans la portée choisie. Liste récupère un ensemble fixe d'URL une fois sans suivre les liens. Sitemap récupère une URL de sitemap et explore chaque page listée (sans suivre les liens).",
  ["Spider for full site audits; List for re-checking a known set of pages; Sitemap to audit exactly what's published in sitemap.xml."]:
    'Spider pour des audits complets de site ; Liste pour revérifier un ensemble connu de pages ; Sitemap pour auditer exactement ce qui est publié dans sitemap.xml.',
  ['Standard CSS selector — same syntax as `document.querySelectorAll`.']:
    'Sélecteur CSS standard — même syntaxe que `document.querySelectorAll`.',
  ['Stored in your local prefs file as plain text. Treat the file accordingly.']:
    'Stocké dans votre fichier de préférences local en texte clair. Traitez le fichier en conséquence.',
  ['Strip if your site canonicalises /foo (no slash); Add for sites that canonicalise /foo/.']:
    'Retirer si votre site canonise /foo (sans barre) ; Ajouter pour les sites qui canonisent /foo/.',
  ['Sunset over the mountain ridge']: 'Coucher de soleil sur la crête de la montagne',
  ['Surplus `@id` occurrences across all JSON-LD blocks (page declares the same `@id` more than once).']:
    "Occurrences excédentaires de `@id` dans l'ensemble des blocs JSON-LD (la page déclare le même `@id` plus d'une fois).",
  ['Terminal URL the redirect chain resolves to. Empty when this row is itself the terminal (i.e. status is 2xx/4xx/5xx) or when the chain hits a loop.']:
    'URL finale vers laquelle la chaîne de redirections se résout. Vide lorsque cette ligne est elle-même le terminus (c.-à-d. statut 2xx/4xx/5xx) ou lorsque la chaîne tombe dans une boucle.',
  ['Canonical hops walked after this page (or, on a redirect row, after the redirect\'s final URL) until a page that canonicalises to itself. 0 when the canonical is the page itself or absent.']:
    'Sauts canonical parcourus après cette page (ou, sur une ligne de redirection, après l\'URL finale de la redirection) jusqu\'à une page qui se canonicalise elle-même. 0 lorsque le canonical est la page elle-même ou absent.',
  ['Where the canonical chain ends. Empty when the page is its own canonical, or when the chain loops.']:
    'Où se termine la chaîne canonical. Vide lorsque la page est son propre canonical ou lorsque la chaîne boucle.',
  ['text for visible content, attribute for href/src, count for occurrence count']:
    "text pour le contenu visible, attribute pour href/src, count pour le nombre d'occurrences",
  ['Text of the first <h1> on the page. Should match user intent and ideally complement (not duplicate) the title.']:
    "Texte du premier <h1> de la page. Doit correspondre à l'intention de l'utilisateur et idéalement compléter (sans dupliquer) le titre.",
  ["Text Only fetches the raw HTML response as-is — fast and deterministic. Old AJAX Crawling Scheme rewrites hashbang (#!) URLs to Google's deprecated ?_escaped_fragment_= form so a pre-rendering server returns the snapshot. Full JavaScript rendering is a V2 item."]:
    "Texte seul récupère la réponse HTML brute telle quelle — rapide et déterministe. L'ancien AJAX Crawling Scheme réécrit les URL hashbang (#!) dans la forme obsolète de Google ?_escaped_fragment_= afin qu'un serveur de pré-rendu renvoie l'instantané. Le rendu JavaScript complet est un élément de la V2.",
  ['Text Only for server-rendered / static sites; Old AJAX only for legacy hashbang SPAs.']:
    'Texte seul pour les sites statiques / rendus côté serveur ; Ancien AJAX uniquement pour les SPA hashbang héritées.',
  ["The column / JSON-key name for this rule's output. Free-form."]:
    'Nom de colonne / clé JSON pour la sortie de cette règle. Texte libre.',
  ['The fully normalised URL of the crawled resource (post URL-rewriting).']:
    "L'URL entièrement normalisée de la ressource explorée (après réécriture des URL).",
  ['The URL that fails to resolve (4xx/5xx/network error).']:
    "L'URL qui ne se résout pas (4xx/5xx/erreur réseau).",
  ['Third-party `<script>` / `<link rel=stylesheet>` references without an `integrity=` attribute. SRI is recommended for any cross-origin subresource.']:
    'Références tierces `<script>` / `<link rel=stylesheet>` sans attribut `integrity=`. SRI est recommandé pour toute sous-ressource cross-origin.',
  ['Time-to-first-byte in milliseconds (network + server, excluding parse). Lower is better; >2000 ms is slow.']:
    "Temps jusqu'au premier octet en millisecondes (réseau + serveur, hors analyse). Plus bas est mieux ; >2000 ms est lent.",
  ['Total number of <h1> elements on the page. SEO best practice is exactly 1.']:
    "Nombre total d'éléments <h1> sur la page. La bonne pratique SEO est exactement 1.",
  ['Total number of <h2> elements on the page.']: "Nombre total d'éléments <h2> sur la page.",
  ['tr,en;q=0.8 — Turkish first, English fallback.']:
    'tr,en;q=0.8 — turc en premier, anglais en repli.',
  ["Trips 'Folder Depth Too Deep' when the URL path's `/`-segment count exceeds this. Useful for spotting over-nested URL structures that bury content from crawlers."]:
    "Déclenche « Profondeur de dossiers excessive » lorsque le nombre de segments `/` du chemin de l'URL dépasse cette valeur. Utile pour repérer des structures d'URL trop imbriquées qui enfouissent le contenu pour les robots.",
  ["Trips 'Long Query String' when LENGTH(query) > this. Typical session-id sprawl + UTM tracking hits 100+ chars; over 200 starts to look like a bug."]:
    "Déclenche « Chaîne de requête longue » lorsque LENGTH(query) > cette valeur. La prolifération classique d'identifiants de session + suivi UTM atteint 100+ caractères ; au-delà de 200, cela commence à ressembler à un bug.",
  ["Trips the 'URL Too Long' issue when LENGTH(url) > this. RFC 7230 doesn't mandate a max but most servers + middleboxes fail above ~2 KB; Chrome itself caps at ~32 KB."]:
    "Déclenche le problème « URL trop longue » lorsque LENGTH(url) > cette valeur. La RFC 7230 n'impose pas de maximum, mais la plupart des serveurs et équipements intermédiaires échouent au-delà de ~2 Ko ; Chrome lui-même plafonne à ~32 Ko.",
  ["Two modes per line. (1) Wrap in slashes for a regex: /pattern/flags — supported flags imsuy (g is forced). Invalid patterns appear with count -1 in the detail panel so you can spot the typo. (2) Anything else is a literal case-insensitive substring — the legacy behaviour. Each term's per-page hit count is surfaced in the URL Details panel."]:
    "Deux modes par ligne. (1) Entourez de barres obliques pour une regex : /motif/flags — flags pris en charge imsuy (g est forcé). Les motifs invalides apparaissent avec un décompte de -1 dans le panneau de détail pour repérer la faute de frappe. (2) Tout le reste est une sous-chaîne littérale insensible à la casse — le comportement hérité. Le nombre d'occurrences par page de chaque terme apparaît dans le panneau Détails de l'URL.",
  ["Two pages are flagged as near-duplicates if their 64-bit SimHash differs by at most this many bits. 3 ≈ 95% similarity over body-text shingles (Screaming Frog's tightest filter). Set to 0 to skip clustering entirely."]:
    "Deux pages sont signalées comme quasi-doublons si leur SimHash 64 bits diffère d'au plus ce nombre de bits. 3 ≈ 95 % de similarité sur les shingles du texte du corps (le filtre le plus strict de Screaming Frog). Mettez 0 pour ignorer totalement le regroupement.",
  ['URL declared by the first <link rel="canonical"> tag. Tells search engines which version to index when duplicates exist.']:
    'URL déclarée par la première balise <link rel="canonical">. Indique aux moteurs de recherche quelle version indexer lorsqu\'il existe des doublons.',
  ['URL paths ending in any of these extensions are not enqueued. Case-insensitive. Start URL is always crawled regardless.']:
    "Les chemins d'URL se terminant par l'une de ces extensions ne sont pas mis en file. Insensible à la casse. L'URL de départ est toujours explorée.",
  ['Value of the alt attribute. Empty cell = no alt declared (accessibility/SEO issue).']:
    "Valeur de l'attribut alt. Cellule vide = aucun alt déclaré (problème d'accessibilité/SEO).",
  ['Value of the X-Robots-Tag HTTP response header. Same semantics as meta robots but applied at the server.']:
    "Valeur de l'en-tête de réponse HTTP X-Robots-Tag. Même sémantique que meta robots mais appliquée côté serveur.",
  ['Viewport height — affects above-the-fold detection and lazy-load triggers.']:
    'Hauteur de la fenêtre — influe sur la détection above-the-fold et les déclencheurs de chargement différé.',
  ['Viewport width applied to every rendered page. Mobile audits typically use 360–414, desktop 1280–1920.']:
    'Largeur de la fenêtre appliquée à chaque page rendue. Les audits mobiles utilisent généralement 360–414, les audits bureau 1280–1920.',
  ['Visible body text word count (excludes <script>/<style>). Useful for identifying thin content.']:
    'Nombre de mots du texte visible du corps (hors <script>/<style>). Utile pour identifier le contenu pauvre.',
  ['Wait this long before the FIRST retry, doubling on each subsequent attempt (500 → 1000 → 2000 …).']:
    'Attendre ce délai avant la PREMIÈRE nouvelle tentative, en doublant à chaque tentative suivante (500 → 1000 → 2000 …).',
  ["Walks 3xx redirect chains, fills `redirect_chain_length` / `redirect_loop`. Drives the 'Long Chain' and 'Redirect Loop' issues + the Redirects tab."]:
    "Parcourt les chaînes de redirections 3xx et remplit `redirect_chain_length` / `redirect_loop`. Alimente les problèmes « Chaîne longue » et « Boucle de redirection » + l'onglet Redirections.",
  ['Welcome to Example Store']: 'Bienvenue à la Boutique exemple',
  ['What to do when multiple matches exist.']:
    "Que faire lorsqu'il existe plusieurs correspondances.",
  ['What to read off each matched element. Ignored for an XPath `/@attr` or `/text()` terminal — that value is used directly.']:
    'Que lire sur chaque élément correspondant. Ignoré pour un terminal XPath `/@attr` ou `/text()` — cette valeur est utilisée directement.',
  ['When non-empty, ALL query parameters not on this list are dropped during normalisation (case-insensitive name match). Leave empty to keep the default behaviour, which strips just utm_*, fbclid, gclid, mc_cid, and mc_eid.']:
    'Lorsque non vide, TOUS les paramètres de requête absents de cette liste sont supprimés à la normalisation (correspondance de nom insensible à la casse). Laissez vide pour conserver le comportement par défaut, qui ne retire que utm_*, fbclid, gclid, mc_cid et mc_eid.',
  ['When off, no budget evaluation runs and the verdict column is cleared. When on, the post-crawl pass scores every internal 200 HTML page against the ceilings below.']:
    "Désactivé, aucune évaluation de budget n'a lieu et la colonne de verdict est vidée. Activé, la passe post-exploration note chaque page HTML 200 interne par rapport aux plafonds ci-dessous.",
  ['When on (default), pagination_next + pagination_prev URLs are post-fetch enqueued. Off only to debug pagination-only loops without disabling all link follow.']:
    'Activé (par défaut), les URL pagination_next + pagination_prev sont mises en file après récupération. Désactivez uniquement pour déboguer des boucles de pagination sans désactiver tout le suivi de liens.',
  ['When ON (default), the Duplicate URL filter compares URLs after lowercasing the host, dropping the query string, and trimming the trailing slash — the canonical SEO behaviour. When OFF, comparison is byte-exact, so the filter only fires on rows that share an identical raw URL string (rare since URLs are deduped at insert time).']:
    "ACTIVÉ (par défaut), le filtre URL dupliquée compare les URL après mise en minuscules de l'hôte, suppression de la chaîne de requête et retrait de la barre finale — le comportement SEO canonique. DÉSACTIVÉ, la comparaison est octet pour octet, donc le filtre ne se déclenche que sur des lignes partageant une chaîne d'URL brute identique (rare puisque les URL sont dédupliquées à l'insertion).",
  ["When on, `<meta http-equiv='refresh'>` content URLs are enqueued like a redirect target. window.location body redirects are heuristic-only and currently out of scope."]:
    "Activé, les URL du content de `<meta http-equiv='refresh'>` sont mises en file comme une cible de redirection. Les redirections window.location dans le corps sont purement heuristiques et actuellement hors périmètre.",
  ['When on, a 200 page declaring a canonical pointing elsewhere also enqueues that target. Default off — most crawls treat canonicals as a signal, not a navigation hint.']:
    'Activé, une page 200 qui déclare une canonique pointant ailleurs met aussi cette cible en file. Désactivé par défaut — la plupart des explorations traitent les canoniques comme un signal, pas comme une indication de navigation.',
  ['When on, pages with noindex / canonicalised / robots-blocked indexability are excluded from clustering — the Near-Duplicate report then surfaces only issues that affect search visibility.']:
    "Activé, les pages dont l'indexabilité est noindex / canonisée / bloquée par robots sont exclues du regroupement — le rapport Quasi-doublons ne fait alors remonter que les problèmes qui affectent la visibilité dans les moteurs.",
  ["When on, rel=nofollow links are recursed into like any other link. Default off — Screaming Frog 'Respect Nofollow' default."]:
    "Activé, les liens rel=nofollow sont parcourus comme n'importe quel autre lien. Désactivé par défaut — comportement par défaut 'Respect Nofollow' de Screaming Frog.",
  ['When Playwright considers navigation complete. domcontentloaded = HTML parsed but resources still loading. load = window.load fired. networkidle = no network activity for 500ms (best for SPA but slower). commit = just response committed (fastest, riskiest).']:
    'Quand Playwright considère la navigation terminée. domcontentloaded = HTML analysé mais ressources encore en chargement. load = window.load déclenché. networkidle = aucune activité réseau pendant 500 ms (idéal pour les SPA mais plus lent). commit = réponse simplement validée (le plus rapide, le plus risqué).',
  ['Whether the broken target is on the same site (internal) or a different host (external).']:
    'Si la cible cassée est sur le même site (interne) ou sur un autre hôte (externe).',
  ['Whether the URL is eligible to appear in search results. Combines status code, robots directives, canonical, and meta-refresh signals.']:
    "Si l'URL peut apparaître dans les résultats de recherche. Combine le code d'état, les directives robots, la canonique et les signaux de meta-refresh.",
  ['Width attribute value (in pixels) declared on the <img> tag, when present.']:
    "Valeur de l'attribut width (en pixels) déclarée sur la balise <img>, lorsqu'elle est présente.",
  ['XPath 1.0 subset over the parsed DOM. End in `/@attr` or `/text()` to read an attribute / text node. Predicates: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.']:
    'Sous-ensemble de XPath 1.0 sur le DOM analysé. Terminez par `/@attr` ou `/text()` pour lire un attribut / nœud texte. Prédicats : `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.',
  ['Y when the page declares hreflang alternates but no entry whose `href` matches the page URL. Google requires a self-reference.']:
    "Y lorsque la page déclare des alternatives hreflang mais aucune entrée dont le `href` correspond à l'URL de la page. Google exige une auto-référence.",
  ['Y when the redirect chain originating at this URL contains a cycle (A → B → A) detected by the cycle-safe walker; the chain is otherwise unwalked.']:
    "Y lorsque la chaîne de redirections partant de cette URL contient un cycle (A → B → A) détecté par le parcours protégé contre les cycles ; sinon la chaîne n'est pas parcourue.",
  ['Y when this URL belongs to a paginated cluster whose ordinal sequence has a gap (e.g. ?page=1, 2, 4 — page 3 missing). Set by the post-crawl `recomputePaginationSequence` pass.']:
    'Y lorsque cette URL appartient à un groupe paginé dont la séquence ordinale présente un trou (p. ex. ?page=1, 2, 4 — page 3 manquante). Défini par la passe `recomputePaginationSequence` post-exploration.',
  ['SQL injection — the request tries to smuggle SQL into a parameter (UNION SELECT, sleep(), error-based functions) to read or alter your database.']:
    'Injection SQL — la requête tente de glisser du SQL dans un paramètre (UNION SELECT, sleep(), fonctions basées sur les erreurs) pour lire ou modifier votre base de données.',
  ['Cross-site scripting — the request carries script markup or a javascript: URL in a parameter, hoping the page echoes it back into the HTML unescaped.']:
    'Cross-site scripting — la requête transporte du balisage de script ou une URL javascript: dans un paramètre, en espérant que la page le renvoie dans le HTML sans échappement.',
  ['Path traversal — the request walks out of the web root with ../ or encoded variants to reach files like /etc/passwd or win.ini.']:
    'Traversée de répertoires — la requête sort de la racine web avec ../ ou des variantes encodées pour atteindre des fichiers comme /etc/passwd ou win.ini.',
  ['Command injection — the request appends shell syntax (;, |, backticks, $( )) to a parameter to run commands on the server.']:
    'Injection de commandes — la requête ajoute une syntaxe shell (;, |, accents graves, $( )) à un paramètre pour exécuter des commandes sur le serveur.',
  ['Scanner probe — an automated vulnerability scanner walking a wordlist of known admin panels, installers and exploit paths (wp-login, phpmyadmin, /actuator, shell uploads). Not tailored to your site; it hits everyone.']:
    "Sonde de scanner — un scanner de vulnérabilités automatisé parcourant une liste de panneaux d'administration, d'installateurs et de chemins d'exploits connus (wp-login, phpmyadmin, /actuator, envois de shell). Pas adapté à votre site ; il frappe tout le monde.",
  ['Sensitive file fetch — a direct request for something that must never be public: .env, .git, backups, SQL dumps, private keys, config files.']:
    'Récupération de fichier sensible — une requête directe pour quelque chose qui ne doit jamais être public : .env, .git, sauvegardes, dumps SQL, clés privées, fichiers de configuration.',
  ['Anomaly — malformed or evasive input (null bytes, CRLF injection, over-encoding, absurd parameter lengths) that matches no single attack class but is not a normal browser request.']:
    "Anomalie — entrée malformée ou évasive (octets nuls, injection CRLF, sur-encodage, longueurs de paramètre absurdes) qui ne correspond à aucune classe d'attaque précise mais n'est pas une requête normale de navigateur.",
  ['Sum of the weights of every attack signature the request matched. Each signature carries a weight by how conclusive it is (a UNION SELECT weighs 9, a stray quote 2), and a line is only flagged once the total reaches 5 — so one decisive pattern flags on its own, while weak hints have to add up. Higher score = less room for a false positive; sort by it to triage.']:
    "Somme des poids de chaque signature d'attaque à laquelle la requête a correspondu. Chaque signature porte un poids selon son caractère concluant (un UNION SELECT pèse 9, un guillemet isolé 2), et une ligne n'est signalée que lorsque le total atteint 5 — ainsi un motif décisif se signale seul, tandis que les indices faibles doivent s'additionner. Score plus élevé = moins de marge pour un faux positif ; triez dessus pour prioriser.",
  ['Which attack class the strongest matching signature belongs to: SQL injection, XSS, path traversal, command injection, scanner probe, sensitive file, or anomaly. Hover any badge in this column for what that class means in practice.']:
    "Classe d'attaque à laquelle appartient la signature correspondante la plus forte : injection SQL, XSS, traversée de répertoires, injection de commandes, sonde de scanner, fichier sensible ou anomalie. Survolez un badge de cette colonne pour savoir ce que cette classe signifie en pratique.",
  ["Filters on the Status column — the most recent response the log recorded for that path. The analyzer keeps one status per URL rather than a full distribution, so this answers 'what is this URL returning now'. Paths whose status could not be parsed are hidden while a class is selected."]:
    "Filtre sur la colonne Statut — la réponse la plus récente que le journal a enregistrée pour ce chemin. L'analyseur conserve un statut par URL plutôt qu'une distribution complète, donc cela répond à « que renvoie cette URL maintenant ». Les chemins dont le statut n'a pas pu être analysé sont masqués tant qu'une classe est sélectionnée.",
  ['Most recent HTTP status the log recorded for this path. One value per URL, not a distribution — a path that returned 200 all week and 404 this morning shows 404.']:
    'Statut HTTP le plus récent enregistré par le journal pour ce chemin. Une valeur par URL, pas une distribution — un chemin qui a renvoyé 200 toute la semaine et 404 ce matin affiche 404.',
  ['A URL whose path repeats the same segment this many times or more (/shop/shop/shop/…) is treated as a link loop and skipped. This shape comes from a relative-href bug and has no legitimate counterpart. Skipped counts are reported when the crawl finishes.']:
    "Une URL dont le chemin répète le même segment au moins ce nombre de fois (/shop/shop/shop/…) est traitée comme une boucle de liens et ignorée. Cette forme provient d'un bug de href relatif et n'a pas d'équivalent légitime. Les décomptes ignorés sont rapportés à la fin de l'exploration.",
  ['3 is safe for every site; raise to 4–5 only if a real path legitimately repeats a segment; 0 disables the guard.']:
    '3 est sûr pour tous les sites ; montez à 4–5 seulement si un vrai chemin répète légitimement un segment ; 0 désactive la protection.',
  ['URLs with more query parameters than this are flagged as faceted-navigation traps under Issues → URL → Crawl Trap. Detection only — the URLs are still crawled, because legitimate filter pages look the same.']:
    "Les URL ayant plus de paramètres de requête que cette valeur sont signalées comme pièges de navigation à facettes sous Problèmes → URL → Piège d'exploration. Détection uniquement — les URL sont quand même explorées, car les pages de filtre légitimes ont la même apparence.",
  ['4 surfaces most faceted-nav explosions; 0 disables the check.']:
    '4 fait remonter la plupart des explosions de navigation à facettes ; 0 désactive la vérification.',
  ["Honor Allow / Disallow rules declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "Respecter les règles Allow / Disallow déclarées dans /robots.txt pour le User-Agent configuré. Screaming Frog : 'Respect robots.txt' (Configuration → robots.txt).",
  ["Honor a Crawl-delay directive as a global rate limit (one request every N seconds). Crawl-delay is not part of RFC 9309 — Google ignores it and Screaming Frog does not implement it — and published values are often stale: 'Crawl-delay: 30' turns a 500-URL crawl into hours. Ignored by default; the directive is still reported in the log when found."]:
    "Respecter une directive Crawl-delay comme limite de débit globale (une requête toutes les N secondes). Crawl-delay ne fait pas partie de la RFC 9309 — Google l'ignore et Screaming Frog ne l'implémente pas — et les valeurs publiées sont souvent obsolètes : 'Crawl-delay: 30' transforme une exploration de 500 URL en heures. Ignoré par défaut ; la directive est tout de même signalée dans le journal lorsqu'elle est trouvée.",
  ['Off (default) for normal audits. On when an ops policy requires it — expect the crawl to take Crawl-delay seconds per URL.']:
    "Désactivé (par défaut) pour les audits classiques. Activé lorsqu'une politique d'exploitation l'exige — attendez-vous à ce que l'exploration prenne Crawl-delay secondes par URL.",
  ['Crawl fetches internal <img> targets (incl. srcset / <picture> sources) so each appears in the Internal tab with status, content type, and size — every one counts toward Max URLs. Store keeps the <img> declarations in the Images tab, which works even with Crawl off: you get the full image inventory with alt text for the cost of zero extra requests.']:
    "Explorer récupère les cibles <img> internes (y compris srcset / sources <picture>) pour que chacune apparaisse dans l'onglet Interne avec statut, type de contenu et taille — chacune compte dans Max URL. Stocker conserve les déclarations <img> dans l'onglet Images, qui fonctionne même avec Explorer désactivé : vous obtenez l'inventaire complet des images avec leur texte alt pour zéro requête supplémentaire.",
  ['Store on, Crawl off is the cheap alt-text audit. Both on for a full image health check.']:
    "Stocker activé, Explorer désactivé est l'audit de texte alt bon marché. Les deux activés pour un bilan complet de santé des images.",
  ['<video> / <audio> and the <source> children they own. Off by default — media files are large and rarely what an SEO crawl is looking for.']:
    '<video> / <audio> et leurs enfants <source>. Désactivé par défaut — les fichiers média sont volumineux et rarement ce que cherche une exploration SEO.',
  ['On when auditing a video-heavy site for dead media URLs.']:
    "Activé pour auditer un site riche en vidéos à la recherche d'URL média mortes.",
  ["<link rel=stylesheet> targets. Crawling a stylesheet is also what discovers the web fonts and background images declared inside it via @font-face / url() — so Crawl on with Store off still populates the Internal tab's Font filter without listing every stylesheet."]:
    "Cibles de <link rel=stylesheet>. Explorer une feuille de style est aussi ce qui découvre les polices web et les images de fond déclarées à l'intérieur via @font-face / url() — donc Explorer activé avec Stocker désactivé alimente quand même le filtre Polices de l'onglet Interne sans lister chaque feuille de style.",
  ['Crawl on, Store off when you want fonts discovered but not hundreds of CSS rows.']:
    'Explorer activé, Stocker désactivé lorsque vous voulez découvrir les polices sans des centaines de lignes CSS.',
  ['<script src> targets, fetched so each gets its own row with status code, content type, and size. Headers only — the body is discarded, never executed.']:
    "Cibles de <script src>, récupérées pour que chacune ait sa propre ligne avec code d'état, type de contenu et taille. En-têtes uniquement — le corps est rejeté, jamais exécuté.",
  ['Both on to catch 404ing bundles; both off for HTML-only crawls.']:
    'Les deux activés pour attraper des bundles en 404 ; les deux désactivés pour des explorations HTML uniquement.',
  ['<a href> targets on the same site. Crawl off turns the run into an audit of a fixed set of pages — sitemaps, canonicals, and the other declared alternates below still feed discovery. Store off empties the link graph: inlinks, outlinks, anchor-text reports, and link score all go with it.']:
    "Cibles de <a href> sur le même site. Explorer désactivé transforme l'exécution en audit d'un ensemble fixe de pages — les sitemaps, canoniques et autres alternatives déclarées ci-dessous alimentent toujours la découverte. Stocker désactivé vide le graphe de liens : liens entrants, sortants, rapports de textes d'ancre et score de liens disparaissent avec lui.",
  ['Leave both on. Crawl off only when a sitemap or URL list already defines the exact set you want.']:
    "Laissez les deux activés. Explorer désactivé seulement lorsqu'un sitemap ou une liste d'URL définit déjà l'ensemble exact voulu.",
  ['Outbound links to other hosts are always status-checked (one HEAD each) so Broken Links catches dead externals — that does not depend on this row. Crawl here means fully crawling those pages, following their links onward too. Store keeps outbound links in the link graph.']:
    "Les liens sortants vers d'autres hôtes ont toujours leur statut vérifié (un HEAD chacun) pour que Liens cassés détecte les externes morts — cela ne dépend pas de cette ligne. Explorer ici signifie explorer entièrement ces pages, en suivant aussi leurs liens. Stocker conserve les liens sortants dans le graphe de liens.",
  ['Crawl off (default) — status-check externals without spidering the whole web.']:
    'Explorer désactivé (par défaut) — vérifier le statut des externes sans explorer tout le web.',
  ['<link rel=canonical> and its HTTP Link: header form. Crawl also enqueues the canonical target, treating it as a navigation hint. Store feeds the Canonicals tab and every canonical issue filter.']:
    "<link rel=canonical> et sa forme d'en-tête HTTP Link:. Explorer met aussi la cible canonique en file, en la traitant comme une indication de navigation. Stocker alimente l'onglet Canoniques et tous les filtres de problèmes de canonique.",
  ['Crawl off (default) — canonicals are a signal, not a route. Store on.']:
    'Explorer désactivé (par défaut) — les canoniques sont un signal, pas un itinéraire. Stocker activé.',
  ['<link rel=next> / <link rel=prev>. Part of the standard discovery graph; turn Crawl off to isolate a pagination loop without disabling link-following everywhere.']:
    '<link rel=next> / <link rel=prev>. Fait partie du graphe de découverte standard ; désactivez Explorer pour isoler une boucle de pagination sans désactiver le suivi de liens partout.',
  ['Both on unless you are debugging an infinite paginated series.']:
    'Les deux activés sauf si vous déboguez une série paginée infinie.',
  ['<link rel=alternate hreflang>. Crawl enqueues every declared alternate, which is how you reach language versions nothing links to. Store feeds the Hreflang tab and the reciprocity / invalid-code audits.']:
    "<link rel=alternate hreflang>. Explorer met en file chaque alternative déclarée, ce qui permet d'atteindre des versions linguistiques vers lesquelles rien ne pointe. Stocker alimente l'onglet Hreflang et les audits de réciprocité / code invalide.",
  ['Crawl on for a multi-language audit — otherwise unlinked locales stay invisible.']:
    'Explorer activé pour un audit multilingue — sinon les langues non liées restent invisibles.',
  ['<link rel=amphtml>. Crawl fetches the AMP variant as its own URL; Store keeps the declaration plus the AMP smoke-validator findings.']:
    '<link rel=amphtml>. Explorer récupère la variante AMP comme sa propre URL ; Stocker conserve la déclaration ainsi que les résultats du validateur AMP de base.',
  ['Crawl on only if the site still ships AMP pages.']:
    'Explorer activé uniquement si le site publie encore des pages AMP.',
  ['<meta http-equiv="refresh">. Crawl enqueues the parsed target like a redirect; Store keeps the raw directive and its URL for the Meta Refresh tab.']:
    '<meta http-equiv="refresh">. Explorer met la cible analysée en file comme une redirection ; Stocker conserve la directive brute et son URL pour l\'onglet Meta Refresh.',
  ['Crawl on when auditing a legacy site that still redirects this way.']:
    'Explorer activé pour auditer un site hérité qui redirige encore de cette façon.',
  ["<iframe src> documents. Crawl fetches each embedded page as its own URL, which can pull in a lot of third-party surface. Store records them in the link graph so a dead embed shows up in Outlinks and Broken Links — without counting toward the page's outlink total, since an embed is not a hyperlink."]:
    "Documents <iframe src>. Explorer récupère chaque page intégrée comme sa propre URL, ce qui peut ramener beaucoup de surface tierce. Stocker les enregistre dans le graphe de liens pour qu'une intégration morte apparaisse dans Liens sortants et Liens cassés — sans compter dans le total de liens sortants de la page, puisqu'une intégration n'est pas un hyperlien.",
  ['Store on, Crawl off is usually the right pair.']:
    'Stocker activé, Explorer désactivé est généralement la bonne combinaison.',
  ['The separate-URL (m-dot) mobile version: <link rel="alternate" media="only screen and (max-width: …)">. Null on responsive sites, which is most of them — a value here with no reciprocal canonical back is the classic broken m-dot setup.']:
    'La version mobile à URL distincte (m-dot) : <link rel="alternate" media="only screen and (max-width: …)">. Nul sur les sites responsive, soit la plupart — une valeur ici sans canonique réciproque en retour est la configuration m-dot cassée classique.',
  ['Crawl on only when the site really does serve a separate mobile host.']:
    'Explorer activé uniquement lorsque le site sert réellement un hôte mobile distinct.',
  ['Links a search engine cannot follow: <a> with no href but an onclick, href="javascript:…", and href="#" placeholders wired to a handler. Store-only — an uncrawlable link is by definition never fetched. Drives the JS-Only Navigation issue filter.']:
    'Liens qu\'un moteur de recherche ne peut pas suivre : <a> sans href mais avec onclick, href="javascript:…" et espaces réservés href="#" branchés à un gestionnaire. Stocker uniquement — un lien non explorable n\'est par définition jamais récupéré. Alimente le filtre de problèmes Navigation JS uniquement.',
  ['On — it is a count, so it costs nothing.']:
    "Activé — c'est un décompte, donc ça ne coûte rien.",
  ['With a Subfolder-scoped crawl, links pointing outside the start folder are fetched once so their status code is known, then stopped — they are checked, not crawled through. Off leaves them undiscovered entirely.']:
    "Avec une exploration de portée Sous-dossier, les liens pointant hors du dossier de départ sont récupérés une fois pour connaître leur code d'état, puis arrêtés — ils sont vérifiés, pas explorés en profondeur. Désactivé les laisse totalement non découverts.",
  ['On — knowing a link out of /blog/ is a 404 costs one request.']:
    "Activé — savoir qu'un lien sortant de /blog/ est un 404 coûte une requête.",
  ["Off restricts the crawl to URLs under the start URL's path (Crawl Scope = Subfolder). On lets it cover the whole host. This is a view of the Crawl Scope setting, not a separate switch, so the two can never disagree."]:
    "Désactivé restreint l'exploration aux URL sous le chemin de l'URL de départ (Portée d'exploration = Sous-dossier). Activé lui permet de couvrir tout l'hôte. C'est une vue du paramètre Portée d'exploration, pas un interrupteur distinct, donc les deux ne peuvent jamais se contredire.",
  ['Off to audit just /blog/; on for the whole site.']:
    "Désactivé pour n'auditer que /blog/ ; activé pour tout le site.",
  ['Treats every host sharing the registrable domain as internal — shop.example.com and blog.example.com crawl alongside example.com instead of counting as external. Another view of the Crawl Scope setting.']:
    "Traite chaque hôte partageant le domaine enregistrable comme interne — shop.example.com et blog.example.com sont explorés aux côtés d'example.com au lieu de compter comme externes. Une autre vue du paramètre Portée d'exploration.",
  ['On when subdomains are part of the same property.']:
    'Activé lorsque les sous-domaines font partie de la même propriété.',
  ['Crawl through rel="nofollow" links pointing at the same site. Off (default) is Screaming Frog "Respect Nofollow" behaviour. Internal and external are separate switches because sites nofollow them for opposite reasons — crawl-budget shaping vs. not vouching for a third party.']:
    'Explorer à travers les liens rel="nofollow" pointant vers le même site. Désactivé (par défaut) est le comportement "Respect Nofollow" de Screaming Frog. Interne et externe sont des interrupteurs distincts car les sites les utilisent pour des raisons opposées — façonner le budget d\'exploration vs ne pas se porter garant d\'un tiers.',
  ['On when a site nofollows its own faceted navigation and you need behind it.']:
    "Activé lorsqu'un site met sa propre navigation à facettes en nofollow et que vous devez aller au-delà.",
  ['Crawl through rel="nofollow" links pointing at other hosts. Only has an effect while External Links → Crawl is on.']:
    "Explorer à travers les liens rel=\"nofollow\" pointant vers d'autres hôtes. N'a d'effet que tant que Liens externes → Explorer est activé.",
  ['Off — nofollowed externals are exactly the ones you did not vouch for.']:
    'Désactivé — les externes en nofollow sont exactement ceux dont vous ne vous êtes pas porté garant.',
  ['Record hrefs that cannot be parsed as a URL — unencoded whitespace inside the authority, doubled schemes, stray delimiters. They can never resolve to a crawled page, so every one is reported in Broken Links, which is the point. Deliberate non-navigable schemes (mailto:, tel:, #) are not malformed and never appear.']:
    "Enregistrer les href qui ne peuvent pas être analysés comme URL — espaces non encodés dans l'autorité, schémas doublés, délimiteurs parasites. Ils ne peuvent jamais se résoudre en page explorée, donc chacun est signalé dans Liens cassés, ce qui est le but. Les schémas non navigables délibérés (mailto:, tel:, #) ne sont pas malformés et n'apparaissent jamais.",
  ['On when hunting hand-written markup errors; off keeps Broken Links focused on real 404s.']:
    'Activé pour traquer les erreurs de balisage écrites à la main ; désactivé garde Liens cassés centré sur les vrais 404.',
  ['Off drops every discovered URL carrying a `?`, before robots and before a request goes out. That is the cheap way to stop a faceted navigation (?color=red&size=xl&sort=price) from spending the whole URL budget on one product listing wearing a thousand URLs. The start URL is always crawled, and subresources are exempt — style.css?v=7 is a cache-buster, not a facet. Skipped URLs are counted and reported in the log, never dropped silently.']:
    "Désactivé abandonne chaque URL découverte contenant un `?`, avant robots et avant tout envoi de requête. C'est la façon bon marché d'empêcher une navigation à facettes (?color=red&size=xl&sort=price) de dépenser tout le budget d'URL sur une seule liste de produits déguisée en mille URL. L'URL de départ est toujours explorée, et les sous-ressources sont exemptées — style.css?v=7 est un cache-buster, pas une facette. Les URL ignorées sont comptées et rapportées dans le journal, jamais abandonnées en silence.",
  ['On (default). Off for a first pass over a shop with faceted filters.']:
    'Activé (par défaut). Désactivé pour une première passe sur une boutique avec des filtres à facettes.',
  ['Parameter names that keep a URL in the crawl anyway — pagination, a language switch, a product id. Names only; values are not looked at, and matching ignores case. A URL is admitted only when every parameter it carries is on this list: ?page=2 passes, ?page=2&color=red does not. Any-match would defeat the point, since a facet URL nearly always carries the pagination parameter too.']:
    "Noms de paramètres qui gardent malgré tout une URL dans l'exploration — pagination, changement de langue, identifiant de produit. Noms uniquement ; les valeurs ne sont pas examinées, et la correspondance ignore la casse. Une URL n'est admise que lorsque chaque paramètre qu'elle porte figure dans cette liste : ?page=2 passe, ?page=2&color=red non. Une correspondance partielle irait à l'encontre du but, puisqu'une URL de facette porte presque toujours aussi le paramètre de pagination.",
  ['page, lang — keeps paginated archives reachable while the facets stay out.']:
    'page, lang — garde les archives paginées accessibles tandis que les facettes restent dehors.',
  ['Auto-discovery on its own only records sitemap entries, which is what the sitemap issue filters compare the crawl against. Turning this on crawls them too — and that is what surfaces orphans: pages the sitemap declares but nothing on the site links to.']:
    "La découverte automatique seule ne fait qu'enregistrer les entrées du sitemap, que les filtres de problèmes de sitemap comparent à l'exploration. Activer ceci les explore aussi — et c'est ce qui fait remonter les orphelines : les pages que le sitemap déclare mais vers lesquelles rien sur le site ne pointe.",
  ['On for an orphan-page audit.']: 'Activé pour un audit de pages orphelines.',
  ['Reads Sitemap: directives from /robots.txt plus the conventional /sitemap.xml fallbacks at crawl start. Cheap I/O, and it powers every sitemap issue filter.']:
    "Lit les directives Sitemap: de /robots.txt plus les replis conventionnels /sitemap.xml au début de l'exploration. E/S bon marché, et alimente tous les filtres de problèmes de sitemap.",
  ['On (default).']: 'Activé (par défaut).',
  ['Explicit sitemap URLs, one per line. Their entries are always both recorded and queued as crawl seeds — use this when the sitemap lives somewhere robots.txt never mentions.']:
    "URL de sitemap explicites, une par ligne. Leurs entrées sont toujours à la fois enregistrées et mises en file comme graines d'exploration — utilisez ceci lorsque le sitemap se trouve à un endroit que robots.txt ne mentionne jamais.",
  ['Treat the concurrency and RPS above as a ceiling and let the target server set the real pace. On a 429/503 (or a Retry-After header) the crawler pauses for the penalty window and steps the rate + concurrency down; after a sustained run of clean responses it grows them back toward the ceiling. Off = hold the configured rate no matter how the server responds.']:
    "Traite la concurrence et le RPS ci-dessus comme un plafond et laisse le serveur cible fixer le rythme réel. Sur un 429/503 (ou un en-tête Retry-After), l'explorateur se met en pause pendant la fenêtre de pénalité et réduit le débit + la concurrence ; après une série soutenue de réponses propres, il les remonte vers le plafond. Désactivé = maintenir le débit configuré quelle que soit la réponse du serveur.",
  ['Turn on for sites behind Cloudflare / a WAF that returns 429s; leave off for your own infrastructure where the fixed rate is safe.']:
    'Activez pour les sites derrière Cloudflare / un WAF renvoyant des 429 ; laissez désactivé pour votre propre infrastructure où le débit fixe est sûr.',
  ['Sorts query parameters alphabetically at normalisation time. Repeated keys keep their relative order, so ?tag=a&tag=b is preserved. Without this the two orderings occupy separate rows and read as duplicates.']:
    'Trie les paramètres de requête par ordre alphabétique à la normalisation. Les clés répétées conservent leur ordre relatif, donc ?tag=a&tag=b est préservé. Sans cela, les deux ordres occupent des lignes séparées et passent pour des doublons.',
  ['On for most sites; off if your server routes on positional parameter order.']:
    "Activé pour la plupart des sites ; désactivé si votre serveur route selon l'ordre positionnel des paramètres.",
  ['Collapses runs of slashes in the path to a single slash. Applied before the trailing-slash policy. Web servers serve these identically, so the duplicate-slash variant is normally a false duplicate.']:
    "Fusionne les suites de barres obliques du chemin en une seule. Appliqué avant la politique de barre finale. Les serveurs web les servent à l'identique, donc la variante à double barre est normalement un faux doublon.",
  ['On if a template bug emits //  in links; off if your framework uses empty path segments as data.']:
    'Activé si un bug de gabarit émet //  dans les liens ; désactivé si votre framework utilise des segments de chemin vides comme données.',
  ["Off by default: verify the login page's TLS certificate before typing credentials into it. Enable only for a trusted internal host with a self-signed certificate — an unverifiable certificate on a login page is a man-in-the-middle risk."]:
    "Désactivé par défaut : vérifier le certificat TLS de la page de connexion avant d'y saisir des identifiants. N'activez que pour un hôte interne de confiance avec un certificat auto-signé — un certificat invérifiable sur une page de connexion est un risque d'attaque de l'homme du milieu.",
  ["Hooks the History API before the page's own scripts run, so routes an SPA reaches via pushState / replaceState / popstate are discovered and crawled. Also keeps hash routes (#/about) as distinct URLs instead of collapsing them onto the shell document."]:
    "Intercepte l'History API avant l'exécution des propres scripts de la page, de sorte que les routes qu'une SPA atteint via pushState / replaceState / popstate sont découvertes et explorées. Conserve aussi les routes hash (#/about) comme URL distinctes au lieu de les fusionner dans le document shell.",
  ['On for React Router / Vue Router / Angular sites whose pages never produce a document request.']:
    'Activé pour les sites React Router / Vue Router / Angular dont les pages ne produisent jamais de requête de document.',
  ['`<link rel="alternate" media="only screen and (max-width: …)" href="…">` value — the separate-URL (m-dot) mobile version of this page. Empty on responsive sites, which is most of them. A value here with no reciprocal canonical pointing back is the classic broken m-dot setup.']:
    'Valeur de `<link rel="alternate" media="only screen and (max-width: …)" href="…">` — la version mobile à URL distincte (m-dot) de cette page. Vide sur les sites responsive, soit la plupart. Une valeur ici sans canonique réciproque pointant en retour est la configuration m-dot cassée classique.',
};
