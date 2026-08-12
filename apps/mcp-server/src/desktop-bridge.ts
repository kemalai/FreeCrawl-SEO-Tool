/**
 * Client-side counterpart to `apps/desktop/src/main/mcp-bridge.ts`.
 * Lets the MCP server drive the desktop app's Crawler — start a
 * crawl, pause/resume/stop, poll progress — through the localhost
 * HTTP bridge.
 *
 * Discovery: the desktop app writes
 * `<userData>/mcp-bridge.json` containing `{ port, token, pid }`
 * at launch. This module reads that file on every call so an app
 * restart (new port + token) transparently re-targets — no need to
 * restart the MCP server.
 *
 * Auth: every request carries `Authorization: Bearer <token>`. The
 * desktop server binds to `127.0.0.1` only and the token file lives
 * in the user's profile directory, so a process running as another
 * OS user can neither reach the socket nor read the token.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { BridgeCapabilities } from '@freecrawl/shared-types';
import {
  BRIDGE_CLIENT_HEADER,
  BRIDGE_SESSION_HEADER,
} from '@freecrawl/shared-types';
import { userDataDir } from './project-resolver.js';

const DISCOVERY_FILENAME = 'mcp-bridge.json';

/**
 * Stable per-process id for this MCP server. Every bridge request carries it
 * so the desktop can tell which client owns a crawl lease — one autonomous
 * agent's MCP process is one client. Generated once at import time and never
 * changes for the life of the process.
 */
export const CLIENT_ID = randomUUID();

/**
 * The headless session this MCP process is currently driving, if any. Set by
 * `session_create`, cleared by `session_close`. Every bridge request defaults
 * its session header to this, so once an agent creates a session all of its
 * crawl-control + action tools route there automatically — no per-call
 * plumbing. A null value targets the desktop window (`primary`).
 */
let activeSessionId: string | null = null;

export function setActiveSessionId(id: string | null): void {
  activeSessionId = id;
}

export function getActiveSessionId(): string | null {
  return activeSessionId;
}

interface DiscoveryFile {
  port: number;
  token: string;
  pid: number;
  version: number;
}

export class BridgeUnavailableError extends Error {
  constructor(reason: string) {
    super(
      `FreeCrawl desktop app does not appear to be running (${reason}). ` +
        'Open the desktop app first — it writes the bridge discovery file ' +
        '(<userData>/mcp-bridge.json) on launch.',
    );
    this.name = 'BridgeUnavailableError';
  }
}

/**
 * Read the discovery file the desktop app writes at launch. Returns
 * null when the file is missing (desktop not running) or malformed
 * (treat-as-missing — the next launch will rewrite it).
 */
function readDiscovery(): DiscoveryFile | null {
  const path = join(userDataDir(), DISCOVERY_FILENAME);
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DiscoveryFile>;
    if (
      typeof parsed.port !== 'number' ||
      typeof parsed.token !== 'string' ||
      parsed.token.length < 16
    ) {
      return null;
    }
    return parsed as DiscoveryFile;
  } catch {
    return null;
  }
}

/**
 * Issue a request against the desktop bridge. Throws
 * `BridgeUnavailableError` when the discovery file is missing or the
 * socket refuses; throws a generic Error with the server-supplied
 * `error` field for HTTP-level failures (400/401/404/500). Returns
 * the parsed JSON body on success.
 */
export async function bridgeRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
  opts: { sessionId?: string | null } = {},
): Promise<T> {
  const disc = readDiscovery();
  if (!disc) {
    throw new BridgeUnavailableError(
      'discovery file <userData>/mcp-bridge.json not found',
    );
  }
  const url = `http://127.0.0.1:${disc.port}${path}`;
  // Explicit sessionId wins; otherwise fall back to the active session. Pass
  // `sessionId: null` to force the desktop window (primary) regardless.
  const effectiveSession =
    opts.sessionId !== undefined ? opts.sessionId : activeSessionId;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${disc.token}`,
        [BRIDGE_CLIENT_HEADER]: CLIENT_ID,
        ...(effectiveSession ? { [BRIDGE_SESSION_HEADER]: effectiveSession } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // ECONNREFUSED / network error → desktop crashed or restarted
    // between writing the discovery file and our request. Treat as
    // unavailable; the user fixes it by relaunching the desktop app.
    throw new BridgeUnavailableError(
      `localhost:${disc.port} unreachable (${err instanceof Error ? err.message : String(err)})`,
    );
  }

  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    // Empty / non-JSON body — most error paths produce JSON, so this
    // is unusual but recoverable.
    parsed = null;
  }

  if (!res.ok) {
    const obj =
      parsed && typeof parsed === 'object'
        ? (parsed as { error?: unknown; message?: unknown })
        : null;
    const errCode = obj && 'error' in obj ? String(obj.error) : `HTTP ${res.status}`;
    // Prefer the bridge's agent-facing `message` (protocol v2) — it says what
    // to do next; fall back to the bare error code on a v1 desktop.
    const guidance =
      obj && typeof obj.message === 'string' && obj.message.length > 0
        ? obj.message
        : errCode;
    if (res.status === 401) {
      throw new Error(
        `Desktop bridge auth failed (${errCode}). The token may be stale — ` +
          'this happens when the desktop app was restarted between MCP calls. Retry.',
      );
    }
    throw new Error(`Desktop bridge [${errCode}]: ${guidance}`);
  }

  return parsed as T;
}

/**
 * Cached `GET /v1/capabilities` fetch (60 s TTL). Returns null when the
 * desktop is a v1 build (route 404s) or unreachable — callers degrade
 * gracefully by treating every session feature as unavailable.
 */
let capsCache: { at: number; value: BridgeCapabilities | null } | null = null;
const CAPS_TTL_MS = 60_000;

export async function capabilities(): Promise<BridgeCapabilities | null> {
  const now = Date.now();
  if (capsCache && now - capsCache.at < CAPS_TTL_MS) return capsCache.value;
  let value: BridgeCapabilities | null = null;
  try {
    value = await bridgeRequest<BridgeCapabilities>('GET', '/v1/capabilities');
  } catch {
    // v1 desktop (no such route) or bridge down — remember the miss so we
    // don't hammer it, and let session tools report unsupported-feature.
    value = null;
  }
  capsCache = { at: now, value };
  return value;
}

/** Whether the running desktop advertises a given bridge feature flag. */
export async function hasFeature(name: string): Promise<boolean> {
  const caps = await capabilities();
  return caps?.features.includes(name) ?? false;
}

/**
 * Convenience: report whether the bridge looks reachable without
 * making a network call. Used by tools that want to surface a
 * friendly "open the desktop app" hint up-front before attempting an
 * action.
 */
export function bridgeDiscoveryPresent(): boolean {
  return readDiscovery() !== null;
}
