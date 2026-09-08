/**
 * Faz 5 — provider message shapes for the assistant, isolated from IO.
 *
 * The conversation is stored once in the provider-neutral
 * `AssistantMessage` form; each provider then wants something different,
 * and the differences are exactly where a silent bug lives: OpenAI needs a
 * `tool_call_id` on every tool turn, Anthropic rejects a `tool_use` turn
 * that is not answered by a SINGLE user message carrying every
 * `tool_result` block, and Ollama has no call ids at all so the tool name
 * is the only thing tying a result to its request.
 *
 * Kept free of `electron` and `undici` imports so the conversion can be
 * unit-tested without a running app.
 */
import type { AssistantMessage } from '@freecrawl/shared-types';

export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: {
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }[];
  tool_call_id?: string;
}

export function toOpenAiMessages(
  system: string,
  messages: AssistantMessage[],
): OpenAiMessage[] {
  const out: OpenAiMessage[] = [{ role: 'system', content: system }];
  for (const m of messages) {
    if (m.role === 'tool') {
      out.push({
        role: 'tool',
        content: m.content,
        tool_call_id: m.toolCallId ?? '',
      });
      continue;
    }
    if (m.role === 'assistant' && m.toolCalls?.length) {
      out.push({
        role: 'assistant',
        content: m.content,
        tool_calls: m.toolCalls.map((c) => ({
          id: c.id,
          type: 'function' as const,
          function: { name: c.name, arguments: JSON.stringify(c.arguments ?? {}) },
        })),
      });
      continue;
    }
    out.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
  }
  return out;
}

export interface AnthropicBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
  is_error?: boolean;
}

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: AnthropicBlock[];
}

export function toAnthropicMessages(messages: AssistantMessage[]): AnthropicMessage[] {
  const out: AnthropicMessage[] = [];
  for (const m of messages) {
    if (m.role === 'tool') {
      const block: AnthropicBlock = {
        type: 'tool_result',
        tool_use_id: m.toolCallId ?? '',
        content: m.content,
        ...(m.isError ? { is_error: true } : {}),
      };
      // Consecutive tool results belong to ONE user turn — Anthropic
      // rejects a tool_use turn that isn't answered in a single message.
      const last = out[out.length - 1];
      if (last && last.role === 'user' && last.content[0]?.type === 'tool_result') {
        last.content.push(block);
      } else {
        out.push({ role: 'user', content: [block] });
      }
      continue;
    }
    if (m.role === 'assistant') {
      const blocks: AnthropicBlock[] = [];
      if (m.content.trim()) blocks.push({ type: 'text', text: m.content });
      for (const c of m.toolCalls ?? []) {
        blocks.push({ type: 'tool_use', id: c.id, name: c.name, input: c.arguments ?? {} });
      }
      if (blocks.length) out.push({ role: 'assistant', content: blocks });
      continue;
    }
    out.push({ role: 'user', content: [{ type: 'text', text: m.content }] });
  }
  return out;
}

/** Ollama's `/api/chat` shape — OpenAI-like, but without call ids. */
export function toOllamaMessages(
  system: string,
  messages: AssistantMessage[],
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [{ role: 'system', content: system }];
  for (const m of messages) {
    if (m.role === 'tool') {
      // No tool_call_id in Ollama's protocol — name the tool instead so the
      // model can match the result to the call it asked for.
      out.push({ role: 'tool', content: m.content, tool_name: m.toolName ?? '' });
      continue;
    }
    if (m.role === 'assistant' && m.toolCalls?.length) {
      out.push({
        role: 'assistant',
        content: m.content,
        tool_calls: m.toolCalls.map((c) => ({
          function: { name: c.name, arguments: c.arguments ?? {} },
        })),
      });
      continue;
    }
    out.push({ role: m.role, content: m.content });
  }
  return out;
}

/** Parse an OpenAI-style stringified argument blob into an object. */
export function parseArgs(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
