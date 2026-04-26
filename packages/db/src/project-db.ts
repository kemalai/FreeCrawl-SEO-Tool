import { DatabaseSync, type StatementSync } from 'node:sqlite';
import type {
  AdvancedFilter,
  BrokenLinkRow,
  ContentKind,
  CrawlSummary,
  CrawlUrlRow,
  DiscoveredImage,
  DiscoveredLink,
  DuplicateClusterRow,
  FilterClause,
  FilterField,
  ImageRow,
  Indexability,
  InlinkRow,
  OutlinkRow,
  OverviewCounts,
  UrlCategory,
  UrlDetail,
} from '@freecrawl/shared-types';
import { runMigrations } from './migrations.js';

interface UrlRowDb {
  id: number;
  url: string;
  content_kind: ContentKind;
  status_code: number | null;
  status_text: string | null;
  indexability: Indexability;
  indexability_reason: string | null;
  title: string | null;
  title_length: number | null;
  meta_description: string | null;
  meta_description_length: number | null;
  h1: string | null;
  h1_length: number | null;
  h1_count: number;
  h2_count: number;
  h3_count: number;
  h4_count: number;
  h5_count: number;
  h6_count: number;
  canonical_count: number;
  word_count: number | null;
  canonical: string | null;
  canonical_http: string | null;
  meta_robots: string | null;
  x_robots_tag: string | null;
  content_type: string | null;
  content_length: number | null;
  response_time_ms: number | null;
  depth: number;
  inlinks: number;
  outlinks: number;
  redirect_target: string | null;
  crawled_at: string;
  is_external: number;
  images_count: number;
  images_missing_alt: number;
  lang: string | null;
  viewport: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  twitter_card: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image: string | null;
  meta_keywords: string | null;
  meta_author: string | null;
  meta_generator: string | null;
  theme_color: string | null;
  hsts: string | null;
  x_frame_options: string | null;
  x_content_type_options: string | null;
  content_encoding: string | null;
  schema_types: string | null;
  schema_block_count: number;
  schema_invalid_count: number;
  pagination_next: string | null;
  pagination_prev: string | null;
  hreflangs: string | null;
  hreflang_count: number;
  amphtml: string | null;
  favicon: string | null;
  mixed_content_count: number;
  hreflang_invalid_count: number;
  hreflang_self_ref_missing: number;
  hreflang_reciprocity_missing: number;
  hreflang_target_issues: number;
  redirect_chain_length: number;
  redirect_final_url: string | null;
  redirect_loop: number;
  folder_depth: number;
  query_param_count: number;
  csp: string | null;
  referrer_policy: string | null;
  permissions_policy: string | null;
  custom_search_hits: string | null;
  meta_refresh: string | null;
  meta_refresh_url: string | null;
  charset: string | null;
  extraction_results: string | null;
  simhash: string | null;
  content_hash: string | null;
  cluster_id: number;
  cluster_size: number;
}

interface ImageRowDb {
  id: number;
  src: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  is_internal: number;
  occurrences: number;
}

export interface UpsertUrlInput {
  url: string;
  contentKind?: ContentKind;
  statusCode?: number | null;
  statusText?: string | null;
  indexability?: Indexability;
  indexabilityReason?: string | null;
  title?: string | null;
  metaDescription?: string | null;
  h1?: string | null;
  h1Count?: number;
  h2Count?: number;
  h3Count?: number;
  h4Count?: number;
  h5Count?: number;
  h6Count?: number;
  canonicalCount?: number;
  wordCount?: number | null;
  canonical?: string | null;
  canonicalHttp?: string | null;
  metaRobots?: string | null;
  xRobotsTag?: string | null;
  contentType?: string | null;
  contentLength?: number | null;
  responseTimeMs?: number | null;
  depth: number;
  outlinks?: number;
  redirectTarget?: string | null;
  imagesCount?: number;
  imagesMissingAlt?: number;
  lang?: string | null;
  viewport?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  twitterCard?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  metaKeywords?: string | null;
  metaAuthor?: string | null;
  metaGenerator?: string | null;
  themeColor?: string | null;
  hsts?: string | null;
  xFrameOptions?: string | null;
  xContentTypeOptions?: string | null;
  contentEncoding?: string | null;
  csp?: string | null;
  referrerPolicy?: string | null;
  permissionsPolicy?: string | null;
  /** JSON-stringified `{ term: count, ... }` or null. */
  customSearchHits?: string | null;
  metaRefresh?: string | null;
  metaRefreshUrl?: string | null;
  charset?: string | null;
  schemaTypes?: string | null;
  schemaBlockCount?: number;
  schemaInvalidCount?: number;
  paginationNext?: string | null;
  paginationPrev?: string | null;
  /** JSON-stringified array of `HreflangEntry` objects, or null. */
  hreflangs?: string | null;
  hreflangCount?: number;
  amphtml?: string | null;
  favicon?: string | null;
  mixedContentCount?: number;
  /** JSON-stringified custom-extraction results map. */
  extractionResults?: string | null;
  simhash?: string | null;
  contentHash?: string | null;
}

const UPSERT_URL_SQL = `
  INSERT INTO urls (
    url, content_kind, status_code, status_text, indexability, indexability_reason,
    title, title_length, meta_description, meta_description_length,
    h1, h1_length, h1_count, h2_count, h3_count, h4_count, h5_count, h6_count,
    word_count, canonical, canonical_count, canonical_http, meta_robots, x_robots_tag,
    content_type, content_length, response_time_ms, depth, outlinks, redirect_target,
    images_count, images_missing_alt,
    lang, viewport, og_title, og_description, og_image,
    twitter_card, twitter_title, twitter_description, twitter_image,
    meta_keywords, meta_author, meta_generator, theme_color,
    hsts, x_frame_options, x_content_type_options, content_encoding,
    schema_types, schema_block_count, schema_invalid_count,
    pagination_next, pagination_prev, hreflangs, hreflang_count,
    amphtml, favicon, mixed_content_count,
    folder_depth, query_param_count,
    csp, referrer_policy, permissions_policy,
    custom_search_hits,
    meta_refresh, meta_refresh_url, charset,
    extraction_results,
    simhash, content_hash
  ) VALUES (
    :url, :content_kind, :status_code, :status_text, :indexability, :indexability_reason,
    :title, :title_length, :meta_description, :meta_description_length,
    :h1, :h1_length, :h1_count, :h2_count, :h3_count, :h4_count, :h5_count, :h6_count,
    :word_count, :canonical, :canonical_count, :canonical_http, :meta_robots, :x_robots_tag,
    :content_type, :content_length, :response_time_ms, :depth, :outlinks, :redirect_target,
    :images_count, :images_missing_alt,
    :lang, :viewport, :og_title, :og_description, :og_image,
    :twitter_card, :twitter_title, :twitter_description, :twitter_image,
    :meta_keywords, :meta_author, :meta_generator, :theme_color,
    :hsts, :x_frame_options, :x_content_type_options, :content_encoding,
    :schema_types, :schema_block_count, :schema_invalid_count,
    :pagination_next, :pagination_prev, :hreflangs, :hreflang_count,
    :amphtml, :favicon, :mixed_content_count,
    :folder_depth, :query_param_count,
    :csp, :referrer_policy, :permissions_policy,
    :custom_search_hits,
    :meta_refresh, :meta_refresh_url, :charset,
    :extraction_results,
    :simhash, :content_hash
  )
  ON CONFLICT(url) DO UPDATE SET
    content_kind = excluded.content_kind,
    status_code = excluded.status_code,
    status_text = excluded.status_text,
    indexability = excluded.indexability,
    indexability_reason = excluded.indexability_reason,
    title = excluded.title,
    title_length = excluded.title_length,
    meta_description = excluded.meta_description,
    meta_description_length = excluded.meta_description_length,
    h1 = excluded.h1,
    h1_length = excluded.h1_length,
    h1_count = excluded.h1_count,
    h2_count = excluded.h2_count,
    h3_count = excluded.h3_count,
    h4_count = excluded.h4_count,
    h5_count = excluded.h5_count,
    h6_count = excluded.h6_count,
    word_count = excluded.word_count,
    canonical = excluded.canonical,
    canonical_count = excluded.canonical_count,
    canonical_http = excluded.canonical_http,
    meta_robots = excluded.meta_robots,
    x_robots_tag = excluded.x_robots_tag,
    content_type = excluded.content_type,
    content_length = excluded.content_length,
    response_time_ms = excluded.response_time_ms,
    depth = excluded.depth,
    outlinks = excluded.outlinks,
    redirect_target = excluded.redirect_target,
    images_count = excluded.images_count,
    images_missing_alt = excluded.images_missing_alt,
    lang = excluded.lang,
    viewport = excluded.viewport,
    og_title = excluded.og_title,
    og_description = excluded.og_description,
    og_image = excluded.og_image,
    twitter_card = excluded.twitter_card,
    twitter_title = excluded.twitter_title,
    twitter_description = excluded.twitter_description,
    twitter_image = excluded.twitter_image,
    meta_keywords = excluded.meta_keywords,
    meta_author = excluded.meta_author,
    meta_generator = excluded.meta_generator,
    theme_color = excluded.theme_color,
    hsts = excluded.hsts,
    x_frame_options = excluded.x_frame_options,
    x_content_type_options = excluded.x_content_type_options,
    content_encoding = excluded.content_encoding,
    schema_types = excluded.schema_types,
    schema_block_count = excluded.schema_block_count,
    schema_invalid_count = excluded.schema_invalid_count,
    pagination_next = excluded.pagination_next,
    pagination_prev = excluded.pagination_prev,
    hreflangs = excluded.hreflangs,
    hreflang_count = excluded.hreflang_count,
    amphtml = excluded.amphtml,
    favicon = excluded.favicon,
    mixed_content_count = excluded.mixed_content_count,
    folder_depth = excluded.folder_depth,
    query_param_count = excluded.query_param_count,
    csp = excluded.csp,
    referrer_policy = excluded.referrer_policy,
    permissions_policy = excluded.permissions_policy,
    custom_search_hits = excluded.custom_search_hits,
    meta_refresh = excluded.meta_refresh,
    meta_refresh_url = excluded.meta_refresh_url,
    charset = excluded.charset,
    extraction_results = excluded.extraction_results,
    simhash = excluded.simhash,
    content_hash = excluded.content_hash,
    crawled_at = CURRENT_TIMESTAMP
  RETURNING id
`;

export class ProjectDb {
  private readonly db: DatabaseSync;
  private readonly stmtUpsertUrl: StatementSync;
  private readonly stmtGetUrlId: StatementSync;
  private readonly stmtInsertLink: StatementSync;
  private readonly stmtInsertExternalStub: StatementSync;

  constructor(filePath: string) {
    this.db = new DatabaseSync(filePath);
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA synchronous = NORMAL');
    this.db.exec('PRAGMA foreign_keys = ON');
    this.db.exec('PRAGMA temp_store = MEMORY');
    this.db.exec('PRAGMA cache_size = -131072');
    // 30GB virtual address window for mmap-backed reads; OS only pages in
    // what's touched, so there's no actual memory commit here.
    this.db.exec('PRAGMA mmap_size = 30000000000');
    this.db.exec('PRAGMA page_size = 4096');
    this.db.exec('PRAGMA wal_autocheckpoint = 2000');
    runMigrations(this.db);

    this.stmtUpsertUrl = this.db.prepare(UPSERT_URL_SQL);
    this.stmtGetUrlId = this.db.prepare('SELECT id FROM urls WHERE url = ?');
    this.stmtInsertLink = this.db.prepare(
      'INSERT INTO links (from_url_id, to_url, anchor, rel, is_internal) VALUES (?, ?, ?, ?, ?)',
    );
    this.stmtInsertExternalStub = this.db.prepare(
      `INSERT INTO urls (url, content_kind, depth, is_external, indexability)
       VALUES (?, 'other', ?, 1, 'indexable')
       ON CONFLICT(url) DO NOTHING`,
    );
  }

  close(): void {
    this.db.close();
  }

  reset(): void {
    this.db.exec(
      `DELETE FROM image_usages;
       DELETE FROM images;
       DELETE FROM links;
       DELETE FROM headers;
       DELETE FROM sitemap_urls;
       DELETE FROM urls;
       DELETE FROM project_meta;`,
    );
  }

  getMeta(key: string): string | null {
    const row = this.db
      .prepare('SELECT value FROM project_meta WHERE key = ?')
      .get(key) as { value: string } | undefined;
    return row?.value ?? null;
  }

  setMeta(key: string, value: string): void {
    this.db
      .prepare(
        `INSERT INTO project_meta (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      )
      .run(key, value);
  }

  getAllUrls(): string[] {
    return (
      this.db.prepare('SELECT url FROM urls').all() as unknown as { url: string }[]
    ).map((r) => r.url);
  }

  countCrawledUrls(): number {
    return (
      this.db
        .prepare(
          'SELECT COUNT(*) AS c FROM urls WHERE status_code IS NOT NULL AND is_external = 0',
        )
        .get() as { c: number }
    ).c;
  }

  /**
   * Internal link targets that were discovered via the links table but are
   * not yet present in the urls table (never crawled). Returns the minimum
   * depth at which each pending URL was discovered.
   */
  deleteUrl(id: number): void {
    this.db.prepare('DELETE FROM urls WHERE id = ?').run(id);
  }

  markUrlForRecrawl(id: number): void {
    this.db
      .prepare(
        `UPDATE urls SET
           status_code = NULL,
           status_text = NULL,
           indexability = 'indexable',
           indexability_reason = NULL
         WHERE id = ? AND is_external = 0`,
      )
      .run(id);
  }

  markUrlsForRecrawl(ids: number[]): void {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    this.db
      .prepare(
        `UPDATE urls SET
           status_code = NULL,
           status_text = NULL,
           indexability = 'indexable',
           indexability_reason = NULL
         WHERE id IN (${placeholders}) AND is_external = 0`,
      )
      .run(...ids);
  }

  deleteUrls(ids: number[]): void {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    this.db.prepare(`DELETE FROM urls WHERE id IN (${placeholders})`).run(...ids);
  }

  /** Look up the URL strings for a batch of ids (preserves DB order). */
  getUrlsByIds(ids: number[]): string[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.db
      .prepare(`SELECT url FROM urls WHERE id IN (${placeholders})`)
      .all(...ids) as unknown as { url: string }[];
    return rows.map((r) => r.url);
  }

  getUrlRowById(id: number): { url: string; depth: number; isExternal: number } | null {
    const row = this.db
      .prepare('SELECT url, depth, is_external FROM urls WHERE id = ?')
      .get(id) as { url: string; depth: number; is_external: number } | undefined;
    return row
      ? { url: row.url, depth: row.depth, isExternal: row.is_external }
      : null;
  }

  getUnprobedExternalUrls(): string[] {
    return (
      this.db
        .prepare(
          'SELECT url FROM urls WHERE is_external = 1 AND status_code IS NULL',
        )
        .all() as unknown as { url: string }[]
    ).map((r) => r.url);
  }

  updateExternalProbe(
    url: string,
    patch: {
      statusCode: number | null;
      statusText?: string | null;
      contentType?: string | null;
      contentLength?: number | null;
      responseTimeMs?: number | null;
    },
  ): void {
    this.db
      .prepare(
        `UPDATE urls SET
           status_code = :status_code,
           status_text = :status_text,
           content_type = :content_type,
           content_length = :content_length,
           response_time_ms = :response_time_ms
         WHERE url = :url AND is_external = 1`,
      )
      .run({
        url,
        status_code: patch.statusCode,
        status_text: patch.statusText ?? null,
        content_type: patch.contentType ?? null,
        content_length: patch.contentLength ?? null,
        response_time_ms: patch.responseTimeMs ?? null,
      });
  }

  getPendingInternalLinks(): { url: string; depth: number }[] {
    const discovered = this.db
      .prepare(
        `SELECT l.to_url AS url, MIN(u.depth) + 1 AS depth
         FROM links l
         JOIN urls u ON l.from_url_id = u.id
         WHERE l.is_internal = 1
           AND l.to_url NOT IN (SELECT url FROM urls)
         GROUP BY l.to_url`,
      )
      .all() as unknown as { url: string; depth: number }[];
    // Also include URLs that were previously crawled but have been marked
    // for re-crawl (status_code nulled out).
    const recrawl = this.db
      .prepare(
        `SELECT url, depth FROM urls
         WHERE is_external = 0 AND status_code IS NULL`,
      )
      .all() as unknown as { url: string; depth: number }[];
    return [...discovered, ...recrawl];
  }

  countUrls(): number {
    return (this.db.prepare('SELECT COUNT(*) AS c FROM urls').get() as { c: number }).c;
  }

  hasUrl(url: string): boolean {
    return this.db.prepare('SELECT 1 FROM urls WHERE url = ?').get(url) !== undefined;
  }

  upsertUrl(input: UpsertUrlInput): number {
    const params = {
      url: input.url,
      content_kind: input.contentKind ?? 'html',
      status_code: input.statusCode ?? null,
      status_text: input.statusText ?? null,
      indexability: input.indexability ?? 'indexable',
      indexability_reason: input.indexabilityReason ?? null,
      title: input.title ?? null,
      title_length: input.title?.length ?? null,
      meta_description: input.metaDescription ?? null,
      meta_description_length: input.metaDescription?.length ?? null,
      h1: input.h1 ?? null,
      h1_length: input.h1?.length ?? null,
      h1_count: input.h1Count ?? 0,
      h2_count: input.h2Count ?? 0,
      h3_count: input.h3Count ?? 0,
      h4_count: input.h4Count ?? 0,
      h5_count: input.h5Count ?? 0,
      h6_count: input.h6Count ?? 0,
      word_count: input.wordCount ?? null,
      canonical: input.canonical ?? null,
      canonical_count: input.canonicalCount ?? 0,
      canonical_http: input.canonicalHttp ?? null,
      meta_robots: input.metaRobots ?? null,
      x_robots_tag: input.xRobotsTag ?? null,
      content_type: input.contentType ?? null,
      content_length: input.contentLength ?? null,
      response_time_ms: input.responseTimeMs ?? null,
      depth: input.depth,
      outlinks: input.outlinks ?? 0,
      redirect_target: input.redirectTarget ?? null,
      images_count: input.imagesCount ?? 0,
      images_missing_alt: input.imagesMissingAlt ?? 0,
      lang: input.lang ?? null,
      viewport: input.viewport ?? null,
      og_title: input.ogTitle ?? null,
      og_description: input.ogDescription ?? null,
      og_image: input.ogImage ?? null,
      twitter_card: input.twitterCard ?? null,
      twitter_title: input.twitterTitle ?? null,
      twitter_description: input.twitterDescription ?? null,
      twitter_image: input.twitterImage ?? null,
      meta_keywords: input.metaKeywords ?? null,
      meta_author: input.metaAuthor ?? null,
      meta_generator: input.metaGenerator ?? null,
      theme_color: input.themeColor ?? null,
      hsts: input.hsts ?? null,
      x_frame_options: input.xFrameOptions ?? null,
      x_content_type_options: input.xContentTypeOptions ?? null,
      content_encoding: input.contentEncoding ?? null,
      schema_types: input.schemaTypes ?? null,
      schema_block_count: input.schemaBlockCount ?? 0,
      schema_invalid_count: input.schemaInvalidCount ?? 0,
      pagination_next: input.paginationNext ?? null,
      pagination_prev: input.paginationPrev ?? null,
      hreflangs: input.hreflangs ?? null,
      hreflang_count: input.hreflangCount ?? 0,
      amphtml: input.amphtml ?? null,
      favicon: input.favicon ?? null,
      mixed_content_count: input.mixedContentCount ?? 0,
      folder_depth: computeFolderDepth(input.url),
      query_param_count: computeQueryParamCount(input.url),
      csp: input.csp ?? null,
      referrer_policy: input.referrerPolicy ?? null,
      permissions_policy: input.permissionsPolicy ?? null,
      custom_search_hits: input.customSearchHits ?? null,
      meta_refresh: input.metaRefresh ?? null,
      meta_refresh_url: input.metaRefreshUrl ?? null,
      charset: input.charset ?? null,
      extraction_results: input.extractionResults ?? null,
      simhash: input.simhash ?? null,
      content_hash: input.contentHash ?? null,
    };

    const row = this.stmtUpsertUrl.get(params) as { id: number } | undefined;
    if (row?.id) return row.id;
    // Fallback: RETURNING may be skipped in some edge cases; look up by url.
    const fallback = this.stmtGetUrlId.get(input.url) as { id: number } | undefined;
    return fallback?.id ?? 0;
  }

  insertLinks(fromUrlId: number, links: DiscoveredLink[], fromDepth: number): void {
    if (links.length === 0) return;
    const CHUNK = 200;
    this.db.exec('BEGIN');
    try {
      // Insert links in multi-row VALUES chunks — each chunk is a single
      // prepared statement + .run(), which is far cheaper than one .run()
      // per link.
      for (let i = 0; i < links.length; i += CHUNK) {
        const slice = links.slice(i, i + CHUNK);
        const placeholders = slice
          .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .join(',');
        const args: (string | number | null)[] = [];
        for (const link of slice) {
          args.push(
            fromUrlId,
            link.toUrl,
            link.anchor,
            link.rel,
            link.isInternal ? 1 : 0,
            link.type,
            link.altText,
            link.target,
            link.pathType,
            link.linkPath,
            link.linkPosition,
            link.linkOrigin,
          );
        }
        this.db
          .prepare(
            `INSERT INTO links (
               from_url_id, to_url, anchor, rel, is_internal,
               type, alt_text, target, path_type, link_path, link_position, link_origin
             ) VALUES ${placeholders}`,
          )
          .run(...args);
      }

      // External stubs: also batched into multi-row inserts. ON CONFLICT
      // keeps already-known external URLs untouched.
      const externals = links.filter((l) => !l.isInternal);
      if (externals.length > 0) {
        const externalDepth = fromDepth + 1;
        for (let i = 0; i < externals.length; i += CHUNK) {
          const slice = externals.slice(i, i + CHUNK);
          const placeholders = slice.map(() => `(?, 'other', ?, 1, 'indexable')`).join(',');
          const args: (string | number)[] = [];
          for (const link of slice) {
            args.push(link.toUrl, externalDepth);
          }
          this.db
            .prepare(
              `INSERT INTO urls (url, content_kind, depth, is_external, indexability)
               VALUES ${placeholders}
               ON CONFLICT(url) DO NOTHING`,
            )
            .run(...args);
        }
      }

      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  recomputeInlinks(): void {
    // One-pass aggregate via temp table: GROUP BY links.to_url once, then
    // join. The naive correlated-subquery form (UPDATE … = (SELECT COUNT…))
    // does N×M work and is ~minutes at 1M URLs.
    this.db.exec('BEGIN');
    try {
      this.db.exec('DROP TABLE IF EXISTS _inlink_counts');
      this.db.exec(`
        CREATE TEMP TABLE _inlink_counts AS
          SELECT to_url AS url, COUNT(*) AS c
          FROM links
          WHERE is_internal = 1
          GROUP BY to_url
      `);
      this.db.exec('CREATE INDEX _inlink_counts_url ON _inlink_counts(url)');
      this.db.exec(`
        UPDATE urls SET inlinks = COALESCE(
          (SELECT c FROM _inlink_counts WHERE _inlink_counts.url = urls.url),
          0
        )
      `);
      this.db.exec('DROP TABLE _inlink_counts');
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  /**
   * Walk every redirect's `redirect_target` chain to its terminal URL,
   * detect cycles, and write `redirect_chain_length` / `redirect_final_url`
   * / `redirect_loop` for each redirect row.
   *
   * Algorithm:
   *   1. Snapshot `(url -> redirect_target)` into a Map (one DB scan).
   *   2. For every redirect row (status_code 3xx), walk the map; track a
   *      `visited` set so cycles produce `redirect_loop = 1` instead of
   *      looping forever.
   *
   * O(N) memory, O(N · avg_chain_depth) time. Chains tend to be 1–3 hops
   * in practice so the walk is cheap.
   */
  recomputeRedirectChains(): void {
    // Only chain hops are needed in memory — snapshotting the entire `urls`
    // table costs ~100 MB at 1M rows for no benefit. Pull just rows whose
    // `redirect_target` is non-null (i.e. actual hops in some chain).
    const allRows = this.db
      .prepare(
        'SELECT url, redirect_target FROM urls WHERE redirect_target IS NOT NULL',
      )
      .all() as { url: string; redirect_target: string | null }[];
    const targetByUrl = new Map<string, string | null>();
    for (const r of allRows) targetByUrl.set(r.url, r.redirect_target);

    const redirects = this.db
      .prepare(
        'SELECT id, url FROM urls WHERE status_code >= 300 AND status_code < 400',
      )
      .all() as { id: number; url: string }[];

    const upd = this.db.prepare(
      `UPDATE urls SET
         redirect_chain_length = ?,
         redirect_final_url = ?,
         redirect_loop = ?
       WHERE id = ?`,
    );

    this.db.exec('BEGIN');
    try {
      for (const row of redirects) {
        const visited = new Set<string>();
        let current: string | null = row.url;
        let chain = 0;
        let loop = 0;
        let finalUrl: string | null = null;
        // Hard cap so a pathological dataset can't run away even if the
        // visited-set guard somehow fails (e.g. URL canonicalisation slip).
        const HARD_LIMIT = 50;
        while (current && chain < HARD_LIMIT) {
          if (visited.has(current)) {
            loop = 1;
            break;
          }
          visited.add(current);
          const nextHop: string | null = targetByUrl.get(current) ?? null;
          if (!nextHop) {
            finalUrl = current;
            break;
          }
          chain++;
          current = nextHop;
        }
        upd.run(chain, finalUrl, loop, row.id);
      }
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  /**
   * Cluster pages by SimHash hamming distance ≤ `thresholdBits` and
   * write `cluster_id` / `cluster_size` back to every URL.
   *
   * Algorithm — band-based LSH + Union-Find:
   *
   *   1. Pull `(id, simhash)` for every internal HTML row whose simhash
   *      is non-null. (Optionally restrict to indexable rows.)
   *   2. Split each 64-bit hash into 4 × 16-bit bands. By the pigeonhole
   *      principle, any two hashes within hamming distance ≤ 3 must
   *      agree on at least one band — so candidates are a strict subset
   *      of "shares a band value". This collapses the comparison from
   *      O(N²) to ~O(N · avg_bucket_size).
   *   3. For every band-value bucket, do exact pairwise hamming checks.
   *      Pairs within the threshold get unioned in a Union-Find DSU.
   *   4. The DSU's connected components ARE the clusters. Map each root
   *      to a sequential cluster_id and write back `(cluster_id,
   *      cluster_size)` in a batched UPDATE.
   *
   * Memory: O(N) for the SimHash list + DSU. ~80 MB at 1M URLs.
   * Time:   ~3–10 s at 1M URLs depending on bucket distribution.
   *
   * `onlyIndexable=true` skips noindex / canonicalised / blocked-robots
   * pages — the duplicate report then surfaces only issues that actually
   * affect search visibility.
   */
  recomputeDuplicateClusters(
    thresholdBits: number,
    onlyIndexable: boolean,
  ): { clusters: number; clusteredUrls: number } {
    // Reset all clustering state first so a re-run with different
    // thresholds doesn't leave stale partitions behind.
    this.db.exec('UPDATE urls SET cluster_id = 0, cluster_size = 1 WHERE cluster_id != 0');

    if (thresholdBits < 0 || thresholdBits > 64) {
      return { clusters: 0, clusteredUrls: 0 };
    }

    const indexClause = onlyIndexable ? "AND indexability = 'indexable'" : '';
    const rows = this.db
      .prepare(
        `SELECT id, simhash FROM urls
           WHERE is_external = 0 AND content_kind = 'html'
             AND simhash IS NOT NULL ${indexClause}`,
      )
      .all() as { id: number; simhash: string }[];

    if (rows.length < 2) return { clusters: 0, clusteredUrls: 0 };

    const N = rows.length;
    const ids = new Int32Array(N);
    const hashes: bigint[] = new Array<bigint>(N);
    for (let i = 0; i < N; i++) {
      ids[i] = rows[i]!.id;
      hashes[i] = BigInt('0x' + rows[i]!.simhash);
    }

    // Union-Find with path compression + union-by-rank.
    const parent = new Int32Array(N);
    const rank = new Int8Array(N);
    for (let i = 0; i < N; i++) parent[i] = i;
    const find = (x: number): number => {
      let root = x;
      while (parent[root] !== root) root = parent[root]!;
      // Path-compress.
      while (parent[x] !== root) {
        const next = parent[x]!;
        parent[x] = root;
        x = next;
      }
      return root;
    };
    const union = (a: number, b: number): void => {
      const ra = find(a);
      const rb = find(b);
      if (ra === rb) return;
      if (rank[ra]! < rank[rb]!) parent[ra] = rb;
      else if (rank[ra]! > rank[rb]!) parent[rb] = ra;
      else {
        parent[rb] = ra;
        rank[ra]!++;
      }
    };

    // Hamming distance over 64-bit BigInt — popcount via Brian Kernighan.
    const hamming = (a: bigint, b: bigint): number => {
      let x = a ^ b;
      let c = 0;
      while (x !== 0n) {
        x &= x - 1n;
        c++;
      }
      return c;
    };

    // Band buckets: 4 bands × Map<bandValue, indices[]>. We cap bucket
    // size to BUCKET_LIMIT — pathological banner-only pages can otherwise
    // produce a single bucket containing every page on the site, which
    // would make the inner-loop comparison quadratic again.
    const BUCKET_LIMIT = 5000;
    for (let band = 0; band < 4; band++) {
      const shift = BigInt(band * 16);
      const mask = 0xffffn;
      const buckets = new Map<number, number[]>();
      for (let i = 0; i < N; i++) {
        const v = Number((hashes[i]! >> shift) & mask);
        let bucket = buckets.get(v);
        if (!bucket) {
          bucket = [];
          buckets.set(v, bucket);
        }
        if (bucket.length < BUCKET_LIMIT) bucket.push(i);
      }
      for (const bucket of buckets.values()) {
        if (bucket.length < 2) continue;
        for (let a = 0; a < bucket.length; a++) {
          const ia = bucket[a]!;
          for (let b = a + 1; b < bucket.length; b++) {
            const ib = bucket[b]!;
            // Skip pairs already in the same component — we're going to
            // touch the same band repeatedly across all 4 passes and the
            // DSU find is cheap.
            if (find(ia) === find(ib)) continue;
            if (hamming(hashes[ia]!, hashes[ib]!) <= thresholdBits) {
              union(ia, ib);
            }
          }
        }
      }
    }

    // Materialise clusters: assign sequential cluster IDs starting at 1
    // (0 is reserved for "singleton"). Members of a singleton component
    // keep cluster_id = 0 so the `cluster_id > 0` filter does the right
    // thing in the issue WHERE clause.
    const rootToCluster = new Map<number, number>();
    const clusterSize = new Map<number, number>();
    for (let i = 0; i < N; i++) {
      const root = find(i);
      clusterSize.set(root, (clusterSize.get(root) ?? 0) + 1);
    }
    let nextClusterId = 1;
    let clusteredUrls = 0;
    for (const [root, size] of clusterSize) {
      if (size > 1) {
        rootToCluster.set(root, nextClusterId++);
        clusteredUrls += size;
      }
    }

    const upd = this.db.prepare(
      'UPDATE urls SET cluster_id = ?, cluster_size = ? WHERE id = ?',
    );
    this.db.exec('BEGIN');
    try {
      for (let i = 0; i < N; i++) {
        const root = find(i);
        const cid = rootToCluster.get(root);
        if (cid !== undefined) {
          upd.run(cid, clusterSize.get(root)!, ids[i]!);
        }
      }
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }

    return { clusters: rootToCluster.size, clusteredUrls };
  }

  /**
   * Page through near-duplicate clusters for the dedicated Duplicates tab.
   * Members are returned grouped: ORDER BY cluster_size DESC, cluster_id,
   * then by URL within the cluster. Singletons (cluster_id=0) are excluded.
   */
  listDuplicateClusters(offset: number, limit: number): DuplicateClusterRow[] {
    const rows = this.db
      .prepare(
        `SELECT u.url, u.status_code, u.indexability, u.title, u.word_count,
                u.inlinks, u.cluster_id, u.cluster_size, u.simhash
           FROM urls u
          WHERE u.is_external = 0 AND u.content_kind = 'html'
            AND u.cluster_id > 0
          ORDER BY u.cluster_size DESC, u.cluster_id ASC, u.url ASC
          LIMIT ? OFFSET ?`,
      )
      .all(limit, offset) as {
      url: string;
      status_code: number | null;
      indexability: Indexability;
      title: string | null;
      word_count: number | null;
      inlinks: number;
      cluster_id: number;
      cluster_size: number;
      simhash: string | null;
    }[];

    // Cluster representative = first URL alphabetically per cluster_id.
    // Reps are not stored explicitly; derive on the fly so the column
    // remains accurate after re-clustering.
    const reps = new Map<number, string>();
    for (const r of rows) {
      const existing = reps.get(r.cluster_id);
      if (existing === undefined || r.url < existing) reps.set(r.cluster_id, r.url);
    }
    const repHashes = new Map<number, string>();
    if (reps.size > 0) {
      const repList = Array.from(reps.values());
      const placeholders = repList.map(() => '?').join(',');
      const repRows = this.db
        .prepare(`SELECT url, simhash FROM urls WHERE url IN (${placeholders})`)
        .all(...repList) as { url: string; simhash: string | null }[];
      const urlToHash = new Map(repRows.map((r) => [r.url, r.simhash]));
      for (const [cid, url] of reps) {
        const h = urlToHash.get(url);
        if (h) repHashes.set(cid, h);
      }
    }

    const popcount = (x: bigint): number => {
      let c = 0;
      while (x !== 0n) {
        x &= x - 1n;
        c++;
      }
      return c;
    };

    return rows.map((r) => {
      let hammingFromRep = 0;
      const repHash = repHashes.get(r.cluster_id);
      if (repHash && r.simhash && repHash !== r.simhash) {
        hammingFromRep = popcount(BigInt('0x' + repHash) ^ BigInt('0x' + r.simhash));
      }
      return {
        url: r.url,
        statusCode: r.status_code,
        indexability: r.indexability,
        title: r.title,
        wordCount: r.word_count,
        inlinks: r.inlinks,
        clusterId: r.cluster_id,
        clusterSize: r.cluster_size,
        simhash: r.simhash,
        hammingFromRep,
      };
    });
  }

  countDuplicateClusterMembers(): number {
    return (
      this.db
        .prepare(
          `SELECT COUNT(*) AS c FROM urls
            WHERE is_external = 0 AND content_kind = 'html' AND cluster_id > 0`,
        )
        .get() as { c: number }
    ).c;
  }

  /**
   * Post-crawl hreflang validation. For every page that declares one or
   * more `<link rel="alternate" hreflang>` entries we compute four flags
   * and write them back to dedicated columns:
   *
   *   - `hreflang_invalid_count`         — entries whose `lang` token is
   *     not a valid BCP-47 subtag (or `x-default`). Common bugs: spaces,
   *     uppercase, missing region for `*-` formats, country instead of
   *     language, etc.
   *   - `hreflang_self_ref_missing` (0/1) — page does not list its own
   *     URL as one of the hreflang alternates. Google MUST-have.
   *   - `hreflang_reciprocity_missing`   — count of declared targets that
   *     do NOT list this page back. (Computed against the in-crawl
   *     hreflang graph; pages we never crawled are skipped, not counted
   *     as missing — partial crawls would otherwise be all-red.)
   *   - `hreflang_target_issues`         — count of declared targets that
   *     resolve to a crawled URL with non-200 status, noindex, or that
   *     canonicalises to a different URL. Aggregated for a single
   *     "Hreflang Target Issues" filter.
   *
   * Cost: O(N · avg_hreflang_count) parse + map lookups. ~2-5 s at 100K
   * URLs with hreflang on 5% of pages.
   */
  recomputeHreflangAnalysis(): void {
    // Reset the four columns first so re-runs don't leave stale flags.
    this.db.exec(
      `UPDATE urls
         SET hreflang_invalid_count = 0,
             hreflang_self_ref_missing = 0,
             hreflang_reciprocity_missing = 0,
             hreflang_target_issues = 0
       WHERE is_external = 0 AND content_kind = 'html'`,
    );

    interface HreflangRow {
      id: number;
      url: string;
      hreflangs: string | null;
      hreflang_count: number;
    }
    const rows = this.db
      .prepare(
        `SELECT id, url, hreflangs, hreflang_count FROM urls
          WHERE is_external = 0 AND content_kind = 'html'
            AND hreflang_count > 0 AND hreflangs IS NOT NULL`,
      )
      .all() as unknown as HreflangRow[];

    if (rows.length === 0) return;

    interface ParsedEntry {
      lang: string;
      href: string;
      langValid: boolean;
    }
    const declarationsByPage = new Map<string, ParsedEntry[]>();
    const allTargets = new Set<string>();
    for (const r of rows) {
      let parsed: { lang?: unknown; href?: unknown }[];
      try {
        const j = JSON.parse(r.hreflangs ?? '[]') as unknown;
        parsed = Array.isArray(j) ? (j as { lang?: unknown; href?: unknown }[]) : [];
      } catch {
        parsed = [];
      }
      const entries: ParsedEntry[] = [];
      for (const e of parsed) {
        const lang = typeof e.lang === 'string' ? e.lang : '';
        const href = typeof e.href === 'string' ? e.href : '';
        if (!lang || !href) continue;
        entries.push({ lang, href, langValid: isValidHreflangCode(lang) });
        allTargets.add(href);
      }
      declarationsByPage.set(r.url, entries);
    }

    // Snapshot status / indexability / canonical for every URL referenced
    // as a hreflang target — single batched query keeps the cost O(T).
    interface TargetMeta {
      status: number | null;
      indexability: Indexability;
      canonical: string | null;
    }
    const targetMeta = new Map<string, TargetMeta>();
    if (allTargets.size > 0) {
      // Chunk to stay under SQLite's 999-parameter default limit.
      const CHUNK = 800;
      const list = Array.from(allTargets);
      for (let i = 0; i < list.length; i += CHUNK) {
        const slice = list.slice(i, i + CHUNK);
        const placeholders = slice.map(() => '?').join(',');
        const metaRows = this.db
          .prepare(
            `SELECT url, status_code, indexability, canonical FROM urls
              WHERE url IN (${placeholders})`,
          )
          .all(...slice) as {
          url: string;
          status_code: number | null;
          indexability: Indexability;
          canonical: string | null;
        }[];
        for (const m of metaRows) {
          targetMeta.set(m.url, {
            status: m.status_code,
            indexability: m.indexability,
            canonical: m.canonical,
          });
        }
      }
    }

    // Build a quick reverse-lookup: for each page, which URLs declare a
    // hreflang to it? Used for reciprocity. We're constructing a multi-
    // set so a target hit by 3 pages records all 3 sources.
    const declaredBy = new Map<string, Set<string>>();
    for (const [src, entries] of declarationsByPage) {
      for (const e of entries) {
        let set = declaredBy.get(e.href);
        if (!set) {
          set = new Set<string>();
          declaredBy.set(e.href, set);
        }
        set.add(src);
      }
    }

    const upd = this.db.prepare(
      `UPDATE urls SET
         hreflang_invalid_count = ?,
         hreflang_self_ref_missing = ?,
         hreflang_reciprocity_missing = ?,
         hreflang_target_issues = ?
       WHERE id = ?`,
    );

    this.db.exec('BEGIN');
    try {
      for (const r of rows) {
        const entries = declarationsByPage.get(r.url) ?? [];
        let invalidCount = 0;
        let selfRef = false;
        let reciprocityMissing = 0;
        let targetIssues = 0;
        for (const e of entries) {
          if (!e.langValid) invalidCount++;
          if (e.href === r.url) selfRef = true;
          // Reciprocity — only score targets we actually crawled. Targets
          // outside the crawl scope can't be checked, and counting them
          // as missing would punish partial / scoped crawls.
          if (targetMeta.has(e.href) && e.href !== r.url) {
            const back = declaredBy.get(r.url);
            if (!back || !back.has(e.href)) reciprocityMissing++;
          }
          // Target issues: non-200, noindex, or canonicalised away.
          const meta = targetMeta.get(e.href);
          if (meta) {
            const badStatus =
              meta.status === null || meta.status < 200 || meta.status >= 300;
            const isNoindex = meta.indexability === 'non-indexable:noindex';
            const isCanonAway =
              meta.canonical !== null &&
              meta.canonical !== '' &&
              meta.canonical !== e.href;
            if (badStatus || isNoindex || isCanonAway) targetIssues++;
          }
        }
        upd.run(
          invalidCount,
          selfRef ? 0 : 1,
          reciprocityMissing,
          targetIssues,
          r.id,
        );
      }
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  /**
   * Replace any previously-discovered sitemap entries with `entries`.
   * Bulk-inserted in chunks; on URL-level conflicts (same `<loc>` listed
   * by multiple sitemaps) the first one wins.
   */
  setSitemapUrls(
    entries: ReadonlyArray<{
      url: string;
      lastmod: string | null;
      priority: number | null;
      changefreq: string | null;
      source: string;
    }>,
  ): void {
    this.db.exec('BEGIN');
    try {
      this.db.exec('DELETE FROM sitemap_urls');
      if (entries.length > 0) {
        const CHUNK = 200;
        for (let i = 0; i < entries.length; i += CHUNK) {
          const slice = entries.slice(i, i + CHUNK);
          const placeholders = slice.map(() => '(?, ?, ?, ?, ?)').join(',');
          const args: (string | number | null)[] = [];
          for (const e of slice) {
            args.push(e.url, e.lastmod, e.priority, e.changefreq, e.source);
          }
          this.db
            .prepare(
              `INSERT INTO sitemap_urls (url, lastmod, priority, changefreq, source_sitemap)
               VALUES ${placeholders}
               ON CONFLICT(url) DO NOTHING`,
            )
            .run(...args);
        }
      }
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  countSitemapUrls(): number {
    return (this.db.prepare('SELECT COUNT(*) AS c FROM sitemap_urls').get() as { c: number }).c;
  }

  /**
   * Aggregate internal HTML URLs by their leading-N path segments.
   *
   * Examples (depth = 1):
   *   `/blog/post-a`, `/blog/post-b` → `{ "/blog": 2 }`
   *   `/`, `/about`                  → `{ "/": 1, "/about": 1 }`
   *
   * Examples (depth = 2):
   *   `/blog/2024/foo`, `/blog/2024/bar`, `/blog/2025/x`
   *     → `{ "/blog/2024": 2, "/blog/2025": 1 }`
   *
   * Aggregated client-side from the URL strings rather than via heavy SQL
   * substring acrobatics — for 100K URLs this is well under 100 ms. Keeps
   * the SQL legible and forward-compatible if we later want to mix in
   * per-directory metrics (avg word count, avg response time).
   */
  getPagesPerDirectory(
    opts: { depth?: number; limit?: number } = {},
  ): { directory: string; count: number }[] {
    const targetDepth = Math.max(1, Math.min(10, opts.depth ?? 1));
    const limit = Math.max(1, Math.min(2000, opts.limit ?? 500));
    const rows = this.db
      .prepare(
        "SELECT url FROM urls WHERE is_external = 0 AND content_kind = 'html'",
      )
      .all() as { url: string }[];
    const counts = new Map<string, number>();
    for (const r of rows) {
      try {
        const u = new URL(r.url);
        const segments = u.pathname.split('/').filter((s) => s.length > 0);
        const taken = segments.slice(0, targetDepth);
        const dir = taken.length > 0 ? '/' + taken.join('/') : '/';
        counts.set(dir, (counts.get(dir) ?? 0) + 1);
      } catch {
        // skip unparseable URL — already a separate issue category
      }
    }
    return [...counts.entries()]
      .map(([directory, count]) => ({ directory, count }))
      .sort((a, b) => b.count - a.count || a.directory.localeCompare(b.directory))
      .slice(0, limit);
  }

  /**
   * Status-code histogram across internal URLs (every kind, not just HTML —
   * users want to see image 4xx, JS 5xx, etc.). Null status (network error)
   * is included as its own bucket so timeouts don't disappear.
   */
  getStatusCodeHistogram(): { status: number | null; count: number }[] {
    return this.db
      .prepare(
        `SELECT status_code AS status, COUNT(*) AS count
         FROM urls
         WHERE is_external = 0
         GROUP BY status_code
         ORDER BY status_code IS NULL, status_code`,
      )
      .all() as { status: number | null; count: number }[];
  }

  /**
   * Click-depth distribution for internal HTML pages — the canonical
   * "site architecture flatness" metric. Shallow sites bias toward depths
   * 0–2; sites with orphaned / deeply nested clusters show a long tail.
   */
  getDepthHistogram(): { depth: number; count: number }[] {
    return this.db
      .prepare(
        `SELECT depth, COUNT(*) AS count
         FROM urls
         WHERE is_external = 0 AND content_kind = 'html'
         GROUP BY depth
         ORDER BY depth`,
      )
      .all() as { depth: number; count: number }[];
  }

  /**
   * Response-time distribution across internal URLs. Six buckets matching
   * Web Vitals-adjacent thresholds (<100ms excellent → >10s timeout-zone)
   * plus a "No response" row for fetches that returned null status (DNS
   * fail, connection refused, AbortController timeout). Buckets are
   * always returned in order so the chart reads left-to-right.
   */
  getResponseTimeHistogram(): { label: string; count: number }[] {
    const out: { label: string; count: number }[] = [];
    const noResp = (
      this.db
        .prepare(
          'SELECT COUNT(*) AS c FROM urls WHERE is_external = 0 AND response_time_ms IS NULL',
        )
        .get() as { c: number }
    ).c;
    if (noResp > 0) out.push({ label: 'No response', count: noResp });

    const buckets: { label: string; min: number; max: number | null }[] = [
      { label: '< 100ms', min: 0, max: 100 },
      { label: '100–500ms', min: 100, max: 500 },
      { label: '500ms–1s', min: 500, max: 1000 },
      { label: '1–3s', min: 1000, max: 3000 },
      { label: '3–10s', min: 3000, max: 10000 },
      { label: '> 10s', min: 10000, max: null },
    ];
    for (const b of buckets) {
      const sql =
        b.max === null
          ? 'SELECT COUNT(*) AS c FROM urls WHERE is_external = 0 AND response_time_ms >= ?'
          : 'SELECT COUNT(*) AS c FROM urls WHERE is_external = 0 AND response_time_ms >= ? AND response_time_ms < ?';
      const params = b.max === null ? [b.min] : [b.min, b.max];
      const c = (this.db.prepare(sql).get(...params) as { c: number }).c;
      out.push({ label: b.label, count: c });
    }
    return out;
  }

  /**
   * Store all `<img>` occurrences for a given page. Each unique image src
   * lives once in the `images` table with an `occurrences` counter; the
   * `image_usages` table records which page used which image and the alt
   * text attached at that usage site (alt can differ per page).
   */
  insertImages(fromUrlId: number, images: DiscoveredImage[]): void {
    if (images.length === 0) return;
    const upsertImage = this.db.prepare(
      `INSERT INTO images (src, alt, width, height, is_internal, occurrences)
       VALUES (?, ?, ?, ?, ?, 1)
       ON CONFLICT(src) DO UPDATE SET
         occurrences = occurrences + 1,
         -- Fill in alt / dimensions from later occurrences only if the
         -- current stored row is missing them.
         alt = COALESCE(images.alt, excluded.alt),
         width = COALESCE(images.width, excluded.width),
         height = COALESCE(images.height, excluded.height)
       RETURNING id`,
    );
    const upsertUsage = this.db.prepare(
      `INSERT INTO image_usages (from_url_id, image_id, alt)
       VALUES (?, ?, ?)
       ON CONFLICT(from_url_id, image_id) DO UPDATE SET alt = excluded.alt`,
    );
    this.db.exec('BEGIN');
    try {
      for (const img of images) {
        const row = upsertImage.get(
          img.src,
          img.alt,
          img.width,
          img.height,
          img.isInternal ? 1 : 0,
        ) as { id: number };
        upsertUsage.run(fromUrlId, row.id, img.alt);
      }
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  /**
   * Return link rows whose destination is a 4xx/5xx URL. Joins the link
   * catalogue to the URL table twice — once for the source page's status,
   * once for the destination's. `internal` filter: 'all' | 'internal' | 'external'.
   */
  queryBrokenLinks(params: {
    limit: number;
    offset: number;
    internal?: 'all' | 'internal' | 'external';
    search?: string;
  }): { rows: BrokenLinkRow[]; total: number } {
    const where: string[] = ['t.status_code >= 400 AND t.status_code < 600'];
    const args: (string | number)[] = [];
    const internal = params.internal ?? 'all';
    if (internal === 'internal') where.push('l.is_internal = 1');
    else if (internal === 'external') where.push('l.is_internal = 0');
    if (params.search) {
      where.push('(f.url LIKE ? OR l.to_url LIKE ?)');
      const like = `%${params.search}%`;
      args.push(like, like);
    }
    const whereSql = `WHERE ${where.join(' AND ')}`;
    const totalRow = this.db
      .prepare(
        `SELECT COUNT(*) AS c
         FROM links l
         JOIN urls f ON l.from_url_id = f.id
         JOIN urls t ON l.to_url = t.url
         ${whereSql}`,
      )
      .get(...args) as { c: number };
    const rowsDb = this.db
      .prepare(
        `SELECT f.url AS from_url, f.status_code AS from_status,
                l.to_url AS to_url, t.status_code AS to_status,
                l.anchor, l.rel, l.is_internal
         FROM links l
         JOIN urls f ON l.from_url_id = f.id
         JOIN urls t ON l.to_url = t.url
         ${whereSql}
         ORDER BY t.status_code DESC, f.id, l.id
         LIMIT ? OFFSET ?`,
      )
      .all(...args, params.limit, params.offset) as unknown as {
      from_url: string;
      from_status: number | null;
      to_url: string;
      to_status: number | null;
      anchor: string | null;
      rel: string | null;
      is_internal: number;
    }[];
    return {
      total: totalRow.c,
      rows: rowsDb.map((r) => ({
        fromUrl: r.from_url,
        fromStatusCode: r.from_status,
        toUrl: r.to_url,
        toStatusCode: r.to_status,
        anchor: r.anchor,
        rel: r.rel,
        isInternal: r.is_internal === 1,
      })),
    };
  }

  queryImages(params: {
    limit: number;
    offset: number;
    search?: string;
    missingAltOnly?: boolean;
    internalOnly?: boolean;
  }): { rows: ImageRow[]; total: number } {
    const where: string[] = [];
    const args: (string | number)[] = [];
    if (params.internalOnly) {
      where.push('is_internal = 1');
    }
    if (params.missingAltOnly) {
      where.push('alt IS NULL');
    }
    if (params.search) {
      where.push('(src LIKE ? OR alt LIKE ?)');
      const like = `%${params.search}%`;
      args.push(like, like);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = (
      this.db.prepare(`SELECT COUNT(*) AS c FROM images ${whereSql}`).get(...args) as {
        c: number;
      }
    ).c;
    const rows = this.db
      .prepare(
        `SELECT * FROM images ${whereSql} ORDER BY occurrences DESC, id LIMIT ? OFFSET ?`,
      )
      .all(...args, params.limit, params.offset) as unknown as ImageRowDb[];
    return {
      total,
      rows: rows.map((r) => ({
        id: r.id,
        src: r.src,
        alt: r.alt,
        width: r.width,
        height: r.height,
        isInternal: r.is_internal === 1,
        occurrences: r.occurrences,
      })),
    };
  }

  queryUrls(params: {
    limit: number;
    offset: number;
    category?: UrlCategory;
    search?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    filter?: AdvancedFilter;
  }): { rows: CrawlUrlRow[]; total: number } {
    const { whereSql, args } = buildUrlsWhere({
      category: params.category ?? 'all',
      search: params.search,
      filter: params.filter,
    });
    const sortCol = validSortColumn(params.sortBy);
    const sortDir = params.sortDir === 'desc' ? 'DESC' : 'ASC';

    const totalRow = this.db
      .prepare(`SELECT COUNT(*) AS c FROM urls ${whereSql}`)
      .get(...args) as { c: number };

    // Tie-break on id so pagination is deterministic for equal sort values.
    const tieBreak = sortCol === 'id' ? '' : `, id ${sortDir}`;
    const rowsDb = this.db
      .prepare(
        `SELECT * FROM urls ${whereSql} ORDER BY ${sortCol} ${sortDir}${tieBreak} LIMIT ? OFFSET ?`,
      )
      .all(...args, params.limit, params.offset) as unknown as UrlRowDb[];

    return { rows: rowsDb.map(this.rowFromDb), total: totalRow.c };
  }

  getOverviewCounts(): OverviewCounts {
    const countWhere = (clause: string): number =>
      (
        this.db.prepare(`SELECT COUNT(*) AS c FROM urls WHERE ${clause}`).get() as { c: number }
      ).c;
    const groupByInternal = (col: string): Record<string, number> => {
      const out: Record<string, number> = {};
      for (const r of this.db
        .prepare(
          `SELECT ${col} AS k, COUNT(*) AS c FROM urls WHERE is_external = 0 GROUP BY ${col}`,
        )
        .all() as unknown as { k: string; c: number }[]) {
        out[r.k] = r.c;
      }
      return out;
    };

    const totalInternalUrls = countWhere('is_external = 0');
    const totalExternalUrls = countWhere('is_external = 1');
    const internalKinds = groupByInternal('content_kind');
    const totalIndexable = countWhere("is_external = 0 AND indexability = 'indexable' AND status_code IS NOT NULL");
    const totalNonIndexable = countWhere("is_external = 0 AND indexability LIKE 'non-indexable%'");

    return {
      summary: {
        totalInternalUrls,
        totalIndexable,
        totalNonIndexable,
        totalExternalUrls,
      },
      internal: {
        all: totalInternalUrls,
        html: internalKinds['html'] ?? 0,
        js: internalKinds['js'] ?? 0,
        css: internalKinds['css'] ?? 0,
        image: internalKinds['image'] ?? 0,
        pdf: internalKinds['pdf'] ?? 0,
        font: internalKinds['font'] ?? 0,
        other: internalKinds['other'] ?? 0,
      },
      external: {
        all: totalExternalUrls,
        html: countWhere("is_external = 1 AND content_kind = 'html'"),
        other: countWhere("is_external = 1 AND content_kind != 'html'"),
      },
      responseCodes: {
        all: totalInternalUrls,
        blockedRobots: countWhere(
          "is_external = 0 AND indexability = 'non-indexable:robots-blocked'",
        ),
        noResponse: countWhere('is_external = 0 AND status_code IS NULL'),
        success2xx: countWhere('is_external = 0 AND status_code >= 200 AND status_code < 300'),
        redirect3xx: countWhere('is_external = 0 AND status_code >= 300 AND status_code < 400'),
        clientError4xx: countWhere(
          'is_external = 0 AND status_code >= 400 AND status_code < 500',
        ),
        serverError5xx: countWhere(
          'is_external = 0 AND status_code >= 500 AND status_code < 600',
        ),
      },
      security: {
        https: countWhere("is_external = 0 AND url LIKE 'https://%'"),
        http: countWhere("is_external = 0 AND url LIKE 'http://%'"),
      },
      indexability: {
        indexable: totalIndexable,
        nonIndexable: totalNonIndexable,
        noindex: countWhere("is_external = 0 AND indexability = 'non-indexable:noindex'"),
        canonicalised: countWhere("is_external = 0 AND indexability = 'non-indexable:canonical'"),
        blockedRobots: countWhere(
          "is_external = 0 AND indexability = 'non-indexable:robots-blocked'",
        ),
      },
      issues: this.getIssuesCounts(),
    };
  }

  private getIssuesCounts(): OverviewCounts['issues'] {
    const countWhere = (clause: string): number =>
      (
        this.db.prepare(`SELECT COUNT(*) AS c FROM urls WHERE ${clause}`).get() as { c: number }
      ).c;
    // Common prefix for all issue checks — only crawled internal HTML pages
    // are eligible (is_external = 0, content_kind = 'html').
    const html = "is_external = 0 AND content_kind = 'html'";
    const dup = (col: string): number =>
      (
        this.db
          .prepare(
            `SELECT COALESCE(SUM(c), 0) AS total FROM (
               SELECT COUNT(*) AS c FROM urls
               WHERE ${html} AND ${col} IS NOT NULL AND ${col} != ''
               GROUP BY ${col} HAVING c > 1
             )`,
          )
          .get() as { total: number }
      ).total;
    return {
      titleMissing: countWhere(`${html} AND (title IS NULL OR title = '')`),
      titleTooLong: countWhere(`${html} AND title_length > 60`),
      titleTooShort: countWhere(`${html} AND title_length > 0 AND title_length < 30`),
      titleDuplicate: dup('title'),
      metaMissing: countWhere(
        `${html} AND (meta_description IS NULL OR meta_description = '')`,
      ),
      metaTooLong: countWhere(`${html} AND meta_description_length > 160`),
      metaTooShort: countWhere(
        `${html} AND meta_description_length > 0 AND meta_description_length < 120`,
      ),
      metaDuplicate: dup('meta_description'),
      h1Missing: countWhere(`${html} AND (h1 IS NULL OR h1 = '')`),
      h1Duplicate: dup('h1'),
      h1Multiple: countWhere(`${html} AND h1_count > 1`),
      headingSkippedLevel: countWhere(
        `${html} AND (
           (h2_count = 0 AND h3_count > 0)
           OR (h3_count = 0 AND h4_count > 0)
           OR (h4_count = 0 AND h5_count > 0)
           OR (h5_count = 0 AND h6_count > 0)
         )`,
      ),
      multipleCanonicals: countWhere(`${html} AND canonical_count > 1`),
      canonicalMissing: countWhere(
        `${html} AND status_code >= 200 AND status_code < 300
         AND (canonical IS NULL OR canonical = '')
         AND (canonical_http IS NULL OR canonical_http = '')`,
      ),
      canonicalSelfReferencing: countWhere(
        `${html} AND canonical IS NOT NULL AND canonical = url`,
      ),
      canonicalNonSelf: countWhere(
        `${html} AND canonical IS NOT NULL AND canonical != ''
         AND canonical != url`,
      ),
      canonicalMismatch: countWhere(
        `${html}
         AND canonical IS NOT NULL AND canonical != ''
         AND canonical_http IS NOT NULL AND canonical_http != ''
         AND canonical != canonical_http`,
      ),
      canonicalToNon200: countWhere(
        `${html} AND canonical IS NOT NULL AND canonical != ''
         AND EXISTS (
           SELECT 1 FROM urls t WHERE t.url = urls.canonical
             AND t.status_code IS NOT NULL
             AND (t.status_code < 200 OR t.status_code >= 400)
         )`,
      ),
      canonicalToRedirect: countWhere(
        `${html} AND canonical IS NOT NULL AND canonical != ''
         AND EXISTS (
           SELECT 1 FROM urls t WHERE t.url = urls.canonical
             AND t.status_code >= 300 AND t.status_code < 400
         )`,
      ),
      canonicalToNoindex: countWhere(
        `${html} AND canonical IS NOT NULL AND canonical != ''
         AND EXISTS (
           SELECT 1 FROM urls t WHERE t.url = urls.canonical
             AND t.indexability = 'non-indexable:noindex'
         )`,
      ),
      contentThin: countWhere(`${html} AND word_count IS NOT NULL AND word_count < 300`),
      responseSlow: countWhere('is_external = 0 AND response_time_ms > 1000'),
      responseVerySlow: countWhere('is_external = 0 AND response_time_ms > 3000'),
      pageLarge: countWhere(`${html} AND content_length > 1048576`),
      urlTooLong: countWhere('is_external = 0 AND LENGTH(url) > 2048'),
      urlUppercase: countWhere("is_external = 0 AND url GLOB '*[A-Z]*'"),
      urlUnderscore: countWhere("is_external = 0 AND INSTR(url, '_') > 0"),
      urlMultipleSlashes: countWhere(
        "is_external = 0 AND INSTR(SUBSTR(url, INSTR(url, '://') + 3), '//') > 0",
      ),
      urlNonAscii: countWhere('is_external = 0 AND LENGTH(CAST(url AS BLOB)) != LENGTH(url)'),
      langMissing: countWhere(`${html} AND (lang IS NULL OR lang = '')`),
      viewportMissing: countWhere(`${html} AND (viewport IS NULL OR viewport = '')`),
      ogMissing: countWhere(
        `${html}
         AND (og_title IS NULL OR og_title = '')
         AND (og_description IS NULL OR og_description = '')
         AND (og_image IS NULL OR og_image = '')`,
      ),
      twitterMissing: countWhere(
        `${html}
         AND (twitter_card IS NULL OR twitter_card = '')
         AND (twitter_image IS NULL OR twitter_image = '')`,
      ),
      hstsMissing: countWhere(
        "is_external = 0 AND url LIKE 'https://%' AND (hsts IS NULL OR hsts = '')",
      ),
      xFrameOptionsMissing: countWhere(
        `${html} AND (x_frame_options IS NULL OR x_frame_options = '')`,
      ),
      xContentTypeOptionsMissing: countWhere(
        `${html} AND (x_content_type_options IS NULL OR x_content_type_options = '')`,
      ),
      cspMissing: countWhere(`${html} AND (csp IS NULL OR csp = '')`),
      structuredDataMissing: countWhere(
        `${html} AND schema_block_count = 0 AND schema_invalid_count = 0`,
      ),
      structuredDataInvalid: countWhere(`${html} AND schema_invalid_count > 0`),
      paginationBroken: countWhere(
        `${html}
         AND (
           (pagination_next IS NOT NULL AND EXISTS (
             SELECT 1 FROM urls t WHERE t.url = urls.pagination_next
               AND t.status_code >= 400 AND t.status_code < 600))
           OR (pagination_prev IS NOT NULL AND EXISTS (
             SELECT 1 FROM urls t WHERE t.url = urls.pagination_prev
               AND t.status_code >= 400 AND t.status_code < 600))
         )`,
      ),
      hreflangXDefaultMissing: countWhere(
        `${html} AND hreflang_count > 0
         AND (hreflangs IS NULL OR INSTR(hreflangs, '"x-default"') = 0)`,
      ),
      mixedContent: countWhere(
        `${html} AND url LIKE 'https://%' AND mixed_content_count > 0`,
      ),
      faviconMissing: countWhere(`${html} AND (favicon IS NULL OR favicon = '')`),
      redirectLoop: countWhere('is_external = 0 AND redirect_loop = 1'),
      redirectChainLong: countWhere('is_external = 0 AND redirect_chain_length > 3'),
      redirectSelf: countWhere(
        'is_external = 0 AND redirect_target IS NOT NULL AND redirect_target = url',
      ),
      urlManyParams: countWhere('is_external = 0 AND query_param_count > 5'),
      compressionMissing: countWhere(
        `${html} AND status_code >= 200 AND status_code < 300
         AND (content_encoding IS NULL OR content_encoding = '')`,
      ),
      nonIndexableInSitemap: countWhere(
        `is_external = 0 AND indexability LIKE 'non-indexable%'
         AND EXISTS (SELECT 1 FROM sitemap_urls s WHERE s.url = urls.url)`,
      ),
      non200InSitemap: countWhere(
        `is_external = 0
         AND status_code IS NOT NULL
         AND (status_code < 200 OR status_code >= 300)
         AND EXISTS (SELECT 1 FROM sitemap_urls s WHERE s.url = urls.url)`,
      ),
      imageMissingAlt: (
        this.db.prepare('SELECT COUNT(*) AS c FROM images WHERE alt IS NULL').get() as {
          c: number;
        }
      ).c,
      metaRefreshUsed: countWhere(
        `${html} AND meta_refresh IS NOT NULL AND meta_refresh != ''`,
      ),
      charsetMissing: countWhere(
        `${html} AND status_code >= 200 AND status_code < 300
         AND (charset IS NULL OR charset = '')`,
      ),
      brokenLinksInternal: this.countBrokenLinks('internal'),
      brokenLinksExternal: this.countBrokenLinks('external'),
      nearDuplicate: countWhere(`${html} AND cluster_id > 0 AND cluster_size > 1`),
      duplicateContentExact: dup('content_hash'),
      hreflangInvalidCode: countWhere(`${html} AND hreflang_invalid_count > 0`),
      hreflangSelfRefMissing: countWhere(
        `${html} AND hreflang_count > 0 AND hreflang_self_ref_missing = 1`,
      ),
      hreflangReciprocityMissing: countWhere(
        `${html} AND hreflang_reciprocity_missing > 0`,
      ),
      hreflangTargetIssues: countWhere(`${html} AND hreflang_target_issues > 0`),
      crawledNotInSitemap: countWhere(
        `${html} AND status_code >= 200 AND status_code < 300
         AND indexability = 'indexable'
         AND NOT EXISTS (SELECT 1 FROM sitemap_urls s WHERE s.url = urls.url)`,
      ),
      redirectInSitemap: countWhere(
        `is_external = 0 AND status_code >= 300 AND status_code < 400
         AND EXISTS (SELECT 1 FROM sitemap_urls s WHERE s.url = urls.url)`,
      ),
      sitemapNotCrawled: (
        this.db
          .prepare(
            `SELECT COUNT(*) AS c FROM sitemap_urls s
              WHERE NOT EXISTS (SELECT 1 FROM urls u WHERE u.url = s.url)`,
          )
          .get() as { c: number }
      ).c,
    };
  }

  private countBrokenLinks(kind: 'internal' | 'external' | 'all'): number {
    const scope =
      kind === 'internal'
        ? 'AND l.is_internal = 1'
        : kind === 'external'
          ? 'AND l.is_internal = 0'
          : '';
    return (
      this.db
        .prepare(
          `SELECT COUNT(*) AS c FROM links l
             JOIN urls t ON l.to_url = t.url
             WHERE t.status_code >= 400 AND t.status_code < 600 ${scope}`,
        )
        .get() as { c: number }
    ).c;
  }

  getSummary(): CrawlSummary {
    const total = this.countUrls();
    const byStatus: Record<string, number> = {};
    const byContentKind: Record<string, number> = {};
    const byIndexability: Record<string, number> = {};

    for (const row of this.db
      .prepare(
        `SELECT COALESCE(CAST(status_code AS TEXT), 'unknown') AS status, COUNT(*) AS c FROM urls GROUP BY status`,
      )
      .all() as unknown as { status: string; c: number }[]) {
      byStatus[row.status] = row.c;
    }

    for (const row of this.db
      .prepare('SELECT content_kind, COUNT(*) AS c FROM urls GROUP BY content_kind')
      .all() as unknown as { content_kind: ContentKind; c: number }[]) {
      byContentKind[row.content_kind] = row.c;
    }

    for (const row of this.db
      .prepare('SELECT indexability, COUNT(*) AS c FROM urls GROUP BY indexability')
      .all() as unknown as { indexability: string; c: number }[]) {
      byIndexability[row.indexability] = row.c;
    }

    const avg = this.db
      .prepare('SELECT AVG(response_time_ms) AS avg FROM urls WHERE response_time_ms IS NOT NULL')
      .get() as { avg: number | null };
    const bytes = this.db
      .prepare('SELECT COALESCE(SUM(content_length), 0) AS total FROM urls')
      .get() as { total: number };

    return {
      total,
      byStatus,
      byContentKind: byContentKind as CrawlSummary['byContentKind'],
      byIndexability,
      avgResponseTimeMs: Math.round(avg.avg ?? 0),
      totalBytes: bytes.total,
    };
  }

  getUrlById(id: number): CrawlUrlRow | null {
    const row = this.db.prepare('SELECT * FROM urls WHERE id = ?').get(id) as
      | UrlRowDb
      | undefined;
    return row ? this.rowFromDb(row) : null;
  }

  getInlinks(url: string, limit: number): { rows: InlinkRow[]; total: number } {
    const total = (
      this.db.prepare('SELECT COUNT(*) AS c FROM links WHERE to_url = ?').get(url) as { c: number }
    ).c;
    const rows = this.db
      .prepare(
        `SELECT
           f.url AS from_url,
           f.status_code AS from_status_code,
           t.status_code AS to_status_code,
           t.content_length AS to_size,
           l.type, l.anchor, l.alt_text, l.rel, l.target,
           l.path_type, l.link_path, l.link_position, l.link_origin
         FROM links l
         JOIN urls f ON l.from_url_id = f.id
         LEFT JOIN urls t ON l.to_url = t.url
         WHERE l.to_url = ?
         LIMIT ?`,
      )
      .all(url, limit) as unknown as {
      from_url: string;
      from_status_code: number | null;
      to_status_code: number | null;
      to_size: number | null;
      type: string | null;
      anchor: string | null;
      alt_text: string | null;
      rel: string | null;
      target: string | null;
      path_type: string | null;
      link_path: string | null;
      link_position: string | null;
      link_origin: string | null;
    }[];
    return {
      total,
      rows: rows.map((r) => ({
        fromUrl: r.from_url,
        fromStatusCode: r.from_status_code,
        toStatusCode: r.to_status_code,
        toSize: r.to_size,
        type: (r.type as InlinkRow['type']) ?? 'hyperlink',
        anchor: r.anchor,
        altText: r.alt_text,
        rel: r.rel,
        target: r.target,
        pathType: (r.path_type as InlinkRow['pathType']) ?? null,
        linkPath: r.link_path,
        linkPosition: (r.link_position as InlinkRow['linkPosition']) ?? null,
        linkOrigin: (r.link_origin as InlinkRow['linkOrigin']) ?? 'html',
      })),
    };
  }

  getOutlinks(urlId: number, limit: number): { rows: OutlinkRow[]; total: number } {
    const total = (
      this.db
        .prepare('SELECT COUNT(*) AS c FROM links WHERE from_url_id = ?')
        .get(urlId) as { c: number }
    ).c;
    const rows = this.db
      .prepare(
        `SELECT
           l.to_url,
           t.status_code AS to_status_code,
           t.content_length AS to_size,
           l.type, l.anchor, l.alt_text, l.rel, l.target,
           l.path_type, l.link_path, l.link_position, l.link_origin,
           l.is_internal
         FROM links l
         LEFT JOIN urls t ON l.to_url = t.url
         WHERE l.from_url_id = ?
         LIMIT ?`,
      )
      .all(urlId, limit) as unknown as {
      to_url: string;
      to_status_code: number | null;
      to_size: number | null;
      type: string | null;
      anchor: string | null;
      alt_text: string | null;
      rel: string | null;
      target: string | null;
      path_type: string | null;
      link_path: string | null;
      link_position: string | null;
      link_origin: string | null;
      is_internal: number;
    }[];
    return {
      total,
      rows: rows.map((r) => ({
        toUrl: r.to_url,
        toStatusCode: r.to_status_code,
        toSize: r.to_size,
        type: (r.type as OutlinkRow['type']) ?? 'hyperlink',
        anchor: r.anchor,
        altText: r.alt_text,
        rel: r.rel,
        target: r.target,
        pathType: (r.path_type as OutlinkRow['pathType']) ?? null,
        linkPath: r.link_path,
        linkPosition: (r.link_position as OutlinkRow['linkPosition']) ?? null,
        linkOrigin: (r.link_origin as OutlinkRow['linkOrigin']) ?? 'html',
        isInternal: r.is_internal === 1,
      })),
    };
  }

  getUrlDetail(id: number, linkLimit = 500): UrlDetail | null {
    const row = this.getUrlById(id);
    if (!row) return null;
    const inl = this.getInlinks(row.url, linkLimit);
    const outl = this.getOutlinks(id, linkLimit);
    const headers = this.getUrlHeaders(id);
    return {
      row,
      inlinks: inl.rows,
      inlinksTotal: inl.total,
      outlinks: outl.rows,
      outlinksTotal: outl.total,
      headers,
    };
  }

  /**
   * Replace any previously-stored response headers for this URL with the
   * given set. Old rows are deleted first so a re-crawl doesn't accumulate
   * stale entries when servers change their header set.
   *
   * Header names are stored lowercased (HTTP header names are
   * case-insensitive), values are kept as the server sent them. Values
   * over 4 KB are truncated with a marker so the row size stays bounded
   * on adversarial servers.
   */
  setUrlHeaders(urlId: number, entries: Iterable<readonly [string, string]>): void {
    const list: { name: string; value: string }[] = [];
    const seen = new Set<string>();
    for (const [rawName, rawValue] of entries) {
      const name = rawName.trim().toLowerCase();
      if (!name) continue;
      if (seen.has(name)) continue;
      seen.add(name);
      let value = rawValue ?? '';
      if (value.length > 4096) value = value.slice(0, 4093) + '...';
      list.push({ name, value });
    }
    this.db.exec('BEGIN');
    try {
      this.db.prepare('DELETE FROM headers WHERE url_id = ?').run(urlId);
      if (list.length > 0) {
        const placeholders = list.map(() => '(?, ?, ?)').join(',');
        const args: (number | string)[] = [];
        for (const h of list) args.push(urlId, h.name, h.value);
        this.db
          .prepare(`INSERT INTO headers (url_id, name, value) VALUES ${placeholders}`)
          .run(...args);
      }
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  getUrlHeaders(urlId: number): { name: string; value: string }[] {
    return this.db
      .prepare('SELECT name, value FROM headers WHERE url_id = ? ORDER BY name')
      .all(urlId) as { name: string; value: string }[];
  }

  *iterateAllUrls(): IterableIterator<CrawlUrlRow> {
    const rows = this.db.prepare('SELECT * FROM urls ORDER BY id').all() as unknown as UrlRowDb[];
    for (const row of rows) {
      yield this.rowFromDb(row);
    }
  }

  *iterateUrlsByIds(ids: number[]): IterableIterator<CrawlUrlRow> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.db
      .prepare(`SELECT * FROM urls WHERE id IN (${placeholders}) ORDER BY id`)
      .all(...ids) as unknown as UrlRowDb[];
    for (const row of rows) {
      yield this.rowFromDb(row);
    }
  }

  /**
   * Yields crawled, indexable, internal HTML URLs in depth-then-id order
   * — the set that belongs in an XML sitemap. Excludes redirects,
   * noindex, canonicalised, blocked, 4xx/5xx, and non-HTML resources.
   */
  *iterateIndexableUrls(): IterableIterator<CrawlUrlRow> {
    const rows = this.db
      .prepare(
        `SELECT * FROM urls
         WHERE is_external = 0
           AND content_kind = 'html'
           AND indexability = 'indexable'
           AND status_code >= 200 AND status_code < 300
         ORDER BY depth, id`,
      )
      .all() as unknown as UrlRowDb[];
    for (const row of rows) {
      yield this.rowFromDb(row);
    }
  }

  /**
   * Compact graph snapshot for the Visualization tab.
   *
   * Returns up to `nodeLimit` internal HTML nodes (top by inlinks) plus
   * every edge between them. Edges to URLs outside the cap are dropped
   * — Cytoscape would crash on dangling edges, and the user only cares
   * about the most-linked subset for sense-making anyway.
   *
   * Cost: two indexed SELECTs + a JOIN. ~200 ms at 100K URLs / 5K cap.
   */
  graphSnapshot(nodeLimit = 1000): {
    nodes: { id: number; url: string; statusCode: number | null; depth: number; inlinks: number; indexability: Indexability }[];
    edges: { source: number; target: number }[];
  } {
    const nodes = this.db
      .prepare(
        `SELECT id, url, status_code, depth, inlinks, indexability
           FROM urls
          WHERE is_external = 0 AND content_kind = 'html'
          ORDER BY inlinks DESC, id ASC
          LIMIT ?`,
      )
      .all(nodeLimit) as {
      id: number;
      url: string;
      status_code: number | null;
      depth: number;
      inlinks: number;
      indexability: Indexability;
    }[];

    if (nodes.length === 0) return { nodes: [], edges: [] };

    const idByUrl = new Map<string, number>();
    for (const n of nodes) idByUrl.set(n.url, n.id);

    // Pull every edge whose `from_url_id` is in our node set, then
    // filter targets that didn't make the cap (drop instead of fan
    // out to ghost nodes).
    const fromIds = nodes.map((n) => n.id);
    const placeholders = fromIds.map(() => '?').join(',');
    const edgeRows = this.db
      .prepare(
        `SELECT from_url_id AS source, to_url FROM links
          WHERE is_internal = 1 AND from_url_id IN (${placeholders})`,
      )
      .all(...fromIds) as { source: number; to_url: string }[];

    const edges: { source: number; target: number }[] = [];
    for (const e of edgeRows) {
      const target = idByUrl.get(e.to_url);
      if (target !== undefined && target !== e.source) {
        edges.push({ source: e.source, target });
      }
    }

    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        url: n.url,
        statusCode: n.status_code,
        depth: n.depth,
        inlinks: n.inlinks,
        indexability: n.indexability,
      })),
      edges,
    };
  }

  /**
   * Top anchor texts across all internal links, ranked by frequency.
   * Used by the Visualization tab's anchor-text word cloud.
   */
  topAnchorTexts(limit = 200): { anchor: string; count: number }[] {
    return this.db
      .prepare(
        `SELECT anchor, COUNT(*) AS count FROM links
          WHERE is_internal = 1 AND anchor IS NOT NULL AND anchor != ''
          GROUP BY anchor
          ORDER BY count DESC, anchor ASC
          LIMIT ?`,
      )
      .all(limit) as { anchor: string; count: number }[];
  }

  /**
   * Lightweight `(url, value)` pair lookup used by the HTML report's
   * top-N tables. `column` is restricted to numeric URL columns (the
   * UI never wires this from user input). Direction is fixed DESC since
   * every callsite wants "top by metric".
   */
  topUrlsBy(
    column: 'response_time_ms' | 'depth' | 'outlinks' | 'inlinks' | 'content_length',
    limit: number,
  ): { url: string; value: number | null }[] {
    return this.db
      .prepare(
        `SELECT url, ${column} AS value FROM urls
          WHERE is_external = 0 AND content_kind = 'html'
            AND ${column} IS NOT NULL
          ORDER BY ${column} DESC
          LIMIT ?`,
      )
      .all(limit) as { url: string; value: number | null }[];
  }

  /**
   * Internal-image entries linked to a single page URL. Used by the
   * image sitemap variant — Google's `image:image` extension allows up
   * to 1000 entries per `<url>` entry.
   */
  imagesForUrl(urlId: number, limit = 1000): { src: string; alt: string | null }[] {
    return this.db
      .prepare(
        `SELECT i.src, COALESCE(iu.alt, i.alt) AS alt
           FROM image_usages iu
           JOIN images i ON i.id = iu.image_id
          WHERE iu.from_url_id = ? AND i.is_internal = 1
          ORDER BY i.id
          LIMIT ?`,
      )
      .all(urlId, limit) as { src: string; alt: string | null }[];
  }

  /**
   * Sitemap index iteration — same set as `iterateIndexableUrls` but
   * additionally surfaces the `hreflangs` JSON so the hreflang sitemap
   * variant can emit `<xhtml:link>` siblings. Identical filter / sort.
   */
  *iterateIndexableUrlsWithHreflang(): IterableIterator<CrawlUrlRow> {
    yield* this.iterateIndexableUrls();
  }

  private rowFromDb = (r: UrlRowDb): CrawlUrlRow => ({
    id: r.id,
    url: r.url,
    contentKind: r.content_kind,
    statusCode: r.status_code,
    statusText: r.status_text,
    indexability: r.indexability,
    indexabilityReason: r.indexability_reason,
    title: r.title,
    titleLength: r.title_length,
    metaDescription: r.meta_description,
    metaDescriptionLength: r.meta_description_length,
    h1: r.h1,
    h1Length: r.h1_length,
    h1Count: r.h1_count,
    h2Count: r.h2_count,
    h3Count: r.h3_count,
    h4Count: r.h4_count,
    h5Count: r.h5_count,
    h6Count: r.h6_count,
    wordCount: r.word_count,
    canonical: r.canonical,
    canonicalCount: r.canonical_count,
    canonicalHttp: r.canonical_http,
    metaRobots: r.meta_robots,
    xRobotsTag: r.x_robots_tag,
    contentType: r.content_type,
    contentLength: r.content_length,
    responseTimeMs: r.response_time_ms,
    depth: r.depth,
    inlinks: r.inlinks,
    outlinks: r.outlinks,
    imagesCount: r.images_count,
    imagesMissingAlt: r.images_missing_alt,
    redirectTarget: r.redirect_target,
    lang: r.lang,
    viewport: r.viewport,
    ogTitle: r.og_title,
    ogDescription: r.og_description,
    ogImage: r.og_image,
    twitterCard: r.twitter_card,
    twitterTitle: r.twitter_title,
    twitterDescription: r.twitter_description,
    twitterImage: r.twitter_image,
    metaKeywords: r.meta_keywords,
    metaAuthor: r.meta_author,
    metaGenerator: r.meta_generator,
    themeColor: r.theme_color,
    hsts: r.hsts,
    xFrameOptions: r.x_frame_options,
    xContentTypeOptions: r.x_content_type_options,
    contentEncoding: r.content_encoding,
    schemaTypes: r.schema_types,
    schemaBlockCount: r.schema_block_count,
    schemaInvalidCount: r.schema_invalid_count,
    paginationNext: r.pagination_next,
    paginationPrev: r.pagination_prev,
    hreflangs: r.hreflangs,
    hreflangCount: r.hreflang_count,
    amphtml: r.amphtml,
    favicon: r.favicon,
    mixedContentCount: r.mixed_content_count,
    hreflangInvalidCount: r.hreflang_invalid_count,
    hreflangSelfRefMissing: r.hreflang_self_ref_missing === 1,
    hreflangReciprocityMissing: r.hreflang_reciprocity_missing,
    hreflangTargetIssues: r.hreflang_target_issues,
    redirectChainLength: r.redirect_chain_length,
    redirectFinalUrl: r.redirect_final_url,
    redirectLoop: r.redirect_loop === 1,
    folderDepth: r.folder_depth,
    queryParamCount: r.query_param_count,
    csp: r.csp,
    referrerPolicy: r.referrer_policy,
    permissionsPolicy: r.permissions_policy,
    customSearchHits: r.custom_search_hits,
    metaRefresh: r.meta_refresh,
    metaRefreshUrl: r.meta_refresh_url,
    charset: r.charset,
    extractionResults: r.extraction_results,
    simhash: r.simhash,
    contentHash: r.content_hash,
    clusterId: r.cluster_id,
    clusterSize: r.cluster_size,
    crawledAt: r.crawled_at,
  });

  private toSnake(s: string): string {
    return s.replace(/([A-Z])/g, '_$1').toLowerCase();
  }
}

const VALID_SORT_COLUMNS = new Set([
  'id',
  'url',
  'status_code',
  'title_length',
  'meta_description_length',
  'word_count',
  'response_time_ms',
  'depth',
  'inlinks',
  'outlinks',
  'crawled_at',
  'indexability',
  'content_kind',
  'images_count',
  'images_missing_alt',
  'h1_count',
  'h1_length',
]);

function toSnakeCase(s: string): string {
  return s.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function validSortColumn(sortBy: string | undefined): string {
  if (!sortBy) return 'id';
  const snake = toSnakeCase(sortBy);
  return VALID_SORT_COLUMNS.has(snake) ? snake : 'id';
}

function buildUrlsWhere(params: {
  category?: UrlCategory;
  search?: string;
  filter?: AdvancedFilter;
}): { whereSql: string; args: (string | number)[] } {
  const where: string[] = [];
  const args: (string | number)[] = [];

  const cat = params.category ?? 'all';
  if (cat !== 'all') {
    const clause = categoryWhereClause(cat);
    if (clause) where.push(clause);
  }

  if (params.search) {
    where.push('(url LIKE ? OR title LIKE ?)');
    const like = `%${params.search}%`;
    args.push(like, like);
  }

  if (params.filter) {
    const adv = buildAdvancedFilterSql(params.filter, args);
    if (adv) where.push(adv);
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    args,
  };
}

const ALLOWED_FILTER_FIELDS: ReadonlySet<FilterField> = new Set<FilterField>([
  'url',
  'content_kind',
  'status_code',
  'indexability',
  'title',
  'title_length',
  'meta_description',
  'meta_description_length',
  'h1',
  'h1_length',
  'h1_count',
  'h2_count',
  'word_count',
  'content_type',
  'content_length',
  'response_time_ms',
  'depth',
  'inlinks',
  'outlinks',
  'canonical',
  'meta_robots',
  'x_robots_tag',
  'redirect_target',
  'images_count',
  'images_missing_alt',
]);

function buildAdvancedFilterSql(
  filter: AdvancedFilter,
  args: (string | number)[],
): string | null {
  const groupSqls: string[] = [];
  for (const group of filter.groups) {
    const clauseSqls: string[] = [];
    for (const clause of group.clauses) {
      const sql = buildClauseSql(clause, args);
      if (sql) clauseSqls.push(sql);
    }
    if (clauseSqls.length > 0) {
      groupSqls.push(`(${clauseSqls.join(' AND ')})`);
    }
  }
  if (groupSqls.length === 0) return null;
  return `(${groupSqls.join(' OR ')})`;
}

function buildClauseSql(c: FilterClause, args: (string | number)[]): string | null {
  // Whitelist-check the column name — it's interpolated into the SQL
  // string, so allowing arbitrary values would be an injection vector.
  if (!ALLOWED_FILTER_FIELDS.has(c.field)) return null;
  const col = c.field;
  switch (c.operator) {
    case 'contains':
      args.push(`%${c.value}%`);
      return `${col} LIKE ?`;
    case 'not_contains':
      args.push(`%${c.value}%`);
      return `(${col} NOT LIKE ? OR ${col} IS NULL)`;
    case 'equals':
      args.push(c.value);
      return `${col} = ?`;
    case 'not_equals':
      args.push(c.value);
      return `(${col} != ? OR ${col} IS NULL)`;
    case 'starts_with':
      args.push(`${c.value}%`);
      return `${col} LIKE ?`;
    case 'ends_with':
      args.push(`%${c.value}`);
      return `${col} LIKE ?`;
    case 'is_empty':
      return `(${col} IS NULL OR ${col} = '')`;
    case 'is_not_empty':
      return `(${col} IS NOT NULL AND ${col} != '')`;
    case 'gt':
    case 'lt':
    case 'gte':
    case 'lte': {
      const n = Number(c.value);
      if (!Number.isFinite(n)) return null;
      args.push(n);
      const op =
        c.operator === 'gt' ? '>' : c.operator === 'lt' ? '<' : c.operator === 'gte' ? '>=' : '<=';
      return `${col} ${op} ?`;
    }
  }
}

function categoryWhereClause(cat: UrlCategory): string | null {
  switch (cat) {
    case 'all':
      return null;
    case 'internal:all':
      return 'is_external = 0';
    case 'internal:html':
      return "is_external = 0 AND content_kind = 'html'";
    case 'internal:js':
      return "is_external = 0 AND content_kind = 'js'";
    case 'internal:css':
      return "is_external = 0 AND content_kind = 'css'";
    case 'internal:image':
      return "is_external = 0 AND content_kind = 'image'";
    case 'internal:pdf':
      return "is_external = 0 AND content_kind = 'pdf'";
    case 'internal:font':
      return "is_external = 0 AND content_kind = 'font'";
    case 'internal:other':
      return "is_external = 0 AND content_kind = 'other'";
    case 'external:all':
      return 'is_external = 1';
    case 'external:html':
      return "is_external = 1 AND content_kind = 'html'";
    case 'external:other':
      return "is_external = 1 AND content_kind != 'html'";
    case 'status:blocked-robots':
      return "indexability = 'non-indexable:robots-blocked'";
    case 'status:no-response':
      return 'status_code IS NULL';
    case 'status:2xx':
      return 'status_code >= 200 AND status_code < 300';
    case 'status:3xx':
      return 'status_code >= 300 AND status_code < 400';
    case 'status:4xx':
      return 'status_code >= 400 AND status_code < 500';
    case 'status:5xx':
      return 'status_code >= 500 AND status_code < 600';
    case 'security:https':
      return "url LIKE 'https://%'";
    case 'security:http':
      return "url LIKE 'http://%'";
    case 'indexability:indexable':
      return "indexability = 'indexable'";
    case 'indexability:non-indexable':
      return "indexability LIKE 'non-indexable%'";
    case 'indexability:noindex':
      return "indexability = 'non-indexable:noindex'";
    case 'indexability:canonicalised':
      return "indexability = 'non-indexable:canonical'";
    case 'indexability:blocked-robots':
      return "indexability = 'non-indexable:robots-blocked'";
    case 'issues:title-missing':
      return "is_external = 0 AND content_kind = 'html' AND (title IS NULL OR title = '')";
    case 'issues:title-too-long':
      return "is_external = 0 AND content_kind = 'html' AND title_length > 60";
    case 'issues:title-too-short':
      return "is_external = 0 AND content_kind = 'html' AND title_length > 0 AND title_length < 30";
    case 'issues:title-duplicate':
      return `is_external = 0 AND content_kind = 'html' AND title IS NOT NULL AND title != ''
              AND title IN (
                SELECT title FROM urls
                WHERE is_external = 0 AND content_kind = 'html'
                  AND title IS NOT NULL AND title != ''
                GROUP BY title HAVING COUNT(*) > 1
              )`;
    case 'issues:meta-missing':
      return "is_external = 0 AND content_kind = 'html' AND (meta_description IS NULL OR meta_description = '')";
    case 'issues:meta-too-long':
      return "is_external = 0 AND content_kind = 'html' AND meta_description_length > 160";
    case 'issues:meta-too-short':
      return "is_external = 0 AND content_kind = 'html' AND meta_description_length > 0 AND meta_description_length < 120";
    case 'issues:meta-duplicate':
      return `is_external = 0 AND content_kind = 'html' AND meta_description IS NOT NULL AND meta_description != ''
              AND meta_description IN (
                SELECT meta_description FROM urls
                WHERE is_external = 0 AND content_kind = 'html'
                  AND meta_description IS NOT NULL AND meta_description != ''
                GROUP BY meta_description HAVING COUNT(*) > 1
              )`;
    case 'issues:h1-missing':
      return "is_external = 0 AND content_kind = 'html' AND (h1 IS NULL OR h1 = '')";
    case 'issues:h1-duplicate':
      return `is_external = 0 AND content_kind = 'html' AND h1 IS NOT NULL AND h1 != ''
              AND h1 IN (
                SELECT h1 FROM urls
                WHERE is_external = 0 AND content_kind = 'html'
                  AND h1 IS NOT NULL AND h1 != ''
                GROUP BY h1 HAVING COUNT(*) > 1
              )`;
    case 'issues:h1-multiple':
      return "is_external = 0 AND content_kind = 'html' AND h1_count > 1";
    case 'issues:heading-skipped-level':
      // A "skipped" heading level is when level N+ exists but level N
      // is missing — the page jumps over a tier (e.g. H1 → H3 with no
      // H2). Each rung is checked independently.
      return `is_external = 0 AND content_kind = 'html' AND (
                (h2_count = 0 AND h3_count > 0)
                OR (h3_count = 0 AND h4_count > 0)
                OR (h4_count = 0 AND h5_count > 0)
                OR (h5_count = 0 AND h6_count > 0)
              )`;
    case 'issues:multiple-canonicals':
      // More than one `<link rel="canonical">` on a page is a confusion
      // signal — Google may pick any of them, defeating the canonical's
      // purpose.
      return "is_external = 0 AND content_kind = 'html' AND canonical_count > 1";
    case 'issues:canonical-missing':
      // HTML 2xx pages that declare neither a `<link rel="canonical">`
      // nor a `Link: rel="canonical"` HTTP header. Without a canonical
      // hint, search engines pick one themselves — possibly the wrong
      // variant on duplicate-prone sites.
      return `is_external = 0 AND content_kind = 'html'
              AND status_code >= 200 AND status_code < 300
              AND (canonical IS NULL OR canonical = '')
              AND (canonical_http IS NULL OR canonical_http = '')`;
    case 'issues:canonical-self-referencing':
      // Informational filter: this page's canonical points back to
      // itself — the typical "good" state for a primary URL.
      return `is_external = 0 AND content_kind = 'html'
              AND canonical IS NOT NULL AND canonical = url`;
    case 'issues:canonical-non-self':
      // Page canonical points to a different URL — this page is
      // canonicalised to another. Often intentional (paginated /
      // duplicates) but always worth surfacing.
      return `is_external = 0 AND content_kind = 'html'
              AND canonical IS NOT NULL AND canonical != ''
              AND canonical != url`;
    case 'issues:canonical-mismatch':
      // HTML and HTTP-header canonicals both exist but disagree —
      // Google picks one unpredictably. Always a misconfiguration.
      return `is_external = 0 AND content_kind = 'html'
              AND canonical IS NOT NULL AND canonical != ''
              AND canonical_http IS NOT NULL AND canonical_http != ''
              AND canonical != canonical_http`;
    case 'issues:canonical-to-non-200':
      // Canonical points to a URL we crawled and it returned 4xx/5xx —
      // major SEO bug, the canonical is broken. 3xx is excluded here
      // because redirects are surfaced separately under
      // `issues:canonical-to-redirect` to keep the two filters disjoint.
      return `is_external = 0 AND content_kind = 'html'
              AND canonical IS NOT NULL AND canonical != ''
              AND EXISTS (
                SELECT 1 FROM urls t WHERE t.url = urls.canonical
                  AND t.status_code IS NOT NULL
                  AND (t.status_code < 200 OR t.status_code >= 400)
              )`;
    case 'issues:canonical-to-redirect':
      // Canonical points to a 3xx URL — the canonical chain has an extra
      // hop that defeats its purpose. Google may consolidate to the
      // final URL but it's a wasted signal.
      return `is_external = 0 AND content_kind = 'html'
              AND canonical IS NOT NULL AND canonical != ''
              AND EXISTS (
                SELECT 1 FROM urls t WHERE t.url = urls.canonical
                  AND t.status_code >= 300 AND t.status_code < 400
              )`;
    case 'issues:canonical-to-noindex':
      // Canonical implies "use this as authoritative"; noindex says
      // "don't index". Contradictory — page sends mixed signals to
      // search engines.
      return `is_external = 0 AND content_kind = 'html'
              AND canonical IS NOT NULL AND canonical != ''
              AND EXISTS (
                SELECT 1 FROM urls t WHERE t.url = urls.canonical
                  AND t.indexability = 'non-indexable:noindex'
              )`;
    case 'issues:content-thin':
      return "is_external = 0 AND content_kind = 'html' AND word_count IS NOT NULL AND word_count < 300";
    case 'issues:response-slow':
      return 'is_external = 0 AND response_time_ms > 1000';
    case 'issues:response-very-slow':
      return 'is_external = 0 AND response_time_ms > 3000';
    case 'issues:page-large':
      return "is_external = 0 AND content_kind = 'html' AND content_length > 1048576";
    case 'issues:url-too-long':
      return 'is_external = 0 AND LENGTH(url) > 2048';
    case 'issues:url-uppercase':
      // GLOB with [A-Z] is case-sensitive — unlike LIKE which isn't.
      return "is_external = 0 AND url GLOB '*[A-Z]*'";
    case 'issues:url-underscore':
      return "is_external = 0 AND INSTR(url, '_') > 0";
    case 'issues:url-multiple-slashes':
      // Strip the `scheme://` prefix, then check for any `//` that remains
      // (path / query doubled slashes aren't usually intentional).
      return "is_external = 0 AND INSTR(SUBSTR(url, INSTR(url, '://') + 3), '//') > 0";
    case 'issues:url-non-ascii':
      // Byte-length (BLOB cast) > character length only when the string
      // contains multi-byte UTF-8, i.e. any non-ASCII code point.
      return 'is_external = 0 AND LENGTH(CAST(url AS BLOB)) != LENGTH(url)';
    case 'issues:lang-missing':
      return "is_external = 0 AND content_kind = 'html' AND (lang IS NULL OR lang = '')";
    case 'issues:viewport-missing':
      return "is_external = 0 AND content_kind = 'html' AND (viewport IS NULL OR viewport = '')";
    case 'issues:og-missing':
      return `is_external = 0 AND content_kind = 'html'
              AND (og_title IS NULL OR og_title = '')
              AND (og_description IS NULL OR og_description = '')
              AND (og_image IS NULL OR og_image = '')`;
    case 'issues:twitter-missing':
      // Twitter card is “missing” if there’s no twitter:card tag AND no
      // twitter:image — the minimum pair needed for a valid preview.
      return `is_external = 0 AND content_kind = 'html'
              AND (twitter_card IS NULL OR twitter_card = '')
              AND (twitter_image IS NULL OR twitter_image = '')`;
    // HSTS on HTTP is meaningless — only flag HTTPS pages. X-Frame-Options
    // and X-Content-Type-Options matter on any HTML response regardless
    // of scheme, so they're only scheme-gated on a per-page basis.
    case 'issues:hsts-missing':
      return "is_external = 0 AND url LIKE 'https://%' AND (hsts IS NULL OR hsts = '')";
    case 'issues:x-frame-options-missing':
      return `is_external = 0 AND content_kind = 'html'
              AND (x_frame_options IS NULL OR x_frame_options = '')`;
    case 'issues:x-content-type-options-missing':
      return `is_external = 0 AND content_kind = 'html'
              AND (x_content_type_options IS NULL OR x_content_type_options = '')`;
    case 'issues:csp-missing':
      return `is_external = 0 AND content_kind = 'html'
              AND (csp IS NULL OR csp = '')`;
    case 'issues:structured-data-missing':
      // "Missing" = no valid JSON-LD block AND no malformed block either;
      // if parsing failed we surface it under the invalid filter instead
      // so it's actionable, not confused with "nothing declared".
      return `is_external = 0 AND content_kind = 'html'
              AND schema_block_count = 0 AND schema_invalid_count = 0`;
    case 'issues:structured-data-invalid':
      return `is_external = 0 AND content_kind = 'html' AND schema_invalid_count > 0`;
    case 'issues:pagination-broken':
      // Page declares a rel=next/prev whose target was crawled and came
      // back as 4xx/5xx — actionable: the pagination chain is broken.
      return `is_external = 0 AND content_kind = 'html'
              AND (
                (pagination_next IS NOT NULL AND EXISTS (
                  SELECT 1 FROM urls t WHERE t.url = urls.pagination_next
                    AND t.status_code >= 400 AND t.status_code < 600))
                OR (pagination_prev IS NOT NULL AND EXISTS (
                  SELECT 1 FROM urls t WHERE t.url = urls.pagination_prev
                    AND t.status_code >= 400 AND t.status_code < 600))
              )`;
    case 'issues:hreflang-x-default-missing':
      // Page declares hreflang alternates but no `x-default` — Google's
      // recommended fallback for unmatched languages.
      return `is_external = 0 AND content_kind = 'html'
              AND hreflang_count > 0
              AND (hreflangs IS NULL OR INSTR(hreflangs, '"x-default"') = 0)`;
    case 'issues:mixed-content':
      // HTTPS pages that load at least one http:// subresource. The page
      // itself must be HTTPS for this to be meaningful — mixed_content_count
      // is always 0 on http:// pages by construction.
      return `is_external = 0 AND content_kind = 'html'
              AND url LIKE 'https://%' AND mixed_content_count > 0`;
    case 'issues:favicon-missing':
      return `is_external = 0 AND content_kind = 'html'
              AND (favicon IS NULL OR favicon = '')`;
    case 'issues:redirect-loop':
      return 'is_external = 0 AND redirect_loop = 1';
    case 'issues:redirect-chain-long':
      // 3 hops is the conservative SF threshold — every extra redirect
      // multiplies link-equity loss and crawl-budget waste.
      return 'is_external = 0 AND redirect_chain_length > 3';
    case 'issues:redirect-self':
      // Redirect target equals the URL itself — a self-loop. Always
      // broken regardless of `followRedirects`.
      return 'is_external = 0 AND redirect_target IS NOT NULL AND redirect_target = url';
    case 'issues:url-many-params':
      // 5+ query params usually means session IDs / faceted-nav explosion.
      return 'is_external = 0 AND query_param_count > 5';
    case 'issues:compression-missing':
      // No Content-Encoding on a successful HTML response = ~70% wasted
      // bandwidth. Skip the scheme-less and non-200 noise.
      return `is_external = 0 AND content_kind = 'html'
              AND status_code >= 200 AND status_code < 300
              AND (content_encoding IS NULL OR content_encoding = '')`;
    case 'issues:non-indexable-in-sitemap':
      // URL declared in sitemap but our crawl found it non-indexable
      // (noindex, canonical-to-other, blocked, redirect, …) — Google flags
      // this as a serious sitemap-quality issue.
      return `is_external = 0 AND indexability LIKE 'non-indexable%'
              AND EXISTS (SELECT 1 FROM sitemap_urls s WHERE s.url = urls.url)`;
    case 'issues:non-200-in-sitemap':
      return `is_external = 0
              AND status_code IS NOT NULL
              AND (status_code < 200 OR status_code >= 300)
              AND EXISTS (SELECT 1 FROM sitemap_urls s WHERE s.url = urls.url)`;
    case 'issues:image-missing-alt':
      return "is_external = 0 AND content_kind = 'html' AND images_missing_alt > 0";
    case 'issues:meta-refresh-used':
      // Any HTML page that declares a `<meta http-equiv="refresh">` —
      // Google explicitly recommends 301 over meta refresh, so every
      // occurrence is worth surfacing.
      return `is_external = 0 AND content_kind = 'html'
              AND meta_refresh IS NOT NULL AND meta_refresh != ''`;
    case 'issues:charset-missing':
      // HTML 2xx page declares no charset anywhere — neither
      // `<meta charset>` / `<meta http-equiv="Content-Type">` nor the
      // HTTP Content-Type header. Browsers fall back to a guess, which
      // can mojibake non-ASCII content.
      return `is_external = 0 AND content_kind = 'html'
              AND status_code >= 200 AND status_code < 300
              AND (charset IS NULL OR charset = '')`;
    // Broken-link categories drive the BrokenLinksTab view; they never
    // filter the URL table itself.
    case 'issues:broken-links-all':
    case 'issues:broken-links-internal':
    case 'issues:broken-links-external':
      return null;
    case 'issues:near-duplicate':
      // SimHash cluster size > 1 means at least one other crawled page
      // landed within the configured Hamming-distance threshold of this
      // one. cluster_id > 0 guards against pre-recompute state.
      return `is_external = 0 AND content_kind = 'html'
              AND cluster_id > 0 AND cluster_size > 1`;
    case 'issues:duplicate-content-exact':
      // Exact body-text collision (FNV-1a over the normalised token
      // stream). Stricter than near-duplicate — useful for spotting
      // accidental ?utm= or session-id variants the URL canonicaliser
      // missed.
      return `is_external = 0 AND content_kind = 'html'
              AND content_hash IS NOT NULL AND content_hash != ''
              AND content_hash IN (
                SELECT content_hash FROM urls
                WHERE is_external = 0 AND content_kind = 'html'
                  AND content_hash IS NOT NULL AND content_hash != ''
                GROUP BY content_hash HAVING COUNT(*) > 1
              )`;
    case 'issues:hreflang-invalid-code':
      // Page declares one or more hreflang entries whose lang token is
      // not a valid BCP-47 / `x-default` value. Silent SEO bug — Google
      // ignores invalid entries instead of warning.
      return `is_external = 0 AND content_kind = 'html'
              AND hreflang_invalid_count > 0`;
    case 'issues:hreflang-self-ref-missing':
      // Page declares hreflang alternates but does not list itself —
      // Google MUST-have. Without it, the cluster is asymmetric and
      // Google may pick any of the alternates as the canonical instead.
      return `is_external = 0 AND content_kind = 'html'
              AND hreflang_count > 0
              AND hreflang_self_ref_missing = 1`;
    case 'issues:hreflang-reciprocity-missing':
      // Page declares hreflang to N other crawled pages, but at least
      // one of those pages does NOT link back. Asymmetric clusters are
      // a top-3 hreflang misconfiguration in practice.
      return `is_external = 0 AND content_kind = 'html'
              AND hreflang_reciprocity_missing > 0`;
    case 'issues:hreflang-target-issues':
      // Hreflang target resolves to a non-200 / noindex / canonical-away
      // page. Aggregated: any kind of broken target trips this filter.
      return `is_external = 0 AND content_kind = 'html'
              AND hreflang_target_issues > 0`;
    case 'issues:crawled-not-in-sitemap':
      // Indexable HTML 2xx URLs the crawl found that are NOT listed in
      // any of the discovered sitemaps. Strong orphan-from-sitemap
      // candidate — Google may not crawl them on its sitemap pass.
      return `is_external = 0 AND content_kind = 'html'
              AND status_code >= 200 AND status_code < 300
              AND indexability = 'indexable'
              AND NOT EXISTS (SELECT 1 FROM sitemap_urls s WHERE s.url = urls.url)`;
    case 'issues:redirect-in-sitemap':
      // Sitemap entries that resolve to a redirect (3xx). Sitemap should
      // declare the canonical URL, not redirect sources — Google flags
      // this as a sitemap-quality signal in Search Console.
      return `is_external = 0
              AND status_code >= 300 AND status_code < 400
              AND EXISTS (SELECT 1 FROM sitemap_urls s WHERE s.url = urls.url)`;
    default:
      return null;
  }
}

/**
 * Validate a hreflang `lang` token against the practical BCP-47 subset
 * that Google accepts: ISO 639-1 (2 chars), ISO 639-2/3 (3 chars),
 * optional region (`-XX` country or `-NNN` UN M.49 numeric), or the
 * literal `x-default`. Case-insensitive in the wild (`tr-TR` and
 * `TR-tr` both accepted by Google) — we lowercase before matching.
 *
 * Rejects: bare uppercase/lowercase mixed errors, spaces, country-only,
 * underscored variants, three-letter region codes that aren't M.49.
 */
function isValidHreflangCode(raw: string): boolean {
  const code = raw.trim().toLowerCase();
  if (!code) return false;
  if (code === 'x-default') return true;
  return /^[a-z]{2,3}(-[a-z]{2}|-[0-9]{3})?$/.test(code);
}

/**
 * Number of `/`-delimited path segments in the URL (e.g. `/a/b/c` → 3,
 * `/` → 0). Falls back to 0 on parse errors so the column is always a
 * plain integer for simple SQL filtering / aggregation.
 */
function computeFolderDepth(rawUrl: string): number {
  try {
    const u = new URL(rawUrl);
    const path = u.pathname;
    if (!path || path === '/') return 0;
    return path.split('/').filter((s) => s.length > 0).length;
  } catch {
    return 0;
  }
}

/** Number of `?key=…&key=…` parameters in the query string. */
function computeQueryParamCount(rawUrl: string): number {
  try {
    const u = new URL(rawUrl);
    let n = 0;
    for (const _ of u.searchParams) n++;
    return n;
  } catch {
    return 0;
  }
}
