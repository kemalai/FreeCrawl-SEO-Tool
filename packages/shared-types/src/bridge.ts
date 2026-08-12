/**
 * Shared contract for the localhost MCP bridge that connects the desktop
 * app (`apps/desktop/src/main/mcp-bridge.ts`, server side) to the FreeCrawl
 * MCP server (`apps/mcp-server`, client side).
 *
 * Both ends import these types so the wire shape can never drift. Bridge
 * protocol v2 (Issue #12) adds per-session routing so several MCP clients —
 * typically parallel autonomous agents — can each drive their own crawl
 * against their own project without racing the desktop window or each other.
 *
 * Backward compatibility: a request without a session header targets the
 * `"primary"` session (the desktop window's project), which is exactly the
 * v1 behaviour. The only visible difference for a single client is that a
 * conflicting crawl now returns a typed error instead of silently taking
 * over the running one.
 */

import type { CrawlConfig, CrawlProgress } from './crawl.js';

/** Bump when the wire shape changes in a way old clients must notice. */
export const BRIDGE_PROTOCOL_VERSION = 2 as const;

/** HTTP header carrying the target session id (`"primary"` when absent). */
export const BRIDGE_SESSION_HEADER = 'x-freecrawl-session';
/** HTTP header carrying the MCP client's stable per-process id. */
export const BRIDGE_CLIENT_HEADER = 'x-freecrawl-client';

/** Well-known session id for the desktop window's own project. */
export const PRIMARY_SESSION_ID = 'primary';

/**
 * Machine-readable error codes returned by the bridge. The MCP server maps
 * these to guidance an agent can act on, so keep them stable.
 */
export type BridgeErrorCode =
  | 'crawl-in-progress' // 409 — a crawl already owns this session
  | 'crawl-not-owned' // 409 — control call from a client that isn't the owner
  | 'session-not-found' // 404 — unknown session id
  | 'session-expired' // 410 — session reaped for idleness
  | 'session-limit-reached' // 429 — headless-session or queue cap hit
  | 'project-locked' // 409 — target project is held by another session / has unsaved work
  | 'invalid-project-path' // 400 — projectPath failed validation
  | 'unsupported-feature' // 501 — feature not available on this desktop build
  | 'queue-timeout' // 504 — queued crawl waited past its timeout
  | 'bad-request' // 400 — malformed body / missing required field
  | 'internal-error'; // 500 — unexpected failure

/**
 * Uniform error envelope for every non-2xx bridge response. `message` is
 * written for the *agent* — it should say what to do next, not merely what
 * went wrong.
 */
export interface BridgeErrorBody {
  error: BridgeErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/** What a client can request when a session is already crawling. */
export type OnBusy = 'reject' | 'queue' | 'takeover';

/**
 * Fields the MCP server may pass when starting a crawl. Everything is
 * optional except an effective startUrl must exist — either supplied here or
 * already saved in the session's last-used config. The desktop layers these
 * on top of the last-used CrawlConfig and dispatches.
 *
 * Moved here from `mcp-bridge.ts` (v1) so both ends share one definition.
 */
export interface McpStartCrawlInput {
  startUrl?: string;
  /**
   * Optional path to a `.seoproject` this crawl should target. On the
   * primary (desktop-window) session it is validated against the open
   * document (verify-only). For a real isolated project, open it in a
   * headless session via `session_create` and crawl there instead.
   */
  projectPath?: string;
  /** What to do when a crawl is already running in the target session. */
  onBusy?: OnBusy;
  /** Max wait for `onBusy: 'queue'` before giving up with `queue-timeout`. */
  queueTimeoutMs?: number;
  /** Whitelisted CrawlConfig field overrides — a narrow contract so MCP
   *  can't smuggle in fields we'd rather validate. */
  configOverrides?: {
    scope?: CrawlConfig['scope'];
    maxDepth?: number;
    maxUrls?: number;
    maxConcurrency?: number;
    maxRps?: number;
    crawlDelayMs?: number;
    requestTimeoutMs?: number;
    respectRobotsTxt?: boolean;
    respectCrawlDelay?: boolean;
    followRedirects?: boolean;
    crawlExternal?: boolean;
    userAgent?: string;
    includePatterns?: string[];
    excludePatterns?: string[];
  };
}

/** Success payload for `POST /v1/crawl/start`. */
export interface McpStartCrawlResult {
  ok: true;
  crawlId: string;
  sessionId: string;
  config: CrawlConfig;
  /** True when the request was FIFO-queued behind a running crawl. */
  queued: boolean;
  /** Milliseconds spent waiting in the queue (0 when it started immediately). */
  waitedMs: number;
}

/** A live crawl's ownership + run state, embedded in progress/list replies. */
export interface BridgeCrawlInfo {
  crawlId: string;
  running: boolean;
  paused: boolean;
  ownerClientId: string | null;
  startUrl: string;
  startedAt: number;
}

/** Progress reply for `GET /v1/crawl/progress`. */
export interface BridgeProgressResult {
  progress: CrawlProgress | null;
  crawlId: string | null;
  sessionId: string;
  ownerClientId: string | null;
  /** True when the polling client owns the running crawl. */
  ownedByCaller: boolean;
}

/** One session in `GET /v1/session/list`. */
export interface BridgeSessionInfo {
  sessionId: string;
  label: string;
  kind: 'primary' | 'window' | 'headless';
  documentPath: string | null;
  /** Live working-copy DB path — what the MCP read-only view should open. */
  dbPath: string | null;
  urlsCrawled: number;
  crawl: BridgeCrawlInfo | null;
  ownerClientId: string | null;
  createdAt: number;
  lastUsedAt: number;
}

/** How a new headless session should be initialised. */
export type SessionCreateMode = 'scratch' | 'open' | 'attach';

/** Body for `POST /v1/session/create`. */
export interface BridgeSessionCreateInput {
  /** `scratch` (default) = empty new project; `open` = unpack an existing
   *  `.seoproject` into a fresh session; `attach` = reuse the session already
   *  bound to that path, or open it if none. */
  mode?: SessionCreateMode;
  /** Required for `open`/`attach`: absolute path to a `.seoproject`. */
  projectPath?: string;
  /** Human label for logs / the Agents UI (defaults to `agent-N`). */
  label?: string;
  /** For `open`/`attach`: fail with `project-locked` if the path is already
   *  held by another session instead of sharing it. */
  exclusive?: boolean;
}

/** Reply for `POST /v1/session/create`. */
export interface BridgeSessionCreateResult {
  sessionId: string;
  /** Live working-copy DB path — open this read-only from the MCP server. */
  dbPath: string;
  /** The `.seoproject` document backing the session, or null for scratch. */
  documentPath: string | null;
  /** False when `attach` returned an already-open session. */
  created: boolean;
  label: string;
}

/** Body for `POST /v1/session/close`. */
export interface BridgeSessionCloseInput {
  /** Persist the session to a `.seoproject` before tearing it down. */
  save?: boolean;
  /** Where to save when `save` is set; defaults to the session's document. */
  savePath?: string;
}

/** Reply for `POST /v1/session/close`. */
export interface BridgeSessionCloseResult {
  ok: true;
  savedTo?: string;
}

/** Body for `POST /v1/session/save`. */
export interface BridgeSessionSaveInput {
  /** Destination `.seoproject`; defaults to the session's current document. */
  projectPath?: string;
}

/** Reply for `POST /v1/session/save`. */
export interface BridgeSessionSaveResult {
  filePath: string;
  bytesWritten: number;
}

/** Reply for `GET /v1/capabilities`. Absent route ⇒ v1 desktop. */
export interface BridgeCapabilities {
  bridgeVersion: number;
  appVersion: string;
  features: string[];
  limits: {
    maxHeadlessSessions: number;
    maxQueueDepth: number;
    sessionIdleTtlMs: number;
  };
}

/** Feature flags advertised in `BridgeCapabilities.features`. */
export const BRIDGE_FEATURES = {
  sessions: 'sessions',
  crawlLease: 'crawl-lease',
  crawlQueue: 'crawl-queue',
} as const;

/** Minimum desktop app version that supports headless sessions. Surfaced in
 *  the MCP `unsupported-feature` guidance so an agent knows what to upgrade. */
export const SESSIONS_MIN_APP_VERSION = '0.10.0';
