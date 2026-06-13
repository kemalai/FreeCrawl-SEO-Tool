/**
 * V2 Faz 16 #1 — Pixel-dimension extraction from raw image bytes.
 *
 * Parses the width × height out of an image's header without decoding the
 * pixels — only the first few hundred bytes are needed for every format
 * here, which is why the social-image probe fetches just the leading
 * ~64 KB of each `og:image` / `twitter:image`.
 *
 * Supported: PNG, GIF, JPEG, WebP (VP8 / VP8L / VP8X), BMP. SVG has no
 * intrinsic pixel size (it scales) so it returns null — the aspect-ratio
 * issue filters skip pages whose probe came back without dimensions.
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

function be16(b: Uint8Array, o: number): number {
  return (b[o]! << 8) | b[o + 1]!;
}
function be32(b: Uint8Array, o: number): number {
  // `>>> 0` keeps the result an unsigned 32-bit int.
  return ((b[o]! << 24) | (b[o + 1]! << 16) | (b[o + 2]! << 8) | b[o + 3]!) >>> 0;
}
function le16(b: Uint8Array, o: number): number {
  return b[o]! | (b[o + 1]! << 8);
}
function le32(b: Uint8Array, o: number): number {
  return (b[o]! | (b[o + 1]! << 8) | (b[o + 2]! << 16) | (b[o + 3]! << 24)) >>> 0;
}

function ok(width: number, height: number): ImageDimensions | null {
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (width <= 0 || height <= 0) return null;
  // Sanity cap — a value larger than this is almost certainly a misparse.
  if (width > 100_000 || height > 100_000) return null;
  return { width, height };
}

function parsePng(b: Uint8Array): ImageDimensions | null {
  // 8-byte signature + IHDR chunk (length + "IHDR" + width + height + …).
  // Width is a big-endian uint32 at offset 16, height at offset 20.
  if (b.length < 24) return null;
  return ok(be32(b, 16), be32(b, 20));
}

function parseGif(b: Uint8Array): ImageDimensions | null {
  // "GIF87a" / "GIF89a" (6) then logical-screen width/height as LE uint16.
  if (b.length < 10) return null;
  return ok(le16(b, 6), le16(b, 8));
}

function parseBmp(b: Uint8Array): ImageDimensions | null {
  // "BM" header; BITMAPINFOHEADER width (LE int32 @18) / height (@22).
  // Height can be negative (top-down DIB) so take the magnitude.
  if (b.length < 26) return null;
  const w = le32(b, 18);
  let h = le32(b, 22);
  if (h > 0x7fffffff) h = 0x100000000 - h; // interpret as signed, abs
  return ok(w, h);
}

function parseJpeg(b: Uint8Array): ImageDimensions | null {
  // SOI (FFD8) then a sequence of marker segments. Start-of-Frame markers
  // (C0–CF excluding the non-SOF C4/C8/CC) carry height then width as
  // big-endian uint16. We walk segments by their length field until we
  // hit a SOF or run out of bytes.
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let o = 2;
  const len = b.length;
  while (o + 9 < len) {
    // Markers are byte-aligned on 0xFF; skip any fill bytes.
    if (b[o] !== 0xff) {
      o++;
      continue;
    }
    let marker = b[o + 1]!;
    o += 2;
    // Skip padding 0xFF run.
    while (marker === 0xff && o < len) {
      marker = b[o]!;
      o++;
    }
    // Standalone markers (no length payload): RSTn (D0–D7), SOI/EOI, TEM.
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01) continue;
    if (marker >= 0xd0 && marker <= 0xd7) continue;
    if (o + 1 >= len) break;
    const segLen = be16(b, o);
    if (segLen < 2) break;
    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isSof) {
      // segment: [len(2)][precision(1)][height(2)][width(2)] …
      if (o + 7 >= len) break;
      return ok(be16(b, o + 5), be16(b, o + 3));
    }
    o += segLen;
  }
  return null;
}

function parseWebp(b: Uint8Array): ImageDimensions | null {
  // RIFF container: "RIFF"(4) size(4) "WEBP"(4) then a chunk fourcc.
  if (b.length < 30) return null;
  const fourcc = String.fromCharCode(b[12]!, b[13]!, b[14]!, b[15]!);
  if (fourcc === 'VP8 ') {
    // Lossy: chunk header(8) then 3-byte frame tag + 3-byte start code,
    // then 14-bit width / 14-bit height as LE at chunk-data offset 6/8.
    const base = 20; // 12 (RIFF/WEBP) + 8 (chunk header) = 20 → frame tag
    if (b.length < base + 10) return null;
    const w = le16(b, base + 6) & 0x3fff;
    const h = le16(b, base + 8) & 0x3fff;
    return ok(w, h);
  }
  if (fourcc === 'VP8L') {
    // Lossless: 1-byte signature (0x2F) then 14-bit (width-1), 14-bit
    // (height-1) packed little-endian across 4 bytes.
    const base = 21; // 12 + 8 + 1 signature byte
    if (b.length < base + 4) return null;
    const bits = le32(b, base);
    const w = (bits & 0x3fff) + 1;
    const h = ((bits >> 14) & 0x3fff) + 1;
    return ok(w, h);
  }
  if (fourcc === 'VP8X') {
    // Extended: chunk header(8) + flags(4) then 24-bit (canvas width-1)
    // and 24-bit (canvas height-1), both little-endian.
    const base = 24; // 12 + 8 + 4 flags
    if (b.length < base + 6) return null;
    const w = (b[base]! | (b[base + 1]! << 8) | (b[base + 2]! << 16)) + 1;
    const h = (b[base + 3]! | (b[base + 4]! << 8) | (b[base + 5]! << 16)) + 1;
    return ok(w, h);
  }
  return null;
}

/**
 * Best-effort dimension parse. Returns null for unrecognised / truncated
 * data so callers can record "probed but undecodable" without guessing.
 */
export function parseImageDimensions(buf: Uint8Array): ImageDimensions | null {
  if (buf.length < 10) return null;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return parsePng(buf);
  }
  // GIF: "GIF8"
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    return parseGif(buf);
  }
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    return parseJpeg(buf);
  }
  // WebP: "RIFF"…"WEBP"
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return parseWebp(buf);
  }
  // BMP: "BM"
  if (buf[0] === 0x42 && buf[1] === 0x4d) {
    return parseBmp(buf);
  }
  return null;
}
