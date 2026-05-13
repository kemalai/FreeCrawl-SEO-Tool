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
import { userDataDir } from './project-resolver.js';

const DISCOVERY_FILENAME = 'mcp-bridge.json';

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
): Promise<T> {
  const disc = readDiscovery();
  if (!disc) {
    throw new BridgeUnavailableError(
      'discovery file <userData>/mcp-bridge.json not found',
    );
  }
  const url = `http://127.0.0.1:${disc.port}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${disc.token}`,
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
    const errMsg =
      parsed && typeof parsed === 'object' && 'error' in parsed
        ? String((parsed as { error: unknown }).error)
        : `HTTP ${res.status}`;
    if (res.status === 401) {
      throw new Error(
        `Desktop bridge auth failed (${errMsg}). The token may be stale — ` +
          'this happens when the desktop app was restarted between MCP calls. Retry.',
      );
    }
    throw new Error(`Desktop bridge: ${errMsg}`);
  }

  return parsed as T;
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
