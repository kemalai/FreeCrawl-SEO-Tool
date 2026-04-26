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
  settingsOpen: boolean;
  recentUrls: string[];
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
  setSettingsOpen: (open: boolean) => void;
  addRecentUrl: (url: string) => void;
  bumpDataVersion: () => void;
  reset: () => void;
}

const RECENT_URLS_MAX = 5;
const RECENT_URLS_KEY = 'recent-urls';

function loadRecentUrls(): string[] {
  if (typeof window === 'undefined' || !window.freecrawl) return [];
  const saved = window.freecrawl.prefsGet(RECENT_URLS_KEY);
  if (!Array.isArray(saved)) return [];
  return saved
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .slice(0, RECENT_URLS_MAX);
}

/**
 * Hydrate the stored CrawlConfig once at module load. Anything saved by
 * the Settings dialog merges over the defaults so new fields added in
 * later versions still surface (the merge order is `defaults <- saved`).
 *
 * `startUrl` is intentionally NOT restored — every launch starts with an
 * empty URL bar; recent URLs are surfaced via a dropdown instead.
 */
function loadInitialConfig(): CrawlConfig {
  if (typeof window === 'undefined' || !window.freecrawl) return DEFAULT_CRAWL_CONFIG;
  const saved = window.freecrawl.prefsGet('crawl-config');
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_CRAWL_CONFIG, startUrl: '' };
  return { ...DEFAULT_CRAWL_CONFIG, ...(saved as Partial<CrawlConfig>), startUrl: '' };
}

export const useAppStore = create<AppState>((set) => ({
  config: loadInitialConfig(),
  progress: null,
  summary: null,
  overview: null,
  activeTab: 'internal',
  activeCategory: 'internal:html',
  error: null,
  selectedUrlId: null,
  sidebarOpen: true,
  detailPanelOpen: true,
  settingsOpen: false,
  recentUrls: loadRecentUrls(),
  dataVersion: 0,
  setConfig: (patch) =>
    set((state) => {
      const next = { ...state.config, ...patch };
      // Persist every config edit so the next launch starts from the
      // user's last settings — even fields the Settings dialog doesn't
      // expose (e.g. live URL / scope edits in the top bar).
      try {
        window.freecrawl?.prefsSet('crawl-config', next);
      } catch {
        // best-effort persistence
      }
      return { config: next };
    }),
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
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  addRecentUrl: (url) =>
    set((state) => {
      const trimmed = url.trim();
      if (!trimmed) return state;
      const next = [trimmed, ...state.recentUrls.filter((u) => u !== trimmed)].slice(
        0,
        RECENT_URLS_MAX,
      );
      try {
        window.freecrawl?.prefsSet(RECENT_URLS_KEY, next);
      } catch {
        // best-effort persistence
      }
      return { recentUrls: next };
    }),
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
