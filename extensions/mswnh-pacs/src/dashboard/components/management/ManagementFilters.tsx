import React from 'react';
import { Button, Input } from '@ohif/ui-next';

import type { ManagementReportFilters } from '../../models';

export function ManagementFilters({
  value,
  loading,
  onChange,
  onApply,
  onReset,
}: {
  value: ManagementReportFilters;
  loading: boolean;
  onChange: (next: ManagementReportFilters) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const field = (patch: Partial<ManagementReportFilters>) => onChange({ ...value, ...patch });
  return (
    <form
      className="border-input/60 bg-card grid gap-3 rounded-xl border p-4 md:grid-cols-3 xl:grid-cols-7"
      onSubmit={event => {
        event.preventDefault();
        onApply();
      }}
    >
      <label className="text-muted-foreground grid gap-1 text-xs">
        From
        <Input type="date" value={value.from} onChange={event => field({ from: event.target.value })} />
      </label>
      <label className="text-muted-foreground grid gap-1 text-xs">
        To
        <Input type="date" value={value.to} onChange={event => field({ to: event.target.value })} />
      </label>
      <label className="text-muted-foreground grid gap-1 text-xs">
        Modality
        <select className="border-input bg-background h-9 rounded-md border px-2" value={value.modality} onChange={event => field({ modality: event.target.value as ManagementReportFilters['modality'] })}>
          <option value="">All modalities</option><option value="CT">CT</option><option value="US">Ultrasound</option><option value="CR">CR</option><option value="DR">DR</option><option value="MR">MRI</option>
        </select>
      </label>
      <label className="text-muted-foreground grid gap-1 text-xs">
        Priority
        <select className="border-input bg-background h-9 rounded-md border px-2" value={value.priority} onChange={event => field({ priority: event.target.value as ManagementReportFilters['priority'] })}>
          <option value="">All priorities</option><option value="EMERGENCY">Emergency</option><option value="URGENT">Urgent</option><option value="ROUTINE">Routine</option>
        </select>
      </label>
      <label className="text-muted-foreground grid gap-1 text-xs">
        Status
        <select className="border-input bg-background h-9 rounded-md border px-2" value={value.status} onChange={event => field({ status: event.target.value })}>
          <option value="">All statuses</option><option value="Received">Received</option><option value="Assigned">Assigned</option><option value="InReview">In Review</option><option value="Reported">Reported</option><option value="Verified">Verified</option><option value="Cancelled">Cancelled</option><option value="Incomplete">Incomplete</option>
        </select>
      </label>
      <label className="text-muted-foreground grid gap-1 text-xs">
        Location
        <Input value={value.location} placeholder="All locations" onChange={event => field({ location: event.target.value })} />
      </label>
      <div className="flex items-end gap-2">
        <Button type="submit" disabled={loading || !value.from || !value.to}>Apply</Button>
        <Button type="button" variant="ghost" onClick={onReset} disabled={loading}>Reset</Button>
      </div>
    </form>
  );
}
