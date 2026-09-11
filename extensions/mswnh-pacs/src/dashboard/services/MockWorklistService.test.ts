import { createMockDataStore, MOCK_CURRENT_RADIOLOGIST_ID } from '../mock';
import { MockWorklistService } from './MockWorklistService';
import { MockWorkflowConflictError, MockWorkflowValidationError } from './serviceUtils';

const referenceNow = new Date('2026-09-10T09:00:00.000Z');

function createService() {
  return new MockWorklistService(
    createMockDataStore(referenceNow),
    MOCK_CURRENT_RADIOLOGIST_ID,
    () => referenceNow
  );
}

describe('MockWorklistService', () => {
  it('orders the default worklist by priority and age', async () => {
    const result = await createService().queryStudies({ pageSize: 20 });
    expect(result.studies.slice(0, 3).map(study => study.priority)).toEqual([
      'EMERGENCY',
      'EMERGENCY',
      'EMERGENCY',
    ]);
    expect(result.total).toBe(12);
  });

  it('combines search, quick filters, and pagination', async () => {
    const result = await createService().queryStudies({
      search: 'CT',
      quickFilters: ['UNREAD'],
      page: 1,
      pageSize: 2,
    });
    expect(result.total).toBe(3);
    expect(result.studies).toHaveLength(2);
  });

  it('enforces assignment ownership and reporting transitions', async () => {
    const service = createService();
    await expect(service.assignToMe('study-4')).rejects.toBeInstanceOf(MockWorkflowConflictError);
    const assigned = await service.assignToMe('study-1');
    expect(assigned.status).toBe('ASSIGNED');
    const inReview = await service.startReporting('study-1');
    expect(inReview.status).toBe('IN_REVIEW');
    const reported = await service.markReported('study-1');
    expect(reported.status).toBe('REPORTED');
  });

  it('requires a reason for Emergency priority changes', async () => {
    const service = createService();
    await expect(service.changePriority('study-10', 'EMERGENCY')).rejects.toBeInstanceOf(
      MockWorkflowValidationError
    );
    const updated = await service.changePriority('study-10', 'EMERGENCY', 'Acute deterioration');
    expect(updated.priority).toBe('EMERGENCY');
  });

  it('records notes and popup-on-open metadata', async () => {
    const service = createService();
    const note = await service.addStudyNote('study-2', {
      type: 'URGENT',
      text: 'Call the clinical team.',
      popupOnOpen: true,
    });
    const study = await service.getStudy('study-2');
    expect(note.popupOnOpen).toBe(true);
    expect(study?.notes[0].text).toBe('Call the clinical team.');
    expect(study?.workflowHistory[0].type).toBe('NOTE_ADDED');
  });
});
