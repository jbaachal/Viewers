import type { Modality } from './study';

export type TimeSeriesPoint = {
  label: string;
  value: number;
};

export type CategoryStatistic = {
  label: string;
  value: number;
  secondaryValue?: number;
};

export type ProductivityStatistic = {
  id: string;
  name: string;
  role: 'RADIOLOGIST' | 'RADIOGRAPHER';
  examinations: number;
  reports: number;
  averageTurnaroundMinutes: number;
  withinSlaPercent: number;
};

export type ManagementStatistics = {
  dailyVolume: TimeSeriesPoint[];
  byModality: Array<{ modality: Modality; count: number }>;
  byDepartment: CategoryStatistic[];
  averageTurnaroundMinutes: TimeSeriesPoint[];
  reportedWithinSlaPercent: number;
  unreadBacklog: TimeSeriesPoint[];
  radiologistProductivity: ProductivityStatistic[];
  radiographerProductivity: ProductivityStatistic[];
  cancellationReasons: CategoryStatistic[];
  incompleteExaminations: CategoryStatistic[];
  referringPhysicianActivity: CategoryStatistic[];
  generatedAt: string;
  dataSource: 'MOCK';
};

export type ManagementReportFilters = {
  from: string;
  to: string;
  modality: Modality | '';
  priority: 'EMERGENCY' | 'URGENT' | 'ROUTINE' | '';
  status: string;
  location: string;
};

export type ManagementSummary = {
  totalExaminations: number;
  activeBacklog: number;
  emergencyAndUrgent: number;
  averageReportTurnaroundMinutes: number | null;
  reportedWithinSlaPercent: number | null;
  awaitingVerification: number;
  overdue: number;
  cancelledOrIncomplete: number;
};

export type ManagementProductivity = {
  radiologistId: string;
  radiologistName: string;
  reports: number;
  averageTurnaroundMinutes: number | null;
  withinSlaPercent: number | null;
};

export type ManagementReport = {
  from: string;
  to: string;
  generatedAt: string;
  summary: ManagementSummary;
  dailyVolume: TimeSeriesPoint[];
  byModality: TimeSeriesPoint[];
  byLocation: TimeSeriesPoint[];
  workflowStatuses: TimeSeriesPoint[];
  priorities: TimeSeriesPoint[];
  turnaroundTrend: CategoryStatistic[];
  slaByPriority: CategoryStatistic[];
  radiologistProductivity: ManagementProductivity[];
  cancellationReasons: TimeSeriesPoint[];
  incompleteReasons: TimeSeriesPoint[];
  referringClinicianActivity: TimeSeriesPoint[];
  radiographerProductivityAvailable: boolean;
  dataSource: 'MOCK' | 'LIVE';
};
