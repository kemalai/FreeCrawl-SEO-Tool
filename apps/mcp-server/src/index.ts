#!/usr/bin/env node
/**
 * FreeCrawl SEO — MCP server (stdio transport, JSON-RPC 2.0).
 *
 * Exposes the active `.seoproject` to MCP-compatible clients (Claude
 * Desktop, Claude Code, …) so an AI agent can run SEO queries against
 * the most recent crawl directly:
 *
 *   - `get_summary`            → headline numbers
 *   - `get_overview_counts`    → sidebar issue/category breakdown
 *   - `top_issues`             → ranked non-empty issue list
 *   - `query_urls`             → paginated category/search/sort
 *   - `get_url_detail`         → full row + inlinks/outlinks/images
 *   - `list_projects`          → enumerate `.seoproject` files
 *   - `set_project`            → switch sessions to a different file
 *
 * The DB connection is read-only (`new ProjectDb(path, { readOnly: true })`)
 * so the desktop app's writer thread can keep operating concurrently —
 * SQLite WAL allows arbitrary concurrent readers.
 */

import fs from 'node:fs';
import { ProjectDb } from '@freecrawl/db';
import { SESSIONS_MIN_APP_VERSION } from '@freecrawl/shared-types';
import type {
  BridgeSessionCreateResult,
  BridgeSessionCloseResult,
  BridgeSessionSaveResult,
  BridgeSessionInfo,
} from '@freecrawl/shared-types';
import { JsonRpcServer } from './rpc.js';
import { buildTools, type Tool } from './tools.js';
import { defaultProjectPath, listProjectFiles } from './project-resolver.js';
import {
  bridgeRequest,
  hasFeature,
  setActiveSessionId,
  getActiveSessionId,
} from './desktop-bridge.js';

const SERVER_NAME = 'freecrawl-seo';
const SERVER_VERSION = '0.8.0';
const PROTOCOL_VERSION = '2024-11-05';

interface Session {
  projectPath: string;
  db: ProjectDb;
}

let session: Session | null = null;

function openProject(projectPath: string): Session {
  if (!fs.existsSync(projectPath)) {
    throw new Error(`Project file does not exist: ${projectPath}`);
  }
  const db = new ProjectDb(projectPath, { readOnly: true });
  return { projectPath, db };
}

function getSession(): Session {
  if (session) return session;
  const initialPath = defaultProjectPath();
  session = openProject(initialPath);
  return session;
}

function setProject(projectPath: string): Session {
  if (session) {
    try {
      session.db.close();
    } catch {
      // best-effort close
    }
    // Null it first so that if openProject throws (missing / corrupt file)
    // we don't leave the session pointing at a now-closed DB handle, which
    // would make every later DB tool fail with "database is not open".
    session = null;
  }
  session = openProject(projectPath);
  return session;
}

/** Drop the read-only DB handle (e.g. after a headless session's working DB
 *  is torn down). The next DB tool reopens the default project lazily. */
function closeReadSession(): void {
  if (session) {
    try {
      session.db.close();
    } catch {
      // best-effort
    }
    session = null;
  }
}

/**
 * Fail a session tool early on a desktop that predates headless sessions,
 * with guidance an agent can act on rather than a raw HTTP error.
 */
async function ensureSessionsSupported(): Promise<void> {
  if (!(await hasFeature('sessions'))) {
    throw new Error(
      `This FreeCrawl desktop build does not support headless agent sessions ` +
        `(needs v${SESSIONS_MIN_APP_VERSION}+). Update the desktop app, or drive the ` +
        `desktop window's project directly with start_crawl (no session).`,
    );
  }
}

const tools: Tool[] = [
  ...buildTools(),
  {
    name: 'list_projects',
    description:
      'List `.seoproject` files in the desktop app\'s default projects folder. Returns absolute paths the user can pass to `set_project`.',
    inputSchema: { type: 'object', properties: {} },
    // Must NOT force-open the default project — on a fresh install (or when
    // only non-default projects exist) that file doesn't exist yet, and
    // requiring it would deadlock: the very tools you'd use to point the
    // session at a valid file would themselves fail to open the missing one.
    requiresDb: false,
    handler: () => {
      const files = listProjectFiles();
      return { files, defaultPath: defaultProjectPath() };
    },
  },
  {
    name: 'set_project',
    description:
      'Switch the active project for this MCP session. Subsequent tool calls hit the new file. Closes the previous DB handle.',
    inputSchema: {
      type: 'object',
      required: ['path'],
      properties: {
        path: {
          type: 'string',
          description: 'Absolute path to a `.seoproject` file.',
        },
      },
    },
    // Opens the *target* file itself; must not first open the default.
    requiresDb: false,
    handler: (args) => {
      const target = args.path;
      if (typeof target !== 'string' || target.trim() === '') {
        throw new Error('set_project requires `path` to be a non-empty string.');
      }
      const next = setProject(target);
      return { ok: true, projectPath: next.projectPath };
    },
  },
  {
    name: 'current_project',
    description:
      'Report which `.seoproject` the MCP server is currently reading from, plus the active agent session id (if any). `mcpReadPath` is the read-only DB the query/report tools hit; `activeSessionId` is the headless session your crawl-control tools write to (null = the desktop window).',
    inputSchema: { type: 'object', properties: {} },
    requiresDb: false,
    // Report the open project without forcing one open — fall back to the
    // default path (which may not exist yet) purely as a hint.
    handler: () => ({
      projectPath: session ? session.projectPath : defaultProjectPath(),
      mcpReadPath: session ? session.projectPath : null,
      activeSessionId: getActiveSessionId(),
    }),
  },

  // ── Headless agent sessions (Issue #12) ────────────────────────────
  {
    name: 'session_create',
    requiresDb: false,
    description:
      'Create your OWN isolated crawl session inside the running desktop app, so several agents can work in parallel without touching each other or the desktop window. `mode:"scratch"` (default) starts an empty project; `mode:"open"` unpacks an existing `.seoproject` to keep working on it (PageSpeed, spelling, exports, re-crawl); `mode:"attach"` reuses the session already bound to that path. Returns a `sessionId` — from here on your start_crawl / query / export tools automatically target this session, and the read-only view is repointed to its live database. Call session_close when done (optionally saving). Requires a desktop build with headless-session support.',
    inputSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['scratch', 'open', 'attach'],
          description: '"scratch" = new empty project (default); "open" = open an existing .seoproject; "attach" = reuse the session already bound to that path.',
        },
        projectPath: {
          type: 'string',
          description: 'Absolute path to a `.seoproject`. Required for mode "open"/"attach".',
        },
        label: {
          type: 'string',
          description: 'Optional human label shown in the app (defaults to agent-N).',
        },
        exclusive: {
          type: 'boolean',
          description: 'For mode "open": fail with project-locked if the file is already open elsewhere instead of sharing it.',
        },
      },
    },
    handler: async (args) => {
      await ensureSessionsSupported();
      const res = await bridgeRequest<BridgeSessionCreateResult>(
        'POST',
        '/v1/session/create',
        {
          mode: typeof args.mode === 'string' ? args.mode : undefined,
          projectPath: typeof args.projectPath === 'string' ? args.projectPath : undefined,
          label: typeof args.label === 'string' ? args.label : undefined,
          exclusive: args.exclusive === true,
        },
        { sessionId: null },
      );
      setActiveSessionId(res.sessionId);
      // Repoint the read-only view at this session's live working DB so the
      // query/report tools read what this session crawls.
      try {
        setProject(res.dbPath);
      } catch {
        // The DB may not be flushed yet on a brand-new scratch session; the
        // first read tool will retry openProject.
      }
      return res;
    },
  },
  {
    name: 'session_close',
    requiresDb: false,
    description:
      'Close your active agent session and free its resources. Set `save:true` (optionally with `savePath`) to persist it to a `.seoproject` first so you can reopen it later with session_create mode:"open". After closing, your tools target the desktop window again until you create another session.',
    inputSchema: {
      type: 'object',
      properties: {
        save: { type: 'boolean', description: 'Persist the session to disk before closing.' },
        savePath: { type: 'string', description: 'Where to save (defaults to the session\'s current document).' },
      },
    },
    handler: async (args) => {
      const id = getActiveSessionId();
      if (!id) {
        throw new Error('No active agent session to close — call session_create first.');
      }
      const res = await bridgeRequest<BridgeSessionCloseResult>(
        'POST',
        '/v1/session/close',
        { save: args.save === true, savePath: typeof args.savePath === 'string' ? args.savePath : undefined },
        { sessionId: id },
      );
      setActiveSessionId(null);
      // The session's working DB is gone now — drop the read handle so the
      // next DB tool reopens the default project instead of a dead file.
      closeReadSession();
      return res;
    },
  },
  {
    name: 'session_save',
    requiresDb: false,
    description:
      'Save your active agent session to a `.seoproject` without closing it — the persistence half of "sessions you can come back to". Defaults to the session\'s current document; pass `projectPath` to write elsewhere.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Destination .seoproject (defaults to the session\'s document).' },
      },
    },
    handler: async (args) => {
      await ensureSessionsSupported();
      const id = getActiveSessionId();
      if (!id) {
        throw new Error('No active agent session to save — call session_create first.');
      }
      return bridgeRequest<BridgeSessionSaveResult>(
        'POST',
        '/v1/session/save',
        { projectPath: typeof args.projectPath === 'string' ? args.projectPath : undefined },
        { sessionId: id },
      );
    },
  },
  {
    name: 'session_list',
    requiresDb: false,
    description:
      'List every live session in the desktop app — the desktop window (`primary`) plus all headless agent sessions — with their project, row count, crawl state and owner. Use it to see what other agents are doing before you start.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const res = await bridgeRequest<{ sessions: BridgeSessionInfo[] }>(
        'GET',
        '/v1/session/list',
        undefined,
        { sessionId: null },
      );
      return { ...res, activeSessionId: getActiveSessionId() };
    },
  },
  {
    name: 'session_status',
    requiresDb: false,
    description:
      'Report your own active agent session: its id, document, live DB path, crawl state and idle time. Returns `activeSessionId: null` when you have not created a session (your tools target the desktop window).',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const id = getActiveSessionId();
      if (!id) {
        return { activeSessionId: null, mcpReadPath: session ? session.projectPath : null, session: null };
      }
      const res = await bridgeRequest<{ sessions: BridgeSessionInfo[] }>(
        'GET',
        '/v1/session/list',
        undefined,
        { sessionId: null },
      );
      const active = res.sessions.find((s) => s.sessionId === id) ?? null;
      return {
        activeSessionId: id,
        mcpReadPath: session ? session.projectPath : null,
        idleForMs: active ? Math.max(0, Date.now() - active.lastUsedAt) : null,
        session: active,
      };
    },
  },
];

const server = new JsonRpcServer();

// ── Required MCP lifecycle methods ───────────────────────────────────

server.on('initialize', (params) => {
  const requestedVersion =
    typeof (params as Record<string, unknown> | undefined)?.protocolVersion === 'string'
      ? ((params as Record<string, string>).protocolVersion)
      : PROTOCOL_VERSION;
  return {
    protocolVersion: requestedVersion,
    capabilities: {
      tools: { listChanged: false },
    },
    serverInfo: {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
  };
});

// MCP clients send `notifications/initialized` after `initialize`. It
// has no `id`, so the JSON-RPC layer won't write a response.
server.on('notifications/initialized', () => undefined);

// ── Tools surface ────────────────────────────────────────────────────

server.on('tools/list', () => ({
  tools: tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.on('tools/call', async (raw) => {
  const params = (raw ?? {}) as { name?: string; arguments?: Record<string, unknown> };
  const name = params.name;
  const args = params.arguments ?? {};
  if (typeof name !== 'string') {
    throw new Error('tools/call requires `name` to be a string.');
  }
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);

  // Most tools need the project DB (read-only). Crawl-control tools
  // proxy to the desktop bridge over HTTP and don't touch the DB, so
  // we skip session init for them — this lets `start_crawl` / etc.
  // work on a fresh install where the local `.seoproject` file doesn't
  // exist yet (only the desktop app has it).
  const needsDb = tool.requiresDb !== false;
  let result: unknown;
  try {
    // `db` is unused when `needsDb` is false; we pass the session's DB
    // when available, else a never-used null cast — the handler ignores it
    // for those tools. Resolving the session INSIDE the try means a failed
    // project open (e.g. a missing/corrupt file) surfaces as a proper tool
    // error (`isError`) instead of a raw JSON-RPC -32000 protocol error.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let db: any = null;
    if (needsDb) {
      db = getSession().db;
    } else if (session) {
      // Re-use an already-open session if there is one (saves opening
      // the DB just to satisfy the param), but don't force-open.
      db = session.db;
    }
    result = await tool.handler(args, db);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      isError: true,
      content: [{ type: 'text', text: msg }],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
      },
    ],
  };
});

// ── Bootstrap ────────────────────────────────────────────────────────

process.on('SIGINT', () => {
  if (session) {
    try {
      session.db.close();
    } catch {
      // best-effort close
    }
  }
  process.exit(0);
});

server.log(`starting ${SERVER_NAME} v${SERVER_VERSION}`);
server.log(`default project: ${defaultProjectPath()}`);
server.start();
