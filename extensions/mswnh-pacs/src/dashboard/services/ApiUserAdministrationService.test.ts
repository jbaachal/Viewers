import {
  ApiUserAdministrationService,
  UserAdministrationApiError,
} from './ApiUserAdministrationService';

const fetchMock = jest.fn();

function response(body: unknown, status = 200): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response;
}

describe('ApiUserAdministrationService', () => {
  beforeAll(() => Object.defineProperty(globalThis, 'fetch', { value: fetchMock }));
  afterEach(() => fetchMock.mockReset());

  it('loads a filtered page with authenticated requests', async () => {
    fetchMock.mockResolvedValue(response({ users: [], total: 0, first: 25, pageSize: 25 }));
    const service = new ApiUserAdministrationService('http://localhost:5255/', () => ({
      Authorization: 'Bearer token',
    }));

    await service.getUsers('pacs admin', 25, 25);

    expect(fetchMock.mock.calls[0]).toEqual([
      'http://localhost:5255/api/administration/users?first=25&pageSize=25&search=pacs+admin',
      {
        headers: { Accept: 'application/json', Authorization: 'Bearer token' },
      },
    ]);
  });

  it('creates users without modifying the submitted payload', async () => {
    const input = {
      username: 'reader.one',
      firstName: 'Reader',
      lastName: 'One',
      email: 'reader.one@example.org',
      enabled: true,
      initialPassword: 'a-secure-passphrase',
      temporaryPassword: true,
      roles: ['RADIOLOGIST'],
    };
    fetchMock.mockResolvedValue(response({ id: 'user-1', ...input }));
    const service = new ApiUserAdministrationService('http://localhost:5255', () => ({}));

    await service.createUser(input);

    expect(fetchMock.mock.calls[0]).toEqual([
      'http://localhost:5255/api/administration/users',
      {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      },
    ]);
  });

  it('invokes reauthentication and surfaces problem details on unauthorized access', async () => {
    fetchMock.mockResolvedValue(response({ detail: 'Sign in again.' }, 401));
    const unauthenticated = jest.fn();
    const service = new ApiUserAdministrationService(
      'http://localhost:5255',
      () => ({}),
      unauthenticated
    );

    await expect(service.getRoles()).rejects.toEqual(
      expect.objectContaining<Partial<UserAdministrationApiError>>({
        status: 401,
        message: 'Sign in again.',
      })
    );
    expect(unauthenticated).toHaveBeenCalledTimes(1);
  });

  it('handles successful password resets with no response body', async () => {
    fetchMock.mockResolvedValue(response(undefined, 204));
    const service = new ApiUserAdministrationService('http://localhost:5255', () => ({}));

    await expect(
      service.resetPassword('user/1', 'another-secure-passphrase', true)
    ).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:5255/api/administration/users/user%2F1/password'
    );
  });
});
