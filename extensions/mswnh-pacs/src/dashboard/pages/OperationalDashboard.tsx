import React, { useCallback, useEffect, useState } from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useNavigate } from 'react-router-dom';

import {
  AlertsPanel,
  DashboardMetricCard,
  ModalityActivityGrid,
  PriorityWorklistPreview,
  RecentActivity,
  WorkflowOverview,
} from '../components/dashboard';
import { useDashboardContext } from '../context/DashboardProvider';
import { mockRadiologists } from '../mock';
import type { DashboardMetric, DashboardSnapshot, Study, StudyStatus } from '../models';

const radiologistNames = Object.fromEntries(
  mockRadiologists.map(radiologist => [radiologist.id, radiologist.name])
);

function metricDestination(metric: DashboardMetric): string {
  const destinations: Record<DashboardMetric['id'], string> = {
    examsToday: '/worklist?date=today',
    unreadExams: '/worklist?status=unread',
    emergencyStudies: '/worklist?priority=emergency',
    assignedToMe: '/worklist?assigned=me',
    pendingVerification: '/worklist?status=reported',
    averageTurnaroundTime: '/dashboard/management',
    delayedExams: '/worklist?overdue=true',
    systemHealth: '/dashboard/system',
  };
  return destinations[metric.id];
}

export function OperationalDashboard() {
  const navigate = useNavigate();
  const { services } = useDashboardContext();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [displayedStudies, setDisplayedStudies] = useState<Study[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<StudyStatus | null>(null);
  const [pendingStudyId, setPendingStudyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!services) return;
    try {
      const nextSnapshot = await services.dashboard.getSnapshot();
      setSnapshot(nextSnapshot);
      if (services.dataSource === 'LIVE') {
        const result = await services.worklist.queryStudies({
          statuses: selectedStatus
            ? selectedStatus === 'INCOMPLETE'
              ? ['INCOMPLETE', 'CANCELLED']
              : [selectedStatus]
            : undefined,
          pageSize: 10,
        });
        setDisplayedStudies(result.studies);
      } else if (selectedStatus) {
        const result = await services.worklist.queryStudies({
          statuses:
            selectedStatus === 'INCOMPLETE' ? ['INCOMPLETE', 'CANCELLED'] : [selectedStatus],
          pageSize: 10,
        });
        setDisplayedStudies(result.studies);
      } else {
        setDisplayedStudies(nextSnapshot.priorityStudies);
      }
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error : new Error('Dashboard data could not be loaded.')
      );
    }
  }, [selectedStatus, services]);

  useEffect(() => {
    void refresh();
    return services?.dashboard.subscribe(() => void refresh());
  }, [refresh, services]);

  useEffect(() => {
    const refreshInterval = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(refreshInterval);
  }, [refresh]);

  const selectStatus = (status: StudyStatus | null) => {
    setSelectedStatus(status);
  };

  const runStudyAction = async (
    studyId: string,
    action: () => Promise<unknown>,
    successMessage: string
  ) => {
    if (!services) return;
    setPendingStudyId(studyId);
    try {
      await action();
      await refresh();
      setNotice(successMessage);
      window.setTimeout(() => setNotice(null), 3500);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The study could not be updated.');
    } finally {
      setPendingStudyId(null);
    }
  };

  if (loadError) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="border-destructive/50 bg-destructive/10 max-w-lg rounded-xl border p-6 text-center">
          <h1 className="text-foreground text-lg font-semibold">
            Operational dashboard unavailable
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">{loadError.message}</p>
          <Button
            type="button"
            className="mt-4"
            onClick={() => void refresh()}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="text-muted-foreground flex min-h-full items-center justify-center gap-2 text-sm">
        <Icons.LoadingSpinner className="h-5 w-5 animate-spin" /> Loading operational dashboard…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1800px] space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-primary mb-1 text-xs font-semibold uppercase tracking-[0.16em]">
            MSWNH PACS
          </div>
          <h1 className="text-foreground text-2xl font-semibold">Operational Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Live operational snapshot · Updated{' '}
            {new Intl.DateTimeFormat('en-GB', {
              timeZone: 'Africa/Kampala',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(snapshot.generatedAt))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {notice && (
            <span
              role="status"
              className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200"
            >
              {notice}
            </span>
          )}
          <span className="border-primary/30 bg-primary/10 text-primary rounded-full border px-3 py-1.5 text-xs font-medium">
            {snapshot.dataSource === 'LIVE' ? 'Live workflow data' : 'Demonstration data'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8">
        {snapshot.metrics.map(metric => (
          <DashboardMetricCard
            key={metric.id}
            metric={metric}
            onSelect={selectedMetric => navigate(metricDestination(selectedMetric))}
          />
        ))}
      </div>

      <WorkflowOverview
        stages={snapshot.workflowStages}
        ageing={snapshot.ageing}
        selectedStatus={selectedStatus}
        onSelectStatus={selectStatus}
      />

      <PriorityWorklistPreview
        studies={displayedStudies}
        radiologistNames={radiologistNames}
        selectedStatus={selectedStatus}
        pendingStudyId={pendingStudyId}
        onViewAll={() => navigate('/worklist')}
        onView={studyId => navigate(`/worklist?study=${studyId}`)}
        onAssign={studyId =>
          void runStudyAction(
            studyId,
            () => services.worklist.assignToMe(studyId),
            'Study assigned to you'
          )
        }
        onReserve={studyId =>
          void runStudyAction(studyId, () => services.worklist.reserve(studyId), 'Study reserved')
        }
        onStartReport={studyId =>
          void runStudyAction(
            studyId,
            () => services.worklist.startReporting(studyId),
            'Study moved to In Review'
          )
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <ModalityActivityGrid activity={snapshot.modalityActivity} />
        <AlertsPanel
          alerts={snapshot.alerts}
          onAcknowledge={alertId => void services?.dashboard.acknowledgeAlert(alertId)}
        />
      </div>

      <RecentActivity activity={snapshot.recentActivity} />
    </div>
  );
}
