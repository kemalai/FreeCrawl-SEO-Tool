import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plug,
  Send,
  ShieldQuestion,
  Square,
  Trash2,
  Wrench,
} from 'lucide-react';
import type {
  AiProvider,
  AssistantMessage,
  AssistantToolCall,
  McpServerConfig,
  McpServerStatus,
} from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

const PROVIDER_LABEL: Record<AiProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  ollama: 'Ollama (local)',
};

const PROVIDER_PREF = 'assistant:provider';
const MODEL_PREF = 'assistant:model';
const SERVERS_PREF = 'assistant:servers';
const BUILTINS_PREF = 'assistant:builtins';

/** Pretty-print a tool payload without letting one huge result push the
 *  whole conversation off screen. */
function preview(raw: string, max = 4000): string {
  const text = raw.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n… (${text.length - max} more characters)`;
}

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AssistantTab() {
  const { t } = useTranslation();
  const messages = useAppStore((s) => s.assistantMessages);
  const approvals = useAppStore((s) => s.assistantApprovals);
  const activeCall = useAppStore((s) => s.assistantActiveCall);
  const running = useAppStore((s) => s.assistantRunning);
  const round = useAppStore((s) => s.assistantRound);
  const assistantError = useAppStore((s) => s.assistantError);
  const startTurn = useAppStore((s) => s.assistantStartTurn);
  const commitTurn = useAppStore((s) => s.assistantCommitTurn);
  const setRunning = useAppStore((s) => s.assistantSetRunning);
  const resolveApproval = useAppStore((s) => s.assistantResolveApproval);
  const clearChat = useAppStore((s) => s.assistantClear);

  const [provider, setProvider] = useState<AiProvider>(() => {
    const saved = window.freecrawl?.prefsGet(PROVIDER_PREF);
    return saved === 'anthropic' || saved === 'ollama' ? saved : 'openai';
  });
  const [model, setModel] = useState<string>(() => {
    const saved = window.freecrawl?.prefsGet(MODEL_PREF);
    return typeof saved === 'string' ? saved : '';
  });
  const [servers, setServers] = useState<McpServerConfig[]>([]);
  const [statuses, setStatuses] = useState<Record<string, McpServerStatus>>({});
  const [selectedServers, setSelectedServers] = useState<string[]>(() => {
    const saved = window.freecrawl?.prefsGet(SERVERS_PREF);
    return Array.isArray(saved) ? (saved as string[]) : [];
  });
  const [includeBuiltins, setIncludeBuiltins] = useState<boolean>(() => {
    const saved = window.freecrawl?.prefsGet(BUILTINS_PREF);
    return saved !== false;
  });
  const [toolsOpen, setToolsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [lastUsage, setLastUsage] = useState<{ in: number; out: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  const refreshServers = useCallback(async () => {
    const [list, statusList] = await Promise.all([
      window.freecrawl.mcpServersList(),
      window.freecrawl.mcpServerStatuses(),
    ]);
    setServers(list);
    setStatuses(Object.fromEntries(statusList.map((s) => [s.id, s])));
  }, []);

  useEffect(() => {
    void refreshServers();
  }, [refreshServers]);

  // Persist the picker choices — re-selecting three servers on every
  // launch is exactly the kind of friction that kills a chat surface.
  useEffect(() => {
    window.freecrawl?.prefsSet(PROVIDER_PREF, provider);
  }, [provider]);
  useEffect(() => {
    window.freecrawl?.prefsSet(MODEL_PREF, model);
  }, [model]);
  useEffect(() => {
    window.freecrawl?.prefsSet(SERVERS_PREF, selectedServers);
  }, [selectedServers]);
  useEffect(() => {
    window.freecrawl?.prefsSet(BUILTINS_PREF, includeBuiltins);
  }, [includeBuiltins]);

  // Keep the newest message in view while a turn streams in.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, approvals.length, activeCall, running]);

  const enabledServers = useMemo(() => servers.filter((s) => s.enabled), [servers]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || running) return;
    setDraft('');
    const userMessage: AssistantMessage = { role: 'user', content: text };
    const startIndex = startTurn(userMessage);
    const history = [...useAppStore.getState().assistantMessages];
    try {
      const result = await window.freecrawl.assistantSend({
        provider,
        model: model.trim() || undefined,
        messages: history,
        serverIds: selectedServers.filter((id) =>
          enabledServers.some((s) => s.id === id),
        ),
        includeBuiltins,
      });
      commitTurn(startIndex, result.messages);
      if (result.tokensIn || result.tokensOut) {
        setLastUsage({ in: result.tokensIn ?? 0, out: result.tokensOut ?? 0 });
      }
    } catch (err) {
      setRunning(false);
      useAppStore.setState({
        assistantError: err instanceof Error ? err.message : String(err),
      });
    }
  }, [
    draft,
    running,
    provider,
    model,
    selectedServers,
    enabledServers,
    includeBuiltins,
    startTurn,
    commitTurn,
    setRunning,
  ]);

  async function decide(
    requestId: string,
    decision: 'allow-once' | 'allow-always' | 'deny',
  ) {
    resolveApproval(requestId);
    await window.freecrawl.assistantApprove({ requestId, decision });
  }

  async function connectServer(id: string) {
    const status = await window.freecrawl.mcpServerConnect(id);
    setStatuses((prev) => ({ ...prev, [id]: status }));
  }

  /** Arguments the model passed for one tool result, looked up on the
   *  assistant message that requested it. */
  const argsByCallId = useMemo(() => {
    const map = new Map<string, AssistantToolCall>();
    for (const m of messages) {
      for (const call of m.toolCalls ?? []) map.set(call.id, call);
    }
    return map;
  }, [messages]);

  return (
    <div className="flex h-full flex-col bg-surface-950">
      {/* Toolbar */}
      <div className="flex h-9 flex-none items-center gap-2 border-b border-surface-800 px-2">
        <select
          className="h-6 rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
          value={provider}
          onChange={(e) => setProvider(e.target.value as AiProvider)}
        >
          {(Object.keys(PROVIDER_LABEL) as AiProvider[]).map((p) => (
            <option key={p} value={p}>
              {PROVIDER_LABEL[p]}
            </option>
          ))}
        </select>
        <input
          className="h-6 w-44 rounded border border-surface-700 bg-surface-950 px-1.5 text-[11px] text-surface-100 placeholder:text-surface-600 focus:border-blue-500 focus:outline-none"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={t('assistant.modelPlaceholder', {
            defaultValue: 'Model (provider default)',
          })}
        />
        <div className="relative">
          <button
            className="flex h-6 items-center gap-1 rounded border border-surface-700 px-2 text-[11px] text-surface-300 hover:bg-surface-800 hover:text-surface-100"
            onClick={() => setToolsOpen((v) => !v)}
          >
            <Wrench size={12} />
            {t('assistant.tools', { defaultValue: 'Tools' })}
            <span className="text-surface-500">
              ({(includeBuiltins ? 1 : 0) + selectedServers.length})
            </span>
            <ChevronDown size={11} />
          </button>
          {toolsOpen && (
            <div className="absolute left-0 top-7 z-50 w-80 rounded border border-surface-700 bg-surface-900 p-2 shadow-xl">
              <label className="flex cursor-pointer items-start gap-2 rounded p-1.5 hover:bg-surface-800">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={includeBuiltins}
                  onChange={(e) => setIncludeBuiltins(e.target.checked)}
                />
                <span>
                  <span className="block text-[11px] text-surface-100">
                    {t('assistant.builtinTools', {
                      defaultValue: 'FreeCrawl project tools',
                    })}
                  </span>
                  <span className="block text-[10px] text-surface-500">
                    {t('assistant.builtinToolsHint', {
                      defaultValue:
                        'Read-only queries against the open crawl. Run without asking.',
                    })}
                  </span>
                </span>
              </label>
              <div className="mt-2 mb-1 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                {t('assistant.mcpServers', { defaultValue: 'MCP servers' })}
              </div>
              {enabledServers.length === 0 && (
                <p className="px-1.5 pb-1 text-[10px] text-surface-500">
                  {t('assistant.noServers', {
                    defaultValue:
                      'No MCP servers configured yet. Add one in Settings → MCP Servers.',
                  })}
                </p>
              )}
              {enabledServers.map((s) => {
                const status = statuses[s.id];
                const checked = selectedServers.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-start gap-2 rounded p-1.5 hover:bg-surface-800"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedServers((prev) =>
                          e.target.checked
                            ? [...prev, s.id]
                            : prev.filter((id) => id !== s.id),
                        );
                        if (e.target.checked && !status?.connected) {
                          void connectServer(s.id);
                        }
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[11px] text-surface-100">
                        {s.label}
                        <span
                          className={
                            status?.connected
                              ? 'h-1.5 w-1.5 rounded-full bg-emerald-500'
                              : 'h-1.5 w-1.5 rounded-full bg-surface-600'
                          }
                        />
                        {status?.connected && (
                          <span className="text-[10px] text-surface-500">
                            {t('assistant.toolCount', {
                              defaultValue: '{{n}} tool(s)',
                              n: status.toolCount,
                            })}
                          </span>
                        )}
                      </span>
                      {status?.error && (
                        <span className="block truncate text-[10px] text-red-400">
                          {status.error}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
              <button
                className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-surface-700 py-1 text-[10px] text-surface-300 hover:bg-surface-800 hover:text-surface-100"
                onClick={() => {
                  setToolsOpen(false);
                  setSettingsOpen(true, { section: 'mcp-servers' });
                }}
              >
                <Plug size={11} />
                {t('assistant.manageServers', { defaultValue: 'Manage MCP servers' })}
              </button>
            </div>
          )}
        </div>
        <div className="flex-1" />
        {lastUsage && (
          <span className="text-[10px] text-surface-500">
            {t('assistant.tokens', {
              defaultValue: '{{in}} in / {{out}} out tokens',
              in: lastUsage.in.toLocaleString(),
              out: lastUsage.out.toLocaleString(),
            })}
          </span>
        )}
        <button
          className="flex h-6 items-center gap-1 rounded border border-surface-700 px-2 text-[11px] text-surface-300 hover:bg-surface-800 hover:text-surface-100 disabled:opacity-40"
          onClick={clearChat}
          disabled={running || messages.length === 0}
        >
          <Trash2 size={12} />
          {t('assistant.clear', { defaultValue: 'Clear' })}
        </button>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
        {messages.length === 0 && (
          <div className="mx-auto mt-8 max-w-xl text-center">
            <p className="text-[12px] text-surface-300">
              {t('assistant.emptyTitle', {
                defaultValue: 'Ask about this crawl in plain language.',
              })}
            </p>
            <p className="mt-1 text-[11px] text-surface-500">
              {t('assistant.emptyHint', {
                defaultValue:
                  'The assistant reads the open project through read-only tools, and can call any MCP server you connect. Your API key stays on this machine.',
              })}
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBlock
            key={i}
            message={m}
            call={m.toolCallId ? argsByCallId.get(m.toolCallId) : undefined}
          />
        ))}

        {activeCall && (
          <div className="my-1 flex items-center gap-2 rounded border border-surface-800 bg-surface-900/40 px-2 py-1.5 text-[11px] text-surface-400">
            <Loader2 size={12} className="animate-spin" />
            {t('assistant.runningTool', {
              defaultValue: 'Running {{name}}…',
              name: activeCall.name,
            })}
          </div>
        )}
        {running && !activeCall && (
          <div className="my-1 flex items-center gap-2 px-2 py-1.5 text-[11px] text-surface-500">
            <Loader2 size={12} className="animate-spin" />
            {round > 1
              ? t('assistant.thinkingRound', {
                  defaultValue: 'Thinking (round {{n}})…',
                  n: round,
                })
              : t('assistant.thinking', { defaultValue: 'Thinking…' })}
          </div>
        )}

        {approvals.map((a) => (
          <div
            key={a.requestId}
            className="my-2 rounded border border-amber-700/60 bg-amber-950/20 p-2"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-200">
              <ShieldQuestion size={13} />
              {t('assistant.approvalTitle', {
                defaultValue: '{{server}} wants to run {{tool}}',
                server: a.serverLabel,
                tool: a.call.name,
              })}
            </div>
            <pre className="mt-1.5 max-h-40 overflow-auto rounded bg-surface-950/70 p-1.5 text-[10px] text-surface-300">
              {prettyJson(a.call.arguments)}
            </pre>
            <div className="mt-2 flex gap-1.5">
              <button
                className="rounded bg-emerald-700 px-2 py-1 text-[11px] text-white hover:bg-emerald-600"
                onClick={() => void decide(a.requestId, 'allow-once')}
              >
                {t('assistant.allowOnce', { defaultValue: 'Allow once' })}
              </button>
              <button
                className="rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-200 hover:bg-surface-800"
                onClick={() => void decide(a.requestId, 'allow-always')}
              >
                {t('assistant.allowAlways', { defaultValue: 'Always allow this tool' })}
              </button>
              <button
                className="rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-200 hover:bg-surface-800"
                onClick={() => void decide(a.requestId, 'deny')}
              >
                {t('assistant.deny', { defaultValue: 'Deny' })}
              </button>
            </div>
          </div>
        ))}

        {assistantError && (
          <div className="my-2 flex items-start gap-1.5 rounded border border-red-800/60 bg-red-950/20 p-2 text-[11px] text-red-200">
            <AlertTriangle size={13} className="mt-0.5 flex-none" />
            <span className="whitespace-pre-wrap">{assistantError}</span>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="flex-none border-t border-surface-800 p-2">
        <div className="flex items-end gap-2">
          <textarea
            className="h-16 flex-1 resize-none rounded border border-surface-700 bg-surface-950 px-2 py-1.5 text-[12px] text-surface-100 placeholder:text-surface-600 focus:border-blue-500 focus:outline-none"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={t('assistant.placeholder', {
              defaultValue:
                'e.g. Which pages have the worst title problems, and why? (Ctrl+Enter to send)',
            })}
          />
          {running ? (
            <button
              className="flex h-8 items-center gap-1 rounded border border-surface-700 px-3 text-[11px] text-surface-200 hover:bg-surface-800"
              onClick={() => void window.freecrawl.assistantCancel()}
            >
              <Square size={12} />
              {t('assistant.stop', { defaultValue: 'Stop' })}
            </button>
          ) : (
            <button
              className="flex h-8 items-center gap-1 rounded bg-blue-700 px-3 text-[11px] text-white hover:bg-blue-600 disabled:opacity-40"
              onClick={() => void send()}
              disabled={!draft.trim()}
            >
              <Send size={12} />
              {t('assistant.send', { defaultValue: 'Send' })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBlock({
  message,
  call,
}: {
  message: AssistantMessage;
  call?: AssistantToolCall;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (message.role === 'user') {
    return (
      <div className="my-1.5 flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap rounded border border-blue-800/60 bg-blue-950/30 px-2.5 py-1.5 text-[12px] text-surface-100">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === 'tool') {
    return (
      <div className="my-1">
        <button
          className="flex w-full items-center gap-1.5 rounded border border-surface-800 bg-surface-900/40 px-2 py-1 text-left text-[10px] text-surface-400 hover:bg-surface-900"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          {message.isError ? (
            <AlertTriangle size={11} className="text-red-400" />
          ) : (
            <Check size={11} className="text-emerald-500" />
          )}
          <span className="font-mono text-surface-300">{message.toolName}</span>
          {typeof message.durationMs === 'number' && (
            <span className="text-surface-600">{message.durationMs} ms</span>
          )}
          <span className="ml-auto text-surface-600">
            {t('assistant.resultChars', {
              defaultValue: '{{n}} chars',
              n: message.content.length.toLocaleString(),
            })}
          </span>
        </button>
        {open && (
          <div className="mt-1 space-y-1">
            {call && (
              <pre className="max-h-40 overflow-auto rounded border border-surface-800 bg-surface-950 p-1.5 text-[10px] text-surface-400">
                {prettyJson(call.arguments)}
              </pre>
            )}
            <pre className="max-h-64 overflow-auto rounded border border-surface-800 bg-surface-950 p-1.5 text-[10px] text-surface-300">
              {preview(message.content)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Assistant prose (plus any tool calls it asked for).
  return (
    <div className="my-1.5">
      {message.content.trim() && (
        <div className="max-w-[85%] whitespace-pre-wrap rounded border border-surface-800 bg-surface-900/50 px-2.5 py-1.5 text-[12px] text-surface-100">
          {message.content}
        </div>
      )}
      {(message.toolCalls ?? []).length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {(message.toolCalls ?? []).map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1 rounded border border-surface-800 bg-surface-900/40 px-1.5 py-0.5 font-mono text-[10px] text-surface-400"
            >
              <Wrench size={10} />
              {c.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
