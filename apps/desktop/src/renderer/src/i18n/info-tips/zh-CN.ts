/**
 * Simplified Chinese InfoTip ([i] tooltip) bodies, keyed by the verbatim English
 * source string. See `../info-tips.ts` for the rationale.
 */

export const ZH_CN_INFO_TIPS: Record<string, string> = {
  ["?page=1 / ?page=2 / ?page=4 → flags 'Sequence Break' on every member of the broken cluster."]:
    '?page=1 / ?page=2 / ?page=4 → 对断裂分组的每个成员标记“序列断裂”。',
  ['`<a>` elements that look clickable but aren\'t crawlable (no href + onclick, `href="javascript:…"`, or `href="#"` with onclick).']:
    '看起来可点击但无法抓取的 `<a>` 元素（无 href 但有 onclick、`href="javascript:…"`，或带 onclick 的 `href="#"`）。',
  ['`<link rel="amphtml" href="…">` value — the AMP version of this page. Empty when the page does not declare an AMP alternate.']:
    '`<link rel="amphtml" href="…">` 的值——本页的 AMP 版本。页面未声明 AMP 替代版本时为空。',
  ['`<link rel="next" href="…">` value resolved to absolute. Empty when the page is not paginated forward.']:
    '`<link rel="next" href="…">` 的值，已解析为绝对地址。页面没有向后分页时为空。',
  ['`<link rel="prev" href="…">` value resolved to absolute. Empty when the page is the first in its pagination cluster.']:
    '`<link rel="prev" href="…">` 的值，已解析为绝对地址。页面是其分页组中第一页时为空。',
  ['`css` runs against the parsed DOM; `regex` runs against raw HTML.']:
    '`css` 在解析后的 DOM 上运行；`regex` 在原始 HTML 上运行。',
  ['`none` disables auth; `basic` adds `Authorization: Basic <base64>`; `bearer` adds `Authorization: Bearer <token>`; `digest` performs the RFC 2617 challenge-response on the first 401.']:
    '`none` 关闭认证；`basic` 添加 `Authorization: Basic <base64>`；`bearer` 添加 `Authorization: Bearer <token>`；`digest` 在首次 401 时执行 RFC 2617 质询-响应。',
  ['`POST <url>` is fired when the `done` event emits. 10 s timeout. Failures are logged as info events but never break the crawl.']:
    '`done` 事件触发时发送 `POST <url>`。超时 10 秒。失败会记录为信息事件，但绝不会中断抓取。',
  ['0 (no duplicates), 7 (member of cluster #7)']: '0（无重复），7（第 7 组的成员）',
  ['0 = auto. 4 for 8GB RAM machines, 8+ for 16GB+.']:
    '0 = 自动。8GB 内存的机器用 4，16GB 及以上用 8+。',
  ["0 default; 250 ms when a host returns 429 with a 'too fast' message."]:
    '默认 0；当主机返回带“too fast”提示的 429 时用 250 毫秒。',
  ['0 for SSR sites, 2000 for typical SPAs, 5000+ for heavy client-rendered apps.']:
    'SSR 站点用 0，典型 SPA 用 2000，重度客户端渲染应用用 5000+。',
  ["0.1 default (Google 'good'); 0 to disable."]: '默认 0.1（Google 的“良好”阈值）；0 表示禁用。',
  ['1 = unique, 5 = part of a 5-page near-duplicate group']:
    '1 = 唯一，5 = 属于一个 5 页的近似重复组',
  ['10 (default), 3 for very tight chains, 0 to remove the cap']:
    '10（默认），3 用于极严格的链，0 表示取消上限',
  ['10 covers most sites; 3 limits crawls to top-of-funnel pages only.']:
    '10 覆盖大多数站点；3 将抓取限制在漏斗顶部页面。',
  ['100 default for most audits; 0 to disable the check.']: '大多数审计默认 100；0 表示禁用检查。',
  ['100 default; 50 for tight on-page link discipline; 0 to disable the issue.']:
    '默认 100；50 用于严格的页内链接纪律；0 表示禁用该问题。',
  ['1000000 (1M) for a full site audit; 5000 for spot checks.']:
    '全站审计用 1000000（1M）；抽查用 5000。',
  ['1024 (1 MB) default; 150 for a lean HTML budget; 0 to disable.']:
    '默认 1024（1 MB）；精简 HTML 预算用 150；0 表示禁用。',
  ['1048576 (1 MB) default; 524288 (512 KB) on tight disks; 0 to disable truncation entirely.']:
    '默认 1048576（1 MB）；磁盘紧张时用 524288（512 KB）；0 表示完全禁用截断。',
  ['10485760 (10 MB) on bandwidth-tight crawls; 0 to download anything.']:
    '带宽受限的抓取用 10485760（10 MB）；0 表示下载任何大小。',
  ['1366 = standard laptop, 1920 = full HD desktop, 375 = iPhone width.']:
    '1366 = 标准笔记本，1920 = 全高清桌面，375 = iPhone 宽度。',
  ['2 default; 0 to record errors immediately without retrying; 5 for unreliable upstreams.']:
    '默认 2；0 表示不重试立即记录错误；5 用于不稳定的上游。',
  ['20 default; 50 on fast first-party servers; 5 if the site rate-limits or returns 429s.']:
    '默认 20；快速的自有服务器用 50；站点限速或返回 429 时用 5。',
  ['20 for typical sites; 5 to be polite on shared hosting; 60+ when crawling your own infra.']:
    '典型站点用 20；共享主机上礼貌起见用 5；抓取自有基础设施时用 60+。',
  ['20000 (20 s) for typical use; 5000 for fast spot checks; 60000 for slow APIs.']:
    '典型用途 20000（20 秒）；快速抽查 5000；慢速 API 60000。',
  ['2048 (≈2 GB) on a 4 GB laptop; 8192 on a 16 GB workstation; 0 to disable.']:
    '4 GB 笔记本用 2048（≈2 GB）；16 GB 工作站用 8192；0 表示禁用。',
  ['2048 default (RFC-suggested practical ceiling).']: '默认 2048（RFC 建议的实际上限）。',
  ["2500 default (Google 'good'); 0 to disable."]: '默认 2500（Google 的“良好”阈值）；0 表示禁用。',
  ['3 = recommended; 5 catches looser duplicates (templated content with light variation); 0 turns the post-crawl pass off.']:
    '3 = 推荐；5 可捕获更宽松的重复（略有差异的模板内容）；0 关闭抓取后处理。',
  ['4 default; 6 on documentation sites with deep TOC trees; 0 to disable.']:
    '默认 4；目录树很深的文档站点用 6；0 表示禁用。',
  ['500 default. Bump to 2000 when retrying against a flaky API.']:
    '默认 500。对不稳定的 API 重试时提高到 2000。',
  ['50000 keeps RAM bounded during big sitemap fan-outs; 0 for typical crawls.']:
    '50000 可在大型 sitemap 扩散期间限制内存；典型抓取用 0。',
  ['60000 (1 minute) for huge resources; 0 to rely solely on the fetch timeout.']:
    '超大资源用 60000（1 分钟）；0 表示仅依赖抓取超时。',
  ['64-bit SimHash + LSH bucketing + Union-Find clustering on body shingles. Most expensive pass — typical 5–10 s on a 100k crawl.']:
    '64 位 SimHash + LSH 分桶 + 基于正文 shingle 的 Union-Find 聚类。最耗时的处理——10 万页抓取通常需 5–10 秒。',
  ['768 = standard laptop, 1080 = full HD desktop, 667 = iPhone 8 height.']:
    '768 = 标准笔记本，1080 = 全高清桌面，667 = iPhone 8 高度。',
  ['800 default; 200 for CDN-backed static; 0 to disable.']:
    '默认 800；CDN 托管的静态站点用 200；0 表示禁用。',
  ['Aborts @font-face / Google Fonts / WOFF2 requests. FOUT visible but text still renders.']:
    '中止 @font-face / Google Fonts / WOFF2 请求。会出现 FOUT，但文本仍会渲染。',
  ['Aborts <img>, <picture>, background-image requests. Recommended for SEO crawls — image metadata still comes from <img> tag attributes.']:
    '中止 <img>、<picture>、background-image 请求。推荐用于 SEO 抓取——图片元数据仍来自 <img> 标签属性。',
  ['Aborts <video> / <audio> sources. Page DOM still includes the <video> tag.']:
    '中止 <video> / <audio> 源。页面 DOM 仍包含 <video> 标签。',
  ['Aborts all <script> requests. This defeats the purpose of JS rendering — use Text Only mode instead.']:
    '中止所有 <script> 请求。这会使 JS 渲染失去意义——请改用纯文本模式。',
  ['Aborts external CSS. Inline styles still load. WARNING: many SPAs use CSS-driven visibility / lazy classes — blocking CSS may hide content that JS depends on.']:
    '中止外部 CSS。内联样式仍会加载。警告：许多 SPA 使用由 CSS 驱动的可见性 / 懒加载类——阻止 CSS 可能隐藏 JS 依赖的内容。',
  ['Aborts requests whose total lifetime (connect + headers + body) exceeds this. Distinct from `requestTimeoutMs` which is the headers timeout. Useful for capping individual slow pages without lowering the overall fetch timeout.']:
    '中止总耗时（连接 + 响应头 + 响应体）超过此值的请求。不同于仅针对响应头超时的 `requestTimeoutMs`。适合在不降低整体抓取超时的前提下限制个别慢页面。',
  ['Absolute redirect target parsed from the meta-refresh content. Empty when meta-refresh sets only a delay.']:
    '从 meta-refresh 的 content 中解析出的绝对重定向目标。meta-refresh 仅设置延迟时为空。',
  ['Literal target of a JavaScript redirect found in an inline script (`window.location = "…"`, `location.href = "…"`, `location.replace("…")`). Followed when "Follow JavaScript redirects" is on.']:
    '内联脚本中发现的 JavaScript 重定向的字面目标（`window.location = "…"`、`location.href = "…"`、`location.replace("…")`）。开启"跟随 JavaScript 重定向"时会被跟随。',
  ['Additional time to wait after the chosen wait condition fires, for SPA hydration / late XHRs. 0 = no extra wait. Bounded by the request timeout.']:
    '所选等待条件触发后的额外等待时间，用于 SPA 水合 / 延迟的 XHR。0 = 不额外等待。受请求超时限制。',
  ['Anchor text of the broken link as rendered in the source page.']:
    '断链在来源页面中呈现的锚文本。',
  ['Audits the rendered DOM for WCAG AA colour-contrast failures (4.5:1 normal text, 3:1 large text) and stylesheet rules that suppress the keyboard focus outline without a :focus-visible fallback. Surfaces the Low-Contrast Text and Focus Outline Suppressed issue filters.']:
    '审计渲染后的 DOM，查找 WCAG AA 颜色对比度不达标（普通文本 4.5:1，大号文本 3:1）以及未提供 :focus-visible 回退就抑制键盘焦点轮廓的样式规则。为“低对比度文本”和“焦点轮廓被抑制”问题筛选器提供数据。',
  ['basic/digest for /staging behind nginx; bearer for protected APIs']:
    'nginx 后的 /staging 用 basic/digest；受保护的 API 用 bearer',
  ['Below Normal while you keep working in other apps; Idle for overnight unattended runs.']:
    '在其他应用中继续工作时用“低于正常”；通宵无人值守运行时用“空闲”。',
  ['BFS click depth from the start URL. Start URL = 0; its outlinks = 1; etc. High depth often correlates with low importance.']:
    '从起始 URL 开始的 BFS 点击深度。起始 URL = 0；其出链 = 1；以此类推。深度越大通常越不重要。',
  ['Bodies over this are truncated and flagged. 1 MB covers the 99.9th percentile of HTML pages without letting one adversarial 50 MB page bloat the project file.']:
    '超过此值的响应体会被截断并标记。1 MB 覆盖 99.9% 的 HTML 页面，且不会让一个恶意的 50 MB 页面撑大项目文件。',
  ['Buy Affordable Game Keys | Example Store']: '购买实惠的游戏密钥 | 示例商店',
  ['Character count of the first H1.']: '第一个 H1 的字符数。',
  ['Character count of the meta description. Recommended: 70–155 characters; over 155 risks truncation.']:
    'meta description 的字符数。建议：70–155 个字符；超过 155 有被截断的风险。',
  ['Character count of the title. Recommended: 30–60 characters; over 60 risks truncation in SERPs.']:
    '标题的字符数。建议：30–60 个字符；超过 60 有在搜索结果中被截断的风险。',
  ['Charikar 64-bit SimHash of body shingles. Used by the post-crawl near-duplicate clustering pass. Two SimHashes within the configured Hamming threshold are considered similar.']:
    '正文 shingle 的 Charikar 64 位 SimHash。由抓取后的近似重复聚类处理使用。两个 SimHash 在配置的汉明阈值内即视为相似。',
  ['Coarse content classification derived from URL extension and Content-Type header.']:
    '根据 URL 扩展名和 Content-Type 响应头得出的粗略内容分类。',
  ['Comma-joined sorted unique JSON-LD `@type` values declared on the page (Article, BreadcrumbList, Product, …).']:
    '页面上声明的 JSON-LD `@type` 去重排序后以逗号连接的值（Article、BreadcrumbList、Product 等）。',
  ['Contents of the first <meta name="description"> tag. May be used as the SERP snippet.']:
    '第一个 <meta name="description"> 标签的内容。可能被用作搜索结果摘要。',
  ['Contents of the first <meta name="robots"> tag. Controls per-page indexing/following behaviour.']:
    '第一个 <meta name="robots"> 标签的内容。控制页面级的索引/跟踪行为。',
  ['Contents of the first <title> element. Google primarily uses this in SERP titles.']:
    '第一个 <title> 元素的内容。Google 主要将其用于搜索结果标题。',
  ['Counts how many internal pages link to each URL. Drives the Most-Linked URLs report and the per-row Inlinks column.']:
    '统计有多少内部页面链接到每个 URL。为“被链接最多的 URL”报告和每行的“入链”列提供数据。',
  ["Crawl 3xx redirect targets. Each hop is its own row; the chain is reconstructed in the Response Codes view. Screaming Frog: 'Always Follow Redirects' (Configuration → Spider → Advanced)."]:
    "抓取 3xx 重定向目标。每一跳各占一行；重定向链在“响应码”视图中重建。Screaming Frog：'Always Follow Redirects'（Configuration → Spider → Advanced）。",
  ['Crawler RSS auto-pauses the queue when this is exceeded; resumes once memory drops to 80% of the cap. Soft cap — does not enforce a hard heap limit.']:
    '超过此值时抓取器 RSS 会自动暂停队列；内存降到上限的 80% 后恢复。软上限——不强制堆内存硬限制。',
  ['css for selectors, regex for free-form patterns']: '选择器用 css，自由形式的模式用 regex',
  ["CSS selector that pins the duplicate-fingerprint text extraction to a specific page region. When set, the heuristic (main / role=main / article / body-minus-chrome) is bypassed and the selector wins. Useful on sites where the heuristic misclassifies — e.g. CMSes that wrap navigation inside `<main>` or sites with no semantic landmarks at all. Empty = use the heuristic. Invalid selectors silently fall back to the heuristic so a typo doesn't break the crawl."]:
    '将重复指纹的文本提取固定到页面特定区域的 CSS 选择器。设置后将绕过启发式规则（main / role=main / article / 去掉页面框架的 body），以选择器为准。适用于启发式规则误判的站点——例如把导航包在 `<main>` 里的 CMS，或完全没有语义地标的站点。留空 = 使用启发式规则。无效的选择器会静默回退到启发式规则，以免一个拼写错误破坏抓取。',
  ["Cumulative Layout Shift from PageSpeed Insights, when present. Google's 'good' CLS threshold is 0.1. Unitless; accepts decimals. Pages without PSI data are never flagged."]:
    '来自 PageSpeed Insights 的 Cumulative Layout Shift（如有）。Google 的 CLS“良好”阈值为 0.1。无单位；接受小数。没有 PSI 数据的页面不会被标记。',
  ['Drives the View Source detail tab. ~30–200 KB on disk per HTML page; turn off if you only need metadata and not full source viewing.']:
    '为“查看源代码”详情标签提供数据。每个 HTML 页面约占 30–200 KB 磁盘空间；如果只需要元数据而不需要查看完整源码，请关闭。',
  ["Each rule runs JavaScript RegExp.replace on the fully-normalised URL. Flags default to 'g'. After all rules run, the result is re-parsed as a URL — if the rewrite produces an invalid URL, the link is dropped at normalisation time."]:
    "每条规则对完全规范化后的 URL 执行 JavaScript 的 RegExp.replace。默认标志为 'g'。所有规则运行后，结果会重新解析为 URL——如果重写产生无效 URL，该链接会在规范化时被丢弃。",
  ["Empty = safest. 'chrome' if you want the same Chrome version your users see."]:
    "留空 = 最安全。想使用与用户相同的 Chrome 版本时填 'chrome'。",
  ["Empty = use the bundled Playwright Chromium build (recommended — pinned version, works everywhere). 'chrome' / 'msedge' uses the system-installed browser. Beta channels for testing newer features."]:
    "留空 = 使用 Playwright 内置的 Chromium 构建（推荐——版本固定，随处可用）。'chrome' / 'msedge' 使用系统安装的浏览器。Beta 渠道用于测试更新的功能。",
  ["Fetch internal <img> resources (incl. srcset / <picture> sources) so they appear in the Internal tab with their own status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check Images' (Configuration → Spider → Crawl)."]:
    "抓取内部 <img> 资源（含 srcset / <picture> 源），使其以各自的状态码、内容类型和大小出现在“内部”标签页中。每个都计入最大 URL 数。Screaming Frog：'Check Images'（Configuration → Spider → Crawl）。",
  ["Fetch internal <link rel=stylesheet> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check CSS' (Configuration → Spider → Crawl)."]:
    "抓取内部 <link rel=stylesheet> 资源，使其带状态码、内容类型和大小出现在“内部”标签页中。每个都计入最大 URL 数。Screaming Frog：'Check CSS'（Configuration → Spider → Crawl）。",
  ["Fetch internal <script src> resources so they appear in the Internal tab with status code, content type, and size. Each counts toward Max URLs. Screaming Frog: 'Check JavaScript' (Configuration → Spider → Crawl)."]:
    "抓取内部 <script src> 资源，使其带状态码、内容类型和大小出现在“内部”标签页中。每个都计入最大 URL 数。Screaming Frog：'Check JavaScript'（Configuration → Spider → Crawl）。",
  ["Fetches /robots.txt sitemap directives + /sitemap.xml fallbacks. Powers the 'Non-Indexable in Sitemap' issue filter. Screaming Frog: 'Auto Discover XML Sitemaps via robots.txt' (Configuration → Spider → Crawl)."]:
    "获取 /robots.txt 中的 sitemap 指令 + /sitemap.xml 回退。为“sitemap 中不可索引”问题筛选器提供数据。Screaming Frog：'Auto Discover XML Sitemaps via robots.txt'（Configuration → Spider → Crawl）。",
  ["first/last for single value, all for JSON array, concat for ' | ' joined string"]:
    "单个值用 first/last，JSON 数组用 all，以 ' | ' 连接的字符串用 concat",
  ['FNV-1a 64-bit hash of the normalised body token stream. Two pages sharing this hash are byte-identical post-tokenisation — the basis of the Exact Duplicate filter.']:
    '规范化正文 token 流的 FNV-1a 64 位哈希。共享此哈希的两个页面在分词后逐字节相同——这是“完全重复”筛选器的基础。',
  ['For Basic, sent base64-encoded; for Digest, hashed into the challenge response.']:
    'Basic 以 base64 编码发送；Digest 则哈希进质询响应中。',
  ['For regex: `regex_group` extracts capture group 1; otherwise the whole match is used.']:
    '对于 regex：`regex_group` 提取捕获组 1；否则使用整个匹配。',
  ['Full-page renders the entire scrollable canvas; Above-the-fold captures just the initial viewport (cheaper). Both writes two PNGs per URL.']:
    '整页渲染整个可滚动画布；首屏只捕获初始视口（更省资源）。两者都为每个 URL 写入两个 PNG。',
  ['Google\'s index status, pulled from the URL Inspection API — not the Fetch button. Click "Inspect (top 100)" to fill this column; Fetch only pulls clicks / impressions / position.']:
    '来自 URL Inspection API 的 Google 索引状态——不是来自“获取”按钮。点击“检查（前 100 个）”填充此列；“获取”只拉取点击 / 展示 / 排名。',
  ["Googlebot — Smartphone matches Google's mobile-first indexing crawler."]:
    'Googlebot — Smartphone 对应 Google 的移动优先索引抓取器。',
  ['Hard cap on pending URLs held in memory. Excess discoveries are dropped silently — bounds peak heap during fan-out bursts (big sitemaps, dense link graphs).']:
    '内存中待处理 URL 的硬上限。超出的发现会被静默丢弃——限制扩散高峰（大型 sitemap、密集链接图）期间的峰值堆内存。',
  ['Hard cap on the number of 3xx hops we follow for a single chain. Each hop is recorded as its own URL row regardless. 0 disables the cap (chain still ends at `redirect_loop`).']:
    '单条链中跟随的 3xx 跳转数硬上限。无论如何每一跳都记录为独立的 URL 行。0 表示禁用上限（链仍在 `redirect_loop` 处终止）。',
  ["Hard cap on total URLs crawled. The crawl stops as soon as this is reached. Screaming Frog: 'Limit Crawl Total'."]:
    "抓取 URL 总数的硬上限。达到后立即停止抓取。Screaming Frog：'Limit Crawl Total'。",
  ["Hard ceiling on requests per second across all workers combined. Equivalent to Screaming Frog's 'Max URL/s'. Acts as a token bucket — even with high concurrency the crawler waits between bursts to stay below this rate."]:
    "所有 worker 合计的每秒请求数硬上限。相当于 Screaming Frog 的 'Max URL/s'。以令牌桶方式工作——即使并发很高，抓取器也会在突发之间等待以保持在此速率之下。",
  ['Height attribute value (in pixels) declared on the <img> tag, when present.']:
    '<img> 标签上声明的 height 属性值（像素），如有。',
  ["Honor Disallow rules + crawl-delay declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "遵守 /robots.txt 中为所配置 User-Agent 声明的 Disallow 规则 + crawl-delay。Screaming Frog：'Respect robots.txt'（Configuration → robots.txt）。",
  ["Hop count from the start URL. Start URL is depth 0; its outlinks are depth 1, theirs depth 2, and so on. Screaming Frog: 'Limit Crawl Depth' (Configuration → Spider → Limits)."]:
    "从起始 URL 开始的跳数。起始 URL 深度为 0；其出链深度为 1，再往下深度为 2，以此类推。Screaming Frog：'Limit Crawl Depth'（Configuration → Spider → Limits）。",
  ['How many distinct pages reference this image. High values typically indicate site-wide assets (logos, icons).']:
    '有多少个不同页面引用了此图片。数值高通常意味着全站通用资源（logo、图标）。',
  ["How to canonicalise paths with/without a trailing slash. 'Add' is file-extension aware — won't add a slash to /file.pdf or /image.png."]:
    '如何规范化带/不带尾部斜杠的路径。“添加”会识别文件扩展名——不会给 /file.pdf 或 /image.png 添加斜杠。',
  ['HTML attribute name to read.']: '要读取的 HTML 属性名。',
  ['HTML transfer size of the page document. Heavy HTML payloads delay first paint. Stored as bytes internally; entered here in kilobytes.']:
    '页面文档的 HTML 传输大小。过大的 HTML 会延迟首次绘制。内部以字节存储；此处以 KB 输入。',
  ['HTTP `<img>` / `<video>` / `<audio>` / `<source>` references on an HTTPS page — rendered but the URL bar reads "Not Secure".']:
    'HTTPS 页面上的 HTTP `<img>` / `<video>` / `<audio>` / `<source>` 引用——会渲染，但地址栏显示“不安全”。',
  ['HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` references on an HTTPS page — browsers BLOCK these silently.']:
    'HTTPS 页面上的 HTTP `<script>` / `<link rel=stylesheet>` / `<iframe>` / `<object>` / `<embed>` 引用——浏览器会静默阻止它们。',
  ['HTTP response status code. Empty/Failed indicates a network error before any response was received.']:
    'HTTP 响应状态码。空/失败表示在收到任何响应之前发生了网络错误。',
  ['HTTP status of the source page itself. Usually 200; if non-2xx the broken link may be inherited.']:
    '来源页面自身的 HTTP 状态。通常为 200；若非 2xx，断链可能是继承来的。',
  ['HTTP status returned by the target. 0 = network failure (DNS, TLS, timeout).']:
    '目标返回的 HTTP 状态。0 = 网络失败（DNS、TLS、超时）。',
  ["HTTP/HTTPS proxies route via undici's ProxyAgent; SOCKS proxies (socks5://, socks5h://, socks4://, socks4a://) tunnel via the socks client. The `h`/`4a` variants resolve DNS at the proxy. Leave empty to inherit HTTPS_PROXY/HTTP_PROXY env vars."]:
    'HTTP/HTTPS 代理通过 undici 的 ProxyAgent 路由；SOCKS 代理（socks5://、socks5h://、socks4://、socks4a://）通过 socks 客户端建立隧道。`h`/`4a` 变体在代理端解析 DNS。留空则继承 HTTPS_PROXY/HTTP_PROXY 环境变量。',
  ["Identifies the largest element visible in the initial viewport (likely LCP candidate per Google's heuristic) and stores its CSS selector, dimensions, and resource URL. Useful for spotting unoptimised LCP images without a PSI API call."]:
    '识别初始视口中可见的最大元素（按 Google 启发式规则的可能 LCP 候选），并存储其 CSS 选择器、尺寸和资源 URL。无需调用 PSI API 即可发现未优化的 LCP 图片。',
  ['If set, Playwright waits for this CSS selector to appear in the DOM before extracting HTML. Overrides the extra-wait timeout when present. Useful when you know the SPA reveals a specific element after hydration.']:
    '设置后，Playwright 会在提取 HTML 之前等待此 CSS 选择器出现在 DOM 中。存在时会覆盖额外等待超时。适合你确知 SPA 在水合后会显示某个特定元素的情况。',
  ['Images on this page that have no alt attribute. WCAG accessibility issue + missed alt-as-anchor SEO opportunity.']:
    '本页没有 alt 属性的图片。WCAG 无障碍问题 + 错失了 alt 作为锚文本的 SEO 机会。',
  ['Indexable / Non-Indexable']: '可索引 / 不可索引',
  ['Internal PageRank, 0–100. Computed over the internal link graph (damping 0.85) and normalised so the most-linked page scores 100. Higher = more internal link equity.']:
    '内部 PageRank，0–100。基于内部链接图计算（阻尼系数 0.85），并归一化为被链接最多的页面得 100。越高 = 内部链接权重越大。',
  ['internal / external']: '内部 / 外部',
  ['JavaScript executed in every page BEFORE navigation begins (init script). Use to set localStorage / cookies / mock APIs / disable animations. Runs in page context — no Node access.']:
    '在导航开始之前于每个页面执行的 JavaScript（初始化脚本）。可用于设置 localStorage / cookie / 模拟 API / 禁用动画。在页面上下文中运行——无 Node 访问权限。',
  ['JavaScript regex (no flags — /g is implicit). Use a capture group with `output=regex_group` to extract just part of the match.']:
    'JavaScript 正则（无标志——隐含 /g）。配合 `output=regex_group` 使用捕获组可只提取匹配的一部分。',
  ['JavaScript regex tested against the full URL. Empty = all URLs allowed. URL must match at least one to be enqueued. The start URL is always permitted regardless.']:
    '针对完整 URL 测试的 JavaScript 正则。留空 = 允许所有 URL。URL 至少匹配一条才会入队。起始 URL 始终允许。',
  ['JavaScript regex. Any match → URL is skipped, even if it would otherwise pass the include list. Common uses: skip admin areas, large file types, session-id query params.']:
    'JavaScript 正则。任何匹配 → 跳过该 URL，即使它本可通过包含列表。常见用途：跳过管理区域、大文件类型、会话 ID 查询参数。',
  ['JSON map of `{ term: count }` literal-substring hits from the configured Custom Search terms.']:
    '配置的自定义搜索词按字面子串命中的 `{ term: count }` JSON 映射。',
  ['JSON-stringified array of `{ lang, href }` pairs. Heavy column — better consumed via the URL Details panel.']:
    'JSON 序列化的 `{ lang, href }` 对数组。较重的列——更适合在“URL 详情”面板中查看。',
  ['JSON-stringified custom-extraction results map. Heavy column — render verbatim, easier to read in the URL Details panel.']:
    'JSON 序列化的自定义提取结果映射。较重的列——原样呈现，在“URL 详情”面板中更易阅读。',
  ['JSONPath against a JSON response body (e.g. `application/json` APIs). Only runs on responses that parse as JSON — ignored on HTML pages.']:
    '针对 JSON 响应体的 JSONPath（例如 `application/json` API）。仅对可解析为 JSON 的响应运行——HTML 页面会忽略。',
  ['JSONPath returns the matched JSON value as-is; choose `Count` to return the number of matches instead.']:
    'JSONPath 原样返回匹配到的 JSON 值；选择 `Count` 可改为返回匹配数量。',
  ["Largest Contentful Paint from PageSpeed Insights lab data, when the URL has been audited. Google's 'good' LCP threshold is 2500 ms. Pages without PSI data are never flagged on this metric."]:
    '来自 PageSpeed Insights 实验室数据的 Largest Contentful Paint（当 URL 已审计时）。Google 的 LCP“良好”阈值为 2500 毫秒。没有 PSI 数据的页面不会在此指标上被标记。',
  ['load = good default. networkidle for heavy SPAs. domcontentloaded if you only need raw HTML.']:
    'load = 良好的默认值。重度 SPA 用 networkidle。只需要原始 HTML 用 domcontentloaded。',
  ['Location header value when status is 3xx. The URL the server points to next; chain length is in the URL Details panel.']:
    '状态为 3xx 时的 Location 响应头值。服务器指向的下一个 URL；链长度见“URL 详情”面板。',
  ['Lowercases the URL path component. Host is already case-insensitive per the URL spec, so this only affects the path.']:
    '将 URL 路径部分转为小写。按 URL 规范主机已不区分大小写，因此这只影响路径。',
  ['Near-duplicate cluster ID assigned by the post-crawl SimHash pass. 0 = singleton (no near-duplicates within the configured Hamming threshold). Pages sharing a non-zero cluster ID are mutually similar.']:
    '由抓取后的 SimHash 处理分配的近似重复组 ID。0 = 单独页面（在配置的汉明阈值内无近似重复）。共享同一非零组 ID 的页面彼此相似。',
  ['noindex, canonicalised, redirected, blocked-by-robots']:
    'noindex、已规范化、已重定向、被 robots 阻止',
  ['None for fastest crawl. Above-the-fold for SERP-thumbnail-style preview. Full page when you need long-page snapshots.']:
    '无——抓取最快。首屏——用于搜索结果缩略图式的预览。整页——需要长页面快照时。',
  ['Number of `<form action="http://…">` declarations on an HTTPS page. Submitting one downgrades the connection.']:
    'HTTPS 页面上 `<form action="http://…">` 声明的数量。提交其中任一都会降级连接。',
  ['Number of `<link rel="alternate" hreflang>` entries declared on this page. 0 = no alternates declared.']:
    '本页声明的 `<link rel="alternate" hreflang>` 条目数。0 = 未声明替代版本。',
  ['Number of `<link rel="canonical">` tags on the page. >1 is a "Multiple Canonicals" issue.']:
    '页面上 `<link rel="canonical">` 标签的数量。>1 属于“多重规范链接”问题。',
  ['Number of `<script type="application/ld+json">` blocks parsed successfully on the page.']:
    '页面上成功解析的 `<script type="application/ld+json">` 块数量。',
  ['Number of `<script type="application/ld+json">` blocks that failed to parse as JSON.']:
    '无法解析为 JSON 的 `<script type="application/ld+json">` 块数量。',
  ['Number of <img> elements on the page.']: '页面上 <img> 元素的数量。',
  ['Number of browser tabs the pool keeps warm in parallel. 0 = auto (matches crawler concurrency, capped at 8). More tabs = faster crawl but more RAM (each tab ~80–150 MB).']:
    '池中并行保持预热的浏览器标签页数量。0 = 自动（与抓取器并发数一致，上限 8）。标签页越多 = 抓取越快但内存越多（每个标签页约 80–150 MB）。',
  ['Number of hreflang targets that are non-200, noindex, or canonicalised away. Aggregated by the post-crawl pass.']:
    '非 200、noindex 或被规范化到其他地址的 hreflang 目标数量。由抓取后处理汇总。',
  ["Number of HTTP requests in flight at any one time. Equivalent to Screaming Frog's 'Max Threads'. Higher = faster crawl + more load on the target server."]:
    "任一时刻进行中的 HTTP 请求数。相当于 Screaming Frog 的 'Max Threads'。越高 = 抓取越快 + 目标服务器负载越大。",
  ['Number of internal `<a>` elements with no usable anchor text or alt — accessibility / SEO regression.']:
    '没有可用锚文本或 alt 的内部 `<a>` 元素数量——无障碍 / SEO 退化。',
  ['Number of internal pages that link to this URL. A rough internal-PageRank signal.']:
    '链接到此 URL 的内部页面数。内部 PageRank 的粗略信号。',
  ["Number of pages in this URL's near-duplicate cluster (1 = no duplicates, ≥2 = part of a duplicate group). Tunable via Settings → Duplicates."]:
    '此 URL 所属近似重复组中的页面数（1 = 无重复，≥2 = 属于某个重复组）。可在设置 → 重复内容中调整。',
  ['Number of redirect hops from this URL to its terminal target. Filled by the post-crawl `recomputeRedirectChains` walker. >3 trips the "Long Chain" issue.']:
    '从此 URL 到最终目标的重定向跳数。由抓取后的 `recomputeRedirectChains` 遍历填充。>3 触发“长链”问题。',
  ['Number of unique <a> links emitted from this page (internal + external).']:
    '此页面发出的唯一 <a> 链接数（内部 + 外部）。',
  ['Off — only enable for testing edge cases.']: '关闭——仅在测试边缘情况时启用。',
  ['Off — small speed gain not worth the fidelity loss.']: '关闭——微小的速度提升不值得牺牲保真度。',
  ['On — fonts add overhead without changing SEO output.']:
    '开启——字体只增加开销，不改变 SEO 输出。',
  ['On (default) — cheap I/O, high SEO value.']: '开启（默认）——I/O 开销低，SEO 价值高。',
  ['On (default) — media is heavy and rarely SEO-relevant.']:
    '开启（默认）——媒体体积大且很少与 SEO 相关。',
  ['On (default) so the Internal tab shows images, not just HTML; off for HTML-only crawls.']:
    '开启（默认）以便“内部”标签页显示图片而不只是 HTML；仅 HTML 抓取时关闭。',
  ['On (default); off for HTML-only crawls.']: '开启（默认）；仅 HTML 抓取时关闭。',
  ['On (default). Off only when crawling sites you own and need to bypass.']:
    '开启（默认）。仅在抓取自己拥有且需要绕过限制的站点时关闭。',
  ['On for accessibility / WCAG audits.']: '开启用于无障碍 / WCAG 审计。',
  ['On for max speed. Off if you need LCP candidate detection or visual screenshots later.']:
    '开启以获得最高速度。若之后需要 LCP 候选检测或可视化截图则关闭。',
  ['On for modern sites that 301 http→https anyway; off for legacy intranet.']:
    '对反正会 301 从 http 跳到 https 的现代站点开启；对老旧内网关闭。',
  ['On for normal audits; off when you only want to inspect raw 3xx behaviour.']:
    '常规审计开启；只想检查原始 3xx 行为时关闭。',
  ['On for outbound link audits; off for fast internal-only crawls.']:
    '出站链接审计开启；快速的仅内部抓取关闭。',
  ['On for performance-focused audits that should fail pages over a target.']:
    '开启用于需要让超过目标的页面判为不合格的性能审计。',
  ['On for performance-focused audits.']: '开启用于以性能为重点的审计。',
  ['On for production crawls. Off when debugging selector-not-found / hydration issues.']:
    '生产抓取开启。调试“找不到选择器”/ 水合问题时关闭。',
  ['ON for SEO audits (the typical case). Turn OFF to also cluster paginated / canonical-blocked variants for completeness.']:
    'SEO 审计（典型情况）开启。关闭则为求完整同时对分页 / 被规范链接阻止的变体进行聚类。',
  ["On for SEO audits that include Google's Mobile-Friendly checks."]:
    '开启用于包含 Google 移动设备适合性检查的 SEO 审计。',
  ['On for SEO audits where View Source matters; off for 1M-URL crawls where disk is tight.']:
    '“查看源代码”重要的 SEO 审计开启；磁盘紧张的百万级 URL 抓取关闭。',
  ['ON for SEO audits. OFF only when you specifically need to inspect raw-URL collisions (e.g. case-sensitive filesystem CMSes).']:
    'SEO 审计开启。仅在需要专门检查原始 URL 冲突（例如区分大小写文件系统的 CMS）时关闭。',
  ['On if you need nofollow attribute audits; off keeps the link graph cleaner.']:
    '需要审计 nofollow 属性时开启；关闭可让链接图更干净。',
  ['On if your CMS serves the same page at mixed casing (/Foo and /foo).']:
    '如果你的 CMS 以混合大小写提供同一页面（/Foo 和 /foo）则开启。',
  ['On if your site canonicalises to non-www but emits www links somewhere.']:
    '如果你的站点规范化为不带 www，但某处输出了 www 链接则开启。',
  ["On network errors, 408/425/429/5xx responses, retry up to N more times before giving up. Each retry counts toward the URL's response time budget."]:
    '遇到网络错误及 408/425/429/5xx 响应时，最多再重试 N 次后放弃。每次重试都计入该 URL 的响应时间预算。',
  ['On when auditing mobile UX or capturing PageSpeed-style mobile previews.']:
    '审计移动端 UX 或捕获 PageSpeed 风格的移动端预览时开启。',
  ["One header per line in 'Key: Value' format. Added to every request — useful for auth tokens or custom routing hints. User values override defaults when keys collide."]:
    "每行一个响应头，格式为 'Key: Value'。添加到每个请求——适用于认证令牌或自定义路由提示。键冲突时用户值覆盖默认值。",
  ['One sitemap URL per line. On top of following links from the start URL, the crawler fetches these sitemaps and queues every page they list as an extra seed — faster/more complete discovery, and reliable orphan detection even when the sitemap lives at a non-standard path. Leave empty to disable.']:
    '每行一个 sitemap URL。除了从起始 URL 跟踪链接外，抓取器还会获取这些 sitemap 并将其列出的每个页面作为额外种子入队——发现更快/更完整，即使 sitemap 位于非标准路径也能可靠检测孤立页面。留空则禁用。',
  ['One URL per line. Each is fetched exactly once; outlinks are NOT followed. Comments starting with # are ignored.']:
    '每行一个 URL。每个只抓取一次；不跟踪出链。以 # 开头的注释会被忽略。',
  ['OS scheduler hint applied at crawl start. Lowering priority lets the rest of the machine stay responsive during heavy crawls. May require elevated privileges on some platforms.']:
    '抓取开始时应用的操作系统调度提示。降低优先级可让机器其余部分在重度抓取期间保持响应。某些平台可能需要提升权限。',
  ["Page A→B declared but B→A absent flags 'Reciprocity Missing'; same lang on two hrefs flags 'Inconsistent Lang'."]:
    '页面 A→B 已声明但 B→A 缺失时标记“缺少互链”；两个 href 使用相同 lang 时标记“lang 不一致”。',
  ['Page that contains the broken link.']: '包含断链的页面。',
  ["Pages with > this many outgoing links (internal + external) trip the 'Total Links per Page' issue. Google's historic recommendation is 100; mega-menus/hub-pages routinely blow past this."]:
    '出链（内部 + 外部）超过此数量的页面会触发“每页链接总数”问题。Google 历史建议为 100；巨型菜单/枢纽页面经常远超此值。',
  ['PASS = indexed · FAIL = not indexed · PART/NEU = discovered but not yet indexed']:
    'PASS = 已索引 · FAIL = 未索引 · PART/NEU = 已发现但尚未索引',
  ['Pattern: ^https://m\\.(.+) · Replacement: https://www.$1 · Flags: i  (collapse mobile subdomain to www)']:
    '模式：^https://m\\.(.+) · 替换：https://www.$1 · 标志：i（将移动子域折叠为 www）',
  ["Per-request abort threshold. Pages that take longer than this are recorded as network errors. Screaming Frog: 'Response Timeout (secs)' (Configuration → Spider → Advanced) — that one's in seconds, this is in milliseconds."]:
    "每请求的中止阈值。耗时超过此值的页面记录为网络错误。Screaming Frog：'Response Timeout (secs)'（Configuration → Spider → Advanced）——那边以秒计，这里以毫秒计。",
  ['Persist rel="nofollow" links in the link graph. When off, nofollow links are dropped entirely (not counted in outlinks, not probed as externals). Screaming Frog inverse: turning this ON ≈ unchecking "Follow Internal/External Nofollow".']:
    '在链接图中保留 rel="nofollow" 链接。关闭时 nofollow 链接会被完全丢弃（不计入出链，不作为外链探测）。Screaming Frog 的反向设置：开启此项 ≈ 取消勾选 "Follow Internal/External Nofollow"。',
  ['Picking a preset fills the User-Agent field below — you can still hand-edit it afterwards. Switch between Googlebot Smartphone / Desktop to compare how a site responds to mobile vs desktop crawlers.']:
    '选择预设会填充下方的 User-Agent 字段——之后仍可手动编辑。在 Googlebot Smartphone / Desktop 之间切换，比较站点对移动端与桌面端抓取器的响应差异。',
  ["Picks one of the saved profiles by name. Empty = use the Proxy URL field above (or env vars when that's also empty)."]:
    '按名称选择已保存的配置之一。留空 = 使用上方的代理 URL 字段（该字段也为空时使用环境变量）。',
  ['Pre-computes Dead External Domain, Duplicate URL post-norm, Canonical Chain Multi-hop. Without this the sidebar shows 0 for those three.']:
    '预先计算“失效外部域名”、“规范化后重复 URL”、“多跳规范链接链”。不开启时侧边栏中这三项显示为 0。',
  ['After the crawl, re-fetches a sample of indexable pages with the opposite user agent (mobile when the crawl ran as desktop, desktop otherwise) and compares title, H1, meta description, canonical, robots, word count and link count. Differences feed the \'Mobile / Desktop Mismatch\' issue and the report of the same name.']:
    '抓取完成后，用相反的用户代理（桌面抓取则用移动端，反之亦然）重新获取一部分可索引页面，比较标题、H1、meta 描述、canonical、robots、字数和链接数。差异会进入"移动端 / 桌面端不一致"问题和同名报告。',
  ['How many pages the mobile-parity probe re-fetches, most-linked first. 0 = every indexable HTML page (doubles the crawl\'s traffic for that set).']:
    '移动端一致性探测重新获取的页面数，内链最多的优先。0 = 所有可索引 HTML 页面（该集合的抓取流量翻倍）。',
  ["Probe outbound links to other hosts (HEAD only) so the Broken Links view catches dead externals. Screaming Frog: 'External Links' (Configuration → Spider → Crawl)."]:
    "探测指向其他主机的出站链接（仅 HEAD），使“断链”视图能捕获失效的外链。Screaming Frog：'External Links'（Configuration → Spider → Crawl）。",
  ['Raw `Content-Security-Policy` response header. Empty when missing.']:
    '原始 `Content-Security-Policy` 响应头。缺失时为空。',
  ['Raw `content` attribute of `<meta http-equiv="refresh">`, e.g. "5; url=/foo".']:
    '`<meta http-equiv="refresh">` 的原始 `content` 属性，例如 "5; url=/foo"。',
  ['Raw `Strict-Transport-Security` header. Empty when missing — for HTTPS pages this is a security regression.']:
    '原始 `Strict-Transport-Security` 响应头。缺失时为空——对 HTTPS 页面而言这是安全性退化。',
  ['Raw `X-Content-Type-Options` header. `nosniff` blocks MIME sniffing — prevents some XSS via content-type confusion.']:
    '原始 `X-Content-Type-Options` 响应头。`nosniff` 阻止 MIME 嗅探——可防止某些由内容类型混淆引起的 XSS。',
  ['Raw `X-Frame-Options` header. SAMEORIGIN / DENY / ALLOW-FROM. Clickjacking defence.']:
    '原始 `X-Frame-Options` 响应头。SAMEORIGIN / DENY / ALLOW-FROM。点击劫持防御。',
  ['Raw value of the Content-Type response header (incl. charset).']:
    'Content-Type 响应头的原始值（含 charset）。',
  ['Re-renders each page on a mobile viewport and checks viewport meta tag, horizontal overflow, font size legibility, and tap-target spacing. Stores a pass/fail verdict on the urls table.']:
    '在移动视口中重新渲染每个页面，并检查 viewport meta 标签、水平溢出、字号可读性和点击目标间距。在 urls 表中存储通过/失败判定。',
  ['Read the full article →']: '阅读全文 →',
  ["Reject-all = ignore Set-Cookie entirely (zero counts on cookie-flag issues). Block-third-party = analyse only first-party cookies (Domain attribute matches the page's registrable domain). Accept-all = analyse every Set-Cookie regardless of scope."]:
    '全部拒绝 = 完全忽略 Set-Cookie（cookie 标志问题计数为零）。阻止第三方 = 仅分析第一方 cookie（Domain 属性与页面的可注册域匹配）。全部接受 = 不论范围分析每个 Set-Cookie。',
  ["Reject-all for stateless audits; Block-third-party to focus on the site's own cookie hygiene; Accept-all to also see ad/analytics tracker cookies."]:
    '无状态审计用“全部拒绝”；专注站点自身 cookie 卫生用“阻止第三方”；还想查看广告/分析跟踪器 cookie 用“全部接受”。',
  ["Removes the leading 'www.' from the host at normalisation time. The seen-set, redirect graph, and link extraction all use the rewritten form, so duplicates collapse correctly."]:
    "在规范化时移除主机开头的 'www.'。已见集合、重定向图和链接提取都使用重写后的形式，因此重复项能正确合并。",
  ['Renders the page a second time on a mobile viewport and stores an above-the-fold PNG. Adds another full render + screenshot per URL.']:
    '在移动视口中再次渲染页面并存储首屏 PNG。每个 URL 额外增加一次完整渲染 + 截图。',
  ['Resolved absolute URL of the <img src> attribute.']: '<img src> 属性解析后的绝对 URL。',
  ['Response body size in bytes (compressed transfer size, post-Content-Encoding).']:
    '响应体大小（字节，Content-Encoding 之后的压缩传输大小）。',
  ['Rewrites http:// to https:// before fetching. Breaks HTTP-only sites.']:
    '抓取前将 http:// 重写为 https://。会破坏仅支持 HTTP 的站点。',
  ['Run Chromium without a visible window. Turn off to debug rendering visually — useful when a page renders correctly in a normal browser but not under Playwright.']:
    '无可见窗口运行 Chromium。关闭以可视化调试渲染——当页面在普通浏览器中渲染正常但在 Playwright 下异常时很有用。',
  ['Run the login steps once before the crawl, then replay the session cookies on every request.']:
    '抓取前执行一次登录步骤，然后在每个请求中重放会话 cookie。',
  ["Runs iterative PageRank (damping 0.85) over the internal link graph and normalises it to a 0–100 Link Score per page. Drives the Link Score column and the 'By Link Score' visualization colour mode."]:
    '在内部链接图上运行迭代 PageRank（阻尼系数 0.85），并归一化为每页 0–100 的链接得分。为“链接得分”列和可视化的“按链接得分”着色模式提供数据。',
  ['Sends the URL through the same normalisation pipeline used by the crawler, with your unsaved settings applied. Useful for verifying regex rules before kicking off a crawl.']:
    '让 URL 经过与抓取器相同的规范化流程，并应用你未保存的设置。适合在开始抓取前验证正则规则。',
  ['Sent on every request as the User-Agent header. Identifies the crawler to servers; some sites serve different content based on UA.']:
    '作为 User-Agent 响应头随每个请求发送。向服务器标识抓取器；某些站点会根据 UA 提供不同内容。',
  ['Sent on every request. Affects which locale a multi-lingual site serves you.']:
    '随每个请求发送。影响多语言站点向你提供哪种区域设置。',
  ["Sent verbatim as `Bearer <token>`. Don't include the `Bearer ` prefix yourself."]:
    '原样以 `Bearer <token>` 发送。不要自行加上 `Bearer ` 前缀。',
  ['Server response time (a TTFB proxy) measured during the crawl. Pages slower than this are flagged. Google considers a good server response time under 800 ms.']:
    '抓取期间测得的服务器响应时间（TTFB 的代理指标）。慢于此值的页面会被标记。Google 认为 800 毫秒以内的服务器响应时间为良好。',
  ['Shop the latest game keys at unbeatable prices…']: '以无与伦比的价格选购最新游戏密钥…',
  ["Skips body parsing for pages whose Content-Length header exceeds this. The page row is still created so links to it aren't lost; only body parsing and source snapshot capture are skipped."]:
    '对 Content-Length 响应头超过此值的页面跳过正文解析。仍会创建页面行以免丢失指向它的链接；仅跳过正文解析和源码快照。',
  ['Sleep this long on each worker AFTER a response completes, before it picks up the next URL. Stacks with the global RPS cap — useful for sites that rate-limit on inter-request gap rather than total throughput.']:
    '每个 worker 在响应完成之后、拾取下一个 URL 之前休眠此时长。与全局 RPS 上限叠加——适用于按请求间隔而非总吞吐量限速的站点。',
  ['Specific reason a URL is non-indexable. For Indexable URLs this column is empty.']:
    'URL 不可索引的具体原因。可索引 URL 此列为空。',
  ['Spider follows links from the start URL across the chosen scope. List fetches a fixed set of URLs once with no link-following. Sitemap fetches a sitemap URL and crawls every page it lists (no link-following).']:
    'Spider 在所选范围内从起始 URL 跟踪链接。列表模式抓取一组固定 URL 一次，不跟踪链接。Sitemap 模式获取一个 sitemap URL 并抓取其列出的每个页面（不跟踪链接）。',
  ["Spider for full site audits; List for re-checking a known set of pages; Sitemap to audit exactly what's published in sitemap.xml."]:
    '全站审计用 Spider；重新检查已知页面集用列表；精确审计 sitemap.xml 中发布的内容用 Sitemap。',
  ['Standard CSS selector — same syntax as `document.querySelectorAll`.']:
    '标准 CSS 选择器——语法与 `document.querySelectorAll` 相同。',
  ['Stored in your local prefs file as plain text. Treat the file accordingly.']:
    '以明文存储在你的本地偏好设置文件中。请相应地保护该文件。',
  ['Strip if your site canonicalises /foo (no slash); Add for sites that canonicalise /foo/.']:
    '站点规范化为 /foo（无斜杠）用“去除”；规范化为 /foo/ 的站点用“添加”。',
  ['Sunset over the mountain ridge']: '山脊上的日落',
  ['Surplus `@id` occurrences across all JSON-LD blocks (page declares the same `@id` more than once).']:
    '所有 JSON-LD 块中多余的 `@id` 出现次数（页面多次声明同一个 `@id`）。',
  ['Terminal URL the redirect chain resolves to. Empty when this row is itself the terminal (i.e. status is 2xx/4xx/5xx) or when the chain hits a loop.']:
    '重定向链最终解析到的 URL。当本行自身即为终点（即状态为 2xx/4xx/5xx）或链遇到循环时为空。',
  ['Canonical hops walked after this page (or, on a redirect row, after the redirect\'s final URL) until a page that canonicalises to itself. 0 when the canonical is the page itself or absent.']:
    '从此页面（在重定向行中为重定向的最终 URL）起，直到自指向 canonical 页面为止所经过的 canonical 跳数。canonical 为页面自身或不存在时为 0。',
  ['Where the canonical chain ends. Empty when the page is its own canonical, or when the chain loops.']:
    'Canonical 链的终点。页面为自身 canonical 或链形成循环时为空。',
  ['text for visible content, attribute for href/src, count for occurrence count']:
    '可见内容用 text，href/src 用 attribute，出现次数用 count',
  ['Text of the first <h1> on the page. Should match user intent and ideally complement (not duplicate) the title.']:
    '页面上第一个 <h1> 的文本。应契合用户意图，最好与标题互补（而非重复）。',
  ["Text Only fetches the raw HTML response as-is — fast and deterministic. Old AJAX Crawling Scheme rewrites hashbang (#!) URLs to Google's deprecated ?_escaped_fragment_= form so a pre-rendering server returns the snapshot. Full JavaScript rendering is a V2 item."]:
    '纯文本模式原样获取原始 HTML 响应——快速且确定。旧版 AJAX 抓取方案将 hashbang（#!）URL 重写为 Google 已弃用的 ?_escaped_fragment_= 形式，以便预渲染服务器返回快照。完整 JavaScript 渲染是 V2 项目。',
  ['Text Only for server-rendered / static sites; Old AJAX only for legacy hashbang SPAs.']:
    '服务端渲染 / 静态站点用纯文本；旧版 AJAX 仅用于遗留的 hashbang SPA。',
  ["The column / JSON-key name for this rule's output. Free-form."]:
    '此规则输出的列 / JSON 键名。自由填写。',
  ['The fully normalised URL of the crawled resource (post URL-rewriting).']:
    '所抓取资源的完全规范化 URL（URL 重写之后）。',
  ['The URL that fails to resolve (4xx/5xx/network error).']:
    '无法解析的 URL（4xx/5xx/网络错误）。',
  ['Third-party `<script>` / `<link rel=stylesheet>` references without an `integrity=` attribute. SRI is recommended for any cross-origin subresource.']:
    '没有 `integrity=` 属性的第三方 `<script>` / `<link rel=stylesheet>` 引用。任何跨源子资源都推荐使用 SRI。',
  ['Time-to-first-byte in milliseconds (network + server, excluding parse). Lower is better; >2000 ms is slow.']:
    '首字节时间（毫秒，网络 + 服务器，不含解析）。越低越好；>2000 毫秒为慢。',
  ['Total number of <h1> elements on the page. SEO best practice is exactly 1.']:
    '页面上 <h1> 元素的总数。SEO 最佳实践是恰好 1 个。',
  ['Total number of <h2> elements on the page.']: '页面上 <h2> 元素的总数。',
  ['tr,en;q=0.8 — Turkish first, English fallback.']: 'tr,en;q=0.8 — 土耳其语优先，英语作为回退。',
  ["Trips 'Folder Depth Too Deep' when the URL path's `/`-segment count exceeds this. Useful for spotting over-nested URL structures that bury content from crawlers."]:
    '当 URL 路径的 `/` 分段数超过此值时触发“文件夹层级过深”。用于发现将内容深埋、不利于抓取器的过度嵌套 URL 结构。',
  ["Trips 'Long Query String' when LENGTH(query) > this. Typical session-id sprawl + UTM tracking hits 100+ chars; over 200 starts to look like a bug."]:
    '当 LENGTH(query) > 此值时触发“查询字符串过长”。典型的会话 ID 泛滥 + UTM 跟踪可达 100+ 个字符；超过 200 就开始像 bug 了。',
  ["Trips the 'URL Too Long' issue when LENGTH(url) > this. RFC 7230 doesn't mandate a max but most servers + middleboxes fail above ~2 KB; Chrome itself caps at ~32 KB."]:
    '当 LENGTH(url) > 此值时触发“URL 过长”问题。RFC 7230 未规定最大值，但大多数服务器和中间设备在约 2 KB 以上就会失败；Chrome 自身上限约 32 KB。',
  ["Two modes per line. (1) Wrap in slashes for a regex: /pattern/flags — supported flags imsuy (g is forced). Invalid patterns appear with count -1 in the detail panel so you can spot the typo. (2) Anything else is a literal case-insensitive substring — the legacy behaviour. Each term's per-page hit count is surfaced in the URL Details panel."]:
    '每行两种模式。(1) 用斜杠包裹表示正则：/模式/标志——支持标志 imsuy（g 强制启用）。无效模式在详情面板中显示计数 -1，便于发现拼写错误。(2) 其他任何内容都是不区分大小写的字面子串——即旧有行为。每个词的每页命中数显示在“URL 详情”面板中。',
  ["Two pages are flagged as near-duplicates if their 64-bit SimHash differs by at most this many bits. 3 ≈ 95% similarity over body-text shingles (Screaming Frog's tightest filter). Set to 0 to skip clustering entirely."]:
    '两个页面的 64 位 SimHash 相差不超过此位数时标记为近似重复。3 ≈ 正文 shingle 95% 相似度（Screaming Frog 最严格的筛选）。设为 0 则完全跳过聚类。',
  ['URL declared by the first <link rel="canonical"> tag. Tells search engines which version to index when duplicates exist.']:
    '第一个 <link rel="canonical"> 标签声明的 URL。存在重复时告诉搜索引擎应索引哪个版本。',
  ['URL paths ending in any of these extensions are not enqueued. Case-insensitive. Start URL is always crawled regardless.']:
    '以这些扩展名结尾的 URL 路径不会入队。不区分大小写。起始 URL 始终会被抓取。',
  ['Value of the alt attribute. Empty cell = no alt declared (accessibility/SEO issue).']:
    'alt 属性的值。空单元格 = 未声明 alt（无障碍/SEO 问题）。',
  ['Value of the X-Robots-Tag HTTP response header. Same semantics as meta robots but applied at the server.']:
    'X-Robots-Tag HTTP 响应头的值。语义与 meta robots 相同，但在服务器端应用。',
  ['Viewport height — affects above-the-fold detection and lazy-load triggers.']:
    '视口高度——影响首屏检测和懒加载触发。',
  ['Viewport width applied to every rendered page. Mobile audits typically use 360–414, desktop 1280–1920.']:
    '应用于每个渲染页面的视口宽度。移动端审计通常用 360–414，桌面端 1280–1920。',
  ['Visible body text word count (excludes <script>/<style>). Useful for identifying thin content.']:
    '可见正文文本的字数（不含 <script>/<style>）。用于识别内容单薄的页面。',
  ['Wait this long before the FIRST retry, doubling on each subsequent attempt (500 → 1000 → 2000 …).']:
    '首次重试前等待此时长，之后每次重试翻倍（500 → 1000 → 2000 …）。',
  ["Walks 3xx redirect chains, fills `redirect_chain_length` / `redirect_loop`. Drives the 'Long Chain' and 'Redirect Loop' issues + the Redirects tab."]:
    '遍历 3xx 重定向链，填充 `redirect_chain_length` / `redirect_loop`。为“长链”和“重定向循环”问题 + “重定向”标签页提供数据。',
  ['Welcome to Example Store']: '欢迎来到示例商店',
  ['What to do when multiple matches exist.']: '存在多个匹配时的处理方式。',
  ['What to read off each matched element. Ignored for an XPath `/@attr` or `/text()` terminal — that value is used directly.']:
    '从每个匹配元素读取什么。对以 `/@attr` 或 `/text()` 结尾的 XPath 忽略——直接使用该值。',
  ['When non-empty, ALL query parameters not on this list are dropped during normalisation (case-insensitive name match). Leave empty to keep the default behaviour, which strips just utm_*, fbclid, gclid, mc_cid, and mc_eid.']:
    '非空时，规范化期间会丢弃所有不在此列表中的查询参数（名称匹配不区分大小写）。留空则保持默认行为，即只去除 utm_*、fbclid、gclid、mc_cid 和 mc_eid。',
  ['When off, no budget evaluation runs and the verdict column is cleared. When on, the post-crawl pass scores every internal 200 HTML page against the ceilings below.']:
    '关闭时不进行预算评估，判定列会被清空。开启时抓取后处理会按下方上限为每个内部 200 HTML 页面评分。',
  ['When on (default), pagination_next + pagination_prev URLs are post-fetch enqueued. Off only to debug pagination-only loops without disabling all link follow.']:
    '开启（默认）时，pagination_next + pagination_prev URL 在抓取后入队。仅在需要调试纯分页循环而不禁用所有链接跟踪时关闭。',
  ['When ON (default), the Duplicate URL filter compares URLs after lowercasing the host, dropping the query string, and trimming the trailing slash — the canonical SEO behaviour. When OFF, comparison is byte-exact, so the filter only fires on rows that share an identical raw URL string (rare since URLs are deduped at insert time).']:
    '开启（默认）时，“重复 URL”筛选器在主机转小写、去掉查询字符串、去除尾部斜杠后比较 URL——这是规范的 SEO 行为。关闭时按字节精确比较，因此筛选器只对原始 URL 字符串完全相同的行生效（因为 URL 在插入时已去重，所以很少见）。',
  ["When on, `<meta http-equiv='refresh'>` content URLs are enqueued like a redirect target. window.location body redirects are heuristic-only and currently out of scope."]:
    "开启时，`<meta http-equiv='refresh'>` content 中的 URL 会像重定向目标一样入队。正文中的 window.location 重定向仅为启发式判断，目前不在范围内。",
  ['When on, a 200 page declaring a canonical pointing elsewhere also enqueues that target. Default off — most crawls treat canonicals as a signal, not a navigation hint.']:
    '开启时，声明了指向他处 canonical 的 200 页面也会将该目标入队。默认关闭——大多数抓取将 canonical 视为信号而非导航提示。',
  ['When on, pages with noindex / canonicalised / robots-blocked indexability are excluded from clustering — the Near-Duplicate report then surfaces only issues that affect search visibility.']:
    '开启时，可索引性为 noindex / 已规范化 / 被 robots 阻止的页面会被排除在聚类之外——“近似重复”报告随之只显示影响搜索可见性的问题。',
  ["When on, rel=nofollow links are recursed into like any other link. Default off — Screaming Frog 'Respect Nofollow' default."]:
    "开启时，rel=nofollow 链接会像其他链接一样递归抓取。默认关闭——Screaming Frog 的 'Respect Nofollow' 默认行为。",
  ['When Playwright considers navigation complete. domcontentloaded = HTML parsed but resources still loading. load = window.load fired. networkidle = no network activity for 500ms (best for SPA but slower). commit = just response committed (fastest, riskiest).']:
    'Playwright 何时认为导航完成。domcontentloaded = HTML 已解析但资源仍在加载。load = window.load 已触发。networkidle = 500 毫秒内无网络活动（最适合 SPA 但更慢）。commit = 仅响应已提交（最快，风险最高）。',
  ['Whether the broken target is on the same site (internal) or a different host (external).']:
    '断链目标是在同一站点（内部）还是不同主机（外部）。',
  ['Whether the URL is eligible to appear in search results. Combines status code, robots directives, canonical, and meta-refresh signals.']:
    'URL 是否有资格出现在搜索结果中。综合状态码、robots 指令、canonical 和 meta-refresh 信号。',
  ['Width attribute value (in pixels) declared on the <img> tag, when present.']:
    '<img> 标签上声明的 width 属性值（像素），如有。',
  ['XPath 1.0 subset over the parsed DOM. End in `/@attr` or `/text()` to read an attribute / text node. Predicates: `[n]`, `[@class="x"]`, `[contains(@class,"x")]`, `[last()]`.']:
    '针对解析后 DOM 的 XPath 1.0 子集。以 `/@attr` 或 `/text()` 结尾可读取属性 / 文本节点。谓词：`[n]`、`[@class="x"]`、`[contains(@class,"x")]`、`[last()]`。',
  ['Y when the page declares hreflang alternates but no entry whose `href` matches the page URL. Google requires a self-reference.']:
    '页面声明了 hreflang 替代版本但没有任何条目的 `href` 与页面 URL 匹配时为 Y。Google 要求自引用。',
  ['Y when the redirect chain originating at this URL contains a cycle (A → B → A) detected by the cycle-safe walker; the chain is otherwise unwalked.']:
    '从此 URL 出发的重定向链包含由防循环遍历器检测到的循环（A → B → A）时为 Y；否则不遍历该链。',
  ['Y when this URL belongs to a paginated cluster whose ordinal sequence has a gap (e.g. ?page=1, 2, 4 — page 3 missing). Set by the post-crawl `recomputePaginationSequence` pass.']:
    '此 URL 属于序号序列存在缺口的分页组时为 Y（例如 ?page=1、2、4——缺少第 3 页）。由抓取后的 `recomputePaginationSequence` 处理设置。',
  ['SQL injection — the request tries to smuggle SQL into a parameter (UNION SELECT, sleep(), error-based functions) to read or alter your database.']:
    'SQL 注入——请求试图将 SQL 塞入参数（UNION SELECT、sleep()、基于错误的函数）以读取或篡改你的数据库。',
  ['Cross-site scripting — the request carries script markup or a javascript: URL in a parameter, hoping the page echoes it back into the HTML unescaped.']:
    '跨站脚本——请求在参数中携带脚本标记或 javascript: URL，指望页面将其未转义地回显到 HTML 中。',
  ['Path traversal — the request walks out of the web root with ../ or encoded variants to reach files like /etc/passwd or win.ini.']:
    '路径遍历——请求通过 ../ 或编码变体跳出 web 根目录，以访问 /etc/passwd 或 win.ini 之类的文件。',
  ['Command injection — the request appends shell syntax (;, |, backticks, $( )) to a parameter to run commands on the server.']:
    '命令注入——请求在参数后附加 shell 语法（;、|、反引号、$( )）以在服务器上执行命令。',
  ['Scanner probe — an automated vulnerability scanner walking a wordlist of known admin panels, installers and exploit paths (wp-login, phpmyadmin, /actuator, shell uploads). Not tailored to your site; it hits everyone.']:
    '扫描器探测——自动漏洞扫描器遍历已知管理面板、安装程序和漏洞利用路径的词表（wp-login、phpmyadmin、/actuator、shell 上传）。并非针对你的站点；它对所有人下手。',
  ['Sensitive file fetch — a direct request for something that must never be public: .env, .git, backups, SQL dumps, private keys, config files.']:
    '敏感文件获取——直接请求绝不应公开的内容：.env、.git、备份、SQL 转储、私钥、配置文件。',
  ['Anomaly — malformed or evasive input (null bytes, CRLF injection, over-encoding, absurd parameter lengths) that matches no single attack class but is not a normal browser request.']:
    '异常——畸形或规避性输入（空字节、CRLF 注入、过度编码、荒谬的参数长度），不匹配任何单一攻击类别，但也不是正常的浏览器请求。',
  ['Sum of the weights of every attack signature the request matched. Each signature carries a weight by how conclusive it is (a UNION SELECT weighs 9, a stray quote 2), and a line is only flagged once the total reaches 5 — so one decisive pattern flags on its own, while weak hints have to add up. Higher score = less room for a false positive; sort by it to triage.']:
    '请求匹配到的所有攻击特征权重之和。每个特征按其确定性携带权重（UNION SELECT 为 9，孤立的引号为 2），总分达到 5 才会标记——因此一个决定性模式可单独触发，而微弱的线索必须累加。分数越高 = 误报空间越小；按此排序以分诊。',
  ['Which attack class the strongest matching signature belongs to: SQL injection, XSS, path traversal, command injection, scanner probe, sensitive file, or anomaly. Hover any badge in this column for what that class means in practice.']:
    '最强匹配特征所属的攻击类别：SQL 注入、XSS、路径遍历、命令注入、扫描器探测、敏感文件或异常。将鼠标悬停在此列的任一标记上可查看该类别的实际含义。',
  ["Filters on the Status column — the most recent response the log recorded for that path. The analyzer keeps one status per URL rather than a full distribution, so this answers 'what is this URL returning now'. Paths whose status could not be parsed are hidden while a class is selected."]:
    '按“状态”列筛选——日志为该路径记录的最新响应。分析器为每个 URL 保留一个状态而非完整分布，因此这回答的是“此 URL 现在返回什么”。选择了某个类别时，状态无法解析的路径会被隐藏。',
  ['Most recent HTTP status the log recorded for this path. One value per URL, not a distribution — a path that returned 200 all week and 404 this morning shows 404.']:
    '日志为此路径记录的最新 HTTP 状态。每个 URL 一个值，而非分布——整周返回 200、今早返回 404 的路径显示 404。',
  ['A URL whose path repeats the same segment this many times or more (/shop/shop/shop/…) is treated as a link loop and skipped. This shape comes from a relative-href bug and has no legitimate counterpart. Skipped counts are reported when the crawl finishes.']:
    '路径中同一分段重复达到此次数及以上的 URL（/shop/shop/shop/…）被视为链接循环并跳过。这种形态来自相对 href 的 bug，没有合法的对应情况。跳过的数量在抓取结束时报告。',
  ['3 is safe for every site; raise to 4–5 only if a real path legitimately repeats a segment; 0 disables the guard.']:
    '3 对所有站点都安全；仅当真实路径确实合法重复某分段时提高到 4–5；0 禁用此保护。',
  ['URLs with more query parameters than this are flagged as faceted-navigation traps under Issues → URL → Crawl Trap. Detection only — the URLs are still crawled, because legitimate filter pages look the same.']:
    '查询参数数量超过此值的 URL 在“问题 → URL → 抓取陷阱”下标记为分面导航陷阱。仅检测——URL 仍会被抓取，因为合法的筛选页面看起来一样。',
  ['4 surfaces most faceted-nav explosions; 0 disables the check.']:
    '4 能发现大多数分面导航爆炸；0 禁用检查。',
  ["Honor Allow / Disallow rules declared in /robots.txt for the configured User-Agent. Screaming Frog: 'Respect robots.txt' (Configuration → robots.txt)."]:
    "遵守 /robots.txt 中为所配置 User-Agent 声明的 Allow / Disallow 规则。Screaming Frog：'Respect robots.txt'（Configuration → robots.txt）。",
  ["Honor a Crawl-delay directive as a global rate limit (one request every N seconds). Crawl-delay is not part of RFC 9309 — Google ignores it and Screaming Frog does not implement it — and published values are often stale: 'Crawl-delay: 30' turns a 500-URL crawl into hours. Ignored by default; the directive is still reported in the log when found."]:
    "将 Crawl-delay 指令作为全局速率限制（每 N 秒一个请求）遵守。Crawl-delay 不属于 RFC 9309——Google 忽略它，Screaming Frog 也未实现——且发布的值往往过时：'Crawl-delay: 30' 会让 500 个 URL 的抓取耗时数小时。默认忽略；发现该指令时仍会在日志中报告。",
  ['Off (default) for normal audits. On when an ops policy requires it — expect the crawl to take Crawl-delay seconds per URL.']:
    '常规审计关闭（默认）。运维策略要求时开启——预期每个 URL 耗时 Crawl-delay 秒。',
  ['Crawl fetches internal <img> targets (incl. srcset / <picture> sources) so each appears in the Internal tab with status, content type, and size — every one counts toward Max URLs. Store keeps the <img> declarations in the Images tab, which works even with Crawl off: you get the full image inventory with alt text for the cost of zero extra requests.']:
    '“抓取”获取内部 <img> 目标（含 srcset / <picture> 源），使每个都带状态、内容类型和大小出现在“内部”标签页中——每个都计入最大 URL 数。“存储”将 <img> 声明保留在“图片”标签页中，即使“抓取”关闭也有效：零额外请求即可获得带 alt 文本的完整图片清单。',
  ['Store on, Crawl off is the cheap alt-text audit. Both on for a full image health check.']:
    '“存储”开、“抓取”关是低成本的 alt 文本审计。两者都开则进行完整的图片健康检查。',
  ['<video> / <audio> and the <source> children they own. Off by default — media files are large and rarely what an SEO crawl is looking for.']:
    '<video> / <audio> 及其拥有的 <source> 子元素。默认关闭——媒体文件体积大，且很少是 SEO 抓取想要的。',
  ['On when auditing a video-heavy site for dead media URLs.']:
    '审计视频密集型站点的失效媒体 URL 时开启。',
  ["<link rel=stylesheet> targets. Crawling a stylesheet is also what discovers the web fonts and background images declared inside it via @font-face / url() — so Crawl on with Store off still populates the Internal tab's Font filter without listing every stylesheet."]:
    '<link rel=stylesheet> 目标。抓取样式表同时也能发现其中通过 @font-face / url() 声明的网页字体和背景图片——因此“抓取”开、“存储”关仍能填充“内部”标签页的字体筛选器，而无需列出每个样式表。',
  ['Crawl on, Store off when you want fonts discovered but not hundreds of CSS rows.']:
    '想发现字体但不想要数百行 CSS 时用“抓取”开、“存储”关。',
  ['<script src> targets, fetched so each gets its own row with status code, content type, and size. Headers only — the body is discarded, never executed.']:
    '<script src> 目标，抓取后每个都有自己的行，带状态码、内容类型和大小。仅响应头——响应体被丢弃，绝不执行。',
  ['Both on to catch 404ing bundles; both off for HTML-only crawls.']:
    '两者都开以捕获 404 的打包文件；两者都关用于仅 HTML 抓取。',
  ['<a href> targets on the same site. Crawl off turns the run into an audit of a fixed set of pages — sitemaps, canonicals, and the other declared alternates below still feed discovery. Store off empties the link graph: inlinks, outlinks, anchor-text reports, and link score all go with it.']:
    '同一站点上的 <a href> 目标。“抓取”关会将运行变成对固定页面集的审计——sitemap、canonical 及下方其他声明的替代版本仍会推动发现。“存储”关会清空链接图：入链、出链、锚文本报告和链接得分随之消失。',
  ['Leave both on. Crawl off only when a sitemap or URL list already defines the exact set you want.']:
    '两者都保持开启。仅当 sitemap 或 URL 列表已定义你想要的精确集合时关闭“抓取”。',
  ['Outbound links to other hosts are always status-checked (one HEAD each) so Broken Links catches dead externals — that does not depend on this row. Crawl here means fully crawling those pages, following their links onward too. Store keeps outbound links in the link graph.']:
    '指向其他主机的出站链接始终会进行状态检查（每个一次 HEAD），使“断链”能捕获失效外链——这不依赖于此行。此处的“抓取”意味着完整抓取那些页面，并继续跟踪其链接。“存储”将出站链接保留在链接图中。',
  ['Crawl off (default) — status-check externals without spidering the whole web.']:
    '“抓取”关（默认）——检查外链状态但不去抓取整个互联网。',
  ['<link rel=canonical> and its HTTP Link: header form. Crawl also enqueues the canonical target, treating it as a navigation hint. Store feeds the Canonicals tab and every canonical issue filter.']:
    '<link rel=canonical> 及其 HTTP Link: 响应头形式。“抓取”还会将 canonical 目标入队，视其为导航提示。“存储”为“规范链接”标签页和所有 canonical 问题筛选器提供数据。',
  ['Crawl off (default) — canonicals are a signal, not a route. Store on.']:
    '“抓取”关（默认）——canonical 是信号而非路径。“存储”开。',
  ['<link rel=next> / <link rel=prev>. Part of the standard discovery graph; turn Crawl off to isolate a pagination loop without disabling link-following everywhere.']:
    '<link rel=next> / <link rel=prev>。标准发现图的一部分；关闭“抓取”可隔离分页循环，而无需在各处禁用链接跟踪。',
  ['Both on unless you are debugging an infinite paginated series.']:
    '除非在调试无限分页序列，否则两者都开。',
  ['<link rel=alternate hreflang>. Crawl enqueues every declared alternate, which is how you reach language versions nothing links to. Store feeds the Hreflang tab and the reciprocity / invalid-code audits.']:
    '<link rel=alternate hreflang>。“抓取”将每个声明的替代版本入队——这就是触达无人链接的语言版本的方式。“存储”为“Hreflang”标签页以及互链 / 无效代码审计提供数据。',
  ['Crawl on for a multi-language audit — otherwise unlinked locales stay invisible.']:
    '多语言审计时开启“抓取”——否则未被链接的区域版本将不可见。',
  ['<link rel=amphtml>. Crawl fetches the AMP variant as its own URL; Store keeps the declaration plus the AMP smoke-validator findings.']:
    '<link rel=amphtml>。“抓取”将 AMP 变体作为独立 URL 获取；“存储”保留声明以及 AMP 基础验证器的发现。',
  ['Crawl on only if the site still ships AMP pages.']: '仅当站点仍在发布 AMP 页面时开启“抓取”。',
  ['<meta http-equiv="refresh">. Crawl enqueues the parsed target like a redirect; Store keeps the raw directive and its URL for the Meta Refresh tab.']:
    '<meta http-equiv="refresh">。“抓取”将解析出的目标像重定向一样入队；“存储”保留原始指令及其 URL 供“Meta Refresh”标签页使用。',
  ['Crawl on when auditing a legacy site that still redirects this way.']:
    '审计仍以此方式重定向的遗留站点时开启“抓取”。',
  ["<iframe src> documents. Crawl fetches each embedded page as its own URL, which can pull in a lot of third-party surface. Store records them in the link graph so a dead embed shows up in Outlinks and Broken Links — without counting toward the page's outlink total, since an embed is not a hyperlink."]:
    '<iframe src> 文档。“抓取”将每个嵌入页面作为独立 URL 获取，可能引入大量第三方内容。“存储”将其记录在链接图中，使失效的嵌入出现在“出链”和“断链”中——但不计入页面的出链总数，因为嵌入不是超链接。',
  ['Store on, Crawl off is usually the right pair.']: '“存储”开、“抓取”关通常是正确的组合。',
  ['The separate-URL (m-dot) mobile version: <link rel="alternate" media="only screen and (max-width: …)">. Null on responsive sites, which is most of them — a value here with no reciprocal canonical back is the classic broken m-dot setup.']:
    '独立 URL 的移动版本（m-dot）：<link rel="alternate" media="only screen and (max-width: …)">。在响应式站点上为 null（大多数站点如此）——此处有值却没有反向的 canonical 互指，是典型的失效 m-dot 配置。',
  ['Crawl on only when the site really does serve a separate mobile host.']:
    '仅当站点确实提供独立移动主机时开启“抓取”。',
  ['Links a search engine cannot follow: <a> with no href but an onclick, href="javascript:…", and href="#" placeholders wired to a handler. Store-only — an uncrawlable link is by definition never fetched. Drives the JS-Only Navigation issue filter.']:
    '搜索引擎无法跟踪的链接：无 href 但有 onclick 的 <a>、href="javascript:…"，以及绑定了处理程序的 href="#" 占位符。仅“存储”——不可抓取的链接按定义永远不会被获取。为“仅 JS 导航”问题筛选器提供数据。',
  ['On — it is a count, so it costs nothing.']: '开启——这只是一个计数，没有任何成本。',
  ['With a Subfolder-scoped crawl, links pointing outside the start folder are fetched once so their status code is known, then stopped — they are checked, not crawled through. Off leaves them undiscovered entirely.']:
    '在子文件夹范围的抓取中，指向起始文件夹之外的链接会抓取一次以获知状态码，然后停止——只检查，不深入抓取。关闭则完全不发现它们。',
  ['On — knowing a link out of /blog/ is a 404 costs one request.']:
    '开启——知道 /blog/ 之外的某个链接是 404 只需一个请求。',
  ["Off restricts the crawl to URLs under the start URL's path (Crawl Scope = Subfolder). On lets it cover the whole host. This is a view of the Crawl Scope setting, not a separate switch, so the two can never disagree."]:
    '关闭时将抓取限制在起始 URL 路径下的 URL（抓取范围 = 子文件夹）。开启则覆盖整个主机。这是抓取范围设置的一个视图，而非独立开关，因此两者永远不会冲突。',
  ['Off to audit just /blog/; on for the whole site.']: '只审计 /blog/ 时关闭；整站时开启。',
  ['Treats every host sharing the registrable domain as internal — shop.example.com and blog.example.com crawl alongside example.com instead of counting as external. Another view of the Crawl Scope setting.']:
    '将共享同一可注册域的每个主机视为内部——shop.example.com 和 blog.example.com 与 example.com 一同抓取，而不算作外部。抓取范围设置的另一个视图。',
  ['On when subdomains are part of the same property.']: '子域属于同一资产时开启。',
  ['Crawl through rel="nofollow" links pointing at the same site. Off (default) is Screaming Frog "Respect Nofollow" behaviour. Internal and external are separate switches because sites nofollow them for opposite reasons — crawl-budget shaping vs. not vouching for a third party.']:
    '穿过指向同一站点的 rel="nofollow" 链接抓取。关闭（默认）是 Screaming Frog 的 "Respect Nofollow" 行为。内部和外部是独立开关，因为站点出于相反的原因使用 nofollow——控制抓取预算 vs. 不为第三方背书。',
  ['On when a site nofollows its own faceted navigation and you need behind it.']:
    '当站点对自己的分面导航加了 nofollow 而你需要进入其后时开启。',
  ['Crawl through rel="nofollow" links pointing at other hosts. Only has an effect while External Links → Crawl is on.']:
    '穿过指向其他主机的 rel="nofollow" 链接抓取。仅在“外部链接 → 抓取”开启时生效。',
  ['Off — nofollowed externals are exactly the ones you did not vouch for.']:
    '关闭——带 nofollow 的外链正是你未背书的那些。',
  ['Record hrefs that cannot be parsed as a URL — unencoded whitespace inside the authority, doubled schemes, stray delimiters. They can never resolve to a crawled page, so every one is reported in Broken Links, which is the point. Deliberate non-navigable schemes (mailto:, tel:, #) are not malformed and never appear.']:
    '记录无法解析为 URL 的 href——authority 中未编码的空白、重复的 scheme、多余的分隔符。它们永远无法解析到已抓取页面，因此每一个都会在“断链”中报告，这正是目的。有意的非导航 scheme（mailto:、tel:、#）不算畸形，绝不会出现。',
  ['On when hunting hand-written markup errors; off keeps Broken Links focused on real 404s.']:
    '追查手写标记错误时开启；关闭可让“断链”专注于真正的 404。',
  ['Off drops every discovered URL carrying a `?`, before robots and before a request goes out. That is the cheap way to stop a faceted navigation (?color=red&size=xl&sort=price) from spending the whole URL budget on one product listing wearing a thousand URLs. The start URL is always crawled, and subresources are exempt — style.css?v=7 is a cache-buster, not a facet. Skipped URLs are counted and reported in the log, never dropped silently.']:
    '关闭会在 robots 之前、发出请求之前丢弃所有带 `?` 的已发现 URL。这是阻止分面导航（?color=red&size=xl&sort=price）把整个 URL 预算耗费在一个披着上千 URL 外衣的产品列表上的低成本方法。起始 URL 始终会被抓取，子资源不受影响——style.css?v=7 是缓存破坏器，不是分面。跳过的 URL 会计数并记录到日志，绝不静默丢弃。',
  ['On (default). Off for a first pass over a shop with faceted filters.']:
    '开启（默认）。对带分面筛选的商店做首轮抓取时关闭。',
  ['Parameter names that keep a URL in the crawl anyway — pagination, a language switch, a product id. Names only; values are not looked at, and matching ignores case. A URL is admitted only when every parameter it carries is on this list: ?page=2 passes, ?page=2&color=red does not. Any-match would defeat the point, since a facet URL nearly always carries the pagination parameter too.']:
    '即便如此仍让 URL 留在抓取中的参数名——分页、语言切换、产品 ID。仅限名称；不查看值，匹配不区分大小写。只有当 URL 携带的每个参数都在此列表中时才被接受：?page=2 通过，?page=2&color=red 不通过。任一匹配会违背初衷，因为分面 URL 几乎总是也带着分页参数。',
  ['page, lang — keeps paginated archives reachable while the facets stay out.']:
    'page, lang——让分页归档保持可达，同时把分面挡在外面。',
  ['Auto-discovery on its own only records sitemap entries, which is what the sitemap issue filters compare the crawl against. Turning this on crawls them too — and that is what surfaces orphans: pages the sitemap declares but nothing on the site links to.']:
    '自动发现本身只记录 sitemap 条目，这是 sitemap 问题筛选器用来与抓取对比的依据。开启此项还会抓取它们——这正是发现孤立页面的方式：sitemap 声明了但站点上没有任何内容链接到的页面。',
  ['On for an orphan-page audit.']: '孤立页面审计时开启。',
  ['Reads Sitemap: directives from /robots.txt plus the conventional /sitemap.xml fallbacks at crawl start. Cheap I/O, and it powers every sitemap issue filter.']:
    '抓取开始时读取 /robots.txt 中的 Sitemap: 指令以及常规的 /sitemap.xml 回退。I/O 开销低，并为所有 sitemap 问题筛选器提供数据。',
  ['On (default).']: '开启（默认）。',
  ['Explicit sitemap URLs, one per line. Their entries are always both recorded and queued as crawl seeds — use this when the sitemap lives somewhere robots.txt never mentions.']:
    '显式的 sitemap URL，每行一个。其条目始终既被记录又作为抓取种子入队——当 sitemap 位于 robots.txt 从未提及的位置时使用。',
  ['Treat the concurrency and RPS above as a ceiling and let the target server set the real pace. On a 429/503 (or a Retry-After header) the crawler pauses for the penalty window and steps the rate + concurrency down; after a sustained run of clean responses it grows them back toward the ceiling. Off = hold the configured rate no matter how the server responds.']:
    '将上方的并发数和 RPS 视为上限，让目标服务器决定实际节奏。遇到 429/503（或 Retry-After 响应头）时，抓取器在惩罚窗口内暂停并降低速率 + 并发；持续获得干净响应后再逐步恢复到上限。关闭 = 无论服务器如何响应都保持配置的速率。',
  ['Turn on for sites behind Cloudflare / a WAF that returns 429s; leave off for your own infrastructure where the fixed rate is safe.']:
    '对位于 Cloudflare / 返回 429 的 WAF 之后的站点开启；对固定速率安全的自有基础设施保持关闭。',
  ['Sorts query parameters alphabetically at normalisation time. Repeated keys keep their relative order, so ?tag=a&tag=b is preserved. Without this the two orderings occupy separate rows and read as duplicates.']:
    '规范化时按字母顺序排序查询参数。重复的键保持相对顺序，因此 ?tag=a&tag=b 会被保留。不开启时两种顺序会占据不同的行并被视为重复。',
  ['On for most sites; off if your server routes on positional parameter order.']:
    '大多数站点开启；如果你的服务器按参数位置顺序路由则关闭。',
  ['Collapses runs of slashes in the path to a single slash. Applied before the trailing-slash policy. Web servers serve these identically, so the duplicate-slash variant is normally a false duplicate.']:
    '将路径中连续的斜杠折叠为单个斜杠。在尾部斜杠策略之前应用。Web 服务器对它们的处理完全相同，因此双斜杠变体通常是假重复。',
  ['On if a template bug emits //  in links; off if your framework uses empty path segments as data.']:
    '模板 bug 在链接中输出 //  时开启；框架把空路径段当作数据时关闭。',
  ["Off by default: verify the login page's TLS certificate before typing credentials into it. Enable only for a trusted internal host with a self-signed certificate — an unverifiable certificate on a login page is a man-in-the-middle risk."]:
    '默认关闭：在向登录页面输入凭据之前验证其 TLS 证书。仅对使用自签名证书的可信内部主机启用——登录页面上无法验证的证书意味着中间人攻击风险。',
  ["Hooks the History API before the page's own scripts run, so routes an SPA reaches via pushState / replaceState / popstate are discovered and crawled. Also keeps hash routes (#/about) as distinct URLs instead of collapsing them onto the shell document."]:
    '在页面自身脚本运行之前挂钩 History API，使 SPA 通过 pushState / replaceState / popstate 到达的路由能被发现并抓取。同时将 hash 路由（#/about）保留为独立 URL，而不是折叠到外壳文档上。',
  ['On for React Router / Vue Router / Angular sites whose pages never produce a document request.']:
    '对页面从不产生文档请求的 React Router / Vue Router / Angular 站点开启。',
  ['`<link rel="alternate" media="only screen and (max-width: …)" href="…">` value — the separate-URL (m-dot) mobile version of this page. Empty on responsive sites, which is most of them. A value here with no reciprocal canonical pointing back is the classic broken m-dot setup.']:
    '`<link rel="alternate" media="only screen and (max-width: …)" href="…">` 的值——本页独立 URL 的移动版本（m-dot）。在响应式站点上为空（大多数站点如此）。此处有值却没有反向指回的 canonical，是典型的失效 m-dot 配置。',
};
