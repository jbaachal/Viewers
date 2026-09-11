import React from 'react';

export function DashboardSection({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`border-input/60 bg-card overflow-hidden rounded-xl border shadow-sm ${className}`}
    >
      <div className="border-input/50 flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="text-foreground text-base font-semibold">{title}</h2>
          {description && <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
