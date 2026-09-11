import type { Modality, Study, StudyStatus, WorkflowEvent } from './study';

export type StatusTone = 'critical' | 'warning' | 'healthy' | 'info' | 'neutral';

export type DashboardMetric = {
  id:
    | 'examsToday'
    | 'unreadExams'
    | 'emergencyStudies'
    | 'assignedToMe'
    | 'pendingVerification'
    | 'averageTurnaroundTime'
    | 'delayedExams'
    | 'systemHealth';
  label: string;
  value: string;
  comparison: string;
  tone: StatusTone;
};

export type WorkflowStageCount = {
  status: StudyStatus;
  label: string;
  count: number;
};

export type AgeingBucket = {
  id: 'LT_30_MIN' | 'MIN_30_60' | 'HOUR_1_2' | 'HOUR_2_4' | 'GT_4_HOURS' | 'GT_24_HOURS';
  label: string;
  count: number;
  tone: StatusTone;
};

export type ModalityActivity = {
  modality: Modality;
  label: string;
  studiesToday: number;
  state: 'RECENT' | 'IDLE' | 'NO_DATA';
  lastStudyReceivedAt: string | null;
};

export type DashboardAlert = {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  occurredAt: string;
  acknowledged: boolean;
  studyId?: string;
  componentId?: string;
};

export type DashboardSnapshot = {
  metrics: DashboardMetric[];
  priorityStudies: Study[];
  workflowStages: WorkflowStageCount[];
  ageing: AgeingBucket[];
  modalityActivity: ModalityActivity[];
  alerts: DashboardAlert[];
  recentActivity: WorkflowEvent[];
  generatedAt: string;
  dataSource: 'MOCK' | 'LIVE';
};
