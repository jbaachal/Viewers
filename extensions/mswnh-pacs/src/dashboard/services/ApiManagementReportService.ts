import type {
  CategoryStatistic,
  ManagementReport,
  ManagementReportFilters,
  TimeSeriesPoint,
} from '../models';
import type { ManagementReportService } from './ManagementReportService';

type ApiPoint = { label: string; value: number; secondaryValue?: number | null };
type ApiReport = Omit<ManagementReport, 'dataSource' | 'turnaroundTrend' | 'slaByPriority'> & {
  turnaroundTrend: ApiPoint[];
  slaByPriority: ApiPoint[];
};

function point(item: ApiPoint): TimeSeriesPoint {
  return { label: item.label, value: item.value };
}

function statistic(item: ApiPoint): CategoryStatistic {
  return {
    label: item.label,
    value: item.value,
    secondaryValue: item.secondaryValue ?? undefined,
  };
}

export class ApiManagementReportService implements ManagementReportService {
  constructor(
    private readonly baseUrl: string,
    private readonly getAuthorizationHeaders: () => Record<string, string>,
    private readonly handleUnauthenticated?: () => void
  ) {}

  async getReport(filters: ManagementReportFilters): Promise<ManagementReport> {
    const query = new URLSearchParams({
      from: new Date(`${filters.from}T00:00:00+03:00`).toISOString(),
      to: new Date(`${filters.to}T23:59:59+03:00`).toISOString(),
    });
    if (filters.modality) query.append('modality', filters.modality);
    if (filters.priority) {
      query.append(
        'priority',
        filters.priority[0] + filters.priority.slice(1).toLocaleLowerCase()
      );
    }
    if (filters.status) query.append('status', filters.status);
    if (filters.location.trim()) query.set('location', filters.location.trim());

    const response = await fetch(
      `${this.baseUrl.replace(/\/$/, '')}/api/management/reports?${query}`,
      {
        headers: { Accept: 'application/json', ...this.getAuthorizationHeaders() },
      }
    );
    if (response.status === 401) this.handleUnauthenticated?.();
    if (!response.ok) {
      const problem = await response.json().catch(() => ({}));
      throw new ManagementReportApiError(
        response.status,
        problem.detail || problem.title || `Management Report API failed (${response.status}).`
      );
    }
    const report = (await response.json()) as ApiReport;
    return {
      ...report,
      dailyVolume: report.dailyVolume.map(point),
      byModality: report.byModality.map(point),
      byLocation: report.byLocation.map(point),
      workflowStatuses: report.workflowStatuses.map(point),
      priorities: report.priorities.map(point),
      turnaroundTrend: report.turnaroundTrend.map(statistic),
      slaByPriority: report.slaByPriority.map(statistic),
      cancellationReasons: report.cancellationReasons.map(point),
      incompleteReasons: report.incompleteReasons.map(point),
      referringClinicianActivity: report.referringClinicianActivity.map(point),
      dataSource: 'LIVE',
    };
  }
}

export class ManagementReportApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ManagementReportApiError';
  }
}
