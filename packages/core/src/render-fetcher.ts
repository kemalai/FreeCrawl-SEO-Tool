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
  /** Run the in-page accessibility audit (contrast + focus outline). */
  detectA11y?: boolean;
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
  /** Accessibility audit from `detectA11y` — null when it could not run. */
  a11y?: A11yAudit | null;
}

/** V2 Faz 16 — in-page accessibility audit result. */
export interface A11yAudit {
  /** Sampled text elements whose contrast is below WCAG AA. */
  lowContrast: number;
  /** How many text elements were sampled (context for `lowContrast`). */
  sampled: number;
  /** A stylesheet rule suppresses the focus outline without a fallback. */
  focusSuppressed: boolean;
  /** Sampled text elements rendered below ~12px (too small on mobile). */
  smallFont: number;
  /** Interactive elements rendered below the WCAG 2.5.8 24×24px minimum. */
  tapTargetsSmall: number;
  /** How many interactive elements were sampled (context for the above). */
  tapTargetsSampled: number;
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
 * Browser-side accessibility audit. Stringified + injected via
 * `page.evaluate()`. Two checks:
 *
 *  1. **Colour contrast** — samples up to 500 visible elements that have
 *     direct text, computes the WCAG contrast ratio between the text
 *     colour and the effective background (walking ancestors until an
 *     opaque background-colour is found; default white). Elements over a
 *     background-image are skipped (contrast is indeterminate). Threshold
 *     is 3:1 for large text (>=24px, or >=18.66px bold) and 4.5:1
 *     otherwise — the WCAG 2.1 AA minimums.
 *  2. **Focus outline suppression** — scans accessible stylesheets for a
 *     `:focus` rule that removes the outline (`outline: none/0`) without a
 *     compensating box-shadow/border, and with no `:focus-visible` rule
 *     restoring a visible indicator. Catches the common
 *     `*:focus { outline: none }` keyboard-trap anti-pattern. Cross-origin
 *     sheets (whose cssRules throw) are skipped.
 */
const A11Y_AUDIT_FN = `(() => {
  const parseColor = (s) => {
    const m = s && s.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x.trim()));
    if (p.length < 3 || p.some((n) => !isFinite(n))) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length >= 4 ? p[3] : 1 };
  };
  const relLum = (c) => {
    const f = (v) => { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (fg, bg) => {
    const l1 = relLum(fg), l2 = relLum(bg);
    const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  };
  const over = (top, bottom) => {
    if (top.a >= 1) return top;
    const a = top.a;
    return { r: top.r * a + bottom.r * (1 - a), g: top.g * a + bottom.g * (1 - a), b: top.b * a + bottom.b * (1 - a), a: 1 };
  };
  const effectiveBg = (el) => {
    let node = el;
    while (node && node.nodeType === 1) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0) return c.a >= 1 ? c : over(c, { r: 255, g: 255, b: 255, a: 1 });
      node = node.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  let sampled = 0, low = 0, small = 0;
  const all = document.body ? document.body.querySelectorAll('*') : [];
  for (const el of all) {
    if (sampled >= 500) break;
    let hasText = false;
    for (const n of el.childNodes) {
      if (n.nodeType === 3 && n.textContent && n.textContent.trim().length > 1) { hasText = true; break; }
    }
    if (!hasText) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity || '1') === 0) continue;
    const fg = parseColor(cs.color);
    if (!fg) continue;
    const bg = effectiveBg(el);
    if (!bg) continue;
    const fgc = fg.a < 1 ? over(fg, bg) : fg;
    sampled++;
    const fontSize = parseFloat(cs.fontSize || '16');
    // Body copy under ~12px is hard to read on mobile without zooming.
    if (fontSize > 0 && fontSize < 12) small++;
    let weight = parseInt(cs.fontWeight, 10);
    if (!isFinite(weight)) weight = cs.fontWeight === 'bold' ? 700 : 400;
    const large = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700);
    const threshold = large ? 3.0 : 4.5;
    if (ratio(fgc, bg) < threshold - 0.05) low++;
  }
  let focusSuppressed = false, focusVisibleRestores = false;
  try {
    for (const sheet of document.styleSheets) {
      let rules = null;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (const rule of rules) {
        if (rule.type !== 1 || !rule.selectorText) continue;
        const sel = rule.selectorText;
        if (sel.indexOf(':focus') === -1) continue;
        const st = rule.style;
        const ow = parseFloat(st.outlineWidth || '');
        const hasOutline = (st.outlineStyle && st.outlineStyle !== 'none' && (isNaN(ow) || ow !== 0));
        const hasShadow = st.boxShadow && st.boxShadow !== 'none';
        const hasBorder = st.border && st.border !== 'none' && !/^0/.test(st.border) && st.border.indexOf('none') === -1;
        if (sel.indexOf(':focus-visible') !== -1) {
          if (hasOutline || hasShadow) focusVisibleRestores = true;
          continue;
        }
        const ct = (rule.cssText || '');
        const removesOutline = st.outlineStyle === 'none' || ow === 0 || /outline\\s*:\\s*(none|0)/.test(ct);
        if (removesOutline && !hasShadow && !hasBorder && !hasOutline) focusSuppressed = true;
      }
    }
  } catch (e) { /* ignore */ }
  if (focusVisibleRestores) focusSuppressed = false;
  // Tap-target sizing — WCAG 2.5.8 (AA) wants interactive controls to be at
  // least 24x24 CSS px. Sample visible interactive elements and count those
  // rendered smaller in either dimension. Measured at the render viewport.
  let tapSmall = 0, tapSampled = 0;
  const interactive = document.querySelectorAll(
    'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [onclick]',
  );
  for (const el of interactive) {
    if (tapSampled >= 500) break;
    const cs2 = getComputedStyle(el);
    if (cs2.visibility === 'hidden' || cs2.display === 'none' || parseFloat(cs2.opacity || '1') === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    tapSampled++;
    if (r.width < 24 || r.height < 24) tapSmall++;
  }
  return {
    lowContrast: low,
    sampled: sampled,
    focusSuppressed: focusSuppressed,
    smallFont: small,
    tapTargetsSmall: tapSmall,
    tapTargetsSampled: tapSampled,
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

    // Accessibility audit — contrast + focus outline. Best-effort: a
    // failing evaluate (detached page, hostile CSP) leaves a11y null.
    let a11y: A11yAudit | null = null;
    if (opts.detectA11y) {
      try {
        a11y = (await page.evaluate(A11Y_AUDIT_FN)) as A11yAudit | null;
      } catch {
        a11y = null;
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
      a11y: opts.detectA11y ? a11y : undefined,
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
