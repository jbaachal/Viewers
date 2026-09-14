import type {
  DicomDevice,
  DicomDeviceNotification,
  UpdateDicomDevice,
  UpdateDicomEndpoint,
} from '../models';
import type { DeviceInventoryService } from './DeviceInventoryService';

export class MockDeviceInventoryService implements DeviceInventoryService {
  private devices: DicomDevice[] = [];
  async getDevices() {
    return this.devices.map(device => ({ ...device, endpoints: [...device.endpoints] }));
  }
  async getNotifications(): Promise<DicomDeviceNotification[]> {
    return [];
  }
  async updateDevice(id: string, input: UpdateDicomDevice) {
    const device = this.find(id);
    Object.assign(device, input, {
      needsReview: !input.markReviewed,
      updatedAt: new Date().toISOString(),
    });
    return device;
  }
  async updateEndpoint(deviceId: string, endpointId: string, input: UpdateDicomEndpoint) {
    const device = this.find(deviceId);
    const endpoint = device.endpoints.find(value => value.id === endpointId);
    if (!endpoint) throw new Error('The DICOM endpoint was not found.');
    Object.assign(endpoint, input);
    return device;
  }
  async mergeDevice(sourceId: string, targetDeviceId: string) {
    const source = this.find(sourceId);
    const target = this.find(targetDeviceId);
    target.endpoints.push(...source.endpoints);
    target.needsReview = true;
    this.devices = this.devices.filter(value => value.id !== sourceId);
    return target;
  }
  private find(id: string) {
    const device = this.devices.find(value => value.id === id);
    if (!device) throw new Error('The DICOM device was not found.');
    return device;
  }

  async getCatalogValues() { return []; }
  async createCatalogValue(input: any) { return { id: crypto.randomUUID(), ...input }; }
  async updateCatalogValue(id: string, input: any) { return { id, ...input }; }
  async deactivateCatalogValue() {}
  async getStudySource() { throw new Error('No source device is available in demo mode.'); }
}
