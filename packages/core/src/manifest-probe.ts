import { fetch as undiciFetch } from 'undici';
import { defaultRequestHeaders } from './http-client.js';
import type { CrawlConfig } from '@freecrawl/shared-types';

/**
 * Parsed Web App Manifest fields surfaced for the Detail panel + audits.
 * Captures the most-frequently-checked PWA / install metadata; the raw
 * JSON body is preserved separately so power users can read every
 * custom field without us needing a column for each.
 */
export interface ManifestProbeResult {
  /** Raw JSON body, capped at 4 KB to keep the column tiny on hostile manifests. */
  rawJson: string | null;
  themeColor: string | null;
  shortName: string | null;
  display: string | null;
  scope: string | null;
  iconCount: number;
  /** Free-form error string when the fetch / parse fails. Null on success. */
  error: string | null;
}

const RAW_JSON_CAP = 4096;
const PROBE_TIMEOUT_MS = 8_000;

/**
 * Fetch a Web App Manifest URL and surface a small set of canonical
 * fields. We deliberately keep this best-effort:
 *   - JSON parse failures don't throw — caller stores `error`
 *   - 4xx / 5xx still resolve with `error` set so the result can be
 *     persisted (otherwise we'd re-probe on every post-crawl pass)
 *   - Body cap of 4 KB protects against accidentally-streamed huge
 *     manifests (some CMSes proxy a 5 MB JSON-LD by mistake)
 */
export async function probeManifest(
  manifestUrl: string,
  config: Pick<CrawlConfig, 'userAgent' | 'acceptLanguage' | 'customHeaders' | 'auth'>,
): Promise<ManifestProbeResult> {
  const empty: ManifestProbeResult = {
    rawJson: null,
    themeColor: null,
    shortName: null,
    display: null,
    scope: null,
    iconCount: 0,
    error: null,
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await undiciFetch(manifestUrl, {
      method: 'GET',
      headers: defaultRequestHeaders(
        config.userAgent,
        config.acceptLanguage,
        config.customHeaders,
        config.auth,
      ),
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!res.ok) {
      return { ...empty, error: `HTTP ${res.status}` };
    }
    const text = await res.text();
    const truncated = text.slice(0, RAW_JSON_CAP);
    let parsed: Record<string, unknown> | null = null;
    try {
      const body = JSON.parse(text) as unknown;
      if (body && typeof body === 'object' && !Array.isArray(body)) {
        parsed = body as Record<string, unknown>;
      } else {
        return { ...empty, rawJson: truncated, error: 'manifest is not a JSON object' };
      }
    } catch (err) {
      return {
        ...empty,
        rawJson: truncated,
        error: `JSON parse error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
    const stringField = (k: string): string | null => {
      const v = parsed![k];
      return typeof v === 'string' && v.trim() ? v.trim() : null;
    };
    const icons = parsed['icons'];
    return {
      rawJson: truncated,
      themeColor: stringField('theme_color'),
      shortName: stringField('short_name'),
      display: stringField('display'),
      scope: stringField('scope'),
      iconCount: Array.isArray(icons) ? icons.length : 0,
      error: null,
    };
  } catch (err) {
    return {
      ...empty,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}
