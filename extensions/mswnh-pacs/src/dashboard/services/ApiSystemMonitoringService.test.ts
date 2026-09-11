import { ApiSystemMonitoringService, SystemMonitoringApiError } from './ApiSystemMonitoringService';

const fetchMock = jest.fn();

function response(body: unknown, status = 200): Response {
  return { status, ok: status >= 200 && status < 300, json: async () => body } as Response;
}

describe('ApiSystemMonitoringService', () => {
  beforeAll(() => Object.defineProperty(globalThis, 'fetch', { value: fetchMock }));
  afterEach(() => fetchMock.mockReset());

  it('loads authenticated live checks and maps API health states', async () => {
    fetchMock.mockResolvedValue(response({
      overallState: 'Warning',
      availabilityPercent: 87.5,
      availabilityWindow: 'Current configured checks',
      storage: null,
      lastSuccessfulBackupAt: null,
      failedDicomAssociations24Hours: null,
      offlineModalityCount: null,
      generatedAt: '2026-09-11T10:00:00Z',
      dataSource: 'LIVE',
      components: [{ id: 'backup', name: 'Backup service', kind: 'BACKUP', state: 'NotConfigured', lastCheckedAt: '2026-09-11T10:00:00Z', responseTimeMs: null, message: 'Unavailable' }],
    }));
    const service = new ApiSystemMonitoringService('http://localhost:5255', () => ({ Authorization: 'Bearer token' }));

    const result = await service.getSnapshot();

    expect(result.dataSource).toBe('LIVE');
    expect(result.overallState).toBe('WARNING');
    expect(result.components[0].state).toBe('NOT_CONFIGURED');
    expect(fetchMock.mock.calls[0]).toEqual([
      'http://localhost:5255/api/system-monitoring',
      { headers: { Accept: 'application/json', Authorization: 'Bearer token' } },
    ]);
  });

  it('invokes reauthentication and surfaces unauthorized access', async () => {
    fetchMock.mockResolvedValue(response({ detail: 'Sign in again.' }, 401));
    const unauthenticated = jest.fn();
    const service = new ApiSystemMonitoringService('http://localhost:5255', () => ({}), unauthenticated);

    await expect(service.getSnapshot()).rejects.toEqual(
      expect.objectContaining<Partial<SystemMonitoringApiError>>({ status: 401 })
    );
    expect(unauthenticated).toHaveBeenCalledTimes(1);
  });
});
