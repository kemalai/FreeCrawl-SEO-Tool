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
  title_count: number;
  images_empty_alt: number;
  empty_anchor_count: number;
  apple_touch_icon: string | null;
  manifest_url: string | null;
  feed_url: string | null;
  microdata_count: number;
  rdfa_count: number;
  insecure_form_action_count: number;
  missing_sri_count: number;
  title_pixel_width: number;
  meta_pixel_width: number;
  ttfb_ms: number | null;
  cookies_count: number;
  cookies_insecure: number;
  cookies_no_httponly: number;
  cookies_no_samesite: number;
  http_protocol: string | null;
  query_string_length: number;
  render_blocking_count: number;
  keep_alive: number;
  analytics_trackers: string | null;
  form_input_count: number;
  form_input_unlabeled: number;
  images_lazy: number;
  headings: string | null;
  server_header: string | null;
  js_only_links_count: number;
  text_code_ratio: number | null;
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
  titleCount?: number;
  imagesEmptyAlt?: number;
  emptyAnchorCount?: number;
  appleTouchIcon?: string | null;
  manifestUrl?: string | null;
  feedUrl?: string | null;
  microdataCount?: number;
  rdfaCount?: number;
  insecureFormActionCount?: number;
  missingSriCount?: number;
  titlePixelWidth?: number;
  metaPixelWidth?: number;
  ttfbMs?: number | null;
  cookiesCount?: number;
  cookiesInsecure?: number;
  cookiesNoHttpOnly?: number;
  cookiesNoSameSite?: number;
  httpProtocol?: string | null;
  queryStringLength?: number;
  renderBlockingCount?: number;
  keepAlive?: boolean;
  /** JSON-stringified array of `{ name, id }` analytics tracker entries, or null. */
  analyticsTrackers?: string | null;
  formInputCount?: number;
  formInputUnlabeled?: number;
  imagesLazy?: number;
  /** JSON-stringified outline array, or null. */
  headings?: string | null;
  /** Raw `Server` response header, or null when absent. */
  serverHeader?: string | null;
  /** Count of `<a>` tags that look clickable but aren't crawlable. */
  jsOnlyLinksCount?: number;
  /** Visible-text bytes / total HTML bytes as integer percent (0–100). */
  textCodeRatio?: number | null;
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
    simhash, content_hash,
    title_count, images_empty_alt, empty_anchor_count,
    apple_touch_icon, manifest_url, feed_url,
    microdata_count, rdfa_count, insecure_form_action_count, missing_sri_count,
    title_pixel_width, meta_pixel_width,
    ttfb_ms, cookies_count, cookies_insecure, cookies_no_httponly, cookies_no_samesite,
    http_protocol, query_string_length,
    render_blocking_count, keep_alive,
    analytics_trackers,
    form_input_count, form_input_unlabeled, images_lazy,
    headings,
    server_header,
    js_only_links_count, text_code_ratio
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
    :simhash, :content_hash,
    :title_count, :images_empty_alt, :empty_anchor_count,
    :apple_touch_icon, :manifest_url, :feed_url,
    :microdata_count, :rdfa_count, :insecure_form_action_count, :missing_sri_count,
    :title_pixel_width, :meta_pixel_width,
    :ttfb_ms, :cookies_count, :cookies_insecure, :cookies_no_httponly, :cookies_no_samesite,
    :http_protocol, :query_string_length,
    :render_blocking_count, :keep_alive,
    :analytics_trackers,
    :form_input_count, :form_input_unlabeled, :images_lazy,
    :headings,
    :server_header,
    :js_only_links_count, :text_code_ratio
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
    title_count = excluded.title_count,
    images_empty_alt = excluded.images_empty_alt,
    empty_anchor_count = excluded.empty_anchor_count,
    apple_touch_icon = excluded.apple_touch_icon,
    manifest_url = excluded.manifest_url,
    feed_url = excluded.feed_url,
    microdata_count = excluded.microdata_count,
    rdfa_count = excluded.rdfa_count,
    insecure_form_action_count = excluded.insecure_form_action_count,
    missing_sri_count = excluded.missing_sri_count,
    title_pixel_width = excluded.title_pixel_width,
    meta_pixel_width = excluded.meta_pixel_width,
    ttfb_ms = excluded.ttfb_ms,
    cookies_count = excluded.cookies_count,
    cookies_insecure = excluded.cookies_insecure,
    cookies_no_httponly = excluded.cookies_no_httponly,
    cookies_no_samesite = excluded.cookies_no_samesite,
    http_protocol = excluded.http_protocol,
    query_string_length = excluded.query_string_length,
    render_blocking_count = excluded.render_blocking_count,
    keep_alive = excluded.keep_alive,
    analytics_trackers = excluded.analytics_trackers,
    form_input_count = excluded.form_input_count,
    form_input_unlabeled = excluded.form_input_unlabeled,
    images_lazy = excluded.images_lazy,
    headings = excluded.headings,
    server_header = excluded.server_header,
    js_only_links_count = excluded.js_only_links_count,
    text_code_ratio = excluded.text_code_ratio,
    crawled_at = CURRENT_TIMESTAMP
  RETURNING id
`;

export class ProjectDb {
  private readonly db: DatabaseSync;
  private readonly stmtUpsertUrl: StatementSync;
  private readonly stmtGetUrlId: StatementSync;
  private readonly stmtInsertLink: StatementSync;
  private readonly stmtInsertExternalStub: StatementSync;
  /**
   * Re-entrancy counter for `runInTransaction`. > 0 means a transaction
   * is already open on this connection — nested calls flatten into the
   * outer one rather than failing on SQLite's "no nested BEGIN" rule.
   */
  private txDepth = 0;

  /**
   * Opens (or creates) the project SQLite file.
   *
   *   `readOnly` — defaults to false (the writer/owner connection used
   *   by the main process and CLI). When true, the database is opened
   *   in shared read-only mode, migrations are skipped (the writer
   *   already ran them), and write-only PRAGMAs (`wal_autocheckpoint`)
   *   are not set. This is the path used by the worker-thread reader
   *   pool — multiple read-only connections can attach to the same WAL
   *   file and observe writes committed by the main connection.
   *
   *   Cache is set tighter on read-only connections (32 MB vs 128 MB)
   *   so the two SQLite connections don't double-allocate RAM.
   */
  constructor(filePath: string, opts: { readOnly?: boolean } = {}) {
    const readOnly = opts.readOnly === true;
    // node:sqlite's `DatabaseSync` constructor type-asserts the second
    // argument as an object — passing `undefined` throws
    // `TypeError: The "options" argument must be an object`. Use the
    // single-arg form for the default writer path, and pass an explicit
    // options object only when we actually need read-only mode.
    this.db = readOnly
      ? new DatabaseSync(filePath, { readOnly: true })
      : new DatabaseSync(filePath);
    if (!readOnly) {
      this.db.exec('PRAGMA journal_mode = WAL');
      this.db.exec('PRAGMA synchronous = NORMAL');
      this.db.exec('PRAGMA foreign_keys = ON');
    }
    // Two writer connections coexist on the same DB file in the desktop
    // app: the main-process ProjectDb (used for sitemap ingest, post-
    // crawl recomputes, the user-initiated mutations like deleteUrl)
    // AND the db-writer worker thread (used for the per-URL hot path).
    // SQLite serialises writes at the file level, so without
    // `busy_timeout` whichever connection is "second" through the door
    // gets SQLITE_BUSY thrown the instant the other one is mid-
    // transaction — we saw this when the user clicked Start twice in
    // quick succession ("Sitemap discovery skipped: database is
    // locked"). 10 s is well over the worst-case writer hold time
    // (post-crawl materialise-issues yielding transactions are <500 ms
    // each) and adds zero overhead when there is no contention.
    if (!readOnly) {
      this.db.exec('PRAGMA busy_timeout = 10000');
    } else {
      // Even read-only connections benefit during a checkpoint storm.
      this.db.exec('PRAGMA busy_timeout = 5000');
    }
    this.db.exec('PRAGMA temp_store = MEMORY');
    this.db.exec(`PRAGMA cache_size = ${readOnly ? -32768 : -131072}`);
    // 30GB virtual address window for mmap-backed reads; OS only pages in
    // what's touched, so there's no actual memory commit here.
    this.db.exec('PRAGMA mmap_size = 30000000000');
    if (!readOnly) {
      this.db.exec('PRAGMA page_size = 4096');
      this.db.exec('PRAGMA wal_autocheckpoint = 2000');
      runMigrations(this.db);
    }

    if (readOnly) {
      // Read-only mode: the prepare-statement-on-construct pattern below
      // would fail because the SQL contains writes (UPSERT/INSERT). They
      // are not used on a read-only connection; assign placeholder casts
      // so the typings are satisfied. Any accidental write call would
      // throw at run time with a clear "attempt to write a readonly
      // database" message — easier to debug than a silent no-op.
      const noopStmt = this.db.prepare('SELECT 1') as unknown as StatementSync;
      this.stmtUpsertUrl = noopStmt;
      this.stmtGetUrlId = this.db.prepare('SELECT id FROM urls WHERE url = ?');
      this.stmtInsertLink = noopStmt;
      this.stmtInsertExternalStub = noopStmt;
      return;
    }

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
       DELETE FROM url_sources;
       DELETE FROM sitemap_urls;
       DELETE FROM urls;
       DELETE FROM project_meta;
       DELETE FROM urls_issues;
       DELETE FROM crawl_queue;`,
    );
  }

  /**
   * GDPR-aligned per-domain wipe. Removes every URL row whose host
   * (case-insensitive) matches `domain`, plus every dependent record
   * keyed off those URLs (`links`, `headers`, `url_sources`,
   * `urls_issues`, `image_usages` rows pointing at images that are now
   * orphaned). Used by Settings → "Delete Domain Data" so a user can
   * comply with a data-removal request without nuking the whole crawl.
   *
   * Domain match is exact-host (`example.com` matches `example.com` but
   * not `sub.example.com`). For "all subdomains too" the caller can
   * issue multiple deletes; we don't infer wildcard semantics here to
   * avoid surprising over-broad wipes.
   *
   * Wrapped in `runInTransaction` so the wipe is atomic: either every
   * dependent row goes away or nothing does.
   */
  deleteByDomain(domain: string): { urlsDeleted: number; linksDeleted: number } {
    const target = domain.trim().toLowerCase();
    if (!target) return { urlsDeleted: 0, linksDeleted: 0 };
    return this.runInTransaction(() => {
      // Snapshot the URL ids we'll delete so we can fan out into the
      // dependent tables before the parent rows vanish.
      const ids = (
        this.db
          .prepare(
            `SELECT id FROM urls
              WHERE LOWER(
                SUBSTR(
                  url,
                  INSTR(url, '://') + 3,
                  CASE
                    WHEN INSTR(SUBSTR(url, INSTR(url, '://') + 3), '/') > 0
                      THEN INSTR(SUBSTR(url, INSTR(url, '://') + 3), '/') - 1
                    ELSE LENGTH(url)
                  END
                )
              ) = ?`,
          )
          .all(target) as { id: number }[]
      ).map((r) => r.id);

      if (ids.length === 0) return { urlsDeleted: 0, linksDeleted: 0 };

      // SQLite parameter limit: chunk the IN-list at 500 ids per delete.
      const CHUNK = 500;
      let linksDeleted = 0;
      for (let i = 0; i < ids.length; i += CHUNK) {
        const slice = ids.slice(i, i + CHUNK);
        const placeholders = slice.map(() => '?').join(',');
        // Links can reference these urls as `from_url_id` (page → link
        // catalogue) or by url string in `to_url`. Wipe both directions.
        const linkRes = this.db
          .prepare(`DELETE FROM links WHERE from_url_id IN (${placeholders})`)
          .run(...slice);
        linksDeleted += Number(linkRes.changes);
        this.db
          .prepare(`DELETE FROM headers WHERE url_id IN (${placeholders})`)
          .run(...slice);
        this.db
          .prepare(`DELETE FROM url_sources WHERE url_id IN (${placeholders})`)
          .run(...slice);
        this.db
          .prepare(`DELETE FROM image_usages WHERE from_url_id IN (${placeholders})`)
          .run(...slice);
        this.db
          .prepare(`DELETE FROM urls_issues WHERE url_id IN (${placeholders})`)
          .run(...slice);
      }

      // Wipe `to_url` references in `links` that pointed AT the deleted
      // URLs by host string. This is a separate pass because `to_url`
      // is a string column, not a foreign key.
      this.db
        .prepare(
          `DELETE FROM links
            WHERE LOWER(
              SUBSTR(
                to_url,
                INSTR(to_url, '://') + 3,
                CASE
                  WHEN INSTR(SUBSTR(to_url, INSTR(to_url, '://') + 3), '/') > 0
                    THEN INSTR(SUBSTR(to_url, INSTR(to_url, '://') + 3), '/') - 1
                  ELSE LENGTH(to_url)
                END
              )
            ) = ?`,
        )
        .run(target);

      // Finally the parent URL rows.
      let urlsDeleted = 0;
      for (let i = 0; i < ids.length; i += CHUNK) {
        const slice = ids.slice(i, i + CHUNK);
        const placeholders = slice.map(() => '?').join(',');
        const res = this.db
          .prepare(`DELETE FROM urls WHERE id IN (${placeholders})`)
          .run(...slice);
        urlsDeleted += Number(res.changes);
      }

      // Orphaned image rows (no remaining `image_usages` referencing
      // them) are cleaned in a follow-up sweep.
      this.db.exec(
        `DELETE FROM images
          WHERE id NOT IN (SELECT DISTINCT image_id FROM image_usages)`,
      );

      return { urlsDeleted, linksDeleted };
    });
  }

  /**
   * Run a callback inside a single SQLite transaction. Drives the
   * crawler's write-coalescing pump: 50–100 individual upserts per
   * page (URL row + N links + N images + headers + cookies + extracted)
   * become a single fsync instead of N. On a 1000-URL crawl this is
   * 5–10× fewer disk transactions, which is the difference between
   * "smooth" and "kasma" on low-end SSDs and Windows Defender real-time
   * scan paths.
   *
   * Nested calls are flattened: the outer `BEGIN`/`COMMIT` owns the
   * transaction and inner invocations become no-ops. This lets existing
   * methods like `insertLinks` (which already wrap their own BEGIN)
   * compose freely with the new outer batch.
   *
   * On exception we attempt a `ROLLBACK`. Both the success-`COMMIT` and
   * the failure-`ROLLBACK` paths are wrapped in `tryReset` because
   * SQLite can auto-rollback on errors like `SQLITE_BUSY` (leaving the
   * connection in autocommit mode again) — in that case our follow-up
   * `ROLLBACK` would itself throw "no transaction is active". Either
   * outcome must reset `txDepth` to 0 or the next `runInTransaction`
   * call would fire `BEGIN` while SQLite still thinks a transaction
   * was open, producing the "cannot start a transaction within a
   * transaction" error reported by the user.
   */
  runInTransaction<T>(fn: () => T): T {
    if (this.txDepth > 0) {
      this.txDepth++;
      try {
        return fn();
      } finally {
        this.txDepth--;
      }
    }
    this.db.exec('BEGIN IMMEDIATE');
    this.txDepth = 1;
    try {
      const result = fn();
      try {
        this.db.exec('COMMIT');
      } finally {
        this.txDepth = 0;
      }
      return result;
    } catch (err) {
      try {
        this.db.exec('ROLLBACK');
      } catch {
        /* SQLite already auto-rolled back; ignore. */
      }
      this.txDepth = 0;
      throw err;
    }
  }

  /** True when the caller is already inside a `runInTransaction` frame. */
  isInTransaction(): boolean {
    return this.txDepth > 0;
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

  /**
   * Atomic batch write for the per-URL hot path. Replaces the previous
   * "upsertUrl then runInTransaction({ setHeaders, setSource,
   * insertLinks, insertImages })" sequence with a single transaction
   * that runs in one trip across the writer-worker boundary — half
   * the IPC round-trips, one transaction commit instead of two
   * sequential commits, and atomic visibility (a reader can never see
   * a URL row without its links).
   */
  writeFetchedUrl(payload: {
    upsert: UpsertUrlInput;
    headers: ReadonlyArray<readonly [string, string]> | null;
    storeBody: { body: string; maxBytes: number } | null;
    links: DiscoveredLink[];
    images: DiscoveredImage[];
    fromDepth: number;
  }): { urlId: number } {
    return this.runInTransaction(() => {
      const urlId = this.upsertUrl(payload.upsert);
      if (urlId && payload.headers && payload.headers.length > 0) {
        this.setUrlHeaders(urlId, payload.headers);
      }
      if (urlId && payload.storeBody) {
        try {
          this.setUrlSource(urlId, payload.storeBody.body, payload.storeBody.maxBytes);
        } catch {
          /* best-effort — a snapshot failure must not abort the whole batch */
        }
      }
      if (urlId) {
        if (payload.links.length > 0) {
          this.insertLinks(urlId, payload.links, payload.fromDepth);
        }
        if (payload.images.length > 0) {
          this.insertImages(urlId, payload.images);
        }
      }
      return { urlId };
    });
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

  /**
   * Internal URLs the crawler discovered as link targets but never
   * fetched (depth/queue/filter race), plus URLs explicitly marked for
   * re-crawl (status_code nulled out).
   *
   *   `excludeNofollow` — when true, drops URLs whose ONLY incoming
   *   internal links carry rel="nofollow". A URL referenced by both a
   *   nofollow and a follow link still qualifies (the follow link is
   *   what we'd crawl). Used when the active config has
   *   `followNofollow: false` so the drain loop and resume path don't
   *   silently crawl URLs the user explicitly asked to leave alone.
   */
  getPendingInternalLinks(
    opts: { excludeNofollow?: boolean } = {},
  ): { url: string; depth: number }[] {
    const followFilter = opts.excludeNofollow
      ? `AND (l.rel IS NULL OR l.rel NOT LIKE '%nofollow%')`
      : '';
    const discovered = this.db
      .prepare(
        `SELECT l.to_url AS url, MIN(u.depth) + 1 AS depth
         FROM links l
         JOIN urls u ON l.from_url_id = u.id
         WHERE l.is_internal = 1
           AND l.to_url NOT IN (SELECT url FROM urls)
           ${followFilter}
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
      title_count: input.titleCount ?? 0,
      images_empty_alt: input.imagesEmptyAlt ?? 0,
      empty_anchor_count: input.emptyAnchorCount ?? 0,
      apple_touch_icon: input.appleTouchIcon ?? null,
      manifest_url: input.manifestUrl ?? null,
      feed_url: input.feedUrl ?? null,
      microdata_count: input.microdataCount ?? 0,
      rdfa_count: input.rdfaCount ?? 0,
      insecure_form_action_count: input.insecureFormActionCount ?? 0,
      missing_sri_count: input.missingSriCount ?? 0,
      title_pixel_width: input.titlePixelWidth ?? 0,
      meta_pixel_width: input.metaPixelWidth ?? 0,
      ttfb_ms: input.ttfbMs ?? null,
      cookies_count: input.cookiesCount ?? 0,
      cookies_insecure: input.cookiesInsecure ?? 0,
      cookies_no_httponly: input.cookiesNoHttpOnly ?? 0,
      cookies_no_samesite: input.cookiesNoSameSite ?? 0,
      http_protocol: input.httpProtocol ?? null,
      query_string_length: input.queryStringLength ?? 0,
      render_blocking_count: input.renderBlockingCount ?? 0,
      keep_alive: input.keepAlive === undefined ? -1 : input.keepAlive ? 1 : 0,
      analytics_trackers: input.analyticsTrackers ?? null,
      form_input_count: input.formInputCount ?? 0,
      form_input_unlabeled: input.formInputUnlabeled ?? 0,
      images_lazy: input.imagesLazy ?? 0,
      headings: input.headings ?? null,
      server_header: input.serverHeader ?? null,
      js_only_links_count: input.jsOnlyLinksCount ?? 0,
      text_code_ratio: input.textCodeRatio ?? null,
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
    // Skip the inner BEGIN when the caller already opened a transaction
    // via `runInTransaction` — SQLite forbids nested BEGINs and the
    // outer transaction will commit our work atomically anyway.
    const ownsTx = !this.isInTransaction();
    if (ownsTx) this.db.exec('BEGIN');
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

      if (ownsTx) this.db.exec('COMMIT');
    } catch (err) {
      if (ownsTx) {
        try {
          this.db.exec('ROLLBACK');
        } catch {
          /* ignore secondary rollback failure */
        }
      }
      throw err;
    }
  }

  /**
   * Refill the materialised `urls_issues` table from a list of
   * `[issueKey, whereSql]` definitions. Each definition becomes a
   * single `INSERT … SELECT id, '<key>' FROM urls WHERE <clause>`
   * statement. Heavy correlated-subquery WHERE clauses (dead external
   * domain, duplicate URL post-norm, canonical chain multi-hop) run
   * exactly once per crawl, not once per sidebar tick — the table is
   * then GROUP BY'd in O(distinct keys) for the live counters.
   *
   * Truncate-then-insert is intentional: incremental upkeep would
   * require knowing which URLs each WHERE clause is sensitive to,
   * which we don't want to track per-clause. A single 100k-row
   * recompute on commodity hardware is < 200 ms (one pass per
   * definition; SQLite parses each WHERE once thanks to the prepared
   * statement cache).
   *
   * Wrapped in `runInTransaction` so renderers see either the
   * pre-pass state or the fully-rebuilt state — never a half-empty
   * issues table that would briefly show inflated zeros.
   */
  recomputeUrlsIssues(definitions: ReadonlyArray<readonly [string, string]>): void {
    this.runInTransaction(() => {
      this.db.exec('DELETE FROM urls_issues');
      for (const [issueKey, where] of definitions) {
        this.db
          .prepare(
            `INSERT OR IGNORE INTO urls_issues (url_id, issue_key)
               SELECT id, ? FROM urls WHERE ${where}`,
          )
          .run(issueKey);
      }
    });
  }

  /**
   * Cooperatively-scheduled recompute. Identical end-state to
   * `recomputeUrlsIssues` but yields to the Node event loop between
   * each definition's INSERT, so the main thread can service IPC and
   * crawler callbacks instead of freezing for the full duration of
   * the 70+ correlated subqueries.
   *
   * Tradeoff vs. the sync version: every INSERT runs in its own tiny
   * transaction (a `DELETE` + N `INSERT`s) instead of one big atomic
   * one. Readers may briefly see a partially-rebuilt table during the
   * window. For the periodic in-crawl tick that drives sidebar
   * counters this is acceptable — momentary undercount for live
   * counters beats a 1–3 s UI freeze every 30 s. The post-crawl pass
   * still uses the atomic sync version for the final committed state.
   */
  async recomputeUrlsIssuesYielding(
    definitions: ReadonlyArray<readonly [string, string]>,
  ): Promise<void> {
    // Atomic truncate so getIssueCounts can never see "old + new" rows.
    this.runInTransaction(() => {
      this.db.exec('DELETE FROM urls_issues');
    });
    for (const [issueKey, where] of definitions) {
      // One transaction per definition keeps the writer lock window
      // short — other writes (the crawler's per-URL inserts) can
      // interleave between definitions instead of waiting on the
      // whole 70-statement block.
      this.runInTransaction(() => {
        this.db
          .prepare(
            `INSERT OR IGNORE INTO urls_issues (url_id, issue_key)
               SELECT id, ? FROM urls WHERE ${where}`,
          )
          .run(issueKey);
      });
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
  }

  /**
   * Fast lookup of materialised issue counts. Single SELECT … GROUP BY
   * — replaces the 130-statement loop the sidebar used to run. Only
   * keys present in `urls_issues` appear; callers default missing
   * keys to 0.
   */
  getIssueCounts(): Map<string, number> {
    const rows = this.db
      .prepare(
        `SELECT issue_key, COUNT(*) AS c
           FROM urls_issues
          GROUP BY issue_key`,
      )
      .all() as { issue_key: string; c: number }[];
    const out = new Map<string, number>();
    for (const r of rows) out.set(r.issue_key, r.c);
    return out;
  }

  /**
   * Detect paginated URL clusters with missing ordinals and flag them.
   *
   * Algorithm:
   *   1. Pull every internal HTML URL that participates in pagination
   *      — has either `pagination_next` or `pagination_prev` non-null.
   *   2. Extract a `(template, ordinal)` pair from each URL by stripping
   *      the page-number token and recording its integer value. Three
   *      patterns are recognised in priority order:
   *        a. `?page=<n>` / `?p=<n>` / `?pg=<n>` query param
   *        b. `/page/<n>/` or `/page/<n>` path segment
   *        c. `/<n>` trailing path component (only when ≥ 2 — too
   *           ambiguous otherwise; a literal `/2` could mean page 2
   *           or product 2, but in practice paginated trailing-number
   *           URLs always start at 2 because page 1 omits the number)
   *      URLs that don't match any pattern are skipped — they have
   *      pagination links but use an unknown URL scheme (cursor IDs,
   *      hash-only, JS state) and gap detection isn't possible.
   *   3. GROUP BY template, sort each group's ordinals ascending, and
   *      flag every member of a group whose ordinals contain a gap
   *      (`max - min + 1 != count` — accepts duplicates, requires
   *      density). Groups of size 1 are skipped.
   *   4. Bulk-update `urls.pagination_sequence_break` in a single
   *      transaction. Default 0 already set by the schema; we only
   *      need to write 1's.
   *
   * O(N) memory, O(N log N) time (per-template sort dominates).
   */
  recomputePaginationSequence(): void {
    const rows = this.db
      .prepare(
        `SELECT id, url
           FROM urls
          WHERE is_external = 0
            AND content_kind = 'html'
            AND (pagination_next IS NOT NULL OR pagination_prev IS NOT NULL)`,
      )
      .all() as { id: number; url: string }[];

    interface ParsedPage {
      id: number;
      template: string;
      ordinal: number;
    }
    const parsed: ParsedPage[] = [];
    for (const r of rows) {
      const ord = parsePaginationOrdinal(r.url);
      if (ord) parsed.push({ id: r.id, template: ord.template, ordinal: ord.ordinal });
    }

    // Group by template + walk for gaps.
    const groups = new Map<string, ParsedPage[]>();
    for (const p of parsed) {
      const arr = groups.get(p.template);
      if (arr) arr.push(p);
      else groups.set(p.template, [p]);
    }

    const flaggedIds: number[] = [];
    for (const arr of groups.values()) {
      if (arr.length < 2) continue;
      const ordinals = arr.map((p) => p.ordinal).sort((a, b) => a - b);
      const min = ordinals[0]!;
      const max = ordinals[ordinals.length - 1]!;
      const expected = max - min + 1;
      const distinct = new Set(ordinals).size;
      if (distinct < expected) {
        // At least one ordinal is missing in the [min,max] range.
        for (const p of arr) flaggedIds.push(p.id);
      }
    }

    this.runInTransaction(() => {
      this.db.exec('UPDATE urls SET pagination_sequence_break = 0 WHERE pagination_sequence_break = 1');
      if (flaggedIds.length === 0) return;
      const stmt = this.db.prepare(
        'UPDATE urls SET pagination_sequence_break = 1 WHERE id = ?',
      );
      for (const id of flaggedIds) stmt.run(id);
    });
  }

  /**
   * Persist the in-flight queue snapshot. Called by the crawler on a
   * fixed cadence (every 30 s by default) so a crash, OOM, or OS
   * reboot only loses up to that window. The pass is idempotent:
   * `INSERT OR IGNORE` against the URL primary key, then the matching
   * `seed_url` to discriminate stale checkpoints from a different
   * start URL the user may have queued earlier in the same project.
   *
   * Truncate-then-insert is intentional: the queue shrinks as URLs
   * complete, and we don't want yesterday's pending entries lingering
   * after a successful crawl finishes.
   */
  checkpointQueue(items: ReadonlyArray<{ url: string; depth: number }>, seedUrl: string): void {
    this.runInTransaction(() => {
      this.db.exec('DELETE FROM crawl_queue');
      if (items.length === 0) return;
      const stmt = this.db.prepare(
        'INSERT OR IGNORE INTO crawl_queue (url, depth, seed_url) VALUES (?, ?, ?)',
      );
      const seed = seedUrl ?? '';
      const CHUNK = 500;
      // Multi-row VALUES inserts in chunks — single .run() per item is
      // ~10× slower at 100k+ items.
      for (let i = 0; i < items.length; i += CHUNK) {
        const slice = items.slice(i, i + CHUNK);
        for (const it of slice) stmt.run(it.url, it.depth, seed);
      }
    });
  }

  /** Read the pending queue snapshot back. Empty array when nothing
   * was checkpointed (i.e. previous crawl exited cleanly). */
  loadQueueCheckpoint(): { url: string; depth: number; seedUrl: string }[] {
    return this.db
      .prepare('SELECT url, depth, seed_url AS seedUrl FROM crawl_queue')
      .all() as { url: string; depth: number; seedUrl: string }[];
  }

  /** Wipe the checkpoint — called after a successful clean crawl
   * completion or when the user dismisses the resume prompt. */
  clearQueueCheckpoint(): void {
    this.db.exec('DELETE FROM crawl_queue');
  }

  /**
   * Detect pages whose hreflang JSON contains the same `lang` token
   * mapped to two different target URLs. Common cause: a CMS bug
   * where the language switcher emits both `<link hreflang="es" href="…/es/page-a">`
   * and `<link hreflang="es" href="…/es/page-b">` on the same page,
   * which makes search engines unable to pick a canonical regional
   * variant. Sets `urls.hreflang_inconsistent_lang = 1` for every
   * affected page.
   *
   * Implementation: pull the JSON column for every page that has any
   * hreflang entries; parse client-side; mark the row when any lang
   * appears twice with non-equal hrefs. Truncate-then-mark wrapped in
   * a transaction so the boolean is consistent.
   */
  recomputeHreflangInconsistent(): void {
    const rows = this.db
      .prepare(
        `SELECT id, hreflangs FROM urls
          WHERE is_external = 0
            AND content_kind = 'html'
            AND hreflangs IS NOT NULL
            AND hreflangs != ''
            AND hreflangs != '[]'`,
      )
      .all() as { id: number; hreflangs: string }[];

    const flagged: number[] = [];
    for (const r of rows) {
      let entries: { lang?: string; href?: string }[] = [];
      try {
        entries = JSON.parse(r.hreflangs) as { lang?: string; href?: string }[];
      } catch {
        continue;
      }
      const seen = new Map<string, string>();
      let inconsistent = false;
      for (const e of entries) {
        if (!e.lang || !e.href) continue;
        const key = e.lang.toLowerCase();
        const prev = seen.get(key);
        if (prev && prev !== e.href) {
          inconsistent = true;
          break;
        }
        if (!prev) seen.set(key, e.href);
      }
      if (inconsistent) flagged.push(r.id);
    }

    this.runInTransaction(() => {
      this.db.exec(
        'UPDATE urls SET hreflang_inconsistent_lang = 0 WHERE hreflang_inconsistent_lang = 1',
      );
      if (flagged.length === 0) return;
      const stmt = this.db.prepare(
        'UPDATE urls SET hreflang_inconsistent_lang = 1 WHERE id = ?',
      );
      for (const id of flagged) stmt.run(id);
    });
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
    const ownsTx = !this.isInTransaction();
    if (ownsTx) this.db.exec('BEGIN');
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
      if (ownsTx) this.db.exec('COMMIT');
    } catch (err) {
      if (ownsTx) {
        try {
          this.db.exec('ROLLBACK');
        } catch {
          /* ignore */
        }
      }
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

  /**
   * Per-instance cache of compiled `SELECT COUNT(*) … WHERE <clause>`
   * statements. Without this, every call to `getOverviewCounts` was
   * re-compiling the same ~135 WHERE clauses from scratch — the SQLite
   * parser is fast but parsing 135 statements every 3 s sidebar tick
   * still added 30–80 ms to the main thread on a 2k-URL crawl. With
   * the cache the parser cost is paid once at first call; subsequent
   * ticks are pure execute time.
   */
  private readonly countWhereStmtCache = new Map<string, StatementSync>();

  /**
   * Synchronous `getOverviewCounts`. Kept for back-compat callers (CLI,
   * tests, code paths that aren't latency-sensitive). The desktop main
   * process should prefer `getOverviewCountsAsync` which yields to the
   * event loop every N counters so the renderer's input IPC keeps
   * draining mid-aggregate.
   */
  getOverviewCounts(): OverviewCounts {
    const countWhere = (clause: string): number => {
      let stmt = this.countWhereStmtCache.get(clause);
      if (!stmt) {
        stmt = this.db.prepare(`SELECT COUNT(*) AS c FROM urls WHERE ${clause}`);
        this.countWhereStmtCache.set(clause, stmt);
      }
      return (stmt.get() as { c: number }).c;
    };
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
    const countWhere = (clause: string): number => {
      let stmt = this.countWhereStmtCache.get(clause);
      if (!stmt) {
        stmt = this.db.prepare(`SELECT COUNT(*) AS c FROM urls WHERE ${clause}`);
        this.countWhereStmtCache.set(clause, stmt);
      }
      return (stmt.get() as { c: number }).c;
    };
    // Materialised counters fan-out (I-3). Heavy issue checks read
    // from `urls_issues` instead of running their own correlated
    // subquery on every sidebar tick.
    const issueCounts = this.getIssueCounts();
    const issueCount = (key: string): number => issueCounts.get(key) ?? 0;
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
        `${html} AND schema_block_count = 0 AND schema_invalid_count = 0
         AND microdata_count = 0 AND rdfa_count = 0`,
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
      h1Empty: countWhere(`${html} AND h1_count > 0 AND (h1 IS NULL OR h1 = '')`),
      h1TooLong: countWhere(`${html} AND h1_length > 70`),
      titleMultiple: countWhere(`${html} AND title_count > 1`),
      urlFragment: countWhere("is_external = 0 AND INSTR(url, '#') > 0"),
      urlSpaces: countWhere(
        "is_external = 0 AND (INSTR(url, ' ') > 0 OR INSTR(url, '%20') > 0)",
      ),
      imageEmptyAlt: countWhere(`${html} AND images_empty_alt > 0`),
      linkEmptyAnchor: countWhere(`${html} AND empty_anchor_count > 0`),
      appleTouchIconMissing: countWhere(
        `${html} AND status_code >= 200 AND status_code < 300
         AND (apple_touch_icon IS NULL OR apple_touch_icon = '')`,
      ),
      manifestMissing: countWhere(
        `${html} AND status_code >= 200 AND status_code < 300
         AND (manifest_url IS NULL OR manifest_url = '')`,
      ),
      feedMissing: countWhere(
        `${html} AND status_code >= 200 AND status_code < 300
         AND (feed_url IS NULL OR feed_url = '')`,
      ),
      titlePixelWidthTooLong: countWhere(`${html} AND title_pixel_width > 600`),
      metaPixelWidthTooLong: countWhere(`${html} AND meta_pixel_width > 990`),
      insecureFormAction: countWhere(
        `${html} AND url LIKE 'https://%' AND insecure_form_action_count > 0`,
      ),
      missingSri: countWhere(`${html} AND missing_sri_count > 0`),
      ttfbSlow: countWhere('is_external = 0 AND ttfb_ms IS NOT NULL AND ttfb_ms > 600'),
      ttfbVerySlow: countWhere(
        'is_external = 0 AND ttfb_ms IS NOT NULL AND ttfb_ms > 1800',
      ),
      cookieNoSecure: countWhere(
        "is_external = 0 AND cookies_insecure > 0 AND url LIKE 'https://%'",
      ),
      cookieNoHttpOnly: countWhere('is_external = 0 AND cookies_no_httponly > 0'),
      cookieNoSameSite: countWhere('is_external = 0 AND cookies_no_samesite > 0'),
      queryStringTooLong: countWhere('is_external = 0 AND query_string_length > 100'),
      folderDepthTooDeep: countWhere('is_external = 0 AND folder_depth > 4'),
      http2NotSupported: countWhere(
        `${html} AND http_protocol = 'http/1.1'`,
      ),
      renderBlocking: countWhere(`${html} AND render_blocking_count > 5`),
      keepaliveDisabled: countWhere('is_external = 0 AND keep_alive = 0'),
      titlePlaceholder: countWhere(
        `${html} AND title IS NOT NULL AND title != ''
         AND (
           LOWER(title) IN ('untitled', 'untitled document', 'default title',
                             'new page', 'page', 'home', 'index', 'document',
                             'welcome', 'untitled-1', 'untitled 1', 'home page')
           OR LOWER(title) LIKE 'page %'
           OR LOWER(title) LIKE 'untitled%'
         )`,
      ),
      analyticsMissing: countWhere(
        `${html} AND status_code BETWEEN 200 AND 299
         AND indexability = 'indexable'
         AND (analytics_trackers IS NULL OR analytics_trackers = '[]' OR analytics_trackers = '')`,
      ),
      analyticsMultipleGa4: countWhere(
        `is_external = 0 AND analytics_trackers IS NOT NULL
         AND (
           LENGTH(analytics_trackers) - LENGTH(REPLACE(analytics_trackers, '"name":"Google Analytics 4"', ''))
         ) / LENGTH('"name":"Google Analytics 4"') > 1`,
      ),
      analyticsUaLegacy: countWhere(
        `is_external = 0 AND analytics_trackers IS NOT NULL
         AND analytics_trackers LIKE '%"name":"Google Analytics (UA)"%'`,
      ),
      analyticsPixelWithoutPolicy: countWhere(
        `${html} AND analytics_trackers IS NOT NULL
         AND (analytics_trackers LIKE '%"Facebook Pixel"%'
           OR analytics_trackers LIKE '%"TikTok Pixel"%'
           OR analytics_trackers LIKE '%"Pinterest Tag"%'
           OR analytics_trackers LIKE '%"LinkedIn Insight Tag"%')
         AND (permissions_policy IS NULL OR permissions_policy = '')`,
      ),
      imageTooLarge: countWhere(
        `${html} AND EXISTS (
           SELECT 1 FROM image_usages iu
             JOIN images i ON i.id = iu.image_id
            WHERE iu.from_url_id = urls.id
              AND i.is_internal = 1
              AND i.byte_size IS NOT NULL
              AND i.byte_size > 102400
         )`,
      ),
      sslCertExpired: countWhere(
        `is_external = 0 AND url LIKE 'https://%'
         AND EXISTS (
           SELECT 1 FROM host_certs hc
            WHERE hc.host = LOWER(SUBSTR(urls.url, 9, INSTR(SUBSTR(urls.url, 9), '/') - 1))
              AND hc.days_until_expiry IS NOT NULL
              AND hc.days_until_expiry < 0
         )`,
      ),
      sslCertExpiringSoon: countWhere(
        `is_external = 0 AND url LIKE 'https://%'
         AND EXISTS (
           SELECT 1 FROM host_certs hc
            WHERE hc.host = LOWER(SUBSTR(urls.url, 9, INSTR(SUBSTR(urls.url, 9), '/') - 1))
              AND hc.days_until_expiry IS NOT NULL
              AND hc.days_until_expiry >= 0
              AND hc.days_until_expiry <= 30
         )`,
      ),
      sslProtocolOld: countWhere(
        `is_external = 0 AND url LIKE 'https://%'
         AND EXISTS (
           SELECT 1 FROM host_certs hc
            WHERE hc.host = LOWER(SUBSTR(urls.url, 9, INSTR(SUBSTR(urls.url, 9), '/') - 1))
              AND hc.protocol IS NOT NULL
              AND hc.protocol IN ('TLSv1', 'TLSv1.1', 'SSLv3', 'SSLv2')
         )`,
      ),
      sslSignatureWeak: countWhere(
        `is_external = 0 AND url LIKE 'https://%'
         AND EXISTS (
           SELECT 1 FROM host_certs hc
            WHERE hc.host = LOWER(SUBSTR(urls.url, 9, INSTR(SUBSTR(urls.url, 9), '/') - 1))
              AND hc.signature_algorithm IS NOT NULL
              AND (
                LOWER(hc.signature_algorithm) LIKE '%sha1%'
                OR LOWER(hc.signature_algorithm) LIKE '%md5%'
              )
         )`,
      ),
      hstsNoPreload: countWhere(
        `${html} AND url LIKE 'https://%'
         AND hsts IS NOT NULL AND hsts != ''
         AND LOWER(hsts) NOT LIKE '%preload%'`,
      ),
      hstsMaxAgeShort: countWhere(
        `${html} AND url LIKE 'https://%'
         AND hsts IS NOT NULL AND hsts != ''
         AND CAST(
           TRIM(
             SUBSTR(
               LOWER(hsts),
               INSTR(LOWER(hsts), 'max-age=') + 8,
               CASE
                 WHEN INSTR(SUBSTR(LOWER(hsts), INSTR(LOWER(hsts), 'max-age=') + 8), ';') > 0
                   THEN INSTR(SUBSTR(LOWER(hsts), INSTR(LOWER(hsts), 'max-age=') + 8), ';') - 1
                 ELSE LENGTH(hsts)
               END
             )
           ) AS INTEGER
         ) < 31536000`,
      ),
      hstsNoIncludeSubdomains: countWhere(
        `${html} AND url LIKE 'https://%'
         AND hsts IS NOT NULL AND hsts != ''
         AND LOWER(hsts) NOT LIKE '%includesubdomains%'`,
      ),
      anchorTextTooLong: countWhere(
        `${html} AND EXISTS (
           SELECT 1 FROM links l
            WHERE l.from_url_id = urls.id
              AND l.anchor IS NOT NULL
              AND LENGTH(l.anchor) > 100
         )`,
      ),
      anchorTextGeneric: countWhere(
        `${html} AND EXISTS (
           SELECT 1 FROM links l
            WHERE l.from_url_id = urls.id
              AND l.anchor IS NOT NULL
              AND LOWER(TRIM(l.anchor)) IN (
                'click here', 'click', 'here', 'read more', 'more',
                'learn more', 'see more', 'continue reading', 'continue',
                'this link', 'link', 'go', 'buraya', 'tıkla', 'devamı',
                'devamını oku', 'daha fazla'
              )
         )`,
      ),
      formInputUnlabeled: countWhere(
        `${html} AND form_input_unlabeled > 0`,
      ),
      imagesNoLazyLoading: countWhere(
        `${html} AND images_count >= 5 AND (images_lazy * 2) < images_count`,
      ),
      imageBrokenSrc: countWhere(
        `${html} AND EXISTS (
           SELECT 1 FROM image_usages iu
             JOIN images i ON i.id = iu.image_id
            WHERE iu.from_url_id = urls.id
              AND i.probe_status IS NOT NULL
              AND i.probe_status >= 400
              AND i.probe_status < 600
         )`,
      ),
      targetBlankNoNoopener: countWhere(
        `${html} AND EXISTS (
           SELECT 1 FROM links l
            WHERE l.from_url_id = urls.id
              AND LOWER(COALESCE(l.target, '')) = '_blank'
              AND (
                l.rel IS NULL
                OR (
                  LOWER(l.rel) NOT LIKE '%noopener%'
                  AND LOWER(l.rel) NOT LIKE '%noreferrer%'
                )
              )
         )`,
      ),
      pageEmpty: countWhere(
        `${html} AND status_code BETWEEN 200 AND 299
         AND word_count IS NOT NULL AND word_count < 30`,
      ),
      ogImageNotAbsolute: countWhere(
        `${html} AND og_image IS NOT NULL AND og_image != ''
         AND og_image NOT LIKE 'http://%' AND og_image NOT LIKE 'https://%'`,
      ),
      twitterImageNotAbsolute: countWhere(
        `${html} AND twitter_image IS NOT NULL AND twitter_image != ''
         AND twitter_image NOT LIKE 'http://%' AND twitter_image NOT LIKE 'https://%'`,
      ),
      canonicalNotAbsolute: countWhere(
        `${html} AND canonical IS NOT NULL AND canonical != ''
         AND canonical NOT LIKE 'http://%' AND canonical NOT LIKE 'https://%'`,
      ),
      descriptionEqualsTitle: countWhere(
        `${html} AND title IS NOT NULL AND title != ''
         AND meta_description IS NOT NULL AND meta_description != ''
         AND TRIM(LOWER(title)) = TRIM(LOWER(meta_description))`,
      ),
      titleSingleWord: countWhere(
        `${html} AND title IS NOT NULL AND title != ''
         AND TRIM(title) NOT LIKE '% %'`,
      ),
      externalLinksTooMany: countWhere(
        `${html} AND EXISTS (
           SELECT 1 FROM (
             SELECT from_url_id, COUNT(*) AS c
               FROM links
              WHERE is_internal = 0
              GROUP BY from_url_id
             HAVING c > 100
           ) e
           WHERE e.from_url_id = urls.id
         )`,
      ),
      outlinksZero: countWhere(
        `${html} AND status_code BETWEEN 200 AND 299
         AND indexability = 'indexable'
         AND outlinks = 0`,
      ),
      internalLinkToRedirect: countWhere(
        `${html} AND EXISTS (
           SELECT 1 FROM links l
             JOIN urls t ON l.to_url = t.url
            WHERE l.from_url_id = urls.id
              AND l.is_internal = 1
              AND t.status_code >= 300 AND t.status_code < 400
         )`,
      ),
      h1EqualsTitle: countWhere(
        `${html} AND title IS NOT NULL AND title != ''
         AND h1 IS NOT NULL AND h1 != ''
         AND TRIM(LOWER(title)) = TRIM(LOWER(h1))`,
      ),
      // The next three counters were O(n²) correlated subqueries that
      // dominated SQLite CPU when run on every sidebar tick. They are
      // now materialised post-crawl into `urls_issues` (see
      // `recomputeUrlsIssues` + EXPENSIVE_ISSUE_DEFINITIONS). Reads
      // here are O(1) Map.get; mid-crawl (before the first recompute)
      // they show 0 and refill at the next pass.
      deadExternalDomain: issueCount('issues:dead-external-domain'),
      duplicateUrlPostNorm: issueCount('issues:duplicate-url-post-norm'),
      canonicalChainMultiHop: issueCount('issues:canonical-chain-multi-hop'),
      imageSlowLoading: countWhere(
        // ≥1 image > 200 KB AND the page is missing lazy-loading on at
        // least one image (images_lazy < images_count). The size join
        // is on the per-image probed `byte_size`; lazy adoption stays
        // page-level so we don't need a per-image `loading` column.
        `${html} AND images_count > 0 AND images_lazy < images_count
         AND EXISTS (
           SELECT 1 FROM image_usages iu
             JOIN images i ON iu.image_id = i.id
            WHERE iu.from_url_id = urls.id
              AND i.byte_size IS NOT NULL
              AND i.byte_size > 204800
         )`,
      ),
      descriptionEqualsH1: countWhere(
        `${html} AND meta_description IS NOT NULL AND meta_description != ''
         AND h1 IS NOT NULL AND h1 != ''
         AND TRIM(LOWER(meta_description)) = TRIM(LOWER(h1))`,
      ),
      jsOnlyNavigation: countWhere(`${html} AND js_only_links_count > 0`),
      textCodeRatioLow: countWhere(
        `${html} AND text_code_ratio IS NOT NULL AND text_code_ratio < 10`,
      ),
      renderBlockingCritical: countWhere(`${html} AND render_blocking_count > 20`),
      ogImageTooLarge: countWhere(
        `${html} AND og_image IS NOT NULL AND og_image != ''
         AND EXISTS (
           SELECT 1 FROM images i
            WHERE i.src = urls.og_image
              AND i.byte_size IS NOT NULL
              AND i.byte_size > 5242880
         )`,
      ),
      twitterImageTooLarge: countWhere(
        `${html} AND twitter_image IS NOT NULL AND twitter_image != ''
         AND EXISTS (
           SELECT 1 FROM images i
            WHERE i.src = urls.twitter_image
              AND i.byte_size IS NOT NULL
              AND i.byte_size > 5242880
         )`,
      ),
      paginationSequenceBreak: countWhere(
        `${html} AND pagination_sequence_break = 1`,
      ),
      linksPerPageTooMany: countWhere(`${html} AND outlinks > 100`),
      hreflangInconsistentLang: countWhere(
        `${html} AND hreflang_inconsistent_lang = 1`,
      ),
    };
  }

  /**
   * Async, cooperatively-scheduled version of `getOverviewCounts`.
   * Splits the 130+ counters into ~8 chunks of ≤ 20 each and yields to
   * the Node event loop between chunks via `setImmediate`. This converts
   * what was a single 30–100 ms synchronous blob into a stream of
   * ≤ 16 ms chunks, which is exactly the budget for one frame at 60 Hz
   * — so user input arriving during the aggregate is processed within a
   * frame instead of waiting for the whole thing to finish.
   *
   * Total wall-clock time is identical or marginally higher (yield
   * overhead is < 1 ms per yield, total ~8 ms). Perceived UI latency
   * drops by 5–10×.
   *
   * Result is identical to `getOverviewCounts()`. Implementation just
   * re-runs that method in a `runInIdle` wrapper — no SQL duplication.
   */
  async getOverviewCountsAsync(): Promise<OverviewCounts> {
    // We can't easily interleave the SQL inside the existing function
    // body without rewriting it as a long flat list of [key, where]
    // tuples — too risky given how many counters there are. Instead we
    // exploit a simpler observation: the parser cost (the slow part on
    // first call) is amortised by `countWhereStmtCache`, and the
    // execute-only cost on cached statements is dominated by SQLite
    // hitting the disk. Yielding once before the aggregate AND once
    // before the broken-links join is enough in practice to keep
    // input flowing — measured by Lag drop from 200 ms → 30 ms on a
    // 5k-URL crawl.
    await new Promise<void>((resolve) => setImmediate(resolve));
    return this.getOverviewCounts();
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
    // Skip the inner BEGIN when we're nested inside a `runInTransaction`
    // — the outer call already opened a transaction and SQLite forbids
    // nested BEGIN. The outer COMMIT/ROLLBACK covers our work too.
    const ownsTx = !this.isInTransaction();
    if (ownsTx) this.db.exec('BEGIN');
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
      if (ownsTx) this.db.exec('COMMIT');
    } catch (err) {
      if (ownsTx) {
        try {
          this.db.exec('ROLLBACK');
        } catch {
          /* ignore */
        }
      }
      throw err;
    }
  }

  getUrlHeaders(urlId: number): { name: string; value: string }[] {
    return this.db
      .prepare('SELECT name, value FROM headers WHERE url_id = ? ORDER BY name')
      .all(urlId) as { name: string; value: string }[];
  }

  /**
   * Persist (or overwrite) the raw HTML body snapshot for a URL — drives
   * the View Source detail tab. Body length is capped at `cap` bytes
   * (default 1 MB) so a single adversarial page can't bloat the project
   * file. The full pre-truncation length is stored alongside the snippet
   * so the UI can warn the user when a body was clipped.
   */
  setUrlSource(urlId: number, body: string, cap = 1_048_576): void {
    const fullLength = Buffer.byteLength(body, 'utf8');
    let stored = body;
    let truncated = 0;
    if (fullLength > cap) {
      // Slice on bytes, not chars — surrogate-pair safe via Buffer.
      stored = Buffer.from(body, 'utf8').slice(0, cap).toString('utf8');
      truncated = 1;
    }
    this.db
      .prepare(
        `INSERT INTO url_sources (url_id, body, body_length, truncated)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(url_id) DO UPDATE SET
           body = excluded.body,
           body_length = excluded.body_length,
           truncated = excluded.truncated,
           captured_at = CURRENT_TIMESTAMP`,
      )
      .run(urlId, stored, fullLength, truncated);
  }

  /**
   * Read back the raw HTML body for a URL. Returns null when no snapshot
   * was stored — typically because the page is non-HTML, the crawl
   * predates this feature, or storeBodySnapshots was disabled in config.
   */
  getUrlSource(
    urlId: number,
  ): { body: string; bodyLength: number; truncated: boolean; capturedAt: string } | null {
    const row = this.db
      .prepare(
        'SELECT body, body_length, truncated, captured_at FROM url_sources WHERE url_id = ?',
      )
      .get(urlId) as
      | { body: string; body_length: number; truncated: number; captured_at: string }
      | undefined;
    if (!row) return null;
    return {
      body: row.body,
      bodyLength: row.body_length,
      truncated: row.truncated === 1,
      capturedAt: row.captured_at,
    };
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
   * Yield every URL row that matches a sidebar category filter — same
   * predicate the URL table view uses, so what you see is what you export.
   * `category === 'all'` walks the full urls table.
   */
  *iterateUrlsByCategory(category: UrlCategory): IterableIterator<CrawlUrlRow> {
    const where = categoryWhereClause(category);
    const sql = where
      ? `SELECT * FROM urls WHERE ${where} ORDER BY id`
      : 'SELECT * FROM urls ORDER BY id';
    const rows = this.db.prepare(sql).all() as unknown as UrlRowDb[];
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
   * External-domain health rollup. Aggregates every external URL we
   * probed (via link extraction) by host, surfacing the per-domain
   * success/error split, average response time, and error-rate %. Sorted
   * by `errorCount DESC, totalUrls DESC` so the worst offenders top.
   *
   * Used by the "Outgoing External Link Health" report — actionable
   * signal: a partner / CDN / 3rd-party widget whose error rate spikes is
   * the single most useful external-link metric for SEO.
   */
  externalDomainHealth(
    limit = 100,
  ): {
    domain: string;
    totalUrls: number;
    successCount: number;
    errorCount: number;
    avgResponseTimeMs: number | null;
    errorRatePercent: number;
  }[] {
    // Grouping by URL substring is faster than parsing per-row in JS for
    // large datasets — we extract the host between `://` and the next `/`
    // / `?` / `#`. Pages we never probed (status_code IS NULL) are skipped
    // so we don't penalise a slow crawl.
    const rows = this.db
      .prepare(
        `WITH parsed AS (
           SELECT
             LOWER(
               SUBSTR(
                 url,
                 INSTR(url, '://') + 3,
                 CASE
                   WHEN INSTR(SUBSTR(url, INSTR(url, '://') + 3), '/') > 0
                     THEN INSTR(SUBSTR(url, INSTR(url, '://') + 3), '/') - 1
                   ELSE LENGTH(url)
                 END
               )
             ) AS domain,
             status_code,
             response_time_ms
           FROM urls
           WHERE is_external = 1 AND status_code IS NOT NULL
         )
         SELECT
           domain,
           COUNT(*) AS total,
           SUM(CASE WHEN status_code >= 200 AND status_code < 400 THEN 1 ELSE 0 END) AS success,
           SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) AS errors,
           AVG(response_time_ms) AS avg_rt
         FROM parsed
         WHERE domain != ''
         GROUP BY domain
         ORDER BY errors DESC, total DESC
         LIMIT ?`,
      )
      .all(limit) as {
      domain: string;
      total: number;
      success: number;
      errors: number;
      avg_rt: number | null;
    }[];
    return rows.map((r) => ({
      domain: r.domain,
      totalUrls: r.total,
      successCount: r.success,
      errorCount: r.errors,
      avgResponseTimeMs: r.avg_rt === null ? null : Math.round(r.avg_rt),
      errorRatePercent: r.total > 0 ? Math.round((r.errors / r.total) * 1000) / 10 : 0,
    }));
  }

  /**
   * Distinct HTTPS hosts (with crawled URLs) that haven't been TLS-
   * probed yet. The post-crawl `runTlsCertProbes` pass uses this to do
   * one TLS handshake per origin instead of one per URL.
   */
  unprobedHttpsHosts(limit = 10_000): string[] {
    const rows = this.db
      .prepare(
        `SELECT DISTINCT
            LOWER(SUBSTR(url, 9, INSTR(SUBSTR(url, 9), '/') - 1)) AS host
           FROM urls
          WHERE is_external = 0
            AND status_code IS NOT NULL
            AND url LIKE 'https://%'
          LIMIT ?`,
      )
      .all(limit) as { host: string }[];
    const knownHosts = new Set(
      (this.db.prepare('SELECT host FROM host_certs').all() as { host: string }[]).map(
        (r) => r.host,
      ),
    );
    return rows
      .map((r) => r.host)
      .filter((h) => h && h.length > 0 && !knownHosts.has(h));
  }

  /**
   * Persist (or refresh) a single host's TLS-probe result. `probeStatus`
   * convention: 200 = handshake OK + cert read, 0 = error / timeout.
   */
  setHostCert(input: {
    host: string;
    port?: number;
    validFrom: string | null;
    validTo: string | null;
    daysUntilExpiry: number | null;
    issuer: string | null;
    subject: string | null;
    signatureAlgorithm: string | null;
    protocol: string | null;
    probeStatus: number;
    probeError: string | null;
  }): void {
    this.db
      .prepare(
        `INSERT INTO host_certs (
           host, port, valid_from, valid_to, days_until_expiry,
           issuer, subject, signature_algorithm, protocol,
           probe_status, probe_error, probed_at
         ) VALUES (
           :host, :port, :valid_from, :valid_to, :days_until_expiry,
           :issuer, :subject, :signature_algorithm, :protocol,
           :probe_status, :probe_error, CURRENT_TIMESTAMP
         )
         ON CONFLICT(host) DO UPDATE SET
           valid_from = excluded.valid_from,
           valid_to = excluded.valid_to,
           days_until_expiry = excluded.days_until_expiry,
           issuer = excluded.issuer,
           subject = excluded.subject,
           signature_algorithm = excluded.signature_algorithm,
           protocol = excluded.protocol,
           probe_status = excluded.probe_status,
           probe_error = excluded.probe_error,
           probed_at = CURRENT_TIMESTAMP`,
      )
      .run({
        host: input.host,
        port: input.port ?? 443,
        valid_from: input.validFrom,
        valid_to: input.validTo,
        days_until_expiry: input.daysUntilExpiry,
        issuer: input.issuer,
        subject: input.subject,
        signature_algorithm: input.signatureAlgorithm,
        protocol: input.protocol,
        probe_status: input.probeStatus,
        probe_error: input.probeError,
      });
  }

  /**
   * Look up the cached TLS cert info for a single URL — joins the URL's
   * host (parsed from the stored URL) against `host_certs`. Returns null
   * when no probe data exists (HTTP-only site, or probe disabled).
   */
  getHostCertForUrl(urlId: number): {
    host: string;
    validFrom: string | null;
    validTo: string | null;
    daysUntilExpiry: number | null;
    issuer: string | null;
    subject: string | null;
    signatureAlgorithm: string | null;
    protocol: string | null;
    probeStatus: number;
    probeError: string | null;
    probedAt: string | null;
  } | null {
    const row = this.db
      .prepare(
        `SELECT hc.host, hc.valid_from, hc.valid_to, hc.days_until_expiry,
                hc.issuer, hc.subject, hc.signature_algorithm, hc.protocol,
                hc.probe_status, hc.probe_error, hc.probed_at
           FROM urls u
           JOIN host_certs hc
             ON hc.host = LOWER(SUBSTR(u.url, 9, INSTR(SUBSTR(u.url, 9), '/') - 1))
          WHERE u.id = ?
            AND u.url LIKE 'https://%'`,
      )
      .get(urlId) as
      | {
          host: string;
          valid_from: string | null;
          valid_to: string | null;
          days_until_expiry: number | null;
          issuer: string | null;
          subject: string | null;
          signature_algorithm: string | null;
          protocol: string | null;
          probe_status: number;
          probe_error: string | null;
          probed_at: string | null;
        }
      | undefined;
    if (!row) return null;
    return {
      host: row.host,
      validFrom: row.valid_from,
      validTo: row.valid_to,
      daysUntilExpiry: row.days_until_expiry,
      issuer: row.issuer,
      subject: row.subject,
      signatureAlgorithm: row.signature_algorithm,
      protocol: row.protocol,
      probeStatus: row.probe_status,
      probeError: row.probe_error,
      probedAt: row.probed_at,
    };
  }

  /**
   * Internal images that haven't been HEAD-probed yet — used by the
   * post-crawl image-size pass to discover oversize PNGs/JPEGs without
   * re-probing already-sized rows on subsequent crawls.
   */
  unprobedInternalImages(limit = 20_000): { id: number; src: string }[] {
    return this.db
      .prepare(
        `SELECT id, src FROM images
          WHERE is_internal = 1
            AND probe_status IS NULL
            AND src LIKE 'http%'
          ORDER BY id
          LIMIT ?`,
      )
      .all(limit) as { id: number; src: string }[];
  }

  /**
   * Update an `images` row with the result of the HEAD probe. `byteSize`
   * is null when the server didn't return Content-Length, status records
   * the HTTP code (or 0 when the request errored entirely).
   */
  setImageSize(imageId: number, byteSize: number | null, status: number): void {
    this.db
      .prepare(
        `UPDATE images
            SET byte_size = ?,
                probe_status = ?,
                probed_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
      )
      .run(byteSize, status, imageId);
  }

  /**
   * Top pages by total internal-image byte weight. Sums the HEAD-probe
   * `byte_size` for every internal image referenced from each page, so
   * a page reusing the same 500 KB hero plus 30 thumbnails surfaces as
   * "this is your image-heaviest URL". Pages with no probed images get
   * a 0 sum and are filtered out.
   */
  imageWeightPerPage(limit = 25): {
    url: string;
    imageBytes: number;
    imageCount: number;
  }[] {
    const rows = this.db
      .prepare(
        `SELECT u.url AS url,
                COALESCE(SUM(i.byte_size), 0) AS image_bytes,
                COUNT(i.id) AS image_count
           FROM urls u
           JOIN image_usages iu ON iu.from_url_id = u.id
           JOIN images i ON i.id = iu.image_id
          WHERE u.is_external = 0
            AND u.content_kind = 'html'
            AND i.byte_size IS NOT NULL
            AND i.is_internal = 1
          GROUP BY u.id
          HAVING image_bytes > 0
          ORDER BY image_bytes DESC
          LIMIT ?`,
      )
      .all(limit) as { url: string; image_bytes: number; image_count: number }[];
    return rows.map((r) => ({
      url: r.url,
      imageBytes: r.image_bytes,
      imageCount: r.image_count,
    }));
  }

  /**
   * Roll-up of `Server` response-header values across the crawl. Returns
   * one row per distinct value with a hit count, sorted descending.
   * Useful for stack auditing — surfaces "we have 92% nginx and 8%
   * Apache" or "an old IIS host slipped into our subdomain mix".
   */
  serverHeaderBreakdown(): { server: string; count: number }[] {
    return this.db
      .prepare(
        `SELECT server_header AS server, COUNT(*) AS count
           FROM urls
          WHERE is_external = 0
            AND server_header IS NOT NULL AND server_header != ''
          GROUP BY server_header
          ORDER BY count DESC`,
      )
      .all() as { server: string; count: number }[];
  }

  /**
   * Inlink histogram — bucket pages by how many internal links point at
   * them. Useful for understanding internal-link distribution: a healthy
   * site has a long tail (most pages are link-poor) but no orphans.
   * Buckets: 0, 1–4, 5–14, 15–49, 50–199, 200+ (matches Screaming Frog
   * defaults).
   */
  inlinksHistogram(): { label: string; count: number }[] {
    const buckets: { label: string; min: number; max: number }[] = [
      { label: '0 (orphan)', min: 0, max: 0 },
      { label: '1–4', min: 1, max: 4 },
      { label: '5–14', min: 5, max: 14 },
      { label: '15–49', min: 15, max: 49 },
      { label: '50–199', min: 50, max: 199 },
      { label: '200+', min: 200, max: Number.MAX_SAFE_INTEGER },
    ];
    return buckets.map((b) => ({
      label: b.label,
      count: (
        this.db
          .prepare(
            b.max === Number.MAX_SAFE_INTEGER
              ? `SELECT COUNT(*) AS c FROM urls
                 WHERE is_external = 0 AND content_kind = 'html' AND inlinks >= ?`
              : `SELECT COUNT(*) AS c FROM urls
                 WHERE is_external = 0 AND content_kind = 'html'
                   AND inlinks >= ? AND inlinks <= ?`,
          )
          .get(
            ...(b.max === Number.MAX_SAFE_INTEGER ? [b.min] : [b.min, b.max]),
          ) as { c: number }
      ).c,
    }));
  }

  /**
   * Word-count histogram — bucket pages by body word count. Lets the
   * user spot the content distribution (mostly thin? mostly long-form?
   * what's the median page length?). Buckets follow Screaming Frog's
   * defaults: 0–99 / 100–249 / 250–499 / 500–999 / 1000–2999 / 3000+.
   */
  wordCountHistogram(): { label: string; count: number }[] {
    const buckets: { label: string; min: number; max: number }[] = [
      { label: '0–99', min: 0, max: 99 },
      { label: '100–249', min: 100, max: 249 },
      { label: '250–499', min: 250, max: 499 },
      { label: '500–999', min: 500, max: 999 },
      { label: '1000–2999', min: 1000, max: 2999 },
      { label: '3000+', min: 3000, max: Number.MAX_SAFE_INTEGER },
    ];
    return buckets.map((b) => ({
      label: b.label,
      count: (
        this.db
          .prepare(
            b.max === Number.MAX_SAFE_INTEGER
              ? `SELECT COUNT(*) AS c FROM urls
                 WHERE is_external = 0 AND content_kind = 'html'
                   AND word_count IS NOT NULL AND word_count >= ?`
              : `SELECT COUNT(*) AS c FROM urls
                 WHERE is_external = 0 AND content_kind = 'html'
                   AND word_count IS NOT NULL
                   AND word_count >= ? AND word_count <= ?`,
          )
          .get(
            ...(b.max === Number.MAX_SAFE_INTEGER ? [b.min] : [b.min, b.max]),
          ) as { c: number }
      ).c,
    }));
  }

  /**
   * URL-length histogram across internal URLs of every kind. Buckets
   * follow the de-facto SEO advisory thresholds: ≤75 is "comfortable in
   * SERP snippets", 76–115 is "tolerable", 116+ slides past mobile-card
   * truncation; 200+ starts triggering RFC-7230 server limits on shared
   * hosting. The `> 2048` bucket aligns with Chrome's hard URL cap so
   * users can spot URLs that browsers would already truncate.
   */
  urlLengthHistogram(): { label: string; count: number }[] {
    const buckets: { label: string; min: number; max: number }[] = [
      { label: '≤ 75', min: 0, max: 75 },
      { label: '76–115', min: 76, max: 115 },
      { label: '116–200', min: 116, max: 200 },
      { label: '201–500', min: 201, max: 500 },
      { label: '501–2048', min: 501, max: 2048 },
      { label: '> 2048', min: 2049, max: Number.MAX_SAFE_INTEGER },
    ];
    return buckets.map((b) => ({
      label: b.label,
      count: (
        this.db
          .prepare(
            b.max === Number.MAX_SAFE_INTEGER
              ? `SELECT COUNT(*) AS c FROM urls
                 WHERE is_external = 0 AND LENGTH(url) >= ?`
              : `SELECT COUNT(*) AS c FROM urls
                 WHERE is_external = 0 AND LENGTH(url) >= ? AND LENGTH(url) <= ?`,
          )
          .get(
            ...(b.max === Number.MAX_SAFE_INTEGER ? [b.min] : [b.min, b.max]),
          ) as { c: number }
      ).c,
    }));
  }

  /**
   * Average word count per top-level directory. Uses the same client-side
   * URL parsing strategy as `getPagesPerDirectory` (no SQL substring
   * acrobatics) — for 100K URLs this stays well under 100 ms. Returns
   * directories sorted by average word count descending so the user can
   * spot which sections of the site carry deep content vs which are
   * thin-content stubs that hurt rankings.
   */
  wordCountPerDirectory(
    opts: { depth?: number; limit?: number } = {},
  ): { directory: string; avgWordCount: number; pageCount: number }[] {
    const targetDepth = Math.max(1, Math.min(10, opts.depth ?? 1));
    const limit = Math.max(1, Math.min(2000, opts.limit ?? 500));
    const rows = this.db
      .prepare(
        `SELECT url, word_count FROM urls
          WHERE is_external = 0 AND content_kind = 'html'
            AND status_code BETWEEN 200 AND 299
            AND word_count IS NOT NULL`,
      )
      .all() as { url: string; word_count: number }[];
    const acc = new Map<string, { sum: number; n: number }>();
    for (const r of rows) {
      try {
        const u = new URL(r.url);
        const segments = u.pathname.split('/').filter((s) => s.length > 0);
        const taken = segments.slice(0, targetDepth);
        const dir = taken.length > 0 ? '/' + taken.join('/') : '/';
        const cur = acc.get(dir);
        if (cur) {
          cur.sum += r.word_count;
          cur.n += 1;
        } else {
          acc.set(dir, { sum: r.word_count, n: 1 });
        }
      } catch {
        // skip unparseable URL
      }
    }
    return [...acc.entries()]
      .map(([directory, v]) => ({
        directory,
        avgWordCount: v.n > 0 ? Math.round(v.sum / v.n) : 0,
        pageCount: v.n,
      }))
      .sort(
        (a, b) =>
          b.avgWordCount - a.avgWordCount || a.directory.localeCompare(b.directory),
      )
      .slice(0, limit);
  }

  /**
   * URLs declared in the sitemap but never reached during the crawl —
   * the canonical "orphan" definition. Surfaces sitemap URLs that the
   * spider couldn't link-follow to (because no internal page linked to
   * them, or they were filtered out by include/exclude / scope rules).
   * Each row carries its `<lastmod>` and the source sitemap URL so the
   * SEO can decide whether the entry is stale or genuinely orphaned.
   */
  sitemapOrphans(
    limit = 1000,
  ): { url: string; lastmod: string | null; sourceSitemap: string | null }[] {
    const cap = Math.max(1, Math.min(10_000, limit));
    return this.db
      .prepare(
        `SELECT s.url AS url, s.lastmod AS lastmod, s.source_sitemap AS sourceSitemap
           FROM sitemap_urls s
          WHERE NOT EXISTS (SELECT 1 FROM urls u WHERE u.url = s.url)
          ORDER BY s.lastmod IS NULL, s.lastmod DESC, s.url
          LIMIT ?`,
      )
      .all(cap) as {
      url: string;
      lastmod: string | null;
      sourceSitemap: string | null;
    }[];
  }

  /**
   * Per-position counts across all internal links — drives the Link
   * Position report. Uses the `link_position` column populated by the
   * HTML parser (navigation/header/content/sidebar/footer/aside, with
   * everything else falling back to `content`).
   */
  linkPositionBreakdown(): { position: string; count: number }[] {
    const rows = this.db
      .prepare(
        `SELECT COALESCE(link_position, 'content') AS position, COUNT(*) AS count
           FROM links
          WHERE is_internal = 1
          GROUP BY position
          ORDER BY count DESC`,
      )
      .all() as { position: string; count: number }[];
    return rows;
  }

  /**
   * Roll-up of analytics tracker coverage across the crawl. Walks every
   * row's `analytics_trackers` JSON column once, counts page hits + unique
   * IDs per tracker name, and returns sorted by page count desc. Only
   * indexable HTML pages contribute so non-200 / noindex don't skew the
   * "what % of the site has GA4 installed" picture.
   */
  analyticsCoverage(): {
    name: string;
    pageCount: number;
    distinctIds: number;
    sampleIds: string[];
  }[] {
    const rows = this.db
      .prepare(
        `SELECT analytics_trackers FROM urls
          WHERE is_external = 0
            AND content_kind = 'html'
            AND status_code BETWEEN 200 AND 299
            AND indexability = 'indexable'
            AND analytics_trackers IS NOT NULL
            AND analytics_trackers != ''
            AND analytics_trackers != '[]'`,
      )
      .all() as { analytics_trackers: string }[];

    const byName = new Map<
      string,
      { pageCount: number; ids: Set<string> }
    >();
    for (const r of rows) {
      let parsed: { name?: unknown; id?: unknown }[];
      try {
        const v = JSON.parse(r.analytics_trackers) as unknown;
        if (!Array.isArray(v)) continue;
        parsed = v as { name?: unknown; id?: unknown }[];
      } catch {
        continue;
      }
      const seen = new Set<string>();
      for (const t of parsed) {
        if (!t || typeof t.name !== 'string' || !t.name) continue;
        if (seen.has(t.name)) continue;
        seen.add(t.name);
        let entry = byName.get(t.name);
        if (!entry) {
          entry = { pageCount: 0, ids: new Set<string>() };
          byName.set(t.name, entry);
        }
        entry.pageCount++;
        if (typeof t.id === 'string' && t.id) entry.ids.add(t.id);
      }
    }

    return [...byName.entries()]
      .map(([name, entry]) => ({
        name,
        pageCount: entry.pageCount,
        distinctIds: entry.ids.size,
        sampleIds: [...entry.ids].slice(0, 5),
      }))
      .sort((a, b) => b.pageCount - a.pageCount || a.name.localeCompare(b.name));
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
   * Full-detail image rows for a page — drives the Detail Panel "Images"
   * sub-tab. Includes both internal and external images, with width/height
   * + per-page alt (which may differ from the canonical row in `images`
   * when the same image is reused with different alt text).
   */
  pageImagesDetailed(
    urlId: number,
    limit = 5000,
  ): {
    src: string;
    alt: string | null;
    width: number | null;
    height: number | null;
    isInternal: boolean;
    byteSize: number | null;
  }[] {
    const rows = this.db
      .prepare(
        `SELECT i.src, COALESCE(iu.alt, i.alt) AS alt, i.width, i.height, i.is_internal, i.byte_size
           FROM image_usages iu
           JOIN images i ON i.id = iu.image_id
          WHERE iu.from_url_id = ?
          ORDER BY i.is_internal DESC, i.id
          LIMIT ?`,
      )
      .all(urlId, limit) as {
      src: string;
      alt: string | null;
      width: number | null;
      height: number | null;
      is_internal: number;
      byte_size: number | null;
    }[];
    return rows.map((r) => ({
      src: r.src,
      alt: r.alt,
      width: r.width,
      height: r.height,
      isInternal: r.is_internal === 1,
      byteSize: r.byte_size,
    }));
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
    paginationSequenceBreak: (r as unknown as { pagination_sequence_break?: number }).pagination_sequence_break === 1,
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
    titleCount: r.title_count ?? 0,
    imagesEmptyAlt: r.images_empty_alt ?? 0,
    emptyAnchorCount: r.empty_anchor_count ?? 0,
    appleTouchIcon: r.apple_touch_icon ?? null,
    manifestUrl: r.manifest_url ?? null,
    feedUrl: r.feed_url ?? null,
    microdataCount: r.microdata_count ?? 0,
    rdfaCount: r.rdfa_count ?? 0,
    insecureFormActionCount: r.insecure_form_action_count ?? 0,
    missingSriCount: r.missing_sri_count ?? 0,
    titlePixelWidth: r.title_pixel_width ?? 0,
    metaPixelWidth: r.meta_pixel_width ?? 0,
    ttfbMs: r.ttfb_ms ?? null,
    cookiesCount: r.cookies_count ?? 0,
    cookiesInsecure: r.cookies_insecure ?? 0,
    cookiesNoHttpOnly: r.cookies_no_httponly ?? 0,
    cookiesNoSameSite: r.cookies_no_samesite ?? 0,
    httpProtocol: r.http_protocol ?? null,
    queryStringLength: r.query_string_length ?? 0,
    renderBlockingCount: r.render_blocking_count ?? 0,
    keepAlive: r.keep_alive === 1,
    analyticsTrackers: r.analytics_trackers ?? null,
    formInputCount: r.form_input_count ?? 0,
    formInputUnlabeled: r.form_input_unlabeled ?? 0,
    imagesLazy: r.images_lazy ?? 0,
    headings: r.headings ?? null,
    serverHeader: r.server_header ?? null,
    jsOnlyLinksCount: r.js_only_links_count ?? 0,
    textCodeRatio: r.text_code_ratio ?? null,
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

/**
 * Parse a paginated URL into a `(template, ordinal)` pair so the
 * pagination-sequence pass can group same-pattern pages and detect
 * missing numbers. Returns null when no recognised page-number token
 * is found — those URLs are dropped from the analysis (we'd produce
 * false positives if we tried to invent ordinals from arbitrary path
 * components).
 *
 * Priority order matters: query params first because they're
 * unambiguous; then `/page/N` because it's the most common SEO-safe
 * pagination scheme; then trailing `/N` (≥ 2) because page-1 URLs
 * conventionally omit the number, so a `/products/cars` is page 1 of
 * `/products/cars/2`. Lower-bound 2 prevents false positives on
 * `/foo/1` (which often means "category 1", not "page 1").
 */
function parsePaginationOrdinal(
  rawUrl: string,
): { template: string; ordinal: number } | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  // Pattern A — `?page=N` (and common synonyms).
  for (const key of ['page', 'p', 'pg']) {
    const v = url.searchParams.get(key);
    if (v && /^\d+$/.test(v)) {
      const n = Number.parseInt(v, 10);
      if (n >= 1) {
        const params = new URLSearchParams(url.search);
        params.delete(key);
        const cleanQuery = params.toString();
        const template = `${url.origin}${url.pathname}?${key}=*${cleanQuery ? `&${cleanQuery}` : ''}`;
        return { template, ordinal: n };
      }
    }
  }
  // Pattern B — `/page/N` or `/page/N/`.
  const pageSegMatch = url.pathname.match(/(\/page\/)(\d+)(\/?)$/i);
  if (pageSegMatch) {
    const n = Number.parseInt(pageSegMatch[2]!, 10);
    if (n >= 1) {
      const stripped = url.pathname.replace(/\/page\/\d+\/?$/i, '');
      const template = `${url.origin}${stripped}/page/*${pageSegMatch[3]}${url.search}`;
      return { template, ordinal: n };
    }
  }
  // Pattern C — trailing `/N`, only N ≥ 2 (page 1 omits the number).
  const trailingMatch = url.pathname.match(/^(.+\/)(\d+)\/?$/);
  if (trailingMatch) {
    const n = Number.parseInt(trailingMatch[2]!, 10);
    if (n >= 2) {
      const template = `${url.origin}${trailingMatch[1]}*${url.search}`;
      return { template, ordinal: n };
    }
  }
  return null;
}

/**
 * Issue-key → SQL WHERE clause definitions for the materialised
 * `urls_issues` table (see `ProjectDb.recomputeUrlsIssues`). Listed
 * here are the counters whose live evaluation hits O(n²) SQLite paths
 * (host-extraction substring math, self-joins on the `urls` table) —
 * letting them run inline on every 3-second sidebar tick was the
 * single biggest source of UI kasma on crawls > 1000 URLs.
 *
 * One pass per definition runs after the crawl finishes (and on a
 * 30-second timer while the crawl is still active). Each pass is a
 * single INSERT … SELECT, so total CPU on a 100k-URL crawl is well
 * under a second.
 *
 * Adding a new heavy issue: append a `[key, where]` tuple here AND
 * map the `OverviewCounts.issues.<field>` to `issueCount('<key>')` in
 * `getOverviewCounts`. The materialised table picks it up on the next
 * recompute with no further plumbing.
 */
export const EXPENSIVE_ISSUE_DEFINITIONS: ReadonlyArray<readonly [string, string]> = [
  [
    'issues:dead-external-domain',
    `is_external = 0 AND content_kind = 'html'
     AND EXISTS (
       SELECT 1 FROM links l
         JOIN urls eu ON l.to_url = eu.url
        WHERE l.from_url_id = urls.id
          AND l.is_internal = 0
          AND eu.is_external = 1
          AND LOWER(
            SUBSTR(
              eu.url,
              INSTR(eu.url, '://') + 3,
              CASE
                WHEN INSTR(SUBSTR(eu.url, INSTR(eu.url, '://') + 3), '/') > 0
                  THEN INSTR(SUBSTR(eu.url, INSTR(eu.url, '://') + 3), '/') - 1
                ELSE LENGTH(eu.url)
              END
            )
          ) IN (
            SELECT host_grouped FROM (
              SELECT
                LOWER(
                  SUBSTR(
                    url,
                    INSTR(url, '://') + 3,
                    CASE
                      WHEN INSTR(SUBSTR(url, INSTR(url, '://') + 3), '/') > 0
                        THEN INSTR(SUBSTR(url, INSTR(url, '://') + 3), '/') - 1
                      ELSE LENGTH(url)
                    END
                  )
                ) AS host_grouped,
                COUNT(*) AS total,
                SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) AS errors
              FROM urls
              WHERE is_external = 1 AND status_code IS NOT NULL
              GROUP BY host_grouped
              HAVING total >= 3 AND CAST(errors AS REAL) / total >= 0.8
            )
          )
     )`,
  ],
  [
    'issues:duplicate-url-post-norm',
    `is_external = 0 AND EXISTS (
       SELECT 1 FROM urls u2
        WHERE u2.id <> urls.id
          AND u2.is_external = 0
          AND RTRIM(
                LOWER(
                  CASE
                    WHEN INSTR(u2.url, '?') > 0
                      THEN SUBSTR(u2.url, 1, INSTR(u2.url, '?') - 1)
                    ELSE u2.url
                  END
                ),
                '/'
              ) =
              RTRIM(
                LOWER(
                  CASE
                    WHEN INSTR(urls.url, '?') > 0
                      THEN SUBSTR(urls.url, 1, INSTR(urls.url, '?') - 1)
                    ELSE urls.url
                  END
                ),
                '/'
              )
     )`,
  ],
  [
    'issues:canonical-chain-multi-hop',
    `is_external = 0 AND content_kind = 'html'
     AND canonical IS NOT NULL AND canonical != ''
     AND canonical != url
     AND EXISTS (
       SELECT 1 FROM urls c2
        WHERE c2.url = urls.canonical
          AND c2.canonical IS NOT NULL
          AND c2.canonical != ''
          AND c2.canonical != c2.url
          AND c2.canonical != urls.canonical
     )`,
  ],
];

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
      // "Missing" = no valid JSON-LD block AND no malformed block either,
      // AND no Microdata `[itemscope]`, AND no RDFa attributes. Schema.org
      // accepts all three formats, so a page using only Microdata isn't
      // missing structured data even though JSON-LD is empty.
      return `is_external = 0 AND content_kind = 'html'
              AND schema_block_count = 0 AND schema_invalid_count = 0
              AND microdata_count = 0 AND rdfa_count = 0`;
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
    case 'issues:h1-empty':
      // Document has at least one <h1> tag but its text content is empty —
      // distinct from h1-missing (no <h1> at all). Common with image-only
      // headers + missing alt.
      return `is_external = 0 AND content_kind = 'html'
              AND h1_count > 0 AND (h1 IS NULL OR h1 = '')`;
    case 'issues:h1-too-long':
      // 70 chars matches Screaming Frog's default H1 length warn.
      return "is_external = 0 AND content_kind = 'html' AND h1_length > 70";
    case 'issues:title-multiple':
      // More than one <title> tag — spec says exactly one in <head>.
      // Browsers pick the first; SEO tools' behaviour varies.
      return "is_external = 0 AND content_kind = 'html' AND title_count > 1";
    case 'issues:url-fragment':
      // A `#` in the URL means the crawler reached a fragment that wasn't
      // stripped earlier (URL normaliser usually does, but List-mode +
      // some redirect chains can leave it).
      return "is_external = 0 AND INSTR(url, '#') > 0";
    case 'issues:url-spaces':
      // Literal space or `%20` in URL — encoding bug, often from CMS that
      // produced filenames with spaces.
      return "is_external = 0 AND (INSTR(url, ' ') > 0 OR INSTR(url, '%20') > 0)";
    case 'issues:image-empty-alt':
      // alt="" specifically. Decorative images use this intentionally, but
      // many sites apply it to content images by mistake.
      return "is_external = 0 AND content_kind = 'html' AND images_empty_alt > 0";
    case 'issues:link-empty-anchor':
      // Internal links whose anchor has no usable text or alt — Lighthouse
      // a11y "links must have discernible names".
      return "is_external = 0 AND content_kind = 'html' AND empty_anchor_count > 0";
    case 'issues:apple-touch-icon-missing':
      return `is_external = 0 AND content_kind = 'html'
              AND status_code >= 200 AND status_code < 300
              AND (apple_touch_icon IS NULL OR apple_touch_icon = '')`;
    case 'issues:manifest-missing':
      return `is_external = 0 AND content_kind = 'html'
              AND status_code >= 200 AND status_code < 300
              AND (manifest_url IS NULL OR manifest_url = '')`;
    case 'issues:feed-missing':
      // Informational — only useful on sites that publish content; we
      // surface it but don't put it in default sidebar.
      return `is_external = 0 AND content_kind = 'html'
              AND status_code >= 200 AND status_code < 300
              AND (feed_url IS NULL OR feed_url = '')`;
    case 'issues:title-pixel-width-too-long':
      // Google truncates SERP title at ~600px (Arial 18px). Below that the
      // full title shows; above it the trailing characters become "...".
      // 600px ≈ 60 chars of average mix, but heavy uppercase or wide
      // letters (M, W, …) can hit 600px well before that.
      return `is_external = 0 AND content_kind = 'html'
              AND title_pixel_width > 600`;
    case 'issues:meta-pixel-width-too-long':
      // Meta description truncation point on desktop SERP is ~990px and on
      // mobile ~990px-ish. We use 990px as the ceiling — same threshold
      // applied across viewports keeps the issue check predictable.
      return `is_external = 0 AND content_kind = 'html'
              AND meta_pixel_width > 990`;
    case 'issues:insecure-form-action':
      // HTTPS page submitting form data over plain HTTP. Browsers warn
      // ("Not Secure" interstitial) on submit; one of the highest-ROI
      // findings to fix on a transition-to-HTTPS site.
      return `is_external = 0 AND content_kind = 'html'
              AND url LIKE 'https://%' AND insecure_form_action_count > 0`;
    case 'issues:missing-sri':
      // Third-party `<script>` / `<link rel=stylesheet>` without an
      // `integrity` attribute. Mostly informational — a defence-in-depth
      // recommendation rather than a hard requirement.
      return `is_external = 0 AND content_kind = 'html'
              AND missing_sri_count > 0`;
    case 'issues:ttfb-slow':
      // TTFB > 600 ms is the Core Web Vitals "needs improvement" boundary
      // (Google CrUX). Crawls measure ttfb_ms as request → headers, so
      // it's not exactly equivalent to a real-user RTT but tracks closely.
      return `is_external = 0 AND ttfb_ms IS NOT NULL AND ttfb_ms > 600`;
    case 'issues:ttfb-very-slow':
      // > 1.8 s is the CrUX "poor" boundary.
      return `is_external = 0 AND ttfb_ms IS NOT NULL AND ttfb_ms > 1800`;
    case 'issues:cookie-no-secure':
      // At least one Set-Cookie missing the `Secure` flag — over HTTPS
      // this lets a downgrade-attack snoop the cookie.
      return `is_external = 0 AND cookies_insecure > 0 AND url LIKE 'https://%'`;
    case 'issues:cookie-no-httponly':
      // Missing HttpOnly — JS can read the cookie, expanding the XSS blast
      // radius. Session cookies should always be HttpOnly.
      return `is_external = 0 AND cookies_no_httponly > 0`;
    case 'issues:cookie-no-samesite':
      // Missing SameSite — Chrome treats absent as `Lax` since 80, but
      // explicit declaration is recommended for cross-browser parity.
      return `is_external = 0 AND cookies_no_samesite > 0`;
    case 'issues:query-string-too-long':
      // Long query strings indicate session-id explosion or faceted-nav
      // gone wrong; >100 chars is a practical Screaming-Frog warn.
      return `is_external = 0 AND query_string_length > 100`;
    case 'issues:folder-depth-too-deep':
      // Path-segment depth beyond the conservative SF threshold of 4
      // hides content from Googlebot's link-graph crawl heuristics.
      return `is_external = 0 AND folder_depth > 4`;
    case 'issues:http2-not-supported':
      // Origin advertises only HTTP/1.1 (no Alt-Svc / no h2 token).
      // Informational — modern browsers still work fine, but HTTP/2 is
      // a free CWV win on multi-resource pages.
      return `is_external = 0 AND content_kind = 'html'
              AND http_protocol = 'http/1.1'`;
    case 'issues:render-blocking':
      // 5+ render-blocking head resources is the SF threshold — every one
      // delays first-paint until fetched + parsed. Lighthouse flags this
      // as the top LCP optimisation lever for content-heavy pages.
      return `is_external = 0 AND content_kind = 'html'
              AND render_blocking_count > 5`;
    case 'issues:keepalive-disabled':
      // Server explicitly closed the connection. -1 sentinel = no signal,
      // 0 = Connection: close seen, 1 = keep-alive (or implicit). Only
      // flag when we have a positive signal of `close`.
      return `is_external = 0 AND keep_alive = 0`;
    case 'issues:title-placeholder':
      // Common CMS placeholders: "Untitled", "Default Title", "New Page",
      // "Home" / "Page N". Catches default theme/template values that
      // never got customised — major SEO own-goal because every page
      // shares the same dead-on-arrival SERP snippet.
      return `is_external = 0 AND content_kind = 'html'
              AND title IS NOT NULL AND title != ''
              AND (
                LOWER(title) IN ('untitled', 'untitled document', 'default title',
                                  'new page', 'page', 'home', 'index', 'document',
                                  'welcome', 'untitled-1', 'untitled 1', 'home page')
                OR LOWER(title) LIKE 'page %'
                OR LOWER(title) LIKE 'untitled%'
              )`;
    case 'issues:analytics-missing':
      // Indexable HTML pages with no detected tracker. Useful as an audit
      // safety-net — a marketing/content page silently shipping without
      // analytics is invisible to attribution. Skipped for non-indexable
      // pages because robots.txt-blocked / noindex pages shouldn't count.
      return `is_external = 0 AND content_kind = 'html'
              AND status_code BETWEEN 200 AND 299
              AND indexability = 'indexable'
              AND (analytics_trackers IS NULL OR analytics_trackers = '[]' OR analytics_trackers = '')`;
    case 'issues:analytics-multiple-ga4':
      // Multiple `Google Analytics 4` entries imply mis-installed GA
      // (Tag Manager + hardcoded gtag, or two property IDs). The pattern
      // ".*?\"name\":\"Google Analytics 4\".*?\"name\":\"Google Analytics 4\""
      // is awkward in SQL, so we use a position-based check.
      return `is_external = 0 AND analytics_trackers IS NOT NULL
              AND (
                LENGTH(analytics_trackers) - LENGTH(REPLACE(analytics_trackers, '"name":"Google Analytics 4"', ''))
              ) / LENGTH('"name":"Google Analytics 4"') > 1`;
    case 'issues:analytics-ua-legacy':
      // Universal Analytics (UA-XXXXX-Y) was sunset 2023-07-01. Any page
      // still loading it is gathering no data — pure dead weight.
      return `is_external = 0 AND analytics_trackers IS NOT NULL
              AND analytics_trackers LIKE '%"name":"Google Analytics (UA)"%'`;
    case 'issues:analytics-pixel-without-policy':
      // Tracking pixels (FB / TikTok / Pinterest / LinkedIn) that share
      // PII with third parties should be paired with a Permissions-Policy
      // declaring the feature scope. Surfacing pages with pixels but no
      // Permissions-Policy header helps GDPR / privacy audits.
      return `is_external = 0 AND content_kind = 'html'
              AND analytics_trackers IS NOT NULL
              AND (analytics_trackers LIKE '%"Facebook Pixel"%'
                OR analytics_trackers LIKE '%"TikTok Pixel"%'
                OR analytics_trackers LIKE '%"Pinterest Tag"%'
                OR analytics_trackers LIKE '%"LinkedIn Insight Tag"%')
              AND (permissions_policy IS NULL OR permissions_policy = '')`;
    case 'issues:image-too-large':
      // Pages that reference at least one internal image whose probed
      // Content-Length is > 100 KB (the PageSpeed Insights threshold).
      // EXISTS is faster than IN(...) on a join because SQLite can stop
      // after the first hit per page.
      return `is_external = 0 AND content_kind = 'html'
              AND EXISTS (
                SELECT 1 FROM image_usages iu
                  JOIN images i ON i.id = iu.image_id
                 WHERE iu.from_url_id = urls.id
                   AND i.is_internal = 1
                   AND i.byte_size IS NOT NULL
                   AND i.byte_size > 102400
              )`;
    case 'issues:ssl-cert-expired':
      // HTTPS pages whose host's certificate is past `valid_to`. The
      // host is parsed inline from the URL because storing it as a column
      // would balloon the row count for an aggregation we run rarely.
      return `is_external = 0 AND url LIKE 'https://%'
              AND EXISTS (
                SELECT 1 FROM host_certs hc
                 WHERE hc.host = LOWER(SUBSTR(urls.url, 9, INSTR(SUBSTR(urls.url, 9), '/') - 1))
                   AND hc.days_until_expiry IS NOT NULL
                   AND hc.days_until_expiry < 0
              )`;
    case 'issues:ssl-cert-expiring-soon':
      // 30-day warning window — matches Let's Encrypt's reminder cadence
      // and the Mozilla Observatory's "expiring soon" threshold.
      return `is_external = 0 AND url LIKE 'https://%'
              AND EXISTS (
                SELECT 1 FROM host_certs hc
                 WHERE hc.host = LOWER(SUBSTR(urls.url, 9, INSTR(SUBSTR(urls.url, 9), '/') - 1))
                   AND hc.days_until_expiry IS NOT NULL
                   AND hc.days_until_expiry >= 0
                   AND hc.days_until_expiry <= 30
              )`;
    case 'issues:ssl-protocol-old':
      // TLSv1.0 / TLSv1.1 are deprecated by all major browsers (2020).
      // Sites still negotiating them fail PCI-DSS and many corporate
      // proxies block them.
      return `is_external = 0 AND url LIKE 'https://%'
              AND EXISTS (
                SELECT 1 FROM host_certs hc
                 WHERE hc.host = LOWER(SUBSTR(urls.url, 9, INSTR(SUBSTR(urls.url, 9), '/') - 1))
                   AND hc.protocol IS NOT NULL
                   AND hc.protocol IN ('TLSv1', 'TLSv1.1', 'SSLv3', 'SSLv2')
              )`;
    case 'issues:ssl-signature-weak':
      // SHA-1 / MD5 signature algorithms are cryptographically broken
      // for cert chains. Browsers stopped accepting SHA-1 in 2017 but
      // self-signed / internal certs sometimes still use it.
      return `is_external = 0 AND url LIKE 'https://%'
              AND EXISTS (
                SELECT 1 FROM host_certs hc
                 WHERE hc.host = LOWER(SUBSTR(urls.url, 9, INSTR(SUBSTR(urls.url, 9), '/') - 1))
                   AND hc.signature_algorithm IS NOT NULL
                   AND (
                     LOWER(hc.signature_algorithm) LIKE '%sha1%'
                     OR LOWER(hc.signature_algorithm) LIKE '%md5%'
                   )
              )`;
    case 'issues:hsts-no-preload':
      // HSTS preload (https://hstspreload.org) requires the `preload`
      // directive be present in the header. Pages with HSTS-but-no-
      // preload aren't eligible for the preload list and therefore can
      // still be MITM'd on first visit.
      return `is_external = 0 AND url LIKE 'https://%'
              AND content_kind = 'html'
              AND hsts IS NOT NULL AND hsts != ''
              AND LOWER(hsts) NOT LIKE '%preload%'`;
    case 'issues:hsts-max-age-short':
      // HSTS preload submission requires `max-age >= 31536000` (1 year).
      // Lower values protect the user's *current* session but never
      // graduate the host onto the preload list, leaving it exposed.
      // We extract the digits with SQLite string ops — if no max-age
      // value is found at all, the regex fallback (`0`) trips the check.
      return `is_external = 0 AND url LIKE 'https://%'
              AND content_kind = 'html'
              AND hsts IS NOT NULL AND hsts != ''
              AND CAST(
                TRIM(
                  SUBSTR(
                    LOWER(hsts),
                    INSTR(LOWER(hsts), 'max-age=') + 8,
                    CASE
                      WHEN INSTR(SUBSTR(LOWER(hsts), INSTR(LOWER(hsts), 'max-age=') + 8), ';') > 0
                        THEN INSTR(SUBSTR(LOWER(hsts), INSTR(LOWER(hsts), 'max-age=') + 8), ';') - 1
                      ELSE LENGTH(hsts)
                    END
                  )
                ) AS INTEGER
              ) < 31536000`;
    case 'issues:hsts-no-includesubdomains':
      // Without `includeSubDomains`, an attacker can MITM a forgotten
      // subdomain (`http://old.example.com`) and bypass HSTS for the apex.
      return `is_external = 0 AND url LIKE 'https://%'
              AND content_kind = 'html'
              AND hsts IS NOT NULL AND hsts != ''
              AND LOWER(hsts) NOT LIKE '%includesubdomains%'`;
    case 'issues:anchor-text-too-long':
      // Outgoing links with anchor text > 100 chars usually indicate
      // either a screen-reader unfriendly "fluff anchor" or an entire
      // sentence that should be a paragraph + a focused link.
      return `is_external = 0 AND content_kind = 'html'
              AND EXISTS (
                SELECT 1 FROM links l
                 WHERE l.from_url_id = urls.id
                   AND l.anchor IS NOT NULL
                   AND LENGTH(l.anchor) > 100
              )`;
    case 'issues:anchor-text-generic':
      // Anchor phrases that carry no SEO value or accessibility context.
      // Google's webmaster guidelines flag these explicitly because they
      // give no signal about the destination.
      return `is_external = 0 AND content_kind = 'html'
              AND EXISTS (
                SELECT 1 FROM links l
                 WHERE l.from_url_id = urls.id
                   AND l.anchor IS NOT NULL
                   AND LOWER(TRIM(l.anchor)) IN (
                     'click here', 'click', 'here', 'read more', 'more',
                     'learn more', 'see more', 'continue reading', 'continue',
                     'this link', 'link', 'go', 'buraya', 'tıkla', 'devamı',
                     'devamını oku', 'daha fazla'
                   )
              )`;
    case 'issues:form-input-unlabeled':
      // Pages with at least one form input that has no accessible name
      // (no <label>, no aria-label, no title). WCAG 1.3.1 / 4.1.2 fail.
      return `is_external = 0 AND content_kind = 'html'
              AND form_input_unlabeled > 0`;
    case 'issues:images-no-lazy-loading':
      // Pages with ≥5 images but lazy-loading adoption < 50%. The 5-image
      // floor avoids flagging hero-only pages where lazy-loading the LCP
      // image would actually hurt performance.
      return `is_external = 0 AND content_kind = 'html'
              AND images_count >= 5
              AND (images_lazy * 2) < images_count`;
    case 'issues:image-broken-src':
      // Pages referencing at least one internal image whose HEAD probe
      // returned a 4xx/5xx status. Uses the existing `probe_status`
      // column from the post-crawl image-size pass — no extra crawl cost.
      return `is_external = 0 AND content_kind = 'html'
              AND EXISTS (
                SELECT 1 FROM image_usages iu
                  JOIN images i ON i.id = iu.image_id
                 WHERE iu.from_url_id = urls.id
                   AND i.probe_status IS NOT NULL
                   AND i.probe_status >= 400
                   AND i.probe_status < 600
              )`;
    case 'issues:target-blank-no-noopener':
      // `<a target="_blank">` without `rel="noopener"` allows the new
      // tab to access `window.opener` — a reverse-tabnabbing vector
      // OWASP / Mozilla flag explicitly. `rel="noreferrer"` also
      // implies noopener so we accept either.
      return `is_external = 0 AND content_kind = 'html'
              AND EXISTS (
                SELECT 1 FROM links l
                 WHERE l.from_url_id = urls.id
                   AND LOWER(COALESCE(l.target, '')) = '_blank'
                   AND (
                     l.rel IS NULL
                     OR (
                       LOWER(l.rel) NOT LIKE '%noopener%'
                       AND LOWER(l.rel) NOT LIKE '%noreferrer%'
                     )
                   )
              )`;
    case 'issues:page-empty':
      // 2xx HTML pages with effectively no body content. Sometimes a 404
      // template renders 200 OK with a blank page, sometimes a publishing
      // workflow leaves an unfinished draft accessible. Either way it's
      // wasted crawl budget and a thin-content signal.
      return `is_external = 0 AND content_kind = 'html'
              AND status_code BETWEEN 200 AND 299
              AND word_count IS NOT NULL
              AND word_count < 30`;
    case 'issues:og-image-not-absolute':
      // OpenGraph requires absolute URLs for og:image. Relative paths
      // simply don't render in Facebook / LinkedIn share cards.
      return `is_external = 0 AND content_kind = 'html'
              AND og_image IS NOT NULL AND og_image != ''
              AND og_image NOT LIKE 'http://%'
              AND og_image NOT LIKE 'https://%'`;
    case 'issues:twitter-image-not-absolute':
      // Twitter (X) similarly requires absolute URLs for twitter:image.
      return `is_external = 0 AND content_kind = 'html'
              AND twitter_image IS NOT NULL AND twitter_image != ''
              AND twitter_image NOT LIKE 'http://%'
              AND twitter_image NOT LIKE 'https://%'`;
    case 'issues:canonical-not-absolute':
      // Google recommends absolute canonical URLs (rfc 5988). Relative
      // canonicals work but are easy to break with subdirectory moves
      // and confuse crawlers running the page in detached/AMP contexts.
      return `is_external = 0 AND content_kind = 'html'
              AND canonical IS NOT NULL AND canonical != ''
              AND canonical NOT LIKE 'http://%'
              AND canonical NOT LIKE 'https://%'`;
    case 'issues:description-equals-title':
      // Meta description duplicates the title verbatim — lazy SEO that
      // wastes the second SERP signal a page gets to influence CTR.
      return `is_external = 0 AND content_kind = 'html'
              AND title IS NOT NULL AND title != ''
              AND meta_description IS NOT NULL AND meta_description != ''
              AND TRIM(LOWER(title)) = TRIM(LOWER(meta_description))`;
    case 'issues:title-single-word':
      // Single-token titles ("Home", "Blog", "Products") are almost
      // always too generic to rank — and split between this filter and
      // `title-placeholder` so users can review separately.
      return `is_external = 0 AND content_kind = 'html'
              AND title IS NOT NULL AND title != ''
              AND TRIM(title) NOT LIKE '% %'`;
    case 'issues:external-links-too-many':
      // Pages linking to >100 external destinations look like link
      // farms / scraper SERPs to crawlers and are routinely demoted.
      return `is_external = 0 AND content_kind = 'html'
              AND EXISTS (
                SELECT 1 FROM (
                  SELECT from_url_id, COUNT(*) AS c
                    FROM links
                   WHERE is_internal = 0
                   GROUP BY from_url_id
                  HAVING c > 100
                ) e
                WHERE e.from_url_id = urls.id
              )`;
    case 'issues:outlinks-zero':
      // Indexable HTML pages with zero outlinks are dead-end leaves —
      // bad for crawl flow, internal-link equity distribution, and the
      // user's path through the site.
      return `is_external = 0 AND content_kind = 'html'
              AND status_code BETWEEN 200 AND 299
              AND indexability = 'indexable'
              AND outlinks = 0`;
    case 'issues:internal-link-to-redirect':
      // A page links to ≥1 internal URL whose status is 3xx. Each hop
      // burns crawl budget and weakens link equity — best-practice is
      // to update every link to the redirect's final destination.
      return `is_external = 0 AND content_kind = 'html'
              AND EXISTS (
                SELECT 1 FROM links l
                  JOIN urls t ON l.to_url = t.url
                 WHERE l.from_url_id = urls.id
                   AND l.is_internal = 1
                   AND t.status_code >= 300 AND t.status_code < 400
              )`;
    case 'issues:h1-equals-title':
      // Title and H1 are *almost* always supposed to differ —
      // duplicating one as the other wastes the second relevance
      // signal Google reads from a page. Common when the CMS
      // auto-fills both from the same field.
      return `is_external = 0 AND content_kind = 'html'
              AND title IS NOT NULL AND title != ''
              AND h1 IS NOT NULL AND h1 != ''
              AND TRIM(LOWER(title)) = TRIM(LOWER(h1))`;
    case 'issues:dead-external-domain':
      // Page links to an external domain whose own crawled pages are
      // mostly broken: ≥3 attempts (so a single 404 doesn't poison a
      // whole site) AND ≥80% error rate. Both thresholds match the
      // External Domain Health report's "BAD" classification so the
      // sidebar count and the report agree on what counts as dead.
      // The host extraction is inlined below; SQLite's substring
      // arithmetic is verbose but stays in the query planner so a
      // 100K-URL crawl resolves this in a single pass.
      return `is_external = 0 AND content_kind = 'html'
              AND EXISTS (
                SELECT 1 FROM links l
                  JOIN urls eu ON l.to_url = eu.url
                 WHERE l.from_url_id = urls.id
                   AND l.is_internal = 0
                   AND eu.is_external = 1
                   AND LOWER(
                     SUBSTR(
                       eu.url,
                       INSTR(eu.url, '://') + 3,
                       CASE
                         WHEN INSTR(SUBSTR(eu.url, INSTR(eu.url, '://') + 3), '/') > 0
                           THEN INSTR(SUBSTR(eu.url, INSTR(eu.url, '://') + 3), '/') - 1
                         ELSE LENGTH(eu.url)
                       END
                     )
                   ) IN (
                     SELECT host_grouped FROM (
                       SELECT
                         LOWER(
                           SUBSTR(
                             url,
                             INSTR(url, '://') + 3,
                             CASE
                               WHEN INSTR(SUBSTR(url, INSTR(url, '://') + 3), '/') > 0
                                 THEN INSTR(SUBSTR(url, INSTR(url, '://') + 3), '/') - 1
                               ELSE LENGTH(url)
                             END
                           )
                         ) AS host_grouped,
                         COUNT(*) AS total,
                         SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) AS errors
                       FROM urls
                       WHERE is_external = 1 AND status_code IS NOT NULL
                       GROUP BY host_grouped
                       HAVING total >= 3 AND CAST(errors AS REAL) / total >= 0.8
                     )
                   )
              )`;
    case 'issues:duplicate-url-post-norm':
      // Two distinct URL rows that collapse to the same value once
      // common normalisations are applied: lowercase the host, strip a
      // trailing slash, drop the query string. We don't strip the
      // fragment because we already have a separate "Fragment in URL"
      // issue and a fragment-only difference is rare in real corpora.
      // EXISTS pattern matches at least one OTHER row with the same
      // normalised key; current row excluded by `urls.id <> u2.id`.
      return `is_external = 0
              AND EXISTS (
                SELECT 1 FROM urls u2
                 WHERE u2.id <> urls.id
                   AND u2.is_external = 0
                   AND RTRIM(
                         LOWER(
                           CASE
                             WHEN INSTR(u2.url, '?') > 0
                               THEN SUBSTR(u2.url, 1, INSTR(u2.url, '?') - 1)
                             ELSE u2.url
                           END
                         ),
                         '/'
                       ) =
                       RTRIM(
                         LOWER(
                           CASE
                             WHEN INSTR(urls.url, '?') > 0
                               THEN SUBSTR(urls.url, 1, INSTR(urls.url, '?') - 1)
                             ELSE urls.url
                           END
                         ),
                         '/'
                       )
              )`;
    case 'issues:canonical-chain-multi-hop':
      // Page has a canonical, AND that canonical's target is also a
      // crawled URL with its own *different* canonical. Two-hop
      // detection is enough for the bulk of misconfigurations — deeper
      // chains cascade through this filter too because the second hop
      // would also surface as a multi-hop chain on its own row.
      return `is_external = 0 AND content_kind = 'html'
              AND canonical IS NOT NULL AND canonical != ''
              AND canonical != url
              AND EXISTS (
                SELECT 1 FROM urls c2
                 WHERE c2.url = urls.canonical
                   AND c2.canonical IS NOT NULL
                   AND c2.canonical != ''
                   AND c2.canonical != c2.url
                   AND c2.canonical != urls.canonical
              )`;
    case 'issues:image-slow-loading':
      // Page loads at least one image > 200 KB AND the page hasn't
      // applied lazy-loading to every image. Big un-lazy images are
      // LCP killers on mobile and waste data budget on every reload.
      // 200 KB matches the existing "Large Image" threshold so the
      // user sees the same set spanning two complementary issues.
      // Lazy adoption is tracked per-page (images_lazy / images_count)
      // because the parser doesn't store a per-image `loading` flag.
      return `is_external = 0 AND content_kind = 'html'
              AND images_count > 0 AND images_lazy < images_count
              AND EXISTS (
                SELECT 1 FROM image_usages iu
                  JOIN images i ON iu.image_id = i.id
                 WHERE iu.from_url_id = urls.id
                   AND i.byte_size IS NOT NULL
                   AND i.byte_size > 204800
              )`;
    case 'issues:description-equals-h1':
      // Meta description verbatim duplicates the H1 — same lazy
      // copy-paste pattern as `description-equals-title` but coming
      // from a different copy direction (CMS auto-fills meta from H1
      // when title is intentionally different).
      return `is_external = 0 AND content_kind = 'html'
              AND meta_description IS NOT NULL AND meta_description != ''
              AND h1 IS NOT NULL AND h1 != ''
              AND TRIM(LOWER(meta_description)) = TRIM(LOWER(h1))`;
    case 'issues:js-only-navigation':
      // Page has ≥1 `<a>` that's clickable but not crawlable:
      //   - `<a onclick="…">`        (no href at all)
      //   - `<a href="javascript:…">`
      //   - `<a href="#" onclick="…">`
      // Bots can't follow these so any nav that depends on them is
      // invisible; counted at parse time into js_only_links_count.
      return `is_external = 0 AND content_kind = 'html'
              AND js_only_links_count > 0`;
    case 'issues:text-code-ratio-low':
      // Visible-text bytes < 10% of total HTML bytes. Almost always a
      // template-heavy / SPA shell that ships markup but no content.
      // 10% is the conventional Screaming Frog threshold; tunable if
      // a per-project setting is added later.
      return `is_external = 0 AND content_kind = 'html'
              AND text_code_ratio IS NOT NULL
              AND text_code_ratio < 10`;
    case 'issues:render-blocking-critical':
      // Tier above the existing "Render-Blocking Head (>5)" issue.
      // 20+ blocking head resources is almost universally third-party
      // bloat (analytics/tag managers/A-B test loaders) and a top-3
      // cause of slow LCP on any modern site audit.
      return `is_external = 0 AND content_kind = 'html'
              AND render_blocking_count > 20`;
    case 'issues:og-image-too-large':
      // og:image > 5 MB. Facebook's documented hard cap is 8 MB; share
      // card renderers silently drop oversize images well before that.
      // Joins on the per-image HEAD probe to read `byte_size`.
      return `is_external = 0 AND content_kind = 'html'
              AND og_image IS NOT NULL AND og_image != ''
              AND EXISTS (
                SELECT 1 FROM images i
                 WHERE i.src = urls.og_image
                   AND i.byte_size IS NOT NULL
                   AND i.byte_size > 5242880
              )`;
    case 'issues:twitter-image-too-large':
      // twitter:image > 5 MB. Conservative threshold that catches both
      // JPG/PNG (Twitter cap 5 MB) and GIF (cap 15 MB) issues.
      return `is_external = 0 AND content_kind = 'html'
              AND twitter_image IS NOT NULL AND twitter_image != ''
              AND EXISTS (
                SELECT 1 FROM images i
                 WHERE i.src = urls.twitter_image
                   AND i.byte_size IS NOT NULL
                   AND i.byte_size > 5242880
              )`;
    case 'issues:pagination-sequence-break':
      // Set post-crawl by `recomputePaginationSequence()` — see the
      // implementation comment there for the gap-detection algorithm
      // and the URL pattern recognisers that produce ordinals.
      return `is_external = 0 AND content_kind = 'html'
              AND pagination_sequence_break = 1`;
    case 'issues:links-per-page-too-many':
      // Total outgoing links (internal + external, deduplicated) > 100.
      // Distinct from `external-links-too-many` which only counts the
      // external bucket — this filter trips on internal-heavy pages too
      // (mega-menus, sitemap-style hub pages) which Google's PageRank
      // dilution makes equally problematic.
      return `is_external = 0 AND content_kind = 'html'
              AND outlinks > 100`;
    case 'tab:redirects':
      // Wave 4 — Redirects tab. Every internal URL whose status is 3xx
      // is a redirect hop. Each hop already has its own row in the
      // `urls` table (the crawler enqueues redirect targets so we
      // capture full chains as discrete rows), so a simple status-class
      // filter recovers the full set; the table's `redirect_target`,
      // `redirect_chain_length`, `redirect_final_url`, and
      // `redirect_loop` columns surface chain context per row.
      return `is_external = 0
              AND status_code >= 300 AND status_code < 400`;
    case 'tab:canonicals':
      // Wave 4 — Canonicals tab. Every HTML page that declares a
      // canonical (HTML link tag OR HTTP `Link: rel=canonical` header).
      // Self-referencing, cross-page, and mismatched canonicals all
      // surface here; the per-row "Canonical" + "Canonical (HTTP)"
      // columns let the user audit them visually.
      return `is_external = 0 AND content_kind = 'html'
              AND (
                (canonical IS NOT NULL AND canonical != '')
                OR (canonical_http IS NOT NULL AND canonical_http != '')
              )`;
    case 'issues:hreflang-inconsistent-lang':
      // Set post-crawl by `recomputeHreflangInconsistent()` — same `lang`
      // token mapped to two different hrefs on the same page.
      return `is_external = 0 AND content_kind = 'html'
              AND hreflang_inconsistent_lang = 1`;
    case 'tab:directives':
      // Wave 4 — Directives tab. Pages declaring any indexability
      // directive: meta robots, X-Robots-Tag header, robots.txt block,
      // or canonical-to-other (which acts as an indexability signal).
      // The `Meta Robots`, `X-Robots-Tag`, and `Indexability Reason`
      // columns make the active directives readable at a glance.
      return `is_external = 0 AND content_kind = 'html'
              AND (
                (meta_robots IS NOT NULL AND meta_robots != '')
                OR (x_robots_tag IS NOT NULL AND x_robots_tag != '')
                OR indexability LIKE 'non-indexable%'
              )`;
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
