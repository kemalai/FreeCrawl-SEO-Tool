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
import type {
  BridgeCapabilities,
  BridgeErrorBody,
  BridgeErrorCode,
  BridgeProgressResult,
  BridgeSessionCloseInput,
  BridgeSessionCloseResult,
  BridgeSessionCreateInput,
  BridgeSessionCreateResult,
  BridgeSessionInfo,
  BridgeSessionSaveInput,
  BridgeSessionSaveResult,
  McpStartCrawlInput,
  McpStartCrawlResult,
} from '@freecrawl/shared-types';
import {
  BRIDGE_CLIENT_HEADER,
  BRIDGE_SESSION_HEADER,
  PRIMARY_SESSION_ID,
} from '@freecrawl/shared-types';

/** Which client + session an incoming request is acting on. Parsed from the
 *  `X-FreeCrawl-*` headers; a headerless (v1) request targets `primary` with
 *  a null client so single-client setups keep working unchanged. */
export interface BridgeRequestContext {
  sessionId: string;
  clientId: string | null;
}

/** Either a typed error the route should surface, or a success value `T`. */
export type BridgeResult<T> = T | BridgeErrorBody;

function isBridgeError(v: unknown): v is BridgeErrorBody {
  return (
    typeof v === 'object' &&
    v !== null &&
    'error' in v &&
    'message' in v &&
    typeof (v as { message: unknown }).message === 'string'
  );
}

/** Map each error code to its HTTP status. */
const ERROR_STATUS: Record<BridgeErrorCode, number> = {
  'crawl-in-progress': 409,
  'crawl-not-owned': 409,
  'session-not-found': 404,
  'session-expired': 410,
  'session-limit-reached': 429,
  'project-locked': 409,
  'invalid-project-path': 400,
  'unsupported-feature': 501,
  'queue-timeout': 504,
  'bad-request': 400,
  'internal-error': 500,
};

/**
 * Functions the bridge needs from the main process. Wired by the
 * caller (`index.ts`) at startup — the bridge module stays
 * decoupled from the global desktop state.
 *
 * Protocol v2 (Issue #12): every crawl-control call carries a
 * `BridgeRequestContext` so the main process can route it to the right
 * session and enforce lease ownership. A dep may return a `BridgeErrorBody`
 * instead of its success value; the route surfaces it with the mapped
 * HTTP status.
 */
export interface McpBridgeDeps {
  /** Discovery + token directory — usually `app.getPath('userData')`. */
  userDataDir: string;
  /** Static capabilities snapshot for `GET /v1/capabilities`. */
  getCapabilities: () => BridgeCapabilities;
  /**
   * Kick off a crawl. Resolves defaults/overrides, arbitrates the crawl
   * lease (reject / queue / takeover), and dispatches the crawler pipeline.
   * Resolves once the crawl is launched (not when it finishes), or with a
   * typed error when the slot is busy / the project is locked.
   */
  startCrawl: (
    input: McpStartCrawlInput,
    ctx: BridgeRequestContext,
  ) => Promise<BridgeResult<McpStartCrawlResult>>;
  stopCrawl: (ctx: BridgeRequestContext, opts: { force?: boolean }) => BridgeResult<{ ok: true }>;
  pauseCrawl: (ctx: BridgeRequestContext, opts: { force?: boolean }) => BridgeResult<{ ok: true }>;
  resumeCrawl: (ctx: BridgeRequestContext, opts: { force?: boolean }) => BridgeResult<{ ok: true }>;
  /**
   * Wipe the URLs table (and all dependent rows — links / images /
   * headers / cookies / sitemap_urls / crawl_queue). Same primitive
   * the desktop's "Clear" button calls. Refuses to wipe the desktop
   * window's project when it has unsaved user work unless `force`.
   */
  clearCrawl: (
    ctx: BridgeRequestContext,
    opts: { force?: boolean },
  ) => Promise<BridgeResult<{ ok: true }>>;
  /**
   * Generic action dispatch — `POST /v1/action/<name>` routes here. Split
   * into a membership check and a session-scoped runner so an action's DB
   * reads/writes land on the request's session (a headless agent exports
   * from ITS project, not the desktop window's).
   */
  hasAction: (name: string) => boolean;
  runAction: (
    name: string,
    input: unknown,
    ctx: BridgeRequestContext,
  ) => Promise<unknown>;
  /** Rich progress snapshot for a session: crawl counts + lease ownership. */
  getCrawlProgress: (ctx: BridgeRequestContext) => BridgeProgressResult;
  /** Project path + row count for a session. */
  getProjectInfo: (
    ctx: BridgeRequestContext,
  ) => { projectPath: string | null; urlsCrawled: number };
  /** Enumerate every live session (primary + windows + headless). */
  listSessions?: () => BridgeSessionInfo[];
  /** Create a headless agent session (scratch / open / attach). */
  createSession?: (
    input: BridgeSessionCreateInput,
    ctx: BridgeRequestContext,
  ) => Promise<BridgeResult<BridgeSessionCreateResult>>;
  /** Close (optionally saving) the request's headless session. */
  closeSession?: (
    input: BridgeSessionCloseInput,
    ctx: BridgeRequestContext,
  ) => Promise<BridgeResult<BridgeSessionCloseResult>>;
  /** Save the request's headless session to a `.seoproject`. */
  saveSession?: (
    input: BridgeSessionSaveInput,
    ctx: BridgeRequestContext,
  ) => Promise<BridgeResult<BridgeSessionSaveResult>>;
  /** Optional logger (info / warn / error). When omitted, the bridge
   *  swallows internal trace; only HTTP-visible errors propagate. */
  log?: (level: 'info' | 'warn' | 'error', msg: string) => void;
}

interface DiscoveryFile {
  port: number;
  token: string;
  pid: number;
  version: 2;
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
  const payload: DiscoveryFile = { port, token, pid: process.pid, version: 2 };
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

/** Send a typed error body with the status mapped from its code. */
function sendError(res: ServerResponse, body: BridgeErrorBody): void {
  send(res, ERROR_STATUS[body.error] ?? 500, body);
}

/** Parse the routing headers. Absent session ⇒ `primary`; absent client ⇒
 *  null (a legacy single-client caller), which the lease treats as owner. */
function readContext(req: IncomingMessage): BridgeRequestContext {
  const rawSession = req.headers[BRIDGE_SESSION_HEADER];
  const rawClient = req.headers[BRIDGE_CLIENT_HEADER];
  const sessionId =
    typeof rawSession === 'string' && rawSession.trim() !== ''
      ? rawSession.trim()
      : PRIMARY_SESSION_ID;
  const clientId =
    typeof rawClient === 'string' && rawClient.trim() !== '' ? rawClient.trim() : null;
  return { sessionId, clientId };
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
  //    need a router library. Every crawl-control route resolves the
  //    calling client + session from headers first (v1 callers → primary).
  const ctx = readContext(req);

  if (method === 'GET' && path === '/v1/capabilities') {
    send(res, 200, deps.getCapabilities());
    return;
  }
  if (method === 'GET' && path === '/v1/crawl/progress') {
    send(res, 200, deps.getCrawlProgress(ctx));
    return;
  }
  if (method === 'GET' && path === '/v1/project') {
    send(res, 200, deps.getProjectInfo(ctx));
    return;
  }
  if (method === 'GET' && path === '/v1/session/list') {
    if (!deps.listSessions) {
      sendError(res, {
        error: 'unsupported-feature',
        message: 'Session enumeration is not available on this desktop build.',
      });
      return;
    }
    send(res, 200, { sessions: deps.listSessions() });
    return;
  }
  if (
    method === 'POST' &&
    (path === '/v1/session/create' ||
      path === '/v1/session/close' ||
      path === '/v1/session/save')
  ) {
    const dep =
      path === '/v1/session/create'
        ? deps.createSession
        : path === '/v1/session/close'
          ? deps.closeSession
          : deps.saveSession;
    if (!dep) {
      sendError(res, {
        error: 'unsupported-feature',
        message: 'Headless sessions are not available on this desktop build.',
      });
      return;
    }
    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      sendError(res, {
        error: 'bad-request',
        message: err instanceof Error ? err.message : 'malformed request body',
      });
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await dep(body as any, ctx);
    if (isBridgeError(result)) sendError(res, result);
    else send(res, 200, result);
    return;
  }
  if (method === 'POST' && path === '/v1/crawl/start') {
    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      sendError(res, {
        error: 'bad-request',
        message: err instanceof Error ? err.message : 'malformed request body',
      });
      return;
    }
    const result = await deps.startCrawl(body as McpStartCrawlInput, ctx);
    if (isBridgeError(result)) {
      sendError(res, result);
      return;
    }
    send(res, 200, result);
    return;
  }
  if (
    method === 'POST' &&
    (path === '/v1/crawl/stop' ||
      path === '/v1/crawl/pause' ||
      path === '/v1/crawl/resume' ||
      path === '/v1/crawl/clear')
  ) {
    // These carry an optional `{ force: true }` to override ownership /
    // unsaved-work guards. Body is tiny and optional.
    let body: unknown = {};
    try {
      body = await readJsonBody(req);
    } catch (err) {
      sendError(res, {
        error: 'bad-request',
        message: err instanceof Error ? err.message : 'malformed request body',
      });
      return;
    }
    const force = (body as { force?: unknown }).force === true;
    let result: BridgeResult<{ ok: true }>;
    if (path === '/v1/crawl/stop') result = deps.stopCrawl(ctx, { force });
    else if (path === '/v1/crawl/pause') result = deps.pauseCrawl(ctx, { force });
    else if (path === '/v1/crawl/resume') result = deps.resumeCrawl(ctx, { force });
    else result = await deps.clearCrawl(ctx, { force });
    if (isBridgeError(result)) sendError(res, result);
    else send(res, 200, result);
    return;
  }
  if (method === 'POST' && path.startsWith('/v1/action/')) {
    const name = path.slice('/v1/action/'.length);
    if (!deps.hasAction(name)) {
      sendError(res, {
        error: 'bad-request',
        message: `unknown action: ${name}`,
        details: { action: name },
      });
      return;
    }
    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      sendError(res, {
        error: 'bad-request',
        message: err instanceof Error ? err.message : 'malformed request body',
      });
      return;
    }
    try {
      const result = await deps.runAction(name, body, ctx);
      send(res, 200, result === undefined ? { ok: true } : result);
    } catch (err) {
      sendError(res, {
        error: 'internal-error',
        message: err instanceof Error ? err.message : 'action failed',
        details: { action: name },
      });
    }
    return;
  }

  sendError(res, { error: 'bad-request', message: `no such route: ${method} ${path}` });
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
