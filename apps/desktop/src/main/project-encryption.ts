/**
 * V1 #4 — Encrypted project snapshot.
 *
 * Container format (binary):
 *   ┌────────────┬───────────────┬───────────────┬──────────────────┬──────────────────┐
 *   │ 8 B magic  │ 1 B version   │ 16 B salt     │ 12 B IV (nonce)  │ ciphertext + GCM │
 *   │ "FCRYPT01" │ 0x01          │ random        │ random           │ 16 B auth tag    │
 *   └────────────┴───────────────┴───────────────┴──────────────────┴──────────────────┘
 *
 * - PBKDF2-SHA256, 200 000 iterations, 32-byte derived key.
 * - AES-256-GCM with a per-file random IV — never reuse an IV with the
 *   same key (the salt is also fresh per-file so the key is always
 *   fresh; doubly safe).
 * - The GCM auth tag covers everything the cipher saw (the ciphertext);
 *   the header bytes are also fed in as AAD so any header tampering
 *   surfaces as a decrypt failure instead of a silent re-keying.
 *
 * Why a snapshot and not at-rest encryption?
 *   `node:sqlite` has no built-in encryption (SEE / SQLCipher would need
 *   a native module). Encrypting the whole `.seoproject` file at save
 *   time + decrypting to a working copy at open is the pragmatic V1
 *   path: simple, well-trodden cryptography, no native deps. The cost
 *   is that the *running* working copy is unencrypted on disk while
 *   the project is open — which matches the trust model (only the
 *   user who can log into their account can read it).
 */

import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from 'node:crypto';
import {
  closeSync,
  createReadStream,
  createWriteStream,
  openSync,
  readSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { finished, pipeline } from 'node:stream/promises';

const MAGIC = Buffer.from('FCRYPT01', 'utf8'); // 8 bytes
const VERSION = 0x01;
const SALT_LEN = 16;
const IV_LEN = 12;
const KEY_LEN = 32;
const TAG_LEN = 16;
const PBKDF2_ITERATIONS = 200_000;
const HEADER_LEN = MAGIC.length + 1 + SALT_LEN + IV_LEN; // magic + version + salt + iv

/** Streaming chunk size — large enough that syscall overhead is noise,
 *  small enough that peak memory stays flat for any project size. */
const STREAM_HIGH_WATER_MARK = 8 * 1024 * 1024;

/**
 * Encrypt the file at `srcPath` and write the encrypted container to
 * `dstPath`. Fully streaming: read → AES-GCM transform → write in 8 MB
 * chunks, so peak memory is O(chunk) no matter how large the project
 * file is. The previous whole-file-in-a-Buffer version needed
 * plaintext + ciphertext resident at once — on a multi-GB project
 * that alone could blow Electron's 4 GB heap cap (Buffers count
 * against it, unlike plain Node). Throws if the password is empty or
 * the source file can't be read.
 */
export async function encryptFile(
  srcPath: string,
  dstPath: string,
  password: string,
): Promise<{ bytesWritten: number }> {
  if (!password || password.length === 0) {
    throw new Error('Password is required.');
  }
  const srcSize = statSync(srcPath).size;
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256');

  const header = Buffer.concat([MAGIC, Buffer.from([VERSION]), salt, iv]);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(header);

  const out = createWriteStream(dstPath);
  out.write(header);
  // `end: false` keeps the sink open — the GCM auth tag only exists
  // after the cipher flushes, and it goes at the end of the container.
  await pipeline(
    createReadStream(srcPath, { highWaterMark: STREAM_HIGH_WATER_MARK }),
    cipher,
    out,
    { end: false },
  );
  out.end(cipher.getAuthTag());
  await finished(out);
  // GCM ciphertext length equals plaintext length.
  return { bytesWritten: HEADER_LEN + srcSize + TAG_LEN };
}

/**
 * Decrypt the encrypted container at `srcPath` and write the recovered
 * `.seoproject` bytes to `dstPath`. Throws on bad magic, unsupported
 * version, or an authentication-tag mismatch (wrong password / file
 * tampered with).
 *
 * Streaming, with the same all-or-nothing contract as the old
 * in-memory version: plaintext is streamed into a sibling temp file
 * and only renamed onto `dstPath` after `decipher.final()` verifies
 * the GCM tag — so `dstPath` never contains unauthenticated bytes.
 */
export async function decryptFile(
  srcPath: string,
  dstPath: string,
  password: string,
): Promise<{ bytesWritten: number }> {
  if (!password || password.length === 0) {
    throw new Error('Password is required.');
  }
  const srcSize = statSync(srcPath).size;
  if (srcSize < HEADER_LEN + TAG_LEN) {
    throw new Error('Encrypted file is truncated or not a FreeCrawl encrypted project.');
  }
  // Positional reads for the fixed-size header and the trailing tag —
  // the ciphertext between them is never held in memory.
  const header = Buffer.alloc(HEADER_LEN);
  const tag = Buffer.alloc(TAG_LEN);
  const fd = openSync(srcPath, 'r');
  try {
    if (
      readSync(fd, header, 0, HEADER_LEN, 0) !== HEADER_LEN ||
      readSync(fd, tag, 0, TAG_LEN, srcSize - TAG_LEN) !== TAG_LEN
    ) {
      throw new Error('Encrypted file is truncated or not a FreeCrawl encrypted project.');
    }
  } finally {
    closeSync(fd);
  }
  if (!header.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error('File is not a FreeCrawl encrypted project (bad magic).');
  }
  const version = header[MAGIC.length];
  if (version !== VERSION) {
    throw new Error(`Unsupported encrypted-project version: 0x${version?.toString(16) ?? '??'}.`);
  }
  const salt = header.subarray(MAGIC.length + 1, MAGIC.length + 1 + SALT_LEN);
  const iv = header.subarray(
    MAGIC.length + 1 + SALT_LEN,
    MAGIC.length + 1 + SALT_LEN + IV_LEN,
  );

  const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(header);
  decipher.setAuthTag(tag);

  const ciphertextLen = srcSize - HEADER_LEN - TAG_LEN;
  if (ciphertextLen === 0) {
    // Degenerate empty-payload container — still verify the tag.
    try {
      decipher.final();
    } catch {
      throw new Error(
        'Could not decrypt — the password is wrong, or the file has been altered.',
      );
    }
    writeFileSync(dstPath, Buffer.alloc(0));
    return { bytesWritten: 0 };
  }

  const tmpPath = `${dstPath}.decrypt-tmp`;
  try {
    await pipeline(
      createReadStream(srcPath, {
        start: HEADER_LEN,
        end: srcSize - TAG_LEN - 1, // `end` is inclusive
        highWaterMark: STREAM_HIGH_WATER_MARK,
      }),
      decipher,
      createWriteStream(tmpPath),
    );
  } catch {
    // GCM auth failure (decipher.final threw inside the pipeline) or
    // an I/O error — either way, drop the partial output. Don't leak
    // which failure it was; surface a single user-friendly error.
    rmSync(tmpPath, { force: true });
    throw new Error(
      'Could not decrypt — the password is wrong, or the file has been altered.',
    );
  }
  renameSync(tmpPath, dstPath);
  return { bytesWritten: ciphertextLen };
}
