/**
 * Dutch InfoTip ([i] tooltip) bodies, keyed by the verbatim English
 * source string. See `../info-tips.ts` for the rationale.
 */

export const NL_INFO_TIPS: Record<string, string> = {
  ["?page=1 / ?page=2 / ?page=4 → flags 'Sequence Break' on every member of the broken cluster."]:
    "?page=1 / ?page=2 / ?page=4 → markeert 'Reeksonderbreking' bij elk lid van het onderbroken cluster.",
  ['`<a>` elements that look clickable but aren\'t crawlable (no href + onclick, `href="javascript:…"`, or `href="#"` with onclick).']:
    '`<a>`-elementen die klikbaar lijken maar niet crawlbaar zijn (geen href + onclick, `href="javascript:…"`, of `href="#"` met onclick).',
  ['`<link rel="amphtml" href="…">` value — the AMP version of this page. Empty when the page does not declare an AMP alternate.']:
    'Waarde van `<link rel="amphtml" href="…">` — de AMP-versie van deze pagina. Leeg als de pagina geen AMP-alternatief declareert.',
  ['`<link rel="next" href="…">` value resolved to absolute. Empty when the page is not paginated forward.']:
    'Waarde van `<link rel="next" href="…">`, omgezet naar een absolute URL. Leeg als de pagina geen volgende pagina heeft.',
  ['`<link rel="prev" href="…">` value resolved to absolute. Empty when the page is the first in its pagination cluster.']:
    'Waarde van `<link rel="prev" href="…">`, omgezet naar een absolute URL. Leeg als de pagina de eerste in haar pagineringscluster is.',
  ['`css` runs against the parsed DOM; `regex` runs against raw HTML.']:
    '`css` werkt op de geparste DOM; `regex` werkt op de ruwe HTML.',
  ['`none` disables auth; `basic` adds `Authorization: Basic <base64>`; `bearer` adds `Authorization: Bearer <token>`; `digest` performs the RFC 2617 challenge-response on the first 401.']:
    '`none` schakelt authenticatie uit; `basic` voegt `Authorization: Basic <base64>` toe; `bearer` voegt `Authorization: Bearer <token>` toe; `digest` voert de RFC 2617-challenge-response uit bij de eerste 401.',
  ['`POST <url>` is fired when the `done` event emits. 10 s timeout. Failures are logged as info events but never break the crawl.']:
    '`POST <url>` wordt verstuurd zodra het `done`-event optreedt. Time-out van 10 s. Fouten worden gelogd als info-events, maar breken de crawl nooit af.',
  ['0 (no duplicates), 7 (member of cluster #7)']: '0 (geen duplicaten), 7 (lid van cluster #7)',
  ['0 = auto. 4 for 8GB RAM machines, 8+ for 16GB+.']:
    '0 = automatisch. 4 voor machines met 8 GB RAM, 8+ voor 16 GB+.',
  ["0 default; 250 ms when a host returns 429 with a 'too fast' message."]:
    "Standaard 0; 250 ms als een host 429 teruggeeft met een 'te snel'-melding.",
  ['0 for SSR sites, 2000 for typical SPAs, 5000+ for heavy client-rendered apps.']:
    "0 voor SSR-sites, 2000 voor gangbare SPA's, 5000+ voor zware client-side gerenderde apps.",
  ["0.1 default (Google 'good'); 0 to disable."]:
    "Standaard 0.1 (Google 'goed'); 0 om uit te schakelen.",
  ['1 = unique, 5 = part of a 5-page near-duplicate group']:
    "1 = uniek, 5 = deel van een bijna-duplicaatgroep van 5 pagina's",
  ['10 (default), 3 for very tight chains, 0 to remove the cap']:
    '10 (standaard), 3 voor zeer korte ketens, 0 om de limiet op te heffen',
  ['10 covers most sites; 3 limits crawls to top-of-funnel pages only.']:
    "10 dekt de meeste sites; 3 beperkt crawls tot pagina's bovenin de funnel.",
  ['100 default for most audits; 0 to disable the check.']:
    'Standaard 100 voor de meeste audits; 0 om de controle uit te schakelen.',
  ['100 default; 50 for tight on-page link discipline; 0 to disable the issue.']:
    'Standaard 100; 50 voor strikte linkdiscipline op de pagina; 0 om het probleem uit te schakelen.',
  ['1000000 (1M) for a full site audit; 5000 for spot checks.']:
    '1000000 (1M) voor een volledige site-audit; 5000 voor steekproeven.',
  ['1024 (1 MB) default; 150 for a lean HTML budget; 0 to disable.']:
    'Standaard 1024 (1 MB); 150 voor een krap HTML-budget; 0 om uit te schakelen.',
  ['1048576 (1 MB) default; 524288 (512 KB) on tight disks; 0 to disable truncation entirely.']:
    'Standaard 1048576 (1 MB); 524288 (512 KB) bij weinig schijfruimte; 0 om afkappen volledig uit te schakelen.',
  ['10485760 (10 MB) on bandwidth-tight crawls; 0 to download anything.']:
    '10485760 (10 MB) bij crawls met beperkte bandbreedte; 0 om alles te downloaden.',
  ['1366 = standard laptop, 1920 = full HD desktop, 375 = iPhone width.']:
    '1366 = standaardlaptop, 1920 = full-HD-desktop, 375 = iPhone-breedte.',
  ['2 default; 0 to record errors immediately without retrying; 5 for unreliable upstreams.']:
    'Standaard 2; 0 om fouten direct vast te leggen zonder nieuwe poging; 5 voor onbetrouwbare upstreams.',
  ['20 default; 50 on fast first-party servers; 5 if the site rate-limits or returns 429s.']:
    "Standaard 20; 50 op snelle eigen servers; 5 als de site een snelheidslimiet hanteert of 429's teruggeeft.",
  ['20 for typical sites; 5 to be polite on shared hosting; 60+ when crawling your own infra.']:
    '20 voor gangbare sites; 5 om shared hosting te ontzien; 60+ als je je eigen infrastructuur crawlt.',
  ['20000 (20 s) for typical use; 5000 for fast spot checks; 60000 for slow APIs.']:
    "20000 (20 s) voor normaal gebruik; 5000 voor snelle steekproeven; 60000 voor trage API's.",
  ['2048 (≈2 GB) on a 4 GB laptop; 8192 on a 16 GB workstation; 0 to disable.']:
    '2048 (≈2 GB) op een laptop met 4 GB; 8192 op een werkstation met 16 GB; 0 om uit te schakelen.',
  ['2048 default (RFC-suggested practical ceiling).']:
    'Standaard 2048 (praktische bovengrens volgens de RFC).',
  ["2500 default (Google 'good'); 0 to disable."]:
    "Standaard 2500 (Google 'goed'); 0 om uit te schakelen.",
  ['3 = recommended; 5 catches looser duplicates (templated content with light variation); 0 turns the post-crawl pass off.']:
    '3 = aanbevolen; 5 vangt lossere duplicaten (sjablooncontent met lichte variatie); 0 schakelt de analyse na de crawl uit.',
  ['4 default; 6 on documentation sites with deep TOC trees; 0 to disable.']:
    'Standaard 4; 6 voor documentatiesites met diepe inhoudsopgaven; 0 om uit te schakelen.',
  ['500 default. Bump to 2000 when retrying against a flaky API.']:
    'Standaard 500. Verhoog naar 2000 bij nieuwe pogingen tegen een instabiele API.',
  ['50000 keeps RAM bounded during big sitemap fan-outs; 0 for typical crawls.']:
    "50000 houdt het RAM-gebruik binnen de perken bij grote sitemaps die veel URL's opleveren; 0 voor gangbare crawls.",
  ['60000 (1 minute) for huge resources; 0 to rely solely on the fetch timeout.']:
    '60000 (1 minuut) voor zeer grote resources; 0 om alleen op de ophaal-time-out te vertrouwen.',
  ['64-bit SimHash + LSH bucketing + Union-Find clustering on body shingles. Most expensive pass — typical 5–10 s on a 100k crawl.']:
    "64-bit SimHash + LSH-bucketing + Union-Find-clustering op shingles van de body. Zwaarste analyse — doorgaans 5–10 s bij een crawl van 100k URL's.",
  ['768 = standard laptop, 1080 = full HD desktop, 667 = iPhone 8 height.']:
    '768 = standaardlaptop, 1080 = full-HD-desktop, 667 = hoogte iPhone 8.',
  ['800 default; 200 for CDN-backed static; 0 to disable.']:
    'Standaard 800; 200 voor statische sites achter een CDN; 0 om uit te schakelen.',
  ['Aborts @font-face / Google Fonts / WOFF2 requests. FOUT visible but text still renders.']:
    'Breekt verzoeken voor @font-face / Google Fonts / WOFF2 af. FOUT is zichtbaar, maar tekst wordt nog steeds gerenderd.',
  ['Aborts <img>, <picture>, background-image requests. Recommended for SEO crawls — image metadata still comes from <img> tag attributes.']:
    'Breekt verzoeken voor <img>, <picture> en background-image af. Aanbevolen voor SEO-crawls — afbeeldingsmetadata komt nog steeds uit de attributen van de <img>-tag.',
  ['Aborts <video> / <audio> sources. Page DOM still includes the <video> tag.']:
    'Breekt bronnen van <video> / <audio> af. De DOM van de pagina bevat nog steeds de <video>-tag.',
  ['Aborts all <script> requests. This defeats the purpose of JS rendering — use Text Only mode instead.']:
    'Breekt alle <script>-verzoeken af. Dat ondermijnt het doel van JS-rendering — gebruik in plaats daarvan de modus Alleen tekst.',
  ['Aborts external CSS. Inline styles still load. WARNING: many SPAs use CSS-driven visibility / lazy classes — blocking CSS may hide content that JS depends on.']:
    "Breekt externe CSS af. Inline stijlen laden nog steeds. WAARSCHUWING: veel SPA's gebruiken CSS-gestuurde zichtbaarheid / lazy-klassen — CSS blokkeren kan content verbergen waar JS van afhangt.",
  ['Aborts requests whose total lifetime (connect + headers + body) exceeds this. Distinct from `requestTimeoutMs` which is the headers timeout. Useful for capping individual slow pages without lowering the overall fetch timeout.']:
    "Breekt verzoeken af waarvan de totale duur (verbinding + headers + body) deze waarde overschrijdt. Anders dan `requestTimeoutMs`, dat de time-out voor de headers is. Handig om afzonderlijke trage pagina's te begrenzen zonder de algemene ophaal-time-out te verlagen.",
  ['Absolute redirect target parsed from the meta-refresh content. Empty when meta-refresh sets only a delay.']:
    'Absoluut doorverwijzingsdoel uit de content van de meta-refresh. Leeg als de meta-refresh alleen een vertraging instelt.',
  ['Literal target of a JavaScript redirect found in an inline script (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Followed when "Follow JavaScript redirects" is on.']:
    'Letterlijk doel van een JavaScript-doorverwijzing in een inline script (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Wordt gevolgd als "JavaScript-doorverwijzingen volgen" aan staat.',
  ['Additional time to wait after the chosen wait condition fires, for SPA hydration / late XHRs. 0 = no extra wait. Bounded by the request timeout.']:
    "Extra wachttijd nadat de gekozen wachtvoorwaarde is vervuld, voor SPA-hydratatie / late XHR's. 0 = geen extra wachttijd. Begrensd door de time-out van het verzoek.",
  ['Anchor text of the broken link as rendered in the source page.']:
    'Ankertekst van de verbroken link zoals weergegeven op de bronpagina.',
  ['Audits the rendered DOM for WCAG AA colour-contrast failures (4.5:1 normal text, 3:1 large text) and stylesheet rules that suppress the keyboard focus outline without a :focus-visible fallback. Surfaces the Low-Contrast Text and Focus Outline Suppressed issue filters.']:
    'Controleert de gerenderde DOM op WCAG AA-fouten in kleurcontrast (4.5:1 normale tekst, 3:1 grote tekst) en op stylesheetregels die de focusrand voor het toetsenbord onderdrukken zonder :focus-visible-fallback. Voedt de probleemfilters Tekst met laag contrast en Focusrand onderdrukt.',
  ['basic/digest for /staging behind nginx; bearer for protected APIs']:
    "basic/digest voor /staging achter nginx; bearer voor beveiligde API's",
  ['Below Normal while you keep working in other apps; Idle for overnight unattended runs.']:
    'Lager dan normaal terwijl je in andere apps doorwerkt; Inactief voor onbeheerde nachtelijke runs.',
  ['BFS click depth from the start URL. Start URL = 0; its outlinks = 1; etc. High depth often correlates with low importance.']:
    'BFS-klikdiepte vanaf de start-URL. Start-URL = 0; de uitgaande links daarvan = 1; enz. Een grote diepte hangt vaak samen met een laag belang.',
  ['Bodies over this are truncated and flagged. 1 MB covers the 99.9th percentile of HTML pages without letting one adversarial 50 MB page bloat the project file.']:
    "Bodies boven deze grootte worden afgekapt en gemarkeerd. 1 MB dekt het 99,9e percentiel van HTML-pagina's, zonder dat één kwaadwillige pagina van 50 MB het projectbestand opblaast.",
  ['Buy Affordable Game Keys | Example Store']: 'Koop betaalbare gamekeys | Voorbeeldwinkel',
  ['Character count of the first H1.']: 'Aantal tekens van de eerste H1.',
  ['Character count of the meta description. Recommended: 70–155 characters; over 155 risks truncation.']:
    'Aantal tekens van de metabeschrijving. Aanbevolen: 70–155 tekens; boven 155 dreigt afkapping.',
  ['Character count of the title. Recommended: 30–60 characters; over 60 risks truncation in SERPs.']:
    'Aantal tekens van de titel. Aanbevolen: 30–60 tekens; boven 60 dreigt afkapping in de SERP.',
  ['Charikar 64-bit SimHash of body shingles. Used by the post-crawl near-duplicate clustering pass. Two SimHashes within the configured Hamming threshold are considered similar.']:
    'Charikar 64-bit SimHash van de shingles van de body. Gebruikt door de clustering van bijna-duplicaten na de crawl. Twee SimHashes binnen de ingestelde Hamming-drempel gelden als vergelijkbaar.',
  ['Coarse content classification derived from URL extension and Content-Type header.']:
    'Grove contentclassificatie op basis van de URL-extensie en de Content-Type-header.',
  ['Comma-joined sorted unique JSON-LD `@type` values declared on the page (Article, BreadcrumbList, Product, …).']:
    "Unieke `@type`-waarden uit de JSON-LD op de pagina, gesorteerd en gescheiden door komma's (Article, BreadcrumbList, Product, …).",
  ['Contents of the first <meta name="description"> tag. May be used as the SERP snippet.']:
    'Inhoud van de eerste <meta name="description">-tag. Kan als SERP-snippet worden gebruikt.',
  ['Contents of the first <meta name="robots"> tag. Controls per-page indexing/following behaviour.']:
    'Inhoud van de eerste <meta name="robots">-tag. Bepaalt per pagina het gedrag voor indexeren/volgen.',
  ['Contents of the first <title> element. Google primarily uses this in SERP titles.']:
    'Inhoud van het eerste <title>-element. Google gebruikt dit vooral voor titels in de SERP.',
  ['Counts how many internal pages link to each URL. Drives the Most-Linked URLs report and the per-row Inlinks column.']:
    "Telt hoeveel interne pagina's naar elke URL linken. Voedt het rapport Meest gelinkte URL's en de kolom Inkomende links per rij.",
  ["Crawl 3xx redirect targets. Each hop is its own row; the chain is reconstructed in the Response Codes view. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced)."]:
    "Doelen van 3xx-doorverwijzingen crawlen. Elke hop krijgt een eigen rij; de keten wordt gereconstrueerd in de weergave Responscodes. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced).",
  ['Crawler RSS auto-pauses the queue when this is exceeded; resumes once memory drops to 80% of the cap. Soft cap — does not enforce a hard heap limit.']:
    'Overschrijdt het RSS-geheugen van de crawler deze waarde, dan pauzeert de wachtrij automatisch; hervat zodra het geheugen daalt tot 80% van de limiet. Zachte limiet — dwingt geen harde heaplimiet af.',
  ['css for selectors, regex for free-form patterns']:
    'css voor selectors, regex voor vrije patronen',
  ["CSS selector that pins the duplicate-fingerprint text extraction to a specific page region. When set, the heuristic (main / role=main / article / body-minus-chrome) is bypassed and the selector wins. Useful on sites where the heuristic misclassifies — e.g. CMSes that wrap navigation inside `<main>` or sites with no semantic landmarks at all. Empty = use the heuristic. Invalid selectors silently fall back to the heuristic so a typo doesn't break the crawl."]:
    "CSS-selector die de tekstextractie voor de duplicaat-fingerprint vastzet op een specifiek paginagebied. Indien ingesteld wordt de heuristiek (main / role=main / article / body-minus-chrome) overgeslagen en wint de selector. Handig op sites waar de heuristiek verkeerd classificeert — bijv. CMS'en die navigatie in `<main>` plaatsen of sites zonder enige semantische landmarks. Leeg = heuristiek gebruiken. Ongeldige selectors vallen stil terug op de heuristiek, zodat een typfout de crawl niet breekt.",
  ["Cumulative Layout Shift from PageSpeed Insights, when present. Google's 'good' CLS threshold is 0.1. Unitless; accepts decimals. Pages without PSI data are never flagged."]:
    "Cumulative Layout Shift uit PageSpeed Insights, indien beschikbaar. De 'goed'-drempel van Google voor CLS is 0.1. Zonder eenheid; decimalen toegestaan. Pagina's zonder PSI-gegevens worden nooit gemarkeerd.",
  ['Drives the View Source detail tab. ~30–200 KB on disk per HTML page; turn off if you only need metadata and not full source viewing.']:
    'Voedt het detailtabblad Bron bekijken. ~30–200 KB op schijf per HTML-pagina; zet uit als je alleen metadata nodig hebt en niet de volledige broncode.',
  ["Each rule runs JavaScript RegExp.replace on the fully-normalised URL. Flags default to 'g'. After all rules run, the result is re-parsed as a URL — if the rewrite produces an invalid URL, the link is dropped at normalisation time."]:
    "Elke regel voert JavaScript RegExp.replace uit op de volledig genormaliseerde URL. Flags zijn standaard 'g'. Na alle regels wordt het resultaat opnieuw als URL geparst — levert de herschrijving een ongeldige URL op, dan wordt de link bij het normaliseren verwijderd.",
  ["Empty = safest. 'chrome' if you want the same Chrome version your users see."]:
    "Leeg = veiligst. 'chrome' als je dezelfde Chrome-versie wilt die je gebruikers zien.",
  ["Empty = use the bundled Playwright Chromium build (recommended — pinned version, works everywhere). 'chrome' / 'msedge' uses the system-installed browser. Beta channels for testing newer features."]:
    "Leeg = de meegeleverde Playwright Chromium-build gebruiken (aanbevolen — vaste versie, werkt overal). 'chrome' / 'msedge' gebruikt de op het systeem geïnstalleerde browser. Bètakanalen om nieuwere functies te testen.",
  ["Fetch internal <img> resources (incl. srcset / <picture> sources) so they appear in the Internal tab with their own status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl)."]:
    "Interne <img>-resources ophalen (incl. srcset / <picture>-bronnen), zodat ze in het tabblad Intern verschijnen met een eigen statuscode, contenttype en grootte. Elke resource telt mee voor Max. URL's. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl).",
  ["Fetch internal <link rel=stylesheet> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl)."]:
    "Interne <link rel=stylesheet>-resources ophalen, zodat ze in het tabblad Intern verschijnen met statuscode, contenttype en grootte. Elke resource telt mee voor Max. URL's. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl).",
  ["Fetch internal <script src> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl)."]:
    "Interne <script src>-resources ophalen, zodat ze in het tabblad Intern verschijnen met statuscode, contenttype en grootte. Elke resource telt mee voor Max. URL's. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl).",
  ["Fetches /robots.txt sitemap directives + /sitemap.xml fallbacks. Powers the 'Non-Indexable in Sitemap' issue filter. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl)."]:
    "Haalt sitemaprichtlijnen uit /robots.txt op + /sitemap.xml als terugvaloptie. Voedt het probleemfilter 'Niet-indexeerbaar in sitemap'. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl).",
  ["first/last for single value, all for JSON array, concat for ' | ' joined string"]:
    "first/last voor één waarde, all voor een JSON-array, concat voor een met ' | ' samengevoegde string",
  ['FNV-1a 64-bit hash of the normalised body token stream. Two pages sharing this hash are byte-identical post-tokenisation — the basis of the Exact Duplicate filter.']:
    "FNV-1a 64-bit hash van de genormaliseerde tokenstroom van de body. Twee pagina's met dezelfde hash zijn na tokenisatie byte-identiek — de basis van het filter Exact duplicaat.",
  ['For Basic, sent base64-encoded; for Digest, hashed into the challenge response.']:
    'Bij Basic base64-gecodeerd verzonden; bij Digest gehasht in de challenge-response.',
  ['For regex: `regex_group` extracts capture group 1; otherwise the whole match is used.']:
    'Voor regex: `regex_group` extraheert capture group 1; anders wordt de volledige match gebruikt.',
  ['Full-page renders the entire scrollable canvas; Above-the-fold captures just the initial viewport (cheaper). Both writes two PNGs per URL.']:
    "Volledige pagina rendert het hele scrollbare canvas; Boven de vouw legt alleen de eerste viewport vast (lichter). Beide schrijft twee PNG's per URL.",
  ['Google\'s index status, pulled from the URL Inspection API — not the Fetch button. Click "Inspect (top 100)" to fill this column; Fetch only pulls clicks / impressions / position.']:
    'Indexstatus bij Google, opgehaald via de URL Inspection API — niet via de knop Ophalen. Klik op "Inspecteren (top 100)" om deze kolom te vullen; Ophalen haalt alleen klikken / vertoningen / positie op.',
  ["Googlebot — Smartphone matches Google's mobile-first indexing crawler."]:
    'Googlebot — Smartphone komt overeen met de mobile-first-indexeringscrawler van Google.',
  ['Hard cap on pending URLs held in memory. Excess discoveries are dropped silently — bounds peak heap during fan-out bursts (big sitemaps, dense link graphs).']:
    "Harde limiet voor wachtende URL's in het geheugen. Overtollige gevonden URL's worden stil verworpen — begrenst de piekheap bij plotselinge uitwaaiering (grote sitemaps, dichte linkgrafen).",
  ['Hard cap on the number of 3xx hops we follow for a single chain. Each hop is recorded as its own URL row regardless. 0 disables the cap (chain still ends at `redirect_loop`).']:
    'Harde limiet voor het aantal 3xx-hops dat per keten wordt gevolgd. Elke hop wordt hoe dan ook als eigen URL-rij vastgelegd. 0 schakelt de limiet uit (de keten eindigt nog steeds bij `redirect_loop`).',
  ["Hard cap on total URLs crawled. The crawl stops as soon as this is reached. Screaming Frog: 'Limit Crawl Total'."]:
    "Harde limiet voor het totale aantal gecrawlde URL's. De crawl stopt zodra dit is bereikt. Screaming Frog: 'Limit Crawl Total'.",
  ["Hard ceiling on requests per second across all workers combined. Equivalent to Screaming Frog's 'Max URL/s'. Acts as a token bucket — even with high concurrency the crawler waits between bursts to stay below this rate."]:
    "Harde bovengrens voor verzoeken per seconde over alle workers samen. Gelijk aan 'Max URL/s' in Screaming Frog. Werkt als token bucket — zelfs bij hoge gelijktijdigheid wacht de crawler tussen bursts om onder deze snelheid te blijven.",
  ['Height attribute value (in pixels) declared on the <img> tag, when present.']:
    'Waarde van het height-attribuut (in pixels) op de <img>-tag, indien aanwezig.',
  ["Honor Disallow rules + crawl-delay declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "Disallow-regels + crawl-delay uit /robots.txt voor de ingestelde User-Agent respecteren. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt).",
  ["Hop count from the start URL. Start URL is depth 0; its outlinks are depth 1, theirs depth 2, and so on. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits)."]:
    "Aantal hops vanaf de start-URL. De start-URL heeft diepte 0; de uitgaande links daarvan diepte 1, die daarvan diepte 2, enzovoort. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits).",
  ['How many distinct pages reference this image. High values typically indicate site-wide assets (logos, icons).']:
    "Hoeveel verschillende pagina's naar deze afbeelding verwijzen. Hoge waarden wijzen meestal op sitebrede assets (logo's, iconen).",
  ["How to canonicalise paths with/without a trailing slash. 'Add' is file-extension aware — won't add a slash to /file.pdf or /image.png."]:
    "Hoe paden met/zonder afsluitende slash worden gecanonicaliseerd. 'Toevoegen' houdt rekening met bestandsextensies — voegt geen slash toe aan /file.pdf of /image.png.",
  ['HTML attribute name to read.']: 'Naam van het HTML-attribuut dat wordt gelezen.',
  ['HTML transfer size of the page document. Heavy HTML payloads delay first paint. Stored as bytes internally; entered here in kilobytes.']:
    'Overdrachtsgrootte van het HTML-document van de pagina. Zware HTML-payloads vertragen de first paint. Intern opgeslagen in bytes; hier ingevoerd in kilobytes.',
  ['HTTP `<img>` / `<video>` / `<audio>` / `<source>` references on an HTTPS page — rendered but the URL bar reads "Not Secure".']:
    'HTTP-verwijzingen via `<img>` / `<video>` / `<audio>` / `<source>` op een HTTPS-pagina — worden gerenderd, maar de adresbalk toont "Niet beveiligd".',
  ['HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` references on an HTTPS page — browsers BLOCK these silently.']:
    'HTTP-verwijzingen via `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` op een HTTPS-pagina — browsers BLOKKEREN deze stilzwijgend.',
  ['HTTP response status code. Empty/Failed indicates a network error before any response was received.']:
    'HTTP-statuscode van de respons. Leeg/Mislukt duidt op een netwerkfout voordat er een respons binnenkwam.',
  ['HTTP status of the source page itself. Usually 200; if non-2xx the broken link may be inherited.']:
    'HTTP-status van de bronpagina zelf. Meestal 200; bij een niet-2xx-status is de verbroken link mogelijk geërfd.',
  ['HTTP status returned by the target. 0 = network failure (DNS, TLS, timeout).']:
    'HTTP-status die het doel teruggaf. 0 = netwerkfout (DNS, TLS, time-out).',
  ["HTTP/HTTPS proxies route via undici's ProxyAgent; SOCKS proxies (socks5://, socks5h://, socks4://, socks4a://) tunnel via the socks client. The `h`/`4a` variants resolve DNS at the proxy. Leave empty to inherit HTTPS_PROXY/HTTP_PROXY env vars."]:
    "HTTP/HTTPS-proxy's lopen via de ProxyAgent van undici; SOCKS-proxy's (socks5://, socks5h://, socks4://, socks4a://) tunnelen via de socks-client. De varianten `h`/`4a` lossen DNS op bij de proxy. Laat leeg om de omgevingsvariabelen HTTPS_PROXY/HTTP_PROXY over te nemen.",
  ["Identifies the largest element visible in the initial viewport (likely LCP candidate per Google's heuristic) and stores its CSS selector, dimensions, and resource URL. Useful for spotting unoptimised LCP images without a PSI API call."]:
    'Bepaalt het grootste zichtbare element in de eerste viewport (waarschijnlijke LCP-kandidaat volgens de heuristiek van Google) en slaat de CSS-selector, afmetingen en resource-URL op. Handig om niet-geoptimaliseerde LCP-afbeeldingen te vinden zonder PSI API-aanroep.',
  ['If set, Playwright waits for this CSS selector to appear in the DOM before extracting HTML. Overrides the extra-wait timeout when present. Useful when you know the SPA reveals a specific element after hydration.']:
    'Indien ingesteld wacht Playwright tot deze CSS-selector in de DOM verschijnt voordat de HTML wordt geëxtraheerd. Heeft dan voorrang op de extra wachttijd. Handig als je weet dat de SPA na hydratatie een specifiek element toont.',
  ['Images on this page that have no alt attribute. WCAG accessibility issue + missed alt-as-anchor SEO opportunity.']:
    'Afbeeldingen op deze pagina zonder alt-attribuut. WCAG-toegankelijkheidsprobleem + gemiste SEO-kans voor alt als ankertekst.',
  ['Indexable / Non-Indexable']: 'Indexeerbaar / Niet-indexeerbaar',
  ['Internal PageRank, 0–100. Computed over the internal link graph (damping 0.85) and normalised so the most-linked page scores 100. Higher = more internal link equity.']:
    'Interne PageRank, 0–100. Berekend over de interne linkgraaf (damping 0.85) en genormaliseerd zodat de meest gelinkte pagina 100 scoort. Hoger = meer interne linkwaarde.',
  ['internal / external']: 'intern / extern',
  ['JavaScript executed in every page BEFORE navigation begins (init script). Use to set localStorage / cookies / mock APIs / disable animations. Runs in page context — no Node access.']:
    "JavaScript dat op elke pagina wordt uitgevoerd VOORDAT de navigatie begint (init-script). Gebruik het om localStorage / cookies in te stellen, API's te mocken of animaties uit te schakelen. Draait in de paginacontext — geen toegang tot Node.",
  ['JavaScript regex (no flags — /g is implicit). Use a capture group with `output=regex_group` to extract just part of the match.']:
    'JavaScript-regex (geen flags — /g is impliciet). Gebruik een capture group met `output=regex_group` om slechts een deel van de match te extraheren.',
  ['JavaScript regex tested against the full URL. Empty = all URLs allowed. URL must match at least one to be enqueued. The start URL is always permitted regardless.']:
    "JavaScript-regex die tegen de volledige URL wordt getest. Leeg = alle URL's toegestaan. Een URL moet met minstens één overeenkomen om in de wachtrij te komen. De start-URL is altijd toegestaan.",
  ['JavaScript regex. Any match → URL is skipped, even if it would otherwise pass the include list. Common uses: skip admin areas, large file types, session-id query params.']:
    'JavaScript-regex. Elke match → URL wordt overgeslagen, ook als die anders door de insluitlijst zou komen. Veelgebruikt: beheergedeelten, grote bestandstypen en session-id-queryparameters overslaan.',
  ['JSON map of `{ term: count }` literal-substring hits from the configured Custom Search terms.']:
    'JSON-map van `{ term: count }` met letterlijke substring-treffers voor de ingestelde termen van Aangepast zoeken.',
  ['JSON-stringified array of `{ lang, href }` pairs. Heavy column — better consumed via the URL Details panel.']:
    'Als JSON-string opgeslagen array van `{ lang, href }`-paren. Zware kolom — beter te bekijken via het paneel URL-details.',
  ['JSON-stringified custom-extraction results map. Heavy column — render verbatim, easier to read in the URL Details panel.']:
    'Als JSON-string opgeslagen map met resultaten van aangepaste extractie. Zware kolom — wordt letterlijk weergegeven, beter leesbaar in het paneel URL-details.',
  ['JSONPath against a JSON response body (e.g. `application/json` APIs). Only runs on responses that parse as JSON — ignored on HTML pages.']:
    "JSONPath op een JSON-responsbody (bijv. `application/json`-API's). Werkt alleen op responsen die als JSON te parsen zijn — genegeerd op HTML-pagina's.",
  ['JSONPath returns the matched JSON value as-is; choose `Count` to return the number of matches instead.']:
    'JSONPath geeft de gevonden JSON-waarde ongewijzigd terug; kies `Count` om in plaats daarvan het aantal matches terug te geven.',
  ["Largest Contentful Paint from PageSpeed Insights lab data, when the URL has been audited. Google's 'good' LCP threshold is 2500 ms. Pages without PSI data are never flagged on this metric."]:
    "Largest Contentful Paint uit de labgegevens van PageSpeed Insights, als de URL is geaudit. De 'goed'-drempel van Google voor LCP is 2500 ms. Pagina's zonder PSI-gegevens worden op deze metriek nooit gemarkeerd.",
  ['load = good default. networkidle for heavy SPAs. domcontentloaded if you only need raw HTML.']:
    "load = goede standaard. networkidle voor zware SPA's. domcontentloaded als je alleen ruwe HTML nodig hebt.",
  ['Location header value when status is 3xx. The URL the server points to next; chain length is in the URL Details panel.']:
    'Waarde van de Location-header bij een 3xx-status. De URL waarnaar de server verwijst; de ketenlengte staat in het paneel URL-details.',
  ['Lowercases the URL path component. Host is already case-insensitive per the URL spec, so this only affects the path.']:
    'Zet het padgedeelte van de URL om naar kleine letters. De host is volgens de URL-specificatie al hoofdletterongevoelig, dus dit raakt alleen het pad.',
  ['Near-duplicate cluster ID assigned by the post-crawl SimHash pass. 0 = singleton (no near-duplicates within the configured Hamming threshold). Pages sharing a non-zero cluster ID are mutually similar.']:
    "Cluster-ID voor bijna-duplicaten, toegekend door de SimHash-analyse na de crawl. 0 = alleenstaand (geen bijna-duplicaten binnen de ingestelde Hamming-drempel). Pagina's met dezelfde cluster-ID (niet 0) lijken op elkaar.",
  ['noindex, canonicalised, redirected, blocked-by-robots']:
    'noindex, gecanonicaliseerd, doorverwezen, geblokkeerd door robots',
  ['None for fastest crawl. Above-the-fold for SERP-thumbnail-style preview. Full page when you need long-page snapshots.']:
    "Geen voor de snelste crawl. Boven de vouw voor een voorbeeld in de stijl van een SERP-thumbnail. Volledige pagina als je snapshots van lange pagina's nodig hebt.",
  ['Number of `<form action="http://…">` declarations on an HTTPS page. Submitting one downgrades the connection.']:
    'Aantal `<form action="http://…">`-declaraties op een HTTPS-pagina. Verzenden ervan verlaagt de beveiliging van de verbinding.',
  ['Number of `<link rel="alternate" hreflang>` entries declared on this page. 0 = no alternates declared.']:
    'Aantal `<link rel="alternate" hreflang>`-vermeldingen op deze pagina. 0 = geen alternatieven gedeclareerd.',
  ['Number of `<link rel="canonical">` tags on the page. >1 is a "Multiple Canonicals" issue.']:
    'Aantal `<link rel="canonical">`-tags op de pagina. >1 is een probleem "Meerdere canonicals".',
  ['Number of `<script type="application/ld+json">` blocks parsed successfully on the page.']:
    'Aantal `<script type="application/ld+json">`-blokken op de pagina die succesvol zijn geparst.',
  ['Number of `<script type="application/ld+json">` blocks that failed to parse as JSON.']:
    'Aantal `<script type="application/ld+json">`-blokken die niet als JSON te parsen waren.',
  ['Number of <img> elements on the page.']: 'Aantal <img>-elementen op de pagina.',
  ['Number of browser tabs the pool keeps warm in parallel. 0 = auto (matches crawler concurrency, capped at 8). More tabs = faster crawl but more RAM (each tab ~80–150 MB).']:
    'Aantal browsertabbladen dat de pool parallel warm houdt. 0 = automatisch (gelijk aan de gelijktijdigheid van de crawler, maximaal 8). Meer tabbladen = snellere crawl, maar meer RAM (elk tabblad ~80–150 MB).',
  ['Number of hreflang targets that are non-200, noindex, or canonicalised away. Aggregated by the post-crawl pass.']:
    'Aantal hreflang-doelen dat niet-200, noindex of naar elders gecanonicaliseerd is. Samengevoegd door de analyse na de crawl.',
  ["Number of HTTP requests in flight at any one time. Equivalent to Screaming Frog's 'Max Threads'. Higher = faster crawl + more load on the target server."]:
    "Aantal HTTP-verzoeken dat tegelijk loopt. Gelijk aan 'Max Threads' in Screaming Frog. Hoger = snellere crawl + meer belasting voor de doelserver.",
  ['Number of internal `<a>` elements with no usable anchor text or alt — accessibility / SEO regression.']:
    'Aantal interne `<a>`-elementen zonder bruikbare ankertekst of alt — achteruitgang voor toegankelijkheid / SEO.',
  ['Number of internal pages that link to this URL. A rough internal-PageRank signal.']:
    "Aantal interne pagina's dat naar deze URL linkt. Een ruw signaal voor interne PageRank.",
  ["Number of pages in this URL's near-duplicate cluster (1 = no duplicates, ≥2 = part of a duplicate group). Tunable via Settings → Duplicates."]:
    "Aantal pagina's in het bijna-duplicaatcluster van deze URL (1 = geen duplicaten, ≥2 = deel van een duplicaatgroep). In te stellen via Instellingen → Duplicaten.",
  ['Number of redirect hops from this URL to its terminal target. Filled by the post-crawl `recomputeRedirectChains` walker. >3 trips the "Long Chain" issue.']:
    'Aantal doorverwijzingshops van deze URL naar het einddoel. Gevuld door de `recomputeRedirectChains`-walker na de crawl. >3 activeert het probleem "Lange keten".',
  ['Number of unique <a> links emitted from this page (internal + external).']:
    'Aantal unieke <a>-links op deze pagina (intern + extern).',
  ['Off — only enable for testing edge cases.']:
    'Uit — alleen inschakelen om randgevallen te testen.',
  ['Off — small speed gain not worth the fidelity loss.']:
    'Uit — de kleine snelheidswinst weegt niet op tegen het verlies aan nauwkeurigheid.',
  ['On — fonts add overhead without changing SEO output.']:
    'Aan — lettertypen voegen overhead toe zonder de SEO-uitkomst te veranderen.',
  ['On (default) — cheap I/O, high SEO value.']: 'Aan (standaard) — weinig I/O, hoge SEO-waarde.',
  ['On (default) — media is heavy and rarely SEO-relevant.']:
    'Aan (standaard) — media is zwaar en zelden relevant voor SEO.',
  ['On (default) so the Internal tab shows images, not just HTML; off for HTML-only crawls.']:
    'Aan (standaard), zodat het tabblad Intern ook afbeeldingen toont, niet alleen HTML; uit voor crawls met alleen HTML.',
  ['On (default); off for HTML-only crawls.']: 'Aan (standaard); uit voor crawls met alleen HTML.',
  ['On (default). Off only when crawling sites you own and need to bypass.']:
    'Aan (standaard). Alleen uit als je eigen sites crawlt en de regels moet omzeilen.',
  ['On for accessibility / WCAG audits.']: 'Aan voor toegankelijkheids- / WCAG-audits.',
  ['On for max speed. Off if you need LCP candidate detection or visual screenshots later.']:
    'Aan voor maximale snelheid. Uit als je later LCP-kandidaatdetectie of visuele screenshots nodig hebt.',
  ['On for modern sites that 301 http→https anyway; off for legacy intranet.']:
    'Aan voor moderne sites die http→https toch al met een 301 doorverwijzen; uit voor een verouderd intranet.',
  ['On for normal audits; off when you only want to inspect raw 3xx behaviour.']:
    'Aan voor normale audits; uit als je alleen het ruwe 3xx-gedrag wilt bekijken.',
  ['On for outbound link audits; off for fast internal-only crawls.']:
    "Aan voor audits van uitgaande links; uit voor snelle crawls van alleen interne URL's.",
  ['On for performance-focused audits that should fail pages over a target.']:
    "Aan voor prestatiegerichte audits die pagina's boven een doelwaarde moeten afkeuren.",
  ['On for performance-focused audits.']: 'Aan voor prestatiegerichte audits.',
  ['On for production crawls. Off when debugging selector-not-found / hydration issues.']:
    'Aan voor productiecrawls. Uit bij het debuggen van problemen met niet-gevonden selectors / hydratatie.',
  ['ON for SEO audits (the typical case). Turn OFF to also cluster paginated / canonical-blocked variants for completeness.']:
    'AAN voor SEO-audits (het gebruikelijke geval). Zet UIT om voor de volledigheid ook gepagineerde / door canonical geblokkeerde varianten te clusteren.',
  ["On for SEO audits that include Google's Mobile-Friendly checks."]:
    'Aan voor SEO-audits met de Mobile-Friendly-controles van Google.',
  ['On for SEO audits where View Source matters; off for 1M-URL crawls where disk is tight.']:
    "Aan voor SEO-audits waarbij Bron bekijken telt; uit voor crawls van 1M URL's met weinig schijfruimte.",
  ['ON for SEO audits. OFF only when you specifically need to inspect raw-URL collisions (e.g. case-sensitive filesystem CMSes).']:
    "AAN voor SEO-audits. Alleen UIT als je specifiek botsingen tussen ruwe URL's wilt bekijken (bijv. CMS'en op een hoofdlettergevoelig bestandssysteem).",
  ['On if you need nofollow attribute audits; off keeps the link graph cleaner.']:
    'Aan als je nofollow-attributen wilt auditen; uit houdt de linkgraaf overzichtelijker.',
  ['On if your CMS serves the same page at mixed casing (/Foo and /foo).']:
    'Aan als je CMS dezelfde pagina met wisselende hoofdletters serveert (/Foo en /foo).',
  ['On if your site canonicalises to non-www but emits www links somewhere.']:
    'Aan als je site naar non-www canonicaliseert maar ergens www-links bevat.',
  ["On 408/425/429/5xx responses, retry up to N more times before giving up. Requests that get no response at all use Connection Failure Retries below. Each retry counts toward the URL's response time budget."]:
    'Bij 408/425/429/5xx-responsen tot N keer opnieuw proberen voordat wordt opgegeven. Verzoeken zonder enige respons gebruiken hieronder Nieuwe pogingen bij verbindingsfout. Elke nieuwe poging telt mee voor het responstijdbudget van de URL.',
  ['On when auditing mobile UX or capturing PageSpeed-style mobile previews.']:
    'Aan bij het auditen van mobiele UX of het vastleggen van mobiele voorbeelden in PageSpeed-stijl.',
  ["One header per line in 'Key: Value' format. Sent only to the site being crawled, like HTTP authentication — never to external links or other hosts. Useful for auth tokens or custom routing hints. User values override defaults when keys collide."]:
    "Eén header per regel in de notatie 'Key: Value'. Alleen verzonden naar de site die wordt gecrawld, net als HTTP-authenticatie — nooit naar externe links of andere hosts. Handig voor auth-tokens of eigen routeringshints. Bij dezelfde sleutel overschrijven jouw waarden de standaardwaarden.",
  ['One sitemap URL per line. On top of following links from the start URL, the crawler fetches these sitemaps and queues every page they list as an extra seed — faster/more complete discovery, and reliable orphan detection even when the sitemap lives at a non-standard path. Leave empty to disable. Relative paths such as /sitemap.xml are resolved against the start URL.']:
    "Eén sitemap-URL per regel. Naast het volgen van links vanaf de start-URL haalt de crawler deze sitemaps op en zet elke vermelde pagina als extra startpunt in de wachtrij — snellere/vollediger ontdekking en betrouwbare detectie van weespagina's, ook als de sitemap op een afwijkend pad staat. Laat leeg om uit te schakelen. Relatieve paden zoals /sitemap.xml worden ten opzichte van de start-URL omgezet.",
  ['One URL per line. Each is fetched exactly once; outlinks are NOT followed. Comments starting with # are ignored.']:
    'Eén URL per regel. Elke URL wordt precies één keer opgehaald; uitgaande links worden NIET gevolgd. Opmerkingen die met # beginnen worden genegeerd.',
  ['OS scheduler hint applied at crawl start. Lowering priority lets the rest of the machine stay responsive during heavy crawls. May require elevated privileges on some platforms.']:
    'Hint voor de OS-scheduler, toegepast bij de start van de crawl. Een lagere prioriteit houdt de rest van de machine responsief tijdens zware crawls. Kan op sommige platforms verhoogde rechten vereisen.',
  ["Page A→B declared but B→A absent flags 'Reciprocity Missing'; same lang on two hrefs flags 'Inconsistent Lang'."]:
    "Pagina A→B gedeclareerd zonder B→A markeert 'Wederkerigheid ontbreekt'; dezelfde taal bij twee hrefs markeert 'Inconsistente taal'.",
  ['Page that contains the broken link.']: 'Pagina die de verbroken link bevat.',
  ["Pages with > this many outgoing links (internal + external) trip the 'Total Links per Page' issue. Google's historic recommendation is 100; mega-menus/hub-pages routinely blow past this."]:
    "Pagina's met meer dan dit aantal uitgaande links (intern + extern) activeren het probleem 'Totaal aantal links per pagina'. Google adviseerde vroeger 100; megamenu's/hubpagina's gaan daar geregeld ruim overheen.",
  ['PASS = indexed · FAIL = not indexed · PART/NEU = discovered but not yet indexed']:
    'PASS = geïndexeerd · FAIL = niet geïndexeerd · PART/NEU = ontdekt maar nog niet geïndexeerd',
  ['Pattern: ^https://m\\.(.+) · Replacement: https://www.$1 · Flags: i  (collapse mobile subdomain to www)']:
    'Patroon: ^https://m\\.(.+) · Vervanging: https://www.$1 · Flags: i  (mobiel subdomein samenvoegen naar www)',
  ["Per-request abort threshold. Pages that take longer than this are recorded as network errors. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — that one's in seconds, this is in milliseconds."]:
    "Afbreekdrempel per verzoek. Pagina's die langer duren worden vastgelegd als netwerkfout. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — die is in seconden, deze in milliseconden.",
  ['Persist rel="nofollow" links in the link graph. When off, nofollow links are dropped entirely (not counted in outlinks, not probed as externals). Screaming Frog inverse: turning this ON ≈ unchecking "Follow Internal/External Nofollow".']:
    'rel="nofollow"-links in de linkgraaf bewaren. Indien uit worden nofollow-links volledig weggelaten (niet meegeteld bij uitgaande links, niet als externe links gecontroleerd). Omgekeerd in Screaming Frog: dit AAN zetten ≈ "Follow Internal/External Nofollow" uitvinken.',
  ['Picking a preset fills the User-Agent field below — you can still hand-edit it afterwards. Switch between Googlebot Smartphone / Desktop to compare how a site responds to mobile vs desktop crawlers.']:
    'Een voorinstelling kiezen vult het User-Agent-veld hieronder — je kunt het daarna nog handmatig aanpassen. Wissel tussen Googlebot Smartphone / Desktop om te vergelijken hoe een site reageert op mobiele vs. desktopcrawlers.',
  ["Picks one of the saved profiles by name. Empty = use the Proxy URL field above (or env vars when that's also empty)."]:
    'Kiest een van de opgeslagen profielen op naam. Leeg = het veld Proxy-URL hierboven gebruiken (of omgevingsvariabelen als dat ook leeg is).',
  ['Pre-computes Dead External Domain, Duplicate URL post-norm, Canonical Chain Multi-hop. Without this the sidebar shows 0 for those three.']:
    'Berekent vooraf Dood extern domein, Dubbele URL na normalisatie en Canonical-keten met meerdere hops. Zonder dit toont de zijbalk 0 voor die drie.',
  ["After the crawl, re-fetches a sample of indexable pages with the opposite user agent (mobile when the crawl ran as desktop, desktop otherwise) and compares title, H1, meta description, canonical, robots, word count and link count. Differences feed the 'Mobile / Desktop Mismatch' issue and the report of the same name."]:
    "Haalt na de crawl een steekproef van indexeerbare pagina's opnieuw op met de tegenovergestelde user agent (mobiel als de crawl als desktop liep, anders desktop) en vergelijkt titel, H1, metabeschrijving, canonical, robots, aantal woorden en aantal links. Verschillen voeden het probleem 'Verschil mobiel / desktop' en het gelijknamige rapport.",
  ["How many pages the mobile-parity probe re-fetches, most-linked first. 0 = every indexable HTML page (doubles the crawl's traffic for that set)."]:
    "Hoeveel pagina's de mobiele-pariteitscontrole opnieuw ophaalt, de meest gelinkte eerst. 0 = elke indexeerbare HTML-pagina (verdubbelt het crawlverkeer voor die set).",
  ["Also fetch outbound links to other hosts in full (GET); their status is checked either way, so the Broken Links view catches dead externals. HTTP authentication and custom headers are never sent to other hosts. Screaming Frog: 'External Links' (Configuration → Spider → Crawl)."]:
    "Ook uitgaande links naar andere hosts volledig ophalen (GET); hun status wordt hoe dan ook gecontroleerd, dus de weergave Verbroken links vangt dode externe links op. HTTP-authenticatie en eigen headers worden nooit naar andere hosts verzonden. Screaming Frog: 'External Links' (Configuration → Spider → Crawl).",
  ['Raw `Content-Security-Policy` response header. Empty when missing.']:
    'Ruwe `Content-Security-Policy`-responsheader. Leeg als die ontbreekt.',
  ['Raw `content` attribute of `<meta http-equiv="refresh">`, e.g. "5; url=/foo".']:
    'Ruw `content`-attribuut van `<meta http-equiv="refresh">`, bijv. "5; url=/foo".',
  ['Raw `Strict-Transport-Security` header. Empty when missing — for HTTPS pages this is a security regression.']:
    "Ruwe `Strict-Transport-Security`-header. Leeg als die ontbreekt — voor HTTPS-pagina's is dat een achteruitgang in beveiliging.",
  ['Raw `X-Content-Type-Options` header. `nosniff` blocks MIME sniffing — prevents some XSS via content-type confusion.']:
    'Ruwe `X-Content-Type-Options`-header. `nosniff` blokkeert MIME-sniffing — voorkomt bepaalde XSS via verwarring over het contenttype.',
  ['Raw `X-Frame-Options` header. SAMEORIGIN / DENY / ALLOW-FROM. Clickjacking defence.']:
    'Ruwe `X-Frame-Options`-header. SAMEORIGIN / DENY / ALLOW-FROM. Bescherming tegen clickjacking.',
  ['Raw value of the Content-Type response header (incl. charset).']:
    'Ruwe waarde van de Content-Type-responsheader (incl. charset).',
  ['Re-renders each page on a mobile viewport and checks viewport meta tag, horizontal overflow, font size legibility, and tap-target spacing. Stores a pass/fail verdict on the urls table.']:
    'Rendert elke pagina opnieuw in een mobiele viewport en controleert de viewport-metatag, horizontale overloop, leesbaarheid van de lettergrootte en de afstand tussen tikdoelen. Slaat een geslaagd/mislukt-oordeel op in de urls-tabel.',
  ['Read the full article →']: 'Lees het volledige artikel →',
  ["Reject-all = ignore Set-Cookie entirely (zero counts on cookie-flag issues). Block-third-party = analyse only first-party cookies (Domain attribute matches the page's registrable domain). Accept-all = analyse every Set-Cookie regardless of scope."]:
    'Alles weigeren = Set-Cookie volledig negeren (nul meldingen bij cookievlag-problemen). Derden blokkeren = alleen first-party cookies analyseren (het Domain-attribuut komt overeen met het registreerbare domein van de pagina). Alles accepteren = elke Set-Cookie analyseren, ongeacht het bereik.',
  ["Reject-all for stateless audits; Block-third-party to focus on the site's own cookie hygiene; Accept-all to also see ad/analytics tracker cookies."]:
    'Alles weigeren voor stateless audits; Derden blokkeren om je te richten op de cookiehygiëne van de site zelf; Alles accepteren om ook trackingcookies van advertenties/analytics te zien.',
  ["Removes the leading 'www.' from the host at normalisation time. The seen-set, redirect graph, and link extraction all use the rewritten form, so duplicates collapse correctly."]:
    "Verwijdert de voorloop-'www.' uit de host bij het normaliseren. De set geziene URL's, de doorverwijzingsgraaf en de linkextractie gebruiken allemaal de herschreven vorm, zodat duplicaten correct samenvallen.",
  ['Renders the page a second time on a mobile viewport and stores an above-the-fold PNG. Adds another full render + screenshot per URL.']:
    'Rendert de pagina een tweede keer in een mobiele viewport en slaat een PNG van het deel boven de vouw op. Voegt per URL nog een volledige rendering + screenshot toe.',
  ['Resolved absolute URL of the <img src> attribute.']:
    'Opgeloste absolute URL van het <img src>-attribuut.',
  ['Response body size in bytes (compressed transfer size, post-Content-Encoding).']:
    'Grootte van de response-body in bytes (gecomprimeerde overdrachtsgrootte, na Content-Encoding).',
  ['Rewrites http:// to https:// before fetching. Breaks HTTP-only sites.']:
    'Herschrijft http:// naar https:// vóór het ophalen. Breekt sites die alleen HTTP ondersteunen.',
  ['Run Chromium without a visible window. Turn off to debug rendering visually — useful when a page renders correctly in a normal browser but not under Playwright.']:
    'Voer Chromium uit zonder zichtbaar venster. Zet dit uit om de rendering visueel te debuggen — handig als een pagina in een gewone browser goed rendert, maar niet onder Playwright.',
  ['Run the login steps once before the crawl, then replay the session cookies on every request.']:
    'Voer de inlogstappen één keer uit vóór de crawl en stuur daarna de sessiecookies mee met elk verzoek.',
  ["Runs iterative PageRank (damping 0.85) over the internal link graph and normalises it to a 0–100 Link Score per page. Drives the Link Score column and the 'By Link Score' visualization colour mode."]:
    "Voert iteratieve PageRank (demping 0.85) uit over de interne linkgraaf en normaliseert die naar een Linkscore van 0–100 per pagina. Stuurt de kolom Linkscore en de kleurmodus 'Op linkscore' van de visualisatie aan.",
  ['Sends the URL through the same normalisation pipeline used by the crawler, with your unsaved settings applied. Useful for verifying regex rules before kicking off a crawl.']:
    'Stuurt de URL door dezelfde normalisatiepijplijn als de crawler, met je niet-opgeslagen instellingen toegepast. Handig om regex-regels te controleren voordat je een crawl start.',
  ['Sent on every request as the User-Agent header. Identifies the crawler to servers; some sites serve different content based on UA.']:
    'Wordt bij elk verzoek meegestuurd als User-Agent-header. Identificeert de crawler bij servers; sommige sites tonen andere inhoud afhankelijk van de UA.',
  ['Sent on every request. Affects which locale a multi-lingual site serves you.']:
    'Wordt bij elk verzoek meegestuurd. Bepaalt welke taalversie een meertalige site je toont.',
  ["Sent verbatim as `Bearer <token>`. Don't include the `Bearer ` prefix yourself."]:
    'Wordt letterlijk verstuurd als `Bearer <token>`. Voeg het voorvoegsel `Bearer ` niet zelf toe.',
  ['Server response time (a TTFB proxy) measured during the crawl. Pages slower than this are flagged. Google considers a good server response time under 800 ms.']:
    "Serverresponstijd (een benadering van TTFB) gemeten tijdens de crawl. Pagina's die trager zijn, worden gemarkeerd. Google beschouwt een serverresponstijd onder 800 ms als goed.",
  ['Shop the latest game keys at unbeatable prices…']:
    'Koop de nieuwste gamekeys voor onverslaanbare prijzen…',
  ["Skips body parsing for pages whose Content-Length header exceeds this. The page row is still created so links to it aren't lost; only body parsing and source snapshot capture are skipped."]:
    "Slaat het parsen van de body over voor pagina's waarvan de Content-Length-header deze waarde overschrijdt. De paginarij wordt wel aangemaakt, zodat links ernaar niet verloren gaan; alleen het parsen van de body en het vastleggen van de bron-snapshot worden overgeslagen.",
  ['Sleep this long on each worker AFTER a response completes, before it picks up the next URL. Stacks with the global RPS cap — useful for sites that rate-limit on inter-request gap rather than total throughput.']:
    'Laat elke worker zo lang wachten NADAT een response binnen is, voordat hij de volgende URL oppakt. Komt bovenop de globale RPS-limiet — handig voor sites die een snelheidslimiet hanteren op de tijd tussen verzoeken in plaats van op de totale doorvoer.',
  ['Specific reason a URL is non-indexable. For Indexable URLs this column is empty.']:
    "Specifieke reden waarom een URL niet indexeerbaar is. Voor indexeerbare URL's is deze kolom leeg.",
  ['Spider follows links from the start URL across the chosen scope. List fetches a fixed set of URLs once with no link-following. Sitemap fetches a sitemap URL and crawls every page it lists (no link-following).']:
    "Spider volgt links vanaf de start-URL binnen het gekozen bereik. Lijst haalt een vaste set URL's één keer op zonder links te volgen. Sitemap haalt een sitemap-URL op en crawlt elke pagina die erin staat (zonder links te volgen).",
  ["Spider for full site audits; List for re-checking a known set of pages; Sitemap to audit exactly what's published in sitemap.xml."]:
    "Spider voor volledige site-audits; Lijst om een bekende set pagina's opnieuw te controleren; Sitemap om precies te auditen wat in sitemap.xml is gepubliceerd.",
  ['Standard CSS selector — same syntax as `document.querySelectorAll`.']:
    'Standaard CSS-selector — dezelfde syntaxis als `document.querySelectorAll`.',
  ["Encrypted with your operating system's keychain when one is available, and left out of exported settings."]:
    'Versleuteld met de sleutelhanger van je besturingssysteem als die beschikbaar is, en weggelaten uit geëxporteerde instellingen.',
  ['Strip if your site canonicalises /foo (no slash); Add for sites that canonicalise /foo/.']:
    'Verwijderen als je site /foo (zonder slash) als canonical gebruikt; Toevoegen voor sites die /foo/ als canonical gebruiken.',
  ['Sunset over the mountain ridge']: 'Zonsondergang boven de bergkam',
  ['Surplus `@id` occurrences across all JSON-LD blocks (page declares the same `@id` more than once).']:
    'Overtollige `@id`-vermeldingen in alle JSON-LD-blokken (de pagina declareert dezelfde `@id` meer dan eens).',
  ['Terminal URL the redirect chain resolves to. Empty when this row is itself the terminal (i.e. status is 2xx/4xx/5xx) or when the chain hits a loop.']:
    'Eind-URL waar de doorverwijzingsketen op uitkomt. Leeg als deze rij zelf het eindpunt is (d.w.z. status 2xx/4xx/5xx) of als de keten in een lus belandt.',
  ["Canonical hops walked after this page (or, on a redirect row, after the redirect's final URL) until a page that canonicalises to itself. 0 when the canonical is the page itself or absent."]:
    'Aantal canonical-stappen na deze pagina (of, bij een doorverwijzingsrij, na de eind-URL van de doorverwijzing) tot een pagina die naar zichzelf canonicaliseert. 0 als de canonical de pagina zelf is of ontbreekt.',
  ['Where the canonical chain ends. Empty when the page is its own canonical, or when the chain loops.']:
    'Waar de canonical-keten eindigt. Leeg als de pagina haar eigen canonical is of als de keten een lus vormt.',
  ['text for visible content, attribute for href/src, count for occurrence count']:
    'text voor zichtbare inhoud, attribute voor href/src, count voor het aantal voorkomens',
  ['Text of the first <h1> on the page. Should match user intent and ideally complement (not duplicate) the title.']:
    'Tekst van de eerste <h1> op de pagina. Moet aansluiten bij de zoekintentie en de titel bij voorkeur aanvullen (niet herhalen).',
  ["Text Only fetches the raw HTML response as-is — fast and deterministic. Old AJAX Crawling Scheme rewrites hashbang (#!) URLs to Google's deprecated ?_escaped_fragment_= form so a pre-rendering server returns the snapshot. Full JavaScript rendering is a V2 item."]:
    "Alleen tekst haalt de ruwe HTML-response ongewijzigd op — snel en deterministisch. Het oude AJAX Crawling Scheme herschrijft hashbang-URL's (#!) naar Googles verouderde ?_escaped_fragment_=-vorm, zodat een pre-renderingserver de snapshot teruggeeft. Volledige JavaScript-rendering staat gepland voor V2.",
  ['Text Only for server-rendered / static sites; Old AJAX only for legacy hashbang SPAs.']:
    "Alleen tekst voor server-gerenderde / statische sites; Oude AJAX alleen voor verouderde hashbang-SPA's.",
  ["The column / JSON-key name for this rule's output. Free-form."]:
    'De kolom- / JSON-sleutelnaam voor de uitvoer van deze regel. Vrij in te vullen.',
  ['The fully normalised URL of the crawled resource (post URL-rewriting).']:
    'De volledig genormaliseerde URL van de gecrawlde resource (na URL-herschrijving).',
  ['The URL that fails to resolve (4xx/5xx/network error).']:
    'De URL die niet bereikbaar is (4xx/5xx/netwerkfout).',
  ['Third-party `<script>` / `<link rel=stylesheet>` references without an `integrity=` attribute. SRI is recommended for any cross-origin subresource.']:
    'Verwijzingen naar `<script>` / `<link rel=stylesheet>` van derden zonder `integrity=`-attribuut. SRI wordt aanbevolen voor elke cross-origin subresource.',
  ['Time-to-first-byte in milliseconds (network + server, excluding parse). Lower is better; >2000 ms is slow.']:
    'Time-to-first-byte in milliseconden (netwerk + server, zonder parsen). Lager is beter; >2000 ms is traag.',
  ['Total number of <h1> elements on the page. SEO best practice is exactly 1.']:
    'Totaal aantal <h1>-elementen op de pagina. SEO-best practice is precies 1.',
  ['Total number of <h2> elements on the page.']: 'Totaal aantal <h2>-elementen op de pagina.',
  ['tr,en;q=0.8 — Turkish first, English fallback.']:
    'tr,en;q=0.8 — eerst Turks, Engels als terugvaloptie.',
  ["Trips 'Folder Depth Too Deep' when the URL path's `/`-segment count exceeds this. Useful for spotting over-nested URL structures that bury content from crawlers."]:
    "Activeert 'Mapdiepte te groot' als het aantal `/`-segmenten in het URL-pad deze waarde overschrijdt. Handig om te diep geneste URL-structuren te vinden die inhoud voor crawlers verstoppen.",
  ["Trips 'Long Query String' when LENGTH(query) > this. Typical session-id sprawl + UTM tracking hits 100+ chars; over 200 starts to look like a bug."]:
    "Activeert 'Lange querystring' als LENGTH(query) > deze waarde. Wildgroei aan sessie-ID's + UTM-tracking komt vaak boven de 100 tekens; boven de 200 begint het op een bug te lijken.",
  ["Trips the 'URL Too Long' issue when LENGTH(url) > this. RFC 7230 doesn't mandate a max but most servers + middleboxes fail above ~2 KB; Chrome itself caps at ~32 KB."]:
    "Activeert het probleem 'URL te lang' als LENGTH(url) > deze waarde. RFC 7230 schrijft geen maximum voor, maar de meeste servers + middleboxes falen boven ~2 KB; Chrome zelf houdt op bij ~32 KB.",
  ["Two modes per line. (1) Wrap in slashes for a regex: /pattern/flags — supported flags imsuy (g is forced). Invalid patterns appear with count -1 in the detail panel so you can spot the typo. (2) Anything else is a literal case-insensitive substring — the legacy behaviour. Each term's per-page hit count is surfaced in the URL Details panel."]:
    'Twee modi per regel. (1) Zet de term tussen slashes voor een regex: /pattern/flags — ondersteunde flags imsuy (g wordt altijd toegepast). Ongeldige patronen verschijnen met aantal -1 in het detailpaneel, zodat je de typfout ziet. (2) Al het andere is een letterlijke, hoofdletterongevoelige substring — het oude gedrag. Het aantal treffers per pagina van elke term zie je in het paneel URL-details.',
  ['Two pages are flagged as near-duplicates if their 64-bit SimHash differs by at most this many bits — this catches near-identical copies. Text that is only largely the same is judged by the similarity threshold below. Set to 0 to skip this pass.']:
    "Twee pagina's worden als bijna-duplicaat gemarkeerd als hun 64-bits SimHash maximaal zoveel bits verschilt — zo vang je vrijwel identieke kopieën. Tekst die alleen grotendeels gelijk is, wordt beoordeeld met de gelijkenisdrempel hieronder. Zet op 0 om deze stap over te slaan.",
  ['URL declared by the first <link rel="canonical"> tag. Tells search engines which version to index when duplicates exist.']:
    'URL die is opgegeven in de eerste <link rel="canonical">-tag. Vertelt zoekmachines welke versie ze moeten indexeren als er duplicaten zijn.',
  ['URL paths ending in any of these extensions are not enqueued. Case-insensitive. Start URL is always crawled regardless.']:
    'URL-paden die op een van deze extensies eindigen, worden niet in de wachtrij gezet. Hoofdletterongevoelig. De start-URL wordt altijd gecrawld.',
  ['Value of the alt attribute. Empty cell = no alt declared (accessibility/SEO issue).']:
    'Waarde van het alt-attribuut. Lege cel = geen alt opgegeven (toegankelijkheids-/SEO-probleem).',
  ['Value of the X-Robots-Tag HTTP response header. Same semantics as meta robots but applied at the server.']:
    'Waarde van de X-Robots-Tag-HTTP-responseheader. Zelfde betekenis als meta robots, maar toegepast op de server.',
  ['Viewport height — affects above-the-fold detection and lazy-load triggers.']:
    'Viewporthoogte — beïnvloedt de detectie van inhoud boven de vouw en lazy-load-triggers.',
  ['Viewport width applied to every rendered page. Mobile audits typically use 360–414, desktop 1280–1920.']:
    'Viewportbreedte voor elke gerenderde pagina. Mobiele audits gebruiken meestal 360–414, desktop 1280–1920.',
  ['Visible body text word count (excludes <script>/<style>). Useful for identifying thin content.']:
    'Aantal woorden in de zichtbare bodytekst (zonder <script>/<style>). Handig om dunne content op te sporen.',
  ['Wait this long before the FIRST retry, doubling on each subsequent attempt (500 → 1000 → 2000 …).']:
    'Wacht zo lang vóór de EERSTE nieuwe poging en verdubbel dat bij elke volgende poging (500 → 1000 → 2000 …).',
  ["Walks 3xx redirect chains, fills `redirect_chain_length` / `redirect_loop`. Drives the 'Long Chain' and 'Redirect Loop' issues + the Redirects tab."]:
    "Volgt 3xx-doorverwijzingsketens en vult `redirect_chain_length` / `redirect_loop`. Stuurt de problemen 'Lange keten' en 'Doorverwijzingslus' aan + het tabblad Doorverwijzingen.",
  ['Welcome to Example Store']: 'Welkom bij Voorbeeldwinkel',
  ['What to do when multiple matches exist.']:
    'Wat er moet gebeuren als er meerdere overeenkomsten zijn.',
  ['What to read off each matched element. Ignored for an XPath `/@attr` or `/text()` terminal — that value is used directly.']:
    'Wat er van elk gevonden element wordt uitgelezen. Genegeerd bij een XPath die eindigt op `/@attr` of `/text()` — die waarde wordt direct gebruikt.',
  ['When non-empty, ALL query parameters not on this list are dropped during normalisation (case-insensitive name match). Leave empty to keep the default behaviour, which strips just utm_*, fbclid, gclid, mc_cid, and mc_eid.']:
    'Als dit niet leeg is, worden ALLE queryparameters die niet op deze lijst staan bij het normaliseren verwijderd (naam hoofdletterongevoelig vergeleken). Laat leeg voor het standaardgedrag, dat alleen utm_*, fbclid, gclid, mc_cid en mc_eid verwijdert.',
  ['When off, no budget evaluation runs and the verdict column is cleared. When on, the post-crawl pass scores every internal 200 HTML page against the ceilings below.']:
    'Indien uit, wordt er geen budget beoordeeld en wordt de oordeelkolom gewist. Indien aan, toetst de stap na de crawl elke interne 200-HTML-pagina aan de onderstaande maxima.',
  ['When on (default), pagination_next + pagination_prev URLs are post-fetch enqueued. Off only to debug pagination-only loops without disabling all link follow.']:
    "Indien aan (standaard), worden pagination_next- + pagination_prev-URL's na het ophalen in de wachtrij gezet. Zet alleen uit om lussen in paginering te debuggen zonder het volgen van alle links uit te schakelen.",
  ['When ON (default), the Duplicate URL filter compares URLs after lowercasing the whole URL (host and path), dropping the query string, and trimming the trailing slash — case variants such as /Page and /page count as duplicates. When OFF, comparison is byte-exact, so the filter only fires on rows that share an identical raw URL string (rare since URLs are deduped at insert time).']:
    "Indien AAN (standaard), vergelijkt het filter Duplicaat-URL de URL's nadat de hele URL (host en pad) naar kleine letters is omgezet, de querystring is verwijderd en de afsluitende slash is weggehaald — hoofdlettervarianten zoals /Page en /page tellen als duplicaat. Indien UIT, is de vergelijking byte-exact, dus het filter slaat alleen aan op rijen met een identieke ruwe URL-string (zeldzaam, omdat URL's bij het invoegen al worden ontdubbeld).",
  ["When on, `<meta http-equiv='refresh'>` content URLs are enqueued like a redirect target. window.location body redirects are heuristic-only and currently out of scope."]:
    "Indien aan, worden content-URL's van `<meta http-equiv='refresh'>` in de wachtrij gezet als doorverwijzingsdoel. Doorverwijzingen via window.location in de body zijn alleen heuristisch te herkennen en vallen momenteel buiten het bereik.",
  ['When on, a 200 page declaring a canonical pointing elsewhere also enqueues that target, so a canonical pointing at a missing or redirected page is caught. Default on.']:
    'Indien aan, zet een 200-pagina met een canonical die elders naartoe wijst ook dat doel in de wachtrij, zodat een canonical naar een ontbrekende of doorverwezen pagina wordt opgemerkt. Standaard aan.',
  ['When on, pages with noindex / canonicalised / robots-blocked indexability are excluded from clustering — the Near-Duplicate report then surfaces only issues that affect search visibility.']:
    "Indien aan, worden pagina's die noindex, gecanonicaliseerd of door robots geblokkeerd zijn uitgesloten van clustering — het rapport Bijna-duplicaten toont dan alleen problemen die de zichtbaarheid in zoekmachines raken.",
  ["When on, rel=nofollow links are recursed into like any other link. Default off — Screaming Frog 'Respect Nofollow' default."]:
    "Indien aan, worden rel=nofollow-links gevolgd zoals elke andere link. Standaard uit — de standaard 'Respect Nofollow' van Screaming Frog.",
  ['When Playwright considers navigation complete. domcontentloaded = HTML parsed but resources still loading. load = window.load fired. networkidle = no network activity for 500ms (best for SPA but slower). commit = just response committed (fastest, riskiest).']:
    "Wanneer Playwright de navigatie als voltooid beschouwt. domcontentloaded = HTML geparst, maar resources worden nog geladen. load = window.load is afgevuurd. networkidle = 500ms geen netwerkactiviteit (het best voor SPA's, maar trager). commit = alleen de response is vastgelegd (snelst, riskantst).",
  ['Whether the broken target is on the same site (internal) or a different host (external).']:
    'Of het kapotte doel op dezelfde site staat (intern) of op een andere host (extern).',
  ['Whether the URL is eligible to appear in search results. Combines status code, robots directives, canonical, and meta-refresh signals.']:
    'Of de URL in zoekresultaten kan verschijnen. Combineert statuscode, robots-richtlijnen, canonical en meta-refresh-signalen.',
  ['Width attribute value (in pixels) declared on the <img> tag, when present.']:
    'Waarde van het width-attribuut (in pixels) op de <img>-tag, indien aanwezig.',
  ['XPath 1.0 subset over the parsed DOM. End in `/@attr` or `/text()` to read an attribute / text node. Predicates: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.']:
    'XPath 1.0-subset over de geparste DOM. Eindig op `/@attr` of `/text()` om een attribuut / tekstnode uit te lezen. Predicaten: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.',
  ['Y when the page declares hreflang alternates but no entry whose `href` matches the page URL. Google requires a self-reference.']:
    'Y als de pagina hreflang-alternatieven declareert, maar geen vermelding waarvan de `href` overeenkomt met de pagina-URL. Google vereist een zelfverwijzing.',
  ['Y when the redirect chain originating at this URL contains a cycle (A → B → A) detected by the cycle-safe walker; the chain is otherwise unwalked.']:
    'Y als de doorverwijzingsketen vanaf deze URL een cyclus bevat (A → B → A), gedetecteerd door de cyclusveilige walker; de keten wordt verder niet gevolgd.',
  ['Y when this URL belongs to a paginated cluster whose ordinal sequence has a gap (e.g. ?page=1, 2, 4 — page 3 missing). Set by the post-crawl `recomputePaginationSequence` pass.']:
    'Y als deze URL hoort bij een gepagineerde cluster waarvan de volgorde een gat heeft (bijv. ?page=1, 2, 4 — pagina 3 ontbreekt). Ingesteld door de stap `recomputePaginationSequence` na de crawl.',
  ['SQL injection — the request tries to smuggle SQL into a parameter (UNION SELECT, sleep(), error-based functions) to read or alter your database.']:
    'SQL-injectie — het verzoek probeert SQL in een parameter te smokkelen (UNION SELECT, sleep(), foutgebaseerde functies) om je database te lezen of te wijzigen.',
  ['Cross-site scripting — the request carries script markup or a javascript: URL in a parameter, hoping the page echoes it back into the HTML unescaped.']:
    'Cross-site scripting — het verzoek bevat scriptmarkup of een javascript:-URL in een parameter, in de hoop dat de pagina die ongeëscaped terug in de HTML zet.',
  ['Path traversal — the request walks out of the web root with ../ or encoded variants to reach files like /etc/passwd or win.ini.']:
    'Path traversal — het verzoek ontsnapt uit de webroot met ../ of gecodeerde varianten om bestanden als /etc/passwd of win.ini te bereiken.',
  ['Command injection — the request appends shell syntax (;, |, backticks, $( )) to a parameter to run commands on the server.']:
    'Commando-injectie — het verzoek voegt shell-syntaxis (;, |, backticks, $( )) toe aan een parameter om opdrachten op de server uit te voeren.',
  ['Scanner probe — an automated vulnerability scanner walking a wordlist of known admin panels, installers and exploit paths (wp-login, phpmyadmin, /actuator, shell uploads). Not tailored to your site; it hits everyone.']:
    'Scannerprobe — een geautomatiseerde kwetsbaarheidsscanner die een woordenlijst afloopt van bekende beheerpanelen, installers en exploitpaden (wp-login, phpmyadmin, /actuator, shell-uploads). Niet op jouw site gericht; iedereen krijgt dit.',
  ['Sensitive file fetch — a direct request for something that must never be public: .env, .git, backups, SQL dumps, private keys, config files.']:
    'Opvragen van gevoelige bestanden — een direct verzoek om iets dat nooit openbaar mag zijn: .env, .git, back-ups, SQL-dumps, privésleutels, configuratiebestanden.',
  ['Anomaly — malformed or evasive input (null bytes, CRLF injection, over-encoding, absurd parameter lengths) that matches no single attack class but is not a normal browser request.']:
    'Anomalie — misvormde of ontwijkende invoer (null-bytes, CRLF-injectie, overmatige codering, absurde parameterlengtes) die bij geen enkele aanvalsklasse past, maar geen normaal browserverzoek is.',
  ['Sum of the weights of every attack signature the request matched. Each signature carries a weight by how conclusive it is (a UNION SELECT weighs 9, a stray quote 2), and a line is only flagged once the total reaches 5 — so one decisive pattern flags on its own, while weak hints have to add up. Higher score = less room for a false positive; sort by it to triage.']:
    'Som van de gewichten van alle aanvalssignaturen waarmee het verzoek overeenkwam. Elke signatuur heeft een gewicht naar hoe overtuigend ze is (een UNION SELECT weegt 9, een losse quote 2), en een regel wordt pas gemarkeerd als het totaal 5 bereikt — één doorslaggevend patroon markeert dus op zichzelf, terwijl zwakke aanwijzingen moeten optellen. Hogere score = minder kans op een fout-positief; sorteer erop om te triëren.',
  ['Which attack class the strongest matching signature belongs to: SQL injection, XSS, path traversal, command injection, scanner probe, sensitive file, or anomaly. Hover any badge in this column for what that class means in practice.']:
    'Tot welke aanvalsklasse de sterkste overeenkomende signatuur behoort: SQL-injectie, XSS, path traversal, commando-injectie, scannerprobe, gevoelig bestand of anomalie. Beweeg de muis over een badge in deze kolom om te zien wat die klasse in de praktijk betekent.',
  ["Filters on the Status column — the most recent response the log recorded for that path. The analyzer keeps one status per URL rather than a full distribution, so this answers 'what is this URL returning now'. Paths whose status could not be parsed are hidden while a class is selected."]:
    "Filtert op de kolom Status — de meest recente response die het log voor dat pad heeft vastgelegd. De analyzer bewaart één status per URL in plaats van een volledige verdeling, dus dit beantwoordt 'wat geeft deze URL nu terug'. Paden waarvan de status niet kon worden geparst, worden verborgen zolang een klasse is geselecteerd.",
  ['Most recent HTTP status the log recorded for this path. One value per URL, not a distribution — a path that returned 200 all week and 404 this morning shows 404.']:
    'Meest recente HTTP-status die het log voor dit pad heeft vastgelegd. Eén waarde per URL, geen verdeling — een pad dat de hele week 200 gaf en vanochtend 404, toont 404.',
  ['A URL whose path repeats the same segment this many times or more (/shop/shop/shop/…) is treated as a link loop and skipped. This shape comes from a relative-href bug and has no legitimate counterpart. Skipped counts are reported when the crawl finishes.']:
    "Een URL waarvan het pad hetzelfde segment zo vaak of vaker herhaalt (/shop/shop/shop/…), wordt als linklus behandeld en overgeslagen. Deze vorm komt voort uit een bug met relatieve href's en heeft geen legitieme tegenhanger. Het aantal overgeslagen URL's wordt gemeld als de crawl klaar is.",
  ['3 is safe for every site; raise to 4–5 only if a real path legitimately repeats a segment; 0 disables the guard.']:
    '3 is veilig voor elke site; verhoog naar 4–5 alleen als een echt pad terecht een segment herhaalt; 0 schakelt de beveiliging uit.',
  ['URLs with more query parameters than this are flagged as faceted-navigation traps under Issues → URL → Crawl Trap. Detection only — the URLs are still crawled, because legitimate filter pages look the same.']:
    "URL's met meer queryparameters dan dit worden gemarkeerd als facetnavigatieval onder Problemen → URL → Crawlval. Alleen detectie — de URL's worden nog steeds gecrawld, omdat legitieme filterpagina's er hetzelfde uitzien.",
  ['4 surfaces most faceted-nav explosions; 0 disables the check.']:
    '4 brengt de meeste explosies van facetnavigatie aan het licht; 0 schakelt de controle uit.',
  ["Honor Allow / Disallow rules declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "Respecteer de Allow-/Disallow-regels in /robots.txt voor de ingestelde User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt).",
  ["Honor a Crawl-delay directive as a global rate limit (one request every N seconds). Crawl-delay is not part of RFC 9309 — Google ignores it and Screaming Frog does not implement it — and published values are often stale: 'Crawl-delay: 30' turns a 500-URL crawl into hours. Ignored by default; the directive is still reported in the log when found."]:
    "Respecteer een Crawl-delay-richtlijn als globale snelheidslimiet (één verzoek per N seconden). Crawl-delay maakt geen deel uit van RFC 9309 — Google negeert het en Screaming Frog implementeert het niet — en gepubliceerde waarden zijn vaak verouderd: 'Crawl-delay: 30' maakt van een crawl van 500 URL's een kwestie van uren. Standaard genegeerd; de richtlijn wordt wel in het log gemeld als die wordt gevonden.",
  ['Off (default) for normal audits. On when an ops policy requires it — expect the crawl to take Crawl-delay seconds per URL.']:
    'Uit (standaard) voor normale audits. Aan als een operationeel beleid het vereist — reken erop dat de crawl Crawl-delay seconden per URL duurt.',
  ['Crawl fetches internal <img> targets so each appears in the Internal tab with status, content type, and size — every one counts toward Max URLs. Store keeps the <img> declarations in the Images tab, which works even with Crawl off: you get the full image inventory with alt text for the cost of zero extra requests.']:
    "Crawlen haalt interne <img>-doelen op, zodat elk ervan in het tabblad Intern verschijnt met status, contenttype en grootte — elk telt mee voor Max. URL's. Opslaan bewaart de <img>-declaraties in het tabblad Afbeeldingen, wat ook werkt met Crawlen uit: je krijgt de volledige afbeeldingsinventaris met alt-tekst zonder één extra verzoek.",
  ["Also fetch the extra sizes an <img> lists in srcset / <picture> — the 300×169, 768×432… copies WordPress and most CDNs generate. Off: only the image's own src is requested and measured; the variants are still listed in the Images tab. One blog went from 2,300 to 41,600 image requests with this on."]:
    "Haal ook de extra formaten op die een <img> vermeldt in srcset / <picture> — de kopieën van 300×169, 768×432… die WordPress en de meeste CDN's genereren. Uit: alleen de eigen src van de afbeelding wordt opgevraagd en gemeten; de varianten staan nog wel in het tabblad Afbeeldingen. Eén blog ging hiermee van 2.300 naar 41.600 afbeeldingsverzoeken.",
  ['Leave off unless you audit responsive image sets for broken or oversized sizes.']:
    'Laat uit, tenzij je responsieve afbeeldingssets controleert op kapotte of te grote formaten.',
  ['Store on, Crawl off is the cheap alt-text audit. Both on for a full image health check.']:
    'Opslaan aan, Crawlen uit is de goedkope alt-tekstaudit. Beide aan voor een volledige gezondheidscheck van afbeeldingen.',
  ['<video> / <audio> and the <source> children they own. Off by default — media files are large and rarely what an SEO crawl is looking for.']:
    '<video> / <audio> en hun <source>-kinderen. Standaard uit — mediabestanden zijn groot en zelden waar een SEO-crawl naar zoekt.',
  ['On when auditing a video-heavy site for dead media URLs.']:
    "Aan als je een site met veel video controleert op dode media-URL's.",
  ["<link rel=stylesheet> targets. Crawling a stylesheet is also what discovers the web fonts and background images declared inside it via @font-face / url() — so Crawl on with Store off still populates the Internal tab's Font filter without listing every stylesheet."]:
    '<link rel=stylesheet>-doelen. Door een stylesheet te crawlen worden ook de webfonts en achtergrondafbeeldingen gevonden die erin zijn gedeclareerd via @font-face / url() — dus Crawlen aan met Opslaan uit vult nog steeds het filter Lettertype in het tabblad Intern, zonder elke stylesheet te tonen.',
  ['Crawl on, Store off when you want fonts discovered but not hundreds of CSS rows.']:
    'Crawlen aan, Opslaan uit als je lettertypen wilt vinden zonder honderden CSS-rijen.',
  ['<script src> targets, fetched so each gets its own row with status code, content type, and size. Headers only — the body is discarded, never executed.']:
    '<script src>-doelen, opgehaald zodat elk een eigen rij krijgt met statuscode, contenttype en grootte. Alleen headers — de body wordt weggegooid en nooit uitgevoerd.',
  ['Both on to catch 404ing bundles; both off for HTML-only crawls.']:
    'Beide aan om bundles met een 404 te vangen; beide uit voor crawls van alleen HTML.',
  ['<a href> targets on the same site. Crawl off turns the run into an audit of a fixed set of pages — sitemaps, canonicals, and the other declared alternates below still feed discovery. Store off empties the link graph: inlinks, outlinks, anchor-text reports, and link score all go with it.']:
    "<a href>-doelen op dezelfde site. Met Crawlen uit wordt de run een audit van een vaste set pagina's — sitemaps, canonicals en de andere opgegeven alternatieven hieronder voeden nog steeds de ontdekking. Met Opslaan uit blijft de linkgraaf leeg: inkomende links, uitgaande links, ankertekstrapporten en linkscore verdwijnen allemaal.",
  ['Leave both on. Crawl off only when a sitemap or URL list already defines the exact set you want.']:
    'Laat beide aan. Zet Crawlen alleen uit als een sitemap of URL-lijst al precies de set bepaalt die je wilt.',
  ['Outbound links to other hosts are always status-checked (one HEAD each) so Broken Links catches dead externals — that does not depend on this row. Crawl here means fully crawling those pages, following their links onward too. Store keeps outbound links in the link graph.']:
    "Van uitgaande links naar andere hosts wordt altijd de status gecontroleerd (één HEAD per link), zodat Kapotte links dode externe links vindt — dat staat los van deze rij. Crawlen betekent hier dat die pagina's volledig worden gecrawld, inclusief het verder volgen van hun links. Opslaan bewaart uitgaande links in de linkgraaf.",
  ['Crawl off (default) — status-check externals without spidering the whole web.']:
    'Crawlen uit (standaard) — controleer de status van externe links zonder het hele web af te spideren.',
  ['<link rel=canonical> and its HTTP Link: header form. Crawl also enqueues the canonical target, treating it as a navigation hint. Store feeds the Canonicals tab and every canonical issue filter.']:
    '<link rel=canonical> en de vorm als HTTP Link:-header. Crawlen zet ook het canonical-doel in de wachtrij en behandelt het als navigatiehint. Opslaan voedt het tabblad Canonicals en elk canonical-probleemfilter.',
  ['Crawl on (default) — a canonical pointing at a missing or redirected page is caught. Store on.']:
    'Crawlen aan (standaard) — een canonical naar een ontbrekende of doorverwezen pagina wordt opgemerkt. Opslaan aan.',
  ['<link rel=next> / <link rel=prev>. Part of the standard discovery graph; turn Crawl off to isolate a pagination loop without disabling link-following everywhere.']:
    '<link rel=next> / <link rel=prev>. Onderdeel van de standaard ontdekkingsgraaf; zet Crawlen uit om een pagineringslus te isoleren zonder het volgen van links overal uit te schakelen.',
  ['Both on unless you are debugging an infinite paginated series.']:
    'Beide aan, tenzij je een oneindige gepagineerde reeks debugt.',
  ['<link rel=alternate hreflang>. Crawl enqueues every declared alternate, which is how you reach language versions nothing links to. Store feeds the Hreflang tab and the reciprocity / invalid-code audits.']:
    '<link rel=alternate hreflang>. Crawlen zet elk opgegeven alternatief in de wachtrij — zo bereik je taalversies waar niets naar linkt. Opslaan voedt het tabblad Hreflang en de audits op wederkerigheid / ongeldige codes.',
  ['Crawl on for a multi-language audit — otherwise unlinked locales stay invisible.']:
    'Crawlen aan voor een meertalige audit — anders blijven niet-gelinkte taalversies onzichtbaar.',
  ['<link rel=amphtml>. Crawl fetches the AMP variant as its own URL; Store keeps the declaration plus the AMP smoke-validator findings.']:
    '<link rel=amphtml>. Crawlen haalt de AMP-variant op als aparte URL; Opslaan bewaart de declaratie plus de bevindingen van de AMP-snelvalidator.',
  ['Crawl on only if the site still ships AMP pages.']:
    "Crawlen alleen aan als de site nog AMP-pagina's levert.",
  ['<meta http-equiv="refresh">. Crawl enqueues the parsed target like a redirect; Store keeps the raw directive and its URL for the Meta Refresh tab.']:
    '<meta http-equiv="refresh">. Crawlen zet het geparste doel in de wachtrij als een doorverwijzing; Opslaan bewaart de ruwe richtlijn en de URL ervan voor het tabblad Meta Refresh.',
  ['Crawl on when auditing a legacy site that still redirects this way.']:
    'Crawlen aan bij een audit van een oudere site die nog op deze manier doorverwijst.',
  ["<iframe src> documents. Crawl fetches each embedded page as its own URL, which can pull in a lot of third-party surface. Store records them in the link graph so a dead embed shows up in Outlinks and Broken Links — without counting toward the page's outlink total, since an embed is not a hyperlink."]:
    '<iframe src>-documenten. Crawlen haalt elke ingesloten pagina op als aparte URL, wat veel inhoud van derden kan binnenhalen. Opslaan legt ze vast in de linkgraaf, zodat een dode embed verschijnt in Uitgaande links en Kapotte links — zonder mee te tellen voor het totaal aantal uitgaande links van de pagina, want een embed is geen hyperlink.',
  ['Store on, Crawl off is usually the right pair.']:
    'Opslaan aan, Crawlen uit is meestal de juiste combinatie.',
  ['The separate-URL (m-dot) mobile version: <link rel="alternate" media="only screen and (max-width: …)">. Null on responsive sites, which is most of them — a value here with no reciprocal canonical back is the classic broken m-dot setup.']:
    'De mobiele versie op een aparte URL (m-dot): <link rel="alternate" media="only screen and (max-width: …)">. Leeg op responsieve sites, en dat zijn de meeste — een waarde hier zonder wederkerige canonical terug is de klassieke kapotte m-dot-opzet.',
  ['Crawl on only when the site really does serve a separate mobile host.']:
    'Crawlen alleen aan als de site echt een aparte mobiele host gebruikt.',
  ["Links a search engine cannot follow: <a> with no href but an onclick, href=\"javascript:…\", href=\"#\" placeholders wired to a handler, an href on a non-link element such as <span> or <div>, and non-link elements whose onclick navigates. Store-only — an uncrawlable link is by definition never fetched. Each one appears under Outlinks as Uncrawlable; the internal ones drive the JS-Only Navigation issue filter."]:
    "Links die een zoekmachine niet kan volgen: <a> zonder href maar met een onclick, href=\"javascript:…\", href=\"#\"-placeholders gekoppeld aan een handler, een href op een element dat geen link is, zoals <span> of <div>, en zulke elementen waarvan de onclick naar een andere pagina gaat. Alleen Opslaan — een niet-crawlbare link wordt per definitie nooit opgehaald. Elke link staat onder Uitgaande links als Niet crawlbaar; de interne sturen het probleemfilter Navigatie alleen via JS aan.",
  ["On — recording them costs almost nothing."]: "Aan — ze vastleggen kost vrijwel niets.",
  ['With a Subfolder-scoped crawl, links pointing outside the start folder are fetched once so their status code is known, then stopped — they are checked, not crawled through. Off leaves them undiscovered entirely.']:
    'Bij een crawl met bereik Submap worden links naar buiten de startmap één keer opgehaald, zodat hun statuscode bekend is, en daarna gestopt — ze worden gecontroleerd, niet doorgecrawld. Uit laat ze volledig onontdekt.',
  ['On — knowing a link out of /blog/ is a 404 costs one request.']:
    'Aan — weten dat een link buiten /blog/ een 404 is, kost één verzoek.',
  ["Off restricts the crawl to URLs under the start URL's path (Crawl Scope = Subfolder). On lets it cover the whole host. This is a view of the Crawl Scope setting, not a separate switch, so the two can never disagree."]:
    "Uit beperkt de crawl tot URL's onder het pad van de start-URL (Crawlbereik = Submap). Aan laat hem de hele host bestrijken. Dit is een weergave van de instelling Crawlbereik, geen aparte schakelaar, dus de twee kunnen elkaar nooit tegenspreken.",
  ['Off to audit just /blog/; on for the whole site.']:
    'Uit om alleen /blog/ te auditen; aan voor de hele site.',
  ['Treats every host sharing the registrable domain as internal — shop.example.com and blog.example.com crawl alongside example.com instead of counting as external. Another view of the Crawl Scope setting.']:
    'Behandelt elke host met hetzelfde registreerbare domein als intern — shop.example.com en blog.example.com worden samen met example.com gecrawld in plaats van als extern te tellen. Nog een weergave van de instelling Crawlbereik.',
  ['On when subdomains are part of the same property.']:
    'Aan als subdomeinen bij dezelfde property horen.',
  ['Crawl through rel="nofollow" links pointing at the same site. Off (default) is Screaming Frog "Respect Nofollow" behaviour. Internal and external are separate switches because sites nofollow them for opposite reasons — crawl-budget shaping vs. not vouching for a third party.']:
    'Crawl via rel="nofollow"-links die naar dezelfde site wijzen. Uit (standaard) is het gedrag van "Respect Nofollow" in Screaming Frog. Intern en extern zijn aparte schakelaars, omdat sites ze om tegengestelde redenen op nofollow zetten — crawlbudget sturen tegenover niet instaan voor een derde partij.',
  ['On when a site nofollows its own faceted navigation and you need behind it.']:
    'Aan als een site haar eigen facetnavigatie op nofollow zet en je erachter moet kijken.',
  ['Crawl through rel="nofollow" links pointing at other hosts. Only has an effect while External Links → Crawl is on.']:
    'Crawl via rel="nofollow"-links die naar andere hosts wijzen. Heeft alleen effect als Externe links → Crawlen aan staat.',
  ['Off — nofollowed externals are exactly the ones you did not vouch for.']:
    'Uit — externe nofollow-links zijn precies die waar je niet voor instaat.',
  ['Record hrefs that cannot be parsed as a URL — unencoded whitespace inside the authority, doubled schemes, stray delimiters. They can never resolve to a crawled page, so every one is reported in Broken Links, which is the point. Deliberate non-navigable schemes (mailto:, tel:, #) are not malformed and never appear.']:
    "Leg href's vast die niet als URL te parsen zijn — niet-gecodeerde spaties in de authority, dubbele schemes, losse scheidingstekens. Ze kunnen nooit naar een gecrawlde pagina leiden, dus elk ervan wordt gemeld in Kapotte links, en daar gaat het juist om. Bewust niet-navigeerbare schemes (mailto:, tel:, #) zijn niet misvormd en verschijnen nooit.",
  ['On when hunting hand-written markup errors; off keeps Broken Links focused on real 404s.']:
    "Aan als je jaagt op handgeschreven markupfouten; uit houdt Kapotte links gericht op echte 404's.",
  ['Off drops every discovered URL carrying a `?`, before robots and before a request goes out. That is the cheap way to stop a faceted navigation (?color=red&size=xl&sort=price) from spending the whole URL budget on one product listing wearing a thousand URLs. The start URL is always crawled, and subresources are exempt — style.css?v=7 is a cache-buster, not a facet. Skipped URLs are counted and reported in the log, never dropped silently.']:
    "Uit laat elke gevonden URL met een `?` vallen, nog vóór robots en voordat er een verzoek uitgaat. Zo voorkom je goedkoop dat een facetnavigatie (?color=red&size=xl&sort=price) het hele URL-budget opmaakt aan één productoverzicht dat zich in duizend URL's hult. De start-URL wordt altijd gecrawld en subresources zijn uitgezonderd — style.css?v=7 is een cache-buster, geen facet. Overgeslagen URL's worden geteld en in het log gemeld, nooit stilletjes weggegooid.",
  ['On (default). Off for a first pass over a shop with faceted filters.']:
    'Aan (standaard). Uit voor een eerste ronde over een webshop met facetfilters.',
  ['Parameter names that keep a URL in the crawl anyway — pagination, a language switch, a product id. Names only; values are not looked at, and matching ignores case. A URL is admitted only when every parameter it carries is on this list: ?page=2 passes, ?page=2&color=red does not. Any-match would defeat the point, since a facet URL nearly always carries the pagination parameter too.']:
    'Parameternamen die een URL toch in de crawl houden — paginering, een taalwissel, een product-ID. Alleen namen; waarden worden niet bekeken en hoofdletters worden genegeerd. Een URL wordt alleen toegelaten als elke parameter erin op deze lijst staat: ?page=2 komt erdoor, ?page=2&color=red niet. Eén overeenkomst laten volstaan zou het doel ondermijnen, want een facet-URL bevat bijna altijd ook de pagineringsparameter.',
  ['page, lang — keeps paginated archives reachable while the facets stay out.']:
    'page, lang — houdt gepagineerde archieven bereikbaar terwijl de facetten buiten blijven.',
  ['Auto-discovery on its own only records sitemap entries, which is what the sitemap issue filters compare the crawl against. Turning this on crawls them too — and that is what surfaces orphans: pages the sitemap declares but nothing on the site links to.']:
    "Automatische detectie legt op zichzelf alleen sitemap-vermeldingen vast; daarmee vergelijken de sitemap-probleemfilters de crawl. Zet je dit aan, dan worden ze ook gecrawld — en zo komen weespagina's boven: pagina's die in de sitemap staan, maar waar niets op de site naar linkt.",
  ['On for an orphan-page audit.']: "Aan voor een audit van weespagina's.",
  ['Reads Sitemap: directives from /robots.txt plus the conventional /sitemap.xml fallbacks at crawl start. Cheap I/O, and it powers every sitemap issue filter.']:
    'Leest bij de start van de crawl Sitemap:-richtlijnen uit /robots.txt plus de gebruikelijke /sitemap.xml-terugvallocaties. Weinig I/O, en het voedt elk sitemap-probleemfilter.',
  ['On (default).']: 'Aan (standaard).',
  ['Explicit sitemap URLs, one per line. Their entries are always both recorded and queued as crawl seeds — use this when the sitemap lives somewhere robots.txt never mentions. Relative paths such as /sitemap.xml are resolved against the start URL.']:
    "Expliciete sitemap-URL's, één per regel. Hun vermeldingen worden altijd vastgelegd én als startpunten in de wachtrij gezet — gebruik dit als de sitemap ergens staat die robots.txt nooit noemt. Relatieve paden zoals /sitemap.xml worden opgelost ten opzichte van de start-URL.",
  ['Treat the concurrency and RPS above as a ceiling and let the target server set the real pace. On a 429/503 (or a Retry-After header) the crawler pauses for the penalty window and steps the rate + concurrency down; after a sustained run of clean responses it grows them back toward the ceiling. Off = hold the configured rate no matter how the server responds.']:
    'Behandel de gelijktijdigheid en RPS hierboven als plafond en laat de doelserver het echte tempo bepalen. Bij een 429/503 (of een Retry-After-header) pauzeert de crawler gedurende de strafperiode en verlaagt hij snelheid + gelijktijdigheid stapsgewijs; na een aanhoudende reeks probleemloze responses bouwt hij ze weer op richting het plafond. Uit = het ingestelde tempo aanhouden, hoe de server ook reageert.',
  ['Turn on for sites behind Cloudflare / a WAF that returns 429s; leave off for your own infrastructure where the fixed rate is safe.']:
    "Zet aan voor sites achter Cloudflare / een WAF die 429's teruggeeft; laat uit voor je eigen infrastructuur, waar het vaste tempo veilig is.",
  ['Sorts query parameters alphabetically at normalisation time. Repeated keys keep their relative order, so ?tag=a&tag=b is preserved. Without this the two orderings occupy separate rows and read as duplicates.']:
    'Sorteert queryparameters alfabetisch bij het normaliseren. Herhaalde sleutels behouden hun onderlinge volgorde, dus ?tag=a&tag=b blijft behouden. Zonder dit nemen de twee volgordes aparte rijen in en lijken ze duplicaten.',
  ['On for most sites; off if your server routes on positional parameter order.']:
    'Aan voor de meeste sites; uit als je server routeert op basis van de volgorde van parameters.',
  ['Collapses runs of slashes in the path to a single slash. Applied before the trailing-slash policy. Web servers serve these identically, so the duplicate-slash variant is normally a false duplicate.']:
    'Voegt reeksen slashes in het pad samen tot één slash. Wordt toegepast vóór het beleid voor de afsluitende slash. Webservers leveren deze identiek, dus de variant met dubbele slash is normaal gesproken een vals duplicaat.',
  ['On if a template bug emits //  in links; off if your framework uses empty path segments as data.']:
    'Aan als een templatebug //  in links zet; uit als je framework lege padsegmenten als data gebruikt.',
  ["Off by default: verify the login page's TLS certificate before typing credentials into it. Enable only for a trusted internal host with a self-signed certificate — an unverifiable certificate on a login page is a man-in-the-middle risk."]:
    'Standaard uit: het TLS-certificaat van de inlogpagina wordt gecontroleerd voordat er inloggegevens worden ingevuld. Schakel alleen in voor een vertrouwde interne host met een zelfondertekend certificaat — een niet-verifieerbaar certificaat op een inlogpagina is een man-in-the-middle-risico.',
  ["Hooks the History API before the page's own scripts run, so routes an SPA reaches via pushState / replaceState / popstate are discovered and crawled. Also keeps hash routes (#/about) as distinct URLs instead of collapsing them onto the shell document."]:
    "Haakt in op de History API voordat de eigen scripts van de pagina draaien, zodat routes die een SPA via pushState / replaceState / popstate bereikt, worden ontdekt en gecrawld. Houdt ook hash-routes (#/about) als afzonderlijke URL's, in plaats van ze samen te voegen met het shell-document.",
  ['On for React Router / Vue Router / Angular sites whose pages never produce a document request.']:
    "Aan voor sites met React Router / Vue Router / Angular waarvan de pagina's nooit een documentverzoek veroorzaken.",
  ['`<link rel="alternate" media="only screen and (max-width: …)" href="…">` value — the separate-URL (m-dot) mobile version of this page. Empty on responsive sites, which is most of them. A value here with no reciprocal canonical pointing back is the classic broken m-dot setup.']:
    'Waarde van `<link rel="alternate" media="only screen and (max-width: …)" href="…">` — de mobiele versie van deze pagina op een aparte URL (m-dot). Leeg op responsieve sites, en dat zijn de meeste. Een waarde hier zonder wederkerige canonical die terugverwijst, is de klassieke kapotte m-dot-opzet.',
  ['Two pages are clustered as near-duplicates when their main-content text is at least this similar, word for word. Estimated with MinHash over 3-word shingles, so it catches posts that were rewritten or lightly edited — not only identical copies. Set to 0 to skip this pass.']:
    "Twee pagina's worden als bijna-duplicaat geclusterd als de tekst van hun hoofdinhoud minstens zo gelijk is, woord voor woord. Geschat met MinHash over shingles van 3 woorden, dus het vangt ook herschreven of licht bewerkte berichten — niet alleen identieke kopieën. Zet op 0 om deze stap over te slaan.",
  ["Language the page's main-content text is written in, read from its wording rather than the lang attribute. Compared with html[lang] for the 'Lang ≠ Content Language' check. Empty when the text is too short or the language can't be told with confidence."]:
    "Taal waarin de hoofdinhoud van de pagina is geschreven, afgeleid uit de tekst zelf in plaats van uit het lang-attribuut. Vergeleken met html[lang] voor de controle 'Lang ≠ inhoudstaal'. Leeg als de tekst te kort is of de taal niet met zekerheid te bepalen is.",
  ["Character encoding named by the Content-Type response header, as a canonical encoding name. Browsers obey it over the page's own declaration."]:
    'Tekencodering die de Content-Type-responseheader noemt, als canonieke coderingsnaam. Browsers volgen deze boven de eigen declaratie van de pagina.',
  ["Character encoding the document itself declares in <meta charset> or http-equiv. When it disagrees with the HTTP charset, the page renders in the header's encoding."]:
    'Tekencodering die het document zelf declareert in <meta charset> of http-equiv. Als die afwijkt van de HTTP-charset, rendert de pagina in de codering van de header.',
  ['The title JavaScript sets on the page: from the rendered DOM in JavaScript rendering mode, or from an inline document.title assignment in text mode. Empty when scripts leave the title alone.']:
    'De titel die JavaScript op de pagina instelt: uit de gerenderde DOM in de JavaScript-renderingmodus, of uit een inline document.title-toewijzing in tekstmodus. Leeg als scripts de titel ongemoeid laten.',
  ["Highest estimated text similarity to another page in this URL's near-duplicate cluster, measured on the main-content wording. Empty for pages that aren't near-duplicates."]:
    "Hoogste geschatte tekstgelijkenis met een andere pagina in de bijna-duplicaatcluster van deze URL, gemeten op de tekst van de hoofdinhoud. Leeg voor pagina's die geen bijna-duplicaat zijn.",
  ["90 = recommended (Screaming Frog's default); 80 catches looser rewrites; 0 turns this pass off."]:
    '90 = aanbevolen (standaard van Screaming Frog); 80 vangt lossere herschrijvingen; 0 schakelt deze stap uit.',
  ["The page's `og:title` — the headline Facebook, LinkedIn and other OpenGraph readers show on a share card. One of the four required OpenGraph properties."]:
    'De `og:title` van de pagina — de kop die Facebook, LinkedIn en andere OpenGraph-lezers op een deelkaart tonen. Een van de vier verplichte OpenGraph-eigenschappen.',
  ['The `og:description` text shown under the title on a share card.']:
    'De `og:description`-tekst die onder de titel op een deelkaart staat.',
  ['The `og:image` URL as written in the page. The share card uses this picture; it should be absolute and return 200. One of the four required OpenGraph properties.']:
    'De `og:image`-URL zoals die in de pagina staat. De deelkaart gebruikt deze afbeelding; de URL moet absoluut zijn en 200 teruggeven. Een van de vier verplichte OpenGraph-eigenschappen.',
  ['Pixel width of the og:image, read by the social-image probe. 0 = the image could not be read; empty = not probed.']:
    'Breedte in pixels van de og:image, uitgelezen door de social-image-probe. 0 = de afbeelding kon niet worden gelezen; leeg = niet gecontroleerd.',
  ['Pixel height of the og:image, read by the social-image probe. 0 = the image could not be read; empty = not probed.']:
    'Hoogte in pixels van de og:image, uitgelezen door de social-image-probe. 0 = de afbeelding kon niet worden gelezen; leeg = niet gecontroleerd.',
  ['The `og:type` of the page, such as website or article. One of the four required OpenGraph properties.']:
    'Het `og:type` van de pagina, zoals website of article. Een van de vier verplichte OpenGraph-eigenschappen.',
  ['The `og:url` — the address share counts and the card link are attached to. One of the four required OpenGraph properties.']:
    'De `og:url` — het adres waaraan deeltellingen en de kaartlink zijn gekoppeld. Een van de vier verplichte OpenGraph-eigenschappen.',
  ['The `og:site_name` that some platforms show above the share card title.']:
    'De `og:site_name` die sommige platforms boven de titel van de deelkaart tonen.',
  ['The `og:locale` — the language and territory of the markup.']:
    'De `og:locale` — de taal en regio van de markup.',
  ['The X (Twitter) card type. Without it X shows no card, even when other `twitter:` tags are present.']:
    'Het kaarttype voor X (Twitter). Zonder dit toont X geen kaart, ook als er andere `twitter:`-tags aanwezig zijn.',
  ['The X card title. X falls back to og:title when it is missing.']:
    'De titel van de X-kaart. X valt terug op og:title als die ontbreekt.',
  ['The X card description. X falls back to og:description when it is missing.']:
    'De beschrijving van de X-kaart. X valt terug op og:description als die ontbreekt.',
  ['The X card image URL. X falls back to og:image when it is missing.']:
    'De afbeeldings-URL van de X-kaart. X valt terug op og:image als die ontbreekt.',
  ['Pixel width of the twitter:image, read by the social-image probe. 0 = the image could not be read; empty = not probed.']:
    'Breedte in pixels van de twitter:image, uitgelezen door de social-image-probe. 0 = de afbeelding kon niet worden gelezen; leeg = niet gecontroleerd.',
  ['Pixel height of the twitter:image, read by the social-image probe. 0 = the image could not be read; empty = not probed.']:
    'Hoogte in pixels van de twitter:image, uitgelezen door de social-image-probe. 0 = de afbeelding kon niet worden gelezen; leeg = niet gecontroleerd.',
  ['When a request gets no response at all — a timeout, a reset or a refused connection — retry it up to N more times before recording it as failed. Kept apart from the HTTP retries above, so a flaky network and a struggling server can be tuned separately.']:
    'Als een verzoek helemaal geen antwoord krijgt — een time-out, een reset of een geweigerde verbinding — probeer het dan tot N keer opnieuw voordat het als mislukt wordt vastgelegd. Los van de HTTP-herhalingen hierboven, zodat je een wankel netwerk en een worstelende server apart kunt afstellen.',
  ['2 default; 0 to record connection failures immediately; 4 on an unstable connection.']:
    '2 standaard; 0 om verbindingsfouten direct vast te leggen; 4 bij een instabiele verbinding.',
  ['When a site that was answering stops responding — 10 requests in a row get no answer even after their connection retries — the crawl pauses instead of marking the rest of the queue as failed. Fix the problem or wait for the server to come back, then press Resume to continue where it stopped.']:
    'Als een site die eerst antwoordde niet meer reageert — 10 verzoeken op rij krijgen geen antwoord, ook niet na hun verbindingspogingen — pauzeert de crawl in plaats van de rest van de wachtrij als mislukt te markeren. Los het probleem op of wacht tot de server terug is en klik dan op Hervatten om verder te gaan waar de crawl stopte.',
  ['On by default. Turn it off when any result is better than a paused run, for example a crawl nobody is watching.']:
    'Standaard aan. Zet het uit als elk resultaat beter is dan een gepauzeerde run, bijvoorbeeld bij een crawl waar niemand naar kijkt.',
  ['Links that sit in these parts of a page are recorded (they still count as inlinks and show in the link reports) but the crawler does not follow them. Useful for mega-menus and footers that link to thousands of pages. A page that is also linked from the body is still crawled.']:
    "Links in deze delen van een pagina worden vastgelegd (ze tellen nog steeds als inkomende links en verschijnen in de linkrapporten), maar de crawler volgt ze niet. Handig voor megamenu's en footers die naar duizenden pagina's linken. Een pagina waarnaar ook vanuit de body wordt gelinkt, wordt nog steeds gecrawld.",
  ['Footer + Sidebar on a shop whose footer lists every category']:
    'Footer + Zijbalk bij een webshop waarvan de footer elke categorie vermeldt',
  ['Links inside any element matching one of these CSS selectors are recorded but not followed — the way to keep faceted filters or a mega-menu from flooding the crawl without excluding the pages themselves. An invalid selector is ignored.']:
    "Links binnen elk element dat overeenkomt met een van deze CSS-selectors worden vastgelegd maar niet gevolgd — zo voorkom je dat facetfilters of een megamenu de crawl overspoelen, zonder de pagina's zelf uit te sluiten. Een ongeldige selector wordt genegeerd.",
  ["The name every export's save dialog suggests. Tokens are filled in when you export: {report} = what is exported, {date} / {time} / {datetime} = now, {domain} = the crawled site, {project} = the project name. Characters that are not allowed in file names are replaced with a dash."]:
    'De naam die het opslagvenster van elke export voorstelt. Tokens worden bij het exporteren ingevuld: {report} = wat er wordt geëxporteerd, {date} / {time} / {datetime} = nu, {domain} = de gecrawlde site, {project} = de projectnaam. Tekens die niet zijn toegestaan in bestandsnamen, worden vervangen door een streepje.',
};
