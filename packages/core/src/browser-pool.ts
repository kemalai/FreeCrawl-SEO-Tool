import { existsSync } from 'node:fs';
import {
  chromium,
  type Browser,
  type BrowserContext,
  type LaunchOptions,
  type Page,
} from 'playwright';

/**
 * Distinct error code so callers (main-process diagnostic dialog,
 * crawler error stream) can recognise the "browser not installed"
 * case and surface a one-time install prompt instead of one warning
 * per URL.
 */
export class PlaywrightBrowserMissingError extends Error {
  public readonly code = 'PLAYWRIGHT_BROWSER_MISSING' as const;
  constructor(
    public readonly executablePath: string,
    public readonly channel?: string,
  ) {
    super(
      `Playwright browser executable not found at ${executablePath || '<unresolved>'}. ` +
        `Run "npx playwright install chromium chromium-headless-shell" to download it, ` +
        `or via the in-app prompt when JS rendering is enabled.`,
    );
    this.name = 'PlaywrightBrowserMissingError';
  }
}

export interface BrowserPoolOptions {
  /** Number of pages kept warm in parallel. Matches crawl maxConcurrency. */
  maxPages: number;
  /** Show the browser window (debug). Default false (headless). */
  headless: boolean;
  /** Viewport dimensions for every page in the pool. */
  viewport: { width: number; height: number };
  /** UA string applied at context level. */
  userAgent?: string;
  /** Accept-Language applied at context level. */
  acceptLanguage?: string;
  /** Playwright Chromium channel (e.g. 'chrome', 'msedge'). Undefined = bundled. */
  channel?: string;
  /** Resource types Playwright should abort before they hit the network. */
  blockResourceTypes?: ReadonlySet<string>;
  /** Custom Chromium executable path (optional override). */
  executablePath?: string;
  /**
   * Optional init script — registered once at the BrowserContext level so
   * every page in the pool runs it on each navigation. Registering on
   * the page (via `page.addInitScript`) would accumulate per-render —
   * after N renders of the same slot the script ran N times. Pinning it
   * to the context at pool start sidesteps the leak entirely; the
   * trade-off is that the script cannot change mid-crawl, which matches
   * how `CrawlConfig.jsRender.prerenderJs` is read (once at launch).
   */
  prerenderJs?: string;
}

interface Slot {
  page: Page;
  busy: boolean;
}

interface Waiter {
  resolve: (slot: Slot) => void;
  reject: (err: Error) => void;
}

/**
 * Reusable Chromium browser + page pool for JS rendering.
 *
 * One Chromium process, one BrowserContext, and N persistent Pages — pages are
 * cheap to recycle (clear cookies between URLs via context.clearCookies, then
 * navigate). This keeps p95 render latency low because page warm-up (~300ms)
 * is paid once at pool init, not per URL.
 *
 * Concurrency: callers `acquire()` a Page, render, then `release()`. The pool
 * blocks acquire when all pages are busy. Pages that throw during a render
 * are dropped + replaced so a single hung page can't take a slot out of
 * rotation permanently.
 */
export class BrowserPool {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private slots: Slot[] = [];
  private waiters: Waiter[] = [];
  private opts: BrowserPoolOptions;
  private starting: Promise<void> | null = null;
  private closed = false;

  constructor(opts: BrowserPoolOptions) {
    this.opts = opts;
  }

  async start(): Promise<void> {
    if (this.starting) return this.starting;
    if (this.browser) return;
    this.starting = this.doStart();
    try {
      await this.starting;
    } finally {
      this.starting = null;
    }
  }

  private async doStart(): Promise<void> {
    const launchOpts: LaunchOptions = {
      headless: this.opts.headless,
    };
    if (this.opts.channel) launchOpts.channel = this.opts.channel;
    if (this.opts.executablePath) launchOpts.executablePath = this.opts.executablePath;

    // Pre-flight check — Playwright's own error is a multi-line ASCII
    // banner emitted PER navigation, which the crawler then logs once
    // per URL. Catching the missing binary up-front lets the host
    // surface a single install prompt and abort the JS render mode.
    //
    // When no explicit executable path or system channel is set,
    // Playwright resolves the bundled browser. `chromium.executablePath()`
    // throws when none is registered yet (very old install) — we treat
    // that as "missing" too. For `headless: true` (default) Playwright
    // 1.49+ also requires the chrome-headless-shell binary, which lives
    // in a sibling directory; checking the regular chromium path is a
    // good-enough proxy because both binaries are installed together
    // by `npx playwright install`.
    if (!this.opts.channel && !this.opts.executablePath) {
      let resolved = '';
      try {
        resolved = chromium.executablePath();
      } catch {
        /* unresolved → fall through to the missing check below */
      }
      if (!resolved || !existsSync(resolved)) {
        throw new PlaywrightBrowserMissingError(resolved, this.opts.channel);
      }
    }

    this.browser = await chromium.launch(launchOpts);
    this.context = await this.browser.newContext({
      viewport: this.opts.viewport,
      userAgent: this.opts.userAgent,
      locale: this.opts.acceptLanguage,
      extraHTTPHeaders: this.opts.acceptLanguage
        ? { 'Accept-Language': this.opts.acceptLanguage }
        : undefined,
      ignoreHTTPSErrors: true,
    });

    // Context-level prerender script — runs once per navigation on every
    // page, without per-page accumulation. Must be set BEFORE pages are
    // created so they inherit it.
    if (this.opts.prerenderJs && this.opts.prerenderJs.length > 0) {
      await this.context.addInitScript({ content: this.opts.prerenderJs });
    }

    if (this.opts.blockResourceTypes && this.opts.blockResourceTypes.size > 0) {
      const blocked = this.opts.blockResourceTypes;
      await this.context.route('**/*', (route) => {
        if (blocked.has(route.request().resourceType())) {
          return route.abort();
        }
        return route.continue();
      });
    }

    for (let i = 0; i < this.opts.maxPages; i++) {
      const page = await this.context.newPage();
      this.slots.push({ page, busy: false });
    }
  }

  async acquire(): Promise<{ page: Page; release: (replace?: boolean) => void }> {
    if (this.closed) throw new Error('BrowserPool closed');
    if (!this.browser || !this.context) await this.start();
    if (this.closed) throw new Error('BrowserPool closed');

    const slot = await this.takeSlot();
    return {
      page: slot.page,
      // Callers pass `release(true)` after an aborted render so the slot's
      // page is closed + replaced before the next acquire. Default is a
      // simple busy=false flip that keeps the page warm.
      release: (replace?: boolean) => this.releaseSlot(slot, replace === true),
    };
  }

  private takeSlot(): Promise<Slot> {
    return new Promise<Slot>((resolve, reject) => {
      const free = this.slots.find((s) => !s.busy);
      if (free) {
        free.busy = true;
        resolve(free);
        return;
      }
      this.waiters.push({
        resolve: (s) => {
          s.busy = true;
          resolve(s);
        },
        reject,
      });
    });
  }

  private releaseSlot(slot: Slot, replace: boolean): void {
    if (replace && this.context && !this.closed) {
      // Drop the (possibly torn) page and create a fresh one in its
      // place. The replacement is awaited inline; new acquires queue
      // behind it. Cheap (~150-300ms) compared with letting a leaked
      // page consume a slot permanently.
      const oldPage = slot.page;
      void oldPage
        .close({ runBeforeUnload: false })
        .catch(() => {})
        .then(async () => {
          if (this.closed || !this.context) return;
          try {
            const fresh = await this.context.newPage();
            slot.page = fresh;
          } catch {
            // Couldn't make a fresh page — mark the slot stale by
            // leaving it busy. The pool degrades by one slot until
            // close().
            slot.busy = true;
            return;
          }
          slot.busy = false;
          const next = this.waiters.shift();
          if (next) next.resolve(slot);
        });
      return;
    }
    slot.busy = false;
    const next = this.waiters.shift();
    if (next) next.resolve(slot);
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    // Reject queued waiters first so callers parked in acquire() exit
    // with a clean error instead of receiving a null page (which would
    // null-deref the next instant on page.goto()).
    const waiters = this.waiters.splice(0);
    waiters.forEach((w) => {
      try {
        w.reject(new Error('BrowserPool closed'));
      } catch {
        /* swallow — waiter cleanup */
      }
    });
    try {
      await this.context?.close();
    } catch {
      /* ignore */
    }
    try {
      await this.browser?.close();
    } catch {
      /* ignore */
    }
    this.context = null;
    this.browser = null;
    this.slots = [];
  }

  isClosed(): boolean {
    return this.closed;
  }
}
