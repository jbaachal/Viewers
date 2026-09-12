import { ApiAuditLogService } from './ApiAuditLogService';

const fetchMock = jest.fn();

function response(body: unknown, status = 200): Response {
  return { status, ok: status >= 200 && status < 300, json: async () => body } as Response;
}

describe('ApiAuditLogService', () => {
  beforeAll(() => Object.defineProperty(globalThis, 'fetch', { value: fetchMock }));
  afterEach(() => fetchMock.mockReset());

  it('loads a filtered authenticated audit page', async () => {
    fetchMock.mockResolvedValue(response({ events: [], total: 0 }));
    const service = new ApiAuditLogService('http://localhost:5255/', () => ({
      Authorization: 'Bearer token',
    }));

    await service.getEvents({ category: 'SECURITY', actor: 'admin', first: 50, pageSize: 50 });

    expect(fetchMock.mock.calls[0]).toEqual([
      'http://localhost:5255/api/audit-log?category=SECURITY&actor=admin&first=50&pageSize=50',
      { headers: { Accept: 'application/json', Authorization: 'Bearer token' } },
    ]);
  });

  it('requests reauthentication and reports API problem details', async () => {
    fetchMock.mockResolvedValue(response({ detail: 'Sign in again.' }, 401));
    const unauthenticated = jest.fn();
    const service = new ApiAuditLogService('http://localhost:5255', () => ({}), unauthenticated);

    await expect(service.getEvents()).rejects.toThrow('Sign in again.');
    expect(unauthenticated).toHaveBeenCalledTimes(1);
  });
});
