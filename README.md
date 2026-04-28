# FreeCrawl SEO Tool

Open-source desktop SEO crawler — a free, cross-platform alternative to Screaming Frog.

**Website:** [freecrawl.net](https://freecrawl.net/) · **Releases:** [github.com/kemalai/FreeCrawl-SEO-Tool/releases](https://github.com/kemalai/FreeCrawl-SEO-Tool/releases)

FreeCrawl SEO Tool is a high-performance website crawler for SEO analysis, targeting **1M+ URLs** on a single machine without lag. Built on Electron + React + `node:sqlite`, with an undici-based crawler tuned for concurrent fetching.

---

## Features

- **High-performance crawler** — undici HTTP client, p-queue concurrency + RPS limits, exponential-backoff retries, redirect chain handling, robots.txt obedience, sitemap auto-discovery. ~80–150 URL/s typical throughput, 1M+ URL crawls on a single machine.
- **Spider + List modes** — full-site spider or fetch-once URL list. HTTP Basic / Bearer auth, proxy override, custom headers, include/exclude regex, file-extension filters, URL rewriting (strip-www / force-HTTPS / trailing-slash).
- **~70 SEO issue categories** — title / meta / H1–H6, canonicals (HTML + HTTP `Link`), indexability, redirects, broken links, mixed content, security headers (HSTS / CSP / X-Frame-Options …), hreflang validation, sitemap diff, near-duplicate clustering (SimHash + LSH).
- **Page-level extraction** — OpenGraph, Twitter Card, JSON-LD, schema types, pagination, AMP, favicon, viewport, charset, custom CSS/Regex extraction (up to 10 rules), custom search terms.
- **Dense desktop UI** — 14 analysis tabs, virtualized tables for 1M+ rows, live streaming during crawls, advanced AND/OR search (24 fields × 12 operators), drag-select, column resize, info tooltips on every column / setting.
- **Detail panel** — Inlinks, Outlinks, Images, SERP Snippet, HTTP Headers, Link Metrics, View Source, Cookies, Structured Data tabs for the selected URL.
- **Reports + Visualization** — pages per directory, status / depth / response-time / inlinks / word-count histograms, top URLs, link positions, image weight, analytics coverage, Cytoscape link graph (4 layouts × 3 colour modes) with anchor-text word cloud.
- **Exports** — CSV / JSON per tab, bulk export (22 categorised CSVs), standalone HTML audit report, sitemap generator (standard / image / hreflang / sharded / gzip), `.seoproject` snapshots via atomic `VACUUM INTO`.
- **Operations** — pause / resume / stop, manual URL injection, project compare diff, robots.txt tester, drag-and-drop list import, in-app logs window with full network diagnostics (proxy / TLS / WAF detection), webhook on completion, OS notifications.
- **Storage** — `node:sqlite` + WAL (no native compile, no node-gyp, no Python). Memory soft-limit auto-pause, configurable max queue size, process-priority hint so the machine stays usable.

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

See [CHANGELOG.md](CHANGELOG.md) for per-version release notes. The current version is shown in the window title bar: `FreeCrawl SEO Tool v0.2.1`.

---

## Status

Active development. Core crawler, 14 analysis tabs, advanced search, ~70 issue categories, sitemap export with image / hreflang / multi-file / gzip variants, JSON / CSV / standalone HTML report exports, list mode, custom search, custom extraction (CSS + Regex), near-duplicate detection (SimHash + LSH), full hreflang validation, sitemap diff filters, project-vs-project compare, site-architecture visualization (Cytoscape graph + anchor word cloud), HTTP Basic + Bearer auth, proxy override, webhook on completion, OS notifications, robots.txt tester, reports dialog, in-app logs, and multi-layer table selection are all working. Live-streaming UX with first row in ~1 s, ready for 1M-URL audits out of the box. Upcoming: plugin system, JavaScript rendering, log analyzer, PageSpeed API integration.

---

## Links

- **Website:** [freecrawl.net](https://freecrawl.net/)
- **Releases:** [github.com/kemalai/FreeCrawl-SEO-Tool/releases](https://github.com/kemalai/FreeCrawl-SEO-Tool/releases)
- **Issues / Bug reports:** [github.com/kemalai/FreeCrawl-SEO-Tool/issues](https://github.com/kemalai/FreeCrawl-SEO-Tool/issues)

---

## License

MIT — see [LICENSE](LICENSE).
