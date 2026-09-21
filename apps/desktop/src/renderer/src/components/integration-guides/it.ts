/**
 * Italian integration setup guides. Generated from the guide source —
 * see `./index.ts` for how a locale is picked. Keep the step count,
 * links and `lastReviewed` in lockstep with `en.ts`; the parity test
 * in `tests/` compares them.
 */
import type { Guide } from './types.js';

export const GUIDES_IT: Record<string, Guide> = {
  openai: {
    intro:
      "Esegui un prompt personalizzato per URL tramite l'API di OpenAI — analisi dei contenuti, idee per i titoli, riassunti. L'uso viene addebitato sul tuo account OpenAI; FreeCrawl è un intermediario gratuito, le chiamate API le paghi tu.",
    prereqs: [
      'Account OpenAI (registrazione gratuita su https://platform.openai.com).',
      'Metodo di pagamento valido — OpenAI richiede un saldo minimo di 5 $ prima che le chiavi funzionino.',
    ],
    steps: [
      {
        title: 'Accedi su platform.openai.com',
        detail: 'Usa il tuo account OpenAI. Se non ne hai ancora uno, "Sign up".',
        link: {
          label: 'platform.openai.com',
          url: 'https://platform.openai.com',
        },
      },
      {
        title: 'Fai clic su "API keys" nella barra laterale sinistra',
        detail:
          "Voce di menu con l'icona della chiave a sinistra. Puoi anche andare direttamente all'URL.",
        link: {
          label: 'Pagina API keys',
          url: 'https://platform.openai.com/api-keys',
        },
      },
      {
        title: 'Fai clic su "+ Create new secret key" (in alto a destra)',
        detail:
          'Nella finestra:\n• Name: "FreeCrawl SEO Tool" (qualsiasi etichetta promemoria)\n• Project: Default project o quello che preferisci\n• Permissions: All (il più semplice; funzionano anche gli ambiti ristretti)\npoi "Create secret key".',
      },
      {
        title: 'COPIA la chiave — non verrà mai più mostrata',
        detail:
          'La chiave inizia con `sk-...`. Se non la copi ora la perdi per sempre (dovresti crearne una nuova). Salvala in un password manager — non lasciarla in una scheda del browser.',
      },
      {
        title: 'Incollala nel campo "API Key" di questo pannello + fai clic su Salva',
        detail:
          "FreeCrawl memorizza la chiave cifrata nell'archivio credenziali del sistema (Windows DPAPI, Portachiavi macOS, Secret Service Linux). Mai scritta in chiaro.",
      },
      {
        title: 'Prova nella scheda AI',
        detail:
          'Chiudi le Impostazioni → passa alla scheda superiore "AI" → scegli alcuni URL da una scansione → fai clic su "Run AI". La prima chiamata richiede ~2-3 s.',
      },
    ],
    troubleshooting: [
      {
        problem: '"You exceeded your current quota"',
        solution:
          'Il tuo account OpenAI non ha saldo. Vai su platform.openai.com → Billing → "Add payment method" → aggiungi una carta e carica 5 $ o più. I nuovi account non ricevono credito automatico; devi ricaricare.',
      },
      {
        problem: '"Incorrect API key provided" / 401',
        solution:
          "La chiave ha probabilmente uno spazio vagante all'inizio o alla fine. Generane una nuova e copiala con attenzione. Revoca quella vecchia.",
      },
      {
        problem: '"Rate limit exceeded"',
        solution:
          'Troppe richieste in parallelo. Abbassa la concorrenza in Impostazioni → AI (predefinito: 3). Gli account Tier 1 girano a 500-3500 RPM a seconda del modello.',
      },
    ],
    notes: [
      'Prezzi (2026-06): gpt-4o-mini ~0,15 $/1M token in input, gpt-4o ~2,50 $/1M in input. 1000 URL con prompt + risposta tipici: ~0,50-2 $.',
      'Imposta un limite mensile rigido nella pagina Usage limits — non vuoi che una scansione fuori controllo da 1M di URL produca una fattura da 1000 $.',
    ],
    lastReviewed: '2026-06-01',
  },
  anthropic: {
    intro:
      'Esegui prompt su Claude tramite l\'API di Anthropic. I modelli di punta di Claude (Sonnet 4.6, Opus 4.8) producono output SEO meno "con sapore di IA" rispetto ai concorrenti. Addebitato sul tuo account Anthropic.',
    prereqs: [
      'Account Anthropic (https://console.anthropic.com).',
      'Metodo di pagamento registrato (i nuovi utenti ricevono 5 $ di credito promozionale).',
    ],
    steps: [
      {
        title: 'Accedi su console.anthropic.com',
        link: {
          label: 'console.anthropic.com',
          url: 'https://console.anthropic.com',
        },
      },
      {
        title: 'Apri la pagina "API Keys" dal menu a discesa in alto a destra',
        detail: 'Nel menu Settings, voce "API Keys".',
        link: {
          label: 'Pagina API Keys',
          url: 'https://console.anthropic.com/settings/keys',
        },
      },
      {
        title: 'Fai clic su "+ Create Key"',
        detail:
          'Nella finestra:\n• Name: "FreeCrawl SEO Tool"\n• Workspace: Default workspace\n• Environment: Production\npoi "Create Key".',
      },
      {
        title: 'COPIA la chiave — non verrà mai più mostrata',
        detail: 'La chiave inizia con `sk-ant-...`. Se la perdi, ne crei una nuova.',
      },
      {
        title: 'Incollala nel campo "API Key" + Salva',
      },
      {
        title: 'Facoltativo: scegli un modello',
        detail:
          'In Impostazioni → AI, il campo "Model" accetta un id di modello (predefinito: claude-sonnet-4-6). Priorità velocità: claude-haiku-4-5 (~10x più economico, 3x più veloce). Priorità qualità: claude-opus-4-8.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Your credit balance is too low"',
        solution: 'console.anthropic.com → Settings → Billing → "Add credits" — minimo 5 $.',
      },
      {
        problem: '"Number of request tokens has exceeded your rate limit"',
        solution:
          'Gli account Tier 1 girano a ~50 RPM. Abbassa la concorrenza a 2-3 in Impostazioni → AI. Per i tier superiori devi aver speso 25 $ o più (Tier 2: 1000 RPM).',
      },
      {
        problem: '"Invalid API key"',
        solution:
          'Assicurati che il prefisso "sk-ant-" sia intatto e non ci siano spazi vaganti. Controlla la pagina API Keys — se lì la chiave risulta attiva, la chiave in sé è a posto.',
      },
    ],
    notes: [
      'Prezzi (2026-06): Haiku 4.5 ~0,25 $/1,25 $ (input/output per 1M token), Sonnet 4.6 ~3 $/15 $, Opus 4.8 ~15 $/75 $.',
      'Anthropic supporta il caching dei prompt — i system prompt lunghi ripetuti entro 5 min sono scontati del 90% (il pannello AI di FreeCrawl non usa ancora il caching — arriverà in una versione successiva).',
    ],
    lastReviewed: '2026-06-01',
  },
  ollama: {
    intro:
      "Ollama è un runtime open source per LLM ospitati in locale. NESSUNA chiave API, gratis per sempre, non serve nemmeno internet. Costo zero; l'unico svantaggio è la VRAM/RAM per i modelli più grandi.",
    prereqs: [
      'macOS 12+, Windows 10+ o Linux (Ubuntu 22.04+ consigliato).',
      'Almeno 8 GB di RAM (modelli piccoli). Llama 3.2 3B richiede ~2 GB di VRAM/RAM.',
      'GPU consigliata ma non obbligatoria — la CPU funziona (più lenta).',
    ],
    steps: [
      {
        title: 'Scarica + installa Ollama',
        detail:
          "Scegli l'installer del tuo sistema:\n• Windows: OllamaSetup.exe\n• macOS: Ollama.dmg\n• Linux: curl -fsSL https://ollama.com/install.sh | sh\n\nDopo l'installazione Ollama gira in background (icona nella barra di sistema).",
        link: {
          label: 'ollama.com/download',
          url: 'https://ollama.com/download',
        },
      },
      {
        title: 'Scarica un modello',
        detail:
          'Apri un terminale ed esegui:\n\n  ollama pull llama3.2\n\nllama3.2 (3B parametri) pesa ~2GB, veloce, poche risorse. Opzioni più grandi:\n  ollama pull llama3.3:70b   (~40GB, solo GPU potente)\n  ollama pull qwen2.5:7b     (~4GB, equilibrato)\n  ollama pull mistral:7b     (~4GB, alternativa)',
      },
      {
        title: 'Prova rapida del modello',
        detail:
          'Nel terminale:\n  ollama run llama3.2\n\nSi apre una chat interattiva. Scrivi "hello" — se ricevi una risposta, tutto ok. Ctrl+D per uscire.',
      },
      {
        title: "Inserisci l'endpoint di Ollama in questo pannello",
        detail:
          "Predefinito: http://localhost:11434 (già precompilato). Modificalo se Ollama gira su un'altra porta.",
      },
      {
        title: 'Inserisci il nome del modello che hai scaricato',
        detail:
          'Es. "llama3.2" o "qwen2.5:7b". Lascia vuoto per far scegliere a FreeCrawl il primo modello disponibile.',
      },
      {
        title: 'Salva + prova',
        detail: 'Esegui un piccolo lotto nella scheda AI. Solo CPU: ~5-15 s/URL. GPU: ~1-3 s.',
      },
    ],
    troubleshooting: [
      {
        problem: 'AI tab says "Connection refused"',
        solution:
          'Ollama non è in esecuzione. Nel terminale esegui "ollama serve" oppure avvia l\'app Ollama dalla barra di sistema / menu Start.',
      },
      {
        problem: '"model \'X\' not found"',
        solution:
          'Modello non scaricato. Esegui "ollama pull <nome-modello>". Usa "ollama list" per vedere cosa c\'è già su disco.',
      },
      {
        problem: 'Replies are very slow (>30 s/URL)',
        solution:
          'Il modello non entra nella VRAM e passa alla CPU. Prova un modello più piccolo (llama3.2:1b o phi3:mini). Requisiti VRAM: 3B ~2GB, 7B ~4GB, 13B ~8GB.',
      },
    ],
    notes: [
      'Completamente offline — scansione + analisi IA continuano a funzionare anche senza internet.',
      "Qualità dell'analisi SEO locale: i modelli 3B sono un po' deboli, 7-13B discreti, 70B a livello di GPT-4 (ma hardware pesante).",
      'In Impostazioni → AI mantieni la concorrenza a 1-2 — i modelli locali serializzano le richieste parallele.',
    ],
    lastReviewed: '2026-06-01',
  },
  pagespeed: {
    intro:
      'Google PageSpeed Insights verifica ogni URL con Lighthouse e restituisce i punteggi Prestazioni/SEO/Accessibilità/Best practice + i Core Web Vitals (LCP/CLS/INP). Una chiave API gratuita ti dà 25.000 audit/giorno.',
    prereqs: [
      'Account Google.',
      'Progetto Google Cloud Console (puoi crearne uno nei passaggi seguenti).',
    ],
    steps: [
      {
        title: 'Apri Google Cloud Console',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Scegli o crea un progetto',
        detail:
          'Menu a discesa del progetto in alto a sinistra → "New Project" → nome: "FreeCrawl SEO" → Create. NESSUN account di fatturazione richiesto — il livello gratuito di PSI ha bisogno delle credenziali solo per l\'autenticazione.',
      },
      {
        title: 'Abilita la PageSpeed Insights API',
        detail: "Questo link diretto porta alla pagina di abilitazione dell'API:",
        link: {
          label: 'PageSpeed Insights API → Enable',
          url: 'https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com',
        },
      },
      {
        title: 'Fai clic sul pulsante blu "Enable" → attendi 30 s',
      },
      {
        title: 'Vai su Credentials',
        link: {
          label: 'Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'Fai clic su "+ Create Credentials" → "API key"',
        detail: 'Viene generata una chiave API (inizia con `AIzaSy...`). Copiala subito.',
      },
      {
        title: 'Facoltativo: limita la chiave API (consigliato)',
        detail:
          'Fai clic su "Edit API key" → "Restrict key":\n• API restrictions: "Restrict key" → "PageSpeed Insights API"\n• Application restrictions: "None" (FreeCrawl è un\'app desktop, quindi il filtro per referrer/IP non funzionerebbe)\nAnche le chiavi senza restrizioni funzionano, ma consigliamo di limitarle.',
      },
      {
        title: 'Incolla la chiave nel campo "API Key" di questo pannello + Salva',
      },
      {
        title: 'Prova nella scheda PageSpeed',
        detail:
          'Scheda superiore "PageSpeed" → scegli alcuni URL → "Run audit". Il primo audit richiede ~10-15 s.',
      },
    ],
    troubleshooting: [
      {
        problem: '"This API method requires billing to be enabled"',
        solution:
          'Hai abilitato l\'API sbagliata (es. una vecchia "Cloud PageSpeed Insights API"). Quella corretta è "PageSpeed Insights API" (pagespeedonline.googleapis.com). Riapri il link del passaggio 3.',
      },
      {
        problem: '"API key not valid"',
        solution:
          'Le restrizioni della chiave sono sbagliate. Cloud Console → Credentials → fai clic sulla chiave → verifica che "PageSpeed Insights API" sia tra le API consentite. Oppure rimuovi temporaneamente le restrizioni per verificare.',
      },
      {
        problem: '"Quota exceeded" — before hitting 25,000',
        solution:
          "C'è anche un limite al minuto: 240 query/min. In Impostazioni → PageSpeed mantieni la concorrenza a 2-3. Il tetto giornaliero di 25K è altissimo — non lo vedrai in un uso normale.",
      },
    ],
    notes: [
      'Costo: GRATIS — una delle poche API Google che non richiede la fatturazione. La modalità senza chiave/anonima è ora a 0 query/giorno (chiusa a inizio 2026), quindi la chiave è obbligatoria.',
      "Velocità: ogni URL ~5-10 s (Google esegue davvero un'istanza di Lighthouse). 1000 URL ~2 ore.",
      'Mobile + Desktop contano come chiamate API separate — scegliere "entrambi" raddoppia il consumo di quota.',
    ],
    lastReviewed: '2026-06-01',
  },
  ahrefs: {
    intro:
      "Recupera conteggio backlink, domain rating, domini referenti e conteggio delle parole chiave organiche per URL tramite l'API di Ahrefs. È l'integrazione più costosa di Ahrefs — l'accesso API è riservato ai piani da 500 $/mese in su.",
    prereqs: [
      'Abbonamento Ahrefs Standard (249 $/mese) o superiore.',
      'Livello aggiuntivo "API" (500 $/mese in più rispetto al piano base, o un livello diverso).',
    ],
    steps: [
      {
        title: 'Accedi ad Ahrefs → pagina API',
        link: {
          label: 'ahrefs.com/api',
          url: 'https://ahrefs.com/api',
        },
      },
      {
        title: "Scegli un abbonamento (se non hai già l'accesso API)",
        detail:
          "L'accesso all'API v3 è incluso nel livello Enterprise e nei piani API dedicati. Contatta il reparto vendite per un preventivo.",
      },
      {
        title: 'Genera un token API nel tuo account',
        detail:
          'Dashboard Ahrefs → Account settings → API → Generate token. Formato del token: `sk-...` o simile.',
      },
      {
        title: 'Incollalo nel campo "API Key" + Salva',
      },
      {
        title: 'Prova nella scheda SEO Authority',
        detail:
          'Scheda superiore "SEO Authority" → provider: "Ahrefs" → scegli alcuni URL → "Run".',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient credits"',
        solution:
          'Unità di righe API esaurite. Dashboard Ahrefs → API → scheda "Usage". Passa a un piano superiore o attendi il prossimo ciclo di fatturazione.',
      },
      {
        problem: '"Unauthorized"',
        solution:
          'Il tuo abbonamento non include l\'accesso API. "Ahrefs Standard" da solo non dà diritti API — serve un livello API esplicito in aggiunta.',
      },
    ],
    notes: [
      'Costo: circa 1-5 righe API per audit di URL. Piano API Standard ~25K righe/mese.',
      'Alternative più economiche: Moz (99 $/mese, Domain Authority) o Majestic.',
    ],
    lastReviewed: '2026-06-01',
  },
  majestic: {
    intro:
      "Recupera Trust Flow, Citation Flow e conteggio backlink tramite l'API di Majestic. Il provider orientato ai backlink più conveniente.",
    prereqs: [
      'Abbonamento Majestic Lite (49,99 $/mese) o superiore.',
      'Accesso API — incluso con Lite.',
    ],
    steps: [
      {
        title: 'Apri la dashboard sviluppatori di Majestic',
        link: {
          label: 'majestic.com/account/api',
          url: 'https://majestic.com/account/api',
        },
      },
      {
        title: 'Genera una chiave API',
        detail: 'Dashboard → scheda "Open API" → "Generate new key" → copia.',
      },
      {
        title: 'Incollala in questo pannello + Salva',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient resources" / "No analysis units"',
        solution:
          'Quota mensile di unità di analisi esaurita. Piano Lite: 1000 unità/mese; Pro: 20K+. Controlla la dashboard Majestic → API → utilizzo.',
      },
    ],
    notes: ['Costo: 1 ricerca backlink di URL = 5 unità. Piano Lite (1000 unità) ~200 URL/mese.'],
    lastReviewed: '2026-06-01',
  },
  moz: {
    intro:
      "Recupera Domain Authority (DA), Page Authority (PA) e Spam Score tramite l'API Moz. La scelta più popolare per i budget ridotti.",
    prereqs: [
      'Abbonamento Moz Pro Standard (99 $/mese) o superiore con il componente aggiuntivo "Moz API" abilitato.',
    ],
    steps: [
      {
        title: 'Apri la pagina API di Moz',
        link: {
          label: 'moz.com/api',
          url: 'https://moz.com/api',
        },
      },
      {
        title: 'Account → API → "Generate Credentials"',
        detail: 'Vengono prodotti due valori: "Access ID" e "Secret Key". Copiali entrambi.',
      },
      {
        title: 'Incolla ciascuno nei campi "Access ID" + "Secret Key" di questo pannello + Salva',
        detail: "Due campi separati — compilali nell'ordine.",
      },
    ],
    troubleshooting: [
      {
        problem: '"Authentication failed"',
        solution:
          "Access ID o Secret Key copiati male. Ricopiali dalla dashboard Moz — l'Access ID è corto (~13 caratteri), la Secret Key è lunga (~40 caratteri).",
      },
    ],
    notes: [
      'Costo: piano Standard (1500 righe/mese), Medium (10K righe/mese), Large (100K righe/mese).',
    ],
    lastReviewed: '2026-06-01',
  },
  semrush: {
    intro:
      "Recupera parole chiave organiche, stime di traffico e funzionalità SERP tramite l'API Semrush. I dati su parole chiave + traffico più completi.",
    prereqs: [
      'Abbonamento Semrush Pro (129 $/mese) o superiore.',
      '"API units" associate all\'account (il livello Guru e superiori includono l\'accesso API).',
    ],
    steps: [
      {
        title: 'Accedi a Semrush → Subscription info → API',
        link: {
          label: 'Accesso API Semrush',
          url: 'https://www.semrush.com/accounts/subscription-info/api-units/',
        },
      },
      {
        title: 'Copia la chiave API',
      },
      {
        title: 'Incollala in questo pannello + Salva',
      },
    ],
    troubleshooting: [
      {
        problem: '"API units exhausted"',
        solution:
          'Quota mensile di unità esaurita. Piano Guru: 7K unità/mese, Business: 25K+. Controlla la dashboard Semrush → API → utilizzo.',
      },
    ],
    notes: ['Costo: 1 query backlink di URL = 10 unità; 1 panoramica di dominio = 1 unità.'],
    lastReviewed: '2026-06-01',
  },
  gsc: {
    intro:
      "Recupera le metriche di Search Console per URL (clic, impressioni, CTR, posizione media) tramite l'API Google Search Console. L'API URL Inspection ti dà anche il verdetto di copertura + l'ora dell'ultima scansione. Modello \"porta il tuo client\" — crei il tuo client OAuth su Google Cloud e lo incolli; FreeCrawl non usa un'app intermediaria condivisa.",
    prereqs: [
      'Account Google (deve possedere / co-possedere la proprietà GSC che vuoi collegare).',
      'Almeno una proprietà Google Search Console aggiunta + verificata.',
    ],
    steps: [
      {
        title: 'Apri Google Cloud Console e crea un nuovo progetto',
        detail:
          'Menu a discesa del progetto in alto a sinistra → "New Project" → nome: "FreeCrawl SEO Integrations" (quello che vuoi) → Create. Questo progetto serve solo per le credenziali OAuth — fatturazione non richiesta.',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Apri Google Auth Platform → Branding',
        detail:
          'Menu a sinistra "APIs & Services" → "OAuth consent screen" (nuova interfaccia: "Google Auth Platform → Branding"). User Type: "External" → Create.',
        link: {
          label: 'OAuth consent screen',
          url: 'https://console.cloud.google.com/auth/branding',
        },
      },
      {
        title: 'Compila la schermata di consenso OAuth',
        detail:
          'Solo i campi obbligatori:\n• App name: "FreeCrawl Local"\n• User support email: la tua email\n• Developer contact information: la tua email\nLascia il resto vuoto. Save and Continue → Save and Continue → Save and Continue → Back to Dashboard.',
      },
      {
        title: 'FONDAMENTALE: aggiungi te stesso come Test User',
        detail:
          'Menu a sinistra → "Audience" (vecchia interfaccia "Test users") → "Add users" → incolla la Gmail che collegherai → Save.\n\nATTENZIONE: NON SALTARE QUESTO PASSAGGIO. Saltarlo produce un 403 access_denied durante OAuth — le app in stato "Testing" permettono di collegarsi solo agli account nella lista dei test user.',
        link: {
          label: 'Pagina Audience',
          url: 'https://console.cloud.google.com/auth/audience',
        },
      },
      {
        title: 'Abilita la Google Search Console API',
        detail:
          'Questo link porta direttamente alla pagina di abilitazione → fai clic sul pulsante blu "Enable" → attendi 30 s.',
        link: {
          label: 'Search Console API → Enable',
          url: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com',
        },
      },
      {
        title: 'Crea un OAuth Client ID',
        detail:
          'Menu a sinistra → "Credentials" (nuova interfaccia "Google Auth Platform → Clients") → "+ Create credentials" → "OAuth client ID".',
        link: {
          label: 'Pagina Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'Scegli "Desktop app" come tipo di client OAuth (NON Web app!)',
        detail:
          'Menu a discesa Application type → "Desktop app". Name: "FreeCrawl SEO Tool". Create → la finestra mostra Client ID + Client Secret. Copiali subito entrambi (il Secret non viene più mostrato).\n\nPERCHÉ DESKTOP: FreeCrawl usa una porta locale casuale (es. 127.0.0.1:63092) per ogni connessione. "Web application" richiede una lista fissa di redirect URI — quella porta casuale non può corrispondere → fallimento. "Desktop app" accetta automaticamente i redirect loopback, indipendentemente dalla porta.',
      },
      {
        title: 'Incolla Client ID + Client Secret in questo pannello + Salva',
        detail:
          'Due campi: "OAuth Client ID" (...apps.googleusercontent.com) e "OAuth Client Secret" (GOCSPX-...). Salva.',
      },
      {
        title: 'Fai clic su "Connetti" — si apre il browser',
        detail:
          'Dopo Salva la scheda mostra un pulsante "Connetti". Fai clic → la schermata di consenso di Google si apre nel browser predefinito.',
      },
      {
        title: "Accedi con l'account Google che hai aggiunto come test user",
        detail:
          'Nel selettore account scegli l\'email aggiunta ai test user. "Continue" → avviso "Google hasn\'t verified this app" (atteso in modalità test). "Advanced" → "Go to FreeCrawl Local (unsafe)" → accetta i permessi → Allow.',
      },
      {
        title: 'Torna a FreeCrawl — dovresti vedere "Configurato"',
        detail:
          'La scheda Search Console nelle Impostazioni ora mostra un badge verde "Configurato". Puoi passare alla scheda superiore "Search Console" per elencare le proprietà + recuperare i dati.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 access_denied"',
        solution:
          "Non hai aggiunto un test user, oppure stai accedendo con l'account Google sbagliato. Torna alla pagina Audience e verifica che l'account che stai usando sia nella lista dei test user. Se hai più account Google, controlla quale sta usando il selettore account.",
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'O la Search Console API non era abilitata OPPURE nella schermata di consenso OAuth la casella del permesso "View Search Console data for your verified sites" era deselezionata. (1) Abilita la Search Console API (passaggio 5), (2) myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → fai di nuovo clic su Connetti e spunta tutti i permessi nella schermata di consenso.',
      },
      {
        problem: '"redirect_uri_mismatch"',
        solution:
          'Tipo di client OAuth sbagliato. Elimina il client dalla pagina Credentials e ricrealo come "Desktop app" (passaggio 7). "Web application" non funzionerà mai per questo flusso.',
      },
      {
        problem: '"This app isn\'t verified" warning',
        solution:
          'Comportamento atteso (app in modalità test + ambito sensibile). Fai clic su "Advanced" → "Go to <app> (unsafe)" per procedere. L\'app è in modalità test e fa entrare solo i test user — è sicura.',
      },
      {
        problem: 'Connection broke after 7 days',
        solution:
          'I refresh token OAuth scadono ogni 7 giorni in modalità test. Impostazioni → Integrazioni → Search Console → "Disconnetti" → "Connetti" per riautenticarti. Per eliminare la scadenza devi far passare l\'app per il processo di verifica di Google (1-4 settimane).',
      },
    ],
    notes: [
      'Le proprietà che possiedi (sc-domain:example.com o https://example.com/) includono ogni sito verificato dal tuo account.',
      'I dati GSC hanno ~2 giorni di ritardo — i clic di oggi non compaiono subito.',
      'Quota gratuita: 1200 query/min, 25.000 query/giorno — non la raggiungerai mai in un uso normale.',
    ],
    lastReviewed: '2026-06-01',
  },
  ga4: {
    intro:
      'Recupera le metriche GA4 per URL (sessioni, utenti, frequenza di rimbalzo, tasso di coinvolgimento, conversioni). "Porta il tuo client" — usa il tuo client OAuth GCP.',
    prereqs: [
      'Account Google con almeno accesso Visualizzatore alla proprietà GA4 da collegare.',
      'Puoi RIUTILIZZARE lo stesso client OAuth configurato per GSC — basta abilitare le API giuste.',
    ],
    steps: [
      {
        title: 'Se hai già configurato GSC: RIUTILIZZA quel client OAuth',
        detail:
          'Se Search Console è già configurato, puoi usare lo stesso progetto Google Cloud e gli stessi OAuth Client ID + Secret. Non serve ricrearli — abilita solo le API qui sotto e incolla le credenziali.',
      },
      {
        title: 'Abilita ENTRAMBE le API GA4',
        detail:
          'GA4 ha bisogno di due API distinte:\n\n1. Google Analytics Admin API (per elencare le proprietà)\n2. Google Analytics Data API (per i report veri e propri)\n\nSe non le abiliti entrambe vedrai errori "API not enabled".',
        link: {
          label: 'Admin API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com',
        },
      },
      {
        title: 'Abilita anche la Data API',
        link: {
          label: 'Data API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
        },
      },
      {
        title: 'Incolla gli stessi Client ID + Secret usati per GSC',
        detail:
          'Se GSC è già collegato, potresti non dover nemmeno incollare — le schede possono condividere le credenziali. Se configuri GA4 da zero, copia ID/Secret dal tuo client GSC in questo pannello.',
      },
      {
        title: '"Connetti" → accedi con Google + approva l\'ambito GA4',
        detail:
          'Accedi con l\'account Google aggiunto come test user. Nella schermata di consenso verifica che il permesso "Google Analytics: View Google Analytics property data" sia spuntato.',
      },
      {
        title: 'Elenca le proprietà + recupera nella scheda GA4',
        detail:
          'Passa alla scheda superiore "GA4" → "List Properties" mostra tutte le proprietà GA4 visibili al tuo account → scegline una → scegli una finestra (7/28/90 giorni) → "Fetch". GA4 è quasi in tempo reale, i risultati compaiono subito.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Google Analytics Admin API has not been used in project X"',
        solution:
          'Admin API non abilitata. Apri il link del passaggio 2 → Enable. Attendi 30 s, riprova. Otterrai lo stesso errore per la Data API — apri il link del passaggio 3 e abilita anche quella.',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'L\'ambito OAuth non copre GA4. Vai su myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → fai di nuovo clic su Connetti → spunta la casella del permesso Google Analytics.',
      },
      {
        problem: 'Property list comes back empty',
        solution:
          "L'account Google collegato non ha alcun ruolo su proprietà GA4. Dashboard GA4 → Admin → Property Access Management → verifica che la tua email abbia almeno Visualizzatore.",
      },
    ],
    notes: [
      'I dati GA4 sono quasi in tempo reale — quelli di oggi compaiono entro 4-24 ore.',
      'Quota gratuita: 200K richieste/giorno, 50 richieste/min per proprietà.',
    ],
    lastReviewed: '2026-06-01',
  },
  sheets: {
    intro:
      'Esporta i risultati della scansione direttamente in un foglio Google Sheets. Meglio di "scarica CSV → apri in Excel" quando collabori con i colleghi su un documento condiviso in tempo reale.',
    prereqs: ['Account Google.', 'Puoi RIUTILIZZARE lo stesso client OAuth configurato per GSC.'],
    steps: [
      {
        title: 'Se hai configurato GSC/GA4: RIUTILIZZA quel client OAuth',
        detail: 'Incolla gli stessi OAuth Client ID + Secret (o potrebbero essere già salvati).',
      },
      {
        title: 'Abilita la Google Sheets API',
        link: {
          label: 'Sheets API → Enable',
          url: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
        },
      },
      {
        title: 'Abilita anche la Google Drive API',
        detail:
          'La Sheets API richiede anche un ambito Drive per creare/leggere i fogli di calcolo.',
        link: {
          label: 'Drive API → Enable',
          url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
        },
      },
      {
        title: 'Incolla Client ID + Secret + Salva',
      },
      {
        title: '"Connetti" → approva Sheets + Drive nella schermata di consenso',
        detail:
          'Il flusso OAuth mostra due permessi:\n• See, edit, create, and delete all your Google Sheets spreadsheets\n• See, edit, create, and delete only the specific Google Drive files used with this app\nSpuntali entrambi.',
      },
      {
        title: 'Prova dal menu Esporta',
        detail:
          'File → Esporta → "Esporta in Google Sheets". Viene creato automaticamente un nuovo foglio, l\'URL copiato negli appunti.',
      },
    ],
    troubleshooting: [
      {
        problem: '"insufficient authentication scopes"',
        solution:
          'Non hai spuntato la casella del permesso Drive durante la connessione. Disconnetti + riconnetti, spunta entrambi i permessi.',
      },
    ],
    notes: [
      'Limite rigido di Sheets: 10M di celle per foglio di calcolo — le scansioni grandi (>500K URL) vengono suddivise.',
      'L\'ambito Drive è "drive.file" — sono accessibili solo i file creati da FreeCrawl, non i tuoi file esistenti.',
    ],
    lastReviewed: '2026-06-01',
  },
  bigquery: {
    intro:
      'Invia i dati di scansione direttamente in un dataset BigQuery. Utile per accumulare snapshot datati nel tuo data warehouse e visualizzare le tendenze di scansione con uno strumento BI (Looker Studio, Tableau, Metabase).',
    prereqs: [
      'Progetto Google Cloud con la BigQuery API abilitata.',
      'Dataset BigQuery già creato.',
      'JSON del Service Account (NON OAuth — autenticazione server-to-server).',
      'Progetto GCP con fatturazione abilitata (livello gratuito BigQuery: 10GB di archiviazione/mese + 1TB di query/mese; oltre si paga).',
    ],
    steps: [
      {
        title: 'Crea un dataset BigQuery',
        detail:
          'Console BigQuery → scegli il tuo progetto → "Create dataset" → ID: "freecrawl_seo" (o qualsiasi nome) → Location: "EU" o "US" (importante — non si può cambiare dopo) → Create dataset.',
        link: {
          label: 'Console BigQuery',
          url: 'https://console.cloud.google.com/bigquery',
        },
      },
      {
        title: 'Crea un Service Account',
        detail:
          'IAM & Admin → Service Accounts → "+ Create service account" → nome: "freecrawl-bigquery" → Create and continue.',
        link: {
          label: 'Service Accounts',
          url: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
        },
      },
      {
        title: 'Aggiungi i ruoli',
        detail:
          'Al passaggio 2 "Grant this service account access to project" → aggiungi due ruoli:\n• BigQuery Data Editor\n• BigQuery Job User\nPoi "Continue" → "Done".',
      },
      {
        title: 'Scarica la chiave JSON',
        detail:
          'Nell\'elenco dei service account fai clic su quello appena creato → scheda "Keys" → "Add key" → "Create new key" → Type: JSON → Create.\n\nIl JSON viene scaricato automaticamente. Aprilo in un editor di testo e copia tutto il contenuto.\n\nATTENZIONE: questo JSON contiene tutte le credenziali — trattalo come una password. Non inserirlo mai nel controllo di versione.',
      },
      {
        title: 'Incollalo nel campo "Service Account JSON" di questo pannello',
        detail:
          "Incolla il JSON completo (dalla graffa di apertura `{` a quella di chiusura `}`). FreeCrawl memorizza il JSON cifrato nell'archivio credenziali del sistema.",
      },
      {
        title: 'Compila "GCP Project ID"',
        detail:
          'L\'ID del tuo progetto GCP (compare nel menu a discesa in alto a sinistra della Cloud Console, es. "my-gcp-project-12345"). Anche il JSON ha un campo "project_id" — puoi copiarlo da lì.',
      },
      {
        title: 'Inserisci il nome del dataset + Salva',
        detail: 'Il nome del dataset creato al passaggio 1 (es. "freecrawl_seo").',
      },
      {
        title: 'Prova dal menu Esporta',
        detail:
          'File → Esporta → "Esporta in BigQuery" → scegli nome/formato della tabella → esegui. Verifica che la tabella sia comparsa nella Console BigQuery.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 PermissionDenied: caller does not have permission"',
        solution:
          'Mancano i ruoli IAM del service account. IAM & Admin → IAM → trova l\'email del tuo service account → verifica che siano assegnati sia "BigQuery Data Editor" sia "BigQuery Job User".',
      },
      {
        problem: '"Dataset X not found"',
        solution:
          'Nome del dataset sbagliato OPPURE posizione non coincidente (multiregione "EU" vs regione "europe-west1"). Copia il nome esatto del dataset dalla Console BigQuery.',
      },
      {
        problem: '"Invalid JSON"',
        solution:
          "Hai incollato solo parte del JSON o c'è un carattere vagante ai bordi. Apri il file JSON del service account con un editor vero (VS Code consigliato, NON il Blocco note), Ctrl+A per selezionare tutto, copia, svuota il campo di FreeCrawl, incolla.",
      },
    ],
    notes: [
      "Costo: il livello gratuito BigQuery (10GB di archiviazione + 1TB di query/mese) copre l'uso normale. Una scansione da 1M di URL occupa ~500MB; il costo delle query dipende dal tuo SQL.",
      'Evoluzione dello schema: FreeCrawl crea/aggiorna automaticamente la tabella di esportazione. Se lo schema CrawlUrlRow acquisisce nuove colonne, la tabella di esportazione le recepisce (flessibilità DDL di BigQuery).',
    ],
    lastReviewed: '2026-06-01',
  },
};
