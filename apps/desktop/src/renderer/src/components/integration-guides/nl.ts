/**
 * Dutch integration setup guides. Generated from the guide source —
 * see `./index.ts` for how a locale is picked. Keep the step count,
 * links and `lastReviewed` in lockstep with `en.ts`; the parity test
 * in `tests/` compares them.
 */
import type { Guide } from './types.js';

export const GUIDES_NL: Record<string, Guide> = {
  openai: {
    intro:
      'Voer per URL een eigen prompt uit via de API van OpenAI — contentanalyse, titelideeën, samenvattingen. Het gebruik wordt gefactureerd op je eigen OpenAI-account; FreeCrawl is gratis middleware, de API-aanroepen betaal je zelf.',
    prereqs: [
      'OpenAI-account (gratis aanmelden op https://platform.openai.com).',
      'Geldige betaalmethode — OpenAI vereist een minimumsaldo van $5 voordat sleutels werken.',
    ],
    steps: [
      {
        title: 'Meld je aan op platform.openai.com',
        detail: 'Gebruik je OpenAI-account. Heb je er nog geen, kies dan "Sign up".',
        link: {
          label: 'platform.openai.com',
          url: 'https://platform.openai.com',
        },
      },
      {
        title: 'Klik op "API keys" in de linkerzijbalk',
        detail:
          'Menu-item met het sleutelpictogram aan de linkerkant. Je kunt ook direct naar de URL gaan.',
        link: {
          label: 'Pagina API keys',
          url: 'https://platform.openai.com/api-keys',
        },
      },
      {
        title: 'Klik op "+ Create new secret key" (rechtsboven)',
        detail:
          'In het dialoogvenster:\n• Name: "FreeCrawl SEO Tool" (elk geheugensteuntje volstaat)\n• Project: Default project of een eigen keuze\n• Permissions: All (het eenvoudigst; beperkte scopes werken ook)\nklik daarna op "Create secret key".',
      },
      {
        title: 'KOPIEER de sleutel — hij wordt nooit meer getoond',
        detail:
          'De sleutel begint met `sk-...`. Kopieer je hem nu niet, dan ben je hem voorgoed kwijt (je moet dan een nieuwe maken). Bewaar hem in een wachtwoordmanager — laat hem niet in een browsertabblad staan.',
      },
      {
        title: 'Plak hem in het veld "API Key" van dit paneel + klik op Opslaan',
        detail:
          'FreeCrawl slaat de sleutel versleuteld op in de credentialopslag van het besturingssysteem (Windows DPAPI, macOS-sleutelhanger, Linux Secret Service). Nooit als platte tekst.',
      },
      {
        title: 'Test in het tabblad AI',
        detail:
          'Sluit Instellingen → ga naar het tabblad "AI" bovenaan → kies een paar URL\'s uit een crawl → klik op "Run AI". De eerste aanroep duurt ~2-3 s.',
      },
    ],
    troubleshooting: [
      {
        problem: '"You exceeded your current quota"',
        solution:
          'Je OpenAI-account heeft geen saldo. Ga naar platform.openai.com → Billing → "Add payment method" → voeg een kaart toe en laad $5 of meer op. Nieuwe accounts krijgen geen automatisch tegoed; je moet zelf opwaarderen.',
      },
      {
        problem: '"Incorrect API key provided" / 401',
        solution:
          'De sleutel heeft waarschijnlijk een losse spatie aan het begin of eind. Genereer een nieuwe en kopieer zorgvuldig. Trek de oude in.',
      },
      {
        problem: '"Rate limit exceeded"',
        solution:
          'Te veel parallelle verzoeken. Verlaag de gelijktijdigheid in Instellingen → AI (standaard: 3). Tier 1-accounts draaien op 500-3500 RPM, afhankelijk van het model.',
      },
    ],
    notes: [
      "Prijzen (2026-06): gpt-4o-mini ~$0,15/1M inputtokens, gpt-4o ~$2,50/1M input. 1000 URL's met een typische prompt + respons: ~$0,50-2.",
      "Stel een harde maandlimiet in op de pagina Usage limits — je wilt niet dat een op hol geslagen crawl van 1M URL's een rekening van $1000 oplevert.",
    ],
    lastReviewed: '2026-06-01',
  },
  anthropic: {
    intro:
      'Voer prompts uit op Claude via de API van Anthropic. De topmodellen van Claude (Sonnet 4.6, Opus 4.8) leveren minder "AI-achtige" SEO-output dan concurrenten. Gefactureerd op je eigen Anthropic-account.',
    prereqs: [
      'Anthropic-account (https://console.anthropic.com).',
      'Betaalmethode ingesteld (nieuwe gebruikers krijgen $5 promotietegoed).',
    ],
    steps: [
      {
        title: 'Meld je aan op console.anthropic.com',
        link: {
          label: 'console.anthropic.com',
          url: 'https://console.anthropic.com',
        },
      },
      {
        title: 'Open de pagina "API Keys" via het dropdownmenu rechtsboven',
        detail: 'In het menu Settings, onder "API Keys".',
        link: {
          label: 'Pagina API Keys',
          url: 'https://console.anthropic.com/settings/keys',
        },
      },
      {
        title: 'Klik op "+ Create Key"',
        detail:
          'In het dialoogvenster:\n• Name: "FreeCrawl SEO Tool"\n• Workspace: Default workspace\n• Environment: Production\nklik daarna op "Create Key".',
      },
      {
        title: 'KOPIEER de sleutel — hij wordt nooit meer getoond',
        detail: 'De sleutel begint met `sk-ant-...`. Kwijt? Dan maak je een nieuwe.',
      },
      {
        title: 'Plak hem in het veld "API Key" + Opslaan',
      },
      {
        title: 'Optioneel: kies een model',
        detail:
          'In Instellingen → AI accepteert het veld "Model" een model-id (standaard: claude-sonnet-4-6). Snelheid voorop: claude-haiku-4-5 (~10x goedkoper, 3x sneller). Kwaliteit voorop: claude-opus-4-8.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Your credit balance is too low"',
        solution: 'console.anthropic.com → Settings → Billing → "Add credits" — minimaal $5.',
      },
      {
        problem: '"Number of request tokens has exceeded your rate limit"',
        solution:
          'Tier 1-accounts halen ~50 RPM. Verlaag de gelijktijdigheid naar 2-3 in Instellingen → AI. Voor hogere tiers moet je $25+ uitgeven (Tier 2: 1000 RPM).',
      },
      {
        problem: '"Invalid API key"',
        solution:
          'Controleer of het voorvoegsel "sk-ant-" intact is en er geen losse spaties zijn. Kijk op de pagina API Keys — staat de sleutel daar als actief, dan is de sleutel zelf in orde.',
      },
    ],
    notes: [
      'Prijzen (2026-06): Haiku 4.5 ~$0,25/$1,25 (in/uit per 1M tokens), Sonnet 4.6 ~$3/$15, Opus 4.8 ~$15/$75.',
      'Anthropic ondersteunt prompt caching — herhaalde lange systeemprompts binnen 5 min krijgen 90% korting (het AI-paneel van FreeCrawl gebruikt nog geen caching — dat komt in een latere release).',
    ],
    lastReviewed: '2026-06-01',
  },
  ollama: {
    intro:
      "Ollama is een opensource-runtime voor lokaal gehoste LLM's. GEEN API-sleutel, voor altijd gratis, zelfs zonder internet. Kosten nul; het enige nadeel is VRAM/RAM voor grotere modellen.",
    prereqs: [
      'macOS 12+, Windows 10+ of Linux (Ubuntu 22.04+ aanbevolen).',
      'Minimaal 8 GB RAM (kleinere modellen). Llama 3.2 3B heeft ~2 GB VRAM/RAM nodig.',
      'GPU aanbevolen maar niet vereist — CPU werkt ook (langzamer).',
    ],
    steps: [
      {
        title: 'Download + installeer Ollama',
        detail:
          'Kies het installatieprogramma voor je besturingssysteem:\n• Windows: OllamaSetup.exe\n• macOS: Ollama.dmg\n• Linux: curl -fsSL https://ollama.com/install.sh | sh\n\nNa de installatie draait Ollama op de achtergrond (pictogram in het systeemvak).',
        link: {
          label: 'ollama.com/download',
          url: 'https://ollama.com/download',
        },
      },
      {
        title: 'Haal een model op',
        detail:
          'Open een terminal en voer uit:\n\n  ollama pull llama3.2\n\nllama3.2 (3B parameters) is ~2GB, snel en zuinig. Grotere opties:\n  ollama pull llama3.3:70b   (~40GB, alleen met een zware GPU)\n  ollama pull qwen2.5:7b     (~4GB, gebalanceerd)\n  ollama pull mistral:7b     (~4GB, alternatief)',
      },
      {
        title: 'Test het model snel',
        detail:
          'In de terminal:\n  ollama run llama3.2\n\nEr opent een interactieve chat. Typ "hallo" — krijg je een antwoord, dan zit je goed. Ctrl+D om af te sluiten.',
      },
      {
        title: 'Voer het Ollama-endpoint in dit paneel in',
        detail:
          'Standaard: http://localhost:11434 (al vooraf ingevuld). Pas het aan als Ollama op een andere poort draait.',
      },
      {
        title: 'Voer de naam in van het model dat je hebt opgehaald',
        detail:
          'Bijv. "llama3.2" of "qwen2.5:7b". Laat leeg om FreeCrawl het eerste beschikbare model te laten kiezen.',
      },
      {
        title: 'Opslaan + testen',
        detail:
          'Voer een kleine batch uit in het tabblad AI. Alleen CPU: ~5-15 s/URL. GPU: ~1-3 s.',
      },
    ],
    troubleshooting: [
      {
        problem: 'AI tab says "Connection refused"',
        solution:
          'Ollama draait niet. Voer in de terminal "ollama serve" uit of start de Ollama-app vanuit het systeemvak / Startmenu.',
      },
      {
        problem: '"model \'X\' not found"',
        solution:
          'Het model is niet opgehaald. Voer "ollama pull <model-name>" uit. Gebruik "ollama list" om te zien wat al op schijf staat.',
      },
      {
        problem: 'Replies are very slow (>30 s/URL)',
        solution:
          'Het model past niet in het VRAM en wijkt uit naar de CPU. Probeer een kleiner model (llama3.2:1b of phi3:mini). VRAM-behoefte: 3B ~2GB, 7B ~4GB, 13B ~8GB.',
      },
    ],
    notes: [
      'Volledig offline — crawl + AI-analyse blijven werken, zelfs zonder internet.',
      'Kwaliteit van lokale SEO-analyse: 3B-modellen wat zwak, 7-13B redelijk, 70B op GPT-4-niveau (maar zware hardware).',
      'Houd in Instellingen → AI de gelijktijdigheid op 1-2 — lokale modellen verwerken parallelle verzoeken na elkaar.',
    ],
    lastReviewed: '2026-06-01',
  },
  pagespeed: {
    intro:
      'Google PageSpeed Insights controleert elke URL met Lighthouse en geeft scores voor Performance/SEO/Accessibility/Best-Practices + Core Web Vitals (LCP/CLS/INP). Met een gratis API-sleutel krijg je 25.000 audits per dag.',
    prereqs: [
      'Google-account.',
      'Google Cloud Console-project (je kunt er een aanmaken in de stappen hieronder).',
    ],
    steps: [
      {
        title: 'Open de Google Cloud Console',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Kies of maak een project',
        detail:
          'Projectdropdown linksboven → "New Project" → naam: "FreeCrawl SEO" → Create. GEEN factureringsaccount nodig — de gratis PSI-laag heeft alleen credentials nodig voor authenticatie.',
      },
      {
        title: 'Schakel de PageSpeed Insights API in',
        detail: 'Deze deeplink gaat direct naar de inschakelpagina van de API:',
        link: {
          label: 'PageSpeed Insights API → Enable',
          url: 'https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com',
        },
      },
      {
        title: 'Klik op de blauwe knop "Enable" → wacht 30 s',
      },
      {
        title: 'Ga naar Credentials',
        link: {
          label: 'Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'Klik op "+ Create Credentials" → "API key"',
        detail:
          'Er wordt een API-sleutel gegenereerd (begint met `AIzaSy...`). Kopieer hem meteen.',
      },
      {
        title: 'Optioneel: beperk de API-sleutel (aanbevolen)',
        detail:
          'Klik op "Edit API key" → "Restrict key":\n• API restrictions: "Restrict key" → "PageSpeed Insights API"\n• Application restrictions: "None" (FreeCrawl is een desktop-app, dus filteren op referrer/IP werkt niet)\nOnbeperkte sleutels werken ook, maar we raden aan om te beperken.',
      },
      {
        title: 'Plak de sleutel in het veld "API Key" van dit paneel + Opslaan',
      },
      {
        title: 'Test in het tabblad PageSpeed',
        detail:
          'Tabblad "PageSpeed" bovenaan → kies een paar URL\'s → "Run audit". Eerste audit ~10-15 s.',
      },
    ],
    troubleshooting: [
      {
        problem: '"This API method requires billing to be enabled"',
        solution:
          'Je hebt de verkeerde API ingeschakeld (bijv. een oudere "Cloud PageSpeed Insights API"). De juiste is "PageSpeed Insights API" (pagespeedonline.googleapis.com). Open de link uit stap 3 opnieuw.',
      },
      {
        problem: '"API key not valid"',
        solution:
          'De sleutelbeperkingen kloppen niet. Cloud Console → Credentials → klik op de sleutel → controleer of "PageSpeed Insights API" bij de toegestane API\'s staat. Of verwijder de beperkingen tijdelijk om te controleren.',
      },
      {
        problem: '"Quota exceeded" — before hitting 25,000',
        solution:
          'Er is ook een limiet per minuut: 240 queries/min. Houd in Instellingen → PageSpeed de gelijktijdigheid op 2-3. De daglimiet van 25K is torenhoog — bij normaal gebruik kom je die niet tegen.',
      },
    ],
    notes: [
      "Kosten: GRATIS — een van de weinige Google-API's waarvoor geen facturering nodig is. De sleutelloze/anonieme modus is nu 0 queries/dag (gesloten begin 2026), dus een sleutel is verplicht.",
      "Snelheid: elke URL ~5-10 s (Google draait echt een Lighthouse-instantie). 1000 URL's ~2 uur.",
      'Mobiel + desktop tellen als aparte API-aanroepen — "beide" kiezen verdubbelt het quotaverbruik.',
    ],
    lastReviewed: '2026-06-01',
  },
  ahrefs: {
    intro:
      'Haal per URL het aantal backlinks, Domain Rating, verwijzende domeinen en het aantal organische zoekwoorden op via de API van Ahrefs. Dit is de duurste integratie — Ahrefs zet API-toegang achter abonnementen van $500+/maand.',
    prereqs: [
      'Ahrefs Standard-abonnement ($249/mnd) of hoger.',
      'Add-on "API"-tier (extra $500/mnd bovenop het basisabonnement, of een andere tier).',
    ],
    steps: [
      {
        title: 'Meld je aan bij Ahrefs → API-pagina',
        link: {
          label: 'ahrefs.com/api',
          url: 'https://ahrefs.com/api',
        },
      },
      {
        title: 'Kies een abonnement (als je nog geen API-toegang hebt)',
        detail:
          'API v3-toegang zit bij de Enterprise-tier en speciale API-abonnementen. Neem contact op met sales voor een offerte.',
      },
      {
        title: 'Genereer een API-token in je account',
        detail:
          'Ahrefs-dashboard → Account settings → API → Generate token. Tokenformaat: `sk-...` of vergelijkbaar.',
      },
      {
        title: 'Plak het in het veld "API Key" + Opslaan',
      },
      {
        title: 'Test in het tabblad SEO Authority',
        detail:
          'Tabblad "SEO Authority" bovenaan → provider: "Ahrefs" → kies een paar URL\'s → "Run".',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient credits"',
        solution:
          'Je API-rij-eenheden zijn op. Ahrefs-dashboard → API → tabblad "Usage". Upgrade je abonnement of wacht op de volgende factureringsperiode.',
      },
      {
        problem: '"Unauthorized"',
        solution:
          'Je abonnement bevat geen API-toegang. "Ahrefs Standard" alleen geeft je geen API-rechten — je hebt er een expliciete API-tier bovenop nodig.',
      },
    ],
    notes: [
      'Kosten: grofweg 1-5 API-rijen per URL-audit. Standaard API-abonnement ~25K rijen/maand.',
      'Goedkopere alternatieven: Moz ($99/mnd, Domain Authority) of Majestic.',
    ],
    lastReviewed: '2026-06-01',
  },
  majestic: {
    intro:
      'Haal Trust Flow, Citation Flow en aantallen backlinks op via de API van Majestic. De voordeligste aanbieder die zich op backlinks richt.',
    prereqs: [
      'Majestic Lite-abonnement ($49,99/mnd) of hoger.',
      'API-toegang — inbegrepen bij Lite.',
    ],
    steps: [
      {
        title: 'Open het Majestic-ontwikkelaarsdashboard',
        link: {
          label: 'majestic.com/account/api',
          url: 'https://majestic.com/account/api',
        },
      },
      {
        title: 'Genereer een API-sleutel',
        detail: 'Dashboard → tabblad "Open API" → "Generate new key" → kopiëren.',
      },
      {
        title: 'Plak hem in dit paneel + Opslaan',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient resources" / "No analysis units"',
        solution:
          'Het maandelijkse quotum aan analyse-eenheden is op. Lite-abonnement: 1000 eenheden/mnd; Pro: 20K+. Controleer Majestic-dashboard → API → usage.',
      },
    ],
    notes: [
      "Kosten: 1 backlink-lookup per URL = 5 eenheden. Lite-abonnement (1000 eenheden) ~200 URL's/mnd.",
    ],
    lastReviewed: '2026-06-01',
  },
  moz: {
    intro:
      'Haal Domain Authority (DA), Page Authority (PA) en Spam Score op via de Moz API. De populairste keuze voor kleinere budgetten.',
    prereqs: [
      'Moz Pro Standard-abonnement ($99/mnd) of hoger met de add-on "Moz API" ingeschakeld.',
    ],
    steps: [
      {
        title: 'Open de Moz API-pagina',
        link: {
          label: 'moz.com/api',
          url: 'https://moz.com/api',
        },
      },
      {
        title: 'Account → API → "Generate Credentials"',
        detail:
          'Er worden twee waarden aangemaakt: "Access ID" en "Secret Key". Kopieer ze allebei.',
      },
      {
        title: 'Plak ze in de velden "Access ID" + "Secret Key" van dit paneel + Opslaan',
        detail: 'Twee aparte velden — vul ze op volgorde in.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Authentication failed"',
        solution:
          'Access ID of Secret Key is verkeerd gekopieerd. Kopieer opnieuw vanuit het Moz-dashboard — Access ID is kort (~13 tekens), Secret Key is lang (~40 tekens).',
      },
    ],
    notes: [
      'Kosten: Standard-abonnement (1500 rijen/mnd), Medium (10K rijen/mnd), Large (100K rijen/mnd).',
    ],
    lastReviewed: '2026-06-01',
  },
  semrush: {
    intro:
      'Haal organische zoekwoorden, verkeersschattingen en SERP-features op via de Semrush API. De meest uitgebreide zoekwoord- en verkeersdata.',
    prereqs: [
      'Semrush Pro-abonnement ($129/mnd) of hoger.',
      '"API units" gekoppeld aan het account (Guru-tier en hoger bevatten API-toegang).',
    ],
    steps: [
      {
        title: 'Meld je aan bij Semrush → Subscription info → API',
        link: {
          label: 'Semrush API-toegang',
          url: 'https://www.semrush.com/accounts/subscription-info/api-units/',
        },
      },
      {
        title: 'Kopieer de API-sleutel',
      },
      {
        title: 'Plak hem in dit paneel + Opslaan',
      },
    ],
    troubleshooting: [
      {
        problem: '"API units exhausted"',
        solution:
          'Het maandelijkse quotum aan eenheden is op. Guru-abonnement: 7K eenheden/mnd, Business: 25K+. Controleer Semrush-dashboard → API → usage.',
      },
    ],
    notes: ['Kosten: 1 backlinkquery per URL = 10 eenheden; 1 domeinoverzicht = 1 eenheid.'],
    lastReviewed: '2026-06-01',
  },
  gsc: {
    intro:
      'Haal per URL Search Console-statistieken op (klikken, vertoningen, CTR, gemiddelde positie) via de Google Search Console API. De URL Inspection API geeft je ook het indexeringsoordeel + het tijdstip van de laatste crawl. "Bring your own client"-model — je maakt je eigen Google Cloud OAuth-client aan en plakt die hier; FreeCrawl gebruikt geen gedeelde tussenpersoon-app.',
    prereqs: [
      'Google-account (moet eigenaar / mede-eigenaar zijn van de GSC-property die je wilt koppelen).',
      'Minimaal één Google Search Console-property toegevoegd + geverifieerd.',
    ],
    steps: [
      {
        title: 'Open de Google Cloud Console en maak een nieuw project',
        detail:
          'Projectdropdown linksboven → "New Project" → naam: "FreeCrawl SEO Integrations" (vrij te kiezen) → Create. Dit project is alleen voor OAuth-credentials — facturering is niet nodig.',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Ga naar Google Auth Platform → Branding',
        detail:
          'Linkermenu "APIs & Services" → "OAuth consent screen" (nieuwe UI: "Google Auth Platform → Branding"). User Type: "External" → Create.',
        link: {
          label: 'OAuth consent screen',
          url: 'https://console.cloud.google.com/auth/branding',
        },
      },
      {
        title: 'Vul het OAuth-toestemmingsscherm in',
        detail:
          'Alleen de verplichte velden:\n• App name: "FreeCrawl Local"\n• User support email: je e-mailadres\n• Developer contact information: je e-mailadres\nLaat de rest leeg. Save and Continue → Save and Continue → Save and Continue → Back to Dashboard.',
      },
      {
        title: 'BELANGRIJK: voeg jezelf toe als testgebruiker',
        detail:
          'Linkermenu → "Audience" (oude UI "Test users") → "Add users" → plak het Gmail-adres dat je gaat koppelen → Save.\n\nWAARSCHUWING: SLA DEZE STAP NIET OVER. Zonder deze stap krijg je een 403 access_denied tijdens OAuth — apps met de status "Testing" staan alleen accounts op de lijst met testgebruikers toe.',
        link: {
          label: 'Pagina Audience',
          url: 'https://console.cloud.google.com/auth/audience',
        },
      },
      {
        title: 'Schakel de Google Search Console API in',
        detail:
          'Deze link gaat direct naar de inschakelpagina → klik op de blauwe knop "Enable" → wacht 30 s.',
        link: {
          label: 'Search Console API → Enable',
          url: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com',
        },
      },
      {
        title: 'Maak een OAuth-client-ID aan',
        detail:
          'Linkermenu → "Credentials" (nieuwe UI "Google Auth Platform → Clients") → "+ Create credentials" → "OAuth client ID".',
        link: {
          label: 'Pagina Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'Kies "Desktop app" als OAuth-clienttype (NIET Web app!)',
        detail:
          'Dropdown Application type → "Desktop app". Name: "FreeCrawl SEO Tool". Create → het dialoogvenster toont Client ID + Client Secret. Kopieer ze allebei meteen (het Secret wordt niet opnieuw getoond).\n\nWAAROM DESKTOP: FreeCrawl gebruikt per verbinding een willekeurige lokale poort (bijv. 127.0.0.1:63092). "Web application" vereist een vaste lijst redirect-URI\'s — die willekeurige poort past daar niet in → mislukt. "Desktop app" accepteert loopback-redirects automatisch, ongeacht de poort.',
      },
      {
        title: 'Plak Client ID + Client Secret in dit paneel + Opslaan',
        detail:
          'Twee velden: "OAuth Client ID" (...apps.googleusercontent.com) en "OAuth Client Secret" (GOCSPX-...). Opslaan.',
      },
      {
        title: 'Klik op "Koppelen" — je browser opent',
        detail:
          'Na het opslaan toont de kaart een knop "Koppelen". Klik erop → het toestemmingsscherm van Google opent in je standaardbrowser.',
      },
      {
        title: 'Meld je aan met het Google-account dat je als testgebruiker hebt toegevoegd',
        detail:
          'Kies in de accountkiezer het e-mailadres dat je aan de testgebruikers hebt toegevoegd. "Continue" → waarschuwing "Google hasn\'t verified this app" (verwacht in testmodus). "Advanced" → "Go to FreeCrawl Local (unsafe)" → accepteer de rechten → Allow.',
      },
      {
        title: 'Terug naar FreeCrawl — je zou "Geconfigureerd" moeten zien',
        detail:
          'De Search Console-kaart in Instellingen toont nu een groene badge "Geconfigureerd". Je kunt nu naar het tabblad "Search Console" bovenaan gaan om properties te tonen + gegevens op te halen.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 access_denied"',
        solution:
          'Je hebt geen testgebruiker toegevoegd, of je meldt je aan met het verkeerde Google-account. Ga terug naar de pagina Audience en controleer of het account dat je gebruikt op de lijst met testgebruikers staat. Heb je meerdere Google-accounts, kijk dan welk account de accountkiezer gebruikt.',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'Ofwel de Search Console API was niet ingeschakeld, OF op het OAuth-toestemmingsscherm was het vakje "View Search Console data for your verified sites" niet aangevinkt. (1) Schakel de Search Console API in (stap 5), (2) myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → klik opnieuw op Koppelen en vink elk recht aan op het toestemmingsscherm.',
      },
      {
        problem: '"redirect_uri_mismatch"',
        solution:
          'Verkeerd OAuth-clienttype. Verwijder de client op de pagina Credentials en maak hem opnieuw aan als "Desktop app" (stap 7). "Web application" werkt nooit voor deze flow.',
      },
      {
        problem: '"This app isn\'t verified" warning',
        solution:
          'Verwacht gedrag (app in testmodus + gevoelige scope). Klik op "Advanced" → "Go to <app> (unsafe)" om door te gaan. De app staat in testmodus en laat alleen testgebruikers toe — dat is veilig.',
      },
      {
        problem: 'Connection broke after 7 days',
        solution:
          'Google laat OAuth-refreshtokens na 7 dagen verlopen zolang het toestemmingsscherm de publicatiestatus "Testing" heeft. Blijvende oplossing: Google Cloud Console → APIs & Services → OAuth consent screen → "Publish app" (de status wordt "In production"). Er is geen verificatiecontrole nodig — de waarschuwing "unverified app" blijft, maar tokens verlopen niet meer. Daarna nog één keer Instellingen → Integraties → Search Console → "Ontkoppelen" → "Koppelen".',
      },
    ],
    notes: [
      'Properties die je bezit (sc-domain:example.com of https://example.com/) omvatten elke site die je account heeft geverifieerd.',
      'GSC-gegevens lopen ~2 dagen achter — de klikken van vandaag verschijnen niet meteen.',
      'Gratis quotum: 1200 queries/min, 25.000 queries/dag — bij normaal gebruik kom je daar nooit aan.',
    ],
    lastReviewed: '2026-06-01',
  },
  ga4: {
    intro:
      'Haal per URL GA4-statistieken op (sessies, gebruikers, bouncepercentage, engagementpercentage, conversies). "Bring your own client" — gebruikt je eigen GCP OAuth-client.',
    prereqs: [
      'Google-account met minimaal Viewer-toegang tot de GA4-property die je gaat koppelen.',
      "Je kunt dezelfde OAuth-client HERGEBRUIKEN die je voor GSC hebt ingesteld — schakel alleen de juiste API's in.",
    ],
    steps: [
      {
        title: 'Heb je GSC al ingesteld? HERGEBRUIK dan die OAuth-client',
        detail:
          "Is Search Console al geconfigureerd, dan kun je hetzelfde Google Cloud-project en dezelfde OAuth Client ID + Secret gebruiken. Opnieuw aanmaken is niet nodig — schakel alleen de API's hieronder in en plak de credentials hier.",
      },
      {
        title: "Schakel BEIDE GA4-API's in",
        detail:
          'GA4 heeft twee aparte API\'s nodig:\n\n1. Google Analytics Admin API (voor het tonen van properties)\n2. Google Analytics Data API (voor de eigenlijke rapporten)\n\nSchakel je niet allebei in, dan krijg je "API not enabled"-fouten.',
        link: {
          label: 'Admin API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com',
        },
      },
      {
        title: 'Schakel ook de Data API in',
        link: {
          label: 'Data API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
        },
      },
      {
        title: 'Plak dezelfde Client ID + Secret die je voor GSC gebruikte',
        detail:
          'Is GSC al gekoppeld, dan hoef je misschien niet eens te plakken — de kaarten kunnen credentials delen. Stel je GA4 vanaf nul in, kopieer dan de ID/Secret van je GSC-client naar dit paneel.',
      },
      {
        title: '"Koppelen" → meld je aan met Google + keur de GA4-scope goed',
        detail:
          'Meld je aan met het Google-account dat je als testgebruiker hebt toegevoegd. Controleer op het toestemmingsscherm of het recht "Google Analytics: View Google Analytics property data" is aangevinkt.',
      },
      {
        title: 'Toon properties + haal gegevens op in het tabblad GA4',
        detail:
          'Ga naar het tabblad "GA4" bovenaan → "List Properties" toont elke GA4-property die je account kan zien → kies er een → kies een periode (7/28/90 dagen) → "Fetch". GA4 is bijna realtime, resultaten verschijnen meteen.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Google Analytics Admin API has not been used in project X"',
        solution:
          'Admin API niet ingeschakeld. Open de link uit stap 2 → Enable. Wacht 30 s en probeer opnieuw. Daarna krijg je dezelfde fout voor de Data API — open de link uit stap 3 en schakel die ook in.',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'De OAuth-scope dekt GA4 niet. Ga naar myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → klik opnieuw op Koppelen → vink het vakje voor het Google Analytics-recht aan.',
      },
      {
        problem: 'Property list comes back empty',
        solution:
          'Het gekoppelde Google-account heeft geen rol op een GA4-property. GA4-dashboard → Admin → Property Access Management → controleer of je e-mailadres minimaal Viewer is.',
      },
    ],
    notes: [
      'GA4-gegevens zijn bijna realtime — de gegevens van vandaag verschijnen binnen 4-24 uur.',
      'Gratis quotum: 200K verzoeken/dag, 50 verzoeken/min per property.',
    ],
    lastReviewed: '2026-06-01',
  },
  metrica: {
    intro:
      'Haal ongesamplede Yandex Metrica-gegevens per URL op: paginaweergaven (op hitniveau, per pagina-URL) en bezoeken, gebruikers en bezoeken via zoekmachines (op sessieniveau, per landingspagina). Je maakt je eigen kleine Yandex OAuth-app en een alleen-lezen token aan, zodat API-quota alleen meetellen voor je eigen Yandex-account.',
    prereqs: [
      'Een Yandex-account dat de Metrica-teller kan bekijken — de eigenaar, of een gebruiker aan wie de eigenaar minimaal leestoegang heeft gegeven (Metrica → Settings → Access).',
      'Ongeveer 5 minuten. Er is geen betaling of app-review nodig.',
    ],
    steps: [
      {
        title: 'Open de registratiepagina voor Yandex OAuth-apps',
        detail:
          'Meld je aan met het Yandex-account dat de teller kan bekijken. Ben je bij meerdere Yandex-accounts aangemeld, schakel dan eerst naar het juiste — het token hoort bij het account dat het in stap 5 goedkeurt.',
        link: { label: 'oauth.yandex.com', url: 'https://oauth.yandex.com/client/new' },
      },
      {
        title: 'Kies het apptype "For API access or debugging"',
        detail:
          'Het type kan na het aanmaken van de app niet meer worden gewijzigd. Vul daarna in:\n• Name: "FreeCrawl" (elk label dat je herkent)\n• Contact email: je e-mailadres',
      },
      {
        title: 'Voeg het recht metrika:read toe',
        detail:
          'Zoek in het gedeelte voor gegevenstoegang naar Yandex Metrica en vink alleen het recht met de code metrika:read aan (statistieken en tellerparameters lezen). FreeCrawl schrijft nooit naar Metrica, dus laat metrika:write en de andere rechten uitgevinkt.\n\nHoort de teller bij een organisatieaccount (Yandex 360 for Business), voeg dan ook passport:business toe.',
      },
      {
        title: 'Maak de app aan en kopieer de ClientID',
        detail:
          'Na het opslaan toont de app-pagina de ClientID (een hexadecimale string van 32 tekens). Het client secret heb je niet nodig.',
      },
      {
        title: 'Open de autorisatielink om het token te krijgen',
        detail:
          'Open in dezelfde browser dit adres, met je ClientID in plaats van <ClientID>:\n\nhttps://oauth.yandex.com/authorize?response_type=token&client_id=<ClientID>\n\nKeur het toegangsverzoek goed. Yandex toont daarna het token op de pagina — kopieer het.',
      },
      {
        title: 'Plak het token in FreeCrawl',
        detail:
          'Instellingen → Integraties → Yandex Metrica → OAuth-token → Opslaan. Het token blijft op deze computer en wordt alleen naar de Metrica-API verzonden. Het wordt versleuteld met de sleutelhanger van het besturingssysteem als die beschikbaar is; op Linux zonder keyring wordt het onversleuteld opgeslagen in een bestand dat alleen jouw gebruiker kan lezen.',
      },
      {
        title: 'Toon de tellers, kies er een en haal gegevens op',
        detail:
          "Kies de teller voor de gecrawlde site, kies een periode (de laatste 7, 28 of 90 volledige dagen, tot en met gisteren) en haal de gegevens op. Een grote site duurt een paar minuten: Metrica beantwoordt elke pagina van maximaal 100.000 URL's in 15–30 s.",
      },
    ],
    troubleshooting: [
      {
        problem: '"Yandex Metrica rejected the token" (HTTP 401)',
        solution:
          'Het token is verlopen, ingetrokken of onvolledig gekopieerd. Open de autorisatielink uit stap 5 opnieuw en plak het nieuwe token.',
      },
      {
        problem: '"Yandex Metrica denied access" (HTTP 403)',
        solution:
          'Het account dat het token heeft goedgekeurd, kan deze teller niet zien, of de app mist metrika:read. Controleer de toegangslijst van de teller in Metrica, of bewerk de app op oauth.yandex.com, voeg metrika:read toe en vraag een nieuw token aan.',
      },
      {
        problem: 'The counter list is empty or the counter is missing',
        solution:
          'Het token hoort bij een ander Yandex-account. Meld je aan bij het juiste account, open de autorisatielink opnieuw en vervang het token.',
      },
      {
        problem: '"Query is too complicated" or throttling errors',
        solution:
          'FreeCrawl probeert deze automatisch opnieuw met steeds langere pauzes. Mislukt het ophalen nog steeds, probeer het dan later opnieuw of gebruik een kortere periode.',
      },
    ],
    notes: [
      'Paginaweergaven tellen elke weergave van een URL; bezoeken, gebruikers en bezoeken via zoekmachines tellen sessies op basis van de pagina waarop ze begonnen. Een pagina kan veel paginaweergaven en nul bezoeken hebben.',
      "Gebruikers optellen over pagina's heen geeft een te hoge telling: één persoon kan op meerdere pagina's binnenkomen.",
      "Metrica-API-limieten gelden per Yandex-account: 200 verzoeken per 5 minuten, 3 tegelijk, 5.000 per dag. Eén keer ophalen kost een paar verzoeken per 100.000 URL's.",
      'Je kunt het token op elk moment intrekken in je Yandex ID-account (id.yandex.com), in de lijst met apps die toegang hebben tot je gegevens.',
    ],
    lastReviewed: '2026-10-11',
  },
  sheets: {
    intro:
      'Exporteer crawlresultaten rechtstreeks naar een Google Sheet. Beter dan "CSV downloaden → openen in Excel" wanneer je met teamgenoten samenwerkt in een gedeeld live document.',
    prereqs: [
      'Google-account.',
      'Je kunt dezelfde OAuth-client HERGEBRUIKEN die je voor GSC hebt ingesteld.',
    ],
    steps: [
      {
        title: 'Heb je GSC/GA4 ingesteld? HERGEBRUIK dan die OAuth-client',
        detail: 'Plak dezelfde OAuth Client ID + Secret (of misschien zijn ze al opgeslagen).',
      },
      {
        title: 'Schakel de Google Sheets API in',
        link: {
          label: 'Sheets API → Enable',
          url: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
        },
      },
      {
        title: 'Schakel ook de Google Drive API in',
        detail: 'De Sheets API heeft ook een Drive-scope nodig om spreadsheets te maken/lezen.',
        link: {
          label: 'Drive API → Enable',
          url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
        },
      },
      {
        title: 'Plak Client ID + Secret + Opslaan',
      },
      {
        title: '"Koppelen" → keur Sheets + Drive goed op het toestemmingsscherm',
        detail:
          'De OAuth-flow toont twee rechten:\n• See, edit, create, and delete all your Google Sheets spreadsheets\n• See, edit, create, and delete only the specific Google Drive files used with this app\nVink ze allebei aan.',
      },
      {
        title: 'Test via het menu Exporteren',
        detail:
          'Bestand → Exporteren → "Exporteren naar Google Sheets". Er wordt automatisch een nieuwe Sheet aangemaakt en de URL wordt naar het klembord gekopieerd.',
      },
    ],
    troubleshooting: [
      {
        problem: '"insufficient authentication scopes"',
        solution:
          'Je hebt het vakje voor het Drive-recht niet aangevinkt tijdens het koppelen. Ontkoppel + koppel opnieuw en vink beide rechten aan.',
      },
    ],
    notes: [
      "Harde limiet van Sheets: 10M cellen per spreadsheet — grote crawls (>500K URL's) worden opgesplitst.",
      'De Drive-scope is "drive.file" — alleen bestanden die FreeCrawl aanmaakt zijn toegankelijk, niet je bestaande bestanden.',
    ],
    lastReviewed: '2026-06-01',
  },
  bigquery: {
    intro:
      'Stream crawlgegevens rechtstreeks naar een BigQuery-dataset. Handig om snapshots met datumstempel in je datawarehouse te verzamelen en crawltrends te visualiseren met een BI-tool (Looker Studio, Tableau, Metabase).',
    prereqs: [
      'Google Cloud-project met de BigQuery API ingeschakeld.',
      'Een al aangemaakte BigQuery-dataset.',
      'Service Account-JSON (GEEN OAuth — server-naar-server-authenticatie).',
      "GCP-project met facturering ingeschakeld (gratis BigQuery-laag: 10GB opslag/mnd + 1TB query's/mnd; daarboven betaal je).",
    ],
    steps: [
      {
        title: 'Maak een BigQuery-dataset aan',
        detail:
          'BigQuery Console → kies je project → "Create dataset" → ID: "freecrawl_seo" (of een andere naam) → Location: "EU" of "US" (belangrijk — kan later niet worden gewijzigd) → Create dataset.',
        link: {
          label: 'BigQuery Console',
          url: 'https://console.cloud.google.com/bigquery',
        },
      },
      {
        title: 'Maak een serviceaccount aan',
        detail:
          'IAM & Admin → Service Accounts → "+ Create service account" → naam: "freecrawl-bigquery" → Create and continue.',
        link: {
          label: 'Service Accounts',
          url: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
        },
      },
      {
        title: 'Voeg rollen toe',
        detail:
          'Voeg in stap 2 "Grant this service account access to project" twee rollen toe:\n• BigQuery Data Editor\n• BigQuery Job User\nDaarna "Continue" → "Done".',
      },
      {
        title: 'Download de JSON-sleutel',
        detail:
          'Klik in de lijst met serviceaccounts op het account dat je net hebt gemaakt → tabblad "Keys" → "Add key" → "Create new key" → Type: JSON → Create.\n\nDe JSON wordt automatisch gedownload. Open hem in een teksteditor en kopieer de volledige inhoud.\n\nWAARSCHUWING: Deze JSON bevat alle inloggegevens — behandel hem als een wachtwoord. Zet hem nooit in versiebeheer.',
      },
      {
        title: 'Plak hem in het veld "Service Account JSON" van dit paneel',
        detail:
          'Plak de volledige JSON (van de openende `{` tot de sluitende `}`). FreeCrawl slaat de JSON versleuteld op in de credentialopslag van het besturingssysteem.',
      },
      {
        title: 'Vul "GCP Project ID" in',
        detail:
          'Je GCP-project-ID (staat in de dropdown linksboven in de Cloud Console, bijv. "my-gcp-project-12345"). De JSON heeft ook een veld "project_id" — je kunt het daar kopiëren.',
      },
      {
        title: 'Voer de datasetnaam in + Opslaan',
        detail: 'De datasetnaam die je in stap 1 hebt aangemaakt (bijv. "freecrawl_seo").',
      },
      {
        title: 'Test via het menu Exporteren',
        detail:
          'Bestand → Exporteren → "Exporteren naar BigQuery" → kies een tabelnaam/-indeling → uitvoeren. Controleer of de tabel in de BigQuery Console is verschenen.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 PermissionDenied: caller does not have permission"',
        solution:
          'IAM-rollen van het serviceaccount ontbreken. IAM & Admin → IAM → zoek het e-mailadres van je serviceaccount → controleer of zowel "BigQuery Data Editor" als "BigQuery Job User" zijn toegewezen.',
      },
      {
        problem: '"Dataset X not found"',
        solution:
          'Verkeerde datasetnaam OF de locatie komt niet overeen (multiregio "EU" vs. regio "europe-west1"). Kopieer de exacte datasetnaam uit de BigQuery Console.',
      },
      {
        problem: '"Invalid JSON"',
        solution:
          'Je hebt maar een deel van de JSON geplakt of er staat een los teken aan het begin of eind. Open het JSON-bestand van het serviceaccount met een echte editor (VS Code aanbevolen, NIET Kladblok), Ctrl+A om alles te selecteren, kopieer, maak het FreeCrawl-veld leeg en plak.',
      },
    ],
    notes: [
      "Kosten: de gratis BigQuery-laag (10GB opslag + 1TB query's/mnd) dekt normaal gebruik. Een crawl van 1M URL's is ~500MB; de querykosten hangen af van je SQL.",
      'Schema-evolutie: FreeCrawl maakt de exporttabel automatisch aan of werkt die bij. Krijgt het CrawlUrlRow-schema nieuwe kolommen, dan neemt de exporttabel die over (flexibiliteit van BigQuery-DDL).',
    ],
    lastReviewed: '2026-06-01',
  },
};
