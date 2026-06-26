/**
 * Generic CSV + XLSX builders for arbitrary tabular data.
 *
 * Unlike `tabular-export.ts` (which is bound to `CrawlUrlRow` with one
 * shared column set), this module takes plain `Record<string, unknown>`
 * rows and per-sheet column definitions — so a single workbook can hold
 * several differently-shaped tables (used by the Log Analyzer export).
 *
 * The XLSX writer is a minimal, dependency-free Office Open XML
 * SpreadsheetML packager (ZIP + DEFLATE, inline strings). It mirrors the
 * proven writer in `tabular-export.ts` but generalised to per-sheet
 * columns. Both share the OWASP formula-injection guard.
 */

import zlib from 'node:zlib';

export interface SheetColumn {
  /** Row object key. */
  key: string;
  /** Human header shown in the first row. */
  label: string;
}

export interface SheetSpec {
  name: string;
  columns: SheetColumn[];
  rows: Array<Record<string, unknown>>;
}

/**
 * Excel / LibreOffice / Sheets execute cells beginning with `=`, `+`,
 * `-`, `@`, TAB, or CR as formulas (CVE-class). Prepend a `'` to neutralise
 * — the canonical OWASP CSV-injection mitigation.
 */
export function sanitizeFormulaPrefix(str: string): string {
  if (!str) return str;
  const first = str.charCodeAt(0);
  if (
    first === 0x3d ||
    first === 0x2b ||
    first === 0x2d ||
    first === 0x40 ||
    first === 0x09 ||
    first === 0x0d
  ) {
    return `'${str}`;
  }
  return str;
}

export function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = sanitizeFormulaPrefix(String(value));
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Build a single CSV table (header + rows). No BOM (caller prepends). */
export function buildCsvTable(
  columns: SheetColumn[],
  rows: Array<Record<string, unknown>>,
): string {
  const lines: string[] = [];
  lines.push(columns.map((c) => escapeCsv(c.label)).join(','));
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCsv(row[c.key])).join(','));
  }
  return lines.join('\n');
}

// ── XLSX internals ───────────────────────────────────────────────────

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // strip control chars XML 1.0 forbids
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

function colLetter(idx: number): string {
  let n = idx;
  let s = '';
  for (;;) {
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

function buildSheetXml(columns: SheetColumn[], rows: Array<Record<string, unknown>>): string {
  const parts: string[] = [];
  parts.push(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetData>',
  );
  parts.push('<row r="1">');
  columns.forEach((c, i) => {
    parts.push(`<c r="${colLetter(i)}1" t="inlineStr"><is><t>${xmlEscape(c.label)}</t></is></c>`);
  });
  parts.push('</row>');
  rows.forEach((row, rIdx) => {
    const r = rIdx + 2;
    parts.push(`<row r="${r}">`);
    columns.forEach((col, i) => {
      const v = row[col.key];
      if (v === null || v === undefined || v === '') return;
      const cellRef = `${colLetter(i)}${r}`;
      if (typeof v === 'number' && Number.isFinite(v)) {
        parts.push(`<c r="${cellRef}"><v>${v}</v></c>`);
      } else if (typeof v === 'boolean') {
        parts.push(`<c r="${cellRef}" t="b"><v>${v ? 1 : 0}</v></c>`);
      } else {
        const safe = sanitizeFormulaPrefix(String(v));
        parts.push(`<c r="${cellRef}" t="inlineStr"><is><t>${xmlEscape(safe)}</t></is></c>`);
      }
    });
    parts.push('</row>');
  });
  parts.push('</sheetData></worksheet>');
  return parts.join('');
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
  const localChunks: Buffer[] = [];
  const entries: { name: string; raw: Buffer; compressed: Buffer; crc: number; offset: number }[] = [];
  let offset = 0;
  for (const f of files) {
    const raw = f.data;
    const compressed = zlib.deflateRawSync(raw);
    const crc = crc32(raw);
    const nameBuf = Buffer.from(f.name, 'utf8');
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(raw.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    entries.push({ name: f.name, raw, compressed, crc, offset });
    localChunks.push(localHeader, nameBuf, compressed);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }
  const centralChunks: Buffer[] = [];
  let cdSize = 0;
  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, 'utf8');
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(e.crc, 16);
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

/** Build a multi-sheet XLSX workbook (each sheet has its own columns). */
export function buildXlsx(sheets: SheetSpec[]): Buffer {
  const used = new Set<string>();
  const named = sheets.map((s) => ({ ...s, name: sanitizeSheetName(s.name, used) }));

  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    named
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
    named.map((s, i) => `<sheet name="${xmlEscape(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
    '</sheets></workbook>';

  const workbookRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    named
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
  named.forEach((s, i) => {
    files.push({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: Buffer.from(buildSheetXml(s.columns, s.rows), 'utf8'),
    });
  });
  return buildZip(files);
}
