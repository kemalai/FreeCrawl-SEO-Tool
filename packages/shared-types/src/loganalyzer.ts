/**
 * V2 Faz 2 — Log File Analyzer.
 *
 * Shared IPC + domain types for the access-log analysis subsystem. The
 * parser/aggregation engine lives in `@freecrawl/core` (log-parser /
 * bot-detect / log-analyzer); persistence + cross-source joins live in
 * `@freecrawl/db`; the desktop main process drives ingestion and exposes
 * the query surface here over IPC. The standalone Log Analyzer window
 * (renderer `?loganalyzer=1`) and the CLI `analyze-logs` command both
 * consume these shapes.
 */

/** Supported access-log dialects. `nginx` shares Apache's combined grammar. */
export type LogFormat =
  | 'apache-combined'
  | 'apache-common'
  | 'nginx'
  | 'iis-w3c'
  | 'custom';

/** Format passed by the caller — `auto` lets the parser sniff the dialect. */
export type LogFormatChoice = LogFormat | 'auto';

export interface LogAnalyzeInput {
  /** Absolute log file path. Omitted → the main process opens a picker. */
  filePath?: string;
  /**
   * Absolute log file paths for a bulk import (each analyzed + ingested in
   * turn). Takes precedence over `filePath`. When both are omitted the main
   * process opens a multi-select picker.
   */
  filePaths?: string[];
  /** Dialect. Default `auto`. */
  format?: LogFormatChoice;
  /**
   * Named-group regex for `custom` format. Recognised groups:
   * `ip`, `ts`, `method`, `path`, `status`, `bytes`, `ua`, `referer`.
   */
  customRegex?: string;
  /**
   * Reverse-DNS verify a capped sample of IPs per declared search-engine
   * bot (Googlebot / Bingbot / YandexBot / …). Slower (DNS round-trips)
   * but catches spoofed user-agents.
   */
  verifyBots?: boolean;
}

/**
 * Plain (array-based) ingest payload handed to the DB layer. The core
 * analyzer produces Map-based aggregates; the desktop main process (which
 * sees both `core` and `db`) flattens them into this shape so the `db`
 * package stays free of any `core` dependency.
 */
export interface LogIngestInput {
  file: {
    filePath: string;
    fileName: string;
    format: LogFormat;
    totalLines: number;
    parsedLines: number;
    skippedLines: number;
    minTs: number | null;
    maxTs: number | null;
  };
  urlStats: Array<{
    path: string;
    totalHits: number;
    botHits: number;
    googlebotHits: number;
    bingbotHits: number;
    yandexbotHits: number;
    otherBotHits: number;
    lastStatus: number | null;
    firstTs: number | null;
    lastTs: number | null;
  }>;
  daily: Array<{ day: string; bucket: string; hits: number }>;
  status: Array<{ status: number; count: number; botCount: number }>;
  bots: Array<{
    bot: string;
    family: string;
    hits: number;
    totalIps: number;
    verifiedIps: number;
    verifiable: boolean;
  }>;
  /** Per-(path, bot) hit counts — backs the URL Hits per-bot filter. */
  urlBots: Array<{ path: string; bot: string; hits: number }>;
  /** Requests the threat classifier flagged (SQLi / XSS / scanner probes …),
   *  one row per log line — the only per-line data the analyzer keeps. */
  threats: LogThreatHit[];
  /** Flagged lines dropped once the per-file threat cap was reached. */
  threatsDropped?: number;
}

/** What a flagged request was trying to do. */
export type LogThreatCategory =
  | 'sqli'
  | 'xss'
  | 'traversal'
  | 'cmdi'
  | 'scanner'
  | 'sensitive-file'
  | 'anomaly';

/**
 * One access-log line the threat classifier flagged. Unlike every other
 * analyzer aggregate this is per-line: the point is to show the exact IP,
 * timestamp and decoded parameter payload, so nothing is rolled up.
 */
export interface LogThreatHit {
  /** Epoch ms, or null when the line's timestamp could not be parsed. */
  ts: number | null;
  ip: string | null;
  method: string | null;
  /** Request target exactly as logged (path + query, still percent-encoded). */
  path: string;
  /** Same target percent-decoded (up to two rounds) — the human-readable payload. */
  decoded: string;
  status: number | null;
  bytes: number | null;
  userAgent: string | null;
  referer: string | null;
  /** Declared bot name when the UA matched the bot library, else null. */
  bot: string | null;
  /** Category of the strongest matching rule. */
  category: LogThreatCategory;
  /** Ids of every rule that matched, strongest first. */
  rules: string[];
  /** Sum of matched rule weights — higher = more certain. */
  score: number;
  /** The decoded fragment the strongest rule matched — what to highlight. */
  evidence: string;
  /**
   * Set when reverse-DNS verification ran and the IP belongs to a search
   * engine's own infrastructure (`google` / `bing` / `yandex` / `apple`).
   * Such a payload was relayed through the engine (Lens, Translate, a
   * fetch of a crafted URL) — blocking the IP would block the engine.
   */
  ipOwner: string | null;
}

/** A persisted flagged request — `LogThreatHit` plus its row id and the
 *  crawl join. */
export interface LogThreatRow extends LogThreatHit {
  id: number;
  /** True when the target's path (query stripped) is a crawled internal URL. */
  targetInCrawl: boolean;
}

export interface LogThreatsInput {
  limit: number;
  offset: number;
  /** Substring match over the decoded target, IP and user-agent. */
  search?: string;
  category?: LogThreatCategory | 'all';
  /** Exact IP filter (drill-down from the IP panel). */
  ip?: string;
  /** Response class of the flagged request; `2xx` = the payload was served. */
  status?: 'all' | '2xx' | '3xx' | '4xx' | '5xx';
  sortBy?: 'ts' | 'score' | 'status';
}

export interface LogThreatsResult {
  rows: LogThreatRow[];
  total: number;
}

export interface LogThreatIpRow {
  ip: string;
  hits: number;
  /** Distinct categories this IP was flagged under. */
  categories: LogThreatCategory[];
  firstTs: number | null;
  lastTs: number | null;
  /** How many of its flagged requests were answered 2xx. */
  servedHits: number;
  /** Declared bot name seen on this IP's flagged requests (first wins). */
  bot: string | null;
  ipOwner: string | null;
}

/** Roll-up the Suspicious Requests tab shows above its table. */
export interface LogThreatSummary {
  totalHits: number;
  distinctIps: number;
  /** Flagged requests the server answered 2xx — the ones that matter. */
  servedHits: number;
  byCategory: Array<{ category: LogThreatCategory; hits: number; ips: number }>;
  topIps: LogThreatIpRow[];
  /** True when at least one ingest hit the per-file threat cap. */
  capHit: boolean;
}

/** One ingested file's metadata — mirrors a `log_ingests` row. */
export interface LogImportSummary {
  filePath: string;
  fileName: string;
  format: LogFormat;
  totalLines: number;
  parsedLines: number;
  skippedLines: number;
  /** Epoch ms of the earliest / latest parsed entry. */
  minTs: number | null;
  maxTs: number | null;
  ingestedAt: string;
}

export interface LogAnalyzeResult {
  ok: boolean;
  error?: string;
  /**
   * Single-file convenience: the first file successfully ingested in this
   * call. Null when the user cancelled the picker or nothing was ingested.
   */
  imported: LogImportSummary | null;
  /** Every file ingested in this (possibly bulk) call. */
  batch?: LogImportSummary[];
  /** Per-file failures that did not abort the rest of the batch. */
  errors?: Array<{ fileName: string; error: string }>;
  overview: LogOverview | null;
}

/** Top-level roll-up across every ingested log file in the project. */
export interface LogOverview {
  hasData: boolean;
  files: LogImportSummary[];
  totalHits: number;
  botHits: number;
  humanHits: number;
  /** Hits attributed to reverse-DNS-verified bot IPs. */
  verifiedBotHits: number;
  distinctUrls: number;
  minTs: number | null;
  maxTs: number | null;
  /** Requests the threat classifier flagged, and how many IPs sent them. */
  threatHits: number;
  threatIps: number;
}

/** One URL's aggregated log activity (item 6 — bot hits per URL). */
export interface LogUrlStatRow {
  path: string;
  totalHits: number;
  botHits: number;
  googlebotHits: number;
  bingbotHits: number;
  yandexbotHits: number;
  otherBotHits: number;
  lastStatus: number | null;
  lastHitAt: number | null;
  /** True when a crawled URL shares this path (crawl × log join). */
  inCrawl: boolean;
}

export interface LogUrlStatsInput {
  limit: number;
  offset: number;
  search?: string;
  sortBy?: 'totalHits' | 'botHits' | 'googlebotHits' | 'lastHitAt';
  /** `orphans` = seen in the log but NOT crawled; `crawled` = the inverse. */
  filter?: 'all' | 'bots' | 'orphans' | 'crawled';
  /** Restrict to URLs a specific named bot hit (e.g. "SemrushBot").
   *  Composes with `search` / `filter`. */
  bot?: string;
}

export interface LogUrlStatsResult {
  rows: LogUrlStatRow[];
  total: number;
}

/** Per-bot roll-up (item 5 — bot detection + IP verification). */
export interface LogBotRow {
  bot: string;
  family: string;
  hits: number;
  /** Distinct IPs seen claiming this bot. */
  totalIps: number;
  /** Of those, how many reverse-DNS-verified (0 when verification was off). */
  verifiedIps: number;
  verifiable: boolean;
}

/** Response-code distribution from the log (item 8 — separate from crawl). */
export interface LogStatusRow {
  status: number;
  count: number;
  botCount: number;
}

/** One time-trend bucket (item 10 — daily bot-hit trend). */
export interface LogTrendRow {
  /** `YYYY-MM-DD` (UTC). */
  day: string;
  /** Bot family label (`googlebot` / `bingbot` / …) or `human`. */
  bucket: string;
  hits: number;
}

/** Crawl budget — crawled URLs ranked by how often Googlebot hit them. */
export interface LogCrawlBudgetRow {
  url: string;
  path: string;
  googlebotHits: number;
  botHits: number;
  totalHits: number;
  statusCode: number | null;
  indexability: string | null;
  depth: number | null;
}

/** Orphan candidate — bot-hit in the log but never reached by the crawl. */
export interface LogOrphanRow {
  path: string;
  totalHits: number;
  botHits: number;
  lastStatus: number | null;
}

/** A log path eligible to be seeded into a crawl (item 12). */
export interface LogDiscoveryRow {
  path: string;
  totalHits: number;
  botHits: number;
}

export interface LogSeedDiscoveryResult {
  /** Full URLs handed to the active crawler. */
  enqueued: number;
  /** True when a crawl was running and accepted the seeds. */
  hasActiveCrawl: boolean;
  /** Set when nothing could be seeded (no base origin / no active crawl). */
  reason?: string;
}

export interface LogExportInput {
  /** `xlsx` = one workbook, one sheet per table; `csv` = one file, all
   *  tables stacked under `# <Table>` banners. */
  format: 'csv' | 'xlsx';
  /** Optional pre-resolved output path (skips the save dialog). */
  filePath?: string;
}

export interface LogExportResult {
  /** Empty when the user cancelled the save dialog. */
  filePath: string;
  bytesWritten: number;
}
