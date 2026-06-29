/**
 * Minimal, dependency-free XPath 1.0 subset evaluated directly over the
 * cheerio / domhandler tree that the crawler already builds.
 *
 * Hand-rolled rather than pulling in `xpath` + `@xmldom/xmldom` (strict
 * XML, chokes on real-world HTML) or `fontoxpath` (heavy) — cheerio gives
 * us lenient HTML parsing for free, so we only implement the location-path
 * navigation and predicate semantics on top of it. Matches the project's
 * "hand-rolled, no heavy dep" convention.
 *
 * Supported syntax
 * ----------------
 *   /step  //step                absolute child / descendant axis
 *   //div   //*                  element name test / wildcard
 *   a/b//c                       chained child + descendant steps
 *   ..   parent::x               parent axis (abbreviated + explicit)
 *   ancestor::x  ancestor-or-self::x   upward traversal cheerio CSS can't do
 *   following-sibling::x  preceding-sibling::x   sibling axes
 *   self::x   .                  self axis
 *   attribute::x                 == @x
 *   .../@attr   .../@*           attribute terminal (reads attribute values)
 *   .../text()                   direct text-node terminal
 *   [n]  [last()]  [last()-1]    positional predicates (per-parent, like XPath)
 *   [@attr]                      attribute existence
 *   [@attr='v']  [@attr!='v']    attribute comparison ( = != < <= > >= )
 *   [contains(@class,'x')]       substring test
 *   [starts-with(@href,'/a')]    prefix test
 *   [text()='x']  [.='x']        text comparison
 *   [normalize-space()='x']      whitespace-collapsed text comparison
 *   [child]  [.//desc]  [a/@x]   relative-path existence / value
 *   [not(...)]  [a and b]  [a or b]   boolean composition
 *
 * Anything outside this subset throws an {@link XPathError}; callers turn
 * that into a clean per-rule error (preview) or `null` (crawl) so a
 * mistyped expression never yields silently-wrong data.
 */

import { isTag, isText, type AnyNode, type Element } from 'domhandler';
import type { CheerioAPI } from 'cheerio';

export class XPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'XPathError';
  }
}

export type XPathResult =
  | { kind: 'nodes'; nodes: Element[] }
  | { kind: 'values'; values: string[] };

type NodeTest =
  | { kind: 'name'; name: string }
  | { kind: 'wildcard' }
  | { kind: 'node' }
  | { kind: 'text' }
  | { kind: 'attr'; name: string };

// A node-set is `Element[]`; an attribute / text() value-set is `string[]`.
// They're discriminated at runtime by element typeof in the coercion helpers.
type XVal = string | number | boolean | Element[] | string[] | undefined;

interface PredEnv {
  $: CheerioAPI;
  node: Element;
  position: number;
  last: number;
}

type PredFn = (env: PredEnv) => XVal;

/** Axis a step navigates. `child` / `descendant` are the abbreviated `/`
 *  and `//` defaults; the rest are explicit `axis::` forms. */
type Axis =
  | 'child'
  | 'descendant'
  | 'descendant-or-self'
  | 'parent'
  | 'ancestor'
  | 'ancestor-or-self'
  | 'self'
  | 'following-sibling'
  | 'preceding-sibling';

/** The axis implied purely by the step separator (`/` vs `//`). An explicit
 *  `axis::` prefix or `..` / `.` abbreviation overrides it. */
type SepAxis = 'child' | 'descendant';

const KNOWN_AXES = new Set<string>([
  'child',
  'descendant',
  'descendant-or-self',
  'parent',
  'ancestor',
  'ancestor-or-self',
  'self',
  'following-sibling',
  'preceding-sibling',
]);

interface PathStep {
  axis: Axis;
  nodeTest: NodeTest;
  predicates: PredFn[];
}

/**
 * Evaluate an XPath location path against a loaded cheerio document.
 */
export function evaluateXPath($: CheerioAPI, expr: string): XPathResult {
  const trimmed = expr.trim();
  if (!trimmed) throw new XPathError('empty XPath expression');
  const { steps } = parsePath(trimmed);
  return runPath($, [rootNode($)], steps);
}

function runPath($: CheerioAPI, ctx: AnyNode[], steps: PathStep[]): XPathResult {
  let current: AnyNode[] = ctx;
  for (let s = 0; s < steps.length; s++) {
    const step = steps[s]!;
    if (step.nodeTest.kind === 'attr' || step.nodeTest.kind === 'text') {
      if (s !== steps.length - 1) {
        throw new XPathError('@attribute / text() node test must be the last step');
      }
      return { kind: 'values', values: extractTerminal(current, step.nodeTest) };
    }
    current = evalElementStep($, current, step);
  }
  return { kind: 'nodes', nodes: current.filter(isTag) };
}

function rootNode($: CheerioAPI): AnyNode {
  const r = $.root()[0];
  if (!r) throw new XPathError('document has no root node');
  return r as AnyNode;
}

/* ------------------------------------------------------------------ */
/* Step evaluation                                                     */
/* ------------------------------------------------------------------ */

function evalElementStep($: CheerioAPI, ctxNodes: AnyNode[], step: PathStep): Element[] {
  // Gather candidates in document order: the descendant axis walks the
  // whole subtree, the child axis just the immediate children. Predicates
  // are applied afterwards with per-parent positional semantics.
  const seen = new Set<AnyNode>();
  const cand: Element[] = [];
  for (const ctx of ctxNodes) {
    const pool = axisPool(ctx, step.axis);
    for (const el of pool) {
      if (matchNodeTest(el, step.nodeTest) && !seen.has(el)) {
        seen.add(el);
        cand.push(el);
      }
    }
  }
  return applyPredicates($, cand, step.predicates);
}

/** Candidate elements reachable from `ctx` along `axis`, in the order XPath
 *  predicates expect (reverse axes return nearest-first). Note: positional
 *  predicates on reverse / sibling axes are evaluated per-parent in
 *  {@link applyPredicates}, which is exact for the common single-context
 *  case and a documented approximation for multi-context node-sets. */
function axisPool(ctx: AnyNode, axis: Axis): Element[] {
  switch (axis) {
    case 'child':
      return elementChildren(ctx);
    case 'descendant':
      return descendantElements(ctx);
    case 'descendant-or-self':
      return isTag(ctx) ? [ctx, ...descendantElements(ctx)] : descendantElements(ctx);
    case 'parent': {
      const p = parentElement(ctx);
      return p ? [p] : [];
    }
    case 'ancestor':
      return ancestorElements(ctx);
    case 'ancestor-or-self':
      return isTag(ctx) ? [ctx, ...ancestorElements(ctx)] : ancestorElements(ctx);
    case 'self':
      return isTag(ctx) ? [ctx] : [];
    case 'following-sibling':
      return followingSiblings(ctx);
    case 'preceding-sibling':
      return precedingSiblings(ctx);
    default:
      return [];
  }
}

function applyPredicates($: CheerioAPI, cand: Element[], predicates: PredFn[]): Element[] {
  let list = cand;
  for (const pred of predicates) {
    // XPath position() is relative to the context node — i.e. per parent —
    // and recomputed after each predicate. Group the current (document-
    // ordered) list by parent, evaluate within each group, then filter the
    // flat list so document order is preserved.
    const groups = new Map<AnyNode | null, Element[]>();
    for (const node of list) {
      const parent = (node.parent as AnyNode | null) ?? null;
      const g = groups.get(parent);
      if (g) g.push(node);
      else groups.set(parent, [node]);
    }
    const survivors = new Set<Element>();
    for (const group of groups.values()) {
      const last = group.length;
      group.forEach((node, idx) => {
        const v = pred({ $, node, position: idx + 1, last });
        const keep = typeof v === 'number' ? idx + 1 === v : toBoolean(v);
        if (keep) survivors.add(node);
      });
    }
    list = list.filter((n) => survivors.has(n));
  }
  return list;
}

function matchNodeTest(node: Element, test: NodeTest): boolean {
  switch (test.kind) {
    case 'wildcard':
    case 'node':
      return true;
    case 'name':
      return (node.name ?? '').toLowerCase() === test.name.toLowerCase();
    default:
      return false;
  }
}

function extractTerminal(ctxNodes: AnyNode[], test: NodeTest): string[] {
  const vals: string[] = [];
  for (const n of ctxNodes) {
    if (!isTag(n)) continue;
    if (test.kind === 'attr') {
      if (test.name === '*') {
        for (const v of Object.values(n.attribs ?? {})) vals.push(v);
      } else {
        const v = n.attribs?.[test.name];
        if (v !== undefined) vals.push(v);
      }
    } else if (test.kind === 'text') {
      const txt = directText(n);
      if (txt) vals.push(txt);
    }
  }
  return vals;
}

/* ------------------------------------------------------------------ */
/* DOM helpers                                                         */
/* ------------------------------------------------------------------ */

function elementChildren(node: AnyNode): Element[] {
  const kids = (node as { children?: AnyNode[] }).children ?? [];
  return kids.filter(isTag);
}

function parentOf(node: AnyNode): AnyNode | null {
  return (node as { parent?: AnyNode | null }).parent ?? null;
}

/** Immediate parent element (skips the document root / non-element parents). */
function parentElement(node: AnyNode): Element | null {
  const p = parentOf(node);
  return p && isTag(p) ? p : null;
}

/** Ancestor elements, nearest-first (XPath reverse document order). */
function ancestorElements(node: AnyNode): Element[] {
  const out: Element[] = [];
  let p = parentOf(node);
  while (p) {
    if (isTag(p)) out.push(p);
    p = parentOf(p);
  }
  return out;
}

/** Sibling elements after `node` among its parent's element children, in
 *  document order. */
function followingSiblings(node: AnyNode): Element[] {
  const parent = parentOf(node);
  if (!parent) return [];
  const sibs = elementChildren(parent);
  const idx = sibs.indexOf(node as Element);
  return idx < 0 ? [] : sibs.slice(idx + 1);
}

/** Sibling elements before `node`, nearest-first (XPath reverse order). */
function precedingSiblings(node: AnyNode): Element[] {
  const parent = parentOf(node);
  if (!parent) return [];
  const sibs = elementChildren(parent);
  const idx = sibs.indexOf(node as Element);
  return idx <= 0 ? [] : sibs.slice(0, idx).reverse();
}

/** All descendant elements of `node` in document order (pre-order DFS),
 *  excluding `node` itself. */
function descendantElements(node: AnyNode): Element[] {
  const out: Element[] = [];
  const visit = (n: AnyNode): void => {
    for (const c of elementChildren(n)) {
      out.push(c);
      visit(c);
    }
  };
  visit(node);
  return out;
}

function directText(node: Element): string {
  const kids = (node.children ?? []).filter(isText).map((t) => t.data);
  return normalize(kids.join(''));
}

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/* ------------------------------------------------------------------ */
/* Path parsing                                                        */
/* ------------------------------------------------------------------ */

function parsePath(expr: string): { steps: PathStep[]; fromRoot: boolean } {
  // Split into raw step strings, tracking the axis ('/' child, '//'
  // descendant) that precedes each step. A leading '//' or relative path
  // starts on the descendant / child axis respectively.
  let i = 0;
  let fromRoot = false;
  let nextAxis: 'child' | 'descendant';
  if (expr.startsWith('//')) {
    nextAxis = 'descendant';
    fromRoot = true;
    i = 2;
  } else if (expr.startsWith('/')) {
    nextAxis = 'child';
    fromRoot = true;
    i = 1;
  } else {
    nextAxis = 'child';
  }

  const steps: PathStep[] = [];
  while (i < expr.length) {
    const { raw, next } = readStepRaw(expr, i);
    i = next;
    if (raw) steps.push(parseStep(raw, nextAxis));
    // Determine the axis for the following step from the separator.
    if (i < expr.length) {
      if (expr.startsWith('//', i)) {
        nextAxis = 'descendant';
        i += 2;
      } else if (expr[i] === '/') {
        nextAxis = 'child';
        i += 1;
      } else {
        throw new XPathError(`unexpected character '${expr[i]}' in XPath at ${i}`);
      }
    }
  }
  if (steps.length === 0) throw new XPathError('XPath expression has no steps');
  return { steps, fromRoot };
}

/** Read one step substring (node test + predicates), respecting brackets
 *  and quotes so a '/' inside a predicate doesn't split the step. */
function readStepRaw(expr: string, start: number): { raw: string; next: number } {
  let depth = 0;
  let quote = '';
  let i = start;
  for (; i < expr.length; i++) {
    const ch = expr[i]!;
    if (quote) {
      if (ch === quote) quote = '';
      continue;
    }
    if (ch === "'" || ch === '"') quote = ch;
    else if (ch === '[') depth++;
    else if (ch === ']') depth--;
    else if (ch === '/' && depth === 0) break;
  }
  return { raw: expr.slice(start, i).trim(), next: i };
}

function parseStep(raw: string, axis: SepAxis): PathStep {
  // Node test ends at the first top-level '['.
  let testEnd = raw.length;
  let depth = 0;
  let quote = '';
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]!;
    if (quote) {
      if (ch === quote) quote = '';
      continue;
    }
    if (ch === "'" || ch === '"') quote = ch;
    else if (ch === '[') {
      if (depth === 0) {
        testEnd = i;
        break;
      }
      depth++;
    }
  }
  const testStr = raw.slice(0, testEnd).trim();
  const { axis: resolvedAxis, nodeTest } = parseAxisAndTest(testStr, axis);
  const predicates: PredFn[] = [];
  let i = testEnd;
  while (i < raw.length) {
    if (raw[i] === '[') {
      const close = matchBracket(raw, i);
      predicates.push(compilePredicate(raw.slice(i + 1, close).trim()));
      i = close + 1;
    } else if (raw[i] === ' ') {
      i++;
    } else {
      throw new XPathError(`unexpected '${raw[i]}' after node test in '${raw}'`);
    }
  }
  return { axis: resolvedAxis, nodeTest, predicates };
}

/** Resolve an explicit `axis::test`, the `..` / `.` abbreviations, or a bare
 *  node test evaluated against the separator-implied default axis. */
function parseAxisAndTest(
  testStr: string,
  defaultAxis: SepAxis,
): { axis: Axis; nodeTest: NodeTest } {
  if (testStr === '..') return { axis: 'parent', nodeTest: { kind: 'node' } };
  if (testStr === '.') return { axis: 'self', nodeTest: { kind: 'node' } };
  const m = /^([A-Za-z][\w-]*)::(.*)$/.exec(testStr);
  if (m) {
    const axisName = m[1]!;
    const rest = m[2]!.trim();
    if (axisName === 'attribute') {
      // attribute::x is the long form of @x — an attribute terminal.
      return { axis: defaultAxis, nodeTest: parseNodeTest('@' + rest) };
    }
    if (!KNOWN_AXES.has(axisName)) {
      throw new XPathError(`unsupported axis: ${axisName}::`);
    }
    return { axis: axisName as Axis, nodeTest: parseNodeTest(rest) };
  }
  return { axis: defaultAxis, nodeTest: parseNodeTest(testStr) };
}

function parseNodeTest(s: string): NodeTest {
  if (s === '*') return { kind: 'wildcard' };
  if (s === 'node()') return { kind: 'node' };
  if (s === 'text()') return { kind: 'text' };
  if (s.startsWith('@')) return { kind: 'attr', name: s.slice(1) };
  if (/^[A-Za-z_][\w\-:]*$/.test(s)) return { kind: 'name', name: s };
  throw new XPathError(`unsupported node test: '${s}'`);
}

function matchBracket(s: string, open: number): number {
  let depth = 0;
  let quote = '';
  for (let i = open; i < s.length; i++) {
    const ch = s[i]!;
    if (quote) {
      if (ch === quote) quote = '';
      continue;
    }
    if (ch === "'" || ch === '"') quote = ch;
    else if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new XPathError('unbalanced `[` in XPath predicate');
}

/* ------------------------------------------------------------------ */
/* Predicate compilation                                               */
/* ------------------------------------------------------------------ */

function compilePredicate(src: string): PredFn {
  const parser = new PredParser(src);
  const fn = parser.parseOr();
  parser.expectEnd();
  return fn;
}

const PATH_CHARS = /[A-Za-z0-9_\-:@*./]/;

class PredParser {
  private p = 0;
  constructor(private readonly s: string) {}

  expectEnd(): void {
    this.ws();
    if (this.p !== this.s.length) {
      throw new XPathError(`trailing tokens in predicate near '${this.s.slice(this.p)}'`);
    }
  }

  parseOr(): PredFn {
    let left = this.parseAnd();
    while (this.matchWord('or')) {
      const right = this.parseAnd();
      const l = left;
      left = (env) => toBoolean(l(env)) || toBoolean(right(env));
    }
    return left;
  }

  private parseAnd(): PredFn {
    let left = this.parseComparison();
    while (this.matchWord('and')) {
      const right = this.parseComparison();
      const l = left;
      left = (env) => toBoolean(l(env)) && toBoolean(right(env));
    }
    return left;
  }

  private parseComparison(): PredFn {
    const left = this.parseAdditive();
    this.ws();
    const op = this.readCompareOp();
    if (!op) return left.fn;
    const right = this.parseAdditive();
    const l = left.fn;
    const r = right.fn;
    return (env) => compareVals(l(env), op, r(env));
  }

  private parseAdditive(): { fn: PredFn } {
    let left = this.parseUnary();
    for (;;) {
      this.ws();
      const ch = this.s[this.p];
      if (ch === '+' || ch === '-') {
        this.p++;
        const right = this.parseUnary();
        const l = left.fn;
        const r = right.fn;
        const op = ch;
        left = {
          fn: (env) => {
            const a = toNumber(l(env));
            const b = toNumber(r(env));
            return op === '+' ? a + b : a - b;
          },
        };
      } else break;
    }
    return left;
  }

  private parseUnary(): { fn: PredFn } {
    this.ws();
    if (this.s[this.p] === '-') {
      this.p++;
      const operand = this.parseUnary();
      const f = operand.fn;
      return { fn: (env) => -toNumber(f(env)) };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): { fn: PredFn } {
    this.ws();
    const ch = this.s[this.p];
    if (ch === undefined) throw new XPathError('unexpected end of predicate');
    if (ch === '(') {
      this.p++;
      const inner = this.parseOr();
      this.ws();
      if (this.s[this.p] !== ')') throw new XPathError('missing `)` in predicate');
      this.p++;
      return { fn: inner };
    }
    if (ch === "'" || ch === '"') {
      const str = this.readString();
      return { fn: () => str };
    }
    if (/[0-9]/.test(ch)) {
      const num = this.readNumber();
      return { fn: () => num };
    }
    // Function call?  name '(' ...
    const fnName = this.peekFunctionName();
    if (fnName) return { fn: this.parseFunction(fnName) };
    // Relative location path / attribute term.
    if (PATH_CHARS.test(ch)) return this.parsePathTerm();
    throw new XPathError(`unexpected character '${ch}' in predicate`);
  }

  /** A path term carries both a value (string-value of the node-set) and
   *  an existence test, so `[@a]` means "has @a" while `[@a='x']` compares
   *  its value. */
  private parsePathTerm(): { fn: PredFn } {
    const start = this.p;
    while (this.p < this.s.length && PATH_CHARS.test(this.s[this.p]!)) this.p++;
    const pathStr = this.s.slice(start, this.p);
    if (this.s[this.p] === '[') {
      throw new XPathError('nested predicates inside a predicate are not supported');
    }
    const fn: PredFn = (env) => {
      const res = evalRelPath(env.$, env.node, pathStr);
      // Bare path term → existence; used as a value only inside a
      // comparison, where compareVals coerces via stringValue.
      return res.kind === 'nodes' ? res.nodes : res.values;
    };
    return { fn };
  }

  private parseFunction(name: string): PredFn {
    // Consume name + '('.
    this.p += name.length;
    this.ws();
    this.p++; // '('
    const args: PredFn[] = [];
    this.ws();
    if (this.s[this.p] !== ')') {
      for (;;) {
        args.push(this.parseOr());
        this.ws();
        if (this.s[this.p] === ',') {
          this.p++;
          continue;
        }
        break;
      }
    }
    this.ws();
    if (this.s[this.p] !== ')') throw new XPathError(`missing ) in ${name}()`);
    this.p++;

    switch (name) {
      case 'text':
        return (env) => directText(env.node);
      case 'position':
        return (env) => env.position;
      case 'last':
        return (env) => env.last;
      case 'true':
        return () => true;
      case 'false':
        return () => false;
      case 'not':
        requireArgs(name, args, 1);
        return (env) => !toBoolean(args[0]!(env));
      case 'contains':
        requireArgs(name, args, 2);
        return (env) => toStr(args[0]!(env)).includes(toStr(args[1]!(env)));
      case 'starts-with':
        requireArgs(name, args, 2);
        return (env) => toStr(args[0]!(env)).startsWith(toStr(args[1]!(env)));
      case 'ends-with':
        requireArgs(name, args, 2);
        return (env) => toStr(args[0]!(env)).endsWith(toStr(args[1]!(env)));
      case 'normalize-space':
        return (env) => normalize(args.length ? toStr(args[0]!(env)) : env.$(env.node).text());
      case 'string':
        return (env) => (args.length ? toStr(args[0]!(env)) : env.$(env.node).text());
      case 'string-length':
        return (env) => (args.length ? toStr(args[0]!(env)) : env.$(env.node).text()).length;
      default:
        throw new XPathError(`unsupported function: ${name}()`);
    }
  }

  private peekFunctionName(): string | null {
    const m = /^([A-Za-z][\w-]*)\s*\(/.exec(this.s.slice(this.p));
    if (!m) return null;
    // text() / node() are node tests, never reached here at primary
    // position except as functions — both are handled in the switch.
    return m[1]!;
  }

  private readString(): string {
    const quote = this.s[this.p]!;
    let i = this.p + 1;
    let out = '';
    while (i < this.s.length && this.s[i] !== quote) out += this.s[i++];
    if (i >= this.s.length) throw new XPathError('unterminated string in predicate');
    this.p = i + 1;
    return out;
  }

  private readNumber(): number {
    const start = this.p;
    while (this.p < this.s.length && /[0-9.]/.test(this.s[this.p]!)) this.p++;
    const n = Number(this.s.slice(start, this.p));
    if (Number.isNaN(n)) throw new XPathError('invalid number in predicate');
    return n;
  }

  private readCompareOp(): string | null {
    const two = this.s.slice(this.p, this.p + 2);
    if (two === '!=' || two === '<=' || two === '>=') {
      this.p += 2;
      return two;
    }
    const one = this.s[this.p];
    if (one === '=' || one === '<' || one === '>') {
      this.p += 1;
      return one;
    }
    return null;
  }

  private matchWord(word: string): boolean {
    this.ws();
    const slice = this.s.slice(this.p, this.p + word.length);
    if (slice !== word) return false;
    const after = this.s[this.p + word.length];
    if (after !== undefined && /[\w-]/.test(after)) return false; // not a word boundary
    this.p += word.length;
    return true;
  }

  private ws(): void {
    while (this.p < this.s.length && /\s/.test(this.s[this.p]!)) this.p++;
  }
}

function requireArgs(name: string, args: PredFn[], n: number): void {
  if (args.length !== n) throw new XPathError(`${name}() expects ${n} argument(s)`);
}

/* ------------------------------------------------------------------ */
/* Relative path evaluation (used by predicate path terms)             */
/* ------------------------------------------------------------------ */

function evalRelPath($: CheerioAPI, node: Element, pathStr: string): XPathResult {
  // '.' = self; '@attr' = attribute of self; './/x' / '//x' = descendant
  // of self; './x' / 'x' = child of self; '/x' = absolute from root.
  let str = pathStr;
  let ctx: AnyNode[] = [node];
  let forceFirstDescendant = false;

  if (str === '.') return { kind: 'nodes', nodes: [node] };
  if (str.startsWith('@')) {
    return { kind: 'values', values: extractTerminal([node], { kind: 'attr', name: str.slice(1) }) };
  }
  if (str.startsWith('.//')) {
    str = str.slice(3);
    forceFirstDescendant = true;
  } else if (str.startsWith('./')) {
    str = str.slice(2);
  } else if (str.startsWith('//')) {
    str = str.slice(2);
    forceFirstDescendant = true;
  } else if (str.startsWith('/')) {
    str = str.slice(1);
    ctx = [rootNode($)];
  }

  const { steps } = parsePath((forceFirstDescendant ? '//' : '') + str);
  return runPath($, ctx, steps);
}

/* ------------------------------------------------------------------ */
/* Value coercion                                                      */
/* ------------------------------------------------------------------ */

function toBoolean(v: XVal): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0 && !Number.isNaN(v);
  if (typeof v === 'string') return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return false;
}

function toNumber(v: XVal): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return Number(toStr(v));
}

function toStr(v: XVal): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) {
    const first = v[0];
    if (first === undefined) return '';
    // Value-set (attribute / text() strings) → first string; node-set →
    // string value (text content) of the first node.
    return typeof first === 'string' ? first : normalize(textOf(first));
  }
  return '';
}

function textOf(node: Element): string {
  // domhandler text aggregation without needing the cheerio instance.
  let out = '';
  const walk = (n: AnyNode): void => {
    if (isText(n)) out += n.data;
    else if (isTag(n)) for (const c of n.children) walk(c);
  };
  for (const c of node.children) walk(c);
  return out;
}

function compareVals(a: XVal, op: string, b: XVal): boolean {
  // String-set comparison: when a side is a node-set of strings (attribute
  // values), XPath '=' is true if ANY member matches. Handles `[@a='x']`
  // when multiple matches exist as well as the common single-value case.
  if (op === '=' || op === '!=') {
    const eq = looseEqual(a, b);
    return op === '=' ? eq : !eq;
  }
  const na = toNumber(a);
  const nb = toNumber(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) {
    return op === '<' ? na < nb : op === '<=' ? na <= nb : op === '>' ? na > nb : na >= nb;
  }
  const sa = toStr(a);
  const sb = toStr(b);
  return op === '<' ? sa < sb : op === '<=' ? sa <= sb : op === '>' ? sa > sb : sa >= sb;
}

function looseEqual(a: XVal, b: XVal): boolean {
  // If either side is a string node-set, compare each member.
  const aMembers = members(a);
  const bMembers = members(b);
  for (const x of aMembers) {
    for (const y of bMembers) {
      if (memberEq(x, y)) return true;
    }
  }
  return false;
}

function members(v: XVal): Array<string | number | boolean> {
  if (Array.isArray(v)) {
    // value-set → the strings as-is; node-set → each node's string value.
    return v.map((n) => (typeof n === 'string' ? n : normalize(textOf(n))));
  }
  if (v === undefined) return [''];
  return [v];
}

function memberEq(x: string | number | boolean, y: string | number | boolean): boolean {
  if (x === y) return true;
  if (typeof x === 'number' || typeof y === 'number') return Number(x) === Number(y);
  return String(x) === String(y);
}
