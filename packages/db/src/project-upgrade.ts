import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { LATEST_SCHEMA_VERSION, type MigrationProgress } from './migrations.js';
import { ProjectDb } from './project-db.js';

/**
 * Tables `ProjectDb.reset()` empties, minus the two it reads before the
 * wipe for crash recovery (`project_meta`, `crawl_queue`). A table missing
 * here is only rewritten by the upgrade before being wiped — slower, never
 * wrong.
 */
const CRAWL_DATA_TABLES = [
  'image_usages',
  'images',
  'resource_usages',
  'resources',
  'links',
  'headers',
  'url_sources',
  'sitemap_urls',
  'urls',
  'urls_issues',
  'host_certs',
  'pagespeed_results',
  'crux_results',
  'spelling_results',
  'gsc_results',
  'ga4_results',
  'metrica_results',
  'ai_results',
  'seo_results',
  'gsc_inspection_results',
  'log_threats',
  'log_url_stats',
  'log_url_bot',
  'log_daily',
  'log_status',
  'log_bots',
  'log_ingests',
];

/**
 * True when the project file at `filePath` exists and has migrations left
 * to apply. A file that cannot be read answers false, so opening it the
 * usual way reports the error as before.
 */
export function projectNeedsUpgrade(filePath: string): boolean {
  if (!existsSync(filePath)) return false;
  let db: DatabaseSync | null = null;
  try {
    db = new DatabaseSync(filePath);
    const tracked = db
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_version'")
      .get();
    if (!tracked) return true;
    const row = db.prepare('SELECT MAX(version) AS v FROM schema_version').get() as {
      v: number | null;
    };
    return (row.v ?? 0) < LATEST_SCHEMA_VERSION;
  } catch {
    return false;
  } finally {
    db?.close();
  }
}

export interface UpgradeProjectOptions {
  /**
   * Empty the crawl tables first. Only for a database that is wiped as soon
   * as it opens (the desktop app's scratch project), so the upgrade does not
   * spend seconds rewriting rows that are deleted right after.
   */
  discardCrawlData?: boolean;
  onProgress?: (progress: MigrationProgress) => void;
}

/**
 * Applies the pending migrations to the project file at `filePath`, then
 * closes it. Opening a `ProjectDb` does the same, but on whatever thread
 * opens it: the desktop app runs this on a worker first, so upgrading a
 * large project saved by an older version never blocks the window.
 */
export function upgradeProjectFile(filePath: string, opts: UpgradeProjectOptions = {}): void {
  if (opts.discardCrawlData && projectNeedsUpgrade(filePath)) discardCrawlData(filePath);
  new ProjectDb(filePath, { onMigrationProgress: opts.onProgress }).close();
}

function discardCrawlData(filePath: string): void {
  const db = new DatabaseSync(filePath);
  try {
    const tables = new Set(
      (
        db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as {
          name: string;
        }[]
      ).map((r) => r.name),
    );
    // Same reasoning as `reset()`: every table with a foreign key is emptied
    // here, and FK checks are what make a large wipe slow.
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('BEGIN');
    try {
      for (const table of CRAWL_DATA_TABLES) {
        if (tables.has(table)) db.exec(`DELETE FROM ${table}`);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  } finally {
    db.close();
  }
}
