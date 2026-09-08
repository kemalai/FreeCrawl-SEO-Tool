/**
 * Faz 5 — in-app AI assistant: the agent loop behind the Assistant tab.
 *
 * One "send" from the renderer is one turn of:
 *
 *   model → (tool calls?) → run them → feed results back → model → …
 *
 * until the model answers in prose, the user cancels, or the round budget
 * runs out. Two families of tools are on offer:
 *
 *   - **built-ins** — read-only queries against the open project (the same
 *     primitives `apps/mcp-server` exposes). They touch nothing outside the
 *     already-open `.seoproject`, so they run without a prompt.
 *   - **MCP tools** — anything the user's registered MCP servers advertise.
 *     These reach the network, the filesystem, or a third-party account, so
 *     every call is gated: allow once, always allow (remembered per tool),
 *     or deny.
 *
 * The transcript itself lives in the renderer. The main process owns only
 * the loop, so a tab switch can't strand a half-finished tool round.
 */
import { randomUUID } from 'node:crypto';
import type { ProjectDb } from '@freecrawl/db';
import type {
  AiProvider,
  AssistantEvent,
  AssistantMessage,
  AssistantSendInput,
  AssistantSendResult,
  AssistantStopReason,
  AssistantToolCall,
  McpToolInfo,
} from '@freecrawl/shared-types';
import { runChatTurn, ChatError, type ChatTool } from './ai-chat.js';
import { resolveModel } from './ai-providers.js';
import {
  BUILTIN_SERVER_ID,
  BUILTIN_TOOL_PREFIX,
  MCP_TOOL_PREFIX,
  callTool as callMcpTool,
  labelFor,
  policyFor,
  setPolicy,
  toolsFor,
} from './mcp-client.js';
import * as logger from './logger.js';

/** Tool rounds per send. Enough for "find the issue → drill in → report",
 *  low enough that a looping model can't burn the user's token budget. */
const MAX_ROUNDS = 8;
/** An unanswered approval prompt expires rather than pinning the turn. */
const APPROVAL_TIMEOUT_MS = 10 * 60_000;
/** Built-in tool results are JSON — cap them like MCP results are capped. */
const MAX_BUILTIN_RESULT_CHARS = 24_000;

const SYSTEM_PROMPT = [
  'You are the FreeCrawl SEO assistant, embedded in a desktop SEO crawler.',
  'The user has an open project containing the results of a site crawl.',
  'Use the builtin__* tools to read that crawl before answering questions',
  'about the site — never guess numbers, look them up. Prefer',
  'builtin__get_summary and builtin__top_issues for orientation, then',
  'builtin__query_urls with a category filter to list affected pages, then',
  'builtin__get_url_detail for one page.',
  'Any mcp__* tools come from servers the user connected themselves; use them',
  'when the question needs information outside the crawl.',
  'Answer concisely, in the language the user writes in, and cite concrete',
  'URLs and counts from the tools rather than generic SEO advice.',
].join(' ');

// ── Approval plumbing ────────────────────────────────────────────────

type Decision = 'allow-once' | 'allow-always' | 'deny';

interface PendingApproval {
  resolve: (decision: Decision) => void;
  timer: NodeJS.Timeout;
}

const pendingApprovals = new Map<string, PendingApproval>();

/** Called from the IPC handler when the user answers an approval card. */
export function resolveApproval(requestId: string, decision: Decision): boolean {
  const pending = pendingApprovals.get(requestId);
  if (!pending) return false;
  pendingApprovals.delete(requestId);
  clearTimeout(pending.timer);
  pending.resolve(decision);
  return true;
}

// ── Cancellation ─────────────────────────────────────────────────────

const activeRuns = new Map<number, AbortController>();

/** Abort the in-flight turn owned by one window. */
export function cancelAssistant(runKey: number): void {
  activeRuns.get(runKey)?.abort();
}

// ── Built-in project tools ───────────────────────────────────────────

interface BuiltinTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  run: (args: Record<string, unknown>, db: ProjectDb) => unknown;
}

/** Columns returned by `query_urls` when the model doesn't ask for a set —
 *  wide enough to reason about, narrow enough not to flood the context. */
const COMMON_URL_FIELDS = [
  'id',
  'url',
  'statusCode',
  'indexability',
  'indexabilityStatus',
  'title',
  'metaDescription',
  'h1',
  'canonical',
  'wordCount',
  'depth',
  'inlinks',
  'outlinks',
];

const BUILTIN_TOOLS: BuiltinTool[] = [
  {
    name: 'get_summary',
    description:
      'Headline numbers for the open crawl: URLs crawled, indexable vs non-indexable, status-code distribution, average response time, start/end time. Call this first when asked about the site overall.',
    parameters: { type: 'object', properties: {} },
    run: (_args, db) => db.getSummary(),
  },
  {
    name: 'top_issues',
    description:
      'Ranked list of non-empty SEO issue categories in the open crawl, biggest first. Use it to answer "what is wrong with this site?" before drilling into a category.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 100, description: 'Max categories (default 20).' },
      },
    },
    run: (args, db) => {
      const limit = clamp(args['limit'], 1, 100, 20);
      const counts = db.getOverviewCounts() as unknown as Record<string, unknown>;
      const issues = (counts['issues'] as Record<string, number>) ?? {};
      const ranked = Object.entries(issues)
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([category, count]) => ({ category: `issues:${category}`, count }));
      return { issues: ranked };
    },
  },
  {
    name: 'get_overview_counts',
    description:
      'Every category and issue filter the sidebar shows, with row counts. Useful to discover the exact category string to pass to query_urls.',
    parameters: { type: 'object', properties: {} },
    run: (_args, db) => db.getOverviewCounts(),
  },
  {
    name: 'query_urls',
    description:
      'Paginated query over the crawled URLs, using the same category filters as the UI (e.g. "all", "internal:html", "status:4xx", "issues:title-missing"). Returns rows plus a total count.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Category filter. Default "all".' },
        search: { type: 'string', description: 'Substring match on URL and title.' },
        limit: { type: 'integer', minimum: 1, maximum: 200, description: 'Rows to return (default 25).' },
        offset: { type: 'integer', minimum: 0, description: 'Row offset for paging.' },
        sortBy: { type: 'string', description: 'Column to sort by, e.g. "depth" or "inlinks".' },
        sortDir: { type: 'string', enum: ['asc', 'desc'] },
      },
    },
    run: (args, db) => {
      const limit = clamp(args['limit'], 1, 200, 25);
      const offset = clamp(args['offset'], 0, 1_000_000, 0);
      const { rows, total } = db.queryUrls({
        category: (typeof args['category'] === 'string'
          ? args['category']
          : 'all') as Parameters<ProjectDb['queryUrls']>[0]['category'],
        search: typeof args['search'] === 'string' ? args['search'] : undefined,
        limit,
        offset,
        sortBy: typeof args['sortBy'] === 'string' ? args['sortBy'] : undefined,
        sortDir: args['sortDir'] === 'desc' ? 'desc' : 'asc',
      });
      const projected = rows.map((r) => {
        const row = r as unknown as Record<string, unknown>;
        const out: Record<string, unknown> = {};
        for (const key of COMMON_URL_FIELDS) out[key] = row[key];
        return out;
      });
      return { rows: projected, total, limit, offset };
    },
  },
  {
    name: 'get_url_detail',
    description:
      'Everything stored about one crawled URL — all columns plus inlinks, outlinks, images and HTTP headers. Pass `id` from query_urls, or the exact `url`.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'URL id from query_urls (preferred).' },
        url: { type: 'string', description: 'Exact URL string.' },
        linkLimit: { type: 'integer', minimum: 1, maximum: 500, description: 'Cap on links returned (default 50).' },
      },
    },
    run: (args, db) => {
      let id: number | null = null;
      if (typeof args['id'] === 'number') id = args['id'];
      else if (typeof args['url'] === 'string') id = db.getUrlIdByUrl(args['url']);
      if (id === null) {
        throw new Error('get_url_detail needs an `id` from query_urls, or a `url` that exists in this crawl.');
      }
      const detail = db.getUrlDetail(id, clamp(args['linkLimit'], 1, 500, 50));
      if (!detail) throw new Error(`URL id ${id} is not in this project.`);
      return detail;
    },
  },
];

function clamp(raw: unknown, min: number, max: number, fallback: number): number {
  const v = typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback;
  return Math.max(min, Math.min(max, Math.floor(v)));
}

/** Tool catalogue the renderer's picker shows, without connecting. */
export function builtinToolInfos(): McpToolInfo[] {
  return BUILTIN_TOOLS.map((t) => ({
    serverId: BUILTIN_SERVER_ID,
    name: t.name,
    qualifiedName: `${BUILTIN_TOOL_PREFIX}${t.name}`,
    description: t.description,
    inputSchema: t.parameters,
  }));
}

// ── The turn ─────────────────────────────────────────────────────────

export interface AssistantRunContext {
  /** Resolver for the calling window's project DB. */
  db: () => ProjectDb;
  /** Push a live event to the calling window. */
  emit: (event: AssistantEvent) => void;
  /** Identifies the window, so Cancel hits the right run. */
  runKey: number;
}

export async function runAssistantTurn(
  input: AssistantSendInput,
  ctx: AssistantRunContext,
): Promise<AssistantSendResult> {
  const provider: AiProvider = input.provider;
  const model = resolveModel(provider, input.model);
  const includeBuiltins = input.includeBuiltins !== false;

  // One controller per window: a second send while one is running replaces
  // the first rather than racing it.
  activeRuns.get(ctx.runKey)?.abort();
  const controller = new AbortController();
  activeRuns.set(ctx.runKey, controller);

  /** Approval ids this turn created — a cancel must only deny its own. */
  const ownApprovals = new Set<string>();
  const transcript: AssistantMessage[] = [...input.messages];
  const produced: AssistantMessage[] = [];
  let tokensIn = 0;
  let tokensOut = 0;
  let stopReason: AssistantStopReason = 'done';
  let error: string | null = null;

  try {
    const { tools: mcpTools, errors } = await toolsFor(input.serverIds ?? []);
    for (const e of errors) {
      ctx.emit({
        type: 'error',
        message: `${labelFor(e.id)}: ${e.message}`,
      });
    }
    const catalogue: ChatTool[] = [
      ...(includeBuiltins
        ? BUILTIN_TOOLS.map((t) => ({
            name: `${BUILTIN_TOOL_PREFIX}${t.name}`,
            description: t.description,
            parameters: t.parameters,
          }))
        : []),
      ...mcpTools.map((t) => ({
        name: t.qualifiedName,
        description: t.description || `${t.name} (from ${labelFor(t.serverId)})`,
        parameters: t.inputSchema,
      })),
    ];

    for (let round = 0; round < MAX_ROUNDS; round++) {
      if (controller.signal.aborted) {
        stopReason = 'cancelled';
        break;
      }
      ctx.emit({ type: 'thinking', round: round + 1 });
      const turn = await runChatTurn(
        provider,
        model,
        SYSTEM_PROMPT,
        transcript,
        catalogue,
        controller.signal,
      );
      tokensIn += turn.tokensIn ?? 0;
      tokensOut += turn.tokensOut ?? 0;

      const assistantMessage: AssistantMessage = {
        role: 'assistant',
        content: turn.text,
        ...(turn.toolCalls.length ? { toolCalls: turn.toolCalls } : {}),
      };
      transcript.push(assistantMessage);
      produced.push(assistantMessage);
      ctx.emit({
        type: 'assistant-text',
        text: turn.text,
        toolCalls: turn.toolCalls,
      });

      if (!turn.toolCalls.length) {
        stopReason = 'done';
        break;
      }

      for (const call of turn.toolCalls) {
        if (controller.signal.aborted) {
          stopReason = 'cancelled';
          break;
        }
        const result = await executeCall(
          call,
          ctx,
          mcpTools,
          includeBuiltins,
          ownApprovals,
        );
        const toolMessage: AssistantMessage = {
          role: 'tool',
          content: result.text,
          toolCallId: call.id,
          toolName: call.name,
          ...(result.isError ? { isError: true } : {}),
          durationMs: result.durationMs,
        };
        transcript.push(toolMessage);
        produced.push(toolMessage);
        ctx.emit({
          type: 'tool-result',
          callId: call.id,
          name: call.name,
          result: result.text,
          isError: result.isError,
          durationMs: result.durationMs,
        });
      }
      if (stopReason === 'cancelled') break;
      if (round === MAX_ROUNDS - 1) stopReason = 'max-rounds';
    }
  } catch (err) {
    if (controller.signal.aborted) {
      stopReason = 'cancelled';
    } else {
      stopReason = 'error';
      error =
        err instanceof ChatError || err instanceof Error
          ? err.message
          : String(err);
      logger.log('warn', 'assistant', `Assistant turn failed: ${error}`);
      ctx.emit({ type: 'error', message: error });
    }
  } finally {
    if (activeRuns.get(ctx.runKey) === controller) activeRuns.delete(ctx.runKey);
    // A cancelled turn must not leave its own approval card waiting for
    // the ten-minute timeout — but another window's turn may be running,
    // so only this run's requests are answered.
    if (controller.signal.aborted) {
      for (const id of ownApprovals) {
        const pending = pendingApprovals.get(id);
        if (!pending) continue;
        clearTimeout(pending.timer);
        pending.resolve('deny');
        pendingApprovals.delete(id);
      }
    }
  }

  return {
    messages: produced,
    stopReason,
    error,
    tokensIn: tokensIn || null,
    tokensOut: tokensOut || null,
    model,
  };
}

interface ToolOutcome {
  text: string;
  isError: boolean;
  durationMs: number;
}

async function executeCall(
  call: AssistantToolCall,
  ctx: AssistantRunContext,
  mcpTools: McpToolInfo[],
  includeBuiltins: boolean,
  ownApprovals: Set<string>,
): Promise<ToolOutcome> {
  const started = Date.now();
  const fail = (message: string): ToolOutcome => ({
    text: `Error: ${message}`,
    isError: true,
    durationMs: Date.now() - started,
  });

  // Built-in: read-only against the already-open project, so no prompt.
  if (call.name.startsWith(BUILTIN_TOOL_PREFIX)) {
    if (!includeBuiltins) return fail('FreeCrawl project tools are disabled for this chat.');
    const tool = BUILTIN_TOOLS.find(
      (t) => `${BUILTIN_TOOL_PREFIX}${t.name}` === call.name,
    );
    if (!tool) return fail(`Unknown FreeCrawl tool "${call.name}".`);
    ctx.emit({ type: 'tool-start', call });
    try {
      const value = tool.run(call.arguments ?? {}, ctx.db());
      const json = JSON.stringify(value ?? null);
      const text =
        json.length > MAX_BUILTIN_RESULT_CHARS
          ? `${json.slice(0, MAX_BUILTIN_RESULT_CHARS)}\n… [truncated ${json.length - MAX_BUILTIN_RESULT_CHARS} characters — narrow the query with limit/offset]`
          : json;
      return { text, isError: false, durationMs: Date.now() - started };
    } catch (err) {
      return fail((err as Error).message);
    }
  }

  // MCP: find which server owns this qualified name.
  const owner = mcpTools.find((t) => t.qualifiedName === call.name);
  if (!owner) {
    return fail(
      `Tool "${call.name}" is not available — its server may be disconnected.`,
    );
  }

  const decision = await approveIfNeeded(call, owner, ctx, ownApprovals);
  if (decision === 'deny') {
    return {
      text: 'The user denied this tool call. Do not retry it; continue with what you have or ask them what to do instead.',
      isError: true,
      durationMs: Date.now() - started,
    };
  }

  ctx.emit({ type: 'tool-start', call });
  try {
    const res = await callMcpTool(owner.serverId, owner.name, call.arguments ?? {});
    return {
      text: res.text,
      isError: res.isError,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    return fail((err as Error).message);
  }
}

async function approveIfNeeded(
  call: AssistantToolCall,
  owner: McpToolInfo,
  ctx: AssistantRunContext,
  ownApprovals: Set<string>,
): Promise<Decision> {
  const policy = policyFor(owner.serverId, owner.name);
  if (policy === 'always') return 'allow-once';
  if (policy === 'never') return 'deny';

  const requestId = randomUUID();
  ownApprovals.add(requestId);
  const decision = await new Promise<Decision>((resolve) => {
    const timer = setTimeout(() => {
      pendingApprovals.delete(requestId);
      resolve('deny');
    }, APPROVAL_TIMEOUT_MS);
    pendingApprovals.set(requestId, { resolve, timer });
    ctx.emit({
      type: 'tool-approval',
      requestId,
      call,
      serverId: owner.serverId,
      serverLabel: labelFor(owner.serverId),
    });
  });

  ownApprovals.delete(requestId);
  if (decision === 'allow-always') setPolicy(owner.serverId, owner.name, 'always');
  return decision;
}

/** Exported for the tool-picker UI: is this a namespaced MCP tool? */
export function isMcpToolName(name: string): boolean {
  return name.startsWith(MCP_TOOL_PREFIX);
}
