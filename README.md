# FreeCrawl SEO Tool

Open-source desktop SEO crawler — a free, cross-platform alternative to Screaming Frog.

**Website:** [freecrawl.net](https://freecrawl.net/) · **Releases:** [github.com/kemalai/FreeCrawl-SEO-Tool/releases](https://github.com/kemalai/FreeCrawl-SEO-Tool/releases)

FreeCrawl SEO Tool is a high-performance website crawler for SEO analysis, targeting **1M+ URLs** on a single machine without lag. Built on Electron + React + `node:sqlite`, with an undici-based crawler tuned for concurrent fetching.

---

## Features

### Crawler
- **undici HTTP client** with keep-alive Agent (128 connections), cacheable DNS, HTTP/1.1 + HTTP/2.
- **robots.txt** obedience, configurable user-agent, configurable Accept-Language and arbitrary custom HTTP headers.
- **Manual redirect handling** — every 3xx hop is stored as its own row and the target is requeued. Post-crawl chain resolution with cycle detection (50-hop cap), `redirect_chain_length` / `redirect_final_url` / `redirect_loop` columns.
- **Rate limiting** via `p-queue` (concurrency + RPS caps) plus optional per-worker crawl-delay.
- **Retry with exponential backoff** for transient failures (408, 425, 429, 5xx, network errors).
- **Pause / Resume** any crawl mid-flight; in-flight requests finish naturally.
- Per-URL **AbortController** + configurable timeout.
- **HTTPS_PROXY / HTTP_PROXY** environment variable support via undici `ProxyAgent`.
- **Happy Eyeballs (RFC 8305)** — `autoSelectFamily` races IPv4/IPv6 on dual-stack hosts.
- **Sitemap auto-discovery + parser** — `robots.txt` `Sitemap:` directives + `/sitemap.xml` + `/sitemap_index.xml` fallbacks; nested `<sitemapindex>` walked BFS (cap follows `maxUrls`, depth 3); enables Non-Indexable / Non-200 in-Sitemap issue filters.
- **List mode** — fetch every URL in a supplied list exactly once with no link follow / sitemap discovery.
- **Custom Search** — case-insensitive literal substring counts in body text; per-page hits stored as JSON.
- **URL Rewriting** — strip-www, force-HTTPS, lowercase-path, trailing-slash policy; applied at every `normalizeUrl` call site so the seen-set, redirects, links, and sitemap entries dedupe consistently.
- **Include / Exclude regex patterns** at URL level.
- **Images** extracted with alt-text, dimensions, internal/external classification.
- Full **Screaming Frog parity link metadata**: type, alt text, target, path type, link-path breadcrumb, link position (header/nav/content/footer/aside), link origin.

### Page-level extraction
- Titles + length, meta descriptions + length, canonical (HTML and HTTP `Link` header — RFC 8288 angle-bracket-aware), `meta robots`, `X-Robots-Tag`, multi-canonical detection.
- H1–H6 counts, word count, content-type, response time, payload size, crawl depth.
- Meta refresh, charset, lang attribute, viewport.
- OpenGraph (`og:title` / `og:description` / `og:image`), Twitter Card (`twitter:card` / `…title` / `…description` / `…image`), JSON-LD (with `@type` collected from arbitrary nesting incl. `@graph`), pagination (`rel=next` / `rel=prev`), hreflang (incl. `x-default`).
- AMP (`rel=amphtml`), favicon (`rel=icon` + legacy `shortcut icon`), keywords / author / generator / theme-color.
- Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, Content-Security-Policy, Referrer-Policy, Permissions-Policy, Content-Encoding.
- Mixed-content scan — HTTPS pages are scanned for `http://` subresources (img / script / iframe / video / audio / source / embed / stylesheet).
- URL-shape analytics: folder depth, query param count, uppercase / underscore / multiple-slashes / non-ASCII / too-long detection.

### Issues panel
**~60 SEO issue categories** across the Overview sidebar:

- **Document** — Title missing / too long / too short / duplicate, Meta description missing / too long / too short / duplicate, H1 missing / too long / multiple, H2 missing, Canonical missing / multiple / canonicalised / HTTP-vs-HTML mismatch / non-200 target, Self-referencing canonical filter, Skipped heading level, Charset missing, Meta refresh used.
- **Response** — 4xx, 5xx, redirects, redirect loops, long redirect chains (>3), self-redirect, very slow (>3 s), broken link inventory.
- **Page** — Large (>1 MB), missing alt text on images, mixed content, favicon missing, AMP target broken.
- **URL** — Too long (>2048), uppercase, underscore, multiple slashes, non-ASCII, many query params (>5), non-indexable in sitemap, non-200 in sitemap.
- **Social** — OpenGraph missing, Twitter Card missing.
- **Mobile / Accessibility** — Viewport missing, lang attribute missing.
- **Structured data** — JSON-LD missing, invalid JSON-LD, broken next/prev target, x-default missing.
- **Security** — HSTS missing, X-Frame-Options missing, X-Content-Type-Options missing, CSP missing, compression missing.

### Desktop UI
- **Dense dark theme**, Screaming Frog-style table layout.
- 14 analysis tabs: Internal, External, Response Codes, URL, Page Titles, Meta Description, H1, H2, Content, Images, Broken Links, Canonicals, Directives, Links.
- **Virtualized tables** (`@tanstack/react-virtual`) — smooth scrolling with 1M+ rows.
- **Live streaming UX** — rows materialise continuously every 250 ms during a crawl, no batch lump.
- **First row in ~1 s** — sitemap discovery and `robots.txt` are fire-and-forget; `resolveStartUrl` uses a single auto-follow fetch instead of per-hop probing.
- **Column resize**, sortable headers, configurable widths persisted per tab.
- **`[i]` info tooltips on every column header** — hover reveals a one-line description plus a concrete example value (35 columns covered).
- **Three-layer selection** (row / cell / column) with mouse **drag-select**.
- **Seamless live sort** — sorting works during an active crawl; rows shift smoothly as new data arrives (stable `getItemKey`).
- **Advanced Table Search** — Screaming Frog-style AND/OR groups, 24 fields, 12 operators (numeric/text aware).
- **Bottom Detail Panel** — Details, Inlinks, Outlinks, Images, SERP Snippet, HTTP Headers, Link Metrics tabs for the selected URL.
- **Recent URLs dropdown** — focusing the URL bar surfaces the last 5 crawled URLs (persisted across launches). The URL bar always starts empty on launch.
- **Reports dialog** (`Ctrl+R`) — Pages per Directory (depth selector), Status Code Histogram, Depth Histogram, Response Time Histogram.
- **Robots.txt Tester** dialog — verify allow/disallow verdict, declared sitemaps, crawl-delay against any URL + UA combo.
- **Logs window** (`Ctrl+L`) — live stream of every console message, warning, exception, and crawler event; 5 000-entry ring buffer with filter + search + Copy.
- **XML Sitemap generator**, **CSV export** from every tab, and **JSON export** (~65 columns vs CSV's 23) via `Ctrl+Shift+E`.
- **Multi-row bulk actions** (context menu).
- User preferences (column widths, panel sizes, "don't ask again" flags) saved to `<userData>/preferences.json`.

### Settings dialog
Open from `Ctrl+,` or the gear button. Left-sidebar category nav with searchable filter; **`[i]` info tooltip on every field** (description + example).

- **Mode** — Spider vs List, URL list textarea.
- **Crawler** — max depth / URLs / concurrency / RPS, request timeout, crawl delay, retry attempts, follow-redirects, respect-robots, crawl-external, store-nofollow, discover-sitemaps.
- **Requests** — User-Agent, Accept-Language, custom HTTP headers.
- **Include / Exclude** — regex patterns at URL level.
- **Custom Search** — case-insensitive literal terms.
- **URL Rewriting** — strip-www, force-HTTPS, lowercase-path, trailing-slash policy.
- **Hardware** — memory soft limit (MB) auto-pauses the queue at the cap and resumes at 80%; max in-memory queue size drops new discoveries beyond the cap (back-pressure on fan-out bursts); process priority (Normal / Below Normal / Idle) sets the OS scheduler hint so the machine stays usable during heavy crawls.

### Performance
- **Batch UPSERT** + multi-row INSERT into SQLite (WAL mode).
- `node:sqlite` (Node 22+ built-in) — **no native compile**, no node-gyp, no Python, no MSBuild headaches.
- `recomputeInlinks` is a one-pass aggregate (temp-table `GROUP BY` + indexed JOIN) — finishes in seconds at 1M URLs.
- `recomputeRedirectChains` snapshots only redirect rows, not the full URL table.
- Crawler dedup sets (`seen` / `externalSeen`) released after the queue drains, freeing ~80–120 MB on big crawls.
- Observed throughput: ~80–150 URL/s on typical sites (vs. 5 URL/s with naive fetch).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 22 LTS+ (ESM-first) |
| Language | TypeScript 5.7+ strict |
| Desktop shell | Electron 41 |
| Build | electron-vite 5 / Vite 7 |
| UI | React 19 + Tailwind 3.4 + Zustand 5 |
| Tables | `@tanstack/react-table` + `@tanstack/react-virtual` |
| HTTP | undici 8 |
| HTML parse | cheerio (htmlparser2 fast path) |
| Queue | p-queue 8 |
| robots | robots-parser 3 |
| Storage | `node:sqlite` + WAL |
| Distribution | electron-builder 26 |

---

## Prerequisites

Before running FreeCrawl SEO Tool from source, your machine needs the following. **End users who download the prebuilt Windows installer (`.exe`) from the [Releases](https://github.com/kemalai/FreeCrawl-SEO-Tool/releases) page do NOT need any of this** — the installer ships everything bundled.

### Required (for developers / source builds)

| Component | Minimum version | Why | Where |
|---|---|---|---|
| **Node.js** | **22 LTS** (24 also OK) | Crawler runtime + bundled `node:sqlite` (Node 22.5+) — no native compile needed | [nodejs.org](https://nodejs.org/) |
| **npm** | 10+ (ships with Node) | Workspace install + scripts | (bundled with Node) |
| **Git** | any recent | Clone the repo | [git-scm.com](https://git-scm.com/) |

> **Why no Python / MSBuild / node-gyp?** FreeCrawl uses Node 22's built-in `node:sqlite` instead of `better-sqlite3`. There are zero native dependencies — `npm install` never invokes a C++ compiler. This is a deliberate design choice.

### Required at runtime (any platform, both prebuilt and source)

- **Outbound HTTPS access** to the sites you crawl. Behind a corporate proxy? Set `HTTPS_PROXY=http://your-proxy:port` before launch — the crawler routes through `undici`'s `ProxyAgent` automatically.
- **TLS root certificates**. Node ships with the Mozilla CA bundle. If your antivirus or company proxy performs HTTPS inspection (Kaspersky, ESET, Zscaler, BlueCoat, etc.), set `NODE_EXTRA_CA_CERTS=C:\path\to\corp-ca-bundle.crt` — otherwise crawls fail with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`.

### Optional

| Component | Why |
|---|---|
| **PowerShell 7+** (Windows) | Better experience for some package scripts (default `cmd.exe` works fine too) |
| **Bash / Git Bash** (Windows) | Required only if you run the CLI examples below verbatim |
| **VS Code** | Recommended editor — workspace TypeScript settings are pre-configured |

### Platform-specific notes

- **Windows 10/11** — runs without any extra setup once Node.js is installed. The included **`FreeCrawl-SEO-Tool-Start.bat`** launcher handles dependency install + first-time `tsc -b` build automatically.
- **macOS 12+** — works out of the box on Apple Silicon and Intel. For production DMG signing/notarization you'll additionally need an Apple Developer ID certificate (only matters if you're distributing builds, not running locally).
- **Linux** — any modern distro with Node 22 works. AppImage / `.deb` outputs are produced by `electron-builder`.

### Disk + memory budget

- ~600 MB for `node_modules` after `npm install`
- ~150 MB for the production Electron build
- ~100 MB peak RAM for a 100K-URL crawl (most data streams to SQLite via WAL); 1M-URL crawls fit comfortably under the 1 GB process budget with the default Hardware settings.

### Verifying your setup

```bash
node --version    # should print v22.x.x or v24.x.x
npm --version     # 10+
```

If `node --version` prints `v18.x` or older, upgrade — `node:sqlite` requires Node 22.5+ and won't load on older runtimes.

---

## Quick Start

### Windows (easiest)

Double-click **`FreeCrawl-SEO-Tool-Start.bat`** at the repo root. It will:

1. Verify Node.js and npm are installed (and point you to nodejs.org if not).
2. Detect whether dependencies are installed; if not, prompt for confirmation and run `npm install`.
3. Launch the desktop app with `npm run dev`.

### Manual (all platforms)

Requires **Node.js 22 LTS or newer**.

```bash
npm install
npm run dev        # launches the Electron desktop app
```

### CLI (headless crawl)

```bash
npm run build:cli
node apps/cli/dist/index.js https://example.com --depth 2 --max 500 --out out.csv
node apps/cli/dist/index.js --list urls.txt --out out.json   # list mode + JSON export
```

### Production build

```bash
npm run build                              # all packages + desktop + CLI
npm --workspace apps/desktop run build:win # Windows installer (NSIS)
npm --workspace apps/desktop run build:mac # macOS DMG (notarized)
npm --workspace apps/desktop run build:linux
```

---

## Project Structure

```
FreeCrawl-SEO-Tool/
├── FreeCrawl-SEO-Tool-Start.bat   # Windows one-click launcher
├── CHANGELOG.md                   # versioned release notes
├── apps/
│   ├── desktop/                   # Electron app (main + preload + renderer)
│   └── cli/                       # headless Node CLI
└── packages/
    ├── shared-types/              # IPC + domain types
    ├── db/                        # ProjectDb (node:sqlite) + migrations
    └── core/                      # crawler engine (UI-agnostic)
```

**Dependency graph**

```
shared-types  →  db  →  core  →  desktop, cli
```

---

## Versioning

See [CHANGELOG.md](CHANGELOG.md) for per-version release notes. The current version is shown in the window title bar: `FreeCrawl SEO Tool v0.1.10`.

---

## Status

Active development. Core crawler, 14 analysis tabs, advanced search, ~60 issue categories, sitemap export, JSON export, list mode, custom search, URL rewriting, hardware throttling, robots.txt tester, reports dialog, in-app logs, and multi-layer table selection are all working. Live-streaming UX with first row in ~1 s, ready for 1M-URL audits out of the box. Upcoming: plugin system, JavaScript rendering, log analyzer, PageSpeed API integration.

---

## Links

- **Website:** [freecrawl.net](https://freecrawl.net/)
- **Releases:** [github.com/kemalai/FreeCrawl-SEO-Tool/releases](https://github.com/kemalai/FreeCrawl-SEO-Tool/releases)
- **Issues / Bug reports:** [github.com/kemalai/FreeCrawl-SEO-Tool/issues](https://github.com/kemalai/FreeCrawl-SEO-Tool/issues)

---

## License

MIT — see [LICENSE](LICENSE).
