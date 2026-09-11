import type {
  AgeingBucket,
  DashboardMetric,
  DashboardSnapshot,
  Study,
  StudyStatus,
  WorkflowStageCount,
} from '../models';
import type { MockDataStore } from '../mock';
import { MOCK_CURRENT_RADIOLOGIST_ID } from '../mock';
import type { DashboardService } from './DashboardService';
import { cloneValue, MockEntityNotFoundError } from './serviceUtils';

const activeStatuses: StudyStatus[] = ['RECEIVED', 'ASSIGNED', 'IN_REVIEW'];

const stageLabels: Record<StudyStatus, string> = {
  RECEIVED: 'Received',
  ASSIGNED: 'Assigned',
  IN_REVIEW: 'In Review',
  REPORTED: 'Reported',
  VERIFIED: 'Verified',
  CANCELLED: 'Cancelled',
  INCOMPLETE: 'Incomplete',
};

function elapsedMinutes(receivedAt: string, now: Date): number {
  return Math.max(0, (now.getTime() - new Date(receivedAt).getTime()) / 60_000);
}

function calculateAgeing(studies: Study[], now: Date): AgeingBucket[] {
  const active = studies.filter(study => activeStatuses.includes(study.status));
  const count = (predicate: (minutes: number) => boolean) =>
    active.filter(study => predicate(elapsedMinutes(study.receivedAt, now))).length;
  return [
    {
      id: 'LT_30_MIN',
      label: 'Less than 30 minutes',
      count: count(value => value < 30),
      tone: 'healthy',
    },
    {
      id: 'MIN_30_60',
      label: '30–60 minutes',
      count: count(value => value >= 30 && value < 60),
      tone: 'info',
    },
    {
      id: 'HOUR_1_2',
      label: '1–2 hours',
      count: count(value => value >= 60 && value < 120),
      tone: 'warning',
    },
    {
      id: 'HOUR_2_4',
      label: '2–4 hours',
      count: count(value => value >= 120 && value < 240),
      tone: 'warning',
    },
    {
      id: 'GT_4_HOURS',
      label: 'More than 4 hours',
      count: count(value => value >= 240 && value < 1_440),
      tone: 'critical',
    },
    {
      id: 'GT_24_HOURS',
      label: 'More than 24 hours',
      count: count(value => value >= 1_440),
      tone: 'critical',
    },
  ];
}

function calculateWorkflowStages(studies: Study[]): WorkflowStageCount[] {
  const statuses: StudyStatus[] = [
    'RECEIVED',
    'ASSIGNED',
    'IN_REVIEW',
    'REPORTED',
    'VERIFIED',
    'CANCELLED',
    'INCOMPLETE',
  ];
  return statuses.map(status => ({
    status,
    label: stageLabels[status],
    count: studies.filter(study => study.status === status).length,
  }));
}

function calculateMetrics(studies: Study[], now: Date, systemState: string): DashboardMetric[] {
  const completedStudies = studies.filter(study => study.reportedAt);
  const averageTurnaround = completedStudies.length
    ? Math.round(
        completedStudies.reduce(
          (total, study) =>
            total +
            (new Date(study.reportedAt!).getTime() - new Date(study.receivedAt).getTime()) / 60_000,
          0
        ) / completedStudies.length
      )
    : 0;
  const delayed = studies.filter(
    study => activeStatuses.includes(study.status) && new Date(study.reportDueAt) < now
  ).length;

  return [
    {
      id: 'examsToday',
      label: 'Exams Today',
      value: '128',
      comparison: '8% above yesterday',
      tone: 'info',
    },
    {
      id: 'unreadExams',
      label: 'Unread Exams',
      value: String(studies.filter(study => activeStatuses.includes(study.status)).length),
      comparison: '3 fewer than one hour ago',
      tone: 'info',
    },
    {
      id: 'emergencyStudies',
      label: 'Emergency/Urgent Studies',
      value: String(
        studies.filter(
          study =>
            ['EMERGENCY', 'URGENT'].includes(study.priority) &&
            activeStatuses.includes(study.status)
        ).length
      ),
      comparison: '2 outside target',
      tone: 'critical',
    },
    {
      id: 'assignedToMe',
      label: 'Assigned to Me',
      value: String(
        studies.filter(
          study =>
            study.assignedRadiologistId === MOCK_CURRENT_RADIOLOGIST_ID &&
            activeStatuses.includes(study.status)
        ).length
      ),
      comparison: '1 currently in review',
      tone: 'info',
    },
    {
      id: 'pendingVerification',
      label: 'Reports Pending Verification',
      value: String(studies.filter(study => study.status === 'REPORTED').length),
      comparison: 'Within expected range',
      tone: 'warning',
    },
    {
      id: 'averageTurnaroundTime',
      label: 'Average Turnaround Time',
      value: `${averageTurnaround} min`,
      comparison: '6 min faster than yesterday',
      tone: 'healthy',
    },
    {
      id: 'delayedExams',
      label: 'Delayed Exams',
      value: String(delayed),
      comparison: delayed ? 'Requires attention' : 'No breached targets',
      tone: delayed ? 'critical' : 'healthy',
    },
    {
      id: 'systemHealth',
      label: 'System Health',
      value: systemState === 'HEALTHY' ? 'Healthy' : 'Warning',
      comparison: '1 modality offline',
      tone: systemState === 'HEALTHY' ? 'healthy' : 'warning',
    },
  ];
}

export class MockDashboardService implements DashboardService {
  constructor(
    private readonly store: MockDataStore,
    private readonly now: () => Date = () => new Date()
  ) {}

  async getSnapshot(): Promise<DashboardSnapshot> {
    const now = this.now();
    const priorityStudies = [...this.store.studies]
      .filter(study => !['VERIFIED', 'CANCELLED'].includes(study.status))
      .sort((left, right) => {
        const rank = { EMERGENCY: 0, URGENT: 1, ROUTINE: 2 };
        return (
          rank[left.priority] - rank[right.priority] ||
          new Date(left.receivedAt).getTime() - new Date(right.receivedAt).getTime()
        );
      })
      .slice(0, 10);
    const recentActivity = this.store.studies
      .flatMap(study => study.workflowHistory)
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
      .slice(0, 12);

    return cloneValue({
      metrics: calculateMetrics(this.store.studies, now, this.store.systemHealth.overallState),
      priorityStudies,
      workflowStages: calculateWorkflowStages(this.store.studies),
      ageing: calculateAgeing(this.store.studies, now),
      modalityActivity: this.store.modalityActivity,
      alerts: this.store.alerts,
      recentActivity,
      generatedAt: now.toISOString(),
      dataSource: 'MOCK',
    });
  }

  async getManagementStatistics() {
    return cloneValue(this.store.management);
  }

  async getSystemHealth() {
    return cloneValue(this.store.systemHealth);
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.store.alerts.find(candidate => candidate.id === alertId);
    if (!alert) throw new MockEntityNotFoundError('Alert', alertId);
    alert.acknowledged = true;
    this.store.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void): () => void {
    this.store.listeners.add(listener);
    return () => this.store.listeners.delete(listener);
  }
}
