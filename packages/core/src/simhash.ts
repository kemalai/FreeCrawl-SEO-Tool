/**
 * Charikar 64-bit SimHash for near-duplicate page detection.
 *
 * Pipeline:
 *   1. Lowercase the body text, split on word boundary, drop very short tokens.
 *   2. Build 3-shingles ("a b c") so similar paragraphs with re-ordered
 *      sentences still collide; bag-of-words is too loose for SEO content.
 *   3. Hash each shingle with FNV-1a (64-bit).
 *   4. For every bit position, accumulate `+freq` if the bit is 1 in the
 *      shingle hash, `-freq` if 0.
 *   5. Final SimHash bit = sign of the accumulator.
 *
 * Two pages with hamming distance ≤ ~3 over 64 bits are considered
 * near-duplicates (>~95% similarity at the word-shingle level).
 *
 * Cost: ~5–10 ms on a 1 MB page (htmlparser2 already gave us trimmed text).
 * The body text itself is NOT stored in the database — only the hash.
 *
 * We deliberately use BigInt for the 64-bit math instead of pairs of 32-bit
 * numbers because Node's BigInt is fast enough at this scale (millions of
 * shingles per crawl total) and the code stays trivially correct.
 */
const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const MASK64 = (1n << 64n) - 1n;

function fnv1a64(input: string): bigint {
  let hash = FNV_OFFSET;
  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * FNV_PRIME) & MASK64;
  }
  return hash;
}

/** Hex helper — pads to 16 chars (64 bits) so DB rows are fixed-width. */
function toHex64(n: bigint): string {
  return n.toString(16).padStart(16, '0');
}

const SHINGLE_SIZE = 3;
const MIN_TOKEN_LEN = 2;

/**
 * Tokenizer: lowercase + split on non-word boundary, drop tokens shorter
 * than MIN_TOKEN_LEN. We don't strip stopwords — for near-duplicate
 * detection their presence/absence is signal, not noise.
 */
function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= MIN_TOKEN_LEN);
}

/**
 * Compute SimHash + exact content hash for a chunk of body text.
 * Returns null fingerprint when the page has no usable content (so the
 * caller stores NULL in the DB and the URL is excluded from clustering).
 */
export function computeContentFingerprint(text: string): {
  simhash: string | null;
  contentHash: string | null;
} {
  if (!text || text.length < 50) {
    return { simhash: null, contentHash: null };
  }

  const tokens = tokenize(text);
  if (tokens.length < SHINGLE_SIZE) {
    return { simhash: null, contentHash: null };
  }

  // Aggregate shingle frequencies first — duplicate shingles within the
  // same document shouldn't multiply their own influence linearly.
  const shingleFreq = new Map<string, number>();
  for (let i = 0; i <= tokens.length - SHINGLE_SIZE; i++) {
    const shingle = tokens[i] + ' ' + tokens[i + 1] + ' ' + tokens[i + 2];
    shingleFreq.set(shingle, (shingleFreq.get(shingle) ?? 0) + 1);
  }

  // 64 signed accumulators, one per bit position.
  const v = new Int32Array(64);
  for (const [shingle, freq] of shingleFreq) {
    let h = fnv1a64(shingle);
    // Use Math.log to dampen frequency dominance — a banner that repeats
    // 100× shouldn't drown out the body 1000× more than a single mention.
    const weight = 1 + Math.floor(Math.log2(freq + 1));
    for (let bit = 0; bit < 64; bit++) {
      if ((h & 1n) === 1n) v[bit]! += weight;
      else v[bit]! -= weight;
      h >>= 1n;
    }
  }

  let sim = 0n;
  for (let bit = 0; bit < 64; bit++) {
    if (v[bit]! > 0) sim |= 1n << BigInt(bit);
  }

  // Exact content hash — same FNV-1a but over the full token stream so
  // identical body text always collides regardless of shingle order.
  // Cheap, deterministic, no native deps.
  const exact = fnv1a64(tokens.join(' '));

  return {
    simhash: toHex64(sim),
    contentHash: toHex64(exact),
  };
}

/** Hamming distance between two 64-bit hex strings. */
export function hammingDistance(aHex: string, bHex: string): number {
  if (aHex.length !== 16 || bHex.length !== 16) return 64;
  const a = BigInt('0x' + aHex);
  const b = BigInt('0x' + bHex);
  let x = a ^ b;
  let count = 0;
  while (x !== 0n) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
}

/** Split a 64-bit hex SimHash into 4 16-bit bands for LSH bucketing. */
export function simhashBands(hex: string): [string, string, string, string] {
  return [hex.slice(0, 4), hex.slice(4, 8), hex.slice(8, 12), hex.slice(12, 16)];
}
