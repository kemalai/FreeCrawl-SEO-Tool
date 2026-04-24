# Changelog

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
