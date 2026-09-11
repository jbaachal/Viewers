import React from 'react';

import type { HealthState } from '../../models';

const stateStyles: Record<HealthState, string> = {
  HEALTHY: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  WARNING: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  CRITICAL: 'border-red-400/40 bg-red-400/10 text-red-300',
  OFFLINE: 'border-slate-400/40 bg-slate-400/10 text-slate-300',
  UNKNOWN: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
  NOT_CONFIGURED: 'border-slate-500/40 bg-slate-500/10 text-slate-400',
};

export function SystemStatusBadge({ state }: { state: HealthState }) {
  return (
    <span
      className={`${stateStyles[state]} inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {state === 'NOT_CONFIGURED' ? 'Not configured' : state[0] + state.slice(1).toLocaleLowerCase()}
    </span>
  );
}
