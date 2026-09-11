import type { MockDataStore } from '../mock';
import type { SystemMonitoringService } from './SystemMonitoringService';
import { cloneValue } from './serviceUtils';

export class MockSystemMonitoringService implements SystemMonitoringService {
  constructor(private readonly store: MockDataStore) {}

  async getSnapshot() {
    return cloneValue(this.store.systemHealth);
  }
}
