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

const REQUEST_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_TOKENS = 800;

const DEFAULT_MODELS: Record<AiProvider, string> = {
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

/** Resolve the effective model for a provider — explicit override → user
 *  pref (Ollama only) → built-in default. */
export function resolveModel(provider: AiProvider, override?: string): string {
  if (override && override.trim()) return override.trim();
  if (provider === 'ollama') {
    const pref = (resolveCredentials('ollama')['model'] ?? '').trim();
    if (pref) return pref;
  }
  return DEFAULT_MODELS[provider];
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
  switch (provider) {
    case 'openai':
      return runOpenAi(model, prompt);
    case 'anthropic':
      return runAnthropic(model, prompt);
    case 'ollama':
      return runOllama(model, prompt);
  }
}

// ── OpenAI ───────────────────────────────────────────────────────────

async function runOpenAi(model: string, prompt: string): Promise<AiRunOutput> {
  const apiKey = (resolveCredentials('openai')['apiKey'] ?? '').trim();
  if (!apiKey) {
    throw new AiRunError(
      'No OpenAI API key — paste yours in Settings → Integrations.',
      model,
    );
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
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

async function runAnthropic(model: string, prompt: string): Promise<AiRunOutput> {
  const apiKey = (resolveCredentials('anthropic')['apiKey'] ?? '').trim();
  if (!apiKey) {
    throw new AiRunError(
      'No Anthropic API key — paste yours in Settings → Integrations.',
      model,
    );
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: DEFAULT_MAX_TOKENS,
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

async function runOllama(model: string, prompt: string): Promise<AiRunOutput> {
  const creds = resolveCredentials('ollama');
  const endpoint = (creds['endpoint'] ?? 'http://localhost:11434').trim() || 'http://localhost:11434';
  let res: Response;
  try {
    res = await fetch(`${endpoint.replace(/\/+$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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
