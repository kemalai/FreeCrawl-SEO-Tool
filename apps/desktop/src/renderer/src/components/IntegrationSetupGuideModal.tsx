import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, BookOpen, ExternalLink, Lightbulb, X } from 'lucide-react';
import type { IntegrationDef } from '@freecrawl/shared-types';
import { resolveGuides, type Guide } from './integration-guides/index.js';

/**
 * In-app step-by-step setup guide for one integration. Lives as a
 * portal-mounted modal next to the Settings → Integrations card so the
 * user can read the walkthrough without leaving the dialog. Content is
 * intentionally embedded in this file (not externalised to Markdown
 * because we want to ship guides with the binary, not depend on a
 * network-fetched docs site that can drift).
 *
 * Guides are kept current as of 2026-06-01 — the dates of the most
 * recent Google Cloud Console / OpenAI Platform / Anthropic Console UI
 * are noted on each. When Google rebrands a UI label, update the
 * relevant guide's "step" text in EVERY language file.
 *
 * Content lives in `./integration-guides/<lang>.ts`, one file per UI
 * language (eleven of them); `resolveGuides()` picks the set for
 * `i18n.language` and falls back to English for anything unknown.
 */

function pickGuide(lang: string, integrationId: string): Guide | undefined {
  return resolveGuides(lang)[integrationId];
}

interface Props {
  open: boolean;
  integration: IntegrationDef | null;
  onClose: () => void;
}

export function IntegrationSetupGuideModal({ open, integration, onClose }: Props) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !integration) return null;
  const guide = pickGuide(i18n.language, integration.id);

  return createPortal(
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-surface-700 bg-surface-900 shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-surface-800 px-4 py-3">
          <div className="flex items-start gap-2">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-accent-300" />
            <div>
              <div className="text-sm font-semibold text-surface-100">
                {t('integrationGuide.title', {
                  defaultValue: '{{name}} — Setup Guide',
                  name: integration.name,
                })}
              </div>
              <div className="text-[11px] text-surface-500">
                {guide
                  ? t('integrationGuide.lastReviewed', {
                      defaultValue: 'Last reviewed {{date}}',
                      date: guide.lastReviewed,
                    })
                  : t('integrationGuide.notAvailable', {
                      defaultValue: 'A guide for this integration is not yet available.',
                    })}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-200"
            title={t('common.close', { defaultValue: 'Close' })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-[12px] text-surface-300">
          {!guide ? (
            <div className="py-8 text-center text-[12px] text-surface-500">
              {t('integrationGuide.fallback', {
                defaultValue:
                  'No detailed guide yet. Click "Get credentials" on the card to open the provider\'s docs.',
              })}
            </div>
          ) : (
            <>
              <p className="mb-4 text-[12px] leading-relaxed text-surface-200">{guide.intro}</p>

              {guide.prereqs.length > 0 && (
                <section className="mb-4">
                  <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent-300">
                    {t('integrationGuide.prereqs', { defaultValue: 'Prerequisites' })}
                  </h3>
                  <ul className="list-disc space-y-1 pl-5">
                    {guide.prereqs.map((p, i) => (
                      <li key={i} className="text-[12px] leading-relaxed">
                        {p}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="mb-4">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-accent-300">
                  {t('integrationGuide.steps', { defaultValue: 'Step-by-step setup' })}
                </h3>
                <ol className="space-y-3">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500/20 text-[10px] font-mono font-semibold text-accent-300">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-surface-100">{step.title}</div>
                        {step.detail && (
                          <div className="mt-1 whitespace-pre-line text-[11.5px] leading-relaxed text-surface-400">
                            {step.detail}
                          </div>
                        )}
                        {step.link && (
                          <a
                            href={step.link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                          >
                            {step.link.label}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {guide.troubleshooting.length > 0 && (
                <section className="mb-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t('integrationGuide.troubleshooting', { defaultValue: 'Troubleshooting' })}
                  </h3>
                  <ul id="troubleshooting" className="space-y-2">
                    {guide.troubleshooting.map((t, i) => (
                      <li
                        key={i}
                        className="rounded border border-surface-800 bg-surface-950/60 p-2.5"
                      >
                        <div className="text-[11.5px] font-medium text-amber-300">{t.problem}</div>
                        <div className="mt-1 text-[11.5px] leading-relaxed text-surface-400">
                          {t.solution}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {guide.notes && guide.notes.length > 0 && (
                <section className="mb-2">
                  <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                    <Lightbulb className="h-3.5 w-3.5" />
                    {t('integrationGuide.notes', { defaultValue: 'Notes' })}
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-[11.5px] leading-relaxed text-surface-500">
                    {guide.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-surface-800 px-4 py-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-surface-700 px-3 py-1 text-[11px] text-surface-300 hover:bg-surface-800"
          >
            {t('common.close', { defaultValue: 'Close' })}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
