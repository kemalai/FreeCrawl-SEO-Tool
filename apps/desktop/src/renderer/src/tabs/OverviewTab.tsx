import { useEffect, useState } from 'react';
import type { CrawlSummary } from '@freecrawl/shared-types';
import { useAppStore } from '../store.js';

export function OverviewTab() {
  const progress = useAppStore((s) => s.progress);
  const [summary, setSummary] = useState<CrawlSummary | null>(null);

  useEffect(() => {
    const load = async () => {
      const s = await window.freecrawl.summaryGet();
      setSummary(s);
    };
    void load();
    const id = setInterval(load, 1500);
    return () => clearInterval(id);
  }, [progress?.crawled]);

  if (!summary || summary.total === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mb-2 text-lg font-semibold text-surface-200">No crawl yet</div>
          <div className="text-sm text-surface-400">
            Enter a URL above and click <span className="font-medium text-surface-200">Start</span>{' '}
            to begin crawling.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-5">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCard title="Total URLs" value={summary.total.toLocaleString()} />
        <SummaryCard
          title="Avg Response"
          value={`${summary.avgResponseTimeMs.toLocaleString()} ms`}
        />
        <SummaryCard title="Total Bytes" value={formatBytes(summary.totalBytes)} />

        <BreakdownCard title="Status Codes" data={summary.byStatus} colorOf={statusColor} />
        <BreakdownCard title="Content Type" data={summary.byContentKind} />
        <BreakdownCard
          title="Indexability"
          data={summary.byIndexability}
          colorOf={indexabilityColor}
        />
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-surface-800 bg-surface-900 p-4">
      <div className="text-xs uppercase tracking-wide text-surface-500">{title}</div>
      <div className="mt-2 font-mono text-2xl font-semibold text-surface-50">{value}</div>
    </div>
  );
}

function BreakdownCard<T extends Record<string, number>>({
  title,
  data,
  colorOf,
}: {
  title: string;
  data: T;
  colorOf?: (key: string) => string;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  return (
    <div className="rounded-md border border-surface-800 bg-surface-900 p-4">
      <div className="mb-3 text-xs uppercase tracking-wide text-surface-500">{title}</div>
      <div className="space-y-1.5">
        {entries.map(([key, value]) => {
          const pct = total > 0 ? (value / total) * 100 : 0;
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <div className="w-28 truncate text-surface-300">{key}</div>
              <div className="relative h-4 flex-1 overflow-hidden rounded bg-surface-800">
                <div
                  className={`h-full ${colorOf?.(key) ?? 'bg-accent-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-12 text-right font-mono text-surface-200">
                {value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function statusColor(status: string): string {
  const n = Number.parseInt(status, 10);
  if (Number.isNaN(n)) return 'bg-surface-600';
  if (n >= 200 && n < 300) return 'bg-emerald-600';
  if (n >= 300 && n < 400) return 'bg-amber-500';
  if (n >= 400 && n < 500) return 'bg-orange-600';
  if (n >= 500) return 'bg-red-600';
  return 'bg-surface-600';
}

function indexabilityColor(key: string): string {
  if (key === 'indexable') return 'bg-emerald-600';
  if (key.startsWith('non-indexable:server-error')) return 'bg-red-600';
  if (key.startsWith('non-indexable:client-error')) return 'bg-orange-600';
  return 'bg-amber-500';
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}
