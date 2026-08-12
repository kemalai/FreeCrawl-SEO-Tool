import { describe, it, expect } from 'vitest';
import {
  SessionRegistry,
  computeGlobalThrottleScale,
} from '../apps/desktop/src/main/agent-session-registry.js';

/**
 * Deterministic registry: injected clock + id factory + fake timers so queue
 * timeout / promotion ordering is fully controllable.
 */
function makeRegistry() {
  let id = 0;
  const state = { clock: 1000 };
  const timers: Array<{ fn: () => void; handle: symbol }> = [];
  const reg = new SessionRegistry({
    genCrawlId: () => `cr_${++id}`,
    now: () => state.clock,
    setTimer: (fn) => {
      const handle = Symbol();
      timers.push({ fn, handle });
      return handle;
    },
    clearTimer: (h) => {
      const i = timers.findIndex((t) => t.handle === h);
      if (i !== -1) timers.splice(i, 1);
    },
    maxQueueDepth: 2,
  });
  return {
    reg,
    advance: (ms: number) => (state.clock += ms),
    fireTimers: () => {
      const pending = timers.splice(0, timers.length);
      for (const t of pending) t.fn();
    },
  };
}

describe('SessionRegistry crawl lease', () => {
  it('grants an idle slot immediately', async () => {
    const { reg } = makeRegistry();
    const g = await reg.acquireCrawl('primary', { clientId: 'A', startUrl: 'x' });
    expect(g.ok).toBe(true);
    if (g.ok) {
      expect(g.queued).toBe(false);
      expect(g.tookOver).toBe(false);
    }
    expect(reg.peekLease('primary')?.ownerClientId).toBe('A');
  });

  it('rejects a second start by default (crawl-in-progress)', async () => {
    const { reg } = makeRegistry();
    await reg.acquireCrawl('primary', { clientId: 'A', startUrl: 'x' });
    const g = await reg.acquireCrawl('primary', { clientId: 'B', startUrl: 'y' });
    expect(g.ok).toBe(false);
    if (!g.ok) expect(g.error).toBe('crawl-in-progress');
  });

  it('queues and promotes FIFO when the lease releases', async () => {
    const { reg, advance } = makeRegistry();
    const a = await reg.acquireCrawl('primary', { clientId: 'A', startUrl: 'x' });
    let bResolved = false;
    const bPromise = reg
      .acquireCrawl('primary', { clientId: 'B', startUrl: 'y', onBusy: 'queue' })
      .then((v) => {
        bResolved = true;
        return v;
      });
    expect(bResolved).toBe(false);
    expect(reg.queueDepth('primary')).toBe(1);
    advance(5000);
    if (a.ok) reg.releaseCrawl('primary', a.crawlId);
    const b = await bPromise;
    expect(b.ok).toBe(true);
    if (b.ok) {
      expect(b.queued).toBe(true);
      expect(b.waitedMs).toBe(5000);
    }
    expect(reg.peekLease('primary')?.ownerClientId).toBe('B');
  });

  it('rejects with session-limit-reached when the queue is full', async () => {
    const { reg } = makeRegistry();
    await reg.acquireCrawl('primary', { clientId: 'A', startUrl: 'x' });
    void reg.acquireCrawl('primary', { clientId: 'B', startUrl: 'y', onBusy: 'queue' });
    void reg.acquireCrawl('primary', { clientId: 'C', startUrl: 'z', onBusy: 'queue' });
    const g = await reg.acquireCrawl('primary', {
      clientId: 'D',
      startUrl: 'w',
      onBusy: 'queue',
    });
    expect(g.ok).toBe(false);
    if (!g.ok) expect(g.error).toBe('session-limit-reached');
  });

  it('takeover grants a new lease and the superseded release no-ops', async () => {
    const { reg } = makeRegistry();
    const a = await reg.acquireCrawl('primary', { clientId: 'A', startUrl: 'x' });
    const g = await reg.acquireCrawl('primary', {
      clientId: 'B',
      startUrl: 'y',
      onBusy: 'takeover',
    });
    expect(g.ok).toBe(true);
    if (g.ok && a.ok) {
      expect(g.tookOver).toBe(true);
      expect(g.crawlId).not.toBe(a.crawlId);
      // A's stale release must not free B's lease.
      reg.releaseCrawl('primary', a.crawlId);
      expect(reg.peekLease('primary')?.ownerClientId).toBe('B');
    }
  });

  it('enforces ownership; a null-owner lease is owned by anyone (legacy)', async () => {
    const { reg } = makeRegistry();
    await reg.acquireCrawl('primary', { clientId: 'A', startUrl: 'x' });
    expect(reg.isOwner('primary', 'A')).toBe(true);
    expect(reg.isOwner('primary', 'B')).toBe(false);

    const { reg: reg2 } = makeRegistry();
    await reg2.acquireCrawl('primary', { clientId: null, startUrl: 'x' });
    expect(reg2.isOwner('primary', 'anyone')).toBe(true);
  });

  it('times out a queued waiter and removes it', async () => {
    const { reg, fireTimers } = makeRegistry();
    const a = await reg.acquireCrawl('primary', { clientId: 'A', startUrl: 'x' });
    const bPromise = reg.acquireCrawl('primary', {
      clientId: 'B',
      startUrl: 'y',
      onBusy: 'queue',
      queueTimeoutMs: 1000,
    });
    fireTimers();
    const b = await bPromise;
    expect(b.ok).toBe(false);
    if (!b.ok) expect(b.error).toBe('queue-timeout');
    expect(reg.queueDepth('primary')).toBe(0);
    if (a.ok) reg.releaseCrawl('primary', a.crawlId);
    expect(reg.peekLease('primary')).toBeNull();
  });

  it('dropSession expires queued waiters', async () => {
    const { reg } = makeRegistry();
    await reg.acquireCrawl('primary', { clientId: 'A', startUrl: 'x' });
    const bPromise = reg.acquireCrawl('primary', {
      clientId: 'B',
      startUrl: 'y',
      onBusy: 'queue',
    });
    reg.dropSession('primary');
    const b = await bPromise;
    expect(b.ok).toBe(false);
    if (!b.ok) expect(b.error).toBe('session-expired');
    expect(reg.peekLease('primary')).toBeNull();
  });

  it('keeps sessions independent — one lease does not block another', async () => {
    const { reg } = makeRegistry();
    const a = await reg.acquireCrawl('sess_1', { clientId: 'A', startUrl: 'x' });
    const b = await reg.acquireCrawl('sess_2', { clientId: 'B', startUrl: 'y' });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(reg.peekLease('sess_1')?.ownerClientId).toBe('A');
    expect(reg.peekLease('sess_2')?.ownerClientId).toBe('B');
  });
});

describe('computeGlobalThrottleScale', () => {
  it('returns 1 when the summed concurrency fits the budget', () => {
    expect(computeGlobalThrottleScale([10, 10], 32)).toBe(1);
    expect(computeGlobalThrottleScale([], 32)).toBe(1);
    expect(computeGlobalThrottleScale([32], 32)).toBe(1);
  });

  it('scales down proportionally when over budget', () => {
    expect(computeGlobalThrottleScale([40, 40], 40)).toBeCloseTo(0.5, 5);
    expect(computeGlobalThrottleScale([30, 30, 30], 45)).toBeCloseTo(0.5, 5);
  });

  it('never drops below the 0.1 floor', () => {
    expect(computeGlobalThrottleScale([200, 200], 1)).toBe(0.1);
  });
});
