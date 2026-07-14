import type { CrawlConfig } from '@freecrawl/shared-types';

/**
 * A project template seeds a fresh crawl with sensible defaults for a site
 * type — mainly a set of starter exclude patterns (regex) plus URL/depth
 * budgets. Applying one clears the current scratch project and merges the
 * overrides over the user's current config.
 */
export interface ProjectTemplate {
  key: string;
  label: string;
  description: string;
  /** Merged over the current config via `setConfig` when applied. */
  overrides: Partial<CrawlConfig>;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    key: 'blank',
    label: 'Blank',
    description: 'Your current default settings — a clean crawl with nothing pre-filled.',
    overrides: {},
  },
  {
    key: 'ecommerce',
    label: 'E-commerce',
    description:
      'Skips cart, checkout, account and faceted-filter URLs; larger URL budget for big catalogs.',
    overrides: {
      maxUrls: 200_000,
      excludePatterns: [
        '/cart',
        '/checkout',
        '/account',
        '/wishlist',
        '/compare',
        '[?&](add-to-cart|orderby|filter|price|color|size)=',
      ],
    },
  },
  {
    key: 'blog',
    label: 'Blog / Content',
    description: 'Skips author, tag and date-archive noise so the crawl focuses on articles.',
    overrides: {
      excludePatterns: ['/tag/', '/author/', '/category/page/', '/\\d{4}/\\d{2}/'],
    },
  },
  {
    key: 'corporate',
    label: 'Corporate site',
    description: 'Balanced defaults for a marketing / brochure site.',
    overrides: {
      maxDepth: 10,
    },
  },
  {
    key: 'news',
    label: 'News / Publisher',
    description: 'Large URL budget; skips print variants and comment-page pagination.',
    overrides: {
      maxUrls: 500_000,
      excludePatterns: ['/print/', '\\?replytocom=', '/comment-page-', '/amp/'],
    },
  },
  {
    key: 'saas',
    label: 'SaaS / Web app',
    description: 'Skips authenticated app areas (login, signup, dashboard, settings).',
    overrides: {
      excludePatterns: [
        '/login',
        '/signup',
        '/sign-in',
        '/dashboard',
        '/app/',
        '/settings',
        '/account',
      ],
    },
  },
];
