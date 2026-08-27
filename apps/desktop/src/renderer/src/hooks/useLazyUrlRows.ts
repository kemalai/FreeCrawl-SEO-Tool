import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AdvancedFilter, CrawlUrlRow, UrlCategory } from '@freecrawl/shared-types';

const CHUNK_SIZE = 500;
// Doubled the cache (was 8) so a fast scroll across 4-5 chunks doesn't
// thrash the reader pool: each chunk evicted = a re-fetch the next time
// the user scrolls back to it. 16 × 500 = 8000 rows kept warm; at
// ~2 KB/row that's ~16 MB heap, well within budget.
const MAX_CACHED_CHUNKS = 16;
// Number of chunks to pre-fetch ahead/behind the visible range. The
// visible range is what the virtualizer asks for; pre-fetching the
// neighbours hides "..." placeholders during fast scrolls because the
// next chunk has usually already landed by the time the user reaches
// it. 1 chunk = 500 rows of look-ahead each direction, cheap on the
// reader pool.
const PREFETCH_CHUNKS = 1;
// Min gap between progress-driven ticks. Progress events arrive at
// ~5 Hz from the crawler; without throttle the visible-chunk re-query
// would fire that often too. 100 ms keeps the table feeling live
// (10 refreshes/sec ceiling) without pinning the reader-pool.
const TICK_THROTTLE_MS = 100;
// Safety-net periodic tick for cases where progress events stop
// arriving (crawl finished, manual DB edits, etc.). Long interval —
// the progress-event path drives the in-crawl experience.
const LIVE_REFRESH_MS = 5000;
// After a query fails (a reader timeout, most likely), hold every
// automatic re-issue — live tick, scroll-driven chunk fetch — for this
// long. Each of those used to fire again immediately, and against a
// query that had just spent 30 s timing out that stacked one abandoned
// copy per tick onto the reader pool until nothing else could get
// through. The user's explicit Retry bypasses the hold.
const FAILURE_BACKOFF_MS = 5000;

export interface LazyRowsOpts {
  category: UrlCategory;
  search: string;
  sortBy: keyof CrawlUrlRow | undefined;
  sortDir: 'asc' | 'desc';
  /** Advanced multi-clause filter (AND within group, OR across groups). */
  filter?: AdvancedFilter;
  /** Bump to force a full rebuild (e.g. row removed via context menu). */
  refreshKey?: unknown;
}

export interface LazyRowsState {
  total: number;
  loadedRows: number;
  rowAt: (index: number) => CrawlUrlRow | null;
  ensureRange: (start: number, end: number) => void;
  /** True between the moment a shape change is requested (tab/sort/filter
   *  flip) and the moment the new data has fully landed. Lets the
   *  consumer distinguish "0 URLs because the category genuinely has
   *  none" from "0 URLs because we haven't fetched yet" — which the
   *  empty-state UI cares about a lot. */
  isLoading: boolean;
  /** Why the last query for this shape failed (reader timeout, SQL
   *  error), or null. A silent failure looked exactly like "the filter
   *  did nothing"; the consumer shows this instead. */
  error: string | null;
  /** Re-run the current shape now, ignoring the failure back-off. */
  retry: () => void;
}

function describeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw.replace(/^Error invoking remote method '[^']+': /, '').replace(/^Error: /, '');
}

/**
 * Virtualized row loader with seamless live updates.
 *
 * Strategy: when sort/filter/category changes the cache is cleared and
 * the virtualizer re-fills through `ensureRange`. While a crawl is
 * running, a progress-driven tick re-queries the currently visible span
 * as ONE atomic snapshot and REPLACES those chunks in place — no
 * `.clear()`, no placeholder flicker, and no cross-chunk tearing that
 * would duplicate a row's key across a boundary.
 * Combined with `getItemKey: row.id` on the virtualizer, rows that still
 * exist keep their DOM nodes and only their cells re-render; rows that
 * have moved (because new higher-priority rows were inserted ahead of
 * them in the sort order) slide naturally as the virtualizer's total
 * count grows. The user sees a continuously-flowing, sorted table.
 */
export function useLazyUrlRows(opts: LazyRowsOpts): LazyRowsState {
  const [total, setTotal] = useState(0);
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const failedAt = useRef(0);
  const inBackoff = (): boolean => Date.now() - failedAt.current < FAILURE_BACKOFF_MS;
  const noteFailure = (err: unknown): void => {
    failedAt.current = Date.now();
    setError(describeError(err));
  };
  const chunks = useRef(new Map<number, CrawlUrlRow[]>());
  const chunkOrder = useRef<number[]>([]);
  const fetching = useRef(new Set<number>());
  const activeRange = useRef<{ first: number; last: number }>({ first: 0, last: 0 });
  const resetToken = useRef(0);

  // Serialising the filter keeps it part of the cache-key string so
  // changes invalidate chunks the same way as sort/search.
  const filterKey = opts.filter ? JSON.stringify(opts.filter) : '';
  const keyStr = `${opts.category}|${opts.search}|${opts.sortBy ?? ''}|${opts.sortDir}|${filterKey}|${String(opts.refreshKey ?? '')}|${retryNonce}`;

  const queryChunk = useCallback(
    (chunkIdx: number) =>
      window.freecrawl.urlsQuery({
        limit: CHUNK_SIZE,
        offset: chunkIdx * CHUNK_SIZE,
        category: opts.category,
        search: opts.search || undefined,
        sortBy: opts.sortBy,
        sortDir: opts.sortDir,
        filter: opts.filter,
      }),
    [opts.category, opts.search, opts.sortBy, opts.sortDir, opts.filter],
  );

  // Fetch an arbitrary contiguous span in ONE query. Used to refresh the
  // whole visible range as a single consistent snapshot: fetching chunks
  // one-by-one with awaits between them lets the crawler insert a row
  // mid-sort, shifting a row across a 500-boundary so the same `row.id`
  // lands in two adjacent chunks — which the virtualizer then renders with
  // the same key, painting two rows on top of each other. A single
  // LIMIT/OFFSET can't tear that way.
  const queryRange = useCallback(
    (offset: number, limit: number) =>
      window.freecrawl.urlsQuery({
        limit,
        offset,
        category: opts.category,
        search: opts.search || undefined,
        sortBy: opts.sortBy,
        sortDir: opts.sortDir,
        filter: opts.filter,
      }),
    [opts.category, opts.search, opts.sortBy, opts.sortDir, opts.filter],
  );

  // Single entry point for writing a chunk into the cache. Guarantees
  // `chunkOrder` tracks every chunk present in `chunks` — the live tick
  // previously called `chunks.set` directly, leaving untracked chunks
  // the LRU could never evict (a slow heap leak on long live crawls,
  // and `chunkOrder` undercounting so eviction kicked in too late).
  const storeChunk = useCallback(
    (idx: number, rows: CrawlUrlRow[]): void => {
      const isNew = !chunks.current.has(idx);
      chunks.current.set(idx, rows);
      if (isNew) chunkOrder.current.push(idx);
      // Evict chunks not currently visible once the cache exceeds cap.
      while (chunkOrder.current.length > MAX_CACHED_CHUNKS) {
        const evict = chunkOrder.current.shift();
        if (evict === undefined) break;
        const { first, last } = activeRange.current;
        if (evict >= first && evict <= last) {
          chunkOrder.current.push(evict);
          continue;
        }
        chunks.current.delete(evict);
      }
    },
    [],
  );

  // Shape change (tab/sort/filter switch): clear immediately and load
  // fresh data in parallel. Showing the previous tab's rows under the
  // new tab's header is the wrong UX — "Internal" rows visible while
  // "External" is selected makes the user mistrust what they see.
  // Instead we set `isLoading=true` and let the consumer render a
  // proper loading state until the new total + visible chunks land.
  // The reader-pool has multiple workers now, so meta + visible-chunk
  // queries run in parallel and typically resolve in ~50-150 ms.
  useEffect(() => {
    resetToken.current++;
    chunks.current.clear();
    chunkOrder.current = [];
    fetching.current.clear();
    setIsLoading(true);
    setError(null);
    failedAt.current = 0;
    setVersion((v) => v + 1);
    const token = resetToken.current;
    let cancelled = false;

    const load = async (): Promise<void> => {
      const { first, last } = activeRange.current;
      const spanCount = Math.max(1, last - first + 1);
      try {
        // One consistent snapshot of the whole visible span rather than a
        // chunk-per-query fan-out — see queryRange for why tearing across
        // chunk boundaries duplicates row keys.
        const { rows, total: t } = await queryRange(
          first * CHUNK_SIZE,
          spanCount * CHUNK_SIZE,
        );
        if (cancelled || token !== resetToken.current) return;
        for (let c = 0; c < spanCount; c++) {
          storeChunk(first + c, rows.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE));
        }
        setTotal(t);
        setVersion((v) => v + 1);
      } catch (err) {
        if (cancelled || token !== resetToken.current) return;
        // Chunks stay empty; the consumer renders the error and the
        // back-off keeps the live tick from re-issuing the same query.
        noteFailure(err);
      } finally {
        if (!cancelled && token === resetToken.current) {
          setIsLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStr]);

  // Live tick: re-query only the visible chunks and patch them in place.
  // Never calls .clear(), so rowAt never returns null for a
  // previously-loaded index. The table streams rather than flashes.
  //
  // Drive model: push, not poll. Each crawler progress event (≈ every
  // time `crawled` advances, which lands at ~5 Hz on a healthy crawl)
  // triggers an immediate visible-chunk re-query. The previous design
  // polled every 1500 ms regardless of activity — newly-written rows
  // could sit in the DB for up to that long before surfacing in the
  // table. The push path closes that window to ~100 ms (the throttle
  // floor that keeps the reader-pool from being hammered).
  //
  // A 5 s safety-net `setInterval` still fires for code paths that
  // mutate the DB without going through a progress event (manual row
  // delete, project re-open, etc.).
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let lastTickTs = 0;
    const tick = async () => {
      if (inFlight || inBackoff()) return;
      inFlight = true;
      lastTickTs = Date.now();
      const token = resetToken.current;
      try {
        const { first, last } = activeRange.current;
        const spanCount = Math.max(1, last - first + 1);
        try {
          // Atomic snapshot of the visible span: rows + total in one query
          // so a mid-crawl insert can't shift a row across a chunk boundary
          // and duplicate its key (the row-overlap bug). See queryRange.
          const { rows, total: t } = await queryRange(
            first * CHUNK_SIZE,
            spanCount * CHUNK_SIZE,
          );
          if (cancelled || token !== resetToken.current) return;
          setTotal(t);
          for (let c = 0; c < spanCount; c++) {
            storeChunk(first + c, rows.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE));
          }
          setError(null);
        } catch (err) {
          if (cancelled || token !== resetToken.current) return;
          noteFailure(err);
        }
        if (cancelled || token !== resetToken.current) return;
        setVersion((v) => v + 1);
      } finally {
        inFlight = false;
      }
    };
    interface RequestIdleCallback {
      (cb: () => void, opts?: { timeout: number }): number;
    }
    const w = window as Window & { requestIdleCallback?: RequestIdleCallback };
    const scheduleTick = (): void => {
      if (typeof w.requestIdleCallback === 'function') {
        // 300 ms timeout — short enough that the user perceives an
        // event-driven refresh as instant; long enough that an
        // in-progress click handler isn't preempted.
        w.requestIdleCallback(() => void tick(), { timeout: 300 });
      } else {
        void tick();
      }
    };
    // Leading tick fires directly (no idle wrap) so the first row
    // surfaces as soon as the crawler has written one — without this,
    // requestIdleCallback could defer the initial fetch up to 300 ms
    // on a busy main thread right after Start.
    void tick();

    // Push: progress event drives the live-tail tick. We tick on every
    // event where `crawled` changed, throttled to TICK_THROTTLE_MS so
    // a 100 URL/s crawl doesn't force 100 SQL roundtrips per second.
    // Direct call (no idle wrap) — progress events are sparse enough
    // that input-handler interference is a non-concern, and pulling
    // through requestIdleCallback was adding 50-300 ms before each
    // newly-written URL surfaced in the table.
    let lastCrawled = -1;
    const offProgress = window.freecrawl?.onProgress?.((p) => {
      if (p.crawled === lastCrawled) return;
      lastCrawled = p.crawled;
      if (Date.now() - lastTickTs < TICK_THROTTLE_MS) return;
      void tick();
    });

    // Safety-net poll for crawl-idle DB mutations.
    const id = setInterval(scheduleTick, LIVE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
      offProgress?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStr]);

  const fetchChunk = useCallback(
    async (chunkIdx: number) => {
      if (chunks.current.has(chunkIdx)) return;
      if (fetching.current.has(chunkIdx)) return;
      if (inBackoff()) return;
      fetching.current.add(chunkIdx);
      const token = resetToken.current;
      try {
        const { rows, total: t } = await queryChunk(chunkIdx);
        if (token !== resetToken.current) return;
        storeChunk(chunkIdx, rows);
        setTotal(t);
        setError(null);
        setVersion((v) => v + 1);
      } catch (err) {
        // `ensureRange` fires this on every render; a rejection here
        // used to surface as an unhandled promise, and the next render
        // re-issued the same failing query.
        if (token === resetToken.current) noteFailure(err);
      } finally {
        fetching.current.delete(chunkIdx);
      }
    },
    [queryChunk, storeChunk],
  );

  const ensureRange = useCallback(
    (start: number, end: number) => {
      const first = Math.max(0, Math.floor(start / CHUNK_SIZE));
      const last = Math.max(0, Math.floor(end / CHUNK_SIZE));
      activeRange.current = { first, last };
      // Pre-fetch a window of neighbouring chunks so a fast scroll
      // doesn't show "..." placeholders while the next chunk loads —
      // by the time the virtualizer scrolls into the next chunk's
      // range, its rows are usually already in the cache.
      const fetchFrom = Math.max(0, first - PREFETCH_CHUNKS);
      const fetchTo = last + PREFETCH_CHUNKS;
      for (let i = fetchFrom; i <= fetchTo; i++) {
        if (!chunks.current.has(i)) void fetchChunk(i);
      }
    },
    [fetchChunk],
  );

  const rowAt = useCallback(
    (index: number): CrawlUrlRow | null => {
      const chunkIdx = Math.floor(index / CHUNK_SIZE);
      const chunk = chunks.current.get(chunkIdx);
      if (!chunk) return null;
      return chunk[index % CHUNK_SIZE] ?? null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );

  const loadedRows = useMemo(
    () => [...chunks.current.values()].reduce((n, c) => n + c.length, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );

  const retry = useCallback(() => {
    failedAt.current = 0;
    setRetryNonce((n) => n + 1);
  }, []);

  return { total, loadedRows, rowAt, ensureRange, isLoading, error, retry };
}
