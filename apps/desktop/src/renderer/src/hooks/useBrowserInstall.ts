import { useEffect, useState } from 'react';
import type { BrowserInstallState } from '@freecrawl/shared-types';

/**
 * Tracks provisioning of the Chromium build JS rendering needs.
 *
 * The main process downloads it in the background when the installer
 * didn't ship a browser this machine can run (e.g. an Intel Mac given an
 * Apple-silicon bundle). Nothing about a crawl blocks on it, so this is
 * a pure status feed: the current state is fetched once on mount — a
 * window opened mid-download still shows the progress — and every later
 * change arrives by push.
 */
export function useBrowserInstall(): {
  state: BrowserInstallState;
  retry: () => void;
} {
  const [state, setState] = useState<BrowserInstallState>({
    state: 'unknown',
    percent: null,
  });

  useEffect(() => {
    let cancelled = false;
    void window.freecrawl
      .browserInstallGet()
      .then((s) => {
        if (!cancelled) setState(s);
      })
      .catch(() => {
        /* main not ready yet — the push below will catch us up */
      });
    const off = window.freecrawl.onBrowserInstallState((s) => setState(s));
    return () => {
      cancelled = true;
      off();
    };
  }, []);

  return {
    state,
    retry: () => {
      void window.freecrawl.browserInstallStart().catch(() => {
        /* the pushed state carries the failure */
      });
    },
  };
}
