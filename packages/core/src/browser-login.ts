/**
 * Browser-driven login for JS-heavy SPA login forms.
 *
 * The plain undici + cheerio form-login flow (`crawler.runFormLogin`) can't
 * authenticate against login pages whose fields are client-rendered, whose
 * CSRF token is built in JavaScript, or that submit via XHR. This module
 * drives a real Chromium (via Playwright — already bundled for Faz 1 JS
 * rendering) through the login: navigate → fill credential selectors →
 * submit → wait for the logged-in state → capture session cookies.
 *
 * The captured cookies are returned to the crawler, which bridges them into
 * the same `SessionCookieJar` the undici crawl path replays — so the heavy
 * browser is used once, for login only, and the crawl itself stays fast.
 *
 * A one-shot browser is launched and closed here rather than reusing the
 * render `BrowserPool`: login must work even when the crawl isn't in JS
 * mode, and the pool actively clears cookies between renders (which would
 * wipe the session we just established).
 */

import { existsSync } from 'node:fs';
import { chromium, type LaunchOptions } from 'playwright';
import { PlaywrightBrowserMissingError } from './browser-pool.js';

export interface BrowserLoginInput {
  loginUrl: string;
  usernameSelector: string;
  usernameValue: string;
  passwordSelector: string;
  passwordValue: string;
  submitSelector: string;
  successSelector?: string;
  waitMs?: number;
}

export interface BrowserLoginOptions {
  /** Show the browser window (debug). Default false. */
  headless: boolean;
  /** Chromium channel ('chrome' / 'msedge'); empty = bundled Playwright. */
  channel?: string;
  /** Custom Chromium executable path override. */
  executablePath?: string;
  userAgent?: string;
  acceptLanguage?: string;
  viewport?: { width: number; height: number };
  /** Per-step timeout (navigation, selector waits), ms. Default 30000. */
  timeoutMs?: number;
}

/** A single captured cookie — shape compatible with Playwright's
 *  `context.cookies()` and the {@link import('./cookie-jar.js')} bridge. */
export interface BrowserCookie {
  name: string;
  value: string;
  domain: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  /** Seconds since epoch; -1 for a session cookie. */
  expires?: number;
}

export interface BrowserLoginResult {
  cookies: BrowserCookie[];
  /** The URL the page settled on after a successful login. */
  finalUrl: string;
}

/**
 * Run the scripted login in a one-shot Chromium and return the resulting
 * session cookies. Throws {@link PlaywrightBrowserMissingError} when the
 * browser binary isn't installed; other failures surface as the underlying
 * Playwright error (the caller logs it and proceeds unauthenticated).
 */
export async function runBrowserLogin(
  cfg: BrowserLoginInput,
  opts: BrowserLoginOptions,
): Promise<BrowserLoginResult> {
  const loginUrl = cfg.loginUrl.trim();
  if (!loginUrl) throw new Error('browser login: loginUrl is empty');

  // Pre-flight the bundled-browser case so a missing binary surfaces a
  // single clean install prompt instead of Playwright's per-call banner
  // (mirrors BrowserPool.doStart).
  if (!opts.channel && !opts.executablePath) {
    let resolved = '';
    try {
      resolved = chromium.executablePath();
    } catch {
      /* unresolved → treat as missing below */
    }
    if (!resolved || !existsSync(resolved)) {
      throw new PlaywrightBrowserMissingError(resolved, opts.channel);
    }
  }

  const launchOpts: LaunchOptions = { headless: opts.headless };
  if (opts.channel) launchOpts.channel = opts.channel;
  if (opts.executablePath) launchOpts.executablePath = opts.executablePath;

  const timeout = Math.max(5000, opts.timeoutMs ?? 30_000);
  const browser = await chromium.launch(launchOpts);
  try {
    const context = await browser.newContext({
      viewport: opts.viewport ?? { width: 1366, height: 900 },
      userAgent: opts.userAgent,
      locale: opts.acceptLanguage,
      extraHTTPHeaders: opts.acceptLanguage
        ? { 'Accept-Language': opts.acceptLanguage }
        : undefined,
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(timeout);

    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout });
    await page.fill(cfg.usernameSelector, cfg.usernameValue);
    await page.fill(cfg.passwordSelector, cfg.passwordValue);
    await page.click(cfg.submitSelector);

    // Settle: let the post-submit navigation / XHR auth complete. networkidle
    // covers SPA XHR logins that don't trigger a full navigation; a missed
    // idle window isn't fatal (we still capture whatever cookies exist).
    await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
    const successSel = cfg.successSelector?.trim();
    if (successSel) {
      await page.waitForSelector(successSel, { timeout }).catch(() => {});
    }
    if (cfg.waitMs && cfg.waitMs > 0) {
      await page.waitForTimeout(Math.min(cfg.waitMs, 60_000));
    }

    const cookies = await context.cookies();
    const finalUrl = page.url();
    return {
      cookies: cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        httpOnly: c.httpOnly,
        expires: c.expires,
      })),
      finalUrl,
    };
  } finally {
    await browser.close().catch(() => {});
  }
}
