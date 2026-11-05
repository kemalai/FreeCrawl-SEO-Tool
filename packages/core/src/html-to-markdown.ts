import * as cheerio from 'cheerio';

/**
 * HTML → Markdown for the View Source "Markdown" view and the "All Page
 * Markdown" bulk export — the page as an LLM or a docs pipeline wants it:
 * headings, paragraphs, lists, links, images, tables and code, without
 * scripts, styles, forms or layout markup.
 *
 * Scope: the page's main content when it can be found (the project's
 * content-area selector, else `<main>`, `<article>`, `[role=main]`), else
 * the whole `<body>`. Links and images are resolved to absolute URLs so
 * the Markdown stands on its own.
 *
 * Pure function over cheerio (already a dependency) — no DOM, no network.
 * Runs in the parser worker in the desktop app so a multi-MB page never
 * blocks the main thread.
 */

export interface HtmlToMarkdownOptions {
  /** CSS selector of the content area (Settings → Content). */
  contentAreaSelector?: string;
  /** Convert the whole `<body>` even when a main-content region exists. */
  wholePage?: boolean;
}

type Node = {
  type: string;
  name?: string;
  data?: string;
  attribs?: Record<string, string>;
  children?: Node[];
};

const DROP = new Set([
  'script',
  'style',
  'noscript',
  'template',
  'svg',
  'canvas',
  'iframe',
  'object',
  'embed',
  'head',
  'button',
  'input',
  'select',
  'textarea',
  'option',
  'datalist',
  'dialog',
]);

const BLOCK = new Set([
  'p',
  'div',
  'section',
  'article',
  'main',
  'header',
  'footer',
  'nav',
  'aside',
  'figure',
  'figcaption',
  'address',
  'form',
  'fieldset',
  'details',
  'summary',
  'body',
  'html',
  'center',
]);

/** Deeper than this the DOM is pathological; its text is kept flat. */
const MAX_DEPTH = 120;

function abs(href: string, base: string): string {
  const value = href.trim();
  if (!value) return '';
  try {
    return new URL(value, base).href;
  } catch {
    return value;
  }
}

/** Escape the characters that would turn plain text into Markdown syntax. */
function escapeText(s: string): string {
  return s
    .replace(/([\\`*[\]])/g, '\\$1')
    .replace(/(^|\s)_|_(?=\s|$)/g, (m) => m.replace('_', '\\_'));
}

function collapse(s: string): string {
  return s.replace(/\s+/g, ' ');
}

class Writer {
  private readonly base: string;
  constructor(base: string) {
    this.base = base;
  }

  /** Inline content of a node (text, emphasis, links, images, code). */
  inline(nodes: Node[] | undefined, depth: number): string {
    if (!nodes) return '';
    let out = '';
    for (const n of nodes) out += this.inlineNode(n, depth + 1);
    return out;
  }

  private inlineNode(n: Node, depth: number): string {
    if (n.type === 'text') return escapeText(collapse(n.data ?? ''));
    if (n.type !== 'tag' && n.type !== 'script' && n.type !== 'style') return '';
    const name = (n.name ?? '').toLowerCase();
    if (DROP.has(name) || isHidden(n)) return '';
    if (depth > MAX_DEPTH) return escapeText(collapse(textOf(n)));
    switch (name) {
      case 'br':
        // CommonMark hard break. Two trailing spaces would do too, but the
        // final trailing-whitespace cleanup would eat them.
        return '\\\n';
      case 'strong':
      case 'b': {
        const inner = this.inline(n.children, depth).trim();
        return inner ? `**${inner}**` : '';
      }
      case 'em':
      case 'i': {
        const inner = this.inline(n.children, depth).trim();
        return inner ? `*${inner}*` : '';
      }
      case 'del':
      case 's':
      case 'strike': {
        const inner = this.inline(n.children, depth).trim();
        return inner ? `~~${inner}~~` : '';
      }
      case 'code': {
        const text = textOf(n);
        if (!text) return '';
        const fence = text.includes('`') ? '``' : '`';
        return `${fence}${text}${fence}`;
      }
      case 'a': {
        const label = this.inline(n.children, depth).trim();
        const href = n.attribs?.href ?? '';
        if (!href || /^\s*javascript:/i.test(href)) return label;
        const target = href.trim().startsWith('#') ? href.trim() : abs(href, this.base);
        return label ? `[${label}](${target.replace(/\s/g, '%20')})` : '';
      }
      case 'img': {
        const src = n.attribs?.src ?? n.attribs?.['data-src'] ?? '';
        if (!src || src.startsWith('data:')) return '';
        const alt = collapse(n.attribs?.alt ?? '').replace(/[[\]]/g, '');
        return `![${alt}](${abs(src, this.base).replace(/\s/g, '%20')})`;
      }
      default:
        return this.inline(n.children, depth);
    }
  }

  /** Block-level Markdown for a list of sibling nodes. */
  blocks(nodes: Node[] | undefined, depth: number): string[] {
    const out: string[] = [];
    let inlineRun: Node[] = [];
    const flush = () => {
      if (inlineRun.length === 0) return;
      const text = this.inline(inlineRun, depth).trim();
      if (text) out.push(text);
      inlineRun = [];
    };
    for (const n of nodes ?? []) {
      const name = n.type === 'tag' ? (n.name ?? '').toLowerCase() : '';
      if (n.type === 'tag' && (DROP.has(name) || isHidden(n))) continue;
      if (n.type === 'tag' && isBlockName(name)) {
        flush();
        out.push(...this.block(n, name, depth + 1));
      } else {
        inlineRun.push(n);
      }
    }
    flush();
    return out;
  }

  private block(n: Node, name: string, depth: number): string[] {
    if (depth > MAX_DEPTH) {
      const text = escapeText(collapse(textOf(n))).trim();
      return text ? [text] : [];
    }
    const heading = /^h([1-6])$/.exec(name);
    if (heading) {
      const text = this.inline(n.children, depth)
        .replace(/\s*\n\s*/g, ' ')
        .trim();
      return text ? [`${'#'.repeat(Number(heading[1]))} ${text}`] : [];
    }
    switch (name) {
      case 'hr':
        return ['---'];
      case 'pre': {
        const text = textOf(n).replace(/\n+$/, '');
        if (!text) return [];
        const fence = text.includes('```') ? '~~~' : '```';
        const lang = /language-([\w-]+)/.exec(
          `${n.attribs?.class ?? ''} ${firstChildTag(n, 'code')?.attribs?.class ?? ''}`,
        )?.[1];
        return [`${fence}${lang ?? ''}\n${text}\n${fence}`];
      }
      case 'blockquote': {
        const inner = this.blocks(n.children, depth).join('\n\n');
        return inner
          ? [
              inner
                .split('\n')
                .map((l) => (l ? `> ${l}` : '>'))
                .join('\n'),
            ]
          : [];
      }
      case 'ul':
      case 'ol':
        return this.list(n, name === 'ol', depth);
      case 'table':
        return this.table(n, depth);
      case 'dl': {
        const lines: string[] = [];
        for (const c of n.children ?? []) {
          const cn = c.type === 'tag' ? (c.name ?? '').toLowerCase() : '';
          const text = this.inline(c.children, depth).trim();
          if (!text) continue;
          if (cn === 'dt') lines.push(`**${text}**`);
          else if (cn === 'dd') lines.push(`: ${text}`);
        }
        return lines.length ? [lines.join('\n')] : [];
      }
      default:
        return this.blocks(n.children, depth);
    }
  }

  private list(n: Node, ordered: boolean, depth: number): string[] {
    const items: string[] = [];
    let i = Number.parseInt(n.attribs?.start ?? '1', 10);
    if (!Number.isFinite(i)) i = 1;
    for (const c of n.children ?? []) {
      if (c.type !== 'tag' || (c.name ?? '').toLowerCase() !== 'li') continue;
      const marker = ordered ? `${i++}.` : '-';
      // A tight list: an item's paragraphs and nested lists sit on
      // consecutive lines, so the nested list stays attached to its item.
      const body = this.blocks(c.children, depth).join('\n');
      if (!body) continue;
      const pad = ' '.repeat(marker.length + 1);
      const [first, ...rest] = body.split('\n');
      items.push([`${marker} ${first}`, ...rest.map((l) => (l ? pad + l : l))].join('\n'));
    }
    return items.length ? [items.join('\n')] : [];
  }

  private table(n: Node, depth: number): string[] {
    const rows: string[][] = [];
    const walkRows = (node: Node) => {
      for (const c of node.children ?? []) {
        if (c.type !== 'tag') continue;
        const cn = (c.name ?? '').toLowerCase();
        if (cn === 'tr') {
          const cells: string[] = [];
          for (const cell of c.children ?? []) {
            const tag = cell.type === 'tag' ? (cell.name ?? '').toLowerCase() : '';
            if (tag !== 'td' && tag !== 'th') continue;
            cells.push(
              this.inline(cell.children, depth)
                .replace(/\s*\n\s*/g, ' ')
                .replace(/\|/g, '\\|')
                .trim(),
            );
          }
          if (cells.length) rows.push(cells);
        } else if (cn === 'thead' || cn === 'tbody' || cn === 'tfoot') {
          walkRows(c);
        }
      }
    };
    walkRows(n);
    if (rows.length === 0) return [];
    const width = Math.max(...rows.map((r) => r.length));
    const line = (r: string[]) =>
      `| ${Array.from({ length: width }, (_, k) => r[k] ?? '').join(' | ')} |`;
    const [head, ...body] = rows;
    return [
      [line(head!), `| ${Array(width).fill('---').join(' | ')} |`, ...body.map(line)].join('\n'),
    ];
  }
}

function isBlockName(name: string): boolean {
  return (
    BLOCK.has(name) ||
    /^h[1-6]$/.test(name) ||
    name === 'hr' ||
    name === 'pre' ||
    name === 'blockquote' ||
    name === 'ul' ||
    name === 'ol' ||
    name === 'table' ||
    name === 'dl' ||
    name === 'li'
  );
}

function isHidden(n: Node): boolean {
  const a = n.attribs;
  if (!a) return false;
  if ('hidden' in a) return true;
  if ((a['aria-hidden'] ?? '').toLowerCase() === 'true') return true;
  return /display\s*:\s*none/i.test(a.style ?? '');
}

function textOf(n: Node): string {
  if (n.type === 'text') return n.data ?? '';
  let out = '';
  const stack: Node[] = [...(n.children ?? [])].reverse();
  while (stack.length) {
    const c = stack.pop()!;
    if (c.type === 'text') out += c.data ?? '';
    else if (c.children)
      for (let k = c.children.length - 1; k >= 0; k--) stack.push(c.children[k]!);
  }
  return out;
}

function firstChildTag(n: Node, name: string): Node | undefined {
  return (n.children ?? []).find((c) => c.type === 'tag' && (c.name ?? '').toLowerCase() === name);
}

export function htmlToMarkdown(
  html: string,
  pageUrl: string,
  opts: HtmlToMarkdownOptions = {},
): string {
  if (!html || html.trim() === '') return '';
  const $ = cheerio.load(html);
  let base = pageUrl;
  const baseHref = $('base[href]').first().attr('href');
  if (baseHref) base = abs(baseHref, pageUrl) || pageUrl;

  let root: ReturnType<typeof $> | null = null;
  if (!opts.wholePage) {
    const selector = opts.contentAreaSelector?.trim();
    if (selector) {
      try {
        const hit = $(selector).first();
        if (hit.length) root = hit;
      } catch {
        // Invalid selector — fall back to the heuristic.
      }
    }
    root ??=
      [$('main').first(), $('article').first(), $('[role="main"]').first()].find(
        (r) => r.length > 0 && r.text().trim().length > 0,
      ) ?? null;
  }
  root ??= $('body').length ? $('body').first() : $.root();

  const writer = new Writer(base);
  const node = root.get(0) as unknown as Node | undefined;
  const blocks = node ? writer.blocks(node.children, 0) : [];
  const title = collapse($('title').first().text()).trim();
  const hasH1 = blocks.some((b) => b.startsWith('# '));
  const parts = !hasH1 && title ? [`# ${escapeText(title)}`, ...blocks] : blocks;
  return (
    parts
      .map((b) => b.replace(/[ \t]+$/gm, ''))
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  );
}
