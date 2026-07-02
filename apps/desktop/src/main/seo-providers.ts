/**
 * Faz 7 — Third-party SEO authority providers.
 *
 * One thin abstraction (`fetchSeoMetrics`) so the SEO tab + batch
 * runner don't have to know which provider they're driving. Each
 * client returns a strongly-typed metrics object matching the
 * `SeoMetrics` union in `@freecrawl/shared-types`.
 *
 * Auth varies wildly between vendors — Ahrefs uses a Bearer API token
 * (v3), Majestic a query-string key, Moz Basic auth with Access ID +
 * Secret Key, Semrush a query-string key. All credentials live in the
 * encrypted credential store; nothing leaks to the renderer.
 *
 * The API endpoints / response shapes shift periodically per vendor;
 * the implementations here target the documented v1-current shapes and
 * parse defensively. If a metric field renames upstream the
 * corresponding value falls to `null` rather than throwing.
 */
import type {
  AhrefsMetrics,
  MajesticMetrics,
  MozMetrics,
  SemrushMetrics,
  SeoMetrics,
  SeoProvider,
} from '@freecrawl/shared-types';
import { resolveCredentials } from './credentials.js';
import { apiFetch } from './api-fetch.js';

const REQUEST_TIMEOUT_MS = 60_000;

export class SeoProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeoProviderError';
  }
}

function numOrNull(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function fetchSeoMetrics(
  provider: SeoProvider,
  url: string,
): Promise<SeoMetrics> {
  switch (provider) {
    case 'ahrefs':
      return fetchAhrefs(url);
    case 'majestic':
      return fetchMajestic(url);
    case 'moz':
      return fetchMoz(url);
    case 'semrush':
      return fetchSemrush(url);
  }
}

// ── Ahrefs ───────────────────────────────────────────────────────────

/**
 * Ahrefs v3 removed the combined `/site-explorer/overview` endpoint
 * in 2024 — every metric now has its own route. We fan out to four
 * per-metric endpoints in parallel and stitch the result back into the
 * `AhrefsMetrics` shape the rest of the app expects.
 *
 * Per-metric endpoints + response field used:
 *   - domain-rating       → `domain_rating`
 *   - url-rating          → `url_rating`
 *   - backlinks-stats     → `live` (count of live backlinks)
 *   - metrics             → `refdomains` (referring domains)
 *
 * Each Ahrefs endpoint may wrap its payload under a key matching the
 * metric name (e.g. `{ "domain_rating": { "domain_rating": 73, … } }`)
 * or return fields at the top level. We probe both shapes so a small
 * API tweak doesn't break us again.
 */
interface AhrefsCall {
  path: string;
  extract: (json: Record<string, unknown>) => number | null;
}

async function ahrefsFetch(
  call: AhrefsCall,
  url: string,
  apiKey: string,
): Promise<number | null> {
  const params = new URLSearchParams({
    target: url,
    mode: 'exact',
    protocol: 'both',
    date: new Date().toISOString().slice(0, 10),
  });
  let res: Response;
  try {
    res = await apiFetch(
      `https://api.ahrefs.com/v3/site-explorer/${call.path}?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );
  } catch (err) {
    throw new SeoProviderError(
      `Ahrefs ${call.path}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !json) {
    const err = (json?.['error'] as string | undefined) ?? `HTTP ${res.status}`;
    throw new SeoProviderError(`Ahrefs ${call.path}: ${err}`);
  }
  return call.extract(json);
}

/** Read a numeric field from either top-level or one level of nesting
 *  (Ahrefs sometimes wraps payloads under a key matching the metric). */
function readNested(
  json: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const k of keys) {
    const direct = numOrNull(json[k]);
    if (direct !== null) return direct;
  }
  for (const v of Object.values(json)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const inner = v as Record<string, unknown>;
      for (const k of keys) {
        const nested = numOrNull(inner[k]);
        if (nested !== null) return nested;
      }
    }
  }
  return null;
}

async function fetchAhrefs(url: string): Promise<AhrefsMetrics> {
  const apiKey = (resolveCredentials('ahrefs')['apiKey'] ?? '').trim();
  if (!apiKey) {
    throw new SeoProviderError(
      'No Ahrefs API token — paste yours in Settings → Integrations.',
    );
  }
  const calls: { name: keyof AhrefsMetrics; call: AhrefsCall }[] = [
    {
      name: 'domainRating',
      call: {
        path: 'domain-rating',
        extract: (j) => readNested(j, ['domain_rating']),
      },
    },
    {
      name: 'urlRating',
      call: {
        path: 'url-rating',
        extract: (j) => readNested(j, ['url_rating']),
      },
    },
    {
      name: 'backlinks',
      call: {
        path: 'backlinks-stats',
        extract: (j) => readNested(j, ['live', 'backlinks', 'all_time']),
      },
    },
    {
      name: 'refDomains',
      call: {
        path: 'metrics',
        extract: (j) => readNested(j, ['refdomains', 'ref_domains']),
      },
    },
  ];
  // Run all four in parallel — Ahrefs rate-limits per-token, not
  // per-endpoint, so 4 concurrent calls = 4 tokens consumed instantly.
  // We tolerate partial success: if backlinks-stats fails but the other
  // three succeed, the user still sees DR/UR/refdomains rather than a
  // total ERR row. `Promise.allSettled` makes that explicit.
  const settled = await Promise.allSettled(
    calls.map((c) => ahrefsFetch(c.call, url, apiKey)),
  );
  const result: AhrefsMetrics = {
    domainRating: null,
    urlRating: null,
    backlinks: null,
    refDomains: null,
  };
  const errors: string[] = [];
  settled.forEach((r, i) => {
    const entry = calls[i]!;
    if (r.status === 'fulfilled') {
      result[entry.name] = r.value;
    } else {
      errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
    }
  });
  // If every endpoint failed, surface a single error rather than silently
  // returning a row full of nulls.
  if (errors.length === calls.length) {
    throw new SeoProviderError(errors[0] ?? 'Ahrefs: all metric endpoints failed');
  }
  return result;
}

// ── Majestic ─────────────────────────────────────────────────────────

async function fetchMajestic(url: string): Promise<MajesticMetrics> {
  const apiKey = (resolveCredentials('majestic')['apiKey'] ?? '').trim();
  if (!apiKey) {
    throw new SeoProviderError(
      'No Majestic API key — paste yours in Settings → Integrations.',
    );
  }
  const params = new URLSearchParams({
    cmd: 'GetIndexItemInfo',
    items: '1',
    item0: url,
    app_api_key: apiKey,
  });
  const res = await apiFetch(`https://api.majestic.com/api/json?${params.toString()}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !json) {
    throw new SeoProviderError(`Majestic: HTTP ${res.status}`);
  }
  if (json['Code'] && json['Code'] !== 'OK') {
    throw new SeoProviderError(
      `Majestic: ${(json['ErrorMessage'] as string | undefined) ?? json['Code']}`,
    );
  }
  // Drill into the documented `DataTables.Results.Data[0]` shape.
  const tables = json['DataTables'] as Record<string, unknown> | undefined;
  const results = tables?.['Results'] as Record<string, unknown> | undefined;
  const data = results?.['Data'] as Record<string, unknown>[] | undefined;
  const row = (Array.isArray(data) && data[0]) || {};
  return {
    trustFlow: numOrNull(row['TrustFlow']),
    citationFlow: numOrNull(row['CitationFlow']),
    externalBacklinks: numOrNull(row['ExtBackLinks']),
    refDomains: numOrNull(row['RefDomains']),
  };
}

// ── Moz ──────────────────────────────────────────────────────────────

async function fetchMoz(url: string): Promise<MozMetrics> {
  const creds = resolveCredentials('moz');
  const accessId = (creds['accessId'] ?? '').trim();
  const secretKey = (creds['secretKey'] ?? '').trim();
  if (!accessId || !secretKey) {
    throw new SeoProviderError(
      'Missing Moz credentials — paste your Access ID and Secret Key in Settings → Integrations.',
    );
  }
  const basic = Buffer.from(`${accessId}:${secretKey}`).toString('base64');
  const res = await apiFetch('https://lsapi.seomoz.com/v2/url_metrics', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ targets: [url] }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !json) {
    const err = (json?.['message'] as string | undefined) ?? `HTTP ${res.status}`;
    throw new SeoProviderError(`Moz: ${err}`);
  }
  const results = json['results'] as Record<string, unknown>[] | undefined;
  const row = (Array.isArray(results) && results[0]) || {};
  return {
    domainAuthority: numOrNull(row['domain_authority']),
    pageAuthority: numOrNull(row['page_authority']),
    spamScore: numOrNull(row['spam_score']),
    linkingDomains: numOrNull(row['root_domains_to_root_domain'] ?? row['linking_root_domains']),
  };
}

// ── Semrush ──────────────────────────────────────────────────────────

async function fetchSemrush(url: string): Promise<SemrushMetrics> {
  const apiKey = (resolveCredentials('semrush')['apiKey'] ?? '').trim();
  if (!apiKey) {
    throw new SeoProviderError(
      'No Semrush API key — paste yours in Settings → Integrations.',
    );
  }
  // Semrush API v3 renamed `url_overview` → `url_rank` and made
  // `export_columns` mandatory (it used to default to a useful subset).
  // Column codes match the response field names, so the row extractor
  // below still keys off `Or` / `Ot` / `Oc` / `Ad` unchanged.
  const params = new URLSearchParams({
    type: 'url_rank',
    key: apiKey,
    url,
    database: 'us',
    display_format: 'json',
    export_columns: 'Or,Ot,Oc,Ad',
  });
  const res = await apiFetch(`https://api.semrush.com/?${params.toString()}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new SeoProviderError(`Semrush: ${text.trim() || `HTTP ${res.status}`}`);
  }
  // Semrush returns a typo-laden plain error string for some failures,
  // and a JSON array for success.
  let row: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>[] | unknown;
    if (Array.isArray(parsed) && parsed[0]) row = parsed[0];
  } catch {
    throw new SeoProviderError(`Semrush: ${text.trim().slice(0, 200)}`);
  }
  return {
    organicKeywords: numOrNull(row['Or']),
    organicTraffic: numOrNull(row['Ot']),
    organicCost: numOrNull(row['Oc']),
    adwordsKeywords: numOrNull(row['Ad']),
  };
}
