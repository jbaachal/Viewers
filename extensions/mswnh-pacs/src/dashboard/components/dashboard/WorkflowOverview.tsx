import React from 'react';

import type { AgeingBucket, StudyStatus, WorkflowStageCount } from '../../models';
import { DashboardSection } from './DashboardSection';

const ageingStyles = {
  critical: 'bg-red-500',
  warning: 'bg-amber-400',
  healthy: 'bg-emerald-400',
  info: 'bg-sky-400',
  neutral: 'bg-slate-500',
};

export function WorkflowOverview({
  stages,
  ageing,
  selectedStatus,
  onSelectStatus,
}: {
  stages: WorkflowStageCount[];
  ageing: AgeingBucket[];
  selectedStatus: StudyStatus | null;
  onSelectStatus: (status: StudyStatus | null) => void;
}) {
  const combinedStages = [
    ...stages.filter(stage => !['VERIFIED', 'CANCELLED', 'INCOMPLETE'].includes(stage.status)),
    {
      status: 'INCOMPLETE' as const,
      label: 'Cancelled / Incomplete',
      count: stages
        .filter(stage => ['CANCELLED', 'INCOMPLETE'].includes(stage.status))
        .reduce((sum, stage) => sum + stage.count, 0),
    },
  ];
  const maxAgeing = Math.max(...ageing.map(bucket => bucket.count), 1);

  return (
    <DashboardSection
      title="Examination workflow"
      description="Select a stage to filter the priority preview"
      action={
        selectedStatus && (
          <button
            type="button"
            onClick={() => onSelectStatus(null)}
            className="text-primary hover:text-primary/80 text-xs font-medium"
          >
            Clear filter
          </button>
        )
      }
    >
      <div className="grid gap-5 p-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {combinedStages.map(stage => {
            const active = selectedStatus === stage.status;
            return (
              <button
                type="button"
                key={stage.status}
                onClick={() => onSelectStatus(active ? null : stage.status)}
                aria-pressed={active}
                className={`border-input/60 hover:border-primary/50 rounded-lg border p-3 text-left transition-colors ${active ? 'border-primary bg-primary/10' : 'bg-background/30'}`}
              >
                <span className="text-muted-foreground block text-xs">{stage.label}</span>
                <span className="text-foreground mt-1 block text-xl font-semibold">
                  {stage.count}
                </span>
              </button>
            );
          })}
        </div>
        <div>
          <h3 className="text-foreground mb-3 text-sm font-medium">Workflow ageing</h3>
          <div className="space-y-2.5">
            {ageing.map(bucket => (
              <div key={bucket.id}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{bucket.label}</span>
                  <span className="text-foreground font-semibold tabular-nums">{bucket.count}</span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full ${ageingStyles[bucket.tone]}`}
                    role="progressbar"
                    aria-label={`${bucket.label}: ${bucket.count} studies`}
                    aria-valuemin={0}
                    aria-valuemax={maxAgeing}
                    aria-valuenow={bucket.count}
                    style={{
                      width: `${Math.max((bucket.count / maxAgeing) * 100, bucket.count ? 8 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardSection>
  );
}
