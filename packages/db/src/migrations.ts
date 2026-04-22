import type { DatabaseSync } from 'node:sqlite';

interface Migration {
  version: number;
  name: string;
  up: string;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: `
      CREATE TABLE IF NOT EXISTS project_meta (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS urls (
        id                     INTEGER PRIMARY KEY AUTOINCREMENT,
        url                    TEXT NOT NULL UNIQUE,
        content_kind           TEXT NOT NULL DEFAULT 'html',
        status_code            INTEGER,
        status_text            TEXT,
        indexability           TEXT NOT NULL DEFAULT 'indexable',
        indexability_reason    TEXT,
        title                  TEXT,
        title_length           INTEGER,
        meta_description       TEXT,
        meta_description_length INTEGER,
        h1                     TEXT,
        h2_count               INTEGER NOT NULL DEFAULT 0,
        word_count             INTEGER,
        canonical              TEXT,
        meta_robots            TEXT,
        x_robots_tag           TEXT,
        content_type           TEXT,
        content_length         INTEGER,
        response_time_ms       INTEGER,
        depth                  INTEGER NOT NULL DEFAULT 0,
        inlinks                INTEGER NOT NULL DEFAULT 0,
        outlinks               INTEGER NOT NULL DEFAULT 0,
        redirect_target        TEXT,
        crawled_at             TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_urls_status ON urls(status_code);
      CREATE INDEX IF NOT EXISTS idx_urls_indexability ON urls(indexability);
      CREATE INDEX IF NOT EXISTS idx_urls_content_kind ON urls(content_kind);
      CREATE INDEX IF NOT EXISTS idx_urls_depth ON urls(depth);

      CREATE TABLE IF NOT EXISTS links (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        from_url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
        to_url      TEXT NOT NULL,
        anchor      TEXT,
        rel         TEXT,
        is_internal INTEGER NOT NULL DEFAULT 1
      );

      CREATE INDEX IF NOT EXISTS idx_links_from ON links(from_url_id);
      CREATE INDEX IF NOT EXISTS idx_links_to ON links(to_url);

      CREATE TABLE IF NOT EXISTS headers (
        url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
        name   TEXT NOT NULL,
        value  TEXT NOT NULL,
        PRIMARY KEY (url_id, name)
      );
    `,
  },
];

export function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const currentVersion =
    (db.prepare('SELECT MAX(version) AS v FROM schema_version').get() as { v: number | null }).v ??
    0;

  const pending = MIGRATIONS.filter((m) => m.version > currentVersion);
  for (const migration of pending) {
    db.exec('BEGIN');
    try {
      db.exec(migration.up);
      db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(migration.version);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}
