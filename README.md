<div align="center">

# FreeCrawl SEO Tool

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

## ✨ Highlights

<table>
<tr>
<td width="50%" valign="top">

### 🚀 Crawler
- **undici** HTTP client with keep-alive Agent
- **80–150 URL/s** typical throughput
- **1M+ URL** crawls on a single machine
- robots.txt, sitemaps, redirect chains
- HTTP Basic / Bearer auth, proxy override
- Pause / Resume / manual URL injection
- **JavaScript rendering** via headless Chromium (Playwright) — post-JS DOM, screenshot capture (full / above-fold / mobile), LCP candidate, Mobile Usability audit

</td>
<td width="50%" valign="top">

### 🔍 Analysis
- **150+ SEO issue checks** across 25 top-level tabs
- Near-duplicate clustering (SimHash + LSH) + exact-duplicate content hash
- Full hreflang validation (reciprocity, self-ref, inconsistent lang)
- OpenGraph / Twitter Card / JSON-LD / AMP / **Web App Manifest** parsing
- **Structured-data validation** — duplicate `@id`, malformed `@type`, missing required props
- **Accessibility** — `<main>` landmark, skip-link, ARIA roles, heading order
- SSL/TLS cert chain audit, security headers, **CORS audit**
- **Active vs passive mixed content** split
- Readability (Flesch, Flesch–Kincaid, Gunning Fog)
- Custom CSS + Regex extraction (10 rules) + `/regex/` literal Custom Search
- **PageSpeed Insights** — on-demand Lighthouse audits (mobile + desktop) per URL
- **Google Search Console + GA4** — clicks / impressions / CTR / position / sessions / users joined onto crawled pages
- **URL Inspection** — coverage verdict, last-crawl time, canonical decisions in batches
- **AI per-URL** — OpenAI / Anthropic / local Ollama prompts with shared variables (`{url}`/`{title}`/`{description}`/`{h1}`/`{body}`)
- **SEO Authority** — Ahrefs / Majestic / Moz / Semrush metrics behind one provider dropdown
- **Cross-source orphan detection** — pages PSI / GSC / GA4 / sitemap know about but the crawl never reached

</td>
</tr>
<tr>
<td valign="top">

### 🖥 Desktop UI
- Dense dark theme, virtualized 1M+ row tables
- **Multi-language UI** (English + Turkish) — full coverage including all Settings panels
- Live-streaming rows during crawl
- Advanced AND/OR search (24 fields × 12 ops)
- **Per-tab quick-filter dropdown** — instant filtering by Overview sub-categories without leaving the tab
- **List ↔ Tree view toggle** — switch between flat virtual table and URL-path hierarchy with collapsible folders
- Detail panel with 15 sub-tabs — adds **View Rendered** (post-JS DOM) + **Screenshot** (full/fold/mobile preview) when JS rendering is on
- **Visualization in its own native window** — open from menu, park on a second monitor while data tables stay free
- Per-URL **Duplicates** view (cluster siblings)
- **Live memory monitor** in status bar (RSS / Sys Free / per-URL cost / capacity projection)
- **Robots.txt syntax validator** in the Robots Tester (typo suggestions, orphan rules, sitemap URL check)
- **In-app scheduled crawl** (hourly / daily / weekly / custom) per project
- **`.seoproject` file association** — double-click a project file from the OS to open it
- URL rewriting (regex + whitelist + live preview)
- Cytoscape graph + anchor-text word cloud + **Top Words** report
- Custom CSS theme override (`custom-theme.css` in user-data folder)
- Diagnostic popups for DNS/TLS/proxy issues

</td>
<td valign="top">

### 📤 Export & Reports
- **22 reports** — histograms, top/bottom URLs, link positions, top words, **cross-source orphan pages**
- **Export Crawl Data dialog** — single menu entry with format picker (**Excel `.xlsx`** / **CSV UTF-8** / **JSON** / **XML**) + hierarchical tree picker (top tables + structural sub-categories) + nested folder output
- Per-tab in-context export button (current category) + dedicated **Images CSV export** (honours missing-alt + search)
- Standalone HTML audit report
- Sitemap generator (image / hreflang / sharded / gz)
- Project-vs-project compare diff
- **Google Sheets** + **BigQuery** direct export (OAuth / service-account)
- **Encrypted project snapshots** — password-protected `.seoproject.enc` (AES-256-GCM + PBKDF2)
- **MCP server** for AI agents — **drive crawls live from Claude Code**, poll progress, plus full read-only DB access
- Webhook on completion + OS notifications

</td>
</tr>
</table>

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
```

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

**14 tools**:

| Group | Tools |
| :--- | :--- |
| 📊 **Data queries** (always available) | `get_summary`, `get_overview_counts`, `top_issues`, `query_urls`, `get_url_detail` |
| 📁 **Project management** | `list_projects`, `set_project`, `current_project` |
| 🕷 **Crawl control** (desktop must be open) | `start_crawl`, `stop_crawl`, `pause_crawl`, `resume_crawl`, `get_crawl_progress`, `get_desktop_project` |

`start_crawl` accepts a `startUrl` plus optional whitelisted overrides (scope, maxDepth, maxUrls, maxConcurrency, maxRps, crawlDelayMs, requestTimeoutMs, respectRobotsTxt, followRedirects, crawlExternal, userAgent, include/excludePatterns) — anything you don't override keeps the desktop user's saved value. Crawls launched via MCP go through the **same code path** as the UI's Start button, so progress shows up in the desktop app live as the agent drives it.

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

- **Outbound HTTPS access** to the sites you crawl. Behind a corporate proxy? Set `HTTPS_PROXY=http://your-proxy:port` before launch — undici's `ProxyAgent` routes through it automatically.
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
> **Active development.** All 29 analysis tabs (Internal, External, Response Codes, URL, Page Titles, Meta Description, H1, H2, Content, Images, Canonicals, Directives, Redirects, Pagination, Hreflang, AMP, Structured Data, Meta Refresh, Custom Extraction, Custom Search, Security, Duplicates, Links, Broken Links, SERP, **PageSpeed, Search Console, GA4, AI, SEO Authority**) plus standalone Visualization window, advanced search, **per-tab quick-filter dropdown** + **List/Tree view toggle**, 150+ issue categories, sitemap export variants, **Export Crawl Data dialog (XLSX / CSV-UTF-8 / JSON / XML with hierarchical tree picker + nested folder output)**, list mode, custom extraction, near-duplicate + exact-duplicate detection, hreflang validation, project compare, Cytoscape visualization, auth, proxy, webhook, **MCP server with crawl control + live progress**, **Google PageSpeed / Search Console / URL Inspection / GA4 integrations**, **AI per-URL prompts (OpenAI / Anthropic / Ollama)**, **SEO Authority providers (Ahrefs / Majestic / Moz / Semrush)**, **Google Sheets + BigQuery direct export**, **encrypted project snapshots (AES-256-GCM)**, **cross-source orphan detection**, **JavaScript rendering with Playwright (post-JS DOM, screenshot capture, LCP candidate, Mobile Usability audit)**, **memory-limit auto-pause watchdog**, OS notifications, **robots.txt syntax validator**, URL rewriting + preview, **status-code diagnosis banner**, **live memory monitor**, **in-app scheduled crawl**, **multi-language UI (EN + TR) with full Settings coverage**, **`.seoproject` file association**, in-app logs, and diagnostic popups are working. Cross-platform installers (Windows `.exe` + portable, macOS `.dmg`, Linux `.AppImage` / `.deb` / `.rpm`) — **release builds ship Playwright Chromium offline so JS rendering works on first launch**. Live-streaming UX with **first row in ~1 s**.
>
> **Upcoming (V2):** Log file analyzer, Plugin system, Light theme, Multi-window, Code-signing + auto-update.

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
