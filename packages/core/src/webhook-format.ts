/**
 * Chat-ready webhook bodies. The crawl webhooks used to POST one raw JSON
 * document, which Zapier / Make / n8n read happily but Slack, Discord and
 * Microsoft Teams reject outright — each wants its own message shape
 * (`text` / `blocks`, `embeds`, an Adaptive Card). This module turns a
 * provider-neutral {@link WebhookNotice} into each of those, and builds
 * the notices for the two webhooks FreeCrawl sends: crawl finished, and
 * scheduled crawl finished (export + changes since the previous crawl).
 *
 * Message text is English, like the CLI's output and the CSV headers: the
 * crawl-finished webhook is sent from the shared core, where no UI
 * language exists.
 */
import {
  ISSUE_GROUPS,
  issueCount,
  type CrawlSummary,
  type OverviewCounts,
  type PreviousCrawlComparison,
  type WebhookFormat,
} from '@freecrawl/shared-types';
import { COMPARE_CATEGORY_LABELS } from './compare.js';

export type ResolvedWebhookFormat = Exclude<WebhookFormat, 'auto'>;

/** A message in neutral form; each chat service gets its own rendering. */
export interface WebhookNotice {
  /** One-line headline, plain text. */
  title: string;
  /** Link the message points at (the crawled site). */
  url?: string;
  /** Short label / value pairs: pages crawled, 4xx, duration … */
  facts: { label: string; value: string }[];
  /** Titled bullet lists: top issues, changes, problems. */
  sections: { title: string; lines: string[] }[];
  /** Colours the Discord embed and the Teams headline. */
  tone: 'good' | 'warning' | 'bad';
}

/**
 * The body format for `url`. An explicit choice wins; `auto` recognises
 * Slack incoming webhooks (`hooks.slack.com/services/…` — not Workflow
 * Builder triggers, which expect their own variables), Discord webhooks
 * (and their `/slack` compatibility endpoint) and Teams connector URLs
 * (`*.webhook.office.com`). Everything else — including Power Automate /
 * Workflows URLs, which may front any flow — gets the raw JSON.
 */
export function resolveWebhookFormat(url: string, format: WebhookFormat | undefined): ResolvedWebhookFormat {
  if (format && format !== 'auto') return format;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return 'json';
  }
  const host = u.hostname.toLowerCase();
  const path = u.pathname;
  if (host === 'hooks.slack.com' && path.startsWith('/services/')) return 'slack';
  if (/^(?:(?:ptb|canary)\.)?discord(?:app)?\.com$/.test(host) && path.startsWith('/api/webhooks/')) {
    if (/\/slack\/?$/.test(path)) return 'slack';
    if (/\/github\/?$/.test(path)) return 'json';
    return 'discord';
  }
  if (host.endsWith('.webhook.office.com')) return 'teams';
  return 'json';
}

const clip = (s: string, max: number): string => (s.length <= max ? s : s.slice(0, max - 1) + '…');
const fmt = (n: number): string => n.toLocaleString('en-US');

/** Slack mrkdwn needs only these three escaped. */
const slackEscape = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const BACKSLASH = String.fromCharCode(92);
/** Discord markdown would turn `_a_` in a URL or label into italics. */
const discordEscape = (s: string): string => s.replace(/[*_~`|]/g, (c) => BACKSLASH + c);

function renderSlack(n: WebhookNotice): Record<string, unknown> {
  const blocks: Record<string, unknown>[] = [
    { type: 'header', text: { type: 'plain_text', text: clip(n.title, 150), emoji: true } },
  ];
  if (n.url) {
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: clip(`<${n.url}|${slackEscape(n.url)}>`, 3000) }],
    });
  }
  if (n.facts.length > 0) {
    blocks.push({
      type: 'section',
      fields: n.facts.slice(0, 10).map((f) => ({
        type: 'mrkdwn',
        text: clip(`*${slackEscape(f.label)}*\n${slackEscape(f.value || '—')}`, 2000),
      })),
    });
  }
  for (const s of n.sections.slice(0, 40)) {
    if (s.lines.length === 0) continue;
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: clip(`*${slackEscape(s.title)}*\n${s.lines.map((l) => `• ${slackEscape(l)}`).join('\n')}`, 3000),
      },
    });
  }
  // `text` is the notification / fallback line Slack shows where blocks
  // can't render (push notifications, some clients).
  const fallback = [n.title, ...n.facts.map((f) => `${f.label}: ${f.value}`)].join(' · ');
  return { text: clip(fallback, 3000), blocks };
}

const DISCORD_COLOR = { good: 0x30a46c, warning: 0xf5a524, bad: 0xe5484d } as const;

function renderDiscord(n: WebhookNotice): Record<string, unknown> {
  const fields: { name: string; value: string; inline: boolean }[] = n.facts
    .slice(0, 15)
    .map((f) => ({ name: clip(f.label, 256), value: clip(discordEscape(f.value || '—'), 1024), inline: true }));
  for (const s of n.sections) {
    if (s.lines.length === 0 || fields.length >= 25) continue;
    fields.push({
      name: clip(s.title, 256),
      value: clip(s.lines.map((l) => `• ${discordEscape(l)}`).join('\n'), 1024),
      inline: false,
    });
  }
  // Discord rejects an embed over 6000 characters in total: drop trailing
  // sections until it fits rather than losing the whole message.
  const size = (): number => n.title.length + fields.reduce((a, f) => a + f.name.length + f.value.length, 0);
  while (fields.length > 1 && size() > 5800) fields.pop();
  const embed: Record<string, unknown> = {
    title: clip(n.title, 256),
    color: DISCORD_COLOR[n.tone],
    fields,
    timestamp: new Date().toISOString(),
    footer: { text: 'FreeCrawl SEO' },
  };
  if (n.url && /^https?:\/\//i.test(n.url)) embed['url'] = n.url;
  return { username: 'FreeCrawl SEO', embeds: [embed] };
}

const TEAMS_COLOR = { good: 'Good', warning: 'Warning', bad: 'Attention' } as const;

function renderTeams(n: WebhookNotice): Record<string, unknown> {
  const body: Record<string, unknown>[] = [
    {
      type: 'TextBlock',
      text: n.title,
      weight: 'Bolder',
      size: 'Medium',
      color: TEAMS_COLOR[n.tone],
      wrap: true,
    },
  ];
  if (n.url) {
    body.push({ type: 'TextBlock', text: n.url, isSubtle: true, spacing: 'None', wrap: true });
  }
  if (n.facts.length > 0) {
    body.push({ type: 'FactSet', facts: n.facts.map((f) => ({ title: f.label, value: f.value || '—' })) });
  }
  for (const s of n.sections) {
    if (s.lines.length === 0) continue;
    body.push({ type: 'TextBlock', text: s.title, weight: 'Bolder', spacing: 'Medium', wrap: true });
    body.push({ type: 'TextBlock', text: s.lines.map((l) => `- ${l}`).join('\n'), wrap: true, spacing: 'Small' });
  }
  const card: Record<string, unknown> = {
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.4',
    msteams: { width: 'Full' },
    body,
  };
  if (n.url && /^https?:\/\//i.test(n.url)) {
    card['actions'] = [{ type: 'Action.OpenUrl', title: 'Open site', url: n.url }];
  }
  // The envelope both Teams Workflows ("Post to a channel when a webhook
  // request is received") and the older connector webhooks accept.
  return {
    type: 'message',
    attachments: [
      { contentType: 'application/vnd.microsoft.card.adaptive', contentUrl: null, content: card },
    ],
  };
}

/** The POST body for a chat service. */
export function renderWebhookBody(
  format: Exclude<ResolvedWebhookFormat, 'json'>,
  notice: WebhookNotice,
): Record<string, unknown> {
  switch (format) {
    case 'slack':
      return renderSlack(notice);
    case 'discord':
      return renderDiscord(notice);
    case 'teams':
      return renderTeams(notice);
  }
}

// ── Notice builders ──────────────────────────────────────────────────

function statusMix(summary: CrawlSummary): { s2: number; s3: number; s4: number; s5: number; none: number } {
  // "No response" is a request that got no answer — the same rows the
  // Response Codes › No Response filter lists. A missing status alone also
  // covers robots-blocked URLs, skipped private addresses and outlinks
  // nobody requested, and turned a healthy crawl's message red.
  const mix = { s2: 0, s3: 0, s4: 0, s5: 0, none: summary.byIndexability?.['non-indexable:no-response'] ?? 0 };
  for (const [code, count] of Object.entries(summary.byStatus)) {
    const c = Number.parseInt(code, 10);
    if (!Number.isFinite(c) || c < 100) continue;
    if (c < 300) mix.s2 += count;
    else if (c < 400) mix.s3 += count;
    else if (c < 500) mix.s4 += count;
    else mix.s5 += count;
  }
  return mix;
}

function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** "Page Titles › Missing: 12", busiest checks first. Disabled checks are
 *  already zeroed in the overview counts, so they never appear. */
export function topIssueLines(issues: OverviewCounts['issues'], limit: number): string[] {
  const rows: { line: string; count: number }[] = [];
  for (const group of ISSUE_GROUPS) {
    for (const def of group.items) {
      const count = issueCount(issues, def) ?? 0;
      if (count > 0) rows.push({ line: `${group.label} › ${def.label}: ${fmt(count)}`, count });
    }
  }
  rows.sort((a, b) => b.count - a.count);
  return rows.slice(0, limit).map((r) => r.line);
}

function statusFacts(summary: CrawlSummary): { facts: WebhookNotice['facts']; tone: WebhookNotice['tone'] } {
  const mix = statusMix(summary);
  const facts: WebhookNotice['facts'] = [{ label: 'Pages crawled', value: fmt(summary.total) }];
  facts.push({ label: '2xx', value: fmt(mix.s2) });
  if (mix.s3 > 0) facts.push({ label: '3xx', value: fmt(mix.s3) });
  facts.push({ label: '4xx', value: fmt(mix.s4) });
  facts.push({ label: '5xx', value: fmt(mix.s5) });
  if (mix.none > 0) facts.push({ label: 'No response', value: fmt(mix.none) });
  const tone: WebhookNotice['tone'] = mix.s5 > 0 || mix.none > 0 ? 'bad' : mix.s4 > 0 ? 'warning' : 'good';
  return { facts, tone };
}

/** The crawl-finished webhook (every crawl, desktop and CLI). */
export function buildCrawlCompleteNotice(input: {
  startUrl: string;
  durationMs: number;
  summary: CrawlSummary;
  issues: OverviewCounts['issues'];
}): WebhookNotice {
  const { facts, tone } = statusFacts(input.summary);
  facts.push({ label: 'Duration', value: formatDuration(input.durationMs) });
  facts.push({ label: 'Avg response', value: `${fmt(input.summary.avgResponseTimeMs)} ms` });
  const top = topIssueLines(input.issues, 10);
  return {
    title: `Crawl finished: ${hostOf(input.startUrl)}`,
    url: input.startUrl || undefined,
    facts,
    sections: top.length > 0 ? [{ title: 'Top issues', lines: top }] : [],
    tone,
  };
}

/** Lines describing what changed since the previous crawl. */
export function comparisonLines(comparison: PreviousCrawlComparison): {
  pages: string[];
  issues: string[];
} {
  const pages = (Object.keys(comparison.counts) as (keyof typeof comparison.counts)[])
    .filter((k) => comparison.counts[k] > 0)
    .map((k) => `${COMPARE_CATEGORY_LABELS[k]}: ${fmt(comparison.counts[k])}`);
  const issues = comparison.issues.slice(0, 10).map((i) => {
    const d = i.after - i.before;
    return `${i.group} › ${i.label}: ${fmt(i.before)} → ${fmt(i.after)} (${d > 0 ? '+' : ''}${fmt(d)})`;
  });
  return { pages, issues };
}

/** The scheduled-crawl webhook: export result plus, with Auto Compare,
 *  the changes since the previous crawl. */
export function buildScheduledCrawlNotice(input: {
  project: string;
  startUrl: string;
  summary: CrawlSummary;
  issues: OverviewCounts['issues'];
  exportKind: string;
  exportDir: string | null;
  fileCount: number;
  sheetsUrl: string | null;
  errors: string[];
  comparison: PreviousCrawlComparison | null;
}): WebhookNotice {
  const { facts, tone: statusTone } = statusFacts(input.summary);
  if (input.exportKind !== 'none') {
    facts.push({ label: 'Export', value: `${input.exportKind} (${fmt(input.fileCount)} files)` });
  }
  if (input.exportDir) facts.push({ label: 'Folder', value: input.exportDir });
  if (input.sheetsUrl) facts.push({ label: 'Google Sheets', value: input.sheetsUrl });
  const sections: WebhookNotice['sections'] = [];
  if (input.comparison) {
    const { pages, issues } = comparisonLines(input.comparison);
    sections.push({
      title: 'Changes since the previous crawl',
      lines: pages.length > 0 ? pages : ['No page changes'],
    });
    if (issues.length > 0) sections.push({ title: 'Issue changes', lines: issues });
  } else {
    const top = topIssueLines(input.issues, 5);
    if (top.length > 0) sections.push({ title: 'Top issues', lines: top });
  }
  if (input.errors.length > 0) {
    sections.push({ title: 'Problems', lines: input.errors.slice(0, 5).map((e) => clip(e, 300)) });
  }
  const tone: WebhookNotice['tone'] =
    statusTone === 'bad' ? 'bad' : input.errors.length > 0 ? 'warning' : statusTone;
  return {
    title: `Scheduled crawl finished: ${input.project}`,
    url: input.startUrl || undefined,
    facts,
    sections,
    tone,
  };
}
