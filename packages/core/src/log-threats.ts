/**
 * Access-log threat classifier — the engine behind the Log Analyzer's
 * "Suspicious Requests" tab.
 *
 * A site owner reading raw logs spots SQL-injection payloads in the 404s;
 * this module does the same thing per line during the single ingest
 * pass, so the analyzer can show *which IP sent what* without keeping a
 * copy of every hit. It is deliberately a signature scorer, not a WAF:
 *
 *   - The request target is percent-decoded (twice, for double-encoded
 *     payloads), `+` is read as a space, and inline SQL comments used
 *     for evasion (`union` / `select` split by a comment) are collapsed
 *     before matching.
 *   - Rules are multi-token patterns with weights. A line is flagged
 *     when its summed weight reaches {@link THREAT_THRESHOLD}; lone weak
 *     hints (a stray quote, a `select` in a search term, `{{utm}}` from a
 *     broken mail template) stay below it. Naive keyword matching would
 *     flag the owner's own `wp-admin/update.php?action=update-selected`.
 *   - Everything is offline and pure; the optional reverse-DNS owner
 *     check is the only I/O and is opt-in.
 */

import { promises as dns } from 'node:dns';
import type { LogThreatCategory } from '@freecrawl/shared-types';

export interface ThreatRule {
  id: string;
  category: LogThreatCategory;
  weight: number;
  re: RegExp;
  /** Only counts for this HTTP method (e.g. a POST to xmlrpc.php). */
  method?: string;
  /** Match the raw (still-encoded) target instead of the decoded one. */
  raw?: boolean;
}

export interface ThreatMatch {
  category: LogThreatCategory;
  /** Matched rule ids, strongest first. */
  rules: string[];
  score: number;
  /** Fragment the strongest rule matched (≤ 120 chars). */
  evidence: string;
  /** Decoded target (what the UI shows as the payload). */
  decoded: string;
}

/** Minimum summed rule weight for a line to count as a threat. */
export const THREAT_THRESHOLD = 5;

const EVIDENCE_MAX = 120;

function rule(
  id: string,
  category: LogThreatCategory,
  weight: number,
  re: RegExp,
  extra: Pick<ThreatRule, 'method' | 'raw'> = {},
): ThreatRule {
  return { id, category, weight, re, ...extra };
}

/**
 * Cheap gate run on the raw target before the rule set. Any line without
 * one of these characters / path fragments cannot match a rule, and on a
 * WordPress log that is the vast majority of lines.
 */
const PREFILTER =
  /['"<>;|`(){}\\$*]|%2[27]|%3[ce]|%2[89]|%00|%0[ad]|%25|union|select|sleep|benchmark|updatexml|extractvalue|information_schema|waitfor|concat|order.by|script|onerror|onload|javascript|alert|document\.|fromcharcode|etc\/|system32|\.\.|\.env|\.git|\.svn|\.hg|\.ssh|\.aws|\.htaccess|\.htpasswd|\.ds_store|\.sql|\.bak|\.old|\.orig|\.swp|\.zip|\.tar|\.tgz|\.gz|\.rar|\.7z|\.pem|\.key|\.log|wp-config|xmlrpc|wp-login|phpmyadmin|adminer|phpunit|eval-stdin|cgi-bin|actuator|console|manager\/html|solr|jenkins|hudson|wlwmanifest|autodiscover|\/owa\/|\/ecp\/|\/ews\/|id_rsa|shell|c99|r57|wso|backup|dump|passwd|win\.ini|boot\.ini|proc\/|server-status|server-info|phpinfo|jndi|debug\.log|config\.|credentials|secrets|invoker|druid|ignition|telescope|typo3|joomla|drupal|magento|administrator/i;

const RULES: ThreatRule[] = [
  // ---- SQL injection -------------------------------------------------
  rule('sqli-union-select', 'sqli', 9, /union\s+(all\s+|distinct\s+)?select\b/i),
  rule(
    'sqli-error-fn',
    'sqli',
    9,
    /\b(updatexml|extractvalue|benchmark|pg_sleep|load_file|xp_cmdshell|sp_executesql)\s*\(/i,
  ),
  rule('sqli-sleep', 'sqli', 8, /\bsleep\s*\(\s*\d/i),
  rule('sqli-waitfor', 'sqli', 8, /\bwaitfor\s+delay\b/i),
  rule('sqli-schema', 'sqli', 8, /\binformation_schema\b|\bsysobjects\b|\bpg_catalog\b/i),
  rule(
    'sqli-stacked',
    'sqli',
    8,
    /;\s*(drop|insert|update|delete|alter|truncate|create|exec|execute)\b/i,
  ),
  rule('sqli-quote-logic', 'sqli', 7, /'\s*(or|and)\s+['"\d(]/i),
  rule('sqli-quote-tautology', 'sqli', 6, /'\s*=\s*'|"\s*=\s*"/),
  rule('sqli-tautology', 'sqli', 5, /\b(or|and)\s+\d+\s*=\s*\d+/i),
  rule('sqli-select-from', 'sqli', 4, /\bselect\b[\s\S]{0,120}?\bfrom\b/i),
  rule('sqli-comment', 'sqli', 4, /'\s*(--|#|\/\*)|\)\s*--|--\s*-?$/),
  rule('sqli-concat', 'sqli', 4, /\b(concat|group_concat|concat_ws|char|chr|cast|convert)\s*\(/i),
  rule('sqli-order-by', 'sqli', 3, /\border\s+by\s+\d+/i),
  rule('sqli-hex', 'sqli', 2, /0x[0-9a-f]{6,}/i),
  // ---- Cross-site scripting -----------------------------------------
  rule('xss-script-tag', 'xss', 8, /<\s*\/?\s*script\b/i),
  rule(
    'xss-event-handler',
    'xss',
    6,
    /\bon(error|load|mouseover|mouseenter|focus|click|input|animationstart|toggle|pointerover)\s*=/i,
  ),
  rule(
    'xss-dom',
    'xss',
    6,
    /document\s*\.\s*(cookie|location|write|domain)|window\s*\.\s*location|string\.fromcharcode/i,
  ),
  rule(
    'xss-tag',
    'xss',
    5,
    /<\s*(img|svg|iframe|body|object|embed|video|audio|details|math|marquee)\b/i,
  ),
  rule('xss-js-uri', 'xss', 5, /javascript\s*:/i),
  rule('xss-alert', 'xss', 4, /\b(alert|prompt|confirm)\s*\(/i),
  // ---- Path traversal / local file inclusion --------------------------
  rule('traversal-etc', 'traversal', 9, /\/etc\/(passwd|shadow|hosts|group|issue)\b/i),
  rule('traversal-deep', 'traversal', 8, /(\.\.[\\/]){2,}/),
  rule('traversal-windows', 'traversal', 8, /\b(win\.ini|boot\.ini|system32)\b|c:\\windows/i),
  rule('traversal-proc', 'traversal', 8, /\/proc\/(self|version|cpuinfo)\b/i),
  rule('traversal-wrapper', 'traversal', 8, /\b(php|file|data|expect|zip|phar):\/\//i),
  rule('traversal-null', 'traversal', 6, /\0/),
  rule('traversal-single', 'traversal', 4, /\.\.[\\/]/),
  // ---- Command injection / template injection / log4shell ------------
  rule('cmdi-jndi', 'cmdi', 10, /\$\{\s*jndi\s*:|jndi:(ldap|rmi|dns|iiop)/i),
  rule(
    'cmdi-shell',
    'cmdi',
    8,
    /[;|&`]\s*(cat|ls|id|whoami|wget|curl|bash|sh|nc|ncat|python3?|perl|php|ruby|echo|uname|ping|nslookup|dig|rm|chmod|powershell|cmd\.exe|certutil)\b/i,
  ),
  rule(
    'cmdi-runtime',
    'cmdi',
    8,
    /\b(runtime\.exec|processbuilder|passthru|shell_exec|system|popen|proc_open|eval|assert|base64_decode)\s*\(/i,
  ),
  rule('cmdi-subshell', 'cmdi', 5, /\$\(/),
  // One rule for every unrendered-template shape: a mail template that
  // leaked `?utm={{campaign}}&src=${source}` is one weak hint, not two.
  rule('cmdi-template', 'cmdi', 3, /\$\{[^}]*\}|\{\{[^}]*\}\}|\{%[^%]*%\}|<%[^%]*%>/),
  // ---- Scanner / vulnerability probes ---------------------------------
  rule('scan-phpunit', 'scanner', 9, /vendor\/phpunit|eval-stdin\.php/i),
  rule('scan-wp-config', 'scanner', 8, /wp-config\.php|wp-config\.(bak|old|txt|save|orig|swp)/i),
  rule(
    'scan-dotfile',
    'scanner',
    7,
    /(^|\/)\.(env|git|svn|hg|ssh|aws|docker|npmrc|bash_history|htpasswd|htaccess|ds_store)\b/i,
  ),
  rule(
    'scan-webshell',
    'scanner',
    7,
    /\/(shell|cmd|c99|r57|wso|alfa|webshell|b374k|filemanager)\.php\b/i,
  ),
  rule(
    'scan-phpmyadmin',
    'scanner',
    6,
    /phpmyadmin|\/pma\/|\/myadmin|\/adminer|\/mysqladmin|\/dbadmin/i,
  ),
  rule('scan-debug-log', 'scanner', 6, /\/wp-content\/debug\.log\b/i),
  rule(
    'scan-admin-consoles',
    'scanner',
    6,
    /\/actuator\/|\/manager\/html|\/solr\/|\/jenkins\b|\/hudson\b|\/jmx-console|\/web-console|\/invoker\/|\/druid\/|\/_ignition\/|\/telescope\/|\/debug\/default\/view|\/api\/v1\/pods|\/console\/?(\?|$)/i,
  ),
  rule('scan-wlw', 'scanner', 5, /wlwmanifest\.xml/i),
  rule('scan-phpinfo', 'scanner', 5, /\/(phpinfo|info)\.php\b/i),
  rule('scan-xmlrpc', 'scanner', 4, /\/xmlrpc\.php\b/i),
  rule('scan-xmlrpc-post', 'scanner', 3, /\/xmlrpc\.php\b/i, { method: 'POST' }),
  rule('scan-wp-login', 'scanner', 2, /\/wp-login\.php\b/i),
  rule('scan-wp-login-post', 'scanner', 3, /\/wp-login\.php\b/i, { method: 'POST' }),
  rule(
    'scan-exchange',
    'scanner',
    4,
    /\/autodiscover\/autodiscover\.(xml|json)|\/owa\/|\/ecp\/|\/ews\//i,
  ),
  rule(
    'scan-cms-probe',
    'scanner',
    4,
    /\/administrator\/(index\.php|manifests)|\/magento_version|\/typo3\/|\/joomla|\/drupal|\/wp-content\/plugins\/[^/]+\/readme\.txt/i,
  ),
  rule(
    'scan-config-file',
    'scanner',
    4,
    /\/(config|configuration|settings|database|db|credentials|secrets|application)\.(php|json|yml|yaml|xml|ini|env|txt)(\.|~|\b)/i,
  ),
  rule('scan-server-status', 'scanner', 3, /\/server-status|\/server-info|\/nginx_status/i),
  rule('scan-cgi', 'scanner', 3, /\/cgi-bin\//i),
  // ---- Sensitive files --------------------------------------------------
  rule(
    'file-keys',
    'sensitive-file',
    8,
    /\/id_rsa\b|\/id_dsa\b|\/\.ssh\/|\/\.aws\/credentials|\/\.docker\/config\.json|\/\.git-credentials/i,
  ),
  rule(
    'file-backup',
    'sensitive-file',
    6,
    /\/[\w.-]*(backup|bak|dump|db|database|site|www|html|public_html|wwwroot)[\w.-]*\.(zip|tar|tar\.gz|tgz|gz|rar|7z|sql|sql\.gz|bak)\b/i,
  ),
  rule(
    'file-ext',
    'sensitive-file',
    4,
    /\.(sql|bak|old|orig|swp|save|log|env|pem|key|p12|pfx|kdbx)(\?|$)/i,
  ),
  // ---- Anomalies ----------------------------------------------------------
  rule('anomaly-long', 'anomaly', 4, /^[\s\S]{1500,}$/),
  rule('anomaly-encoded', 'anomaly', 3, /(?:%[0-9a-f]{2}[^%]*){60,}/i, { raw: true }),
  rule('anomaly-double-encoded', 'anomaly', 3, /%25[0-9a-f]{2}/i, { raw: true }),
];

/** HTTP methods no browser or crawler sends to a public site. */
const ANOMALOUS_METHODS = new Set(['TRACE', 'TRACK', 'DEBUG', 'CONNECT']);

/** Rules exported for tests / documentation — not for mutation. */
export const THREAT_RULES: readonly ThreatRule[] = RULES;

/** `decodeURIComponent` that never throws: malformed runs are left as-is. */
function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s.replace(/(?:%[0-9a-fA-F]{2})+/g, (run) => {
      try {
        return decodeURIComponent(run);
      } catch {
        return run;
      }
    });
  }
}

/**
 * Percent-decode a request target up to two rounds, so a double-encoded
 * payload (`%2527` → `%27` → `'`) reads the same as a plain one.
 */
export function decodeTarget(raw: string): string {
  let cur = raw;
  for (let round = 0; round < 2; round++) {
    if (!/%[0-9a-fA-F]{2}/.test(cur)) break;
    const next = safeDecode(cur);
    if (next === cur) break;
    cur = next;
  }
  return cur;
}

/** Decoded target normalised for matching: `+` → space, inline comments → space. */
function normaliseForMatch(decoded: string): string {
  return decoded.replace(/\+/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/**
 * Score one request. Returns null when nothing matched or the summed
 * weight stays under {@link THREAT_THRESHOLD}.
 */
export function classifyRequest(req: {
  path: string | null;
  method: string | null;
}): ThreatMatch | null {
  const raw = req.path;
  if (!raw) return null;
  const method = req.method ? req.method.toUpperCase() : null;
  const methodAnomaly = method !== null && ANOMALOUS_METHODS.has(method);
  if (!methodAnomaly && !PREFILTER.test(raw)) return null;

  const decoded = decodeTarget(raw);
  const text = normaliseForMatch(decoded);

  const hits: Array<{ rule: ThreatRule; evidence: string }> = [];
  for (const r of RULES) {
    if (r.method && r.method !== method) continue;
    const m = r.re.exec(r.raw ? raw : text);
    if (m) hits.push({ rule: r, evidence: m[0] });
  }
  if (methodAnomaly) {
    hits.push({
      rule: { id: 'anomaly-method', category: 'anomaly', weight: 5, re: /$^/ },
      evidence: method!,
    });
  }
  if (hits.length === 0) return null;

  hits.sort((a, b) => b.rule.weight - a.rule.weight);
  const score = hits.reduce((s, h) => s + h.rule.weight, 0);
  if (score < THREAT_THRESHOLD) return null;
  const top = hits[0]!;
  const evidence = top.evidence.trim();
  return {
    category: top.rule.category,
    rules: hits.map((h) => h.rule.id),
    score,
    evidence:
      evidence.length > EVIDENCE_MAX ? `${evidence.slice(0, EVIDENCE_MAX - 1)}…` : evidence,
    decoded,
  };
}

/**
 * Search-engine infrastructure whose reverse-DNS names prove the IP is the
 * engine's own — not a rentable cloud VM (so `googleusercontent.com` is
 * deliberately absent). A flagged request from one of these was relayed
 * through the engine (Google Lens / Translate / a fetch of a crafted URL);
 * blocking the IP would block the engine.
 */
const IP_OWNERS: ReadonlyArray<{ owner: string; suffixes: string[] }> = [
  { owner: 'google', suffixes: ['.googlebot.com', '.google.com', '.1e100.net'] },
  { owner: 'bing', suffixes: ['.search.msn.com'] },
  { owner: 'yandex', suffixes: ['.yandex.ru', '.yandex.net', '.yandex.com'] },
  { owner: 'apple', suffixes: ['.applebot.apple.com'] },
  { owner: 'duckduckgo', suffixes: ['.duckduckgo.com'] },
];

/** Map a reverse-DNS hostname to its owner label, or null. Pure — tested. */
export function ownerOfHostname(hostname: string): string | null {
  const h = hostname.toLowerCase();
  for (const o of IP_OWNERS) {
    if (o.suffixes.some((s) => h.endsWith(s))) return o.owner;
  }
  return null;
}

/**
 * Forward-confirmed reverse-DNS owner lookup: PTR must land in a known
 * engine domain AND resolve back to the same IP. Any DNS failure → null.
 */
export async function classifyIpOwner(ip: string, timeoutMs = 3000): Promise<string | null> {
  if (!ip) return null;
  try {
    const hostnames = await withTimeout(dns.reverse(ip), timeoutMs);
    for (const h of hostnames) {
      const owner = ownerOfHostname(h);
      if (!owner) continue;
      const addrs = await withTimeout(dns.resolve(h), timeoutMs).catch(() => [] as string[]);
      if (addrs.includes(ip)) return owner;
    }
    return null;
  } catch {
    return null;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('dns-timeout')), ms)),
  ]);
}
