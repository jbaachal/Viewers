import React from 'react';
import { Button, Icons } from '@ohif/ui-next';

import type { Study, StudyPriority, StudyStatus } from '../../models';
import { DashboardSection } from './DashboardSection';

const priorityStyles: Record<StudyPriority, string> = {
  EMERGENCY: 'border-red-500/40 bg-red-500/10 text-red-300',
  URGENT: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  ROUTINE: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
};

const statusStyles: Record<StudyStatus, string> = {
  RECEIVED: 'text-sky-300',
  ASSIGNED: 'text-cyan-300',
  IN_REVIEW: 'text-amber-200',
  REPORTED: 'text-emerald-300',
  VERIFIED: 'text-emerald-300',
  CANCELLED: 'text-slate-400',
  INCOMPLETE: 'text-red-300',
};

function formatWait(receivedAt: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(receivedAt).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${Math.floor(minutes / 1_440)}d ${Math.floor((minutes % 1_440) / 60)}h`;
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kampala',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function PriorityWorklistPreview({
  studies,
  radiologistNames,
  selectedStatus,
  pendingStudyId,
  onViewAll,
  onView,
  onAssign,
  onReserve,
  onStartReport,
}: {
  studies: Study[];
  radiologistNames: Record<string, string>;
  selectedStatus: StudyStatus | null;
  pendingStudyId: string | null;
  onViewAll: () => void;
  onView: (studyId: string) => void;
  onAssign: (studyId: string) => void;
  onReserve: (studyId: string) => void;
  onStartReport: (studyId: string) => void;
}) {
  return (
    <DashboardSection
      title="Priority worklist"
      description={
        selectedStatus
          ? `Filtered to ${selectedStatus.replace('_', ' ').toLowerCase()}`
          : 'Emergency, urgent and oldest unread studies first'
      }
      action={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={onViewAll}
        >
          View full worklist
          <Icons.ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left text-xs">
          <thead className="bg-background/50 text-muted-foreground">
            <tr>
              {[
                'Priority',
                'Waiting',
                'Patient',
                'Patient ID',
                'Examination',
                'Modality',
                'Location',
                'Received',
                'Assigned',
                'Status',
                'Notes',
                'Actions',
              ].map(label => (
                <th
                  key={label}
                  scope="col"
                  className="border-input/40 border-b px-3 py-2.5 font-medium"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {studies.map(study => {
              const pending = pendingStudyId === study.id;
              return (
                <tr
                  key={study.id}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${priorityStyles[study.priority]}`}
                    >
                      {study.priority}
                    </span>
                  </td>
                  <td className="text-foreground px-3 py-3 font-semibold tabular-nums">
                    {formatWait(study.receivedAt)}
                  </td>
                  <td className="text-foreground px-3 py-3 font-medium">{study.patient.name}</td>
                  <td className="text-muted-foreground px-3 py-3">{study.patient.mrn}</td>
                  <td className="text-foreground max-w-52 truncate px-3 py-3">
                    {study.examination}
                  </td>
                  <td className="text-muted-foreground px-3 py-3">{study.modality}</td>
                  <td className="text-muted-foreground max-w-36 truncate px-3 py-3">
                    {study.location}
                  </td>
                  <td className="text-muted-foreground px-3 py-3 tabular-nums">
                    {formatTime(study.receivedAt)}
                  </td>
                  <td className="text-muted-foreground max-w-36 truncate px-3 py-3">
                    {study.assignedRadiologistId
                      ? (study.assignedRadiologistName ??
                        radiologistNames[study.assignedRadiologistId] ??
                        'Assigned')
                      : 'Unassigned'}
                  </td>
                  <td className={`px-3 py-3 font-medium ${statusStyles[study.status]}`}>
                    {study.status.replace('_', ' ')}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onView(study.id)}
                      className="text-primary hover:text-primary/80 flex items-center gap-1"
                      aria-label={`Open ${study.noteCount ?? study.notes.length} notes for ${study.patient.name}`}
                    >
                      <Icons.Clipboard className="h-3.5 w-3.5" />
                      {study.noteCount ?? study.notes.length}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => onView(study.id)}
                      >
                        View
                      </Button>
                      {!study.assignedRadiologistId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          className="h-7 px-2 text-[11px]"
                          onClick={() => onAssign(study.id)}
                        >
                          Assign
                        </Button>
                      )}
                      {study.status === 'ASSIGNED' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          className="h-7 px-2 text-[11px]"
                          onClick={() => onStartReport(study.id)}
                        >
                          Start report
                        </Button>
                      )}
                      {!study.reservedByRadiologistId && study.status === 'RECEIVED' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          className="h-7 px-2 text-[11px]"
                          onClick={() => onReserve(study.id)}
                        >
                          Reserve
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!studies.length && (
          <div className="text-muted-foreground p-8 text-center text-sm">
            No studies match this workflow stage.
          </div>
        )}
      </div>
    </DashboardSection>
  );
}
