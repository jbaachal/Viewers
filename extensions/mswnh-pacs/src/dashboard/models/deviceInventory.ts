export type DicomDeviceEndpoint = {
  id: string;
  aeTitle: string | null;
  sourceIp: string | null;
  dicomHost: string | null;
  dicomPort: number | null;
  useTls: boolean;
  cEchoEnabled: boolean;
  firstObservedAt: string;
  lastObservedAt: string;
  firstSuccessfulStoreAt: string | null;
  lastSuccessfulStoreAt: string | null;
  lastFailedTransferAt: string | null;
  lastEventType: string;
  lastFailureStatus: string | null;
};

export type DicomDevice = {
  id: string;
  name: string;
  modality: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  department: string | null;
  needsReview: boolean;
  isActive: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  endpoints: DicomDeviceEndpoint[];
};

export type DicomDeviceNotification = {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  occurredAt: string;
  deviceId: string;
};

export type UpdateDicomDevice = Pick<
  DicomDevice,
  | 'name'
  | 'modality'
  | 'manufacturer'
  | 'model'
  | 'serialNumber'
  | 'location'
  | 'department'
  | 'isActive'
> & { markReviewed: boolean };

export type UpdateDicomEndpoint = Pick<
  DicomDeviceEndpoint,
  'dicomHost' | 'dicomPort' | 'useTls' | 'cEchoEnabled'
>;

export type DeviceCatalogCategory = 'MODALITY' | 'DEPARTMENT' | 'MANUFACTURER';

export type DeviceCatalogValue = {
  id: string;
  category: DeviceCatalogCategory;
  value: string;
  isActive: boolean;
  sortOrder: number;
};

export type StudySourceDevice = {
  aeTitle: string;
  deviceId: string | null;
  deviceName: string | null;
  location: string | null;
  department: string | null;
  modality: string | null;
  manufacturer: string | null;
  registered: boolean;
};
