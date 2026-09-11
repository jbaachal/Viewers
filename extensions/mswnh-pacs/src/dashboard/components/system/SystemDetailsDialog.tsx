import React from 'react';
import { Button, Icons } from '@ohif/ui-next';

import type { SystemHealthComponent } from '../../models';
import { formatKampalaDateTime } from '../../utils/formatDashboardDate';
import { SystemStatusBadge } from './SystemStatusBadge';

export function SystemDetailsDialog({
  component,
  onClose,
}: {
  component: SystemHealthComponent | null;
  onClose: () => void;
}) {
  if (!component) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="system-component-title"
        className="border-input bg-card w-full max-w-lg rounded-xl border p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              {component.kind.replaceAll('_', ' ')}
            </p>
            <h2 id="system-component-title" className="text-foreground mt-1 text-xl font-semibold">
              {component.name}
            </h2>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Close details" onClick={onClose}>
            <Icons.Close className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4"><SystemStatusBadge state={component.state} /></div>
        <p className="text-foreground mt-4 text-sm leading-6">{component.message}</p>
        <dl className="border-input/60 mt-5 grid gap-4 rounded-lg border p-4 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Last checked</dt><dd className="text-foreground mt-1">{formatKampalaDateTime(component.lastCheckedAt)}</dd></div>
          <div><dt className="text-muted-foreground">Response time</dt><dd className="text-foreground mt-1 tabular-nums">{component.responseTimeMs === null ? 'Not applicable' : `${component.responseTimeMs} ms`}</dd></div>
          {component.lastStudyReceivedAt && <div className="sm:col-span-2"><dt className="text-muted-foreground">Last study received</dt><dd className="text-foreground mt-1">{formatKampalaDateTime(component.lastStudyReceivedAt)}</dd></div>}
        </dl>
        <p className="text-muted-foreground mt-4 text-xs">This is a read-only status view. No infrastructure action is available here.</p>
      </section>
    </div>
  );
}
