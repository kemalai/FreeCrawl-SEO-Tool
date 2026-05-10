import { useEffect, useState } from 'react';
import type { MemoryStats } from '@freecrawl/shared-types';

/**
 * Polls the main process for live memory stats every ~2 seconds.
 *
 * Returns `null` until the first sample arrives so consumers can render
 * a placeholder. Polling is deliberately slow (2 s) — RSS doesn't change
 * faster than that meaningfully, and `process.memoryUsage()` walks every
 * V8 heap segment, so we don't want to call it on every animation frame.
 *
 * The poll continues regardless of crawl state because the user's RSS
 * curiosity outlasts the active fetch loop (e.g. wanting to confirm
 * memory was reclaimed after Clear).
 */
export function useMemoryMonitor(): MemoryStats | null {
  const [stats, setStats] = useState<MemoryStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function tick(): Promise<void> {
      try {
        const next = await window.freecrawl.memoryStats();
        if (!cancelled) setStats(next);
      } catch {
        // IPC may be unavailable during app shutdown — swallow and let
        // the next tick retry; stale state is fine for a status bar.
      }
    }
    void tick();
    const handle = window.setInterval(() => {
      void tick();
    }, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, []);

  return stats;
}
