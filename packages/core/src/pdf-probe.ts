import { fetch as undiciFetch } from 'undici';
import { defaultRequestHeaders } from './http-client.js';
import type { CrawlConfig } from '@freecrawl/shared-types';

/**
 * V2 Faz 16 — lightweight PDF metadata extractor.
 *
 * Fetches a PDF (ranged GET, first few MB) and pulls document metadata
 * without a full PDF-parsing library. Two sources, in priority order:
 *
 *   1. XMP packet — `<x:xmpmeta>…</x:xmpmeta>`. The XMP spec mandates the
 *      packet be an *uncompressed* UTF-8 stream so non-PDF tools can read
 *      it, which makes it reliably parseable with plain string scanning.
 *      We read `dc:title`, `dc:creator`, `xmp:CreateDate`, `pdf:Producer`.
 *   2. Info dictionary — `/Title (...)`, `/Author (...)`,
 *      `/CreationDate (D:...)`, `/Producer (...)`. Works when the Info dict
 *      is not inside a compressed object stream (common in simpler/older
 *      PDFs). Decodes PDF literal strings (UTF-16BE BOM, PDFDocEncoding ≈
 *      Latin-1, escape sequences) and hex `<...>` strings.
 *
 * Page count is best-effort: the `/Type /Pages … /Count N` root, else a
 * count of `/Type /Page` leaf markers. Null when neither is visible.
 *
 * This is deliberately a "smoke" extractor — in the same spirit as
 * FreeCrawl's hand-rolled AMP / structured-data validators — not a
 * spec-complete PDF parser. Metadata that lives only inside a compressed
 * stream of a very large PDF may be missed; that is the accepted coverage
 * trade-off for adding zero new dependencies.
 */

/** Bytes read per PDF — bounds memory + time. Metadata past this slice in
 *  a very large PDF is an accepted miss. */
const MAX_BYTES = 4 * 1024 * 1024;
const PROBE_TIMEOUT_MS = 12_000;

export interface PdfProbeResult {
  title: string | null;
  author: string | null;
  pageCount: number | null;
  creationDate: string | null;
  producer: string | null;
  /** Free-form error string when the fetch / read fails. Null otherwise. */
  error: string | null;
}

type PdfMetadata = Omit<PdfProbeResult, 'error'>;

const EMPTY: PdfMetadata = {
  title: null,
  author: null,
  pageCount: null,
  creationDate: null,
  producer: null,
};

export async function probePdfMetadata(
  url: string,
  config: Pick<CrawlConfig, 'userAgent' | 'acceptLanguage' | 'customHeaders' | 'auth'>,
): Promise<PdfProbeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const headers = defaultRequestHeaders(
      config.userAgent,
      config.acceptLanguage,
      config.customHeaders,
      config.auth,
    );
    headers['range'] = `bytes=0-${MAX_BYTES - 1}`;
    headers['accept-encoding'] = 'identity';
    headers['accept'] = 'application/pdf,*/*;q=0.8';

    const res = await undiciFetch(url, {
      method: 'GET',
      headers,
      redirect: 'follow',
      signal: controller.signal,
    });
    // 200 (Range ignored) and 206 (Partial Content) are both fine.
    if (res.status < 200 || res.status >= 300 || !res.body) {
      try {
        await res.body?.cancel();
      } catch {
        /* ignore */
      }
      return { ...EMPTY, error: `HTTP ${res.status}` };
    }

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      while (total < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value && value.length > 0) {
          chunks.push(value);
          total += value.length;
        }
      }
    } finally {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
    }
    if (total === 0) return { ...EMPTY, error: 'empty body' };

    const cap = Math.min(total, MAX_BYTES);
    const buf = Buffer.concat(chunks).subarray(0, cap);
    return { ...parsePdfMetadata(buf), error: null };
  } catch (err) {
    const name = (err as { name?: string } | null)?.name;
    const message =
      name === 'AbortError' || name === 'TimeoutError'
        ? `timed out after ${PROBE_TIMEOUT_MS / 1000}s`
        : err instanceof Error
          ? err.message
          : String(err);
    return { ...EMPTY, error: message };
  } finally {
    clearTimeout(timer);
  }
}

// ── Parsing ─────────────────────────────────────────────────────────────

function parsePdfMetadata(buf: Buffer): PdfMetadata {
  const out: PdfMetadata = { ...EMPTY };

  // 1. XMP packet — the reliable, uncompressed source.
  const xmp = extractXmp(buf);
  if (xmp) {
    out.title = xmpRdfLi(xmp, 'dc:title') ?? xmpSimple(xmp, 'dc:title');
    out.author = xmpRdfLi(xmp, 'dc:creator') ?? xmpSimple(xmp, 'dc:creator');
    out.producer = xmpSimple(xmp, 'pdf:Producer');
    const created = xmpSimple(xmp, 'xmp:CreateDate');
    if (created) out.creationDate = isoFromXmpDate(created);
  }

  // 2. Info-dictionary fallback for anything XMP didn't supply.
  const latin = buf.toString('latin1');
  if (!out.title) out.title = infoDictString(latin, 'Title');
  if (!out.author) out.author = infoDictString(latin, 'Author');
  if (!out.producer) out.producer = infoDictString(latin, 'Producer');
  if (!out.creationDate) {
    const cd = infoDictString(latin, 'CreationDate');
    if (cd) out.creationDate = isoFromPdfDate(cd);
  }

  // 3. Page count — best-effort.
  out.pageCount = extractPageCount(latin);

  return out;
}

/** Carve out the `<x:xmpmeta>…</x:xmpmeta>` packet and re-decode it as UTF-8. */
function extractXmp(buf: Buffer): string | null {
  const hay = buf.toString('latin1');
  const start = hay.indexOf('<x:xmpmeta');
  if (start < 0) return null;
  const endTag = '</x:xmpmeta>';
  const end = hay.indexOf(endTag, start);
  if (end < 0) return null;
  return buf.toString('utf8', start, end + endTag.length);
}

/** First `<rdf:li>` value inside an `<rdf:Alt>` / `<rdf:Seq>` property
 *  (dc:title, dc:creator). */
function xmpRdfLi(xmp: string, tag: string): string | null {
  const re = new RegExp(
    `<${escapeRe(tag)}\\b[\\s\\S]*?<rdf:li[^>]*>([\\s\\S]*?)</rdf:li>`,
    'i',
  );
  const m = re.exec(xmp);
  return m && m[1] !== undefined ? cleanXmp(m[1]) : null;
}

/** Simple element `<q>VALUE</q>` or compact attribute `q="VALUE"` form. */
function xmpSimple(xmp: string, qname: string): string | null {
  const el = new RegExp(
    `<${escapeRe(qname)}\\b[^>]*>([\\s\\S]*?)</${escapeRe(qname)}>`,
    'i',
  ).exec(xmp);
  if (el && el[1] !== undefined && el[1].trim() && !el[1].includes('<')) {
    return cleanXmp(el[1]);
  }
  const attr = new RegExp(`\\b${escapeRe(qname)}="([^"]*)"`, 'i').exec(xmp);
  if (attr && attr[1] !== undefined && attr[1].trim()) return cleanXmp(attr[1]);
  return null;
}

function cleanXmp(s: string): string | null {
  return tidy(decodeXmlEntities(s));
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, h: string) => fromCp(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d: string) => fromCp(parseInt(d, 10)))
    .replace(/&amp;/g, '&');
}

/**
 * Read a PDF string value for `/<key>` from the (latin1-decoded) bytes.
 * Handles literal `(...)` strings (balanced parens + escapes) and hex
 * `<...>` strings. Takes the LAST boundary-matched occurrence so an
 * incrementally-updated PDF's newest Info dict wins.
 */
function infoDictString(latin: string, key: string): string | null {
  const marker = `/${key}`;
  let idx = -1;
  let from = 0;
  for (;;) {
    const i = latin.indexOf(marker, from);
    if (i < 0) break;
    const after = latin[i + marker.length];
    if (after === undefined || !/[A-Za-z0-9]/.test(after)) idx = i;
    from = i + marker.length;
  }
  if (idx < 0) return null;

  let p = idx + marker.length;
  while (p < latin.length) {
    const w = latin[p];
    if (w === undefined || !/\s/.test(w)) break;
    p++;
  }
  const ch = latin[p];
  if (ch === '(') {
    p++;
    let depth = 1;
    let raw = '';
    while (p < latin.length && depth > 0) {
      const c = latin[p]!;
      if (c === '\\') {
        raw += c + (latin[p + 1] ?? '');
        p += 2;
        continue;
      }
      if (c === '(') {
        depth++;
        raw += c;
      } else if (c === ')') {
        depth--;
        if (depth === 0) {
          p++;
          break;
        }
        raw += c;
      } else {
        raw += c;
      }
      p++;
    }
    return decodePdfLiteral(raw);
  }
  if (ch === '<') {
    p++;
    let hex = '';
    while (p < latin.length && latin[p] !== '>') {
      hex += latin[p];
      p++;
    }
    return decodePdfHex(hex);
  }
  return null;
}

/** Unescape a PDF literal-string body, then decode its text bytes. */
function decodePdfLiteral(raw: string): string | null {
  let bytes = '';
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i]!;
    if (c !== '\\') {
      bytes += c;
      continue;
    }
    const n = raw[i + 1];
    if (n === undefined) break;
    if (n === 'n') bytes += '\n';
    else if (n === 'r') bytes += '\r';
    else if (n === 't') bytes += '\t';
    else if (n === 'b') bytes += '\b';
    else if (n === 'f') bytes += '\f';
    else if (n === '(' || n === ')' || n === '\\') bytes += n;
    else if (n >= '0' && n <= '7') {
      let oct = n;
      i++;
      for (let k = 0; k < 2; k++) {
        const d = raw[i + 1];
        if (d !== undefined && d >= '0' && d <= '7') {
          oct += d;
          i++;
        } else break;
      }
      bytes += String.fromCharCode(parseInt(oct, 8) & 0xff);
      continue;
    } else if (n === '\n' || n === '\r') {
      // line continuation — drop the backslash + newline
    } else {
      bytes += n;
    }
    i++;
  }
  return decodePdfTextBytes(bytes);
}

function decodePdfHex(hex: string): string | null {
  const clean = hex.replace(/[^0-9A-Fa-f]/g, '');
  const padded = clean.length % 2 ? `${clean}0` : clean;
  let bytes = '';
  for (let i = 0; i < padded.length; i += 2) {
    bytes += String.fromCharCode(parseInt(padded.slice(i, i + 2), 16));
  }
  return decodePdfTextBytes(bytes);
}

/** PDF text strings are either UTF-16BE (FE FF BOM) or PDFDocEncoding (≈ Latin-1). */
function decodePdfTextBytes(bytes: string): string | null {
  if (bytes.length === 0) return null;
  if (bytes.charCodeAt(0) === 0xfe && bytes.charCodeAt(1) === 0xff) {
    let out = '';
    for (let i = 2; i + 1 < bytes.length; i += 2) {
      out += String.fromCharCode((bytes.charCodeAt(i) << 8) | bytes.charCodeAt(i + 1));
    }
    return tidy(out);
  }
  if (
    bytes.charCodeAt(0) === 0xef &&
    bytes.charCodeAt(1) === 0xbb &&
    bytes.charCodeAt(2) === 0xbf
  ) {
    return tidy(Buffer.from(bytes.slice(3), 'latin1').toString('utf8'));
  }
  return tidy(bytes);
}

/** Page count from the page-tree root `/Count`, else a `/Type /Page` tally. */
function extractPageCount(latin: string): number | null {
  const reA = /\/Type\s*\/Pages\b[\s\S]{0,300}?\/Count\s+(\d+)/;
  const reB = /\/Count\s+(\d+)[\s\S]{0,300}?\/Type\s*\/Pages\b/;
  const m = reA.exec(latin) ?? reB.exec(latin);
  if (m && m[1] !== undefined) {
    const n = parseInt(m[1], 10);
    if (n > 0 && n < 1_000_000) return n;
  }
  const pageRe = /\/Type\s*\/Page(?![sA-Za-z])/g;
  let count = 0;
  while (pageRe.exec(latin) !== null) {
    count++;
    if (count > 100_000) break;
  }
  return count > 0 ? count : null;
}

function isoFromXmpDate(s: string): string | null {
  const t = s.trim();
  return t.length > 0 ? t.slice(0, 40) : null;
}

function isoFromPdfDate(s: string): string | null {
  const m = /(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/.exec(s.replace(/^D:/, ''));
  if (!m || m[1] === undefined || m[2] === undefined || m[3] === undefined) {
    const t = s.trim();
    return t.length > 0 ? t.slice(0, 40) : null;
  }
  return `${m[1]}-${m[2]}-${m[3]}T${m[4] ?? '00'}:${m[5] ?? '00'}:${m[6] ?? '00'}`;
}

/** Trim, collapse whitespace, strip control chars, cap length — without any
 *  control-char regex literal (keeps the source bytes clean). */
function tidy(s: string): string | null {
  let cleaned = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    cleaned += code < 0x20 || code === 0x7f ? ' ' : (s[i] ?? '');
  }
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned.slice(0, 500) : null;
}

function fromCp(cp: number): string {
  try {
    return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : '';
  } catch {
    return '';
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
