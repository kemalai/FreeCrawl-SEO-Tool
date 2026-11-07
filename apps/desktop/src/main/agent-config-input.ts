/**
 * Type-checks a CrawlConfig an MCP agent sends to `set_crawl_config`.
 *
 * An MCP client only sends real JSON types for properties the tool schema
 * declares; anything else may arrive as a string — `"false"`, `"20"`,
 * `"[{...}]"`. Saved as-is, `"false"` is truthy (a setting the agent
 * switched off reads as on) and a stringified list breaks every reader.
 * So each field is held to the type of its default: a string that encodes
 * the right type is decoded, anything else is refused with the field
 * named. Fields without a default (optional ones) pass through.
 *
 * Pure (no Electron) so it can be tested directly.
 */
import { DEFAULT_CRAWL_CONFIG, type CrawlConfig } from '@freecrawl/shared-types';

type Kind = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null' | 'other';

function kindOf(value: unknown): Kind {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  return t === 'string' || t === 'number' || t === 'boolean' || t === 'object' ? t : 'other';
}

/** `raw` decoded as `kind`, or `undefined` when it does not encode one. */
function decode(raw: string, kind: Kind): unknown {
  const text = raw.trim();
  if (kind === 'boolean') return text === 'true' ? true : text === 'false' ? false : undefined;
  if (kind === 'number') {
    const n = text === '' ? NaN : Number(text);
    return Number.isFinite(n) ? n : undefined;
  }
  if (kind === 'array' || kind === 'object') {
    try {
      const parsed: unknown = JSON.parse(text);
      return kindOf(parsed) === kind ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

const DEFAULTS = DEFAULT_CRAWL_CONFIG as unknown as Record<string, unknown>;

export function coerceAgentConfig(input: unknown): Partial<CrawlConfig> {
  if (kindOf(input) !== 'object') throw new Error('A CrawlConfig object is required.');
  const out: Record<string, unknown> = {};
  const problems: string[] = [];
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const expected = Object.hasOwn(DEFAULTS, key) ? kindOf(DEFAULTS[key]) : null;
    const got = kindOf(value);
    if (expected === null || got === expected) {
      out[key] = value;
      continue;
    }
    const decoded = got === 'string' ? decode(value as string, expected) : undefined;
    if (decoded !== undefined) {
      out[key] = decoded;
      continue;
    }
    problems.push(`\`${key}\` must be ${expected === 'array' || expected === 'object' ? 'an' : 'a'} ${expected} (got ${got})`);
  }
  if (problems.length > 0) {
    throw new Error(`Invalid CrawlConfig — nothing was saved: ${problems.join('; ')}.`);
  }
  return out as Partial<CrawlConfig>;
}
