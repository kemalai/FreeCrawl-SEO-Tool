/**
 * Bot protection, WAF and rate-limit answers that stand in for a site's page.
 *
 * Such an answer says nothing about the page: counted as the page's 4xx it
 * filled Broken Links and Non-200 in Sitemap with pages that work (266
 * "broken" pages on one Cloudflare site, every page after the block on a
 * CloudFront + AWS WAF one), and a 200 interstitial taken for content
 * reported hundreds of indexable pages with none of the site's links.
 *
 * Only signals the protection layer puts on its OWN answers count, so a
 * site's own 403 / 404 / 503 is never relabelled. A CDN's everyday
 * fingerprint (`server: cloudflare`, `x-azure-ref`, `x-datadome`, an
 * `incap_ses` cookie, an injected `_Incapsula_Resource` or
 * `/cdn-cgi/challenge-platform/` script) is on every page behind it and
 * means nothing alone; what counts is a header sent only with a block
 * (`cf-mitigated`, `x-datadome-cid`), or the vendor's generated block page —
 * matched on wording or markup no site puts in its own error page.
 *
 * Deliberately NOT detected, because their answer is indistinguishable from
 * the origin's: ModSecurity / OWASP CRS behind the server's stock 403, nginx
 * `limit_req` (stock 503), Apache mod_evasive, Netacea's plain 403, Netlify
 * traffic rules (branded 404), Akamai tarpit / abort (no response at all),
 * F5 Distributed Cloud (Shape) and any owner-customised block response.
 *
 * Three entry points, by what the caller has in hand:
 * - {@link detectBotProtectionVerdict} / {@link detectBotProtection} —
 *   headers only (any status), e.g. a redirect to a captcha host;
 * - {@link detectBlockPage} — an error response's body (status >= 400),
 *   read only when {@link wantsBlockPageBody} says it can be a block page;
 * - {@link detectChallengePage} — a 2xx page already parsed: interstitials
 *   that answer 200, guarded by word count so a real page never matches.
 *
 * Sources (2026-10-31): vendor documentation, official SDKs / connectors
 * (HUMAN perimeterx-node-core, Queue-it KnownUser, Netacea, DataDome docs,
 * Cloudflare error reference, AWS / Azure / GCP / Fastly / Shopify docs,
 * Wordfence / Solid / Shield / Anubis / go-away sources), live block pages,
 * and the wafw00f fingerprints (github.com/EnableSecurity/wafw00f).
 */

export type HeaderGetter = { get(name: string): string | null };

/**
 * What the protection did. All are recorded as blocked (not the page's
 * status); `geo` alone leaves the crawl's pace alone, because a block on
 * where the crawl comes from does not lift by slowing down.
 */
export type BlockKind = 'challenge' | 'block' | 'rate-limit' | 'geo' | 'waiting-room';

export interface BlockVerdict {
  /** The row's status text, e.g. "Akamai block (HTTP 403)". */
  label: string;
  kind: BlockKind;
}

const KIND_WORDS: Record<BlockKind, string> = {
  challenge: 'challenge',
  block: 'block',
  'rate-limit': 'rate limit',
  geo: 'geo block',
  'waiting-room': 'waiting room',
};

/** Every label ends in `(HTTP <status>)`: the renderer's status diagnosis
 *  reads the code back from there (`statusDiagnosis.ts`). */
function verdict(vendor: string, kind: BlockKind, status: number, detail?: string): BlockVerdict {
  return { label: `${vendor} ${KIND_WORDS[kind]}${detail ? `, ${detail}` : ''} (HTTP ${status})`, kind };
}

/** Bytes of an error body scanned for a block page. Every vendor page
 *  known is far smaller; a large error page is the site's own. */
export const BLOCK_PAGE_SCAN_BYTES = 64 * 1024;

// ---------------------------------------------------------------------------
// Headers
// ---------------------------------------------------------------------------

/** Hosts / paths a protection redirects to instead of serving the page. */
const CHALLENGE_REDIRECTS: readonly {
  vendor: string;
  kind: BlockKind;
  test: (target: URL, raw: string) => boolean;
}[] = [
  // Queue-it: its own domain, or a customer CNAME carrying its query shape
  // (`?c=<customer>&e=<event>&ver=…&t=<target>`).
  {
    vendor: 'Queue-it',
    kind: 'waiting-room',
    test: (t) =>
      /(^|\.)queue-it\.net$/i.test(t.hostname) ||
      (/[?&]c=[^&]+&e=[^&]+/.test(t.search) && /[?&]ver=/.test(t.search) && /[?&]t=/.test(t.search)),
  },
  { vendor: 'DataDome', kind: 'challenge', test: (t) => /(^|\.)captcha-delivery\.com$/i.test(t.hostname) },
  { vendor: 'Radware Bot Manager', kind: 'challenge', test: (t) => /^validate\.perfdrive\.com$/i.test(t.hostname) },
  { vendor: 'SiteGround', kind: 'challenge', test: (t) => /^\/\.well-known\/sgcaptcha\//i.test(t.pathname) },
  // All-In-One WP Security sends blocked IPs to the visitor's own machine.
  // Only the bare loopback (no port, no path) — a site under test on
  // 127.0.0.1 redirects with its port and path.
  { vendor: 'All-In-One WP Security', kind: 'block', test: (_t, raw) => /^(?:https?:\/\/)?127\.0\.0\.1\/?$/i.test(raw.trim()) },
];

function challengeRedirect(status: number, location: string | null): BlockVerdict | null {
  if (!location) return null;
  let target: URL;
  try {
    target = new URL(location, 'http://origin.invalid/');
  } catch {
    return null;
  }
  for (const r of CHALLENGE_REDIRECTS) {
    if (r.test(target, location)) return verdict(r.vendor, r.kind, status);
  }
  return null;
}

/**
 * The protection that answered instead of the site, judged on headers alone,
 * or null. Each signal here is one the vendor sends only with its own block,
 * challenge or limit — never on a page it lets through. A bare 429 comes
 * back as the vendor-less "Rate limited"; a caller holding the body can name
 * the vendor with {@link detectBlockPage} first.
 */
export function detectBotProtectionVerdict(status: number, headers: HeaderGetter): BlockVerdict | null {
  // Signals that ride on success / redirect codes come before the 4xx gate.
  // AWS WAF's JavaScript challenge answers 202 with `x-amzn-waf-action:
  // challenge` and an interstitial body.
  const aws = headers.get('x-amzn-waf-action');
  if (aws && (status >= 400 || status === 202)) {
    const action = aws.trim().toLowerCase();
    return { label: `AWS WAF ${action} (HTTP ${status})`, kind: action === 'block' ? 'block' : 'challenge' };
  }
  // SiteGround's captcha answers 202 + `SG-Captcha: challenge`.
  if (headers.get('sg-captcha')) return verdict('SiteGround', 'challenge', status);
  // Queue-it answers an AJAX request with this header instead of a 302.
  if (headers.get('x-queueit-redirect')) return verdict('Queue-it', 'waiting-room', status);
  if (status >= 300 && status < 400) return challengeRedirect(status, headers.get('location'));
  if (status < 400) return null;

  const cf = headers.get('cf-mitigated');
  if (cf) return { label: `Cloudflare ${cf.trim().toLowerCase()} (HTTP ${status})`, kind: 'challenge' };
  const vercel = headers.get('x-vercel-mitigated');
  if (vercel) {
    const action = vercel.trim().toLowerCase();
    return { label: `Vercel ${action} (HTTP ${status})`, kind: action === 'deny' ? 'block' : 'challenge' };
  }
  if (headers.get('x-sucuri-block')) return verdict('Sucuri', 'block', status);
  // DataDome: `x-datadome-cid` / `x-dd-b` ride only on its blocks.
  // `x-datadome: protected` is on normal pages too and proves nothing.
  if (headers.get('x-datadome-cid') || headers.get('x-dd-b')) {
    return verdict('DataDome', status === 429 ? 'rate-limit' : 'block', status);
  }
  // Kasada's challenge (429) hands the client a token in these headers.
  if (headers.get('x-kpsdk-ct') || headers.get('x-kpsdk-r')) return verdict('Kasada', 'challenge', status);
  if (headers.get('x-px-blocked')) return verdict('PerimeterX', 'block', status);
  if (headers.get('x-dotdefender-denied')) return verdict('dotDefender', 'block', status);
  // 430 is Shopify's own "Security Rejection"; no other server uses it.
  if (status === 430) return verdict('Shopify', 'block', status);
  if (status === 429) return { label: `Rate limited (HTTP ${status})`, kind: 'rate-limit' };
  return null;
}

/** {@link detectBotProtectionVerdict}'s label alone. */
export function detectBotProtection(status: number, headers: HeaderGetter): string | null {
  return detectBotProtectionVerdict(status, headers)?.label ?? null;
}

// ---------------------------------------------------------------------------
// Block pages
// ---------------------------------------------------------------------------

/** One marker, or a group that must all occur. */
type Marker = RegExp | readonly RegExp[];

interface PageSignature {
  vendor: string;
  kind: BlockKind;
  /**
   * `error` — served only with an error status (>= 400).
   * `any` — also served with 2xx (an interstitial); there it matches only on
   * a page with next to no text (see {@link INTERSTITIAL_MAX_WORDS}).
   */
  on: 'error' | 'any';
  /** Only with these statuses. */
  status?: readonly number[];
  /** Only when the protection stamped its own answer, e.g. the edge's `Server`. */
  header?: readonly [name: string, value: RegExp];
  /** Any one of these identifies the page. */
  body: readonly Marker[];
}

/** `.` / ` ` / `#` as served raw or entity-encoded (Akamai encodes them). */
const DOT = String.raw`(?:\.|&#46;)`;
const SP = String.raw`(?:\s|&#32;)`;
const HASH = String.raw`(?:#|&#35;)`;
const APOS = String.raw`(?:'|&#39;|&#x27;|’)`;

const PAGE_SIGNATURES: readonly PageSignature[] = [
  // --- Amazon -------------------------------------------------------------
  // CloudFront's generated 403; the edge stamps `Server: CloudFront`, an
  // origin's answer keeps its own Server. Geo restriction shares the page.
  {
    vendor: 'AWS WAF',
    kind: 'block',
    on: 'error',
    header: ['server', /^\s*cloudfront\s*$/i],
    body: [/\bRequest blocked\.[\s\S]*Generated by cloudfront/i],
  },
  {
    vendor: 'CloudFront',
    kind: 'geo',
    on: 'error',
    header: ['server', /^\s*cloudfront\s*$/i],
    body: [/configured to block access from your country/i],
  },
  // An ALB generates a 403 only for an AWS WAF block (auth failures are
  // 401/561); its page is nginx's minus the nginx footer.
  {
    vendor: 'AWS WAF',
    kind: 'block',
    on: 'error',
    status: [403],
    header: ['server', /^\s*awselb\/2\.0\s*$/i],
    body: [/<center><h1>403 Forbidden<\/h1><\/center>/i],
  },
  { vendor: 'AWS WAF', kind: 'block', on: 'error', body: [/"errorType"\s*:\s*"WAFForbiddenException"/] },

  // --- Akamai -------------------------------------------------------------
  // Edge "Access Denied", served 403 or 200, entity-encoded. Its generic
  // edge-error page ("An error occurred while processing your request.")
  // also links errors.edgesuite.net and stays an error, hence the group.
  {
    vendor: 'Akamai',
    kind: 'block',
    on: 'any',
    body: [
      [
        /<h1>Access Denied<\/h1>/i,
        new RegExp(`You don${APOS}t have permission to access`, 'i'),
        new RegExp(`Reference${SP}${HASH}\\d+${DOT}[0-9a-f]+|errors${DOT}edgesuite${DOT}net`, 'i'),
      ],
    ],
  },
  // sec-cpt crypto challenge (428): iframe or JSON form.
  {
    vendor: 'Akamai',
    kind: 'challenge',
    on: 'any',
    body: [/<iframe[^>]+id="sec-cpt-if"/i, /"sec-cp-challenge"\s*:\s*"true"/i],
  },

  // --- Imperva / Incapsula ------------------------------------------------
  // `_Incapsula_Resource` is injected into normal pages too; the incident
  // iframe (403 block or 200 interstitial) is not.
  {
    vendor: 'Imperva',
    kind: 'block',
    on: 'any',
    body: [/Request unsuccessful\. Incapsula incident ID/i, [/id="main-iframe" src="\/_Incapsula_Resource\?/i, /incident_id=/i]],
  },
  // Advanced Bot Protection (ex-Distil).
  {
    vendor: 'Imperva',
    kind: 'challenge',
    on: 'any',
    body: [
      /<title>Pardon Our Interruption<\/title>/i,
      /something about your browser made us think you were a bot/i,
      /distilCaptchaForm/,
      /distilCallbackGuard/,
      /cdn\.distilnetworks\.com\/images\/anomaly\.detected\.png/i,
    ],
  },

  // --- DataDome / HUMAN / Kasada / F5 -------------------------------------
  {
    vendor: 'DataDome',
    kind: 'challenge',
    on: 'any',
    body: [/geo\.captcha-delivery\.com/i, /ct\.captcha-delivery\.com\/[ci]\.js/i, /var dd=\{'rt':'[a-z]'/],
  },
  {
    vendor: 'PerimeterX',
    kind: 'rate-limit',
    on: 'error',
    body: [/Reached maximum requests limitation, try again soon/i],
  },
  {
    vendor: 'PerimeterX',
    kind: 'challenge',
    on: 'any',
    body: [
      /<meta name="description" content="px-captcha">/i,
      /captcha\.px-cloud\.net/i,
      /px-captcha-error-container/i,
      /\/captcha\.js\?a=c&(?:amp;)?u=/i,
      /denied because we believe you are using automation tools/i,
      /perimeterx\.(?:com|net)\/whywasiblocked/i,
    ],
  },
  {
    vendor: 'Kasada',
    kind: 'challenge',
    on: 'error',
    body: [/window\.KPSDK=\{\}/, /\/ips\.js\?KP_UIDz=/],
  },
  // BIG-IP ASM / Advanced WAF — default status 200.
  {
    vendor: 'F5 BIG-IP ASM',
    kind: 'block',
    on: 'any',
    body: [/The requested URL was rejected\. Please consult with your administrator/i],
  },
  {
    vendor: 'F5 Bot Defense',
    kind: 'challenge',
    on: 'any',
    body: [[/Please enable JavaScript to view the page content\./i, /Your support ID is:?\s*\d+/i]],
  },

  // --- Cloud providers / CDNs ---------------------------------------------
  // `x-azure-ref` is on every Front Door answer, so it only gates the sentence.
  {
    vendor: 'Azure Front Door WAF',
    kind: 'rate-limit',
    on: 'error',
    status: [429],
    header: ['x-azure-ref', /./],
    body: [/The request is blocked\./],
  },
  {
    vendor: 'Azure Front Door WAF',
    kind: 'block',
    on: 'error',
    status: [403],
    header: ['x-azure-ref', /./],
    body: [/The request is blocked\./],
  },
  // The gateway generates a 403 only in WAF prevention mode; the same footer
  // on its 502/504 is a real gateway error.
  {
    vendor: 'Azure Application Gateway WAF',
    kind: 'block',
    on: 'error',
    status: [403],
    body: [/<h1>403 Forbidden<\/h1>[\s\S]{0,400}Microsoft-Azure-Application-Gateway\/v2/i],
  },
  // Google's front end, never an origin: origin bodies pass through as-is.
  // 404 / 502 of the same template have other causes, so only 403.
  {
    vendor: 'Google Cloud Armor',
    kind: 'block',
    on: 'error',
    status: [403],
    header: ['via', /\b1\.1 google\b/i],
    body: [/^\s*<!doctype html><meta charset="utf-8"><meta name=viewport content="width=device-width, initial-scale=1"><title>403<\/title>403 forbidden\s*$/i],
  },
  {
    vendor: 'StackPath',
    kind: 'block',
    on: 'error',
    body: [/An action has triggered the service and blocked your request/i],
  },
  {
    vendor: 'Cloudbric',
    kind: 'block',
    on: 'error',
    body: [/Your request was blocked by Cloudbric/i, /<title>Cloudbric.{0,5}ERROR!/i],
  },
  { vendor: 'Nexusguard', kind: 'block', on: 'error', body: [/nexusguard\.com\/wafpage\//i] },
  { vendor: 'Zenedge', kind: 'block', on: 'error', body: [/\/__zenedge\//i] },
  { vendor: 'SiteLock', kind: 'block', on: 'error', body: [/SiteLock incident ID/i] },
  { vendor: 'GoDaddy Website Firewall', kind: 'block', on: 'error', body: [/<title>Access Denied - GoDaddy Website Firewall/i] },
  {
    vendor: 'Grey Wizard',
    kind: 'block',
    on: 'error',
    body: [/We.ve detected attempted attack or non standard traffic from your ip address/i],
  },
  { vendor: 'DDoS-Guard', kind: 'challenge', on: 'any', body: [/\/\.well-known\/ddos-guard\//i] },
  { vendor: 'Qrator', kind: 'challenge', on: 'any', body: [/\/__qrator\/qauth/i] },
  {
    vendor: 'Alibaba Cloud WAF',
    kind: 'block',
    on: 'error',
    body: [
      /your request has been blocked as it may cause potential threats to the server.s security/i,
      /errors\.aliyun(?:dun)?\.com/i,
      /alicdn\.com\/sd-base\/static\/[\d.]+\/image\/405\.png/i,
    ],
  },
  {
    vendor: 'Tencent Cloud WAF',
    kind: 'block',
    on: 'any',
    body: [/waf\.tencent-?cloud\.com\/(?:403|501)page\.html/i, /腾讯云Web应用防火墙/],
  },
  { vendor: 'Huawei Cloud WAF', kind: 'block', on: 'error', body: [/hws_security@/i] },
  { vendor: 'Baidu Yunjiasu', kind: 'challenge', on: 'any', body: [/\/\.well-known\/yunjiasu-cgi\//i] },
  { vendor: 'Yundun', kind: 'block', on: 'error', body: [/Blocked by YUNDUN Cloud WAF/i] },

  // --- Hosting --------------------------------------------------------------
  {
    vendor: 'SiteGround',
    kind: 'challenge',
    on: 'any',
    body: [/\/\.well-known\/sgcaptcha\//i, /Our system thinks you might be a robot!/i, /access is restricted due to a security rule/i],
  },
  {
    vendor: 'Imunify360',
    kind: 'challenge',
    on: 'any',
    body: [/id="wsidchk-form"/i, /[?&]wsidchk=/i],
  },
  {
    vendor: 'Imunify360',
    kind: 'block',
    on: 'error',
    body: [
      /Access denied by Imunify360 bot-protection/i,
      /protected\W{1,3}by\W{1,3}imunify360/i,
      /powered\W{1,3}by\W{1,3}imunify360/i,
      /imunify360[-_ ]preloader/i,
    ],
  },
  { vendor: 'LiteSpeed reCAPTCHA', kind: 'challenge', on: 'any', body: [/\/\.lsrecap\/_?recaptcha/i] },
  { vendor: 'BitNinja', kind: 'challenge', on: 'any', body: [/Security check by BitNinja/i, /Visitor anti-robot validation/i] },

  // --- WordPress plugins ----------------------------------------------------
  // Their text goes through gettext, so untranslated tokens (URLs, ids,
  // asset paths) come first where the plugin has one.
  {
    vendor: 'Wordfence',
    kind: 'rate-limit',
    on: 'error',
    body: [/Exceeded the maximum (?:global requests|number of (?:page not found errors|requests)) per minute/i],
  },
  {
    vendor: 'Wordfence',
    kind: 'block',
    on: 'error',
    body: [
      /wordfence\.com\/help\/\?query=locked-out/i,
      /Generated by Wordfence/i,
      /broke one of (?:the )?Wordfence (?:advanced )?blocking rules/i,
      /Your access to this site (?:has been limited by the site owner|was blocked by Wordfence)/i,
      /A potentially unsafe operation has been detected in your request to this site/i,
    ],
  },
  {
    vendor: 'Solid Security',
    kind: 'block',
    on: 'error',
    body: [/<div id="lockout_screen">/i, /templates\/lockout\/lockout\.css/i, /You have been locked out of this site/i],
  },
  {
    vendor: 'Shield Security',
    kind: 'rate-limit',
    on: 'error',
    body: [/There have been too many requests from your IP address\./i],
  },
  {
    vendor: 'Shield Security',
    kind: 'block',
    on: 'error',
    body: [
      /shield_vars_blockpage/,
      /shield-blockpage\.bundle\.js/i,
      /\| Shield Security<\/title>/i,
      /You were blocked by the Shield/i,
      /remaining transgression\(s\) against this site/i,
    ],
  },
  {
    vendor: 'MalCare',
    kind: 'block',
    on: 'error',
    body: [/firewall.{0,15}powered.by.{0,15}malcare/i, /blocked because of malicious activities/i],
  },
  {
    vendor: 'WP Cerber',
    kind: 'block',
    on: 'error',
    body: [/your request looks suspicious or similar to automated/i, /We.re sorry.{0,10}you are not allowed to proceed/i],
  },
  {
    vendor: 'NinjaFirewall',
    kind: 'block',
    on: 'error',
    body: [/<title>NinjaFirewall.{0,10}\d{3}.forbidden/i, /For security reasons?.{0,10}it was blocked and logged/i],
  },
  {
    vendor: 'Sucuri',
    kind: 'block',
    on: 'error',
    body: [
      /Access Denied.{0,6}Sucuri Website Firewall/i,
      /<title>Sucuri WebSite Firewall.{0,20}Access Denied/i,
      /cdn\.sucuri\.net\/sucuri[-_]firewall[-_]block\.css/i,
    ],
  },
  { vendor: 'SecuPress', kind: 'block', on: 'error', body: [/<(?:title|h\d)>SecuPress/i] },
  { vendor: 'BulletProof Security', kind: 'block', on: 'error', body: [/\bbpsMessage\b/] },
  { vendor: 'RSFirewall', kind: 'block', on: 'error', body: [/com_rsfirewall_(?:\d{3}_forbidden|event)/i] },
  { vendor: 'CrawlProtect', kind: 'block', on: 'error', body: [/<title>crawlprotect/i, /this site is protected by crawlprotect/i] },
  {
    vendor: 'WPMU DEV',
    kind: 'block',
    on: 'error',
    body: [/<h1>Whoops, this request has been blocked!/i, /This request has been deemed suspicious/i],
  },
  { vendor: 'aeSecure', kind: 'block', on: 'error', body: [/aesecure_denied\.png/i] },

  // --- Server modules / appliances ------------------------------------------
  {
    vendor: 'ModSecurity',
    kind: 'block',
    on: 'error',
    body: [
      /This error was generated by Mod.?Security/i,
      /rules of the mod.security.module/i,
      /mod.security.rules triggered/i,
      /\/modsecurity[-_]errorpage\//i,
    ],
  },
  { vendor: 'NAXSI', kind: 'block', on: 'error', body: [/blocked by naxsi/i] },
  {
    vendor: 'NetScaler AppFirewall',
    kind: 'block',
    on: 'error',
    body: [/(?:NS Transaction|AppFW Session) id/i, /Violation Category.{0,5}APPFW_/i],
  },
  {
    vendor: 'FortiWeb',
    kind: 'block',
    on: 'error',
    body: [[/fgd_icon/i, /web.page.blocked/i, /attack.id/i]],
  },
  { vendor: 'FortiGuard', kind: 'block', on: 'error', body: [/FortiGuard Intrusion Prevention/i, /\/\/globalurl\.fortinet\.net/i] },
  {
    vendor: 'Sophos UTM',
    kind: 'block',
    on: 'error',
    body: [/Powered by.?(?:Sophos)? UTM Web Protection/i, /incident was logged with the following log identifier/i],
  },
  { vendor: 'Palo Alto', kind: 'block', on: 'error', body: [/Palo Alto Next Generation Security Platform/i] },
  { vendor: 'SonicWall', kind: 'block', on: 'error', body: [/<(?:title|h\d)>Web Site Blocked/i, /\bnsa_banner\b/i] },
  {
    vendor: 'Radware AppWall',
    kind: 'block',
    on: 'error',
    body: [/CloudWebSec\.radware\.com/i, /<title>Unauthorized Request Blocked/i, /because we have detected unauthorized activity/i],
  },
  {
    vendor: 'Reblaze',
    kind: 'block',
    on: 'error',
    body: [[/access denied \(\d{3}\)/i, /current session has been terminated/i, /do not hesitate to contact us/i]],
  },
  { vendor: 'Airlock', kind: 'block', on: 'error', body: [/server detected a syntax error in your request/i] },
  { vendor: 'WebKnight', kind: 'block', on: 'error', body: [/WebKnight Application Firewall Alert/i] },
  { vendor: 'URLScan', kind: 'block', on: 'error', body: [/Rejected[-_]By[-_]UrlScan/i] },
  { vendor: 'WebSEAL', kind: 'block', on: 'error', body: [/This is a WebSEAL error message template file/i] },
  { vendor: 'dotDefender', kind: 'block', on: 'error', body: [/dotDefender Blocked Your Request/i] },
  { vendor: 'Zscaler', kind: 'block', on: 'error', body: [/Internet Security by ZScaler/i, /Zscaler to protect you from internet threats/i] },

  // --- Bot walls ------------------------------------------------------------
  // Anubis answers 200 by default, for the challenge and the deny page alike.
  {
    vendor: 'Anubis',
    kind: 'block',
    on: 'any',
    body: [[/<title>Oh noes!<\/title>/i, /Access Denied: error code/i]],
  },
  {
    vendor: 'Anubis',
    kind: 'challenge',
    on: 'any',
    body: [/<script id="anubis_challenge"/i, /<script id="anubis_version"/i, /\/\.within\.website\/x\/cmd\/anubis\//i],
  },
  // go-away's challenge answers 418.
  { vendor: 'go-away', kind: 'challenge', on: 'any', body: [/git\.gammaspectra\.live\/git\/go-away/i] },
  { vendor: 'Vercel', kind: 'challenge', on: 'any', body: [/<title>Vercel Security Checkpoint<\/title>/i] },
  // Cloudflare's challenge page script — the JS detections Cloudflare
  // injects into normal pages use `__CF$cv$params`, not this.
  { vendor: 'Cloudflare', kind: 'challenge', on: 'any', body: [/window\._cf_chl_opt\b/] },
];

// ---------------------------------------------------------------------------
// Cloudflare error pages
// ---------------------------------------------------------------------------

/** Cloudflare 1xxx codes that are a block on the client (developers.
 *  cloudflare.com, "Cloudflare 1xxx errors", `access_denied`). */
const CF_BLOCK_CODES = new Set([1005, 1006, 1007, 1008, 1010, 1012, 1020, 1106, 1107, 1108, 1109]);
/** Country / region ban. */
const CF_GEO_CODES = new Set([1009]);
/** The site owner's rate-limiting rule. 1025 / 1027 / 1200 are plan and
 *  cache limits — real errors, not protection. */
const CF_RATE_CODES = new Set([1015]);

/**
 * A Cloudflare-generated error page that is a block, or null. Every other
 * Cloudflare code (52x origin errors, 1000–1004 DNS, 1101 Workers, …) is a
 * real error and stays one. Comes as HTML (`cf-error-code` span), as the
 * plain-text `error code: 1020` sent to non-browser clients, or as JSON
 * (`"cloudflare_error": true`). The WAF's own block page has no code.
 */
function cloudflareErrorPage(status: number, headers: HeaderGetter, body: string): BlockVerdict | null {
  if (!headers.get('cf-ray') && !/cloudflare/i.test(headers.get('server') ?? '')) return null;
  const code = Number(
    /<span class="cf-error-code">(\d{4})<\/span>/.exec(body)?.[1] ??
      /^\s*error code: (\d{4})\s*$/.exec(body)?.[1] ??
      (/"cloudflare_error"\s*:\s*true/.test(body) ? /"error_code"\s*:\s*(\d{4})/.exec(body)?.[1] : undefined) ??
      Number.NaN,
  );
  if (CF_BLOCK_CODES.has(code)) return verdict('Cloudflare', 'block', status, `error ${code}`);
  if (CF_GEO_CODES.has(code)) return verdict('Cloudflare', 'geo', status, `error ${code}`);
  if (CF_RATE_CODES.has(code)) return verdict('Cloudflare', 'rate-limit', status, `error ${code}`);
  if (!Number.isNaN(code)) return null;
  // The WAF's custom / managed-rule block: "Sorry, you have been blocked".
  if (/data-translate="block_headline"/.test(body) || /<title>Attention Required! \| Cloudflare<\/title>/i.test(body)) {
    return verdict('Cloudflare', 'block', status);
  }
  return null;
}

/**
 * Whether an error response can be a block page worth reading. Any status
 * >= 400 qualifies — vendors answer 400/403/405/406/418/428/429/430/503 and
 * more — as long as the body is text; an image or archive is never one.
 */
export function wantsBlockPageBody(status: number, headers: HeaderGetter): boolean {
  if (status < 400) return false;
  const type = (headers.get('content-type') ?? '').toLowerCase();
  return type === '' || /html|text|json|xml/.test(type);
}

function hasMarker(markers: readonly Marker[], body: string): boolean {
  return markers.some((m) => (m instanceof RegExp ? m.test(body) : m.every((re) => re.test(body))));
}

function matchesSignature(sig: PageSignature, status: number, headers: HeaderGetter, body: string): boolean {
  if (sig.status && !sig.status.includes(status)) return false;
  if (sig.header && !sig.header[1].test(headers.get(sig.header[0]) ?? '')) return false;
  return hasMarker(sig.body, body);
}

/**
 * The vendor block page an error response (status >= 400) carries, or null.
 * `body` is the head of the response body (see {@link BLOCK_PAGE_SCAN_BYTES}).
 */
export function detectBlockPage(status: number, headers: HeaderGetter, body: string): BlockVerdict | null {
  if (status < 400 || !body) return null;
  const cf = cloudflareErrorPage(status, headers, body);
  if (cf) return cf;
  for (const sig of PAGE_SIGNATURES) {
    if (matchesSignature(sig, status, headers, body)) return verdict(sig.vendor, sig.kind, status);
  }
  return null;
}

// ---------------------------------------------------------------------------
// 2xx interstitials
// ---------------------------------------------------------------------------

/** Titles of bot-challenge interstitials, matched on the whole title. */
const CHALLENGE_TITLES = [
  /^one moment, please\.{0,3}$/i,
  /^just a moment\.{0,3}$/i,
  /^attention required! \| cloudflare$/i,
  /^checking your browser\b/i,
  /^ddos-guard$/i,
  /^vercel security checkpoint$/i,
  /^pardon our interruption\.{0,3}$/i,
  /^access to this page has been denied\.?$/i,
  /^robot challenge screen$/i,
  /^making sure you['’]re not a bot!?$/i,
  /^checking you are not a bot\.{0,3}$/i,
  /^radware captcha page$/i,
];

/** Above this many words a page is content, whatever its title says. */
const CHALLENGE_MAX_WORDS = 60;

/**
 * Above this many words a page is content even when it carries a vendor
 * marker. Higher than {@link CHALLENGE_MAX_WORDS}: a marker such as
 * `<script id="anubis_challenge"` is far less ambiguous than a title, and
 * some walls explain themselves at length (Anubis' page runs ~200 words).
 */
const INTERSTITIAL_MAX_WORDS = 400;

/**
 * A bot challenge served with 2xx and no marking header, which
 * {@link detectBotProtection} cannot see: Anubis, Akamai and F5 answer 200,
 * SiteGround 202, and some servers' protection answers every request with a
 * "One moment, please..." page. Recognised by an interstitial's title on a
 * page with next to no text, or by a vendor marker in `html` on a short page,
 * so a real page that shares the title (or quotes the marker) still counts
 * as a page. Taken for content, one crawl of thinpo.com reported 521
 * indexable pages titled "One moment, please..." and none of its links.
 */
export function detectChallengePage(
  status: number,
  title: string | null,
  wordCount: number,
  html?: string,
): string | null {
  if (status < 200 || status >= 300) return null;
  if (title && wordCount <= CHALLENGE_MAX_WORDS) {
    const t = title.replace(/\s+/g, ' ').trim();
    if (CHALLENGE_TITLES.some((re) => re.test(t))) return `challenge page "${t}" (HTTP ${status})`;
  }
  if (!html || wordCount > INTERSTITIAL_MAX_WORDS) return null;
  const head = html.length > BLOCK_PAGE_SCAN_BYTES ? html.slice(0, BLOCK_PAGE_SCAN_BYTES) : html;
  for (const sig of PAGE_SIGNATURES) {
    if (sig.on !== 'any' || sig.header || sig.status) continue;
    if (hasMarker(sig.body, head)) return verdict(sig.vendor, sig.kind, status).label;
  }
  return null;
}
