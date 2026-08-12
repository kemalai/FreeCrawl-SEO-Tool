import { useCallback, useEffect, useState } from 'react';
import type { BridgeSessionInfo } from '@freecrawl/shared-types';

/**
 * Live list of headless MCP agent sessions (Issue #12). Fetched on mount and
 * re-fetched whenever the main process signals a change (session created /
 * closed, crawl state transition). Empty for the common single-user case, so
 * the status-bar indicator hides itself.
 */
export function useAgentSessions(): {
  sessions: BridgeSessionInfo[];
  runningCount: number;
  close: (sessionId: string) => void;
  refresh: () => void;
} {
  const [sessions, setSessions] = useState<BridgeSessionInfo[]>([]);

  const refresh = useCallback(() => {
    void window.freecrawl
      .agentsList()
      .then(setSessions)
      .catch(() => {
        /* main not ready — the change push will catch us up */
      });
  }, []);

  useEffect(() => {
    refresh();
    const off = window.freecrawl.onAgentsChanged(refresh);
    return off;
  }, [refresh]);

  const close = useCallback(
    (sessionId: string) => {
      void window.freecrawl
        .agentsClose(sessionId)
        .then(refresh)
        .catch(() => {
          /* the change push will reconcile */
        });
    },
    [refresh],
  );

  const runningCount = sessions.filter((s) => s.crawl?.running).length;

  return { sessions, runningCount, close, refresh };
}
