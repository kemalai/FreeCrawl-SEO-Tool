import { DatabaseSync, type StatementSync } from 'node:sqlite';
import type {
  AdvancedFilter,
  BrokenLinkRow,
  ContentKind,
  CrawlSummary,
  CrawlUrlRow,
  DiscoveredImage,
  DiscoveredLink,
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
  word_count: number | null;
  canonical: string | null;
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
  redirect_chain_length: number;
  redirect_final_url: string | null;
  redirect_loop: number;
  folder_depth: number;
  query_param_count: number;
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
  wordCount?: number | null;
  canonical?: string | null;
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
}

const UPSERT_URL_SQL = `
  INSERT INTO urls (
    url, content_kind, status_code, status_text, indexability, indexability_reason,
    title, title_length, meta_description, meta_description_length,
    h1, h1_length, h1_count, h2_count, word_count, canonical, meta_robots, x_robots_tag,
    content_type, content_length, response_time_ms, depth, outlinks, redirect_target,
    images_count, images_missing_alt,
    lang, viewport, og_title, og_description, og_image,
    twitter_card, twitter_title, twitter_description, twitter_image,
    meta_keywords, meta_author, meta_generator, theme_color,
    hsts, x_frame_options, x_content_type_options, content_encoding,
    schema_types, schema_block_count, schema_invalid_count,
    pagination_next, pagination_prev, hreflangs, hreflang_count,
    amphtml, favicon, mixed_content_count,
    folder_depth, query_param_count
  ) VALUES (
    :url, :content_kind, :status_code, :status_text, :indexability, :indexability_reason,
    :title, :title_length, :meta_description, :meta_description_length,
    :h1, :h1_length, :h1_count, :h2_count, :word_count, :canonical, :meta_robots, :x_robots_tag,
    :content_type, :content_length, :response_time_ms, :depth, :outlinks, :redirect_target,
    :images_count, :images_missing_alt,
    :lang, :viewport, :og_title, :og_description, :og_image,
    :twitter_card, :twitter_title, :twitter_description, :twitter_image,
    :meta_keywords, :meta_author, :meta_generator, :theme_color,
    :hsts, :x_frame_options, :x_content_type_options, :content_encoding,
    :schema_types, :schema_block_count, :schema_invalid_count,
    :pagination_next, :pagination_prev, :hreflangs, :hreflang_count,
    :amphtml, :favicon, :mixed_content_count,
    :folder_depth, :query_param_count
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
    word_count = excluded.word_count,
    canonical = excluded.canonical,
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
      word_count: input.wordCount ?? null,
      canonical: input.canonical ?? null,
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
    this.db.exec(`
      UPDATE urls SET inlinks = (
        SELECT COUNT(*) FROM links l
        WHERE l.to_url = urls.url AND l.is_internal = 1
      )
    `);
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
    const allRows = this.db
      .prepare('SELECT url, redirect_target FROM urls')
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
      imageMissingAlt: (
        this.db.prepare('SELECT COUNT(*) AS c FROM images WHERE alt IS NULL').get() as {
          c: number;
        }
      ).c,
      brokenLinksInternal: this.countBrokenLinks('internal'),
      brokenLinksExternal: this.countBrokenLinks('external'),
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
    wordCount: r.word_count,
    canonical: r.canonical,
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
    redirectChainLength: r.redirect_chain_length,
    redirectFinalUrl: r.redirect_final_url,
    redirectLoop: r.redirect_loop === 1,
    folderDepth: r.folder_depth,
    queryParamCount: r.query_param_count,
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
    case 'issues:image-missing-alt':
      return "is_external = 0 AND content_kind = 'html' AND images_missing_alt > 0";
    // Broken-link categories drive the BrokenLinksTab view; they never
    // filter the URL table itself.
    case 'issues:broken-links-all':
    case 'issues:broken-links-internal':
    case 'issues:broken-links-external':
      return null;
    default:
      return null;
  }
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
