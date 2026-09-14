import type {
  DicomDevice,
  DicomDeviceNotification,
  UpdateDicomDevice,
  UpdateDicomEndpoint,
  DeviceCatalogValue,
  DeviceCatalogCategory,
  StudySourceDevice,
} from '../models';

export interface DeviceInventoryService {
  getDevices(): Promise<DicomDevice[]>;
  getNotifications(): Promise<DicomDeviceNotification[]>;
  updateDevice(id: string, input: UpdateDicomDevice): Promise<DicomDevice>;
  updateEndpoint(
    deviceId: string,
    endpointId: string,
    input: UpdateDicomEndpoint
  ): Promise<DicomDevice>;
  mergeDevice(sourceId: string, targetDeviceId: string): Promise<DicomDevice>;
  getCatalogValues(): Promise<DeviceCatalogValue[]>;
  createCatalogValue(input: { category: DeviceCatalogCategory; value: string; isActive: boolean; sortOrder: number }): Promise<DeviceCatalogValue>;
  updateCatalogValue(id: string, input: { category: DeviceCatalogCategory; value: string; isActive: boolean; sortOrder: number }): Promise<DeviceCatalogValue>;
  deactivateCatalogValue(id: string): Promise<void>;
  getStudySource(studyInstanceUid: string): Promise<StudySourceDevice>;
}
