import type { AuditLogQuery, AuditLogResult } from '../models';
import type { AuditLogService } from './AuditLogService';

export class ApiAuditLogService implements AuditLogService {
  constructor(
    private readonly baseUrl: string,
    private readonly getAuthorizationHeaders: () => Record<string, string>,
    private readonly handleUnauthenticated?: () => void
  ) {}

  async getEvents(query: AuditLogQuery = {}): Promise<AuditLogResult> {
    const parameters = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        parameters.set(key, String(value));
      }
    });
    const response = await fetch(
      `${this.baseUrl.replace(/\/$/, '')}/api/audit-log?${parameters.toString()}`,
      {
        headers: { Accept: 'application/json', ...this.getAuthorizationHeaders() },
      }
    );
    if (response.status === 401) this.handleUnauthenticated?.();
    if (!response.ok) {
      const problem = await response.json().catch(() => ({}));
      throw new Error(
        problem.detail || problem.title || `Audit log request failed (${response.status}).`
      );
    }
    return (await response.json()) as AuditLogResult;
  }
}
