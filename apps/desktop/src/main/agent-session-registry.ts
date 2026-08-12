/**
 * Crawl-lease arbitration for the MCP bridge (Issue #12, Faz 1).
 *
 * Several MCP clients — typically parallel autonomous agents — drive crawls
 * against the same running desktop app. Without arbitration a second
 * `start_crawl` silently stops the first crawler and takes its place, so two
 * callers' results interleave in one project. This registry makes the crawl
 * slot a *lease*: at most one live crawl per session, with a FIFO queue and
 * explicit ownership so a control call from another client can be refused.
 *
 * The module is deliberately Electron-free and side-effect-free (timers and
 * id/clock sources are injectable) so it unit-tests without spinning up the
 * app. The desktop `index.ts` owns the actual crawler; this only decides who
 * is allowed to hold the slot and when a queued waiter is released.
 *
 * Faz 2 will grow session lifecycle (create/close/list) onto the same
 * registry; the lease map is already keyed by an arbitrary `sessionId` so
 * headless sessions slot in without a redesign.
 */

import { randomBytes } from 'node:crypto';
import type { BridgeErrorCode, OnBusy } from '@freecrawl/shared-types';

export interface CrawlLease {
  crawlId: string;
  ownerClientId: string | null;
  startUrl: string;
  startedAt: number;
}

/** Immediate outcome of an `acquireCrawl` — a granted lease or a typed error. */
export type AcquireResult =
  | { ok: true; crawlId: string; waitedMs: number; queued: boolean; tookOver: boolean }
  | {
      ok: false;
      error: BridgeErrorCode;
      message: string;
      details?: Record<string, unknown>;
    };

export interface AcquireOptions {
  clientId: string | null;
  startUrl: string;
  onBusy?: OnBusy;
  queueTimeoutMs?: number;
}

interface QueueWaiter {
  clientId: string | null;
  startUrl: string;
  enqueuedAt: number;
  resolve: (r: AcquireResult) => void;
  timer: unknown | null;
}

interface SessionSlot {
  lease: CrawlLease | null;
  queue: QueueWaiter[];
}

export interface RegistryOptions {
  /** FIFO queue cap per session before `session-limit-reached`. */
  maxQueueDepth?: number;
  /** Injectable clock (defaults to Date.now) — keeps tests deterministic. */
  now?: () => number;
  /** Injectable crawl-id factory. */
  genCrawlId?: () => string;
  /** Injectable timer pair (defaults to global setTimeout/clearTimeout). */
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

const DEFAULT_MAX_QUEUE_DEPTH = 4;
const DEFAULT_QUEUE_TIMEOUT_MS = 15 * 60_000;

/**
 * Pure: the uniform throttle scale (0.1–1) to apply to every live crawler so
 * the summed concurrency fits a shared budget. Returns 1 when it already fits
 * or nothing is running — so a single crawl (the normal single-user case) is
 * never throttled by the multi-session budget. Lives here (not in the
 * Electron-bound main module) so it unit-tests standalone.
 */
export function computeGlobalThrottleScale(
  concurrencies: number[],
  budget: number,
): number {
  const total = concurrencies.reduce((a, b) => a + b, 0);
  if (total <= 0 || total <= budget) return 1;
  return Math.max(0.1, budget / total);
}

function defaultCrawlId(): string {
  return `cr_${randomBytes(4).toString('hex')}`;
}

export class SessionRegistry {
  private readonly slots = new Map<string, SessionSlot>();
  private readonly maxQueueDepth: number;
  private readonly now: () => number;
  private readonly genCrawlId: () => string;
  private readonly setTimer: (fn: () => void, ms: number) => unknown;
  private readonly clearTimer: (handle: unknown) => void;

  constructor(opts: RegistryOptions = {}) {
    this.maxQueueDepth = opts.maxQueueDepth ?? DEFAULT_MAX_QUEUE_DEPTH;
    this.now = opts.now ?? (() => Date.now());
    this.genCrawlId = opts.genCrawlId ?? defaultCrawlId;
    this.setTimer =
      opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearTimer =
      opts.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  }

  private slot(sessionId: string): SessionSlot {
    let s = this.slots.get(sessionId);
    if (!s) {
      s = { lease: null, queue: [] };
      this.slots.set(sessionId, s);
    }
    return s;
  }

  /** Current lease for a session, or null when the crawl slot is free. */
  peekLease(sessionId: string): CrawlLease | null {
    return this.slots.get(sessionId)?.lease ?? null;
  }

  /** True when `clientId` holds the live lease for `sessionId`. A null
   *  client (headerless legacy call) is treated as the owner of a
   *  null-owned lease so single-client setups keep working. */
  isOwner(sessionId: string, clientId: string | null, crawlId?: string): boolean {
    const lease = this.peekLease(sessionId);
    if (!lease) return false;
    if (crawlId !== undefined && lease.crawlId !== crawlId) return false;
    if (lease.ownerClientId === null) return true;
    return lease.ownerClientId === clientId;
  }

  /**
   * Try to take the crawl slot for a session.
   *
   * - Free slot → immediate grant.
   * - Busy + `reject` (default) → immediate `crawl-in-progress` error.
   * - Busy + `takeover` → force-drop the current lease and grant. The caller
   *   is responsible for stopping the superseded crawler; its later
   *   release call is a no-op because the crawlId no longer matches.
   * - Busy + `queue` → FIFO wait, resolved when the slot frees or rejected
   *   with `queue-timeout` / `session-limit-reached`.
   */
  acquireCrawl(sessionId: string, opts: AcquireOptions): Promise<AcquireResult> {
    const slot = this.slot(sessionId);
    const onBusy: OnBusy = opts.onBusy ?? 'reject';

    if (!slot.lease) {
      return Promise.resolve(this.grant(slot, opts, 0, false, false));
    }

    if (onBusy === 'reject') {
      const lease = slot.lease;
      return Promise.resolve({
        ok: false,
        error: 'crawl-in-progress',
        message:
          `A crawl is already running in session '${sessionId}' ` +
          `(crawlId=${lease.crawlId}, started ${Math.round(
            (this.now() - lease.startedAt) / 1000,
          )}s ago). Call start_crawl with onBusy:'queue' to wait for it, ` +
          `onBusy:'takeover' to replace it, or session_create to get your own isolated session.`,
        details: {
          sessionId,
          crawlId: lease.crawlId,
          ownerClientId: lease.ownerClientId,
          startUrl: lease.startUrl,
          startedAt: lease.startedAt,
        },
      });
    }

    if (onBusy === 'takeover') {
      // Drop the current lease outright; the superseded crawler is stopped by
      // the caller and its release becomes a stale no-op. The queue is left
      // intact — a takeover jumps the running crawl, not the waiting line.
      slot.lease = null;
      return Promise.resolve(this.grant(slot, opts, 0, false, true));
    }

    // onBusy === 'queue'
    if (slot.queue.length >= this.maxQueueDepth) {
      return Promise.resolve({
        ok: false,
        error: 'session-limit-reached',
        message:
          `The crawl queue for session '${sessionId}' is full ` +
          `(${this.maxQueueDepth} waiting). Wait for it to drain or create your ` +
          `own session with session_create.`,
        details: { sessionId, maxQueueDepth: this.maxQueueDepth },
      });
    }

    const timeoutMs =
      opts.queueTimeoutMs && opts.queueTimeoutMs > 0
        ? opts.queueTimeoutMs
        : DEFAULT_QUEUE_TIMEOUT_MS;
    return new Promise<AcquireResult>((resolve) => {
      const waiter: QueueWaiter = {
        clientId: opts.clientId,
        startUrl: opts.startUrl,
        enqueuedAt: this.now(),
        resolve,
        timer: null,
      };
      waiter.timer = this.setTimer(() => {
        const idx = slot.queue.indexOf(waiter);
        if (idx !== -1) slot.queue.splice(idx, 1);
        resolve({
          ok: false,
          error: 'queue-timeout',
          message:
            `Waited ${Math.round(timeoutMs / 1000)}s for the crawl slot in ` +
            `session '${sessionId}' without it freeing. Retry later or use ` +
            `session_create for an isolated session.`,
          details: { sessionId, queueTimeoutMs: timeoutMs },
        });
      }, timeoutMs);
      slot.queue.push(waiter);
    });
  }

  private grant(
    slot: SessionSlot,
    opts: AcquireOptions,
    waitedMs: number,
    queued: boolean,
    tookOver: boolean,
  ): AcquireResult {
    const crawlId = this.genCrawlId();
    slot.lease = {
      crawlId,
      ownerClientId: opts.clientId,
      startUrl: opts.startUrl,
      startedAt: this.now(),
    };
    return { ok: true, crawlId, waitedMs, queued, tookOver };
  }

  /**
   * Release the lease identified by `crawlId` and hand the slot to the next
   * queued waiter, if any. A `crawlId` that no longer matches the live lease
   * (a superseded/stale crawler firing its terminal event) is ignored, so
   * releases are safe to call from every crawl exit path.
   */
  releaseCrawl(sessionId: string, crawlId: string): void {
    const slot = this.slots.get(sessionId);
    if (!slot || !slot.lease || slot.lease.crawlId !== crawlId) return;
    slot.lease = null;
    this.promoteNext(slot);
  }

  /** Drop whatever lease a session currently holds (defensive cleanup for a
   *  crawler that died without firing a terminal event) and promote the
   *  queue. Returns the crawlId that was released, or null. */
  forceRelease(sessionId: string): string | null {
    const slot = this.slots.get(sessionId);
    if (!slot || !slot.lease) return null;
    const released = slot.lease.crawlId;
    slot.lease = null;
    this.promoteNext(slot);
    return released;
  }

  private promoteNext(slot: SessionSlot): void {
    const next = slot.queue.shift();
    if (!next) return;
    if (next.timer !== null) this.clearTimer(next.timer);
    const waitedMs = this.now() - next.enqueuedAt;
    const result = this.grant(
      slot,
      { clientId: next.clientId, startUrl: next.startUrl },
      waitedMs,
      true,
      false,
    );
    next.resolve(result);
  }

  /** Clear a session entirely — lease dropped, every queued waiter rejected
   *  with `session-expired`. Used when a session is closed/reaped. */
  dropSession(sessionId: string): void {
    const slot = this.slots.get(sessionId);
    if (!slot) return;
    for (const waiter of slot.queue) {
      if (waiter.timer !== null) this.clearTimer(waiter.timer);
      waiter.resolve({
        ok: false,
        error: 'session-expired',
        message: `Session '${sessionId}' was closed while you waited for the crawl slot.`,
        details: { sessionId },
      });
    }
    this.slots.delete(sessionId);
  }

  /** Number of waiters queued behind a session's current crawl. */
  queueDepth(sessionId: string): number {
    return this.slots.get(sessionId)?.queue.length ?? 0;
  }
}
