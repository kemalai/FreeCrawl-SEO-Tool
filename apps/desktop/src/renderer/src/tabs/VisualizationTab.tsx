import { Fragment, useEffect, useRef, useState } from 'react';
import { RefreshCw, Sparkles, Settings2, RotateCcw, Download, Route } from 'lucide-react';
import cytoscape, { type Core } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import ForceGraph3D, { type ForceGraph3DInstance } from '3d-force-graph';
import { useTranslation } from 'react-i18next';
import type {
  AnchorTextRow,
  CrawlPathResult,
  GraphSnapshotResult,
  Indexability,
} from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';
import { translateLabel } from '../i18n/labels.js';

// Register the dagre (Sugiyama layered DAG) layout extension once at module
// load. Wrapped because Vite HMR can re-evaluate this module and cytoscape
// throws on a duplicate registration.
try {
  cytoscape.use(dagre);
} catch {
  /* already registered (HMR re-import) */
}

/**
 * User-tunable layout knobs. Persisted in prefs under the
 * `vis-tuning` key so the settings survive across sessions.
 */
interface VisTuning {
  /** Multiplier on the log-scaled node radius. 1.0 = baseline (6–24 px). */
  nodeSizeScale: number;
  /** Multiplier on cose `nodeRepulsion`. 1.0 = baseline 1,000,000. */
  repulsionScale: number;
  /** Multiplier on cose `idealEdgeLength`. 1.0 = baseline 400 px. */
  edgeLengthScale: number;
  /** Multiplier on cose `componentSpacing`. 1.0 = baseline 400 px. */
  componentSpacingScale: number;
  /** Edge opacity 0–1. Lower = less visual noise on dense graphs. */
  edgeOpacity: number;
}

const DEFAULT_TUNING: VisTuning = {
  // Empirically tuned for typical SEO crawls (50–500 internal nodes,
  // hub-spoke link topology dominated by a navbar). Node radius ×3 makes
  // dots clickable without overlap; ×1.3 repulsion gives just enough
  // breathing room without throwing outliers off-canvas.
  nodeSizeScale: 3,
  repulsionScale: 1.3,
  edgeLengthScale: 1,
  componentSpacingScale: 1,
  edgeOpacity: 0.4,
};

function loadTuning(): VisTuning {
  try {
    const saved = window.freecrawl?.prefsGet('vis-tuning');
    if (saved && typeof saved === 'object') {
      return { ...DEFAULT_TUNING, ...(saved as Partial<VisTuning>) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_TUNING;
}

function downloadBlob(data: Blob, filename: string): void {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 5_000);
}

// Matches the on-screen canvas colour so exports look identical.
const CANVAS_BG = '#2F2F2F';

function exportPng(cy: Core, filename = 'freecrawl-graph.png'): void {
  const dataUrl = cy.png({
    output: 'base64uri',
    full: true,
    bg: CANVAS_BG,
    scale: 2,
  });
  void fetch(dataUrl)
    .then((r) => r.blob())
    .then((b) => downloadBlob(b, filename));
}

/** Snapshot the 3D view's WebGL canvas (renderer created with
 *  preserveDrawingBuffer so the backbuffer is readable). */
function exportPng3d(fg: ForceGraph3DInstance, filename = 'freecrawl-graph-3d.png'): void {
  const canvas = fg.renderer().domElement;
  canvas.toBlob((b: Blob | null) => {
    if (b) downloadBlob(b, filename);
  }, 'image/png');
}

function exportSvg(cy: Core, filename = 'freecrawl-graph.svg'): void {
  const bbox = cy.elements().boundingBox({});
  const pad = 40;
  const width = Math.ceil(bbox.w + pad * 2);
  const height = Math.ceil(bbox.h + pad * 2);
  const tx = -bbox.x1 + pad;
  const ty = -bbox.y1 + pad;
  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
  );
  parts.push(`<rect width="100%" height="100%" fill="${CANVAS_BG}"/>`);
  cy.edges().forEach((e) => {
    const src = e.source().position();
    const tgt = e.target().position();
    const c = String((e.style('line-color') as unknown) ?? '#9ca3af');
    parts.push(
      `<line x1="${(src.x + tx).toFixed(1)}" y1="${(src.y + ty).toFixed(1)}" x2="${(tgt.x + tx).toFixed(1)}" y2="${(tgt.y + ty).toFixed(1)}" stroke="${escapeXml(c)}" stroke-width="0.6" opacity="0.6"/>`,
    );
  });
  cy.nodes().forEach((n) => {
    const p = n.position();
    const r = Number(n.style('width') ?? 12) / 2;
    const fill = String((n.style('background-color') as unknown) ?? '#73b72b');
    parts.push(
      `<circle cx="${(p.x + tx).toFixed(1)}" cy="${(p.y + ty).toFixed(1)}" r="${r.toFixed(1)}" fill="${escapeXml(fill)}" stroke="${CANVAS_BG}" stroke-width="1"/>`,
    );
  });
  parts.push(`</svg>`);
  downloadBlob(new Blob([parts.join('\n')], { type: 'image/svg+xml' }), filename);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function exportStandaloneHtml(
  cy: Core,
  filename = 'freecrawl-graph.html',
): void {
  const elements = cy.json() as { elements: unknown };
  const dataJson = JSON.stringify(elements.elements ?? []);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>FreeCrawl Graph</title>
<style>
  html, body { margin: 0; height: 100%; background: #2F2F2F; color: #e2e8f0; font-family: system-ui, sans-serif; }
  #cy { position: absolute; inset: 0; }
  #legend { position: absolute; top: 12px; left: 12px; padding: 8px 12px; background: rgba(15,23,42,0.85); border: 1px solid #334155; border-radius: 6px; font-size: 12px; }
  #legend h1 { margin: 0 0 6px; font-size: 13px; font-weight: 600; }
</style>
</head>
<body>
<div id="cy"></div>
<div id="legend">
  <h1>FreeCrawl SEO — Site Graph</h1>
  <div>Exported: ${new Date().toISOString()}</div>
  <div>Nodes: ${cy.nodes().length} · Edges: ${cy.edges().length}</div>
</div>
<script src="https://unpkg.com/cytoscape@3/dist/cytoscape.min.js"></script>
<script>
  const elements = ${dataJson};
  cytoscape({
    container: document.getElementById('cy'),
    elements: elements,
    style: [
      { selector: 'node', style: { 'background-color': 'data(color)', 'width': 'data(size)', 'height': 'data(size)', 'border-color': '#2F2F2F', 'border-width': 1, 'label': 'data(label)', 'color': '#cbd5e1', 'font-size': 9, 'text-valign': 'bottom', 'text-margin-y': 4 } },
      { selector: 'edge', style: { 'width': 0.8, 'line-color': '#e8e8e8', 'opacity': 0.4, 'curve-style': 'straight' } },
    ],
    layout: { name: 'preset' },
  });
</script>
</body>
</html>`;
  downloadBlob(new Blob([html], { type: 'text/html' }), filename);
}

/**
 * SEO-meaningful layout set. Every entry answers a concrete question:
 *  - tree3d        "How does my site branch out from the homepage?"
 *                  — 3D force-directed crawl diagram (rotate/zoom;
 *                  dense sites stay legible because clusters separate
 *                  in depth instead of overlapping on a plane)
 *  - mesh3d        "What does the raw internal link mesh look like?" (3D)
 *  - breadthfirst  "Same discovery tree, flat top-down levels." (2D)
 *  - directory     "How is the URL folder structure organised?" (2D)
 * Force-directed views are deliberately 3D-only and the hierarchical
 * views 2D-only. The old Circle / Concentric / Radial layouts were
 * dropped — generic geometry with no crawl semantics (radial is
 * subsumed by the 3D tree: root at the centre, leaves outward).
 */
type LayoutKind = 'tree3d' | 'mesh3d' | 'tree2d' | 'directory';

const LAYOUTS: { key: LayoutKind; label: string; hint: string }[] = [
  { key: 'tree3d', label: '3D Force-Directed Crawl Tree', hint: 'Discovery tree in 3D — drag to rotate, scroll to zoom' },
  { key: 'mesh3d', label: '3D Force-Directed Link Graph', hint: 'Full internal link mesh in 3D' },
  { key: 'tree2d', label: 'Crawl Tree', hint: 'Left-to-right labelled discovery tree (2D)' },
  { key: 'directory', label: 'Directory Tree', hint: 'Grouped by URL path segments (2D)' },
];

/** Layouts that draw the BFS discovery tree instead of the full link
 *  mesh — one parent edge per node. This is what turns the hairball
 *  into the clean dandelion clusters of a crawl diagram. Note the 2D
 *  Crawl Tree uses the SAME BFS tree — the branching comes from link
 *  discovery, not URL paths, so it stays "dallı budaklı" even on sites
 *  whose URLs are all top-level slugs. */
function usesTreeEdges(layout: LayoutKind): boolean {
  return layout === 'tree3d' || layout === 'tree2d';
}

/** Force-directed layouts render through 3d-force-graph (three.js);
 *  hierarchical layouts stay on cytoscape's 2D canvas. */
function is3dLayout(layout: LayoutKind): boolean {
  return layout === 'tree3d' || layout === 'mesh3d';
}

interface CrawlTree {
  edges: { source: number; target: number }[];
  /** BFS depth per node id — computed from the link structure, NOT the
   *  stored crawl depth (which is flat on list/sitemap crawls). */
  depthById: Map<number, number>;
  maxDepth: number;
}

/**
 * Reduce the link graph to a real BFS spanning tree. The tree is built
 * by walking the link structure itself — the stored crawl depth is only
 * used to pick the root(s), because list/sitemap crawls store the same
 * depth for every URL (which is exactly the case that turned the first
 * depth-difference-based implementation into 150 disconnected dots
 * packed in a grid).
 *
 *  1. Roots: the minimum-stored-depth nodes. If that "minimum" is every
 *     node (flat-depth crawl), fall back to the single most-linked node
 *     — the de-facto homepage/hub.
 *  2. BFS over DIRECTED edges from the roots; the first discoverer of a
 *     node becomes its tree parent (adjacency sorted by id ⇒
 *     deterministic, ≈ discovery order).
 *  3. Nodes the directed walk can't reach are attached via a second
 *     UNDIRECTED BFS pass seeded from every visited node, so pages that
 *     only link *to* the crawled set still hang off the tree instead of
 *     floating.
 *  4. Fully disconnected leftovers get maxDepth (they render as pale
 *     leaves at the rim).
 */
function buildCrawlTree(
  nodes: GraphSnapshotResult['nodes'],
  edges: GraphSnapshotResult['edges'],
): CrawlTree {
  const ids = new Set(nodes.map((n) => n.id));
  const outAdj = new Map<number, number[]>();
  const undirAdj = new Map<number, number[]>();
  const push = (m: Map<number, number[]>, k: number, v: number) => {
    const arr = m.get(k);
    if (arr) arr.push(v);
    else m.set(k, [v]);
  };
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target) || e.source === e.target) continue;
    push(outAdj, e.source, e.target);
    push(undirAdj, e.source, e.target);
    push(undirAdj, e.target, e.source);
  }
  for (const arr of outAdj.values()) arr.sort((a, b) => a - b);
  for (const arr of undirAdj.values()) arr.sort((a, b) => a - b);

  const minStoredDepth = nodes.reduce(
    (m, n) => Math.min(m, n.depth),
    Number.POSITIVE_INFINITY,
  );
  let roots = nodes.filter((n) => n.depth === minStoredDepth);
  if (roots.length === nodes.length && nodes.length > 1) {
    const hub = nodes.reduce((a, b) =>
      b.inlinks > a.inlinks || (b.inlinks === a.inlinks && b.id < a.id) ? b : a,
    );
    roots = [hub];
  }

  const depthById = new Map<number, number>();
  const parent = new Map<number, number>();
  const queue: number[] = [];
  for (const r of [...roots].sort((a, b) => a.id - b.id)) {
    depthById.set(r.id, 0);
    queue.push(r.id);
  }
  const walk = (adj: Map<number, number[]>) => {
    while (queue.length > 0) {
      const cur = queue.shift()!;
      const d = depthById.get(cur)!;
      for (const next of adj.get(cur) ?? []) {
        if (depthById.has(next)) continue;
        depthById.set(next, d + 1);
        parent.set(next, cur);
        queue.push(next);
      }
    }
  };
  // Pass 1 — follow real link direction. Pass 2 — sweep up anything the
  // directed walk missed, treating links as undirected, seeded from all
  // already-placed nodes (shallowest first so attachments stay short).
  walk(outAdj);
  queue.push(...[...depthById.keys()].sort((a, b) => depthById.get(a)! - depthById.get(b)!));
  walk(undirAdj);

  let maxDepth = 0;
  for (const d of depthById.values()) maxDepth = Math.max(maxDepth, d);
  for (const n of nodes) {
    if (!depthById.has(n.id)) depthById.set(n.id, maxDepth);
  }
  return {
    edges: [...parent].map(([target, source]) => ({ source, target })),
    depthById,
    maxDepth,
  };
}

type ColorMode = 'crawl' | 'status' | 'depth' | 'indexability' | 'lcp' | 'linkScore';

/**
 * Default crawl-diagram palette: non-indexable pages red, unresponsive
 * pages pale salmon, and indexable pages a green whose lightness rises
 * with crawl depth — saturated hubs near the root, near-white leaves
 * at the edge of the crawl. Reads at a glance as "healthy structure
 * with red problem spots".
 */
function crawlColor(
  n: GraphSnapshotResult['nodes'][number],
  depth: number,
  maxDepth: number,
): string {
  if (n.statusCode === null || n.statusCode === 0) return '#ff8d8d';
  if (n.indexability.startsWith('non-indexable') || n.statusCode >= 400) return '#c92d2d';
  // Base green hsl(88, 55%, 30%) fading to 88% lightness at max depth.
  const frac = maxDepth <= 0 ? 0 : Math.min(1, depth / maxDepth);
  const lightness = 30 + (88 - 30) * frac;
  return `hsl(88, 55%, ${lightness.toFixed(0)}%)`;
}

/** Colour a node by its Largest-Contentful-Paint candidate: grey when no
 *  render data, amber when the LCP is an image (a prime optimisation
 *  target), green when it is text / other markup. */
function lcpColor(n: GraphSnapshotResult['nodes'][number]): string {
  if (!n.lcpTag) return '#737373';
  const tag = n.lcpTag.toLowerCase();
  const isImage = !!n.lcpResourceUrl || tag === 'img' || tag === 'image' || tag === 'svg';
  return isImage ? '#ea580c' : '#16a34a';
}

/**
 * Left-to-right tidy directory tree — the classic crawl-visualisation
 * look: root host at the far left, folders fanning right, one row per
 * leaf, every node a small labelled dot (labels sit left of folders,
 * right of pages). The hierarchy is a strict tree, so the tidy layout
 * is computed right here ("leaves take consecutive rows, parents centre
 * on their children") and rendered via cytoscape's 'preset' layout —
 * no layout algorithm involved, fully deterministic.
 */
const DIR_X_SPACING = 260;
const DIR_Y_SPACING = 22;

interface DirTreeNode {
  id: string;
  label: string;
  children: Map<string, DirTreeNode>;
  page?: GraphSnapshotResult['nodes'][number];
  x: number;
  y: number;
}

function buildDirectoryElements(
  nodes: GraphSnapshotResult['nodes'],
  colorFn: (n: GraphSnapshotResult['nodes'][number]) => string,
  sizeScale: number,
  collapsed: ReadonlySet<string>,
): { data: Record<string, unknown>; classes?: string; position?: { x: number; y: number } }[] {
  const mkNode = (id: string, label: string): DirTreeNode => ({
    id,
    label,
    children: new Map(),
    x: 0,
    y: 0,
  });
  // Phase 1 — hierarchy: host root → folder chain → page leaf.
  const roots = new Map<string, DirTreeNode>();
  const ensureChild = (parent: DirTreeNode, id: string, label: string): DirTreeNode => {
    const existing = parent.children.get(id);
    if (existing) return existing;
    const created = mkNode(id, label);
    parent.children.set(id, created);
    return created;
  };
  for (const n of nodes) {
    let host = '';
    let segs: string[] = [];
    try {
      const u = new URL(n.url);
      host = u.host;
      segs = u.pathname.split('/').filter(Boolean);
    } catch {
      continue;
    }
    let root = roots.get(host);
    if (root === undefined) {
      root = mkNode(`dir:${host}/`, host);
      roots.set(host, root);
    }
    let cur: DirTreeNode = root;
    let acc = '';
    for (const seg of segs.slice(0, Math.max(0, segs.length - 1))) {
      acc += `/${seg}`;
      cur = ensureChild(cur, `dir:${host}${acc}`, `${seg}/`);
    }
    const leaf = mkNode(String(n.id), segs.length > 0 ? segs[segs.length - 1]! : '/');
    leaf.page = n;
    cur.children.set(`page:${n.id}`, leaf);
  }
  // Phase 2 — tidy positions. Alphabetical sibling order, folders and
  // pages interleaved, like a file browser. A collapsed node keeps its
  // row but contributes no children.
  let leafRow = 0;
  const kidsOf = (node: DirTreeNode): DirTreeNode[] =>
    collapsed.has(node.id)
      ? []
      : [...node.children.values()].sort((a, b) => a.label.localeCompare(b.label));
  const assign = (node: DirTreeNode, depth: number): number => {
    node.x = depth * DIR_X_SPACING;
    const kids = kidsOf(node);
    if (kids.length === 0) {
      node.y = leafRow++ * DIR_Y_SPACING;
      return node.y;
    }
    const ys = kids.map((k) => assign(k, depth + 1));
    node.y = (ys[0]! + ys[ys.length - 1]!) / 2;
    return node.y;
  };
  const subtreeSize = (node: DirTreeNode): number => {
    let n = 0;
    const stack = [...node.children.values()];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      n++;
      stack.push(...cur.children.values());
    }
    return n;
  };
  // Phase 3 — flatten into cytoscape elements with preset positions.
  const elements: { data: Record<string, unknown>; classes?: string; position?: { x: number; y: number } }[] = [];
  const dotScale = sizeScale / DEFAULT_TUNING.nodeSizeScale;
  const walk = (node: DirTreeNode, parentId: string | null) => {
    const childCount = node.children.size;
    const isCollapsed = collapsed.has(node.id);
    const label = isCollapsed ? `${node.label}  +${subtreeSize(node)}` : node.label;
    const classes: string[] = [node.page ? 'lbl-right' : 'lbl-left'];
    if (childCount > 0) classes.push('has-kids');
    if (isCollapsed) classes.push('collapsed');
    elements.push({
      data: node.page
        ? {
            id: node.id,
            label,
            fullUrl: node.page.url,
            statusCode: node.page.statusCode ?? '',
            inlinks: node.page.inlinks,
            color: colorFn(node.page),
            size: 9 * dotScale,
            kind: 'page',
            childCount,
          }
        : {
            id: node.id,
            label,
            kind: 'dir',
            color: '#8f8f8f',
            size: 10 * dotScale,
            childCount,
          },
      classes: classes.join(' '),
      position: { x: node.x, y: node.y },
    });
    if (parentId) {
      elements.push({ data: { id: `de:${parentId}>${node.id}`, source: parentId, target: node.id } });
    }
    if (!isCollapsed) {
      for (const kid of node.children.values()) walk(kid, node.id);
    }
  };
  for (const r of roots.values()) {
    assign(r, 0);
    walk(r, null);
  }
  return elements;
}

/**
 * Left-to-right tidy tree over the BFS *crawl* tree — the classic
 * "Crawl Tree Graph": root page at the far left, pages discovered from
 * it fanning right, every node a labelled dot. Same tidy algorithm as
 * the directory view, but the hierarchy is link-discovery, not URL
 * paths — which is what makes it branch richly even on flat-URL sites.
 *
 * `collapsed` holds node ids whose subtree is folded away: the branch
 * root stays visible (marked so it renders amber with a child count),
 * its descendants are dropped from the element set entirely and the
 * tidy pass re-flows the remaining rows around the gap.
 */
const TREE2D_X_SPACING = 340;

function buildCrawlTree2dElements(
  nodes: GraphSnapshotResult['nodes'],
  treeEdges: { source: number; target: number }[],
  colorFn: (n: GraphSnapshotResult['nodes'][number]) => string,
  sizeScale: number,
  collapsed: ReadonlySet<string>,
): { data: Record<string, unknown>; classes?: string; position?: { x: number; y: number } }[] {
  const kidsOf = new Map<number, number[]>();
  const hasParent = new Set<number>();
  for (const e of treeEdges) {
    const arr = kidsOf.get(e.source);
    if (arr) arr.push(e.target);
    else kidsOf.set(e.source, [e.target]);
    hasParent.add(e.target);
  }
  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  const labelOf = (id: number) => {
    const n = byId.get(id);
    return n ? shortenUrl(n.url) : String(id);
  };
  for (const arr of kidsOf.values()) {
    arr.sort((a, b) => labelOf(a).localeCompare(labelOf(b)));
  }
  /** Descendant count, for the "+N" badge on a folded branch. */
  const subtreeSize = (id: number): number => {
    let n = 0;
    const stack = [...(kidsOf.get(id) ?? [])];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      n++;
      stack.push(...(kidsOf.get(cur) ?? []));
    }
    return n;
  };
  const posn = new Map<number, { x: number; y: number }>();
  const visible = new Set<number>();
  let row = 0;
  const assign = (id: number, depth: number): number => {
    visible.add(id);
    const kids = collapsed.has(String(id)) ? [] : (kidsOf.get(id) ?? []);
    let y: number;
    if (kids.length === 0) {
      y = row++ * DIR_Y_SPACING;
    } else {
      const ys = kids.map((k) => assign(k, depth + 1));
      y = (ys[0]! + ys[ys.length - 1]!) / 2;
    }
    posn.set(id, { x: depth * TREE2D_X_SPACING, y });
    return y;
  };
  const roots = [...nodes].filter((n) => !hasParent.has(n.id)).sort((a, b) => a.id - b.id);
  // Reachability with NOTHING folded. Anything outside this set is a
  // genuine orphan (cycle-only, or truncated by the node cap) and still
  // deserves a row; anything inside it that the folded walk skipped is
  // hidden on purpose and must stay hidden — without this distinction
  // collapsing a branch re-emits its descendants as stray rows.
  const reachable = new Set<number>();
  for (const r of roots) {
    const stack = [r.id];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      if (reachable.has(cur)) continue;
      reachable.add(cur);
      stack.push(...(kidsOf.get(cur) ?? []));
    }
  }
  for (const r of roots) assign(r.id, 0);
  for (const n of nodes) {
    if (!visible.has(n.id) && !reachable.has(n.id)) {
      visible.add(n.id);
      posn.set(n.id, { x: 0, y: row++ * DIR_Y_SPACING });
    }
  }

  const dotScale = sizeScale / DEFAULT_TUNING.nodeSizeScale;
  const elements: { data: Record<string, unknown>; classes?: string; position?: { x: number; y: number } }[] = [];
  for (const n of nodes) {
    if (!visible.has(n.id)) continue;
    const childCount = kidsOf.get(n.id)?.length ?? 0;
    const isCollapsed = collapsed.has(String(n.id));
    const classes: string[] = [childCount > 0 ? 'lbl-left' : 'lbl-right'];
    if (childCount > 0) classes.push('has-kids');
    if (isCollapsed) classes.push('collapsed');
    elements.push({
      data: {
        id: String(n.id),
        label: isCollapsed
          ? `${shortenUrl(n.url)}  +${subtreeSize(n.id)}`
          : shortenUrl(n.url),
        fullUrl: n.url,
        statusCode: n.statusCode ?? '',
        inlinks: n.inlinks,
        color: colorFn(n),
        size: 9 * dotScale,
        childCount,
      },
      // SF's tidy-tree label convention: parents label toward the root
      // (left of the dot), leaves toward the open side (right).
      classes: classes.join(' '),
      position: posn.get(n.id)!,
    });
  }
  for (const e of treeEdges) {
    if (!visible.has(e.source) || !visible.has(e.target)) continue;
    if (collapsed.has(String(e.source))) continue;
    elements.push({
      data: {
        id: `e${e.source}-${e.target}`,
        source: String(e.source),
        target: String(e.target),
      },
    });
  }
  return elements;
}

function statusColor(code: number | null): string {
  if (code === null) return '#737373';
  if (code >= 500) return '#dc2626';
  if (code >= 400) return '#ea580c';
  if (code >= 300) return '#d97706';
  if (code >= 200) return '#16a34a';
  return '#737373';
}

function depthColor(d: number): string {
  const palette = [
    '#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6',
    '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#a3a3a3',
  ];
  return palette[Math.min(d, palette.length - 1)] ?? '#a3a3a3';
}

/** Colour a node by internal link score (PageRank, 0..100): grey when not
 *  yet computed, pale green at the bottom of the graph, deep green for the
 *  pages holding the most internal link equity. */
function linkScoreColor(score: number | null): string {
  if (score === null || score === undefined) return '#737373';
  const palette = [
    '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80',
    '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
  ];
  const idx = Math.min(
    palette.length - 1,
    Math.max(0, Math.floor((score / 100) * palette.length)),
  );
  return palette[idx] ?? '#737373';
}

function indexColor(i: Indexability): string {
  if (i === 'indexable') return '#16a34a';
  if (i.startsWith('non-indexable')) return '#dc2626';
  return '#737373';
}

export function VisualizationTab() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  // React to data refreshes so the graph re-snapshots when a new crawl
  // populates URLs (or the active project is swapped).
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [graph, setGraph] = useState<GraphSnapshotResult | null>(null);
  const [anchors, setAnchors] = useState<AnchorTextRow[]>([]);
  const [layout, setLayout] = useState<LayoutKind>('tree3d');
  const [colorMode, setColorMode] = useState<ColorMode>('crawl');
  const [nodeLimit, setNodeLimit] = useState(150);
  // Crawl-path trace: when enabled, selecting a node fetches & highlights
  // the shortest discovery path from the crawl root to that page.
  const [pathMode, setPathMode] = useState(false);
  const [crawlPath, setCrawlPath] = useState<CrawlPathResult | null>(null);
  const pathModeRef = useRef(false);
  useEffect(() => {
    pathModeRef.current = pathMode;
    if (!pathMode) {
      setCrawlPath(null);
      cyRef.current?.elements().removeClass('onpath pathedge');
    }
  }, [pathMode]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const fgRef = useRef<ForceGraph3DInstance | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  /** Collapsed subtree roots (2D trees). Clicking a node with children
   *  toggles membership; every descendant is then hidden and the tidy
   *  layout re-flows around the gap. */
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const collapsedRef = useRef(collapsed);
  useEffect(() => {
    collapsedRef.current = collapsed;
  }, [collapsed]);
  /** Viewport carried across a collapse-driven rebuild so toggling a
   *  branch doesn't snap the camera back to "fit". */
  const viewportRef = useRef<{ zoom: number; pan: { x: number; y: number } } | null>(null);
  /** Hover summary card — the SF-style detail panel. */
  const [hoverCard, setHoverCard] = useState<{
    node: GraphSnapshotResult['nodes'][number];
    x: number;
    y: number;
  } | null>(null);
  const [tuning, setTuning] = useState<VisTuning>(() => loadTuning());
  // Debounced copy that drives the expensive cytoscape rebuild. A tuning
  // slider drag fires onChange on every step; rebuilding the graph and
  // re-running the cose layout on each step thrashes the view. The
  // slider itself stays instant (bound to `tuning`) — the graph settles
  // ~250 ms after the last change.
  const [debouncedTuning, setDebouncedTuning] = useState<VisTuning>(tuning);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedTuning(tuning), 250);
    return () => clearTimeout(id);
  }, [tuning]);
  const [tunerOpen, setTunerOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  function patchTuning(patch: Partial<VisTuning>) {
    setTuning((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.freecrawl?.prefsSet('vis-tuning', next);
      } catch {
        // best-effort persistence
      }
      return next;
    });
  }
  const [labelOverlay, setLabelOverlay] = useState<{
    text: string;
    x: number;
    y: number;
    radius: number;
  } | null>(null);
  const selectedUrlRef = useRef<string | null>(null);
  useEffect(() => {
    selectedUrlRef.current = selectedUrl;
  }, [selectedUrl]);

  useEffect(() => {
    void loadGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeLimit, dataVersion]);

  // Monotonic token so a slow graphSnapshot (e.g. a large `nodeLimit`)
  // can't resolve after a newer request and render a graph that no
  // longer matches the controls. Covers both the effect and the
  // Reload / Tuning buttons.
  const loadTokenRef = useRef(0);
  async function loadGraph() {
    const token = ++loadTokenRef.current;
    setLoading(true);
    try {
      const [g, a] = await Promise.all([
        window.freecrawl.graphSnapshot({ nodeLimit }),
        window.freecrawl.topAnchorTexts(120),
      ]);
      if (token !== loadTokenRef.current) return;
      setGraph(g);
      setAnchors(a);
    } finally {
      if (token === loadTokenRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (!containerRef.current || !graph) return;

    // Tree modes drive colour/size from the BFS tree depth (computed
    // from the link structure) so the depth-faded palette works even on
    // list/sitemap crawls where every stored depth is identical.
    const treeMode = usesTreeEdges(layout);
    const tree = treeMode ? buildCrawlTree(graph.nodes, graph.edges) : null;
    const depthOf = (n: GraphSnapshotResult['nodes'][number]) =>
      tree ? (tree.depthById.get(n.id) ?? tree.maxDepth) : n.depth;
    const maxDepth = tree
      ? tree.maxDepth
      : graph.nodes.reduce((m, n) => Math.max(m, n.depth), 0);
    const colorFn = (n: GraphSnapshotResult['nodes'][number]) => {
      if (colorMode === 'crawl') return crawlColor(n, depthOf(n), maxDepth);
      if (colorMode === 'depth') return depthColor(n.depth);
      if (colorMode === 'indexability') return indexColor(n.indexability);
      if (colorMode === 'lcp') return lcpColor(n);
      if (colorMode === 'linkScore') return linkScoreColor(n.linkScore);
      return statusColor(n.statusCode);
    };

    // Directory mode swaps the link graph for a path-segment hierarchy;
    // tree modes reduce it to the BFS discovery tree; the 3D link mesh
    // renders every internal link edge.
    const edgeList = tree ? tree.edges : graph.edges;

    // Tear down whichever renderer the previous layout used.
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }
    if (fgRef.current) {
      fgRef.current._destructor();
      fgRef.current = null;
    }
    containerRef.current.innerHTML = '';

    // ── 3D branch — force-directed views via 3d-force-graph ──────────
    if (is3dLayout(layout)) {
      // Sphere volume scale, SF-style: linear from 40 (root) down to 1
      // (deepest leaf) for the tree; log-inlinks for the mesh. Radius is
      // nodeRelSize × ∛val, so this yields big saturated hubs and small
      // pale leaves.
      const treeVal = (n: GraphSnapshotResult['nodes'][number]) =>
        maxDepth <= 0 ? 40 : 1 + 39 * (1 - depthOf(n) / maxDepth);
      const meshVal = (n: GraphSnapshotResult['nodes'][number]) =>
        1 + Math.min(39, Math.log2(n.inlinks + 1) * 4);
      interface FgNode {
        id: number;
        url: string;
        color: string;
        val: number;
        x?: number;
        y?: number;
        z?: number;
      }
      const nodes3d: FgNode[] = graph.nodes.map((n) => ({
        id: n.id,
        url: n.url,
        color: colorFn(n),
        val: layout === 'tree3d' ? treeVal(n) : meshVal(n),
      }));
      const links3d = edgeList.map((e) => ({ source: e.source, target: e.target }));

      const fg = new ForceGraph3D(containerRef.current, {
        // preserveDrawingBuffer keeps the WebGL backbuffer readable so
        // the PNG export can snapshot the canvas.
        rendererConfig: { antialias: true, preserveDrawingBuffer: true },
      })
        .backgroundColor(CANVAS_BG)
        .showNavInfo(false)
        .nodeRelSize(4 * (debouncedTuning.nodeSizeScale / DEFAULT_TUNING.nodeSizeScale))
        .nodeVal('val')
        .nodeColor('color')
        .nodeOpacity(1)
        .nodeLabel((n) => escapeXml(String((n as FgNode).url ?? '')))
        .linkColor(() => '#FFFFFF')
        // Tuning default 0.4 maps to the reference diagram's 0.7.
        .linkOpacity(Math.min(1, debouncedTuning.edgeOpacity * 1.75))
        .linkWidth(0)
        .graphData({ nodes: nodes3d, links: links3d });
      // d3-force knobs — link rest length 30 matches the reference
      // diagram; charge default is -30, scaled by the tuning slider.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fg.d3Force('link') as any)?.distance(30 * debouncedTuning.edgeLengthScale);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fg.d3Force('charge') as any)?.strength(-30 * debouncedTuning.repulsionScale);
      const byId3d = new Map(graph.nodes.map((n) => [n.id, n] as const));
      fg.onNodeHover((n) => {
        if (!n) {
          setHover(null);
          setHoverCard(null);
          return;
        }
        const fn = n as FgNode;
        setHover(String(fn.url ?? ''));
        const full = byId3d.get(fn.id);
        if (!full) {
          setHoverCard(null);
          return;
        }
        // 3D has no stable 2D anchor for a node under the cursor —
        // pin the card to a fixed corner instead of chasing the
        // projected position every frame.
        setHoverCard({ node: full, x: -1, y: -1 });
      });
      fg.onNodeClick((node) => {
        // Fly the camera to the node — aim from just outside it.
        const { x = 0, y = 0, z = 0 } = node as FgNode;
        const distance = 120;
        const len = Math.hypot(x, y, z) || 1;
        const ratio = 1 + distance / len;
        fg.cameraPosition({ x: x * ratio, y: y * ratio, z: z * ratio }, { x, y, z }, 1200);
      });
      fg.onNodeRightClick((node) => {
        const u = (node as FgNode).url;
        if (u) window.open(u, '_blank');
      });
      // 3d-force-graph reads the container size once at init — track
      // resizes (standalone window, detail-panel toggles) manually.
      const ro = new ResizeObserver(() => {
        const el = containerRef.current;
        if (el) fg.width(el.clientWidth).height(el.clientHeight);
      });
      ro.observe(containerRef.current);
      fgRef.current = fg;
      return () => {
        ro.disconnect();
        fg._destructor();
        if (fgRef.current === fg) fgRef.current = null;
      };
    }

    // ── 2D branch — labelled tidy trees via cytoscape ────────────────
    // Both 2D views precompute their positions (tidy-tree pass in the
    // builders) and render with 'preset' — no layout algorithm runs.
    const elements =
      layout === 'directory'
        ? buildDirectoryElements(
            graph.nodes,
            colorFn,
            debouncedTuning.nodeSizeScale,
            collapsed,
          )
        : buildCrawlTree2dElements(
            graph.nodes,
            edgeList,
            colorFn,
            debouncedTuning.nodeSizeScale,
            collapsed,
          );

    // A collapse toggle rebuilds the graph; skip the auto-fit so the
    // camera stays where the user left it (viewport restored below).
    const keepViewport = viewportRef.current;
    const layoutCfg: Record<string, unknown> = {
      name: 'preset',
      animate: false,
      padding: 30,
      fit: keepViewport === null,
    };

    const cy = cytoscape({
      container: containerRef.current,
      elements,
       
      style: ([
        // Every 2D view is a labelled tidy tree — labels are always on,
        // sitting beside the dots (left of parents/folders, right of
        // leaves — the d3 tidy-tree convention).
        {
          selector: 'node',
          style: {
            shape: 'ellipse',
            'background-color': 'data(color)',
            label: 'data(label)',
            color: '#e8e8e8',
            'font-size': 10,
            'font-weight': 500,
            'text-outline-color': '#2F2F2F',
            'text-outline-width': 2,
            'text-background-opacity': 0,
            'text-valign': 'center',
            'text-halign': 'right',
            'text-margin-x': 5,
            'text-max-width': 300,
            'text-wrap': 'ellipsis',
            'border-width': 0,
            width: 'data(size)',
            height: 'data(size)',
          },
        },
        {
          selector: 'node.lbl-left',
          style: {
            'text-halign': 'left',
            'text-margin-x': -5,
          },
        },
        {
          selector: 'node.lbl-right',
          style: {
            'text-halign': 'right',
            'text-margin-x': 5,
          },
        },
        // Branch nodes are clickable (collapse/expand) — give them a
        // faint ring so it's discoverable, and turn a folded branch
        // amber (the reference diagram's collapsed-node colour).
        {
          selector: 'node.has-kids',
          style: {
            'border-width': 1.5,
            'border-color': '#ffffff',
            'border-opacity': 0.45,
          },
        },
        {
          selector: 'node.collapsed',
          style: {
            'background-color': '#fcbb31',
            'border-width': 2,
            'border-color': '#fcbb31',
            'border-opacity': 0.9,
            color: '#fcd88a',
          },
        },
        {
          selector: 'node.focus',
          style: {
            'border-width': 2,
            'border-color': '#fbbf24',
            'z-index': 999,
          },
        },
        {
          selector: 'node.selected',
          style: {
            'border-width': 3,
            'border-color': '#f59e0b',
            'z-index': 1000,
          },
        },
        {
          selector: 'node.onpath',
          style: {
            'border-width': 3,
            'border-color': '#22d3ee',
            'z-index': 1001,
          },
        },
        {
          selector: 'node.faded',
          style: {
            opacity: 0.25,
            'text-opacity': 0,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1,
            // Light rounded-elbow links on the charcoal canvas — the
            // closest cytoscape gets to the reference's d3 linkHorizontal
            // curves. No arrowheads: direction is implicit root→leaf.
            'line-color': '#c9c9c9',
            'curve-style': 'round-taxi',
            'taxi-direction': 'rightward',
            'taxi-turn': '45%',
            'target-arrow-shape': 'none',
            opacity: Math.max(0.5, debouncedTuning.edgeOpacity),
          },
        },
        {
          selector: 'edge.focus',
          style: {
            'line-color': '#fbbf24',
            'target-arrow-color': '#fbbf24',
            opacity: 0.9,
            width: 1.4,
            'z-index': 999,
          },
        },
        {
          selector: 'edge.faded',
          style: {
            opacity: 0.08,
          },
        },
        {
          selector: 'edge.pathedge',
          style: {
            'line-color': '#22d3ee',
            'target-arrow-color': '#22d3ee',
            width: 2,
            opacity: 1,
            'z-index': 1000,
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      layout: layoutCfg as any,
      // 0.2 was tuned for the old force-directed hairball where one
      // wheel tick could overshoot the whole graph. The tidy trees
      // start fully zoomed OUT (fit of a tall layout), so the user
      // always has to travel a long zoom range to reach readable
      // labels — a low multiplier makes that feel glacial.
      wheelSensitivity: 0.8,
      minZoom: 0.05,
      maxZoom: 4,
      // Keep pan/zoom gestures fluid on big trees: skip edge drawing
      // mid-gesture (they pop back in at rest).
      hideEdgesOnViewport: graph.nodes.length > 600,
    });

    // Restore the pre-collapse viewport, then clear the marker so the
    // next non-collapse rebuild (layout / colour change) refits.
    if (keepViewport) {
      cy.viewport({ zoom: keepViewport.zoom, pan: keepViewport.pan });
      viewportRef.current = null;
    }

    const nodeById = new Map(graph.nodes.map((n) => [n.id, n] as const));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const placeLabel = (node: any) => {
      const pos = node.renderedPosition();
      const zoom = cy.zoom();
      const radius = (node.data('size') as number) * zoom * 0.5;
      setLabelOverlay({
        text: String(node.data('fullUrl') ?? ''),
        x: pos.x,
        y: pos.y,
        radius,
      });
    };

    /** Position the SF-style summary card next to a hovered page node.
     *  Folder nodes (directory view) carry no crawl data — skipped. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const placeHoverCard = (node: any) => {
      const idNum = Number(node.id());
      const data = Number.isFinite(idNum) ? nodeById.get(idNum) : undefined;
      if (!data) {
        setHoverCard(null);
        return;
      }
      const pos = node.renderedPosition();
      const radius = (node.data('size') as number) * cy.zoom() * 0.5;
      setHoverCard({ node: data, x: pos.x + radius + 10, y: pos.y });
    };

    const highlightPath = (res: CrawlPathResult) => {
      cy.batch(() => {
        cy.elements().removeClass('onpath pathedge');
        const ids = res.path.map((p) => String(p.id));
        const idSet = new Set(ids);
        cy.nodes().forEach((nd) => {
          if (idSet.has(nd.id())) nd.addClass('onpath');
        });
        // Highlight link-graph edges that connect consecutive path hops
        // (present only when both endpoints survived the node cap).
        for (let i = 0; i < ids.length - 1; i++) {
          const e1 = cy.$id(`e${ids[i]}-${ids[i + 1]}`);
          if (e1.nonempty()) e1.addClass('pathedge');
        }
      });
    };

    cy.on('mouseover', 'node', (e) => {
      const node = e.target;
      setHover(String(node.data('fullUrl')));
      placeHoverCard(node);
      cy.batch(() => {
        cy.elements().not('.selected').addClass('faded');
        const neighbourhood = node.closedNeighborhood();
        neighbourhood.removeClass('faded');
        node.addClass('focus');
        neighbourhood.edges().addClass('focus');
      });
    });
    cy.on('mouseout', 'node', () => {
      setHover(null);
      setHoverCard(null);
      const sel = cy.$('node.selected');
      if (sel.length > 0) {
        placeLabel(sel[0]!);
      } else {
        setLabelOverlay(null);
      }
      cy.batch(() => {
        cy.elements().removeClass('faded');
        cy.elements().removeClass('focus');
        if (sel.length > 0) {
          const keep = sel[0]!.closedNeighborhood();
          cy.elements().not(keep).addClass('faded');
          keep.edges().addClass('focus');
        }
      });
    });

    cy.on('tap', 'node', (e) => {
      const node = e.target;
      const kind = String(node.data('kind') ?? 'page');
      const idNum = Number(node.data('id'));

      // Branch node → fold/unfold its subtree (skipped while Crawl Path
      // is armed, where a click means "trace this page" and a rebuild
      // would wipe the highlight). Preserve the viewport across the
      // rebuild so the branch stays under the cursor.
      const childCount = Number(node.data('childCount') ?? 0);
      if (!pathModeRef.current && childCount > 0) {
        viewportRef.current = { zoom: cy.zoom(), pan: { ...cy.pan() } };
        // The rebuild tears down this cy instance, so mouseout never
        // fires — drop the hover chrome by hand.
        setHoverCard(null);
        setLabelOverlay(null);
        setHover(null);
        const id = node.id();
        const next = new Set(collapsedRef.current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setCollapsed(next);
        return;
      }

      setSelectedUrl(String(node.data('fullUrl')));
      placeLabel(node);
      cy.batch(() => {
        cy.elements().removeClass('selected');
        node.addClass('selected');
        cy.elements().addClass('faded');
        const keep = node.closedNeighborhood();
        keep.removeClass('faded');
        keep.edges().addClass('focus');
      });
      if (pathModeRef.current && kind !== 'dir' && Number.isFinite(idNum)) {
        void window.freecrawl.crawlPath({ urlId: idNum }).then((res) => {
          setCrawlPath(res);
          highlightPath(res);
        });
      }
    });
    cy.on('tap', (e) => {
      if (e.target !== cy) return;
      if (selectedUrlRef.current) {
        setSelectedUrl(null);
        setLabelOverlay(null);
        setCrawlPath(null);
        cy.batch(() => {
          cy.elements().removeClass('selected');
          cy.elements().removeClass('faded');
          cy.elements().removeClass('focus');
          cy.elements().removeClass('onpath pathedge');
        });
      }
    });
    cy.on('dbltap', (e) => {
      if (e.target === cy) {
        cy.animate({ fit: { eles: cy.elements(), padding: 30 }, duration: 250 });
      }
    });

    // Keep the floating URL overlay glued to the selected node while
    // the viewport moves. Coalesced to one update per animation frame —
    // the previous version also listened to 'render' (fires EVERY
    // canvas frame) and called a React setState from it, so a zoom
    // gesture with a selection active re-rendered React per frame and
    // made zooming feel sluggish.
    let overlayRafPending = false;
    cy.on('pan zoom', () => {
      // The card is anchored to a screen position; moving the viewport
      // invalidates it. Cheaper (and less jittery) to drop it than to
      // re-anchor per frame.
      setHoverCard(null);
      if (overlayRafPending) return;
      overlayRafPending = true;
      requestAnimationFrame(() => {
        overlayRafPending = false;
        const sel = cy.$('node.selected');
        if (sel.length > 0) {
          placeLabel(sel[0]!);
        }
      });
    });

    cy.on('dbltap', 'node', (e) => {
      const url = String(e.target.data('fullUrl') ?? '');
      if (url) {
        window.open(url, '_blank');
      }
    });

    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [graph, layout, colorMode, debouncedTuning, collapsed]);

  // Collapse state is keyed by node id and the two 2D views use
  // different id spaces (page ids vs `dir:` paths) — reset whenever the
  // view or the underlying data changes so stale folds can't leak.
  useEffect(() => {
    setCollapsed((prev) => (prev.size === 0 ? prev : new Set()));
    viewportRef.current = null;
    // Drop hover chrome too: these overlays are anchored to the old
    // renderer's screen coordinates, so without this a 2D label pill
    // stays stranded on the canvas after switching to a 3D view.
    setLabelOverlay(null);
    setHoverCard(null);
    setHover(null);
  }, [layout, graph]);

  const is3d = is3dLayout(layout);

  return (
    <div className="flex h-full w-full flex-col bg-surface-950">
      <div className="flex items-center gap-2 border-b border-surface-800 bg-surface-900/40 px-3 py-1.5">
        <div className="text-[12px] font-semibold tracking-wide text-surface-100">
          {t('viz.title', { defaultValue: 'Visualization' })}
        </div>
        <div className="ml-2 flex flex-wrap items-center gap-2 text-[11px]">
          <label className="flex items-center gap-1 text-surface-400">
            {t('viz.layout', { defaultValue: 'Layout:' })}
            <select
              className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
              value={layout}
              onChange={(e) => {
                const next = e.target.value as LayoutKind;
                setLayout(next);
                // Crawl-path tracing is a 2D (cytoscape) feature.
                if (is3dLayout(next)) setPathMode(false);
              }}
            >
              {LAYOUTS.map((l) => (
                <option key={l.key} value={l.key} title={translateLabel(l.hint, lang)}>
                  {translateLabel(l.label, lang)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1 text-surface-400">
            {t('viz.color', { defaultValue: 'Color:' })}
            <select
              className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value as ColorMode)}
            >
              <option value="crawl">{t('viz.byCrawl', { defaultValue: 'Crawl Diagram (Depth × Indexability)' })}</option>
              <option value="status">{t('viz.byStatus', { defaultValue: 'By Status' })}</option>
              <option value="depth">{t('viz.byDepth', { defaultValue: 'By Depth' })}</option>
              <option value="indexability">{t('viz.byIndexability', { defaultValue: 'By Indexability' })}</option>
              <option value="lcp">{t('viz.byLcp', { defaultValue: 'By LCP (above-fold)' })}</option>
              <option value="linkScore">{t('viz.byLinkScore', { defaultValue: 'By Link Score' })}</option>
            </select>
          </label>
          <label className="flex items-center gap-1 text-surface-400">
            {t('viz.nodes', { defaultValue: 'Nodes:' })}
            <select
              className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
              value={String(nodeLimit)}
              onChange={(e) => setNodeLimit(Number(e.target.value))}
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="150">150</option>
              <option value="300">300</option>
              <option value="500">500</option>
              <option value="1000">1,000</option>
              <option value="2000">2,000</option>
            </select>
          </label>
          <button
            className="rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-200 hover:border-blue-500 hover:bg-surface-800"
            onClick={() => {
              cyRef.current?.fit(undefined, 30);
              fgRef.current?.zoomToFit(400, 30);
            }}
            title={t('viz.fitTitle', { defaultValue: 'Fit graph to view' })}
          >
            {t('viz.fit', { defaultValue: 'Fit' })}
          </button>
          {!is3d && (
            <button
              className={`flex items-center gap-1 rounded border px-2 py-1 text-[11px] ${
                pathMode
                  ? 'border-cyan-500 bg-surface-800 text-cyan-200'
                  : 'border-surface-700 text-surface-200 hover:border-blue-500 hover:bg-surface-800'
              }`}
              onClick={() => setPathMode((v) => !v)}
              title={t('viz.crawlPathTitle', {
                defaultValue: 'Crawl Path mode — click a page node to trace its shortest path from the crawl root',
              })}
            >
              <Route className="h-3 w-3" />
              {t('viz.crawlPath', { defaultValue: 'Crawl Path' })}
            </button>
          )}
          <button
            className="flex items-center gap-1 rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-200 hover:border-blue-500 hover:bg-surface-800"
            onClick={() => loadGraph()}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {t('viz.reload', { defaultValue: 'Reload' })}
          </button>
          <div className="relative">
            <button
              data-tuning-anchor="1"
              className={`flex items-center gap-1 rounded border px-2 py-1 text-[11px] ${
                tunerOpen
                  ? 'border-blue-500 bg-surface-800 text-blue-200'
                  : 'border-surface-700 text-surface-200 hover:border-blue-500 hover:bg-surface-800'
              }`}
              onClick={() => setTunerOpen((v) => !v)}
              title={t('viz.layoutTuning', { defaultValue: 'Layout tuning' })}
              aria-label={t('viz.layoutTuning', { defaultValue: 'Layout tuning' })}
            >
              <Settings2 className="h-3 w-3" />
            </button>
            {tunerOpen && (
              <TuningPopover
                tuning={tuning}
                patch={patchTuning}
                reset={() => patchTuning(DEFAULT_TUNING)}
                reload={() => loadGraph()}
                close={() => setTunerOpen(false)}
              />
            )}
          </div>
          <div className="relative">
            <button
              className={`flex items-center gap-1 rounded border px-2 py-1 text-[11px] ${
                exportMenuOpen
                  ? 'border-blue-500 bg-surface-800 text-blue-200'
                  : 'border-surface-700 text-surface-200 hover:border-blue-500 hover:bg-surface-800'
              }`}
              onClick={() => setExportMenuOpen((v) => !v)}
              title={t('viz.exportGraph', { defaultValue: 'Export graph' })}
              aria-label={t('viz.exportGraph', { defaultValue: 'Export graph' })}
            >
              <Download className="h-3 w-3" />
              {t('viz.export', { defaultValue: 'Export' })}
            </button>
            {exportMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-10 min-w-[200px] rounded border border-surface-700 bg-surface-900 shadow-lg"
                onMouseLeave={() => setExportMenuOpen(false)}
              >
                <button
                  className="block w-full px-3 py-1.5 text-left text-[11px] text-surface-200 hover:bg-surface-800"
                  onClick={() => {
                    if (cyRef.current) exportPng(cyRef.current);
                    else if (fgRef.current) exportPng3d(fgRef.current);
                    setExportMenuOpen(false);
                  }}
                >
                  {t('viz.exportPng', { defaultValue: 'PNG (high-DPI raster)' })}
                </button>
                {!is3d && (
                  <button
                    className="block w-full px-3 py-1.5 text-left text-[11px] text-surface-200 hover:bg-surface-800"
                    onClick={() => {
                      if (cyRef.current) exportSvg(cyRef.current);
                      setExportMenuOpen(false);
                    }}
                  >
                    {t('viz.exportSvg', { defaultValue: 'SVG (vector — Illustrator/Figma)' })}
                  </button>
                )}
                {!is3d && (
                  <button
                    className="block w-full px-3 py-1.5 text-left text-[11px] text-surface-200 hover:bg-surface-800"
                    onClick={() => {
                      if (cyRef.current) exportStandaloneHtml(cyRef.current);
                      setExportMenuOpen(false);
                    }}
                  >
                    {t('viz.exportHtml', { defaultValue: 'Standalone HTML (shareable)' })}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Charcoal (#2F2F2F) canvas — the classic crawl-diagram
            backdrop that makes the depth-faded green→white nodes and
            light links read correctly. */}
        <div
          className="relative flex-1 overflow-hidden"
          style={{ backgroundColor: '#2F2F2F' }}
        >
          <div ref={containerRef} className="absolute inset-0" />
          {labelOverlay && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded border border-amber-500/70 bg-surface-950/95 px-2 py-0.5 font-mono text-[12px] text-amber-100 shadow-lg"
              style={{
                left: `${labelOverlay.x}px`,
                top: `${labelOverlay.y + labelOverlay.radius + 6}px`,
                maxWidth: '440px',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {labelOverlay.text}
            </div>
          )}
          {hoverCard && graph && (
            <NodeSummaryCard
              node={hoverCard.node}
              totalUrls={graph.totalUrls}
              x={hoverCard.x}
              y={hoverCard.y}
            />
          )}
          {graph && (
            <div className="pointer-events-none absolute left-3 top-3 rounded bg-surface-900/80 px-2 py-1 text-[10px] text-surface-300">
              {t('viz.nodesEdgesCount', {
                defaultValue: '{{nodes}} nodes · {{edges}} edges',
                nodes: graph.nodes.length.toLocaleString(),
                edges: graph.edges.length.toLocaleString(),
              })}
            </div>
          )}
          {graph && (
            <div className="pointer-events-none absolute right-3 top-3 rounded bg-surface-900/80 px-2 py-1 text-[10px] text-surface-400">
              {is3d
                ? t('viz.interactionHint3d', { defaultValue: 'Drag = rotate · Scroll = zoom · Right-drag = pan · Click = fly to node · Right-click = open' })
                : t('viz.interactionHint', { defaultValue: 'Hover = summary · Click branch = collapse/expand · Double-click node = open · Double-click canvas = fit' })}
            </div>
          )}
          {hover && (
            <div className="pointer-events-none absolute bottom-3 left-3 max-w-[60%] truncate rounded bg-surface-900/90 px-2 py-1 font-mono text-[11px] text-surface-100">
              {hover}
            </div>
          )}
          {loading && !graph && (
            <div className="absolute inset-0 flex items-center justify-center text-[12px] text-surface-500">
              {t('viz.loadingGraph', { defaultValue: 'Loading graph…' })}
            </div>
          )}
          {!loading && graph && graph.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-[12px] text-surface-500">
              {t('viz.emptyGraph', { defaultValue: 'No URLs crawled yet — start a crawl to populate the graph.' })}
            </div>
          )}
        </div>

        <aside className="flex w-72 flex-col border-l border-surface-800 bg-surface-950/40">
          {pathMode && (
            <div className="border-b border-surface-800">
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                <div className="flex items-center gap-1">
                  <Route className="h-3 w-3" /> {t('viz.crawlPath', { defaultValue: 'Crawl Path' })}
                </div>
              </div>
              <div className="max-h-64 overflow-auto px-3 pb-2">
                {!crawlPath && (
                  <div className="px-1 py-2 text-[11px] italic text-surface-500">
                    {t('viz.crawlPathHint', {
                      defaultValue: 'Select a page node to trace its shortest path from the crawl root.',
                    })}
                  </div>
                )}
                {crawlPath && crawlPath.path.length === 0 && (
                  <div className="px-1 py-2 text-[11px] italic text-surface-500">
                    {t('viz.crawlPathNone', { defaultValue: 'No path data for this node.' })}
                  </div>
                )}
                {crawlPath && crawlPath.path.length > 0 && (
                  <ol className="flex flex-col gap-1">
                    {crawlPath.path.map((p, i) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-1.5"
                        style={{ paddingLeft: `${Math.min(i, 8) * 8}px` }}
                      >
                        <span
                          className="shrink-0 rounded bg-surface-800 px-1 text-[9px] font-mono text-surface-400"
                          title={t('viz.crawlPathDepth', { defaultValue: 'Crawl depth' })}
                        >
                          {p.depth}
                        </span>
                        <span
                          className="truncate font-mono text-[10px] text-surface-200"
                          title={p.url}
                        >
                          {shortenUrl(p.url)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
                {crawlPath && crawlPath.path.length > 0 && !crawlPath.reachedRoot && (
                  <div className="mt-1.5 px-1 text-[10px] leading-snug text-amber-400/80">
                    {t('viz.crawlPathOrphan', {
                      defaultValue:
                        'Did not reach the crawl root — possible orphan (sitemap-only) page.',
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="border-b border-surface-800 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-surface-400">
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {t('viz.topAnchorTexts', { defaultValue: 'Top Anchor Texts' })}
            </div>
          </div>
          {/* Ranked list instead of the old variable-font-size word
              cloud — the cloud read as visual noise (mixed sizes, no
              counts, ragged wrapping). Rows: rank · anchor (truncated,
              full text on hover) · count, with a subtle proportional
              usage bar behind the text. */}
          <div className="flex-1 overflow-auto py-1 leading-snug">
            {anchors.length === 0 && (
              <div className="px-3 py-3 text-[11px] italic text-surface-500">
                {t('viz.anchorsEmpty', { defaultValue: 'No internal-link anchors collected yet.' })}
              </div>
            )}
            {anchors.length > 0 && (
              <ol className="flex flex-col px-1">
                {anchors.map((a, i) => {
                  const max = anchors[0]?.count ?? 1;
                  const pct = Math.max(3, Math.round((a.count / max) * 100));
                  return (
                    <li
                      key={a.anchor}
                      className="flex items-center gap-2 rounded px-2 py-[3px] hover:bg-surface-800/60"
                      title={t('viz.occurrences', {
                        defaultValue: '{{count}} occurrences',
                        count: a.count.toLocaleString(),
                      })}
                    >
                      <span className="w-6 shrink-0 text-right font-mono text-[10px] tabular-nums text-surface-500">
                        {i + 1}
                      </span>
                      <span className="relative min-w-0 flex-1">
                        <span
                          className="absolute inset-y-[1px] left-0 rounded-sm bg-blue-500/15"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="relative block truncate text-[11px] text-surface-200">
                          {a.anchor}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-surface-400">
                        {a.count.toLocaleString()}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * Screaming-Frog-style hover summary: the SEO facts you want without
 * leaving the graph. Positioned next to the hovered dot in 2D; pinned
 * to the canvas corner in 3D (`x < 0`), where a node has no stable 2D
 * anchor. Clamped so it never runs off the right/bottom edge.
 */
function NodeSummaryCard({
  node,
  totalUrls,
  x,
  y,
}: {
  node: GraphSnapshotResult['nodes'][number];
  totalUrls: number;
  x: number;
  y: number;
}) {
  const { t } = useTranslation();
  const pinned = x < 0;
  const pctOfTotal = totalUrls > 0 ? (node.inlinks / totalUrls) * 100 : 0;
  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: t('viz.cardTitle', { defaultValue: 'Page Title' }), value: node.title ?? '—' },
    {
      label: t('viz.cardResponse', { defaultValue: 'Response Code' }),
      value: node.statusCode === null ? '—' : String(node.statusCode),
      mono: true,
    },
    { label: t('viz.cardIndexability', { defaultValue: 'Indexability' }), value: node.indexability },
    { label: t('viz.cardH1', { defaultValue: 'H1' }), value: node.h1 ?? '—' },
    {
      label: t('viz.cardH2Count', { defaultValue: 'H2 Count' }),
      value: node.h2Count.toLocaleString(),
      mono: true,
    },
    {
      label: t('viz.cardDepth', { defaultValue: 'Crawl Depth' }),
      value: String(node.depth),
      mono: true,
    },
    {
      label: t('viz.cardInlinks', { defaultValue: 'Unique Inlinks' }),
      value: node.inlinks.toLocaleString(),
      mono: true,
    },
    {
      label: t('viz.cardOutlinks', { defaultValue: 'Unique Outlinks' }),
      value: node.outlinks.toLocaleString(),
      mono: true,
    },
    {
      label: t('viz.cardFollowed', { defaultValue: 'Followed Outlinks' }),
      value: node.followedOutlinks.toLocaleString(),
      mono: true,
    },
    {
      label: t('viz.cardPctTotal', { defaultValue: '% of Total' }),
      value: `${pctOfTotal.toFixed(2)}%`,
      mono: true,
    },
    {
      label: t('viz.cardWordCount', { defaultValue: 'Word Count' }),
      value: node.wordCount === null ? '—' : node.wordCount.toLocaleString(),
      mono: true,
    },
  ];
  return (
    <div
      className="pointer-events-none absolute z-20 w-[380px] max-w-[calc(100%-24px)] rounded-md border border-surface-600 p-2.5 text-[11px] shadow-2xl"
      // Fully opaque on purpose: the card sits over the graph, and any
      // translucency lets nodes/links bleed through the stat rows and
      // makes them unreadable. Set inline (not via a Tailwind opacity
      // modifier) so it can't be diluted by a utility class later.
      style={{
        backgroundColor: '#0a0a0a',
        ...(pinned
          ? { right: 12, bottom: 12 }
          : {
              left: `min(${x}px, calc(100% - 392px))`,
              top: `max(8px, min(${y}px, calc(100% - 300px)))`,
            }),
      }}
    >
      <div className="mb-1.5 break-all border-b border-surface-800 pb-1.5 font-mono text-[11px] leading-snug text-blue-300">
        {node.url}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-[3px]">
        {rows.map((r) => (
          <Fragment key={r.label}>
            <dt className="whitespace-nowrap text-surface-400">{r.label}</dt>
            <dd
              className={`min-w-0 truncate text-surface-100 ${r.mono ? 'text-right font-mono tabular-nums' : ''}`}
              title={r.value}
            >
              {r.value}
            </dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}

function TuningPopover({
  tuning,
  patch,
  reset,
  reload,
  close,
}: {
  tuning: VisTuning;
  patch: (p: Partial<VisTuning>) => void;
  reset: () => void;
  reload: () => void;
  close: () => void;
}) {
  const { t } = useTranslation();
  const popRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!popRef.current) return;
      if (popRef.current.contains(e.target as Node)) return;
      let n = e.target as HTMLElement | null;
      while (n) {
        if (n.dataset && n.dataset['tuningAnchor'] === '1') return;
        n = n.parentElement;
      }
      close();
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [close]);

  return (
    <div
      ref={popRef}
      className="absolute right-0 top-full z-30 mt-1 w-80 rounded-md border border-surface-700 bg-surface-900 p-3 text-[11px] shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[12px] font-semibold text-surface-100">{t('viz.layoutTuning', { defaultValue: 'Layout Tuning' })}</div>
        <button
          className="flex items-center gap-1 rounded border border-surface-700 px-2 py-0.5 text-[10px] text-surface-300 hover:bg-surface-800"
          onClick={reset}
          title={t('viz.resetToDefaults', { defaultValue: 'Reset to defaults' })}
        >
          <RotateCcw className="h-3 w-3" />
          {t('common.reset', { defaultValue: 'Reset' })}
        </button>
      </div>

      <Slider
        label={t('viz.nodeSize', { defaultValue: 'Node size' })}
        value={tuning.nodeSizeScale}
        min={0.4}
        max={3}
        step={0.1}
        format={(v) => `${v.toFixed(1)}×`}
        onChange={(v) => patch({ nodeSizeScale: v })}
        hint={t('viz.nodeSizeHint', { defaultValue: "Scales every dot's radius. Lower = tighter graph, higher = easier to click but more overlap." })}
      />
      <Slider
        label={t('viz.nodeDistance', { defaultValue: 'Node distance (repulsion)' })}
        value={tuning.repulsionScale}
        min={0.2}
        max={5}
        step={0.1}
        format={(v) => `${v.toFixed(1)}×`}
        onChange={(v) => patch({ repulsionScale: v })}
        hint={t('viz.repulsionHint', { defaultValue: 'How strongly nodes push each other apart. Higher = more breathing room. 3D force views only.' })}
      />
      <Slider
        label={t('viz.edgeLength', { defaultValue: 'Edge length' })}
        value={tuning.edgeLengthScale}
        min={0.3}
        max={4}
        step={0.1}
        format={(v) => `${v.toFixed(1)}×`}
        onChange={(v) => patch({ edgeLengthScale: v })}
        hint={t('viz.edgeLengthHint', { defaultValue: 'Target rest-length for connections. Higher = longer edges. 3D force views only.' })}
      />
      <Slider
        label={t('viz.edgeOpacity', { defaultValue: 'Edge opacity' })}
        value={tuning.edgeOpacity}
        min={0.05}
        max={1}
        step={0.05}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => patch({ edgeOpacity: v })}
        hint={t('viz.edgeOpacityHint', { defaultValue: 'Lower = less visual noise on dense graphs.' })}
      />

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-surface-800 pt-2">
        <div className="text-[10px] text-surface-500">
          {t('viz.changesNeedRerun', { defaultValue: 'Some changes need a layout re-run.' })}
        </div>
        <button
          className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-500"
          onClick={() => reload()}
        >
          <RefreshCw className="h-3 w-3" />
          {t('viz.rerunLayout', { defaultValue: 'Re-run layout' })}
        </button>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <label className="mb-2.5 block">
      <div className="mb-0.5 flex items-baseline justify-between">
        <span className="text-surface-300">{label}</span>
        <span className="font-mono text-surface-100">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value))}
        className="w-full accent-blue-500"
      />
      {hint && <div className="mt-0.5 text-[10px] leading-snug text-surface-500">{hint}</div>}
    </label>
  );
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 30 ? '…' + u.pathname.slice(-28) : u.pathname;
    return path === '/' ? u.host : path;
  } catch {
    return url.slice(0, 40);
  }
}
