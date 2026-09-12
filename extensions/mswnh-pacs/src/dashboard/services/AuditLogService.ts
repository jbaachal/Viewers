import type { AuditLogQuery, AuditLogResult } from '../models';

export interface AuditLogService {
  getEvents(query?: AuditLogQuery): Promise<AuditLogResult>;
}
