/**
 * Hindi InfoTip ([i] tooltip) bodies, keyed by the verbatim English
 * source string. See `../info-tips.ts` for the rationale.
 */

export const HI_INFO_TIPS: Record<string, string> = {
  ["?page=1 / ?page=2 / ?page=4 → flags 'Sequence Break' on every member of the broken cluster."]:
    "?page=1 / ?page=2 / ?page=4 → टूटे हुए क्लस्टर के हर सदस्य पर 'अनुक्रम टूटा' चिह्न लगाता है।",
  ['`<a>` elements that look clickable but aren\'t crawlable (no href + onclick, `href="javascript:…"`, or `href="#"` with onclick).']:
    'ऐसे `<a>` तत्व जो क्लिक करने योग्य दिखते हैं पर क्रॉल नहीं किए जा सकते (href नहीं पर onclick है, `href="javascript:…"`, या onclick के साथ `href="#"`)।',
  ['`<link rel="amphtml" href="…">` value — the AMP version of this page. Empty when the page does not declare an AMP alternate.']:
    '`<link rel="amphtml" href="…">` का मान — इस पेज का AMP संस्करण। पेज कोई AMP विकल्प घोषित न करे तो खाली।',
  ['`<link rel="next" href="…">` value resolved to absolute. Empty when the page is not paginated forward.']:
    '`<link rel="next" href="…">` का मान, पूर्ण URL में बदला हुआ। पेज आगे की ओर पेजिनेट न हो तो खाली।',
  ['`<link rel="prev" href="…">` value resolved to absolute. Empty when the page is the first in its pagination cluster.']:
    '`<link rel="prev" href="…">` का मान, पूर्ण URL में बदला हुआ। पेज अपने पेजिनेशन क्लस्टर का पहला पेज हो तो खाली।',
  ['`css` runs against the parsed DOM; `regex` runs against raw HTML.']:
    '`css` पार्स किए गए DOM पर चलता है; `regex` कच्चे HTML पर चलता है।',
  ['`none` disables auth; `basic` adds `Authorization: Basic <base64>`; `bearer` adds `Authorization: Bearer <token>`; `digest` performs the RFC 2617 challenge-response on the first 401.']:
    '`none` प्रमाणीकरण बंद करता है; `basic` `Authorization: Basic <base64>` जोड़ता है; `bearer` `Authorization: Bearer <token>` जोड़ता है; `digest` पहले 401 पर RFC 2617 चैलेंज-रिस्पॉन्स करता है।',
  ['`POST <url>` is fired when the `done` event emits. 10 s timeout. Failures are logged as info events but never break the crawl.']:
    '`done` इवेंट आने पर `POST <url>` भेजा जाता है। टाइमआउट 10 सेकंड। विफलताएँ सूचना इवेंट के रूप में लॉग होती हैं, पर क्रॉल को कभी नहीं तोड़तीं।',
  ['0 (no duplicates), 7 (member of cluster #7)']:
    '0 (कोई डुप्लिकेट नहीं), 7 (क्लस्टर #7 का सदस्य)',
  ['0 = auto. 4 for 8GB RAM machines, 8+ for 16GB+.']:
    '0 = स्वचालित। 8GB RAM वाली मशीनों पर 4, 16GB+ पर 8+।',
  ["0 default; 250 ms when a host returns 429 with a 'too fast' message."]:
    "डिफ़ॉल्ट 0; जब कोई होस्ट 'बहुत तेज़' संदेश के साथ 429 लौटाए तो 250 ms।",
  ['0 for SSR sites, 2000 for typical SPAs, 5000+ for heavy client-rendered apps.']:
    'SSR साइटों के लिए 0, सामान्य SPA के लिए 2000, भारी क्लाइंट-रेंडर ऐप्स के लिए 5000+।',
  ["0.1 default (Google 'good'); 0 to disable."]:
    "डिफ़ॉल्ट 0.1 (Google का 'अच्छा' मानक); बंद करने के लिए 0।",
  ['1 = unique, 5 = part of a 5-page near-duplicate group']:
    '1 = अद्वितीय, 5 = 5 पेजों के निकट-डुप्लिकेट समूह का हिस्सा',
  ['10 (default), 3 for very tight chains, 0 to remove the cap']:
    '10 (डिफ़ॉल्ट), बहुत सख्त चेन के लिए 3, सीमा हटाने के लिए 0',
  ['10 covers most sites; 3 limits crawls to top-of-funnel pages only.']:
    '10 अधिकांश साइटों को कवर करता है; 3 क्रॉल को केवल फ़नल के शीर्ष पेजों तक सीमित करता है।',
  ['100 default for most audits; 0 to disable the check.']:
    'अधिकांश ऑडिट के लिए डिफ़ॉल्ट 100; जाँच बंद करने के लिए 0।',
  ['100 default; 50 for tight on-page link discipline; 0 to disable the issue.']:
    'डिफ़ॉल्ट 100; सख्त ऑन-पेज लिंक अनुशासन के लिए 50; समस्या बंद करने के लिए 0।',
  ['1000000 (1M) for a full site audit; 5000 for spot checks.']:
    'पूरी साइट के ऑडिट के लिए 1000000 (1M); त्वरित जाँच के लिए 5000।',
  ['1024 (1 MB) default; 150 for a lean HTML budget; 0 to disable.']:
    'डिफ़ॉल्ट 1024 (1 MB); हल्के HTML बजट के लिए 150; बंद करने के लिए 0।',
  ['1048576 (1 MB) default; 524288 (512 KB) on tight disks; 0 to disable truncation entirely.']:
    'डिफ़ॉल्ट 1048576 (1 MB); कम डिस्क पर 524288 (512 KB); कटौती पूरी तरह बंद करने के लिए 0।',
  ['10485760 (10 MB) on bandwidth-tight crawls; 0 to download anything.']:
    'सीमित बैंडविड्थ वाले क्रॉल पर 10485760 (10 MB); कुछ भी डाउनलोड करने के लिए 0।',
  ['1366 = standard laptop, 1920 = full HD desktop, 375 = iPhone width.']:
    '1366 = मानक लैपटॉप, 1920 = फ़ुल HD डेस्कटॉप, 375 = iPhone की चौड़ाई।',
  ['2 default; 0 to record errors immediately without retrying; 5 for unreliable upstreams.']:
    'डिफ़ॉल्ट 2; बिना पुनः प्रयास तुरंत त्रुटि दर्ज करने के लिए 0; अविश्वसनीय अपस्ट्रीम के लिए 5।',
  ['20 default; 50 on fast first-party servers; 5 if the site rate-limits or returns 429s.']:
    'डिफ़ॉल्ट 20; तेज़ अपने सर्वरों पर 50; साइट दर सीमित करे या 429 लौटाए तो 5।',
  ['20 for typical sites; 5 to be polite on shared hosting; 60+ when crawling your own infra.']:
    'सामान्य साइटों के लिए 20; साझा होस्टिंग पर विनम्र रहने के लिए 5; अपना इंफ्रास्ट्रक्चर क्रॉल करते समय 60+।',
  ['20000 (20 s) for typical use; 5000 for fast spot checks; 60000 for slow APIs.']:
    'सामान्य उपयोग के लिए 20000 (20 सेकंड); तेज़ जाँच के लिए 5000; धीमे API के लिए 60000।',
  ['2048 (≈2 GB) on a 4 GB laptop; 8192 on a 16 GB workstation; 0 to disable.']:
    '4 GB लैपटॉप पर 2048 (≈2 GB); 16 GB वर्कस्टेशन पर 8192; बंद करने के लिए 0।',
  ['2048 default (RFC-suggested practical ceiling).']:
    'डिफ़ॉल्ट 2048 (RFC द्वारा सुझाई व्यावहारिक सीमा)।',
  ["2500 default (Google 'good'); 0 to disable."]:
    "डिफ़ॉल्ट 2500 (Google का 'अच्छा' मानक); बंद करने के लिए 0।",
  ['3 = recommended; 5 catches looser duplicates (templated content with light variation); 0 turns the post-crawl pass off.']:
    '3 = अनुशंसित; 5 ढीले डुप्लिकेट पकड़ता है (हल्के बदलाव वाली टेम्पलेट सामग्री); 0 क्रॉल के बाद वाला चरण बंद करता है।',
  ['4 default; 6 on documentation sites with deep TOC trees; 0 to disable.']:
    'डिफ़ॉल्ट 4; गहरे TOC ट्री वाली दस्तावेज़ साइटों पर 6; बंद करने के लिए 0।',
  ['500 default. Bump to 2000 when retrying against a flaky API.']:
    'डिफ़ॉल्ट 500। अस्थिर API पर पुनः प्रयास करते समय 2000 करें।',
  ['50000 keeps RAM bounded during big sitemap fan-outs; 0 for typical crawls.']:
    '50000 बड़े साइटमैप विस्तार के दौरान RAM सीमित रखता है; सामान्य क्रॉल के लिए 0।',
  ['60000 (1 minute) for huge resources; 0 to rely solely on the fetch timeout.']:
    'विशाल संसाधनों के लिए 60000 (1 मिनट); केवल फ़ेच टाइमआउट पर निर्भर रहने के लिए 0।',
  ['64-bit SimHash + LSH bucketing + Union-Find clustering on body shingles. Most expensive pass — typical 5–10 s on a 100k crawl.']:
    'बॉडी शिंगल्स पर 64-बिट SimHash + LSH बकेटिंग + Union-Find क्लस्टरिंग। सबसे महँगा चरण — 100k क्रॉल पर आमतौर पर 5–10 सेकंड।',
  ['768 = standard laptop, 1080 = full HD desktop, 667 = iPhone 8 height.']:
    '768 = मानक लैपटॉप, 1080 = फ़ुल HD डेस्कटॉप, 667 = iPhone 8 की ऊँचाई।',
  ['800 default; 200 for CDN-backed static; 0 to disable.']:
    'डिफ़ॉल्ट 800; CDN-आधारित स्टैटिक के लिए 200; बंद करने के लिए 0।',
  ['Aborts @font-face / Google Fonts / WOFF2 requests. FOUT visible but text still renders.']:
    '@font-face / Google Fonts / WOFF2 अनुरोध रोकता है। FOUT दिखता है पर टेक्स्ट फिर भी रेंडर होता है।',
  ['Aborts <img>, <picture>, background-image requests. Recommended for SEO crawls — image metadata still comes from <img> tag attributes.']:
    '<img>, <picture>, background-image अनुरोध रोकता है। SEO क्रॉल के लिए अनुशंसित — छवि मेटाडेटा फिर भी <img> टैग एट्रिब्यूट से आता है।',
  ['Aborts <video> / <audio> sources. Page DOM still includes the <video> tag.']:
    '<video> / <audio> स्रोत रोकता है। पेज DOM में <video> टैग फिर भी रहता है।',
  ['Aborts all <script> requests. This defeats the purpose of JS rendering — use Text Only mode instead.']:
    'सभी <script> अनुरोध रोकता है। इससे JS रेंडरिंग का उद्देश्य ही खत्म हो जाता है — इसके बजाय केवल-टेक्स्ट मोड इस्तेमाल करें।',
  ['Aborts external CSS. Inline styles still load. WARNING: many SPAs use CSS-driven visibility / lazy classes — blocking CSS may hide content that JS depends on.']:
    'बाहरी CSS रोकता है। इनलाइन स्टाइल फिर भी लोड होते हैं। चेतावनी: कई SPA CSS-आधारित दृश्यता / lazy क्लास इस्तेमाल करते हैं — CSS रोकने से वह सामग्री छिप सकती है जिस पर JS निर्भर है।',
  ['Aborts requests whose total lifetime (connect + headers + body) exceeds this. Distinct from `requestTimeoutMs` which is the headers timeout. Useful for capping individual slow pages without lowering the overall fetch timeout.']:
    'उन अनुरोधों को रोकता है जिनका कुल समय (कनेक्शन + हेडर + बॉडी) इससे अधिक हो। `requestTimeoutMs` से अलग, जो हेडर टाइमआउट है। समग्र फ़ेच टाइमआउट घटाए बिना अलग-अलग धीमे पेजों को सीमित करने के लिए उपयोगी।',
  ['Absolute redirect target parsed from the meta-refresh content. Empty when meta-refresh sets only a delay.']:
    'meta-refresh content से निकाला गया पूर्ण रीडायरेक्ट लक्ष्य। meta-refresh केवल विलंब सेट करे तो खाली।',
  ['Literal target of a JavaScript redirect found in an inline script (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Followed when "Follow JavaScript redirects" is on.']:
    'इनलाइन स्क्रिप्ट में मिले JavaScript रीडायरेक्ट का शाब्दिक लक्ष्य (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`)। "JavaScript रीडायरेक्ट फ़ॉलो करें" चालू होने पर फ़ॉलो किया जाता है।',
  ['Additional time to wait after the chosen wait condition fires, for SPA hydration / late XHRs. 0 = no extra wait. Bounded by the request timeout.']:
    'चुनी गई प्रतीक्षा शर्त पूरी होने के बाद SPA हाइड्रेशन / देर से आने वाले XHR के लिए अतिरिक्त प्रतीक्षा समय। 0 = कोई अतिरिक्त प्रतीक्षा नहीं। अनुरोध टाइमआउट से सीमित।',
  ['Anchor text of the broken link as rendered in the source page.']:
    'टूटे लिंक का एंकर टेक्स्ट, जैसा स्रोत पेज में रेंडर हुआ है।',
  ['Audits the rendered DOM for WCAG AA colour-contrast failures (4.5:1 normal text, 3:1 large text) and stylesheet rules that suppress the keyboard focus outline without a :focus-visible fallback. Surfaces the Low-Contrast Text and Focus Outline Suppressed issue filters.']:
    'रेंडर किए गए DOM का WCAG AA रंग-कंट्रास्ट विफलताओं (सामान्य टेक्स्ट 4.5:1, बड़ा टेक्स्ट 3:1) और :focus-visible विकल्प के बिना कीबोर्ड फ़ोकस आउटलाइन दबाने वाले स्टाइलशीट नियमों के लिए ऑडिट करता है। कम-कंट्रास्ट टेक्स्ट और फ़ोकस आउटलाइन दबाई गई समस्या फ़िल्टर को डेटा देता है।',
  ['basic/digest for /staging behind nginx; bearer for protected APIs']:
    'nginx के पीछे /staging के लिए basic/digest; सुरक्षित API के लिए bearer',
  ['Below Normal while you keep working in other apps; Idle for overnight unattended runs.']:
    "अन्य ऐप्स में काम जारी रखते समय 'सामान्य से नीचे'; रात भर बिना निगरानी चलाने के लिए 'निष्क्रिय'।",
  ['BFS click depth from the start URL. Start URL = 0; its outlinks = 1; etc. High depth often correlates with low importance.']:
    'शुरुआती URL से BFS क्लिक गहराई। शुरुआती URL = 0; उसके आउटलिंक = 1; आदि। अधिक गहराई अक्सर कम महत्व से जुड़ी होती है।',
  ['Bodies over this are truncated and flagged. 1 MB covers the 99.9th percentile of HTML pages without letting one adversarial 50 MB page bloat the project file.']:
    'इससे बड़ी बॉडी काटी और चिह्नित की जाती हैं। 1 MB HTML पेजों के 99.9वें पर्सेंटाइल को कवर करता है, बिना किसी दुर्भावनापूर्ण 50 MB पेज को प्रोजेक्ट फ़ाइल फुलाने दिए।',
  ['Buy Affordable Game Keys | Example Store']: 'किफ़ायती गेम कीज़ खरीदें | उदाहरण स्टोर',
  ['Character count of the first H1.']: 'पहले H1 की अक्षर संख्या।',
  ['Character count of the meta description. Recommended: 70–155 characters; over 155 risks truncation.']:
    'मेटा विवरण की अक्षर संख्या। अनुशंसित: 70–155 अक्षर; 155 से अधिक पर कटने का जोखिम।',
  ['Character count of the title. Recommended: 30–60 characters; over 60 risks truncation in SERPs.']:
    'शीर्षक की अक्षर संख्या। अनुशंसित: 30–60 अक्षर; 60 से अधिक पर SERP में कटने का जोखिम।',
  ['Charikar 64-bit SimHash of body shingles. Used by the post-crawl near-duplicate clustering pass. Two SimHashes within the configured Hamming threshold are considered similar.']:
    'बॉडी शिंगल्स का Charikar 64-बिट SimHash। क्रॉल के बाद के निकट-डुप्लिकेट क्लस्टरिंग चरण द्वारा उपयोग होता है। कॉन्फ़िगर की गई Hamming सीमा के भीतर दो SimHash समान माने जाते हैं।',
  ['Coarse content classification derived from URL extension and Content-Type header.']:
    'URL एक्सटेंशन और Content-Type हेडर से निकाला गया मोटा सामग्री वर्गीकरण।',
  ['Comma-joined sorted unique JSON-LD `@type` values declared on the page (Article, BreadcrumbList, Product, …).']:
    'पेज पर घोषित अद्वितीय JSON-LD `@type` मान, क्रमबद्ध और अल्पविराम से जुड़े (Article, BreadcrumbList, Product, …)।',
  ['Contents of the first <meta name="description"> tag. May be used as the SERP snippet.']:
    'पहले <meta name="description"> टैग की सामग्री। SERP स्निपेट के रूप में इस्तेमाल हो सकती है।',
  ['Contents of the first <meta name="robots"> tag. Controls per-page indexing/following behaviour.']:
    'पहले <meta name="robots"> टैग की सामग्री। प्रति-पेज इंडेक्सिंग/फ़ॉलोइंग व्यवहार नियंत्रित करती है।',
  ['Contents of the first <title> element. Google primarily uses this in SERP titles.']:
    'पहले <title> तत्व की सामग्री। Google इसे मुख्यतः SERP शीर्षकों में इस्तेमाल करता है।',
  ['Counts how many internal pages link to each URL. Drives the Most-Linked URLs report and the per-row Inlinks column.']:
    'गिनता है कि कितने आंतरिक पेज हर URL से लिंक करते हैं। सबसे अधिक लिंक किए गए URL रिपोर्ट और प्रति-पंक्ति इनलिंक कॉलम को डेटा देता है।',
  ["Crawl 3xx redirect targets. Each hop is its own row; the chain is reconstructed in the Response Codes view. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced)."]:
    "3xx रीडायरेक्ट लक्ष्यों को क्रॉल करें। हर हॉप अपनी अलग पंक्ति है; चेन 'प्रतिक्रिया कोड' दृश्य में पुनर्निर्मित होती है। Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced)।",
  ['Crawler RSS auto-pauses the queue when this is exceeded; resumes once memory drops to 80% of the cap. Soft cap — does not enforce a hard heap limit.']:
    'इससे अधिक होने पर क्रॉलर RSS कतार को स्वतः रोक देता है; मेमोरी सीमा के 80% पर आने पर फिर शुरू करता है। नरम सीमा — कठोर हीप सीमा लागू नहीं करता।',
  ['css for selectors, regex for free-form patterns']:
    'सेलेक्टर के लिए css, मुक्त-रूप पैटर्न के लिए regex',
  ["CSS selector that pins the duplicate-fingerprint text extraction to a specific page region. When set, the heuristic (main / role=main / article / body-minus-chrome) is bypassed and the selector wins. Useful on sites where the heuristic misclassifies — e.g. CMSes that wrap navigation inside `<main>` or sites with no semantic landmarks at all. Empty = use the heuristic. Invalid selectors silently fall back to the heuristic so a typo doesn't break the crawl."]:
    'CSS सेलेक्टर जो डुप्लिकेट-फ़िंगरप्रिंट टेक्स्ट निष्कर्षण को पेज के किसी विशिष्ट क्षेत्र तक सीमित करता है। सेट होने पर ह्यूरिस्टिक (main / role=main / article / body-minus-chrome) छोड़ दी जाती है और सेलेक्टर प्राथमिकता पाता है। उन साइटों पर उपयोगी जहाँ ह्यूरिस्टिक गलत वर्गीकरण करती है — जैसे CMS जो नेविगेशन को `<main>` के अंदर लपेटते हैं या जिनमें कोई सिमेंटिक लैंडमार्क ही नहीं। खाली = ह्यूरिस्टिक इस्तेमाल करें। अमान्य सेलेक्टर चुपचाप ह्यूरिस्टिक पर लौट जाते हैं ताकि एक टाइपो क्रॉल न तोड़े।',
  ["Cumulative Layout Shift from PageSpeed Insights, when present. Google's 'good' CLS threshold is 0.1. Unitless; accepts decimals. Pages without PSI data are never flagged."]:
    "PageSpeed Insights से Cumulative Layout Shift, जब उपलब्ध हो। Google का 'अच्छा' CLS मानक 0.1 है। इकाई-रहित; दशमलव स्वीकार करता है। PSI डेटा के बिना पेज कभी चिह्नित नहीं होते।",
  ['Drives the View Source detail tab. ~30–200 KB on disk per HTML page; turn off if you only need metadata and not full source viewing.']:
    "'स्रोत देखें' विवरण टैब को डेटा देता है। प्रति HTML पेज डिस्क पर ~30–200 KB; यदि केवल मेटाडेटा चाहिए और पूरा स्रोत देखना नहीं, तो बंद करें।",
  ["Each rule runs JavaScript RegExp.replace on the fully-normalised URL. Flags default to 'g'. After all rules run, the result is re-parsed as a URL — if the rewrite produces an invalid URL, the link is dropped at normalisation time."]:
    "हर नियम पूरी तरह सामान्यीकृत URL पर JavaScript RegExp.replace चलाता है। फ़्लैग डिफ़ॉल्ट रूप से 'g'। सभी नियम चलने के बाद परिणाम को फिर URL के रूप में पार्स किया जाता है — यदि पुनर्लेखन अमान्य URL बनाए, तो लिंक सामान्यीकरण के समय हटा दिया जाता है।",
  ["Empty = safest. 'chrome' if you want the same Chrome version your users see."]:
    "खाली = सबसे सुरक्षित। यदि आप वही Chrome संस्करण चाहते हैं जो आपके उपयोगकर्ता देखते हैं तो 'chrome'।",
  ["Empty = use the bundled Playwright Chromium build (recommended — pinned version, works everywhere). 'chrome' / 'msedge' uses the system-installed browser. Beta channels for testing newer features."]:
    "खाली = Playwright के साथ बंडल Chromium बिल्ड इस्तेमाल करें (अनुशंसित — निश्चित संस्करण, हर जगह चलता है)। 'chrome' / 'msedge' सिस्टम में इंस्टॉल ब्राउज़र इस्तेमाल करता है। नई सुविधाएँ परखने के लिए बीटा चैनल।",
  ["Fetch internal <img> resources (incl. srcset / <picture> sources) so they appear in the Internal tab with their own status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl)."]:
    "आंतरिक <img> संसाधन (srcset / <picture> स्रोत सहित) फ़ेच करें ताकि वे अपने स्टेटस कोड, कंटेंट टाइप और आकार के साथ 'आंतरिक' टैब में दिखें। हर एक अधिकतम URL में गिना जाता है। Screaming Frog: 'Check Images' (Configuration → Spider → Crawl)।",
  ["Fetch internal <link rel=stylesheet> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl)."]:
    "आंतरिक <link rel=stylesheet> संसाधन फ़ेच करें ताकि वे स्टेटस कोड, कंटेंट टाइप और आकार के साथ 'आंतरिक' टैब में दिखें। हर एक अधिकतम URL में गिना जाता है। Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl)।",
  ["Fetch internal <script src> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl)."]:
    "आंतरिक <script src> संसाधन फ़ेच करें ताकि वे स्टेटस कोड, कंटेंट टाइप और आकार के साथ 'आंतरिक' टैब में दिखें। हर एक अधिकतम URL में गिना जाता है। Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl)।",
  ["Fetches /robots.txt sitemap directives + /sitemap.xml fallbacks. Powers the 'Non-Indexable in Sitemap' issue filter. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl)."]:
    "/robots.txt के sitemap निर्देश + /sitemap.xml विकल्प फ़ेच करता है। 'साइटमैप में गैर-इंडेक्स योग्य' समस्या फ़िल्टर को डेटा देता है। Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl)।",
  ["first/last for single value, all for JSON array, concat for ' | ' joined string"]:
    "एकल मान के लिए first/last, JSON ऐरे के लिए all, ' | ' से जुड़ी स्ट्रिंग के लिए concat",
  ['FNV-1a 64-bit hash of the normalised body token stream. Two pages sharing this hash are byte-identical post-tokenisation — the basis of the Exact Duplicate filter.']:
    "सामान्यीकृत बॉडी टोकन स्ट्रीम का FNV-1a 64-बिट हैश। यह हैश साझा करने वाले दो पेज टोकनाइज़ेशन के बाद बाइट-दर-बाइट समान हैं — 'सटीक डुप्लिकेट' फ़िल्टर का आधार।",
  ['For Basic, sent base64-encoded; for Digest, hashed into the challenge response.']:
    'Basic के लिए base64-एन्कोड करके भेजा जाता है; Digest के लिए चैलेंज रिस्पॉन्स में हैश किया जाता है।',
  ['For regex: `regex_group` extracts capture group 1; otherwise the whole match is used.']:
    'regex के लिए: `regex_group` कैप्चर ग्रुप 1 निकालता है; अन्यथा पूरा मिलान इस्तेमाल होता है।',
  ['Full-page renders the entire scrollable canvas; Above-the-fold captures just the initial viewport (cheaper). Both writes two PNGs per URL.']:
    'पूरा पेज पूरे स्क्रॉल योग्य कैनवास को रेंडर करता है; Above-the-fold केवल शुरुआती व्यूपोर्ट कैप्चर करता है (सस्ता)। दोनों प्रति URL दो PNG लिखते हैं।',
  ['Google\'s index status, pulled from the URL Inspection API — not the Fetch button. Click "Inspect (top 100)" to fill this column; Fetch only pulls clicks / impressions / position.']:
    'Google की इंडेक्स स्थिति, URL Inspection API से ली गई — फ़ेच बटन से नहीं। यह कॉलम भरने के लिए "निरीक्षण (शीर्ष 100)" क्लिक करें; फ़ेच केवल क्लिक / इंप्रेशन / स्थिति लाता है।',
  ["Googlebot — Smartphone matches Google's mobile-first indexing crawler."]:
    'Googlebot — Smartphone Google के मोबाइल-फ़र्स्ट इंडेक्सिंग क्रॉलर से मेल खाता है।',
  ['Hard cap on pending URLs held in memory. Excess discoveries are dropped silently — bounds peak heap during fan-out bursts (big sitemaps, dense link graphs).']:
    'मेमोरी में रखे लंबित URL की कठोर सीमा। अतिरिक्त खोजें चुपचाप हटा दी जाती हैं — विस्तार के दौरान (बड़े साइटमैप, घने लिंक ग्राफ़) चरम हीप को सीमित करता है।',
  ['Hard cap on the number of 3xx hops we follow for a single chain. Each hop is recorded as its own URL row regardless. 0 disables the cap (chain still ends at `redirect_loop`).']:
    'एक चेन में फ़ॉलो किए जाने वाले 3xx हॉप्स की कठोर सीमा। हर हॉप फिर भी अपनी अलग URL पंक्ति के रूप में दर्ज होता है। 0 सीमा हटाता है (चेन फिर भी `redirect_loop` पर समाप्त होती है)।',
  ["Hard cap on total URLs crawled. The crawl stops as soon as this is reached. Screaming Frog: 'Limit Crawl Total'."]:
    "क्रॉल किए गए कुल URL की कठोर सीमा। यह पहुँचते ही क्रॉल रुक जाता है। Screaming Frog: 'Limit Crawl Total'।",
  ["Hard ceiling on requests per second across all workers combined. Equivalent to Screaming Frog's 'Max URL/s'. Acts as a token bucket — even with high concurrency the crawler waits between bursts to stay below this rate."]:
    "सभी वर्कर्स को मिलाकर प्रति सेकंड अनुरोधों की कठोर सीमा। Screaming Frog के 'Max URL/s' के बराबर। टोकन बकेट की तरह काम करता है — उच्च समांतरता पर भी क्रॉलर इस दर से नीचे रहने के लिए बर्स्ट के बीच प्रतीक्षा करता है।",
  ['Height attribute value (in pixels) declared on the <img> tag, when present.']:
    '<img> टैग पर घोषित height एट्रिब्यूट मान (पिक्सेल में), जब मौजूद हो।',
  ["Honor Disallow rules + crawl-delay declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "कॉन्फ़िगर किए गए User-Agent के लिए /robots.txt में घोषित Disallow नियम + crawl-delay का सम्मान करें। Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)।",
  ["Hop count from the start URL. Start URL is depth 0; its outlinks are depth 1, theirs depth 2, and so on. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits)."]:
    "शुरुआती URL से हॉप गिनती। शुरुआती URL गहराई 0 है; उसके आउटलिंक गहराई 1, उनके गहराई 2, और आगे भी। Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits)।",
  ['How many distinct pages reference this image. High values typically indicate site-wide assets (logos, icons).']:
    'कितने अलग पेज इस छवि का संदर्भ देते हैं। उच्च मान आमतौर पर साइट-व्यापी संपत्तियों (लोगो, आइकन) को दर्शाते हैं।',
  ["How to canonicalise paths with/without a trailing slash. 'Add' is file-extension aware — won't add a slash to /file.pdf or /image.png."]:
    "अंतिम स्लैश के साथ/बिना पथों को कैसे कैनोनिकल करें। 'जोड़ें' फ़ाइल एक्सटेंशन को पहचानता है — /file.pdf या /image.png में स्लैश नहीं जोड़ेगा।",
  ['HTML attribute name to read.']: 'पढ़ने के लिए HTML एट्रिब्यूट का नाम।',
  ['HTML transfer size of the page document. Heavy HTML payloads delay first paint. Stored as bytes internally; entered here in kilobytes.']:
    'पेज दस्तावेज़ का HTML ट्रांसफ़र आकार। भारी HTML पेलोड पहला पेंट विलंबित करते हैं। आंतरिक रूप से बाइट में संग्रहीत; यहाँ किलोबाइट में दर्ज करें।',
  ['HTTP `<img>` / `<video>` / `<audio>` / `<source>` references on an HTTPS page — rendered but the URL bar reads "Not Secure".']:
    'HTTPS पेज पर HTTP `<img>` / `<video>` / `<audio>` / `<source>` संदर्भ — रेंडर होते हैं पर एड्रेस बार "सुरक्षित नहीं" दिखाता है।',
  ['HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` references on an HTTPS page — browsers BLOCK these silently.']:
    'HTTPS पेज पर HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` संदर्भ — ब्राउज़र इन्हें चुपचाप ब्लॉक कर देते हैं।',
  ['HTTP response status code. Empty/Failed indicates a network error before any response was received.']:
    'HTTP प्रतिक्रिया स्टेटस कोड। खाली/विफल का अर्थ है कोई प्रतिक्रिया मिलने से पहले नेटवर्क त्रुटि।',
  ['HTTP status of the source page itself. Usually 200; if non-2xx the broken link may be inherited.']:
    'स्रोत पेज का अपना HTTP स्टेटस। आमतौर पर 200; यदि 2xx नहीं तो टूटा लिंक विरासत में मिला हो सकता है।',
  ['HTTP status returned by the target. 0 = network failure (DNS, TLS, timeout).']:
    'लक्ष्य द्वारा लौटाया गया HTTP स्टेटस। 0 = नेटवर्क विफलता (DNS, TLS, टाइमआउट)।',
  ["HTTP/HTTPS proxies route via undici's ProxyAgent; SOCKS proxies (socks5://, socks5h://, socks4://, socks4a://) tunnel via the socks client. The `h`/`4a` variants resolve DNS at the proxy. Leave empty to inherit HTTPS_PROXY/HTTP_PROXY env vars."]:
    'HTTP/HTTPS प्रॉक्सी undici के ProxyAgent से रूट होते हैं; SOCKS प्रॉक्सी (socks5://, socks5h://, socks4://, socks4a://) socks क्लाइंट से टनल होते हैं। `h`/`4a` वैरिएंट DNS प्रॉक्सी पर हल करते हैं। HTTPS_PROXY/HTTP_PROXY पर्यावरण चर विरासत में लेने के लिए खाली छोड़ें।',
  ["Identifies the largest element visible in the initial viewport (likely LCP candidate per Google's heuristic) and stores its CSS selector, dimensions, and resource URL. Useful for spotting unoptimised LCP images without a PSI API call."]:
    'शुरुआती व्यूपोर्ट में दिखने वाले सबसे बड़े तत्व (Google की ह्यूरिस्टिक के अनुसार संभावित LCP उम्मीदवार) की पहचान करता है और उसका CSS सेलेक्टर, आयाम और संसाधन URL संग्रहीत करता है। PSI API कॉल के बिना गैर-अनुकूलित LCP छवियाँ खोजने के लिए उपयोगी।',
  ['If set, Playwright waits for this CSS selector to appear in the DOM before extracting HTML. Overrides the extra-wait timeout when present. Useful when you know the SPA reveals a specific element after hydration.']:
    'सेट होने पर Playwright HTML निकालने से पहले इस CSS सेलेक्टर के DOM में आने की प्रतीक्षा करता है। मौजूद होने पर अतिरिक्त-प्रतीक्षा टाइमआउट को ओवरराइड करता है। तब उपयोगी जब आप जानते हों कि SPA हाइड्रेशन के बाद कोई खास तत्व दिखाता है।',
  ['Images on this page that have no alt attribute. WCAG accessibility issue + missed alt-as-anchor SEO opportunity.']:
    'इस पेज पर बिना alt एट्रिब्यूट वाली छवियाँ। WCAG पहुँच समस्या + alt-को-एंकर SEO अवसर चूका।',
  ['Indexable / Non-Indexable']: 'इंडेक्स योग्य / गैर-इंडेक्स योग्य',
  ['Internal PageRank, 0–100. Computed over the internal link graph (damping 0.85) and normalised so the most-linked page scores 100. Higher = more internal link equity.']:
    'आंतरिक PageRank, 0–100। आंतरिक लिंक ग्राफ़ पर गणना (डैम्पिंग 0.85) और ऐसे सामान्यीकृत कि सबसे अधिक लिंक किया पेज 100 पाए। अधिक = अधिक आंतरिक लिंक इक्विटी।',
  ['internal / external']: 'आंतरिक / बाहरी',
  ['JavaScript executed in every page BEFORE navigation begins (init script). Use to set localStorage / cookies / mock APIs / disable animations. Runs in page context — no Node access.']:
    'नेविगेशन शुरू होने से पहले हर पेज में चलने वाला JavaScript (init स्क्रिप्ट)। localStorage / cookies सेट करने / API मॉक करने / एनिमेशन बंद करने के लिए इस्तेमाल करें। पेज संदर्भ में चलता है — Node तक पहुँच नहीं।',
  ['JavaScript regex (no flags — /g is implicit). Use a capture group with `output=regex_group` to extract just part of the match.']:
    'JavaScript regex (कोई फ़्लैग नहीं — /g निहित है)। मिलान का केवल एक हिस्सा निकालने के लिए `output=regex_group` के साथ कैप्चर ग्रुप इस्तेमाल करें।',
  ['JavaScript regex tested against the full URL. Empty = all URLs allowed. URL must match at least one to be enqueued. The start URL is always permitted regardless.']:
    'पूरे URL पर परखा जाने वाला JavaScript regex। खाली = सभी URL अनुमत। कतार में आने के लिए URL को कम से कम एक से मेल खाना होगा। शुरुआती URL हमेशा अनुमत है।',
  ['JavaScript regex. Any match → URL is skipped, even if it would otherwise pass the include list. Common uses: skip admin areas, large file types, session-id query params.']:
    'JavaScript regex। कोई भी मिलान → URL छोड़ दिया जाता है, भले वह समावेश सूची पास करता। सामान्य उपयोग: एडमिन क्षेत्र, बड़े फ़ाइल प्रकार, सत्र-id क्वेरी पैरामीटर छोड़ना।',
  ['JSON map of `{ term: count }` literal-substring hits from the configured Custom Search terms.']:
    'कॉन्फ़िगर किए गए कस्टम सर्च शब्दों के शाब्दिक-सबस्ट्रिंग मिलानों का `{ term: count }` JSON मैप।',
  ['JSON-stringified array of `{ lang, href }` pairs. Heavy column — better consumed via the URL Details panel.']:
    '`{ lang, href }` जोड़ियों का JSON-स्ट्रिंग ऐरे। भारी कॉलम — URL विवरण पैनल से देखना बेहतर।',
  ['JSON-stringified custom-extraction results map. Heavy column — render verbatim, easier to read in the URL Details panel.']:
    'JSON-स्ट्रिंग कस्टम-निष्कर्षण परिणाम मैप। भारी कॉलम — ज्यों का त्यों दिखाया जाता है, URL विवरण पैनल में पढ़ना आसान।',
  ['JSONPath against a JSON response body (e.g. `application/json` APIs). Only runs on responses that parse as JSON — ignored on HTML pages.']:
    'JSON प्रतिक्रिया बॉडी (जैसे `application/json` API) पर JSONPath। केवल उन प्रतिक्रियाओं पर चलता है जो JSON के रूप में पार्स हों — HTML पेजों पर अनदेखा।',
  ['JSONPath returns the matched JSON value as-is; choose `Count` to return the number of matches instead.']:
    'JSONPath मिलान वाला JSON मान ज्यों का त्यों लौटाता है; इसके बजाय मिलानों की संख्या लौटाने के लिए `Count` चुनें।',
  ["Largest Contentful Paint from PageSpeed Insights lab data, when the URL has been audited. Google's 'good' LCP threshold is 2500 ms. Pages without PSI data are never flagged on this metric."]:
    "PageSpeed Insights लैब डेटा से Largest Contentful Paint, जब URL ऑडिट हुआ हो। Google का 'अच्छा' LCP मानक 2500 ms है। PSI डेटा के बिना पेज इस मीट्रिक पर कभी चिह्नित नहीं होते।",
  ['load = good default. networkidle for heavy SPAs. domcontentloaded if you only need raw HTML.']:
    'load = अच्छा डिफ़ॉल्ट। भारी SPA के लिए networkidle। केवल कच्चा HTML चाहिए तो domcontentloaded।',
  ['Location header value when status is 3xx. The URL the server points to next; chain length is in the URL Details panel.']:
    'स्टेटस 3xx होने पर Location हेडर का मान। वह URL जिस पर सर्वर आगे भेजता है; चेन की लंबाई URL विवरण पैनल में है।',
  ['Lowercases the URL path component. Host is already case-insensitive per the URL spec, so this only affects the path.']:
    'URL के पथ भाग को लोअरकेस करता है। URL विनिर्देश के अनुसार होस्ट पहले से केस-असंवेदनशील है, इसलिए यह केवल पथ को प्रभावित करता है।',
  ['Near-duplicate cluster ID assigned by the post-crawl SimHash pass. 0 = singleton (no near-duplicates within the configured Hamming threshold). Pages sharing a non-zero cluster ID are mutually similar.']:
    'क्रॉल के बाद SimHash चरण द्वारा दी गई निकट-डुप्लिकेट क्लस्टर ID। 0 = अकेला (कॉन्फ़िगर की गई Hamming सीमा में कोई निकट-डुप्लिकेट नहीं)। गैर-शून्य क्लस्टर ID साझा करने वाले पेज परस्पर समान हैं।',
  ['noindex, canonicalised, redirected, blocked-by-robots']:
    'noindex, कैनोनिकल किया गया, रीडायरेक्ट किया गया, robots द्वारा अवरुद्ध',
  ['None for fastest crawl. Above-the-fold for SERP-thumbnail-style preview. Full page when you need long-page snapshots.']:
    'सबसे तेज़ क्रॉल के लिए कोई नहीं। SERP-थंबनेल शैली पूर्वावलोकन के लिए Above-the-fold। लंबे पेज के स्नैपशॉट चाहिए तो पूरा पेज।',
  ['Number of `<form action="http://…">` declarations on an HTTPS page. Submitting one downgrades the connection.']:
    'HTTPS पेज पर `<form action="http://…">` घोषणाओं की संख्या। इनमें से एक सबमिट करने से कनेक्शन डाउनग्रेड होता है।',
  ['Number of `<link rel="alternate" hreflang>` entries declared on this page. 0 = no alternates declared.']:
    'इस पेज पर घोषित `<link rel="alternate" hreflang>` प्रविष्टियों की संख्या। 0 = कोई विकल्प घोषित नहीं।',
  ['Number of `<link rel="canonical">` tags on the page. >1 is a "Multiple Canonicals" issue.']:
    'पेज पर `<link rel="canonical">` टैग की संख्या। >1 एक "एकाधिक कैनोनिकल" समस्या है।',
  ['Number of `<script type="application/ld+json">` blocks parsed successfully on the page.']:
    'पेज पर सफलतापूर्वक पार्स हुए `<script type="application/ld+json">` ब्लॉक की संख्या।',
  ['Number of `<script type="application/ld+json">` blocks that failed to parse as JSON.']:
    'JSON के रूप में पार्स न हो सके `<script type="application/ld+json">` ब्लॉक की संख्या।',
  ['Number of <img> elements on the page.']: 'पेज पर <img> तत्वों की संख्या।',
  ['Number of browser tabs the pool keeps warm in parallel. 0 = auto (matches crawler concurrency, capped at 8). More tabs = faster crawl but more RAM (each tab ~80–150 MB).']:
    'पूल द्वारा समानांतर तैयार रखे गए ब्राउज़र टैब की संख्या। 0 = स्वचालित (क्रॉलर समांतरता के बराबर, अधिकतम 8)। अधिक टैब = तेज़ क्रॉल पर अधिक RAM (प्रति टैब ~80–150 MB)।',
  ['Number of hreflang targets that are non-200, noindex, or canonicalised away. Aggregated by the post-crawl pass.']:
    'गैर-200, noindex, या कहीं और कैनोनिकल किए गए hreflang लक्ष्यों की संख्या। क्रॉल के बाद के चरण द्वारा समेकित।',
  ["Number of HTTP requests in flight at any one time. Equivalent to Screaming Frog's 'Max Threads'. Higher = faster crawl + more load on the target server."]:
    "किसी भी समय चल रहे HTTP अनुरोधों की संख्या। Screaming Frog के 'Max Threads' के बराबर। अधिक = तेज़ क्रॉल + लक्ष्य सर्वर पर अधिक भार।",
  ['Number of internal `<a>` elements with no usable anchor text or alt — accessibility / SEO regression.']:
    'बिना उपयोगी एंकर टेक्स्ट या alt वाले आंतरिक `<a>` तत्वों की संख्या — पहुँच / SEO में गिरावट।',
  ['Number of internal pages that link to this URL. A rough internal-PageRank signal.']:
    'इस URL से लिंक करने वाले आंतरिक पेजों की संख्या। आंतरिक PageRank का मोटा संकेत।',
  ["Number of pages in this URL's near-duplicate cluster (1 = no duplicates, ≥2 = part of a duplicate group). Tunable via Settings → Duplicates."]:
    'इस URL के निकट-डुप्लिकेट क्लस्टर में पेजों की संख्या (1 = कोई डुप्लिकेट नहीं, ≥2 = डुप्लिकेट समूह का हिस्सा)। सेटिंग्स → डुप्लिकेट में समायोज्य।',
  ['Number of redirect hops from this URL to its terminal target. Filled by the post-crawl `recomputeRedirectChains` walker. >3 trips the "Long Chain" issue.']:
    'इस URL से उसके अंतिम लक्ष्य तक रीडायरेक्ट हॉप्स की संख्या। क्रॉल के बाद `recomputeRedirectChains` वॉकर द्वारा भरी जाती है। >3 पर "लंबी चेन" समस्या उठती है।',
  ['Number of unique <a> links emitted from this page (internal + external).']:
    'इस पेज से निकलने वाले अद्वितीय <a> लिंक की संख्या (आंतरिक + बाहरी)।',
  ['Off — only enable for testing edge cases.']: 'बंद — केवल एज केस परखने के लिए चालू करें।',
  ['Off — small speed gain not worth the fidelity loss.']:
    'बंद — गति में छोटा लाभ सटीकता की हानि के लायक नहीं।',
  ['On — fonts add overhead without changing SEO output.']:
    'चालू — फ़ॉन्ट SEO आउटपुट बदले बिना ओवरहेड बढ़ाते हैं।',
  ['On (default) — cheap I/O, high SEO value.']: 'चालू (डिफ़ॉल्ट) — सस्ता I/O, उच्च SEO मूल्य।',
  ['On (default) — media is heavy and rarely SEO-relevant.']:
    'चालू (डिफ़ॉल्ट) — मीडिया भारी है और शायद ही SEO-प्रासंगिक।',
  ['On (default) so the Internal tab shows images, not just HTML; off for HTML-only crawls.']:
    "चालू (डिफ़ॉल्ट) ताकि 'आंतरिक' टैब केवल HTML नहीं, छवियाँ भी दिखाए; केवल-HTML क्रॉल के लिए बंद।",
  ['On (default); off for HTML-only crawls.']: 'चालू (डिफ़ॉल्ट); केवल-HTML क्रॉल के लिए बंद।',
  ['On (default). Off only when crawling sites you own and need to bypass.']:
    'चालू (डिफ़ॉल्ट)। केवल तब बंद करें जब अपनी साइटें क्रॉल कर रहे हों और बाईपास करना ज़रूरी हो।',
  ['On for accessibility / WCAG audits.']: 'पहुँच / WCAG ऑडिट के लिए चालू।',
  ['On for max speed. Off if you need LCP candidate detection or visual screenshots later.']:
    'अधिकतम गति के लिए चालू। बाद में LCP उम्मीदवार पहचान या विज़ुअल स्क्रीनशॉट चाहिए तो बंद।',
  ['On for modern sites that 301 http→https anyway; off for legacy intranet.']:
    'आधुनिक साइटों के लिए चालू जो वैसे भी http→https 301 करती हैं; पुराने इंट्रानेट के लिए बंद।',
  ['On for normal audits; off when you only want to inspect raw 3xx behaviour.']:
    'सामान्य ऑडिट के लिए चालू; केवल कच्चा 3xx व्यवहार देखना हो तो बंद।',
  ['On for outbound link audits; off for fast internal-only crawls.']:
    'आउटबाउंड लिंक ऑडिट के लिए चालू; तेज़ केवल-आंतरिक क्रॉल के लिए बंद।',
  ['On for performance-focused audits that should fail pages over a target.']:
    'प्रदर्शन-केंद्रित ऑडिट के लिए चालू जिनमें लक्ष्य से ऊपर के पेज विफल माने जाएँ।',
  ['On for performance-focused audits.']: 'प्रदर्शन-केंद्रित ऑडिट के लिए चालू।',
  ['On for production crawls. Off when debugging selector-not-found / hydration issues.']:
    'प्रोडक्शन क्रॉल के लिए चालू। सेलेक्टर-न-मिला / हाइड्रेशन समस्याएँ डीबग करते समय बंद।',
  ['ON for SEO audits (the typical case). Turn OFF to also cluster paginated / canonical-blocked variants for completeness.']:
    'SEO ऑडिट (सामान्य स्थिति) के लिए चालू। पूर्णता के लिए पेजिनेटेड / कैनोनिकल-अवरुद्ध वैरिएंट भी क्लस्टर करने हेतु बंद करें।',
  ["On for SEO audits that include Google's Mobile-Friendly checks."]:
    'Google की मोबाइल-फ़्रेंडली जाँच शामिल करने वाले SEO ऑडिट के लिए चालू।',
  ['On for SEO audits where View Source matters; off for 1M-URL crawls where disk is tight.']:
    "जहाँ 'स्रोत देखें' मायने रखता है उन SEO ऑडिट के लिए चालू; कम डिस्क वाले 1M-URL क्रॉल के लिए बंद।",
  ['ON for SEO audits. OFF only when you specifically need to inspect raw-URL collisions (e.g. case-sensitive filesystem CMSes).']:
    'SEO ऑडिट के लिए चालू। केवल तब बंद करें जब विशेष रूप से कच्चे-URL टकराव देखने हों (जैसे केस-संवेदनशील फ़ाइल सिस्टम वाले CMS)।',
  ['On if you need nofollow attribute audits; off keeps the link graph cleaner.']:
    'nofollow एट्रिब्यूट ऑडिट चाहिए तो चालू; बंद रखने से लिंक ग्राफ़ साफ़ रहता है।',
  ['On if your CMS serves the same page at mixed casing (/Foo and /foo).']:
    'यदि आपका CMS एक ही पेज मिश्रित केस में परोसता है (/Foo और /foo) तो चालू।',
  ['On if your site canonicalises to non-www but emits www links somewhere.']:
    'यदि आपकी साइट गैर-www पर कैनोनिकल करती है पर कहीं www लिंक निकालती है तो चालू।',
  ["On network errors, 408/425/429/5xx responses, retry up to N more times before giving up. Each retry counts toward the URL's response time budget."]:
    'नेटवर्क त्रुटियों और 408/425/429/5xx प्रतिक्रियाओं पर हार मानने से पहले N बार और पुनः प्रयास करें। हर पुनः प्रयास URL के प्रतिक्रिया समय बजट में गिना जाता है।',
  ['On when auditing mobile UX or capturing PageSpeed-style mobile previews.']:
    'मोबाइल UX ऑडिट या PageSpeed-शैली मोबाइल पूर्वावलोकन कैप्चर करते समय चालू।',
  ["One header per line in 'Key: Value' format. Added to every request — useful for auth tokens or custom routing hints. User values override defaults when keys collide."]:
    "'Key: Value' प्रारूप में प्रति पंक्ति एक हेडर। हर अनुरोध में जोड़ा जाता है — प्रमाणीकरण टोकन या कस्टम रूटिंग संकेतों के लिए उपयोगी। कुंजियाँ टकराने पर उपयोगकर्ता मान डिफ़ॉल्ट को ओवरराइड करते हैं।",
  ['One sitemap URL per line. On top of following links from the start URL, the crawler fetches these sitemaps and queues every page they list as an extra seed — faster/more complete discovery, and reliable orphan detection even when the sitemap lives at a non-standard path. Leave empty to disable.']:
    'प्रति पंक्ति एक साइटमैप URL। शुरुआती URL से लिंक फ़ॉलो करने के अलावा क्रॉलर ये साइटमैप फ़ेच करता है और उनमें सूचीबद्ध हर पेज को अतिरिक्त सीड के रूप में कतार में डालता है — तेज़/अधिक पूर्ण खोज, और साइटमैप गैर-मानक पथ पर हो तब भी विश्वसनीय अनाथ पहचान। बंद करने के लिए खाली छोड़ें।',
  ['One URL per line. Each is fetched exactly once; outlinks are NOT followed. Comments starting with # are ignored.']:
    'प्रति पंक्ति एक URL। हर एक ठीक एक बार फ़ेच होता है; आउटलिंक फ़ॉलो नहीं किए जाते। # से शुरू होने वाली टिप्पणियाँ अनदेखी की जाती हैं।',
  ['OS scheduler hint applied at crawl start. Lowering priority lets the rest of the machine stay responsive during heavy crawls. May require elevated privileges on some platforms.']:
    'क्रॉल शुरू होने पर लागू OS शेड्यूलर संकेत। प्राथमिकता घटाने से भारी क्रॉल के दौरान बाकी मशीन उत्तरदायी रहती है। कुछ प्लेटफ़ॉर्म पर उन्नत अनुमतियाँ चाहिए हो सकती हैं।',
  ["Page A→B declared but B→A absent flags 'Reciprocity Missing'; same lang on two hrefs flags 'Inconsistent Lang'."]:
    "पेज A→B घोषित पर B→A अनुपस्थित 'पारस्परिकता अनुपस्थित' चिह्नित करता है; दो href पर एक ही lang 'असंगत lang' चिह्नित करता है।",
  ['Page that contains the broken link.']: 'वह पेज जिसमें टूटा लिंक है।',
  ["Pages with > this many outgoing links (internal + external) trip the 'Total Links per Page' issue. Google's historic recommendation is 100; mega-menus/hub-pages routinely blow past this."]:
    "इससे अधिक आउटगोइंग लिंक (आंतरिक + बाहरी) वाले पेज 'प्रति पेज कुल लिंक' समस्या उठाते हैं। Google की ऐतिहासिक सिफ़ारिश 100 है; मेगा-मेनू/हब-पेज नियमित रूप से इसे पार करते हैं।",
  ['PASS = indexed · FAIL = not indexed · PART/NEU = discovered but not yet indexed']:
    'PASS = इंडेक्स किया गया · FAIL = इंडेक्स नहीं · PART/NEU = खोजा गया पर अभी इंडेक्स नहीं',
  ['Pattern: ^https://m\\.(.+) · Replacement: https://www.$1 · Flags: i  (collapse mobile subdomain to www)']:
    'पैटर्न: ^https://m\\.(.+) · प्रतिस्थापन: https://www.$1 · फ़्लैग: i  (मोबाइल सबडोमेन को www में समेटें)',
  ["Per-request abort threshold. Pages that take longer than this are recorded as network errors. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — that one's in seconds, this is in milliseconds."]:
    "प्रति-अनुरोध रद्द करने की सीमा। इससे अधिक समय लेने वाले पेज नेटवर्क त्रुटि के रूप में दर्ज होते हैं। Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — वह सेकंड में है, यह मिलीसेकंड में।",
  ['Persist rel="nofollow" links in the link graph. When off, nofollow links are dropped entirely (not counted in outlinks, not probed as externals). Screaming Frog inverse: turning this ON ≈ unchecking "Follow Internal/External Nofollow".']:
    'rel="nofollow" लिंक को लिंक ग्राफ़ में रखें। बंद होने पर nofollow लिंक पूरी तरह हटा दिए जाते हैं (आउटलिंक में नहीं गिने जाते, बाहरी के रूप में जाँचे नहीं जाते)। Screaming Frog का उल्टा: इसे चालू करना ≈ "Follow Internal/External Nofollow" अनचेक करना।',
  ['Picking a preset fills the User-Agent field below — you can still hand-edit it afterwards. Switch between Googlebot Smartphone / Desktop to compare how a site responds to mobile vs desktop crawlers.']:
    'प्रीसेट चुनने से नीचे का User-Agent फ़ील्ड भर जाता है — आप बाद में इसे हाथ से संपादित कर सकते हैं। Googlebot Smartphone / Desktop के बीच बदलकर देखें कि साइट मोबाइल बनाम डेस्कटॉप क्रॉलर को कैसे जवाब देती है।',
  ["Picks one of the saved profiles by name. Empty = use the Proxy URL field above (or env vars when that's also empty)."]:
    'नाम से सहेजी गई प्रोफ़ाइलों में से एक चुनता है। खाली = ऊपर का प्रॉक्सी URL फ़ील्ड इस्तेमाल करें (या वह भी खाली हो तो पर्यावरण चर)।',
  ['Pre-computes Dead External Domain, Duplicate URL post-norm, Canonical Chain Multi-hop. Without this the sidebar shows 0 for those three.']:
    'मृत बाहरी डोमेन, सामान्यीकरण के बाद डुप्लिकेट URL, कैनोनिकल चेन बहु-हॉप की पूर्व-गणना करता है। इसके बिना साइडबार उन तीनों के लिए 0 दिखाता है।',
  ['After the crawl, re-fetches a sample of indexable pages with the opposite user agent (mobile when the crawl ran as desktop, desktop otherwise) and compares title, H1, meta description, canonical, robots, word count and link count. Differences feed the \'Mobile / Desktop Mismatch\' issue and the report of the same name.']:
    'क्रॉल के बाद अनुक्रमणीय पृष्ठों के एक नमूने को विपरीत यूज़र एजेंट (डेस्कटॉप क्रॉल हो तो मोबाइल, अन्यथा डेस्कटॉप) से फिर लाता है और शीर्षक, H1, मेटा विवरण, कैनोनिकल, robots, शब्द संख्या और लिंक संख्या की तुलना करता है। अंतर \'मोबाइल / डेस्कटॉप असंगति\' इशू और उसी नाम की रिपोर्ट में जाते हैं।',
  ['How many pages the mobile-parity probe re-fetches, most-linked first. 0 = every indexable HTML page (doubles the crawl\'s traffic for that set).']:
    'मोबाइल समानता जाँच कितने पृष्ठ फिर से लाती है, सबसे अधिक लिंक वाले पहले। 0 = हर अनुक्रमणीय HTML पृष्ठ (उस सेट के लिए क्रॉल ट्रैफ़िक दोगुना)।',
  ["Probe outbound links to other hosts (HEAD only) so the Broken Links view catches dead externals. Screaming Frog: 'External Links' (Configuration → Spider → Crawl)."]:
    "अन्य होस्ट पर आउटबाउंड लिंक जाँचें (केवल HEAD) ताकि 'टूटे लिंक' दृश्य मृत बाहरी लिंक पकड़े। Screaming Frog: 'External Links' (Configuration → Spider → Crawl)।",
  ['Raw `Content-Security-Policy` response header. Empty when missing.']:
    'कच्चा `Content-Security-Policy` प्रतिक्रिया हेडर। अनुपस्थित होने पर खाली।',
  ['Raw `content` attribute of `<meta http-equiv="refresh">`, e.g. "5; url=/foo".']:
    '`<meta http-equiv="refresh">` का कच्चा `content` एट्रिब्यूट, जैसे "5; url=/foo"।',
  ['Raw `Strict-Transport-Security` header. Empty when missing — for HTTPS pages this is a security regression.']:
    'कच्चा `Strict-Transport-Security` हेडर। अनुपस्थित होने पर खाली — HTTPS पेजों के लिए यह सुरक्षा में गिरावट है।',
  ['Raw `X-Content-Type-Options` header. `nosniff` blocks MIME sniffing — prevents some XSS via content-type confusion.']:
    'कच्चा `X-Content-Type-Options` हेडर। `nosniff` MIME स्निफ़िंग रोकता है — कंटेंट-टाइप भ्रम से कुछ XSS को रोकता है।',
  ['Raw `X-Frame-Options` header. SAMEORIGIN / DENY / ALLOW-FROM. Clickjacking defence.']:
    'कच्चा `X-Frame-Options` हेडर। SAMEORIGIN / DENY / ALLOW-FROM। क्लिकजैकिंग से बचाव।',
  ['Raw value of the Content-Type response header (incl. charset).']:
    'Content-Type प्रतिक्रिया हेडर का कच्चा मान (charset सहित)।',
  ['Re-renders each page on a mobile viewport and checks viewport meta tag, horizontal overflow, font size legibility, and tap-target spacing. Stores a pass/fail verdict on the urls table.']:
    'हर पेज को मोबाइल व्यूपोर्ट पर फिर रेंडर करता है और viewport मेटा टैग, क्षैतिज ओवरफ़्लो, फ़ॉन्ट आकार की पठनीयता और टैप-लक्ष्य दूरी जाँचता है। urls तालिका में पास/फ़ेल निर्णय संग्रहीत करता है।',
  ['Read the full article →']: 'पूरा लेख पढ़ें →',
  ["Reject-all = ignore Set-Cookie entirely (zero counts on cookie-flag issues). Block-third-party = analyse only first-party cookies (Domain attribute matches the page's registrable domain). Accept-all = analyse every Set-Cookie regardless of scope."]:
    'सभी अस्वीकार करें = Set-Cookie को पूरी तरह अनदेखा करें (कुकी-फ़्लैग समस्याओं पर शून्य गिनती)। तृतीय-पक्ष अवरुद्ध करें = केवल प्रथम-पक्ष कुकीज़ का विश्लेषण (Domain एट्रिब्यूट पेज के पंजीकरण योग्य डोमेन से मेल खाता है)। सभी स्वीकार करें = दायरे की परवाह किए बिना हर Set-Cookie का विश्लेषण।',
  ["Reject-all for stateless audits; Block-third-party to focus on the site's own cookie hygiene; Accept-all to also see ad/analytics tracker cookies."]:
    "स्टेटलेस ऑडिट के लिए 'सभी अस्वीकार करें'; साइट की अपनी कुकी स्वच्छता पर ध्यान देने के लिए 'तृतीय-पक्ष अवरुद्ध करें'; विज्ञापन/एनालिटिक्स ट्रैकर कुकीज़ भी देखने के लिए 'सभी स्वीकार करें'।",
  ["Removes the leading 'www.' from the host at normalisation time. The seen-set, redirect graph, and link extraction all use the rewritten form, so duplicates collapse correctly."]:
    "सामान्यीकरण के समय होस्ट से आरंभिक 'www.' हटाता है। देखे-गए सेट, रीडायरेक्ट ग्राफ़ और लिंक निष्कर्षण सभी पुनर्लिखित रूप इस्तेमाल करते हैं, इसलिए डुप्लिकेट सही ढंग से समेटे जाते हैं।",
  ['Renders the page a second time on a mobile viewport and stores an above-the-fold PNG. Adds another full render + screenshot per URL.']:
    'पेज को मोबाइल व्यूपोर्ट पर दूसरी बार रेंडर करता है और above-the-fold PNG संग्रहीत करता है। प्रति URL एक और पूरा रेंडर + स्क्रीनशॉट जोड़ता है।',
  ['Resolved absolute URL of the <img src> attribute.']:
    '<img src> एट्रिब्यूट का हल किया गया पूर्ण URL।',
  ['Response body size in bytes (compressed transfer size, post-Content-Encoding).']:
    'बाइट में प्रतिक्रिया बॉडी का आकार (संपीड़ित ट्रांसफ़र आकार, Content-Encoding के बाद)।',
  ['Rewrites http:// to https:// before fetching. Breaks HTTP-only sites.']:
    'फ़ेच करने से पहले http:// को https:// में बदलता है। केवल-HTTP साइटों को तोड़ता है।',
  ['Run Chromium without a visible window. Turn off to debug rendering visually — useful when a page renders correctly in a normal browser but not under Playwright.']:
    'Chromium को दृश्य विंडो के बिना चलाएँ। रेंडरिंग को दृश्य रूप से डीबग करने के लिए बंद करें — तब उपयोगी जब पेज सामान्य ब्राउज़र में सही रेंडर हो पर Playwright में नहीं।',
  ['Run the login steps once before the crawl, then replay the session cookies on every request.']:
    'क्रॉल से पहले लॉगिन चरण एक बार चलाएँ, फिर हर अनुरोध पर सत्र कुकीज़ दोहराएँ।',
  ["Runs iterative PageRank (damping 0.85) over the internal link graph and normalises it to a 0–100 Link Score per page. Drives the Link Score column and the 'By Link Score' visualization colour mode."]:
    "आंतरिक लिंक ग्राफ़ पर पुनरावृत्त PageRank (डैम्पिंग 0.85) चलाता है और उसे प्रति पेज 0–100 लिंक स्कोर में सामान्यीकृत करता है। लिंक स्कोर कॉलम और विज़ुअलाइज़ेशन के 'लिंक स्कोर के अनुसार' रंग मोड को डेटा देता है।",
  ['Sends the URL through the same normalisation pipeline used by the crawler, with your unsaved settings applied. Useful for verifying regex rules before kicking off a crawl.']:
    'URL को क्रॉलर वाली ही सामान्यीकरण पाइपलाइन से गुज़ारता है, आपकी असहेजी सेटिंग्स लागू करके। क्रॉल शुरू करने से पहले regex नियम सत्यापित करने के लिए उपयोगी।',
  ['Sent on every request as the User-Agent header. Identifies the crawler to servers; some sites serve different content based on UA.']:
    'हर अनुरोध में User-Agent हेडर के रूप में भेजा जाता है। सर्वरों को क्रॉलर की पहचान देता है; कुछ साइटें UA के आधार पर अलग सामग्री परोसती हैं।',
  ['Sent on every request. Affects which locale a multi-lingual site serves you.']:
    'हर अनुरोध में भेजा जाता है। तय करता है कि बहुभाषी साइट आपको कौन-सा लोकेल परोसे।',
  ["Sent verbatim as `Bearer <token>`. Don't include the `Bearer ` prefix yourself."]:
    'ज्यों का त्यों `Bearer <token>` के रूप में भेजा जाता है। `Bearer ` उपसर्ग स्वयं न जोड़ें।',
  ['Server response time (a TTFB proxy) measured during the crawl. Pages slower than this are flagged. Google considers a good server response time under 800 ms.']:
    'क्रॉल के दौरान मापा गया सर्वर प्रतिक्रिया समय (TTFB का प्रतिनिधि)। इससे धीमे पेज चिह्नित होते हैं। Google 800 ms से कम सर्वर प्रतिक्रिया समय को अच्छा मानता है।',
  ['Shop the latest game keys at unbeatable prices…']: 'अजेय कीमतों पर नवीनतम गेम कीज़ खरीदें…',
  ["Skips body parsing for pages whose Content-Length header exceeds this. The page row is still created so links to it aren't lost; only body parsing and source snapshot capture are skipped."]:
    'उन पेजों की बॉडी पार्सिंग छोड़ता है जिनका Content-Length हेडर इससे अधिक हो। पेज पंक्ति फिर भी बनती है ताकि उसकी ओर के लिंक न खोएँ; केवल बॉडी पार्सिंग और स्रोत स्नैपशॉट कैप्चर छोड़ी जाती है।',
  ['Sleep this long on each worker AFTER a response completes, before it picks up the next URL. Stacks with the global RPS cap — useful for sites that rate-limit on inter-request gap rather than total throughput.']:
    'हर वर्कर प्रतिक्रिया पूरी होने के बाद, अगला URL लेने से पहले इतनी देर रुके। वैश्विक RPS सीमा के साथ जुड़ता है — उन साइटों के लिए उपयोगी जो कुल थ्रूपुट के बजाय अनुरोधों के बीच के अंतराल पर दर सीमित करती हैं।',
  ['Specific reason a URL is non-indexable. For Indexable URLs this column is empty.']:
    'URL के गैर-इंडेक्स योग्य होने का विशिष्ट कारण। इंडेक्स योग्य URL के लिए यह कॉलम खाली है।',
  ['Spider follows links from the start URL across the chosen scope. List fetches a fixed set of URLs once with no link-following. Sitemap fetches a sitemap URL and crawls every page it lists (no link-following).']:
    'Spider चुने गए दायरे में शुरुआती URL से लिंक फ़ॉलो करता है। सूची निश्चित URL सेट को बिना लिंक-फ़ॉलो एक बार फ़ेच करती है। साइटमैप एक साइटमैप URL फ़ेच करता है और उसमें सूचीबद्ध हर पेज क्रॉल करता है (लिंक-फ़ॉलो नहीं)।',
  ["Spider for full site audits; List for re-checking a known set of pages; Sitemap to audit exactly what's published in sitemap.xml."]:
    'पूरी साइट के ऑडिट के लिए Spider; ज्ञात पेज सेट की पुनः जाँच के लिए सूची; sitemap.xml में प्रकाशित सामग्री का ठीक-ठीक ऑडिट करने के लिए साइटमैप।',
  ['Standard CSS selector — same syntax as `document.querySelectorAll`.']:
    'मानक CSS सेलेक्टर — `document.querySelectorAll` जैसा ही सिंटैक्स।',
  ['Stored in your local prefs file as plain text. Treat the file accordingly.']:
    'आपकी स्थानीय प्रेफ़्स फ़ाइल में सादे टेक्स्ट में संग्रहीत। फ़ाइल को उसी के अनुसार सुरक्षित रखें।',
  ['Strip if your site canonicalises /foo (no slash); Add for sites that canonicalise /foo/.']:
    'यदि आपकी साइट /foo (बिना स्लैश) पर कैनोनिकल करती है तो हटाएँ; /foo/ पर कैनोनिकल करने वाली साइटों के लिए जोड़ें।',
  ['Sunset over the mountain ridge']: 'पर्वत श्रृंखला पर सूर्यास्त',
  ['Surplus `@id` occurrences across all JSON-LD blocks (page declares the same `@id` more than once).']:
    'सभी JSON-LD ब्लॉक में अतिरिक्त `@id` उपस्थितियाँ (पेज एक ही `@id` एक से अधिक बार घोषित करता है)।',
  ['Terminal URL the redirect chain resolves to. Empty when this row is itself the terminal (i.e. status is 2xx/4xx/5xx) or when the chain hits a loop.']:
    'अंतिम URL जिस पर रीडायरेक्ट चेन पहुँचती है। जब यह पंक्ति स्वयं अंतिम हो (यानी स्टेटस 2xx/4xx/5xx) या चेन लूप में फँसे तो खाली।',
  ['Canonical hops walked after this page (or, on a redirect row, after the redirect\'s final URL) until a page that canonicalises to itself. 0 when the canonical is the page itself or absent.']:
    'इस पृष्ठ के बाद (रीडायरेक्ट पंक्ति में, रीडायरेक्ट के अंतिम URL के बाद) स्वयं को कैनोनिकल करने वाले पृष्ठ तक तय किए गए कैनोनिकल हॉप। कैनोनिकल पृष्ठ स्वयं हो या अनुपस्थित हो तो 0।',
  ['Where the canonical chain ends. Empty when the page is its own canonical, or when the chain loops.']:
    'कैनोनिकल श्रृंखला कहाँ समाप्त होती है। पृष्ठ स्वयं अपना कैनोनिकल हो या श्रृंखला लूप करे तो खाली।',
  ['text for visible content, attribute for href/src, count for occurrence count']:
    'दृश्य सामग्री के लिए text, href/src के लिए attribute, उपस्थिति गणना के लिए count',
  ['Text of the first <h1> on the page. Should match user intent and ideally complement (not duplicate) the title.']:
    'पेज के पहले <h1> का टेक्स्ट। उपयोगकर्ता के इरादे से मेल खाना चाहिए और आदर्श रूप से शीर्षक का पूरक हो (डुप्लिकेट नहीं)।',
  ["Text Only fetches the raw HTML response as-is — fast and deterministic. Old AJAX Crawling Scheme rewrites hashbang (#!) URLs to Google's deprecated ?_escaped_fragment_= form so a pre-rendering server returns the snapshot. Full JavaScript rendering is a V2 item."]:
    'केवल टेक्स्ट कच्ची HTML प्रतिक्रिया ज्यों की त्यों फ़ेच करता है — तेज़ और नियतात्मक। पुराना AJAX क्रॉलिंग स्कीम hashbang (#!) URL को Google के अप्रचलित ?_escaped_fragment_= रूप में बदलता है ताकि प्री-रेंडरिंग सर्वर स्नैपशॉट लौटाए। पूर्ण JavaScript रेंडरिंग V2 का आइटम है।',
  ['Text Only for server-rendered / static sites; Old AJAX only for legacy hashbang SPAs.']:
    'सर्वर-रेंडर / स्टैटिक साइटों के लिए केवल टेक्स्ट; पुराना AJAX केवल पुरानी hashbang SPA के लिए।',
  ["The column / JSON-key name for this rule's output. Free-form."]:
    'इस नियम के आउटपुट के लिए कॉलम / JSON-कुंजी नाम। स्वतंत्र-रूप।',
  ['The fully normalised URL of the crawled resource (post URL-rewriting).']:
    'क्रॉल किए गए संसाधन का पूरी तरह सामान्यीकृत URL (URL-पुनर्लेखन के बाद)।',
  ['The URL that fails to resolve (4xx/5xx/network error).']:
    'वह URL जो हल नहीं होता (4xx/5xx/नेटवर्क त्रुटि)।',
  ['Third-party `<script>` / `<link rel=stylesheet>` references without an `integrity=` attribute. SRI is recommended for any cross-origin subresource.']:
    'बिना `integrity=` एट्रिब्यूट वाले तृतीय-पक्ष `<script>` / `<link rel=stylesheet>` संदर्भ। किसी भी क्रॉस-ऑरिजिन उप-संसाधन के लिए SRI अनुशंसित है।',
  ['Time-to-first-byte in milliseconds (network + server, excluding parse). Lower is better; >2000 ms is slow.']:
    'मिलीसेकंड में पहले बाइट तक का समय (नेटवर्क + सर्वर, पार्सिंग छोड़कर)। कम बेहतर है; >2000 ms धीमा है।',
  ['Total number of <h1> elements on the page. SEO best practice is exactly 1.']:
    'पेज पर <h1> तत्वों की कुल संख्या। SEO सर्वोत्तम अभ्यास ठीक 1 है।',
  ['Total number of <h2> elements on the page.']: 'पेज पर <h2> तत्वों की कुल संख्या।',
  ['tr,en;q=0.8 — Turkish first, English fallback.']:
    'tr,en;q=0.8 — पहले तुर्की, विकल्प के रूप में अंग्रेज़ी।',
  ["Trips 'Folder Depth Too Deep' when the URL path's `/`-segment count exceeds this. Useful for spotting over-nested URL structures that bury content from crawlers."]:
    "जब URL पथ के `/`-खंडों की संख्या इससे अधिक हो तो 'फ़ोल्डर गहराई बहुत अधिक' उठाता है। अत्यधिक नेस्टेड URL संरचनाएँ पकड़ने के लिए उपयोगी जो सामग्री को क्रॉलर से दफ़न कर देती हैं।",
  ["Trips 'Long Query String' when LENGTH(query) > this. Typical session-id sprawl + UTM tracking hits 100+ chars; over 200 starts to look like a bug."]:
    "जब LENGTH(query) > यह हो तो 'लंबी क्वेरी स्ट्रिंग' उठाता है। सामान्य सत्र-id फैलाव + UTM ट्रैकिंग 100+ अक्षर तक पहुँचती है; 200 से ऊपर बग जैसा लगने लगता है।",
  ["Trips the 'URL Too Long' issue when LENGTH(url) > this. RFC 7230 doesn't mandate a max but most servers + middleboxes fail above ~2 KB; Chrome itself caps at ~32 KB."]:
    "जब LENGTH(url) > यह हो तो 'URL बहुत लंबा' समस्या उठाता है। RFC 7230 कोई अधिकतम अनिवार्य नहीं करता पर अधिकांश सर्वर + मिडलबॉक्स ~2 KB से ऊपर विफल होते हैं; Chrome स्वयं ~32 KB पर सीमित करता है।",
  ["Two modes per line. (1) Wrap in slashes for a regex: /pattern/flags — supported flags imsuy (g is forced). Invalid patterns appear with count -1 in the detail panel so you can spot the typo. (2) Anything else is a literal case-insensitive substring — the legacy behaviour. Each term's per-page hit count is surfaced in the URL Details panel."]:
    'प्रति पंक्ति दो मोड। (1) regex के लिए स्लैश में लपेटें: /pattern/flags — समर्थित फ़्लैग imsuy (g बाध्य)। अमान्य पैटर्न विवरण पैनल में -1 गिनती के साथ दिखते हैं ताकि आप टाइपो पकड़ सकें। (2) बाकी सब केस-असंवेदनशील शाब्दिक सबस्ट्रिंग है — पुराना व्यवहार। हर शब्द की प्रति-पेज हिट गिनती URL विवरण पैनल में दिखती है।',
  ["Two pages are flagged as near-duplicates if their 64-bit SimHash differs by at most this many bits. 3 ≈ 95% similarity over body-text shingles (Screaming Frog's tightest filter). Set to 0 to skip clustering entirely."]:
    'दो पेज निकट-डुप्लिकेट चिह्नित होते हैं यदि उनका 64-बिट SimHash अधिकतम इतने बिट से भिन्न हो। 3 ≈ बॉडी-टेक्स्ट शिंगल्स पर 95% समानता (Screaming Frog का सबसे सख्त फ़िल्टर)। क्लस्टरिंग पूरी तरह छोड़ने के लिए 0 सेट करें।',
  ['URL declared by the first <link rel="canonical"> tag. Tells search engines which version to index when duplicates exist.']:
    'पहले <link rel="canonical"> टैग द्वारा घोषित URL। डुप्लिकेट होने पर सर्च इंजन को बताता है कि कौन-सा संस्करण इंडेक्स करें।',
  ['URL paths ending in any of these extensions are not enqueued. Case-insensitive. Start URL is always crawled regardless.']:
    'इन एक्सटेंशन में से किसी पर समाप्त होने वाले URL पथ कतार में नहीं डाले जाते। केस-असंवेदनशील। शुरुआती URL फिर भी हमेशा क्रॉल होता है।',
  ['Value of the alt attribute. Empty cell = no alt declared (accessibility/SEO issue).']:
    'alt एट्रिब्यूट का मान। खाली सेल = कोई alt घोषित नहीं (पहुँच/SEO समस्या)।',
  ['Value of the X-Robots-Tag HTTP response header. Same semantics as meta robots but applied at the server.']:
    'X-Robots-Tag HTTP प्रतिक्रिया हेडर का मान। meta robots जैसा ही अर्थ पर सर्वर पर लागू।',
  ['Viewport height — affects above-the-fold detection and lazy-load triggers.']:
    'व्यूपोर्ट ऊँचाई — above-the-fold पहचान और लेज़ी-लोड ट्रिगर को प्रभावित करती है।',
  ['Viewport width applied to every rendered page. Mobile audits typically use 360–414, desktop 1280–1920.']:
    'हर रेंडर किए पेज पर लागू व्यूपोर्ट चौड़ाई। मोबाइल ऑडिट आमतौर पर 360–414, डेस्कटॉप 1280–1920 इस्तेमाल करते हैं।',
  ['Visible body text word count (excludes <script>/<style>). Useful for identifying thin content.']:
    'दृश्य बॉडी टेक्स्ट की शब्द संख्या (<script>/<style> छोड़कर)। पतली सामग्री पहचानने के लिए उपयोगी।',
  ['Wait this long before the FIRST retry, doubling on each subsequent attempt (500 → 1000 → 2000 …).']:
    'पहले पुनः प्रयास से पहले इतनी देर प्रतीक्षा करें, हर अगले प्रयास में दोगुना (500 → 1000 → 2000 …)।',
  ["Walks 3xx redirect chains, fills `redirect_chain_length` / `redirect_loop`. Drives the 'Long Chain' and 'Redirect Loop' issues + the Redirects tab."]:
    "3xx रीडायरेक्ट चेन पर चलता है, `redirect_chain_length` / `redirect_loop` भरता है। 'लंबी चेन' और 'रीडायरेक्ट लूप' समस्याओं + रीडायरेक्ट टैब को डेटा देता है।",
  ['Welcome to Example Store']: 'उदाहरण स्टोर में आपका स्वागत है',
  ['What to do when multiple matches exist.']: 'एकाधिक मिलान होने पर क्या करें।',
  ['What to read off each matched element. Ignored for an XPath `/@attr` or `/text()` terminal — that value is used directly.']:
    'हर मेल खाते तत्व से क्या पढ़ें। XPath `/@attr` या `/text()` अंत के लिए अनदेखा — वह मान सीधे इस्तेमाल होता है।',
  ['When non-empty, ALL query parameters not on this list are dropped during normalisation (case-insensitive name match). Leave empty to keep the default behaviour, which strips just utm_*, fbclid, gclid, mc_cid, and mc_eid.']:
    'खाली न होने पर इस सूची से बाहर के सभी क्वेरी पैरामीटर सामान्यीकरण के दौरान हटा दिए जाते हैं (केस-असंवेदनशील नाम मिलान)। डिफ़ॉल्ट व्यवहार रखने के लिए खाली छोड़ें, जो केवल utm_*, fbclid, gclid, mc_cid और mc_eid हटाता है।',
  ['When off, no budget evaluation runs and the verdict column is cleared. When on, the post-crawl pass scores every internal 200 HTML page against the ceilings below.']:
    'बंद होने पर कोई बजट मूल्यांकन नहीं चलता और निर्णय कॉलम साफ़ हो जाता है। चालू होने पर क्रॉल के बाद का चरण हर आंतरिक 200 HTML पेज को नीचे की सीमाओं के विरुद्ध स्कोर करता है।',
  ['When on (default), pagination_next + pagination_prev URLs are post-fetch enqueued. Off only to debug pagination-only loops without disabling all link follow.']:
    'चालू (डिफ़ॉल्ट) होने पर pagination_next + pagination_prev URL फ़ेच के बाद कतार में डाले जाते हैं। पूरा लिंक फ़ॉलो बंद किए बिना केवल-पेजिनेशन लूप डीबग करने के लिए ही बंद करें।',
  ['When ON (default), the Duplicate URL filter compares URLs after lowercasing the host, dropping the query string, and trimming the trailing slash — the canonical SEO behaviour. When OFF, comparison is byte-exact, so the filter only fires on rows that share an identical raw URL string (rare since URLs are deduped at insert time).']:
    'चालू (डिफ़ॉल्ट) होने पर डुप्लिकेट URL फ़िल्टर होस्ट लोअरकेस करके, क्वेरी स्ट्रिंग हटाकर और अंतिम स्लैश काटकर URL की तुलना करता है — कैनोनिकल SEO व्यवहार। बंद होने पर तुलना बाइट-सटीक है, इसलिए फ़िल्टर केवल उन पंक्तियों पर चलता है जिनकी कच्ची URL स्ट्रिंग समान हो (दुर्लभ, क्योंकि URL इन्सर्ट के समय डीडुप्लिकेट होते हैं)।',
  ["When on, `<meta http-equiv='refresh'>` content URLs are enqueued like a redirect target. window.location body redirects are heuristic-only and currently out of scope."]:
    "चालू होने पर `<meta http-equiv='refresh'>` content URL रीडायरेक्ट लक्ष्य की तरह कतार में डाले जाते हैं। window.location बॉडी रीडायरेक्ट केवल ह्यूरिस्टिक हैं और फ़िलहाल दायरे से बाहर।",
  ['When on, a 200 page declaring a canonical pointing elsewhere also enqueues that target. Default off — most crawls treat canonicals as a signal, not a navigation hint.']:
    'चालू होने पर कहीं और कैनोनिकल घोषित करने वाला 200 पेज उस लक्ष्य को भी कतार में डालता है। डिफ़ॉल्ट बंद — अधिकांश क्रॉल कैनोनिकल को नेविगेशन संकेत नहीं, सिग्नल मानते हैं।',
  ['When on, pages with noindex / canonicalised / robots-blocked indexability are excluded from clustering — the Near-Duplicate report then surfaces only issues that affect search visibility.']:
    'चालू होने पर noindex / कैनोनिकल किए गए / robots-अवरुद्ध इंडेक्सेबिलिटी वाले पेज क्लस्टरिंग से बाहर रखे जाते हैं — निकट-डुप्लिकेट रिपोर्ट तब केवल खोज दृश्यता को प्रभावित करने वाली समस्याएँ दिखाती है।',
  ["When on, rel=nofollow links are recursed into like any other link. Default off — Screaming Frog 'Respect Nofollow' default."]:
    "चालू होने पर rel=nofollow लिंक किसी भी अन्य लिंक की तरह फ़ॉलो किए जाते हैं। डिफ़ॉल्ट बंद — Screaming Frog 'Respect Nofollow' डिफ़ॉल्ट।",
  ['When Playwright considers navigation complete. domcontentloaded = HTML parsed but resources still loading. load = window.load fired. networkidle = no network activity for 500ms (best for SPA but slower). commit = just response committed (fastest, riskiest).']:
    'Playwright नेविगेशन कब पूर्ण माने। domcontentloaded = HTML पार्स हुआ पर संसाधन अभी लोड हो रहे हैं। load = window.load चला। networkidle = 500ms तक कोई नेटवर्क गतिविधि नहीं (SPA के लिए सर्वोत्तम पर धीमा)। commit = केवल प्रतिक्रिया कमिट हुई (सबसे तेज़, सबसे जोखिम भरा)।',
  ['Whether the broken target is on the same site (internal) or a different host (external).']:
    'टूटा लक्ष्य उसी साइट पर (आंतरिक) है या अलग होस्ट पर (बाहरी)।',
  ['Whether the URL is eligible to appear in search results. Combines status code, robots directives, canonical, and meta-refresh signals.']:
    'URL खोज परिणामों में दिखने योग्य है या नहीं। स्टेटस कोड, robots निर्देश, कैनोनिकल और meta-refresh संकेतों को जोड़ता है।',
  ['Width attribute value (in pixels) declared on the <img> tag, when present.']:
    '<img> टैग पर घोषित width एट्रिब्यूट मान (पिक्सेल में), जब मौजूद हो।',
  ['XPath 1.0 subset over the parsed DOM. End in `/@attr` or `/text()` to read an attribute / text node. Predicates: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.']:
    'पार्स किए गए DOM पर XPath 1.0 उपसमुच्चय। एट्रिब्यूट / टेक्स्ट नोड पढ़ने के लिए `/@attr` या `/text()` पर समाप्त करें। प्रेडिकेट: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`।',
  ['Y when the page declares hreflang alternates but no entry whose `href` matches the page URL. Google requires a self-reference.']:
    'Y जब पेज hreflang विकल्प घोषित करे पर कोई प्रविष्टि न हो जिसका `href` पेज URL से मेल खाए। Google स्व-संदर्भ की अपेक्षा करता है।',
  ['Y when the redirect chain originating at this URL contains a cycle (A → B → A) detected by the cycle-safe walker; the chain is otherwise unwalked.']:
    'Y जब इस URL से शुरू होने वाली रीडायरेक्ट चेन में चक्र-सुरक्षित वॉकर द्वारा पकड़ा गया चक्र (A → B → A) हो; अन्यथा चेन पर नहीं चला जाता।',
  ['Y when this URL belongs to a paginated cluster whose ordinal sequence has a gap (e.g. ?page=1, 2, 4 — page 3 missing). Set by the post-crawl `recomputePaginationSequence` pass.']:
    'Y जब यह URL ऐसे पेजिनेटेड क्लस्टर का हो जिसके क्रमिक अनुक्रम में अंतराल है (जैसे ?page=1, 2, 4 — पेज 3 गायब)। क्रॉल के बाद `recomputePaginationSequence` चरण द्वारा सेट।',
  ['SQL injection — the request tries to smuggle SQL into a parameter (UNION SELECT, sleep(), error-based functions) to read or alter your database.']:
    'SQL इंजेक्शन — अनुरोध आपके डेटाबेस को पढ़ने या बदलने के लिए पैरामीटर में SQL घुसाने की कोशिश करता है (UNION SELECT, sleep(), त्रुटि-आधारित फ़ंक्शन)।',
  ['Cross-site scripting — the request carries script markup or a javascript: URL in a parameter, hoping the page echoes it back into the HTML unescaped.']:
    'क्रॉस-साइट स्क्रिप्टिंग — अनुरोध पैरामीटर में स्क्रिप्ट मार्कअप या javascript: URL ले जाता है, इस उम्मीद में कि पेज उसे बिना एस्केप HTML में वापस दिखाए।',
  ['Path traversal — the request walks out of the web root with ../ or encoded variants to reach files like /etc/passwd or win.ini.']:
    'पाथ ट्रैवर्सल — अनुरोध ../ या एन्कोडेड रूपों से वेब रूट से बाहर निकलकर /etc/passwd या win.ini जैसी फ़ाइलों तक पहुँचने की कोशिश करता है।',
  ['Command injection — the request appends shell syntax (;, |, backticks, $( )) to a parameter to run commands on the server.']:
    'कमांड इंजेक्शन — अनुरोध सर्वर पर कमांड चलाने के लिए पैरामीटर में शेल सिंटैक्स (;, |, बैकटिक, $( )) जोड़ता है।',
  ['Scanner probe — an automated vulnerability scanner walking a wordlist of known admin panels, installers and exploit paths (wp-login, phpmyadmin, /actuator, shell uploads). Not tailored to your site; it hits everyone.']:
    'स्कैनर जाँच — एक स्वचालित भेद्यता स्कैनर ज्ञात एडमिन पैनल, इंस्टॉलर और एक्सप्लॉइट पथों की सूची (wp-login, phpmyadmin, /actuator, शेल अपलोड) पर चलता है। आपकी साइट के लिए विशेष नहीं; सबको निशाना बनाता है।',
  ['Sensitive file fetch — a direct request for something that must never be public: .env, .git, backups, SQL dumps, private keys, config files.']:
    'संवेदनशील फ़ाइल फ़ेच — किसी ऐसी चीज़ का सीधा अनुरोध जो कभी सार्वजनिक नहीं होनी चाहिए: .env, .git, बैकअप, SQL डंप, निजी कुंजियाँ, कॉन्फ़िग फ़ाइलें।',
  ['Anomaly — malformed or evasive input (null bytes, CRLF injection, over-encoding, absurd parameter lengths) that matches no single attack class but is not a normal browser request.']:
    'विसंगति — विकृत या बचने वाला इनपुट (null बाइट, CRLF इंजेक्शन, अति-एन्कोडिंग, बेतुकी पैरामीटर लंबाई) जो किसी एक हमला वर्ग से मेल नहीं खाता पर सामान्य ब्राउज़र अनुरोध भी नहीं है।',
  ['Sum of the weights of every attack signature the request matched. Each signature carries a weight by how conclusive it is (a UNION SELECT weighs 9, a stray quote 2), and a line is only flagged once the total reaches 5 — so one decisive pattern flags on its own, while weak hints have to add up. Higher score = less room for a false positive; sort by it to triage.']:
    'अनुरोध से मेल खाने वाले हर हमला हस्ताक्षर के भार का योग। हर हस्ताक्षर अपनी निर्णायकता के अनुसार भार रखता है (UNION SELECT का भार 9, अकेला उद्धरण 2), और पंक्ति तभी चिह्नित होती है जब कुल 5 पहुँचे — इसलिए एक निर्णायक पैटर्न अकेले चिह्नित हो जाता है, जबकि कमज़ोर संकेतों को जुड़ना पड़ता है। अधिक स्कोर = गलत सकारात्मक की कम गुंजाइश; प्राथमिकता के लिए इसी से क्रमबद्ध करें।',
  ['Which attack class the strongest matching signature belongs to: SQL injection, XSS, path traversal, command injection, scanner probe, sensitive file, or anomaly. Hover any badge in this column for what that class means in practice.']:
    'सबसे मज़बूत मेल खाते हस्ताक्षर का हमला वर्ग: SQL इंजेक्शन, XSS, पाथ ट्रैवर्सल, कमांड इंजेक्शन, स्कैनर जाँच, संवेदनशील फ़ाइल, या विसंगति। इस कॉलम के किसी भी बैज पर होवर करें कि उस वर्ग का व्यवहार में क्या अर्थ है।',
  ["Filters on the Status column — the most recent response the log recorded for that path. The analyzer keeps one status per URL rather than a full distribution, so this answers 'what is this URL returning now'. Paths whose status could not be parsed are hidden while a class is selected."]:
    "स्टेटस कॉलम पर फ़िल्टर — उस पथ के लिए लॉग की सबसे हालिया प्रतिक्रिया। विश्लेषक पूर्ण वितरण के बजाय प्रति URL एक स्टेटस रखता है, इसलिए यह 'यह URL अभी क्या लौटा रहा है' का उत्तर देता है। कोई वर्ग चुने होने पर जिन पथों का स्टेटस पार्स नहीं हो सका वे छिपे रहते हैं।",
  ['Most recent HTTP status the log recorded for this path. One value per URL, not a distribution — a path that returned 200 all week and 404 this morning shows 404.']:
    'इस पथ के लिए लॉग द्वारा दर्ज सबसे हालिया HTTP स्टेटस। प्रति URL एक मान, वितरण नहीं — जो पथ पूरे सप्ताह 200 और आज सुबह 404 लौटाया, वह 404 दिखाता है।',
  ['A URL whose path repeats the same segment this many times or more (/shop/shop/shop/…) is treated as a link loop and skipped. This shape comes from a relative-href bug and has no legitimate counterpart. Skipped counts are reported when the crawl finishes.']:
    'जिस URL का पथ एक ही खंड इतनी या अधिक बार दोहराए (/shop/shop/shop/…) उसे लिंक लूप माना जाकर छोड़ दिया जाता है। यह आकृति सापेक्ष-href बग से आती है और इसका कोई वैध समकक्ष नहीं। छोड़ी गई गिनती क्रॉल पूरा होने पर बताई जाती है।',
  ['3 is safe for every site; raise to 4–5 only if a real path legitimately repeats a segment; 0 disables the guard.']:
    '3 हर साइट के लिए सुरक्षित है; केवल तभी 4–5 करें जब कोई वास्तविक पथ वैध रूप से खंड दोहराता हो; 0 सुरक्षा बंद करता है।',
  ['URLs with more query parameters than this are flagged as faceted-navigation traps under Issues → URL → Crawl Trap. Detection only — the URLs are still crawled, because legitimate filter pages look the same.']:
    'इससे अधिक क्वेरी पैरामीटर वाले URL समस्याएँ → URL → क्रॉल ट्रैप के तहत फ़ेसेटेड-नेविगेशन ट्रैप चिह्नित होते हैं। केवल पहचान — URL फिर भी क्रॉल होते हैं, क्योंकि वैध फ़िल्टर पेज वैसे ही दिखते हैं।',
  ['4 surfaces most faceted-nav explosions; 0 disables the check.']:
    '4 अधिकांश फ़ेसेटेड-नेव विस्फोट पकड़ता है; 0 जाँच बंद करता है।',
  ["Honor Allow / Disallow rules declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "कॉन्फ़िगर किए गए User-Agent के लिए /robots.txt में घोषित Allow / Disallow नियमों का सम्मान करें। Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)।",
  ["Honor a Crawl-delay directive as a global rate limit (one request every N seconds). Crawl-delay is not part of RFC 9309 — Google ignores it and Screaming Frog does not implement it — and published values are often stale: 'Crawl-delay: 30' turns a 500-URL crawl into hours. Ignored by default; the directive is still reported in the log when found."]:
    "Crawl-delay निर्देश को वैश्विक दर सीमा (हर N सेकंड में एक अनुरोध) के रूप में मानें। Crawl-delay RFC 9309 का हिस्सा नहीं है — Google इसे अनदेखा करता है और Screaming Frog इसे लागू नहीं करता — और प्रकाशित मान अक्सर पुराने होते हैं: 'Crawl-delay: 30' 500-URL क्रॉल को घंटों में बदल देता है। डिफ़ॉल्ट रूप से अनदेखा; मिलने पर निर्देश फिर भी लॉग में दर्ज होता है।",
  ['Off (default) for normal audits. On when an ops policy requires it — expect the crawl to take Crawl-delay seconds per URL.']:
    'सामान्य ऑडिट के लिए बंद (डिफ़ॉल्ट)। जब कोई ऑप्स नीति अपेक्षित करे तब चालू — प्रति URL Crawl-delay सेकंड लगने की उम्मीद रखें।',
  ['Crawl fetches internal <img> targets (incl. srcset / <picture> sources) so each appears in the Internal tab with status, content type, and size — every one counts toward Max URLs. Store keeps the <img> declarations in the Images tab, which works even with Crawl off: you get the full image inventory with alt text for the cost of zero extra requests.']:
    "क्रॉल आंतरिक <img> लक्ष्य (srcset / <picture> स्रोत सहित) फ़ेच करता है ताकि हर एक स्टेटस, कंटेंट टाइप और आकार के साथ 'आंतरिक' टैब में दिखे — हर एक अधिकतम URL में गिना जाता है। संग्रह <img> घोषणाओं को छवियाँ टैब में रखता है, जो क्रॉल बंद होने पर भी काम करता है: शून्य अतिरिक्त अनुरोध पर alt टेक्स्ट सहित पूरी छवि सूची मिलती है।",
  ['Store on, Crawl off is the cheap alt-text audit. Both on for a full image health check.']:
    'संग्रह चालू, क्रॉल बंद सस्ता alt-टेक्स्ट ऑडिट है। पूर्ण छवि स्वास्थ्य जाँच के लिए दोनों चालू।',
  ['<video> / <audio> and the <source> children they own. Off by default — media files are large and rarely what an SEO crawl is looking for.']:
    '<video> / <audio> और उनके <source> बच्चे। डिफ़ॉल्ट बंद — मीडिया फ़ाइलें बड़ी हैं और शायद ही SEO क्रॉल की तलाश हों।',
  ['On when auditing a video-heavy site for dead media URLs.']:
    'मृत मीडिया URL के लिए वीडियो-भारी साइट का ऑडिट करते समय चालू।',
  ["<link rel=stylesheet> targets. Crawling a stylesheet is also what discovers the web fonts and background images declared inside it via @font-face / url() — so Crawl on with Store off still populates the Internal tab's Font filter without listing every stylesheet."]:
    "<link rel=stylesheet> लक्ष्य। स्टाइलशीट क्रॉल करने से ही उसके अंदर @font-face / url() से घोषित वेब फ़ॉन्ट और पृष्ठभूमि छवियाँ खोजी जाती हैं — इसलिए क्रॉल चालू, संग्रह बंद होने पर भी हर स्टाइलशीट सूचीबद्ध किए बिना 'आंतरिक' टैब का फ़ॉन्ट फ़िल्टर भरता है।",
  ['Crawl on, Store off when you want fonts discovered but not hundreds of CSS rows.']:
    'जब फ़ॉन्ट खोजना हो पर सैकड़ों CSS पंक्तियाँ नहीं, तो क्रॉल चालू, संग्रह बंद।',
  ['<script src> targets, fetched so each gets its own row with status code, content type, and size. Headers only — the body is discarded, never executed.']:
    '<script src> लक्ष्य, फ़ेच किए गए ताकि हर एक को स्टेटस कोड, कंटेंट टाइप और आकार के साथ अपनी पंक्ति मिले। केवल हेडर — बॉडी फेंक दी जाती है, कभी निष्पादित नहीं।',
  ['Both on to catch 404ing bundles; both off for HTML-only crawls.']:
    '404 देने वाले बंडल पकड़ने के लिए दोनों चालू; केवल-HTML क्रॉल के लिए दोनों बंद।',
  ['<a href> targets on the same site. Crawl off turns the run into an audit of a fixed set of pages — sitemaps, canonicals, and the other declared alternates below still feed discovery. Store off empties the link graph: inlinks, outlinks, anchor-text reports, and link score all go with it.']:
    'उसी साइट पर <a href> लक्ष्य। क्रॉल बंद रन को निश्चित पेज सेट के ऑडिट में बदल देता है — साइटमैप, कैनोनिकल और नीचे के अन्य घोषित विकल्प फिर भी खोज को भरते हैं। संग्रह बंद लिंक ग्राफ़ खाली कर देता है: इनलिंक, आउटलिंक, एंकर-टेक्स्ट रिपोर्ट और लिंक स्कोर सब उसके साथ जाते हैं।',
  ['Leave both on. Crawl off only when a sitemap or URL list already defines the exact set you want.']:
    'दोनों चालू रखें। क्रॉल केवल तब बंद करें जब कोई साइटमैप या URL सूची पहले से ठीक वही सेट तय करती हो जो आप चाहते हैं।',
  ['Outbound links to other hosts are always status-checked (one HEAD each) so Broken Links catches dead externals — that does not depend on this row. Crawl here means fully crawling those pages, following their links onward too. Store keeps outbound links in the link graph.']:
    "अन्य होस्ट के आउटबाउंड लिंक हमेशा स्टेटस-जाँचे जाते हैं (प्रत्येक एक HEAD) ताकि 'टूटे लिंक' मृत बाहरी पकड़े — वह इस पंक्ति पर निर्भर नहीं। यहाँ क्रॉल का अर्थ है उन पेजों को पूरी तरह क्रॉल करना, उनके लिंक भी आगे फ़ॉलो करना। संग्रह आउटबाउंड लिंक को लिंक ग्राफ़ में रखता है।",
  ['Crawl off (default) — status-check externals without spidering the whole web.']:
    'क्रॉल बंद (डिफ़ॉल्ट) — पूरा वेब स्पाइडर किए बिना बाहरी लिंक की स्टेटस-जाँच करें।',
  ['<link rel=canonical> and its HTTP Link: header form. Crawl also enqueues the canonical target, treating it as a navigation hint. Store feeds the Canonicals tab and every canonical issue filter.']:
    '<link rel=canonical> और उसका HTTP Link: हेडर रूप। क्रॉल कैनोनिकल लक्ष्य को भी नेविगेशन संकेत मानकर कतार में डालता है। संग्रह कैनोनिकल टैब और हर कैनोनिकल समस्या फ़िल्टर को डेटा देता है।',
  ['Crawl off (default) — canonicals are a signal, not a route. Store on.']:
    'क्रॉल बंद (डिफ़ॉल्ट) — कैनोनिकल एक सिग्नल है, रास्ता नहीं। संग्रह चालू।',
  ['<link rel=next> / <link rel=prev>. Part of the standard discovery graph; turn Crawl off to isolate a pagination loop without disabling link-following everywhere.']:
    '<link rel=next> / <link rel=prev>। मानक खोज ग्राफ़ का हिस्सा; हर जगह लिंक-फ़ॉलो बंद किए बिना पेजिनेशन लूप अलग करने के लिए क्रॉल बंद करें।',
  ['Both on unless you are debugging an infinite paginated series.']:
    'दोनों चालू जब तक आप अनंत पेजिनेटेड श्रृंखला डीबग न कर रहे हों।',
  ['<link rel=alternate hreflang>. Crawl enqueues every declared alternate, which is how you reach language versions nothing links to. Store feeds the Hreflang tab and the reciprocity / invalid-code audits.']:
    '<link rel=alternate hreflang>। क्रॉल हर घोषित विकल्प को कतार में डालता है — इसी से आप उन भाषा संस्करणों तक पहुँचते हैं जिनसे कुछ लिंक नहीं करता। संग्रह Hreflang टैब और पारस्परिकता / अमान्य-कोड ऑडिट को डेटा देता है।',
  ['Crawl on for a multi-language audit — otherwise unlinked locales stay invisible.']:
    'बहुभाषी ऑडिट के लिए क्रॉल चालू — अन्यथा अलिंक्ड लोकेल अदृश्य रहते हैं।',
  ['<link rel=amphtml>. Crawl fetches the AMP variant as its own URL; Store keeps the declaration plus the AMP smoke-validator findings.']:
    '<link rel=amphtml>। क्रॉल AMP वैरिएंट को अपने URL के रूप में फ़ेच करता है; संग्रह घोषणा और AMP स्मोक-वैलिडेटर के निष्कर्ष रखता है।',
  ['Crawl on only if the site still ships AMP pages.']:
    'क्रॉल केवल तब चालू करें जब साइट अब भी AMP पेज परोसती हो।',
  ['<meta http-equiv="refresh">. Crawl enqueues the parsed target like a redirect; Store keeps the raw directive and its URL for the Meta Refresh tab.']:
    '<meta http-equiv="refresh">। क्रॉल पार्स किए लक्ष्य को रीडायरेक्ट की तरह कतार में डालता है; संग्रह कच्चा निर्देश और उसका URL Meta Refresh टैब के लिए रखता है।',
  ['Crawl on when auditing a legacy site that still redirects this way.']:
    'इस तरह अब भी रीडायरेक्ट करने वाली पुरानी साइट का ऑडिट करते समय क्रॉल चालू।',
  ["<iframe src> documents. Crawl fetches each embedded page as its own URL, which can pull in a lot of third-party surface. Store records them in the link graph so a dead embed shows up in Outlinks and Broken Links — without counting toward the page's outlink total, since an embed is not a hyperlink."]:
    '<iframe src> दस्तावेज़। क्रॉल हर एम्बेडेड पेज को अपने URL के रूप में फ़ेच करता है, जो बहुत-सा तृतीय-पक्ष सतह खींच सकता है। संग्रह उन्हें लिंक ग्राफ़ में दर्ज करता है ताकि मृत एम्बेड आउटलिंक और टूटे लिंक में दिखे — पेज के आउटलिंक कुल में गिने बिना, क्योंकि एम्बेड हाइपरलिंक नहीं है।',
  ['Store on, Crawl off is usually the right pair.']:
    'संग्रह चालू, क्रॉल बंद आमतौर पर सही जोड़ी है।',
  ['The separate-URL (m-dot) mobile version: <link rel="alternate" media="only screen and (max-width: …)">. Null on responsive sites, which is most of them — a value here with no reciprocal canonical back is the classic broken m-dot setup.']:
    'अलग-URL (m-dot) मोबाइल संस्करण: <link rel="alternate" media="only screen and (max-width: …)">। रिस्पॉन्सिव साइटों पर null, जो अधिकांश हैं — यहाँ मान हो पर वापस कोई पारस्परिक कैनोनिकल न हो तो यह क्लासिक टूटा m-dot सेटअप है।',
  ['Crawl on only when the site really does serve a separate mobile host.']:
    'क्रॉल केवल तब चालू करें जब साइट वास्तव में अलग मोबाइल होस्ट परोसती हो।',
  ['Links a search engine cannot follow: <a> with no href but an onclick, href="javascript:…", and href="#" placeholders wired to a handler. Store-only — an uncrawlable link is by definition never fetched. Drives the JS-Only Navigation issue filter.']:
    'ऐसे लिंक जिन्हें सर्च इंजन फ़ॉलो नहीं कर सकता: बिना href पर onclick वाला <a>, href="javascript:…", और हैंडलर से जुड़े href="#" प्लेसहोल्डर। केवल-संग्रह — गैर-क्रॉल योग्य लिंक परिभाषा से कभी फ़ेच नहीं होता। केवल-JS नेविगेशन समस्या फ़िल्टर को डेटा देता है।',
  ['On — it is a count, so it costs nothing.']: 'चालू — यह एक गिनती है, इसलिए इसका कोई खर्च नहीं।',
  ['With a Subfolder-scoped crawl, links pointing outside the start folder are fetched once so their status code is known, then stopped — they are checked, not crawled through. Off leaves them undiscovered entirely.']:
    'सबफ़ोल्डर-दायरे वाले क्रॉल में शुरुआती फ़ोल्डर के बाहर के लिंक एक बार फ़ेच होते हैं ताकि उनका स्टेटस कोड पता चले, फिर रुक जाते हैं — जाँचे जाते हैं, क्रॉल नहीं किए जाते। बंद उन्हें पूरी तरह अनखोजा छोड़ देता है।',
  ['On — knowing a link out of /blog/ is a 404 costs one request.']:
    'चालू — /blog/ से बाहर जाने वाला लिंक 404 है यह जानने में एक अनुरोध लगता है।',
  ["Off restricts the crawl to URLs under the start URL's path (Crawl Scope = Subfolder). On lets it cover the whole host. This is a view of the Crawl Scope setting, not a separate switch, so the two can never disagree."]:
    'बंद क्रॉल को शुरुआती URL के पथ के नीचे के URL तक सीमित करता है (क्रॉल दायरा = सबफ़ोल्डर)। चालू पूरे होस्ट को कवर करने देता है। यह क्रॉल दायरा सेटिंग का एक दृश्य है, अलग स्विच नहीं, इसलिए दोनों कभी असहमत नहीं हो सकते।',
  ['Off to audit just /blog/; on for the whole site.']:
    'केवल /blog/ का ऑडिट करने के लिए बंद; पूरी साइट के लिए चालू।',
  ['Treats every host sharing the registrable domain as internal — shop.example.com and blog.example.com crawl alongside example.com instead of counting as external. Another view of the Crawl Scope setting.']:
    'पंजीकरण योग्य डोमेन साझा करने वाले हर होस्ट को आंतरिक मानता है — shop.example.com और blog.example.com बाहरी गिने जाने के बजाय example.com के साथ क्रॉल होते हैं। क्रॉल दायरा सेटिंग का एक और दृश्य।',
  ['On when subdomains are part of the same property.']:
    'जब सबडोमेन एक ही प्रॉपर्टी का हिस्सा हों तो चालू।',
  ['Crawl through rel="nofollow" links pointing at the same site. Off (default) is Screaming Frog "Respect Nofollow" behaviour. Internal and external are separate switches because sites nofollow them for opposite reasons — crawl-budget shaping vs. not vouching for a third party.']:
    'उसी साइट की ओर इशारा करने वाले rel="nofollow" लिंक से होकर क्रॉल करें। बंद (डिफ़ॉल्ट) Screaming Frog "Respect Nofollow" व्यवहार है। आंतरिक और बाहरी अलग स्विच हैं क्योंकि साइटें विपरीत कारणों से उन्हें nofollow करती हैं — क्रॉल-बजट आकार देना बनाम तृतीय पक्ष की ज़मानत न लेना।',
  ['On when a site nofollows its own faceted navigation and you need behind it.']:
    'जब कोई साइट अपने फ़ेसेटेड नेविगेशन को nofollow करे और आपको उसके पीछे जाना हो तो चालू।',
  ['Crawl through rel="nofollow" links pointing at other hosts. Only has an effect while External Links → Crawl is on.']:
    'अन्य होस्ट की ओर इशारा करने वाले rel="nofollow" लिंक से होकर क्रॉल करें। केवल तब प्रभावी जब बाहरी लिंक → क्रॉल चालू हो।',
  ['Off — nofollowed externals are exactly the ones you did not vouch for.']:
    'बंद — nofollow किए बाहरी लिंक ठीक वही हैं जिनकी आपने ज़मानत नहीं ली।',
  ['Record hrefs that cannot be parsed as a URL — unencoded whitespace inside the authority, doubled schemes, stray delimiters. They can never resolve to a crawled page, so every one is reported in Broken Links, which is the point. Deliberate non-navigable schemes (mailto:, tel:, #) are not malformed and never appear.']:
    'URL के रूप में पार्स न हो सकने वाले href दर्ज करें — अथॉरिटी में अनएन्कोडेड व्हाइटस्पेस, दोहरे स्कीम, आवारा सीमांकक। वे कभी क्रॉल किए पेज में हल नहीं हो सकते, इसलिए हर एक टूटे लिंक में रिपोर्ट होता है, यही उद्देश्य है। जानबूझकर गैर-नेविगेशन स्कीम (mailto:, tel:, #) विकृत नहीं हैं और कभी नहीं दिखते।',
  ['On when hunting hand-written markup errors; off keeps Broken Links focused on real 404s.']:
    'हाथ से लिखी मार्कअप त्रुटियाँ खोजते समय चालू; बंद रखने से टूटे लिंक असली 404 पर केंद्रित रहते हैं।',
  ['Off drops every discovered URL carrying a `?`, before robots and before a request goes out. That is the cheap way to stop a faceted navigation (?color=red&size=xl&sort=price) from spending the whole URL budget on one product listing wearing a thousand URLs. The start URL is always crawled, and subresources are exempt — style.css?v=7 is a cache-buster, not a facet. Skipped URLs are counted and reported in the log, never dropped silently.']:
    'बंद हर खोजे गए `?` वाले URL को robots से पहले और अनुरोध जाने से पहले हटा देता है। यह फ़ेसेटेड नेविगेशन (?color=red&size=xl&sort=price) को हज़ार URL का रूप धरे एक उत्पाद सूची पर पूरा URL बजट खर्च करने से रोकने का सस्ता तरीका है। शुरुआती URL हमेशा क्रॉल होता है, और उप-संसाधन छूट में हैं — style.css?v=7 कैश-बस्टर है, फ़ेसेट नहीं। छोड़े गए URL गिने और लॉग में रिपोर्ट किए जाते हैं, कभी चुपचाप नहीं गिराए जाते।',
  ['On (default). Off for a first pass over a shop with faceted filters.']:
    'चालू (डिफ़ॉल्ट)। फ़ेसेटेड फ़िल्टर वाली दुकान पर पहले पास के लिए बंद।',
  ['Parameter names that keep a URL in the crawl anyway — pagination, a language switch, a product id. Names only; values are not looked at, and matching ignores case. A URL is admitted only when every parameter it carries is on this list: ?page=2 passes, ?page=2&color=red does not. Any-match would defeat the point, since a facet URL nearly always carries the pagination parameter too.']:
    'पैरामीटर नाम जो URL को फिर भी क्रॉल में रखते हैं — पेजिनेशन, भाषा स्विच, उत्पाद id। केवल नाम; मान नहीं देखे जाते, और मिलान केस अनदेखा करता है। URL केवल तब स्वीकार होता है जब उसका हर पैरामीटर इस सूची में हो: ?page=2 पास, ?page=2&color=red नहीं। कोई-भी-मिलान उद्देश्य को विफल कर देता, क्योंकि फ़ेसेट URL लगभग हमेशा पेजिनेशन पैरामीटर भी ले जाता है।',
  ['page, lang — keeps paginated archives reachable while the facets stay out.']:
    'page, lang — पेजिनेटेड आर्काइव पहुँच योग्य रहते हैं जबकि फ़ेसेट बाहर रहते हैं।',
  ['Auto-discovery on its own only records sitemap entries, which is what the sitemap issue filters compare the crawl against. Turning this on crawls them too — and that is what surfaces orphans: pages the sitemap declares but nothing on the site links to.']:
    'स्वतः-खोज अकेले केवल साइटमैप प्रविष्टियाँ दर्ज करती है, जिनसे साइटमैप समस्या फ़िल्टर क्रॉल की तुलना करते हैं। इसे चालू करने से वे क्रॉल भी होती हैं — और यही अनाथ पेज सामने लाता है: वे पेज जिन्हें साइटमैप घोषित करता है पर साइट पर कुछ लिंक नहीं करता।',
  ['On for an orphan-page audit.']: 'अनाथ-पेज ऑडिट के लिए चालू।',
  ['Reads Sitemap: directives from /robots.txt plus the conventional /sitemap.xml fallbacks at crawl start. Cheap I/O, and it powers every sitemap issue filter.']:
    'क्रॉल शुरू होने पर /robots.txt से Sitemap: निर्देश और पारंपरिक /sitemap.xml विकल्प पढ़ता है। सस्ता I/O, और हर साइटमैप समस्या फ़िल्टर को चलाता है।',
  ['On (default).']: 'चालू (डिफ़ॉल्ट)।',
  ['Explicit sitemap URLs, one per line. Their entries are always both recorded and queued as crawl seeds — use this when the sitemap lives somewhere robots.txt never mentions.']:
    'स्पष्ट साइटमैप URL, प्रति पंक्ति एक। उनकी प्रविष्टियाँ हमेशा दर्ज भी होती हैं और क्रॉल सीड के रूप में कतारबद्ध भी — तब इस्तेमाल करें जब साइटमैप ऐसी जगह हो जिसका robots.txt कभी ज़िक्र नहीं करता।',
  ['Treat the concurrency and RPS above as a ceiling and let the target server set the real pace. On a 429/503 (or a Retry-After header) the crawler pauses for the penalty window and steps the rate + concurrency down; after a sustained run of clean responses it grows them back toward the ceiling. Off = hold the configured rate no matter how the server responds.']:
    'ऊपर की समांतरता और RPS को सीमा मानें और लक्ष्य सर्वर को वास्तविक गति तय करने दें। 429/503 (या Retry-After हेडर) पर क्रॉलर दंड अवधि के लिए रुकता है और दर + समांतरता घटाता है; साफ़ प्रतिक्रियाओं की निरंतर श्रृंखला के बाद उन्हें फिर सीमा की ओर बढ़ाता है। बंद = सर्वर चाहे जैसे जवाब दे, कॉन्फ़िगर की गई दर बनाए रखें।',
  ['Turn on for sites behind Cloudflare / a WAF that returns 429s; leave off for your own infrastructure where the fixed rate is safe.']:
    'Cloudflare / 429 लौटाने वाले WAF के पीछे की साइटों के लिए चालू करें; अपने इंफ्रास्ट्रक्चर के लिए बंद रखें जहाँ निश्चित दर सुरक्षित है।',
  ['Sorts query parameters alphabetically at normalisation time. Repeated keys keep their relative order, so ?tag=a&tag=b is preserved. Without this the two orderings occupy separate rows and read as duplicates.']:
    'सामान्यीकरण के समय क्वेरी पैरामीटर वर्णानुक्रम में क्रमबद्ध करता है। दोहराई गई कुंजियाँ अपना सापेक्ष क्रम रखती हैं, इसलिए ?tag=a&tag=b संरक्षित रहता है। इसके बिना दोनों क्रम अलग पंक्तियों में जाते हैं और डुप्लिकेट पढ़े जाते हैं।',
  ['On for most sites; off if your server routes on positional parameter order.']:
    'अधिकांश साइटों के लिए चालू; यदि आपका सर्वर पैरामीटर के स्थान-क्रम पर रूट करता है तो बंद।',
  ['Collapses runs of slashes in the path to a single slash. Applied before the trailing-slash policy. Web servers serve these identically, so the duplicate-slash variant is normally a false duplicate.']:
    'पथ में लगातार स्लैश को एक स्लैश में समेटता है। अंतिम-स्लैश नीति से पहले लागू। वेब सर्वर इन्हें एक जैसा परोसते हैं, इसलिए दोहरे-स्लैश वैरिएंट आमतौर पर झूठा डुप्लिकेट है।',
  ['On if a template bug emits //  in links; off if your framework uses empty path segments as data.']:
    'यदि कोई टेम्पलेट बग लिंक में //  निकालता है तो चालू; यदि आपका फ़्रेमवर्क खाली पथ खंडों को डेटा के रूप में इस्तेमाल करता है तो बंद।',
  ["Off by default: verify the login page's TLS certificate before typing credentials into it. Enable only for a trusted internal host with a self-signed certificate — an unverifiable certificate on a login page is a man-in-the-middle risk."]:
    'डिफ़ॉल्ट बंद: लॉगिन पेज में क्रेडेंशियल टाइप करने से पहले उसका TLS प्रमाणपत्र सत्यापित करें। केवल स्व-हस्ताक्षरित प्रमाणपत्र वाले विश्वसनीय आंतरिक होस्ट के लिए चालू करें — लॉगिन पेज पर असत्यापित प्रमाणपत्र मैन-इन-द-मिडल जोखिम है।',
  ["Hooks the History API before the page's own scripts run, so routes an SPA reaches via pushState / replaceState / popstate are discovered and crawled. Also keeps hash routes (#/about) as distinct URLs instead of collapsing them onto the shell document."]:
    'पेज की अपनी स्क्रिप्ट चलने से पहले History API को हुक करता है, ताकि SPA जिन रूट तक pushState / replaceState / popstate से पहुँचती है वे खोजे और क्रॉल किए जाएँ। हैश रूट (#/about) को भी शेल दस्तावेज़ में समेटने के बजाय अलग URL के रूप में रखता है।',
  ['On for React Router / Vue Router / Angular sites whose pages never produce a document request.']:
    'React Router / Vue Router / Angular साइटों के लिए चालू जिनके पेज कभी दस्तावेज़ अनुरोध नहीं बनाते।',
  ['`<link rel="alternate" media="only screen and (max-width: …)" href="…">` value — the separate-URL (m-dot) mobile version of this page. Empty on responsive sites, which is most of them. A value here with no reciprocal canonical pointing back is the classic broken m-dot setup.']:
    '`<link rel="alternate" media="only screen and (max-width: …)" href="…">` का मान — इस पेज का अलग-URL (m-dot) मोबाइल संस्करण। रिस्पॉन्सिव साइटों पर खाली, जो अधिकांश हैं। यहाँ मान हो पर वापस इशारा करने वाला कोई पारस्परिक कैनोनिकल न हो तो यह क्लासिक टूटा m-dot सेटअप है।',
};
