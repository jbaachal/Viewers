import React from 'react';

export function ManagementMetricCard({
  label,
  value,
  detail,
  tone = 'info',
  onClick,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'info' | 'healthy' | 'warning' | 'critical';
  onClick?: () => void;
}) {
  const tones = {
    info: 'border-primary/30 bg-primary/5',
    healthy: 'border-emerald-500/30 bg-emerald-500/5',
    warning: 'border-amber-500/40 bg-amber-500/5',
    critical: 'border-red-500/40 bg-red-500/5',
  };
  const content = (
    <>
      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
        {label}
      </span>
      <strong className="text-foreground mt-2 block text-2xl tabular-nums">{value}</strong>
      <span className="text-muted-foreground mt-1 block text-xs">{detail}</span>
    </>
  );
  const className = `${tones[tone]} min-h-28 rounded-xl border p-4 text-left shadow-sm`;
  return onClick ? (
    <button
      type="button"
      className={`${className} focus-visible:ring-ring transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2`}
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    <section className={className}>{content}</section>
  );
}
