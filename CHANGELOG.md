# Changelog

## [0.1.5] — 2026-04-25

### Added
- **HTTP Headers tab** in URL Details — every response header (lowercased, dedup'd, 4 KB cap) is now persisted to the `headers` table and rendered as a sortable name/value table for the selected URL.
- **JSON-LD structured data extraction** — every `<script type="application/ld+json">` block is parsed; `@type` values from arbitrary nesting (top-level, arrays, `@graph` containers, string-or-array `@type`) are collected into a sorted unique list. Block count + invalid-block count tracked separately. Two new issues: **JSON-LD Missing**, **Invalid JSON-LD**.
- **Pagination + hreflang extraction** — `<link rel="next">` / `<link rel="prev">` and all `<link rel="alternate" hreflang>` entries are stored; hreflangs as JSON. Two new issues: **Broken Next/Prev Target** (joins to `urls` to find 4xx/5xx redirect targets), **x-default Missing**.
- **Mixed Content + AMP + Favicon detection** — HTTPS pages are scanned for `http://` subresources (img / script / iframe / video / audio / source / embed / stylesheet — anchors deliberately ignored). `<link rel="amphtml">` and `<link rel="icon">` (with legacy `shortcut icon` fallback) captured per URL. New issues: **Mixed Content**, **Favicon Missing**.
- **Security headers audit** — `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Content-Encoding` captured from response headers. Three new issues: **HSTS Missing** (HTTPS pages only), **X-Frame-Options Missing**, **X-Content-Type-Options Missing**. Plus **Compression Missing** issue under Performance.
- **Twitter Card extraction** — `twitter:card` / `twitter:title` / `twitter:description` / `twitter:image` (Twitter spec uses `name=` not `property=`). New issue **Twitter Card Missing** when both card+image are absent.
- **OpenGraph + viewport + lang extraction** — `og:title` / `og:description` / `og:image`, `meta[name=viewport]`, `html[lang]` per URL. Three new issues: **OpenGraph Tags Missing** (all three absent), **Viewport Meta Missing**, **Lang Attribute Missing**.
- **Meta extras** — `meta[name=keywords]`, `meta[name=author]`, `meta[name=generator]`, `meta[name=theme-color]` captured + shown in URL Details.
- **Redirect chain resolution** — post-crawl `recomputeRedirectChains()` walks every redirect with cycle detection (visited-set + 50-hop hard cap), filling `redirect_chain_length` / `redirect_final_url` / `redirect_loop`. Two new issues: **Redirect Loop**, **Long Chain (>3 hops)**.
- **URL structure analytics** — 4 new URL-shape issues (**Contains Uppercase**, **Contains Underscore**, **Multiple Slashes**, **Non-ASCII Characters**) plus **Many Query Params (>5)**, **Self-Redirect**, and **Too Long (>2048 chars)**. `folder_depth` and `query_param_count` columns computed at upsert time.
- **Configurable crawler** — `customHeaders`, `includePatterns`, `excludePatterns` (regex) added to `CrawlConfig`. Default headers merge case-insensitively with user overrides; include filter is opt-in (empty = all pass), exclude is always applied; start URL is exempt. CLI flags `--header "K: V"`, `--include <regex>`, `--exclude <regex>`.

### Changed
- **README.md** — added a **Prerequisites** section detailing Node.js 22+ requirement, optional tooling, corporate-proxy / antivirus TLS guidance (`HTTPS_PROXY`, `NODE_EXTRA_CA_CERTS`), and disk/memory budget. Prebuilt installer users explicitly exempted from these requirements.

## [0.1.4] — 2026-04-24

### Added
- **Pause / Resume** crawl controls in the top bar — in-flight requests finish naturally; queued work halts until Resume. Status bar shows an amber "Paused" indicator.
- **Retry with exponential backoff** — transient failures (network errors, 408, 425, 429, 5xx) are retried up to `retryAttempts` times with doubling delay. Defaults: 2 retries, 500 ms initial backoff.
- **Crawl delay** (`crawlDelayMs`) — optional per-worker politeness delay applied *after* each request, on top of the global RPS cap.
- **In-app Logs window** — `Help → Show Logs…` (Ctrl+L) opens a live popup that streams every console message, warning, uncaught exception, and crawler event from app startup onward. 5 000-entry ring buffer, filter by level, search, Copy, Clear.
- **Fetch error diagnostics** — the generic `"fetch failed"` message now walks `err.cause` and surfaces the real underlying reason (e.g. `ENOTFOUND`, `UND_ERR_CONNECT_TIMEOUT`, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, `ECONNREFUSED`) with a contextual hint about corporate proxy / antivirus / DNS.
- **HTTPS_PROXY / HTTP_PROXY** environment variable support via undici `ProxyAgent` — users behind corporate proxies no longer get silent `ECONNREFUSED`.
- **Happy Eyeballs (RFC 8305)** — `autoSelectFamily` races IPv4/IPv6 so dual-stack hosts with a broken AAAA record don't stall the crawl.
- **SEO metadata extraction** — every crawled HTML page now stores `lang` (html[lang]), `viewport` (meta[name=viewport]), and OpenGraph `og:title` / `og:description` / `og:image`. Shown in the URL Details panel.
- **7 new SEO issue filters** under the Overview sidebar's Issues group:
  - H1 > Multiple (`h1_count > 1`)
  - Response > Very Slow (>3 s)
  - Page > Large (>1 MB)
  - URL > Too Long (>2048 chars)
  - Accessibility > Lang Attribute Missing
  - Mobile > Viewport Meta Missing
  - Social > OpenGraph Tags Missing (all of og:title / og:description / og:image absent)

### Changed
- **Nofollow links no longer stored by default** (Screaming-Frog style "Respect Nofollow"). Links with `rel="nofollow"` are treated as hints for search engines only — they don't appear in the `links` table, don't count toward `urls.outlinks`, and external nofollow targets aren't HEAD-probed. Opt back in via `storeNofollowLinks: true`.
- `urls.outlinks` now reflects the *stored* (followed) link count so the detail panel's Outlinks list stays consistent with the header count.

### Fixed
- `node:sqlite` `ExperimentalWarning` no longer appears as ERROR in the Logs window — classified as benign and suppressed (CLAUDE.md already acknowledged it as expected for this stack). The `'warning'` event listener also disables Node's default stderr printer for us, so any future warnings flow through a proper severity classifier instead of being dumped to stderr.

## [0.1.3] — 2026-04-24

### Fixed
- **Release workflow** — Windows build failed on GitHub Actions with "Cannot compute electron version from installed node modules" because npm workspaces hoist `electron` to the repo root, outside where `electron-builder` looks. Pinned `electronVersion: 41.2.2` in `electron-builder.yml` to bypass the auto-detection.
- Added `--publish never` to `build:{win,mac,linux}` scripts so `electron-builder` doesn't race against the `softprops/action-gh-release` step (also silences the implicit-publishing deprecation warning).

## [0.1.2] — 2026-04-24

### Added
- **GitHub Actions CI** (`.github/workflows/ci.yml`) — typechecks and builds all workspaces on every push to `main` and every pull request (Ubuntu runner, Node 22).
- **Windows release automation** (`.github/workflows/release.yml`) — pushing a `v*.*.*` tag triggers a `windows-latest` build of the NSIS installer via `electron-builder` and publishes it as a GitHub Release with auto-generated notes.
- **Launcher now builds workspace packages** (`tsc -b`) before `npm run dev`, so fresh clones / ZIP downloads work without the "Cannot find module `@freecrawl/...`" error.

### Changed
- `electron-builder.yml` `productName` is now `FreeCrawl SEO Tool` (reflected in the installer filename and install directory).
- Launcher refactored so all `goto` labels live outside `(...)` blocks (cmd.exe parses parenthesized blocks in a single pass, which was causing the window to close silently on some machines).

## [0.1.1] — 2026-04-24

### Added
- **Windows one-click launcher** (`FreeCrawl-SEO-Tool-Start.bat`) — verifies Node.js and npm, offers to run `npm install` if dependencies are missing, then launches the desktop app.
- **Versioned window title** — the app window now displays `FreeCrawl SEO Tool v<version>`, read from `app.getVersion()`; prevented the renderer's `<title>` from overriding it.

### Changed
- Renamed the application from **FreeCrawl SEO** to **FreeCrawl SEO Tool** across the window title, HTML title, and menu labels.

## [0.1.0] — 2026-04-24

### Added
- **Crawler engine**: undici-based HTTP client (128 connections, keep-alive, cacheable-lookup DNS), rate limiting via p-queue, robots.txt compliance, manual redirect handling (each 3xx hop stored as its own row), per-request AbortController timeout.
- **HTML parsing**: cheerio `htmlparser2` fast path with entity decoding; extracts title / meta description / H1 / H1 count / H1 length / H2 count / word count / canonical / meta robots / X-Robots-Tag / image alt.
- **Link extraction**: 16-column Screaming Frog-parity inlink/outlink metadata (type, alt text, target, path type, link path breadcrumb, link position, link origin).
- **SQLite storage**: `node:sqlite` (no native compile), WAL mode, batch UPSERT, multi-row INSERT, `schema_version` table, conditional (function-based) migration system — up to v8.
- **Desktop UI**: Electron 41 + electron-vite 5, React 19 + Tailwind 3.4 + Zustand 5, dense dark theme.
- **Tabs**: Internal, External, Response Codes, URL, Page Titles, Meta Description, H1, H2, Content, Images, Broken Links, Canonicals, Directives, Links.
- **Table features**: `@tanstack/react-virtual` virtualization for 100K+ rows, column resize + sorting, Row number column, row selection (Ctrl/Shift), cell selection, column selection, mouse drag-select (row/cell/column).
- **Seamless live sort**: chunk-replace with stable `getItemKey` keeps sort order smooth while a crawl is still running.
- **Issues panel**: 12 categories (missing title/meta/H1, long/short title & meta, duplicate title, multiple H1s, slow response, large page, 4xx, 5xx, redirect, missing alt text).
- **Advanced Table Search**: Screaming Frog-style AND/OR group dialog — 24 fields, 12 operators, numeric/text type aware.
- **Bottom Detail Panel**: Details / Inlinks / Outlinks / Images / SERP Snippet / HTTP Headers / Link Metrics tabs for the selected URL.
- **XML Sitemap generator** from the File menu.
- **CSV export** from every tab.
- **CLI**: Headless Node CLI (`apps/cli`) — start URL + depth/max/out parameters.
- **User preferences**: column widths, tab state, and "don't ask again" flags persisted to `<userData>/preferences.json`.
- **Clear confirmation**: pop-up with "Don't ask again" checkbox; Clear button disabled when the table is empty.
- **Zero-delay Start button**: immediate progress emit + optimistic state.
- **ESC exits fullscreen**, native menu bar, removal of non-applicable menu entries.
- **Scrollbar styling**: thinner edges, squared corners, larger hit area.

### Changed
- Migrated HTTP client from global `fetch` to a tuned undici Agent; throughput target ~5 URL/s → 80–150 URL/s.
- UI preferences moved from `localStorage` to a JSON file; crawl data no longer persisted in `localStorage`.

### Fixed
- "table url..." runtime error caused by a migration version mismatch — addressed by an idempotent `repair_images_schema` (v5) migration.
- Canonicals tab column bleed caused by duplicate React keys — fixed with a `ColumnSpec.id` field.
- Broken rendering of quote and other characters in the SERP snippet (entity decoding).
