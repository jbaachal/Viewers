import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useNavigate } from 'react-router-dom';

import {
  StudyDetailsDrawer,
  StudyNotesDialog,
  WorklistFilters,
  WorklistPagination,
  WorklistQuickFilters,
  WorklistTable,
  type StudyActionHandlers,
} from '../components/worklist';
import { useDashboardContext } from '../context/DashboardProvider';
import { useWorklist } from '../hooks/useWorklist';
import { mockRadiologists } from '../mock';
import type { Study, StudyNote, StudyPriority, StudySortField } from '../models';
import { getViewerLaunchUrl } from '../utils/getViewerLaunchUrl';

export function RadiologistWorklist() {
  const navigate = useNavigate();
  const { services, demoRole } = useDashboardContext();
  const worklist = useWorklist();
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [notesStudy, setNotesStudy] = useState<Study | null>(null);
  const [pendingViewerStudy, setPendingViewerStudy] = useState<Study | null>(null);
  const [priorityStudy, setPriorityStudy] = useState<Study | null>(null);
  const [nextPriority, setNextPriority] = useState<StudyPriority>('ROUTINE');
  const [priorityReason, setPriorityReason] = useState('');
  const [busyStudyId, setBusyStudyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSelectedStudy = useCallback(async () => {
    if (!services || !worklist.selectedStudyId) {
      setSelectedStudy(null);
      return;
    }
    setSelectedStudy(await services.worklist.getStudy(worklist.selectedStudyId));
  }, [services, worklist.selectedStudyId]);

  useEffect(() => {
    void loadSelectedStudy();
  }, [loadSelectedStudy, worklist.studies]);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4500);
  }, []);

  const runAction = useCallback(
    async (study: Study, action: () => Promise<Study>, success: string) => {
      setBusyStudyId(study.id);
      try {
        const updated = await action();
        setSelectedStudy(current => (current?.id === updated.id ? updated : current));
        setNotesStudy(current => (current?.id === updated.id ? updated : current));
        showNotice(success);
        await worklist.refresh();
        return updated;
      } catch (error) {
        showNotice(error instanceof Error ? error.message : 'The study could not be updated.');
        return null;
      } finally {
        setBusyStudyId(null);
      }
    },
    [showNotice, worklist]
  );

  const launchStudy = useCallback(
    (study: Study) => {
      const launchUrl = getViewerLaunchUrl(study);
      if (!launchUrl) {
        showNotice('This workflow record is not linked to an archived DICOM study.');
        return;
      }
      navigate(launchUrl);
    },
    [navigate, showNotice]
  );

  const openStudyInViewer = useCallback(
    (study: Study, startReporting = false) => {
      void (async () => {
        let current = study;
        if (startReporting) {
          const reviewing = await runAction(
            current,
            () => services!.worklist.startReporting(current.id),
            'Reporting started.'
          );
          if (!reviewing) {
            return;
          }
          current = reviewing;
        }

        const opened = await runAction(
          current,
          () => services!.worklist.openStudy(current.id),
          'Study-open event recorded.'
        );
        if (!opened) {
          return;
        }
        if (opened.notes.some(note => note.popupOnOpen)) {
          setNotesStudy(opened);
          setPendingViewerStudy(opened);
        } else {
          launchStudy(opened);
        }
      })();
    },
    [launchStudy, runAction, services]
  );

  const handlers = useMemo<StudyActionHandlers>(
    () => ({
      onAssign: study =>
        void runAction(
          study,
          () => services!.worklist.assignToMe(study.id),
          'Study assigned to you.'
        ),
      onReserve: study =>
        void runAction(
          study,
          () => services!.worklist.reserve(study.id),
          'Study reserved for 15 minutes.'
        ),
      onRelease: study =>
        void runAction(
          study,
          () => services!.worklist.releaseReservation(study.id),
          'Reservation released.'
        ),
      onStartReporting: study => openStudyInViewer(study, true),
      onMarkReported: study =>
        void runAction(
          study,
          () => services!.worklist.markReported(study.id),
          'Study marked Reported.'
        ),
      onMarkVerified: study =>
        void runAction(
          study,
          () => services!.worklist.markVerified(study.id),
          'Report marked Verified.'
        ),
      onChangePriority: study => {
        setPriorityStudy(study);
        setNextPriority(study.priority);
        setPriorityReason('');
      },
      onOpenNotes: study => {
        setNotesStudy(study);
        setPendingViewerStudy(null);
      },
      onOpenViewer: study => openStudyInViewer(study),
    }),
    [openStudyInViewer, runAction, services]
  );

  const sort = (field: StudySortField) => {
    worklist.updateFilters({
      sortBy: field,
      sortDirection:
        worklist.filters.sortBy === field && worklist.filters.sortDirection === 'asc'
          ? 'desc'
          : 'asc',
    });
  };

  const addNote = async (input: Pick<StudyNote, 'type' | 'text' | 'popupOnOpen'>) => {
    if (!services || !notesStudy) return;
    setBusyStudyId(notesStudy.id);
    try {
      await services.worklist.addStudyNote(notesStudy.id, input);
      const updated = await services.worklist.getStudy(notesStudy.id);
      setNotesStudy(updated);
      if (updated) setSelectedStudy(current => (current?.id === updated.id ? updated : current));
      await worklist.refresh();
      showNotice('Study note added.');
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'The note could not be added.');
    } finally {
      setBusyStudyId(null);
    }
  };

  if (!services)
    return <div className="text-foreground p-6">The worklist service is unavailable.</div>;

  return (
    <div className="mx-auto max-w-[1900px] space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-primary mb-1 text-xs font-semibold uppercase tracking-[0.16em]">
            MSWNH PACS
          </div>
          <h1 className="text-foreground text-2xl font-semibold">Radiologist Worklist</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Prioritised reporting queue · Africa/Kampala time
          </p>
        </div>
        <div className="flex items-center gap-2">
          {notice && (
            <span
              role="status"
              className="border-primary/30 bg-primary/10 text-primary max-w-xl rounded-full border px-3 py-1.5 text-xs"
            >
              {notice}
            </span>
          )}
          <span className="border-primary/30 bg-primary/10 text-primary rounded-full border px-3 py-1.5 text-xs">
            Live workflow data
          </span>
        </div>
      </div>

      <WorklistFilters
        filters={worklist.filters}
        onChange={worklist.updateFilters}
        onReset={worklist.resetFilters}
      />
      <WorklistQuickFilters
        active={worklist.filters.quickFilters}
        onToggle={worklist.toggleQuickFilter}
      />

      {worklist.error ? (
        <div className="border-destructive/50 bg-destructive/10 rounded-xl border p-6 text-center">
          <p className="text-foreground">{worklist.error.message}</p>
          <Button
            type="button"
            className="mt-3"
            onClick={() => void worklist.refresh()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <div className="relative">
          {worklist.loading && (
            <div className="bg-background/60 absolute inset-0 z-10 grid place-items-center rounded-xl">
              <Icons.LoadingSpinner className="text-primary h-6 w-6 animate-spin" />
            </div>
          )}
          <WorklistTable
            studies={worklist.studies}
            selectedStudyId={worklist.selectedStudyId}
            radiologists={mockRadiologists}
            role={demoRole}
            busyStudyId={busyStudyId}
            sortBy={worklist.filters.sortBy}
            sortDirection={worklist.filters.sortDirection}
            onSort={sort}
            onSelect={study => worklist.selectStudy(study.id)}
            handlers={handlers}
          />
          <WorklistPagination
            page={worklist.filters.page}
            pageCount={worklist.pageCount}
            total={worklist.total}
            pageSize={worklist.filters.pageSize}
            onPageChange={page => worklist.updateFilters({ page })}
          />
        </div>
      )}

      <StudyDetailsDrawer
        study={selectedStudy}
        radiologists={mockRadiologists}
        role={demoRole}
        busy={busyStudyId === selectedStudy?.id}
        handlers={handlers}
        onClose={() => worklist.selectStudy(null)}
      />
      <StudyNotesDialog
        study={notesStudy}
        busy={busyStudyId === notesStudy?.id}
        reviewBeforeLaunch={Boolean(pendingViewerStudy)}
        onAdd={addNote}
        onContinue={() => {
          if (pendingViewerStudy) launchStudy(pendingViewerStudy);
          setPendingViewerStudy(null);
          setNotesStudy(null);
        }}
        onClose={() => {
          setNotesStudy(null);
          setPendingViewerStudy(null);
        }}
      />

      {priorityStudy && (
        <div
          className="bg-black/65 fixed inset-0 z-[120] grid place-items-center p-4"
          onMouseDown={() => setPriorityStudy(null)}
        >
          <form
            className="bg-background border-input w-full max-w-md space-y-4 rounded-xl border p-5 shadow-2xl"
            onMouseDown={event => event.stopPropagation()}
            onSubmit={event => {
              event.preventDefault();
              const study = priorityStudy;
              void runAction(
                study,
                () => services.worklist.changePriority(study.id, nextPriority, priorityReason),
                'Study priority updated.'
              ).then(updated => {
                if (updated) setPriorityStudy(null);
              });
            }}
          >
            <div>
              <h2 className="text-foreground text-lg font-semibold">Change priority</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {priorityStudy.patient.name} · {priorityStudy.examination}
              </p>
            </div>
            <label className="text-foreground grid gap-1 text-sm">
              Priority
              <select
                value={nextPriority}
                onChange={event => setNextPriority(event.target.value as StudyPriority)}
                className="border-input bg-background h-9 rounded-md border px-2"
              >
                <option value="EMERGENCY">Emergency</option>
                <option value="URGENT">Urgent</option>
                <option value="ROUTINE">Routine</option>
              </select>
            </label>
            <label className="text-foreground grid gap-1 text-sm">
              Reason
              <textarea
                rows={3}
                value={priorityReason}
                onChange={event => setPriorityReason(event.target.value)}
                placeholder="Required when changing to or from Emergency"
                className="border-input bg-background rounded-md border p-2"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPriorityStudy(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busyStudyId === priorityStudy.id}
              >
                Save priority
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
