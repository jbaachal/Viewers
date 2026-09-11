import type { DashboardAlert, DashboardSnapshot } from '../models';
import type { DashboardService } from './DashboardService';

type ApiSnapshot = Omit<DashboardSnapshot, 'priorityStudies' | 'alerts' | 'dataSource'> & {
  alerts: Array<Omit<DashboardAlert, 'acknowledged'>>;
  dataSource: string;
};

export class DashboardApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'DashboardApiError';
  }
}

export class ApiDashboardService implements DashboardService {
  private readonly acknowledgedAlerts = new Set<string>();
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly baseUrl: string,
    private readonly getAuthorizationHeaders: () => Record<string, string>,
    private readonly handleUnauthenticated?: () => void
  ) {}

  async getSnapshot(): Promise<DashboardSnapshot> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/api/dashboard`, {
      headers: { Accept: 'application/json', ...this.getAuthorizationHeaders() },
    });
    if (response.status === 401) this.handleUnauthenticated?.();
    if (!response.ok) {
      const problem = await response.json().catch(() => ({}));
      throw new DashboardApiError(
        response.status,
        problem.detail || problem.title || `Dashboard request failed (${response.status}).`
      );
    }

    const snapshot = (await response.json()) as ApiSnapshot;
    return {
      ...snapshot,
      priorityStudies: [],
      alerts: snapshot.alerts.map(alert => ({
        ...alert,
        acknowledged: this.acknowledgedAlerts.has(alert.id),
      })),
      dataSource: 'LIVE',
    };
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    this.acknowledgedAlerts.add(alertId);
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
