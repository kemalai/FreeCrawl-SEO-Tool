import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { ProjectDb } from '@freecrawl/db';
import type { CrawlUrlRow, UrlCategory } from '@freecrawl/shared-types';

/**
 * Streaming XML export of the URL table. Schema is intentionally close
 * to Screaming Frog's CSV-→-XML pattern so existing pipelines can drop
 * the file in without bespoke transforms:
 *
 *   <crawl exportedAt="…" rowCount="…">
 *     <url>
 *       <address>https://…</address>
 *       <statusCode>200</statusCode>
 *       <indexability>indexable</indexability>
 *       <title>…</title>
 *       <titleLength>…</titleLength>
 *       …
 *     </url>
 *     …
 *   </crawl>
 *
 * Streamed via async generator + `pipeline` so a 1M-row crawl stays
 * within bounded memory — never materialises the full output.
 *
 * Element names mirror the camelCase keys of `CrawlUrlRow` so the
 * mapping is obvious. Null values render as self-closing tags (e.g.
 * `<title/>`) rather than empty strings, preserving the distinction
 * between "no title" and "empty title" that the CSV export collapses.
 */

const XML_COLUMNS: (keyof CrawlUrlRow)[] = [
  'url',
  'statusCode',
  'contentKind',
  'indexability',
  'indexabilityReason',
  'title',
  'titleLength',
  'metaDescription',
  'metaDescriptionLength',
  'h1',
  'h1Length',
  'h1Count',
  'h2Count',
  'h3Count',
  'h4Count',
  'h5Count',
  'h6Count',
  'wordCount',
  'canonical',
  'canonicalCount',
  'canonicalHttp',
  'metaRobots',
  'xRobotsTag',
  'contentType',
  'contentLength',
  'responseTimeMs',
  'ttfbMs',
  'depth',
  'inlinks',
  'outlinks',
  'redirectTarget',
  'redirectChainLength',
  'redirectFinalUrl',
  'redirectLoop',
  'lang',
  'viewport',
  'ogTitle',
  'ogDescription',
  'ogImage',
  'twitterCard',
  'twitterTitle',
  'twitterDescription',
  'twitterImage',
  'metaKeywords',
  'metaAuthor',
  'metaGenerator',
  'themeColor',
  'hsts',
  'xFrameOptions',
  'xContentTypeOptions',
  'csp',
  'referrerPolicy',
  'permissionsPolicy',
  'contentEncoding',
  'serverHeader',
  'httpProtocol',
  'keepAlive',
  'paginationNext',
  'paginationPrev',
  'paginationSequenceBreak',
  'amphtml',
  'favicon',
  'appleTouchIcon',
  'manifestUrl',
  'feedUrl',
  'metaRefresh',
  'metaRefreshUrl',
  'charset',
  'mixedContentCount',
  'imagesCount',
  'imagesMissingAlt',
  'imagesEmptyAlt',
  'imagesLazy',
  'jsOnlyLinksCount',
  'textCodeRatio',
  'titleCount',
  'titlePixelWidth',
  'metaPixelWidth',
  'cookiesCount',
  'cookiesInsecure',
  'cookiesNoHttpOnly',
  'cookiesNoSameSite',
  'queryParamCount',
  'queryStringLength',
  'folderDepth',
  'renderBlockingCount',
  'formInputCount',
  'formInputUnlabeled',
  'schemaTypes',
  'schemaBlockCount',
  'schemaInvalidCount',
  'microdataCount',
  'rdfaCount',
  'insecureFormActionCount',
  'missingSriCount',
  'hreflangs',
  'hreflangCount',
  'analyticsTrackers',
  'simhash',
  'contentHash',
  'clusterId',
  'clusterSize',
];

/** Escape characters that are invalid inside XML element text bodies. */
function xmlEscape(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // XML 1.0 forbids most C0 control characters; strip everything below
    // 0x20 except tab (0x09), LF (0x0A), and CR (0x0D).
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

function renderField(key: keyof CrawlUrlRow, value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return `<${key}/>`;
  }
  if (typeof value === 'boolean') {
    return `<${key}>${value ? 'true' : 'false'}</${key}>`;
  }
  if (typeof value === 'number') {
    return `<${key}>${value}</${key}>`;
  }
  // Strings, JSON-stringified columns (hreflangs, schemaTypes, etc.)
  // pass through xml-escape and into a CDATA wrapper when they contain
  // characters that would force escaping of every byte.
  const s = String(value);
  if (/[<>&]/.test(s) && s.length > 200) {
    // Long values likely contain HTML — CDATA preserves exact bytes.
    // We split on `]]>` to be safe; standard SAX/DOM parsers reassemble.
    const safe = s.replace(/\]\]>/g, ']]]]><![CDATA[>');
    return `<${key}><![CDATA[${safe}]]></${key}>`;
  }
  return `<${key}>${xmlEscape(s)}</${key}>`;
}

export async function exportUrlsToXml(
  db: ProjectDb,
  filePath: string,
  options: { selectedIds?: number[]; category?: UrlCategory } = {},
): Promise<{ rowsWritten: number }> {
  let rowsWritten = 0;

  const source: Iterable<CrawlUrlRow> =
    options.selectedIds && options.selectedIds.length > 0
      ? db.iterateUrlsByIds(options.selectedIds)
      : options.category && options.category !== 'all'
        ? db.iterateUrlsByCategory(options.category)
        : db.iterateAllUrls();

  const generator = async function* (): AsyncGenerator<string> {
    yield '<?xml version="1.0" encoding="UTF-8"?>\n';
    // We don't know the row count up front (we're streaming) so the
    // root element opens without it — matches the SF CSV-XML output.
    yield `<crawl exportedAt="${new Date().toISOString()}">\n`;
    for (const row of source) {
      const fields = XML_COLUMNS.map((col) =>
        renderField(col, (row as unknown as Record<string, unknown>)[col]),
      ).join('');
      yield `  <url>${fields}</url>\n`;
      rowsWritten++;
    }
    yield '</crawl>\n';
  };

  await pipeline(
    Readable.from(generator()),
    createWriteStream(filePath, { encoding: 'utf8' }),
  );

  return { rowsWritten };
}
