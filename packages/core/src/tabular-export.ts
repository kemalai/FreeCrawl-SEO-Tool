import { createWriteStream, writeFileSync, mkdirSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import path from 'node:path';
import zlib from 'node:zlib';
import type { ProjectDb } from '@freecrawl/db';
import type {
  CrawlUrlRow,
  UrlCategory,
  AdvancedFilter,
  ExportDatasetKey,
} from '@freecrawl/shared-types';
import { ensureHeapHeadroom } from './heap-guard.js';
import { escapeCsv } from './spreadsheet.js';
import { datasetRows, readCell, type DatasetExportContext } from './dataset-export.js';

/** How a section selects its rows. `selectedIds` wins; otherwise category is
 *  narrowed by the active search/filter so the export matches the grid. */
interface RowQuery {
  category: UrlCategory;
  selectedIds?: number[];
  search?: string;
  filter?: AdvancedFilter;
}

export interface TabularSection {
  label: string;
  /** URL category to stream `CrawlUrlRow`s from. Required unless `dataset` is set. */
  category?: UrlCategory;
  /** Non-URL-row table (Search Console, Broken Links, …) — see `datasetRows`. */
  dataset?: ExportDatasetKey;
  /** Column keys for this section only; defaults to the export-wide `columns`. */
  columns?: string[];
  /** Optional sub-directory under the export root (for hierarchical
   *  tree exports — e.g. `Internal` → HTML / JS / CSS land under
   *  `internal/`). Ignored for xlsx output. */
  subdir?: string;
  /** Optional filename stem (without extension). Defaults to a
   *  sanitized version of `label`. */
  filename?: string;
}

export interface TabularExportOptions {
  format: 'csv' | 'xlsx' | 'json' | 'xml';
  sections: TabularSection[];
  /** Keys of CrawlUrlRow to include, in order. */
  columns: string[];
  /** When provided AND non-empty, restrict every section to these row ids. */
  selectedIds?: number[];
  /** Active URL-table search — applied to every section (ignored when
   *  `selectedIds` is set) so the export matches the filtered grid. */
  search?: string;
  /** Active advanced filter — same rationale as `search`. */
  filter?: AdvancedFilter;
  /** Prefix CSV files with a UTF-8 BOM so Excel-for-Windows opens them
   *  in the correct charset. Ignored for non-CSV formats. Default true. */
  csvBom?: boolean;
  /** Account / matching context for the dataset sections that need it. */
  datasetContext?: DatasetExportContext;
}

export interface TabularExportResult {
  /** File (xlsx / single-section csv) or folder (multi-section csv). */
  filePath: string;
  files: string[];
  rowsWritten: number;
}

/**
 * Bug #9 — Formula injection guard. Excel + LibreOffice + Google Sheets
 * interpret cells beginning with `=`, `+`, `-`, `@`, or a TAB/CR as
 * formulas (CVE-class). When the source data is crawled HTML (titles,
 * extraction values, anchor text), an attacker can craft a page whose
 * title is e.g. `=cmd|'/c calc'!A1` and have it execute when the user
 * opens the export. We neutralise by prepending a single quote — the
 * canonical CSV-injection mitigation per OWASP. The apostrophe is
 * visible in Excel only when the user is editing the cell.
 */
/**
 * Excel's hard limit on characters in one cell. Exceed it and Excel
 * declares the workbook corrupt ("We found a problem with some content…")
 * and silently drops the record when the user clicks Repair — so the cell
 * that mattered most is the one that disappears. Reachable today from the
 * Structured Data grid export, which writes whole raw JSON-LD blocks.
 */
const XLSX_MAX_CELL_CHARS = 32_767;

/** Render one text cell for a worksheet.
 *
 *  No formula guard here, deliberately. In SpreadsheetML a cell is a
 *  formula only if it carries an `<f>` child; `t="inlineStr"` content is
 *  never evaluated. Prefixing it with `'` therefore protected nothing and
 *  corrupted real values — a title like `-50% İndirim Fırsatı` reached the
 *  user as `'-50% İndirim Fırsatı`. (XLSX being inert this way is exactly
 *  why it is the recommended mitigation for CSV injection.)
 *
 *  `xml:space="preserve"` keeps leading/trailing spaces, which Excel
 *  otherwise trims — and padded anchor text is itself a finding this tool
 *  reports, so silently trimming it destroys the evidence.
 */
function inlineStrCell(cellRef: string, value: unknown): string {
  let text = String(value);
  if (text.length > XLSX_MAX_CELL_CHARS) {
    text = text.slice(0, XLSX_MAX_CELL_CHARS - 1) + '…';
  }
  const preserve = /^\s|\s$/.test(text) ? ' xml:space="preserve"' : '';
  return `<c r="${cellRef}" t="inlineStr"><is><t${preserve}>${xmlEscape(text)}</t></is></c>`;
}

function rowSource(db: ProjectDb, q: RowQuery): Iterable<CrawlUrlRow> {
  if (q.selectedIds && q.selectedIds.length > 0) {
    // Apply selectedIds first, then narrow by category client-side. The
    // sidebar's category predicates can be expensive; for export the
    // selection is always the small side. (An explicit selection overrides
    // the search/filter — the user picked exact rows.)
    const ids = new Set(q.selectedIds);
    return (function* () {
      for (const row of db.iterateUrlsByCategory(q.category)) {
        if (ids.has(row.id)) yield row;
      }
    })();
  }
  // Honour the active search / advanced filter so the export mirrors the
  // on-screen grid rather than the whole category.
  if (q.search || q.filter) {
    return db.iterateUrlsByQuery({
      category: q.category,
      search: q.search,
      filter: q.filter,
    });
  }
  return db.iterateUrlsByCategory(q.category);
}

async function writeCsvFile(
  source: Iterable<Record<string, unknown>>,
  filePath: string,
  columns: string[],
  withBom: boolean,
): Promise<number> {
  let rowsWritten = 0;
  // Escape the header row too: a column label containing a comma, quote or
  // leading `=`/`+`/`-`/`@` would otherwise break the CSV or inject a
  // formula. The data rows below already go through escapeCsv.
  const header = columns.map((c) => escapeCsv(c)).join(',') + '\n';
  const generator = async function* (): AsyncGenerator<string> {
    if (withBom) yield '﻿' + header;
    else yield header;
    for (const row of source) {
      const line =
        columns
          .map((c) => escapeCsv(readCell(row, c)))
          .join(',') + '\n';
      rowsWritten++;
      yield line;
    }
  };
  await pipeline(
    Readable.from(generator()),
    createWriteStream(filePath, { encoding: 'utf8' }),
  );
  return rowsWritten;
}

function escapeXml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return (
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      // Characters XML 1.0 forbids outright — escaping does NOT make them
      // legal. One page whose title carries an interior control char (they
      // arrive via numeric HTML entities and survive `.trim()`) made the
      // whole document unparseable, so every consumer saw zero rows from a
      // single bad page. `xmlEscape` below already strips these; this
      // escaper was simply missing it.
      // eslint-disable-next-line no-control-regex -- intentionally matching control chars to strip them
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  );
}

function xmlSafeTag(name: string): string {
  // Replace anything non-NCName-friendly with `_`. Numeric-leading keys
  // are prefixed with `n` so the doc stays well-formed.
  let safe = name.replace(/[^A-Za-z0-9_.-]/g, '_');
  if (/^[0-9]/.test(safe)) safe = `n${safe}`;
  return safe || '_';
}

async function writeJsonFile(
  source: Iterable<Record<string, unknown>>,
  filePath: string,
  columns: string[],
): Promise<number> {
  let rowsWritten = 0;
  const generator = async function* (): AsyncGenerator<string> {
    yield '[';
    let first = true;
    for (const row of source) {
      const obj: Record<string, unknown> = {};
      for (const c of columns) {
        obj[c] = readCell(row, c) ?? null;
      }
      yield (first ? '\n  ' : ',\n  ') + JSON.stringify(obj);
      first = false;
      rowsWritten++;
    }
    yield first ? ']\n' : '\n]\n';
  };
  await pipeline(
    Readable.from(generator()),
    createWriteStream(filePath, { encoding: 'utf8' }),
  );
  return rowsWritten;
}

async function writeXmlFile(
  source: Iterable<Record<string, unknown>>,
  filePath: string,
  columns: string[],
  sectionLabel: string,
): Promise<number> {
  let rowsWritten = 0;
  const rootTag = xmlSafeTag(sectionLabel) || 'export';
  const cols = columns.map((c) => ({ key: c, tag: xmlSafeTag(c) }));
  const generator = async function* (): AsyncGenerator<string> {
    yield `<?xml version="1.0" encoding="UTF-8"?>\n<${rootTag}>\n`;
    for (const row of source) {
      yield '  <row>\n';
      for (const { key, tag } of cols) {
        const v = readCell(row, key);
        if (v === null || v === undefined) continue;
        yield `    <${tag}>${escapeXml(v)}</${tag}>\n`;
      }
      yield '  </row>\n';
      rowsWritten++;
    }
    yield `</${rootTag}>\n`;
  };
  await pipeline(
    Readable.from(generator()),
    createWriteStream(filePath, { encoding: 'utf8' }),
  );
  return rowsWritten;
}

// Windows reserved device names — writing to `con.csv` etc. targets the
// console/printer device, not a file. Rejected in both helpers.
const WINDOWS_DEVICE_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

function sanitizeSegment(seg: string): string {
  const cleaned = seg
    // eslint-disable-next-line no-control-regex -- deliberately stripping control chars from a filename
    .replace(/[\\/?*[\]:<>|"\x00-\x1f]/g, '_')
    .replace(/\s+/g, '-')
    .toLowerCase();
  return WINDOWS_DEVICE_NAMES.test(cleaned) ? `_${cleaned}` : cleaned;
}

function sanitizeFilename(label: string): string {
  const cleaned = sanitizeSegment(label);
  // A bare `.`/`..` (or one that sanitised down to that) must never become a
  // filename — strip leading/trailing dots.
  const stripped = cleaned.replace(/^\.+|\.+$/g, '');
  return stripped.length > 0 ? stripped : 'export';
}

function sanitizeSubdir(subdir: string): string {
  // Sanitize each path segment individually so a hierarchical export like
  // 'crawl-data/internal' stays nested rather than collapsing into one
  // filename component. `.`/`..` segments are dropped so a caller-supplied
  // `../../etc` cannot escape the chosen output root (path traversal).
  return subdir
    .split(/[\\/]+/)
    .filter((seg) => seg !== '.' && seg !== '..')
    .map(sanitizeSegment)
    .filter((seg) => seg.length > 0)
    .join(path.sep);
}

// ── Minimal XLSX writer ─────────────────────────────────────────────
//
// Office Open XML SpreadsheetML, packaged as a ZIP with DEFLATE entries.
// Uses inline strings (no shared-string table) — slightly fatter on disk
// but lets us stream-build sheet XML row-by-row without a second pass.
//
// Worksheet shape:
//   <worksheet><sheetData>
//     <row r="1"><c r="A1" t="inlineStr"><is><t>URL</t></is></c>...</row>
//     <row r="2"><c r="A2" t="inlineStr"><is><t>https://...</t></is></c>...</row>
//   </sheetData></worksheet>
//
// Numbers go in as <c><v>123</v></c> (no `t=` attribute, default = number).

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // strip control chars XML 1.0 forbids
    // eslint-disable-next-line no-control-regex -- intentionally matching control chars to strip them
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

function colLetter(idx: number): string {
  // 0-based → A, B, ..., Z, AA, AB, ...
  let n = idx;
  let s = '';
  while (true) {
    const r = n % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor(n / 26) - 1;
    if (n < 0) break;
  }
  return s;
}

function sanitizeSheetName(label: string, used: Set<string>): string {
  let base = label.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31);
  if (!base) base = 'Sheet';
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${i++})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

/**
 * Sheet XML from a plain cell matrix. Split out of the CrawlUrlRow
 * variant below so the detail-panel grids — whose rows are already
 * formatted strings, not database records — can reuse the same writer.
 */
function buildSheetXmlFromCells(
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
): string {
  const parts: string[] = [];
  parts.push(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetData>',
  );
  parts.push('<row r="1">');
  headers.forEach((h, i) => {
    parts.push(
      `<c r="${colLetter(i)}1" t="inlineStr"><is><t>${xmlEscape(h)}</t></is></c>`,
    );
  });
  parts.push('</row>');
  rows.forEach((row, rIdx) => {
    const r = rIdx + 2;
    parts.push(`<row r="${r}">`);
    row.forEach((v, i) => {
      if (v === null || v === undefined || v === '') return;
      const cellRef = `${colLetter(i)}${r}`;
      if (typeof v === 'number' && Number.isFinite(v)) {
        parts.push(`<c r="${cellRef}"><v>${v}</v></c>`);
      } else if (typeof v === 'boolean') {
        parts.push(`<c r="${cellRef}" t="b"><v>${v ? 1 : 0}</v></c>`);
      } else {
        parts.push(inlineStrCell(cellRef, v));
      }
    });
    parts.push('</row>');
  });
  parts.push('</sheetData></worksheet>');
  return parts.join('');
}

function buildSheetXml(
  rows: Record<string, unknown>[],
  columns: string[],
): string {
  const parts: string[] = [];
  parts.push(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetData>',
  );
  // Header row
  parts.push('<row r="1">');
  columns.forEach((c, i) => {
    parts.push(
      `<c r="${colLetter(i)}1" t="inlineStr"><is><t>${xmlEscape(c)}</t></is></c>`,
    );
  });
  parts.push('</row>');
  // Data rows
  rows.forEach((row, rIdx) => {
    const r = rIdx + 2;
    parts.push(`<row r="${r}">`);
    columns.forEach((col, i) => {
      const v = readCell(row, col);
      if (v === null || v === undefined || v === '') return;
      const cellRef = `${colLetter(i)}${r}`;
      if (typeof v === 'number' && Number.isFinite(v)) {
        parts.push(`<c r="${cellRef}"><v>${v}</v></c>`);
      } else if (typeof v === 'boolean') {
        parts.push(`<c r="${cellRef}" t="b"><v>${v ? 1 : 0}</v></c>`);
      } else {
        parts.push(inlineStrCell(cellRef, v));
      }
    });
    parts.push('</row>');
  });
  parts.push('</sheetData></worksheet>');
  return parts.join('');
}

// ── ZIP writer (DEFLATE, no central directory streaming — small enough
// to buffer per-entry, write central dir at the end). ────────────────

interface ZipEntry {
  name: string;
  raw: Buffer;
  compressed: Buffer;
  crc32: number;
  offset: number;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function buildZip(files: { name: string; data: Buffer }[]): Buffer {
  const entries: ZipEntry[] = [];
  const localChunks: Buffer[] = [];
  let offset = 0;

  for (const f of files) {
    const raw = f.data;
    const compressed = zlib.deflateRawSync(raw);
    const crc = crc32(raw);
    const nameBuf = Buffer.from(f.name, 'utf8');

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // local file header sig
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // gp flag (UTF-8 name)
    localHeader.writeUInt16LE(8, 8); // method = deflate
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(raw.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field len

    entries.push({
      name: f.name,
      raw,
      compressed,
      crc32: crc,
      offset,
    });
    localChunks.push(localHeader, nameBuf, compressed);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralChunks: Buffer[] = [];
  let cdSize = 0;
  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, 'utf8');
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0); // central dir sig
    cd.writeUInt16LE(20, 4); // version made by
    cd.writeUInt16LE(20, 6); // version needed
    cd.writeUInt16LE(0x0800, 8); // gp flag
    cd.writeUInt16LE(8, 10); // method
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(e.crc32, 16);
    cd.writeUInt32LE(e.compressed.length, 20);
    cd.writeUInt32LE(e.raw.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(e.offset, 42);
    centralChunks.push(cd, nameBuf);
    cdSize += cd.length + nameBuf.length;
  }

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localChunks, ...centralChunks, eocd]);
}

function buildXlsxBuffer(
  sheets: { name: string; rows: Record<string, unknown>[]; columns: string[] }[],
): Buffer {
  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    sheets
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join('') +
    '</Types>';

  const rels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';

  const workbook =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheets>' +
    sheets
      .map(
        (s, i) =>
          `<sheet name="${xmlEscape(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
      )
      .join('') +
    '</sheets></workbook>';

  const workbookRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    sheets
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join('') +
    '</Relationships>';

  const files: { name: string; data: Buffer }[] = [
    { name: '[Content_Types].xml', data: Buffer.from(contentTypes, 'utf8') },
    { name: '_rels/.rels', data: Buffer.from(rels, 'utf8') },
    { name: 'xl/workbook.xml', data: Buffer.from(workbook, 'utf8') },
    { name: 'xl/_rels/workbook.xml.rels', data: Buffer.from(workbookRels, 'utf8') },
  ];
  sheets.forEach((s, i) => {
    files.push({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: Buffer.from(buildSheetXml(s.rows, s.columns), 'utf8'),
    });
  });

  return buildZip(files);
}

function resolveSectionPath(
  outputRoot: string,
  section: TabularSection,
  ext: string,
): string {
  const stem = section.filename
    ? sanitizeFilename(section.filename)
    : sanitizeFilename(section.label) || 'section';
  const subdir = section.subdir ? sanitizeSubdir(section.subdir) : '';
  const dir = subdir ? path.join(outputRoot, subdir) : outputRoot;
  mkdirSync(dir, { recursive: true });
  return path.join(dir, `${stem}.${ext}`);
}

export async function exportTabular(
  db: ProjectDb,
  outputPath: string,
  options: TabularExportOptions,
): Promise<TabularExportResult> {
  const { format, sections, columns, selectedIds } = options;
  const csvBom = options.csvBom !== false;
  // Build the per-section query once: an explicit selection overrides the
  // search/filter (the user picked exact rows), otherwise the active grid
  // search + advanced filter apply so the export mirrors the view.
  const queryFor = (category: UrlCategory): RowQuery =>
    selectedIds && selectedIds.length > 0
      ? { category, selectedIds }
      : { category, search: options.search, filter: options.filter };
  if (sections.length === 0) {
    throw new Error('exportTabular: at least one section is required');
  }
  // Every section resolves its own row source and column list: URL
  // categories stream CrawlUrlRows over the shared `columns`; datasets
  // (Search Console, Broken Links, …) walk their own query with the
  // per-section keys the dialog picked for them.
  const columnsFor = (section: TabularSection): string[] => section.columns ?? columns;
  const sourceFor = (section: TabularSection): Iterable<Record<string, unknown>> => {
    if (section.dataset) return datasetRows(db, section.dataset, options.datasetContext);
    if (!section.category) {
      throw new Error(`exportTabular: section '${section.label}' needs a category or a dataset`);
    }
    return rowSource(db, queryFor(section.category)) as Iterable<Record<string, unknown>>;
  };
  for (const section of sections) {
    if (columnsFor(section).length === 0) {
      throw new Error(`exportTabular: section '${section.label}' has no columns`);
    }
  }

  if (format === 'xlsx') {
    // xlsx — single workbook, one sheet per section. subdir/filename
    // are ignored; the workbook lives at `outputPath`. Unlike the
    // CSV/JSON/XML writers below (which stream row-by-row), the xlsx
    // container format forces every sheet into memory at once — so
    // guard the heap while accumulating: better a clear "use CSV for
    // datasets this big" error than a V8 OOM abort of the whole app.
    const usedNames = new Set<string>();
    let total = 0;
    let cells = 0;
    const sheets = sections.map((section) => {
      const rows: Record<string, unknown>[] = [];
      const sheetColumns = columnsFor(section);
      for (const row of sourceFor(section)) {
        rows.push(row);
        if (rows.length % 50_000 === 0) {
          ensureHeapHeadroom('XLSX export', 128 * 1024 * 1024);
        }
      }
      total += rows.length;
      cells += rows.length * sheetColumns.length;
      return { name: sanitizeSheetName(section.label, usedNames), rows, columns: sheetColumns };
    });
    // Workbook buffer is roughly cells × ~24 B of XML.
    ensureHeapHeadroom('XLSX export', cells * 24);
    const buf = buildXlsxBuffer(sheets);
    writeFileSync(outputPath, buf);
    return { filePath: outputPath, files: [outputPath], rowsWritten: total };
  }

  // CSV / JSON / XML — file-per-section. When the export has only one
  // section with no subdir, `outputPath` is treated as the file path
  // directly (backwards compatible with the legacy single-CSV flow).
  const ext = format;
  const singleFlat =
    sections.length === 1 &&
    !sections[0]!.subdir &&
    !sections[0]!.filename &&
    /\.[a-z0-9]+$/i.test(outputPath);
  // Bug #11 — force the resolved path's extension to match `format` so a
  // user-typed "report.txt" with format=json doesn't silently write JSON
  // into the wrong extension. Only applies to the single-file branch
  // (folder mode always names its own files).
  const resolvedOutputPath = singleFlat
    ? outputPath.replace(/\.[a-z0-9]+$/i, `.${ext}`)
    : outputPath;

  const writeOne = async (filePath: string, section: TabularSection): Promise<number> => {
    const source = sourceFor(section);
    const sectionColumns = columnsFor(section);
    if (format === 'csv') {
      return writeCsvFile(source, filePath, sectionColumns, csvBom);
    }
    if (format === 'json') {
      return writeJsonFile(source, filePath, sectionColumns);
    }
    return writeXmlFile(source, filePath, sectionColumns, section.label);
  };

  if (singleFlat) {
    const rows = await writeOne(resolvedOutputPath, sections[0]!);
    return {
      filePath: resolvedOutputPath,
      files: [resolvedOutputPath],
      rowsWritten: rows,
    };
  }

  // Multi-section (or hierarchical) — outputPath is a folder root.
  mkdirSync(outputPath, { recursive: true });
  let total = 0;
  const written: string[] = [];
  for (const section of sections) {
    const file = resolveSectionPath(outputPath, section, ext);
    total += await writeOne(file, section);
    written.push(file);
  }
  return { filePath: outputPath, files: written, rowsWritten: total };
}

// ── Detail-panel grid export ────────────────────────────────────────
//
// The URL Details panel's sub-tabs (Inlinks, Images, HTTP Headers,
// Cookies, …) each show a small table that is already formatted for
// display — the rows are strings the renderer computed, not database
// records. `exportTabular` above can't serve them: it streams straight
// from `ProjectDb` over `CrawlUrlRow` columns. This writer takes the
// literal cells instead, and reuses the same CSV escaping, formula-
// injection guard and XLSX packaging so a detail-panel export is
// indistinguishable from a main-table one.

export interface GridExportOptions {
  format: 'csv' | 'xlsx';
  /** Column headers, in order. */
  headers: readonly string[];
  /** Row cells, aligned to `headers`. */
  rows: readonly (readonly unknown[])[];
  /** Worksheet name (xlsx only). Sanitised to Excel's 31-char rules. */
  sheetName?: string;
  /** Prefix CSV with a UTF-8 BOM so Excel-for-Windows picks UTF-8. */
  csvBom?: boolean;
}

export interface GridExportResult {
  filePath: string;
  rowsWritten: number;
}

/** Write one in-memory grid to a CSV or XLSX file. */
export async function exportGrid(
  filePath: string,
  options: GridExportOptions,
): Promise<GridExportResult> {
  const { format, headers, rows } = options;
  mkdirSync(path.dirname(filePath), { recursive: true });

  if (format === 'xlsx') {
    const sheet = sanitizeSheetName(options.sheetName ?? 'Sheet1', new Set());
    writeFileSync(
      filePath,
      buildZipForCells(sheet, headers, rows),
    );
    return { filePath, rowsWritten: rows.length };
  }

  const withBom = options.csvBom !== false;
  const generator = async function* (): AsyncGenerator<string> {
    const header = headers.map((h) => escapeCsv(h)).join(',') + '\n';
    yield withBom ? '﻿' + header : header;
    for (const row of rows) {
      yield row.map((cell) => escapeCsv(cell)).join(',') + '\n';
    }
  };
  await pipeline(
    Readable.from(generator()),
    createWriteStream(filePath, { encoding: 'utf8' }),
  );
  return { filePath, rowsWritten: rows.length };
}

/** Single-sheet workbook around {@link buildSheetXmlFromCells}. */
function buildZipForCells(
  sheetName: string,
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
): Buffer {
  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '</Types>';
  const rels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';
  const workbook =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets><sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const workbookRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '</Relationships>';

  return buildZip([
    { name: '[Content_Types].xml', data: Buffer.from(contentTypes, 'utf8') },
    { name: '_rels/.rels', data: Buffer.from(rels, 'utf8') },
    { name: 'xl/workbook.xml', data: Buffer.from(workbook, 'utf8') },
    { name: 'xl/_rels/workbook.xml.rels', data: Buffer.from(workbookRels, 'utf8') },
    {
      name: 'xl/worksheets/sheet1.xml',
      data: Buffer.from(buildSheetXmlFromCells(headers, rows), 'utf8'),
    },
  ]);
}
