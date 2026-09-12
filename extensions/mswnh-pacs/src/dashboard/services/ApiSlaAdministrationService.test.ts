import { ApiSlaAdministrationService } from './ApiSlaAdministrationService';

const fetchMock = jest.fn();

function response(body: unknown, status = 200): Response {
  return { status, ok: status >= 200 && status < 300, json: async () => body } as Response;
}

describe('ApiSlaAdministrationService', () => {
  beforeAll(() => Object.defineProperty(globalThis, 'fetch', { value: fetchMock }));
  afterEach(() => fetchMock.mockReset());

  it('loads authenticated SLA settings', async () => {
    fetchMock.mockResolvedValue(response({ emergencyMinutes: 30, version: 'v1' }));
    const service = new ApiSlaAdministrationService('http://localhost:5255/', () => ({
      Authorization: 'Bearer token',
    }));

    await service.getSettings();

    expect(fetchMock.mock.calls[0]).toEqual([
      'http://localhost:5255/api/administration/sla',
      { headers: { Accept: 'application/json', Authorization: 'Bearer token' } },
    ]);
  });

  it('updates settings with concurrency and active-study choices', async () => {
    const input = {
      emergencyMinutes: 20,
      urgentMinutes: 90,
      routineMinutes: 720,
      warningBeforeDueMinutes: 15,
      version: 'version-1',
      applyToActiveStudies: true,
    };
    fetchMock.mockResolvedValue(response({ ...input, version: 'version-2' }));
    const service = new ApiSlaAdministrationService('http://localhost:5255', () => ({}));

    await service.updateSettings(input);

    expect(fetchMock.mock.calls[0]).toEqual([
      'http://localhost:5255/api/administration/sla',
      {
        method: 'PUT',
        body: JSON.stringify(input),
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      },
    ]);
  });

  it('requests reauthentication after an expired session', async () => {
    fetchMock.mockResolvedValue(response({ detail: 'Sign in again.' }, 401));
    const unauthenticated = jest.fn();
    const service = new ApiSlaAdministrationService(
      'http://localhost:5255',
      () => ({}),
      unauthenticated
    );

    await expect(service.getSettings()).rejects.toThrow('Sign in again.');
    expect(unauthenticated).toHaveBeenCalledTimes(1);
  });
});
