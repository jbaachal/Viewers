import type { SystemHealthSnapshot } from '../models';

export interface SystemMonitoringService {
  getSnapshot(): Promise<SystemHealthSnapshot>;
}
