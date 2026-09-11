import type { DashboardSnapshot } from '../models';

export interface DashboardService {
  getSnapshot(): Promise<DashboardSnapshot>;
  acknowledgeAlert(alertId: string): Promise<void>;
  subscribe(listener: () => void): () => void;
}
