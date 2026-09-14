import type {
  DicomDevice,
  DicomDeviceNotification,
  UpdateDicomDevice,
  UpdateDicomEndpoint,
  DeviceCatalogValue,
  DeviceCatalogCategory,
  StudySourceDevice,
} from '../models';
import type { DeviceInventoryService } from './DeviceInventoryService';

export class ApiDeviceInventoryService implements DeviceInventoryService {
  constructor(
    private readonly baseUrl: string,
    private readonly getAuthorizationHeaders: () => Record<string, string>,
    private readonly handleUnauthenticated?: () => void
  ) {}

  getDevices() {
    return this.request<DicomDevice[]>('');
  }

  getNotifications() {
    return this.request<DicomDeviceNotification[]>('/notifications');
  }

  updateDevice(id: string, input: UpdateDicomDevice) {
    return this.request<DicomDevice>(`/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  updateEndpoint(deviceId: string, endpointId: string, input: UpdateDicomEndpoint) {
    return this.request<DicomDevice>(
      `/${encodeURIComponent(deviceId)}/endpoints/${encodeURIComponent(endpointId)}`,
      { method: 'PUT', body: JSON.stringify(input) }
    );
  }

  mergeDevice(sourceId: string, targetDeviceId: string) {
    return this.request<DicomDevice>(`/${encodeURIComponent(sourceId)}/merge`, {
      method: 'POST',
      body: JSON.stringify({ targetDeviceId }),
    });
  }

  getCatalogValues() {
    return this.request<DeviceCatalogValue[]>('/catalog-values');
  }

  createCatalogValue(input: { category: DeviceCatalogCategory; value: string; isActive: boolean; sortOrder: number }) {
    return this.request<DeviceCatalogValue>('/catalog-values', {
      method: 'POST', body: JSON.stringify(input),
    });
  }

  updateCatalogValue(id: string, input: { category: DeviceCatalogCategory; value: string; isActive: boolean; sortOrder: number }) {
    return this.request<DeviceCatalogValue>(`/catalog-values/${encodeURIComponent(id)}`, {
      method: 'PUT', body: JSON.stringify(input),
    });
  }

  async deactivateCatalogValue(id: string) {
    await this.request<void>(`/catalog-values/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  getStudySource(studyInstanceUid: string) {
    return this.request<StudySourceDevice>(`/study-source/${encodeURIComponent(studyInstanceUid)}`);
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(
      `${this.baseUrl.replace(/\/$/, '')}/api/administration/devices${path}`,
      {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...this.getAuthorizationHeaders(),
          ...init.headers,
        },
      }
    );
    if (response.status === 401) this.handleUnauthenticated?.();
    if (!response.ok) {
      const problem = await response.json().catch(() => ({}));
      throw new Error(
        problem.detail || problem.title || `Device inventory request failed (${response.status}).`
      );
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
}
