/**
 * Tool definitions and handlers exposed by the FreeCrawl MCP server.
 *
 * The server opens the project DB in read-only mode (see `index.ts`),
 * so it can coexist with the desktop app's writer without contention.
 * SQLite WAL mode permits arbitrary concurrent readers.
 */

import type { ProjectDb } from '@freecrawl/db';
import type {
  AiProvider,
  SeoProvider,
  UrlCategory,
} from '@freecrawl/shared-types';
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

/**
 * Every per-URL detail tool accepts either an `id` (preferred — cheaper
 * lookup) or a `url` string and resolves to a numeric DB id. Throws when
 * neither is supplied or the URL isn't crawled in the active project.
 */
function resolveUrlId(
  args: Record<string, unknown>,
  db: ProjectDb,
): number {
  if (typeof args.id === 'number') return args.id;
  if (typeof args.url === 'string') {
    const found = db.getUrlIdByUrl(args.url);
    if (found === null) {
      throw new Error(`URL not found in active project: ${args.url}`);
    }
    return found;
  }
  throw new Error('Tool requires either `id` (number) or `url` (string).');
}

/** Sanity-cap a numeric param without falling back to undefined. */
function clamp(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, Math.floor(v)));
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
        'Start a crawl in the running FreeCrawl desktop app. The desktop app must be open — this drives the SAME crawler the UI uses, so progress shows up in the app as it runs. `startUrl` is required unless the user has already run a crawl in this session (the last-used start URL is reused). Other config overrides are optional and layered on top of the desktop\'s saved settings. NOTE: when the previous crawl with the same start URL already completed, the crawler treats this as a resume and exits immediately because every URL is already in the DB. To force a fresh BFS from the seed, call `clear_crawl` first.',
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
      name: 'clear_crawl',
      description:
        'Wipe every URL / link / image / header / cookie / sitemap entry from the active project — the same primitive the desktop "Clear" button calls. Stops any running crawl first. Use this before `start_crawl` when you want a fresh BFS from the seed and the previous crawl with that seed already completed (the crawler treats same-seed re-starts as a resume, so without clearing the new start would no-op). DESTRUCTIVE: there is no undo; the project file ends up empty until the new crawl populates it.',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => bridgeRequest<{ ok: true }>('POST', '/v1/crawl/clear'),
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

    // =================================================================
    // V2 Faz 0.5 Increment 1 — Per-URL detail sub-tab read tools.
    //
    // Most "sub-tabs" in the desktop UI are derivations of two stored
    // primitives: the URL row (column-level aggregates like
    // `schema_block_count`) and the raw page body (`url_sources.body`).
    // The renderer parses the body client-side to surface Resources /
    // Cookies / Structured Data / Outline. For MCP we expose the
    // primitives — an LLM agent can reach into the same body to derive
    // the rest, and we keep the wire surface compact.
    // =================================================================

    {
      name: 'get_url_source',
      description:
        'Raw HTML body (and JS-rendered DOM when JS rendering was on) plus screenshot paths for one URL. Backs the renderer\'s View Source / View Rendered / Screenshot / Resources / Outline / Cookies / Structured Data sub-tabs — those are all derivations of this body. Truncated to 8 MB by the writer-worker; `truncated: true` flags when that cap fired.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'URL id from query_urls (preferred).' },
          url: { type: 'string', description: 'Exact URL string.' },
        },
      },
      handler: (args, db) => {
        const id = resolveUrlId(args, db);
        const source = db.getUrlSource(id);
        if (!source) {
          throw new Error(`No stored body for URL id ${id} — body capture may be disabled or this URL was not HTML.`);
        }
        return source;
      },
    },

    {
      name: 'get_url_inlinks',
      description:
        'Pages that link TO this URL — the reverse-link index. Per-row: from_url, anchor text, rel attribute, position (navigation/header/footer/sidebar/content), link kind (text/image/iframe/...). Useful for "who is linking to this 404?" or "what anchors point to my homepage?".',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          url: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 5000, description: 'Default 500.' },
        },
      },
      handler: (args, db) => {
        const id = resolveUrlId(args, db);
        const row = db.getUrlRowById(id);
        if (!row) throw new Error(`URL id ${id} not found.`);
        const limit = clamp(args.limit, 1, 5000, 500);
        return db.getInlinks(row.url, limit);
      },
    },

    {
      name: 'get_url_outlinks',
      description:
        'Links FROM this page (both internal and external). Same per-row shape as get_url_inlinks but from the source-page perspective. Use this to audit a page\'s outbound link strategy or find broken outlinks.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          url: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 5000, description: 'Default 500.' },
        },
      },
      handler: (args, db) => {
        const id = resolveUrlId(args, db);
        const limit = clamp(args.limit, 1, 5000, 500);
        return db.getOutlinks(id, limit);
      },
    },

    {
      name: 'get_url_images',
      description:
        'Every <img> referenced by this page — src, alt, intrinsic width/height, byte_size (from the post-crawl HEAD probe), is_internal flag. Use to audit per-page image weight or missing-alt distribution.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          url: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 10_000, description: 'Default 5000.' },
        },
      },
      handler: (args, db) => {
        const id = resolveUrlId(args, db);
        const limit = clamp(args.limit, 1, 10_000, 5000);
        return { rows: db.pageImagesDetailed(id, limit) };
      },
    },

    {
      name: 'get_url_headers',
      description:
        'Every response header captured for this URL. Same data the Detail panel\'s "HTTP Headers" sub-tab shows. Sorted alphabetically; multi-valued headers appear as separate rows.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          url: { type: 'string' },
        },
      },
      handler: (args, db) => {
        const id = resolveUrlId(args, db);
        return { rows: db.getUrlHeaders(id) };
      },
    },

    {
      name: 'get_url_duplicates',
      description:
        'Other URLs in the same near-duplicate SimHash cluster as the queried URL, sorted by Hamming distance ascending (closest matches first). Empty result means the URL is a singleton OR Crawl Analysis has not run yet — run it from the desktop first.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          url: { type: 'string' },
        },
      },
      handler: (args, db) => {
        const id = resolveUrlId(args, db);
        return { rows: db.urlClusterMembers(id) };
      },
    },

    {
      name: 'get_url_analytics',
      description:
        'GSC + GA4 + PageSpeed + AI roll-up for one URL: clicks/impressions/CTR/position (GSC), sessions/users/bounceRate (GA4), lab scores + Core Web Vitals (PageSpeed), provider-specific AI verdict. Returns null fields for integrations that have not been fetched yet.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          url: { type: 'string' },
        },
      },
      handler: (args, db) => {
        const id = resolveUrlId(args, db);
        const row = db.getUrlRowById(id);
        if (!row) throw new Error(`URL id ${id} not found.`);
        return db.getUrlAnalytics(row.url);
      },
    },

    {
      name: 'get_url_cert',
      description:
        'TLS certificate details for the host of the given URL (from the per-host cert probe). Issuer, subject, validity dates, days-until-expiry, signature algorithm, chain length. Returns null when the host was not probed (HTTP-only or probe failed).',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          url: { type: 'string' },
        },
      },
      handler: (args, db) => {
        const id = resolveUrlId(args, db);
        return db.getHostCertForUrl(id);
      },
    },

    // =================================================================
    // V2 Faz 0.5 Increment 1 — Integration row query tools. Each mirrors
    // a desktop tab (Search Console / GA4 / PageSpeed / AI / SEO
    // Authority). Pagination follows the same shape as query_urls so
    // an agent can scan large result sets in batches.
    // =================================================================

    {
      name: 'query_gsc',
      description:
        'Search Console rows: clicks, impressions, CTR, average position per crawled page. Returns null per-URL when the URL has not been pulled from GSC yet (configure the integration in Settings → Integrations → Search Console).',
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          filter: {
            type: 'string',
            enum: ['all', 'with-data', 'without-data'],
            description: '`with-data` = pages that have GSC rows; `without-data` = pages NOT yet pulled from GSC. Default "all".',
          },
          limit: { type: 'integer', minimum: 1, maximum: 1000 },
          offset: { type: 'integer', minimum: 0 },
        },
      },
      handler: (args, db) =>
        db.queryGsc({
          limit: clamp(args.limit, 1, 1000, 50),
          offset: clamp(args.offset, 0, 10_000_000, 0),
          search: typeof args.search === 'string' ? args.search : undefined,
          filter: args.filter as 'all' | 'with-data' | 'without-data' | undefined,
        }),
    },

    {
      name: 'query_ga4',
      description:
        'GA4 rows: sessions, users, bounceRate, engagementRate per crawled page. Configure the integration in Settings → Integrations → GA4 to populate.',
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          filter: {
            type: 'string',
            enum: ['all', 'with-data', 'without-data'],
          },
          limit: { type: 'integer', minimum: 1, maximum: 1000 },
          offset: { type: 'integer', minimum: 0 },
        },
      },
      handler: (args, db) =>
        db.queryGa4({
          limit: clamp(args.limit, 1, 1000, 50),
          offset: clamp(args.offset, 0, 10_000_000, 0),
          search: typeof args.search === 'string' ? args.search : undefined,
          filter: args.filter as 'all' | 'with-data' | 'without-data' | undefined,
        }),
    },

    {
      name: 'query_pagespeed',
      description:
        'PageSpeed Insights rows: lab perf/SEO/a11y scores, Core Web Vitals (LCP/CLS/INP/FCP/TTFB), opportunities. Populate via Settings → Integrations → PageSpeed Insights, then run a batch from the desktop.',
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          filter: {
            type: 'string',
            enum: ['all', 'tested', 'untested'],
          },
          limit: { type: 'integer', minimum: 1, maximum: 1000 },
          offset: { type: 'integer', minimum: 0 },
        },
      },
      handler: (args, db) =>
        db.queryPagespeed({
          limit: clamp(args.limit, 1, 1000, 50),
          offset: clamp(args.offset, 0, 10_000_000, 0),
          search: typeof args.search === 'string' ? args.search : undefined,
          filter: args.filter as 'all' | 'tested' | 'untested' | undefined,
        }),
    },

    {
      name: 'query_ai',
      description:
        'AI batch results per URL for a single provider (openai / anthropic / ollama). Configure provider + run a batch from Settings → AI to populate.',
      inputSchema: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
            enum: ['openai', 'anthropic', 'ollama'],
          },
          search: { type: 'string' },
          filter: {
            type: 'string',
            enum: ['all', 'with-data', 'without-data', 'error'],
          },
          limit: { type: 'integer', minimum: 1, maximum: 1000 },
          offset: { type: 'integer', minimum: 0 },
        },
        required: ['provider'],
      },
      handler: (args, db) =>
        db.queryAi({
          provider: args.provider as AiProvider,
          limit: clamp(args.limit, 1, 1000, 50),
          offset: clamp(args.offset, 0, 10_000_000, 0),
          search: typeof args.search === 'string' ? args.search : undefined,
          filter: args.filter as 'all' | 'with-data' | 'without-data' | 'error' | undefined,
        }),
    },

    {
      name: 'query_seo',
      description:
        'SEO Authority rows from one provider (moz / ahrefs / semrush etc). Per-URL domain authority, backlink count, referring domains.',
      inputSchema: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
            description: 'SEO authority provider — must be configured in Settings → SEO Authority.',
          },
          search: { type: 'string' },
          filter: {
            type: 'string',
            enum: ['all', 'with-data', 'without-data', 'error'],
          },
          limit: { type: 'integer', minimum: 1, maximum: 1000 },
          offset: { type: 'integer', minimum: 0 },
        },
        required: ['provider'],
      },
      handler: (args, db) =>
        db.querySeo({
          provider: args.provider as SeoProvider,
          limit: clamp(args.limit, 1, 1000, 50),
          offset: clamp(args.offset, 0, 10_000_000, 0),
          search: typeof args.search === 'string' ? args.search : undefined,
          filter: args.filter as 'all' | 'with-data' | 'without-data' | 'error' | undefined,
        }),
    },

    // =================================================================
    // V2 Faz 0.5 Increment 1 — Specialised entity queries (images,
    // broken links, duplicate clusters) and reports.
    // =================================================================

    {
      name: 'query_images',
      description:
        'Project-wide image catalogue — every <img> the crawler saw, with src, alt, intrinsic dimensions, byte_size, is_internal. Backs the Images tab.',
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Substring match against src or alt.',
          },
          missingAltOnly: { type: 'boolean' },
          internalOnly: { type: 'boolean' },
          limit: { type: 'integer', minimum: 1, maximum: 5000 },
          offset: { type: 'integer', minimum: 0 },
        },
      },
      handler: (args, db) =>
        db.queryImages({
          limit: clamp(args.limit, 1, 5000, 100),
          offset: clamp(args.offset, 0, 10_000_000, 0),
          search: typeof args.search === 'string' ? args.search : undefined,
          missingAltOnly: args.missingAltOnly === true,
          internalOnly: args.internalOnly === true,
        }),
    },

    {
      name: 'query_broken_links',
      description:
        'Every 4xx/5xx link the crawler followed — from_url + to_url + anchor + status_code + is_internal. Use to triage broken-link debt site-wide.',
      inputSchema: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['all', 'internal', 'external'],
            description: 'Default "all".',
          },
          search: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 5000 },
          offset: { type: 'integer', minimum: 0 },
        },
      },
      handler: (args, db) =>
        db.queryBrokenLinks({
          limit: clamp(args.limit, 1, 5000, 100),
          offset: clamp(args.offset, 0, 10_000_000, 0),
          search: typeof args.search === 'string' ? args.search : undefined,
          internal:
            (args.scope as 'all' | 'internal' | 'external' | undefined) ?? 'all',
        }),
    },

    {
      name: 'list_duplicate_clusters',
      description:
        'Paginated view of near-duplicate clusters with each cluster\'s members — same data the Cluster view on the Duplicates tab renders. Members are pre-grouped: rows sharing a cluster_id form one cluster, sorted by cluster_size DESC then alphabetic. Hamming distance from the cluster representative is included per row.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 5000 },
          offset: { type: 'integer', minimum: 0 },
        },
      },
      handler: (args, db) => {
        const limit = clamp(args.limit, 1, 5000, 500);
        const offset = clamp(args.offset, 0, 10_000_000, 0);
        return {
          rows: db.listDuplicateClusters(offset, limit),
          total: db.countDuplicateClusterMembers(),
          limit,
          offset,
        };
      },
    },

    // ----- Reports (no per-URL data — aggregates the desktop Reports
    // menu exposes). Each maps 1:1 to a method on ProjectDb.
    {
      name: 'report_status_code_histogram',
      description: 'Per-status-code URL count distribution (200/301/404/500/...). Useful baseline for a crawl health snapshot.',
      inputSchema: { type: 'object', properties: {} },
      handler: (_args, db) => ({ rows: db.getStatusCodeHistogram() }),
    },
    {
      name: 'report_indexability_distribution',
      description: 'Indexability breakdown — indexable vs noindex / canonicalised / blocked / redirect / 4xx / 5xx.',
      inputSchema: { type: 'object', properties: {} },
      handler: (_args, db) => ({ rows: db.getIndexabilityDistribution() }),
    },
    {
      name: 'report_content_kind_distribution',
      description: 'URL count by content kind (html / js / css / image / pdf / font / other).',
      inputSchema: { type: 'object', properties: {} },
      handler: (_args, db) => ({ rows: db.getContentKindDistribution() }),
    },
    {
      name: 'report_depth_histogram',
      description: 'Per-depth URL count — depth = shortest BFS path length from the seed.',
      inputSchema: { type: 'object', properties: {} },
      handler: (_args, db) => ({ rows: db.getDepthHistogram() }),
    },
    {
      name: 'report_response_time_histogram',
      description: 'Response-time bucket histogram (0–100 ms, 100–500 ms, 500 ms–1 s, 1–3 s, 3 s+).',
      inputSchema: { type: 'object', properties: {} },
      handler: (_args, db) => ({ rows: db.getResponseTimeHistogram() }),
    },
    {
      name: 'report_inlinks_histogram',
      description: 'How many pages have N inlinks — surface orphan / weakly-linked / hub pages at a glance.',
      inputSchema: { type: 'object', properties: {} },
      handler: (_args, db) => ({ rows: db.inlinksHistogram() }),
    },
    {
      name: 'report_word_count_histogram',
      description: 'Word-count distribution across indexable HTML pages.',
      inputSchema: { type: 'object', properties: {} },
      handler: (_args, db) => ({ rows: db.wordCountHistogram() }),
    },
    {
      name: 'report_url_length_histogram',
      description: 'URL-length distribution (≤75 / 76–115 / 116–200 / 201–500 / 501–2048 / >2048 chars).',
      inputSchema: { type: 'object', properties: {} },
      handler: (_args, db) => ({ rows: db.urlLengthHistogram() }),
    },
    {
      name: 'report_top_urls_by',
      description: 'Top-N URLs by a numeric column (response_time_ms / depth / outlinks / inlinks / content_length). Direction defaults to desc; asc excludes zero-value rows so you get the weakest non-orphans not the dead links.',
      inputSchema: {
        type: 'object',
        properties: {
          column: {
            type: 'string',
            enum: ['response_time_ms', 'depth', 'outlinks', 'inlinks', 'content_length'],
          },
          limit: { type: 'integer', minimum: 1, maximum: 500 },
          direction: { type: 'string', enum: ['asc', 'desc'] },
        },
        required: ['column'],
      },
      handler: (args, db) => ({
        rows: db.topUrlsBy(
          args.column as 'response_time_ms' | 'depth' | 'outlinks' | 'inlinks' | 'content_length',
          clamp(args.limit, 1, 500, 25),
          (args.direction as 'asc' | 'desc' | undefined) ?? 'desc',
        ),
      }),
    },
    {
      name: 'report_top_anchor_texts',
      description: 'Most-used internal anchor texts across the whole site. Heuristic for "what does the site call itself in its own links".',
      inputSchema: {
        type: 'object',
        properties: { limit: { type: 'integer', minimum: 1, maximum: 1000 } },
      },
      handler: (args, db) => ({
        rows: db.topAnchorTexts(clamp(args.limit, 1, 1000, 200)),
      }),
    },
    {
      name: 'report_external_domain_health',
      description: 'External-link health per outbound domain — total / success / errors / avg response time / error-rate percent. Sorted by errorCount DESC so worst offenders top.',
      inputSchema: {
        type: 'object',
        properties: { limit: { type: 'integer', minimum: 1, maximum: 1000 } },
      },
      handler: (args, db) => ({
        rows: db.externalDomainHealth(clamp(args.limit, 1, 1000, 100)),
      }),
    },
    {
      name: 'report_image_weight_per_page',
      description: 'Per-page image weight roll-up — total bytes of images on the page + image count. Top-N by total weight DESC.',
      inputSchema: {
        type: 'object',
        properties: { limit: { type: 'integer', minimum: 1, maximum: 500 } },
      },
      handler: (args, db) => ({
        rows: db.imageWeightPerPage(clamp(args.limit, 1, 500, 25)),
      }),
    },
    {
      name: 'report_link_position_breakdown',
      description: 'Where internal links live — navigation / header / footer / sidebar / content. Mirrors the "Internal Link Positions" report.',
      inputSchema: { type: 'object', properties: {} },
      handler: (_args, db) => ({ rows: db.linkPositionBreakdown() }),
    },
    {
      name: 'report_pages_per_directory',
      description: 'Per-directory page count + share. `depth` controls how many path segments to bucket by (1–4).',
      inputSchema: {
        type: 'object',
        properties: {
          depth: { type: 'integer', minimum: 1, maximum: 4 },
          limit: { type: 'integer', minimum: 1, maximum: 5000 },
        },
      },
      handler: (args, db) => ({
        rows: db.getPagesPerDirectory({
          depth: clamp(args.depth, 1, 4, 1),
          limit: clamp(args.limit, 1, 5000, 1000),
        }),
      }),
    },
    {
      name: 'report_word_count_per_directory',
      description: 'Average word count + page count per directory. Same `depth` semantics as report_pages_per_directory. Surfaces thin-content directories.',
      inputSchema: {
        type: 'object',
        properties: {
          depth: { type: 'integer', minimum: 1, maximum: 4 },
          limit: { type: 'integer', minimum: 1, maximum: 2000 },
        },
      },
      handler: (args, db) => ({
        rows: db.wordCountPerDirectory({
          depth: clamp(args.depth, 1, 4, 1),
          limit: clamp(args.limit, 1, 2000, 500),
        }),
      }),
    },
    {
      name: 'report_sitemap_orphans',
      description: 'URLs declared in the sitemap but never reached by the crawl. Each row carries lastmod + sourceSitemap so you can tell stale entries from genuine orphans.',
      inputSchema: {
        type: 'object',
        properties: { limit: { type: 'integer', minimum: 1, maximum: 10_000 } },
      },
      handler: (args, db) => ({
        rows: db.sitemapOrphans(clamp(args.limit, 1, 10_000, 1000)),
      }),
    },
    {
      name: 'report_analytics_coverage',
      description: 'Which third-party analytics trackers (GA4 / GTM / Hotjar / Clarity / Mixpanel / Plausible / ...) appear on which fraction of indexable pages. Reveals coverage gaps and ID inconsistencies (multiple GA4 properties tagged across the site, etc).',
      inputSchema: { type: 'object', properties: {} },
      handler: (_args, db) => ({ rows: db.analyticsCoverage() }),
    },
    {
      name: 'report_server_header_breakdown',
      description: 'Distinct `Server` response header values and how many URLs each. Surfaces mixed-stack deployments and CDN attribution.',
      inputSchema: { type: 'object', properties: {} },
      handler: (_args, db) => ({ rows: db.serverHeaderBreakdown() }),
    },
  ];
}
