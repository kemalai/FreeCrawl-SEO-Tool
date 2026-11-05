import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import {
  aiModelOffered,
  type AiModelsResult,
  type AiProvider,
  type AiProviderSettings,
  type AiSettingsState,
} from '@freecrawl/shared-types';

/**
 * Model & Prompt settings for one AI provider (Settings → Integrations →
 * OpenAI / Anthropic / Ollama) — Screaming Frog 24.0's system-wide prompt,
 * live model validation, token usage and Ollama request timeout. Kept
 * apart from the credential card: none of it is a secret, and "Remove
 * credentials" must not wipe a carefully written system prompt.
 */
export function AiProviderSettingsSection({
  provider,
  providerName,
  configured,
}: {
  provider: AiProvider;
  providerName: string;
  configured: boolean;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [state, setState] = useState<AiSettingsState | null>(null);
  const [draft, setDraft] = useState<AiProviderSettings | null>(null);
  const [check, setCheck] = useState<AiModelsResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCheck(null);
    setNotice(null);
    window.freecrawl
      .aiSettingsGet()
      .then((s) => {
        if (cancelled) return;
        setState(s);
        setDraft(s.settings[provider]);
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [provider]);

  if (loadError) {
    return (
      <div className="mt-3 text-[11px]">
        <div className="font-semibold text-rose-300">
          {t('common.loadFailedTitle', { defaultValue: "Couldn't load this view" })}
        </div>
        <div className="mt-0.5 break-words text-surface-500">{loadError}</div>
      </div>
    );
  }
  if (!state || !draft) return null;

  const saved = state.settings[provider];
  const dirty =
    saved.model !== draft.model.trim() ||
    saved.systemPrompt !== draft.systemPrompt.trim() ||
    saved.timeoutSeconds !== draft.timeoutSeconds;
  const effectiveModel = draft.model.trim() || check?.model || state.defaultModels[provider];
  const offered = check?.ok ? aiModelOffered(provider, effectiveModel, check.models) : null;
  const usage = state.usage[provider];

  const runCheck = async (model: string) => {
    setChecking(true);
    try {
      setCheck(await window.freecrawl.aiModels(provider, model.trim() || undefined));
    } finally {
      setChecking(false);
    }
  };

  const save = async () => {
    try {
      const next = await window.freecrawl.aiSettingsSet(provider, draft);
      setState(next);
      setDraft(next.settings[provider]);
      setNotice(t('integrations.saved', { defaultValue: 'Saved.' }));
      if (check) void runCheck(next.settings[provider].model);
    } catch (e) {
      setNotice(
        t('integrations.saveFailed', {
          defaultValue: 'Could not save: {{detail}}',
          detail: e instanceof Error ? e.message : String(e),
        }),
      );
    }
  };

  const resetUsage = async () => {
    setState(await window.freecrawl.aiUsageReset(provider));
  };

  const inputCls =
    'h-6 rounded border border-surface-700 bg-surface-950 px-2 text-[11px] text-surface-100 placeholder-surface-600 focus:border-blue-500 focus:outline-none';
  const labelCls = 'mb-1 text-[10px] font-medium text-surface-300';
  const hintCls = 'mt-1 text-[10px] leading-relaxed text-surface-500';
  const listId = `ai-settings-models-${provider}`;
  const fmt = (n: number) => n.toLocaleString(lang);

  return (
    <div className="mt-3 rounded border border-surface-800 bg-surface-950/60 p-2.5">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
        {t('aiSettings.title', { defaultValue: 'Model & Prompt' })}
      </div>

      {/* ── Default model + live check ─────────────────────────── */}
      <div className="mb-3">
        <div className={labelCls}>{t('aiSettings.defaultModel', { defaultValue: 'Default model' })}</div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className={`${inputCls} w-56`}
            value={draft.model}
            placeholder={state.defaultModels[provider]}
            list={check?.ok ? listId : undefined}
            onChange={(e) => {
              setDraft({ ...draft, model: e.target.value });
              setNotice(null);
            }}
            spellCheck={false}
          />
          {check?.ok && (
            <datalist id={listId}>
              {check.models.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          )}
          <button
            type="button"
            className="inline-flex h-6 items-center gap-1 rounded border border-surface-700 bg-surface-800 px-2 text-[11px] text-surface-200 hover:bg-surface-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => void runCheck(draft.model)}
            disabled={checking || !configured}
            title={
              configured
                ? undefined
                : t('aiSettings.checkNeedsCredentials', {
                    defaultValue: 'Save the credentials above first.',
                  })
            }
          >
            {checking && <Loader2 size={11} className="animate-spin" />}
            {checking
              ? t('aiSettings.checking', { defaultValue: 'Checking…' })
              : t('aiSettings.checkModels', { defaultValue: 'Check models' })}
          </button>
        </div>
        {check && !check.ok && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-300">
            <AlertTriangle size={11} />
            {t('aiSettings.listFailed', {
              defaultValue: 'Could not load the model list: {{detail}}',
              detail: check.error,
            })}
          </div>
        )}
        {offered === true && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-300">
            <Check size={11} />
            {t('aiSettings.modelOk', { defaultValue: '{{model}} is available.', model: effectiveModel })}
          </div>
        )}
        {offered === false && check?.ok && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-amber-200">
            <span className="inline-flex items-center gap-1">
              <AlertTriangle size={11} />
              {t('aiSettings.modelMissing', {
                defaultValue: '{{model}} is not in the current model list of {{provider}}.',
                model: effectiveModel,
                provider: providerName,
              })}
            </span>
            <select
              className="h-5 max-w-[260px] rounded border border-amber-700/60 bg-surface-950 px-1 text-[10px] text-surface-100 focus:outline-none"
              value=""
              onChange={(e) => {
                if (e.target.value) setDraft({ ...draft, model: e.target.value });
              }}
            >
              <option value="">{t('aiSettings.pickModel', { defaultValue: 'Pick a live model…' })}</option>
              {check.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={hintCls}>
          {t('aiSettings.defaultModelHint', {
            defaultValue:
              'Used when the AI tab or the Assistant leaves the model blank. Leave empty for the built-in default ({{model}}).',
            model: state.defaultModels[provider],
          })}
        </div>
      </div>

      {/* ── System prompt ──────────────────────────────────────── */}
      <div className="mb-3">
        <div className={labelCls}>{t('aiSettings.systemPrompt', { defaultValue: 'System prompt' })}</div>
        <textarea
          className="h-20 w-full resize-y rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[11px] text-surface-100 placeholder-surface-600 focus:border-blue-500 focus:outline-none"
          value={draft.systemPrompt}
          placeholder={t('aiSettings.systemPromptPlaceholder', {
            defaultValue: 'You are a technical SEO specialist. Answer in short, plain sentences.',
          })}
          onChange={(e) => {
            setDraft({ ...draft, systemPrompt: e.target.value });
            setNotice(null);
          }}
          spellCheck={false}
        />
        <div className={hintCls}>
          {t('aiSettings.systemPromptHint', {
            defaultValue:
              'Sent with every AI tab prompt to this provider: role, tone, language, constraints. The Assistant keeps its own instructions.',
          })}
        </div>
      </div>

      {/* ── Ollama request timeout ─────────────────────────────── */}
      {provider === 'ollama' && (
        <div className="mb-3">
          <div className={labelCls}>
            {t('aiSettings.timeout', { defaultValue: 'Request timeout (seconds)' })}
          </div>
          <input
            type="number"
            min={10}
            max={3600}
            className={`${inputCls} w-24`}
            value={draft.timeoutSeconds ?? ''}
            placeholder="120"
            onChange={(e) => {
              const v = e.target.value.trim();
              setDraft({ ...draft, timeoutSeconds: v === '' ? null : Number(v) });
              setNotice(null);
            }}
          />
          <div className={hintCls}>
            {t('aiSettings.timeoutHint', {
              defaultValue:
                'How long to wait for the local model to answer (10–3600). Large models on modest hardware need more. Empty = 120 for the AI tab, 180 for the Assistant.',
            })}
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          className="rounded bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void save()}
          disabled={!dirty}
        >
          {t('common.save', { defaultValue: 'Save' })}
        </button>
        {notice && <span className="text-[10px] text-surface-400">{notice}</span>}
      </div>

      {/* ── Token usage ────────────────────────────────────────── */}
      <div className="border-t border-surface-800 pt-2">
        <div className={labelCls}>{t('aiSettings.usageTitle', { defaultValue: 'Token usage' })}</div>
        {usage ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-surface-200">
            <span>
              {t('aiSettings.usageRequests', { defaultValue: 'Requests: {{value}}', value: fmt(usage.requests) })}
            </span>
            <span>
              {t('aiSettings.usageTokensIn', { defaultValue: 'Input tokens: {{value}}', value: fmt(usage.tokensIn) })}
            </span>
            <span>
              {t('aiSettings.usageTokensOut', { defaultValue: 'Output tokens: {{value}}', value: fmt(usage.tokensOut) })}
            </span>
            <span className="text-surface-500">
              {t('aiSettings.usageSince', {
                defaultValue: 'Since {{date}}',
                date: new Date(usage.since).toLocaleDateString(lang),
              })}
            </span>
            <button
              type="button"
              className="rounded border border-surface-700 px-2 py-0.5 text-[10px] text-surface-300 hover:bg-surface-800"
              onClick={() => void resetUsage()}
            >
              {t('aiSettings.usageReset', { defaultValue: 'Reset' })}
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-surface-500">
            {t('aiSettings.usageNone', { defaultValue: 'No requests recorded yet.' })}
          </div>
        )}
        <div className={hintCls}>
          {t('aiSettings.usageHint', {
            defaultValue:
              'Counted on this computer from the token figures each response reports (AI tab and Assistant). Your provider’s bill is the authority.',
          })}
        </div>
      </div>
    </div>
  );
}
