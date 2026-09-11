import React from 'react';

import type { ModalityActivity } from '../../models';
import { DashboardSection } from './DashboardSection';

const stateStyles: Record<ModalityActivity['state'], string> = {
  RECENT: 'bg-emerald-400',
  IDLE: 'bg-slate-400',
  NO_DATA: 'bg-amber-400',
};

const stateLabels: Record<ModalityActivity['state'], string> = {
  RECENT: 'RECENT RECEIPT',
  IDLE: 'NO RECENT STUDY',
  NO_DATA: 'NO DATA',
};

function relativeTime(value: string | null): string {
  if (!value) return 'No studies received';
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min ago`;
}

export function ModalityActivityGrid({ activity }: { activity: ModalityActivity[] }) {
  return (
    <DashboardSection
      title="Modality activity"
      description="Study receipts from the archive; this does not indicate device connectivity"
    >
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {activity.map(item => (
          <article
            key={item.modality}
            className="border-input/60 bg-background/30 rounded-lg border p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-foreground font-semibold">{item.label}</span>
              <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
                <span className={`h-2 w-2 rounded-full ${stateStyles[item.state]}`} />
                {stateLabels[item.state]}
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-foreground text-xl font-semibold">{item.studiesToday}</div>
                <div className="text-muted-foreground text-[11px]">studies today</div>
              </div>
              <div className="text-muted-foreground text-right text-[11px]">
                Last received
                <div className="text-foreground mt-0.5">
                  {relativeTime(item.lastStudyReceivedAt)}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </DashboardSection>
  );
}
