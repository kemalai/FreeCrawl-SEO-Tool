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
import type { GoogleAuthState } from '@freecrawl/shared-types';
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
}

/** On-disk shape: integration id → encrypted JSON of a `TokenRecord`. */
type TokenFile = Record<string, string>;

let cache: TokenFile | null = null;
/** In-memory short-lived access tokens — never persisted. */
const accessTokens = new Map<string, { token: string; expiresAt: number }>();
/** Guards against two consent flows running at once. */
let authInProgress = false;

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

function readRecord(integrationId: string): TokenRecord | null {
  const raw = loadStore()[integrationId];
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
  store[integrationId] = encrypt(JSON.stringify(record));
  persist();
}

/** Redacted connection state for the renderer — no tokens cross IPC. */
export function getAuthState(integrationId: string): GoogleAuthState {
  const record = readRecord(integrationId);
  if (!record) return { connected: false, email: null, connectedAt: null };
  return {
    connected: true,
    email: record.email,
    connectedAt: record.connectedAt,
  };
}

/** True when the integration id is an OAuth-keystone Google integration. */
export function isGoogleOAuthIntegration(id: string): boolean {
  return id in INTEGRATION_SCOPES;
}

function base64url(buf: Buffer): string {
  return buf.toString('base64url');
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
          reject(new Error(error ? `Consent denied (${error})` : 'No authorization code returned'));
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
        reject(new Error('Timed out waiting for the browser sign-in.'));
      }, CONSENT_TIMEOUT_MS);
    });

    // ── Exchange the code for tokens ──────────────────────────────────
    const tokenRes = await fetch(TOKEN_ENDPOINT, {
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

    // Best-effort: resolve the connected account email for the UI.
    let email: string | null = null;
    if (typeof accessToken === 'string' && accessToken) {
      try {
        const uiRes = await fetch(USERINFO_ENDPOINT, {
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
      accessTokens.set(integrationId, {
        token: accessToken,
        expiresAt: Date.now() + expiresIn * 1000,
      });
    }

    writeRecord(integrationId, {
      refreshToken,
      email,
      connectedAt: new Date().toISOString(),
    });
    logger.log(
      'info',
      'main',
      `google-oauth: "${integrationId}" connected${email ? ` as ${email}` : ''}`,
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
export async function getAccessToken(integrationId: string): Promise<string> {
  const cached = accessTokens.get(integrationId);
  if (cached && cached.expiresAt - TOKEN_EXPIRY_SKEW_MS > Date.now()) {
    return cached.token;
  }
  const record = readRecord(integrationId);
  if (!record) {
    throw new Error(`"${integrationId}" is not connected — sign in with Google first.`);
  }
  const { clientId, clientSecret } = resolveClient(integrationId);
  const res = await fetch(TOKEN_ENDPOINT, {
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
  accessTokens.set(integrationId, {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
  });
  return token;
}

/** Disconnect — revoke at Google (best-effort) and wipe the stored token. */
export async function revokeAuth(integrationId: string): Promise<GoogleAuthState> {
  const record = readRecord(integrationId);
  if (record) {
    try {
      await fetch(`${REVOKE_ENDPOINT}?token=${encodeURIComponent(record.refreshToken)}`, {
        method: 'POST',
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      /* best-effort — local wipe below is what matters */
    }
  }
  const store = loadStore();
  if (store[integrationId]) {
    delete store[integrationId];
    persist();
  }
  accessTokens.delete(integrationId);
  logger.log('info', 'main', `google-oauth: "${integrationId}" disconnected`);
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
