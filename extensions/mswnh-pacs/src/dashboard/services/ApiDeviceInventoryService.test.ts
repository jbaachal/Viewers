import { ApiDeviceInventoryService } from './ApiDeviceInventoryService';

describe('ApiDeviceInventoryService', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('loads the authenticated inventory', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => [] });
    const service = new ApiDeviceInventoryService('http://localhost:5255', () => ({
      Authorization: 'Bearer token',
    }));

    await expect(service.getDevices()).resolves.toEqual([]);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5255/api/administration/devices',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      })
    );
  });

  it('updates and merges physical device records', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'target' }),
    });
    const service = new ApiDeviceInventoryService('http://localhost:5255/', () => ({}));

    await service.mergeDevice('source', 'target');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5255/api/administration/devices/source/merge',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ targetDeviceId: 'target' }),
      })
    );
  });
});
