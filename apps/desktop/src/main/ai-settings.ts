/**
 * Per-provider AI behaviour settings and token totals (Screaming Frog 24.0
 * parity: system-wide prompt, live model check, token usage, Ollama
 * timeout).
 *
 * Neither is a credential, so both live in the app prefs rather than the
 * encrypted credential store. The prefs cache is owned by `index.ts`; it
 * hands this module a tiny get/set pair at startup so there is no import
 * cycle and tests can run against a plain object.
 */
import type {
  AiProvider,
  AiProviderSettings,
  AiUsage,
} from '@freecrawl/shared-types';

export interface AiPrefsStore {
  get(key: string): unknown;
  /** Persist a value (the store debounces the disk write). */
  set(key: string, value: unknown): void;
}

const SETTINGS_KEY = 'ai-provider-settings';
const USAGE_KEY = 'ai-usage';
export const AI_PROVIDERS: readonly AiProvider[] = ['openai', 'anthropic', 'ollama'];
const MAX_MODEL_LENGTH = 200;
const MAX_SYSTEM_PROMPT_LENGTH = 20_000;
export const MIN_TIMEOUT_SECONDS = 10;
export const MAX_TIMEOUT_SECONDS = 3600;

let store: AiPrefsStore | null = null;
/** Usage is counted in memory and written on a short debounce, so a batch
 *  of a few thousand prompts doesn't rewrite the prefs file per response. */
let usageCache: Partial<Record<AiProvider, AiUsage>> | null = null;
let usageFlushTimer: ReturnType<typeof setTimeout> | null = null;

export function configureAiPrefsStore(s: AiPrefsStore | null): void {
  store = s;
  usageCache = null;
  if (usageFlushTimer) clearTimeout(usageFlushTimer);
  usageFlushTimer = null;
}

const EMPTY: AiProviderSettings = { model: '', systemPrompt: '', timeoutSeconds: null };

export function normalizeAiProviderSettings(raw: unknown): AiProviderSettings {
  if (!raw || typeof raw !== 'object') return { ...EMPTY };
  const r = raw as Record<string, unknown>;
  const model = typeof r['model'] === 'string' ? r['model'].trim().slice(0, MAX_MODEL_LENGTH) : '';
  const systemPrompt =
    typeof r['systemPrompt'] === 'string'
      ? r['systemPrompt'].trim().slice(0, MAX_SYSTEM_PROMPT_LENGTH)
      : '';
  const t = typeof r['timeoutSeconds'] === 'number' ? r['timeoutSeconds'] : Number.NaN;
  const timeoutSeconds = Number.isFinite(t)
    ? Math.min(MAX_TIMEOUT_SECONDS, Math.max(MIN_TIMEOUT_SECONDS, Math.round(t)))
    : null;
  return { model, systemPrompt, timeoutSeconds };
}

function allSettingsRaw(): Record<string, unknown> {
  const v = store?.get(SETTINGS_KEY);
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export function aiProviderSettings(provider: AiProvider): AiProviderSettings {
  return normalizeAiProviderSettings(allSettingsRaw()[provider]);
}

export function allAiProviderSettings(): Record<AiProvider, AiProviderSettings> {
  const raw = allSettingsRaw();
  return {
    openai: normalizeAiProviderSettings(raw['openai']),
    anthropic: normalizeAiProviderSettings(raw['anthropic']),
    ollama: normalizeAiProviderSettings(raw['ollama']),
  };
}

export function setAiProviderSettings(provider: AiProvider, next: unknown): AiProviderSettings {
  const clean = normalizeAiProviderSettings(next);
  store?.set(SETTINGS_KEY, { ...allSettingsRaw(), [provider]: clean });
  return clean;
}

function loadUsage(): Partial<Record<AiProvider, AiUsage>> {
  if (usageCache) return usageCache;
  const raw = store?.get(USAGE_KEY);
  const out: Partial<Record<AiProvider, AiUsage>> = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const p of AI_PROVIDERS) {
      const u = (raw as Record<string, unknown>)[p] as Partial<AiUsage> | undefined;
      if (!u || typeof u !== 'object') continue;
      const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
      out[p] = {
        requests: num(u.requests),
        tokensIn: num(u.tokensIn),
        tokensOut: num(u.tokensOut),
        since: typeof u.since === 'string' ? u.since : new Date().toISOString(),
      };
    }
  }
  usageCache = out;
  return out;
}

function scheduleUsageFlush(): void {
  if (usageFlushTimer) return;
  usageFlushTimer = setTimeout(() => {
    usageFlushTimer = null;
    flushAiUsage();
  }, 2000);
}

/** Write pending usage now (app quit). */
export function flushAiUsage(): void {
  if (usageFlushTimer) {
    clearTimeout(usageFlushTimer);
    usageFlushTimer = null;
  }
  if (usageCache) store?.set(USAGE_KEY, usageCache);
}

/** Count one answered request. Token figures the provider didn't report count as 0. */
export function recordAiUsage(
  provider: AiProvider,
  tokensIn: number | null,
  tokensOut: number | null,
): void {
  const usage = loadUsage();
  const cur = usage[provider] ?? {
    requests: 0,
    tokensIn: 0,
    tokensOut: 0,
    since: new Date().toISOString(),
  };
  usage[provider] = {
    requests: cur.requests + 1,
    tokensIn: cur.tokensIn + Math.max(0, tokensIn ?? 0),
    tokensOut: cur.tokensOut + Math.max(0, tokensOut ?? 0),
    since: cur.since,
  };
  scheduleUsageFlush();
}

export function aiUsage(): Partial<Record<AiProvider, AiUsage>> {
  const usage = loadUsage();
  const out: Partial<Record<AiProvider, AiUsage>> = {};
  for (const p of AI_PROVIDERS) if (usage[p]) out[p] = { ...usage[p]! };
  return out;
}

export function resetAiUsage(provider: AiProvider): void {
  const usage = loadUsage();
  delete usage[provider];
  flushAiUsage();
}
