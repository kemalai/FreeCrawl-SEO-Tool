/**
 * V2 Faz 2 — Log Analyzer "export everything" builder.
 *
 * Gathers the seven analyzer tables (the same data the standalone window
 * renders) into either a single multi-sheet XLSX workbook or a single
 * concatenated CSV (one section per table). The column layout mirrors the
 * UI tables so the export reads the same as what's on screen.
 */

import type {
  LogBotRow,
  LogCrawlBudgetRow,
  LogDiscoveryRow,
  LogOverview,
  LogStatusRow,
  LogTrendRow,
  LogUrlStatRow,
} from '@freecrawl/shared-types';
import {
  buildCsvTable,
  buildXlsx,
  type SheetColumn,
  type SheetSpec,
} from './spreadsheet.js';

export interface LogExportTables {
  overview: LogOverview;
  urlStats: LogUrlStatRow[];
  orphans: LogUrlStatRow[];
  bots: LogBotRow[];
  status: LogStatusRow[];
  trend: LogTrendRow[];
  crawlBudget: LogCrawlBudgetRow[];
  discovery: LogDiscoveryRow[];
}

interface Section {
  name: string;
  columns: SheetColumn[];
  rows: Array<Record<string, unknown>>;
}

function fmtTs(ts: number | null): string {
  if (ts === null) return '';
  try {
    return new Date(ts).toISOString().replace('T', ' ').slice(0, 16);
  } catch {
    return '';
  }
}

/** Pivot raw (day, bucket, hits) trend rows into per-day columns. */
function pivotTrend(trend: LogTrendRow[]): Array<Record<string, unknown>> {
  const map = new Map<
    string,
    { day: string; total: number; googlebot: number; bingbot: number; yandexbot: number; otherBot: number; human: number }
  >();
  for (const r of trend) {
    const d =
      map.get(r.day) ??
      { day: r.day, total: 0, googlebot: 0, bingbot: 0, yandexbot: 0, otherBot: 0, human: 0 };
    d.total += r.hits;
    if (r.bucket === 'googlebot') d.googlebot += r.hits;
    else if (r.bucket === 'bingbot') d.bingbot += r.hits;
    else if (r.bucket === 'yandexbot') d.yandexbot += r.hits;
    else if (r.bucket === 'human') d.human += r.hits;
    else d.otherBot += r.hits;
    map.set(r.day, d);
  }
  return Array.from(map.values());
}

function buildSections(tables: LogExportTables): Section[] {
  const { overview } = tables;
  return [
    {
      name: 'Summary',
      columns: [
        { key: 'metric', label: 'Metric' },
        { key: 'value', label: 'Value' },
      ],
      rows: [
        { metric: 'Total Hits', value: overview.totalHits },
        { metric: 'Bot Hits', value: overview.botHits },
        { metric: 'Human Hits', value: overview.humanHits },
        { metric: 'Verified Bot Hits', value: overview.verifiedBotHits },
        { metric: 'Distinct URLs', value: overview.distinctUrls },
        { metric: 'Date Range Start', value: fmtTs(overview.minTs) },
        { metric: 'Date Range End', value: fmtTs(overview.maxTs) },
        { metric: 'Files Ingested', value: overview.files.map((f) => f.fileName).join('; ') },
      ],
    },
    {
      name: 'URL Hits',
      columns: [
        { key: 'path', label: 'Path' },
        { key: 'totalHits', label: 'Total' },
        { key: 'botHits', label: 'Bots' },
        { key: 'googlebotHits', label: 'Googlebot' },
        { key: 'bingbotHits', label: 'Bingbot' },
        { key: 'yandexbotHits', label: 'Yandex' },
        { key: 'lastStatus', label: 'Status' },
        { key: 'lastHit', label: 'Last Hit' },
        { key: 'inCrawl', label: 'In Crawl' },
      ],
      rows: tables.urlStats.map((r) => ({
        ...r,
        lastHit: fmtTs(r.lastHitAt),
        inCrawl: r.inCrawl ? 'crawled' : 'orphan',
      })),
    },
    {
      name: 'Bots',
      columns: [
        { key: 'bot', label: 'Bot' },
        { key: 'family', label: 'Family' },
        { key: 'hits', label: 'Hits' },
        { key: 'totalIps', label: 'IPs' },
        { key: 'verifiedIps', label: 'Verified IPs' },
        { key: 'verifiable', label: 'Verifiable' },
      ],
      rows: tables.bots.map((b) => ({ ...b, verifiable: b.verifiable ? 'yes' : 'no' })),
    },
    {
      name: 'Status Codes',
      columns: [
        { key: 'status', label: 'Status' },
        { key: 'count', label: 'Count' },
        { key: 'botCount', label: 'Bot Count' },
      ],
      rows: tables.status.map((s) => ({ ...s })),
    },
    {
      name: 'Trend',
      columns: [
        { key: 'day', label: 'Day' },
        { key: 'total', label: 'Total' },
        { key: 'googlebot', label: 'Googlebot' },
        { key: 'bingbot', label: 'Bingbot' },
        { key: 'yandexbot', label: 'Yandex' },
        { key: 'otherBot', label: 'Other Bots' },
        { key: 'human', label: 'Human' },
      ],
      rows: pivotTrend(tables.trend),
    },
    {
      name: 'Crawl Budget',
      columns: [
        { key: 'url', label: 'URL' },
        { key: 'googlebotHits', label: 'Googlebot' },
        { key: 'botHits', label: 'Bots' },
        { key: 'totalHits', label: 'Total' },
        { key: 'statusCode', label: 'Status' },
        { key: 'indexability', label: 'Indexability' },
        { key: 'depth', label: 'Depth' },
      ],
      rows: tables.crawlBudget.map((r) => ({ ...r })),
    },
    {
      name: 'Orphans',
      columns: [
        { key: 'path', label: 'Path' },
        { key: 'totalHits', label: 'Total' },
        { key: 'botHits', label: 'Bots' },
        { key: 'lastStatus', label: 'Status' },
        { key: 'lastHit', label: 'Last Hit' },
      ],
      rows: tables.orphans.map((r) => ({ ...r, lastHit: fmtTs(r.lastHitAt) })),
    },
    {
      name: 'Discovery',
      columns: [
        { key: 'path', label: 'Path' },
        { key: 'botHits', label: 'Bots' },
        { key: 'totalHits', label: 'Total' },
      ],
      rows: tables.discovery.map((r) => ({ ...r })),
    },
  ];
}

/** Build a multi-sheet XLSX workbook with one sheet per analyzer table. */
export function buildLogExportXlsx(tables: LogExportTables): Buffer {
  const sections = buildSections(tables);
  const sheets: SheetSpec[] = sections.map((s) => ({
    name: s.name,
    columns: s.columns,
    rows: s.rows,
  }));
  return buildXlsx(sheets);
}

/**
 * Build a single CSV holding every table, each under a `# <Table>`
 * banner. Prefixed with a UTF-8 BOM so Excel-for-Windows opens it in the
 * right charset.
 */
export function buildLogExportCsv(tables: LogExportTables): string {
  const sections = buildSections(tables);
  const blocks = sections.map(
    (s) => `# ${s.name}\n${buildCsvTable(s.columns, s.rows)}`,
  );
  return '﻿' + blocks.join('\n\n') + '\n';
}
