import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type {
  PagesPerDirectoryRow,
  StatusCodeHistogramRow,
  DepthHistogramRow,
  ResponseTimeHistogramRow,
} from '@freecrawl/shared-types';

interface Props {
  open: boolean;
  onClose: () => void;
}

type ReportKind = 'pages-per-dir' | 'status-codes' | 'depth' | 'response-time';

interface ReportRow {
  /** Display key (directory path / status code / depth label). */
  key: string;
  /** Optional column shown left-of-key (e.g. status-class label). */
  badge?: string;
  count: number;
}

const REPORT_LABELS: Record<ReportKind, string> = {
  'pages-per-dir': 'Pages per Directory',
  'status-codes': 'Status Code Histogram',
  depth: 'Depth Histogram',
  'response-time': 'Response Time Histogram',
};

const KEY_LABELS: Record<ReportKind, string> = {
  'pages-per-dir': 'Directory',
  'status-codes': 'Status',
  depth: 'Depth',
  'response-time': 'Bucket',
};

export function ReportsDialog({ open, onClose }: Props) {
  const [kind, setKind] = useState<ReportKind>('pages-per-dir');
  const [depth, setDepth] = useState(1);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        if (kind === 'pages-per-dir') {
          const r = await window.freecrawl.reportsPagesPerDirectory({ depth, limit: 1000 });
          if (!cancelled)
            setRows(r.map((x: PagesPerDirectoryRow) => ({ key: x.directory, count: x.count })));
        } else if (kind === 'status-codes') {
          const r = await window.freecrawl.reportsStatusCodeHistogram();
          if (!cancelled)
            setRows(
              r.map((x: StatusCodeHistogramRow) => ({
                key: x.status === null ? 'No response' : String(x.status),
                badge: statusBadge(x.status),
                count: x.count,
              })),
            );
        } else if (kind === 'depth') {
          const r = await window.freecrawl.reportsDepthHistogram();
          if (!cancelled)
            setRows(r.map((x: DepthHistogramRow) => ({ key: String(x.depth), count: x.count })));
        } else {
          const r = await window.freecrawl.reportsResponseTimeHistogram();
          if (!cancelled)
            setRows(
              r.map((x: ResponseTimeHistogramRow) => ({
                key: x.label,
                badge: rtBadge(x.label),
                count: x.count,
              })),
            );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, kind, depth]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-[760px] flex-col rounded-md border border-surface-700 bg-surface-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-surface-800 px-4 py-2.5">
          <div className="text-sm font-semibold tracking-wide text-surface-100">
            {REPORT_LABELS[kind]}
          </div>
          <button
            className="ml-auto rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
            onClick={onClose}
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-surface-800 bg-surface-900/50 px-4 py-2 text-[11px]">
          <label className="flex items-center gap-1.5">
            <span className="text-surface-400">Report</span>
            <select
              className="rounded border border-surface-700 bg-surface-950 px-2 py-0.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
              value={kind}
              onChange={(e) => setKind(e.target.value as ReportKind)}
            >
              <option value="pages-per-dir">Pages per Directory</option>
              <option value="status-codes">Status Code Histogram</option>
              <option value="depth">Depth Histogram</option>
              <option value="response-time">Response Time Histogram</option>
            </select>
          </label>
          {kind === 'pages-per-dir' && (
            <label className="flex items-center gap-1.5">
              <span className="text-surface-400">Group at depth</span>
              <select
                className="rounded border border-surface-700 bg-surface-950 px-2 py-0.5 text-[11px] text-surface-100 focus:border-blue-500 focus:outline-none"
                value={depth}
                onChange={(e) => setDepth(Number.parseInt(e.target.value, 10))}
              >
                <option value={1}>1 (top-level)</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </label>
          )}
          <span className="ml-auto text-surface-500">
            {loading
              ? 'Loading…'
              : `${rows.length.toLocaleString()} rows · ${total.toLocaleString()} URLs`}
          </span>
        </div>

        <div className="flex-1 overflow-auto px-4 py-3 text-[11px]">
          {rows.length === 0 && !loading && (
            <div className="p-6 text-center text-surface-500">
              No data — run a crawl first.
            </div>
          )}
          {rows.length > 0 && (
            <table className="w-full">
              <thead className="sticky top-0 bg-surface-900">
                <tr className="text-surface-400">
                  <th className="w-2/3 py-1 pr-3 text-left font-medium">{KEY_LABELS[kind]}</th>
                  <th className="w-24 py-1 pr-3 text-right font-medium">Count</th>
                  <th className="py-1 text-left font-medium">Share</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const widthPct = max > 0 ? Math.round((r.count / max) * 100) : 0;
                  const sharePct = total > 0 ? ((r.count / total) * 100).toFixed(1) : '0.0';
                  return (
                    <tr
                      key={r.key}
                      className="border-b border-surface-900 last:border-0 hover:bg-surface-900/50"
                    >
                      <td className="break-all py-1 pr-3 align-top font-mono text-surface-100">
                        {r.badge && (
                          <span className="mr-2 rounded bg-surface-800 px-1.5 py-0.5 text-[9px] uppercase text-surface-400">
                            {r.badge}
                          </span>
                        )}
                        {r.key}
                      </td>
                      <td className="py-1 pr-3 text-right align-top font-mono text-surface-100">
                        {r.count.toLocaleString()}
                      </td>
                      <td className="py-1 align-top">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-32 rounded bg-surface-800">
                            <div
                              className="h-full rounded bg-blue-600"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-surface-400">
                            {sharePct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-surface-800 px-4 py-2.5">
          <button
            className="rounded border border-surface-700 px-3 py-1 text-[11px] hover:bg-surface-800"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function statusBadge(status: number | null): string {
  if (status === null) return 'NET';
  if (status >= 200 && status < 300) return '2xx';
  if (status >= 300 && status < 400) return '3xx';
  if (status >= 400 && status < 500) return '4xx';
  if (status >= 500 && status < 600) return '5xx';
  return '?';
}

/**
 * One-letter perf class for a response-time bucket label. Lets users skim
 * the histogram for "where am I losing performance?" without re-reading
 * the bucket boundaries.
 */
function rtBadge(label: string): string {
  if (label === 'No response') return 'ERR';
  if (label === '< 100ms' || label === '100–500ms') return 'OK';
  if (label === '500ms–1s') return 'WARN';
  return 'SLOW';
}
