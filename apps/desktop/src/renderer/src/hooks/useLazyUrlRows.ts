import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AdvancedFilter, CrawlUrlRow, UrlCategory } from '@freecrawl/shared-types';

const CHUNK_SIZE = 500;
const MAX_CACHED_CHUNKS = 8;
// Live-refresh cadence during an active crawl. 250 ms keeps perceived
// row arrival close to "as they're crawled" without saturating the COUNT
// query — at 20 RPS the user sees ~5 rows per tick instead of 30 in a
// 1.5 s lump (which felt like the program had stalled).
const LIVE_REFRESH_MS = 250;

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

  // Shape change: rebuild from scratch. The virtualizer will call
  // ensureRange again on its next measurement pass.
  useEffect(() => {
    resetToken.current++;
    chunks.current.clear();
    chunkOrder.current = [];
    fetching.current.clear();
    setVersion((v) => v + 1);
    const token = resetToken.current;
    let cancelled = false;
    void queryMeta().then(({ total: t }) => {
      if (cancelled || token !== resetToken.current) return;
      setTotal(t);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStr]);

  // Live tick: re-query only the visible chunks and patch them in place.
  // Never calls .clear(), so rowAt never returns null for a
  // previously-loaded index. The table streams rather than flashes.
  // A leading tick fires immediately so the first rows surface without
  // the LIVE_REFRESH_MS dead window after Start.
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const tick = async () => {
      // Coalesce overlapping ticks — at 250 ms cadence a slow COUNT or
      // chunk fetch can otherwise queue up multiple in-flight ticks.
      if (inFlight) return;
      inFlight = true;
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
            chunks.current.set(i, rows);
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
    void tick();
    const id = setInterval(tick, LIVE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
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
        chunks.current.set(chunkIdx, rows);
        chunkOrder.current.push(chunkIdx);
        // Evict chunks not currently visible once cache exceeds cap.
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
        setTotal(t);
        setVersion((v) => v + 1);
      } finally {
        fetching.current.delete(chunkIdx);
      }
    },
    [queryChunk],
  );

  const ensureRange = useCallback(
    (start: number, end: number) => {
      const first = Math.max(0, Math.floor(start / CHUNK_SIZE));
      const last = Math.max(0, Math.floor(end / CHUNK_SIZE));
      activeRange.current = { first, last };
      for (let i = first; i <= last; i++) {
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

  return { total, loadedRows, rowAt, ensureRange };
}
