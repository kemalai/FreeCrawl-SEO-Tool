/**
 * Faz 5 — multi-turn chat with tool calling, for the in-app assistant.
 *
 * `ai-providers.ts` runs one prompt and returns text, which is all the AI
 * tab's per-URL batch needs. The assistant needs the other shape: a running
 * transcript, a tool catalogue, and an answer that may be "call this tool"
 * instead of prose. The three providers spell that differently —
 *
 *   OpenAI     `tools: [{type:'function', function:{…}}]`
 *              → `message.tool_calls[].function.arguments` (a JSON string)
 *   Anthropic  `tools: [{name, description, input_schema}]`
 *              → `content[]` blocks of `{type:'tool_use', id, name, input}`,
 *                results returned as `tool_result` blocks in a user turn
 *   Ollama     OpenAI-shaped tools on `/api/chat`, arguments already parsed
 *
 * — so the conversation is stored once in the provider-neutral
 * `AssistantMessage` shape and converted here, at the edge.
 */
import type {
  AiProvider,
  AssistantMessage,
  AssistantToolCall,
} from '@freecrawl/shared-types';
import { resolveCredentials } from './credentials.js';
import {
  parseArgs,
  toAnthropicMessages,
  toOllamaMessages,
  toOpenAiMessages,
  type AnthropicBlock,
} from './ai-chat-format.js';
import { apiFetch } from './api-fetch.js';

const REQUEST_TIMEOUT_MS = 180_000;
const MAX_TOKENS = 4096;

/** One tool as handed to the model. */
export interface ChatTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ChatTurnResult {
  text: string;
  toolCalls: AssistantToolCall[];
  tokensIn: number | null;
  tokensOut: number | null;
}

export class ChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatError';
  }
}

/** Run one model turn. Returns either prose, tool calls, or both. */
export async function runChatTurn(
  provider: AiProvider,
  model: string,
  system: string,
  messages: AssistantMessage[],
  tools: ChatTool[],
  signal: AbortSignal,
): Promise<ChatTurnResult> {
  switch (provider) {
    case 'openai':
      return runOpenAiChat(model, system, messages, tools, signal);
    case 'anthropic':
      return runAnthropicChat(model, system, messages, tools, signal);
    case 'ollama':
      return runOllamaChat(model, system, messages, tools, signal);
  }
}

// ── OpenAI ───────────────────────────────────────────────────────────

async function runOpenAiChat(
  model: string,
  system: string,
  messages: AssistantMessage[],
  tools: ChatTool[],
  signal: AbortSignal,
): Promise<ChatTurnResult> {
  const apiKey = (resolveCredentials('openai')['apiKey'] ?? '').trim();
  if (!apiKey) {
    throw new ChatError('No OpenAI API key — paste yours in Settings → Integrations.');
  }
  const body: Record<string, unknown> = {
    model,
    messages: toOpenAiMessages(system, messages),
    max_tokens: MAX_TOKENS,
  };
  if (tools.length) {
    body['tools'] = tools.map((t) => ({
      type: 'function',
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));
    body['tool_choice'] = 'auto';
  }
  const res = await apiFetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal: mergeSignals(signal),
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !json) {
    const err = (json?.['error'] as { message?: string } | undefined)?.message;
    throw new ChatError(err ?? `OpenAI API error (HTTP ${res.status})`);
  }
  const choice = (json['choices'] as
    | {
        message?: {
          content?: string | null;
          tool_calls?: {
            id?: string;
            function?: { name?: string; arguments?: string };
          }[];
        };
      }[]
    | undefined)?.[0];
  const calls: AssistantToolCall[] = (choice?.message?.tool_calls ?? []).map((c, i) => ({
    id: c.id ?? `call_${i}`,
    name: c.function?.name ?? '',
    arguments: parseArgs(c.function?.arguments),
  }));
  const usage = json['usage'] as
    | { prompt_tokens?: number; completion_tokens?: number }
    | undefined;
  return {
    text: (choice?.message?.content ?? '').trim(),
    toolCalls: calls.filter((c) => c.name),
    tokensIn: usage?.prompt_tokens ?? null,
    tokensOut: usage?.completion_tokens ?? null,
  };
}

// ── Anthropic ────────────────────────────────────────────────────────

async function runAnthropicChat(
  model: string,
  system: string,
  messages: AssistantMessage[],
  tools: ChatTool[],
  signal: AbortSignal,
): Promise<ChatTurnResult> {
  const apiKey = (resolveCredentials('anthropic')['apiKey'] ?? '').trim();
  if (!apiKey) {
    throw new ChatError('No Anthropic API key — paste yours in Settings → Integrations.');
  }
  const body: Record<string, unknown> = {
    model,
    max_tokens: MAX_TOKENS,
    system,
    messages: toAnthropicMessages(messages),
  };
  if (tools.length) {
    body['tools'] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));
  }
  const res = await apiFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
    signal: mergeSignals(signal),
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !json) {
    const err = (json?.['error'] as { message?: string } | undefined)?.message;
    throw new ChatError(err ?? `Anthropic API error (HTTP ${res.status})`);
  }
  const content = (json['content'] as AnthropicBlock[] | undefined) ?? [];
  const text = content
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('\n')
    .trim();
  const calls: AssistantToolCall[] = content
    .filter((b) => b.type === 'tool_use' && b.name)
    .map((b, i) => ({
      id: b.id ?? `call_${i}`,
      name: b.name as string,
      arguments: (b.input ?? {}) as Record<string, unknown>,
    }));
  const usage = json['usage'] as
    | { input_tokens?: number; output_tokens?: number }
    | undefined;
  return {
    text,
    toolCalls: calls,
    tokensIn: usage?.input_tokens ?? null,
    tokensOut: usage?.output_tokens ?? null,
  };
}

// ── Ollama ───────────────────────────────────────────────────────────

async function runOllamaChat(
  model: string,
  system: string,
  messages: AssistantMessage[],
  tools: ChatTool[],
  signal: AbortSignal,
): Promise<ChatTurnResult> {
  const creds = resolveCredentials('ollama');
  const endpoint =
    (creds['endpoint'] ?? 'http://localhost:11434').trim() || 'http://localhost:11434';
  const body: Record<string, unknown> = {
    model,
    messages: toOllamaMessages(system, messages),
    stream: false,
  };
  if (tools.length) {
    body['tools'] = tools.map((t) => ({
      type: 'function',
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));
  }
  let res: Awaited<ReturnType<typeof apiFetch>>;
  try {
    res = await apiFetch(`${endpoint.replace(/\/+$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: mergeSignals(signal),
    });
  } catch (err) {
    throw new ChatError(
      `Couldn't reach Ollama at ${endpoint}: ${(err as Error).message}`,
    );
  }
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !json) {
    throw new ChatError(
      (json?.['error'] as string | undefined) ?? `Ollama returned HTTP ${res.status}`,
    );
  }
  const message = json['message'] as
    | {
        content?: string;
        tool_calls?: { function?: { name?: string; arguments?: unknown } }[];
      }
    | undefined;
  const calls: AssistantToolCall[] = (message?.tool_calls ?? []).map((c, i) => ({
    id: `call_${Date.now()}_${i}`,
    name: c.function?.name ?? '',
    arguments:
      typeof c.function?.arguments === 'string'
        ? parseArgs(c.function.arguments)
        : ((c.function?.arguments ?? {}) as Record<string, unknown>),
  }));
  return {
    text: (message?.content ?? '').trim(),
    toolCalls: calls.filter((c) => c.name),
    tokensIn:
      typeof json['prompt_eval_count'] === 'number'
        ? (json['prompt_eval_count'] as number)
        : null,
    tokensOut:
      typeof json['eval_count'] === 'number' ? (json['eval_count'] as number) : null,
  };
}

// ── helpers ──────────────────────────────────────────────────────────

/** Cancel on either the caller's signal or our own request ceiling. */
function mergeSignals(signal: AbortSignal): AbortSignal {
  return AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]);
}
