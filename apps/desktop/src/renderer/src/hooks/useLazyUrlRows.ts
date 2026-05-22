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
}

/**
 * Virtualized row loader with seamless live updates.
 *
 * Strategy: when sort/filter/category changes the cache is cleared and
 * the virtualizer re-fills through `ensureRange`. While a crawl is
 * running, a 1500ms timer re-queries only the currently visible chunks
 * and REPLACES them in place — no `.clear()`, no placeholder flicker.
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
  const chunks = useRef(new Map<number, CrawlUrlRow[]>());
  const chunkOrder = useRef<number[]>([]);
  const fetching = useRef(new Set<number>());
  const activeRange = useRef<{ first: number; last: number }>({ first: 0, last: 0 });
  const resetToken = useRef(0);

  // Serialising the filter keeps it part of the cache-key string so
  // changes invalidate chunks the same way as sort/search.
  const filterKey = opts.filter ? JSON.stringify(opts.filter) : '';
  const keyStr = `${opts.category}|${opts.search}|${opts.sortBy ?? ''}|${opts.sortDir}|${filterKey}|${String(opts.refreshKey ?? '')}`;

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

  const queryMeta = useCallback(
    () =>
      window.freecrawl.urlsQuery({
        limit: 0,
        offset: 0,
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
    setVersion((v) => v + 1);
    const token = resetToken.current;
    let cancelled = false;

    const load = async (): Promise<void> => {
      const metaPromise = queryMeta();
      const { first, last } = activeRange.current;
      const chunkPromises: Promise<{ rows: CrawlUrlRow[]; total: number; idx: number }>[] = [];
      for (let i = first; i <= last; i++) {
        chunkPromises.push(queryChunk(i).then((r) => ({ ...r, idx: i })));
      }
      try {
        const [{ total: t }, ...newChunks] = await Promise.all([metaPromise, ...chunkPromises]);
        if (cancelled || token !== resetToken.current) return;
        for (const ch of newChunks) {
          storeChunk(ch.idx, ch.rows);
        }
        setTotal(t);
        setVersion((v) => v + 1);
      } catch {
        if (cancelled || token !== resetToken.current) return;
        // Leave chunks empty on error; the live tick / ensureRange
        // will retry. Still need to flip loading off so the empty
        // state can render an actual error/empty UI.
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
      if (inFlight) return;
      inFlight = true;
      lastTickTs = Date.now();
      const token = resetToken.current;
      try {
        try {
          const { total: t } = await queryMeta();
          if (cancelled || token !== resetToken.current) return;
          setTotal(t);
        } catch {
          /* ignore transient errors */
        }
        const { first, last } = activeRange.current;
        for (let i = first; i <= last; i++) {
          try {
            const { rows } = await queryChunk(i);
            if (cancelled || token !== resetToken.current) return;
            storeChunk(i, rows);
          } catch {
            /* ignore */
          }
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
      fetching.current.add(chunkIdx);
      const token = resetToken.current;
      try {
        const { rows, total: t } = await queryChunk(chunkIdx);
        if (token !== resetToken.current) return;
        storeChunk(chunkIdx, rows);
        setTotal(t);
        setVersion((v) => v + 1);
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

  return { total, loadedRows, rowAt, ensureRange, isLoading };
}
