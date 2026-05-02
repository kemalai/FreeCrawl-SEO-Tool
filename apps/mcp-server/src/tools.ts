/**
 * Tool definitions and handlers exposed by the FreeCrawl MCP server.
 *
 * The server opens the project DB in read-only mode (see `index.ts`),
 * so it can coexist with the desktop app's writer without contention.
 * SQLite WAL mode permits arbitrary concurrent readers.
 */

import type { ProjectDb } from '@freecrawl/db';
import type { UrlCategory } from '@freecrawl/shared-types';

export interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>, db: ProjectDb) => unknown | Promise<unknown>;
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
