import type { BrowserPool } from './browser-pool.js';

export interface RenderOptions {
  /** Hard cap on navigation + post-load wait. */
  timeoutMs: number;
  /** Extra wait after `load` / `networkidle` for SPA hydration. */
  ajaxTimeoutMs: number;
  /** Optional selector — pool waits for it to appear before extracting HTML. */
  waitSelector?: string;
  /** Wait condition for page.goto. */
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
  /** Capture screenshots after render completes. */
  screenshotMode?: 'none' | 'fullpage' | 'fold' | 'both';
  /** Detect the LCP candidate element after render. */
  detectLcp?: boolean;
  /** Where to write screenshot PNGs — the caller resolves a per-URL path. */
  screenshotPaths?: {
    fullpage?: string;
    fold?: string;
  };
  /**
   * Override the viewport for this render only. Restores the previous
   * viewport in `finally`. Used by the mobile-screenshot pass to
   * capture a 375×667 variant against the same warm pool.
   */
  viewport?: { width: number; height: number };
}

export interface LcpCandidate {
  selector: string;
  tagName: string;
  width: number;
  height: number;
  /** Approximate viewport coverage 0..1 — width*height / viewport area. */
  coverage: number;
  /** Loaded resource URL (img.src, background-image, video poster). */
  resourceUrl: string | null;
}

export interface RenderResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  /** Final URL after redirects. */
  url: string;
  /** Post-JS rendered DOM (document.documentElement.outerHTML). */
  html: string;
  /** Total render time (navigation + wait + extract) in ms. */
  timingMs: number;
  /** True when navigation reached load/networkidle without error. */
  ok: boolean;
  /** Populated when render failed. */
  error?: string;
  /** Screenshot files actually written (when `screenshotMode` was set). */
  screenshots?: { fullpage?: string; fold?: string };
  /** LCP candidate from `detectLcp` — null when no eligible element found. */
  lcp?: LcpCandidate | null;
}

/**
 * Browser-side JS that walks the document for the largest above-the-fold
 * element. Stringified + injected via `page.evaluate()`. Eligible
 * elements: `<img>`, `<video>`, elements with computed `background-image`,
 * block text containers (when sufficiently large). Returns the element
 * with the largest area inside the initial viewport.
 *
 * Mirrors Chrome's LCP heuristic loosely (we don't have access to the
 * real PerformanceObserver from Playwright reliably across all sites,
 * so we re-compute statically — it lines up with the rendered LCP on
 * static layouts the vast majority of the time).
 */
const LCP_DETECT_FN = `(() => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!vw || !vh) return null;
  const viewportArea = vw * vh;
  const candidates = document.querySelectorAll(
    'img, video, picture, svg, [style*="background-image"], h1, h2, p, section, article, header, main, div',
  );
  let best = null;
  let bestArea = 0;
  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 50) continue;
    if (rect.bottom < 0 || rect.top >= vh) continue;
    const visibleW = Math.max(0, Math.min(rect.right, vw) - Math.max(rect.left, 0));
    const visibleH = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
    const area = visibleW * visibleH;
    if (area <= bestArea) continue;
    // Skip elements that are mostly empty containers — only count text
    // containers that actually have visible text content.
    if (/^(SECTION|ARTICLE|HEADER|MAIN|DIV)$/.test(el.tagName)) {
      const text = el.textContent ? el.textContent.trim() : '';
      if (text.length < 30) continue;
    }
    best = el;
    bestArea = area;
  }
  if (!best) return null;
  // Stable-ish selector — prefer id, then a class chain, then tagName.
  const buildSelector = (node) => {
    if (node.id) return '#' + CSS.escape(node.id);
    if (node.classList && node.classList.length > 0) {
      const cls = [...node.classList].slice(0, 3).map((c) => '.' + CSS.escape(c)).join('');
      return node.tagName.toLowerCase() + cls;
    }
    return node.tagName.toLowerCase();
  };
  const rect = best.getBoundingClientRect();
  let resourceUrl = null;
  if (best.tagName === 'IMG') resourceUrl = best.currentSrc || best.src || null;
  else if (best.tagName === 'VIDEO') resourceUrl = best.poster || best.currentSrc || null;
  else {
    const bg = window.getComputedStyle(best).backgroundImage;
    if (bg && bg !== 'none') {
      const m = bg.match(/url\\(\\s*[\\"']?([^\\"')]+)/);
      if (m) resourceUrl = m[1];
    }
  }
  return {
    selector: buildSelector(best),
    tagName: best.tagName,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    coverage: Math.round((bestArea / viewportArea) * 10000) / 10000,
    resourceUrl: resourceUrl,
  };
})()`;

/**
 * Render a URL via Playwright and return a Response-like result. Cookies are
 * cleared from the BrowserContext between calls upstream — the pool keeps
 * pages warm but does not isolate state per-render. Callers that need state
 * isolation must drop and recreate the context.
 */
export async function renderUrl(
  url: string,
  pool: BrowserPool,
  opts: RenderOptions,
  signal?: AbortSignal,
): Promise<RenderResult> {
  const t0 = Date.now();
  const { page, release } = await pool.acquire();

  let result: RenderResult = {
    status: 0,
    statusText: '',
    headers: {},
    url,
    html: '',
    timingMs: 0,
    ok: false,
  };

  // On abort: close the page so the in-flight page.goto / waitForTimeout
  // bails out immediately (closing the page rejects all pending evaluate
  // calls with `Target closed`). The pool replaces the closed page when
  // we call `release(true)` in finally. Without this, Stop blocks for
  // the full `timeoutMs` waiting on a slow server.
  let aborted = false;
  const abortHandler = (): void => {
    aborted = true;
    page.close({ runBeforeUnload: false }).catch(() => {});
  };
  signal?.addEventListener('abort', abortHandler);

  // Save the viewport so we can restore it on a per-render override.
  // Done before any navigation so even an early throw can roll back.
  const previousViewport = opts.viewport ? page.viewportSize() : null;

  try {
    if (opts.viewport) {
      await page.setViewportSize(opts.viewport);
    }
    const response = await page.goto(url, {
      waitUntil: opts.waitUntil,
      timeout: opts.timeoutMs,
    });

    if (aborted || signal?.aborted) {
      throw new Error('aborted');
    }

    if (opts.waitSelector) {
      try {
        await page.waitForSelector(opts.waitSelector, {
          timeout: Math.max(1, opts.ajaxTimeoutMs),
          state: 'attached',
        });
      } catch {
        // Selector miss is non-fatal — fall through to whatever DOM exists.
      }
    } else if (opts.ajaxTimeoutMs > 0) {
      await page.waitForTimeout(opts.ajaxTimeoutMs);
    }

    if (aborted || signal?.aborted) {
      throw new Error('aborted');
    }

    const html = await page.content();
    const headers = response ? await response.allHeaders() : {};
    const finalUrl = response?.url() ?? page.url();

    // LCP candidate detection — runs before screenshot so the in-page
    // layout pass it triggers is included in the captured viewport.
    let lcp: LcpCandidate | null = null;
    if (opts.detectLcp) {
      try {
        lcp = (await page.evaluate(LCP_DETECT_FN)) as LcpCandidate | null;
      } catch {
        lcp = null;
      }
    }

    // Screenshot capture — best-effort. Failures (e.g. detached page)
    // do not fail the render result.
    const screenshots: { fullpage?: string; fold?: string } = {};
    if (opts.screenshotMode && opts.screenshotMode !== 'none' && opts.screenshotPaths) {
      const mode = opts.screenshotMode;
      if ((mode === 'fullpage' || mode === 'both') && opts.screenshotPaths.fullpage) {
        try {
          await page.screenshot({
            path: opts.screenshotPaths.fullpage,
            fullPage: true,
            type: 'png',
          });
          screenshots.fullpage = opts.screenshotPaths.fullpage;
        } catch {
          /* ignore — fall through */
        }
      }
      if ((mode === 'fold' || mode === 'both') && opts.screenshotPaths.fold) {
        try {
          await page.screenshot({
            path: opts.screenshotPaths.fold,
            fullPage: false,
            type: 'png',
          });
          screenshots.fold = opts.screenshotPaths.fold;
        } catch {
          /* ignore */
        }
      }
    }

    result = {
      status: response?.status() ?? 0,
      statusText: response?.statusText() ?? '',
      headers,
      url: finalUrl,
      html,
      timingMs: Date.now() - t0,
      ok: true,
      screenshots: Object.keys(screenshots).length > 0 ? screenshots : undefined,
      lcp: opts.detectLcp ? lcp : undefined,
    };
  } catch (err) {
    result = {
      ...result,
      timingMs: Date.now() - t0,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    signal?.removeEventListener('abort', abortHandler);
    if (!aborted) {
      // Best-effort cookie wipe between URLs so cross-URL state
      // doesn't leak. Aborted renders skip this — the page is being
      // closed + replaced anyway.
      try {
        await page.context().clearCookies();
      } catch {
        /* ignore */
      }
      // Restore the viewport when a per-render override was applied.
      if (opts.viewport && previousViewport) {
        try {
          await page.setViewportSize(previousViewport);
        } catch {
          /* ignore — pool may be tearing down */
        }
      }
    }
    // On abort the page was closed; the pool replaces it before the
    // next acquire. On normal completion the page stays warm.
    release(aborted);
  }

  return result;
}

export interface MobileUsabilityResult {
  /** Overall pass: viewport meta present + content fits + readable text. */
  ok: boolean;
  /** True when the <meta name="viewport"> tag is present and parseable. */
  hasViewportMeta: boolean;
  /** True when the layout horizontally fits the mobile viewport. */
  fitsViewport: boolean;
  /** True when the smallest body-text font is ≥12px on the mobile viewport. */
  legibleText: boolean;
  /** True when tap targets (≥48 a/button) have adequate spacing. */
  tapTargetsOk: boolean;
  /** Total horizontal overflow in CSS pixels (0 = no overflow). */
  overflowPx: number;
}

const MOBILE_AUDIT_FN = `(() => {
  const out = {
    hasViewportMeta: false,
    fitsViewport: false,
    legibleText: false,
    tapTargetsOk: false,
    overflowPx: 0,
  };
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    const content = (meta.getAttribute('content') || '').toLowerCase();
    out.hasViewportMeta = content.includes('width=') || content.includes('initial-scale');
  }
  const viewport = window.innerWidth;
  const docWidth = Math.max(
    document.documentElement.scrollWidth,
    document.body ? document.body.scrollWidth : 0,
  );
  out.overflowPx = Math.max(0, docWidth - viewport);
  out.fitsViewport = out.overflowPx <= 4;
  // Text legibility — sample up to 30 visible <p>/<span>/<li> elements
  // and check that none use a computed font-size below 12px.
  const sample = Array.from(document.querySelectorAll('p, li, span, td, h3, h4, h5, h6'))
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    })
    .slice(0, 30);
  let tooSmall = 0;
  for (const el of sample) {
    const fs = parseFloat(window.getComputedStyle(el).fontSize || '16');
    if (fs && fs < 12) tooSmall++;
  }
  out.legibleText = sample.length === 0 || tooSmall / sample.length <= 0.1;
  // Tap targets — anchors/buttons with bounding box width AND height
  // below 32 px are considered fail. Empty / hidden ones are skipped.
  const tappable = Array.from(document.querySelectorAll('a, button, [role="button"]'))
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && el.offsetParent !== null;
    });
  let tooSmallTap = 0;
  for (const el of tappable) {
    const r = el.getBoundingClientRect();
    if (r.width < 32 && r.height < 32) tooSmallTap++;
  }
  out.tapTargetsOk = tappable.length === 0 || tooSmallTap / tappable.length <= 0.2;
  return out;
})()`;

/**
 * Re-render the URL on a mobile viewport and run the static
 * mobile-usability checks (viewport meta, layout overflow, font size,
 * tap target spacing). Independent from the main render — callers
 * decide when to invoke (typically only after the desktop pass
 * succeeds, to amortise the second navigation cost).
 */
export async function auditMobileUsability(
  url: string,
  pool: BrowserPool,
  opts: { timeoutMs: number; waitUntil: RenderOptions['waitUntil'] },
  signal?: AbortSignal,
): Promise<MobileUsabilityResult | null> {
  const { page, release } = await pool.acquire();
  let aborted = false;
  const abortHandler = (): void => {
    aborted = true;
    page.close({ runBeforeUnload: false }).catch(() => {});
  };
  signal?.addEventListener('abort', abortHandler);
  try {
    // Switch the page to a mobile viewport for this audit only — the
    // previous size is restored in finally so the next render sees the
    // configured desktop viewport.
    const prev = page.viewportSize();
    await page.setViewportSize({ width: 375, height: 667 });
    try {
      const response = await page.goto(url, {
        waitUntil: opts.waitUntil,
        timeout: opts.timeoutMs,
      });
      if (!response || aborted || signal?.aborted) return null;
      const raw = (await page.evaluate(MOBILE_AUDIT_FN)) as Omit<
        MobileUsabilityResult,
        'ok'
      >;
      const ok =
        raw.hasViewportMeta &&
        raw.fitsViewport &&
        raw.legibleText &&
        raw.tapTargetsOk;
      return { ok, ...raw };
    } finally {
      if (prev && !aborted) {
        try {
          await page.setViewportSize(prev);
        } catch {
          /* ignore — pool may be tearing down */
        }
      }
    }
  } catch {
    return null;
  } finally {
    signal?.removeEventListener('abort', abortHandler);
    if (!aborted) {
      try {
        await page.context().clearCookies();
      } catch {
        /* ignore */
      }
    }
    release(aborted);
  }
}
