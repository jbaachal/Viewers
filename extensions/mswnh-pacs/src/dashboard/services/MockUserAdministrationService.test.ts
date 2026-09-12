import { MockUserAdministrationService } from './MockUserAdministrationService';

describe('MockUserAdministrationService', () => {
  beforeAll(() =>
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      configurable: true,
      value: () => 'generated-user-id',
    })
  );

  it('does not retain a submitted password in the user record', async () => {
    const service = new MockUserAdministrationService();

    const created = await service.createUser({
      username: 'reader.one',
      firstName: 'Reader',
      lastName: 'One',
      email: 'reader.one@example.org',
      enabled: true,
      initialPassword: 'a-secure-passphrase',
      temporaryPassword: true,
      roles: ['RADIOLOGIST'],
    });

    expect(created).not.toHaveProperty('initialPassword');
    expect(created).not.toHaveProperty('temporaryPassword');
  });

  it('offers the same approved role set as the live service', async () => {
    const service = new MockUserAdministrationService();

    await expect(service.getRoles()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'SUPER_ADMINISTRATOR',
          displayName: 'Super Administrator',
        }),
        expect.objectContaining({ name: 'RADIOLOGY_RESIDENT' }),
        expect.objectContaining({ name: 'DEPARTMENT_HEAD' }),
      ])
    );
  });
});
