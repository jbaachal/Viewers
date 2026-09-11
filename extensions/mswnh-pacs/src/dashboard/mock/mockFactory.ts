import type { DashboardAlert, ModalityActivity, Study } from '../models';
import { createMockAlerts, createMockModalityActivity } from './mockDashboard';
import { createMockManagementStatistics } from './mockManagement';
import { createMockStudies } from './mockStudies';
import { createMockSystemHealth } from './mockSystemHealth';

export type MockDataStore = {
  referenceNow: Date;
  studies: Study[];
  alerts: DashboardAlert[];
  modalityActivity: ModalityActivity[];
  management: ReturnType<typeof createMockManagementStatistics>;
  systemHealth: ReturnType<typeof createMockSystemHealth>;
  listeners: Set<() => void>;
};

export function createMockDataStore(referenceNow = new Date()): MockDataStore {
  return {
    referenceNow,
    studies: createMockStudies(referenceNow),
    alerts: createMockAlerts(referenceNow),
    modalityActivity: createMockModalityActivity(referenceNow),
    management: createMockManagementStatistics(referenceNow),
    systemHealth: createMockSystemHealth(referenceNow),
    listeners: new Set(),
  };
}
