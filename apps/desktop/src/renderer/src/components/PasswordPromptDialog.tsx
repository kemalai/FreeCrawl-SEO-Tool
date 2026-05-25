import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

interface PasswordPromptDialogProps {
  open: boolean;
  title: string;
  message: string;
  /** When true, requires the user to type the password twice so a typo
   * doesn't lock them out of an encrypted snapshot they're creating. */
  confirm: boolean;
  submitLabel: string;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

/**
 * V1 #4 — Tiny password-entry modal used by the encrypted-snapshot
 * Save / Open flows. Electron's `window.prompt` returns null without
 * showing UI (security default), and `dialog.showMessageBox` has no
 * input field — so we render a small in-renderer overlay.
 *
 * Auto-focuses the first input on open, traps Esc → Cancel and
 * Enter → Submit, and (in `confirm` mode) validates that both fields
 * match before calling `onSubmit`.
 */
export function PasswordPromptDialog({
  open,
  title,
  message,
  confirm,
  submitLabel,
  onSubmit,
  onCancel,
}: PasswordPromptDialogProps): ReactElement | null {
  const { t } = useTranslation();
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setPw1('');
      setPw2('');
      setError(null);
      // Focus after the modal mounts.
      setTimeout(() => firstInputRef.current?.focus(), 30);
    }
  }, [open]);

  if (!open) return null;

  function submit(): void {
    if (pw1.length === 0) {
      setError(
        t('passwordPrompt.errorEmpty', { defaultValue: 'Password cannot be empty.' }),
      );
      return;
    }
    if (confirm && pw1 !== pw2) {
      setError(
        t('passwordPrompt.errorMismatch', { defaultValue: 'Passwords do not match.' }),
      );
      return;
    }
    if (confirm && pw1.length < 8) {
      setError(
        t('passwordPrompt.errorTooShort', {
          defaultValue: 'Use at least 8 characters.',
        }),
      );
      return;
    }
    onSubmit(pw1);
  }

  function onKey(e: React.KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="w-[420px] rounded-md border border-surface-700 bg-surface-900 p-5 text-surface-100 shadow-xl"
        onKeyDown={onKey}
      >
        <h2 className="mb-2 text-[15px] font-semibold">{title}</h2>
        <p className="mb-4 text-[12px] text-surface-300">{message}</p>

        <label className="mb-1 block text-[11px] font-medium text-surface-300">
          {t('passwordPrompt.passwordLabel', { defaultValue: 'Password' })}
        </label>
        <input
          ref={firstInputRef}
          type="password"
          className="mb-3 w-full rounded border border-surface-700 bg-surface-950 px-2 py-1.5 text-[12px] outline-none focus:border-blue-500"
          value={pw1}
          onChange={(e) => setPw1(e.target.value)}
          autoComplete="new-password"
        />

        {confirm && (
          <>
            <label className="mb-1 block text-[11px] font-medium text-surface-300">
              {t('passwordPrompt.confirmLabel', { defaultValue: 'Confirm password' })}
            </label>
            <input
              type="password"
              className="mb-3 w-full rounded border border-surface-700 bg-surface-950 px-2 py-1.5 text-[12px] outline-none focus:border-blue-500"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              autoComplete="new-password"
            />
          </>
        )}

        {error && (
          <div className="mb-3 rounded border border-red-700/60 bg-red-900/30 px-2 py-1.5 text-[11px] text-red-200">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded border border-surface-700 bg-surface-800 px-3 py-1.5 text-[12px] hover:bg-surface-700"
            onClick={onCancel}
          >
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            type="button"
            className="rounded bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-blue-500"
            onClick={submit}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
