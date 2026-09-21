/**
 * Hindi integration setup guides. Generated from the guide source —
 * see `./index.ts` for how a locale is picked. Keep the step count,
 * links and `lastReviewed` in lockstep with `en.ts`; the parity test
 * in `tests/` compares them.
 */
import type { Guide } from './types.js';

export const GUIDES_HI: Record<string, Guide> = {
  openai: {
    intro:
      'OpenAI के API के ज़रिए हर URL पर एक कस्टम प्रॉम्प्ट चलाएँ — सामग्री विश्लेषण, शीर्षक सुझाव, सारांश। उपयोग आपके अपने OpenAI खाते से बिल होता है; FreeCrawl एक मुफ़्त मिडलवेयर है, API कॉल का खर्च आपकी जेब से जाता है।',
    prereqs: [
      'OpenAI खाता (https://platform.openai.com पर मुफ़्त साइन अप करें)।',
      'वैध भुगतान विधि — कुंजियाँ काम करने से पहले OpenAI को न्यूनतम $5 बैलेंस चाहिए।',
    ],
    steps: [
      {
        title: 'platform.openai.com पर साइन इन करें',
        detail: 'अपना OpenAI खाता इस्तेमाल करें। अभी खाता नहीं है तो "Sign up"।',
        link: {
          label: 'platform.openai.com',
          url: 'https://platform.openai.com',
        },
      },
      {
        title: 'बाएँ साइडबार में "API keys" क्लिक करें',
        detail: 'बाईं ओर चाबी-आइकन वाला मेनू आइटम। आप सीधे URL पर भी जा सकते हैं।',
        link: {
          label: 'API keys पेज',
          url: 'https://platform.openai.com/api-keys',
        },
      },
      {
        title: '"+ Create new secret key" क्लिक करें (ऊपर दाएँ)',
        detail:
          'डायलॉग में:\n• Name: "FreeCrawl SEO Tool" (कोई भी याद रखने वाला लेबल)\n• Project: Default project या अपनी पसंद\n• Permissions: All (सबसे आसान; सीमित स्कोप भी काम करते हैं)\nफिर "Create secret key"।',
      },
      {
        title: 'कुंजी कॉपी करें — यह फिर कभी नहीं दिखेगी',
        detail:
          'कुंजी `sk-...` से शुरू होती है। अभी कॉपी नहीं की तो हमेशा के लिए खो जाएगी (नई बनानी पड़ेगी)। इसे पासवर्ड मैनेजर में सहेजें — ब्राउज़र टैब में न छोड़ें।',
      },
      {
        title: 'इसे इस पैनल के "API Key" फ़ील्ड में पेस्ट करें + Save क्लिक करें',
        detail:
          'FreeCrawl कुंजी को OS क्रेडेंशियल स्टोर (Windows DPAPI, macOS Keychain, Linux Secret Service) में एन्क्रिप्ट करके रखता है। कभी सादे टेक्स्ट में नहीं लिखी जाती।',
      },
      {
        title: 'AI टैब में परखें',
        detail:
          'सेटिंग्स बंद करें → ऊपर के "AI" टैब पर जाएँ → क्रॉल से कुछ URL चुनें → "Run AI" क्लिक करें। पहली कॉल ~2-3 सेकंड लेती है।',
      },
    ],
    troubleshooting: [
      {
        problem: '"You exceeded your current quota"',
        solution:
          'आपके OpenAI खाते में बैलेंस नहीं है। platform.openai.com → Billing → "Add payment method" → कार्ड जोड़ें और $5+ लोड करें। नए खातों को अपने आप क्रेडिट नहीं मिलता; आपको टॉप-अप करना होगा।',
      },
      {
        problem: '"Incorrect API key provided" / 401',
        solution:
          'कुंजी के शुरू या अंत में शायद कोई फ़ालतू स्पेस है। नई बनाएँ, ध्यान से कॉपी करें। पुरानी को रद्द करें।',
      },
      {
        problem: '"Rate limit exceeded"',
        solution:
          'बहुत अधिक समानांतर अनुरोध। सेटिंग्स → AI में समांतरता घटाएँ (डिफ़ॉल्ट: 3)। Tier 1 खाते मॉडल के हिसाब से 500-3500 RPM पर चलते हैं।',
      },
    ],
    notes: [
      'मूल्य (2026-06): gpt-4o-mini ~$0.15/1M इनपुट टोकन, gpt-4o ~$2.50/1M इनपुट। सामान्य प्रॉम्प्ट + उत्तर के साथ 1000 URL: ~$0.50-2।',
      'Usage limits पेज पर मासिक कठोर सीमा तय करें — आप नहीं चाहेंगे कि बेकाबू 1M URL क्रॉल $1000 का बिल बनाए।',
    ],
    lastReviewed: '2026-06-01',
  },
  anthropic: {
    intro:
      'Anthropic के API के ज़रिए Claude पर प्रॉम्प्ट चलाएँ। Claude के शीर्ष मॉडल (Sonnet 4.6, Opus 4.8) प्रतिस्पर्धियों की तुलना में कम "AI-जैसा" SEO आउटपुट देते हैं। आपके अपने Anthropic खाते से बिल होता है।',
    prereqs: [
      'Anthropic खाता (https://console.anthropic.com)।',
      'पंजीकृत भुगतान विधि (नए उपयोगकर्ताओं को $5 प्रोमो क्रेडिट मिलता है)।',
    ],
    steps: [
      {
        title: 'console.anthropic.com पर साइन इन करें',
        link: {
          label: 'console.anthropic.com',
          url: 'https://console.anthropic.com',
        },
      },
      {
        title: 'ऊपर-दाएँ ड्रॉपडाउन से "API Keys" पेज खोलें',
        detail: 'Settings मेनू के अंतर्गत "API Keys" प्रविष्टि।',
        link: {
          label: 'API Keys पेज',
          url: 'https://console.anthropic.com/settings/keys',
        },
      },
      {
        title: '"+ Create Key" क्लिक करें',
        detail:
          'डायलॉग में:\n• Name: "FreeCrawl SEO Tool"\n• Workspace: Default workspace\n• Environment: Production\nफिर "Create Key"।',
      },
      {
        title: 'कुंजी कॉपी करें — यह फिर कभी नहीं दिखेगी',
        detail: 'कुंजी `sk-ant-...` से शुरू होती है। खो गई तो नई बना लें।',
      },
      {
        title: 'इसे "API Key" फ़ील्ड में पेस्ट करें + Save',
      },
      {
        title: 'वैकल्पिक: मॉडल चुनें',
        detail:
          'सेटिंग्स → AI में "Model" फ़ील्ड मॉडल id स्वीकार करता है (डिफ़ॉल्ट: claude-sonnet-4-6)। गति-प्राथमिकता: claude-haiku-4-5 (~10x सस्ता, 3x तेज़)। गुणवत्ता-प्राथमिकता: claude-opus-4-8।',
      },
    ],
    troubleshooting: [
      {
        problem: '"Your credit balance is too low"',
        solution: 'console.anthropic.com → Settings → Billing → "Add credits" — न्यूनतम $5।',
      },
      {
        problem: '"Number of request tokens has exceeded your rate limit"',
        solution:
          'Tier 1 खाते ~50 RPM। सेटिंग्स → AI में समांतरता 2-3 करें। ऊँचे टियर के लिए $25+ खर्च करना होगा (Tier 2: 1000 RPM)।',
      },
      {
        problem: '"Invalid API key"',
        solution:
          'सुनिश्चित करें कि "sk-ant-" प्रीफ़िक्स सही-सलामत है और कोई फ़ालतू स्पेस नहीं है। API Keys पेज देखें — अगर वहाँ कुंजी सक्रिय दिखती है, तो कुंजी ठीक है।',
      },
    ],
    notes: [
      'मूल्य (2026-06): Haiku 4.5 ~$0.25/$1.25 (प्रति 1M टोकन इनपुट/आउटपुट), Sonnet 4.6 ~$3/$15, Opus 4.8 ~$15/$75।',
      'Anthropic प्रॉम्प्ट कैशिंग सपोर्ट करता है — 5 मिनट के भीतर दोहराए गए लंबे सिस्टम प्रॉम्प्ट पर 90% छूट (FreeCrawl का AI पैनल अभी कैशिंग इस्तेमाल नहीं करता — बाद के रिलीज़ में आएगा)।',
    ],
    lastReviewed: '2026-06-01',
  },
  ollama: {
    intro:
      'Ollama स्थानीय रूप से होस्ट किए गए LLM के लिए ओपन-सोर्स रनटाइम है। कोई API कुंजी नहीं, हमेशा के लिए मुफ़्त, इंटरनेट की भी ज़रूरत नहीं। लागत शून्य; बस बड़े मॉडलों के लिए VRAM/RAM चाहिए।',
    prereqs: [
      'macOS 12+, Windows 10+ या Linux (Ubuntu 22.04+ अनुशंसित)।',
      'कम से कम 8 GB RAM (छोटे मॉडल)। Llama 3.2 3B को ~2 GB VRAM/RAM चाहिए।',
      'GPU अनुशंसित पर अनिवार्य नहीं — CPU भी चलता है (धीमा)।',
    ],
    steps: [
      {
        title: 'Ollama डाउनलोड + इंस्टॉल करें',
        detail:
          'अपने OS का इंस्टॉलर चुनें:\n• Windows: OllamaSetup.exe\n• macOS: Ollama.dmg\n• Linux: curl -fsSL https://ollama.com/install.sh | sh\n\nइंस्टॉल के बाद Ollama पृष्ठभूमि में चलता है (सिस्टम ट्रे आइकन)।',
        link: {
          label: 'ollama.com/download',
          url: 'https://ollama.com/download',
        },
      },
      {
        title: 'एक मॉडल खींचें',
        detail:
          'टर्मिनल खोलकर चलाएँ:\n\n  ollama pull llama3.2\n\nllama3.2 (3B पैरामीटर) ~2GB, तेज़, कम संसाधन। बड़े विकल्प:\n  ollama pull llama3.3:70b   (~40GB, केवल दमदार GPU)\n  ollama pull qwen2.5:7b     (~4GB, संतुलित)\n  ollama pull mistral:7b     (~4GB, विकल्प)',
      },
      {
        title: 'मॉडल की त्वरित जाँच',
        detail:
          'टर्मिनल में:\n  ollama run llama3.2\n\nएक इंटरैक्टिव चैट खुलती है। "hello" टाइप करें — जवाब मिले तो सब ठीक है। बाहर निकलने के लिए Ctrl+D।',
      },
      {
        title: 'इस पैनल में Ollama एंडपॉइंट दर्ज करें',
        detail:
          'डिफ़ॉल्ट: http://localhost:11434 (पहले से भरा)। Ollama किसी और पोर्ट पर चले तो बदलें।',
      },
      {
        title: 'जो मॉडल खींचा उसका नाम दर्ज करें',
        detail:
          'जैसे "llama3.2" या "qwen2.5:7b"। खाली छोड़ें तो FreeCrawl पहला उपलब्ध मॉडल चुन लेगा।',
      },
      {
        title: 'सहेजें + परखें',
        detail: 'AI टैब में छोटा बैच चलाएँ। केवल CPU: ~5-15 सेकंड/URL। GPU: ~1-3 सेकंड।',
      },
    ],
    troubleshooting: [
      {
        problem: 'AI tab says "Connection refused"',
        solution:
          'Ollama चल नहीं रहा। टर्मिनल में "ollama serve" चलाएँ या सिस्टम ट्रे / Start मेनू से Ollama ऐप लॉन्च करें।',
      },
      {
        problem: '"model \'X\' not found"',
        solution:
          'मॉडल खींचा नहीं गया। "ollama pull <मॉडल-नाम>" चलाएँ। डिस्क पर क्या है यह देखने के लिए "ollama list" इस्तेमाल करें।',
      },
      {
        problem: 'Replies are very slow (>30 s/URL)',
        solution:
          'मॉडल VRAM में नहीं समाता और CPU पर चला जाता है। छोटा मॉडल आज़माएँ (llama3.2:1b या phi3:mini)। VRAM ज़रूरत: 3B ~2GB, 7B ~4GB, 13B ~8GB।',
      },
    ],
    notes: [
      'पूरी तरह ऑफ़लाइन — इंटरनेट के बिना भी क्रॉल + AI विश्लेषण चलता रहता है।',
      'स्थानीय SEO विश्लेषण गुणवत्ता: 3B मॉडल थोड़े कमज़ोर, 7-13B ठीक-ठाक, 70B GPT-4 स्तर (पर भारी हार्डवेयर)।',
      'सेटिंग्स → AI में समांतरता 1-2 रखें — स्थानीय मॉडल समानांतर अनुरोधों को क्रमबद्ध कर देते हैं।',
    ],
    lastReviewed: '2026-06-01',
  },
  pagespeed: {
    intro:
      'Google PageSpeed Insights हर URL का Lighthouse से ऑडिट करता है और Performance/SEO/Accessibility/Best-Practices स्कोर + Core Web Vitals (LCP/CLS/INP) लौटाता है। एक मुफ़्त API कुंजी से 25,000 ऑडिट/दिन मिलते हैं।',
    prereqs: ['Google खाता।', 'Google Cloud Console प्रोजेक्ट (नीचे के चरणों में बना सकते हैं)।'],
    steps: [
      {
        title: 'Google Cloud Console खोलें',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'प्रोजेक्ट चुनें या बनाएँ',
        detail:
          'ऊपर-बाएँ प्रोजेक्ट ड्रॉपडाउन → "New Project" → नाम: "FreeCrawl SEO" → Create। बिलिंग खाते की ज़रूरत नहीं — PSI मुफ़्त टियर को प्रमाणीकरण के लिए सिर्फ़ क्रेडेंशियल चाहिए।',
      },
      {
        title: 'PageSpeed Insights API सक्षम करें',
        detail: 'यह डीप लिंक सीधे API के सक्षम-पेज पर जाता है:',
        link: {
          label: 'PageSpeed Insights API → Enable',
          url: 'https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com',
        },
      },
      {
        title: 'नीला "Enable" बटन क्लिक करें → 30 सेकंड प्रतीक्षा करें',
      },
      {
        title: 'Credentials पर जाएँ',
        link: {
          label: 'Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: '"+ Create Credentials" → "API key" क्लिक करें',
        detail: 'एक API कुंजी बनती है (`AIzaSy...` से शुरू)। तुरंत कॉपी करें।',
      },
      {
        title: 'वैकल्पिक: API कुंजी सीमित करें (अनुशंसित)',
        detail:
          '"Edit API key" → "Restrict key" क्लिक करें:\n• API restrictions: "Restrict key" → "PageSpeed Insights API"\n• Application restrictions: "None" (FreeCrawl डेस्कटॉप ऐप है, इसलिए referrer/IP फ़िल्टरिंग काम नहीं करेगी)\nअसीमित कुंजियाँ भी चलती हैं, पर हम सीमित करने की सलाह देते हैं।',
      },
      {
        title: 'कुंजी को इस पैनल के "API Key" फ़ील्ड में पेस्ट करें + Save',
      },
      {
        title: 'PageSpeed टैब में परखें',
        detail: 'ऊपर का "PageSpeed" टैब → कुछ URL चुनें → "Run audit"। पहला ऑडिट ~10-15 सेकंड।',
      },
    ],
    troubleshooting: [
      {
        problem: '"This API method requires billing to be enabled"',
        solution:
          'आपने गलत API सक्षम किया (जैसे पुराना "Cloud PageSpeed Insights API")। सही है "PageSpeed Insights API" (pagespeedonline.googleapis.com)। चरण 3 का लिंक फिर खोलें।',
      },
      {
        problem: '"API key not valid"',
        solution:
          'कुंजी की पाबंदियाँ गलत हैं। Cloud Console → Credentials → कुंजी क्लिक करें → सुनिश्चित करें कि अनुमत API में "PageSpeed Insights API" है। या जाँच के लिए अस्थायी रूप से पाबंदियाँ हटाएँ।',
      },
      {
        problem: '"Quota exceeded" — before hitting 25,000',
        solution:
          'एक प्रति-मिनट सीमा भी है: 240 क्वेरी/मिनट। सेटिंग्स → PageSpeed में समांतरता 2-3 रखें। दैनिक 25K सीमा बहुत ऊँची है — सामान्य उपयोग में नहीं दिखेगी।',
      },
    ],
    notes: [
      'लागत: मुफ़्त — उन गिने-चुने Google API में से जिन्हें बिलिंग नहीं चाहिए। बिना-कुंजी/अनाम मोड अब 0 क्वेरी/दिन है (2026 की शुरुआत में बंद), इसलिए कुंजी अनिवार्य है।',
      'गति: हर URL ~5-10 सेकंड (Google वास्तव में Lighthouse इंस्टेंस चलाता है)। 1000 URL ~2 घंटे।',
      'Mobile + Desktop अलग-अलग API कॉल गिने जाते हैं — "दोनों" चुनने से कोटा उपयोग दोगुना हो जाता है।',
    ],
    lastReviewed: '2026-06-01',
  },
  ahrefs: {
    intro:
      'Ahrefs के API से प्रति URL बैकलिंक संख्या, domain rating, रेफ़रिंग डोमेन, ऑर्गेनिक कीवर्ड संख्या खींचें। यह Ahrefs का सबसे महँगा इंटीग्रेशन है — API एक्सेस $500+/माह की योजनाओं के पीछे है।',
    prereqs: [
      'Ahrefs Standard ($249/माह) या उससे ऊपर की सदस्यता।',
      'ऐड-ऑन "API" टियर (बेस प्लान के ऊपर अतिरिक्त $500/माह, या अलग टियर)।',
    ],
    steps: [
      {
        title: 'Ahrefs में साइन इन करें → API पेज',
        link: {
          label: 'ahrefs.com/api',
          url: 'https://ahrefs.com/api',
        },
      },
      {
        title: 'सदस्यता चुनें (अगर API एक्सेस पहले से नहीं है)',
        detail:
          'API v3 एक्सेस Enterprise टियर और समर्पित API योजनाओं के साथ आता है। कोटेशन के लिए सेल्स से संपर्क करें।',
      },
      {
        title: 'अपने खाते में API टोकन बनाएँ',
        detail:
          'Ahrefs डैशबोर्ड → Account settings → API → Generate token। टोकन प्रारूप: `sk-...` या ऐसा ही।',
      },
      {
        title: 'इसे "API Key" फ़ील्ड में पेस्ट करें + Save',
      },
      {
        title: 'SEO Authority टैब में परखें',
        detail: 'ऊपर का "SEO Authority" टैब → प्रदाता: "Ahrefs" → कुछ URL चुनें → "Run"।',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient credits"',
        solution:
          'API row इकाइयाँ खत्म। Ahrefs डैशबोर्ड → API → "Usage" टैब। प्लान अपग्रेड करें या अगले बिलिंग चक्र की प्रतीक्षा करें।',
      },
      {
        problem: '"Unauthorized"',
        solution:
          'आपकी सदस्यता में API एक्सेस शामिल नहीं। अकेले "Ahrefs Standard" से API अधिकार नहीं मिलते — ऊपर से स्पष्ट API टियर चाहिए।',
      },
    ],
    notes: [
      'लागत: प्रति URL ऑडिट लगभग 1-5 API rows। Standard API प्लान ~25K rows/माह।',
      'सस्ते विकल्प: Moz ($99/माह, Domain Authority) या Majestic।',
    ],
    lastReviewed: '2026-06-01',
  },
  majestic: {
    intro:
      'Majestic के API से Trust Flow, Citation Flow और बैकलिंक संख्या खींचें। सबसे किफ़ायती बैकलिंक-केंद्रित प्रदाता।',
    prereqs: ['Majestic Lite ($49.99/माह) या उससे ऊपर की सदस्यता।', 'API एक्सेस — Lite में शामिल।'],
    steps: [
      {
        title: 'Majestic डेवलपर डैशबोर्ड खोलें',
        link: {
          label: 'majestic.com/account/api',
          url: 'https://majestic.com/account/api',
        },
      },
      {
        title: 'API कुंजी बनाएँ',
        detail: 'डैशबोर्ड → "Open API" टैब → "Generate new key" → कॉपी करें।',
      },
      {
        title: 'इसे इस पैनल में पेस्ट करें + Save',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient resources" / "No analysis units"',
        solution:
          'मासिक विश्लेषण इकाई कोटा खत्म। Lite प्लान: 1000 इकाई/माह; Pro: 20K+। Majestic डैशबोर्ड → API → उपयोग देखें।',
      },
    ],
    notes: ['लागत: 1 URL बैकलिंक लुकअप = 5 इकाइयाँ। Lite प्लान (1000 इकाई) ~200 URL/माह।'],
    lastReviewed: '2026-06-01',
  },
  moz: {
    intro:
      'Moz API से Domain Authority (DA), Page Authority (PA) और Spam Score खींचें। कम बजट के लिए सबसे लोकप्रिय विकल्प।',
    prereqs: ['"Moz API" ऐड-ऑन सक्षम के साथ Moz Pro Standard ($99/माह) या उससे ऊपर की सदस्यता।'],
    steps: [
      {
        title: 'Moz API पेज खोलें',
        link: {
          label: 'moz.com/api',
          url: 'https://moz.com/api',
        },
      },
      {
        title: 'Account → API → "Generate Credentials"',
        detail: 'दो मान बनते हैं: "Access ID" और "Secret Key"। दोनों कॉपी करें।',
      },
      {
        title: 'हर एक को इस पैनल के "Access ID" + "Secret Key" फ़ील्ड में पेस्ट करें + Save',
        detail: 'दो अलग फ़ील्ड — क्रम से भरें।',
      },
    ],
    troubleshooting: [
      {
        problem: '"Authentication failed"',
        solution:
          'Access ID या Secret Key गलत कॉपी-पेस्ट हुई। Moz डैशबोर्ड से फिर कॉपी करें — Access ID छोटी (~13 अक्षर), Secret Key लंबी (~40 अक्षर) होती है।',
      },
    ],
    notes: ['लागत: Standard प्लान (1500 rows/माह), Medium (10K rows/माह), Large (100K rows/माह)।'],
    lastReviewed: '2026-06-01',
  },
  semrush: {
    intro:
      'Semrush API से ऑर्गेनिक कीवर्ड, ट्रैफ़िक अनुमान और SERP फ़ीचर खींचें। सबसे व्यापक कीवर्ड + ट्रैफ़िक डेटा।',
    prereqs: [
      'Semrush Pro ($129/माह) या उससे ऊपर की सदस्यता।',
      'खाते से जुड़ी "API units" (Guru टियर और ऊपर में API एक्सेस शामिल)।',
    ],
    steps: [
      {
        title: 'Semrush में साइन इन करें → Subscription info → API',
        link: {
          label: 'Semrush API एक्सेस',
          url: 'https://www.semrush.com/accounts/subscription-info/api-units/',
        },
      },
      {
        title: 'API कुंजी कॉपी करें',
      },
      {
        title: 'इसे इस पैनल में पेस्ट करें + Save',
      },
    ],
    troubleshooting: [
      {
        problem: '"API units exhausted"',
        solution:
          'मासिक इकाई कोटा खत्म। Guru प्लान: 7K इकाई/माह, Business: 25K+। Semrush डैशबोर्ड → API → उपयोग देखें।',
      },
    ],
    notes: ['लागत: 1 URL बैकलिंक क्वेरी = 10 इकाइयाँ; 1 डोमेन ओवरव्यू = 1 इकाई।'],
    lastReviewed: '2026-06-01',
  },
  gsc: {
    intro:
      'Google Search Console API से प्रति-URL Search Console मेट्रिक्स (क्लिक, इंप्रेशन, CTR, औसत स्थिति) खींचें। URL Inspection API कवरेज निर्णय + अंतिम क्रॉल समय भी देता है। "अपना क्लाइंट लाएँ" मॉडल — आप अपना Google Cloud OAuth क्लाइंट बनाकर पेस्ट करते हैं; FreeCrawl कोई साझा बिचौलिया ऐप इस्तेमाल नहीं करता।',
    prereqs: [
      'Google खाता (जिस GSC प्रॉपर्टी को जोड़ना है उसका मालिक / सह-मालिक होना चाहिए)।',
      'कम से कम एक Google Search Console प्रॉपर्टी जोड़ी + सत्यापित हो।',
    ],
    steps: [
      {
        title: 'Google Cloud Console खोलें और नया प्रोजेक्ट बनाएँ',
        detail:
          'ऊपर-बाएँ प्रोजेक्ट ड्रॉपडाउन → "New Project" → नाम: "FreeCrawl SEO Integrations" (जो चाहें) → Create। यह प्रोजेक्ट सिर्फ़ OAuth क्रेडेंशियल के लिए है — बिलिंग ज़रूरी नहीं।',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Google Auth Platform → Branding खोलें',
        detail:
          'बायाँ मेनू "APIs & Services" → "OAuth consent screen" (नया UI: "Google Auth Platform → Branding")। User Type: "External" → Create।',
        link: {
          label: 'OAuth consent screen',
          url: 'https://console.cloud.google.com/auth/branding',
        },
      },
      {
        title: 'OAuth सहमति स्क्रीन भरें',
        detail:
          'सिर्फ़ अनिवार्य फ़ील्ड:\n• App name: "FreeCrawl Local"\n• User support email: आपका ईमेल\n• Developer contact information: आपका ईमेल\nबाकी खाली छोड़ें। Save and Continue → Save and Continue → Save and Continue → Back to Dashboard।',
      },
      {
        title: 'अति महत्वपूर्ण: खुद को Test User के रूप में जोड़ें',
        detail:
          'बायाँ मेनू → "Audience" (पुराना UI "Test users") → "Add users" → जिस Gmail को जोड़ेंगे वह पेस्ट करें → Save।\n\nचेतावनी: यह चरण न छोड़ें। छोड़ने पर OAuth के दौरान 403 access_denied आता है — "Testing" स्थिति वाले ऐप केवल टेस्ट यूज़र सूची के खातों को जुड़ने देते हैं।',
        link: {
          label: 'Audience पेज',
          url: 'https://console.cloud.google.com/auth/audience',
        },
      },
      {
        title: 'Google Search Console API सक्षम करें',
        detail:
          'यह लिंक सीधे सक्षम-पेज पर जाता है → नीला "Enable" क्लिक करें → 30 सेकंड प्रतीक्षा करें।',
        link: {
          label: 'Search Console API → Enable',
          url: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com',
        },
      },
      {
        title: 'OAuth Client ID बनाएँ',
        detail:
          'बायाँ मेनू → "Credentials" (नया UI "Google Auth Platform → Clients") → "+ Create credentials" → "OAuth client ID"।',
        link: {
          label: 'Credentials पेज',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'OAuth Client प्रकार में "Desktop app" चुनें (Web app नहीं!)',
        detail:
          'Application type ड्रॉपडाउन → "Desktop app"। Name: "FreeCrawl SEO Tool"। Create → डायलॉग Client ID + Client Secret दिखाता है। दोनों तुरंत कॉपी करें (Secret फिर नहीं दिखता)।\n\nDESKTOP क्यों: FreeCrawl हर कनेक्शन के लिए एक यादृच्छिक स्थानीय पोर्ट (जैसे 127.0.0.1:63092) इस्तेमाल करता है। "Web application" को निश्चित redirect URI सूची चाहिए — वह यादृच्छिक पोर्ट मेल नहीं खा सकता → विफल। "Desktop app" पोर्ट की परवाह किए बिना loopback रीडायरेक्ट अपने आप स्वीकार करता है।',
      },
      {
        title: 'Client ID + Client Secret इस पैनल में पेस्ट करें + Save',
        detail:
          'दो फ़ील्ड: "OAuth Client ID" (...apps.googleusercontent.com) और "OAuth Client Secret" (GOCSPX-...)। Save।',
      },
      {
        title: '"कनेक्ट" क्लिक करें — आपका ब्राउज़र खुलता है',
        detail:
          'Save के बाद कार्ड पर "कनेक्ट" बटन दिखता है। क्लिक करें → Google की सहमति स्क्रीन आपके डिफ़ॉल्ट ब्राउज़र में खुलती है।',
      },
      {
        title: 'उस Google खाते से साइन इन करें जिसे टेस्ट यूज़र बनाया',
        detail:
          'खाता चयनकर्ता में वह ईमेल चुनें जिसे टेस्ट यूज़र में जोड़ा। "Continue" → "Google hasn\'t verified this app" चेतावनी (टेस्टिंग मोड में अपेक्षित)। "Advanced" → "Go to FreeCrawl Local (unsafe)" → अनुमतियाँ स्वीकारें → Allow।',
      },
      {
        title: 'वापस FreeCrawl में — आपको "कॉन्फ़िगर किया गया" दिखना चाहिए',
        detail:
          'सेटिंग्स में Search Console कार्ड पर अब हरा "कॉन्फ़िगर किया गया" बैज दिखता है। अब आप ऊपर के "Search Console" टैब में जाकर प्रॉपर्टी सूची + डेटा ला सकते हैं।',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 access_denied"',
        solution:
          'आपने टेस्ट यूज़र नहीं जोड़ा, या गलत Google खाते से साइन इन कर रहे हैं। Audience पेज पर वापस जाएँ और जाँचें कि जो खाता इस्तेमाल कर रहे हैं वह टेस्ट यूज़र सूची में है। कई Google खाते हों तो देखें खाता चयनकर्ता कौन-सा इस्तेमाल कर रहा है।',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'या तो Search Console API सक्षम नहीं था या OAuth सहमति स्क्रीन पर "View Search Console data for your verified sites" अनुमति चेकबॉक्स अनचेक था। (1) Search Console API सक्षम करें (चरण 5), (2) myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → फिर कनेक्ट क्लिक करें और सहमति स्क्रीन पर हर अनुमति चेक करें।',
      },
      {
        problem: '"redirect_uri_mismatch"',
        solution:
          'गलत OAuth क्लाइंट प्रकार। Credentials पेज से क्लाइंट हटाएँ और "Desktop app" के रूप में फिर बनाएँ (चरण 7)। "Web application" इस फ़्लो में कभी काम नहीं करेगा।',
      },
      {
        problem: '"This app isn\'t verified" warning',
        solution:
          'अपेक्षित व्यवहार (टेस्टिंग-मोड ऐप + संवेदनशील स्कोप)। आगे बढ़ने के लिए "Advanced" → "Go to <app> (unsafe)" क्लिक करें। ऐप टेस्टिंग मोड में है और केवल टेस्ट यूज़र को अंदर आने देता है — यह सुरक्षित है।',
      },
      {
        problem: 'Connection broke after 7 days',
        solution:
          'टेस्टिंग मोड में OAuth रिफ़्रेश टोकन हर 7 दिन में समाप्त होते हैं। सेटिंग्स → इंटीग्रेशन → Search Console → "डिस्कनेक्ट" → "कनेक्ट" से पुनः प्रमाणित करें। समाप्ति से छुटकारा पाने के लिए ऐप को Google की सत्यापन प्रक्रिया (1-4 सप्ताह) से गुज़ारना होगा।',
      },
    ],
    notes: [
      'आपकी स्वामित्व वाली प्रॉपर्टी (sc-domain:example.com या https://example.com/) में आपके खाते द्वारा सत्यापित हर साइट शामिल है।',
      'GSC डेटा ~2 दिन पीछे रहता है — आज के क्लिक तुरंत नहीं दिखते।',
      'मुफ़्त कोटा: 1200 क्वेरी/मिनट, 25,000 क्वेरी/दिन — सामान्य उपयोग में कभी नहीं पहुँचेंगे।',
    ],
    lastReviewed: '2026-06-01',
  },
  ga4: {
    intro:
      'प्रति-URL GA4 मेट्रिक्स (सत्र, उपयोगकर्ता, बाउंस दर, सहभागिता दर, रूपांतरण) खींचें। "अपना क्लाइंट लाएँ" — आपका अपना GCP OAuth क्लाइंट इस्तेमाल होता है।',
    prereqs: [
      'जिस GA4 प्रॉपर्टी को जोड़ेंगे उस पर कम से कम Viewer एक्सेस वाला Google खाता।',
      'GSC के लिए बनाया गया वही OAuth क्लाइंट दोबारा इस्तेमाल कर सकते हैं — बस सही API सक्षम करें।',
    ],
    steps: [
      {
        title: 'अगर GSC पहले से सेट है: वही OAuth क्लाइंट दोबारा इस्तेमाल करें',
        detail:
          'अगर Search Console पहले से कॉन्फ़िगर है, तो वही Google Cloud प्रोजेक्ट और वही OAuth Client ID + Secret इस्तेमाल कर सकते हैं। फिर से बनाने की ज़रूरत नहीं — बस नीचे के API सक्षम करें और क्रेडेंशियल यहाँ पेस्ट करें।',
      },
      {
        title: 'दोनों GA4 API सक्षम करें',
        detail:
          'GA4 को दो अलग API चाहिए:\n\n1. Google Analytics Admin API (प्रॉपर्टी सूची के लिए)\n2. Google Analytics Data API (असल रिपोर्ट के लिए)\n\nदोनों सक्षम न किए तो "API not enabled" त्रुटियाँ दिखेंगी।',
        link: {
          label: 'Admin API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com',
        },
      },
      {
        title: 'Data API भी सक्षम करें',
        link: {
          label: 'Data API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
        },
      },
      {
        title: 'GSC वाले ही Client ID + Secret पेस्ट करें',
        detail:
          'अगर GSC पहले से जुड़ा है, तो शायद पेस्ट भी न करना पड़े — कार्ड क्रेडेंशियल साझा कर सकते हैं। GA4 शून्य से सेट कर रहे हैं तो अपने GSC क्लाइंट का ID/Secret इस पैनल में कॉपी करें।',
      },
      {
        title: '"कनेक्ट" → Google से साइन इन करें + GA4 स्कोप स्वीकारें',
        detail:
          'उस Google खाते से साइन इन करें जिसे टेस्ट यूज़र बनाया। सहमति स्क्रीन पर पुष्टि करें कि "Google Analytics: View Google Analytics property data" अनुमति चेक है।',
      },
      {
        title: 'GA4 टैब में प्रॉपर्टी सूची + डेटा लाएँ',
        detail:
          'ऊपर के "GA4" टैब पर जाएँ → "List Properties" आपके खाते को दिखने वाली हर GA4 प्रॉपर्टी दिखाता है → एक चुनें → अवधि चुनें (7/28/90 दिन) → "Fetch"। GA4 लगभग रीयल-टाइम है, परिणाम तुरंत दिखते हैं।',
      },
    ],
    troubleshooting: [
      {
        problem: '"Google Analytics Admin API has not been used in project X"',
        solution:
          'Admin API सक्षम नहीं। चरण 2 का लिंक खोलें → Enable। 30 सेकंड रुकें, फिर कोशिश करें। अगली बार Data API के लिए वही त्रुटि आएगी — चरण 3 का लिंक खोलकर उसे भी सक्षम करें।',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'OAuth स्कोप में GA4 शामिल नहीं। myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → फिर कनेक्ट क्लिक करें → Google Analytics अनुमति चेकबॉक्स चेक करें।',
      },
      {
        problem: 'Property list comes back empty',
        solution:
          'जो Google खाता जोड़ा उसकी किसी GA4 प्रॉपर्टी पर कोई भूमिका नहीं। GA4 डैशबोर्ड → Admin → Property Access Management → पुष्टि करें कि आपके ईमेल के पास कम से कम Viewer है।',
      },
    ],
    notes: [
      'GA4 डेटा लगभग रीयल-टाइम है — आज का डेटा 4-24 घंटे में दिखता है।',
      'मुफ़्त कोटा: 200K अनुरोध/दिन, प्रति प्रॉपर्टी 50 अनुरोध/मिनट।',
    ],
    lastReviewed: '2026-06-01',
  },
  sheets: {
    intro:
      'क्रॉल परिणाम सीधे Google Sheet में निर्यात करें। सहकर्मियों के साथ साझा लाइव दस्तावेज़ पर काम करते समय "CSV डाउनलोड → Excel में खोलें" से बेहतर।',
    prereqs: [
      'Google खाता।',
      'GSC के लिए बनाया गया वही OAuth क्लाइंट दोबारा इस्तेमाल कर सकते हैं।',
    ],
    steps: [
      {
        title: 'अगर GSC/GA4 सेट है: वही OAuth क्लाइंट दोबारा इस्तेमाल करें',
        detail: 'वही OAuth Client ID + Secret पेस्ट करें (या वे पहले से सहेजे हो सकते हैं)।',
      },
      {
        title: 'Google Sheets API सक्षम करें',
        link: {
          label: 'Sheets API → Enable',
          url: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
        },
      },
      {
        title: 'Google Drive API भी सक्षम करें',
        detail: 'स्प्रेडशीट बनाने/पढ़ने के लिए Sheets API को Drive स्कोप भी चाहिए।',
        link: {
          label: 'Drive API → Enable',
          url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
        },
      },
      {
        title: 'Client ID + Secret पेस्ट करें + Save',
      },
      {
        title: '"कनेक्ट" → सहमति स्क्रीन पर Sheets + Drive स्वीकारें',
        detail:
          'OAuth फ़्लो दो अनुमतियाँ दिखाता है:\n• See, edit, create, and delete all your Google Sheets spreadsheets\n• See, edit, create, and delete only the specific Google Drive files used with this app\nदोनों चेक करें।',
      },
      {
        title: 'निर्यात मेनू से परखें',
        detail:
          'फ़ाइल → निर्यात → "Google Sheets में निर्यात करें"। एक नई Sheet अपने आप बनती है, URL क्लिपबोर्ड में कॉपी होता है।',
      },
    ],
    troubleshooting: [
      {
        problem: '"insufficient authentication scopes"',
        solution:
          'कनेक्ट के दौरान आपने Drive अनुमति चेकबॉक्स चेक नहीं किया। डिस्कनेक्ट + पुनः कनेक्ट करें, दोनों अनुमतियाँ चेक करें।',
      },
    ],
    notes: [
      'Sheets की कठोर सीमा: प्रति स्प्रेडशीट 10M सेल — बड़े क्रॉल (>500K URL) बाँट दिए जाते हैं।',
      'Drive स्कोप "drive.file" है — केवल FreeCrawl द्वारा बनाई फ़ाइलें सुलभ हैं, आपकी मौजूदा फ़ाइलें नहीं।',
    ],
    lastReviewed: '2026-06-01',
  },
  bigquery: {
    intro:
      'क्रॉल डेटा सीधे BigQuery डेटासेट में स्ट्रीम करें। अपने डेटा वेयरहाउस में दिनांकित स्नैपशॉट जमा करने और BI टूल (Looker Studio, Tableau, Metabase) से क्रॉल रुझान देखने के लिए उपयोगी।',
    prereqs: [
      'BigQuery API सक्षम वाला Google Cloud प्रोजेक्ट।',
      'पहले से बना BigQuery डेटासेट।',
      'Service Account JSON (OAuth नहीं — सर्वर-से-सर्वर प्रमाणीकरण)।',
      'बिलिंग-सक्षम GCP प्रोजेक्ट (BigQuery मुफ़्त टियर: 10GB स्टोरेज/माह + 1TB क्वेरी/माह; उससे आगे शुल्क)।',
    ],
    steps: [
      {
        title: 'BigQuery डेटासेट बनाएँ',
        detail:
          'BigQuery Console → अपना प्रोजेक्ट चुनें → "Create dataset" → ID: "freecrawl_seo" (या कोई नाम) → Location: "EU" या "US" (महत्वपूर्ण — बाद में नहीं बदल सकते) → Create dataset।',
        link: {
          label: 'BigQuery Console',
          url: 'https://console.cloud.google.com/bigquery',
        },
      },
      {
        title: 'Service Account बनाएँ',
        detail:
          'IAM & Admin → Service Accounts → "+ Create service account" → नाम: "freecrawl-bigquery" → Create and continue।',
        link: {
          label: 'Service Accounts',
          url: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
        },
      },
      {
        title: 'भूमिकाएँ जोड़ें',
        detail:
          'चरण 2 "Grant this service account access to project" में → दो भूमिकाएँ जोड़ें:\n• BigQuery Data Editor\n• BigQuery Job User\nफिर "Continue" → "Done"।',
      },
      {
        title: 'JSON कुंजी डाउनलोड करें',
        detail:
          'सर्विस अकाउंट सूची में अभी बनाए गए पर क्लिक करें → "Keys" टैब → "Add key" → "Create new key" → Type: JSON → Create।\n\nJSON अपने आप डाउनलोड होता है। टेक्स्ट एडिटर में खोलकर पूरी सामग्री कॉपी करें।\n\nचेतावनी: इस JSON में पूरा क्रेडेंशियल है — इसे पासवर्ड की तरह संभालें। कभी सोर्स कंट्रोल में न डालें।',
      },
      {
        title: 'इसे इस पैनल के "Service Account JSON" फ़ील्ड में पेस्ट करें',
        detail:
          'पूरा JSON पेस्ट करें (खुलने वाले `{` से बंद होने वाले `}` तक)। FreeCrawl JSON को OS क्रेडेंशियल स्टोर में एन्क्रिप्ट करके रखता है।',
      },
      {
        title: '"GCP Project ID" भरें',
        detail:
          'आपका GCP प्रोजेक्ट ID (Cloud Console के ऊपर-बाएँ ड्रॉपडाउन में दिखता है, जैसे "my-gcp-project-12345")। JSON में भी "project_id" फ़ील्ड है — वहाँ से कॉपी कर सकते हैं।',
      },
      {
        title: 'डेटासेट नाम दर्ज करें + Save',
        detail: 'चरण 1 में बनाया डेटासेट नाम (जैसे "freecrawl_seo")।',
      },
      {
        title: 'निर्यात मेनू से परखें',
        detail:
          'फ़ाइल → निर्यात → "BigQuery में निर्यात करें" → टेबल नाम/प्रारूप चुनें → चलाएँ। BigQuery Console में जाँचें कि टेबल दिख गई।',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 PermissionDenied: caller does not have permission"',
        solution:
          'सर्विस अकाउंट की IAM भूमिकाएँ गायब हैं। IAM & Admin → IAM → अपना सर्विस अकाउंट ईमेल खोजें → पुष्टि करें कि "BigQuery Data Editor" और "BigQuery Job User" दोनों असाइन हैं।',
      },
      {
        problem: '"Dataset X not found"',
        solution:
          'गलत डेटासेट नाम या लोकेशन बेमेल (मल्टी-रीजन "EU" बनाम रीजन "europe-west1")। BigQuery Console से सटीक डेटासेट नाम कॉपी करें।',
      },
      {
        problem: '"Invalid JSON"',
        solution:
          'आपने JSON का सिर्फ़ हिस्सा पेस्ट किया या किनारों पर कोई फ़ालतू अक्षर है। सर्विस अकाउंट JSON फ़ाइल को असली एडिटर (VS Code अनुशंसित, Notepad नहीं) में खोलें, Ctrl+A से सब चुनें, कॉपी करें, FreeCrawl फ़ील्ड खाली करें, पेस्ट करें।',
      },
    ],
    notes: [
      'लागत: BigQuery मुफ़्त टियर (10GB स्टोरेज + 1TB क्वेरी/माह) सामान्य उपयोग के लिए काफ़ी है। 1M-URL क्रॉल ~500MB; क्वेरी लागत आपके SQL पर निर्भर।',
      'स्कीमा विकास: FreeCrawl निर्यात टेबल अपने आप बनाता/अपडेट करता है। CrawlUrlRow स्कीमा में नए कॉलम आएँ तो निर्यात टेबल उन्हें अपना लेती है (BigQuery DDL लचीलापन)।',
    ],
    lastReviewed: '2026-06-01',
  },
};
