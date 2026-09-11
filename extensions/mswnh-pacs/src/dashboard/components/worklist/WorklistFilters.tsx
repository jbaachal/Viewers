import React, { useEffect, useState } from 'react';
import { Button, Icons, Input } from '@ohif/ui-next';

import type { WorklistFilters as WorklistFilterState } from '../../hooks/useWorklist';

const fieldClass =
  'border-input bg-background text-foreground h-9 rounded-md border px-2.5 text-xs focus:border-primary focus:outline-none';

export function WorklistFilters({
  filters,
  onChange,
  onReset,
}: {
  filters: WorklistFilterState;
  onChange: (patch: Partial<WorklistFilterState>) => void;
  onReset: () => void;
}) {
  const [search, setSearch] = useState(filters.search);
  useEffect(() => setSearch(filters.search), [filters.search]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onChange({ search: search.trim() });
  };

  return (
    <form
      onSubmit={submit}
      className="border-input/60 bg-card grid gap-3 rounded-xl border p-3 shadow-sm lg:grid-cols-[minmax(240px,1.5fr)_repeat(5,minmax(110px,0.65fr))_auto]"
    >
      <div className="relative min-w-0">
        <label
          htmlFor="worklist-search"
          className="sr-only"
        >
          Search studies
        </label>
        <Icons.Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          id="worklist-search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Patient, MRN, accession or Study UID"
          className="h-9 pl-8"
        />
      </div>
      <label className="grid gap-1">
        <span className="sr-only">Priority</span>
        <select
          value={filters.priority}
          onChange={event =>
            onChange({ priority: event.target.value as WorklistFilterState['priority'] })
          }
          className={fieldClass}
        >
          <option value="">All priorities</option>
          <option value="EMERGENCY">Emergency</option>
          <option value="URGENT">Urgent</option>
          <option value="ROUTINE">Routine</option>
        </select>
      </label>
      <label className="grid gap-1">
        <span className="sr-only">Status</span>
        <select
          value={filters.status}
          onChange={event =>
            onChange({ status: event.target.value as WorklistFilterState['status'] })
          }
          className={fieldClass}
        >
          <option value="">All statuses</option>
          <option value="RECEIVED">Received</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="REPORTED">Reported</option>
          <option value="VERIFIED">Verified</option>
          <option value="INCOMPLETE">Incomplete</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </label>
      <label className="grid gap-1">
        <span className="sr-only">Modality</span>
        <select
          value={filters.modality}
          onChange={event =>
            onChange({ modality: event.target.value as WorklistFilterState['modality'] })
          }
          className={fieldClass}
        >
          <option value="">All modalities</option>
          <option value="CT">CT</option>
          <option value="US">Ultrasound</option>
          <option value="CR">CR</option>
          <option value="DR">DR</option>
          <option value="MR">MRI</option>
        </select>
      </label>
      <label className="grid gap-1">
        <span className="sr-only">Received from</span>
        <input
          type="date"
          value={filters.dateFrom}
          aria-label="Received from"
          onChange={event => onChange({ dateFrom: event.target.value })}
          className={fieldClass}
        />
      </label>
      <label className="grid gap-1">
        <span className="sr-only">Received to</span>
        <input
          type="date"
          value={filters.dateTo}
          aria-label="Received to"
          onChange={event => onChange({ dateTo: event.target.value })}
          className={fieldClass}
        />
      </label>
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          className="h-9"
        >
          Search
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => {
            setSearch('');
            onReset();
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
