/**
 * Compressed single-file project container.
 *
 * Container format (binary):
 *   ┌────────────┬─────────────┬────────────────────────────────┐
 *   │ 8 B magic  │ 1 B version │ brotli-compressed SQLite file  │
 *   │ "FCPROJ01" │ 0x01        │                                │
 *   └────────────┴─────────────┴────────────────────────────────┘
 *
 * Why a container instead of the bare database?
 *   A `.seoproject` used to BE the live SQLite database, which is why
 *   saving produced three files: SQLite keeps `-wal` and `-shm` sidecars
 *   next to any database it has open. Those are an implementation detail
 *   of the engine, not something a user should have to keep together
 *   when they move or email a project. Packing the snapshot into one
 *   opaque file makes a project exactly one file again.
 *
 * Why brotli and not gzip?
 *   Measured on real 276–406 MB crawls: gzip -6 gives ~77% reduction,
 *   brotli quality 5 gives ~95% (406 MB → 17.6 MB) and is *faster* to
 *   write. SQLite pages are highly repetitive and brotli's much larger
 *   window catches redundancy gzip's 32 KB window cannot. Both ship
 *   inside Node's zlib, so neither costs a native dependency.
 *
 * Everything is streamed in both directions, so peak memory is O(chunk)
 * regardless of project size — a multi-GB crawl must not have to fit in
 * Electron's heap just to be saved.
 */

import { createReadStream, createWriteStream, openSync, closeSync, readSync } from 'node:fs';
import { rename, rm, stat } from 'node:fs/promises';
import { createBrotliCompress, createBrotliDecompress, constants } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

const MAGIC = Buffer.from('FCPROJ01', 'utf8'); // 8 bytes
const VERSION = 0x01;
export const HEADER_LEN = MAGIC.length + 1;

/** SQLite's own file signature, used to recognise pre-container projects. */
const SQLITE_MAGIC = Buffer.from('SQLite format 3\0', 'utf8');

/**
 * Quality 5 is the knee of the curve: q4 → 19.9 MB / 1.9 s, q5 → 17.6 MB
 * / 2.8 s, q9 → 16.8 MB / 7.2 s on the same 406 MB project. Past q5 the
 * extra seconds buy almost nothing.
 */
const BROTLI_QUALITY = 5;

/** How to read a file the user picked. */
export type ProjectFormat =
  /** Compressed container written by this app. */
  | 'archive'
  /** A bare SQLite database — every project saved before compression landed. */
  | 'sqlite'
  /** Neither signature matched, or the file is too short / unreadable. */
  | 'unknown';

/**
 * Sniff a project file by signature rather than extension, so a renamed
 * or extensionless file still opens and so legacy `.seoproject` files
 * (which are bare databases) are detected as such.
 */
export function detectProjectFormat(path: string): ProjectFormat {
  let fd: number | null = null;
  try {
    fd = openSync(path, 'r');
    const head = Buffer.alloc(16);
    const read = readSync(fd, head, 0, 16, 0);
    if (read >= MAGIC.length && head.subarray(0, MAGIC.length).equals(MAGIC)) {
      return 'archive';
    }
    if (read >= SQLITE_MAGIC.length && head.subarray(0, SQLITE_MAGIC.length).equals(SQLITE_MAGIC)) {
      return 'sqlite';
    }
    return 'unknown';
  } catch {
    return 'unknown';
  } finally {
    if (fd !== null) {
      try {
        closeSync(fd);
      } catch {
        /* already closed */
      }
    }
  }
}

/**
 * Compress `srcDbPath` (a consistent SQLite snapshot) into the container
 * at `dstPath`.
 *
 * Writes to a sibling `.part` file and renames on success: a crash or a
 * full disk midway through leaves the previously saved project intact
 * rather than truncating it to garbage.
 */
export async function packProject(
  srcDbPath: string,
  dstPath: string,
): Promise<{ bytesWritten: number; sourceBytes: number }> {
  const sourceBytes = (await stat(srcDbPath)).size;
  const partPath = `${dstPath}.part`;

  try {
    const out = createWriteStream(partPath);
    // The header goes in uncompressed so `detectProjectFormat` only ever
    // has to read 16 bytes to classify a file.
    out.write(Buffer.concat([MAGIC, Buffer.from([VERSION])]));
    await pipeline(
      createReadStream(srcDbPath),
      createBrotliCompress({
        params: {
          [constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY,
          // Letting brotli size its window to the input is most of the
          // win over gzip on large database files.
          [constants.BROTLI_PARAM_SIZE_HINT]: sourceBytes,
        },
      }),
      out,
    );
    await rename(partPath, dstPath);
  } catch (err) {
    await rm(partPath, { force: true }).catch(() => {});
    throw err;
  }

  return { bytesWritten: (await stat(dstPath)).size, sourceBytes };
}

/**
 * Expand a container into a plain SQLite file at `dstDbPath`, which the
 * app then opens as its working database. Throws when the header is
 * missing or the version is newer than this build understands — better
 * a clear error than a corrupt database.
 */
export async function unpackProject(
  srcPath: string,
  dstDbPath: string,
): Promise<{ bytesWritten: number }> {
  const fd = openSync(srcPath, 'r');
  let version: number;
  try {
    const head = Buffer.alloc(HEADER_LEN);
    const read = readSync(fd, head, 0, HEADER_LEN, 0);
    if (read < HEADER_LEN || !head.subarray(0, MAGIC.length).equals(MAGIC)) {
      throw new Error('Not a FreeCrawl project archive (bad signature).');
    }
    version = head[MAGIC.length]!;
  } finally {
    closeSync(fd);
  }
  if (version > VERSION) {
    throw new Error(
      `This project was saved by a newer version of FreeCrawl (format v${version}). Please update to open it.`,
    );
  }

  const partPath = `${dstDbPath}.part`;
  try {
    await pipeline(
      createReadStream(srcPath, { start: HEADER_LEN }),
      createBrotliDecompress(),
      createWriteStream(partPath),
    );
    await rm(dstDbPath, { force: true });
    await rename(partPath, dstDbPath);
  } catch (err) {
    await rm(partPath, { force: true }).catch(() => {});
    throw err;
  }

  return { bytesWritten: (await stat(dstDbPath)).size };
}
