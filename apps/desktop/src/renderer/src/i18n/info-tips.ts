/**
 * Turkish translations for InfoTip ([i] icon) tooltip bodies.
 *
 * Keyed by the verbatim English source string, exactly like
 * {@link ./labels.ts} — the ~170 `info` / `example` props scattered
 * across columns.ts and SettingsDialog.tsx stay as plain English
 * literals, and `InfoTip` looks the text up at render time. That keeps
 * one lookup in one component instead of threading `t()` calls through
 * every column spec and settings field.
 *
 * Anything absent from this table renders in English (graceful
 * degradation), which is also what happens to technical example values
 * — regexes, header values, URLs — that are deliberately left untranslated.
 *
 * GENERATED FILE — do not hand-edit. Regenerate when tooltip copy changes.
 */

const TR_INFO_TIPS: Record<string, string> = {
  ["?page=1 / ?page=2 / ?page=4 → flags 'Sequence Break' on every member of the broken cluster."]:
    "?page=1 / ?page=2 / ?page=4 → bozuk kümenin her üyesine 'Sıra Kopukluğu' işareti koyar.",
  ["`<a>` elements that look clickable but aren't crawlable (no href + onclick, `href=\"javascript:…\"`, or `href=\"#\"` with onclick)."]:
    "Tıklanabilir görünen ama taranamayan `<a>` öğeleri (href yok + onclick var, `href=\"javascript:…\"` ya da onclick ile birlikte `href=\"#\"`).",
  ["`<link rel=\"amphtml\" href=\"…\">` value — the AMP version of this page. Empty when the page does not declare an AMP alternate."]:
    "`<link rel=\"amphtml\" href=\"…\">` değeri — bu sayfanın AMP sürümü. Sayfa AMP alternatifi tanımlamıyorsa boştur.",
  ["`<link rel=\"next\" href=\"…\">` value resolved to absolute. Empty when the page is not paginated forward."]:
    "`<link rel=\"next\" href=\"…\">` değerinin mutlak URL'e çözümlenmiş hali. Sayfanın ileri yönde sayfalaması yoksa boştur.",
  ["`<link rel=\"prev\" href=\"…\">` value resolved to absolute. Empty when the page is the first in its pagination cluster."]:
    "`<link rel=\"prev\" href=\"…\">` değerinin mutlak URL'e çözümlenmiş hali. Sayfa, sayfalama kümesindeki ilk sayfaysa boştur.",
  ["`css` runs against the parsed DOM; `regex` runs against raw HTML."]:
    "`css` ayrıştırılmış DOM üzerinde çalışır; `regex` ham HTML üzerinde çalışır.",
  ["`none` disables auth; `basic` adds `Authorization: Basic <base64>`; `bearer` adds `Authorization: Bearer <token>`; `digest` performs the RFC 2617 challenge-response on the first 401."]:
    "`none` kimlik doğrulamayı kapatır; `basic` `Authorization: Basic <base64>` ekler; `bearer` `Authorization: Bearer <token>` ekler; `digest` ilk 401 yanıtında RFC 2617 challenge-response akışını uygular.",
  ["`POST <url>` is fired when the `done` event emits. 10 s timeout. Failures are logged as info events but never break the crawl."]:
    "`done` olayı tetiklendiğinde `POST <url>` isteği gönderilir. 10 sn zaman aşımı vardır. Hatalar bilgi olayı olarak loglanır ama crawl'ı asla bozmaz.",
  ["0 (no duplicates), 7 (member of cluster #7)"]:
    "0 (yinelenen yok), 7 (#7 numaralı kümenin üyesi)",
  ["0 = auto. 4 for 8GB RAM machines, 8+ for 16GB+."]:
    "0 = otomatik. 8 GB RAM'li makinelerde 4, 16 GB ve üzeri için 8+.",
  ["0 default; 250 ms when a host returns 429 with a 'too fast' message."]:
    "Varsayılan 0; bir sunucu 'çok hızlı' mesajıyla 429 dönüyorsa 250 ms.",
  ["0 for SSR sites, 2000 for typical SPAs, 5000+ for heavy client-rendered apps."]:
    "SSR siteler için 0, tipik SPA'lar için 2000, ağır istemci taraflı uygulamalar için 5000+.",
  ["0.1 default (Google 'good'); 0 to disable."]:
    "Varsayılan 0,1 (Google 'iyi' eşiği); kapatmak için 0.",
  ["1 = unique, 5 = part of a 5-page near-duplicate group"]:
    "1 = benzersiz, 5 = 5 sayfalık yakın-yinelenen grubun parçası",
  ["10 (default), 3 for very tight chains, 0 to remove the cap"]:
    "10 (varsayılan), çok kısa zincirler için 3, sınırı kaldırmak için 0",
  ["10 covers most sites; 3 limits crawls to top-of-funnel pages only."]:
    "10 çoğu siteyi kapsar; 3 crawl'ı yalnızca üst seviye sayfalarla sınırlar.",
  ["100 default for most audits; 0 to disable the check."]:
    "Çoğu denetim için varsayılan 100; kontrolü kapatmak için 0.",
  ["100 default; 50 for tight on-page link discipline; 0 to disable the issue."]:
    "Varsayılan 100; sıkı sayfa içi bağlantı disiplini için 50; sorunu kapatmak için 0.",
  ["1000000 (1M) for a full site audit; 5000 for spot checks."]:
    "Tam site denetimi için 1000000 (1M); nokta kontroller için 5000.",
  ["1024 (1 MB) default; 150 for a lean HTML budget; 0 to disable."]:
    "Varsayılan 1024 (1 MB); yalın HTML bütçesi için 150; kapatmak için 0.",
  ["1048576 (1 MB) default; 524288 (512 KB) on tight disks; 0 to disable truncation entirely."]:
    "Varsayılan 1048576 (1 MB); disk darsa 524288 (512 KB); kırpmayı tamamen kapatmak için 0.",
  ["10485760 (10 MB) on bandwidth-tight crawls; 0 to download anything."]:
    "Bant genişliği kısıtlı crawl'larda 10485760 (10 MB); her şeyi indirmek için 0.",
  ["1366 = standard laptop, 1920 = full HD desktop, 375 = iPhone width."]:
    "1366 = standart dizüstü, 1920 = full HD masaüstü, 375 = iPhone genişliği.",
  ["2 default; 0 to record errors immediately without retrying; 5 for unreliable upstreams."]:
    "Varsayılan 2; hataları yeniden denemeden hemen kaydetmek için 0; güvenilmez sunucular için 5.",
  ["20 default; 50 on fast first-party servers; 5 if the site rate-limits or returns 429s."]:
    "Varsayılan 20; hızlı kendi sunucularınızda 50; site hız sınırlaması yapıyor veya 429 dönüyorsa 5.",
  ["20 for typical sites; 5 to be polite on shared hosting; 60+ when crawling your own infra."]:
    "Tipik siteler için 20; paylaşımlı hostingde nazik olmak için 5; kendi altyapınızı tararken 60+.",
  ["20000 (20 s) for typical use; 5000 for fast spot checks; 60000 for slow APIs."]:
    "Tipik kullanım için 20000 (20 sn); hızlı nokta kontroller için 5000; yavaş API'ler için 60000.",
  ["2048 (≈2 GB) on a 4 GB laptop; 8192 on a 16 GB workstation; 0 to disable."]:
    "4 GB dizüstüde 2048 (≈2 GB); 16 GB iş istasyonunda 8192; kapatmak için 0.",
  ["2048 default (RFC-suggested practical ceiling)."]:
    "Varsayılan 2048 (RFC'nin önerdiği pratik tavan).",
  ["2500 default (Google 'good'); 0 to disable."]:
    "Varsayılan 2500 (Google 'iyi' eşiği); kapatmak için 0.",
  ["3 = recommended; 5 catches looser duplicates (templated content with light variation); 0 turns the post-crawl pass off."]:
    "3 = önerilen; 5 daha gevşek yinelenenleri yakalar (hafif farklarla şablonlanmış içerik); 0 crawl sonrası geçişi kapatır.",
  ["4 default; 6 on documentation sites with deep TOC trees; 0 to disable."]:
    "Varsayılan 4; derin içindekiler ağacı olan dokümantasyon sitelerinde 6; kapatmak için 0.",
  ["500 default. Bump to 2000 when retrying against a flaky API."]:
    "Varsayılan 500. Kararsız bir API'ye karşı yeniden denerken 2000'e çıkarın.",
  ["50000 keeps RAM bounded during big sitemap fan-outs; 0 for typical crawls."]:
    "50000, büyük sitemap açılımlarında RAM'i sınırlı tutar; tipik crawl'lar için 0.",
  ["60000 (1 minute) for huge resources; 0 to rely solely on the fetch timeout."]:
    "Çok büyük kaynaklar için 60000 (1 dakika); yalnızca fetch zaman aşımına güvenmek için 0.",
  ["64-bit SimHash + LSH bucketing + Union-Find clustering on body shingles. Most expensive pass — typical 5–10 s on a 100k crawl."]:
    "Gövde metni parçaları üzerinde 64-bit SimHash + LSH gruplama + Union-Find kümeleme. En pahalı geçiştir — 100 bin URL'lik bir crawl'da tipik olarak 5–10 sn.",
  ["768 = standard laptop, 1080 = full HD desktop, 667 = iPhone 8 height."]:
    "768 = standart dizüstü, 1080 = full HD masaüstü, 667 = iPhone 8 yüksekliği.",
  ["800 default; 200 for CDN-backed static; 0 to disable."]:
    "Varsayılan 800; CDN destekli statik siteler için 200; kapatmak için 0.",
  ["Aborts @font-face / Google Fonts / WOFF2 requests. FOUT visible but text still renders."]:
    "@font-face / Google Fonts / WOFF2 isteklerini iptal eder. Yazı tipi geç yüklenir (FOUT) ama metin yine de görüntülenir.",
  ["Aborts <img>, <picture>, background-image requests. Recommended for SEO crawls — image metadata still comes from <img> tag attributes."]:
    "<img>, <picture> ve background-image isteklerini iptal eder. SEO crawl'ları için önerilir — görsel meta verisi yine <img> etiketi özniteliklerinden gelir.",
  ["Aborts <video> / <audio> sources. Page DOM still includes the <video> tag."]:
    "<video> / <audio> kaynaklarını iptal eder. Sayfa DOM'unda <video> etiketi yine yer alır.",
  ["Aborts all <script> requests. This defeats the purpose of JS rendering — use Text Only mode instead."]:
    "Tüm <script> isteklerini iptal eder. Bu, JS render'ın amacını ortadan kaldırır — bunun yerine Yalnızca Metin modunu kullanın.",
  ["Aborts external CSS. Inline styles still load. WARNING: many SPAs use CSS-driven visibility / lazy classes — blocking CSS may hide content that JS depends on."]:
    "Harici CSS'i iptal eder. Satır içi stiller yüklenmeye devam eder. UYARI: birçok SPA, CSS tabanlı görünürlük / lazy sınıfları kullanır — CSS'i engellemek JS'in bağımlı olduğu içeriği gizleyebilir.",
  ["Aborts requests whose total lifetime (connect + headers + body) exceeds this. Distinct from `requestTimeoutMs` which is the headers timeout. Useful for capping individual slow pages without lowering the overall fetch timeout."]:
    "Toplam ömrü (bağlantı + başlıklar + gövde) bu değeri aşan istekleri iptal eder. Başlık zaman aşımı olan `requestTimeoutMs`'ten farklıdır. Genel fetch zaman aşımını düşürmeden tek tek yavaş sayfaları sınırlamak için kullanışlıdır.",
  ["Absolute redirect target parsed from the meta-refresh content. Empty when meta-refresh sets only a delay."]:
    "meta-refresh içeriğinden ayrıştırılan mutlak yönlendirme hedefi. meta-refresh yalnızca bir gecikme tanımlıyorsa boştur.",
  ["Additional time to wait after the chosen wait condition fires, for SPA hydration / late XHRs. 0 = no extra wait. Bounded by the request timeout."]:
    "Seçilen bekleme koşulu gerçekleştikten sonra SPA hydration / geç XHR istekleri için ek bekleme süresi. 0 = ek bekleme yok. İstek zaman aşımıyla sınırlıdır.",
  ["Anchor text of the broken link as rendered in the source page."]:
    "Kaynak sayfada göründüğü haliyle kırık bağlantının bağlantı metni.",
  ["Audits the rendered DOM for WCAG AA colour-contrast failures (4.5:1 normal text, 3:1 large text) and stylesheet rules that suppress the keyboard focus outline without a :focus-visible fallback. Surfaces the Low-Contrast Text and Focus Outline Suppressed issue filters."]:
    "Render edilmiş DOM'u WCAG AA renk kontrastı hataları (normal metin 4.5:1, büyük metin 3:1) ve :focus-visible yedeği olmadan klavye odak çerçevesini bastıran stil kuralları açısından denetler. Düşük Kontrastlı Metin ve Odak Çerçevesi Bastırılmış sorun filtrelerini besler.",
  ["basic/digest for /staging behind nginx; bearer for protected APIs"]:
    "nginx arkasındaki /staging için basic/digest; korumalı API'ler için bearer",
  ["Below Normal while you keep working in other apps; Idle for overnight unattended runs."]:
    "Diğer uygulamalarda çalışmaya devam ederken Normalin Altı; gece boyu gözetimsiz çalıştırmalar için Boşta.",
  ["BFS click depth from the start URL. Start URL = 0; its outlinks = 1; etc. High depth often correlates with low importance."]:
    "Başlangıç URL'inden itibaren BFS tıklama derinliği. Başlangıç URL = 0; onun giden bağlantıları = 1; vb. Yüksek derinlik çoğu zaman düşük önemle ilişkilidir.",
  ["Bodies over this are truncated and flagged. 1 MB covers the 99.9th percentile of HTML pages without letting one adversarial 50 MB page bloat the project file."]:
    "Bu değeri aşan gövdeler kırpılır ve işaretlenir. 1 MB, HTML sayfalarının %99,9'unu kapsar ve 50 MB'lık uç bir sayfanın proje dosyasını şişirmesini engeller.",
  ["Buy Affordable Game Keys | Example Store"]:
    "Uygun Fiyatlı Oyun Anahtarları | Örnek Mağaza",
  ["Character count of the first H1."]:
    "İlk H1'in karakter sayısı.",
  ["Character count of the meta description. Recommended: 70–155 characters; over 155 risks truncation."]:
    "Meta açıklamanın karakter sayısı. Önerilen: 70–155 karakter; 155 üzeri kırpılma riski taşır.",
  ["Character count of the title. Recommended: 30–60 characters; over 60 risks truncation in SERPs."]:
    "Başlığın karakter sayısı. Önerilen: 30–60 karakter; 60 üzeri SERP'lerde kırpılma riski taşır.",
  ["Charikar 64-bit SimHash of body shingles. Used by the post-crawl near-duplicate clustering pass. Two SimHashes within the configured Hamming threshold are considered similar."]:
    "Gövde metni parçalarının Charikar 64-bit SimHash değeri. Crawl sonrası yakın-yinelenen kümeleme geçişi tarafından kullanılır. Yapılandırılan Hamming eşiği içindeki iki SimHash benzer kabul edilir.",
  ["Coarse content classification derived from URL extension and Content-Type header."]:
    "URL uzantısı ve Content-Type başlığından türetilen kaba içerik sınıflandırması.",
  ["Comma-joined sorted unique JSON-LD `@type` values declared on the page (Article, BreadcrumbList, Product, …)."]:
    "Sayfada tanımlanan benzersiz JSON-LD `@type` değerlerinin sıralı, virgülle birleştirilmiş listesi (Article, BreadcrumbList, Product, …).",
  ["Contents of the first <meta name=\"description\"> tag. May be used as the SERP snippet."]:
    "İlk <meta name=\"description\"> etiketinin içeriği. SERP snippet'i olarak kullanılabilir.",
  ["Contents of the first <meta name=\"robots\"> tag. Controls per-page indexing/following behaviour."]:
    "İlk <meta name=\"robots\"> etiketinin içeriği. Sayfa bazında indeksleme/takip davranışını denetler.",
  ["Contents of the first <title> element. Google primarily uses this in SERP titles."]:
    "İlk <title> öğesinin içeriği. Google, SERP başlıklarında öncelikle bunu kullanır.",
  ["Counts how many internal pages link to each URL. Drives the Most-Linked URLs report and the per-row Inlinks column."]:
    "Her URL'e kaç iç sayfanın bağlantı verdiğini sayar. En Çok Bağlantı Alan URL'ler raporunu ve satır bazındaki Gelen Bağlantı kolonunu besler.",
  ["Crawl 3xx redirect targets. Each hop is its own row; the chain is reconstructed in the Response Codes view. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced)."]:
    "3xx yönlendirme hedeflerini de tarar. Her adım kendi satırıdır; zincir Yanıt Kodları görünümünde yeniden kurulur. Screaming Frog karşılığı: 'Always Follow Redirects' (Configuration → Spider → Advanced).",
  ["Crawler RSS auto-pauses the queue when this is exceeded; resumes once memory drops to 80% of the cap. Soft cap — does not enforce a hard heap limit."]:
    "Crawler'ın bellek kullanımı bu değeri aştığında kuyruk otomatik duraklatılır; bellek sınırın %80'ine indiğinde devam eder. Esnek sınırdır — katı bir heap limiti uygulamaz.",
  ["css for selectors, regex for free-form patterns"]:
    "seçiciler için css, serbest biçimli desenler için regex",
  ["CSS selector that pins the duplicate-fingerprint text extraction to a specific page region. When set, the heuristic (main / role=main / article / body-minus-chrome) is bypassed and the selector wins. Useful on sites where the heuristic misclassifies — e.g. CMSes that wrap navigation inside `<main>` or sites with no semantic landmarks at all. Empty = use the heuristic. Invalid selectors silently fall back to the heuristic so a typo doesn't break the crawl."]:
    "Yinelenen içerik parmak izi için metin çıkarımını belirli bir sayfa bölgesine sabitleyen CSS seçicisi. Ayarlandığında sezgisel yöntem (main / role=main / article / gövde eksi çerçeve) devre dışı kalır ve seçici kazanır. Sezgiselin yanlış sınıflandırdığı sitelerde kullanışlıdır — ör. navigasyonu `<main>` içine saran CMS'ler ya da hiç semantik landmark'ı olmayan siteler. Boş = sezgiseli kullan. Geçersiz seçiciler sessizce sezgisele döner, böylece bir yazım hatası crawl'ı bozmaz.",
  ["Cumulative Layout Shift from PageSpeed Insights, when present. Google's 'good' CLS threshold is 0.1. Unitless; accepts decimals. Pages without PSI data are never flagged."]:
    "Varsa PageSpeed Insights'tan gelen Cumulative Layout Shift değeri. Google'ın 'iyi' CLS eşiği 0,1'dir. Birimsizdir; ondalık kabul eder. PSI verisi olmayan sayfalar asla işaretlenmez.",
  ["Drives the View Source detail tab. ~30–200 KB on disk per HTML page; turn off if you only need metadata and not full source viewing."]:
    "Kaynağı Görüntüle detay sekmesini besler. HTML sayfa başına diskte ~30–200 KB; yalnızca meta veriye ihtiyacınız varsa ve kaynak görüntülemeyecekseniz kapatın.",
  ["Each rule runs JavaScript RegExp.replace on the fully-normalised URL. Flags default to 'g'. After all rules run, the result is re-parsed as a URL — if the rewrite produces an invalid URL, the link is dropped at normalisation time."]:
    "Her kural, tam normalize edilmiş URL üzerinde JavaScript RegExp.replace çalıştırır. Bayraklar varsayılan olarak 'g'dir. Tüm kurallar çalıştıktan sonra sonuç yeniden URL olarak ayrıştırılır — yeniden yazım geçersiz bir URL üretirse bağlantı normalizasyon aşamasında düşürülür.",
  ["Empty = safest. 'chrome' if you want the same Chrome version your users see."]:
    "Boş = en güvenlisi. Kullanıcılarınızın gördüğü Chrome sürümünü istiyorsanız 'chrome'.",
  ["Empty = use the bundled Playwright Chromium build (recommended — pinned version, works everywhere). 'chrome' / 'msedge' uses the system-installed browser. Beta channels for testing newer features."]:
    "Boş = uygulamayla gelen Playwright Chromium sürümünü kullan (önerilir — sabit sürüm, her yerde çalışır). 'chrome' / 'msedge' sistemde kurulu tarayıcıyı kullanır. Beta kanalları yeni özellikleri test etmek içindir.",
  ["Fetch internal <img> resources (incl. srcset / <picture> sources) so they appear in the Internal tab with their own status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl)."]:
    "İç <img> kaynaklarını (srcset / <picture> kaynakları dahil) çeker; böylece kendi durum kodu, içerik tipi ve boyutuyla İç Kaynaklar sekmesinde görünürler. Her biri Maksimum URL sayısına dahil olur. Screaming Frog karşılığı: 'Check Images' (Configuration → Spider → Crawl).",
  ["Fetch internal <link rel=stylesheet> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl)."]:
    "İç <link rel=stylesheet> kaynaklarını çeker; böylece durum kodu, içerik tipi ve boyutuyla İç Kaynaklar sekmesinde görünürler. Her biri Maksimum URL sayısına dahil olur. Screaming Frog karşılığı: 'Check CSS' (Configuration → Spider → Crawl).",
  ["Fetch internal <script src> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl)."]:
    "İç <script src> kaynaklarını çeker; böylece durum kodu, içerik tipi ve boyutuyla İç Kaynaklar sekmesinde görünürler. Her biri Maksimum URL sayısına dahil olur. Screaming Frog karşılığı: 'Check JavaScript' (Configuration → Spider → Crawl).",
  ["Fetches /robots.txt sitemap directives + /sitemap.xml fallbacks. Powers the 'Non-Indexable in Sitemap' issue filter. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl)."]:
    "/robots.txt içindeki sitemap direktiflerini ve /sitemap.xml yedeklerini getirir. 'Sitemap'te İndekslenemez' sorun filtresini besler. Screaming Frog karşılığı: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl).",
  ["first/last for single value, all for JSON array, concat for ' | ' joined string"]:
    "tek değer için first/last, JSON dizisi için all, ' | ' ile birleştirilmiş dize için concat",
  ["FNV-1a 64-bit hash of the normalised body token stream. Two pages sharing this hash are byte-identical post-tokenisation — the basis of the Exact Duplicate filter."]:
    "Normalize edilmiş gövde token akışının FNV-1a 64-bit hash değeri. Bu hash'i paylaşan iki sayfa, tokenizasyon sonrası bayt bazında aynıdır — Tam Yinelenen filtresinin temeli budur.",
  ["For Basic, sent base64-encoded; for Digest, hashed into the challenge response."]:
    "Basic için base64 kodlanmış olarak gönderilir; Digest için challenge yanıtına hash'lenir.",
  ["For regex: `regex_group` extracts capture group 1; otherwise the whole match is used."]:
    "Regex için: `regex_group` 1 numaralı yakalama grubunu çıkarır; aksi halde eşleşmenin tamamı kullanılır.",
  ["Full-page renders the entire scrollable canvas; Above-the-fold captures just the initial viewport (cheaper). Both writes two PNGs per URL."]:
    "Tam Sayfa, kaydırılabilir alanın tamamını render eder; Ekranın Üstü yalnızca ilk görünümü yakalar (daha ucuz). Her İkisi seçeneği URL başına iki PNG yazar.",
  ["Google's index status, pulled from the URL Inspection API — not the Fetch button. Click \"Inspect (top 100)\" to fill this column; Fetch only pulls clicks / impressions / position."]:
    "Google'ın indeksleme durumu; URL İnceleme API'sinden alınır — Getir düğmesinden değil. Bu kolonu doldurmak için \"İncele (ilk 100)\" seçeneğine tıklayın; Getir yalnızca tıklama / gösterim / pozisyon verisi çeker.",
  ["Googlebot — Smartphone matches Google's mobile-first indexing crawler."]:
    "Googlebot — Akıllı Telefon, Google'ın mobil öncelikli indeksleme crawler'ıyla eşleşir.",
  ["Hard cap on pending URLs held in memory. Excess discoveries are dropped silently — bounds peak heap during fan-out bursts (big sitemaps, dense link graphs)."]:
    "Bellekte tutulan bekleyen URL sayısı için katı üst sınır. Fazlası sessizce düşürülür — yoğun keşif patlamalarında (büyük sitemap'ler, sık bağlantılı grafikler) tepe bellek kullanımını sınırlar.",
  ["Hard cap on the number of 3xx hops we follow for a single chain. Each hop is recorded as its own URL row regardless. 0 disables the cap (chain still ends at `redirect_loop`)."]:
    "Tek bir zincir için takip edilen 3xx adım sayısına katı üst sınır. Her adım yine de kendi URL satırı olarak kaydedilir. 0 sınırı kaldırır (zincir yine `redirect_loop` ile biter).",
  ["Hard cap on total URLs crawled. The crawl stops as soon as this is reached. Screaming Frog: 'Limit Crawl Total'."]:
    "Taranan toplam URL sayısına katı üst sınır. Bu değere ulaşıldığı anda crawl durur. Screaming Frog karşılığı: 'Limit Crawl Total'.",
  ["Hard ceiling on requests per second across all workers combined. Equivalent to Screaming Frog's 'Max URL/s'. Acts as a token bucket — even with high concurrency the crawler waits between bursts to stay below this rate."]:
    "Tüm işçiler toplamında saniyedeki istek sayısına katı tavan. Screaming Frog'daki 'Max URL/s' karşılığıdır. Token bucket gibi çalışır — eşzamanlılık yüksek olsa bile crawler bu hızın altında kalmak için istek grupları arasında bekler.",
  ["Height attribute value (in pixels) declared on the <img> tag, when present."]:
    "Varsa <img> etiketinde tanımlanan height özniteliğinin değeri (piksel).",
  ["Honor Disallow rules + crawl-delay declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "Yapılandırılan User-Agent için /robots.txt'te tanımlı Disallow kurallarına ve crawl-delay değerine uyar. Screaming Frog karşılığı: 'Respect robots.txt' (Configuration → robots.txt).",
  ["Hop count from the start URL. Start URL is depth 0; its outlinks are depth 1, theirs depth 2, and so on. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits)."]:
    "Başlangıç URL'inden itibaren adım sayısı. Başlangıç URL derinlik 0'dır; onun giden bağlantıları derinlik 1, onlarınki 2 ve böyle devam eder. Screaming Frog karşılığı: 'Limit Crawl Depth' (Configuration → Spider → Limits).",
  ["How many distinct pages reference this image. High values typically indicate site-wide assets (logos, icons)."]:
    "Bu görsele kaç farklı sayfanın referans verdiği. Yüksek değerler genellikle site geneli varlıkları (logolar, ikonlar) gösterir.",
  ["How to canonicalise paths with/without a trailing slash. 'Add' is file-extension aware — won't add a slash to /file.pdf or /image.png."]:
    "Sonunda eğik çizgi olan/olmayan yolların nasıl kanonikleştirileceği. 'Ekle' seçeneği dosya uzantısına duyarlıdır — /file.pdf veya /image.png sonuna eğik çizgi eklemez.",
  ["HTML attribute name to read."]:
    "Okunacak HTML özniteliğinin adı.",
  ["HTML transfer size of the page document. Heavy HTML payloads delay first paint. Stored as bytes internally; entered here in kilobytes."]:
    "Sayfa belgesinin HTML transfer boyutu. Ağır HTML yükleri ilk boyamayı geciktirir. Dahili olarak bayt saklanır; burada kilobayt olarak girilir.",
  ["HTTP `<img>` / `<video>` / `<audio>` / `<source>` references on an HTTPS page — rendered but the URL bar reads \"Not Secure\"."]:
    "HTTPS bir sayfadaki HTTP `<img>` / `<video>` / `<audio>` / `<source>` referansları — render edilir ama adres çubuğunda \"Güvenli değil\" yazar.",
  ["HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` references on an HTTPS page — browsers BLOCK these silently."]:
    "HTTPS bir sayfadaki HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` referansları — tarayıcılar bunları sessizce ENGELLER.",
  ["HTTP response status code. Empty/Failed indicates a network error before any response was received."]:
    "HTTP yanıt durum kodu. Boş/Başarısız, herhangi bir yanıt alınmadan önce ağ hatası oluştuğunu gösterir.",
  ["HTTP status of the source page itself. Usually 200; if non-2xx the broken link may be inherited."]:
    "Kaynak sayfanın kendi HTTP durumu. Genellikle 200'dür; 2xx dışıysa kırık bağlantı devralınmış olabilir.",
  ["HTTP status returned by the target. 0 = network failure (DNS, TLS, timeout)."]:
    "Hedefin döndürdüğü HTTP durumu. 0 = ağ hatası (DNS, TLS, zaman aşımı).",
  ["HTTP/HTTPS proxies route via undici's ProxyAgent; SOCKS proxies (socks5://, socks5h://, socks4://, socks4a://) tunnel via the socks client. The `h`/`4a` variants resolve DNS at the proxy. Leave empty to inherit HTTPS_PROXY/HTTP_PROXY env vars."]:
    "HTTP/HTTPS proxy'ler undici'nin ProxyAgent'ı üzerinden yönlendirilir; SOCKS proxy'ler (socks5://, socks5h://, socks4://, socks4a://) socks istemcisi üzerinden tünellenir. `h`/`4a` varyantları DNS'i proxy tarafında çözer. HTTPS_PROXY/HTTP_PROXY ortam değişkenlerini devralmak için boş bırakın.",
  ["Identifies the largest element visible in the initial viewport (likely LCP candidate per Google's heuristic) and stores its CSS selector, dimensions, and resource URL. Useful for spotting unoptimised LCP images without a PSI API call."]:
    "İlk görünümde yer alan en büyük öğeyi (Google'ın sezgiseline göre olası LCP adayı) belirler ve CSS seçicisini, boyutlarını ve kaynak URL'ini saklar. PSI API çağrısı yapmadan optimize edilmemiş LCP görsellerini tespit etmek için kullanışlıdır.",
  ["If set, Playwright waits for this CSS selector to appear in the DOM before extracting HTML. Overrides the extra-wait timeout when present. Useful when you know the SPA reveals a specific element after hydration."]:
    "Ayarlanırsa Playwright, HTML'i çıkarmadan önce bu CSS seçicisinin DOM'da görünmesini bekler. Tanımlıysa ek bekleme süresini geçersiz kılar. SPA'nın hydration sonrası belirli bir öğeyi gösterdiğini biliyorsanız kullanışlıdır.",
  ["Images on this page that have no alt attribute. WCAG accessibility issue + missed alt-as-anchor SEO opportunity."]:
    "Bu sayfada alt özniteliği olmayan görseller. WCAG erişilebilirlik sorunu ve kaçırılmış alt-metin SEO fırsatı.",
  ["Indexable / Non-Indexable"]:
    "İndekslenebilir / İndekslenemez",
  ["Internal PageRank, 0–100. Computed over the internal link graph (damping 0.85) and normalised so the most-linked page scores 100. Higher = more internal link equity."]:
    "Dahili PageRank, 0–100. İç bağlantı grafiği üzerinden hesaplanır (damping 0,85) ve en çok bağlantı alan sayfa 100 olacak şekilde normalize edilir. Yüksek = daha fazla iç bağlantı değeri.",
  ["internal / external"]:
    "iç / dış",
  ["JavaScript executed in every page BEFORE navigation begins (init script). Use to set localStorage / cookies / mock APIs / disable animations. Runs in page context — no Node access."]:
    "Gezinme başlamadan ÖNCE her sayfada çalıştırılan JavaScript (init script). localStorage / çerez ayarlamak, API'leri taklit etmek veya animasyonları kapatmak için kullanın. Sayfa bağlamında çalışır — Node erişimi yoktur.",
  ["JavaScript regex (no flags — /g is implicit). Use a capture group with `output=regex_group` to extract just part of the match."]:
    "JavaScript regex'i (bayrak yok — /g örtük olarak uygulanır). Eşleşmenin yalnızca bir kısmını almak için `output=regex_group` ile bir yakalama grubu kullanın.",
  ["JavaScript regex tested against the full URL. Empty = all URLs allowed. URL must match at least one to be enqueued. The start URL is always permitted regardless."]:
    "Tam URL'e karşı test edilen JavaScript regex'i. Boş = tüm URL'lere izin verilir. Bir URL'in kuyruğa alınması için en az biriyle eşleşmesi gerekir. Başlangıç URL'ine her durumda izin verilir.",
  ["JavaScript regex. Any match → URL is skipped, even if it would otherwise pass the include list. Common uses: skip admin areas, large file types, session-id query params."]:
    "JavaScript regex'i. Herhangi bir eşleşme → URL atlanır, dahil etme listesinden geçecek olsa bile. Yaygın kullanımlar: yönetim alanlarını, büyük dosya tiplerini ve oturum kimliği parametrelerini atlamak.",
  ["JSON map of `{ term: count }` literal-substring hits from the configured Custom Search terms."]:
    "Yapılandırılan Özel Arama terimlerinden gelen birebir alt dize eşleşmelerinin `{ terim: sayı }` biçimindeki JSON eşlemesi.",
  ["JSON-stringified array of `{ lang, href }` pairs. Heavy column — better consumed via the URL Details panel."]:
    "`{ lang, href }` çiftlerinin JSON dizisi. Ağır kolondur — URL Detayları panelinden okumak daha rahattır.",
  ["JSON-stringified custom-extraction results map. Heavy column — render verbatim, easier to read in the URL Details panel."]:
    "Özel çıkarım sonuçlarının JSON eşlemesi. Ağır kolondur — birebir gösterilir, URL Detayları panelinde okumak daha kolaydır.",
  ["JSONPath against a JSON response body (e.g. `application/json` APIs). Only runs on responses that parse as JSON — ignored on HTML pages."]:
    "JSON yanıt gövdesine karşı çalışan JSONPath (ör. `application/json` API'leri). Yalnızca JSON olarak ayrıştırılabilen yanıtlarda çalışır — HTML sayfalarda yok sayılır.",
  ["JSONPath returns the matched JSON value as-is; choose `Count` to return the number of matches instead."]:
    "JSONPath, eşleşen JSON değerini olduğu gibi döner; bunun yerine eşleşme sayısını almak için `Count` seçin.",
  ["Largest Contentful Paint from PageSpeed Insights lab data, when the URL has been audited. Google's 'good' LCP threshold is 2500 ms. Pages without PSI data are never flagged on this metric."]:
    "URL denetlenmişse PageSpeed Insights laboratuvar verisinden gelen Largest Contentful Paint değeri. Google'ın 'iyi' LCP eşiği 2500 ms'dir. PSI verisi olmayan sayfalar bu metrikte asla işaretlenmez.",
  ["load = good default. networkidle for heavy SPAs. domcontentloaded if you only need raw HTML."]:
    "load = iyi bir varsayılan. Ağır SPA'lar için networkidle. Yalnızca ham HTML gerekiyorsa domcontentloaded.",
  ["Location header value when status is 3xx. The URL the server points to next; chain length is in the URL Details panel."]:
    "Durum 3xx olduğunda Location başlığının değeri. Sunucunun işaret ettiği bir sonraki URL'dir; zincir uzunluğu URL Detayları panelindedir.",
  ["Lowercases the URL path component. Host is already case-insensitive per the URL spec, so this only affects the path."]:
    "URL'in yol bileşenini küçük harfe çevirir. Host, URL standardına göre zaten büyük/küçük harf duyarsızdır, bu yüzden bu yalnızca yolu etkiler.",
  ["Near-duplicate cluster ID assigned by the post-crawl SimHash pass. 0 = singleton (no near-duplicates within the configured Hamming threshold). Pages sharing a non-zero cluster ID are mutually similar."]:
    "Crawl sonrası SimHash geçişinin atadığı yakın-yinelenen küme kimliği. 0 = tekil (yapılandırılan Hamming eşiği içinde yakın yinelenen yok). Sıfır olmayan aynı küme kimliğini paylaşan sayfalar karşılıklı olarak benzerdir.",
  ["noindex, canonicalised, redirected, blocked-by-robots"]:
    "noindex, canonical edilmiş, yönlendirildi, robots.txt tarafından engellendi",
  ["None for fastest crawl. Above-the-fold for SERP-thumbnail-style preview. Full page when you need long-page snapshots."]:
    "En hızlı crawl için Hiçbiri. SERP küçük resmi tarzı önizleme için Ekranın Üstü. Uzun sayfa anlık görüntüleri gerekiyorsa Tam Sayfa.",
  ["Number of `<form action=\"http://…\">` declarations on an HTTPS page. Submitting one downgrades the connection."]:
    "HTTPS bir sayfadaki `<form action=\"http://…\">` tanımlarının sayısı. Böyle bir formu göndermek bağlantıyı güvensize düşürür.",
  ["Number of `<link rel=\"alternate\" hreflang>` entries declared on this page. 0 = no alternates declared."]:
    "Bu sayfada tanımlanan `<link rel=\"alternate\" hreflang>` girdilerinin sayısı. 0 = alternatif tanımlanmamış.",
  ["Number of `<link rel=\"canonical\">` tags on the page. >1 is a \"Multiple Canonicals\" issue."]:
    "Sayfadaki `<link rel=\"canonical\">` etiketlerinin sayısı. >1 olması \"Birden Fazla Canonical\" sorunudur.",
  ["Number of `<script type=\"application/ld+json\">` blocks parsed successfully on the page."]:
    "Sayfada başarıyla ayrıştırılan `<script type=\"application/ld+json\">` bloklarının sayısı.",
  ["Number of `<script type=\"application/ld+json\">` blocks that failed to parse as JSON."]:
    "JSON olarak ayrıştırılamayan `<script type=\"application/ld+json\">` bloklarının sayısı.",
  ["Number of <img> elements on the page."]:
    "Sayfadaki <img> öğelerinin sayısı.",
  ["Number of browser tabs the pool keeps warm in parallel. 0 = auto (matches crawler concurrency, capped at 8). More tabs = faster crawl but more RAM (each tab ~80–150 MB)."]:
    "Havuzun paralel olarak hazır tuttuğu tarayıcı sekmesi sayısı. 0 = otomatik (crawler eşzamanlılığına eşitlenir, en fazla 8). Daha fazla sekme = daha hızlı crawl ama daha fazla RAM (sekme başına ~80–150 MB).",
  ["Number of hreflang targets that are non-200, noindex, or canonicalised away. Aggregated by the post-crawl pass."]:
    "200 dönmeyen, noindex olan veya canonical ile başka sayfaya yönlendirilen hreflang hedeflerinin sayısı. Crawl sonrası geçişte toplanır.",
  ["Number of HTTP requests in flight at any one time. Equivalent to Screaming Frog's 'Max Threads'. Higher = faster crawl + more load on the target server."]:
    "Aynı anda açık olan HTTP isteklerinin sayısı. Screaming Frog'daki 'Max Threads' karşılığıdır. Yüksek = daha hızlı crawl ve hedef sunucuda daha fazla yük.",
  ["Number of internal `<a>` elements with no usable anchor text or alt — accessibility / SEO regression."]:
    "Kullanılabilir bağlantı metni veya alt metni olmayan iç `<a>` öğelerinin sayısı — erişilebilirlik / SEO açısından gerileme.",
  ["Number of internal pages that link to this URL. A rough internal-PageRank signal."]:
    "Bu URL'e bağlantı veren iç sayfaların sayısı. Kabaca bir dahili PageRank sinyalidir.",
  ["Number of pages in this URL's near-duplicate cluster (1 = no duplicates, ≥2 = part of a duplicate group). Tunable via Settings → Duplicates."]:
    "Bu URL'in yakın-yinelenen kümesindeki sayfa sayısı (1 = yinelenen yok, ≥2 = bir yinelenen grubunun parçası). Ayarlar → Yinelenenler bölümünden ayarlanabilir.",
  ["Number of redirect hops from this URL to its terminal target. Filled by the post-crawl `recomputeRedirectChains` walker. >3 trips the \"Long Chain\" issue."]:
    "Bu URL'den son hedefe kadar olan yönlendirme adımı sayısı. Crawl sonrası `recomputeRedirectChains` yürüteci tarafından doldurulur. >3 olması \"Uzun Zincir\" sorununu tetikler.",
  ["Number of unique <a> links emitted from this page (internal + external)."]:
    "Bu sayfadan çıkan benzersiz <a> bağlantılarının sayısı (iç + dış).",
  ["Off — only enable for testing edge cases."]:
    "Kapalı — yalnızca uç durumları test etmek için açın.",
  ["Off — small speed gain not worth the fidelity loss."]:
    "Kapalı — küçük hız kazancı, doğruluk kaybına değmez.",
  ["On — fonts add overhead without changing SEO output."]:
    "Açık — yazı tipleri SEO çıktısını değiştirmeden yük getirir.",
  ["On (default) — cheap I/O, high SEO value."]:
    "Açık (varsayılan) — düşük maliyetli, yüksek SEO değeri.",
  ["On (default) — media is heavy and rarely SEO-relevant."]:
    "Açık (varsayılan) — medya ağırdır ve nadiren SEO açısından anlamlıdır.",
  ["On (default) so the Internal tab shows images, not just HTML; off for HTML-only crawls."]:
    "Açık (varsayılan), böylece İç Kaynaklar sekmesi yalnızca HTML'i değil görselleri de gösterir; yalnızca HTML taramaları için kapalı.",
  ["On (default); off for HTML-only crawls."]:
    "Açık (varsayılan); yalnızca HTML taramaları için kapalı.",
  ["On (default). Off only when crawling sites you own and need to bypass."]:
    "Açık (varsayılan). Yalnızca size ait olan ve atlamanız gereken siteleri tararken kapalı.",
  ["On for accessibility / WCAG audits."]:
    "Erişilebilirlik / WCAG denetimleri için açık.",
  ["On for max speed. Off if you need LCP candidate detection or visual screenshots later."]:
    "Maksimum hız için açık. Sonrasında LCP aday tespiti veya görsel ekran görüntüleri gerekiyorsa kapalı.",
  ["On for modern sites that 301 http→https anyway; off for legacy intranet."]:
    "Zaten http→https 301 yapan modern siteler için açık; eski intranet siteleri için kapalı.",
  ["On for normal audits; off when you only want to inspect raw 3xx behaviour."]:
    "Normal denetimler için açık; yalnızca ham 3xx davranışını incelemek istediğinizde kapalı.",
  ["On for outbound link audits; off for fast internal-only crawls."]:
    "Dış bağlantı denetimleri için açık; yalnızca iç sayfaları hızlıca taramak için kapalı.",
  ["On for performance-focused audits that should fail pages over a target."]:
    "Hedefi aşan sayfaları başarısız saymak isteyen performans odaklı denetimler için açık.",
  ["On for performance-focused audits."]:
    "Performans odaklı denetimler için açık.",
  ["On for production crawls. Off when debugging selector-not-found / hydration issues."]:
    "Canlı crawl'lar için açık. Seçici bulunamadı / hydration sorunlarını incelerken kapalı.",
  ["ON for SEO audits (the typical case). Turn OFF to also cluster paginated / canonical-blocked variants for completeness."]:
    "SEO denetimleri için AÇIK (tipik durum). Sayfalanmış / canonical ile engellenmiş varyantları da eksiksizlik için kümelemek istiyorsanız KAPATIN.",
  ["On for SEO audits that include Google's Mobile-Friendly checks."]:
    "Google'ın Mobil Uyumluluk kontrollerini içeren SEO denetimleri için açık.",
  ["On for SEO audits where View Source matters; off for 1M-URL crawls where disk is tight."]:
    "Kaynağı Görüntüle'nin önemli olduğu SEO denetimleri için açık; diskin dar olduğu 1M URL'lik crawl'larda kapalı.",
  ["ON for SEO audits. OFF only when you specifically need to inspect raw-URL collisions (e.g. case-sensitive filesystem CMSes)."]:
    "SEO denetimleri için AÇIK. Yalnızca ham URL çakışmalarını incelemeniz gerekiyorsa KAPALI (ör. büyük/küçük harfe duyarlı dosya sistemli CMS'ler).",
  ["On if you need nofollow attribute audits; off keeps the link graph cleaner."]:
    "nofollow özniteliği denetimi gerekiyorsa açık; kapalı olması bağlantı grafiğini daha temiz tutar.",
  ["On if your CMS serves the same page at mixed casing (/Foo and /foo)."]:
    "CMS'iniz aynı sayfayı farklı harf düzenleriyle sunuyorsa açık (/Foo ve /foo).",
  ["On if your site canonicalises to non-www but emits www links somewhere."]:
    "Siteniz www'siz sürüme kanonikleşiyor ama bir yerlerde www'li bağlantılar üretiyorsa açık.",
  ["On network errors, 408/425/429/5xx responses, retry up to N more times before giving up. Each retry counts toward the URL's response time budget."]:
    "Ağ hatalarında ve 408/425/429/5xx yanıtlarında, vazgeçmeden önce en fazla N kez daha dener. Her deneme URL'in yanıt süresi bütçesine dahil olur.",
  ["On when auditing mobile UX or capturing PageSpeed-style mobile previews."]:
    "Mobil kullanıcı deneyimini denetlerken veya PageSpeed tarzı mobil önizlemeler alırken açık.",
  ["One header per line in 'Key: Value' format. Added to every request — useful for auth tokens or custom routing hints. User values override defaults when keys collide."]:
    "Her satıra bir başlık, 'Anahtar: Değer' biçiminde. Her isteğe eklenir — kimlik doğrulama token'ları veya özel yönlendirme ipuçları için kullanışlıdır. Anahtarlar çakıştığında kullanıcı değerleri varsayılanları geçersiz kılar.",
  ["One sitemap URL per line. On top of following links from the start URL, the crawler fetches these sitemaps and queues every page they list as an extra seed — faster/more complete discovery, and reliable orphan detection even when the sitemap lives at a non-standard path. Leave empty to disable."]:
    "Her satıra bir sitemap URL'i. Başlangıç URL'inden bağlantı takibine ek olarak crawler bu sitemap'leri çeker ve listeledikleri her sayfayı ekstra başlangıç noktası olarak kuyruğa alır — daha hızlı ve eksiksiz keşif, ayrıca sitemap standart dışı bir yolda olsa bile güvenilir orphan tespiti. Devre dışı bırakmak için boş bırakın.",
  ["One URL per line. Each is fetched exactly once; outlinks are NOT followed. Comments starting with # are ignored."]:
    "Her satıra bir URL. Her biri tam olarak bir kez çekilir; giden bağlantılar takip EDİLMEZ. # ile başlayan satırlar yok sayılır.",
  ["OS scheduler hint applied at crawl start. Lowering priority lets the rest of the machine stay responsive during heavy crawls. May require elevated privileges on some platforms."]:
    "Crawl başlangıcında uygulanan işletim sistemi zamanlayıcı ipucu. Önceliği düşürmek, ağır crawl'lar sırasında makinenin geri kalanının akıcı kalmasını sağlar. Bazı platformlarda yükseltilmiş yetki gerektirebilir.",
  ["Page A→B declared but B→A absent flags 'Reciprocity Missing'; same lang on two hrefs flags 'Inconsistent Lang'."]:
    "A→B tanımlanmış ama B→A yoksa 'Karşılıklılık Eksik' işaretlenir; iki farklı href'te aynı dil kullanılıyorsa 'Tutarsız Dil' işaretlenir.",
  ["Page that contains the broken link."]:
    "Kırık bağlantıyı içeren sayfa.",
  ["Pages with > this many outgoing links (internal + external) trip the 'Total Links per Page' issue. Google's historic recommendation is 100; mega-menus/hub-pages routinely blow past this."]:
    "Bu sayıdan fazla giden bağlantısı (iç + dış) olan sayfalar 'Sayfa Başına Toplam Bağlantı' sorununu tetikler. Google'ın geçmişteki önerisi 100'dür; mega menüler ve hub sayfaları bunu rutin olarak aşar.",
  ["PASS = indexed · FAIL = not indexed · PART/NEU = discovered but not yet indexed"]:
    "PASS = indekslendi · FAIL = indekslenmedi · PART/NEU = keşfedildi ama henüz indekslenmedi",
  ["Pattern: ^https://m\\.(.+) · Replacement: https://www.$1 · Flags: i  (collapse mobile subdomain to www)"]:
    "Desen: ^https://m\\.(.+) · Değişim: https://www.$1 · Bayraklar: i  (mobil alt alan adını www'ye indirger)",
  ["Per-request abort threshold. Pages that take longer than this are recorded as network errors. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — that one's in seconds, this is in milliseconds."]:
    "İstek başına iptal eşiği. Bundan uzun süren sayfalar ağ hatası olarak kaydedilir. Screaming Frog karşılığı: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — o saniye cinsindendir, bu milisaniye.",
  ["Persist rel=\"nofollow\" links in the link graph. When off, nofollow links are dropped entirely (not counted in outlinks, not probed as externals). Screaming Frog inverse: turning this ON ≈ unchecking \"Follow Internal/External Nofollow\"."]:
    "rel=\"nofollow\" bağlantılarını bağlantı grafiğinde saklar. Kapalıyken nofollow bağlantıları tamamen düşürülür (giden bağlantılara sayılmaz, dış bağlantı olarak sınanmaz). Screaming Frog'da tersi geçerlidir: bunu AÇMAK ≈ \"Follow Internal/External Nofollow\" seçeneğinin işaretini kaldırmak.",
  ["Picking a preset fills the User-Agent field below — you can still hand-edit it afterwards. Switch between Googlebot Smartphone / Desktop to compare how a site responds to mobile vs desktop crawlers."]:
    "Hazır ayar seçmek aşağıdaki User-Agent alanını doldurur — sonrasında elle düzenleyebilirsiniz. Bir sitenin mobil ve masaüstü crawler'lara nasıl yanıt verdiğini karşılaştırmak için Googlebot Akıllı Telefon / Masaüstü arasında geçiş yapın.",
  ["Picks one of the saved profiles by name. Empty = use the Proxy URL field above (or env vars when that's also empty)."]:
    "Kayıtlı profillerden birini adıyla seçer. Boş = yukarıdaki Proxy URL alanını kullan (o da boşsa ortam değişkenlerini).",
  ["Pre-computes Dead External Domain, Duplicate URL post-norm, Canonical Chain Multi-hop. Without this the sidebar shows 0 for those three."]:
    "Ölü Dış Alan Adı, Normalizasyon Sonrası Yinelenen URL ve Çok Adımlı Canonical Zinciri değerlerini önceden hesaplar. Bu olmadan kenar çubuğu bu üçü için 0 gösterir.",
  ["Probe outbound links to other hosts (HEAD only) so the Broken Links view catches dead externals. Screaming Frog: 'External Links' (Configuration → Spider → Crawl)."]:
    "Diğer sunuculara giden bağlantıları sınar (yalnızca HEAD); böylece Kırık Bağlantılar görünümü ölü dış bağlantıları yakalar. Screaming Frog karşılığı: 'External Links' (Configuration → Spider → Crawl).",
  ["Raw `Content-Security-Policy` response header. Empty when missing."]:
    "Ham `Content-Security-Policy` yanıt başlığı. Yoksa boştur.",
  ["Raw `content` attribute of `<meta http-equiv=\"refresh\">`, e.g. \"5; url=/foo\"."]:
    "`<meta http-equiv=\"refresh\">` etiketinin ham `content` özniteliği, ör. \"5; url=/foo\".",
  ["Raw `Strict-Transport-Security` header. Empty when missing — for HTTPS pages this is a security regression."]:
    "Ham `Strict-Transport-Security` başlığı. Yoksa boştur — HTTPS sayfalar için bu bir güvenlik eksikliğidir.",
  ["Raw `X-Content-Type-Options` header. `nosniff` blocks MIME sniffing — prevents some XSS via content-type confusion."]:
    "Ham `X-Content-Type-Options` başlığı. `nosniff`, MIME türü tahminini engeller — içerik tipi karışıklığından kaynaklanan bazı XSS'leri önler.",
  ["Raw `X-Frame-Options` header. SAMEORIGIN / DENY / ALLOW-FROM. Clickjacking defence."]:
    "Ham `X-Frame-Options` başlığı. SAMEORIGIN / DENY / ALLOW-FROM. Clickjacking savunmasıdır.",
  ["Raw value of the Content-Type response header (incl. charset)."]:
    "Content-Type yanıt başlığının ham değeri (charset dahil).",
  ["Re-renders each page on a mobile viewport and checks viewport meta tag, horizontal overflow, font size legibility, and tap-target spacing. Stores a pass/fail verdict on the urls table."]:
    "Her sayfayı mobil görünümde yeniden render eder; viewport meta etiketini, yatay taşmayı, yazı tipi okunabilirliğini ve dokunma hedefi aralıklarını denetler. Geçti/kaldı sonucunu urls tablosuna yazar.",
  ["Read the full article →"]:
    "Makalenin tamamını oku →",
  ["Reject-all = ignore Set-Cookie entirely (zero counts on cookie-flag issues). Block-third-party = analyse only first-party cookies (Domain attribute matches the page's registrable domain). Accept-all = analyse every Set-Cookie regardless of scope."]:
    "Tümünü reddet = Set-Cookie tamamen yok sayılır (çerez bayrağı sorunları sıfır çıkar). Üçüncü tarafı engelle = yalnızca birinci taraf çerezler analiz edilir (Domain özniteliği sayfanın kayıtlı alan adıyla eşleşenler). Tümünü kabul et = kapsamdan bağımsız olarak her Set-Cookie analiz edilir.",
  ["Reject-all for stateless audits; Block-third-party to focus on the site's own cookie hygiene; Accept-all to also see ad/analytics tracker cookies."]:
    "Durumsuz denetimler için Tümünü reddet; sitenin kendi çerez hijyenine odaklanmak için Üçüncü tarafı engelle; reklam/analitik takip çerezlerini de görmek için Tümünü kabul et.",
  ["Removes the leading 'www.' from the host at normalisation time. The seen-set, redirect graph, and link extraction all use the rewritten form, so duplicates collapse correctly."]:
    "Normalizasyon sırasında host'un başındaki 'www.' ifadesini kaldırır. Görülenler kümesi, yönlendirme grafiği ve bağlantı çıkarımı yeniden yazılmış biçimi kullanır, böylece yinelenenler doğru şekilde birleşir.",
  ["Renders the page a second time on a mobile viewport and stores an above-the-fold PNG. Adds another full render + screenshot per URL."]:
    "Sayfayı mobil görünümde ikinci kez render eder ve ekranın üst kısmının PNG'sini saklar. URL başına bir tam render ve ekran görüntüsü daha ekler.",
  ["Resolved absolute URL of the <img src> attribute."]:
    "<img src> özniteliğinin mutlak URL'e çözümlenmiş hali.",
  ["Response body size in bytes (compressed transfer size, post-Content-Encoding)."]:
    "Yanıt gövdesinin bayt cinsinden boyutu (Content-Encoding sonrası sıkıştırılmış transfer boyutu).",
  ["Rewrites http:// to https:// before fetching. Breaks HTTP-only sites."]:
    "Çekmeden önce http:// adresini https:// olarak yeniden yazar. Yalnızca HTTP üzerinden yayın yapan siteleri bozar.",
  ["Run Chromium without a visible window. Turn off to debug rendering visually — useful when a page renders correctly in a normal browser but not under Playwright."]:
    "Chromium'u görünür pencere olmadan çalıştırır. Render'ı görsel olarak incelemek için kapatın — bir sayfa normal tarayıcıda doğru render edilip Playwright altında edilmiyorsa kullanışlıdır.",
  ["Run the login steps once before the crawl, then replay the session cookies on every request."]:
    "Giriş adımlarını crawl'dan önce bir kez çalıştırır, ardından oturum çerezlerini her istekte tekrar kullanır.",
  ["Runs iterative PageRank (damping 0.85) over the internal link graph and normalises it to a 0–100 Link Score per page. Drives the Link Score column and the 'By Link Score' visualization colour mode."]:
    "İç bağlantı grafiği üzerinde yinelemeli PageRank (damping 0,85) çalıştırır ve sayfa başına 0–100 arası Bağlantı Puanına normalize eder. Bağlantı Puanı kolonunu ve görselleştirmedeki 'Bağlantı Puanına Göre' renk modunu besler.",
  ["Sends the URL through the same normalisation pipeline used by the crawler, with your unsaved settings applied. Useful for verifying regex rules before kicking off a crawl."]:
    "URL'i, kaydedilmemiş ayarlarınız uygulanmış halde crawler'ın kullandığı normalizasyon hattından geçirir. Crawl başlatmadan önce regex kurallarını doğrulamak için kullanışlıdır.",
  ["Sent on every request as the User-Agent header. Identifies the crawler to servers; some sites serve different content based on UA."]:
    "Her istekte User-Agent başlığı olarak gönderilir. Crawler'ı sunuculara tanıtır; bazı siteler UA'ya göre farklı içerik sunar.",
  ["Sent on every request. Affects which locale a multi-lingual site serves you."]:
    "Her istekte gönderilir. Çok dilli bir sitenin size hangi dili sunacağını etkiler.",
  ["Sent verbatim as `Bearer <token>`. Don't include the `Bearer ` prefix yourself."]:
    "`Bearer <token>` olarak birebir gönderilir. `Bearer ` ön ekini kendiniz eklemeyin.",
  ["Server response time (a TTFB proxy) measured during the crawl. Pages slower than this are flagged. Google considers a good server response time under 800 ms."]:
    "Crawl sırasında ölçülen sunucu yanıt süresi (TTFB yaklaşığı). Bundan yavaş sayfalar işaretlenir. Google, 800 ms altındaki sunucu yanıt süresini iyi kabul eder.",
  ["Shop the latest game keys at unbeatable prices…"]:
    "En yeni oyun anahtarlarını rakipsiz fiyatlarla keşfedin…",
  ["Skips body parsing for pages whose Content-Length header exceeds this. The page row is still created so links to it aren't lost; only body parsing and source snapshot capture are skipped."]:
    "Content-Length başlığı bu değeri aşan sayfalarda gövde ayrıştırmasını atlar. Sayfa satırı yine oluşturulur, böylece ona giden bağlantılar kaybolmaz; yalnızca gövde ayrıştırma ve kaynak anlık görüntüsü atlanır.",
  ["Sleep this long on each worker AFTER a response completes, before it picks up the next URL. Stacks with the global RPS cap — useful for sites that rate-limit on inter-request gap rather than total throughput."]:
    "Her işçinin, bir yanıt tamamlandıktan SONRA bir sonraki URL'i almadan önce bekleyeceği süre. Global RPS sınırıyla birlikte uygulanır — toplam hız yerine istekler arası boşluğa göre sınırlama yapan siteler için kullanışlıdır.",
  ["Specific reason a URL is non-indexable. For Indexable URLs this column is empty."]:
    "Bir URL'in neden indekslenemez olduğunun spesifik nedeni. İndekslenebilir URL'lerde bu kolon boştur.",
  ["Spider follows links from the start URL across the chosen scope. List fetches a fixed set of URLs once with no link-following. Sitemap fetches a sitemap URL and crawls every page it lists (no link-following)."]:
    "Spider, seçilen kapsam içinde başlangıç URL'inden bağlantıları takip eder. Liste, sabit bir URL kümesini bağlantı takibi yapmadan bir kez çeker. Sitemap, bir sitemap URL'ini çeker ve listelediği her sayfayı tarar (bağlantı takibi yok).",
  ["Spider for full site audits; List for re-checking a known set of pages; Sitemap to audit exactly what's published in sitemap.xml."]:
    "Tam site denetimleri için Spider; bilinen bir sayfa kümesini yeniden kontrol etmek için Liste; sitemap.xml'de yayımlananı birebir denetlemek için Sitemap.",
  ["Standard CSS selector — same syntax as `document.querySelectorAll`."]:
    "Standart CSS seçicisi — `document.querySelectorAll` ile aynı sözdizimi.",
  ["Stored in your local prefs file as plain text. Treat the file accordingly."]:
    "Yerel tercihler dosyanızda düz metin olarak saklanır. Dosyayı buna göre koruyun.",
  ["Strip if your site canonicalises /foo (no slash); Add for sites that canonicalise /foo/."]:
    "Siteniz /foo (eğik çizgisiz) biçimine kanonikleşiyorsa Kaldır; /foo/ biçimine kanonikleşen siteler için Ekle.",
  ["Sunset over the mountain ridge"]:
    "Dağ sırtında gün batımı",
  ["Surplus `@id` occurrences across all JSON-LD blocks (page declares the same `@id` more than once)."]:
    "Tüm JSON-LD blokları genelinde fazladan `@id` kullanımları (sayfa aynı `@id` değerini birden fazla kez tanımlıyor).",
  ["Terminal URL the redirect chain resolves to. Empty when this row is itself the terminal (i.e. status is 2xx/4xx/5xx) or when the chain hits a loop."]:
    "Yönlendirme zincirinin çözümlendiği son URL. Bu satırın kendisi son nokta ise (yani durum 2xx/4xx/5xx) veya zincir bir döngüye girerse boştur.",
  ["text for visible content, attribute for href/src, count for occurrence count"]:
    "görünür içerik için text, href/src için attribute, tekrar sayısı için count",
  ["Text of the first <h1> on the page. Should match user intent and ideally complement (not duplicate) the title."]:
    "Sayfadaki ilk <h1> metni. Kullanıcı niyetiyle örtüşmeli ve ideal olarak başlığı tekrar etmek yerine tamamlamalıdır.",
  ["Text Only fetches the raw HTML response as-is — fast and deterministic. Old AJAX Crawling Scheme rewrites hashbang (#!) URLs to Google's deprecated ?_escaped_fragment_= form so a pre-rendering server returns the snapshot. Full JavaScript rendering is a V2 item."]:
    "Yalnızca Metin, ham HTML yanıtını olduğu gibi çeker — hızlı ve öngörülebilir. Eski AJAX Tarama Şeması, hashbang (#!) URL'lerini Google'ın kullanımdan kaldırdığı ?_escaped_fragment_= biçimine çevirir, böylece ön render yapan sunucu anlık görüntüyü döner. Tam JavaScript render'ı bir V2 maddesidir.",
  ["Text Only for server-rendered / static sites; Old AJAX only for legacy hashbang SPAs."]:
    "Sunucu tarafında render edilen / statik siteler için Yalnızca Metin; yalnızca eski hashbang SPA'lar için Eski AJAX.",
  ["The column / JSON-key name for this rule's output. Free-form."]:
    "Bu kuralın çıktısı için kolon / JSON anahtar adı. Serbest biçimlidir.",
  ["The fully normalised URL of the crawled resource (post URL-rewriting)."]:
    "Taranan kaynağın tam normalize edilmiş URL'i (URL yeniden yazımı sonrası).",
  ["The URL that fails to resolve (4xx/5xx/network error)."]:
    "Çözümlenemeyen URL (4xx/5xx/ağ hatası).",
  ["Third-party `<script>` / `<link rel=stylesheet>` references without an `integrity=` attribute. SRI is recommended for any cross-origin subresource."]:
    "`integrity=` özniteliği olmayan üçüncü taraf `<script>` / `<link rel=stylesheet>` referansları. Çapraz kaynaklı her alt kaynak için SRI önerilir.",
  ["Time-to-first-byte in milliseconds (network + server, excluding parse). Lower is better; >2000 ms is slow."]:
    "Milisaniye cinsinden ilk bayta kadar geçen süre (ağ + sunucu, ayrıştırma hariç). Düşük olması iyidir; >2000 ms yavaştır.",
  ["Total number of <h1> elements on the page. SEO best practice is exactly 1."]:
    "Sayfadaki toplam <h1> öğesi sayısı. SEO açısından en iyi uygulama tam olarak 1'dir.",
  ["Total number of <h2> elements on the page."]:
    "Sayfadaki toplam <h2> öğesi sayısı.",
  ["tr,en;q=0.8 — Turkish first, English fallback."]:
    "tr,en;q=0.8 — önce Türkçe, yedek olarak İngilizce.",
  ["Trips 'Folder Depth Too Deep' when the URL path's `/`-segment count exceeds this. Useful for spotting over-nested URL structures that bury content from crawlers."]:
    "URL yolundaki `/` bölüm sayısı bu değeri aştığında 'Klasör Derinliği Çok Fazla' sorununu tetikler. İçeriği crawler'lardan gizleyen aşırı iç içe URL yapılarını tespit etmek için kullanışlıdır.",
  ["Trips 'Long Query String' when LENGTH(query) > this. Typical session-id sprawl + UTM tracking hits 100+ chars; over 200 starts to look like a bug."]:
    "LENGTH(query) bu değeri aştığında 'Uzun Sorgu Dizesi' sorununu tetikler. Tipik oturum kimliği ve UTM takip parametreleri 100+ karaktere ulaşır; 200 üzeri artık bir hataya benzer.",
  ["Trips the 'URL Too Long' issue when LENGTH(url) > this. RFC 7230 doesn't mandate a max but most servers + middleboxes fail above ~2 KB; Chrome itself caps at ~32 KB."]:
    "LENGTH(url) bu değeri aştığında 'URL Çok Uzun' sorununu tetikler. RFC 7230 bir üst sınır zorunlu kılmaz ama çoğu sunucu ve ara katman ~2 KB üzerinde hata verir; Chrome'un kendi sınırı ~32 KB'dir.",
  ["Two modes per line. (1) Wrap in slashes for a regex: /pattern/flags — supported flags imsuy (g is forced). Invalid patterns appear with count -1 in the detail panel so you can spot the typo. (2) Anything else is a literal case-insensitive substring — the legacy behaviour. Each term's per-page hit count is surfaced in the URL Details panel."]:
    "Satır başına iki mod. (1) Regex için eğik çizgiler arasına alın: /desen/bayraklar — desteklenen bayraklar imsuy (g zorunlu uygulanır). Geçersiz desenler detay panelinde -1 sayısıyla görünür, böylece yazım hatasını fark edebilirsiniz. (2) Diğer her şey büyük/küçük harf duyarsız birebir alt dizedir — eski davranış. Her terimin sayfa başına eşleşme sayısı URL Detayları panelinde gösterilir.",
  ["Two pages are flagged as near-duplicates if their 64-bit SimHash differs by at most this many bits. 3 ≈ 95% similarity over body-text shingles (Screaming Frog's tightest filter). Set to 0 to skip clustering entirely."]:
    "İki sayfanın 64-bit SimHash değeri en fazla bu kadar bit farklıysa yakın-yinelenen olarak işaretlenir. 3 ≈ gövde metni parçaları üzerinde %95 benzerlik (Screaming Frog'un en sıkı filtresi). Kümelemeyi tamamen atlamak için 0 yapın.",
  ["URL declared by the first <link rel=\"canonical\"> tag. Tells search engines which version to index when duplicates exist."]:
    "İlk <link rel=\"canonical\"> etiketinde tanımlanan URL. Yinelenenler varken arama motorlarına hangi sürümün indeksleneceğini söyler.",
  ["URL paths ending in any of these extensions are not enqueued. Case-insensitive. Start URL is always crawled regardless."]:
    "Bu uzantılardan biriyle biten URL yolları kuyruğa alınmaz. Büyük/küçük harf duyarsızdır. Başlangıç URL'i her durumda taranır.",
  ["Value of the alt attribute. Empty cell = no alt declared (accessibility/SEO issue)."]:
    "alt özniteliğinin değeri. Boş hücre = alt tanımlanmamış (erişilebilirlik/SEO sorunu).",
  ["Value of the X-Robots-Tag HTTP response header. Same semantics as meta robots but applied at the server."]:
    "X-Robots-Tag HTTP yanıt başlığının değeri. meta robots ile aynı anlama gelir ama sunucu tarafında uygulanır.",
  ["Viewport height — affects above-the-fold detection and lazy-load triggers."]:
    "Görünüm yüksekliği — ekranın üstü tespitini ve lazy-load tetikleyicilerini etkiler.",
  ["Viewport width applied to every rendered page. Mobile audits typically use 360–414, desktop 1280–1920."]:
    "Render edilen her sayfaya uygulanan görünüm genişliği. Mobil denetimlerde tipik olarak 360–414, masaüstünde 1280–1920 kullanılır.",
  ["Visible body text word count (excludes <script>/<style>). Useful for identifying thin content."]:
    "Görünür gövde metninin kelime sayısı (<script>/<style> hariç). Zayıf içeriği tespit etmek için kullanışlıdır.",
  ["Wait this long before the FIRST retry, doubling on each subsequent attempt (500 → 1000 → 2000 …)."]:
    "İLK yeniden denemeden önce bu kadar bekler, sonraki her denemede süre ikiye katlanır (500 → 1000 → 2000 …).",
  ["Walks 3xx redirect chains, fills `redirect_chain_length` / `redirect_loop`. Drives the 'Long Chain' and 'Redirect Loop' issues + the Redirects tab."]:
    "3xx yönlendirme zincirlerini yürür, `redirect_chain_length` / `redirect_loop` alanlarını doldurur. 'Uzun Zincir' ve 'Yönlendirme Döngüsü' sorunlarını ve Yönlendirmeler sekmesini besler.",
  ["Welcome to Example Store"]:
    "Örnek Mağazaya Hoş Geldiniz",
  ["What to do when multiple matches exist."]:
    "Birden fazla eşleşme olduğunda ne yapılacağı.",
  ["What to read off each matched element. Ignored for an XPath `/@attr` or `/text()` terminal — that value is used directly."]:
    "Eşleşen her öğeden neyin okunacağı. XPath `/@attr` veya `/text()` ile biten ifadelerde yok sayılır — o değer doğrudan kullanılır.",
  ["When non-empty, ALL query parameters not on this list are dropped during normalisation (case-insensitive name match). Leave empty to keep the default behaviour, which strips just utm_*, fbclid, gclid, mc_cid, and mc_eid."]:
    "Boş değilse, bu listede olmayan TÜM sorgu parametreleri normalizasyon sırasında düşürülür (ad eşleşmesi büyük/küçük harf duyarsızdır). Yalnızca utm_*, fbclid, gclid, mc_cid ve mc_eid parametrelerini temizleyen varsayılan davranış için boş bırakın.",
  ["When off, no budget evaluation runs and the verdict column is cleared. When on, the post-crawl pass scores every internal 200 HTML page against the ceilings below."]:
    "Kapalıyken bütçe değerlendirmesi çalışmaz ve sonuç kolonu temizlenir. Açıkken crawl sonrası geçiş, 200 dönen her iç HTML sayfasını aşağıdaki tavanlara göre puanlar.",
  ["When on (default), pagination_next + pagination_prev URLs are post-fetch enqueued. Off only to debug pagination-only loops without disabling all link follow."]:
    "Açıkken (varsayılan), pagination_next ve pagination_prev URL'leri çekim sonrası kuyruğa alınır. Yalnızca tüm bağlantı takibini kapatmadan sayfalama döngülerini incelemek için kapatın.",
  ["When ON (default), the Duplicate URL filter compares URLs after lowercasing the host, dropping the query string, and trimming the trailing slash — the canonical SEO behaviour. When OFF, comparison is byte-exact, so the filter only fires on rows that share an identical raw URL string (rare since URLs are deduped at insert time)."]:
    "AÇIK olduğunda (varsayılan), Yinelenen URL filtresi URL'leri host küçük harfe çevrilmiş, sorgu dizesi atılmış ve sondaki eğik çizgi kırpılmış halde karşılaştırır — standart SEO davranışı. KAPALI olduğunda karşılaştırma bayt bazındadır, bu yüzden filtre yalnızca birebir aynı ham URL dizesini paylaşan satırlarda tetiklenir (URL'ler ekleme sırasında zaten tekilleştirildiği için nadirdir).",
  ["When on, `<meta http-equiv='refresh'>` content URLs are enqueued like a redirect target. window.location body redirects are heuristic-only and currently out of scope."]:
    "Açıkken `<meta http-equiv='refresh'>` içeriğindeki URL'ler bir yönlendirme hedefi gibi kuyruğa alınır. window.location ile yapılan gövde yönlendirmeleri yalnızca sezgiseldir ve şu an kapsam dışıdır.",
  ["When on, a 200 page declaring a canonical pointing elsewhere also enqueues that target. Default off — most crawls treat canonicals as a signal, not a navigation hint."]:
    "Açıkken, başka bir yeri gösteren canonical tanımlayan 200 sayfaları o hedefi de kuyruğa alır. Varsayılan kapalıdır — çoğu crawl canonical'ı gezinme ipucu değil, sinyal olarak değerlendirir.",
  ["When on, pages with noindex / canonicalised / robots-blocked indexability are excluded from clustering — the Near-Duplicate report then surfaces only issues that affect search visibility."]:
    "Açıkken noindex / canonical ile yönlendirilmiş / robots tarafından engellenmiş sayfalar kümelemenin dışında tutulur — Yakın Yinelenen raporu böylece yalnızca arama görünürlüğünü etkileyen sorunları gösterir.",
  ["When on, rel=nofollow links are recursed into like any other link. Default off — Screaming Frog 'Respect Nofollow' default."]:
    "Açıkken rel=nofollow bağlantıları diğer bağlantılar gibi takip edilir. Varsayılan kapalıdır — Screaming Frog'un 'Respect Nofollow' varsayılanı.",
  ["When Playwright considers navigation complete. domcontentloaded = HTML parsed but resources still loading. load = window.load fired. networkidle = no network activity for 500ms (best for SPA but slower). commit = just response committed (fastest, riskiest)."]:
    "Playwright'ın gezinmeyi ne zaman tamamlanmış sayacağı. domcontentloaded = HTML ayrıştırıldı ama kaynaklar hâlâ yükleniyor. load = window.load tetiklendi. networkidle = 500 ms boyunca ağ etkinliği yok (SPA için en iyisi ama daha yavaş). commit = yalnızca yanıt teslim edildi (en hızlı, en riskli).",
  ["Whether the broken target is on the same site (internal) or a different host (external)."]:
    "Kırık hedefin aynı sitede (iç) mi yoksa farklı bir sunucuda (dış) mı olduğu.",
  ["Whether the URL is eligible to appear in search results. Combines status code, robots directives, canonical, and meta-refresh signals."]:
    "URL'in arama sonuçlarında görünmeye uygun olup olmadığı. Durum kodu, robots direktifleri, canonical ve meta-refresh sinyallerini birleştirir.",
  ["Width attribute value (in pixels) declared on the <img> tag, when present."]:
    "Varsa <img> etiketinde tanımlanan width özniteliğinin değeri (piksel).",
  ["XPath 1.0 subset over the parsed DOM. End in `/@attr` or `/text()` to read an attribute / text node. Predicates: `[n]`, `[@class=\"x\"]`, `[contains(@class,\"x\")]`, `[last()]`."]:
    "Ayrıştırılmış DOM üzerinde XPath 1.0 alt kümesi. Bir özniteliği / metin düğümünü okumak için `/@attr` veya `/text()` ile bitirin. Yüklemler: `[n]`, `[@class=\"x\"]`, `[contains(@class,\"x\")]`, `[last()]`.",
  ["Y when the page declares hreflang alternates but no entry whose `href` matches the page URL. Google requires a self-reference."]:
    "Sayfa hreflang alternatifleri tanımlıyor ama `href` değeri sayfa URL'iyle eşleşen bir girdi yoksa Y olur. Google kendine referans verilmesini zorunlu tutar.",
  ["Y when the redirect chain originating at this URL contains a cycle (A → B → A) detected by the cycle-safe walker; the chain is otherwise unwalked."]:
    "Bu URL'den başlayan yönlendirme zinciri, döngüye dayanıklı yürütecin tespit ettiği bir çevrim (A → B → A) içeriyorsa Y olur; aksi halde zincir yürünmemiştir.",
  ["Y when this URL belongs to a paginated cluster whose ordinal sequence has a gap (e.g. ?page=1, 2, 4 — page 3 missing). Set by the post-crawl `recomputePaginationSequence` pass."]:
    "Bu URL, sıra numaralarında boşluk olan bir sayfalama kümesine aitse Y olur (ör. ?page=1, 2, 4 — 3. sayfa eksik). Crawl sonrası `recomputePaginationSequence` geçişi tarafından ayarlanır.",
};

/**
 * Translate an InfoTip body. Returns the input unchanged for English, for
 * unknown strings, and for empty input.
 */
export function translateInfoTip(text: string | undefined, lang: string): string | undefined {
  if (!text || !lang.startsWith('tr')) return text;
  return TR_INFO_TIPS[text] ?? text;
}
