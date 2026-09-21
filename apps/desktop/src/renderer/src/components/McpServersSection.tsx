import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Plug, Trash2, Unplug } from 'lucide-react';
import {
  MCP_MAX_SERVERS,
  MCP_SECRET_MASK,
  type McpServerConfig,
  type McpServerStatus,
  type McpToolInfo,
  type McpToolPolicy,
} from '@freecrawl/shared-types';

/**
 * Settings → MCP Servers.
 *
 * Registers the external MCP servers the in-app assistant may call. Two
 * transports: a local process (stdio — the common case, e.g.
 * `npx -y @modelcontextprotocol/server-github`) or a remote Streamable
 * HTTP endpoint.
 *
 * Secret handling: env values and auth headers are encrypted in the main
 * process and never sent back to the renderer, so a stored value shows as
 * the mask. Leaving the mask in place keeps the stored secret; typing over
 * it replaces it.
 */
export function McpServersSection() {
  const { t } = useTranslation();
  const [servers, setServers] = useState<McpServerConfig[]>([]);
  const [statuses, setStatuses] = useState<Record<string, McpServerStatus>>({});
  const [tools, setTools] = useState<Record<string, McpToolInfo[]>>({});
  const [policies, setPolicies] = useState<Record<string, McpToolPolicy>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const [list, statusList, policyMap] = await Promise.all([
      window.freecrawl.mcpServersList(),
      window.freecrawl.mcpServerStatuses(),
      window.freecrawl.mcpPolicyList(),
    ]);
    setServers(list);
    setStatuses(Object.fromEntries(statusList.map((s) => [s.id, s])));
    setPolicies(policyMap);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void reload().catch((e: unknown) => {
      setError(e instanceof Error ? e.message : String(e));
      setLoaded(true);
    });
  }, [reload]);

  /** Persist immediately — a half-saved server list is worse than an
   *  extra IPC round-trip, and the dialog's Save button only covers the
   *  crawl config. */
  async function persist(next: McpServerConfig[]) {
    setServers(next);
    const saved = await window.freecrawl.mcpServersSave(next);
    setServers(saved);
    const statusList = await window.freecrawl.mcpServerStatuses();
    setStatuses(Object.fromEntries(statusList.map((s) => [s.id, s])));
  }

  function update(id: string, patch: Partial<McpServerConfig>) {
    void persist(servers.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function addServer() {
    if (servers.length >= MCP_MAX_SERVERS) return;
    let n = servers.length + 1;
    while (servers.some((s) => s.id === `server-${n}`)) n++;
    void persist([
      ...servers,
      {
        id: `server-${n}`,
        label: `Server ${n}`,
        transport: 'stdio',
        command: '',
        args: [],
        env: {},
        url: '',
        headers: {},
        enabled: true,
      },
    ]);
  }

  async function connect(id: string) {
    setBusy(id);
    setError(null);
    try {
      const status = await window.freecrawl.mcpServerConnect(id);
      setStatuses((prev) => ({ ...prev, [id]: status }));
      if (status.connected) {
        const res = await window.freecrawl.mcpToolsList([id]);
        setTools((prev) => ({
          ...prev,
          [id]: res.tools.filter((tool) => tool.serverId === id),
        }));
      } else if (status.error) {
        setError(status.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function disconnect(id: string) {
    const status = await window.freecrawl.mcpServerDisconnect(id);
    setStatuses((prev) => ({ ...prev, [id]: status }));
  }

  async function setPolicy(serverId: string, tool: string, policy: McpToolPolicy) {
    await window.freecrawl.mcpPolicySet(serverId, tool, policy);
    setPolicies((prev) => {
      const next = { ...prev };
      if (policy === 'ask') delete next[`${serverId}:${tool}`];
      else next[`${serverId}:${tool}`] = policy;
      return next;
    });
  }

  return (
    <>
      <p className="mb-3 text-[11px] text-surface-400">
        {t('settings.mcp.intro', {
          defaultValue:
            'Connect external MCP servers so the Assistant tab can use their tools alongside your crawl data. Local servers run as a child process; remote ones are called over HTTP. Every tool call asks for your approval the first time.',
        })}
      </p>

      {error && (
        <div className="mb-3 rounded border border-red-800/60 bg-red-950/20 p-2 text-[11px] text-red-200">
          {error}
        </div>
      )}

      {!loaded && (
        <div className="flex items-center gap-2 text-[11px] text-surface-400">
          <Loader2 size={12} className="animate-spin" />
          {t('common.loading', { defaultValue: 'Loading…' })}
        </div>
      )}

      {loaded && servers.length === 0 && (
        <p className="mb-3 rounded border border-surface-800 bg-surface-950/40 p-3 text-[11px] text-surface-400">
          {t('settings.mcp.empty', {
            defaultValue:
              'No servers yet. A typical local server looks like: command "npx", arguments "-y" and "@modelcontextprotocol/server-filesystem", plus any API key as an environment variable.',
          })}
        </p>
      )}

      {servers.map((server) => {
        const status = statuses[server.id];
        const serverTools = tools[server.id] ?? [];
        return (
          <div
            key={server.id}
            className="mb-3 rounded border border-surface-800 bg-surface-950/40 p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={server.enabled}
                onChange={(e) => update(server.id, { enabled: e.target.checked })}
                title={t('settings.mcp.enabled', { defaultValue: 'Enabled' })}
              />
              <input
                className="h-7 flex-1 rounded border border-surface-700 bg-surface-950 px-2 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                value={server.label}
                onChange={(e) => update(server.id, { label: e.target.value })}
                placeholder={t('settings.mcp.labelPlaceholder', {
                  defaultValue: 'Display name',
                })}
              />
              <span
                className={
                  status?.connected
                    ? 'h-2 w-2 rounded-full bg-emerald-500'
                    : 'h-2 w-2 rounded-full bg-surface-600'
                }
                title={
                  status?.connected
                    ? t('settings.mcp.connected', { defaultValue: 'Connected' })
                    : t('settings.mcp.disconnected', { defaultValue: 'Not connected' })
                }
              />
              {status?.connected ? (
                <button
                  className="flex h-7 items-center gap-1 rounded border border-surface-700 px-2 text-[11px] text-surface-300 hover:bg-surface-800"
                  onClick={() => void disconnect(server.id)}
                >
                  <Unplug size={12} />
                  {t('settings.mcp.disconnect', { defaultValue: 'Disconnect' })}
                </button>
              ) : (
                <button
                  className="flex h-7 items-center gap-1 rounded border border-surface-700 px-2 text-[11px] text-surface-300 hover:bg-surface-800 disabled:opacity-40"
                  onClick={() => void connect(server.id)}
                  disabled={busy === server.id}
                >
                  {busy === server.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Plug size={12} />
                  )}
                  {t('settings.mcp.connect', { defaultValue: 'Connect' })}
                </button>
              )}
              <button
                className="flex h-7 items-center rounded border border-surface-700 px-2 text-[11px] text-red-300 hover:bg-surface-800"
                onClick={() =>
                  void persist(servers.filter((s) => s.id !== server.id))
                }
                title={t('settings.mcp.remove', { defaultValue: 'Remove server' })}
              >
                <Trash2 size={12} />
              </button>
            </div>

            <div className="mb-2 flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-wider text-surface-500">
                {t('settings.mcp.transport', { defaultValue: 'Transport' })}
              </label>
              <select
                className="h-7 rounded border border-surface-700 bg-surface-950 px-2 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                value={server.transport}
                onChange={(e) =>
                  update(server.id, {
                    transport: e.target.value === 'http' ? 'http' : 'stdio',
                  })
                }
              >
                <option value="stdio">
                  {t('settings.mcp.transportStdio', {
                    defaultValue: 'Local process (stdio)',
                  })}
                </option>
                <option value="http">
                  {t('settings.mcp.transportHttp', { defaultValue: 'Remote (HTTP)' })}
                </option>
              </select>
            </div>

            {server.transport === 'stdio' ? (
              <>
                <Field
                  label={t('settings.mcp.command', { defaultValue: 'Command' })}
                  hint={t('settings.mcp.commandHint', {
                    defaultValue:
                      'Executable name or full path. Resolved against PATH on every OS — on Windows, `npx` resolves to npx.cmd automatically.',
                  })}
                >
                  <input
                    className="h-7 w-full rounded border border-surface-700 bg-surface-950 px-2 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                    value={server.command}
                    onChange={(e) => update(server.id, { command: e.target.value })}
                    placeholder="npx"
                  />
                </Field>
                <Field
                  label={t('settings.mcp.args', { defaultValue: 'Arguments' })}
                  hint={t('settings.mcp.argsHint', {
                    defaultValue:
                      'One per line. Passed as a vector — no shell, so quotes and spaces are literal.',
                  })}
                >
                  <textarea
                    className="h-16 w-full resize-none rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
                    value={server.args.join('\n')}
                    onChange={(e) =>
                      update(server.id, {
                        args: e.target.value
                          .split('\n')
                          .map((a) => a.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder={'-y\n@modelcontextprotocol/server-github'}
                  />
                </Field>
                <Field
                  label={t('settings.mcp.env', { defaultValue: 'Environment variables' })}
                  hint={t('settings.mcp.envHint', {
                    defaultValue:
                      'KEY=value per line. Values are stored encrypted with your OS keychain and shown masked.',
                  })}
                >
                  <textarea
                    className="h-16 w-full resize-none rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
                    value={pairsToText(server.env, '=')}
                    onChange={(e) =>
                      update(server.id, { env: textToPairs(e.target.value, '=') })
                    }
                    placeholder={`GITHUB_TOKEN=${MCP_SECRET_MASK}`}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label={t('settings.mcp.url', { defaultValue: 'Endpoint URL' })}>
                  <input
                    className="h-7 w-full rounded border border-surface-700 bg-surface-950 px-2 text-[12px] text-surface-100 focus:border-blue-500 focus:outline-none"
                    value={server.url}
                    onChange={(e) => update(server.id, { url: e.target.value })}
                    placeholder="https://example.com/mcp"
                  />
                </Field>
                <Field
                  label={t('settings.mcp.headers', { defaultValue: 'Headers' })}
                  hint={t('settings.mcp.headersHint', {
                    defaultValue:
                      'Name: value per line. Stored encrypted and shown masked.',
                  })}
                >
                  <textarea
                    className="h-16 w-full resize-none rounded border border-surface-700 bg-surface-950 px-2 py-1 font-mono text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
                    value={pairsToText(server.headers, ': ')}
                    onChange={(e) =>
                      update(server.id, { headers: textToPairs(e.target.value, ':') })
                    }
                    placeholder={`Authorization: Bearer ${MCP_SECRET_MASK}`}
                  />
                </Field>
              </>
            )}

            {status?.error && (
              <p className="mt-1 text-[10px] text-red-400">{status.error}</p>
            )}
            {status?.connected && (
              <p className="mt-1 text-[10px] text-surface-500">
                {t('settings.mcp.handshake', {
                  defaultValue_one: '{{name}} {{version}} · MCP {{protocol}} · {{count}} tool',
                  defaultValue_other: '{{name}} {{version}} · MCP {{protocol}} · {{count}} tools',
                  name: status.serverName ?? server.label,
                  version: status.serverVersion ?? '',
                  protocol: status.protocolVersion ?? '',
                  count: status.toolCount,
                })}
              </p>
            )}

            {serverTools.length > 0 && (
              <div className="mt-2 rounded border border-surface-800">
                <div className="border-b border-surface-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                  {t('settings.mcp.toolPermissions', {
                    defaultValue: 'Tool permissions',
                  })}
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {serverTools.map((tool) => (
                    <div
                      key={tool.name}
                      className="flex items-center gap-2 border-b border-surface-800/60 px-2 py-1 last:border-b-0"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-[11px] text-surface-200">
                          {tool.name}
                        </span>
                        <span className="block truncate text-[10px] text-surface-500">
                          {tool.description}
                        </span>
                      </span>
                      <select
                        className="h-6 rounded border border-surface-700 bg-surface-950 px-1 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
                        value={policies[`${server.id}:${tool.name}`] ?? 'ask'}
                        onChange={(e) =>
                          void setPolicy(
                            server.id,
                            tool.name,
                            e.target.value as McpToolPolicy,
                          )
                        }
                      >
                        <option value="ask">
                          {t('settings.mcp.policyAsk', { defaultValue: 'Ask' })}
                        </option>
                        <option value="always">
                          {t('settings.mcp.policyAlways', { defaultValue: 'Always allow' })}
                        </option>
                        <option value="never">
                          {t('settings.mcp.policyNever', { defaultValue: 'Never allow' })}
                        </option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        className="flex items-center gap-1 rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-300 hover:bg-surface-800 hover:text-surface-100 disabled:opacity-40"
        onClick={addServer}
        disabled={servers.length >= MCP_MAX_SERVERS}
      >
        <Plus size={12} />
        {t('settings.mcp.add', { defaultValue: 'Add server' })}
      </button>
    </>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
        {label}
      </div>
      {hint && <p className="mb-1 text-[10px] text-surface-500">{hint}</p>}
      {children}
    </div>
  );
}

/** `{A: 'x'}` → `A=x` lines (values already masked by the main process). */
function pairsToText(rec: Record<string, string>, sep: string): string {
  return Object.entries(rec ?? {})
    .map(([k, v]) => `${k}${sep}${v}`)
    .join('\n');
}

function textToPairs(text: string, sep: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(sep);
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + sep.length).trim();
    if (key) out[key] = value;
  }
  return out;
}
