import React from 'react';

import type { StudyPriority, StudyStatus } from '../../models';

const priorityStyles: Record<StudyPriority, string> = {
  EMERGENCY: 'border-red-500/40 bg-red-500/10 text-red-300',
  URGENT: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  ROUTINE: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
};

const statusStyles: Record<StudyStatus, string> = {
  RECEIVED: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  ASSIGNED: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
  IN_REVIEW: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  REPORTED: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  VERIFIED: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  CANCELLED: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
  INCOMPLETE: 'border-red-500/40 bg-red-500/10 text-red-300',
};

export function PriorityBadge({ priority }: { priority: StudyPriority }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${priorityStyles[priority]}`}
    >
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: StudyStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${statusStyles[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
