import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Trash2, Check } from 'lucide-react';
import type { GoogleAccount } from '@freecrawl/shared-types';

/**
 * Linked-account manager for an OAuth-BYOC Google integration (Search
 * Console / Analytics 4 / Sheets).
 *
 * A user may connect several Google accounts to the same integration —
 * their own property plus a client's, say — so this lists every linked
 * account, lets them add another, and disconnects them one at a time.
 * Which account a project actually reports on is chosen per project in
 * the tab toolbar; this panel only manages the links themselves.
 *
 * @param integrationId `gsc` / `ga4` / `sheets`.
 * @param configured False until the BYOC client ID + secret are saved —
 *   consent can't start without them, so the connect button is disabled.
 * @param onChange Notifies the parent so a settings section showing an
 *   account dropdown can refresh.
 */
export function GoogleAccountsSection({
  integrationId,
  configured,
  onChange,
}: {
  integrationId: string;
  configured: boolean;
  onChange?: (accounts: GoogleAccount[]) => void;
}) {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<GoogleAccount[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await window.freecrawl.googleAccountsList(integrationId);
    setAccounts(list);
    onChange?.(list);
    // `onChange` is a render-scoped callback in practice; depending on it
    // would re-run this on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await window.freecrawl.googleAuthStart(integrationId);
      if (!res.ok && res.error) setError(res.error);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async (account: GoogleAccount) => {
    const label = account.email ?? account.accountId;
    if (
      !window.confirm(
        t('googleAccounts.confirmDisconnect', {
          defaultValue: 'Disconnect {{account}}? Data already pulled with it stays until the next fetch.',
          account: label,
        }),
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await window.freecrawl.googleAuthRevoke(integrationId, account.accountId);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!accounts) return null;

  return (
    <div className="mt-3 rounded border border-surface-800 bg-surface-950/60 p-2.5">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
          {t('googleAccounts.title', { defaultValue: 'Connected Accounts' })}
        </span>
        <span className="rounded bg-surface-800 px-1.5 py-0.5 text-[9px] tabular-nums text-surface-400">
          {accounts.length}
        </span>
        <button
          type="button"
          onClick={() => void connect()}
          disabled={busy || !configured}
          className="ml-auto inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-surface-700 disabled:text-surface-500"
          title={
            configured
              ? undefined
              : t('googleAccounts.needClient', {
                  defaultValue: 'Save your OAuth client ID + secret first.',
                })
          }
        >
          {busy ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
          {accounts.length === 0
            ? t('googleAccounts.connect', { defaultValue: 'Connect account' })
            : t('googleAccounts.connectAnother', { defaultValue: 'Connect another' })}
        </button>
      </div>

      {accounts.length === 0 ? (
        <p className="text-[10px] leading-relaxed text-surface-500">
          {t('googleAccounts.empty', {
            defaultValue:
              'No account linked yet. Connect one — you can link several and pick which one each project uses.',
          })}
        </p>
      ) : (
        <ul className="space-y-1">
          {accounts.map((a) => (
            <li
              key={a.accountId}
              className="flex items-center gap-2 rounded border border-surface-800 bg-surface-900/40 px-2 py-1"
            >
              <Check size={11} className="shrink-0 text-emerald-400" />
              <span className="truncate text-[11px] text-surface-200" title={a.email ?? a.accountId}>
                {a.email ?? t('googleAccounts.unknownEmail', { defaultValue: 'Google account' })}
              </span>
              <button
                type="button"
                onClick={() => void disconnect(a)}
                disabled={busy}
                className="ml-auto inline-flex items-center gap-1 rounded border border-red-700/60 px-1.5 py-0.5 text-[10px] text-red-300 hover:bg-red-900/20 disabled:opacity-50"
                title={t('googleAccounts.disconnect', { defaultValue: 'Disconnect' })}
              >
                <Trash2 size={10} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <div className="mt-1.5 text-[10px] text-red-400">{error}</div>}
      <p className="mt-2 text-[10px] leading-relaxed text-surface-500">
        {t('googleAccounts.hint', {
          defaultValue:
            'Each project picks which linked account it reports on, in the tab toolbar. Data pulled with different accounts is stored separately.',
        })}
      </p>
    </div>
  );
}
