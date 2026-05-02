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
