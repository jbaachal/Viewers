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
};

export type StorageHealth = {
  usedTerabytes: number;
  totalTerabytes: number;
  remainingTerabytes: number;
  usedPercent: number;
  estimatedExhaustionDate: string | null;
};

export type SystemHealthSnapshot = {
  overallState: HealthState;
  availabilityPercent: number;
  availabilityWindow: string;
  storage: StorageHealth | null;
  lastSuccessfulBackupAt: string | null;
  failedDicomAssociations24Hours: number | null;
  offlineModalityCount: number | null;
  components: SystemHealthComponent[];
  generatedAt: string;
  dataSource: 'MOCK' | 'LIVE';
};
