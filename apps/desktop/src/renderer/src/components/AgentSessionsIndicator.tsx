import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { BridgeSessionInfo } from '@freecrawl/shared-types';
import { useAgentSessions } from '../hooks/useAgentSessions.js';

/** Compact "N ago" for the idle column. */
function formatIdle(lastUsedAt: number): string {
  const ms = Date.now() - lastUsedAt;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

function basename(p: string | null): string | null {
  if (!p) return null;
  const parts = p.split(/[\\/]/);
  return parts[parts.length - 1] || p;
}

function SessionRow({
  s,
  onClose,
}: {
  s: BridgeSessionInfo;
  onClose: (id: string) => void;
}) {
  const { t } = useTranslation();
  const doc = basename(s.documentPath);
  const running = s.crawl?.running ?? false;
  const paused = s.crawl?.paused ?? false;
  return (
    <div className="flex items-center gap-2 border-b border-surface-800/70 px-3 py-2 last:border-b-0">
      <span
        className={clsx(
          'h-2 w-2 shrink-0 rounded-full',
          running && !paused && 'animate-pulse bg-emerald-500',
          running && paused && 'bg-amber-500',
          !running && 'bg-surface-600',
        )}
        title={
          running
            ? paused
              ? t('agents.statusPaused', { defaultValue: 'Paused' })
              : t('agents.statusRunning', { defaultValue: 'Crawling' })
            : t('agents.statusIdle', { defaultValue: 'Idle' })
        }
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[12px] font-medium text-surface-100">{s.label}</span>
          <span className="shrink-0 font-mono text-[10px] text-surface-500">
            {s.urlsCrawled.toLocaleString()} {t('agents.urls', { defaultValue: 'URLs' })}
          </span>
        </div>
        <div className="truncate text-[10px] text-surface-500">
          {doc ?? t('agents.scratchProject', { defaultValue: 'unsaved scratch project' })}
          {' · '}
          {t('agents.idleFor', { defaultValue: 'idle {{d}}', d: formatIdle(s.lastUsedAt) })}
        </div>
      </div>
      <button
        className="shrink-0 rounded border border-surface-700 px-2 py-0.5 text-[10px] text-surface-300 hover:bg-red-900/40 hover:text-red-200"
        onClick={() => onClose(s.sessionId)}
        title={t('agents.closeTitle', {
          defaultValue: 'Close this agent session (stops its crawl and frees resources)',
        })}
      >
        {t('agents.close', { defaultValue: 'Close' })}
      </button>
    </div>
  );
}

/**
 * Status-bar indicator for parallel MCP agent sessions (Issue #12). Hidden
 * when no agent has created a session (the common single-user case). Shows a
 * badge with the session count + a live dot for running crawls; clicking opens
 * a popover listing each session with a Close button.
 */
export function AgentSessionsIndicator() {
  const { t } = useTranslation();
  const { sessions, runningCount, close } = useAgentSessions();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the popover on an outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (sessions.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        className={clsx(
          'inline-flex items-center gap-1.5 rounded px-1.5 py-0.5',
          open ? 'bg-surface-800' : 'hover:bg-surface-800/60',
        )}
        onClick={() => setOpen((v) => !v)}
        title={t('agents.indicatorTitle', {
          defaultValue: '{{n}} MCP agent session(s) active — click to manage',
          n: sessions.length,
        })}
      >
        <span
          className={clsx(
            'h-2 w-2 rounded-full',
            runningCount > 0 ? 'animate-pulse bg-sky-400' : 'bg-sky-500/60',
          )}
        />
        <span className="text-sky-300">
          {t('agents.badge', { defaultValue: '{{n}} agents', n: sessions.length })}
        </span>
        {runningCount > 0 && (
          <span className="font-mono text-sky-400/80">
            {t('agents.runningBadge', { defaultValue: '{{n}} crawling', n: runningCount })}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 z-50 mb-1.5 w-80 overflow-hidden rounded-md border border-surface-700 bg-surface-900 shadow-xl">
          <div className="border-b border-surface-800 px-3 py-2">
            <div className="text-[11px] font-semibold text-surface-200">
              {t('agents.popoverTitle', { defaultValue: 'MCP Agent Sessions' })}
            </div>
            <div className="text-[10px] text-surface-500">
              {t('agents.popoverSubtitle', {
                defaultValue: 'Isolated crawl sessions driven by AI agents over MCP.',
              })}
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {sessions.map((s) => (
              <SessionRow key={s.sessionId} s={s} onClose={close} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
