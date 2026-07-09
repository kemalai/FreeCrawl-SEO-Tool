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

// The `category` filter accepts the full UrlCategory union (200+ values:
// internal/external content kinds, status:* buckets, security:*,
// indexability:*, tab:* groupings, and per-issue drill-downs like
// "issues:title-missing" / "issues:severity-critical"). The union is a
// type, not a runtime list, so we validate at the DB layer (categoryWhereClause)
// and describe rather than `enum`-constrain — an enum of a hand-picked subset
// would reject the very `issues:*` drill-downs that `top_issues` returns.
const URL_CATEGORY_DESC =
  'UrlCategory filter matching the desktop UI categories. Accepts "all"; ' +
  'internal:*/external:* content kinds; status:2xx/3xx/4xx/5xx/no-response/blocked-robots; ' +
  'security:https/http; indexability:*; tab:* groupings; and per-issue drill-downs ' +
  'such as "issues:title-missing" or severity rollups like "issues:severity-critical". ' +
  'Defaults to "all".';

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
      name: 'query_crux',
      description:
        'Chrome UX Report rows: real-user (field) 75th-percentile Core Web Vitals per URL (LCP/INP/CLS/FCP/TTFB) for phone + desktop. Populate via Settings → Integrations → Chrome UX Report, then run a batch from the desktop CrUX tab (or crux_run).',
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          filter: { type: 'string', enum: ['all', 'tested', 'untested'] },
          limit: { type: 'integer', minimum: 1, maximum: 1000 },
          offset: { type: 'integer', minimum: 0 },
        },
      },
      handler: (args, db) =>
        db.queryCrux({
          limit: clamp(args.limit, 1, 1000, 50),
          offset: clamp(args.offset, 0, 10_000_000, 0),
          search: typeof args.search === 'string' ? args.search : undefined,
          filter: args.filter as 'all' | 'tested' | 'untested' | undefined,
        }),
    },
    {
      name: 'query_spelling',
      description:
        'Spelling & grammar check summary per crawled page (LanguageTool): match count, language used, status. Use filter "errors" for pages with ≥1 finding. Populate via Settings → Integrations → LanguageTool, then run a batch from the desktop Spelling tab (or spelling_run). Call get_url_spelling for a page\'s full match list.',
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          filter: {
            type: 'string',
            enum: ['all', 'checked', 'unchecked', 'errors'],
          },
          limit: { type: 'integer', minimum: 1, maximum: 1000 },
          offset: { type: 'integer', minimum: 0 },
        },
      },
      handler: (args, db) =>
        db.querySpelling({
          limit: clamp(args.limit, 1, 1000, 50),
          offset: clamp(args.offset, 0, 10_000_000, 0),
          search: typeof args.search === 'string' ? args.search : undefined,
          filter: args.filter as
            | 'all'
            | 'checked'
            | 'unchecked'
            | 'errors'
            | undefined,
        }),
    },
    {
      name: 'get_url_spelling',
      description:
        'Full LanguageTool match list for one URL: message, offending text, surrounding context, suggested replacements, rule id and issue type per finding.',
      inputSchema: {
        type: 'object',
        properties: { url: { type: 'string' } },
        required: ['url'],
      },
      handler: (args, db) => {
        const url = typeof args.url === 'string' ? args.url : '';
        if (!url) throw new Error('url is required');
        return db.getSpellingMatches(url) ?? { url, matches: [], status: null };
      },
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
      name: 'report_orphan_cross_source',
      description:
        'Orphan pages across all truth sources: URLs present in the XML sitemap, Google Search Console, or Google Analytics 4 but never reached by the crawl (or crawled only as an unfetched stub). Each row lists which sources mentioned it plus its GSC clicks / impressions and GA4 sessions; sorted by traffic (GSC clicks + GA4 sessions) descending so high-value orphans surface first. Sitemap-only with no traffic is often a dead entry; GSC/GA4 orphans are real pages users reach that no internal link path does.',
      inputSchema: {
        type: 'object',
        properties: { limit: { type: 'integer', minimum: 1, maximum: 10_000 } },
      },
      handler: (args, db) => ({
        rows: db.orphanPagesCrossSource(clamp(args.limit, 1, 10_000, 1000)),
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

    {
      name: 'report_query_string_variants',
      description:
        'Base URLs (path without `?…`) that appear with 2+ query-string variants in the crawl. Each row carries the variant count and a sample of the actual `?…` strings — useful for spotting session-id / faceted-nav / `utm_*` parameter bloat that the URL normaliser did not strip. Use this to decide which params to add to Settings → URL Rewriting → Keep query parameters list, or which routes to exclude.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 5000, description: 'Max base URLs returned. Default 500.' },
          sampleLimit: { type: 'integer', minimum: 1, maximum: 20, description: 'Per-group sample size for the query-string list. Default 5.' },
        },
      },
      handler: (args, db) => ({
        rows: db.getQueryStringVariantGroups({
          limit: clamp(args.limit, 1, 5000, 500),
          sampleLimit: clamp(args.sampleLimit, 1, 20, 5),
        }),
      }),
    },

    {
      name: 'report_sitemap_priority_mismatch',
      description:
        'Sitemap-declared high-priority URLs whose actual crawl outcome contradicts the declared importance — 4xx/5xx page, noindex, canonicalised to another URL, redirected, robots-blocked, or never reached. The classic "sitemap lies to Google" signal. `priorityThreshold` defaults to 0.8 (most sitemap generators use this as the "important pages" floor). Each row carries the declared priority/changefreq/lastmod plus the actual status_code/indexability and a typed `issue` discriminator (not-crawled / status-error / noindex / canonicalised / redirect / blocked-robots).',
      inputSchema: {
        type: 'object',
        properties: {
          priorityThreshold: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Only flag URLs whose declared sitemap priority is at least this value. Default 0.8.',
          },
          limit: { type: 'integer', minimum: 1, maximum: 10_000, description: 'Default 1000.' },
        },
      },
      handler: (args, db) => ({
        rows: db.getSitemapPriorityMismatch({
          priorityThreshold:
            typeof args.priorityThreshold === 'number' ? args.priorityThreshold : 0.8,
          limit: clamp(args.limit, 1, 10_000, 1000),
        }),
      }),
    },

    // =================================================================
    // V2 Faz 0.5 Increment 2 — Action tools. Each one POSTs through the
    // bridge's generic `/v1/action/<name>` route; the main process
    // dispatches via `crawlController.actions[<name>]`. Unlike the
    // desktop IPC handlers, MCP actions require explicit file paths —
    // no save / open dialog can pop up because the agent is not the
    // one in front of the screen. Pass absolute paths; the agent
    // should call `current_project` first if it needs to know where
    // the project lives.
    // =================================================================

    {
      requiresDb: false,
      name: 'crawl_add_url',
      description:
        'Enqueue a single URL into the currently running crawl. Same primitive as the TopBar "Add URL" button. No-op when no crawl is active (returns `{accepted: false, reason: "no-active-crawl"}`). URL is filtered by the active crawl\'s scope / include / exclude / robots rules just like any link-discovered URL.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Absolute URL to inject.' },
        },
        required: ['url'],
      },
      handler: async (args) =>
        bridgeRequest<{ accepted: boolean; reason?: string }>(
          'POST',
          '/v1/action/crawl-add-url',
          { url: String(args.url ?? '') },
        ),
    },

    {
      requiresDb: false,
      name: 'export_csv',
      description:
        'Export the active project (or one tab\'s subset, or a list of URL ids) to a CSV file. Path must be absolute. CSV is UTF-8 with formula-injection neutralisation on cells starting with `=`, `+`, `-`, `@`, TAB, or CR.',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Absolute output path.' },
          category: {
            type: 'string',
            description: 'Optional UrlCategory subset filter. Default exports the whole project.',
          },
          selectedIds: {
            type: 'array',
            items: { type: 'integer' },
            description: 'When set, only these URL ids are exported. Wins over category.',
          },
        },
        required: ['filePath'],
      },
      handler: async (args) =>
        bridgeRequest<{ filePath: string; rowsWritten: number }>(
          'POST',
          '/v1/action/export-csv',
          args,
        ),
    },

    {
      requiresDb: false,
      name: 'export_json',
      description: 'Export to JSON. Same shape as export_csv plus an optional `pretty: true` for 2-space indent (default compact).',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string' },
          category: { type: 'string', description: URL_CATEGORY_DESC },
          selectedIds: { type: 'array', items: { type: 'integer' } },
          pretty: { type: 'boolean' },
        },
        required: ['filePath'],
      },
      handler: async (args) =>
        bridgeRequest<{ filePath: string; rowsWritten: number }>(
          'POST',
          '/v1/action/export-json',
          args,
        ),
    },

    {
      requiresDb: false,
      name: 'export_xml',
      description: 'Export to XML. Same shape as export_csv.',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string' },
          category: { type: 'string', description: URL_CATEGORY_DESC },
          selectedIds: { type: 'array', items: { type: 'integer' } },
        },
        required: ['filePath'],
      },
      handler: async (args) =>
        bridgeRequest<{ filePath: string; rowsWritten: number }>(
          'POST',
          '/v1/action/export-xml',
          args,
        ),
    },

    {
      requiresDb: false,
      name: 'export_html_report',
      description: 'Generate a standalone HTML audit report (summary + sample tables) — same content as File → Export → HTML Report in the desktop. Embeds top-level counts, top issues, and sample URLs per issue category.',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Absolute output path. Use a `.html` extension.' },
        },
        required: ['filePath'],
      },
      handler: async (args) =>
        bridgeRequest<{ filePath: string; bytesWritten: number }>(
          'POST',
          '/v1/action/export-html-report',
          args,
        ),
    },

    {
      requiresDb: false,
      name: 'sitemap_generate',
      description:
        'Generate a sitemap.xml from the indexable URLs in the active project. Variant defaults to `standard`; pass `image` for Google Images extension or `hreflang` for international targeting. Gzip and per-file URL caps supported (sharding kicks in over 50,000).',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Absolute output path.' },
          variant: {
            type: 'string',
            enum: ['standard', 'image', 'hreflang'],
          },
          gzip: { type: 'boolean' },
          splitAtUrlCount: { type: 'integer', minimum: 1, maximum: 50_000 },
        },
        required: ['filePath'],
      },
      handler: async (args) =>
        bridgeRequest<{
          filePath: string;
          files?: string[];
          urlsWritten: number;
          truncated: boolean;
          sharded?: boolean;
        }>('POST', '/v1/action/sitemap-generate', args),
    },

    {
      requiresDb: false,
      name: 'sitemap_validate',
      description:
        'Fetch a remote sitemap.xml (or sitemap-index.xml) and validate its XML, URL count, and lastmod entries. Walks nested sitemap indexes up to 3 levels deep, capped at 100,000 entries. Returns per-sitemap parse errors plus protocol-level findings.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Sitemap URL to fetch.' },
          userAgent: { type: 'string', description: 'Optional UA override.' },
        },
        required: ['url'],
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/sitemap-validate', args),
    },

    {
      requiresDb: false,
      name: 'robots_test',
      description:
        'Test whether a URL is allowed by a robots.txt policy. Defaults to fetching the live robots.txt from the URL\'s origin; pass `customRobots` (raw body string) to test a draft policy offline.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          userAgent: { type: 'string' },
          customRobots: {
            type: 'string',
            description: 'Optional raw robots.txt body to test against instead of fetching live.',
          },
        },
        required: ['url', 'userAgent'],
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/robots-test', args),
    },

    {
      requiresDb: false,
      name: 'robots_validate',
      description: 'Lint a raw robots.txt body — surface syntax errors, typo suggestions, orphan rules, and sitemap-URL checks. Lines are 1-indexed.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Full robots.txt body to validate.' },
        },
        required: ['text'],
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/robots-validate', args),
    },

    {
      requiresDb: false,
      name: 'compare_load',
      description:
        'Diff the active project against another `.seoproject` file — same as File → Compare With Project. Returns counts across 9 categories (added / removed / status / title / meta / h1 / canonical / indexability / response_time) plus sample rows (up to 5K per category).',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Absolute path to the OTHER `.seoproject` to diff against.',
          },
        },
        required: ['filePath'],
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/compare-load', args),
    },

    {
      requiresDb: false,
      name: 'schedule_get',
      description:
        'Read the active project\'s scheduled-crawl spec, or null when none. Same data the Scheduled Crawl dialog shows: cadence (hourly/daily/weekly/custom), next-fire timestamp, last-fire timestamp + status.',
      inputSchema: { type: 'object', properties: {} },
      handler: async () =>
        bridgeRequest<unknown>('POST', '/v1/action/schedule-get', {}),
    },

    {
      requiresDb: false,
      name: 'schedule_set',
      description:
        'Write the active project\'s scheduled-crawl spec, or pass `spec: null` to clear. The in-app scheduler\'s 60-second tick picks up the change immediately — the next fire is computed server-side and returned. Cadence `custom` requires `intervalMinutes` ≥ 15.',
      inputSchema: {
        type: 'object',
        properties: {
          spec: {
            type: ['object', 'null'],
            description: 'ScheduleSpec or null to clear. Required field: `cadence`. Optional: enabled, intervalMinutes, hourOfDay, minuteOfHour, dayOfWeek.',
            properties: {
              enabled: { type: 'boolean' },
              cadence: { type: 'string', enum: ['hourly', 'daily', 'weekly', 'custom'] },
              intervalMinutes: { type: 'integer', minimum: 15 },
              hourOfDay: { type: 'integer', minimum: 0, maximum: 23 },
              minuteOfHour: { type: 'integer', minimum: 0, maximum: 59 },
              dayOfWeek: { type: 'integer', minimum: 0, maximum: 6 },
            },
          },
        },
        required: ['spec'],
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/schedule-set', args),
    },

    {
      requiresDb: false,
      name: 'report_top_words',
      description:
        'Most-used words across every indexable page\'s title + meta description + H1. Locale tunes the stopword list — `en` strips English stopwords, `tr` Turkish, `all` strips both. Use for "what does the site talk about" content audits.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 2000 },
          minLength: { type: 'integer', minimum: 1, maximum: 20 },
          locale: { type: 'string', enum: ['en', 'tr', 'all'] },
        },
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/report-top-words', args),
    },

    // ---- Faz 0.5 Increment 3 — URL mutation + remaining exports + config + previews ----

    {
      requiresDb: false,
      name: 'respider_urls',
      description:
        'Bulk re-spider URLs by id — same primitive as the URL multi-select context menu\'s "Re-Spider N URLs". DB rows are marked dirty (`recrawl_pending`); if an active crawl is running, the URLs are also live-requeued. With no active crawl, the marks survive — the next `start_crawl` picks them up. Returns `{marked, requeued, hasActiveCrawl}`.',
      inputSchema: {
        type: 'object',
        properties: {
          urlIds: { type: 'array', items: { type: 'integer' }, minItems: 1 },
        },
        required: ['urlIds'],
      },
      handler: async (args) =>
        bridgeRequest<{ marked: number; requeued: number; hasActiveCrawl: boolean }>(
          'POST',
          '/v1/action/respider-urls',
          args,
        ),
    },

    {
      requiresDb: false,
      name: 'remove_urls',
      description:
        'Delete URLs from the project by id, plus every dependent row (links / images / headers / cookies / sources / issues). DESTRUCTIVE — no undo. Same primitive as the URL multi-select context menu\'s "Remove N URLs".',
      inputSchema: {
        type: 'object',
        properties: {
          urlIds: { type: 'array', items: { type: 'integer' }, minItems: 1 },
        },
        required: ['urlIds'],
      },
      handler: async (args) =>
        bridgeRequest<{ removed: number }>(
          'POST',
          '/v1/action/remove-urls',
          args,
        ),
    },

    {
      requiresDb: false,
      name: 'data_delete_by_domain',
      description:
        'GDPR-style domain wipe — deletes every URL whose host matches the given domain (case-insensitive, no scheme/port), plus all dependent rows. Same primitive as Settings → Storage → "Delete Domain Data". DESTRUCTIVE.',
      inputSchema: {
        type: 'object',
        properties: {
          domain: { type: 'string', description: 'Hostname only (e.g. "example.com", not "https://example.com/").' },
        },
        required: ['domain'],
      },
      handler: async (args) =>
        bridgeRequest<{ urlsDeleted: number; linksDeleted: number }>(
          'POST',
          '/v1/action/data-delete-by-domain',
          args,
        ),
    },

    {
      requiresDb: false,
      name: 'export_broken_links',
      description: 'Export every 4xx/5xx broken link in the project to a CSV. Honours the same internal/external scope filter the Broken Links tab\'s sidebar exposes.',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Absolute output path.' },
          internal: { type: 'string', enum: ['all', 'internal', 'external'] },
        },
        required: ['filePath'],
      },
      handler: async (args) =>
        bridgeRequest<{ filePath: string; rowsWritten: number }>(
          'POST',
          '/v1/action/export-broken-links',
          args,
        ),
    },

    {
      requiresDb: false,
      name: 'export_images',
      description: 'Export every image the crawler saw to a CSV with src/alt/dimensions/byte_size/is_internal. Honours the Images tab\'s "Missing Alt only" toggle and search box.',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string' },
          missingAltOnly: { type: 'boolean' },
          search: { type: 'string', description: 'Substring filter on src or alt.' },
        },
        required: ['filePath'],
      },
      handler: async (args) =>
        bridgeRequest<{ filePath: string; rowsWritten: number }>(
          'POST',
          '/v1/action/export-images',
          args,
        ),
    },

    {
      requiresDb: false,
      name: 'export_tabular',
      description:
        'Multi-section export — emit several tabs into one workbook (xlsx) or one file per section (csv/json/xml). `sections` lists which categories to include; `columns` is the CrawlUrlRow key list (in order). With xlsx, each section becomes a sheet; with the others, each section becomes its own file under the chosen folder (or sub-folder via `subdir`).',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Absolute file (xlsx) or folder (csv/json/xml) path.' },
          format: { type: 'string', enum: ['csv', 'xlsx', 'json', 'xml'] },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                category: { type: 'string', description: URL_CATEGORY_DESC },
                subdir: { type: 'string' },
                filename: { type: 'string' },
              },
              required: ['label', 'category'],
            },
          },
          columns: { type: 'array', items: { type: 'string' } },
          selectedIds: { type: 'array', items: { type: 'integer' } },
        },
        required: ['filePath', 'format', 'sections', 'columns'],
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/export-tabular', args),
    },

    {
      requiresDb: false,
      name: 'get_crawl_config',
      description: 'Read the most recently-used CrawlConfig — the same config `start_crawl` falls back to when called without overrides. Reflects whatever the user (or the previous MCP `set_crawl_config` call) configured in Settings.',
      inputSchema: { type: 'object', properties: {} },
      handler: async () =>
        bridgeRequest<unknown>('POST', '/v1/action/get-crawl-config', {}),
    },

    {
      requiresDb: false,
      name: 'set_crawl_config',
      description:
        'Persist a full CrawlConfig as the saved default — next `start_crawl` without overrides will use these settings. The input is the entire CrawlConfig object (every field the Settings dialog exposes). Pass `get_crawl_config` first to read the current shape, then send the modified copy back. Validation happens at crawl launch time — out-of-range values may be silently clamped or fail at start.',
      inputSchema: {
        type: 'object',
        description: 'Full CrawlConfig object. Pass the result of `get_crawl_config` with your modifications layered on.',
        additionalProperties: true,
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/set-crawl-config', args),
    },

    {
      requiresDb: false,
      name: 'url_rewrite_preview',
      description:
        'Test a URL-rewrite pipeline against a sample URL — same primitive as the Settings → URL Rewriting "Preview" button. Returns the rewritten URL plus any regex compile errors. Useful for debugging `urlRegexRewrites` patterns before committing them via `set_crawl_config`.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          stripWww: { type: 'boolean' },
          forceHttps: { type: 'boolean' },
          lowercasePath: { type: 'boolean' },
          trailingSlash: { type: 'string', enum: ['leave', 'strip', 'add'] },
          keepQueryParams: { type: 'array', items: { type: 'string' } },
          urlRegexRewrites: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                pattern: { type: 'string' },
                replacement: { type: 'string' },
                flags: { type: 'string' },
              },
              required: ['pattern', 'replacement'],
            },
          },
        },
        required: ['url'],
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/url-rewrite-preview', args),
    },

    {
      requiresDb: false,
      name: 'extraction_preview',
      description:
        'Test custom extraction rules against a live URL fetch — same primitive as Settings → Custom Extraction "Preview". Rule types: `css` (cheerio selector), `xpath` (XPath 1.0 subset over the DOM), `regex` (raw HTML), `jsonpath` (against a JSON response body). Returns per-rule values (or compile errors) plus the response\'s status / content-type / byte size / fetch ms. The agent can iterate on selectors without running a full crawl.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          rules: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string', enum: ['css', 'xpath', 'regex', 'jsonpath'] },
                selector: { type: 'string' },
                attribute: { type: 'string' },
                output: { type: 'string', enum: ['text', 'attribute', 'inner_html', 'outer_html', 'count', 'regex_group'] },
                multi: { type: 'string', enum: ['first', 'last', 'all', 'concat', 'count'] },
              },
              required: ['name', 'type', 'selector', 'output', 'multi'],
            },
          },
          userAgent: { type: 'string' },
          acceptLanguage: { type: 'string' },
        },
        required: ['url', 'rules'],
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/extraction-preview', args),
    },

    {
      requiresDb: false,
      name: 'graph_snapshot',
      description:
        'Internal link graph for the Visualization view — every URL as a node + every internal link as an edge. `nodeLimit` caps the size for large crawls (default 5000). Useful to feed graph-analysis or compute centrality offline.',
      inputSchema: {
        type: 'object',
        properties: {
          nodeLimit: { type: 'integer', minimum: 10, maximum: 50_000 },
        },
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/graph-snapshot', args),
    },

    {
      requiresDb: false,
      name: 'get_crawl_path',
      description:
        "Crawl Path Report for one page — the shortest discovery path from the crawl root (homepage, depth 0) to the target, following internal links. Answers 'how did the crawler reach this URL'. Pass `urlId` or `url`. `reachedRoot` is false for orphan pages reachable only via sitemap.",
      inputSchema: {
        type: 'object',
        properties: {
          urlId: { type: 'integer', minimum: 1 },
          url: { type: 'string' },
        },
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/crawl-path', args),
    },

    // ---- Faz 0.5 Increment 4 — Integration fetch (GSC + GA4 — single
    // blocking API calls, no progress streaming). PSI / AI / SEO have
    // multi-URL batches with progress + cancellation and are exposed via
    // the non-blocking start/poll/cancel tools in Increment 5 below. ----

    {
      requiresDb: false,
      name: 'google_auth_status',
      description:
        'Read the OAuth connection state of one Google integration (`gsc` / `ga4` / `sheets` / `bigquery` / `pagespeed`). Returns `{connected, email, scopes, expiresAt, error}`. Use this BEFORE `gsc_fetch` / `ga4_fetch` to verify the user has connected; not-connected paths surface a clear "Settings → Integrations → Connect" hint in the response.',
      inputSchema: {
        type: 'object',
        properties: {
          integrationId: {
            type: 'string',
            enum: ['gsc', 'ga4', 'sheets', 'bigquery', 'pagespeed', 'openai', 'anthropic', 'ollama'],
          },
        },
        required: ['integrationId'],
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/google-auth-status', args),
    },

    {
      requiresDb: false,
      name: 'gsc_list_sites',
      description:
        'List every Search Console property the connected Google account has access to. Returns `{ok, sites: [{siteUrl, permissionLevel}]}`. Pass the desired `siteUrl` to `gsc_fetch` next. Requires the GSC integration to be connected (see google_auth_status).',
      inputSchema: { type: 'object', properties: {} },
      handler: async () =>
        bridgeRequest<unknown>('POST', '/v1/action/gsc-list-sites', {}),
    },

    {
      requiresDb: false,
      name: 'gsc_fetch',
      description:
        'Pull per-page Search Console metrics (clicks, impressions, CTR, position) for one property over a trailing window (7/28/90 days). Data is stored against crawled URLs; query the result via `query_gsc` or `get_url_analytics`. GSC data lags ~2 days, so the window ends 2 days before today. Blocks until the pull finishes (a few seconds to a minute depending on row count). Requires GSC integration connected.',
      inputSchema: {
        type: 'object',
        properties: {
          property: {
            type: 'string',
            description: 'Search Console property `siteUrl` (e.g. "sc-domain:example.com" or "https://example.com/"). Get available values from `gsc_list_sites`.',
          },
          days: {
            type: 'integer',
            enum: [7, 28, 90],
            description: 'Trailing window length in days. Default 28.',
          },
        },
        required: ['property'],
      },
      handler: async (args) =>
        bridgeRequest<{
          ok: boolean;
          error: string | null;
          rowCount: number;
          meta: unknown;
        }>('POST', '/v1/action/gsc-fetch', args),
    },

    {
      requiresDb: false,
      name: 'ga4_list_properties',
      description:
        'List every GA4 property the connected Google account has access to. Returns `{ok, properties: [{name, displayName, account}]}`. Pass the desired property resource name to `ga4_fetch` next.',
      inputSchema: { type: 'object', properties: {} },
      handler: async () =>
        bridgeRequest<unknown>('POST', '/v1/action/ga4-list-properties', {}),
    },

    {
      requiresDb: false,
      name: 'ga4_fetch',
      description:
        'Pull per-page GA4 metrics (sessions, users, bounceRate, engagementRate) for one property over a trailing window (7/28/90 days). Data is stored against crawled URLs; query the result via `query_ga4` or `get_url_analytics`. GA4 data is near-realtime so the window ends at today. Blocks until the pull finishes. Requires GA4 integration connected.',
      inputSchema: {
        type: 'object',
        properties: {
          property: {
            type: 'string',
            description: 'GA4 property resource name (`properties/<numeric-id>`). Get available values from `ga4_list_properties`.',
          },
          propertyName: {
            type: 'string',
            description: 'Friendly label persisted into the fetch meta for the UI. Optional — falls back to `property`.',
          },
          days: {
            type: 'integer',
            enum: [7, 28, 90],
            description: 'Trailing window length in days. Default 28.',
          },
        },
        required: ['property'],
      },
      handler: async (args) =>
        bridgeRequest<{
          ok: boolean;
          error: string | null;
          rowCount: number;
          meta: unknown;
        }>('POST', '/v1/action/ga4-fetch', args),
    },

    // ---- Faz 0.5 Increment 5 — slow batch-fetch run triggers
    // (PageSpeed / AI / SEO). These are the multi-URL fetchers that
    // stream progress + support cancellation. The MCP wire protocol
    // can't stream, so — exactly like start_crawl — each *_run tool
    // returns immediately after kicking off the batch; poll
    // get_fetch_progress to watch it and cancel_fetch to stop. Target
    // URLs come from an explicit `urls` list OR a `category` resolved
    // server-side (preferred for large sets — the bridge caps request
    // bodies at 64 KB, so a big `urls` array is rejected). ----

    {
      requiresDb: false,
      name: 'pagespeed_run',
      description:
        'Kick off a PageSpeed Insights (Lighthouse) batch audit in the desktop app and return immediately — it does NOT block (audits take ~10–30 s each). Poll `get_fetch_progress` (kind "pagespeed") to watch it and `cancel_fetch` to stop. Pick targets with an explicit `urls` array OR a `category` resolved server-side (preferred for large sets). Keyless PageSpeed has a near-zero daily quota — add a free key under Settings → Integrations → PageSpeed Insights for real throughput. Results land where `query_pagespeed` / `get_url_analytics` read. Returns `{started, total, truncated, state}`; `started:false` + `reason` when a run is already active or nothing matched.',
      inputSchema: {
        type: 'object',
        properties: {
          urls: {
            type: 'array',
            items: { type: 'string' },
            description: 'Explicit URLs to audit. Wins over `category`. Keep the list small — the bridge caps the request body at 64 KB.',
          },
          category: {
            type: 'string',
            description: 'Resolve target URLs from the active project by category (e.g. "internal:html") when `urls` is omitted.',
          },
          search: {
            type: 'string',
            description: 'Optional substring filter applied when resolving via `category`.',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 5000,
            description: 'Max URLs to pull when resolving via `category`. Default 100.',
          },
          strategy: {
            type: 'string',
            enum: ['mobile', 'desktop', 'both'],
            description: 'Form factor. `both` doubles the API calls. Default "mobile".',
          },
        },
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/pagespeed-run', args),
    },

    {
      requiresDb: false,
      name: 'crux_run',
      description:
        'Kick off a Chrome UX Report (real-user field data) batch fetch in the desktop app and return immediately — it does NOT block. Poll `get_fetch_progress` (kind "crux") to watch it and `cancel_fetch` to stop. Pick targets with an explicit `urls` array OR a `category` resolved server-side. Requires a Google API key with the Chrome UX Report API enabled (Settings → Integrations → Chrome UX Report). Pages with too little real-user traffic simply return no data. Results land where `query_crux` reads. Returns `{started, total, truncated, state}`.',
      inputSchema: {
        type: 'object',
        properties: {
          urls: {
            type: 'array',
            items: { type: 'string' },
            description: 'Explicit URLs to fetch. Wins over `category`.',
          },
          category: {
            type: 'string',
            description: 'Resolve target URLs from the active project by category when `urls` is omitted.',
          },
          search: {
            type: 'string',
            description: 'Optional substring filter applied when resolving via `category`.',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 5000,
            description: 'Max URLs to pull when resolving via `category`. Default 100.',
          },
          formFactor: {
            type: 'string',
            enum: ['phone', 'desktop', 'both'],
            description: 'Device class. `both` doubles the API calls. Default "phone".',
          },
        },
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/crux-run', args),
    },

    {
      requiresDb: false,
      name: 'spelling_run',
      description:
        'Kick off a LanguageTool spelling/grammar check over crawled pages in the desktop app and return immediately — it does NOT block. Poll `get_fetch_progress` (kind "spelling") to watch it and `cancel_fetch` to stop. Pick targets with an explicit `urls` array OR a `category` resolved server-side. Uses the free public LanguageTool API by default (rate-limited to ~20 req/min, so runs are serial); configure a self-hosted endpoint or Premium credentials under Settings → Integrations → LanguageTool for throughput. Results land where `query_spelling` / `get_url_spelling` read.',
      inputSchema: {
        type: 'object',
        properties: {
          urls: {
            type: 'array',
            items: { type: 'string' },
            description: 'Explicit URLs to check. Wins over `category`.',
          },
          category: {
            type: 'string',
            description: 'Resolve target URLs from the active project by category when `urls` is omitted.',
          },
          search: {
            type: 'string',
            description: 'Optional substring filter applied when resolving via `category`.',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 5000,
            description: 'Max URLs to pull when resolving via `category`. Default 100.',
          },
        },
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/spelling-run', args),
    },

    {
      requiresDb: false,
      name: 'ai_run',
      description:
        'Kick off an AI batch over the matched URLs and return immediately (non-blocking). Each page\'s fields can be interpolated into `prompt` via {url}/{title}/{description}/{h1}/{body}. Poll `get_fetch_progress` (kind "ai") and `cancel_fetch` to stop. COSTS REAL MONEY for hosted providers (openai/anthropic) — one API call per matched URL — so scope tightly with `category` + `limit` first. The provider must be configured in Settings → AI. URLs not crawled in this project are skipped (no page context). Results land where `query_ai` reads. Returns `{started, total, truncated, state}`.',
      inputSchema: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
            enum: ['openai', 'anthropic', 'ollama'],
          },
          prompt: {
            type: 'string',
            description: 'Prompt template, substituted per URL. Supports {url}/{title}/{description}/{h1}/{body} placeholders.',
          },
          model: {
            type: 'string',
            description: 'Optional model override; blank uses the provider default.',
          },
          urls: {
            type: 'array',
            items: { type: 'string' },
            description: 'Explicit URLs. Wins over `category`. Keep small (64 KB body cap).',
          },
          category: {
            type: 'string',
            description: 'Resolve targets by category when `urls` is omitted.',
          },
          search: { type: 'string' },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 5000,
            description: 'Max URLs when resolving via `category`. Default 100.',
          },
        },
        required: ['provider', 'prompt'],
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/ai-run', args),
    },

    {
      requiresDb: false,
      name: 'seo_run',
      description:
        'Kick off an SEO-authority batch (domain authority / backlinks / referring domains) over the matched URLs and return immediately (non-blocking). Poll `get_fetch_progress` (kind "seo") and `cancel_fetch` to stop. The provider must be configured in Settings → SEO Authority. Results land where `query_seo` reads. Returns `{started, total, truncated, state}`.',
      inputSchema: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
            enum: ['ahrefs', 'majestic', 'moz', 'semrush'],
          },
          urls: {
            type: 'array',
            items: { type: 'string' },
            description: 'Explicit URLs. Wins over `category`. Keep small (64 KB body cap).',
          },
          category: {
            type: 'string',
            description: 'Resolve targets by category when `urls` is omitted.',
          },
          search: { type: 'string' },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 5000,
            description: 'Max URLs when resolving via `category`. Default 100.',
          },
        },
        required: ['provider'],
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/seo-run', args),
    },

    {
      requiresDb: false,
      name: 'get_fetch_progress',
      description:
        'Poll the live state of the PageSpeed / AI / SEO batch fetchers started by pagespeed_run / ai_run / seo_run (or by the desktop UI — the snapshot is shared). Returns per-kind `{running, done, total, completed, failed, currentUrl, cancelled, startedAt, finishedAt, provider, error}`. Omit `kind` for all three; pass one to narrow. Poll every 1–2 s; once `running` flips to false the batch is done. This is the fetch-side analogue of get_crawl_progress.',
      inputSchema: {
        type: 'object',
        properties: {
          kind: {
            type: 'string',
            enum: ['pagespeed', 'crux', 'spelling', 'ai', 'seo'],
          },
        },
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/fetch-progress', args),
    },

    {
      requiresDb: false,
      name: 'cancel_fetch',
      description:
        'Request cooperative cancellation of a running batch fetcher. In-flight items finish and are saved; queued items are skipped. Pass `kind` ("pagespeed" / "ai" / "seo") to cancel one, or omit to cancel all three. Returns which kinds were running when the cancel landed. No-op for kinds that are idle.',
      inputSchema: {
        type: 'object',
        properties: {
          kind: {
            type: 'string',
            enum: ['pagespeed', 'crux', 'spelling', 'ai', 'seo'],
          },
        },
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/fetch-cancel', args),
    },

    // ---- Faz 0.5 closeout — bulk export + project-file actions (the
    // last `[⏸]` items). Dialog-driven in the desktop; here every path is
    // explicit because an agent can't drive a save/open dialog. ----

    {
      requiresDb: false,
      name: 'export_bulk',
      description:
        'Write one CSV per category/issue family (all URLs, internal HTML, 2xx/3xx/4xx/5xx, every issue filter, redirects/canonicals/hreflang/duplicates/security/AMP, etc.) into a folder — the same dump File → Bulk Export produces. Zero-row categories are skipped. Pass an absolute `outputDir`. Returns `{outputDir, files:[{filePath,label,category,rowsWritten}], errors}`.',
      inputSchema: {
        type: 'object',
        properties: {
          outputDir: { type: 'string', description: 'Absolute output folder. Created files land directly inside it.' },
        },
        required: ['outputDir'],
      },
      handler: async (args) =>
        bridgeRequest<unknown>('POST', '/v1/action/export-bulk', args),
    },

    {
      requiresDb: false,
      name: 'project_save_as',
      description:
        'Snapshot the desktop\'s active project to a new `.seoproject` file via SQLite VACUUM INTO (atomic, WAL-safe). Unlike the desktop "Save Project As", this does NOT switch the active project — it just writes a copy. Pass an absolute `filePath`. Returns `{filePath, bytesWritten}`.',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Absolute destination `.seoproject` path.' },
        },
        required: ['filePath'],
      },
      handler: async (args) =>
        bridgeRequest<{ filePath: string; bytesWritten: number }>(
          'POST',
          '/v1/action/project-save-as',
          args,
        ),
    },

    {
      requiresDb: false,
      name: 'project_save_encrypted',
      description:
        'Export the active project as an AES-256-GCM-encrypted `.seoproject.enc` snapshot protected by a password. Keep the password safe — it cannot be recovered. Pass absolute `filePath` + `password`. Returns `{filePath, bytesWritten}`.',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Absolute destination `.seoproject.enc` path.' },
          password: { type: 'string', description: 'Encryption password.' },
        },
        required: ['filePath', 'password'],
      },
      handler: async (args) =>
        bridgeRequest<{ filePath: string; bytesWritten: number }>(
          'POST',
          '/v1/action/project-save-encrypted',
          args,
        ),
    },

    {
      requiresDb: false,
      name: 'project_open_encrypted',
      description:
        'Decrypt a `.seoproject.enc` snapshot to a destination `.seoproject` and make it the desktop\'s ACTIVE project (this DOES switch the UI). Pass absolute `filePath` (source `.enc`), `destPath` (output `.seoproject`), and `password`. Returns `{filePath}` (the opened destination).',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Absolute source `.seoproject.enc` path.' },
          destPath: { type: 'string', description: 'Absolute output `.seoproject` path for the decrypted project.' },
          password: { type: 'string', description: 'Decryption password.' },
        },
        required: ['filePath', 'destPath', 'password'],
      },
      handler: async (args) =>
        bridgeRequest<{ filePath: string }>(
          'POST',
          '/v1/action/project-open-encrypted',
          args,
        ),
    },
  ];
}
