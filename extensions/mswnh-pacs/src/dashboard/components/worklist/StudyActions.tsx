import React from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icons,
} from '@ohif/ui-next';

import type { DemoRole } from '../../context/DashboardProvider';
import type { Study } from '../../models';

export type StudyActionHandlers = {
  onAssign: (study: Study) => void;
  onReserve: (study: Study) => void;
  onRelease: (study: Study) => void;
  onStartReporting: (study: Study) => void;
  onMarkReported: (study: Study) => void;
  onMarkVerified: (study: Study) => void;
  onChangePriority: (study: Study) => void;
  onOpenNotes: (study: Study) => void;
  onOpenViewer: (study: Study) => void;
};

export function StudyActions({
  study,
  role,
  busy,
  handlers,
}: {
  study: Study;
  role: DemoRole;
  busy: boolean;
  handlers: StudyActionHandlers;
}) {
  const canReport = role === 'RADIOLOGIST' || role === 'PACS_ADMIN';
  const canManage = role === 'PACS_ADMIN';
  const canReserve = ['RECEIVED', 'ASSIGNED', 'IN_REVIEW'].includes(study.status);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          disabled={busy}
          aria-label={`Actions for ${study.patient.name}`}
        >
          <Icons.More className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52"
      >
        <DropdownMenuItem onSelect={() => handlers.onOpenViewer(study)}>
          <Icons.LaunchArrow className="mr-2 h-4 w-4" /> View Study
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handlers.onOpenNotes(study)}>
          <Icons.Clipboard className="mr-2 h-4 w-4" /> Study notes
        </DropdownMenuItem>
        {canReport && (
          <>
            <DropdownMenuSeparator />
            {!study.assignedRadiologistId && study.status === 'RECEIVED' && (
              <DropdownMenuItem onSelect={() => handlers.onAssign(study)}>
                Assign to Me
              </DropdownMenuItem>
            )}
            {canReserve &&
              (study.reservedByRadiologistId ? (
                <DropdownMenuItem onSelect={() => handlers.onRelease(study)}>
                  Release reservation
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => handlers.onReserve(study)}>
                  Reserve
                </DropdownMenuItem>
              ))}
            {study.status === 'ASSIGNED' && (
              <DropdownMenuItem onSelect={() => handlers.onStartReporting(study)}>
                Start reporting
              </DropdownMenuItem>
            )}
            {study.status === 'IN_REVIEW' && (
              <DropdownMenuItem onSelect={() => handlers.onOpenViewer(study)}>
                Continue reporting in OHIF
              </DropdownMenuItem>
            )}
          </>
        )}
        {canManage && (
          <>
            {study.status === 'REPORTED' && (
              <DropdownMenuItem onSelect={() => handlers.onMarkVerified(study)}>
                Mark Verified
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => handlers.onChangePriority(study)}>
              Change priority
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
