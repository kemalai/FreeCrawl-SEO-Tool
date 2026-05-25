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
import { readFileSync, writeFileSync } from 'node:fs';

const MAGIC = Buffer.from('FCRYPT01', 'utf8'); // 8 bytes
const VERSION = 0x01;
const SALT_LEN = 16;
const IV_LEN = 12;
const KEY_LEN = 32;
const TAG_LEN = 16;
const PBKDF2_ITERATIONS = 200_000;
const HEADER_LEN = MAGIC.length + 1 + SALT_LEN + IV_LEN; // magic + version + salt + iv

/**
 * Encrypt the file at `srcPath` and write the encrypted container to
 * `dstPath`. The source file is read into memory in one shot — fine for
 * `.seoproject` snapshots which are tens of MB; for hundreds of MB we'd
 * want a streaming variant. Throws if the password is empty or the
 * source file can't be read.
 */
export function encryptFile(
  srcPath: string,
  dstPath: string,
  password: string,
): { bytesWritten: number } {
  if (!password || password.length === 0) {
    throw new Error('Password is required.');
  }
  const plaintext = readFileSync(srcPath);
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256');

  const header = Buffer.concat([MAGIC, Buffer.from([VERSION]), salt, iv]);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(header);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  const out = Buffer.concat([header, ciphertext, tag]);
  writeFileSync(dstPath, out);
  return { bytesWritten: out.length };
}

/**
 * Decrypt the encrypted container at `srcPath` and write the recovered
 * `.seoproject` bytes to `dstPath`. Throws on bad magic, unsupported
 * version, or an authentication-tag mismatch (wrong password / file
 * tampered with).
 */
export function decryptFile(
  srcPath: string,
  dstPath: string,
  password: string,
): { bytesWritten: number } {
  if (!password || password.length === 0) {
    throw new Error('Password is required.');
  }
  const buf = readFileSync(srcPath);
  if (buf.length < HEADER_LEN + TAG_LEN) {
    throw new Error('Encrypted file is truncated or not a FreeCrawl encrypted project.');
  }
  if (!buf.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error('File is not a FreeCrawl encrypted project (bad magic).');
  }
  const version = buf[MAGIC.length];
  if (version !== VERSION) {
    throw new Error(`Unsupported encrypted-project version: 0x${version?.toString(16) ?? '??'}.`);
  }
  const salt = buf.subarray(MAGIC.length + 1, MAGIC.length + 1 + SALT_LEN);
  const iv = buf.subarray(
    MAGIC.length + 1 + SALT_LEN,
    MAGIC.length + 1 + SALT_LEN + IV_LEN,
  );
  const header = buf.subarray(0, HEADER_LEN);
  const tag = buf.subarray(buf.length - TAG_LEN);
  const ciphertext = buf.subarray(HEADER_LEN, buf.length - TAG_LEN);

  const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(header);
  decipher.setAuthTag(tag);
  let plaintext: Buffer;
  try {
    plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    // GCM auth failure — wrong password or corrupted ciphertext. Don't
    // leak which one; surface a single user-friendly error.
    throw new Error(
      'Could not decrypt — the password is wrong, or the file has been altered.',
    );
  }
  writeFileSync(dstPath, plaintext);
  return { bytesWritten: plaintext.length };
}
