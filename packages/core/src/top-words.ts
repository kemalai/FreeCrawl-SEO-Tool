/**
 * Word-frequency aggregation for the "Top Words" report. Pure / sync /
 * data-only — the DB layer feeds raw text strings (titles, descriptions,
 * H1s, optionally body text) and gets back a deduped frequency map.
 *
 * Stopwords are bundled English + Turkish (the two languages the user
 * crawls most). Adding more locales is a matter of dropping another set
 * into `STOPWORDS_BY_LOCALE`. Detection is intentionally absent: if the
 * site mixes languages we just union all enabled stopword sets.
 *
 * Tokenisation uses Unicode-aware `\p{L}` so Turkish (ç, ğ, ı, ş, ü, ö),
 * accented Western European, and Cyrillic all produce clean tokens
 * without us having to maintain a per-language regex.
 */

const STOPWORDS_EN = new Set<string>([
  // articles, conjunctions, common prepositions
  'the', 'and', 'but', 'for', 'are', 'was', 'were', 'with', 'that', 'this',
  'these', 'those', 'from', 'have', 'has', 'had', 'will', 'would', 'should',
  'can', 'could', 'may', 'might', 'must', 'into', 'onto', 'upon', 'over',
  'under', 'about', 'after', 'before', 'between', 'through', 'during',
  'where', 'when', 'while', 'because', 'although', 'though', 'than', 'then',
  'too', 'very', 'just', 'only', 'also', 'still', 'such', 'some', 'any',
  'each', 'every', 'all', 'most', 'more', 'less', 'much', 'many', 'few',
  'other', 'another', 'same', 'own', 'here', 'there', 'what', 'which',
  'who', 'whom', 'whose', 'why', 'how', 'not', 'nor', 'either', 'neither',
  'both', 'not', 'yet', 'without', 'within', 'against', 'across', 'among',
  // pronouns
  'they', 'them', 'their', 'his', 'her', 'hers', 'its', 'our', 'ours',
  'your', 'yours', 'mine', 'myself', 'yourself', 'himself', 'herself',
  'itself', 'ourselves', 'themselves', 'you', 'she', 'him', 'one',
  // auxiliary / very common verbs
  'been', 'being', 'doing', 'does', 'done', 'goes', 'gone', 'come', 'came',
  'take', 'taken', 'took', 'make', 'made', 'get', 'got', 'gets',
  'know', 'knew', 'known', 'see', 'saw', 'seen', 'say', 'said',
  // common short
  'use', 'used', 'using', 'two', 'three', 'four', 'five',
  'new', 'now', 'way', 'day', 'year', 'time', 'thing',
]);

const STOPWORDS_TR = new Set<string>([
  // bağlaçlar, yardımcı fiiller, çok geçen kısa kelimeler
  've', 'veya', 'ile', 'ama', 'fakat', 'ancak', 'çünkü', 'için', 'gibi',
  'kadar', 'değil', 'daha', 'çok', 'tüm', 'tüm', 'hepsi', 'bazı', 'her',
  'hiç', 'şey', 'yine', 'hep', 'hep', 'eğer', 'ise', 'iken', 'fakat',
  'lakin', 'oysa', 'oysaki', 'üzere', 'önce', 'sonra', 'arada',
  // zamirler
  'ben', 'sen', 'biz', 'siz', 'onlar', 'kim', 'ne', 'nasıl', 'neden',
  'niçin', 'kendi', 'kendisi', 'kendileri', 'şu', 'şunu', 'şunlar',
  'bu', 'bunu', 'bunlar', 'bunların',
  // yapılar
  'olan', 'olan', 'olduğu', 'olmak', 'oldu', 'olur', 'olabilir',
  'oldu', 'eden', 'edilen', 'eden',
  // bağlaç + edat varyantları
  'göre', 'rağmen', 'doğru', 'karşı', 'beri', 'kez', 'kere', 'defa',
  'an', 'biri', 'birisi', 'birkaç', 'birçok', 'kimse', 'herkes',
  // sayılar / zaman
  'bir', 'iki', 'üç', 'dört', 'beş', 'yıl', 'gün', 'ay', 'saat',
  'şimdi', 'sonra', 'önce', 'bugün', 'yarın', 'dün',
  // vs
  'var', 'yok', 'mı', 'mi', 'mu', 'mü', 'da', 'de', 'ki',
]);

export type TopWordsLocale = 'en' | 'tr' | 'all';

const STOPWORDS_BY_LOCALE: Record<TopWordsLocale, Set<string>> = {
  en: STOPWORDS_EN,
  tr: STOPWORDS_TR,
  // Default — most crawls hit either English or Turkish text, often
  // mixed (Turkish e-commerce sites sprinkle English brand names). The
  // union catches the most common stopwords regardless of language.
  all: new Set<string>([...STOPWORDS_EN, ...STOPWORDS_TR]),
};

export interface TopWordsRow {
  word: string;
  /** Total occurrences across all input strings. */
  count: number;
  /** Number of distinct input strings (≈ pages) that contained the word. */
  pages: number;
}

export interface TopWordsOptions {
  /** Max rows to return (default 100, hard cap 1000). */
  limit?: number;
  /** Minimum word length (default 3 — drops 1–2 char noise). */
  minLength?: number;
  /** Stopword set to apply (default `all`). */
  locale?: TopWordsLocale;
}

/**
 * Tokenise a string into lowercase words, dropping numbers + punctuation
 * + tokens shorter than `minLength`. Unicode `\p{L}` covers Latin,
 * Turkish, Cyrillic, Greek, etc. without us needing per-locale regex.
 */
export function tokenizeForTopWords(text: string, minLength: number): string[] {
  if (!text) return [];
  const out: string[] = [];
  const re = /[\p{L}]+/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].length >= minLength) out.push(m[0].toLowerCase());
  }
  return out;
}

/**
 * Aggregate word frequencies from a stream of input strings (one per
 * page, typically `title + " " + metaDescription + " " + h1`). Returns
 * the top-N most frequent non-stopword tokens with both raw count and
 * page-coverage count (how many distinct strings contained the word).
 *
 * The page-coverage signal lets the UI distinguish "popular topic
 * across the site" from "one page repeats a word a hundred times".
 */
export function aggregateTopWords(
  texts: Iterable<string>,
  opts: TopWordsOptions = {},
): TopWordsRow[] {
  const limit = Math.max(1, Math.min(1000, opts.limit ?? 100));
  const minLength = Math.max(1, Math.min(10, opts.minLength ?? 3));
  const stopwords = STOPWORDS_BY_LOCALE[opts.locale ?? 'all'];

  // Two parallel maps: total frequency, and per-page frequency
  // (incremented at most once per source string). Keeping them
  // separate avoids re-tokenising or threading a Set through the
  // hot path.
  const total = new Map<string, number>();
  const pages = new Map<string, number>();
  const seenInThisPage = new Set<string>();

  for (const text of texts) {
    const tokens = tokenizeForTopWords(text, minLength);
    seenInThisPage.clear();
    for (const tok of tokens) {
      if (stopwords.has(tok)) continue;
      total.set(tok, (total.get(tok) ?? 0) + 1);
      if (!seenInThisPage.has(tok)) {
        pages.set(tok, (pages.get(tok) ?? 0) + 1);
        seenInThisPage.add(tok);
      }
    }
  }

  return [...total.entries()]
    .map(([word, count]) => ({
      word,
      count,
      pages: pages.get(word) ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}
