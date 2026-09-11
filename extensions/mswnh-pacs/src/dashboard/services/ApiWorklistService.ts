import type {
  Modality,
  DashboardAlert,
  PreviousExamination,
  Study,
  StudyNote,
  StudyPriority,
  StudyQuery,
  StudyQueryResult,
  StudyStatus,
  WorkflowEvent,
} from '../models';
import type { AddStudyNoteInput, WorklistService } from './WorklistService';

type AuthorizationHeaders = () => Record<string, string>;

type ApiStudy = {
  studyInstanceUid: string;
  accessionNumber: string | null;
  patientId: string;
  patientName: string;
  patientBirthDate: string | null;
  patientSex: string | null;
  modality: string;
  procedureName: string;
  patientLocation: string | null;
  clinicalHistory: string | null;
  referringPhysician: string | null;
  studyAt: string | null;
  archiveReceivedAt: string;
  slaDueAt: string | null;
  seriesCount: number | null;
  instanceCount: number | null;
  priority: string;
  status: string;
  assignedRadiologistId: string | null;
  assignedRadiologistName: string | null;
  assignedAt: string | null;
  reservationOwnerId: string | null;
  reservationExpiresAt: string | null;
  firstOpenedAt: string | null;
  reportingStartedAt: string | null;
  reportedAt: string | null;
  verifiedAt: string | null;
  noteCount: number;
  hasPopupNote: boolean;
  version: string;
};

type ApiNote = {
  id: string;
  studyInstanceUid: string;
  noteType: StudyNote['type'];
  noteText: string;
  popupOnOpen: boolean;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
};

type ApiHistory = {
  id: number;
  action: string;
  actorName: string | null;
  actorId: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  occurredAt: string;
};

type ApiPreviousExamination = {
  studyInstanceUid: string;
  procedureName: string;
  modality: string;
  studyAt: string | null;
  status: string;
  reportedAt: string | null;
};

type ApiStudyDetails = {
  study: ApiStudy;
  notes: ApiNote[];
  workflowHistory: ApiHistory[];
};

type ApiPage = { studies: ApiStudy[]; total: number; page: number; pageSize: number };

type ApiAlert = {
  id: string;
  studyInstanceUid: string;
  severity: 'Critical' | 'Warning';
  title: string;
  message: string;
  dueAt: string;
};

const statuses: Record<string, StudyStatus> = {
  RECEIVED: 'RECEIVED',
  ASSIGNED: 'ASSIGNED',
  INREVIEW: 'IN_REVIEW',
  REPORTED: 'REPORTED',
  VERIFIED: 'VERIFIED',
  CANCELLED: 'CANCELLED',
  INCOMPLETE: 'INCOMPLETE',
};

const priorities: Record<string, StudyPriority> = {
  EMERGENCY: 'EMERGENCY',
  URGENT: 'URGENT',
  ROUTINE: 'ROUTINE',
};

function normalized(value: string): string {
  return value.replaceAll('_', '').toUpperCase();
}

function apiStatus(value: StudyStatus): string {
  return value === 'IN_REVIEW' ? 'InReview' : value[0] + value.slice(1).toLowerCase();
}

function apiPriority(value: StudyPriority): string {
  return value[0] + value.slice(1).toLowerCase();
}

function mapNote(note: ApiNote): StudyNote {
  return {
    id: note.id,
    studyId: note.studyInstanceUid,
    type: note.noteType,
    text: note.noteText,
    popupOnOpen: note.popupOnOpen,
    createdBy: note.createdByName || note.createdBy,
    createdAt: note.createdAt,
  };
}

function mapHistory(item: ApiHistory, studyId: string): WorkflowEvent {
  const type =
    (
      {
        STUDY_RECEIVED: 'STUDY_RECEIVED',
        STUDY_ASSIGNED: 'STUDY_ASSIGNED',
        STUDY_CLAIMED: 'STUDY_ASSIGNED',
        STUDY_VIEWED: 'STUDY_OPENED',
        REPORT_COMPLETED: 'REPORT_COMPLETED',
        REPORT_VERIFIED: 'REPORT_VERIFIED',
        PRIORITY_CHANGED: 'PRIORITY_CHANGED',
      } as const
    )[item.action] || 'STATUS_CHANGED';
  const transition = item.oldValue && item.newValue ? ` (${item.oldValue} → ${item.newValue})` : '';
  return {
    id: String(item.id),
    studyId,
    type,
    description: `${item.action.replaceAll('_', ' ').toLocaleLowerCase()}${transition}${item.reason ? `: ${item.reason}` : ''}`,
    actor: item.actorName || item.actorId,
    occurredAt: item.occurredAt,
  };
}

function mapPrevious(item: ApiPreviousExamination): PreviousExamination {
  return {
    id: item.studyInstanceUid,
    examination: item.procedureName,
    modality: item.modality.toUpperCase() as Modality,
    performedAt: item.studyAt || item.reportedAt || new Date(0).toISOString(),
    reportSummary: `Workflow status: ${item.status}`,
  };
}

function mapStudy(
  item: ApiStudy,
  existing?: Study,
  notes = existing?.notes ?? [],
  previousExaminations = existing?.previousExaminations ?? [],
  workflowHistory = existing?.workflowHistory ?? []
): Study {
  const studyAt = item.studyAt || item.archiveReceivedAt;
  return {
    id: item.studyInstanceUid,
    studyInstanceUid: item.studyInstanceUid,
    accessionNumber: item.accessionNumber,
    patient: {
      id: item.patientId,
      mrn: item.patientId,
      name: item.patientName,
      dateOfBirth: item.patientBirthDate || '',
      sex: (item.patientSex?.toUpperCase() || 'U') as Study['patient']['sex'],
    },
    examination: item.procedureName,
    modality: item.modality.toUpperCase() as Modality,
    location: item.patientLocation || 'Not supplied',
    department: '',
    clinicalHistory: item.clinicalHistory || 'No clinical history supplied.',
    referringClinician: item.referringPhysician || 'Not supplied',
    priority: priorities[normalized(item.priority)] || 'ROUTINE',
    status: statuses[normalized(item.status)] || 'RECEIVED',
    transmissionStatus: 'COMPLETE',
    assignedRadiologistId: item.assignedRadiologistId,
    assignedRadiologistName: item.assignedRadiologistName,
    assignedAt: item.assignedAt,
    reservedByRadiologistId: item.reservationOwnerId,
    reservationExpiresAt: item.reservationExpiresAt,
    firstOpenedAt: item.firstOpenedAt,
    reportingStartedAt: item.reportingStartedAt,
    archiveStudyAvailable: true,
    scheduledAt: studyAt,
    studyAt,
    receivedAt: item.archiveReceivedAt,
    reportDueAt: item.slaDueAt,
    reportedAt: item.reportedAt,
    verifiedAt: item.verifiedAt,
    seriesCount: item.seriesCount ?? 0,
    imageCount: item.instanceCount ?? 0,
    notes,
    noteCount: item.noteCount,
    hasPopupNote: item.hasPopupNote,
    previousExaminations,
    workflowHistory,
    version: item.version,
  };
}

export class ApiWorklistService implements WorklistService {
  private readonly studies = new Map<string, Study>();
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly baseUrl: string,
    private readonly getAuthorizationHeaders: AuthorizationHeaders,
    private readonly handleUnauthenticated?: () => void
  ) {}

  async queryStudies(query: StudyQuery = {}): Promise<StudyQueryResult> {
    const parameters = this.toQueryParameters(query);
    const page = await this.request<ApiPage>(`/api/worklist?${parameters}`);
    const studies = page.studies.map(item => {
      const study = mapStudy(item, this.studies.get(item.studyInstanceUid));
      this.studies.set(study.id, study);
      return study;
    });
    return { ...page, studies };
  }

  async getAlerts(): Promise<DashboardAlert[]> {
    const alerts = await this.request<ApiAlert[]>('/api/worklist/alerts');
    return alerts.map(alert => ({
      id: alert.id,
      severity: alert.severity === 'Critical' ? 'CRITICAL' : 'WARNING',
      title: alert.title,
      message: alert.message,
      occurredAt: alert.dueAt,
      acknowledged: false,
      studyId: alert.studyInstanceUid,
    }));
  }

  async searchStudies(search: string, limit = 8): Promise<Study[]> {
    return (await this.queryStudies({ search, pageSize: limit })).studies;
  }

  async getStudy(studyId: string): Promise<Study | null> {
    try {
      const details = await this.request<ApiStudyDetails>(
        `/api/worklist/${encodeURIComponent(studyId)}`
      );
      const previous = await this.request<ApiPreviousExamination[]>(
        `/api/worklist/${encodeURIComponent(studyId)}/previous-examinations`
      );
      const study = mapStudy(
        details.study,
        this.studies.get(studyId),
        details.notes.map(mapNote),
        previous.map(mapPrevious),
        details.workflowHistory.map(item => mapHistory(item, studyId))
      );
      this.studies.set(study.id, study);
      return study;
    } catch (error) {
      if (error instanceof WorkflowApiError && error.status === 404) return null;
      throw error;
    }
  }

  assignToMe(studyId: string) {
    return this.mutate(studyId, 'POST', 'claim');
  }

  reserve(studyId: string) {
    return this.mutate(studyId, 'POST', 'reservation');
  }

  releaseReservation(studyId: string) {
    return this.mutate(studyId, 'DELETE', 'reservation');
  }

  openStudy(studyId: string) {
    return this.mutate(studyId, 'POST', 'opened');
  }

  startReporting(studyId: string) {
    return this.mutate(studyId, 'POST', 'start-reporting');
  }

  markReported(studyId: string) {
    return this.mutate(studyId, 'POST', 'reported');
  }

  markVerified(studyId: string) {
    return this.mutate(studyId, 'POST', 'verify');
  }

  async changePriority(studyId: string, priority: StudyPriority, reason?: string) {
    return this.mutate(studyId, 'POST', 'priority', { priority: apiPriority(priority), reason });
  }

  async addStudyNote(studyId: string, input: AddStudyNoteInput): Promise<StudyNote> {
    const note = await this.request<ApiNote>(`/api/studies/${encodeURIComponent(studyId)}/notes`, {
      method: 'POST',
      body: JSON.stringify({
        noteType: input.type,
        noteText: input.text,
        popupOnOpen: input.popupOnOpen,
      }),
    });
    this.notify();
    return mapNote(note);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async mutate(
    studyId: string,
    method: 'POST' | 'DELETE',
    action: string,
    body: Record<string, unknown> = {}
  ): Promise<Study> {
    let study = this.studies.get(studyId);
    if (!study?.version) study = (await this.getStudy(studyId)) || undefined;
    if (!study?.version) throw new Error('Reload the study before retrying this action.');
    const encoded = encodeURIComponent(studyId);
    if (method === 'DELETE') {
      await this.request<ApiStudy>(`/api/worklist/${encoded}/${action}?version=${study.version}`, {
        method,
      });
    } else {
      await this.request<ApiStudy>(`/api/worklist/${encoded}/${action}`, {
        method,
        body: JSON.stringify({ ...body, version: study.version }),
      });
    }
    const updated = await this.getStudy(studyId);
    if (!updated) throw new Error('The updated study could not be reloaded.');
    this.notify();
    return updated;
  }

  private toQueryParameters(query: StudyQuery): URLSearchParams {
    const parameters = new URLSearchParams({
      page: String(query.page ?? 1),
      pageSize: String(query.pageSize ?? 20),
      sortBy: query.sortBy === 'examination' ? 'procedureName' : query.sortBy || 'priority',
      sortDirection: query.sortDirection || 'asc',
    });
    if (query.search) parameters.set('search', query.search);
    const quick = new Set(query.quickFilters || []);
    const prioritiesToUse = [...(query.priorities || [])];
    if (quick.has('EMERGENCY')) prioritiesToUse.push('EMERGENCY');
    if (quick.has('URGENT')) prioritiesToUse.push('URGENT');
    [...new Set(prioritiesToUse)].forEach(value =>
      parameters.append('priority', apiPriority(value))
    );
    const statusesToUse = [...(query.statuses || [])];
    if (quick.has('UNREAD')) statusesToUse.push('RECEIVED', 'ASSIGNED', 'IN_REVIEW');
    if (quick.has('IN_REVIEW')) statusesToUse.push('IN_REVIEW');
    if (quick.has('AWAITING_VERIFICATION')) statusesToUse.push('REPORTED');
    [...new Set(statusesToUse)].forEach(value => parameters.append('status', apiStatus(value)));
    const modalities = [...(query.modalities || [])];
    if (quick.has('CT')) modalities.push('CT');
    if (quick.has('ULTRASOUND')) modalities.push('US');
    [...new Set(modalities)].forEach(value => parameters.append('modality', value));
    if (query.assignedToMe || quick.has('ASSIGNED_TO_ME')) parameters.set('assignedToMe', 'true');
    if (quick.has('UNASSIGNED')) parameters.set('unassigned', 'true');
    if (quick.has('RESERVED_BY_ME')) parameters.set('reservedByMe', 'true');
    if (quick.has('OVERDUE')) parameters.set('overdue', 'true');
    let receivedFrom = query.dateFrom;
    let receivedTo = query.dateTo;
    if (quick.has('TODAY')) {
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Kampala',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      receivedFrom = new Date(`${today}T00:00:00+03:00`).toISOString();
      receivedTo = new Date(`${today}T23:59:59+03:00`).toISOString();
    }
    if (receivedFrom) parameters.set('receivedFrom', receivedFrom);
    if (receivedTo) parameters.set('receivedTo', receivedTo);
    return parameters;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...this.getAuthorizationHeaders(),
        ...init.headers,
      },
    });
    if (response.status === 401) this.handleUnauthenticated?.();
    if (!response.ok) {
      const problem = await response.json().catch(() => ({}));
      throw new WorkflowApiError(
        response.status,
        problem.detail || problem.title || `Workflow API request failed (${response.status}).`
      );
    }
    return response.json() as Promise<T>;
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }
}

export class WorkflowApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'WorkflowApiError';
  }
}
