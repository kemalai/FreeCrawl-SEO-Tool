/**
 * Localhost HTTP bridge between the desktop app and the FreeCrawl MCP
 * server (`@freecrawl/mcp-server`). Lets an MCP client — typically
 * Claude Code or Claude Desktop — drive the desktop app's Crawler:
 * start a crawl, pause/resume/stop it, and poll live progress.
 *
 *   Claude Code  ↔  MCP server  ↔  http://127.0.0.1:<rand>/v1/...
 *                                  ↑
 *                                  desktop main process
 *
 * Design notes:
 *
 *   - Bound to `127.0.0.1` only. No external network exposure.
 *   - Auth via a `Bearer <token>` header. The token is 32 random
 *     bytes hex, written to `userData/mcp-bridge.json` on app launch
 *     and removed on app quit. The file lives in the user's profile
 *     directory whose default ACL already restricts read access to
 *     the user (Windows %APPDATA%, macOS ~/Library, Linux ~/.config),
 *     and we additionally `chmod 600` on POSIX as defence-in-depth.
 *   - Ephemeral random port — `listen(0)` lets the OS pick. The
 *     port + token go into the discovery file so the MCP server can
 *     find them.
 *   - All routes return JSON. Errors carry an `error` field; on
 *     success the relevant data is at the top level.
 *   - The bridge is read-mostly (`GET /v1/crawl/progress`) plus a
 *     handful of POST control endpoints. No long-poll / SSE — MCP
 *     clients poll progress when they want live updates.
 *
 * Endpoints (all under `/v1/`):
 *
 *   POST /v1/crawl/start    — body: { startUrl?, configOverrides? }
 *   POST /v1/crawl/stop
 *   POST /v1/crawl/pause
 *   POST /v1/crawl/resume
 *   POST /v1/crawl/clear
 *   GET  /v1/crawl/progress
 *   GET  /v1/project        — { projectPath, urlsCrawled }
 *   POST /v1/action/<name>  — generic action dispatch; <name> is one of
 *                             the keys registered in `McpBridgeDeps.actions`.
 *                             Body shape per-action; defined by the MCP
 *                             tool contract on the other side.
 *
 * Caller signs every request:
 *   `Authorization: Bearer <token>`
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import { writeFileSync, unlinkSync, chmodSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CrawlConfig, CrawlProgress } from '@freecrawl/shared-types';

/**
 * Functions the bridge needs from the main process. Wired by the
 * caller (`index.ts`) at startup — the bridge module stays
 * decoupled from the global desktop state.
 */
export interface McpBridgeDeps {
  /** Discovery + token directory — usually `app.getPath('userData')`. */
  userDataDir: string;
  /**
   * Kick off a crawl. The caller resolves any defaults/overrides and
   * dispatches the existing crawler IPC pipeline. Returns synchronously
   * once the crawl is launched (not when it finishes).
   */
  startCrawl: (input: McpStartCrawlInput) => Promise<{ ok: true; config: CrawlConfig } | { ok: false; error: string }>;
  stopCrawl: () => void;
  pauseCrawl: () => void;
  resumeCrawl: () => void;
  /**
   * Wipe the URLs table (and all dependent rows — links / images /
   * headers / cookies / sitemap_urls / crawl_queue). Same primitive
   * the desktop's "Clear" button calls. Required because the crawler's
   * resume-vs-fresh decision is "same start URL → keep existing rows"
   * — without an explicit clear, an MCP-driven re-start after a
   * completed crawl finds zero pending work and exits immediately.
   */
  clearCrawl: () => Promise<void>;
  /**
   * Generic action dispatch table — keyed by short kebab-case action
   * name, value is the closure that performs the action. The bridge's
   * `POST /v1/action/<name>` route looks up by name and invokes with
   * the request body. Keeps the bridge route surface flat (one route
   * for N actions) while letting the main process explicitly allow-list
   * which actions MCP can drive. Closures return `unknown` so they can
   * be wired up to any util-function shape; the MCP server is the
   * point that gives each action a typed contract.
   */
  actions: Record<string, (input: unknown) => Promise<unknown>>;
  /**
   * Snapshot of the latest progress event the Crawler emitted. Null
   * when no crawl has ever run in this session. The bridge passes it
   * verbatim to MCP — `running` / `paused` fields are authoritative.
   */
  getProgress: () => CrawlProgress | null;
  /** Absolute path to the active `.seoproject`, or null if none. */
  getProjectPath: () => string | null;
  /** Row count for the active project — useful for confirming the
   * MCP-side read-only view is targetting the same DB. */
  getUrlCount: () => number;
  /** Optional logger (info / warn / error). When omitted, the bridge
   *  swallows internal trace; only HTTP-visible errors propagate. */
  log?: (level: 'info' | 'warn' | 'error', msg: string) => void;
}

/**
 * Fields the MCP server may pass when starting a crawl. Everything is
 * optional except an effective startUrl must exist — either supplied
 * here or already saved in the last-used config. The caller layers
 * these on top of the last-used CrawlConfig and dispatches.
 */
export interface McpStartCrawlInput {
  startUrl?: string;
  /** Whitelisted CrawlConfig field overrides — keeping the contract
   *  narrow so MCP can't smuggle in fields we'd rather validate. */
  configOverrides?: {
    scope?: CrawlConfig['scope'];
    maxDepth?: number;
    maxUrls?: number;
    maxConcurrency?: number;
    maxRps?: number;
    crawlDelayMs?: number;
    requestTimeoutMs?: number;
    respectRobotsTxt?: boolean;
    followRedirects?: boolean;
    crawlExternal?: boolean;
    userAgent?: string;
    includePatterns?: string[];
    excludePatterns?: string[];
  };
}

interface DiscoveryFile {
  port: number;
  token: string;
  pid: number;
  version: 1;
}

const DISCOVERY_FILENAME = 'mcp-bridge.json';

let server: Server | null = null;
let discoveryPath: string | null = null;

/**
 * Open the localhost HTTP bridge and write the discovery file. Resolves
 * with `null` if it could not start (already running, permission denied,
 * listen error, etc.) — non-fatal: the desktop app keeps running, MCP
 * just won't be able to drive a crawl.
 *
 * Async because `server.listen()` is asynchronous: the OS only assigns
 * the ephemeral port after the kernel binds the socket, and calling
 * `server.address()` synchronously right after `.listen()` returns
 * `null`. We resolve on the first `listening` event (or reject-style
 * `null` on `error`) so the discovery file always reflects the real
 * bound port.
 */
export async function startMcpBridge(
  deps: McpBridgeDeps,
): Promise<{ port: number; token: string } | null> {
  if (server) return null; // already started

  const token = randomBytes(32).toString('hex');
  discoveryPath = join(deps.userDataDir, DISCOVERY_FILENAME);

  const log = deps.log ?? (() => undefined);

  const handler = (req: IncomingMessage, res: ServerResponse): void => {
    void handleRequest(req, res, token, deps).catch((err) => {
      log('error', `mcp-bridge request error: ${err instanceof Error ? err.message : String(err)}`);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'internal-error' }));
      }
    });
  };

  const localServer = createServer(handler);
  server = localServer;

  // listen(0, '127.0.0.1') — random ephemeral port on loopback only.
  // The 'listening' event is what tells us the kernel has actually
  // bound the socket; only then does `address()` return the assigned
  // port. Pair with a one-shot 'error' listener so a bind failure
  // (port-exhaustion, permission, etc.) resolves to `null` instead of
  // hanging the promise.
  const listened = await new Promise<boolean>((resolve) => {
    const onError = (err: Error) => {
      log('error', `mcp-bridge listen failed: ${err.message}`);
      localServer.off('listening', onListening);
      resolve(false);
    };
    const onListening = () => {
      localServer.off('error', onError);
      resolve(true);
    };
    localServer.once('error', onError);
    localServer.once('listening', onListening);
    try {
      localServer.listen(0, '127.0.0.1');
    } catch (err) {
      log('error', `mcp-bridge listen threw: ${err instanceof Error ? err.message : String(err)}`);
      localServer.off('listening', onListening);
      localServer.off('error', onError);
      resolve(false);
    }
  });

  if (!listened) {
    server = null;
    return null;
  }

  const addr = localServer.address();
  if (!addr || typeof addr === 'string') {
    log('error', 'mcp-bridge: invalid address after listen');
    try {
      localServer.close();
    } catch {
      /* ignore */
    }
    server = null;
    return null;
  }
  const port = addr.port;

  // Write the discovery file (port + token + pid). The MCP server
  // reads this to find us. We `chmod 600` on POSIX so other local
  // users can't sniff the token — Windows ACLs already restrict
  // the userData directory to the current user.
  const payload: DiscoveryFile = { port, token, pid: process.pid, version: 1 };
  try {
    writeFileSync(discoveryPath, JSON.stringify(payload), { encoding: 'utf8' });
    if (process.platform !== 'win32') {
      try {
        chmodSync(discoveryPath, 0o600);
      } catch {
        /* best-effort — already restrictive enough on most setups */
      }
    }
  } catch (err) {
    log('error', `mcp-bridge: failed to write discovery file: ${err instanceof Error ? err.message : String(err)}`);
    try {
      localServer.close();
    } catch {
      /* ignore */
    }
    server = null;
    discoveryPath = null;
    return null;
  }

  log('info', `mcp-bridge listening on 127.0.0.1:${port}`);
  return { port, token };
}

/**
 * Shut down the bridge and remove the discovery file. Safe to call
 * multiple times. Called on `before-quit`.
 */
export function stopMcpBridge(): void {
  if (server) {
    try {
      server.close();
    } catch {
      /* ignore */
    }
    server = null;
  }
  if (discoveryPath && existsSync(discoveryPath)) {
    try {
      unlinkSync(discoveryPath);
    } catch {
      /* ignore */
    }
  }
  discoveryPath = null;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    // 64 KB cap — config payloads are tiny; this defends against
    // accidental large bodies.
    const MAX_BODY = 64 * 1024;
    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BODY) {
        req.destroy();
        reject(new Error('request body too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (raw === '') {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error(`invalid JSON body: ${err instanceof Error ? err.message : String(err)}`));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function send(res: ServerResponse, status: number, payload: unknown): void {
  if (res.headersSent) return;
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  token: string,
  deps: McpBridgeDeps,
): Promise<void> {
  // 1) Method + path gate — only the small allow-listed routes.
  const url = req.url ?? '';
  const method = req.method ?? 'GET';
  // Strip query string defensively even though we don't use one.
  const path = url.split('?')[0] ?? url;

  // 2) Auth — Bearer token must match exactly. Constant-time-ish
  //    comparison is overkill for a single random secret on
  //    loopback but cheap to do.
  const authHdr = req.headers['authorization'];
  if (typeof authHdr !== 'string' || !authHdr.startsWith('Bearer ')) {
    send(res, 401, { error: 'missing-bearer-token' });
    return;
  }
  const presented = authHdr.slice('Bearer '.length).trim();
  if (presented.length !== token.length || !timingSafeEqual(presented, token)) {
    send(res, 401, { error: 'invalid-token' });
    return;
  }

  // 3) Route — flat switch; the surface is small enough that we don't
  //    need a router library.
  if (method === 'GET' && path === '/v1/crawl/progress') {
    const progress = deps.getProgress();
    send(res, 200, { progress });
    return;
  }
  if (method === 'GET' && path === '/v1/project') {
    send(res, 200, {
      projectPath: deps.getProjectPath(),
      urlsCrawled: deps.getUrlCount(),
    });
    return;
  }
  if (method === 'POST' && path === '/v1/crawl/start') {
    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      send(res, 400, { error: err instanceof Error ? err.message : 'bad-body' });
      return;
    }
    const input = body as McpStartCrawlInput;
    const result = await deps.startCrawl(input);
    if (!result.ok) {
      send(res, 400, { error: result.error });
      return;
    }
    send(res, 200, { ok: true, config: result.config });
    return;
  }
  if (method === 'POST' && path === '/v1/crawl/stop') {
    deps.stopCrawl();
    send(res, 200, { ok: true });
    return;
  }
  if (method === 'POST' && path === '/v1/crawl/pause') {
    deps.pauseCrawl();
    send(res, 200, { ok: true });
    return;
  }
  if (method === 'POST' && path === '/v1/crawl/resume') {
    deps.resumeCrawl();
    send(res, 200, { ok: true });
    return;
  }
  if (method === 'POST' && path === '/v1/crawl/clear') {
    try {
      await deps.clearCrawl();
      send(res, 200, { ok: true });
    } catch (err) {
      send(res, 500, {
        error: err instanceof Error ? err.message : 'clear-failed',
      });
    }
    return;
  }
  if (method === 'POST' && path.startsWith('/v1/action/')) {
    const name = path.slice('/v1/action/'.length);
    const action = deps.actions[name];
    if (!action) {
      send(res, 404, { error: `unknown-action: ${name}` });
      return;
    }
    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      send(res, 400, { error: err instanceof Error ? err.message : 'bad-body' });
      return;
    }
    try {
      const result = await action(body);
      send(res, 200, result === undefined ? { ok: true } : result);
    } catch (err) {
      send(res, 500, {
        error: err instanceof Error ? err.message : 'action-failed',
      });
    }
    return;
  }

  send(res, 404, { error: 'not-found' });
}

/**
 * Constant-time string equality. Avoids a (theoretical) timing oracle
 * leaking the secret one byte at a time — overkill for a localhost
 * secret but trivial to add. Both inputs are already known to be equal
 * length at this point.
 */
function timingSafeEqual(a: string, b: string): boolean {
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
