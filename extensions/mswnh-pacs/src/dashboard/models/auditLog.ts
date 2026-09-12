export type AuditCategory = 'WORKFLOW' | 'NOTE' | 'REPORT' | 'SLA' | 'ADMINISTRATION' | 'SECURITY';

export type AuditEvent = {
  id: string;
  occurredAt: string;
  category: AuditCategory | string;
  action: string;
  outcome: string;
  severity: string;
  actorId: string;
  actorName?: string | null;
  actorRole?: string | null;
  resourceType: string;
  resourceId?: string | null;
  summary: string;
  detail?: string | null;
  sourceIp?: string | null;
  correlationId?: string | null;
};

export type AuditLogQuery = {
  search?: string;
  category?: string;
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
  first?: number;
  pageSize?: number;
};

export type AuditLogResult = {
  events: AuditEvent[];
  total: number;
  first: number;
  pageSize: number;
  generatedAt: string;
  dataSource: 'LIVE' | 'MOCK';
};
