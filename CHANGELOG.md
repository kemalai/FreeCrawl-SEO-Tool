# Changelog

## [0.2.0] — 2026-04-26

### Added
- **Near-duplicate / exact duplicate content detection** — every crawled page's body text is fingerprinted with a 64-bit Charikar SimHash over 3-shingles. Post-crawl, a band-based LSH (4 × 16-bit) + Union-Find clustering pass groups pages within a configurable Hamming threshold (Settings → Duplicates; default 3 ≈ 95% similarity, "Only cluster indexable pages" toggle). Surfaces as the **Near-Duplicate Content** issue plus `Cluster ID` / `Cluster Size` columns on the Content tab. **Duplicate Content (exact)** issue layered on top via FNV-1a content-hash collisions.
- **Hreflang full analysis** — `recomputeHreflangAnalysis` validates BCP-47 / `x-default` codes, computes self-reference, reciprocity (against the in-crawl hreflang graph), and target health. Four new Hreflang issues: **Invalid Code**, **Self-Ref Missing**, **Reciprocity Missing**, **Target Issues** (non-200 / noindex / canonical-away targets).
- **Sitemap multi-file split + gzip + image / hreflang variants** — exporter auto-shards >50K-URL outputs into `<base>-N.xml` parts under a `<sitemapindex>` wrapper; `gzip: true` writes `.xml.gz`; `variant: 'image'` emits `<image:image>` blocks (Google Images, max 1000/page); `variant: 'hreflang'` emits `<xhtml:link rel="alternate" hreflang>` siblings inside each `<url>`. Built-in `validateSitemap` checks URL count / file size / RFC 3339 lastmod.
- **Sitemap diff filters** — **Crawled-Not-In-Sitemap** (orphan candidate from sitemap perspective), **Redirect in Sitemap** (3xx specifically, distinct from non-200), plus a `sitemapNotCrawled` count for entries the crawl never reached.
- **HTML standalone audit report** — File menu → "Export HTML Report…": single-file print-ready report with KPI cards (URLs / Indexable / Avg Response / Total Bytes), severity-ranked Issues table covering 56 issue types, and Top-25 Slowest / Deepest / Outlink-Heavy URL tables. No external assets — emailable / archivable as-is.
- **Webhook on crawl completion** — Settings → Webhook: any URL receives a single `POST` with crawl summary JSON when the run finishes. 10 s timeout, fire-and-forget so a misconfigured Slack/Zapier endpoint can't break crawl teardown. Status + latency surface as info events.
- **Custom Extraction (CSS + Regex)** — Settings → Custom Extraction: up to 10 user-defined rules per project. CSS rules (cheerio-driven, reuses the loaded DOM) support text / attribute / inner_html / outer_html / count outputs; regex rules (JS RegExp /g with infinite-loop guard) support whole-match / capture-group-1 / count. Multi-match modes: first / last / all (JSON array) / concat (` | ` joined) / count. Per-rule failures are isolated. Results stored in a single JSON column, surfaced in the URL Details panel as `Extract: <name>` rows and included in CSV / JSON exports.
- **Compare with Project** (Compare/Diff Mode) — File menu → "Compare With Project…" opens a `.seoproject` and produces a 9-category diff: **Added** (URLs in B not A), **Removed** (URLs in A not B), and field-level changes for **Status / Title / Meta / H1 / Canonical / Indexability / Response Time** (Δ ≥500 ms threshold). Modal shows per-category counts in the sidebar + colour-coded before/after diff table; samples capped at 5K per category for memory.
- **Site architecture visualization** (`Ctrl+G`) — View → Visualization opens an interactive Cytoscape graph of the internal link structure. Top-N nodes by inlinks (200 / 500 / 1K / 2K / 5K cap), edges between them. Four layouts: **Force-Directed** (cose), **Tree (BFS)**, **Circle**, **Concentric**. Three colour modes: **By Status** (2xx green / 3xx amber / 4xx orange / 5xx red), **By Depth** (bluescale), **By Indexability**. Log-scaled node sizing by inlinks. Hover tooltip surfaces full URL.
- **Anchor-text word cloud** — sidebar of the Visualization dialog ranks the top 120 internal-link anchors by frequency with log-scaled font sizing across the cloud.
- **HTTP Basic + Bearer authentication** — Settings → Authentication. Adds `Authorization: Basic <base64>` or `Authorization: Bearer <token>` to every request. User-supplied custom-header `Authorization` still wins for advanced overrides.
- **Per-project proxy URL override** — Settings → Network. Takes precedence over `HTTPS_PROXY` / `HTTP_PROXY` env vars when non-empty; same syntax (`http://user:pass@host:port`).
- **File-extension exclude filter** — Settings → Network → "Exclude extensions". Comma-separated list (`pdf, jpg, png, woff2, …`); URLs whose path ends in any of these are dropped at enqueue time. Start URL exempt; query strings ignored.
- **Configurable max redirect hops** — Settings → Network → "Max redirect hops" (default 10). Each 3xx is still recorded as its own URL row, but the chain stops being followed beyond N hops.
- **Manual URL injection during crawl** — TopBar **Add URL** button (only visible while running). Clears the seen-flag for re-crawl semantics; respects robots / include-exclude / queue cap.
- **Save Project As…** (`Ctrl+Shift+S`) — File menu → atomic SQLite `VACUUM INTO` snapshot of the live crawl into a `.seoproject` file. WAL-consistent unlike a plain file copy.
- **OS notifications** — Electron `Notification` toasts when a crawl completes while the main window isn't focused. Gracefully degrades on Linux distros without a notification daemon.

### Changed
- **Settings dialog grew to 12 sections** — added **Custom Extraction**, **Authentication**, **Network**, **Duplicates**, **Webhook** entries to the existing Mode / Crawler / Requests / Include-Exclude / Custom Search / URL Rewriting / Hardware. Sidebar search filter covers all of them.
- **OverviewSidebar issue count rose from ~60 to ~70** — adds a new **Content** group (Thin Content / Near-Duplicate / Duplicate Content) plus the four new Hreflang and two new Sitemap issues.
- **Sitemap exporter API expanded** — `exportSitemap(db, path, opts)` now accepts `variant` / `gzip` / `splitAtUrlCount` and returns `{ files: string[], urlsWritten, truncated, sharded }` so callers can surface every part file.

## [0.1.10] — 2026-04-26

### Changed
- **README rewritten to match current capability surface (v0.1.9)** — feature list synced with the post-0.1.4 reality: 1M-URL target, ~60 issue categories (was 12), full Settings dialog inventory, Hardware throttling section, recent-URLs dropdown, sitemap auto-discovery, list mode, custom search, URL rewriting, JSON export, robots.txt tester, reports dialog, in-app logs, `[i]` info tooltips on every settings field and table column header, live-streaming UX (~1 s first row, 250 ms refresh), pause/resume, retry/backoff, HTTPS_PROXY support, Happy Eyeballs, mixed-content scan, security-header audit, JSON-LD / OpenGraph / Twitter Card / hreflang / pagination extraction, redirect-chain resolution.
- **Added [freecrawl.net](https://freecrawl.net/) website link** — surfaced in the README header and a new Links section.

## [0.1.9] — 2026-04-26

### Added
- **`[i]` info tooltips on every Settings field** — every input/select/checkbox in the Settings dialog now has a hoverable info icon next to its label. Tooltip surfaces a one-line description plus a concrete "Example" value so the user understands what each setting does without leaving the dialog. Covers all 26 fields across Mode, Crawler, Requests, Include/Exclude, Custom Search, URL Rewriting, and Hardware sections.
- **`[i]` info tooltips on every table column header** — every column on the Internal/External/Response Codes/URL/Page Titles/Meta Description/H1/H2/Content/Canonicals/Directives/Links views (35 columns total) shows an info icon on hover with a description + example value. Same treatment applied to the Images and Broken Links views. Uses a new shared `InfoTip` component so settings and tables share styling.

### Changed
- **First row appears in ~1 s instead of ~3-4 s after Start** — sitemap discovery (`fetchSitemaps`) is now fire-and-forget, no longer blocking the start URL from being enqueued. `loadRobots` (robots.txt fetch) is also fire-and-forget — the robots check is fail-open until the file loads (typically <500 ms, well before the first fetched page emits its outlinks). Both promises are awaited at end-of-crawl so post-crawl `recomputeInlinks` and sitemap-derived issue filters see the full data set.
- **`resolveStartUrl` rewritten as a single auto-follow fetch** — `gamesatis.com` previously took ~2-3 s (HEAD probe + manual `redirect: 'manual'` hop-by-hop GET chain over 1-2 redirects). Replaced with a single `fetch(..., { redirect: 'follow' })` call that lets undici drive the redirect chain at the network layer; typical resolution drops to ~300-800 ms. Probe timeout lowered from 5 s to 3 s.
- **Live URL-table refresh cadence dropped from 1500 ms to 250 ms** — at 20 RPS the user previously saw ~30 rows arrive in a single 1.5 s lump (felt like the program had stalled). Now ~5 rows arrive every 250 ms, giving a continuous "streaming" feel. Added a leading tick (fires immediately on mount, no 1.5 s dead-window after Start) and an `inFlight` guard that coalesces overlapping ticks at the new cadence.

### Fixed
- **Stop → Start "pır pır" / flicker eliminated** — when Stop was pressed during a crawl, the in-flight sitemap fetch (5+ s on a 20k-URL sitemap) and the queued `done` event from the just-stopped crawler kept firing into the next crawl's UI, producing rapid Running ↔ Done state flips. Fixed by (1) tracking the sitemap fetch's `AbortController` on the crawler instance and aborting it from `stop()`, (2) gating all `done` emits behind `if (!this.stopped)` in spider/list/early-exit paths, and (3) gating the main process IPC forwards by `activeCrawler === crawler` so a zombie crawler's late `progress` / `done` / `error` / `info` events never reach the renderer.

## [0.1.8] — 2026-04-26

### Added
- **Canonical completeness — 4 new issues**: **Canonical Missing** (HTML 2xx with no canonical declared anywhere), **Self-Referencing Canonical** filter, **Canonicalised** (canonical points elsewhere), **HTTP vs HTML Mismatch** (the document's `<link rel="canonical">` and the response's `Link: …; rel="canonical"` header disagree). New `canonical_http` column captures the HTTP-header canonical (RFC 8288 angle-bracket-aware parsing).
- **Meta Refresh detection** — `meta_refresh` + `meta_refresh_url` columns extract `<meta http-equiv="refresh" content="…">`. New issue **Document → Meta Refresh Used** flags any HTML page using meta-refresh (Google recommends 301 instead).
- **Charset detection** — `charset` column populated from `<meta charset>`, then legacy `<meta http-equiv="Content-Type">`, then HTTP `Content-Type` header `charset=` parameter. New issue **Document → Charset Missing** for HTML 2xx with no declared charset anywhere.
- **Settings dialog redesign** — left-sidebar category nav (Mode, Crawler, Requests, Include/Exclude, Custom Search, URL Rewriting, Hardware) with searchable filter; breadcrumb header; per-category right-pane content. Wider modal (920×80vh).
- **Settings entry in File menu** (`Ctrl+,`) — opens the Settings dialog from the menu bar in addition to the gear button.
- **Recent URLs dropdown** — focusing the URL input shows the last 5 crawled URLs as a dropdown (persisted across launches). The URL bar always starts empty on launch.
- **Hardware section in Settings** — **Memory soft limit (MB)** auto-pauses the queue when the crawler's RSS exceeds the cap and resumes at 80% of it; **Max in-memory queue size** drops new discoveries beyond the cap (back-pressure on fan-out bursts); **Process priority** (Normal / Below Normal / Idle) sets the OS scheduler hint so the machine stays usable during heavy crawls.
- **Crawler `info` event channel** — non-error status messages (e.g. successful sitemap parse summaries, memory monitor pause/resume, priority-set acks) are now emitted as `info` events and logged at info level, no longer polluting the error log.

### Changed
- **Default `maxUrls` raised from 100k to 1,000,000** — supports large-site audits out of the box. Existing users keep their saved value (defaults merge under saved preferences).
- **`recomputeInlinks` rewritten as one-pass aggregate** — switched from a correlated `(SELECT COUNT…)` subquery (N×M lookups, minutes at 1M URLs) to a temp-table `GROUP BY links.to_url` followed by an indexed JOIN; finishes in seconds at the same scale.
- **`recomputeRedirectChains` memory fix** — now snapshots only rows where `redirect_target IS NOT NULL` instead of the full `urls` table (~100 MB saved at 1M URLs).
- **Sitemap entry cap follows `maxUrls`** — the sitemap fetcher's hard 50k limit is now `Math.max(50_000, config.maxUrls)`, so 1M-URL crawls can ingest the full sitemap.
- **Crawler dedup sets released after crawl ends** — `seen` and `externalSeen` are cleared once the queue is drained, releasing ~80–120 MB of string heap on big crawls.
- **URL bar starts empty on launch** — previous start URL is no longer auto-restored; the recent-URLs dropdown surfaces history instead.

## [0.1.7] — 2026-04-25

### Added
- **Multiple Canonicals detection** — `canonical_count` column tracks the number of `<link rel="canonical">` tags on the page (previously only the first was captured). New issue **Canonicals → Multiple Canonicals** flags pages with more than one canonical (Google may pick any of them, defeating the canonical's purpose).
- **Canonical → Non-200 detection** — new issue **Canonicals → Canonical → Non-200** flags pages whose canonical URL was crawled and returned 4xx/5xx (uses an `EXISTS` join against the canonical's stored status code).

## [0.1.6] — 2026-04-25

### Added
- **Settings dialog** (gear icon in TopBar) — every plumbed-through `CrawlConfig` field is now editable from the UI: max depth/URLs/concurrency/RPS, request timeout, crawl delay, retry attempts/initial backoff, follow-redirects, respect-robots, crawl-external, store-nofollow, discover-sitemaps, User-Agent, Accept-Language, custom HTTP headers, include/exclude regex patterns, custom search terms, URL rewriting (strip-www / force-https / lowercase-path / trailing-slash policy), List mode + URL list. Persisted to `preferences.json`, restored on next launch.
- **Sitemap auto-discovery + parser** — at crawl start, `robots.txt` `Sitemap:` directives + `/sitemap.xml` + `/sitemap_index.xml` fallbacks are fetched, nested `<sitemapindex>` walked BFS (cap 50K entries, depth 3), entries persisted to a new `sitemap_urls` table. Two new issue filters: **Non-Indexable in Sitemap**, **Non-200 in Sitemap**. Toggle: `discoverSitemaps` (default on).
- **List mode** — `CrawlConfig.mode = 'list'` fetches every URL in `urlList` exactly once with no link follow / robots / sitemap discovery. CLI `--list <file>` (one URL per line, `#` comments). Settings dialog has a Mode dropdown + URL list textarea.
- **Custom Search** — case-insensitive literal substring counts in body text, configured via Settings or `customSearchTerms` config. Per-page hits stored as JSON in `custom_search_hits`; one Detail-panel row per term.
- **URL Rewriting** — 4 opt-in toggles applied at every `normalizeUrl` call site (so the seen-set, redirects, link extraction, sitemap entries all dedupe consistently): **Strip www**, **Force HTTPS**, **Lowercase path**, **Trailing slash policy** (leave / strip / add — `add` is file-extension aware).
- **JSON export** — streaming exporter dumps every captured field (security headers, structured data, hreflang JSON, pagination, custom search hits, redirect chain, …) for ~65 columns vs. CSV's 23. CLI `--out *.json` auto-detects format. Menu: **File → Export Current View as JSON…** (`Ctrl+Shift+E`).
- **Robots.txt Tester** dialog — **Help → Robots.txt Tester…** opens a popup; enter a URL + UA, see fetched robots.txt status, allow/disallow verdict, declared sitemaps, crawl-delay, and the raw body (8 KB cap).
- **Reports dialog** — new top-level **Reports** menu (`Ctrl+R`) opens a dropdown-driven analytics dialog: **Pages per Directory** (depth selector 1–4), **Status Code Histogram** (2xx/3xx/4xx/5xx/NET badges), **Depth Histogram** (BFS click-depth distribution), **Response Time Histogram** (6 buckets `<100ms` → `>10s` + `No response` row, OK/WARN/SLOW/ERR badges).
- **Heading hierarchy** — `h3_count` / `h4_count` / `h5_count` / `h6_count` columns + new **Skipped Heading Level** issue (flags pages where a tier is missing — e.g. H1 → H3 without H2). Detail panel shows non-zero counts.
- **Full security header capture** — `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy` rounded out the response-header set (joining HSTS, X-Frame-Options, X-Content-Type-Options, Content-Encoding). New **CSP Missing** issue filter.

### Changed
- `normalizeUrl` signature gained an optional `UrlRewriteOptions` parameter. Existing call sites are unaffected (defaults are no-op); the crawler snapshots config rewrites once in the constructor and threads them through `parseHtml` so every URL the page declares is normalized identically.

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
