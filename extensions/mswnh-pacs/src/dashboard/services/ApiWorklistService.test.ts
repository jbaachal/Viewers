import { ApiWorklistService, WorkflowApiError } from './ApiWorklistService';

const apiStudy = {
  studyInstanceUid: '1.2.3.4',
  accessionNumber: 'ACC-1',
  patientId: 'PAT-1',
  patientName: 'TEST PATIENT',
  patientBirthDate: '19900101',
  patientSex: 'F',
  modality: 'CT',
  procedureName: 'CT head',
  patientLocation: 'Emergency Unit',
  clinicalHistory: 'Head injury',
  referringPhysician: 'DR TEST',
  studyAt: '2026-09-10T10:00:00Z',
  archiveReceivedAt: '2026-09-10T10:05:00Z',
  slaDueAt: null,
  seriesCount: 2,
  instanceCount: 120,
  priority: 'Emergency',
  status: 'InReview',
  assignedRadiologistId: 'rad-1',
  assignedRadiologistName: 'Dr Test',
  assignedAt: '2026-09-10T10:10:00Z',
  reservationOwnerId: null,
  reservationOwnerName: null,
  reservationExpiresAt: null,
  firstOpenedAt: null,
  reportingStartedAt: '2026-09-10T10:15:00Z',
  reportedAt: null,
  verifiedAt: null,
  noteCount: 1,
  hasPopupNote: true,
  version: '6ddd8f67-413f-4c44-a917-06af2d00db0a',
};

const fetchMock = jest.fn();

function response(body: unknown, status = 200): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response;
}

describe('ApiWorklistService', () => {
  beforeAll(() => Object.defineProperty(globalThis, 'fetch', { value: fetchMock }));
  afterEach(() => fetchMock.mockReset());

  it('maps API studies and sends the authenticated filters', async () => {
    fetchMock.mockResolvedValue(response({ studies: [apiStudy], total: 1, page: 1, pageSize: 20 }));
    const service = new ApiWorklistService('http://localhost:5255', () => ({
      Authorization: 'Bearer token',
    }));

    const result = await service.queryStudies({
      priorities: ['EMERGENCY'],
      assignedToMe: true,
    });

    expect(result.studies[0]).toMatchObject({
      id: '1.2.3.4',
      priority: 'EMERGENCY',
      status: 'IN_REVIEW',
      assignedRadiologistName: 'Dr Test',
      noteCount: 1,
    });
    expect(fetchMock.mock.calls[0][0]).toContain('priority=Emergency');
    expect(fetchMock.mock.calls[0][0]).toContain('assignedToMe=true');
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer token',
    });
  });

  it('loads popup notes and previous examinations with study details', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({
          study: apiStudy,
          notes: [
            {
              id: 'note-1',
              studyInstanceUid: '1.2.3.4',
              noteType: 'URGENT',
              noteText: 'Call ward',
              popupOnOpen: true,
              createdBy: 'rad-1',
              createdByName: 'Dr Test',
              createdAt: '2026-09-10T10:06:00Z',
            },
          ],
          workflowHistory: [],
        })
      )
      .mockResolvedValueOnce(response([]));
    const service = new ApiWorklistService('http://localhost:5255', () => ({}));

    const study = await service.getStudy('1.2.3.4');

    expect(study?.notes[0]).toMatchObject({ text: 'Call ward', popupOnOpen: true });
  });

  it('maps live SLA alerts to dashboard notifications', async () => {
    fetchMock.mockResolvedValue(
      response([
        {
          id: 'sla:1.2.3.4',
          studyInstanceUid: '1.2.3.4',
          severity: 'Critical',
          title: 'Reporting SLA breached',
          message: 'Emergency CT study is 12 minutes overdue.',
          dueAt: '2026-09-10T10:30:00Z',
        },
      ])
    );
    const service = new ApiWorklistService('http://localhost:5255', () => ({}));

    const alerts = await service.getAlerts();

    expect(alerts[0]).toMatchObject({
      severity: 'CRITICAL',
      studyId: '1.2.3.4',
      acknowledged: false,
    });
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:5255/api/worklist/alerts');
  });

  it('reassigns a study through the manager assignment endpoint', async () => {
    fetchMock
      .mockResolvedValueOnce(response({ studies: [apiStudy], total: 1, page: 1, pageSize: 20 }))
      .mockResolvedValueOnce(response(apiStudy))
      .mockResolvedValueOnce(response({ study: apiStudy, notes: [], workflowHistory: [] }))
      .mockResolvedValueOnce(response([]));
    const service = new ApiWorklistService('http://localhost:5255', () => ({}));
    await service.queryStudies();

    await service.assign('1.2.3.4', 'admin-1', 'PACS Admin');

    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:5255/api/worklist/1.2.3.4/assign');
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toEqual({
      radiologistId: 'admin-1',
      radiologistName: 'PACS Admin',
      version: apiStudy.version,
    });
  });

  it('surfaces Problem Details and invokes the unauthenticated handler', async () => {
    fetchMock.mockResolvedValue(response({ detail: 'Sign in again.' }, 401));
    const unauthenticated = jest.fn();
    const service = new ApiWorklistService('http://localhost:5255', () => ({}), unauthenticated);

    await expect(service.queryStudies()).rejects.toEqual(
      expect.objectContaining<Partial<WorkflowApiError>>({ status: 401, message: 'Sign in again.' })
    );
    expect(unauthenticated).toHaveBeenCalledTimes(1);
  });
});
