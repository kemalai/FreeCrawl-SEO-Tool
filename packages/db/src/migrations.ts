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
  {
    version: 28,
    name: 'add_v0_3_issue_columns',
    // TEMA 10 — extra signals surfaced as columns so issue counts/filters
    // are simple SQL without a re-parse on read. Each is independently
    // null-safe + defaulted so old projects upgrade cleanly.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('title_count'))
        db.exec('ALTER TABLE urls ADD COLUMN title_count INTEGER NOT NULL DEFAULT 0');
      if (!has('images_empty_alt'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN images_empty_alt INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('empty_anchor_count'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN empty_anchor_count INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('apple_touch_icon'))
        db.exec('ALTER TABLE urls ADD COLUMN apple_touch_icon TEXT');
      if (!has('manifest_url')) db.exec('ALTER TABLE urls ADD COLUMN manifest_url TEXT');
      if (!has('feed_url')) db.exec('ALTER TABLE urls ADD COLUMN feed_url TEXT');
    },
  },
  {
    version: 29,
    name: 'add_microdata_rdfa_pixel_width',
    // TEMA 11 — Microdata/RDFa counts, insecure form action + missing-SRI
    // counters, plus pixel-width estimates for title/meta so the SERP
    // truncation issue checks are pure SQL.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('microdata_count'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN microdata_count INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('rdfa_count'))
        db.exec('ALTER TABLE urls ADD COLUMN rdfa_count INTEGER NOT NULL DEFAULT 0');
      if (!has('insecure_form_action_count'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN insecure_form_action_count INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('missing_sri_count'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN missing_sri_count INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('title_pixel_width'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN title_pixel_width INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('meta_pixel_width'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN meta_pixel_width INTEGER NOT NULL DEFAULT 0',
        );
    },
  },
  {
    version: 30,
    name: 'add_ttfb_and_cookies',
    // TEMA 12 — TTFB measurement (excludes retry overhead) + cookie
    // security flag analysis (Secure / HttpOnly / SameSite). Cookie values
    // themselves are never stored — only per-page counts of how many were
    // missing each flag.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('ttfb_ms')) db.exec('ALTER TABLE urls ADD COLUMN ttfb_ms INTEGER');
      if (!has('cookies_count'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN cookies_count INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('cookies_insecure'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN cookies_insecure INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('cookies_no_httponly'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN cookies_no_httponly INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('cookies_no_samesite'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN cookies_no_samesite INTEGER NOT NULL DEFAULT 0',
        );
    },
  },
  {
    version: 31,
    name: 'add_http_protocol_and_query_length',
    // TEMA 13 — HTTP protocol indicator (Alt-Svc heuristic) + query
    // string length, surfaced as columns so URL-structure issue checks
    // are pure SQL.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('http_protocol'))
        db.exec('ALTER TABLE urls ADD COLUMN http_protocol TEXT');
      if (!has('query_string_length'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN query_string_length INTEGER NOT NULL DEFAULT 0',
        );
    },
  },
  {
    version: 32,
    name: 'add_render_blocking_and_keepalive',
    // TEMA 14 — Performance signals: head-blocking script/style count +
    // HTTP keep-alive presence. Both surface as integer columns so the
    // issue checks are pure SQL.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('render_blocking_count'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN render_blocking_count INTEGER NOT NULL DEFAULT 0',
        );
      // 1 = keep-alive enabled (or implicit), 0 = `Connection: close` seen.
      // -1 sentinel (default) = no signal yet (older rows / pre-migration).
      if (!has('keep_alive'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN keep_alive INTEGER NOT NULL DEFAULT -1',
        );
    },
  },
  {
    version: 33,
    name: 'add_url_sources_table',
    // TEMA 16 — View Source detail tab. Body HTML is stored in a sibling
    // table so the hot `urls` rowset stays compact (the body can be
    // hundreds of KB per page; keeping it inline would bloat every list
    // query). Truncated to a configurable cap (default 1 MB) so memory
    // stays bounded on huge crawls.
    up: `
      CREATE TABLE IF NOT EXISTS url_sources (
        url_id        INTEGER PRIMARY KEY REFERENCES urls(id) ON DELETE CASCADE,
        body          TEXT NOT NULL,
        body_length   INTEGER NOT NULL,
        truncated     INTEGER NOT NULL DEFAULT 0,
        captured_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
  {
    version: 34,
    name: 'add_analytics_trackers',
    // TEMA 17 — Per-page detected analytics / marketing trackers stored as
    // a JSON array of `{ name, id }` objects. Single-column variable-shape
    // storage avoids a child table for what's typically 0-5 entries per
    // page, and the existing JSON columns (extraction_results, hreflangs)
    // already use this idiom.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      if (!cols.some((c) => c.name === 'analytics_trackers')) {
        db.exec('ALTER TABLE urls ADD COLUMN analytics_trackers TEXT');
      }
    },
  },
  {
    version: 35,
    name: 'add_image_size_columns',
    // TEMA 20 — Add `byte_size` + `probed_at` + `probe_status` to the
    // `images` table so we can flag oversize internal images. Filled by an
    // opt-in HEAD probe pass after the main HTML crawl finishes (cheap:
    // HEAD only, no body download). Null `byte_size` = never probed (so
    // we don't false-positive missing data as "fits within budget").
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(images)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('byte_size')) db.exec('ALTER TABLE images ADD COLUMN byte_size INTEGER');
      if (!has('probed_at')) db.exec('ALTER TABLE images ADD COLUMN probed_at TEXT');
      if (!has('probe_status'))
        db.exec('ALTER TABLE images ADD COLUMN probe_status INTEGER');
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_images_byte_size ON images(byte_size) WHERE byte_size IS NOT NULL',
      );
    },
  },
  {
    version: 36,
    name: 'add_host_certs_table',
    // TEMA 21 — Per-host TLS certificate inspection. Stored in a sibling
    // table keyed by host because most sites have many URLs per host but
    // only one cert; denormalising onto `urls` would duplicate the same
    // expiry date 10k times on a moderate crawl. Filled by a post-crawl
    // TLS-probe pass (one connect per unique HTTPS host).
    up: `
      CREATE TABLE IF NOT EXISTS host_certs (
        host                 TEXT PRIMARY KEY,
        port                 INTEGER NOT NULL DEFAULT 443,
        valid_from           TEXT,
        valid_to             TEXT,
        days_until_expiry    INTEGER,
        issuer               TEXT,
        subject               TEXT,
        signature_algorithm  TEXT,
        protocol             TEXT,
        probe_status         INTEGER NOT NULL DEFAULT 0,
        probe_error          TEXT,
        probed_at            TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_host_certs_expiry
        ON host_certs(days_until_expiry)
        WHERE days_until_expiry IS NOT NULL;
    `,
  },
  {
    version: 37,
    name: 'add_form_accessibility_and_lazy_load',
    // TEMA 25 — Per-page accessibility / performance counters that the
    // HTML parser computes but didn't have a column to land in. All
    // three default to 0 so old projects still upsert cleanly.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('form_input_count'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN form_input_count INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('form_input_unlabeled'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN form_input_unlabeled INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('images_lazy'))
        db.exec('ALTER TABLE urls ADD COLUMN images_lazy INTEGER NOT NULL DEFAULT 0');
    },
  },
  {
    version: 38,
    name: 'add_headings_outline',
    // TEMA 26 — Per-page heading outline as a JSON array. Single-column
    // variable-shape storage (same idiom as `hreflangs`, `analytics_trackers`).
    // Drives the Detail Panel "Outline" sub-tab.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      if (!cols.some((c) => c.name === 'headings')) {
        db.exec('ALTER TABLE urls ADD COLUMN headings TEXT');
      }
    },
  },
  {
    version: 39,
    name: 'add_server_header',
    // TEMA 32 — Capture the `Server` response header for stack auditing
    // (nginx / Apache / cloudflare / IIS / Caddy / etc.). Already
    // captured by the crawler into the headers table; mirroring it onto
    // the urls row makes the per-page lookup + stack-rollup report a
    // simple SELECT instead of a JOIN.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      if (!cols.some((c) => c.name === 'server_header')) {
        db.exec('ALTER TABLE urls ADD COLUMN server_header TEXT');
      }
    },
  },
  {
    version: 40,
    name: 'add_js_only_links_count',
    // Wave 2 / item 1 — Per-page count of `<a>` elements that are NOT
    // crawlable: no href + onclick, href="javascript:…", or href="#"
    // with onclick. Powers the "JS-Only Navigation" issue filter.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      if (!cols.some((c) => c.name === 'js_only_links_count')) {
        db.exec(
          'ALTER TABLE urls ADD COLUMN js_only_links_count INTEGER NOT NULL DEFAULT 0',
        );
      }
    },
  },
  {
    version: 41,
    name: 'add_text_code_ratio',
    // Wave 2 / item 4 — Per-page text/code ratio = visible-text bytes
    // divided by total HTML bytes, expressed as integer percent
    // (0–100). Powers the "Low Text/Code Ratio (<10%)" issue filter.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      if (!cols.some((c) => c.name === 'text_code_ratio')) {
        db.exec('ALTER TABLE urls ADD COLUMN text_code_ratio INTEGER');
      }
    },
  },
  {
    version: 42,
    name: 'add_urls_issues_materialized',
    // I-3 — Materialised issue table. Lets the sidebar count counters
    // that would otherwise need O(n²) correlated subqueries (dead
    // external domain, duplicate URL post-norm, canonical chain
    // multi-hop, …) read with a single GROUP BY instead. Refilled
    // once per crawl by `recomputeUrlsIssues()`.
    //   - `url_id`     : FK-shaped (no constraint — ON DELETE handled
    //                    by the recompute pass that TRUNCATEs first)
    //   - `issue_key`  : the 'issues:*' UrlCategory string
    //   PRIMARY KEY ensures idempotent INSERT-OR-IGNORE on incremental
    //   updates. Index on `issue_key` powers the count-grouping query.
    up: `
      CREATE TABLE IF NOT EXISTS urls_issues (
        url_id    INTEGER NOT NULL,
        issue_key TEXT    NOT NULL,
        PRIMARY KEY (url_id, issue_key)
      );
      CREATE INDEX IF NOT EXISTS idx_urls_issues_key ON urls_issues(issue_key);
    `,
  },
  {
    version: 43,
    name: 'add_pagination_sequence_break',
    // Wave 2.5 — Per-page boolean flag set by `recomputePaginationSequence()`
    // when this URL is part of a paginated cluster (its `pagination_next`
    // or `pagination_prev` resolved to another crawled URL with the same
    // template) AND the cluster's numeric ordinals have a gap (e.g.
    // ?page=1 → ?page=2 → ?page=4 misses 3). Powers the
    // "Pagination Sequence Break" issue filter.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      if (!cols.some((c) => c.name === 'pagination_sequence_break')) {
        db.exec(
          'ALTER TABLE urls ADD COLUMN pagination_sequence_break INTEGER NOT NULL DEFAULT 0',
        );
      }
    },
  },
  {
    version: 44,
    name: 'add_crawl_queue_checkpoint',
    // Wave 6 — Periodic checkpoint of pending queue items so an
    // unexpected exit (process crash, OS reboot, OOM kill) can resume
    // the crawl on next launch. Three columns:
    //   - `url`      : the URL that was waiting to be fetched
    //   - `depth`    : its enqueue depth so the resumed crawl respects
    //                  `maxDepth` correctly
    //   - `seed_url` : discriminates stale checkpoints when the user
    //                  has changed start URL between crashes; the
    //                  resume prompt only fires if seeds match.
    up: `
      CREATE TABLE IF NOT EXISTS crawl_queue (
        url       TEXT PRIMARY KEY,
        depth     INTEGER NOT NULL DEFAULT 0,
        seed_url  TEXT NOT NULL DEFAULT ''
      );
    `,
  },
  {
    version: 45,
    name: 'add_hreflang_inconsistent_lang',
    // Wave 6 — Boolean per-URL flag set by `recomputeHreflangInconsistent()`
    // when the page's hreflang JSON contains the same `lang` value with
    // two different target URLs. Powers the
    // "Hreflang Inconsistent Lang" issue filter.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      if (!cols.some((c) => c.name === 'hreflang_inconsistent_lang')) {
        db.exec(
          'ALTER TABLE urls ADD COLUMN hreflang_inconsistent_lang INTEGER NOT NULL DEFAULT 0',
        );
      }
    },
  },
  {
    version: 46,
    name: 'add_readability_columns',
    // Per-URL readability fields populated by `parseHtml()` from the body
    // text it already tokenises for word count. Stored as REAL so the UI
    // can render `flesch_reading_ease=58.3` without rounding.
    //   - flesch_reading_ease     (0–100, higher = easier; <30 = "very difficult")
    //   - flesch_kincaid_grade    (US grade level; 8 ≈ 8th grade)
    //   - gunning_fog_index       (years of formal education needed)
    //   - sentence_count          (used by all three formulas; surfaced in detail)
    //   - complex_word_count      (≥3-syllable non-suffix words; Gunning Fog input)
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('flesch_reading_ease')) db.exec('ALTER TABLE urls ADD COLUMN flesch_reading_ease REAL');
      if (!has('flesch_kincaid_grade')) db.exec('ALTER TABLE urls ADD COLUMN flesch_kincaid_grade REAL');
      if (!has('gunning_fog_index')) db.exec('ALTER TABLE urls ADD COLUMN gunning_fog_index REAL');
      if (!has('sentence_count'))
        db.exec('ALTER TABLE urls ADD COLUMN sentence_count INTEGER NOT NULL DEFAULT 0');
      if (!has('complex_word_count'))
        db.exec('ALTER TABLE urls ADD COLUMN complex_word_count INTEGER NOT NULL DEFAULT 0');
    },
  },
  {
    version: 47,
    name: 'add_cors_columns',
    // CORS response-header audit fields. Captured per URL so the
    // "CORS Wildcard + Credentials" + "CORS Wildcard Origin" issue
    // filters can flag misconfigured origins, and the URL Details panel
    // can render the values for review.
    //   - cors_allow_origin       (raw header, e.g. `*`, `https://x.com`, `null`)
    //   - cors_allow_credentials  (-1 missing / 0 false / 1 true)
    //   - cors_allow_methods      (raw header)
    //   - cors_allow_headers      (raw header, often verbose; truncated upstream)
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('cors_allow_origin'))
        db.exec('ALTER TABLE urls ADD COLUMN cors_allow_origin TEXT');
      if (!has('cors_allow_credentials'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN cors_allow_credentials INTEGER NOT NULL DEFAULT -1',
        );
      if (!has('cors_allow_methods'))
        db.exec('ALTER TABLE urls ADD COLUMN cors_allow_methods TEXT');
      if (!has('cors_allow_headers'))
        db.exec('ALTER TABLE urls ADD COLUMN cors_allow_headers TEXT');
    },
  },
  {
    version: 48,
    name: 'split_mixed_content_active_passive',
    // Split the legacy `mixed_content_count` into the two browser-policy
    // tiers:
    //   - active   (script / iframe / object / embed / link rel=stylesheet)
    //                — Chrome / Firefox / Safari BLOCK these on HTTPS;
    //                  the page silently misses script/CSS subresources.
    //   - passive  (img / video / audio / source)
    //                — browsers downgrade to "Not Secure" UI but render.
    // Both columns coexist with the existing `mixed_content_count` so
    // older code paths keep working. Backfill is a no-op — the legacy
    // column was a sum, so it doesn't tell us the split for past crawls.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('mixed_content_active'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN mixed_content_active INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('mixed_content_passive'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN mixed_content_passive INTEGER NOT NULL DEFAULT 0',
        );
    },
  },
  {
    version: 49,
    name: 'add_responsive_imagery_columns',
    // Track responsive-imagery adoption per page so the "Responsive
    // Images Missing" issue filter can surface image-heavy pages that
    // ship a single `<img src>` (no `srcset`, no `<picture>`) — a
    // missed mobile-bandwidth optimisation lever and a common LCP
    // regression on retina screens.
    //   - `images_responsive`: count of `<img>` slots that carry
    //     `srcset` themselves OR sit inside a `<picture>` parent.
    //   - `picture_count`:     count of `<picture>` elements; useful
    //     on its own as an art-direction adoption signal.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('images_responsive'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN images_responsive INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('picture_count'))
        db.exec('ALTER TABLE urls ADD COLUMN picture_count INTEGER NOT NULL DEFAULT 0');
    },
  },
  {
    version: 50,
    name: 'add_malformed_og_extras_android_icon',
    // V1 Faz 1 polish bundle (6 columns, single migration):
    //   - `url_malformed`     0/1 — set when the canonical URL string
    //     contains structural issues that browsers tolerate but search
    //     engines / log analysers may diverge on (multiple `?`, multiple
    //     `#`, control chars, unescaped reserved chars, double-encoding
    //     sequences). Surfaces as the "Malformed URL" issue filter.
    //   - `og_type`/`og_url`/`og_site_name`/`og_locale` — the four
    //     remaining OpenGraph meta tags we weren't yet capturing.
    //     Useful for share-card validation and locale-aware crawls.
    //   - `android_icon` — first `<link rel="icon">` with sizes ≥
    //     192x192, the resolution Android home-screen uses for PWA
    //     icons. Distinct from the smaller favicon.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('url_malformed'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN url_malformed INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('og_type')) db.exec('ALTER TABLE urls ADD COLUMN og_type TEXT');
      if (!has('og_url')) db.exec('ALTER TABLE urls ADD COLUMN og_url TEXT');
      if (!has('og_site_name'))
        db.exec('ALTER TABLE urls ADD COLUMN og_site_name TEXT');
      if (!has('og_locale')) db.exec('ALTER TABLE urls ADD COLUMN og_locale TEXT');
      if (!has('android_icon'))
        db.exec('ALTER TABLE urls ADD COLUMN android_icon TEXT');
    },
  },
  {
    version: 51,
    name: 'add_manifest_json_and_cert_chain_columns',
    // V1 Faz 1 final bundle:
    //   urls.manifest_json        — raw parsed manifest JSON (string,
    //                                ~2 KB cap recommended at write time)
    //                                so the Detail panel can show every
    //                                custom field without us shaping
    //                                a column for each.
    //   urls.manifest_theme_color — `theme_color` shorthand for the
    //                                Stack / Server color tinting in
    //                                the URL Details panel.
    //   urls.manifest_short_name  — `short_name` (home-screen label).
    //   urls.manifest_display     — `display` (e.g. `standalone`).
    //   urls.manifest_scope       — `scope` (PWA install scope URL).
    //   urls.manifest_icon_count  — number of icons in the parsed manifest.
    //
    //   host_certs.chain_length   — total certificates in the peer-cert
    //                                chain (1 = self-signed, 2 = leaf
    //                                + root, ≥3 = intermediate(s) +
    //                                root). Surfaces partial / missing
    //                                chain misconfigurations.
    //   host_certs.chain_subjects — JSON-stringified subject DN list,
    //                                root-first order (max 5 hops).
    up: (db) => {
      const urlCols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const hasUrl = (n: string) => urlCols.some((c) => c.name === n);
      if (!hasUrl('manifest_json'))
        db.exec('ALTER TABLE urls ADD COLUMN manifest_json TEXT');
      if (!hasUrl('manifest_theme_color'))
        db.exec('ALTER TABLE urls ADD COLUMN manifest_theme_color TEXT');
      if (!hasUrl('manifest_short_name'))
        db.exec('ALTER TABLE urls ADD COLUMN manifest_short_name TEXT');
      if (!hasUrl('manifest_display'))
        db.exec('ALTER TABLE urls ADD COLUMN manifest_display TEXT');
      if (!hasUrl('manifest_scope'))
        db.exec('ALTER TABLE urls ADD COLUMN manifest_scope TEXT');
      if (!hasUrl('manifest_icon_count'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN manifest_icon_count INTEGER NOT NULL DEFAULT 0',
        );

      const certCols = db
        .prepare('PRAGMA table_info(host_certs)')
        .all() as unknown as { name: string }[];
      const hasCert = (n: string) => certCols.some((c) => c.name === n);
      if (!hasCert('chain_length'))
        db.exec('ALTER TABLE host_certs ADD COLUMN chain_length INTEGER');
      if (!hasCert('chain_subjects'))
        db.exec('ALTER TABLE host_certs ADD COLUMN chain_subjects TEXT');
    },
  },
  {
    version: 52,
    name: 'add_a11y_landmark_skiplink_aria_columns',
    // V1 Faz 2 ilk batch — accessibility / a11y issue filter columns:
    //   - `landmark_main`        0/1 — page has `<main>` element OR
    //                              `role="main"` somewhere. Pages
    //                              without a main landmark fail WCAG
    //                              1.3.1 (info-and-relationships) and
    //                              break screen-reader navigation.
    //   - `skip_link_present`    0/1 — first interactive element in
    //                              `<body>` is an in-page skip link
    //                              (`<a href="#main">…</a>` style).
    //                              WCAG 2.4.1 (bypass blocks).
    //   - `aria_invalid_roles`   count of `role="…"` attribute values
    //                              that aren't part of the WAI-ARIA
    //                              role taxonomy. Common typos
    //                              ("buttn", "navagation") and legacy
    //                              made-up roles surface here.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('landmark_main'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN landmark_main INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('skip_link_present'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN skip_link_present INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('aria_invalid_roles'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN aria_invalid_roles INTEGER NOT NULL DEFAULT 0',
        );
    },
  },
  {
    version: 53,
    name: 'add_structured_data_validation_columns',
    // V1 Faz 2 batch 2 — structured-data validation:
    //   - `schema_duplicate_ids` count of `@id` values that appear
    //     more than once across the page's JSON-LD blocks. Two
    //     entities sharing an `@id` collide in Google's knowledge
    //     graph; a CMS bug typically caused by a copy-pasted block.
    //   - `schema_unknown_types` count of `@type` values that look
    //     malformed: empty string, whitespace inside, lowercase first
    //     letter (Schema.org convention is PascalCase), or otherwise
    //     non-conforming. Catches typos like `"product"` (should be
    //     `"Product"`) without needing a full ~750-entry taxonomy.
    //   - `schema_missing_required` count of JSON-LD nodes whose
    //     declared `@type` is one of the high-traffic types
    //     (Article / NewsArticle / Product / BreadcrumbList / Recipe
    //     / Event / FAQPage / HowTo / Organization / VideoObject)
    //     and which is missing one or more Google-documented
    //     required properties.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('schema_duplicate_ids'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN schema_duplicate_ids INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('schema_unknown_types'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN schema_unknown_types INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('schema_missing_required'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN schema_missing_required INTEGER NOT NULL DEFAULT 0',
        );
    },
  },
  {
    version: 54,
    name: 'add_heading_order_and_subresource_count',
    // V1 Faz 2 closeout — final two HTML-only issue filters:
    //   - `heading_order_violations` count of times a heading skips
    //     levels (e.g. h1→h3 = 1, h1→h4 = 1) computed from the source-
    //     order outline. Replaces the earlier coarse h2-missing-but-h3-
    //     present SQL approximation in `headingSkippedLevel` with a
    //     precise per-page count. Old rows default to 0 (no violation
    //     counted) until they're recrawled.
    //   - `subresource_request_count` total number of fetched
    //     subresources the page declares: `<img>` + `<script src>` +
    //     `<link rel="stylesheet">` + `<iframe>` + `<video src>` +
    //     `<audio src>`. Powers the "Too Many Requests" issue filter
    //     (>100 typical threshold) — high request count is a known LCP
    //     regression on slower connections.
    up: (db) => {
      const cols = db.prepare('PRAGMA table_info(urls)').all() as unknown as {
        name: string;
      }[];
      const has = (n: string) => cols.some((c) => c.name === n);
      if (!has('heading_order_violations'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN heading_order_violations INTEGER NOT NULL DEFAULT 0',
        );
      if (!has('subresource_request_count'))
        db.exec(
          'ALTER TABLE urls ADD COLUMN subresource_request_count INTEGER NOT NULL DEFAULT 0',
        );
    },
  },
  {
    version: 55,
    name: 'add_pagespeed_results_table',
    // V1 Faz 7 — Google PageSpeed Insights integration. Audit results
    // live in their own table rather than as `urls` columns: PSI is run
    // on-demand against a user-selected subset (never the whole crawl),
    // each URL can have up to two rows (mobile + desktop), and keeping
    // it separate avoids widening the already-very-wide `urls` table.
    //
    //   url         — the audited page URL (joins back to `urls.url`).
    //   strategy    — 'mobile' | 'desktop' form factor.
    //   performance — Lighthouse Performance score 0–100 (null if N/A).
    //   lcp/fcp/tbt/speed_index — lab timing metrics in milliseconds.
    //   cls         — Cumulative Layout Shift (unitless).
    //   status      — 'ok' when the audit completed, 'error' otherwise.
    //   error       — failure reason when status='error'.
    //   fetched_at  — ISO timestamp of the audit.
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS pagespeed_results (
          url         TEXT NOT NULL,
          strategy    TEXT NOT NULL,
          performance INTEGER,
          lcp         REAL,
          cls         REAL,
          fcp         REAL,
          tbt         REAL,
          speed_index REAL,
          status      TEXT NOT NULL,
          error       TEXT,
          fetched_at  TEXT NOT NULL,
          PRIMARY KEY (url, strategy)
        );
      `);
    },
  },
  {
    version: 56,
    name: 'add_image_usages_from_index',
    // `image_usages` had an index on `image_id` but none on
    // `from_url_id`. The per-URL write path now deletes a page's prior
    // `image_usages` rows before re-inserting (so a re-crawl doesn't
    // duplicate them) — without this index that DELETE would full-scan
    // the table on every URL write, turning a re-crawl into O(n²).
    up: (db) => {
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_image_usages_from ON image_usages(from_url_id);',
      );
    },
  },
  {
    version: 57,
    name: 'add_gsc_results_table',
    // V1 Faz 7 — Google Search Console integration. Per-page clicks /
    // impressions / CTR / position pulled from the Search Console API,
    // keyed by the page URL so the Search Console tab can LEFT JOIN it
    // onto the crawled `urls`. Like `pagespeed_results` this lives in
    // its own table — the data is fetched on demand for a date range,
    // wholesale-replaced on each pull, and not part of the crawl.
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS gsc_results (
          url         TEXT PRIMARY KEY,
          clicks      INTEGER NOT NULL DEFAULT 0,
          impressions INTEGER NOT NULL DEFAULT 0,
          ctr         REAL NOT NULL DEFAULT 0,
          position    REAL NOT NULL DEFAULT 0,
          fetched_at  TEXT NOT NULL
        );
      `);
    },
  },
  {
    version: 58,
    name: 'add_ga4_results_table',
    // V1 Faz 7 — Google Analytics 4 integration. Per-page sessions /
    // users / pageviews / engagement-rate / avg-session-duration pulled
    // from the GA4 Data API on demand for a date range. Lives in its
    // own table for the same reasons as `pagespeed_results` /
    // `gsc_results` — wholesale-replaced per pull, not part of the
    // crawl, joined onto the crawled `urls` via the page URL.
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS ga4_results (
          url                  TEXT PRIMARY KEY,
          sessions             INTEGER NOT NULL DEFAULT 0,
          users                INTEGER NOT NULL DEFAULT 0,
          pageviews            INTEGER NOT NULL DEFAULT 0,
          engagement_rate      REAL NOT NULL DEFAULT 0,
          avg_session_duration REAL NOT NULL DEFAULT 0,
          fetched_at           TEXT NOT NULL
        );
      `);
    },
  },
  {
    version: 59,
    name: 'add_ai_results_table',
    // V1 Faz 7 — AI integrations (OpenAI / Anthropic / Ollama). One row
    // per (url, provider) — re-running a prompt overwrites the prior
    // response for that URL on that provider. Status/error live in the
    // same row so an AI tab cell can render either a successful
    // response or the failure reason without joining a second table.
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS ai_results (
          url        TEXT NOT NULL,
          provider   TEXT NOT NULL,
          model      TEXT NOT NULL,
          response   TEXT NOT NULL,
          tokens_in  INTEGER,
          tokens_out INTEGER,
          status     TEXT NOT NULL,
          error      TEXT,
          fetched_at TEXT NOT NULL,
          PRIMARY KEY (url, provider)
        );
      `);
    },
  },
  {
    version: 60,
    name: 'add_seo_results_table',
    // V1 Faz 7 — third-party SEO authority providers (Ahrefs / Majestic /
    // Moz / Semrush). Per-URL metrics stored as a JSON blob since each
    // provider returns a different metric set; the SEO tab parses
    // shape based on the `provider` column.
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS seo_results (
          url        TEXT NOT NULL,
          provider   TEXT NOT NULL,
          metrics    TEXT,
          status     TEXT NOT NULL,
          error      TEXT,
          fetched_at TEXT NOT NULL,
          PRIMARY KEY (url, provider)
        );
      `);
    },
  },
  {
    version: 61,
    name: 'add_gsc_inspection_table',
    // V1 Faz 7 — Google Search Console URL Inspection API results.
    // Separate from `gsc_results` (Search Analytics) because inspection
    // is per-URL with a hard 2 K/day quota and its own response shape:
    // verdict / coverageState / lastCrawlTime / robotsTxtState /
    // indexingState / canonical info.
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS gsc_inspection_results (
          url               TEXT PRIMARY KEY,
          verdict           TEXT,
          coverage_state    TEXT,
          robots_txt_state  TEXT,
          indexing_state    TEXT,
          last_crawl_time   TEXT,
          google_canonical  TEXT,
          user_canonical    TEXT,
          status            TEXT NOT NULL,
          error             TEXT,
          fetched_at        TEXT NOT NULL
        );
      `);
    },
  },
  {
    version: 62,
    name: 'add_rendered_body_column',
    // V2 Faz 1 — JavaScript rendering. Stores the post-JS DOM dump
    // captured by Playwright alongside the raw HTML in `url_sources`.
    // When `renderingMode === 'js'`, the crawler fills `rendered_body`
    // and re-uses `body` for the pre-JS HTML so users can diff the two
    // in the View Rendered HTML detail sub-tab.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(url_sources)')
        .all() as unknown as { name: string }[];
      if (!cols.some((c) => c.name === 'rendered_body')) {
        db.exec('ALTER TABLE url_sources ADD COLUMN rendered_body TEXT');
      }
      if (!cols.some((c) => c.name === 'rendered_body_length')) {
        db.exec(
          'ALTER TABLE url_sources ADD COLUMN rendered_body_length INTEGER',
        );
      }
      if (!cols.some((c) => c.name === 'render_ms')) {
        db.exec('ALTER TABLE url_sources ADD COLUMN render_ms INTEGER');
      }
    },
  },
  {
    version: 63,
    name: 'add_screenshot_lcp_mobile_columns',
    // V2 Faz 1 Increment 3+4 — Screenshot capture + LCP candidate +
    // Mobile Usability. Screenshot files live as PNGs on disk under
    // the project's `screenshots/` sidecar folder; the DB only stores
    // the file paths (relative-to-project-dir when possible). LCP +
    // mobile-usability fields live on the urls table because they're
    // queried alongside other per-URL fields in the main grid.
    up: (db) => {
      const srcCols = db
        .prepare('PRAGMA table_info(url_sources)')
        .all() as unknown as { name: string }[];
      if (!srcCols.some((c) => c.name === 'screenshot_fullpage_path')) {
        db.exec(
          'ALTER TABLE url_sources ADD COLUMN screenshot_fullpage_path TEXT',
        );
      }
      if (!srcCols.some((c) => c.name === 'screenshot_fold_path')) {
        db.exec('ALTER TABLE url_sources ADD COLUMN screenshot_fold_path TEXT');
      }
      if (!srcCols.some((c) => c.name === 'screenshot_mobile_path')) {
        db.exec(
          'ALTER TABLE url_sources ADD COLUMN screenshot_mobile_path TEXT',
        );
      }
      const urlCols = db
        .prepare('PRAGMA table_info(urls)')
        .all() as unknown as { name: string }[];
      if (!urlCols.some((c) => c.name === 'lcp_selector')) {
        db.exec('ALTER TABLE urls ADD COLUMN lcp_selector TEXT');
      }
      if (!urlCols.some((c) => c.name === 'lcp_tag')) {
        db.exec('ALTER TABLE urls ADD COLUMN lcp_tag TEXT');
      }
      if (!urlCols.some((c) => c.name === 'lcp_width')) {
        db.exec('ALTER TABLE urls ADD COLUMN lcp_width INTEGER');
      }
      if (!urlCols.some((c) => c.name === 'lcp_height')) {
        db.exec('ALTER TABLE urls ADD COLUMN lcp_height INTEGER');
      }
      if (!urlCols.some((c) => c.name === 'lcp_coverage')) {
        db.exec('ALTER TABLE urls ADD COLUMN lcp_coverage REAL');
      }
      if (!urlCols.some((c) => c.name === 'lcp_resource_url')) {
        db.exec('ALTER TABLE urls ADD COLUMN lcp_resource_url TEXT');
      }
      // mobile_usable: -1 = not audited, 0 = fails one or more checks, 1 = pass.
      if (!urlCols.some((c) => c.name === 'mobile_usable')) {
        db.exec(
          'ALTER TABLE urls ADD COLUMN mobile_usable INTEGER NOT NULL DEFAULT -1',
        );
      }
      if (!urlCols.some((c) => c.name === 'mobile_overflow_px')) {
        db.exec(
          'ALTER TABLE urls ADD COLUMN mobile_overflow_px INTEGER NOT NULL DEFAULT 0',
        );
      }
      if (!urlCols.some((c) => c.name === 'mobile_viewport_meta')) {
        db.exec(
          'ALTER TABLE urls ADD COLUMN mobile_viewport_meta INTEGER NOT NULL DEFAULT -1',
        );
      }
    },
  },
  {
    version: 64,
    name: 'add_amp_validation_columns',
    // V2 Faz 16 — AMP smoke validation. Pages that declare themselves
    // AMP via `<html ⚡>` / `<html amp>` are validated against a
    // hand-rolled subset of the AMP spec (boilerplate, runtime, charset,
    // viewport, canonical, forbidden tags) — full spec needs Google's
    // 10+ MB validator.js which is overkill for a desktop tool.
    //
    // `amp_page` is 0 when the page isn't AMP and 1 when the `<html>`
    // tag carries the AMP marker. `amp_validation_errors` is a JSON
    // array of short error codes (e.g. `["missing-boilerplate",
    // "forbidden-style-tag"]`); empty array means clean AMP page.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(urls)')
        .all() as unknown as { name: string }[];
      if (!cols.some((c) => c.name === 'amp_page')) {
        db.exec(
          'ALTER TABLE urls ADD COLUMN amp_page INTEGER NOT NULL DEFAULT 0',
        );
      }
      if (!cols.some((c) => c.name === 'amp_validation_errors')) {
        db.exec('ALTER TABLE urls ADD COLUMN amp_validation_errors TEXT');
      }
    },
  },
  {
    version: 65,
    name: 'add_boilerplate_coverage',
    // V2 Faz 14 #5 — Template / boilerplate detection. Memory-bounded
    // post-crawl pass samples up to ~2K stored bodies, generates
    // 5-word shingles (FNV-1a hashed), identifies shingles appearing
    // on > 30% of sampled pages as "boilerplate", and writes a per-URL
    // coverage percentage (0-100) to this column. NULL = not yet
    // computed (or page wasn't in the sample / had no body snapshot).
    // 50+ is the "high boilerplate" threshold for the dedicated issue
    // filter — typical templated pages with thin content land here.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(urls)')
        .all() as unknown as { name: string }[];
      if (!cols.some((c) => c.name === 'boilerplate_coverage')) {
        db.exec('ALTER TABLE urls ADD COLUMN boilerplate_coverage INTEGER');
      }
    },
  },
  {
    version: 66,
    name: 'add_social_image_dimensions',
    // V2 Faz 16 #1 — Social image aspect-ratio validation. The post-crawl
    // `runSocialImageProbes()` pass does a ranged GET on each distinct
    // og:image / twitter:image URL, parses the pixel width × height out
    // of the image header (PNG/JPEG/GIF/WebP/BMP), and stamps them onto
    // every page that referenced that image. NULL = not yet probed;
    // 0 = probed but undecodable / fetch failed (so we don't re-probe a
    // broken image every crawl); >0 = real dimensions. The dedicated
    // `og-image-wrong-aspect` / `twitter-image-wrong-aspect` issue
    // filters read these to flag images that won't render as a proper
    // share card (Facebook/LinkedIn 1.91:1, Twitter 2:1 or 1:1).
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(urls)')
        .all() as unknown as { name: string }[];
      for (const col of [
        'og_image_width',
        'og_image_height',
        'twitter_image_width',
        'twitter_image_height',
      ]) {
        if (!cols.some((c) => c.name === col)) {
          db.exec(`ALTER TABLE urls ADD COLUMN ${col} INTEGER`);
        }
      }
    },
  },
  {
    version: 67,
    name: 'add_pagespeed_interactivity_metrics',
    // V2 Faz 15 #1 — extend the PageSpeed audit row with the
    // interactivity metrics PSI returns beyond the existing LCP/CLS/FCP/
    // TBT/SpeedIndex set:
    //   tti                — Time to Interactive (lab, `interactive`), ms
    //   max_potential_fid  — Max Potential First Input Delay (lab,
    //                        `max-potential-fid`), ms — Lighthouse's
    //                        worst-case input-delay estimate, the closest
    //                        lab proxy for the deprecated field FID.
    //   inp                — Interaction to Next Paint, ms. INP is a field
    //                        (CrUX) metric and the Core Web Vital that
    //                        replaced FID in March 2024; pulled from the
    //                        PSI `loadingExperience` block, NULL when the
    //                        URL has no real-user data.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(pagespeed_results)')
        .all() as unknown as { name: string }[];
      for (const col of ['tti', 'max_potential_fid', 'inp']) {
        if (!cols.some((c) => c.name === col)) {
          db.exec(`ALTER TABLE pagespeed_results ADD COLUMN ${col} REAL`);
        }
      }
    },
  },
  {
    version: 68,
    name: 'add_a11y_audit_columns',
    // V2 Faz 16 — accessibility audit from the JS-render in-page pass.
    //   a11y_low_contrast     — count of sampled text elements whose
    //                           colour contrast is below WCAG AA
    //                           (4.5:1 normal / 3:1 large text). NULL
    //                           when the page wasn't rendered with the
    //                           a11y audit on; >=0 once audited.
    //   a11y_focus_suppressed — 0/1: a stylesheet rule removes the
    //                           keyboard focus outline (`:focus { outline:
    //                           none }`) without a compensating indicator
    //                           and no `:focus-visible` fallback. NULL =
    //                           not audited.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(urls)')
        .all() as unknown as { name: string }[];
      for (const col of ['a11y_low_contrast', 'a11y_focus_suppressed']) {
        if (!cols.some((c) => c.name === col)) {
          db.exec(`ALTER TABLE urls ADD COLUMN ${col} INTEGER`);
        }
      }
    },
  },
  {
    version: 69,
    name: 'add_budget_status',
    // V2 Faz 15 — performance budget verdict. The post-crawl
    // `recomputeBudgetViolations()` pass writes a bitmask per internal
    // 200 HTML page when the budget is enabled:
    //   bit 1 — response time (TTFB proxy) over `maxResponseMs`
    //   bit 2 — HTML transfer size over `maxPageBytes`
    //   bit 4 — LCP over `maxLcpMs`   (from PageSpeed lab data, if any)
    //   bit 8 — CLS over `maxCls`     (from PageSpeed data, if any)
    // 0 = evaluated and within budget; NULL = budget disabled or the
    // page wasn't an internal 200 HTML page. LCP/CLS bits only set when
    // PageSpeed data exists for the URL at crawl-finalize time.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(urls)')
        .all() as unknown as { name: string }[];
      if (!cols.some((c) => c.name === 'budget_status')) {
        db.exec('ALTER TABLE urls ADD COLUMN budget_status INTEGER');
      }
    },
  },
  {
    version: 70,
    name: 'add_schema_missing_recommended',
    // V2 Faz 16 — structured-data validation v2. Counts JSON-LD nodes
    // that satisfy their required props but omit one or more of the
    // type's Google-recommended properties (warning-level enrichment
    // signal, e.g. an Article without `author`/`dateModified`, a Product
    // without `aggregateRating`/`review`). Populated by the html-parser
    // schema-validation pass; 0 = no recommended-prop gaps on the page.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(urls)')
        .all() as unknown as { name: string }[];
      if (!cols.some((c) => c.name === 'schema_missing_recommended')) {
        db.exec(
          'ALTER TABLE urls ADD COLUMN schema_missing_recommended INTEGER NOT NULL DEFAULT 0',
        );
      }
    },
  },
  {
    version: 71,
    name: 'add_pdf_metadata',
    // V2 Faz 16 — PDF document metadata, extracted by the post-crawl
    // `runPdfMetadataProbes` pass (XMP packet preferred — uncompressed by
    // the PDF spec, so parseable without a full PDF library — with an
    // uncompressed Info-dictionary fallback). `pdf_probe_status`:
    // NULL = unprobed, 1 = probed with metadata, 0 = probed but nothing
    // found, <0 = fetch/parse error. The other columns are NULL until a
    // successful probe fills them.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(urls)')
        .all() as unknown as { name: string }[];
      const add = (name: string, type: string): void => {
        if (!cols.some((c) => c.name === name)) {
          db.exec(`ALTER TABLE urls ADD COLUMN ${name} ${type}`);
        }
      };
      add('pdf_title', 'TEXT');
      add('pdf_author', 'TEXT');
      add('pdf_page_count', 'INTEGER');
      add('pdf_creation_date', 'TEXT');
      add('pdf_producer', 'TEXT');
      add('pdf_probe_status', 'INTEGER');
    },
  },
  {
    version: 72,
    name: 'log_file_analyzer',
    // V2 Faz 2 — Log File Analyzer storage. Aggregate-on-ingest: the core
    // analyzer streams an access log and rolls it up into these compact
    // tables (no raw per-hit rows — a multi-GB log would be millions of
    // rows). Cumulative across files: re-ingesting another log merges into
    // the same aggregates. Everything is keyed on the request PATH; the
    // crawl × log join (orphans / crawl-budget) is done in JS against the
    // `urls` table since SQLite can't parse URLs.
    up: `
      CREATE TABLE IF NOT EXISTS log_ingests (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path     TEXT NOT NULL,
        file_name     TEXT NOT NULL,
        format        TEXT NOT NULL,
        total_lines   INTEGER NOT NULL DEFAULT 0,
        parsed_lines  INTEGER NOT NULL DEFAULT 0,
        skipped_lines INTEGER NOT NULL DEFAULT 0,
        min_ts        INTEGER,
        max_ts        INTEGER,
        ingested_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS log_url_stats (
        path            TEXT PRIMARY KEY,
        total_hits      INTEGER NOT NULL DEFAULT 0,
        bot_hits        INTEGER NOT NULL DEFAULT 0,
        googlebot_hits  INTEGER NOT NULL DEFAULT 0,
        bingbot_hits    INTEGER NOT NULL DEFAULT 0,
        yandexbot_hits  INTEGER NOT NULL DEFAULT 0,
        other_bot_hits  INTEGER NOT NULL DEFAULT 0,
        last_status     INTEGER,
        first_ts        INTEGER,
        last_ts         INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_log_url_total ON log_url_stats(total_hits);
      CREATE INDEX IF NOT EXISTS idx_log_url_bot ON log_url_stats(bot_hits);
      CREATE INDEX IF NOT EXISTS idx_log_url_googlebot ON log_url_stats(googlebot_hits);

      CREATE TABLE IF NOT EXISTS log_daily (
        day    TEXT NOT NULL,
        bucket TEXT NOT NULL,
        hits   INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (day, bucket)
      );

      CREATE TABLE IF NOT EXISTS log_status (
        status    INTEGER PRIMARY KEY,
        count     INTEGER NOT NULL DEFAULT 0,
        bot_count INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS log_bots (
        bot          TEXT PRIMARY KEY,
        family       TEXT NOT NULL,
        hits         INTEGER NOT NULL DEFAULT 0,
        total_ips    INTEGER NOT NULL DEFAULT 0,
        verified_ips INTEGER NOT NULL DEFAULT 0,
        verifiable   INTEGER NOT NULL DEFAULT 0
      );
    `,
  },
  {
    version: 73,
    name: 'log_url_bot',
    // V2 Faz 2 — per-(URL, bot) hit counts. The aggregate `log_url_stats`
    // only carries family-level columns (googlebot/bing/yandex/other), so
    // it can't answer "which pages did SemrushBot specifically hit?". This
    // table backs the URL Hits tab's per-bot filter. Cumulative across
    // ingests, same as the other log tables.
    up: `
      CREATE TABLE IF NOT EXISTS log_url_bot (
        path TEXT NOT NULL,
        bot  TEXT NOT NULL,
        hits INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (path, bot)
      );
      CREATE INDEX IF NOT EXISTS idx_log_url_bot_bot ON log_url_bot(bot);
    `,
  },
  {
    version: 74,
    name: 'add_link_score',
    // V2 — internal PageRank / link score. A per-URL 0..100 integer
    // computed post-crawl over the internal link graph (damping 0.85),
    // normalised so the most-linked page scores 100. NULL until the
    // post-crawl `recomputeLinkScore` pass runs; 0 when the crawl has no
    // internal edges to distribute equity through.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(urls)')
        .all() as unknown as { name: string }[];
      if (!cols.some((c) => c.name === 'link_score')) {
        db.exec('ALTER TABLE urls ADD COLUMN link_score INTEGER');
      }
    },
  },
  {
    version: 75,
    name: 'add_crux_results_table',
    // V2 — Chrome UX Report (CrUX) integration. Real-user field Core Web
    // Vitals live in their own table, mirroring `pagespeed_results`: CrUX
    // is fetched on-demand against a user-selected subset, each URL can
    // have up to two rows (phone + desktop), and it keeps the very-wide
    // `urls` table from growing further.
    //
    //   url          — the page URL (joins back to `urls.url`).
    //   form_factor  — 'phone' | 'desktop'.
    //   lcp/inp/fcp/ttfb — p75 timing metrics in milliseconds.
    //   cls          — p75 Cumulative Layout Shift (unitless).
    //   status       — 'ok' | 'nodata' (too little traffic) | 'error'.
    //   error        — failure reason when status='error'.
    //   collection_period — CrUX window end date (YYYY-MM-DD) when known.
    //   fetched_at   — ISO timestamp of the fetch.
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS crux_results (
          url               TEXT NOT NULL,
          form_factor       TEXT NOT NULL,
          lcp               REAL,
          cls               REAL,
          inp               REAL,
          fcp               REAL,
          ttfb              REAL,
          status            TEXT NOT NULL,
          error             TEXT,
          collection_period TEXT,
          fetched_at        TEXT NOT NULL,
          PRIMARY KEY (url, form_factor)
        );
      `);
    },
  },
  {
    version: 76,
    name: 'add_spelling_results_table',
    // V2 — Spelling & Grammar (LanguageTool). Like the other on-demand
    // audit integrations this lives in its own url-keyed table rather than
    // widening `urls`: checks run against a user-selected subset, and the
    // per-page match list is a variable-length JSON blob.
    //
    //   url         — the checked page URL (joins back to `urls.url`).
    //   language    — language code LanguageTool used (may be auto-detected).
    //   match_count — findings after the ignore-dictionary filter.
    //   matches     — JSON array of SpellingMatch objects.
    //   status      — 'ok' | 'skipped' (too little prose) | 'error'.
    //   error       — failure reason when status='error'.
    //   fetched_at  — ISO timestamp of the check.
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS spelling_results (
          url         TEXT PRIMARY KEY,
          language    TEXT,
          match_count INTEGER NOT NULL DEFAULT 0,
          matches     TEXT,
          status      TEXT NOT NULL,
          error       TEXT,
          fetched_at  TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_spelling_match_count
          ON spelling_results(match_count);
      `);
    },
  },
  {
    version: 77,
    name: 'add_urls_videos',
    // Video sitemap variant — per-page videos discovered by the parser
    // (`<video>` media + recognised YouTube/Vimeo embeds). Stored as a JSON
    // array of `{ contentLoc, playerLoc, thumbnail }` on `urls`, mirroring
    // the `hreflangs` column; null when the page has no detectable video.
    up: (db) => {
      db.exec('ALTER TABLE urls ADD COLUMN videos TEXT');
    },
  },
  {
    version: 78,
    name: 'add_a11y_mobile_columns',
    // Mobile-usability checks from the JS-render in-page a11y pass.
    //   a11y_small_font        — count of sampled text elements rendered
    //                            below ~12px (too small on mobile).
    //   a11y_tap_targets_small — count of interactive elements rendered
    //                            below the WCAG 2.5.8 24x24px minimum.
    // Both NULL until the page is rendered with the a11y audit on.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(urls)')
        .all() as unknown as { name: string }[];
      for (const col of ['a11y_small_font', 'a11y_tap_targets_small']) {
        if (!cols.some((c) => c.name === col)) {
          db.exec(`ALTER TABLE urls ADD COLUMN ${col} INTEGER`);
        }
      }
    },
  },
  {
    version: 79,
    name: 'add_spelling_detected_language',
    // The check language is now resolved locally from the page's prose
    // instead of being handed to LanguageTool's `auto` mode, which can only
    // answer with a language it supports and so mislabels everything else.
    //
    //   detected_language — primary code read out of the prose (`tr`)
    //   declared_language — primary code from html[lang] (`en`)
    //
    // Keeping both makes a wrong `lang` attribute visible as its own
    // finding. Existing rows predate the resolver and were produced by the
    // old `auto` path, so their results are cleared: a stored match list
    // graded against the wrong language is worse than no result at all,
    // and the page simply shows as unchecked until it is re-run.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(spelling_results)')
        .all() as unknown as { name: string }[];
      for (const col of ['detected_language', 'declared_language']) {
        if (!cols.some((c) => c.name === col)) {
          db.exec(`ALTER TABLE spelling_results ADD COLUMN ${col} TEXT`);
        }
      }
      db.exec('DELETE FROM spelling_results');
    },
  },
  {
    version: 80,
    name: 'add_spelling_engine',
    // Pages in a language LanguageTool has no rules for are now checked
    // against a bundled Hunspell dictionary instead of being left blank.
    // That checker finds spelling mistakes only, so which engine produced
    // a row has to be stored: without it a clean result would read as
    // "grammar checked, nothing wrong" when grammar was never examined.
    //
    // Rows written before this column exists came from LanguageTool by
    // definition, so they are backfilled rather than cleared.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(spelling_results)')
        .all() as unknown as { name: string }[];
      if (!cols.some((c) => c.name === 'engine')) {
        db.exec('ALTER TABLE spelling_results ADD COLUMN engine TEXT');
      }
      db.exec(
        "UPDATE spelling_results SET engine = 'languagetool' WHERE engine IS NULL",
      );
    },
  },
  {
    version: 81,
    name: 'add_url_changed_flag',
    // Re-crawling a URL that already has data (Re-Spider, or a second
    // Start on the same site) now records whether the page actually
    // moved since the previous fetch, so the URL table can flag it.
    //
    // Set by the urls upsert itself — comparing `excluded.*` against the
    // stored row inside the ON CONFLICT clause costs nothing, whereas a
    // read-then-compare in JS would add a SELECT per fetched URL.
    //
    // Rows written before this column existed have no baseline to be
    // measured against, so the default of 0 (unchanged) is correct.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(urls)')
        .all() as unknown as { name: string }[];
      if (!cols.some((c) => c.name === 'changed')) {
        db.exec('ALTER TABLE urls ADD COLUMN changed INTEGER NOT NULL DEFAULT 0');
      }
    },
  },
  {
    version: 82,
    name: 'add_mobile_alternate',
    // Separate-URL (m-dot) sites declare their mobile version with
    // `<link rel="alternate" media="only screen and (max-width: …)">`.
    // The Spider → Crawl matrix can now both follow and store it, so the
    // target needs somewhere to live.
    //
    // Left NULL for rows crawled before this column existed: absent and
    // "declared nothing" are the same thing for every consumer, and a
    // backfill would need the page bodies we no longer parse.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(urls)')
        .all() as unknown as { name: string }[];
      if (!cols.some((c) => c.name === 'mobile_alternate')) {
        db.exec('ALTER TABLE urls ADD COLUMN mobile_alternate TEXT');
      }
    },
  },
  {
    version: 83,
    name: 'add_gsc_inspection_appearance_verdicts',
    // GSC URL Inspection returns more than the index-status verdict:
    // mobileUsabilityResult / ampResult / richResultsResult each carry
    // their own PASS/FAIL verdict. Storing them powers the "Page is Not
    // Mobile Friendly", "AMP URL Invalid" and "Rich Result Invalid"
    // filter presets on the Search Console tab.
    //
    // Left NULL for rows inspected before these columns existed — absent
    // and "not inspected for this facet" are the same thing to consumers.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(gsc_inspection_results)')
        .all() as unknown as { name: string }[];
      if (!cols.some((c) => c.name === 'mobile_verdict')) {
        db.exec('ALTER TABLE gsc_inspection_results ADD COLUMN mobile_verdict TEXT');
      }
      if (!cols.some((c) => c.name === 'amp_verdict')) {
        db.exec('ALTER TABLE gsc_inspection_results ADD COLUMN amp_verdict TEXT');
      }
      if (!cols.some((c) => c.name === 'rich_results_verdict')) {
        db.exec(
          'ALTER TABLE gsc_inspection_results ADD COLUMN rich_results_verdict TEXT',
        );
      }
    },
  },
  {
    version: 84,
    name: 'add_google_account_id',
    // Multi-account GSC / GA4: a user can link several Google accounts to
    // the same integration (their own property plus a client's), so these
    // three snapshot tables can no longer be keyed by `url` alone — two
    // accounts may legitimately report on the same URL.
    //
    // SQLite cannot ALTER a PRIMARY KEY, so each table is rebuilt with the
    // composite `(url, account_id)` key and its rows copied across.
    // Pre-existing rows came from the single connected account and get
    // `account_id = ''`; the main process adopts them into that account's
    // id the first time the account list is resolved, so an upgrade keeps
    // its data instead of silently showing an empty table.
    up: (db) => {
      const hasAccountCol = (table: string): boolean =>
        (db.prepare(`PRAGMA table_info(${table})`).all() as unknown as {
          name: string;
        }[]).some((c) => c.name === 'account_id');

      if (!hasAccountCol('gsc_results')) {
        db.exec(`
          CREATE TABLE gsc_results_new (
            url          TEXT NOT NULL,
            account_id   TEXT NOT NULL DEFAULT '',
            clicks       INTEGER,
            impressions  INTEGER,
            ctr          REAL,
            position     REAL,
            fetched_at   TEXT NOT NULL,
            PRIMARY KEY (url, account_id)
          );
          INSERT INTO gsc_results_new (url, account_id, clicks, impressions, ctr, position, fetched_at)
            SELECT url, '', clicks, impressions, ctr, position, fetched_at FROM gsc_results;
          DROP TABLE gsc_results;
          ALTER TABLE gsc_results_new RENAME TO gsc_results;
          CREATE INDEX IF NOT EXISTS idx_gsc_results_account ON gsc_results(account_id);
        `);
      }

      if (!hasAccountCol('ga4_results')) {
        db.exec(`
          CREATE TABLE ga4_results_new (
            url                  TEXT NOT NULL,
            account_id           TEXT NOT NULL DEFAULT '',
            sessions             INTEGER,
            users                INTEGER,
            pageviews            INTEGER,
            engagement_rate      REAL,
            avg_session_duration REAL,
            fetched_at           TEXT NOT NULL,
            PRIMARY KEY (url, account_id)
          );
          INSERT INTO ga4_results_new (url, account_id, sessions, users, pageviews,
                                       engagement_rate, avg_session_duration, fetched_at)
            SELECT url, '', sessions, users, pageviews,
                   engagement_rate, avg_session_duration, fetched_at FROM ga4_results;
          DROP TABLE ga4_results;
          ALTER TABLE ga4_results_new RENAME TO ga4_results;
          CREATE INDEX IF NOT EXISTS idx_ga4_results_account ON ga4_results(account_id);
        `);
      }

      if (!hasAccountCol('gsc_inspection_results')) {
        db.exec(`
          CREATE TABLE gsc_inspection_results_new (
            url                  TEXT NOT NULL,
            account_id           TEXT NOT NULL DEFAULT '',
            verdict              TEXT,
            coverage_state       TEXT,
            robots_txt_state     TEXT,
            indexing_state       TEXT,
            last_crawl_time      TEXT,
            google_canonical     TEXT,
            user_canonical       TEXT,
            mobile_verdict       TEXT,
            amp_verdict          TEXT,
            rich_results_verdict TEXT,
            status               TEXT NOT NULL,
            error                TEXT,
            fetched_at           TEXT NOT NULL,
            PRIMARY KEY (url, account_id)
          );
          INSERT INTO gsc_inspection_results_new
              (url, account_id, verdict, coverage_state, robots_txt_state, indexing_state,
               last_crawl_time, google_canonical, user_canonical,
               mobile_verdict, amp_verdict, rich_results_verdict, status, error, fetched_at)
            SELECT url, '', verdict, coverage_state, robots_txt_state, indexing_state,
                   last_crawl_time, google_canonical, user_canonical,
                   mobile_verdict, amp_verdict, rich_results_verdict, status, error, fetched_at
              FROM gsc_inspection_results;
          DROP TABLE gsc_inspection_results;
          ALTER TABLE gsc_inspection_results_new RENAME TO gsc_inspection_results;
          CREATE INDEX IF NOT EXISTS idx_gsc_inspection_account ON gsc_inspection_results(account_id);
        `);
      }
    },
  },
  {
    version: 85,
    name: 'add_canonical_resolved',
    // `urls.canonical` stores the href exactly as authored, which is what
    // the "Canonical Not Absolute" filter and the detail panel want. But
    // roughly twenty predicates compare that raw value against `urls.url`
    // (self-reference, canonical→redirect/noindex joins, chain walking),
    // and a relative `href="/x/"` never equals an absolute URL — so a
    // correctly self-canonicalising page was reported as canonicalised
    // away, and canonical→target joins silently matched nothing.
    //
    // `canonical_resolved` holds the same href resolved against the page
    // URL and normalised — the form a search engine actually compares.
    // Comparisons read COALESCE(NULLIF(canonical_resolved,''), canonical)
    // so projects crawled before this column existed keep their old
    // behaviour instead of silently reporting zero.
    //
    // `canonical_distinct_count` counts *distinct* resolved targets, which
    // separates a harmlessly repeated tag from canonicals that disagree;
    // `canonical_cross_domain` flags a canonical pointing off-domain.
    // Both default 0 — "nothing declared" for rows crawled earlier.
    up: (db) => {
      const cols = db
        .prepare('PRAGMA table_info(urls)')
        .all() as unknown as { name: string }[];
      const has = (n: string): boolean => cols.some((c) => c.name === n);
      if (!has('canonical_resolved')) {
        db.exec('ALTER TABLE urls ADD COLUMN canonical_resolved TEXT');
      }
      if (!has('canonical_distinct_count')) {
        db.exec(
          'ALTER TABLE urls ADD COLUMN canonical_distinct_count INTEGER NOT NULL DEFAULT 0',
        );
      }
      if (!has('canonical_cross_domain')) {
        db.exec(
          'ALTER TABLE urls ADD COLUMN canonical_cross_domain INTEGER NOT NULL DEFAULT 0',
        );
      }
      // Crawl-trap classification (`detectUrlTrap`): NULL/'' for ordinary
      // URLs, otherwise the trap kind so the filter can explain *why* a URL
      // was flagged rather than just that it was.
      if (!has('url_trap')) {
        db.exec('ALTER TABLE urls ADD COLUMN url_trap TEXT');
      }
      // The canonical→target EXISTS joins match on this column, so without
      // an index they degrade to a scan per row on large projects.
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_urls_canonical_resolved ON urls(canonical_resolved)',
      );
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
