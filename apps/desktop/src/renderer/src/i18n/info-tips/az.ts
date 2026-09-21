/**
 * Azerbaijani InfoTip ([i] tooltip) bodies, keyed by the verbatim English
 * source string. See `../info-tips.ts` for the rationale.
 */

export const AZ_INFO_TIPS: Record<string, string> = {
  ["?page=1 / ?page=2 / ?page=4 → flags 'Sequence Break' on every member of the broken cluster."]:
    "?page=1 / ?page=2 / ?page=4 → qırıq qrupun hər üzvünə 'Ardıcıllıq qırılması' işarəsi qoyur.",
  ['`<a>` elements that look clickable but aren\'t crawlable (no href + onclick, `href="javascript:…"`, or `href="#"` with onclick).']:
    'Kliklənə bilən görünən, amma taranmayan `<a>` elementləri (href yox + onclick var, `href="javascript:…"`, ya da onclick ilə birlikdə `href="#"`).',
  ['`<link rel="amphtml" href="…">` value — the AMP version of this page. Empty when the page does not declare an AMP alternate.']:
    '`<link rel="amphtml" href="…">` dəyəri — bu səhifənin AMP versiyası. Səhifə AMP alternativi bəyan etmirsə boşdur.',
  ['`<link rel="next" href="…">` value resolved to absolute. Empty when the page is not paginated forward.']:
    '`<link rel="next" href="…">` dəyərinin mütləq URL-ə çevrilmiş forması. Səhifənin irəli səhifələməsi yoxdursa boşdur.',
  ['`<link rel="prev" href="…">` value resolved to absolute. Empty when the page is the first in its pagination cluster.']:
    '`<link rel="prev" href="…">` dəyərinin mütləq URL-ə çevrilmiş forması. Səhifə öz səhifələmə qrupunda ilk səhifədirsə boşdur.',
  ['`css` runs against the parsed DOM; `regex` runs against raw HTML.']:
    '`css` təhlil edilmiş DOM üzərində işləyir; `regex` xam HTML üzərində işləyir.',
  ['`none` disables auth; `basic` adds `Authorization: Basic <base64>`; `bearer` adds `Authorization: Bearer <token>`; `digest` performs the RFC 2617 challenge-response on the first 401.']:
    '`none` autentifikasiyanı söndürür; `basic` `Authorization: Basic <base64>` əlavə edir; `bearer` `Authorization: Bearer <token>` əlavə edir; `digest` ilk 401-də RFC 2617 challenge-response axını yerinə yetirir.',
  ['`POST <url>` is fired when the `done` event emits. 10 s timeout. Failures are logged as info events but never break the crawl.']:
    '`done` hadisəsi baş verəndə `POST <url>` göndərilir. 10 san zaman aşımı. Uğursuzluqlar məlumat hadisəsi kimi qeyd olunur, amma taramanı heç vaxt pozmur.',
  ['0 (no duplicates), 7 (member of cluster #7)']: '0 (təkrar yoxdur), 7 (#7 nömrəli qrupun üzvü)',
  ['0 = auto. 4 for 8GB RAM machines, 8+ for 16GB+.']:
    '0 = avtomatik. 8 GB RAM-lı maşınlarda 4, 16 GB və üzəri üçün 8+.',
  ["0 default; 250 ms when a host returns 429 with a 'too fast' message."]:
    "Standart 0; host 'çox sürətli' mesajı ilə 429 qaytarırsa 250 ms.",
  ['0 for SSR sites, 2000 for typical SPAs, 5000+ for heavy client-rendered apps.']:
    'SSR saytlar üçün 0, tipik SPA-lar üçün 2000, ağır müştəri tərəfli tətbiqlər üçün 5000+.',
  ["0.1 default (Google 'good'); 0 to disable."]:
    "Standart 0.1 (Google-un 'yaxşı' həddi); söndürmək üçün 0.",
  ['1 = unique, 5 = part of a 5-page near-duplicate group']:
    '1 = unikal, 5 = 5 səhifəlik oxşar-təkrar qrupunun üzvü',
  ['10 (default), 3 for very tight chains, 0 to remove the cap']:
    '10 (standart), çox sıx zəncirlər üçün 3, həddi qaldırmaq üçün 0',
  ['10 covers most sites; 3 limits crawls to top-of-funnel pages only.']:
    '10 saytların əksəriyyətini əhatə edir; 3 taramanı yalnız hunilərin üst səhifələri ilə məhdudlaşdırır.',
  ['100 default for most audits; 0 to disable the check.']:
    'Auditlərin əksəriyyəti üçün standart 100; yoxlamanı söndürmək üçün 0.',
  ['100 default; 50 for tight on-page link discipline; 0 to disable the issue.']:
    'Standart 100; səhifədaxili sərt keçid intizamı üçün 50; problemi söndürmək üçün 0.',
  ['1000000 (1M) for a full site audit; 5000 for spot checks.']:
    'Tam sayt auditi üçün 1000000 (1M); nöqtəvi yoxlamalar üçün 5000.',
  ['1024 (1 MB) default; 150 for a lean HTML budget; 0 to disable.']:
    'Standart 1024 (1 MB); yığcam HTML büdcəsi üçün 150; söndürmək üçün 0.',
  ['1048576 (1 MB) default; 524288 (512 KB) on tight disks; 0 to disable truncation entirely.']:
    'Standart 1048576 (1 MB); disk məhdud olduqda 524288 (512 KB); kəsməni tamamilə söndürmək üçün 0.',
  ['10485760 (10 MB) on bandwidth-tight crawls; 0 to download anything.']:
    'Bant genişliyi məhdud taramalarda 10485760 (10 MB); hər şeyi endirmək üçün 0.',
  ['1366 = standard laptop, 1920 = full HD desktop, 375 = iPhone width.']:
    '1366 = standart noutbuk, 1920 = Full HD masaüstü, 375 = iPhone eni.',
  ['2 default; 0 to record errors immediately without retrying; 5 for unreliable upstreams.']:
    'Standart 2; təkrar cəhd etmədən xətaları dərhal qeyd etmək üçün 0; etibarsız serverlər üçün 5.',
  ['20 default; 50 on fast first-party servers; 5 if the site rate-limits or returns 429s.']:
    'Standart 20; sürətli öz serverlərində 50; sayt sürəti məhdudlaşdırır və ya 429 qaytarırsa 5.',
  ['20 for typical sites; 5 to be polite on shared hosting; 60+ when crawling your own infra.']:
    'Tipik saytlar üçün 20; paylaşılan hostinqdə nəzakətli olmaq üçün 5; öz infrastrukturunuzu tararkən 60+.',
  ['20000 (20 s) for typical use; 5000 for fast spot checks; 60000 for slow APIs.']:
    'Tipik istifadə üçün 20000 (20 san); sürətli yoxlamalar üçün 5000; yavaş API-lər üçün 60000.',
  ['2048 (≈2 GB) on a 4 GB laptop; 8192 on a 16 GB workstation; 0 to disable.']:
    '4 GB noutbukda 2048 (≈2 GB); 16 GB iş stansiyasında 8192; söndürmək üçün 0.',
  ['2048 default (RFC-suggested practical ceiling).']:
    'Standart 2048 (RFC-nin təklif etdiyi praktik tavan).',
  ["2500 default (Google 'good'); 0 to disable."]:
    "Standart 2500 (Google-un 'yaxşı' həddi); söndürmək üçün 0.",
  ['3 = recommended; 5 catches looser duplicates (templated content with light variation); 0 turns the post-crawl pass off.']:
    '3 = tövsiyə olunan; 5 daha boş təkrarları tutur (yüngül fərqli şablon məzmunu); 0 tarama sonrası mərhələni söndürür.',
  ['4 default; 6 on documentation sites with deep TOC trees; 0 to disable.']:
    'Standart 4; dərin mündəricat ağacı olan sənəd saytlarında 6; söndürmək üçün 0.',
  ['500 default. Bump to 2000 when retrying against a flaky API.']:
    'Standart 500. Qeyri-sabit API-yə təkrar cəhd edərkən 2000-ə qaldırın.',
  ['50000 keeps RAM bounded during big sitemap fan-outs; 0 for typical crawls.']:
    '50000 böyük sitemap genişlənmələri zamanı RAM-ı məhdud saxlayır; tipik taramalar üçün 0.',
  ['60000 (1 minute) for huge resources; 0 to rely solely on the fetch timeout.']:
    'Nəhəng resurslar üçün 60000 (1 dəqiqə); yalnız yükləmə zaman aşımına güvənmək üçün 0.',
  ['64-bit SimHash + LSH bucketing + Union-Find clustering on body shingles. Most expensive pass — typical 5–10 s on a 100k crawl.']:
    'Gövdə shingle-ları üzərində 64-bit SimHash + LSH qruplaşdırma + Union-Find klasterləşdirmə. Ən bahalı mərhələ — 100k taramada adətən 5–10 san.',
  ['768 = standard laptop, 1080 = full HD desktop, 667 = iPhone 8 height.']:
    '768 = standart noutbuk, 1080 = Full HD masaüstü, 667 = iPhone 8 hündürlüyü.',
  ['800 default; 200 for CDN-backed static; 0 to disable.']:
    'Standart 800; CDN arxasındakı statik üçün 200; söndürmək üçün 0.',
  ['Aborts @font-face / Google Fonts / WOFF2 requests. FOUT visible but text still renders.']:
    '@font-face / Google Fonts / WOFF2 sorğularını dayandırır. FOUT görünür, amma mətn yenə də göstərilir.',
  ['Aborts <img>, <picture>, background-image requests. Recommended for SEO crawls — image metadata still comes from <img> tag attributes.']:
    '<img>, <picture>, background-image sorğularını dayandırır. SEO taramaları üçün tövsiyə olunur — şəkil metadatası yenə <img> teqinin atributlarından gəlir.',
  ['Aborts <video> / <audio> sources. Page DOM still includes the <video> tag.']:
    '<video> / <audio> mənbələrini dayandırır. Səhifə DOM-unda <video> teqi qalır.',
  ['Aborts all <script> requests. This defeats the purpose of JS rendering — use Text Only mode instead.']:
    'Bütün <script> sorğularını dayandırır. Bu, JS renderinin məqsədini puç edir — əvəzinə Yalnız mətn rejimindən istifadə edin.',
  ['Aborts external CSS. Inline styles still load. WARNING: many SPAs use CSS-driven visibility / lazy classes — blocking CSS may hide content that JS depends on.']:
    'Xarici CSS-i dayandırır. Daxili üslublar yenə yüklənir. XƏBƏRDARLIQ: bir çox SPA CSS ilə idarə olunan görünürlük / lazy siniflərdən istifadə edir — CSS-i bloklamaq JS-in asılı olduğu məzmunu gizlədə bilər.',
  ['Aborts requests whose total lifetime (connect + headers + body) exceeds this. Distinct from `requestTimeoutMs` which is the headers timeout. Useful for capping individual slow pages without lowering the overall fetch timeout.']:
    'Ümumi müddəti (bağlantı + başlıqlar + gövdə) bu dəyəri aşan sorğuları dayandırır. Başlıq zaman aşımı olan `requestTimeoutMs`-dən fərqlidir. Ümumi yükləmə zaman aşımını azaltmadan ayrı-ayrı yavaş səhifələri məhdudlaşdırmaq üçün faydalıdır.',
  ['Absolute redirect target parsed from the meta-refresh content. Empty when meta-refresh sets only a delay.']:
    'meta-refresh content-indən çıxarılan mütləq yönləndirmə hədəfi. meta-refresh yalnız gecikmə təyin edirsə boşdur.',
  ['Literal target of a JavaScript redirect found in an inline script (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Followed when "Follow JavaScript redirects" is on.']:
    'Sətirdaxili skriptdə tapılan JavaScript yönləndirməsinin hərfi hədəfi (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). "JavaScript yönləndirmələrini izlə" açıq olduqda izlənir.',
  ['Additional time to wait after the chosen wait condition fires, for SPA hydration / late XHRs. 0 = no extra wait. Bounded by the request timeout.']:
    'Seçilmiş gözləmə şərti işə düşdükdən sonra SPA hidrasiyası / gec XHR-lər üçün əlavə gözləmə vaxtı. 0 = əlavə gözləmə yoxdur. Sorğu zaman aşımı ilə məhdudlaşır.',
  ['Anchor text of the broken link as rendered in the source page.']:
    'Qırıq keçidin mənbə səhifədə göstərildiyi formada lövbər mətni.',
  ['Audits the rendered DOM for WCAG AA colour-contrast failures (4.5:1 normal text, 3:1 large text) and stylesheet rules that suppress the keyboard focus outline without a :focus-visible fallback. Surfaces the Low-Contrast Text and Focus Outline Suppressed issue filters.']:
    'Render edilmiş DOM-u WCAG AA rəng kontrastı uğursuzluqları (normal mətn 4.5:1, iri mətn 3:1) və :focus-visible ehtiyatı olmadan klaviatura fokus konturunu gizlədən üslub qaydaları üçün yoxlayır. Aşağı kontrastlı mətn və Fokus konturu gizlədilib problem filtrlərini doldurur.',
  ['basic/digest for /staging behind nginx; bearer for protected APIs']:
    'nginx arxasındakı /staging üçün basic/digest; qorunan API-lər üçün bearer',
  ['Below Normal while you keep working in other apps; Idle for overnight unattended runs.']:
    'Başqa tətbiqlərdə işləməyə davam edərkən Normaldan aşağı; gecə nəzarətsiz işlər üçün Boş.',
  ['BFS click depth from the start URL. Start URL = 0; its outlinks = 1; etc. High depth often correlates with low importance.']:
    'Başlanğıc URL-dən BFS klik dərinliyi. Başlanğıc URL = 0; onun çıxış keçidləri = 1; və s. Yüksək dərinlik çox vaxt aşağı əhəmiyyətlə əlaqəlidir.',
  ['Bodies over this are truncated and flagged. 1 MB covers the 99.9th percentile of HTML pages without letting one adversarial 50 MB page bloat the project file.']:
    'Bundan böyük gövdələr kəsilir və işarələnir. 1 MB HTML səhifələrinin 99,9-cu persentilini əhatə edir və bir zərərli 50 MB səhifənin layihə faylını şişirməsinə imkan vermir.',
  ['Buy Affordable Game Keys | Example Store']: 'Sərfəli oyun açarları alın | Nümunə mağaza',
  ['Character count of the first H1.']: 'İlk H1-in simvol sayı.',
  ['Character count of the meta description. Recommended: 70–155 characters; over 155 risks truncation.']:
    'Meta təsvirin simvol sayı. Tövsiyə: 70–155 simvol; 155-dən çox olduqda kəsilmə riski var.',
  ['Character count of the title. Recommended: 30–60 characters; over 60 risks truncation in SERPs.']:
    'Başlığın simvol sayı. Tövsiyə: 30–60 simvol; 60-dan çox olduqda SERP-də kəsilmə riski var.',
  ['Charikar 64-bit SimHash of body shingles. Used by the post-crawl near-duplicate clustering pass. Two SimHashes within the configured Hamming threshold are considered similar.']:
    'Gövdə shingle-larının Charikar 64-bit SimHash-i. Tarama sonrası oxşar-təkrar klasterləşdirmə mərhələsi tərəfindən istifadə olunur. Konfiqurasiya edilmiş Hamming həddi daxilindəki iki SimHash oxşar sayılır.',
  ['Coarse content classification derived from URL extension and Content-Type header.']:
    'URL uzantısı və Content-Type başlığından çıxarılan kobud məzmun təsnifatı.',
  ['Comma-joined sorted unique JSON-LD `@type` values declared on the page (Article, BreadcrumbList, Product, …).']:
    'Səhifədə bəyan edilmiş unikal JSON-LD `@type` dəyərləri, sıralanmış və vergüllə birləşdirilmiş (Article, BreadcrumbList, Product, …).',
  ['Contents of the first <meta name="description"> tag. May be used as the SERP snippet.']:
    'İlk <meta name="description"> teqinin məzmunu. SERP snippet-i kimi istifadə oluna bilər.',
  ['Contents of the first <meta name="robots"> tag. Controls per-page indexing/following behaviour.']:
    'İlk <meta name="robots"> teqinin məzmunu. Səhifə səviyyəsində indeksləmə/izləmə davranışını idarə edir.',
  ['Contents of the first <title> element. Google primarily uses this in SERP titles.']:
    'İlk <title> elementinin məzmunu. Google bunu əsasən SERP başlıqlarında istifadə edir.',
  ['Counts how many internal pages link to each URL. Drives the Most-Linked URLs report and the per-row Inlinks column.']:
    'Hər URL-ə neçə daxili səhifənin keçid verdiyini sayır. Ən çox keçid verilən URL-lər hesabatını və hər sətirdəki Daxil olan keçidlər sütununu doldurur.',
  ["Crawl 3xx redirect targets. Each hop is its own row; the chain is reconstructed in the Response Codes view. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced)."]:
    "3xx yönləndirmə hədəflərini tara. Hər addım öz sətridir; zəncir Cavab kodları görünüşündə yenidən qurulur. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced).",
  ['Crawler RSS auto-pauses the queue when this is exceeded; resumes once memory drops to 80% of the cap. Soft cap — does not enforce a hard heap limit.']:
    'Bu dəyər aşıldıqda tarayıcının RSS-i növbəni avtomatik dayandırır; yaddaş həddin 80%-nə düşdükdə davam edir. Yumşaq hədd — sərt heap məhdudiyyəti tətbiq etmir.',
  ['css for selectors, regex for free-form patterns']:
    'seçicilər üçün css, sərbəst formalı şablonlar üçün regex',
  ["CSS selector that pins the duplicate-fingerprint text extraction to a specific page region. When set, the heuristic (main / role=main / article / body-minus-chrome) is bypassed and the selector wins. Useful on sites where the heuristic misclassifies — e.g. CMSes that wrap navigation inside `<main>` or sites with no semantic landmarks at all. Empty = use the heuristic. Invalid selectors silently fall back to the heuristic so a typo doesn't break the crawl."]:
    'Təkrar barmaq izi mətn çıxarışını səhifənin müəyyən bölgəsinə sabitləyən CSS seçicisi. Təyin edildikdə evristika (main / role=main / article / chrome-suz body) atlanır və seçici qalib gəlir. Evristikanın səhv təsnif etdiyi saytlarda faydalıdır — məs. naviqasiyanı `<main>` içinə bükən CMS-lər və ya heç bir semantik işarəsi olmayan saytlar. Boş = evristikadan istifadə et. Yanlış seçicilər səssizcə evristikaya qayıdır ki, bir yazı səhvi taramanı pozmasın.',
  ["Cumulative Layout Shift from PageSpeed Insights, when present. Google's 'good' CLS threshold is 0.1. Unitless; accepts decimals. Pages without PSI data are never flagged."]:
    "Mövcud olduqda PageSpeed Insights-dan Cumulative Layout Shift. Google-un 'yaxşı' CLS həddi 0.1-dir. Vahidsiz; onluq kəsrləri qəbul edir. PSI məlumatı olmayan səhifələr heç vaxt işarələnmir.",
  ['Drives the View Source detail tab. ~30–200 KB on disk per HTML page; turn off if you only need metadata and not full source viewing.']:
    'Mənbəyə bax detal sekmesini doldurur. Hər HTML səhifəsi üçün diskdə ~30–200 KB; yalnız metadata lazımdırsa və tam mənbə baxışı lazım deyilsə söndürün.',
  ["Each rule runs JavaScript RegExp.replace on the fully-normalised URL. Flags default to 'g'. After all rules run, the result is re-parsed as a URL — if the rewrite produces an invalid URL, the link is dropped at normalisation time."]:
    "Hər qayda tam normallaşdırılmış URL üzərində JavaScript RegExp.replace işlədir. Bayraqlar standart olaraq 'g'. Bütün qaydalar işlədikdən sonra nəticə yenidən URL kimi təhlil edilir — yenidən yazma yanlış URL yaradırsa, keçid normallaşdırma zamanı atılır.",
  ["Empty = safest. 'chrome' if you want the same Chrome version your users see."]:
    "Boş = ən təhlükəsiz. İstifadəçilərinizin gördüyü eyni Chrome versiyasını istəyirsinizsə 'chrome'.",
  ["Empty = use the bundled Playwright Chromium build (recommended — pinned version, works everywhere). 'chrome' / 'msedge' uses the system-installed browser. Beta channels for testing newer features."]:
    "Boş = Playwright ilə gələn Chromium yığımından istifadə et (tövsiyə olunur — sabit versiya, hər yerdə işləyir). 'chrome' / 'msedge' sistemdə quraşdırılmış brauzerdən istifadə edir. Yeni funksiyaları sınamaq üçün beta kanalları.",
  ["Fetch internal <img> resources (incl. srcset / <picture> sources) so they appear in the Internal tab with their own status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl)."]:
    "Daxili <img> resurslarını (srcset / <picture> mənbələri daxil) yüklə ki, Daxili sekmesində öz status kodu, məzmun tipi və ölçüsü ilə görünsünlər. Hər biri Maks URL-ə sayılır. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl).",
  ["Fetch internal <link rel=stylesheet> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl)."]:
    "Daxili <link rel=stylesheet> resurslarını yüklə ki, Daxili sekmesində status kodu, məzmun tipi və ölçü ilə görünsünlər. Hər biri Maks URL-ə sayılır. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl).",
  ["Fetch internal <script src> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl)."]:
    "Daxili <script src> resurslarını yüklə ki, Daxili sekmesində status kodu, məzmun tipi və ölçü ilə görünsünlər. Hər biri Maks URL-ə sayılır. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl).",
  ["Fetches /robots.txt sitemap directives + /sitemap.xml fallbacks. Powers the 'Non-Indexable in Sitemap' issue filter. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl)."]:
    "/robots.txt sitemap direktivlərini + /sitemap.xml ehtiyatlarını yükləyir. 'Sitemap-də indekslənməyən' problem filtrini doldurur. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl).",
  ["first/last for single value, all for JSON array, concat for ' | ' joined string"]:
    "tək dəyər üçün first/last, JSON massivi üçün all, ' | ' ilə birləşdirilmiş sətir üçün concat",
  ['FNV-1a 64-bit hash of the normalised body token stream. Two pages sharing this hash are byte-identical post-tokenisation — the basis of the Exact Duplicate filter.']:
    'Normallaşdırılmış gövdə token axınının FNV-1a 64-bit heşi. Bu heşi paylaşan iki səhifə tokenləşdirmədən sonra bayt-bayt eynidir — Dəqiq təkrar filtrinin əsası.',
  ['For Basic, sent base64-encoded; for Digest, hashed into the challenge response.']:
    'Basic üçün base64 ilə kodlanıb göndərilir; Digest üçün challenge cavabına heşlənir.',
  ['For regex: `regex_group` extracts capture group 1; otherwise the whole match is used.']:
    'regex üçün: `regex_group` 1-ci tutma qrupunu çıxarır; əks halda bütün uyğunluq istifadə olunur.',
  ['Full-page renders the entire scrollable canvas; Above-the-fold captures just the initial viewport (cheaper). Both writes two PNGs per URL.']:
    'Tam səhifə bütün sürüşdürülə bilən kətanı render edir; Above-the-fold yalnız ilkin görünüş sahəsini çəkir (daha ucuz). Hər ikisi hər URL üçün iki PNG yazır.',
  ['Google\'s index status, pulled from the URL Inspection API — not the Fetch button. Click "Inspect (top 100)" to fill this column; Fetch only pulls clicks / impressions / position.']:
    'URL Inspection API-dən alınan Google indeks statusu — Yüklə düyməsindən deyil. Bu sütunu doldurmaq üçün "Yoxla (ilk 100)" düyməsinə klikləyin; Yüklə yalnız klik / göstərim / mövqe gətirir.',
  ["Googlebot — Smartphone matches Google's mobile-first indexing crawler."]:
    'Googlebot — Smartphone Google-un mobil-öncə indeksləmə tarayıcısına uyğundur.',
  ['Hard cap on pending URLs held in memory. Excess discoveries are dropped silently — bounds peak heap during fan-out bursts (big sitemaps, dense link graphs).']:
    'Yaddaşda saxlanan gözləyən URL-lərin sərt həddi. Artıq kəşflər səssizcə atılır — genişlənmə partlayışları (böyük sitemap-lər, sıx keçid qrafları) zamanı pik heap-i məhdudlaşdırır.',
  ['Hard cap on the number of 3xx hops we follow for a single chain. Each hop is recorded as its own URL row regardless. 0 disables the cap (chain still ends at `redirect_loop`).']:
    'Tək zəncir üçün izlədiyimiz 3xx addımlarının sərt həddi. Hər addım hər halda öz URL sətri kimi qeyd olunur. 0 həddi söndürür (zəncir yenə `redirect_loop`-da bitir).',
  ["Hard cap on total URLs crawled. The crawl stops as soon as this is reached. Screaming Frog: 'Limit Crawl Total'."]:
    "Taranan ümumi URL-lərin sərt həddi. Bu həddə çatan kimi tarama dayanır. Screaming Frog: 'Limit Crawl Total'.",
  ["Hard ceiling on requests per second across all workers combined. Equivalent to Screaming Frog's 'Max URL/s'. Acts as a token bucket — even with high concurrency the crawler waits between bursts to stay below this rate."]:
    "Bütün işçilər birlikdə saniyədə sorğuların sərt tavanı. Screaming Frog-un 'Max URL/s' ayarına bərabərdir. Token bucket kimi işləyir — yüksək paralellikdə belə tarayıcı bu sürətin altında qalmaq üçün partlayışlar arasında gözləyir.",
  ['Height attribute value (in pixels) declared on the <img> tag, when present.']:
    '<img> teqində bəyan edilmiş height atributunun dəyəri (piksellə), mövcud olduqda.',
  ["Honor Disallow rules + crawl-delay declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "Konfiqurasiya edilmiş User-Agent üçün /robots.txt-də bəyan edilmiş Disallow qaydalarına + crawl-delay-ə əməl et. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt).",
  ["Hop count from the start URL. Start URL is depth 0; its outlinks are depth 1, theirs depth 2, and so on. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits)."]:
    "Başlanğıc URL-dən addım sayı. Başlanğıc URL dərinlik 0-dır; onun çıxış keçidləri dərinlik 1, onlarınkı dərinlik 2 və s. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits).",
  ['How many distinct pages reference this image. High values typically indicate site-wide assets (logos, icons).']:
    'Neçə fərqli səhifənin bu şəklə istinad etdiyi. Yüksək dəyərlər adətən sayt boyu aktivləri (loqolar, ikonlar) göstərir.',
  ["How to canonicalise paths with/without a trailing slash. 'Add' is file-extension aware — won't add a slash to /file.pdf or /image.png."]:
    "Sonluq slaşı olan/olmayan yolları necə kanonikləşdirmək. 'Əlavə et' fayl uzantısını nəzərə alır — /file.pdf və ya /image.png-yə slaş əlavə etməyəcək.",
  ['HTML attribute name to read.']: 'Oxunacaq HTML atributunun adı.',
  ['HTML transfer size of the page document. Heavy HTML payloads delay first paint. Stored as bytes internally; entered here in kilobytes.']:
    'Səhifə sənədinin HTML ötürmə ölçüsü. Ağır HTML yükləri ilk çəkilməni gecikdirir. Daxildə baytla saxlanılır; burada kilobaytla daxil edilir.',
  ['HTTP `<img>` / `<video>` / `<audio>` / `<source>` references on an HTTPS page — rendered but the URL bar reads "Not Secure".']:
    'HTTPS səhifədə HTTP `<img>` / `<video>` / `<audio>` / `<source>` istinadları — render edilir, amma ünvan çubuğunda "Təhlükəsiz deyil" yazılır.',
  ['HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` references on an HTTPS page — browsers BLOCK these silently.']:
    'HTTPS səhifədə HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` istinadları — brauzerlər bunları səssizcə BLOKLAYIR.',
  ['HTTP response status code. Empty/Failed indicates a network error before any response was received.']:
    'HTTP cavab status kodu. Boş/Uğursuz hər hansı cavab alınmazdan əvvəl şəbəkə xətası deməkdir.',
  ['HTTP status of the source page itself. Usually 200; if non-2xx the broken link may be inherited.']:
    'Mənbə səhifənin öz HTTP statusu. Adətən 200; 2xx deyilsə qırıq keçid irsi ola bilər.',
  ['HTTP status returned by the target. 0 = network failure (DNS, TLS, timeout).']:
    'Hədəfin qaytardığı HTTP statusu. 0 = şəbəkə uğursuzluğu (DNS, TLS, zaman aşımı).',
  ["HTTP/HTTPS proxies route via undici's ProxyAgent; SOCKS proxies (socks5://, socks5h://, socks4://, socks4a://) tunnel via the socks client. The `h`/`4a` variants resolve DNS at the proxy. Leave empty to inherit HTTPS_PROXY/HTTP_PROXY env vars."]:
    'HTTP/HTTPS proksilər undici-nin ProxyAgent-i ilə yönləndirilir; SOCKS proksilər (socks5://, socks5h://, socks4://, socks4a://) socks müştərisi ilə tunellənir. `h`/`4a` variantları DNS-i proksidə həll edir. HTTPS_PROXY/HTTP_PROXY mühit dəyişənlərini miras almaq üçün boş buraxın.',
  ["Identifies the largest element visible in the initial viewport (likely LCP candidate per Google's heuristic) and stores its CSS selector, dimensions, and resource URL. Useful for spotting unoptimised LCP images without a PSI API call."]:
    'İlkin görünüş sahəsində görünən ən böyük elementi (Google-un evristikasına görə ehtimal olunan LCP namizədi) müəyyən edir və onun CSS seçicisini, ölçülərini və resurs URL-ini saxlayır. PSI API çağırışı olmadan optimallaşdırılmamış LCP şəkillərini tapmaq üçün faydalıdır.',
  ['If set, Playwright waits for this CSS selector to appear in the DOM before extracting HTML. Overrides the extra-wait timeout when present. Useful when you know the SPA reveals a specific element after hydration.']:
    'Təyin edildikdə Playwright HTML-i çıxarmazdan əvvəl bu CSS seçicisinin DOM-da görünməsini gözləyir. Mövcud olduqda əlavə gözləmə zaman aşımını əvəz edir. SPA-nın hidrasiyadan sonra müəyyən elementi göstərdiyini bildiyiniz zaman faydalıdır.',
  ['Images on this page that have no alt attribute. WCAG accessibility issue + missed alt-as-anchor SEO opportunity.']:
    'Bu səhifədə alt atributu olmayan şəkillər. WCAG əlçatanlıq problemi + alt-ı lövbər kimi istifadə etmək SEO fürsətinin itirilməsi.',
  ['Indexable / Non-Indexable']: 'İndekslənən / İndekslənməyən',
  ['Internal PageRank, 0–100. Computed over the internal link graph (damping 0.85) and normalised so the most-linked page scores 100. Higher = more internal link equity.']:
    'Daxili PageRank, 0–100. Daxili keçid qrafı üzərində hesablanır (sönmə 0.85) və ən çox keçid verilən səhifə 100 alacaq şəkildə normallaşdırılır. Daha yüksək = daha çox daxili keçid dəyəri.',
  ['internal / external']: 'daxili / xarici',
  ['JavaScript executed in every page BEFORE navigation begins (init script). Use to set localStorage / cookies / mock APIs / disable animations. Runs in page context — no Node access.']:
    'Naviqasiya başlamazdan ƏVVƏL hər səhifədə icra olunan JavaScript (init skripti). localStorage / kukiləri təyin etmək / API-ləri saxtalaşdırmaq / animasiyaları söndürmək üçün istifadə edin. Səhifə kontekstində işləyir — Node girişi yoxdur.',
  ['JavaScript regex (no flags — /g is implicit). Use a capture group with `output=regex_group` to extract just part of the match.']:
    'JavaScript regex (bayraqsız — /g nəzərdə tutulur). Uyğunluğun yalnız bir hissəsini çıxarmaq üçün `output=regex_group` ilə tutma qrupundan istifadə edin.',
  ['JavaScript regex tested against the full URL. Empty = all URLs allowed. URL must match at least one to be enqueued. The start URL is always permitted regardless.']:
    'Tam URL üzərində yoxlanan JavaScript regex. Boş = bütün URL-lərə icazə verilir. Növbəyə düşmək üçün URL ən azı biri ilə uyğun gəlməlidir. Başlanğıc URL-ə həmişə icazə verilir.',
  ['JavaScript regex. Any match → URL is skipped, even if it would otherwise pass the include list. Common uses: skip admin areas, large file types, session-id query params.']:
    'JavaScript regex. Hər hansı uyğunluq → URL atlanır, daxiletmə siyahısından keçsə belə. Ümumi istifadələr: admin sahələrini, böyük fayl tiplərini, sessiya id sorğu parametrlərini atlamaq.',
  ['JSON map of `{ term: count }` literal-substring hits from the configured Custom Search terms.']:
    'Konfiqurasiya edilmiş Fərdi axtarış terminlərinin hərfi alt-sətir uyğunluqlarının `{ term: count }` JSON xəritəsi.',
  ['JSON-stringified array of `{ lang, href }` pairs. Heavy column — better consumed via the URL Details panel.']:
    '`{ lang, href }` cütlərinin JSON-a çevrilmiş massivi. Ağır sütun — URL detalları panelindən baxmaq daha yaxşıdır.',
  ['JSON-stringified custom-extraction results map. Heavy column — render verbatim, easier to read in the URL Details panel.']:
    'JSON-a çevrilmiş fərdi çıxarış nəticələri xəritəsi. Ağır sütun — olduğu kimi göstərilir, URL detalları panelində oxumaq daha asandır.',
  ['JSONPath against a JSON response body (e.g. `application/json` APIs). Only runs on responses that parse as JSON — ignored on HTML pages.']:
    'JSON cavab gövdəsi (məs. `application/json` API-lər) üzərində JSONPath. Yalnız JSON kimi təhlil olunan cavablarda işləyir — HTML səhifələrdə nəzərə alınmır.',
  ['JSONPath returns the matched JSON value as-is; choose `Count` to return the number of matches instead.']:
    'JSONPath uyğun gələn JSON dəyərini olduğu kimi qaytarır; əvəzinə uyğunluq sayını qaytarmaq üçün `Count` seçin.',
  ["Largest Contentful Paint from PageSpeed Insights lab data, when the URL has been audited. Google's 'good' LCP threshold is 2500 ms. Pages without PSI data are never flagged on this metric."]:
    "URL audit edildikdə PageSpeed Insights laboratoriya məlumatından Largest Contentful Paint. Google-un 'yaxşı' LCP həddi 2500 ms-dir. PSI məlumatı olmayan səhifələr bu metrikə görə heç vaxt işarələnmir.",
  ['load = good default. networkidle for heavy SPAs. domcontentloaded if you only need raw HTML.']:
    'load = yaxşı standart. Ağır SPA-lar üçün networkidle. Yalnız xam HTML lazımdırsa domcontentloaded.',
  ['Location header value when status is 3xx. The URL the server points to next; chain length is in the URL Details panel.']:
    'Status 3xx olduqda Location başlığının dəyəri. Serverin növbəti göstərdiyi URL; zəncir uzunluğu URL detalları panelindədir.',
  ['Lowercases the URL path component. Host is already case-insensitive per the URL spec, so this only affects the path.']:
    'URL-in yol komponentini kiçik hərflərə çevirir. Host URL spesifikasiyasına görə onsuz da hərf registrinə həssas deyil, ona görə bu yalnız yola təsir edir.',
  ['Near-duplicate cluster ID assigned by the post-crawl SimHash pass. 0 = singleton (no near-duplicates within the configured Hamming threshold). Pages sharing a non-zero cluster ID are mutually similar.']:
    'Tarama sonrası SimHash mərhələsi tərəfindən təyin edilən oxşar-təkrar qrup ID-si. 0 = tək (konfiqurasiya edilmiş Hamming həddi daxilində oxşar-təkrar yoxdur). Sıfırdan fərqli eyni qrup ID-sini paylaşan səhifələr qarşılıqlı oxşardır.',
  ['noindex, canonicalised, redirected, blocked-by-robots']:
    'noindex, kanonikləşdirilib, yönləndirilib, robots tərəfindən bloklanıb',
  ['None for fastest crawl. Above-the-fold for SERP-thumbnail-style preview. Full page when you need long-page snapshots.']:
    'Ən sürətli tarama üçün Heç biri. SERP miniatürü tərzində önizləmə üçün Above-the-fold. Uzun səhifə anlıq görüntüləri lazım olduqda Tam səhifə.',
  ['Number of `<form action="http://…">` declarations on an HTTPS page. Submitting one downgrades the connection.']:
    'HTTPS səhifədə `<form action="http://…">` bəyanlarının sayı. Birini göndərmək bağlantını aşağı salır.',
  ['Number of `<link rel="alternate" hreflang>` entries declared on this page. 0 = no alternates declared.']:
    'Bu səhifədə bəyan edilmiş `<link rel="alternate" hreflang>` qeydlərinin sayı. 0 = alternativ bəyan edilməyib.',
  ['Number of `<link rel="canonical">` tags on the page. >1 is a "Multiple Canonicals" issue.']:
    'Səhifədəki `<link rel="canonical">` teqlərinin sayı. >1 "Çoxlu kanonik" problemidir.',
  ['Number of `<script type="application/ld+json">` blocks parsed successfully on the page.']:
    'Səhifədə uğurla təhlil edilmiş `<script type="application/ld+json">` bloklarının sayı.',
  ['Number of `<script type="application/ld+json">` blocks that failed to parse as JSON.']:
    'JSON kimi təhlil edilə bilməyən `<script type="application/ld+json">` bloklarının sayı.',
  ['Number of <img> elements on the page.']: 'Səhifədəki <img> elementlərinin sayı.',
  ['Number of browser tabs the pool keeps warm in parallel. 0 = auto (matches crawler concurrency, capped at 8). More tabs = faster crawl but more RAM (each tab ~80–150 MB).']:
    'Hovuzun paralel olaraq hazır saxladığı brauzer sekmelerinin sayı. 0 = avtomatik (tarayıcı paralelliyinə uyğun, maksimum 8). Daha çox sekme = daha sürətli tarama, amma daha çox RAM (hər sekme ~80–150 MB).',
  ['Number of hreflang targets that are non-200, noindex, or canonicalised away. Aggregated by the post-crawl pass.']:
    '200 olmayan, noindex olan və ya başqa yerə kanonikləşdirilmiş hreflang hədəflərinin sayı. Tarama sonrası mərhələ tərəfindən toplanır.',
  ["Number of HTTP requests in flight at any one time. Equivalent to Screaming Frog's 'Max Threads'. Higher = faster crawl + more load on the target server."]:
    "Eyni anda gedən HTTP sorğularının sayı. Screaming Frog-un 'Max Threads' ayarına bərabərdir. Daha yüksək = daha sürətli tarama + hədəf serverə daha çox yük.",
  ['Number of internal `<a>` elements with no usable anchor text or alt — accessibility / SEO regression.']:
    'İstifadəyə yararlı lövbər mətni və ya alt-ı olmayan daxili `<a>` elementlərinin sayı — əlçatanlıq / SEO geriləməsi.',
  ['Number of internal pages that link to this URL. A rough internal-PageRank signal.']:
    'Bu URL-ə keçid verən daxili səhifələrin sayı. Kobud daxili PageRank siqnalı.',
  ["Number of pages in this URL's near-duplicate cluster (1 = no duplicates, ≥2 = part of a duplicate group). Tunable via Settings → Duplicates."]:
    'Bu URL-in oxşar-təkrar qrupundakı səhifələrin sayı (1 = təkrar yoxdur, ≥2 = təkrar qrupunun üzvü). Parametrlər → Təkrarlar bölməsində tənzimlənir.',
  ['Number of redirect hops from this URL to its terminal target. Filled by the post-crawl `recomputeRedirectChains` walker. >3 trips the "Long Chain" issue.']:
    'Bu URL-dən son hədəfinə qədər yönləndirmə addımlarının sayı. Tarama sonrası `recomputeRedirectChains` gəzişi tərəfindən doldurulur. >3 "Uzun zəncir" problemini işə salır.',
  ['Number of unique <a> links emitted from this page (internal + external).']:
    'Bu səhifədən çıxan unikal <a> keçidlərinin sayı (daxili + xarici).',
  ['Off — only enable for testing edge cases.']:
    'Söndürülü — yalnız kənar halları sınamaq üçün aktivləşdirin.',
  ['Off — small speed gain not worth the fidelity loss.']:
    'Söndürülü — kiçik sürət qazancı dəqiqlik itkisinə dəyməz.',
  ['On — fonts add overhead without changing SEO output.']:
    'Aktiv — şriftlər SEO nəticəsini dəyişmədən yük əlavə edir.',
  ['On (default) — cheap I/O, high SEO value.']: 'Aktiv (standart) — ucuz I/O, yüksək SEO dəyəri.',
  ['On (default) — media is heavy and rarely SEO-relevant.']:
    'Aktiv (standart) — media ağırdır və nadir hallarda SEO ilə əlaqəlidir.',
  ['On (default) so the Internal tab shows images, not just HTML; off for HTML-only crawls.']:
    'Aktiv (standart) ki, Daxili sekmesi yalnız HTML deyil, şəkilləri də göstərsin; yalnız HTML taramaları üçün söndürün.',
  ['On (default); off for HTML-only crawls.']:
    'Aktiv (standart); yalnız HTML taramaları üçün söndürün.',
  ['On (default). Off only when crawling sites you own and need to bypass.']:
    'Aktiv (standart). Yalnız sahibi olduğunuz və keçmək lazım olan saytları tararkən söndürün.',
  ['On for accessibility / WCAG audits.']: 'Əlçatanlıq / WCAG auditləri üçün aktiv.',
  ['On for max speed. Off if you need LCP candidate detection or visual screenshots later.']:
    'Maksimum sürət üçün aktiv. Sonradan LCP namizəd aşkarlanması və ya vizual ekran görüntüləri lazımdırsa söndürün.',
  ['On for modern sites that 301 http→https anyway; off for legacy intranet.']:
    'Onsuz da http→https 301 edən müasir saytlar üçün aktiv; köhnə intranetlər üçün söndürülü.',
  ['On for normal audits; off when you only want to inspect raw 3xx behaviour.']:
    'Normal auditlər üçün aktiv; yalnız xam 3xx davranışını yoxlamaq istədikdə söndürülü.',
  ['On for outbound link audits; off for fast internal-only crawls.']:
    'Çıxış keçid auditləri üçün aktiv; sürətli yalnız daxili taramalar üçün söndürülü.',
  ['On for performance-focused audits that should fail pages over a target.']:
    'Hədəfi aşan səhifələri uğursuz saymalı olan performans yönümlü auditlər üçün aktiv.',
  ['On for performance-focused audits.']: 'Performans yönümlü auditlər üçün aktiv.',
  ['On for production crawls. Off when debugging selector-not-found / hydration issues.']:
    'İstehsal taramaları üçün aktiv. Seçici tapılmadı / hidrasiya problemlərini sazlayarkən söndürülü.',
  ['ON for SEO audits (the typical case). Turn OFF to also cluster paginated / canonical-blocked variants for completeness.']:
    'SEO auditləri üçün AKTİV (tipik hal). Tamlıq üçün səhifələnmiş / kanonik ilə bloklanmış variantları da qruplaşdırmaq üçün SÖNDÜRÜN.',
  ["On for SEO audits that include Google's Mobile-Friendly checks."]:
    'Google-un Mobil Uyğunluq yoxlamalarını əhatə edən SEO auditləri üçün aktiv.',
  ['On for SEO audits where View Source matters; off for 1M-URL crawls where disk is tight.']:
    'Mənbəyə bax vacib olan SEO auditləri üçün aktiv; diskin məhdud olduğu 1M URL taramaları üçün söndürülü.',
  ['ON for SEO audits. OFF only when you specifically need to inspect raw-URL collisions (e.g. case-sensitive filesystem CMSes).']:
    'SEO auditləri üçün AKTİV. Yalnız xam URL toqquşmalarını xüsusi olaraq yoxlamaq lazım olduqda SÖNDÜRÜN (məs. hərf registrinə həssas fayl sistemli CMS-lər).',
  ['On if you need nofollow attribute audits; off keeps the link graph cleaner.']:
    'nofollow atribut auditləri lazımdırsa aktiv; söndürülü keçid qrafını daha təmiz saxlayır.',
  ['On if your CMS serves the same page at mixed casing (/Foo and /foo).']:
    'CMS-iniz eyni səhifəni qarışıq registrdə verirsə (/Foo və /foo) aktiv.',
  ['On if your site canonicalises to non-www but emits www links somewhere.']:
    'Saytınız www-suz formaya kanonikləşdirir, amma haradasa www keçidləri çıxarırsa aktiv.',
  ["On network errors, 408/425/429/5xx responses, retry up to N more times before giving up. Each retry counts toward the URL's response time budget."]:
    'Şəbəkə xətalarında və 408/425/429/5xx cavablarında imtina etməzdən əvvəl N dəfə də təkrar cəhd et. Hər təkrar cəhd URL-in cavab vaxtı büdcəsinə sayılır.',
  ['On when auditing mobile UX or capturing PageSpeed-style mobile previews.']:
    'Mobil UX auditi edərkən və ya PageSpeed tərzində mobil önizləmələr çəkərkən aktiv.',
  ["One header per line in 'Key: Value' format. Added to every request — useful for auth tokens or custom routing hints. User values override defaults when keys collide."]:
    "'Açar: Dəyər' formatında hər sətirdə bir başlıq. Hər sorğuya əlavə olunur — autentifikasiya tokenləri və ya fərdi yönləndirmə göstərişləri üçün faydalıdır. Açarlar toqquşduqda istifadəçi dəyərləri standartları əvəz edir.",
  ['One sitemap URL per line. On top of following links from the start URL, the crawler fetches these sitemaps and queues every page they list as an extra seed — faster/more complete discovery, and reliable orphan detection even when the sitemap lives at a non-standard path. Leave empty to disable.']:
    'Hər sətirdə bir sitemap URL-i. Başlanğıc URL-dən keçidləri izləməklə yanaşı, tarayıcı bu sitemap-ləri yükləyir və siyahıdakı hər səhifəni əlavə toxum kimi növbəyə qoyur — daha sürətli/tam kəşf və sitemap qeyri-standart yolda olsa belə etibarlı yetim aşkarlanması. Söndürmək üçün boş buraxın.',
  ['One URL per line. Each is fetched exactly once; outlinks are NOT followed. Comments starting with # are ignored.']:
    'Hər sətirdə bir URL. Hər biri tam bir dəfə yüklənir; çıxış keçidləri İZLƏNMİR. # ilə başlayan şərhlər nəzərə alınmır.',
  ['OS scheduler hint applied at crawl start. Lowering priority lets the rest of the machine stay responsive during heavy crawls. May require elevated privileges on some platforms.']:
    'Tarama başlananda tətbiq olunan ƏS planlaşdırıcı göstərişi. Prioriteti azaltmaq ağır taramalar zamanı maşının qalan hissəsinin cavab verməsini təmin edir. Bəzi platformalarda yüksəldilmiş imtiyazlar tələb oluna bilər.',
  ["Page A→B declared but B→A absent flags 'Reciprocity Missing'; same lang on two hrefs flags 'Inconsistent Lang'."]:
    "Səhifə A→B bəyan edilib, amma B→A yoxdursa 'Qarşılıqlılıq yoxdur' işarələnir; iki href-də eyni lang 'Uyğunsuz lang' işarələnir.",
  ['Page that contains the broken link.']: 'Qırıq keçidi ehtiva edən səhifə.',
  ["Pages with > this many outgoing links (internal + external) trip the 'Total Links per Page' issue. Google's historic recommendation is 100; mega-menus/hub-pages routinely blow past this."]:
    "Çıxış keçidləri (daxili + xarici) bu saydan çox olan səhifələr 'Səhifə başına ümumi keçidlər' problemini işə salır. Google-un tarixi tövsiyəsi 100-dür; meqa-menyular/hub səhifələr bunu mütəmadi aşır.",
  ['PASS = indexed · FAIL = not indexed · PART/NEU = discovered but not yet indexed']:
    'PASS = indekslənib · FAIL = indekslənməyib · PART/NEU = kəşf edilib, amma hələ indekslənməyib',
  ['Pattern: ^https://m\\.(.+) · Replacement: https://www.$1 · Flags: i  (collapse mobile subdomain to www)']:
    'Şablon: ^https://m\\.(.+) · Əvəz: https://www.$1 · Bayraqlar: i  (mobil alt-domeni www-ya yığ)',
  ["Per-request abort threshold. Pages that take longer than this are recorded as network errors. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — that one's in seconds, this is in milliseconds."]:
    "Sorğu başına dayandırma həddi. Bundan uzun çəkən səhifələr şəbəkə xətası kimi qeyd olunur. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — o saniyələrlə, bu millisaniyələrlədir.",
  ['Persist rel="nofollow" links in the link graph. When off, nofollow links are dropped entirely (not counted in outlinks, not probed as externals). Screaming Frog inverse: turning this ON ≈ unchecking "Follow Internal/External Nofollow".']:
    'rel="nofollow" keçidlərini keçid qrafında saxla. Söndürülü olduqda nofollow keçidlər tamamilə atılır (çıxış keçidlərinə sayılmır, xarici kimi yoxlanmır). Screaming Frog-un əksi: bunu aktivləşdirmək ≈ "Follow Internal/External Nofollow" işarəsini götürmək.',
  ['Picking a preset fills the User-Agent field below — you can still hand-edit it afterwards. Switch between Googlebot Smartphone / Desktop to compare how a site responds to mobile vs desktop crawlers.']:
    'Hazır ayar seçmək aşağıdakı User-Agent sahəsini doldurur — sonra yenə əl ilə redaktə edə bilərsiniz. Saytın mobil və masaüstü tarayıcılara necə cavab verdiyini müqayisə etmək üçün Googlebot Smartphone / Desktop arasında keçid edin.',
  ["Picks one of the saved profiles by name. Empty = use the Proxy URL field above (or env vars when that's also empty)."]:
    'Yadda saxlanılmış profillərdən birini adı ilə seçir. Boş = yuxarıdakı Proksi URL sahəsindən istifadə et (o da boşdursa mühit dəyişənlərindən).',
  ['Pre-computes Dead External Domain, Duplicate URL post-norm, Canonical Chain Multi-hop. Without this the sidebar shows 0 for those three.']:
    'Ölü xarici domen, Normallaşdırma sonrası təkrar URL, Çox addımlı kanonik zənciri əvvəlcədən hesablayır. Bu olmadan yan panel həmin üçü üçün 0 göstərir.',
  ['After the crawl, re-fetches a sample of indexable pages with the opposite user agent (mobile when the crawl ran as desktop, desktop otherwise) and compares title, H1, meta description, canonical, robots, word count and link count. Differences feed the \'Mobile / Desktop Mismatch\' issue and the report of the same name.']:
    'Taramadan sonra indekslənə bilən səhifələrin nümunəsini əks istifadəçi agenti ilə (tarama masaüstü idisə mobil, əksinə isə masaüstü) yenidən yükləyir və başlıq, H1, meta təsvir, canonical, robots, söz sayı və keçid sayını müqayisə edir. Fərqlər \'Mobil / masaüstü uyğunsuzluğu\' probleminə və eyni adlı hesabata daxil olur.',
  ['How many pages the mobile-parity probe re-fetches, most-linked first. 0 = every indexable HTML page (doubles the crawl\'s traffic for that set).']:
    'Mobil paritet yoxlamasının yenidən yüklədiyi səhifə sayı, ən çox keçid alanlar əvvəl. 0 = bütün indekslənə bilən HTML səhifələr (həmin dəst üçün tarama trafikini ikiqat artırır).',
  ["Probe outbound links to other hosts (HEAD only) so the Broken Links view catches dead externals. Screaming Frog: 'External Links' (Configuration → Spider → Crawl)."]:
    "Başqa hostlara çıxış keçidlərini yoxla (yalnız HEAD) ki, Qırıq keçidlər görünüşü ölü xariciləri tutsun. Screaming Frog: 'External Links' (Configuration → Spider → Crawl).",
  ['Raw `Content-Security-Policy` response header. Empty when missing.']:
    'Xam `Content-Security-Policy` cavab başlığı. Yoxdursa boşdur.',
  ['Raw `content` attribute of `<meta http-equiv="refresh">`, e.g. "5; url=/foo".']:
    '`<meta http-equiv="refresh">`-in xam `content` atributu, məs. "5; url=/foo".',
  ['Raw `Strict-Transport-Security` header. Empty when missing — for HTTPS pages this is a security regression.']:
    'Xam `Strict-Transport-Security` başlığı. Yoxdursa boşdur — HTTPS səhifələr üçün bu təhlükəsizlik geriləməsidir.',
  ['Raw `X-Content-Type-Options` header. `nosniff` blocks MIME sniffing — prevents some XSS via content-type confusion.']:
    'Xam `X-Content-Type-Options` başlığı. `nosniff` MIME iyləməni bloklayır — content-type qarışıqlığı ilə bəzi XSS-lərin qarşısını alır.',
  ['Raw `X-Frame-Options` header. SAMEORIGIN / DENY / ALLOW-FROM. Clickjacking defence.']:
    'Xam `X-Frame-Options` başlığı. SAMEORIGIN / DENY / ALLOW-FROM. Clickjacking müdafiəsi.',
  ['Raw value of the Content-Type response header (incl. charset).']:
    'Content-Type cavab başlığının xam dəyəri (charset daxil).',
  ['Re-renders each page on a mobile viewport and checks viewport meta tag, horizontal overflow, font size legibility, and tap-target spacing. Stores a pass/fail verdict on the urls table.']:
    'Hər səhifəni mobil görünüş sahəsində yenidən render edir və viewport meta teqini, üfüqi daşmanı, şrift ölçüsü oxunaqlığını və toxunma hədəfi məsafəsini yoxlayır. urls cədvəlində keçdi/keçmədi qərarını saxlayır.',
  ['Read the full article →']: 'Tam məqaləni oxu →',
  ["Reject-all = ignore Set-Cookie entirely (zero counts on cookie-flag issues). Block-third-party = analyse only first-party cookies (Domain attribute matches the page's registrable domain). Accept-all = analyse every Set-Cookie regardless of scope."]:
    'Hamısını rədd et = Set-Cookie-ni tamamilə nəzərə alma (kuki bayrağı problemlərində sıfır say). Üçüncü tərəfləri blokla = yalnız birinci tərəf kukilərini təhlil et (Domain atributu səhifənin qeydiyyatlı domeninə uyğundur). Hamısını qəbul et = əhatədən asılı olmayaraq hər Set-Cookie-ni təhlil et.',
  ["Reject-all for stateless audits; Block-third-party to focus on the site's own cookie hygiene; Accept-all to also see ad/analytics tracker cookies."]:
    'Vəziyyətsiz auditlər üçün Hamısını rədd et; saytın öz kuki gigiyenasına fokuslanmaq üçün Üçüncü tərəfləri blokla; reklam/analitika izləyici kukilərini də görmək üçün Hamısını qəbul et.',
  ["Removes the leading 'www.' from the host at normalisation time. The seen-set, redirect graph, and link extraction all use the rewritten form, so duplicates collapse correctly."]:
    "Normallaşdırma zamanı hostun əvvəlindəki 'www.'-nu silir. Görülənlər çoxluğu, yönləndirmə qrafı və keçid çıxarışı hamısı yenidən yazılmış formadan istifadə edir, ona görə təkrarlar düzgün birləşir.",
  ['Renders the page a second time on a mobile viewport and stores an above-the-fold PNG. Adds another full render + screenshot per URL.']:
    'Səhifəni mobil görünüş sahəsində ikinci dəfə render edir və above-the-fold PNG saxlayır. Hər URL üçün daha bir tam render + ekran görüntüsü əlavə edir.',
  ['Resolved absolute URL of the <img src> attribute.']:
    '<img src> atributunun həll edilmiş mütləq URL-i.',
  ['Response body size in bytes (compressed transfer size, post-Content-Encoding).']:
    'Cavab gövdəsinin baytla ölçüsü (sıxılmış ötürmə ölçüsü, Content-Encoding-dən sonra).',
  ['Rewrites http:// to https:// before fetching. Breaks HTTP-only sites.']:
    'Yükləmədən əvvəl http://-ni https://-ə yenidən yazır. Yalnız HTTP saytları pozur.',
  ['Run Chromium without a visible window. Turn off to debug rendering visually — useful when a page renders correctly in a normal browser but not under Playwright.']:
    'Chromium-u görünən pəncərəsiz işlət. Renderi vizual olaraq sazlamaq üçün söndürün — səhifə normal brauzerdə düzgün render olunur, amma Playwright altında olunmursa faydalıdır.',
  ['Run the login steps once before the crawl, then replay the session cookies on every request.']:
    'Giriş addımlarını taramadan əvvəl bir dəfə işlət, sonra sessiya kukilərini hər sorğuda təkrar istifadə et.',
  ["Runs iterative PageRank (damping 0.85) over the internal link graph and normalises it to a 0–100 Link Score per page. Drives the Link Score column and the 'By Link Score' visualization colour mode."]:
    "Daxili keçid qrafı üzərində iterativ PageRank (sönmə 0.85) işlədir və onu səhifə başına 0–100 Keçid balına normallaşdırır. Keçid balı sütununu və vizuallaşdırmanın 'Keçid balına görə' rəng rejimini doldurur.",
  ['Sends the URL through the same normalisation pipeline used by the crawler, with your unsaved settings applied. Useful for verifying regex rules before kicking off a crawl.']:
    'URL-i tarayıcının istifadə etdiyi eyni normallaşdırma boru xəttindən, yadda saxlanılmamış parametrləriniz tətbiq olunmaqla keçirir. Taramanı başlatmazdan əvvəl regex qaydalarını yoxlamaq üçün faydalıdır.',
  ['Sent on every request as the User-Agent header. Identifies the crawler to servers; some sites serve different content based on UA.']:
    'Hər sorğuda User-Agent başlığı kimi göndərilir. Tarayıcını serverlərə tanıdır; bəzi saytlar UA-ya görə fərqli məzmun verir.',
  ['Sent on every request. Affects which locale a multi-lingual site serves you.']:
    'Hər sorğuda göndərilir. Çoxdilli saytın sizə hansı lokalı verəcəyinə təsir edir.',
  ["Sent verbatim as `Bearer <token>`. Don't include the `Bearer ` prefix yourself."]:
    'Olduğu kimi `Bearer <token>` formasında göndərilir. `Bearer ` prefiksini özünüz əlavə etməyin.',
  ['Server response time (a TTFB proxy) measured during the crawl. Pages slower than this are flagged. Google considers a good server response time under 800 ms.']:
    'Tarama zamanı ölçülən server cavab vaxtı (TTFB göstəricisi). Bundan yavaş səhifələr işarələnir. Google 800 ms-dən aşağı server cavab vaxtını yaxşı sayır.',
  ['Shop the latest game keys at unbeatable prices…']:
    'Ən yeni oyun açarlarını sərfəli qiymətlərlə alın…',
  ["Skips body parsing for pages whose Content-Length header exceeds this. The page row is still created so links to it aren't lost; only body parsing and source snapshot capture are skipped."]:
    'Content-Length başlığı bu dəyəri aşan səhifələr üçün gövdə təhlilini atlayır. Səhifə sətri yenə yaradılır ki, ona gedən keçidlər itməsin; yalnız gövdə təhlili və mənbə anlıq görüntüsü atlanır.',
  ['Sleep this long on each worker AFTER a response completes, before it picks up the next URL. Stacks with the global RPS cap — useful for sites that rate-limit on inter-request gap rather than total throughput.']:
    'Hər işçi cavab tamamlandıqdan SONRA, növbəti URL-i götürməzdən əvvəl bu qədər gözləsin. Qlobal RPS tavanı ilə toplanır — ümumi ötürmə əvəzinə sorğular arası intervala görə sürəti məhdudlaşdıran saytlar üçün faydalıdır.',
  ['Specific reason a URL is non-indexable. For Indexable URLs this column is empty.']:
    'URL-in indekslənməməsinin konkret səbəbi. İndekslənən URL-lər üçün bu sütun boşdur.',
  ['Spider follows links from the start URL across the chosen scope. List fetches a fixed set of URLs once with no link-following. Sitemap fetches a sitemap URL and crawls every page it lists (no link-following).']:
    'Spider seçilmiş əhatədə başlanğıc URL-dən keçidləri izləyir. Siyahı sabit URL dəstini keçid izləmədən bir dəfə yükləyir. Sitemap bir sitemap URL-ini yükləyir və siyahıdakı hər səhifəni tarayır (keçid izləmədən).',
  ["Spider for full site audits; List for re-checking a known set of pages; Sitemap to audit exactly what's published in sitemap.xml."]:
    'Tam sayt auditləri üçün Spider; məlum səhifə dəstini yenidən yoxlamaq üçün Siyahı; sitemap.xml-də dərc olunanları dəqiq audit etmək üçün Sitemap.',
  ['Standard CSS selector — same syntax as `document.querySelectorAll`.']:
    'Standart CSS seçicisi — `document.querySelectorAll` ilə eyni sintaksis.',
  ['Stored in your local prefs file as plain text. Treat the file accordingly.']:
    'Yerli tərcihlər faylınızda açıq mətn kimi saxlanılır. Fayla buna uyğun yanaşın.',
  ['Strip if your site canonicalises /foo (no slash); Add for sites that canonicalise /foo/.']:
    'Saytınız /foo (slaşsız) kanonikləşdirirsə Sil; /foo/ kanonikləşdirən saytlar üçün Əlavə et.',
  ['Sunset over the mountain ridge']: 'Dağ silsiləsi üzərində gün batımı',
  ['Surplus `@id` occurrences across all JSON-LD blocks (page declares the same `@id` more than once).']:
    'Bütün JSON-LD bloklarında artıq `@id` təkrarları (səhifə eyni `@id`-ni birdən çox bəyan edir).',
  ['Terminal URL the redirect chain resolves to. Empty when this row is itself the terminal (i.e. status is 2xx/4xx/5xx) or when the chain hits a loop.']:
    'Yönləndirmə zəncirinin həll olunduğu son URL. Bu sətir özü sondursa (yəni status 2xx/4xx/5xx) və ya zəncir dövrə düşürsə boşdur.',
  ['Canonical hops walked after this page (or, on a redirect row, after the redirect\'s final URL) until a page that canonicalises to itself. 0 when the canonical is the page itself or absent.']:
    'Bu səhifədən (yönləndirmə sətrində yönləndirmənin son URL-indən) sonra özünə canonical verən səhifəyə qədər keçilən canonical addımların sayı. Canonical səhifənin özüdürsə və ya yoxdursa 0.',
  ['Where the canonical chain ends. Empty when the page is its own canonical, or when the chain loops.']:
    'Canonical zəncirinin bitdiyi yer. Səhifə öz canonical-ıdırsa və ya zəncir dövr edirsə boşdur.',
  ['text for visible content, attribute for href/src, count for occurrence count']:
    'görünən məzmun üçün text, href/src üçün attribute, təkrar sayı üçün count',
  ['Text of the first <h1> on the page. Should match user intent and ideally complement (not duplicate) the title.']:
    'Səhifədəki ilk <h1>-in mətni. İstifadəçi niyyətinə uyğun olmalı və ideal olaraq başlığı tamamlamalıdır (təkrarlamamalı).',
  ["Text Only fetches the raw HTML response as-is — fast and deterministic. Old AJAX Crawling Scheme rewrites hashbang (#!) URLs to Google's deprecated ?_escaped_fragment_= form so a pre-rendering server returns the snapshot. Full JavaScript rendering is a V2 item."]:
    'Yalnız mətn xam HTML cavabını olduğu kimi yükləyir — sürətli və determinist. Köhnə AJAX Crawling Scheme hashbang (#!) URL-ləri Google-un köhnəlmiş ?_escaped_fragment_= formasına yenidən yazır ki, ön-render serveri anlıq görüntünü qaytarsın. Tam JavaScript render V2 maddəsidir.',
  ['Text Only for server-rendered / static sites; Old AJAX only for legacy hashbang SPAs.']:
    'Server tərəfli / statik saytlar üçün Yalnız mətn; Köhnə AJAX yalnız köhnə hashbang SPA-lar üçün.',
  ["The column / JSON-key name for this rule's output. Free-form."]:
    'Bu qaydanın çıxışı üçün sütun / JSON açar adı. Sərbəst forma.',
  ['The fully normalised URL of the crawled resource (post URL-rewriting).']:
    'Taranan resursun tam normallaşdırılmış URL-i (URL yenidən yazılmasından sonra).',
  ['The URL that fails to resolve (4xx/5xx/network error).']:
    'Həll olunmayan URL (4xx/5xx/şəbəkə xətası).',
  ['Third-party `<script>` / `<link rel=stylesheet>` references without an `integrity=` attribute. SRI is recommended for any cross-origin subresource.']:
    '`integrity=` atributu olmayan üçüncü tərəf `<script>` / `<link rel=stylesheet>` istinadları. Hər hansı çarpaz mənşəli alt-resurs üçün SRI tövsiyə olunur.',
  ['Time-to-first-byte in milliseconds (network + server, excluding parse). Lower is better; >2000 ms is slow.']:
    'Millisaniyələrlə ilk bayta qədər vaxt (şəbəkə + server, təhlil xaric). Aşağı daha yaxşıdır; >2000 ms yavaşdır.',
  ['Total number of <h1> elements on the page. SEO best practice is exactly 1.']:
    'Səhifədəki <h1> elementlərinin ümumi sayı. SEO ən yaxşı təcrübəsi tam 1-dir.',
  ['Total number of <h2> elements on the page.']: 'Səhifədəki <h2> elementlərinin ümumi sayı.',
  ['tr,en;q=0.8 — Turkish first, English fallback.']:
    'tr,en;q=0.8 — əvvəlcə türk, ehtiyat kimi ingilis.',
  ["Trips 'Folder Depth Too Deep' when the URL path's `/`-segment count exceeds this. Useful for spotting over-nested URL structures that bury content from crawlers."]:
    "URL yolunun `/`-seqment sayı bunu aşdıqda 'Qovluq dərinliyi çox böyükdür' işə düşür. Məzmunu tarayıcılardan gizlədən həddindən artıq iç-içə URL strukturlarını tapmaq üçün faydalıdır.",
  ["Trips 'Long Query String' when LENGTH(query) > this. Typical session-id sprawl + UTM tracking hits 100+ chars; over 200 starts to look like a bug."]:
    "LENGTH(query) > bu olduqda 'Uzun sorğu sətri' işə düşür. Tipik sessiya id yayılması + UTM izləmə 100+ simvola çatır; 200-dən çox artıq səhvə bənzəyir.",
  ["Trips the 'URL Too Long' issue when LENGTH(url) > this. RFC 7230 doesn't mandate a max but most servers + middleboxes fail above ~2 KB; Chrome itself caps at ~32 KB."]:
    "LENGTH(url) > bu olduqda 'URL çox uzundur' problemi işə düşür. RFC 7230 maksimum tələb etmir, amma serverlərin və ara qurğuların əksəriyyəti ~2 KB-dan yuxarı uğursuz olur; Chrome özü ~32 KB-da məhdudlaşdırır.",
  ["Two modes per line. (1) Wrap in slashes for a regex: /pattern/flags — supported flags imsuy (g is forced). Invalid patterns appear with count -1 in the detail panel so you can spot the typo. (2) Anything else is a literal case-insensitive substring — the legacy behaviour. Each term's per-page hit count is surfaced in the URL Details panel."]:
    'Hər sətirdə iki rejim. (1) Regex üçün slaşlarla bükün: /şablon/bayraqlar — dəstəklənən bayraqlar imsuy (g məcburidir). Yanlış şablonlar detal panelində -1 sayı ilə görünür ki, yazı səhvini tapa biləsiniz. (2) Qalan hər şey hərf registrinə həssas olmayan hərfi alt-sətirdir — köhnə davranış. Hər terminin səhifə başına uyğunluq sayı URL detalları panelində göstərilir.',
  ["Two pages are flagged as near-duplicates if their 64-bit SimHash differs by at most this many bits. 3 ≈ 95% similarity over body-text shingles (Screaming Frog's tightest filter). Set to 0 to skip clustering entirely."]:
    'İki səhifənin 64-bit SimHash-i ən çox bu qədər bit fərqlənirsə oxşar-təkrar kimi işarələnir. 3 ≈ gövdə mətni shingle-ları üzərində 95% oxşarlıq (Screaming Frog-un ən sıx filtri). Klasterləşdirməni tamamilə atlamaq üçün 0 təyin edin.',
  ['URL declared by the first <link rel="canonical"> tag. Tells search engines which version to index when duplicates exist.']:
    'İlk <link rel="canonical"> teqi ilə bəyan edilmiş URL. Təkrarlar olduqda axtarış sistemlərinə hansı versiyanı indeksləməli olduğunu bildirir.',
  ['URL paths ending in any of these extensions are not enqueued. Case-insensitive. Start URL is always crawled regardless.']:
    'Bu uzantılardan hər hansı biri ilə bitən URL yolları növbəyə qoyulmur. Hərf registrinə həssas deyil. Başlanğıc URL hər halda həmişə taranır.',
  ['Value of the alt attribute. Empty cell = no alt declared (accessibility/SEO issue).']:
    'alt atributunun dəyəri. Boş xana = alt bəyan edilməyib (əlçatanlıq/SEO problemi).',
  ['Value of the X-Robots-Tag HTTP response header. Same semantics as meta robots but applied at the server.']:
    'X-Robots-Tag HTTP cavab başlığının dəyəri. meta robots ilə eyni semantika, amma serverdə tətbiq olunur.',
  ['Viewport height — affects above-the-fold detection and lazy-load triggers.']:
    'Görünüş sahəsi hündürlüyü — above-the-fold aşkarlanmasına və lazy-load tətiklərinə təsir edir.',
  ['Viewport width applied to every rendered page. Mobile audits typically use 360–414, desktop 1280–1920.']:
    'Render edilən hər səhifəyə tətbiq olunan görünüş sahəsi eni. Mobil auditlər adətən 360–414, masaüstü 1280–1920 istifadə edir.',
  ['Visible body text word count (excludes <script>/<style>). Useful for identifying thin content.']:
    'Görünən gövdə mətninin söz sayı (<script>/<style> xaric). Zəif məzmunu müəyyən etmək üçün faydalıdır.',
  ['Wait this long before the FIRST retry, doubling on each subsequent attempt (500 → 1000 → 2000 …).']:
    'İLK təkrar cəhddən əvvəl bu qədər gözlə, hər sonrakı cəhddə ikiqat artır (500 → 1000 → 2000 …).',
  ["Walks 3xx redirect chains, fills `redirect_chain_length` / `redirect_loop`. Drives the 'Long Chain' and 'Redirect Loop' issues + the Redirects tab."]:
    "3xx yönləndirmə zəncirlərini gəzir, `redirect_chain_length` / `redirect_loop` doldurur. 'Uzun zəncir' və 'Yönləndirmə dövrü' problemlərini + Yönləndirmələr sekmesini doldurur.",
  ['Welcome to Example Store']: 'Nümunə mağazaya xoş gəlmisiniz',
  ['What to do when multiple matches exist.']: 'Çoxlu uyğunluq olduqda nə etməli.',
  ['What to read off each matched element. Ignored for an XPath `/@attr` or `/text()` terminal — that value is used directly.']:
    'Hər uyğun gələn elementdən nə oxumalı. XPath `/@attr` və ya `/text()` sonluğu üçün nəzərə alınmır — həmin dəyər birbaşa istifadə olunur.',
  ['When non-empty, ALL query parameters not on this list are dropped during normalisation (case-insensitive name match). Leave empty to keep the default behaviour, which strips just utm_*, fbclid, gclid, mc_cid, and mc_eid.']:
    'Boş olmadıqda bu siyahıda olmayan BÜTÜN sorğu parametrləri normallaşdırma zamanı atılır (hərf registrinə həssas olmayan ad uyğunluğu). Yalnız utm_*, fbclid, gclid, mc_cid və mc_eid-i silən standart davranışı saxlamaq üçün boş buraxın.',
  ['When off, no budget evaluation runs and the verdict column is cleared. When on, the post-crawl pass scores every internal 200 HTML page against the ceilings below.']:
    'Söndürülü olduqda büdcə qiymətləndirməsi işləmir və qərar sütunu təmizlənir. Aktiv olduqda tarama sonrası mərhələ hər daxili 200 HTML səhifəni aşağıdakı tavanlara görə qiymətləndirir.',
  ['When on (default), pagination_next + pagination_prev URLs are post-fetch enqueued. Off only to debug pagination-only loops without disabling all link follow.']:
    'Aktiv olduqda (standart) pagination_next + pagination_prev URL-ləri yükləmədən sonra növbəyə qoyulur. Yalnız bütün keçid izləməni söndürmədən yalnız-səhifələmə dövrlərini sazlamaq üçün söndürün.',
  ['When ON (default), the Duplicate URL filter compares URLs after lowercasing the host, dropping the query string, and trimming the trailing slash — the canonical SEO behaviour. When OFF, comparison is byte-exact, so the filter only fires on rows that share an identical raw URL string (rare since URLs are deduped at insert time).']:
    'AKTİV olduqda (standart) Təkrar URL filtri URL-ləri hostu kiçik hərfə çevirib, sorğu sətrini atıb və sonluq slaşını kəsib müqayisə edir — kanonik SEO davranışı. SÖNDÜRÜLÜ olduqda müqayisə bayt-dəqiqdir, ona görə filtr yalnız eyni xam URL sətrini paylaşan sətirlərdə işləyir (nadirdir, çünki URL-lər daxil edilərkən təkrarsızlaşdırılır).',
  ["When on, `<meta http-equiv='refresh'>` content URLs are enqueued like a redirect target. window.location body redirects are heuristic-only and currently out of scope."]:
    "Aktiv olduqda `<meta http-equiv='refresh'>` content URL-ləri yönləndirmə hədəfi kimi növbəyə qoyulur. window.location gövdə yönləndirmələri yalnız evristikdir və hazırda əhatə xaricindədir.",
  ['When on, a 200 page declaring a canonical pointing elsewhere also enqueues that target. Default off — most crawls treat canonicals as a signal, not a navigation hint.']:
    'Aktiv olduqda başqa yerə kanonik bəyan edən 200 səhifə həmin hədəfi də növbəyə qoyur. Standart söndürülü — taramaların əksəriyyəti kanonikləri naviqasiya göstərişi yox, siqnal kimi qəbul edir.',
  ['When on, pages with noindex / canonicalised / robots-blocked indexability are excluded from clustering — the Near-Duplicate report then surfaces only issues that affect search visibility.']:
    'Aktiv olduqda noindex / kanonikləşdirilmiş / robots ilə bloklanmış indekslənmə statusu olan səhifələr klasterləşdirmədən çıxarılır — Oxşar-təkrar hesabatı o zaman yalnız axtarış görünürlüyünə təsir edən problemləri göstərir.',
  ["When on, rel=nofollow links are recursed into like any other link. Default off — Screaming Frog 'Respect Nofollow' default."]:
    "Aktiv olduqda rel=nofollow keçidlər hər hansı digər keçid kimi izlənir. Standart söndürülü — Screaming Frog 'Respect Nofollow' standartı.",
  ['When Playwright considers navigation complete. domcontentloaded = HTML parsed but resources still loading. load = window.load fired. networkidle = no network activity for 500ms (best for SPA but slower). commit = just response committed (fastest, riskiest).']:
    'Playwright naviqasiyanı nə vaxt tamamlanmış sayır. domcontentloaded = HTML təhlil edilib, amma resurslar hələ yüklənir. load = window.load işə düşüb. networkidle = 500 ms şəbəkə fəaliyyəti yoxdur (SPA üçün ən yaxşı, amma daha yavaş). commit = yalnız cavab təsdiqlənib (ən sürətli, ən riskli).',
  ['Whether the broken target is on the same site (internal) or a different host (external).']:
    'Qırıq hədəfin eyni saytda (daxili) və ya fərqli hostda (xarici) olması.',
  ['Whether the URL is eligible to appear in search results. Combines status code, robots directives, canonical, and meta-refresh signals.']:
    'URL-in axtarış nəticələrində görünməyə uyğun olub-olmaması. Status kodu, robots direktivləri, kanonik və meta-refresh siqnallarını birləşdirir.',
  ['Width attribute value (in pixels) declared on the <img> tag, when present.']:
    '<img> teqində bəyan edilmiş width atributunun dəyəri (piksellə), mövcud olduqda.',
  ['XPath 1.0 subset over the parsed DOM. End in `/@attr` or `/text()` to read an attribute / text node. Predicates: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.']:
    'Təhlil edilmiş DOM üzərində XPath 1.0 alt-çoxluğu. Atribut / mətn düyünü oxumaq üçün `/@attr` və ya `/text()` ilə bitirin. Predikatlar: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.',
  ['Y when the page declares hreflang alternates but no entry whose `href` matches the page URL. Google requires a self-reference.']:
    'Səhifə hreflang alternativləri bəyan edir, amma `href`-i səhifə URL-inə uyğun gələn qeyd yoxdursa Y. Google özünə istinad tələb edir.',
  ['Y when the redirect chain originating at this URL contains a cycle (A → B → A) detected by the cycle-safe walker; the chain is otherwise unwalked.']:
    'Bu URL-dən başlayan yönləndirmə zənciri dövr-təhlükəsiz gəziş tərəfindən aşkarlanan dövr (A → B → A) ehtiva edirsə Y; əks halda zəncir gəzilmir.',
  ['Y when this URL belongs to a paginated cluster whose ordinal sequence has a gap (e.g. ?page=1, 2, 4 — page 3 missing). Set by the post-crawl `recomputePaginationSequence` pass.']:
    'Bu URL sıra ardıcıllığında boşluq olan səhifələnmiş qrupa aiddirsə Y (məs. ?page=1, 2, 4 — səhifə 3 yoxdur). Tarama sonrası `recomputePaginationSequence` mərhələsi tərəfindən təyin edilir.',
  ['SQL injection — the request tries to smuggle SQL into a parameter (UNION SELECT, sleep(), error-based functions) to read or alter your database.']:
    'SQL inyeksiyası — sorğu verilənlər bazanızı oxumaq və ya dəyişmək üçün parametrə SQL soxmağa çalışır (UNION SELECT, sleep(), xəta əsaslı funksiyalar).',
  ['Cross-site scripting — the request carries script markup or a javascript: URL in a parameter, hoping the page echoes it back into the HTML unescaped.']:
    'Saytlararası skript — sorğu parametrdə skript işarələməsi və ya javascript: URL daşıyır, səhifənin onu HTML-ə qaçışsız geri qaytaracağına ümid edir.',
  ['Path traversal — the request walks out of the web root with ../ or encoded variants to reach files like /etc/passwd or win.ini.']:
    'Yol keçidi — sorğu /etc/passwd və ya win.ini kimi fayllara çatmaq üçün ../ və ya kodlanmış variantlarla veb kökündən kənara çıxır.',
  ['Command injection — the request appends shell syntax (;, |, backticks, $( )) to a parameter to run commands on the server.']:
    'Əmr inyeksiyası — sorğu serverdə əmrlər işlətmək üçün parametrə shell sintaksisi (;, |, əks dırnaqlar, $( )) əlavə edir.',
  ['Scanner probe — an automated vulnerability scanner walking a wordlist of known admin panels, installers and exploit paths (wp-login, phpmyadmin, /actuator, shell uploads). Not tailored to your site; it hits everyone.']:
    'Skaner zondu — məlum admin panelləri, quraşdırıcılar və exploit yollarından (wp-login, phpmyadmin, /actuator, shell yükləmələri) ibarət söz siyahısını gəzən avtomatik zəiflik skaneri. Sizin saytınıza uyğunlaşdırılmayıb; hamıya vurur.',
  ['Sensitive file fetch — a direct request for something that must never be public: .env, .git, backups, SQL dumps, private keys, config files.']:
    'Həssas fayl sorğusu — heç vaxt ictimai olmamalı bir şeyə birbaşa sorğu: .env, .git, ehtiyat nüsxələr, SQL dampları, şəxsi açarlar, konfiqurasiya faylları.',
  ['Anomaly — malformed or evasive input (null bytes, CRLF injection, over-encoding, absurd parameter lengths) that matches no single attack class but is not a normal browser request.']:
    'Anomaliya — heç bir konkret hücum sinfinə uyğun gəlməyən, amma normal brauzer sorğusu da olmayan pozuq və ya yayınan giriş (null baytlar, CRLF inyeksiyası, həddindən artıq kodlama, absurd parametr uzunluqları).',
  ['Sum of the weights of every attack signature the request matched. Each signature carries a weight by how conclusive it is (a UNION SELECT weighs 9, a stray quote 2), and a line is only flagged once the total reaches 5 — so one decisive pattern flags on its own, while weak hints have to add up. Higher score = less room for a false positive; sort by it to triage.']:
    'Sorğunun uyğun gəldiyi hər hücum imzasının çəkilərinin cəmi. Hər imza nə qədər qəti olmasına görə çəki daşıyır (UNION SELECT 9, tək dırnaq 2), və sətir yalnız cəm 5-ə çatdıqda işarələnir — beləliklə bir qəti şablon özü işarələyir, zəif ipucları isə toplanmalıdır. Daha yüksək bal = yanlış müsbət üçün daha az yer; triaj üçün buna görə sıralayın.',
  ['Which attack class the strongest matching signature belongs to: SQL injection, XSS, path traversal, command injection, scanner probe, sensitive file, or anomaly. Hover any badge in this column for what that class means in practice.']:
    'Ən güclü uyğun imzanın aid olduğu hücum sinfi: SQL inyeksiyası, XSS, yol keçidi, əmr inyeksiyası, skaner zondu, həssas fayl və ya anomaliya. Həmin sinfin praktikada nə demək olduğunu görmək üçün bu sütundakı hər hansı nişanın üzərinə gəlin.',
  ["Filters on the Status column — the most recent response the log recorded for that path. The analyzer keeps one status per URL rather than a full distribution, so this answers 'what is this URL returning now'. Paths whose status could not be parsed are hidden while a class is selected."]:
    "Status sütununa görə filtr — jurnalın həmin yol üçün qeyd etdiyi ən son cavab. Analizator tam paylanma əvəzinə hər URL üçün bir status saxlayır, ona görə bu 'bu URL indi nə qaytarır' sualına cavab verir. Statusu təhlil edilə bilməyən yollar sinif seçildikdə gizlədilir.",
  ['Most recent HTTP status the log recorded for this path. One value per URL, not a distribution — a path that returned 200 all week and 404 this morning shows 404.']:
    'Jurnalın bu yol üçün qeyd etdiyi ən son HTTP statusu. Hər URL üçün bir dəyər, paylanma deyil — bütün həftə 200, bu səhər 404 qaytaran yol 404 göstərir.',
  ['A URL whose path repeats the same segment this many times or more (/shop/shop/shop/…) is treated as a link loop and skipped. This shape comes from a relative-href bug and has no legitimate counterpart. Skipped counts are reported when the crawl finishes.']:
    'Yolu eyni seqmenti bu qədər və ya daha çox təkrarlayan URL (/shop/shop/shop/…) keçid dövrü sayılır və atlanır. Bu forma nisbi href səhvindən gəlir və qanuni qarşılığı yoxdur. Atlanan saylar tarama bitdikdə bildirilir.',
  ['3 is safe for every site; raise to 4–5 only if a real path legitimately repeats a segment; 0 disables the guard.']:
    '3 hər sayt üçün təhlükəsizdir; yalnız real yol qanuni olaraq seqment təkrarlayırsa 4–5-ə qaldırın; 0 qoruyucunu söndürür.',
  ['URLs with more query parameters than this are flagged as faceted-navigation traps under Issues → URL → Crawl Trap. Detection only — the URLs are still crawled, because legitimate filter pages look the same.']:
    'Bundan çox sorğu parametri olan URL-lər Problemlər → URL → Tarama tələsi altında fasetli naviqasiya tələsi kimi işarələnir. Yalnız aşkarlama — URL-lər yenə taranır, çünki qanuni filtr səhifələri eyni görünür.',
  ['4 surfaces most faceted-nav explosions; 0 disables the check.']:
    '4 fasetli naviqasiya partlayışlarının əksəriyyətini üzə çıxarır; 0 yoxlamanı söndürür.',
  ["Honor Allow / Disallow rules declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "Konfiqurasiya edilmiş User-Agent üçün /robots.txt-də bəyan edilmiş Allow / Disallow qaydalarına əməl et. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt).",
  ["Honor a Crawl-delay directive as a global rate limit (one request every N seconds). Crawl-delay is not part of RFC 9309 — Google ignores it and Screaming Frog does not implement it — and published values are often stale: 'Crawl-delay: 30' turns a 500-URL crawl into hours. Ignored by default; the directive is still reported in the log when found."]:
    "Crawl-delay direktivinə qlobal sürət həddi kimi əməl et (hər N saniyədə bir sorğu). Crawl-delay RFC 9309-un hissəsi deyil — Google onu nəzərə almır və Screaming Frog tətbiq etmir — və dərc olunan dəyərlər çox vaxt köhnəlmişdir: 'Crawl-delay: 30' 500 URL-lik taramanı saatlara çevirir. Standart olaraq nəzərə alınmır; tapıldıqda direktiv yenə jurnalda bildirilir.",
  ['Off (default) for normal audits. On when an ops policy requires it — expect the crawl to take Crawl-delay seconds per URL.']:
    'Normal auditlər üçün söndürülü (standart). Əməliyyat siyasəti tələb etdikdə aktiv — taramanın hər URL üçün Crawl-delay saniyə çəkəcəyini gözləyin.',
  ['Crawl fetches internal <img> targets (incl. srcset / <picture> sources) so each appears in the Internal tab with status, content type, and size — every one counts toward Max URLs. Store keeps the <img> declarations in the Images tab, which works even with Crawl off: you get the full image inventory with alt text for the cost of zero extra requests.']:
    'Tara daxili <img> hədəflərini (srcset / <picture> mənbələri daxil) yükləyir ki, hər biri Daxili sekmesində status, məzmun tipi və ölçü ilə görünsün — hər biri Maks URL-ə sayılır. Saxla <img> bəyanlarını Şəkillər sekmesində saxlayır, bu Tara söndürülü olsa belə işləyir: sıfır əlavə sorğu qarşılığında alt mətni ilə tam şəkil inventarı alırsınız.',
  ['Store on, Crawl off is the cheap alt-text audit. Both on for a full image health check.']:
    'Saxla aktiv, Tara söndürülü ucuz alt mətn auditidir. Tam şəkil sağlamlığı yoxlaması üçün hər ikisi aktiv.',
  ['<video> / <audio> and the <source> children they own. Off by default — media files are large and rarely what an SEO crawl is looking for.']:
    '<video> / <audio> və onlara məxsus <source> uşaqları. Standart söndürülü — media faylları böyükdür və nadir hallarda SEO taramasının axtardığı şeydir.',
  ['On when auditing a video-heavy site for dead media URLs.']:
    'Video ağırlıqlı saytı ölü media URL-ləri üçün audit edərkən aktiv.',
  ["<link rel=stylesheet> targets. Crawling a stylesheet is also what discovers the web fonts and background images declared inside it via @font-face / url() — so Crawl on with Store off still populates the Internal tab's Font filter without listing every stylesheet."]:
    '<link rel=stylesheet> hədəfləri. Üslub cədvəlini taramaq həm də onun içində @font-face / url() ilə bəyan edilmiş veb şriftləri və fon şəkillərini kəşf edən şeydir — ona görə Tara aktiv, Saxla söndürülü olsa belə hər üslub cədvəlini siyahılamadan Daxili sekmesinin Şrift filtrini doldurur.',
  ['Crawl on, Store off when you want fonts discovered but not hundreds of CSS rows.']:
    'Şriftlərin kəşf edilməsini, amma yüzlərlə CSS sətri istəmirsinizsə Tara aktiv, Saxla söndürülü.',
  ['<script src> targets, fetched so each gets its own row with status code, content type, and size. Headers only — the body is discarded, never executed.']:
    '<script src> hədəfləri, hər birinin status kodu, məzmun tipi və ölçü ilə öz sətri olsun deyə yüklənir. Yalnız başlıqlar — gövdə atılır, heç vaxt icra olunmur.',
  ['Both on to catch 404ing bundles; both off for HTML-only crawls.']:
    '404 verən paketləri tutmaq üçün hər ikisi aktiv; yalnız HTML taramaları üçün hər ikisi söndürülü.',
  ['<a href> targets on the same site. Crawl off turns the run into an audit of a fixed set of pages — sitemaps, canonicals, and the other declared alternates below still feed discovery. Store off empties the link graph: inlinks, outlinks, anchor-text reports, and link score all go with it.']:
    'Eyni saytdakı <a href> hədəfləri. Tara söndürülü işi sabit səhifə dəstinin auditinə çevirir — sitemap-lər, kanoniklər və aşağıdakı digər bəyan edilmiş alternativlər kəşfi yenə qidalandırır. Saxla söndürülü keçid qrafını boşaldır: daxil olan keçidlər, çıxış keçidləri, lövbər mətni hesabatları və keçid balı onunla birlikdə gedir.',
  ['Leave both on. Crawl off only when a sitemap or URL list already defines the exact set you want.']:
    'Hər ikisini aktiv saxlayın. Tara-nı yalnız sitemap və ya URL siyahısı artıq istədiyiniz dəqiq dəsti müəyyən edirsə söndürün.',
  ['Outbound links to other hosts are always status-checked (one HEAD each) so Broken Links catches dead externals — that does not depend on this row. Crawl here means fully crawling those pages, following their links onward too. Store keeps outbound links in the link graph.']:
    'Başqa hostlara çıxış keçidləri həmişə status yoxlanır (hər biri bir HEAD) ki, Qırıq keçidlər ölü xariciləri tutsun — bu, bu sətirdən asılı deyil. Burada Tara həmin səhifələri tam taramaq, onların keçidlərini də irəli izləmək deməkdir. Saxla çıxış keçidlərini keçid qrafında saxlayır.',
  ['Crawl off (default) — status-check externals without spidering the whole web.']:
    'Tara söndürülü (standart) — bütün vebi taramadan xaricilərin statusunu yoxla.',
  ['<link rel=canonical> and its HTTP Link: header form. Crawl also enqueues the canonical target, treating it as a navigation hint. Store feeds the Canonicals tab and every canonical issue filter.']:
    '<link rel=canonical> və onun HTTP Link: başlıq forması. Tara həm də kanonik hədəfi naviqasiya göstərişi kimi növbəyə qoyur. Saxla Kanoniklər sekmesini və hər kanonik problem filtrini doldurur.',
  ['Crawl off (default) — canonicals are a signal, not a route. Store on.']:
    'Tara söndürülü (standart) — kanoniklər siqnaldır, marşrut deyil. Saxla aktiv.',
  ['<link rel=next> / <link rel=prev>. Part of the standard discovery graph; turn Crawl off to isolate a pagination loop without disabling link-following everywhere.']:
    '<link rel=next> / <link rel=prev>. Standart kəşf qrafının hissəsi; keçid izləməni hər yerdə söndürmədən səhifələmə dövrünü təcrid etmək üçün Tara-nı söndürün.',
  ['Both on unless you are debugging an infinite paginated series.']:
    'Sonsuz səhifələnmiş seriyanı sazlamırsınızsa hər ikisi aktiv.',
  ['<link rel=alternate hreflang>. Crawl enqueues every declared alternate, which is how you reach language versions nothing links to. Store feeds the Hreflang tab and the reciprocity / invalid-code audits.']:
    '<link rel=alternate hreflang>. Tara bəyan edilmiş hər alternativi növbəyə qoyur — heç nəyin keçid vermədiyi dil versiyalarına belə çatırsınız. Saxla Hreflang sekmesini və qarşılıqlılıq / yanlış kod auditlərini doldurur.',
  ['Crawl on for a multi-language audit — otherwise unlinked locales stay invisible.']:
    'Çoxdilli audit üçün Tara aktiv — əks halda keçid verilməyən lokallar görünməz qalır.',
  ['<link rel=amphtml>. Crawl fetches the AMP variant as its own URL; Store keeps the declaration plus the AMP smoke-validator findings.']:
    '<link rel=amphtml>. Tara AMP variantını öz URL-i kimi yükləyir; Saxla bəyanı və AMP əsas validatorunun tapıntılarını saxlayır.',
  ['Crawl on only if the site still ships AMP pages.']:
    'Yalnız sayt hələ AMP səhifələr verirsə Tara aktiv.',
  ['<meta http-equiv="refresh">. Crawl enqueues the parsed target like a redirect; Store keeps the raw directive and its URL for the Meta Refresh tab.']:
    '<meta http-equiv="refresh">. Tara təhlil edilmiş hədəfi yönləndirmə kimi növbəyə qoyur; Saxla xam direktivi və onun URL-ini Meta Refresh sekmesi üçün saxlayır.',
  ['Crawl on when auditing a legacy site that still redirects this way.']:
    'Hələ bu şəkildə yönləndirən köhnə saytı audit edərkən Tara aktiv.',
  ["<iframe src> documents. Crawl fetches each embedded page as its own URL, which can pull in a lot of third-party surface. Store records them in the link graph so a dead embed shows up in Outlinks and Broken Links — without counting toward the page's outlink total, since an embed is not a hyperlink."]:
    '<iframe src> sənədləri. Tara hər daxil edilmiş səhifəni öz URL-i kimi yükləyir, bu çoxlu üçüncü tərəf səthi çəkə bilər. Saxla onları keçid qrafında qeyd edir ki, ölü daxiletmə Çıxış keçidləri və Qırıq keçidlərdə görünsün — səhifənin çıxış keçidi cəminə sayılmadan, çünki daxiletmə hiperkeçid deyil.',
  ['Store on, Crawl off is usually the right pair.']:
    'Saxla aktiv, Tara söndürülü adətən düzgün cütdür.',
  ['The separate-URL (m-dot) mobile version: <link rel="alternate" media="only screen and (max-width: …)">. Null on responsive sites, which is most of them — a value here with no reciprocal canonical back is the classic broken m-dot setup.']:
    'Ayrı URL-li (m-dot) mobil versiya: <link rel="alternate" media="only screen and (max-width: …)">. Responsiv saytlarda null-dır, ki onlar əksəriyyətdir — burada dəyər olub geriyə qarşılıqlı kanonik yoxdursa, bu klassik qırıq m-dot qurulumudur.',
  ['Crawl on only when the site really does serve a separate mobile host.']:
    'Yalnız sayt həqiqətən ayrı mobil host verirsə Tara aktiv.',
  ['Links a search engine cannot follow: <a> with no href but an onclick, href="javascript:…", and href="#" placeholders wired to a handler. Store-only — an uncrawlable link is by definition never fetched. Drives the JS-Only Navigation issue filter.']:
    'Axtarış sisteminin izləyə bilmədiyi keçidlər: href-siz amma onclick-li <a>, href="javascript:…" və işləyiciyə bağlı href="#" yer tutucuları. Yalnız Saxla — taranmayan keçid tərifə görə heç vaxt yüklənmir. Yalnız JS naviqasiyası problem filtrini doldurur.',
  ['On — it is a count, so it costs nothing.']:
    'Aktiv — bu bir saydır, ona görə heç nəyə başa gəlmir.',
  ['With a Subfolder-scoped crawl, links pointing outside the start folder are fetched once so their status code is known, then stopped — they are checked, not crawled through. Off leaves them undiscovered entirely.']:
    'Alt-qovluq əhatəli taramada başlanğıc qovluğundan kənarı göstərən keçidlər status kodları məlum olsun deyə bir dəfə yüklənir, sonra dayandırılır — yoxlanılır, dərinə taranmır. Söndürülü onları tamamilə kəşf edilməmiş qoyur.',
  ['On — knowing a link out of /blog/ is a 404 costs one request.']:
    'Aktiv — /blog/-dan kənara gedən keçidin 404 olduğunu bilmək bir sorğuya başa gəlir.',
  ["Off restricts the crawl to URLs under the start URL's path (Crawl Scope = Subfolder). On lets it cover the whole host. This is a view of the Crawl Scope setting, not a separate switch, so the two can never disagree."]:
    'Söndürülü taramanı başlanğıc URL-in yolu altındakı URL-lərlə məhdudlaşdırır (Tarama əhatəsi = Alt-qovluq). Aktiv bütün hostu əhatə etməyə imkan verir. Bu, Tarama əhatəsi parametrinin bir görünüşüdür, ayrı açar deyil, ona görə ikisi heç vaxt ziddiyyət təşkil edə bilməz.',
  ['Off to audit just /blog/; on for the whole site.']:
    'Yalnız /blog/-u audit etmək üçün söndürülü; bütün sayt üçün aktiv.',
  ['Treats every host sharing the registrable domain as internal — shop.example.com and blog.example.com crawl alongside example.com instead of counting as external. Another view of the Crawl Scope setting.']:
    'Qeydiyyatlı domeni paylaşan hər hostu daxili sayır — shop.example.com və blog.example.com xarici sayılmaq əvəzinə example.com ilə birlikdə taranır. Tarama əhatəsi parametrinin başqa bir görünüşü.',
  ['On when subdomains are part of the same property.']:
    'Alt-domenlər eyni mülkiyyətin hissəsi olduqda aktiv.',
  ['Crawl through rel="nofollow" links pointing at the same site. Off (default) is Screaming Frog "Respect Nofollow" behaviour. Internal and external are separate switches because sites nofollow them for opposite reasons — crawl-budget shaping vs. not vouching for a third party.']:
    'Eyni sayta işarə edən rel="nofollow" keçidlərdən keçərək tara. Söndürülü (standart) Screaming Frog "Respect Nofollow" davranışıdır. Daxili və xarici ayrı açarlardır, çünki saytlar onları əks səbəblərlə nofollow edir — tarama büdcəsini formalaşdırmaq vs. üçüncü tərəfə zamin durmamaq.',
  ['On when a site nofollows its own faceted navigation and you need behind it.']:
    'Sayt öz fasetli naviqasiyasını nofollow edir və sizə onun arxasına keçmək lazımdırsa aktiv.',
  ['Crawl through rel="nofollow" links pointing at other hosts. Only has an effect while External Links → Crawl is on.']:
    'Başqa hostlara işarə edən rel="nofollow" keçidlərdən keçərək tara. Yalnız Xarici keçidlər → Tara aktiv olduqda təsir edir.',
  ['Off — nofollowed externals are exactly the ones you did not vouch for.']:
    'Söndürülü — nofollow edilmiş xaricilər məhz zamin durmadığınız keçidlərdir.',
  ['Record hrefs that cannot be parsed as a URL — unencoded whitespace inside the authority, doubled schemes, stray delimiters. They can never resolve to a crawled page, so every one is reported in Broken Links, which is the point. Deliberate non-navigable schemes (mailto:, tel:, #) are not malformed and never appear.']:
    'URL kimi təhlil edilə bilməyən href-ləri qeyd et — authority içində kodlanmamış boşluq, ikiqat sxemlər, artıq ayırıcılar. Onlar heç vaxt taranmış səhifəyə həll oluna bilməz, ona görə hər biri Qırıq keçidlərdə bildirilir, məqsəd də budur. Qəsdən naviqasiya olmayan sxemlər (mailto:, tel:, #) pozuq deyil və heç vaxt görünmür.',
  ['On when hunting hand-written markup errors; off keeps Broken Links focused on real 404s.']:
    'Əl ilə yazılmış işarələmə səhvlərini axtararkən aktiv; söndürülü Qırıq keçidləri real 404-lərə fokuslu saxlayır.',
  ['Off drops every discovered URL carrying a `?`, before robots and before a request goes out. That is the cheap way to stop a faceted navigation (?color=red&size=xl&sort=price) from spending the whole URL budget on one product listing wearing a thousand URLs. The start URL is always crawled, and subresources are exempt — style.css?v=7 is a cache-buster, not a facet. Skipped URLs are counted and reported in the log, never dropped silently.']:
    'Söndürülü `?` daşıyan hər kəşf edilmiş URL-i robots-dan əvvəl və sorğu göndərilməzdən əvvəl atır. Bu, fasetli naviqasiyanın (?color=red&size=xl&sort=price) min URL cildində bir məhsul siyahısına bütün URL büdcəsini xərcləməsinin qarşısını almağın ucuz yoludur. Başlanğıc URL həmişə taranır və alt-resurslar istisnadır — style.css?v=7 cache-buster-dir, faset deyil. Atlanan URL-lər sayılır və jurnalda bildirilir, heç vaxt səssizcə atılmır.',
  ['On (default). Off for a first pass over a shop with faceted filters.']:
    'Aktiv (standart). Fasetli filtrləri olan mağaza üzərində ilk keçid üçün söndürülü.',
  ['Parameter names that keep a URL in the crawl anyway — pagination, a language switch, a product id. Names only; values are not looked at, and matching ignores case. A URL is admitted only when every parameter it carries is on this list: ?page=2 passes, ?page=2&color=red does not. Any-match would defeat the point, since a facet URL nearly always carries the pagination parameter too.']:
    'URL-i yenə taramada saxlayan parametr adları — səhifələmə, dil dəyişdirici, məhsul id-si. Yalnız adlar; dəyərlərə baxılmır və uyğunluq hərf registrini nəzərə almır. URL yalnız daşıdığı hər parametr bu siyahıda olduqda qəbul edilir: ?page=2 keçir, ?page=2&color=red keçmir. Hər-hansı-uyğunluq məqsədi puç edərdi, çünki faset URL-i demək olar həmişə səhifələmə parametrini də daşıyır.',
  ['page, lang — keeps paginated archives reachable while the facets stay out.']:
    'page, lang — səhifələnmiş arxivləri əlçatan saxlayır, fasetlər kənarda qalır.',
  ['Auto-discovery on its own only records sitemap entries, which is what the sitemap issue filters compare the crawl against. Turning this on crawls them too — and that is what surfaces orphans: pages the sitemap declares but nothing on the site links to.']:
    'Avtomatik kəşf tək başına yalnız sitemap qeydlərini yazır, sitemap problem filtrləri taramanı bununla müqayisə edir. Bunu aktivləşdirmək onları da tarayır — və yetimləri üzə çıxaran budur: sitemap-in bəyan etdiyi, amma saytda heç nəyin keçid vermədiyi səhifələr.',
  ['On for an orphan-page audit.']: 'Yetim səhifə auditi üçün aktiv.',
  ['Reads Sitemap: directives from /robots.txt plus the conventional /sitemap.xml fallbacks at crawl start. Cheap I/O, and it powers every sitemap issue filter.']:
    'Tarama başlananda /robots.txt-dən Sitemap: direktivlərini və adi /sitemap.xml ehtiyatlarını oxuyur. Ucuz I/O və hər sitemap problem filtrini qidalandırır.',
  ['On (default).']: 'Aktiv (standart).',
  ['Explicit sitemap URLs, one per line. Their entries are always both recorded and queued as crawl seeds — use this when the sitemap lives somewhere robots.txt never mentions.']:
    'Açıq sitemap URL-ləri, hər sətirdə bir. Onların qeydləri həmişə həm yazılır, həm də tarama toxumu kimi növbəyə qoyulur — sitemap robots.txt-nin heç vaxt qeyd etmədiyi yerdə olduqda bundan istifadə edin.',
  ['Treat the concurrency and RPS above as a ceiling and let the target server set the real pace. On a 429/503 (or a Retry-After header) the crawler pauses for the penalty window and steps the rate + concurrency down; after a sustained run of clean responses it grows them back toward the ceiling. Off = hold the configured rate no matter how the server responds.']:
    'Yuxarıdakı paralelliyi və RPS-i tavan kimi qəbul et və real tempi hədəf server təyin etsin. 429/503 (və ya Retry-After başlığı) zamanı tarayıcı cəza pəncərəsi boyu dayanır və sürəti + paralelliyi aşağı salır; davamlı təmiz cavablardan sonra onları yenidən tavana doğru artırır. Söndürülü = server necə cavab verirsə versin, konfiqurasiya edilmiş sürəti saxla.',
  ['Turn on for sites behind Cloudflare / a WAF that returns 429s; leave off for your own infrastructure where the fixed rate is safe.']:
    '429 qaytaran Cloudflare / WAF arxasındakı saytlar üçün aktivləşdirin; sabit sürətin təhlükəsiz olduğu öz infrastrukturunuz üçün söndürülü saxlayın.',
  ['Sorts query parameters alphabetically at normalisation time. Repeated keys keep their relative order, so ?tag=a&tag=b is preserved. Without this the two orderings occupy separate rows and read as duplicates.']:
    'Normallaşdırma zamanı sorğu parametrlərini əlifba sırası ilə sıralayır. Təkrarlanan açarlar nisbi sırasını saxlayır, ona görə ?tag=a&tag=b qorunur. Bu olmadan iki sıralama ayrı sətirlər tutur və təkrar kimi oxunur.',
  ['On for most sites; off if your server routes on positional parameter order.']:
    'Saytların əksəriyyəti üçün aktiv; serveriniz parametrlərin mövqe sırasına görə yönləndirirsə söndürülü.',
  ['Collapses runs of slashes in the path to a single slash. Applied before the trailing-slash policy. Web servers serve these identically, so the duplicate-slash variant is normally a false duplicate.']:
    'Yoldakı ardıcıl slaşları tək slaşa yığır. Sonluq slaşı siyasətindən əvvəl tətbiq olunur. Veb serverlər bunları eyni cür verir, ona görə ikiqat slaş variantı adətən yalançı təkrardır.',
  ['On if a template bug emits //  in links; off if your framework uses empty path segments as data.']:
    'Şablon səhvi keçidlərdə //  çıxarırsa aktiv; freymvorkunuz boş yol seqmentlərini məlumat kimi istifadə edirsə söndürülü.',
  ["Off by default: verify the login page's TLS certificate before typing credentials into it. Enable only for a trusted internal host with a self-signed certificate — an unverifiable certificate on a login page is a man-in-the-middle risk."]:
    'Standart söndürülü: giriş səhifəsinə etimadnamələri yazmazdan əvvəl onun TLS sertifikatını yoxla. Yalnız öz-imzalı sertifikatlı etibarlı daxili host üçün aktivləşdirin — giriş səhifəsində yoxlanıla bilməyən sertifikat ortadakı adam riskidir.',
  ["Hooks the History API before the page's own scripts run, so routes an SPA reaches via pushState / replaceState / popstate are discovered and crawled. Also keeps hash routes (#/about) as distinct URLs instead of collapsing them onto the shell document."]:
    'Səhifənin öz skriptləri işləməzdən əvvəl History API-ni tutur ki, SPA-nın pushState / replaceState / popstate ilə çatdığı marşrutlar kəşf edilsin və taransın. Həmçinin hash marşrutlarını (#/about) shell sənədinə yığmaq əvəzinə ayrı URL-lər kimi saxlayır.',
  ['On for React Router / Vue Router / Angular sites whose pages never produce a document request.']:
    'Səhifələri heç vaxt sənəd sorğusu yaratmayan React Router / Vue Router / Angular saytları üçün aktiv.',
  ['`<link rel="alternate" media="only screen and (max-width: …)" href="…">` value — the separate-URL (m-dot) mobile version of this page. Empty on responsive sites, which is most of them. A value here with no reciprocal canonical pointing back is the classic broken m-dot setup.']:
    '`<link rel="alternate" media="only screen and (max-width: …)" href="…">` dəyəri — bu səhifənin ayrı URL-li (m-dot) mobil versiyası. Responsiv saytlarda boşdur, ki onlar əksəriyyətdir. Burada dəyər olub geriyə işarə edən qarşılıqlı kanonik yoxdursa, bu klassik qırıq m-dot qurulumudur.',
};
