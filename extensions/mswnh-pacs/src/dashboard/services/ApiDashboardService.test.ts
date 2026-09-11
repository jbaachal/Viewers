import { ApiDashboardService, DashboardApiError } from './ApiDashboardService';

const fetchMock = jest.fn();

function response(body: unknown, status = 200): Response {
  return { status, ok: status >= 200 && status < 300, json: async () => body } as Response;
}

const snapshot = {
  metrics: [],
  workflowStages: [],
  ageing: [],
  modalityActivity: [],
  alerts: [
    {
      id: 'sla-1',
      severity: 'WARNING',
      title: 'Delayed',
      message: 'Late',
      occurredAt: '2026-09-11T10:00:00Z',
      studyId: '1.2.3',
    },
  ],
  recentActivity: [],
  generatedAt: '2026-09-11T10:00:00Z',
  dataSource: 'LIVE',
};

describe('ApiDashboardService', () => {
  beforeAll(() => Object.defineProperty(globalThis, 'fetch', { value: fetchMock }));
  afterEach(() => fetchMock.mockReset());

  it('loads an authenticated live operational snapshot', async () => {
    fetchMock.mockResolvedValue(response(snapshot));
    const service = new ApiDashboardService('http://localhost:5255/', () => ({
      Authorization: 'Bearer token',
    }));

    const result = await service.getSnapshot();

    expect(result.dataSource).toBe('LIVE');
    expect(result.priorityStudies).toEqual([]);
    expect(result.alerts[0].acknowledged).toBe(false);
    expect(fetchMock.mock.calls[0]).toEqual([
      'http://localhost:5255/api/dashboard',
      { headers: { Accept: 'application/json', Authorization: 'Bearer token' } },
    ]);
  });

  it('retains locally acknowledged SLA alerts', async () => {
    fetchMock.mockResolvedValue(response(snapshot));
    const service = new ApiDashboardService('http://localhost:5255', () => ({}));
    await service.acknowledgeAlert('sla-1');

    const result = await service.getSnapshot();

    expect(result.alerts[0].acknowledged).toBe(true);
  });

  it('invokes reauthentication and surfaces unauthorized access', async () => {
    fetchMock.mockResolvedValue(response({ detail: 'Sign in again.' }, 401));
    const unauthenticated = jest.fn();
    const service = new ApiDashboardService('http://localhost:5255', () => ({}), unauthenticated);

    await expect(service.getSnapshot()).rejects.toEqual(
      expect.objectContaining<Partial<DashboardApiError>>({ status: 401 })
    );
    expect(unauthenticated).toHaveBeenCalledTimes(1);
  });
});
