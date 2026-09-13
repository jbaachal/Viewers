export type StudyPriority = 'EMERGENCY' | 'URGENT' | 'ROUTINE';

export type StudyStatus =
  | 'RECEIVED'
  | 'ASSIGNED'
  | 'IN_REVIEW'
  | 'REPORTED'
  | 'VERIFIED'
  | 'CANCELLED'
  | 'INCOMPLETE';

export type Modality = 'CT' | 'US' | 'CR' | 'DR' | 'MR';

export type TransmissionStatus = 'COMPLETE' | 'INCOMPLETE';

export type PatientSex = 'F' | 'M' | 'O' | 'U';

export type Patient = {
  id: string;
  mrn: string;
  name: string;
  dateOfBirth: string;
  sex: PatientSex;
};

export type Radiologist = {
  id: string;
  name: string;
  role: 'RADIOLOGIST' | 'RADIOLOGY_RESIDENT';
  initials: string;
};

export type StudyNote = {
  id: string;
  studyId: string;
  type: 'GENERAL' | 'CLINICAL' | 'RADIOLOGY' | 'TECHNICAL' | 'URGENT';
  text: string;
  popupOnOpen: boolean;
  createdBy: string;
  createdAt: string;
};

export type WorkflowEventType =
  | 'STUDY_RECEIVED'
  | 'STUDY_ASSIGNED'
  | 'STUDY_OPENED'
  | 'NOTE_ADDED'
  | 'REPORT_COMPLETED'
  | 'REPORT_VERIFIED'
  | 'PRIORITY_CHANGED'
  | 'STATUS_CHANGED';

export type WorkflowEvent = {
  id: string;
  studyId: string;
  type: WorkflowEventType;
  description: string;
  actor: string;
  occurredAt: string;
};

export type PreviousExamination = {
  id: string;
  examination: string;
  modality: Modality;
  performedAt: string;
  reportSummary: string;
};

export type Study = {
  id: string;
  studyInstanceUid: string;
  accessionNumber: string | null;
  patient: Patient;
  examination: string;
  modality: Modality;
  location: string;
  department: string;
  clinicalHistory: string;
  referringClinician: string;
  priority: StudyPriority;
  status: StudyStatus;
  transmissionStatus: TransmissionStatus;
  assignedRadiologistId: string | null;
  assignedRadiologistName?: string | null;
  assignedAt: string | null;
  reservedByRadiologistId: string | null;
  reservedByRadiologistName?: string | null;
  reservationExpiresAt: string | null;
  firstOpenedAt: string | null;
  reportingStartedAt: string | null;
  archiveStudyAvailable: boolean;
  scheduledAt: string;
  studyAt: string;
  receivedAt: string;
  reportDueAt: string | null;
  reportedAt: string | null;
  verifiedAt: string | null;
  seriesCount: number;
  imageCount: number;
  notes: StudyNote[];
  noteCount?: number;
  hasPopupNote?: boolean;
  previousExaminations: PreviousExamination[];
  workflowHistory: WorkflowEvent[];
  version?: string;
};

export type StudyQuickFilter =
  | 'EMERGENCY'
  | 'URGENT'
  | 'UNREAD'
  | 'ASSIGNED_TO_ME'
  | 'UNASSIGNED'
  | 'RESERVED_BY_ME'
  | 'IN_REVIEW'
  | 'AWAITING_VERIFICATION'
  | 'OVERDUE'
  | 'CT'
  | 'ULTRASOUND'
  | 'TODAY';

export type StudySortField = 'priority' | 'receivedAt' | 'patientName' | 'examination' | 'status';

export type StudyQuery = {
  search?: string;
  priorities?: StudyPriority[];
  statuses?: StudyStatus[];
  modalities?: Modality[];
  dateFrom?: string;
  dateTo?: string;
  assignedToMe?: boolean;
  quickFilters?: StudyQuickFilter[];
  sortBy?: StudySortField;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

export type StudyQueryResult = {
  studies: Study[];
  total: number;
  page: number;
  pageSize: number;
};

export type StudyAction =
  | 'ASSIGN_TO_ME'
  | 'RESERVE'
  | 'RELEASE_RESERVATION'
  | 'OPEN_STUDY'
  | 'START_REPORTING'
  | 'MARK_REPORTED'
  | 'MARK_VERIFIED'
  | 'CHANGE_PRIORITY';
