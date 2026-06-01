import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, BookOpen, ExternalLink, Lightbulb, X } from 'lucide-react';
import type { IntegrationDef } from '@freecrawl/shared-types';

/**
 * In-app step-by-step setup guide for one integration. Lives as a
 * portal-mounted modal next to the Settings → Integrations card so the
 * user can read the walkthrough without leaving the dialog. Content is
 * intentionally embedded in this file (not externalised to Markdown
 * because we want to ship guides with the binary, not depend on a
 * network-fetched docs site that can drift).
 *
 * Guides are kept current as of 2026-06-01 — the dates of the most
 * recent Google Cloud Console / OpenAI Platform / Anthropic Console UI
 * are noted on each. When Google rebrands a UI label, update the
 * relevant guide's "step" text on BOTH locales.
 *
 * Locale handling: GUIDES is keyed by locale (`en` / `tr`). The modal
 * picks `i18n.language`; unknown languages fall through to EN.
 */

interface GuideStep {
  /** One-line action label. */
  title: string;
  /** Long-form explanation. Plain text — newlines preserved. */
  detail?: string;
  /** Optional clickable URL (e.g. Google Cloud Console deep link). */
  link?: { label: string; url: string };
}

interface GuideTroubleshoot {
  /** The error message or symptom (verbatim if possible). */
  problem: string;
  /** Plain-text fix. */
  solution: string;
}

interface Guide {
  /** Short intro paragraph — what does this integration do, why pick it. */
  intro: string;
  /** Things the user must have BEFORE starting. */
  prereqs: string[];
  /** Numbered setup steps. */
  steps: GuideStep[];
  /** Common failure modes + fixes. */
  troubleshooting: GuideTroubleshoot[];
  /** Optional closing notes (rate limits, cost, refresh token TTL, etc). */
  notes?: string[];
  /** Date the guide was last reviewed against the live UI. */
  lastReviewed: string;
}

/** English guide set — default fallback for non-Turkish locales. */
const GUIDES_EN: Record<string, Guide> = {
  openai: {
    intro:
      'Run a custom prompt per URL through OpenAI\'s API — content analysis, title ideas, summaries. Usage is billed to your own OpenAI account; FreeCrawl is a free middleware, API calls hit your wallet.',
    prereqs: [
      'OpenAI account (sign up free at https://platform.openai.com).',
      'Valid payment method — OpenAI requires a $5 minimum balance before keys work.',
    ],
    steps: [
      {
        title: 'Sign in at platform.openai.com',
        detail: 'Use your OpenAI account. If you don\'t have one yet, "Sign up".',
        link: { label: 'platform.openai.com', url: 'https://platform.openai.com' },
      },
      {
        title: 'Click "API keys" in the left sidebar',
        detail: 'Key-icon menu item on the left. You can also go straight to the URL.',
        link: { label: 'API keys page', url: 'https://platform.openai.com/api-keys' },
      },
      {
        title: 'Click "+ Create new secret key" (top right)',
        detail: 'In the dialog:\n• Name: "FreeCrawl SEO Tool" (any reminder label)\n• Project: Default project or your choice\n• Permissions: All (easiest; restricted scopes also work)\nthen "Create secret key".',
      },
      {
        title: 'COPY the key — it is never shown again',
        detail: 'Key starts with `sk-...`. If you don\'t copy it now you will lose it forever (you\'d have to make a new one). Save it in a password manager — don\'t leave it in a browser tab.',
      },
      {
        title: 'Paste it into this panel\'s "API Key" field + click Save',
        detail: 'FreeCrawl stores the key encrypted in the OS credential store (Windows DPAPI, macOS Keychain, Linux Secret Service). Never written as plaintext.',
      },
      {
        title: 'Test in the AI tab',
        detail: 'Close Settings → switch to the top "AI" tab → pick a few URLs from a crawl → click "Run AI". First call takes ~2-3 s.',
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
      'Set a monthly hard limit on the Usage limits page — you don\'t want a runaway 1M URL crawl producing a $1000 bill.',
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
        link: { label: 'console.anthropic.com', url: 'https://console.anthropic.com' },
      },
      {
        title: 'Open the "API Keys" page from the top-right dropdown',
        detail: 'Under Settings menu, "API Keys" entry.',
        link: { label: 'API Keys page', url: 'https://console.anthropic.com/settings/keys' },
      },
      {
        title: 'Click "+ Create Key"',
        detail: 'In the dialog:\n• Name: "FreeCrawl SEO Tool"\n• Workspace: Default workspace\n• Environment: Production\nthen "Create Key".',
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
        detail: 'In Settings → AI, the "Model" field accepts a model id (default: claude-sonnet-4-6). Speed-priority: claude-haiku-4-5 (~10x cheaper, 3x faster). Quality-priority: claude-opus-4-8.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Your credit balance is too low"',
        solution:
          'console.anthropic.com → Settings → Billing → "Add credits" — minimum $5.',
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
      'Anthropic supports prompt caching — repeated long system prompts within 5 min are 90% discounted (FreeCrawl AI panel doesn\'t use caching yet — coming in a later release).',
    ],
    lastReviewed: '2026-06-01',
  },

  ollama: {
    intro:
      'Ollama is an open-source runtime for locally-hosted LLMs. NO API key, free forever, doesn\'t even need internet. Cost zero; only downside is VRAM/RAM for larger models.',
    prereqs: [
      'macOS 12+, Windows 10+, or Linux (Ubuntu 22.04+ recommended).',
      'At least 8 GB RAM (smaller models). Llama 3.2 3B needs ~2 GB VRAM/RAM.',
      'GPU recommended but not required — CPU works (slower).',
    ],
    steps: [
      {
        title: 'Download + install Ollama',
        detail: 'Pick your OS installer:\n• Windows: OllamaSetup.exe\n• macOS: Ollama.dmg\n• Linux: curl -fsSL https://ollama.com/install.sh | sh\n\nAfter install Ollama runs in the background (system tray icon).',
        link: { label: 'ollama.com/download', url: 'https://ollama.com/download' },
      },
      {
        title: 'Pull a model',
        detail: 'Open a terminal and run:\n\n  ollama pull llama3.2\n\nllama3.2 (3B params) is ~2GB, fast, low resource. Larger options:\n  ollama pull llama3.3:70b   (~40GB, beefy GPU only)\n  ollama pull qwen2.5:7b     (~4GB, balanced)\n  ollama pull mistral:7b     (~4GB, alternative)',
      },
      {
        title: 'Smoke-test the model',
        detail: 'In terminal:\n  ollama run llama3.2\n\nAn interactive chat opens. Type "hello" — if you get a reply, you\'re good. Ctrl+D to exit.',
      },
      {
        title: 'Enter the Ollama endpoint in this panel',
        detail: 'Default: http://localhost:11434 (already pre-filled). Override if Ollama runs on a different port.',
      },
      {
        title: 'Enter the model name you pulled',
        detail: 'E.g. "llama3.2" or "qwen2.5:7b". Leave blank to let FreeCrawl pick the first available model.',
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
          'Model doesn\'t fit in VRAM and swaps to CPU. Try a smaller model (llama3.2:1b or phi3:mini). VRAM needs: 3B ~2GB, 7B ~4GB, 13B ~8GB.',
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
        link: { label: 'console.cloud.google.com', url: 'https://console.cloud.google.com' },
      },
      {
        title: 'Pick or create a project',
        detail: 'Top-left project dropdown → "New Project" → name: "FreeCrawl SEO" → Create. NO billing account required — PSI free tier only needs credentials for authentication.',
      },
      {
        title: 'Enable the PageSpeed Insights API',
        detail: 'This deep link goes straight to the API\'s enable page:',
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
        detail: 'Click "Edit API key" → "Restrict key":\n• API restrictions: "Restrict key" → "PageSpeed Insights API"\n• Application restrictions: "None" (FreeCrawl is a desktop app, so referrer/IP filtering won\'t work)\nUnrestricted keys also work, but we recommend you restrict.',
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
          'There\'s also a per-minute limit: 240 queries/min. In Settings → PageSpeed keep concurrency 2-3. The daily 25K cap is sky-high — you won\'t see it in normal use.',
      },
    ],
    notes: [
      'Cost: FREE — one of the few Google APIs that doesn\'t require billing. Keyless/anonymous mode is now 0 queries/day (closed in early 2026), so a key is mandatory.',
      'Speed: each URL ~5-10 s (Google is actually running a Lighthouse instance). 1000 URLs ~2 hours.',
      'Mobile + Desktop count as separate API calls — picking "both" doubles quota usage.',
    ],
    lastReviewed: '2026-06-01',
  },

  ahrefs: {
    intro:
      'Pull backlink count, domain rating, referring domains, organic keyword counts per URL via Ahrefs\' API. This is Ahrefs\' most expensive integration — API access is gated behind $500+/month plans.',
    prereqs: [
      'Ahrefs Standard ($249/mo) or higher subscription.',
      'Add-on "API" tier (extra $500/mo on top of the base plan, or a different tier).',
    ],
    steps: [
      {
        title: 'Sign in to Ahrefs → API page',
        link: { label: 'ahrefs.com/api', url: 'https://ahrefs.com/api' },
      },
      {
        title: 'Pick a subscription (if you don\'t already have API access)',
        detail: 'API v3 access ships with Enterprise tier and dedicated API plans. Contact sales for a quote.',
      },
      {
        title: 'Generate an API token in your account',
        detail: 'Ahrefs dashboard → Account settings → API → Generate token. Token format: `sk-...` or similar.',
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
      'Pull Trust Flow, Citation Flow, and backlink counts via Majestic\'s API. The most cost-effective backlink-focused provider.',
    prereqs: [
      'Majestic Lite ($49.99/mo) or higher subscription.',
      'API access — included with Lite.',
    ],
    steps: [
      {
        title: 'Open the Majestic developer dashboard',
        link: { label: 'majestic.com/account/api', url: 'https://majestic.com/account/api' },
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
    notes: [
      'Cost: 1 URL backlink lookup = 5 units. Lite plan (1000 units) ~200 URLs/mo.',
    ],
    lastReviewed: '2026-06-01',
  },

  moz: {
    intro:
      'Pull Domain Authority (DA), Page Authority (PA), and Spam Score via Moz API. The most popular choice for lower budgets.',
    prereqs: [
      'Moz Pro Standard ($99/mo) or higher subscription with "Moz API" add-on enabled.',
    ],
    steps: [
      {
        title: 'Open the Moz API page',
        link: { label: 'moz.com/api', url: 'https://moz.com/api' },
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
    notes: [
      'Cost: Standard plan (1500 rows/mo), Medium (10K rows/mo), Large (100K rows/mo).',
    ],
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
        link: { label: 'Semrush API access', url: 'https://www.semrush.com/accounts/subscription-info/api-units/' },
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
    notes: [
      'Cost: 1 URL backlinks query = 10 units; 1 domain overview = 1 unit.',
    ],
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
        detail: 'Top-left project dropdown → "New Project" → name: "FreeCrawl SEO Integrations" (anything you like) → Create. This project is only for OAuth credentials — billing not required.',
        link: { label: 'console.cloud.google.com', url: 'https://console.cloud.google.com' },
      },
      {
        title: 'Open Google Auth Platform → Branding',
        detail: 'Left menu "APIs & Services" → "OAuth consent screen" (new UI: "Google Auth Platform → Branding"). User Type: "External" → Create.',
        link: {
          label: 'OAuth consent screen',
          url: 'https://console.cloud.google.com/auth/branding',
        },
      },
      {
        title: 'Fill in the OAuth consent screen',
        detail: 'Only the required fields:\n• App name: "FreeCrawl Local"\n• User support email: your email\n• Developer contact information: your email\nLeave the rest blank. Save and Continue → Save and Continue → Save and Continue → Back to Dashboard.',
      },
      {
        title: 'CRITICAL: Add yourself as a Test User',
        detail: 'Left menu → "Audience" (old UI "Test users") → "Add users" → paste the Gmail you\'ll connect → Save.\n\nWARNING: DO NOT SKIP THIS STEP. Skipping it produces a 403 access_denied during OAuth — apps in "Testing" status only allow accounts on the test users list to connect.',
        link: { label: 'Audience page', url: 'https://console.cloud.google.com/auth/audience' },
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
        detail: 'Left menu → "Credentials" (new UI "Google Auth Platform → Clients") → "+ Create credentials" → "OAuth client ID".',
        link: {
          label: 'Credentials page',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'Pick "Desktop app" as the OAuth Client type (NOT Web app!)',
        detail: 'Application type dropdown → "Desktop app". Name: "FreeCrawl SEO Tool". Create → the dialog shows Client ID + Client Secret. Copy both immediately (Secret is not shown again).\n\nWHY DESKTOP: FreeCrawl uses a random local port (e.g. 127.0.0.1:63092) per connection. "Web application" needs a fixed redirect URI list — that random port can\'t match → fail. "Desktop app" automatically accepts loopback redirects, port-agnostic.',
      },
      {
        title: 'Paste Client ID + Client Secret into this panel + Save',
        detail: 'Two fields: "OAuth Client ID" (...apps.googleusercontent.com) and "OAuth Client Secret" (GOCSPX-...). Save.',
      },
      {
        title: 'Click "Connect" — your browser opens',
        detail: 'After Save the card shows a "Connect" button. Click it → Google\'s consent screen opens in your default browser.',
      },
      {
        title: 'Sign in with the Google account you added as a test user',
        detail: 'In the account picker pick the email you added to test users. "Continue" → "Google hasn\'t verified this app" warning (expected for testing mode). "Advanced" → "Go to FreeCrawl Local (unsafe)" → accept the permissions → Allow.',
      },
      {
        title: 'Back to FreeCrawl — you should see "Configured"',
        detail: 'The Search Console card in Settings now shows a green "Configured" badge. You can now switch to the top "Search Console" tab to list properties + fetch data.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 access_denied"',
        solution:
          'You didn\'t add a test user, or you\'re signing in with the wrong Google account. Go back to the Audience page and check that the account you\'re using is on the test users list. If you have several Google accounts, see which one the account picker is using.',
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
      'GSC data lags ~2 days — today\'s clicks don\'t show up immediately.',
      'Free quota: 1200 queries/min, 25,000 queries/day — you\'ll never hit it in normal use.',
    ],
    lastReviewed: '2026-06-01',
  },

  ga4: {
    intro:
      'Pull per-URL GA4 metrics (sessions, users, bounce rate, engagement rate, conversions). "Bring your own client" — uses your own GCP OAuth client.',
    prereqs: [
      'Google account with at least Viewer access on the GA4 property you\'ll connect.',
      'You can REUSE the same OAuth client you set up for GSC — just enable the right APIs.',
    ],
    steps: [
      {
        title: 'If you already set up GSC: REUSE that OAuth client',
        detail: 'If Search Console is already configured, you can use the same Google Cloud project and the same OAuth Client ID + Secret. No need to recreate — just enable the APIs below and paste the credentials here.',
      },
      {
        title: 'Enable BOTH GA4 APIs',
        detail: 'GA4 needs two distinct APIs:\n\n1. Google Analytics Admin API (for property listing)\n2. Google Analytics Data API (for the actual reports)\n\nIf you don\'t enable both you\'ll see "API not enabled" errors.',
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
        detail: 'If GSC is already connected, you might not even need to paste — the cards may share credentials. If you\'re setting GA4 up from scratch, copy the ID/Secret from your GSC client into this panel.',
      },
      {
        title: '"Connect" → sign in with Google + approve the GA4 scope',
        detail: 'Sign in with the Google account you added as a test user. On the consent screen confirm the "Google Analytics: View Google Analytics property data" permission is checked.',
      },
      {
        title: 'List properties + fetch in the GA4 tab',
        detail: 'Switch to the "GA4" top tab → "List Properties" shows every GA4 property your account can see → pick one → choose a window (7/28/90 days) → "Fetch". GA4 is near-realtime, results show up immediately.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Google Analytics Admin API has not been used in project X"',
        solution:
          'Admin API not enabled. Open the link in step 2 → Enable. Wait 30 s, retry. You\'ll get the same error for the Data API next — open the step 3 link and enable that too.',
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
      'GA4 data is near-realtime — today\'s data shows up within 4-24 hours.',
      'Free quota: 200K requests/day, 50 requests/min per property.',
    ],
    lastReviewed: '2026-06-01',
  },

  sheets: {
    intro:
      'Export crawl results straight to a Google Sheet. Better than "download CSV → open in Excel" when you\'re collaborating with teammates on a shared live document.',
    prereqs: [
      'Google account.',
      'You can REUSE the same OAuth client you set up for GSC.',
    ],
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
        detail: 'OAuth flow shows two permissions:\n• See, edit, create, and delete all your Google Sheets spreadsheets\n• See, edit, create, and delete only the specific Google Drive files used with this app\nTick both.',
      },
      {
        title: 'Test from the Export menu',
        detail: 'File → Export → "Export to Google Sheets". A new Sheet is auto-created, URL copied to clipboard.',
      },
    ],
    troubleshooting: [
      {
        problem: '"insufficient authentication scopes"',
        solution:
          'You didn\'t tick the Drive permission checkbox during Connect. Disconnect + Reconnect, tick both permissions.',
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
        detail: 'BigQuery Console → pick your project → "Create dataset" → ID: "freecrawl_seo" (or any name) → Location: "EU" or "US" (important — can\'t change later) → Create dataset.',
        link: { label: 'BigQuery Console', url: 'https://console.cloud.google.com/bigquery' },
      },
      {
        title: 'Create a Service Account',
        detail: 'IAM & Admin → Service Accounts → "+ Create service account" → name: "freecrawl-bigquery" → Create and continue.',
        link: { label: 'Service Accounts', url: 'https://console.cloud.google.com/iam-admin/serviceaccounts' },
      },
      {
        title: 'Add roles',
        detail: 'In step 2 "Grant this service account access to project" → add two roles:\n• BigQuery Data Editor\n• BigQuery Job User\nThen "Continue" → "Done".',
      },
      {
        title: 'Download the JSON key',
        detail: 'In the service account list click the one you just created → "Keys" tab → "Add key" → "Create new key" → Type: JSON → Create.\n\nThe JSON downloads automatically. Open it in a text editor and copy the entire content.\n\nWARNING: This JSON contains all the credential — treat it like a password. Never check it into source control.',
      },
      {
        title: 'Paste it into this panel\'s "Service Account JSON" field',
        detail: 'Paste the full JSON (from the opening `{` to closing `}`). FreeCrawl stores the JSON encrypted in the OS credential store.',
      },
      {
        title: 'Fill in "GCP Project ID"',
        detail: 'Your GCP project ID (shows in the Cloud Console top-left dropdown, e.g. "my-gcp-project-12345"). The JSON also has a "project_id" field — you can copy from there.',
      },
      {
        title: 'Enter the dataset name + Save',
        detail: 'The dataset name you created in step 1 (e.g. "freecrawl_seo").',
      },
      {
        title: 'Test from the Export menu',
        detail: 'File → Export → "Export to BigQuery" → pick a table name/format → run. Verify the table appeared in the BigQuery Console.',
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
          'You pasted only part of the JSON or there\'s a stray character at the edges. Open the service account JSON file with a real editor (VS Code recommended, NOT Notepad), Ctrl+A to select all, copy, clear the FreeCrawl field, paste.',
      },
    ],
    notes: [
      'Cost: BigQuery free tier (10GB storage + 1TB query/mo) covers normal use. A 1M-URL crawl is ~500MB; query cost depends on your SQL.',
      'Schema evolution: FreeCrawl creates/updates the export table automatically. If the CrawlUrlRow schema gains new columns, the export table picks them up (BigQuery DDL flexibility).',
    ],
    lastReviewed: '2026-06-01',
  },
};

/** Turkish guide set. Kullanıcının ana dili — TR seçili olduğunda gösterilir. */
const GUIDES_TR: Record<string, Guide> = {
  openai: {
    intro:
      "OpenAI'in API'sini kullanarak her URL için özel bir prompt çalıştırırsın — içerik analizi, title önerisi, açıklama özeti gibi. Kullanım kendi OpenAI hesabına faturalanır (FreeCrawl bedava aracılık yapar, API çağrıları senin hesabından düşer).",
    prereqs: [
      'OpenAI hesabı (https://platform.openai.com adresinden ücretsiz açılır).',
      'Geçerli bir ödeme yöntemi (kredi kartı) — OpenAI API anahtarları $5 minimum bakiye gerektirir.',
    ],
    steps: [
      {
        title: 'platform.openai.com\'a giriş yap',
        detail: 'OpenAI hesabınla giriş yapmak için bu URL\'i aç. Eğer henüz hesabın yoksa "Sign up" ile aç.',
        link: { label: 'platform.openai.com', url: 'https://platform.openai.com' },
      },
      {
        title: 'Sol menüden "API keys"\'e tıkla',
        detail: 'Sol kenar çubuğunda anahtar ikonlu menü maddesi. Direkt URL ile de gidebilirsin.',
        link: { label: 'API keys sayfası', url: 'https://platform.openai.com/api-keys' },
      },
      {
        title: 'Sağ üstte "+ Create new secret key" butonuna bas',
        detail: 'Açılan dialog\'a:\n• Name: "FreeCrawl SEO Tool" (istediğin isim, hatırlatıcı için)\n• Project: Default project veya istediğin project\n• Permissions: All (en kolayı; daha kısıtlı izinler de iş görür)\nsonra "Create secret key" butonuna bas.',
      },
      {
        title: 'Anahtarı KOPYALA — bir daha gösterilmez',
        detail: 'Anahtar `sk-...` ile başlar. Şimdi kopyalamazsan bir daha hiç göremezsin (kaybedersen yenisini oluşturman gerekir). Tarayıcı sekmesinde tutmamak için bir parola yöneticisine kaydet.',
      },
      {
        title: 'Anahtarı bu pencerenin "API Key" alanına yapıştır + Save\'e bas',
        detail: 'FreeCrawl anahtarı OS\'un güvenli credential store\'unda (Windows: DPAPI, macOS: Keychain, Linux: Secret Service) şifreli olarak saklar. Düz metin dosyaya yazılmaz.',
      },
      {
        title: 'AI sekmesinde test et',
        detail: 'Settings\'i kapat → üst tab bar\'dan "AI" sekmesine git → bir crawl çalıştırdıysan birkaç URL seç → "Run AI" butonuna bas. İlk çağrı ~2-3sn sürer.',
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
          'Çok hızlı paralel istek atıyorsun. Settings → AI panelinde concurrency\'yi düşür (varsayılan: 3). OpenAI Tier 1 hesaplar için RPM limiti modele göre 500-3500 arası değişir.',
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
      'Anthropic\'in Claude API\'siyle her URL için özel prompt çalıştırırsın. Claude\'un en güçlü modelleri (Sonnet 4.6, Opus 4.8) gerçek SEO analizi için OpenAI\'a göre daha az "yapay" çıktı verir. Kullanım kendi Anthropic hesabına faturalanır.',
    prereqs: [
      'Anthropic hesabı (https://console.anthropic.com adresinden açılır).',
      'Ödeme yöntemi eklenmiş Anthropic hesabı (ilk kullanıcılara $5 promo kredi var).',
    ],
    steps: [
      {
        title: 'console.anthropic.com\'a giriş yap',
        link: { label: 'console.anthropic.com', url: 'https://console.anthropic.com' },
      },
      {
        title: 'Sağ üst dropdown\'dan "API Keys"\'i seç',
        detail: 'Veya direkt URL ile git. Settings menüsünün altında "API Keys" maddesi var.',
        link: { label: 'API Keys sayfası', url: 'https://console.anthropic.com/settings/keys' },
      },
      {
        title: '"+ Create Key" butonuna bas',
        detail: 'Açılan dialog:\n• Name: "FreeCrawl SEO Tool"\n• Workspace: Default workspace (varsayılan)\n• Environment: Production\nsonra "Create Key" butonuna bas.',
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
        detail: 'Anthropic Claude Console\'dan model seçmek için Settings → AI panelinde "Model" alanına bir model adı yazabilirsin (varsayılan: claude-sonnet-4-6). Hız önemliyse claude-haiku-4-5 (~10x daha ucuz, 3x daha hızlı), kalite önemliyse claude-opus-4-8.',
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
          'Tier 1 hesaplar dakikada ~50 request alır. Settings → AI panelinde concurrency\'yi 2-3\'e düşür. Daha yüksek tier için $25+ harcaman gerekir (Tier 2: 1000 RPM).',
      },
      {
        problem: '"Invalid API key"',
        solution:
          'Anahtarın başında "sk-ant-" prefix\'ini koruduğundan emin ol. Boşluk olmasın. Test için console.anthropic.com → API Keys sayfasında anahtar listede aktif görünüyorsa anahtar geçerlidir.',
      },
    ],
    notes: [
      'Maliyet (2026-06): Haiku 4.5 ~$0.25/1M input + $1.25/1M output; Sonnet 4.6 ~$3/1M input + $15/1M output; Opus 4.8 ~$15/1M input + $75/1M output.',
      'Anthropic prompt caching destekliyor — uzun system prompt\'lar 5dk içinde tekrar kullanılırsa 90% indirimli (FreeCrawl AI panel\'i şu an caching kullanmıyor, sonraki sürümde gelecek).',
    ],
    lastReviewed: '2026-06-01',
  },

  ollama: {
    intro:
      'Ollama, kendi makinende lokal olarak çalışan açık-kaynak LLM\'ler için bir runtime. API anahtarı YOK, ücretsiz, internet bağlantısı bile şart değil. Maliyet sıfır; tek dezavantaj büyük modelleri çalıştırmak için VRAM gerekiyor.',
    prereqs: [
      'macOS 12+, Windows 10+, veya Linux (Ubuntu 22.04+ önerilir).',
      'En az 8 GB RAM (küçük modeller için). Llama 3.2 3B model ~2 GB VRAM/RAM ister.',
      'GPU önerilir ama şart değil — CPU\'da da çalışır (daha yavaş).',
    ],
    steps: [
      {
        title: 'Ollama\'yı indir + kur',
        detail: 'İşletim sistemine göre installer indir:\n• Windows: OllamaSetup.exe\n• macOS: Ollama.dmg\n• Linux: curl -fsSL https://ollama.com/install.sh | sh\n\nKurulduktan sonra Ollama otomatik olarak arka planda çalışır (system tray\'de ikon görünür).',
        link: { label: 'ollama.com/download', url: 'https://ollama.com/download' },
      },
      {
        title: 'Bir model indir',
        detail: 'Terminal aç ve şunu çalıştır:\n\n  ollama pull llama3.2\n\nllama3.2 (3B parametre) ~2GB indirir, hızlı + düşük kaynak. Daha güçlü:\n  ollama pull llama3.3:70b   (~40GB, sadece güçlü GPU)\n  ollama pull qwen2.5:7b     (~4GB, dengeli)\n  ollama pull mistral:7b     (~4GB, alternatif)',
      },
      {
        title: 'Modeli test et',
        detail: 'Terminal\'de:\n  ollama run llama3.2\n\nİnteraktif chat açılır, "merhaba" yaz, cevap geliyorsa OK. Çıkmak için Ctrl+D.',
      },
      {
        title: 'Ollama endpoint\'ini bu paneldeki alana gir',
        detail: 'Varsayılan: http://localhost:11434 (zaten ön-dolu). Eğer Ollama\'yı farklı portta çalıştırıyorsan onu kullan.',
      },
      {
        title: 'Model alanına indirdiğin model adını yaz',
        detail: 'Örn: "llama3.2" veya "qwen2.5:7b". Adım 2\'de indirdiğin modelin adı. Boş bırakırsan FreeCrawl ilk available modeli seçer.',
      },
      {
        title: 'Save + test',
        detail: 'AI sekmesinde küçük bir batch çalıştır. CPU modunda her URL ~5-15sn alabilir; GPU\'da ~1-3sn.',
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
          'Model GPU\'ya sığmıyor, CPU swap\'a düşüyor. Daha küçük model dene (llama3.2:1b veya phi3:mini). VRAM ihtiyacı: 3B model ~2GB, 7B model ~4GB, 13B model ~8GB.',
      },
    ],
    notes: [
      'Tamamen offline çalışır — internet bağlantısı kesilse bile crawl + AI analizi devam eder.',
      'Lokal modellerin SEO analizi kalitesi: 3B modeller hafif yetersiz, 7-13B modeller iyi, 70B modeller GPT-4 seviyesi (ama ciddi donanım ister).',
      'Bağlantı tipi: Settings → AI → Concurrency\'yi 1-2\'de tut — yerel model paralel istekleri sırayla işler.',
    ],
    lastReviewed: '2026-06-01',
  },

  pagespeed: {
    intro:
      'Google PageSpeed Insights, her URL\'i Lighthouse ile audit eder ve Performance/SEO/Accessibility/Best-Practices skorları + Core Web Vitals (LCP/CLS/INP) döner. Free API anahtarı ile günde 25.000 URL audit edebilirsin.',
    prereqs: [
      'Google hesabı.',
      'Google Cloud Console projesi (yoksa adımlarda oluşturursun).',
    ],
    steps: [
      {
        title: 'Google Cloud Console\'a gir',
        link: { label: 'console.cloud.google.com', url: 'https://console.cloud.google.com' },
      },
      {
        title: 'Bir project seç veya oluştur',
        detail: 'Üst soldaki project dropdown\'a tıkla → "New Project" → isim: "FreeCrawl SEO" → Create. Billing account ZORUNLU DEĞİL (PSI free tier sadece authentication için credentials ister).',
      },
      {
        title: 'PageSpeed Insights API\'yı enable et',
        detail: 'Bu link doğrudan API\'nin enable sayfasını açar:',
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
        detail: 'Bir API key string\'i üretilir (`AIzaSy...` ile başlar). Hemen kopyala.',
      },
      {
        title: 'Optional: API key\'i kısıtla (önerilir)',
        detail: 'Açılan dialog\'dan "Edit API key" → "Restrict key" altında:\n• API restrictions: "Restrict key" → "PageSpeed Insights API"\n• Application restrictions: "None" (FreeCrawl desktop app olduğu için referrer/IP filtrelemesi işe yaramaz)\nKısıtlama yapmasan da çalışır, ama tavsiye ederiz.',
      },
      {
        title: 'Anahtarı bu pencerenin "API Key" alanına yapıştır + Save',
      },
      {
        title: 'PageSpeed sekmesinde test',
        detail: 'Üst tab bar\'dan "PageSpeed" sekmesine git → birkaç URL seç → "Run audit" butonuna bas. İlk audit ~10-15sn sürer.',
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
          'Free tier per-minute limit\'i de var: 240 query/dakika. FreeCrawl Settings → PageSpeed → Concurrency\'yi 2-3\'te tut. Day quota 25K — bu çok yüksek, normal kullanımda görmezsin.',
      },
    ],
    notes: [
      'Maliyet: FREE — Google PSI API\'nin para istemediği nadir API\'lardan biri. Anonymous/keyless mod artık 0 query/gün (2026 başında kapatıldı), o yüzden key zorunlu.',
      'Hız: her URL ~5-10sn (Google\'in Lighthouse instance\'ı çalıştırıyor). 1000 URL için ~2 saat sürer.',
      'Mobile + Desktop ayrı API çağrısı sayılır — "both" seçersen quota 2 katı tüketilir.',
    ],
    lastReviewed: '2026-06-01',
  },

  ahrefs: {
    intro:
      'Ahrefs\'in API\'siyle her URL için backlink sayısı, domain rating, referring domains, organic keywords sayısı çekersin. Bu Ahrefs\'in en pahalı entegrasyonu — API access ücretli, ayda $500+ subscription gerektirir.',
    prereqs: [
      'Ahrefs Standard ($249/ay) veya üstü subscription.',
      'Ayrıca "API" eklentisi (subscription üstüne ek $500/ay veya farklı tier).',
    ],
    steps: [
      {
        title: 'Ahrefs hesabına gir → API sayfası',
        link: { label: 'ahrefs.com/api', url: 'https://ahrefs.com/api' },
      },
      {
        title: 'Subscription seç (eğer henüz API access\'in yoksa)',
        detail: 'API v3 access\'i sadece Enterprise tier ve özel API plan ile geliyor. Sales\'tan teklif al.',
      },
      {
        title: 'Hesabında "API Token" üret',
        detail: 'Ahrefs dashboard → Account settings → API → Generate token. Token sk-... veya benzer formatta.',
      },
      {
        title: 'Token\'ı bu panelin "API Key" alanına yapıştır + Save',
      },
      {
        title: 'SEO Authority sekmesinde test',
        detail: 'Üst tab bar\'dan "SEO Authority" sekmesine git → provider olarak "Ahrefs" seç → birkaç URL seç → "Run" butonuna bas.',
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
      'Maliyet: ortalama 1 URL audit\'i 1-5 API row tüketir. Standard API plan ~25K row/ay.',
      'Alternatif: Daha ekonomik olarak Moz ($99/ay, Domain Authority verir) veya Majestic kullanılabilir.',
    ],
    lastReviewed: '2026-06-01',
  },

  majestic: {
    intro:
      'Majestic\'in API\'siyle Trust Flow, Citation Flow ve backlink sayıları çekilir. Backlink-odaklı SEO analizine en uygun ve ekonomik provider\'dan biri.',
    prereqs: [
      'Majestic Lite ($49.99/ay) veya üstü subscription.',
      'API access — Lite plan ile gelir.',
    ],
    steps: [
      {
        title: 'Majestic developer dashboard\'a gir',
        link: { label: 'majestic.com/account/api', url: 'https://majestic.com/account/api' },
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
          'Aylık analysis unit kotanı tükettin. Lite plan 1000 units/ay; Pro plan 20K+. Majestic dashboard → API → usage\'a bak.',
      },
    ],
    notes: [
      'Maliyet: 1 URL backlink lookup\'ı 5 unit. Lite plan (1000 unit) ~200 URL/ay.',
    ],
    lastReviewed: '2026-06-01',
  },

  moz: {
    intro:
      'Moz API ile Domain Authority (DA), Page Authority (PA) ve Spam Score çekilir. Düşük bütçeli SEO için en popüler seçenek.',
    prereqs: [
      'Moz Pro Standard ($99/ay) veya üstü subscription, "Moz API" eklenti aktif olmalı.',
    ],
    steps: [
      {
        title: 'Moz API sayfasına gir',
        link: { label: 'moz.com/api', url: 'https://moz.com/api' },
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
          'Access ID veya Secret Key yanlış yazılmış. Moz dashboard\'dan yeniden kopyala — Access ID kısa (~13 karakter), Secret Key uzun (~40 karakter).',
      },
    ],
    notes: [
      'Maliyet: Standard plan (1500 rows/ay), Medium (10K rows/ay), Large (100K rows/ay).',
    ],
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
        title: 'Semrush\'a gir → Subscription info → API',
        link: { label: 'Semrush API access', url: 'https://www.semrush.com/accounts/subscription-info/api-units/' },
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
    notes: [
      'Maliyet: 1 URL backlinks query 10 unit, 1 domain overview 1 unit.',
    ],
    lastReviewed: '2026-06-01',
  },

  gsc: {
    intro:
      'Google Search Console API ile her crawl edilmiş URL için clicks, impressions, CTR, average position metriklerini Google\'dan çekersin. URL Inspection API ile coverage verdict + last-crawl-time de mümkün. "Bring your own client" model — kendi Google Cloud OAuth client\'ını oluşturup pasti, FreeCrawl shared bir aracı uygulama kullanmıyor.',
    prereqs: [
      'Google hesabı (bağlanacak GSC property\'lerinin sahibi/sahiplerinden biri olmalı).',
      'En az bir Google Search Console property eklenmiş + doğrulanmış olmalı.',
    ],
    steps: [
      {
        title: 'Google Cloud Console\'a gir + yeni bir project oluştur',
        detail: 'Üst soldaki project dropdown → "New Project" → isim: "FreeCrawl SEO Integrations" (veya istediğin) → Create. Bu project sadece OAuth credentials için, billing istemiyor.',
        link: { label: 'console.cloud.google.com', url: 'https://console.cloud.google.com' },
      },
      {
        title: 'Google Auth Platform → Branding sayfasını aç',
        detail: 'Sol menüden "APIs & Services" → "OAuth consent screen" (yeni UI: "Google Auth Platform → Branding"). User Type: "External" seç → Create.',
        link: {
          label: 'OAuth consent screen',
          url: 'https://console.cloud.google.com/auth/branding',
        },
      },
      {
        title: 'OAuth consent screen\'i doldur',
        detail: 'Sadece zorunlu alanlar yeter:\n• App name: "FreeCrawl Local"\n• User support email: kendi email\'in\n• Developer contact information: kendi email\'in\nDiğer alanları boş bırakabilirsin. Save and Continue → Save and Continue → Save and Continue → Back to Dashboard.',
      },
      {
        title: 'ÖNEMLİ: Test User olarak kendi email\'ini ekle',
        detail: 'Sol menüden "Audience" (eski UI\'da "Test users") → "Add users" → bağlanacağın Google account email\'ini yaz → Save.\n\nUYARI: BU ADIMI ATLAMA. Atlanırsa OAuth flow\'unda 403 access_denied hatası alırsın çünkü "Testing" status\'undaki app\'lere sadece test user listesindekiler bağlanabilir.',
        link: { label: 'Audience sayfası', url: 'https://console.cloud.google.com/auth/audience' },
      },
      {
        title: 'Google Search Console API\'yı enable et',
        detail: 'Bu link API\'nin enable sayfasını direkt açar → Mavi "Enable" butonuna bas → 30sn bekle.',
        link: {
          label: 'Search Console API → Enable',
          url: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com',
        },
      },
      {
        title: 'OAuth Client ID oluştur',
        detail: 'Sol menüden "Credentials" (yeni UI: "Google Auth Platform → Clients") → "+ Create credentials" → "OAuth client ID".',
        link: {
          label: 'Credentials sayfası',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'OAuth Client tipini "Desktop app" SEÇ (Web app değil!)',
        detail: 'Application type dropdown\'dan "Desktop app" seç. Adı: "FreeCrawl SEO Tool". Create → açılan dialog\'da Client ID + Client Secret görünür. İkisini de kopyala (Client secret bir daha gösterilmez, mutlaka kaydet).\n\nNEDEN DESKTOP: FreeCrawl her bağlantıda rastgele bir local port (örn. 127.0.0.1:63092) kullanır. "Web application" tipinde redirect URI listesi sabit olmak zorunda, bu port her seferinde değişir → fail. "Desktop app" tipi localhost loopback redirect\'i otomatik kabul eder, port-agnostic.',
      },
      {
        title: 'Client ID + Client Secret\'i bu panele yapıştır + Save',
        detail: 'İki alan: "OAuth Client ID" (...apps.googleusercontent.com) ve "OAuth Client Secret" (GOCSPX-...). Save\'e bas.',
      },
      {
        title: '"Connect" butonuna bas — tarayıcı açılır',
        detail: 'Save sonrası kart üzerinde "Connect" butonu görünür. Bas → varsayılan tarayıcıda Google consent screen açılır.',
      },
      {
        title: 'Test user olarak eklediğin Google account ile giriş yap',
        detail: 'Account picker\'da test users\'a eklediğin email\'i seç. "Continue" → "Google hasn\'t verified this app" uyarısı çıkacak (normal, test mode için beklenen). "Advanced" → "Go to FreeCrawl Local (unsafe)" tıkla → izinleri kabul et → consent → Allow.',
      },
      {
        title: 'FreeCrawl\'a dönüş — "Configured" görmen lazım',
        detail: 'Settings dialog\'daki Search Console kartı yeşil "Configured" badge\'i göstermeli. Artık üst tab bar\'dan "Search Console" sekmesinde property listele + fetch yapabilirsin.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 access_denied"',
        solution:
          'Test user eklenmemiş veya yanlış Google account ile giriş yapıyorsun. Audience sayfasına dön, kullandığın account\'un test users listesinde olduğunu kontrol et. Birden fazla Google account\'un varsa hangisiyle giriş yaptığını account picker\'dan görebilirsin.',
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
      'Sahip olduğun property\'ler (sc-domain:example.com veya https://example.com/) hesabının doğruladığı tüm site\'ları içerir.',
      'GSC verisi ~2 gün lag\'lidir — bugünün clicks\'i hemen görünmez.',
      'Free quota: 1200 query/dakika, 25.000 query/gün — tipik kullanımda hiç görmezsin.',
    ],
    lastReviewed: '2026-06-01',
  },

  ga4: {
    intro:
      'Google Analytics 4 ile her URL için sessions, users, bounce rate, engagement rate, conversions çekersin. "Bring your own client" — kendi GCP OAuth client\'ını kullanır.',
    prereqs: [
      'Google hesabı + bağlanacak GA4 property\'sinde en az "Viewer" rolüne sahip olmalı.',
      'GSC için kurduğun aynı OAuth client\'ı tekrar kullanabilirsin (sadece API enable etmen yeter).',
    ],
    steps: [
      {
        title: 'GSC kurulumu yaptıysan: AYNI OAuth client\'ı kullan',
        detail: 'Eğer Search Console kurulumunu daha önce yaptıysan, aynı Google Cloud project\'i ve OAuth Client ID + Secret\'ı kullanabilirsin. Tekrar oluşturman gerekmez — sadece aşağıdaki API\'ları enable et + bu panele yapıştır.',
      },
      {
        title: 'GA4 için GEREKLİ iki API\'yı enable et',
        detail: 'GA4 için iki ayrı API gerekir:\n\n1. Google Analytics Admin API (property listing için)\n2. Google Analytics Data API (asıl raporlar için)\n\nİkisini de enable etmezsen "API not enabled" hatası alırsın.',
        link: {
          label: 'Admin API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com',
        },
      },
      {
        title: 'Data API\'yı da enable et',
        link: {
          label: 'Data API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
        },
      },
      {
        title: 'GSC için kullandığın aynı Client ID + Secret\'i bu panele yapıştır',
        detail: 'Eğer GSC zaten bağlıysa, ayrıca paste etmen gerekmeyebilir (kart aynı credential\'ı paylaşabilir). FreeCrawl\'da her Google entegrasyonu kendi credential field\'ına sahip — sıfırdan kuruyorsan GSC için yapılan setup\'taki ID/Secret\'i kopyala buraya da yapıştır.',
      },
      {
        title: '"Connect" → tarayıcıda Google\'a giriş + GA4 scope\'unu onayla',
        detail: 'Test user olarak eklendiğin Google account ile giriş yap. Consent screen\'inde "Google Analytics: View Google Analytics property data" izninin işaretli olduğunu kontrol et.',
      },
      {
        title: 'GA4 sekmesinde property listele + fetch',
        detail: 'Üst tab bar\'dan "GA4" sekmesine git. Önce "List Properties" ile bağlı hesabın altındaki tüm GA4 property\'leri görürsün. Birini seç → trailing window (7/28/90 gün) seç → "Fetch" butonuna bas. GA4 lag\'siz, sonuç anında geliyor.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Google Analytics Admin API has not been used in project X"',
        solution:
          'Admin API enable edilmemiş. Adım 2\'deki linke git → Enable. 30sn bekle, tekrar dene. Aynı hatayı Data API için de görebilirsin — Adım 3\'teki linke git ve onu da enable et.',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'OAuth scope GA4\'i kapsamıyor. myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → tekrar Connect → consent screen\'de Google Analytics izinleri checkbox\'ını tik\'le.',
      },
      {
        problem: 'Property listesi boş geliyor',
        solution:
          'Bağlandığın Google account\'un GA4 property\'lerinde rolü yok. GA4 dashboard → Admin → Property Access Management → email\'inin Viewer rolünde olduğunu kontrol et.',
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
      'Google Sheets entegrasyonu ile crawl sonuçlarını doğrudan bir Google Sheet\'e export edersin. CSV indirip Excel\'de açmak yerine ekip arkadaşlarıyla canlı paylaşılan Sheet üzerinde çalışmak için ideal.',
    prereqs: [
      'Google hesabı.',
      'GSC için kurduğun aynı OAuth client\'ı tekrar kullanabilirsin.',
    ],
    steps: [
      {
        title: 'GSC/GA4 kurulumu yaptıysan: AYNI OAuth client\'ı kullan',
        detail: 'OAuth Client ID + Secret\'ı yapıştır (varsa zaten kayıtlı).',
      },
      {
        title: 'Google Sheets API\'yı enable et',
        link: {
          label: 'Sheets API → Enable',
          url: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
        },
      },
      {
        title: 'Google Drive API\'yı da enable et',
        detail: 'Sheets API spreadsheet okumak/yazmak için Drive API\'ya da scope ister.',
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
        detail: 'OAuth flow\'unda iki ayrı izin göreceksin:\n• See, edit, create, and delete all your Google Sheets spreadsheets\n• See, edit, create, and delete only the specific Google Drive files used with this app\nİkisini de tikle.',
      },
      {
        title: 'Export menüsünden test',
        detail: 'File → Export → "Export to Google Sheets". Yeni Sheet otomatik oluşturulur, URL kopyalanır.',
      },
    ],
    troubleshooting: [
      {
        problem: '"insufficient authentication scopes"',
        solution:
          'Connect ettiğinde Drive izin checkbox\'ını tik\'lememişsindir. Disconnect + Reconnect yap, iki izni de tik\'le.',
      },
    ],
    notes: [
      'Sheets per-Sheet 10M cell hard limit\'i var — büyük crawl\'lar (>500K URL) split edilir.',
      'Drive scope "drive.file" — sadece FreeCrawl tarafından oluşturulan dosyalara erişim, mevcut dosyalarına dokunmaz.',
    ],
    lastReviewed: '2026-06-01',
  },

  bigquery: {
    intro:
      'BigQuery entegrasyonu ile crawl verisini direkt bir BigQuery dataset\'ine stream edersin. Data warehouse\'a tarih bazlı snapshot biriktirmek, BI tool (Looker Studio, Tableau, Metabase) ile crawl trendlerini görselleştirmek için kullanılır.',
    prereqs: [
      'Google Cloud project\'i + BigQuery API enabled.',
      'BigQuery dataset oluşturulmuş.',
      'Service Account JSON (OAuth değil — server-to-server kimlik doğrulama).',
      'Billing açık bir GCP project (BigQuery free tier 10GB storage/ay + 1TB query/ay sonrası ücretli).',
    ],
    steps: [
      {
        title: 'BigQuery dataset oluştur',
        detail: 'BigQuery Console → projeni seç → "Create dataset" → ID: "freecrawl_seo" (veya istediğin) → Location: "EU" veya "US" (önemli, sonradan değişmiyor) → Create dataset.',
        link: { label: 'BigQuery Console', url: 'https://console.cloud.google.com/bigquery' },
      },
      {
        title: 'Service Account oluştur',
        detail: 'IAM & Admin → Service Accounts → "+ Create service account" → name: "freecrawl-bigquery" → Create and continue.',
        link: { label: 'Service Accounts', url: 'https://console.cloud.google.com/iam-admin/serviceaccounts' },
      },
      {
        title: 'Rolleri ekle',
        detail: 'İkinci adımda "Grant this service account access to project" → iki rol ekle:\n• BigQuery Data Editor\n• BigQuery Job User\nSonra "Continue" → "Done".',
      },
      {
        title: 'JSON key indir',
        detail: 'Service account listesinde oluşturduğun account\'a tıkla → "Keys" sekmesi → "Add key" → "Create new key" → Type: JSON → Create.\n\nJSON dosyası otomatik bilgisayara indirilir. İçeriği kopyala (notepad/editör ile aç, tümünü seç ve kopyala).\n\nUYARI: Bu JSON tüm credential\'ı içerir, parola gibi davran. Source control\'a yükleme.',
      },
      {
        title: 'Bu panelin "Service Account JSON" alanına yapıştır',
        detail: 'Tüm JSON içeriği (kapsayıcı `{` dan `}` a kadar) yapıştır. FreeCrawl JSON\'u OS\'un secure credential store\'unda şifreli olarak saklar.',
      },
      {
        title: '"GCP Project ID" alanına project ID\'ni yaz',
        detail: 'GCP project ID\'n (cloud console üst sol dropdown\'da görünür, örn. "my-gcp-project-12345"). JSON içinde "project_id" alanı da var, oradan kopyalayabilirsin.',
      },
      {
        title: 'Dataset adını da gir + Save',
        detail: 'Adım 1\'de oluşturduğun dataset adı (örn. "freecrawl_seo").',
      },
      {
        title: 'Export menüsünden test',
        detail: 'File → Export → "Export to BigQuery" → tablo isim/format seç → çalıştır. BigQuery Console\'dan tablonun oluştuğunu doğrula.',
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
          'JSON\'u kısmen yapıştırmışsındır veya başına/sonuna ekstra karakter eklemişsindir. Service account JSON dosyasını editör ile aç (notepad değil, VS Code önerilir), Ctrl+A → kopyala, FreeCrawl alanına git, mevcut içeriği sil, yapıştır.',
      },
    ],
    notes: [
      'Maliyet: BigQuery free tier (10GB storage + 1TB query/ay) tipik kullanım için yeterli. 1M URL crawl ~500MB, query maliyeti SQL\'inle değişir.',
      'Şema değişiklikleri: FreeCrawl her export\'ta tabloyu otomatik oluşturur/günceller. CrawlUrlRow schema\'sı değişirse export tablosu yeni kolonları otomatik ekler (BigQuery DDL flexibility).',
    ],
    lastReviewed: '2026-06-01',
  },
};

/** Pick the guide for the active locale. Unknown locales fall through to EN. */
function pickGuide(lang: string, integrationId: string): Guide | undefined {
  const normalised = lang.toLowerCase().split('-')[0] ?? '';
  if (normalised === 'tr') return GUIDES_TR[integrationId];
  return GUIDES_EN[integrationId];
}

interface Props {
  open: boolean;
  integration: IntegrationDef | null;
  onClose: () => void;
}

export function IntegrationSetupGuideModal({ open, integration, onClose }: Props) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !integration) return null;
  const guide = pickGuide(i18n.language, integration.id);

  return createPortal(
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-surface-700 bg-surface-900 shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-surface-800 px-4 py-3">
          <div className="flex items-start gap-2">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-accent-300" />
            <div>
              <div className="text-sm font-semibold text-surface-100">
                {t('integrationGuide.title', {
                  defaultValue: '{{name}} — Setup Guide',
                  name: integration.name,
                })}
              </div>
              <div className="text-[11px] text-surface-500">
                {guide
                  ? t('integrationGuide.lastReviewed', {
                      defaultValue: 'Last reviewed {{date}}',
                      date: guide.lastReviewed,
                    })
                  : t('integrationGuide.notAvailable', {
                      defaultValue: 'A guide for this integration is not yet available.',
                    })}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-200"
            title={t('common.close', { defaultValue: 'Close' })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-[12px] text-surface-300">
          {!guide ? (
            <div className="py-8 text-center text-[12px] text-surface-500">
              {t('integrationGuide.fallback', {
                defaultValue:
                  'No detailed guide yet. Click "Get credentials" on the card to open the provider\'s docs.',
              })}
            </div>
          ) : (
            <>
              <p className="mb-4 text-[12px] leading-relaxed text-surface-200">
                {guide.intro}
              </p>

              {guide.prereqs.length > 0 && (
                <section className="mb-4">
                  <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent-300">
                    {t('integrationGuide.prereqs', { defaultValue: 'Prerequisites' })}
                  </h3>
                  <ul className="list-disc space-y-1 pl-5">
                    {guide.prereqs.map((p, i) => (
                      <li key={i} className="text-[12px] leading-relaxed">
                        {p}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="mb-4">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-accent-300">
                  {t('integrationGuide.steps', { defaultValue: 'Step-by-step setup' })}
                </h3>
                <ol className="space-y-3">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500/20 text-[10px] font-mono font-semibold text-accent-300">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-surface-100">{step.title}</div>
                        {step.detail && (
                          <div className="mt-1 whitespace-pre-line text-[11.5px] leading-relaxed text-surface-400">
                            {step.detail}
                          </div>
                        )}
                        {step.link && (
                          <a
                            href={step.link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                          >
                            {step.link.label}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {guide.troubleshooting.length > 0 && (
                <section className="mb-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t('integrationGuide.troubleshooting', { defaultValue: 'Troubleshooting' })}
                  </h3>
                  <ul id="troubleshooting" className="space-y-2">
                    {guide.troubleshooting.map((t, i) => (
                      <li
                        key={i}
                        className="rounded border border-surface-800 bg-surface-950/60 p-2.5"
                      >
                        <div className="text-[11.5px] font-medium text-amber-300">
                          {t.problem}
                        </div>
                        <div className="mt-1 text-[11.5px] leading-relaxed text-surface-400">
                          {t.solution}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {guide.notes && guide.notes.length > 0 && (
                <section className="mb-2">
                  <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                    <Lightbulb className="h-3.5 w-3.5" />
                    {t('integrationGuide.notes', { defaultValue: 'Notes' })}
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-[11.5px] leading-relaxed text-surface-500">
                    {guide.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-surface-800 px-4 py-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-surface-700 px-3 py-1 text-[11px] text-surface-300 hover:bg-surface-800"
          >
            {t('common.close', { defaultValue: 'Close' })}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
