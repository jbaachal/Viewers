import React from 'react';
import { Icons } from '@ohif/ui-next';

import type { DashboardMetric, StatusTone } from '../../models';

const toneStyles: Record<StatusTone, { accent: string; icon: string; trend: string }> = {
  critical: {
    accent: 'border-l-red-500',
    icon: 'bg-red-500/10 text-red-400',
    trend: 'text-red-300',
  },
  warning: {
    accent: 'border-l-amber-400',
    icon: 'bg-amber-400/10 text-amber-300',
    trend: 'text-amber-200',
  },
  healthy: {
    accent: 'border-l-emerald-400',
    icon: 'bg-emerald-400/10 text-emerald-300',
    trend: 'text-emerald-200',
  },
  info: {
    accent: 'border-l-sky-400',
    icon: 'bg-sky-400/10 text-sky-300',
    trend: 'text-sky-200',
  },
  neutral: {
    accent: 'border-l-slate-500',
    icon: 'bg-slate-500/10 text-slate-300',
    trend: 'text-slate-300',
  },
};

const metricIcons: Record<DashboardMetric['id'], string> = {
  examsToday: 'PatientStudyList',
  unreadExams: 'ListView',
  emergencyStudies: 'status-alert',
  assignedToMe: 'Checked',
  pendingVerification: 'Clipboard',
  averageTurnaroundTime: 'SortingAscending',
  delayedExams: 'StatusWarning',
  systemHealth: 'CloudSettings',
};

export function DashboardMetricCard({
  metric,
  onSelect,
}: {
  metric: DashboardMetric;
  onSelect?: (metric: DashboardMetric) => void;
}) {
  const tone = toneStyles[metric.tone];
  return (
    <button
      type="button"
      disabled={!onSelect}
      onClick={() => onSelect?.(metric)}
      className={`border-input/60 bg-card focus-visible:ring-ring min-h-32 group rounded-xl border border-l-4 p-4 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 ${onSelect ? 'hover:bg-muted/30' : 'cursor-default'} ${tone.accent}`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-muted-foreground text-xs font-medium leading-4">{metric.label}</span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
        >
          <Icons.ByName
            name={metricIcons[metric.id]}
            className="h-4 w-4"
          />
        </span>
      </span>
      <span className="text-foreground mt-3 block text-2xl font-semibold tracking-tight">
        {metric.value}
      </span>
      <span className={`mt-1 block text-[11px] ${tone.trend}`}>{metric.comparison}</span>
    </button>
  );
}
