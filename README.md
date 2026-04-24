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

See [CHANGELOG.md](CHANGELOG.md) for per-version release notes. The current version is shown in the window title bar: `FreeCrawl SEO Tool v0.1.2`.

---

## Status

Active development. Core crawler, 14 analysis tabs, advanced search, issues detection, sitemap export, and multi-layer table selection are working. Upcoming: plugin system, JavaScript rendering, log analyzer, PageSpeed API integration.

---

## License

MIT — see [LICENSE](LICENSE).
