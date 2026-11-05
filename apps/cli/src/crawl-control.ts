import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { DEFAULT_CRAWL_CONFIG, type CrawlConfig } from '@freecrawl/shared-types';

/**
 * Talking to a CLI crawl from another terminal (`freecrawl pause|resume|stop`).
 *
 * A running crawl owns `<project>.crawl.json` — its pid, start URL and
 * state — and polls `<project>.control` once a second for a command.
 * Plain files beside the project: no ports, no IPC, the same on Windows,
 * macOS and Linux, and a crashed crawl leaves nothing that blocks the
 * next one (a status file whose pid is gone is stale).
 */

export type CrawlState = 'running' | 'paused' | 'stopping';
export type ControlAction = 'pause' | 'resume' | 'stop';

export interface CrawlStatusFile {
  pid: number;
  startedAt: string;
  startUrl: string;
  state: CrawlState;
  /** Set when the crawler paused itself (the site stopped responding). */
  pausedReason?: string | null;
  updatedAt: string;
}

export const statusPath = (project: string): string => `${project}.crawl.json`;
export const controlPath = (project: string): string => `${project}.control`;

/** Write via a temp file + rename so a reader never sees half a file. */
function writeAtomic(file: string, content: string): void {
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, content);
  renameSync(tmp, file);
}

export function readStatus(project: string): CrawlStatusFile | null {
  try {
    const raw = JSON.parse(readFileSync(statusPath(project), 'utf8')) as CrawlStatusFile;
    return typeof raw.pid === 'number' ? raw : null;
  } catch {
    return null;
  }
}

export function isPidAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM: the process exists but belongs to someone else.
    return (err as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/** The status of a crawl that is really running on `project`, or null. */
export function liveCrawl(project: string): CrawlStatusFile | null {
  const s = readStatus(project);
  return s && isPidAlive(s.pid) ? s : null;
}

export function writeStatus(project: string, status: Omit<CrawlStatusFile, 'updatedAt'>): void {
  writeAtomic(
    statusPath(project),
    JSON.stringify({ ...status, updatedAt: new Date().toISOString() }),
  );
}

export function removeStatus(project: string): void {
  const s = readStatus(project);
  if (s && s.pid !== process.pid) return; // another crawl's file — not ours to remove
  rmSync(statusPath(project), { force: true });
  rmSync(controlPath(project), { force: true });
}

export function sendControl(project: string, action: ControlAction): void {
  writeAtomic(controlPath(project), JSON.stringify({ action, at: new Date().toISOString() }));
}

/** Read and consume a pending command, if any. */
export function takeControl(project: string): ControlAction | null {
  const file = controlPath(project);
  if (!existsSync(file)) return null;
  let action: unknown = null;
  try {
    action = (JSON.parse(readFileSync(file, 'utf8')) as { action?: unknown }).action;
  } catch {
    action = null;
  }
  rmSync(file, { force: true });
  return action === 'pause' || action === 'resume' || action === 'stop' ? action : null;
}

/** Wait until the running crawl reports `state` (or exits). */
export async function waitForState(
  project: string,
  states: readonly CrawlState[],
  timeoutMs = 10_000,
): Promise<CrawlStatusFile | null> {
  const until = Date.now() + timeoutMs;
  for (;;) {
    const s = liveCrawl(project);
    if (!s || states.includes(s.state)) return s;
    if (Date.now() > until) return s;
    await new Promise((r) => setTimeout(r, 200));
  }
}

/**
 * The config a CLI crawl stores in its project so `freecrawl resume` can
 * carry on with the same settings — without credentials: HTTP auth, form
 * login, the proxy URL, custom headers and the webhook URL (a chat webhook
 * is bearer-equivalent) stay out of the file (pass `--header` /
 * `--webhook` / `--config` again when resuming a crawl that needs them).
 */
export function configForResume(config: CrawlConfig): CrawlConfig {
  const clean = JSON.parse(JSON.stringify(config)) as CrawlConfig;
  clean.auth = { ...DEFAULT_CRAWL_CONFIG.auth };
  clean.formLogin = JSON.parse(
    JSON.stringify(DEFAULT_CRAWL_CONFIG.formLogin),
  ) as CrawlConfig['formLogin'];
  clean.proxyUrl = '';
  clean.customHeaders = {};
  clean.webhookUrl = '';
  return clean;
}

export const CLI_CONFIG_META_KEY = 'cliCrawlConfig';
