/**
 * Faz 7 — AI integrations: OpenAI, Anthropic, Ollama.
 *
 * One thin abstraction so the AI tab and batch runner don't have to
 * know which provider they're driving. Each provider exposes the same
 * `runPrompt` shape — give it a prompt, get back text + token counts
 * (when the API reports them). Credentials are resolved here from the
 * encrypted credential store; nothing leaks to the renderer.
 *
 *   OpenAI    — Bearer key, Chat Completions API.
 *   Anthropic — `x-api-key`, Messages API.
 *   Ollama    — local HTTP endpoint, no auth.
 */
import type { AiProvider } from '@freecrawl/shared-types';
import { resolveCredentials } from './credentials.js';
import { apiFetch } from './api-fetch.js';
import { aiProviderSettings, recordAiUsage } from './ai-settings.js';

const REQUEST_TIMEOUT_MS = 120_000;
const MODELS_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_TOKENS = 800;

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5',
  ollama: 'llama3.2',
};

/** Default concurrency per provider — Ollama is local + single-model,
 *  so 1 in flight; cloud providers tolerate a small parallel burst. */
const DEFAULT_CONCURRENCY: Record<AiProvider, number> = {
  openai: 3,
  anthropic: 3,
  ollama: 1,
};

export interface AiRunOutput {
  /** Response text returned by the provider. */
  text: string;
  /** Tokens billed for the prompt — null when the API doesn't report it. */
  tokensIn: number | null;
  /** Tokens billed for the completion — null when not reported. */
  tokensOut: number | null;
  /** The model that produced this response — useful when defaults change. */
  model: string;
}

export class AiRunError extends Error {
  constructor(
    message: string,
    public readonly model: string,
  ) {
    super(message);
    this.name = 'AiRunError';
  }
}

/** Resolve the effective model for a provider — explicit override → the
 *  provider's default model (Model & Prompt settings) → the legacy Ollama
 *  "Model" credential field → built-in default. */
export function resolveModel(provider: AiProvider, override?: string): string {
  if (override && override.trim()) return override.trim();
  const configured = aiProviderSettings(provider).model;
  if (configured) return configured;
  if (provider === 'ollama') {
    const pref = (resolveCredentials('ollama')['model'] ?? '').trim();
    if (pref) return pref;
  }
  return DEFAULT_MODELS[provider];
}

/** Request ceiling for a provider: the Ollama timeout setting, else the default. */
export function providerTimeoutMs(provider: AiProvider, fallbackMs: number): number {
  if (provider !== 'ollama') return fallbackMs;
  const s = aiProviderSettings('ollama').timeoutSeconds;
  return s ? s * 1000 : fallbackMs;
}

function ollamaEndpoint(): string {
  const creds = resolveCredentials('ollama');
  return ((creds['endpoint'] ?? 'http://localhost:11434').trim() || 'http://localhost:11434').replace(
    /\/+$/,
    '',
  );
}

/**
 * The provider's live model list (OpenAI / Anthropic `GET /v1/models`,
 * Ollama `GET /api/tags`). Models get retired and renamed faster than a
 * saved prompt notices, so the AI tab checks the chosen model against
 * this before a batch burns through hundreds of failing requests.
 */
export async function listProviderModels(provider: AiProvider): Promise<string[]> {
  const signal = AbortSignal.timeout(MODELS_TIMEOUT_MS);
  if (provider === 'ollama') {
    const endpoint = ollamaEndpoint();
    let res: Awaited<ReturnType<typeof apiFetch>>;
    try {
      res = await apiFetch(`${endpoint}/api/tags`, { signal });
    } catch (err) {
      throw new AiRunError(
        `Couldn't reach Ollama at ${endpoint}: ${err instanceof Error ? err.message : String(err)}`,
        '',
      );
    }
    const json = (await res.json().catch(() => null)) as { models?: { name?: unknown }[] } | null;
    if (!res.ok || !json) throw new AiRunError(`Ollama returned HTTP ${res.status}`, '');
    return [...new Set((json.models ?? []).map((m) => m.name).filter((n): n is string => typeof n === 'string'))].sort();
  }
  const apiKey = (resolveCredentials(provider)['apiKey'] ?? '').trim();
  if (!apiKey) {
    throw new AiRunError(
      `No ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key — paste yours in Settings → Integrations.`,
      '',
    );
  }
  const ids: string[] = [];
  let afterId: string | null = null;
  // Anthropic pages with `has_more` / `last_id`; OpenAI returns the whole
  // list at once. Ten pages of 1000 is far beyond either catalogue.
  for (let page = 0; page < 10; page++) {
    const url: string =
      provider === 'openai'
        ? 'https://api.openai.com/v1/models'
        : `https://api.anthropic.com/v1/models?limit=1000${afterId ? `&after_id=${encodeURIComponent(afterId)}` : ''}`;
    const headers: Record<string, string> =
      provider === 'openai'
        ? { Authorization: `Bearer ${apiKey}` }
        : { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
    const res = await apiFetch(url, { headers, signal });
    const json = (await res.json().catch(() => null)) as {
      data?: { id?: unknown }[];
      has_more?: unknown;
      last_id?: unknown;
      error?: { message?: string };
    } | null;
    if (!res.ok || !json) {
      throw new AiRunError(json?.error?.message ?? `Model list request failed (HTTP ${res.status})`, '');
    }
    for (const m of json.data ?? []) if (typeof m.id === 'string') ids.push(m.id);
    if (provider !== 'anthropic' || json.has_more !== true || typeof json.last_id !== 'string') break;
    afterId = json.last_id;
  }
  return [...new Set(ids)].sort();
}

export function defaultConcurrency(provider: AiProvider): number {
  return DEFAULT_CONCURRENCY[provider];
}

/** Run one prompt through the selected provider. Throws `AiRunError`
 *  on any failure — the batch runner converts it into a stored error
 *  row so a single bad URL never aborts the whole batch. */
export async function runPrompt(
  provider: AiProvider,
  model: string,
  prompt: string,
): Promise<AiRunOutput> {
  // The provider's system prompt (Model & Prompt settings) rides along on
  // every AI tab prompt: role, tone, constraints set once, not per prompt.
  const system = aiProviderSettings(provider).systemPrompt;
  let out: AiRunOutput;
  switch (provider) {
    case 'openai':
      out = await runOpenAi(model, prompt, system);
      break;
    case 'anthropic':
      out = await runAnthropic(model, prompt, system);
      break;
    case 'ollama':
      out = await runOllama(model, prompt, system);
      break;
  }
  recordAiUsage(provider, out.tokensIn, out.tokensOut);
  return out;
}

// ── OpenAI ───────────────────────────────────────────────────────────

async function runOpenAi(model: string, prompt: string, system: string): Promise<AiRunOutput> {
  const apiKey = (resolveCredentials('openai')['apiKey'] ?? '').trim();
  if (!apiKey) {
    throw new AiRunError(
      'No OpenAI API key — paste yours in Settings → Integrations.',
      model,
    );
  }
  const res = await apiFetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: DEFAULT_MAX_TOKENS,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !json) {
    const err = (json?.['error'] as { message?: string } | undefined)?.message;
    throw new AiRunError(err ?? `OpenAI API error (HTTP ${res.status})`, model);
  }
  const choices = json['choices'] as { message?: { content?: unknown } }[] | undefined;
  const text =
    (choices?.[0]?.message?.content as string | undefined)?.trim() ?? '';
  const usage = json['usage'] as
    | { prompt_tokens?: number; completion_tokens?: number }
    | undefined;
  return {
    text,
    tokensIn: usage?.prompt_tokens ?? null,
    tokensOut: usage?.completion_tokens ?? null,
    model,
  };
}

// ── Anthropic ────────────────────────────────────────────────────────

async function runAnthropic(model: string, prompt: string, system: string): Promise<AiRunOutput> {
  const apiKey = (resolveCredentials('anthropic')['apiKey'] ?? '').trim();
  if (!apiKey) {
    throw new AiRunError(
      'No Anthropic API key — paste yours in Settings → Integrations.',
      model,
    );
  }
  const res = await apiFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: DEFAULT_MAX_TOKENS,
      ...(system ? { system } : {}),
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !json) {
    const err = (json?.['error'] as { message?: string } | undefined)?.message;
    throw new AiRunError(
      err ?? `Anthropic API error (HTTP ${res.status})`,
      model,
    );
  }
  const content = json['content'] as { type?: unknown; text?: unknown }[] | undefined;
  const text =
    content
      ?.filter((c) => c?.type === 'text' && typeof c?.text === 'string')
      .map((c) => c.text as string)
      .join('\n')
      .trim() ?? '';
  const usage = json['usage'] as
    | { input_tokens?: number; output_tokens?: number }
    | undefined;
  return {
    text,
    tokensIn: usage?.input_tokens ?? null,
    tokensOut: usage?.output_tokens ?? null,
    model,
  };
}

// ── Ollama ───────────────────────────────────────────────────────────

async function runOllama(model: string, prompt: string, system: string): Promise<AiRunOutput> {
  const endpoint = ollamaEndpoint();
  let res: Response;
  try {
    res = await apiFetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false, ...(system ? { system } : {}) }),
      signal: AbortSignal.timeout(providerTimeoutMs('ollama', REQUEST_TIMEOUT_MS)),
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : String(err);
    throw new AiRunError(
      `Couldn't reach Ollama at ${endpoint}: ${msg}`,
      model,
    );
  }
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !json) {
    const errMsg =
      (json?.['error'] as string | undefined) ??
      `Ollama returned HTTP ${res.status}`;
    throw new AiRunError(errMsg, model);
  }
  return {
    text: (json['response'] as string | undefined)?.trim() ?? '',
    tokensIn:
      typeof json['prompt_eval_count'] === 'number'
        ? (json['prompt_eval_count'] as number)
        : null,
    tokensOut:
      typeof json['eval_count'] === 'number'
        ? (json['eval_count'] as number)
        : null,
    model,
  };
}
