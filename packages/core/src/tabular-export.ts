import { createWriteStream, writeFileSync, mkdirSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import path from 'node:path';
import zlib from 'node:zlib';
import type { ProjectDb } from '@freecrawl/db';
import type { CrawlUrlRow, UrlCategory } from '@freecrawl/shared-types';

export interface TabularSection {
  label: string;
  category: UrlCategory;
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
  /** Prefix CSV files with a UTF-8 BOM so Excel-for-Windows opens them
   *  in the correct charset. Ignored for non-CSV formats. Default true. */
  csvBom?: boolean;
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
function sanitizeFormulaPrefix(str: string): string {
  if (!str) return str;
  const first = str.charCodeAt(0);
  // 0x09 TAB, 0x0D CR — both can start a formula in some parsers.
  if (first === 0x3d || first === 0x2b || first === 0x2d || first === 0x40 || first === 0x09 || first === 0x0d) {
    return `'${str}`;
  }
  return str;
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = sanitizeFormulaPrefix(String(value));
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowSource(
  db: ProjectDb,
  category: UrlCategory,
  selectedIds: number[] | undefined,
): Iterable<CrawlUrlRow> {
  if (selectedIds && selectedIds.length > 0) {
    // Apply selectedIds first, then narrow by category client-side. The
    // sidebar's category predicates can be expensive; for export the
    // selection is always the small side.
    const ids = new Set(selectedIds);
    return (function* () {
      for (const row of db.iterateUrlsByCategory(category)) {
        if (ids.has(row.id)) yield row;
      }
    })();
  }
  return db.iterateUrlsByCategory(category);
}

async function writeCsvFile(
  db: ProjectDb,
  filePath: string,
  columns: string[],
  category: UrlCategory,
  selectedIds: number[] | undefined,
  withBom: boolean,
): Promise<number> {
  let rowsWritten = 0;
  const header = columns.join(',') + '\n';
  const source = rowSource(db, category, selectedIds);
  const generator = async function* (): AsyncGenerator<string> {
    if (withBom) yield '﻿' + header;
    else yield header;
    for (const row of source) {
      const line =
        columns
          .map((c) => escapeCsv((row as unknown as Record<string, unknown>)[c]))
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
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xmlSafeTag(name: string): string {
  // Replace anything non-NCName-friendly with `_`. Numeric-leading keys
  // are prefixed with `n` so the doc stays well-formed.
  let safe = name.replace(/[^A-Za-z0-9_.-]/g, '_');
  if (/^[0-9]/.test(safe)) safe = `n${safe}`;
  return safe || '_';
}

async function writeJsonFile(
  db: ProjectDb,
  filePath: string,
  columns: string[],
  category: UrlCategory,
  selectedIds: number[] | undefined,
): Promise<number> {
  let rowsWritten = 0;
  const source = rowSource(db, category, selectedIds);
  const generator = async function* (): AsyncGenerator<string> {
    yield '[';
    let first = true;
    for (const row of source) {
      const obj: Record<string, unknown> = {};
      for (const c of columns) {
        obj[c] = (row as unknown as Record<string, unknown>)[c] ?? null;
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
  db: ProjectDb,
  filePath: string,
  columns: string[],
  category: UrlCategory,
  selectedIds: number[] | undefined,
  sectionLabel: string,
): Promise<number> {
  let rowsWritten = 0;
  const source = rowSource(db, category, selectedIds);
  const rootTag = xmlSafeTag(sectionLabel) || 'export';
  const cols = columns.map((c) => ({ key: c, tag: xmlSafeTag(c) }));
  const generator = async function* (): AsyncGenerator<string> {
    yield `<?xml version="1.0" encoding="UTF-8"?>\n<${rootTag}>\n`;
    for (const row of source) {
      yield '  <row>\n';
      for (const { key, tag } of cols) {
        const v = (row as unknown as Record<string, unknown>)[key];
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

function sanitizeFilename(label: string): string {
  return label.replace(/[\\/?*[\]:<>|"]/g, '_').replace(/\s+/g, '-').toLowerCase();
}

function sanitizeSubdir(subdir: string): string {
  // Sanitize each path segment individually so a hierarchical export like
  // 'crawl-data/internal' stays nested rather than collapsing into one
  // filename component.
  return subdir
    .split(/[\\/]+/)
    .map((seg) => seg.replace(/[\\/?*[\]:<>|"]/g, '_').replace(/\s+/g, '-').toLowerCase())
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

function buildSheetXml(
  rows: CrawlUrlRow[],
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
      const v = (row as unknown as Record<string, unknown>)[col];
      if (v === null || v === undefined || v === '') return;
      const cellRef = `${colLetter(i)}${r}`;
      if (typeof v === 'number' && Number.isFinite(v)) {
        parts.push(`<c r="${cellRef}"><v>${v}</v></c>`);
      } else if (typeof v === 'boolean') {
        parts.push(`<c r="${cellRef}" t="b"><v>${v ? 1 : 0}</v></c>`);
      } else {
        // Bug #9 — neutralise leading formula triggers; Excel auto-runs
        // `=cmd|...` if the cell isn't sanitised. Apostrophe prefix is
        // the canonical guard (OWASP CSV-injection guidance).
        const safe = sanitizeFormulaPrefix(String(v));
        parts.push(
          `<c r="${cellRef}" t="inlineStr"><is><t>${xmlEscape(safe)}</t></is></c>`,
        );
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
  sheets: { name: string; rows: CrawlUrlRow[] }[],
  columns: string[],
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
      data: Buffer.from(buildSheetXml(s.rows, columns), 'utf8'),
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
  if (sections.length === 0) {
    throw new Error('exportTabular: at least one section is required');
  }
  if (columns.length === 0) {
    throw new Error('exportTabular: at least one column is required');
  }

  if (format === 'xlsx') {
    // xlsx — single workbook, one sheet per section. subdir/filename
    // are ignored; the workbook lives at `outputPath`.
    const usedNames = new Set<string>();
    let total = 0;
    const sheets = sections.map((section) => {
      const rows: CrawlUrlRow[] = [];
      for (const row of rowSource(db, section.category, selectedIds)) {
        rows.push(row);
      }
      total += rows.length;
      return { name: sanitizeSheetName(section.label, usedNames), rows };
    });
    const buf = buildXlsxBuffer(sheets, columns);
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
    if (format === 'csv') {
      return writeCsvFile(db, filePath, columns, section.category, selectedIds, csvBom);
    }
    if (format === 'json') {
      return writeJsonFile(db, filePath, columns, section.category, selectedIds);
    }
    return writeXmlFile(db, filePath, columns, section.category, selectedIds, section.label);
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
