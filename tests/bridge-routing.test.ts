import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  startMcpBridge,
  stopMcpBridge,
  type McpBridgeDeps,
} from '../apps/desktop/src/main/mcp-bridge.js';

/**
 * Exercises the localhost bridge's HTTP layer end-to-end (auth, header-based
 * session routing, typed error → status mapping, capabilities, session
 * lifecycle dispatch) against fake deps — no Electron, no real crawler.
 */

let dir: string;
let port: number;
let token: string;
const calls: Array<[string, ...unknown[]]> = [];
const sessions = new Map<string, { label: string; doc: string | null }>();
let seq = 0;

const deps: McpBridgeDeps = {
  userDataDir: '', // set in beforeAll
  getCapabilities: () => ({
    bridgeVersion: 2,
    appVersion: '0.10.0',
    features: ['crawl-lease', 'crawl-queue', 'sessions'],
    limits: { maxHeadlessSessions: 3, maxQueueDepth: 4, sessionIdleTtlMs: 1_800_000 },
  }),
  startCrawl: async (input, ctx) => {
    calls.push(['start', ctx.sessionId, ctx.clientId, input.onBusy ?? null]);
    if (input.onBusy === 'reject')
      return { error: 'crawl-in-progress', message: 'busy', details: { sessionId: ctx.sessionId } };
    return {
      ok: true,
      crawlId: 'cr_x',
      sessionId: ctx.sessionId,
      config: { startUrl: input.startUrl ?? '' } as never,
      queued: false,
      waitedMs: 0,
    };
  },
  stopCrawl: (ctx, opts) => {
    calls.push(['stop', ctx.sessionId, opts.force]);
    return { ok: true };
  },
  pauseCrawl: () => ({ ok: true }),
  resumeCrawl: () => ({ ok: true }),
  clearCrawl: async (ctx, opts) => {
    if (ctx.sessionId === 'primary' && !opts.force)
      return { error: 'project-locked', message: 'unsaved work', details: {} };
    return { ok: true };
  },
  hasAction: (name) => name === 'export-csv',
  runAction: async (name, _input, ctx) => {
    calls.push(['action', name, ctx.sessionId]);
    return { session: ctx.sessionId };
  },
  getCrawlProgress: (ctx) => ({
    progress: null,
    crawlId: null,
    sessionId: ctx.sessionId,
    ownerClientId: null,
    ownedByCaller: false,
  }),
  getProjectInfo: (ctx) => ({ projectPath: `/p/${ctx.sessionId}`, urlsCrawled: 0 }),
  listSessions: () => [
    {
      sessionId: 'primary',
      label: 'Primary',
      kind: 'primary',
      documentPath: null,
      dbPath: null,
      urlsCrawled: 0,
      crawl: null,
      ownerClientId: null,
      createdAt: 0,
      lastUsedAt: 0,
    },
    ...[...sessions.entries()].map(([id, s]) => ({
      sessionId: id,
      label: s.label,
      kind: 'headless' as const,
      documentPath: s.doc,
      dbPath: `/db/${id}`,
      urlsCrawled: 0,
      crawl: null,
      ownerClientId: null,
      createdAt: 0,
      lastUsedAt: 0,
    })),
  ],
  createSession: async (input) => {
    const id = `sess_${++seq}`;
    sessions.set(id, { label: input.label ?? `agent-${seq}`, doc: input.projectPath ?? null });
    return {
      sessionId: id,
      dbPath: `/db/${id}`,
      documentPath: input.projectPath ?? null,
      created: true,
      label: input.label ?? `agent-${seq}`,
    };
  },
  closeSession: async (input, ctx) => {
    if (!sessions.has(ctx.sessionId))
      return { error: 'session-not-found', message: 'gone', details: {} };
    sessions.delete(ctx.sessionId);
    return input.save ? { ok: true, savedTo: input.savePath ?? '/s.seoproject' } : { ok: true };
  },
  saveSession: async (input, ctx) => {
    if (!sessions.has(ctx.sessionId))
      return { error: 'session-not-found', message: 'gone', details: {} };
    return { filePath: input.projectPath ?? '/d.seoproject', bytesWritten: 1234 };
  },
  log: () => {},
};

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'fc-bridge-'));
  deps.userDataDir = dir;
  const started = await startMcpBridge(deps);
  if (!started) throw new Error('bridge failed to start');
  port = started.port;
  token = started.token;
  const disc = JSON.parse(readFileSync(join(dir, 'mcp-bridge.json'), 'utf8'));
  expect(disc.version).toBe(2);
});

afterAll(() => {
  stopMcpBridge();
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

const base = () => `http://127.0.0.1:${port}`;
async function req(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  const r = await fetch(base() + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json: unknown = null;
  try {
    json = await r.json();
  } catch {
    /* no body */
  }
  return { status: r.status, body: json as Record<string, unknown> };
}

describe('MCP bridge routing', () => {
  it('rejects a bad token with 401', async () => {
    const r = await fetch(base() + '/v1/capabilities', {
      headers: { Authorization: 'Bearer wrong' },
    });
    expect(r.status).toBe(401);
  });

  it('serves capabilities with the sessions feature', async () => {
    const r = await req('GET', '/v1/capabilities');
    expect(r.status).toBe(200);
    expect(r.body.bridgeVersion).toBe(2);
    expect((r.body.features as string[]).includes('sessions')).toBe(true);
  });

  it('routes a headerless request to the primary session with a null client', async () => {
    const r = await req('POST', '/v1/crawl/start', { startUrl: 'x' });
    expect(r.status).toBe(200);
    expect(r.body.sessionId).toBe('primary');
    expect(calls.at(-1)).toEqual(['start', 'primary', null, null]);
  });

  it('routes by session + client headers', async () => {
    const r = await req(
      'POST',
      '/v1/crawl/start',
      { startUrl: 'y' },
      { 'x-freecrawl-session': 'sess_9', 'x-freecrawl-client': 'clientA' },
    );
    expect(r.status).toBe(200);
    expect(r.body.sessionId).toBe('sess_9');
    expect(calls.at(-1)).toEqual(['start', 'sess_9', 'clientA', null]);
  });

  it('maps crawl-in-progress to 409', async () => {
    const r = await req('POST', '/v1/crawl/start', { onBusy: 'reject' });
    expect(r.status).toBe(409);
    expect(r.body.error).toBe('crawl-in-progress');
  });

  it('guards clear on primary with unsaved work (project-locked 409), overridable by force', async () => {
    const locked = await req('POST', '/v1/crawl/clear', {});
    expect(locked.status).toBe(409);
    expect(locked.body.error).toBe('project-locked');
    const forced = await req('POST', '/v1/crawl/clear', { force: true });
    expect(forced.status).toBe(200);
    expect(forced.body.ok).toBe(true);
  });

  it('propagates the force flag on stop', async () => {
    await req('POST', '/v1/crawl/stop', { force: true }, { 'x-freecrawl-session': 'primary' });
    expect(calls.at(-1)).toEqual(['stop', 'primary', true]);
  });

  it('routes actions to the request session; unknown actions 400', async () => {
    const ok = await req('POST', '/v1/action/export-csv', {}, { 'x-freecrawl-session': 'sess_3' });
    expect(ok.status).toBe(200);
    expect(ok.body.session).toBe('sess_3');
    const bad = await req('POST', '/v1/action/nope', {});
    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe('bad-request');
  });

  it('runs the session create → list → save → close lifecycle', async () => {
    const created = await req('POST', '/v1/session/create', { mode: 'scratch', label: 't' });
    expect(created.status).toBe(200);
    const id = created.body.sessionId as string;
    expect(id.startsWith('sess_')).toBe(true);

    const list = await req('GET', '/v1/session/list');
    expect((list.body.sessions as Array<{ sessionId: string }>).some((s) => s.sessionId === id)).toBe(
      true,
    );

    const saved = await req(
      'POST',
      '/v1/session/save',
      { projectPath: '/x.seoproject' },
      { 'x-freecrawl-session': id },
    );
    expect(saved.body.bytesWritten).toBe(1234);

    const closed = await req(
      'POST',
      '/v1/session/close',
      { save: true, savePath: '/y.seoproject' },
      { 'x-freecrawl-session': id },
    );
    expect(closed.body.savedTo).toBe('/y.seoproject');

    const closedAgain = await req('POST', '/v1/session/close', {}, { 'x-freecrawl-session': id });
    expect(closedAgain.status).toBe(404);
    expect(closedAgain.body.error).toBe('session-not-found');
  });

  it('returns 400 for an unknown route', async () => {
    const r = await req('GET', '/v1/nope');
    expect(r.status).toBe(400);
  });
});
