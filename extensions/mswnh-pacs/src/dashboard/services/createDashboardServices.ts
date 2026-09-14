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
import type { UserAdministrationService } from './UserAdministrationService';
import { ApiUserAdministrationService } from './ApiUserAdministrationService';
import { MockUserAdministrationService } from './MockUserAdministrationService';
import type { SlaAdministrationService } from './SlaAdministrationService';
import { ApiSlaAdministrationService } from './ApiSlaAdministrationService';
import { MockSlaAdministrationService } from './MockSlaAdministrationService';
import type { AccountService } from './AccountService';
import { ApiAccountService } from './ApiAccountService';
import { MockAccountService } from './MockAccountService';
import type { AuditLogService } from './AuditLogService';
import { ApiAuditLogService } from './ApiAuditLogService';
import { MockAuditLogService } from './MockAuditLogService';
import type { DeviceInventoryService } from './DeviceInventoryService';
import { ApiDeviceInventoryService } from './ApiDeviceInventoryService';
import { MockDeviceInventoryService } from './MockDeviceInventoryService';

export type DashboardServices = {
  dashboard: DashboardService;
  worklist: WorklistService;
  management: ManagementReportService;
  systemMonitoring: SystemMonitoringService;
  userAdministration: UserAdministrationService;
  slaAdministration: SlaAdministrationService;
  account: AccountService;
  auditLog: AuditLogService;
  deviceInventory: DeviceInventoryService;
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
      userAdministration: new ApiUserAdministrationService(
        baseUrl,
        options.getAuthorizationHeaders,
        options.handleUnauthenticated
      ),
      slaAdministration: new ApiSlaAdministrationService(
        baseUrl,
        options.getAuthorizationHeaders,
        options.handleUnauthenticated
      ),
      account: new ApiAccountService(
        baseUrl,
        options.getAuthorizationHeaders,
        options.handleUnauthenticated
      ),
      auditLog: new ApiAuditLogService(
        baseUrl,
        options.getAuthorizationHeaders,
        options.handleUnauthenticated
      ),
      deviceInventory: new ApiDeviceInventoryService(
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
    userAdministration: new MockUserAdministrationService(),
    slaAdministration: new MockSlaAdministrationService(),
    account: new MockAccountService(),
    auditLog: new MockAuditLogService(),
    deviceInventory: new MockDeviceInventoryService(),
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
