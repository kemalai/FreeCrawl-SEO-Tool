import type { DatabaseSync } from 'node:sqlite';

interface Migration {
  version: number;
  name: string;
  /**
   * Either raw SQL executed once, or a function that receives the db and
   * performs conditional work (used to repair schemas whose version
   * counter was bumped by an earlier, since-removed migration).
   */
  up: string | ((db: DatabaseSync) => void);
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
  {
    version: 2,
    name: 'add_is_external',
    up: `
      ALTER TABLE urls ADD COLUMN is_external INTEGER NOT NULL DEFAULT 0;
      CREATE INDEX IF NOT EXISTS idx_urls_is_external ON urls(is_external);
    `,
  },
  {
    version: 3,
    name: 'add_images',
    up: `
      ALTER TABLE urls ADD COLUMN images_count INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE urls ADD COLUMN images_missing_alt INTEGER NOT NULL DEFAULT 0;

      CREATE TABLE IF NOT EXISTS images (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        src         TEXT NOT NULL UNIQUE,
        alt         TEXT,
        width       INTEGER,
        height      INTEGER,
        is_internal INTEGER NOT NULL DEFAULT 1,
        occurrences INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_images_is_internal ON images(is_internal);
      CREATE INDEX IF NOT EXISTS idx_images_alt_null ON images(alt) WHERE alt IS NULL;

      CREATE TABLE IF NOT EXISTS image_usages (
        from_url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
        image_id    INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
        alt         TEXT,
        PRIMARY KEY (from_url_id, image_id)
      );
      CREATE INDEX IF NOT EXISTS idx_image_usages_image ON image_usages(image_id);
    `,
  },
  {
    version: 4,
    name: 'add_broken_links_index',
    up: `
      -- Speeds up the broken-link join (links.to_url → urls.url).
      CREATE INDEX IF NOT EXISTS idx_links_to_internal ON links(to_url, is_internal);
    `,
  },
  {
    version: 5,
    name: 'repair_images_schema',
    // Dev-window databases that applied an earlier, now-removed "version 3"
    // (sort snapshots) end up flagged as `schema_version = 3` without the
    // image tables / columns. Running this idempotent repair brings those
    // DBs into line, and is a no-op on fresh installs where migration 3
    // already did the work.
    up: (db) => {
      const urlCols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const hasColumn = (name: string) => urlCols.some((c) => c.name === name);

      if (!hasColumn('images_count')) {
        db.exec('ALTER TABLE urls ADD COLUMN images_count INTEGER NOT NULL DEFAULT 0');
      }
      if (!hasColumn('images_missing_alt')) {
        db.exec(
          'ALTER TABLE urls ADD COLUMN images_missing_alt INTEGER NOT NULL DEFAULT 0',
        );
      }

      db.exec(`
        CREATE TABLE IF NOT EXISTS images (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          src         TEXT NOT NULL UNIQUE,
          alt         TEXT,
          width       INTEGER,
          height      INTEGER,
          is_internal INTEGER NOT NULL DEFAULT 1,
          occurrences INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_images_is_internal ON images(is_internal);
        CREATE INDEX IF NOT EXISTS idx_images_alt_null ON images(alt) WHERE alt IS NULL;

        CREATE TABLE IF NOT EXISTS image_usages (
          from_url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
          image_id    INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
          alt         TEXT,
          PRIMARY KEY (from_url_id, image_id)
        );
        CREATE INDEX IF NOT EXISTS idx_image_usages_image ON image_usages(image_id);

        -- The removed sort-snapshot tables are no longer referenced by code;
        -- drop them so reset()'s bulk DELETE stops tripping over them.
        DROP TABLE IF EXISTS sort_snapshot_rows;
        DROP TABLE IF EXISTS sort_snapshots;
      `);
    },
  },
  {
    version: 6,
    name: 'add_link_columns',
    // Screaming Frog-style inlink/outlink columns. Added as a conditional
    // migration so this is safe to re-run against fresh or partially-
    // migrated databases.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(links)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('type')) {
        db.exec("ALTER TABLE links ADD COLUMN type TEXT NOT NULL DEFAULT 'hyperlink'");
      }
      if (!has('alt_text')) db.exec('ALTER TABLE links ADD COLUMN alt_text TEXT');
      if (!has('target')) db.exec('ALTER TABLE links ADD COLUMN target TEXT');
      if (!has('path_type')) db.exec('ALTER TABLE links ADD COLUMN path_type TEXT');
      if (!has('link_path')) db.exec('ALTER TABLE links ADD COLUMN link_path TEXT');
      if (!has('link_position')) db.exec('ALTER TABLE links ADD COLUMN link_position TEXT');
      if (!has('link_origin')) {
        db.exec("ALTER TABLE links ADD COLUMN link_origin TEXT NOT NULL DEFAULT 'html'");
      }
    },
  },
  {
    version: 7,
    name: 'add_h1_count',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      if (!cols.some((c) => c.name === 'h1_count')) {
        db.exec('ALTER TABLE urls ADD COLUMN h1_count INTEGER NOT NULL DEFAULT 0');
      }
    },
  },
  {
    version: 8,
    name: 'add_h1_length',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      if (!cols.some((c) => c.name === 'h1_length')) {
        db.exec('ALTER TABLE urls ADD COLUMN h1_length INTEGER');
      }
    },
  },
  {
    version: 9,
    name: 'add_lang_viewport_og',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('lang')) db.exec('ALTER TABLE urls ADD COLUMN lang TEXT');
      if (!has('viewport')) db.exec('ALTER TABLE urls ADD COLUMN viewport TEXT');
      if (!has('og_title')) db.exec('ALTER TABLE urls ADD COLUMN og_title TEXT');
      if (!has('og_description')) db.exec('ALTER TABLE urls ADD COLUMN og_description TEXT');
      if (!has('og_image')) db.exec('ALTER TABLE urls ADD COLUMN og_image TEXT');
    },
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
      if (typeof migration.up === 'string') {
        db.exec(migration.up);
      } else {
        migration.up(db);
      }
      db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(migration.version);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}
