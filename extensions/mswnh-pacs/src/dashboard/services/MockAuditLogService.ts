import type { AuditEvent, AuditLogQuery, AuditLogResult } from '../models';
import type { AuditLogService } from './AuditLogService';

const mockEvents: AuditEvent[] = [
  {
    id: 'mock:1',
    occurredAt: new Date().toISOString(),
    category: 'WORKFLOW',
    action: 'STUDY_ASSIGNED',
    outcome: 'SUCCESS',
    severity: 'INFO',
    actorId: 'demo-radiologist',
    actorName: 'Demo Radiologist',
    actorRole: 'RADIOLOGIST',
    resourceType: 'Study',
    resourceId: '1.2.840.demo',
    summary: 'Study assigned',
    detail: 'Demonstration audit event',
  },
];

export class MockAuditLogService implements AuditLogService {
  async getEvents(query: AuditLogQuery = {}): Promise<AuditLogResult> {
    const first = query.first ?? 0;
    const pageSize = query.pageSize ?? 50;
    const search = query.search?.toLowerCase();
    const events = mockEvents.filter(event => {
      if (query.category && event.category !== query.category) return false;
      if (query.action && !event.action.toLowerCase().includes(query.action.toLowerCase()))
        return false;
      if (
        query.actor &&
        !(event.actorName || event.actorId).toLowerCase().includes(query.actor.toLowerCase())
      )
        return false;
      return (
        !search ||
        [event.action, event.summary, event.resourceId, event.actorName]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(search))
      );
    });
    return {
      events: events.slice(first, first + pageSize),
      total: events.length,
      first,
      pageSize,
      generatedAt: new Date().toISOString(),
      dataSource: 'MOCK',
    };
  }
}
