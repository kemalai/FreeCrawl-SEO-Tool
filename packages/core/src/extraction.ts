import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type { CustomExtractionRule } from '@freecrawl/shared-types';

/**
 * Run all configured Custom Extraction rules against a single page.
 *
 * Returns a JSON-serialisable map `{ ruleName: value }` where `value`
 * is either a string, number, or string-array depending on the rule's
 * `multi` setting. Rules that fail (invalid selector / regex / no
 * matches with `multi='first'`) emit `null` so the consumer can show
 * "no match" without losing the column.
 *
 * Errors are swallowed per-rule — a misconfigured selector should not
 * abort the whole crawl. `error` events on the crawler surface the
 * first parse failure for visibility.
 *
 * Cost: O(R) per page with R = rule count. CSS rules reuse the
 * already-loaded cheerio instance; regex rules run against the raw
 * HTML string. Both are negligible alongside the network round-trip.
 */
export function runExtractionRules(
  rawHtml: string,
  $: CheerioAPI,
  rules: ReadonlyArray<CustomExtractionRule>,
): Record<string, unknown> | null {
  if (!rules || rules.length === 0) return null;

  const out: Record<string, unknown> = {};
  let anyMatch = false;

  for (const rule of rules) {
    const name = (rule.name ?? '').trim();
    if (!name) continue;

    let value: unknown = null;
    try {
      if (rule.type === 'css') {
        value = runCssRule($, rule);
      } else if (rule.type === 'regex') {
        value = runRegexRule(rawHtml, rule);
      }
    } catch {
      // Per-rule failure isolation — bad selector shouldn't poison the
      // whole extraction map. Null surfaces as "no match" in the UI.
      value = null;
    }

    out[name] = value;
    if (value !== null && value !== undefined && value !== 0 && value !== '') {
      anyMatch = true;
    }
  }

  return anyMatch ? out : null;
}

/**
 * Live-preview variant of {@link runExtractionRules} — runs every rule
 * against a single page and returns per-rule outcomes WITHOUT
 * swallowing errors. The crawler-side variant silently nulls failed
 * rules so a misconfigured selector doesn't poison the whole map; the
 * preview UI needs the opposite contract because the whole point of
 * the dialog is to surface broken selectors.
 *
 * Loads cheerio internally so the caller doesn't need its own parser.
 * Same per-rule semantics for CSS vs regex; `null` value distinguishes
 * "no match" while a populated `error` distinguishes "rule failed to
 * compile / execute".
 */
export function previewExtractionRules(
  rawHtml: string,
  rules: ReadonlyArray<CustomExtractionRule>,
): Array<{ name: string; value: unknown; error?: string }> {
  if (rules.length === 0) return [];
  const $ = cheerio.load(rawHtml);
  const out: Array<{ name: string; value: unknown; error?: string }> = [];
  for (const rule of rules) {
    const name = (rule.name ?? '').trim() || '(unnamed)';
    try {
      let value: unknown = null;
      if (rule.type === 'css') {
        value = runCssRule($, rule);
      } else if (rule.type === 'regex') {
        value = runRegexRule(rawHtml, rule);
      }
      out.push({ name, value });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      out.push({ name, value: null, error: msg });
    }
  }
  return out;
}

function runCssRule($: CheerioAPI, rule: CustomExtractionRule): unknown {
  const $els = $(rule.selector);
  const total = $els.length;

  if (rule.output === 'count' || rule.multi === 'count') return total;
  if (total === 0) return null;

  const readOne = (i: number): string | null => {
    const $el = $els.eq(i);
    switch (rule.output) {
      case 'text':
        return $el.text().replace(/\s+/g, ' ').trim() || null;
      case 'attribute': {
        if (!rule.attribute) return null;
        const v = $el.attr(rule.attribute);
        return v === undefined ? null : v;
      }
      case 'inner_html':
        return $el.html() ?? null;
      case 'outer_html': {
        const v = $.html($el);
        return v ?? null;
      }
      default:
        return $el.text().replace(/\s+/g, ' ').trim() || null;
    }
  };

  if (rule.multi === 'first') return readOne(0);
  if (rule.multi === 'last') return readOne(total - 1);

  const all: string[] = [];
  for (let i = 0; i < total; i++) {
    const v = readOne(i);
    if (v !== null) all.push(v);
  }
  if (rule.multi === 'all') return all;
  if (rule.multi === 'concat') return all.join(' | ');
  return all[0] ?? null;
}

function runRegexRule(rawHtml: string, rule: CustomExtractionRule): unknown {
  // Always compile with /g — we count / iterate matches. Per-rule
  // re-compile is cheap (regex caches in the engine) and avoids holding
  // lastIndex state across pages.
  const re = new RegExp(rule.selector, 'g');

  if (rule.output === 'count' || rule.multi === 'count') {
    let count = 0;
    while (re.exec(rawHtml) !== null) count++;
    return count;
  }

  const all: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(rawHtml)) !== null) {
    if (rule.output === 'regex_group' && m[1] !== undefined) {
      all.push(m[1]);
    } else {
      all.push(m[0]);
    }
    // Safety against zero-width matches that would otherwise loop forever.
    if (m.index === re.lastIndex) re.lastIndex++;
  }

  if (all.length === 0) return null;
  if (rule.multi === 'first') return all[0];
  if (rule.multi === 'last') return all[all.length - 1];
  if (rule.multi === 'all') return all;
  if (rule.multi === 'concat') return all.join(' | ');
  return all[0] ?? null;
}
