/**
 * Simplified Chinese integration setup guides. Generated from the guide source —
 * see `./index.ts` for how a locale is picked. Keep the step count,
 * links and `lastReviewed` in lockstep with `en.ts`; the parity test
 * in `tests/` compares them.
 */
import type { Guide } from './types.js';

export const GUIDES_ZH_CN: Record<string, Guide> = {
  openai: {
    intro:
      '通过 OpenAI 的 API 对每个 URL 运行自定义提示词——内容分析、标题创意、摘要。用量计入你自己的 OpenAI 账户；FreeCrawl 是免费的中间件，API 调用费用由你承担。',
    prereqs: [
      'OpenAI 账户（在 https://platform.openai.com 免费注册）。',
      '有效的付款方式——OpenAI 要求账户至少有 5 美元余额，密钥才能使用。',
    ],
    steps: [
      {
        title: '登录 platform.openai.com',
        detail: '使用你的 OpenAI 账户。还没有账户请点击 "Sign up"。',
        link: {
          label: 'platform.openai.com',
          url: 'https://platform.openai.com',
        },
      },
      {
        title: '点击左侧边栏的 "API keys"',
        detail: '左侧带钥匙图标的菜单项。也可以直接打开该 URL。',
        link: {
          label: 'API keys 页面',
          url: 'https://platform.openai.com/api-keys',
        },
      },
      {
        title: '点击右上角的 "+ Create new secret key"',
        detail:
          '在对话框中：\n• Name："FreeCrawl SEO Tool"（任意备注名称）\n• Project：Default project 或你自选\n• Permissions：All（最简单；受限范围也可以）\n然后点击 "Create secret key"。',
      },
      {
        title: '复制密钥——它不会再次显示',
        detail:
          '密钥以 `sk-...` 开头。现在不复制就永久丢失（只能重新创建）。请保存到密码管理器——不要留在浏览器标签页里。',
      },
      {
        title: '粘贴到本面板的 "API Key" 字段 + 点击保存',
        detail:
          'FreeCrawl 将密钥加密存储在系统凭据库中（Windows DPAPI、macOS 钥匙串、Linux Secret Service）。绝不以明文写入。',
      },
      {
        title: '在 AI 标签页测试',
        detail:
          '关闭设置 → 切换到顶部 "AI" 标签页 → 从抓取结果中选几个 URL → 点击 "Run AI"。首次调用约需 2-3 秒。',
      },
    ],
    troubleshooting: [
      {
        problem: '"You exceeded your current quota"',
        solution:
          '你的 OpenAI 账户没有余额。前往 platform.openai.com → Billing → "Add payment method" → 添加银行卡并充值 5 美元以上。新账户不会自动获得额度，需要手动充值。',
      },
      {
        problem: '"Incorrect API key provided" / 401',
        solution: '密钥开头或结尾可能混入了多余空格。重新生成一个并仔细复制。撤销旧密钥。',
      },
      {
        problem: '"Rate limit exceeded"',
        solution:
          '并行请求过多。在设置 → AI 中降低并发数（默认：3）。Tier 1 账户根据模型不同为 500-3500 RPM。',
      },
    ],
    notes: [
      '价格（2026-06）：gpt-4o-mini 约 0.15 美元/百万输入 token，gpt-4o 约 2.50 美元/百万输入。1000 个 URL 的典型提示词 + 响应：约 0.50-2 美元。',
      '在 Usage limits 页面设置每月硬性上限——你不会想让一次失控的百万 URL 抓取产生 1000 美元账单。',
    ],
    lastReviewed: '2026-06-01',
  },
  anthropic: {
    intro:
      '通过 Anthropic 的 API 在 Claude 上运行提示词。Claude 的顶级模型（Sonnet 4.6、Opus 4.8）生成的 SEO 内容比竞品少一些“AI 味”。费用计入你自己的 Anthropic 账户。',
    prereqs: [
      'Anthropic 账户（https://console.anthropic.com）。',
      '已绑定付款方式（新用户可获得 5 美元推广额度）。',
    ],
    steps: [
      {
        title: '登录 console.anthropic.com',
        link: {
          label: 'console.anthropic.com',
          url: 'https://console.anthropic.com',
        },
      },
      {
        title: '从右上角下拉菜单打开 "API Keys" 页面',
        detail: '在 Settings 菜单下的 "API Keys" 条目。',
        link: {
          label: 'API Keys 页面',
          url: 'https://console.anthropic.com/settings/keys',
        },
      },
      {
        title: '点击 "+ Create Key"',
        detail:
          '在对话框中：\n• Name："FreeCrawl SEO Tool"\n• Workspace：Default workspace\n• Environment：Production\n然后点击 "Create Key"。',
      },
      {
        title: '复制密钥——它不会再次显示',
        detail: '密钥以 `sk-ant-...` 开头。丢了就重新创建一个。',
      },
      {
        title: '粘贴到 "API Key" 字段 + 保存',
      },
      {
        title: '可选：选择模型',
        detail:
          '在设置 → AI 中，"Model" 字段接受模型 ID（默认：claude-sonnet-4-6）。速度优先：claude-haiku-4-5（便宜约 10 倍，快 3 倍）。质量优先：claude-opus-4-8。',
      },
    ],
    troubleshooting: [
      {
        problem: '"Your credit balance is too low"',
        solution: 'console.anthropic.com → Settings → Billing → "Add credits"——最低 5 美元。',
      },
      {
        problem: '"Number of request tokens has exceeded your rate limit"',
        solution:
          'Tier 1 账户约 50 RPM。在设置 → AI 中把并发数降到 2-3。要进入更高层级需累计消费 25 美元以上（Tier 2：1000 RPM）。',
      },
      {
        problem: '"Invalid API key"',
        solution:
          '确认 "sk-ant-" 前缀完整且没有多余空格。查看 API Keys 页面——如果密钥在那里显示为活跃，密钥本身没问题。',
      },
    ],
    notes: [
      '价格（2026-06）：Haiku 4.5 约 0.25/1.25 美元（每百万 token 输入/输出），Sonnet 4.6 约 3/15 美元，Opus 4.8 约 15/75 美元。',
      'Anthropic 支持提示词缓存——5 分钟内重复的长系统提示词享受 90% 折扣（FreeCrawl 的 AI 面板暂未使用缓存——将在后续版本推出）。',
    ],
    lastReviewed: '2026-06-01',
  },
  ollama: {
    intro:
      'Ollama 是本地托管 LLM 的开源运行时。无需 API 密钥，永久免费，甚至不需要联网。成本为零；唯一的缺点是大模型需要 VRAM/RAM。',
    prereqs: [
      'macOS 12+、Windows 10+ 或 Linux（推荐 Ubuntu 22.04+）。',
      '至少 8 GB 内存（小模型）。Llama 3.2 3B 需要约 2 GB VRAM/RAM。',
      '推荐 GPU 但非必需——CPU 也能运行（更慢）。',
    ],
    steps: [
      {
        title: '下载并安装 Ollama',
        detail:
          '选择你的系统安装包：\n• Windows：OllamaSetup.exe\n• macOS：Ollama.dmg\n• Linux：curl -fsSL https://ollama.com/install.sh | sh\n\n安装后 Ollama 在后台运行（系统托盘图标）。',
        link: {
          label: 'ollama.com/download',
          url: 'https://ollama.com/download',
        },
      },
      {
        title: '拉取一个模型',
        detail:
          '打开终端并运行：\n\n  ollama pull llama3.2\n\nllama3.2（3B 参数）约 2GB，速度快、资源占用低。更大的选项：\n  ollama pull llama3.3:70b   （约 40GB，仅限高端 GPU）\n  ollama pull qwen2.5:7b     （约 4GB，均衡）\n  ollama pull mistral:7b     （约 4GB，备选）',
      },
      {
        title: '快速测试模型',
        detail:
          '在终端中：\n  ollama run llama3.2\n\n会打开交互式聊天。输入 "hello"——收到回复即正常。Ctrl+D 退出。',
      },
      {
        title: '在本面板中输入 Ollama 端点',
        detail: '默认：http://localhost:11434（已预填）。若 Ollama 运行在其他端口请修改。',
      },
      {
        title: '输入你拉取的模型名称',
        detail: '例如 "llama3.2" 或 "qwen2.5:7b"。留空则由 FreeCrawl 选择第一个可用模型。',
      },
      {
        title: '保存并测试',
        detail: '在 AI 标签页运行一小批。仅 CPU：约 5-15 秒/URL。GPU：约 1-3 秒。',
      },
    ],
    troubleshooting: [
      {
        problem: 'AI tab says "Connection refused"',
        solution:
          'Ollama 未运行。在终端运行 "ollama serve"，或从系统托盘 / 开始菜单启动 Ollama 应用。',
      },
      {
        problem: '"model \'X\' not found"',
        solution:
          '模型未拉取。运行 "ollama pull <模型名>"。用 "ollama list" 查看磁盘上已有的模型。',
      },
      {
        problem: 'Replies are very slow (>30 s/URL)',
        solution:
          '模型放不进 VRAM，退回到 CPU 运行。尝试更小的模型（llama3.2:1b 或 phi3:mini）。VRAM 需求：3B 约 2GB，7B 约 4GB，13B 约 8GB。',
      },
    ],
    notes: [
      '完全离线——即使没有网络，抓取 + AI 分析也能继续运行。',
      '本地 SEO 分析质量：3B 模型略弱，7-13B 尚可，70B 达到 GPT-4 水平（但硬件要求高）。',
      '在设置 → AI 中把并发数保持在 1-2——本地模型会把并行请求串行化。',
    ],
    lastReviewed: '2026-06-01',
  },
  pagespeed: {
    intro:
      'Google PageSpeed Insights 用 Lighthouse 审计每个 URL，返回性能/SEO/无障碍/最佳实践评分 + Core Web Vitals（LCP/CLS/INP）。免费 API 密钥每天可审计 25,000 次。',
    prereqs: ['Google 账户。', 'Google Cloud Console 项目（可在下面的步骤中创建）。'],
    steps: [
      {
        title: '打开 Google Cloud Console',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: '选择或创建项目',
        detail:
          '左上角项目下拉框 → "New Project" → 名称："FreeCrawl SEO" → Create。无需结算账户——PSI 免费层只需要凭据用于身份验证。',
      },
      {
        title: '启用 PageSpeed Insights API',
        detail: '此深层链接直达该 API 的启用页面：',
        link: {
          label: 'PageSpeed Insights API → Enable',
          url: 'https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com',
        },
      },
      {
        title: '点击蓝色的 "Enable" 按钮 → 等待 30 秒',
      },
      {
        title: '前往 Credentials',
        link: {
          label: 'Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: '点击 "+ Create Credentials" → "API key"',
        detail: '将生成一个 API 密钥（以 `AIzaSy...` 开头）。立即复制。',
      },
      {
        title: '可选：限制 API 密钥（推荐）',
        detail:
          '点击 "Edit API key" → "Restrict key"：\n• API restrictions："Restrict key" → "PageSpeed Insights API"\n• Application restrictions："None"（FreeCrawl 是桌面应用，referrer/IP 过滤不起作用）\n不限制的密钥也能用，但我们建议限制。',
      },
      {
        title: '把密钥粘贴到本面板的 "API Key" 字段 + 保存',
      },
      {
        title: '在 PageSpeed 标签页测试',
        detail: '顶部 "PageSpeed" 标签页 → 选几个 URL → "Run audit"。首次审计约 10-15 秒。',
      },
    ],
    troubleshooting: [
      {
        problem: '"This API method requires billing to be enabled"',
        solution:
          '你启用了错误的 API（例如旧的 "Cloud PageSpeed Insights API"）。正确的是 "PageSpeed Insights API"（pagespeedonline.googleapis.com）。重新打开第 3 步的链接。',
      },
      {
        problem: '"API key not valid"',
        solution:
          '密钥限制设置有误。Cloud Console → Credentials → 点击该密钥 → 确认 "PageSpeed Insights API" 在允许的 API 列表中。或者临时移除限制以验证。',
      },
      {
        problem: '"Quota exceeded" — before hitting 25,000',
        solution:
          '还有每分钟限制：240 次查询/分钟。在设置 → PageSpeed 中把并发数保持在 2-3。每日 25K 上限非常高——正常使用不会碰到。',
      },
    ],
    notes: [
      '费用：免费——少数不需要结算的 Google API 之一。无密钥/匿名模式现在是 0 次查询/天（2026 年初关闭），因此密钥是必需的。',
      '速度：每个 URL 约 5-10 秒（Google 实际在运行一个 Lighthouse 实例）。1000 个 URL 约 2 小时。',
      '移动端 + 桌面端算作独立的 API 调用——选择“两者”会使配额消耗翻倍。',
    ],
    lastReviewed: '2026-06-01',
  },
  ahrefs: {
    intro:
      '通过 Ahrefs 的 API 获取每个 URL 的反向链接数、domain rating、引用域和自然关键词数量。这是 Ahrefs 最昂贵的集成——API 访问仅限每月 500 美元以上的套餐。',
    prereqs: [
      'Ahrefs Standard（249 美元/月）或更高订阅。',
      '附加的 "API" 层级（在基础套餐之上额外 500 美元/月，或其他层级）。',
    ],
    steps: [
      {
        title: '登录 Ahrefs → API 页面',
        link: {
          label: 'ahrefs.com/api',
          url: 'https://ahrefs.com/api',
        },
      },
      {
        title: '选择订阅（如果你还没有 API 访问权限）',
        detail: 'API v3 访问随 Enterprise 层级和专用 API 套餐提供。联系销售获取报价。',
      },
      {
        title: '在你的账户中生成 API 令牌',
        detail:
          'Ahrefs 控制台 → Account settings → API → Generate token。令牌格式：`sk-...` 或类似。',
      },
      {
        title: '粘贴到 "API Key" 字段 + 保存',
      },
      {
        title: '在 SEO Authority 标签页测试',
        detail: '顶部 "SEO Authority" 标签页 → 提供商："Ahrefs" → 选几个 URL → "Run"。',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient credits"',
        solution:
          'API 行数单位已用完。Ahrefs 控制台 → API → "Usage" 标签页。升级套餐或等待下一个计费周期。',
      },
      {
        problem: '"Unauthorized"',
        solution:
          '你的订阅不包含 API 访问权限。仅有 "Ahrefs Standard" 不提供 API 权限——需要额外的明确 API 层级。',
      },
    ],
    notes: [
      '费用：每次 URL 审计约消耗 1-5 个 API 行。Standard API 套餐约 25K 行/月。',
      '更便宜的替代方案：Moz（99 美元/月，Domain Authority）或 Majestic。',
    ],
    lastReviewed: '2026-06-01',
  },
  majestic: {
    intro:
      '通过 Majestic 的 API 获取 Trust Flow、Citation Flow 和反向链接数。以反向链接为核心、性价比最高的提供商。',
    prereqs: ['Majestic Lite（49.99 美元/月）或更高订阅。', 'API 访问权限——Lite 已包含。'],
    steps: [
      {
        title: '打开 Majestic 开发者控制台',
        link: {
          label: 'majestic.com/account/api',
          url: 'https://majestic.com/account/api',
        },
      },
      {
        title: '生成 API 密钥',
        detail: '控制台 → "Open API" 标签页 → "Generate new key" → 复制。',
      },
      {
        title: '粘贴到本面板 + 保存',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient resources" / "No analysis units"',
        solution:
          '每月分析单位配额已用完。Lite 套餐：1000 单位/月；Pro：20K+。查看 Majestic 控制台 → API → 用量。',
      },
    ],
    notes: ['费用：1 次 URL 反向链接查询 = 5 单位。Lite 套餐（1000 单位）约 200 个 URL/月。'],
    lastReviewed: '2026-06-01',
  },
  moz: {
    intro:
      '通过 Moz API 获取 Domain Authority（DA）、Page Authority（PA）和 Spam Score。预算较低时最受欢迎的选择。',
    prereqs: ['Moz Pro Standard（99 美元/月）或更高订阅，并已启用 "Moz API" 附加组件。'],
    steps: [
      {
        title: '打开 Moz API 页面',
        link: {
          label: 'moz.com/api',
          url: 'https://moz.com/api',
        },
      },
      {
        title: 'Account → API → "Generate Credentials"',
        detail: '会生成两个值："Access ID" 和 "Secret Key"。两个都复制。',
      },
      {
        title: '分别粘贴到本面板的 "Access ID" + "Secret Key" 字段 + 保存',
        detail: '两个独立字段——按顺序填写。',
      },
    ],
    troubleshooting: [
      {
        problem: '"Authentication failed"',
        solution:
          'Access ID 或 Secret Key 复制粘贴有误。从 Moz 控制台重新复制——Access ID 较短（约 13 个字符），Secret Key 较长（约 40 个字符）。',
      },
    ],
    notes: ['费用：Standard 套餐（1500 行/月）、Medium（10K 行/月）、Large（100K 行/月）。'],
    lastReviewed: '2026-06-01',
  },
  semrush: {
    intro: '通过 Semrush API 获取自然关键词、流量估算和 SERP 特性。最全面的关键词 + 流量数据。',
    prereqs: [
      'Semrush Pro（129 美元/月）或更高订阅。',
      '账户附带 "API units"（Guru 层级及以上包含 API 访问权限）。',
    ],
    steps: [
      {
        title: '登录 Semrush → Subscription info → API',
        link: {
          label: 'Semrush API 访问',
          url: 'https://www.semrush.com/accounts/subscription-info/api-units/',
        },
      },
      {
        title: '复制 API 密钥',
      },
      {
        title: '粘贴到本面板 + 保存',
      },
    ],
    troubleshooting: [
      {
        problem: '"API units exhausted"',
        solution:
          '每月单位配额已用完。Guru 套餐：7K 单位/月，Business：25K+。查看 Semrush 控制台 → API → 用量。',
      },
    ],
    notes: ['费用：1 次 URL 反向链接查询 = 10 单位；1 次域名概览 = 1 单位。'],
    lastReviewed: '2026-06-01',
  },
  gsc: {
    intro:
      '通过 Google Search Console API 获取每个 URL 的 Search Console 指标（点击、展示、CTR、平均排名）。URL Inspection API 还提供覆盖率判定 + 上次抓取时间。“自带客户端”模式——你创建自己的 Google Cloud OAuth 客户端并粘贴进来；FreeCrawl 不使用共享的中间应用。',
    prereqs: [
      'Google 账户（必须拥有 / 共同拥有你要连接的 GSC 资源）。',
      '至少已添加并验证一个 Google Search Console 资源。',
    ],
    steps: [
      {
        title: '打开 Google Cloud Console 并新建项目',
        detail:
          '左上角项目下拉框 → "New Project" → 名称："FreeCrawl SEO Integrations"（随意）→ Create。此项目仅用于 OAuth 凭据——无需结算。',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: '打开 Google Auth Platform → Branding',
        detail:
          '左侧菜单 "APIs & Services" → "OAuth consent screen"（新界面："Google Auth Platform → Branding"）。User Type："External" → Create。',
        link: {
          label: 'OAuth consent screen',
          url: 'https://console.cloud.google.com/auth/branding',
        },
      },
      {
        title: '填写 OAuth 同意屏幕',
        detail:
          '只填必填项：\n• App name："FreeCrawl Local"\n• User support email：你的邮箱\n• Developer contact information：你的邮箱\n其余留空。Save and Continue → Save and Continue → Save and Continue → Back to Dashboard。',
      },
      {
        title: '关键：把自己添加为 Test User',
        detail:
          '左侧菜单 → "Audience"（旧界面 "Test users"）→ "Add users" → 粘贴你将要连接的 Gmail → Save。\n\n警告：请勿跳过此步骤。跳过会在 OAuth 时产生 403 access_denied——处于 "Testing" 状态的应用只允许测试用户列表中的账户连接。',
        link: {
          label: 'Audience 页面',
          url: 'https://console.cloud.google.com/auth/audience',
        },
      },
      {
        title: '启用 Google Search Console API',
        detail: '此链接直达启用页面 → 点击蓝色 "Enable" → 等待 30 秒。',
        link: {
          label: 'Search Console API → Enable',
          url: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com',
        },
      },
      {
        title: '创建 OAuth Client ID',
        detail:
          '左侧菜单 → "Credentials"（新界面 "Google Auth Platform → Clients"）→ "+ Create credentials" → "OAuth client ID"。',
        link: {
          label: 'Credentials 页面',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'OAuth Client 类型选择 "Desktop app"（不是 Web app！）',
        detail:
          'Application type 下拉框 → "Desktop app"。Name："FreeCrawl SEO Tool"。Create → 对话框显示 Client ID + Client Secret。立即复制两者（Secret 不会再次显示）。\n\n为什么选 DESKTOP：FreeCrawl 每次连接使用随机本地端口（例如 127.0.0.1:63092）。"Web application" 需要固定的重定向 URI 列表——随机端口无法匹配 → 失败。"Desktop app" 自动接受回环重定向，与端口无关。',
      },
      {
        title: '把 Client ID + Client Secret 粘贴到本面板 + 保存',
        detail:
          '两个字段："OAuth Client ID"（...apps.googleusercontent.com）和 "OAuth Client Secret"（GOCSPX-...）。保存。',
      },
      {
        title: '点击“连接”——浏览器会打开',
        detail: '保存后卡片会显示“连接”按钮。点击 → Google 的同意屏幕在默认浏览器中打开。',
      },
      {
        title: '用你添加为测试用户的 Google 账户登录',
        detail:
          '在账户选择器中选择你添加到测试用户的邮箱。"Continue" → "Google hasn\'t verified this app" 警告（测试模式下正常）。"Advanced" → "Go to FreeCrawl Local (unsafe)" → 接受权限 → Allow。',
      },
      {
        title: '回到 FreeCrawl——你应该看到“已配置”',
        detail:
          '设置中的 Search Console 卡片现在显示绿色的“已配置”徽章。现在可以切换到顶部 "Search Console" 标签页列出资源 + 获取数据。',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 access_denied"',
        solution:
          '你没有添加测试用户，或者用错误的 Google 账户登录。回到 Audience 页面，确认你使用的账户在测试用户列表中。如果你有多个 Google 账户，检查账户选择器用的是哪一个。',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          '要么 Search Console API 未启用，要么 OAuth 同意屏幕上的 "View Search Console data for your verified sites" 权限复选框未勾选。(1) 启用 Search Console API（第 5 步），(2) myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → 再次点击“连接”并在同意屏幕上勾选全部权限。',
      },
      {
        problem: '"redirect_uri_mismatch"',
        solution:
          'OAuth 客户端类型错误。在 Credentials 页面删除该客户端，重新创建为 "Desktop app"（第 7 步）。"Web application" 在此流程中永远无法工作。',
      },
      {
        problem: '"This app isn\'t verified" warning',
        solution:
          '预期行为（测试模式应用 + 敏感范围）。点击 "Advanced" → "Go to <app> (unsafe)" 继续。应用处于测试模式，只允许测试用户进入——是安全的。',
      },
      {
        problem: 'Connection broke after 7 days',
        solution:
          '测试模式下 OAuth 刷新令牌每 7 天过期。设置 → 集成 → Search Console → “断开” → “连接”重新授权。要消除过期限制，需要让应用通过 Google 的验证流程（1-4 周）。',
      },
    ],
    notes: [
      '你拥有的资源（sc-domain:example.com 或 https://example.com/）包含你的账户验证过的所有站点。',
      'GSC 数据延迟约 2 天——今天的点击不会立即显示。',
      '免费配额：1200 次查询/分钟，25,000 次查询/天——正常使用永远不会碰到。',
    ],
    lastReviewed: '2026-06-01',
  },
  ga4: {
    intro:
      '获取每个 URL 的 GA4 指标（会话、用户、跳出率、互动率、转化）。“自带客户端”——使用你自己的 GCP OAuth 客户端。',
    prereqs: [
      '对要连接的 GA4 资源至少拥有查看者权限的 Google 账户。',
      '可以复用为 GSC 设置的同一个 OAuth 客户端——只需启用正确的 API。',
    ],
    steps: [
      {
        title: '如果已设置 GSC：复用那个 OAuth 客户端',
        detail:
          '如果 Search Console 已配置，可以使用同一个 Google Cloud 项目和同一组 OAuth Client ID + Secret。无需重新创建——只需启用下面的 API 并把凭据粘贴到这里。',
      },
      {
        title: '启用两个 GA4 API',
        detail:
          'GA4 需要两个不同的 API：\n\n1. Google Analytics Admin API（用于列出资源）\n2. Google Analytics Data API（用于实际报告）\n\n两个都不启用会看到 "API not enabled" 错误。',
        link: {
          label: 'Admin API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com',
        },
      },
      {
        title: '同时启用 Data API',
        link: {
          label: 'Data API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
        },
      },
      {
        title: '粘贴你用于 GSC 的同一组 Client ID + Secret',
        detail:
          '如果 GSC 已连接，可能甚至不需要粘贴——卡片之间可能共享凭据。如果你从头设置 GA4，把 GSC 客户端的 ID/Secret 复制到本面板。',
      },
      {
        title: '“连接” → 用 Google 登录 + 批准 GA4 范围',
        detail:
          '用你添加为测试用户的 Google 账户登录。在同意屏幕上确认 "Google Analytics: View Google Analytics property data" 权限已勾选。',
      },
      {
        title: '在 GA4 标签页列出资源 + 获取数据',
        detail:
          '切换到顶部 "GA4" 标签页 → "List Properties" 显示你的账户可见的所有 GA4 资源 → 选一个 → 选择时间窗口（7/28/90 天）→ "Fetch"。GA4 接近实时，结果立即显示。',
      },
    ],
    troubleshooting: [
      {
        problem: '"Google Analytics Admin API has not been used in project X"',
        solution:
          'Admin API 未启用。打开第 2 步的链接 → Enable。等待 30 秒后重试。接下来 Data API 也会出现同样的错误——打开第 3 步的链接并同样启用。',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'OAuth 范围不包含 GA4。前往 myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → 再次点击“连接” → 勾选 Google Analytics 权限复选框。',
      },
      {
        problem: 'Property list comes back empty',
        solution:
          '你连接的 Google 账户在任何 GA4 资源上都没有角色。GA4 控制台 → Admin → Property Access Management → 确认你的邮箱至少拥有查看者权限。',
      },
    ],
    notes: [
      'GA4 数据接近实时——今天的数据会在 4-24 小时内显示。',
      '免费配额：200K 次请求/天，每个资源 50 次请求/分钟。',
    ],
    lastReviewed: '2026-06-01',
  },
  sheets: {
    intro:
      '将抓取结果直接导出到 Google 表格。当你与团队成员在共享的实时文档上协作时，比“下载 CSV → 在 Excel 中打开”更好。',
    prereqs: ['Google 账户。', '可以复用为 GSC 设置的同一个 OAuth 客户端。'],
    steps: [
      {
        title: '如果已设置 GSC/GA4：复用那个 OAuth 客户端',
        detail: '粘贴同一组 OAuth Client ID + Secret（或者可能已经保存）。',
      },
      {
        title: '启用 Google Sheets API',
        link: {
          label: 'Sheets API → Enable',
          url: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
        },
      },
      {
        title: '同时启用 Google Drive API',
        detail: 'Sheets API 还需要 Drive 范围才能创建/读取电子表格。',
        link: {
          label: 'Drive API → Enable',
          url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
        },
      },
      {
        title: '粘贴 Client ID + Secret + 保存',
      },
      {
        title: '“连接” → 在同意屏幕上批准 Sheets + Drive',
        detail:
          'OAuth 流程显示两个权限：\n• See, edit, create, and delete all your Google Sheets spreadsheets\n• See, edit, create, and delete only the specific Google Drive files used with this app\n两个都勾选。',
      },
      {
        title: '从导出菜单测试',
        detail: '文件 → 导出 → “导出到 Google 表格”。会自动创建一个新表格，URL 复制到剪贴板。',
      },
    ],
    troubleshooting: [
      {
        problem: '"insufficient authentication scopes"',
        solution: '连接时没有勾选 Drive 权限复选框。断开 + 重新连接，两个权限都勾选。',
      },
    ],
    notes: [
      'Sheets 硬性上限：每个电子表格 1000 万个单元格——大型抓取（>50 万 URL）会被拆分。',
      'Drive 范围是 "drive.file"——只能访问 FreeCrawl 创建的文件，不能访问你已有的文件。',
    ],
    lastReviewed: '2026-06-01',
  },
  bigquery: {
    intro:
      '把抓取数据直接流式写入 BigQuery 数据集。适合在数据仓库中积累带日期的快照，并用 BI 工具（Looker Studio、Tableau、Metabase）可视化抓取趋势。',
    prereqs: [
      '已启用 BigQuery API 的 Google Cloud 项目。',
      '已创建的 BigQuery 数据集。',
      '服务账号 JSON（不是 OAuth——服务器到服务器身份验证）。',
      '已启用结算的 GCP 项目（BigQuery 免费层：每月 10GB 存储 + 1TB 查询；超出后计费）。',
    ],
    steps: [
      {
        title: '创建 BigQuery 数据集',
        detail:
          'BigQuery 控制台 → 选择项目 → "Create dataset" → ID："freecrawl_seo"（或任意名称）→ Location："EU" 或 "US"（重要——之后无法更改）→ Create dataset。',
        link: {
          label: 'BigQuery 控制台',
          url: 'https://console.cloud.google.com/bigquery',
        },
      },
      {
        title: '创建服务账号',
        detail:
          'IAM & Admin → Service Accounts → "+ Create service account" → 名称："freecrawl-bigquery" → Create and continue。',
        link: {
          label: 'Service Accounts',
          url: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
        },
      },
      {
        title: '添加角色',
        detail:
          '在第 2 步 "Grant this service account access to project" → 添加两个角色：\n• BigQuery Data Editor\n• BigQuery Job User\n然后 "Continue" → "Done"。',
      },
      {
        title: '下载 JSON 密钥',
        detail:
          '在服务账号列表中点击刚创建的账号 → "Keys" 标签页 → "Add key" → "Create new key" → Type：JSON → Create。\n\nJSON 会自动下载。用文本编辑器打开并复制全部内容。\n\n警告：此 JSON 包含全部凭据——请像对待密码一样对待它。绝不要提交到源代码管理。',
      },
      {
        title: '粘贴到本面板的 "Service Account JSON" 字段',
        detail:
          '粘贴完整的 JSON（从开头的 `{` 到结尾的 `}`）。FreeCrawl 将 JSON 加密存储在系统凭据库中。',
      },
      {
        title: '填写 "GCP Project ID"',
        detail:
          '你的 GCP 项目 ID（显示在 Cloud Console 左上角下拉框中，例如 "my-gcp-project-12345"）。JSON 中也有 "project_id" 字段——可以从那里复制。',
      },
      {
        title: '输入数据集名称 + 保存',
        detail: '你在第 1 步创建的数据集名称（例如 "freecrawl_seo"）。',
      },
      {
        title: '从导出菜单测试',
        detail:
          '文件 → 导出 → “导出到 BigQuery” → 选择表名/格式 → 运行。在 BigQuery 控制台确认表已出现。',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 PermissionDenied: caller does not have permission"',
        solution:
          '服务账号缺少 IAM 角色。IAM & Admin → IAM → 找到你的服务账号邮箱 → 确认已分配 "BigQuery Data Editor" 和 "BigQuery Job User" 两个角色。',
      },
      {
        problem: '"Dataset X not found"',
        solution:
          '数据集名称错误，或位置不匹配（多区域 "EU" 与区域 "europe-west1"）。从 BigQuery 控制台复制准确的数据集名称。',
      },
      {
        problem: '"Invalid JSON"',
        solution:
          '你只粘贴了部分 JSON，或者首尾混入了多余字符。用真正的编辑器（推荐 VS Code，不要用记事本）打开服务账号 JSON 文件，Ctrl+A 全选，复制，清空 FreeCrawl 字段，粘贴。',
      },
    ],
    notes: [
      '费用：BigQuery 免费层（10GB 存储 + 每月 1TB 查询）覆盖正常使用。100 万 URL 的抓取约 500MB；查询费用取决于你的 SQL。',
      '架构演进：FreeCrawl 自动创建/更新导出表。如果 CrawlUrlRow 架构新增列，导出表会自动纳入（BigQuery DDL 的灵活性）。',
    ],
    lastReviewed: '2026-06-01',
  },
};
