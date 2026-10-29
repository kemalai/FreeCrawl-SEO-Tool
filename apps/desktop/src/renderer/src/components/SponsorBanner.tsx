import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, X } from 'lucide-react';
import { useAppStore } from '../store.js';
import { PROXY_SPONSOR, useActiveSponsor } from '../sponsors.js';

const HIDDEN_KEY = 'freecrawl.sponsorHidden';

function readHidden(): string | null {
  try {
    return localStorage.getItem(HIDDEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Sponsor banner in the empty URL grid. It only shows while there is no
 * crawl data at all, so it never sits next to results or appears during a
 * crawl. The user can hide it for the rest of the sponsorship term (the key
 * is the term id); the term's end date removes it for everyone.
 */
export function SponsorBanner() {
  const { t } = useTranslation();
  const sponsor = useActiveSponsor(PROXY_SPONSOR);
  const [hiddenId, setHiddenId] = useState(readHidden);
  // Same signals as the Clear button: any of them means there is data.
  const hasData = useAppStore(
    (s) =>
      s.progress?.running === true ||
      (s.progress?.discovered ?? 0) > 0 ||
      (s.summary?.total ?? 0) > 0 ||
      (s.overview?.summary.totalInternalUrls ?? 0) > 0 ||
      (s.overview?.summary.totalExternalUrls ?? 0) > 0,
  );

  if (!sponsor || hasData || hiddenId === sponsor.id) return null;

  const hide = () => {
    try {
      localStorage.setItem(HIDDEN_KEY, sponsor.id);
    } catch {
      // Storage unavailable — hide for this session only.
    }
    setHiddenId(sponsor.id);
  };

  return (
    <div className="pointer-events-auto relative mx-auto mt-6 flex w-[420px] max-w-full items-center gap-3 rounded border border-surface-800 bg-surface-900/60 p-2.5 pr-7 text-left">
      <a href={sponsor.url} target="_blank" rel="noreferrer" className="shrink-0">
        <img src={sponsor.logo} alt={sponsor.name} className="h-[42px] w-[140px] rounded" />
      </a>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] uppercase tracking-wider text-surface-500">
          {t('sponsor.sponsored', { defaultValue: 'Sponsored' })}
        </div>
        <div className="text-[11px] text-surface-300">
          {t('sponsor.promo', {
            defaultValue: '{{discount}}% off with code {{code}}',
            discount: sponsor.discountPercent,
            code: sponsor.promoCode,
          })}
        </div>
        <a
          href={sponsor.url}
          target="_blank"
          rel="noreferrer"
          className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
        >
          {t('sponsor.visit', { defaultValue: 'Visit {{name}}', name: sponsor.name })}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <button
        type="button"
        className="absolute right-1 top-1 rounded p-0.5 text-surface-500 hover:bg-surface-800 hover:text-surface-200"
        onClick={hide}
        title={t('sponsor.hide', { defaultValue: 'Hide' })}
        aria-label={t('sponsor.hide', { defaultValue: 'Hide' })}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
