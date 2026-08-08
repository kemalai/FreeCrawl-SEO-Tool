/**
 * Faz 7 — Google OAuth "loopback" keystone.
 *
 * Shared by every Google integration (Search Console, Analytics 4,
 * Sheets). FreeCrawl is local-first — there is no FreeCrawl backend —
 * so each user brings their own Google Cloud OAuth **Desktop** client
 * (BYOC: the client id + secret are entered in Settings → Integrations
 * and resolved here via the encrypted credential store).
 *
 * Flow (RFC 8252 native-app loopback):
 *   1. Spin up a throwaway HTTP server on `127.0.0.1:<random port>`.
 *   2. Open the Google consent screen in the system browser, with that
 *      loopback address as the redirect URI + a PKCE challenge + a
 *      CSRF `state` token.
 *   3. The browser redirects back to the loopback server with an auth
 *      `code`; exchange it (with the PKCE verifier) for an access +
 *      refresh token at Google's token endpoint.
 *   4. Persist the refresh token, encrypted at rest with `safeStorage`
 *      (same OS-backed crypto the API-key store uses), in
 *      `<userData>/google-tokens.enc.json`.
 *
 * Access tokens are short-lived and kept only in memory; they are
 * minted on demand from the refresh token. Nothing secret crosses the
 * IPC boundary — the renderer only ever sees `GoogleAuthState`.
 */
import { app, safeStorage, shell } from 'electron';
import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { GoogleAccount, GoogleAuthState } from '@freecrawl/shared-types';
import { apiFetch } from './api-fetch.js';
import { resolveCredentials } from './credentials.js';
import * as logger from './logger.js';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';
const REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';

/** How long to wait for the user to finish in the browser. */
const CONSENT_TIMEOUT_MS = 5 * 60 * 1000;
/** Refresh the access token this many ms before it actually expires. */
const TOKEN_EXPIRY_SKEW_MS = 60_000;

/**
 * OAuth scope per integration. `openid email` is always appended so the
 * connected account's address can be shown in the UI.
 */
const INTEGRATION_SCOPES: Record<string, string> = {
  gsc: 'https://www.googleapis.com/auth/webmasters.readonly',
  ga4: 'https://www.googleapis.com/auth/analytics.readonly',
  sheets: 'https://www.googleapis.com/auth/spreadsheets',
};

const CIPHER_PREFIX = 'sb:';
const PLAINTEXT_PREFIX = 'pt:';

interface TokenRecord {
  refreshToken: string;
  email: string | null;
  connectedAt: string;
  /** Opaque per-account id. Absent on records written before
   *  multi-account support — `loadStore` backfills those. */
  accountId?: string;
}

/**
 * On-disk shape: **account key** → encrypted JSON of a `TokenRecord`.
 *
 * The account key is `<integrationId>#<accountId>`, which is what lets a
 * user link several Google accounts to the same integration. Records
 * written before multi-account support used the bare integration id as
 * the key; `loadStore` migrates those in place on first read.
 */
type TokenFile = Record<string, string>;

/** Separator between the integration id and the account id in a key. */
const KEY_SEP = '#';

let cache: TokenFile | null = null;
/** In-memory short-lived access tokens — never persisted. Keyed by the
 *  same account key as the store. */
const accessTokens = new Map<string, { token: string; expiresAt: number }>();
/** Guards against two consent flows running at once. */
let authInProgress = false;

/** Compose the store key for one account of one integration. */
function accountKey(integrationId: string, accountId: string): string {
  return `${integrationId}${KEY_SEP}${accountId}`;
}

/** Split a store key back into its integration + account ids. */
function parseKey(key: string): { integrationId: string; accountId: string } | null {
  const i = key.indexOf(KEY_SEP);
  if (i <= 0) return null;
  return { integrationId: key.slice(0, i), accountId: key.slice(i + 1) };
}

function filePath(): string {
  return join(app.getPath('userData'), 'google-tokens.enc.json');
}

function loadStore(): TokenFile {
  if (cache) return cache;
  try {
    const path = filePath();
    if (existsSync(path)) {
      const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        cache = parsed as TokenFile;
        migrateLegacyKeys();
        return cache;
      }
    }
  } catch (err) {
    logger.log(
      'warn',
      'main',
      `google token store unreadable, starting fresh: ${(err as Error).message}`,
    );
  }
  cache = {};
  return cache;
}

/**
 * Rewrite pre-multi-account entries — keyed by the bare integration id —
 * into `<integrationId>#<accountId>` form so an existing connection
 * survives the upgrade as the integration's first linked account. Runs
 * once per process, right after the store is first read.
 */
function migrateLegacyKeys(): void {
  const store = cache;
  if (!store) return;
  let changed = false;
  for (const key of Object.keys(store)) {
    // Already namespaced, or not one of ours — leave alone.
    if (key.includes(KEY_SEP) || !(key in INTEGRATION_SCOPES)) continue;
    const raw = store[key]!;
    let record: TokenRecord | null = null;
    try {
      record = JSON.parse(decrypt(raw)) as TokenRecord;
    } catch {
      /* corrupt — drop it below */
    }
    delete store[key];
    changed = true;
    if (!record?.refreshToken) continue;
    const accountId = record.accountId || newAccountId();
    store[accountKey(key, accountId)] = encrypt(
      JSON.stringify({ ...record, accountId }),
    );
    logger.log(
      'info',
      'main',
      `google-oauth: migrated "${key}" to multi-account (${record.email ?? 'unknown account'})`,
    );
  }
  if (changed) persist();
}

/** Short opaque id for a newly linked account. */
function newAccountId(): string {
  return randomBytes(6).toString('hex');
}

function persist(): void {
  try {
    writeFileSync(filePath(), JSON.stringify(cache ?? {}, null, 2), 'utf8');
  } catch (err) {
    logger.log('error', 'main', `google token store write failed: ${(err as Error).message}`);
  }
}

function encrypt(value: string): string {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return CIPHER_PREFIX + safeStorage.encryptString(value).toString('base64');
    }
  } catch (err) {
    logger.log('warn', 'main', `google token encrypt failed: ${(err as Error).message}`);
  }
  return PLAINTEXT_PREFIX + Buffer.from(value, 'utf8').toString('base64');
}

function decrypt(stored: string): string {
  try {
    if (stored.startsWith(CIPHER_PREFIX)) {
      return safeStorage.decryptString(
        Buffer.from(stored.slice(CIPHER_PREFIX.length), 'base64'),
      );
    }
    if (stored.startsWith(PLAINTEXT_PREFIX)) {
      return Buffer.from(stored.slice(PLAINTEXT_PREFIX.length), 'base64').toString('utf8');
    }
  } catch (err) {
    logger.log('warn', 'main', `google token decrypt failed: ${(err as Error).message}`);
  }
  return '';
}

/** Read one account's token record by its full store key. */
function readRecordByKey(key: string): TokenRecord | null {
  const raw = loadStore()[key];
  if (!raw) return null;
  try {
    const json = decrypt(raw);
    if (!json) return null;
    const parsed = JSON.parse(json) as TokenRecord;
    if (parsed && typeof parsed.refreshToken === 'string' && parsed.refreshToken) {
      return parsed;
    }
  } catch {
    /* corrupt record — treat as not connected */
  }
  return null;
}

function writeRecord(integrationId: string, record: TokenRecord): void {
  const store = loadStore();
  store[accountKey(integrationId, record.accountId ?? newAccountId())] = encrypt(
    JSON.stringify(record),
  );
  persist();
}

/**
 * Every account linked to one integration, in connection order. This is
 * the list the account dropdowns render.
 */
export function listAccounts(integrationId: string): GoogleAccount[] {
  const store = loadStore();
  const out: GoogleAccount[] = [];
  for (const key of Object.keys(store)) {
    const parsed = parseKey(key);
    if (!parsed || parsed.integrationId !== integrationId) continue;
    const record = readRecordByKey(key);
    if (!record) continue;
    out.push({
      accountId: parsed.accountId,
      email: record.email,
      connectedAt: record.connectedAt,
    });
  }
  out.sort((a, b) => a.connectedAt.localeCompare(b.connectedAt));
  return out;
}

/**
 * Resolve which account an API call should use. An explicit id wins; a
 * blank one falls back to the first linked account, which is what every
 * pre-multi-account caller (and project) implicitly means.
 */
export function resolveAccountId(
  integrationId: string,
  requested?: string,
): string | null {
  const accounts = listAccounts(integrationId);
  if (accounts.length === 0) return null;
  if (requested && accounts.some((a) => a.accountId === requested)) {
    return requested;
  }
  return accounts[0]!.accountId;
}

/** Redacted connection state for the renderer — no tokens cross IPC. */
export function getAuthState(integrationId: string): GoogleAuthState {
  const accounts = listAccounts(integrationId);
  const first = accounts[0];
  return {
    connected: accounts.length > 0,
    email: first?.email ?? null,
    connectedAt: first?.connectedAt ?? null,
    accounts,
  };
}

/** True when the integration id is an OAuth-keystone Google integration. */
export function isGoogleOAuthIntegration(id: string): boolean {
  return id in INTEGRATION_SCOPES;
}

function base64url(buf: Buffer): string {
  return buf.toString('base64url');
}

/**
 * Turn an OAuth `error=` callback code into something the user can act
 * on. `access_denied` is the one that matters: with the BYOC model the
 * consent screen starts in "Testing", where only accounts on the test
 * user list may authorise — so linking a second account fails here
 * until that account is added.
 */
function consentError(code: string): string {
  if (code === 'access_denied') {
    return 'Access blocked by Google (access_denied). If your OAuth consent screen is in "Testing" status, only accounts on its test-user list can connect — add this Google account under Google Cloud Console → APIs & Services → OAuth consent screen → Audience → Test users, then try again. Otherwise you declined the permission prompt.';
  }
  if (code === 'admin_policy_enforced') {
    return 'Your Google Workspace admin blocks this app (admin_policy_enforced). Ask them to allow the Search Console / Analytics scopes for your OAuth client, or connect a personal Google account instead.';
  }
  return `Consent denied (${code})`;
}

/** Resolve the user's BYOC client id + secret, or throw a clear error. */
function resolveClient(integrationId: string): {
  clientId: string;
  clientSecret: string;
} {
  const creds = resolveCredentials(integrationId);
  const clientId = (creds['clientId'] ?? '').trim();
  const clientSecret = (creds['clientSecret'] ?? '').trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing OAuth client — enter your Google Cloud client ID and secret in Settings → Integrations first.',
    );
  }
  return { clientId, clientSecret };
}

/**
 * Run the interactive consent flow for one integration. Opens the
 * system browser, catches the loopback redirect, and stores the
 * resulting refresh token. Resolves once the user finishes or cancels.
 */
export async function startAuth(integrationId: string): Promise<GoogleAuthState> {
  const scope = INTEGRATION_SCOPES[integrationId];
  if (!scope) {
    throw new Error(`Unknown Google integration "${integrationId}"`);
  }
  if (authInProgress) {
    throw new Error('Another Google sign-in is already in progress.');
  }
  const { clientId, clientSecret } = resolveClient(integrationId);

  authInProgress = true;
  let server: Server | null = null;
  try {
    const codeVerifier = base64url(randomBytes(32));
    const codeChallenge = base64url(
      createHash('sha256').update(codeVerifier).digest(),
    );
    const stateToken = base64url(randomBytes(16));

    const { code, redirectUri } = await new Promise<{
      code: string;
      redirectUri: string;
    }>((resolve, reject) => {
      const onRequest = (req: IncomingMessage, res: ServerResponse): void => {
        let parsed: URL;
        try {
          parsed = new URL(req.url ?? '/', 'http://127.0.0.1');
        } catch {
          res.statusCode = 400;
          res.end();
          return;
        }
        const code = parsed.searchParams.get('code');
        const error = parsed.searchParams.get('error');
        const returnedState = parsed.searchParams.get('state');
        // Ignore stray requests (favicon, etc.) that carry neither.
        if (!code && !error) {
          res.statusCode = 204;
          res.end();
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        if (error || !code) {
          res.end(resultPage('FreeCrawl — sign-in cancelled', false));
          reject(new Error(error ? consentError(error) : 'No authorization code returned'));
          return;
        }
        if (returnedState !== stateToken) {
          res.end(resultPage('FreeCrawl — sign-in failed', false));
          reject(new Error('OAuth state mismatch — sign-in rejected for safety.'));
          return;
        }
        res.end(resultPage('FreeCrawl — connected', true));
        const addr = server?.address();
        const port = addr && typeof addr === 'object' ? addr.port : 0;
        resolve({ code, redirectUri: `http://127.0.0.1:${port}` });
      };

      server = createServer((req, res) => onRequest(req, res));
      server.on('error', (err) => reject(err));
      server.listen(0, '127.0.0.1', () => {
        const addr = server?.address();
        const port = addr && typeof addr === 'object' ? addr.port : 0;
        if (!port) {
          reject(new Error('Could not open a local callback port.'));
          return;
        }
        const redirectUri = `http://127.0.0.1:${port}`;
        const authUrl =
          `${AUTH_ENDPOINT}?` +
          new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: `${scope} openid email`,
            access_type: 'offline',
            prompt: 'consent',
            state: stateToken,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
          }).toString();
        logger.log('info', 'main', `google-oauth: opening consent for "${integrationId}"`);
        void shell.openExternal(authUrl);
      });

      setTimeout(() => {
        // Google blocks a non-test-user at the consent screen without
        // ever redirecting to the loopback, so that failure reaches us
        // as a timeout rather than an `error=` callback. Say so, since
        // it is by far the most common reason this expires.
        reject(
          new Error(
            'Timed out waiting for the browser sign-in. If Google showed "Access blocked / 403 access_denied", add this Google account under Google Cloud Console → APIs & Services → OAuth consent screen → Audience → Test users, then try again.',
          ),
        );
      }, CONSENT_TIMEOUT_MS);
    });

    // ── Exchange the code for tokens ──────────────────────────────────
    const tokenRes = await apiFetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }).toString(),
      signal: AbortSignal.timeout(30_000),
    });
    const tokenJson = (await tokenRes.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!tokenRes.ok || !tokenJson) {
      const msg =
        (tokenJson?.['error_description'] as string | undefined) ??
        (tokenJson?.['error'] as string | undefined) ??
        `token exchange failed (HTTP ${tokenRes.status})`;
      throw new Error(msg);
    }
    const refreshToken = tokenJson['refresh_token'];
    const accessToken = tokenJson['access_token'];
    if (typeof refreshToken !== 'string' || !refreshToken) {
      throw new Error(
        'Google did not return a refresh token — revoke FreeCrawl access in your Google account and reconnect.',
      );
    }

    // Best-effort: resolve the connected account email for the UI. The
    // access token is held aside until the account id is known, since
    // the in-memory cache is keyed per account.
    let email: string | null = null;
    let pendingAccessToken: { token: string; expiresAt: number } | null = null;
    if (typeof accessToken === 'string' && accessToken) {
      try {
        const uiRes = await apiFetch(USERINFO_ENDPOINT, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(15_000),
        });
        if (uiRes.ok) {
          const ui = (await uiRes.json()) as { email?: unknown };
          if (typeof ui.email === 'string') email = ui.email;
        }
      } catch {
        /* email is cosmetic — ignore */
      }
      const expiresIn =
        typeof tokenJson['expires_in'] === 'number'
          ? (tokenJson['expires_in'] as number)
          : 3600;
      pendingAccessToken = {
        token: accessToken,
        expiresAt: Date.now() + expiresIn * 1000,
      };
    }

    // Re-authorising an address that is already linked refreshes that
    // account in place rather than creating a duplicate row in every
    // dropdown. A brand-new address is appended as another account.
    const existing = email
      ? listAccounts(integrationId).find((a) => a.email === email)
      : undefined;
    const accountId = existing?.accountId ?? newAccountId();

    writeRecord(integrationId, {
      refreshToken,
      email,
      connectedAt: existing?.connectedAt ?? new Date().toISOString(),
      accountId,
    });
    if (pendingAccessToken) {
      accessTokens.set(accountKey(integrationId, accountId), pendingAccessToken);
    }
    logger.log(
      'info',
      'main',
      `google-oauth: "${integrationId}" ${existing ? 'reconnected' : 'connected'}${
        email ? ` as ${email}` : ''
      }`,
    );
    return getAuthState(integrationId);
  } finally {
    authInProgress = false;
    if (server) {
      const s = server as Server & { closeAllConnections?: () => void };
      try {
        s.closeAllConnections?.();
      } catch {
        /* older runtimes */
      }
      s.close();
    }
  }
}

/**
 * Mint a valid access token for an in-process API call. Uses the cached
 * token when still fresh, otherwise refreshes it from the stored
 * refresh token. Main-process only — never expose the result over IPC.
 */
export async function getAccessToken(
  integrationId: string,
  requestedAccountId?: string,
): Promise<string> {
  const accountId = resolveAccountId(integrationId, requestedAccountId);
  if (!accountId) {
    throw new Error(`"${integrationId}" is not connected — sign in with Google first.`);
  }
  const key = accountKey(integrationId, accountId);
  const cached = accessTokens.get(key);
  if (cached && cached.expiresAt - TOKEN_EXPIRY_SKEW_MS > Date.now()) {
    return cached.token;
  }
  const record = readRecordByKey(key);
  if (!record) {
    throw new Error(`"${integrationId}" is not connected — sign in with Google first.`);
  }
  const { clientId, clientSecret } = resolveClient(integrationId);
  const res = await apiFetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: record.refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
    signal: AbortSignal.timeout(30_000),
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !json || typeof json['access_token'] !== 'string') {
    const msg =
      (json?.['error_description'] as string | undefined) ??
      (json?.['error'] as string | undefined) ??
      `token refresh failed (HTTP ${res.status})`;
    throw new Error(`${msg} — you may need to reconnect this integration.`);
  }
  const token = json['access_token'] as string;
  const expiresIn = typeof json['expires_in'] === 'number' ? (json['expires_in'] as number) : 3600;
  accessTokens.set(key, {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
  });
  return token;
}

/**
 * Disconnect one linked account — or, when `accountId` is omitted, every
 * account for the integration. Revokes at Google (best-effort) and wipes
 * the stored refresh token either way.
 */
export async function revokeAuth(
  integrationId: string,
  accountId?: string,
): Promise<GoogleAuthState> {
  const store = loadStore();
  const targets = accountId
    ? [accountKey(integrationId, accountId)]
    : Object.keys(store).filter(
        (k) => parseKey(k)?.integrationId === integrationId,
      );

  for (const key of targets) {
    const record = readRecordByKey(key);
    if (record) {
      try {
        await apiFetch(`${REVOKE_ENDPOINT}?token=${encodeURIComponent(record.refreshToken)}`, {
          method: 'POST',
          signal: AbortSignal.timeout(15_000),
        });
      } catch {
        /* best-effort — local wipe below is what matters */
      }
    }
    if (store[key]) {
      delete store[key];
      persist();
    }
    accessTokens.delete(key);
  }
  logger.log(
    'info',
    'main',
    `google-oauth: "${integrationId}" disconnected${accountId ? ` (account ${accountId})` : ' (all accounts)'}`,
  );
  return getAuthState(integrationId);
}

/** Minimal styled HTML shown in the browser tab after the redirect. */
function resultPage(title: string, ok: boolean): string {
  const accent = ok ? '#34d399' : '#f87171';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0a;font-family:system-ui,sans-serif">
<div style="text-align:center;color:#e5e5e5">
<div style="font-size:42px;color:${accent}">${ok ? '✓' : '✕'}</div>
<h2 style="font-weight:600">${title}</h2>
<p style="color:#a3a3a3">You can close this tab and return to FreeCrawl.</p>
</div></body></html>`;
}
