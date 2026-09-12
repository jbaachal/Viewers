import { ApiAccountService } from './ApiAccountService';

const fetchMock = jest.fn();

function response(status = 204): Response {
  return { status, ok: status >= 200 && status < 300, json: async () => ({}) } as Response;
}

describe('ApiAccountService', () => {
  beforeAll(() => Object.defineProperty(globalThis, 'fetch', { value: fetchMock }));
  afterEach(() => fetchMock.mockReset());

  it('changes the authenticated user password without accepting a user identifier', async () => {
    fetchMock.mockResolvedValue(response());
    const service = new ApiAccountService('http://localhost:5255', () => ({
      Authorization: 'Bearer token',
    }));

    await service.changePassword('old-password', 'new-secure-passphrase');

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:5255/api/account/password', {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      },
      body: JSON.stringify({
        oldPassword: 'old-password',
        newPassword: 'new-secure-passphrase',
      }),
    });
  });
});
