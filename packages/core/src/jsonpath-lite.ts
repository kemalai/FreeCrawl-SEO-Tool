/**
 * Minimal, dependency-free JSONPath evaluator.
 *
 * Covers the practical subset SEO/scraping users reach for when pulling
 * values out of JSON API responses — deliberately hand-rolled (no
 * `jsonpath-plus` dependency) to match the project's zero-heavy-dep
 * convention and keep the desktop bundle lean.
 *
 * Supported syntax
 * ----------------
 *   $                         root (optional leading token)
 *   .name  /  ['name']        child by key
 *   ..name                    recursive descent then child
 *   *  /  [*]  /  ..*          wildcard (all array items / object values)
 *   [0]  [-1]                 array index (negatives count from the end)
 *   [0,2,4]  ['a','b']        union of indices / names
 *   [start:end:step]          array slice (Python semantics, all optional)
 *   [?(<expr>)]               filter — keeps array items / object values
 *                             matching a boolean expression on `@`
 *
 * Filter expression grammar (`@` = the current item):
 *   @            @.a.b        @['a']['b']         (path on the current item)
 *   'str'  "str"  12  3.5  true  false  null      (literals)
 *   == != < <= > >=          (comparison, RHS is a literal or @-path)
 *   && || !  ( )             (boolean composition)
 *   a bare @-path            (existence test — true when defined)
 *
 * Anything outside this grammar throws — the caller surfaces that as a
 * per-rule error in the preview and a clean `null` during a crawl, so a
 * mistyped path never produces silently-wrong data.
 */

export class JsonPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JsonPathError';
  }
}

type Selector =
  | { kind: 'wildcard' }
  | { kind: 'name'; name: string }
  | { kind: 'names'; names: string[] }
  | { kind: 'index'; index: number }
  | { kind: 'indices'; indices: number[] }
  | { kind: 'slice'; start: number | null; end: number | null; step: number | null }
  | { kind: 'filter'; test: (item: unknown) => boolean };

interface Step {
  /** `..` recursive-descent prefix — apply the selector to this node and
   *  every descendant rather than only this node. */
  descendant: boolean;
  selector: Selector;
}

/**
 * Evaluate a JSONPath expression against an already-parsed JSON value.
 * Returns every matching value in document order. An empty array means
 * "no match" (not an error).
 */
export function evaluateJsonPath(root: unknown, path: string): unknown[] {
  const steps = parseJsonPath(path);
  let current: unknown[] = [root];
  for (const step of steps) {
    const next: unknown[] = [];
    for (const node of current) applyStep(node, step, next);
    current = next;
  }
  return current;
}

function applyStep(node: unknown, step: Step, out: unknown[]): void {
  const candidates = step.descendant ? descendantsAndSelf(node) : [node];
  for (const c of candidates) applySelector(c, step.selector, out);
}

function applySelector(node: unknown, sel: Selector, out: unknown[]): void {
  switch (sel.kind) {
    case 'wildcard':
      if (Array.isArray(node)) out.push(...node);
      else if (isObject(node)) out.push(...Object.values(node));
      return;
    case 'name':
      if (isObject(node) && Object.prototype.hasOwnProperty.call(node, sel.name)) {
        out.push((node as Record<string, unknown>)[sel.name]);
      }
      return;
    case 'names':
      if (isObject(node)) {
        for (const n of sel.names) {
          if (Object.prototype.hasOwnProperty.call(node, n)) {
            out.push((node as Record<string, unknown>)[n]);
          }
        }
      }
      return;
    case 'index':
      if (Array.isArray(node)) {
        const i = sel.index < 0 ? node.length + sel.index : sel.index;
        if (i >= 0 && i < node.length) out.push(node[i]);
      }
      return;
    case 'indices':
      if (Array.isArray(node)) {
        for (const raw of sel.indices) {
          const i = raw < 0 ? node.length + raw : raw;
          if (i >= 0 && i < node.length) out.push(node[i]);
        }
      }
      return;
    case 'slice':
      if (Array.isArray(node)) pushSlice(node, sel, out);
      return;
    case 'filter':
      if (Array.isArray(node)) {
        for (const el of node) if (safeTest(sel.test, el)) out.push(el);
      } else if (isObject(node)) {
        for (const v of Object.values(node)) if (safeTest(sel.test, v)) out.push(v);
      }
      return;
  }
}

function pushSlice(
  arr: unknown[],
  sel: { start: number | null; end: number | null; step: number | null },
  out: unknown[],
): void {
  const len = arr.length;
  const step = sel.step ?? 1;
  if (step === 0) return;
  const norm = (v: number | null, dflt: number): number => {
    if (v === null) return dflt;
    return v < 0 ? Math.max(len + v, step > 0 ? 0 : -1) : Math.min(v, step > 0 ? len : len - 1);
  };
  if (step > 0) {
    const start = norm(sel.start, 0);
    const end = norm(sel.end, len);
    for (let i = start; i < end; i += step) out.push(arr[i]);
  } else {
    const start = norm(sel.start, len - 1);
    const end = norm(sel.end, -1);
    for (let i = start; i > end; i += step) out.push(arr[i]);
  }
}

function safeTest(test: (item: unknown) => boolean, item: unknown): boolean {
  try {
    return test(item);
  } catch {
    return false;
  }
}

function descendantsAndSelf(node: unknown): unknown[] {
  const out: unknown[] = [];
  const walk = (n: unknown): void => {
    out.push(n);
    if (Array.isArray(n)) {
      for (const el of n) walk(el);
    } else if (isObject(n)) {
      for (const v of Object.values(n)) walk(v);
    }
  };
  walk(node);
  return out;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/* ------------------------------------------------------------------ */
/* Path parsing                                                        */
/* ------------------------------------------------------------------ */

function parseJsonPath(path: string): Step[] {
  const s = path.trim();
  if (!s) throw new JsonPathError('empty JSONPath expression');
  let i = s[0] === '$' ? 1 : 0;
  const steps: Step[] = [];
  let descendant = false;

  while (i < s.length) {
    const ch = s[i];
    if (ch === ' ') {
      i++;
      continue;
    }
    if (ch === '.') {
      if (s[i + 1] === '.') {
        descendant = true;
        i += 2;
        // `..` may be followed by `[` (handled below), `*`, or a name.
        if (i < s.length && s[i] !== '[') {
          if (s[i] === '*') {
            steps.push({ descendant: true, selector: { kind: 'wildcard' } });
            descendant = false;
            i++;
          } else {
            const { name, next } = readName(s, i);
            steps.push({ descendant: true, selector: { kind: 'name', name } });
            descendant = false;
            i = next;
          }
        }
        continue;
      }
      i++; // single dot
      if (s[i] === '*') {
        steps.push({ descendant, selector: { kind: 'wildcard' } });
        descendant = false;
        i++;
        continue;
      }
      const { name, next } = readName(s, i);
      steps.push({ descendant, selector: { kind: 'name', name } });
      descendant = false;
      i = next;
      continue;
    }
    if (ch === '[') {
      const close = findMatchingBracket(s, i);
      const inner = s.slice(i + 1, close).trim();
      steps.push({ descendant, selector: parseBracket(inner) });
      descendant = false;
      i = close + 1;
      continue;
    }
    if (ch === '*') {
      steps.push({ descendant, selector: { kind: 'wildcard' } });
      descendant = false;
      i++;
      continue;
    }
    // Bare leading name, e.g. `store.book` without the `$.` prefix.
    const { name, next } = readName(s, i);
    steps.push({ descendant, selector: { kind: 'name', name } });
    descendant = false;
    i = next;
  }
  return steps;
}

function readName(s: string, start: number): { name: string; next: number } {
  let i = start;
  while (i < s.length && s[i] !== '.' && s[i] !== '[' && s[i] !== ' ') i++;
  const name = s.slice(start, i);
  if (!name) throw new JsonPathError(`expected a property name at position ${start}`);
  return { name, next: i };
}

function findMatchingBracket(s: string, open: number): number {
  let depth = 0;
  let quote = '';
  for (let i = open; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === "'" || ch === '"') quote = ch;
    else if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new JsonPathError('unbalanced `[` in JSONPath expression');
}

function parseBracket(inner: string): Selector {
  if (inner === '*') return { kind: 'wildcard' };
  if (inner.startsWith('?')) {
    // `?(<expr>)` filter.
    const exprStart = inner.indexOf('(');
    if (exprStart === -1 || !inner.endsWith(')')) {
      throw new JsonPathError(`malformed filter: [${inner}]`);
    }
    const expr = inner.slice(exprStart + 1, -1);
    return { kind: 'filter', test: buildFilter(expr) };
  }
  // Quoted name(s): 'a' or 'a','b'
  if (inner.startsWith("'") || inner.startsWith('"')) {
    const names = splitTopLevel(inner, ',').map((part) => unquote(part.trim()));
    return names.length === 1 ? { kind: 'name', name: names[0]! } : { kind: 'names', names };
  }
  // Slice `start:end:step` (only when a top-level `:` is present and it's
  // not a union of names).
  if (inner.includes(':')) {
    const parts = inner.split(':');
    if (parts.length <= 3) {
      const toNum = (p: string): number | null => {
        const t = p.trim();
        if (t === '') return null;
        const n = Number(t);
        if (!Number.isInteger(n)) throw new JsonPathError(`invalid slice bound: ${t}`);
        return n;
      };
      return {
        kind: 'slice',
        start: toNum(parts[0] ?? ''),
        end: toNum(parts[1] ?? ''),
        step: parts.length === 3 ? toNum(parts[2] ?? '') : null,
      };
    }
  }
  // Index or union of indices.
  const idxParts = splitTopLevel(inner, ',').map((p) => p.trim());
  const indices = idxParts.map((p) => {
    const n = Number(p);
    if (!Number.isInteger(n)) throw new JsonPathError(`invalid array index: ${p}`);
    return n;
  });
  return indices.length === 1 ? { kind: 'index', index: indices[0]! } : { kind: 'indices', indices };
}

function unquote(s: string): string {
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1).replace(/\\(['"\\])/g, '$1');
  }
  return s;
}

function splitTopLevel(s: string, sep: string): string[] {
  const out: string[] = [];
  let buf = '';
  let quote = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (quote) {
      if (ch === '\\') {
        buf += ch + (s[i + 1] ?? '');
        i++;
        continue;
      }
      if (ch === quote) quote = '';
      buf += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === sep) {
      out.push(buf);
      buf = '';
      continue;
    }
    buf += ch;
  }
  out.push(buf);
  return out;
}

/* ------------------------------------------------------------------ */
/* Filter expression parser  (`@.a > 3 && @.b == 'x'`)                 */
/* ------------------------------------------------------------------ */

type FilterToken =
  | { t: 'path'; parts: string[] }
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'null' }
  | { t: 'op'; v: string }
  | { t: 'lparen' }
  | { t: 'rparen' };

function buildFilter(expr: string): (item: unknown) => boolean {
  const tokens = tokenizeFilter(expr);
  const parser = new FilterParser(tokens);
  const node = parser.parseOr();
  parser.expectEnd();
  return (item: unknown) => Boolean(node(item));
}

function tokenizeFilter(expr: string): FilterToken[] {
  const tokens: FilterToken[] = [];
  let i = 0;
  const isNameChar = (c: string): boolean => /[A-Za-z0-9_$-]/.test(c);
  while (i < expr.length) {
    const ch = expr[i]!;
    if (ch === ' ' || ch === '\t' || ch === '\n') {
      i++;
      continue;
    }
    if (ch === '@') {
      i++;
      const parts: string[] = [];
      // `@.a.b`, `@['a']['b']`, or bare `@`.
      while (i < expr.length) {
        if (expr[i] === '.') {
          i++;
          let name = '';
          while (i < expr.length && isNameChar(expr[i]!)) name += expr[i++];
          if (name) parts.push(name);
          else break;
        } else if (expr[i] === '[') {
          const close = expr.indexOf(']', i);
          if (close === -1) throw new JsonPathError('unterminated `[` in filter');
          parts.push(unquote(expr.slice(i + 1, close).trim()));
          i = close + 1;
        } else break;
      }
      tokens.push({ t: 'path', parts });
      continue;
    }
    if (ch === "'" || ch === '"') {
      let j = i + 1;
      let str = '';
      while (j < expr.length && expr[j] !== ch) {
        if (expr[j] === '\\') {
          str += expr[j + 1] ?? '';
          j += 2;
        } else str += expr[j++];
      }
      if (j >= expr.length) throw new JsonPathError('unterminated string literal in filter');
      tokens.push({ t: 'str', v: str });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === '-' && /[0-9.]/.test(expr[i + 1] ?? ''))) {
      let num = ch;
      i++;
      while (i < expr.length && /[0-9.eE+-]/.test(expr[i]!)) num += expr[i++];
      const v = Number(num);
      if (Number.isNaN(v)) throw new JsonPathError(`invalid number in filter: ${num}`);
      tokens.push({ t: 'num', v });
      continue;
    }
    if (ch === '(') {
      tokens.push({ t: 'lparen' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ t: 'rparen' });
      i++;
      continue;
    }
    const two = expr.slice(i, i + 2);
    if (two === '==' || two === '!=' || two === '<=' || two === '>=' || two === '&&' || two === '||') {
      tokens.push({ t: 'op', v: two });
      i += 2;
      continue;
    }
    if (ch === '<' || ch === '>' || ch === '!') {
      tokens.push({ t: 'op', v: ch });
      i++;
      continue;
    }
    // Bare identifier: true / false / null.
    if (isNameChar(ch)) {
      let word = '';
      while (i < expr.length && isNameChar(expr[i]!)) word += expr[i++];
      if (word === 'true') tokens.push({ t: 'bool', v: true });
      else if (word === 'false') tokens.push({ t: 'bool', v: false });
      else if (word === 'null') tokens.push({ t: 'null' });
      else throw new JsonPathError(`unexpected token in filter: ${word}`);
      continue;
    }
    throw new JsonPathError(`unexpected character in filter: ${ch}`);
  }
  return tokens;
}

type FilterFn = (item: unknown) => unknown;

class FilterParser {
  private pos = 0;
  constructor(private readonly tokens: FilterToken[]) {}

  private peek(): FilterToken | undefined {
    return this.tokens[this.pos];
  }
  private next(): FilterToken | undefined {
    return this.tokens[this.pos++];
  }
  expectEnd(): void {
    if (this.pos !== this.tokens.length) {
      throw new JsonPathError('trailing tokens in filter expression');
    }
  }

  parseOr(): FilterFn {
    let left = this.parseAnd();
    while (this.isOp('||')) {
      this.next();
      const right = this.parseAnd();
      const l = left;
      left = (item) => Boolean(l(item)) || Boolean(right(item));
    }
    return left;
  }

  private parseAnd(): FilterFn {
    let left = this.parseUnary();
    while (this.isOp('&&')) {
      this.next();
      const right = this.parseUnary();
      const l = left;
      left = (item) => Boolean(l(item)) && Boolean(right(item));
    }
    return left;
  }

  private parseUnary(): FilterFn {
    if (this.isOp('!')) {
      this.next();
      const operand = this.parseUnary();
      return (item) => !operand(item);
    }
    return this.parseComparison();
  }

  private parseComparison(): FilterFn {
    if (this.peek()?.t === 'lparen') {
      this.next();
      const inner = this.parseOr();
      if (this.peek()?.t !== 'rparen') throw new JsonPathError('missing `)` in filter');
      this.next();
      return inner;
    }
    const left = this.parseValue();
    const op = this.peek();
    if (op && op.t === 'op' && ['==', '!=', '<', '<=', '>', '>='].includes(op.v)) {
      this.next();
      const right = this.parseValue();
      return (item) => compare(left(item), op.v, right(item));
    }
    // No operator → existence/truthiness test.
    return (item) => left(item) !== undefined;
  }

  private parseValue(): FilterFn {
    const tok = this.next();
    if (!tok) throw new JsonPathError('unexpected end of filter expression');
    switch (tok.t) {
      case 'path':
        return (item) => resolvePath(item, tok.parts);
      case 'num':
        return () => tok.v;
      case 'str':
        return () => tok.v;
      case 'bool':
        return () => tok.v;
      case 'null':
        return () => null;
      default:
        throw new JsonPathError('expected a value in filter expression');
    }
  }

  private isOp(v: string): boolean {
    const tok = this.peek();
    return !!tok && tok.t === 'op' && tok.v === v;
  }
}

function resolvePath(item: unknown, parts: string[]): unknown {
  let cur: unknown = item;
  for (const p of parts) {
    if (isObject(cur)) cur = cur[p];
    else if (Array.isArray(cur)) {
      const n = Number(p);
      cur = Number.isInteger(n) ? cur[n < 0 ? cur.length + n : n] : undefined;
    } else return undefined;
  }
  return cur;
}

function compare(a: unknown, op: string, b: unknown): boolean {
  switch (op) {
    case '==':
      return looseEq(a, b);
    case '!=':
      return !looseEq(a, b);
    case '<':
    case '<=':
    case '>':
    case '>=': {
      if (typeof a === 'number' && typeof b === 'number') {
        return op === '<' ? a < b : op === '<=' ? a <= b : op === '>' ? a > b : a >= b;
      }
      if (typeof a === 'string' && typeof b === 'string') {
        const c = a < b ? -1 : a > b ? 1 : 0;
        return op === '<' ? c < 0 : op === '<=' ? c <= 0 : op === '>' ? c > 0 : c >= 0;
      }
      return false;
    }
    default:
      return false;
  }
}

function looseEq(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  // Number/string cross-compare so `@.id == '5'` works against numeric JSON.
  if (typeof a === 'number' && typeof b === 'string') return a === Number(b);
  if (typeof a === 'string' && typeof b === 'number') return Number(a) === b;
  return false;
}
