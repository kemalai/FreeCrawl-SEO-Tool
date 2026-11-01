import type { CrawlConfig } from './crawl.js';

/**
 * Two-label public suffixes where the registrable domain is the last THREE
 * labels (e.g. `example.co.uk`, `site.com.tr`) rather than the last two.
 * A curated subset of the Mozilla Public Suffix List covering the common
 * ccTLD second levels — the full PSL is megabytes and unnecessary for scope
 * matching. Without this, `foo.com.tr` and `bar.com.tr` collapse to the same
 * registrable domain (`com.tr`), so `all-subdomains` scope escapes onto every
 * unrelated site on the ccTLD.
 */
const MULTI_LEVEL_SUFFIXES: ReadonlySet<string> = new Set([
  // United Kingdom
  'co.uk', 'org.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'net.uk', 'sch.uk', 'ac.uk', 'gov.uk', 'nhs.uk',
  // Turkey
  'com.tr', 'net.tr', 'org.tr', 'gov.tr', 'edu.tr', 'k12.tr', 'av.tr', 'bel.tr', 'biz.tr', 'gen.tr',
  'info.tr', 'name.tr', 'web.tr', 'tv.tr',
  // Australia / New Zealand
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'asn.au', 'id.au',
  'co.nz', 'net.nz', 'org.nz', 'govt.nz', 'ac.nz', 'school.nz',
  // Japan / Korea / China / Hong Kong
  'co.jp', 'or.jp', 'ne.jp', 'ac.jp', 'go.jp', 'gr.jp',
  'co.kr', 'or.kr', 'ne.kr', 're.kr', 'go.kr', 'ac.kr',
  'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn',
  'com.hk', 'org.hk', 'net.hk', 'gov.hk', 'edu.hk',
  // Brazil / Mexico / Argentina / Colombia
  'com.br', 'net.br', 'org.br', 'gov.br', 'edu.br',
  'com.mx', 'net.mx', 'org.mx', 'gob.mx', 'edu.mx',
  'com.ar', 'net.ar', 'org.ar', 'gob.ar', 'edu.ar',
  'com.co', 'net.co', 'org.co', 'gov.co', 'edu.co',
  // India / Singapore / Malaysia / Thailand / Vietnam / Indonesia / Philippines
  'co.in', 'net.in', 'org.in', 'gen.in', 'firm.in', 'ind.in', 'ac.in', 'edu.in', 'gov.in', 'res.in',
  'com.sg', 'net.sg', 'org.sg', 'gov.sg', 'edu.sg',
  'com.my', 'net.my', 'org.my', 'gov.my', 'edu.my',
  'co.th', 'in.th', 'ac.th', 'go.th', 'or.th',
  'com.vn', 'net.vn', 'org.vn', 'gov.vn', 'edu.vn',
  'co.id', 'or.id', 'go.id', 'ac.id', 'web.id',
  'com.ph', 'net.ph', 'org.ph', 'gov.ph', 'edu.ph',
  // South Africa / Israel / Russia / Ukraine / Spain / Poland
  'co.za', 'org.za', 'net.za', 'gov.za', 'ac.za',
  'co.il', 'org.il', 'net.il', 'gov.il', 'ac.il',
  'com.ru', 'net.ru', 'org.ru',
  'com.ua', 'net.ua', 'org.ua',
  'com.es', 'org.es', 'gob.es', 'edu.es', 'nom.es',
  'com.pl', 'net.pl', 'org.pl', 'gov.pl', 'edu.pl',
]);

/**
 * Registrable ("root") domain of a hostname, honouring the multi-level
 * public-suffix table above. `www.example.com` → `example.com`;
 * `shop.example.co.uk` → `example.co.uk`.
 */
export function registrableDomain(hostname: string): string {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  const labels = host.split('.');
  if (labels.length <= 2) return host;
  const lastTwo = labels.slice(-2).join('.');
  if (MULTI_LEVEL_SUFFIXES.has(lastTwo) && labels.length >= 3) {
    return labels.slice(-3).join('.');
  }
  return lastTwo;
}

/**
 * Platforms that hand every customer a subdomain of one shared domain.
 * `registrableDomain('my-app.vercel.app')` is `vercel.app`, so treating
 * that as "the same site" would send a staging password to every other
 * Vercel customer. Hosts under these suffixes only ever match exactly.
 */
const SHARED_HOSTING_SUFFIXES: ReadonlySet<string> = new Set([
  'vercel.app', 'now.sh', 'netlify.app', 'netlify.com', 'pages.dev', 'workers.dev',
  'github.io', 'gitlab.io', 'herokuapp.com', 'herokudns.com', 'web.app', 'firebaseapp.com',
  'appspot.com', 'azurewebsites.net', 'azurestaticapps.net', 'cloudfront.net',
  'amazonaws.com', 'onrender.com', 'fly.dev', 'railway.app', 'up.railway.app', 'glitch.me',
  'surge.sh', 'ngrok.io', 'ngrok.app', 'ngrok-free.app', 'trycloudflare.com',
  'blogspot.com', 'wordpress.com', 'wpengine.com', 'wpenginepowered.com', 'wixsite.com',
  'myshopify.com', 'webflow.io', 'squarespace.com', 'repl.co', 'replit.app', 'deno.dev',
  'pantheonsite.io', 'kinsta.cloud', 'translate.goog',
]);

const IPV4_RE = /^\d{1,3}(?:\.\d{1,3}){3}$/;

/** Site key for subdomain matching, or null when the host must match
 *  exactly: IP literals (`registrableDomain('10.0.0.1')` would be `0.1`,
 *  shared by unrelated addresses), single-label hosts and shared-hosting
 *  platforms. */
function siteOf(hostname: string): string | null {
  if (IPV4_RE.test(hostname) || hostname.includes(':') || hostname.startsWith('[')) return null;
  if (!hostname.includes('.')) return null;
  const site = registrableDomain(hostname);
  if (SHARED_HOSTING_SUFFIXES.has(site)) return null;
  return site;
}

function parseHttpUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // A start URL typed without a scheme ("example.com") is resolved to
  // https first by the crawler; trust that, and let the resolved URL widen
  // the boundary if the site turns out to be plain http.
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, '')}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u : null;
  } catch {
    return null;
  }
}

const normHost = (hostname: string): string => hostname.toLowerCase().replace(/\.$/, '');
const portOf = (u: URL): string => u.port || (u.protocol === 'https:' ? '443' : '80');
const stripWww = (host: string): string => (host.startsWith('www.') ? host.slice(4) : host);

/**
 * True when `url` may receive the crawl's HTTP authentication and custom
 * headers. See {@link createCredentialGate}.
 */
export type CredentialGate = (url: string) => boolean;

/**
 * Credential trust boundary for a crawl's HTTP auth (`Authorization`) and
 * custom headers (bypass tokens, cookies). These are secrets for one site,
 * so they go only to an origin — scheme, host and port — the user named:
 *
 * - same origin as one of `seeds`;
 * - `www.` and the bare host count as one host (`stripWww` rewrites and
 *   apex→www start redirects land on the other one);
 * - the `https:` upgrade of a plain-`http:` seed on default ports, never
 *   the reverse — a credential set up for TLS is not sent in clear text;
 * - with `includeSubdomains`, any host under a seed's registrable domain,
 *   on the same scheme/port terms, except IP literals and shared-hosting
 *   platforms (`*.vercel.app`, `*.github.io`, …), which match exactly.
 *
 * The crawl scope is deliberately not reused: `subdomain` scope compares
 * hostnames only, which is right for deciding what to crawl and wrong for
 * deciding who may see the password (another port is another server).
 */
export function createCredentialGate(
  seeds: Iterable<string>,
  opts: { includeSubdomains?: boolean } = {},
): CredentialGate {
  const exact = new Set<string>();
  const sites = new Set<string>();
  const includeSubdomains = opts.includeSubdomains === true;
  const add = (protocol: string, host: string, port: string): void => {
    exact.add(`${protocol}//${host}:${port}`);
    exact.add(`${protocol}//${stripWww(host)}:${port}`);
    if (!host.startsWith('www.')) exact.add(`${protocol}//www.${host}:${port}`);
    if (includeSubdomains) {
      const site = siteOf(host);
      if (site) sites.add(`${protocol}//${site}:${port}`);
    }
  };
  for (const seed of seeds) {
    const u = parseHttpUrl(seed);
    if (!u) continue;
    const host = normHost(u.hostname);
    const port = portOf(u);
    add(u.protocol, host, port);
    if (u.protocol === 'http:' && port === '80') add('https:', host, '443');
  }
  if (exact.size === 0) return () => false;
  return (url: string): boolean => {
    let t: URL;
    try {
      t = new URL(url);
    } catch {
      return false;
    }
    if (t.protocol !== 'http:' && t.protocol !== 'https:') return false;
    const host = normHost(t.hostname);
    const port = portOf(t);
    if (exact.has(`${t.protocol}//${host}:${port}`)) return true;
    if (sites.size === 0) return false;
    const site = siteOf(host);
    return site !== null && sites.has(`${t.protocol}//${site}:${port}`);
  };
}

/**
 * True when both URLs have the same hostname, or sit under the same
 * registrable domain (unless that is an IP literal or a shared-hosting
 * platform). Used to decide whether a resolved start URL
 * (`example.com` → `shop.example.com`, `10.0.0.5:8080` → `http://…`) is
 * still the site the user named.
 */
export function isSameSite(urlA: string, urlB: string): boolean {
  const a = parseHttpUrl(urlA);
  const b = parseHttpUrl(urlB);
  if (!a || !b) return false;
  const ha = normHost(a.hostname);
  const hb = normHost(b.hostname);
  if (ha === hb) return true;
  const sa = siteOf(ha);
  return sa !== null && sa === siteOf(hb);
}

/** The URLs a config itself names as the crawl's own: every listed URL in
 *  List mode, otherwise the start URL (in Sitemap mode, the sitemap). */
export function credentialSeeds(
  config: Pick<CrawlConfig, 'mode' | 'startUrl' | 'urlList'>,
): string[] {
  return config.mode === 'list' ? [...config.urlList] : [config.startUrl];
}

/** Gate built from the config alone — what the renderer can know without
 *  the crawler's resolved start URL. Subdomains are trusted only for a
 *  Spider crawl with the All Subdomains scope. */
export function credentialGateForConfig(
  config: Pick<CrawlConfig, 'mode' | 'startUrl' | 'urlList' | 'scope'>,
): CredentialGate {
  return createCredentialGate(credentialSeeds(config), {
    includeSubdomains: config.mode === 'spider' && config.scope === 'all-subdomains',
  });
}
