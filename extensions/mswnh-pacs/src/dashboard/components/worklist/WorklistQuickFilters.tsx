import React from 'react';

import type { StudyQuickFilter } from '../../models';

const quickFilters: Array<{ id: StudyQuickFilter; label: string }> = [
  { id: 'EMERGENCY', label: 'Emergency' },
  { id: 'URGENT', label: 'Urgent' },
  { id: 'UNREAD', label: 'Unread' },
  { id: 'ASSIGNED_TO_ME', label: 'Assigned to Me' },
  { id: 'UNASSIGNED', label: 'Unassigned' },
  { id: 'RESERVED_BY_ME', label: 'Reserved by Me' },
  { id: 'IN_REVIEW', label: 'In Review' },
  { id: 'AWAITING_VERIFICATION', label: 'Awaiting Verification' },
  { id: 'OVERDUE', label: 'Overdue' },
  { id: 'CT', label: 'CT' },
  { id: 'ULTRASOUND', label: 'Ultrasound' },
  { id: 'TODAY', label: 'Today' },
];

export function WorklistQuickFilters({
  active,
  onToggle,
}: {
  active: StudyQuickFilter[];
  onToggle: (filter: StudyQuickFilter) => void;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      aria-label="Quick filters"
    >
      {quickFilters.map(filter => {
        const selected = active.includes(filter.id);
        return (
          <button
            type="button"
            key={filter.id}
            aria-pressed={selected}
            onClick={() => onToggle(filter.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              selected
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-input bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
