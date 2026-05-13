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
import { JsonRpcServer } from './rpc.js';
import { buildTools, type Tool } from './tools.js';
import { defaultProjectPath, listProjectFiles } from './project-resolver.js';

const SERVER_NAME = 'freecrawl-seo';
const SERVER_VERSION = '0.2.7';
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
  }
  session = openProject(projectPath);
  return session;
}

const tools: Tool[] = [
  ...buildTools(),
  {
    name: 'list_projects',
    description:
      'List `.seoproject` files in the desktop app\'s default projects folder. Returns absolute paths the user can pass to `set_project`.',
    inputSchema: { type: 'object', properties: {} },
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
      'Report which `.seoproject` the MCP server is currently reading from.',
    inputSchema: { type: 'object', properties: {} },
    handler: () => ({ projectPath: getSession().projectPath }),
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
  // `db` is unused when `needsDb` is false; we pass the session's DB
  // when available, else a never-used null cast — type system lets us
  // do this because the handler ignores `db` for those tools.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any = null;
  if (needsDb) {
    db = getSession().db;
  } else if (session) {
    // Re-use an already-open session if there is one (saves opening
    // the DB just to satisfy the param), but don't force-open.
    db = session.db;
  }
  let result: unknown;
  try {
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
