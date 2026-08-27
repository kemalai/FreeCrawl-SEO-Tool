/**
 * V2 Faz 2 — access-log aggregation engine.
 *
 * Streams a log file line-by-line (memory-bounded — never holds the whole
 * file), parses each line via {@link createLogParser}, classifies the
 * user-agent via {@link detectBot}, and rolls everything up into the
 * compact aggregate maps the DB layer persists. Optionally reverse-DNS
 * verifies a capped sample of search-engine bot IPs.
 *
 * Aggregates produced (each maps to a Faz 2 feature):
 *   - urlStats   : per-URL hit + per-bot-family counts (items 6, 7, 11)
 *   - status     : response-code distribution from the log (item 8)
 *   - daily      : per-day, per-bot-family hit trend (item 10)
 *   - bots       : per-bot hit + distinct-IP + verified-IP counts (item 5)
 *   - threats    : per-line rows for requests the threat classifier
 *                  flagged (SQLi / XSS / scanner probes …) — the one
 *                  place the analyzer keeps IP + full target, capped
 */

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import type { Readable } from 'node:stream';
import { createGunzip } from 'node:zlib';
import type { LogFormat, LogFormatChoice, LogThreatHit } from '@freecrawl/shared-types';
import {
  createLogParser,
  detectLogFormat,
  DIRECTIVE,
  type ParsedLogLine,
} from './log-parser.js';
import { detectBot, verifyBotByRdns, type BotFamily } from './bot-detect.js';
import { classifyIpOwner, classifyRequest } from './log-threats.js';

export interface LogUrlStat {
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
  /** Per-named-bot hit counts on this path (e.g. "SemrushBot" → 13).
   *  Backs the URL Hits tab's per-bot filter. */
  botCounts: Map<string, number>;
}

export interface LogBotAgg {
  family: BotFamily;
  verifiable: boolean;
  /** Official rDNS suffixes (empty when not verifiable). */
  rdnsSuffixes: string[];
  hits: number;
  /** Distinct IPs seen (capped). */
  ips: Set<string>;
  /** rDNS-verified distinct IPs (0 unless verification ran). */
  verifiedIps: number;
}

export interface LogAnalysisResult {
  format: LogFormat;
  totalLines: number;
  parsedLines: number;
  skippedLines: number;
  minTs: number | null;
  maxTs: number | null;
  urlStats: Map<string, LogUrlStat>;
  /** key = `${YYYY-MM-DD}\t${family|human}` (tab-separated) → hit count. */
  daily: Map<string, number>;
  status: Map<number, { count: number; botCount: number }>;
  bots: Map<string, LogBotAgg>;
  /** True when the distinct-URL cap was reached and new URLs were dropped. */
  urlCapHit: boolean;
  /** Requests the threat classifier flagged, in file order. */
  threats: LogThreatHit[];
  /** Flagged lines dropped after `maxThreatRows` was reached. */
  threatsDropped: number;
}

export interface LogAnalyzeOptions {
  format?: LogFormatChoice;
  customRegex?: string;
  /** Reverse-DNS verify sampled bot IPs — and, for flagged requests, whether
   *  the sender is a search engine's own infrastructure. */
  verifyBots?: boolean;
  /** Distinct-URL cap to bound memory on pathological logs. Default 500k. */
  maxDistinctUrls?: number;
  /** Per-bot distinct-IP sample cap (also the verification cap). Default 200. */
  maxIpsPerBot?: number;
  /** Cap on flagged-request rows kept per file. Default 50k. */
  maxThreatRows?: number;
}

const DEFAULT_MAX_URLS = 500_000;
const DEFAULT_MAX_IPS = 200;
const DEFAULT_MAX_THREATS = 50_000;

/**
 * Open a log file as a UTF-8 text stream, transparently decompressing
 * `.gz` files on the fly. Access logs are very commonly shipped gzipped
 * (`access_log-Jul-2026.gz`); without this the raw DEFLATE bytes would be
 * decoded as text and every line would fail to parse (0 lines accepted).
 *
 * Errors on the underlying file read are forwarded onto the returned
 * stream so the `for await` consumer rejects instead of hanging, and a
 * corrupt gzip surfaces as a stream error caught by the caller.
 */
function openLogStream(filePath: string): Readable {
  if (/\.gz$/i.test(filePath)) {
    const source = createReadStream(filePath);
    const gunzip = createGunzip();
    source.on('error', (err) => gunzip.destroy(err));
    source.pipe(gunzip);
    gunzip.setEncoding('utf8');
    return gunzip;
  }
  return createReadStream(filePath, { encoding: 'utf8' });
}

function emptyResult(format: LogFormat): LogAnalysisResult {
  return {
    format,
    totalLines: 0,
    parsedLines: 0,
    skippedLines: 0,
    minTs: null,
    maxTs: null,
    urlStats: new Map(),
    daily: new Map(),
    status: new Map(),
    bots: new Map(),
    urlCapHit: false,
    threats: [],
    threatsDropped: 0,
  };
}

/**
 * Analyze a log file from disk. Streams line-by-line so a multi-GB log
 * never has to fit in memory. When `format` is `auto` (default), the
 * first ~50 non-blank lines are sniffed to pick the dialect.
 */
export async function analyzeLogFile(
  filePath: string,
  opts: LogAnalyzeOptions = {},
): Promise<LogAnalysisResult> {
  const chosen = opts.format ?? 'auto';
  let format: LogFormat;
  if (chosen === 'auto') {
    format = await sniffFormat(filePath);
  } else {
    format = chosen;
  }

  const parser = createLogParser({ format, customRegex: opts.customRegex });
  const result = emptyResult(format);
  const maxUrls = opts.maxDistinctUrls ?? DEFAULT_MAX_URLS;
  const maxIps = opts.maxIpsPerBot ?? DEFAULT_MAX_IPS;
  const maxThreats = opts.maxThreatRows ?? DEFAULT_MAX_THREATS;

  const rl = createInterface({
    input: openLogStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.trim() === '') continue;
    result.totalLines++;
    const parsed = parser.feed(line);
    if (parsed === DIRECTIVE) {
      result.totalLines--; // header/comment lines don't count as hits
      continue;
    }
    if (parsed === null) {
      result.skippedLines++;
      continue;
    }
    result.parsedLines++;
    accumulate(result, parsed, maxUrls, maxIps, maxThreats);
  }

  if (opts.verifyBots) {
    await verifyBots(result, maxIps);
    await verifyThreatIps(result, maxIps);
  }
  return result;
}

async function sniffFormat(filePath: string): Promise<LogFormat> {
  const sample: string[] = [];
  const input = openLogStream(filePath);
  const rl = createInterface({ input, crlfDelay: Infinity });
  for await (const line of rl) {
    sample.push(line);
    if (sample.length >= 50) break;
  }
  rl.close();
  // Break-early stops readline but leaves the file/gunzip stream open;
  // destroy it so we don't leak a descriptor (and a paused gunzip) per sniff.
  input.destroy();
  return detectLogFormat(sample);
}

function accumulate(
  result: LogAnalysisResult,
  p: ParsedLogLine,
  maxUrls: number,
  maxIps: number,
  maxThreats: number,
): void {
  const bot = detectBot(p.userAgent);
  const isBot = bot !== null;

  // Threat classification — the only per-line data kept. Runs before the
  // URL cap check below so a scanner burst of unique targets (each one a
  // new "URL") is still recorded once the URL aggregate is full.
  const threat = classifyRequest(p);
  if (threat) {
    if (result.threats.length >= maxThreats) {
      result.threatsDropped++;
    } else {
      result.threats.push({
        ts: p.ts,
        ip: p.ip,
        method: p.method,
        path: p.path!,
        decoded: threat.decoded,
        status: p.status,
        bytes: p.bytes,
        userAgent: p.userAgent,
        referer: p.referer,
        bot: bot ? bot.name : null,
        category: threat.category,
        rules: threat.rules,
        score: threat.score,
        evidence: threat.evidence,
        ipOwner: null,
      });
    }
  }

  // Timestamp bounds + daily trend.
  if (p.ts !== null) {
    if (result.minTs === null || p.ts < result.minTs) result.minTs = p.ts;
    if (result.maxTs === null || p.ts > result.maxTs) result.maxTs = p.ts;
    const day = new Date(p.ts).toISOString().slice(0, 10);
    const bucket = isBot ? bot!.family : 'human';
    const key = `${day}\t${bucket}`;
    result.daily.set(key, (result.daily.get(key) ?? 0) + 1);
  }

  // Status distribution.
  if (p.status !== null) {
    const s = result.status.get(p.status) ?? { count: 0, botCount: 0 };
    s.count++;
    if (isBot) s.botCount++;
    result.status.set(p.status, s);
  }

  // Per-bot roll-up.
  if (bot) {
    let agg = result.bots.get(bot.name);
    if (!agg) {
      agg = {
        family: bot.family,
        verifiable: bot.rdnsSuffixes.length > 0,
        rdnsSuffixes: bot.rdnsSuffixes,
        hits: 0,
        ips: new Set(),
        verifiedIps: 0,
      };
      result.bots.set(bot.name, agg);
    }
    agg.hits++;
    if (p.ip && agg.ips.size < maxIps) agg.ips.add(p.ip);
  }

  // Per-URL roll-up.
  if (p.path) {
    let stat = result.urlStats.get(p.path);
    if (!stat) {
      if (result.urlStats.size >= maxUrls) {
        result.urlCapHit = true;
        return;
      }
      stat = {
        path: p.path,
        totalHits: 0,
        botHits: 0,
        googlebotHits: 0,
        bingbotHits: 0,
        yandexbotHits: 0,
        otherBotHits: 0,
        lastStatus: null,
        firstTs: null,
        lastTs: null,
        botCounts: new Map(),
      };
      result.urlStats.set(p.path, stat);
    }
    stat.totalHits++;
    if (isBot) {
      stat.botHits++;
      if (bot!.family === 'googlebot') stat.googlebotHits++;
      else if (bot!.family === 'bingbot') stat.bingbotHits++;
      else if (bot!.family === 'yandexbot') stat.yandexbotHits++;
      else stat.otherBotHits++;
      stat.botCounts.set(bot!.name, (stat.botCounts.get(bot!.name) ?? 0) + 1);
    }
    if (p.status !== null) stat.lastStatus = p.status;
    if (p.ts !== null) {
      if (stat.firstTs === null || p.ts < stat.firstTs) stat.firstTs = p.ts;
      if (stat.lastTs === null || p.ts > stat.lastTs) stat.lastTs = p.ts;
    }
  }
}

/**
 * Reverse-DNS verify the sampled IPs of every rDNS-verifiable bot. Runs a
 * bounded number of DNS round-trips in parallel; sets `verifiedIps` on
 * each bot aggregate.
 */
async function verifyBots(result: LogAnalysisResult, maxIps: number): Promise<void> {
  for (const agg of result.bots.values()) {
    if (!agg.verifiable || agg.ips.size === 0) continue;
    const ips = Array.from(agg.ips).slice(0, maxIps);
    const verified = await mapLimit(ips, 8, (ip) =>
      verifyBotByRdns(ip, agg.rdnsSuffixes),
    );
    agg.verifiedIps = verified.filter(Boolean).length;
  }
}

/**
 * Reverse-DNS the senders of flagged requests (distinct IPs, capped) and
 * mark the ones that are a search engine's own infrastructure. That is
 * the difference between "block this IP" and "this payload was relayed
 * through Google — fix the application instead".
 */
async function verifyThreatIps(result: LogAnalysisResult, maxIps: number): Promise<void> {
  const ips = new Set<string>();
  for (const t of result.threats) {
    if (t.ip) ips.add(t.ip);
    if (ips.size >= maxIps) break;
  }
  if (ips.size === 0) return;
  const list = Array.from(ips);
  const owners = await mapLimit(list, 8, (ip) => classifyIpOwner(ip));
  const byIp = new Map<string, string | null>();
  list.forEach((ip, i) => byIp.set(ip, owners[i] ?? null));
  for (const t of result.threats) {
    if (t.ip) t.ipOwner = byIp.get(t.ip) ?? null;
  }
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]!);
    }
  });
  await Promise.all(workers);
  return out;
}
