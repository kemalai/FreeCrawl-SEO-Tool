import { useEffect, useRef, useState } from 'react';
import { X, RefreshCw, Sparkles } from 'lucide-react';
import cytoscape, { type Core } from 'cytoscape';
import type {
  AnchorTextRow,
  GraphSnapshotResult,
  Indexability,
} from '@freecrawl/shared-types';

interface Props {
  open: boolean;
  onClose: () => void;
}

type LayoutKind = 'cose' | 'breadthfirst' | 'circle' | 'concentric';

const LAYOUTS: { key: LayoutKind; label: string; hint: string }[] = [
  { key: 'cose', label: 'Force-Directed', hint: 'Compound spring embedder' },
  { key: 'breadthfirst', label: 'Tree (BFS)', hint: 'Roots-to-leaves layered' },
  { key: 'circle', label: 'Circle', hint: 'Equal radial spacing' },
  { key: 'concentric', label: 'Concentric', hint: 'By inlinks (centre = most-linked)' },
];

type ColorMode = 'status' | 'depth' | 'indexability';

function statusColor(code: number | null): string {
  if (code === null) return '#737373';
  if (code >= 500) return '#dc2626';
  if (code >= 400) return '#ea580c';
  if (code >= 300) return '#d97706';
  if (code >= 200) return '#16a34a';
  return '#737373';
}

function depthColor(d: number): string {
  // Bluescale 0-10
  const palette = [
    '#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6',
    '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#a3a3a3',
  ];
  return palette[Math.min(d, palette.length - 1)] ?? '#a3a3a3';
}

function indexColor(i: Indexability): string {
  if (i === 'indexable') return '#16a34a';
  if (i.startsWith('non-indexable')) return '#dc2626';
  return '#737373';
}

function nodeSize(inlinks: number): number {
  // Log-scale: a 100x inlinks node is only ~3x bigger than a singleton
  // — keeps the canvas legible on power-law sites.
  return 8 + Math.log2(inlinks + 1) * 4;
}

export function VisualizationDialog({ open, onClose }: Props) {
  const [graph, setGraph] = useState<GraphSnapshotResult | null>(null);
  const [anchors, setAnchors] = useState<AnchorTextRow[]>([]);
  const [layout, setLayout] = useState<LayoutKind>('cose');
  const [colorMode, setColorMode] = useState<ColorMode>('status');
  const [nodeLimit, setNodeLimit] = useState(500);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    void loadGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nodeLimit]);

  async function loadGraph() {
    setLoading(true);
    try {
      const [g, a] = await Promise.all([
        window.freecrawl.graphSnapshot({ nodeLimit }),
        window.freecrawl.topAnchorTexts(120),
      ]);
      setGraph(g);
      setAnchors(a);
    } finally {
      setLoading(false);
    }
  }

  // Render Cytoscape whenever graph / layout / colorMode change.
  useEffect(() => {
    if (!open || !containerRef.current || !graph) return;

    const colorFn = (n: GraphSnapshotResult['nodes'][number]) => {
      if (colorMode === 'depth') return depthColor(n.depth);
      if (colorMode === 'indexability') return indexColor(n.indexability);
      return statusColor(n.statusCode);
    };

    const elements = [
      ...graph.nodes.map((n) => ({
        data: {
          id: String(n.id),
          label: shortenUrl(n.url),
          fullUrl: n.url,
          statusCode: n.statusCode ?? '',
          inlinks: n.inlinks,
          color: colorFn(n),
          size: nodeSize(n.inlinks),
        },
      })),
      ...graph.edges.map((e) => ({
        data: {
          id: `e${e.source}-${e.target}`,
          source: String(e.source),
          target: String(e.target),
        },
      })),
    ];

    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      // Style is loosely typed — cytoscape's TS defs don't model
      // `data(...)` mapper expressions cleanly. We cast to keep the
      // declarative form readable.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style: ([
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            label: 'data(label)',
            color: '#e5e5e5',
            'font-size': 8,
            'text-outline-color': '#171717',
            'text-outline-width': 1,
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 2,
            'text-max-width': 80,
            width: 'data(size)',
            height: 'data(size)',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 0.6,
            'line-color': '#404040',
            'curve-style': 'bezier',
            'target-arrow-color': '#525252',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.6,
            opacity: 0.5,
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any),
      layout: {
        name: layout,
        animate: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      wheelSensitivity: 0.2,
    });

    cy.on('mouseover', 'node', (e) => {
      setHover(String(e.target.data('fullUrl')));
    });
    cy.on('mouseout', 'node', () => setHover(null));

    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [open, graph, layout, colorMode]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="flex h-[88vh] w-[1280px] max-w-[98vw] flex-col overflow-hidden rounded-md border border-surface-700 bg-surface-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-surface-800 px-4 py-2">
          <div className="text-sm font-semibold tracking-wide text-surface-100">
            Visualization
          </div>
          <div className="ml-3 flex items-center gap-2 text-[11px]">
            <label className="flex items-center gap-1 text-surface-400">
              Layout:
              <select
                className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
                value={layout}
                onChange={(e) => setLayout(e.target.value as LayoutKind)}
              >
                {LAYOUTS.map((l) => (
                  <option key={l.key} value={l.key} title={l.hint}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1 text-surface-400">
              Color:
              <select
                className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
                value={colorMode}
                onChange={(e) => setColorMode(e.target.value as ColorMode)}
              >
                <option value="status">By Status</option>
                <option value="depth">By Depth</option>
                <option value="indexability">By Indexability</option>
              </select>
            </label>
            <label className="flex items-center gap-1 text-surface-400">
              Nodes:
              <select
                className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
                value={String(nodeLimit)}
                onChange={(e) => setNodeLimit(Number(e.target.value))}
              >
                <option value="200">200</option>
                <option value="500">500</option>
                <option value="1000">1,000</option>
                <option value="2000">2,000</option>
                <option value="5000">5,000</option>
              </select>
            </label>
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
              Reload
            </button>
          </div>
          <button
            className="ml-auto rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
            onClick={onClose}
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="relative flex-1 bg-surface-950">
            <div ref={containerRef} className="absolute inset-0" />
            {graph && (
              <div className="pointer-events-none absolute left-3 top-3 rounded bg-surface-900/80 px-2 py-1 text-[10px] text-surface-300">
                {graph.nodes.length.toLocaleString()} nodes ·{' '}
                {graph.edges.length.toLocaleString()} edges
              </div>
            )}
            {hover && (
              <div className="pointer-events-none absolute bottom-3 left-3 max-w-[60%] truncate rounded bg-surface-900/90 px-2 py-1 font-mono text-[11px] text-surface-100">
                {hover}
              </div>
            )}
            {loading && !graph && (
              <div className="absolute inset-0 flex items-center justify-center text-[12px] text-surface-500">
                Loading graph…
              </div>
            )}
          </div>

          <aside className="flex w-72 flex-col border-l border-surface-800 bg-surface-950/40">
            <div className="border-b border-surface-800 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-surface-400">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Top Anchor Texts
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2 leading-snug">
              {anchors.length === 0 && (
                <div className="px-2 py-3 text-[11px] italic text-surface-500">
                  No internal-link anchors collected yet.
                </div>
              )}
              {anchors.length > 0 && (
                <div className="flex flex-wrap items-baseline gap-2">
                  {anchors.map((a) => {
                    // Linear interpolate font size from log(count) so the
                    // densest term is ~2.6x the rarest.
                    const max = anchors[0]?.count ?? 1;
                    const min = anchors[anchors.length - 1]?.count ?? 1;
                    const range = Math.max(1, Math.log2(max) - Math.log2(min));
                    const frac =
                      (Math.log2(a.count) - Math.log2(min)) / range;
                    const size = 9 + frac * 13;
                    return (
                      <span
                        key={a.anchor}
                        className="text-surface-200"
                        style={{ fontSize: `${size}px` }}
                        title={`${a.count.toLocaleString()} occurrences`}
                      >
                        {a.anchor}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
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
