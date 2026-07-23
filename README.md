<div align="center">

# FreeCrawl SEO Tool

<img src="Freecrawl.gif" alt="FreeCrawl SEO Tool in action — dense table view, live crawl progress, and detail panel" width="100%" />

### Open-source desktop SEO crawler — a free, cross-platform alternative to Screaming Frog

[![License: MIT](https://img.shields.io/badge/License-MIT-black?style=for-the-badge)](LICENSE)
[![Latest Release](https://img.shields.io/github/v/release/kemalai/FreeCrawl-SEO-Tool?style=for-the-badge&color=blue)](https://github.com/kemalai/FreeCrawl-SEO-Tool/releases)
[![Stars](https://img.shields.io/github/stars/kemalai/FreeCrawl-SEO-Tool?style=for-the-badge&color=yellow)](https://github.com/kemalai/FreeCrawl-SEO-Tool/stargazers)
[![Last Commit](https://img.shields.io/github/last-commit/kemalai/FreeCrawl-SEO-Tool?style=for-the-badge&color=green)](https://github.com/kemalai/FreeCrawl-SEO-Tool/commits/main)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=for-the-badge)](#-quick-start)

**[🌐 Website](https://freecrawl.net/)** ·
**[📦 Download](https://github.com/kemalai/FreeCrawl-SEO-Tool/releases)** ·
**[🐛 Report Bug](https://github.com/kemalai/FreeCrawl-SEO-Tool/issues)** ·
**[📝 Changelog](CHANGELOG.md)**

<br />

A high-performance website crawler built for serious SEO audits. Targets <kbd>1M+ URLs</kbd> on a single machine, with a dense Screaming Frog–style UI, **150+ SEO issue checks**, and zero native dependencies.

</div>

<br />

---

## ✨ What FreeCrawl Does

FreeCrawl crawls your website and checks it for SEO problems — a free, desktop alternative to Screaming Frog. It handles very large sites (**1M+ URLs on one machine**) and streams the results into a fast, dense table while the crawl is still running.

It runs **150+ SEO checks across 32 tabs** — page titles, meta descriptions, headings, duplicate content, broken links, redirects, canonicals, hreflang, structured data, security headers, readability, and more. It can also render JavaScript pages with a real headless browser to capture the final DOM, screenshots, and Core Web Vitals.

Pull in real data from **Google Search Console, Analytics 4, PageSpeed Insights, and Chrome UX Report**, check spelling and grammar with **LanguageTool** — with a **bundled offline dictionary** for languages LanguageTool has no rules for, such as Turkish — and run your own **AI prompts** on each page (OpenAI, Claude, or Ollama). Open several projects side by side, each in its own window running its own crawl, and manage them from a Projects dialog with search, tags, and starter templates.

Export to **Excel, CSV, JSON, XML**, an HTML report, sitemaps, **Google Sheets**, or **BigQuery**, save each project as **one compressed file** (or a **password-protected encrypted file**), and export any URL Details sub-table on its own. A built-in **MCP server** (96 tools) lets AI agents like Claude drive crawls live and read every result — every action a human can take in the desktop is callable from an agent. Everything runs **fully local** — no telemetry, no cloud, MIT-licensed.

<br />

---

## 🛠 Tech Stack

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js%2022%20LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript%205.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Electron](https://img.shields.io/badge/Electron%2041-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite%207-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind%203.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/node%3Asqlite%20%2B%20WAL-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

</div>

| Layer | Choice |
| :--- | :--- |
| 🟢 **Runtime** | Node.js 22 LTS+ (ESM-first) |
| 📘 **Language** | TypeScript 5.7+ strict |
| 🪟 **Desktop shell** | Electron 41 |
| ⚡ **Build** | electron-vite 5 / Vite 7 |
| 🎨 **UI** | React 19 + Tailwind 3.4 + Zustand 5 |
| 📊 **Tables** | `@tanstack/react-table` + `@tanstack/react-virtual` |
| 🌐 **HTTP** | undici 8 |
| 🔎 **HTML parse** | cheerio (htmlparser2 fast path) |
| 📥 **Queue** | p-queue 8 |
| 🤖 **robots** | robots-parser 3 |
| 💾 **Storage** | `node:sqlite` + WAL — **zero native deps** |
| 📦 **Distribution** | electron-builder 26 |

<br />

---

## 🚀 Quick Start

> [!TIP]
> **End users**: download the prebuilt installer from the [Releases page](https://github.com/kemalai/FreeCrawl-SEO-Tool/releases) — no setup required.

<details>
<summary><b>🪟 Windows</b> — easiest path is the <code>.bat</code> launcher</summary>

<br />

Double-click **`FreeCrawl-SEO-Tool-Start.bat`** at the repo root. It verifies Node.js, runs `npm install` on first launch, then starts the app with `npm run dev`.

> **Don't want to install?** Grab the **portable `.exe`** from the [Releases page](https://github.com/kemalai/FreeCrawl-SEO-Tool/releases) — runs without installation.

Or manually:

```bat
git clone https://github.com/kemalai/FreeCrawl-SEO-Tool.git
cd FreeCrawl-SEO-Tool
npm install
npm run dev
```

</details>

<details>
<summary><b>🍎 macOS</b> — Apple Silicon + Intel</summary>

<br />

Easiest path is the **`FreeCrawl-SEO-Tool-Start.sh`** launcher at the repo root — same one-click flow as the Windows `.bat` (verifies Node, prompts to install on first run, then starts the app).

```bash
chmod +x FreeCrawl-SEO-Tool-Start.sh
./FreeCrawl-SEO-Tool-Start.sh
```

Or manually:

```bash
# 1. Install prerequisites (skip any you already have)
brew install node@22 git
xcode-select --install      # Command Line Tools — required once

# 2. Clone and run
git clone https://github.com/kemalai/FreeCrawl-SEO-Tool.git
cd FreeCrawl-SEO-Tool
npm install
npm run dev
```

If macOS Gatekeeper blocks an unsigned local build (`"App is damaged"`):

```bash
xattr -cr "/Applications/FreeCrawl SEO.app"
```

</details>

<details>
<summary><b>🐧 Linux</b> — Debian / Ubuntu / Fedora / Arch</summary>

<br />

Easiest path is the **`FreeCrawl-SEO-Tool-Start.sh`** launcher at the repo root (same as macOS).

Prebuilt installers are available for all three families: **`.AppImage`** (universal), **`.deb`** (Debian / Ubuntu), and **`.rpm`** (Fedora / RHEL).

```bash
# 1. Install Node.js 22 LTS (Debian / Ubuntu via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git

# Fedora / RHEL : sudo dnf install nodejs:22 git
# Arch          : sudo pacman -S nodejs npm git

# 2. Clone and run
git clone https://github.com/kemalai/FreeCrawl-SEO-Tool.git
cd FreeCrawl-SEO-Tool
npm install
npm run dev
```

> Some headless / minimal distros also need GTK/X11 runtime libs for Electron:
> `sudo apt install -y libgtk-3-0 libnss3 libasound2t64`

</details>

<details>
<summary><b>⌨ CLI (headless crawl)</b></summary>

<br />

```bash
npm run build:cli
node apps/cli/dist/index.js https://example.com --depth 2 --max 500 --out out.csv
node apps/cli/dist/index.js --list urls.txt --out out.json     # list mode + JSON

# Log file analysis — parse an access log into the project for crawl × log reporting
node apps/cli/dist/index.js analyze-logs samples/apache-access.txt --project crawl.seoproject
node apps/cli/dist/index.js analyze-logs access.log --format iis-w3c --verify-bots --json
```

> **Sample logs** ship in [`samples/`](samples/) (`apache-access.txt`, `iis-access.txt`) so you can try the Log File Analyzer immediately — in the desktop app, open **Log Analyzer → Open Log Analyzer Window…** and import one.

**CI / CD recipes** — ready-to-use [GitHub Actions](docs/ci/github-actions-example.yml) and [GitLab CI](docs/ci/gitlab-ci-example.yml) examples that crawl your site on a schedule, fail the build when broken-URL count exceeds a threshold, and upload the crawl as an artifact.

</details>

<details>
<summary><b>📦 Production build (per-platform installers)</b></summary>

<br />

```bash
npm run build                                  # all packages + desktop + CLI
npm --workspace apps/desktop run build:win     # Windows installer (NSIS) + portable .exe
npm --workspace apps/desktop run build:mac     # macOS DMG (arm64 + x64)
npm --workspace apps/desktop run build:linux   # AppImage / .deb / .rpm
```

</details>

<details>
<summary><b>🤖 MCP server</b> — query AND drive crawls from Claude / any MCP client</summary>

<br />

FreeCrawl ships an **MCP (Model Context Protocol) server** that exposes the active `.seoproject` to AI agents over stdio. Two capabilities in one server:

1. **Read-only data access** to the SQLite project — runs alongside the desktop app without contention (WAL allows concurrent readers).
2. **Live crawl control** — when the desktop app is open, an agent can start / pause / resume / stop crawls and poll progress in real time. This goes through a localhost-only HTTP bridge (127.0.0.1, ephemeral random port, 32-byte Bearer token auth, discovery file written to `<userData>/mcp-bridge.json` on app launch).

**96 tools** — every action a human can take in the desktop is callable from an agent. Representative groups:

| Group | Tools |
| :--- | :--- |
| 📊 **Top-level data** | `get_summary`, `get_overview_counts`, `top_issues`, `query_urls`, `get_url_detail` |
| 🔬 **Per-URL detail sub-tabs** | `get_url_source` (raw + rendered + screenshot paths), `get_url_inlinks`, `get_url_outlinks`, `get_url_images`, `get_url_headers`, `get_url_duplicates`, `get_url_analytics`, `get_url_cert` |
| 🧩 **Integration rows** | `query_gsc`, `query_ga4`, `query_pagespeed`, `query_crux`, `query_spelling`, `get_url_spelling`, `query_ai`, `query_seo` |
| 🔎 **Specialised queries** | `query_images`, `query_broken_links`, `list_duplicate_clusters` |
| 📈 **Reports** | `report_status_code_histogram`, `report_indexability_distribution`, `report_content_kind_distribution`, `report_depth_histogram`, `report_response_time_histogram`, `report_inlinks_histogram`, `report_word_count_histogram`, `report_url_length_histogram`, `report_top_urls_by`, `report_top_anchor_texts`, `report_external_domain_health`, `report_image_weight_per_page`, `report_link_position_breakdown`, `report_pages_per_directory`, `report_word_count_per_directory`, `report_sitemap_orphans`, `report_orphan_cross_source`, `report_analytics_coverage`, `report_server_header_breakdown`, `report_query_string_variants`, `report_sitemap_priority_mismatch`, `report_top_words` |
| 📤 **Exports & mutations** | `export_csv`, `export_json`, `export_xml`, `export_html_report`, `export_tabular`, `export_bulk`, `export_broken_links`, `export_images`, `sitemap_generate`, `sitemap_validate`, `robots_test`, `robots_validate`, `compare_load`, `crawl_add_url`, `respider_urls`, `remove_urls`, `data_delete_by_domain`, `graph_snapshot`, `get_crawl_path`, `url_rewrite_preview`, `extraction_preview` |
| 🔐 **Project files** | `project_save_as`, `project_save_encrypted`, `project_open_encrypted` |
| 🔌 **Integration fetch** | `google_auth_status`, `gsc_list_sites`, `gsc_fetch`, `ga4_list_properties`, `ga4_fetch`, `pagespeed_run`, `crux_run`, `spelling_run`, `ai_run`, `seo_run`, `get_fetch_progress`, `cancel_fetch` |
| ⚙ **Config & schedule** | `get_crawl_config`, `set_crawl_config`, `schedule_get`, `schedule_set` |
| 📁 **Project management** | `list_projects`, `set_project`, `current_project` |
| 🕷 **Crawl control** (desktop must be open) | `start_crawl`, `stop_crawl`, `pause_crawl`, `resume_crawl`, `clear_crawl`, `get_crawl_progress`, `get_desktop_project` |

`start_crawl` accepts a `startUrl` plus optional whitelisted overrides (scope, maxDepth, maxUrls, maxConcurrency, maxRps, crawlDelayMs, requestTimeoutMs, respectRobotsTxt, followRedirects, crawlExternal, userAgent, include/excludePatterns) — anything you don't override keeps the desktop user's saved value. Crawls launched via MCP go through the **same code path** as the UI's Start button, so progress shows up in the desktop app live as the agent drives it. Call `clear_crawl` first when you want a fresh BFS after a completed crawl with the same seed URL (otherwise the crawler treats the re-start as a resume and exits because every URL is already in the DB).

**1. Build it once:**

```bash
npm run build:mcp
```

This produces `apps/mcp-server/dist/index.js`.

**2. Register it with your MCP client.**

<details>
<summary><b>Claude Desktop</b></summary>

Edit your Claude Desktop config:

| Platform | Path |
| :--- | :--- |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "freecrawl": {
      "command": "node",
      "args": ["/absolute/path/to/FreeCrawl-SEO-Tool/apps/mcp-server/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. The `freecrawl` server appears under the tool 🔌 icon.

</details>

<details>
<summary><b>Claude Code (CLI)</b></summary>

```bash
claude mcp add freecrawl -- node /absolute/path/to/FreeCrawl-SEO-Tool/apps/mcp-server/dist/index.js
```

</details>

<details>
<summary><b>Other MCP clients</b></summary>

Run the binary directly with stdio transport:

```bash
node apps/mcp-server/dist/index.js
```

The server speaks newline-delimited JSON-RPC 2.0 — point any MCP-compatible client at it.

</details>

**3. Try it.** Ask your agent things like:

> *"Crawl https://example.com with maxDepth 3 and watch the progress."*
> *"Show the 10 URLs with the longest response time in my last crawl."*
> *"What are the top 5 issue categories with the most affected pages?"*
> *"List every URL with a missing meta description."*
> *"Pause the running crawl, then resume it once I've checked the first 1000 URLs."*

**Pointing at a non-default project:**

By default the server reads `<userData>/projects/default.seoproject` (the same file the desktop app uses). Override with the `FREECRAWL_PROJECT` env var, or call the `set_project` tool mid-session:

```json
{
  "mcpServers": {
    "freecrawl": {
      "command": "node",
      "args": ["/path/to/apps/mcp-server/dist/index.js"],
      "env": { "FREECRAWL_PROJECT": "/path/to/audit.seoproject" }
    }
  }
}
```

</details>

<br />

---

## 📋 Prerequisites

<details>
<summary><b>For developers / source builds</b></summary>

<br />

| Component | Minimum | Where |
| :--- | :--- | :--- |
| **Node.js** | 22 LTS (24 also OK) | [nodejs.org](https://nodejs.org/) |
| **npm** | 10+ (ships with Node) | bundled |
| **Git** | any recent | [git-scm.com](https://git-scm.com/) |

> **Why no Python / MSBuild / node-gyp?** FreeCrawl uses Node 22's built-in `node:sqlite` instead of `better-sqlite3`. There are zero native dependencies — `npm install` never invokes a C++ compiler.

Verify your setup:

```bash
node --version    # v22.x.x or v24.x.x
npm --version     # 10+
```

</details>

<details>
<summary><b>Runtime requirements (any platform)</b></summary>

<br />

- **Outbound HTTPS access** to the sites you crawl. Behind a corporate proxy? Set `HTTPS_PROXY=http://your-proxy:port` before launch, or enter a proxy URL in **Settings → Network** — HTTP/HTTPS proxies route through undici's `ProxyAgent`, and **SOCKS5 / SOCKS4 proxies** (`socks5://…`, including the `h` / `4a` remote-DNS variants — handy for routing crawls through Tor / a SSH tunnel) are tunnelled automatically.
- **TLS root certificates**. Node ships with the Mozilla CA bundle. If your antivirus or company proxy performs HTTPS inspection (Kaspersky, ESET, Zscaler, BlueCoat, …), set `NODE_EXTRA_CA_CERTS=C:\path\to\corp-ca-bundle.crt` — otherwise crawls fail with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`.

</details>

<details>
<summary><b>Disk + memory budget</b></summary>

<br />

| Resource | Size |
| :--- | :--- |
| `node_modules` after `npm install` | ~600 MB |
| Production Electron build | ~150 MB |
| Peak RAM, 100K-URL crawl | ~100 MB |
| 1M-URL crawl | comfortably under 1 GB |

</details>

<br />

---

## 📁 Project Structure

```
FreeCrawl-SEO-Tool/
├── 📄 FreeCrawl-SEO-Tool-Start.bat   # Windows one-click launcher
├── 📄 FreeCrawl-SEO-Tool-Start.sh    # macOS / Linux one-click launcher
├── 📄 CHANGELOG.md                   # versioned release notes
├── 📂 apps/
│   ├── 🪟 desktop/                   # Electron app (main + preload + renderer)
│   ├── ⌨  cli/                       # headless Node CLI
│   └── 🤖 mcp-server/                # MCP server for AI agents
└── 📂 packages/
    ├── 🔗 shared-types/              # IPC + domain types
    ├── 💾 db/                        # ProjectDb (node:sqlite) + migrations
    └── 🕷 core/                      # crawler engine (UI-agnostic)
```

**Dependency graph**

```mermaid
graph LR
  A[shared-types] --> B[db]
  B --> C[core]
  C --> D[desktop]
  C --> E[cli]
  B --> F[mcp-server]
```

<br />

---

## 📈 Status

> [!NOTE]
> **Active development.** All 32 analysis tabs are working — the core set (Internal, External, Response Codes, URL, Page Titles, Meta Description, H1, H2, Content, Images, Canonicals, Directives, Redirects, Pagination, Hreflang, AMP, Structured Data, Meta Refresh, Custom Extraction, Custom Search, Security, Duplicates, Links, Broken Links, SERP) plus the integration tabs (**PageSpeed, CrUX, Spelling, Search Console, GA4, AI, SEO Authority**).
>
> Also shipping: 150+ issue checks, **JavaScript rendering** (Playwright — post-JS DOM, screenshots, LCP candidate, Mobile Usability audit), **multi-window projects** (independent per-window crawls), near/exact-duplicate detection, hreflang validation, **internal PageRank link scoring**, project compare, the **link visualiser** (WebGL 3D force-directed crawl tree and link graph, plus 2D Crawl Tree and Directory Tree with click-to-collapse branches, hover summary cards, LCP and link-score overlays, and a click-to-trace Crawl Path Report), **Basic / Digest / Bearer + form-based & browser-driven SPA login**, **HTTP / SOCKS5 proxy**, the **MCP server with live crawl control**, all **Google integrations** (Search Console / URL Inspection / GA4 / PageSpeed / CrUX), **LanguageTool spelling & grammar**, **AI per-URL prompts** (OpenAI / Anthropic / Ollama), **SEO Authority providers** (Ahrefs / Majestic / Moz / Semrush), **Google Sheets + BigQuery export**, **encrypted project snapshots** (AES-256-GCM), **RAM-only storage mode**, scheduled crawls, robots.txt validator, URL rewriting, EN + TR UI, and the **standalone Log File Analyzer** (Apache / Nginx / IIS access logs → bot hits, crawl budget, crawl × log orphans, 40+ bot detection, CSV / Excel export, and a headless `analyze-logs` CLI).
>
> Cross-platform installers ship for Windows (`.exe` + portable), macOS (`.dmg`), and Linux (`.AppImage` / `.deb` / `.rpm`), with Playwright Chromium bundled so JS rendering works on first launch. The virtualized 1M-row table streams the **first row in ~1 s**.
>
> **Apple Silicon tuning:** long crawls hold a power assertion so macOS App Nap can't throttle them in the background, concurrency scales down automatically as the thermal state rises (so a fanless MacBook Air degrades gracefully instead of stalling), heavy aggregates never run on the main thread, and every large read is batch-streamed to stay clear of Electron's hard per-process heap ceiling. macOS also gets the full Windows-style `Cmd`-key shortcut set.
>
> **Upcoming:** Plugin system, Light theme, Code-signing + auto-update.

<br />

---

## 🤝 Contributing & Support

<div align="center">

| | |
| :---: | :---: |
| 🐛 **Found a bug?** | [Open an issue](https://github.com/kemalai/FreeCrawl-SEO-Tool/issues) |
| 💡 **Have a feature idea?** | [Start a discussion](https://github.com/kemalai/FreeCrawl-SEO-Tool/issues) |
| 📦 **Want the prebuilt app?** | [Download a release](https://github.com/kemalai/FreeCrawl-SEO-Tool/releases) |
| 🌐 **Project website** | [freecrawl.net](https://freecrawl.net/) |

</div>

<br />

---

<div align="center">

### 📜 License

**MIT** — see [LICENSE](LICENSE)

<sub>Built with ❤ for SEO professionals who want a fast, free, open alternative to Screaming Frog.</sub>

</div>
