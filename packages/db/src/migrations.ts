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
  {
    version: 10,
    name: 'add_twitter_card',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('twitter_card')) db.exec('ALTER TABLE urls ADD COLUMN twitter_card TEXT');
      if (!has('twitter_title')) db.exec('ALTER TABLE urls ADD COLUMN twitter_title TEXT');
      if (!has('twitter_description'))
        db.exec('ALTER TABLE urls ADD COLUMN twitter_description TEXT');
      if (!has('twitter_image')) db.exec('ALTER TABLE urls ADD COLUMN twitter_image TEXT');
    },
  },
  {
    version: 11,
    name: 'add_meta_extras',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('meta_keywords')) db.exec('ALTER TABLE urls ADD COLUMN meta_keywords TEXT');
      if (!has('meta_author')) db.exec('ALTER TABLE urls ADD COLUMN meta_author TEXT');
      if (!has('meta_generator')) db.exec('ALTER TABLE urls ADD COLUMN meta_generator TEXT');
      if (!has('theme_color')) db.exec('ALTER TABLE urls ADD COLUMN theme_color TEXT');
    },
  },
  {
    version: 12,
    name: 'add_security_headers',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('hsts')) db.exec('ALTER TABLE urls ADD COLUMN hsts TEXT');
      if (!has('x_frame_options')) db.exec('ALTER TABLE urls ADD COLUMN x_frame_options TEXT');
      if (!has('x_content_type_options'))
        db.exec('ALTER TABLE urls ADD COLUMN x_content_type_options TEXT');
      if (!has('content_encoding')) db.exec('ALTER TABLE urls ADD COLUMN content_encoding TEXT');
    },
  },
  {
    version: 13,
    name: 'add_structured_data',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      // Comma-joined sorted unique @type values; readable filter target.
      if (!has('schema_types')) db.exec('ALTER TABLE urls ADD COLUMN schema_types TEXT');
      if (!has('schema_block_count'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN schema_block_count INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('schema_invalid_count'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN schema_invalid_count INTEGER NOT NULL DEFAULT 0',
        );
    },
  },
  {
    version: 14,
    name: 'add_pagination_hreflang',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('pagination_next')) db.exec('ALTER TABLE urls ADD COLUMN pagination_next TEXT');
      if (!has('pagination_prev')) db.exec('ALTER TABLE urls ADD COLUMN pagination_prev TEXT');
      // hreflangs stored as JSON array text — variable-length list, easier
      // than a child table for V1; we surface counts via a sibling column.
      if (!has('hreflangs')) db.exec('ALTER TABLE urls ADD COLUMN hreflangs TEXT');
      if (!has('hreflang_count'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN hreflang_count INTEGER NOT NULL DEFAULT 0',
        );
    },
  },
  {
    version: 15,
    name: 'add_amp_favicon_mixed_content',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('amphtml')) db.exec('ALTER TABLE urls ADD COLUMN amphtml TEXT');
      if (!has('favicon')) db.exec('ALTER TABLE urls ADD COLUMN favicon TEXT');
      if (!has('mixed_content_count'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN mixed_content_count INTEGER NOT NULL DEFAULT 0',
        );
    },
  },
  {
    version: 16,
    name: 'add_redirect_chain',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      // Number of redirects in this URL's chain (0 = not a redirect; n = n hops to final).
      if (!has('redirect_chain_length'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN redirect_chain_length INTEGER NOT NULL DEFAULT 0',
        );
      // Terminal URL after walking all redirects, or null if loop / unknown.
      if (!has('redirect_final_url'))
        db.exec('ALTER TABLE urls ADD COLUMN redirect_final_url TEXT');
      // Boolean flag (0/1) — 1 if a cycle was detected while walking.
      if (!has('redirect_loop'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN redirect_loop INTEGER NOT NULL DEFAULT 0',
        );
    },
  },
  {
    version: 17,
    name: 'add_url_structure_stats',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      // Number of `/` segments in the URL path (e.g. `/a/b/c` → 3).
      if (!has('folder_depth'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN folder_depth INTEGER NOT NULL DEFAULT 0',
        );
      // Number of `?key=…&key=…` parameters in the query string.
      if (!has('query_param_count'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN query_param_count INTEGER NOT NULL DEFAULT 0',
        );
    },
  },
  {
    version: 18,
    name: 'add_sitemap_urls',
    up: `
      CREATE TABLE IF NOT EXISTS sitemap_urls (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        url             TEXT NOT NULL UNIQUE,
        lastmod         TEXT,
        priority        REAL,
        changefreq      TEXT,
        source_sitemap  TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sitemap_urls_url ON sitemap_urls(url);
    `,
  },
  {
    version: 19,
    name: 'add_csp_referrer_permissions',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('csp')) db.exec('ALTER TABLE urls ADD COLUMN csp TEXT');
      if (!has('referrer_policy')) db.exec('ALTER TABLE urls ADD COLUMN referrer_policy TEXT');
      if (!has('permissions_policy'))
        db.exec('ALTER TABLE urls ADD COLUMN permissions_policy TEXT');
    },
  },
  {
    version: 20,
    name: 'add_custom_search_hits',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      // JSON object `{ "term": count }` — variable-shape, single column.
      if (!has('custom_search_hits'))
        db.exec('ALTER TABLE urls ADD COLUMN custom_search_hits TEXT');
    },
  },
  {
    version: 21,
    name: 'add_h3_h4_h5_h6_counts',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('h3_count'))
        db.exec('ALTER TABLE urls ADD COLUMN h3_count INTEGER NOT NULL DEFAULT 0');
      if (!has('h4_count'))
        db.exec('ALTER TABLE urls ADD COLUMN h4_count INTEGER NOT NULL DEFAULT 0');
      if (!has('h5_count'))
        db.exec('ALTER TABLE urls ADD COLUMN h5_count INTEGER NOT NULL DEFAULT 0');
      if (!has('h6_count'))
        db.exec('ALTER TABLE urls ADD COLUMN h6_count INTEGER NOT NULL DEFAULT 0');
    },
  },
  {
    version: 22,
    name: 'add_canonical_count',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      if (!cols.some((c) => c.name === 'canonical_count')) {
        db.exec(
          'ALTER TABLE urls ADD COLUMN canonical_count INTEGER NOT NULL DEFAULT 0',
        );
      }
    },
  },
  {
    version: 23,
    name: 'add_canonical_http',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      if (!cols.some((c) => c.name === 'canonical_http')) {
        db.exec('ALTER TABLE urls ADD COLUMN canonical_http TEXT');
      }
    },
  },
  {
    version: 24,
    name: 'add_meta_refresh_and_charset',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      // Raw `<meta http-equiv="refresh">` content attribute (e.g. "5; url=/foo").
      if (!has('meta_refresh')) db.exec('ALTER TABLE urls ADD COLUMN meta_refresh TEXT');
      // Parsed redirect target from the meta-refresh content, normalised
      // to absolute URL when present, else null.
      if (!has('meta_refresh_url'))
        db.exec('ALTER TABLE urls ADD COLUMN meta_refresh_url TEXT');
      // Declared character encoding — prefers `<meta charset>` /
      // `<meta http-equiv="Content-Type">`, falls back to the HTTP
      // Content-Type header `charset=` parameter. Lowercased.
      if (!has('charset')) db.exec('ALTER TABLE urls ADD COLUMN charset TEXT');
    },
  },
  {
    version: 25,
    name: 'add_duplicate_clustering',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      // 64-bit hex SimHash + content-hash for the post-crawl duplicate pass.
      if (!has('simhash')) db.exec('ALTER TABLE urls ADD COLUMN simhash TEXT');
      if (!has('content_hash')) db.exec('ALTER TABLE urls ADD COLUMN content_hash TEXT');
      // Cluster IDs are filled by recomputeDuplicateClusters() — 0 means
      // "not yet computed" or "singleton (no near-duplicates found)".
      if (!has('cluster_id'))
        db.exec('ALTER TABLE urls ADD COLUMN cluster_id INTEGER NOT NULL DEFAULT 0');
      if (!has('cluster_size'))
        db.exec('ALTER TABLE urls ADD COLUMN cluster_size INTEGER NOT NULL DEFAULT 1');

      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_urls_simhash ON urls(simhash) WHERE simhash IS NOT NULL',
      );
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_urls_content_hash ON urls(content_hash) WHERE content_hash IS NOT NULL',
      );
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_urls_cluster_id ON urls(cluster_id) WHERE cluster_id > 0',
      );
    },
  },
  {
    version: 26,
    name: 'add_hreflang_analysis',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      // Number of hreflang entries on this page whose `lang` does not
      // match BCP-47 / ISO 639-1 + ISO 3166-1 (incl. `x-default`).
      if (!has('hreflang_invalid_count'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN hreflang_invalid_count INTEGER NOT NULL DEFAULT 0',
        );
      // 1 if the page declares hreflang alternates but does NOT include a
      // self-referencing entry (Google MUST-have).
      if (!has('hreflang_self_ref_missing'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN hreflang_self_ref_missing INTEGER NOT NULL DEFAULT 0',
        );
      // Number of hreflang declarations on this page where the target
      // page does NOT declare a reciprocal hreflang back to this URL.
      if (!has('hreflang_reciprocity_missing'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN hreflang_reciprocity_missing INTEGER NOT NULL DEFAULT 0',
        );
      // Number of hreflang targets that are non-200, noindex, or
      // canonicalised away. Aggregated count for surfacing as a single
      // "Hreflang Target Issues" filter.
      if (!has('hreflang_target_issues'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN hreflang_target_issues INTEGER NOT NULL DEFAULT 0',
        );
    },
  },
  {
    version: 27,
    name: 'add_extraction_results',
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      if (!cols.some((c) => c.name === 'extraction_results')) {
        db.exec('ALTER TABLE urls ADD COLUMN extraction_results TEXT');
      }
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
