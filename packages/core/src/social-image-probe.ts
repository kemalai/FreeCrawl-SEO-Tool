import { fetch as undiciFetch } from 'undici';
import { defaultRequestHeaders } from './http-client.js';
import { parseImageDimensions, type ImageDimensions } from './image-dimensions.js';
import type { CrawlConfig } from '@freecrawl/shared-types';

const PROBE_TIMEOUT_MS = 8_000;
/** 64 KB is enough for every header format we parse, even a JPEG whose
 *  Start-of-Frame marker sits after a large EXIF/ICC block. */
const MAX_BYTES = 65_536;

/**
 * V2 Faz 16 #1 — Fetch just enough of a social image (`og:image` /
 * `twitter:image`) to read its pixel dimensions, then stop. A `Range`
 * request asks for only the first 64 KB; servers that ignore Range get
 * cut off by the streaming read so we never download a multi-MB hero
 * image in full. `accept-encoding: identity` keeps the byte offsets in
 * the header aligned (a gzipped range would decode to a different prefix).
 *
 * Best-effort: any failure (network, 4xx/5xx, unknown format, truncated
 * header) returns null so the caller records "probed, undecodable" and
 * doesn't retry on the next crawl.
 */
export async function probeSocialImageDimensions(
  imageUrl: string,
  config: Pick<CrawlConfig, 'userAgent' | 'acceptLanguage' | 'customHeaders' | 'auth'>,
): Promise<ImageDimensions | null> {
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
    headers['accept'] = 'image/avif,image/webp,image/png,image/*,*/*;q=0.8';

    const res = await undiciFetch(imageUrl, {
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
      return null;
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
    if (total === 0) return null;

    const cap = Math.min(total, MAX_BYTES);
    const buf = new Uint8Array(cap);
    let off = 0;
    for (const chunk of chunks) {
      if (off >= cap) break;
      const slice = chunk.subarray(0, cap - off);
      buf.set(slice, off);
      off += slice.length;
    }
    return parseImageDimensions(buf);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type { ImageDimensions };
