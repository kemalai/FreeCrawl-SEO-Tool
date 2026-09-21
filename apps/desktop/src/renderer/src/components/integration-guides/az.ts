/**
 * Azerbaijani integration setup guides. Generated from the guide source —
 * see `./index.ts` for how a locale is picked. Keep the step count,
 * links and `lastReviewed` in lockstep with `en.ts`; the parity test
 * in `tests/` compares them.
 */
import type { Guide } from './types.js';

export const GUIDES_AZ: Record<string, Guide> = {
  openai: {
    intro:
      'OpenAI API-si vasitəsilə hər URL üçün fərdi prompt işlədin — məzmun təhlili, başlıq ideyaları, xülasələr. İstifadə öz OpenAI hesabınıza hesablanır; FreeCrawl pulsuz vasitəçidir, API çağırışlarını siz ödəyirsiniz.',
    prereqs: [
      'OpenAI hesabı (https://platform.openai.com ünvanında pulsuz qeydiyyat).',
      'Etibarlı ödəniş üsulu — açarlar işləməzdən əvvəl OpenAI minimum 5 $ balans tələb edir.',
    ],
    steps: [
      {
        title: 'platform.openai.com ünvanında daxil olun',
        detail: 'OpenAI hesabınızdan istifadə edin. Hələ hesabınız yoxdursa, "Sign up".',
        link: {
          label: 'platform.openai.com',
          url: 'https://platform.openai.com',
        },
      },
      {
        title: 'Sol yan paneldə "API keys" düyməsinə klikləyin',
        detail: 'Solda açar ikonlu menyu elementi. Birbaşa URL-ə də keçə bilərsiniz.',
        link: {
          label: 'API keys səhifəsi',
          url: 'https://platform.openai.com/api-keys',
        },
      },
      {
        title: '"+ Create new secret key" düyməsinə klikləyin (yuxarı sağda)',
        detail:
          'Dialoqda:\n• Name: "FreeCrawl SEO Tool" (istənilən xatırladıcı etiket)\n• Project: Default project və ya seçdiyiniz\n• Permissions: All (ən asanı; məhdud əhatələr də işləyir)\nsonra "Create secret key".',
      },
      {
        title: 'Açarı KOPYALAYIN — bir daha göstərilməyəcək',
        detail:
          'Açar `sk-...` ilə başlayır. İndi kopyalamasanız, həmişəlik itirəcəksiniz (yenisini yaratmalı olacaqsınız). Parol menecerində saxlayın — brauzer sekmesində qoymayın.',
      },
      {
        title: 'Bu panelin "API Key" sahəsinə yapışdırın + Yadda saxla düyməsinə klikləyin',
        detail:
          'FreeCrawl açarı ƏS-nin etimadnamə anbarında şifrələnmiş saxlayır (Windows DPAPI, macOS Keychain, Linux Secret Service). Heç vaxt açıq mətn kimi yazılmır.',
      },
      {
        title: 'AI sekmesində sınayın',
        detail:
          'Parametrləri bağlayın → yuxarıdakı "AI" sekmesinə keçin → taramadan bir neçə URL seçin → "Run AI" düyməsinə klikləyin. İlk çağırış ~2-3 san çəkir.',
      },
    ],
    troubleshooting: [
      {
        problem: '"You exceeded your current quota"',
        solution:
          'OpenAI hesabınızda balans yoxdur. platform.openai.com → Billing → "Add payment method" → kart əlavə edin və 5 $+ yükləyin. Yeni hesablara avtomatik kredit verilmir; özünüz doldurmalısınız.',
      },
      {
        problem: '"Incorrect API key provided" / 401',
        solution:
          'Açarın əvvəlində və ya sonunda yəqin artıq boşluq var. Yenisini yaradın, diqqətlə kopyalayın. Köhnəni ləğv edin.',
      },
      {
        problem: '"Rate limit exceeded"',
        solution:
          'Həddindən çox paralel sorğu. Parametrlər → AI bölməsində paralelliyi azaldın (standart: 3). Tier 1 hesablar modeldən asılı olaraq 500-3500 RPM ilə işləyir.',
      },
    ],
    notes: [
      'Qiymətlər (2026-06): gpt-4o-mini ~0,15 $/1M giriş tokeni, gpt-4o ~2,50 $/1M giriş. Tipik prompt + cavabla 1000 URL: ~0,50-2 $.',
      'Usage limits səhifəsində aylıq sərt limit qoyun — nəzarətdən çıxmış 1M URL taramasının 1000 $ hesab çıxarmasını istəməzsiniz.',
    ],
    lastReviewed: '2026-06-01',
  },
  anthropic: {
    intro:
      'Anthropic API-si vasitəsilə Claude-a promptlar göndərin. Claude-un ən yaxşı modelləri (Sonnet 4.6, Opus 4.8) rəqiblərə nisbətən daha az "AI iyi gələn" SEO nəticəsi verir. Öz Anthropic hesabınıza hesablanır.',
    prereqs: [
      'Anthropic hesabı (https://console.anthropic.com).',
      'Qeydiyyatlı ödəniş üsulu (yeni istifadəçilər 5 $ promo kredit alır).',
    ],
    steps: [
      {
        title: 'console.anthropic.com ünvanında daxil olun',
        link: {
          label: 'console.anthropic.com',
          url: 'https://console.anthropic.com',
        },
      },
      {
        title: 'Yuxarı sağdakı açılan menyudan "API Keys" səhifəsini açın',
        detail: 'Settings menyusunda "API Keys" bəndi.',
        link: {
          label: 'API Keys səhifəsi',
          url: 'https://console.anthropic.com/settings/keys',
        },
      },
      {
        title: '"+ Create Key" düyməsinə klikləyin',
        detail:
          'Dialoqda:\n• Name: "FreeCrawl SEO Tool"\n• Workspace: Default workspace\n• Environment: Production\nsonra "Create Key".',
      },
      {
        title: 'Açarı KOPYALAYIN — bir daha göstərilməyəcək',
        detail: 'Açar `sk-ant-...` ilə başlayır. İtirsəniz, yenisini yaradın.',
      },
      {
        title: '"API Key" sahəsinə yapışdırın + Yadda saxla',
      },
      {
        title: 'İstəyə bağlı: model seçin',
        detail:
          'Parametrlər → AI bölməsində "Model" sahəsi model id-si qəbul edir (standart: claude-sonnet-4-6). Sürət prioriteti: claude-haiku-4-5 (~10x ucuz, 3x sürətli). Keyfiyyət prioriteti: claude-opus-4-8.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Your credit balance is too low"',
        solution: 'console.anthropic.com → Settings → Billing → "Add credits" — minimum 5 $.',
      },
      {
        problem: '"Number of request tokens has exceeded your rate limit"',
        solution:
          'Tier 1 hesablar ~50 RPM. Parametrlər → AI bölməsində paralelliyi 2-3-ə endirin. Yuxarı səviyyələr üçün 25 $+ xərcləməlisiniz (Tier 2: 1000 RPM).',
      },
      {
        problem: '"Invalid API key"',
        solution:
          '"sk-ant-" prefiksinin toxunulmaz olduğuna və artıq boşluq olmadığına əmin olun. API Keys səhifəsini yoxlayın — açar orada aktiv görünürsə, açarın özü qaydasındadır.',
      },
    ],
    notes: [
      'Qiymətlər (2026-06): Haiku 4.5 ~0,25 $/1,25 $ (1M token üçün giriş/çıxış), Sonnet 4.6 ~3 $/15 $, Opus 4.8 ~15 $/75 $.',
      'Anthropic prompt keşləməsini dəstəkləyir — 5 dəqiqə içində təkrarlanan uzun sistem promptları 90% endirimlidir (FreeCrawl AI paneli hələ keşdən istifadə etmir — sonrakı buraxılışda gələcək).',
    ],
    lastReviewed: '2026-06-01',
  },
  ollama: {
    intro:
      'Ollama yerli olaraq yerləşdirilən LLM-lər üçün açıq mənbəli iş mühitidir. API açarı YOXDUR, həmişəlik pulsuz, internet belə lazım deyil. Xərc sıfır; yeganə çatışmazlıq böyük modellər üçün VRAM/RAM-dır.',
    prereqs: [
      'macOS 12+, Windows 10+ və ya Linux (Ubuntu 22.04+ tövsiyə olunur).',
      'Ən azı 8 GB RAM (kiçik modellər). Llama 3.2 3B ~2 GB VRAM/RAM tələb edir.',
      'GPU tövsiyə olunur, amma məcburi deyil — CPU işləyir (daha yavaş).',
    ],
    steps: [
      {
        title: 'Ollama-nı endirin + quraşdırın',
        detail:
          'ƏS-nizə uyğun quraşdırıcını seçin:\n• Windows: OllamaSetup.exe\n• macOS: Ollama.dmg\n• Linux: curl -fsSL https://ollama.com/install.sh | sh\n\nQuraşdırmadan sonra Ollama arxa planda işləyir (sistem tepsisi ikonu).',
        link: {
          label: 'ollama.com/download',
          url: 'https://ollama.com/download',
        },
      },
      {
        title: 'Model endirin',
        detail:
          'Terminal açın və işlədin:\n\n  ollama pull llama3.2\n\nllama3.2 (3B parametr) ~2GB, sürətli, az resurs. Daha böyük seçimlər:\n  ollama pull llama3.3:70b   (~40GB, yalnız güclü GPU)\n  ollama pull qwen2.5:7b     (~4GB, balanslı)\n  ollama pull mistral:7b     (~4GB, alternativ)',
      },
      {
        title: 'Modeli sürətlə sınayın',
        detail:
          'Terminalda:\n  ollama run llama3.2\n\nİnteraktiv söhbət açılır. "hello" yazın — cavab gəlirsə, hər şey qaydasındadır. Çıxmaq üçün Ctrl+D.',
      },
      {
        title: 'Bu paneldə Ollama son nöqtəsini daxil edin',
        detail:
          'Standart: http://localhost:11434 (artıq doldurulub). Ollama başqa portda işləyirsə dəyişin.',
      },
      {
        title: 'Endirdiyiniz modelin adını daxil edin',
        detail:
          'Məs. "llama3.2" və ya "qwen2.5:7b". Boş buraxın ki, FreeCrawl ilk mövcud modeli seçsin.',
      },
      {
        title: 'Yadda saxlayın + sınayın',
        detail: 'AI sekmesində kiçik partiya işlədin. Yalnız CPU: ~5-15 san/URL. GPU: ~1-3 san.',
      },
    ],
    troubleshooting: [
      {
        problem: 'AI tab says "Connection refused"',
        solution:
          'Ollama işləmir. Terminalda "ollama serve" işlədin və ya Ollama tətbiqini sistem tepsisindən / Start menyusundan başladın.',
      },
      {
        problem: '"model \'X\' not found"',
        solution:
          'Model endirilməyib. "ollama pull <model-adı>" işlədin. Diskdə nə olduğunu görmək üçün "ollama list" istifadə edin.',
      },
      {
        problem: 'Replies are very slow (>30 s/URL)',
        solution:
          'Model VRAM-a sığmır və CPU-ya keçir. Daha kiçik model sınayın (llama3.2:1b və ya phi3:mini). VRAM ehtiyacı: 3B ~2GB, 7B ~4GB, 13B ~8GB.',
      },
    ],
    notes: [
      'Tamamilə oflayn — tarama + AI təhlili internet olmadan da davam edir.',
      'Yerli SEO təhlili keyfiyyəti: 3B modellər bir az zəif, 7-13B məqbul, 70B GPT-4 səviyyəsində (amma ağır avadanlıq).',
      'Parametrlər → AI bölməsində paralelliyi 1-2 saxlayın — yerli modellər paralel sorğuları ardıcıllaşdırır.',
    ],
    lastReviewed: '2026-06-01',
  },
  pagespeed: {
    intro:
      'Google PageSpeed Insights hər URL-i Lighthouse ilə yoxlayır və Performans/SEO/Əlçatanlıq/Ən yaxşı təcrübələr balları + Core Web Vitals (LCP/CLS/INP) qaytarır. Pulsuz API açarı sizə gündə 25.000 yoxlama verir.',
    prereqs: [
      'Google hesabı.',
      'Google Cloud Console layihəsi (aşağıdakı addımlarda yarada bilərsiniz).',
    ],
    steps: [
      {
        title: 'Google Cloud Console-u açın',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Layihə seçin və ya yaradın',
        detail:
          'Yuxarı sol layihə açılan menyusu → "New Project" → ad: "FreeCrawl SEO" → Create. Billinq hesabı TƏLƏB OLUNMUR — PSI pulsuz səviyyəsinə yalnız autentifikasiya üçün etimadnamə lazımdır.',
      },
      {
        title: 'PageSpeed Insights API-ni aktivləşdirin',
        detail: 'Bu dərin keçid birbaşa API-nin aktivləşdirmə səhifəsinə aparır:',
        link: {
          label: 'PageSpeed Insights API → Enable',
          url: 'https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com',
        },
      },
      {
        title: 'Mavi "Enable" düyməsinə klikləyin → 30 san gözləyin',
      },
      {
        title: 'Credentials bölməsinə keçin',
        link: {
          label: 'Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: '"+ Create Credentials" → "API key" klikləyin',
        detail: 'API açarı yaradılır (`AIzaSy...` ilə başlayır). Dərhal kopyalayın.',
      },
      {
        title: 'İstəyə bağlı: API açarını məhdudlaşdırın (tövsiyə olunur)',
        detail:
          '"Edit API key" → "Restrict key" klikləyin:\n• API restrictions: "Restrict key" → "PageSpeed Insights API"\n• Application restrictions: "None" (FreeCrawl masaüstü tətbiqdir, ona görə referrer/IP filtri işləməyəcək)\nMəhdudlaşdırılmamış açarlar da işləyir, amma məhdudlaşdırmağı tövsiyə edirik.',
      },
      {
        title: 'Açarı bu panelin "API Key" sahəsinə yapışdırın + Yadda saxla',
      },
      {
        title: 'PageSpeed sekmesində sınayın',
        detail:
          'Yuxarı "PageSpeed" sekmesi → bir neçə URL seçin → "Run audit". İlk yoxlama ~10-15 san.',
      },
    ],
    troubleshooting: [
      {
        problem: '"This API method requires billing to be enabled"',
        solution:
          'Səhv API-ni aktivləşdirmisiniz (məs. köhnə "Cloud PageSpeed Insights API"). Düzgün olan "PageSpeed Insights API"-dir (pagespeedonline.googleapis.com). 3-cü addımdakı keçidi yenidən açın.',
      },
      {
        problem: '"API key not valid"',
        solution:
          'Açar məhdudiyyətləri səhvdir. Cloud Console → Credentials → açara klikləyin → icazə verilən API-lər arasında "PageSpeed Insights API"-nin olduğuna əmin olun. Və ya yoxlamaq üçün məhdudiyyətləri müvəqqəti qaldırın.',
      },
      {
        problem: '"Quota exceeded" — before hitting 25,000',
        solution:
          'Dəqiqəlik limit də var: 240 sorğu/dəq. Parametrlər → PageSpeed bölməsində paralelliyi 2-3 saxlayın. Gündəlik 25K həddi çox yüksəkdir — normal istifadədə görməyəcəksiniz.',
      },
    ],
    notes: [
      'Xərc: PULSUZ — billinq tələb etməyən az saylı Google API-lərindən biri. Açarsız/anonim rejim artıq gündə 0 sorğudur (2026-cı ilin əvvəlində bağlanıb), ona görə açar məcburidir.',
      'Sürət: hər URL ~5-10 san (Google həqiqətən Lighthouse nümunəsi işlədir). 1000 URL ~2 saat.',
      'Mobil + Masaüstü ayrı API çağırışları sayılır — "hər ikisi" seçmək kvota istifadəsini ikiqat artırır.',
    ],
    lastReviewed: '2026-06-01',
  },
  ahrefs: {
    intro:
      'Ahrefs API-si vasitəsilə hər URL üçün geri keçid sayı, domain rating, istinad edən domenlər, orqanik açar söz saylarını çəkin. Bu, Ahrefs-in ən bahalı inteqrasiyasıdır — API girişi 500 $+/ay planların arxasındadır.',
    prereqs: [
      'Ahrefs Standard (249 $/ay) və ya daha yüksək abunəlik.',
      'Əlavə "API" səviyyəsi (əsas planın üstünə əlavə 500 $/ay və ya fərqli səviyyə).',
    ],
    steps: [
      {
        title: 'Ahrefs-ə daxil olun → API səhifəsi',
        link: {
          label: 'ahrefs.com/api',
          url: 'https://ahrefs.com/api',
        },
      },
      {
        title: 'Abunəlik seçin (hələ API girişiniz yoxdursa)',
        detail:
          'API v3 girişi Enterprise səviyyəsi və xüsusi API planları ilə gəlir. Qiymət təklifi üçün satış şöbəsi ilə əlaqə saxlayın.',
      },
      {
        title: 'Hesabınızda API tokeni yaradın',
        detail:
          'Ahrefs paneli → Account settings → API → Generate token. Token formatı: `sk-...` və ya bənzəri.',
      },
      {
        title: '"API Key" sahəsinə yapışdırın + Yadda saxla',
      },
      {
        title: 'SEO Authority sekmesində sınayın',
        detail:
          'Yuxarı "SEO Authority" sekmesi → provayder: "Ahrefs" → bir neçə URL seçin → "Run".',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient credits"',
        solution:
          'API sətir vahidləri tükənib. Ahrefs paneli → API → "Usage" sekmesi. Planı yüksəldin və ya növbəti billinq dövrünü gözləyin.',
      },
      {
        problem: '"Unauthorized"',
        solution:
          'Abunəliyinizə API girişi daxil deyil. Tək "Ahrefs Standard" API hüquqları vermir — üstündə açıq API səviyyəsi lazımdır.',
      },
    ],
    notes: [
      'Xərc: hər URL yoxlamasına təxminən 1-5 API sətri. Standard API planı ~25K sətir/ay.',
      'Daha ucuz alternativlər: Moz (99 $/ay, Domain Authority) və ya Majestic.',
    ],
    lastReviewed: '2026-06-01',
  },
  majestic: {
    intro:
      'Majestic API-si vasitəsilə Trust Flow, Citation Flow və geri keçid saylarını çəkin. Ən sərfəli geri keçid yönümlü provayder.',
    prereqs: [
      'Majestic Lite (49,99 $/ay) və ya daha yüksək abunəlik.',
      'API girişi — Lite-a daxildir.',
    ],
    steps: [
      {
        title: 'Majestic tərtibatçı panelini açın',
        link: {
          label: 'majestic.com/account/api',
          url: 'https://majestic.com/account/api',
        },
      },
      {
        title: 'API açarı yaradın',
        detail: 'Panel → "Open API" sekmesi → "Generate new key" → kopyalayın.',
      },
      {
        title: 'Bu panelə yapışdırın + Yadda saxla',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient resources" / "No analysis units"',
        solution:
          'Aylıq təhlil vahidi kvotası tükənib. Lite planı: 1000 vahid/ay; Pro: 20K+. Majestic paneli → API → istifadəni yoxlayın.',
      },
    ],
    notes: ['Xərc: 1 URL geri keçid axtarışı = 5 vahid. Lite planı (1000 vahid) ~200 URL/ay.'],
    lastReviewed: '2026-06-01',
  },
  moz: {
    intro:
      'Moz API vasitəsilə Domain Authority (DA), Page Authority (PA) və Spam Score çəkin. Aşağı büdcələr üçün ən populyar seçim.',
    prereqs: [
      '"Moz API" əlavəsi aktiv olan Moz Pro Standard (99 $/ay) və ya daha yüksək abunəlik.',
    ],
    steps: [
      {
        title: 'Moz API səhifəsini açın',
        link: {
          label: 'moz.com/api',
          url: 'https://moz.com/api',
        },
      },
      {
        title: 'Account → API → "Generate Credentials"',
        detail: 'İki dəyər yaranır: "Access ID" və "Secret Key". Hər ikisini kopyalayın.',
      },
      {
        title:
          'Hər birini bu panelin "Access ID" + "Secret Key" sahələrinə yapışdırın + Yadda saxla',
        detail: 'İki ayrı sahə — sıra ilə doldurun.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Authentication failed"',
        solution:
          'Access ID və ya Secret Key səhv kopyalanıb. Moz panelindən yenidən kopyalayın — Access ID qısadır (~13 simvol), Secret Key uzundur (~40 simvol).',
      },
    ],
    notes: ['Xərc: Standard planı (1500 sətir/ay), Medium (10K sətir/ay), Large (100K sətir/ay).'],
    lastReviewed: '2026-06-01',
  },
  semrush: {
    intro:
      'Semrush API vasitəsilə orqanik açar sözlər, trafik təxminləri və SERP xüsusiyyətlərini çəkin. Ən əhatəli açar söz + trafik məlumatı.',
    prereqs: [
      'Semrush Pro (129 $/ay) və ya daha yüksək abunəlik.',
      'Hesaba bağlı "API units" (Guru səviyyəsi və yuxarısı API girişi daxildir).',
    ],
    steps: [
      {
        title: 'Semrush-a daxil olun → Subscription info → API',
        link: {
          label: 'Semrush API girişi',
          url: 'https://www.semrush.com/accounts/subscription-info/api-units/',
        },
      },
      {
        title: 'API açarını kopyalayın',
      },
      {
        title: 'Bu panelə yapışdırın + Yadda saxla',
      },
    ],
    troubleshooting: [
      {
        problem: '"API units exhausted"',
        solution:
          'Aylıq vahid kvotası tükənib. Guru planı: 7K vahid/ay, Business: 25K+. Semrush paneli → API → istifadəni yoxlayın.',
      },
    ],
    notes: ['Xərc: 1 URL geri keçid sorğusu = 10 vahid; 1 domen icmalı = 1 vahid.'],
    lastReviewed: '2026-06-01',
  },
  gsc: {
    intro:
      'Google Search Console API vasitəsilə hər URL üçün Search Console metriklərini (kliklər, göstərimlər, CTR, orta mövqe) çəkin. URL Inspection API əhatə qərarı + son tarama vaxtını da verir. "Öz müştərini gətir" modeli — öz Google Cloud OAuth müştərinizi yaradıb yapışdırırsınız; FreeCrawl paylaşılan vasitəçi tətbiq istifadə etmir.',
    prereqs: [
      'Google hesabı (bağlamaq istədiyiniz GSC mülkiyyətinin sahibi / həmsahibi olmalıdır).',
      'Ən azı bir Google Search Console mülkiyyəti əlavə edilmiş + təsdiqlənmiş.',
    ],
    steps: [
      {
        title: 'Google Cloud Console-u açın və yeni layihə yaradın',
        detail:
          'Yuxarı sol layihə açılan menyusu → "New Project" → ad: "FreeCrawl SEO Integrations" (istədiyiniz) → Create. Bu layihə yalnız OAuth etimadnamələri üçündür — billinq tələb olunmur.',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Google Auth Platform → Branding bölməsini açın',
        detail:
          'Sol menyu "APIs & Services" → "OAuth consent screen" (yeni UI: "Google Auth Platform → Branding"). User Type: "External" → Create.',
        link: {
          label: 'OAuth consent screen',
          url: 'https://console.cloud.google.com/auth/branding',
        },
      },
      {
        title: 'OAuth razılıq ekranını doldurun',
        detail:
          'Yalnız məcburi sahələr:\n• App name: "FreeCrawl Local"\n• User support email: e-poçtunuz\n• Developer contact information: e-poçtunuz\nQalanını boş buraxın. Save and Continue → Save and Continue → Save and Continue → Back to Dashboard.',
      },
      {
        title: 'VACİB: Özünüzü Test User kimi əlavə edin',
        detail:
          'Sol menyu → "Audience" (köhnə UI "Test users") → "Add users" → bağlayacağınız Gmail-i yapışdırın → Save.\n\nXƏBƏRDARLIQ: BU ADDIMI ATLAMAYIN. Atlamaq OAuth zamanı 403 access_denied verir — "Testing" statuslu tətbiqlər yalnız test istifadəçiləri siyahısındakı hesabların bağlanmasına icazə verir.',
        link: {
          label: 'Audience səhifəsi',
          url: 'https://console.cloud.google.com/auth/audience',
        },
      },
      {
        title: 'Google Search Console API-ni aktivləşdirin',
        detail:
          'Bu keçid birbaşa aktivləşdirmə səhifəsinə aparır → mavi "Enable" düyməsinə klikləyin → 30 san gözləyin.',
        link: {
          label: 'Search Console API → Enable',
          url: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com',
        },
      },
      {
        title: 'OAuth Client ID yaradın',
        detail:
          'Sol menyu → "Credentials" (yeni UI "Google Auth Platform → Clients") → "+ Create credentials" → "OAuth client ID".',
        link: {
          label: 'Credentials səhifəsi',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'OAuth Client tipi olaraq "Desktop app" seçin (Web app YOX!)',
        detail:
          'Application type açılan menyusu → "Desktop app". Name: "FreeCrawl SEO Tool". Create → dialoq Client ID + Client Secret göstərir. Hər ikisini dərhal kopyalayın (Secret bir daha göstərilmir).\n\nNİYƏ DESKTOP: FreeCrawl hər bağlantı üçün təsadüfi yerli port (məs. 127.0.0.1:63092) istifadə edir. "Web application" sabit redirect URI siyahısı tələb edir — həmin təsadüfi port uyğun gələ bilməz → uğursuzluq. "Desktop app" loopback yönləndirmələrini portdan asılı olmadan avtomatik qəbul edir.',
      },
      {
        title: 'Client ID + Client Secret-i bu panelə yapışdırın + Yadda saxla',
        detail:
          'İki sahə: "OAuth Client ID" (...apps.googleusercontent.com) və "OAuth Client Secret" (GOCSPX-...). Yadda saxla.',
      },
      {
        title: '"Bağlan" düyməsinə klikləyin — brauzeriniz açılır',
        detail:
          'Yadda saxladıqdan sonra kartda "Bağlan" düyməsi görünür. Klikləyin → Google-un razılıq ekranı standart brauzerinizdə açılır.',
      },
      {
        title: 'Test istifadəçisi kimi əlavə etdiyiniz Google hesabı ilə daxil olun',
        detail:
          'Hesab seçicisində test istifadəçilərinə əlavə etdiyiniz e-poçtu seçin. "Continue" → "Google hasn\'t verified this app" xəbərdarlığı (test rejimi üçün gözləniləndir). "Advanced" → "Go to FreeCrawl Local (unsafe)" → icazələri qəbul edin → Allow.',
      },
      {
        title: 'FreeCrawl-a qayıdın — "Konfiqurasiya edilib" görməlisiniz',
        detail:
          'Parametrlərdəki Search Console kartı indi yaşıl "Konfiqurasiya edilib" nişanı göstərir. İndi yuxarı "Search Console" sekmesinə keçib mülkiyyətləri siyahılaya + məlumat çəkə bilərsiniz.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 access_denied"',
        solution:
          'Test istifadəçisi əlavə etməmisiniz və ya səhv Google hesabı ilə daxil olursunuz. Audience səhifəsinə qayıdın və istifadə etdiyiniz hesabın test istifadəçiləri siyahısında olduğunu yoxlayın. Bir neçə Google hesabınız varsa, hesab seçicisinin hansını istifadə etdiyinə baxın.',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'Ya Search Console API aktivləşdirilməyib, YA DA OAuth razılıq ekranında "View Search Console data for your verified sites" icazə xanası işarələnməyib. (1) Search Console API-ni aktivləşdirin (addım 5), (2) myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → yenidən Bağlan düyməsinə klikləyin və razılıq ekranında bütün icazələri işarələyin.',
      },
      {
        problem: '"redirect_uri_mismatch"',
        solution:
          'Səhv OAuth müştəri tipi. Credentials səhifəsindən müştərini silin və "Desktop app" kimi yenidən yaradın (addım 7). "Web application" bu axın üçün heç vaxt işləməyəcək.',
      },
      {
        problem: '"This app isn\'t verified" warning',
        solution:
          'Gözlənilən davranış (test rejimli tətbiq + həssas əhatə). Davam etmək üçün "Advanced" → "Go to <app> (unsafe)" klikləyin. Tətbiq test rejimindədir və yalnız test istifadəçilərini buraxır — təhlükəsizdir.',
      },
      {
        problem: 'Connection broke after 7 days',
        solution:
          'Test rejimində OAuth yeniləmə tokenləri hər 7 gündə bitir. Parametrlər → İnteqrasiyalar → Search Console → "Bağlantını kəs" → "Bağlan" ilə yenidən autentifikasiya edin. Bitmədən qurtulmaq üçün tətbiqi Google-un təsdiq prosesindən (1-4 həftə) keçirməlisiniz.',
      },
    ],
    notes: [
      'Sahib olduğunuz mülkiyyətlər (sc-domain:example.com və ya https://example.com/) hesabınızın təsdiqlədiyi hər saytı əhatə edir.',
      'GSC məlumatı ~2 gün gecikir — bugünkü kliklər dərhal görünmür.',
      'Pulsuz kvota: 1200 sorğu/dəq, 25.000 sorğu/gün — normal istifadədə heç vaxt çatmayacaqsınız.',
    ],
    lastReviewed: '2026-06-01',
  },
  ga4: {
    intro:
      'Hər URL üçün GA4 metriklərini (sessiyalar, istifadəçilər, imtina nisbəti, cəlbolunma nisbəti, konversiyalar) çəkin. "Öz müştərini gətir" — öz GCP OAuth müştərinizdən istifadə edir.',
    prereqs: [
      'Bağlayacağınız GA4 mülkiyyətində ən azı Viewer girişi olan Google hesabı.',
      'GSC üçün qurduğunuz eyni OAuth müştərisini YENİDƏN İSTİFADƏ edə bilərsiniz — sadəcə düzgün API-ləri aktivləşdirin.',
    ],
    steps: [
      {
        title: 'GSC artıq qurulubsa: həmin OAuth müştərisini YENİDƏN İSTİFADƏ EDİN',
        detail:
          'Search Console artıq konfiqurasiya edilibsə, eyni Google Cloud layihəsini və eyni OAuth Client ID + Secret-i istifadə edə bilərsiniz. Yenidən yaratmağa ehtiyac yoxdur — sadəcə aşağıdakı API-ləri aktivləşdirin və etimadnamələri bura yapışdırın.',
      },
      {
        title: 'HƏR İKİ GA4 API-ni aktivləşdirin',
        detail:
          'GA4-ə iki fərqli API lazımdır:\n\n1. Google Analytics Admin API (mülkiyyət siyahısı üçün)\n2. Google Analytics Data API (əsl hesabatlar üçün)\n\nHər ikisini aktivləşdirməsəniz "API not enabled" xətaları görəcəksiniz.',
        link: {
          label: 'Admin API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com',
        },
      },
      {
        title: 'Data API-ni də aktivləşdirin',
        link: {
          label: 'Data API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
        },
      },
      {
        title: 'GSC üçün istifadə etdiyiniz eyni Client ID + Secret-i yapışdırın',
        detail:
          'GSC artıq bağlıdırsa, yapışdırmağa ehtiyac belə olmaya bilər — kartlar etimadnamələri paylaşa bilər. GA4-ü sıfırdan qurursunuzsa, GSC müştərinizin ID/Secret-ini bu panelə kopyalayın.',
      },
      {
        title: '"Bağlan" → Google ilə daxil olun + GA4 əhatəsini təsdiqləyin',
        detail:
          'Test istifadəçisi kimi əlavə etdiyiniz Google hesabı ilə daxil olun. Razılıq ekranında "Google Analytics: View Google Analytics property data" icazəsinin işarələndiyini təsdiqləyin.',
      },
      {
        title: 'GA4 sekmesində mülkiyyətləri siyahılayın + çəkin',
        detail:
          'Yuxarı "GA4" sekmesinə keçin → "List Properties" hesabınızın gördüyü hər GA4 mülkiyyətini göstərir → birini seçin → pəncərə seçin (7/28/90 gün) → "Fetch". GA4 demək olar ki real vaxtdadır, nəticələr dərhal görünür.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Google Analytics Admin API has not been used in project X"',
        solution:
          'Admin API aktivləşdirilməyib. 2-ci addımdakı keçidi açın → Enable. 30 san gözləyin, yenidən cəhd edin. Sonra Data API üçün eyni xətanı alacaqsınız — 3-cü addımdakı keçidi açıb onu da aktivləşdirin.',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'OAuth əhatəsi GA4-ü əhatə etmir. myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → yenidən Bağlan düyməsinə klikləyin → Google Analytics icazə xanasını işarələyin.',
      },
      {
        problem: 'Property list comes back empty',
        solution:
          'Bağladığınız Google hesabının heç bir GA4 mülkiyyətində rolu yoxdur. GA4 paneli → Admin → Property Access Management → e-poçtunuzun ən azı Viewer olduğunu təsdiqləyin.',
      },
    ],
    notes: [
      'GA4 məlumatı demək olar ki real vaxtdadır — bugünkü məlumat 4-24 saat ərzində görünür.',
      'Pulsuz kvota: 200K sorğu/gün, hər mülkiyyət üçün 50 sorğu/dəq.',
    ],
    lastReviewed: '2026-06-01',
  },
  sheets: {
    intro:
      'Tarama nəticələrini birbaşa Google Sheet-ə ixrac edin. Həmkarlarla paylaşılan canlı sənəd üzərində işləyərkən "CSV endir → Excel-də aç"-dan daha yaxşıdır.',
    prereqs: [
      'Google hesabı.',
      'GSC üçün qurduğunuz eyni OAuth müştərisini YENİDƏN İSTİFADƏ edə bilərsiniz.',
    ],
    steps: [
      {
        title: 'GSC/GA4 qurmusunuzsa: həmin OAuth müştərisini YENİDƏN İSTİFADƏ EDİN',
        detail: 'Eyni OAuth Client ID + Secret-i yapışdırın (və ya artıq saxlanılmış ola bilər).',
      },
      {
        title: 'Google Sheets API-ni aktivləşdirin',
        link: {
          label: 'Sheets API → Enable',
          url: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
        },
      },
      {
        title: 'Google Drive API-ni də aktivləşdirin',
        detail: 'Sheets API cədvəllər yaratmaq/oxumaq üçün Drive əhatəsi də tələb edir.',
        link: {
          label: 'Drive API → Enable',
          url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
        },
      },
      {
        title: 'Client ID + Secret yapışdırın + Yadda saxla',
      },
      {
        title: '"Bağlan" → razılıq ekranında Sheets + Drive-ı təsdiqləyin',
        detail:
          'OAuth axını iki icazə göstərir:\n• See, edit, create, and delete all your Google Sheets spreadsheets\n• See, edit, create, and delete only the specific Google Drive files used with this app\nHər ikisini işarələyin.',
      },
      {
        title: 'İxrac menyusundan sınayın',
        detail:
          'Fayl → İxrac → "Google Sheets-ə ixrac et". Yeni Sheet avtomatik yaradılır, URL mübadilə buferinə kopyalanır.',
      },
    ],
    troubleshooting: [
      {
        problem: '"insufficient authentication scopes"',
        solution:
          'Bağlanma zamanı Drive icazə xanasını işarələməmisiniz. Bağlantını kəsin + yenidən bağlanın, hər iki icazəni işarələyin.',
      },
    ],
    notes: [
      'Sheets sərt həddi: cədvəl başına 10M xana — böyük taramalar (>500K URL) bölünür.',
      'Drive əhatəsi "drive.file"-dır — yalnız FreeCrawl-ın yaratdığı fayllar əlçatandır, mövcud fayllarınız deyil.',
    ],
    lastReviewed: '2026-06-01',
  },
  bigquery: {
    intro:
      'Tarama məlumatını birbaşa BigQuery məlumat dəstinə axıdın. Məlumat anbarınızda tarixli anlıq görüntülər toplamaq və tarama trendlərini BI aləti ilə (Looker Studio, Tableau, Metabase) vizuallaşdırmaq üçün faydalıdır.',
    prereqs: [
      'BigQuery API aktiv olan Google Cloud layihəsi.',
      'Artıq yaradılmış BigQuery məlumat dəsti.',
      'Service Account JSON (OAuth DEYİL — serverdən-serverə autentifikasiya).',
      'Billinq aktiv GCP layihəsi (BigQuery pulsuz səviyyəsi: 10GB yaddaş/ay + 1TB sorğu/ay; bundan artığı ödənişlidir).',
    ],
    steps: [
      {
        title: 'BigQuery məlumat dəsti yaradın',
        detail:
          'BigQuery Console → layihənizi seçin → "Create dataset" → ID: "freecrawl_seo" (və ya istənilən ad) → Location: "EU" və ya "US" (vacib — sonra dəyişmək olmur) → Create dataset.',
        link: {
          label: 'BigQuery Console',
          url: 'https://console.cloud.google.com/bigquery',
        },
      },
      {
        title: 'Service Account yaradın',
        detail:
          'IAM & Admin → Service Accounts → "+ Create service account" → ad: "freecrawl-bigquery" → Create and continue.',
        link: {
          label: 'Service Accounts',
          url: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
        },
      },
      {
        title: 'Rollar əlavə edin',
        detail:
          '2-ci addımda "Grant this service account access to project" → iki rol əlavə edin:\n• BigQuery Data Editor\n• BigQuery Job User\nSonra "Continue" → "Done".',
      },
      {
        title: 'JSON açarını endirin',
        detail:
          'Service account siyahısında indicə yaratdığınıza klikləyin → "Keys" sekmesi → "Add key" → "Create new key" → Type: JSON → Create.\n\nJSON avtomatik endirilir. Mətn redaktorunda açıb bütün məzmunu kopyalayın.\n\nXƏBƏRDARLIQ: Bu JSON bütün etimadnaməni ehtiva edir — ona parol kimi yanaşın. Heç vaxt mənbə nəzarətinə əlavə etməyin.',
      },
      {
        title: 'Bu panelin "Service Account JSON" sahəsinə yapışdırın',
        detail:
          'Tam JSON-u yapışdırın (açılan `{`-dan bağlanan `}`-a qədər). FreeCrawl JSON-u ƏS etimadnamə anbarında şifrələnmiş saxlayır.',
      },
      {
        title: '"GCP Project ID" sahəsini doldurun',
        detail:
          'GCP layihə ID-niz (Cloud Console-un yuxarı sol açılan menyusunda görünür, məs. "my-gcp-project-12345"). JSON-da da "project_id" sahəsi var — oradan kopyalaya bilərsiniz.',
      },
      {
        title: 'Məlumat dəsti adını daxil edin + Yadda saxla',
        detail: '1-ci addımda yaratdığınız məlumat dəsti adı (məs. "freecrawl_seo").',
      },
      {
        title: 'İxrac menyusundan sınayın',
        detail:
          'Fayl → İxrac → "BigQuery-ə ixrac et" → cədvəl adı/formatı seçin → işlədin. Cədvəlin BigQuery Console-da göründüyünü yoxlayın.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 PermissionDenied: caller does not have permission"',
        solution:
          'Service account-un IAM rolları çatışmır. IAM & Admin → IAM → service account e-poçtunuzu tapın → həm "BigQuery Data Editor", həm də "BigQuery Job User" rollarının təyin olunduğunu təsdiqləyin.',
      },
      {
        problem: '"Dataset X not found"',
        solution:
          'Səhv məlumat dəsti adı VƏ YA yer uyğunsuzluğu (çoxregionlu "EU" ilə region "europe-west1"). Dəqiq məlumat dəsti adını BigQuery Console-dan kopyalayın.',
      },
      {
        problem: '"Invalid JSON"',
        solution:
          'JSON-un yalnız bir hissəsini yapışdırmısınız və ya kənarlarda artıq simvol var. Service account JSON faylını əsl redaktorla açın (VS Code tövsiyə olunur, Notepad YOX), hamısını seçmək üçün Ctrl+A, kopyalayın, FreeCrawl sahəsini təmizləyin, yapışdırın.',
      },
    ],
    notes: [
      'Xərc: BigQuery pulsuz səviyyəsi (10GB yaddaş + 1TB sorğu/ay) normal istifadəni əhatə edir. 1M URL-lik tarama ~500MB; sorğu xərci SQL-inizdən asılıdır.',
      'Sxem təkamülü: FreeCrawl ixrac cədvəlini avtomatik yaradır/yeniləyir. CrawlUrlRow sxeminə yeni sütunlar əlavə olunsa, ixrac cədvəli onları qəbul edir (BigQuery DDL çevikliyi).',
    ],
    lastReviewed: '2026-06-01',
  },
};
