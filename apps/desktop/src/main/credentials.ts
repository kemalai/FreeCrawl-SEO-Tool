/**
 * Faz 7 — encrypted integration credential store.
 *
 * Secrets (API keys, OAuth client secrets, service-account JSON) are
 * encrypted at rest with Electron `safeStorage` — OS-backed encryption
 * (DPAPI on Windows, Keychain on macOS, libsecret/kwallet on Linux).
 * This keeps FreeCrawl's zero-native-dependency promise: `safeStorage`
 * is built into Electron, unlike `keytar` which needs node-gyp.
 *
 * On disk the ciphertext lives in `<userData>/credentials.enc.json`,
 * deliberately separate from `preferences.json` so the sensitive file
 * is obvious and a prefs wipe never touches it.
 *
 * File shape: `{ "<integrationId>": { "<fieldKey>": "<base64>" } }`
 * where each value is either `safeStorage`-encrypted ciphertext (when
 * OS encryption is available) or, as a clearly-flagged fallback on
 * systems without a keyring, base64 plaintext.
 *
 * The renderer never receives secret plaintext — `getState()` returns
 * only a `set` boolean per secret field. Non-secret fields (endpoint
 * URLs, OAuth client IDs) do round-trip so the user can see/edit them.
 */
import { app, safeStorage } from 'electron';
import { join } from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import {
  INTEGRATIONS,
  getIntegration,
  type IntegrationsState,
} from '@freecrawl/shared-types';
import * as logger from './logger.js';

/** Marks a stored value as base64 plaintext (no OS encryption available). */
const PLAINTEXT_PREFIX = 'pt:';
/** Marks a stored value as safeStorage ciphertext. */
const CIPHER_PREFIX = 'sb:';

type CredentialFile = Record<string, Record<string, string>>;

let cache: CredentialFile | null = null;

function filePath(): string {
  return join(app.getPath('userData'), 'credentials.enc.json');
}

function load(): CredentialFile {
  if (cache) return cache;
  const path = filePath();
  try {
    if (existsSync(path)) {
      const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        cache = parsed as CredentialFile;
        return cache;
      }
    }
  } catch (err) {
    logger.log(
      'warn',
      'main',
      `credentials store unreadable, starting fresh: ${(err as Error).message}`,
    );
  }
  cache = {};
  return cache;
}

function persist(): void {
  try {
    writeFileSync(filePath(), JSON.stringify(cache ?? {}, null, 2), 'utf8');
  } catch (err) {
    logger.log('error', 'main', `credentials store write failed: ${(err as Error).message}`);
  }
}

/** Encrypt a value for storage. Falls back to base64 when the OS has no keyring. */
function encrypt(value: string): string {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return CIPHER_PREFIX + safeStorage.encryptString(value).toString('base64');
    }
  } catch (err) {
    logger.log('warn', 'main', `safeStorage encrypt failed: ${(err as Error).message}`);
  }
  return PLAINTEXT_PREFIX + Buffer.from(value, 'utf8').toString('base64');
}

/** Decrypt a stored value back to plaintext. Returns '' on any failure. */
function decrypt(stored: string): string {
  try {
    if (stored.startsWith(CIPHER_PREFIX)) {
      const buf = Buffer.from(stored.slice(CIPHER_PREFIX.length), 'base64');
      return safeStorage.decryptString(buf);
    }
    if (stored.startsWith(PLAINTEXT_PREFIX)) {
      return Buffer.from(stored.slice(PLAINTEXT_PREFIX.length), 'base64').toString('utf8');
    }
  } catch (err) {
    logger.log('warn', 'main', `credential decrypt failed: ${(err as Error).message}`);
  }
  return '';
}

/**
 * Whether OS-backed encryption is active. The Settings panel surfaces a
 * warning when this is false so the user knows secrets are only base64
 * on this machine (typically a Linux box with no keyring).
 */
export function isSecureStorageAvailable(): boolean {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}

/**
 * Build the redacted state map for the renderer. Secret field values
 * are blanked (only the `set` flag survives); non-secret fields carry
 * their real value so the UI can show + edit them.
 */
export function getState(): IntegrationsState {
  const store = load();
  const out: IntegrationsState = {};
  for (const def of INTEGRATIONS) {
    const raw = store[def.id] ?? {};
    const fields: IntegrationsState[string]['fields'] = {};
    let allRequiredSet = true;
    for (const field of def.fields) {
      const stored = raw[field.key];
      const set = typeof stored === 'string' && stored.length > 0;
      fields[field.key] = {
        set,
        value: set && !field.secret ? decrypt(stored) : '',
      };
      if (!set && !field.optional) allRequiredSet = false;
    }
    out[def.id] = {
      configured: def.fields.length > 0 && allRequiredSet,
      fields,
    };
  }
  return out;
}

/**
 * Merge credential fields for one integration. Only the supplied keys
 * are written; an omitted field keeps its stored value (so the UI can
 * leave a "saved" secret untouched by not re-sending it). An empty
 * string value deletes that field.
 */
export function setCredentials(id: string, fields: Record<string, string>): IntegrationsState {
  const def = getIntegration(id);
  if (!def) {
    logger.log('warn', 'main', `integrationsSet: unknown integration "${id}"`);
    return getState();
  }
  const store = load();
  const entry = store[id] ?? {};
  for (const field of def.fields) {
    if (!(field.key in fields)) continue;
    const value = fields[field.key] ?? '';
    if (value.length === 0) {
      delete entry[field.key];
    } else {
      entry[field.key] = encrypt(value);
    }
  }
  if (Object.keys(entry).length > 0) {
    store[id] = entry;
  } else {
    delete store[id];
  }
  persist();
  return getState();
}

/** Wipe every stored field of one integration. */
export function clearCredentials(id: string): IntegrationsState {
  const store = load();
  if (store[id]) {
    delete store[id];
    persist();
  }
  return getState();
}

/**
 * Decrypt the credentials of one integration for in-process API use.
 * Returns plaintext field values — callers in the main process only;
 * this must never cross the IPC boundary.
 */
export function resolveCredentials(id: string): Record<string, string> {
  const store = load();
  const raw = store[id] ?? {};
  const out: Record<string, string> = {};
  for (const [key, stored] of Object.entries(raw)) {
    out[key] = decrypt(stored);
  }
  return out;
}
