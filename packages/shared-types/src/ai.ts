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

/** One AI tab row — a crawled page joined with its latest AI result. */
export interface AiRow {
  url: string;
  statusCode: number | null;
  /** Null when this page has no result for the queried provider. */
  ai: AiResult | null;
}
