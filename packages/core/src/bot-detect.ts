/**
 * V2 Faz 2 — bot/user-agent classification + reverse-DNS verification.
 *
 * `detectBot` maps a raw User-Agent string to a named crawler. The order
 * of the table matters: more specific signatures (Googlebot Smartphone)
 * are tested before their generic parents (Googlebot).
 *
 * `verifyBotByRdns` implements the canonical "is this really Googlebot?"
 * check the search engines themselves document: reverse-DNS the source IP,
 * confirm the PTR hostname ends with an official suffix, then forward-DNS
 * that hostname and confirm it resolves back to the original IP. This
 * catches user-agents that merely *claim* to be Googlebot/Bingbot/etc.
 */

import { promises as dns } from 'node:dns';

export type BotFamily =
  | 'googlebot'
  | 'bingbot'
  | 'yandexbot'
  | 'search'
  | 'ai'
  | 'social'
  | 'seo-tool'
  | 'other';

export interface BotInfo {
  /** Display name, e.g. "Googlebot Smartphone". */
  name: string;
  family: BotFamily;
  /** Official reverse-DNS suffixes (empty = not verifiable by rDNS). */
  rdnsSuffixes: string[];
}

interface BotPattern {
  re: RegExp;
  name: string;
  family: BotFamily;
  rdnsSuffixes: string[];
}

const GOOGLE_SUFFIXES = ['.googlebot.com', '.google.com', '.googleusercontent.com'];
const BING_SUFFIXES = ['.search.msn.com'];
const YANDEX_SUFFIXES = ['.yandex.com', '.yandex.net', '.yandex.ru'];
const APPLE_SUFFIXES = ['.applebot.apple.com'];
const BAIDU_SUFFIXES = ['.baidu.com', '.baidu.jp'];

// Ordered most-specific-first.
const PATTERNS: BotPattern[] = [
  // --- Google family ---
  { re: /Googlebot[^)]*Mobile|Mobile[^)]*Googlebot/i, name: 'Googlebot Smartphone', family: 'googlebot', rdnsSuffixes: GOOGLE_SUFFIXES },
  { re: /Googlebot-Image/i, name: 'Googlebot Image', family: 'googlebot', rdnsSuffixes: GOOGLE_SUFFIXES },
  { re: /Googlebot-Video/i, name: 'Googlebot Video', family: 'googlebot', rdnsSuffixes: GOOGLE_SUFFIXES },
  { re: /Googlebot-News/i, name: 'Googlebot News', family: 'googlebot', rdnsSuffixes: GOOGLE_SUFFIXES },
  { re: /AdsBot-Google-Mobile/i, name: 'AdsBot Google Mobile', family: 'googlebot', rdnsSuffixes: GOOGLE_SUFFIXES },
  { re: /AdsBot-Google/i, name: 'AdsBot Google', family: 'googlebot', rdnsSuffixes: GOOGLE_SUFFIXES },
  { re: /Mediapartners-Google/i, name: 'Mediapartners (AdSense)', family: 'googlebot', rdnsSuffixes: GOOGLE_SUFFIXES },
  { re: /Google-InspectionTool/i, name: 'Google InspectionTool', family: 'googlebot', rdnsSuffixes: GOOGLE_SUFFIXES },
  { re: /Google-Extended/i, name: 'Google-Extended (Gemini)', family: 'ai', rdnsSuffixes: GOOGLE_SUFFIXES },
  { re: /GoogleOther/i, name: 'GoogleOther', family: 'googlebot', rdnsSuffixes: GOOGLE_SUFFIXES },
  { re: /APIs-Google/i, name: 'APIs-Google', family: 'googlebot', rdnsSuffixes: GOOGLE_SUFFIXES },
  { re: /FeedFetcher-Google/i, name: 'FeedFetcher-Google', family: 'googlebot', rdnsSuffixes: GOOGLE_SUFFIXES },
  { re: /Googlebot/i, name: 'Googlebot', family: 'googlebot', rdnsSuffixes: GOOGLE_SUFFIXES },

  // --- Bing family ---
  { re: /BingPreview/i, name: 'BingPreview', family: 'bingbot', rdnsSuffixes: BING_SUFFIXES },
  { re: /adidxbot/i, name: 'AdIdxBot (Bing Ads)', family: 'bingbot', rdnsSuffixes: BING_SUFFIXES },
  { re: /bingbot/i, name: 'Bingbot', family: 'bingbot', rdnsSuffixes: BING_SUFFIXES },
  { re: /msnbot/i, name: 'MSNBot', family: 'bingbot', rdnsSuffixes: BING_SUFFIXES },

  // --- Yandex family ---
  { re: /YandexMobileBot/i, name: 'YandexMobileBot', family: 'yandexbot', rdnsSuffixes: YANDEX_SUFFIXES },
  { re: /YandexImages/i, name: 'YandexImages', family: 'yandexbot', rdnsSuffixes: YANDEX_SUFFIXES },
  { re: /YandexBot/i, name: 'YandexBot', family: 'yandexbot', rdnsSuffixes: YANDEX_SUFFIXES },
  { re: /Yandex(?:Accessibility|Metrika|Webmaster|[A-Za-z]+)?/i, name: 'Yandex (other)', family: 'yandexbot', rdnsSuffixes: YANDEX_SUFFIXES },

  // --- Other search engines ---
  { re: /DuckDuckBot|DuckDuckGo-Favicons-Bot/i, name: 'DuckDuckBot', family: 'search', rdnsSuffixes: [] },
  { re: /Baiduspider/i, name: 'Baiduspider', family: 'search', rdnsSuffixes: BAIDU_SUFFIXES },
  { re: /Sogou web spider/i, name: 'Sogou', family: 'search', rdnsSuffixes: [] },
  { re: /Exabot/i, name: 'Exabot', family: 'search', rdnsSuffixes: [] },
  { re: /Applebot/i, name: 'Applebot', family: 'search', rdnsSuffixes: APPLE_SUFFIXES },
  { re: /SeznamBot/i, name: 'SeznamBot', family: 'search', rdnsSuffixes: [] },
  { re: /PetalBot/i, name: 'PetalBot', family: 'search', rdnsSuffixes: [] },

  // --- AI crawlers ---
  { re: /GPTBot/i, name: 'GPTBot (OpenAI)', family: 'ai', rdnsSuffixes: [] },
  { re: /OAI-SearchBot/i, name: 'OAI-SearchBot (OpenAI)', family: 'ai', rdnsSuffixes: [] },
  { re: /ChatGPT-User/i, name: 'ChatGPT-User', family: 'ai', rdnsSuffixes: [] },
  { re: /ClaudeBot|Claude-Web|anthropic-ai/i, name: 'ClaudeBot (Anthropic)', family: 'ai', rdnsSuffixes: [] },
  { re: /PerplexityBot/i, name: 'PerplexityBot', family: 'ai', rdnsSuffixes: [] },
  { re: /CCBot/i, name: 'CCBot (Common Crawl)', family: 'ai', rdnsSuffixes: [] },
  { re: /Bytespider/i, name: 'Bytespider (ByteDance)', family: 'ai', rdnsSuffixes: [] },
  { re: /Amazonbot/i, name: 'Amazonbot', family: 'ai', rdnsSuffixes: [] },

  // --- Social / link unfurlers ---
  { re: /facebookexternalhit|facebookcatalog|meta-externalagent/i, name: 'Facebook', family: 'social', rdnsSuffixes: [] },
  { re: /Twitterbot/i, name: 'Twitterbot', family: 'social', rdnsSuffixes: [] },
  { re: /LinkedInBot/i, name: 'LinkedInBot', family: 'social', rdnsSuffixes: [] },
  { re: /Slackbot/i, name: 'Slackbot', family: 'social', rdnsSuffixes: [] },
  { re: /WhatsApp/i, name: 'WhatsApp', family: 'social', rdnsSuffixes: [] },
  { re: /TelegramBot/i, name: 'TelegramBot', family: 'social', rdnsSuffixes: [] },
  { re: /Discordbot/i, name: 'Discordbot', family: 'social', rdnsSuffixes: [] },
  { re: /Pinterest(?:bot)?/i, name: 'Pinterestbot', family: 'social', rdnsSuffixes: [] },

  // --- SEO / commercial crawlers ---
  { re: /AhrefsBot/i, name: 'AhrefsBot', family: 'seo-tool', rdnsSuffixes: [] },
  { re: /SemrushBot/i, name: 'SemrushBot', family: 'seo-tool', rdnsSuffixes: [] },
  { re: /MJ12bot/i, name: 'MJ12bot (Majestic)', family: 'seo-tool', rdnsSuffixes: [] },
  { re: /DotBot/i, name: 'DotBot (Moz)', family: 'seo-tool', rdnsSuffixes: [] },
  { re: /rogerbot/i, name: 'rogerbot (Moz)', family: 'seo-tool', rdnsSuffixes: [] },
  { re: /BLEXBot/i, name: 'BLEXBot', family: 'seo-tool', rdnsSuffixes: [] },
  { re: /DataForSeoBot/i, name: 'DataForSeoBot', family: 'seo-tool', rdnsSuffixes: [] },
  { re: /Screaming Frog SEO Spider/i, name: 'Screaming Frog', family: 'seo-tool', rdnsSuffixes: [] },

  // --- Generic catch-all (last) ---
  { re: /\b(bot|crawler|spider|crawl)\b/i, name: 'Other bot', family: 'other', rdnsSuffixes: [] },
];

/** Classify a User-Agent. Returns null for non-bot (human browser) UAs. */
export function detectBot(userAgent: string | null | undefined): BotInfo | null {
  if (!userAgent) return null;
  for (const p of PATTERNS) {
    if (p.re.test(userAgent)) {
      return { name: p.name, family: p.family, rdnsSuffixes: p.rdnsSuffixes };
    }
  }
  return null;
}

/**
 * Forward-confirmed reverse-DNS check. Returns true only when:
 *   1. the PTR record of `ip` ends with one of `suffixes`, AND
 *   2. forward-resolving that hostname yields `ip` back.
 * Any DNS error / mismatch → false. `suffixes` empty → false (the bot is
 * not rDNS-verifiable, so we never claim verification).
 */
export async function verifyBotByRdns(
  ip: string,
  suffixes: string[],
  timeoutMs = 3000,
): Promise<boolean> {
  if (!ip || suffixes.length === 0) return false;
  try {
    const hostnames = await withTimeout(dns.reverse(ip), timeoutMs);
    const match = hostnames.find((h) =>
      suffixes.some((s) => h.toLowerCase().endsWith(s)),
    );
    if (!match) return false;
    const addrs = await withTimeout(dns.resolve(match), timeoutMs).catch(
      () => [] as string[],
    );
    return addrs.includes(ip);
  } catch {
    return false;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('dns-timeout')), ms),
    ),
  ]);
}
