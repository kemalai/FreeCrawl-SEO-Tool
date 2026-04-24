import { create } from 'zustand';
import {
  DEFAULT_CRAWL_CONFIG,
  type CrawlConfig,
  type CrawlProgress,
  type CrawlSummary,
  type OverviewCounts,
  type UrlCategory,
} from '@freecrawl/shared-types';

export type TabKey =
  | 'internal'
  | 'external'
  | 'response-codes'
  | 'url'
  | 'page-titles'
  | 'meta-description'
  | 'h1'
  | 'h2'
  | 'content'
  | 'images'
  | 'canonicals'
  | 'directives'
  | 'links'
  | 'broken-links';

export const TAB_ORDER: { key: TabKey; label: string }[] = [
  { key: 'internal', label: 'Internal' },
  { key: 'external', label: 'External' },
  { key: 'response-codes', label: 'Response Codes' },
  { key: 'url', label: 'URL' },
  { key: 'page-titles', label: 'Page Titles' },
  { key: 'meta-description', label: 'Meta Description' },
  { key: 'h1', label: 'H1' },
  { key: 'h2', label: 'H2' },
  { key: 'content', label: 'Content' },
  { key: 'images', label: 'Images' },
  { key: 'canonicals', label: 'Canonicals' },
  { key: 'directives', label: 'Directives' },
  { key: 'links', label: 'Links' },
  { key: 'broken-links', label: 'Broken Links' },
];

interface AppState {
  config: CrawlConfig;
  progress: CrawlProgress | null;
  summary: CrawlSummary | null;
  overview: OverviewCounts | null;
  activeTab: TabKey;
  activeCategory: UrlCategory;
  error: string | null;
  selectedUrlId: number | null;
  sidebarOpen: boolean;
  detailPanelOpen: boolean;
  dataVersion: number;
  setConfig: (patch: Partial<CrawlConfig>) => void;
  setProgress: (p: CrawlProgress) => void;
  setSummary: (s: CrawlSummary) => void;
  setOverview: (o: OverviewCounts) => void;
  setActiveTab: (t: TabKey) => void;
  setActiveCategory: (c: UrlCategory) => void;
  navigateToCategory: (c: UrlCategory) => void;
  setError: (e: string | null) => void;
  setSelectedUrlId: (id: number | null) => void;
  toggleSidebar: () => void;
  toggleDetailPanel: () => void;
  bumpDataVersion: () => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  config: DEFAULT_CRAWL_CONFIG,
  progress: null,
  summary: null,
  overview: null,
  activeTab: 'internal',
  activeCategory: 'internal:html',
  error: null,
  selectedUrlId: null,
  sidebarOpen: true,
  detailPanelOpen: true,
  dataVersion: 0,
  setConfig: (patch) => set((state) => ({ config: { ...state.config, ...patch } })),
  setProgress: (p) => set({ progress: p }),
  setSummary: (s) => set({ summary: s }),
  setOverview: (o) => set({ overview: o }),
  setActiveTab: (t) => set({ activeTab: t, activeCategory: categoryForTab(t) }),
  setActiveCategory: (c) => set({ activeCategory: c }),
  navigateToCategory: (c) => {
    // Some categories are only meaningful on specific tabs — switch the
    // active tab along with the category so the correct view renders.
    const tab = tabForCategory(c);
    set(tab ? { activeCategory: c, activeTab: tab } : { activeCategory: c });
  },
  setError: (e) => set({ error: e }),
  setSelectedUrlId: (id) => set({ selectedUrlId: id }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleDetailPanel: () => set((s) => ({ detailPanelOpen: !s.detailPanelOpen })),
  bumpDataVersion: () => set((s) => ({ dataVersion: s.dataVersion + 1 })),
  reset: () =>
    set({
      progress: null,
      summary: null,
      overview: null,
      error: null,
      selectedUrlId: null,
    }),
}));

function tabForCategory(cat: UrlCategory): TabKey | null {
  if (cat === 'issues:image-missing-alt') return 'images';
  if (
    cat === 'issues:broken-links-all' ||
    cat === 'issues:broken-links-internal' ||
    cat === 'issues:broken-links-external'
  ) {
    return 'broken-links';
  }
  return null;
}

function categoryForTab(tab: TabKey): UrlCategory {
  switch (tab) {
    case 'internal':
      return 'internal:html';
    case 'external':
      return 'external:all';
    case 'response-codes':
      return 'all';
    case 'images':
      return 'all';
    case 'broken-links':
      return 'issues:broken-links-all';
    default:
      return 'internal:html';
  }
}
