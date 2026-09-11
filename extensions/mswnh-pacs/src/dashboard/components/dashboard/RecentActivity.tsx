import React from 'react';

import type { WorkflowEvent } from '../../models';
import { DashboardSection } from './DashboardSection';

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kampala',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function RecentActivity({ activity }: { activity: WorkflowEvent[] }) {
  return (
    <DashboardSection
      title="Recent activity"
      description="Latest workflow events"
    >
      <ol className="max-h-96 overflow-y-auto p-4">
        {activity.map((event, index) => (
          <li
            key={event.id}
            className="relative flex gap-3 pb-4 last:pb-0"
          >
            {index < activity.length - 1 && (
              <span className="bg-input absolute bottom-0 left-[5px] top-3 w-px" />
            )}
            <span className="bg-primary ring-card relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4" />
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm leading-5">{event.description}</p>
              <div className="text-muted-foreground mt-0.5 flex justify-between gap-3 text-[11px]">
                <span className="truncate">{event.actor}</span>
                <time className="shrink-0">{formatTime(event.occurredAt)}</time>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </DashboardSection>
  );
}
