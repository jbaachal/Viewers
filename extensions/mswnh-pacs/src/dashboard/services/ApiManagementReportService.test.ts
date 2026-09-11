import { ApiManagementReportService, ManagementReportApiError } from './ApiManagementReportService';

const fetchMock = jest.fn();

function response(body: unknown, status = 200): Response {
  return { status, ok: status >= 200 && status < 300, json: async () => body } as Response;
}

const report = {
  from: '2026-09-05T21:00:00Z',
  to: '2026-09-12T20:59:59Z',
  generatedAt: '2026-09-11T10:00:00Z',
  summary: {
    totalExaminations: 2,
    activeBacklog: 1,
    emergencyAndUrgent: 1,
    averageReportTurnaroundMinutes: 45,
    reportedWithinSlaPercent: 100,
    awaitingVerification: 1,
    overdue: 0,
    cancelledOrIncomplete: 0,
  },
  dailyVolume: [{ label: '2026-09-11', value: 2 }],
  byModality: [{ label: 'CT', value: 2 }],
  byLocation: [], workflowStatuses: [], priorities: [],
  turnaroundTrend: [{ label: '2026-09-11', value: 45, secondaryValue: 1 }],
  slaByPriority: [{ label: 'Urgent', value: 100, secondaryValue: 1 }],
  radiologistProductivity: [], cancellationReasons: [], incompleteReasons: [],
  referringClinicianActivity: [], radiographerProductivityAvailable: false,
};

describe('ApiManagementReportService', () => {
  beforeAll(() => Object.defineProperty(globalThis, 'fetch', { value: fetchMock }));
  afterEach(() => fetchMock.mockReset());

  it('requests authenticated aggregates with Kampala date boundaries', async () => {
    fetchMock.mockResolvedValue(response(report));
    const service = new ApiManagementReportService('http://localhost:5255', () => ({ Authorization: 'Bearer token' }));

    const result = await service.getReport({ from: '2026-09-05', to: '2026-09-11', modality: 'CT', priority: '', status: '', location: '' });

    expect(result.dataSource).toBe('LIVE');
    expect(result.summary.totalExaminations).toBe(2);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/management/reports?');
    expect(fetchMock.mock.calls[0][0]).toContain('modality=CT');
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Bearer token' });
  });

  it('surfaces forbidden management access', async () => {
    fetchMock.mockResolvedValue(response({ detail: 'Forbidden' }, 403));
    const service = new ApiManagementReportService('http://localhost:5255', () => ({}));

    await expect(service.getReport({ from: '2026-09-05', to: '2026-09-11', modality: '', priority: '', status: '', location: '' }))
      .rejects.toEqual(expect.objectContaining<Partial<ManagementReportApiError>>({ status: 403 }));
  });
});
