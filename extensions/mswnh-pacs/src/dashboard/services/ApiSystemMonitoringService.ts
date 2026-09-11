import type { HealthState, SystemHealthSnapshot } from '../models';
import type { SystemMonitoringService } from './SystemMonitoringService';

type ApiSnapshot = Omit<SystemHealthSnapshot, 'overallState' | 'components' | 'dataSource'> & {
  overallState: string;
  dataSource: string;
  components: Array<Omit<SystemHealthSnapshot['components'][number], 'state'> & { state: string }>;
};

function mapState(value: string): HealthState {
  const normalized = value.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
  return (
    ['HEALTHY', 'WARNING', 'CRITICAL', 'OFFLINE', 'UNKNOWN', 'NOT_CONFIGURED'].includes(normalized)
      ? normalized
      : 'UNKNOWN'
  ) as HealthState;
}

export class SystemMonitoringApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'SystemMonitoringApiError';
  }
}

export class ApiSystemMonitoringService implements SystemMonitoringService {
  constructor(
    private readonly baseUrl: string,
    private readonly getAuthorizationHeaders: () => Record<string, string>,
    private readonly handleUnauthenticated?: () => void
  ) {}

  async getSnapshot(): Promise<SystemHealthSnapshot> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/api/system-monitoring`, {
      headers: { Accept: 'application/json', ...this.getAuthorizationHeaders() },
    });
    if (response.status === 401) this.handleUnauthenticated?.();
    if (!response.ok) {
      const problem = await response.json().catch(() => ({}));
      throw new SystemMonitoringApiError(
        response.status,
        problem.detail || problem.title || `System monitoring request failed (${response.status}).`
      );
    }
    const snapshot = (await response.json()) as ApiSnapshot;
    return {
      ...snapshot,
      overallState: mapState(snapshot.overallState),
      components: snapshot.components.map(component => ({
        ...component,
        state: mapState(component.state),
      })),
      dataSource: 'LIVE',
    };
  }
}
