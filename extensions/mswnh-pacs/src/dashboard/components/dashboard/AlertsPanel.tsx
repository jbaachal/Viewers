import React from 'react';
import { Button } from '@ohif/ui-next';

import type { DashboardAlert } from '../../models';
import { DashboardSection } from './DashboardSection';

const severityStyles: Record<DashboardAlert['severity'], string> = {
  CRITICAL: 'bg-red-500',
  WARNING: 'bg-amber-400',
  INFO: 'bg-sky-400',
};

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kampala',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function AlertsPanel({
  alerts,
  onAcknowledge,
}: {
  alerts: DashboardAlert[];
  onAcknowledge: (alertId: string) => void;
}) {
  return (
    <DashboardSection
      title="Alerts and exceptions"
      description={`${alerts.filter(alert => !alert.acknowledged).length} require attention`}
    >
      <div className="max-h-96 divide-y divide-slate-800 overflow-y-auto">
        {alerts.map(alert => (
          <article
            key={alert.id}
            className={`flex gap-3 p-4 ${alert.acknowledged ? 'opacity-60' : ''}`}
          >
            <span
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${severityStyles[alert.severity]}`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-foreground text-sm font-medium">{alert.title}</h3>
                  <p className="text-muted-foreground mt-1 text-xs leading-5">{alert.message}</p>
                </div>
                <time className="text-muted-foreground shrink-0 text-[11px]">
                  {formatTime(alert.occurredAt)}
                </time>
              </div>
              {!alert.acknowledged && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 px-2 text-xs"
                  onClick={() => onAcknowledge(alert.id)}
                >
                  Acknowledge
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </DashboardSection>
  );
}
