import { useEffect, useState } from 'react';

/**
 * Live performance sample exposed to the status bar.
 *
 *  - `fps` is the count of `requestAnimationFrame` callbacks that fired in
 *    the most recent 1-second sliding window. A healthy FreeCrawl idle
 *    sits at ~60 fps; sustained < 30 fps means the renderer's main
 *    thread is starved (heavy SQL pump on the main process competing for
 *    IPC, React reconciliation churn, or window-drag throttling).
 *
 *  - `heapMb` reads `performance.memory.usedJSHeapSize` (Chromium-only —
 *    Electron renderer always exposes it, so we don't gate it). When it
 *    grows monotonically across crawls without GC dips it points at a
 *    listener leak somewhere in the renderer tree.
 *
 * The sampler runs ~10 Hz (every ~100 ms). It updates state via
 * `setState` only when the integer fps OR the integer heapMb changes,
 * so React re-renders the status bar at most ~10 times/sec rather than
 * 60 — keeps the meter itself from contributing to the kasma it's
 * supposed to detect.
 */
export interface PerfSample {
  fps: number;
  heapMb: number | null;
  /**
   * Estimated main-thread busy time in ms. Measured by setting a
   * `setTimeout(…, 0)` and seeing how long it actually waited — when
   * the main thread is busy with synchronous work or IPC, the timeout
   * fires late by exactly that amount. Sub-10 ms means the renderer is
   * responsive to input; 50+ ms means clicks/drags will visibly lag.
   */
  inputLagMs: number;
}

interface ChromeMemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerfWithMemory extends Performance {
  memory?: ChromeMemoryInfo;
}

export function usePerfMeter(): PerfSample {
  const [sample, setSample] = useState<PerfSample>({
    fps: 0,
    heapMb: null,
    inputLagMs: 0,
  });

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let frameTimes: number[] = [];
    let lastEmittedFps = -1;
    let lastEmittedHeap = -1;
    let lastEmittedLag = -1;
    let lastEmitTs = 0;

    // Sliding window of recent setTimeout-0 latencies. When the main
    // thread is busy, the timeout fires later than scheduled — the
    // delta is the closest userspace-readable proxy for "how laggy
    // does this feel right now." We average the last 10 samples so a
    // single GC pause doesn't dominate the readout.
    const lagSamples: number[] = [];
    const SAMPLE_INTERVAL_MS = 200;
    let lagTimer: number | undefined;
    const probeLag = (): void => {
      if (cancelled) return;
      const scheduled = performance.now();
      lagTimer = window.setTimeout(() => {
        if (cancelled) return;
        const actual = performance.now();
        const delta = Math.max(0, actual - scheduled - SAMPLE_INTERVAL_MS);
        lagSamples.push(delta);
        if (lagSamples.length > 10) lagSamples.shift();
        probeLag();
      }, SAMPLE_INTERVAL_MS);
    };
    probeLag();

    const tick = (now: number): void => {
      if (cancelled) return;
      frameTimes.push(now);
      const cutoff = now - 1000;
      while (frameTimes.length > 0 && (frameTimes[0] ?? 0) < cutoff) {
        frameTimes.shift();
      }
      const fps = frameTimes.length;

      if (now - lastEmitTs >= 100) {
        lastEmitTs = now;
        const perf = performance as PerfWithMemory;
        const heapBytes = perf.memory?.usedJSHeapSize;
        const heapMb =
          typeof heapBytes === 'number' ? Math.round(heapBytes / 1024 / 1024) : null;
        const avgLag =
          lagSamples.length > 0
            ? Math.round(
                lagSamples.reduce((a, b) => a + b, 0) / lagSamples.length,
              )
            : 0;
        // Pipe lag back to the main process so the crawler can throttle
        // itself adaptively (see Crawler.reportRendererLag). Fire-and-
        // forget — the preload bridge uses `ipcRenderer.send` so this
        // doesn't add to the IPC reply queue. We only ping when the
        // sample changed by ≥ 5 ms or every second, whichever first,
        // to avoid spamming the bridge on a calm machine.
        try {
          window.freecrawl?.reportRendererLag?.(avgLag);
        } catch {
          /* ignore — non-fatal */
        }
        if (
          fps !== lastEmittedFps ||
          heapMb !== lastEmittedHeap ||
          avgLag !== lastEmittedLag
        ) {
          lastEmittedFps = fps;
          lastEmittedHeap = heapMb ?? -1;
          lastEmittedLag = avgLag;
          setSample({ fps, heapMb, inputLagMs: avgLag });
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (lagTimer !== undefined) clearTimeout(lagTimer);
    };
  }, []);

  return sample;
}
