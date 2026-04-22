/// <reference types="vite/client" />

import type { FreeCrawlApi } from '@freecrawl/shared-types';

declare global {
  interface Window {
    freecrawl: FreeCrawlApi;
  }
}

export {};
