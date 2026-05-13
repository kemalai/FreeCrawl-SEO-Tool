/**
 * Tool definitions and handlers exposed by the FreeCrawl MCP server.
 *
 * The server opens the project DB in read-only mode (see `index.ts`),
 * so it can coexist with the desktop app's writer without contention.
 * SQLite WAL mode permits arbitrary concurrent readers.
 */

import type { ProjectDb } from '@freecrawl/db';
import type { UrlCategory } from '@freecrawl/shared-types';
import { bridgeRequest } from './desktop-bridge.js';

export interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>, db: ProjectDb) => unknown | Promise<unknown>;
  /**
   * Whether this tool needs the project SQLite handle (read-only).
   * Defaults to true. Crawl-control tools that proxy to the desktop
   * bridge over HTTP set this to false so they work even when no
   * `.seoproject` file exists locally yet (e.g. fresh install — only
   * the desktop app has the file). Skipping the session init also
   * avoids opening the DB unnecessarily for one-shot control calls.
   */
  requiresDb?: boolean;
}

const URL_CATEGORY_VALUES: UrlCategory[] = [
  'all',
  'internal:all',
  'internal:html',
  'internal:js',
  'internal:css',
  'internal:image',
  'internal:pdf',
  'internal:font',
  'internal:other',
  'external:all',
  'external:html',
  'external:other',
  'status:2xx',
  'status:3xx',
  'status:4xx',
  'status:5xx',
  'status:no-response',
  'status:blocked-robots',
  'security:https',
  'security:http',
  'indexability:indexable',
  'indexability:non-indexable',
  'indexability:noindex',
  'indexability:canonicalised',
];

const COMMON_URL_FIELDS = [
  'id',
  'url',
  'statusCode',
  'contentKind',
  'indexability',
  'title',
  'titleLength',
  'metaDescription',
  'metaDescriptionLength',
  'h1',
  'h1Count',
  'wordCount',
  'canonical',
  'metaRobots',
  'contentLength',
  'responseTimeMs',
  'depth',
  'inlinks',
  'outlinks',
  'imagesCount',
  'imagesMissingAlt',
  'redirectTarget',
  'crawledAt',
];

function projectFromRow(
  row: Record<string, unknown>,
  fields: string[],
): Record<string, unknown> {
  if (fields.length === 0) {
    const out: Record<string, unknown> = {};
    for (const k of COMMON_URL_FIELDS) out[k] = row[k];
    return out;
  }
  const out: Record<string, unknown> = {};
  for (const k of fields) out[k] = row[k];
  return out;
}

export function buildTools(): Tool[] {
  return [
    {
      name: 'get_summary',
      description:
        'Top-level crawl summary for the active FreeCrawl project: total URLs crawled, indexable/non-indexable counts, status-code distribution, average response time, plus crawl start/end timestamps. Use this first when reporting on a crawl.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: (_args, db) => db.getSummary(),
    },

    {
      name: 'get_overview_counts',
      description:
        'Sidebar overview counts — every category and issue filter the desktop app surfaces, with row counts. Useful to find which issue categories are non-empty before drilling in with query_urls.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: (_args, db) => db.getOverviewCounts(),
    },

    {
      name: 'query_urls',
      description:
        'Paginated query against the URLs table with the same category filter the UI uses. Returns rows + total count. Use `category` to narrow (e.g. "issues:title-missing"), `search` to substring-match URLs/titles, and `limit`/`offset` to page through.',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'UrlCategory filter (e.g. "all", "internal:html", "issues:title-missing", "status:4xx"). Defaults to "all".',
            enum: URL_CATEGORY_VALUES,
          },
          search: {
            type: 'string',
            description: 'Optional substring match against URL and title.',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 500,
            description: 'Max rows to return (1–500). Default 50.',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            description: 'Row offset for pagination. Default 0.',
          },
          sortBy: {
            type: 'string',
            description: 'Column to sort by (e.g. "depth", "responseTimeMs", "inlinks").',
          },
          sortDir: {
            type: 'string',
            enum: ['asc', 'desc'],
            description: 'Sort direction. Default "asc".',
          },
          fields: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Columns to include per row. Empty/omitted → a sensible default subset (URL, status, indexability, title, depth, inlinks, etc.). Use ["*"] for the full row.',
          },
        },
      },
      handler: (args, db) => {
        const category = (args.category as UrlCategory | undefined) ?? 'all';
        const search = typeof args.search === 'string' ? args.search : undefined;
        const limit = Math.min(
          Math.max(typeof args.limit === 'number' ? args.limit : 50, 1),
          500,
        );
        const offset = Math.max(
          typeof args.offset === 'number' ? args.offset : 0,
          0,
        );
        const sortBy = typeof args.sortBy === 'string' ? args.sortBy : undefined;
        const sortDir = args.sortDir === 'desc' ? 'desc' : 'asc';
        const fieldsArg = Array.isArray(args.fields) ? (args.fields as string[]) : [];
        const wantsAll = fieldsArg.length === 1 && fieldsArg[0] === '*';

        const { rows, total } = db.queryUrls({
          category,
          search,
          limit,
          offset,
          sortBy,
          sortDir,
        });
        const projected = wantsAll
          ? rows
          : rows.map((r) =>
              projectFromRow(
                r as unknown as Record<string, unknown>,
                fieldsArg,
              ),
            );
        return { rows: projected, total, limit, offset };
      },
    },

    {
      name: 'get_url_detail',
      description:
        'Full details for one URL: every column, plus inlinks, outlinks, images, and HTTP headers. Pass either `id` (preferred — from query_urls) or `url`.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Numeric URL id from query_urls / get_url_id.',
          },
          url: {
            type: 'string',
            description: 'Exact URL string (slower path — uses an indexed lookup).',
          },
          linkLimit: {
            type: 'integer',
            description: 'Cap on inlinks + outlinks returned. Default 500.',
          },
        },
      },
      handler: (args, db) => {
        let id: number | null = null;
        if (typeof args.id === 'number') {
          id = args.id;
        } else if (typeof args.url === 'string') {
          const found = db.getUrlIdByUrl(args.url);
          if (found === null) {
            throw new Error(`URL not found: ${args.url}`);
          }
          id = found;
        } else {
          throw new Error('get_url_detail requires either `id` or `url`.');
        }
        const linkLimit =
          typeof args.linkLimit === 'number' ? args.linkLimit : 500;
        const detail = db.getUrlDetail(id, linkLimit);
        if (detail === null) {
          throw new Error(`URL id ${id} not found in this project.`);
        }
        return detail;
      },
    },

    // ----- Crawl-control tools (talk to the running desktop app
    // over the localhost bridge — no-op when the desktop is closed)
    {
      requiresDb: false,
      name: 'start_crawl',
      description:
        'Start a crawl in the running FreeCrawl desktop app. The desktop app must be open — this drives the SAME crawler the UI uses, so progress shows up in the app as it runs. `startUrl` is required unless the user has already run a crawl in this session (the last-used start URL is reused). Other config overrides are optional and layered on top of the desktop\'s saved settings.',
      inputSchema: {
        type: 'object',
        properties: {
          startUrl: {
            type: 'string',
            description: 'Seed URL to crawl. Required unless the desktop already has a saved last-used crawl config.',
          },
          configOverrides: {
            type: 'object',
            description: 'Optional whitelisted CrawlConfig overrides. Anything not listed here keeps the desktop user\'s saved value.',
            properties: {
              scope: {
                type: 'string',
                enum: ['subdomain', 'subfolder', 'all-subdomains', 'exact-url'],
              },
              maxDepth: { type: 'integer', minimum: 0 },
              maxUrls: { type: 'integer', minimum: 1 },
              maxConcurrency: { type: 'integer', minimum: 1, maximum: 200 },
              maxRps: { type: 'integer', minimum: 1 },
              crawlDelayMs: { type: 'integer', minimum: 0 },
              requestTimeoutMs: { type: 'integer', minimum: 1000 },
              respectRobotsTxt: { type: 'boolean' },
              followRedirects: { type: 'boolean' },
              crawlExternal: { type: 'boolean' },
              userAgent: { type: 'string' },
              includePatterns: { type: 'array', items: { type: 'string' } },
              excludePatterns: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
      handler: async (args) => {
        const startUrl = typeof args.startUrl === 'string' ? args.startUrl : undefined;
        const configOverrides =
          args.configOverrides && typeof args.configOverrides === 'object'
            ? (args.configOverrides as Record<string, unknown>)
            : undefined;
        return bridgeRequest<{ ok: true; config: unknown }>('POST', '/v1/crawl/start', {
          startUrl,
          configOverrides,
        });
      },
    },

    {
      requiresDb: false,
      name: 'stop_crawl',
      description:
        'Stop the active crawl in the desktop app immediately. Crawled URLs stay in the project DB; pending URLs are dropped. No-op when no crawl is running.',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => bridgeRequest<{ ok: true }>('POST', '/v1/crawl/stop'),
    },

    {
      requiresDb: false,
      name: 'pause_crawl',
      description:
        'Pause the active crawl in the desktop app. The pending queue is preserved — call resume_crawl to continue. No-op when no crawl is running.',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => bridgeRequest<{ ok: true }>('POST', '/v1/crawl/pause'),
    },

    {
      requiresDb: false,
      name: 'resume_crawl',
      description:
        'Resume a paused crawl in the desktop app. No-op when the crawl is already running or no crawl is paused.',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => bridgeRequest<{ ok: true }>('POST', '/v1/crawl/resume'),
    },

    {
      requiresDb: false,
      name: 'get_crawl_progress',
      description:
        'Snapshot of the current crawl progress in the desktop app: discovered / crawled / pending / failed counts, URLs per second, average response time, elapsed time, and running/paused flags. Returns `progress: null` when no crawl has run this session. Poll this every 1–2 s to watch a crawl live; once `running` flips to false the crawl is done.',
      inputSchema: { type: 'object', properties: {} },
      handler: async () =>
        bridgeRequest<{ progress: unknown | null }>('GET', '/v1/crawl/progress'),
    },

    {
      requiresDb: false,
      name: 'get_desktop_project',
      description:
        'Which `.seoproject` the running desktop app currently has open, plus the row count. Use this to confirm the desktop is running and which project the crawl-control tools will affect — it can differ from the file the MCP read-only tools target via `set_project`.',
      inputSchema: { type: 'object', properties: {} },
      handler: async () =>
        bridgeRequest<{ projectPath: string | null; urlsCrawled: number }>('GET', '/v1/project'),
    },

    {
      name: 'top_issues',
      description:
        'Ranked list of non-empty issue categories from get_overview_counts, sorted by count descending. Quick way to ask "what are the biggest problems with this crawl?".',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            description: 'Max categories to return. Default 20.',
            minimum: 1,
            maximum: 200,
          },
        },
      },
      handler: (args, db) => {
        const limit = Math.min(
          Math.max(typeof args.limit === 'number' ? args.limit : 20, 1),
          200,
        );
        const counts = db.getOverviewCounts() as unknown as Record<string, unknown>;
        const issues = (counts.issues as Record<string, number>) ?? {};
        const ranked = Object.entries(issues)
          .filter(([, n]) => n > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map(([category, count]) => ({ category: `issues:${category}`, count }));
        return { issues: ranked };
      },
    },
  ];
}
