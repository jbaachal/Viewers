import type { ManagementReport, ManagementReportFilters } from '../models';
import type { MockDataStore } from '../mock';
import type { ManagementReportService } from './ManagementReportService';
import { cloneValue } from './serviceUtils';

export class MockManagementReportService implements ManagementReportService {
  constructor(private readonly store: MockDataStore) {}

  async getReport(filters: ManagementReportFilters): Promise<ManagementReport> {
    const data = cloneValue(this.store.management);
    const total = data.dailyVolume.reduce((sum, item) => sum + item.value, 0);
    return {
      from: new Date(`${filters.from}T00:00:00+03:00`).toISOString(),
      to: new Date(`${filters.to}T23:59:59+03:00`).toISOString(),
      generatedAt: data.generatedAt,
      summary: {
        totalExaminations: total,
        activeBacklog: data.unreadBacklog.at(-1)?.value ?? 0,
        emergencyAndUrgent: 0,
        averageReportTurnaroundMinutes:
          data.averageTurnaroundMinutes.at(-1)?.value ?? null,
        reportedWithinSlaPercent: data.reportedWithinSlaPercent,
        awaitingVerification: 0,
        overdue: 0,
        cancelledOrIncomplete: data.cancellationReasons.reduce(
          (sum, item) => sum + item.value,
          0
        ),
      },
      dailyVolume: data.dailyVolume,
      byModality: data.byModality.map(item => ({ label: item.modality, value: item.count })),
      byLocation: data.byDepartment,
      workflowStatuses: [],
      priorities: [],
      turnaroundTrend: data.averageTurnaroundMinutes,
      slaByPriority: [],
      radiologistProductivity: data.radiologistProductivity.map(item => ({
        radiologistId: item.id,
        radiologistName: item.name,
        reports: item.reports,
        averageTurnaroundMinutes: item.averageTurnaroundMinutes,
        withinSlaPercent: item.withinSlaPercent,
      })),
      cancellationReasons: data.cancellationReasons,
      incompleteReasons: data.incompleteExaminations,
      referringClinicianActivity: data.referringPhysicianActivity,
      radiographerProductivityAvailable: data.radiographerProductivity.length > 0,
      dataSource: 'MOCK',
    };
  }
}
