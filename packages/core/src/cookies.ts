/**
 * Set-Cookie header analysis. We only inspect the security flags Google /
 * OWASP look for in audits (Secure, HttpOnly, SameSite); the cookie value
 * itself is never inspected or stored — that would be a privacy violation
 * for any tool that doesn't need the cookie's content.
 *
 * The undici `Headers.get('set-cookie')` returns a single comma-joined
 * string when multiple Set-Cookie response headers are present. Naive
 * splitting on `,` would corrupt cookies whose `Expires` attribute uses
 * the RFC 1123 date format (which contains `,`) — so we use the standard
 * trick of splitting on `,` only when the next non-space token looks like
 * `name=value` (i.e. starts a new cookie).
 */

export interface CookieSecuritySummary {
  /** Total Set-Cookie response headers seen (one per cookie). */
  count: number;
  /** Cookies that DON'T set the `Secure` flag. */
  insecureCount: number;
  /** Cookies that DON'T set `HttpOnly`. */
  noHttpOnlyCount: number;
  /** Cookies that DON'T set `SameSite=…`. */
  noSameSiteCount: number;
}

/**
 * Split a comma-joined header into individual cookies. Naive `split(',')`
 * breaks Expires dates, so we walk forward looking for `,` followed by
 * `<token>=` which is the only legal cookie-start sequence.
 */
function splitSetCookieHeader(joined: string): string[] {
  const out: string[] = [];
  let buf = '';
  for (let i = 0; i < joined.length; i++) {
    const ch = joined[i];
    if (ch === ',') {
      // Look ahead: is the next non-space chunk a `cookie-name=` start?
      let j = i + 1;
      while (j < joined.length && joined[j] === ' ') j++;
      const rest = joined.slice(j);
      // Cookie name = RFC 6265 token: letters/digits and !#$%&'*+-.^_`|~
      // followed by `=`. Anything else (e.g. `Mon, 01 Jan…`) is a date in
      // an Expires attribute — keep accumulating into the current buffer.
      if (/^[!#$%&'*+\-.^_`|~A-Za-z0-9]+\s*=/.test(rest)) {
        out.push(buf.trim());
        buf = '';
        continue;
      }
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

export function analyseCookies(rawCookies: readonly string[]): CookieSecuritySummary {
  let count = 0;
  let insecureCount = 0;
  let noHttpOnlyCount = 0;
  let noSameSiteCount = 0;
  for (const cookie of rawCookies) {
    if (!cookie) continue;
    count++;
    const lower = cookie.toLowerCase();
    // Attribute boundary is `;` — checking for `; secure` etc. is more
    // robust than substring match (which would false-positive on values
    // like `s=secure`). Tail trim handles `; secure` at end-of-cookie.
    const hasFlag = (flag: string): boolean =>
      lower.includes(`; ${flag}`) || lower.endsWith(`;${flag}`) || lower.includes(`;${flag};`);
    const hasAttr = (attr: string): boolean =>
      lower.includes(`; ${attr}=`) || lower.includes(`;${attr}=`);
    if (!hasFlag('secure')) insecureCount++;
    if (!hasFlag('httponly')) noHttpOnlyCount++;
    if (!hasAttr('samesite')) noSameSiteCount++;
  }
  return { count, insecureCount, noHttpOnlyCount, noSameSiteCount };
}

/**
 * Pull individual Set-Cookie strings from the response header bag we
 * already build for the URL Details panel. `undici` joins multiple
 * Set-Cookie response headers with `,` so we re-split. We also pick up
 * direct `set-cookie` entries when fetch implementations expose them
 * separately (Node native fetch does this).
 */
export function extractSetCookies(allHeaders: readonly [string, string][]): string[] {
  const cookies: string[] = [];
  for (const [name, value] of allHeaders) {
    if (name.toLowerCase() !== 'set-cookie') continue;
    if (!value) continue;
    cookies.push(...splitSetCookieHeader(value));
  }
  return cookies;
}
