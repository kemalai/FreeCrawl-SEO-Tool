/**
 * Faz 7 — AI integrations (OpenAI / Anthropic / Ollama).
 *
 * The three LLM providers all share the same "run a custom prompt
 * against each crawled page" UX, so the renderer drives them through
 * a single `AiTab` and a single set of IPC channels — the only thing
 * that changes per provider is the API client wiring in the main
 * process. Credentials live in the existing encrypted credential
 * store (`openai`, `anthropic`, `ollama` integration ids).
 */

export type AiProvider = 'openai' | 'anthropic' | 'ollama';

/** Per-URL AI result stored in `ai_results`. */
export interface AiResult {
  provider: AiProvider;
  /** Model the response was generated with — for traceability. */
  model: string;
  /** The LLM's response text (or error message when `status === 'error'`). */
  response: string;
  tokensIn: number | null;
  tokensOut: number | null;
  status: 'ok' | 'error';
  error: string | null;
  fetchedAt: string;
}

/**
 * Per-provider behaviour settings (Settings → Integrations → provider →
 * Model & Prompt). Not credentials, so kept apart from the encrypted store.
 */
export interface AiProviderSettings {
  /** Model used when the AI tab / Assistant leaves the model blank. '' = built-in default. */
  model: string;
  /** Sent as the system prompt with every AI tab prompt to this provider. '' = none. */
  systemPrompt: string;
  /** Request timeout in seconds — honoured for Ollama (local models can be slow). Null = default. */
  timeoutSeconds: number | null;
}

/** Running token totals a provider reported, counted on this machine. */
export interface AiUsage {
  requests: number;
  tokensIn: number;
  tokensOut: number;
  /** ISO time the counter started (first request, or the last reset). */
  since: string;
}

export interface AiSettingsState {
  settings: Record<AiProvider, AiProviderSettings>;
  usage: Partial<Record<AiProvider, AiUsage>>;
  /** Built-in default model per provider, for placeholders. */
  defaultModels: Record<AiProvider, string>;
}

/** Live model list check. `model` is the effective model that was checked. */
export type AiModelsResult =
  | { ok: true; model: string; models: string[]; offered: boolean }
  | { ok: false; model: string; error: string };

/**
 * Whether `model` is one the provider currently offers. Accepts the forms a
 * provider resolves on its own: Anthropic aliases (`claude-haiku-4-5` for a
 * listed `claude-haiku-4-5-20251001`) and Ollama's implicit `:latest` tag.
 */
export function aiModelOffered(provider: AiProvider, model: string, models: readonly string[]): boolean {
  const m = model.trim();
  if (!m) return false;
  if (models.includes(m)) return true;
  if (provider === 'ollama') {
    return !m.includes(':') && models.includes(`${m}:latest`);
  }
  if (provider === 'anthropic') {
    return models.some((id) => id.startsWith(`${m}-`) && /^\d{8}$/.test(id.slice(m.length + 1)));
  }
  return false;
}

/** One AI tab row — a crawled page joined with its latest AI result. */
export interface AiRow {
  /** `urls.id` — what the Detail panel opens when the row is clicked. */
  id: number;
  url: string;
  statusCode: number | null;
  /** Null when this page has no result for the queried provider. */
  ai: AiResult | null;
}
