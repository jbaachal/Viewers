import React from 'react';
import { Button, Icons } from '@ohif/ui-next';

import type { DemoRole } from '../../context/DashboardProvider';
import type { Radiologist, Study } from '../../models';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
import { formatKampalaDateTime, formatRemaining } from '../../utils/formatDashboardDate';
import { StudyActions, type StudyActionHandlers } from './StudyActions';
import { PriorityBadge, StatusBadge } from './WorklistStatusBadge';

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground text-[11px] uppercase tracking-wide">{label}</dt>
      <dd className="text-foreground mt-1 text-sm">{children || '—'}</dd>
    </div>
  );
}

export function StudyDetailsDrawer({
  study,
  radiologists,
  role,
  currentUserId,
  busy,
  handlers,
  onClose,
}: {
  study: Study | null;
  radiologists: Radiologist[];
  role: DemoRole;
  currentUserId: string | null;
  busy: boolean;
  handlers: StudyActionHandlers;
  onClose: () => void;
}) {
  const { dialogRef, onKeyDown } = useDialogAccessibility<HTMLElement>(Boolean(study), onClose);
  if (!study) return null;
  const assignee =
    study.assignedRadiologistName ||
    radiologists.find(candidate => candidate.id === study.assignedRadiologistId)?.name ||
    'Unassigned';
  const canReport = role === 'RADIOLOGIST' || role === 'PACS_ADMIN';
  const canAssign = ['RECEIVED', 'ASSIGNED'].includes(study.status);
  const assignedToMe = Boolean(currentUserId && study.assignedRadiologistId === currentUserId);
  const assignedToAnother = Boolean(study.assignedRadiologistId && !assignedToMe);
  const canTakeAssignment = !assignedToAnother || role === 'PACS_ADMIN';
  const canReserve = ['RECEIVED', 'ASSIGNED', 'IN_REVIEW'].includes(study.status);
  const reservedByMe = Boolean(currentUserId && study.reservedByRadiologistId === currentUserId);
  const reservedByAnother = Boolean(study.reservedByRadiologistId && !reservedByMe);

  return (
    <div
      className="bg-black/55 fixed inset-0 z-[100] flex justify-end"
      onMouseDown={onClose}
    >
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Study details for ${study.patient.name}`}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="bg-background border-input h-full w-[min(94vw,590px)] overflow-y-auto border-l shadow-2xl"
        onMouseDown={event => event.stopPropagation()}
      >
        <header className="border-input/60 bg-card sticky top-0 z-10 flex items-start justify-between border-b p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={study.priority} />
              <StatusBadge status={study.status} />
            </div>
            <h2 className="text-foreground mt-3 text-xl font-semibold">{study.patient.name}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {study.patient.mrn} · {study.accessionNumber ?? 'No accession number'}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Close study details"
            onClick={onClose}
          >
            <Icons.Close className="h-4 w-4" />
          </Button>
        </header>

        <div className="space-y-6 p-5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => handlers.onOpenViewer(study)}
            >
              View Study
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handlers.onOpenNotes(study)}
            >
              Notes ({study.noteCount ?? study.notes.length})
            </Button>
            {canReport && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || assignedToMe || !canAssign || !canTakeAssignment}
                title={
                  assignedToMe
                    ? 'This study is already assigned to you.'
                    : assignedToAnother && role !== 'PACS_ADMIN'
                      ? `This study is assigned to ${assignee}.`
                      : undefined
                }
                onClick={() => handlers.onAssign(study)}
              >
                {assignedToMe ? 'Assigned to Me' : 'Assign to Me'}
              </Button>
            )}
            {canReport && canReserve && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || reservedByAnother}
                title={
                  reservedByAnother
                    ? `This study is currently reserved by ${study.reservedByRadiologistName || study.reservedByRadiologistId}.`
                    : undefined
                }
                onClick={() =>
                  reservedByMe ? handlers.onRelease(study) : handlers.onReserve(study)
                }
              >
                {reservedByMe ? 'Release Reservation' : reservedByAnother ? 'Reserved' : 'Reserve'}
              </Button>
            )}
            <StudyActions
              study={study}
              role={role}
              busy={busy}
              handlers={handlers}
            />
          </div>

          <section className="border-input/60 rounded-lg border p-4">
            <h3 className="text-foreground mb-4 font-semibold">Study</h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail label="Examination">{study.examination}</Detail>
              <Detail label="Modality">{study.modality}</Detail>
              <Detail label="Location">{study.location}</Detail>
              <Detail label="Department">{study.department}</Detail>
              <Detail label="Received">{formatKampalaDateTime(study.receivedAt)}</Detail>
              <Detail label="SLA">{formatRemaining(study.reportDueAt)}</Detail>
              <Detail label="Series / images">
                {study.seriesCount} / {study.imageCount}
              </Detail>
              <Detail label="Transmission">{study.transmissionStatus}</Detail>
              <Detail label="Assigned radiologist">{assignee}</Detail>
              <Detail label="Referring clinician">{study.referringClinician}</Detail>
            </dl>
          </section>

          <section className="border-input/60 rounded-lg border p-4">
            <h3 className="text-foreground font-semibold">Clinical history</h3>
            <p className="text-foreground mt-2 text-sm leading-6">{study.clinicalHistory}</p>
          </section>

          <section className="border-input/60 rounded-lg border p-4">
            <h3 className="text-foreground font-semibold">Previous examinations</h3>
            <div className="mt-3 space-y-3">
              {study.previousExaminations.map(exam => (
                <div
                  key={exam.id}
                  className="bg-muted/30 rounded-md p-3 text-sm"
                >
                  <div className="text-foreground font-medium">
                    {exam.modality} · {exam.examination}
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {formatKampalaDateTime(exam.performedAt)}
                  </div>
                  <p className="text-foreground mt-2">{exam.reportSummary}</p>
                </div>
              ))}
              {!study.previousExaminations.length && (
                <p className="text-muted-foreground text-sm">
                  No previous examinations were found for this patient.
                </p>
              )}
            </div>
          </section>

          <section className="border-input/60 rounded-lg border p-4">
            <h3 className="text-foreground font-semibold">Workflow history</h3>
            <ol className="mt-3 space-y-3">
              {study.workflowHistory.map(event => (
                <li
                  key={event.id}
                  className="border-primary/30 border-l-2 pl-3 text-sm"
                >
                  <div className="text-foreground">{event.description}</div>
                  <div className="text-muted-foreground mt-0.5">
                    {event.actor} · {formatKampalaDateTime(event.occurredAt)}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  );
}
