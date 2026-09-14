export type HealthState =
  | 'HEALTHY'
  | 'WARNING'
  | 'CRITICAL'
  | 'OFFLINE'
  | 'UNKNOWN'
  | 'NOT_CONFIGURED';

export type SystemComponentKind =
  | 'ARCHIVE'
  | 'VIEWER'
  | 'API'
  | 'DATABASE'
  | 'IDENTITY'
  | 'DIRECTORY'
  | 'PROXY'
  | 'MODALITY'
  | 'DICOM_ASSOCIATIONS'
  | 'DICOM_WORKLIST'
  | 'HL7'
  | 'BACKUP'
  | 'STORAGE';

export type SystemHealthComponent = {
  id: string;
  name: string;
  kind: SystemComponentKind;
  state: HealthState;
  lastCheckedAt: string;
  responseTimeMs: number | null;
  message: string;
  lastStudyReceivedAt?: string | null;
  failedAssociations?: DicomAssociationFailure[] | null;
};

export type DicomAssociationFailure = {
  occurredAt: string;
  failureType: string;
  callingAeTitle: string | null;
  calledAeTitle: string | null;
  sourceIp: string | null;
  associationId: string | null;
  detail: string;
};

export type StorageDiskHealth = {
  id: string;
  name: string;
  mountPath: string;
  usedTerabytes: number;
  totalTerabytes: number;
  remainingTerabytes: number;
  usedPercent: number;
  state: HealthState;
};

export type StorageHealth = {
  usedTerabytes: number;
  totalTerabytes: number;
  remainingTerabytes: number;
  usedPercent: number;
  estimatedExhaustionDate: string | null;
  disks: StorageDiskHealth[];
};

export type DicomAeTitleHealth = {
  id: string;
  aeTitle: string;
  callingAeTitle: string;
  host: string;
  port: number;
  useTls: boolean;
  enabled: boolean;
  state: HealthState;
  lastCheckedAt: string;
  responseTimeMs: number | null;
  message: string;
};

export type DicomDeviceHealth = {
  id: string;
  name: string;
  modalities: string[];
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  department: string | null;
  state: HealthState;
  lastCheckedAt: string;
  responseTimeMs: number | null;
  message: string;
  lastStudyReceivedAt: string | null;
  aeTitles: DicomAeTitleHealth[];
};

export type SystemHealthSnapshot = {
  overallState: HealthState;
  availabilityPercent: number;
  availabilityWindow: string;
  storage: StorageHealth | null;
  lastSuccessfulBackupAt: string | null;
  failedDicomAssociations24Hours: number | null;
  offlineModalityCount: number | null;
  devices: DicomDeviceHealth[];
  components: SystemHealthComponent[];
  generatedAt: string;
  dataSource: 'MOCK' | 'LIVE';
};
