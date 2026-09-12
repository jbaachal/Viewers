import React from 'react';

export function DashboardLoadingSkeleton({ label }: { label: string }) {
  return (
    <div
      className="animate-pulse space-y-5 p-4 md:p-6"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <div className="bg-muted h-7 w-64 max-w-full rounded" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="border-input/40 bg-card h-32 rounded-xl border p-4"
          >
            <div className="bg-muted h-3 w-2/3 rounded" />
            <div className="bg-muted mt-8 h-7 w-1/3 rounded" />
            <div className="bg-muted mt-3 h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
      <div className="border-input/40 bg-card h-64 rounded-xl border p-4">
        <div className="bg-muted h-4 w-48 max-w-full rounded" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="bg-muted h-8 rounded"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
