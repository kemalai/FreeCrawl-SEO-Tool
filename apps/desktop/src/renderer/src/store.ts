import { create } from 'zustand';
import {
  DEFAULT_CRAWL_CONFIG,
  type CrawlConfig,
  type CrawlProgress,
  type CrawlSummary,
} from '@freecrawl/shared-types';

export type TabKey = 'overview' | 'internal' | 'external' | 'issues';

interface AppState {
  config: CrawlConfig;
  progress: CrawlProgress | null;
  summary: CrawlSummary | null;
  activeTab: TabKey;
  error: string | null;
  setConfig: (patch: Partial<CrawlConfig>) => void;
  setProgress: (p: CrawlProgress) => void;
  setSummary: (s: CrawlSummary) => void;
  setActiveTab: (t: TabKey) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  config: DEFAULT_CRAWL_CONFIG,
  progress: null,
  summary: null,
  activeTab: 'overview',
  error: null,
  setConfig: (patch) =>
    set((state) => ({ config: { ...state.config, ...patch } })),
  setProgress: (p) => set({ progress: p }),
  setSummary: (s) => set({ summary: s }),
  setActiveTab: (t) => set({ activeTab: t }),
  setError: (e) => set({ error: e }),
  reset: () => set({ progress: null, summary: null, error: null }),
}));
