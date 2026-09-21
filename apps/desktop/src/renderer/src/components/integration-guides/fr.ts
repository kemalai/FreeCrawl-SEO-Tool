/**
 * French integration setup guides. Generated from the guide source —
 * see `./index.ts` for how a locale is picked. Keep the step count,
 * links and `lastReviewed` in lockstep with `en.ts`; the parity test
 * in `tests/` compares them.
 */
import type { Guide } from './types.js';

export const GUIDES_FR: Record<string, Guide> = {
  openai: {
    intro:
      "Exécutez un prompt personnalisé par URL via l'API d'OpenAI — analyse de contenu, idées de titres, résumés. L'utilisation est facturée sur votre propre compte OpenAI ; FreeCrawl est un intermédiaire gratuit, les appels API sont à votre charge.",
    prereqs: [
      'Compte OpenAI (inscription gratuite sur https://platform.openai.com).',
      'Moyen de paiement valide — OpenAI exige un solde minimum de 5 $ avant que les clés fonctionnent.',
    ],
    steps: [
      {
        title: 'Connectez-vous sur platform.openai.com',
        detail: 'Utilisez votre compte OpenAI. Si vous n\'en avez pas encore, "Sign up".',
        link: {
          label: 'platform.openai.com',
          url: 'https://platform.openai.com',
        },
      },
      {
        title: 'Cliquez sur "API keys" dans la barre latérale gauche',
        detail:
          "Élément de menu avec une icône de clé à gauche. Vous pouvez aussi aller directement à l'URL.",
        link: {
          label: 'Page API keys',
          url: 'https://platform.openai.com/api-keys',
        },
      },
      {
        title: 'Cliquez sur "+ Create new secret key" (en haut à droite)',
        detail:
          'Dans la boîte de dialogue :\n• Name : "FreeCrawl SEO Tool" (n\'importe quel libellé mémo)\n• Project : Default project ou celui de votre choix\n• Permissions : All (le plus simple ; les portées restreintes fonctionnent aussi)\npuis "Create secret key".',
      },
      {
        title: 'COPIEZ la clé — elle ne sera plus jamais affichée',
        detail:
          'La clé commence par `sk-...`. Si vous ne la copiez pas maintenant, elle est perdue pour de bon (il faudra en créer une nouvelle). Rangez-la dans un gestionnaire de mots de passe — ne la laissez pas dans un onglet de navigateur.',
      },
      {
        title: 'Collez-la dans le champ "API Key" de ce panneau + cliquez sur Enregistrer',
        detail:
          "FreeCrawl stocke la clé chiffrée dans le coffre d'identifiants du système (DPAPI Windows, Trousseau macOS, Secret Service Linux). Jamais écrite en clair.",
      },
      {
        title: "Testez dans l'onglet AI",
        detail:
          'Fermez les Paramètres → passez à l\'onglet supérieur "AI" → choisissez quelques URL d\'une exploration → cliquez sur "Run AI". Le premier appel prend ~2-3 s.',
      },
    ],
    troubleshooting: [
      {
        problem: '"You exceeded your current quota"',
        solution:
          'Votre compte OpenAI n\'a pas de solde. Allez sur platform.openai.com → Billing → "Add payment method" → ajoutez une carte et créditez 5 $ ou plus. Les nouveaux comptes ne reçoivent pas de crédit automatique ; il faut recharger.',
      },
      {
        problem: '"Incorrect API key provided" / 401',
        solution:
          "La clé a probablement une espace parasite au début ou à la fin. Générez-en une nouvelle et copiez-la soigneusement. Révoquez l'ancienne.",
      },
      {
        problem: '"Rate limit exceeded"',
        solution:
          'Trop de requêtes en parallèle. Baissez la concurrence dans Paramètres → AI (par défaut : 3). Les comptes Tier 1 tournent à 500-3500 RPM selon le modèle.',
      },
    ],
    notes: [
      'Tarifs (2026-06) : gpt-4o-mini ~0,15 $/1M tokens en entrée, gpt-4o ~2,50 $/1M en entrée. 1000 URL avec prompt + réponse typiques : ~0,50-2 $.',
      "Fixez une limite mensuelle stricte sur la page Usage limits — vous ne voulez pas qu'une exploration incontrôlée d'1M d'URL produise une facture de 1000 $.",
    ],
    lastReviewed: '2026-06-01',
  },
  anthropic: {
    intro:
      'Exécutez des prompts sur Claude via l\'API d\'Anthropic. Les modèles haut de gamme de Claude (Sonnet 4.6, Opus 4.8) donnent un résultat SEO moins "typé IA" que la concurrence. Facturé sur votre propre compte Anthropic.',
    prereqs: [
      'Compte Anthropic (https://console.anthropic.com).',
      'Moyen de paiement enregistré (les nouveaux utilisateurs reçoivent 5 $ de crédit promotionnel).',
    ],
    steps: [
      {
        title: 'Connectez-vous sur console.anthropic.com',
        link: {
          label: 'console.anthropic.com',
          url: 'https://console.anthropic.com',
        },
      },
      {
        title: 'Ouvrez la page "API Keys" depuis le menu déroulant en haut à droite',
        detail: 'Dans le menu Settings, entrée "API Keys".',
        link: {
          label: 'Page API Keys',
          url: 'https://console.anthropic.com/settings/keys',
        },
      },
      {
        title: 'Cliquez sur "+ Create Key"',
        detail:
          'Dans la boîte de dialogue :\n• Name : "FreeCrawl SEO Tool"\n• Workspace : Default workspace\n• Environment : Production\npuis "Create Key".',
      },
      {
        title: 'COPIEZ la clé — elle ne sera plus jamais affichée',
        detail: 'La clé commence par `sk-ant-...`. Perdue ? Créez-en une nouvelle.',
      },
      {
        title: 'Collez-la dans le champ "API Key" + Enregistrer',
      },
      {
        title: 'Facultatif : choisissez un modèle',
        detail:
          'Dans Paramètres → AI, le champ "Model" accepte un identifiant de modèle (par défaut : claude-sonnet-4-6). Priorité vitesse : claude-haiku-4-5 (~10x moins cher, 3x plus rapide). Priorité qualité : claude-opus-4-8.',
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
          'Les comptes Tier 1 tournent à ~50 RPM. Baissez la concurrence à 2-3 dans Paramètres → AI. Pour les tiers supérieurs il faut avoir dépensé 25 $ ou plus (Tier 2 : 1000 RPM).',
      },
      {
        problem: '"Invalid API key"',
        solution:
          "Vérifiez que le préfixe \"sk-ant-\" est intact et qu'il n'y a pas d'espaces parasites. Consultez la page API Keys — si la clé y apparaît comme active, la clé elle-même est bonne.",
      },
    ],
    notes: [
      'Tarifs (2026-06) : Haiku 4.5 ~0,25 $/1,25 $ (entrée/sortie par 1M tokens), Sonnet 4.6 ~3 $/15 $, Opus 4.8 ~15 $/75 $.',
      "Anthropic prend en charge la mise en cache des prompts — les longs system prompts répétés dans les 5 min bénéficient de 90 % de remise (le panneau AI de FreeCrawl n'utilise pas encore le cache — prévu dans une version ultérieure).",
    ],
    lastReviewed: '2026-06-01',
  },
  ollama: {
    intro:
      'Ollama est un runtime open source pour LLM hébergés localement. PAS de clé API, gratuit à vie, ne nécessite même pas Internet. Coût nul ; seul inconvénient : la VRAM/RAM pour les gros modèles.',
    prereqs: [
      'macOS 12+, Windows 10+ ou Linux (Ubuntu 22.04+ recommandé).',
      'Au moins 8 Go de RAM (petits modèles). Llama 3.2 3B a besoin de ~2 Go de VRAM/RAM.',
      'GPU recommandé mais pas obligatoire — le CPU fonctionne (plus lent).',
    ],
    steps: [
      {
        title: 'Téléchargez + installez Ollama',
        detail:
          "Choisissez l'installateur de votre OS :\n• Windows : OllamaSetup.exe\n• macOS : Ollama.dmg\n• Linux : curl -fsSL https://ollama.com/install.sh | sh\n\nAprès installation, Ollama tourne en arrière-plan (icône dans la zone de notification).",
        link: {
          label: 'ollama.com/download',
          url: 'https://ollama.com/download',
        },
      },
      {
        title: 'Récupérez un modèle',
        detail:
          'Ouvrez un terminal et lancez :\n\n  ollama pull llama3.2\n\nllama3.2 (3B paramètres) pèse ~2 Go, rapide, peu gourmand. Options plus grosses :\n  ollama pull llama3.3:70b   (~40 Go, GPU costaud uniquement)\n  ollama pull qwen2.5:7b     (~4 Go, équilibré)\n  ollama pull mistral:7b     (~4 Go, alternative)',
      },
      {
        title: 'Testez rapidement le modèle',
        detail:
          'Dans le terminal :\n  ollama run llama3.2\n\nUn chat interactif s\'ouvre. Tapez "hello" — si vous obtenez une réponse, c\'est bon. Ctrl+D pour quitter.',
      },
      {
        title: 'Saisissez le point de terminaison Ollama dans ce panneau',
        detail:
          'Par défaut : http://localhost:11434 (déjà prérempli). Modifiez-le si Ollama tourne sur un autre port.',
      },
      {
        title: 'Saisissez le nom du modèle récupéré',
        detail:
          'P. ex. "llama3.2" ou "qwen2.5:7b". Laissez vide pour que FreeCrawl prenne le premier modèle disponible.',
      },
      {
        title: 'Enregistrez + testez',
        detail: "Lancez un petit lot dans l'onglet AI. CPU seul : ~5-15 s/URL. GPU : ~1-3 s.",
      },
    ],
    troubleshooting: [
      {
        problem: 'AI tab says "Connection refused"',
        solution:
          'Ollama n\'est pas lancé. Dans le terminal, exécutez "ollama serve" ou lancez l\'application Ollama depuis la zone de notification / le menu Démarrer.',
      },
      {
        problem: '"model \'X\' not found"',
        solution:
          'Modèle non récupéré. Lancez "ollama pull <nom-du-modèle>". Utilisez "ollama list" pour voir ce qui est déjà sur le disque.',
      },
      {
        problem: 'Replies are very slow (>30 s/URL)',
        solution:
          'Le modèle ne tient pas en VRAM et bascule sur le CPU. Essayez un modèle plus petit (llama3.2:1b ou phi3:mini). Besoins en VRAM : 3B ~2 Go, 7B ~4 Go, 13B ~8 Go.',
      },
    ],
    notes: [
      "Entièrement hors ligne — l'exploration + l'analyse IA continuent même sans Internet.",
      "Qualité de l'analyse SEO locale : les modèles 3B sont un peu faibles, 7-13B corrects, 70B au niveau de GPT-4 (mais matériel lourd).",
      'Dans Paramètres → AI, gardez une concurrence de 1-2 — les modèles locaux sérialisent les requêtes parallèles.',
    ],
    lastReviewed: '2026-06-01',
  },
  pagespeed: {
    intro:
      'Google PageSpeed Insights audite chaque URL avec Lighthouse et renvoie les scores Performance/SEO/Accessibilité/Bonnes pratiques + les Core Web Vitals (LCP/CLS/INP). Une clé API gratuite vous donne 25 000 audits/jour.',
    prereqs: [
      'Compte Google.',
      'Projet Google Cloud Console (vous pouvez en créer un dans les étapes ci-dessous).',
    ],
    steps: [
      {
        title: 'Ouvrez Google Cloud Console',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Choisissez ou créez un projet',
        detail:
          'Menu déroulant de projet en haut à gauche → "New Project" → nom : "FreeCrawl SEO" → Create. AUCUN compte de facturation requis — le niveau gratuit de PSI n\'a besoin d\'identifiants que pour l\'authentification.',
      },
      {
        title: 'Activez la PageSpeed Insights API',
        detail: "Ce lien direct mène à la page d'activation de l'API :",
        link: {
          label: 'PageSpeed Insights API → Enable',
          url: 'https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com',
        },
      },
      {
        title: 'Cliquez sur le bouton bleu "Enable" → attendez 30 s',
      },
      {
        title: 'Allez dans Credentials',
        link: {
          label: 'Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'Cliquez sur "+ Create Credentials" → "API key"',
        detail: 'Une clé API est générée (elle commence par `AIzaSy...`). Copiez-la immédiatement.',
      },
      {
        title: 'Facultatif : restreignez la clé API (recommandé)',
        detail:
          'Cliquez sur "Edit API key" → "Restrict key" :\n• API restrictions : "Restrict key" → "PageSpeed Insights API"\n• Application restrictions : "None" (FreeCrawl est une application de bureau, le filtrage par referrer/IP ne fonctionnera pas)\nLes clés non restreintes fonctionnent aussi, mais nous recommandons de restreindre.',
      },
      {
        title: 'Collez la clé dans le champ "API Key" de ce panneau + Enregistrer',
      },
      {
        title: "Testez dans l'onglet PageSpeed",
        detail:
          'Onglet supérieur "PageSpeed" → choisissez quelques URL → "Run audit". Le premier audit prend ~10-15 s.',
      },
    ],
    troubleshooting: [
      {
        problem: '"This API method requires billing to be enabled"',
        solution:
          'Vous avez activé la mauvaise API (p. ex. une ancienne "Cloud PageSpeed Insights API"). La bonne est "PageSpeed Insights API" (pagespeedonline.googleapis.com). Rouvrez le lien de l\'étape 3.',
      },
      {
        problem: '"API key not valid"',
        solution:
          'Les restrictions de la clé sont incorrectes. Cloud Console → Credentials → cliquez sur la clé → vérifiez que "PageSpeed Insights API" figure parmi les API autorisées. Ou retirez temporairement les restrictions pour vérifier.',
      },
      {
        problem: '"Quota exceeded" — before hitting 25,000',
        solution:
          "Il y a aussi une limite par minute : 240 requêtes/min. Dans Paramètres → PageSpeed, gardez une concurrence de 2-3. Le plafond quotidien de 25K est énorme — vous ne l'atteindrez pas en usage normal.",
      },
    ],
    notes: [
      "Coût : GRATUIT — l'une des rares API Google qui n'exige pas de facturation. Le mode sans clé/anonyme est désormais à 0 requête/jour (fermé début 2026), la clé est donc obligatoire.",
      'Vitesse : chaque URL ~5-10 s (Google fait réellement tourner une instance Lighthouse). 1000 URL ~2 heures.',
      'Mobile + Desktop comptent comme des appels API distincts — choisir "les deux" double la consommation de quota.',
    ],
    lastReviewed: '2026-06-01',
  },
  ahrefs: {
    intro:
      "Récupérez le nombre de backlinks, le domain rating, les domaines référents et le nombre de mots-clés organiques par URL via l'API d'Ahrefs. C'est l'intégration la plus chère d'Ahrefs — l'accès API est réservé aux forfaits à 500 $/mois et plus.",
    prereqs: [
      'Abonnement Ahrefs Standard (249 $/mois) ou supérieur.',
      'Niveau complémentaire "API" (500 $/mois de plus que le forfait de base, ou un autre niveau).',
    ],
    steps: [
      {
        title: 'Connectez-vous à Ahrefs → page API',
        link: {
          label: 'ahrefs.com/api',
          url: 'https://ahrefs.com/api',
        },
      },
      {
        title: "Choisissez un abonnement (si vous n'avez pas encore l'accès API)",
        detail:
          "L'accès à l'API v3 est fourni avec le niveau Enterprise et les forfaits API dédiés. Contactez le service commercial pour un devis.",
      },
      {
        title: 'Générez un jeton API dans votre compte',
        detail:
          'Tableau de bord Ahrefs → Account settings → API → Generate token. Format du jeton : `sk-...` ou similaire.',
      },
      {
        title: 'Collez-le dans le champ "API Key" + Enregistrer',
      },
      {
        title: "Testez dans l'onglet SEO Authority",
        detail:
          'Onglet supérieur "SEO Authority" → fournisseur : "Ahrefs" → choisissez quelques URL → "Run".',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient credits"',
        solution:
          'Unités de lignes API épuisées. Tableau de bord Ahrefs → API → onglet "Usage". Passez à un forfait supérieur ou attendez le prochain cycle de facturation.',
      },
      {
        problem: '"Unauthorized"',
        solution:
          'Votre abonnement n\'inclut pas l\'accès API. "Ahrefs Standard" seul ne donne pas de droits API — il faut un niveau API explicite en plus.',
      },
    ],
    notes: [
      "Coût : environ 1-5 lignes API par audit d'URL. Forfait API Standard ~25K lignes/mois.",
      'Alternatives moins chères : Moz (99 $/mois, Domain Authority) ou Majestic.',
    ],
    lastReviewed: '2026-06-01',
  },
  majestic: {
    intro:
      "Récupérez Trust Flow, Citation Flow et le nombre de backlinks via l'API de Majestic. Le fournisseur orienté backlinks le plus économique.",
    prereqs: [
      'Abonnement Majestic Lite (49,99 $/mois) ou supérieur.',
      'Accès API — inclus avec Lite.',
    ],
    steps: [
      {
        title: 'Ouvrez le tableau de bord développeur de Majestic',
        link: {
          label: 'majestic.com/account/api',
          url: 'https://majestic.com/account/api',
        },
      },
      {
        title: 'Générez une clé API',
        detail: 'Tableau de bord → onglet "Open API" → "Generate new key" → copiez.',
      },
      {
        title: 'Collez-la dans ce panneau + Enregistrer',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient resources" / "No analysis units"',
        solution:
          "Quota mensuel d'unités d'analyse épuisé. Forfait Lite : 1000 unités/mois ; Pro : 20K+. Vérifiez le tableau de bord Majestic → API → utilisation.",
      },
    ],
    notes: [
      "Coût : 1 recherche de backlinks d'URL = 5 unités. Forfait Lite (1000 unités) ~200 URL/mois.",
    ],
    lastReviewed: '2026-06-01',
  },
  moz: {
    intro:
      "Récupérez Domain Authority (DA), Page Authority (PA) et Spam Score via l'API Moz. Le choix le plus populaire pour les petits budgets.",
    prereqs: [
      'Abonnement Moz Pro Standard (99 $/mois) ou supérieur avec le module "Moz API" activé.',
    ],
    steps: [
      {
        title: 'Ouvrez la page API de Moz',
        link: {
          label: 'moz.com/api',
          url: 'https://moz.com/api',
        },
      },
      {
        title: 'Account → API → "Generate Credentials"',
        detail: 'Deux valeurs sont produites : "Access ID" et "Secret Key". Copiez les deux.',
      },
      {
        title:
          'Collez chacune dans les champs "Access ID" + "Secret Key" de ce panneau + Enregistrer',
        detail: "Deux champs distincts — remplissez-les dans l'ordre.",
      },
    ],
    troubleshooting: [
      {
        problem: '"Authentication failed"',
        solution:
          "L'Access ID ou la Secret Key a été mal copié. Recopiez depuis le tableau de bord Moz — l'Access ID est court (~13 caractères), la Secret Key est longue (~40 caractères).",
      },
    ],
    notes: [
      'Coût : forfait Standard (1500 lignes/mois), Medium (10K lignes/mois), Large (100K lignes/mois).',
    ],
    lastReviewed: '2026-06-01',
  },
  semrush: {
    intro:
      "Récupérez les mots-clés organiques, les estimations de trafic et les fonctionnalités SERP via l'API Semrush. Les données mots-clés + trafic les plus complètes.",
    prereqs: [
      'Abonnement Semrush Pro (129 $/mois) ou supérieur.',
      '"API units" rattachées au compte (le niveau Guru et au-delà incluent l\'accès API).',
    ],
    steps: [
      {
        title: 'Connectez-vous à Semrush → Subscription info → API',
        link: {
          label: 'Accès API Semrush',
          url: 'https://www.semrush.com/accounts/subscription-info/api-units/',
        },
      },
      {
        title: 'Copiez la clé API',
      },
      {
        title: 'Collez-la dans ce panneau + Enregistrer',
      },
    ],
    troubleshooting: [
      {
        problem: '"API units exhausted"',
        solution:
          "Quota mensuel d'unités épuisé. Forfait Guru : 7K unités/mois, Business : 25K+. Vérifiez le tableau de bord Semrush → API → utilisation.",
      },
    ],
    notes: ["Coût : 1 requête backlinks d'URL = 10 unités ; 1 aperçu de domaine = 1 unité."],
    lastReviewed: '2026-06-01',
  },
  gsc: {
    intro:
      "Récupérez les métriques Search Console par URL (clics, impressions, CTR, position moyenne) via l'API Google Search Console. L'API URL Inspection vous donne aussi le verdict de couverture + l'heure de la dernière exploration. Modèle \"apportez votre propre client\" — vous créez votre propre client OAuth Google Cloud et le collez ; FreeCrawl n'utilise pas d'application intermédiaire partagée.",
    prereqs: [
      'Compte Google (doit être propriétaire / copropriétaire de la propriété GSC à connecter).',
      'Au moins une propriété Google Search Console ajoutée + validée.',
    ],
    steps: [
      {
        title: 'Ouvrez Google Cloud Console et créez un nouveau projet',
        detail:
          'Menu déroulant de projet en haut à gauche → "New Project" → nom : "FreeCrawl SEO Integrations" (ce que vous voulez) → Create. Ce projet ne sert qu\'aux identifiants OAuth — facturation non requise.',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Ouvrez Google Auth Platform → Branding',
        detail:
          'Menu de gauche "APIs & Services" → "OAuth consent screen" (nouvelle interface : "Google Auth Platform → Branding"). User Type : "External" → Create.',
        link: {
          label: 'OAuth consent screen',
          url: 'https://console.cloud.google.com/auth/branding',
        },
      },
      {
        title: "Remplissez l'écran de consentement OAuth",
        detail:
          'Seulement les champs obligatoires :\n• App name : "FreeCrawl Local"\n• User support email : votre e-mail\n• Developer contact information : votre e-mail\nLaissez le reste vide. Save and Continue → Save and Continue → Save and Continue → Back to Dashboard.',
      },
      {
        title: 'CRITIQUE : ajoutez-vous comme Test User',
        detail:
          'Menu de gauche → "Audience" (ancienne interface "Test users") → "Add users" → collez le Gmail que vous allez connecter → Save.\n\nATTENTION : NE SAUTEZ PAS CETTE ÉTAPE. La sauter provoque un 403 access_denied pendant OAuth — les applications en statut "Testing" n\'autorisent que les comptes de la liste des testeurs.',
        link: {
          label: 'Page Audience',
          url: 'https://console.cloud.google.com/auth/audience',
        },
      },
      {
        title: 'Activez la Google Search Console API',
        detail:
          'Ce lien mène directement à la page d\'activation → cliquez sur le bouton bleu "Enable" → attendez 30 s.',
        link: {
          label: 'Search Console API → Enable',
          url: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com',
        },
      },
      {
        title: 'Créez un OAuth Client ID',
        detail:
          'Menu de gauche → "Credentials" (nouvelle interface "Google Auth Platform → Clients") → "+ Create credentials" → "OAuth client ID".',
        link: {
          label: 'Page Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'Choisissez "Desktop app" comme type de client OAuth (PAS Web app !)',
        detail:
          'Menu déroulant Application type → "Desktop app". Name : "FreeCrawl SEO Tool". Create → la boîte de dialogue affiche Client ID + Client Secret. Copiez les deux immédiatement (le Secret n\'est plus affiché ensuite).\n\nPOURQUOI DESKTOP : FreeCrawl utilise un port local aléatoire (p. ex. 127.0.0.1:63092) par connexion. "Web application" exige une liste fixe de redirect URI — ce port aléatoire ne peut pas correspondre → échec. "Desktop app" accepte automatiquement les redirections loopback, quel que soit le port.',
      },
      {
        title: 'Collez Client ID + Client Secret dans ce panneau + Enregistrer',
        detail:
          'Deux champs : "OAuth Client ID" (...apps.googleusercontent.com) et "OAuth Client Secret" (GOCSPX-...). Enregistrer.',
      },
      {
        title: 'Cliquez sur "Connecter" — votre navigateur s\'ouvre',
        detail:
          'Après Enregistrer, la carte affiche un bouton "Connecter". Cliquez → l\'écran de consentement de Google s\'ouvre dans votre navigateur par défaut.',
      },
      {
        title: 'Connectez-vous avec le compte Google ajouté comme testeur',
        detail:
          'Dans le sélecteur de compte, choisissez l\'e-mail ajouté aux testeurs. "Continue" → avertissement "Google hasn\'t verified this app" (attendu en mode test). "Advanced" → "Go to FreeCrawl Local (unsafe)" → acceptez les autorisations → Allow.',
      },
      {
        title: 'Retour dans FreeCrawl — vous devriez voir "Configuré"',
        detail:
          'La carte Search Console des Paramètres affiche désormais un badge vert "Configuré". Vous pouvez maintenant passer à l\'onglet supérieur "Search Console" pour lister les propriétés + récupérer les données.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 access_denied"',
        solution:
          "Vous n'avez pas ajouté de testeur, ou vous vous connectez avec le mauvais compte Google. Retournez sur la page Audience et vérifiez que le compte utilisé figure dans la liste des testeurs. Si vous avez plusieurs comptes Google, regardez lequel le sélecteur de compte utilise.",
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'Soit la Search Console API n\'était pas activée, SOIT la case d\'autorisation "View Search Console data for your verified sites" de l\'écran de consentement OAuth était décochée. (1) Activez la Search Console API (étape 5), (2) myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → cliquez à nouveau sur Connecter et cochez toutes les autorisations sur l\'écran de consentement.',
      },
      {
        problem: '"redirect_uri_mismatch"',
        solution:
          'Mauvais type de client OAuth. Supprimez le client depuis la page Credentials et recréez-le en "Desktop app" (étape 7). "Web application" ne fonctionnera jamais pour ce flux.',
      },
      {
        problem: '"This app isn\'t verified" warning',
        solution:
          'Comportement attendu (application en mode test + portée sensible). Cliquez sur "Advanced" → "Go to <app> (unsafe)" pour continuer. L\'application est en mode test et ne laisse entrer que les testeurs — c\'est sûr.',
      },
      {
        problem: 'Connection broke after 7 days',
        solution:
          'Les jetons de rafraîchissement OAuth expirent tous les 7 jours en mode test. Paramètres → Intégrations → Search Console → "Déconnecter" → "Connecter" pour vous réauthentifier. Pour supprimer cette expiration, il faut faire passer l\'application par le processus de validation de Google (1-4 semaines).',
      },
    ],
    notes: [
      'Les propriétés que vous possédez (sc-domain:example.com ou https://example.com/) incluent tous les sites validés par votre compte.',
      "Les données GSC ont ~2 jours de retard — les clics d'aujourd'hui n'apparaissent pas immédiatement.",
      "Quota gratuit : 1200 requêtes/min, 25 000 requêtes/jour — vous ne l'atteindrez jamais en usage normal.",
    ],
    lastReviewed: '2026-06-01',
  },
  ga4: {
    intro:
      'Récupérez les métriques GA4 par URL (sessions, utilisateurs, taux de rebond, taux d\'engagement, conversions). "Apportez votre propre client" — utilise votre propre client OAuth GCP.',
    prereqs: [
      "Compte Google avec au moins l'accès Lecteur sur la propriété GA4 à connecter.",
      'Vous pouvez RÉUTILISER le client OAuth configuré pour GSC — activez simplement les bonnes API.',
    ],
    steps: [
      {
        title: 'Si vous avez déjà configuré GSC : RÉUTILISEZ ce client OAuth',
        detail:
          'Si Search Console est déjà configuré, vous pouvez utiliser le même projet Google Cloud et les mêmes OAuth Client ID + Secret. Inutile de recréer — activez simplement les API ci-dessous et collez les identifiants ici.',
      },
      {
        title: 'Activez les DEUX API GA4',
        detail:
          'GA4 a besoin de deux API distinctes :\n\n1. Google Analytics Admin API (pour lister les propriétés)\n2. Google Analytics Data API (pour les rapports proprement dits)\n\nSi vous n\'activez pas les deux, vous verrez des erreurs "API not enabled".',
        link: {
          label: 'Admin API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com',
        },
      },
      {
        title: 'Activez aussi la Data API',
        link: {
          label: 'Data API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
        },
      },
      {
        title: 'Collez les mêmes Client ID + Secret que pour GSC',
        detail:
          "Si GSC est déjà connecté, vous n'aurez peut-être même pas à coller — les cartes peuvent partager les identifiants. Si vous configurez GA4 de zéro, copiez l'ID/Secret de votre client GSC dans ce panneau.",
      },
      {
        title: '"Connecter" → connectez-vous avec Google + approuvez la portée GA4',
        detail:
          'Connectez-vous avec le compte Google ajouté comme testeur. Sur l\'écran de consentement, vérifiez que l\'autorisation "Google Analytics: View Google Analytics property data" est cochée.',
      },
      {
        title: "Listez les propriétés + récupérez dans l'onglet GA4",
        detail:
          'Passez à l\'onglet supérieur "GA4" → "List Properties" affiche toutes les propriétés GA4 visibles par votre compte → choisissez-en une → choisissez une fenêtre (7/28/90 jours) → "Fetch". GA4 est quasi temps réel, les résultats apparaissent immédiatement.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Google Analytics Admin API has not been used in project X"',
        solution:
          "Admin API non activée. Ouvrez le lien de l'étape 2 → Enable. Attendez 30 s, réessayez. Vous aurez ensuite la même erreur pour la Data API — ouvrez le lien de l'étape 3 et activez-la aussi.",
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'La portée OAuth ne couvre pas GA4. Allez sur myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → cliquez à nouveau sur Connecter → cochez la case d\'autorisation Google Analytics.',
      },
      {
        problem: 'Property list comes back empty',
        solution:
          "Le compte Google connecté n'a aucun rôle sur les propriétés GA4. Tableau de bord GA4 → Admin → Property Access Management → vérifiez que votre e-mail a au moins Lecteur.",
      },
    ],
    notes: [
      "Les données GA4 sont quasi temps réel — celles d'aujourd'hui apparaissent sous 4-24 heures.",
      'Quota gratuit : 200K requêtes/jour, 50 requêtes/min par propriété.',
    ],
    lastReviewed: '2026-06-01',
  },
  sheets: {
    intro:
      'Exportez les résultats d\'exploration directement dans une feuille Google Sheets. Mieux que "télécharger le CSV → ouvrir dans Excel" quand vous collaborez avec des collègues sur un document partagé en direct.',
    prereqs: ['Compte Google.', 'Vous pouvez RÉUTILISER le client OAuth configuré pour GSC.'],
    steps: [
      {
        title: 'Si vous avez configuré GSC/GA4 : RÉUTILISEZ ce client OAuth',
        detail:
          'Collez les mêmes OAuth Client ID + Secret (ou ils sont peut-être déjà enregistrés).',
      },
      {
        title: 'Activez la Google Sheets API',
        link: {
          label: 'Sheets API → Enable',
          url: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
        },
      },
      {
        title: 'Activez aussi la Google Drive API',
        detail:
          'La Sheets API exige aussi une portée Drive pour créer/lire des feuilles de calcul.',
        link: {
          label: 'Drive API → Enable',
          url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
        },
      },
      {
        title: 'Collez Client ID + Secret + Enregistrer',
      },
      {
        title: '"Connecter" → approuvez Sheets + Drive sur l\'écran de consentement',
        detail:
          'Le flux OAuth affiche deux autorisations :\n• See, edit, create, and delete all your Google Sheets spreadsheets\n• See, edit, create, and delete only the specific Google Drive files used with this app\nCochez les deux.',
      },
      {
        title: 'Testez depuis le menu Exporter',
        detail:
          'Fichier → Exporter → "Exporter vers Google Sheets". Une nouvelle feuille est créée automatiquement, l\'URL copiée dans le presse-papiers.',
      },
    ],
    troubleshooting: [
      {
        problem: '"insufficient authentication scopes"',
        solution:
          "Vous n'avez pas coché la case d'autorisation Drive lors de la connexion. Déconnectez + reconnectez, cochez les deux autorisations.",
      },
    ],
    notes: [
      'Limite stricte de Sheets : 10M de cellules par feuille de calcul — les grosses explorations (>500K URL) sont découpées.',
      'La portée Drive est "drive.file" — seuls les fichiers créés par FreeCrawl sont accessibles, pas vos fichiers existants.',
    ],
    lastReviewed: '2026-06-01',
  },
  bigquery: {
    intro:
      "Envoyez les données d'exploration directement dans un jeu de données BigQuery. Utile pour accumuler des instantanés datés dans votre entrepôt de données et visualiser les tendances d'exploration avec un outil BI (Looker Studio, Tableau, Metabase).",
    prereqs: [
      'Projet Google Cloud avec la BigQuery API activée.',
      'Jeu de données BigQuery déjà créé.',
      'JSON de compte de service (PAS OAuth — authentification serveur à serveur).',
      'Projet GCP avec facturation activée (niveau gratuit BigQuery : 10 Go de stockage/mois + 1 To de requêtes/mois ; facturé au-delà).',
    ],
    steps: [
      {
        title: 'Créez un jeu de données BigQuery',
        detail:
          'Console BigQuery → choisissez votre projet → "Create dataset" → ID : "freecrawl_seo" (ou n\'importe quel nom) → Location : "EU" ou "US" (important — impossible à changer ensuite) → Create dataset.',
        link: {
          label: 'Console BigQuery',
          url: 'https://console.cloud.google.com/bigquery',
        },
      },
      {
        title: 'Créez un compte de service',
        detail:
          'IAM & Admin → Service Accounts → "+ Create service account" → nom : "freecrawl-bigquery" → Create and continue.',
        link: {
          label: 'Service Accounts',
          url: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
        },
      },
      {
        title: 'Ajoutez des rôles',
        detail:
          'À l\'étape 2 "Grant this service account access to project" → ajoutez deux rôles :\n• BigQuery Data Editor\n• BigQuery Job User\nPuis "Continue" → "Done".',
      },
      {
        title: 'Téléchargez la clé JSON',
        detail:
          'Dans la liste des comptes de service, cliquez sur celui que vous venez de créer → onglet "Keys" → "Add key" → "Create new key" → Type : JSON → Create.\n\nLe JSON se télécharge automatiquement. Ouvrez-le dans un éditeur de texte et copiez tout le contenu.\n\nATTENTION : ce JSON contient l\'intégralité des identifiants — traitez-le comme un mot de passe. Ne le versionnez jamais dans un dépôt.',
      },
      {
        title: 'Collez-le dans le champ "Service Account JSON" de ce panneau',
        detail:
          "Collez le JSON complet (de l'accolade ouvrante `{` à l'accolade fermante `}`). FreeCrawl stocke le JSON chiffré dans le coffre d'identifiants du système.",
      },
      {
        title: 'Renseignez "GCP Project ID"',
        detail:
          'L\'ID de votre projet GCP (visible dans le menu déroulant en haut à gauche de Cloud Console, p. ex. "my-gcp-project-12345"). Le JSON contient aussi un champ "project_id" — vous pouvez le copier de là.',
      },
      {
        title: 'Saisissez le nom du jeu de données + Enregistrer',
        detail: 'Le nom du jeu de données créé à l\'étape 1 (p. ex. "freecrawl_seo").',
      },
      {
        title: 'Testez depuis le menu Exporter',
        detail:
          'Fichier → Exporter → "Exporter vers BigQuery" → choisissez un nom/format de table → lancez. Vérifiez que la table est apparue dans la console BigQuery.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 PermissionDenied: caller does not have permission"',
        solution:
          'Il manque des rôles IAM au compte de service. IAM & Admin → IAM → trouvez l\'e-mail de votre compte de service → vérifiez que "BigQuery Data Editor" et "BigQuery Job User" sont tous deux attribués.',
      },
      {
        problem: '"Dataset X not found"',
        solution:
          'Mauvais nom de jeu de données OU incohérence d\'emplacement (multirégion "EU" vs région "europe-west1"). Copiez le nom exact du jeu de données depuis la console BigQuery.',
      },
      {
        problem: '"Invalid JSON"',
        solution:
          "Vous n'avez collé qu'une partie du JSON ou il y a un caractère parasite aux extrémités. Ouvrez le fichier JSON du compte de service avec un vrai éditeur (VS Code recommandé, PAS le Bloc-notes), Ctrl+A pour tout sélectionner, copiez, videz le champ FreeCrawl, collez.",
      },
    ],
    notes: [
      "Coût : le niveau gratuit BigQuery (10 Go de stockage + 1 To de requêtes/mois) couvre un usage normal. Une exploration d'1M d'URL fait ~500 Mo ; le coût des requêtes dépend de votre SQL.",
      "Évolution du schéma : FreeCrawl crée/met à jour la table d'export automatiquement. Si le schéma CrawlUrlRow gagne de nouvelles colonnes, la table d'export les récupère (souplesse DDL de BigQuery).",
    ],
    lastReviewed: '2026-06-01',
  },
};
