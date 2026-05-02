/**
 * Minimal newline-delimited JSON-RPC 2.0 server for stdio MCP transport.
 *
 * MCP's stdio transport is line-delimited JSON — one request per line on
 * stdin, one response per line on stdout. stderr is reserved for human
 * logs; writing anything non-JSON to stdout corrupts the protocol stream.
 *
 * We deliberately do NOT depend on `@modelcontextprotocol/sdk`. The
 * protocol surface we need (`initialize`, `tools/list`, `tools/call`,
 * the `initialized` notification) is small, well-specified, and stable;
 * the dep-free path keeps the install footprint minimal and avoids a
 * version-pin we'd otherwise have to chase.
 */

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number | string | null;
  method: string;
  params?: unknown;
}

export interface JsonRpcSuccess {
  jsonrpc: '2.0';
  id: number | string | null;
  result: unknown;
}

export interface JsonRpcError {
  jsonrpc: '2.0';
  id: number | string | null;
  error: { code: number; message: string; data?: unknown };
}

export type Handler = (params: unknown) => unknown | Promise<unknown>;

export class JsonRpcServer {
  private handlers = new Map<string, Handler>();
  private buffer = '';

  on(method: string, handler: Handler): void {
    this.handlers.set(method, handler);
  }

  log(...parts: unknown[]): void {
    // Always to stderr — stdout is reserved for protocol frames.
    const line = parts
      .map((p) => (typeof p === 'string' ? p : JSON.stringify(p)))
      .join(' ');
    process.stderr.write(`[freecrawl-mcp] ${line}\n`);
  }

  start(): void {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => {
      this.buffer += chunk;
      let nl: number;
      while ((nl = this.buffer.indexOf('\n')) !== -1) {
        const line = this.buffer.slice(0, nl).trim();
        this.buffer = this.buffer.slice(nl + 1);
        if (line) void this.handleLine(line);
      }
    });
    process.stdin.on('end', () => process.exit(0));
  }

  private write(msg: JsonRpcSuccess | JsonRpcError): void {
    process.stdout.write(JSON.stringify(msg) + '\n');
  }

  private async handleLine(line: string): Promise<void> {
    let req: JsonRpcRequest;
    try {
      req = JSON.parse(line) as JsonRpcRequest;
    } catch {
      this.log('parse error', line);
      return;
    }
    const id = req.id ?? null;
    const handler = this.handlers.get(req.method);
    // Notifications (no `id`) get no response, even on miss.
    const isNotification = req.id === undefined || req.id === null;
    if (!handler) {
      if (!isNotification) {
        this.write({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${req.method}` },
        });
      }
      return;
    }
    try {
      const result = await handler(req.params);
      if (!isNotification) {
        this.write({ jsonrpc: '2.0', id, result });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log('handler error', req.method, msg);
      if (!isNotification) {
        this.write({
          jsonrpc: '2.0',
          id,
          error: { code: -32000, message: msg },
        });
      }
    }
  }
}
