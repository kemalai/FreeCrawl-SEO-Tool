import { existsSync } from 'node:fs';
import type { Browser, BrowserContext, LaunchOptions, Page } from 'playwright';

/**
 * Playwright is imported lazily, never at module scope.
 *
 * Its browser registry reads `PLAYWRIGHT_BROWSERS_PATH` exactly once —
 * while the module is being evaluated — and caches the resolved cache
 * directory forever. A static `import { chromium } from 'playwright'`
 * here therefore froze the lookup to the per-user cache before the
 * Electron main process had a chance to point it at the browsers
 * shipped inside the installer, which made the bundled browsers dead
 * weight and sent every packaged user down the "browser missing"
 * path. Loading on first use keeps that env var assignment effective.
 */
async function loadChromium() {
  const { chromium } = await import('playwright');
  return chromium;
}

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

/** Where both Chromium builds live, and whether each is on disk. */
export interface ChromiumBinaries {
  /** Full Chrome-for-Testing build — used for headed launches. */
  chromiumPath: string;
  /** chrome-headless-shell — what Playwright launches when headless. */
  headlessShellPath: string;
  chromiumInstalled: boolean;
  headlessShellInstalled: boolean;
  /** True only when both binaries are present. */
  installed: boolean;
}

/**
 * Derive the chrome-headless-shell path from the full Chromium path.
 *
 * Playwright installs the two as siblings under the same revision
 * (`chromium-1223` / `chromium_headless_shell-1223`) but exposes only
 * the former through `chromium.executablePath()`. The per-platform
 * folder names mirror Playwright's own EXECUTABLE_PATHS table; note
 * that the macOS and Linux-x64 layouts are arch-suffixed since the
 * switch to Chrome-for-Testing builds. Returns '' when the layout is
 * unrecognised — callers then treat the shell as "unknown" rather
 * than "missing".
 */
function deriveHeadlessShellPath(chromiumPath: string): string {
  if (!chromiumPath) return '';
  const base = chromiumPath.replace(/chromium-(\d+)/, 'chromium_headless_shell-$1');
  // Windows — chrome-win64\chrome.exe
  const win = base.replace(
    /chrome-win64[\\/]chrome\.exe$/i,
    'chrome-headless-shell-win64\\chrome-headless-shell.exe',
  );
  if (win !== base) return win;
  // macOS — chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/…
  const mac = base.replace(
    /chrome-mac-(arm64|x64)[\\/].*$/i,
    'chrome-headless-shell-mac-$1/chrome-headless-shell',
  );
  if (mac !== base) return mac;
  // Linux x64 — chrome-linux64/chrome
  const linux = base.replace(
    /chrome-linux64[\\/]chrome$/,
    'chrome-headless-shell-linux64/chrome-headless-shell',
  );
  if (linux !== base) return linux;
  // Linux arm64 — Playwright's own build, chrome-linux/chrome
  const linuxArm = base.replace(/chrome-linux[\\/]chrome$/, 'chrome-linux/headless_shell');
  if (linuxArm !== base) return linuxArm;
  return '';
}

/**
 * Resolve both Chromium binaries and report which are on disk. Used by
 * the pool pre-flight and by the desktop app's startup check that
 * decides whether to download the browser in the background.
 */
export async function resolveChromiumBinaries(): Promise<ChromiumBinaries> {
  const chromium = await loadChromium();
  let chromiumPath = '';
  try {
    chromiumPath = chromium.executablePath();
  } catch {
    /* no browser registered at all → both count as missing */
  }
  const headlessShellPath = deriveHeadlessShellPath(chromiumPath);
  const chromiumInstalled = Boolean(chromiumPath) && existsSync(chromiumPath);
  const headlessShellInstalled = Boolean(headlessShellPath) && existsSync(headlessShellPath);
  return {
    chromiumPath,
    headlessShellPath,
    chromiumInstalled,
    headlessShellInstalled,
    installed: chromiumInstalled && headlessShellInstalled,
  };
}

export interface BrowserPoolOptions {
  /** Number of pages kept warm in parallel. Matches crawl maxConcurrency. */
  maxPages: number;
  /** Show the browser window (debug). Default false (headless). */
  headless: boolean;
  /** Viewport dimensions for every page in the pool. */
  viewport: { width: number; height: number };
  /** Emulate a mobile device (touch, mobile meta viewport, DPR). Chromium
   *  only — set when the crawl's device mode is 'mobile'. */
  isMobile?: boolean;
  /** Device pixel ratio (e.g. 3 for iPhone-class). Defaults to 1. */
  deviceScaleFactor?: number;
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

/** Cap on automatic Chromium relaunches after a `disconnected` event.
 *  Enough to ride out a one-off crash; low enough that a permanently
 *  broken install doesn't pay a launch attempt on every URL. */
const MAX_RELAUNCHES = 3;

interface Slot {
  page: Page;
  busy: boolean;
  /** Slot lost its page and could not get a replacement. It will never
   *  serve another render, so it must not be counted as capacity that a
   *  waiter can eventually be handed. */
  dead?: boolean;
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
  /** How many times Chromium has been relaunched after dying on us. */
  private relaunches = 0;

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
    // Playwright resolves the bundled browser. A headless launch uses
    // chrome-headless-shell, a headed one the full Chrome-for-Testing
    // build — so both are checked independently. If only the shell is
    // absent we degrade to the full build via `channel: 'chromium'`
    // (Playwright's new-headless mode) instead of failing the crawl.
    if (!this.opts.channel && !this.opts.executablePath) {
      const bins = await resolveChromiumBinaries();
      if (!bins.installed) {
        const needsShell = this.opts.headless;
        if (needsShell && bins.chromiumInstalled) {
          launchOpts.channel = 'chromium';
        } else if (!bins.chromiumInstalled) {
          throw new PlaywrightBrowserMissingError(bins.chromiumPath, this.opts.channel);
        }
      }
    }

    const chromium = await loadChromium();
    this.browser = await chromium.launch(launchOpts);
    // Chromium can die on its own — OOM-killed, crashed, or killed by the
    // OS. Nothing polls for that, so without this the pool keeps handing
    // out pages that belong to a process that is gone: every render fails,
    // every replacement `newPage()` fails, and callers park in `acquire()`
    // forever. Fail the slots once, loudly, and let the crawler record the
    // renders as failed instead of stalling on them.
    this.browser.on('disconnected', () => {
      if (this.closed) return;
      // Fail the parked callers FIRST, while the slots still exist — they
      // are holding pages from a dead process and can never be served.
      for (const slot of this.slots) {
        slot.dead = true;
        slot.busy = true;
      }
      this.failIfExhausted(new Error('browser disconnected'));
      // Then clear the pool so the next `acquire()` relaunches instead of
      // handing out corpses. Bounded, because a Chromium that dies on
      // every launch would otherwise cost a relaunch attempt per URL for
      // the rest of the crawl.
      if (this.relaunches >= MAX_RELAUNCHES) return;
      this.relaunches++;
      this.browser = null;
      this.context = null;
      this.slots = [];
    });
    this.context = await this.browser.newContext({
      viewport: this.opts.viewport,
      userAgent: this.opts.userAgent,
      // Mobile emulation — makes responsive CSS/JS render the mobile layout,
      // not just a narrow desktop window. Chromium-only; harmless when false.
      isMobile: this.opts.isMobile,
      hasTouch: this.opts.isMobile,
      deviceScaleFactor: this.opts.deviceScaleFactor,
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
      const free = this.slots.find((s) => !s.busy && !s.dead);
      if (free) {
        free.busy = true;
        resolve(free);
        return;
      }
      // Nothing free — but if nothing is even *alive*, waiting is futile.
      if (!this.slots.some((s) => !s.dead)) {
        reject(
          new Error(
            'BrowserPool: no usable pages left (the browser could not create a new page)',
          ),
        );
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

  /** Reject everyone parked in `acquire()` once no slot can ever serve
   *  them again. Without this a dead pool is indistinguishable from a
   *  busy one and the crawl hangs instead of failing its renders. */
  private failIfExhausted(cause: unknown): void {
    if (this.slots.some((s) => !s.dead)) return;
    const detail = cause instanceof Error ? cause.message : String(cause);
    const waiters = this.waiters.splice(0);
    for (const w of waiters) {
      try {
        w.reject(new Error(`BrowserPool: all pages lost (${detail})`));
      } catch {
        /* swallow — waiter cleanup */
      }
    }
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
          } catch (err) {
            // Couldn't make a fresh page — this slot is gone for good.
            // Leaving it `busy` and returning here used to strand every
            // queued waiter: nothing else ever resolves them, `takeSlot`
            // has no timeout, so `acquire()` never settled, the crawler's
            // task never finished and `queue.onIdle()` never resolved —
            // the crawl sat at "Running" with 0 URL/s until the user hit
            // Stop. When the whole pool dies this way (a crashed or
            // disconnected Chromium fails every slot identically) the
            // waiters must be failed, not forgotten.
            slot.busy = true;
            slot.dead = true;
            this.failIfExhausted(err);
            return;
          }
          slot.busy = false;
          slot.dead = false;
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
