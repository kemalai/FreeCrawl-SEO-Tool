/**
 * Turkish integration setup guides. Generated from the guide source —
 * see `./index.ts` for how a locale is picked. Keep the step count,
 * links and `lastReviewed` in lockstep with `en.ts`; the parity test
 * in `tests/` compares them.
 */
import type { Guide } from './types.js';

export const GUIDES_TR: Record<string, Guide> = {
  openai: {
    intro:
      "OpenAI'in API'sini kullanarak her URL için özel bir prompt çalıştırırsın — içerik analizi, title önerisi, açıklama özeti gibi. Kullanım kendi OpenAI hesabına faturalanır (FreeCrawl bedava aracılık yapar, API çağrıları senin hesabından düşer).",
    prereqs: [
      'OpenAI hesabı (https://platform.openai.com adresinden ücretsiz açılır).',
      'Geçerli bir ödeme yöntemi (kredi kartı) — OpenAI API anahtarları $5 minimum bakiye gerektirir.',
    ],
    steps: [
      {
        title: "platform.openai.com'a giriş yap",
        detail:
          'OpenAI hesabınla giriş yapmak için bu URL\'i aç. Eğer henüz hesabın yoksa "Sign up" ile aç.',
        link: {
          label: 'platform.openai.com',
          url: 'https://platform.openai.com',
        },
      },
      {
        title: 'Sol menüden "API keys"\'e tıkla',
        detail: 'Sol kenar çubuğunda anahtar ikonlu menü maddesi. Direkt URL ile de gidebilirsin.',
        link: {
          label: 'API keys sayfası',
          url: 'https://platform.openai.com/api-keys',
        },
      },
      {
        title: 'Sağ üstte "+ Create new secret key" butonuna bas',
        detail:
          'Açılan dialog\'a:\n• Name: "FreeCrawl SEO Tool" (istediğin isim, hatırlatıcı için)\n• Project: Default project veya istediğin project\n• Permissions: All (en kolayı; daha kısıtlı izinler de iş görür)\nsonra "Create secret key" butonuna bas.',
      },
      {
        title: 'Anahtarı KOPYALA — bir daha gösterilmez',
        detail:
          'Anahtar `sk-...` ile başlar. Şimdi kopyalamazsan bir daha hiç göremezsin (kaybedersen yenisini oluşturman gerekir). Tarayıcı sekmesinde tutmamak için bir parola yöneticisine kaydet.',
      },
      {
        title: 'Anahtarı bu pencerenin "API Key" alanına yapıştır + Save\'e bas',
        detail:
          "FreeCrawl anahtarı OS'un güvenli credential store'unda (Windows: DPAPI, macOS: Keychain, Linux: Secret Service) şifreli olarak saklar. Düz metin dosyaya yazılmaz.",
      },
      {
        title: 'AI sekmesinde test et',
        detail:
          'Settings\'i kapat → üst tab bar\'dan "AI" sekmesine git → bir crawl çalıştırdıysan birkaç URL seç → "Run AI" butonuna bas. İlk çağrı ~2-3sn sürer.',
      },
    ],
    troubleshooting: [
      {
        problem: '"You exceeded your current quota"',
        solution:
          'OpenAI hesabında bakiye yok veya bitti. platform.openai.com → Billing → "Add payment method" ile kredi kartı ekle ve $5+ bakiye yükle. Yeni hesaplarda otomatik kredi yoksa manuel yüklemen gerekir.',
      },
      {
        problem: '"Incorrect API key provided" / 401 hatası',
        solution:
          'Anahtarı yapıştırırken başında/sonunda boşluk kalmış olabilir. Yeni bir anahtar oluştur, dikkatli kopyala-yapıştır. Eski anahtarı revoke etmeyi unutma.',
      },
      {
        problem: '"Rate limit exceeded"',
        solution:
          "Çok hızlı paralel istek atıyorsun. Settings → AI panelinde concurrency'yi düşür (varsayılan: 3). OpenAI Tier 1 hesaplar için RPM limiti modele göre 500-3500 arası değişir.",
      },
    ],
    notes: [
      'Maliyet: gpt-4o-mini ~$0.15/1M input token, gpt-4o ~$2.50/1M input token (2026-06 fiyatları). 1000 URL için tipik prompt + cevap ~$0.50-2 arası.',
      'Hesabını "Usage limits" sayfasında aylık hard limit ile koru — kazara crawl 1M URL tetiklersen 1000$\'lık fatura görmek istemezsin.',
    ],
    lastReviewed: '2026-06-01',
  },
  anthropic: {
    intro:
      "Anthropic'in Claude API'siyle her URL için özel prompt çalıştırırsın. Claude'un en güçlü modelleri (Sonnet 4.6, Opus 4.8) gerçek SEO analizi için OpenAI'a göre daha az \"yapay\" çıktı verir. Kullanım kendi Anthropic hesabına faturalanır.",
    prereqs: [
      'Anthropic hesabı (https://console.anthropic.com adresinden açılır).',
      'Ödeme yöntemi eklenmiş Anthropic hesabı (ilk kullanıcılara $5 promo kredi var).',
    ],
    steps: [
      {
        title: "console.anthropic.com'a giriş yap",
        link: {
          label: 'console.anthropic.com',
          url: 'https://console.anthropic.com',
        },
      },
      {
        title: 'Sağ üst dropdown\'dan "API Keys"\'i seç',
        detail: 'Veya direkt URL ile git. Settings menüsünün altında "API Keys" maddesi var.',
        link: {
          label: 'API Keys sayfası',
          url: 'https://console.anthropic.com/settings/keys',
        },
      },
      {
        title: '"+ Create Key" butonuna bas',
        detail:
          'Açılan dialog:\n• Name: "FreeCrawl SEO Tool"\n• Workspace: Default workspace (varsayılan)\n• Environment: Production\nsonra "Create Key" butonuna bas.',
      },
      {
        title: 'Anahtarı KOPYALA — bir daha gösterilmez',
        detail: 'Anahtar `sk-ant-...` ile başlar. Kaybedersen yenisini oluşturman gerek.',
      },
      {
        title: 'Anahtarı bu pencerenin "API Key" alanına yapıştır + Save',
      },
      {
        title: 'Optional: Model seçimi',
        detail:
          'Anthropic Claude Console\'dan model seçmek için Settings → AI panelinde "Model" alanına bir model adı yazabilirsin (varsayılan: claude-sonnet-4-6). Hız önemliyse claude-haiku-4-5 (~10x daha ucuz, 3x daha hızlı), kalite önemliyse claude-opus-4-8.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Your credit balance is too low"',
        solution:
          'console.anthropic.com → Settings → Billing → "Add credits" ile bakiye yükle. Minimum $5.',
      },
      {
        problem: '"Number of request tokens has exceeded your rate limit"',
        solution:
          "Tier 1 hesaplar dakikada ~50 request alır. Settings → AI panelinde concurrency'yi 2-3'e düşür. Daha yüksek tier için $25+ harcaman gerekir (Tier 2: 1000 RPM).",
      },
      {
        problem: '"Invalid API key"',
        solution:
          'Anahtarın başında "sk-ant-" prefix\'ini koruduğundan emin ol. Boşluk olmasın. Test için console.anthropic.com → API Keys sayfasında anahtar listede aktif görünüyorsa anahtar geçerlidir.',
      },
    ],
    notes: [
      'Maliyet (2026-06): Haiku 4.5 ~$0.25/1M input + $1.25/1M output; Sonnet 4.6 ~$3/1M input + $15/1M output; Opus 4.8 ~$15/1M input + $75/1M output.',
      "Anthropic prompt caching destekliyor — uzun system prompt'lar 5dk içinde tekrar kullanılırsa 90% indirimli (FreeCrawl AI panel'i şu an caching kullanmıyor, sonraki sürümde gelecek).",
    ],
    lastReviewed: '2026-06-01',
  },
  ollama: {
    intro:
      "Ollama, kendi makinende lokal olarak çalışan açık-kaynak LLM'ler için bir runtime. API anahtarı YOK, ücretsiz, internet bağlantısı bile şart değil. Maliyet sıfır; tek dezavantaj büyük modelleri çalıştırmak için VRAM gerekiyor.",
    prereqs: [
      'macOS 12+, Windows 10+, veya Linux (Ubuntu 22.04+ önerilir).',
      'En az 8 GB RAM (küçük modeller için). Llama 3.2 3B model ~2 GB VRAM/RAM ister.',
      "GPU önerilir ama şart değil — CPU'da da çalışır (daha yavaş).",
    ],
    steps: [
      {
        title: "Ollama'yı indir + kur",
        detail:
          "İşletim sistemine göre installer indir:\n• Windows: OllamaSetup.exe\n• macOS: Ollama.dmg\n• Linux: curl -fsSL https://ollama.com/install.sh | sh\n\nKurulduktan sonra Ollama otomatik olarak arka planda çalışır (system tray'de ikon görünür).",
        link: {
          label: 'ollama.com/download',
          url: 'https://ollama.com/download',
        },
      },
      {
        title: 'Bir model indir',
        detail:
          'Terminal aç ve şunu çalıştır:\n\n  ollama pull llama3.2\n\nllama3.2 (3B parametre) ~2GB indirir, hızlı + düşük kaynak. Daha güçlü:\n  ollama pull llama3.3:70b   (~40GB, sadece güçlü GPU)\n  ollama pull qwen2.5:7b     (~4GB, dengeli)\n  ollama pull mistral:7b     (~4GB, alternatif)',
      },
      {
        title: 'Modeli test et',
        detail:
          'Terminal\'de:\n  ollama run llama3.2\n\nİnteraktif chat açılır, "merhaba" yaz, cevap geliyorsa OK. Çıkmak için Ctrl+D.',
      },
      {
        title: "Ollama endpoint'ini bu paneldeki alana gir",
        detail:
          "Varsayılan: http://localhost:11434 (zaten ön-dolu). Eğer Ollama'yı farklı portta çalıştırıyorsan onu kullan.",
      },
      {
        title: 'Model alanına indirdiğin model adını yaz',
        detail:
          'Örn: "llama3.2" veya "qwen2.5:7b". Adım 2\'de indirdiğin modelin adı. Boş bırakırsan FreeCrawl ilk available modeli seçer.',
      },
      {
        title: 'Save + test',
        detail:
          "AI sekmesinde küçük bir batch çalıştır. CPU modunda her URL ~5-15sn alabilir; GPU'da ~1-3sn.",
      },
    ],
    troubleshooting: [
      {
        problem: 'AI sekmesi "Connection refused" hatası veriyor',
        solution:
          'Ollama çalışmıyor. Terminal\'de "ollama serve" çalıştır veya system tray\'den Ollama uygulamasını başlat. Windows\'ta Start menüden "Ollama" aramayı dene.',
      },
      {
        problem: '"model \'X\' not found"',
        solution:
          'Model indirilmemiş. Terminal\'de "ollama pull <model-adı>" çalıştır. "ollama list" komutuyla mevcut modellerini görebilirsin.',
      },
      {
        problem: 'Cevaplar çok yavaş (>30sn/URL)',
        solution:
          "Model GPU'ya sığmıyor, CPU swap'a düşüyor. Daha küçük model dene (llama3.2:1b veya phi3:mini). VRAM ihtiyacı: 3B model ~2GB, 7B model ~4GB, 13B model ~8GB.",
      },
    ],
    notes: [
      'Tamamen offline çalışır — internet bağlantısı kesilse bile crawl + AI analizi devam eder.',
      'Lokal modellerin SEO analizi kalitesi: 3B modeller hafif yetersiz, 7-13B modeller iyi, 70B modeller GPT-4 seviyesi (ama ciddi donanım ister).',
      "Bağlantı tipi: Settings → AI → Concurrency'yi 1-2'de tut — yerel model paralel istekleri sırayla işler.",
    ],
    lastReviewed: '2026-06-01',
  },
  pagespeed: {
    intro:
      "Google PageSpeed Insights, her URL'i Lighthouse ile audit eder ve Performance/SEO/Accessibility/Best-Practices skorları + Core Web Vitals (LCP/CLS/INP) döner. Free API anahtarı ile günde 25.000 URL audit edebilirsin.",
    prereqs: ['Google hesabı.', 'Google Cloud Console projesi (yoksa adımlarda oluşturursun).'],
    steps: [
      {
        title: "Google Cloud Console'a gir",
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Bir project seç veya oluştur',
        detail:
          'Üst soldaki project dropdown\'a tıkla → "New Project" → isim: "FreeCrawl SEO" → Create. Billing account ZORUNLU DEĞİL (PSI free tier sadece authentication için credentials ister).',
      },
      {
        title: "PageSpeed Insights API'yı enable et",
        detail: "Bu link doğrudan API'nin enable sayfasını açar:",
        link: {
          label: 'PageSpeed Insights API → Enable',
          url: 'https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com',
        },
      },
      {
        title: 'Mavi "Enable" butonuna bas → 30sn bekle',
      },
      {
        title: 'Credentials sayfasına git',
        link: {
          label: 'Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: '"+ Create Credentials" → "API key" seç',
        detail: "Bir API key string'i üretilir (`AIzaSy...` ile başlar). Hemen kopyala.",
      },
      {
        title: "Optional: API key'i kısıtla (önerilir)",
        detail:
          'Açılan dialog\'dan "Edit API key" → "Restrict key" altında:\n• API restrictions: "Restrict key" → "PageSpeed Insights API"\n• Application restrictions: "None" (FreeCrawl desktop app olduğu için referrer/IP filtrelemesi işe yaramaz)\nKısıtlama yapmasan da çalışır, ama tavsiye ederiz.',
      },
      {
        title: 'Anahtarı bu pencerenin "API Key" alanına yapıştır + Save',
      },
      {
        title: 'PageSpeed sekmesinde test',
        detail:
          'Üst tab bar\'dan "PageSpeed" sekmesine git → birkaç URL seç → "Run audit" butonuna bas. İlk audit ~10-15sn sürer.',
      },
    ],
    troubleshooting: [
      {
        problem: '"This API method requires billing to be enabled" hatası',
        solution:
          'Yanlış API\'yı enable etmişsin (örn. "Cloud PageSpeed Insights API" eski sürümü). Doğru olan "PageSpeed Insights API" (pagespeedonline.googleapis.com). Adım 3\'teki linki tekrar aç.',
      },
      {
        problem: '"API key not valid"',
        solution:
          'API key kısıtlamaları yanlış. Cloud Console → Credentials → key\'e tıkla → "API restrictions" PageSpeed Insights API içeriyor mu kontrol et. Veya kısıtlamayı tamamen "Don\'t restrict" yap.',
      },
      {
        problem: '"Quota exceeded" — 25.000\'den önce',
        solution:
          "Free tier per-minute limit'i de var: 240 query/dakika. FreeCrawl Settings → PageSpeed → Concurrency'yi 2-3'te tut. Day quota 25K — bu çok yüksek, normal kullanımda görmezsin.",
      },
    ],
    notes: [
      "Maliyet: FREE — Google PSI API'nin para istemediği nadir API'lardan biri. Anonymous/keyless mod artık 0 query/gün (2026 başında kapatıldı), o yüzden key zorunlu.",
      "Hız: her URL ~5-10sn (Google'in Lighthouse instance'ı çalıştırıyor). 1000 URL için ~2 saat sürer.",
      'Mobile + Desktop ayrı API çağrısı sayılır — "both" seçersen quota 2 katı tüketilir.',
    ],
    lastReviewed: '2026-06-01',
  },
  ahrefs: {
    intro:
      "Ahrefs'in API'siyle her URL için backlink sayısı, domain rating, referring domains, organic keywords sayısı çekersin. Bu Ahrefs'in en pahalı entegrasyonu — API access ücretli, ayda $500+ subscription gerektirir.",
    prereqs: [
      'Ahrefs Standard ($249/ay) veya üstü subscription.',
      'Ayrıca "API" eklentisi (subscription üstüne ek $500/ay veya farklı tier).',
    ],
    steps: [
      {
        title: 'Ahrefs hesabına gir → API sayfası',
        link: {
          label: 'ahrefs.com/api',
          url: 'https://ahrefs.com/api',
        },
      },
      {
        title: "Subscription seç (eğer henüz API access'in yoksa)",
        detail:
          "API v3 access'i sadece Enterprise tier ve özel API plan ile geliyor. Sales'tan teklif al.",
      },
      {
        title: 'Hesabında "API Token" üret',
        detail:
          'Ahrefs dashboard → Account settings → API → Generate token. Token sk-... veya benzer formatta.',
      },
      {
        title: 'Token\'ı bu panelin "API Key" alanına yapıştır + Save',
      },
      {
        title: 'SEO Authority sekmesinde test',
        detail:
          'Üst tab bar\'dan "SEO Authority" sekmesine git → provider olarak "Ahrefs" seç → birkaç URL seç → "Run" butonuna bas.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient credits" hatası',
        solution:
          'API row units bitmiş. Ahrefs dashboard → API → "Usage" sekmesinden kalan unit\'leri gör. Subscription\'ı yükselt veya yeni billing dönemini bekle.',
      },
      {
        problem: '"Unauthorized"',
        solution:
          'API access subscription\'a dahil değil. Sadece "Ahrefs Standard" almakla API hakkı kazanmazsın — ayrıca API tier seçmen gerek.',
      },
    ],
    notes: [
      "Maliyet: ortalama 1 URL audit'i 1-5 API row tüketir. Standard API plan ~25K row/ay.",
      'Alternatif: Daha ekonomik olarak Moz ($99/ay, Domain Authority verir) veya Majestic kullanılabilir.',
    ],
    lastReviewed: '2026-06-01',
  },
  majestic: {
    intro:
      "Majestic'in API'siyle Trust Flow, Citation Flow ve backlink sayıları çekilir. Backlink-odaklı SEO analizine en uygun ve ekonomik provider'dan biri.",
    prereqs: [
      'Majestic Lite ($49.99/ay) veya üstü subscription.',
      'API access — Lite plan ile gelir.',
    ],
    steps: [
      {
        title: "Majestic developer dashboard'a gir",
        link: {
          label: 'majestic.com/account/api',
          url: 'https://majestic.com/account/api',
        },
      },
      {
        title: 'API key üret',
        detail: 'Dashboard\'da "Open API" sekmesi → "Generate new key" → key kopyala.',
      },
      {
        title: 'Bu panele yapıştır + Save',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient resources" / "No analysis units"',
        solution:
          "Aylık analysis unit kotanı tükettin. Lite plan 1000 units/ay; Pro plan 20K+. Majestic dashboard → API → usage'a bak.",
      },
    ],
    notes: ["Maliyet: 1 URL backlink lookup'ı 5 unit. Lite plan (1000 unit) ~200 URL/ay."],
    lastReviewed: '2026-06-01',
  },
  moz: {
    intro:
      'Moz API ile Domain Authority (DA), Page Authority (PA) ve Spam Score çekilir. Düşük bütçeli SEO için en popüler seçenek.',
    prereqs: ['Moz Pro Standard ($99/ay) veya üstü subscription, "Moz API" eklenti aktif olmalı.'],
    steps: [
      {
        title: 'Moz API sayfasına gir',
        link: {
          label: 'moz.com/api',
          url: 'https://moz.com/api',
        },
      },
      {
        title: 'Account → API → "Generate Credentials" butonuna bas',
        detail: 'İki değer üretilir: "Access ID" ve "Secret Key". İkisini de kopyala.',
      },
      {
        title: 'Bu panelin "Access ID" + "Secret Key" alanlarına yapıştır + Save',
        detail: 'İki ayrı alan var; sırasıyla doldur.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Authentication failed"',
        solution:
          "Access ID veya Secret Key yanlış yazılmış. Moz dashboard'dan yeniden kopyala — Access ID kısa (~13 karakter), Secret Key uzun (~40 karakter).",
      },
    ],
    notes: ['Maliyet: Standard plan (1500 rows/ay), Medium (10K rows/ay), Large (100K rows/ay).'],
    lastReviewed: '2026-06-01',
  },
  semrush: {
    intro:
      'Semrush API ile organic keywords, traffic estimates, SERP features çekilir. Anahtar kelime ve trafik analizi için en kapsamlı veri.',
    prereqs: [
      'Semrush Pro ($129/ay) veya üstü subscription.',
      '"API units" hesabına bağlı (Guru plan ve üstü API\'ye dahil).',
    ],
    steps: [
      {
        title: "Semrush'a gir → Subscription info → API",
        link: {
          label: 'Semrush API access',
          url: 'https://www.semrush.com/accounts/subscription-info/api-units/',
        },
      },
      {
        title: 'API key kopyala',
      },
      {
        title: 'Bu panele yapıştır + Save',
      },
    ],
    troubleshooting: [
      {
        problem: '"API units exhausted"',
        solution:
          'Aylık unit kotanı bitirdin. Guru plan 7K units/ay, Business 25K+. Semrush dashboard → API → usage.',
      },
    ],
    notes: ['Maliyet: 1 URL backlinks query 10 unit, 1 domain overview 1 unit.'],
    lastReviewed: '2026-06-01',
  },
  gsc: {
    intro:
      'Google Search Console API ile her crawl edilmiş URL için clicks, impressions, CTR, average position metriklerini Google\'dan çekersin. URL Inspection API ile coverage verdict + last-crawl-time de mümkün. "Bring your own client" model — kendi Google Cloud OAuth client\'ını oluşturup pasti, FreeCrawl shared bir aracı uygulama kullanmıyor.',
    prereqs: [
      "Google hesabı (bağlanacak GSC property'lerinin sahibi/sahiplerinden biri olmalı).",
      'En az bir Google Search Console property eklenmiş + doğrulanmış olmalı.',
    ],
    steps: [
      {
        title: "Google Cloud Console'a gir + yeni bir project oluştur",
        detail:
          'Üst soldaki project dropdown → "New Project" → isim: "FreeCrawl SEO Integrations" (veya istediğin) → Create. Bu project sadece OAuth credentials için, billing istemiyor.',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Google Auth Platform → Branding sayfasını aç',
        detail:
          'Sol menüden "APIs & Services" → "OAuth consent screen" (yeni UI: "Google Auth Platform → Branding"). User Type: "External" seç → Create.',
        link: {
          label: 'OAuth consent screen',
          url: 'https://console.cloud.google.com/auth/branding',
        },
      },
      {
        title: "OAuth consent screen'i doldur",
        detail:
          'Sadece zorunlu alanlar yeter:\n• App name: "FreeCrawl Local"\n• User support email: kendi email\'in\n• Developer contact information: kendi email\'in\nDiğer alanları boş bırakabilirsin. Save and Continue → Save and Continue → Save and Continue → Back to Dashboard.',
      },
      {
        title: "ÖNEMLİ: Test User olarak kendi email'ini ekle",
        detail:
          'Sol menüden "Audience" (eski UI\'da "Test users") → "Add users" → bağlanacağın Google account email\'ini yaz → Save.\n\nUYARI: BU ADIMI ATLAMA. Atlanırsa OAuth flow\'unda 403 access_denied hatası alırsın çünkü "Testing" status\'undaki app\'lere sadece test user listesindekiler bağlanabilir.',
        link: {
          label: 'Audience sayfası',
          url: 'https://console.cloud.google.com/auth/audience',
        },
      },
      {
        title: "Google Search Console API'yı enable et",
        detail:
          'Bu link API\'nin enable sayfasını direkt açar → Mavi "Enable" butonuna bas → 30sn bekle.',
        link: {
          label: 'Search Console API → Enable',
          url: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com',
        },
      },
      {
        title: 'OAuth Client ID oluştur',
        detail:
          'Sol menüden "Credentials" (yeni UI: "Google Auth Platform → Clients") → "+ Create credentials" → "OAuth client ID".',
        link: {
          label: 'Credentials sayfası',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'OAuth Client tipini "Desktop app" SEÇ (Web app değil!)',
        detail:
          'Application type dropdown\'dan "Desktop app" seç. Adı: "FreeCrawl SEO Tool". Create → açılan dialog\'da Client ID + Client Secret görünür. İkisini de kopyala (Client secret bir daha gösterilmez, mutlaka kaydet).\n\nNEDEN DESKTOP: FreeCrawl her bağlantıda rastgele bir local port (örn. 127.0.0.1:63092) kullanır. "Web application" tipinde redirect URI listesi sabit olmak zorunda, bu port her seferinde değişir → fail. "Desktop app" tipi localhost loopback redirect\'i otomatik kabul eder, port-agnostic.',
      },
      {
        title: "Client ID + Client Secret'i bu panele yapıştır + Save",
        detail:
          'İki alan: "OAuth Client ID" (...apps.googleusercontent.com) ve "OAuth Client Secret" (GOCSPX-...). Save\'e bas.',
      },
      {
        title: '"Connect" butonuna bas — tarayıcı açılır',
        detail:
          'Save sonrası kart üzerinde "Connect" butonu görünür. Bas → varsayılan tarayıcıda Google consent screen açılır.',
      },
      {
        title: 'Test user olarak eklediğin Google account ile giriş yap',
        detail:
          'Account picker\'da test users\'a eklediğin email\'i seç. "Continue" → "Google hasn\'t verified this app" uyarısı çıkacak (normal, test mode için beklenen). "Advanced" → "Go to FreeCrawl Local (unsafe)" tıkla → izinleri kabul et → consent → Allow.',
      },
      {
        title: 'FreeCrawl\'a dönüş — "Configured" görmen lazım',
        detail:
          'Settings dialog\'daki Search Console kartı yeşil "Configured" badge\'i göstermeli. Artık üst tab bar\'dan "Search Console" sekmesinde property listele + fetch yapabilirsin.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 access_denied"',
        solution:
          "Test user eklenmemiş veya yanlış Google account ile giriş yapıyorsun. Audience sayfasına dön, kullandığın account'un test users listesinde olduğunu kontrol et. Birden fazla Google account'un varsa hangisiyle giriş yaptığını account picker'dan görebilirsin.",
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'Search Console API enable edilmemiş VEYA OAuth consent ekranında "View Search Console data for your verified sites" izninin checkbox\'ı işaretlenmemiş. (1) Search Console API\'yı enable et (Adım 5), (2) myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → tekrar Connect yap ve consent screen\'inde tüm izinleri tikle.',
      },
      {
        problem: '"redirect_uri_mismatch"',
        solution:
          'OAuth client tipi yanlış. Credentials sayfasından client\'ı sil ve yeniden "Desktop app" tipiyle oluştur (Adım 7). "Web application" tipiyle çalışmaz.',
      },
      {
        problem: '"Bu app doğrulanmamış" uyarısı',
        solution:
          'Bu beklenen davranış (test mode app + sensitive scope). "Advanced" linkine tıkla → "Go to <app> (unsafe)" ile devam et. App testing mode\'da ve sadece test users\'a izin veriyor, güvenlidir.',
      },
      {
        problem: 'Bağlantı 7 gün sonra patladı',
        solution:
          'Testing modunda OAuth refresh token\'lar 7 günde bir expire olur. Settings → Integrations → Search Console → "Disconnect" → "Connect" ile yeniden bağlan. Production\'a geçmek için Google verification süreci gerekir (1-4 hafta).',
      },
    ],
    notes: [
      "Sahip olduğun property'ler (sc-domain:example.com veya https://example.com/) hesabının doğruladığı tüm site'ları içerir.",
      "GSC verisi ~2 gün lag'lidir — bugünün clicks'i hemen görünmez.",
      'Free quota: 1200 query/dakika, 25.000 query/gün — tipik kullanımda hiç görmezsin.',
    ],
    lastReviewed: '2026-06-01',
  },
  ga4: {
    intro:
      'Google Analytics 4 ile her URL için sessions, users, bounce rate, engagement rate, conversions çekersin. "Bring your own client" — kendi GCP OAuth client\'ını kullanır.',
    prereqs: [
      'Google hesabı + bağlanacak GA4 property\'sinde en az "Viewer" rolüne sahip olmalı.',
      "GSC için kurduğun aynı OAuth client'ı tekrar kullanabilirsin (sadece API enable etmen yeter).",
    ],
    steps: [
      {
        title: "GSC kurulumu yaptıysan: AYNI OAuth client'ı kullan",
        detail:
          "Eğer Search Console kurulumunu daha önce yaptıysan, aynı Google Cloud project'i ve OAuth Client ID + Secret'ı kullanabilirsin. Tekrar oluşturman gerekmez — sadece aşağıdaki API'ları enable et + bu panele yapıştır.",
      },
      {
        title: "GA4 için GEREKLİ iki API'yı enable et",
        detail:
          'GA4 için iki ayrı API gerekir:\n\n1. Google Analytics Admin API (property listing için)\n2. Google Analytics Data API (asıl raporlar için)\n\nİkisini de enable etmezsen "API not enabled" hatası alırsın.',
        link: {
          label: 'Admin API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com',
        },
      },
      {
        title: "Data API'yı da enable et",
        link: {
          label: 'Data API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
        },
      },
      {
        title: "GSC için kullandığın aynı Client ID + Secret'i bu panele yapıştır",
        detail:
          "Eğer GSC zaten bağlıysa, ayrıca paste etmen gerekmeyebilir (kart aynı credential'ı paylaşabilir). FreeCrawl'da her Google entegrasyonu kendi credential field'ına sahip — sıfırdan kuruyorsan GSC için yapılan setup'taki ID/Secret'i kopyala buraya da yapıştır.",
      },
      {
        title: '"Connect" → tarayıcıda Google\'a giriş + GA4 scope\'unu onayla',
        detail:
          'Test user olarak eklendiğin Google account ile giriş yap. Consent screen\'inde "Google Analytics: View Google Analytics property data" izninin işaretli olduğunu kontrol et.',
      },
      {
        title: 'GA4 sekmesinde property listele + fetch',
        detail:
          'Üst tab bar\'dan "GA4" sekmesine git. Önce "List Properties" ile bağlı hesabın altındaki tüm GA4 property\'leri görürsün. Birini seç → trailing window (7/28/90 gün) seç → "Fetch" butonuna bas. GA4 lag\'siz, sonuç anında geliyor.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Google Analytics Admin API has not been used in project X"',
        solution:
          "Admin API enable edilmemiş. Adım 2'deki linke git → Enable. 30sn bekle, tekrar dene. Aynı hatayı Data API için de görebilirsin — Adım 3'teki linke git ve onu da enable et.",
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          "OAuth scope GA4'i kapsamıyor. myaccount.google.com/permissions → \"FreeCrawl Local\" → Remove access → tekrar Connect → consent screen'de Google Analytics izinleri checkbox'ını tik'le.",
      },
      {
        problem: 'Property listesi boş geliyor',
        solution:
          "Bağlandığın Google account'un GA4 property'lerinde rolü yok. GA4 dashboard → Admin → Property Access Management → email'inin Viewer rolünde olduğunu kontrol et.",
      },
    ],
    notes: [
      'GA4 verisi neredeyse realtime — bugünün verisi 4-24 saat içinde görünür.',
      'Free quota: günde 200K request, dakikada 50 request per property.',
    ],
    lastReviewed: '2026-06-01',
  },
  sheets: {
    intro:
      "Google Sheets entegrasyonu ile crawl sonuçlarını doğrudan bir Google Sheet'e export edersin. CSV indirip Excel'de açmak yerine ekip arkadaşlarıyla canlı paylaşılan Sheet üzerinde çalışmak için ideal.",
    prereqs: ['Google hesabı.', "GSC için kurduğun aynı OAuth client'ı tekrar kullanabilirsin."],
    steps: [
      {
        title: "GSC/GA4 kurulumu yaptıysan: AYNI OAuth client'ı kullan",
        detail: "OAuth Client ID + Secret'ı yapıştır (varsa zaten kayıtlı).",
      },
      {
        title: "Google Sheets API'yı enable et",
        link: {
          label: 'Sheets API → Enable',
          url: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
        },
      },
      {
        title: "Google Drive API'yı da enable et",
        detail: "Sheets API spreadsheet okumak/yazmak için Drive API'ya da scope ister.",
        link: {
          label: 'Drive API → Enable',
          url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
        },
      },
      {
        title: 'Bu panelin Client ID + Secret alanlarına yapıştır + Save',
      },
      {
        title: '"Connect" → consent screen\'de Sheets + Drive izinlerini onayla',
        detail:
          "OAuth flow'unda iki ayrı izin göreceksin:\n• See, edit, create, and delete all your Google Sheets spreadsheets\n• See, edit, create, and delete only the specific Google Drive files used with this app\nİkisini de tikle.",
      },
      {
        title: 'Export menüsünden test',
        detail:
          'File → Export → "Export to Google Sheets". Yeni Sheet otomatik oluşturulur, URL kopyalanır.',
      },
    ],
    troubleshooting: [
      {
        problem: '"insufficient authentication scopes"',
        solution:
          "Connect ettiğinde Drive izin checkbox'ını tik'lememişsindir. Disconnect + Reconnect yap, iki izni de tik'le.",
      },
    ],
    notes: [
      "Sheets per-Sheet 10M cell hard limit'i var — büyük crawl'lar (>500K URL) split edilir.",
      'Drive scope "drive.file" — sadece FreeCrawl tarafından oluşturulan dosyalara erişim, mevcut dosyalarına dokunmaz.',
    ],
    lastReviewed: '2026-06-01',
  },
  bigquery: {
    intro:
      "BigQuery entegrasyonu ile crawl verisini direkt bir BigQuery dataset'ine stream edersin. Data warehouse'a tarih bazlı snapshot biriktirmek, BI tool (Looker Studio, Tableau, Metabase) ile crawl trendlerini görselleştirmek için kullanılır.",
    prereqs: [
      "Google Cloud project'i + BigQuery API enabled.",
      'BigQuery dataset oluşturulmuş.',
      'Service Account JSON (OAuth değil — server-to-server kimlik doğrulama).',
      'Billing açık bir GCP project (BigQuery free tier 10GB storage/ay + 1TB query/ay sonrası ücretli).',
    ],
    steps: [
      {
        title: 'BigQuery dataset oluştur',
        detail:
          'BigQuery Console → projeni seç → "Create dataset" → ID: "freecrawl_seo" (veya istediğin) → Location: "EU" veya "US" (önemli, sonradan değişmiyor) → Create dataset.',
        link: {
          label: 'BigQuery Console',
          url: 'https://console.cloud.google.com/bigquery',
        },
      },
      {
        title: 'Service Account oluştur',
        detail:
          'IAM & Admin → Service Accounts → "+ Create service account" → name: "freecrawl-bigquery" → Create and continue.',
        link: {
          label: 'Service Accounts',
          url: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
        },
      },
      {
        title: 'Rolleri ekle',
        detail:
          'İkinci adımda "Grant this service account access to project" → iki rol ekle:\n• BigQuery Data Editor\n• BigQuery Job User\nSonra "Continue" → "Done".',
      },
      {
        title: 'JSON key indir',
        detail:
          'Service account listesinde oluşturduğun account\'a tıkla → "Keys" sekmesi → "Add key" → "Create new key" → Type: JSON → Create.\n\nJSON dosyası otomatik bilgisayara indirilir. İçeriği kopyala (notepad/editör ile aç, tümünü seç ve kopyala).\n\nUYARI: Bu JSON tüm credential\'ı içerir, parola gibi davran. Source control\'a yükleme.',
      },
      {
        title: 'Bu panelin "Service Account JSON" alanına yapıştır',
        detail:
          "Tüm JSON içeriği (kapsayıcı `{` dan `}` a kadar) yapıştır. FreeCrawl JSON'u OS'un secure credential store'unda şifreli olarak saklar.",
      },
      {
        title: '"GCP Project ID" alanına project ID\'ni yaz',
        detail:
          'GCP project ID\'n (cloud console üst sol dropdown\'da görünür, örn. "my-gcp-project-12345"). JSON içinde "project_id" alanı da var, oradan kopyalayabilirsin.',
      },
      {
        title: 'Dataset adını da gir + Save',
        detail: 'Adım 1\'de oluşturduğun dataset adı (örn. "freecrawl_seo").',
      },
      {
        title: 'Export menüsünden test',
        detail:
          'File → Export → "Export to BigQuery" → tablo isim/format seç → çalıştır. BigQuery Console\'dan tablonun oluştuğunu doğrula.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 PermissionDenied: caller does not have permission"',
        solution:
          'Service account\'un IAM rolleri eksik. IAM & Admin → IAM → service account email\'ini bul → "BigQuery Data Editor" + "BigQuery Job User" rollerinde olduğunu kontrol et.',
      },
      {
        problem: '"Dataset X not found"',
        solution:
          'Dataset adını yanlış yazdın VEYA location uyumsuzluğu var (multi-region "EU" vs region "europe-west1"). BigQuery Console\'dan tam dataset adını kopyala.',
      },
      {
        problem: '"Invalid JSON" hatası',
        solution:
          "JSON'u kısmen yapıştırmışsındır veya başına/sonuna ekstra karakter eklemişsindir. Service account JSON dosyasını editör ile aç (notepad değil, VS Code önerilir), Ctrl+A → kopyala, FreeCrawl alanına git, mevcut içeriği sil, yapıştır.",
      },
    ],
    notes: [
      "Maliyet: BigQuery free tier (10GB storage + 1TB query/ay) tipik kullanım için yeterli. 1M URL crawl ~500MB, query maliyeti SQL'inle değişir.",
      "Şema değişiklikleri: FreeCrawl her export'ta tabloyu otomatik oluşturur/günceller. CrawlUrlRow schema'sı değişirse export tablosu yeni kolonları otomatik ekler (BigQuery DDL flexibility).",
    ],
    lastReviewed: '2026-06-01',
  },
};
