import type { SlaSettings, UpdateSlaSettings } from '../models';
import type { SlaAdministrationService } from './SlaAdministrationService';

export class ApiSlaAdministrationService implements SlaAdministrationService {
  constructor(
    private readonly baseUrl: string,
    private readonly getAuthorizationHeaders: () => Record<string, string>,
    private readonly handleUnauthenticated?: () => void
  ) {}

  getSettings(): Promise<SlaSettings> {
    return this.request<SlaSettings>();
  }

  updateSettings(input: UpdateSlaSettings): Promise<SlaSettings> {
    return this.request<SlaSettings>({ method: 'PUT', body: JSON.stringify(input) });
  }

  private async request<T>(init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/api/administration/sla`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...this.getAuthorizationHeaders(),
        ...init.headers,
      },
    });
    if (response.status === 401) this.handleUnauthenticated?.();
    if (!response.ok) {
      const problem = await response.json().catch(() => ({}));
      throw new Error(
        problem.detail || problem.title || `SLA settings request failed (${response.status}).`
      );
    }
    return (await response.json()) as T;
  }
}
