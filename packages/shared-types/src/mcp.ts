/**
 * Faz 5 — MCP client (in-app AI assistant).
 *
 * FreeCrawl already ships an MCP *server* (`apps/mcp-server`) so external
 * agents can read a crawl. This is the mirror image: the desktop app acting
 * as an MCP *client*, so the user can interrogate their own crawl in a chat
 * pane with their own LLM key, and chain in third-party MCP servers (Brave
 * Search, GitHub, an internal enterprise tool) for context the crawl itself
 * does not have.
 *
 * Three moving parts:
 *
 *   1. **Server registry** — `McpServerConfig` rows the user manages in
 *      Settings → MCP Servers. Secret values (env vars, auth headers) are
 *      encrypted at rest with the same `safeStorage` store the integration
 *      credentials use; the renderer only ever sees `SECRET_MASK`.
 *   2. **Connections** — one live JSON-RPC session per enabled server,
 *      stdio (child process) or Streamable HTTP.
 *   3. **Assistant loop** — an LLM turn that may call FreeCrawl's built-in
 *      read-only project tools and any approved MCP tool, feeding results
 *      back until the model answers in prose.
 *
 * Every external tool call is gated by an explicit user decision (allow
 * once / always / deny). Built-in tools are read-only queries against the
 * open project and run without a prompt, but are still logged in the UI.
 */

/** How FreeCrawl talks to one MCP server. */
export type McpTransport = 'stdio' | 'http';

/** Placeholder the main process substitutes for any stored secret value.
 *  A save that echoes this back means "keep what you already have". */
export const MCP_SECRET_MASK = '••••••••';

/** Hard ceiling on registered servers — keeps the picker and the tool
 *  list a human-sized surface, and bounds the child processes we spawn. */
export const MCP_MAX_SERVERS = 12;

/** One MCP server the user has registered. */
export interface McpServerConfig {
  /** Stable slug, also used to namespace the server's tools. */
  id: string;
  /** Display name in the picker. */
  label: string;
  transport: McpTransport;
  /** stdio: executable to spawn (resolved against PATH). */
  command: string;
  /** stdio: argument vector — never a shell string, so nothing is split
   *  or expanded on the user's behalf. */
  args: string[];
  /** stdio: extra environment variables. Values are secrets at rest. */
  env: Record<string, string>;
  /** http: endpoint URL (Streamable HTTP / JSON-RPC over POST). */
  url: string;
  /** http: extra request headers (e.g. `Authorization`). Values are
   *  secrets at rest. */
  headers: Record<string, string>;
  /** Unchecked servers stay registered but are never connected. */
  enabled: boolean;
}

/** Live state of one registered server. */
export interface McpServerStatus {
  id: string;
  connected: boolean;
  /** Present while a connect attempt is in flight. */
  connecting: boolean;
  /** Last failure, cleared on a successful connect. */
  error: string | null;
  /** Tools advertised by the server (0 before the first connect). */
  toolCount: number;
  /** `serverInfo` from the MCP handshake, when connected. */
  serverName: string | null;
  serverVersion: string | null;
  protocolVersion: string | null;
}

/** One tool the assistant can call. */
export interface McpToolInfo {
  /** Owning server id, or `builtin` for FreeCrawl's own project tools. */
  serverId: string;
  /** Tool name as the server spells it. */
  name: string;
  /** Name exposed to the LLM — namespaced so two servers can both ship a
   *  `search` tool without colliding. */
  qualifiedName: string;
  description: string;
  /** JSON Schema for the tool's arguments, as sent by the server. */
  inputSchema: Record<string, unknown>;
}

/**
 * What FreeCrawl does when the assistant wants to call a tool.
 *
 * `ask`    — prompt the user in the chat pane (default for MCP tools)
 * `always` — run it without prompting (user chose "Always allow")
 * `never`  — refuse and tell the model the user denied it
 */
export type McpToolPolicy = 'ask' | 'always' | 'never';

/** A remembered per-tool decision. */
export interface McpToolPolicyEntry {
  serverId: string;
  tool: string;
  policy: McpToolPolicy;
}

// ── Assistant conversation ───────────────────────────────────────────

export type AssistantRole = 'user' | 'assistant' | 'tool';

/** One tool invocation requested by the model. */
export interface AssistantToolCall {
  /** Provider-assigned id — echoed back with the result. */
  id: string;
  /** Qualified tool name (`builtin__query_urls`, `mcp__github__search`). */
  name: string;
  arguments: Record<string, unknown>;
}

/** One message in the conversation. Provider-neutral: the main process
 *  converts this shape into whatever OpenAI / Anthropic / Ollama want. */
export interface AssistantMessage {
  role: AssistantRole;
  content: string;
  /** Set on assistant messages that requested tools. */
  toolCalls?: AssistantToolCall[];
  /** Set on tool messages — which call this answers. */
  toolCallId?: string;
  /** Set on tool messages — for the UI, so a result card can be labelled. */
  toolName?: string;
  /** Tool result that failed (or was denied). */
  isError?: boolean;
  /** Wall-clock duration of a tool call, for the UI. */
  durationMs?: number;
}

/** Live events emitted while a turn runs. */
export type AssistantEvent =
  | { type: 'thinking'; round: number }
  | { type: 'assistant-text'; text: string; toolCalls: AssistantToolCall[] }
  | {
      type: 'tool-approval';
      requestId: string;
      call: AssistantToolCall;
      serverId: string;
      serverLabel: string;
    }
  | { type: 'tool-start'; call: AssistantToolCall }
  | {
      type: 'tool-result';
      callId: string;
      name: string;
      result: string;
      isError: boolean;
      durationMs: number;
    }
  | { type: 'error'; message: string };

/** Why a turn stopped. */
export type AssistantStopReason =
  | 'done'
  | 'cancelled'
  | 'error'
  | 'max-rounds';

export interface AssistantSendInput {
  provider: 'openai' | 'anthropic' | 'ollama';
  /** Empty means "use the provider's default model". */
  model?: string;
  /** Full conversation so far, oldest first, ending with the new user
   *  message. The renderer owns the transcript; the main process owns the
   *  tool loop. */
  messages: AssistantMessage[];
  /** Which registered servers to expose for this turn. */
  serverIds: string[];
  /** Expose FreeCrawl's own read-only project tools (default true). */
  includeBuiltins?: boolean;
}

export interface AssistantSendResult {
  /** Messages produced by this turn, to append to the transcript. */
  messages: AssistantMessage[];
  stopReason: AssistantStopReason;
  error: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  /** Model that actually answered — defaults resolve in the main process. */
  model: string;
}

/** The renderer's answer to a `tool-approval` event. */
export interface AssistantApprovalInput {
  requestId: string;
  decision: 'allow-once' | 'allow-always' | 'deny';
}

/** Result of asking for the tool catalogue of several servers at once.
 *  A server that fails to connect lands in `errors` instead of taking the
 *  whole listing down with it. */
export interface McpToolsListResult {
  tools: McpToolInfo[];
  errors: { id: string; message: string }[];
}
