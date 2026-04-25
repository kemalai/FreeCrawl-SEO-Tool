#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { DEFAULT_CRAWL_CONFIG } from '@freecrawl/shared-types';
import { Crawler, exportUrlsToCsv, exportUrlsToJson } from '@freecrawl/core';
import { ProjectDb } from '@freecrawl/db';

function help(): void {
  console.log(`freecrawl — headless SEO crawler

Usage:
  freecrawl <url> [options]

Options:
  --depth <n>         Max crawl depth (default: ${DEFAULT_CRAWL_CONFIG.maxDepth})
  --max <n>           Max URLs (default: ${DEFAULT_CRAWL_CONFIG.maxUrls})
  --concurrency <n>   Max parallel requests (default: ${DEFAULT_CRAWL_CONFIG.maxConcurrency})
  --rps <n>           Max requests per second (default: ${DEFAULT_CRAWL_CONFIG.maxRps})
  --user-agent <str>  Custom User-Agent string
  --no-robots         Ignore robots.txt
  --external          Follow external links
  --header <K: V>     Extra request header; repeatable (e.g. --header "Authorization: Bearer X")
  --include <regex>   Only crawl URLs matching this regex; repeatable
  --exclude <regex>   Skip URLs matching this regex; repeatable
  --list <file>       List-mode crawl: fetch every URL in <file> (one per line), no link follow
  --db <file>         SQLite project file (default: ./crawl.seoproject)
  --out <file>        Export results after crawl. Format auto-detected by extension:
                        *.json → full JSON dump (every captured field)
                        any other → CSV (subset of common columns)
  -h, --help          Show this help
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
      external: { type: 'boolean' },
      header: { type: 'string', multiple: true },
      include: { type: 'string', multiple: true },
      exclude: { type: 'string', multiple: true },
      list: { type: 'string' },
      db: { type: 'string' },
      out: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });

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

  const config = {
    ...DEFAULT_CRAWL_CONFIG,
    mode: listFile ? ('list' as const) : ('spider' as const),
    urlList: listUrls,
    startUrl,
    maxDepth: parseNumeric(values.depth, DEFAULT_CRAWL_CONFIG.maxDepth),
    maxUrls: parseNumeric(values.max, DEFAULT_CRAWL_CONFIG.maxUrls),
    maxConcurrency: parseNumeric(values.concurrency, DEFAULT_CRAWL_CONFIG.maxConcurrency),
    maxRps: parseNumeric(values.rps, DEFAULT_CRAWL_CONFIG.maxRps),
    userAgent: values['user-agent'] ?? DEFAULT_CRAWL_CONFIG.userAgent,
    respectRobotsTxt: !values['no-robots'],
    crawlExternal: Boolean(values.external),
    customHeaders: parseHeaders(values.header),
    includePatterns: values.include ?? [],
    excludePatterns: values.exclude ?? [],
  };

  const crawler = new Crawler(config, db);

  crawler.on('progress', (p) => {
    process.stdout.write(
      `\r[${p.crawled}/${p.discovered}] pending=${p.pending} failed=${p.failed} @ ${p.urlsPerSecond.toFixed(1)} URL/s  avg=${p.avgResponseTimeMs}ms  t=${Math.round(p.elapsedMs / 1000)}s   `,
    );
  });
  crawler.on('error', (msg) => {
    process.stderr.write(`\n[error] ${msg}\n`);
  });

  await crawler.start();
  process.stdout.write('\n');

  const summary = db.getSummary();
  console.log(`Done. Total=${summary.total}  Bytes=${summary.totalBytes}  AvgResp=${summary.avgResponseTimeMs}ms`);

  if (values.out) {
    const outPath = resolve(values.out);
    // Auto-detect format from extension. `.json` → full JSON dump, anything
    // else → CSV (existing behaviour).
    const isJson = outPath.toLowerCase().endsWith('.json');
    const { rowsWritten } = isJson
      ? await exportUrlsToJson(db, outPath, { pretty: true })
      : await exportUrlsToCsv(db, outPath);
    console.log(`Wrote ${rowsWritten} rows → ${outPath}`);
  }

  const hasErrors = Object.keys(summary.byStatus).some((k) => {
    const n = Number.parseInt(k, 10);
    return Number.isFinite(n) && n >= 400;
  });

  db.close();
  process.exit(hasErrors ? 1 : 0);
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

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.stack : err);
  process.exit(2);
});
