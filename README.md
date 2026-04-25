# FreeCrawl SEO Tool

Open-source desktop SEO crawler — a free, cross-platform alternative to Screaming Frog.

FreeCrawl SEO Tool is a high-performance website crawler for SEO analysis, targeting 100K+ URLs on a single machine without lag. Built on Electron + React + `node:sqlite`, with an undici-based crawler tuned for concurrent fetching.

---

## Features

### Crawler
- **undici HTTP client** with keep-alive Agent (128 connections), cacheable DNS, HTTP/1.1 + HTTP/2.
- **robots.txt** obedience and configurable user-agent.
- **Manual redirect handling** — every 3xx hop is stored as its own row and the target is requeued.
- **Rate limiting** via `p-queue` (concurrency + RPS caps).
- Per-URL **AbortController** + configurable timeout.
- **Images** extracted with alt-text, dimensions, internal/external classification.
- Full **Screaming Frog parity link metadata**: type, alt text, target, path type, link-path breadcrumb, link position (header/nav/content/footer/aside), link origin.

### Desktop UI
- **Dense dark theme**, Screaming Frog-style table layout.
- Tabs: Internal, External, Response Codes, URL, Page Titles, Meta Description, H1, H2, Content, Images, Broken Links, Canonicals, Directives, Links.
- **Virtualized tables** (`@tanstack/react-virtual`) — smooth scrolling with 100K+ rows.
- **Column resize**, sortable headers, configurable widths persisted per tab.
- **Three-layer selection** (row / cell / column) with mouse **drag-select**.
- **Seamless live sort** — sorting works during an active crawl; rows shift smoothly as new data comes in (stable `getItemKey`).
- **Advanced Table Search** — Screaming Frog-style AND/OR groups, 24 fields, 12 operators (numeric/text aware).
- **Issues panel** — 12 categories (missing title/meta/H1, length extremes, duplicate titles, multiple H1s, slow response, large payload, 4xx, 5xx, redirect, missing alt).
- **Bottom Detail Panel** — Details, Inlinks, Outlinks, Images, SERP Snippet, HTTP Headers, Link Metrics tabs for the selected URL.
- **XML Sitemap generator**, **CSV export** from every tab.
- **Multi-row bulk actions** (context menu).
- User preferences (column widths, panel sizes, "don't ask again" flags) saved to `<userData>/preferences.json`.

### Performance
- **Batch UPSERT** + multi-row INSERT into SQLite (WAL mode).
- `node:sqlite` (Node 22+ built-in) — **no native compile**, no node-gyp, no Python, no MSBuild headaches.
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

> **Why no Python / MSBuild / node-gyp?** FreeCrawl uses Node 22's built-in `node:sqlite` instead of `better-sqlite3`. There are zero native dependencies — `npm install` never invokes a C++ compiler. This is a deliberate design choice (see [CLAUDE.md](CLAUDE.md) §6).

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
- ~100 MB peak RAM for a 100K-URL crawl (most data streams to SQLite via WAL)

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

See [CHANGELOG.md](CHANGELOG.md) for per-version release notes. The current version is shown in the window title bar: `FreeCrawl SEO Tool v0.1.3`.

---

## Status

Active development. Core crawler, 14 analysis tabs, advanced search, issues detection, sitemap export, and multi-layer table selection are working. Upcoming: plugin system, JavaScript rendering, log analyzer, PageSpeed API integration.

---

## License

MIT — see [LICENSE](LICENSE).
