/**
 * Faz 5 — MCP client: FreeCrawl connecting *out* to external MCP servers.
 *
 * The counterpart to `apps/mcp-server` (FreeCrawl as a server). Here the
 * desktop app is the client, so the in-app assistant can chain third-party
 * tools — Brave Search, GitHub, an internal enterprise server — onto the
 * crawl data it already has.
 *
 * Like the server side this is hand-rolled rather than built on
 * `@modelcontextprotocol/sdk`: the surface we need (`initialize`,
 * `tools/list`, `tools/call`) is small and stable, and a dependency-free
 * client keeps the zero-native-module promise intact.
 *
 * Two transports:
 *   - **stdio** — spawn the server as a child process and speak
 *     newline-delimited JSON-RPC over its stdin/stdout. Never through a
 *     shell: the argument vector is passed as an array, and on Windows the
 *     executable is resolved against PATH/PATHEXT ourselves so `npx`
 *     (a `.cmd` shim) works without `shell: true` and its quoting hazards.
 *   - **http** — Streamable HTTP: JSON-RPC over POST, accepting either a
 *     plain JSON response or an SSE stream, and echoing back any
 *     `Mcp-Session-Id` the server assigns.
 *
 * Registry storage: `<userData>/mcp-servers.json`, mode 0600. Env values
 * and auth headers are secrets (an MCP server config is where a GitHub PAT
 * ends up), so they are encrypted at rest with the same `safeStorage`
 * helpers the integration credential store uses, and the renderer only
 * ever sees `MCP_SECRET_MASK`.
 */
import { app } from 'electron';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import {
  MCP_MAX_SERVERS,
  MCP_SECRET_MASK,
  type McpServerConfig,
  type McpServerStatus,
  type McpToolInfo,
  type McpToolPolicy,
} from '@freecrawl/shared-types';
import { decryptString, encryptString } from './credentials.js';
import {
  BUILTIN_SERVER_ID,
  extractJsonRpcMessage,
  qualifyToolName,
  resolveExecutable,
  slugify,
  truncateToolResult,
} from './mcp-protocol.js';
import { apiFetch } from './api-fetch.js';
import * as logger from './logger.js';

/** MCP protocol revision we implement. Servers may answer with their own. */
const PROTOCOL_VERSION = '2024-11-05';
const CLIENT_NAME = 'freecrawl-seo-desktop';

const CONNECT_TIMEOUT_MS = 30_000;
const LIST_TIMEOUT_MS = 30_000;
const CALL_TIMEOUT_MS = 120_000;

/** Tool output handed to an LLM is truncated at this many characters —
 *  an unbounded `tools/call` result would otherwise blow the context
 *  window (and the user's token budget) on one bad call. */
const MAX_TOOL_RESULT_CHARS = 24_000;

// Tool namespacing, JSON-RPC frame extraction and Windows PATH resolution
// live in `mcp-protocol.ts` — pure string handling kept Electron-free so it
// is directly unit-testable. Re-exported so callers have one import site.
export {
  BUILTIN_SERVER_ID,
  BUILTIN_TOOL_PREFIX,
  MCP_TOOL_PREFIX,
  qualifyToolName,
  resolveExecutable,
  slugify,
} from './mcp-protocol.js';

interface StoredServer extends Omit<McpServerConfig, 'env' | 'headers'> {
  /** Encrypted values, keyed by env var / header name. */
  env: Record<string, string>;
  headers: Record<string, string>;
}

interface RegistryFile {
  servers: StoredServer[];
  /** `<serverId>:<tool>` → remembered decision. */
  policies: Record<string, McpToolPolicy>;
}

let registry: RegistryFile | null = null;

function registryPath(): string {
  return join(app.getPath('userData'), 'mcp-servers.json');
}

function loadRegistry(): RegistryFile {
  if (registry) return registry;
  try {
    const p = registryPath();
    if (existsSync(p)) {
      const parsed = JSON.parse(readFileSync(p, 'utf8')) as Partial<RegistryFile>;
      registry = {
        servers: Array.isArray(parsed.servers) ? parsed.servers : [],
        policies:
          parsed.policies && typeof parsed.policies === 'object'
            ? (parsed.policies as Record<string, McpToolPolicy>)
            : {},
      };
      return registry;
    }
  } catch (err) {
    logger.log(
      'warn',
      'mcp',
      `MCP server registry unreadable, starting fresh: ${(err as Error).message}`,
    );
  }
  registry = { servers: [], policies: {} };
  return registry;
}

function persistRegistry(): void {
  try {
    const p = registryPath();
    // 0600 for the same reason credentials.enc.json is: on a Linux box with
    // no keyring the encrypted values degrade to base64.
    writeFileSync(p, JSON.stringify(registry ?? { servers: [], policies: {} }, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });
    if (process.platform !== 'win32') {
      try {
        chmodSync(p, 0o600);
      } catch {
        /* best-effort — a pre-existing file keeps its mode otherwise */
      }
    }
  } catch (err) {
    logger.log('error', 'mcp', `MCP registry write failed: ${(err as Error).message}`);
  }
}

// ── Registry API ─────────────────────────────────────────────────────

/** Server list for the renderer — secret values replaced by the mask. */
export function listServers(): McpServerConfig[] {
  return loadRegistry().servers.map((s) => ({
    id: s.id,
    label: s.label,
    transport: s.transport,
    command: s.command,
    args: [...(s.args ?? [])],
    env: maskValues(s.env),
    url: s.url,
    headers: maskValues(s.headers),
    enabled: s.enabled,
  }));
}

function maskValues(rec: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(rec ?? {})) out[key] = MCP_SECRET_MASK;
  return out;
}

/** Decrypt one stored secret map for actual use. */
function revealValues(rec: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(rec ?? {})) {
    try {
      out[k] = decryptString(v);
    } catch {
      out[k] = '';
    }
  }
  return out;
}

/**
 * Replace the whole registry with what the renderer sent.
 *
 * A value that comes back as `MCP_SECRET_MASK` means "unchanged" — the
 * renderer never received the plaintext, so it cannot echo it. Anything
 * else is a new secret and gets encrypted here.
 */
export function saveServers(incoming: McpServerConfig[]): McpServerConfig[] {
  const reg = loadRegistry();
  const previous = new Map(reg.servers.map((s) => [s.id, s]));
  const seen = new Set<string>();
  const next: StoredServer[] = [];

  for (const raw of incoming.slice(0, MCP_MAX_SERVERS)) {
    const id = slugify(raw.id || raw.label);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const prev = previous.get(id);
    next.push({
      id,
      label: (raw.label || id).slice(0, 60),
      transport: raw.transport === 'http' ? 'http' : 'stdio',
      command: (raw.command ?? '').trim().slice(0, 500),
      args: (raw.args ?? [])
        .map((a) => String(a))
        .filter((a) => a.length > 0)
        .slice(0, 40),
      env: mergeSecrets(raw.env ?? {}, prev?.env ?? {}),
      url: (raw.url ?? '').trim().slice(0, 2000),
      headers: mergeSecrets(raw.headers ?? {}, prev?.headers ?? {}),
      enabled: raw.enabled !== false,
    });
  }

  // A server that disappeared from the list (or was edited) must not keep
  // a live child process around.
  for (const id of previous.keys()) {
    const stillThere = next.find((s) => s.id === id);
    const before = previous.get(id);
    if (!stillThere || !sameConnectionShape(before, stillThere)) {
      void disconnect(id);
    }
  }

  reg.servers = next;
  persistRegistry();
  return listServers();
}

function sameConnectionShape(a: StoredServer | undefined, b: StoredServer): boolean {
  if (!a) return false;
  return (
    a.transport === b.transport &&
    a.command === b.command &&
    a.url === b.url &&
    JSON.stringify(a.args) === JSON.stringify(b.args) &&
    JSON.stringify(a.env) === JSON.stringify(b.env) &&
    JSON.stringify(a.headers) === JSON.stringify(b.headers) &&
    a.enabled === b.enabled
  );
}

function mergeSecrets(
  incoming: Record<string, string>,
  stored: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(incoming)) {
    const name = key.trim();
    if (!name) continue;
    if (value === MCP_SECRET_MASK) {
      const kept = stored[name];
      if (kept !== undefined) out[name] = kept;
      continue;
    }
    out[name] = encryptString(value);
  }
  return out;
}

/** Remembered decision for one tool (`ask` when the user never chose). */
export function policyFor(serverId: string, tool: string): McpToolPolicy {
  return loadRegistry().policies[`${serverId}:${tool}`] ?? 'ask';
}

export function setPolicy(serverId: string, tool: string, policy: McpToolPolicy): void {
  const reg = loadRegistry();
  if (policy === 'ask') delete reg.policies[`${serverId}:${tool}`];
  else reg.policies[`${serverId}:${tool}`] = policy;
  persistRegistry();
}

export function listPolicies(): Record<string, McpToolPolicy> {
  return { ...loadRegistry().policies };
}

// ── Connections ──────────────────────────────────────────────────────

interface Pending {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout;
}

class McpConnection {
  private child: ChildProcess | null = null;
  private buffer = '';
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private httpSessionId: string | null = null;
  private closed = false;

  tools: McpToolInfo[] = [];
  serverName: string | null = null;
  serverVersion: string | null = null;
  protocolVersion: string | null = null;

  constructor(private readonly cfg: StoredServer) {}

  get id(): string {
    return this.cfg.id;
  }

  async connect(): Promise<void> {
    if (this.cfg.transport === 'stdio') await this.spawnChild();
    const init = (await this.request(
      'initialize',
      {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: CLIENT_NAME, version: app.getVersion() },
      },
      CONNECT_TIMEOUT_MS,
    )) as {
      protocolVersion?: string;
      serverInfo?: { name?: string; version?: string };
    };
    this.protocolVersion = init?.protocolVersion ?? null;
    this.serverName = init?.serverInfo?.name ?? null;
    this.serverVersion = init?.serverInfo?.version ?? null;
    // Notification: no id, no response expected.
    this.notify('notifications/initialized', {});
    this.tools = await this.fetchTools();
  }

  private async fetchTools(): Promise<McpToolInfo[]> {
    const out: McpToolInfo[] = [];
    let cursor: string | undefined;
    // Paginated per the MCP spec; cap the walk so a misbehaving server
    // can't spin us forever.
    for (let page = 0; page < 20; page++) {
      const res = (await this.request(
        'tools/list',
        cursor ? { cursor } : {},
        LIST_TIMEOUT_MS,
      )) as {
        tools?: { name?: string; description?: string; inputSchema?: unknown }[];
        nextCursor?: string;
      };
      for (const t of res?.tools ?? []) {
        if (!t?.name) continue;
        out.push({
          serverId: this.cfg.id,
          name: t.name,
          qualifiedName: qualifyToolName(this.cfg.id, t.name),
          description: (t.description ?? '').slice(0, 1000),
          inputSchema:
            t.inputSchema && typeof t.inputSchema === 'object'
              ? (t.inputSchema as Record<string, unknown>)
              : { type: 'object', properties: {} },
        });
      }
      cursor = res?.nextCursor;
      if (!cursor) break;
    }
    return out;
  }

  async callTool(
    tool: string,
    args: Record<string, unknown>,
  ): Promise<{ text: string; isError: boolean }> {
    const res = (await this.request(
      'tools/call',
      { name: tool, arguments: args },
      CALL_TIMEOUT_MS,
    )) as {
      content?: { type?: string; text?: string }[];
      isError?: boolean;
      structuredContent?: unknown;
    };
    const parts = (res?.content ?? [])
      .map((c) => {
        if (c?.type === 'text' && typeof c.text === 'string') return c.text;
        // Images / resources can't be handed to a text-only chat turn —
        // describe them instead of dropping the block silently.
        return c?.type ? `[${c.type} content omitted]` : '';
      })
      .filter(Boolean);
    let text = parts.join('\n').trim();
    if (!text && res?.structuredContent !== undefined) {
      text = JSON.stringify(res.structuredContent);
    }
    if (!text) text = '(tool returned no content)';
    return {
      text: truncateToolResult(text, MAX_TOOL_RESULT_CHARS),
      isError: res?.isError === true,
    };
  }

  dispose(): void {
    this.closed = true;
    for (const [, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(new Error('Connection closed'));
    }
    this.pending.clear();
    if (this.child) {
      try {
        this.child.kill();
      } catch {
        /* already gone */
      }
      this.child = null;
    }
  }

  // ── stdio transport ────────────────────────────────────────────────

  private async spawnChild(): Promise<void> {
    const command = this.cfg.command.trim();
    if (!command) throw new Error('No command configured for this stdio server.');
    const resolved = resolveExecutable(command);
    const env = { ...process.env, ...revealValues(this.cfg.env) };
    let child: ChildProcess;
    try {
      child = spawn(resolved, this.cfg.args, {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        // Never `shell: true` — the args are a vector, and a shell would
        // re-split and expand them (and on Windows open a console window).
        windowsHide: true,
      });
    } catch (err) {
      throw new Error(`Could not start "${command}": ${(err as Error).message}`);
    }
    this.child = child;

    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => this.onStdout(chunk));
    child.stderr?.setEncoding('utf8');
    child.stderr?.on('data', (chunk: string) => {
      const line = String(chunk).trim();
      if (line) logger.log('debug', 'mcp', `[${this.cfg.id}] ${line.slice(0, 500)}`);
    });
    child.on('error', (err) => {
      this.failAll(new Error(`${command}: ${err.message}`));
    });
    child.on('exit', (code, signal) => {
      if (this.closed) return;
      this.failAll(
        new Error(
          `Server process exited (${signal ? `signal ${signal}` : `code ${code}`}).`,
        ),
      );
      connections.delete(this.cfg.id);
    });

    // A command that does not exist fails asynchronously via 'error' on
    // some platforms; give it a tick so connect() reports it properly.
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, 60);
      child.once('error', (err) => {
        clearTimeout(t);
        reject(new Error(`Could not start "${command}": ${err.message}`));
      });
    });
  }

  private onStdout(chunk: string): void {
    this.buffer += chunk;
    let nl: number;
    while ((nl = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, nl).trim();
      this.buffer = this.buffer.slice(nl + 1);
      if (line) this.handleFrame(line);
    }
    // A server that never emits a newline would otherwise grow this
    // buffer without bound.
    if (this.buffer.length > 8 * 1024 * 1024) this.buffer = '';
  }

  private handleFrame(line: string): void {
    let msg: {
      id?: number | string | null;
      result?: unknown;
      error?: { message?: string; code?: number };
    };
    try {
      msg = JSON.parse(line) as typeof msg;
    } catch {
      return; // Non-JSON chatter on stdout — ignore, stderr is the log.
    }
    if (msg.id === undefined || msg.id === null) return; // notification
    const id = typeof msg.id === 'string' ? Number(msg.id) : msg.id;
    const waiting = this.pending.get(id);
    if (!waiting) return;
    this.pending.delete(id);
    clearTimeout(waiting.timer);
    if (msg.error) waiting.reject(new Error(msg.error.message ?? 'MCP error'));
    else waiting.resolve(msg.result);
  }

  private failAll(err: Error): void {
    for (const [, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(err);
    }
    this.pending.clear();
  }

  // ── request plumbing ───────────────────────────────────────────────

  private notify(method: string, params: unknown): void {
    const frame = JSON.stringify({ jsonrpc: '2.0', method, params });
    if (this.cfg.transport === 'stdio') {
      this.child?.stdin?.write(frame + '\n');
    } else {
      void this.httpPost(frame).catch(() => {
        /* notifications are best-effort */
      });
    }
  }

  private request(method: string, params: unknown, timeoutMs: number): Promise<unknown> {
    const id = this.nextId++;
    const frame = JSON.stringify({ jsonrpc: '2.0', id, method, params });
    if (this.cfg.transport === 'http') return this.httpRequest(id, frame, timeoutMs);
    return new Promise((resolve, reject) => {
      const child = this.child;
      if (!child?.stdin?.writable) {
        reject(new Error('Server process is not running.'));
        return;
      }
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${Math.round(timeoutMs / 1000)}s.`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      child.stdin.write(frame + '\n');
    });
  }

  // ── Streamable HTTP transport ──────────────────────────────────────

  private async httpPost(frame: string, timeoutMs = CALL_TIMEOUT_MS): Promise<Response> {
    const url = this.cfg.url.trim();
    if (!/^https?:\/\//i.test(url)) {
      throw new Error('HTTP server URL must start with http:// or https://');
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...revealValues(this.cfg.headers),
    };
    if (this.httpSessionId) headers['Mcp-Session-Id'] = this.httpSessionId;
    const res = await apiFetch(url, {
      method: 'POST',
      headers,
      body: frame,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const session = res.headers.get('mcp-session-id');
    if (session) this.httpSessionId = session;
    return res as unknown as Response;
  }

  private async httpRequest(
    id: number,
    frame: string,
    timeoutMs: number,
  ): Promise<unknown> {
    const res = await this.httpPost(frame, timeoutMs);
    const body = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    const message = extractJsonRpcMessage(body, id);
    if (!message) throw new Error('Server returned no JSON-RPC response.');
    if (message.error) throw new Error(message.error.message ?? 'MCP error');
    return message.result;
  }
}

// ── Connection registry ──────────────────────────────────────────────

const connections = new Map<string, McpConnection>();
const connecting = new Set<string>();
const lastError = new Map<string, string>();

function storedServer(id: string): StoredServer | null {
  return loadRegistry().servers.find((s) => s.id === id) ?? null;
}

/** Connect (or return the existing connection for) one server. */
export async function connect(id: string): Promise<McpServerStatus> {
  const existing = connections.get(id);
  if (existing) return statusOf(id);
  const cfg = storedServer(id);
  if (!cfg) throw new Error(`No MCP server registered with id "${id}".`);
  connecting.add(id);
  const conn = new McpConnection(cfg);
  try {
    await conn.connect();
    connections.set(id, conn);
    lastError.delete(id);
    logger.log(
      'info',
      'mcp',
      `Connected to MCP server "${cfg.label}" (${conn.tools.length} tool(s)).`,
    );
  } catch (err) {
    conn.dispose();
    const msg = (err as Error).message;
    lastError.set(id, msg);
    logger.log('warn', 'mcp', `MCP server "${cfg.label}" failed to connect: ${msg}`);
    throw err;
  } finally {
    connecting.delete(id);
  }
  return statusOf(id);
}

export function disconnect(id: string): void {
  const conn = connections.get(id);
  if (!conn) return;
  conn.dispose();
  connections.delete(id);
}

export function disconnectAll(): void {
  for (const id of [...connections.keys()]) disconnect(id);
}

export function statusOf(id: string): McpServerStatus {
  const conn = connections.get(id);
  return {
    id,
    connected: !!conn,
    connecting: connecting.has(id),
    error: lastError.get(id) ?? null,
    toolCount: conn?.tools.length ?? 0,
    serverName: conn?.serverName ?? null,
    serverVersion: conn?.serverVersion ?? null,
    protocolVersion: conn?.protocolVersion ?? null,
  };
}

export function statuses(): McpServerStatus[] {
  return listServers().map((s) => statusOf(s.id));
}

/** Tools of every requested server, connecting on demand. Servers that
 *  fail are reported through `errors` instead of failing the whole turn —
 *  one broken server must not take the assistant down with it. */
export async function toolsFor(
  ids: string[],
): Promise<{ tools: McpToolInfo[]; errors: { id: string; message: string }[] }> {
  const tools: McpToolInfo[] = [];
  const errors: { id: string; message: string }[] = [];
  for (const id of ids) {
    const cfg = storedServer(id);
    if (!cfg || !cfg.enabled) continue;
    try {
      if (!connections.has(id)) await connect(id);
      tools.push(...(connections.get(id)?.tools ?? []));
    } catch (err) {
      errors.push({ id, message: (err as Error).message });
    }
  }
  return { tools, errors };
}

export async function callTool(
  serverId: string,
  tool: string,
  args: Record<string, unknown>,
): Promise<{ text: string; isError: boolean }> {
  let conn = connections.get(serverId);
  if (!conn) {
    await connect(serverId);
    conn = connections.get(serverId);
  }
  if (!conn) throw new Error(`MCP server "${serverId}" is not connected.`);
  return conn.callTool(tool, args);
}

/** Display label for a server id (falls back to the id itself). */
export function labelFor(serverId: string): string {
  if (serverId === BUILTIN_SERVER_ID) return 'FreeCrawl';
  return storedServer(serverId)?.label ?? serverId;
}
