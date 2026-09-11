import React from 'react';

import type { DemoRole } from '../../context/DashboardProvider';
import type { Radiologist, Study, StudySortField } from '../../models';
import {
  formatElapsed,
  formatKampalaDateTime,
  formatRemaining,
} from '../../utils/formatDashboardDate';
import { StudyActions, type StudyActionHandlers } from './StudyActions';
import { PriorityBadge, StatusBadge } from './WorklistStatusBadge';

const headerClass =
  'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground';

function SortHeader({
  label,
  field,
  active,
  direction,
  onSort,
}: {
  label: string;
  field: StudySortField;
  active: boolean;
  direction: 'asc' | 'desc';
  onSort: (field: StudySortField) => void;
}) {
  return (
    <th className={headerClass}>
      <button
        type="button"
        className="hover:text-foreground whitespace-nowrap"
        onClick={() => onSort(field)}
      >
        {label} {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
      </button>
    </th>
  );
}

export function WorklistTable({
  studies,
  selectedStudyId,
  radiologists,
  role,
  busyStudyId,
  sortBy,
  sortDirection,
  onSort,
  onSelect,
  handlers,
}: {
  studies: Study[];
  selectedStudyId: string | null;
  radiologists: Radiologist[];
  role: DemoRole;
  busyStudyId: string | null;
  sortBy: StudySortField | '';
  sortDirection: 'asc' | 'desc';
  onSort: (field: StudySortField) => void;
  onSelect: (study: Study) => void;
  handlers: StudyActionHandlers;
}) {
  const radiologistName = (study: Study) =>
    study.assignedRadiologistName ||
    radiologists.find(candidate => candidate.id === study.assignedRadiologistId)?.name ||
    (study.assignedRadiologistId ? 'Assigned' : 'Unassigned');

  return (
    <div className="border-input/60 bg-card overflow-x-auto rounded-xl border shadow-sm">
      <table className="w-full min-w-[1320px] border-collapse text-xs">
        <thead className="bg-muted/40 border-input/60 border-b">
          <tr>
            <SortHeader
              label="Priority"
              field="priority"
              active={sortBy === 'priority'}
              direction={sortDirection}
              onSort={onSort}
            />
            <th className={headerClass}>SLA / waiting</th>
            <SortHeader
              label="Patient"
              field="patientName"
              active={sortBy === 'patientName'}
              direction={sortDirection}
              onSort={onSort}
            />
            <SortHeader
              label="Examination"
              field="examination"
              active={sortBy === 'examination'}
              direction={sortDirection}
              onSort={onSort}
            />
            <th className={headerClass}>Modality</th>
            <th className={headerClass}>Location</th>
            <SortHeader
              label="Received"
              field="receivedAt"
              active={sortBy === 'receivedAt'}
              direction={sortDirection}
              onSort={onSort}
            />
            <th className={headerClass}>Images</th>
            <th className={headerClass}>Assigned to</th>
            <SortHeader
              label="Status"
              field="status"
              active={sortBy === 'status'}
              direction={sortDirection}
              onSort={onSort}
            />
            <th className={headerClass}>Notes</th>
            <th className={headerClass}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {studies.map(study => {
            const overdue =
              Boolean(study.reportDueAt) &&
              new Date(study.reportDueAt!).getTime() < Date.now() &&
              !['REPORTED', 'VERIFIED', 'CANCELLED'].includes(study.status);
            const dueSoon =
              Boolean(study.reportDueAt) &&
              !overdue &&
              new Date(study.reportDueAt!).getTime() <= Date.now() + 30 * 60_000 &&
              !['REPORTED', 'VERIFIED', 'CANCELLED'].includes(study.status);
            return (
              <tr
                key={study.id}
                className={`border-input/40 hover:bg-primary/5 cursor-pointer border-b transition-colors last:border-0 ${selectedStudyId === study.id ? 'bg-primary/10' : ''}`}
                onClick={() => onSelect(study)}
              >
                <td className="px-3 py-3">
                  <PriorityBadge priority={study.priority} />
                </td>
                <td className="px-3 py-3">
                  <div
                    className={
                      overdue
                        ? 'font-semibold text-red-400'
                        : dueSoon
                          ? 'font-semibold text-amber-400'
                          : 'text-foreground'
                    }
                  >
                    {formatRemaining(study.reportDueAt)}
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    Waiting {formatElapsed(study.receivedAt)}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="text-foreground font-medium">{study.patient.name}</div>
                  <div className="text-muted-foreground mt-0.5">{study.patient.mrn}</div>
                </td>
                <td className="max-w-[250px] px-3 py-3">
                  <div className="text-foreground font-medium">{study.examination}</div>
                  <div className="text-muted-foreground mt-0.5 truncate">
                    {study.clinicalHistory}
                  </div>
                </td>
                <td className="text-primary px-3 py-3 font-semibold">{study.modality}</td>
                <td className="text-foreground px-3 py-3">{study.location}</td>
                <td className="text-foreground whitespace-nowrap px-3 py-3">
                  {formatKampalaDateTime(study.receivedAt)}
                </td>
                <td className="text-foreground px-3 py-3">
                  {study.seriesCount} / {study.imageCount}
                </td>
                <td className="text-foreground px-3 py-3">{radiologistName(study)}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={study.status} />
                </td>
                <td className="text-foreground px-3 py-3">
                  {(study.noteCount ?? study.notes.length) || '—'}
                </td>
                <td
                  className="px-3 py-3"
                  onClick={event => event.stopPropagation()}
                >
                  <StudyActions
                    study={study}
                    role={role}
                    busy={busyStudyId === study.id}
                    handlers={handlers}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!studies.length && (
        <div className="px-6 py-16 text-center">
          <p className="text-foreground font-medium">No studies match these filters</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Reset the filters or try a broader search.
          </p>
        </div>
      )}
    </div>
  );
}
