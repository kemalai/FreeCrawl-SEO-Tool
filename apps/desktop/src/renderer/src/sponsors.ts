import { useEffect, useState } from 'react';
import proxySellerLogo from './assets/sponsors/proxy-seller-logo.png';

/**
 * A paid sponsor placement. Every placement carries a fixed end date baked
 * into the build: once it passes, the placement disappears on its own — no
 * network call, no remote config, nothing tracked. A renewal ships as a new
 * release with a later date.
 */
export interface Sponsor {
  /** Changes per sponsorship term, so a hidden banner comes back for a new
   *  term but stays hidden within the same one. */
  id: string;
  name: string;
  url: string;
  promoCode: string;
  discountPercent: number;
  /** Placements are hidden from this instant on (epoch ms, UTC). */
  endsAt: number;
  logo: string;
}

/** Shown next to the proxy settings (Settings → Network) and in the empty URL grid. */
export const PROXY_SPONSOR: Sponsor = {
  id: 'proxy-seller-2026-10',
  name: 'Proxy-Seller',
  url: 'https://proxy-seller.com/?partner=OZRC99N33QJEWQ',
  promoCode: 'FREECRAWL',
  discountPercent: 15,
  // One-month term starting 2026-10-29; shown through 29 Nov 2026.
  endsAt: Date.UTC(2026, 10, 30),
  logo: proxySellerLogo,
};

// setTimeout fires immediately for delays above 2^31-1 ms (~24.8 days).
const MAX_TIMER_MS = 2_147_483_647;

/** The sponsor while its term runs, else null. Re-renders when the term ends
 *  so an app left open past the end date drops the placement too. */
export function useActiveSponsor(sponsor: Sponsor): Sponsor | null {
  const [active, setActive] = useState(() => Date.now() < sponsor.endsAt);
  useEffect(() => {
    if (!active) return;
    const left = sponsor.endsAt - Date.now();
    if (left > MAX_TIMER_MS) return;
    const timer = setTimeout(() => setActive(false), Math.max(0, left));
    return () => clearTimeout(timer);
  }, [active, sponsor.endsAt]);
  return active ? sponsor : null;
}
