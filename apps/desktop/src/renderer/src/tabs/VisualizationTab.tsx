import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Sparkles, Settings2, RotateCcw, Download } from 'lucide-react';
import cytoscape, { type Core } from 'cytoscape';
import { useTranslation } from 'react-i18next';
import type {
  AnchorTextRow,
  GraphSnapshotResult,
  Indexability,
} from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';
import { translateLabel } from '../i18n/labels.js';

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

function exportPng(cy: Core, filename = 'freecrawl-graph.png'): void {
  const dataUrl = cy.png({
    output: 'base64uri',
    full: true,
    bg: '#0a0a0f',
    scale: 2,
  });
  void fetch(dataUrl)
    .then((r) => r.blob())
    .then((b) => downloadBlob(b, filename));
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
  parts.push(`<rect width="100%" height="100%" fill="#0a0a0f"/>`);
  cy.edges().forEach((e) => {
    const src = e.source().position();
    const tgt = e.target().position();
    const c = String((e.style('line-color') as unknown) ?? '#475569');
    parts.push(
      `<line x1="${(src.x + tx).toFixed(1)}" y1="${(src.y + ty).toFixed(1)}" x2="${(tgt.x + tx).toFixed(1)}" y2="${(tgt.y + ty).toFixed(1)}" stroke="${escapeXml(c)}" stroke-width="0.6" opacity="0.6"/>`,
    );
  });
  cy.nodes().forEach((n) => {
    const p = n.position();
    const r = Number(n.style('width') ?? 12) / 2;
    const fill = String((n.style('background-color') as unknown) ?? '#3b82f6');
    parts.push(
      `<circle cx="${(p.x + tx).toFixed(1)}" cy="${(p.y + ty).toFixed(1)}" r="${r.toFixed(1)}" fill="${escapeXml(fill)}" stroke="#0a0a0f" stroke-width="1"/>`,
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
  html, body { margin: 0; height: 100%; background: #0a0a0f; color: #e2e8f0; font-family: system-ui, sans-serif; }
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
      { selector: 'node', style: { 'background-color': 'data(color)', 'width': 'data(size)', 'height': 'data(size)', 'border-color': '#0a0a0f', 'border-width': 1, 'label': 'data(label)', 'color': '#cbd5e1', 'font-size': 9, 'text-valign': 'bottom', 'text-margin-y': 4 } },
      { selector: 'edge', style: { 'width': 0.6, 'line-color': '#475569', 'opacity': 0.4, 'curve-style': 'bezier' } },
    ],
    layout: { name: 'preset' },
  });
</script>
</body>
</html>`;
  downloadBlob(new Blob([html], { type: 'text/html' }), filename);
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

function nodeSize(inlinks: number, scale = 1): number {
  const raw = 6 + Math.log2(inlinks + 1) * 1.8;
  return Math.min(raw, 24) * scale;
}

type LabelMode = 'hover' | 'top' | 'always';

export function VisualizationTab() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  // React to data refreshes so the graph re-snapshots when a new crawl
  // populates URLs (or the active project is swapped).
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [graph, setGraph] = useState<GraphSnapshotResult | null>(null);
  const [anchors, setAnchors] = useState<AnchorTextRow[]>([]);
  const [layout, setLayout] = useState<LayoutKind>('cose');
  const [colorMode, setColorMode] = useState<ColorMode>('status');
  const [nodeLimit, setNodeLimit] = useState(150);
  const [labelMode, setLabelMode] = useState<LabelMode>('hover');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
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

    const colorFn = (n: GraphSnapshotResult['nodes'][number]) => {
      if (colorMode === 'depth') return depthColor(n.depth);
      if (colorMode === 'indexability') return indexColor(n.indexability);
      return statusColor(n.statusCode);
    };

    const TOP_LABEL_COUNT = 20;
    const topByInlinks = [...graph.nodes]
      .sort((a, b) => b.inlinks - a.inlinks)
      .slice(0, TOP_LABEL_COUNT);
    const topIds = new Set(topByInlinks.map((n) => String(n.id)));

    const elements = [
      ...graph.nodes.map((n) => ({
        data: {
          id: String(n.id),
          label: shortenUrl(n.url),
          fullUrl: n.url,
          statusCode: n.statusCode ?? '',
          inlinks: n.inlinks,
          color: colorFn(n),
          size: nodeSize(n.inlinks, debouncedTuning.nodeSizeScale),
          isTop: topIds.has(String(n.id)) ? 1 : 0,
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

    const baseLabelSelector =
      labelMode === 'always'
        ? 'node'
        : labelMode === 'top'
          ? 'node[isTop = 1]'
          : 'node.focus';

    const layoutCfg: Record<string, unknown> = {
      name: layout,
      animate: false,
      padding: 30,
    };
    if (layout === 'cose') {
      layoutCfg.nodeRepulsion = () => 1_000_000 * debouncedTuning.repulsionScale;
      layoutCfg.idealEdgeLength = () => 400 * debouncedTuning.edgeLengthScale;
      layoutCfg.edgeElasticity = () => 20;
      layoutCfg.gravity = 0;
      layoutCfg.gravityRange = 5.0;
      layoutCfg.gravityCompound = 0;
      layoutCfg.numIter = 6000;
      layoutCfg.nodeOverlap = 200;
      layoutCfg.componentSpacing = 400 * debouncedTuning.componentSpacingScale;
      layoutCfg.nestingFactor = 1.2;
      layoutCfg.initialTemp = 2000;
      layoutCfg.coolingFactor = 0.995;
      layoutCfg.minTemp = 1.0;
      layoutCfg.randomize = true;
      layoutCfg.refresh = 30;
      layoutCfg.boundingBox = { x1: 0, y1: 0, w: 5000, h: 5000 };
    } else if (layout === 'breadthfirst') {
      layoutCfg.spacingFactor = 1.6;
      layoutCfg.directed = true;
    } else if (layout === 'circle') {
      layoutCfg.spacingFactor = 1.4;
    } else if (layout === 'concentric') {
      layoutCfg.minNodeSpacing = 30;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      layoutCfg.concentric = (n: any) => Number(n.data('inlinks') ?? 0);
      layoutCfg.levelWidth = () => 1;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style: ([
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            label: '',
            color: '#e5e5e5',
            'font-size': 9,
            'font-weight': 500,
            'text-outline-color': '#0a0a0a',
            'text-outline-width': 2,
            'text-background-color': '#0a0a0a',
            'text-background-opacity': 0.6,
            'text-background-padding': 2,
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 4,
            'text-max-width': 140,
            'text-wrap': 'ellipsis',
            'border-width': 0,
            width: 'data(size)',
            height: 'data(size)',
          },
        },
        {
          selector: baseLabelSelector,
          style: {
            label: 'data(label)',
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
          selector: 'node.faded',
          style: {
            opacity: 0.25,
            'text-opacity': 0,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 0.7,
            'line-color': '#404040',
            'curve-style': 'bezier',
            'target-arrow-color': '#525252',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.6,
            opacity: debouncedTuning.edgeOpacity,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      layout: layoutCfg as any,
      wheelSensitivity: 0.2,
      minZoom: 0.05,
      maxZoom: 4,
    });

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

    cy.on('mouseover', 'node', (e) => {
      const node = e.target;
      setHover(String(node.data('fullUrl')));
      placeLabel(node);
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
    });
    cy.on('tap', (e) => {
      if (e.target !== cy) return;
      if (selectedUrlRef.current) {
        setSelectedUrl(null);
        setLabelOverlay(null);
        cy.batch(() => {
          cy.elements().removeClass('selected');
          cy.elements().removeClass('faded');
          cy.elements().removeClass('focus');
        });
      }
    });
    cy.on('dbltap', (e) => {
      if (e.target === cy) {
        cy.animate({ fit: { eles: cy.elements(), padding: 30 }, duration: 250 });
      }
    });

    cy.on('pan zoom render', () => {
      const sel = cy.$('node.selected');
      if (sel.length > 0) {
        placeLabel(sel[0]!);
      }
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
  }, [graph, layout, colorMode, labelMode, debouncedTuning]);

  return (
    <div className="flex h-full w-full flex-col bg-surface-950">
      <div className="flex items-center gap-2 border-b border-surface-800 bg-surface-900/40 px-3 py-1.5">
        <div className="text-[12px] font-semibold tracking-wide text-surface-100">
          Visualization
        </div>
        <div className="ml-2 flex flex-wrap items-center gap-2 text-[11px]">
          <label className="flex items-center gap-1 text-surface-400">
            {t('viz.layout', { defaultValue: 'Layout:' })}
            <select
              className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
              value={layout}
              onChange={(e) => setLayout(e.target.value as LayoutKind)}
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
              <option value="status">{t('viz.byStatus', { defaultValue: 'By Status' })}</option>
              <option value="depth">{t('viz.byDepth', { defaultValue: 'By Depth' })}</option>
              <option value="indexability">{t('viz.byIndexability', { defaultValue: 'By Indexability' })}</option>
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
          <label className="flex items-center gap-1 text-surface-400">
            {t('viz.labels', { defaultValue: 'Labels:' })}
            <select
              className="rounded border border-surface-700 bg-surface-950 px-2 py-1 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
              value={labelMode}
              onChange={(e) => setLabelMode(e.target.value as LabelMode)}
              title={t('viz.labelsTooltip', { defaultValue: 'Hover = on demand · Top 20 = only the most-linked hubs · All = every node' })}
            >
              <option value="hover">{t('viz.hoverOnly', { defaultValue: 'Hover Only' })}</option>
              <option value="top">{t('viz.top20', { defaultValue: 'Top 20' })}</option>
              <option value="always">{t('viz.all', { defaultValue: 'All' })}</option>
            </select>
          </label>
          <button
            className="rounded border border-surface-700 px-2 py-1 text-[11px] text-surface-200 hover:border-blue-500 hover:bg-surface-800"
            onClick={() => cyRef.current?.fit(undefined, 30)}
            title={t('viz.fitTitle', { defaultValue: 'Fit graph to view' })}
          >
            {t('viz.fit', { defaultValue: 'Fit' })}
          </button>
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
                    setExportMenuOpen(false);
                  }}
                >
                  {t('viz.exportPng', { defaultValue: 'PNG (high-DPI raster)' })}
                </button>
                <button
                  className="block w-full px-3 py-1.5 text-left text-[11px] text-surface-200 hover:bg-surface-800"
                  onClick={() => {
                    if (cyRef.current) exportSvg(cyRef.current);
                    setExportMenuOpen(false);
                  }}
                >
                  {t('viz.exportSvg', { defaultValue: 'SVG (vector — Illustrator/Figma)' })}
                </button>
                <button
                  className="block w-full px-3 py-1.5 text-left text-[11px] text-surface-200 hover:bg-surface-800"
                  onClick={() => {
                    if (cyRef.current) exportStandaloneHtml(cyRef.current);
                    setExportMenuOpen(false);
                  }}
                >
                  {t('viz.exportHtml', { defaultValue: 'Standalone HTML (shareable)' })}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="relative flex-1 overflow-hidden bg-surface-950">
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
              {t('viz.interactionHint', { defaultValue: 'Hover = neighbours · Click = select · Empty click = clear · Double-click node = open · Double-click canvas = fit' })}
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
          <div className="border-b border-surface-800 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-surface-400">
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {t('viz.topAnchorTexts', { defaultValue: 'Top Anchor Texts' })}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2 leading-snug">
            {anchors.length === 0 && (
              <div className="px-2 py-3 text-[11px] italic text-surface-500">
                {t('viz.anchorsEmpty', { defaultValue: 'No internal-link anchors collected yet.' })}
              </div>
            )}
            {anchors.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-2">
                {anchors.map((a) => {
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
        hint={t('viz.repulsionHint', { defaultValue: 'How strongly nodes push each other apart. Higher = more breathing room. Force-Directed only.' })}
      />
      <Slider
        label={t('viz.edgeLength', { defaultValue: 'Edge length' })}
        value={tuning.edgeLengthScale}
        min={0.3}
        max={4}
        step={0.1}
        format={(v) => `${v.toFixed(1)}×`}
        onChange={(v) => patch({ edgeLengthScale: v })}
        hint={t('viz.edgeLengthHint', { defaultValue: 'Target rest-length for connections. Higher = longer edges. Force-Directed only.' })}
      />
      <Slider
        label={t('viz.clusterSpacing', { defaultValue: 'Cluster spacing' })}
        value={tuning.componentSpacingScale}
        min={0.3}
        max={4}
        step={0.1}
        format={(v) => `${v.toFixed(1)}×`}
        onChange={(v) => patch({ componentSpacingScale: v })}
        hint={t('viz.clusterSpacingHint', { defaultValue: 'Gap between disconnected sub-graphs. Higher = isolated clusters spread further apart.' })}
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
