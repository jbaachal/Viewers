import type { ManagementReport, ManagementReportFilters } from '../models';

export interface ManagementReportService {
  getReport(filters: ManagementReportFilters): Promise<ManagementReport>;
}
