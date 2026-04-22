import { DatabaseSync, type StatementSync } from 'node:sqlite';
import type {
  ContentKind,
  CrawlSummary,
  CrawlUrlRow,
  DiscoveredLink,
  Indexability,
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
}

const UPSERT_URL_SQL = `
  INSERT INTO urls (
    url, content_kind, status_code, status_text, indexability, indexability_reason,
    title, title_length, meta_description, meta_description_length,
    h1, h2_count, word_count, canonical, meta_robots, x_robots_tag,
    content_type, content_length, response_time_ms, depth, outlinks, redirect_target
  ) VALUES (
    :url, :content_kind, :status_code, :status_text, :indexability, :indexability_reason,
    :title, :title_length, :meta_description, :meta_description_length,
    :h1, :h2_count, :word_count, :canonical, :meta_robots, :x_robots_tag,
    :content_type, :content_length, :response_time_ms, :depth, :outlinks, :redirect_target
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
    crawled_at = CURRENT_TIMESTAMP
`;

export class ProjectDb {
  private readonly db: DatabaseSync;
  private readonly stmtUpsertUrl: StatementSync;
  private readonly stmtGetUrlId: StatementSync;
  private readonly stmtInsertLink: StatementSync;

  constructor(filePath: string) {
    this.db = new DatabaseSync(filePath);
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA synchronous = NORMAL');
    this.db.exec('PRAGMA foreign_keys = ON');
    this.db.exec('PRAGMA temp_store = MEMORY');
    this.db.exec('PRAGMA cache_size = -64000');
    runMigrations(this.db);

    this.stmtUpsertUrl = this.db.prepare(UPSERT_URL_SQL);
    this.stmtGetUrlId = this.db.prepare('SELECT id FROM urls WHERE url = ?');
    this.stmtInsertLink = this.db.prepare(
      'INSERT INTO links (from_url_id, to_url, anchor, rel, is_internal) VALUES (?, ?, ?, ?, ?)',
    );
  }

  close(): void {
    this.db.close();
  }

  reset(): void {
    this.db.exec('DELETE FROM links; DELETE FROM headers; DELETE FROM urls;');
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
    };

    this.stmtUpsertUrl.run(params);
    const row = this.stmtGetUrlId.get(input.url) as { id: number } | undefined;
    return row?.id ?? 0;
  }

  insertLinks(fromUrlId: number, links: DiscoveredLink[]): void {
    if (links.length === 0) return;
    this.db.exec('BEGIN');
    try {
      for (const link of links) {
        this.stmtInsertLink.run(
          fromUrlId,
          link.toUrl,
          link.anchor,
          link.rel,
          link.isInternal ? 1 : 0,
        );
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

  queryUrls(params: {
    limit: number;
    offset: number;
    filter?: 'all' | 'internal' | 'external' | 'errors' | 'redirects';
    search?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }): { rows: CrawlUrlRow[]; total: number } {
    const where: string[] = [];
    const args: (string | number)[] = [];

    switch (params.filter) {
      case 'errors':
        where.push('(status_code >= 400 OR status_code IS NULL)');
        break;
      case 'redirects':
        where.push('status_code >= 300 AND status_code < 400');
        break;
      case 'internal':
        where.push("content_kind = 'html'");
        break;
    }

    if (params.search) {
      where.push('(url LIKE ? OR title LIKE ?)');
      const like = `%${params.search}%`;
      args.push(like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const validSort = new Set([
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
    ]);
    const sortCol =
      params.sortBy && validSort.has(this.toSnake(params.sortBy))
        ? this.toSnake(params.sortBy)
        : 'id';
    const sortDir = params.sortDir === 'desc' ? 'DESC' : 'ASC';

    const totalRow = this.db
      .prepare(`SELECT COUNT(*) AS c FROM urls ${whereSql}`)
      .get(...args) as { c: number };

    const rowsDb = this.db
      .prepare(
        `SELECT * FROM urls ${whereSql} ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`,
      )
      .all(...args, params.limit, params.offset) as unknown as UrlRowDb[];

    return { rows: rowsDb.map(this.rowFromDb), total: totalRow.c };
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

  *iterateAllUrls(): IterableIterator<CrawlUrlRow> {
    const rows = this.db.prepare('SELECT * FROM urls ORDER BY id').all() as unknown as UrlRowDb[];
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
    redirectTarget: r.redirect_target,
    crawledAt: r.crawled_at,
  });

  private toSnake(s: string): string {
    return s.replace(/([A-Z])/g, '_$1').toLowerCase();
  }
}
