import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { PROXY_SPONSOR, useActiveSponsor } from '../sponsors.js';

/**
 * Proxy sponsor card at the top of Settings → Network: who they are, the
 * promo code and how to turn their order into a Proxy URL. Labelled as
 * sponsored, links open in the system browser, and it disappears on its own
 * when the sponsorship term ends.
 */
export function SponsorCard() {
  const { t } = useTranslation();
  const sponsor = useActiveSponsor(PROXY_SPONSOR);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!sponsor) return null;

  const copyCode = () => {
    void navigator.clipboard
      .writeText(sponsor.promoCode)
      .then(() => setCopied(true))
      .catch(() => undefined);
  };

  return (
    <div className="mb-4 rounded border border-surface-800 bg-surface-950/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('sponsor.needProxy', { defaultValue: 'Need a proxy?' })}
        </span>
        <span className="rounded border border-surface-700 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-surface-500">
          {t('sponsor.sponsored', { defaultValue: 'Sponsored' })}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <a href={sponsor.url} target="_blank" rel="noreferrer" className="shrink-0">
          <img src={sponsor.logo} alt={sponsor.name} className="h-[54px] w-[180px] rounded" />
        </a>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-surface-200">
            {t('sponsor.proxySellerTagline', {
              defaultValue: 'Residential, mobile, ISP and datacenter proxies with HTTP(S) and SOCKS5 support.',
            })}
          </p>
          <p className="mt-1 text-[11px] text-surface-400">
            {t('sponsor.promo', {
              defaultValue: '{{discount}}% off with code {{code}}',
              discount: sponsor.discountPercent,
              code: sponsor.promoCode,
            })}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1 rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-200 hover:border-blue-500 hover:bg-surface-800"
              onClick={copyCode}
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copied
                ? t('sponsor.copied', { defaultValue: 'Copied' })
                : t('sponsor.copyCode', { defaultValue: 'Copy code' })}
            </button>
            <a
              href={sponsor.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded bg-accent-500 px-2 py-1 text-[11px] font-medium text-white hover:bg-accent-600"
            >
              {t('sponsor.visit', { defaultValue: 'Visit {{name}}', name: sponsor.name })}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <details className="mt-3 text-[11px] text-surface-300">
        <summary className="cursor-pointer select-none text-surface-400 hover:text-surface-200">
          {t('sponsor.setupTitle', { defaultValue: 'How to set it up' })}
        </summary>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          <li>
            {t('sponsor.setupOrder', {
              defaultValue:
                'Order a proxy. The order email and your Proxy-Seller dashboard list its IP, login, password and the HTTP and SOCKS5 ports.',
            })}
          </li>
          <li>
            {t('sponsor.setupPaste', {
              defaultValue: 'Enter it in the Proxy URL field below in one of these forms:',
            })}
            <div className="mt-1 space-y-0.5 font-mono text-[11px] text-surface-200">
              <div>http://LOGIN:PASSWORD@HOST:HTTP_PORT</div>
              <div>socks5h://LOGIN:PASSWORD@HOST:SOCKS5_PORT</div>
            </div>
          </li>
          <li>
            {t('sponsor.setupResidential', {
              defaultValue:
                'For residential proxies, create a list in the dashboard first (country, rotation) and use the connection details it shows.',
            })}
          </li>
          <li>
            {t('sponsor.setupJsRender', {
              defaultValue:
                'With JavaScript rendering on, use the HTTP form: the browser cannot use a SOCKS5 proxy that needs a password.',
            })}
          </li>
        </ol>
      </details>
    </div>
  );
}
