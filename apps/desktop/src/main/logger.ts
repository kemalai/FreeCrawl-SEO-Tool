import type { LogEntry, LogLevel } from '@freecrawl/shared-types';

const MAX_ENTRIES = 5000;

const buffer: LogEntry[] = [];
let seq = 0;
const subscribers = new Set<(entry: LogEntry) => void>();
let hooksInstalled = false;

export function log(level: LogLevel, source: string, message: string, extra?: unknown): LogEntry {
  const msg =
    extra !== undefined ? `${message} ${safeStringify(extra)}` : message;
  const entry: LogEntry = {
    id: ++seq,
    ts: new Date().toISOString(),
    level,
    source,
    message: msg,
  };
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) buffer.shift();
  for (const fn of subscribers) {
    try {
      fn(entry);
    } catch {
      // Never let a misbehaving subscriber break the logger.
    }
  }
  return entry;
}

export function getAll(): LogEntry[] {
  return buffer.slice();
}

export function clearAll(): void {
  buffer.length = 0;
}

export function subscribe(fn: (entry: LogEntry) => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

/**
 * Patterns that match known-benign Node warnings we've explicitly opted
 * into — logging them at ERROR would be misleading since they aren't
 * bugs. The node:sqlite case is acknowledged in CLAUDE.md as expected
 * for this stack.
 */
const BENIGN_WARNING_PATTERNS: RegExp[] = [
  /ExperimentalWarning:\s*SQLite/i,
];

function isBenignWarning(text: string): boolean {
  return BENIGN_WARNING_PATTERNS.some((re) => re.test(text));
}

/**
 * Intercept console.* and process-level crash signals so every diagnostic
 * that would normally vanish into stdout ends up in the in-app log window.
 * Safe to call multiple times (guarded by module-local flag).
 */
export function installGlobalHooks(): void {
  if (hooksInstalled) return;
  hooksInstalled = true;

  const origLog = console.log.bind(console);
  const origInfo = console.info.bind(console);
  const origWarn = console.warn.bind(console);
  const origErr = console.error.bind(console);

  console.log = (...args: unknown[]) => {
    log('info', 'console', joinArgs(args));
    origLog(...(args as []));
  };
  console.info = (...args: unknown[]) => {
    log('info', 'console', joinArgs(args));
    origInfo(...(args as []));
  };
  console.warn = (...args: unknown[]) => {
    const text = joinArgs(args);
    if (!isBenignWarning(text)) log('warn', 'console', text);
    origWarn(...(args as []));
  };
  console.error = (...args: unknown[]) => {
    const text = joinArgs(args);
    // Node's process.emitWarning output can surface on stderr-routed
    // console.error in some Electron builds. Those aren't real errors —
    // downgrade (or drop, if benign) to avoid scaring users.
    if (isBenignWarning(text)) {
      origErr(...(args as []));
      return;
    }
    const level: LogLevel = /\(node:\d+\)\s+\w*Warning:/.test(text) ? 'warn' : 'error';
    log(level, 'console', text);
    origErr(...(args as []));
  };

  // Taking a listener on 'warning' disables Node's default stderr printer,
  // so from here on every process.emitWarning() flows through us and we
  // control the level + suppression centrally.
  process.on('warning', (warning) => {
    const name = warning.name || 'Warning';
    const text = `${name}: ${warning.message}`;
    if (isBenignWarning(text)) return;
    log('warn', 'node', warning.stack ? warning.stack : text);
  });

  process.on('uncaughtException', (err) => {
    log('error', 'uncaughtException', err instanceof Error ? (err.stack ?? err.message) : String(err));
  });
  process.on('unhandledRejection', (reason) => {
    log(
      'error',
      'unhandledRejection',
      reason instanceof Error ? (reason.stack ?? reason.message) : String(reason),
    );
  });
}

function joinArgs(args: unknown[]): string {
  return args
    .map((a) => (typeof a === 'string' ? a : a instanceof Error ? (a.stack ?? a.message) : safeStringify(a)))
    .join(' ');
}

function safeStringify(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v instanceof Error) return v.stack ?? v.message;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
