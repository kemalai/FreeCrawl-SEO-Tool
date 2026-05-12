/**
 * Human-readable diagnosis for an HTTP status code, enriched with
 * signals read off the response headers. Drives the "what does this
 * mean / why did it happen" banner in the URL Details → HTTP Headers
 * sub-tab — the place users land when a crawl returns a status they
 * don't recognise (520-class Cloudflare codes are the canonical
 * example: "Server Error" tells you nothing about the cause).
 *
 * Pure / sync / renderer-only — everything it needs is already in the
 * `CrawlUrlRow` (statusCode, statusText) plus the captured response
 * headers, so there's no IPC.
 */

export interface StatusDiagnosis {
  /** "520 — Web Server Returned an Unknown Error (Cloudflare)" */
  title: string;
  severity: 'ok' | 'info' | 'warning' | 'error';
  /** One-paragraph plain-English explanation of what the code means. */
  explanation: string;
  /** Bullet list of the most likely causes in a crawl context. */
  causes: string[];
  /**
   * Signals derived from the response headers — e.g. "Behind Cloudflare
   * (cf-ray: 9faa…)", "Server asked to retry after 60 s". Empty when no
   * recognised hint headers were present.
   */
  signals: string[];
  /**
   * Actionable next steps tuned to a crawler workflow (lower the rate,
   * change the User-Agent, etc.). Empty for codes where there's nothing
   * the crawler can do.
   */
  whatToDo: string[];
}

type HeaderList = ReadonlyArray<{ name: string; value: string }>;

function headerMap(headers: HeaderList): Map<string, string> {
  const m = new Map<string, string>();
  for (const h of headers) m.set(h.name.toLowerCase(), h.value);
  return m;
}

/** Detect the fronting CDN / proxy from response headers, if any. */
function detectFront(h: Map<string, string>): string | null {
  const server = (h.get('server') ?? '').toLowerCase();
  if (h.has('cf-ray') || server.includes('cloudflare')) return 'Cloudflare';
  if (h.has('x-amz-cf-id') || server.includes('cloudfront')) return 'Amazon CloudFront';
  if (h.has('x-served-by') && (h.get('x-served-by') ?? '').includes('cache')) return 'Fastly';
  if (server.includes('akamai') || h.has('x-akamai-transformed')) return 'Akamai';
  if (server.includes('vercel') || h.has('x-vercel-id')) return 'Vercel';
  if (server.includes('netlify')) return 'Netlify';
  if (h.has('x-sucuri-id') || h.has('x-sucuri-cache')) return 'Sucuri WAF';
  if (server.includes('varnish') || h.has('x-varnish')) return 'Varnish cache';
  if (server.includes('nginx')) return 'nginx';
  if (server.includes('apache')) return 'Apache';
  if (server.includes('litespeed')) return 'LiteSpeed';
  if (server.includes('microsoft-iis') || server.includes('iis')) return 'IIS';
  return null;
}

interface CodeInfo {
  title: string;
  severity: StatusDiagnosis['severity'];
  explanation: string;
  causes: string[];
  whatToDo: string[];
}

/**
 * Cloudflare's 5xx extension codes (520-530). These are NOT origin
 * errors in the usual sense — they describe a failure between Cloudflare
 * and the customer's origin server, OR (530) a Cloudflare-side block.
 * `statusText` for these is usually the unhelpful generic "Server Error",
 * which is exactly why this table exists.
 */
const CLOUDFLARE_CODES: Record<number, CodeInfo> = {
  520: {
    title: '520 — Web Server Returned an Unknown Error (Cloudflare)',
    severity: 'error',
    explanation:
      "Cloudflare connected to the origin server but got back an empty, malformed, or unexpected response (e.g. the connection was reset mid-response, the origin returned headers that are too large, or the origin process crashed). It is a catch-all 'something went wrong at the origin' code.",
    causes: [
      'Origin server crashed, restarted, or ran out of workers/memory while serving the request',
      'Origin closed the TCP connection before sending a complete response (often an app-level timeout or OOM kill)',
      "The crawl's request rate overwhelmed the origin's process pool — 520s that appear in bursts under load almost always mean this",
      'Origin returned response headers larger than Cloudflare allows (rare; usually a misconfigured app)',
    ],
    whatToDo: [
      'If 520s appear in bursts across many URLs, lower Max Threads / Max URL/s (Settings → Speed) and add a Crawl Delay — the origin is being overloaded by the crawl',
      'Re-crawl the affected URLs after the crawl finishes (transient 520s often clear on retry — bump Retry Attempts in Settings → Speed)',
      'If only specific URLs 520 consistently, those pages have a server-side bug — flag them to the site owner',
    ],
  },
  521: {
    title: '521 — Web Server Is Down (Cloudflare)',
    severity: 'error',
    explanation:
      'Cloudflare could not open a TCP connection to the origin server — the origin actively refused the connection or is not listening on the expected port.',
    causes: [
      'Origin web server (nginx/Apache/Node/etc.) is stopped or has crashed',
      "Origin's firewall is blocking Cloudflare's IP ranges (a misconfiguration — the origin should allow Cloudflare)",
      'Origin server is overloaded to the point of not accepting new connections',
    ],
    whatToDo: [
      'This is an origin-availability problem, not something the crawler can work around — the site is effectively down for these URLs',
      'Re-crawl later; if it persists, the site is broken',
    ],
  },
  522: {
    title: '522 — Connection Timed Out (Cloudflare)',
    severity: 'error',
    explanation:
      'Cloudflare started a TCP handshake with the origin but it never completed within the timeout — the origin accepted the SYN but never replied, or a network device between them dropped the packets.',
    causes: [
      'Origin is severely overloaded (TCP backlog full)',
      "Origin's firewall is silently dropping (not rejecting) Cloudflare's packets",
      'Network/routing issue between Cloudflare and the origin',
      "Under crawl load: the origin's connection table is exhausted by the crawl's parallel requests",
    ],
    whatToDo: [
      'Lower concurrency (Settings → Speed → Max Threads) and re-crawl — connection-table exhaustion is the usual cause when this shows up mid-crawl',
      'Retry the affected URLs after the crawl',
    ],
  },
  523: {
    title: '523 — Origin Is Unreachable (Cloudflare)',
    severity: 'error',
    explanation:
      "Cloudflare could not route to the origin server at all — typically a DNS problem in Cloudflare's origin record, or the origin's network is down.",
    causes: [
      "The site's DNS record in Cloudflare points to a wrong / dead IP",
      "Origin's hosting provider has a network outage",
      'BGP / routing failure between Cloudflare and the origin',
    ],
    whatToDo: [
      'Nothing the crawler can do — this is an origin DNS/network misconfiguration',
    ],
  },
  524: {
    title: '524 — A Timeout Occurred (Cloudflare)',
    severity: 'error',
    explanation:
      'Cloudflare made a TCP connection to the origin successfully, but the origin did not send a complete HTTP response within Cloudflare\'s timeout (100 s by default). The origin is alive but too slow on this request.',
    causes: [
      'A slow database query, external API call, or heavy computation on the page',
      'Origin is overloaded — requests are queuing behind a saturated worker pool',
      "Under crawl load: the crawl filled the origin's request queue and this URL waited too long behind it",
    ],
    whatToDo: [
      'Lower Max Threads / Max URL/s and add a Crawl Delay (Settings → Speed) so the origin isn\'t saturated',
      'Increase Response Timeout (Settings → Crawler) if you want to give genuinely slow pages more time',
      'Retry affected URLs after the crawl',
    ],
  },
  525: {
    title: '525 — SSL Handshake Failed (Cloudflare)',
    severity: 'error',
    explanation:
      "The TLS handshake between Cloudflare and the origin server failed. This is the Cloudflare↔origin leg, not the browser↔Cloudflare leg you see in the address bar — so the site can look fine to a normal visitor and still 525.",
    causes: [
      "Origin's TLS certificate is expired, self-signed, or for the wrong hostname (with Cloudflare in 'Full (strict)' mode)",
      'Origin only supports old TLS versions / cipher suites that Cloudflare rejects',
      'Origin server is overloaded and dropping TLS handshakes',
    ],
    whatToDo: [
      "Origin TLS misconfiguration — not something the crawler can change. Check the host's certificate (URL Details → TLS Cert if HTTPS)",
    ],
  },
  526: {
    title: '526 — Invalid SSL Certificate (Cloudflare)',
    severity: 'error',
    explanation:
      "Cloudflare (in 'Full (strict)' SSL mode) could not validate the origin server's TLS certificate.",
    causes: [
      "Origin certificate is expired, self-signed, or issued for a different hostname",
      'Certificate chain on the origin is incomplete (missing intermediates)',
    ],
    whatToDo: ['Origin certificate problem — nothing the crawler can do'],
  },
  527: {
    title: '527 — Railgun Error (Cloudflare, deprecated)',
    severity: 'error',
    explanation:
      'A connection error in Cloudflare Railgun (a now-retired origin-acceleration product). Effectively obsolete; if you see it the site is on a very old Cloudflare setup.',
    causes: ['Legacy Cloudflare Railgun connection failure'],
    whatToDo: ['Nothing actionable from the crawler side'],
  },
  530: {
    title: '530 — Cloudflare Error (usually a firewall / WAF block — error 1020)',
    severity: 'error',
    explanation:
      'A 530 is Cloudflare\'s way of saying "an error happened, see the error 1xxx code in the body". In a crawl context it is almost always 1020 "Access Denied" — a Cloudflare Firewall / WAF / Bot-Fight rule blocked the request. Less commonly it pairs with 1016 (origin DNS error) or other 1xxx codes.',
    causes: [
      "Cloudflare WAF / Firewall Rules / Bot Fight Mode flagged the crawler — by IP, by User-Agent, by request rate, or by missing browser fingerprints",
      'The site has a "managed challenge" the crawler can\'t solve',
      '(Rarely) an origin DNS error (1016) rather than a block',
    ],
    whatToDo: [
      'Set a browser-like User-Agent (Settings → Requests) — the default crawler UA is the #1 trigger',
      'Drop Max Threads / Max URL/s and add a Crawl Delay (Settings → Speed) — rapid requests from one IP trip rate-based rules',
      'Respect robots.txt and any declared Crawl-Delay (Settings → Crawler)',
      "If the site owner is you, allowlist the crawler in Cloudflare; otherwise this site is intentionally blocking automated access",
    ],
  },
};

/** Non-Cloudflare codes worth a richer explanation than `statusText`. */
const GENERIC_CODES: Record<number, CodeInfo> = {
  401: {
    title: '401 — Unauthorized',
    severity: 'warning',
    explanation: 'The resource requires authentication and none (or invalid) credentials were sent.',
    causes: ['Page is behind HTTP Basic/Bearer auth', 'A session cookie is required and none was sent'],
    whatToDo: [
      'Configure credentials in Settings → Authentication if you have them',
      'Use Settings → Cookies → "Accept all" if the site gates content behind a session',
    ],
  },
  403: {
    title: '403 — Forbidden',
    severity: 'warning',
    explanation:
      'The server understood the request but refuses to serve it. In a crawl this is most often a bot block or a WAF rule rather than a genuine permission issue.',
    causes: [
      'WAF / bot-protection rule triggered by the crawler User-Agent, IP, or request rate',
      'Directory or file genuinely not accessible to anonymous users',
      'Hotlink / referer protection',
    ],
    whatToDo: [
      'Try a browser-like User-Agent (Settings → Requests)',
      'Lower the crawl rate (Settings → Speed)',
      "If it's site-wide, the site is actively blocking automated access",
    ],
  },
  404: {
    title: '404 — Not Found',
    severity: 'warning',
    explanation: 'The server has no resource at this URL.',
    causes: ['Broken internal/external link', 'Page was removed without a redirect', 'Typo in a link href'],
    whatToDo: ['Fix or remove the linking pages — see the Inlinks tab for who links here'],
  },
  408: {
    title: '408 — Request Timeout',
    severity: 'warning',
    explanation: "The server timed out waiting for the request to complete.",
    causes: ['Slow network between crawler and server', 'Server-side connection timeout set very low'],
    whatToDo: ['Usually transient — bump Retry Attempts (Settings → Speed)'],
  },
  410: {
    title: '410 — Gone',
    severity: 'info',
    explanation: 'The resource was intentionally and permanently removed — stronger than a 404.',
    causes: ['Page deliberately retired; the server is telling crawlers to drop it'],
    whatToDo: ['Remove links to this URL — Google will de-index it faster than a 404'],
  },
  429: {
    title: '429 — Too Many Requests (rate limited)',
    severity: 'warning',
    explanation:
      'The server is rate-limiting the crawler — too many requests in too short a window from this IP/User-Agent.',
    causes: ['Crawl rate exceeds the server\'s per-client limit', 'Shared hosting with aggressive throttling'],
    whatToDo: [
      'Lower Max Threads / Max URL/s and add a Crawl Delay (Settings → Speed)',
      'Honour the Retry-After header — see the Signals below if the server sent one',
      'Enable robots.txt Crawl-Delay respect (Settings → Crawler)',
    ],
  },
  451: {
    title: '451 — Unavailable for Legal Reasons',
    severity: 'info',
    explanation: 'The resource is blocked for legal reasons (court order, GDPR geoblock, DMCA, etc.).',
    causes: ['Geo-restricted content', 'Legally-mandated takedown'],
    whatToDo: ['Nothing — the block is intentional'],
  },
  500: {
    title: '500 — Internal Server Error',
    severity: 'error',
    explanation: 'An unhandled error occurred in the server-side application while building the page.',
    causes: ['Bug in the page template / backend code', 'Database unavailable', 'Misconfiguration on the server'],
    whatToDo: [
      'Retry after the crawl (transient 500s clear; persistent ones are a real bug)',
      'If 500s appear under load, the crawl may be overwhelming a database — slow the crawl (Settings → Speed)',
    ],
  },
  502: {
    title: '502 — Bad Gateway',
    severity: 'error',
    explanation:
      'A reverse proxy / load balancer in front of the app got an invalid response from the upstream application server.',
    causes: [
      'Upstream app server crashed or returned garbage',
      'Upstream is overloaded — common under crawl load',
      'Proxy↔upstream timeout',
    ],
    whatToDo: [
      'Lower the crawl rate (Settings → Speed) if 502s appear in bursts',
      'Retry affected URLs after the crawl',
    ],
  },
  503: {
    title: '503 — Service Unavailable',
    severity: 'error',
    explanation:
      'The server is temporarily unable to handle the request — usually overload or maintenance. Often comes with a Retry-After header.',
    causes: [
      'Server overloaded — the crawl itself can cause this',
      'Scheduled maintenance window',
      'Auto-scaling lag (new instances spinning up)',
    ],
    whatToDo: [
      'Lower Max Threads / Max URL/s and add a Crawl Delay (Settings → Speed)',
      'Honour Retry-After (see Signals below)',
      'Retry affected URLs after the crawl',
    ],
  },
  504: {
    title: '504 — Gateway Timeout',
    severity: 'error',
    explanation:
      "A reverse proxy / load balancer didn't get a response from the upstream app server in time.",
    causes: [
      'Slow database query / external API call on the page',
      'Upstream overloaded — requests queueing',
      'Under crawl load: the crawl saturated the upstream worker pool',
    ],
    whatToDo: [
      'Lower the crawl rate (Settings → Speed)',
      'Increase Response Timeout (Settings → Crawler) for genuinely slow pages',
      'Retry affected URLs after the crawl',
    ],
  },
  508: {
    title: '508 — Loop Detected',
    severity: 'error',
    explanation: 'The server detected an infinite loop while processing the request (often WebDAV or a redirect loop server-side).',
    causes: ['Server-side redirect loop', 'Recursive include / symlink loop'],
    whatToDo: ['Server bug — nothing the crawler can do'],
  },
  509: {
    title: '509 — Bandwidth Limit Exceeded',
    severity: 'error',
    explanation: 'A non-standard code (cPanel/Apache) meaning the hosting account hit its monthly bandwidth cap.',
    causes: ['Shared hosting bandwidth quota exhausted'],
    whatToDo: ['Nothing the crawler can do — the host is throttling the whole account'],
  },
};

/**
 * Build the diagnosis for a (statusCode, statusText, headers) triple.
 * `statusCode` may be null/0 for pre-response network failures, in
 * which case the explanation focuses on connection-level causes.
 */
export function diagnoseStatus(
  statusCode: number | null,
  statusText: string | null,
  headers: HeaderList,
): StatusDiagnosis {
  const h = headerMap(headers);
  const front = detectFront(h);

  // Header-derived signals — independent of the status code, but most
  // useful on the error codes.
  const signals: string[] = [];
  if (h.has('cf-ray')) {
    signals.push(`Behind Cloudflare — cf-ray ${h.get('cf-ray')}. The status code describes the Cloudflare↔origin link, not what a browser sees.`);
  } else if (front && front !== 'nginx' && front !== 'Apache' && front !== 'IIS' && front !== 'LiteSpeed') {
    signals.push(`Fronted by ${front}.`);
  } else if (front) {
    signals.push(`Origin server: ${front}${h.get('server') ? ` (${h.get('server')})` : ''}.`);
  }
  const retryAfter = h.get('retry-after');
  if (retryAfter) {
    const secs = Number(retryAfter);
    signals.push(
      Number.isFinite(secs)
        ? `Server sent Retry-After: ${secs} s — it is explicitly asking clients to back off for that long. A polite crawl should not re-request this URL sooner.`
        : `Server sent Retry-After: ${retryAfter}.`,
    );
  }
  const cfCache = h.get('cf-cache-status');
  if (cfCache) signals.push(`Cloudflare cache status: ${cfCache}.`);
  const xRobots = h.get('x-robots-tag');
  if (xRobots) signals.push(`X-Robots-Tag: ${xRobots} — affects indexability regardless of the status.`);

  // ----- Network error (no response) -----
  if (statusCode === null || statusCode === 0) {
    return {
      title: 'No HTTP Response — Network / Connection Error',
      severity: 'error',
      explanation:
        statusText && statusText.trim()
          ? `The request never received an HTTP response. The crawler recorded: "${statusText}".`
          : 'The request never received an HTTP response — DNS lookup, TCP connection, TLS handshake, or the response read failed before any status line arrived.',
      causes: [
        'DNS could not resolve the hostname (typo, dead domain, or a name only resolvable from inside a private network)',
        'TCP connection refused or timed out (host down, firewall, wrong port)',
        'TLS handshake failed (expired/invalid certificate, protocol mismatch)',
        'Connection reset or read timed out mid-response',
        'Request aborted by the crawler because it exceeded Response Timeout (Settings → Crawler) or Max Response Time',
      ],
      signals,
      whatToDo: [
        'Check the hostname resolves and the site is reachable from a normal browser on this machine',
        'If it is reachable but slow, raise Response Timeout (Settings → Crawler)',
        'If it only fails under load, lower Max Threads / Max URL/s (Settings → Speed) — connection-table exhaustion on the origin looks like a network error to the client',
        'Retry the affected URLs after the crawl (transient resets clear on retry)',
      ],
    };
  }

  // ----- 1xx / 2xx / 3xx — not errors -----
  if (statusCode >= 100 && statusCode < 200) {
    return {
      title: `${statusCode} — Informational`,
      severity: 'info',
      explanation: `A 1xx response (${statusText || 'Informational'}). These are interim responses; the crawler treats them as transient and waits for the final status.`,
      causes: [],
      signals,
      whatToDo: [],
    };
  }
  if (statusCode >= 200 && statusCode < 300) {
    return {
      title: `${statusCode} — ${statusText || 'Success'}`,
      severity: 'ok',
      explanation: 'The request succeeded. No diagnosis needed — this section only has extra detail for error and redirect codes.',
      causes: [],
      signals,
      whatToDo: [],
    };
  }
  if (statusCode >= 300 && statusCode < 400) {
    const loc = h.get('location');
    return {
      title: `${statusCode} — ${statusText || 'Redirect'}`,
      severity: 'info',
      explanation:
        statusCode === 301
          ? 'Permanent redirect. Search engines transfer ranking signals to the target and update their index to the new URL.'
          : statusCode === 302 || statusCode === 307
            ? 'Temporary redirect. Search engines keep the original URL indexed. A 302 used long-term is a common SEO mistake — it should usually be a 301.'
            : statusCode === 308
              ? 'Permanent redirect (like 301 but the request method is preserved).'
              : statusCode === 304
                ? 'Not Modified — the cached copy is still fresh. The crawler normally requests without conditional headers, so this is unusual.'
                : `A ${statusCode} redirect (${statusText || ''}).`,
      causes: loc ? [`Location header points to: ${loc}`] : ['No Location header was captured — unusual for a redirect.'],
      signals,
      whatToDo:
        statusCode === 302 || statusCode === 307
          ? ['If this redirect is permanent, change it to a 301/308 so ranking signals consolidate', 'Check the Response Codes view to see the full chain']
          : ['Check the Response Codes view to see the full redirect chain and its final target'],
    };
  }

  // ----- 4xx / 5xx — look up the knowledge base -----
  const isCfCode = statusCode >= 520 && statusCode <= 530;
  const info =
    (front === 'Cloudflare' && CLOUDFLARE_CODES[statusCode]) ||
    CLOUDFLARE_CODES[statusCode] || // 52x are Cloudflare-only even if we didn't detect the front (e.g. cf-ray stripped)
    GENERIC_CODES[statusCode] ||
    null;

  if (info) {
    // For 530 specifically, if there's NO cf-ray we shouldn't claim Cloudflare.
    const adjusted: CodeInfo =
      isCfCode && front !== 'Cloudflare' && !h.has('cf-ray')
        ? {
            ...info,
            title: info.title.replace(' (Cloudflare)', ' (Cloudflare-style edge code)'),
          }
        : info;
    return {
      title: adjusted.title,
      severity: adjusted.severity,
      explanation: adjusted.explanation,
      causes: adjusted.causes,
      signals,
      whatToDo: adjusted.whatToDo,
    };
  }

  // ----- 4xx / 5xx with no specific entry -----
  if (statusCode >= 400 && statusCode < 500) {
    return {
      title: `${statusCode} — ${statusText || 'Client Error'}`,
      severity: 'warning',
      explanation:
        'A 4xx code means the server rejected the request as the client\'s fault (bad request, not allowed, not found, etc.). In a crawl, persistent 4xx on linked pages usually means broken links; sporadic 4xx can be bot-protection.',
      causes: ['Broken or malformed link', 'Bot-protection / WAF rule', 'Method or content the server refuses'],
      signals,
      whatToDo: [
        'Check the Inlinks tab to see what links to this URL',
        'If it looks like a block, try a browser-like User-Agent and a slower rate (Settings → Requests / Speed)',
      ],
    };
  }
  return {
    title: `${statusCode} — ${statusText || 'Server Error'}`,
    severity: 'error',
    explanation:
      'A 5xx code means the server failed to fulfil a request it accepted as valid. Under crawl load these are frequently the crawl overwhelming the origin rather than a genuine page bug.',
    causes: ['Server-side error or crash', 'Origin overloaded — possibly by the crawl itself', 'Upstream/proxy failure'],
    signals,
    whatToDo: [
      'Lower Max Threads / Max URL/s and add a Crawl Delay (Settings → Speed) if 5xx appear in bursts',
      'Bump Retry Attempts (Settings → Speed) and re-crawl affected URLs',
    ],
  };
}
