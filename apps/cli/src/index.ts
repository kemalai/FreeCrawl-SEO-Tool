#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { basename, dirname, join, resolve } from 'node:path';
import {
  closeSync,
  copyFileSync,
  existsSync,
  renameSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import {
  CLI_CONFIG_META_KEY,
  configForResume,
  liveCrawl,
  readStatus,
  removeStatus,
  sendControl,
  takeControl,
  waitForState,
  writeStatus,
  type ControlAction,
  type CrawlState,
} from './crawl-control.js';
import {
  DEFAULT_CRAWL_CONFIG,
  WEBHOOK_FORMATS,
  type WebhookFormat,
  type CrawlConfig,
  type LinkPosition,
  type LogIngestInput,
  type MetricaFetchMeta,
  type PreviousCrawlComparison,
} from '@freecrawl/shared-types';
import {
  Crawler,
  compareCrawls,
  writeCrawlChangesCsvs,
  COMPARE_CATEGORY_LABELS,
  exportUrlsToCsv,
  exportUrlsToJson,
  testUrlAgainstRobots,
  fetchSitemaps,
  validateSitemap,
  analyzeLogFile,
  normalizeUrl,
  compileUrlRegexRewrites,
  listMetricaCounters,
  fetchMetricaPageMetrics,
  MetricaError,
  MetricaCancelledError,
  type LogAnalysisResult,
} from '@freecrawl/core';
import { ProjectDb, detectProjectFormat, packProject, unpackProject } from '@freecrawl/db';

function help(): void {
  console.log(`freecrawl — headless SEO crawler

Usage:
  freecrawl <url> [options]                       Spider mode (default)
  freecrawl --list <file> [options]               List mode (one URL per line)
  freecrawl validate-sitemap <sitemap-url>        Fetch + validate a sitemap.xml
  freecrawl audit-robots <url> [--user-agent UA]  Test if a URL is allowed by robots.txt
  freecrawl compare <before.seoproject> <after.seoproject>
                                                  Cross-project diff (added / removed / status / title / meta / h1 / canonical / indexability / response_time)
  freecrawl analyze-logs <access.log> [more.log …] [--project file]
                                                  Parse one or more server access logs (Apache / Nginx / IIS / custom), detect bots,
                                                  and merge the aggregates into a project for crawl × log analysis
  freecrawl pause  [--db file]                    Pause the crawl running on a project (from another terminal)
  freecrawl resume [--db file] [options]          Resume it — or, when no crawl is running, carry on from
                                                  where the last one stopped, with its saved settings
  freecrawl stop   [--db file]                    Stop the running crawl; its results are kept
  freecrawl delete [--db file] [--force]          Delete a project file and its sidecars (--force stops a
                                                  running crawl on it first)
  freecrawl project create <file> [--name n]      Create an empty project
  freecrawl project rename <file> <name>          Set a project's display name
  freecrawl project move <file> <dest>            Move a project (to a folder or a new path)
  freecrawl project delete <file> [--force]       Same as delete
  freecrawl project list [dir]                    List the projects in a folder (default: current)
  freecrawl project info <file>                   Name, start URL, URL count and crawl state
  freecrawl metrica-counters [--json]             List the Yandex Metrica counters the token can read
  freecrawl metrica-fetch --counter <id> [--days 7|28|90] [--project file] [--config file]
                                                  Pull per-page Yandex Metrica data (pageviews, visits, users,
                                                  search visits) into a project, as the desktop app does

Options:
  --depth <n>         Max crawl depth (default: ${DEFAULT_CRAWL_CONFIG.maxDepth})
  --max <n>           Max URLs (default: ${DEFAULT_CRAWL_CONFIG.maxUrls})
  --concurrency <n>   Max parallel requests (default: ${DEFAULT_CRAWL_CONFIG.maxConcurrency})
  --rps <n>           Max requests per second (default: ${DEFAULT_CRAWL_CONFIG.maxRps})
  --user-agent <str>  Custom User-Agent string
  --no-robots         Ignore robots.txt
  --respect-crawl-delay
                      Honour a robots.txt Crawl-delay directive as a global rate limit
                        (one request every N seconds). Off by default — the directive is
                        not part of RFC 9309 and published values are often crippling.
  --external          Follow external links
  --image-variants    Also fetch and measure srcset / <picture> image variants (off by default;
                        a WordPress blog can go from ~2k to ~40k image requests with this on)
  --adaptive-speed    Back off automatically on HTTP 429/503 and Retry-After, then recover
                        (off by default; the fixed --rps / --concurrency hold otherwise)
  --connection-retries <n>
                      Retries for a request that gets no response at all (timeout, reset,
                        refused); default 2
  --on-unresponsive <stop|wait>
                      When the site stops responding the crawl pauses. stop (default): save
                        and exit with code 3 — continue later with \`freecrawl resume\`. wait:
                        stay paused until \`freecrawl resume\` / \`freecrawl stop\` from another terminal
  --exclude-link-position <pos>
                      Don't follow links in navigation | header | footer | sidebar; repeatable
  --exclude-link-selector <css>
                      Don't follow links inside elements matching this CSS selector; repeatable
  --header <K: V>     Extra request header for the crawled site only (never sent to external
                        hosts); repeatable (e.g. --header "Authorization: Bearer X")
  --include <regex>   Only crawl URLs matching this regex; repeatable
  --exclude <regex>   Skip URLs matching this regex; repeatable
  --list <file>       List-mode crawl: fetch every URL in <file> (one per line), no link follow
  --config <file>     Load CrawlConfig from a JSON file (matches Settings → Export Settings format).
                        Per-flag overrides on the command line still win — useful for CI
                        ("scheduled config + per-run --max").
  --db <file>         SQLite project file (default: ./crawl.seoproject)
  --out <file>        Export results after crawl. Format auto-detected by extension:
                        *.json → full JSON dump (every captured field)
                        any other → CSV (subset of common columns)
  --json              Print a machine-readable JSON summary to stdout (instead of human progress).
                        Useful for CI/CD pipelines.
  --webhook <url>     POST a notification when the crawl finishes (Slack, Discord, Teams, any URL)
  --webhook-format <auto|json|slack|discord|teams>
                      Body of that POST (default auto: chat services are recognised from the URL,
                        everything else gets the JSON summary)
  --auto-compare      Keep the crawl this one replaces and report what changed: pages added /
                        removed, field changes and issue counts. Writes crawl-changes.csv and
                        crawl-issue-changes.csv next to --out (or the project file)

analyze-logs options:
  --project <file>    Project to merge log aggregates into (default: ./crawl.seoproject)
  --format <fmt>      auto | apache-combined | apache-common | nginx | iis-w3c | custom (default: auto)
  --regex <pattern>   Named-group regex for --format custom (groups: ip ts method path status bytes ua referer)
  --verify-bots       Reverse-DNS verify a sample of bot IPs (slower; catches spoofed user-agents)
  -h, --help          Show this help

metrica-counters / metrica-fetch options:
  The token comes from the YANDEX_METRICA_TOKEN environment variable
  (a personal OAuth token with the metrika:read scope).
  --counter <id>      Counter to pull (see metrica-counters)
  --days <n>          7 | 28 | 90 full days ending yesterday (default: 28)
  --project <file>    Existing project to store the data in (default: ./crawl.seoproject)
  --config <file>     Crawl config whose URL rewrite options map Metrica URLs onto crawled
                        URLs (default: the crawl config the desktop app saved in the project,
                        else the defaults; a CLI crawl does not save one, so pass the same
                        --config file it used)
  --json              Print the result, or the error, as JSON on stdout

Projects:
  compare, analyze-logs and metrica-fetch open projects saved by the desktop app as well as
  CLI crawl databases. While analyze-logs or metrica-fetch writes to a desktop-saved project,
  it holds <project>.lock, and a second such command on the same file is refused. The desktop
  app does not check that lock: if it has the same project open, its next Save overwrites what
  the CLI wrote (the app works on its own copy of the file).
`);
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      depth: { type: 'string' },
      max: { type: 'string' },
      concurrency: { type: 'string' },
      rps: { type: 'string' },
      'user-agent': { type: 'string' },
      'no-robots': { type: 'boolean' },
      'respect-crawl-delay': { type: 'boolean' },
      external: { type: 'boolean' },
      'image-variants': { type: 'boolean' },
      'adaptive-speed': { type: 'boolean' },
      'connection-retries': { type: 'string' },
      'on-unresponsive': { type: 'string' },
      'exclude-link-position': { type: 'string', multiple: true },
      'exclude-link-selector': { type: 'string', multiple: true },
      name: { type: 'string' },
      force: { type: 'boolean' },
      header: { type: 'string', multiple: true },
      include: { type: 'string', multiple: true },
      exclude: { type: 'string', multiple: true },
      list: { type: 'string' },
      config: { type: 'string' },
      db: { type: 'string' },
      out: { type: 'string' },
      json: { type: 'boolean' },
      'auto-compare': { type: 'boolean' },
      webhook: { type: 'string' },
      'webhook-format': { type: 'string' },
      project: { type: 'string' },
      format: { type: 'string' },
      regex: { type: 'string' },
      'verify-bots': { type: 'boolean' },
      counter: { type: 'string' },
      days: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (typeof values['webhook-format'] === 'string' && !isWebhookFormat(values['webhook-format'])) {
    console.error(`--webhook-format must be one of: ${WEBHOOK_FORMATS.join(', ')}`);
    process.exit(2);
  }

  // Subcommands: `validate-sitemap <url>` and `audit-robots <url>` short-
  // circuit the crawl path — they're standalone diagnostics that don't
  // touch the project DB.
  if (positionals[0] === 'validate-sitemap') {
    if (!positionals[1]) {
      console.error('Usage: freecrawl validate-sitemap <sitemap-url>');
      process.exit(2);
    }
    const exitCode = await runValidateSitemap(
      positionals[1],
      values['user-agent'] ?? DEFAULT_CRAWL_CONFIG.userAgent,
    );
    process.exit(exitCode);
  }
  if (positionals[0] === 'audit-robots') {
    if (!positionals[1]) {
      console.error('Usage: freecrawl audit-robots <url> [--user-agent UA]');
      process.exit(2);
    }
    const exitCode = await runAuditRobots(
      positionals[1],
      values['user-agent'] ?? DEFAULT_CRAWL_CONFIG.userAgent,
    );
    process.exit(exitCode);
  }
  if (positionals[0] === 'compare') {
    if (!positionals[1] || !positionals[2]) {
      console.error(
        'Usage: freecrawl compare <before.seoproject> <after.seoproject>',
      );
      process.exit(2);
    }
    exitOnInterrupt();
    const exitCode = await runCompare(
      resolve(positionals[1]),
      resolve(positionals[2]),
    );
    process.exit(exitCode);
  }
  if (positionals[0] === 'analyze-logs') {
    if (!positionals[1]) {
      console.error('Usage: freecrawl analyze-logs <access.log> [more.log …] [--project file] [--format f] [--regex p] [--verify-bots]');
      process.exit(2);
    }
    exitOnInterrupt();
    const exitCode = await runAnalyzeLogs(
      positionals.slice(1).map((p) => resolve(p)),
      {
        projectPath: resolve(values.project ?? values.db ?? 'crawl.seoproject'),
        format: (values.format as LogIngestInput['file']['format'] | 'auto' | undefined) ?? 'auto',
        regex: values.regex,
        verifyBots: Boolean(values['verify-bots']),
        json: Boolean(values.json),
      },
    );
    process.exit(exitCode);
  }
  if (positionals[0] === 'pause' || positionals[0] === 'stop') {
    const dbPath = resolve(values.db ?? positionals[1] ?? 'crawl.seoproject');
    process.exit(await runControl(dbPath, positionals[0], Boolean(values.json)));
  }
  if (positionals[0] === 'resume') {
    const dbPath = resolve(values.db ?? positionals[1] ?? 'crawl.seoproject');
    const live = liveCrawl(dbPath);
    if (live) process.exit(await runControl(dbPath, 'resume', Boolean(values.json)));
    // Nothing running: carry on from where the last crawl stopped. A crawl
    // started again on the same project skips every URL it already has
    // and fetches the link targets it never reached.
    if (!existsSync(dbPath)) {
      console.error(`Project not found: ${dbPath}`);
      process.exit(2);
    }
    const db = new ProjectDb(dbPath);
    const saved = db.getMeta(CLI_CONFIG_META_KEY);
    if (!saved) {
      db.close();
      console.error(
        `No CLI crawl settings are stored in ${dbPath} — start the crawl again with its start URL (freecrawl <url> --db ${values.db ?? positionals[1] ?? 'crawl.seoproject'}).`,
      );
      process.exit(2);
    }
    let fileConfig: Record<string, unknown> = {};
    if (values.config) fileConfig = readConfigFile(values.config);
    const config: CrawlConfig = {
      ...DEFAULT_CRAWL_CONFIG,
      ...(JSON.parse(saved) as Partial<CrawlConfig>),
      ...fileConfig,
      ...flagOverrides(values),
    };
    if (!values.json) console.log(`Resuming ${config.startUrl} on ${dbPath}…`);
    process.exit(await runCrawl(config, db, dbPath, values));
  }
  if (positionals[0] === 'delete') {
    const dbPath = resolve(values.db ?? positionals[1] ?? 'crawl.seoproject');
    process.exit(await runDelete(dbPath, Boolean(values.force)));
  }
  if (positionals[0] === 'project') {
    process.exit(await runProjectCommand(positionals.slice(1), values));
  }
  if (positionals[0] === 'metrica-counters') {
    process.exit(await runMetricaCounters(Boolean(values.json)));
  }
  if (positionals[0] === 'metrica-fetch') {
    const exitCode = await runMetricaFetch({
      counter: values.counter,
      days: values.days,
      projectPath: resolve(values.project ?? values.db ?? 'crawl.seoproject'),
      configPath: values.config,
      json: Boolean(values.json),
    });
    process.exit(exitCode);
  }

  // List mode is selected by `--list`; otherwise we need a positional URL.
  const listFile = values.list;
  if (values.help || (!listFile && positionals.length === 0)) {
    help();
    process.exit(values.help ? 0 : 1);
  }

  let listUrls: string[] = [];
  if (listFile) {
    try {
      listUrls = readFileSync(resolve(listFile), 'utf8')
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('#'));
    } catch (err) {
      console.error(`Cannot read --list file ${listFile}: ${(err as Error).message}`);
      process.exit(2);
    }
    if (listUrls.length === 0) {
      console.error(`--list file ${listFile} contains no URLs.`);
      process.exit(2);
    }
  }

  // In list mode the first listed URL doubles as `startUrl` for progress
  // labels; in spider mode the positional argument is the start URL.
  const startUrl = listFile ? (listUrls[0] ?? '') : positionals[0]!;
  const dbPath = resolve(values.db ?? 'crawl.seoproject');
  const db = new ProjectDb(dbPath);

  // Layered config: defaults → file (if `--config`) → command-line flags.
  // The file format matches the Settings → Export Settings envelope
  // (`{format, version, exportedAt, config}`); a bare `CrawlConfig`
  // fragment is also accepted so users can hand-author a JSON file.
  let fileConfig: Record<string, unknown> = {};
  if (values.config) {
    try {
      fileConfig = readConfigFile(values.config);
    } catch (err) {
      console.error(
        `Cannot read --config file ${values.config}: ${(err as Error).message}`,
      );
      process.exit(2);
    }
  }

  // Per-flag overrides win ONLY when the flag is actually present. Applying
  // them unconditionally would let a `parseNumeric(undefined, DEFAULT)` /
  // `?? DEFAULT` fallback silently overwrite a value the user set in the
  // --config file (the help text promises "the command line still win[s]",
  // not "defaults clobber the file").
  const config: CrawlConfig = {
    ...DEFAULT_CRAWL_CONFIG,
    ...fileConfig,
    mode: listFile ? ('list' as const) : ('spider' as const),
    urlList: listUrls,
    startUrl,
    ...flagOverrides(values),
  };

  // Auto Compare: keep the crawl this one is about to replace. A resume
  // continues the same crawl, so only a fresh start takes a snapshot.
  if (values['auto-compare']) {
    const kept = db.snapshotForCompare();
    if (!values.json && kept > 0) console.log(`Kept ${kept} page(s) of the previous crawl for comparison.`);
  }

  process.exit(await runCrawl(config, db, dbPath, values));
}

type CliValues = Record<string, string | boolean | string[] | undefined>;

/** The crawl settings the command line sets explicitly (absent flags leave
 *  the file / saved value alone). */
function flagOverrides(values: CliValues): Partial<CrawlConfig> {
  const str = (k: string): string | undefined => (typeof values[k] === 'string' ? (values[k] as string) : undefined);
  const list = (k: string): string[] | undefined =>
    Array.isArray(values[k]) ? (values[k] as string[]) : undefined;
  const positions = list('exclude-link-position')?.filter((p): p is LinkPosition =>
    ['navigation', 'header', 'footer', 'sidebar', 'content', 'aside'].includes(p),
  );
  return {
    ...(str('depth') !== undefined
      ? { maxDepth: parseNumeric(str('depth'), DEFAULT_CRAWL_CONFIG.maxDepth) }
      : {}),
    ...(str('max') !== undefined ? { maxUrls: parseNumeric(str('max'), DEFAULT_CRAWL_CONFIG.maxUrls) } : {}),
    ...(str('concurrency') !== undefined
      ? { maxConcurrency: parseNumeric(str('concurrency'), DEFAULT_CRAWL_CONFIG.maxConcurrency) }
      : {}),
    ...(str('rps') !== undefined ? { maxRps: parseNumeric(str('rps'), DEFAULT_CRAWL_CONFIG.maxRps) } : {}),
    ...(str('user-agent') !== undefined ? { userAgent: str('user-agent')! } : {}),
    // `--no-robots` / `--external` only flip the flag ON in their direction;
    // absent, the file value (or default) stands.
    ...(values['no-robots'] ? { respectRobotsTxt: false } : {}),
    ...(values['respect-crawl-delay'] ? { respectCrawlDelay: true } : {}),
    ...(values.external ? { crawlExternal: true } : {}),
    ...(values['image-variants'] ? { crawlImageVariants: true } : {}),
    ...(values['adaptive-speed'] ? { adaptiveSpeed: true } : {}),
    ...(str('connection-retries') !== undefined
      ? { connectionFailureRetries: parseNumeric(str('connection-retries'), DEFAULT_CRAWL_CONFIG.connectionFailureRetries) }
      : {}),
    ...(list('header') !== undefined ? { customHeaders: parseHeaders(list('header')) } : {}),
    ...(list('include') !== undefined ? { includePatterns: list('include')! } : {}),
    ...(list('exclude') !== undefined ? { excludePatterns: list('exclude')! } : {}),
    ...(positions !== undefined ? { excludeLinkPositions: positions } : {}),
    ...(list('exclude-link-selector') !== undefined
      ? { excludeLinkSelectors: list('exclude-link-selector')! }
      : {}),
    ...(str('webhook') !== undefined ? { webhookUrl: str('webhook')!.trim() } : {}),
    ...(isWebhookFormat(str('webhook-format')) ? { webhookFormat: str('webhook-format') as WebhookFormat } : {}),
  };
}

function isWebhookFormat(v: string | undefined): v is WebhookFormat {
  return v !== undefined && (WEBHOOK_FORMATS as readonly string[]).includes(v);
}

/**
 * Run a crawl on `db` to the end and report. While it runs it can be
 * paused, resumed or stopped from another terminal (`freecrawl pause …`);
 * its settings are saved in the project (without credentials) so
 * `freecrawl resume` can carry on later. Returns the exit code.
 */
async function runCrawl(
  config: CrawlConfig,
  db: ProjectDb,
  dbPath: string,
  values: CliValues,
): Promise<number> {
  const startUrl = config.startUrl;
  const live = liveCrawl(dbPath);
  if (live && live.pid !== process.pid) {
    db.close();
    console.error(
      `A crawl is already running on ${dbPath} (pid ${live.pid}). Pause or stop it first: freecrawl stop --db ${dbPath}`,
    );
    return 2;
  }
  const onUnresponsive = values['on-unresponsive'] === 'wait' ? 'wait' : 'stop';
  // Saved for `freecrawl resume`. A crawl of a different site wipes the
  // project (meta included) when it starts, so it is written again then.
  const saveResumeConfig = (): void =>
    db.setMeta(CLI_CONFIG_META_KEY, JSON.stringify(configForResume(config)));
  saveResumeConfig();

  const crawler = new Crawler(config, db, { onProjectReset: saveResumeConfig });
  const jsonMode = Boolean(values.json);

  if (!jsonMode) {
    crawler.on('progress', (p) => {
      process.stdout.write(
        `\r[${p.crawled}/${p.discovered}] pending=${p.pending} failed=${p.failed} @ ${p.urlsPerSecond.toFixed(1)} URL/s  avg=${p.avgResponseTimeMs}ms  t=${Math.round(p.elapsedMs / 1000)}s   `,
      );
    });
  }
  let crawlError: string | null = null;
  crawler.on('error', (msg) => {
    // Record the first fatal error (invalid/unreachable start URL, seed
    // failure, bad pattern) so the exit code and --json `ok` reflect it —
    // otherwise an unreachable seed produces an empty DB with no 4xx/5xx
    // rows and the CLI misreports success to a CI pipeline.
    if (crawlError === null) crawlError = String(msg);
    process.stderr.write(`\n[error] ${msg}\n`);
  });

  // ---- remote control + crawl state file ----------------------------
  const startedAt = new Date().toISOString();
  let state: CrawlState = 'running';
  let pausedReason: string | null = null;
  let unresponsiveStop = false;
  const publish = (): void => {
    try {
      writeStatus(dbPath, { pid: process.pid, startedAt, startUrl, state, pausedReason });
    } catch {
      /* status is a convenience for other terminals; the crawl goes on */
    }
  };
  const cleanupStatus = (): void => removeStatus(dbPath);
  pendingCleanups.add(cleanupStatus);
  publish();
  const note = (msg: string): void => {
    if (!jsonMode) process.stdout.write(`\n${msg}\n`);
  };
  const poll = setInterval(() => {
    let action: ControlAction | null = null;
    try {
      action = takeControl(dbPath);
    } catch {
      action = null;
    }
    if (action === 'pause') crawler.pause();
    else if (action === 'resume') crawler.resume();
    else if (action === 'stop') {
      state = 'stopping';
      publish();
      note('Stop requested — finishing up…');
      crawler.stop();
    }
  }, 1000);
  crawler.on('progress', (p) => {
    if (state === 'stopping') return;
    const next: CrawlState = p.paused ? 'paused' : 'running';
    const reason = p.paused ? (p.pausedReason ?? null) : null;
    if (next === state && reason === pausedReason) return;
    state = next;
    pausedReason = reason;
    publish();
    if (next === 'running') {
      note('Resumed.');
      return;
    }
    if (reason === 'host-unresponsive') {
      if (onUnresponsive === 'wait') {
        note(
          `Paused: the site stopped responding. Continue with: freecrawl resume --db ${dbPath}  (or: freecrawl stop --db ${dbPath})`,
        );
      } else {
        unresponsiveStop = true;
        state = 'stopping';
        publish();
        note(
          `Paused: the site stopped responding — saving and exiting. Continue later with: freecrawl resume --db ${dbPath}`,
        );
        crawler.stop();
      }
      return;
    }
    note(`Paused. Continue with: freecrawl resume --db ${dbPath}`);
  });

  try {
    await crawler.start();
  } finally {
    clearInterval(poll);
    cleanupStatus();
    pendingCleanups.delete(cleanupStatus);
  }
  // The crawl-finished webhook is posted after `done`; the process exits as
  // soon as this function returns, which would cut the POST off.
  await crawler.webhookSettled();
  if (!jsonMode) process.stdout.write('\n');

  const summary = db.getSummary();
  let exportedTo: string | null = null;
  let rowsWritten = 0;
  const out = typeof values.out === 'string' ? values.out : undefined;
  if (out) {
    const outPath = resolve(out);
    // Auto-detect format from extension. `.json` -> full JSON dump, anything
    // else -> CSV (existing behaviour).
    const isJson = outPath.toLowerCase().endsWith('.json');
    const r = isJson
      ? await exportUrlsToJson(db, outPath, { pretty: true })
      : await exportUrlsToCsv(db, outPath);
    rowsWritten = r.rowsWritten;
    exportedTo = outPath;
  }

  // Auto Compare: what changed since the snapshot taken before this crawl.
  let comparison: PreviousCrawlComparison | null = null;
  let changeFiles: string[] = [];
  if (values['auto-compare']) {
    comparison = db.compareWithPreviousCrawl();
    if (comparison) {
      changeFiles = await writeCrawlChangesCsvs(comparison, out ? dirname(resolve(out)) : dirname(dbPath));
    }
  }

  const overview = db.getOverviewCounts();
  const issues = overview.issues;
  const soft404Probe = overview.site?.soft404Probe ?? null;
  const botBlocked = overview.site?.botBlocked ?? null;
  // A crawl that fetched nothing (unreachable seed, everything filtered) is a
  // failure for CI purposes — a successful spider always fetches ≥1 page.
  const hasErrors =
    crawlError !== null ||
    summary.total === 0 ||
    Object.keys(summary.byStatus).some((k) => {
      const n = Number.parseInt(k, 10);
      return Number.isFinite(n) && n >= 400;
    });

  if (jsonMode) {
    process.stdout.write(
      JSON.stringify(
        {
          ok: !hasErrors,
          error: crawlError,
          startUrl,
          dbPath,
          summary,
          issues,
          site: { soft404Probe, botBlocked },
          exportedTo,
          rowsExported: exportedTo ? rowsWritten : null,
          stoppedBecauseUnresponsive: unresponsiveStop,
          ...(values['auto-compare']
            ? {
                comparison: comparison
                  ? {
                      previousCrawlAt: comparison.previousTakenAt,
                      pagesBefore: comparison.totalPrevious,
                      pagesNow: comparison.totalCurrent,
                      changes: comparison.counts,
                      issues: comparison.issues,
                      files: changeFiles,
                    }
                  : null,
              }
            : {}),
        },
        null,
        2,
      ) + '\n',
    );
  } else {
    console.log(
      `Done. Total=${summary.total}  Bytes=${summary.totalBytes}  AvgResp=${summary.avgResponseTimeMs}ms`,
    );
    if (exportedTo) {
      console.log(`Wrote ${rowsWritten} rows -> ${exportedTo}`);
    }
    if (values['auto-compare']) printComparison(comparison, changeFiles);
    if (botBlocked) {
      console.log(
        `Warning: bot protection blocked ${botBlocked.count} URL(s)` +
          (botBlocked.sample ? ` (${botBlocked.sample})` : '') +
          ' — not crawled; lower --rps or allowlist the crawler and re-run',
      );
    }
    if (soft404Probe) {
      console.log(
        `Warning: missing pages return ${soft404Probe.status} (soft 404) — ${soft404Probe.url}` +
          (soft404Probe.finalUrl ? ` -> ${soft404Probe.finalUrl}` : ''),
      );
    }
  }

  db.close();
  // 3 = paused because the site stopped responding; `freecrawl resume`
  // carries on from where it stopped.
  return unresponsiveStop ? 3 : hasErrors ? 1 : 0;
}

/** Human summary of `--auto-compare`: page changes, then the checks that moved most. */
function printComparison(comparison: PreviousCrawlComparison | null, files: string[]): void {
  if (!comparison) {
    console.log(
      'Auto compare: no previous crawl in this project yet — the next --auto-compare run compares with this one.',
    );
    return;
  }
  const changed = (Object.keys(comparison.counts) as (keyof typeof comparison.counts)[])
    .filter((k) => comparison.counts[k] > 0)
    .map((k) => `${COMPARE_CATEGORY_LABELS[k]}: ${comparison.counts[k]}`);
  console.log(
    `Changes since the previous crawl (${comparison.previousTakenAt}): ` +
      (changed.length > 0 ? changed.join(', ') : 'no page changes'),
  );
  if (comparison.issues.length > 0) {
    console.log(`Issue checks that changed: ${comparison.issues.length}`);
    for (const i of comparison.issues.slice(0, 10)) {
      const d = i.after - i.before;
      console.log(`  ${i.group} > ${i.label}: ${i.before} -> ${i.after} (${d > 0 ? '+' : ''}${d})`);
    }
  }
  for (const f of files) console.log(`Wrote ${f}`);
}

/**
 * Read a `--config` file: the Settings → Export Settings envelope
 * (`{format, version, exportedAt, config}`) or a bare `CrawlConfig`
 * fragment. Throws on a missing or malformed file.
 */
function readConfigFile(file: string): Record<string, unknown> {
  const raw = readFileSync(resolve(file), 'utf8');
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (parsed && typeof parsed === 'object' && 'config' in parsed) {
    return (parsed['config'] as Record<string, unknown>) ?? {};
  }
  return parsed;
}

function parseNumeric(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Parse `--header "Key: Value"` repeated flags into a map. Values beyond
 * the first `:` are kept as-is (so `X: bearer token with: colon` works).
 */
function parseHeaders(values: string[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!values) return out;
  for (const raw of values) {
    const idx = raw.indexOf(':');
    if (idx <= 0) continue;
    const key = raw.slice(0, idx).trim();
    const value = raw.slice(idx + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

/**
 * Fetch a sitemap (or sitemap-index) URL, walk it, and report URL count +
 * lastmod sample validity. Exit 0 = clean, 1 = warnings, 2 = fetch failure.
 */
async function runValidateSitemap(rawUrl: string, userAgent: string): Promise<number> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    console.error(`Invalid URL: ${rawUrl}`);
    return 2;
  }
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 30_000);
  try {
    // Walk the sitemap (and any nested indexes) up to a reasonable cap so
    // pathological sites can't hang the CLI.
    const result = await fetchSitemaps([parsed.toString()], {
      userAgent,
      signal: ac.signal,
      timeoutMs: 30_000,
      maxUrls: 100_000,
      maxDepth: 3,
    });
    if (result.errors.length > 0 && result.entries.length === 0) {
      console.error(`Sitemap fetch failed:`);
      for (const e of result.errors) console.error(`  ${e.sitemap}: ${e.error}`);
      return 2;
    }
    const lastmodSamples = result.entries
      .slice(0, 50)
      .map((e) => e.lastmod ?? '')
      .filter(Boolean)
      .slice(0, 10);
    const validation = validateSitemap({
      urlCount: result.entries.length,
      fileBytes: 0, // Unknown without a head request; size cap is best-effort here.
      lastmodSamples,
    });
    console.log(`Sitemap: ${rawUrl}`);
    console.log(`  Sitemaps tried: ${result.sitemapsTried.length}`);
    console.log(`  Sitemaps parsed: ${result.sitemapsParsed.length}`);
    console.log(`  URL entries: ${result.entries.length}${result.truncated ? ' (truncated)' : ''}`);
    if (result.errors.length > 0) {
      console.log(`  Errors:`);
      for (const e of result.errors) console.log(`    ${e.sitemap}: ${e.error}`);
    }
    if (validation.findings.length > 0) {
      console.log(`  Findings:`);
      for (const f of validation.findings) console.log(`    - ${f}`);
      return 1;
    }
    console.log('  OK');
    return 0;
  } catch (err) {
    console.error(`Validation error: ${(err as Error).message}`);
    return 2;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Run the configured robots.txt against a single URL — print whether it's
 * allowed, the matched user-agent's crawl-delay, and any declared sitemaps.
 */
async function runAuditRobots(rawUrl: string, userAgent: string): Promise<number> {
  try {
    new URL(rawUrl);
  } catch {
    console.error(`Invalid URL: ${rawUrl}`);
    return 2;
  }
  const result = await testUrlAgainstRobots(rawUrl, userAgent);
  console.log(`URL:        ${result.url}`);
  console.log(`robots.txt: ${result.robotsUrl}`);
  if (result.error) {
    console.log(`Status:     fetch error — ${result.error}`);
    console.log('Verdict:    ALLOWED (default-allow when robots.txt is unreachable)');
    return 0;
  }
  console.log(`Status:     HTTP ${result.status ?? '—'}`);
  console.log(`User-Agent: ${userAgent}`);
  console.log(`Crawl-Delay: ${result.crawlDelay ?? '—'}`);
  if (result.sitemaps.length > 0) {
    console.log(`Sitemaps:`);
    for (const s of result.sitemaps) console.log(`  - ${s}`);
  }
  console.log(`Verdict:    ${result.allowed ? 'ALLOWED' : 'DISALLOWED'}`);
  return result.allowed ? 0 : 1;
}

/** An existing project a command reads or updates. */
interface OpenedProject {
  db: ProjectDb;
  /** Close the database and, for a desktop-saved project, pack the working
   *  copy back onto the original file. Call only after a successful write. */
  save(): Promise<void>;
  /** Close the database if still open and delete any working copy. Runs
   *  on every exit path; never repacks. */
  dispose(): void;
}

/** Cleanups still due; the exit hook runs them after Ctrl-C or a crash, so
 *  no working copy is left in the temp directory. */
const pendingCleanups = new Set<() => void>();
process.on('exit', () => {
  for (const cleanup of pendingCleanups) cleanup();
});

/** Ctrl-C for a command with no cancel of its own: exit through
 *  `process.exit`, so the exit hook still removes working copies. */
function exitOnInterrupt(): void {
  // `on`, not `once`: a second Ctrl-C while the exit hook runs must not
  // fall back to the default kill and cut the cleanup short.
  process.on('SIGINT', () => {
    process.stderr.write('\nInterrupted.\n');
    process.exit(130);
  });
}

/**
 * Take `<project>.lock` for a write to a desktop-saved project, so two CLI
 * commands can't each repack the archive and drop the other's data. A lock
 * whose process is gone (killed, crashed) is taken over. Returns the
 * release function, which deletes the lock only while it is still ours;
 * throws a user-facing message when the lock is held.
 */
function lockProject(path: string): () => void {
  const lockPath = `${path}.lock`;
  const inUse = (holder: number | string): Error =>
    new Error(
      `The project is in use by another FreeCrawl CLI command (pid ${holder}). ` +
        `Wait for it to finish, or delete ${lockPath} if no such command is running.`,
    );
  for (let attempt = 0; attempt < 3; attempt++) {
    const mine = createExclusive(lockPath);
    if (mine !== null) return () => removeIfUnchanged(lockPath, mine);
    const seen = readIfExists(lockPath);
    if (seen === null) continue; // released meanwhile
    const holder = lockHolder(lockPath, seen);
    if (holder !== null) throw inUse(holder);
    removeStale(lockPath, seen, inUse);
  }
  throw inUse('unknown');
}

/**
 * Delete the stale `file`, which held `content`, so that only one process
 * ever does it. A plain check-then-delete would let a slow process delete
 * the fresh lock a faster one had just created. Instead the delete happens
 * only under an exclusive guard named after `content`: every lock and guard
 * is written with unique content, which never reappears once deleted, so
 * the guard holder knows the file it re-reads is the same stale one (a
 * half-written file has no id, so for it the age is checked again). A
 * guard left by a crashed process is cleared the same way, one level up.
 */
function removeStale(
  file: string,
  content: string,
  inUse: (holder: number | string) => Error,
  depth = 0,
): void {
  const guardPath = `${file.replace(/\.takeover-[0-9a-f]+$/, '')}.takeover-${createHash('sha256')
    .update(content)
    .digest('hex')
    .slice(0, 16)}`;
  let guard = createExclusive(guardPath);
  if (guard === null) {
    const guardSeen = readIfExists(guardPath);
    if (guardSeen !== null) {
      const holder = lockHolder(guardPath, guardSeen);
      if (holder !== null) throw inUse(holder);
      if (depth >= 3) throw inUse('unknown');
      removeStale(guardPath, guardSeen, inUse, depth + 1);
    }
    guard = createExclusive(guardPath);
    if (guard === null) throw inUse('unknown');
  }
  try {
    const now = readIfExists(file);
    if (now === content && lockHolder(file, now) === null) rmSync(file, { force: true });
  } finally {
    removeIfUnchanged(guardPath, guard);
  }
}

/** Create `file` exclusively with this process's pid, start time and a
 *  unique id; returns what was written, or null when it already exists. */
function createExclusive(file: string): string | null {
  let fd: number;
  try {
    fd = openSync(file, 'wx');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') return null;
    throw err;
  }
  const content = JSON.stringify({
    pid: process.pid,
    startedAt: new Date().toISOString(),
    id: randomUUID(),
  });
  try {
    writeSync(fd, content);
  } finally {
    closeSync(fd);
  }
  return content;
}

function readIfExists(file: string): string | null {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

/** Delete `file` only if it still holds `content`. */
function removeIfUnchanged(file: string, content: string): void {
  if (readIfExists(file) === content) rmSync(file, { force: true });
}

/** The pid of a live holder of the lock `file`, which holds `content`, or
 *  null when the lock is stale. */
function lockHolder(file: string, content: string): number | string | null {
  let pid: unknown;
  try {
    pid = (JSON.parse(content) as { pid?: unknown }).pid;
  } catch {
    // Unreadable or half-written: its owner may be writing it right now,
    // so only an old one counts as stale.
    try {
      return Date.now() - statSync(file).mtimeMs < 10_000 ? 'unknown' : null;
    } catch {
      return null;
    }
  }
  if (typeof pid !== 'number' || !Number.isInteger(pid) || pid <= 0) return null;
  try {
    process.kill(pid, 0);
    return pid;
  } catch (err) {
    // EPERM: the process exists but belongs to someone else.
    return (err as NodeJS.ErrnoException).code === 'EPERM' ? pid : null;
  }
}

const WORKING_COPY_PREFIX = 'freecrawl-cli-';
/** Owner file in each working copy directory, written like a lock. */
const WORKING_COPY_OWNER = 'owner.lock';

/**
 * Remove the working copies that commands killed outright (a hard kill,
 * a crash, a shutdown) left in the temp directory: no exit hook runs then,
 * and each copy is the size of the unpacked project. A copy is orphaned
 * when the process in its owner file is gone, or, with no owner file, when
 * it is over an hour old. Best effort: anything still in use stays.
 */
function removeOrphanedWorkingCopies(): void {
  let entries;
  try {
    entries = readdirSync(tmpdir(), { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith(WORKING_COPY_PREFIX)) continue;
    const dir = join(tmpdir(), entry.name);
    try {
      const ownerPath = join(dir, WORKING_COPY_OWNER);
      const owner = readIfExists(ownerPath);
      const orphaned =
        owner === null
          ? Date.now() - statSync(dir).mtimeMs > 3_600_000
          : lockHolder(ownerPath, owner) === null;
      if (orphaned) rmSync(dir, { recursive: true, force: true });
    } catch {
      /* in use or not ours to remove; tried again on the next run */
    }
  }
}

/**
 * Open an existing project file. The desktop app saves projects as a
 * compressed container (`packProject`), which is unpacked into a fresh temp
 * directory and opened there; `save()` packs it back. A bare SQLite project
 * (a CLI crawl, or a desktop save from before the container) opens in place,
 * as it always has. With `createIfMissing`, a missing path becomes a new
 * bare project. With `forWrite`, a desktop-saved project is locked (see
 * `lockProject`) until `dispose()`; bare SQLite relies on SQLite's own
 * locking. Throws with a user-facing message on a missing, unrecognised or
 * locked file.
 *
 * The desktop app works on its own working copy, so if it has the same
 * project open, its next Save overwrites whatever the CLI wrote.
 */
async function openProject(
  path: string,
  opts: { createIfMissing?: boolean; forWrite?: boolean } = {},
): Promise<OpenedProject> {
  let dir: string | null = null;
  let workingPath: string | null = null;
  let unlock: (() => void) | null = null;
  if (!existsSync(path)) {
    if (!opts.createIfMissing) throw new Error(`Project not found: ${path}`);
  } else {
    const format = detectProjectFormat(path);
    if (format === 'unknown') {
      throw new Error(
        'This file is not a FreeCrawl project (unrecognised format). It may be corrupt or a different file type.',
      );
    }
    if (format === 'archive') {
      removeOrphanedWorkingCopies();
      if (opts.forWrite) unlock = lockProject(path);
      // Created synchronously and registered below before anything awaits,
      // so an exit at any later point still removes it (and the lock).
      try {
        dir = mkdtempSync(join(tmpdir(), WORKING_COPY_PREFIX));
        try {
          if (createExclusive(join(dir, WORKING_COPY_OWNER)) === null) {
            throw new Error(`Could not create the working copy in ${dir}`);
          }
        } catch (err) {
          rmSync(dir, { recursive: true, force: true });
          throw err;
        }
      } catch (err) {
        unlock?.();
        throw err;
      }
      workingPath = join(dir, basename(path));
    }
  }

  let db: ProjectDb | undefined;
  let packing = false;
  const close = (): void => {
    const open = db;
    db = undefined;
    open?.close();
  };
  const dispose = (): void => {
    pendingCleanups.delete(dispose);
    try {
      close();
    } catch {
      /* already gone — the files are removed regardless */
    }
    // Separate steps, so one busy file (Windows refuses files an
    // interrupted pack still holds open) doesn't stop the others.
    if (packing) {
      // Interrupted mid-pack: drop the half-written file; the original
      // project is only replaced by the final rename.
      try {
        rmSync(`${path}.part`, { force: true });
      } catch {
        /* left beside the project; the next save overwrites it */
      }
    }
    if (dir) {
      try {
        // The SQLite sidecars (-wal / -shm) live in the same directory.
        rmSync(dir, { recursive: true, force: true });
      } catch {
        /* left in the temp directory */
      }
    }
    if (unlock) {
      try {
        unlock();
      } catch {
        /* a stale lock is taken over by the next command */
      }
    }
  };
  pendingCleanups.add(dispose);

  try {
    if (workingPath) await unpackProject(path, workingPath);
    db = new ProjectDb(workingPath ?? path);
  } catch (err) {
    dispose();
    throw err;
  }
  return {
    db,
    async save() {
      close();
      if (!workingPath) return;
      packing = true;
      await packProject(workingPath, path);
      packing = false;
    },
    dispose,
  };
}

/**
 * Cross-project diff. Opens two `.seoproject` files (read-only — never
 * mutates), runs the same `compareCrawls` engine the desktop Compare
 * dialog uses, and prints a category-grouped count + samples to stdout.
 *
 * Exit code: 0 when both projects load and diff completes; 1 when at
 * least one diff category had non-zero results (useful for CI gates that
 * want to fail on regressions); 2 on fatal load error.
 */
async function runCompare(beforePath: string, afterPath: string): Promise<number> {
  let before: OpenedProject;
  let after: OpenedProject;
  try {
    before = await openProject(beforePath);
  } catch (err) {
    console.error(`Cannot open before project: ${(err as Error).message}`);
    return 2;
  }
  try {
    after = await openProject(afterPath);
  } catch (err) {
    before.dispose();
    console.error(`Cannot open after project: ${(err as Error).message}`);
    return 2;
  }
  try {
    const summary = compareCrawls(before.db, after.db);
    console.log(`Compare: ${beforePath} → ${afterPath}`);
    console.log(`  Total before: ${summary.totalA}`);
    console.log(`  Total after:  ${summary.totalB}`);
    console.log(`  Diff:`);
    for (const [cat, count] of Object.entries(summary.counts)) {
      console.log(`    ${cat.padEnd(15)} ${count}`);
    }
    const totalDiff = Object.values(summary.counts).reduce(
      (a, b) => a + b,
      0,
    );
    return totalDiff > 0 ? 1 : 0;
  } finally {
    before.dispose();
    after.dispose();
  }
}

/**
 * V2 Faz 2 — flatten the core analyzer's Map aggregates into the plain
 * arrays `ProjectDb.ingestLogAnalysis` expects (mirrors the desktop's
 * `ingestLogResult`). Kept in the CLI so headless log ingestion needs no
 * Electron / desktop process.
 */
function flattenLogResult(filePath: string, result: LogAnalysisResult): LogIngestInput {
  return {
    file: {
      filePath,
      fileName: basename(filePath),
      format: result.format,
      totalLines: result.totalLines,
      parsedLines: result.parsedLines,
      skippedLines: result.skippedLines,
      minTs: result.minTs,
      maxTs: result.maxTs,
    },
    urlStats: Array.from(result.urlStats.values()).map((u) => ({
      path: u.path,
      totalHits: u.totalHits,
      botHits: u.botHits,
      googlebotHits: u.googlebotHits,
      bingbotHits: u.bingbotHits,
      yandexbotHits: u.yandexbotHits,
      otherBotHits: u.otherBotHits,
      lastStatus: u.lastStatus,
      firstTs: u.firstTs,
      lastTs: u.lastTs,
    })),
    daily: Array.from(result.daily.entries()).map(([key, hits]) => {
      // Key is `${day}\t${bucket}` (tab-separated in log-analyzer.ts).
      const sp = key.indexOf('\t');
      return { day: key.slice(0, sp), bucket: key.slice(sp + 1), hits };
    }),
    status: Array.from(result.status.entries()).map(([status, v]) => ({
      status,
      count: v.count,
      botCount: v.botCount,
    })),
    bots: Array.from(result.bots.entries()).map(([bot, agg]) => ({
      bot,
      family: agg.family,
      hits: agg.hits,
      totalIps: agg.ips.size,
      verifiedIps: agg.verifiedIps,
      verifiable: agg.verifiable,
    })),
    urlBots: Array.from(result.urlStats.values()).flatMap((u) =>
      Array.from(u.botCounts.entries()).map(([bot, hits]) => ({ path: u.path, bot, hits })),
    ),
    threats: result.threats,
    threatsDropped: result.threatsDropped,
  };
}

/**
 * Parse one or more access logs, detect bots, and merge every file's
 * aggregates into the same project DB. Prints a per-file line plus a combined
 * summary (or JSON). Exit 0 when at least one file ingested, 2 on error.
 */
async function runAnalyzeLogs(
  logPaths: string[],
  opts: {
    projectPath: string;
    format: 'auto' | 'apache-combined' | 'apache-common' | 'nginx' | 'iis-w3c' | 'custom';
    regex: string | undefined;
    verifyBots: boolean;
    json: boolean;
  },
): Promise<number> {
  let project: OpenedProject;
  try {
    // A missing project is created, so logs can be analysed without a crawl.
    project = await openProject(opts.projectPath, { createIfMissing: true, forWrite: true });
  } catch (err) {
    const error = `Cannot open project ${opts.projectPath}: ${(err as Error).message}`;
    if (opts.json) {
      process.stdout.write(JSON.stringify({ ok: false, error, imported: [], errors: [] }, null, 2) + '\n');
    } else {
      console.error(error);
    }
    return 2;
  }
  const { db } = project;
  try {
    const imported: ReturnType<ProjectDb['ingestLogAnalysis']>[] = [];
    const failures: Array<{ file: string; error: string }> = [];
    for (const logPath of logPaths) {
      try {
        const result = await analyzeLogFile(logPath, {
          format: opts.format,
          customRegex: opts.regex,
          verifyBots: opts.verifyBots,
        });
        const summary = db.ingestLogAnalysis(flattenLogResult(logPath, result));
        imported.push(summary);
        if (!opts.json) {
          console.log(`Log: ${summary.fileName} (${summary.format})`);
          console.log(`  Lines:  ${summary.parsedLines}/${summary.totalLines} parsed, ${summary.skippedLines} skipped`);
        }
      } catch (err) {
        const error = (err as Error).message;
        failures.push({ file: logPath, error });
        if (!opts.json) console.error(`  Skipped ${logPath}: ${error}`);
      }
    }

    if (imported.length === 0) {
      if (opts.json) {
        process.stdout.write(JSON.stringify({ ok: false, imported: [], errors: failures }, null, 2) + '\n');
      } else {
        console.error('analyze-logs failed: no files could be ingested.');
      }
      return 2;
    }

    const overview = db.getLogOverview();
    const bots = db.getLogBots().slice(0, 10);
    const topUrls = db
      .queryLogUrlStats({ limit: 10, offset: 0, sortBy: 'botHits', filter: 'bots' })
      .rows;
    await project.save();

    if (opts.json) {
      process.stdout.write(
        JSON.stringify(
          { ok: true, imported, errors: failures, overview, topBots: bots, topBotUrls: topUrls },
          null,
          2,
        ) + '\n',
      );
    } else {
      if (imported.length > 1) console.log(`Ingested ${imported.length} files.`);
      console.log(`  Hits:   ${overview.totalHits} total · ${overview.botHits} bot · ${overview.humanHits} human`);
      if (overview.minTs) {
        const d = (ms: number): string => new Date(ms).toISOString().slice(0, 16).replace('T', ' ');
        console.log(`  Range:  ${d(overview.minTs)} → ${overview.maxTs ? d(overview.maxTs) : '?'}`);
      }
      if (bots.length > 0) {
        console.log('  Top bots:');
        for (const b of bots) {
          const v = b.verifiable ? ` (${b.verifiedIps}/${b.totalIps} IPs verified)` : '';
          console.log(`    ${b.bot.padEnd(28)} ${String(b.hits).padStart(8)}${v}`);
        }
      }
      if (topUrls.length > 0) {
        console.log('  Top bot-hit URLs:');
        for (const u of topUrls) {
          console.log(`    ${String(u.botHits).padStart(8)}  ${u.path}${u.inCrawl ? '' : '  [orphan]'}`);
        }
      }
    }
    return 0;
  } catch (err) {
    console.error(`analyze-logs failed: ${(err as Error).message}`);
    return 2;
  } finally {
    project.dispose();
  }
}

/**
 * Yandex Metrica token from `YANDEX_METRICA_TOKEN` — the CLI has no
 * credential store. Never echoed: the messages name the variable only.
 */
function metricaToken(): string {
  const token = process.env['YANDEX_METRICA_TOKEN']?.trim() ?? '';
  if (!token) {
    throw new MetricaError(
      'YANDEX_METRICA_TOKEN is not set — export a Yandex Metrica OAuth token with the metrika:read scope.',
      'not-connected',
    );
  }
  // Same check as the desktop app: a value with spaces or line breaks would
  // otherwise reach undici, whose header error quotes the value.
  if (!/^[A-Za-z0-9._~+/=-]+$/.test(token)) {
    throw new MetricaError(
      'YANDEX_METRICA_TOKEN has an unexpected format — it must be a single OAuth token without spaces or line breaks.',
      'token-format',
    );
  }
  return token;
}

/** Print a Metrica failure (JSON on stdout with --json, else stderr) and
 *  return the exit code. */
function metricaFail(json: boolean, err: unknown, exitCode: number): number {
  const error = err instanceof Error ? err.message : String(err);
  const errorCode = err instanceof MetricaError ? err.code : null;
  const cancelled = err instanceof MetricaCancelledError;
  if (json) {
    process.stdout.write(
      JSON.stringify({ ok: false, error, errorCode, cancelled }, null, 2) + '\n',
    );
  } else {
    console.error(error);
    if (errorCode === 'token-rejected') {
      console.error('Check the token in YANDEX_METRICA_TOKEN (scope metrika:read).');
    }
  }
  return exitCode;
}

/**
 * List the counters the token can read. Exit 0 on success, 1 on an API
 * failure, 2 when the token is missing or malformed.
 */
async function runMetricaCounters(json: boolean): Promise<number> {
  let token: string;
  try {
    token = metricaToken();
  } catch (err) {
    return metricaFail(json, err, 2);
  }
  try {
    const counters = await listMetricaCounters(token);
    if (json) {
      process.stdout.write(JSON.stringify({ ok: true, counters }, null, 2) + '\n');
      return 0;
    }
    if (counters.length === 0) {
      console.log('No Yandex Metrica counters are readable with this token.');
      return 0;
    }
    const idWidth = Math.max(...counters.map((c) => c.counterId.length));
    for (const c of counters) {
      console.log(
        `${c.counterId.padEnd(idWidth)}  ${c.name}${c.site && c.site !== c.name ? `  (${c.site})` : ''}`,
      );
    }
    return 0;
  } catch (err) {
    return metricaFail(json, err, 1);
  }
}

/**
 * URL normaliser for Metrica rows, mirroring the desktop's
 * `crawlUrlNormalizer`: the rewrite options of the crawl config, so the
 * stored rows join onto `urls.url`. The config is the `--config` file if
 * given, else the project's `lastCrawlConfig` (only the desktop app saves
 * one: the `{config, secretsEnc}` envelope or a bare config; secrets are
 * irrelevant here), else defaults.
 */
function metricaUrlNormalizer(
  db: ProjectDb,
  configPath: string | undefined,
): (url: string) => string | null {
  let fragment: Record<string, unknown> = {};
  if (configPath) {
    fragment = readConfigFile(configPath);
  } else {
    const raw = db.getMeta('lastCrawlConfig');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (parsed && typeof parsed === 'object') {
          const env = parsed['config'];
          fragment = env && typeof env === 'object' ? (env as Record<string, unknown>) : parsed;
        }
      } catch {
        /* corrupt meta — fall back to the default rewrites */
      }
    }
  }
  const c = { ...DEFAULT_CRAWL_CONFIG, ...fragment } as CrawlConfig;
  const rewrites = {
    stripWww: c.stripWww,
    forceHttps: c.forceHttps,
    lowercasePath: c.lowercasePath,
    trailingSlash: c.trailingSlash,
    keepQueryParams: c.keepQueryParams,
    sortQueryParams: c.sortQueryParams,
    collapseDuplicateSlashes: c.collapseDuplicateSlashes,
    keepHashRoutes: c.renderingMode === 'js' && c.jsRender?.spaRouting === true,
    regexRewrites: compileUrlRegexRewrites(c.urlRegexRewrites),
  };
  return (url) => normalizeUrl(url, undefined, rewrites);
}

/**
 * Pull one counter's per-page data into an existing project, writing what
 * the desktop pull writes (rows + fetch meta, and the counter in
 * `integrationSettings:metrica`), so the desktop app shows the same data.
 * Ctrl-C during the pull cancels and writes nothing; once the write has
 * started it exits at once, leaving the project either untouched or fully
 * updated. Exit 0 on success, 1 on an API or write failure, 2 on bad
 * arguments or a locked project, 130 when cancelled or interrupted.
 */
async function runMetricaFetch(opts: {
  counter: string | undefined;
  days: string | undefined;
  projectPath: string;
  configPath: string | undefined;
  json: boolean;
}): Promise<number> {
  // Bad arguments fail like API errors: JSON on stdout with --json.
  const fail = (message: string): number => metricaFail(opts.json, new Error(message), 2);
  const counterId = (opts.counter ?? '').trim();
  if (!/^\d+$/.test(counterId)) {
    if (!opts.json) {
      console.error(
        'Usage: freecrawl metrica-fetch --counter <id> [--days 7|28|90] [--project file] [--config file] [--json]',
      );
    }
    return fail(
      opts.counter === undefined
        ? '--counter is required.'
        : `Invalid --counter: ${opts.counter} (expected a numeric counter id).`,
    );
  }
  const days = opts.days === undefined ? 28 : Number(opts.days);
  if (days !== 7 && days !== 28 && days !== 90) {
    return fail(`Invalid --days: ${opts.days} (expected 7, 28 or 90).`);
  }
  // ProjectDb creates a missing file; a pull into an empty project would
  // join onto nothing, so a typo in --project must fail instead.
  if (!existsSync(opts.projectPath)) {
    return fail(`Project not found: ${opts.projectPath} (crawl it first, or pass --project).`);
  }
  let token: string;
  try {
    token = metricaToken();
  } catch (err) {
    return metricaFail(opts.json, err, 2);
  }

  // Installed before the project opens, so Ctrl-C while a desktop-saved
  // project unpacks also cancels. Once the write has started, or on a
  // second Ctrl-C, it exits at once instead: the exit hook drops a
  // half-written pack, and the original is only replaced by its final
  // rename, so the project is either untouched or completely updated.
  const abort = new AbortController();
  let writing = false;
  const onSigint = (): void => {
    if (writing || abort.signal.aborted) {
      process.stderr.write('\nInterrupted.\n');
      process.exit(130);
    }
    process.stderr.write('\nCancelling the Yandex Metrica fetch…\n');
    abort.abort();
  };
  process.on('SIGINT', onSigint);
  let project: OpenedProject;
  try {
    project = await openProject(opts.projectPath, { forWrite: true });
  } catch (err) {
    process.off('SIGINT', onSigint);
    return fail(`Cannot open project ${opts.projectPath}: ${(err as Error).message}`);
  }
  const { db } = project;
  const tty = process.stderr.isTTY === true;
  let progressOpen = false;
  const endProgress = (): void => {
    if (progressOpen) process.stderr.write('\n');
    progressOpen = false;
  };
  const log = (level: 'info' | 'warn' | 'error', message: string): void => {
    if (level === 'info') return;
    endProgress();
    process.stderr.write(`[${level}] ${message}\n`);
  };
  try {
    let normalize: (url: string) => string | null;
    try {
      normalize = metricaUrlNormalizer(db, opts.configPath);
    } catch (err) {
      return fail(`Cannot read --config file ${opts.configPath}: ${(err as Error).message}`);
    }
    // Best effort, for the name the desktop shows; the pull itself reports
    // any real access problem.
    let counterName = counterId;
    try {
      const counters = await listMetricaCounters(token, { signal: abort.signal, log });
      const found = counters.find((c) => c.counterId === counterId);
      if (found) counterName = found.name;
    } catch (err) {
      if (err instanceof MetricaCancelledError) throw err;
      /* keep the id as the name */
    }
    const result = await fetchMetricaPageMetrics(token, counterId, days, normalize, {
      signal: abort.signal,
      onProgress: (p) => {
        if (opts.json) return;
        const line = `${p.report} report ${p.reportIndex}/${p.reportCount}: ${p.rows} rows`;
        if (tty) {
          process.stderr.write(`\r${line}   `);
          progressOpen = true;
        } else {
          process.stderr.write(`${line}\n`);
        }
      },
      log,
    });
    endProgress();
    const fetchedAt = new Date().toISOString();
    const meta: MetricaFetchMeta = {
      counterId,
      counterName,
      startDate: result.startDate,
      endDate: result.endDate,
      fetchedAt,
      rowCount: result.rows.length,
      truncated: result.truncated,
      sampled: result.sampled,
      totals: result.totals,
    };
    // A cancel acknowledged during the pull writes nothing. The check and
    // the flag sit in the same tick as the (synchronous) DB write.
    if (abort.signal.aborted) throw new MetricaCancelledError();
    writing = true;
    db.replaceMetricaResults(result.rows, fetchedAt, counterId, JSON.stringify(meta));
    // Merge into the per-project settings blob, as the desktop does, so the
    // Metrica tab opens on this counter and range.
    let settings: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(db.getMeta('integrationSettings:metrica') ?? '{}') as unknown;
      if (parsed && typeof parsed === 'object') settings = parsed as Record<string, unknown>;
    } catch {
      /* corrupt blob — overwrite it */
    }
    db.setMeta(
      'integrationSettings:metrica',
      JSON.stringify({ ...settings, counterId, counterName, days }),
    );
    await project.save();

    if (opts.json) {
      process.stdout.write(
        JSON.stringify(
          { ok: true, projectPath: opts.projectPath, days, dropped: result.dropped, ...meta },
          null,
          2,
        ) + '\n',
      );
    } else {
      const t = result.totals;
      console.log(
        `Metrica: counter ${counterId}${counterName !== counterId ? ` (${counterName})` : ''}`,
      );
      console.log(`  Range:   ${result.startDate} → ${result.endDate} (${days} days)`);
      console.log(`  Pages:   ${result.rows.length} stored in ${opts.projectPath}`);
      console.log(
        `  Totals:  ${t.pageviews} pageviews · ${t.visits} visits · ${t.users} users · ${t.searchVisits} search visits`,
      );
      if (result.dropped > 0) {
        console.log(`  Dropped: ${result.dropped} raw rows whose URL did not normalise`);
      }
      if (result.truncated) {
        console.log('  Warning: a report hit the row cap, so low-traffic URLs are missing.');
      }
      if (result.sampled) {
        console.log(
          '  Warning: Yandex Metrica returned sampled data; per-page numbers are estimates.',
        );
      }
    }
    return 0;
  } catch (err) {
    endProgress();
    return metricaFail(opts.json, err, err instanceof MetricaCancelledError ? 130 : 1);
  } finally {
    // Cleanup first: without a listener, Ctrl-C kills the process at once
    // and would leave the working copy behind.
    project.dispose();
    process.off('SIGINT', onSigint);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.stack : err);
  process.exit(2);
});

/** `freecrawl pause|resume|stop` against a crawl running in another process. */
async function runControl(dbPath: string, action: ControlAction, json: boolean): Promise<number> {
  const live = liveCrawl(dbPath);
  const print = (o: Record<string, unknown>, text: string): void => {
    if (json) process.stdout.write(JSON.stringify(o) + '\n');
    else console.log(text);
  };
  if (!live) {
    print({ ok: false, error: 'no-running-crawl', project: dbPath }, `No crawl is running on ${dbPath}.`);
    return 1;
  }
  if (action === 'pause' && live.state === 'paused') {
    print({ ok: true, state: 'paused', pid: live.pid }, `Already paused (pid ${live.pid}).`);
    return 0;
  }
  if (action === 'resume' && live.state === 'running') {
    print({ ok: true, state: 'running', pid: live.pid }, `Already running (pid ${live.pid}).`);
    return 0;
  }
  sendControl(dbPath, action);
  const want: CrawlState[] =
    action === 'pause' ? ['paused'] : action === 'resume' ? ['running'] : ['stopping'];
  const after = await waitForState(dbPath, want);
  const state = after?.state ?? 'stopped';
  const ok = after === null ? action === 'stop' : want.includes(after.state);
  print(
    { ok, action, state, pid: live.pid },
    ok
      ? `${action === 'pause' ? 'Paused' : action === 'resume' ? 'Resumed' : 'Stopping'}: ${live.startUrl} (pid ${live.pid}).`
      : `The crawl (pid ${live.pid}) did not confirm within 10 s; it reports "${state}".`,
  );
  return ok ? 0 : 1;
}

/** The project file plus everything stored beside it. */
function projectFiles(path: string): string[] {
  return [path, `${path}-wal`, `${path}-shm`, `${path}.crawl.json`, `${path}.control`].filter((f) =>
    existsSync(f),
  );
}

/** A reason the project can't be touched right now, or null. */
function busyReason(path: string): string | null {
  const live = liveCrawl(path);
  if (live) return `a crawl is running on it (pid ${live.pid}) — stop it first: freecrawl stop --db ${path}`;
  const lock = readIfExists(`${path}.lock`);
  if (lock !== null) {
    const holder = lockHolder(`${path}.lock`, lock);
    if (holder !== null) return `another FreeCrawl CLI command is using it (pid ${holder})`;
  }
  return null;
}

async function runDelete(path: string, force: boolean): Promise<number> {
  if (!existsSync(path)) {
    console.error(`Project not found: ${path}`);
    return 2;
  }
  const live = liveCrawl(path);
  if (live && force) {
    sendControl(path, 'stop');
    const until = Date.now() + 60_000;
    while (liveCrawl(path) && Date.now() < until) await new Promise((r) => setTimeout(r, 250));
  }
  const busy = busyReason(path);
  if (busy) {
    console.error(`Not deleted: ${busy}.`);
    return 1;
  }
  for (const f of projectFiles(path)) rmSync(f, { force: true });
  rmSync(`${path}.lock`, { force: true });
  console.log(`Deleted ${path}`);
  return 0;
}

/** Name, URL count, start URL and last crawl time of a project, read without
 *  migrating it. A desktop-saved (packed) project only reports its file. */
function projectSummary(path: string): Record<string, unknown> {
  const st = statSync(path);
  const format = detectProjectFormat(path);
  const out: Record<string, unknown> = {
    file: path,
    format: format === 'archive' ? 'desktop (packed)' : format,
    sizeBytes: st.size,
    modified: st.mtime.toISOString(),
  };
  const live = readStatus(path);
  if (live && liveCrawl(path)) out['crawl'] = { state: live.state, pid: live.pid, startUrl: live.startUrl };
  if (format !== 'sqlite') return out;
  let raw: DatabaseSync | null = null;
  try {
    raw = new DatabaseSync(path, { readOnly: true });
    const meta = (key: string): string | null => {
      try {
        return (raw!.prepare('SELECT value FROM project_meta WHERE key = ?').get(key) as { value: string } | undefined)?.value ?? null;
      } catch {
        return null;
      }
    };
    out['name'] = meta('projectName');
    const cfg = meta(CLI_CONFIG_META_KEY) ?? meta('lastCrawlConfig');
    if (cfg) {
      try {
        out['startUrl'] = (JSON.parse(cfg) as { startUrl?: string }).startUrl ?? null;
      } catch {
        /* encrypted / foreign config */
      }
    }
    try {
      out['urls'] = (raw.prepare('SELECT COUNT(*) AS c FROM urls WHERE is_external = 0').get() as { c: number }).c;
    } catch {
      out['urls'] = null;
    }
  } catch {
    /* unreadable — report the file only */
  } finally {
    raw?.close();
  }
  return out;
}

async function runProjectCommand(args: string[], values: CliValues): Promise<number> {
  const [cmd, a, b] = args;
  const json = Boolean(values.json);
  const usage = (): number => {
    console.error(
      'Usage: freecrawl project create <file> [--name n] | rename <file> <name> | move <file> <dest> | delete <file> [--force] | list [dir] | info <file>',
    );
    return 2;
  };
  switch (cmd) {
    case 'create': {
      if (!a) return usage();
      const path = resolve(a);
      if (existsSync(path)) {
        console.error(`Already exists: ${path}`);
        return 1;
      }
      const db = new ProjectDb(path);
      const name = typeof values.name === 'string' ? values.name.trim() : '';
      if (name) db.setMeta('projectName', name);
      db.close();
      console.log(`Created ${path}`);
      return 0;
    }
    case 'rename': {
      if (!a || !b) return usage();
      const path = resolve(a);
      const busy = busyReason(path);
      if (busy) {
        console.error(`Not renamed: ${busy}.`);
        return 1;
      }
      try {
        const project = await openProject(path, { forWrite: true });
        try {
          project.db.setMeta('projectName', b.trim());
          await project.save();
        } finally {
          project.dispose();
        }
      } catch (err) {
        console.error((err as Error).message);
        return 2;
      }
      console.log(`Renamed ${path} → "${b.trim()}"`);
      return 0;
    }
    case 'move': {
      if (!a || !b) return usage();
      const from = resolve(a);
      if (!existsSync(from)) {
        console.error(`Project not found: ${from}`);
        return 2;
      }
      const busy = busyReason(from);
      if (busy) {
        console.error(`Not moved: ${busy}.`);
        return 1;
      }
      let to = resolve(b);
      try {
        if (statSync(to).isDirectory()) to = join(to, basename(from));
      } catch {
        /* a new path */
      }
      if (existsSync(to)) {
        console.error(`Already exists: ${to}`);
        return 1;
      }
      // Fold a bare SQLite project's WAL back into the file first, so the
      // move carries one self-contained file.
      if (detectProjectFormat(from) === 'sqlite') new ProjectDb(from).close();
      for (const f of projectFiles(from)) {
        const dest = to + f.slice(from.length);
        try {
          renameSync(f, dest);
        } catch (err) {
          // Another drive / volume: copy, then remove the original.
          if ((err as NodeJS.ErrnoException).code !== 'EXDEV') throw err;
          copyFileSync(f, dest);
          rmSync(f, { force: true });
        }
      }
      console.log(`Moved ${from} → ${to}`);
      return 0;
    }
    case 'delete': {
      if (!a) return usage();
      return runDelete(resolve(a), Boolean(values.force));
    }
    case 'list': {
      const dir = resolve(a ?? '.');
      let files: string[];
      try {
        files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.seoproject'));
      } catch (err) {
        console.error(`Cannot read ${dir}: ${(err as Error).message}`);
        return 2;
      }
      const rows = files.map((f) => projectSummary(join(dir, f)));
      if (json) {
        process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
      } else if (rows.length === 0) {
        console.log(`No .seoproject files in ${dir}`);
      } else {
        for (const r of rows) {
          const crawl = r['crawl'] as { state: string } | undefined;
          console.log(
            `${basename(String(r['file']))}  ${r['name'] ? `"${r['name']}"  ` : ''}${r['urls'] != null ? `${r['urls']} URLs  ` : ''}${r['startUrl'] ? `${r['startUrl']}  ` : ''}${crawl ? `[${crawl.state}]` : ''}`,
          );
        }
      }
      return 0;
    }
    case 'info': {
      if (!a) return usage();
      const path = resolve(a);
      if (!existsSync(path)) {
        console.error(`Project not found: ${path}`);
        return 2;
      }
      process.stdout.write(JSON.stringify(projectSummary(path), null, 2) + '\n');
      return 0;
    }
    default:
      return usage();
  }
}
