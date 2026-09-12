import { ApiSystemMonitoringService, SystemMonitoringApiError } from './ApiSystemMonitoringService';

const fetchMock = jest.fn();

function response(body: unknown, status = 200): Response {
  return { status, ok: status >= 200 && status < 300, json: async () => body } as Response;
}

describe('ApiSystemMonitoringService', () => {
  beforeAll(() => Object.defineProperty(globalThis, 'fetch', { value: fetchMock }));
  afterEach(() => fetchMock.mockReset());

  it('loads authenticated live checks and maps API health states', async () => {
    fetchMock.mockResolvedValue(
      response({
        overallState: 'Warning',
        availabilityPercent: 87.5,
        availabilityWindow: 'Current configured checks',
        storage: null,
        lastSuccessfulBackupAt: null,
        failedDicomAssociations24Hours: null,
        offlineModalityCount: null,
        devices: [
          {
            id: 'ct-01',
            name: 'CT 01',
            modalities: ['CT'],
            manufacturer: null,
            model: null,
            serialNumber: null,
            location: null,
            department: 'Radiology',
            state: 'Healthy',
            lastCheckedAt: '2026-09-11T10:00:00Z',
            responseTimeMs: 25,
            message: 'All 1 enabled AE title responded.',
            lastStudyReceivedAt: null,
            aeTitles: [
              {
                id: 'ct-store',
                aeTitle: 'CT_STORE',
                callingAeTitle: 'MSWNH_MONITOR',
                host: '10.0.0.10',
                port: 104,
                useTls: false,
                enabled: true,
                state: 'NotConfigured',
                lastCheckedAt: '2026-09-11T10:00:00Z',
                responseTimeMs: null,
                message: 'Disabled',
              },
            ],
          },
        ],
        generatedAt: '2026-09-11T10:00:00Z',
        dataSource: 'LIVE',
        components: [
          {
            id: 'backup',
            name: 'Backup service',
            kind: 'BACKUP',
            state: 'NotConfigured',
            lastCheckedAt: '2026-09-11T10:00:00Z',
            responseTimeMs: null,
            message: 'Unavailable',
          },
        ],
      })
    );
    const service = new ApiSystemMonitoringService('http://localhost:5255', () => ({
      Authorization: 'Bearer token',
    }));

    const result = await service.getSnapshot();

    expect(result.dataSource).toBe('LIVE');
    expect(result.overallState).toBe('WARNING');
    expect(result.components[0].state).toBe('NOT_CONFIGURED');
    expect(result.devices[0].state).toBe('HEALTHY');
    expect(result.devices[0].aeTitles[0].state).toBe('NOT_CONFIGURED');
    expect(fetchMock.mock.calls[0]).toEqual([
      'http://localhost:5255/api/system-monitoring',
      { headers: { Accept: 'application/json', Authorization: 'Bearer token' } },
    ]);
  });

  it('invokes reauthentication and surfaces unauthorized access', async () => {
    fetchMock.mockResolvedValue(response({ detail: 'Sign in again.' }, 401));
    const unauthenticated = jest.fn();
    const service = new ApiSystemMonitoringService(
      'http://localhost:5255',
      () => ({}),
      unauthenticated
    );

    await expect(service.getSnapshot()).rejects.toEqual(
      expect.objectContaining<Partial<SystemMonitoringApiError>>({ status: 401 })
    );
    expect(unauthenticated).toHaveBeenCalledTimes(1);
  });
});
