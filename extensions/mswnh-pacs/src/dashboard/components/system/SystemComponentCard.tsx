import React from 'react';
import { Button } from '@ohif/ui-next';

import type { SystemHealthComponent } from '../../models';
import { formatKampalaDateTime } from '../../utils/formatDashboardDate';
import { SystemStatusBadge } from './SystemStatusBadge';

export function SystemComponentCard({
  component,
  onViewDetails,
}: {
  component: SystemHealthComponent;
  onViewDetails: (component: SystemHealthComponent) => void;
}) {
  return (
    <article className="border-input/60 bg-card flex min-h-52 flex-col rounded-xl border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">
            {component.kind.replaceAll('_', ' ')}
          </p>
          <h2 className="text-foreground mt-1 font-semibold">{component.name}</h2>
        </div>
        <SystemStatusBadge state={component.state} />
      </div>
      <p className="text-muted-foreground mt-3 flex-1 text-sm leading-5">{component.message}</p>
      <dl className="border-input/40 mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Last checked</dt>
          <dd className="text-foreground mt-1">{formatKampalaDateTime(component.lastCheckedAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Response time</dt>
          <dd className="text-foreground mt-1 tabular-nums">
            {component.responseTimeMs === null ? 'Not applicable' : `${component.responseTimeMs} ms`}
          </dd>
        </div>
      </dl>
      <Button
        type="button"
        variant="outline"
        className="mt-4 w-full"
        onClick={() => onViewDetails(component)}
      >
        View details
      </Button>
    </article>
  );
}
