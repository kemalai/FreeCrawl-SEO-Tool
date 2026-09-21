/**
 * English integration setup guides. Generated from the guide source —
 * see `./index.ts` for how a locale is picked. Keep the step count,
 * links and `lastReviewed` in lockstep with `en.ts`; the parity test
 * in `tests/` compares them.
 */
import type { Guide } from './types.js';

export const GUIDES_EN: Record<string, Guide> = {
  openai: {
    intro:
      "Run a custom prompt per URL through OpenAI's API — content analysis, title ideas, summaries. Usage is billed to your own OpenAI account; FreeCrawl is a free middleware, API calls hit your wallet.",
    prereqs: [
      'OpenAI account (sign up free at https://platform.openai.com).',
      'Valid payment method — OpenAI requires a $5 minimum balance before keys work.',
    ],
    steps: [
      {
        title: 'Sign in at platform.openai.com',
        detail: 'Use your OpenAI account. If you don\'t have one yet, "Sign up".',
        link: {
          label: 'platform.openai.com',
          url: 'https://platform.openai.com',
        },
      },
      {
        title: 'Click "API keys" in the left sidebar',
        detail: 'Key-icon menu item on the left. You can also go straight to the URL.',
        link: {
          label: 'API keys page',
          url: 'https://platform.openai.com/api-keys',
        },
      },
      {
        title: 'Click "+ Create new secret key" (top right)',
        detail:
          'In the dialog:\n• Name: "FreeCrawl SEO Tool" (any reminder label)\n• Project: Default project or your choice\n• Permissions: All (easiest; restricted scopes also work)\nthen "Create secret key".',
      },
      {
        title: 'COPY the key — it is never shown again',
        detail:
          "Key starts with `sk-...`. If you don't copy it now you will lose it forever (you'd have to make a new one). Save it in a password manager — don't leave it in a browser tab.",
      },
      {
        title: 'Paste it into this panel\'s "API Key" field + click Save',
        detail:
          'FreeCrawl stores the key encrypted in the OS credential store (Windows DPAPI, macOS Keychain, Linux Secret Service). Never written as plaintext.',
      },
      {
        title: 'Test in the AI tab',
        detail:
          'Close Settings → switch to the top "AI" tab → pick a few URLs from a crawl → click "Run AI". First call takes ~2-3 s.',
      },
    ],
    troubleshooting: [
      {
        problem: '"You exceeded your current quota"',
        solution:
          'Your OpenAI account has no balance. Go to platform.openai.com → Billing → "Add payment method" → add a card and load $5+. New accounts don\'t get auto-credit; you have to top up.',
      },
      {
        problem: '"Incorrect API key provided" / 401',
        solution:
          'The key probably has a stray space at the start or end. Generate a new one, copy carefully. Revoke the old one.',
      },
      {
        problem: '"Rate limit exceeded"',
        solution:
          'Too many parallel requests. Lower concurrency in Settings → AI (default: 3). Tier 1 accounts run at 500-3500 RPM depending on model.',
      },
    ],
    notes: [
      'Pricing (2026-06): gpt-4o-mini ~$0.15/1M input tokens, gpt-4o ~$2.50/1M input. 1000 URLs with typical prompt + response: ~$0.50-2.',
      "Set a monthly hard limit on the Usage limits page — you don't want a runaway 1M URL crawl producing a $1000 bill.",
    ],
    lastReviewed: '2026-06-01',
  },
  anthropic: {
    intro:
      'Run prompts against Claude via Anthropic\'s API. Claude\'s top-tier models (Sonnet 4.6, Opus 4.8) give less "AI-flavoured" SEO output than competitors. Billed to your own Anthropic account.',
    prereqs: [
      'Anthropic account (https://console.anthropic.com).',
      'Payment method on file (new users get $5 promo credit).',
    ],
    steps: [
      {
        title: 'Sign in at console.anthropic.com',
        link: {
          label: 'console.anthropic.com',
          url: 'https://console.anthropic.com',
        },
      },
      {
        title: 'Open the "API Keys" page from the top-right dropdown',
        detail: 'Under Settings menu, "API Keys" entry.',
        link: {
          label: 'API Keys page',
          url: 'https://console.anthropic.com/settings/keys',
        },
      },
      {
        title: 'Click "+ Create Key"',
        detail:
          'In the dialog:\n• Name: "FreeCrawl SEO Tool"\n• Workspace: Default workspace\n• Environment: Production\nthen "Create Key".',
      },
      {
        title: 'COPY the key — it is never shown again',
        detail: 'Key starts with `sk-ant-...`. Lose it and you make a new one.',
      },
      {
        title: 'Paste it into the "API Key" field + Save',
      },
      {
        title: 'Optional: pick a model',
        detail:
          'In Settings → AI, the "Model" field accepts a model id (default: claude-sonnet-4-6). Speed-priority: claude-haiku-4-5 (~10x cheaper, 3x faster). Quality-priority: claude-opus-4-8.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Your credit balance is too low"',
        solution: 'console.anthropic.com → Settings → Billing → "Add credits" — minimum $5.',
      },
      {
        problem: '"Number of request tokens has exceeded your rate limit"',
        solution:
          'Tier 1 accounts ~50 RPM. Drop concurrency to 2-3 in Settings → AI. For higher tiers you need to spend $25+ (Tier 2: 1000 RPM).',
      },
      {
        problem: '"Invalid API key"',
        solution:
          'Make sure the "sk-ant-" prefix is intact and there are no stray spaces. Check the API Keys page — if the key shows as active there, the key itself is fine.',
      },
    ],
    notes: [
      'Pricing (2026-06): Haiku 4.5 ~$0.25/$1.25 (in/out per 1M tokens), Sonnet 4.6 ~$3/$15, Opus 4.8 ~$15/$75.',
      "Anthropic supports prompt caching — repeated long system prompts within 5 min are 90% discounted (FreeCrawl AI panel doesn't use caching yet — coming in a later release).",
    ],
    lastReviewed: '2026-06-01',
  },
  ollama: {
    intro:
      "Ollama is an open-source runtime for locally-hosted LLMs. NO API key, free forever, doesn't even need internet. Cost zero; only downside is VRAM/RAM for larger models.",
    prereqs: [
      'macOS 12+, Windows 10+, or Linux (Ubuntu 22.04+ recommended).',
      'At least 8 GB RAM (smaller models). Llama 3.2 3B needs ~2 GB VRAM/RAM.',
      'GPU recommended but not required — CPU works (slower).',
    ],
    steps: [
      {
        title: 'Download + install Ollama',
        detail:
          'Pick your OS installer:\n• Windows: OllamaSetup.exe\n• macOS: Ollama.dmg\n• Linux: curl -fsSL https://ollama.com/install.sh | sh\n\nAfter install Ollama runs in the background (system tray icon).',
        link: {
          label: 'ollama.com/download',
          url: 'https://ollama.com/download',
        },
      },
      {
        title: 'Pull a model',
        detail:
          'Open a terminal and run:\n\n  ollama pull llama3.2\n\nllama3.2 (3B params) is ~2GB, fast, low resource. Larger options:\n  ollama pull llama3.3:70b   (~40GB, beefy GPU only)\n  ollama pull qwen2.5:7b     (~4GB, balanced)\n  ollama pull mistral:7b     (~4GB, alternative)',
      },
      {
        title: 'Smoke-test the model',
        detail:
          'In terminal:\n  ollama run llama3.2\n\nAn interactive chat opens. Type "hello" — if you get a reply, you\'re good. Ctrl+D to exit.',
      },
      {
        title: 'Enter the Ollama endpoint in this panel',
        detail:
          'Default: http://localhost:11434 (already pre-filled). Override if Ollama runs on a different port.',
      },
      {
        title: 'Enter the model name you pulled',
        detail:
          'E.g. "llama3.2" or "qwen2.5:7b". Leave blank to let FreeCrawl pick the first available model.',
      },
      {
        title: 'Save + test',
        detail: 'Run a small batch in the AI tab. CPU-only: ~5-15 s/URL. GPU: ~1-3 s.',
      },
    ],
    troubleshooting: [
      {
        problem: 'AI tab says "Connection refused"',
        solution:
          'Ollama is not running. In terminal run "ollama serve" or launch the Ollama app from the system tray / Start menu.',
      },
      {
        problem: '"model \'X\' not found"',
        solution:
          'Model not pulled. Run "ollama pull <model-name>". Use "ollama list" to see what\'s already on disk.',
      },
      {
        problem: 'Replies are very slow (>30 s/URL)',
        solution:
          "Model doesn't fit in VRAM and swaps to CPU. Try a smaller model (llama3.2:1b or phi3:mini). VRAM needs: 3B ~2GB, 7B ~4GB, 13B ~8GB.",
      },
    ],
    notes: [
      'Fully offline — crawl + AI analysis keeps running even without internet.',
      'Local SEO analysis quality: 3B models a bit weak, 7-13B decent, 70B GPT-4 level (but heavy hardware).',
      'In Settings → AI keep concurrency 1-2 — local models serialise parallel requests.',
    ],
    lastReviewed: '2026-06-01',
  },
  pagespeed: {
    intro:
      'Google PageSpeed Insights audits each URL with Lighthouse and returns Performance/SEO/Accessibility/Best-Practices scores + Core Web Vitals (LCP/CLS/INP). A free API key gives you 25,000 audits/day.',
    prereqs: [
      'Google account.',
      'Google Cloud Console project (you can create one in the steps below).',
    ],
    steps: [
      {
        title: 'Open Google Cloud Console',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Pick or create a project',
        detail:
          'Top-left project dropdown → "New Project" → name: "FreeCrawl SEO" → Create. NO billing account required — PSI free tier only needs credentials for authentication.',
      },
      {
        title: 'Enable the PageSpeed Insights API',
        detail: "This deep link goes straight to the API's enable page:",
        link: {
          label: 'PageSpeed Insights API → Enable',
          url: 'https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com',
        },
      },
      {
        title: 'Click the blue "Enable" button → wait 30 s',
      },
      {
        title: 'Go to Credentials',
        link: {
          label: 'Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'Click "+ Create Credentials" → "API key"',
        detail: 'An API key is generated (starts with `AIzaSy...`). Copy it immediately.',
      },
      {
        title: 'Optional: restrict the API key (recommended)',
        detail:
          'Click "Edit API key" → "Restrict key":\n• API restrictions: "Restrict key" → "PageSpeed Insights API"\n• Application restrictions: "None" (FreeCrawl is a desktop app, so referrer/IP filtering won\'t work)\nUnrestricted keys also work, but we recommend you restrict.',
      },
      {
        title: 'Paste the key into this panel\'s "API Key" field + Save',
      },
      {
        title: 'Test in the PageSpeed tab',
        detail: 'Top tab "PageSpeed" → pick a few URLs → "Run audit". First audit ~10-15 s.',
      },
    ],
    troubleshooting: [
      {
        problem: '"This API method requires billing to be enabled"',
        solution:
          'You enabled the wrong API (e.g. an older "Cloud PageSpeed Insights API"). The correct one is "PageSpeed Insights API" (pagespeedonline.googleapis.com). Re-open the link in step 3.',
      },
      {
        problem: '"API key not valid"',
        solution:
          'Key restrictions are wrong. Cloud Console → Credentials → click the key → make sure "PageSpeed Insights API" is in the allowed APIs. Or temporarily remove restrictions to verify.',
      },
      {
        problem: '"Quota exceeded" — before hitting 25,000',
        solution:
          "There's also a per-minute limit: 240 queries/min. In Settings → PageSpeed keep concurrency 2-3. The daily 25K cap is sky-high — you won't see it in normal use.",
      },
    ],
    notes: [
      "Cost: FREE — one of the few Google APIs that doesn't require billing. Keyless/anonymous mode is now 0 queries/day (closed in early 2026), so a key is mandatory.",
      'Speed: each URL ~5-10 s (Google is actually running a Lighthouse instance). 1000 URLs ~2 hours.',
      'Mobile + Desktop count as separate API calls — picking "both" doubles quota usage.',
    ],
    lastReviewed: '2026-06-01',
  },
  ahrefs: {
    intro:
      "Pull backlink count, domain rating, referring domains, organic keyword counts per URL via Ahrefs' API. This is Ahrefs' most expensive integration — API access is gated behind $500+/month plans.",
    prereqs: [
      'Ahrefs Standard ($249/mo) or higher subscription.',
      'Add-on "API" tier (extra $500/mo on top of the base plan, or a different tier).',
    ],
    steps: [
      {
        title: 'Sign in to Ahrefs → API page',
        link: {
          label: 'ahrefs.com/api',
          url: 'https://ahrefs.com/api',
        },
      },
      {
        title: "Pick a subscription (if you don't already have API access)",
        detail:
          'API v3 access ships with Enterprise tier and dedicated API plans. Contact sales for a quote.',
      },
      {
        title: 'Generate an API token in your account',
        detail:
          'Ahrefs dashboard → Account settings → API → Generate token. Token format: `sk-...` or similar.',
      },
      {
        title: 'Paste it into the "API Key" field + Save',
      },
      {
        title: 'Test in the SEO Authority tab',
        detail: 'Top tab "SEO Authority" → provider: "Ahrefs" → pick a few URLs → "Run".',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient credits"',
        solution:
          'API row units used up. Ahrefs dashboard → API → "Usage" tab. Upgrade plan or wait for the next billing cycle.',
      },
      {
        problem: '"Unauthorized"',
        solution:
          'Your subscription doesn\'t include API access. "Ahrefs Standard" alone doesn\'t give you API rights — you need an explicit API tier on top.',
      },
    ],
    notes: [
      'Cost: roughly 1-5 API rows per URL audit. Standard API plan ~25K rows/month.',
      'Cheaper alternatives: Moz ($99/mo, Domain Authority) or Majestic.',
    ],
    lastReviewed: '2026-06-01',
  },
  majestic: {
    intro:
      "Pull Trust Flow, Citation Flow, and backlink counts via Majestic's API. The most cost-effective backlink-focused provider.",
    prereqs: [
      'Majestic Lite ($49.99/mo) or higher subscription.',
      'API access — included with Lite.',
    ],
    steps: [
      {
        title: 'Open the Majestic developer dashboard',
        link: {
          label: 'majestic.com/account/api',
          url: 'https://majestic.com/account/api',
        },
      },
      {
        title: 'Generate an API key',
        detail: 'Dashboard → "Open API" tab → "Generate new key" → copy.',
      },
      {
        title: 'Paste it into this panel + Save',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient resources" / "No analysis units"',
        solution:
          'Monthly analysis unit quota used up. Lite plan: 1000 units/mo; Pro: 20K+. Check Majestic dashboard → API → usage.',
      },
    ],
    notes: ['Cost: 1 URL backlink lookup = 5 units. Lite plan (1000 units) ~200 URLs/mo.'],
    lastReviewed: '2026-06-01',
  },
  moz: {
    intro:
      'Pull Domain Authority (DA), Page Authority (PA), and Spam Score via Moz API. The most popular choice for lower budgets.',
    prereqs: ['Moz Pro Standard ($99/mo) or higher subscription with "Moz API" add-on enabled.'],
    steps: [
      {
        title: 'Open the Moz API page',
        link: {
          label: 'moz.com/api',
          url: 'https://moz.com/api',
        },
      },
      {
        title: 'Account → API → "Generate Credentials"',
        detail: 'Two values are produced: "Access ID" and "Secret Key". Copy both.',
      },
      {
        title: 'Paste each into this panel\'s "Access ID" + "Secret Key" fields + Save',
        detail: 'Two separate fields — fill them in order.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Authentication failed"',
        solution:
          'Access ID or Secret Key was copy-pasted wrong. Re-copy from Moz dashboard — Access ID is short (~13 chars), Secret Key is long (~40 chars).',
      },
    ],
    notes: ['Cost: Standard plan (1500 rows/mo), Medium (10K rows/mo), Large (100K rows/mo).'],
    lastReviewed: '2026-06-01',
  },
  semrush: {
    intro:
      'Pull organic keywords, traffic estimates, and SERP features via Semrush API. The most comprehensive keyword + traffic data.',
    prereqs: [
      'Semrush Pro ($129/mo) or higher subscription.',
      '"API units" attached to the account (Guru tier and above include API access).',
    ],
    steps: [
      {
        title: 'Sign in to Semrush → Subscription info → API',
        link: {
          label: 'Semrush API access',
          url: 'https://www.semrush.com/accounts/subscription-info/api-units/',
        },
      },
      {
        title: 'Copy the API key',
      },
      {
        title: 'Paste it into this panel + Save',
      },
    ],
    troubleshooting: [
      {
        problem: '"API units exhausted"',
        solution:
          'Monthly unit quota used up. Guru plan: 7K units/mo, Business: 25K+. Check Semrush dashboard → API → usage.',
      },
    ],
    notes: ['Cost: 1 URL backlinks query = 10 units; 1 domain overview = 1 unit.'],
    lastReviewed: '2026-06-01',
  },
  gsc: {
    intro:
      'Pull per-URL Search Console metrics (clicks, impressions, CTR, average position) via the Google Search Console API. URL Inspection API also gives you coverage verdict + last-crawl time. "Bring your own client" model — you create your own Google Cloud OAuth client and paste it; FreeCrawl does not use a shared middleman app.',
    prereqs: [
      'Google account (must own / co-own the GSC property you want to connect).',
      'At least one Google Search Console property added + verified.',
    ],
    steps: [
      {
        title: 'Open Google Cloud Console and create a new project',
        detail:
          'Top-left project dropdown → "New Project" → name: "FreeCrawl SEO Integrations" (anything you like) → Create. This project is only for OAuth credentials — billing not required.',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Open Google Auth Platform → Branding',
        detail:
          'Left menu "APIs & Services" → "OAuth consent screen" (new UI: "Google Auth Platform → Branding"). User Type: "External" → Create.',
        link: {
          label: 'OAuth consent screen',
          url: 'https://console.cloud.google.com/auth/branding',
        },
      },
      {
        title: 'Fill in the OAuth consent screen',
        detail:
          'Only the required fields:\n• App name: "FreeCrawl Local"\n• User support email: your email\n• Developer contact information: your email\nLeave the rest blank. Save and Continue → Save and Continue → Save and Continue → Back to Dashboard.',
      },
      {
        title: 'CRITICAL: Add yourself as a Test User',
        detail:
          'Left menu → "Audience" (old UI "Test users") → "Add users" → paste the Gmail you\'ll connect → Save.\n\nWARNING: DO NOT SKIP THIS STEP. Skipping it produces a 403 access_denied during OAuth — apps in "Testing" status only allow accounts on the test users list to connect.',
        link: {
          label: 'Audience page',
          url: 'https://console.cloud.google.com/auth/audience',
        },
      },
      {
        title: 'Enable the Google Search Console API',
        detail: 'This link goes directly to the enable page → click blue "Enable" → wait 30 s.',
        link: {
          label: 'Search Console API → Enable',
          url: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com',
        },
      },
      {
        title: 'Create an OAuth Client ID',
        detail:
          'Left menu → "Credentials" (new UI "Google Auth Platform → Clients") → "+ Create credentials" → "OAuth client ID".',
        link: {
          label: 'Credentials page',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'Pick "Desktop app" as the OAuth Client type (NOT Web app!)',
        detail:
          'Application type dropdown → "Desktop app". Name: "FreeCrawl SEO Tool". Create → the dialog shows Client ID + Client Secret. Copy both immediately (Secret is not shown again).\n\nWHY DESKTOP: FreeCrawl uses a random local port (e.g. 127.0.0.1:63092) per connection. "Web application" needs a fixed redirect URI list — that random port can\'t match → fail. "Desktop app" automatically accepts loopback redirects, port-agnostic.',
      },
      {
        title: 'Paste Client ID + Client Secret into this panel + Save',
        detail:
          'Two fields: "OAuth Client ID" (...apps.googleusercontent.com) and "OAuth Client Secret" (GOCSPX-...). Save.',
      },
      {
        title: 'Click "Connect" — your browser opens',
        detail:
          'After Save the card shows a "Connect" button. Click it → Google\'s consent screen opens in your default browser.',
      },
      {
        title: 'Sign in with the Google account you added as a test user',
        detail:
          'In the account picker pick the email you added to test users. "Continue" → "Google hasn\'t verified this app" warning (expected for testing mode). "Advanced" → "Go to FreeCrawl Local (unsafe)" → accept the permissions → Allow.',
      },
      {
        title: 'Back to FreeCrawl — you should see "Configured"',
        detail:
          'The Search Console card in Settings now shows a green "Configured" badge. You can now switch to the top "Search Console" tab to list properties + fetch data.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 access_denied"',
        solution:
          "You didn't add a test user, or you're signing in with the wrong Google account. Go back to the Audience page and check that the account you're using is on the test users list. If you have several Google accounts, see which one the account picker is using.",
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'Either the Search Console API was not enabled OR the OAuth consent screen had the "View Search Console data for your verified sites" permission checkbox unchecked. (1) Enable the Search Console API (step 5), (2) myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → click Connect again and tick every permission on the consent screen.',
      },
      {
        problem: '"redirect_uri_mismatch"',
        solution:
          'Wrong OAuth client type. Delete the client from the Credentials page and recreate it as "Desktop app" (step 7). "Web application" will never work for this flow.',
      },
      {
        problem: '"This app isn\'t verified" warning',
        solution:
          'Expected behaviour (testing-mode app + sensitive scope). Click "Advanced" → "Go to <app> (unsafe)" to proceed. The app is in testing mode and only lets test users in — it\'s safe.',
      },
      {
        problem: 'Connection broke after 7 days',
        solution:
          'OAuth refresh tokens expire every 7 days in testing mode. Settings → Integrations → Search Console → "Disconnect" → "Connect" to re-auth. To get rid of the expiry you need to push the app through Google\'s verification process (1-4 weeks).',
      },
    ],
    notes: [
      'Properties you own (sc-domain:example.com or https://example.com/) include every site your account has verified.',
      "GSC data lags ~2 days — today's clicks don't show up immediately.",
      "Free quota: 1200 queries/min, 25,000 queries/day — you'll never hit it in normal use.",
    ],
    lastReviewed: '2026-06-01',
  },
  ga4: {
    intro:
      'Pull per-URL GA4 metrics (sessions, users, bounce rate, engagement rate, conversions). "Bring your own client" — uses your own GCP OAuth client.',
    prereqs: [
      "Google account with at least Viewer access on the GA4 property you'll connect.",
      'You can REUSE the same OAuth client you set up for GSC — just enable the right APIs.',
    ],
    steps: [
      {
        title: 'If you already set up GSC: REUSE that OAuth client',
        detail:
          'If Search Console is already configured, you can use the same Google Cloud project and the same OAuth Client ID + Secret. No need to recreate — just enable the APIs below and paste the credentials here.',
      },
      {
        title: 'Enable BOTH GA4 APIs',
        detail:
          'GA4 needs two distinct APIs:\n\n1. Google Analytics Admin API (for property listing)\n2. Google Analytics Data API (for the actual reports)\n\nIf you don\'t enable both you\'ll see "API not enabled" errors.',
        link: {
          label: 'Admin API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com',
        },
      },
      {
        title: 'Enable the Data API too',
        link: {
          label: 'Data API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
        },
      },
      {
        title: 'Paste the same Client ID + Secret you used for GSC',
        detail:
          "If GSC is already connected, you might not even need to paste — the cards may share credentials. If you're setting GA4 up from scratch, copy the ID/Secret from your GSC client into this panel.",
      },
      {
        title: '"Connect" → sign in with Google + approve the GA4 scope',
        detail:
          'Sign in with the Google account you added as a test user. On the consent screen confirm the "Google Analytics: View Google Analytics property data" permission is checked.',
      },
      {
        title: 'List properties + fetch in the GA4 tab',
        detail:
          'Switch to the "GA4" top tab → "List Properties" shows every GA4 property your account can see → pick one → choose a window (7/28/90 days) → "Fetch". GA4 is near-realtime, results show up immediately.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Google Analytics Admin API has not been used in project X"',
        solution:
          "Admin API not enabled. Open the link in step 2 → Enable. Wait 30 s, retry. You'll get the same error for the Data API next — open the step 3 link and enable that too.",
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'OAuth scope doesn\'t cover GA4. Go to myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → click Connect again → tick the Google Analytics permission checkbox.',
      },
      {
        problem: 'Property list comes back empty',
        solution:
          'The Google account you connected has no role on any GA4 properties. GA4 dashboard → Admin → Property Access Management → confirm your email has at least Viewer.',
      },
    ],
    notes: [
      "GA4 data is near-realtime — today's data shows up within 4-24 hours.",
      'Free quota: 200K requests/day, 50 requests/min per property.',
    ],
    lastReviewed: '2026-06-01',
  },
  sheets: {
    intro:
      'Export crawl results straight to a Google Sheet. Better than "download CSV → open in Excel" when you\'re collaborating with teammates on a shared live document.',
    prereqs: ['Google account.', 'You can REUSE the same OAuth client you set up for GSC.'],
    steps: [
      {
        title: 'If you set up GSC/GA4: REUSE that OAuth client',
        detail: 'Paste the same OAuth Client ID + Secret (or it may already be persisted).',
      },
      {
        title: 'Enable the Google Sheets API',
        link: {
          label: 'Sheets API → Enable',
          url: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
        },
      },
      {
        title: 'Enable the Google Drive API too',
        detail: 'The Sheets API also requires a Drive scope to create/read spreadsheets.',
        link: {
          label: 'Drive API → Enable',
          url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
        },
      },
      {
        title: 'Paste Client ID + Secret + Save',
      },
      {
        title: '"Connect" → approve Sheets + Drive on the consent screen',
        detail:
          'OAuth flow shows two permissions:\n• See, edit, create, and delete all your Google Sheets spreadsheets\n• See, edit, create, and delete only the specific Google Drive files used with this app\nTick both.',
      },
      {
        title: 'Test from the Export menu',
        detail:
          'File → Export → "Export to Google Sheets". A new Sheet is auto-created, URL copied to clipboard.',
      },
    ],
    troubleshooting: [
      {
        problem: '"insufficient authentication scopes"',
        solution:
          "You didn't tick the Drive permission checkbox during Connect. Disconnect + Reconnect, tick both permissions.",
      },
    ],
    notes: [
      'Sheets hard limit: 10M cells per spreadsheet — large crawls (>500K URLs) get split.',
      'Drive scope is "drive.file" — only files FreeCrawl creates are accessible, not your existing files.',
    ],
    lastReviewed: '2026-06-01',
  },
  bigquery: {
    intro:
      'Stream crawl data directly into a BigQuery dataset. Useful for accumulating date-stamped snapshots in your data warehouse and visualising crawl trends with a BI tool (Looker Studio, Tableau, Metabase).',
    prereqs: [
      'Google Cloud project with the BigQuery API enabled.',
      'BigQuery dataset already created.',
      'Service Account JSON (NOT OAuth — server-to-server auth).',
      'Billing-enabled GCP project (BigQuery free tier: 10GB storage/mo + 1TB query/mo; charges apply beyond).',
    ],
    steps: [
      {
        title: 'Create a BigQuery dataset',
        detail:
          'BigQuery Console → pick your project → "Create dataset" → ID: "freecrawl_seo" (or any name) → Location: "EU" or "US" (important — can\'t change later) → Create dataset.',
        link: {
          label: 'BigQuery Console',
          url: 'https://console.cloud.google.com/bigquery',
        },
      },
      {
        title: 'Create a Service Account',
        detail:
          'IAM & Admin → Service Accounts → "+ Create service account" → name: "freecrawl-bigquery" → Create and continue.',
        link: {
          label: 'Service Accounts',
          url: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
        },
      },
      {
        title: 'Add roles',
        detail:
          'In step 2 "Grant this service account access to project" → add two roles:\n• BigQuery Data Editor\n• BigQuery Job User\nThen "Continue" → "Done".',
      },
      {
        title: 'Download the JSON key',
        detail:
          'In the service account list click the one you just created → "Keys" tab → "Add key" → "Create new key" → Type: JSON → Create.\n\nThe JSON downloads automatically. Open it in a text editor and copy the entire content.\n\nWARNING: This JSON contains all the credential — treat it like a password. Never check it into source control.',
      },
      {
        title: 'Paste it into this panel\'s "Service Account JSON" field',
        detail:
          'Paste the full JSON (from the opening `{` to closing `}`). FreeCrawl stores the JSON encrypted in the OS credential store.',
      },
      {
        title: 'Fill in "GCP Project ID"',
        detail:
          'Your GCP project ID (shows in the Cloud Console top-left dropdown, e.g. "my-gcp-project-12345"). The JSON also has a "project_id" field — you can copy from there.',
      },
      {
        title: 'Enter the dataset name + Save',
        detail: 'The dataset name you created in step 1 (e.g. "freecrawl_seo").',
      },
      {
        title: 'Test from the Export menu',
        detail:
          'File → Export → "Export to BigQuery" → pick a table name/format → run. Verify the table appeared in the BigQuery Console.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 PermissionDenied: caller does not have permission"',
        solution:
          'Service account IAM roles are missing. IAM & Admin → IAM → find your service account email → confirm both "BigQuery Data Editor" and "BigQuery Job User" are assigned.',
      },
      {
        problem: '"Dataset X not found"',
        solution:
          'Wrong dataset name OR location mismatch (multi-region "EU" vs region "europe-west1"). Copy the exact dataset name from the BigQuery Console.',
      },
      {
        problem: '"Invalid JSON"',
        solution:
          "You pasted only part of the JSON or there's a stray character at the edges. Open the service account JSON file with a real editor (VS Code recommended, NOT Notepad), Ctrl+A to select all, copy, clear the FreeCrawl field, paste.",
      },
    ],
    notes: [
      'Cost: BigQuery free tier (10GB storage + 1TB query/mo) covers normal use. A 1M-URL crawl is ~500MB; query cost depends on your SQL.',
      'Schema evolution: FreeCrawl creates/updates the export table automatically. If the CrawlUrlRow schema gains new columns, the export table picks them up (BigQuery DDL flexibility).',
    ],
    lastReviewed: '2026-06-01',
  },
};
