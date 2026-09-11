import React from 'react';

import type { TimeSeriesPoint } from '../../models';

export function ManagementBarChart({
  title,
  description,
  data,
  suffix = '',
  onSelect,
}: {
  title: string;
  description?: string;
  data: TimeSeriesPoint[];
  suffix?: string;
  onSelect?: (point: TimeSeriesPoint) => void;
}) {
  const maximum = Math.max(...data.map(item => item.value), 1);
  return (
    <section className="border-input/60 bg-card rounded-xl border p-4 shadow-sm">
      <h2 className="text-foreground text-base font-semibold">{title}</h2>
      {description && <p className="text-muted-foreground mt-1 text-xs">{description}</p>}
      {data.length === 0 ? (
        <div className="text-muted-foreground grid min-h-40 place-items-center text-sm">
          No data for this selection.
        </div>
      ) : (
        <div className="mt-4 space-y-2" role="list" aria-label={title}>
          {data.map(item => {
            const row = (
              <>
                <span className="text-foreground w-28 shrink-0 truncate text-xs" title={item.label}>
                  {item.label}
                </span>
                <span className="bg-muted h-3 min-w-0 flex-1 overflow-hidden rounded-full">
                  <span
                    className="bg-primary block h-full rounded-full"
                    style={{ width: `${Math.max((item.value / maximum) * 100, item.value ? 3 : 0)}%` }}
                  />
                </span>
                <span className="text-foreground w-16 text-right text-xs font-semibold tabular-nums">
                  {item.value.toLocaleString()}{suffix}
                </span>
              </>
            );
            return onSelect ? (
              <button
                type="button"
                key={item.label}
                role="listitem"
                onClick={() => onSelect(item)}
                className="hover:bg-muted/40 focus-visible:ring-ring flex w-full items-center gap-3 rounded p-1 text-left focus-visible:outline-none focus-visible:ring-1"
              >
                {row}
              </button>
            ) : (
              <div key={item.label} role="listitem" className="flex items-center gap-3 p-1">
                {row}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
