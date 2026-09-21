/**
 * Italian InfoTip ([i] tooltip) bodies, keyed by the verbatim English
 * source string. See `../info-tips.ts` for the rationale.
 */

export const IT_INFO_TIPS: Record<string, string> = {
  ["?page=1 / ?page=2 / ?page=4 → flags 'Sequence Break' on every member of the broken cluster."]:
    "?page=1 / ?page=2 / ?page=4 → segnala 'Interruzione di sequenza' su ogni membro del gruppo interrotto.",
  ['`<a>` elements that look clickable but aren\'t crawlable (no href + onclick, `href="javascript:…"`, or `href="#"` with onclick).']:
    'Elementi `<a>` che sembrano cliccabili ma non sono scansionabili (nessun href + onclick, `href="javascript:…"`, o `href="#"` con onclick).',
  ['`<link rel="amphtml" href="…">` value — the AMP version of this page. Empty when the page does not declare an AMP alternate.']:
    'Valore di `<link rel="amphtml" href="…">` — la versione AMP di questa pagina. Vuoto quando la pagina non dichiara un\'alternativa AMP.',
  ['`<link rel="next" href="…">` value resolved to absolute. Empty when the page is not paginated forward.']:
    'Valore di `<link rel="next" href="…">` risolto in assoluto. Vuoto quando la pagina non è paginata in avanti.',
  ['`<link rel="prev" href="…">` value resolved to absolute. Empty when the page is the first in its pagination cluster.']:
    'Valore di `<link rel="prev" href="…">` risolto in assoluto. Vuoto quando la pagina è la prima del suo gruppo di paginazione.',
  ['`css` runs against the parsed DOM; `regex` runs against raw HTML.']:
    "`css` viene eseguito sul DOM analizzato; `regex` viene eseguito sull'HTML grezzo.",
  ['`none` disables auth; `basic` adds `Authorization: Basic <base64>`; `bearer` adds `Authorization: Bearer <token>`; `digest` performs the RFC 2617 challenge-response on the first 401.']:
    "`none` disabilita l'autenticazione; `basic` aggiunge `Authorization: Basic <base64>`; `bearer` aggiunge `Authorization: Bearer <token>`; `digest` esegue il challenge-response RFC 2617 al primo 401.",
  ['`POST <url>` is fired when the `done` event emits. 10 s timeout. Failures are logged as info events but never break the crawl.']:
    "`POST <url>` viene inviato quando viene emesso l'evento `done`. Timeout di 10 s. Gli errori vengono registrati come eventi informativi ma non interrompono mai la scansione.",
  ['0 (no duplicates), 7 (member of cluster #7)']:
    '0 (nessun duplicato), 7 (membro del gruppo n. 7)',
  ['0 = auto. 4 for 8GB RAM machines, 8+ for 16GB+.']:
    '0 = automatico. 4 per macchine con 8 GB di RAM, 8+ per 16 GB e oltre.',
  ["0 default; 250 ms when a host returns 429 with a 'too fast' message."]:
    "0 predefinito; 250 ms quando un host restituisce 429 con un messaggio 'troppo veloce'.",
  ['0 for SSR sites, 2000 for typical SPAs, 5000+ for heavy client-rendered apps.']:
    '0 per siti SSR, 2000 per SPA tipiche, 5000+ per applicazioni pesanti renderizzate lato client.',
  ["0.1 default (Google 'good'); 0 to disable."]:
    "0.1 predefinito ('buono' secondo Google); 0 per disabilitare.",
  ['1 = unique, 5 = part of a 5-page near-duplicate group']:
    '1 = unico, 5 = parte di un gruppo di 5 pagine quasi duplicate',
  ['10 (default), 3 for very tight chains, 0 to remove the cap']:
    '10 (predefinito), 3 per catene molto strette, 0 per rimuovere il limite',
  ['10 covers most sites; 3 limits crawls to top-of-funnel pages only.']:
    '10 copre la maggior parte dei siti; 3 limita la scansione alle sole pagine in cima al funnel.',
  ['100 default for most audits; 0 to disable the check.']:
    '100 predefinito per la maggior parte degli audit; 0 per disabilitare il controllo.',
  ['100 default; 50 for tight on-page link discipline; 0 to disable the issue.']:
    '100 predefinito; 50 per una disciplina rigorosa dei link in pagina; 0 per disabilitare il problema.',
  ['1000000 (1M) for a full site audit; 5000 for spot checks.']:
    '1000000 (1M) per un audit completo del sito; 5000 per controlli mirati.',
  ['1024 (1 MB) default; 150 for a lean HTML budget; 0 to disable.']:
    '1024 (1 MB) predefinito; 150 per un budget HTML snello; 0 per disabilitare.',
  ['1048576 (1 MB) default; 524288 (512 KB) on tight disks; 0 to disable truncation entirely.']:
    '1048576 (1 MB) predefinito; 524288 (512 KB) su dischi limitati; 0 per disabilitare del tutto il troncamento.',
  ['10485760 (10 MB) on bandwidth-tight crawls; 0 to download anything.']:
    '10485760 (10 MB) per scansioni con banda limitata; 0 per scaricare qualsiasi cosa.',
  ['1366 = standard laptop, 1920 = full HD desktop, 375 = iPhone width.']:
    '1366 = laptop standard, 1920 = desktop Full HD, 375 = larghezza iPhone.',
  ['2 default; 0 to record errors immediately without retrying; 5 for unreliable upstreams.']:
    '2 predefinito; 0 per registrare subito gli errori senza ritentare; 5 per server a monte inaffidabili.',
  ['20 default; 50 on fast first-party servers; 5 if the site rate-limits or returns 429s.']:
    '20 predefinito; 50 su server propri veloci; 5 se il sito limita la frequenza o restituisce 429.',
  ['20 for typical sites; 5 to be polite on shared hosting; 60+ when crawling your own infra.']:
    '20 per siti tipici; 5 per essere cortesi su hosting condiviso; 60+ quando scansioni la tua infrastruttura.',
  ['20000 (20 s) for typical use; 5000 for fast spot checks; 60000 for slow APIs.']:
    '20000 (20 s) per uso tipico; 5000 per controlli rapidi; 60000 per API lente.',
  ['2048 (≈2 GB) on a 4 GB laptop; 8192 on a 16 GB workstation; 0 to disable.']:
    '2048 (≈2 GB) su un laptop da 4 GB; 8192 su una workstation da 16 GB; 0 per disabilitare.',
  ['2048 default (RFC-suggested practical ceiling).']:
    "2048 predefinito (tetto pratico suggerito dall'RFC).",
  ["2500 default (Google 'good'); 0 to disable."]:
    "2500 predefinito ('buono' secondo Google); 0 per disabilitare.",
  ['3 = recommended; 5 catches looser duplicates (templated content with light variation); 0 turns the post-crawl pass off.']:
    '3 = consigliato; 5 cattura duplicati più laschi (contenuto da template con lievi variazioni); 0 disattiva la passata post-scansione.',
  ['4 default; 6 on documentation sites with deep TOC trees; 0 to disable.']:
    '4 predefinito; 6 su siti di documentazione con indici profondi; 0 per disabilitare.',
  ['500 default. Bump to 2000 when retrying against a flaky API.']:
    "500 predefinito. Porta a 2000 quando ritenti contro un'API instabile.",
  ['50000 keeps RAM bounded during big sitemap fan-outs; 0 for typical crawls.']:
    '50000 mantiene la RAM limitata durante grandi espansioni di sitemap; 0 per scansioni tipiche.',
  ['60000 (1 minute) for huge resources; 0 to rely solely on the fetch timeout.']:
    '60000 (1 minuto) per risorse enormi; 0 per affidarsi solo al timeout di fetch.',
  ['64-bit SimHash + LSH bucketing + Union-Find clustering on body shingles. Most expensive pass — typical 5–10 s on a 100k crawl.']:
    'SimHash a 64 bit + bucketing LSH + clustering Union-Find sugli shingle del corpo. La passata più costosa — tipicamente 5–10 s su una scansione da 100k.',
  ['768 = standard laptop, 1080 = full HD desktop, 667 = iPhone 8 height.']:
    '768 = laptop standard, 1080 = desktop Full HD, 667 = altezza iPhone 8.',
  ['800 default; 200 for CDN-backed static; 0 to disable.']:
    '800 predefinito; 200 per statico servito da CDN; 0 per disabilitare.',
  ['Aborts @font-face / Google Fonts / WOFF2 requests. FOUT visible but text still renders.']:
    'Interrompe le richieste @font-face / Google Fonts / WOFF2. FOUT visibile ma il testo viene comunque renderizzato.',
  ['Aborts <img>, <picture>, background-image requests. Recommended for SEO crawls — image metadata still comes from <img> tag attributes.']:
    'Interrompe le richieste <img>, <picture> e background-image. Consigliato per scansioni SEO — i metadati delle immagini arrivano comunque dagli attributi del tag <img>.',
  ['Aborts <video> / <audio> sources. Page DOM still includes the <video> tag.']:
    'Interrompe le sorgenti <video> / <audio>. Il DOM della pagina include ancora il tag <video>.',
  ['Aborts all <script> requests. This defeats the purpose of JS rendering — use Text Only mode instead.']:
    'Interrompe tutte le richieste <script>. Vanifica lo scopo del rendering JS — usa invece la modalità Solo testo.',
  ['Aborts external CSS. Inline styles still load. WARNING: many SPAs use CSS-driven visibility / lazy classes — blocking CSS may hide content that JS depends on.']:
    'Interrompe il CSS esterno. Gli stili inline si caricano comunque. ATTENZIONE: molte SPA usano visibilità / classi lazy guidate dal CSS — bloccare il CSS può nascondere contenuto da cui dipende il JS.',
  ['Aborts requests whose total lifetime (connect + headers + body) exceeds this. Distinct from `requestTimeoutMs` which is the headers timeout. Useful for capping individual slow pages without lowering the overall fetch timeout.']:
    'Interrompe le richieste la cui durata totale (connessione + header + corpo) supera questo valore. Distinto da `requestTimeoutMs`, che è il timeout degli header. Utile per limitare singole pagine lente senza abbassare il timeout complessivo di fetch.',
  ['Absolute redirect target parsed from the meta-refresh content. Empty when meta-refresh sets only a delay.']:
    'Destinazione di reindirizzamento assoluta estratta dal content del meta-refresh. Vuoto quando il meta-refresh imposta solo un ritardo.',
  ['Literal target of a JavaScript redirect found in an inline script (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Followed when "Follow JavaScript redirects" is on.']:
    'Destinazione letterale di un reindirizzamento JavaScript trovato in uno script inline (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Seguito quando "Segui i reindirizzamenti JavaScript" è attivo.',
  ['Additional time to wait after the chosen wait condition fires, for SPA hydration / late XHRs. 0 = no extra wait. Bounded by the request timeout.']:
    "Tempo aggiuntivo di attesa dopo lo scatto della condizione scelta, per l'idratazione della SPA / XHR tardive. 0 = nessuna attesa extra. Limitato dal timeout della richiesta.",
  ['Anchor text of the broken link as rendered in the source page.']:
    'Testo di ancoraggio del link interrotto come renderizzato nella pagina sorgente.',
  ['Audits the rendered DOM for WCAG AA colour-contrast failures (4.5:1 normal text, 3:1 large text) and stylesheet rules that suppress the keyboard focus outline without a :focus-visible fallback. Surfaces the Low-Contrast Text and Focus Outline Suppressed issue filters.']:
    'Verifica nel DOM renderizzato i fallimenti di contrasto colore WCAG AA (4.5:1 testo normale, 3:1 testo grande) e le regole di foglio di stile che sopprimono il contorno di focus da tastiera senza fallback :focus-visible. Alimenta i filtri problema Testo a basso contrasto e Contorno di focus soppresso.',
  ['basic/digest for /staging behind nginx; bearer for protected APIs']:
    'basic/digest per /staging dietro nginx; bearer per API protette',
  ['Below Normal while you keep working in other apps; Idle for overnight unattended runs.']:
    'Sotto la norma mentre continui a lavorare in altre app; Inattiva per esecuzioni notturne non presidiate.',
  ['BFS click depth from the start URL. Start URL = 0; its outlinks = 1; etc. High depth often correlates with low importance.']:
    "Profondità di clic BFS dall'URL iniziale. URL iniziale = 0; i suoi link in uscita = 1; ecc. Un'alta profondità spesso è correlata a bassa importanza.",
  ['Bodies over this are truncated and flagged. 1 MB covers the 99.9th percentile of HTML pages without letting one adversarial 50 MB page bloat the project file.']:
    'I corpi oltre questa soglia vengono troncati e segnalati. 1 MB copre il 99,9° percentile delle pagine HTML senza lasciare che una pagina ostile da 50 MB gonfi il file di progetto.',
  ['Buy Affordable Game Keys | Example Store']:
    'Compra chiavi di gioco a prezzi bassi | Negozio di esempio',
  ['Character count of the first H1.']: 'Conteggio caratteri del primo H1.',
  ['Character count of the meta description. Recommended: 70–155 characters; over 155 risks truncation.']:
    'Conteggio caratteri della meta description. Consigliato: 70–155 caratteri; oltre 155 rischia il troncamento.',
  ['Character count of the title. Recommended: 30–60 characters; over 60 risks truncation in SERPs.']:
    'Conteggio caratteri del titolo. Consigliato: 30–60 caratteri; oltre 60 rischia il troncamento nelle SERP.',
  ['Charikar 64-bit SimHash of body shingles. Used by the post-crawl near-duplicate clustering pass. Two SimHashes within the configured Hamming threshold are considered similar.']:
    'SimHash Charikar a 64 bit degli shingle del corpo. Usato dalla passata post-scansione di raggruppamento dei quasi duplicati. Due SimHash entro la soglia di Hamming configurata sono considerati simili.',
  ['Coarse content classification derived from URL extension and Content-Type header.']:
    "Classificazione grossolana del contenuto derivata dall'estensione dell'URL e dall'header Content-Type.",
  ['Comma-joined sorted unique JSON-LD `@type` values declared on the page (Article, BreadcrumbList, Product, …).']:
    'Valori `@type` JSON-LD unici, ordinati e uniti da virgole, dichiarati nella pagina (Article, BreadcrumbList, Product, …).',
  ['Contents of the first <meta name="description"> tag. May be used as the SERP snippet.']:
    'Contenuto del primo tag <meta name="description">. Può essere usato come snippet nelle SERP.',
  ['Contents of the first <meta name="robots"> tag. Controls per-page indexing/following behaviour.']:
    'Contenuto del primo tag <meta name="robots">. Controlla il comportamento di indicizzazione/follow per pagina.',
  ['Contents of the first <title> element. Google primarily uses this in SERP titles.']:
    'Contenuto del primo elemento <title>. Google lo usa principalmente nei titoli delle SERP.',
  ['Counts how many internal pages link to each URL. Drives the Most-Linked URLs report and the per-row Inlinks column.']:
    'Conta quante pagine interne puntano a ciascun URL. Alimenta il report URL più linkati e la colonna Link in entrata di ogni riga.',
  ["Crawl 3xx redirect targets. Each hop is its own row; the chain is reconstructed in the Response Codes view. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced)."]:
    "Scansiona le destinazioni dei reindirizzamenti 3xx. Ogni salto è una riga a sé; la catena viene ricostruita nella vista Codici di risposta. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced).",
  ['Crawler RSS auto-pauses the queue when this is exceeded; resumes once memory drops to 80% of the cap. Soft cap — does not enforce a hard heap limit.']:
    "L'RSS del crawler mette automaticamente in pausa la coda quando questo valore viene superato; riprende quando la memoria scende all'80% del limite. Limite morbido — non impone un limite rigido dell'heap.",
  ['css for selectors, regex for free-form patterns']:
    'css per i selettori, regex per pattern liberi',
  ["CSS selector that pins the duplicate-fingerprint text extraction to a specific page region. When set, the heuristic (main / role=main / article / body-minus-chrome) is bypassed and the selector wins. Useful on sites where the heuristic misclassifies — e.g. CMSes that wrap navigation inside `<main>` or sites with no semantic landmarks at all. Empty = use the heuristic. Invalid selectors silently fall back to the heuristic so a typo doesn't break the crawl."]:
    "Selettore CSS che vincola l'estrazione del testo per l'impronta dei duplicati a una regione specifica della pagina. Quando impostato, l'euristica (main / role=main / article / body-meno-chrome) viene bypassata e vince il selettore. Utile su siti in cui l'euristica classifica male — es. CMS che avvolgono la navigazione dentro `<main>` o siti senza alcun landmark semantico. Vuoto = usa l'euristica. I selettori non validi ricadono silenziosamente sull'euristica così un refuso non rompe la scansione.",
  ["Cumulative Layout Shift from PageSpeed Insights, when present. Google's 'good' CLS threshold is 0.1. Unitless; accepts decimals. Pages without PSI data are never flagged."]:
    "Cumulative Layout Shift da PageSpeed Insights, quando presente. La soglia CLS 'buona' di Google è 0.1. Senza unità; accetta decimali. Le pagine senza dati PSI non vengono mai segnalate.",
  ['Drives the View Source detail tab. ~30–200 KB on disk per HTML page; turn off if you only need metadata and not full source viewing.']:
    'Alimenta la scheda di dettaglio Visualizza sorgente. ~30–200 KB su disco per pagina HTML; disattiva se ti servono solo i metadati e non la visualizzazione completa del sorgente.',
  ["Each rule runs JavaScript RegExp.replace on the fully-normalised URL. Flags default to 'g'. After all rules run, the result is re-parsed as a URL — if the rewrite produces an invalid URL, the link is dropped at normalisation time."]:
    "Ogni regola esegue RegExp.replace di JavaScript sull'URL completamente normalizzato. I flag predefiniti sono 'g'. Dopo l'esecuzione di tutte le regole, il risultato viene rianalizzato come URL — se la riscrittura produce un URL non valido, il link viene scartato in fase di normalizzazione.",
  ["Empty = safest. 'chrome' if you want the same Chrome version your users see."]:
    "Vuoto = il più sicuro. 'chrome' se vuoi la stessa versione di Chrome che vedono i tuoi utenti.",
  ["Empty = use the bundled Playwright Chromium build (recommended — pinned version, works everywhere). 'chrome' / 'msedge' uses the system-installed browser. Beta channels for testing newer features."]:
    "Vuoto = usa la build di Chromium inclusa in Playwright (consigliato — versione fissa, funziona ovunque). 'chrome' / 'msedge' usa il browser installato nel sistema. Canali beta per testare funzionalità più recenti.",
  ["Fetch internal <img> resources (incl. srcset / <picture> sources) so they appear in the Internal tab with their own status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl)."]:
    "Recupera le risorse <img> interne (incl. srcset / sorgenti <picture>) così compaiono nella scheda Interni con codice di stato, tipo di contenuto e dimensione propri. Ognuna conta ai fini di Max URL. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl).",
  ["Fetch internal <link rel=stylesheet> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl)."]:
    "Recupera le risorse <link rel=stylesheet> interne così compaiono nella scheda Interni con codice di stato, tipo di contenuto e dimensione. Ognuna conta ai fini di Max URL. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl).",
  ["Fetch internal <script src> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl)."]:
    "Recupera le risorse <script src> interne così compaiono nella scheda Interni con codice di stato, tipo di contenuto e dimensione. Ognuna conta ai fini di Max URL. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl).",
  ["Fetches /robots.txt sitemap directives + /sitemap.xml fallbacks. Powers the 'Non-Indexable in Sitemap' issue filter. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl)."]:
    "Recupera le direttive sitemap da /robots.txt + i fallback /sitemap.xml. Alimenta il filtro problema 'Non indicizzabile nella sitemap'. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl).",
  ["first/last for single value, all for JSON array, concat for ' | ' joined string"]:
    "first/last per un valore singolo, all per un array JSON, concat per una stringa unita da ' | '",
  ['FNV-1a 64-bit hash of the normalised body token stream. Two pages sharing this hash are byte-identical post-tokenisation — the basis of the Exact Duplicate filter.']:
    'Hash FNV-1a a 64 bit del flusso di token normalizzato del corpo. Due pagine che condividono questo hash sono identiche byte per byte dopo la tokenizzazione — la base del filtro Duplicato esatto.',
  ['For Basic, sent base64-encoded; for Digest, hashed into the challenge response.']:
    "Per Basic, inviata codificata in base64; per Digest, inserita nell'hash della risposta alla sfida.",
  ['For regex: `regex_group` extracts capture group 1; otherwise the whole match is used.']:
    "Per regex: `regex_group` estrae il gruppo di cattura 1; altrimenti viene usata l'intera corrispondenza.",
  ['Full-page renders the entire scrollable canvas; Above-the-fold captures just the initial viewport (cheaper). Both writes two PNGs per URL.']:
    "Pagina intera renderizza tutta l'area scorrevole; Above-the-fold cattura solo il viewport iniziale (più economico). Entrambi scrivono due PNG per URL.",
  ['Google\'s index status, pulled from the URL Inspection API — not the Fetch button. Click "Inspect (top 100)" to fill this column; Fetch only pulls clicks / impressions / position.']:
    'Stato di indicizzazione di Google, ottenuto dall\'API URL Inspection — non dal pulsante Recupera. Fai clic su "Ispeziona (top 100)" per riempire questa colonna; Recupera porta solo clic / impressioni / posizione.',
  ["Googlebot — Smartphone matches Google's mobile-first indexing crawler."]:
    'Googlebot — Smartphone corrisponde al crawler di indicizzazione mobile-first di Google.',
  ['Hard cap on pending URLs held in memory. Excess discoveries are dropped silently — bounds peak heap during fan-out bursts (big sitemaps, dense link graphs).']:
    'Limite rigido degli URL in attesa tenuti in memoria. Le scoperte in eccesso vengono scartate silenziosamente — limita il picco di heap durante le raffiche di espansione (grandi sitemap, grafi di link densi).',
  ['Hard cap on the number of 3xx hops we follow for a single chain. Each hop is recorded as its own URL row regardless. 0 disables the cap (chain still ends at `redirect_loop`).']:
    'Limite rigido del numero di salti 3xx seguiti per una singola catena. Ogni salto viene comunque registrato come riga URL a sé. 0 disabilita il limite (la catena termina comunque a `redirect_loop`).',
  ["Hard cap on total URLs crawled. The crawl stops as soon as this is reached. Screaming Frog: 'Limit Crawl Total'."]:
    "Limite rigido del totale degli URL scansionati. La scansione si ferma non appena viene raggiunto. Screaming Frog: 'Limit Crawl Total'.",
  ["Hard ceiling on requests per second across all workers combined. Equivalent to Screaming Frog's 'Max URL/s'. Acts as a token bucket — even with high concurrency the crawler waits between bursts to stay below this rate."]:
    "Tetto rigido di richieste al secondo per tutti i worker combinati. Equivale a 'Max URL/s' di Screaming Frog. Funziona come un token bucket — anche con alta concorrenza il crawler attende tra le raffiche per restare sotto questa frequenza.",
  ['Height attribute value (in pixels) declared on the <img> tag, when present.']:
    "Valore dell'attributo height (in pixel) dichiarato sul tag <img>, quando presente.",
  ["Honor Disallow rules + crawl-delay declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "Rispetta le regole Disallow + crawl-delay dichiarate in /robots.txt per lo User-Agent configurato. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt).",
  ["Hop count from the start URL. Start URL is depth 0; its outlinks are depth 1, theirs depth 2, and so on. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits)."]:
    "Numero di salti dall'URL iniziale. L'URL iniziale è a profondità 0; i suoi link in uscita a profondità 1, i loro a profondità 2, e così via. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits).",
  ['How many distinct pages reference this image. High values typically indicate site-wide assets (logos, icons).']:
    'Quante pagine distinte fanno riferimento a questa immagine. Valori alti indicano tipicamente risorse comuni a tutto il sito (loghi, icone).',
  ["How to canonicalise paths with/without a trailing slash. 'Add' is file-extension aware — won't add a slash to /file.pdf or /image.png."]:
    "Come canonicalizzare i percorsi con/senza barra finale. 'Aggiungi' tiene conto dell'estensione del file — non aggiungerà una barra a /file.pdf o /image.png.",
  ['HTML attribute name to read.']: "Nome dell'attributo HTML da leggere.",
  ['HTML transfer size of the page document. Heavy HTML payloads delay first paint. Stored as bytes internally; entered here in kilobytes.']:
    'Dimensione di trasferimento HTML del documento della pagina. Payload HTML pesanti ritardano il primo paint. Memorizzata in byte internamente; inserita qui in kilobyte.',
  ['HTTP `<img>` / `<video>` / `<audio>` / `<source>` references on an HTTPS page — rendered but the URL bar reads "Not Secure".']:
    'Riferimenti HTTP `<img>` / `<video>` / `<audio>` / `<source>` in una pagina HTTPS — renderizzati, ma la barra degli indirizzi mostra "Non sicuro".',
  ['HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` references on an HTTPS page — browsers BLOCK these silently.']:
    'Riferimenti HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` in una pagina HTTPS — i browser li BLOCCANO silenziosamente.',
  ['HTTP response status code. Empty/Failed indicates a network error before any response was received.']:
    'Codice di stato della risposta HTTP. Vuoto/Fallito indica un errore di rete prima di qualsiasi risposta.',
  ['HTTP status of the source page itself. Usually 200; if non-2xx the broken link may be inherited.']:
    'Stato HTTP della pagina sorgente stessa. Di solito 200; se non 2xx il link interrotto potrebbe essere ereditato.',
  ['HTTP status returned by the target. 0 = network failure (DNS, TLS, timeout).']:
    'Stato HTTP restituito dalla destinazione. 0 = errore di rete (DNS, TLS, timeout).',
  ["HTTP/HTTPS proxies route via undici's ProxyAgent; SOCKS proxies (socks5://, socks5h://, socks4://, socks4a://) tunnel via the socks client. The `h`/`4a` variants resolve DNS at the proxy. Leave empty to inherit HTTPS_PROXY/HTTP_PROXY env vars."]:
    "I proxy HTTP/HTTPS passano dal ProxyAgent di undici; i proxy SOCKS (socks5://, socks5h://, socks4://, socks4a://) sono tunnellizzati tramite il client socks. Le varianti `h`/`4a` risolvono il DNS sul proxy. Lascia vuoto per ereditare le variabili d'ambiente HTTPS_PROXY/HTTP_PROXY.",
  ["Identifies the largest element visible in the initial viewport (likely LCP candidate per Google's heuristic) and stores its CSS selector, dimensions, and resource URL. Useful for spotting unoptimised LCP images without a PSI API call."]:
    "Identifica l'elemento più grande visibile nel viewport iniziale (probabile candidato LCP secondo l'euristica di Google) e memorizza il suo selettore CSS, le dimensioni e l'URL della risorsa. Utile per individuare immagini LCP non ottimizzate senza una chiamata all'API PSI.",
  ['If set, Playwright waits for this CSS selector to appear in the DOM before extracting HTML. Overrides the extra-wait timeout when present. Useful when you know the SPA reveals a specific element after hydration.']:
    "Se impostato, Playwright attende che questo selettore CSS compaia nel DOM prima di estrarre l'HTML. Sostituisce il timeout di attesa extra quando presente. Utile quando sai che la SPA mostra un elemento specifico dopo l'idratazione.",
  ['Images on this page that have no alt attribute. WCAG accessibility issue + missed alt-as-anchor SEO opportunity.']:
    'Immagini in questa pagina prive di attributo alt. Problema di accessibilità WCAG + opportunità SEO persa di alt come ancora.',
  ['Indexable / Non-Indexable']: 'Indicizzabile / Non indicizzabile',
  ['Internal PageRank, 0–100. Computed over the internal link graph (damping 0.85) and normalised so the most-linked page scores 100. Higher = more internal link equity.']:
    'PageRank interno, 0–100. Calcolato sul grafo dei link interni (smorzamento 0.85) e normalizzato così che la pagina più linkata ottenga 100. Più alto = più equità di link interni.',
  ['internal / external']: 'interno / esterno',
  ['JavaScript executed in every page BEFORE navigation begins (init script). Use to set localStorage / cookies / mock APIs / disable animations. Runs in page context — no Node access.']:
    "JavaScript eseguito in ogni pagina PRIMA dell'inizio della navigazione (script di inizializzazione). Usalo per impostare localStorage / cookie / simulare API / disabilitare animazioni. Gira nel contesto della pagina — nessun accesso a Node.",
  ['JavaScript regex (no flags — /g is implicit). Use a capture group with `output=regex_group` to extract just part of the match.']:
    'Regex JavaScript (senza flag — /g è implicito). Usa un gruppo di cattura con `output=regex_group` per estrarre solo parte della corrispondenza.',
  ['JavaScript regex tested against the full URL. Empty = all URLs allowed. URL must match at least one to be enqueued. The start URL is always permitted regardless.']:
    "Regex JavaScript testata sull'URL completo. Vuoto = tutti gli URL consentiti. L'URL deve corrispondere ad almeno una per essere accodato. L'URL iniziale è sempre consentito.",
  ['JavaScript regex. Any match → URL is skipped, even if it would otherwise pass the include list. Common uses: skip admin areas, large file types, session-id query params.']:
    "Regex JavaScript. Qualsiasi corrispondenza → l'URL viene saltato, anche se passerebbe la lista di inclusione. Usi comuni: saltare aree di amministrazione, tipi di file grandi, parametri di sessione nella query.",
  ['JSON map of `{ term: count }` literal-substring hits from the configured Custom Search terms.']:
    'Mappa JSON `{ term: count }` delle occorrenze letterali di sottostringa dei termini di Ricerca personalizzata configurati.',
  ['JSON-stringified array of `{ lang, href }` pairs. Heavy column — better consumed via the URL Details panel.']:
    'Array serializzato in JSON di coppie `{ lang, href }`. Colonna pesante — meglio consultarla dal pannello Dettagli URL.',
  ['JSON-stringified custom-extraction results map. Heavy column — render verbatim, easier to read in the URL Details panel.']:
    "Mappa dei risultati di estrazione personalizzata serializzata in JSON. Colonna pesante — mostrata così com'è, più leggibile nel pannello Dettagli URL.",
  ['JSONPath against a JSON response body (e.g. `application/json` APIs). Only runs on responses that parse as JSON — ignored on HTML pages.']:
    'JSONPath applicato al corpo di una risposta JSON (es. API `application/json`). Viene eseguito solo su risposte analizzabili come JSON — ignorato sulle pagine HTML.',
  ['JSONPath returns the matched JSON value as-is; choose `Count` to return the number of matches instead.']:
    "JSONPath restituisce il valore JSON corrispondente così com'è; scegli `Count` per restituire invece il numero di corrispondenze.",
  ["Largest Contentful Paint from PageSpeed Insights lab data, when the URL has been audited. Google's 'good' LCP threshold is 2500 ms. Pages without PSI data are never flagged on this metric."]:
    "Largest Contentful Paint dai dati di laboratorio di PageSpeed Insights, quando l'URL è stato verificato. La soglia LCP 'buona' di Google è 2500 ms. Le pagine senza dati PSI non vengono mai segnalate su questa metrica.",
  ['load = good default. networkidle for heavy SPAs. domcontentloaded if you only need raw HTML.']:
    "load = buona scelta predefinita. networkidle per SPA pesanti. domcontentloaded se ti serve solo l'HTML grezzo.",
  ['Location header value when status is 3xx. The URL the server points to next; chain length is in the URL Details panel.']:
    "Valore dell'header Location quando lo stato è 3xx. L'URL a cui il server punta successivamente; la lunghezza della catena è nel pannello Dettagli URL.",
  ['Lowercases the URL path component. Host is already case-insensitive per the URL spec, so this only affects the path.']:
    "Converte in minuscolo la componente percorso dell'URL. L'host è già insensibile alle maiuscole per la specifica URL, quindi questo influisce solo sul percorso.",
  ['Near-duplicate cluster ID assigned by the post-crawl SimHash pass. 0 = singleton (no near-duplicates within the configured Hamming threshold). Pages sharing a non-zero cluster ID are mutually similar.']:
    'ID del gruppo di quasi duplicati assegnato dalla passata SimHash post-scansione. 0 = singleton (nessun quasi duplicato entro la soglia di Hamming configurata). Le pagine che condividono un ID diverso da zero sono reciprocamente simili.',
  ['noindex, canonicalised, redirected, blocked-by-robots']:
    'noindex, canonicalizzata, reindirizzata, bloccata da robots',
  ['None for fastest crawl. Above-the-fold for SERP-thumbnail-style preview. Full page when you need long-page snapshots.']:
    "Nessuno per la scansione più veloce. Above-the-fold per un'anteprima in stile miniatura SERP. Pagina intera quando ti servono istantanee di pagine lunghe.",
  ['Number of `<form action="http://…">` declarations on an HTTPS page. Submitting one downgrades the connection.']:
    'Numero di dichiarazioni `<form action="http://…">` in una pagina HTTPS. Inviarne una degrada la connessione.',
  ['Number of `<link rel="alternate" hreflang>` entries declared on this page. 0 = no alternates declared.']:
    'Numero di voci `<link rel="alternate" hreflang>` dichiarate in questa pagina. 0 = nessuna alternativa dichiarata.',
  ['Number of `<link rel="canonical">` tags on the page. >1 is a "Multiple Canonicals" issue.']:
    'Numero di tag `<link rel="canonical">` nella pagina. >1 è un problema "Canonical multipli".',
  ['Number of `<script type="application/ld+json">` blocks parsed successfully on the page.']:
    'Numero di blocchi `<script type="application/ld+json">` analizzati con successo nella pagina.',
  ['Number of `<script type="application/ld+json">` blocks that failed to parse as JSON.']:
    'Numero di blocchi `<script type="application/ld+json">` che non è stato possibile analizzare come JSON.',
  ['Number of <img> elements on the page.']: 'Numero di elementi <img> nella pagina.',
  ['Number of browser tabs the pool keeps warm in parallel. 0 = auto (matches crawler concurrency, capped at 8). More tabs = faster crawl but more RAM (each tab ~80–150 MB).']:
    'Numero di schede del browser che il pool tiene aperte in parallelo. 0 = automatico (pari alla concorrenza del crawler, con tetto a 8). Più schede = scansione più veloce ma più RAM (ogni scheda ~80–150 MB).',
  ['Number of hreflang targets that are non-200, noindex, or canonicalised away. Aggregated by the post-crawl pass.']:
    'Numero di destinazioni hreflang che non sono 200, sono noindex o canonicalizzate altrove. Aggregato dalla passata post-scansione.',
  ["Number of HTTP requests in flight at any one time. Equivalent to Screaming Frog's 'Max Threads'. Higher = faster crawl + more load on the target server."]:
    "Numero di richieste HTTP in corso in un dato momento. Equivale a 'Max Threads' di Screaming Frog. Più alto = scansione più veloce + più carico sul server di destinazione.",
  ['Number of internal `<a>` elements with no usable anchor text or alt — accessibility / SEO regression.']:
    'Numero di elementi `<a>` interni senza testo di ancoraggio o alt utilizzabile — regressione di accessibilità / SEO.',
  ['Number of internal pages that link to this URL. A rough internal-PageRank signal.']:
    'Numero di pagine interne che puntano a questo URL. Un segnale approssimativo di PageRank interno.',
  ["Number of pages in this URL's near-duplicate cluster (1 = no duplicates, ≥2 = part of a duplicate group). Tunable via Settings → Duplicates."]:
    'Numero di pagine nel gruppo di quasi duplicati di questo URL (1 = nessun duplicato, ≥2 = parte di un gruppo di duplicati). Regolabile in Impostazioni → Duplicati.',
  ['Number of redirect hops from this URL to its terminal target. Filled by the post-crawl `recomputeRedirectChains` walker. >3 trips the "Long Chain" issue.']:
    'Numero di salti di reindirizzamento da questo URL alla sua destinazione finale. Compilato dal percorso `recomputeRedirectChains` post-scansione. >3 fa scattare il problema "Catena lunga".',
  ['Number of unique <a> links emitted from this page (internal + external).']:
    'Numero di link <a> unici emessi da questa pagina (interni + esterni).',
  ['Off — only enable for testing edge cases.']:
    'Disattivato — abilita solo per testare casi limite.',
  ['Off — small speed gain not worth the fidelity loss.']:
    'Disattivato — il piccolo guadagno di velocità non vale la perdita di fedeltà.',
  ['On — fonts add overhead without changing SEO output.']:
    'Attivato — i font aggiungono overhead senza cambiare il risultato SEO.',
  ['On (default) — cheap I/O, high SEO value.']:
    'Attivato (predefinito) — I/O economico, alto valore SEO.',
  ['On (default) — media is heavy and rarely SEO-relevant.']:
    'Attivato (predefinito) — i media sono pesanti e raramente rilevanti per la SEO.',
  ['On (default) so the Internal tab shows images, not just HTML; off for HTML-only crawls.']:
    "Attivato (predefinito) così la scheda Interni mostra le immagini, non solo l'HTML; disattivato per scansioni solo HTML.",
  ['On (default); off for HTML-only crawls.']:
    'Attivato (predefinito); disattivato per scansioni solo HTML.',
  ['On (default). Off only when crawling sites you own and need to bypass.']:
    'Attivato (predefinito). Disattiva solo quando scansioni siti di tua proprietà che devi aggirare.',
  ['On for accessibility / WCAG audits.']: 'Attivato per audit di accessibilità / WCAG.',
  ['On for max speed. Off if you need LCP candidate detection or visual screenshots later.']:
    'Attivato per la massima velocità. Disattivato se in seguito ti servono il rilevamento dei candidati LCP o gli screenshot.',
  ['On for modern sites that 301 http→https anyway; off for legacy intranet.']:
    'Attivato per siti moderni che comunque reindirizzano 301 da http a https; disattivato per intranet legacy.',
  ['On for normal audits; off when you only want to inspect raw 3xx behaviour.']:
    'Attivato per audit normali; disattivato quando vuoi solo ispezionare il comportamento 3xx grezzo.',
  ['On for outbound link audits; off for fast internal-only crawls.']:
    'Attivato per audit dei link in uscita; disattivato per scansioni rapide solo interne.',
  ['On for performance-focused audits that should fail pages over a target.']:
    'Attivato per audit orientati alle prestazioni che devono bocciare le pagine oltre un obiettivo.',
  ['On for performance-focused audits.']: 'Attivato per audit orientati alle prestazioni.',
  ['On for production crawls. Off when debugging selector-not-found / hydration issues.']:
    'Attivato per scansioni di produzione. Disattivato quando si fa debug di problemi di selettore non trovato / idratazione.',
  ['ON for SEO audits (the typical case). Turn OFF to also cluster paginated / canonical-blocked variants for completeness.']:
    'ATTIVATO per audit SEO (il caso tipico). DISATTIVA per raggruppare anche le varianti paginate / bloccate da canonical, per completezza.',
  ["On for SEO audits that include Google's Mobile-Friendly checks."]:
    'Attivato per audit SEO che includono i controlli Mobile-Friendly di Google.',
  ['On for SEO audits where View Source matters; off for 1M-URL crawls where disk is tight.']:
    'Attivato per audit SEO in cui conta Visualizza sorgente; disattivato per scansioni da 1M di URL con poco spazio su disco.',
  ['ON for SEO audits. OFF only when you specifically need to inspect raw-URL collisions (e.g. case-sensitive filesystem CMSes).']:
    'ATTIVATO per audit SEO. DISATTIVA solo quando devi ispezionare specificamente le collisioni di URL grezzi (es. CMS con file system sensibile alle maiuscole).',
  ['On if you need nofollow attribute audits; off keeps the link graph cleaner.']:
    "Attivato se devi verificare l'attributo nofollow; disattivato mantiene il grafo dei link più pulito.",
  ['On if your CMS serves the same page at mixed casing (/Foo and /foo).']:
    'Attivato se il tuo CMS serve la stessa pagina con maiuscole miste (/Foo e /foo).',
  ['On if your site canonicalises to non-www but emits www links somewhere.']:
    'Attivato se il tuo sito canonicalizza senza www ma emette link con www da qualche parte.',
  ["On network errors, 408/425/429/5xx responses, retry up to N more times before giving up. Each retry counts toward the URL's response time budget."]:
    "Su errori di rete e risposte 408/425/429/5xx, ritenta fino a N volte in più prima di rinunciare. Ogni tentativo conta nel budget di tempo di risposta dell'URL.",
  ['On when auditing mobile UX or capturing PageSpeed-style mobile previews.']:
    'Attivato quando verifichi la UX mobile o catturi anteprime mobile in stile PageSpeed.',
  ["One header per line in 'Key: Value' format. Added to every request — useful for auth tokens or custom routing hints. User values override defaults when keys collide."]:
    "Un header per riga nel formato 'Chiave: Valore'. Aggiunto a ogni richiesta — utile per token di autenticazione o suggerimenti di routing personalizzati. I valori dell'utente sovrascrivono i predefiniti quando le chiavi coincidono.",
  ['One sitemap URL per line. On top of following links from the start URL, the crawler fetches these sitemaps and queues every page they list as an extra seed — faster/more complete discovery, and reliable orphan detection even when the sitemap lives at a non-standard path. Leave empty to disable.']:
    "Un URL di sitemap per riga. Oltre a seguire i link dall'URL iniziale, il crawler recupera queste sitemap e accoda ogni pagina elencata come seme aggiuntivo — scoperta più rapida/completa e rilevamento affidabile delle pagine orfane anche quando la sitemap si trova in un percorso non standard. Lascia vuoto per disabilitare.",
  ['One URL per line. Each is fetched exactly once; outlinks are NOT followed. Comments starting with # are ignored.']:
    'Un URL per riga. Ognuno viene recuperato esattamente una volta; i link in uscita NON vengono seguiti. I commenti che iniziano con # vengono ignorati.',
  ['OS scheduler hint applied at crawl start. Lowering priority lets the rest of the machine stay responsive during heavy crawls. May require elevated privileges on some platforms.']:
    "Suggerimento allo scheduler del SO applicato all'avvio della scansione. Abbassare la priorità lascia il resto della macchina reattivo durante scansioni pesanti. Può richiedere privilegi elevati su alcune piattaforme.",
  ["Page A→B declared but B→A absent flags 'Reciprocity Missing'; same lang on two hrefs flags 'Inconsistent Lang'."]:
    "Pagina A→B dichiarata ma B→A assente segnala 'Reciprocità mancante'; lo stesso lang su due href segnala 'Lang incoerente'.",
  ['Page that contains the broken link.']: 'Pagina che contiene il link interrotto.',
  ["Pages with > this many outgoing links (internal + external) trip the 'Total Links per Page' issue. Google's historic recommendation is 100; mega-menus/hub-pages routinely blow past this."]:
    "Le pagine con più di questo numero di link in uscita (interni + esterni) fanno scattare il problema 'Link totali per pagina'. La raccomandazione storica di Google è 100; mega-menu/pagine hub la superano regolarmente.",
  ['PASS = indexed · FAIL = not indexed · PART/NEU = discovered but not yet indexed']:
    'PASS = indicizzata · FAIL = non indicizzata · PART/NEU = scoperta ma non ancora indicizzata',
  ['Pattern: ^https://m\\.(.+) · Replacement: https://www.$1 · Flags: i  (collapse mobile subdomain to www)']:
    'Pattern: ^https://m\\.(.+) · Sostituzione: https://www.$1 · Flag: i  (accorpa il sottodominio mobile in www)',
  ["Per-request abort threshold. Pages that take longer than this are recorded as network errors. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — that one's in seconds, this is in milliseconds."]:
    "Soglia di interruzione per richiesta. Le pagine che impiegano più tempo vengono registrate come errori di rete. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — quello è in secondi, questo in millisecondi.",
  ['Persist rel="nofollow" links in the link graph. When off, nofollow links are dropped entirely (not counted in outlinks, not probed as externals). Screaming Frog inverse: turning this ON ≈ unchecking "Follow Internal/External Nofollow".']:
    'Conserva i link rel="nofollow" nel grafo dei link. Se disattivato, i link nofollow vengono scartati del tutto (non contati nei link in uscita, non sondati come esterni). Inverso di Screaming Frog: attivare questo ≈ deselezionare "Follow Internal/External Nofollow".',
  ['Picking a preset fills the User-Agent field below — you can still hand-edit it afterwards. Switch between Googlebot Smartphone / Desktop to compare how a site responds to mobile vs desktop crawlers.']:
    'Scegliere un preset riempie il campo User-Agent sottostante — puoi comunque modificarlo a mano dopo. Passa tra Googlebot Smartphone / Desktop per confrontare come un sito risponde ai crawler mobile e desktop.',
  ["Picks one of the saved profiles by name. Empty = use the Proxy URL field above (or env vars when that's also empty)."]:
    "Seleziona uno dei profili salvati per nome. Vuoto = usa il campo URL proxy sopra (o le variabili d'ambiente quando anche quello è vuoto).",
  ['Pre-computes Dead External Domain, Duplicate URL post-norm, Canonical Chain Multi-hop. Without this the sidebar shows 0 for those three.']:
    'Precalcola Dominio esterno morto, URL duplicato post-normalizzazione e Catena di canonical multi-salto. Senza questo la barra laterale mostra 0 per quei tre.',
  ['After the crawl, re-fetches a sample of indexable pages with the opposite user agent (mobile when the crawl ran as desktop, desktop otherwise) and compares title, H1, meta description, canonical, robots, word count and link count. Differences feed the \'Mobile / Desktop Mismatch\' issue and the report of the same name.']:
    'Dopo la scansione riscarica un campione di pagine indicizzabili con lo user agent opposto (mobile se la scansione era desktop, e viceversa) e confronta titolo, H1, meta description, canonical, robots, numero di parole e di link. Le differenze alimentano il problema \'Discrepanza mobile / desktop\' e il report omonimo.',
  ['How many pages the mobile-parity probe re-fetches, most-linked first. 0 = every indexable HTML page (doubles the crawl\'s traffic for that set).']:
    'Quante pagine riscarica la sonda di parità mobile, prima le più linkate. 0 = tutte le pagine HTML indicizzabili (raddoppia il traffico della scansione per quell\'insieme).',
  ["Probe outbound links to other hosts (HEAD only) so the Broken Links view catches dead externals. Screaming Frog: 'External Links' (Configuration → Spider → Crawl)."]:
    "Sonda i link in uscita verso altri host (solo HEAD) così la vista Link interrotti cattura gli esterni morti. Screaming Frog: 'External Links' (Configuration → Spider → Crawl).",
  ['Raw `Content-Security-Policy` response header. Empty when missing.']:
    'Header di risposta `Content-Security-Policy` grezzo. Vuoto quando assente.',
  ['Raw `content` attribute of `<meta http-equiv="refresh">`, e.g. "5; url=/foo".']:
    'Attributo `content` grezzo di `<meta http-equiv="refresh">`, es. "5; url=/foo".',
  ['Raw `Strict-Transport-Security` header. Empty when missing — for HTTPS pages this is a security regression.']:
    'Header `Strict-Transport-Security` grezzo. Vuoto quando assente — per le pagine HTTPS è una regressione di sicurezza.',
  ['Raw `X-Content-Type-Options` header. `nosniff` blocks MIME sniffing — prevents some XSS via content-type confusion.']:
    'Header `X-Content-Type-Options` grezzo. `nosniff` blocca lo sniffing MIME — previene alcuni XSS da confusione di content-type.',
  ['Raw `X-Frame-Options` header. SAMEORIGIN / DENY / ALLOW-FROM. Clickjacking defence.']:
    'Header `X-Frame-Options` grezzo. SAMEORIGIN / DENY / ALLOW-FROM. Difesa dal clickjacking.',
  ['Raw value of the Content-Type response header (incl. charset).']:
    "Valore grezzo dell'header di risposta Content-Type (incl. charset).",
  ['Re-renders each page on a mobile viewport and checks viewport meta tag, horizontal overflow, font size legibility, and tap-target spacing. Stores a pass/fail verdict on the urls table.']:
    "Ri-renderizza ogni pagina in un viewport mobile e controlla il meta tag viewport, l'overflow orizzontale, la leggibilità della dimensione del font e la spaziatura dei target touch. Memorizza un verdetto superato/fallito nella tabella urls.",
  ['Read the full article →']: "Leggi l'articolo completo →",
  ["Reject-all = ignore Set-Cookie entirely (zero counts on cookie-flag issues). Block-third-party = analyse only first-party cookies (Domain attribute matches the page's registrable domain). Accept-all = analyse every Set-Cookie regardless of scope."]:
    "Rifiuta tutto = ignora completamente Set-Cookie (conteggi zero sui problemi di flag dei cookie). Blocca terze parti = analizza solo i cookie di prima parte (l'attributo Domain corrisponde al dominio registrabile della pagina). Accetta tutto = analizza ogni Set-Cookie a prescindere dall'ambito.",
  ["Reject-all for stateless audits; Block-third-party to focus on the site's own cookie hygiene; Accept-all to also see ad/analytics tracker cookies."]:
    "Rifiuta tutto per audit senza stato; Blocca terze parti per concentrarti sull'igiene dei cookie del sito stesso; Accetta tutto per vedere anche i cookie dei tracker pubblicitari/di analisi.",
  ["Removes the leading 'www.' from the host at normalisation time. The seen-set, redirect graph, and link extraction all use the rewritten form, so duplicates collapse correctly."]:
    "Rimuove il 'www.' iniziale dall'host in fase di normalizzazione. Il set dei visti, il grafo dei reindirizzamenti e l'estrazione dei link usano tutti la forma riscritta, così i duplicati si accorpano correttamente.",
  ['Renders the page a second time on a mobile viewport and stores an above-the-fold PNG. Adds another full render + screenshot per URL.']:
    'Renderizza la pagina una seconda volta in un viewport mobile e memorizza un PNG above-the-fold. Aggiunge un altro rendering completo + screenshot per URL.',
  ['Resolved absolute URL of the <img src> attribute.']:
    "URL assoluto risolto dell'attributo <img src>.",
  ['Response body size in bytes (compressed transfer size, post-Content-Encoding).']:
    'Dimensione del corpo della risposta in byte (dimensione di trasferimento compressa, dopo Content-Encoding).',
  ['Rewrites http:// to https:// before fetching. Breaks HTTP-only sites.']:
    'Riscrive http:// in https:// prima del recupero. Rompe i siti solo HTTP.',
  ['Run Chromium without a visible window. Turn off to debug rendering visually — useful when a page renders correctly in a normal browser but not under Playwright.']:
    'Esegui Chromium senza finestra visibile. Disattiva per fare debug del rendering visivamente — utile quando una pagina si renderizza correttamente in un browser normale ma non sotto Playwright.',
  ['Run the login steps once before the crawl, then replay the session cookies on every request.']:
    'Esegui i passaggi di accesso una volta prima della scansione, poi riusa i cookie di sessione su ogni richiesta.',
  ["Runs iterative PageRank (damping 0.85) over the internal link graph and normalises it to a 0–100 Link Score per page. Drives the Link Score column and the 'By Link Score' visualization colour mode."]:
    "Esegue PageRank iterativo (smorzamento 0.85) sul grafo dei link interni e lo normalizza in un Punteggio link 0–100 per pagina. Alimenta la colonna Punteggio link e la modalità colore 'Per punteggio link' della visualizzazione.",
  ['Sends the URL through the same normalisation pipeline used by the crawler, with your unsaved settings applied. Useful for verifying regex rules before kicking off a crawl.']:
    "Passa l'URL attraverso la stessa pipeline di normalizzazione usata dal crawler, con le tue impostazioni non salvate applicate. Utile per verificare le regole regex prima di avviare una scansione.",
  ['Sent on every request as the User-Agent header. Identifies the crawler to servers; some sites serve different content based on UA.']:
    'Inviato in ogni richiesta come header User-Agent. Identifica il crawler ai server; alcuni siti servono contenuti diversi in base allo UA.',
  ['Sent on every request. Affects which locale a multi-lingual site serves you.']:
    'Inviato in ogni richiesta. Influisce su quale lingua ti serve un sito multilingue.',
  ["Sent verbatim as `Bearer <token>`. Don't include the `Bearer ` prefix yourself."]:
    "Inviato così com'è come `Bearer <token>`. Non includere tu stesso il prefisso `Bearer `.",
  ['Server response time (a TTFB proxy) measured during the crawl. Pages slower than this are flagged. Google considers a good server response time under 800 ms.']:
    "Tempo di risposta del server (un'approssimazione del TTFB) misurato durante la scansione. Le pagine più lente vengono segnalate. Google considera buono un tempo di risposta del server inferiore a 800 ms.",
  ['Shop the latest game keys at unbeatable prices…']:
    'Acquista le ultime chiavi di gioco a prezzi imbattibili…',
  ["Skips body parsing for pages whose Content-Length header exceeds this. The page row is still created so links to it aren't lost; only body parsing and source snapshot capture are skipped."]:
    "Salta l'analisi del corpo per le pagine il cui header Content-Length supera questo valore. La riga della pagina viene comunque creata così i link verso di essa non vanno persi; vengono saltate solo l'analisi del corpo e la cattura del sorgente.",
  ['Sleep this long on each worker AFTER a response completes, before it picks up the next URL. Stacks with the global RPS cap — useful for sites that rate-limit on inter-request gap rather than total throughput.']:
    "Metti in pausa ogni worker per questo tempo DOPO il completamento di una risposta, prima che prenda l'URL successivo. Si somma al tetto RPS globale — utile per siti che limitano in base all'intervallo tra richieste anziché al throughput totale.",
  ['Specific reason a URL is non-indexable. For Indexable URLs this column is empty.']:
    'Motivo specifico per cui un URL non è indicizzabile. Per gli URL indicizzabili questa colonna è vuota.',
  ['Spider follows links from the start URL across the chosen scope. List fetches a fixed set of URLs once with no link-following. Sitemap fetches a sitemap URL and crawls every page it lists (no link-following).']:
    "Spider segue i link dall'URL iniziale nell'ambito scelto. Lista recupera un insieme fisso di URL una volta senza seguire i link. Sitemap recupera un URL di sitemap e scansiona ogni pagina elencata (senza seguire i link).",
  ["Spider for full site audits; List for re-checking a known set of pages; Sitemap to audit exactly what's published in sitemap.xml."]:
    'Spider per audit completi del sito; Lista per ricontrollare un insieme noto di pagine; Sitemap per verificare esattamente ciò che è pubblicato in sitemap.xml.',
  ['Standard CSS selector — same syntax as `document.querySelectorAll`.']:
    'Selettore CSS standard — stessa sintassi di `document.querySelectorAll`.',
  ['Stored in your local prefs file as plain text. Treat the file accordingly.']:
    'Memorizzato nel tuo file di preferenze locale in testo in chiaro. Tratta il file di conseguenza.',
  ['Strip if your site canonicalises /foo (no slash); Add for sites that canonicalise /foo/.']:
    'Rimuovi se il tuo sito canonicalizza /foo (senza barra); Aggiungi per siti che canonicalizzano /foo/.',
  ['Sunset over the mountain ridge']: 'Tramonto sul crinale della montagna',
  ['Surplus `@id` occurrences across all JSON-LD blocks (page declares the same `@id` more than once).']:
    'Occorrenze in eccesso di `@id` in tutti i blocchi JSON-LD (la pagina dichiara lo stesso `@id` più di una volta).',
  ['Terminal URL the redirect chain resolves to. Empty when this row is itself the terminal (i.e. status is 2xx/4xx/5xx) or when the chain hits a loop.']:
    'URL finale a cui si risolve la catena di reindirizzamenti. Vuoto quando questa riga è essa stessa il terminale (cioè stato 2xx/4xx/5xx) o quando la catena entra in un ciclo.',
  ['Canonical hops walked after this page (or, on a redirect row, after the redirect\'s final URL) until a page that canonicalises to itself. 0 when the canonical is the page itself or absent.']:
    'Salti canonical percorsi dopo questa pagina (o, su una riga di reindirizzamento, dopo l\'URL finale del reindirizzamento) fino a una pagina che si canonicalizza da sola. 0 quando il canonical è la pagina stessa o è assente.',
  ['Where the canonical chain ends. Empty when the page is its own canonical, or when the chain loops.']:
    'Dove termina la catena canonical. Vuoto quando la pagina è il proprio canonical o quando la catena entra in loop.',
  ['text for visible content, attribute for href/src, count for occurrence count']:
    'text per il contenuto visibile, attribute per href/src, count per il numero di occorrenze',
  ['Text of the first <h1> on the page. Should match user intent and ideally complement (not duplicate) the title.']:
    "Testo del primo <h1> della pagina. Dovrebbe corrispondere all'intento dell'utente e idealmente integrare (non duplicare) il titolo.",
  ["Text Only fetches the raw HTML response as-is — fast and deterministic. Old AJAX Crawling Scheme rewrites hashbang (#!) URLs to Google's deprecated ?_escaped_fragment_= form so a pre-rendering server returns the snapshot. Full JavaScript rendering is a V2 item."]:
    "Solo testo recupera la risposta HTML grezza così com'è — veloce e deterministico. Il vecchio AJAX Crawling Scheme riscrive gli URL hashbang (#!) nella forma deprecata di Google ?_escaped_fragment_= così che un server di pre-rendering restituisca lo snapshot. Il rendering JavaScript completo è un elemento della V2.",
  ['Text Only for server-rendered / static sites; Old AJAX only for legacy hashbang SPAs.']:
    'Solo testo per siti statici / renderizzati lato server; Vecchio AJAX solo per SPA hashbang legacy.',
  ["The column / JSON-key name for this rule's output. Free-form."]:
    "Nome della colonna / chiave JSON per l'output di questa regola. Testo libero.",
  ['The fully normalised URL of the crawled resource (post URL-rewriting).']:
    "L'URL completamente normalizzato della risorsa scansionata (dopo la riscrittura degli URL).",
  ['The URL that fails to resolve (4xx/5xx/network error).']:
    "L'URL che non si risolve (4xx/5xx/errore di rete).",
  ['Third-party `<script>` / `<link rel=stylesheet>` references without an `integrity=` attribute. SRI is recommended for any cross-origin subresource.']:
    'Riferimenti di terze parti `<script>` / `<link rel=stylesheet>` senza attributo `integrity=`. SRI è consigliato per qualsiasi sottorisorsa cross-origin.',
  ['Time-to-first-byte in milliseconds (network + server, excluding parse). Lower is better; >2000 ms is slow.']:
    "Tempo al primo byte in millisecondi (rete + server, esclusa l'analisi). Più basso è meglio; >2000 ms è lento.",
  ['Total number of <h1> elements on the page. SEO best practice is exactly 1.']:
    'Numero totale di elementi <h1> nella pagina. La buona pratica SEO è esattamente 1.',
  ['Total number of <h2> elements on the page.']: 'Numero totale di elementi <h2> nella pagina.',
  ['tr,en;q=0.8 — Turkish first, English fallback.']:
    'tr,en;q=0.8 — turco per primo, inglese come fallback.',
  ["Trips 'Folder Depth Too Deep' when the URL path's `/`-segment count exceeds this. Useful for spotting over-nested URL structures that bury content from crawlers."]:
    "Fa scattare 'Profondità cartelle eccessiva' quando il numero di segmenti `/` del percorso URL supera questo valore. Utile per individuare strutture URL troppo annidate che seppelliscono i contenuti per i crawler.",
  ["Trips 'Long Query String' when LENGTH(query) > this. Typical session-id sprawl + UTM tracking hits 100+ chars; over 200 starts to look like a bug."]:
    "Fa scattare 'Query string lunga' quando LENGTH(query) > questo valore. La tipica proliferazione di id di sessione + tracciamento UTM arriva a 100+ caratteri; oltre 200 inizia a sembrare un bug.",
  ["Trips the 'URL Too Long' issue when LENGTH(url) > this. RFC 7230 doesn't mandate a max but most servers + middleboxes fail above ~2 KB; Chrome itself caps at ~32 KB."]:
    "Fa scattare il problema 'URL troppo lungo' quando LENGTH(url) > questo valore. L'RFC 7230 non impone un massimo, ma la maggior parte di server e middlebox fallisce oltre ~2 KB; Chrome stesso limita a ~32 KB.",
  ["Two modes per line. (1) Wrap in slashes for a regex: /pattern/flags — supported flags imsuy (g is forced). Invalid patterns appear with count -1 in the detail panel so you can spot the typo. (2) Anything else is a literal case-insensitive substring — the legacy behaviour. Each term's per-page hit count is surfaced in the URL Details panel."]:
    'Due modalità per riga. (1) Racchiudi tra barre per una regex: /pattern/flag — flag supportati imsuy (g è forzato). I pattern non validi compaiono con conteggio -1 nel pannello di dettaglio così individui il refuso. (2) Qualsiasi altra cosa è una sottostringa letterale senza distinzione di maiuscole — il comportamento legacy. Il conteggio delle occorrenze per pagina di ogni termine compare nel pannello Dettagli URL.',
  ["Two pages are flagged as near-duplicates if their 64-bit SimHash differs by at most this many bits. 3 ≈ 95% similarity over body-text shingles (Screaming Frog's tightest filter). Set to 0 to skip clustering entirely."]:
    'Due pagine sono segnalate come quasi duplicate se il loro SimHash a 64 bit differisce al massimo di questo numero di bit. 3 ≈ 95% di somiglianza sugli shingle del testo del corpo (il filtro più stretto di Screaming Frog). Imposta 0 per saltare del tutto il raggruppamento.',
  ['URL declared by the first <link rel="canonical"> tag. Tells search engines which version to index when duplicates exist.']:
    'URL dichiarato dal primo tag <link rel="canonical">. Indica ai motori di ricerca quale versione indicizzare quando esistono duplicati.',
  ['URL paths ending in any of these extensions are not enqueued. Case-insensitive. Start URL is always crawled regardless.']:
    "I percorsi URL che terminano con una di queste estensioni non vengono accodati. Senza distinzione di maiuscole. L'URL iniziale viene comunque sempre scansionato.",
  ['Value of the alt attribute. Empty cell = no alt declared (accessibility/SEO issue).']:
    "Valore dell'attributo alt. Cella vuota = nessun alt dichiarato (problema di accessibilità/SEO).",
  ['Value of the X-Robots-Tag HTTP response header. Same semantics as meta robots but applied at the server.']:
    "Valore dell'header di risposta HTTP X-Robots-Tag. Stessa semantica di meta robots ma applicata sul server.",
  ['Viewport height — affects above-the-fold detection and lazy-load triggers.']:
    'Altezza del viewport — influisce sul rilevamento above-the-fold e sui trigger di lazy-load.',
  ['Viewport width applied to every rendered page. Mobile audits typically use 360–414, desktop 1280–1920.']:
    'Larghezza del viewport applicata a ogni pagina renderizzata. Gli audit mobile usano tipicamente 360–414, desktop 1280–1920.',
  ['Visible body text word count (excludes <script>/<style>). Useful for identifying thin content.']:
    'Conteggio delle parole del testo visibile del corpo (esclusi <script>/<style>). Utile per identificare contenuti scarni.',
  ['Wait this long before the FIRST retry, doubling on each subsequent attempt (500 → 1000 → 2000 …).']:
    'Attendi questo tempo prima del PRIMO nuovo tentativo, raddoppiando a ogni tentativo successivo (500 → 1000 → 2000 …).',
  ["Walks 3xx redirect chains, fills `redirect_chain_length` / `redirect_loop`. Drives the 'Long Chain' and 'Redirect Loop' issues + the Redirects tab."]:
    "Percorre le catene di reindirizzamento 3xx e compila `redirect_chain_length` / `redirect_loop`. Alimenta i problemi 'Catena lunga' e 'Ciclo di reindirizzamento' + la scheda Reindirizzamenti.",
  ['Welcome to Example Store']: 'Benvenuto nel Negozio di esempio',
  ['What to do when multiple matches exist.']: 'Cosa fare quando esistono più corrispondenze.',
  ['What to read off each matched element. Ignored for an XPath `/@attr` or `/text()` terminal — that value is used directly.']:
    'Cosa leggere da ogni elemento corrispondente. Ignorato per un terminale XPath `/@attr` o `/text()` — quel valore viene usato direttamente.',
  ['When non-empty, ALL query parameters not on this list are dropped during normalisation (case-insensitive name match). Leave empty to keep the default behaviour, which strips just utm_*, fbclid, gclid, mc_cid, and mc_eid.']:
    'Se non vuoto, TUTTI i parametri di query non presenti in questa lista vengono eliminati durante la normalizzazione (corrispondenza del nome senza distinzione di maiuscole). Lascia vuoto per mantenere il comportamento predefinito, che rimuove solo utm_*, fbclid, gclid, mc_cid e mc_eid.',
  ['When off, no budget evaluation runs and the verdict column is cleared. When on, the post-crawl pass scores every internal 200 HTML page against the ceilings below.']:
    'Se disattivato, non viene eseguita alcuna valutazione del budget e la colonna del verdetto viene svuotata. Se attivato, la passata post-scansione valuta ogni pagina HTML 200 interna rispetto ai tetti sottostanti.',
  ['When on (default), pagination_next + pagination_prev URLs are post-fetch enqueued. Off only to debug pagination-only loops without disabling all link follow.']:
    'Se attivato (predefinito), gli URL pagination_next + pagination_prev vengono accodati dopo il recupero. Disattiva solo per fare debug di cicli di sola paginazione senza disabilitare tutto il follow dei link.',
  ['When ON (default), the Duplicate URL filter compares URLs after lowercasing the host, dropping the query string, and trimming the trailing slash — the canonical SEO behaviour. When OFF, comparison is byte-exact, so the filter only fires on rows that share an identical raw URL string (rare since URLs are deduped at insert time).']:
    "Se ATTIVATO (predefinito), il filtro URL duplicato confronta gli URL dopo aver reso minuscolo l'host, rimosso la query string e tolto la barra finale — il comportamento SEO canonico. Se DISATTIVATO, il confronto è byte per byte, quindi il filtro scatta solo su righe che condividono una stringa URL grezza identica (raro, perché gli URL vengono deduplicati all'inserimento).",
  ["When on, `<meta http-equiv='refresh'>` content URLs are enqueued like a redirect target. window.location body redirects are heuristic-only and currently out of scope."]:
    "Se attivato, gli URL nel content di `<meta http-equiv='refresh'>` vengono accodati come una destinazione di reindirizzamento. I reindirizzamenti window.location nel corpo sono solo euristici e attualmente fuori ambito.",
  ['When on, a 200 page declaring a canonical pointing elsewhere also enqueues that target. Default off — most crawls treat canonicals as a signal, not a navigation hint.']:
    'Se attivato, una pagina 200 che dichiara un canonical verso altrove accoda anche quella destinazione. Disattivato per impostazione predefinita — la maggior parte delle scansioni tratta i canonical come un segnale, non come un suggerimento di navigazione.',
  ['When on, pages with noindex / canonicalised / robots-blocked indexability are excluded from clustering — the Near-Duplicate report then surfaces only issues that affect search visibility.']:
    'Se attivato, le pagine con indicizzabilità noindex / canonicalizzata / bloccata da robots vengono escluse dal raggruppamento — il report Quasi duplicati mostra allora solo i problemi che influiscono sulla visibilità nei motori di ricerca.',
  ["When on, rel=nofollow links are recursed into like any other link. Default off — Screaming Frog 'Respect Nofollow' default."]:
    "Se attivato, i link rel=nofollow vengono percorsi come qualsiasi altro link. Disattivato per impostazione predefinita — comportamento predefinito 'Respect Nofollow' di Screaming Frog.",
  ['When Playwright considers navigation complete. domcontentloaded = HTML parsed but resources still loading. load = window.load fired. networkidle = no network activity for 500ms (best for SPA but slower). commit = just response committed (fastest, riskiest).']:
    'Quando Playwright considera completata la navigazione. domcontentloaded = HTML analizzato ma risorse ancora in caricamento. load = window.load scattato. networkidle = nessuna attività di rete per 500 ms (ideale per SPA ma più lento). commit = solo risposta confermata (il più veloce, il più rischioso).',
  ['Whether the broken target is on the same site (internal) or a different host (external).']:
    'Se la destinazione interrotta è sullo stesso sito (interno) o su un altro host (esterno).',
  ['Whether the URL is eligible to appear in search results. Combines status code, robots directives, canonical, and meta-refresh signals.']:
    "Se l'URL può comparire nei risultati di ricerca. Combina codice di stato, direttive robots, canonical e segnali di meta-refresh.",
  ['Width attribute value (in pixels) declared on the <img> tag, when present.']:
    "Valore dell'attributo width (in pixel) dichiarato sul tag <img>, quando presente.",
  ['XPath 1.0 subset over the parsed DOM. End in `/@attr` or `/text()` to read an attribute / text node. Predicates: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.']:
    'Sottoinsieme di XPath 1.0 sul DOM analizzato. Termina con `/@attr` o `/text()` per leggere un attributo / nodo di testo. Predicati: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.',
  ['Y when the page declares hreflang alternates but no entry whose `href` matches the page URL. Google requires a self-reference.']:
    "Y quando la pagina dichiara alternative hreflang ma nessuna voce il cui `href` corrisponde all'URL della pagina. Google richiede un'autoreferenza.",
  ['Y when the redirect chain originating at this URL contains a cycle (A → B → A) detected by the cycle-safe walker; the chain is otherwise unwalked.']:
    'Y quando la catena di reindirizzamenti che parte da questo URL contiene un ciclo (A → B → A) rilevato dal percorso a prova di cicli; altrimenti la catena non viene percorsa.',
  ['Y when this URL belongs to a paginated cluster whose ordinal sequence has a gap (e.g. ?page=1, 2, 4 — page 3 missing). Set by the post-crawl `recomputePaginationSequence` pass.']:
    'Y quando questo URL appartiene a un gruppo paginato la cui sequenza ordinale ha un buco (es. ?page=1, 2, 4 — manca la pagina 3). Impostato dalla passata `recomputePaginationSequence` post-scansione.',
  ['SQL injection — the request tries to smuggle SQL into a parameter (UNION SELECT, sleep(), error-based functions) to read or alter your database.']:
    'SQL injection — la richiesta tenta di inserire SQL in un parametro (UNION SELECT, sleep(), funzioni basate su errori) per leggere o alterare il tuo database.',
  ['Cross-site scripting — the request carries script markup or a javascript: URL in a parameter, hoping the page echoes it back into the HTML unescaped.']:
    "Cross-site scripting — la richiesta contiene markup di script o un URL javascript: in un parametro, sperando che la pagina lo restituisca nell'HTML senza escape.",
  ['Path traversal — the request walks out of the web root with ../ or encoded variants to reach files like /etc/passwd or win.ini.']:
    'Path traversal — la richiesta esce dalla root web con ../ o varianti codificate per raggiungere file come /etc/passwd o win.ini.',
  ['Command injection — the request appends shell syntax (;, |, backticks, $( )) to a parameter to run commands on the server.']:
    'Command injection — la richiesta aggiunge sintassi di shell (;, |, backtick, $( )) a un parametro per eseguire comandi sul server.',
  ['Scanner probe — an automated vulnerability scanner walking a wordlist of known admin panels, installers and exploit paths (wp-login, phpmyadmin, /actuator, shell uploads). Not tailored to your site; it hits everyone.']:
    'Sonda di scanner — uno scanner di vulnerabilità automatizzato che scorre una lista di pannelli di amministrazione, installer e percorsi di exploit noti (wp-login, phpmyadmin, /actuator, upload di shell). Non è mirato al tuo sito; colpisce tutti.',
  ['Sensitive file fetch — a direct request for something that must never be public: .env, .git, backups, SQL dumps, private keys, config files.']:
    'Recupero di file sensibile — una richiesta diretta di qualcosa che non deve mai essere pubblico: .env, .git, backup, dump SQL, chiavi private, file di configurazione.',
  ['Anomaly — malformed or evasive input (null bytes, CRLF injection, over-encoding, absurd parameter lengths) that matches no single attack class but is not a normal browser request.']:
    'Anomalia — input malformato o evasivo (byte nulli, injection CRLF, sovra-codifica, lunghezze di parametro assurde) che non corrisponde a nessuna classe di attacco specifica ma non è una normale richiesta di browser.',
  ['Sum of the weights of every attack signature the request matched. Each signature carries a weight by how conclusive it is (a UNION SELECT weighs 9, a stray quote 2), and a line is only flagged once the total reaches 5 — so one decisive pattern flags on its own, while weak hints have to add up. Higher score = less room for a false positive; sort by it to triage.']:
    'Somma dei pesi di ogni firma di attacco a cui la richiesta ha corrisposto. Ogni firma ha un peso in base a quanto è conclusiva (un UNION SELECT pesa 9, una virgoletta vagante 2), e una riga viene segnalata solo quando il totale raggiunge 5 — così un pattern decisivo si segnala da solo, mentre gli indizi deboli devono sommarsi. Punteggio più alto = meno margine per un falso positivo; ordina per questo per fare triage.',
  ['Which attack class the strongest matching signature belongs to: SQL injection, XSS, path traversal, command injection, scanner probe, sensitive file, or anomaly. Hover any badge in this column for what that class means in practice.']:
    'A quale classe di attacco appartiene la firma corrispondente più forte: SQL injection, XSS, path traversal, command injection, sonda di scanner, file sensibile o anomalia. Passa il mouse su qualsiasi badge in questa colonna per sapere cosa significa quella classe in pratica.',
  ["Filters on the Status column — the most recent response the log recorded for that path. The analyzer keeps one status per URL rather than a full distribution, so this answers 'what is this URL returning now'. Paths whose status could not be parsed are hidden while a class is selected."]:
    "Filtra sulla colonna Stato — la risposta più recente che il log ha registrato per quel percorso. L'analizzatore conserva uno stato per URL anziché una distribuzione completa, quindi risponde a 'cosa restituisce ora questo URL'. I percorsi il cui stato non è stato analizzabile sono nascosti mentre è selezionata una classe.",
  ['Most recent HTTP status the log recorded for this path. One value per URL, not a distribution — a path that returned 200 all week and 404 this morning shows 404.']:
    'Stato HTTP più recente che il log ha registrato per questo percorso. Un valore per URL, non una distribuzione — un percorso che ha restituito 200 tutta la settimana e 404 stamattina mostra 404.',
  ['A URL whose path repeats the same segment this many times or more (/shop/shop/shop/…) is treated as a link loop and skipped. This shape comes from a relative-href bug and has no legitimate counterpart. Skipped counts are reported when the crawl finishes.']:
    'Un URL il cui percorso ripete lo stesso segmento almeno questo numero di volte (/shop/shop/shop/…) viene trattato come un ciclo di link e saltato. Questa forma deriva da un bug di href relativo e non ha una controparte legittima. I conteggi saltati vengono riportati al termine della scansione.',
  ['3 is safe for every site; raise to 4–5 only if a real path legitimately repeats a segment; 0 disables the guard.']:
    '3 è sicuro per ogni sito; alza a 4–5 solo se un percorso reale ripete legittimamente un segmento; 0 disabilita la protezione.',
  ['URLs with more query parameters than this are flagged as faceted-navigation traps under Issues → URL → Crawl Trap. Detection only — the URLs are still crawled, because legitimate filter pages look the same.']:
    'Gli URL con più parametri di query di questo valore vengono segnalati come trappole di navigazione a faccette in Problemi → URL → Trappola di scansione. Solo rilevamento — gli URL vengono comunque scansionati, perché le pagine di filtro legittime hanno lo stesso aspetto.',
  ['4 surfaces most faceted-nav explosions; 0 disables the check.']:
    '4 fa emergere la maggior parte delle esplosioni di navigazione a faccette; 0 disabilita il controllo.',
  ["Honor Allow / Disallow rules declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "Rispetta le regole Allow / Disallow dichiarate in /robots.txt per lo User-Agent configurato. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt).",
  ["Honor a Crawl-delay directive as a global rate limit (one request every N seconds). Crawl-delay is not part of RFC 9309 — Google ignores it and Screaming Frog does not implement it — and published values are often stale: 'Crawl-delay: 30' turns a 500-URL crawl into hours. Ignored by default; the directive is still reported in the log when found."]:
    "Rispetta una direttiva Crawl-delay come limite di frequenza globale (una richiesta ogni N secondi). Crawl-delay non fa parte dell'RFC 9309 — Google lo ignora e Screaming Frog non lo implementa — e i valori pubblicati sono spesso obsoleti: 'Crawl-delay: 30' trasforma una scansione da 500 URL in ore. Ignorato per impostazione predefinita; la direttiva viene comunque riportata nel log quando trovata.",
  ['Off (default) for normal audits. On when an ops policy requires it — expect the crawl to take Crawl-delay seconds per URL.']:
    'Disattivato (predefinito) per audit normali. Attivato quando una policy operativa lo richiede — aspettati che la scansione impieghi Crawl-delay secondi per URL.',
  ['Crawl fetches internal <img> targets (incl. srcset / <picture> sources) so each appears in the Internal tab with status, content type, and size — every one counts toward Max URLs. Store keeps the <img> declarations in the Images tab, which works even with Crawl off: you get the full image inventory with alt text for the cost of zero extra requests.']:
    "Scansiona recupera le destinazioni <img> interne (incl. srcset / sorgenti <picture>) così ognuna compare nella scheda Interni con stato, tipo di contenuto e dimensione — ognuna conta ai fini di Max URL. Memorizza conserva le dichiarazioni <img> nella scheda Immagini, che funziona anche con Scansiona disattivato: ottieni l'inventario completo delle immagini con testo alt al costo di zero richieste extra.",
  ['Store on, Crawl off is the cheap alt-text audit. Both on for a full image health check.']:
    "Memorizza attivato, Scansiona disattivato è l'audit economico del testo alt. Entrambi attivati per un controllo completo della salute delle immagini.",
  ['<video> / <audio> and the <source> children they own. Off by default — media files are large and rarely what an SEO crawl is looking for.']:
    '<video> / <audio> e i figli <source> che possiedono. Disattivato per impostazione predefinita — i file multimediali sono grandi e raramente sono ciò che cerca una scansione SEO.',
  ['On when auditing a video-heavy site for dead media URLs.']:
    'Attivato quando verifichi un sito ricco di video alla ricerca di URL multimediali morti.',
  ["<link rel=stylesheet> targets. Crawling a stylesheet is also what discovers the web fonts and background images declared inside it via @font-face / url() — so Crawl on with Store off still populates the Internal tab's Font filter without listing every stylesheet."]:
    'Destinazioni di <link rel=stylesheet>. Scansionare un foglio di stile è anche ciò che scopre i web font e le immagini di sfondo dichiarati al suo interno tramite @font-face / url() — quindi Scansiona attivato con Memorizza disattivato popola comunque il filtro Font della scheda Interni senza elencare ogni foglio di stile.',
  ['Crawl on, Store off when you want fonts discovered but not hundreds of CSS rows.']:
    'Scansiona attivato, Memorizza disattivato quando vuoi scoprire i font ma non centinaia di righe CSS.',
  ['<script src> targets, fetched so each gets its own row with status code, content type, and size. Headers only — the body is discarded, never executed.']:
    'Destinazioni di <script src>, recuperate così ognuna ha la propria riga con codice di stato, tipo di contenuto e dimensione. Solo header — il corpo viene scartato, mai eseguito.',
  ['Both on to catch 404ing bundles; both off for HTML-only crawls.']:
    'Entrambi attivati per catturare bundle in 404; entrambi disattivati per scansioni solo HTML.',
  ['<a href> targets on the same site. Crawl off turns the run into an audit of a fixed set of pages — sitemaps, canonicals, and the other declared alternates below still feed discovery. Store off empties the link graph: inlinks, outlinks, anchor-text reports, and link score all go with it.']:
    "Destinazioni di <a href> sullo stesso sito. Scansiona disattivato trasforma l'esecuzione in un audit di un insieme fisso di pagine — sitemap, canonical e le altre alternative dichiarate sotto alimentano comunque la scoperta. Memorizza disattivato svuota il grafo dei link: link in entrata, in uscita, report dei testi di ancoraggio e punteggio link se ne vanno con esso.",
  ['Leave both on. Crawl off only when a sitemap or URL list already defines the exact set you want.']:
    "Lascia entrambi attivati. Scansiona disattivato solo quando una sitemap o una lista di URL definisce già l'insieme esatto che vuoi.",
  ['Outbound links to other hosts are always status-checked (one HEAD each) so Broken Links catches dead externals — that does not depend on this row. Crawl here means fully crawling those pages, following their links onward too. Store keeps outbound links in the link graph.']:
    'I link in uscita verso altri host vengono sempre controllati per stato (un HEAD ciascuno) così Link interrotti cattura gli esterni morti — questo non dipende da questa riga. Scansiona qui significa scansionare completamente quelle pagine, seguendo anche i loro link. Memorizza conserva i link in uscita nel grafo dei link.',
  ['Crawl off (default) — status-check externals without spidering the whole web.']:
    "Scansiona disattivato (predefinito) — controlla lo stato degli esterni senza scansionare l'intero web.",
  ['<link rel=canonical> and its HTTP Link: header form. Crawl also enqueues the canonical target, treating it as a navigation hint. Store feeds the Canonicals tab and every canonical issue filter.']:
    '<link rel=canonical> e la sua forma di header HTTP Link:. Scansiona accoda anche la destinazione canonical, trattandola come un suggerimento di navigazione. Memorizza alimenta la scheda Canonical e ogni filtro problema sui canonical.',
  ['Crawl off (default) — canonicals are a signal, not a route. Store on.']:
    'Scansiona disattivato (predefinito) — i canonical sono un segnale, non un percorso. Memorizza attivato.',
  ['<link rel=next> / <link rel=prev>. Part of the standard discovery graph; turn Crawl off to isolate a pagination loop without disabling link-following everywhere.']:
    '<link rel=next> / <link rel=prev>. Parte del grafo di scoperta standard; disattiva Scansiona per isolare un ciclo di paginazione senza disabilitare il follow dei link ovunque.',
  ['Both on unless you are debugging an infinite paginated series.']:
    'Entrambi attivati a meno che tu non stia facendo debug di una serie paginata infinita.',
  ['<link rel=alternate hreflang>. Crawl enqueues every declared alternate, which is how you reach language versions nothing links to. Store feeds the Hreflang tab and the reciprocity / invalid-code audits.']:
    '<link rel=alternate hreflang>. Scansiona accoda ogni alternativa dichiarata, ed è così che raggiungi versioni linguistiche a cui nulla punta. Memorizza alimenta la scheda Hreflang e gli audit di reciprocità / codice non valido.',
  ['Crawl on for a multi-language audit — otherwise unlinked locales stay invisible.']:
    'Scansiona attivato per un audit multilingue — altrimenti le lingue non linkate restano invisibili.',
  ['<link rel=amphtml>. Crawl fetches the AMP variant as its own URL; Store keeps the declaration plus the AMP smoke-validator findings.']:
    '<link rel=amphtml>. Scansiona recupera la variante AMP come URL a sé; Memorizza conserva la dichiarazione più i risultati del validatore AMP di base.',
  ['Crawl on only if the site still ships AMP pages.']:
    'Scansiona attivato solo se il sito pubblica ancora pagine AMP.',
  ['<meta http-equiv="refresh">. Crawl enqueues the parsed target like a redirect; Store keeps the raw directive and its URL for the Meta Refresh tab.']:
    '<meta http-equiv="refresh">. Scansiona accoda la destinazione analizzata come un reindirizzamento; Memorizza conserva la direttiva grezza e il suo URL per la scheda Meta Refresh.',
  ['Crawl on when auditing a legacy site that still redirects this way.']:
    'Scansiona attivato quando verifichi un sito legacy che reindirizza ancora in questo modo.',
  ["<iframe src> documents. Crawl fetches each embedded page as its own URL, which can pull in a lot of third-party surface. Store records them in the link graph so a dead embed shows up in Outlinks and Broken Links — without counting toward the page's outlink total, since an embed is not a hyperlink."]:
    'Documenti <iframe src>. Scansiona recupera ogni pagina incorporata come URL a sé, il che può trascinare dentro molta superficie di terze parti. Memorizza li registra nel grafo dei link così un embed morto compare in Link in uscita e Link interrotti — senza contare nel totale dei link in uscita della pagina, perché un embed non è un collegamento ipertestuale.',
  ['Store on, Crawl off is usually the right pair.']:
    'Memorizza attivato, Scansiona disattivato è di solito la combinazione giusta.',
  ['The separate-URL (m-dot) mobile version: <link rel="alternate" media="only screen and (max-width: …)">. Null on responsive sites, which is most of them — a value here with no reciprocal canonical back is the classic broken m-dot setup.']:
    'La versione mobile con URL separato (m-dot): <link rel="alternate" media="only screen and (max-width: …)">. Nullo sui siti responsive, cioè la maggior parte — un valore qui senza canonical reciproco di ritorno è la classica configurazione m-dot rotta.',
  ['Crawl on only when the site really does serve a separate mobile host.']:
    'Scansiona attivato solo quando il sito serve davvero un host mobile separato.',
  ['Links a search engine cannot follow: <a> with no href but an onclick, href="javascript:…", and href="#" placeholders wired to a handler. Store-only — an uncrawlable link is by definition never fetched. Drives the JS-Only Navigation issue filter.']:
    'Link che un motore di ricerca non può seguire: <a> senza href ma con onclick, href="javascript:…" e segnaposto href="#" collegati a un handler. Solo Memorizza — un link non scansionabile per definizione non viene mai recuperato. Alimenta il filtro problema Navigazione solo JS.',
  ['On — it is a count, so it costs nothing.']:
    'Attivato — è un conteggio, quindi non costa nulla.',
  ['With a Subfolder-scoped crawl, links pointing outside the start folder are fetched once so their status code is known, then stopped — they are checked, not crawled through. Off leaves them undiscovered entirely.']:
    'Con una scansione di ambito Sottocartella, i link che puntano fuori dalla cartella iniziale vengono recuperati una volta per conoscerne il codice di stato, poi fermati — vengono controllati, non scansionati in profondità. Disattivato li lascia del tutto non scoperti.',
  ['On — knowing a link out of /blog/ is a 404 costs one request.']:
    'Attivato — sapere che un link fuori da /blog/ è un 404 costa una richiesta.',
  ["Off restricts the crawl to URLs under the start URL's path (Crawl Scope = Subfolder). On lets it cover the whole host. This is a view of the Crawl Scope setting, not a separate switch, so the two can never disagree."]:
    "Disattivato limita la scansione agli URL sotto il percorso dell'URL iniziale (Ambito di scansione = Sottocartella). Attivato le consente di coprire l'intero host. È una vista dell'impostazione Ambito di scansione, non un interruttore separato, quindi i due non possono mai essere in disaccordo.",
  ['Off to audit just /blog/; on for the whole site.']:
    "Disattivato per verificare solo /blog/; attivato per l'intero sito.",
  ['Treats every host sharing the registrable domain as internal — shop.example.com and blog.example.com crawl alongside example.com instead of counting as external. Another view of the Crawl Scope setting.']:
    "Tratta ogni host che condivide il dominio registrabile come interno — shop.example.com e blog.example.com vengono scansionati insieme a example.com invece di contare come esterni. Un'altra vista dell'impostazione Ambito di scansione.",
  ['On when subdomains are part of the same property.']:
    'Attivato quando i sottodomini fanno parte della stessa proprietà.',
  ['Crawl through rel="nofollow" links pointing at the same site. Off (default) is Screaming Frog "Respect Nofollow" behaviour. Internal and external are separate switches because sites nofollow them for opposite reasons — crawl-budget shaping vs. not vouching for a third party.']:
    'Scansiona attraverso i link rel="nofollow" che puntano allo stesso sito. Disattivato (predefinito) è il comportamento "Respect Nofollow" di Screaming Frog. Interno ed esterno sono interruttori separati perché i siti li usano per motivi opposti — modellare il crawl budget vs. non garantire per una terza parte.',
  ['On when a site nofollows its own faceted navigation and you need behind it.']:
    'Attivato quando un sito mette nofollow alla propria navigazione a faccette e devi andare oltre.',
  ['Crawl through rel="nofollow" links pointing at other hosts. Only has an effect while External Links → Crawl is on.']:
    'Scansiona attraverso i link rel="nofollow" che puntano ad altri host. Ha effetto solo mentre Link esterni → Scansiona è attivato.',
  ['Off — nofollowed externals are exactly the ones you did not vouch for.']:
    'Disattivato — gli esterni con nofollow sono esattamente quelli per cui non hai garantito.',
  ['Record hrefs that cannot be parsed as a URL — unencoded whitespace inside the authority, doubled schemes, stray delimiters. They can never resolve to a crawled page, so every one is reported in Broken Links, which is the point. Deliberate non-navigable schemes (mailto:, tel:, #) are not malformed and never appear.']:
    "Registra gli href che non possono essere analizzati come URL — spazi non codificati nell'authority, schemi raddoppiati, delimitatori vaganti. Non possono mai risolversi in una pagina scansionata, quindi ognuno viene riportato in Link interrotti, che è il punto. Gli schemi non navigabili deliberati (mailto:, tel:, #) non sono malformati e non compaiono mai.",
  ['On when hunting hand-written markup errors; off keeps Broken Links focused on real 404s.']:
    'Attivato quando dai la caccia a errori di markup scritto a mano; disattivato mantiene Link interrotti concentrato sui veri 404.',
  ['Off drops every discovered URL carrying a `?`, before robots and before a request goes out. That is the cheap way to stop a faceted navigation (?color=red&size=xl&sort=price) from spending the whole URL budget on one product listing wearing a thousand URLs. The start URL is always crawled, and subresources are exempt — style.css?v=7 is a cache-buster, not a facet. Skipped URLs are counted and reported in the log, never dropped silently.']:
    "Disattivato scarta ogni URL scoperto che contiene `?`, prima di robots e prima che parta una richiesta. È il modo economico per impedire a una navigazione a faccette (?color=red&size=xl&sort=price) di spendere l'intero budget URL su un singolo elenco prodotti travestito da mille URL. L'URL iniziale viene sempre scansionato, e le sottorisorse sono esenti — style.css?v=7 è un cache-buster, non una faccetta. Gli URL saltati vengono contati e riportati nel log, mai scartati in silenzio.",
  ['On (default). Off for a first pass over a shop with faceted filters.']:
    'Attivato (predefinito). Disattivato per una prima passata su un negozio con filtri a faccette.',
  ['Parameter names that keep a URL in the crawl anyway — pagination, a language switch, a product id. Names only; values are not looked at, and matching ignores case. A URL is admitted only when every parameter it carries is on this list: ?page=2 passes, ?page=2&color=red does not. Any-match would defeat the point, since a facet URL nearly always carries the pagination parameter too.']:
    'Nomi di parametri che mantengono comunque un URL nella scansione — paginazione, cambio lingua, id prodotto. Solo nomi; i valori non vengono esaminati, e la corrispondenza ignora le maiuscole. Un URL viene ammesso solo quando ogni parametro che porta è in questa lista: ?page=2 passa, ?page=2&color=red no. Una corrispondenza parziale vanificherebbe lo scopo, perché un URL a faccette porta quasi sempre anche il parametro di paginazione.',
  ['page, lang — keeps paginated archives reachable while the facets stay out.']:
    'page, lang — mantiene raggiungibili gli archivi paginati mentre le faccette restano fuori.',
  ['Auto-discovery on its own only records sitemap entries, which is what the sitemap issue filters compare the crawl against. Turning this on crawls them too — and that is what surfaces orphans: pages the sitemap declares but nothing on the site links to.']:
    'La scoperta automatica da sola registra soltanto le voci della sitemap, che è ciò con cui i filtri problema della sitemap confrontano la scansione. Attivare questo le scansiona anche — ed è ciò che fa emergere le pagine orfane: pagine che la sitemap dichiara ma a cui nulla nel sito punta.',
  ['On for an orphan-page audit.']: 'Attivato per un audit delle pagine orfane.',
  ['Reads Sitemap: directives from /robots.txt plus the conventional /sitemap.xml fallbacks at crawl start. Cheap I/O, and it powers every sitemap issue filter.']:
    "Legge le direttive Sitemap: da /robots.txt più i fallback convenzionali /sitemap.xml all'avvio della scansione. I/O economico, e alimenta ogni filtro problema della sitemap.",
  ['On (default).']: 'Attivato (predefinito).',
  ['Explicit sitemap URLs, one per line. Their entries are always both recorded and queued as crawl seeds — use this when the sitemap lives somewhere robots.txt never mentions.']:
    'URL di sitemap espliciti, uno per riga. Le loro voci vengono sempre sia registrate sia accodate come semi di scansione — usalo quando la sitemap si trova da qualche parte che robots.txt non menziona mai.',
  ['Treat the concurrency and RPS above as a ceiling and let the target server set the real pace. On a 429/503 (or a Retry-After header) the crawler pauses for the penalty window and steps the rate + concurrency down; after a sustained run of clean responses it grows them back toward the ceiling. Off = hold the configured rate no matter how the server responds.']:
    'Tratta la concorrenza e gli RPS sopra come un tetto e lascia che il server di destinazione detti il ritmo reale. Su un 429/503 (o un header Retry-After) il crawler si ferma per la finestra di penalità e riduce frequenza + concorrenza; dopo una serie sostenuta di risposte pulite le riporta verso il tetto. Disattivato = mantieni la frequenza configurata comunque risponda il server.',
  ['Turn on for sites behind Cloudflare / a WAF that returns 429s; leave off for your own infrastructure where the fixed rate is safe.']:
    'Attiva per siti dietro Cloudflare / un WAF che restituisce 429; lascia disattivato per la tua infrastruttura dove la frequenza fissa è sicura.',
  ['Sorts query parameters alphabetically at normalisation time. Repeated keys keep their relative order, so ?tag=a&tag=b is preserved. Without this the two orderings occupy separate rows and read as duplicates.']:
    "Ordina alfabeticamente i parametri di query in fase di normalizzazione. Le chiavi ripetute mantengono l'ordine relativo, quindi ?tag=a&tag=b viene preservato. Senza questo i due ordinamenti occupano righe separate e vengono letti come duplicati.",
  ['On for most sites; off if your server routes on positional parameter order.']:
    "Attivato per la maggior parte dei siti; disattivato se il tuo server instrada in base all'ordine posizionale dei parametri.",
  ['Collapses runs of slashes in the path to a single slash. Applied before the trailing-slash policy. Web servers serve these identically, so the duplicate-slash variant is normally a false duplicate.']:
    'Accorpa le sequenze di barre nel percorso in una singola barra. Applicato prima della policy della barra finale. I web server le servono in modo identico, quindi la variante con doppia barra è normalmente un falso duplicato.',
  ['On if a template bug emits //  in links; off if your framework uses empty path segments as data.']:
    'Attivato se un bug di template emette //  nei link; disattivato se il tuo framework usa segmenti di percorso vuoti come dati.',
  ["Off by default: verify the login page's TLS certificate before typing credentials into it. Enable only for a trusted internal host with a self-signed certificate — an unverifiable certificate on a login page is a man-in-the-middle risk."]:
    'Disattivato per impostazione predefinita: verifica il certificato TLS della pagina di accesso prima di digitarvi le credenziali. Abilita solo per un host interno affidabile con certificato autofirmato — un certificato non verificabile su una pagina di accesso è un rischio di man-in-the-middle.',
  ["Hooks the History API before the page's own scripts run, so routes an SPA reaches via pushState / replaceState / popstate are discovered and crawled. Also keeps hash routes (#/about) as distinct URLs instead of collapsing them onto the shell document."]:
    'Aggancia la History API prima che vengano eseguiti gli script della pagina, così le route che una SPA raggiunge tramite pushState / replaceState / popstate vengono scoperte e scansionate. Mantiene inoltre le route hash (#/about) come URL distinti invece di accorparle sul documento shell.',
  ['On for React Router / Vue Router / Angular sites whose pages never produce a document request.']:
    'Attivato per siti React Router / Vue Router / Angular le cui pagine non producono mai una richiesta di documento.',
  ['`<link rel="alternate" media="only screen and (max-width: …)" href="…">` value — the separate-URL (m-dot) mobile version of this page. Empty on responsive sites, which is most of them. A value here with no reciprocal canonical pointing back is the classic broken m-dot setup.']:
    'Valore di `<link rel="alternate" media="only screen and (max-width: …)" href="…">` — la versione mobile con URL separato (m-dot) di questa pagina. Vuoto sui siti responsive, cioè la maggior parte. Un valore qui senza canonical reciproco che punti indietro è la classica configurazione m-dot rotta.',
};
