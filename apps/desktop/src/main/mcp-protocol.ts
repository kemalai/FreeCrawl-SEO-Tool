/**
 * Faz 5 — the Electron-free half of the MCP client.
 *
 * `mcp-client.ts` owns processes, sockets and the encrypted registry, all
 * of which need `electron`. The pieces that are pure string handling live
 * here instead: JSON-RPC frame extraction (plain JSON *and* SSE), tool-name
 * namespacing, and Windows executable resolution. Keeping them separate
 * makes them directly testable, which matters because each one is a place
 * where a wrong answer is silent — a missed SSE frame looks like a server
 * that never replied, and an unresolved `npx` looks like a missing package.
 */
import { existsSync } from 'node:fs';
import { delimiter, isAbsolute, join } from 'node:path';

/** Namespace prefix for MCP-provided tools in the LLM's tool list. */
export const MCP_TOOL_PREFIX = 'mcp__';
/** Namespace prefix for FreeCrawl's own project tools. */
export const BUILTIN_TOOL_PREFIX = 'builtin__';
/** Pseudo server id used for FreeCrawl's own tools. */
export const BUILTIN_SERVER_ID = 'builtin';

/** OpenAI and Anthropic both cap a tool name at 64 characters. */
const MAX_TOOL_NAME = 64;

export interface RpcEnvelope {
  id?: number | string | null;
  result?: unknown;
  error?: { message?: string; code?: number };
}

/**
 * Pull the response for `id` out of a Streamable-HTTP body.
 *
 * The transport may answer with a single JSON-RPC object, a batch array,
 * or an SSE stream carrying one frame per `data:` line. Falls back to the
 * first parseable frame when no id matches — a server that echoes a
 * string id where we sent a number should not look like silence.
 */
export function extractJsonRpcMessage(body: string, id: number): RpcEnvelope | null {
  const text = body.trim();
  if (!text) return null;
  if (text.startsWith('{') || text.startsWith('[')) {
    const parsed = JSON.parse(text) as RpcEnvelope | RpcEnvelope[];
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.find((m) => Number(m.id) === id) ?? list[0] ?? null;
  }
  let found: RpcEnvelope | null = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const parsed = JSON.parse(payload) as RpcEnvelope;
      if (Number(parsed.id) === id) return parsed;
      found ??= parsed;
    } catch {
      /* keep scanning — a partial frame is not fatal */
    }
  }
  return found;
}

/** `mcp__<server>__<tool>`, clamped to the provider tool-name limit. */
export function qualifyToolName(serverId: string, tool: string): string {
  const safeTool = tool.replace(/[^A-Za-z0-9_-]/g, '_');
  const name = `${MCP_TOOL_PREFIX}${serverId}__${safeTool}`;
  return name.length <= MAX_TOOL_NAME ? name : name.slice(0, MAX_TOOL_NAME);
}

/** Lowercase slug usable both as a registry key and inside a tool name.
 *  LLM tool names are restricted to `[A-Za-z0-9_-]`, so the id must be too. */
export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

/**
 * Resolve a bare command name to a real executable path.
 *
 * `spawn` without a shell does not apply Windows' PATHEXT rules, so `npx`
 * — which exists on disk as `npx.cmd` — fails with ENOENT; and using
 * `shell: true` instead would re-parse the argument vector and pop a
 * console window. macOS and Linux resolve PATH themselves, so the name is
 * returned untouched there.
 */
export function resolveExecutable(
  command: string,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
  exists: (p: string) => boolean = existsSync,
): string {
  if (platform !== 'win32') return command;
  if (isAbsolute(command) || command.includes('/') || command.includes('\\')) {
    return command;
  }
  const exts = (env['PATHEXT'] ?? '.COM;.EXE;.BAT;.CMD')
    .split(';')
    .map((e) => e.trim())
    .filter(Boolean);
  const dirs = (env['PATH'] ?? '').split(delimiter).filter(Boolean);
  const hasExt = exts.some((e) => command.toLowerCase().endsWith(e.toLowerCase()));
  for (const dir of dirs) {
    if (hasExt) {
      const direct = join(dir, command);
      if (exists(direct)) return direct;
      continue;
    }
    for (const ext of exts) {
      const candidate = join(dir, command + ext);
      if (exists(candidate)) return candidate;
    }
  }
  return command; // Let spawn produce the ENOENT with the original name.
}

/** Truncate a tool result so one huge payload cannot eat the context window. */
export function truncateToolResult(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n… [truncated ${text.length - max} characters]`;
}
