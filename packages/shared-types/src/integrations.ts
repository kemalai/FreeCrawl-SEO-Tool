/**
 * Faz 7 — Integration catalog + credential model.
 *
 * FreeCrawl is a local-first open-source desktop app: there is no
 * FreeCrawl backend, so every integration is connected with the
 * end-user's OWN credentials. Three credential models:
 *
 *  - `api-key`         — paste a provider API key (OpenAI, Ahrefs, …).
 *  - `oauth-byoc`      — "bring your own client": the user creates their
 *                        own Google Cloud OAuth Desktop client and
 *                        pastes the client ID + secret. No FreeCrawl-
 *                        owned OAuth app, no Google verification needed.
 *  - `service-account` — paste a Google service-account JSON key.
 *  - `local`           — no secret; a local endpoint URL (Ollama).
 *
 * Secrets never leave the main process in plaintext — they are
 * encrypted at rest with Electron `safeStorage` (OS-backed: DPAPI /
 * Keychain / libsecret) and only decrypted in-process when an API call
 * actually needs them.
 *
 * This file is the single source of truth for the catalog; the
 * Settings → Integrations panel renders straight from `INTEGRATIONS`.
 */

export type IntegrationAuthType =
  | 'api-key'
  | 'oauth-byoc'
  | 'service-account'
  | 'local';

export type IntegrationCategory = 'ai' | 'seo' | 'google' | 'performance';

/** One credential field a user fills in for an integration. */
export interface IntegrationField {
  /** Storage key — unique within the integration. */
  key: string;
  /** UI label. */
  label: string;
  /**
   * Secret fields are masked in the UI, never echoed back to the
   * renderer once saved, and stored encrypted. Non-secret fields
   * (endpoint URLs, OAuth client IDs) round-trip in plaintext so the
   * user can see and edit them.
   */
  secret: boolean;
  /** Placeholder / example text. */
  placeholder?: string;
  /** When true the field may be left blank. */
  optional?: boolean;
  /** Multi-line input (service-account JSON). */
  multiline?: boolean;
}

export interface IntegrationDef {
  /** Stable id — credential storage key + IPC reference. */
  id: string;
  /** Display name. */
  name: string;
  category: IntegrationCategory;
  authType: IntegrationAuthType;
  /** One-line description of what the integration does. */
  description: string;
  /** Credential fields the user must provide. */
  fields: IntegrationField[];
  /** Where to obtain the credentials — opened in the browser. */
  helpUrl: string;
  /**
   * Short "how to get credentials" hint shown under the card. For
   * `oauth-byoc` this is the BYOC explanation.
   */
  setupHint: string;
}

const KEY_FIELD: IntegrationField = {
  key: 'apiKey',
  label: 'API Key',
  secret: true,
  placeholder: 'Paste your API key',
};

/** OAuth bring-your-own-client field pair (Google Desktop OAuth client). */
const OAUTH_BYOC_FIELDS: IntegrationField[] = [
  {
    key: 'clientId',
    label: 'OAuth Client ID',
    secret: false,
    placeholder: '....apps.googleusercontent.com',
  },
  {
    key: 'clientSecret',
    label: 'OAuth Client Secret',
    secret: true,
    placeholder: 'Paste the client secret',
  },
];

const BYOC_HINT =
  'Create your own OAuth client: Google Cloud Console → APIs & Services → Credentials → Create Credentials → OAuth client ID → Application type "Desktop app". Enable the matching API for the project first, then paste the client ID + secret here.';

/**
 * The integration catalog. Order = display order. Google OAuth-BYOC
 * entries are listed but only become functional once the user pastes
 * their own client credentials.
 */
export const INTEGRATIONS: IntegrationDef[] = [
  // ---- AI ----
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'ai',
    authType: 'api-key',
    description: 'Run a custom prompt per URL — content analysis, title ideas, summaries.',
    fields: [KEY_FIELD],
    helpUrl: 'https://platform.openai.com/api-keys',
    setupHint: 'Create an API key at platform.openai.com → API keys. Usage is billed to your OpenAI account.',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    category: 'ai',
    authType: 'api-key',
    description: 'Run a custom prompt per URL with Claude models.',
    fields: [KEY_FIELD],
    helpUrl: 'https://console.anthropic.com/settings/keys',
    setupHint: 'Create an API key at console.anthropic.com → Settings → API Keys. Usage is billed to your Anthropic account.',
  },
  {
    id: 'ollama',
    name: 'Ollama (local LLM)',
    category: 'ai',
    authType: 'local',
    description: 'Run prompts against a locally-hosted model — no API key, no cost.',
    fields: [
      {
        key: 'endpoint',
        label: 'Ollama endpoint',
        secret: false,
        placeholder: 'http://localhost:11434',
      },
      {
        key: 'model',
        label: 'Model',
        secret: false,
        placeholder: 'llama3.2',
        optional: true,
      },
    ],
    helpUrl: 'https://ollama.com/download',
    setupHint: 'Install Ollama and run a model locally (e.g. `ollama run llama3.2`). The default endpoint is http://localhost:11434.',
  },

  // ---- Performance ----
  {
    id: 'pagespeed',
    name: 'Google PageSpeed Insights',
    category: 'performance',
    authType: 'api-key',
    description: 'Lighthouse audit scores per URL (mobile + desktop).',
    fields: [KEY_FIELD],
    helpUrl: 'https://developers.google.com/speed/docs/insights/v5/get-started',
    setupHint:
      "A free API key is required — Google's keyless shared quota is now 0/day, so anonymous audits no longer work. Create a key in Google Cloud Console (no billing required), enable the PageSpeed Insights API, then paste the key here. Free tier: 25 000 queries/day, 240/min.",
  },
  {
    id: 'crux',
    name: 'Chrome UX Report (CrUX)',
    category: 'performance',
    authType: 'api-key',
    description: 'Real-user field Core Web Vitals per URL (p75 LCP / INP / CLS / FCP / TTFB).',
    fields: [KEY_FIELD],
    helpUrl: 'https://developer.chrome.com/docs/crux/api',
    setupHint:
      'An API key is required (no keyless mode). Create a key in Google Cloud Console (no billing required), enable the "Chrome UX Report API", then paste the key here. A single Google API key can serve both this and PageSpeed Insights once both APIs are enabled. Pages with too little real-user traffic simply return no data.',
  },

  // ---- Content quality ----
  {
    id: 'languagetool',
    name: 'LanguageTool',
    category: 'seo',
    authType: 'local',
    description: 'Spelling, grammar and style checking per page.',
    fields: [
      {
        key: 'endpoint',
        label: 'API endpoint',
        secret: false,
        placeholder: 'https://api.languagetool.org',
        optional: true,
      },
      {
        key: 'username',
        label: 'Premium username',
        secret: false,
        optional: true,
        placeholder: 'Account email (Premium only)',
      },
      {
        key: 'apiKey',
        label: 'Premium API Key',
        secret: true,
        optional: true,
        placeholder: 'Premium API key (optional)',
      },
    ],
    helpUrl: 'https://languagetool.org/http-api/',
    setupHint:
      'Leave everything blank to use the free public API (rate-limited to ~20 requests/min). For unlimited checks, self-host LanguageTool and point the endpoint at it (e.g. http://localhost:8081), or paste a Premium username + API key.',
  },

  // ---- SEO data ----
  {
    id: 'ahrefs',
    name: 'Ahrefs',
    category: 'seo',
    authType: 'api-key',
    description: 'Backlinks, domain rating, referring domains per URL.',
    fields: [KEY_FIELD],
    helpUrl: 'https://ahrefs.com/api',
    setupHint: 'Requires an Ahrefs subscription with API access. Generate a token in your Ahrefs account → API.',
  },
  {
    id: 'majestic',
    name: 'Majestic',
    category: 'seo',
    authType: 'api-key',
    description: 'Trust Flow, Citation Flow, backlink counts.',
    fields: [KEY_FIELD],
    helpUrl: 'https://developer-support.majestic.com/api/',
    setupHint: 'Requires a Majestic subscription. Get your API key from the Majestic developer dashboard.',
  },
  {
    id: 'moz',
    name: 'Moz',
    category: 'seo',
    authType: 'api-key',
    description: 'Domain Authority, Page Authority, Spam Score.',
    fields: [
      { key: 'accessId', label: 'Access ID', secret: false, placeholder: 'Moz Access ID' },
      { key: 'secretKey', label: 'Secret Key', secret: true, placeholder: 'Moz Secret Key' },
    ],
    helpUrl: 'https://moz.com/api',
    setupHint: 'Requires a Moz API subscription. The Access ID + Secret Key are in your Moz account → API.',
  },
  {
    id: 'semrush',
    name: 'Semrush',
    category: 'seo',
    authType: 'api-key',
    description: 'Organic keywords, traffic estimates, SERP features.',
    fields: [KEY_FIELD],
    helpUrl: 'https://www.semrush.com/api-documentation/',
    setupHint: 'Requires a Semrush subscription with API units. Get your API key from Semrush → Subscription info → API.',
  },

  // ---- Google (OAuth bring-your-own-client) ----
  {
    id: 'gsc',
    name: 'Google Search Console',
    category: 'google',
    authType: 'oauth-byoc',
    description: 'Clicks, impressions, CTR, position + URL Inspection per page.',
    fields: OAUTH_BYOC_FIELDS,
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
    setupHint: `${BYOC_HINT} Enable the "Google Search Console API".`,
  },
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    category: 'google',
    authType: 'oauth-byoc',
    description: 'Pageviews, users, engagement, bounce, conversions per URL.',
    fields: OAUTH_BYOC_FIELDS,
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
    setupHint: `${BYOC_HINT} Enable the "Google Analytics Data API".`,
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    category: 'google',
    authType: 'oauth-byoc',
    description: 'Export crawl results straight to a Google Sheet.',
    fields: OAUTH_BYOC_FIELDS,
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
    setupHint: `${BYOC_HINT} Enable the "Google Sheets API".`,
  },
  {
    id: 'bigquery',
    name: 'Google BigQuery',
    category: 'google',
    authType: 'service-account',
    description: 'Stream crawl results into a BigQuery dataset for warehousing.',
    fields: [
      {
        key: 'serviceAccountJson',
        label: 'Service Account JSON',
        secret: true,
        placeholder: 'Paste the full service-account key JSON',
        multiline: true,
      },
      {
        key: 'projectId',
        label: 'GCP Project ID',
        secret: false,
        placeholder: 'my-gcp-project',
      },
    ],
    helpUrl: 'https://cloud.google.com/iam/docs/service-accounts-create',
    setupHint: 'Create a service account in Google Cloud Console with BigQuery Data Editor role, generate a JSON key, and paste it here along with the project ID.',
  },
];

/** Lookup an integration definition by id. */
export function getIntegration(id: string): IntegrationDef | undefined {
  return INTEGRATIONS.find((i) => i.id === id);
}

/**
 * Per-integration credential state sent to the renderer. Secret field
 * values are NEVER included — only a `set` flag — so a configured key
 * can't be read back out of the UI. Non-secret field values round-trip
 * so the user can see/edit them.
 */
export interface IntegrationCredentialState {
  /** True when every required (non-optional) field has a value. */
  configured: boolean;
  /** Per-field state. `value` is '' for secret fields even when set. */
  fields: Record<string, { set: boolean; value: string }>;
}

/** Map of integration id → credential state. */
export type IntegrationsState = Record<string, IntegrationCredentialState>;
