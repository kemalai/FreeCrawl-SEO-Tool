# Changelog

## [0.2.7] — 2026-05-02

### Added
- **Multi-row aggregation in detail sub-tabs** — selecting multiple URLs in the main table (Row column, Shift/Ctrl-click, drag, or cell-multi-select) now aggregates Inlinks, Outlinks, Images, and Resources across the full selection. Up to 50 URLs aggregated in parallel; primary-URL banner shown for per-page tabs (URL Details / Headers / Cookies / Source / SERP).
- **Right-click + Ctrl/Cmd+C in detail sub-tab tables** — Inlinks/Outlinks tables now ship a context menu (Copy N Cells, Copy URL / Copy N URLs for URL cells, Open in Browser) and a document-level keyboard listener. Selection is row-then-column TSV so cells paste cleanly into Excel / Sheets.
- **Auto-drain pending link stubs at first-crawl end** — links discovered but never crawled (depth-race, queue cap, filter race) are picked up before the first crawl finishes; pressing Start a second time on the same project no longer surfaces "+1000 new URLs". Up to 20 drain passes with `excludeNofollow` honoured so nofollow targets aren't silently followed.
- **Freeze-watchdog worker thread + `debug.txt`** — independent `worker_threads.Worker` polls a `SharedArrayBuffer` every 250 ms and writes stall events to `<userData>/debug.txt`. Tracks main process, db-reader worker, and renderer (via existing lag IPC); each stall logged with start gap, duration, end op, and live counters. The watchdog itself never blocks because it only reads atomically.
- **HTML parser worker pool** (4–8 threads, sized to `cpus() − 2`, clamped `[2, 8]`) — `cheerio` parsing + link extraction now runs on dedicated worker threads per `fetchAndProcess` call. The 12–26 s "fetch" stalls observed on large category / store-listing pages drop to <100 ms because the main thread no longer holds the JS event loop during parse.
- **DB writer worker thread** — every per-URL hot-path write (`upsertUrl` + headers + body snapshot + links + images) is shipped as a single `writeFetchedUrl` payload to a worker-thread SQLite connection. Main thread stops blocking on `.run()` for the duration of writes. Atomic visibility — readers can never see a URL row without its links.
- **Atomic `writeFetchedUrl` batch method** in `ProjectDb` — replaces the legacy two-step "upsertUrl then runInTransaction" sequence with a single transaction. Halves the IPC round-trips per URL and one fsync instead of two.

### Changed
- **Production launcher in the start `.bat`** — `npm run dev` (electron-vite cold-start, ~25 s) replaced with `npm --workspace apps/desktop run start` against the production bundle (1–2 s). Auto-builds the desktop app on first launch and when `out/` is missing.
- **Cooperative `recomputeUrlsIssuesYielding`** — the post-crawl materialise-issues phase now yields between each of the 70+ INSERT…SELECT definitions, dropping the 22-26 s main-thread block to a stream of <500 ms transactions with the UI staying responsive throughout.
- **Periodic in-crawl issue recompute uses the yielding variant too** — the 30 s sidebar-counter tick no longer freezes the renderer mid-crawl. In-flight ticks dropped if a previous one is still running.
- **`PRAGMA busy_timeout = 10000`** on the writer connection (5 s on read-only) — the new writer worker coexists cleanly with the main-process writer when both happen to want the SQLite lock at the same moment, instead of throwing `SQLITE_BUSY: database is locked` (seen when starting a new crawl while the previous one was mid-materialise).
- **rAF-throttled progress dispatch in the renderer** — `setProgress` now coalesces multiple progress events arriving within a single animation frame into one React update. TopBar / StatsBar / OverviewSidebar moved to scalar Zustand selectors so a counter that didn't change skips the full re-render.
- **`buildTree` + `TreeNode` memoised** in OverviewSidebar — 150-node tree no longer rebuilds + reconciles on every progress event.
- **`getPendingInternalLinks({ excludeNofollow })`** — drain loop and `hydrateFromDb` now both filter out URLs reachable only via `rel="nofollow"` links when `followNofollow` is false, matching the live link-follow path.
- **`Crawler.stop()` clears the queue-checkpoint and issue-recompute timers immediately** — Clear no longer races against a 30 s timer that re-populates `crawl_queue` after the wipe.
- **`ProjectDb.reset()` now wipes `crawl_queue`** + the IPC `crashRecoveryDiscard` handler explicitly clears the on-disk queue when the user dismisses the recovery prompt — fixes a "Pending URLs: N" prompt that kept reappearing across launches even after Clear.
- **Reader pool heavy-method timeout** raised to 60 s for `getOverviewCounts` (default 30 s for everything else) — eliminates `reader-timeout > 15000ms` warnings during materialise-issues phase contention.

### Fixed
- **Multi-row aggregation also reads cell selection** — picking 4 URLs via cell-clicks (Selected Cells: 4) now aggregates correctly; previously only Row-column picks (Selected Rows) were mirrored.
- **First-launch 25 s freeze** — Vite dev cold-start replaced with prebuilt bundle (see Changed).
- **Click-induced 3-4 s "Yanıt Vermiyor" stalls during crawls** — eliminated by the parser pool + writer worker + render-pressure reductions; debug.txt should now show no `[STALL:MAIN]` events on a typical 5 k-URL crawl.
- **Recovery-prompt false positives after Clear** — see Changed.
- **`Sitemap discovery skipped: database is locked`** when starting a crawl while the previous one is in post-crawl materialise — fixed by `busy_timeout` PRAGMA.
- **`reader-timeout: queryUrls > 15000ms`** during post-crawl recompute — default reader timeout raised, materialise phase now yields cooperatively.

## [0.2.6] — 2026-04-29

### Added
- **Read-only worker thread pool** — every read-heavy IPC handler (`urlsQuery`, `overviewGet`, `imagesQuery`, `urlDetailGet`, `brokenLinksQuery`, `summaryGet`, all 14 reports*) now runs on a dedicated `node:worker_threads` Worker that holds its own read-only SQLite connection against the same WAL file. Crawler writes on the main thread no longer contend with UI SELECTs. Auto-restart up to 3× per minute on worker crash; transparent fallback to the main-thread DB if the worker is unhealthy.
- **Materialised issue counters** (`urls_issues` table, migration v42) — heavy O(n²) issue counters (Dead External Domain, Duplicate URL post-norm, Canonical Chain Multi-hop) are now materialised once per crawl by `recomputeUrlsIssues` and read via a single `GROUP BY` instead of correlated subqueries on every sidebar tick. Periodic recompute every 30 s during crawl + final pass on done.
- **Live performance meter in the status bar** — FPS, JS heap (MB), and main-thread input lag (ms) update at 10 Hz with colour-coded thresholds. Lag is also piped back to the crawler so it can self-throttle.
- **Adaptive crawler concurrency** — when renderer input lag exceeds 200 ms, `Crawler.reportRendererLag()` shrinks `maxConcurrency` by 1 (floor 1); when lag drops below 30 ms it grows back toward the user-configured ceiling. 2-second cooldown prevents oscillation. Runs autonomously — low-end machines stay responsive without the user having to tune any setting.
- **3-tier resilient DNS resolver** (kept from 0.2.4) extended with hot-swappable hooks for crawl-scoped diagnostics in the Logs panel.
- **2 new HTML signals + 5 new issue filters** — `js_only_links_count` (JS-Only Navigation), `text_code_ratio` (Low Text/Code Ratio <10%), Render-Blocking Head >20 (critical tier), OG/Twitter Image >5MB (HEAD-probe based). Migrations v40, v41.
- **3 new Reports** — URL Length Histogram, Word Count per Directory, Sitemap Orphans (Top 1000). Reports menu now lists 19 reports.
- **macOS .dmg in every release** — workflow matrix `[windows-latest, macos-latest]` produces both `.exe` (x64) and `.dmg` (Apple Silicon arm64 + Intel x64) on every tag push.

### Changed
- **DB write coalescing** — per-URL fan-out (URL row + headers + body snapshot + 50–500 links + 5–50 images) is now wrapped in a single `runInTransaction` block. Each `BEGIN…COMMIT` is one fsync; previously a single page produced 5–10 fsyncs. On low-end SSDs with antivirus realtime-scan this halves per-page latency.
- **Cooperative `setImmediate` yield in the crawler hot loop** — `fetchAndProcess` yields to the Node event loop before each URL so renderer IPC, lag heartbeats, and progress listeners interleave with crawler work instead of waiting for batches.
- **IPC handler `setImmediate` wrapper** — read-heavy handlers yield once before running their SQL; combined with the worker pool this keeps click → response under one frame even on a saturated main thread.
- **Crawl-aware UI polling** — Overview Sidebar / Broken Links / Images tab polling intervals are 3 s during a running crawl, 30 s when idle. Sidebar additionally refetches on every 50-URL crawl-progress bucket (push-style invalidation).
- **`requestIdleCallback` wrapping** for sidebar + lazy-row loaders so SQL only fires when the renderer's main thread has idle slack.
- **Progress event throttling** — crawler caps progress emit to 5 Hz (200 ms) with trailing emit, dropping IPC volume from ~200 msg/s to 5 msg/s during high-throughput crawls.
- **Statement cache** — the 130+ `SELECT COUNT(*) WHERE …` clauses in `getOverviewCounts` are now compiled once per process and re-executed; SQLite parser cost amortised across ticks.
- **Logs window** — fixed `cannot start a transaction within a transaction` error caused by nested BEGIN inside the per-URL coalesce block (`setUrlHeaders` / `insertLinks` / `insertImages` now respect the outer transaction).
- **Reader pool node:sqlite compatibility** — fixed `TypeError: The "options" argument must be an object` on Node 24 by switching the writer connection to single-arg form and only passing `{ readOnly: true }` for the worker.

### Fixed
- **UI kasma during 2k+ URL crawls** — combination of write coalescing, worker thread reads, statement cache, materialised counters, and cooperative yield brings sidebar tick from ~150 ms → <5 ms and renderer Lag from 200 ms → <30 ms (p99) on commodity hardware.
- **Sidebar issue counters showing 0** for Dead External Domain / Duplicate URL post-norm / Canonical Chain Multi-hop — replaced placeholder zeros with materialised counts.

## [0.2.5] — 2026-04-29

### Added
- **macOS `.dmg` installer in every release** — release workflow is now a `[windows-latest, macos-latest]` matrix; one tag push fans out into both jobs and uploads `.exe` (NSIS, x64) and `.dmg` (Apple Silicon arm64 + Intel x64) to the same GitHub release. macOS DMG is currently unsigned — first launch shows a Gatekeeper warning, the user right-clicks → Open once and the app runs normally.
- **2 new Reports** — **URL Length Histogram** (6 buckets: ≤75 / 76–115 / 116–200 / 201–500 / 501–2048 / >2048; thresholds match SERP-snippet comfort zones) and **Word Count per Directory** (avg word count + page count grouped at depth 1–4; spots thin-content site sections). Reports menu now lists 18 reports.
- **1 new Report** — **Sitemap Orphans (Top 1000)** lists each URL declared in `<urlset>` but never reached by the crawl, alongside `<lastmod>` and source sitemap so the user can decide stale-vs-genuinely-orphaned. Reports menu now lists 19 reports.
- **7 new issue filters** — **Internal Link → Redirect** (page links to an internal 3xx target — wastes crawl budget), **H1 = Title** (lazy CMS copy-paste), **Description = H1** (same lazy pattern, different copy direction), **Dead External Domain** (page links to an external domain whose crawled pages are ≥80% broken across ≥3 attempts), **Duplicate URL (post-norm)** (URL collides with another after lowercase + query-strip + trailing-slash strip), **Canonical Chain (Multi-hop)** (Page A canonical → B, B canonical → C — two-level EXISTS subquery catches deeper chains too), **Slow-Loading Image** (>200 KB image on a page that hasn't applied lazy-loading to every image — LCP killer on mobile).

### Changed
- **CI release pipeline** — single `build` job replaced by a strategy matrix; both Windows and macOS runners install deps, build shared packages, run their platform's `electron-builder` target, upload artifacts, and append to the same release via `softprops/action-gh-release`. Public-repo runners are free across all OSes so this carries no cost.

## [0.2.4] — 2026-04-28

### Added
- **Automatic 3-tier DNS bypass** — crawls now keep working on machines with broken system DNS, with **zero user action required**. New resilient resolver cascades through (1) Node OS lookup → (2) direct UDP to public DNS servers (1.1.1.1, 1.0.0.1, 8.8.8.8, 9.9.9.9) → (3) DNS-over-HTTPS to Cloudflare / Google over port 443. Tier 3 connects to IP literals with SNI override + custom `checkServerIdentity`, so it works even when **port 53 is fully blocked** (Pi-hole, AdGuard, restrictive firewall, broken VPN). Solves the `EDESTRUCTION queryA` / `ECONNREFUSED queryA` failures that previously stopped crawls at 1 URL on misconfigured Windows / macOS / Linux machines. After 3 OS-DNS failures within 60 s, Tier 1 is auto-skipped globally so a sustained outage doesn't pay the per-host failure tax.
- **DNS bypass visibility in Logs** — when the cascade falls back to Tier 2 or Tier 3, a single `warn` entry is emitted per crawl ("DNS bypass active: system resolver unavailable, falling back to public DNS …"). Subsequent per-host lookups stay at debug level so the log panel doesn't flood.

### Changed
- **Logs window performance** — major optimisation pass: virtualised list (only ~20 visible rows mounted), 250 ms render coalescing in renderer + 100 ms batch coalescing in main process, 200-entry ring buffer (full history persisted to disk), `useDeferredValue` for filter / level changes, memoised rows with strict comparator, CSS `contain: strict` on the scroller, drag/resize busy-flag pauses live updates, `backgroundThrottling: false` so logs flow even when window is hidden, parent-window decoupling so the Logs window no longer competes with the main window for DWM compositor time.
- **Disk-persistent logging** — every log entry is now also written to `<userData>/logs/freecrawl-<ISO>.log` (rotated at 25 MB, 10 files retained). Help → "Open Logs Folder" reveals the directory. Logs survive crashes and exceed the 200-entry in-memory tail.
- **Single-instance lock** — only one FreeCrawl can run per machine; launching a second instance refocuses the existing window. Eliminates Chromium GPU cache `Erişim engellendi (0x5)` / `Gpu Cache Creation failed: -2` errors caused by two processes racing for the same cache directory on startup.
- **Diagnostic popup messaging rewritten** — DNS popups no longer recommend "restart Windows DNS Client" (the new resolver does that for you). They now only fire when ALL THREE DNS layers failed, which means the real diagnosis is "no internet" or "antivirus blocking everything", not a fixable DNS quirk.
- **Polling intervals reduced** — Overview sidebar 1500 ms → 3000 ms (with in-flight coalescing), Broken Links / Images tabs 1500 ms → 3000 ms, lazy URL rows live-refresh 250 ms → 750 ms. Cuts background IPC volume by ~60 % during crawls.

### Fixed
- **`fetch failed -> EDESTRUCTION queryA` / `ECONNREFUSED queryA` errors** — the underlying cause (Windows DNS Client mid-query crash, port-53 blocked by VPN/firewall, antivirus DNS hijacking) is now bypassed automatically by the resilient resolver instead of failing the crawl.
- **Logs window kept freezing the entire app after a crawl finished** — post-crawl SQL passes (inlinks recompute, redirect chains, hreflang reciprocity, duplicates, image probes, TLS probes) now yield to the Node event loop between phases via `setImmediate`, so the IPC channel stays live and the renderer doesn't stall.
- **Logs window stuttered during drag/resize** — busy-flag from main process pauses renderer state updates during window manipulation; React `startTransition` lets the compositor preempt log applications.
- **`formatFetchError` DNS messages** — updated to reference the automatic 3-tier fallback ("automatic DNS-over-HTTPS fallback active") instead of asking the user to manually restart services.

## [0.2.3] — 2026-04-28

### Added
- **Diagnostic popup dialogs** — when a crawl fails for an environment-specific reason (DNS port refused, DNS resolver crashed / `EDESTRUCTION`, TLS certificate inspection by antivirus / proxy, unreachable seed URL), a native modal opens with a clear explanation, step-by-step fix (`services.msc` → DNS Client restart, switch to 1.1.1.1, set `NODE_EXTRA_CA_CERTS`, …), an "Open Logs" button, and a "Don't show this again" checkbox that persists per-category. Site-specific failures (404 / WAF / timeout) stay in the log panel only.
- **Help → Reset Diagnostic Warnings** — re-enables every "Don't show again" checkbox the user previously dismissed; reports how many warnings were re-enabled.

### Fixed
- **DNS-layer failures misattributed to HTTP errors** — `formatFetchError` now recognises Node DNS error patterns (`queryA / queryAAAA / queryMx / …`) and surfaces DNS-specific hints. `ECONNREFUSED queryA` is no longer misread as "host refused connection" — it correctly identifies the local DNS resolver / VPN / Pi-hole / firewall as the culprit and recommends switching DNS to 1.1.1.1 / 8.8.8.8.
- **`EDESTRUCTION` errors had no diagnostic hint** — now mapped to "Windows DNS resolver crashed mid-query — restart the DNS Client service".

## [0.2.2] — 2026-04-28

### Added
- **50+ new SEO issue checks** — analytics coverage (GA4 missing / multiple / legacy UA / pixel-without-policy), large images (>200 KB), SSL/TLS cert (expired / expiring ≤30 d / weak signature / old protocol), HSTS quality (no preload / short max-age / no includeSubDomains), anchor text (too long / generic), form accessibility (unlabeled inputs), lazy-loading missing on images, broken `<img src>`, `target="_blank"` without `rel="noopener"`, empty pages, OG/Twitter/canonical absolute-URL checks, description equals title, single-word title, external-links-too-many (>100), zero outlinks.
- **6 new sub-tabs in URL Details panel** — Outline (heading hierarchy), Images, Resources, Extracted Data, Cookies, Structured Data — alongside existing Details / Inlinks / Outlinks / SERP / Headers / Source.
- **SSL/TLS certificate audit** — post-crawl TLS handshake probe per HTTPS host stores cert validity / issuer / subject / signature algorithm / protocol in `host_certs`; powers 4 SSL issue filters and a TLS panel in the Details view.
- **Image weight probe** — post-crawl HEAD pass on internal images persists `byte_size`; powers the "Large Image" issue and the new Image-Weight-Per-Page report.
- **7 new Reports** — Analytics Coverage, Link Positions, Image Weight Per Page, Inlinks Histogram, Word-Count Histogram, Server Headers, plus existing entries — Reports dialog now lists 16 reports.
- **Document outline** — heading hierarchy (up to 200 entries) captured per page, surfaced in the new Outline sub-tab.
- **Server header capture** — `Server` response header stored per URL; powers the Server Headers report and a row in the URL Details panel.
- **Drag & drop list import** — drop a `.txt` / `.csv` / `.list` file onto the app to populate List mode and start a crawl in one motion.
- **Custom robots.txt in tester** — Robots.txt Tester dialog accepts a pasted or file-loaded custom `robots.txt` body so you can verify rules before deploying them.
- **CLI `--config` and `--json` flags** — layered config (defaults → file → flags) for CI; `--json` emits a machine-readable summary to stdout.
- **Detailed network diagnostics in Logs panel** — every crawl now logs runtime info (Node / Electron / undici versions, OS), proxy state (config / env / none), CA bundle, TLS-validation flag, retry attempts, abort reasons, and 4xx / 5xx response interpretations (403 → bot/WAF, 429 → rate limit, 503 → server error). Failed fetches now surface in the Logs window with full root-cause chain — no more silent fails.

### Changed
- **`formatFetchError` hint coverage** — extended to `UND_ERR_HEADERS_TIMEOUT` (WAF / Cloudflare challenge), `UND_ERR_BODY_TIMEOUT`, `ECONNRESET / EPIPE` (antivirus / firewall TLS inspection), `EPROTO / TLSV1_ALERT / WRONG_VERSION_NUMBER` (TLS handshake), `NGHTTP2_ / GOAWAY` (HTTP/2 protocol error), `AbortError`. Each carries an actionable hint embedded in the log line.
- **README Features section condensed** — long bulleted feature lists collapsed into a 10-line high-signal summary.

### Fixed
- **Crawler hung in "Running" forever after an unreachable seed URL** — `start()` now emits a `done` event and clears `running` when `resolveStartUrl` returns null, with an explicit error message in the Logs panel.
- **Silent fetch failures** — failed URL fetches were stored to the DB but never logged; users saw `Crawl done: total=1 failed=1` with no clue why. The fetch catch path now emits an `error` (seed URL) or `warn` (any other URL) entry with the full diagnostic chain.

## [0.2.1] — 2026-04-27

### Added
- **30+ new issue checks** — H1 Empty, H1 Too Long (>70), Multiple `<title>` Tags, Title Pixel Width Truncated (>600 px Arial 18), Title Placeholder ("Untitled" / "Default" / "Page N"), Meta Description Pixel Width Truncated (>990 px), Fragment in URL, Spaces in URL, Long Query String (>100 chars), Folder Depth >4, Image Empty Alt, Empty Anchor Text, Apple Touch Icon Missing, Web Manifest Missing, RSS/Atom Feed Missing, Insecure Form Action (HTTPS → HTTP), Missing SRI (3rd-party subresource), TTFB Slow (>600 ms), TTFB Very Slow (>1.8 s), Cookies Missing Secure / HttpOnly / SameSite, HTTP/2 Not Advertised, Render-Blocking Head Resources (>5), Keep-Alive Disabled.
- **View Source detail tab** — every HTML page's raw body is captured during crawl into a sibling `url_sources` table (capped at `bodySnapshotMaxBytes`, default 1 MB; `storeBodySnapshots` config knob to disable). The new sub-tab in the URL Details panel renders the source with case-insensitive search + match highlighting (≤5K hits cap), a Wrap toggle, and Copy / Download buttons. Truncated badge surfaces when the body was clipped.
- **TTFB measurement** — request-to-headers timing captured per successful attempt (retry overhead excluded) and stored as `ttfb_ms`. Powers the two new TTFB issue filters and a new "TTFB (ms)" row in the URL Details panel.
- **Cookie security analysis** — `Set-Cookie` response headers are split RFC-6265-correctly (Expires-date safe), security flags counted per page (`cookies_count`, `cookies_insecure`, `cookies_no_httponly`, `cookies_no_samesite`). Cookie values are never stored; only the per-flag counts. Three issue filters surface them.
- **HTTP/2 detection** — best-effort heuristic via `Alt-Svc` header (`h2=` / `h3=` advertised → HTTP/2 / HTTP/3 capable). Stored as `http_protocol`; "HTTP/2 Not Advertised" issue surfaces origins still on HTTP/1.1.
- **Render-blocking + keep-alive detection** — html-parser counts `<head>` `<script src>` (no async/defer/type=module) + `<link rel=stylesheet>` (excl. media=print) → `render_blocking_count`. Crawler captures `Connection: close` → `keep_alive` flag.
- **Microdata + RDFa structured-data** — `[itemscope]` and `[typeof]/[vocab]/[property]` counted alongside JSON-LD; the "No Structured Data" issue now triggers only when ALL three formats are absent (no more false positives on Microdata-first sites).
- **Apple Touch Icon, Web Manifest, RSS/Atom feed detection** — `<link rel="apple-touch-icon">` (incl. legacy `-precomposed`), `<link rel="manifest">`, `<link rel="alternate" type="application/rss+xml|atom+xml">` URLs absolute-resolved and surfaced in the URL Details panel + sidebar issue filters.
- **Pixel-width estimation for title + meta description** — per-character Arial 18 px width table approximates Google SERP truncation (600 / 990 px thresholds); replaces the previous client-side approximation that drove the URL Details panel.
- **Bulk Export menu** — File → Bulk Export… opens a folder picker, then writes ~22 curated CSVs (Internal HTML / All, External All, 2xx / 3xx / 4xx / 5xx, Indexable / Non-Indexable, Title / Meta / H1 / Canonical Issues, Pagination Broken, Mixed Content, Insecure Form Action, Hreflang Reciprocity, Sitemap Crawled-Not-Listed, Image Missing Alt, Near-Duplicate). 0-row files auto-deleted; concludes with "Open Folder" prompt.
- **Sitemap Validator dialog** — Help → Sitemap Validator… fetches a sitemap URL, walks nested sitemap-index entries up to depth 3 / 100K URLs, shows tried/parsed/error counts + `<lastmod>` samples + protocol findings. Tolerant input (bare hosts auto-prefixed with `https://`).
- **6 new Reports** — Slowest URLs, Most-Linked URLs, Most-Outlinking URLs, Biggest Pages, Deepest URLs, External Domain Health (per-host success/error rollup with avg response time + error-rate %). Brings total to 10 reports in the Reports dialog.
- **Recent Projects** — File → Open Project… (`Ctrl+O`) and File → Open Recent submenu (last 10 projects, persisted; bad entries auto-pruned; "Clear Recent" command). Save Project As… now also pins the saved file as the active project.
- **Settings preset profiles** — Settings → **Presets**: one-click Fast / Thorough / Mobile-only Googlebot / Desktop-only Googlebot / Aggressive. Apply only writes affected fields; URL list, custom rules, filters, and extraction rules are preserved.
- **Settings Import / Export** — Settings → Presets → Export… / Import… buttons. JSON envelope `{format, version, exportedAt, config}`. Bare CrawlConfig fragments accepted; unknown fields warn-and-skip.
- **CLI subcommands** — `freecrawl validate-sitemap <url>`, `freecrawl audit-robots <url>`, `freecrawl compare <before.seoproject> <after.seoproject>`. Each returns a CI-friendly exit code (0 / 1 / 2).
- **Settings → Speed** dedicated panel — pulls Max Concurrency / Max URL/s / Per-Worker Delay / Retry knobs out of the generic Crawler section. Live "Effective ceiling" banner + worst-case retry-delay math. Throughput tips at the bottom.
- **Visualization tuning popover** — gear icon next to Reload opens 5 sliders (node size, repulsion, edge length, cluster spacing, edge opacity). Persists to prefs across sessions; live preview; Reset + Re-run-layout buttons.

### Changed
- **Force-Directed visualization defaults rebuilt** — node radius 6–24 px (down from 8–48), tuned cose layout (1M repulsion, 400 px ideal-edge, 0 gravity, 5000-px boundingBox) so hub-spoke topologies fan out instead of collapsing into a tight ball. Default node count 150 (was 500).
- **Visualization labels hidden by default** — new "Labels" mode (Hover Only / Top 20 / All). Hover highlights the node + its closed neighbourhood; non-neighbours fade to 25% opacity. Click selects (persists until empty-canvas click); double-click on a node opens its URL.
- **Visualization label rendering** — switched from cytoscape's built-in (zoom-scaled, illegible at low zoom) to a fixed-size HTML overlay positioned via `node.renderedPosition()`. Stays at 12 px regardless of zoom level / display DPI.
- **Robots.txt Tester accepts bare hosts** — `gamesatis.com`, `www.example.com/foo`, `//host/path` are auto-prefixed with `https://`. Same normalisation in the CLI's `audit-robots`.
- **CSV exporter accepts a category filter** — `exportUrlsToCsv(db, path, { category })` walks `iterateUrlsByCategory` directly, replacing the old "all rows" behaviour for selection-less exports. Underpins Bulk Export.
- **OverviewSidebar sections expanded to ~100 issue filters** — new groups: **Cookies** (Missing Secure / HttpOnly / SameSite), **PWA / Discovery** (Apple Touch / Manifest / Feed). Existing groups (Title, H1, URL, Performance, Security Headers, Images, Links, Structured Data) gained 1–4 entries each.
- **Settings dialog grew to 14 sections** — added **Presets** and **Speed** sections; preset application + JSON import/export inside Presets.
- **Body snapshots auto-stored during crawl** — every HTML page's raw response now goes into `url_sources` so View Source works without re-fetching. Disable via `storeBodySnapshots: false` to save disk on snapshot-free runs.

### Fixed
- **Clear button stuck disabled after crawl completion / Open Recent** — Clear is now enabled whenever any of `progress.discovered`, `progress.crawled`, `summary.total`, or `overview.summary.totalInternalUrls / totalExternalUrls` is non-zero. Previously it only checked the live progress counters, which were reset to 0 in the final emitProgress.
- **`SyntaxError: Unexpected token '??'` on Electron startup** — `http-client.ts` mixed `||` and `??` without parentheses (illegal per ES2020). Refactored to compute the env-proxy chain into a helper variable first.
- **Robots.txt Tester rejected hostnames without scheme** — bare hosts now auto-resolve to `https://<host>/robots.txt`.

### Removed
- **Developer Tools menu item + keyboard shortcuts** — View → Developer Tools entry removed. F12 / Ctrl+Shift+I / Ctrl+Alt+I / Ctrl+Shift+J / Ctrl+Shift+C swallowed via `before-input-event`. Belt-and-braces `devtools-opened` hook closes them if anything else opens them programmatically. Applied to both main + Logs windows.

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
