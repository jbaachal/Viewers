import { createMockDataStore } from '../mock';
import type { DashboardService } from './DashboardService';
import { MockDashboardService } from './MockDashboardService';
import { ApiDashboardService } from './ApiDashboardService';
import { MockWorklistService } from './MockWorklistService';
import { ApiWorklistService } from './ApiWorklistService';
import type { WorklistService } from './WorklistService';
import type { ManagementReportService } from './ManagementReportService';
import { ApiManagementReportService } from './ApiManagementReportService';
import { MockManagementReportService } from './MockManagementReportService';
import type { SystemMonitoringService } from './SystemMonitoringService';
import { ApiSystemMonitoringService } from './ApiSystemMonitoringService';
import { MockSystemMonitoringService } from './MockSystemMonitoringService';

export type DashboardServices = {
  dashboard: DashboardService;
  worklist: WorklistService;
  management: ManagementReportService;
  systemMonitoring: SystemMonitoringService;
  dataSource: 'MOCK' | 'LIVE';
};

export class DashboardIntegrationUnavailableError extends Error {
  constructor() {
    super('The Workflow API URL or authenticated OHIF service is not configured.');
    this.name = 'DashboardIntegrationUnavailableError';
  }
}

let singletonServices: DashboardServices | null = null;

export function createDashboardServices(options?: {
  useMockData?: boolean;
  referenceNow?: Date;
  getAuthorizationHeaders?: () => Record<string, string>;
  handleUnauthenticated?: () => void;
}): DashboardServices {
  const useMockData = options?.useMockData ?? window.config?.dashboard?.useMockData ?? true;
  const store = createMockDataStore(options?.referenceNow);
  if (!useMockData) {
    const baseUrl = window.config?.workflowApi?.baseUrl;
    if (!baseUrl || !options?.getAuthorizationHeaders) {
      throw new DashboardIntegrationUnavailableError();
    }
    return {
      dashboard: new ApiDashboardService(
        baseUrl,
        options.getAuthorizationHeaders,
        options.handleUnauthenticated
      ),
      worklist: new ApiWorklistService(
        baseUrl,
        options.getAuthorizationHeaders,
        options.handleUnauthenticated
      ),
      management: new ApiManagementReportService(
        baseUrl,
        options.getAuthorizationHeaders,
        options.handleUnauthenticated
      ),
      systemMonitoring: new ApiSystemMonitoringService(
        baseUrl,
        options.getAuthorizationHeaders,
        options.handleUnauthenticated
      ),
      dataSource: 'LIVE',
    };
  }
  return {
    dashboard: new MockDashboardService(store),
    worklist: new MockWorklistService(store),
    management: new MockManagementReportService(store),
    systemMonitoring: new MockSystemMonitoringService(store),
    dataSource: 'MOCK',
  };
}

export function getDashboardServices(
  options?: Parameters<typeof createDashboardServices>[0]
): DashboardServices {
  singletonServices ??= createDashboardServices(options);
  return singletonServices;
}

export function resetDashboardServicesForTests(): void {
  singletonServices = null;
}
